requireRole('admin');
shell('admin','<a class="on" href="#">المعلمون</a>');
async function load(){const L=await api('/admin/teachers');
 $('#view').innerHTML=`<div class="head"><div><h1>إدارة المعلمين</h1><p>أنشئ حسابات المعلمين وتحكم في تفعيلها</p></div><div class="acts"><button class="btn" id="at">+ إضافة معلم</button></div></div>
 <div class="stats">${stat('عدد المعلمين',nf(L.length),`${nf(L.filter(t=>t.active).length)} مفعّل`)}${stat('إجمالي الطلاب',nf(L.reduce((x,t)=>x+t.students,0)),'في كل الحسابات')}</div>
 <div class="card scroll"><table><tr><th>المعلم</th><th>اسم المستخدم</th><th>الطلاب</th><th>الحالة</th><th></th></tr>${L.map(t=>`<tr><td><b>${esc(t.name)}</b></td><td>${esc(t.username)}</td><td>${nf(t.students)}</td><td><span class="pill ${t.active?'top':'warn'}">${t.active?'مفعّل':'موقوف'}</span></td><td><button class="btn sm ${t.active?'red':'line'}" onclick="tog(${t.id})">${t.active?'إيقاف':'تفعيل'}</button></td></tr>`).join('')||'<tr><td colspan="5" class="empty">لا يوجد معلمون بعد</td></tr>'}</table></div>`;
 $('#at').onclick=()=>{const m=modal('إضافة معلم',`<form class="form"><label>الاسم<input name="name" required></label><div class="row2"><label>اسم المستخدم<input name="username" required autocapitalize="none"></label><label>كلمة المرور<input name="password" required minlength="4"></label></div><button class="btn">حفظ</button></form>`);
  $('form',m).onsubmit=e=>{e.preventDefault();run(async()=>{await api('/admin/teachers','POST',Object.fromEntries(new FormData(e.target)));m.close();toast('تمت إضافة المعلم');load()})}}}
const tog=id=>run(async()=>{await api(`/admin/teachers/${id}/toggle`,'PATCH');load()});
run(load);
