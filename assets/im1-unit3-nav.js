document.addEventListener('DOMContentLoaded',()=>{
 const button=document.querySelector('.menu-toggle'),menu=document.querySelector('.dropdown');
 if(button&&menu){
  const close=()=>{menu.classList.remove('open');button.setAttribute('aria-expanded','false');};
  button.addEventListener('click',event=>{event.stopPropagation();const open=!menu.classList.contains('open');menu.classList.toggle('open',open);button.setAttribute('aria-expanded',String(open));});
  menu.addEventListener('click',event=>event.stopPropagation());document.addEventListener('click',close);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){close();button.focus();}});
 }
 document.querySelectorAll('.unit-select').forEach(select=>select.addEventListener('change',()=>{if(select.value)location.href=select.value;}));
});
