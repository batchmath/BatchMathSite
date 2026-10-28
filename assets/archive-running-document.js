/* Written-only live views. The corresponding archive owns the parser and CSV
   URL; no copied problem entries or separately maintained document data. */
(() => {
  'use strict';
  const mogollon=document.body.dataset.runningSource==='mogollon',api=mogollon?window.BatchMathMogollonData:window.BatchMathArchive;
  const $=id=>document.getElementById(id),state={loading:false,formatting:false,loadedAt:0,count:0};
  const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=String(text);return e;};
  const displayMath=raw=>/\\\[[\s\S]*\\\]|\\\([\s\S]*\\\)/.test(raw)?raw:`\\[${raw}\\]`;
  function math(raw){const wrap=node('div','running-math'),body=node('div','running-math-inner',displayMath(raw));wrap.append(body);return wrap;}
  function section(title,latex,explanation){
    const part=node('section','running-written-section');part.append(node('h3','',title));
    if(latex)part.append(math(latex));if(explanation)part.append(node('p','running-explanation',explanation));return part;
  }
  function entry(item){
    const number=mogollon?item.mile:item.number,article=node('article','running-entry'),header=node('header','running-entry-heading');
    article.id=`${mogollon?'mile':'problem'}-${String(number).padStart(3,'0')}`;article.dataset.number=number;
    header.append(node('h2','',`${mogollon?'Mile':'Problem'} ${number}`));
    const info=[item.date&&(mogollon?item.date:api.formatDate(item.date)),item.topic,!mogollon&&item.location].filter(Boolean);
    if(info.length)header.append(node('p','running-meta',info.join(' · ')));article.append(header,math(item.problem));
    if(mogollon){if(item.solution||item.explanation)article.append(section('Worked Solution',item.solution,item.explanation));}
    // As on the normal POTD archive, the primary solution cell controls
    // publication. An explanation/alternative alone never publishes a solution.
    else if(item.solution){
      article.append(section(`Primary: ${item.primaryMethod||'Worked Solution'}`,item.solution,item.explanation));
      for(const alternative of item.alternatives||[])if(alternative.method&&alternative.solution)article.append(section(`Alternative #${alternative.index}: ${alternative.method}`,alternative.solution,alternative.explanation));
    }
    return article;
  }
  async function retrieve(){
    if(!api?.sourceUrl)throw Error('The live archive connection is unavailable.');
    let lastError;
    for(let attempt=0;attempt<2;attempt++){
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),18000);
      try{
        const url=new URL(api.sourceUrl);url.searchParams.set('_bm_refresh',`${Date.now()}-${attempt}`);
        const response=await fetch(url.href,{cache:'no-store',credentials:'omit',signal:controller.signal,headers:{Accept:'text/csv,text/plain;q=0.9'}});
        if(!response.ok)throw Error('The live spreadsheet could not be retrieved.');
        const text=await response.text();if(/^\s*<!doctype|^\s*<html/i.test(text))throw Error('The published source did not return CSV.');
        return api.normalizeRows(api.parseCsv(text)).slice().sort((a,b)=>(mogollon?a.mile-b.mile:a.number-b.number));
      }catch(error){lastError=error;}finally{clearTimeout(timer);}
    }
    throw lastError;
  }
  function bounded(promise){
    return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Math formatting timed out.')),15000);Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});
  }
  async function formatMath(){
    if(state.formatting||!state.count)return;state.formatting=true;$('running-print').disabled=true;$('running-math-retry').disabled=true;
    try{
      // Data can arrive before startup installs typesetPromise. A missing,
      // rejected, or stalled CDN is a formatting issue, never a CSV failure.
      if(!window.MathJax?.startup?.promise)throw Error('Math typesetting could not load.');
      await bounded(window.MathJax.startup.promise);
      if(!window.MathJax.typesetPromise)throw Error('Math typesetting could not load.');
      const list=$('running-content');await bounded(window.MathJax.typesetPromise([list]));
      if(list.querySelector('mjx-merror,[data-mjx-error]'))throw Error('Some mathematics could not be typeset.');
      $('running-math-warning').hidden=true;$('running-print').disabled=false;
    }catch(_){
      $('running-math-warning').hidden=false;
      // Leave every current entry/solution in place, even as raw LaTeX.
    }finally{state.formatting=false;$('running-math-retry').disabled=false;}
  }
  async function load(){
    if(state.loading||state.formatting)return;state.loading=true;$('running-content').setAttribute('aria-busy','true');$('running-refresh').disabled=true;$('running-print').disabled=true;$('running-error').hidden=true;$('running-math-warning').hidden=true;
    $('running-status').textContent='Loading the complete live collection…';
    try{
      let items;
      try{items=await retrieve();}catch(_){
        state.count=0;window.MathJax?.typesetClear?.([$('running-content')]);$('running-content').replaceChildren();$('running-error').hidden=false;
        $('running-status').textContent='No current document data is being displayed. Check your connection and try again. Google Sheets publishing can take a few minutes.';
        return;
      }
      const list=$('running-content'),fragment=document.createDocumentFragment();
      for(const item of items)fragment.append(entry(item));
      if(!items.length)fragment.append(node('p','running-empty','No completed entries have been published yet.'));
      window.MathJax?.typesetClear?.([list]);list.replaceChildren(fragment);state.count=items.length;state.loadedAt=Date.now();
      $('running-status').textContent=`${items.length} published ${mogollon?'miles':'problems'} · Refreshed ${new Date(state.loadedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}. Spreadsheet updates may take a few minutes to publish.`;
      await formatMath();
      const target=location.hash&&document.getElementById(location.hash.slice(1));if(target)target.scrollIntoView();
    }finally{state.loading=false;$('running-content').setAttribute('aria-busy','false');$('running-refresh').disabled=false;}
  }
  $('running-print').addEventListener('click',()=>window.print());$('running-refresh').addEventListener('click',load);$('running-retry').addEventListener('click',load);
  $('running-math-retry').addEventListener('click',()=>location.reload());
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&Date.now()-state.loadedAt>60000)load();});
  setInterval(()=>{if(document.visibilityState==='visible'&&navigator.onLine!==false)load();},5*60*1000);
  load();
})();
