import { handle } from "../server/score.mjs";

// Vercel Functions (Web-стандарт): POST /api/skillproof
export async function POST(request) {
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  return handle(request, ip);
}
