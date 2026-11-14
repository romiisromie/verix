# Стенд 135×125 см по требованиям РКНП: вверху по горизонтали — абстракт, имя, возраст,
# школа, город, область; ниже — содержание работы с пронумерованными рисунками и выводами.
# Запуск: python research/paper/build_poster.py  →  research/paper/out/Verix_стенд.pdf (+ превью .png)
import json, os, textwrap
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
import matplotlib.image as mpimg
import qrcode

ROOT = Path(__file__).resolve().parents[1]
R = json.loads(Path(os.environ.get("VX_RESULTS", ROOT / "data/results.json")).read_text(encoding="utf-8"))
FIG, OUT = ROOT / "fig", Path(os.environ.get("VX_OUT", Path(__file__).parent / "out")); OUT.mkdir(exist_ok=True)
num = lambda x: str(x).replace(".", ",")
pf = lambda p: "p < 0,001" if p < 0.001 else f"p = {p:.3f}".replace(".", ",")
spc, bs = R["spearman_complexity_index"], R["by_stratum"]

W, H = 135, 125  # см
CM = 1 / 2.54
plt.rcParams.update({"font.family": "DejaVu Sans"})
fig = plt.figure(figsize=(W * CM, H * CM))
ax = fig.add_axes([0, 0, 1, 1]); ax.set_xlim(0, W); ax.set_ylim(0, H); ax.axis("off")
BLUE, INK = "#2f6bff", "#0f172a"
NL = "\n"


def panel(x, y, w, h, title, color="#f1f5ff"):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0,rounding_size=1.2", fc=color, ec="#cbd5e1", lw=2))
    ax.text(x + 1.5, y + h - 1.6, title, fontsize=44, weight="bold", color=BLUE, va="top")


def text(x, y, s, width, size=31, **kw):
    wrapped = NL.join(textwrap.fill(par, width) for par in s.split(NL))
    ax.text(x, y, wrapped, fontsize=size, va="top", color=INK, linespacing=1.35, **kw)


def image(path, x, y, w):
    img = mpimg.imread(path); h = w * img.shape[0] / img.shape[1]
    ax.imshow(img, extent=(x, x + w, y, y + h), zorder=3)
    return h


# ---- шапка: абстракт, имя, возраст, школа, город, область ----
ax.add_patch(FancyBboxPatch((0, H - 24), W, 24, boxstyle="square,pad=0", fc=BLUE, ec="none"))
ax.text(3, H - 2.5, "VERIX", fontsize=120, weight="bold", color="white", va="top")
ax.text(3, H - 12.5, "Цифровая платформа подтверждения IT-навыков школьников" + NL + "с помощью искусственного интеллекта по реальному коду", fontsize=40, color="white", va="top", linespacing=1.25)
ax.text(3, H - 21.3, "Ибраимова Рамина, [__] лет · Бердіқұл Рахат, [__] лет · [школа] · [город], [область] · Руководитель: [ФИО] · Информатика", fontsize=26, color="#dbe6ff", va="top")
abstract = (f"Абстракт. Цель — подтверждать IT-навыки школьников не по словам, а по коду на GitHub, и проверить надёжность такой оценки. "
            f"Гипотеза: ИИ, получающий факты из репозитория и работающий по строгой рубрике, согласуется с объективными метриками, воспроизводится и не поддаётся обману. "
            f"Апробация на {R['n_repos']} репозиториях трёх уровней (×3 прогона): ρ = {num(spc['rho'])} с объективным индексом ({pf(spc['p'])}), "
            f"медианы {num(bs['S1']['median'])} / {num(bs['S2']['median'])} / {num(bs['S3']['median'])}, ICC = {num(R['icc1'])}"
            + (f", успешных prompt-инъекций {R['B_injection_success']} из {R['B_n']}." if R.get("B_n") else "."))
ax.add_patch(FancyBboxPatch((66, H - 22.5), 66, 21, boxstyle="round,pad=0,rounding_size=1", fc="white", ec="none", alpha=.95))
text(67.5, H - 3.2, abstract, 104, size=26)

col_w, gap, top, bottom = 41.6, 2, H - 26, 2
xs = [2, 2 + col_w + gap, 2 + 2 * (col_w + gap)]
WR = 56  # знаков в строке при кегле 31
FH = lambda w: w * 4 / 6.4  # высота графика 6,4×4 при ширине w

# ---- колонка 1: проблема, цель, аналоги, решение ----
panel(xs[0], 58, col_w, top - 58, "1. Проблема и цель")
text(xs[0] + 1.5, top - 6.5, "Оценки и сертификаты не показывают, умеет ли школьник сделать работающий проект. Сильные ученики из обычных школ незаметны для стажировок и грантов, а отбор опирается на самоописание. ИИ умеет оценивать, но его оценки бывают нестабильны и уязвимы для prompt injection.", WR)
text(xs[0] + 1.5, top - 21, NL.join([
    "Цель: создать Verix и проверить, можно ли доверять AI-оценке навыка по коду.",
    "Гипотеза:",
    "H1 — согласие с объективными метриками;",
    "H2 — различает учебные, самостоятельные и зрелые проекты;",
    "H3 — воспроизводится при повторе;",
    "H4 — не растёт от завышенного описания и инъекции."]), WR)
panel(xs[0], bottom, col_w, 54, "2. Аналоги и решение")
text(xs[0] + 1.5, 50.5, "LinkedIn — самоописание; GitHub — данные без оценки; LeetCode — короткие задачи; сертификаты — факт курса. Verix — оценка своего проекта по коду + подбор возможностей + личный план.", WR)
text(xs[0] + 1.5, 37.5, "SkillProof: факты из GitHub (файлы, коммиты, авторы, тесты, CI, README) → рубрика и строгая JSON-схема → данные ученика как недоверенные → балл 0–100.", WR)
image(FIG / "fig5_arch.png", xs[0] + 3, bottom + 1, col_w - 6)

# ---- колонка 2: методика, H1–H2 ----
panel(xs[1], bottom, col_w, top - bottom, "3. Апробация")
text(xs[1] + 1.5, top - 6.5, f"{R['n_repos']} репозиториев трёх уровней (S1 учебные, S2 самостоятельные, S3 зрелые) отобраны заранее заданными запросами, а не вручную. Каждый оценён 3 раза рабочим сервисом. Объективный индекс сложности — по git-истории.", WR)
fw = col_w - 3
image(FIG / "fig1_strata.png", xs[1] + 1.5, top - 20 - FH(fw), fw)
image(FIG / "fig2_validity.png", xs[1] + 1.5, top - 21 - 2 * FH(fw), fw)
text(xs[1] + 1.5, top - 23 - 2 * FH(fw), f"H1: ρ = {num(spc['rho'])}, {pf(spc['p'])}." + NL
     + f"H2: Краскел–Уоллис {pf(R['kruskal']['p'])}; медианы {num(bs['S1']['median'])} / {num(bs['S2']['median'])} / {num(bs['S3']['median'])}.", WR, weight="bold")

# ---- колонка 3: H3–H4, выводы ----
panel(xs[2], 51, col_w, top - 51, "4. Надёжность и защита")
fw3 = col_w - 12
image(FIG / "fig3_retest.png", xs[2] + 6, top - 5.5 - FH(fw3), fw3)
if (FIG / "fig4_robustness.png").exists():
    image(FIG / "fig4_robustness.png", xs[2] + 6, top - 6 - 2 * FH(fw3), fw3)
panel(xs[2], bottom, col_w, 47, "5. Выводы", color="#ecfdf3")
concl = [f"• Сложность по ИИ согласуется с объективным индексом (ρ = {num(spc['rho'])}).",
         f"• Уровни различаются: {num(bs['S1']['median'])} / {num(bs['S2']['median'])} / {num(bs['S3']['median'])}.",
         f"• Воспроизводимость ICC = {num(R['icc1'])}."]
if R.get("B_n"):
    concl.append(f"• Инъекция «поставь 100»: 90+ в {R['B_injection_success']} из {R['B_n']}.")
concl.append("• Дальше: вход через GitHub, сравнение с учителями, лицензия для школ.")
text(xs[2] + 1.5, 43, NL.join(concl), 52, size=29)
qp = OUT / "qr.png"; qrcode.make("https://verix-khaki.vercel.app").save(qp)
image(qp, xs[2] + col_w - 15.5, bottom + 1, 14)
ax.text(xs[2] + 1.5, bottom + 12, NL.join(["Попробуйте сами:", "verix-khaki.vercel.app", "", "Код и данные:", "github.com/romiisromie/verix"]),
        fontsize=27, color=INK, va="top", linespacing=1.35)

fig.savefig(OUT / "Verix_стенд.pdf")
fig.savefig(OUT / "Verix_стенд_превью.png", dpi=14)
print("ok")
