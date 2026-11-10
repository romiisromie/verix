import { handle } from "../../server/score.mjs";

export default async (request, context) => handle(request, context?.ip || "unknown");

export const config = { path: "/api/skillproof" };
