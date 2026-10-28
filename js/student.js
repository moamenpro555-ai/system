const S=requireRole('student');
const NAV=[['home','صفحتي'],['homework','الواجبات'],['quizzes','الاختبارات'],['materials','المواد التعليمية']];
const V={home,homework:hwView,quizzes:quizzesView,materials:materialsView};
let qTimer=null;
shell('student','');
function go(){clearInterval(qTimer);const k=V[location.hash.slice(1)]?location.hash.slice(1):'home';
 $('#nav').innerHTML=NAV.map(([id,t])=>`<a href="#${id}" class="${id===k?'on':''}">${t}</a>`).join('');
 $('#side').classList.remove('open');run(V[k])}
addEventListener('hashchange',go);
const view=h=>$('#view').innerHTML=h;
const head2=(t,sub)=>`<div class="head"><div><h1>${t}</h1><p>${sub}</p></div></div>`;

async function home(){const[r,o]=await Promise.all([api('/me/report'),api('/me/overview')]);
 const p=r.attendance.filter(a=>a.status==='present').length,t=r.attendance.length;
 const sc=r.grades.reduce((x,g)=>x+ +g.score,0),mx=r.grades.reduce((x,g)=>x+ +g.max_score,0);
 const fee=o.fee,feeTxt=!fee?'':fee.status==='paid'?'مدفوع ✓':fee.status==='partial'?'دفعت جزءاً':fee.status==='unpaid'?'لم يُدفع بعد':'';
 view(`<div class="head"><div><h1>أهلاً ${esc(S.name.split(' ')[0])}</h1><p>${o.gname?`مجموعة ${esc(o.gname)} · `:''}ملخص حضورك ودرجاتك</p></div></div>
 <div class="card" style="margin-bottom:18px"><div class="ch"><h3>سجّل حضورك بالكود</h3></div><form id="cf" class="form" style="grid-template-columns:1fr auto;align-items:end"><label>الكود الذي يعطيه لك المعلم في الحصة<input name="code" inputmode="numeric" pattern="\\d{6}" maxlength="6" placeholder="٦ أرقام" dir="ltr" required style="font-size:20px;letter-spacing:6px;text-align:center"></label><button class="btn">تسجيل</button></form></div>
 <div class="stats">${stat('نسبة الحضور',pct(t?Math.round(100*p/t):null),`${nf(t)} يوم مسجّل`,'g')}${stat('متوسط الدرجات',pct(mx?Math.round(100*sc/mx):null),`${nf(r.grades.length)} درجة`)}
 ${stat('التقدير النهائي',o.final!=null?pct(Math.round(o.final)):'—',o.letter||'لا توجد درجات بعد')}${stat('أيام الغياب',nf(t-p),'غائب','r')}</div>
 <div class="grid2"><div class="card scroll"><h3>الدرجات</h3><table><tr><th>الاختبار</th><th>الدرجة</th><th>التاريخ</th></tr>${r.grades.map(g=>`<tr><td>${esc(g.title)}</td><td>${nf(g.score)} / ${nf(g.max_score)}</td><td class="mut small">${dateAr(g.date)}</td></tr>`).join('')||'<tr><td colspan="3" class="empty">لا توجد درجات بعد</td></tr>'}</table></div>
 <div class="col">
 ${o.honor&&o.board?`<div class="card"><h3>لوحة الشرف${o.rank?` · ترتيبك ${nf(o.rank)} من ${nf(o.groupSize)}`:''}</h3><div class="board">${o.board.map(b=>`<div class="b ${b.me?'me':''}"><span class="rank ${b.rank<=3?'r'+b.rank:''}">${nf(b.rank)}</span><span>${esc(b.name)}${b.me?' (أنت)':''}</span><b>${pct(Math.round(b.final))}</b></div>`).join('')||'<div class="mut">لا توجد نتائج بعد</div>'}</div></div>`:''}
 ${o.schedule.length?`<div class="card"><h3>مواعيد حصصك</h3>${[...o.schedule].sort((a,b)=>DOW_ORDER.indexOf(a.dow)-DOW_ORDER.indexOf(b.dow)).map(c=>`<div style="display:flex;justify-content:space-between;padding:4px 0"><b>${DOW[c.dow]}</b><span class="mut">${ar(c.start)} – ${ar(c.end)}</span></div>`).join('')}</div>`:''}
 ${fee?`<div class="card"><h3>المصروفات</h3><div style="display:flex;justify-content:space-between;padding:4px 0"><span>المصروف الشهري</span><b>${egp(fee.fee)}</b></div><div style="display:flex;justify-content:space-between;padding:4px 0"><span>هذا الشهر</span>${feePill(fee.status)}</div>${fee.outstanding>0?`<div style="display:flex;justify-content:space-between;padding:4px 0"><span>المتبقي الإجمالي</span><b style="color:var(--red)">${egp(fee.outstanding)}</b></div>`:`<div class="mut small">${feeTxt}</div>`}</div>`:''}
 <div class="card"><h3>ملاحظات المعلم</h3>${r.notes.map(n=>`<div class="note">${esc(n.text)} <span class="mut small">· ${dateAr(n.date)}</span></div>`).join('')||'<div class="mut">لا توجد ملاحظات</div>'}</div>
 <div class="card"><h3>آخر أيام الحضور</h3>${r.attendance.slice(0,8).map(a=>`<div style="display:flex;justify-content:space-between;padding:4px 0"><span>${dayName(a.date)} ${dateAr(a.date)}</span><span class="pill ${a.status==='present'?'top':'warn'}">${a.status==='present'?'حاضر':'غائب'}</span></div>`).join('')||'<div class="mut">لا يوجد سجل</div>'}</div></div></div>`);
 $('#cf').onsubmit=e=>{e.preventDefault();run(async()=>{await api('/me/checkin','POST',{code:new FormData(e.target).get('code')});toast('تم تسجيل حضورك ✓');home()})}}

// ================= الواجبات =================
let hwList=[];
async function hwView(){hwList=await api('/me/assignments');
 view(head2('الواجبات','سلّم واجباتك قبل الموعد وتابع درجاتك وتعليقات معلمك')+
 (hwList.length?hwList.map(a=>`<div class="card" style="margin-bottom:14px"><div class="ch"><h3>${esc(a.title)}</h3>${hwPill(a)}</div>
  <div class="mut small" style="margin-bottom:8px">موعد التسليم: ${dt(a.due_at)} · الدرجة الكاملة ${nf(a.max_score)}</div>
  ${a.description?`<div class="note" style="white-space:pre-wrap">${esc(a.description)}</div>`:''}
  ${a.submitted_at?`<div class="small mut">تم التسليم ${dt(a.submitted_at)}</div>${a.text?`<div class="sub-text">${esc(a.text)}</div>`:''}${a.link?`<a href="${esc(a.link)}" target="_blank" rel="noopener noreferrer">رابط التسليم ↗</a>`:''}`:''}
  ${a.score!=null?`<div class="chips" style="margin-top:10px"><div class="chip">درجتك<b>${nf(a.score)} / ${nf(a.max_score)}</b></div></div>${a.feedback?`<div class="note"><b>تعليق المعلم:</b> ${esc(a.feedback)}</div>`:''}`:`<div style="margin-top:12px"><button class="btn sm" onclick="submitHw(${a.id})">${a.submitted_at?'تعديل التسليم':'تسليم الواجب'}</button></div>`}</div>`).join(''):'<div class="card empty">لا توجد واجبات حالياً 🎉</div>'))}
function submitHw(id){const a=hwList.find(x=>x.id===id),m=modal('تسليم: '+esc(a.title),`<form class="form"><label>إجابتك<textarea name="text" maxlength="5000">${esc(a.text||'')}</textarea></label><label>أو رابط (Google Drive مثلاً)<input name="link" type="url" dir="ltr" placeholder="https://" value="${esc(a.link||'')}"></label><button class="btn">إرسال</button></form>`);
 $('form',m).onsubmit=e=>{e.preventDefault();run(async()=>{await api(`/me/assignments/${id}/submit`,'POST',Object.fromEntries(new FormData(e.target)));m.close();toast('تم تسليم الواجب ✓');hwView()})}}

// ================= الاختبارات =================
async function quizzesView(){const l=await api('/me/quizzes');
 view(head2('الاختبارات','اختبارات إلكترونية تُصحَّح تلقائياً، ولكل اختبار وقت محدد')+
 (l.length?`<div class="cards">${l.map(z=>{const done=!!z.submitted_at,prog=z.started_at&&!done;
  return`<div class="card"><div class="ch"><h3>${esc(z.title)}</h3>${done?sPill('top','تم'):prog?sPill('watch','جارٍ'):z.active?sPill('ok','متاح'):sPill('new','مغلق')}</div>
  <div class="mut small">${nf(z.qcount)} سؤال · ${nf(z.duration_min)} دقيقة</div>
  ${done?`<div class="chips" style="margin-top:12px"><div class="chip">نتيجتك<b>${nf(z.score)} / ${nf(z.total)}</b></div></div>`:(z.active||prog)?`<div style="margin-top:14px"><button class="btn sm" onclick="startQuiz(${z.id},${prog})">${prog?'متابعة الاختبار':'ابدأ الاختبار'}</button></div>`:''}</div>`}).join('')}</div>`:'<div class="card empty">لا توجد اختبارات حالياً</div>'))}
async function startQuiz(id,resume){
 if(!resume&&!await ask('بمجرد البدء يبدأ العد التنازلي ولا يمكن إيقافه. هل أنت جاهز؟','ابدأ الآن'))return;
 const d=await api(`/me/quizzes/${id}/start`,'POST'),ans={};let left=d.left,sent=false;
 view(`<div class="qbar"><b>${esc(d.title)}</b><span class="timer" id="qt"></span></div>
 ${d.questions.map((q,i)=>`<div class="card qcard"><h3>${nf(i+1)}. ${esc(q.text)}</h3>${q.options.map((o,j)=>`<label class="qopt"><input type="radio" name="q${q.id}" value="${j}"><span>${esc(o)}</span></label>`).join('')}</div>`).join('')}
 <button class="btn" id="qs" style="margin-bottom:30px">تسليم الاختبار</button>`);
 $$('.qopt input').forEach(i=>i.onchange=()=>{ans[i.name.slice(1)]=+i.value;$$('.qopt',i.closest('.card')).forEach(l=>l.classList.toggle('sel',l.contains(i)&&i.checked))});
 const finish=async auto=>{if(sent)return;
  if(!auto&&d.questions.some(q=>ans[q.id]==null)&&!await ask('بعض الأسئلة بلا إجابة. هل تريد التسليم؟','تسليم'))return;
  sent=true;clearInterval(qTimer);
  try{const r=await api(`/me/quizzes/${id}/submit`,'POST',{answers:ans});
   view(head2(auto?'انتهى الوقت':'تم التسليم','تم تصحيح إجاباتك تلقائياً')+`<div class="card" style="text-align:center;padding:40px"><div class="mut">نتيجتك</div><div class="big">${nf(r.score)} / ${nf(r.total)}</div><div class="mut" style="margin-bottom:18px">${pct(r.total?Math.round(100*r.score/r.total):0)}</div><button class="btn" onclick="go()">العودة للاختبارات</button></div>`)}
  catch(e){sent=false;toast(e.message,true)}};
 $('#qs').onclick=()=>finish(false);
 const tick=()=>{const e=$('#qt');if(!e){clearInterval(qTimer);return}
  e.textContent=ar(String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0'));e.classList.toggle('low',left<=60);
  if(left<=0){clearInterval(qTimer);finish(true);return}left--};
 tick();qTimer=setInterval(tick,1000)}

// ================= المواد =================
async function materialsView(){const l=await api('/me/materials'),K={link:['🔗','رابط'],video:['▶️','فيديو'],doc:['📄','ملف']};
 const by={};l.forEach(m=>(by[m.unit||'مواد عامة']??=[]).push(m));
 view(head2('المواد التعليمية','دروس وفيديوهات وملفات من معلمك')+
 (l.length?Object.entries(by).map(([u,items])=>`<div class="card" style="margin-bottom:14px"><h3>${esc(u)}</h3>${items.map(m=>`<div style="display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)"><span class="kind">${K[m.kind][0]}</span><div style="flex:1"><a href="${esc(m.url)}" target="_blank" rel="noopener noreferrer"><b>${esc(m.title)}</b></a>${m.description?`<div class="mut small">${esc(m.description)}</div>`:''}</div><span class="mut small">${K[m.kind][1]}</span></div>`).join('')}</div>`).join(''):'<div class="card empty">لم يضف معلمك مواد بعد</div>'))}
go();
