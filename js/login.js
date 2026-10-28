let role='student';
const s=Session.get();if(s)location.href=`/${s.role}.html`;
$$('.tabs button').forEach(b=>b.onclick=()=>{role=b.dataset.r;$$('.tabs button').forEach(x=>x.classList.toggle('on',x===b))});
$('#f').onsubmit=async e=>{e.preventDefault();$('#err').textContent='';
 try{const d=await api('/login','POST',{role,...Object.fromEntries(new FormData(e.target))});Session.set(d);location.href=`/${d.role}.html`}
 catch(err){$('#err').textContent=err.message}};
