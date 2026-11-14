# Скриншоты рабочего сайта для научной работы и стенда (экран телефона).
# Запуск: pip install playwright && python research/paper/screenshots.py [URL]
# Используется установленный Microsoft Edge (channel="msedge"), скачивать браузер не нужно.
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "https://verix-khaki.vercel.app/"
OUT = Path(__file__).resolve().parents[1] / "fig" / "screens"
OUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge")
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, locale="ru-RU", service_workers="block")
    page = ctx.new_page()
    page.goto(URL, wait_until="networkidle")
    page.evaluate("localStorage.clear(); vxSetLang('ru')")
    page.reload(wait_until="networkidle")
    page.screenshot(path=OUT / "01_login.png")

    page.evaluate("demoLogin()")
    page.wait_for_timeout(5000)  # ждём, пока исчезнут всплывающие уведомления
    page.screenshot(path=OUT / "02_profile.png")

    page.evaluate("switchTab('skillproof')")
    page.click(".sk-sel:has-text('Web')")
    page.fill("#projRepo", "https://github.com/romiisromie/verix")
    page.click("#analyzeBtn")
    page.wait_for_selector("#aiResult.show", timeout=90_000)
    page.wait_for_timeout(5000)  # уведомление об XP успевает исчезнуть
    page.evaluate("document.getElementById('aiResult').scrollIntoView({block:'start'})")
    page.wait_for_timeout(600)
    page.screenshot(path=OUT / "03_skillproof.png")

    page.evaluate("switchTab('talent')")
    page.wait_for_timeout(1200)
    page.screenshot(path=OUT / "04_talentmatch.png")

    page.evaluate("switchTab('edupath')")
    page.wait_for_timeout(1200)
    page.screenshot(path=OUT / "05_edupath.png")

    page.evaluate("vxSetLang('kk'); switchTab('profile'); window.scrollTo(0,0)")
    page.wait_for_timeout(5000)
    page.screenshot(path=OUT / "06_profile_kk.png")
    page.evaluate("vxSetLang('en'); switchTab('skillproof')")
    page.wait_for_timeout(800)
    page.screenshot(path=OUT / "07_skillproof_en.png")
    browser.close()
print("ok", OUT)
