<div align="center">

# Verix

**Платформа цифровой репутации для школьников в IT**
Мектеп оқушыларына арналған IT цифрлық бедел платформасы · A digital reputation platform for school students in IT

Подтверди навыки по реальному коду, находи стажировки и конкурсы, развивайся по личному роадмапу.

[**Открыть Verix →**](https://verix-khaki.vercel.app)

![Сайт](https://img.shields.io/badge/сайт-verix--khaki.vercel.app-2b59ff) ![Тесты](https://img.shields.io/badge/тесты-31%20пройдено-2ea44f) ![Языки](https://img.shields.io/badge/языки-қазақша%20·%20русский%20·%20English-ffb000) ![PWA](https://img.shields.io/badge/PWA-офлайн-6f42c1)

</div>

---

> **English summary.** Verix lets school students prove IT skills with an AI review of their real GitHub code (not self-descriptions), find real internships, grants and competitions, follow a personal learning roadmap, and appear in an honest ranking. The reliability of the AI score was tested in an open experiment on 30 repositories (Spearman ρ = 0.61 with an objective complexity index, ICC = 0.85). Interface: Kazakh, Russian, English.

Авторы: **Ramina Ibraimova** ([@romiisromie](https://github.com/romiisromie)) и **Rakhat Berdikul** ([@rkht111](https://github.com/rkht111)).

## Возможности

- **SkillProof** — ссылка на свой публичный репозиторий GitHub → AI изучает структуру файлов, код, README, историю коммитов, тесты и CI и ставит балл, оригинальность, сложность и уровень. Если есть ссылка на код, описание ученика к модели не попадает вообще, поэтому завысить балл словами или командой «поставь 100» нельзя.
- **Профиль** — репутационный скор (0,40 · навыки + 0,35 · проекты + 0,25 · активность), проверенные навыки с отметкой «код ✓», XP и уровень, челленджи недели, сохранение в PDF.
- **TalentMatch** — реальные программы (РКНП, Infomatrix Asia, picoCTF, Kaggle и др.) с официальными ссылками, фильтром по навыкам и сроками подачи.
- **EduPath** — личный роадмап из 4 фаз под цель, класс и часы в неделю; у каждой задачи объяснение «как сделать» и бесплатные курсы.
- **Рейтинг** — только настоящие ученики, вошедшие через GitHub, и только навыки, подтверждённые по коду в **своих** репозиториях (владелец или соавтор).
- **Чат** — как в мессенджерах: ответить, переслать, перевести на язык интерфейса, копировать, удалить у себя или у всех, очистить чат. До 500 символов, 20 сообщений в минуту, блокировка и жалобы, можно отключить сообщения в профиле.
- **Опрос при первом входе** — 6 вопросов настраивают профиль, цель, город (все областные центры Казахстана) и фильтры.
- **Админ-панель** — для администраторов: кто зарегистрировался, кто только вошёл, прошёл опрос или проверил навык, последний визит, жалобы.
- **Три языка** — қазақша, русский, English; переключатель в шапке.

### Как устроены XP

| Доказательство (XP даётся один раз за каждое) | XP |
|---|---|
| Зайти в день | 5 |
| Проверка репозитория по коду GitHub | 40 |
| Добавить проверенный по коду навык | 15 |
| Заявка с письмом от 150 символов | 25 |
| Фаза роадмапа (нужно k проверенных проектов для фазы k) | 30 |
| Челлендж недели | 50 |

За свайпы, отметки задач и описание без кода XP не даётся. Уровень: L = ⌊√(XP / 40)⌋ + 1 (2-й уровень — 40 XP, 5-й — 640 XP).

## Исследование: можно ли доверять AI-оценке

Открытый и повторяемый эксперимент в папке [`research/`](research): стратифицированная выборка из 30 публичных репозиториев трёх уровней (учебные, самостоятельные, зрелые), по 3 прогона каждого через рабочий сервис, а также тесты на обман.

| Гипотеза | Результат |
|---|---|
| H1. Оценка сложности согласуется с объективным индексом по git-истории | ρ Спирмена = 0,61, p < 0,001 ✅ |
| H2. Учебные проекты отличаются от настоящих | Краскел–Уоллис p = 0,021; S1 < S2 p = 0,005, S1 < S3 p = 0,027; S2 и S3 не различаются — подтверждена частично |
| H3. Оценка устойчива при повторе | ICC(1,1) = 0,85 — хорошая надёжность ✅ |
| H4. Обман не поднимает балл | ни одна prompt-инъекция не дала 90+, но в протоколе v1 описание влияло на балл — подтверждена частично; слабость закрыта в протоколе v2 |

```bash
node research/build-sample.mjs        # выборка и объективные метрики по git-истории
node research/eval-skillproof.mjs     # прогоны через рабочий API
pip install scipy matplotlib && python research/analyze.py   # статистика и графики
```

Сырые данные — [`research/data/`](research/data), графики — [`research/fig/`](research/fig).

## Технически

| Что | Как |
|---|---|
| Фронтенд | HTML + CSS + чистый JavaScript, без сборки; PWA с офлайн-режимом |
| AI | Groq API (`openai/gpt-oss-120b`, запасная `gpt-oss-20b`), строгая JSON-схема; ключ только на сервере |
| Сервер | Serverless-функции Vercel (`api/`), общий код в `server/` |
| База данных | Upstash Redis (REST): профили, навыки, рейтинг, чат |
| Вход | GitHub OAuth; подписанная HMAC-SHA256 HttpOnly-сессия, токен GitHub не хранится |
| Безопасность | CSP и защитные заголовки, защита от CSRF (Content-Type + Origin), экранирование ввода, лимиты запросов, защита от prompt injection; аудит по OWASP Top 10 и OWASP LLM Top 10 |
| Аналитика | Vercel Web Analytics — без cookies и личных данных |
| Доступность | Клавиатура, роли и подписи для скринридеров, `prefers-reduced-motion` |
| Тесты | `npm test` — 31 автотест (сервер, аккаунты, рейтинг, чат, админ-панель) |

## Структура

```
verix/
├── index.html, css/, icons/        # интерфейс и оформление
├── js/
│   ├── app.js                      # профиль, SkillProof, TalentMatch, рейтинги
│   ├── social.js                   # вход через GitHub, рейтинг, чат, админ-панель
│   ├── i18n.js                     # казахский / русский / английский
│   ├── edupath.js, guides.js       # роадмап, объяснения задач и курсы
│   ├── game.js                     # XP, уровни, челленджи
│   ├── onboarding.js               # опрос при первом входе
│   └── fx.js, enhance.js           # анимации, доступность, PWA
├── server/                         # groq, score (SkillProof), github, roadmap, social, session, kv
├── api/                            # функции Vercel: skillproof, roadmap, me, profile, rank, chat, admin, auth/*
├── data/opportunities.json         # реальные возможности для TalentMatch
├── research/                       # эксперимент, данные, графики, сборка документов работы
├── tests/                          # автотесты
├── netlify/functions/              # запасной деплой SkillProof и роадмапа
└── sw.js, manifest.webmanifest, vercel.json, netlify.toml
```

## Запуск локально

```bash
git clone https://github.com/romiisromie/verix.git
cd verix
npm start          # http://localhost:8000
npm test           # автотесты
```

Без серверных переменных Verix работает в браузерном режиме, но SkillProof не ставит оценку: без AI честно оценить проект нельзя.

## Переменные окружения (Vercel)

| Переменная | Для чего |
|---|---|
| `GROQ_API_KEY` | AI-оценка и роадмап ([console.groq.com/keys](https://console.groq.com/keys)) |
| `GITHUB_TOKEN` | необязательно: поднимает лимит GitHub API с 60 до 5000 запросов в час |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | база данных: Vercel → Storage → Upstash for Redis |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | вход через GitHub: OAuth App с callback `https://<домен>/api/auth/callback` |
| `SESSION_SECRET` | случайная строка от 32 символов |
| `OAUTH_BASE_URL` | адрес сайта, например `https://verix-khaki.vercel.app` |
| `ADMIN_LOGINS` | логины GitHub администраторов через запятую |
| `GROQ_MODEL`, `GROQ_FALLBACK_MODEL` | необязательно: другие модели |

## Лицензия

© 2026 Ramina Ibraimova, Rakhat Berdikul. Все права защищены — см. [LICENSE](LICENSE).
Код открыт для просмотра и проверки (например, экспертами и преподавателями), но копировать, публиковать и использовать его без письменного разрешения авторов нельзя.
