// Общие помощники для серверных функций: вызов Groq, ошибки, лимит запросов, JSON-ответы.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
export const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));
export const str = (v, max) => String(v ?? "").trim().slice(0, max);

const hits = new Map(); // простой лимит на тёплый экземпляр функции
export function rateLimit(key, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (list.length >= limit) throw new HttpError(429, "Слишком много запросов. Подожди минуту.");
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
}

// Запрос к Groq со строгой JSON-схемой. Возвращает разобранный объект.
export async function groqJSON({ system, user, schema, name, maxTokens = 1500 }) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new HttpError(501, "AI не настроен на сервере");

  let res;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(40_000),
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: maxTokens,
        reasoning_effort: "low",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_schema", json_schema: { name, strict: true, schema } },
      }),
    });
  } catch (err) {
    console.error("Groq connection error", err);
    throw new HttpError(503, "Нет связи с AI. Попробуй позже.");
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Groq API error", res.status, detail.slice(0, 500));
    if (res.status === 429) throw new HttpError(429, "Лимит бесплатного AI исчерпан. Попробуй через минуту.");
    if (res.status === 401 || res.status === 403) throw new HttpError(502, "Неверный ключ AI на сервере");
    if (res.status === 413) throw new HttpError(413, "Слишком большой запрос для AI");
    throw new HttpError(502, "Ошибка AI-сервиса");
  }

  const payload = await res.json();
  const text = payload?.choices?.[0]?.message?.content || "";
  try { return JSON.parse(text); } catch { throw new HttpError(502, "AI вернул неверный ответ"); }
}

// Обёртка для Web Request/Response (Vercel и Netlify Functions v2).
export function makeHandler(work, { limit = 10, maxBody = 8000 } = {}) {
  return async function handle(request, ip = "unknown") {
    const json = (status, obj) => new Response(JSON.stringify(obj), {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
    if (request.method !== "POST") return json(405, { error: "Только POST" });
    try {
      rateLimit(`${work.name}:${ip}`, limit);
      const raw = await request.text();
      if (raw.length > maxBody) throw new HttpError(413, "Слишком большой запрос");
      let body;
      try { body = JSON.parse(raw); } catch { throw new HttpError(400, "Неверный JSON"); }
      return json(200, await work(body));
    } catch (err) {
      if (err instanceof HttpError) return json(err.status, { error: err.message });
      console.error(err);
      return json(500, { error: "Внутренняя ошибка" });
    }
  };
}

export function clientIp(request, context) {
  return context?.ip || (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
}
