let pending;
export function loadMathLive(){
  if(!pending)pending=(async()=>{
    let timer;
    try{
      const library=await Promise.race([import('./vendor/mathlive/mathlive.min.mjs'),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('MathLive load timed out.')),8000);})]);
      library.MathfieldElement.fontsDirectory=new URL('./vendor/mathlive/fonts/',import.meta.url).href;
      library.MathfieldElement.soundsDirectory=null;return library;
    }finally{clearTimeout(timer);}
  })();
  return pending;
}
export async function verifyFonts(alive){
  for(let i=0;i<100;i++){
    if(!alive())throw Error('Answer field was removed.');
    const faces=[...document.fonts].filter(f=>f.family.startsWith('KaTeX_'));
    if(faces.some(f=>f.status==='error'))throw Error('MathLive fonts are unavailable.');
    if(faces.length===20&&faces.every(f=>f.status==='loaded'))return;
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  throw Error('MathLive fonts did not become available.');
}
export function resetMathfield(field,latex){
  field.resetUndo();field.setValue(latex+' ',{silenceNotifications:true});
  // Public selection command flushes 0.111.1's inline-shortcut snapshots.
  field.executeCommand('moveToMathfieldEnd');
}
