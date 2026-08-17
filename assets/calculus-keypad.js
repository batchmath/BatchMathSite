(function(){
  "use strict";
  const state={input:null,editor:null,pad:null,raw:"",cursor:0,mode:"derivative"};
  const fnNames=["sin","cos","tan","sec","csc","cot","ln","sqrt","abs"];

  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function caret(){return '<span class="bm-calc-caret" aria-hidden="true"></span>';}
  function findClose(s,open){let depth=0;for(let i=open;i<s.length;i++){if(s[i]==="(")depth++;else if(s[i]===")"){depth--;if(depth===0)return i;}}return -1;}

  function renderPlain(start,end){
    const s=state.raw;let out="";let i=start;
    while(i<end){
      if(state.cursor===i)out+=caret();
      if(s.startsWith("^(",i)){
        const close=findClose(s,i+1);
        if(close>=0&&close<end){
          let inner=renderPlain(i+2,close);
          if(!inner)inner='<span class="bm-calc-empty">□</span>';
          out+=`<sup>${inner}</sup>`;i=close+1;continue;
        }
      }
      let token=null,shown=null;
      for(const f of fnNames){if(s.startsWith(f,i)){token=f;shown=f==="sqrt"?"√":f;break;}}
      if(token){
        // Keep function names visually natural while preserving a predictable raw expression.
        out+=`<span>${escapeHtml(shown)}</span>`;i+=token.length;continue;
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
    if(!state.raw){state.editor.innerHTML=caret()+'<span class="bm-calc-empty">Enter answer</span>';}
    else state.editor.innerHTML=renderPlain(0,state.raw.length);
    state.editor.setAttribute("aria-valuetext",state.raw||"blank");
  }

  function sync(){if(!state.input)return;state.input.value=state.raw;state.input.dispatchEvent(new Event("input",{bubbles:true}));render();}
  function setRaw(raw,cursor){state.raw=String(raw||"");state.cursor=Math.max(0,Math.min(cursor==null?state.raw.length:cursor,state.raw.length));sync();}
  function insert(text,insideOffset){if(!state.input||state.input.disabled)return;const a=state.raw.slice(0,state.cursor),b=state.raw.slice(state.cursor);state.raw=a+text+b;state.cursor=a.length+(insideOffset==null?text.length:insideOffset);sync();state.editor.focus();}
  function insertFunction(name){insert(name+"()",name.length+1);}
  function insertExponent(){insert("^()",2);}
  function backspace(){if(!state.input||state.input.disabled||state.cursor<=0)return;
    // Treat an empty exponent/function shell as a unit when possible.
    if(state.raw.slice(Math.max(0,state.cursor-2),state.cursor)==="^("&&state.raw[state.cursor]===")"){
      state.raw=state.raw.slice(0,state.cursor-2)+state.raw.slice(state.cursor+1);state.cursor-=2;sync();return;
    }
    const a=state.raw.slice(0,state.cursor-1),b=state.raw.slice(state.cursor);state.raw=a+b;state.cursor--;sync();
  }
  function del(){if(!state.input||state.input.disabled||state.cursor>=state.raw.length)return;state.raw=state.raw.slice(0,state.cursor)+state.raw.slice(state.cursor+1);sync();}
  function move(delta){state.cursor=Math.max(0,Math.min(state.raw.length,state.cursor+delta));render();state.editor.focus();}
  function clear(){if(!state.input||state.input.disabled)return;setRaw("",0);state.editor.focus();}
  function check(){const btn=document.getElementById("submit");if(btn&&!btn.disabled)btn.click();}
  function next(){const btn=document.getElementById("next");if(btn&&getComputedStyle(btn).display!=="none")btn.click();}

  function key(label,cls,fn,aria){const b=document.createElement("button");b.type="button";b.className="bm-calc-key"+(cls?" "+cls:"");b.textContent=label;if(aria)b.setAttribute("aria-label",aria);b.addEventListener("pointerdown",e=>e.preventDefault());b.addEventListener("click",fn);return b;}
  function addInsert(grid,label,raw,cls="",aria){grid.appendChild(key(label,cls,()=>insert(raw),aria));}
  function addFunction(grid,label,name){grid.appendChild(key(label,"function",()=>insertFunction(name),`Insert ${label}`));}

  function buildPad(mode){
    const pad=document.createElement("div");pad.className="bm-calc-keypad";pad.setAttribute("role","group");pad.setAttribute("aria-label","BatchMath calculus answer keypad");
    if(mode!=="limits"){
      const funcs=document.createElement("div");funcs.className="bm-calc-function-row";
      [["sin","sin"],["cos","cos"],["tan","tan"],["sec","sec"],["csc","csc"],["cot","cot"],["ln","ln"],["√","sqrt"],["|u|","abs"]].forEach(([lab,name])=>addFunction(funcs,lab,name));
      addInsert(funcs,"e","e","function");addInsert(funcs,"π","pi","function");
      if(mode==="integral")addInsert(funcs,"C","C","function");
      pad.appendChild(funcs);
    }
    const g=document.createElement("div");g.className="bm-calc-main-grid";
    if(mode==="limits"){
      [["7","7"],["8","8"],["9","9"],["−","-"],["/","/"],["4","4"],["5","5"],["6","6"],[".","."],["DNE","DNE"],["1","1"],["2","2"],["3","3"],["∞","infinity"],["−∞","-infinity"],["0","0"]].forEach(([lab,raw])=>addInsert(g,lab,raw,/[D∞]/.test(lab)?"symbol":""));
    }else{
      [["7","7"],["8","8"],["9","9"],["x","x"],["y","y"],["(","("],["4","4"],["5","5"],["6","6"],["+","+"],["−","-"],[")",")"],["1","1"],["2","2"],["3","3"],["·","*"],["÷","/"],["xⁿ",null],["0","0"],[".","."]].forEach(([lab,raw])=>{
        if(lab==="xⁿ")g.appendChild(key(lab,"symbol",insertExponent,"Insert exponent"));else addInsert(g,lab,raw,/[+−·÷()]/.test(lab)?"symbol":"");
      });
      if(mode==="integral")addInsert(g,",",",","symbol","Comma between multiple values");
    }
    g.appendChild(key("←","utility navigation",()=>move(-1),"Move cursor left"));
    g.appendChild(key("→","utility navigation",()=>move(1),"Move cursor right"));
    g.appendChild(key("⌫","utility",backspace,"Backspace"));
    g.appendChild(key("Del","utility",del,"Delete"));
    g.appendChild(key("Clear","utility",clear,"Clear answer"));
    g.appendChild(key("Check","check",check,"Check answer"));
    pad.appendChild(g);return pad;
  }

  function onEditorKey(e){
    if(!state.input||state.input.disabled){if(e.key==="Enter"){e.preventDefault();next();}return;}
    if(e.key==="ArrowLeft"){e.preventDefault();move(-1);return}
    if(e.key==="ArrowRight"){e.preventDefault();move(1);return}
    if(e.key==="Backspace"){e.preventDefault();backspace();return}
    if(e.key==="Delete"){e.preventDefault();del();return}
    if(e.key==="Enter"){e.preventDefault();check();return}
    if(e.key==="^"){e.preventDefault();insertExponent();return}
    if(e.key.length===1&&/[0-9a-zA-Z+\-*/().,]/.test(e.key)){e.preventDefault();insert(e.key);return}
  }

  function reset(){if(!state.input)return;state.raw=state.input.value||"";state.cursor=state.raw.length;render();}
  function focus(){state.editor?.focus();}

  function init(){
    const input=document.querySelector('input[data-bm-calc-keypad]');if(!input||input.dataset.bmCalcReady==="true")return;
    input.dataset.bmCalcReady="true";state.input=input;state.mode=input.dataset.bmCalcKeypad||"derivative";state.raw=input.value||"";state.cursor=state.raw.length;
    input.classList.add("bm-calc-source");input.tabIndex=-1;input.setAttribute("aria-hidden","true");input.setAttribute("inputmode","none");
    const editor=document.createElement("div");editor.className="bm-calc-editor";editor.tabIndex=0;editor.setAttribute("role","textbox");editor.setAttribute("aria-label","Answer");editor.addEventListener("keydown",onEditorKey);editor.addEventListener("click",()=>{state.cursor=state.raw.length;render();});
    state.editor=editor;input.insertAdjacentElement("beforebegin",editor);
    const row=input.closest(".answer-row");if(row)row.classList.add("bm-calc-answer-row");
    const pad=buildPad(state.mode);state.pad=pad;(row||input.parentElement).insertAdjacentElement("afterend",pad);
    new MutationObserver(render).observe(input,{attributes:true,attributeFilter:["disabled"]});
    render();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
  window.BatchMathCalculusKeypad={init,reset,focus,setRaw:(v)=>setRaw(v,String(v||"").length)};
})();
