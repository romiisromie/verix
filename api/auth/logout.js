import { authLogout } from "../../server/social.mjs";
// GET /api/auth/logout — выход (удаляет cookie сессии)
export const GET = authLogout;
