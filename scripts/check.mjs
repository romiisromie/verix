// Проверка синтаксиса всех JS-файлов проекта: npm run check
import { readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const dirs = ["js", "server", "api", "netlify/functions", "scripts", "research", "tests"];
const files = ["sw.js", ...dirs.flatMap((d) => readdirSync(d).filter((f) => /\.(m?js)$/.test(f)).map((f) => `${d}/${f}`))];
for (const f of files) execFileSync(process.execPath, ["--check", f], { stdio: "inherit" });
JSON.parse((await import("node:fs")).readFileSync("data/opportunities.json", "utf8"));
console.log(`ok: ${files.length} файлов + data/opportunities.json`);
