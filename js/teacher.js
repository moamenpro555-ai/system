const S=requireRole('teacher');
const NAV=[['dashboard','لوحة التحكم'],['students','الطلاب'],['groups','المجموعات والجدول'],['attendance','الحضور والغياب'],['homework','الواجبات'],['quizzes','الاختبارات'],['grades','الدرجات والنتائج'],['materials','المواد التعليمية'],['fees','المصروفات']];
const V={dashboard,students:studentsView}; // باقي الشاشات تُضاف من teacher-*.js
let students=[],filter='';
shell('teacher','');
const view=h=>{$('#view').innerHTML=h;const s=$('#search');if(s){s.oninput=e=>{filter=e.target.value;location.hash==='#students'?renderTable():(location.hash='#students')}}
 const a=$('#addS');if(a)a.onclick=()=>run(addStudent)};
const head=(t,sub)=>`<div class="head"><div><h1>${t}</h1><p>${sub}</p></div><div class="acts"><input id="search" class="search" placeholder="ابحث عن طالب أو اسم مستخدم" value="${esc(filter)}"><button class="btn" id="addS">+ إضافة طالب</button></div></div>`;
const head2=(t,sub,acts='')=>`<div class="head"><div><h1>${t}</h1><p>${sub}</p></div><div class="acts">${acts}</div></div>`;
const subtabs=(items,cur,fn)=>`<div class="subtabs">${items.map(([k,t])=>`<button class="${k===cur?'on':''}" onclick="${fn}('${k}')">${t}</button>`).join('')}</div>`;
function go(){const k=V[location.hash.slice(1)]?location.hash.slice(1):'dashboard';
 $('#nav').innerHTML=NAV.map(([id,t])=>`<a href="#${id}" class="${id===k?'on':''}">${t}</a>`).join('');
 $('#side').classList.remove('open');run(V[k])}

const rows=(list,full)=>list.length?list.map(s=>`<tr><td><b>${esc(s.name)}</b>${full?`<div class="mut small">${esc(s.username)}</div>`:''}</td><td>${esc(s.grp)||'—'}</td><td>${pct(s.att)}</td><td>${pct(s.avg)}</td><td>${pill(s.status)}</td>${full?`<td style="white-space:nowrap"><button class="btn sm line" onclick="reportOf(${s.id})">تقرير</button> <button class="btn sm red" onclick="delS(${s.id})">حذف</button></td>`:''}</tr>`).join(''):`<tr><td colspan="6" class="empty">لا يوجد طلاب بعد</td></tr>`;
const thead=full=>`<tr><th>الطالب</th><th>المجموعة</th><th>الحضور</th><th>المعدل</th><th>الحالة</th>${full?'<th></th>':''}</tr>`;

async function dashboard(){const d=await api('/t/dashboard');
 view(head(`أهلاً أ. ${esc(S.name.split(' ')[0])}`,'ملخص الأسبوع الدراسي الحالي')+`
 <div class="stats">${stat('إجمالي الطلاب',nf(d.total),`${nf(d.groups)} مجموعات`)}${stat('نسبة الحضور اليوم',pct(d.today.pct),`${nf(d.today.absent)} غائبين`,'g')}
 ${stat('متوسط الدرجات',pct(d.avg),'من كل الاختبارات')}${stat('طلاب يحتاجون متابعة',nf(d.follow),'غياب أو تراجع في الدرجات','r')}</div>
 <div class="grid2"><div class="card"><div class="ch"><h3>أحدث الطلاب</h3><a href="#students">عرض الكل</a></div><div class="scroll"><table>${thead(false)}${rows(d.recent,false)}</table></div></div>
 <div class="col"><div class="card"><h3>حصص اليوم</h3>${d.classes.map(c=>`<div style="display:flex;justify-content:space-between;padding:6px 0"><b>${esc(c.gname)}</b><span class="mut">${ar(c.start)} – ${ar(c.end)}</span></div>`).join('')||'<div class="mut">لا توجد حصص اليوم. أضف مواعيد من <a href="#groups">المجموعات</a></div>'}</div>
 <div class="card"><h3>الحضور خلال الأسبوع</h3>${d.week.length?`<div class="bars">${d.week.map((w,i)=>`<div class="bar"><span>${pct(w.pct)}</span><div class="track"><i class="${i===d.week.length-1?'last':''}" style="height:${Math.max(w.pct,4)}%"></i></div><b>${dayName(w.date)}</b></div>`).join('')}</div>`:'<div class="empty">سجّل الحضور ليظهر الرسم</div>'}</div>
 <div class="card"><h3>تنبيهات</h3>${d.alerts.map(a=>`<div class="alert ${a.lvl}">${esc(a.text)}</div>`).join('')||'<div class="mut">لا توجد تنبيهات 🎉</div>'}</div></div></div>`)}

async function studentsView(){students=await api('/t/students');
 view(head('الطلاب',`${nf(students.length)} طالب مسجّل`)+`<div class="card scroll"><table>${thead(true)}<tbody id="tb"></tbody></table></div>`);
 renderTable();const s=$('#search');if(filter){s.focus();s.setSelectionRange(99,99)}}
function renderTable(){const f=filter.trim().toLowerCase();
 $('#tb').innerHTML=rows(students.filter(s=>!f||s.name.toLowerCase().includes(f)||s.username.toLowerCase().includes(f)||(s.grp||'').toLowerCase().includes(f)),true)}

async function addStudent(){const gs=await api('/t/groups');
 const m=modal('إضافة طالب',`<form class="form"><label>الاسم<input name="name" required></label><div class="row2"><label>اسم المستخدم<input name="username" required autocapitalize="none"></label><label>كلمة المرور<input name="password" required minlength="4"></label></div>
 <div class="row2"><label>المجموعة<select name="group_id">${groupOptions(gs,'','بدون مجموعة')}</select></label><label>المصروف الشهري (اختياري)<input name="monthly_fee" type="number" min="0" step="any"></label></div><button class="btn">حفظ</button></form>`);
 $('form',m).onsubmit=e=>{e.preventDefault();run(async()=>{await api('/t/students','POST',Object.fromEntries(new FormData(e.target)));m.close();toast('تمت إضافة الطالب');go()})}}
async function delS(id){if(await ask('حذف الطالب وكل بياناته؟ لا يمكن التراجع.'))run(async()=>{await api('/t/students/'+id,'DELETE');toast('تم الحذف');go()})}

async function reportOf(id){const s=students.find(x=>x.id===id),[r,gs]=await Promise.all([api(`/t/students/${id}/report`),api('/t/groups')]);
 const m=modal(esc(s.name),`<div class="chips"><div class="chip">الحضور<b>${pct(s.att)}</b></div><div class="chip">المعدل<b>${pct(s.avg)}</b></div><div class="chip">الحالة<b>${s.status.label}</b></div></div>
 <form class="form" id="gf" style="grid-template-columns:1fr 1fr auto;align-items:end;margin-bottom:14px"><label>المجموعة<select name="group_id">${groupOptions(gs,s.group_id,'بدون مجموعة')}</select></label><label>المصروف الشهري<input name="monthly_fee" type="number" min="0" step="any" value="${s.fee||0}"></label><button class="btn">حفظ</button></form>
 <form class="form" id="nf" style="grid-template-columns:1fr auto;margin-bottom:12px"><input name="text" placeholder="أضف ملاحظة للطالب" required><button class="btn">إضافة</button></form>
 ${r.notes.map(n=>`<div class="note">${esc(n.text)} <span class="mut small">· ${dateAr(n.date)}</span></div>`).join('')}
 <h3 style="margin:14px 0 6px;font-size:16px">الدرجات</h3><table>${r.grades.map(g=>`<tr><td>${esc(g.title)}</td><td>${nf(g.score)} / ${nf(g.max_score)}</td><td class="mut small">${dateAr(g.date)}</td></tr>`).join('')||'<tr><td class="empty">لا توجد درجات</td></tr>'}</table>`);
 $('#gf',m).onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));run(async()=>{await api('/t/students/'+id,'PATCH',{group_id:f.group_id||null,monthly_fee:f.monthly_fee||0});m.close();toast('تم الحفظ');go()})};
 $('#nf',m).onsubmit=e=>{e.preventDefault();run(async()=>{await api('/t/notes','POST',{student_id:id,text:new FormData(e.target).get('text')});m.close();toast('تمت إضافة الملاحظة');reportOf(id)})}}
