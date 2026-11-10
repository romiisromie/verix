'use strict';
// ════════════ HELPERS & STORAGE ════════════
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const store={
  get(k,def){try{const v=localStorage.getItem('vx_'+k);return v===null?def:JSON.parse(v);}catch(e){return def;}},
  set(k,v){try{localStorage.setItem('vx_'+k,JSON.stringify(v));}catch(e){}},
  del(k){try{localStorage.removeItem('vx_'+k);}catch(e){}}
};
function nowTime(){const d=new Date();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}

// ════════════ PROFILE DATA ════════════
const DEFAULTS = {
  name:'Рамина Ибраимова', grade:'10 класс', city:'Алматы, Казахстан',
  emoji:'', level:7, about:'Frontend разработчица, люблю создавать продукты с нуля.',
  tag1:'Frontend', tag2:'AI/ML', tag3:'Design'
};
const TAG_ICONS = {Frontend:'','AI/ML':'',Design:'',Backend:'',Data:'',Mobile:'','Game Dev':'',Cybersecurity:''};
const GRADES = ['8 класс','9 класс','10 класс','11 класс','1 курс','2 курс','3 курс','4 курс'];
const SKILL_TAGS = ['Frontend','AI/ML','Design','Backend','Data','Mobile','Game Dev','Cybersecurity'];

function loadP(){const v=store.get('p',null);return v&&typeof v==='object'?{...DEFAULTS,...v}:{...DEFAULTS};}
function saveP(d){store.set('p',d);}

function renderProfile(){
  const p=loadP();
  document.getElementById('avatarEmoji').textContent=p.name.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');
  document.getElementById('levelBadge').textContent='LVL '+p.level;
  document.getElementById('profileName').textContent=p.name;
  document.getElementById('profileSub').textContent=p.grade+' · '+p.city;
  const tags=[p.tag1,p.tag2,p.tag3].filter(Boolean);
  document.getElementById('profileTags').innerHTML=tags.map((t,i)=>
    `<span class="tag ${i<2?'h':''}">${esc(t)}</span>`
  ).join('');
}

// ════════════ EDIT PROFILE MODAL ════════════
function openEditProfile(){
  const p=loadP();
  const grOpts=GRADES.map(g=>`<option value="${g}"${p.grade===g?' selected':''}>${g}</option>`).join('');
  const tOpts=(cur)=>SKILL_TAGS.map(t=>`<option value="${t}"${cur===t?' selected':''}>${t}</option>`).join('');

  document.getElementById('modal-content').innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <div style="font-size:17px;font-weight:600;">Редактировать профиль</div>
      <span onclick="closeModal()" style="cursor:pointer;font-size:26px;color:var(--muted);touch-action:manipulation;padding:4px;">×</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:13px;">
      <div>
        <label class="lbl" for="e_name" style="display:block">Имя</label>
        <input class="inp" id="e_name" value="${esc(p.name)}" maxlength="60" autocomplete="name" placeholder="Твоё имя">
      </div>
      <div style="display:flex;gap:8px;">
        <div style="flex:1;">
          <label class="lbl" for="e_grade" style="display:block">Класс / Курс</label>
          <select class="inp" id="e_grade">${grOpts}</select>
        </div>
        <div style="flex:1;">
          <label class="lbl" for="e_level" style="display:block">Уровень (1–10)</label>
          <input class="inp" id="e_level" type="number" min="1" max="10" value="${p.level}" inputmode="numeric">
        </div>
      </div>
      <div>
        <label class="lbl" for="e_city" style="display:block">Город</label>
        <input class="inp" id="e_city" value="${esc(p.city)}" maxlength="60" placeholder="Город, Страна">
      </div>
      <div>
        <label class="lbl" for="e_about" style="display:block">О себе</label>
        <textarea class="inp" id="e_about" style="resize:none;height:68px;line-height:1.5;" maxlength="300">${esc(p.about)}</textarea>
      </div>
      <div>
        <div class="lbl">Направления (3 тега)</div>
        <div style="display:flex;gap:6px;">
          <select class="inp" id="e_t1" style="flex:1;">${tOpts(p.tag1)}</select>
          <select class="inp" id="e_t2" style="flex:1;">${tOpts(p.tag2)}</select>
          <select class="inp" id="e_t3" style="flex:1;">${tOpts(p.tag3)}</select>
        </div>
      </div>
      <button class="go-btn" onclick="applyProfile()">Сохранить</button>
      <button class="outline-btn danger-btn" style="margin-top:0;" onclick="if(confirm('Сбросить профиль к стандартному?')){store.del('p');renderProfile();closeModal();toast('Сброшено');}">Сбросить профиль</button>
      <button class="outline-btn" style="margin-top:0;" onclick="logout()">Выйти из аккаунта</button>
    </div>`;

  document.getElementById('modal-overlay').classList.add('show');
}

function applyProfile(){
  const p=loadP();
  p.name=document.getElementById('e_name').value.trim()||p.name;
  p.grade=document.getElementById('e_grade').value;
  p.city=document.getElementById('e_city').value.trim()||p.city;
  p.about=document.getElementById('e_about').value.trim();
  p.level=Math.min(10,Math.max(1,parseInt(document.getElementById('e_level').value)||p.level));
  p.tag1=document.getElementById('e_t1').value;
  p.tag2=document.getElementById('e_t2').value;
  p.tag3=document.getElementById('e_t3').value;
  saveP(p);renderProfile();closeModal();toast('Профиль сохранён!');
}

// ════════════ TABS ════════════
function switchTab(name){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');
  document.getElementById('tab-'+name).classList.add('active');
}

// ════════════ TOAST ════════════
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  clearTimeout(window._tt);
  window._tt=setTimeout(()=>t.classList.remove('show'),2500);
}

// ════════════ MODALS ════════════
function openModal(key){
  if(key==='edit-profile'){openEditProfile();return;}
  const m=MODALS[key];if(!m)return;
  document.getElementById('modal-content').innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:${m.sub?'4px':'14px'}">
      <div style="font-size:17px;font-weight:600;flex:1;min-width:0;">${m.title}</div>
      <span onclick="closeModal()" style="cursor:pointer;font-size:26px;color:var(--muted);margin-left:10px;flex-shrink:0;touch-action:manipulation;padding:4px;">×</span>
    </div>
    ${m.sub?`<div style="font-size:12px;color:var(--muted2);margin-bottom:14px;">${m.sub}</div>`:''}
    ${m.body}`;
  document.getElementById('modal-overlay').classList.add('show');
}
function closeModal(){document.getElementById('modal-overlay').classList.remove('show');}
function closeModalOutside(e){if(e.target===document.getElementById('modal-overlay'))closeModal();}

const MODALS={
  notif:{title:'Уведомления',sub:'',body:`<div style="display:flex;flex-direction:column;gap:10px;">
    <div class="proj"><div class="proj-ico" style="background:var(--s3)"></div><div style="flex:1"><div class="proj-name">Новый матч!</div><div class="proj-desc">Kolesa Group · 2ч назад</div></div></div>
    <div class="proj"><div class="proj-ico" style="background:var(--s3)"></div><div style="flex:1"><div class="proj-name">Скор вырос до 86</div><div class="proj-desc">+4 очка за неделю · 1д назад</div></div></div>
    <div class="proj"><div class="proj-ico" style="background:var(--s3)"></div><div style="flex:1"><div class="proj-name">Новое достижение</div><div class="proj-desc">«Стрик 7 дней» · 2д назад</div></div></div>
  </div>`},
  share:{title:'Поделиться профилем',sub:'Покажи навыки университетам и работодателям',body:`
    <div style="background:var(--s2);border-radius:13px;padding:14px;text-align:center;margin-bottom:14px;">
      <div style="font-size:11px;color:var(--muted);margin-bottom:4px;">Публичная ссылка</div>
      <div style="font-size:14px;font-weight:600;color:var(--accent);">verix.app/u/ramina</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <button class="go-btn" onclick="shareProfile()">Поделиться ссылкой</button>
      <button class="outline-btn" style="margin:0;" onclick="closeModal();setTimeout(()=>window.print(),150)">Сохранить профиль в PDF</button>
      <button class="outline-btn" style="margin:0;" onclick="emailProfile()">Отправить на email</button>
    </div>`},
  'skillproof-info':{title:'Как работает SkillProof AI',sub:'',body:`<div style="display:flex;flex-direction:column;gap:12px;">
    <div class="proj"><div class="proj-ico" style="background:var(--s3)">1</div><div style="flex:1"><div class="proj-name">Выбираешь навык</div><div class="proj-desc">React, Python, ML, Design и другие</div></div></div>
    <div class="proj"><div class="proj-ico" style="background:var(--s3)">2</div><div style="flex:1"><div class="proj-name">Описываешь проект</div><div class="proj-desc">Технологии, что сделала, сложность</div></div></div>
    <div class="proj"><div class="proj-ico" style="background:var(--s3)">3</div><div style="flex:1"><div class="proj-name">AI анализирует</div><div class="proj-desc">Сложность, оригинальность, уровень</div></div></div>
    <div class="proj"><div class="proj-ico" style="background:var(--s3)">4</div><div style="flex:1"><div class="proj-name">Добавляешь в профиль</div><div class="proj-desc">Скор виден работодателям</div></div></div>
  </div>`},
  'talent-info':{title:'Как работает TalentMatch',sub:'',body:`<div style="display:flex;flex-direction:column;gap:10px;">
    <div style="font-size:13px;color:var(--muted2);line-height:1.6;">Подбирает стажировки, гранты и конкурсы под твой профиль.</div>
    <div class="ai-verd"><div class="ai-verd-h">Как свайпать:</div><div class="ai-verd-t"><strong>✕</strong> — не интересно &nbsp; <strong></strong> — суперлайк &nbsp; <strong>✓</strong> — хочу матч</div></div>
  </div>`},
  projects:{title:'Все проекты (7)',sub:'',body:`<div style="display:flex;flex-direction:column;gap:8px;">
    <div class="proj" onclick="closeModal();toast('Verix App')"><div class="proj-ico" style="background:var(--s3)"></div><div style="flex:1"><div class="proj-name">Verix App</div><div class="proj-desc">React Native · 91/100</div></div><div class="proj-score">91</div></div>
    <div class="proj" onclick="closeModal();toast('ML Classifier')"><div class="proj-ico" style="background:var(--s3)"></div><div style="flex:1"><div class="proj-name">ML Classifier</div><div class="proj-desc">Python · 84/100</div></div><div class="proj-score">84</div></div>
    <div class="proj" onclick="closeModal();toast('EcoTrack')"><div class="proj-ico" style="background:var(--s3)"></div><div style="flex:1"><div class="proj-name">EcoTrack</div><div class="proj-desc">React · 78/100</div></div><div class="proj-score">78</div></div>
    <div class="proj" onclick="closeModal();toast('Portfolio')"><div class="proj-ico" style="background:var(--s3)"></div><div style="flex:1"><div class="proj-name">Portfolio Site</div><div class="proj-desc">HTML/CSS · 72/100</div></div><div class="proj-score">72</div></div>
    <button class="outline-btn" style="margin-top:4px;" onclick="closeModal();switchTab('skillproof')">+ Добавить проект</button>
  </div>`},
  'start-task':{title:'useState & useEffect',sub:'Фаза 2 · Задание 2 из 4',body:`<div style="display:flex;flex-direction:column;gap:12px;">
    <div style="font-size:13px;color:var(--muted2);line-height:1.6;">Создай компонент таймера:<br>• Считает секунды (useState)<br>• Запускает интервал (useEffect)<br>• Кнопки Старт / Пауза / Сброс</div>
    <div class="ai-verd"><div class="ai-verd-h">Подсказка</div><div class="ai-verd-t">Очищай интервал в <strong>return</strong> из useEffect — иначе утечки памяти.</div></div>
    <button class="go-btn" onclick="toast('Задание началось!');closeModal()">Начать</button>
    <button class="outline-btn" style="margin:0;" onclick="toast('Видео открыт');closeModal()">Смотреть урок</button>
  </div>`},
  'change-goal':{title:'Выбрать цель',sub:'',body:`<div style="display:flex;flex-direction:column;gap:8px;">
    <div class="proj" onclick="toast('Frontend Engineer');closeModal()"><div class="proj-ico" style="background:var(--s3)"></div><div style="flex:1"><div class="proj-name">Frontend Engineer</div><div class="proj-desc">React, TypeScript · 8 мес</div></div><div style="font-size:18px;">✓</div></div>
    <div class="proj" onclick="toast('Data Scientist');closeModal()"><div class="proj-ico" style="background:var(--s3)"></div><div style="flex:1"><div class="proj-name">Data Scientist</div><div class="proj-desc">Python, ML · 10 мес</div></div></div>
    <div class="proj" onclick="toast('UI/UX Designer');closeModal()"><div class="proj-ico" style="background:var(--s3)"></div><div style="flex:1"><div class="proj-name">UI/UX Designer</div><div class="proj-desc">Figma, Research · 6 мес</div></div></div>
    <div class="proj" onclick="toast('Backend Developer');closeModal()"><div class="proj-ico" style="background:var(--s3)"></div><div style="flex:1"><div class="proj-name">Backend Developer</div><div class="proj-desc">Python/Node, APIs · 9 мес</div></div></div>
  </div>`},
  'path-goals':{title:'Карьерные цели',sub:'',body:`<div style="display:flex;flex-direction:column;gap:10px;">
    <div style="font-size:13px;color:var(--muted2);line-height:1.6;">EduPath строит роадмап под твой уровень и цель. AI обновляет план каждую неделю.</div>
    <button class="go-btn" onclick="openModal('change-goal')">Сменить цель</button>
    <button class="outline-btn" style="margin:0;" onclick="toast('Статистика');closeModal()">Статистика</button>
  </div>`},
  'skill-react':{title:'React',sub:'Верифицирован AI · Продвинутый',body:`<div style="display:flex;flex-direction:column;gap:12px;">
    <div class="sc-grid"><div class="sc-box"><div class="sc-n" style="color:var(--accent)">85</div><div class="sc-l">AI Score</div></div><div class="sc-box"><div class="sc-n" style="color:var(--green)">3</div><div class="sc-l">Проекта</div></div></div>
    <div class="ai-verd"><div class="ai-verd-h">AI оценка</div><div class="ai-verd-t">Сильная архитектура. Изучи <strong>React Query</strong> и <strong>оптимизацию рендеров</strong>.</div></div>
    <button class="go-btn" onclick="switchTab('skillproof');closeModal()">Пересдать тест</button>
  </div>`},
  'skill-python':{title:'Python',sub:'Верифицирован AI · Средний',body:`<div style="display:flex;flex-direction:column;gap:12px;">
    <div class="sc-grid"><div class="sc-box"><div class="sc-n" style="color:var(--accent)">60</div><div class="sc-l">AI Score</div></div><div class="sc-box"><div class="sc-n" style="color:var(--green)">2</div><div class="sc-l">Проекта</div></div></div>
    <div class="ai-verd"><div class="ai-verd-h">AI оценка</div><div class="ai-verd-t">Хорошая база. Изучи <strong>pandas</strong>, <strong>numpy</strong>, <strong>sklearn</strong>.</div></div>
    <button class="go-btn" onclick="switchTab('skillproof');closeModal()">Улучшить</button>
  </div>`},
  'skill-figma':{title:'Figma',sub:'Верифицирован AI · Продвинутый',body:`<div style="display:flex;flex-direction:column;gap:12px;">
    <div class="sc-grid"><div class="sc-box"><div class="sc-n" style="color:var(--accent)">80</div><div class="sc-l">AI Score</div></div><div class="sc-box"><div class="sc-n" style="color:var(--green)">4</div><div class="sc-l">Проекта</div></div></div>
    <button class="go-btn" onclick="switchTab('skillproof');closeModal()">Пересдать</button>
  </div>`},
  'skill-ai':{title:'ML/AI',sub:'Верифицирован AI · Начинающий',body:`<div style="display:flex;flex-direction:column;gap:12px;">
    <div class="sc-grid"><div class="sc-box"><div class="sc-n" style="color:var(--accent)">35</div><div class="sc-l">AI Score</div></div><div class="sc-box"><div class="sc-n" style="color:var(--orange)">1</div><div class="sc-l">Проект</div></div></div>
    <div class="ai-verd"><div class="ai-verd-h">AI оценка</div><div class="ai-verd-t">Рекомендую <strong>EduPath → Data Scientist</strong>.</div></div>
    <button class="go-btn" onclick="switchTab('edupath');closeModal()">EduPath</button>
  </div>`},
  badges:{title:'Все достижения',sub:'',body:`<div style="display:flex;flex-direction:column;gap:8px;">
    <div class="proj"><div class="proj-ico" style="font-size:22px"></div><div style="flex:1"><div class="proj-name">Хакатон 2024</div><div class="proj-desc">2 место в Almaty Hack</div></div></div>
    <div class="proj"><div class="proj-ico" style="font-size:22px"></div><div style="flex:1"><div class="proj-name">Стрик 7 дней</div><div class="proj-desc">7 дней подряд</div></div></div>
    <div class="proj"><div class="proj-ico" style="font-size:22px"></div><div style="flex:1"><div class="proj-name">Первый проект</div><div class="proj-desc">Первый проект в портфолио</div></div></div>
    <div class="proj"><div class="proj-ico" style="font-size:22px"></div><div style="flex:1"><div class="proj-name">3 матча</div><div class="proj-desc">3 матча с компаниями</div></div></div>
    <div class="proj"><div class="proj-ico" style="font-size:22px"></div><div style="flex:1"><div class="proj-name">Top 12%</div><div class="proj-desc">Топ 12% школьников</div></div></div>
    <div class="proj" style="opacity:.4"><div class="proj-ico" style="font-size:22px"></div><div style="flex:1"><div class="proj-name">Top 5%</div><div class="proj-desc">Войди в топ 5%</div></div></div>
  </div>`},
  'badge-hack':{title:'Хакатон 2024',sub:'15 ноября 2024',body:`<div style="text-align:center;padding:10px 0;"><div style="margin-top:10px;font-size:13px;color:var(--muted2);line-height:1.6;">2 место на Almaty Hack 2024.<br>Команда из 4 человек, проект EcoTrack.<br>+15 к репутационному скору.</div></div>`},
  'badge-fire':{title:'Стрик 7 дней',sub:'',body:`<div style="text-align:center;padding:10px 0;"><div style="margin-top:10px;font-size:13px;color:var(--muted2)">7 дней активности подряд. +5 к скору.</div></div>`},
  'badge-star':{title:'Первый проект',sub:'',body:`<div style="text-align:center;padding:10px 0;"><div style="margin-top:10px;font-size:13px;color:var(--muted2)">Добавила первый проект!</div></div>`},
  'badge-match':{title:'3 матча',sub:'',body:`<div style="text-align:center;padding:10px 0;"><div style="margin-top:10px;font-size:13px;color:var(--muted2)">3 матча с компаниями!</div></div>`},
  'badge-top':{title:'Top 12%',sub:'',body:`<div style="text-align:center;padding:10px 0;"><div style="margin-top:10px;font-size:13px;color:var(--muted2)">Топ 12% школьников на платформе!</div></div>`},
  'match-kolesa':{title:'Kolesa Group',sub:'Матч подтверждён',body:`<div style="display:flex;flex-direction:column;gap:12px;">
    <div style="background:var(--s2);border-radius:13px;padding:14px;"><div style="font-size:13px;font-weight:600;margin-bottom:4px;">Junior Frontend Developer</div><div style="font-size:12px;color:var(--muted2);line-height:1.5;">Стажировка · Алматы · 80к/мес<br>Гибкий график, ментор</div></div>
    <button class="go-btn" onclick="toast('Заявка отправлена!');closeModal()">Отправить заявку</button>
    <button class="outline-btn" style="margin:0;" onclick="toast('Чат открыт');closeModal()">Написать рекрутеру</button>
  </div>`},
  'match-epam':{title:'EPAM Systems',sub:'Матч подтверждён',body:`<div style="display:flex;flex-direction:column;gap:12px;">
    <div style="background:var(--s2);border-radius:13px;padding:14px;"><div style="font-size:13px;font-weight:600;margin-bottom:4px;">Young Talent Program</div><div style="font-size:12px;color:var(--muted2);line-height:1.5;">Онлайн · 3 месяца · Сертификат</div></div>
    <button class="go-btn" onclick="toast('Заявка!');closeModal()">Подать заявку</button>
  </div>`},
  'match-most':{title:'MOST Grant',sub:'Матч подтверждён',body:`<div style="display:flex;flex-direction:column;gap:12px;">
    <div style="background:var(--s2);border-radius:13px;padding:14px;"><div style="font-size:13px;font-weight:600;margin-bottom:4px;">Грант $500 для IT-школьников</div><div style="font-size:12px;color:var(--muted2);line-height:1.5;">Нужно: портфолио + письмо<br>Дедлайн: 30 апреля 2025</div></div>
    <button class="go-btn" onclick="toast('Заявка начата!');closeModal()">Подать на грант</button>
  </div>`},
  'proj-verix':{title:'Verix App',sub:'AI Score: 91/100',body:`<div style="display:flex;flex-direction:column;gap:12px;">
    <div class="sc-grid"><div class="sc-box"><div class="sc-n" style="color:var(--accent)">91</div><div class="sc-l">AI Score</div></div><div class="sc-box"><div class="sc-n" style="color:var(--green)">88</div><div class="sc-l">Оригинальность</div></div></div>
    <div style="font-size:12px;color:var(--muted2);">React Native · TypeScript · Expo</div>
    <button class="go-btn" onclick="toast('GitHub!');closeModal()">GitHub</button>
  </div>`},
  'proj-ml':{title:'ML Classifier',sub:'AI Score: 84/100',body:`<div style="display:flex;flex-direction:column;gap:12px;">
    <div class="sc-grid"><div class="sc-box"><div class="sc-n" style="color:var(--accent)">84</div><div class="sc-l">AI Score</div></div><div class="sc-box"><div class="sc-n" style="color:var(--green)">79</div><div class="sc-l">Сложность</div></div></div>
    <div style="font-size:12px;color:var(--muted2);">Python · TensorFlow · 94% точность</div>
    <button class="go-btn" onclick="toast('GitHub!');closeModal()">GitHub</button>
  </div>`},
  'proj-eco':{title:'EcoTrack',sub:'AI Score: 78/100',body:`<div style="display:flex;flex-direction:column;gap:12px;">
    <div class="sc-grid"><div class="sc-box"><div class="sc-n" style="color:var(--accent)">78</div><div class="sc-l">AI Score</div></div><div class="sc-box"><div class="sc-n" style="color:var(--orange)">72</div><div class="sc-l">Сложность</div></div></div>
    <div style="font-size:12px;color:var(--muted2);">React · Chart.js · Almaty Hack 2024, 2 место</div>
    <button class="go-btn" onclick="toast('GitHub!');closeModal()">GitHub</button>
  </div>`},
};

// ════════════ SKILLPROOF ════════════
let selSkillName='';
function selSkill(el,name){
  document.querySelectorAll('.sk-sel').forEach(b=>b.classList.remove('on'));
  el.classList.add('on');selSkillName=name;
}
const AI_ENDPOINT='/api/skillproof';
let lastResult=null;

function localScore(skill,desc){
  // Офлайн-оценка, когда сервер с AI недоступен (например, на GitHub Pages)
  const words=desc.split(/\s+/).filter(Boolean).length;
  const tech=(desc.match(/react|vue|node|python|django|flask|api|sql|docker|git|typescript|redux|hooks?|ml|model|pandas|numpy|figma|auth|deploy|vercel|netlify|test/gi)||[]).length;
  const base=Math.min(92,Math.max(40,40+Math.round(words*0.6)+tech*4));
  const originality=Math.min(95,Math.max(35,base+((words*7)%11)-5));
  const complexity=Math.min(95,Math.max(35,base+tech*2-6));
  const level=base>=85?'Эксперт':base>=72?'Продвинутый':base>=58?'Средний':'Новичок';
  const tips=tech<3?'Опиши, какие технологии и библиотеки ты использовал.':words<40?'Добавь подробностей: какие задачи решал и что было сложнее всего.':'Добавь ссылку на репозиторий и тесты — это повысит доверие к оценке.';
  return {overall_score:base,originality,complexity,level_name:level,verdict:`Предварительная оценка без AI (сервер недоступен). **${tips}**`,source:'local'};
}

async function fetchScore(skill,desc){
  const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),45000);
  try{
    const res=await fetch(AI_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({skill,description:desc}),signal:ctrl.signal});
    const data=await res.json().catch(()=>null);
    if(res.ok&&data&&typeof data.overall_score==='number')return {...data,source:'ai'};
    if(data&&data.error&&res.status!==404&&res.status!==501)throw new Error(data.error);
    return null; // сервера нет — используем локальную оценку
  }catch(e){
    if(e.name==='AbortError'||e instanceof TypeError)return null;
    throw e;
  }finally{clearTimeout(t);}
}

async function runAnalysis(){
  const desc=document.getElementById('projDesc').value.trim();
  if(!selSkillName){toast('Выбери навык');return;}
  if(desc.length<20){toast('Опиши проект подробнее (от 20 символов)');document.getElementById('projDesc').focus();return;}
  const btn=document.getElementById('analyzeBtn');
  btn.disabled=true;btn.textContent='AI думает...';btn.setAttribute('aria-busy','true');
  document.getElementById('aiResult').classList.remove('show');
  try{
    let r=await fetchScore(selSkillName,desc);
    if(!r)r=localScore(selSkillName,desc);
    lastResult={skill:selSkillName,...r};
    document.getElementById('r-overall').textContent=r.overall_score;
    document.getElementById('r-orig').textContent=r.originality;
    document.getElementById('r-comp').textContent=r.complexity;
    document.getElementById('r-lvl').textContent=r.level_name;
    document.getElementById('aiVerdHead').textContent=r.source==='ai'?'Вердикт AI':'Предварительная оценка';
    document.getElementById('aiVerdText').innerHTML=esc(r.verdict).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
    const res2=document.getElementById('aiResult');res2.classList.add('show');
    setTimeout(()=>res2.scrollIntoView({behavior:'smooth',block:'nearest'}),100);
  }catch(e){toast('Не получилось: '+e.message);console.error(e);}
  btn.disabled=false;btn.textContent='Анализировать снова';btn.removeAttribute('aria-busy');
}

function saveSkill(){
  if(!lastResult)return;
  const skills=store.get('skills',[]).filter(x=>x.skill!==lastResult.skill);
  skills.unshift({skill:lastResult.skill,score:lastResult.overall_score,level:lastResult.level_name,source:lastResult.source,date:Date.now()});
  store.set('skills',skills.slice(0,20));
  renderSavedSkills();
  toast('Навык добавлен в профиль!');
  setTimeout(()=>switchTab('profile'),800);
}

function renderSavedSkills(){
  const grid=document.querySelector('#screen-profile .skills-grid');if(!grid)return;
  grid.querySelectorAll('.skc[data-saved]').forEach(el=>el.remove());
  const skills=store.get('skills',[]);
  skills.slice().reverse().forEach(s=>{
    const el=document.createElement('div');
    el.className='skc';el.dataset.saved='1';el.dataset.score=s.score;
    el.setAttribute('onclick',"toast('Оценка: '+this.dataset.score+'/100')");
    el.innerHTML=`<div class="skc-name">${esc(s.skill)}</div><div class="skc-lv">${esc(s.level)}${s.source==='ai'?' · AI':''}</div><div class="skc-bar"><div class="skc-fill" style="width:${Math.max(0,Math.min(100,+s.score||0))}%"></div></div>`;
    grid.prepend(el);
  });
  const n=document.querySelector('#screen-profile .stat:nth-child(2) .stat-n');
  if(n){n.textContent=12+skills.length;delete n.dataset.v;}
  if(window.a11yRefresh)a11yRefresh(grid);
}

// ════════════ TALENT ════════════
const OPPS=[
  {type:'Стажировка',org:'Kolesa Group · Алматы',title:'Junior Frontend Developer',tags:['React','JS','80к/мес'],match:94,desc:'Реальный проект. Ментор, 80к/мес, гибкий график.'},
  {type:'Грант',org:'MOST Business School',title:'Грант для IT-школьников',tags:['$500','Portfolio'],match:87,desc:'$500 на развитие проекта. Нужно портфолио + письмо.'},
  {type:'Хакатон',org:'EPAM Systems · KZ',title:'Young Talent Hackathon',tags:['48ч','300к приз'],match:91,desc:'48ч, команды 3-4 чел., приз 300 000 ₸.'},
  {type:'Программа',org:'Nazarbayev University',title:'Summer AI School 2025',tags:['Лето','Бесплатно'],match:79,desc:'2 недели AI для школьников 9-11 класса. Бесплатно.'},
  {type:'Конкурс',org:'Digital Almaty',title:'Best Youth App Award',tags:['Менторы','Приз'],match:83,desc:'Городской конкурс. Победители получают менторов.'},
];
let oppIdx=0;
function renderOpp(){
  const o=OPPS[oppIdx%OPPS.length];
  document.getElementById('cardType').textContent=o.type;
  document.getElementById('cardOrg').textContent=o.org;
  document.getElementById('cardTitle').textContent=o.title;
  document.getElementById('cardDesc').textContent=o.desc;
  document.getElementById('matchBar').style.width=o.match+'%';
  document.getElementById('matchPct').textContent=o.match+'%';
  document.getElementById('cardTags').innerHTML=o.tags.map(t=>`<span class="opp-tag">${t}</span>`).join('');
  document.getElementById('nopeBadge').style.opacity=0;
  document.getElementById('likedBadge').style.opacity=0;
  document.getElementById('swipeCard').style.transform='';
}
function swipe(dir){
  const card=document.getElementById('swipeCard');
  const o=OPPS[oppIdx%OPPS.length];
  if(dir==='yes'||dir==='super'){
    document.getElementById('likedBadge').style.opacity=1;
    card.style.transform='translateX(45px) rotate(4deg)';
    toast(dir==='super'?`Суперлайк → ${o.org}!`:`Матч с ${o.org}!`);
    const m=store.get('matches',[]);
    if(!m.some(x=>x.title===o.title))m.push({org:o.org,title:o.title,type:o.type,super:dir==='super'});
    store.set('matches',m);renderMatches();
  }else{
    document.getElementById('nopeBadge').style.opacity=1;
    card.style.transform='translateX(-45px) rotate(-4deg)';
    toast('✕ Пропущено');
  }
  setTimeout(()=>{oppIdx++;renderOpp();},420);
}
function openCurrentOpp(){
  const o=OPPS[oppIdx%OPPS.length];
  document.getElementById('modal-content').innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <h2 style="font-family:var(--display);font-size:17px;">${esc(o.title)}</h2>
      <button class="nbtn" onclick="closeModal()" aria-label="Закрыть">×</button>
    </div>
    <div class="proj-desc" style="margin-bottom:12px;">${esc(o.org)} · ${esc(o.type)}</div>
    <label class="lbl" for="applyText" style="display:block">Сопроводительное письмо</label>
    <textarea class="ai-ta" id="applyText" maxlength="1000" placeholder="Почему ты подходишь на эту позицию?"></textarea>
    <button class="go-btn" style="margin-top:12px;" onclick="submitApplication()">Отправить заявку</button>`;
  document.getElementById('modal-overlay').classList.add('show');
}
function submitApplication(){
  const o=OPPS[oppIdx%OPPS.length];const text=document.getElementById('applyText').value.trim();
  if(text.length<20){toast('Напиши хотя бы пару предложений');return;}
  const apps=store.get('applications',[]);apps.push({title:o.title,org:o.org,text,date:Date.now()});store.set('applications',apps);
  closeModal();toast('Заявка сохранена: '+o.org);
  const m=store.get('matches',[]);if(!m.some(x=>x.title===o.title)){m.push({org:o.org,title:o.title,type:o.type});store.set('matches',m);renderMatches();}
}
function renderMatches(){
  const row=document.querySelector('.matches-row');if(!row)return;
  row.querySelectorAll('[data-saved]').forEach(el=>el.remove());
  const shown=new Set([...row.querySelectorAll('.m-chip')].map(c=>c.textContent.trim().toLowerCase()));
  let total=shown.size;
  store.get('matches',[]).forEach(x=>{
    const name=x.org.split('·')[0].trim();
    if(shown.has(name.toLowerCase()))return;
    shown.add(name.toLowerCase());total++;
    const c=document.createElement('div');c.className='m-chip';c.dataset.saved='1';
    c.textContent=name;c.title=x.title;
    c.setAttribute('onclick',"toast(this.title)");
    row.appendChild(c);
  });
  const lbl=row.previousElementSibling;if(lbl)lbl.textContent=`Твои матчи (${total})`;
  const n=document.querySelector('#screen-profile .stat:nth-child(3) .stat-n');if(n){n.textContent=total;delete n.dataset.v;}
  if(window.a11yRefresh)a11yRefresh(row);
}

// ════════════ LOGIN ════════════
// Сервера нет: аккаунт и данные хранятся только в этом браузере (localStorage).
const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
async function hashPass(email,pass){
  const data=new TextEncoder().encode('verix:'+email+':'+pass);
  if(!(window.crypto&&crypto.subtle))return Array.from(data).reduce((h,b)=>((h<<5)-h+b)|0,0).toString(16);
  const buf=await crypto.subtle.digest('SHA-256',data);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function showApp(){
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('app').style.display='flex';
}
function loginError(msg){
  const e=document.getElementById('emailInput'),p=document.getElementById('passwordInput');
  [e,p].forEach(x=>{x.style.borderColor='var(--red)';x.setAttribute('aria-invalid','true');});
  const box=document.getElementById('loginError');if(box)box.textContent=msg;
  setTimeout(()=>[e,p].forEach(x=>{x.style.borderColor='';x.removeAttribute('aria-invalid');}),2500);
}
async function checkLogin(){
  const email=document.getElementById('emailInput').value.trim().toLowerCase();
  const pass=document.getElementById('passwordInput').value;
  if(!EMAIL_RE.test(email))return loginError('Введи корректный email');
  if(pass.length<6)return loginError('Пароль — минимум 6 символов');
  const h=await hashPass(email,pass);
  const acc=store.get('account',null);
  if(acc&&acc.email===email&&acc.hash!==h)return loginError('Неверный пароль для этого email');
  const isNew=!acc||acc.email!==email;
  if(isNew)store.set('account',{email,hash:h,created:Date.now()});
  store.set('session',{email,at:Date.now()});
  document.getElementById('passwordInput').value='';
  const box=document.getElementById('loginError');if(box)box.textContent='';
  showApp();
  toast(isNew?'Аккаунт создан. Добро пожаловать!':'С возвращением!');
}
function demoLogin(){
  store.set('session',{email:'demo',demo:true,at:Date.now()});
  showApp();toast('Демо-режим: данные хранятся в этом браузере');
}
function logout(){
  store.del('session');closeModal();
  document.getElementById('app').style.display='none';
  document.getElementById('loginScreen').style.display='flex';
  toast('Ты вышел из аккаунта');
}
function showRegister(){
  document.getElementById('emailInput').focus();
  toast('Введи email и пароль — аккаунт создастся сам');
}
function handleLoginKey(e){if(e.key==='Enter')checkLogin();}

document.addEventListener('DOMContentLoaded',function(){
  if(store.get('session',null))showApp();
  document.getElementById('emailInput').addEventListener('keydown',handleLoginKey);
  document.getElementById('passwordInput').addEventListener('keydown',handleLoginKey);
});

// ════════════ RANKINGS ════════════
function switchRanking(type) {
  // Hide all ranking contents
  document.querySelectorAll('.ranking-content').forEach(content => {
    content.style.display = 'none';
  });
  
  // Remove active class from all tabs
  document.querySelectorAll('.rank-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected content
  document.getElementById('rankings-' + type).style.display = 'block';
  
  // Add active class to clicked tab
  event.target.classList.add('active');
  
  // Show toast notification
  const messages = {
    users: 'Рейтинг учеников',
    schools: 'Рейтинг школ', 
    skills: 'Топ по навыкам',
    competitions: 'Соревнования'
  };
  toast(messages[type] || 'Рейтинги');
}

// Mock data for rankings (in real app, this would come from API)
const rankingsData = {
  users: [
    { 
      rank: 1, 
      name: 'Марат Алиев', 
      school: 'Школа №45, Алматы', 
      avatar: 'МА', 
      score: 92.5, 
      change: 2, 
      skills: ['React', 'Node.js', 'Python'],
      bio: 'Frontend разработчик, увлекаюсь React и созданием современных веб-приложений. Люблю решать сложные задачи и учиться новому.',
      projects: [
        { name: 'Verix App', desc: 'React Native · Digital Reputation Platform', score: 91, icon: '' },
        { name: 'EcoTracker', desc: 'React · Трекер углеродного следа', score: 85, icon: '' },
        { name: 'Task Manager', desc: 'React + TypeScript · Управление задачами', score: 88, icon: '' }
      ],
      stats: { projects: 12, skills: 8, matches: 5 },
      level: 8,
      isOnline: true
    },
    { 
      rank: 2, 
      name: 'Алия Нурсултанова', 
      school: 'НИШ Физмат, Астана', 
      avatar: 'АН', 
      score: 89.2, 
      change: -1, 
      skills: ['ML', 'Python', 'Data'],
      bio: 'Data Scientist в будущем. Изучаю машинное обучение и анализ данных. Участница хакатонов и грантов.',
      projects: [
        { name: 'ML Classifier', desc: 'Python · Классификатор изображений', score: 94, icon: '' },
        { name: 'Data Visualizer', desc: 'Python · Визуализация данных', score: 87, icon: '' },
        { name: 'ChatBot AI', desc: 'Python · NLP чат-бот', score: 89, icon: '' }
      ],
      stats: { projects: 9, skills: 6, matches: 3 },
      level: 7,
      isOnline: true
    },
    { 
      rank: 3, 
      name: 'Данияр Омаров', 
      school: 'Гимназия №7, Алматы', 
      avatar: 'ДО', 
      score: 87.8, 
      change: 0, 
      skills: ['React', 'TypeScript'],
      bio: 'Full-stack разработчик. Специализируюсь на React и Node.js. Создаю масштабируемые приложения.',
      projects: [
        { name: 'Social Network', desc: 'React + Node.js · Социальная сеть', score: 86, icon: '' },
        { name: 'E-commerce Platform', desc: 'React + TypeScript · Интернет-магазин', score: 90, icon: '' },
        { name: 'API Gateway', desc: 'Node.js · Микросервисы', score: 84, icon: '' }
      ],
      stats: { projects: 11, skills: 7, matches: 4 },
      level: 7,
      isOnline: false
    },
    { 
      rank: 4, 
      name: 'Айсулу Бекмуратова', 
      school: 'НИШ ХМ, Астана', 
      avatar: 'АБ', 
      score: 85.3, 
      change: 3, 
      skills: ['Design', 'Figma'],
      bio: 'UI/UX дизайнер. Создаю красивые и функциональные интерфейсы. Любую работу с пользователями.',
      projects: [
        { name: 'Banking App UI', desc: 'Figma · Мобильный банкинг', score: 92, icon: '' },
        { name: 'E-commerce Design', desc: 'Figma · Дизайн магазина', score: 88, icon: '' },
        { name: 'Social Media UI', desc: 'Figma · Соцсеть дизайн', score: 85, icon: '' }
      ],
      stats: { projects: 15, skills: 5, matches: 6 },
      level: 6,
      isOnline: true
    },
    { 
      rank: 5, 
      name: 'Ерлан Смагулов', 
      school: 'Школа №12, Шымкент', 
      avatar: 'ЕС', 
      score: 83.7, 
      change: -2, 
      skills: ['Python', 'Django'],
      bio: 'Backend разработчик. Работаю с Python и Django. Создаю надежные и быстрые API.',
      projects: [
        { name: 'Blog Platform', desc: 'Django · Блоговая платформа', score: 87, icon: '' },
        { name: 'REST API', desc: 'Django REST · API сервис', score: 82, icon: '' },
        { name: 'Task Scheduler', desc: 'Python · Планировщик задач', score: 79, icon: '' }
      ],
      stats: { projects: 8, skills: 4, matches: 2 },
      level: 5,
      isOnline: false
    }
  ],
  schools: [
    { rank: 1, name: 'НИШ Физмат-IT', city: 'Астана', avgReputation: 78.5, totalStudents: 234, achievements: 15, topStudents: [
      { name: 'Алия Нурсултанова', avatar: 'АН', score: 89.2 },
      { name: 'Тимур Жумабек', avatar: 'ТЖ', score: 82.4 },
      { name: 'Мадина Сулейменова', avatar: 'МС', score: 79.8 }
    ]},
    { rank: 2, name: 'Школа №45', city: 'Алматы', avgReputation: 72.3, totalStudents: 198, achievements: 12, topStudents: [
      { name: 'Марат Алиев', avatar: 'МА', score: 92.5 },
      { name: 'Данияр Омаров', avatar: 'ДО', score: 87.8 },
      { name: 'Карина Абдуллаева', avatar: 'КА', score: 76.2 }
    ]}
  ],
  skills: {
    react: [
      { rank: 1, name: 'Марат Алиев', school: 'Школа №45, Алматы', avatar: 'МА', score: 95.2, change: 1 },
      { rank: 2, name: 'Данияр Омаров', school: 'Гимназия №7, Алматы', avatar: 'ДО', score: 91.8, change: -1 },
      { rank: 3, name: 'Айнур Касымов', school: 'Гимназия №7', avatar: 'АК', score: 88.4, change: 0 }
    ],
    python: [
      { rank: 1, name: 'Алия Нурсултанова', school: 'НИШ', avatar: 'АН', score: 94.6, change: 0 },
      { rank: 2, name: 'Ерлан Смагулов', school: 'Школа №12', avatar: 'ЕС', score: 90.3, change: 2 },
      { rank: 3, name: 'Марат Алиев', school: 'Школа №45', avatar: 'МА', score: 87.9, change: -1 }
    ],
    ml: [
      { rank: 1, name: 'Алия Нурсултанова', school: 'НИШ', avatar: 'АН', score: 96.1, change: 2 },
      { rank: 2, name: 'Тимур Жумабек', school: 'НИШ', avatar: 'ТЖ', score: 89.7, change: -1 },
      { rank: 3, name: 'Мадина Сулейменова', school: 'НИШ', avatar: 'МС', score: 85.2, change: 0 }
    ]
  },
  competitions: [
    { name: 'React Challenge 2024', prize: 'MacBook Air + стажировка', participants: 156, daysLeft: 12, description: 'Создай лучшее React приложение и выиграй ценные призы' },
    { name: 'AI Innovation Hackathon', prize: 'Грант на развитие проекта', participants: 89, daysLeft: 8, description: 'Разработи AI решение для образования и получи поддержку' },
    { name: 'School Battle: IT Edition', prize: 'Кубок чемпиона + мерч', participants: 234, daysLeft: 5, description: 'Соревнование между школами Алматы за звание лучшей IT-площадки' }
  ]
};

// ════════════ USER PROFILES & MESSENGER ════════════
let currentChatUser = null;
let chatMessages = {};

// Initialize chat storage
function initializeChats() {
  const saved=store.get('chats',null);
  rankingsData.users.forEach(user => {
    chatMessages[user.name] = (saved&&Array.isArray(saved[user.name]))?saved[user.name]:[
      { text: 'Привет! Рад пообщаться с тобой', time: '10:30', sent: false }
    ];
  });
}
function saveChats(){store.set('chats',chatMessages);}

// Open user profile modal
function openUserProfile(userId) {
  const user = rankingsData.users.find(u => u.rank === userId);
  if (!user) return;
  
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  
  const skillsHtml = user.skills.map(skill => 
    `<span class="user-profile-skill-tag">${skill}</span>`
  ).join('');
  
  const projectsHtml = user.projects.map(project => `
    <div class="user-profile-project">
      <div class="user-profile-project-ico" style="background:var(--s3)">${project.icon}</div>
      <div class="user-profile-project-info">
        <div class="user-profile-project-name">${project.name}</div>
        <div class="user-profile-project-desc">${project.desc}</div>
      </div>
      <div class="user-profile-project-score">${project.score}</div>
    </div>
  `).join('');
  
  content.innerHTML = `
    <div class="user-profile-modal">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <div style="font-size:18px;font-weight:600;">Профиль ученика</div>
        <span onclick="closeModal()" style="cursor:pointer;font-size:24px;color:var(--muted);padding:4px;">×</span>
      </div>
      
      <div class="user-profile-header">
        <div class="user-profile-avatar">${user.avatar}</div>
        <div class="user-profile-info">
          <div class="user-profile-name">${user.name}</div>
          <div class="user-profile-school">${user.school}</div>
          <div class="user-profile-bio">${user.bio}</div>
        </div>
      </div>
      
      <div class="user-profile-stats">
        <div class="user-profile-stat">
          <div class="user-profile-stat-val">${user.stats.projects}</div>
          <div class="user-profile-stat-lbl">Проектов</div>
        </div>
        <div class="user-profile-stat">
          <div class="user-profile-stat-val">${user.stats.skills}</div>
          <div class="user-profile-stat-lbl">Навыков</div>
        </div>
        <div class="user-profile-stat">
          <div class="user-profile-stat-val">${user.stats.matches}</div>
          <div class="user-profile-stat-lbl">Матчей</div>
        </div>
      </div>
      
      <div class="user-profile-skills">
        <div class="user-profile-skills-title">Навыки</div>
        <div class="user-profile-skill-tags">${skillsHtml}</div>
      </div>
      
      <div class="user-profile-projects">
        <div class="user-profile-projects-title">Топ проекты</div>
        ${projectsHtml}
      </div>
      
      <div class="user-profile-actions">
        <button class="contact-btn" onclick="openMessenger('${user.name}')">
          Написать сообщение
        </button>
        <button class="contact-btn secondary" onclick="viewFullProfile('${user.name}')">
          Полный профиль
        </button>
      </div>
    </div>
  `;
  
  modal.classList.add('show');
}

// Open messenger
function openMessenger(userName) {
  const user = rankingsData.users.find(u => u.name === userName);
  if (!user) return;
  
  currentChatUser = userName;
  const modal = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  
  const messages = chatMessages[userName] || [];
  const messagesHtml = messages.map(msg => `
    <div class="messenger-message ${msg.sent ? 'message-sent' : 'message-received'}">
      <div class="message-avatar">${msg.sent ? 'Я' : user.avatar}</div>
      <div class="message-content">
        <div class="message-text">${esc(msg.text)}</div>
        <div class="message-time">${msg.time}</div>
      </div>
    </div>
  `).join('');
  
  content.innerHTML = `
    <div class="messenger-modal">
      <div class="messenger-header">
        <div class="messenger-avatar">${user.avatar}</div>
        <div class="messenger-info">
          <div class="messenger-name">${user.name}</div>
          <div class="messenger-status">${user.isOnline ? 'В сети' : 'Не в сети'}</div>
        </div>
        <div class="messenger-close" onclick="closeModal()">×</div>
      </div>
      
      <div class="messenger-messages" id="chatMessages">
        ${messagesHtml}
      </div>
      
      <div class="messenger-input">
        <input type="text" id="messageInput" maxlength="500" aria-label="Сообщение" placeholder="Напиши сообщение..." onkeydown="handleMessageKeypress(event)">
        <button onclick="sendMessage()">Отправить</button>
      </div>
    </div>
  `;
  
  modal.classList.add('show');
  
  // Focus input and scroll to bottom
  setTimeout(() => {
    document.getElementById('messageInput').focus();
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 100);
}

// Send message
function sendMessage() {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  
  if (!text || !currentChatUser) return;
  
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Add message to chat
  if (!chatMessages[currentChatUser]) {
    chatMessages[currentChatUser] = [];
  }
  
  chatMessages[currentChatUser].push({
    text: text,
    time: time,
    sent: true
  });
  
  saveChats();
  // Clear input
  input.value = '';
  
  // Re-render messages
  openMessenger(currentChatUser);
  
  // Simulate response after 2 seconds
  setTimeout(() => {
    if (chatMessages[currentChatUser]) {
      const responses = [
        'Спасибо за сообщение!',
        'Интересно! Расскажи подробнее.',
        'Круто! Давай обсудим это.',
        'Согласен! Отличная идея.',
        'Я тоже думаю об этом.'
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const responseTime = new Date();
      const responseTimeStr = `${responseTime.getHours().toString().padStart(2, '0')}:${responseTime.getMinutes().toString().padStart(2, '0')}`;
      
      chatMessages[currentChatUser].push({
        text: randomResponse,
        time: responseTimeStr,
        sent: false
      });
      saveChats();
      
      // Update if still in chat
      if (currentChatUser === rankingsData.users.find(u => u.name === currentChatUser)?.name) {
        openMessenger(currentChatUser);
        toast('Новое сообщение!');
      }
    }
  }, 2000);
  
  toast('Сообщение отправлено!');
}

// Handle enter key in message input
function handleMessageKeypress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

// View full profile (placeholder)
function viewFullProfile(userName) {
  toast(`Открыт полный профиль: ${userName}`);
  closeModal();
  // In real app, this would navigate to full profile page
}

// Render functions (used for dynamic updates)
function renderUserRankings() {
  // This would be called when data updates
  // For now, the HTML is static, but in real app this would be dynamic
  console.log('User rankings updated');
}

// ════════════ SHARE ════════════
function profileUrl(){return location.origin+location.pathname;}
async function shareProfile(){
  const p=loadP();const data={title:'Verix — '+p.name,text:p.name+' на Verix — платформе цифровой репутации школьников',url:profileUrl()};
  try{
    if(navigator.share){await navigator.share(data);closeModal();return;}
    await navigator.clipboard.writeText(data.url);toast('Ссылка скопирована!');closeModal();
  }catch(e){if(e.name!=='AbortError')toast('Не удалось поделиться');}
}
function emailProfile(){
  const p=loadP();
  location.href='mailto:?subject='+encodeURIComponent('Мой профиль на Verix')+'&body='+encodeURIComponent(p.name+' — '+profileUrl());
  closeModal();
}

// ════════════ INIT ════════════
renderProfile();
renderSavedSkills();
renderMatches();
renderOpp();
initializeChats();
