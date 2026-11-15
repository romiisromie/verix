// База данных: Upstash Redis через REST (без зависимостей).
// Переменные окружения создаёт интеграция Upstash в Vercel: KV_REST_API_URL / KV_REST_API_TOKEN
// (или UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).
import { HttpError } from "./groq.mjs";

const url = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const token = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
export const kvReady = () => !!(url() && token());

async function call(path, body) {
  if (!kvReady()) throw new HttpError(501, "База данных не подключена");
  let res;
  try {
    res = await fetch(url().replace(/\/$/, "") + path, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new HttpError(503, "База данных недоступна. Попробуй позже.");
  }
  if (!res.ok) {
    console.error("KV error", res.status, (await res.text().catch(() => "")).slice(0, 300));
    throw new HttpError(502, "Ошибка базы данных");
  }
  return res.json();
}

// Одна команда: kv("SET", "key", "value") → результат
export async function kv(...cmd) {
  const data = await call("", cmd.map(String));
  if (data.error) throw new HttpError(502, "Ошибка базы данных");
  return data.result;
}

// Несколько команд за один запрос: pipeline([["GET","a"],["INCR","b"]]) → [результаты]
export async function pipeline(cmds) {
  if (!cmds.length) return [];
  const data = await call("/pipeline", cmds.map((c) => c.map(String)));
  return data.map((d) => (d.error ? null : d.result));
}

export const json = (v) => { try { return v ? JSON.parse(v) : null; } catch { return null; } };
