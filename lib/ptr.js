/* Leon pull-to-refresh (owner, 2026-11-14): in an installed app (home-screen web app, the Android or Windows app) a pull
   down from the top of the page reloads it, so the newest version arrives at once. An emerald medallion drops in, a gold
   ring fills with the pull while a guilloché rosette turns; past the line it clicks gold, and on release it spins while
   the app checks for a new version and reloads. Never in a normal browser tab (it has its own), never while a form is
   being typed in, a sheet or dialog is open, or the page says so (window.leonPtrBlock() returns true). Same file in the
   ledger (leon-gold/index.html) and the site (leon-gold-site/lib/ptr.js). */
(function(){
  if(window.__leonPtr||window.top!==window)return;window.__leonPtr=1;   // once, and never inside a frame (the ledger's invoice in «حساب من»)
  var nav=navigator,app=/LeonGoldApp/.test(nav.userAgent)||nav.standalone===true||(window.matchMedia&&(matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches));
  if(!app||!('ontouchstart' in window))return;
  var LINE=72,MAX=124,R=19,C=2*Math.PI*R;
  // a small rosette: phase-shifted polar sines, the same family as the site's guilloché
  var ros='';for(var j=0;j<6;j++){var ph=j/6*Math.PI*2/8,d='';for(var i=0;i<=96;i++){var t=i/96*Math.PI*2,r=9+2.2*Math.sin(8*(t+ph))+.8*Math.sin(24*(t-ph));d+=(i?'L':'M')+(24+r*Math.cos(t)).toFixed(1)+' '+(24+r*Math.sin(t)).toFixed(1)}ros+='<path d="'+d+'Z"/>'}
  var css='.lptr{position:fixed;left:50%;top:0;z-index:2147483000;width:52px;height:52px;margin-left:-26px;border-radius:50%;pointer-events:none;opacity:0;'
   +'transform:translateY(-64px);background:radial-gradient(circle at 50% 35%,#1d5642,#0b2219 72%);box-shadow:0 0 0 1px rgba(226,203,148,.75),0 0 0 4px rgba(11,34,25,.55),0 10px 24px rgba(0,0,0,.45)}'
   +'.lptr svg{position:absolute;inset:2px;width:48px;height:48px;overflow:visible}'
   +'.lptr .rg{fill:none;stroke:rgba(226,203,148,.18);stroke-width:2}'
   +'.lptr .rf{fill:none;stroke:url(#lptrG);stroke-width:2.4;stroke-linecap:round;transform:rotate(-90deg);transform-origin:24px 24px}'
   +'.lptr .ro{fill:none;stroke:#e2cb94;stroke-width:.55;stroke-opacity:.85;transform-origin:24px 24px}'
   +'.lptr .dot{fill:#f3e2b3}'
   +'.lptr.ready{box-shadow:0 0 0 1px #f3e2b3,0 0 0 4px rgba(201,162,76,.35),0 0 22px rgba(226,203,148,.55),0 10px 24px rgba(0,0,0,.45)}'
   +'.lptr.ready .ro{stroke-opacity:1}'
   +'.lptr.go{transition:transform .35s cubic-bezier(.2,1.4,.4,1),opacity .2s}'
   +'.lptr.spin .ro{animation:lptrS 1.1s linear infinite}.lptr.spin .rf{animation:lptrA 1.1s cubic-bezier(.5,0,.5,1) infinite}'
   +'.lptr-t{position:fixed;left:50%;top:0;z-index:2147483000;pointer-events:none;opacity:0;white-space:nowrap;padding:2px 12px;border-radius:999px;font:600 12px/1.7 Vazirmatn,Tahoma,sans-serif;color:#f3e2b3;background:rgba(11,34,25,.9);box-shadow:0 0 0 1px rgba(226,203,148,.55),0 6px 14px rgba(0,0,0,.3)}'
   +'@keyframes lptrS{to{transform:rotate(360deg)}}@keyframes lptrA{0%{stroke-dashoffset:'+(C*.75).toFixed(1)+';transform:rotate(-90deg)}50%{stroke-dashoffset:'+(C*.25).toFixed(1)+'}100%{stroke-dashoffset:'+(C*.75).toFixed(1)+';transform:rotate(270deg)}}'
   +'html.lptr-on,html.lptr-on body{overscroll-behavior-y:contain}'
   +'@media (prefers-reduced-motion:reduce){.lptr.spin .ro,.lptr.spin .rf{animation:none}}';
  var st=document.createElement('style');st.textContent=css;
  var el=document.createElement('div');el.className='lptr';el.setAttribute('aria-hidden','true');
  el.innerHTML='<svg viewBox="0 0 48 48"><defs><linearGradient id="lptrG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3e2b3"/><stop offset=".5" stop-color="#c9a24c"/><stop offset="1" stop-color="#8a6a2c"/></linearGradient></defs>'
   +'<circle class="rg" cx="24" cy="24" r="'+R+'"/><circle class="rf" cx="24" cy="24" r="'+R+'" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+C.toFixed(1)+'"/><g class="ro">'+ros+'</g><circle class="dot" cx="24" cy="24" r="1.6"/></svg>';
  var tx=document.createElement('div');tx.className='lptr-t';tx.setAttribute('role','status');tx.setAttribute('aria-live','polite');
  var rf,ro,y0=0,x0=0,on=false,pull=0,busy=false,ready=false;
  function mount(){if(el.parentNode)return;document.head.appendChild(st);document.body.appendChild(el);document.body.appendChild(tx);rf=el.querySelector('.rf');ro=el.querySelector('.ro');document.documentElement.classList.add('lptr-on')}
  function top(){return (window.scrollY||document.documentElement.scrollTop||0)<=0}
  function blocked(t){
    if(busy)return true;
    try{if(typeof window.leonPtrBlock==='function'&&window.leonPtrBlock())return true}catch(e){}
    var a=document.activeElement;if(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT'||a.isContentEditable))return true;
    if(document.querySelector('[aria-modal="true"]:not([hidden]),dialog[open],.modal,.hs-sheet-open,.fs-on'))return true;
    // a list or panel scrolled down inside the page: the pull belongs to it
    for(var n=t;n&&n!==document.body&&n.nodeType===1;n=n.parentNode)if(n.scrollTop>0)return true;
    return false}
  function say(s){tx.textContent=s}
  function show(p){var k=Math.min(1,p/LINE),y=Math.min(p,MAX)*.62-10;
    el.style.opacity=String(Math.min(1,p/26));el.style.transform='translateY('+y.toFixed(1)+'px) scale('+(.7+.3*k).toFixed(3)+')';
    rf.style.strokeDashoffset=(C*(1-k)).toFixed(1);ro.style.transform='rotate('+(p*2.2).toFixed(1)+'deg)';
    tx.style.opacity=String(Math.max(0,(p-30)/40));tx.style.transform='translate(-50%,'+(y+60).toFixed(1)+'px)';
    var r=p>=LINE;if(r!==ready){ready=r;el.classList.toggle('ready',r);say(r?'رها کنید تا تازه شود':'بکشید برای تازه کردن');if(r&&nav.vibrate)try{nav.vibrate(8)}catch(e){}}}
  function back(){el.classList.add('go');el.style.opacity='0';el.style.transform='translateY(-64px) scale(.7)';tx.style.opacity='0';ready=false;el.classList.remove('ready');setTimeout(function(){el.classList.remove('go')},360)}
  function refresh(){busy=true;el.classList.add('go','spin');el.style.transform='translateY(34px) scale(1)';tx.style.transform='translate(-50%,94px)';say('در حال تازه کردن…');
    var done=function(){location.reload()};
    var t=setTimeout(done,2500);
    try{if(nav.serviceWorker&&nav.serviceWorker.getRegistration)nav.serviceWorker.getRegistration().then(function(r){return r&&r.update()}).then(function(){clearTimeout(t);setTimeout(done,350)},function(){})}catch(e){}}
  addEventListener('touchstart',function(e){if(e.touches.length!==1||!top()||blocked(e.target)){on=false;return}mount();on=true;pull=0;y0=e.touches[0].clientY;x0=e.touches[0].clientX},{passive:true});
  addEventListener('touchmove',function(e){if(!on)return;var dy=e.touches[0].clientY-y0,dx=e.touches[0].clientX-x0;
    if(pull===0&&(dy<=0||Math.abs(dx)>Math.abs(dy)||!top())){on=false;return}
    pull=Math.max(0,dy*.55);if(pull>0&&e.cancelable)e.preventDefault();el.classList.remove('go');show(pull)},{passive:false});
  function end(){if(!on)return;on=false;if(pull>=LINE)refresh();else if(pull>0)back();pull=0}
  addEventListener('touchend',end,{passive:true});addEventListener('touchcancel',function(){if(on){on=false;pull=0;back()}},{passive:true});
})();
