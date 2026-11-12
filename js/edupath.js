// ════════════ EDUPATH: личный роадмап (AI через Groq или шаблон) ════════════
(function(){
  'use strict';
  const ENDPOINT='/api/roadmap';
  const GOALS=[
    {id:'frontend',name:'Frontend Engineer',hint:'React, TypeScript'},
    {id:'backend',name:'Backend Developer',hint:'Node.js / Python, базы данных'},
    {id:'data',name:'Data Scientist',hint:'Python, анализ данных, ML'},
    {id:'ml',name:'ML Engineer',hint:'нейросети, модели, деплой'},
    {id:'design',name:'UI/UX Designer',hint:'Figma, исследования'},
    {id:'mobile',name:'Mobile Developer',hint:'Flutter / React Native'},
    {id:'game',name:'Game Developer',hint:'Unity / Godot'},
    {id:'security',name:'Cybersecurity',hint:'сети, CTF, безопасность'},
  ];
  const T=(title,desc,tasks)=>({title,desc,tasks});
  const TEMPLATES={
    frontend:{months:8,phases:[
      T('Основы веба','HTML, CSS, JavaScript — фундамент',['HTML & CSS основы','JavaScript основы','Первая страница на GitHub Pages']),
      T('React & компоненты','Компонентный подход, хуки, состояние',['Компоненты и пропсы','useState & useEffect','Роутинг (React Router)','API запросы (fetch)']),
      T('Продвинутый React','TypeScript, состояние, тесты',['TypeScript в проекте','Redux / Zustand','Тесты на Vitest или Jest']),
      T('Portfolio + Job Ready','Финальный проект и отклики',['Свой проект с деплоем','Проверить проект в SkillProof','Откликнуться на 3 стажировки']),
    ]},
    data:{months:10,phases:[
      T('Python с нуля','Синтаксис, функции, файлы',['Типы, циклы, функции','Работа с файлами и CSV','Мини-проект: анализ оценок класса']),
      T('Анализ данных','pandas, графики, выводы',['pandas: таблицы и фильтры','Графики в matplotlib','Исследование открытого датасета']),
      T('Машинное обучение','Модели и метрики',['Регрессия и классификация','Метрики и валидация','Модель на Kaggle-датасете']),
      T('Портфолио','Проект и участие в соревнованиях',['Проект с README и выводами','Проверить проект в SkillProof','Kaggle или хакатон по данным']),
    ]},
    design:{months:6,phases:[
      T('Основы дизайна','Композиция, цвет, типографика',['Сетки и композиция','Цвет и контраст','Типографика: 3 пары шрифтов']),
      T('Figma','Компоненты и прототипы',['Компоненты и автолейаут','Кликабельный прототип','Редизайн школьного сайта']),
      T('UX-исследования','Пользователи и проверка гипотез',['5 интервью с пользователями','Карта пути пользователя','Юзабилити-тест прототипа']),
      T('Портфолио','Кейсы и отклики',['2 кейса на Behance','Проверить кейс в SkillProof','Откликнуться на 3 возможности']),
    ]},
  };
  const generic=goal=>({months:8,phases:[
    T('Фундамент','База, без которой дальше никак',['Найти бесплатный курс по теме','Пройти первые 5 уроков','Завести GitHub и первый репозиторий']),
    T('Практика','Маленькие проекты каждую неделю',['Мини-проект №1','Мини-проект №2','Показать код другу или ментору']),
    T('Углубление','Сложные темы и командная работа',['Разобрать продвинутую тему','Проект в команде','Участие в хакатоне']),
    T('Портфолио','Проект, который не стыдно показать',[`Финальный проект: ${goal}`,'Проверить проект в SkillProof','Откликнуться на 3 возможности']),
  ]});

  function build(goal,src,months,advice){
    return {goal_title:goal,months,source:src,advice,created:Date.now(),
      phases:src.phases.map(p=>({title:p.title,desc:p.desc,tasks:p.tasks.map(t=>({t,done:false}))}))};
  }
  function fromTemplate(goalName){
    const g=GOALS.find(x=>x.name===goalName);
    const tpl=(g&&TEMPLATES[g.id])||generic(goalName);
    return build(goalName,tpl,tpl.months,'План по шаблону. **Нажми «AI-план»**, чтобы AI подстроил его под твои навыки и время.');
  }
  function defaultRoadmap(){
    const r=fromTemplate('Frontend Engineer');
    // Демо-прогресс, как в исходном профиле
    r.phases[0].tasks.forEach(t=>t.done=true);r.phases[1].tasks[0].done=true;
    r.advice='Ты прогрессируешь стабильно. Следующий шаг: закончи задание по **useEffect** — это откроет API-запросы и поднимет скор.';
    return r;
  }
  const load=()=>{const r=store.get('roadmap',null);return r&&Array.isArray(r.phases)&&r.phases.length?r:defaultRoadmap();};
  const save=r=>store.set('roadmap',r);

  function stats(r){
    const all=r.phases.flatMap(p=>p.tasks);const done=all.filter(t=>t.done).length;
    return {done,total:all.length,pct:all.length?Math.round(done/all.length*100):0};
  }
  function current(r){
    for(let pi=0;pi<r.phases.length;pi++){const ti=r.phases[pi].tasks.findIndex(t=>!t.done);if(ti>=0)return {pi,ti};}
    return null;
  }
  const mdStrong=s=>esc(s).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
  const plural=(n,a,b,c)=>{const m10=n%10,m100=n%100;return m10===1&&m100!==11?a:m10>=2&&m10<=4&&(m100<10||m100>=20)?b:c;};

  function render(){
    const r=load(),s=stats(r),cur=current(r);
    document.getElementById('rmGoal').textContent=r.goal_title;
    document.getElementById('rmMeta').textContent=`${r.months} ${plural(r.months,'месяц','месяца','месяцев')} · Прогресс ${s.pct}% · ${s.done}/${s.total} задач`;
    const fill=document.getElementById('rmFill');fill.style.width=s.pct+'%';fill.dataset.w=s.pct+'%';
    document.getElementById('rmAdviceHead').textContent=r.source==='ai'?'AI рекомендация':'Подсказка';
    document.getElementById('rmAdvice').innerHTML=mdStrong(r.advice||'');
    const list=document.getElementById('rmList');
    list.innerHTML=r.phases.map((p,pi)=>{
      const allDone=p.tasks.every(t=>t.done);
      const isNow=cur&&cur.pi===pi;
      const state=allDone?'done':isNow?'now':'locked';
      const label=allDone?'Завершена':isNow?'Сейчас':pi===r.phases.length-1?'Финал':'Скоро';
      const last=pi===r.phases.length-1;
      const tasks=p.tasks.map((t,ti)=>{
        const now=isNow&&cur.ti===ti;
        return `<div class="tk${state==='locked'?' tk-locked':''}" onclick="rmToggle(${pi},${ti})" aria-pressed="${t.done}"><div class="tk-box ${t.done?'done':now?'now':''}">${t.done?'✓':now?'→':''}</div>${esc(t.t)}</div>`;
      }).join('');
      return `<div class="rm-item">
        <div class="rm-left"><div class="rm-dot ${state}">${pi+1}</div>${last?'':'<div class="rm-line"></div>'}</div>
        <div class="rm-content"${last?' style="padding-bottom:4px"':''}>
          <div class="rm-phase">Фаза ${pi+1} · ${label}</div><div class="rm-title">${esc(p.title)}</div>
          <div class="rm-desc">${esc(p.desc)}</div>
          <div class="rm-tasks">${tasks}</div>
          ${isNow?'<button class="outline-btn" onclick="rmOpenTask()">Продолжить задание</button>':''}
        </div>
      </div>`;
    }).join('');
    if(window.a11yRefresh)a11yRefresh(list);
  }

  window.rmToggle=function(pi,ti){
    const r=load();const t=r.phases[pi]&&r.phases[pi].tasks[ti];if(!t)return;
    t.done=!t.done;
    const ph=r.phases[pi];
    // XP начисляется один раз за задачу и за фазу, чтобы галочки нельзя было «накручивать»
    const firstTask=t.done&&!t.xp;if(firstTask)t.xp=1;
    const phaseDone=ph.tasks.every(x=>x.done),firstPhase=phaseDone&&!ph.xp;if(firstPhase)ph.xp=1;
    save(r);render();
    if(t.done){
      if(firstTask&&window.vxGain)vxGain('task');
      if(phaseDone){toast(`Фаза «${ph.title}» пройдена!`);if(firstPhase&&window.vxGain)vxGain('phase');}
      else toast(firstTask?'Задача выполнена: +10 XP':'Задача выполнена');
    }
  };
  window.rmOpenTask=function(){
    const r=load(),cur=current(r);if(!cur)return;
    const p=r.phases[cur.pi],t=p.tasks[cur.ti];
    document.getElementById('modal-content').innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <h2 style="font-family:var(--display);font-size:17px;">${esc(t.t)}</h2>
        <button class="nbtn" onclick="closeModal()" aria-label="Закрыть">×</button>
      </div>
      <div class="proj-desc" style="margin-bottom:12px;">Фаза ${cur.pi+1} · ${esc(p.title)} · задача ${cur.ti+1} из ${p.tasks.length}</div>
      <div class="ai-verd"><div class="ai-verd-h">Как доказать</div><div class="ai-verd-t">Сделай результат в публичном репозитории на GitHub — потом <strong>проверь его в SkillProof</strong>, и навык появится в профиле с отметкой «код ✓».</div></div>
      <button class="go-btn" style="margin-top:14px;" onclick="rmToggle(${cur.pi},${cur.ti});closeModal()">Готово, отметить</button>
      <button class="outline-btn" onclick="closeModal();switchTab('skillproof')">Проверить в SkillProof</button>`;
    document.getElementById('modal-overlay').classList.add('show');
  };

  window.openGoalPicker=function(){
    const r=load(),p=loadP();
    const hours=store.get('rm_hours',5);
    const custom=!GOALS.some(g=>g.name===r.goal_title);
    document.getElementById('modal-content').innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h2 style="font-family:var(--display);font-size:17px;">Цель и план</h2>
        <button class="nbtn" onclick="closeModal()" aria-label="Закрыть">×</button>
      </div>
      <div class="goal-grid" role="radiogroup" aria-label="Цель">
        ${GOALS.map(g=>`<button type="button" class="goal-opt${g.name===r.goal_title?' on':''}" role="radio" aria-checked="${g.name===r.goal_title}" data-goal="${esc(g.name)}" onclick="rmPickGoal(this)"><b>${esc(g.name)}</b><span>${esc(g.hint)}</span></button>`).join('')}
      </div>
      <label class="lbl" for="rmCustom" style="display:block;margin-top:12px;">Или своя цель</label>
      <input class="inp" id="rmCustom" maxlength="60" placeholder="Например: разработчик ботов для Telegram" value="${custom?esc(r.goal_title):''}" oninput="document.querySelectorAll('.goal-opt').forEach(b=>{b.classList.remove('on');b.setAttribute('aria-checked','false');})">
      <label class="lbl" for="rmHours" style="display:block;margin-top:12px;">Сколько часов в неделю есть</label>
      <select class="inp" id="rmHours">${[2,4,6,8,12,16,20].map(h=>`<option value="${h}"${h===hours?' selected':''}>${h} ч в неделю</option>`).join('')}</select>
      <div class="hint" style="margin-top:8px;">AI учтёт твой класс (${esc(p.grade)}) и навыки, проверенные в SkillProof.</div>
      <button class="go-btn" id="rmBuildBtn" style="margin-top:14px;" onclick="rmBuild()">Построить план с AI</button>
      <button class="outline-btn" onclick="rmTemplate()">Взять готовый шаблон</button>`;
    document.getElementById('modal-overlay').classList.add('show');
  };
  window.rmPickGoal=function(el){
    document.querySelectorAll('.goal-opt').forEach(b=>{b.classList.toggle('on',b===el);b.setAttribute('aria-checked',b===el?'true':'false');});
    document.getElementById('rmCustom').value='';
  };
  function chosenGoal(){
    const c=document.getElementById('rmCustom').value.trim();
    if(c)return c;
    const on=document.querySelector('.goal-opt.on');return on?on.dataset.goal:'';
  }
  window.rmTemplate=function(){
    const g=chosenGoal();if(!g){toast('Выбери цель');return;}
    save(fromTemplate(g));render();closeModal();toast('Новый план: '+g);
  };
  window.rmBuild=async function(){
    const goal=chosenGoal();if(!goal){toast('Выбери цель');return;}
    const hours=+document.getElementById('rmHours').value||5;store.set('rm_hours',hours);
    const btn=document.getElementById('rmBuildBtn');btn.disabled=true;btn.textContent='AI составляет план...';btn.setAttribute('aria-busy','true');
    try{
      const skills=store.get('skills',[]).map(s=>({skill:s.skill,score:s.score,level:s.level}));
      const data=await postJSON(ENDPOINT,{goal,grade:loadP().grade,hours,skills},60000);
      if(!data||!Array.isArray(data.phases)){
        save(fromTemplate(goal));render();closeModal();toast('AI недоступен — взяли шаблон');return;
      }
      const r=build(data.goal_title||goal,data,data.months||8,data.advice);r.source='ai';
      save(r);render();closeModal();toast('AI-план готов!');
      if(window.vxGain)vxGain('roadmap');
    }catch(e){toast('Не получилось: '+e.message);btn.disabled=false;btn.textContent='Построить план с AI';btn.removeAttribute('aria-busy');}
  };

  window.rmStats=()=>stats(load());
  render();
})();
