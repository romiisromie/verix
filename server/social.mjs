// Настоящие аккаунты: вход через GitHub, профиль, подтверждённые навыки, рейтинг и чат.
// Всё, что влияет на рейтинг, считает сервер: подделать скор из браузера нельзя.
import { HttpError, str, clamp } from "./groq.mjs";
import { kv, pipeline, kvReady, json as parse } from "./kv.mjs";
import { currentUser, sessionCookie, cookie, parseCookies, randomState, SESSION_COOKIE } from "./session.mjs";
import { contributors, parseRepo } from "./github.mjs";

const GRADES = ["8 класс", "9 класс", "10 класс", "11 класс", "1 курс", "2 курс", "3 курс", "4 курс"];
const TAGS = ["Frontend", "Backend", "AI/ML", "Data", "Design", "Mobile", "Game Dev", "Cybersecurity"];
const MSG_MAX = 500;
const MSG_PER_MIN = 20;

const reply = (status, obj, headers = {}) => new Response(JSON.stringify(obj), {
  status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
});
const redirect = (to, cookies = []) => {
  const h = new Headers({ Location: to, "Cache-Control": "no-store" });
  cookies.forEach((c) => h.append("Set-Cookie", c));
  return new Response(null, { status: 302, headers: h });
};

function requireUser(request) {
  const u = currentUser(request);
  if (!u) throw new HttpError(401, "Войди через GitHub");
  return u;
}

// Обёртка для API с сессией: JSON, свой домен (защита от CSRF), коды ошибок
export function api(work, { method = "POST" } = {}) {
  return async function (request) {
    try {
      if (request.method !== method) return reply(405, { error: "Метод не поддерживается" });
      let body = null;
      if (method === "POST") {
        const ctype = (request.headers.get("content-type") || "").toLowerCase();
        if (!ctype.startsWith("application/json")) return reply(415, { error: "Нужен Content-Type: application/json" });
        const origin = request.headers.get("origin");
        if (origin && new URL(origin).host !== new URL(request.url).host) return reply(403, { error: "Запрос с чужого сайта" });
        const raw = await request.text();
        if (raw.length > 4000) throw new HttpError(413, "Слишком большой запрос");
        try { body = JSON.parse(raw || "{}"); } catch { throw new HttpError(400, "Неверный JSON"); }
      }
      return reply(200, await work(request, body));
    } catch (err) {
      if (err instanceof HttpError) return reply(err.status, { error: err.message });
      console.error(err);
      return reply(500, { error: "Внутренняя ошибка" });
    }
  };
}

// ═══════════ ВХОД ЧЕРЕЗ GITHUB (OAuth) ═══════════
const baseUrl = (request) => (process.env.OAUTH_BASE_URL || new URL(request.url).origin).replace(/\/$/, "");
const oauthReady = () => !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && (process.env.SESSION_SECRET || "").length >= 32 && kvReady());

export async function authLogin(request) {
  if (!oauthReady()) return redirect("/?login=unavailable");
  const state = randomState();
  const q = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${baseUrl(request)}/api/auth/callback`,
    state, allow_signup: "true",
  });
  return redirect(`https://github.com/login/oauth/authorize?${q}`, [cookie("vx_state", state, 600)]);
}

export async function authCallback(request) {
  try {
    if (!oauthReady()) return redirect("/?login=unavailable");
    const u = new URL(request.url);
    const code = u.searchParams.get("code"), state = u.searchParams.get("state");
    const saved = parseCookies(request).vx_state;
    if (!code || !state || !saved || state !== saved) return redirect("/?login=error", [cookie("vx_state", "", 0)]);
    const tok = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code, redirect_uri: `${baseUrl(request)}/api/auth/callback` }),
      signal: AbortSignal.timeout(10_000),
    }).then((r) => r.json());
    if (!tok.access_token) return redirect("/?login=error", [cookie("vx_state", "", 0)]);
    const gh = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tok.access_token}`, Accept: "application/vnd.github+json", "User-Agent": "verix" },
      signal: AbortSignal.timeout(10_000),
    }).then((r) => r.json());
    if (!gh.id || !gh.login) return redirect("/?login=error", [cookie("vx_state", "", 0)]);
    const uid = String(gh.id);
    // токен GitHub дальше не нужен и нигде не сохраняется
    await pipeline([
      ["HSET", `user:${uid}`, "login", gh.login, "name", str(gh.name || gh.login, 60)],
      ["HSETNX", `user:${uid}`, "created", String(Date.now())],
      ["SET", `login:${gh.login.toLowerCase()}`, uid],
    ]);
    return redirect("/?login=ok", [cookie("vx_state", "", 0), sessionCookie({ uid, login: gh.login })]);
  } catch (err) {
    console.error("OAuth callback", err);
    return redirect("/?login=error", [cookie("vx_state", "", 0)]);
  }
}

export async function authLogout() {
  return redirect("/", [cookie(SESSION_COOKIE, "", 0)]);
}

// ═══════════ ПРОФИЛЬ ═══════════
const DEFAULT_PROFILE = { name: "", grade: "11 класс", city: "", tags: [], goal: "", public: true, dm: true };

export function cleanProfile(p) {
  if (!p || typeof p !== "object") throw new HttpError(400, "Пустой профиль");
  const tags = (Array.isArray(p.tags) ? p.tags : []).filter((t) => TAGS.includes(t)).slice(0, 3);
  const name = str(p.name, 60).replace(/[<>]/g, "");
  if (name.length < 2 || name === "Ученик") throw new HttpError(400, "Укажи имя");
  return {
    name, tags,
    grade: GRADES.includes(p.grade) ? p.grade : DEFAULT_PROFILE.grade,
    city: str(p.city, 60).replace(/[<>]/g, ""),
    goal: str(p.goal, 40).replace(/[<>]/g, ""),
    public: p.public !== false,
    dm: p.dm !== false,
  };
}

async function loadProfile(uid) {
  return { ...DEFAULT_PROFILE, ...(parse(await kv("GET", `profile:${uid}`)) || {}) };
}

export const saveProfile = api(async (request, body) => {
  const u = requireUser(request);
  const p = cleanProfile(body);
  await kv("SET", `profile:${u.uid}`, JSON.stringify(p));
  await updateRank(u.uid, p);
  return { ok: true, profile: p };
});

// ═══════════ НАВЫКИ И РЕЙТИНГ ═══════════
// Скор = 0,40·навыки + 0,35·проекты + 0,25·активность (как в профиле), но только по навыкам,
// подтверждённым по коду В СВОИХ репозиториях (владелец или соавтор).
export function computeRep(skills) {
  if (!skills.length) return 0;
  const skill = Math.round(skills.reduce((a, s) => a + (+s.score || 0), 0) / skills.length);
  const repos = new Set(skills.map((s) => s.repo)).size;
  const proj = Math.min(100, repos * 25);
  const act = Math.min(100, Math.round(((repos * 40 + skills.length * 15) / 640) * 100));
  return Math.round(0.4 * skill + 0.35 * proj + 0.25 * act);
}

async function loadSkills(uid) {
  const h = (await kv("HGETALL", `skills:${uid}`)) || [];
  const out = [];
  for (let i = 0; i < h.length; i += 2) { const s = parse(h[i + 1]); if (s) out.push(s); }
  return out.sort((a, b) => b.at - a.at);
}

async function updateRank(uid, profile) {
  const p = profile || await loadProfile(uid);
  const rep = computeRep(await loadSkills(uid));
  if (p.public && rep > 0) await kv("ZADD", "rank", rep, uid);
  else await kv("ZREM", "rank", uid);
  return rep;
}

// Вызывается из SkillProof после проверки по коду: сохраняет навык, если репозиторий — свой
export async function recordProof(request, { skill, repo, result }) {
  const u = currentUser(request);
  if (!u || !repo || !result || result.scored_by !== "code" || !kvReady()) return null;
  const { owner, repo: name } = parseRepo(repo);
  const login = u.login.toLowerCase();
  let ownership = owner.toLowerCase() === login ? "owner" : null;
  if (!ownership) ownership = (await contributors(owner, name)).includes(login) ? "contributor" : "not_yours";
  if (ownership === "not_yours") return { ownership, recorded: false };
  const url = `https://github.com/${owner}/${name}`;
  const rec = { skill, repo: url, score: clamp(result.overall_score), level: result.level_name, ownership, at: Date.now() };
  await kv("HSET", `skills:${u.uid}`, `${skill}|${url.toLowerCase()}`, JSON.stringify(rec));
  const rep = await updateRank(u.uid);
  return { ownership, recorded: true, rep };
}

export const me = api(async (request) => {
  const u = currentUser(request);
  if (!u) return { user: null, ready: oauthReady() };
  const [profile, skills, rawName] = await Promise.all([loadProfile(u.uid), loadSkills(u.uid), kv("HGET", `user:${u.uid}`, "name")]);
  const pos = await kv("ZREVRANK", "rank", u.uid);
  return { user: { uid: u.uid, login: u.login, name: rawName || u.login }, profile, skills, rep: computeRep(skills), place: pos === null ? null : +pos + 1, ready: true };
}, { method: "GET" });

export const rank = api(async (request) => {
  const u = currentUser(request);
  const top = (await kv("ZREVRANGE", "rank", 0, 49, "WITHSCORES")) || [];
  const ids = [];
  for (let i = 0; i < top.length; i += 2) ids.push([top[i], +top[i + 1]]);
  const profiles = await pipeline(ids.map(([id]) => ["GET", `profile:${id}`]));
  const logins = await pipeline(ids.map(([id]) => ["HGET", `user:${id}`, "login"]));
  const ghNames = await pipeline(ids.map(([id]) => ["HGET", `user:${id}`, "name"]));
  const list = ids.map(([id, score], i) => {
    const p = { ...DEFAULT_PROFILE, ...(parse(profiles[i]) || {}) };
    return { uid: id, place: i + 1, score, name: (p.name && p.name !== "Ученик" ? p.name : "") || ghNames[i] || logins[i] || "Ученик", login: logins[i] || "", grade: p.grade, city: p.city, tags: p.tags, dm: !!p.dm, me: !!u && u.uid === id };
  });
  const total = await kv("ZCARD", "rank");
  return { list, total: +total || 0 };
}, { method: "GET" });

// ═══════════ ЧАТ ═══════════
const pair = (a, b) => (a < b ? `${a}:${b}` : `${b}:${a}`);
export function cleanText(t) {
  const s = String(t ?? "").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim();
  if (!s) throw new HttpError(400, "Пустое сообщение");
  if (s.length > MSG_MAX) throw new HttpError(400, `Сообщение длиннее ${MSG_MAX} символов`);
  return s;
}

export const chat = api(async (request, body) => {
  const u = requireUser(request);
  const action = str(body?.action, 20);
  const other = str(body?.with, 30);

  if (action === "threads") {
    const t = (await kv("ZREVRANGE", `threads:${u.uid}`, 0, 49)) || [];
    const names = await pipeline(t.map((id) => ["GET", `profile:${id}`]));
    return { threads: t.map((id, i) => ({ uid: id, name: (parse(names[i]) || {}).name || "Ученик" })) };
  }
  if (!/^\d{1,20}$/.test(other) || other === u.uid) throw new HttpError(400, "Неверный собеседник");

  if (action === "messages") {
    const raw = (await kv("LRANGE", `chat:${pair(u.uid, other)}`, 0, 99)) || [];
    return { messages: raw.map(parse).filter(Boolean).reverse().map((m) => ({ text: m.text, at: m.at, mine: m.from === u.uid })) };
  }
  if (action === "send") {
    const text = cleanText(body.text);
    const [prof, blocked, exists] = await pipeline([
      ["GET", `profile:${other}`], ["SISMEMBER", `blocked:${other}`, u.uid], ["EXISTS", `user:${other}`],
    ]);
    if (!+exists) throw new HttpError(404, "Ученик не найден");
    if (+blocked) throw new HttpError(403, "Ученик ограничил сообщения");
    if ((parse(prof) || DEFAULT_PROFILE).dm === false) throw new HttpError(403, "Ученик отключил сообщения");
    const minute = Math.floor(Date.now() / 60_000);
    const [count] = await pipeline([["INCR", `rl:msg:${u.uid}:${minute}`], ["EXPIRE", `rl:msg:${u.uid}:${minute}`, 120]]);
    if (+count > MSG_PER_MIN) throw new HttpError(429, "Слишком много сообщений. Подожди минуту.");
    const now = Date.now(), key = `chat:${pair(u.uid, other)}`;
    await pipeline([
      ["LPUSH", key, JSON.stringify({ from: u.uid, text, at: now })], ["LTRIM", key, 0, 199],
      ["ZADD", `threads:${u.uid}`, now, other], ["ZADD", `threads:${other}`, now, u.uid],
    ]);
    return { ok: true };
  }
  if (action === "block") { await kv("SADD", `blocked:${u.uid}`, other); return { ok: true }; }
  if (action === "report") {
    await kv("LPUSH", "reports", JSON.stringify({ from: u.uid, about: other, note: str(body.note, 300), at: Date.now() }));
    await kv("SADD", `blocked:${u.uid}`, other);
    return { ok: true };
  }
  throw new HttpError(400, "Неизвестное действие");
});
