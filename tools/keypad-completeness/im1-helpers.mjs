export async function prepare(p,route){return p.evaluate(route=>{const map=new Map(),qa=im1QA;
 if(route.unit==='unit1'){
  const select=document.getElementById('categorySelect'),modes=select?[...select.options].map(o=>o.value):['default'];
  for(const mode of modes){if(route.slug==='multiplication')document.getElementById('questionSelect').value='100';if(select)select.value=mode;qa.start();for(const q of qa.pool){const key=String(q.problemType||q.family||q.kind||q.key?.split('-')[0]||'catalog');if(!map.has(key))map.set(key,q);}}
 }else for(let seed=1;seed<=900;seed++){let s=seed*719;window.BatchMathRNG={random:()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;}};const q=qa.generate(),key=(q.kind||'choice')+'|'+(q.kind==='polynomial'?(q.variables||[]).join(''):q.kind==='equation'?q.variant:q.kind==='interval'?'interval':q.variant);if(!map.has(key))map.set(key,q);}
 window.__IM1_CASES=map;return [...map.keys()];},route);}
