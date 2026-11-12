import { handle } from "../server/score.mjs";
import { clientIp } from "../server/groq.mjs";

// Vercel Functions (Web-стандарт): POST /api/skillproof
export async function POST(request) {
  return handle(request, clientIp(request));
}
