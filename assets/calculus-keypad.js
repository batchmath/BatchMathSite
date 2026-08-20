(function(){
  "use strict";

  const state={input:null,editor:null,pad:null,raw:"",cursor:0,mode:"derivative"};
  const fnNames=["sin","cos","tan","sec","csc","cot","ln","sqrt","abs"];

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
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
    if(s[i]!=="(")return null;
    const numClose=findClose(s,i);
    if(numClose<0||numClose+2>=end)return null;
    if(s[numClose+1]!=="/"||s[numClose+2]!=="(")return null;
    const denOpen=numClose+2;
    const denClose=findClose(s,denOpen);
    if(denClose<0||denClose>=end)return null;
    return {numStart:i+1,numClose,denStart:denOpen+1,denClose,end:denClose+1};
  }

  function renderPlain(start,end){
    const s=state.raw;
    let out="",i=start;
    while(i<end){
      if(state.cursor===i)out+=caret();

      const frac=fractionAt(s,i,end);
      if(frac){
        let num=renderPlain(frac.numStart,frac.numClose);
        let den=renderPlain(frac.denStart,frac.denClose);
        if(frac.numStart===frac.numClose)num+=emptyBox();
        if(frac.denStart===frac.denClose)den+=emptyBox();
        out+=`<span class="bm-calc-frac"><span class="bm-calc-frac-num">${num}</span><span class="bm-calc-frac-den">${den}</span></span>`;
        i=frac.end;
        continue;
      }

      if(s.startsWith("^(",i)){
        const close=findClose(s,i+1);
        if(close>=0&&close<end){
          let inner=renderPlain(i+2,close);
          if(i+2===close)inner+=emptyBox();
          out+=`<sup>${inner}</sup>`;
          i=close+1;
          continue;
        }
      }

      let token=null,shown=null;
      for(const f of fnNames){
        if(s.startsWith(f,i)){token=f;shown=f==="sqrt"?"√":f;break;}
      }
      if(token){
        out+=`<span>${escapeHtml(shown)}</span>`;
        i+=token.length;
        continue;
      }
      if(s.startsWith("pi",i)){out+="π";i+=2;continue;}

      const ch=s[i];
      out+=escapeHtml(ch==="*"?"·":ch==="/"?"÷":ch==="-"?"−":ch);
      i++;
    }
    if(state.cursor===end)out+=caret();
    return out;
  }

  function render(){
    if(!state.editor)return;
    const disabled=!!state.input?.disabled;
    state.editor.classList.toggle("is-disabled",disabled);
    state.pad?.classList.toggle("is-disabled",disabled);
    if(!state.raw)state.editor.innerHTML=caret()+'<span class="bm-calc-empty">Enter answer</span>';
    else state.editor.innerHTML=renderPlain(0,state.raw.length);
    state.editor.setAttribute("aria-valuetext",state.raw||"blank");
  }

  function sync(){
    if(!state.input)return;
    state.input.value=state.raw;
    state.input.dispatchEvent(new Event("input",{bubbles:true}));
    render();
  }
  function setRaw(raw,cursor){
    state.raw=String(raw||"");
    state.cursor=Math.max(0,Math.min(cursor==null?state.raw.length:cursor,state.raw.length));
    sync();
  }
  function insert(text,insideOffset){
    if(!state.input||state.input.disabled)return;
    const a=state.raw.slice(0,state.cursor),b=state.raw.slice(state.cursor);
    state.raw=a+text+b;
    state.cursor=a.length+(insideOffset==null?text.length:insideOffset);
    sync();
    state.editor.focus();
  }
  function insertFunction(name){insert(name+"()",name.length+1);}
  function insertExponent(){insert("^()",2);}

  // Insert a true editable stacked fraction. Underneath, the value remains
  // parser-friendly as (numerator)/(denominator).
  function insertFraction(){insert("()/()",1);}

  // Keyboard / and the keypad's division-position key create a stacked fraction.
  // If a numerator is already immediately to the left, promote that current
  // top-level term into the numerator instead of showing a plain division glyph.
  function fractionFromLeft(){
    if(!state.input||state.input.disabled)return;
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
    state.raw=left.slice(0,start)+`(${numerator})/()`+right;
    state.cursor=left.slice(0,start).length+numerator.length+4;
    sync();
    state.editor.focus();
  }

  function backspace(){
    if(!state.input||state.input.disabled||state.cursor<=0)return;
    // Remove an untouched exponent shell as one unit.
    if(state.raw.slice(Math.max(0,state.cursor-2),state.cursor)==="^("&&state.raw[state.cursor]===")"){
      state.raw=state.raw.slice(0,state.cursor-2)+state.raw.slice(state.cursor+1);
      state.cursor-=2;
      sync();
      return;
    }
    const a=state.raw.slice(0,state.cursor-1),b=state.raw.slice(state.cursor);
    state.raw=a+b;
    state.cursor--;
    sync();
  }
  function del(){
    if(!state.input||state.input.disabled||state.cursor>=state.raw.length)return;
    state.raw=state.raw.slice(0,state.cursor)+state.raw.slice(state.cursor+1);
    sync();
  }
  function move(delta){
    if(delta>0 && state.raw[state.cursor]===")" && state.raw.slice(state.cursor,state.cursor+3)===")/("){
      // Jump from the end of a fraction numerator directly into the denominator.
      state.cursor=Math.min(state.raw.length,state.cursor+3);
    }else if(delta<0 && state.raw.slice(Math.max(0,state.cursor-3),state.cursor)===")/("){
      // Jump back from the start of a denominator to the end of the numerator.
      state.cursor=Math.max(0,state.cursor-3);
    }else{
      state.cursor=Math.max(0,Math.min(state.raw.length,state.cursor+delta));
    }
    render();
    state.editor.focus();
  }
  function clear(){
    if(!state.input||state.input.disabled)return;
    setRaw("",0);
    state.editor.focus();
  }
  function check(){
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

    if(mode==="limits"){
      const special=document.createElement("div");
      special.className="bm-calc-special-row";
      addFraction(special);
      addInsert(special,"DNE","DNE","function","Insert DNE");
      addInsert(special,"∞","infinity","function math-infinity-key","Insert infinity");
      addInsert(special,"−∞","-infinity","function math-infinity-key","Insert negative infinity");
      pad.appendChild(special);
    }else{
      const funcs=document.createElement("div");
      funcs.className="bm-calc-function-row";
      [["sin","sin"],["cos","cos"],["tan","tan"],["sec","sec"],["csc","csc"],["cot","cot"],["ln","ln"],["√","sqrt"],["|u|","abs"]].forEach(([lab,name])=>addFunction(funcs,lab,name));
      addInsert(funcs,"e","e","function");
      addInsert(funcs,"π","pi","function");
      addFraction(funcs);
      pad.appendChild(funcs);
    }

    const g=document.createElement("div");
    g.className="bm-calc-main-grid";
    if(mode==="limits"){
      // A compact numeric layout. Every key here produces an answer format the
      // Limits engine actually accepts.
      [["7","7"],["8","8"],["9","9"],["−","-"],
       ["4","4"],["5","5"],["6","6"],[".","."],
       ["1","1"],["2","2"],["3","3"],["0","0"]]
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

    const u=document.createElement("div");
    u.className="bm-calc-utility-row";
    if(mode==="integral")addInsert(u,",",",","symbol","Comma between multiple values");
    u.appendChild(key("←","utility navigation",()=>move(-1),"Move cursor left"));
    u.appendChild(key("→","utility navigation",()=>move(1),"Move cursor right"));
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
    if(e.key==="ArrowLeft"){e.preventDefault();move(-1);return;}
    if(e.key==="ArrowRight"){e.preventDefault();move(1);return;}
    if(e.key==="Backspace"){e.preventDefault();backspace();return;}
    if(e.key==="Delete"){e.preventDefault();del();return;}
    if(e.key==="Enter"){e.preventDefault();check();return;}
    if(e.key==="^"){e.preventDefault();insertExponent();return;}
    if(e.key==="/"){e.preventDefault();fractionFromLeft();return;}
    if(e.key.length===1&&/[0-9a-zA-Z+\-*().,]/.test(e.key)){e.preventDefault();insert(e.key);return;}
  }

  function reset(){
    if(!state.input)return;
    state.raw=state.input.value||"";
    state.cursor=state.raw.length;
    render();
  }
  function focus(){state.editor?.focus();}

  function init(){
    const input=document.querySelector('input[data-bm-calc-keypad]');
    if(!input||input.dataset.bmCalcReady==="true")return;
    input.dataset.bmCalcReady="true";
    state.input=input;
    state.mode=input.dataset.bmCalcKeypad||"derivative";
    state.raw=input.value||"";
    state.cursor=state.raw.length;

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
    editor.addEventListener("click",()=>{state.cursor=state.raw.length;render();});
    state.editor=editor;
    input.insertAdjacentElement("beforebegin",editor);

    const row=input.closest(".answer-row");
    if(row)row.classList.add("bm-calc-answer-row");
    const pad=buildPad(state.mode);
    state.pad=pad;
    (row||input.parentElement).insertAdjacentElement("afterend",pad);

    new MutationObserver(render).observe(input,{attributes:true,attributeFilter:["disabled"]});
    render();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();

  window.BatchMathCalculusKeypad={init,reset,focus,setRaw:(v)=>setRaw(v,String(v||"").length)};
})();
