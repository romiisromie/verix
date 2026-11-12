// ════════════ ACCESSIBILITY · PWA · OFFLINE ════════════
(function(){
  'use strict';
  const NATIVE='button,a,input,select,textarea,summary';
  const LABELS={"openModal('skillproof-info')":'Как работает SkillProof',"openModal('talent-info')":'Как работает TalentMatch',"openModal('rankings-info')":'Как устроены рейтинги',"closeModal()":'Закрыть'};

  // Кликабельные div/span → доступные кнопки (клавиатура + скринридеры)
  function a11yRefresh(root){
    (root||document).querySelectorAll('[onclick]').forEach(el=>{
      if(el.matches(NATIVE)||el.id==='modal-overlay'||el.dataset.a11y)return;
      el.dataset.a11y='1';
      el.setAttribute('role','button');
      if(!el.hasAttribute('tabindex'))el.tabIndex=0;
      const lbl=LABELS[el.getAttribute('onclick')];
      if(lbl&&!el.hasAttribute('aria-label'))el.setAttribute('aria-label',lbl);
      if(el.textContent.trim()==='×'&&!el.hasAttribute('aria-label'))el.setAttribute('aria-label','Закрыть');
    });
  }
  window.a11yRefresh=a11yRefresh;
  document.addEventListener('keydown',e=>{
    const el=e.target;
    if((e.key==='Enter'||e.key===' ')&&el.getAttribute&&el.getAttribute('role')==='button'&&!el.matches(NATIVE)){
      e.preventDefault();el.click();
    }
  });

  // Вкладки: aria-current + фокус на новый экран
  function markTabs(){
    document.querySelectorAll('.tabbar .tab').forEach(t=>{
      if(t.classList.contains('active'))t.setAttribute('aria-current','page');else t.removeAttribute('aria-current');
    });
    document.querySelectorAll('.rank-tab').forEach(t=>t.setAttribute('aria-pressed',t.classList.contains('active')?'true':'false'));
  }
  const _switch=window.switchTab;
  window.switchTab=function(n){_switch(n);markTabs();const sc=document.querySelector('#screen-'+n+' .scroll');if(sc)sc.scrollTop=0;};
  if(window.switchRanking){const _sr=window.switchRanking;window.switchRanking=function(t){_sr(t);markTabs();};}

  // Модальное окно: фокус внутрь, Esc закрывает, фокус возвращается
  const overlay=document.getElementById('modal-overlay');
  const box=document.getElementById('modal-box');
  let lastFocus=null;
  const FOCUSABLE='button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';
  new MutationObserver(()=>{
    const open=overlay.classList.contains('show');
    if(open){
      if(!lastFocus)lastFocus=document.activeElement;
      a11yRefresh(box);
      const title=box.querySelector('h2,[style*="font-weight:600"],[style*="font-weight:700"]');
      box.setAttribute('aria-label',title?title.textContent.trim().slice(0,60):'Окно');
      setTimeout(()=>{const f=box.querySelector(FOCUSABLE);if(f&&!box.contains(document.activeElement))f.focus({preventScroll:true});},60);
    }else if(lastFocus){
      try{lastFocus.focus({preventScroll:true});}catch(e){}
      lastFocus=null;
    }
  }).observe(overlay,{attributes:true,attributeFilter:['class']});
  new MutationObserver(()=>a11yRefresh(box)).observe(document.getElementById('modal-content'),{childList:true});
  document.addEventListener('keydown',e=>{
    if(!overlay.classList.contains('show'))return;
    if(e.key==='Escape'){e.preventDefault();window.closeModal();}
    if(e.key==='Tab'){
      const f=[...box.querySelectorAll(FOCUSABLE)].filter(x=>x.offsetParent!==null);
      if(!f.length)return;
      const first=f[0],last=f[f.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });

  // Офлайн-индикатор
  const badge=document.createElement('div');
  badge.className='offline-badge';badge.setAttribute('role','status');badge.textContent='Нет сети — работаем офлайн';
  document.body.appendChild(badge);
  const syncNet=()=>document.body.classList.toggle('is-offline',!navigator.onLine);
  addEventListener('online',()=>{syncNet();window.toast&&toast('Сеть снова есть');});
  addEventListener('offline',syncNet);syncNet();

  // PWA: service worker + кнопка установки
  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
    addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(err=>console.warn('SW:',err)));
    // Новая версия сайта: один раз перезагружаем страницу, чтобы не смешивать старый и новый код
    const hadController=!!navigator.serviceWorker.controller;let reloaded=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController&&!reloaded){reloaded=true;location.reload();}});
  }
  let deferred=null;
  addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();deferred=e;
    const right=document.querySelector('#screen-profile .nav-right');
    if(!right||document.getElementById('installBtn'))return;
    const b=document.createElement('button');
    b.id='installBtn';b.className='nbtn';b.type='button';b.textContent='Установить';
    b.onclick=async()=>{if(!deferred)return;deferred.prompt();const r=await deferred.userChoice;deferred=null;b.remove();if(r.outcome==='accepted')toast('Verix установлен!');};
    right.prepend(b);
  });
  addEventListener('appinstalled',()=>{const b=document.getElementById('installBtn');if(b)b.remove();});

  // Заголовки для скринридеров
  document.querySelectorAll('.nav-logo').forEach(h=>{h.setAttribute('role','heading');h.setAttribute('aria-level','2');});
  document.querySelectorAll('.sh-title,.ai-title,.rankings-title').forEach(h=>{h.setAttribute('role','heading');h.setAttribute('aria-level','3');});

  // Ярлыки PWA: ?tab=skillproof / ?tab=talent
  const tab=new URLSearchParams(location.search).get('tab');
  if(tab&&/^[a-z]+$/.test(tab)&&document.getElementById('screen-'+tab))window.switchTab(tab);

  a11yRefresh(document);markTabs();
})();
