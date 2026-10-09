/* viddora — shared page logic (demo data is stored only in this browser) */
(function(){
const KEY='viddora-demo-v1';
let mem=null;
const Store={
  get(){try{const v=localStorage.getItem(KEY);if(v)return JSON.parse(v);}catch(e){}return mem;},
  set(v){mem=v;try{localStorage.setItem(KEY,JSON.stringify(v));}catch(e){}},
  clear(){mem=null;try{localStorage.removeItem(KEY);}catch(e){}}
};
window.Viddora={Store};

const PLANS={
  free:{name:'Free month',price:'$0',per:'for 30 days',allowance:60,note:'Up to 60 credits for your first 30 days'},
  study:{name:'Study Pack',price:'$5.99',per:'one-time',allowance:40,note:'40 credits, valid for 12 months'},
  monthly:{name:'Monthly',price:'$7.99',per:'per month',allowance:60,note:'60 credits every month, up to 30 roll over'},
  semester:{name:'Semester',price:'$26.99',per:'for 4 months',allowance:60,note:'60 credits a month for 4 months'}
};
const EXAMPLE_LESSONS=[
  {id:'l10',t:'How do noise-cancelling headphones work?',d:'Intuitive',m:2,date:'2026-10-08',s:'ready',k:'headphones'},
  {id:'l9',t:'Why does the KV cache grow with every token?',d:'Deep dive',m:1,date:'2026-10-07',s:'ready',k:'kv',clip:true},
  {id:'l8',t:'KV caching in LLMs',d:'Deep dive',m:3,date:'2026-10-07',s:'ready',k:'kv'},
  {id:'l7',t:'How a TCP handshake works',d:'Deep dive',m:5,date:'2026-10-05',s:'ready',k:'tcp'},
  {id:'l6',t:'The Navier–Stokes equation',d:'Standard',m:3,date:'2026-10-03',s:'ready',k:'navier'},
  {id:'l5',t:'Supply and demand',d:'Standard',m:3,date:'2026-10-01',s:'ready',k:'supply'},
  {id:'l4',t:'Photosynthesis, step by step',d:'Standard',m:2,date:'2026-09-29',s:'ready',k:'leaf'},
  {id:'l3',t:'Why is the sky blue?',d:'Intuitive',m:2,date:'2026-09-28',s:'ready',k:'sky'},
  {id:'l2',t:'Why do we have seasons?',d:'Intuitive',m:2,date:'2026-09-26',s:'failed',k:'seasons'},
  {id:'l1',t:'Adding fractions',d:'Intuitive',m:1,date:'2026-09-26',s:'ready',k:'fractions'}
];
function exampleAccount(name,email){
  const lessons=EXAMPLE_LESSONS.map(x=>({...x}));
  const spent=lessons.filter(l=>l.s==='ready').reduce((a,l)=>a+l.m,0);
  return {name:name||'Insharah',email:email||'insharah@example.com',plan:'monthly',allowance:60,credits:60-spent,spent,
    cycleStart:'2026-09-25',renews:'2026-10-25',example:true,lessons,
    invoices:[{date:'2026-09-25',what:'Monthly plan',amt:'$7.99',st:'Paid'},{date:'2026-08-25',what:'Monthly plan',amt:'$7.99',st:'Paid'},{date:'2026-07-25',what:'Free month',amt:'$0.00',st:'Free'}]};
}
function newAccount(name,email,plan){
  const p=PLANS[plan]||PLANS.free;
  return {name,email,plan,allowance:p.allowance,credits:p.allowance,spent:0,cycleStart:'2026-10-09',renews:plan==='study'?'2027-10-09':'2026-11-08',example:false,lessons:[],
    invoices:[{date:'2026-10-09',what:p.name,amt:p.price==='$0'?'$0.00':p.price,st:p.price==='$0'?'Free':'Paid'}]};
}
window.Viddora.PLANS=PLANS;window.Viddora.exampleAccount=exampleAccount;window.Viddora.newAccount=newAccount;

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmtDate=d=>new Date(d+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
window.Viddora.fmtDate=fmtDate;
function toast(msg){let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';t.setAttribute('role','status');document.body.appendChild(t);}t.textContent=msg;t.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('on'),2600);}
window.Viddora.toast=toast;

/* ---------- nav: signed in or out ---------- */
/* first-timers see "Start free"; anyone who has signed in or up in this browser before sees "Sign in" */
const SEEN_KEY='viddora-returning';
const isReturning=()=>{try{return localStorage.getItem(SEEN_KEY)==='1';}catch(e){return false;}};
const markReturning=()=>{try{localStorage.setItem(SEEN_KEY,'1');}catch(e){}};
window.Viddora.markReturning=markReturning;
function paintNav(){
  const acc=Store.get();if(acc)markReturning();
  const back=isReturning();
  $$('[data-auth="new"]').forEach(e=>e.hidden=!!acc||back);
  $$('[data-auth="returning"]').forEach(e=>e.hidden=!!acc||!back);
  $$('[data-auth="in"]').forEach(e=>e.hidden=!acc);
  if(acc){$$('[data-credits]').forEach(e=>e.textContent=acc.credits);$$('[data-initial]').forEach(e=>e.textContent=(acc.name||'?').trim().charAt(0).toUpperCase());}
}
paintNav();window.Viddora.paintNav=paintNav;


/* ---------- nav: mobile menu, scrolled state ---------- */
const header=$('header.nav'),cta=$('.nav-cta');
if(header&&cta){
  const mb=document.createElement('button');mb.type='button';mb.className='icon-btn menu-btn';mb.setAttribute('aria-expanded','false');mb.setAttribute('aria-controls','mnav');mb.setAttribute('aria-label','Open menu');
  mb.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path class="l1" d="M4 7h16"/><path class="l2" d="M4 12h16"/><path class="l3" d="M4 17h16"/></svg>';
  cta.appendChild(mb);
  const mn=document.createElement('nav');mn.id='mnav';mn.className='mnav';mn.setAttribute('aria-label','Menu');mn.hidden=true;
  const links=$('.links',header);
  mn.innerHTML='<div class="wrap">'+(links?links.innerHTML:'')+'<a class="btn btn-primary" data-auth="new" href="signup.html">Start free</a><a class="btn btn-primary" data-auth="returning" href="signin.html">Sign in</a><a class="btn btn-primary" data-auth="in" href="account.html">My account</a></div>';
  header.appendChild(mn);
  const setMenu=open=>{mn.hidden=!open;mb.setAttribute('aria-expanded',String(open));mb.setAttribute('aria-label',open?'Close menu':'Open menu');header.classList.toggle('menu-open',open);};
  mb.addEventListener('click',()=>setMenu(mn.hidden));
  mn.addEventListener('click',e=>{if(e.target.closest('a'))setMenu(false);});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!mn.hidden){setMenu(false);mb.focus();}});
  matchMedia('(min-width:861px)').addEventListener('change',e=>{if(e.matches)setMenu(false);});
  const onScroll=()=>header.classList.toggle('scrolled',scrollY>8);addEventListener('scroll',onScroll,{passive:true});onScroll();
  paintNav();
}

/* ---------- gentle reveal on scroll ---------- */
if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  const els=$$('main .head, .scenes, .depth, .ex, .who > div, .teaser, .post, .cta, .pipe, .lost, .plan, .addon, .calc .tablewrap, .faq details');
  const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}}),{rootMargin:'0px 0px -8% 0px'});
  els.forEach((el,i)=>{const r=el.getBoundingClientRect();if(r.top<innerHeight)return;el.classList.add('reveal');el.style.transitionDelay=((i%4)*60)+'ms';io.observe(el);});
}

/* ---------- thumbnails ---------- */
const TH={
 kv:'<g transform="translate(40,62)">'+[0,1,2,3].map(i=>`<rect x="${i*58}" y="0" width="50" height="22" rx="6" fill="${i<3?'#6A45E0':'#3CC17E'}"/><rect x="${i*58}" y="32" width="50" height="22" rx="6" fill="${i<3?'#8F72F5':'#4FD18E'}"/>`).join('')+'</g>',
 tcp:'<g stroke-width="3"><line x1="80" y1="40" x2="80" y2="170" stroke="#3B2A7A"/><line x1="240" y1="40" x2="240" y2="170" stroke="#3B2A7A"/><path d="M80 70 L236 92" stroke="#3CC17E"/><path d="M240 110 L84 132" stroke="#8F72F5"/><path d="M80 150 L236 168" stroke="#F3F0FF"/></g>',
 navier:'<path d="M0 150 C60 120 100 175 160 145 S260 120 320 150 V200 H0Z" fill="#6A45E0" opacity=".55"/><path d="M0 165 C70 150 110 185 170 165 S270 150 320 168 V200 H0Z" fill="#3CC17E" opacity=".6"/><text x="160" y="90" text-anchor="middle" fill="#F3F0FF" font-family="Quicksand,sans-serif" font-weight="700" font-size="17">ρ(∂u/∂t + u·∇u) = −∇p + μ∇²u</text>',
 fractions:'<g transform="translate(90,100)"><circle r="44" fill="#2A1670"/><path d="M0 0 L0 -44 A44 44 0 0 1 0 44Z" fill="#8F72F5"/></g><text x="160" y="110" text-anchor="middle" fill="#F3F0FF" font-family="Quicksand,sans-serif" font-weight="700" font-size="28">+</text><g transform="translate(230,100)"><circle r="44" fill="#2A1670"/><path d="M0 0 L0 -44 A44 44 0 0 1 38.1 22Z" fill="#4FD18E"/></g>',
 sky:'<rect width="320" height="200" fill="#3B6FD8"/><rect y="100" width="320" height="100" fill="#7FA8EE"/><circle cx="64" cy="58" r="26" fill="#FFD66B"/><g stroke="#fff" stroke-width="2" stroke-dasharray="5 6"><path d="M94 62 L190 96"/><path d="M92 74 L188 120"/></g><g fill="#24124F"><circle cx="200" cy="100" r="5"/><circle cx="232" cy="128" r="5"/><circle cx="254" cy="88" r="5"/></g><path d="M0 178 Q160 150 320 178 V200 H0Z" fill="#24124F"/>',
 headphones:'<path d="M110 120 a50 50 0 0 1 100 0" fill="none" stroke="#8F72F5" stroke-width="10" stroke-linecap="round"/><rect x="96" y="112" width="26" height="46" rx="10" fill="#3CC17E"/><rect x="198" y="112" width="26" height="46" rx="10" fill="#3CC17E"/><path d="M20 70 q15 -20 30 0 t30 0 t30 0" fill="none" stroke="#C3B8EE" stroke-width="3"/><path d="M230 70 h70" stroke="#C3B8EE" stroke-width="3"/>',
 supply:'<g stroke-width="4" fill="none"><path d="M60 40 V170 H280" stroke="#3B2A7A"/><path d="M80 50 L260 160" stroke="#8F72F5"/><path d="M80 160 L260 50" stroke="#3CC17E"/></g><circle cx="170" cy="105" r="7" fill="#F3F0FF"/>',
 leaf:'<path d="M160 165 C90 150 80 70 160 40 C240 70 230 150 160 165Z" fill="#3CC17E"/><path d="M160 165 V60" stroke="#24124F" stroke-width="4"/><circle cx="262" cy="46" r="22" fill="#FFD66B"/><g stroke="#FFD66B" stroke-width="3" stroke-dasharray="4 6"><path d="M240 60 L200 90"/><path d="M246 70 L210 108"/></g>',
 seasons:'<circle cx="160" cy="100" r="22" fill="#FFD66B"/><ellipse cx="160" cy="100" rx="120" ry="50" fill="none" stroke="#3B2A7A" stroke-width="3"/><circle cx="40" cy="100" r="12" fill="#3CC17E"/><circle cx="280" cy="100" r="12" fill="#8F72F5"/>'
};
function thumbSVG(k){return `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="320" height="200" fill="#24124F"/>${TH[k]||TH.headphones}</svg>`;}
window.Viddora.thumbSVG=thumbSVG;
function guessKind(q){q=q.toLowerCase();return /sky|blue|light/.test(q)?'sky':/tcp|network|handshake|internet/.test(q)?'tcp':/cache|token|llm|model/.test(q)?'kv':/fraction|½|⅓|math/.test(q)?'fractions':/price|demand|supply|econom/.test(q)?'supply':/plant|leaf|photo/.test(q)?'leaf':/season|earth|orbit/.test(q)?'seasons':/fluid|flow|navier/.test(q)?'navier':'headphones';}

/* ---------- ask box (home + how it works) ---------- */
const form=$('#ask');
if(form){
  const seg=$('#depthSeg');let depth='Intuitive',len=2;
  seg&&seg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;depth=b.dataset.v;$$('button',seg).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
  const lseg=$('#lenSeg');
  lseg&&lseg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;len=+b.dataset.v;$$('button',lseg).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
  const q=$('#q'),build=$('#build'),err=$('#err'),ready=$('#ready');
  $$('.chip').forEach(c=>c.addEventListener('click',()=>{q.value=c.textContent;q.focus();}));
  addEventListener('keydown',e=>{if(e.key==='/'&&!e.metaKey&&!e.ctrlKey&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();q.focus();q.select();}});
  const go=$('button[type=submit]',form);
  let timers=[];
  form.addEventListener('submit',e=>{
    e.preventDefault();const v=q.value.trim();const acc=Store.get();
    if(v.split(/\s+/).filter(Boolean).length<2){err.textContent='Type a question of at least two words, for example “Why is the sky blue?”';err.hidden=false;q.focus();return;}
    if(acc&&acc.credits<len){err.innerHTML=`This lesson needs ${len} credits and you have ${acc.credits}. <a class="muted-link" href="pricing.html">Add credits</a>`;err.hidden=false;return;}
    err.hidden=true;timers.forEach(clearTimeout);timers=[];
    go.disabled=true;go.classList.add('busy');
    const steps=$$('.bstep',build);steps.forEach(s=>s.className='bstep');ready.classList.remove('on');build.classList.add('on');
    const d=[700,500,1600,900];let t=0;
    steps.forEach((s,i)=>{timers.push(setTimeout(()=>{if(i)steps[i-1].className='bstep done';s.className='bstep doing';},t));t+=d[i];});
    timers.push(setTimeout(()=>{
      steps[3].className='bstep done';go.disabled=false;go.classList.remove('busy');
      const a=Store.get();
      if(a){a.lessons.unshift({id:'n'+Date.now(),t:v.charAt(0).toUpperCase()+v.slice(1),d:depth,m:len,date:'2026-10-09',s:'ready',k:guessKind(v)});a.credits-=len;a.spent+=len;Store.set(a);paintNav();
        $('#readyText').textContent=`Ready · ${len} credits used · ${a.credits} left`;$('#readyLink').textContent='Open in My account';$('#readyLink').href='account.html';}
      else{$('#readyText').textContent=`“${v}” is ready · ${depth}`;const back=isReturning();$('#readyLink').textContent=back?'Sign in to watch':'Create a free account to watch';$('#readyLink').href=back?'signin.html':'signup.html';}
      ready.classList.add('on');window.dispatchEvent(new Event('lessonready'));
    },t));
  });
  const f2=$('#ask2');
  f2&&f2.addEventListener('submit',e=>{e.preventDefault();q.value=$('#q2').value.trim()||'Why do we have seasons?';$('#top').scrollIntoView();setTimeout(()=>form.requestSubmit(),350);});
}

/* ---------- scene demo ---------- */
const list=$('#sceneList');
if(list){
  const caps=['An engine roars. You switch on your headphones. How does the noise disappear?','Sound is a wave of pressure. The engine sends a steady ripple of highs and lows to your ear.','A tiny microphone hears that wave, and the speaker plays its exact opposite: every high meets a low.','High plus low is zero. The two waves cancel, and the roar goes quiet.'];
  let scene=0;
  const setScene=i=>{scene=i;$$('button',list).forEach((b,j)=>b.setAttribute('aria-selected',String(j===i)));$('#cap').textContent=caps[i];$('#sceneNo').textContent='Scene '+(i+1)+' of 4';$('#trk').style.width=((i+1)*25)+'%';};
  list.addEventListener('click',e=>{const b=e.target.closest('button');if(b)setScene(+b.dataset.i);});
  list.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const n=(scene+(e.key==='ArrowDown'?1:3))%4;setScene(n);$$('button',list)[n].focus();}});
  const cv=$('#waves'),cx=cv.getContext('2d');const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function draw(t){
    const w=cv.clientWidth,h=cv.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
    if(!w||!h)return; if(cv.width!==Math.round(w*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);}
    cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,w,h);
    const mid=h*.55,amp=Math.min(48,h*.18),k=2*Math.PI/Math.max(160,w/3.2),ph=t*0.0025;
    const wave=(col,sign,lw,a=1)=>{cx.beginPath();for(let x=0;x<=w;x+=3){const y=mid+sign*a*amp*Math.sin(k*x-ph);x?cx.lineTo(x,y):cx.moveTo(x,y);}cx.strokeStyle=col;cx.lineWidth=lw;cx.lineCap='round';cx.stroke();};
    cx.font='700 13px Nunito,sans-serif';
    if(scene===0){
      cx.fillStyle='#2A1670';cx.beginPath();cx.roundRect(28,mid-40,90,80,16);cx.fill();
      cx.fillStyle='#8F72F5';for(let i=0;i<3;i++)cx.fillRect(40+i*26,mid-26,16,52);
      for(let r=1;r<=4;r++){cx.beginPath();cx.arc(120,mid,((r*40+t*0.06)%170),-0.5,0.5);cx.strokeStyle='rgba(143,114,245,'+(0.8-r*.15)+')';cx.lineWidth=3;cx.stroke();}
      cx.fillStyle='#4FD18E';cx.beginPath();cx.arc(w-80,mid,30,0,7);cx.fill();cx.fillStyle='#24124F';cx.beginPath();cx.arc(w-80,mid,12,0,7);cx.fill();
      cx.fillStyle='#C3B8EE';cx.fillText('engine',40,mid+62);cx.fillText('your ear',w-108,mid+50);
    }else{
      cx.fillStyle='#C3B8EE';
      if(scene>=1){wave('#8F72F5',1,4);cx.fillText('engine noise',18,mid-amp-14);}
      if(scene>=2){wave('#4FD18E',-1,4);cx.fillStyle='#4FD18E';cx.fillText('anti-noise',18,mid+amp+24);}
      if(scene===3){cx.fillStyle='rgba(10,4,30,.55)';cx.fillRect(0,0,w,h);wave('#F3F0FF',1,4,0.04);cx.fillStyle='#F3F0FF';cx.font='700 15px Quicksand,sans-serif';cx.fillText('high + low = silence',18,mid-18);}
    }
  }
  const loop=t=>{draw(reduce?0:t);if(!reduce)requestAnimationFrame(loop);};requestAnimationFrame(loop);
  addEventListener('resize',()=>draw(0));
}

/* ---------- I'm lost here ---------- */
const lb=$('#lostBtn');
if(lb){
  const ans=$('#answer');
  const answers=['Each new word only needs its own key and value. The old ones are saved, so the model adds one row instead of redoing the whole table.','Like keeping your notes from earlier in a lecture: when the next slide comes, you add one line instead of rewriting every page.','First: a key says what a word is about, and a value is what it contributes. The cache stores both for every word so far.'];
  lb.addEventListener('click',()=>{const on=!ans.classList.contains('on');ans.classList.toggle('on',on);lb.setAttribute('aria-expanded',String(on));});
  $('.opts',ans).addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('.opts button',ans).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#ansText').textContent=answers[+b.dataset.a];});
  addEventListener('keydown',e=>{if((e.key==='l'||e.key==='L')&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){ans.classList.add('on');lb.setAttribute('aria-expanded','true');}});
}

/* ---------- pricing audience toggle ---------- */
const aud=$('#aud');
if(aud){
  const show=v=>{$$('button',aud).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===v)));$$('[data-aud-panel]').forEach(p=>p.hidden=p.dataset.audPanel!==v);};
  aud.addEventListener('click',e=>{const b=e.target.closest('button');if(b)show(b.dataset.v);});
  if(location.hash==='#schools')show('schools');
}

/* ---------- forms: sign in / sign up ---------- */
function fieldErr(f,msg){f.toggleAttribute('data-invalid',!!msg);let e=$('.ferr',f);if(!e){e=document.createElement('span');e.className='ferr';f.appendChild(e);}e.textContent=msg||'';e.hidden=!msg;}
$$('.pw button').forEach(b=>b.addEventListener('click',()=>{const i=b.parentElement.querySelector('input');const show=i.type==='password';i.type=show?'text':'password';b.textContent=show?'Hide':'Show';b.setAttribute('aria-pressed',String(show));}));
const emailOk=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const si=$('#signinForm');
if(si){
  si.addEventListener('submit',e=>{e.preventDefault();
    const em=$('#si-email'),pw=$('#si-pass');let ok=true;
    fieldErr(em.closest('.field'),emailOk(em.value.trim())?'':'Enter your email address, like name@school.edu.');if(!emailOk(em.value.trim()))ok=false;
    fieldErr(pw.closest('.field'),pw.value.length>=8?'':'Your password has at least 8 characters.');if(pw.value.length<8)ok=false;
    if(!ok)return;
    const name=em.value.trim().split('@')[0].replace(/[._-]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    Store.set(exampleAccount(name,em.value.trim()));location.href='account.html';
  });
  const demo=$('#demoBtn');demo&&demo.addEventListener('click',()=>{Store.set(exampleAccount());location.href='account.html';});
}
const su=$('#signupForm');
if(su){
  const pw=$('#su-pass'),meter=$('#pwStrength'),hint=$('#pwHint');
  pw&&meter&&pw.addEventListener('input',()=>{const v=pw.value;let sc=0;if(v.length>=8)sc++;if(v.length>=12)sc++;if(/[A-Z]/.test(v)&&/[a-z]/.test(v))sc++;if(/\d/.test(v)&&/[^A-Za-z0-9]/.test(v))sc++;if(v.length<8)sc=Math.min(sc,1);
    meter.dataset.s=v?sc:'';hint.textContent=!v?'At least 8 characters.':v.length<8?`${8-v.length} more character${8-v.length===1?'':'s'} to go.`:['Okay','Okay','Good','Strong','Very strong'][sc]+' password.';});
  const h=location.hash.replace('#','');if(PLANS[h]){const r=$(`input[name=plan][value=${h}]`);if(r)r.checked=true;}
  su.addEventListener('submit',e=>{e.preventDefault();
    const nm=$('#su-name'),em=$('#su-email'),pw=$('#su-pass'),tc=$('#su-terms');let ok=true;
    const chk=(el,cond,msg)=>{fieldErr(el.closest('.field'),cond?'':msg);if(!cond)ok=false;};
    chk(nm,nm.value.trim().length>0,'Enter your name.');
    chk(em,emailOk(em.value.trim()),'Enter your email address, like name@school.edu.');
    chk(pw,pw.value.length>=8,'Use at least 8 characters.');
    chk(tc,tc.checked,'Agree to the terms to create your account.');
    if(!ok)return;
    const plan=($('input[name=plan]:checked')||{}).value||'free';
    Store.set(newAccount(nm.value.trim(),em.value.trim(),plan));location.href='account.html';
  });
}
$$('[data-signout]').forEach(b=>b.addEventListener('click',()=>{Store.clear();location.href='index.html';}));
})();
