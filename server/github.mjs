// Сбор доказательств из публичного GitHub-репозитория для SkillProof.
// Без токена GitHub даёт 60 запросов в час на IP; с GITHUB_TOKEN — 5000.
import { HttpError } from "./groq.mjs";

const REPO_RE = /^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]{1,100})(?:[/#?].*)?$/;
const SKIP_DIR = /(^|\/)(node_modules|dist|build|out|vendor|\.next|\.git|__pycache__|venv|\.venv|coverage|target|bin|obj|Pods)\//;
const SKIP_FILE = /(\.min\.(js|css)$|\.lock$|package-lock\.json$|yarn\.lock$|pnpm-lock\.yaml$|\.(png|jpe?g|gif|svg|ico|webp|mp4|mp3|wav|pdf|zip|ttf|woff2?|eot|otf|ds_store)$)/i;
const CODE_EXT = /\.(js|jsx|ts|tsx|mjs|vue|svelte|py|ipynb|java|kt|swift|go|rs|cs|cpp|c|h|rb|php|dart|lua|gd|html|css|scss|sql|r)$/i;
const MAIN_NAME = /(^|\/)(main|app|index|server|bot|game|model|train|App|api)\.[a-z]+$/;

export function parseRepo(url) {
  const m = REPO_RE.exec(String(url || "").trim());
  if (!m) throw new HttpError(400, "Нужна ссылка вида https://github.com/user/repo");
  return { owner: m[1], repo: m[2].replace(/\.git$/, "") };
}

async function gh(path) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "verix-skillproof" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  let res;
  try {
    res = await fetch("https://api.github.com" + path, { headers, signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new HttpError(503, "Нет связи с GitHub. Попробуй позже.");
  }
  if (res.status === 404) throw new HttpError(404, "Репозиторий не найден или он закрытый");
  if (res.status === 403 || res.status === 429) throw new HttpError(429, "GitHub временно ограничил запросы. Попробуй через час или без ссылки.");
  if (!res.ok) throw new HttpError(502, "GitHub не ответил");
  return { data: await res.json(), link: res.headers.get("link") || "" };
}

async function raw(owner, repo, branch, path, max) {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/${path.split("/").map(encodeURIComponent).join("/")}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return "";
    return (await res.text()).slice(0, max);
  } catch { return ""; }
}

function pickCode(files) {
  return files
    .filter((f) => CODE_EXT.test(f.path) && f.size > 200 && f.size < 60_000)
    .map((f) => ({ ...f, rank: (MAIN_NAME.test(f.path) ? 0 : 10) + f.path.split("/").length * 2 + (/test|spec|config|setup/i.test(f.path) ? 8 : 0) }))
    .sort((a, b) => a.rank - b.rank || b.size - a.size)
    .slice(0, 2);
}

const TEST_RE = /(^|\/)(tests?|__tests__|spec)\/|(\.|_)(test|spec)\.[a-z]+$|(^|\/)test_[^/]+\.py$/i;
const CI_RE = /^\.github\/workflows\/|^\.gitlab-ci\.yml$|^\.circleci\//;

// Кэш собранных данных: повторная проверка того же репозитория не тратит лимит GitHub API.
const CACHE_TTL = 30 * 60_000;
const cache = new Map();

// Возвращает { prompt: текст для модели, meta: краткие факты для интерфейса }
export async function repoEvidence(url) {
  const { owner, repo } = parseRepo(url);
  const key = `${owner}/${repo}`.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.value;
  const value = await collect(owner, repo);
  if (cache.size > 300) cache.clear();
  cache.set(key, { at: Date.now(), value });
  return value;
}

async function collect(owner, repo) {
  const base = `/repos/${owner}/${repo}`;
  const { data: info } = await gh(base);
  const branch = info.default_branch || "main";

  const [langs, tree, commits] = await Promise.all([
    gh(`${base}/languages`).then((r) => r.data).catch(() => ({})),
    gh(`${base}/git/trees/${encodeURIComponent(branch)}?recursive=1`).then((r) => r.data).catch(() => ({ tree: [] })),
    gh(`${base}/commits?per_page=30`).catch(() => ({ data: [], link: "" })),
  ]);

  const files = (tree.tree || [])
    .filter((t) => t.type === "blob" && !SKIP_DIR.test(t.path) && !SKIP_FILE.test(t.path))
    .map((t) => ({ path: t.path, size: t.size || 0 }));
  if (!files.length && info.size === 0) throw new HttpError(400, "Репозиторий пустой");

  const allPaths = (tree.tree || []).map((t) => t.path);
  const testFiles = files.filter((f) => TEST_RE.test(f.path)).length;
  const hasCI = allPaths.some((p) => CI_RE.test(p));

  const readmeFile = files.find((f) => /^readme(\.(md|rst|txt))?$/i.test(f.path));
  const code = pickCode(files);
  const [readme, ...codeTexts] = await Promise.all([
    readmeFile ? raw(owner, repo, branch, readmeFile.path, 2500) : Promise.resolve(""),
    ...code.map((f) => raw(owner, repo, branch, f.path, 2500)),
  ]);

  const commitList = Array.isArray(commits.data) ? commits.data : [];
  const moreCommits = /rel="next"/.test(commits.link);
  const authors = [...new Set(commitList.map((c) => c.author?.login || c.commit?.author?.name).filter(Boolean))];
  const dates = commitList.map((c) => c.commit?.author?.date).filter(Boolean).sort();
  const langTotal = Object.values(langs).reduce((a, b) => a + b, 0) || 1;
  const langPct = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([l, b]) => `${l} ${Math.round((b / langTotal) * 100)}%`);

  const meta = {
    full_name: info.full_name,
    url: info.html_url,
    owner: info.owner?.login || owner,
    fork: !!info.fork,
    stars: info.stargazers_count || 0,
    languages: langPct,
    files: files.length,
    commits: commitList.length + (moreCommits ? "+" : ""),
    authors: authors.length,
    first_commit: dates[0] || null,
    last_commit: dates[dates.length - 1] || null,
    test_files: testFiles,
    ci: hasCI,
  };

  const prompt = [
    `Repository: ${info.full_name}${info.fork ? " (FORK of another repository — the student may not be the author of most code)" : ""}`,
    `Description: ${info.description || "—"}`,
    `Languages: ${langPct.join(", ") || "—"}`,
    `Files (without vendor/build): ${files.length}. Commits: ${meta.commits}, authors: ${authors.length}, period: ${meta.first_commit || "?"} … ${meta.last_commit || "?"}`,
    `Automated tests: ${testFiles ? testFiles + " test file(s)" : "none found"}. CI: ${hasCI ? "yes" : "no"}`,
    `Recent commit messages:\n${commitList.slice(0, 12).map((c) => "- " + String(c.commit?.message || "").split("\n")[0].slice(0, 80)).join("\n") || "—"}`,
    `File tree (first 80):\n${files.slice(0, 80).map((f) => f.path).join("\n")}`,
    readme ? `README (truncated):\n${readme}` : "README: none",
    ...code.map((f, i) => `Source file ${f.path} (truncated):\n${codeTexts[i] || "(not loaded)"}`),
  ].join("\n\n");

  return { prompt, meta };
}
