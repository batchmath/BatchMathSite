(function(){
'use strict';
const M={};
M.toTeX=function(raw){
 let s=String(raw??'').trim();
 if(!s)return '';
 s=s.replace(/[−–—]/g,'-')
    .replace(/×/g,'\\times ')
    .replace(/÷/g,'\\div ')
    .replace(/π/g,'\\pi ')
    .replace(/∞/g,'\\infty ')
    .replace(/≤/g,'\\le ')
    .replace(/≥/g,'\\ge ')
    .replace(/≠/g,'\\ne ')
    .replace(/%/g,'\\%')
    .replace(/#/g,'\\#');
 s=s.replace(/√\(([^()]*)\)/g,'\\sqrt{$1}');
 s=s.replace(/√([A-Za-z0-9.]+)/g,'\\sqrt{$1}');
 s=s.replace(/(^|[^A-Za-z0-9}])(-?\d+)\/(\d+)(?![A-Za-z0-9])/g,(m,p,n,d)=>`${p}\\frac{${n}}{${d}}`);
 s=s.replace(/([A-Za-z0-9.)]+)\^(-?\d+)/g,'$1^{$2}');
 return s;
};
M.html=raw=>`\\(${M.toTeX(raw)}\\)`;
M.ensure=function(){
 if(window.MathJax&&MathJax.typesetPromise)return Promise.resolve(window.MathJax);
 if(!window.__BM_IM1_MJ_LOADING__){
  window.MathJax=window.MathJax||{};
  window.MathJax.tex=Object.assign({inlineMath:[["\\(","\\)"]]},window.MathJax.tex||{});
  window.MathJax.options=Object.assign({},window.MathJax.options||{},{enableMenu:false});
  window.MathJax.options.menuOptions=Object.assign({},window.MathJax.options.menuOptions||{});
  window.MathJax.options.menuOptions.settings=Object.assign({},window.MathJax.options.menuOptions.settings||{},{explorer:false,zoom:'NoZoom',inTabOrder:false});
  window.__BM_IM1_MJ_LOADING__=new Promise(resolve=>{
   const existing=[...document.scripts].find(x=>/mathjax.*tex-chtml\.js/i.test(x.src||''));
   if(existing){
    if(window.MathJax&&MathJax.typesetPromise){resolve(window.MathJax);return;}
    existing.addEventListener('load',()=>resolve(window.MathJax),{once:true});return;
   }
   const script=document.createElement('script');script.defer=true;script.src='https://cdn.jsdelivr.net/npm/mathjax@4/tex-chtml.js';
   script.addEventListener('load',()=>resolve(window.MathJax),{once:true});script.addEventListener('error',()=>resolve(null),{once:true});document.head.appendChild(script);
  });
 }
 return window.__BM_IM1_MJ_LOADING__;
};
M.typeset=function(nodes){return M.ensure().then(()=>{if(!(window.MathJax&&MathJax.typesetPromise))return;const list=(nodes||[]).filter(Boolean);if(!list.length)return;if(MathJax.typesetClear)try{MathJax.typesetClear(list)}catch(e){}return MathJax.typesetPromise(list).catch(()=>{})})};
M.set=function(el,raw){if(!el)return;el.innerHTML=M.html(raw);M.typeset([el]);};
M.setFeedback=function(el,prefix,raw,suffix=''){if(!el)return;el.innerHTML=`${prefix}${M.html(raw)}${suffix}`;M.typeset([el]);};
window.BatchMathDisplayMath=M;
})();
