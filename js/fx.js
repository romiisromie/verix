// ════════════ INTERACTIVE FX ════════════
(function(){
  const COLORS=['#ffd23f','#ff4f9a','#2f6bff','#12b76a','#ff8a00','#ff4d3d'];
  const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

  function confetti(x,y,n){
    if(reduce)return;
    for(let i=0;i<(n||34);i++){
      const d=document.createElement('div');d.className='cf';
      d.style.left=x+'px';d.style.top=y+'px';d.style.background=COLORS[i%COLORS.length];
      const a=Math.random()*Math.PI*2,v=70+Math.random()*170;
      d.style.setProperty('--dx',Math.cos(a)*v+'px');
      d.style.setProperty('--dy',(Math.sin(a)*v+40+Math.random()*120)+'px');
      d.style.setProperty('--r',(Math.random()*720-360)+'deg');
      document.body.appendChild(d);setTimeout(()=>d.remove(),1200);
    }
  }
  function burstAt(el,n){const r=el.getBoundingClientRect();confetti(r.left+r.width/2,r.top+r.height/2,n);}

  function countUp(el){
    const t=el.firstChild;if(!t||t.nodeType!==3)return;
    if(!el.dataset.v)el.dataset.v=t.textContent.trim();
    const raw=el.dataset.v,m=raw.match(/^([+#-]?)(\d+(?:\.\d+)?)(.*)$/);if(!m||reduce)return;
    const target=parseFloat(m[2]),dec=(m[2].split('.')[1]||'').length,start=performance.now(),dur=900;
    cancelAnimationFrame(el._cu);
    const step=now=>{const k=Math.min(1,(now-start)/dur),e=1-Math.pow(1-k,3);
      t.textContent=k<1?m[1]+(target*e).toFixed(dec)+m[3]:raw;if(k<1)el._cu=requestAnimationFrame(step);};
    el._cu=requestAnimationFrame(step);
  }

  function animateScreen(sc){
    if(!sc)return;
    sc.querySelectorAll('.bf,.skc-fill,.path-fill').forEach(b=>{
      if(!b.dataset.w)b.dataset.w=b.style.width;
      b.style.width='0';void b.offsetWidth;
      requestAnimationFrame(()=>{b.style.width=b.dataset.w;});
    });
    sc.querySelectorAll('.rfg').forEach(r=>{r.style.animation='none';void r.getBoundingClientRect();r.style.animation='';});
    sc.querySelectorAll('.stat-n,.proj-score,.r-score,.school-stat-val,.comp-stat-val,.rep-num').forEach(countUp);
  }

  const _switch=window.switchTab;
  window.switchTab=function(n){_switch(n);animateScreen(document.getElementById('screen-'+n));};

  const _show=window.showApp;
  window.showApp=function(){_show();setTimeout(()=>animateScreen(document.querySelector('.screen.active')),60);};

  const _swipe=window.swipe;
  window.swipe=function(dir){
    const card=document.getElementById('swipeCard');
    _swipe(dir);
    if(dir!=='no'){burstAt(card,dir==='super'?60:34);if(navigator.vibrate)navigator.vibrate(20);}
  };

  const _save=window.saveSkill;
  window.saveSkill=function(){const b=document.querySelector('#aiResult .save-btn');if(b)burstAt(b,40);_save();};

  const _apply=window.applyProfile;
  window.applyProfile=function(){_apply();burstAt(document.querySelector('.avatar'),30);};

  const _run=window.runAnalysis;
  window.runAnalysis=async function(){
    await _run.apply(this,arguments);
    document.querySelectorAll('#aiResult .sc-n').forEach(el=>{delete el.dataset.v;countUp(el);});
  };

  // Drag-to-swipe on the opportunity card
  const card=document.getElementById('swipeCard');
  let sx=0,dx=0,drag=false;
  card.addEventListener('pointerdown',e=>{
    if(e.target.closest('button'))return;
    drag=true;sx=e.clientX;dx=0;card.classList.add('dragging');card.setPointerCapture(e.pointerId);
  });
  card.addEventListener('pointermove',e=>{
    if(!drag)return;dx=e.clientX-sx;
    card.style.transform=`translateX(${dx}px) rotate(${dx/16}deg)`;
    document.getElementById('likedBadge').style.opacity=Math.max(0,Math.min(1,dx/90));
    document.getElementById('nopeBadge').style.opacity=Math.max(0,Math.min(1,-dx/90));
  });
  const end=()=>{
    if(!drag)return;drag=false;card.classList.remove('dragging');
    if(Math.abs(dx)>90){
      window.swipe(dx>0?'yes':'no');
      card.style.transform=`translateX(${dx>0?420:-420}px) rotate(${dx>0?22:-22}deg)`;
    }else{
      card.style.transform='';
      document.getElementById('likedBadge').style.opacity=0;
      document.getElementById('nopeBadge').style.opacity=0;
    }
  };
  card.addEventListener('pointerup',end);card.addEventListener('pointercancel',end);

  // Little bounce on achievement / skill taps
  document.addEventListener('click',e=>{
    const b=e.target.closest('.bdg,.m-chip');
    if(b)burstAt(b,14);
  });
})();
