# Скриншоты рабочего сайта для научной работы и стенда (экран телефона).
# Сценарий как у настоящего ученика: опрос → проверка проекта по коду → навык в профиле.
# Запуск: pip install playwright && python research/paper/screenshots.py [URL]
# Используется установленный Microsoft Edge (channel="msedge"), скачивать браузер не нужно.
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "https://verix-khaki.vercel.app/"
OUT = Path(__file__).resolve().parents[1] / "fig" / "screens"
OUT.mkdir(parents=True, exist_ok=True)
REPO = "https://github.com/romiisromie/verix"

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge")
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, locale="ru-RU", service_workers="block")
    page = ctx.new_page()
    shot = lambda name: page.screenshot(path=OUT / name)
    wait = page.wait_for_timeout

    page.goto(URL, wait_until="networkidle")
    page.evaluate("localStorage.clear(); vxSetLang('ru')")
    page.reload(wait_until="networkidle")
    shot("01_login.png")

    # Первый вход → опрос
    page.click("text=Попробовать без регистрации")
    page.wait_for_selector("#obName", timeout=10_000)
    wait(4000)  # уведомление «Демо-режим» успевает исчезнуть
    page.fill("#obName", "Рамина Ибраимова")
    page.click(".ob-chip[data-group='grade'][data-value='11 класс']")
    page.click(".ob-chip[data-group='tags'][data-value='Frontend']")
    page.click(".ob-chip[data-group='tags'][data-value='AI/ML']")
    page.click(".ob-chip[data-group='goal'][data-value='Frontend Engineer']")
    page.click(".ob-chip[data-group='level'][data-value='Есть свой проект']")
    shot("00_onboarding.png")
    page.evaluate("vxObSave()")
    wait(4500)

    # SkillProof по коду и навык в профиль
    page.evaluate("switchTab('skillproof')")
    page.click(".sk-sel:has-text('Web')")
    page.fill("#projRepo", REPO)
    page.click("#analyzeBtn")
    page.wait_for_selector("#aiResult.show", timeout=90_000)
    wait(5000)
    page.evaluate("document.getElementById('aiResult').scrollIntoView({block:'start'})")
    wait(600)
    shot("03_skillproof.png")
    page.evaluate("saveSkill()")
    wait(5000)
    page.evaluate("switchTab('profile'); window.scrollTo(0,0)")
    wait(1500)
    shot("02_profile.png")

    page.evaluate("switchTab('talent')")
    wait(1500)
    shot("04_talentmatch.png")

    page.evaluate("switchTab('edupath'); window.scrollTo(0,0)")
    wait(1200)
    shot("05_edupath.png")
    page.evaluate("rmOpenTask(1,0)")
    wait(1200)
    shot("08_task_guide.png")
    page.evaluate("closeModal()")
    wait(500)

    page.evaluate("vxSetLang('kk'); switchTab('profile'); window.scrollTo(0,0)")
    wait(1500)
    shot("06_profile_kk.png")
    page.evaluate("vxSetLang('en'); switchTab('skillproof'); window.scrollTo(0,0)")
    wait(1200)
    shot("07_skillproof_en.png")
    browser.close()
print("ok", OUT)
