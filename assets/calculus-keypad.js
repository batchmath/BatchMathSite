(function(){
  "use strict";

  const state={input:null,editor:null,pad:null,raw:"",cursor:0,mode:"derivative"};
  const fnNames=["sin","cos","tan","sec","csc","cot","ln","sqrt","abs"];
  const atomicWords=["infinity","undefined","DNE","pi"];

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

  function renderToken(display,start,end,cls=""){
    return `<span class="bm-calc-token${cls?" "+cls:""}" data-bm-start="${start}" data-bm-end="${end}">${escapeHtml(display)}</span>`;
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
    // Function names and the opening parenthesis are one semantic entry boundary.
    // The caret must never disappear inside raw text such as s|q|r|t|( or s|i|n|(.
    for(let start=0;start<state.raw.length;start++){
      const sh=functionShellAt(start);
      if(sh&&p>sh.start&&p<sh.argStart){
        if(dir>0)return sh.argStart;
        if(dir<0)return sh.start;
        return (p-sh.start)<=(sh.argStart-p)?sh.start:sh.argStart;
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
      if(state.cursor===i)out+=caret();

      const frac=fractionAt(s,i,end);
      if(frac){
        let num=renderPlain(frac.numStart,frac.numClose);
        let den=renderPlain(frac.denStart,frac.denClose);
        if(frac.numStart===frac.numClose)num+=emptyBox();
        if(frac.denStart===frac.denClose)den+=emptyBox();
        out+=`<span class="bm-calc-frac" data-bm-frac-start="${i}" data-bm-frac-end="${frac.end}"><span class="bm-calc-frac-num" data-bm-zone="num" data-bm-zone-start="${frac.numStart}" data-bm-zone-end="${frac.numClose}">${num}</span><span class="bm-calc-frac-den" data-bm-zone="den" data-bm-zone-start="${frac.denStart}" data-bm-zone-end="${frac.denClose}">${den}</span></span>`;
        i=frac.end;
        continue;
      }

      if(s.startsWith("^(",i)){
        const close=findClose(s,i+1);
        if(close>=0&&close<end){
          let inner=renderPlain(i+2,close);
          if(i+2===close)inner+=emptyBox();
          out+=`<sup data-bm-zone="exp" data-bm-zone-start="${i+2}" data-bm-zone-end="${close}">${inner}</sup>`;
          i=close+1;
          continue;
        }
      }

      let token=null,shown=null;
      for(const f of fnNames){
        if(s.startsWith(f,i)){token=f;shown=f==="sqrt"?"√":f;break;}
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
    if(state.cursor===end)out+=caret();
    return out;
  }

  function allFractions(start=0,end=state.raw.length,out=[]){
    let i=start;
    while(i<end){
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

  function containingFraction(cursor=state.cursor){
    const matches=allFractions().filter(f=>(cursor>=f.numStart&&cursor<=f.numClose)||(cursor>=f.denStart&&cursor<=f.denClose));
    if(!matches.length)return null;
    matches.sort((a,b)=>(a.end-a.start)-(b.end-b.start));
    return matches[0];
  }


  function render(){
    if(!state.editor)return;
    state.cursor=normalizeCursor(state.cursor,0);
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
    state.cursor=normalizeCursor(cursor==null?state.raw.length:cursor,0);
    sync();
  }
  function insert(text,insideOffset){
    if(!state.input||state.input.disabled)return;
    state.cursor=normalizeCursor(state.cursor,0);
    const a=state.raw.slice(0,state.cursor),b=state.raw.slice(state.cursor);
    state.raw=a+text+b;
    state.cursor=normalizeCursor(a.length+(insideOffset==null?text.length:insideOffset),1);
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
    state.raw=left.slice(0,start)+`(${numerator})/()`+right;
    state.cursor=left.slice(0,start).length+numerator.length+4;
    sync();
    state.editor.focus();
  }

  function backspace(){
    if(!state.input||state.input.disabled||state.cursor<=0)return;
    state.cursor=normalizeCursor(state.cursor,-1);
    if(state.cursor<=0)return;

    // Keep parser syntax intact. Backspace never peels one hidden character out
    // of sin/cos/sqrt/pi/infinity/etc. or removes a structural parenthesis.
    for(let i=Math.max(0,state.cursor-16);i<state.cursor;i++){
      const sh=functionShellAt(i);
      if(sh&&sh.end===state.cursor){
        if(sh.close===sh.argStart){
          state.raw=state.raw.slice(0,sh.start)+state.raw.slice(sh.end);
          state.cursor=sh.start;
        }else state.cursor=sh.close;
        sync();state.editor.focus();return;
      }
      if(sh&&sh.argStart===state.cursor){
        if(sh.close===sh.argStart){
          state.raw=state.raw.slice(0,sh.start)+state.raw.slice(sh.end);
          state.cursor=sh.start;
        }else state.cursor=sh.start;
        sync();state.editor.focus();return;
      }
      const a=atomicAt(i);
      if(a&&a.end===state.cursor&&!(fnNames.includes(a.word)&&state.raw[a.end]==="(")){
        state.raw=state.raw.slice(0,a.start)+state.raw.slice(a.end);
        state.cursor=a.start;
        sync();state.editor.focus();return;
      }
    }

    // Remove an untouched exponent shell as one unit.
    if(state.raw.slice(Math.max(0,state.cursor-2),state.cursor)==="^("&&state.raw[state.cursor]===")"){
      state.raw=state.raw.slice(0,state.cursor-2)+state.raw.slice(state.cursor+1);
      state.cursor-=2;
      sync();
      return;
    }
    const a=state.raw.slice(0,state.cursor-1),b=state.raw.slice(state.cursor);
    state.raw=a+b;
    state.cursor=normalizeCursor(state.cursor-1,-1);
    sync();
  }
  function del(){
    if(!state.input||state.input.disabled||state.cursor>=state.raw.length)return;
    state.cursor=normalizeCursor(state.cursor,1);
    if(state.cursor>=state.raw.length)return;

    const sh=functionShellAt(state.cursor);
    if(sh){
      if(sh.close===sh.argStart){
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
      state.raw=state.raw.slice(0,a.start)+state.raw.slice(a.end);
      state.cursor=a.start;
      sync();state.editor.focus();return;
    }
    state.raw=state.raw.slice(0,state.cursor)+state.raw.slice(state.cursor+1);
    state.cursor=normalizeCursor(state.cursor,1);
    sync();
  }
  function move(delta){
    if(!state.input||state.input.disabled)return;
    state.cursor=normalizeCursor(state.cursor,delta);
    if(delta>0){
      const sh=functionShellAt(state.cursor);
      if(sh){
        state.cursor=sh.argStart;
      }else if(state.raw[state.cursor]===")" && state.raw.slice(state.cursor,state.cursor+3)===")/("){
        state.cursor=Math.min(state.raw.length,state.cursor+3);
      }else if(state.raw.slice(state.cursor,state.cursor+2)==="^("){
        state.cursor=Math.min(state.raw.length,state.cursor+2);
      }else{
        const a=atomicAt(state.cursor);
        if(a)state.cursor=Math.min(state.raw.length,a.end);
        else state.cursor=Math.min(state.raw.length,state.cursor+1);
      }
      state.cursor=normalizeCursor(state.cursor,1);
    }else if(delta<0){
      // From the first editable position inside a function/root, one tap exits
      // to immediately before the whole function rather than entering its raw name.
      const shStart=Math.max(0,state.cursor-12);
      let shell=null;
      for(let i=shStart;i<state.cursor;i++){
        const candidate=functionShellAt(i);
        if(candidate&&candidate.argStart===state.cursor){shell=candidate;break;}
      }
      if(shell){
        state.cursor=shell.start;
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
    render();
    state.editor.focus();
  }
  function moveVertical(delta){
    if(!state.input||state.input.disabled)return;
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
    if(e.key==="ArrowLeft"){e.preventDefault();move(-1);return;}
    if(e.key==="ArrowRight"){e.preventDefault();move(1);return;}
    if(e.key==="ArrowUp"){e.preventDefault();moveVertical(-1);return;}
    if(e.key==="ArrowDown"){e.preventDefault();moveVertical(1);return;}
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
  function placeCursorFromClick(e){
    if(!state.editor||state.input?.disabled)return;
    const tok=e.target.closest?.('[data-bm-start]');
    if(tok&&state.editor.contains(tok)){
      const a=Number(tok.dataset.bmStart),b=Number(tok.dataset.bmEnd),r=tok.getBoundingClientRect();
      const sh=functionShellAt(a);
      state.cursor=e.clientX<r.left+r.width/2?a:(sh?sh.argStart:b);
      state.cursor=normalizeCursor(state.cursor,e.clientX<r.left+r.width/2?-1:1);
      render();state.editor.focus();return;
    }
    const zone=e.target.closest?.('[data-bm-zone]');
    if(zone&&state.editor.contains(zone)){
      const a=Number(zone.dataset.bmZoneStart),b=Number(zone.dataset.bmZoneEnd);
      state.cursor=Number.isFinite(b)?b:(Number.isFinite(a)?a:state.raw.length);
      state.cursor=normalizeCursor(state.cursor,0);
      render();state.editor.focus();return;
    }
    state.cursor=state.raw.length;render();state.editor.focus();
  }

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
    editor.addEventListener("click",placeCursorFromClick);
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

  window.BatchMathCalculusKeypad={init,reset,focus,setRaw:(v)=>setRaw(v,String(v||"").length),move,moveVertical,get raw(){return state.raw},get cursor(){return state.cursor},setCursor:(v)=>{state.cursor=normalizeCursor(Number(v)||0,0);render();}};
})();
