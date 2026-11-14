// Автотесты серверной части: npm test (встроенный node:test, без зависимостей).
import { test } from "node:test";
import assert from "node:assert/strict";
import { HttpError, clamp, str, rateLimit, makeHandler, groqJSON } from "../server/groq.mjs";
import { parseRepo } from "../server/github.mjs";
import { validate, skillproof } from "../server/score.mjs";

test("clamp держит балл в диапазоне 0–100 и округляет", () => {
  assert.equal(clamp(150), 100);
  assert.equal(clamp(-5), 0);
  assert.equal(clamp("72.6"), 73);
  assert.equal(clamp("abc"), 0);
  assert.equal(clamp(30, 1, 24), 24);
});

test("str обрезает строку и убирает пробелы", () => {
  assert.equal(str("  привет  ", 3), "при");
  assert.equal(str(null, 5), "");
});

test("parseRepo принимает только ссылки на GitHub", () => {
  assert.deepEqual(parseRepo("https://github.com/romiisromie/verix"), { owner: "romiisromie", repo: "verix" });
  assert.deepEqual(parseRepo("https://github.com/a-b/c.d.git"), { owner: "a-b", repo: "c.d" });
  assert.deepEqual(parseRepo("https://github.com/user/repo/tree/main/src"), { owner: "user", repo: "repo" });
  for (const bad of ["", "github.com/user/repo", "https://gitlab.com/u/r", "https://github.com/user", "javascript:alert(1)"]) {
    assert.throws(() => parseRepo(bad), HttpError, bad);
  }
});

test("validate отклоняет неизвестный навык, пустой и слишком длинный запрос", () => {
  assert.throws(() => validate(null), /Пустой/);
  assert.throws(() => validate({ skill: "Cobol", description: "x".repeat(50) }), /навык/);
  assert.throws(() => validate({ skill: "Web", description: "коротко" }), /подробнее/);
  assert.throws(() => validate({ skill: "Web", description: "x".repeat(2001) }), /длиннее/);
  assert.deepEqual(validate({ skill: "Web", repo: "https://github.com/u/r" }), { skill: "Web", description: "", repo: "https://github.com/u/r", strict: false });
});

test("rateLimit пропускает лимит запросов и блокирует следующий", () => {
  const key = "t-" + Math.random();
  for (let i = 0; i < 3; i++) rateLimit(key, 3);
  assert.throws(() => rateLimit(key, 3), (e) => e.status === 429);
});

test("makeHandler: только POST, проверка JSON и размера, коды ошибок", async () => {
  const handle = makeHandler(async function echo(body) { return { ok: body.x }; }, { limit: 100, maxBody: 50 });
  const req = (method, body) => new Request("http://x/api", { method, body });
  assert.equal((await handle(req("GET"))).status, 405);
  assert.equal((await handle(req("POST", "{нет"))).status, 400);
  assert.equal((await handle(req("POST", JSON.stringify({ x: "y".repeat(100) })))).status, 413);
  const ok = await handle(req("POST", JSON.stringify({ x: 1 })));
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), { ok: 1 });
});

test("SkillProof без ключа AI отвечает 501, а не падает", async () => {
  const saved = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  await assert.rejects(skillproof({ skill: "Web", description: "Сайт-визитка на HTML и CSS с адаптивной вёрсткой" }), (e) => e.status === 501);
  if (saved) process.env.GROQ_API_KEY = saved;
});

test("SkillProof зажимает баллы модели и подменяет неизвестный уровень", async () => {
  const saved = { key: process.env.GROQ_API_KEY, fetch: globalThis.fetch };
  process.env.GROQ_API_KEY = "test";
  globalThis.fetch = async () => new Response(JSON.stringify({
    choices: [{ message: { content: JSON.stringify({
      overall_score: 140, originality: -3, complexity: 55.4, level_name: "Гуру",
      code_findings: "Код не проверялся — оценка по описанию.", verdict: "Неплохо. **Добавь тесты.**",
    }) } }],
  }), { status: 200 });
  try {
    const r = await skillproof({ skill: "Python", description: "Телеграм-бот на aiogram с базой SQLite и планировщиком" });
    assert.equal(r.overall_score, 100);
    assert.equal(r.originality, 0);
    assert.equal(r.complexity, 55);
    assert.equal(r.level_name, "Средний");
    assert.equal(r.repo, null);
  } finally {
    process.env.GROQ_API_KEY = saved.key ?? "";
    if (!saved.key) delete process.env.GROQ_API_KEY;
    globalThis.fetch = saved.fetch;
  }
});

test("groqJSON переводит ошибки Groq в понятные коды", async () => {
  const saved = { key: process.env.GROQ_API_KEY, fetch: globalThis.fetch };
  process.env.GROQ_API_KEY = "test";
  try {
    for (const [status, expected] of [[429, 429], [401, 502], [500, 502]]) {
      globalThis.fetch = async () => new Response("err", { status });
      await assert.rejects(groqJSON({ system: "s", user: "u", schema: {}, name: "n", strict: true }), (e) => e.status === expected);
    }
    globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: "не json" } }] }), { status: 200 });
    await assert.rejects(groqJSON({ system: "s", user: "u", schema: {}, name: "n" }), /неверный ответ/);
  } finally {
    if (saved.key) process.env.GROQ_API_KEY = saved.key; else delete process.env.GROQ_API_KEY;
    globalThis.fetch = saved.fetch;
  }
});

test("при лимите основной модели SkillProof переключается на запасную, а strict_model — нет", async () => {
  const saved = { key: process.env.GROQ_API_KEY, fetch: globalThis.fetch };
  process.env.GROQ_API_KEY = "test";
  const used = [];
  globalThis.fetch = async (_url, init) => {
    const model = JSON.parse(init.body).model;
    used.push(model);
    if (model === "openai/gpt-oss-120b") return new Response("limit", { status: 429 });
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
      overall_score: 50, originality: 50, complexity: 50, level_name: "Средний", code_findings: "-", verdict: "-",
    }) } }] }), { status: 200 });
  };
  try {
    const body = { skill: "Web", description: "Сайт-визитка на HTML и CSS с адаптивной вёрсткой" };
    const r = await skillproof(body);
    assert.equal(r.model, "openai/gpt-oss-20b");
    assert.deepEqual(used, ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]);
    await assert.rejects(skillproof({ ...body, strict_model: true }), (e) => e.status === 429);
  } finally {
    if (saved.key) process.env.GROQ_API_KEY = saved.key; else delete process.env.GROQ_API_KEY;
    globalThis.fetch = saved.fetch;
  }
});

test("ответ, не прошедший JSON-схему, повторяется один раз", async () => {
  const saved = { key: process.env.GROQ_API_KEY, fetch: globalThis.fetch };
  process.env.GROQ_API_KEY = "test";
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    if (calls === 1) return new Response(JSON.stringify({ error: { code: "json_validate_failed" } }), { status: 400 });
    return new Response(JSON.stringify({ choices: [{ message: { content: "{\"ok\":1}" } }] }), { status: 200 });
  };
  try {
    const r = await groqJSON({ system: "s", user: "u", schema: {}, name: "n", strict: true });
    assert.deepEqual(r.data, { ok: 1 });
    assert.equal(calls, 2);
  } finally {
    if (saved.key) process.env.GROQ_API_KEY = saved.key; else delete process.env.GROQ_API_KEY;
    globalThis.fetch = saved.fetch;
  }
});
