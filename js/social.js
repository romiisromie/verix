// ════════════ НАСТОЯЩИЕ АККАУНТЫ: вход через GitHub, рейтинг, чат ════════════
// Если сервер с базой не настроен, Verix продолжает работать в браузерном режиме.
(function () {
  'use strict';
  let ME = null;         // { user, profile, skills, rep, place }
  let chatWith = null;   // { uid, name }
  let pollTimer = null;

  async function getJSON(url) {
    try { const r = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } }); return r.ok ? await r.json() : null; }
    catch (e) { return null; }
  }
  async function postJSON(url, body) {
    const r = await fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Ошибка сервера');
    return data;
  }
  const loggedIn = () => !!(ME && ME.user);
  window.vxAccount = () => ME;

  // ── вход и синхронизация ──
  window.vxGithubLogin = function () { location.href = '/api/auth/login'; };

  function mergeServer(data) {
    const p = loadP(), sp = data.profile || {};
    const tags = Array.isArray(sp.tags) ? sp.tags : [];
    if (sp.name) Object.assign(p, {
      name: sp.name, grade: sp.grade || p.grade, city: sp.city || p.city, goal: sp.goal || p.goal,
      tag1: tags[0] || '', tag2: tags[1] || '', tag3: tags[2] || '', onboarded: p.onboarded || Date.now(),
    });
    p.public = sp.public !== false; p.dm = sp.dm !== false; p.github = 'https://github.com/' + data.user.login;
    if (!sp.name && !p.onboarded) p.name = data.user.name || data.user.login;
    saveP(p);
    // навыки с сервера (только свои репозитории) — главный источник правды
    const server = (data.skills || []).map((s) => ({ skill: s.skill, score: s.score, level: s.level, source: 'github', repo: s.repo, date: s.at, owner: s.ownership }));
    const local = store.get('skills', []).filter((x) => !server.some((y) => y.skill === x.skill && (y.repo || '').toLowerCase() === (x.repo || '').toLowerCase()));
    store.set('skills', [...server, ...local].slice(0, 30));
  }

  async function syncProfile() {
    if (!loggedIn()) return;
    const p = loadP();
    try {
      await postJSON('/api/profile', { name: p.name, grade: p.grade, city: p.city, tags: [p.tag1, p.tag2, p.tag3].filter(Boolean), goal: p.goal || '', public: p.public !== false, dm: p.dm !== false });
      await refreshMe();
    } catch (e) { toast('Не получилось сохранить на сервере: ' + e.message); }
  }
  window.vxSyncProfile = syncProfile;

  async function refreshMe() {
    const data = await getJSON('/api/me');
    if (data && data.user) { ME = data; mergeServer(data); }
    if (window.renderProfile) { renderProfile(); renderSavedSkills(); }
    renderRankings();
    return data;
  }

  // Результат SkillProof: сохранился ли навык в аккаунте
  window.vxProofNote = function (proof) {
    if (!proof) return;
    if (proof.recorded) { toast(proof.ownership === 'owner' ? 'Навык сохранён в аккаунте: это твой репозиторий' : 'Навык сохранён в аккаунте: ты соавтор репозитория'); refreshMe(); }
    else if (proof.ownership === 'not_yours') toast('Это не твой репозиторий — в рейтинг он не попадёт');
  };

  // ── рейтинг ──
  async function renderRankings() {
    const box = document.getElementById('rankList'), mine = document.getElementById('myRankCard');
    if (!box) return;
    const data = await getJSON('/api/rank');
    if (!data || !Array.isArray(data.list)) return; // сервер не настроен — остаётся пояснение
    document.getElementById('rankHint').hidden = true;
    box.innerHTML = data.list.length ? data.list.map((r) => `
      <div class="proj rank-row${r.me ? ' rank-me' : ''}">
        <div class="rank-place">${r.place}</div>
        <div style="flex:1;min-width:0"><div class="proj-name">${esc(r.name)}${r.me ? ' · ' + esc('ты') : ''}</div><div class="proj-desc">${esc(r.grade)}${r.city ? ' · ' + esc(r.city) : ''}</div></div>
        <div class="proj-score">${esc(r.score)}</div>
        ${loggedIn() && !r.me && r.dm ? `<button type="button" class="nbtn rank-msg" data-uid="${esc(r.uid)}" data-name="${esc(r.name)}" onclick="vxOpenChat(this.dataset.uid,this.dataset.name)" aria-label="Написать">✉</button>` : ''}
      </div>`).join('') : `<div class="hint">${esc('Пока в рейтинге никого нет — стань первым: войди через GitHub и проверь свой проект.')}</div>`;
    if (mine && loggedIn()) {
      mine.innerHTML = ME.rep ? `<div class="proj rank-me"><div class="rank-place">${ME.place || '—'}</div><div style="flex:1;min-width:0"><div class="proj-name">${esc(loadP().name)}</div><div class="proj-desc">${esc('Скор по коду из своих репозиториев')}</div></div><div class="proj-score">${esc(ME.rep)}</div></div>`
        : `<div class="hint">${esc('Проверь в SkillProof свой репозиторий — и ты появишься в рейтинге.')}</div>`;
    } else if (mine && !loggedIn()) {
      if (!mine.querySelector('.gh-btn')) mine.insertAdjacentHTML('beforeend', `<button class="go-btn gh-btn" style="margin-top:10px" onclick="vxGithubLogin()">${esc('Войти через GitHub')}</button>`);
    }
    if (window.a11yRefresh) a11yRefresh(box);
  }
  window.vxRenderRankings = renderRankings;

  // ── чат ──
  function shell(title, body) {
    document.getElementById('modal-content').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><h2 style="font-family:var(--display);font-size:17px;">${esc(title)}</h2><button class="nbtn" onclick="vxCloseChat()" aria-label="Закрыть">×</button></div>${body}`;
    document.getElementById('modal-overlay').classList.add('show');
  }
  window.vxCloseChat = function () { clearInterval(pollTimer); pollTimer = null; chatWith = null; closeModal(); };

  window.vxOpenInbox = async function () {
    if (!loggedIn()) { toast('Войди через GitHub, чтобы писать ученикам'); return; }
    shell('Сообщения', `<div class="hint">${esc('Загружаем…')}</div>`);
    try {
      const { threads } = await postJSON('/api/chat', { action: 'threads' });
      shell('Сообщения', threads.length ? `<div style="display:flex;flex-direction:column;gap:7px;">${threads.map((t) => `<button type="button" class="proj" data-uid="${esc(t.uid)}" data-name="${esc(t.name)}" onclick="vxOpenChat(this.dataset.uid,this.dataset.name)" style="text-align:left"><div class="proj-name">${esc(t.name)}</div></button>`).join('')}</div>`
        : `<div class="hint">${esc('Пока нет переписок. Напиши ученику из рейтинга — кнопка ✉ рядом с его баллом.')}</div>`);
    } catch (e) { shell('Сообщения', `<div class="hint">${esc(e.message)}</div>`); }
  };

  async function loadMessages() {
    if (!chatWith) return;
    try {
      const { messages } = await postJSON('/api/chat', { action: 'messages', with: chatWith.uid });
      const box = document.getElementById('chatBox'); if (!box) return;
      const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
      box.innerHTML = messages.length ? messages.map((m) => `<div class="msg${m.mine ? ' msg-mine' : ''}"><div class="msg-t">${esc(m.text)}</div><div class="msg-at">${esc(new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</div></div>`).join('')
        : `<div class="hint">${esc('Начни разговор: расскажи о своём проекте или предложи сделать что-то вместе.')}</div>`;
      if (atBottom) box.scrollTop = box.scrollHeight;
    } catch (e) { /* временная ошибка сети — попробуем при следующем опросе */ }
  }

  window.vxOpenChat = function (uid, name) {
    if (!loggedIn()) { toast('Войди через GitHub, чтобы писать ученикам'); return; }
    chatWith = { uid: String(uid), name: String(name || '') };
    shell(chatWith.name, `
      <div class="chat-safety">${esc('Не делись телефоном, адресом и паролями. Если кто-то ведёт себя неприятно — нажми «Пожаловаться».')}</div>
      <div id="chatBox" class="chat-box" aria-live="polite"></div>
      <div class="chat-input"><label class="sr-only" for="chatText">${esc('Сообщение')}</label><textarea id="chatText" class="inp" maxlength="500" rows="2" placeholder="${esc('Напиши сообщение...')}"></textarea><button class="go-btn" id="chatSend" onclick="vxSend()">${esc('Отправить')}</button></div>
      <div style="display:flex;gap:8px;margin-top:8px;"><button class="outline-btn" style="margin:0;flex:1" onclick="vxBlock(false)">${esc('Заблокировать')}</button><button class="outline-btn danger-btn" style="margin:0;flex:1" onclick="vxBlock(true)">${esc('Пожаловаться')}</button></div>`);
    loadMessages();
    clearInterval(pollTimer); pollTimer = setInterval(loadMessages, 5000);
    const ta = document.getElementById('chatText');
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); window.vxSend(); } });
  };

  window.vxSend = async function () {
    const ta = document.getElementById('chatText'), btn = document.getElementById('chatSend');
    const text = ta.value.trim(); if (!text || !chatWith) return;
    btn.disabled = true;
    try { await postJSON('/api/chat', { action: 'send', with: chatWith.uid, text }); ta.value = ''; await loadMessages(); const b = document.getElementById('chatBox'); if (b) b.scrollTop = b.scrollHeight; }
    catch (e) { toast(e.message); }
    btn.disabled = false; ta.focus();
  };

  window.vxBlock = async function (report) {
    if (!chatWith) return;
    const q = report ? 'Пожаловаться на этого ученика? Он больше не сможет тебе писать.' : 'Заблокировать этого ученика? Он больше не сможет тебе писать.';
    if (!confirm(window.vxT ? vxT(q) : q)) return;
    try { await postJSON('/api/chat', { action: report ? 'report' : 'block', with: chatWith.uid }); toast(report ? 'Жалоба отправлена, ученик заблокирован' : 'Ученик заблокирован'); window.vxCloseChat(); }
    catch (e) { toast(e.message); }
  };

  // ── запуск ──
  document.addEventListener('DOMContentLoaded', async () => {
    const q = new URLSearchParams(location.search), st = q.get('login');
    if (st) {
      history.replaceState(null, '', location.pathname);
      if (st === 'error') toast('Не получилось войти через GitHub. Попробуй ещё раз.');
      if (st === 'unavailable') toast('Вход через GitHub ещё не настроен на сервере');
    }
    const data = await getJSON('/api/me');
    if (data && data.ready === false) document.querySelectorAll('.gh-only').forEach((el) => { el.hidden = true; });
    if (data && data.user) {
      ME = data; mergeServer(data);
      store.set('session', { email: data.user.login, github: true, at: Date.now() });
      if (st === 'ok') toast('Ты вошёл через GitHub: ' + data.user.login);
      if (window.showApp) showApp();
      renderProfile(); renderSavedSkills();
      // профиль из опроса, заполненный до входа, отправляем на сервер
      if (!(data.profile && data.profile.name) && loadP().onboarded) syncProfile();
    }
    renderRankings();
  });

  // Синхронизация после опроса и редактирования профиля
  const wrap = (name) => { const f = window[name]; if (typeof f !== 'function') return; window[name] = function () { const r = f.apply(this, arguments); setTimeout(syncProfile, 50); return r; }; };
  document.addEventListener('DOMContentLoaded', () => { wrap('vxObSave'); wrap('applyProfile'); });
  // Выход: и из браузера, и с сервера
  document.addEventListener('DOMContentLoaded', () => {
    const f = window.logout;
    window.logout = function () { const was = loggedIn(); f(); if (was) location.href = '/api/auth/logout'; };
  });
})();
