// تحويل نص أسئلة (ملصوق من Word/PDF أو مستخرج من ملف) إلى أسئلة اختيار من متعدد
// الصيغ المدعومة: ترقيم (1) 1. س1: ١-)، اختيارات (أ) ب) ج) د) أو a) b) c))، حتى لو في سطر واحد،
// الإجابة الصحيحة: علامة * أو ✓ بجانب الاختيار، أو سطر "الإجابة: ب"
(function(root){
const DIG='٠١٢٣٤٥٦٧٨٩',norm=s=>String(s).replace(/[٠-٩]/g,d=>DIG.indexOf(d)).replace(/[‎‏‪-‮ ]/g,' ').replace(/ـ/g,'');
const LET={'أ':0,'ا':0,'إ':0,'ب':1,'ج':2,'د':3,'ه':4,'هـ':4,'و':5,'a':0,'b':1,'c':2,'d':3,'e':4,'f':5};
const letIdx=c=>{c=c.trim();return c in LET?LET[c]:LET[c.toLowerCase()]};
const SEP='[\\)\\.\\-–:،]';
const OPT=new RegExp('^\\s*\\(?\\s*(أ|ا|إ|ب|ج|د|هـ|ه|و|[a-fA-F])\\s*'+SEP+'\\s*(.*)$');
const QST=new RegExp('^\\s*(?:(?:سؤال|س|السؤال|Q|q)\\s*)?(\\d{1,3})\\s*'+SEP+'\\s*(.*)$');
const ANS=/^\s*(?:الإجابة|الاجابة|إجابة|اجابة|الحل|Answer|Ans)(?:\s*الصحيحة)?\s*[:：\-]?\s*(.+)$/i;
const MARK=/(?:\s*[*✓✔√]\s*|\s*\(\s*(?:صح|صحيحة|✓)\s*\)\s*)$/;
const LEADMARK=/^\s*[*✓✔√]\s*/;
// يفصل اختيارات مكتوبة في سطر واحد: "أ) 3  ب) 4  ج) 5" بشرط تسلسل الحروف
function splitInline(line){
 const re=/(^|\s)\(?(أ|ب|ج|د|هـ|ه|[a-fA-F])\s*[\)\-]\s+/g,hits=[];let m;
 while((m=re.exec(line)))hits.push({i:m.index+m[1].length,end:re.lastIndex,idx:letIdx(m[2])});
 const seq=[];for(const h of hits){if(h.idx===seq.length)seq.push(h)}
 if(seq.length<2)return null;
 return seq.map((h,k)=>line.slice(h.end,k+1<seq.length?seq[k+1].i:undefined).trim())}
function parseQuestions(raw){
 const lines=norm(raw).split(/\r?\n/),out=[],warnings=[];let cur=null,blank=false,pendingAns=null;
 const push=()=>{if(!cur)return;cur.text=cur.text.replace(/\s+/g,' ').trim();cur.options=cur.options.map(o=>o.replace(/\s+/g,' ').trim());out.push(cur);cur=null};
 const start=t=>{push();cur={text:t,options:[],correct:null,topic:''}};
 const addOpt=txt=>{let t=txt.trim(),ok=false;
  if(LEADMARK.test(t)){ok=true;t=t.replace(LEADMARK,'')}
  if(MARK.test(t)){ok=true;t=t.replace(MARK,'')}
  cur.options.push(t.trim());if(ok)cur.correct=cur.options.length-1};
 for(const line0 of lines){const line=line0.trim();
  if(!line){blank=true;continue}
  const a=ANS.exec(line);
  if(a&&cur&&cur.options.length){const v=a[1].trim().replace(MARK,'').replace(/[\.\)\(]/g,'').trim();
   let i=letIdx(v);if(i===undefined&&/^\d$/.test(v))i=+v-1;
   if(i===undefined||i>=cur.options.length){const k=cur.options.findIndex(o=>o===v);i=k>=0?k:undefined}
   if(i!==undefined)cur.correct=i;blank=false;continue}
  const q=QST.exec(line);
  // رقم بعده نص: سؤال جديد (إلا لو كان داخل اختيارات سؤال حالي وبصيغة حرف)
  if(q&&q[2]&&!(cur&&cur.options.length&&OPT.test(line)&&!/^\d/.test(line))){start(q[2]);blank=false;continue}
  const o=OPT.exec(line);
  if(o&&cur&&(o[2]||cur.options.length)){
   const inl=splitInline(line);
   if(inl&&letIdx(o[1])===0){inl.forEach(addOpt)} 
   else if(cur.options.length>0&&letIdx(o[1])!==cur.options.length&&letIdx(o[1])!==undefined&&!inl){ // حرف غير متسلسل: غالباً جزء من نص
     cur.options[cur.options.length-1]+=' '+line}
   else addOpt(o[2]);
   blank=false;continue}
  // سطر عادي
  if(!cur||(blank&&cur.options.length>=2)){start(line)}
  else if(cur.options.length)cur.options[cur.options.length-1]+=' '+line;
  else cur.text+=' '+line;
  blank=false}
 push();
 out.forEach((x,i)=>{x.n=i+1;x.issues=[];
  if(x.options.length<2)x.issues.push('يحتاج اختيارين على الأقل');
  if(x.options.length>6)x.issues.push('أكثر من ٦ اختيارات');
  if(x.options.some(o=>!o))x.issues.push('اختيار فارغ');
  if(x.correct==null&&!x.issues.length)x.issues.push('حدد الإجابة الصحيحة')});
 return out}

// تحويل صفوف Excel/CSV: السؤال | أ | ب | ج | د | الإجابة الصحيحة | الموضوع
function rowsToQuestions(rows){
 const out=[];rows=rows.filter(r=>r&&r.some(c=>String(c??'').trim()));
 if(rows.length&&/سؤال|question/i.test(String(rows[0][0])))rows=rows.slice(1);
 for(const r of rows){const c=r.map(x=>norm(String(x??'')).trim());
  const text=c[0],options=c.slice(1,5).filter(Boolean),ans=c[5]||'',topic=c[6]||'';
  let correct=null;if(ans){let i=letIdx(ans.replace(/[\.\)\(]/g,''));if(i===undefined&&/^\d$/.test(ans))i=+ans-1;if(i===undefined){const k=options.findIndex(o=>o===ans);i=k>=0?k:undefined}correct=i??null}
  out.push({text,options,correct,topic,issues:[]})}
 out.forEach((x,i)=>{x.n=i+1;if(!x.text)x.issues.push('نص السؤال فارغ');if(x.options.length<2)x.issues.push('يحتاج اختيارين على الأقل');else if(x.correct==null||x.correct>=x.options.length)x.issues.push('حدد الإجابة الصحيحة')});
 return out}
root.parseQuestions=parseQuestions;root.rowsToQuestions=rowsToQuestions;
if(typeof module!=='undefined')module.exports={parseQuestions,rowsToQuestions};
})(typeof window!=='undefined'?window:globalThis);
