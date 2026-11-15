// ════════════ ОПРОС ПРИ ПЕРВОМ ВХОДЕ ════════════
// Короткая анкета: по ответам заполняется профиль, выбирается цель роадмапа
// и настраиваются фильтры TalentMatch — дальше Verix подстраивается под ученика.
(function () {
  'use strict';
  const CITIES = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Атырау', 'Павлодар', 'Усть-Каменогорск', 'Тараз', 'Костанай', 'Кызылорда', 'Уральск', 'Туркестан', 'Другой город'];
  const GOALS = ['Frontend Engineer', 'Backend Developer', 'Data Scientist', 'ML Engineer', 'UI/UX Designer', 'Mobile Developer', 'Game Developer', 'Cybersecurity'];
  const GOAL_TAG = { 'Frontend Engineer': 'Frontend', 'Backend Developer': 'Backend', 'Data Scientist': 'Data', 'ML Engineer': 'AI/ML', 'UI/UX Designer': 'Design', 'Mobile Developer': 'Mobile', 'Game Developer': 'Game Dev', 'Cybersecurity': 'Cybersecurity' };
  const TAGS = ['Frontend', 'Backend', 'AI/ML', 'Data', 'Design', 'Mobile', 'Game Dev', 'Cybersecurity'];
  const LEVELS = ['Только начинаю', 'Делал(а) учебные проекты', 'Есть свой проект'];
  const HOURS = [2, 4, 6, 8, 12, 16];
  const GRADES_OB = ['8 класс', '9 класс', '10 класс', '11 класс'];

  const chip = (group, value, on) => `<button type="button" class="ob-chip${on ? ' on' : ''}" data-group="${group}" data-value="${esc(value)}" aria-pressed="${on}" onclick="vxObPick(this)">${esc(value)}</button>`;

  window.vxObPick = function (el) {
    const g = el.dataset.group, multi = g === 'tags';
    if (multi) {
      const on = document.querySelectorAll('.ob-chip.on[data-group="tags"]').length;
      if (!el.classList.contains('on') && on >= 3) { toast('Можно выбрать до 3 направлений'); return; }
      el.classList.toggle('on');
    } else {
      document.querySelectorAll(`.ob-chip[data-group="${g}"]`).forEach((b) => b.classList.toggle('on', b === el));
    }
    document.querySelectorAll(`.ob-chip[data-group="${g}"]`).forEach((b) => b.setAttribute('aria-pressed', b.classList.contains('on')));
  };

  const picked = (g) => [...document.querySelectorAll(`.ob-chip.on[data-group="${g}"]`)].map((b) => b.dataset.value);

  window.vxOnboarding = function () {
    const p = loadP();
    const tags = [p.tag1, p.tag2, p.tag3].filter(Boolean);
    const city = (p.city || '').split(',')[0].trim();
    document.getElementById('modal-content').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <h2 style="font-family:var(--display);font-size:18px;">Расскажи о себе</h2>
        <button class="nbtn" onclick="closeModal()" aria-label="Закрыть">×</button>
      </div>
      <div class="hint" style="margin-bottom:12px;">6 вопросов, 1 минута. По ответам Verix подберёт цель, план и возможности именно для тебя.</div>
      <div class="ob-form">
        <label class="lbl" for="obName">1. Как тебя зовут?</label>
        <input class="inp" id="obName" maxlength="60" autocomplete="name" placeholder="Имя и фамилия" value="${p.name && p.name !== 'Ученик' ? esc(p.name) : ''}">
        <div class="lbl">2. Класс</div>
        <div class="ob-chips">${GRADES_OB.map((g) => chip('grade', g, g === p.grade)).join('')}</div>
        <label class="lbl" for="obCity">3. Город</label>
        <select class="inp" id="obCity">${CITIES.map((c) => `<option${c === city ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select>
        <div class="lbl">4. Что тебе интересно? (до 3)</div>
        <div class="ob-chips">${TAGS.map((t) => chip('tags', t, tags.includes(t))).join('')}</div>
        <div class="lbl">5. Кем хочешь стать?</div>
        <div class="ob-chips">${GOALS.map((g) => chip('goal', g, g === p.goal)).join('')}</div>
        <div class="lbl">6. Твой опыт и время</div>
        <div class="ob-chips">${LEVELS.map((l) => chip('level', l, l === p.experience)).join('')}</div>
        <select class="inp" id="obHours" aria-label="Часов в неделю">${HOURS.map((h) => `<option value="${h}"${h === (p.hours || 6) ? ' selected' : ''}>${h} ч в неделю</option>`).join('')}</select>
        <label class="lbl" for="obGithub">Ссылка на твой GitHub (если есть)</label>
        <input class="inp" id="obGithub" type="url" maxlength="100" placeholder="https://github.com/имя" value="${esc(p.github || '')}">
        <button class="go-btn" onclick="vxObSave()">Готово</button>
      </div>`;
    document.getElementById('modal-overlay').classList.add('show');
  };

  window.vxObSave = function () {
    const name = document.getElementById('obName').value.trim();
    const grade = picked('grade')[0], goal = picked('goal')[0], level = picked('level')[0];
    let tags = picked('tags');
    const gh = document.getElementById('obGithub').value.trim();
    if (name.length < 2) { toast('Напиши, как тебя зовут'); document.getElementById('obName').focus(); return; }
    if (!grade) { toast('Выбери класс'); return; }
    if (!goal) { toast('Выбери, кем хочешь стать'); return; }
    if (gh && !/^https:\/\/github\.com\/[A-Za-z0-9-]{1,39}\/?$/.test(gh)) { toast('Ссылка на GitHub должна быть вида https://github.com/имя'); return; }
    if (!tags.length) tags = [GOAL_TAG[goal]];
    const cityRaw = document.getElementById('obCity').value;
    const p = loadP();
    Object.assign(p, {
      name, grade, city: cityRaw === 'Другой город' ? 'Казахстан' : cityRaw + ', Казахстан',
      tag1: tags[0] || '', tag2: tags[1] || '', tag3: tags[2] || '',
      goal, experience: level || '', hours: +document.getElementById('obHours').value || 6,
      github: gh.replace(/\/$/, ''), onboarded: Date.now(),
    });
    saveP(p);
    store.set('rm_hours', p.hours);
    // TalentMatch: только мой класс, мой город + онлайн
    store.set('opp_filter', { type: 'all', city: cityRaw === 'Другой город' ? 'all' : cityRaw, mine: true });
    // EduPath: план под выбранную цель, если ученик ещё не начал свой
    if (window.rmSetGoal) rmSetGoal(goal, false);
    closeModal();
    renderProfile(); renderDashboard();
    if (window.renderOppFilters) { renderOppFilters(); buildDeck(); renderOpp(); }
    toast('Готово! Verix настроен под тебя');
  };

  // Показываем анкету один раз — сразу после первого входа
  window.vxMaybeOnboard = function () {
    if (!loadP().onboarded) setTimeout(() => window.vxOnboarding(), 400);
  };
})();
