import {fixtures,getFixture} from './fixtures.mjs';
const select=document.getElementById('example'),prompt=document.getElementById('prompt'),panes=document.getElementById('panes');
for(const fixture of fixtures){const option=document.createElement('option');option.value=fixture.id;option.textContent=fixture.label;select.append(option);}
const requested=new URLSearchParams(location.search).get('example');select.value=getFixture(requested).id;
function load(){const fixture=getFixture(select.value);prompt.textContent=fixture.prompt;for(const frame of document.querySelectorAll('iframe'))frame.contentWindow.postMessage({source:'batchmath-entry-parent',type:'fixture',id:fixture.id},location.origin);const url=new URL(location);url.searchParams.set('example',fixture.id);history.replaceState(null,'',url);}
select.addEventListener('change',load);document.getElementById('load').addEventListener('click',load);
document.getElementById('view').addEventListener('change',event=>panes.dataset.view=event.target.value);
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.data?.source!=='batchmath-entry-lab')return;
  const frame=document.getElementById('frame-'+event.data.option);if(!frame||frame.contentWindow!==event.source)return;
  if(event.data.type==='height'&&Number.isFinite(event.data.height))frame.style.height=Math.min(6000,Math.max(550,event.data.height))+'px';
  if(event.data.type==='ready')frame.contentWindow.postMessage({source:'batchmath-entry-parent',type:'fixture',id:select.value},location.origin);
});
prompt.textContent=getFixture(select.value).prompt;
