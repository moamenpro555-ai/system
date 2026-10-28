// استيراد الأسئلة دفعة واحدة: لصق نص / ملف Word / Excel / CSV / TXT
const LIBS={xlsx:['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js','https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'],
 mammoth:['https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js','https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js']};
async function loadLib(name,global){if(window[global])return window[global];
 for(const u of LIBS[name]){try{await new Promise((ok,no)=>{const s=document.createElement('script');s.src=u;s.onload=ok;s.onerror=no;document.head.append(s)});if(window[global])return window[global]}catch{}}
 throw new Error('تعذر تحميل أداة قراءة الملف (تحقق من الإنترنت) — الصق النص بدلاً من ذلك')}
function parseCSV(t){const rows=[];let r=[],c='',q=false;t=t.replace(/^﻿/,'');
 for(let i=0;i<t.length;i++){const ch=t[i];
  if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++}else q=false}else c+=ch}
  else if(ch==='"')q=true;else if(ch===','||ch===';'||ch==='\t'){r.push(c);c=''}
  else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;r.push(c);rows.push(r);r=[];c=''}else c+=ch}
 if(c||r.length){r.push(c);rows.push(r)}return rows}
async function questionsFromFile(file){const n=file.name.toLowerCase();
 if(n.endsWith('.docx')){const m=await loadLib('mammoth','mammoth');const r=await m.extractRawText({arrayBuffer:await file.arrayBuffer()});return parseQuestions(r.value)}
 if(n.endsWith('.xlsx')||n.endsWith('.xls')){const X=await loadLib('xlsx','XLSX'),wb=X.read(await file.arrayBuffer(),{type:'array'});
  return rowsToQuestions(X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:''}))}
 if(n.endsWith('.csv'))return rowsToQuestions(parseCSV(await file.text()));
 if(n.endsWith('.txt'))return parseQuestions(await file.text());
 throw new Error('نوع الملف غير مدعوم. استخدم Word أو Excel أو CSV أو TXT')}
function downloadTemplate(){const rows=[['السؤال','أ','ب','ج','د','الإجابة الصحيحة','الموضوع'],['ما ناتج 2 + 2؟','3','4','5','6','ب','جمع'],['عاصمة مصر؟','القاهرة','الإسكندرية','','','أ','جغرافيا']];
 const csv='﻿'+rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\r\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='قالب-الأسئلة.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}

const SAMPLE=`1) ما ناتج 2 + 2؟
أ) 3
ب) 4 *
ج) 5

2) عاصمة مصر؟
أ) القاهرة
ب) الإسكندرية
ج) أسوان
الإجابة: أ`;
let impQs=[];
const qIssues=q=>{const i=[];if(q.options.length<2)i.push('يحتاج اختيارين على الأقل');if(q.options.length>6)i.push('أكثر من ٦ اختيارات');if(!q.text.trim())i.push('نص السؤال فارغ');if(q.options.some(o=>!o.trim()))i.push('اختيار فارغ');if(!i.length&&(q.correct==null||q.correct>=q.options.length))i.push('حدد الإجابة الصحيحة');return i};

async function importQuestions(withQuiz=false){const gs=await api('/t/groups');impQs=[];
 const m=wide(modal('استيراد أسئلة دفعة واحدة',`
 <div class="hint"><b>الطريقة الأسرع:</b> انسخ أسئلتك من Word أو PDF والصقها هنا، أو ارفع ملف Word / Excel. سنحوّلها لأسئلة جاهزة وتراجعها قبل الحفظ.</div>
 <div class="subtabs" id="it"><button class="on" data-t="paste">لصق نص</button><button data-t="file">رفع ملف</button></div>
 <div id="ipaste"><textarea id="itxt" rows="9" dir="rtl" placeholder="${esc(SAMPLE)}" style="font-size:15px"></textarea>
  <div class="mut small" style="margin-top:6px">ضع رقماً قبل كل سؤال، وحرفاً (أ ب ج د) قبل كل اختيار. حدّد الصحيح بعلامة <b>*</b> بجانبه أو بسطر <b>الإجابة: ب</b>. <button class="linkbtn" id="isample" type="button">املأ مثالاً</button></div></div>
 <div id="ifile" style="display:none"><label class="qopt" style="justify-content:center;border-style:dashed;padding:26px"><input type="file" id="ifi" accept=".docx,.xlsx,.xls,.csv,.txt" style="display:none"><span>📄 اختر ملف Word (.docx) أو Excel (.xlsx) أو CSV أو TXT</span></label>
  <div class="mut small" style="margin-top:6px">ملف Excel/CSV بالأعمدة: السؤال | أ | ب | ج | د | الإجابة الصحيحة | الموضوع. <button class="linkbtn" id="itpl" type="button">تنزيل القالب</button></div></div>
 <div id="ipv" style="margin-top:14px"></div>
 <form class="form" id="ifm" style="margin-top:14px;display:none"><div class="row2"><label>الموضوع (اختياري، لكل الأسئلة)<input name="topic" maxlength="80"></label>
  <label style="align-self:end;display:flex;gap:8px;align-items:center;flex-direction:row"><input type="checkbox" name="mk" style="width:auto;accent-color:var(--teal)" ${withQuiz?'checked':''}>إنشاء اختبار منها الآن</label></div>
  <div id="iq" class="row2" style="display:${withQuiz?'grid':'none'}"><label>عنوان الاختبار<input name="title" maxlength="120"></label><label>المجموعة<select name="group_id">${groupOptions(gs,'','كل الطلاب')}</select></label><label>المدة (دقائق)<input name="duration_min" type="number" min="1" max="300" value="20"></label></div>
  <button class="btn" id="isave">إضافة للبنك</button></form>`),1000);
 const pv=$('#ipv',m),form=$('#ifm',m);
 const summary=()=>{const ok=impQs.filter(q=>!qIssues(q).length).length,bad=impQs.length-ok;
  $('#isum',m)&&($('#isum',m).innerHTML=`<b>${nf(ok)}</b> سؤال جاهز${bad?` · <span style="color:var(--red)">${nf(bad)} يحتاج تعديلاً (لن يُضاف قبل إصلاحه)</span>`:''}`);
  $('#isave',m).textContent=ok?`إضافة ${nf(ok)} سؤال${$('[name=mk]',m).checked?' وإنشاء الاختبار':' للبنك'}`:'لا توجد أسئلة جاهزة';$('#isave',m).disabled=!ok;
  $$('.qissue',m).forEach(e=>{const q=impQs[+e.dataset.i],is=qIssues(q);e.textContent=is.join(' · ');e.closest('.card').style.borderColor=is.length?'#f0c4c4':''})};
 const render=()=>{form.style.display=impQs.length?'grid':'none';
  pv.innerHTML=impQs.length?`<div class="ch"><div id="isum"></div></div><div style="max-height:380px;overflow:auto;display:grid;gap:10px;padding:2px">${impQs.map((q,i)=>`<div class="card" style="padding:14px"><div class="ch"><b>${nf(i+1)}</b><span class="qissue small" data-i="${i}" style="color:var(--red)"></span><button type="button" class="btn sm red" data-del="${i}">حذف</button></div>
   <input data-qt="${i}" value="${esc(q.text)}" aria-label="نص السؤال" style="margin-bottom:8px">
   ${q.options.map((o,j)=>`<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px"><input type="radio" name="c${i}" data-c="${i}:${j}" style="width:auto;accent-color:var(--teal)" ${q.correct===j?'checked':''} aria-label="الإجابة الصحيحة"><input data-o="${i}:${j}" value="${esc(o)}"><button type="button" class="x2 chip2" style="padding:0 8px" data-rm="${i}:${j}" aria-label="حذف الاختيار">×</button></div>`).join('')}
   ${q.options.length<6?`<button type="button" class="linkbtn small" data-add="${i}">+ اختيار</button>`:''}</div>`).join('')}</div>`:impQs.length===0&&m._tried?'<div class="empty">لم نتعرف على أي سؤال. تأكد من الترقيم والحروف (أ ب ج د)</div>':'';
  $$('[data-del]',pv).forEach(b=>b.onclick=()=>{impQs.splice(+b.dataset.del,1);render()});
  $$('[data-qt]',pv).forEach(b=>b.oninput=()=>{impQs[+b.dataset.qt].text=b.value;summary()});
  $$('[data-o]',pv).forEach(b=>b.oninput=()=>{const[i,j]=b.dataset.o.split(':').map(Number);impQs[i].options[j]=b.value;summary()});
  $$('[data-c]',pv).forEach(b=>b.onchange=()=>{const[i,j]=b.dataset.c.split(':').map(Number);impQs[i].correct=j;summary()});
  $$('[data-rm]',pv).forEach(b=>b.onclick=()=>{const[i,j]=b.dataset.rm.split(':').map(Number),q=impQs[i];q.options.splice(j,1);q.correct=q.correct===j?null:q.correct>j?q.correct-1:q.correct;render()});
  $$('[data-add]',pv).forEach(b=>b.onclick=()=>{impQs[+b.dataset.add].options.push('');render()});
  if(impQs.length)summary()};
 const fromText=()=>{m._tried=true;impQs=parseQuestions($('#itxt',m).value);render()};
 let tm;$('#itxt',m).oninput=()=>{clearTimeout(tm);tm=setTimeout(fromText,350)};
 $('#isample',m).onclick=()=>{$('#itxt',m).value=SAMPLE;fromText()};
 $('#itpl',m).onclick=downloadTemplate;
 $$('#it button',m).forEach(b=>b.onclick=()=>{$$('#it button',m).forEach(x=>x.classList.toggle('on',x===b));$('#ipaste',m).style.display=b.dataset.t==='paste'?'':'none';$('#ifile',m).style.display=b.dataset.t==='file'?'':'none'});
 $('#ifi',m).onchange=e=>{const f=e.target.files[0];if(!f)return;run(async()=>{toast('جارٍ قراءة الملف…');impQs=await questionsFromFile(f);m._tried=true;render()})};
 form.querySelector('[name=mk]').onchange=e=>{$('#iq',m).style.display=e.target.checked?'grid':'none';summary()};
 form.onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(form)),ok=impQs.filter(q=>!qIssues(q).length);if(!ok.length)return;
  const mk=!!form.querySelector('[name=mk]').checked;if(mk&&!f.title?.trim())return toast('اكتب عنوان الاختبار',true);
  run(async()=>{const r=await api('/t/bank/bulk','POST',{questions:ok.map(q=>({text:q.text.trim(),options:q.options.map(o=>o.trim()),correct:q.correct,topic:f.topic||q.topic||''}))});
   if(mk)await api('/t/quizzes','POST',{title:f.title,group_id:f.group_id||null,duration_min:+f.duration_min||20,question_ids:r.ids});
   m.close();toast(mk?`تمت إضافة ${nf(ok.length)} سؤال وإنشاء الاختبار`:`تمت إضافة ${nf(ok.length)} سؤال للبنك`);quizTab=mk?'quizzes':'bank';quizzesView()})}}
