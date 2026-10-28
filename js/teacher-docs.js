// المذكرات (PDF بتصميم المعلم) + ورق الامتحان والواجب
const DE=DocsEngine;
let docsTab='notes',docsPrefill=null;
const lsGet=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};

// ---------- معاينة حية + طباعة ----------
function makePreview(box){box.innerHTML='<div class="pvw"><iframe class="pvf" title="معاينة المستند"></iframe></div>';
 const w=$('.pvw',box),f=$('.pvf',box);
 const fit=()=>{if(!document.contains(w)){removeEventListener('resize',fit);return}const s=Math.min(1,w.clientWidth/794);f.style.width='794px';f.style.height=(w.clientHeight/s)+'px';f.style.transform=`scale(${s})`};
 addEventListener('resize',fit);fit();
 return{frame:f,set(html){fit();const y=f.contentDocument?.scrollingElement?.scrollTop||0;f.onload=()=>{try{f.contentDocument.scrollingElement.scrollTop=y}catch{}};f.srcdoc=html},
  async print(){const d=f.contentDocument;if(!d||!d.body||!d.body.textContent.trim())return toast('لا يوجد محتوى للطباعة',true);
   try{await d.fonts.ready}catch{}f.contentWindow.focus();f.contentWindow.print()}}}
const PRINT_TIP='<div class="hint">لحفظ الملف: اضغط «تنزيل PDF»، واختر الوجهة <b>«حفظ بتنسيق PDF»</b>، ثم ألغِ خيار <b>«الرؤوس والتذييلات»</b> من «المزيد من الإعدادات».</div>';

// ---------- لوحة التصميم المشتركة ----------
function styleHTML(st){const T=DE.TPLS;
 return `<details class="card" style="padding:14px" open><summary style="font-weight:800;cursor:pointer">🎨 التصميم</summary><div class="form" style="margin-top:12px">
 <div class="tpls">${Object.entries(T).map(([k,t])=>`<button type="button" data-tpl="${k}" class="${st.tpl===k?'on':''}">${t.name}</button>`).join('')}</div>
 <label>اللون<div class="sw">${DE.SWATCHES.map(c=>`<button type="button" class="swatch" data-sw="${c}" style="background:${c}" aria-label="لون ${c}"></button>`).join('')}<input type="color" data-st="color" value="${st.color}" style="width:46px;height:34px;padding:2px"></div></label>
 <div class="row2"><label>الخط<select data-st="font">${DE.FONTS.map(f=>`<option ${f===st.font?'selected':''}>${f}</option>`).join('')}</select></label><label>حجم الخط<input type="range" min="12" max="22" data-st="size" value="${st.size}"></label></div>
 <div class="row2"><label>تباعد الأسطر<input type="range" min="1.4" max="2.4" step=".1" data-st="lh" value="${st.lh}"></label><label>الأعمدة<select data-st="cols"><option value="1" ${+st.cols===1?'selected':''}>عمود واحد</option><option value="2" ${+st.cols===2?'selected':''}>عمودان</option></select></label></div>
 <div style="display:flex;gap:18px;flex-wrap:wrap"><label style="display:flex;flex-direction:row;gap:8px;align-items:center"><input type="checkbox" data-st="header" style="width:auto" ${st.header?'checked':''}>ترويسة</label><label style="display:flex;flex-direction:row;gap:8px;align-items:center"><input type="checkbox" data-st="border" style="width:auto" ${st.border?'checked':''}>إطار للصفحة</label></div>
 <div class="row2"><label>اسم المدرسة / السنتر<input data-st="school" maxlength="80" value="${esc(st.school)}"></label><label>المادة / الصف<input data-st="subject" maxlength="80" value="${esc(st.subject)}"></label></div>
 <div class="row2"><label>التاريخ (يظهر بالترويسة)<input data-st="date" maxlength="40" value="${esc(st.date)}"></label><label>نص أسفل الصفحة<input data-st="footer" maxlength="60" value="${esc(st.footer)}"></label></div>
 <div class="row2"><label>علامة مائية (اسمك مثلاً)<input data-st="watermark" maxlength="30" value="${esc(st.watermark)}"></label><label>رابط الشعار (اختياري)<input data-st="logo" dir="ltr" placeholder="https://" value="${esc(st.logo)}"></label></div>
 </div></details>`}
function bindStyle(root,st,cb){
 $$('[data-st]',root).forEach(el=>el.oninput=el.onchange=()=>{const k=el.dataset.st;st[k]=el.type==='checkbox'?el.checked:(el.type==='range'||k==='cols')?+el.value:el.value;cb()});
 $$('[data-sw]',root).forEach(b=>b.onclick=()=>{st.color=b.dataset.sw;$('[data-st=color]',root).value=st.color;cb()});
 $$('[data-tpl]',root).forEach(b=>b.onclick=()=>{const t=DE.TPLS[b.dataset.tpl];st.tpl=b.dataset.tpl;st.font=t.font;st.color=t.color;
  $('[data-st=font]',root).value=t.font;$('[data-st=color]',root).value=t.color;$$('[data-tpl]',root).forEach(x=>x.classList.toggle('on',x===b));cb()})}

// ---------- اختيار أسئلة من البنك ----------
const qText=(qs,ans)=>qs.map((q,i)=>`${i+1}) ${q.text}\n${q.options.map((o,j)=>`${DE.LET[j]}) ${o}${ans&&j===q.correct?' *':''}`).join('\n')}`).join('\n\n');
async function pickBankQuestions(cb){const bank=await api('/t/bank');
 if(!bank.length)return toast('بنك الأسئلة فارغ. استورد أسئلتك أولاً من صفحة الاختبارات',true);
 const m=wide(modal('اختر أسئلة من البنك',`<input id="bq" placeholder="ابحث في الأسئلة…" style="margin-bottom:10px"><div class="chklist" id="bl" style="max-height:340px"></div><div class="ch" style="margin-top:12px"><button class="linkbtn" id="ba" type="button">تحديد الكل</button><button class="btn" id="bo">إدراج</button></div>`),700);
 const sel=new Set();const draw=()=>{const f=$('#bq',m).value.trim();$('#bl',m).innerHTML=bank.filter(b=>!f||b.text.includes(f)||b.topic.includes(f)).map(b=>`<label class="chk"><input type="checkbox" value="${b.id}" ${sel.has(b.id)?'checked':''}><span>${esc(b.text)} <span class="mut small">${b.topic?'· '+esc(b.topic):''}</span></span></label>`).join('')||'<div class="empty">لا نتائج</div>';
  $$('#bl input',m).forEach(i=>i.onchange=()=>i.checked?sel.add(+i.value):sel.delete(+i.value))};
 draw();$('#bq',m).oninput=draw;$('#ba',m).onclick=()=>{const bs=$$('#bl input',m),on=bs.some(b=>!b.checked);bs.forEach(b=>{b.checked=on;on?sel.add(+b.value):sel.delete(+b.value)})};
 $('#bo',m).onclick=()=>{if(!sel.size)return toast('اختر سؤالاً واحداً على الأقل',true);cb(bank.filter(b=>sel.has(b.id)));m.close()}}

// ================= الشاشة الرئيسية =================
async function docsView(){const pre=docsPrefill;docsPrefill=null;if(pre)docsTab=pre.tab||'paper';
 if(docsTab==='paper')return paperBuilder(pre);
 const l=await api('/t/documents');
 view(head2('المذكرات والأوراق','اكتب مذكرتك واختر تصميمها ونزّلها PDF، أو جهّز ورق امتحان وواجب جاهز للطباعة','<button class="btn" onclick="openNote()">+ مذكرة جديدة</button>')+
 subtabs([['notes','مذكراتي'],['paper','ورقة امتحان / واجب']],docsTab,'setDocsTab')+
 (l.length?`<div style="display:grid;gap:10px">${l.map(d=>`<div class="card dcard"><div><b>${esc(d.title)}</b><div class="mut small">آخر تعديل ${dt(d.updated_at)}</div></div><div class="acts"><button class="btn sm" onclick="openNote(${d.id})">فتح وتعديل</button><button class="btn sm red" onclick="delNote(${d.id})">حذف</button></div></div>`).join('')}</div>`
  :'<div class="card empty">لا توجد مذكرات بعد. ابدأ بـ «مذكرة جديدة» وستجد مثالاً جاهزاً تعدّله.</div>'))}
V.docs=docsView;
const setDocsTab=t=>{docsTab=t;run(docsView)};
async function delNote(id){if(await ask('حذف هذه المذكرة نهائياً؟'))run(async()=>{await api('/t/documents/'+id,'DELETE');docsView()})}

// ================= محرر المذكرة =================
const NOTE_SAMPLE=`# الوحدة الأولى: المعادلات

## أولاً: المفهوم
المعادلة هي **جملة رياضية** تحتوي على علامة ==يساوي==. مثال: x^2^ + 3 = 12

> ملحوظة: تذكّر أن تنقل الحد إلى الطرف الآخر بإشارة مخالفة.

## ثانياً: خطوات الحل
1. اجمع الحدود المتشابهة
2. انقل المجهول إلى طرف واحد
3. اقسم على معامل المجهول

>> تنبيه: لا تقسم على صفر!

## ثالثاً: جدول مراجعة
| المعادلة | الحل |
|---|---|
| x + 2 = 5 | x = 3 |
| 2x = 10 | x = 5 |

- نقطة أولى للحفظ
- نقطة ثانية للحفظ`;
async function openNote(id){let d={id:null,title:'مذكرة جديدة',content:NOTE_SAMPLE,style:{...DE.DEFAULT_STYLE,...(lsGet('noteStyle')||{}),logo:(lsGet('noteStyle')||{}).logo||''}};
 if(id){const x=await api('/t/documents/'+id);d={id:x.id,title:x.title,content:x.content,style:{...DE.DEFAULT_STYLE,...x.style}}}
 const st=d.style;let dirty=false;
 view(head2(id?'تعديل المذكرة':'مذكرة جديدة','اكتب على اليمين، وشاهد الشكل النهائي على اليسار',`<button class="btn line" id="nb">رجوع</button><button class="btn line" id="ns">💾 حفظ</button><button class="btn" id="np">⬇ تنزيل PDF</button>`)+PRINT_TIP+
 `<div class="ed"><div class="col"><label class="form" style="font-weight:600;font-size:14px">عنوان المذكرة<input id="nt" maxlength="150" value="${esc(d.title)}"></label>
  <div><div class="tbar">${[['H1','# ','','عنوان'],['H2','## ','','عنوان فرعي'],['H3','### ','','عنوان صغير'],['B','**','**','غليظ'],['مظلل','==','==','مظلل'],['• نقاط','- ','','نقطة'],['1. ترقيم','1. ','','خطوة'],['ملحوظة','> ','','ملحوظة'],['تنبيه','>> ','','تنبيه'],['x²','^','^','2'],['H₂O','~','~','2']].map(([t,b,a,p],i)=>`<button type="button" data-ins="${i}" title="${t}">${t}</button>`).join('')}
   <button type="button" id="tt">جدول</button><button type="button" id="th">فاصل ---</button><button type="button" id="tp">صفحة جديدة ===</button><button type="button" id="tq">أسئلة من البنك</button></div>
  <textarea id="nx" class="edtxt" spellcheck="false">${esc(d.content)}</textarea></div>${styleHTML(st)}</div><div id="pv"></div></div>`);
 const pv=makePreview($('#pv')),ta=$('#nx'),title=$('#nt');
 const render=()=>pv.set(DE.noteHTML(st,title.value||'مذكرة',ta.value,S.name));
 let tm;const later=()=>{dirty=true;clearTimeout(tm);tm=setTimeout(render,350)};
 ta.oninput=title.oninput=later;bindStyle($('.ed'),st,later);render();
 const TB=[['# ','','عنوان'],['## ','','عنوان فرعي'],['### ','','عنوان صغير'],['**','**','نص'],['==','==','نص'],['- ','','نقطة'],['1. ','','خطوة'],['> ','','ملحوظة'],['>> ','','تنبيه'],['^','^','2'],['~','~','2']];
 const put=(b,a,ph)=>{const s=ta.selectionStart,e=ta.selectionEnd,sel=ta.value.slice(s,e)||ph,atLine=!a&&/^[#>\-1]/.test(b);
  const pre=atLine&&s>0&&ta.value[s-1]!=='\n'?'\n':'';const txt=pre+b+sel+a+(atLine?'\n':'');ta.setRangeText(txt,s,e,'end');ta.focus();later()};
 $$('[data-ins]').forEach(b=>b.onclick=()=>put(...TB[+b.dataset.ins]));
 $('#tt').onclick=()=>put('\n| العمود 1 | العمود 2 |\n|---|---|\n| | |\n','','');$('#th').onclick=()=>put('\n---\n','','');$('#tp').onclick=()=>put('\n===\n','','');
 $('#tq').onclick=()=>run(()=>pickBankQuestions(qs=>put('\n'+qText(qs,false)+'\n','','')));
 $('#np').onclick=()=>{render();setTimeout(()=>pv.print(),150)};
 const save=async()=>{lsSet('noteStyle',{school:st.school,subject:st.subject,logo:st.logo,footer:st.footer,watermark:st.watermark});
  const body={title:title.value.trim()||'مذكرة',content:ta.value,style:st};
  if(d.id)await api('/t/documents/'+d.id,'PUT',body);else d.id=(await api('/t/documents','POST',body)).id;dirty=false;toast('تم حفظ المذكرة')};
 $('#ns').onclick=()=>run(save);
 $('#nb').onclick=async()=>{if(!dirty||await ask('لديك تغييرات غير محفوظة. الخروج بدونها؟','خروج بدون حفظ'))docsView()};
 window.onbeforeunload=()=>dirty?'':undefined;dirty=false}

// ================= منشئ ورقة الامتحان / الواجب =================
async function paperBuilder(pre){const[bank,quizzes]=await Promise.all([api('/t/bank'),api('/t/quizzes')]);
 const saved=lsGet('paperCfg')||{};
 const P={kind:'exam',title:'',date:'',duration:'45',instructions:'اقرأ الأسئلة جيداً قبل الإجابة، واكتب بوضوح.',mMark:1,wMark:2,models:1,shuffleQ:false,shuffleO:false,optCols:2,key:true,student:true,showMarks:true,pasteTxt:'',writtenTxt:'',wLines:3,sel:new Set(),quizQs:[],...(saved.P||{}),sel:new Set(),quizQs:[],pasteTxt:'',writtenTxt:''};
 const st={...DE.DEFAULT_STYLE,...(saved.st||{})};
 if(pre){Object.assign(P,pre.p||{});if(pre.p?.quizQs)P.quizQs=pre.p.quizQs}
 view(head2('ورقة امتحان / واجب','اختر الأسئلة، حدّد الشكل، ونزّل ورقة جاهزة للطباعة',`<button class="btn line" onclick="setDocsTab('notes')">رجوع</button><button class="btn" id="pp">⬇ تنزيل PDF / طباعة</button>`)+subtabs([['notes','مذكراتي'],['paper','ورقة امتحان / واجب']],'paper','setDocsTab')+PRINT_TIP+
 `<div class="ed"><div class="col" style="display:grid;gap:14px">
 <div class="card" style="padding:14px"><b>بيانات الورقة</b><div class="form" style="margin-top:10px">
  <div class="row2"><label>النوع<select data-p="kind"><option value="exam" ${P.kind==='exam'?'selected':''}>امتحان</option><option value="homework" ${P.kind==='homework'?'selected':''}>واجب</option></select></label><label>العنوان<input data-p="title" maxlength="120" value="${esc(P.title)}" placeholder="امتحان شهر أكتوبر"></label></div>
  <div class="row2"><label id="dl">${P.kind==='homework'?'موعد التسليم':'التاريخ'}<input data-p="date" maxlength="40" value="${esc(P.date)}" placeholder="${esc(todayISO())}"></label><label id="du" style="${P.kind==='homework'?'display:none':''}">الزمن (دقيقة)<input data-p="duration" type="number" min="1" max="300" value="${esc(P.duration)}"></label></div>
  <label>التعليمات<textarea data-p="instructions" rows="2" maxlength="400">${esc(P.instructions)}</textarea></label></div></div>
 <div class="card" style="padding:14px"><b>الأسئلة</b>
  <div class="subtabs" id="st" style="margin-top:10px"><button class="on" data-s="bank">من البنك (${nf(bank.length)})</button><button data-s="paste">لصق أسئلة</button><button data-s="quiz">من اختبار</button><button data-s="wr">أسئلة مقالية</button></div>
  <div id="s-bank"><input id="bq" placeholder="ابحث…" style="margin-bottom:8px"><div class="chklist" id="bl" style="max-height:220px"></div><button class="linkbtn small" id="ba" type="button" style="margin-top:6px">تحديد الكل / إلغاء</button></div>
  <div id="s-paste" style="display:none"><textarea id="pt" rows="7" placeholder="الصق الأسئلة هنا بنفس صيغة الاستيراد (1) سؤال… أ) ب) ج)… الإجابة: ب)"></textarea><div class="mut small" id="pc"></div></div>
  <div id="s-quiz" style="display:none"><select id="pq"><option value="">اختر اختباراً منشوراً…</option>${quizzes.map(z=>`<option value="${z.id}">${esc(z.title)} (${nf(z.qcount)} سؤال)</option>`).join('')}</select><div class="mut small" id="pqc"></div></div>
  <div id="s-wr" style="display:none"><textarea id="wt" rows="5" placeholder="اكتب كل سؤال مقالي في سطر مستقل"></textarea><label style="margin-top:8px;display:grid;gap:4px;font-weight:600;font-size:14px">عدد أسطر الإجابة لكل سؤال<input data-p="wLines" type="number" min="0" max="15" value="${P.wLines}"></label></div>
  <div class="mut small" id="cnt" style="margin-top:8px"></div></div>
 <div class="card" style="padding:14px"><b>الشكل</b><div class="form" style="margin-top:10px">
  <div class="row2"><label>درجة السؤال الاختياري<input data-p="mMark" type="number" min="0.25" step="0.25" value="${P.mMark}"></label><label>درجة السؤال المقالي<input data-p="wMark" type="number" min="0.25" step="0.25" value="${P.wMark}"></label></div>
  <div class="row2"><label>عدد النماذج (A, B…)<select data-p="models">${[1,2,3,4].map(n=>`<option ${+P.models===n?'selected':''}>${n}</option>`).join('')}</select></label><label>شكل الاختيارات<select data-p="optCols"><option value="2" ${+P.optCols===2?'selected':''}>عمودان</option><option value="1" ${+P.optCols===1?'selected':''}>سطر لكل اختيار</option><option value="4" ${+P.optCols===4?'selected':''}>في سطر واحد</option></select></label></div>
  ${[['shuffleQ','اخلط ترتيب الأسئلة (النماذج الإضافية تُخلط تلقائياً)'],['shuffleO','اخلط ترتيب الاختيارات'],['key','إضافة ورقة الإجابات النموذجية للمعلم'],['student','سطور الاسم والفصل'],['showMarks','إظهار الدرجات']].map(([k,t])=>`<label style="display:flex;flex-direction:row;gap:8px;align-items:center;font-weight:600"><input type="checkbox" data-p="${k}" style="width:auto;accent-color:var(--teal)" ${P[k]?'checked':''}>${t}</label>`).join('')}</div></div>
 ${styleHTML(st)}</div><div id="pv"></div></div>`);
 const pv=makePreview($('#pv')),root=$('.ed');
 const mcqNow=()=>[...bank.filter(b=>P.sel.has(b.id)),...parseQuestions($('#pt').value).filter(q=>!qIssues(q).length),...P.quizQs].map(q=>({text:q.text,options:q.options,correct:q.correct}));
 const writtenNow=()=>$('#wt').value.split('\n').map(x=>x.trim()).filter(Boolean).map(text=>({text,lines:+P.wLines||0}));
 const render=()=>{if(!document.contains(root))return;const mcq=mcqNow(),w=writtenNow();$('#cnt').textContent=`${nf(mcq.length)} سؤال اختياري · ${nf(w.length)} مقالي · الدرجة الكلية ${nf(mcq.length*(+P.mMark||1)+w.length*(+P.wMark||1))}`;
  $('#pc').textContent=$('#pt').value.trim()?`تم التعرف على ${nf(parseQuestions($('#pt').value).filter(q=>!qIssues(q).length).length)} سؤال صالح`:'';
  pv.set(DE.paperHTML(st,{...P,mcq,written:w,school:st.school,subject:st.subject},S.name));
  lsSet('paperCfg',{P:{kind:P.kind,instructions:P.instructions,mMark:P.mMark,wMark:P.wMark,optCols:P.optCols,key:P.key,student:P.student,showMarks:P.showMarks,duration:P.duration,wLines:P.wLines},st:{...st}})};
 let tm;const later=()=>{clearTimeout(tm);tm=setTimeout(render,350)};
 $$('[data-p]',root).forEach(el=>el.oninput=el.onchange=()=>{const k=el.dataset.p;P[k]=el.type==='checkbox'?el.checked:el.value;
  if(k==='kind'){$('#dl').firstChild.textContent=P.kind==='homework'?'موعد التسليم':'التاريخ';$('#du').style.display=P.kind==='homework'?'none':''}later()});
 bindStyle(root,st,later);
 const drawBank=()=>{const f=$('#bq').value.trim();$('#bl').innerHTML=bank.filter(b=>!f||b.text.includes(f)||b.topic.includes(f)).map(b=>`<label class="chk"><input type="checkbox" value="${b.id}" ${P.sel.has(b.id)?'checked':''}><span>${esc(b.text)} <span class="mut small">${b.topic?'· '+esc(b.topic):''}</span></span></label>`).join('')||'<div class="empty">البنك فارغ أو لا نتائج. استورد أسئلتك من صفحة الاختبارات</div>';
  $$('#bl input').forEach(i=>i.onchange=()=>{i.checked?P.sel.add(+i.value):P.sel.delete(+i.value);later()})};
 drawBank();$('#bq').oninput=drawBank;
 $('#ba').onclick=()=>{const bs=$$('#bl input'),on=bs.some(b=>!b.checked);bs.forEach(b=>{b.checked=on;on?P.sel.add(+b.value):P.sel.delete(+b.value)});later()};
 $$('#st button').forEach(b=>b.onclick=()=>{$$('#st button').forEach(x=>x.classList.toggle('on',x===b));['bank','paste','quiz','wr'].forEach(k=>$('#s-'+k).style.display=k===b.dataset.s?'':'none')});
 $('#pt').oninput=later;$('#wt').oninput=later;
 const loadQuiz=id=>run(async()=>{if(!id){P.quizQs=[];$('#pqc').textContent='';return later()}const z=await api('/t/quizzes/'+id);P.quizQs=z.questions;$('#pqc').textContent=`تمت إضافة ${nf(z.questions.length)} سؤال`;if(!P.title)$('[data-p=title]').value=P.title=z.title;later()});
 $('#pq').onchange=e=>loadQuiz(e.target.value);
 if(pre?.writtenTxt)$('#wt').value=pre.writtenTxt;if(pre?.pasteTxt)$('#pt').value=pre.pasteTxt;
 if(pre?.quizId){$('#pq').value=pre.quizId;loadQuiz(pre.quizId)}
 $('#pp').onclick=()=>{if(!mcqNow().length&&!writtenNow().length)return toast('اختر سؤالاً واحداً على الأقل',true);render();setTimeout(()=>pv.print(),150)};
 render()}

// ---------- اختصارات من الواجبات والاختبارات ----------
const paperFromHw=id=>run(async()=>{const a=await api('/t/assignments/'+id),ok=parseQuestions(a.description).filter(q=>!qIssues(q).length);
 docsPrefill={tab:'paper',p:{kind:'homework',title:a.title,date:new Date(a.due_at).toLocaleDateString('ar-EG',{timeZone:'Africa/Cairo',day:'numeric',month:'long'}),showMarks:true},...(ok.length?{pasteTxt:a.description}:{writtenTxt:a.description})};
 location.hash==='#docs'?go():(location.hash='#docs')});
const paperFromQuiz=id=>run(async()=>{const z=await api('/t/quizzes/'+id);docsPrefill={tab:'paper',quizId:id,p:{kind:'exam',title:z.title,duration:String(z.duration_min)}};location.hash==='#docs'?go():(location.hash='#docs')});
