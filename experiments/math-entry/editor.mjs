import {getFixture,fullProfile} from './fixtures.mjs';
import {batchmathToLatex,parseInput,translateLatex} from './answer-adapter.mjs';
import {grade,checkerNames} from './grading.mjs';
import {attachPreview} from './preview.mjs';
import {bridgeKeypad,focusMathfield} from './keypad-bridge.mjs';

const $=id=>document.getElementById(id);
const option=new URLSearchParams(location.search).get('option')||'A';
const info={A:['Existing BatchMath editor','The control: actual production editor, rendering, and keyboard logic.'],B:['BatchMath + live preview','The same editor and keypad, with a display-only MathJax preview.'],C:['MathLive editable field','Typeset mathematics where you type, with an experimental BatchMath keypad bridge.']}[option];
$('letter').textContent=option;$('title').textContent=info[0];$('description').textContent=info[1];
document.documentElement.dataset.option=option;
let fixture=getFixture(new URLSearchParams(location.search).get('fixture')),editors=[],activeIndex=0,mount,cleanup=[],ready=false,loadRevision=0,submissionCount=0,MathfieldElement;
const outcomes=new Map();
function send(type,extra={}){if(parent!==window)parent.postMessage({source:'batchmath-entry-lab',type,option,...extra},location.origin);}
function resize(){send('height',{height:Math.ceil(document.body.getBoundingClientRect().height)+4});}
new ResizeObserver(resize).observe(document.body);
const script=src=>new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=new URL(src,import.meta.url);el.onload=resolve;el.onerror=()=>reject(Error(`Could not load ${src}. Start the server from the repository root.`));document.head.append(el);});

async function boot() {
  // Load after DOMContentLoaded: engine QA exports are available without booting their practice pages.
  if(document.readyState==='loading')await new Promise(r=>document.addEventListener('DOMContentLoaded',r,{once:true}));
  for(const file of ['calculus-keypad.js','answer-normalization.js','derivative-expression-checker.js','line-equation-checker.js','unit4-exact-answers.js','unit5-core.js','unit5-answers.js','im1-algebra-input.js','im1-equation-input.js','im1-interval-input.js','im1-unit3-practice.js'])await script('../../assets/'+file);
  BatchMathCalculusKeypad.registerProfile('lab-full',fullProfile);
  if(option==='C') {
    const library=await import('./vendor/mathlive/mathlive.min.mjs');MathfieldElement=library.MathfieldElement;
    MathfieldElement.fontsDirectory=new URL('./vendor/mathlive/fonts/',import.meta.url).href;
    MathfieldElement.soundsDirectory=null;
    await customElements.whenDefined('math-field');
  }
  ready=true;$('loading').hidden=true;$('toolbar').hidden=false;$('check').disabled=false;
  $('differences').textContent=option==='C'
    ?'MathLive 0.111.1 owns selection, navigation, deletion, and undo grouping. Slash uses its implicit-argument rule, which can differ from BatchMath’s preceding-term capture. Arrow Right leaves an exponent; smart single-digit exponent exit is disabled. Structural Backspace is MathLive’s behavior, not a copy of BatchMath’s whole-shell deletion. A version-pinned focus bridge targets its exposed keyboard-sink part to avoid losing the first key when switching fields. The on-screen fraction button inserts an empty stacked fraction. Private BatchMath clipboard data is imported when safely supported. Automatic MathLive keyboard display is disabled; the BatchMath layout is used. No Compute Engine is loaded.'
    :option==='B'
      ?'The editor and keypad are unchanged. The preview waits briefly for typing to pause and shows squares for incomplete slots. A restricted converter can refuse unsupported syntax; it never changes the answer being graded. Preview fonts/layout can differ from the custom editor.'
      :'This is the unchanged shared calculus editor and its actual keypad builder. The broad “all symbols” profile is experimental configuration through its public registerProfile API. Some production engines use other editors; they are not imitated here. Lab Undo/Redo buttons call the editor’s existing history methods. This lab leaves fields editable after checking and does not reproduce a production scoring or Next-question workflow.';
  await loadFixture(fixture.id);send('ready');
  if(option==='C')verifyFonts().catch(()=>{
    $('font-warning').hidden=false;$('font-warning').textContent='MathLive fonts could not load. Its typography may be incorrect; Options A and B remain available. Checker results do not verify font rendering.';resize();
  });
}

async function verifyFonts() {
  // MathLive registers its FontFace objects asynchronously. Checking an unknown
  // family immediately returns an empty successful result and causes false alarms.
  for(let attempt=0;attempt<100;attempt++){
    const faces=[...document.fonts].filter(face=>face.family.startsWith('KaTeX_'));
    if(faces.some(face=>face.status==='error'))throw Error('A MathLive font failed.');
    if(faces.length===20&&faces.every(face=>face.status==='loaded'))return;
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  throw Error('MathLive fonts did not become available.');
}

function addDiagnostic(index) {
  const section=document.createElement('section');section.className='diagnostic-field';
  const h=document.createElement('h3');h.textContent=index===0?'Answer 1':'Answer 2';section.append(h);
  const list=document.createElement('dl');
  for(const [key,label] of [['visible','Visible expression (text description)'],['underlying',option==='C'?'MathLive LaTeX':'BatchMath underlying editing state'],['input','BatchMath checker input'],['checker','Existing checker'],['structure','Input structure'],['result','Checker result']]) {
    const dt=document.createElement('dt');dt.textContent=label;const dd=document.createElement('dd');dd.dataset.key=key;dd.id=`diag-${index}-${key}`;list.append(dt,dd);
  }
  section.append(list);$('diagnostics').append(section);
}

async function loadFixture(id) {
  if(!ready)return;const revision=++loadRevision;
  fixture=getFixture(id);for(const dispose of cleanup)dispose();cleanup=[];outcomes.clear();submissionCount=0;activeIndex=0;
  editors=[];$('fields').replaceChildren();$('diagnostics').replaceChildren();$('keypad-host').replaceChildren();$('reference').replaceChildren();
  $('summary').textContent='Edit either field, then check. Nothing is saved.';$('bridge-message').textContent='';
  const fields=fixture.fields.length>1?fixture.fields:[...fixture.fields,{raw:'',checker:'scratch',label:'Scratch field · not graded'}];
  const sources=[];
  for(let i=0;i<fields.length;i++) {
    const field=fields[i],section=document.createElement('section');section.className='answer-field';section.dataset.index=String(i);
    const label=document.createElement('label');label.id=`label-${i}`;label.textContent=field.label||`Answer ${i+1}`;
    const source=document.createElement('input');source.type='text';source.id=`source-${i}`;source.value=field.raw;source.dataset.bmNoNormalize='true';source.setAttribute('aria-label',label.textContent);label.htmlFor=source.id;
    section.append(label);$('fields').append(section);sources.push(source);
    if(option==='C') {
      const mf=new MathfieldElement();mf.id=`mathlive-${i}`;label.htmlFor=mf.id;mf.setAttribute('aria-label',label.textContent);mf.mathVirtualKeyboardPolicy='manual';mf.smartSuperscript=false;mf.smartFence=false;mf.removeExtraneousParentheses=false;mf.defaultMode='math';
      mf.setValue(batchmathToLatex(field.raw).latex||'',{silenceNotifications:true});section.append(mf);
      mf.resetUndo();mf.addEventListener('focusin',()=>{activeIndex=i;markActive();});
      mf.addEventListener('pointerdown',()=>{activeIndex=i;markActive();focusMathfield(mf);},true);
      mf.addEventListener('input',()=>{outcomes.delete(i);refresh();});
      // Exactly one Enter path. Never grade on change/blur (MathLive emits change for both).
      mf.addEventListener('keydown',event=>{
        if(event.key==='Enter'){event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)check();return;}
        if(event.shiftKey&&event.code==='Digit6'&&event.key!=='^'){event.preventDefault();event.stopImmediatePropagation();mf.executeCommand('moveToSuperscript');refresh();}
      },true);
      mf.addEventListener('beforeinput',event=>{if((event.inputType||event.data)==='insertLineBreak'){event.preventDefault();}});
      mf.addEventListener('paste',event=>{
        const custom=event.clipboardData?.getData('application/x-batchmath-expression');if(!custom)return;
        event.preventDefault();event.stopImmediatePropagation();
        try{const raw=JSON.parse(custom).raw.replace(/\uE000/g,'(').replace(/\uE001/g,')/(').replace(/\uE002/g,')');const p=batchmathToLatex(raw);if(!p.latex)throw Error(p.message);mf.insert(p.latex);refresh();}
        catch(e){$('bridge-message').textContent='Structured paste was kept out: '+e.message;}
      },true);
      editors.push({field,element:mf,source,section});
    } else {
      section.append(source);source.addEventListener('input',()=>{outcomes.delete(i);queueMicrotask(refresh);});
      editors.push({field,source,section});
    }
    const status=document.createElement('p');status.className='field-result';status.id=`result-${i}`;status.setAttribute('aria-live','polite');section.append(status);
    if(option==='B') {
      const preview=document.createElement('div');preview.className='math-preview';preview.setAttribute('aria-label',`Formatted preview for ${label.textContent}`);
      const note=document.createElement('p');note.className='preview-note';section.append(preview,note);cleanup.push(attachPreview(source,preview,note));
    }
    addDiagnostic(i);
  }
  if(option==='C') {
    // Produce the real current keypad, clone its layout, then discard the live reference mount.
    const input=document.createElement('input');$('reference').append(input);
    const reference=BatchMathCalculusKeypad.mountInputs([input],$('reference'),{mode:fixture.profile,onCheck:()=>{}});
    const bridge=bridgeKeypad(reference.pad,{active:()=>editors[activeIndex]?.element,onCheck:check,onChange:refresh,onUnsupported:message=>$('bridge-message').textContent=message});
    $('keypad-host').append(bridge);$('reference').replaceChildren();
    await new Promise(r=>requestAnimationFrame(r));if(revision!==loadRevision)return;
    focusMathfield(editors[0].element);
  } else {
    mount=BatchMathCalculusKeypad.mountInputs(sources,$('keypad-host'),{mode:fixture.profile,onCheck:check});
    mount.bindings.forEach((binding,i)=>{editors[i].element=binding.editor;editors[i].binding=binding;binding.editor.addEventListener('focus',()=>{activeIndex=i;markActive();});});
  }
  markActive();refresh();resize();
}

function read(editor) {
  if(option==='C')return translateLatex(editor.element.value,editor.field.translation||'expression');
  const result=parseInput(editor.source.value,'batchmath');return{...result,input:editor.source.value};
}
function markActive(){editors.forEach((e,i)=>e.section.classList.toggle('is-active',i===activeIndex));}
function refresh() {
  editors.forEach((editor,i)=>{
    const parsed=read(editor),outcome=outcomes.get(i);
    let visible=editor.element?.textContent||editor.source.value;
    if(option==='C'){try{visible=editor.element.getValue('spoken-text');}catch{visible=editor.element.value;}}
    const values={visible,underlying:option==='C'?editor.element.value:JSON.stringify(editor.binding?.raw??editor.source.value).replace(/[\uE000-\uE002]/g,c=>({'\uE000':'<fraction-start>','\uE001':'<fraction-divider>','\uE002':'<fraction-end>'})[c]),input:parsed.input??'Not submitted',checker:checkerNames[editor.field.checker]||'Scratch · not graded',structure:`${parsed.status}${parsed.message?' · '+parsed.message:''}`,result:outcome?`${outcome.status}${outcome.message?' · '+outcome.message:''}`:'Not checked'};
    for(const [key,value] of Object.entries(values))$(`diag-${i}-${key}`).textContent=value;
    const label=$(`result-${i}`);label.textContent=outcome?outcome.status[0].toUpperCase()+outcome.status.slice(1)+(outcome.message?' · '+outcome.message:''):editor.field.checker==='scratch'?'Use this field to try keypad targeting.':'';label.dataset.status=outcome?.status||'';
    editor.section.dataset.structure=parsed.status;
  });
  resize();
}
function check() {
  if(!ready)return;submissionCount++;
  for(let i=0;i<editors.length;i++) {
    const editor=editors[i];if(editor.field.checker==='scratch')continue;
    const parsed=read(editor);
    outcomes.set(i,parsed.status!=='complete'?{status:parsed.status,message:parsed.message}:grade(parsed.input,editor.field));
  }
  const statuses=[...outcomes.values()].map(x=>x.status);
  $('summary').textContent=statuses.every(x=>x==='correct')?'Correct · existing checkers accepted every graded field.':statuses.some(x=>x==='incomplete')?'Complete the empty structures before checking.':'See the result below each field. You can keep editing.';
  refresh();send('checked',{statuses});
}
for(const id of ['undo','redo','reset-pane','check'])$(id).addEventListener('pointerdown',e=>e.preventDefault());
$('check').addEventListener('click',check);$('reset-pane').addEventListener('click',()=>loadFixture(fixture.id));
for(const action of ['undo','redo'])$(action).addEventListener('click',()=>{
  const e=editors[activeIndex];if(!e)return;
  if(option==='C'){focusMathfield(e.element);e.element.executeCommand(action);}else{e.element.focus({preventScroll:true});BatchMathCalculusKeypad[action]();}outcomes.delete(activeIndex);refresh();
});
window.addEventListener('message',event=>{
  if(event.source!==parent||event.origin!==location.origin||event.data?.source!=='batchmath-entry-parent')return;
  if(event.data.type==='fixture')loadFixture(event.data.id);
});
// Deliberately small read-only inspection hook for the experiment’s browser tests.
window.entryLab={getState:()=>({ready,option,fixture:fixture.id,submissionCount,fields:editors.map(e=>({raw:option==='C'?e.element.value:e.source.value,...read(e)})),outcomes:[...outcomes.values()]}),loadFixture,check};
boot().catch(error=>{
  $('loading').hidden=true;$('failure').hidden=false;$('failure').textContent=(option==='C'?'MathLive unavailable. Options A and B remain available. ':'Editor unavailable. ')+error.message;
  $('summary').textContent='No answer was graded.';send('failed',{message:error.message});resize();
});
