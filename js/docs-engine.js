// محرك المستندات: تحويل النص المنسّق إلى صفحة A4 جاهزة للطباعة/PDF بالقالب والخط واللون المختار
(function(root){
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LET=['أ','ب','ج','د','هـ','و'];
const FONTS=['Cairo','Tajawal','Almarai','Amiri','Noto Naskh Arabic','Noto Kufi Arabic','El Messiri','Reem Kufi'];
const TPLS={modern:{name:'عصري',font:'Cairo',color:'#1f7a8c'},classic:{name:'كلاسيكي',font:'Amiri',color:'#1f2937'},minimal:{name:'بسيط',font:'Tajawal',color:'#374151'},bright:{name:'ملوّن',font:'Cairo',color:'#e11d48'}};
const SWATCHES=['#1f7a8c','#12233f','#7c3aed','#e11d48','#ea580c','#16a34a','#111827'];
const DEFAULT_STYLE={tpl:'modern',color:'#1f7a8c',font:'Cairo',size:16,lh:1.9,cols:1,border:false,header:true,school:'',subject:'',date:'',footer:'',watermark:'',logo:''};

// ---------- نص منسّق -> HTML ----------
const inline=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/==(.+?)==/g,'<mark>$1</mark>').replace(/__(.+?)__/g,'<u>$1</u>').replace(/\^(.+?)\^/g,'<sup>$1</sup>').replace(/~(.+?)~/g,'<sub>$1</sub>').replace(/`(.+?)`/g,'<code>$1</code>');
const OPTL=/^\s*(أ|ب|ج|د|هـ|و)\s*[\)\-]\s+/,UL=/^\s*[-*•]\s+/,OL=/^\s*(\d+)[\.\)]\s+/;
const isBlock=l=>/^#{1,3}\s/.test(l)||/^>/.test(l)||UL.test(l)||OL.test(l)||/^\s*\|/.test(l)||OPTL.test(l)||/^===+\s*$/.test(l.trim())||/^---+\s*$/.test(l.trim());
function md(src){const L=String(src||'').replace(/\r/g,'').split('\n');let h='',i=0;
 const take=re=>{const a=[];while(i<L.length&&re.test(L[i])){a.push(L[i]);i++}return a};
 while(i<L.length){const l=L[i],t=l.trim();let m;
  if(!t){i++;continue}
  if(/^===+$/.test(t)){h+='<div class="pb"></div>';i++;continue}
  if(/^---+$/.test(t)){h+='<hr>';i++;continue}
  if((m=/^(#{1,3})\s+(.*)$/.exec(l))){h+=`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`;i++;continue}
  if(/^>>\s?/.test(l)){h+=`<div class="box warn">${take(/^>>\s?/).map(x=>inline(x.replace(/^>>\s?/,''))).join('<br>')}</div>`;continue}
  if(/^>\s?/.test(l)){h+=`<div class="box">${take(/^>(?!>)\s?/).map(x=>inline(x.replace(/^>\s?/,''))).join('<br>')}</div>`;continue}
  if(UL.test(l)){h+=`<ul>${take(UL).map(x=>`<li>${inline(x.replace(UL,''))}</li>`).join('')}</ul>`;continue}
  if((m=OL.exec(l))){h+=`<ol start="${m[1]}">${take(OL).map(x=>`<li>${inline(x.replace(OL,''))}</li>`).join('')}</ol>`;continue}
  if(/^\s*\|/.test(l)){const rows=take(/^\s*\|/).map(r=>r.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim()));
   const hasHead=rows.length>1&&rows[1].every(c=>/^:?-{2,}:?$/.test(c));const body=hasHead?[rows[0],...rows.slice(2)]:rows;
   h+=`<table class="tb">${body.map((r,k)=>`<tr>${r.map(c=>hasHead&&k===0?`<th>${inline(c)}</th>`:`<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</table>`;continue}
  if(OPTL.test(l)){h+=`<div class="opts">${take(OPTL).map(x=>`<div>${inline(x)}</div>`).join('')}</div>`;continue}
  const a=[];while(i<L.length&&L[i].trim()&&(a.length===0||!isBlock(L[i]))){a.push(L[i]);i++}
  h+=`<p>${a.map(inline).join('<br>')}</p>`}
 return h}

// ---------- الأنماط ----------
const fontLink=st=>{const fs=[...new Set([st.font||'Cairo','Cairo'])];return `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fs.map(f=>'family='+encodeURIComponent(f).replace(/%20/g,'+')+':wght@400;700').join('&')}&display=swap">`};
const cssStr=s=>String(s||'').replace(/[\\"\n\r]/g,' ').slice(0,80);
function css(st){const a=/^#[0-9a-f]{6}$/i.test(st.color)?st.color:'#1f7a8c',tpl=TPLS[st.tpl]?st.tpl:'modern',font=(FONTS.includes(st.font)?st.font:'Cairo');
 const size=Math.min(24,Math.max(11,+st.size||16)),lh=Math.min(2.6,Math.max(1.3,+st.lh||1.9));
 const T={
 modern:`h1{background:var(--a);color:#fff;border-radius:10px;padding:6px 16px;font-size:1.5em;margin:18px 0 10px}
  h2{color:var(--a);border-right:6px solid var(--a);padding-right:10px;font-size:1.25em;margin:16px 0 8px}
  h3{color:var(--a);font-size:1.08em;margin:12px 0 6px}
  .box{background:color-mix(in srgb,var(--a) 10%,#fff);border:1px solid color-mix(in srgb,var(--a) 35%,#fff);border-right:5px solid var(--a);border-radius:8px}
  .tb th{background:var(--a);color:#fff}.dh{border-bottom:3px solid var(--a)}`,
 classic:`h1{text-align:center;border-top:3px double var(--a);border-bottom:3px double var(--a);padding:6px;font-size:1.5em;margin:18px 0 12px;color:var(--a)}
  h2{border-bottom:2px solid var(--a);padding-bottom:2px;font-size:1.25em;margin:16px 0 8px;color:var(--a)}h3{font-size:1.1em;margin:12px 0 6px;text-decoration:underline}
  .box{border:1.5px solid var(--a);padding:8px 12px}.tb th{background:#eee;color:#111;border:1.5px solid var(--a)}.tb td{border:1.5px solid var(--a)}.dh{border-bottom:2px double var(--a);text-align:center}`,
 minimal:`h1{font-size:1.5em;border-bottom:1px solid #999;padding-bottom:4px;margin:18px 0 10px}h2{font-size:1.25em;margin:16px 0 8px}h3{font-size:1.08em;margin:12px 0 6px}
  .box{background:#f5f5f5;border-radius:4px;border-right:3px solid #888}.tb th{background:#f0f0f0}.dh{border-bottom:1px solid #999}`,
 bright:`h1{background:linear-gradient(90deg,var(--a),color-mix(in srgb,var(--a) 55%,#f59e0b));color:#fff;border-radius:22px;padding:8px 22px;font-size:1.55em;margin:20px 0 12px;box-shadow:0 3px 0 color-mix(in srgb,var(--a) 60%,#000)}
  h2{display:inline-block;background:color-mix(in srgb,var(--a) 14%,#fff);color:var(--a);border-radius:99px;padding:3px 18px;font-size:1.2em;margin:16px 0 8px}h3{color:var(--a);font-size:1.1em;margin:12px 0 6px}
  .box{background:color-mix(in srgb,#f59e0b 14%,#fff);border:2px dashed #f59e0b;border-radius:14px}.box.warn{background:#fee2e2;border-color:#ef4444}
  li::marker{color:var(--a);font-weight:700}.tb th{background:var(--a);color:#fff}.dh{border-bottom:4px dotted var(--a)}`}[tpl];
 const foot=st.footer?`@bottom-left{content:"${cssStr(st.footer)}";font:11px '${font}';color:#666}`:'';
 return `:root{--a:${a}}
@page{size:A4;margin:${st.border?'10mm':'14mm 14mm 16mm'};@bottom-center{content:counter(page,arabic-indic) " / " counter(pages,arabic-indic);font:11px '${font}';color:#666}${foot}}
*{box-sizing:border-box}html{direction:rtl}
body{margin:0;font-family:'${font}',Tahoma,Arial,sans-serif;font-size:${size}px;line-height:${lh};color:#111;background:#e8ebf1;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.sheet{position:relative;background:#fff;width:210mm;min-height:297mm;margin:12px auto;padding:14mm;box-shadow:0 2px 14px #0003;${st.border?`border:2.5px solid var(--a);border-radius:6px;box-decoration-break:clone;-webkit-box-decoration-break:clone;`:''}}
@media print{body{background:#fff}.sheet{width:auto;min-height:0;margin:0;box-shadow:none;padding:${st.border?'5mm':'0'}}.wm{position:fixed!important}}
.body{${+st.cols===2?'column-count:2;column-gap:10mm;':''}}h1{column-span:all}
h1,h2,h3{break-after:avoid;font-weight:800}p{margin:0 0 8px}ul,ol{margin:0 0 8px;padding-right:26px}li{margin-bottom:2px}
.box{padding:8px 14px;margin:8px 0;break-inside:avoid}.box.warn{background:#fef2f2;border-color:#ef4444;border-right-color:#ef4444}
.tb{width:100%;border-collapse:collapse;margin:8px 0;break-inside:avoid}.tb th,.tb td{border:1px solid #bbb;padding:4px 10px;text-align:center}
mark{background:#fde68a;padding:0 3px;border-radius:3px}code{direction:ltr;unicode-bidi:embed;background:#f3f4f6;border-radius:4px;padding:0 4px}hr{border:0;border-top:1px dashed #aaa;margin:12px 0}
.pb{break-after:page;height:0}.opts{display:grid;grid-template-columns:repeat(2,1fr);gap:0 14px;margin:0 24px 8px}
.dh{display:flex;align-items:center;gap:14px;padding-bottom:8px;margin-bottom:10px}.dh img{height:64px;max-width:120px;object-fit:contain}.dh .t{flex:1}.dh .school{font-size:1.3em;font-weight:800;color:var(--a)}.dh .sub{color:#555;font-size:.9em}.dh .meta{color:#555;font-size:.85em;text-align:left}
.wm{position:absolute;top:42%;left:50%;transform:translate(-50%,-50%) rotate(-28deg);font-size:84px;font-weight:800;color:rgba(0,0,0,.055);white-space:nowrap;pointer-events:none;z-index:0}
${T}
${PAPER_CSS}`}
const PAPER_CSS=`
.ph{display:grid;grid-template-columns:1fr auto;gap:12px;border:2px solid var(--a);border-radius:10px;padding:10px 14px;margin-bottom:8px}.ph .ttl{font-size:1.35em;font-weight:800;color:var(--a)}.ph .m{font-size:.88em;color:#444;line-height:1.7}.ph .info{text-align:left;font-size:.88em;white-space:nowrap}
.mdl{display:inline-block;background:var(--a);color:#fff;border-radius:6px;padding:0 12px;font-weight:800;margin-right:6px}
.stu{display:flex;gap:18px;flex-wrap:wrap;margin:8px 0}.stu span{flex:1;min-width:30%;border-bottom:1.5px dotted #666;padding-bottom:2px;white-space:nowrap}
.inst{background:#f6f7fa;border-radius:8px;padding:6px 12px;margin:8px 0 12px;font-size:.9em}
.sec{font-weight:800;color:var(--a);border-bottom:1.5px solid var(--a);margin:14px 0 8px;padding-bottom:2px}
.q{break-inside:avoid;margin-bottom:12px}.qt{display:flex;gap:8px;align-items:baseline}.qt .n{font-weight:800;min-width:22px}.qt .tx{flex:1}.qt .mk{color:#666;font-size:.82em;white-space:nowrap}
.q .ops{display:grid;gap:2px 14px;margin:4px 30px 0}.ops.c1{grid-template-columns:1fr}.ops.c2{grid-template-columns:1fr 1fr}.ops.c4{grid-template-columns:repeat(4,1fr)}
.bub{display:inline-grid;place-items:center;width:1.5em;height:1.5em;border:1.5px solid #333;border-radius:50%;font-size:.8em;margin-left:6px;font-weight:700}
.ln{border-bottom:1.5px dotted #888;height:9mm}.key{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 14px}.key span{border:1px solid #bbb;border-radius:6px;padding:1px 10px;min-width:64px;text-align:center}
.pgbreak{break-before:page}
`;
// ---------- رأس المستند ----------
const okUrl=u=>/^https?:\/\/[^\s"'<>]+$/i.test(u||'')?u:'';
function headerHTML(st,title,teacher){if(!st.header)return `<h1 class="dtitle">${esc(title)}</h1>`;
 return `<header class="dh">${okUrl(st.logo)?`<img src="${esc(st.logo)}" alt="">`:''}<div class="t"><div class="school">${esc(st.school||title)}</div><div class="sub">${[st.school?title:'',st.subject,teacher].filter(Boolean).map(esc).join(' · ')}</div></div><div class="meta">${esc(st.date||'')}</div></header>`}
function wrap(st,bodyHTML,title){return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(title)}</title>${fontLink(st)}<style>${css(st)}</style></head><body><div class="sheet">${st.watermark?`<div class="wm">${esc(st.watermark)}</div>`:''}${bodyHTML}</div></body></html>`}
function noteHTML(st,title,content,teacher){return wrap(st,headerHTML(st,title,teacher)+`<div class="body">${md(content)}</div>`,title)}

// ---------- ورقة امتحان / واجب ----------
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function shuffled(arr,seed){const r=rng(seed),a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function paperHTML(st,p,teacher){ // p: {kind,title,school,subject,date,duration,instructions,mcq:[{text,options,correct}],written:[{text,lines}],mMark,wMark,models,shuffleQ,shuffleO,optCols,key,student,showMarks}
 const isHw=p.kind==='homework',nM=Math.min(4,Math.max(1,+p.models||1)),mM=+p.mMark||1,wM=+p.wMark||1;
 const total=Math.round((p.mcq.length*mM+p.written.length*wM)*100)/100;
 let h='';const keys=[];
 for(let k=0;k<nM;k++){
  let qs=p.mcq.map((q,i)=>({...q,oi:q.options.map((_,j)=>j)}));
  if(k>0||p.shuffleQ)qs=shuffled(qs,1000+k*77+qs.length);
  if(k>0||p.shuffleO)qs=qs.map((q,i)=>{const ord=shuffled(q.options.map((_,j)=>j),k*131+i*7+5);return{...q,options:ord.map(j=>q.options[j]),correct:ord.indexOf(q.correct)}});
  const label=nM>1?`<span class="mdl">نموذج ${'ABCD'[k]}</span>`:'';
  h+=`<div class="${k?'pgbreak':''}"><div class="ph"><div><div class="ttl">${esc(p.title||(isHw?'واجب':'امتحان'))} ${label}</div><div class="m">${[p.school,p.subject,teacher?'أ. '+teacher:''].filter(Boolean).map(esc).join(' · ')}</div></div>
   <div class="info">${p.date?`${isHw?'موعد التسليم':'التاريخ'}: ${esc(p.date)}<br>`:''}${!isHw&&p.duration?`الزمن: ${esc(p.duration)} دقيقة<br>`:''}${p.showMarks!==false?`الدرجة الكلية: ${total}`:''}</div></div>
   ${p.student!==false?`<div class="stu"><span>الاسم:</span><span>الفصل / المجموعة:</span>${isHw?'':'<span>رقم الجلوس:</span>'}</div>`:''}
   ${p.instructions?`<div class="inst">${esc(p.instructions).replace(/\n/g,'<br>')}</div>`:''}`;
  if(qs.length){let n=0;h+=(p.written.length?`<div class="sec">${p.mcqTitle||'أولاً: اختر الإجابة الصحيحة'}</div>`:'')+qs.map(q=>{n++;
   return `<div class="q"><div class="qt"><span class="n">${n}.</span><span class="tx">${esc(q.text)}</span>${p.showMarks!==false?`<span class="mk">(${mM})</span>`:''}</div><div class="ops c${p.optCols||2}">${q.options.map((o,j)=>`<div><span class="bub">${LET[j]}</span>${esc(o)}</div>`).join('')}</div></div>`}).join('')}
  if(p.written.length){let n=qs.length;h+=`<div class="sec">${qs.length?'ثانياً: أجب عن الأسئلة التالية':'أجب عن الأسئلة التالية'}</div>`+p.written.map(w=>{n++;return `<div class="q"><div class="qt"><span class="n">${n}.</span><span class="tx">${esc(w.text)}</span>${p.showMarks!==false?`<span class="mk">(${wM})</span>`:''}</div>${Array.from({length:w.lines??3},()=>'<div class="ln"></div>').join('')}</div>`}).join('')}
  h+='</div>';
  keys.push({label:nM>1?'نموذج '+'ABCD'[k]:'',ans:qs.map(q=>LET[q.correct]??'؟')})}
 if(p.key&&p.mcq.length)h+=`<div class="pgbreak"><div class="sec">ورقة الإجابات النموذجية — للمعلم فقط</div>${keys.map(k=>`${k.label?`<b>${k.label}</b>`:''}<div class="key">${k.ans.map((a,i)=>`<span>${i+1}: <b>${a}</b></span>`).join('')}</div>`).join('')}</div>`;
 return wrap(st,h,p.title||'ورقة')}
root.DocsEngine={md,css,noteHTML,paperHTML,wrap,FONTS,TPLS,SWATCHES,DEFAULT_STYLE,LET,esc,shuffled};
if(typeof module!=='undefined')module.exports=root.DocsEngine;
})(typeof window!=='undefined'?window:globalThis);
