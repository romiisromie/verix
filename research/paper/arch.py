# Рисует схему архитектуры Verix (рис. 5) → research/fig/fig5_arch.png
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

OUT = Path(__file__).resolve().parents[1] / "fig"; OUT.mkdir(exist_ok=True)
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10})
fig, ax = plt.subplots(figsize=(9, 5.2)); ax.set_xlim(0, 100); ax.set_ylim(0, 60); ax.axis("off")

def box(x, y, w, h, title, lines, color):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.6,rounding_size=1.5", fc=color, ec="#334155", lw=1.2))
    ax.text(x + w / 2, y + h - 2.6, title, ha="center", va="top", weight="bold", fontsize=10.5)
    ax.text(x + w / 2, y + h - 7.2, "\n".join(lines), ha="center", va="top", fontsize=8.6, linespacing=1.45)

def arrow(x1, y1, x2, y2, label=""):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1), arrowprops=dict(arrowstyle="-|>", lw=1.4, color="#334155"))
    if label:
        ax.text((x1 + x2) / 2, (y1 + y2) / 2 + 1.4, label, ha="center", fontsize=8, color="#334155")

box(2, 8, 28, 46, "Браузер ученика (PWA)", ["index.html, css/styles.css", "app.js — профиль, SkillProof,", "TalentMatch, рейтинги", "edupath.js — роадмап", "game.js — XP, уровни", "enhance.js — офлайн,", "доступность", "", "localStorage: профиль,", "навыки, заявки, XP"], "#e0e9ff")
box(38, 8, 26, 46, "Serverless-функции", ["Vercel / Netlify", "", "/api/skillproof", "  проверка запроса, лимит", "  сбор данных GitHub (кэш)", "  рубрика + JSON-схема", "", "/api/roadmap", "  4 фазы обучения", "", "Ключ ИИ — только здесь"], "#dcfce7")
box(72, 33, 26, 21, "GitHub API", ["репозиторий, языки,", "дерево файлов, коммиты,", "README, ключевые файлы"], "#fef3c7")
box(72, 8, 26, 21, "Groq API", ["модель gpt-oss-120b", "строгий JSON-ответ"], "#fde2e7")
arrow(30.5, 36, 37.5, 36, "POST JSON")
arrow(37.5, 26, 30.5, 26, "балл, вердикт")
arrow(64.5, 44, 71.5, 44, "")
arrow(64.5, 18, 71.5, 18, "")
fig.tight_layout(); fig.savefig(OUT / "fig5_arch.png", dpi=170); print("ok")
