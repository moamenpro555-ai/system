const Session={get:()=>JSON.parse(localStorage.getItem('s')||'null'),set:s=>localStorage.setItem('s',JSON.stringify(s)),clear:()=>localStorage.removeItem('s')};
async function api(path,method='GET',body){
 const s=Session.get();
 const r=await fetch('/api'+path,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+(s?.token||'')},body:body?JSON.stringify(body):undefined});
 const d=await r.json().catch(()=>({}));
 if(!r.ok){if(r.status===401&&path!=='/login'){Session.clear();location.href='/'}throw new Error(d.error||'حدث خطأ')}
 return d}
function requireRole(role){const s=Session.get();if(!s||s.role!==role){location.href='/';return null}return s}
function logout(){Session.clear();location.href='/'}
