const S=requireRole('teacher');
const NAV=[['dashboard','لوحة التحكم'],['students','الطلاب'],['attendance','الحضور والغياب'],['grades','الدرجات والاختبارات']];
const V={dashboard,students:studentsView,attendance:attendanceView,grades:gradesView};
let students=[],filter='',attDate=todayISO();
shell('teacher','');
const view=h=>{$('#view').innerHTML=h;const s=$('#search');if(s){s.oninput=e=>{filter=e.target.value;location.hash==='#students'?renderTable():(location.hash='#students')};}
 const a=$('#addS');if(a)a.onclick=addStudent};
const head=(t,sub)=>`<div class="head"><div><h1>${t}</h1><p>${sub}</p></div><div class="acts"><input id="search" class="search" placeholder="ابحث عن طالب أو اسم مستخدم" value="${esc(filter)}"><button class="btn" id="addS">+ إضافة طالب</button></div></div>`;
function go(){const k=V[location.hash.slice(1)]?location.hash.slice(1):'dashboard';
 $('#nav').innerHTML=NAV.map(([id,t])=>`<a href="#${id}" class="${id===k?'on':''}">${t}</a>`).join('');
 $('#side').classList.remove('open');run(V[k])}
addEventListener('hashchange',go);go();

const rows=(list,full)=>list.length?list.map(s=>`<tr><td><b>${esc(s.name)}</b>${full?`<div class="mut small">${esc(s.username)}</div>`:''}</td><td>${esc(s.grp)||'—'}</td><td>${pct(s.att)}</td><td>${pct(s.avg)}</td><td>${pill(s.status)}</td>${full?`<td style="white-space:nowrap"><button class="btn sm line" onclick="reportOf(${s.id})">تقرير</button> <button class="btn sm red" onclick="delS(${s.id})">حذف</button></td>`:''}</tr>`).join(''):`<tr><td colspan="6" class="empty">لا يوجد طلاب بعد</td></tr>`;
const thead=full=>`<tr><th>الطالب</th><th>الفصل</th><th>الحضور</th><th>المعدل</th><th>الحالة</th>${full?'<th></th>':''}</tr>`;

async function dashboard(){const d=await api('/t/dashboard');
 view(head(`أهلاً أ. ${esc(S.name.split(' ')[0])}`,'ملخص الأسبوع الدراسي الحالي')+`
 <div class="stats">${stat('إجمالي الطلاب',nf(d.total),`${nf(d.groups)} فصول`)}${stat('نسبة الحضور اليوم',pct(d.today.pct),`${nf(d.today.absent)} غائبين`,'g')}
 ${stat('متوسط الدرجات',pct(d.avg),'من كل الاختبارات')}${stat('طلاب يحتاجون متابعة',nf(d.follow),'غياب أو تراجع في الدرجات','r')}</div>
 <div class="grid2"><div class="card"><div class="ch"><h3>أحدث الطلاب</h3><a href="#students">عرض الكل</a></div><div class="scroll"><table>${thead(false)}${rows(d.recent,false)}</table></div></div>
 <div class="col"><div class="card"><h3>الحضور خلال الأسبوع</h3>${d.week.length?`<div class="bars">${d.week.map((w,i)=>`<div class="bar"><span>${pct(w.pct)}</span><div class="track"><i class="${i===d.week.length-1?'last':''}" style="height:${Math.max(w.pct,4)}%"></i></div><b>${dayName(w.date)}</b></div>`).join('')}</div>`:'<div class="empty">سجّل الحضور ليظهر الرسم</div>'}</div>
 <div class="card"><h3>تنبيهات</h3>${d.alerts.map(a=>`<div class="alert ${a.lvl}">${esc(a.text)}</div>`).join('')||'<div class="mut">لا توجد تنبيهات 🎉</div>'}</div></div></div>`)}

async function studentsView(){students=await api('/t/students');
 view(head('الطلاب',`${nf(students.length)} طالب مسجّل`)+`<div class="card scroll"><table>${thead(true)}<tbody id="tb"></tbody></table></div>`);
 renderTable();const s=$('#search');if(filter){s.focus();s.setSelectionRange(99,99)}}
function renderTable(){const f=filter.trim().toLowerCase();
 $('#tb').innerHTML=rows(students.filter(s=>!f||s.name.toLowerCase().includes(f)||s.username.toLowerCase().includes(f)),true)}

function addStudent(){const m=modal('إضافة طالب',`<form class="form"><label>الاسم<input name="name" required></label><div class="row2"><label>اسم المستخدم<input name="username" required autocapitalize="none"></label><label>كلمة المرور<input name="password" required minlength="4"></label></div><label>الفصل / المجموعة<input name="grp"></label><button class="btn">حفظ</button></form>`);
 $('form',m).onsubmit=e=>{e.preventDefault();run(async()=>{await api('/t/students','POST',Object.fromEntries(new FormData(e.target)));m.close();toast('تمت إضافة الطالب');go()})}}
async function delS(id){if(confirm('حذف الطالب وكل بياناته؟'))run(async()=>{await api('/t/students/'+id,'DELETE');toast('تم الحذف');go()})}

async function reportOf(id){const s=students.find(x=>x.id===id),r=await api(`/t/students/${id}/report`);
 const m=modal(esc(s.name),`<div class="chips"><div class="chip">الحضور<b>${pct(s.att)}</b></div><div class="chip">المعدل<b>${pct(s.avg)}</b></div><div class="chip">الحالة<b>${s.status.label}</b></div></div>
 <form class="form" id="nf" style="grid-template-columns:1fr auto;margin-bottom:12px"><input name="text" placeholder="أضف ملاحظة للطالب" required><button class="btn">إضافة</button></form>
 ${r.notes.map(n=>`<div class="note">${esc(n.text)} <span class="mut small">· ${dateAr(n.date)}</span></div>`).join('')}
 <h3 style="margin:14px 0 6px;font-size:16px">الدرجات</h3><table>${r.grades.map(g=>`<tr><td>${esc(g.title)}</td><td>${nf(g.score)} / ${nf(g.max_score)}</td><td class="mut small">${dateAr(g.date)}</td></tr>`).join('')||'<tr><td class="empty">لا توجد درجات</td></tr>'}</table>`);
 $('#nf',m).onsubmit=e=>{e.preventDefault();run(async()=>{await api('/t/notes','POST',{student_id:id,text:new FormData(e.target).get('text')});m.close();toast('تمت إضافة الملاحظة');reportOf(id)})}}

async function attendanceView(){
 view(head('الحضور والغياب','سجّل حضور طلابك لليوم المحدد')+`<div class="card"><div class="ch"><h3>سجل اليوم</h3><input type="date" id="dt" value="${attDate}" style="width:auto"></div><div id="al"></div></div>`);
 $('#dt').onchange=e=>{attDate=e.target.value;loadAtt()};loadAtt()}
async function loadAtt(){const l=await api('/t/attendance?date='+attDate),p=l.filter(x=>x.status==='present').length,a=l.filter(x=>x.status==='absent').length;
 $('#al').innerHTML=l.length?`<p class="mut small" style="margin-bottom:8px">حاضر ${nf(p)} · غائب ${nf(a)} · لم يُسجَّل ${nf(l.length-p-a)}</p><table>${l.map(s=>`<tr><td><b>${esc(s.name)}</b> <span class="mut small">${esc(s.grp)}</span></td><td style="text-align:left"><span class="seg"><button class="btn sm ${s.status==='present'?'':'line'}" onclick="mark(${s.id},'present')">حاضر</button><button class="btn sm ${s.status==='absent'?'':'line'}" style="${s.status==='absent'?'background:var(--red)':''}" onclick="mark(${s.id},'absent')">غائب</button></span></td></tr>`).join('')}</table>`:'<div class="empty">أضف طلاباً أولاً</div>'}
const mark=(id,status)=>run(async()=>{await api('/t/attendance','POST',{student_id:id,date:attDate,status});loadAtt()});

async function gradesView(){const[l,st]=await Promise.all([api('/t/grades'),api('/t/students')]);students=st;
 view(head('الدرجات والاختبارات','آخر الدرجات المسجّلة')+`<div class="card scroll"><div class="ch"><h3>سجل الدرجات</h3><button class="btn sm" id="ag">+ إضافة درجة</button></div><table><tr><th>الطالب</th><th>الاختبار / الواجب</th><th>الدرجة</th><th>النسبة</th><th>التاريخ</th></tr>${l.map(g=>`<tr><td>${esc(g.student)}</td><td>${esc(g.title)}</td><td>${nf(g.score)} / ${nf(g.max_score)}</td><td>${pct(Math.round(100*g.score/g.max_score))}</td><td class="mut small">${dateAr(g.date)}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">لا توجد درجات بعد</td></tr>'}</table></div>`);
 $('#ag').onclick=()=>{if(!students.length)return toast('أضف طلاباً أولاً',true);
  const m=modal('إضافة درجة',`<form class="form"><label>الطالب<select name="student_id">${students.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></label><label>الاختبار / الواجب<input name="title" required></label><div class="row2"><label>الدرجة<input name="score" type="number" step="any" min="0" required></label><label>من<input name="max_score" type="number" step="any" min="1" required></label></div><button class="btn">حفظ</button></form>`);
  $('form',m).onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));run(async()=>{await api('/t/grades','POST',{...f,student_id:+f.student_id,score:+f.score,max_score:+f.max_score});m.close();toast('تم حفظ الدرجة');go()})}}}
