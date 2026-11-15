import { chat } from "../server/social.mjs";
// POST /api/chat — сообщения между учениками (нужен вход): threads, messages, send, block, report
export const POST = chat;
