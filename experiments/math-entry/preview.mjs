import {batchmathToLatex} from './answer-adapter.mjs';
let loading;
export function loadMathJax() {
  if(loading)return loading;
  const base=new URL('./vendor/',import.meta.url);
  loading=new Promise((resolve,reject)=>{
    globalThis.MathJax={
      loader:{paths:{'mathjax-newcm':new URL('mathjax-newcm/',base).href.replace(/\/$/,'')}},
      startup:{typeset:false,ready(){MathJax.startup.defaultReady();MathJax.startup.promise.then(()=>resolve(MathJax));}},
      options:{enableMenu:false},
      chtml:{fontURL:new URL('mathjax-newcm/chtml/woff2/',base).href},
      output:{font:'mathjax-newcm'}
    };
    const script=document.createElement('script');script.src=new URL('mathjax/tex-chtml.js',base);script.onerror=()=>reject(Error('The local MathJax asset could not load.'));document.head.append(script);
  });
  return loading;
}
export function attachPreview(input,output,notice) {
  let timer,revision=0,queue=Promise.resolve(),previous='';
  const update=()=>{
    clearTimeout(timer);const version=++revision;
    timer=setTimeout(()=>{
      const parsed=batchmathToLatex(input.value);
      notice.textContent=parsed.status==='complete'?'Display only · the original answer is graded.':parsed.status==='incomplete'?'Incomplete · empty slots are shown below.':parsed.message;
      if(!parsed.latex){output.textContent='Preview unavailable for this syntax.';return;}
      const latex=parsed.latex.replace(/\\placeholder\{\}/g,'\\square');
      queue=queue.then(async()=>{
        try{
          const mj=await loadMathJax();if(version!==revision||latex===previous)return;
          const node=await mj.tex2chtmlPromise(latex,{display:true});
          if(version!==revision)return;
          // Direct conversion does not insert the CHTML layout/font stylesheet.
          // Refresh adaptive rules as new structures appear in either preview.
          const sheet=mj.chtmlStylesheet();sheet.id='lab-mathjax-styles';
          const prior=document.getElementById(sheet.id);if(prior!==sheet){if(prior)prior.replaceWith(sheet);else document.head.append(sheet);}
          mj.typesetClear([output]);output.replaceChildren(node);previous=latex;
        }catch(e){notice.textContent=e.message;}
      });
    },100);
  };
  input.addEventListener('input',update);update();
  return()=>{clearTimeout(timer);revision++;input.removeEventListener('input',update);};
}
