import { handle } from "../server/roadmap.mjs";
import { clientIp } from "../server/groq.mjs";

// Vercel Functions (Web-стандарт): POST /api/roadmap
export async function POST(request) {
  return handle(request, clientIp(request));
}
