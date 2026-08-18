window.addEventListener('load',()=>setTimeout(()=>document.querySelector('.loader')?.classList.add('hide'),450));
const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}}),{threshold:.1});document.querySelectorAll('.reveal').forEach((e,i)=>{e.style.transitionDelay=`${(i%3)*70}ms`;obs.observe(e)});
const cursor=document.querySelector('.cursor');addEventListener('pointermove',e=>{if(cursor){cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px'}});
const hero=document.querySelector('.cover-art');addEventListener('scroll',()=>{if(hero&&innerWidth>900)hero.style.transform=`translateY(${scrollY*.035}px)`},{passive:true});
const form=document.getElementById('applyForm');
const formStatus=document.getElementById('formStatus');
form?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!form.checkValidity()){
    form.reportValidity();
    return;
  }

  const button=form.querySelector('button[type="submit"]');
  const original=button.innerHTML;
  button.disabled=true;
  button.innerHTML='Sending… <b>↗</b>';
  if(formStatus) formStatus.textContent='';

  const data=Object.fromEntries(new FormData(form).entries());
  data.privacy=form.elements.privacy.checked;

  try{
    const response=await fetch('/api/apply',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify(data)
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(result.error||'Invio non riuscito.');

    button.innerHTML='Request received <b>✓</b>';
    if(formStatus) formStatus.textContent='Candidatura ricevuta. Ti contatteremo solo se il profilo sarà selezionato.';
    form.reset();
    setTimeout(()=>{button.innerHTML=original;button.disabled=false},4500);
  }catch(err){
    button.innerHTML='Try again <b>↗</b>';
    button.disabled=false;
    if(formStatus) formStatus.textContent=(err&&err.message)||'Errore durante l’invio. Riprova più tardi.';
  }
});

// Privacy-first consent shell. No optional tracker is loaded by this demo.
(() => {
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;
  const key = 'famosi_cookie_choice';
  if (!localStorage.getItem(key)) banner.classList.add('show');
  const choose = value => { localStorage.setItem(key, value); banner.classList.remove('show'); };
  document.getElementById('cookieReject')?.addEventListener('click', () => choose('necessary'));
  document.getElementById('cookieAccept')?.addEventListener('click', () => choose('optional'));
})();
