// ════════════ ГИДЫ ЕДУPATH: как делать каждую фазу + бесплатные курсы ════════════
// Все ссылки проверены 15.11.2026 (ответ 200). Тексты — на казахском, русском и английском.
(function () {
  'use strict';
  const L = (name, url) => ({ name, url });
  const G = (ru, kk, en, links) => ({ how: { ru, kk, en }, links });

  // Курсы по цели — для AI-планов и целей без готового шаблона
  const COURSES = {
    'Frontend Engineer': [L('MDN: учебник веб-разработки', 'https://developer.mozilla.org/ru/docs/Learn_web_development'), L('javascript.info', 'https://javascript.info/'), L('React — официальный учебник', 'https://react.dev/learn')],
    'Backend Developer': [L('Node.js Learn', 'https://nodejs.org/en/learn'), L('FastAPI tutorial', 'https://fastapi.tiangolo.com/tutorial/'), L('SQLBolt — SQL по шагам', 'https://sqlbolt.com/')],
    'Data Scientist': [L('Поколение Python (Stepik)', 'https://stepik.org/course/58852'), L('Kaggle Learn: Pandas', 'https://www.kaggle.com/learn/pandas'), L('Открытые данные РК', 'https://data.egov.kz/')],
    'ML Engineer': [L('Kaggle: Intro to ML', 'https://www.kaggle.com/learn/intro-to-machine-learning'), L('fast.ai', 'https://course.fast.ai/'), L('Hugging Face Learn', 'https://huggingface.co/learn')],
    'UI/UX Designer': [L('Figma Help Center', 'https://help.figma.com/hc/en-us'), L('Laws of UX', 'https://lawsofux.com/'), L('NN/g статьи по UX', 'https://www.nngroup.com/articles/')],
    'Mobile Developer': [L('Flutter: Get started', 'https://docs.flutter.dev/get-started'), L('React Native: Getting started', 'https://reactnative.dev/docs/getting-started')],
    'Game Developer': [L('Godot — документация на русском', 'https://docs.godotengine.org/ru/4.x/'), L('Геймджемы на itch.io', 'https://itch.io/jams')],
    'Cybersecurity': [L('picoCTF', 'https://picoctf.org/'), L('OverTheWire: Bandit', 'https://overthewire.org/wargames/bandit/'), L('OWASP Top 10', 'https://owasp.org/www-project-top-ten/')],
    _: [L('CS50 (Harvard)', 'https://cs50.harvard.edu/x/'), L('roadmap.sh', 'https://roadmap.sh/'), L('GitHub Skills', 'https://skills.github.com/')],
  };

  // Гиды для фаз шаблонов: ключ — id шаблона, индекс — номер фазы
  const PHASES = {
    frontend: [
      G('Сделай одну страницу о себе: разметка на HTML, оформление на CSS (flexbox), немного JavaScript — например, переключатель темы. Опубликуй её на GitHub Pages: это и будет первая задача, которую можно проверить в SkillProof.',
        'Өзің туралы бір бет жаса: HTML-де белгілеу, CSS-те безендіру (flexbox), аздап JavaScript — мысалы, тақырыпты ауыстыру. Оны GitHub Pages-те жарияла: бұл SkillProof-та тексеруге болатын алғашқы жұмыс.',
        'Build one page about yourself: HTML for structure, CSS (flexbox) for layout, a little JavaScript such as a theme switch. Publish it on GitHub Pages — that is your first project you can check in SkillProof.',
        [L('MDN: учебник веб-разработки', 'https://developer.mozilla.org/ru/docs/Learn_web_development'), L('Flexbox Froggy (игра)', 'https://flexboxfroggy.com/#ru'), L('GitHub Pages', 'https://pages.github.com/')]),
      G('Пройди «Quick Start» и «Thinking in React» в официальном учебнике, затем сделай маленькое приложение (список дел или погода) с компонентами, useState, useEffect и запросом к открытому API через fetch.',
        'Ресми оқулықтағы «Quick Start» және «Thinking in React» бөлімдерін өт, содан кейін компоненттері, useState, useEffect және fetch арқылы ашық API-ге сұрауы бар шағын қосымша (тапсырмалар тізімі немесе ауа райы) жаса.',
        'Do “Quick Start” and “Thinking in React” in the official tutorial, then build a small app (to-do list or weather) with components, useState, useEffect and a fetch call to an open API.',
        [L('React — официальный учебник', 'https://react.dev/learn'), L('React Router', 'https://reactrouter.com/'), L('javascript.info: промисы и fetch', 'https://javascript.info/')]),
      G('Переведи своё приложение на TypeScript, вынеси общее состояние в Zustand и напиши 3–5 тестов на Vitest. Тесты и CI SkillProof видит в репозитории — это прямо поднимает оценку сложности.',
        'Қосымшаңды TypeScript-ке ауыстыр, ортақ күйді Zustand-қа шығар және Vitest-те 3–5 тест жаз. SkillProof репозиторийдегі тесттер мен CI-ды көреді — бұл күрделілік бағасын тікелей көтереді.',
        'Move your app to TypeScript, put shared state into Zustand and write 3–5 Vitest tests. SkillProof sees tests and CI in the repository, which directly raises the complexity score.',
        [L('TypeScript Handbook', 'https://www.typescriptlang.org/docs/handbook/intro.html'), L('Zustand', 'https://zustand.docs.pmnd.rs/'), L('Vitest', 'https://vitest.dev/guide/')]),
      G('Сделай финальный проект, который решает реальную задачу (для школы, семьи, друзей), задеплой на Vercel, напиши понятный README. Проверь его в SkillProof и отправь заявки на 3 стажировки из TalentMatch с письмом и ссылкой на проект.',
        'Нақты мәселені шешетін қорытынды жоба жаса (мектепке, отбасыңа, достарыңа), Vercel-ге жарияла, түсінікті README жаз. Оны SkillProof-та тексеріп, TalentMatch-тағы 3 тағылымдамаға хат пен жоба сілтемесін қосып өтінім жібер.',
        'Build a final project that solves a real problem (for school, family or friends), deploy it on Vercel and write a clear README. Check it in SkillProof and apply to 3 internships in TalentMatch with a letter and a link.',
        [L('Vercel: первый деплой', 'https://vercel.com/docs/getting-started-with-vercel'), L('GitHub Skills', 'https://skills.github.com/')]),
    ],
    data: [
      G('Пройди первые модули «Поколения Python»: типы, циклы, функции. Затем научись читать CSV-файл и посчитай средний балл класса по предметам — это первый мини-проект для GitHub.',
        '«Поколение Python» курсының алғашқы модульдерін өт: типтер, циклдер, функциялар. Содан кейін CSV файлын оқуды үйреніп, сынып бағаларының пәндер бойынша орташасын есепте — бұл GitHub-қа арналған алғашқы шағын жоба.',
        'Do the first modules of “Поколение Python”: types, loops, functions. Then learn to read a CSV file and compute class averages by subject — your first mini project for GitHub.',
        [L('Поколение Python (Stepik)', 'https://stepik.org/course/58852'), L('Kaggle Learn: Python', 'https://www.kaggle.com/learn/python'), L('Python Tutorial', 'https://docs.python.org/3/tutorial/')]),
      G('Пройди курсы Pandas и Data Visualization на Kaggle. Возьми открытый датасет Казахстана (data.egov.kz), сформулируй 3 вопроса, ответь на них таблицами и графиками в Jupyter-ноутбуке и выложи на GitHub.',
        'Kaggle-дағы Pandas және Data Visualization курстарын өт. Қазақстанның ашық датасетін ал (data.egov.kz), 3 сұрақ қой, оларға Jupyter-ноутбукте кестелер мен графиктер арқылы жауап беріп, GitHub-қа жүкте.',
        'Take the Pandas and Data Visualization courses on Kaggle. Pick an open Kazakhstan dataset (data.egov.kz), ask 3 questions, answer them with tables and charts in a Jupyter notebook and push it to GitHub.',
        [L('Kaggle Learn: Pandas', 'https://www.kaggle.com/learn/pandas'), L('Kaggle: Data Visualization', 'https://www.kaggle.com/learn/data-visualization'), L('Открытые данные РК', 'https://data.egov.kz/')]),
      G('Пройди «Intro to Machine Learning» на Kaggle: деревья решений, переобучение, валидация. Обучи модель на своём датасете, сравни 2 метрики и честно опиши в README, где модель ошибается.',
        'Kaggle-дағы «Intro to Machine Learning» курсын өт: шешім ағаштары, қайта оқыту, валидация. Өз датасетіңде модель үйретіп, 2 метриканы салыстыр және модельдің қай жерде қателесетінін README-де адал жаз.',
        'Take “Intro to Machine Learning” on Kaggle: decision trees, overfitting, validation. Train a model on your dataset, compare 2 metrics and honestly describe in the README where the model fails.',
        [L('Kaggle: Intro to ML', 'https://www.kaggle.com/learn/intro-to-machine-learning'), L('scikit-learn: Getting started', 'https://scikit-learn.org/stable/getting_started.html')]),
      G('Собери лучший анализ в один репозиторий с README: вопрос, данные, метод, выводы, ограничения. Проверь его в SkillProof и прими участие в соревновании Kaggle или хакатоне по данным.',
        'Ең жақсы талдауыңды README-сі бар бір репозиторийге жина: сұрақ, деректер, әдіс, қорытындылар, шектеулер. Оны SkillProof-та тексеріп, Kaggle жарысына немесе деректер хакатонына қатыс.',
        'Put your best analysis into one repository with a README: question, data, method, conclusions, limitations. Check it in SkillProof and join a Kaggle competition or a data hackathon.',
        [L('Kaggle Competitions', 'https://www.kaggle.com/competitions'), L('roadmap.sh', 'https://roadmap.sh/')]),
    ],
    design: [
      G('Изучи основы: сетка, контраст, иерархия, 2–3 шрифтовые пары. Перерисуй в Figma один экран любимого приложения и объясни, почему он устроен именно так.',
        'Негіздерді үйрен: тор, контраст, иерархия, 2–3 қаріп жұбы. Сүйікті қосымшаңның бір экранын Figma-да қайта сал және оның неге дәл осылай құрылғанын түсіндір.',
        'Learn the basics: grid, contrast, hierarchy, 2–3 font pairs. Redraw one screen of your favorite app in Figma and explain why it is designed that way.',
        [L('Laws of UX', 'https://lawsofux.com/'), L('Material Design 3', 'https://m3.material.io/')]),
      G('Освой компоненты и Auto Layout в Figma, собери кликабельный прототип редизайна школьного сайта: главная, расписание, новости.',
        'Figma-да компоненттер мен Auto Layout-ты меңгеріп, мектеп сайтының редизайнына басылатын прототип жина: басты бет, сабақ кестесі, жаңалықтар.',
        'Learn components and Auto Layout in Figma and build a clickable prototype of a school website redesign: home, schedule, news.',
        [L('Figma Help Center', 'https://help.figma.com/hc/en-us')]),
      G('Проведи 5 коротких интервью с учениками, составь карту пути пользователя и проверь прототип на 3–5 людях. Запиши, что им мешало, и исправь.',
        'Оқушылармен 5 қысқа сұхбат өткіз, пайдаланушы жолының картасын құр және прототипті 3–5 адамда тексер. Оларға не кедергі болғанын жазып, түзет.',
        'Run 5 short interviews with students, build a user journey map and test the prototype with 3–5 people. Write down what got in their way and fix it.',
        [L('NN/g статьи по UX', 'https://www.nngroup.com/articles/')]),
      G('Оформи 2 кейса: задача, исследование, решения, результат. Опубликуй на Behance, а файлы и описание положи в репозиторий GitHub — так SkillProof сможет его проверить.',
        '2 кейс жаса: міндет, зерттеу, шешімдер, нәтиже. Behance-те жарияла, ал файлдар мен сипаттаманы GitHub репозиторийіне сал — сонда SkillProof оны тексере алады.',
        'Write up 2 case studies: problem, research, decisions, result. Publish them on Behance and put the files and description in a GitHub repository so SkillProof can check it.',
        [L('Behance', 'https://www.behance.net/')]),
    ],
  };

  // Общий гид для фазы плана без шаблона (AI-план или своя цель)
  const GENERIC = [
    G('Выбери один бесплатный курс по своей цели и проходи 3–4 урока в неделю. После каждого урока делай маленькое упражнение и сохраняй его в репозиторий GitHub.', 'Мақсатыңа сай бір тегін курс таңдап, аптасына 3–4 сабақ өт. Әр сабақтан кейін шағын жаттығу жасап, GitHub репозиторийіне сақта.', 'Pick one free course for your goal and do 3–4 lessons a week. After each lesson make a small exercise and save it to a GitHub repository.'),
    G('Каждую неделю — маленький законченный проект с README. Покажи код другу или учителю и исправь замечания.', 'Әр апта сайын — README-сі бар шағын аяқталған жоба. Кодты досыңа немесе мұғаліміңе көрсетіп, ескертулерді түзет.', 'Every week, a small finished project with a README. Show the code to a friend or teacher and fix their comments.'),
    G('Возьми тему посложнее, сделай проект в команде (по Git-веткам и pull request) и поучаствуй в хакатоне из TalentMatch.', 'Күрделірек тақырып алып, командамен жоба жаса (Git тармақтары мен pull request арқылы) және TalentMatch-тағы хакатонға қатыс.', 'Take a harder topic, build a project in a team (with Git branches and pull requests) and join a hackathon from TalentMatch.'),
    G('Сделай финальный проект, проверь его в SkillProof и отправь заявки на 3 возможности с письмом и ссылкой на репозиторий.', 'Қорытынды жоба жасап, оны SkillProof-та тексер және репозиторий сілтемесі мен хатты қосып, 3 мүмкіндікке өтінім жібер.', 'Build a final project, check it in SkillProof and apply to 3 opportunities with a letter and a repository link.'),
  ].map((g) => ({ how: g.how }));

  function pick(obj) { const l = window.vxLang ? vxLang() : 'ru'; return obj[l] || obj.ru; }

  window.vxGuide = function (templateId, goal, pi) {
    goal = goal || '';
    const g = (PHASES[templateId] && PHASES[templateId][pi]) || GENERIC[Math.min(pi, GENERIC.length - 1)];
    const links = g.links && g.links.length ? g.links : (COURSES[goal] || COURSES._);
    return { how: pick(g.how), links };
  };
})();
