// ════════════ МОТИВАЦИЯ: XP, уровни, серия дней, челленджи недели, достижения ════════════
(function(){
  'use strict';
  const XP={visit:5,analyze:20,github:40,save:15,like:5,apply:25,task:10,phase:30,roadmap:15,challenge:50};
  const CHALLENGES=[
    {id:'analyze2',title:'Проверь 2 проекта в SkillProof',ev:['analyze','github'],need:2},
    {id:'github1',title:'Проверь проект по ссылке на GitHub',ev:['github'],need:1},
    {id:'like3',title:'Откликнись на 3 возможности',ev:['like'],need:3},
    {id:'apply1',title:'Сохрани заявку на возможность',ev:['apply'],need:1},
    {id:'task3',title:'Выполни 3 задачи роадмапа',ev:['task'],need:3},
    {id:'save1',title:'Добавь проверенный навык в профиль',ev:['save'],need:1},
  ];

  const pad=n=>String(n).padStart(2,'0');
  const dayKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  function weekKey(d){
    const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
    const day=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-day);
    const y=new Date(Date.UTC(t.getUTCFullYear(),0,1));
    return t.getUTCFullYear()+'-W'+pad(Math.ceil(((t-y)/864e5+1)/7));
  }
  function hash(s){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))|0;return Math.abs(h);}

  // Уровень: 40 XP до 2-го, дальше растёт квадратично
  const levelOf=xp=>Math.floor(Math.sqrt(xp/40))+1;
  const xpFor=l=>40*(l-1)*(l-1);
  const getXP=()=>+store.get('xp',0)||0;
  window.vxLevel=()=>levelOf(getXP());

  function week(){
    const key=weekKey(new Date());
    let w=store.get('week',null);
    if(!w||w.key!==key){
      const h=hash(key),pool=CHALLENGES.slice(),pick=[];
      for(let i=0;i<3;i++)pick.push(pool.splice((h>>(i*3))%pool.length,1)[0].id);
      w={key,c:{},done:[],list:pick};store.set('week',w);
    }
    return w;
  }

  function addXP(n,silent){
    const before=getXP(),after=before+n;store.set('xp',after);
    const lb=levelOf(before),la=levelOf(after);
    if(la>lb){
      toast(`Новый уровень: LVL ${la}!`);
      if(window.vxBurst)vxBurst(document.querySelector('.avatar'),60);
    }else if(!silent&&n>0){toast(`+${n} XP`);}
  }

  window.vxGain=function(type){
    if(!XP[type])return;
    const w=week();
    w.c[type]=(w.c[type]||0)+1;
    let bonus=0;
    w.list.forEach(id=>{
      const ch=CHALLENGES.find(c=>c.id===id);if(!ch||w.done.includes(id))return;
      const prog=ch.ev.reduce((a,e)=>a+(w.c[e]||0),0);
      if(prog>=ch.need){w.done.push(id);bonus+=XP.challenge;store.set('ch_total',(+store.get('ch_total',0)||0)+1);
        setTimeout(()=>{toast(`Челлендж выполнен: ${ch.title}! +${XP.challenge} XP`);if(window.vxBurst)vxBurst(document.getElementById('chList'),50);},1400);}
    });
    store.set('week',w);
    addXP(XP[type]+bonus,true);
    render();
  };

  function streak(){
    const today=dayKey(new Date()),y=new Date();y.setDate(y.getDate()-1);
    const s=store.get('streak',{last:null,count:0,best:0});
    if(s.last===today)return s;
    s.count=s.last===dayKey(y)?s.count+1:1;
    s.best=Math.max(s.best||0,s.count);s.last=today;
    store.set('streak',s);
    addXP(XP.visit,true);
    return s;
  }

  const plural=(n,a,b,c)=>{const m10=n%10,m100=n%100;return m10===1&&m100!==11?a:m10>=2&&m10<=4&&(m100<10||m100>=20)?b:c;};

  function badges(){
    const skills=store.get('skills',[]),s=store.get('streak',{best:0}),rm=store.get('roadmap',null);
    const phaseDone=!!(rm&&rm.phases&&rm.phases.some(p=>p.tasks.length&&p.tasks.every(t=>t.done)));
    return [
      {name:'Первый навык',desc:'Проверь проект в SkillProof и добавь навык в профиль',ok:skills.length>0},
      {name:'Код ✓',desc:'Получи оценку AI по реальному коду с GitHub',ok:skills.some(x=>x.source==='github')},
      {name:'Серия 3 дня',desc:'Заходи в Verix 3 дня подряд',ok:(s.best||0)>=3},
      {name:'Серия 7 дней',desc:'Заходи в Verix 7 дней подряд',ok:(s.best||0)>=7},
      {name:'3 матча',desc:'Откликнись на 3 возможности в TalentMatch',ok:store.get('matches',[]).length>=3},
      {name:'Первая заявка',desc:'Сохрани сопроводительное письмо к возможности',ok:store.get('applications',[]).length>0},
      {name:'Фаза пройдена',desc:'Выполни все задачи одной фазы роадмапа',ok:phaseDone},
      {name:'Челленджер',desc:'Выполни челлендж недели',ok:(+store.get('ch_total',0)||0)>0},
      {name:'LVL 5',desc:'Набери 640 XP',ok:levelOf(getXP())>=5},
    ];
  }
  window.vxBadge=function(i){const b=badges()[i];if(b)toast(b.ok?`${b.name}: получено!`:`${b.name}: ${b.desc}`);};
  function openBadges(){
    const list=badges(),got=list.filter(b=>b.ok).length;
    document.getElementById('modal-content').innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h2 style="font-family:var(--display);font-size:17px;">Достижения · ${got}/${list.length}</h2>
        <button class="nbtn" onclick="closeModal()" aria-label="Закрыть">×</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">${list.map(b=>`
        <div class="proj${b.ok?'':' locked'}"><div style="flex:1;min-width:0"><div class="proj-name">${esc(b.name)}</div><div class="proj-desc">${esc(b.desc)}</div></div><div class="proj-score">${b.ok?'✓':'—'}</div></div>`).join('')}
      </div>`;
    document.getElementById('modal-overlay').classList.add('show');
  }
  const _open=window.openModal;
  window.openModal=function(k){if(k==='badges'){openBadges();return;}_open(k);};

  function render(){
    const xp=getXP(),l=levelOf(xp),lo=xpFor(l),hi=xpFor(l+1),pct=Math.round((xp-lo)/(hi-lo)*100);
    const s=store.get('streak',{count:0});
    const lb=document.getElementById('levelBadge');if(lb)lb.textContent='LVL '+l;
    const lab=document.getElementById('xpLabel');if(lab)lab.textContent=`${xp} XP · до LVL ${l+1} ещё ${hi-xp}`;
    const fill=document.getElementById('xpFill');if(fill){fill.style.width=pct+'%';fill.dataset.w=pct+'%';}
    const st=document.getElementById('streakChip');if(st)st.textContent=`Серия: ${s.count} ${plural(s.count,'день','дня','дней')}`;

    const w=week();
    const list=document.getElementById('chList');
    if(list){
      list.innerHTML=w.list.map(id=>{
        const ch=CHALLENGES.find(c=>c.id===id);if(!ch)return '';
        const prog=Math.min(ch.need,ch.ev.reduce((a,e)=>a+(w.c[e]||0),0)),done=w.done.includes(id);
        return `<div class="ch-item${done?' done':''}"><div class="ch-top"><span>${esc(ch.title)}</span><b>${done?'✓':prog+'/'+ch.need}</b></div><div class="bar"><div class="bf bf-g" style="width:${Math.round(prog/ch.need*100)}%"></div></div></div>`;
      }).join('');
      const now=new Date(),left=(8-(now.getDay()||7));
      const d=document.getElementById('chDays');if(d)d.textContent=left<=1?'последний день':`ещё ${left} ${plural(left,'день','дня','дней')}`;
    }

    const row=document.querySelector('#screen-profile .bdg-row');
    if(row){
      const bs=badges();
      row.innerHTML=bs.map((b,i)=>`<div class="bdg${b.ok?'':' locked'}" onclick="vxBadge(${i})" title="${esc(b.desc)}"><div class="bdg-name">${esc(b.name)}</div></div>`).join('');
      const all=row.parentElement.querySelector('.sh-btn');if(all)all.textContent=`Все (${bs.filter(b=>b.ok).length}/${bs.length})`;
      if(window.a11yRefresh)a11yRefresh(row);
    }
  }
  window.vxRender=render;

  streak();render();
})();
