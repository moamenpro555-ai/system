const S=requireRole('student');
shell('student','<a class="on" href="#">صفحتي</a>');
run(async()=>{const r=await api('/me/report'),p=r.attendance.filter(a=>a.status==='present').length,t=r.attendance.length;
 const sc=r.grades.reduce((x,g)=>x+ +g.score,0),mx=r.grades.reduce((x,g)=>x+ +g.max_score,0);
 $('#view').innerHTML=`<div class="head"><div><h1>أهلاً ${esc(S.name.split(' ')[0])}</h1><p>ملخص حضورك ودرجاتك</p></div></div>
 <div class="stats">${stat('نسبة الحضور',pct(t?Math.round(100*p/t):null),`${nf(t)} يوم مسجّل`,'g')}${stat('متوسط الدرجات',pct(mx?Math.round(100*sc/mx):null),`${nf(r.grades.length)} اختبار`)}${stat('أيام الحضور',nf(p),'حاضر')}${stat('أيام الغياب',nf(t-p),'غائب','r')}</div>
 <div class="grid2"><div class="card scroll"><h3>الدرجات</h3><table><tr><th>الاختبار</th><th>الدرجة</th><th>التاريخ</th></tr>${r.grades.map(g=>`<tr><td>${esc(g.title)}</td><td>${nf(g.score)} / ${nf(g.max_score)}</td><td class="mut small">${dateAr(g.date)}</td></tr>`).join('')||'<tr><td colspan="3" class="empty">لا توجد درجات بعد</td></tr>'}</table></div>
 <div class="col"><div class="card"><h3>ملاحظات المعلم</h3>${r.notes.map(n=>`<div class="note">${esc(n.text)} <span class="mut small">· ${dateAr(n.date)}</span></div>`).join('')||'<div class="mut">لا توجد ملاحظات</div>'}</div>
 <div class="card"><h3>آخر أيام الحضور</h3>${r.attendance.slice(0,8).map(a=>`<div style="display:flex;justify-content:space-between;padding:4px 0"><span>${dayName(a.date)} ${dateAr(a.date)}</span><span class="pill ${a.status==='present'?'top':'warn'}">${a.status==='present'?'حاضر':'غائب'}</span></div>`).join('')||'<div class="mut">لا يوجد سجل</div>'}</div></div></div>`});
