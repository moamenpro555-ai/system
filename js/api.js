const KEY='studentTracker_session';
const Session={get:()=>JSON.parse(localStorage.getItem(KEY)||'null'),set:s=>localStorage.setItem(KEY,JSON.stringify(s)),clear:()=>localStorage.removeItem(KEY)};
async function api(path,method='GET',body){
 const s=Session.get();
 let r;
 try{r=await fetch(API_BASE+'/api'+path,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+(s?.token||'')},body:body?JSON.stringify(body):undefined})}
 catch{throw new Error('تعذر الاتصال بالسيرفر، حاول بعد قليل')}
 const d=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401&&path!=='/login'){Session.clear();location.href='index.html'}throw new Error(d.error||'حدث خطأ')}
 return d}
function requireRole(role){const s=Session.get();if(!s||s.role!==role){location.href='index.html';return null}return s}
function logout(){Session.clear();location.href='index.html'}
