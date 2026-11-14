# Шаг 3 апробации: статистическая обработка прогонов SkillProof и построение графиков.
# Запуск: python research/analyze.py  →  research/data/results.json, research/fig/*.png
# Нужны: pip install scipy matplotlib
import json, math, statistics as st
from pathlib import Path
from scipy import stats
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).parent
DATA, FIG = ROOT / "data", ROOT / "fig"
FIG.mkdir(exist_ok=True)
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 11, "figure.dpi": 160})

all_repos = json.loads((DATA / "sample.json").read_text(encoding="utf-8"))["repos"]
sample = [s for s in all_repos if s.get("software", True)]  # правило исключения задано до прогонов
runs = [json.loads(l) for l in (DATA / "runs.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]
ok = [r for r in runs if r["status"] == 200]
by_repo = {s["repo"]: s for s in sample}
NAMES = {"S1": "учебные", "S2": "самостоятельные", "S3": "зрелые"}

# --- объективный индекс сложности (средний z-score логарифмов метрик) ---
FEATS = ["code_files", "code_kb", "commits", "contributors", "test_files", "active_days"]
def z(vals):
    m, s = st.mean(vals), st.pstdev(vals) or 1
    return [(v - m) / s for v in vals]
cols = {f: z([math.log1p(s[f]) for s in sample]) for f in FEATS}
cols["ci"] = z([1.0 if s["ci"] else 0.0 for s in sample])
for i, s in enumerate(sample):
    s["index"] = st.mean(cols[f][i] for f in cols)

# --- эксперимент A ---
A = [r for r in ok if r["exp"] == "A"]
per = {}
for r in A:
    per.setdefault(r["repo"], []).append(r)
rows = []
for repo, rs in per.items():
    rs.sort(key=lambda r: r["run"])
    s = by_repo[repo]
    rows.append({
        "repo": repo, "stratum": s["stratum"], "index": s["index"], "n": len(rs),
        "overall": st.mean(r["overall"] for r in rs), "complexity": st.mean(r["complexity"] for r in rs),
        "originality": st.mean(r["originality"] for r in rs),
        "overall_runs": [r["overall"] for r in rs], "levels": [r["level"] for r in rs],
    })
full = [r for r in rows if r["n"] >= 3]

def spearman(x, y):
    rho, p = stats.spearmanr(x, y)
    return {"rho": round(float(rho), 3), "p": float(p), "n": len(x)}

res = {"n_repos": len(sample), "n_sampled": len(all_repos), "n_excluded": len(all_repos) - len(sample), "n_calls": len(runs), "n_ok": len(ok)}
res["strata_sizes"] = {k: sum(1 for s in sample if s["stratum"] == k) for k in NAMES}
res["spearman_complexity_index"] = spearman([r["index"] for r in rows], [r["complexity"] for r in rows])
res["spearman_overall_index"] = spearman([r["index"] for r in rows], [r["overall"] for r in rows])
groups = {k: [r["overall"] for r in rows if r["stratum"] == k] for k in NAMES}
H, p = stats.kruskal(*[g for g in groups.values() if g])
res["kruskal"] = {"H": round(float(H), 2), "p": float(p)}
res["by_stratum"] = {k: {"n": len(g), "median": round(st.median(g), 1), "mean": round(st.mean(g), 1),
                         "min": min(g), "max": max(g)} for k, g in groups.items() if g}
pairs = [("S1", "S2"), ("S2", "S3"), ("S1", "S3")]
res["mannwhitney"] = {f"{a}-{b}": float(stats.mannwhitneyu(groups[a], groups[b], alternative="less").pvalue) for a, b in pairs}

# воспроизводимость: ICC(1,1), средний разброс, совпадение уровня
k = 3
mat = [r["overall_runs"][:k] for r in full]
n = len(mat)
grand = st.mean(v for row in mat for v in row)
msb = k * sum((st.mean(row) - grand) ** 2 for row in mat) / (n - 1)
msw = sum((v - st.mean(row)) ** 2 for row in mat for v in row) / (n * (k - 1))
res["icc1"] = round((msb - msw) / (msb + (k - 1) * msw), 3)
res["mean_sd"] = round(st.mean(st.stdev(row) for row in mat), 2)
res["max_range"] = max(max(row) - min(row) for row in mat)
res["share_range_le5"] = round(sum(1 for row in mat if max(row) - min(row) <= 5) / n, 3)
res["level_agree_all"] = round(sum(1 for r in full if len(set(r["levels"][:k])) == 1) / n, 3)
res["n_retest"] = n

# --- эксперимент B ---
B = [r for r in ok if r["exp"] == "B"]
cond = {}
for r in B:
    cond.setdefault(r["repo"], {})[r["cond"]] = r["overall"]
code_only = {r["repo"]: r["overall"] for r in rows}
complete = [rep for rep, c in cond.items() if {"honest", "inflated", "injection"} <= c.keys() and rep in code_only]
res["B_n"] = len(complete)
if complete:
    for c in ["honest", "inflated", "injection"]:
        res[f"B_{c}_mean"] = round(st.mean(cond[rep][c] for rep in complete), 1)
    res["B_code_only_mean"] = round(st.mean(code_only[rep] for rep in complete), 1)
    diff_inf = [cond[rep]["inflated"] - cond[rep]["honest"] for rep in complete]
    diff_inj = [cond[rep]["injection"] - cond[rep]["honest"] for rep in complete]
    res["B_inflated_minus_honest"] = round(st.mean(diff_inf), 1)
    res["B_injection_minus_honest"] = round(st.mean(diff_inj), 1)
    res["B_injection_max"] = max(cond[rep]["injection"] for rep in complete)
    res["B_injection_success"] = sum(1 for rep in complete if cond[rep]["injection"] >= 90)
    res["B_inflated_raised"] = sum(1 for d in diff_inf if d > 5)
    try:
        res["B_wilcoxon_inflated_p"] = float(stats.wilcoxon(diff_inf).pvalue)
    except ValueError:
        res["B_wilcoxon_inflated_p"] = None

# --- скорость и надёжность ---
ms = sorted(r["ms"] for r in ok)
res["latency_median_s"] = round(st.median(ms) / 1000, 1)
res["latency_p90_s"] = round(ms[int(0.9 * (len(ms) - 1))] / 1000, 1)
res["success_rate"] = round(len(ok) / len(runs), 3)
res["errors"] = {}
for r in runs:
    if r["status"] != 200:
        res["errors"][str(r["status"])] = res["errors"].get(str(r["status"]), 0) + 1

(DATA / "results.json").write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
(DATA / "per_repo.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")

# --- графики ---
COL = {"S1": "#f59e0b", "S2": "#2f6bff", "S3": "#12b76a"}
fig, ax = plt.subplots(figsize=(6.4, 4))
data = [groups[k] for k in NAMES]
bp = ax.boxplot(data, patch_artist=True, widths=0.55)
for patch, k in zip(bp["boxes"], NAMES):
    patch.set_facecolor(COL[k]); patch.set_alpha(.55)
for i, k in enumerate(NAMES, 1):
    ax.scatter([i] * len(groups[k]), groups[k], color=COL[k], s=18, zorder=3)
ax.set_xticks([1, 2, 3], [f"{NAMES[k]}\n(n={len(groups[k])})" for k in NAMES])
ax.set_ylabel("Общий балл SkillProof (среднее 3 прогонов)")
ax.set_title(f"Рис. 1. Оценка по группам репозиториев (Краскел–Уоллис p={res['kruskal']['p']:.1e})", fontsize=10)
ax.set_ylim(0, 100); ax.grid(axis="y", alpha=.3)
fig.tight_layout(); fig.savefig(FIG / "fig1_strata.png"); plt.close(fig)

fig, ax = plt.subplots(figsize=(6.4, 4))
for k in NAMES:
    pts = [r for r in rows if r["stratum"] == k]
    ax.scatter([r["index"] for r in pts], [r["complexity"] for r in pts], color=COL[k], label=NAMES[k], s=28)
ax.set_xlabel("Объективный индекс сложности репозитория (z-оценка)")
ax.set_ylabel("Сложность по SkillProof")
sp = res["spearman_complexity_index"]
ax.set_title(f"Рис. 2. AI-оценка сложности и объективные метрики (ρ={sp['rho']}, n={sp['n']})", fontsize=10)
ax.legend(); ax.grid(alpha=.3); ax.set_ylim(0, 100)
fig.tight_layout(); fig.savefig(FIG / "fig2_validity.png"); plt.close(fig)

fig, ax = plt.subplots(figsize=(6.4, 4))
r1 = [row[0] for row in mat]; r2 = [row[1] for row in mat]; r3 = [row[2] for row in mat]
ax.scatter(r1, r2, s=26, label="прогон 1 vs 2", color="#2f6bff")
ax.scatter(r1, r3, s=26, label="прогон 1 vs 3", color="#ff4f9a", marker="^")
ax.plot([0, 100], [0, 100], color="gray", lw=1, ls="--")
ax.set_xlabel("Балл в прогоне 1"); ax.set_ylabel("Балл в повторном прогоне")
ax.set_title(f"Рис. 3. Воспроизводимость оценки (ICC={res['icc1']}, n={n})", fontsize=10)
ax.set_xlim(0, 100); ax.set_ylim(0, 100); ax.legend(); ax.grid(alpha=.3)
fig.tight_layout(); fig.savefig(FIG / "fig3_retest.png"); plt.close(fig)

if complete:
    fig, ax = plt.subplots(figsize=(6.4, 4))
    labels = ["только код", "честное\nописание", "завышенное\nописание", "prompt-\nинъекция"]
    vals = [res["B_code_only_mean"], res["B_honest_mean"], res["B_inflated_mean"], res["B_injection_mean"]]
    bars = ax.bar(labels, vals, color=["#94a3b8", "#12b76a", "#f59e0b", "#ff4d3d"])
    for b, v in zip(bars, vals):
        ax.text(b.get_x() + b.get_width() / 2, v + 1.5, f"{v}", ha="center")
    ax.set_ylim(0, 100); ax.set_ylabel("Средний общий балл")
    ax.set_title(f"Рис. 4. Устойчивость к обману (учебные репозитории, n={len(complete)})", fontsize=10)
    ax.grid(axis="y", alpha=.3)
    fig.tight_layout(); fig.savefig(FIG / "fig4_robustness.png"); plt.close(fig)

print(json.dumps(res, ensure_ascii=False, indent=2))
