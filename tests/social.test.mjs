// Автотесты аккаунтов, рейтинга и чата. База данных (Upstash REST) имитируется в памяти.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-123";
process.env.KV_REST_API_URL = "https://kv.test";
process.env.KV_REST_API_TOKEN = "t";

const { sign, verify, sessionCookie } = await import("../server/session.mjs");
const social = await import("../server/social.mjs");

// ── мини-Redis для тестов ──
let db;
function redis(cmd) {
  const [op, k, ...a] = cmd;
  const get = (t) => db.get(k) ?? (t === "h" ? new Map() : t === "z" ? new Map() : t === "s" ? new Set() : t === "l" ? [] : null);
  switch (op) {
    case "GET": return db.get(k) ?? null;
    case "SET": db.set(k, a[0]); return "OK";
    case "EXISTS": return db.has(k) ? 1 : 0;
    case "INCR": { const v = (+db.get(k) || 0) + 1; db.set(k, String(v)); return v; }
    case "EXPIRE": return 1;
    case "HSET": { const h = get("h"); for (let i = 0; i < a.length; i += 2) h.set(a[i], a[i + 1]); db.set(k, h); return 1; }
    case "HSETNX": { const h = get("h"); if (!h.has(a[0])) h.set(a[0], a[1]); db.set(k, h); return 1; }
    case "HGET": return (db.get(k) || new Map()).get(a[0]) ?? null;
    case "HGETALL": return [...(db.get(k) || new Map())].flat();
    case "ZADD": { const z = get("z"); z.set(a[1], +a[0]); db.set(k, z); return 1; }
    case "ZREM": { (db.get(k) || new Map()).delete(a[0]); return 1; }
    case "ZCARD": return (db.get(k) || new Map()).size;
    case "ZREVRANGE": { const arr = [...(db.get(k) || new Map())].sort((x, y) => y[1] - x[1]).slice(+a[0], +a[1] + 1); return a[2] ? arr.flatMap(([m, s]) => [m, String(s)]) : arr.map(([m]) => m); }
    case "ZREVRANK": { const arr = [...(db.get(k) || new Map())].sort((x, y) => y[1] - x[1]).map(([m]) => m); const i = arr.indexOf(a[0]); return i < 0 ? null : i; }
    case "SADD": { const s = get("s"); s.add(a[0]); db.set(k, s); return 1; }
    case "SISMEMBER": return (db.get(k) || new Set()).has(a[0]) ? 1 : 0;
    case "LPUSH": { const l = get("l"); l.unshift(a[0]); db.set(k, l); return l.length; }
    case "LTRIM": { const l = get("l"); db.set(k, l.slice(+a[0], +a[1] + 1)); return "OK"; }
    case "LRANGE": return (db.get(k) || []).slice(+a[0], +a[1] + 1);
    default: throw new Error("нет команды " + op);
  }
}
let ghContributors = [];
globalThis.fetch = async (url, init = {}) => {
  url = String(url);
  if (url.startsWith("https://kv.test")) {
    const body = JSON.parse(init.body);
    if (url.endsWith("/pipeline")) return Response.json(body.map((c) => ({ result: redis(c) })));
    return Response.json({ result: redis(body) });
  }
  if (url.includes("/contributors")) return Response.json(ghContributors.map((login) => ({ login })));
  throw new Error("неожиданный запрос " + url);
};
beforeEach(() => { db = new Map(); ghContributors = []; });

const as = (uid, login, body, method = "POST") => new Request("https://verix.test/api/x", {
  method,
  headers: { cookie: sessionCookie({ uid, login }).split(";")[0], "content-type": "application/json" },
  body: method === "POST" ? JSON.stringify(body) : undefined,
});
const call = async (fn, req) => { const r = await fn(req); return [r.status, await r.json()]; };

test("сессия: подпись проверяется, подделка и истёкший срок отклоняются", () => {
  const t = sign({ uid: "1", login: "a", exp: Date.now() / 1000 + 60 });
  assert.equal(verify(t).login, "a");
  const [body, sig] = t.split(".");
  const forged = Buffer.from(JSON.stringify({ uid: "2", login: "evil", exp: Date.now() / 1000 + 60 })).toString("base64url");
  assert.equal(verify(`${forged}.${sig}`), null);
  assert.equal(verify(sign({ uid: "1", login: "a", exp: 1 })), null);
  assert.equal(verify("мусор"), null);
  void body;
});

test("профиль: без входа — 401, имя обязательно, теги только из списка, HTML вырезается", async () => {
  const noAuth = new Request("https://verix.test/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
  assert.equal((await social.saveProfile(noAuth)).status, 401);
  const [s1] = await call(social.saveProfile, as("1", "a", { name: "" }));
  assert.equal(s1, 400);
  const [s2, d2] = await call(social.saveProfile, as("1", "a", { name: "<b>Рамина</b>", grade: "11 класс", tags: ["Frontend", "Хакер", "AI/ML"], city: "Алматы" }));
  assert.equal(s2, 200);
  assert.equal(d2.profile.name, "bРамина/b");
  assert.deepEqual(d2.profile.tags, ["Frontend", "AI/ML"]);
});

test("навык в рейтинг — только из своего репозитория (владелец или соавтор)", async () => {
  const result = { scored_by: "code", overall_score: 80, level_name: "Продвинутый" };
  const own = await social.recordProof(as("1", "ramina", {}), { skill: "Web", repo: "https://github.com/Ramina/verix", result });
  assert.deepEqual([own.ownership, own.recorded], ["owner", true]);
  ghContributors = ["rakhat"];
  const co = await social.recordProof(as("2", "rakhat", {}), { skill: "Web", repo: "https://github.com/ramina/verix", result });
  assert.deepEqual([co.ownership, co.recorded], ["contributor", true]);
  const stranger = await social.recordProof(as("3", "someone", {}), { skill: "Web", repo: "https://github.com/facebook/react", result });
  assert.deepEqual([stranger.ownership, stranger.recorded], ["not_yours", false]);
  const byDesc = await social.recordProof(as("1", "ramina", {}), { skill: "Web", repo: "", result: { scored_by: "description" } });
  assert.equal(byDesc, null);
  const [, r] = await call(social.rank, as("3", "someone", null, "GET"));
  assert.deepEqual(r.list.map((x) => x.uid).sort(), ["1", "2"]);
  assert.ok(r.list.every((x) => x.score > 0));
});

test("скор считается по той же формуле, что и в профиле", () => {
  assert.equal(social.computeRep([]), 0);
  // 1 репозиторий, 1 навык 80: 0,4·80 + 0,35·25 + 0,25·round((40+15)/640·100)=0,25·9 → 32+8,75+2,25 = 43
  assert.equal(social.computeRep([{ score: 80, repo: "a" }]), 43);
});

test("скрытый профиль не попадает в рейтинг", async () => {
  await call(social.saveProfile, as("1", "ramina", { name: "Рамина", public: false }));
  await social.recordProof(as("1", "ramina", {}), { skill: "Web", repo: "https://github.com/ramina/x", result: { scored_by: "code", overall_score: 70, level_name: "Средний" } });
  const [, r] = await call(social.rank, as("1", "ramina", null, "GET"));
  assert.equal(r.list.length, 0);
});

test("чат: отправка и чтение, длина, блокировка, отключённые сообщения, лимит частоты", async () => {
  db.set("user:2", new Map([["login", "rakhat"]]));
  db.set("user:1", new Map([["login", "ramina"]]));
  let [s, d] = await call(social.chat, as("1", "ramina", { action: "send", with: "2", text: "Привет! Давай сделаем проект вместе" }));
  assert.equal(s, 200);
  [s, d] = await call(social.chat, as("2", "rakhat", { action: "messages", with: "1" }));
  assert.equal(d.messages[0].text, "Привет! Давай сделаем проект вместе");
  assert.equal(d.messages[0].mine, false);
  [s] = await call(social.chat, as("1", "ramina", { action: "send", with: "2", text: "x".repeat(501) }));
  assert.equal(s, 400);
  [s] = await call(social.chat, as("1", "ramina", { action: "send", with: "1", text: "сам себе" }));
  assert.equal(s, 400);
  [s] = await call(social.chat, as("1", "ramina", { action: "send", with: "999", text: "кто ты" }));
  assert.equal(s, 404);
  // блокировка
  await call(social.chat, as("2", "rakhat", { action: "block", with: "1" }));
  [s] = await call(social.chat, as("1", "ramina", { action: "send", with: "2", text: "ещё раз" }));
  assert.equal(s, 403);
  // отключённые сообщения
  db.set("user:3", new Map([["login", "c"]]));
  db.set("profile:3", JSON.stringify({ name: "C", dm: false }));
  [s] = await call(social.chat, as("1", "ramina", { action: "send", with: "3", text: "привет" }));
  assert.equal(s, 403);
  // лимит частоты
  db.set("user:4", new Map([["login", "d"]]));
  let last = 200;
  for (let i = 0; i < 25; i++) [last] = await call(social.chat, as("1", "ramina", { action: "send", with: "4", text: "спам " + i }));
  assert.equal(last, 429);
});

test("чат: жалоба сохраняется и блокирует; без входа и с чужого сайта — отказ", async () => {
  db.set("user:2", new Map([["login", "rakhat"]]));
  await call(social.chat, as("1", "ramina", { action: "report", with: "2", note: "грубит" }));
  assert.equal(db.get("reports").length, 1);
  assert.ok(db.get("blocked:1").has("2"));
  const anon = new Request("https://verix.test/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "threads" }) });
  assert.equal((await social.chat(anon)).status, 401);
  const evil = new Request("https://verix.test/api/chat", { method: "POST", headers: { "content-type": "application/json", origin: "https://evil.test", cookie: sessionCookie({ uid: "1", login: "a" }).split(";")[0] }, body: "{}" });
  assert.equal((await social.chat(evil)).status, 403);
});

test("вход через GitHub без настроек сервера честно сообщает, что недоступен", async () => {
  const saved = process.env.GITHUB_CLIENT_ID;
  delete process.env.GITHUB_CLIENT_ID;
  const r = await social.authLogin(new Request("https://verix.test/api/auth/login"));
  assert.equal(r.status, 302);
  assert.match(r.headers.get("location"), /login=unavailable/);
  const [, m] = await call(social.me, new Request("https://verix.test/api/me"));
  assert.deepEqual(m, { user: null, ready: false });
  if (saved) process.env.GITHUB_CLIENT_ID = saved;
});

test("вход через GitHub: перенаправление со state, callback отклоняет чужой state", async () => {
  process.env.GITHUB_CLIENT_ID = "cid"; process.env.GITHUB_CLIENT_SECRET = "cs";
  const r = await social.authLogin(new Request("https://verix.test/api/auth/login"));
  const loc = new URL(r.headers.get("location"));
  assert.equal(loc.host, "github.com");
  assert.equal(loc.searchParams.get("redirect_uri"), "https://verix.test/api/auth/callback");
  const state = loc.searchParams.get("state");
  assert.match(r.headers.get("set-cookie"), new RegExp(`vx_state=${state}`));
  const bad = await social.authCallback(new Request(`https://verix.test/api/auth/callback?code=x&state=${state}`, { headers: { cookie: "vx_state=other" } }));
  assert.match(bad.headers.get("location"), /login=error/);
  delete process.env.GITHUB_CLIENT_ID; delete process.env.GITHUB_CLIENT_SECRET;
});
