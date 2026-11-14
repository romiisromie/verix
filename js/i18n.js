// Многоязычный интерфейс Verix: русский (исходный), казахский, английский.
// Переводчик работает поверх готового интерфейса: находит русские тексты в DOM
// (включая то, что приложение дорисовывает на ходу) и подменяет их по словарю.
// Исходный русский текст запоминается, поэтому язык можно переключать в любой момент.
(function () {
  "use strict";
  const LANGS = ["kk", "ru", "en"]; // порядок кнопок: казахский, русский, английский
  const LABEL = { ru: "RU", kk: "KZ", en: "EN" };
  const COL = { kk: 1, en: 2 }; // столбец перевода в словаре
  const HTML_LANG = { ru: "ru", kk: "kk", en: "en" };

  // [русский, қазақша, English]
  const PAIRS = [
    // --- вход ---
    ["Verix — цифровая репутация школьников в IT", "Verix — оқушылардың IT саласындағы цифрлық беделі", "Verix — digital reputation for students in IT"],
    ["Перейти к приложению", "Қосымшаға өту", "Skip to the app"],
    ["Для работы Verix нужен JavaScript. Включи его в настройках браузера.", "Verix жұмыс істеуі үшін JavaScript керек. Оны браузер баптауларында қос.", "Verix needs JavaScript. Turn it on in your browser settings."],
    ["учись · прокачивайся · побеждай", "үйрен · дамы · жеңіске жет", "learn · level up · win"],
    ["Пароль", "Құпиясөз", "Password"],
    ["минимум 6 символов", "кемінде 6 таңба", "at least 6 characters"],
    ["Войти в Verix", "Verix-ке кіру", "Sign in to Verix"],
    ["Попробовать без регистрации", "Тіркелмей көру", "Try without signing up"],
    ["Ещё нет аккаунта?", "Аккаунтың жоқ па?", "No account yet?"],
    ["Зарегистрироваться", "Тіркелу", "Sign up"],
    ["Как это работает", "Бұл қалай жұмыс істейді", "How it works"],
    ["Вход:", "Кіру:", "Sign-in:"],
    ["любой email и пароль от 6 символов — аккаунт создастся сам и хранится только в этом браузере", "кез келген email және 6 таңбадан құпиясөз — аккаунт өзі ашылады және тек осы браузерде сақталады", "any email and a 6+ character password — the account is created automatically and stored only in this browser"],
    ["AI оценивает твои проекты", "AI жобаларыңды бағалайды", "AI rates your projects"],
    ["стажировки, гранты и хакатоны", "тағылымдамалар, гранттар мен хакатондар", "internships, grants and hackathons"],
    ["личный план развития", "жеке даму жоспары", "personal growth plan"],
    ["Введи корректный email", "Дұрыс email енгіз", "Enter a valid email"],
    ["Пароль — минимум 6 символов", "Құпиясөз — кемінде 6 таңба", "Password must be at least 6 characters"],
    ["Неверный пароль для этого email", "Бұл email үшін құпиясөз қате", "Wrong password for this email"],
    ["Аккаунт создан. Добро пожаловать!", "Аккаунт ашылды. Қош келдің!", "Account created. Welcome!"],
    ["С возвращением!", "Қайта қош келдің!", "Welcome back!"],
    ["Демо-режим: данные хранятся в этом браузере", "Демо-режим: деректер осы браузерде сақталады", "Demo mode: data is stored in this browser"],
    ["Ты вышел из аккаунта", "Аккаунттан шықтың", "You signed out"],
    ["Введи email и пароль — аккаунт создастся сам", "Email мен құпиясөзді енгіз — аккаунт өзі ашылады", "Enter an email and password — the account is created automatically"],
    // --- профиль ---
    ["Поделиться", "Бөлісу", "Share"],
    ["Уведомления", "Хабарламалар", "Notifications"],
    ["Редактировать", "Өңдеу", "Edit"],
    ["Репутационный скор", "Бедел ұпайы", "Reputation score"],
    ["Проекты", "Жобалар", "Projects"],
    ["Навыки", "Дағдылар", "Skills"],
    ["Активность", "Белсенділік", "Activity"],
    ["+4 за неделю", "аптасына +4", "+4 this week"],
    ["#7 в рейтинге школы", "мектеп рейтингінде #7", "#7 in school ranking"],
    ["Топ 12% среди школьников", "Оқушылар арасында үздік 12%", "Top 12% of students"],
    ["Проектов", "Жоба", "Projects"],
    ["Навыков", "Дағды", "Skills"],
    ["Матча", "Матч", "Matches"],
    ["Челленджи недели", "Апта челлендждері", "Weekly challenges"],
    ["+ Проверить AI", "+ AI-мен тексеру", "+ Check with AI"],
    ["Эксперт", "Сарапшы", "Expert"],
    ["Продвинутый", "Жоғары", "Advanced"],
    ["Средний", "Орта", "Intermediate"],
    ["Начинающий", "Бастауыш", "Beginner"],
    ["Новичок", "Жаңадан бастаушы", "Beginner"],
    ["Достижения", "Жетістіктер", "Achievements"],
    ["Хакатон", "Хакатон", "Hackathon"],
    ["Стрик 7д", "7 күн қатарынан", "7-day streak"],
    ["1й проект", "1-жоба", "1st project"],
    ["3 матча", "3 матч", "3 matches"],
    ["Python · Классификатор изображений", "Python · Сурет классификаторы", "Python · Image classifier"],
    ["React · Трекер углеродного следа", "React · Көміртек ізі трекері", "React · Carbon footprint tracker"],
    ["10 класс · Алматы, Казахстан", "10-сынып · Алматы, Қазақстан", "Grade 10 · Almaty, Kazakhstan"],
    ["11 класс · Алматы, Казахстан", "11-сынып · Алматы, Қазақстан", "Grade 11 · Almaty, Kazakhstan"],
    ["Алматы, Казахстан", "Алматы, Қазақстан", "Almaty, Kazakhstan"],
    ["8 класс", "8-сынып", "Grade 8"], ["9 класс", "9-сынып", "Grade 9"], ["10 класс", "10-сынып", "Grade 10"], ["11 класс", "11-сынып", "Grade 11"],
    ["1 курс", "1-курс", "Year 1"], ["2 курс", "2-курс", "Year 2"], ["3 курс", "3-курс", "Year 3"], ["4 курс", "4-курс", "Year 4"],
    ["Редактировать профиль", "Профильді өңдеу", "Edit profile"],
    ["Имя", "Аты", "Name"],
    ["Твоё имя", "Атың", "Your name"],
    ["Класс / Курс", "Сынып / Курс", "Grade / Year"],
    ["Город", "Қала", "City"],
    ["Город, Страна", "Қала, Ел", "City, Country"],
    ["О себе", "Өзің туралы", "About me"],
    ["Направления (3 тега)", "Бағыттар (3 тег)", "Interests (3 tags)"],
    ["Сохранить", "Сақтау", "Save"],
    ["Сбросить профиль", "Профильді тазалау", "Reset profile"],
    ["Сбросить профиль к стандартному?", "Профильді бастапқы күйге қайтару керек пе?", "Reset the profile to default?"],
    ["Сброшено", "Тазаланды", "Reset done"],
    ["Выйти из аккаунта", "Аккаунттан шығу", "Sign out"],
    ["Профиль сохранён!", "Профиль сақталды!", "Profile saved!"],
    ["Новый матч!", "Жаңа матч!", "New match!"],
    ["Kolesa Group · 2ч назад", "Kolesa Group · 2 сағ бұрын", "Kolesa Group · 2h ago"],
    ["Скор вырос до 86", "Ұпай 86-ға өсті", "Score rose to 86"],
    ["+4 очка за неделю · 1д назад", "аптасына +4 ұпай · 1 күн бұрын", "+4 points this week · 1d ago"],
    ["Новое достижение", "Жаңа жетістік", "New achievement"],
    ["«Стрик 7 дней» · 2д назад", "«7 күн қатарынан» · 2 күн бұрын", "“7-day streak” · 2d ago"],
    ["Поделиться профилем", "Профильмен бөлісу", "Share profile"],
    ["Покажи навыки университетам и работодателям", "Дағдыларыңды университеттер мен жұмыс берушілерге көрсет", "Show your skills to universities and employers"],
    ["Публичная ссылка", "Ашық сілтеме", "Public link"],
    ["Поделиться ссылкой", "Сілтемемен бөлісу", "Share link"],
    ["Сохранить профиль в PDF", "Профильді PDF-ке сақтау", "Save profile as PDF"],
    ["Отправить на email", "Email-ге жіберу", "Send by email"],
    ["Ссылка скопирована!", "Сілтеме көшірілді!", "Link copied!"],
    ["Не удалось поделиться", "Бөлісу мүмкін болмады", "Could not share"],
    ["Мой профиль на Verix", "Менің Verix профилім", "My Verix profile"],
    ["на Verix — платформе цифровой репутации школьников", "Verix-те — оқушылардың цифрлық бедел платформасы", "on Verix — the digital reputation platform for students"],
    ["Все проекты (7)", "Барлық жобалар (7)", "All projects (7)"],
    ["+ Добавить проект", "+ Жоба қосу", "+ Add project"],
    ["Верифицирован AI · Продвинутый", "AI растаған · Жоғары", "AI-verified · Advanced"],
    ["Верифицирован AI · Начинающий", "AI растаған · Бастауыш", "AI-verified · Beginner"],
    ["Проекта", "Жоба", "Projects"], ["Проект", "Жоба", "Project"],
    ["AI оценка", "AI бағасы", "AI review"],
    ["Сильная архитектура. Изучи", "Архитектура мықты. Үйрен:", "Strong architecture. Learn"],
    ["Хорошая база. Изучи", "Негіз жақсы. Үйрен:", "Good foundation. Learn"],
    ["Рекомендую", "Ұсынамын:", "I recommend"],
    ["Пересдать тест", "Қайта тексеру", "Retake"],
    ["Улучшить", "Жақсарту", "Improve"],
    ["Пересдать", "Қайта тексеру", "Retake"],
    ["Все достижения", "Барлық жетістіктер", "All achievements"],
    ["Хакатон 2024", "Хакатон 2024", "Hackathon 2024"],
    ["2 место в Almaty Hack", "Almaty Hack-те 2-орын", "2nd place at Almaty Hack"],
    ["Стрик 7 дней", "7 күн қатарынан", "7-day streak"],
    ["7 дней подряд", "7 күн қатарынан", "7 days in a row"],
    ["Первый проект", "Алғашқы жоба", "First project"],
    ["Первый проект в портфолио", "Портфолиодағы алғашқы жоба", "First project in the portfolio"],
    ["3 матча с компаниями", "Компаниялармен 3 матч", "3 matches with companies"],
    ["Топ 12% школьников", "Оқушылардың үздік 12%", "Top 12% of students"],
    ["Войди в топ 5%", "Үздік 5%-ға кір", "Get into the top 5%"],
    ["15 ноября 2024", "2024 жылғы 15 қараша", "15 November 2024"],
    ["7 дней активности подряд. +5 к скору.", "7 күн қатарынан белсенділік. Ұпайға +5.", "7 days of activity in a row. +5 to the score."],
    ["Добавила первый проект!", "Алғашқы жоба қосылды!", "First project added!"],
    ["3 матча с компаниями!", "Компаниялармен 3 матч!", "3 matches with companies!"],
    ["Топ 12% школьников на платформе!", "Платформадағы оқушылардың үздік 12%!", "Top 12% of students on the platform!"],
    // --- SkillProof ---
    ["Докажи свой", "Дағдыңды", "Prove your"],
    ["навык", "дәлелде", "skill"],
    ["AI выдаст честный скор — без оценок учителей", "AI әділ ұпай береді — мұғалім бағасынсыз", "AI gives an honest score — no teacher grades"],
    ["Выбери навык", "Дағдыны таңда", "Choose a skill"],
    ["Ссылка на GitHub", "GitHub сілтемесі", "GitHub link"],
    ["точнее всего", "ең дәл тәсіл", "most accurate"],
    ["https://github.com/ты/проект", "https://github.com/сен/жоба", "https://github.com/you/project"],
    ["AI посмотрит код, README и историю коммитов. Репозиторий должен быть публичным.", "AI кодты, README мен коммиттер тарихын қарайды. Репозиторий ашық болуы керек.", "AI will read the code, README and commit history. The repository must be public."],
    ["Опиши проект", "Жобаны сипатта", "Describe the project"],
    ["от 20 символов", "20 таңбадан бастап", "20+ characters"],
    ["Например: Сделала сайт на React с авторизацией, тёмной темой, API подключением. Использовала хуки useState, useEffect, Context API. Деплой на Vercel...", "Мысалы: React-те авторизациясы, қараңғы тақырыбы және API қосылымы бар сайт жасадым. useState, useEffect, Context API хуктарын қолдандым. Vercel-ге жарияладым...", "For example: Built a React site with sign-in, dark theme and an API connection. Used useState, useEffect and Context API hooks. Deployed on Vercel..."],
    ["Анализировать с AI", "AI-мен талдау", "Analyze with AI"],
    ["Анализировать снова", "Қайта талдау", "Analyze again"],
    ["AI читает код...", "AI кодты оқып жатыр...", "AI is reading the code..."],
    ["AI думает...", "AI ойланып жатыр...", "AI is thinking..."],
    ["Результат", "Нәтиже", "Result"],
    ["Общий скор", "Жалпы ұпай", "Overall score"],
    ["Оригинальность", "Түпнұсқалық", "Originality"],
    ["Сложность", "Күрделілік", "Complexity"],
    ["Уровень", "Деңгей", "Level"],
    ["Вердикт AI", "AI қорытындысы", "AI verdict"],
    ["Вердикт AI по коду", "Код бойынша AI қорытындысы", "AI verdict from the code"],
    ["Предварительная оценка", "Алдын ала баға", "Preliminary score"],
    ["Добавить в профиль", "Профильге қосу", "Add to profile"],
    ["Проверено по коду", "Код бойынша тексерілді", "Verified from code"],
    ["форк", "форк", "fork"],
    ["коммитов", "коммит", "commits"],
    ["файлов", "файл", "files"],
    ["авт.", "автор", "authors"],
    ["Ссылка должна быть вида https://github.com/user/repo", "Сілтеме https://github.com/user/repo түрінде болуы керек", "The link must look like https://github.com/user/repo"],
    ["Опиши проект подробнее (от 20 символов) или дай ссылку на GitHub", "Жобаны толығырақ сипатта (20 таңбадан) немесе GitHub сілтемесін бер", "Describe the project in more detail (20+ characters) or add a GitHub link"],
    ["Навык добавлен в профиль!", "Дағды профильге қосылды!", "Skill added to profile!"],
    ["Проверено AI по коду", "AI код бойынша тексерді", "Verified by AI from code"],
    ["Оценено AI по описанию", "AI сипаттама бойынша бағалады", "Rated by AI from description"],
    ["· код ✓", "· код ✓", "· code ✓"],
    ["Проверить заново", "Қайта тексеру", "Check again"],
    ["Закрыть", "Жабу", "Close"],
    ["Опиши, какие технологии и библиотеки ты использовал.", "Қандай технологиялар мен кітапханаларды қолданғаныңды сипатта.", "Describe which technologies and libraries you used."],
    ["Добавь подробностей: какие задачи решал и что было сложнее всего.", "Толығырақ жаз: қандай міндеттерді шештің және ең қиыны не болды.", "Add details: what problems you solved and what was hardest."],
    ["Добавь ссылку на репозиторий и тесты — это повысит доверие к оценке.", "Репозиторий сілтемесі мен тесттерді қос — бұл бағаға сенімді арттырады.", "Add a repository link and tests — it makes the score more trustworthy."],
    ["Выбираешь навык", "Дағдыны таңдайсың", "Choose a skill"],
    ["React, Python, ML, Design и другие", "React, Python, ML, Design және басқалар", "React, Python, ML, Design and more"],
    ["Описываешь проект", "Жобаны сипаттайсың", "Describe your project"],
    ["Технологии, что сделала, сложность", "Технологиялар, не жасадың, күрделілігі", "Technologies, what you built, complexity"],
    ["AI анализирует", "AI талдайды", "AI analyzes"],
    ["Сложность, оригинальность, уровень", "Күрделілік, түпнұсқалық, деңгей", "Complexity, originality, level"],
    ["Добавляешь в профиль", "Профильге қосасың", "Add it to your profile"],
    ["Скор виден работодателям", "Ұпайды жұмыс берушілер көреді", "Employers can see the score"],
    // --- TalentMatch ---
    ["Подобрано под твой профиль", "Профиліңе сай таңдалды", "Picked for your profile"],
    ["Свайп → матч", "Свайп → матч", "Swipe → match"],
    ["Загружаем возможности...", "Мүмкіндіктер жүктелуде...", "Loading opportunities..."],
    ["Поменяй фильтры или начни колоду заново.", "Сүзгілерді өзгерт немесе колоданы басынан баста.", "Change the filters or restart the deck."],
    ["Показать пропущенные снова", "Өткізілгендерді қайта көрсету", "Show skipped again"],
    ["Пропуск", "Өткізу", "Skip"],
    ["Матч", "Матч", "Match"],
    ["Совпадение", "Сәйкестік", "Match"],
    ["Подать заявку →", "Өтінім беру →", "Apply →"],
    ["Пропустить", "Өткізу", "Skip"],
    ["Суперлайк", "Суперлайк", "Super like"],
    ["Откликнуться", "Өтінім беру", "Apply"],
    ["Подбирает стажировки, гранты и конкурсы под твой профиль.", "Профиліңе сай тағылымдамаларды, гранттар мен байқауларды таңдайды.", "Finds internships, grants and competitions for your profile."],
    ["Как свайпать:", "Қалай свайптау керек:", "How to swipe:"],
    ["— не интересно", "— қызық емес", "— not interested"],
    ["— суперлайк", "— суперлайк", "— super like"],
    ["— хочу матч", "— матч керек", "— I want it"],
    ["Все", "Барлығы", "All"],
    ["Стажировка", "Тағылымдама", "Internship"], ["Стажировки", "Тағылымдамалар", "Internships"],
    ["Грант", "Грант", "Grant"], ["Гранты", "Гранттар", "Grants"],
    ["Хакатоны", "Хакатондар", "Hackathons"],
    ["Программа", "Бағдарлама", "Program"], ["Программы", "Бағдарламалар", "Programs"],
    ["Конкурс", "Байқау", "Competition"], ["Конкурсы", "Байқаулар", "Competitions"],
    ["без дедлайна", "мерзімсіз", "no deadline"],
    ["сегодня последний день", "бүгін соңғы күн", "last day today"],
    ["Онлайн", "Онлайн", "Online"],
    ["Тип", "Түрі", "Type"],
    ["Любой город", "Кез келген қала", "Any city"],
    ["Мой класс", "Менің сыныбым", "My grade"],
    ["Ты посмотрел всё по этим фильтрам", "Осы сүзгілер бойынша бәрін қарадың", "You have seen everything for these filters"],
    ["Пока нет возможностей", "Әзірге мүмкіндіктер жоқ", "No opportunities yet"],
    ["Колода обновлена", "Колода жаңартылды", "Deck refreshed"],
    ["Сайт организатора", "Ұйымдастырушы сайты", "Organizer website"],
    ["Сопроводительное письмо", "Ілеспе хат", "Cover letter"],
    ["Почему ты подходишь? Упомяни проекты из профиля.", "Неге сен лайықсың? Профиліңдегі жобаларды атап өт.", "Why are you a good fit? Mention projects from your profile."],
    ["Напиши хотя бы пару предложений", "Кемінде бір-екі сөйлем жаз", "Write at least a couple of sentences"],
    ["Матч подтверждён", "Матч расталды", "Match confirmed"],
    ["Отправить заявку", "Өтінім жіберу", "Send application"],
    ["Написать рекрутеру", "Рекрутерге жазу", "Message the recruiter"],
    ["Подать заявку", "Өтінім беру", "Apply"],
    ["Подать на грант", "Грантқа өтінім беру", "Apply for the grant"],
    ["Заявка отправлена!", "Өтінім жіберілді!", "Application sent!"],
    ["Заявка!", "Өтінім!", "Applied!"],
    ["Заявка начата!", "Өтінім басталды!", "Application started!"],
    ["Чат открыт", "Чат ашылды", "Chat opened"],
    // --- EduPath ---
    ["Цели", "Мақсаттар", "Goals"],
    ["ТВОЯ ЦЕЛЬ", "СЕНІҢ МАҚСАТЫҢ", "YOUR GOAL"],
    ["Стать", "Болу", "Become"],
    ["Сменить цель", "Мақсатты өзгерту", "Change goal"],
    ["Роадмап", "Жол картасы", "Roadmap"],
    ["AI-план", "AI-жоспар", "AI plan"],
    ["AI рекомендация", "AI ұсынысы", "AI recommendation"],
    ["Подсказка", "Кеңес", "Tip"],
    ["Завершена", "Аяқталды", "Done"],
    ["Сейчас", "Қазір", "Now"],
    ["Финал", "Финал", "Final"],
    ["Скоро", "Жақында", "Soon"],
    ["Продолжить задание", "Тапсырманы жалғастыру", "Continue task"],
    ["Задача выполнена: +10 XP", "Тапсырма орындалды: +10 XP", "Task done: +10 XP"],
    ["Задача выполнена", "Тапсырма орындалды", "Task done"],
    ["Как доказать", "Қалай дәлелдеу керек", "How to prove it"],
    ["Сделай результат в публичном репозитории на GitHub — потом", "Нәтижені GitHub-тағы ашық репозиторийде жаса — содан кейін", "Put the result in a public GitHub repository — then"],
    ["проверь его в SkillProof", "оны SkillProof-та тексер", "check it in SkillProof"],
    [", и навык появится в профиле с отметкой «код ✓».", ", сонда дағды профильде «код ✓» белгісімен шығады.", ", and the skill will appear in your profile marked “code ✓”."],
    ["Готово, отметить", "Дайын, белгілеу", "Done, mark it"],
    ["Проверить в SkillProof", "SkillProof-та тексеру", "Check in SkillProof"],
    ["Цель и план", "Мақсат және жоспар", "Goal and plan"],
    ["Цель", "Мақсат", "Goal"],
    ["Или своя цель", "Немесе өз мақсатың", "Or your own goal"],
    ["Например: разработчик ботов для Telegram", "Мысалы: Telegram боттарын әзірлеуші", "For example: Telegram bot developer"],
    ["Сколько часов в неделю есть", "Аптасына қанша сағат бар", "Hours per week you have"],
    ["Построить план с AI", "AI-мен жоспар құру", "Build a plan with AI"],
    ["Взять готовый шаблон", "Дайын үлгіні алу", "Use a ready template"],
    ["Выбери цель", "Мақсатты таңда", "Choose a goal"],
    ["AI составляет план...", "AI жоспар құрып жатыр...", "AI is building the plan..."],
    ["AI недоступен — взяли шаблон", "AI қолжетімсіз — үлгі алынды", "AI unavailable — using a template"],
    ["AI-план готов!", "AI-жоспар дайын!", "AI plan is ready!"],
    ["Карьерные цели", "Мансап мақсаттары", "Career goals"],
    ["EduPath строит роадмап под твой уровень и цель. AI обновляет план каждую неделю.", "EduPath деңгейің мен мақсатыңа сай жол картасын құрады. AI жоспарды әр апта жаңартады.", "EduPath builds a roadmap for your level and goal. AI updates the plan every week."],
    ["Статистика", "Статистика", "Statistics"],
    ["Фаза 2 · Задание 2 из 4", "2-кезең · 4-тің 2-тапсырмасы", "Phase 2 · Task 2 of 4"],
    ["Начать", "Бастау", "Start"],
    ["Смотреть урок", "Сабақты көру", "Watch the lesson"],
    ["Задание началось!", "Тапсырма басталды!", "Task started!"],
    ["Видео открыт", "Бейне ашылды", "Video opened"],
    ["нейросети, модели, деплой", "нейрожелілер, модельдер, деплой", "neural networks, models, deployment"],
    ["Figma, исследования", "Figma, зерттеулер", "Figma, research"],
    ["сети, CTF, безопасность", "желілер, CTF, қауіпсіздік", "networks, CTF, security"],
    ["Основы веба", "Веб негіздері", "Web basics"],
    ["HTML, CSS, JavaScript — фундамент", "HTML, CSS, JavaScript — іргетас", "HTML, CSS, JavaScript — the foundation"],
    ["HTML & CSS основы", "HTML & CSS негіздері", "HTML & CSS basics"],
    ["JavaScript основы", "JavaScript негіздері", "JavaScript basics"],
    ["Первая страница на GitHub Pages", "GitHub Pages-тегі алғашқы бет", "First page on GitHub Pages"],
    ["React & компоненты", "React және компоненттер", "React & components"],
    ["Компонентный подход, хуки, состояние", "Компоненттік тәсіл, хуктар, күй", "Components, hooks, state"],
    ["Компоненты и пропсы", "Компоненттер мен пропстар", "Components and props"],
    ["Роутинг (React Router)", "Роутинг (React Router)", "Routing (React Router)"],
    ["API запросы (fetch)", "API сұраулары (fetch)", "API requests (fetch)"],
    ["Продвинутый React", "Жоғары деңгейлі React", "Advanced React"],
    ["TypeScript, состояние, тесты", "TypeScript, күй, тесттер", "TypeScript, state, tests"],
    ["TypeScript в проекте", "Жобадағы TypeScript", "TypeScript in a project"],
    ["Основы дизайна", "Дизайн негіздері", "Design basics"],
    ["Композиция, цвет, типографика", "Композиция, түс, типографика", "Composition, color, typography"],
    ["Сетки и композиция", "Торлар және композиция", "Grids and composition"],
    ["Цвет и контраст", "Түс және контраст", "Color and contrast"],
    ["Типографика: 3 пары шрифтов", "Типографика: 3 қаріп жұбы", "Typography: 3 font pairs"],
    ["Компоненты и прототипы", "Компоненттер мен прототиптер", "Components and prototypes"],
    ["Компоненты и автолейаут", "Компоненттер және автолейаут", "Components and auto layout"],
    ["Кликабельный прототип", "Басылатын прототип", "Clickable prototype"],
    ["Редизайн школьного сайта", "Мектеп сайтының редизайны", "School website redesign"],
    ["UX-исследования", "UX-зерттеулер", "UX research"],
    ["Пользователи и проверка гипотез", "Пайдаланушылар және болжамдарды тексеру", "Users and hypothesis testing"],
    ["5 интервью с пользователями", "Пайдаланушылармен 5 сұхбат", "5 user interviews"],
    ["Карта пути пользователя", "Пайдаланушы жолының картасы", "User journey map"],
    ["Юзабилити-тест прототипа", "Прототиптің юзабилити-тесті", "Prototype usability test"],
    ["Портфолио", "Портфолио", "Portfolio"],
    ["Кейсы и отклики", "Кейстер мен өтінімдер", "Case studies and applications"],
    ["Фундамент", "Іргетас", "Foundation"],
    ["База, без которой дальше никак", "Онсыз әрі қарай жүру мүмкін емес негіз", "The basics you can’t skip"],
    ["Найти бесплатный курс по теме", "Тақырып бойынша тегін курс табу", "Find a free course on the topic"],
    ["Пройти первые 5 уроков", "Алғашқы 5 сабақты өту", "Complete the first 5 lessons"],
    ["Завести GitHub и первый репозиторий", "GitHub пен алғашқы репозиторий ашу", "Create GitHub and a first repository"],
    ["Практика", "Тәжірибе", "Practice"],
    ["Маленькие проекты каждую неделю", "Әр апта сайын шағын жобалар", "Small projects every week"],
    ["Мини-проект №1", "№1 шағын жоба", "Mini project #1"],
    ["Мини-проект №2", "№2 шағын жоба", "Mini project #2"],
    ["Показать код другу или ментору", "Кодты досыңа немесе менторға көрсету", "Show the code to a friend or mentor"],
    ["Углубление", "Тереңдету", "Going deeper"],
    ["Сложные темы и командная работа", "Күрделі тақырыптар және командалық жұмыс", "Hard topics and teamwork"],
    ["Разобрать продвинутую тему", "Күрделі тақырыпты талдау", "Study an advanced topic"],
    ["Проект в команде", "Командалық жоба", "Team project"],
    ["Участие в хакатоне", "Хакатонға қатысу", "Join a hackathon"],
    ["Проект, который не стыдно показать", "Көрсетуге болатын жоба", "A project worth showing"],
    ["Проверить проект в SkillProof", "Жобаны SkillProof-та тексеру", "Check the project in SkillProof"],
    ["Откликнуться на 3 возможности", "3 мүмкіндікке өтінім беру", "Apply to 3 opportunities"],
    ["План по шаблону.", "Үлгі бойынша жоспар.", "Template plan."],
    ["Нажми «AI-план»", "«AI-жоспар» батырмасын бас", "Tap “AI plan”"],
    [", чтобы AI подстроил его под твои навыки и время.", ", сонда AI оны дағдыларың мен уақытыңа бейімдейді.", " so AI tailors it to your skills and time."],
    ["Ты прогрессируешь стабильно. Следующий шаг: закончи задание по", "Сен тұрақты дамып келесің. Келесі қадам: тапсырманы аяқта —", "You are progressing steadily. Next step: finish the task on"],
    ["— это откроет API-запросы и поднимет скор.", "— бұл API сұрауларына жол ашып, ұпайды көтереді.", "— it unlocks API requests and raises your score."],
    // --- геймификация ---
    ["Проверь проект по ссылке на GitHub", "Жобаны GitHub сілтемесі арқылы тексер", "Check a project by its GitHub link"],
    ["Откликнись на 3 возможности", "3 мүмкіндікке өтінім бер", "Apply to 3 opportunities"],
    ["Сохрани заявку на возможность", "Мүмкіндікке өтінім сақта", "Save an application"],
    ["Выполни 3 задачи роадмапа", "Жол картасының 3 тапсырмасын орында", "Complete 3 roadmap tasks"],
    ["Добавь проверенный навык в профиль", "Тексерілген дағдыны профильге қос", "Add a verified skill to your profile"],
    ["Первый навык", "Алғашқы дағды", "First skill"],
    ["Проверь проект в SkillProof и добавь навык в профиль", "Жобаны SkillProof-та тексеріп, дағдыны профильге қос", "Check a project in SkillProof and add the skill"],
    ["Код ✓", "Код ✓", "Code ✓"],
    ["Получи оценку AI по реальному коду с GitHub", "GitHub-тағы нақты код бойынша AI бағасын ал", "Get an AI score from real GitHub code"],
    ["Серия 3 дня", "3 күн қатарынан", "3-day streak"],
    ["Заходи в Verix 3 дня подряд", "Verix-ке 3 күн қатарынан кір", "Open Verix 3 days in a row"],
    ["Серия 7 дней", "7 күн қатарынан", "7-day streak"],
    ["Заходи в Verix 7 дней подряд", "Verix-ке 7 күн қатарынан кір", "Open Verix 7 days in a row"],
    ["Первая заявка", "Алғашқы өтінім", "First application"],
    ["Сохрани сопроводительное письмо к возможности", "Мүмкіндікке ілеспе хат сақта", "Save a cover letter for an opportunity"],
    ["Фаза пройдена", "Кезең өтілді", "Phase complete"],
    ["Выполни все задачи одной фазы роадмапа", "Жол картасының бір кезеңіндегі барлық тапсырманы орында", "Finish every task of one roadmap phase"],
    ["Челленджер", "Челленджер", "Challenger"],
    ["Выполни челлендж недели", "Апта челленджін орында", "Complete the weekly challenge"],
    ["Набери 640 XP", "640 XP жина", "Earn 640 XP"],
    ["последний день", "соңғы күн", "last day"],
    // --- рейтинги и чат ---
    ["Рейтинги", "Рейтингтер", "Rankings"],
    ["Соревнуйся и побеждай", "Жарыс және жеңіске жет", "Compete and win"],
    ["Смотри на лучших и вдохновляйся", "Үздіктерге қарап шабыттан", "Look at the best and get inspired"],
    ["Демо-данные.", "Демо-деректер.", "Demo data."],
    ["Ученики, школы и баллы в рейтингах — вымышленные примеры, чтобы показать, как раздел будет выглядеть. Настоящий рейтинг появится, когда у Verix будет сервер с аккаунтами.", "Рейтингтердегі оқушылар, мектептер мен ұпайлар — бөлімнің қалай көрінетінін көрсету үшін ойдан алынған мысалдар. Нақты рейтинг Verix-те аккаунттары бар сервер пайда болғанда шығады.", "Students, schools and scores in the rankings are made-up examples showing how this section will look. The real ranking will appear once Verix has a server with accounts."],
    ["Ученики", "Оқушылар", "Students"],
    ["Школы", "Мектептер", "Schools"],
    ["Соревнования", "Жарыстар", "Competitions"],
    ["Рейтинг учеников", "Оқушылар рейтингі", "Student ranking"],
    ["Рейтинг школ", "Мектептер рейтингі", "School ranking"],
    ["Топ по навыкам", "Дағдылар бойынша үздіктер", "Top by skill"],
    ["Школа №45, Алматы", "№45 мектеп, Алматы", "School No. 45, Almaty"],
    ["Гимназия №7, Алматы", "№7 гимназия, Алматы", "Gymnasium No. 7, Almaty"],
    ["Школа №12, Шымкент", "№12 мектеп, Шымкент", "School No. 12, Shymkent"],
    ["НИШ Физмат, Астана", "НЗМ Физмат, Астана", "NIS Fizmat, Astana"],
    ["НИШ ХМ, Астана", "НЗМ ХБ, Астана", "NIS ChemBio, Astana"],
    ["НИШ Физмат-IT", "НЗМ Физмат-IT", "NIS Fizmat-IT"],
    ["Школа №45", "№45 мектеп", "School No. 45"],
    ["в Астане", "Астанада", "in Astana"],
    ["в Алматы", "Алматыда", "in Almaty"],
    ["Средняя репутация", "Орташа бедел", "Average reputation"],
    ["Всего учеников", "Барлық оқушы", "Total students"],
    ["Достижений", "Жетістік", "Achievements"],
    ["MacBook Air + стажировка", "MacBook Air + тағылымдама", "MacBook Air + internship"],
    ["Создай лучшее React приложение и выиграй ценные призы", "Ең үздік React қосымшасын жасап, бағалы сыйлықтар ұт", "Build the best React app and win great prizes"],
    ["Участников", "Қатысушы", "Participants"],
    ["Дней до конца", "Аяқталуына күн", "Days left"],
    ["Грант на развитие проекта", "Жобаны дамытуға грант", "Project development grant"],
    ["Разработи AI решение для образования и получи поддержку", "Білім беруге арналған AI шешімін жасап, қолдау ал", "Build an AI solution for education and get support"],
    ["Кубок чемпиона + мерч", "Чемпион кубогы + мерч", "Champion’s cup + merch"],
    ["Соревнование между школами Алматы за звание лучшей IT-площадки", "Алматы мектептері арасындағы ең үздік IT-алаң атағы үшін жарыс", "A contest between Almaty schools for the best IT hub"],
    ["Демо-собеседник · ответы автоматические", "Демо-сұхбаттасушы · жауаптар автоматты", "Demo contact · automatic replies"],
    ["Сообщение", "Хабарлама", "Message"],
    ["Напиши сообщение...", "Хабарлама жаз...", "Write a message..."],
    ["Сообщение отправлено!", "Хабарлама жіберілді!", "Message sent!"],
    ["Новое сообщение!", "Жаңа хабарлама!", "New message!"],
    ["Привет! Рад пообщаться с тобой", "Сәлем! Сенімен сөйлескеніме қуаныштымын", "Hi! Glad to chat with you"],
    ["Спасибо за сообщение!", "Хабарламаң үшін рақмет!", "Thanks for the message!"],
    ["Интересно! Расскажи подробнее.", "Қызық! Толығырақ айтып берші.", "Interesting! Tell me more."],
    ["Круто! Давай обсудим это.", "Керемет! Талқылайық.", "Cool! Let’s discuss it."],
    ["Согласен! Отличная идея.", "Келісемін! Тамаша идея.", "Agreed! Great idea."],
    ["Я тоже думаю об этом.", "Мен де осы туралы ойлап жүрмін.", "I’m thinking about it too."],
    ["Я", "Мен", "Me"],
    // --- навигация и PWA ---
    ["Разделы", "Бөлімдер", "Sections"],
    ["Профиль", "Профиль", "Profile"],
    ["Матчинг", "Матчинг", "Matching"],
    ["Окно", "Терезе", "Dialog"],
    ["Нет сети — работаем офлайн", "Желі жоқ — офлайн жұмыс істеп тұрмыз", "No connection — working offline"],
    ["Сеть снова есть", "Желі қайта бар", "Back online"],
    ["Установить", "Орнату", "Install"],
    ["Verix установлен!", "Verix орнатылды!", "Verix installed!"],
    ["Язык", "Тіл", "Language"],
    // --- ошибки сервера ---
    ["Слишком много запросов. Подожди минуту.", "Сұраулар тым көп. Бір минут күт.", "Too many requests. Wait a minute."],
    ["Лимит бесплатного AI исчерпан. Попробуй через минуту.", "Тегін AI лимиті таусылды. Бір минуттан кейін қайтала.", "The free AI limit is used up. Try again in a minute."],
    ["Нет связи с AI. Попробуй позже.", "AI-мен байланыс жоқ. Кейінірек қайтала.", "No connection to AI. Try later."],
    ["Нет связи с GitHub. Попробуй позже.", "GitHub-пен байланыс жоқ. Кейінірек қайтала.", "No connection to GitHub. Try later."],
    ["Репозиторий не найден или он закрытый", "Репозиторий табылмады немесе ол жабық", "Repository not found or private"],
    ["GitHub временно ограничил запросы. Попробуй через час или без ссылки.", "GitHub сұрауларды уақытша шектеді. Бір сағаттан кейін немесе сілтемесіз қайтала.", "GitHub temporarily limited requests. Try in an hour or without the link."],
    ["Нужна ссылка вида https://github.com/user/repo", "https://github.com/user/repo түріндегі сілтеме керек", "A link like https://github.com/user/repo is needed"],
    ["Репозиторий пустой", "Репозиторий бос", "The repository is empty"],
    ["Ошибка AI-сервиса", "AI-сервис қатесі", "AI service error"],
    ["AI сейчас недоступен — оценку без него не ставим. Попробуй чуть позже.", "AI қазір қолжетімсіз — онсыз баға қоймаймыз. Сәл кейінірек қайтала.", "AI is unavailable right now — we don't score without it. Try again a bit later."],
    ["Описание непонятное. Напиши обычными словами, что ты сделал и какими технологиями, или дай ссылку на GitHub.", "Сипаттама түсініксіз. Не жасағаныңды және қандай технологиялармен жасағаныңды қарапайым сөзбен жаз немесе GitHub сілтемесін бер.", "The description is unclear. Write in plain words what you built and with which technologies, or add a GitHub link."],
    ["AI вернул неверный ответ", "AI қате жауап қайтарды", "AI returned an invalid answer"],
    ["Описание похоже на попытку повлиять на оценку. Опиши, что ты сделал, или дай ссылку на GitHub — тогда оценка будет только по коду.", "Сипаттама бағаға әсер етуге тырысуға ұқсайды. Не жасағаныңды сипатта немесе GitHub сілтемесін бер — сонда баға тек код бойынша қойылады.", "The description looks like an attempt to influence the score. Describe what you built or add a GitHub link — then the score is based only on the code."],
    ["Честная оценка: если есть ссылка на GitHub, балл ставится только по коду. Без кода — предварительная оценка, не выше 60.", "Әділ баға: GitHub сілтемесі болса, балл тек код бойынша қойылады. Кодсыз — алдын ала баға, 60-тан аспайды.", "Fair scoring: with a GitHub link the score is based only on the code. Without code it is a preliminary score of at most 60."],
    ["Вердикт AI по описанию (без кода — до 60)", "Сипаттама бойынша AI қорытындысы (кодсыз — 60-қа дейін)", "AI verdict from the description (no code — up to 60)"],
    // --- профиль: тексты по умолчанию и модальные окна ---
    ["Frontend разработчица, люблю создавать продукты с нуля.", "Frontend әзірлеуші, өнімдерді нөлден жасағанды ұнатамын.", "Frontend developer, I love building products from scratch."],
    ["Создай компонент таймера:", "Таймер компонентін жаса:", "Build a timer component:"],
    ["• Считает секунды (useState)", "• Секундтарды санайды (useState)", "• Counts seconds (useState)"],
    ["• Запускает интервал (useEffect)", "• Интервалды іске қосады (useEffect)", "• Starts an interval (useEffect)"],
    ["• Кнопки Старт / Пауза / Сброс", "• Старт / Үзіліс / Тазалау батырмалары", "• Start / Pause / Reset buttons"],
    ["Очищай интервал в", "Интервалды", "Clear the interval in"],
    ["из useEffect — иначе утечки памяти.", "ішінде тазала (useEffect) — әйтпесе жад ағып кетеді.", "of useEffect — otherwise memory leaks."],
    ["React, TypeScript · 8 мес", "React, TypeScript · 8 ай", "React, TypeScript · 8 mo"],
    ["Python, ML · 10 мес", "Python, ML · 10 ай", "Python, ML · 10 mo"],
    ["Figma, Research · 6 мес", "Figma, Research · 6 ай", "Figma, Research · 6 mo"],
    ["Python/Node, APIs · 9 мес", "Python/Node, APIs · 9 ай", "Python/Node, APIs · 9 mo"],
    ["и", "және", "and"],
    ["оптимизацию рендеров", "рендерді оңтайландыру", "render optimization"],
    ["2 место на Almaty Hack 2024.", "Almaty Hack 2024-те 2-орын.", "2nd place at Almaty Hack 2024."],
    ["Команда из 4 человек, проект EcoTrack.", "4 адамдық команда, EcoTrack жобасы.", "Team of 4, EcoTrack project."],
    ["+15 к репутационному скору.", "Бедел ұпайына +15.", "+15 to the reputation score."],
    ["Стажировка · Алматы · 80к/мес", "Тағылымдама · Алматы · айына 80 мың", "Internship · Almaty · 80k/month"],
    ["Гибкий график, ментор", "Икемді кесте, ментор", "Flexible hours, mentor"],
    ["Онлайн · 3 месяца · Сертификат", "Онлайн · 3 ай · Сертификат", "Online · 3 months · Certificate"],
    ["Нужно: портфолио + письмо", "Қажет: портфолио + хат", "Required: portfolio + letter"],
    ["Дедлайн: 30 апреля 2025", "Мерзімі: 2025 жылғы 30 сәуір", "Deadline: 30 April 2025"],
    ["Python · TensorFlow · 94% точность", "Python · TensorFlow · 94% дәлдік", "Python · TensorFlow · 94% accuracy"],
    ["React · Chart.js · Almaty Hack 2024, 2 место", "React · Chart.js · Almaty Hack 2024, 2-орын", "React · Chart.js · Almaty Hack 2024, 2nd place"],
    ["Пропущено", "Өткізілді", "Skipped"],
    ["Сохранить заявку", "Өтінімді сақтау", "Save application"],
    ["Профиль ученика", "Оқушы профилі", "Student profile"],
    ["Матчей", "Матч", "Matches"],
    ["Топ проекты", "Үздік жобалар", "Top projects"],
    ["Написать сообщение", "Хабарлама жазу", "Send a message"],
    ["Полный профиль", "Толық профиль", "Full profile"],
    ["Отправить", "Жіберу", "Send"],
    ["Как работает SkillProof", "SkillProof қалай жұмыс істейді", "How SkillProof works"],
    ["Как работает SkillProof AI", "SkillProof AI қалай жұмыс істейді", "How SkillProof AI works"],
    ["Как работает TalentMatch", "TalentMatch қалай жұмыс істейді", "How TalentMatch works"],
    ["Как устроены рейтинги", "Рейтингтер қалай құрылған", "How rankings work"],
    ["Verix помогает школьникам доказать IT-навыки с помощью AI, найти стажировки и гранты и построить личный план развития.", "Verix оқушыларға AI көмегімен IT-дағдыларын дәлелдеуге, тағылымдамалар мен гранттар табуға және жеке даму жоспарын құруға көмектеседі.", "Verix helps students prove IT skills with AI, find internships and grants, and build a personal growth plan."],
    ["Докажи навыки с AI, находи стажировки и гранты, прокачивайся по личному роадмапу.", "AI-мен дағдыңды дәлелде, тағылымдамалар мен гранттар тап, жеке жол картасымен дамы.", "Prove your skills with AI, find internships and grants, and level up with a personal roadmap."],
    // --- EduPath: другие цели ---
    ["Node.js / Python, базы данных", "Node.js / Python, дерекқорлар", "Node.js / Python, databases"],
    ["Python, анализ данных, ML", "Python, деректерді талдау, ML", "Python, data analysis, ML"],
    ["Тесты на Vitest или Jest", "Vitest немесе Jest-те тесттер", "Tests with Vitest or Jest"],
    ["Финальный проект и отклики", "Қорытынды жоба және өтінімдер", "Final project and applications"],
    ["Свой проект с деплоем", "Деплойы бар өз жобаң", "Your own deployed project"],
    ["Откликнуться на 3 стажировки", "3 тағылымдамаға өтінім беру", "Apply to 3 internships"],
    ["Python с нуля", "Python нөлден", "Python from scratch"],
    ["Синтаксис, функции, файлы", "Синтаксис, функциялар, файлдар", "Syntax, functions, files"],
    ["Типы, циклы, функции", "Типтер, циклдер, функциялар", "Types, loops, functions"],
    ["Работа с файлами и CSV", "Файлдармен және CSV-мен жұмыс", "Working with files and CSV"],
    ["Мини-проект: анализ оценок класса", "Шағын жоба: сынып бағаларын талдау", "Mini project: analyzing class grades"],
    ["Анализ данных", "Деректерді талдау", "Data analysis"],
    ["pandas, графики, выводы", "pandas, графиктер, қорытындылар", "pandas, charts, conclusions"],
    ["pandas: таблицы и фильтры", "pandas: кестелер мен сүзгілер", "pandas: tables and filters"],
    ["Графики в matplotlib", "matplotlib-те графиктер", "Charts in matplotlib"],
    ["Исследование открытого датасета", "Ашық датасетті зерттеу", "Explore an open dataset"],
    ["Машинное обучение", "Машиналық оқыту", "Machine learning"],
    ["Модели и метрики", "Модельдер мен метрикалар", "Models and metrics"],
    ["Регрессия и классификация", "Регрессия және классификация", "Regression and classification"],
    ["Метрики и валидация", "Метрикалар және валидация", "Metrics and validation"],
    ["Модель на Kaggle-датасете", "Kaggle-датасеттегі модель", "A model on a Kaggle dataset"],
    ["Проект и участие в соревнованиях", "Жоба және жарыстарға қатысу", "Project and competitions"],
    ["Проект с README и выводами", "README мен қорытындылары бар жоба", "Project with README and conclusions"],
    ["Kaggle или хакатон по данным", "Kaggle немесе деректер хакатоны", "Kaggle or a data hackathon"],
    ["2 кейса на Behance", "Behance-те 2 кейс", "2 case studies on Behance"],
    ["Проверить кейс в SkillProof", "Кейсті SkillProof-та тексеру", "Check a case in SkillProof"],
    ["Проверь 2 проекта в SkillProof", "SkillProof-та 2 жобаны тексер", "Check 2 projects in SkillProof"],
    ["Откликнись на 3 возможности в TalentMatch", "TalentMatch-та 3 мүмкіндікке өтінім бер", "Apply to 3 opportunities in TalentMatch"],
    // --- возможности TalentMatch (data/opportunities.json) ---
    ["Реальный проект. Ментор, 80к/мес, гибкий график.", "Нақты жоба. Ментор, айына 80 мың, икемді кесте.", "A real project. Mentor, 80k/month, flexible hours."],
    ["Грант для IT-школьников", "IT-оқушыларға арналған грант", "Grant for IT students"],
    ["$500 на развитие проекта. Нужно портфолио + письмо.", "Жобаны дамытуға $500. Портфолио + хат керек.", "$500 to grow your project. Portfolio + letter required."],
    ["48ч, команды 3-4 чел., приз 300 000 ₸.", "48 сағ, 3-4 адамнан тұратын командалар, жүлде 300 000 ₸.", "48h, teams of 3-4, prize 300,000 ₸."],
    ["2 недели AI для школьников 9-11 класса. Бесплатно.", "9-11 сынып оқушыларына 2 апталық AI мектебі. Тегін.", "2 weeks of AI for grades 9-11. Free."],
    ["Городской конкурс. Победители получают менторов.", "Қалалық байқау. Жеңімпаздар ментор алады.", "City competition. Winners get mentors."],
    ["Челлендж недели в Verix", "Verix-тегі апта челленджі", "Verix weekly challenge"],
    ["Выполни задания недели в профиле и получи бонусные XP и значок.", "Профильдегі апта тапсырмаларын орындап, бонус XP мен белгі ал.", "Complete the weekly tasks in your profile and get bonus XP and a badge."],
    ["Игра за 72 часа", "72 сағатта ойын", "Game in 72 hours"],
    ["Сделай игру на заданную тему на любом движке. Unity, Godot или браузер.", "Берілген тақырыпқа кез келген қозғалтқышта ойын жаса. Unity, Godot немесе браузер.", "Make a game on a given theme with any engine. Unity, Godot or browser."],
    ["CTF для начинающих", "Бастаушыларға арналған CTF", "CTF for beginners"],
    ["Соревнование по информационной безопасности: криптография, веб, форензика.", "Ақпараттық қауіпсіздік жарысы: криптография, веб, форензика.", "An information security contest: cryptography, web, forensics."],
    ["Менторская программа по данным", "Деректер бойынша менторлық бағдарлама", "Data mentorship program"],
    ["Еженедельные созвоны с ментором и свой исследовательский проект на открытых данных.", "Ментормен апта сайынғы қоңыраулар және ашық деректердегі өз зерттеу жобаң.", "Weekly calls with a mentor and your own research project on open data."],
    ["Стажёр UI/UX дизайнер", "UI/UX дизайнер тағылымдамашысы", "UI/UX design intern"],
    ["Помощь в дизайне мобильных приложений. Нужно портфолио из 2+ кейсов.", "Мобильді қосымшалар дизайнына көмек. 2+ кейстен тұратын портфолио керек.", "Help design mobile apps. A portfolio of 2+ cases is required."],
    ["80к/мес", "айына 80 мың", "80k/month"], ["48ч", "48 сағ", "48h"], ["300к приз", "300 мың жүлде", "300k prize"],
    ["Лето", "Жаз", "Summer"], ["Бесплатно", "Тегін", "Free"], ["Менторы", "Менторлар", "Mentors"], ["Приз", "Жүлде", "Prize"],
    ["Каждую неделю", "Әр апта", "Weekly"], ["72ч", "72 сағ", "72h"], ["Соло или команда", "Жеке немесе команда", "Solo or team"],
    ["Командный", "Командалық", "Team"], ["Задачи на взлом", "Бұзуға арналған тапсырмалар", "Hacking tasks"],
    ["3 месяца", "3 ай", "3 months"], ["Ментор 1-на-1", "Жеке ментор", "1-on-1 mentor"], ["Частичная занятость", "Толық емес жұмыс күні", "Part-time"],
    ["Алматы", "Алматы", "Almaty"], ["Астана", "Астана", "Astana"], ["Шымкент", "Шымкент", "Shymkent"],
    // --- демо-люди (в английском — латиницей) ---
    ["Рамина Ибраимова", "Рамина Ибраимова", "Ramina Ibraimova"],
    ["Марат Алиев", "Марат Алиев", "Marat Aliyev"], ["Алия Нурсултанова", "Әлия Нұрсұлтанова", "Aliya Nursultanova"],
    ["Данияр Омаров", "Данияр Омаров", "Daniyar Omarov"], ["Айсулу Бекмуратова", "Айсұлу Бекмұратова", "Aisulu Bekmuratova"],
    ["Ерлан Смагулов", "Ерлан Смағұлов", "Yerlan Smagulov"], ["Тимур Жумабек", "Тимур Жұмабек", "Timur Zhumabek"],
    ["Мадина Сулейменова", "Мадина Сүлейменова", "Madina Suleimenova"], ["Карина Абдуллаева", "Карина Абдуллаева", "Karina Abdullayeva"],
    ["Айнур Касымов", "Айнұр Қасымов", "Ainur Kasymov"],
    ["Алия Н.", "Әлия Н.", "Aliya N."], ["Тимур Ж.", "Тимур Ж.", "Timur Zh."], ["Мадина С.", "Мадина С.", "Madina S."],
    ["Марат А.", "Марат А.", "Marat A."], ["Данияр О.", "Данияр О.", "Daniyar O."], ["Карина А.", "Карина А.", "Karina A."],
    ["РИ", "РИ", "RI"], ["МА", "МА", "MA"], ["АН", "ӘН", "AN"], ["ДО", "ДО", "DO"], ["АБ", "АБ", "AB"], ["ЕС", "ЕС", "YS"],
    ["ТЖ", "ТЖ", "TZh"], ["МС", "МС", "MS"], ["КА", "КА", "KA"], ["АК", "АҚ", "AK"],
    ["Гимназия №7", "№7 гимназия", "Gymnasium No. 7"], ["Школа №12", "№12 мектеп", "School No. 12"], ["НИШ", "НЗМ", "NIS"],
    ["Frontend разработчик, увлекаюсь React и созданием современных веб-приложений. Люблю решать сложные задачи и учиться новому.", "Frontend әзірлеуші, React пен заманауи веб-қосымшаларға қызығамын. Күрделі есептерді шешіп, жаңаны үйренгенді ұнатамын.", "Frontend developer into React and modern web apps. I love hard problems and learning new things."],
    ["Data Scientist в будущем. Изучаю машинное обучение и анализ данных. Участница хакатонов и грантов.", "Болашақ Data Scientist. Машиналық оқыту мен деректер талдауын үйренемін. Хакатондар мен гранттарға қатысамын.", "Future data scientist. Studying machine learning and data analysis. Hackathon and grant participant."],
    ["Full-stack разработчик. Специализируюсь на React и Node.js. Создаю масштабируемые приложения.", "Full-stack әзірлеуші. React пен Node.js-ке маманданамын. Масштабталатын қосымшалар жасаймын.", "Full-stack developer focused on React and Node.js. I build scalable apps."],
    ["UI/UX дизайнер. Создаю красивые и функциональные интерфейсы. Любую работу с пользователями.", "UI/UX дизайнер. Әдемі әрі ыңғайлы интерфейстер жасаймын. Пайдаланушылармен жұмысты ұнатамын.", "UI/UX designer. I create beautiful, functional interfaces and love working with users."],
    ["Backend разработчик. Работаю с Python и Django. Создаю надежные и быстрые API.", "Backend әзірлеуші. Python мен Django-мен жұмыс істеймін. Сенімді әрі жылдам API жасаймын.", "Backend developer working with Python and Django. I build reliable, fast APIs."],
    ["React + TypeScript · Управление задачами", "React + TypeScript · Тапсырмаларды басқару", "React + TypeScript · Task management"],
    ["Python · Визуализация данных", "Python · Деректерді визуализациялау", "Python · Data visualization"],
    ["Python · NLP чат-бот", "Python · NLP чат-бот", "Python · NLP chatbot"],
    ["React + Node.js · Социальная сеть", "React + Node.js · Әлеуметтік желі", "React + Node.js · Social network"],
    ["React + TypeScript · Интернет-магазин", "React + TypeScript · Интернет-дүкен", "React + TypeScript · Online store"],
    ["Node.js · Микросервисы", "Node.js · Микросервистер", "Node.js · Microservices"],
    ["Figma · Мобильный банкинг", "Figma · Мобильді банкинг", "Figma · Mobile banking"],
    ["Figma · Дизайн магазина", "Figma · Дүкен дизайны", "Figma · Store design"],
    ["Figma · Соцсеть дизайн", "Figma · Әлеуметтік желі дизайны", "Figma · Social app design"],
    ["Django · Блоговая платформа", "Django · Блог платформасы", "Django · Blog platform"],
    ["Django REST · API сервис", "Django REST · API сервисі", "Django REST · API service"],
    ["Python · Планировщик задач", "Python · Тапсырма жоспарлағышы", "Python · Task scheduler"],
  ];

  // Шаблоны с числами и названиями: [регулярное выражение, (совпадение) => [kk, en]]
  const RULES = [
    [/^(\d+) в колоде$/, (m) => [`колодада ${m[1]}`, `${m[1]} in the deck`]],
    [/^осталось (\d+) дн\.$/, (m) => [`${m[1]} күн қалды`, `${m[1]} days left`]],
    [/^до (.+)$/, (m) => [`${m[1]} дейін`, `until ${m[1]}`]],
    [/^Серия: (\d+) (день|дня|дней)$/, (m) => [`Қатарынан: ${m[1]} күн`, `Streak: ${m[1]} ${m[1] === "1" ? "day" : "days"}`]],
    [/^ещё (\d+) (день|дня|дней)$/, (m) => [`тағы ${m[1]} күн`, `${m[1]} more ${m[1] === "1" ? "day" : "days"}`]],
    [/^(\d+) XP · до LVL (\d+) ещё (\d+)$/, (m) => [`${m[1]} XP · LVL ${m[2]} дейін тағы ${m[3]}`, `${m[1]} XP · ${m[3]} more to LVL ${m[2]}`]],
    [/^Все \((\d+(?:\/\d+)?)\)$/, (m) => [`Барлығы (${m[1]})`, `All (${m[1]})`]],
    [/^Твои матчи \((\d+)\)$/, (m) => [`Сенің матчтарың (${m[1]})`, `Your matches (${m[1]})`]],
    [/^Достижения · (\d+\/\d+)$/, (m) => [`Жетістіктер · ${m[1]}`, `Achievements · ${m[1]}`]],
    [/^(\d+) (месяц|месяца|месяцев) · Прогресс (\d+)% · (\d+)\/(\d+) задач$/, (m) => [`${m[1]} ай · Прогресс ${m[3]}% · ${m[4]}/${m[5]} тапсырма`, `${m[1]} ${m[1] === "1" ? "month" : "months"} · Progress ${m[3]}% · ${m[4]}/${m[5]} tasks`]],
    [/^(\d+) месяцев · Прогресс (\d+)%$/, (m) => [`${m[1]} ай · Прогресс ${m[2]}%`, `${m[1]} months · Progress ${m[2]}%`]],
    [/^Фаза (\d+) · (.+) · задача (\d+) из (\d+)$/, (m) => [`${m[1]}-кезең · ${tr(m[2], 1)} · ${m[4]}-тің ${m[3]}-тапсырмасы`, `Phase ${m[1]} · ${tr(m[2], 2)} · task ${m[3]} of ${m[4]}`]],
    [/^Фаза (\d+) · (.+)$/, (m) => [`${m[1]}-кезең · ${tr(m[2], 1)}`, `Phase ${m[1]} · ${tr(m[2], 2)}`]],
    [/^Фаза «(.+)» пройдена!$/, (m) => [`«${tr(m[1], 1)}» кезеңі өтілді!`, `Phase “${tr(m[1], 2)}” complete!`]],
    [/^Финальный проект: (.+)$/, (m) => [`Қорытынды жоба: ${m[1]}`, `Final project: ${m[1]}`]],
    [/^Новый уровень: LVL (\d+)!$/, (m) => [`Жаңа деңгей: LVL ${m[1]}!`, `New level: LVL ${m[1]}!`]],
    [/^Челлендж выполнен: (.+)! \+(\d+) XP$/, (m) => [`Челлендж орындалды: ${tr(m[1], 1)}! +${m[2]} XP`, `Challenge done: ${tr(m[1], 2)}! +${m[2]} XP`]],
    [/^(.+): получено!$/, (m) => [`${tr(m[1], 1)}: алынды!`, `${tr(m[1], 2)}: unlocked!`]],
    [/^Суперлайк → (.+)!$/, (m) => [`Суперлайк → ${m[1]}!`, `Super like → ${m[1]}!`]],
    [/^Матч с (.+)!$/, (m) => [`${m[1]} — матч!`, `Match with ${m[1]}!`]],
    [/^Заявка сохранена: (.+)$/, (m) => [`Өтінім сақталды: ${m[1]}`, `Application saved: ${m[1]}`]],
    [/^(.+) · совпадение (\d+)%$/, (m) => [`${tr(m[1], 1)} · сәйкестік ${m[2]}%`, `${tr(m[1], 2)} · match ${m[2]}%`]],
    [/^Не получилось: (.+)$/, (m) => [`Болмады: ${tr(m[1], 1)}`, `Failed: ${tr(m[1], 2)}`]],
    [/^Новый план: (.+)$/, (m) => [`Жаңа жоспар: ${m[1]}`, `New plan: ${m[1]}`]],
    [/^AI учтёт твой класс \((.+)\) и навыки, проверенные в SkillProof\.$/, (m) => [`AI сыныбыңды (${tr(m[1], 1)}) және SkillProof-та тексерілген дағдыларды ескереді.`, `AI will take into account your grade (${tr(m[1], 2)}) and skills verified in SkillProof.`]],
    [/^(\d+) (?:ч|часов|часа|час) в неделю$/, (m) => [`аптасына ${m[1]} сағат`, `${m[1]} h per week`]],
    [/^(\d+) мес$/, (m) => [`${m[1]} ай`, `${m[1]} mo`]],
    [/^(.+) \+ онлайн$/, (m) => [`${tr(m[1], 1)} + онлайн`, `${tr(m[1], 2)} + online`]],
    [/^Детальная информация о (.+)$/, (m) => [`Толық ақпарат: ${tr(m[1], 1)}`, `Details: ${tr(m[1], 2)}`]],
    [/^Подать заявку на (.+)$/, (m) => [`${m[1]} — өтінім беру`, `Apply to ${m[1]}`]],
    [/^(.+) · (.+) · (.+)$/, (m) => [m.slice(1).map((x) => tr(x, 1)).join(" · "), m.slice(1).map((x) => tr(x, 2)).join(" · ")]],
    [/^(.+), (Алматы|Астана|Шымкент)$/, (m) => [`${tr(m[1], 1)}, ${m[2]}`, `${tr(m[1], 2)}, ${tr(m[2], 2)}`]],
  ];

  const DICT = new Map(PAIRS.map((p) => [p[0], p]));

  let lang = "ru"; // по умолчанию — язык браузера (kk / en), иначе русский
  try {
    const saved = localStorage.getItem("vx_lang");
    if (LANGS.includes(saved)) lang = saved;
    else if (/^kk/i.test(navigator.language)) lang = "kk";
    else if (/^en/i.test(navigator.language)) lang = "en";
  } catch (e) { /* хранилище недоступно — остаёмся на русском */ }

  // Перевод одной строки: idx 1 — казахский, 2 — английский
  function tr(s, idx) {
    const key = s.trim();
    if (!key || !/[А-Яа-яЁё]/.test(key)) return s;
    const hit = DICT.get(key);
    let out = null;
    if (hit) out = hit[idx];
    else {
      for (const [re, fn] of RULES) {
        const m = re.exec(key);
        if (m) { out = fn(m)[idx - 1]; break; }
      }
    }
    if (out == null) return s;
    const lead = s.match(/^\s*/)[0], tail = s.match(/\s*$/)[0];
    return lead + out + tail;
  }

  const ATTRS = ["placeholder", "aria-label", "title", "alt"];
  const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"]);
  const textOrig = new WeakMap(); // текстовый узел → { ru, out }
  const attrOrig = new WeakMap(); // элемент → { attr: { ru, out } }
  let busy = false;

  function translateText(node) {
    if (!node.parentNode || SKIP.has(node.parentNode.nodeName)) return;
    if (node.parentNode.closest && node.parentNode.closest("[data-no-i18n]")) return;
    let rec = textOrig.get(node);
    if (!rec || node.data !== rec.out) { // новый узел или приложение поменяло текст
      if (!/[А-Яа-яЁё]/.test(node.data)) { textOrig.delete(node); return; }
      rec = { ru: node.data, out: node.data };
      textOrig.set(node, rec);
    }
    const next = lang === "ru" ? rec.ru : tr(rec.ru, COL[lang]);
    if (next !== node.data) node.data = next;
    rec.out = next;
  }

  function translateAttrs(el) {
    let rec = attrOrig.get(el);
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      const cur = el.getAttribute(a);
      rec = rec || {};
      let r = rec[a];
      if (!r || cur !== r.out) {
        if (!/[А-Яа-яЁё]/.test(cur)) continue;
        r = { ru: cur, out: cur };
        rec[a] = r;
      }
      const next = lang === "ru" ? r.ru : tr(r.ru, COL[lang]);
      if (next !== cur) el.setAttribute(a, next);
      r.out = next;
    }
    if (rec) attrOrig.set(el, rec);
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { translateText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) {
      if (SKIP.has(root.nodeName)) { if (root.nodeName === "TEXTAREA") translateAttrs(root); return; }
      translateAttrs(root);
    }
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      if (n.nodeType === 3) translateText(n);
      else if (!SKIP.has(n.nodeName)) translateAttrs(n);
      else if (n.nodeName === "TEXTAREA") translateAttrs(n);
    }
  }

  function apply() {
    busy = true;
    try {
      document.documentElement.lang = HTML_LANG[lang];
      walk(document.body);
      if (document.title) {
        const t = document.querySelector("title");
        if (t) walk(t);
      }
      document.querySelectorAll(".lang-opt").forEach((b) => {
        const on = b.dataset.lang === lang;
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      document.querySelectorAll(".lang-cycle").forEach((b) => { b.textContent = LABEL[lang]; });
    } finally { busy = false; }
  }

  function setLang(l) {
    if (!LANGS.includes(l)) return;
    lang = l;
    try { localStorage.setItem("vx_lang", l); } catch (e) { /* ничего */ }
    apply();
    window.dispatchEvent(new CustomEvent("vx:lang", { detail: l }));
  }

  window.vxLang = () => lang;
  window.vxSetLang = setLang;
  window.vxCycleLang = () => setLang(LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]);
  window.vxT = (s) => (lang === "ru" ? s : tr(s, COL[lang]));

  function start() {
    apply();
    const mo = new MutationObserver((list) => {
      if (lang === "ru") return; // в русском режиме переводить нечего; исходники запомнятся при переключении
      busy = true;
      try {
        for (const m of list) {
          if (m.type === "characterData") translateText(m.target);
          else if (m.type === "attributes") translateAttrs(m.target);
          else m.addedNodes.forEach(walk);
        }
      } finally { busy = false; }
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
