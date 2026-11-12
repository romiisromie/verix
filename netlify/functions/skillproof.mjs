import { handle } from "../../server/score.mjs";
import { clientIp } from "../../server/groq.mjs";

export default async (request, context) => handle(request, clientIp(request, context));

export const config = { path: "/api/skillproof" };
