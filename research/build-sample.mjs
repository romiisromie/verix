// Шаг 1 апробации: формирует выборку публичных репозиториев и считает их объективные метрики.
// Выборка стратифицирована заранее заданными поисковыми запросами (без ручного отбора),
// метрики считаются по git-истории (blobless clone), а не по мнению автора.
// Запуск: node research/build-sample.mjs  →  research/data/sample.json
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PER_QUERY = 6; // 2 запроса на страту × 6 = 12 репозиториев в страте
const STRATA = {
  S1: { name: "учебный", queries: [
    "todo in:name fork:false size:5..150 language:JavaScript stars:0",
    "calculator in:name fork:false size:5..150 language:Python stars:0",
  ] },
  S2: { name: "самостоятельный", queries: [
    "fork:false size:300..4000 stars:5..40 language:JavaScript pushed:>2025-06-01",
    "fork:false size:300..4000 stars:5..40 language:Python pushed:>2025-06-01",
  ] },
  S3: { name: "зрелый", queries: [
    "fork:false size:500..25000 stars:1000..15000 language:JavaScript pushed:>2025-06-01",
    "fork:false size:500..25000 stars:1000..15000 language:Python pushed:>2025-06-01",
  ] },
};

const CODE_EXT = /\.(js|jsx|ts|tsx|mjs|vue|svelte|py|java|kt|go|rs|cs|cpp|c|h|rb|php|html|css|scss)$/i;
const SKIP = /(^|\/)(node_modules|dist|build|vendor|\.next|venv|\.venv|coverage)\//;
const TEST_RE = /(^|\/)(tests?|__tests__|spec)\/|(\.|_)(test|spec)\.[a-z]+$|(^|\/)test_[^/]+\.py$/i;
const CI_RE = /^\.github\/workflows\/|^\.gitlab-ci\.yml$|^\.circleci\//;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const git = (args, cwd) => execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });

async function search(q) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=updated&order=desc&per_page=30`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json", "User-Agent": "verix-research" } });
  if (!res.ok) throw new Error(`search ${res.status}: ${await res.text()}`);
  return (await res.json()).items || [];
}

function metrics(fullName) {
  const dir = mkdtempSync(join(tmpdir(), "vx-"));
  try {
    git(["clone", "--quiet", "--bare", "--filter=blob:none", `https://github.com/${fullName}.git`, "r"], dir);
    const cwd = join(dir, "r");
    const files = git(["ls-tree", "-r", "-l", "HEAD"], cwd).trim().split("\n").filter(Boolean).map((line) => {
      const [meta, path] = line.split("\t");
      return { path, size: Number(meta.trim().split(/\s+/)[3]) || 0 };
    });
    const code = files.filter((f) => CODE_EXT.test(f.path) && !SKIP.test(f.path));
    const authors = git(["log", "--format=%ae"], cwd).trim().split("\n").filter(Boolean);
    const dates = git(["log", "--format=%cI"], cwd).trim().split("\n").filter(Boolean);
    return {
      code_files: code.length,
      code_kb: Math.round(code.reduce((a, f) => a + f.size, 0) / 1024),
      commits: authors.length,
      contributors: new Set(authors).size,
      test_files: files.filter((f) => TEST_RE.test(f.path) && !SKIP.test(f.path)).length,
      ci: files.some((f) => CI_RE.test(f.path)),
      active_days: dates.length ? Math.round((Date.parse(dates[0]) - Date.parse(dates[dates.length - 1])) / 864e5) : 0,
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const sample = [];
const seen = new Set();
for (const [id, s] of Object.entries(STRATA)) {
  for (const q of s.queries) {
    const items = await search(q);
    let taken = 0;
    for (const it of items) {
      if (taken >= PER_QUERY) break;
      if (seen.has(it.full_name) || it.archived || it.size === 0) continue;
      process.stdout.write(`${id} ${it.full_name} … `);
      try {
        const m = metrics(it.full_name);
        if (m.code_files === 0) { console.log("нет кода, пропуск"); continue; }
        seen.add(it.full_name);
        sample.push({ stratum: id, stratum_name: s.name, query: q, repo: it.full_name, url: it.html_url, language: it.language, stars: it.stargazers_count, ...m });
        taken++;
        console.log(`${m.code_files} файлов, ${m.commits} коммитов`);
      } catch (e) {
        console.log("ошибка клонирования, пропуск");
      }
    }
    await sleep(7000); // лимит поиска GitHub без токена: 10 запросов в минуту
  }
}

mkdirSync("research/data", { recursive: true });
writeFileSync("research/data/sample.json", JSON.stringify({ created: new Date().toISOString(), per_query: PER_QUERY, strata: STRATA, repos: sample }, null, 2));
console.log(`\nГотово: ${sample.length} репозиториев → research/data/sample.json`);
