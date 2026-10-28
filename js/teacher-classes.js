// المجموعات والجدول + الحضور (يدوي سريع / بالكود)
let groupsCache=[],attDate=todayISO(),attGroup='',attTimer=null,codeTick=null;

// ================= المجموعات =================
async function groupsView(){groupsCache=await api('/t/groups');
 view(head2('المجموعات والجدول','نظّم طلابك في مجموعات، ولكل مجموعة مواعيد حصصها الأسبوعية','<button class="btn" onclick="addGroup()">+ مجموعة جديدة</button>')+
 (groupsCache.length?`<div class="cards">${groupsCache.map(g=>`<div class="card"><div class="ch"><h3>${esc(g.name)}</h3><span class="mut small">${nf(g.students)} طالب</span></div>
  <div class="sched">${[...g.schedule].sort((a,b)=>DOW_ORDER.indexOf(a.dow)-DOW_ORDER.indexOf(b.dow)||a.start.localeCompare(b.start)).map(c=>`<span class="chip2">${DOW[c.dow]} ${ar(c.start)}–${ar(c.end)}<button class="x2" aria-label="حذف الموعد" onclick="delSlot(${c.id})">×</button></span>`).join('')||'<span class="mut small">لا توجد مواعيد بعد</span>'}</div>
  <div class="acts" style="margin-top:14px"><button class="btn sm line" onclick="addSlot(${g.id})">+ موعد</button><button class="btn sm line" onclick="renameGroup(${g.id})">تعديل الاسم</button><button class="btn sm red" onclick="delGroup(${g.id})">حذف</button></div></div>`).join('')}</div>`
  :'<div class="card empty">لا توجد مجموعات بعد. أنشئ مجموعة ثم انقل إليها طلابك من صفحة الطلاب.</div>'))}
V.groups=groupsView;
const groupById=id=>groupsCache.find(g=>g.id===id);
function addGroup(){const m=modal('مجموعة جديدة','<form class="form"><label>اسم المجموعة<input name="name" required maxlength="60" placeholder="مثال: الصف الأول - مجموعة السبت"></label><button class="btn">حفظ</button></form>');
 $('form',m).onsubmit=e=>{e.preventDefault();run(async()=>{await api('/t/groups','POST',Object.fromEntries(new FormData(e.target)));m.close();toast('تم إنشاء المجموعة');groupsView()})}}
function renameGroup(id){const g=groupById(id),m=modal('تعديل اسم المجموعة',`<form class="form"><label>الاسم<input name="name" required maxlength="60" value="${esc(g.name)}"></label><button class="btn">حفظ</button></form>`);
 $('form',m).onsubmit=e=>{e.preventDefault();run(async()=>{await api('/t/groups/'+id,'PATCH',Object.fromEntries(new FormData(e.target)));m.close();groupsView()})}}
async function delGroup(id){const g=groupById(id);
 if(await ask(`حذف مجموعة "${g.name}"؟ سيبقى طلابها بدون مجموعة.`))run(async()=>{await api('/t/groups/'+id,'DELETE');toast('تم حذف المجموعة');groupsView()})}
function addSlot(id){const g=groupById(id),m=modal('موعد جديد - '+esc(g.name),`<form class="form"><label>اليوم<select name="dow">${DOW_ORDER.map(d=>`<option value="${d}">${DOW[d]}</option>`).join('')}</select></label>
 <div class="row2"><label>من<input type="time" name="start" required value="16:00"></label><label>إلى<input type="time" name="end" required value="17:30"></label></div><button class="btn">حفظ</button></form>`);
 $('form',m).onsubmit=e=>{e.preventDefault();run(async()=>{await api(`/t/groups/${id}/schedule`,'POST',Object.fromEntries(new FormData(e.target)));m.close();groupsView()})}}
const delSlot=id=>run(async()=>{await api('/t/schedule/'+id,'DELETE');groupsView()});

// ================= الحضور =================
function stopAtt(){clearInterval(attTimer);clearInterval(codeTick);attTimer=codeTick=null}
async function attendanceView(){stopAtt();groupsCache=await api('/t/groups');
 if(attGroup&&!groupById(+attGroup))attGroup='';
 view(head2('الحضور والغياب','سجّل حضور كل مجموعة على حدة، أو اترك الطلاب يسجّلون حضورهم بالكود')+`<div class="card"><div class="ch" style="gap:10px;flex-wrap:wrap"><h3>سجل الحضور</h3>
  <div class="acts"><select id="ag" style="width:auto"><option value="">كل المجموعات</option>${groupsCache.map(g=>`<option value="${g.id}" ${String(g.id)===String(attGroup)?'selected':''}>${esc(g.name)}</option>`).join('')}</select>
  <input type="date" id="dt" value="${attDate}" style="width:auto"><button class="btn sm" id="allp">تسجيل الكل حاضر</button></div></div>
  <div id="codebox"></div><div id="al"></div></div>`);
 $('#dt').onchange=e=>{attDate=e.target.value;attendanceView()};
 $('#ag').onchange=e=>{attGroup=e.target.value;attendanceView()};
 $('#allp').onclick=()=>run(async()=>{await api('/t/attendance/bulk','POST',{date:attDate,group_id:attGroup||null});toast('تم تسجيل غير المسجَّلين حاضرين. عدّل الغائبين الآن');loadAtt()});
 loadCode();await loadAtt()}
V.attendance=attendanceView;
async function loadAtt(){const l=await api(`/t/attendance?date=${attDate}${attGroup?'&group_id='+attGroup:''}`),p=l.filter(x=>x.status==='present').length,a=l.filter(x=>x.status==='absent').length;
 const el=$('#al');if(!el)return;
 el.innerHTML=l.length?`<p class="mut small" style="margin-bottom:8px">حاضر ${nf(p)} · غائب ${nf(a)} · لم يُسجَّل ${nf(l.length-p-a)}</p><table>${l.map(s=>`<tr><td><b>${esc(s.name)}</b> <span class="mut small">${esc(s.grp)}</span></td><td style="text-align:left"><span class="seg"><button class="btn sm ${s.status==='present'?'':'line'}" onclick="mark(${s.id},'present')">حاضر</button><button class="btn sm ${s.status==='absent'?'':'line'}" style="${s.status==='absent'?'background:var(--red)':''}" onclick="mark(${s.id},'absent')">غائب</button></span></td></tr>`).join('')}</table>`:'<div class="empty">لا يوجد طلاب في هذه المجموعة</div>'}
const mark=(id,status)=>run(async()=>{await api('/t/attendance','POST',{student_id:id,date:attDate,status});loadAtt()});

// كود الحضور (للمجموعة المختارة وليوم اليوم فقط)
async function loadCode(){const box=$('#codebox');if(!box)return;clearInterval(codeTick);clearInterval(attTimer);
 if(!attGroup||attDate!==todayISO()){box.innerHTML=attGroup?'':'<div class="hint">اختر مجموعة لتفعيل <b>كود الحضور</b>: يكتبه الطالب من صفحته فيُسجَّل حاضراً تلقائياً.</div>';return}
 const c=await api('/t/attendance/code?group_id='+attGroup);
 if(!c){box.innerHTML='<div class="hint" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><span>اطلب من الطلاب تسجيل حضورهم بأنفسهم: أنشئ كوداً يظهر لك هنا ويكتبونه من صفحاتهم.</span><button class="btn sm" onclick="newCode()">إنشاء كود حضور</button></div>';return}
 let left=c.left;
 box.innerHTML=`<div class="codebox"><div><small>كود الحضور — يكتبه الطلاب في صفحاتهم</small><div class="code">${c.code}</div></div><div style="text-align:left"><small>ينتهي خلال</small><div class="timer" id="cleft"></div><button class="btn sm line" style="margin-top:8px" onclick="closeCode()">إغلاق الكود</button></div></div>`;
 const paint=()=>{const e=$('#cleft');if(!e){stopAtt();return}if(left<=0){stopAtt();loadCode();return}e.textContent=ar(String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0'));left--};
 paint();codeTick=setInterval(paint,1000);
 attTimer=setInterval(()=>{if(location.hash==='#attendance')loadAtt().catch(()=>{});else stopAtt()},6000)}
const newCode=()=>run(async()=>{await api('/t/attendance/code','POST',{group_id:+attGroup,minutes:15});loadCode()});
const closeCode=()=>run(async()=>{await api('/t/attendance/code/close','POST',{group_id:+attGroup});loadCode()});
