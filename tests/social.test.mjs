// Автотесты аккаунтов, рейтинга и чата. База данных (Upstash REST) имитируется в памяти.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-123";
process.env.KV_REST_API_URL = "https://kv.test";
process.env.KV_REST_API_TOKEN = "t";
process.env.GROQ_API_KEY = "test";

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
    case "DEL": return db.delete(k) ? 1 : 0;
    case "HSET": { const h = get("h"); for (let i = 0; i < a.length; i += 2) h.set(a[i], a[i + 1]); db.set(k, h); return 1; }
    case "HSETNX": { const h = get("h"); if (!h.has(a[0])) h.set(a[0], a[1]); db.set(k, h); return 1; }
    case "HGET": return (db.get(k) || new Map()).get(a[0]) ?? null;
    case "HGETALL": return [...(db.get(k) || new Map())].flat();
    case "ZADD": { const z = get("z"); const nx = a[0] === "NX"; const [sc, m] = nx ? a.slice(1) : a; if (nx && z.has(m)) return 0; z.set(m, +sc); db.set(k, z); return 1; }
    case "ZRANGE": return [...(db.get(k) || new Map())].sort((x, y) => x[1] - y[1]).map(([m]) => m);
    case "ZSCORE": { const v = (db.get(k) || new Map()).get(a[0]); return v === undefined ? null : String(v); }
    case "HLEN": return (db.get(k) || new Map()).size;
    case "SMEMBERS": return [...(db.get(k) || new Set())];
    case "LINDEX": return (db.get(k) || [])[+a[0]] ?? null;
    case "LSET": { const l = db.get(k); l[+a[0]] = a[1]; return "OK"; }
    case "SCAN": { const re = new RegExp("^" + a[1].replace("*", ".*") + "$"); return ["0", [...db.keys()].filter((x) => re.test(x))]; }
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
let ghContributors = [], groqCalls = 0;
globalThis.fetch = async (url, init = {}) => {
  url = String(url);
  if (url.startsWith("https://kv.test")) {
    const body = JSON.parse(init.body);
    if (url.endsWith("/pipeline")) return Response.json(body.map((c) => ({ result: redis(c) })));
    return Response.json({ result: redis(body) });
  }
  if (url.includes("api.groq.com")) { groqCalls++; const sys = JSON.parse(init.body).messages[0].content; return Response.json({ choices: [{ message: { content: JSON.stringify({ text: (sys.includes("English") ? "EN: " : "KK: ") + JSON.parse(init.body).messages[1].content }) } }] }); }
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

test("чат: ответ на сообщение, пересылка, удаление у себя и у всех", async () => {
  for (const [id, login] of [["1", "ramina"], ["2", "rakhat"], ["3", "aru"]]) db.set(`user:${id}`, new Map([["login", login]]));
  db.set("profile:1", JSON.stringify({ name: "Рамина" }));
  const [, a] = await call(social.chat, as("2", "rakhat", { action: "send", with: "1", text: "Посмотри мой репозиторий" }));
  // ответ
  let [s, r] = await call(social.chat, as("1", "ramina", { action: "send", with: "2", text: "Круто!", reply_to: a.id }));
  assert.equal(s, 200);
  let [, m] = await call(social.chat, as("2", "rakhat", { action: "messages", with: "1" }));
  assert.equal(m.messages[1].reply.text, "Посмотри мой репозиторий");
  assert.equal(m.messages[1].reply.mine, true);
  // ответ на чужую переписку не пройдёт
  [s] = await call(social.chat, as("3", "aru", { action: "send", with: "2", text: "хм", reply_to: a.id }));
  assert.equal(s, 404);
  // пересылка: только из своей переписки, с подписью автора
  [s] = await call(social.chat, as("1", "ramina", { action: "forward", with: "2", id: a.id, to: "3" }));
  assert.equal(s, 200);
  [, m] = await call(social.chat, as("3", "aru", { action: "messages", with: "1" }));
  assert.equal(m.messages[0].text, "Посмотри мой репозиторий");
  assert.equal(m.messages[0].fwd.name, "rakhat");
  [s] = await call(social.chat, as("3", "aru", { action: "forward", with: "2", id: a.id, to: "1" }));
  assert.equal(s, 404);
  // удалить у меня: у собеседника остаётся
  await call(social.chat, as("1", "ramina", { action: "delete", with: "2", id: a.id }));
  [, m] = await call(social.chat, as("1", "ramina", { action: "messages", with: "2" }));
  assert.ok(!m.messages.some((x) => x.id === a.id));
  [, m] = await call(social.chat, as("2", "rakhat", { action: "messages", with: "1" }));
  assert.ok(m.messages.some((x) => x.id === a.id && x.text));
  // удалить у всех: только своё, текст стирается из базы
  [s] = await call(social.chat, as("1", "ramina", { action: "delete", with: "2", id: a.id, for_all: true }));
  assert.equal(s, 403);
  [s] = await call(social.chat, as("1", "ramina", { action: "delete", with: "2", id: r.id, for_all: true }));
  assert.equal(s, 200);
  [, m] = await call(social.chat, as("2", "rakhat", { action: "messages", with: "1" }));
  const del = m.messages.find((x) => x.id === r.id);
  assert.equal(del.deleted, true);
  assert.equal(del.text, undefined);
  assert.ok(!JSON.stringify(db.get("chat:1:2")).includes("Круто!"));
  // цитата удалённого у всех сообщения тоже пропадает
  const [, q] = await call(social.chat, as("2", "rakhat", { action: "send", with: "1", text: "ок", reply_to: r.id }));
  [, m] = await call(social.chat, as("1", "ramina", { action: "messages", with: "2" }));
  assert.equal(m.messages.find((x) => x.id === q.id).reply.text, "");
});

test("чат: перевод на язык читателя, кэш и защита", async () => {
  groqCalls = 0;
  for (const [id, login] of [["1", "ramina"], ["2", "rakhat"], ["3", "aru"]]) db.set(`user:${id}`, new Map([["login", login]]));
  const [, a] = await call(social.chat, as("2", "rakhat", { action: "send", with: "1", text: "Сәлем! Бірге жоба жасайық" }));
  let [s, t] = await call(social.chat, as("1", "ramina", { action: "translate", with: "2", id: a.id, lang: "en" }));
  assert.equal(s, 200);
  assert.equal(t.text, "EN: Сәлем! Бірге жоба жасайық");
  [, t] = await call(social.chat, as("1", "ramina", { action: "translate", with: "2", id: a.id, lang: "en" }));
  assert.equal(groqCalls, 1); // второй раз — из кэша
  [s] = await call(social.chat, as("1", "ramina", { action: "translate", with: "2", id: a.id, lang: "de" }));
  assert.equal(s, 400);
  [s] = await call(social.chat, as("3", "aru", { action: "translate", with: "2", id: a.id, lang: "en" })); // чужая переписка
  assert.equal(s, 404);
});

test("админ-панель: видит только администратор, старые аккаунты тоже в списке", async () => {
  process.env.ADMIN_LOGINS = "Ramina";
  db.set("user:1", new Map([["login", "ramina"], ["created", String(Date.now())]]));
  db.set("user:2", new Map([["login", "rakhat"], ["created", String(Date.now() - 10 * 86_400_000)]]));
  db.set("profile:2", JSON.stringify({ name: "Рахат", grade: "11 класс", city: "Алматы" }));
  db.set("users", new Map([["1", 1]]));  // второй аккаунт создан до индекса users
  const [s1] = await call(social.admin, as("2", "rakhat", null, "GET"));
  assert.equal(s1, 403);
  const [s2, d] = await call(social.admin, as("1", "ramina", null, "GET"));
  assert.equal(s2, 200);
  assert.equal(d.total, 2);
  assert.equal(d.week, 1);
  assert.equal(d.users.find((u) => u.uid === "2").city, "Алматы");
  const [, m] = await call(social.me, as("1", "ramina", null, "GET"));
  assert.equal(m.user.admin, true);
  delete process.env.ADMIN_LOGINS;
});

test("чат: очистить у себя и у обоих; админ видит, кто только вошёл", async () => {
  for (const [id, login] of [["1", "ramina"], ["2", "rakhat"], ["3", "aru"]]) db.set(`user:${id}`, new Map([["login", login], ["created", String(Date.now())]]));
  await call(social.chat, as("2", "rakhat", { action: "send", with: "1", text: "раз" }));
  await call(social.chat, as("1", "ramina", { action: "send", with: "2", text: "два" }));
  await new Promise((r) => setTimeout(r, 5));
  await call(social.chat, as("1", "ramina", { action: "clear", with: "2" }));
  let [, m] = await call(social.chat, as("1", "ramina", { action: "messages", with: "2" }));
  assert.equal(m.messages.length, 0);
  [, m] = await call(social.chat, as("2", "rakhat", { action: "messages", with: "1" }));
  assert.equal(m.messages.length, 2); // у собеседника осталось
  await new Promise((r) => setTimeout(r, 5));
  await call(social.chat, as("2", "rakhat", { action: "send", with: "1", text: "три" }));
  [, m] = await call(social.chat, as("1", "ramina", { action: "messages", with: "2" }));
  assert.deepEqual(m.messages.map((x) => x.text), ["три"]); // новые после очистки видны
  await call(social.chat, as("2", "rakhat", { action: "clear", with: "1", for_all: true }));
  assert.equal(db.has("chat:1:2"), false);
  // админ: статусы активности и последний визит
  process.env.ADMIN_LOGINS = "ramina";
  db.set("profile:2", JSON.stringify({ name: "Рахат" }));
  db.set("skills:3", new Map([["Web|x", "{}"]]));
  await call(social.me, as("1", "ramina", null, "GET"));
  const [, d] = await call(social.admin, as("1", "ramina", null, "GET"));
  const st = Object.fromEntries(d.users.map((u) => [u.login, u.status]));
  assert.deepEqual(st, { ramina: "login", rakhat: "survey", aru: "skill" });
  assert.equal(d.only_login, 1);
  assert.ok(d.users.find((u) => u.login === "ramina").seen >= d.users.find((u) => u.login === "ramina").created);
  delete process.env.ADMIN_LOGINS;
});

test("рейтинг: наружу только место, имя и балл; «твоё место» с соседями", async () => {
  for (let i = 1; i <= 5; i++) {
    db.set(`user:${i}`, new Map([["login", "u" + i], ["name", "GH " + i]]));
    db.set(`profile:${i}`, JSON.stringify({ name: "Ученик " + i, grade: "11 класс", city: "Алматы", dm: true }));
    await social.recordProof(as(String(i), "u" + i, {}), { skill: "Web", repo: `https://github.com/u${i}/p`, result: { scored_by: "code", overall_score: 50 + i * 5, level_name: "Средний" } });
  }
  const [, r] = await call(social.rank, as("3", "u3", null, "GET"));
  assert.deepEqual(Object.keys(r.list[0]).sort(), ["dm", "me", "name", "place", "score", "uid"]);
  assert.ok(!JSON.stringify(r).includes("Алматы"));
  assert.deepEqual(r.around.map((x) => [x.place, x.uid, x.me]), [[2, "4", false], [3, "3", true], [4, "2", false]]);
  const [, first] = await call(social.rank, as("5", "u5", null, "GET"));
  assert.deepEqual(first.around.map((x) => x.place), [1, 2]);
  const [, anon] = await call(social.rank, new Request("https://verix.test/api/rank"));
  assert.deepEqual(anon.around, []);
});
