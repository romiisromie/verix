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
  name:'Ученик', grade:'11 класс', city:'Алматы, Казахстан',
  emoji:'', level:1, about:'',
  tag1:'Frontend', tag2:'', tag3:''
};
const TAG_ICONS = {Frontend:'','AI/ML':'',Design:'',Backend:'',Data:'',Mobile:'','Game Dev':'',Cybersecurity:''};
const GRADES = ['8 класс','9 класс','10 класс','11 класс','1 курс','2 курс','3 курс','4 курс'];
const SKILL_TAGS = ['Frontend','AI/ML','Design','Backend','Data','Mobile','Game Dev','Cybersecurity'];

function loadP(){const v=store.get('p',null);return v&&typeof v==='object'?{...DEFAULTS,...v}:{...DEFAULTS};}
function saveP(d){store.set('p',d);}

function renderProfile(){
  const p=loadP();
  document.getElementById('avatarEmoji').textContent=p.name.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');
  document.getElementById('levelBadge').textContent='LVL '+(window.vxLevel?vxLevel():1);
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
      <div>
        <label class="lbl" for="e_grade" style="display:block">Класс / Курс</label>
        <select class="inp" id="e_grade">${grOpts}</select>
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
      <button class="outline-btn" style="margin-top:0;" onclick="vxOnboarding()">Пройти опрос заново</button>
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
  p.tag1=document.getElementById('e_t1').value;
  p.tag2=document.getElementById('e_t2').value;
  p.tag3=document.getElementById('e_t3').value;
  saveP(p);renderProfile();closeModal();toast('Профиль сохранён!');
  if(window.loadOpps&&oppsLoaded){buildDeck();renderOpp();}
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
  if(key==='notif'){openNotifications();return;}
  if(key==='share'){openShare();return;}
  if(key==='change-goal'&&window.openGoalPicker){openGoalPicker();return;}
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
  'skillproof-info':{title:'Как работает SkillProof AI',sub:'',body:`<div style="display:flex;flex-direction:column;gap:12px;">
    <div class="proj"><div class="proj-ico" style="background:var(--s3)">1</div><div style="flex:1"><div class="proj-name">Даёшь ссылку на GitHub</div><div class="proj-desc">Публичный репозиторий с твоим проектом</div></div></div>
    <div class="proj"><div class="proj-ico" style="background:var(--s3)">2</div><div style="flex:1"><div class="proj-name">AI читает код</div><div class="proj-desc">Файлы, коммиты, авторы, тесты, README</div></div></div>
    <div class="proj"><div class="proj-ico" style="background:var(--s3)">3</div><div style="flex:1"><div class="proj-name">Балл — только по коду</div><div class="proj-desc">Описание на оценку не влияет; без кода — не выше 60</div></div></div>
    <div class="proj"><div class="proj-ico" style="background:var(--s3)">4</div><div style="flex:1"><div class="proj-name">Навык в профиле</div><div class="proj-desc">С отметкой «код ✓» и XP за доказательство</div></div></div>
  </div>`},
  'talent-info':{title:'Как работает TalentMatch',sub:'',body:`<div style="display:flex;flex-direction:column;gap:10px;">
    <div style="font-size:13px;color:var(--muted2);line-height:1.6;">Подбирает стажировки, гранты и конкурсы под твой профиль.</div>
    <div class="ai-verd"><div class="ai-verd-h">Как свайпать:</div><div class="ai-verd-t"><strong>✕</strong> — не интересно &nbsp; <strong>★</strong> — суперлайк &nbsp; <strong>✓</strong> — хочу матч</div></div>
  </div>`},
  'path-goals':{title:'Карьерные цели',sub:'',body:`<div style="display:flex;flex-direction:column;gap:10px;">
    <div style="font-size:13px;color:var(--muted2);line-height:1.6;">EduPath строит роадмап под твою цель, класс и время. У каждой задачи — объяснение, как её сделать, и ссылка на бесплатный курс.</div>
    <button class="go-btn" onclick="openGoalPicker()">Сменить цель</button>
  </div>`},
  'rankings-info':{title:'Как устроены рейтинги',sub:'',body:`<div style="font-size:13px;color:var(--muted2);line-height:1.6;">В рейтинге будут только настоящие ученики и только навыки, подтверждённые по коду в SkillProof. Пока аккаунты хранятся в браузере, видно только твоё место по собственному скору.</div>`},
};


// ════════════ SKILLPROOF ════════════
let selSkillName='';
function selSkill(el,name){
  document.querySelectorAll('.sk-sel').forEach(b=>b.classList.remove('on'));
  el.classList.add('on');selSkillName=name;
}
const AI_ENDPOINT='/api/skillproof';
let lastResult=null;

// Без AI оценка не выставляется: подсчёт «по количеству слов» был бы нечестным.

const REPO_RE=/^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}\/?([#?].*)?$/;

async function postJSON(url,body,timeout){
  const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),timeout||45000);
  try{
    const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:ctrl.signal});
    const data=await res.json().catch(()=>null);
    if(res.ok&&data)return data;
    if(data&&data.error&&res.status!==404&&res.status!==501&&res.status!==405)throw new Error(data.error);
    return null; // сервера нет — используем локальный вариант
  }catch(e){
    if(e.name==='AbortError'||e instanceof TypeError)return null;
    throw e;
  }finally{clearTimeout(t);}
}
async function fetchScore(skill,desc,repo){
  const data=await postJSON(AI_ENDPOINT,{skill,description:desc,repo,lang:window.vxLang?vxLang():'ru'},60000);
  return data&&typeof data.overall_score==='number'?{...data,source:data.repo?'github':'ai'}:null;
}

const vxLocale=()=>({kk:'kk-KZ',en:'en-GB'}[window.vxLang?vxLang():'ru']||'ru-RU');
function fmtDate(iso){try{return new Date(iso).toLocaleDateString(vxLocale(),{day:'numeric',month:'short',year:'numeric'});}catch(e){return '';}}
function renderRepoProof(r){
  const box=document.getElementById('repoProof');
  if(!r.repo){box.hidden=true;box.innerHTML='';return;}
  const m=r.repo;
  box.hidden=false;
  box.innerHTML=`<div class="lbl">Проверено по коду</div>
    <a class="repo-link" href="${esc(m.url)}" target="_blank" rel="noopener noreferrer">${esc(m.full_name)}</a>${m.fork?' <span class="tag">форк</span>':''}
    <div class="repo-facts">
      <span><b>${esc(m.commits)}</b> коммитов</span><span><b>${esc(m.files)}</b> файлов</span><span><b>${esc(m.authors)}</b> авт.</span>${m.stars?`<span><b>${esc(m.stars)}</b> ★</span>`:''}
    </div>
    ${m.languages&&m.languages.length?`<div class="repo-langs">${m.languages.map(l=>`<span class="tag">${esc(l)}</span>`).join('')}</div>`:''}
    ${m.first_commit?`<div class="hint">Работа над проектом: ${esc(fmtDate(m.first_commit))} — ${esc(fmtDate(m.last_commit))}</div>`:''}
    ${r.code_findings?`<div class="repo-find">${esc(r.code_findings)}</div>`:''}`;
}

async function runAnalysis(){
  const desc=document.getElementById('projDesc').value.trim();
  const repo=document.getElementById('projRepo').value.trim();
  if(!selSkillName){toast('Выбери навык');return;}
  if(repo&&!REPO_RE.test(repo)){toast('Ссылка должна быть вида https://github.com/user/repo');document.getElementById('projRepo').focus();return;}
  if(!repo&&desc.length<20){toast('Опиши проект подробнее (от 20 символов) или дай ссылку на GitHub');document.getElementById('projDesc').focus();return;}
  const btn=document.getElementById('analyzeBtn');
  btn.disabled=true;btn.textContent=repo?'AI читает код...':'AI думает...';btn.setAttribute('aria-busy','true');
  document.getElementById('aiResult').classList.remove('show');
  try{
    let r=await fetchScore(selSkillName,desc,repo);
    if(!r){toast('AI сейчас недоступен — оценку без него не ставим. Попробуй чуть позже.');btn.disabled=false;btn.textContent='Анализировать с AI';btn.removeAttribute('aria-busy');return;}
    lastResult={skill:selSkillName,...r};
    document.getElementById('r-overall').textContent=r.overall_score;
    document.getElementById('r-orig').textContent=r.originality;
    document.getElementById('r-comp').textContent=r.complexity;
    document.getElementById('r-lvl').textContent=r.level_name;
    document.getElementById('aiVerdHead').textContent=r.source==='github'?'Вердикт AI по коду':r.source==='ai'?'Вердикт AI по описанию (без кода — до 60)':'Предварительная оценка';
    document.getElementById('aiVerdText').innerHTML=esc(r.verdict).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
    renderRepoProof(r);
    const res2=document.getElementById('aiResult');res2.classList.add('show');
    if(window.vxGain&&r.source==='github'&&r.repo&&r.repo.url)vxGain('github',r.repo.url); // XP только за проверку по коду, один раз на репозиторий
    setTimeout(()=>res2.scrollIntoView({behavior:'smooth',block:'nearest'}),100);
  }catch(e){toast('Не получилось: '+e.message);console.error(e);}
  btn.disabled=false;btn.textContent='Анализировать снова';btn.removeAttribute('aria-busy');
}

function saveSkill(){
  if(!lastResult)return;
  const skills=store.get('skills',[]).filter(x=>x.skill!==lastResult.skill);
  skills.unshift({skill:lastResult.skill,score:lastResult.overall_score,level:lastResult.level_name,source:lastResult.source,repo:lastResult.repo?lastResult.repo.url:null,date:Date.now()});
  store.set('skills',skills.slice(0,20));
  renderSavedSkills();
  if(window.vxGain&&lastResult.source==='github'&&lastResult.repo)vxGain('save',lastResult.skill+'|'+lastResult.repo.url);
  toast('Навык добавлен в профиль!');
  setTimeout(()=>switchTab('profile'),800);
}

function openSavedSkill(i){
  const s=store.get('skills',[])[i];if(!s)return;
  const src=s.source==='github'?'Проверено AI по коду':s.source==='ai'?'Оценено AI по описанию':'Предварительная оценка';
  document.getElementById('modal-content').innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <h2 style="font-family:var(--display);font-size:17px;">${esc(s.skill)} · ${esc(s.score)}/100</h2>
      <button class="nbtn" onclick="closeModal()" aria-label="Закрыть">×</button>
    </div>
    <div class="proj-desc" style="margin-bottom:10px;">${esc(s.level)} · ${esc(src)} · ${esc(fmtDate(s.date))}</div>
    ${s.repo?`<a class="repo-link" href="${esc(s.repo)}" target="_blank" rel="noopener noreferrer">${esc(s.repo.replace(/^https?:\/\/(www\.)?github\.com\//,''))}</a>`:''}
    <button class="outline-btn" onclick="switchTab('skillproof');closeModal()">Проверить заново</button>`;
  document.getElementById('modal-overlay').classList.add('show');
}

function renderSavedSkills(){
  const grid=document.querySelector('#screen-profile .skills-grid');if(!grid)return;
  grid.querySelectorAll('.skc[data-saved]').forEach(el=>el.remove());
  const skills=store.get('skills',[]);
  skills.slice().reverse().forEach((s,ri)=>{
    const i=skills.length-1-ri;
    const el=document.createElement('div');
    el.className='skc';el.dataset.saved='1';
    el.setAttribute('onclick',`openSavedSkill(${i})`);
    const mark=s.source==='github'?' · код ✓':s.source==='ai'?' · AI':'';
    el.innerHTML=`<div class="skc-name">${esc(s.skill)}</div><div class="skc-lv">${esc(s.level)}${mark}</div><div class="skc-bar"><div class="skc-fill" style="width:${Math.max(0,Math.min(100,+s.score||0))}%"></div></div>`;
    grid.prepend(el);
  });
  const empty=document.getElementById('skillsEmpty');if(empty)empty.hidden=skills.length>0;
  if(window.a11yRefresh)a11yRefresh(grid);
  renderDashboard();
}

// ════════════ DASHBOARD: только настоящие данные ════════════
// Скор = 0,40·навыки + 0,35·проекты + 0,25·активность, где
//   навыки — средний балл SkillProof по навыкам в профиле;
//   проекты — 25 баллов за каждый репозиторий, подтверждённый по коду (максимум 100);
//   активность — XP за доказанные действия относительно 640 XP (LVL 5).
function provenRepos(){return [...new Set(store.get('skills',[]).filter(x=>x.source==='github'&&x.repo).map(x=>x.repo))];}
function repScore(){
  const skills=store.get('skills',[]);
  if(!skills.length)return null;
  const skill=Math.round(skills.reduce((a,x)=>a+(+x.score||0),0)/skills.length);
  const proj=Math.min(100,provenRepos().length*25);
  const act=Math.min(100,Math.round((window.vxXP?vxXP():0)/640*100));
  return {total:Math.round(.4*skill+.35*proj+.25*act),skill,proj,act};
}
function renderDashboard(){
  const r=repScore(),set=(id,v)=>{const el=document.getElementById(id);if(el){el.textContent=v;delete el.dataset.v;}};
  const bar=(id,v)=>{const el=document.getElementById(id);if(el){el.style.width=v+'%';el.dataset.w=v+'%';}};
  set('repNum',r?r.total:'—');set('repProj',r?r.proj:0);set('repSkill',r?r.skill:0);set('repAct',r?r.act:0);
  bar('repProjBar',r?r.proj:0);bar('repSkillBar',r?r.skill:0);bar('repActBar',r?r.act:0);
  const ring=document.getElementById('repRing');if(ring)ring.style.strokeDashoffset=String(245-245*(r?r.total:0)/100);
  const repos=provenRepos(),skills=store.get('skills',[]);
  set('statProj',repos.length);set('statSkills',skills.length);set('statMatches',store.get('matches',[]).length);
  const list=document.getElementById('projList');
  if(list){
    list.innerHTML=repos.map(url=>{
      const best=skills.filter(x=>x.repo===url).sort((a,b)=>b.score-a.score)[0];
      const name=url.replace(/^https?:\/\/(www\.)?github\.com\//,'');
      return `<a class="proj" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><div style="flex:1;min-width:0"><div class="proj-name">${esc(name)}</div><div class="proj-desc">${esc(best.skill)} · ${esc(best.level)} · код ✓</div></div><div class="proj-score">${esc(best.score)}</div></a>`;
    }).join('');
    const e=document.getElementById('projEmpty');if(e)e.hidden=repos.length>0;
  }
  const mine=document.getElementById('myRankCard');
  if(mine){
    const p=loadP();
    mine.innerHTML=r?`<div class="proj"><div style="flex:1;min-width:0"><div class="proj-name">${esc(p.name)}</div><div class="proj-desc">${esc(p.grade)} · ${esc(p.city)} · проектов по коду: ${repos.length}</div></div><div class="proj-score">${r.total}</div></div>`
      :`<div class="hint">У тебя пока нет проверенных навыков — проверь первый проект в SkillProof, и здесь появится твой скор.</div>`;
  }
}

// ════════════ TALENT ════════════
// Возможности лежат в data/opportunities.json. Совпадение считается по профилю и навыкам.
let OPPS=[];let oppIdx=0;let deck=[];let oppsLoaded=false;
const OPP_TYPES=[['all','Все'],['Стажировка','Стажировки'],['Грант','Гранты'],['Хакатон','Хакатоны'],['Программа','Программы'],['Конкурс','Конкурсы']];
const SKILL_MAP={React:'Frontend',Web:'Frontend',Python:'Backend','ML/AI':'AI/ML',Design:'Design',Data:'Data'};
function gradeNum(g){const n=parseInt(g,10)||10;return /курс/.test(g)?11+n:n;}
function oppFilter(){return {type:'all',city:'all',mine:true,skill:'all',...store.get('opp_filter',{})};}
const OPP_SKILLS=['Frontend','Backend','AI/ML','Data','Design','Cybersecurity','Game Dev'];

function matchScore(o){
  const p=loadP();
  const mine=new Set([p.tag1,p.tag2,p.tag3].filter(Boolean));
  const skills=store.get('skills',[]);
  skills.forEach(s=>{mine.add(s.skill);if(SKILL_MAP[s.skill])mine.add(SKILL_MAP[s.skill]);});
  const overlap=(o.skills||[]).filter(s=>mine.has(s)).length;
  const g=gradeNum(p.grade),[lo,hi]=o.grades||[8,12];
  let score=48+Math.min(3,overlap)*14+(g>=lo&&g<=hi?6:-22);
  const proven=skills.filter(s=>(o.skills||[]).some(k=>k===s.skill||k===SKILL_MAP[s.skill]));
  if(proven.length)score+=Math.round(proven.reduce((a,s)=>a+(+s.score||0),0)/proven.length/12);
  return Math.max(20,Math.min(99,score));
}
function daysLeft(d){if(!d)return null;return Math.ceil((new Date(d+'T23:59:59')-Date.now())/864e5);}
function fmtDeadline(d){
  const n=daysLeft(d);if(n===null)return 'без дедлайна';
  if(n<=0)return 'сегодня последний день';
  if(n<=14)return `осталось ${n} дн.`;
  return 'до '+new Date(d).toLocaleDateString(vxLocale(),{day:'numeric',month:'short'});
}

function buildDeck(){
  const f=oppFilter(),seen=new Set(store.get('swiped',[])),g=gradeNum(loadP().grade);
  deck=OPPS.filter(o=>{
    if(seen.has(o.id))return false;
    const dl=daysLeft(o.deadline);if(dl!==null&&dl<0)return false;
    if(f.type!=='all'&&o.type!==f.type)return false;
    if(f.city!=='all'&&o.city!==f.city&&o.city!=='Онлайн')return false;
    if(f.mine){const [lo,hi]=o.grades||[8,12];if(g<lo||g>hi)return false;}
    if(f.skill&&f.skill!=='all'&&!(o.skills||[]).includes(f.skill))return false;
    return true;
  }).map(o=>({...o,match:matchScore(o)})).sort((a,b)=>b.match-a.match);
  oppIdx=0;
}
function renderOppFilters(){
  const box=document.getElementById('oppFilters');if(!box)return;
  const f=oppFilter();
  const cities=['all',...new Set(OPPS.map(o=>o.city).filter(c=>c!=='Онлайн'))];
  box.innerHTML=`<div class="chip-row" role="group" aria-label="Тип">${OPP_TYPES.map(([v,l])=>`<button type="button" class="f-chip${f.type===v?' on':''}" aria-pressed="${f.type===v}" onclick="setOppFilter('type','${v}')">${l}</button>`).join('')}</div>
    <div class="f-row">
      <label class="sr-only" for="oppCity">Город</label>
      <select class="inp f-sel" id="oppCity" onchange="setOppFilter('city',this.value)">${cities.map(c=>`<option value="${esc(c)}"${f.city===c?' selected':''}>${c==='all'?'Любой город':esc(c)+' + онлайн'}</option>`).join('')}</select>
      <label class="f-check"><input type="checkbox" ${f.mine?'checked':''} onchange="setOppFilter('mine',this.checked)"> Мой класс</label>
    </div>
    <div class="chip-row" role="group" aria-label="Навык">${[['all','Любой навык'],...OPP_SKILLS.map(x=>[x,x])].map(([v,l])=>`<button type="button" class="f-chip f-skill${f.skill===v?' on':''}" aria-pressed="${f.skill===v}" onclick="setOppFilter('skill','${v}')">${l}</button>`).join('')}</div>`;
}
function setOppFilter(k,v){const f=oppFilter();f[k]=v;store.set('opp_filter',f);renderOppFilters();buildDeck();renderOpp();}

function renderOpp(){
  const card=document.getElementById('swipeCard'),empty=document.getElementById('oppEmpty'),acts=document.querySelector('.sw-actions');
  const o=deck[oppIdx];
  const cnt=document.getElementById('oppCount');
  if(cnt)cnt.textContent=oppsLoaded?(deck.length-oppIdx>0?`${deck.length-oppIdx} в колоде`:''):'';
  if(!o){
    card.hidden=true;acts.hidden=true;empty.hidden=false;
    empty.querySelector('.empty-t').textContent=oppsLoaded?(OPPS.length?'Ты посмотрел всё по этим фильтрам':'Пока нет возможностей'):'Загружаем возможности...';
    return;
  }
  card.hidden=false;acts.hidden=false;empty.hidden=true;
  document.getElementById('cardType').textContent=o.type;
  document.getElementById('cardOrg').textContent=o.org;
  document.getElementById('cardTitle').textContent=o.title;
  document.getElementById('cardDesc').textContent=o.desc+(o.deadline_note?' · '+o.deadline_note:'');
  document.getElementById('matchBar').style.width=o.match+'%';
  document.getElementById('matchPct').textContent=o.match+'%';
  const dl=daysLeft(o.deadline);
  document.getElementById('cardTags').innerHTML=[o.city,...(o.tags||[])].map(t=>`<span class="opp-tag">${esc(t)}</span>`).join('')+
    `<span class="opp-tag${dl!==null&&dl<=14?' urgent':''}">${esc(o.deadline?fmtDeadline(o.deadline):'сроки — на сайте')}</span>`+
    (o.url?`<a class="opp-tag opp-link" href="${esc(o.url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">Сайт ↗</a>`:'');
  document.getElementById('nopeBadge').style.opacity=0;
  document.getElementById('likedBadge').style.opacity=0;
  card.style.transform='';
}
function swipe(dir){
  const o=deck[oppIdx];if(!o)return;
  const card=document.getElementById('swipeCard');
  if(dir==='yes'||dir==='super'){
    document.getElementById('likedBadge').style.opacity=1;
    card.style.transform='translateX(45px) rotate(4deg)';
    toast(dir==='super'?`Суперлайк → ${o.org}!`:`Матч с ${o.org}!`);
    const m=store.get('matches',[]);
    if(!m.some(x=>x.title===o.title))m.push({id:o.id,org:o.org,title:o.title,type:o.type,super:dir==='super'});
    store.set('matches',m);renderMatches();
  }else{
    document.getElementById('nopeBadge').style.opacity=1;
    card.style.transform='translateX(-45px) rotate(-4deg)';
    toast('Пропущено');
  }
  const seen=store.get('swiped',[]);if(!seen.includes(o.id)){seen.push(o.id);store.set('swiped',seen);}
  setTimeout(()=>{oppIdx++;renderOpp();},420);
}
function resetSwipes(){store.del('swiped');buildDeck();renderOpp();toast('Колода обновлена');}
function openCurrentOpp(){
  const o=deck[oppIdx];if(!o)return;
  document.getElementById('modal-content').innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <h2 style="font-family:var(--display);font-size:17px;">${esc(o.title)}</h2>
      <button class="nbtn" onclick="closeModal()" aria-label="Закрыть">×</button>
    </div>
    <div class="proj-desc" style="margin-bottom:6px;">${esc(o.org)} · ${esc(o.type)} · ${esc(o.city)}</div>
    <div class="proj-desc" style="margin-bottom:12px;">${esc(fmtDeadline(o.deadline))} · совпадение ${o.match}%</div>
    ${o.url?`<a class="repo-link" href="${esc(o.url)}" target="_blank" rel="noopener noreferrer">Сайт организатора</a>`:''}
    <label class="lbl" for="applyText" style="display:block;margin-top:10px;">Сопроводительное письмо</label>
    <textarea class="ai-ta" id="applyText" maxlength="1000" placeholder="Почему ты подходишь? Упомяни проекты из профиля."></textarea>
    <button class="go-btn" style="margin-top:12px;" onclick="submitApplication()">Сохранить заявку</button>`;
  document.getElementById('modal-overlay').classList.add('show');
}
function submitApplication(){
  const o=deck[oppIdx];if(!o)return;
  const text=document.getElementById('applyText').value.trim();
  if(text.length<20){toast('Напиши хотя бы пару предложений');return;}
  const apps=store.get('applications',[]);apps.push({id:o.id,title:o.title,org:o.org,text,date:Date.now()});store.set('applications',apps);
  closeModal();toast('Заявка сохранена: '+o.org);
  if(window.vxGain&&text.length>=150)vxGain('apply',o.id); // XP только за настоящее письмо, один раз на возможность
  const m=store.get('matches',[]);if(!m.some(x=>x.title===o.title)){m.push({id:o.id,org:o.org,title:o.title,type:o.type});store.set('matches',m);renderMatches();}
}
async function loadOpps(){
  try{
    const res=await fetch('data/opportunities.json',{cache:'no-cache'});
    const data=await res.json();
    OPPS=(Array.isArray(data.items)?data.items:[]).filter(o=>o&&o.id&&o.title);
  }catch(e){console.warn('opportunities:',e);OPPS=[];}
  oppsLoaded=true;renderOppFilters();buildDeck();renderOpp();renderMatches();
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
    const o=OPPS.find(y=>y.id===x.id);
    if(o&&/^https:\/\//.test(o.url)){c.setAttribute('role','link');c.dataset.url=o.url;c.setAttribute('onclick',"window.open(this.dataset.url,'_blank','noopener')");}
    else c.setAttribute('onclick',"toast(this.title)");
    row.appendChild(c);
  });
  const lbl=row.previousElementSibling;if(lbl)lbl.textContent=`Твои матчи (${total})`;
  renderDashboard();
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
  if(window.vxMaybeOnboard)vxMaybeOnboard();
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

// ════════════ NOTIFICATIONS & SHARE ════════════
function modalShell(title,body){
  document.getElementById('modal-content').innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;"><h2 style="font-family:var(--display);font-size:17px;">${esc(title)}</h2><button class="nbtn" onclick="closeModal()" aria-label="Закрыть">×</button></div>${body}`;
  document.getElementById('modal-overlay').classList.add('show');
}
// Уведомления — ближайшие дедлайны возможностей, которые ученик отметил матчем
function openNotifications(){
  const ids=new Set(store.get('matches',[]).map(m=>m.id));
  const soon=OPPS.filter(o=>ids.has(o.id)&&o.deadline).map(o=>({o,d:daysLeft(o.deadline)})).filter(x=>x.d!==null&&x.d>=0&&x.d<=30).sort((a,b)=>a.d-b.d);
  modalShell('Уведомления',soon.length?`<div style="display:flex;flex-direction:column;gap:8px;">${soon.map(({o})=>`<a class="proj" href="${esc(o.url||'#')}" target="_blank" rel="noopener noreferrer"><div style="flex:1;min-width:0"><div class="proj-name">${esc(o.title)}</div><div class="proj-desc">${esc(o.org)} · ${esc(fmtDeadline(o.deadline))}</div></div></a>`).join('')}</div>`
    :`<div class="hint">Пока нет уведомлений. Отметь возможности в TalentMatch — здесь появятся их ближайшие дедлайны.</div>`);
}
function openShare(){
  modalShell('Поделиться профилем',`<div class="hint" style="margin-bottom:12px;">Публичных страниц профилей пока нет: аккаунт хранится в этом браузере. Сохрани профиль в PDF и приложи к заявке — в нём видны навыки, подтверждённые по коду.</div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <button class="go-btn" onclick="closeModal();setTimeout(()=>window.print(),150)">Сохранить профиль в PDF</button>
      <button class="outline-btn" style="margin:0;" onclick="shareProfile()">Поделиться ссылкой на Verix</button>
    </div>`);
}
function profileUrl(){return location.origin+location.pathname;}
async function shareProfile(){
  const data={title:'Verix',text:'Verix — платформа цифровой репутации школьников',url:profileUrl()};
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
renderOpp();loadOpps();

// Смена языка: перерисовываем части, где даты и числа формируются в коде
window.addEventListener('vx:lang',()=>{try{renderOpp();renderSavedSkills();if(lastResult)renderRepoProof(lastResult);}catch(e){console.warn(e);}});
