// الواجبات + الاختبارات وبنك الأسئلة + المواد التعليمية
let hwCache=[],quizCache=[],bankCache=[],quizTab='quizzes',matCache=[];
const dtLocalDefault=()=>{const d=new Date(Date.now()+2*864e5);return d.toLocaleDateString('sv-SE',{timeZone:'Africa/Cairo'})+'T20:00'};

// ================= الواجبات =================
async function homeworkView(){hwCache=await api('/t/assignments');
 view(head2('الواجبات','أنشئ واجباً بموعد تسليم، واستلم إجابات الطلاب وصحّحها','<button class="btn" onclick="addHw()">+ واجب جديد</button>')+
 `<div class="card scroll"><table><tr><th>الواجب</th><th>المجموعة</th><th>موعد التسليم</th><th>التسليم</th><th>التصحيح</th><th></th></tr>${hwCache.map(a=>`<tr><td><b>${esc(a.title)}</b><div class="mut small">من ${nf(a.max_score)} درجة</div></td><td>${esc(a.gname)||'كل الطلاب'}</td><td>${dt(a.due_at)}</td>
 <td><div class="prog"><div class="meter" style="width:70px"><i style="width:${a.total?100*a.submitted/a.total:0}%"></i></div>${nf(a.submitted)}/${nf(a.total)}</div></td><td>${nf(a.graded)}/${nf(a.total)}</td>
 <td style="white-space:nowrap"><button class="btn sm line" onclick="openHw(${a.id})">فتح وتصحيح</button> <button class="btn sm line" onclick="paperFromHw(${a.id})">ورقة PDF</button> <button class="btn sm red" onclick="delHw(${a.id})">حذف</button></td></tr>`).join('')||'<tr><td colspan="6" class="empty">لا توجد واجبات بعد</td></tr>'}</table></div>`)}
V.homework=homeworkView;
async function addHw(){const gs=await api('/t/groups');
 const m=modal('واجب جديد',`<form class="form"><label>العنوان<input name="title" required maxlength="120"></label><label>الوصف / المطلوب<textarea name="description" maxlength="3000"></textarea></label><button type="button" class="linkbtn small" id="hb" style="justify-self:start">+ إدراج أسئلة من البنك</button>
 <div class="row2"><label>المجموعة<select name="group_id">${groupOptions(gs,'','كل الطلاب')}</select></label><label>الدرجة الكاملة<input name="max_score" type="number" min="1" step="any" value="10" required></label></div>
 <label>موعد التسليم (بتوقيت القاهرة)<input name="due_at" type="datetime-local" required value="${dtLocalDefault()}"></label><button class="btn">نشر الواجب</button></form>`);
 $('#hb',m).onclick=()=>run(()=>pickBankQuestions(qs=>{const t=$('[name=description]',m);t.value=(t.value?t.value+'\n\n':'')+qText(qs,false)}));
 $('form',m).onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));run(async()=>{await api('/t/assignments','POST',{...f,group_id:f.group_id||null,max_score:+f.max_score});m.close();toast('تم نشر الواجب');homeworkView()})}}
async function delHw(id){if(await ask('حذف الواجب وكل تسليماته ودرجاته؟'))run(async()=>{await api('/t/assignments/'+id,'DELETE');toast('تم الحذف');homeworkView()})}
async function openHw(id){const a=await api('/t/assignments/'+id);
 const m=wide(modal(esc(a.title),`<p class="mut small" style="margin-bottom:6px">موعد التسليم: ${dt(a.due_at)} · الدرجة الكاملة ${nf(a.max_score)}</p>${a.description?`<div class="note">${esc(a.description)}</div>`:''}
 <div class="scroll"><table class="mini"><tr><th>الطالب</th><th>الحالة</th><th>التسليم</th><th>الدرجة</th><th>تعليق</th><th></th></tr>${a.rows.map(x=>`<tr data-s="${x.student_id}"><td><b>${esc(x.name)}</b></td><td>${hwPill(x)}${x.submitted_at?`<div class="mut small">${dt(x.submitted_at)}</div>`:''}</td>
  <td>${x.text?`<div class="sub-text">${esc(x.text)}</div>`:''}${x.link?`<a href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">فتح الرابط ↗</a>`:''}${!x.text&&!x.link?'<span class="mut small">—</span>':''}</td>
  <td><input type="number" class="sc" min="0" max="${a.max_score}" step="any" value="${x.score??''}" style="width:80px" aria-label="الدرجة"></td><td><input class="fb" maxlength="1000" value="${esc(x.feedback||'')}" placeholder="تعليق" style="min-width:140px"></td>
  <td><button class="btn sm sv">حفظ</button></td></tr>`).join('')||'<tr><td colspan="6" class="empty">لا يوجد طلاب</td></tr>'}</table></div>`),1000);
 $$('tr[data-s]',m).forEach(tr=>$('.sv',tr).onclick=()=>run(async()=>{const sc=$('.sc',tr).value;if(sc==='')throw new Error('اكتب الدرجة أولاً');
  await api(`/t/assignments/${id}/grade/${tr.dataset.s}`,'PUT',{score:+sc,feedback:$('.fb',tr).value});toast('تم حفظ الدرجة');m.close();openHw(id);homeworkView()}))}

// ================= الاختبارات + بنك الأسئلة =================
async function quizzesView(){
 [quizCache,bankCache]=await Promise.all([api('/t/quizzes'),api('/t/bank')]);
 const tabs=subtabs([['quizzes','الاختبارات'],['bank','بنك الأسئلة']],quizTab,'setQuizTab');
 if(quizTab==='bank')view(head2('بنك الأسئلة','أسئلة اختيار من متعدد تُعاد استخدامها في أي اختبار','<button class="btn line" onclick="addQuestion()">+ سؤال واحد</button><button class="btn" onclick="importQuestions()">⬆ استيراد أسئلة</button>')+tabs+
  `<div class="card scroll"><table><tr><th>السؤال</th><th>الاختيارات</th><th>الموضوع</th><th></th></tr>${bankCache.map(b=>`<tr><td style="max-width:300px"><b>${esc(b.text)}</b></td><td>${b.options.map((o,i)=>`<div class="${i===b.correct?'ok-opt':'mut'} small">${i===b.correct?'✓ ':'• '}${esc(o)}</div>`).join('')}</td><td class="mut small">${esc(b.topic)||'—'}</td><td><button class="btn sm red" onclick="delQuestion(${b.id})">حذف</button></td></tr>`).join('')||'<tr><td colspan="4" class="empty">البنك فارغ. أضف أسئلتك الأولى</td></tr>'}</table></div>`);
 else view(head2('الاختبارات الإلكترونية','اختبارات بتصحيح تلقائي ومؤقت، يؤدّيها الطالب من صفحته','<button class="btn line" onclick="addQuiz()">+ من البنك</button><button class="btn" onclick="importQuestions(true)">⬆ اختبار من ملف / نص</button>')+tabs+
  `<div class="card scroll"><table><tr><th>الاختبار</th><th>المجموعة</th><th>الأسئلة</th><th>المدة</th><th>النتائج</th><th>الحالة</th><th></th></tr>${quizCache.map(z=>`<tr><td><b>${esc(z.title)}</b></td><td>${esc(z.gname)||'كل الطلاب'}</td><td>${nf(z.qcount)}</td><td>${nf(z.duration_min)} دقيقة</td><td>${nf(z.done)} سلّموا${z.avg!=null?` · متوسط ${pct(z.avg)}`:''}</td>
  <td>${sPill(z.active?'top':'new',z.active?'مفتوح':'مغلق')}</td><td style="white-space:nowrap"><button class="btn sm line" onclick="openQuiz(${z.id})">النتائج</button> <button class="btn sm line" onclick="paperFromQuiz(${z.id})">ورقة PDF</button> <button class="btn sm line" onclick="toggleQuiz(${z.id})">${z.active?'إغلاق':'فتح'}</button> <button class="btn sm red" onclick="delQuiz(${z.id})">حذف</button></td></tr>`).join('')||'<tr><td colspan="7" class="empty">لا توجد اختبارات بعد</td></tr>'}</table></div>`)}
V.quizzes=quizzesView;
const setQuizTab=t=>{quizTab=t;run(quizzesView)};
function addQuestion(){const m=modal('سؤال جديد',`<form class="form"><label>نص السؤال<textarea name="text" required maxlength="1000"></textarea></label>
 <div class="mut small">اكتب من ٢ إلى ٤ اختيارات واختر الإجابة الصحيحة</div>
 ${[0,1,2,3].map(i=>`<div style="display:flex;gap:8px;align-items:center"><input type="radio" name="correct" value="${i}" style="width:auto" ${i===0?'checked':''} aria-label="الإجابة الصحيحة ${i+1}"><input name="o${i}" placeholder="الاختيار ${i+1}${i<2?' (مطلوب)':''}" ${i<2?'required':''} maxlength="300"></div>`).join('')}
 <label>الموضوع (اختياري)<input name="topic" maxlength="80"></label><button class="btn">حفظ السؤال</button></form>`);
 $('form',m).onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));
  const idx=[0,1,2,3].filter(i=>f['o'+i].trim()),options=idx.map(i=>f['o'+i].trim()),correct=idx.indexOf(+f.correct);
  if(correct<0)return toast('الإجابة الصحيحة لا يمكن أن تكون اختياراً فارغاً',true);
  run(async()=>{await api('/t/bank','POST',{text:f.text,options,correct,topic:f.topic});m.close();toast('تمت إضافة السؤال');quizzesView()})}}
async function delQuestion(id){if(await ask('حذف السؤال من البنك؟ (الاختبارات المنشورة لن تتأثر)'))run(async()=>{await api('/t/bank/'+id,'DELETE');quizzesView()})}
async function addQuiz(){const gs=await api('/t/groups');
 if(!bankCache.length){toast('أضف أسئلة إلى بنك الأسئلة أولاً',true);return setQuizTab('bank')}
 const m=modal('اختبار جديد',`<form class="form"><label>عنوان الاختبار<input name="title" required maxlength="120"></label>
 <div class="row2"><label>المجموعة<select name="group_id">${groupOptions(gs,'','كل الطلاب')}</select></label><label>المدة (دقائق)<input name="duration_min" type="number" min="1" max="300" value="20" required></label></div>
 <div class="ch"><b>اختر الأسئلة</b><button type="button" class="linkbtn" id="all">تحديد الكل</button></div>
 <div class="chklist">${bankCache.map(b=>`<label class="chk"><input type="checkbox" name="q" value="${b.id}"><span>${esc(b.text)} <span class="mut small">${b.topic?'· '+esc(b.topic):''}</span></span></label>`).join('')}</div><button class="btn">نشر الاختبار</button></form>`);
 $('#all',m).onclick=()=>{const bs=$$('input[name=q]',m),on=bs.some(b=>!b.checked);bs.forEach(b=>b.checked=on)};
 $('form',m).onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target)),ids=$$('input[name=q]:checked',m).map(b=>+b.value);
  if(!ids.length)return toast('اختر سؤالاً واحداً على الأقل',true);
  run(async()=>{await api('/t/quizzes','POST',{title:f.title,group_id:f.group_id||null,duration_min:+f.duration_min,question_ids:ids});m.close();toast('تم نشر الاختبار');quizzesView()})}}
const toggleQuiz=id=>run(async()=>{await api(`/t/quizzes/${id}/toggle`,'PATCH');quizzesView()});
async function delQuiz(id){if(await ask('حذف الاختبار ونتائجه ودرجاته؟'))run(async()=>{await api('/t/quizzes/'+id,'DELETE');quizzesView()})}
async function openQuiz(id){const z=await api('/t/quizzes/'+id);
 wide(modal(esc(z.title),`<table class="mini"><tr><th>الطالب</th><th>الحالة</th><th>الدرجة</th><th>النسبة</th></tr>${z.attempts.map(a=>{const st=a.submitted_at?sPill('top','سلّم'):a.started_at?sPill('watch','جارٍ'):sPill('new','لم يبدأ');
  return`<tr><td><b>${esc(a.name)}</b></td><td>${st}${a.overtime?' <span class="pill warn">تجاوز الوقت</span>':''}</td><td>${a.submitted_at?`${nf(a.score)} / ${nf(a.total)}`:'—'}</td><td>${a.submitted_at?pct(a.total?Math.round(100*a.score/a.total):0):'—'}</td></tr>`}).join('')||'<tr><td colspan="4" class="empty">لا يوجد طلاب</td></tr>'}</table>`),700)}

// ================= المواد التعليمية =================
const KINDS={link:['🔗','رابط'],video:['▶️','فيديو'],doc:['📄','ملف / مستند']};
async function materialsView(){matCache=await api('/t/materials');
 view(head2('المواد التعليمية','شارك روابط الدروس والفيديوهات والملفات مع طلاب كل مجموعة','<button class="btn" onclick="addMaterial()">+ مادة جديدة</button>')+
 `<div class="hint">ارفع الملف على Google Drive أو يوتيوب ثم الصق الرابط هنا. رفع الملفات مباشرة للمنصة يحتاج خدمة تخزين مخصصة (مذكورة في التقرير).</div>
 <div class="card scroll"><table><tr><th></th><th>العنوان</th><th>الوحدة / الدرس</th><th>المجموعة</th><th></th></tr>${matCache.map(x=>`<tr><td><span class="kind">${KINDS[x.kind][0]}</span></td><td><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><b>${esc(x.title)}</b></a>${x.description?`<div class="mut small">${esc(x.description)}</div>`:''}</td><td>${esc(x.unit)||'—'}</td><td>${esc(x.gname)||'كل الطلاب'}</td><td><button class="btn sm red" onclick="delMaterial(${x.id})">حذف</button></td></tr>`).join('')||'<tr><td colspan="5" class="empty">لا توجد مواد بعد</td></tr>'}</table></div>`)}
V.materials=materialsView;
async function addMaterial(){const gs=await api('/t/groups');
 const m=modal('مادة جديدة',`<form class="form"><label>العنوان<input name="title" required maxlength="120"></label><label>الرابط<input name="url" type="url" required placeholder="https://" dir="ltr"></label>
 <div class="row2"><label>النوع<select name="kind">${Object.entries(KINDS).map(([k,v])=>`<option value="${k}">${v[1]}</option>`).join('')}</select></label><label>المجموعة<select name="group_id">${groupOptions(gs,'','كل الطلاب')}</select></label></div>
 <label>الوحدة / الدرس (لربطها بالمنهج)<input name="unit" maxlength="80" placeholder="مثال: الوحدة الأولى - الدرس ٢"></label><label>وصف (اختياري)<input name="description" maxlength="500"></label><button class="btn">حفظ</button></form>`);
 $('form',m).onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));run(async()=>{await api('/t/materials','POST',{...f,group_id:f.group_id||null});m.close();toast('تمت إضافة المادة');materialsView()})}}
async function delMaterial(id){if(await ask('حذف هذه المادة؟'))run(async()=>{await api('/t/materials/'+id,'DELETE');materialsView()})}
