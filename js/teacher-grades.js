// الدرجات (نتائج نهائية بأوزان + ترتيب + سجل + إعدادات) + المصروفات
let gradeTab='final',finalGroup='',feeMonth=monthNow(),feeCache=[];
const KIND_LABEL={exam:'امتحان',quiz:'اختبار إلكتروني',homework:'واجب',other:'أخرى'};

async function gradesView(){
 const tabs=subtabs([['final','النتائج النهائية'],['log','سجل الدرجات'],['settings','الأوزان والإعدادات']],gradeTab,'setGradeTab');
 if(gradeTab==='log'){const[l,st]=await Promise.all([api('/t/grades'),api('/t/students')]);students=st;
  view(head2('الدرجات والنتائج','آخر الدرجات المسجّلة (الواجبات والاختبارات الإلكترونية تُضاف تلقائياً)','<button class="btn" id="ag">+ إضافة درجة</button>')+tabs+
  `<div class="card scroll"><table><tr><th>الطالب</th><th>الاختبار / الواجب</th><th>النوع</th><th>الدرجة</th><th>النسبة</th><th>التاريخ</th></tr>${l.map(g=>`<tr><td>${esc(g.student)}</td><td>${esc(g.title)}</td><td class="mut small">${KIND_LABEL[g.kind]||''}</td><td>${nf(g.score)} / ${nf(g.max_score)}</td><td>${pct(Math.round(100*g.score/g.max_score))}</td><td class="mut small">${dateAr(g.date)}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">لا توجد درجات بعد</td></tr>'}</table></div>`);
  $('#ag').onclick=addGrade;return}
 if(gradeTab==='settings'){const s=await api('/t/settings/grading'),w=s.weights;
  view(head2('الدرجات والنتائج','حدّد وزن كل نوع في الدرجة النهائية')+tabs+`<div class="card"><form class="form" id="wf"><div class="hint">الدرجة النهائية = متوسط مرجّح لـ: الامتحانات، الاختبارات الإلكترونية، الواجبات، ونسبة الحضور. لو لا توجد درجات من نوع معيّن للطالب يُوزَّع وزنه على الباقي. مجموع الأوزان يجب أن يساوي ١٠٠.</div>
   <div class="wgrid">${[['exam','الامتحانات'],['quiz','الاختبارات الإلكترونية'],['homework','الواجبات'],['attendance','الحضور']].map(([k,t])=>`<label>${t} ٪<input type="number" name="${k}" min="0" max="100" step="1" value="${w[k]}" required></label>`).join('')}</div>
   <div id="wsum" class="mut"></div>
   <label style="display:flex;gap:10px;align-items:center;font-weight:600"><input type="checkbox" name="honor" style="width:auto;accent-color:var(--teal)" ${s.honor_board?'checked':''}>إظهار ترتيب المجموعة ولوحة الشرف للطلاب (يظهر أول ٥ بالاسم الأول فقط)</label>
   <button class="btn" style="justify-self:start">حفظ</button></form></div>`);
  const upd=()=>{const t=['exam','quiz','homework','attendance'].reduce((x,k)=>x+(+$(`[name=${k}]`).value||0),0);$('#wsum').textContent='المجموع: '+nf(t)+(t===100?' ✓':' — يجب أن يكون ١٠٠');$('#wsum').style.color=t===100?'var(--green)':'var(--red)'};
  $$('#wf input[type=number]').forEach(i=>i.oninput=upd);upd();
  $('#wf').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);
   run(async()=>{await api('/t/settings/grading','PUT',{weights:Object.fromEntries(['exam','quiz','homework','attendance'].map(k=>[k,+f.get(k)])),honor_board:f.get('honor')==='on'});toast('تم حفظ الإعدادات')})};return}
 // النتائج النهائية
 const[all,gs]=await Promise.all([api('/t/grades/final'),api('/t/groups')]);
 if(finalGroup&&!gs.some(g=>String(g.id)===String(finalGroup)))finalGroup='';
 const list=all.filter(x=>!finalGroup||String(x.group_id)===String(finalGroup)).sort((a,b)=>(a.gname||'￿').localeCompare(b.gname||'￿','ar')||(a.rank??1e9)-(b.rank??1e9)||a.name.localeCompare(b.name,'ar'));
 const rk=r=>r==null?'—':`<span class="rank ${r<=3?'r'+r:''}">${nf(r)}</span>`;
 view(head2('الدرجات والنتائج','الدرجة النهائية والتقدير وترتيب كل طالب داخل مجموعته',`<select id="fg" style="width:auto"><option value="">كل المجموعات</option>${gs.map(g=>`<option value="${g.id}" ${String(g.id)===String(finalGroup)?'selected':''}>${esc(g.name)}</option>`).join('')}</select>`)+tabs+
  `<div class="card scroll"><table><tr><th>الترتيب</th><th>الطالب</th><th>المجموعة</th><th>الامتحانات</th><th>الاختبارات</th><th>الواجبات</th><th>الحضور</th><th>النهائية</th><th>التقدير</th></tr>${list.map(x=>`<tr><td>${rk(x.rank)}</td><td><b>${esc(x.name)}</b></td><td>${esc(x.gname)||'—'}</td><td>${pct(x.exam)}</td><td>${pct(x.quiz)}</td><td>${pct(x.homework)}</td><td>${pct(x.attendance)}</td><td class="final">${pct(x.final)}</td><td>${x.letter?sPill(x.final>=80?'top':x.final>=65?'ok':x.final>=50?'watch':'warn',x.letter):'—'}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">لا توجد بيانات بعد</td></tr>'}</table></div>`);
 $('#fg').onchange=e=>{finalGroup=e.target.value;gradesView()}}
V.grades=gradesView;
const setGradeTab=t=>{gradeTab=t;run(gradesView)};
function addGrade(){if(!students.length)return toast('أضف طلاباً أولاً',true);
 const m=modal('إضافة درجة',`<form class="form"><label>الطالب<select name="student_id">${students.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></label><label>الاختبار / الواجب<input name="title" required></label>
 <label>النوع<select name="kind"><option value="exam">امتحان</option><option value="quiz">اختبار قصير</option><option value="homework">واجب</option><option value="other">أخرى</option></select></label>
 <div class="row2"><label>الدرجة<input name="score" type="number" step="any" min="0" required></label><label>من<input name="max_score" type="number" step="any" min="1" required></label></div><button class="btn">حفظ</button></form>`);
 $('form',m).onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));run(async()=>{await api('/t/grades','POST',{...f,student_id:+f.student_id,score:+f.score,max_score:+f.max_score});m.close();toast('تم حفظ الدرجة');gradesView()})}}

// ================= المصروفات =================
async function feesView(){feeCache=await api('/t/fees?month='+feeMonth);
 const withFee=feeCache.filter(f=>f.month_due>0),exp=withFee.reduce((x,f)=>x+f.month_due,0),got=feeCache.reduce((x,f)=>x+f.paid_month,0),late=feeCache.filter(f=>f.overdue>0);
 view(head2('المصروفات','تتبّع ما دفعه كل طالب والمتأخر عليه',`<input type="month" id="fm" value="${feeMonth}" style="width:auto">`)+
 `<div class="stats">${stat('المطلوب هذا الشهر',egp(exp),`${nf(withFee.length)} طالب`)}${stat('المُحصَّل',egp(got),monthName(feeMonth),'g')}${stat('غير مدفوع',nf(withFee.filter(f=>f.status==='unpaid').length),'لم يدفعوا هذا الشهر','r')}${stat('متأخرون من شهور سابقة',nf(late.length),egp(late.reduce((x,f)=>x+f.overdue,0)),'r')}</div>
 <div class="card scroll"><table><tr><th>الطالب</th><th>المجموعة</th><th>المصروف الشهري</th><th>المدفوع هذا الشهر</th><th>الحالة</th><th>المتبقي الإجمالي</th><th></th></tr>${feeCache.map(f=>`<tr><td><b>${esc(f.name)}</b></td><td>${esc(f.gname)||'—'}</td><td>${f.fee?egp(f.fee):'<span class="mut small">غير محدد</span>'}</td><td>${f.month_due?egp(f.paid_month):'—'}</td><td>${feePill(f.status)}${f.overdue>0?' <span class="pill warn">متأخر</span>':''}</td><td>${f.fee?egp(f.outstanding):'—'}</td>
 <td style="white-space:nowrap"><button class="btn sm" onclick="addPayment(${f.id})">+ دفعة</button> <button class="btn sm line" onclick="feeDetail(${f.id})">السجل</button></td></tr>`).join('')||'<tr><td colspan="7" class="empty">أضف طلاباً أولاً</td></tr>'}</table></div>`);
 $('#fm').onchange=e=>{if(e.target.value){feeMonth=e.target.value;feesView()}}}
V.fees=feesView;
function addPayment(sid){const f=feeCache.find(x=>x.id===sid);if(!f.fee)return setFee(sid);
 const rest=Math.max(0,f.month_due-f.paid_month);
 const m=modal('تسجيل دفعة - '+esc(f.name),`<form class="form"><div class="row2"><label>المبلغ (ج.م)<input name="amount" type="number" min="0.01" step="any" required value="${rest||f.fee}"></label><label>عن شهر<input name="month" type="month" required value="${feeMonth}"></label></div><label>ملاحظة (اختياري)<input name="note" maxlength="200"></label><button class="btn">حفظ الدفعة</button></form>`);
 $('form',m).onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));run(async()=>{await api('/t/payments','POST',{student_id:sid,amount:+d.amount,month:d.month,note:d.note});m.close();toast('تم تسجيل الدفعة');feesView()})}}
function setFee(sid){const f=feeCache.find(x=>x.id===sid);
 const m=modal('المصروف الشهري - '+esc(f.name),`<form class="form"><label>المصروف الشهري (ج.م)<input name="monthly_fee" type="number" min="0" step="any" required value="${f.fee||''}"></label><label>يبدأ احتساب المصروف من شهر<input name="fee_from" type="month" required value="${f.fee_from||monthNow()}"></label><button class="btn">حفظ</button></form>`);
 $('form',m).onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));run(async()=>{await api('/t/students/'+sid,'PATCH',{monthly_fee:+d.monthly_fee,fee_from:d.fee_from});m.close();toast('تم الحفظ');feesView()})}}
async function feeDetail(sid){const f=await api('/t/fees/'+sid);
 const m=modal('سجل مدفوعات - '+esc(f.name),`<div class="chips"><div class="chip">المصروف الشهري<b>${f.fee?egp(f.fee):'—'}</b></div><div class="chip">إجمالي المدفوع<b>${egp(f.paid_total)}</b></div><div class="chip">المتبقي<b>${egp(f.outstanding)}</b></div></div>
 <button class="btn sm line" id="sf" style="margin-bottom:12px">تعديل المصروف الشهري</button>
 <table class="mini"><tr><th>التاريخ</th><th>عن شهر</th><th>المبلغ</th><th>ملاحظة</th><th></th></tr>${f.payments.map(p=>`<tr><td>${dateAr(p.paid_on)}</td><td>${monthName(p.month)}</td><td><b>${egp(p.amount)}</b></td><td class="mut small">${esc(p.note)}</td><td><button class="btn sm red" data-p="${p.id}">حذف</button></td></tr>`).join('')||'<tr><td colspan="5" class="empty">لا توجد مدفوعات</td></tr>'}</table>`);
 $('#sf',m).onclick=()=>{m.close();setFee(sid)};
 $$('[data-p]',m).forEach(b=>b.onclick=async()=>{if(await ask('حذف هذه الدفعة؟'))run(async()=>{await api('/t/payments/'+b.dataset.p,'DELETE');m.close();toast('تم الحذف');feesView();feeDetail(sid)})})}
