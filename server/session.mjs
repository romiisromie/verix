// Сессия: подписанная HMAC-SHA256 cookie (HttpOnly, Secure, SameSite=Lax).
// Секрет — переменная окружения SESSION_SECRET (не короче 32 символов). Токен GitHub не хранится.
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { HttpError } from "./groq.mjs";

export const SESSION_COOKIE = "vx_sess";
const MAX_AGE = 30 * 24 * 3600; // 30 дней

function secret() {
  const s = process.env.SESSION_SECRET || "";
  if (s.length < 32) throw new HttpError(501, "Вход через GitHub ещё не настроен на сервере");
  return s;
}
const b64 = (buf) => Buffer.from(buf).toString("base64url");
const mac = (data) => createHmac("sha256", secret()).update(data).digest("base64url");

export function sign(payload) {
  const body = b64(JSON.stringify(payload));
  return `${body}.${mac(body)}`;
}

export function verify(tokenStr) {
  if (!tokenStr || typeof tokenStr !== "string" || !tokenStr.includes(".")) return null;
  const [body, sig] = tokenStr.split(".");
  const want = mac(body);
  const a = Buffer.from(sig || ""), b = Buffer.from(want);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!p.exp || p.exp < Date.now() / 1000) return null;
    return p;
  } catch { return null; }
}

export function parseCookies(request) {
  const out = {};
  for (const part of (request.headers.get("cookie") || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function cookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function sessionCookie(user) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  return cookie(SESSION_COOKIE, sign({ uid: String(user.uid), login: user.login, exp }), MAX_AGE);
}

// Пользователь из cookie или null
export function currentUser(request) {
  try { return verify(parseCookies(request)[SESSION_COOKIE]); } catch { return null; }
}

export const randomState = () => randomBytes(16).toString("hex");
