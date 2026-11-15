import { authCallback } from "../../server/social.mjs";
// GET /api/auth/callback — GitHub возвращает сюда после входа
export const GET = authCallback;
