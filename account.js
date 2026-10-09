(function(){
const V=window.Viddora,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const root=$('#acct');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const DCOL={'Intuitive':'var(--mint)','Standard':'#9B83F2','Deep dive':'var(--violet)'};
let filter='All',query='',tab='lessons';

function render(){
  const a=V.Store.get();
  if(!a){root.innerHTML=`<div class="empty" style="margin-top:48px"><h3>Sign in to see your account</h3><p>Your lessons, credits and plan live here once you sign in.</p><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><a class="btn btn-primary" href="signin.html">Sign in</a><button class="btn btn-ghost" type="button" id="seeDemo">See an example account</button></div></div>`;
    $('#seeDemo').onclick=()=>{V.Store.set(V.exampleAccount());V.paintNav();render();};return;}
  const p=V.PLANS[a.plan]||V.PLANS.free;
  const ready=a.lessons.filter(l=>l.s==='ready');
  const by={'Intuitive':0,'Standard':0,'Deep dive':0};ready.forEach(l=>by[l.d]+=l.m);
  const pct=Math.max(0,Math.min(1,a.credits/a.allowance));const C=2*Math.PI*44;
  const counts={All:a.lessons.length};['Intuitive','Standard','Deep dive'].forEach(d=>counts[d]=a.lessons.filter(l=>l.d===d).length);
  root.innerHTML=`
  <div class="acct-head">
    <div style="display:flex;flex-direction:column;gap:6px"><span class="kicker">My account</span><h1>Hi, ${esc(a.name.split(' ')[0])}.</h1><p>${esc(a.email)}${a.example?' · example data':''}</p></div>
    <a class="btn btn-primary" href="index.html#top">Make a new lesson</a>
  </div>
  <div class="stats">
    <section class="stat" aria-labelledby="s1"><h2 id="s1">Credits left</h2>
      <div class="gauge"><svg width="108" height="108" viewBox="0 0 108 108" role="img" aria-label="${a.credits} of ${a.allowance} credits left"><circle cx="54" cy="54" r="44" fill="none" stroke="var(--lav)" stroke-width="12"/><circle cx="54" cy="54" r="44" fill="none" stroke="var(--mint)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(C*pct).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 54 54)"/><text x="54" y="60" text-anchor="middle" font-family="Quicksand,sans-serif" font-weight="700" font-size="20" fill="var(--ink)">${Math.round(pct*100)}%</text></svg>
      <div><div class="big">${a.credits}<small> / ${a.allowance}</small></div><div class="meta">1 credit = 1 minute of video</div></div></div>
      <div class="meta">${a.plan==='study'?'Pack credits valid until '+V.fmtDate(a.renews):'Refills to '+a.allowance+' on '+V.fmtDate(a.renews)}</div>
    </section>
    <section class="stat" aria-labelledby="s2"><h2 id="s2">Credits spent this period</h2>
      <div class="big">${a.spent}<small> credits</small></div>
      <div class="split" aria-hidden="true">${['Intuitive','Standard','Deep dive'].map(d=>by[d]?`<i style="flex:${by[d]};background:${DCOL[d]}"></i>`:'').join('')||'<i style="flex:1;background:var(--lav)"></i>'}</div>
      <div class="legend-row">${['Intuitive','Standard','Deep dive'].map(d=>`<span><i style="background:${DCOL[d]}"></i>${d} ${by[d]}</span>`).join('')}</div>
      <div class="meta">${ready.length} lesson${ready.length===1?'':'s'} since ${V.fmtDate(a.cycleStart)}${a.lessons.some(l=>l.s==='failed')?' · failed renders are refunded':''}</div>
    </section>
    <section class="stat plan-stat" aria-labelledby="s3"><h2 id="s3">Your plan</h2>
      <div class="big">${p.name}</div>
      <div class="meta">${p.price} ${p.per} · ${p.note}</div>
      <div class="actions"><button class="btn btn-light btn-sm" type="button" data-go="plan">Change plan</button><a class="btn btn-outline-light btn-sm" href="pricing.html">Buy more credits</a></div>
    </section>
  </div>
  <div class="tabs" role="tablist" aria-label="Account">
    ${[['lessons','My lessons',a.lessons.length],['credits','Credit history'],['plan','Plan and billing'],['profile','Profile']].map(([k,l,c])=>`<button role="tab" id="t-${k}" aria-controls="p-${k}" aria-selected="${tab===k}" data-tab="${k}">${l}${c!=null?`<span class="count">${c}</span>`:''}</button>`).join('')}
  </div>
  <div class="panel" role="tabpanel" id="p-${tab}" aria-labelledby="t-${tab}">${panel(a,p,counts)}</div>`;
  wire(a);
}

function panel(a,p,counts){
  if(tab==='lessons'){
    if(!a.lessons.length)return `<div class="empty"><h3>No lessons yet</h3><p>Ask your first question and it will appear here, ready to watch, download or share.</p><a class="btn btn-primary" href="index.html#top">Make your first lesson</a></div>`;
    const list=a.lessons.filter(l=>(filter==='All'||l.d===filter)&&l.t.toLowerCase().includes(query.toLowerCase()));
    return `<div class="toolbar"><div class="seg" role="group" aria-label="Filter by depth" id="fseg">${['All','Intuitive','Standard','Deep dive'].map(d=>`<button type="button" aria-pressed="${filter===d}" data-f="${d}">${d} ${counts[d]}</button>`).join('')}</div>
      <div class="field"><label class="sr" for="lsearch">Search lessons</label><input type="search" id="lsearch" placeholder="Search your lessons" value="${esc(query)}"></div></div>
      ${list.length?`<div class="lgrid">${list.map(l=>`<button class="lcard" type="button" data-open="${l.id}"><div class="thumb">${V.thumbSVG(l.k)}<span class="len">${l.m}:00</span><span class="state">${l.s==='failed'?'<span class="badge fail">Failed · refunded</span>':l.clip?'<span class="badge clip">Follow-up clip</span>':''}</span></div><h3>${esc(l.t)}</h3><span class="info"><span class="dtag">${l.d}</span>${V.fmtDate(l.date)} · ${l.s==='failed'?'0 credits':l.m+' credit'+(l.m>1?'s':'')}</span></button>`).join('')}</div>`
      :`<div class="empty"><h3>No lessons match</h3><p>Try another word or show all depths.</p></div>`}`;
  }
  if(tab==='credits'){
    const rows=[];
    a.lessons.forEach(l=>rows.push({date:l.date,what:l.t+(l.clip?' (follow-up clip)':''),d:l.d,c:l.s==='failed'?0:-l.m,note:l.s==='failed'?'Render failed, refunded':''}));
    rows.push({date:a.cycleStart,what:(V.PLANS[a.plan]||{}).name+' credits added',d:'',c:a.allowance,note:''});
    let bal=a.credits;const out=rows.map(r=>{const row={...r,bal};bal-=r.c;return row;});
    return `<div class="tablewrap"><table class="hist"><caption class="sr">Credit history, newest first</caption><thead><tr><th>Date</th><th>What</th><th>Depth</th><th class="num">Credits</th><th class="num">Balance</th></tr></thead><tbody>
      ${out.map(r=>`<tr><td>${V.fmtDate(r.date)}</td><td>${esc(r.what)}${r.note?`<br><small style="color:var(--muted);font-weight:700">${r.note}</small>`:''}</td><td>${r.d||'—'}</td><td class="num ${r.c>0?'plus':r.c<0?'minus':'zero'}">${r.c>0?'+'+r.c:r.c===0?'0':'−'+(-r.c)}</td><td class="num">${r.bal}</td></tr>`).join('')}
      </tbody></table></div>`;
  }
  if(tab==='plan'){
    const opts=Object.entries(V.PLANS).filter(([k])=>k!==a.plan&&k!=='free');
    return `<div class="billing"><div class="card"><h3>${p.name}</h3><dl class="kv"><dt>Price</dt><dd>${p.price} ${p.per}</dd><dt>Credits</dt><dd>${a.allowance} ${a.plan==='study'?'one-time':'per month'}</dd><dt>${a.plan==='study'?'Valid until':'Renews'}</dt><dd>${V.fmtDate(a.renews)}</dd><dt>Payment</dt><dd>Visa ending 4242</dd></dl>
      <div class="switch-opts">${opts.map(([k,o])=>`<div class="opt"><div><b>${o.name}</b> · ${o.price} ${o.per}<p>${o.note}</p></div><button class="btn btn-ghost btn-sm" type="button" data-switch="${k}">${k==='study'?'Buy pack':'Switch'}</button></div>`).join('')}</div>
      ${a.plan!=='free'&&a.plan!=='study'?`<button class="btn btn-ghost btn-sm" type="button" id="cancelBtn" style="align-self:flex-start">Cancel plan</button><div class="confirm" id="confirm"><b>Cancel your ${p.name} plan?</b><span>You keep your ${a.credits} credits until ${V.fmtDate(a.renews)}. After that, no more credits are added.</span><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary btn-sm" type="button" id="cancelYes">Cancel plan</button><button class="btn btn-ghost btn-sm" type="button" id="cancelNo">Keep plan</button></div></div>`:''}
      </div>
      <div class="card"><h3>Invoices</h3><div class="tablewrap" style="border:0;padding:0"><table class="hist" style="min-width:0"><thead><tr><th>Date</th><th>Item</th><th class="num">Amount</th></tr></thead><tbody>${a.invoices.map(i=>`<tr><td>${V.fmtDate(i.date)}</td><td>${i.what}<br><small style="color:var(--muted);font-weight:700">${i.st}</small></td><td class="num">${i.amt}</td></tr>`).join('')}</tbody></table></div></div></div>`;
  }
  return `<div class="billing"><form class="card stack" id="profileForm" novalidate><h3>Profile</h3>
    <div class="field"><label for="pf-name">Name</label><input type="text" id="pf-name" value="${esc(a.name)}" autocomplete="name"></div>
    <div class="field"><label for="pf-email">Email</label><input type="email" id="pf-email" value="${esc(a.email)}" autocomplete="email"></div>
    <div class="field"><span class="legend">Default depth</span><div class="seg" role="group" aria-label="Default depth" id="pf-depth">${['Intuitive','Standard','Deep dive'].map(d=>`<button type="button" aria-pressed="${(a.depth||'Intuitive')===d}" data-v="${d}">${d}</button>`).join('')}</div></div>
    <button class="btn btn-primary" type="submit" style="align-self:flex-start">Save changes</button></form>
    <div class="card"><h3>Sign out</h3><p style="color:var(--sub)">You can sign back in any time. Your lessons stay in your account.</p><button class="btn btn-ghost" type="button" data-signout2>Sign out</button></div></div>`;
}

function wire(a){
  $$('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render();$('#t-'+tab).focus();});
  const tl=$('[role=tablist]');tl.onkeydown=e=>{const ks=['lessons','credits','plan','profile'];let i=ks.indexOf(tab);if(e.key==='ArrowRight')i=(i+1)%4;else if(e.key==='ArrowLeft')i=(i+3)%4;else return;e.preventDefault();tab=ks[i];render();$('#t-'+tab).focus();};
  $$('[data-go]').forEach(b=>b.onclick=()=>{tab=b.dataset.go;render();$('#t-'+tab).scrollIntoView({block:'center'});});
  const fs=$('#fseg');fs&&(fs.onclick=e=>{const b=e.target.closest('button');if(!b)return;filter=b.dataset.f;render();});
  const ls=$('#lsearch');ls&&(ls.oninput=()=>{query=ls.value;const pos=ls.selectionStart;render();const n=$('#lsearch');n.focus();n.setSelectionRange(pos,pos);});
  $$('[data-open]').forEach(b=>b.onclick=()=>openLesson(a.lessons.find(l=>l.id===b.dataset.open)));
  $$('[data-switch]').forEach(b=>b.onclick=()=>{const k=b.dataset.switch,o=V.PLANS[k];const x=V.Store.get();
    if(k==='study'){x.credits+=40;x.allowance=Math.max(x.allowance,x.credits);x.invoices.unshift({date:'2026-10-09',what:'Study Pack',amt:'$5.99',st:'Paid'});V.toast('Study Pack added: 40 credits');}
    else{x.plan=k;x.invoices.unshift({date:'2026-10-09',what:o.name+' plan',amt:o.price,st:'Paid'});V.toast('Switched to '+o.name);}
    V.Store.set(x);V.paintNav();render();});
  const cb=$('#cancelBtn');cb&&(cb.onclick=()=>{$('#confirm').classList.add('on');cb.hidden=true;});
  const cn=$('#cancelNo');cn&&(cn.onclick=()=>{$('#confirm').classList.remove('on');$('#cancelBtn').hidden=false;});
  const cy=$('#cancelYes');cy&&(cy.onclick=()=>{const x=V.Store.get();x.plan='free';V.Store.set(x);V.toast('Plan cancelled. Your credits stay until '+V.fmtDate(x.renews)+'.');render();});
  const pf=$('#profileForm');
  if(pf){const pd=$('#pf-depth');pd.onclick=e=>{const b=e.target.closest('button');if(!b)return;$$('button',pd).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));};
    pf.onsubmit=e=>{e.preventDefault();const x=V.Store.get();x.name=$('#pf-name').value.trim()||x.name;x.email=$('#pf-email').value.trim()||x.email;x.depth=($('button[aria-pressed=true]',pd)||{}).dataset?.v;V.Store.set(x);V.paintNav();V.toast('Changes saved');};}
  const so=$('[data-signout2]');so&&(so.onclick=()=>{V.Store.clear();location.href='index.html';});
}

const modal=$('#lessonModal');
function openLesson(l){
  if(!l)return;
  $('#mTitle').textContent=l.t;
  $('#mMeta').textContent=`${l.d} · ${l.m} min · ${V.fmtDate(l.date)}`+(l.s==='failed'?' · render failed, credits refunded':'');
  $('#mVid').innerHTML=V.thumbSVG(l.k)+(l.s==='failed'?'':'<button class="playbig" type="button" aria-label="Play lesson"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5z" fill="#6A45E0"/></svg></button>');
  $('#mActions').innerHTML=l.s==='failed'?'<button class="btn btn-primary btn-sm" type="button" data-retry>Try again</button>':'<button class="btn btn-primary btn-sm" type="button" data-dl>Download 1080p</button><button class="btn btn-ghost btn-sm" type="button" data-share>Copy share link</button>';
  modal.classList.add('on');$('#mClose').focus();
  const pb=$('.playbig',modal);pb&&(pb.onclick=()=>V.toast('Playback works in the full app'));
  const dl=$('[data-dl]',modal);dl&&(dl.onclick=()=>V.toast('Download starts in the full app'));
  const sh=$('[data-share]',modal);sh&&(sh.onclick=async()=>{try{await navigator.clipboard.writeText('https://viddora.com/l/'+l.id);V.toast('Share link copied');}catch(e){V.toast('viddora.com/l/'+l.id);}});
  const rt=$('[data-retry]',modal);rt&&(rt.onclick=()=>{location.href='index.html#top';});
}
$('#mClose').onclick=()=>modal.classList.remove('on');
modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('on');});
addEventListener('keydown',e=>{if(e.key==='Escape')modal.classList.remove('on');});
render();
})();
