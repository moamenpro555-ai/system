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
 o.close=()=>{o.remove();o.onclosed&&o.onclosed()};o.onclick=e=>{if(e.target===o)o.close()};$('.x',o).onclick=o.close;document.body.append(o);return o}
async function run(fn){try{await fn()}catch(e){toast(e.message,true)}}
function shell(role,navHtml){$('#uname').textContent=(role==='teacher'?'أ. ':'')+Session.get().name;$('#nav').innerHTML=navHtml;
 $('#menu').onclick=()=>$('#side').classList.toggle('open')}
const stat=(l,n,s,c='')=>`<div class="card stat ${c}"><div class="l">${l}</div><div class="n">${n}</div><div class="s">${s}</div></div>`;

// ---- أدوات إضافية للميزات الأكاديمية ----
const ar=s=>String(s).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]);
const DOW=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'],DOW_ORDER=[6,0,1,2,3,4,5];
const dt=i=>i?new Date(i).toLocaleString('ar-EG',{timeZone:'Africa/Cairo',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):'—';
const egp=n=>nf(Math.round((+n||0)*100)/100)+' ج.م';
const monthNow=()=>todayISO().slice(0,7);
const monthName=m=>new Date(m+'-15T12:00:00').toLocaleDateString('ar-EG',{month:'long',year:'numeric'});
const sPill=(cls,label)=>`<span class="pill ${cls}">${label}</span>`;
const HW_STATUS={graded:['top','مُصحَّح'],submitted:['ok','مُسلَّم'],late:['watch','متأخر'],missing:['warn','لم يُسلَّم']};
const hwPill=x=>{const[c,l]=HW_STATUS[x.status];return sPill(c,l)+(x.status==='graded'&&x.late?' <span class="mut small">(بعد الموعد)</span>':'')};
const FEE_STATUS={paid:['top','مدفوع'],partial:['watch','جزئي'],unpaid:['warn','غير مدفوع'],none:['new','—']};
const feePill=s=>sPill(...FEE_STATUS[s]);
function wide(m,w=900){m.firstElementChild.style.maxWidth=w+'px';return m}
function ask(msg,okText='حذف'){return new Promise(res=>{
 const m=modal('تأكيد',`<p style="margin-bottom:18px">${esc(msg)}</p><div class="acts"><button class="btn red" id="ok">${esc(okText)}</button><button class="btn line" id="no">إلغاء</button></div>`);
 m.onclosed=()=>res(false);$('#ok',m).onclick=()=>{res(true);m.close()};$('#no',m).onclick=()=>m.close()})}
const groupOptions=(gs,sel,all='كل الطلاب')=>`<option value="">${all}</option>`+gs.map(g=>`<option value="${g.id}" ${String(sel)===String(g.id)?'selected':''}>${esc(g.name)}</option>`).join('');
