(() => {
  'use strict';
  // Published read-only source. Sheet edits need no daily site deployment.
  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSk4KcSiCIWnvCibqoiMlieK0ivKTttMMpnoqLKWAIC1wv1hx4LE_TwF63_W3InPnfRJ5sylvvN4fN3/pub?gid=1190649406&single=true&output=csv';
  const STARTER_CSV_URL = '/mogollon2026/starter.csv';
  const PAGE_SIZE = 12, REFRESH_MS = 5 * 60 * 1000;
  const state={entries:[],query:'',topic:'',visible:PAGE_SIZE,loadedAt:0,loading:false,renderSerial:0,returnFocus:null};
  const $=id=>document.getElementById(id);
  const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=String(text);return e;};
  const normalized=value=>String(value||'').replace(/^\uFEFF/,'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
  const schema=['Mile','Published','Topic','ProblemLaTeX','SolutionLaTeX','Explanation','VideoURL','VideoLabel','PublishedDate'];

  function parseCsv(raw){
    const text=String(raw||'').replace(/^\uFEFF/,''),rows=[];let row=[],field='',quoted=false,closed=false;
    const finishField=()=>{row.push(field);field='';closed=false;};
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
      if(c==='"'){if(field.trim()||closed)throw Error('Malformed CSV quotation.');quoted=true;field='';}
      else if(c===',')finishField();
      else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;finishField();rows.push(row);row=[];}
      else if(closed&&!/\s/.test(c))throw Error('Malformed CSV quotation.');
      else if(!closed)field+=c;
    }
    if(quoted)throw Error('The CSV ends inside a quoted field.');
    if(field||row.length||closed){finishField();rows.push(row);}
    return rows.filter(r=>r.some(v=>v.trim()));
  }
  function youtube(raw){
    try{const u=new URL(String(raw||'').trim());if(u.protocol!=='https:')return null;const host=u.hostname.toLowerCase().replace(/^(?:www\.|m\.)/,''),parts=u.pathname.split('/').filter(Boolean);let id='',portrait=false;
      if(host==='youtu.be')id=parts[0]||'';
      else if(host==='youtube.com'||host==='youtube-nocookie.com'){if(u.pathname==='/watch')id=u.searchParams.get('v')||'';else if(['shorts','embed','live'].includes(parts[0])){id=parts[1]||'';portrait=parts[0]==='shorts';}}
      return /^[A-Za-z0-9_-]{11}$/.test(id)?{id,portrait,url:portrait?`https://www.youtube.com/shorts/${id}`:`https://www.youtube.com/watch?v=${id}`}:null;
    }catch(_){return null;}
  }
  function normalizeRows(rows){
    if(!rows.length)throw Error('The spreadsheet is empty.');
    const headers=rows[0].map(normalized),lookup=Object.fromEntries(schema.map(s=>[s,headers.indexOf(normalized(s))]));
    for(const required of ['Mile','Published','ProblemLaTeX','SolutionLaTeX','Explanation'])if(lookup[required]<0)throw Error(`The spreadsheet is missing the ${required} column.`);
    const get=(r,key)=>lookup[key]<0?'':String(r[lookup[key]]??'').trim(),seen=new Set(),entries=[];
    for(const row of rows.slice(1)){
      const rawMile=get(row,'Mile'),mile=Number(rawMile),problem=get(row,'ProblemLaTeX'),solution=get(row,'SolutionLaTeX'),explanation=get(row,'Explanation');
      if(!/^\d+$/.test(rawMile)||!Number.isSafeInteger(mile)||mile<=0||!/^true$/i.test(get(row,'Published'))||!problem||(!solution&&!explanation))continue;
      if(seen.has(mile))throw Error(`Mile ${mile} is published more than once. Give each published mile one row.`);
      seen.add(mile);entries.push({mile,problem,solution,explanation,topic:get(row,'Topic'),video:youtube(get(row,'VideoURL')),videoLabel:get(row,'VideoLabel'),date:get(row,'PublishedDate')});
    }
    return entries.sort((a,b)=>a.mile-b.mile);
  }
  const permalink=mile=>`#mile-${String(mile).padStart(3,'0')}`;
  const targetMile=()=>{const match=location.hash.match(/^#mile-(\d+)$/);return match?Number(match[1]):null;};
  const displayMath=raw=>/^\s*\\\[/.test(raw)?raw:`\\[${raw}\\]`;
  function math(raw){const wrap=node('div','mile-math-scroller'),body=node('div','mile-math',displayMath(raw));wrap.append(body);return wrap;}
  async function typeset(host){if(!window.MathJax?.typesetPromise)return;try{await window.MathJax.startup?.promise;await window.MathJax.typesetPromise([host]);}catch(_){$('mile-status').textContent='The problems loaded, but math typesetting could not finish. Refresh the page to try again.';}}
  function card(entry){
    const article=node('article','mile-card');article.id=permalink(entry.mile).slice(1);article.dataset.mile=entry.mile;
    const header=node('header','mile-card-header');header.append(node('h2','',`Mile ${String(entry.mile).padStart(3,'0')}`));if(entry.topic)header.append(node('span','mile-card-topic',entry.topic));if(entry.date)header.append(node('span','mile-card-date',entry.date));article.append(header);
    const body=node('div','mile-card-body');body.append(math(entry.problem));
    if(entry.video){const actions=node('div','mile-card-actions'),button=node('button','mile-button',entry.videoLabel||`Watch Mile ${entry.mile} Short`);button.type='button';button.addEventListener('click',()=>openVideo(entry.video,button,entry.videoLabel||`Mile ${entry.mile} video`));actions.append(button);body.append(actions);}
    const details=node('details','mile-solution'),summary=node('summary','', 'Show Worked Solution'),solutionBody=node('div','mile-solution-body');
    if(entry.solution)solutionBody.append(math(entry.solution));if(entry.explanation)solutionBody.append(node('p','mile-explanation',entry.explanation));details.append(summary,solutionBody);details.addEventListener('toggle',()=>{summary.textContent=details.open?'Hide Worked Solution':'Show Worked Solution';if(details.open)typeset(solutionBody);});body.append(details);article.append(body);
    const index=state.entries.indexOf(entry),before=state.entries[index-1],after=state.entries[index+1];if(before||after){const navigation=node('nav','mile-neighbors');navigation.setAttribute('aria-label',`Published miles around Mile ${entry.mile}`);for(const [item,cls,label]of [[before,'mile-previous','← Previous Published Mile'],[after,'mile-next','Next Published Mile →']])if(item){const a=node('a',cls,`${label}: ${item.mile}`);a.href=permalink(item.mile);navigation.append(a);}article.append(navigation);}return article;
  }
  function filtered(){const query=state.query.toLowerCase().trim(),numberQuery=query.match(/^(?:mile\s*#?\s*|#)?0*(\d+)$/i);return state.entries.filter(e=>(!state.topic||e.topic===state.topic)&&(!query||(numberQuery?e.mile===Number(numberQuery[1]):`${e.topic} mile ${e.mile}`.toLowerCase().includes(query))));}
  async function render({hash=false}={}){
    const serial=++state.renderSerial,list=$('mile-list'),entries=filtered(),target=targetMile();
    if(hash&&target!=null){const index=entries.findIndex(e=>e.mile===target);if(index>=0)state.visible=Math.max(state.visible,index+1);}
    window.MathJax?.typesetClear?.([list]);const fragment=document.createDocumentFragment();entries.slice(0,state.visible).forEach(e=>fragment.append(card(e)));
    if(!entries.length){const empty=node('div','mile-empty',state.entries.length?'No published miles match your search.':'No completed miles have been published yet.');if(state.entries.length){const clear=node('button','mile-button','Clear filters');clear.type='button';clear.addEventListener('click',()=>{resetFilters();render();});empty.append(clear);}fragment.append(empty);}
    list.replaceChildren(fragment);$('mile-more').hidden=entries.length<=state.visible;$('published-count').textContent=`${state.entries.length} published ${state.entries.length===1?'mile':'miles'}`;
    await typeset(list);if(serial!==state.renderSerial)return;
    if(hash&&target!=null){const item=document.getElementById(permalink(target).slice(1));if(item)item.scrollIntoView({behavior:'auto',block:'start'});else $('mile-status').textContent=`Mile ${target} is not published in the current archive. Missing mile numbers are intentional.`;}
  }
  function resetFilters(){state.query='';state.topic='';state.visible=PAGE_SIZE;$('mile-search').value='';$('mile-topic').value='';}
  function rebuildTopics(){const select=$('mile-topic'),current=state.topic;select.replaceChildren(new Option('All Topics',''));[...new Set(state.entries.map(e=>e.topic).filter(Boolean))].sort((a,b)=>a.localeCompare(b)).forEach(t=>select.add(new Option(t,t)));if([...select.options].some(o=>o.value===current))select.value=current;else state.topic='';}
  async function retrieve(url){
    let lastError;for(let attempt=0;attempt<2;attempt++){
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000);
      try{const request=new URL(url,location.href);request.searchParams.set('_bm_refresh',`${Date.now()}-${attempt}`);const response=await fetch(request.href,{cache:'no-store',credentials:'omit',signal:controller.signal,headers:{Accept:'text/csv,text/plain;q=0.9'}});if(!response.ok)throw Error(`The data source returned HTTP ${response.status}.`);const text=await response.text();if(/^\s*<!doctype|^\s*<html/i.test(text))throw Error('The data source returned a web page instead of CSV. Check the published CSV URL.');return normalizeRows(parseCsv(text));}catch(error){lastError=error;}finally{clearTimeout(timer);}
    }throw lastError;
  }
  async function load(){
    if(state.loading)return;state.loading=true;$('mile-list').setAttribute('aria-busy','true');$('mile-refresh').disabled=true;$('mile-retry').disabled=true;$('mile-error').hidden=true;
    const status=$('mile-status');status.classList.remove('is-warning');status.textContent='Checking for the latest published miles…';
    try{
      state.entries=await retrieve(SHEET_CSV_URL||STARTER_CSV_URL);state.loadedAt=Date.now();rebuildTopics();
      status.classList.toggle('is-warning',!SHEET_CSV_URL);status.textContent=SHEET_CSV_URL?`Updated ${new Date(state.loadedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}. Miles are shown in race order.`:'Showing verified starter entries. The live spreadsheet is not connected yet.';
      await render({hash:Boolean(location.hash)});
    }catch(error){
      state.entries=[];state.renderSerial++;window.MathJax?.typesetClear?.([$('mile-list')]);$('mile-list').replaceChildren();$('mile-more').hidden=true;$('published-count').textContent='Archive unavailable';$('mile-error').hidden=false;
      $('mile-error-message').textContent=error.name==='AbortError'?'The spreadsheet took too long to respond. Try again shortly.':`The latest archive data could not be retrieved. Check your connection or the published CSV link, then try again. ${String(error.message||'').startsWith('The spreadsheet')||String(error.message||'').startsWith('Mile ')?error.message:''}`;
      status.classList.add('is-warning');status.textContent='No current archive data is being displayed. Google Sheets publishing can take a few minutes.';
    }finally{state.loading=false;$('mile-list').setAttribute('aria-busy','false');$('mile-refresh').disabled=false;$('mile-retry').disabled=false;}
  }
  function openVideo(video,button,label){
    state.returnFocus=button;const modal=$('mile-video-modal'),dialog=modal.querySelector('.mile-video-dialog'),frame=$('mile-video-frame');dialog.classList.toggle('is-portrait',video.portrait);$('mile-video-title').textContent=label;$('mile-video-youtube').href=video.url;
    const iframe=node('iframe');iframe.src=`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&playsinline=1`;iframe.title=label;iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.allowFullscreen=true;frame.replaceChildren(iframe);modal.hidden=false;document.body.classList.add('mile-modal-open');$('mile-video-close').focus();
  }
  function closeVideo(){if($('mile-video-modal').hidden)return;$('mile-video-frame').replaceChildren();$('mile-video-modal').hidden=true;document.body.classList.remove('mile-modal-open');if(state.returnFocus?.isConnected)state.returnFocus.focus();state.returnFocus=null;}
  function init(){
    $('mile-search').addEventListener('input',()=>{state.query=$('mile-search').value;state.visible=PAGE_SIZE;render();});$('mile-topic').addEventListener('change',()=>{state.topic=$('mile-topic').value;state.visible=PAGE_SIZE;render();});$('mile-more').addEventListener('click',()=>{state.visible+=PAGE_SIZE;render();});$('mile-refresh').addEventListener('click',load);$('mile-retry').addEventListener('click',load);
    addEventListener('hashchange',()=>{resetFilters();render({hash:true});});$('mile-video-close').addEventListener('click',closeVideo);$('mile-video-modal').addEventListener('click',event=>{if(event.target===$('mile-video-modal'))closeVideo();});
    document.addEventListener('keydown',event=>{if($('mile-video-modal').hidden)return;if(event.key==='Escape'){event.preventDefault();closeVideo();}if(event.key==='Tab'){const focusables=[...$('mile-video-modal').querySelectorAll('button,a[href],iframe')],first=focusables[0],last=focusables.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
    const toggle=document.querySelector('.menu-toggle'),menu=$('course-menu');toggle.addEventListener('click',event=>{event.stopPropagation();const open=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});document.addEventListener('click',()=>{menu.classList.remove('open');toggle.setAttribute('aria-expanded','false');});menu.addEventListener('click',event=>event.stopPropagation());
    setInterval(()=>{if(document.visibilityState==='visible')load();},REFRESH_MS);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&Date.now()-state.loadedAt>60000)load();});load();
  }
  // Pure data functions support the focused Node QA without a second parser.
  if(typeof document!=='undefined')init();
  if(typeof module!=='undefined'&&module.exports)module.exports={parseCsv,normalizeRows,youtube};
})();
