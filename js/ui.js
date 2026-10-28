const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=n=>n==null?'—':Number(n).toLocaleString('ar-EG');
const pct=n=>n==null?'—':nf(n)+'٪';
const todayISO=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Africa/Cairo'});
const dayName=d=>new Date(d+'T12:00:00').toLocaleDateString('ar-EG',{weekday:'long'});
const dateAr=d=>new Date(d+'T12:00:00').toLocaleDateString('ar-EG',{day:'numeric',month:'short'});
const pill=s=>`<span class="pill ${s.key}">${s.label}</span>`;
function toast(msg,err){const t=document.createElement('div');t.className='toast'+(err?' err':'');t.textContent=msg;document.body.append(t);setTimeout(()=>t.remove(),2600)}
function modal(title,html){const o=document.createElement('div');o.className='overlay';
 o.innerHTML=`<div class="modal"><div class="mh"><h3>${title}</h3><button class="x" aria-label="إغلاق">×</button></div><div class="mb">${html}</div></div>`;
 o.close=()=>o.remove();o.onclick=e=>{if(e.target===o)o.close()};$('.x',o).onclick=o.close;document.body.append(o);return o}
async function run(fn){try{await fn()}catch(e){toast(e.message,true)}}
function shell(role,navHtml){$('#uname').textContent=(role==='teacher'?'أ. ':'')+Session.get().name;$('#nav').innerHTML=navHtml;
 $('#menu').onclick=()=>$('#side').classList.toggle('open')}
const stat=(l,n,s,c='')=>`<div class="card stat ${c}"><div class="l">${l}</div><div class="n">${n}</div><div class="s">${s}</div></div>`;
