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
    if (sp.name && sp.name !== 'Ученик') Object.assign(p, {
      name: sp.name, grade: sp.grade || p.grade, city: sp.city || p.city, goal: sp.goal || p.goal,
      tag1: tags[0] || '', tag2: tags[1] || '', tag3: tags[2] || '', onboarded: p.onboarded || Date.now(),
    });
    p.public = sp.public !== false; p.dm = sp.dm !== false; p.github = 'https://github.com/' + data.user.login;
    if ((!sp.name || sp.name === 'Ученик') && (!p.name || p.name === 'Ученик')) p.name = data.user.name || data.user.login;
    saveP(p);
    // навыки с сервера (только свои репозитории) — главный источник правды
    const server = (data.skills || []).map((s) => ({ skill: s.skill, score: s.score, level: s.level, source: 'github', repo: s.repo, date: s.at, owner: s.ownership }));
    const local = store.get('skills', []).filter((x) => !server.some((y) => y.skill === x.skill && (y.repo || '').toLowerCase() === (x.repo || '').toLowerCase()));
    store.set('skills', [...server, ...local].slice(0, 30));
  }

  async function syncProfile() {
    if (!loggedIn()) return;
    const p = loadP();
    if (!p.onboarded || !p.name || p.name === 'Ученик') return; // имя по умолчанию на сервер не отправляем
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
    const ac = document.getElementById('adminCard'); if (ac) ac.hidden = !(ME && ME.user && ME.user.admin);
    if (window.a11yRefresh) a11yRefresh(box);
  }
  window.vxRenderRankings = renderRankings;

  // ── чат ──
  function shell(title, body) {
    document.getElementById('modal-content').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><h2 style="font-family:var(--display);font-size:17px;">${esc(title)}</h2><button class="nbtn" onclick="vxCloseChat()" aria-label="Закрыть">×</button></div>${body}`;
    document.getElementById('modal-overlay').classList.add('show');
  }
  window.vxCloseChat = function () { clearInterval(pollTimer); pollTimer = null; chatWith = null; replyTo = null; closeModal(); };

  window.vxOpenInbox = async function () {
    if (!loggedIn()) { toast('Войди через GitHub, чтобы писать ученикам'); return; }
    shell('Сообщения', `<div class="hint">${esc('Загружаем…')}</div>`);
    try {
      const { threads } = await postJSON('/api/chat', { action: 'threads' });
      shell('Сообщения', threads.length ? `<div style="display:flex;flex-direction:column;gap:7px;">${threads.map((t) => `<button type="button" class="proj" data-uid="${esc(t.uid)}" data-name="${esc(t.name)}" onclick="vxOpenChat(this.dataset.uid,this.dataset.name)" style="text-align:left"><div class="proj-name">${esc(t.name)}</div></button>`).join('')}</div>`
        : `<div class="hint">${esc('Пока нет переписок. Напиши ученику из рейтинга — кнопка ✉ рядом с его баллом.')}</div>`);
    } catch (e) { shell('Сообщения', `<div class="hint">${esc(e.message)}</div>`); }
  };

  // ── сообщения: ответ, пересылка, удаление, перевод (как в мессенджерах) ──
  let lastRender = '', replyTo = null, msgs = [];
  const trans = {};          // id → { text, lang, show }
  const T = (s) => (window.vxT ? vxT(s) : s);
  const hhmm = (at) => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  function bubble(m) {
    if (m.deleted) return `<div class="msg msg-del${m.mine ? ' msg-mine' : ''}" data-id="${esc(m.id)}"><div class="msg-t">🚫 ${esc(T('Сообщение удалено'))}</div><div class="msg-at">${esc(hhmm(m.at))}</div></div>`;
    const tr = trans[m.id];
    const body = tr && tr.show
      ? `<div class="msg-t">${esc(tr.text)}</div><button type="button" class="msg-tr" data-act="orig" data-id="${esc(m.id)}">${esc(T('Перевод · показать оригинал'))}</button>`
      : `<div class="msg-t">${esc(m.text)}</div>`;
    const who = (mine) => (mine ? T('Ты') : chatWith.name);
    return `<div class="msg${m.mine ? ' msg-mine' : ''}" data-id="${esc(m.id)}" tabindex="0" role="button" aria-haspopup="menu" aria-label="${esc(T('Действия с сообщением'))}">`
      + (m.fwd ? `<div class="msg-fwd">↪ ${esc(T('Переслано от'))} ${esc(m.fwd.name)}</div>` : '')
      + (m.reply ? `<div class="msg-reply" data-act="jump" data-id="${esc(m.reply.id)}"><b>${esc(who(m.reply.mine))}</b><span>${esc(m.reply.text || T('Сообщение удалено'))}</span></div>` : '')
      + `${body}<div class="msg-at">${esc(hhmm(m.at))}</div></div>`;
  }

  async function loadMessages(force) {
    if (!chatWith) return;
    try {
      const { messages } = await postJSON('/api/chat', { action: 'messages', with: chatWith.uid });
      const box = document.getElementById('chatBox'); if (!box) return;
      msgs = messages;
      const html = messages.length ? messages.map(bubble).join('') : `<div class="hint">${esc(T('Начни разговор: расскажи о своём проекте или предложи сделать что-то вместе.'))}</div>`;
      if (!force && html === lastRender) return; // ничего не изменилось — не сбиваем меню и прокрутку
      const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
      closeMenu();
      box.innerHTML = html; lastRender = html;
      if (atBottom || force === 'bottom') box.scrollTop = box.scrollHeight;
    } catch (e) { /* временная ошибка сети — попробуем при следующем опросе */ }
  }
  function rerender() {
    const box = document.getElementById('chatBox'); if (!box) return;
    const top = box.scrollTop; box.innerHTML = lastRender = msgs.map(bubble).join(''); box.scrollTop = top;
  }

  function closeMenu() { const m = document.getElementById('msgMenu'); if (m) m.remove(); }
  function openMenu(id, el) {
    closeMenu();
    const m = msgs.find((x) => x.id === id); if (!m || m.deleted) return;
    const items = [['reply', '↩ ' + T('Ответить')], ['forward', '↪ ' + T('Переслать')], ['translate', '🌐 ' + T('Перевести')], ['copy', '⧉ ' + T('Копировать')], ['del_me', '🗑 ' + T('Удалить у меня')]];
    if (m.mine) items.push(['del_all', '🗑 ' + T('Удалить у всех')]);
    const menu = document.createElement('div');
    menu.id = 'msgMenu'; menu.className = 'msg-menu'; menu.setAttribute('role', 'menu');
    menu.innerHTML = items.map(([a, l]) => `<button type="button" role="menuitem" data-act="${a}"${a.startsWith('del') ? ' class="danger"' : ''}>${esc(l)}</button>`).join('');
    const wrap = document.getElementById('chatWrap'); wrap.appendChild(menu);
    const r = el.getBoundingClientRect(), w = wrap.getBoundingClientRect();
    menu.style.top = Math.max(4, Math.min(r.bottom - w.top + 4, w.height - menu.offsetHeight - 4)) + 'px';
    menu.style[m.mine ? 'right' : 'left'] = '8px';
    menu.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { closeMenu(); doAction(b.dataset.act, m); } });
    menu.querySelector('button').focus();
  }

  async function doAction(act, m) {
    try {
      if (act === 'reply') { replyTo = m; showReplyBar(); document.getElementById('chatText').focus(); }
      else if (act === 'copy') { await navigator.clipboard.writeText(m.text); toast(T('Скопировано')); }
      else if (act === 'translate') {
        const lang = window.vxLang ? vxLang() : 'ru';
        if (!trans[m.id] || trans[m.id].lang !== lang) {
          toast(T('Переводим…'));
          const r = await postJSON('/api/chat', { action: 'translate', with: chatWith.uid, id: m.id, lang });
          trans[m.id] = { text: r.text, lang, show: true };
        } else trans[m.id].show = true;
        rerender();
      } else if (act === 'del_me' || act === 'del_all') {
        const all = act === 'del_all';
        if (!confirm(T(all ? 'Удалить сообщение у всех? Собеседник тоже его не увидит.' : 'Удалить сообщение только у тебя? У собеседника оно останется.'))) return;
        await postJSON('/api/chat', { action: 'delete', with: chatWith.uid, id: m.id, for_all: all });
        if (replyTo && replyTo.id === m.id) { replyTo = null; showReplyBar(); }
        await loadMessages(true);
      } else if (act === 'forward') openForward(m);
    } catch (e) { toast(e.message); }
  }

  function showReplyBar() {
    const bar = document.getElementById('replyBar'); if (!bar) return;
    bar.hidden = !replyTo;
    bar.innerHTML = replyTo ? `<div class="rb-text"><b>${esc(T('Ответ'))}: ${esc(replyTo.mine ? T('Ты') : chatWith.name)}</b><span>${esc(replyTo.text)}</span></div><button type="button" class="nbtn" onclick="vxCancelReply()" aria-label="${esc(T('Отменить ответ'))}">×</button>` : '';
  }
  window.vxCancelReply = () => { replyTo = null; showReplyBar(); };

  // Переслать: выбрать получателя из своих переписок или из рейтинга
  async function openForward(m) {
    const wrap = document.getElementById('chatWrap');
    const old = document.getElementById('fwdSheet'); if (old) old.remove();
    const sheet = document.createElement('div'); sheet.className = 'fwd-sheet'; sheet.id = 'fwdSheet';
    sheet.innerHTML = `<div class="fwd-head"><b>${esc(T('Переслать кому?'))}</b><button type="button" class="nbtn" aria-label="${esc(T('Закрыть'))}">×</button></div><div class="fwd-list"><div class="hint">${esc(T('Загружаем…'))}</div></div>`;
    wrap.appendChild(sheet);
    sheet.querySelector('.fwd-head button').onclick = () => sheet.remove();
    const [th, rk] = await Promise.all([postJSON('/api/chat', { action: 'threads' }).catch(() => ({ threads: [] })), getJSON('/api/rank')]);
    const seen = new Set(), people = [];
    (th.threads || []).concat(((rk && rk.list) || []).filter((r) => !r.me && r.dm)).forEach((p) => { if (!seen.has(p.uid)) { seen.add(p.uid); people.push(p); } });
    const list = sheet.querySelector('.fwd-list');
    list.innerHTML = people.length ? people.map((p) => `<button type="button" class="proj" data-uid="${esc(p.uid)}" style="text-align:left"><div class="proj-name">${esc(p.name)}</div></button>`).join('') : `<div class="hint">${esc(T('Пока некому переслать.'))}</div>`;
    list.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-uid]'); if (!b) return;
      try {
        await postJSON('/api/chat', { action: 'forward', with: chatWith.uid, id: m.id, to: b.dataset.uid });
        sheet.remove(); toast(T('Переслано') + ': ' + b.textContent.trim());
        if (b.dataset.uid === chatWith.uid) loadMessages('bottom');
      } catch (err) { toast(err.message); }
    });
  }

  window.vxOpenChat = function (uid, name) {
    if (!loggedIn()) { toast('Войди через GitHub, чтобы писать ученикам'); return; }
    chatWith = { uid: String(uid), name: String(name || '') };
    replyTo = null; lastRender = ''; msgs = [];
    shell(chatWith.name, `
      <div id="chatWrap" class="chat-wrap">
      <div class="chat-safety">${esc('Не делись телефоном, адресом и паролями. Если кто-то ведёт себя неприятно — нажми «Пожаловаться».')}</div>
      <div id="chatBox" class="chat-box" aria-live="polite"></div>
      <div id="replyBar" class="reply-bar" hidden></div>
      <div class="chat-input"><label class="sr-only" for="chatText">${esc('Сообщение')}</label><textarea id="chatText" class="inp" maxlength="500" rows="2" placeholder="${esc('Напиши сообщение...')}"></textarea><button class="go-btn" id="chatSend" onclick="vxSend()">${esc('Отправить')}</button></div>
      <div class="hint" style="font-size:11px;margin-top:6px">${esc('Нажми на сообщение: ответить, переслать, перевести или удалить.')}</div>
      <button class="outline-btn" style="margin:8px 0 0;width:100%" onclick="vxClearChat()">${esc('🧹 Очистить чат')}</button>
      <div style="display:flex;gap:8px;margin-top:8px;"><button class="outline-btn" style="margin:0;flex:1" onclick="vxBlock(false)">${esc('Заблокировать')}</button><button class="outline-btn danger-btn" style="margin:0;flex:1" onclick="vxBlock(true)">${esc('Пожаловаться')}</button></div>
      </div>`);
    loadMessages('bottom');
    clearInterval(pollTimer); pollTimer = setInterval(loadMessages, 5000);
    const ta = document.getElementById('chatText'), box = document.getElementById('chatBox');
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); window.vxSend(); }
      if (e.key === 'Escape') window.vxCancelReply();
    });
    box.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]');
      if (act && act.dataset.act === 'orig') { trans[act.dataset.id].show = false; rerender(); return; }
      if (act && act.dataset.act === 'jump') {
        const t = box.querySelector(`.msg[data-id="${CSS.escape(act.dataset.id)}"]`);
        if (t) { t.scrollIntoView({ block: 'center', behavior: 'smooth' }); t.classList.add('msg-flash'); setTimeout(() => t.classList.remove('msg-flash'), 1200); }
        return;
      }
      const el = e.target.closest('.msg[data-id]');
      if (el && !el.classList.contains('msg-del')) openMenu(el.dataset.id, el);
    });
    box.addEventListener('keydown', (e) => { const el = e.target.closest('.msg[data-id]'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openMenu(el.dataset.id, el); } });
    box.addEventListener('scroll', closeMenu);
    document.getElementById('chatWrap').addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  };

  window.vxSend = async function () {
    const ta = document.getElementById('chatText'), btn = document.getElementById('chatSend');
    const text = ta.value.trim(); if (!text || !chatWith) return;
    btn.disabled = true;
    try {
      await postJSON('/api/chat', { action: 'send', with: chatWith.uid, text, reply_to: replyTo ? replyTo.id : undefined });
      ta.value = ''; replyTo = null; showReplyBar(); await loadMessages('bottom');
    } catch (e) { toast(e.message); }
    btn.disabled = false; ta.focus();
  };

  // Очистить чат: у себя (собеседник всё видит) или у обоих (переписка удаляется из базы)
  window.vxClearChat = function () {
    const wrap = document.getElementById('chatWrap'); if (!wrap || !chatWith) return;
    const old = document.getElementById('fwdSheet'); if (old) old.remove();
    const sheet = document.createElement('div'); sheet.className = 'fwd-sheet'; sheet.id = 'fwdSheet';
    sheet.innerHTML = `<div class="fwd-head"><b>${esc(T('Очистить чат?'))}</b><button type="button" class="nbtn" data-c="cancel" aria-label="${esc(T('Закрыть'))}">×</button></div>
      <div class="hint">${esc(T('Это действие нельзя отменить.'))}</div>
      <button type="button" class="outline-btn" style="margin:0" data-c="me">${esc(T('Очистить у меня'))}</button>
      <button type="button" class="outline-btn danger-btn" style="margin:0" data-c="all">${esc(T('Очистить у меня и у'))} ${esc(chatWith.name)}</button>
      <button type="button" class="outline-btn" style="margin:0" data-c="cancel">${esc(T('Отмена'))}</button>`;
    wrap.appendChild(sheet);
    sheet.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-c]'); if (!b) return;
      if (b.dataset.c === 'cancel') { sheet.remove(); return; }
      try {
        await postJSON('/api/chat', { action: 'clear', with: chatWith.uid, for_all: b.dataset.c === 'all' });
        sheet.remove(); replyTo = null; showReplyBar(); toast(T('Чат очищен')); await loadMessages(true);
      } catch (err) { toast(err.message); }
    });
    sheet.querySelector('[data-c="me"]').focus();
  };

  // ── админ-панель: кто зарегистрировался ──
  window.vxOpenAdmin = async function () {
    const title = 'Кто зарегистрировался';
    shell(title, `<div class="hint">${esc('Загружаем…')}</div>`);
    let d;
    try {
      const r = await fetch('/api/admin', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
      d = await r.json(); if (!r.ok) throw new Error(d.error || 'Ошибка сервера');
    } catch (e) { shell(title, `<div class="hint">${esc(e.message)}</div>`); return; }
    const date = (t) => (t ? new Date(t).toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
    const stat = (n, l) => `<div class="adm-stat"><b>${esc(n)}</b><span>${esc(l)}</span></div>`;
    const ST = { login: ['Только вошёл', 'st-login'], survey: ['Прошёл опрос', 'st-survey'], skill: ['Проверил навык', 'st-skill'] };
    const row = (u) => `<div class="proj adm-row" data-st="${esc(u.status)}">
        <div style="flex:1;min-width:0"><div class="proj-name">${esc(u.name || u.gh_name || u.login)} <a href="${esc(safeUrl('https://github.com/' + u.login))}" target="_blank" rel="noopener">@${esc(u.login)}</a></div>
        <div><span class="adm-badge ${ST[u.status][1]}">${esc(ST[u.status][0])}</span></div>
        <div class="proj-desc">${esc([u.grade, u.city, u.goal].filter(Boolean).join(' · ') || 'опрос не пройден')}</div>
        <div class="proj-desc">${esc('Регистрация')}: ${esc(date(u.created))} · ${esc('последний визит')}: ${esc(date(u.seen))}</div>
        <div class="proj-desc">${esc('навыков')}: ${esc(u.skills)} · ${esc('переписок')}: ${esc(u.chats)}${u.public ? '' : ' · ' + esc('скрыт из рейтинга')}</div></div>
        <div class="proj-score">${u.place ? '#' + esc(u.place) : '—'}</div></div>`;
    const reports = d.reports.length ? `<div class="lbl" style="margin-top:12px">${esc('Жалобы')} (${esc(d.reports.length)})</div>` + d.reports.map((r) => `<div class="proj-desc">${esc(date(r.at))}: uid ${esc(r.from)} → uid ${esc(r.about)}${r.note ? ' — ' + esc(r.note) : ''}</div>`).join('') : '';
    const n = (st) => d.users.filter((u) => u.status === st).length;
    const chips = [['all', 'Все', d.total], ['login', 'Только вошли', n('login')], ['survey', 'Прошли опрос', n('survey')], ['skill', 'Проверили навык', n('skill')]]
      .map(([k, l, c], i) => `<button type="button" class="adm-chip${i ? '' : ' on'}" data-f="${k}">${esc(l)} · ${esc(c)}</button>`).join('');
    shell(title, `<div class="adm-stats">${stat(d.total, 'всего')}${stat(d.today, 'за сутки')}${stat(d.week, 'за неделю')}${stat(d.active_week, 'заходили за неделю')}</div>
      <div class="adm-chips">${chips}</div>
      <div class="adm-list" id="admList">${d.users.map(row).join('') || `<div class="hint">${esc('Пока никто не зарегистрировался.')}</div>`}</div>${reports}`);
    document.querySelector('.adm-chips').addEventListener('click', (e) => {
      const b = e.target.closest('[data-f]'); if (!b) return;
      document.querySelectorAll('.adm-chip').forEach((x) => x.classList.toggle('on', x === b));
      document.querySelectorAll('#admList .adm-row').forEach((r) => { r.hidden = b.dataset.f !== 'all' && r.dataset.st !== b.dataset.f; });
    });
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
    // Кнопку входа показываем, только если сервер ответил, что вход через GitHub настроен
    document.querySelectorAll('.gh-only').forEach((el) => { el.hidden = !(data && data.ready); });
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
