(function(){
  "use strict";

  const state={input:null,editor:null,pad:null,raw:"",cursor:0,selectionAnchor:0,selectionFocus:0,dragging:false,mode:"derivative",binding:null,onCheck:null,history:[],redoHistory:[],historyLimit:120,restoring:false};
  // Private-use markers keep the visual numerator and denominator intact while
  // a student is still typing unmatched parentheses. They are converted to the
  // parser-friendly (numerator)/(denominator) form before reaching the engine.
  const FRAC_OPEN="\uE000",FRAC_MID="\uE001",FRAC_END="\uE002";
  const fnNames=["asin","acos","atan","acot","asec","acsc","sqrt","cbrt","root","sin","cos","tan","sec","csc","cot","ln","log","exp","abs","fp","gp","f","g"];
  const atomicWords=["aₙ₋₁","aₙ","a₁","infinity","undefined","DNE","pi"];
  const nextFrame=fn=>typeof requestAnimationFrame==="function"?requestAnimationFrame(fn):fn();

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function selectionRange(){
    const a=Number(state.selectionAnchor)||0,b=Number(state.selectionFocus)||0;
    return{start:Math.min(a,b),end:Math.max(a,b)};
  }
  function hasSelection(){const r=selectionRange();return r.end>r.start;}
  function collapseSelection(pos=state.cursor){
    state.cursor=normalizeCursor(pos,0);state.selectionAnchor=state.cursor;state.selectionFocus=state.cursor;
  }
  function editSnapshot(){return{raw:state.raw,cursor:state.cursor,selectionAnchor:state.selectionAnchor,selectionFocus:state.selectionFocus};}
  function sameSnapshot(a,b){return Boolean(a&&b&&a.raw===b.raw&&a.cursor===b.cursor&&a.selectionAnchor===b.selectionAnchor&&a.selectionFocus===b.selectionFocus);}
  function historyStacks(){
    if(state.binding){
      if(!Array.isArray(state.binding.history))state.binding.history=[];
      if(!Array.isArray(state.binding.redoHistory))state.binding.redoHistory=[];
      return{undo:state.binding.history,redo:state.binding.redoHistory};
    }
    if(!Array.isArray(state.history))state.history=[];
    if(!Array.isArray(state.redoHistory))state.redoHistory=[];
    return{undo:state.history,redo:state.redoHistory};
  }
  function trimHistory(stack){if(stack.length>state.historyLimit)stack.splice(0,stack.length-state.historyLimit);}
  function pushSnapshot(stack,snapshot){if(!sameSnapshot(stack.at(-1),snapshot))stack.push(snapshot);trimHistory(stack);}
  function restoreSnapshot(snapshot){
    state.restoring=true;
    try{
      state.raw=snapshot.raw;
      state.cursor=snapshot.cursor;
      state.selectionAnchor=snapshot.selectionAnchor;
      state.selectionFocus=snapshot.selectionFocus;
      sync();
    }finally{state.restoring=false;}
    state.editor?.focus();
  }
  function recordUndo(){
    if(state.restoring)return;
    const stacks=historyStacks();
    pushSnapshot(stacks.undo,editSnapshot());
    stacks.redo.length=0;
  }
  function undo(){
    if(!state.input||state.input.disabled)return false;
    const stacks=historyStacks(),snapshot=stacks.undo.pop();if(!snapshot)return false;
    pushSnapshot(stacks.redo,editSnapshot());
    restoreSnapshot(snapshot);
    return true;
  }
  function redo(){
    if(!state.input||state.input.disabled)return false;
    const stacks=historyStacks(),snapshot=stacks.redo.pop();if(!snapshot)return false;
    pushSnapshot(stacks.undo,editSnapshot());
    restoreSnapshot(snapshot);
    return true;
  }
  function selectionClass(start,end){
    const r=selectionRange();return r.end>r.start&&end>r.start&&start<r.end?" bm-calc-selected":"";
  }
  function structureSelectionClass(start,end){
    const r=selectionRange();return r.end>r.start&&r.start<=start&&r.end>=end?" bm-calc-selected":"";
  }
  function caret(){return '<span class="bm-calc-caret" aria-hidden="true"></span>';}
  function emptyBox(){return '<span class="bm-calc-empty-slot">□</span>';}
  function findClose(s,open){
    let depth=0;
    for(let i=open;i<s.length;i++){
      if(s[i]==="(")depth++;
      else if(s[i]===")"){
        depth--;
        if(depth===0)return i;
      }
    }
    return -1;
  }

  // A fraction inserted by the keypad is stored as (numerator)/(denominator),
  // which the existing answer parsers understand. The editor renders that same
  // raw text as a normal stacked handwritten fraction.
  function fractionAt(s,i,end){
    if(s[i]===FRAC_OPEN){
      let depth=0,mid=-1;
      for(let j=i+1;j<end;j++){
        if(s[j]===FRAC_OPEN)depth++;
        else if(s[j]===FRAC_END){
          if(depth===0&&mid>=0)return {internal:true,numStart:i+1,numClose:mid,denStart:mid+1,denClose:j,end:j+1};
          if(depth>0)depth--;
        }else if(s[j]===FRAC_MID&&depth===0&&mid<0)mid=j;
      }
      return null;
    }
    if(s[i]!=="(")return null;
    const numClose=findClose(s,i);
    if(numClose<0||numClose+2>=end)return null;
    if(s[numClose+1]!=="/"||s[numClose+2]!=="(")return null;
    const denOpen=numClose+2;
    const denClose=findClose(s,denOpen);
    if(denClose<0||denClose>=end)return null;
    return {numStart:i+1,numClose,denStart:denOpen+1,denClose,end:denClose+1};
  }

  function serializeRange(start=0,end=state.raw.length){
    let out="",i=start;
    while(i<end){
      const f=fractionAt(state.raw,i,end);
      if(f&&f.internal){
        out+=`(${serializeRange(f.numStart,f.numClose)})/(${serializeRange(f.denStart,f.denClose)})`;
        i=f.end;continue;
      }
      out+=state.raw[i++];
    }
    return out;
  }

  // nth roots are stored as root(index,radicand), the format accepted by the
  // exact-answer parser.  Keep the two arguments as separate visible edit
  // zones so the index is never confused with the radicand.
  function rootAt(s,i,end){
    if(!s.startsWith("root(",i))return null;
    const open=i+4,close=findClose(s,open);
    if(close<0||close>=end)return null;
    let depth=0,comma=-1;
    for(let j=open+1;j<close;j++){
      if(s[j]==="(")depth++;
      else if(s[j]===")")depth--;
      else if(s[j]===","&&depth===0){comma=j;break;}
    }
    if(comma<0)return null;
    return{start:i,open,indexStart:open+1,indexEnd:comma,radStart:comma+1,radEnd:close,close,end:close+1};
  }

  function renderToken(display,start,end,cls=""){
    return `<span class="bm-calc-token${cls?" "+cls:""}${selectionClass(start,end)}" data-bm-start="${start}" data-bm-end="${end}">${escapeHtml(display)}</span>`;
  }

  function functionShellAt(start){
    const name=fnNames.find(f=>state.raw.startsWith(f+"(",start));
    if(!name)return null;
    const open=start+name.length;
    const close=findClose(state.raw,open);
    return {name,start,tokenEnd:open,argStart:open+1,close,end:close>=0?close+1:null};
  }
  function atomicAt(start){
    const word=atomicWords.find(w=>state.raw.startsWith(w,start)) ||
      fnNames.find(w=>state.raw.startsWith(w,start));
    return word?{word,start,end:start+word.length}:null;
  }
  function normalizeCursor(pos,dir=0){
    let p=Math.max(0,Math.min(Number(pos)||0,state.raw.length));
    // Invisible fraction syntax )/( is one visual boundary between the stacked
    // numerator and denominator, so no caret may sit inside those raw characters.
    for(let start=0;start<state.raw.length;start++){
      const f=fractionAt(state.raw,start,state.raw.length);
      if(f&&p>f.numClose&&p<f.denStart){
        if(dir>0)return f.denStart;
        if(dir<0)return f.numClose;
        return (p-f.numClose)<=(f.denStart-p)?f.numClose:f.denStart;
      }
    }
    // Likewise, ^( is rendered as one superscript entry boundary.
    for(let i=0;i<state.raw.length-1;i++){
      if(state.raw.startsWith("^(",i)&&p>i&&p<i+2){
        if(dir>0)return i+2;
        if(dir<0)return i;
        return (p-i)<=(i+2-p)?i:i+2;
      }
    }
    // Function names stay atomic, but the position immediately after the name is
    // a real caret stop. This lets a student turn sec(x) into sec^2(x) by moving
    // between sec and ( and inserting an exponent.
    for(let start=0;start<state.raw.length;start++){
      const sh=functionShellAt(start);
      if(sh&&p>sh.start&&p<sh.argStart){
        if(p===sh.tokenEnd)return p;
        if(dir>0)return sh.tokenEnd;
        if(dir<0)return sh.start;
        return (p-sh.start)<=(sh.tokenEnd-p)?sh.start:sh.tokenEnd;
      }
    }
    // Standalone words that display as a single semantic item are atomic.
    for(let start=0;start<state.raw.length;start++){
      const a=atomicAt(start);if(!a)continue;
      if(fnNames.includes(a.word)&&state.raw[a.end]==="(")continue;
      if(p>a.start&&p<a.end){
        if(dir>0)return a.end;
        if(dir<0)return a.start;
        return (p-a.start)<=(a.end-p)?a.start:a.end;
      }
    }
    return p;
  }

  function renderPlain(start,end){
    const s=state.raw;
    let out="",i=start;
    while(i<end){
      if(!hasSelection()&&state.cursor===i)out+=caret();

      const root=rootAt(s,i,end);
      if(root){
        let index=renderPlain(root.indexStart,root.indexEnd);
        let radicand=renderPlain(root.radStart,root.radEnd);
        if(root.indexStart===root.indexEnd)index+=emptyBox();
        if(root.radStart===root.radEnd)radicand+=emptyBox();
        out+=`<span class="bm-calc-nroot${structureSelectionClass(i,root.end)}" data-bm-root-start="${i}" data-bm-root-end="${root.end}"><sup class="bm-calc-nroot-index" data-bm-zone="nroot-index" data-bm-zone-start="${root.indexStart}" data-bm-zone-end="${root.indexEnd}">${index}</sup><span class="bm-calc-nroot-sign" aria-hidden="true"><svg viewBox="0 0 30 38" preserveAspectRatio="none" focusable="false"><path d="M1 21 H7 L12 36 L18 1 H30"/></svg></span><span class="bm-calc-nroot-radicand" data-bm-zone="nroot-radicand" data-bm-zone-start="${root.radStart}" data-bm-zone-end="${root.radEnd}">${radicand}</span></span>`;
        i=root.end;
        continue;
      }

      const frac=fractionAt(s,i,end);
      if(frac){
        let num=renderPlain(frac.numStart,frac.numClose);
        let den=renderPlain(frac.denStart,frac.denClose);
        if(frac.numStart===frac.numClose)num+=emptyBox();
        if(frac.denStart===frac.denClose)den+=emptyBox();
        out+=`<span class="bm-calc-frac${structureSelectionClass(i,frac.end)}" data-bm-frac-start="${i}" data-bm-frac-end="${frac.end}"><span class="bm-calc-frac-num" data-bm-zone="num" data-bm-zone-start="${frac.numStart}" data-bm-zone-end="${frac.numClose}">${num}</span><span class="bm-calc-frac-den" data-bm-zone="den" data-bm-zone-start="${frac.denStart}" data-bm-zone-end="${frac.denClose}">${den}</span></span>`;
        i=frac.end;
        continue;
      }

      if(s.startsWith("^(",i)){
        const close=findClose(s,i+1);
        if(close>=0&&close<end){
          let inner=renderPlain(i+2,close);
          if(i+2===close)inner+=emptyBox();
          out+=`<sup class="${structureSelectionClass(i,close+1).trim()}" data-bm-zone="exp" data-bm-zone-start="${i+2}" data-bm-zone-end="${close}">${inner}</sup>`;
          i=close+1;
          continue;
        }
      }

      let token=null,shown=null;
      for(const f of fnNames){
        if(s.startsWith(f,i)){token=f;shown=f==="sqrt"?"√":f==="cbrt"?"∛":f==="root"?"ⁿ√":f==="fp"?"f′":f==="gp"?"g′":f;break;}
      }
      if(token){
        out+=renderToken(shown,i,i+token.length,"function");
        i+=token.length;
        continue;
      }
      if(s.startsWith("infinity",i)){out+=renderToken("∞",i,i+8,"math infinity");i+=8;continue;}
      if(s.startsWith("undefined",i)){out+=renderToken("Undefined",i,i+9,"word");i+=9;continue;}
      if(s.startsWith("DNE",i)){out+=renderToken("DNE",i,i+3,"word");i+=3;continue;}
      if(s.startsWith("pi",i)){out+=renderToken("π",i,i+2,"math");i+=2;continue;}

      const ch=s[i];
      out+=renderToken(ch==="*"?"·":ch==="/"?"÷":ch==="-"?"−":ch,i,i+1);
      i++;
    }
    if(!hasSelection()&&state.cursor===end)out+=caret();
    return out;
  }

  function allFractions(start=0,end=state.raw.length,out=[]){
    let i=start;
    while(i<end){
      const root=rootAt(state.raw,i,end);
      if(root){
        allFractions(root.indexStart,root.indexEnd,out);
        allFractions(root.radStart,root.radEnd,out);
        i=root.end;continue;
      }
      const frac=fractionAt(state.raw,i,end);
      if(frac){
        out.push({...frac,start:i});
        allFractions(frac.numStart,frac.numClose,out);
        allFractions(frac.denStart,frac.denClose,out);
        i=frac.end;continue;
      }
      if(state.raw.startsWith("^(",i)){
        const close=findClose(state.raw,i+1);
        if(close>=0&&close<end){allFractions(i+2,close,out);i=close+1;continue;}
      }
      i++;
    }
    return out;
  }

  function allRoots(){
    const out=[];
    for(let i=0;i<state.raw.length;i++){
      const root=rootAt(state.raw,i,state.raw.length);
      if(root)out.push(root);
    }
    return out.sort((a,b)=>(a.end-a.start)-(b.end-b.start));
  }

  function containingFraction(cursor=state.cursor){
    const matches=allFractions().filter(f=>(cursor>=f.numStart&&cursor<=f.numClose)||(cursor>=f.denStart&&cursor<=f.denClose));
    if(!matches.length)return null;
    matches.sort((a,b)=>(a.end-a.start)-(b.end-b.start));
    return matches[0];
  }

  function allExponents(){
    const out=[];
    for(let start=0;start<state.raw.length-1;start++){
      if(!state.raw.startsWith("^(",start))continue;
      const close=findClose(state.raw,start+1);
      if(close>=0)out.push({start,innerStart:start+2,close,end:close+1});
    }
    return out.sort((a,b)=>(a.end-a.start)-(b.end-b.start));
  }

  function overlaps(r,start,end){return r.end>start&&r.start<end;}
  function inside(r,start,end){return r.start>=start&&r.end<=end;}
  // A cut must never strand one of the editor's hidden structure markers.
  // Selections wholly inside a numerator, denominator, exponent, radical, or
  // function argument stay local. A selection crossing a structure boundary
  // expands to the complete structure before it is copied/cut.
  function safeSelectionRange(range=selectionRange()){
    let r={start:Math.max(0,range.start),end:Math.min(state.raw.length,range.end)},changed=true;
    while(changed&&r.end>r.start){
      changed=false;
      for(const f of allFractions()){
        if(!overlaps(r,f.start,f.end))continue;
        if(inside(r,f.numStart,f.numClose)||inside(r,f.denStart,f.denClose)||inside(r,f.start,f.end)&&r.start===f.start&&r.end===f.end)continue;
        const start=Math.min(r.start,f.start),end=Math.max(r.end,f.end);if(start!==r.start||end!==r.end){r={start,end};changed=true;}
      }
      for(const root of allRoots()){
        if(!overlaps(r,root.start,root.end))continue;
        if(inside(r,root.indexStart,root.indexEnd)||inside(r,root.radStart,root.radEnd)||r.start===root.start&&r.end===root.end)continue;
        const start=Math.min(r.start,root.start),end=Math.max(r.end,root.end);if(start!==r.start||end!==r.end){r={start,end};changed=true;}
      }
      for(const x of allExponents()){
        if(!overlaps(r,x.start,x.end))continue;
        if(inside(r,x.innerStart,x.close)||r.start===x.start&&r.end===x.end)continue;
        const start=Math.min(r.start,x.start),end=Math.max(r.end,x.end);if(start!==r.start||end!==r.end){r={start,end};changed=true;}
      }
      for(let start=0;start<state.raw.length;start++){
        const sh=functionShellAt(start);if(!sh?.end||!overlaps(r,sh.start,sh.end))continue;
        if(inside(r,sh.argStart,sh.close)||inside(r,sh.start,sh.tokenEnd)||r.start===sh.start&&r.end===sh.end)continue;
        const next={start:Math.min(r.start,sh.start),end:Math.max(r.end,sh.end)};if(next.start!==r.start||next.end!==r.end){r=next;changed=true;}
      }
      for(let start=0;start<state.raw.length;start++){
        const a=atomicAt(start);if(!a||!overlaps(r,a.start,a.end)||inside(r,a.start,a.end))continue;
        const next={start:Math.min(r.start,a.start),end:Math.max(r.end,a.end)};if(next.start!==r.start||next.end!==r.end){r=next;changed=true;}
      }
    }
    return r;
  }

  function normalizePastedText(value){
    let text=String(value??'').trim().replace(/[−–—]/g,'-').replace(/π/g,'pi').replace(/∞/g,'infinity').replace(/[×·]/g,'*');
    text=text.replace(/^\$+|\$+$/g,'').replace(/\\left|\\right/g,'').replace(/\\,/g,'').replace(/\\;/g,'');
    let prior='';
    while(prior!==text){
      prior=text;
      text=text.replace(/\\(?:dfrac|tfrac|frac)\{([^{}]*)\}\{([^{}]*)\}/g,'($1)/($2)');
      text=text.replace(/\\sqrt\[([^\]]+)\]\{([^{}]*)\}/g,'root($1,$2)');
      text=text.replace(/\\sqrt\{([^{}]*)\}/g,'sqrt($1)');
    }
    return text.replace(/\\pi/g,'pi').replace(/\\infty/g,'infinity').replace(/\\(?:cdot|times)/g,'*').replace(/\^\{([^{}]+)\}/g,'^($1)').replace(/[{}]/g,'').replace(/\s+/g,'');
  }

  function removeSelection(){
    if(!hasSelection())return false;
    recordUndo();const r=safeSelectionRange();state.raw=state.raw.slice(0,r.start)+state.raw.slice(r.end);collapseSelection(r.start);sync();return true;
  }
  function replaceSelection(text){
    recordUndo();
    const r=hasSelection()?safeSelectionRange():{start:state.cursor,end:state.cursor};
    state.raw=state.raw.slice(0,r.start)+text+state.raw.slice(r.end);collapseSelection(r.start+text.length);sync();state.editor?.focus();
  }
  function copySelection(event,cut=false){
    if(!hasSelection()||!event.clipboardData)return;
    const r=safeSelectionRange(),plain=serializeRange(r.start,r.end),raw=state.raw.slice(r.start,r.end);
    event.preventDefault();event.clipboardData.setData('text/plain',plain);
    try{event.clipboardData.setData('application/x-batchmath-expression',JSON.stringify({version:1,raw}));}catch(_){}
    if(cut&&!state.input?.disabled){state.selectionAnchor=r.start;state.selectionFocus=r.end;state.cursor=r.end;removeSelection();}
  }
  function pasteSelection(event){
    if(state.input?.disabled||!event.clipboardData)return;
    event.preventDefault();let value='';
    try{const custom=event.clipboardData.getData('application/x-batchmath-expression');if(custom)value=JSON.parse(custom).raw||'';}catch(_){}
    if(!value)value=normalizePastedText(event.clipboardData.getData('text/plain'));
    replaceSelection(String(value));
  }

  function removeSpan(start,end){
    recordUndo();
    state.raw=state.raw.slice(0,start)+state.raw.slice(end);
    collapseSelection(start);
    sync();state.editor.focus();
  }


  function keepCursorVisible(){
    const editor=state.editor;if(!editor)return;
    nextFrame(()=>{
      if(editor!==state.editor)return;
      const marker=editor.querySelector?.('.bm-calc-caret');if(!marker)return;
      const editorRect=editor.getBoundingClientRect(),markerRect=marker.getBoundingClientRect(),padding=14;
      if(markerRect.right>editorRect.right-padding)editor.scrollLeft+=markerRect.right-(editorRect.right-padding);
      else if(markerRect.left<editorRect.left+padding)editor.scrollLeft-=editorRect.left+padding-markerRect.left;
    });
  }

  function render(){
    if(!state.editor)return;
    state.cursor=normalizeCursor(state.cursor,0);
    if(!hasSelection()){state.selectionAnchor=state.cursor;state.selectionFocus=state.cursor;}
    state.selectionAnchor=normalizeCursor(state.selectionAnchor,0);
    state.selectionFocus=normalizeCursor(state.selectionFocus,0);
    const disabled=!!state.input?.disabled;
    state.editor.classList.toggle("is-disabled",disabled);
    state.pad?.classList.toggle("is-disabled",disabled);
    if(!state.raw)state.editor.innerHTML=caret()+'<span class="bm-calc-empty">Enter answer</span>';
    else state.editor.innerHTML=renderPlain(0,state.raw.length);
    state.editor.setAttribute("aria-valuetext",state.raw||"blank");
    if(state.binding){state.binding.raw=state.raw;state.binding.cursor=state.cursor;state.binding.selectionAnchor=state.selectionAnchor;state.binding.selectionFocus=state.selectionFocus;}
    keepCursorVisible();
  }

  function sync(){
    if(!state.input)return;
    state.input.value=serializeRange();
    if(state.binding){state.binding.raw=state.raw;state.binding.cursor=state.cursor;state.binding.selectionAnchor=state.selectionAnchor;state.binding.selectionFocus=state.selectionFocus;}
    state.input.dispatchEvent(new Event("input",{bubbles:true}));
    render();
  }
  function setRaw(raw,cursor,{record=true}={}){
    if(record)recordUndo();
    state.raw=String(raw||"");
    collapseSelection(cursor==null?state.raw.length:cursor);
    sync();
  }
  function insert(text,insideOffset){
    if(!state.input||state.input.disabled)return;
    state.cursor=normalizeCursor(state.cursor,0);
    recordUndo();
    const range=hasSelection()?safeSelectionRange():{start:state.cursor,end:state.cursor};
    state.raw=state.raw.slice(0,range.start)+text+state.raw.slice(range.end);
    collapseSelection(normalizeCursor(range.start+(insideOffset==null?text.length:insideOffset),1));
    sync();
    state.editor.focus();
  }
  function insertFunction(name){insert(name+"()",name.length+1);}
  function insertExponent(){insert("^()",2);}

  // Insert a true editable stacked fraction. Underneath, the value remains
  // parser-friendly as (numerator)/(denominator).
  function insertFraction(){insert(FRAC_OPEN+FRAC_MID+FRAC_END,1);}

  // Keyboard / and the keypad's division-position key create a stacked fraction.
  // If a numerator is already immediately to the left, promote that current
  // top-level term into the numerator instead of showing a plain division glyph.
  function fractionFromLeft(){
    if(!state.input||state.input.disabled)return;
    state.cursor=normalizeCursor(state.cursor,0);
    const left=state.raw.slice(0,state.cursor),right=state.raw.slice(state.cursor);
    let depth=0,start=0;
    for(let i=left.length-1;i>=0;i--){
      const ch=left[i];
      if(ch===")")depth++;
      else if(ch==="("){
        depth--;
        if(depth<0){start=i+1;break;}
      }
      else if(depth===0&&(ch==="+"||ch==="-"||ch===",")){start=i+1;break;}
    }
    const numerator=left.slice(start);
    if(!numerator){insertFraction();return;}
    recordUndo();
    state.raw=left.slice(0,start)+FRAC_OPEN+numerator+FRAC_MID+FRAC_END+right;
    state.cursor=left.slice(0,start).length+numerator.length+2;
    sync();
    state.editor.focus();
  }

  function backspace(){
    if(!state.input||state.input.disabled)return;
    if(removeSelection())return;
    if(state.cursor<=0)return;
    state.cursor=normalizeCursor(state.cursor,-1);
    if(state.cursor<=0)return;

    for(const root of allRoots()){
      const emptyIndex=root.indexStart===root.indexEnd,emptyRadicand=root.radStart===root.radEnd;
      if(state.cursor===root.indexStart&&emptyIndex){
        if(emptyRadicand)removeSpan(root.start,root.end);
        else{state.cursor=root.start;render();state.editor.focus();}
        return;
      }
      if(state.cursor===root.radStart){state.cursor=root.indexEnd;render();state.editor.focus();return;}
      if(state.cursor===root.end){state.cursor=root.radEnd;render();state.editor.focus();return;}
    }

    // Fractions are stored as ()/(). Never delete only one of those hidden
    // structural characters: doing so exposes raw slashes and parentheses.
    for(const f of allFractions().sort((a,b)=>(a.end-a.start)-(b.end-b.start))){
      const emptyNum=f.numStart===f.numClose,emptyDen=f.denStart===f.denClose;
      if(state.cursor===f.numStart){
        if(emptyNum&&emptyDen)removeSpan(f.start,f.end);
        else{state.cursor=f.start;render();state.editor.focus();}
        return;
      }
      if(state.cursor===f.denStart){state.cursor=f.numClose;render();state.editor.focus();return;}
      if(state.cursor===f.end){removeSpan(f.start,f.end);return;}
    }

    // The same rule applies to the hidden ^( ) shell used for exponents.
    for(const x of allExponents()){
      if(state.cursor===x.innerStart){
        if(x.innerStart===x.close)removeSpan(x.start,x.end);
        else{state.cursor=x.start;render();state.editor.focus();}
        return;
      }
      if(state.cursor===x.end){state.cursor=x.close;render();state.editor.focus();return;}
    }

    // Keep parser syntax intact. Backspace never peels one hidden character out
    // of sin/cos/sqrt/pi/infinity/etc. or removes a structural parenthesis.
    for(let i=Math.max(0,state.cursor-16);i<state.cursor;i++){
      const sh=functionShellAt(i);
      if(sh&&sh.end===state.cursor){
        if(sh.close===sh.argStart){
          recordUndo();
          state.raw=state.raw.slice(0,sh.start)+state.raw.slice(sh.end);
          state.cursor=sh.start;
        }else state.cursor=sh.close;
        sync();state.editor.focus();return;
      }
      if(sh&&sh.argStart===state.cursor){
        if(sh.close===sh.argStart){
          recordUndo();
          state.raw=state.raw.slice(0,sh.start)+state.raw.slice(sh.end);
          state.cursor=sh.start;
        }else state.cursor=sh.start;
        sync();state.editor.focus();return;
      }
      const a=atomicAt(i);
      if(a&&a.end===state.cursor&&!(fnNames.includes(a.word)&&state.raw[a.end]==="(")){
        recordUndo();
        state.raw=state.raw.slice(0,a.start)+state.raw.slice(a.end);
        state.cursor=a.start;
        sync();state.editor.focus();return;
      }
    }

    // Remove an untouched exponent shell as one unit.
    if(state.raw.slice(Math.max(0,state.cursor-2),state.cursor)==="^("&&state.raw[state.cursor]===")"){
      recordUndo();
      state.raw=state.raw.slice(0,state.cursor-2)+state.raw.slice(state.cursor+1);
      state.cursor-=2;
      sync();
      return;
    }
    recordUndo();
    const a=state.raw.slice(0,state.cursor-1),b=state.raw.slice(state.cursor);
    state.raw=a+b;
    state.cursor=normalizeCursor(state.cursor-1,-1);
    sync();
  }
  function del(){
    if(!state.input||state.input.disabled)return;
    if(removeSelection())return;
    if(state.cursor>=state.raw.length)return;
    state.cursor=normalizeCursor(state.cursor,1);
    if(state.cursor>=state.raw.length)return;

    for(const root of allRoots()){
      const emptyIndex=root.indexStart===root.indexEnd,emptyRadicand=root.radStart===root.radEnd;
      if(state.cursor===root.start){
        if(emptyIndex&&emptyRadicand)removeSpan(root.start,root.end);
        else{state.cursor=root.indexStart;render();state.editor.focus();}
        return;
      }
      if(state.cursor===root.indexEnd){state.cursor=root.radStart;render();state.editor.focus();return;}
      if(state.cursor===root.radEnd){state.cursor=root.end;render();state.editor.focus();return;}
    }

    for(const f of allFractions().sort((a,b)=>(a.end-a.start)-(b.end-b.start))){
      const emptyNum=f.numStart===f.numClose,emptyDen=f.denStart===f.denClose;
      if(state.cursor===f.start){
        removeSpan(f.start,f.end);
        return;
      }
      if(state.cursor===f.numStart&&emptyNum){
        if(emptyDen)removeSpan(f.start,f.end);
        else{state.cursor=f.denStart;render();state.editor.focus();}
        return;
      }
      if(state.cursor===f.numClose){state.cursor=f.denStart;render();state.editor.focus();return;}
      if(state.cursor===f.denStart&&emptyDen){state.cursor=f.end;render();state.editor.focus();return;}
      if(state.cursor===f.denClose){state.cursor=f.end;render();state.editor.focus();return;}
    }

    for(const x of allExponents()){
      if(state.cursor===x.start){
        if(x.innerStart===x.close)removeSpan(x.start,x.end);
        else{state.cursor=x.innerStart;render();state.editor.focus();}
        return;
      }
      if(state.cursor===x.innerStart&&x.innerStart===x.close){removeSpan(x.start,x.end);return;}
      if(state.cursor===x.close){state.cursor=x.end;render();state.editor.focus();return;}
    }

    const sh=functionShellAt(state.cursor);
    if(sh){
      if(sh.close===sh.argStart){
        recordUndo();
        state.raw=state.raw.slice(0,sh.start)+state.raw.slice(sh.end);
        state.cursor=sh.start;
      }else state.cursor=sh.argStart;
      sync();state.editor.focus();return;
    }
    for(let i=Math.max(0,state.cursor-16);i<=state.cursor;i++){
      const shell=functionShellAt(i);
      if(shell&&shell.close===state.cursor){state.cursor=shell.end;sync();state.editor.focus();return;}
    }
    const a=atomicAt(state.cursor);
    if(a&&!(fnNames.includes(a.word)&&state.raw[a.end]==="(")){
      recordUndo();
      state.raw=state.raw.slice(0,a.start)+state.raw.slice(a.end);
      state.cursor=a.start;
      sync();state.editor.focus();return;
    }
    recordUndo();
    state.raw=state.raw.slice(0,state.cursor)+state.raw.slice(state.cursor+1);
    state.cursor=normalizeCursor(state.cursor,1);
    sync();
  }
  function move(delta,extend=false){
    if(!state.input||state.input.disabled)return;
    if(hasSelection()&&!extend){const r=selectionRange();collapseSelection(delta<0?r.start:r.end);render();state.editor.focus();return;}
    const anchor=extend?(hasSelection()?state.selectionAnchor:state.cursor):null;
    state.cursor=normalizeCursor(state.cursor,delta);
    if(delta>0){
      const sh=functionShellAt(state.cursor);
      if(sh){
        state.cursor=sh.tokenEnd;
      }else{
        let shellAfterName=null;
        for(let i=Math.max(0,state.cursor-12);i<state.cursor;i++){
          const candidate=functionShellAt(i);
          if(candidate&&candidate.tokenEnd===state.cursor){shellAfterName=candidate;break;}
        }
        if(shellAfterName){
          state.cursor=shellAfterName.argStart;
        }else if(state.raw[state.cursor]===FRAC_MID){
          state.cursor=Math.min(state.raw.length,state.cursor+1);
        }else if(state.raw[state.cursor]===")" && state.raw.slice(state.cursor,state.cursor+3)===")/("){
          state.cursor=Math.min(state.raw.length,state.cursor+3);
        }else if(state.raw.slice(state.cursor,state.cursor+2)==="^("){
          state.cursor=Math.min(state.raw.length,state.cursor+2);
        }else{
          const a=atomicAt(state.cursor);
          if(a)state.cursor=Math.min(state.raw.length,a.end);
          else state.cursor=Math.min(state.raw.length,state.cursor+1);
        }
      }
      state.cursor=normalizeCursor(state.cursor,1);
    }else if(delta<0){
      // The caret can stop after a function name so an exponent may be inserted
      // before its opening parenthesis.
      const shStart=Math.max(0,state.cursor-12);
      let shell=null;
      for(let i=shStart;i<state.cursor;i++){
        const candidate=functionShellAt(i);
        if(candidate&&candidate.argStart===state.cursor){shell=candidate;break;}
      }
      if(shell){
        state.cursor=shell.tokenEnd;
      }else if(state.raw[state.cursor-1]===FRAC_MID){
        state.cursor=Math.max(0,state.cursor-1);
      }else if(state.raw.slice(Math.max(0,state.cursor-3),state.cursor)===")/("){
        state.cursor=Math.max(0,state.cursor-3);
      }else if(state.raw.slice(Math.max(0,state.cursor-2),state.cursor)==="^("){
        state.cursor=Math.max(0,state.cursor-2);
      }else{
        let a=null;
        for(let i=Math.max(0,state.cursor-12);i<state.cursor;i++){
          const candidate=atomicAt(i);
          if(candidate&&candidate.end===state.cursor&&!(fnNames.includes(candidate.word)&&state.raw[candidate.end]==="(")){a=candidate;break;}
        }
        if(a)state.cursor=Math.max(0,a.start);
        else state.cursor=Math.max(0,state.cursor-1);
      }
      state.cursor=normalizeCursor(state.cursor,-1);
    }
    if(extend){state.selectionAnchor=anchor;state.selectionFocus=state.cursor;}else collapseSelection(state.cursor);
    render();
    state.editor.focus();
  }
  function moveVertical(delta,extend=false){
    if(!state.input||state.input.disabled)return;
    const anchor=extend?(hasSelection()?state.selectionAnchor:state.cursor):null;
    state.cursor=normalizeCursor(state.cursor,delta);
    const f=containingFraction();
    if(!f)return;
    if(delta<0 && state.cursor>=f.denStart&&state.cursor<=f.denClose){
      const off=state.cursor-f.denStart;
      state.cursor=f.numStart+Math.min(off,f.numClose-f.numStart);
    }else if(delta>0 && state.cursor>=f.numStart&&state.cursor<=f.numClose){
      const off=state.cursor-f.numStart;
      state.cursor=f.denStart+Math.min(off,f.denClose-f.denStart);
    }else return;
    state.cursor=normalizeCursor(state.cursor,delta);
    if(extend){state.selectionAnchor=anchor;state.selectionFocus=state.cursor;}else collapseSelection(state.cursor);
    render();
    state.editor.focus();
  }

  function clear(){
    if(!state.input||state.input.disabled)return;
    setRaw("",0);
    state.editor.focus();
  }
  function check(){
    if(typeof state.onCheck==="function"){state.onCheck();return;}
    const btn=document.getElementById("submit");
    if(btn&&!btn.disabled)btn.click();
  }
  function next(){
    const btn=document.getElementById("next");
    if(btn&&getComputedStyle(btn).display!=="none")btn.click();
  }

  function key(label,cls,fn,aria,html=false){
    const b=document.createElement("button");
    b.type="button";
    b.className="bm-calc-key"+(cls?" "+cls:"");
    if(html)b.innerHTML=label;else b.textContent=label;
    if(aria)b.setAttribute("aria-label",aria);
    b.addEventListener("pointerdown",e=>e.preventDefault());
    b.addEventListener("click",fn);
    return b;
  }
  function spacer(parent){
    const s=document.createElement("span");
    s.className="bm-calc-spacer";
    s.setAttribute("aria-hidden","true");
    parent.appendChild(s);
  }
  function addInsert(grid,label,raw,cls="",aria){grid.appendChild(key(label,cls,()=>insert(raw),aria));}
  function addFunction(grid,label,name){grid.appendChild(key(label,"function",()=>insertFunction(name),`Insert ${label}`));}
  const fractionKeyHTML='<span class="bm-calc-key-frac" aria-hidden="true"><span>a</span><span>b</span></span>';
  function addFraction(grid,smart=false){grid.appendChild(key(fractionKeyHTML,"symbol fraction",smart?fractionFromLeft:insertFraction,"Insert stacked fraction",true));}

  function buildPad(mode){
    const pad=document.createElement("div");
    pad.className=`bm-calc-keypad bm-calc-mode-${mode}`;
    pad.setAttribute("role","group");
    pad.setAttribute("aria-label","BatchMath calculus answer keypad");

    if(mode==="unit3"){
      const structures=document.createElement("div");
      structures.className="bm-calc-special-row";
      addFraction(structures);
      addFunction(structures,"√","sqrt");
      addFunction(structures,"ln","ln");
      structures.appendChild(key("xⁿ","symbol",insertExponent,"Insert exponent"));
      pad.appendChild(structures);

      const constants=document.createElement("div");
      constants.className="bm-calc-special-row";
      addInsert(constants,"e","e","function");
      addInsert(constants,"π","pi","function");
      addInsert(constants,"∞","infinity","function math-infinity-key","Insert infinity");
      addInsert(constants,"−∞","-infinity","function math-infinity-key","Insert negative infinity");
      pad.appendChild(constants);
    }else if(mode==="limits"){
      const special=document.createElement("div");
      special.className="bm-calc-special-row";
      addFraction(special);
      addFunction(special,"√","sqrt");
      addFunction(special,"∛","cbrt");
      special.appendChild(key("ⁿ√","function",()=>insert("root(,)",5),"Insert nth root; enter the index, then move right to enter the radicand"));
      addFunction(special,"ln","ln");
      addInsert(special,"e","e","function");
      addInsert(special,"π","pi","function");
      special.appendChild(key("xⁿ","symbol",insertExponent,"Insert exponent"));
      addInsert(special,"DNE","DNE","function","Insert DNE");
      addInsert(special,"∞","infinity","function math-infinity-key","Insert infinity");
      addInsert(special,"−∞","-infinity","function math-infinity-key","Insert negative infinity");
      pad.appendChild(special);
    }else{
      const funcs=document.createElement("div");
      funcs.className="bm-calc-function-row";
      [["sin","sin"],["cos","cos"],["tan","tan"],["sec","sec"],["csc","csc"],["cot","cot"],["ln","ln"],["√","sqrt"],["|u|","abs"]].forEach(([lab,name])=>addFunction(funcs,lab,name));
      if(mode==="derivative"&&document.querySelector('input[data-bm-inverse-trig-keypad="1"]')){
        [["sin⁻¹","asin"],["cos⁻¹","acos"],["tan⁻¹","atan"],["cot⁻¹","acot"],["sec⁻¹","asec"],["csc⁻¹","acsc"],["log","log"]].forEach(([lab,name])=>addFunction(funcs,lab,name));
      }
      if(mode==="derivative"&&document.querySelector('input[data-bm-symbolic-functions="1"]')){
        [["f","f"],["g","g"],["f′","fp"],["g′","gp"]].forEach(([lab,name])=>addFunction(funcs,lab,name));
      }
      addInsert(funcs,"e","e","function");
      addInsert(funcs,"π","pi","function");
      addFraction(funcs);
      pad.appendChild(funcs);
    }

    const g=document.createElement("div");
    g.className="bm-calc-main-grid";
    if(mode==="unit3"){
      [["7","7"],["8","8"],["9","9"],["(","("],[")",")"],
       ["4","4"],["5","5"],["6","6"],["+","+"],["−","-"],
       ["1","1"],["2","2"],["3","3"],["·","*"],["=","="],
       ["0","0"],[".","."],["x","x"],["y","y"],["c","c"]]
        .forEach(([lab,raw])=>addInsert(g,lab,raw,/[+−·()=]/.test(lab)?"symbol":""));
    }else if(mode==="limits"){
      // A compact numeric layout. Every key here produces an answer format the
      // Limits engine actually accepts.
      [["7","7"],["8","8"],["9","9"],["−","-"],
       ["4","4"],["5","5"],["6","6"],["·","*"],
       ["1","1"],["2","2"],["3","3"],[".","."],
       ["0","0"],["(","("],[")",")"],["+","+"]]
        .forEach(([lab,raw])=>addInsert(g,lab,raw,lab==="−"?"symbol":""));
    }else{
      // Five-column layout keeps parentheses adjacent and preserves the same
      // logical rows on both desktop and mobile.
      [["7","7"],["8","8"],["9","9"],["(","("],[")",")"],
       ["4","4"],["5","5"],["6","6"],["+","+"],["−","-"],
       ["1","1"],["2","2"],["3","3"],["·","*"]]
        .forEach(([lab,raw])=>addInsert(g,lab,raw,/[+−·()]/.test(lab)?"symbol":""));
      addFraction(g,true);
      [["0","0"],[".","."],["x","x"]]
        .forEach(([lab,raw])=>addInsert(g,lab,raw));
      if(mode==="derivative")addInsert(g,"y","y");
      else if(mode==="integral")addInsert(g,"C","C","function");
      g.appendChild(key("xⁿ","symbol",insertExponent,"Insert exponent"));
    }
    pad.appendChild(g);

    if(mode==="unit3"){
      const extras=document.createElement("div");
      extras.className="bm-calc-function-row bm-calc-unit3-extra-row";
      addInsert(extras,"a₁","a₁","function","Insert a sub one");
      addInsert(extras,"aₙ","aₙ","function","Insert a sub n");
      addInsert(extras,"aₙ₋₁","aₙ₋₁","function","Insert a sub n minus one");
      addInsert(extras,"n","n","function","Insert n");
      addInsert(extras,",",",","symbol","Comma between multiple values");
      addInsert(extras,"[","[","symbol","Insert left bracket");
      addInsert(extras,"]","]","symbol","Insert right bracket");
      addInsert(extras,"∪","U","symbol","Insert union");
      addInsert(extras,"Under","underestimate","function","Insert underestimate");
      addInsert(extras,"Over","overestimate","function","Insert overestimate");
      pad.appendChild(extras);
    }

    const u=document.createElement("div");
    u.className="bm-calc-utility-row";
    if(mode==="integral")addInsert(u,",",",","symbol","Comma between multiple values");
    u.appendChild(key("←","utility navigation",()=>move(-1),"Move cursor left"));
    u.appendChild(key("→","utility navigation",()=>move(1),"Move cursor right"));
    u.appendChild(key("↑","utility navigation",()=>moveVertical(-1),"Move from denominator to numerator"));
    u.appendChild(key("↓","utility navigation",()=>moveVertical(1),"Move from numerator to denominator"));
    u.appendChild(key("⌫","utility",backspace,"Backspace"));
    u.appendChild(key("Del","utility",del,"Delete"));
    u.appendChild(key("Clear","utility",clear,"Clear answer"));
    u.appendChild(key("Check","check",check,"Check answer"));
    pad.appendChild(u);
    return pad;
  }

  function onEditorKey(e){
    if(!state.input||state.input.disabled){
      if(e.key==="Enter"){e.preventDefault();next();}
      return;
    }
    if((e.ctrlKey||e.metaKey)&&!e.altKey){
      const key=e.key.toLowerCase();
      if(key==='z'){e.preventDefault();if(e.shiftKey)redo();else undo();return;}
      if(key==='y'){e.preventDefault();redo();return;}
      if(key==='a'){e.preventDefault();state.selectionAnchor=0;state.selectionFocus=state.raw.length;state.cursor=state.raw.length;render();return;}
      if(key==='c'||key==='x'||key==='v')return;
    }
    if(e.key==="ArrowLeft"){e.preventDefault();move(-1,e.shiftKey);return;}
    if(e.key==="ArrowRight"){e.preventDefault();move(1,e.shiftKey);return;}
    if(e.key==="ArrowUp"){e.preventDefault();moveVertical(-1,e.shiftKey);return;}
    if(e.key==="ArrowDown"){e.preventDefault();moveVertical(1,e.shiftKey);return;}
    if(e.key==="Backspace"){e.preventDefault();backspace();return;}
    if(e.key==="Delete"){e.preventDefault();del();return;}
    if(e.key==="Enter"){e.preventDefault();check();return;}
    // ChromeOS can report Shift+6 as a dead/accent key instead of "^".
    // The physical Digit6 fallback keeps exponent entry working there while
    // preserving the normal key-value path on other keyboards.
    if(e.key==="^"||(e.shiftKey&&e.code==="Digit6")){e.preventDefault();insertExponent();return;}
    if(e.key==="/"){e.preventDefault();fractionFromLeft();return;}
    if(e.key==="'"&&state.mode==="derivative"&&state.input?.dataset.bmSymbolicFunctions==="1"){
      const prior=state.raw[state.cursor-1];
      if(prior==="f"||prior==="g"){e.preventDefault();insert("p");return;}
    }
    if(e.key.length===1&&/[0-9a-zA-Z+\-*().,=\[\]]/.test(e.key)){e.preventDefault();insert(e.key);return;}
  }

  function reset(){
    if(!state.input)return;
    state.raw=state.input.value||"";
    collapseSelection(state.raw.length);
    const stacks=historyStacks();stacks.undo.length=0;stacks.redo.length=0;
    render();
  }
  function focus(){state.editor?.focus();}
  function pointerPosition(e,target=e.target){
    const tok=target?.closest?.('[data-bm-start]');
    if(tok&&state.editor.contains(tok)){
      const a=Number(tok.dataset.bmStart),b=Number(tok.dataset.bmEnd),r=tok.getBoundingClientRect();
      const sh=functionShellAt(a);
      const pos=e.clientX<r.left+r.width/2?a:(sh?sh.tokenEnd:b);
      return normalizeCursor(pos,e.clientX<r.left+r.width/2?-1:1);
    }
    const zone=target?.closest?.('[data-bm-zone]');
    if(zone&&state.editor.contains(zone)){
      const a=Number(zone.dataset.bmZoneStart),b=Number(zone.dataset.bmZoneEnd);
      return normalizeCursor(Number.isFinite(b)?b:(Number.isFinite(a)?a:state.raw.length),0);
    }
    return state.raw.length;
  }
  function placeCursorFromClick(e){
    if(!state.editor||state.input?.disabled)return;
    collapseSelection(pointerPosition(e));render();state.editor.focus();
  }
  function beginPointerSelection(e){
    if(e.button!==0||!state.editor||state.input?.disabled)return;
    const pos=pointerPosition(e);if(e.shiftKey){if(!hasSelection())state.selectionAnchor=state.cursor;}else state.selectionAnchor=pos;
    state.selectionFocus=pos;state.cursor=pos;state.dragging=true;render();state.editor.focus();
    try{state.editor.setPointerCapture(e.pointerId);}catch(_){}
    e.preventDefault();
  }
  function extendPointerSelection(e){
    if(!state.dragging||!state.editor)return;
    const target=document.elementFromPoint?.(e.clientX,e.clientY)||e.target,pos=pointerPosition(e,target);
    state.selectionFocus=pos;state.cursor=pos;render();e.preventDefault();
  }
  function endPointerSelection(e){
    if(!state.dragging)return;state.dragging=false;
    try{state.editor.releasePointerCapture(e.pointerId);}catch(_){}
  }

  function activateBinding(binding,focusEditor=false){
    if(!binding)return;
    if(state.binding&&state.binding!==binding){
      state.binding.raw=state.raw;
      state.binding.cursor=state.cursor;
      state.binding.selectionAnchor=state.selectionAnchor;
      state.binding.selectionFocus=state.selectionFocus;
    }
    state.binding=binding;
    state.input=binding.input;
    state.editor=binding.editor;
    state.pad=binding.pad;
    state.mode=binding.mode;
    state.onCheck=binding.onCheck;
    state.raw=binding.raw;
    state.cursor=normalizeCursor(binding.cursor,0);
    state.selectionAnchor=normalizeCursor(binding.selectionAnchor??state.cursor,0);
    state.selectionFocus=normalizeCursor(binding.selectionFocus??state.cursor,0);
    render();
    if(focusEditor)nextFrame(()=>{
      try{binding.editor.focus({preventScroll:true});}catch(_){binding.editor.focus();}
    });
  }

  // Dynamic practice engines can mount the same proven structured editor on
  // one or several answer fields. Every field keeps its own raw expression,
  // while one shared keypad edits whichever field the student most recently
  // selected. Fractions therefore remain intact objects in every Unit 3 input.
  function mountInputs(inputs,host,{mode="unit3",onCheck=null}={}){
    const list=(Array.isArray(inputs)?inputs:[inputs]).filter(Boolean);
    if(!list.length||!host)return null;
    const pad=buildPad(mode);
    const bindings=[];
    for(const input of list){
      if(input.dataset.bmCalcDynamicReady==="true")continue;
      input.dataset.bmCalcDynamicReady="true";
      input.classList.add("bm-calc-source");
      input.tabIndex=-1;
      input.setAttribute("aria-hidden","true");
      input.setAttribute("inputmode","none");

      const editor=document.createElement("div");
      editor.className="bm-calc-editor bm-calc-dynamic-editor";
      editor.tabIndex=0;
      editor.setAttribute("role","textbox");
      editor.setAttribute("aria-label",input.getAttribute("aria-label")||"Answer");
      input.insertAdjacentElement("beforebegin",editor);

      const end=(input.value||"").length,binding={input,editor,pad,mode,onCheck,raw:input.value||"",cursor:end,selectionAnchor:end,selectionFocus:end,history:[],redoHistory:[]};
      bindings.push(binding);
      editor.addEventListener("focus",()=>activateBinding(binding));
      editor.addEventListener("keydown",e=>{activateBinding(binding);onEditorKey(e);});
      editor.addEventListener("pointerdown",e=>{activateBinding(binding);beginPointerSelection(e);});
      editor.addEventListener("pointermove",e=>{activateBinding(binding);extendPointerSelection(e);});
      editor.addEventListener("pointerup",e=>{activateBinding(binding);endPointerSelection(e);});
      editor.addEventListener("pointercancel",e=>{activateBinding(binding);endPointerSelection(e);});
      editor.addEventListener("copy",e=>{activateBinding(binding);copySelection(e,false);});
      editor.addEventListener("cut",e=>{activateBinding(binding);copySelection(e,true);});
      editor.addEventListener("paste",e=>{activateBinding(binding);pasteSelection(e);});
      input.addEventListener("focus",()=>activateBinding(binding,true));
      new MutationObserver(()=>{
        editor.classList.toggle("is-disabled",!!input.disabled);
        if(state.binding===binding)render();
      }).observe(input,{attributes:true,attributeFilter:["disabled"]});
    }
    host.appendChild(pad);
    for(const binding of bindings)activateBinding(binding);
    if(bindings.length)activateBinding(bindings[0],true);
    return{bindings,pad,focus:()=>activateBinding(bindings[0],true)};
  }

  function init(){
    const input=document.querySelector('input[data-bm-calc-keypad]');
    if(!input||input.dataset.bmCalcReady==="true")return;
    input.dataset.bmCalcReady="true";
    state.binding=null;
    state.onCheck=null;
    state.input=input;
    state.mode=input.dataset.bmCalcKeypad||"derivative";
    state.raw=input.value||"";
    state.history=[];
    state.redoHistory=[];
    state.cursor=state.raw.length;
    state.selectionAnchor=state.cursor;
    state.selectionFocus=state.cursor;

    input.classList.add("bm-calc-source");
    input.tabIndex=-1;
    input.setAttribute("aria-hidden","true");
    input.setAttribute("inputmode","none");

    const editor=document.createElement("div");
    editor.className="bm-calc-editor";
    editor.tabIndex=0;
    editor.setAttribute("role","textbox");
    editor.setAttribute("aria-label","Answer");
    editor.addEventListener("keydown",onEditorKey);
    editor.addEventListener("pointerdown",beginPointerSelection);
    editor.addEventListener("pointermove",extendPointerSelection);
    editor.addEventListener("pointerup",endPointerSelection);
    editor.addEventListener("pointercancel",endPointerSelection);
    editor.addEventListener("copy",e=>copySelection(e,false));
    editor.addEventListener("cut",e=>copySelection(e,true));
    editor.addEventListener("paste",pasteSelection);
    state.editor=editor;
    input.insertAdjacentElement("beforebegin",editor);
    // Engines written before the visual editor focus the source input when a
    // new problem appears. Redirect that established call to the visible
    // editor so physical-keyboard entry works immediately on every engine.
    input.addEventListener("focus",()=>nextFrame(()=>{
      if(!input.disabled){
        try{editor.focus({preventScroll:true});}catch(_){editor.focus();}
      }
    }));

    const row=input.closest(".answer-row");
    if(row)row.classList.add("bm-calc-answer-row");
    const pad=buildPad(state.mode);
    state.pad=pad;
    (row||input.parentElement).insertAdjacentElement("afterend",pad);

    new MutationObserver(render).observe(input,{attributes:true,attributeFilter:["disabled"]});
    render();
    if(!input.disabled){
      nextFrame(()=>{
        if(document.activeElement===document.body||document.activeElement===input){
          try{editor.focus({preventScroll:true});}catch(_){editor.focus();}
        }
      });
    }
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();

  window.BatchMathCalculusKeypad={init,mountInputs,reset,focus,setRaw:(v)=>{const stacks=historyStacks();stacks.undo.length=0;stacks.redo.length=0;setRaw(v,String(v||"").length,{record:false});},move,moveVertical,backspace,del,undo,redo,get raw(){return serializeRange()},get cursor(){return state.cursor},get selection(){return selectionRange();},setCursor:(v)=>{collapseSelection(Number(v)||0);render();}};
})();
