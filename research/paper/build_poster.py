# Стенд 135×125 см по требованиям РКНП: вверху по горизонтали — абстракт, имя, возраст,
# школа, город, область; ниже — содержание работы с пронумерованными рисунками и выводами.
# Запуск: python research/paper/build_poster.py  →  research/paper/out/Verix_стенд.pdf (+ превью .png)
import json, textwrap
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
import matplotlib.image as mpimg
import qrcode

ROOT = Path(__file__).resolve().parents[1]
R = json.loads((ROOT / "data/results.json").read_text(encoding="utf-8"))
FIG, OUT = ROOT / "fig", Path(__file__).parent / "out"; OUT.mkdir(exist_ok=True)
num = lambda x: str(x).replace(".", ",")
pf = lambda p: "p < 0,001" if p < 0.001 else f"p = {p:.3f}".replace(".", ",")
spc, bs = R["spearman_complexity_index"], R["by_stratum"]

W, H = 135, 125  # см
CM = 1 / 2.54
plt.rcParams.update({"font.family": "DejaVu Sans"})
fig = plt.figure(figsize=(W * CM, H * CM))
ax = fig.add_axes([0, 0, 1, 1]); ax.set_xlim(0, W); ax.set_ylim(0, H); ax.axis("off")
BLUE, INK = "#2f6bff", "#0f172a"

def panel(x, y, w, h, title, color="#f1f5ff"):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0,rounding_size=1.2", fc=color, ec="#cbd5e1", lw=2))
    ax.text(x + 1.5, y + h - 1.6, title, fontsize=40, weight="bold", color=BLUE, va="top")

def text(x, y, s, width, size=24, **kw):
    wrapped = "\n".join(textwrap.fill(par, width) for par in s.split("\n"))
    ax.text(x, y, wrapped, fontsize=size, va="top", color=INK, linespacing=1.35, **kw)

def image(path, x, y, w):
    img = mpimg.imread(path); h = w * img.shape[0] / img.shape[1]
    ax.imshow(img, extent=(x, x + w, y, y + h), zorder=3)
    return h

# ---- шапка ----
ax.add_patch(FancyBboxPatch((0, H - 24), W, 24, boxstyle="square,pad=0", fc=BLUE, ec="none"))
ax.text(3, H - 2.5, "VERIX", fontsize=120, weight="bold", color="white", va="top")
ax.text(3, H - 12.5, "Цифровая платформа подтверждения IT-навыков школьников\nс помощью искусственного интеллекта по реальному коду", fontsize=40, color="white", va="top", linespacing=1.25)
ax.text(3, H - 21.3, "[Имя Фамилия], [__] лет · [школа] · [город], [область] · Руководитель: [ФИО] · Секция: Информатика", fontsize=26, color="#dbe6ff", va="top")
abstract = (f"Абстракт. Цель — подтверждать IT-навыки школьников не по словам, а по коду на GitHub, и проверить надёжность такой оценки. "
            f"Гипотеза: ИИ, получающий факты из репозитория и работающий по строгой рубрике, согласуется с объективными метриками, воспроизводится и не поддаётся обману. "
            f"Апробация на {R['n_repos']} репозиториях трёх уровней (×3 прогона): ρ = {num(spc['rho'])} с объективным индексом ({pf(spc['p'])}), "
            f"медианы {num(bs['S1']['median'])} / {num(bs['S2']['median'])} / {num(bs['S3']['median'])}, ICC = {num(R['icc1'])}"
            + (f", успешных prompt-инъекций {R['B_injection_success']} из {R['B_n']}." if R.get("B_n") else "."))
ax.add_patch(FancyBboxPatch((66, H - 22.5), 66, 21, boxstyle="round,pad=0,rounding_size=1", fc="white", ec="none", alpha=.95))
text(67.5, H - 3.2, abstract, 92, size=21.5)

col_w, gap, top, bottom = 41.6, 2, H - 26, 2
xs = [2, 2 + col_w + gap, 2 + 2 * (col_w + gap)]

# ---- колонка 1: проблема, цель, аналоги ----
panel(xs[0], 62, col_w, top - 62, "1. Проблема")
text(xs[0] + 1.5, top - 6, "Оценки и сертификаты не показывают, умеет ли школьник сделать работающий проект. Сильные ученики из обычных школ остаются незаметными для стажировок и грантов, а отбор опирается на самоописание, которое нельзя проверить. ИИ умеет оценивать, но его оценки могут быть нестабильны и уязвимы для prompt injection.", 52)
text(xs[0] + 1.5, top - 21.5, "Цель: создать Verix и экспериментально проверить, можно ли доверять AI-оценке навыка по коду.\n\nГипотеза:\nH1 — оценка согласуется с объективными метриками;\nH2 — различает учебные, самостоятельные и зрелые проекты;\nH3 — воспроизводится при повторе;\nH4 — не растёт от завышенного описания и инъекции.", 52)
panel(xs[0], bottom, col_w, 58, "2. Аналоги и решение")
text(xs[0] + 1.5, 54.5, "LinkedIn — самоописание · GitHub — данные без оценки · LeetCode — короткие задачи · сертификаты — факт прохождения курса.\nVerix — оценка собственного проекта ученика по коду + подбор возможностей + личный план.", 52, size=22)
text(xs[0] + 1.5, 39.5, "SkillProof: 1) проверка ссылки и лимит запросов; 2) сбор фактов из GitHub — дерево файлов, коммиты, авторы, тесты, CI, README, ключевые файлы; 3) рубрика и строгая JSON-схема; 4) данные ученика — как недоверенные; 5) зажим баллов 0–100.", 52, size=22)
image(FIG / "fig5_arch.png", xs[0] + 1.5, bottom + 1.5, col_w - 3)

# ---- колонка 2: методика и H1–H2 ----
panel(xs[1], bottom, col_w, top - bottom, "3. Апробация")
text(xs[1] + 1.5, top - 6, f"{R['n_repos']} публичных репозиториев отобраны не вручную, а заранее заданными запросами: S1 учебные, S2 самостоятельные, S3 зрелые (JS и Python, 1 репозиторий на автора). Каждый оценён 3 раза рабочим сервисом. Объективный индекс сложности — по git-истории: файлы, объём кода, коммиты, авторы, тесты, CI, длительность.", 52, size=22)
h1 = image(FIG / "fig1_strata.png", xs[1] + 1.5, 52, col_w - 3)
image(FIG / "fig2_validity.png", xs[1] + 1.5, 52 - h1 - 1, col_w - 3)

# ---- колонка 3: H3–H4, выводы ----
panel(xs[2], 50, col_w, top - 50, "4. Надёжность и защита")
h3 = image(FIG / "fig3_retest.png", xs[2] + 1.5, top - 6 - 26.5, col_w - 3)
if (FIG / "fig4_robustness.png").exists():
    image(FIG / "fig4_robustness.png", xs[2] + 1.5, top - 6 - 26.5 - h3 - 0.5, col_w - 3)
panel(xs[2], bottom, col_w, 46, "5. Выводы", color="#ecfdf3")
concl = (f"• Оценка сложности согласуется с объективным индексом: ρ = {num(spc['rho'])}, {pf(spc['p'])}.\n"
         f"• Медианы S1/S2/S3: {num(bs['S1']['median'])} / {num(bs['S2']['median'])} / {num(bs['S3']['median'])} (Краскел–Уоллис {pf(R['kruskal']['p'])}).\n"
         f"• Воспроизводимость ICC = {num(R['icc1'])}.\n"
         + (f"• Prompt-инъекция дала 90+ в {R['B_injection_success']} из {R['B_n']} случаев.\n" if R.get("B_n") else "")
         + "• Ограничения: индекс — приближение; одна модель; авторство — по коммитам.\n• Дальше: вход через GitHub, сравнение с учителями, казахский интерфейс.")
text(xs[2] + 1.5, 42, concl, 50, size=22)
qr = qrcode.make("https://verix-khaki.vercel.app"); qp = OUT / "qr.png"; qr.save(qp)
image(qp, xs[2] + col_w - 15, bottom + 1.5, 13)
ax.text(xs[2] + 1.5, bottom + 9, "Попробуйте сами:\nverix-khaki.vercel.app\nКод и данные:\ngithub.com/romiisromie/verix", fontsize=22, color=INK, va="top", linespacing=1.35)

fig.savefig(OUT / "Verix_стенд.pdf")
fig.savefig(OUT / "Verix_стенд_превью.png", dpi=14)
print("ok")
