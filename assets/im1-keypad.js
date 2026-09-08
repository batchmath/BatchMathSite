(function(){
  "use strict";

  const coarsePointer = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const smallTouch = (navigator.maxTouchPoints || 0) > 0 && (!window.matchMedia || window.matchMedia("(max-width: 1100px)").matches);
  const touchMode = Boolean(coarsePointer || smallTouch);

  function setValue(input, value){
    input.value = value;
    try { input.setSelectionRange(value.length,value.length); } catch(e) {}
    input.dispatchEvent(new Event("input", {bubbles:true}));
  }

  // Keypad presses intentionally edit from the end of the answer. This is more
  // predictable than relying on a browser's caret position after a keypad button
  // steals focus from the input, especially on phones and Safari.
  function appendText(input, text){ setValue(input, input.value + text); }

  function backspace(input){
    if(input.value) setValue(input,input.value.slice(0,-1));
  }

  function toggleNegative(input){
    const v=input.value;
    setValue(input,v.startsWith("-") ? v.slice(1) : "-"+v);
  }

  function insertDecimal(input){
    if(input.value.includes(".")) return;
    if(input.value === "") setValue(input,"0.");
    else if(input.value === "-") setValue(input,"-0.");
    else appendText(input,".");
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  // Fraction-answer pages keep the parser-friendly value n/d in the real input,
  // but students see and edit a normal stacked fraction with a horizontal bar.
  function createFractionEditor(input){
    input.classList.add("bm-fraction-source");

    const editor=document.createElement("div");
    editor.className="bm-fraction-editor";
    editor.tabIndex=0;
    editor.setAttribute("role","textbox");
    editor.setAttribute("aria-label","Answer");
    input.insertAdjacentElement("beforebegin",editor);

    let activePart="whole";

    function split(){
      const raw=input.value||"";
      const slash=raw.indexOf("/");
      if(slash<0)return {hasFraction:false,whole:raw,num:"",den:""};
      return {hasFraction:true,whole:"",num:raw.slice(0,slash),den:raw.slice(slash+1)};
    }

    function shown(v){
      if(!v)return '<span class="bm-fraction-empty">□</span>';
      return escapeHtml(v).replace(/-/g,"−");
    }

    function render(){
      const p=split();
      const disabled=Boolean(input.disabled);
      editor.classList.toggle("is-disabled",disabled);
      if(!p.hasFraction){
        activePart="whole";
        editor.innerHTML=p.whole ? `<span class="bm-fraction-whole">${shown(p.whole)}</span>` : '<span class="bm-fraction-placeholder">Enter answer</span>';
      }else{
        if(activePart==="whole")activePart=p.num?"den":"num";
        editor.innerHTML=`<span class="bm-im1-frac">
          <span class="bm-im1-frac-num${activePart==="num"?" active":""}" data-fraction-part="num">${shown(p.num)}</span>
          <span class="bm-im1-frac-den${activePart==="den"?" active":""}" data-fraction-part="den">${shown(p.den)}</span>
        </span>`;
      }
      editor.setAttribute("aria-valuetext",input.value||"blank");
    }

    function write(num,den){ setValue(input,`${num}/${den}`); }

    function startOrSwitch(){
      if(input.disabled)return;
      const p=split();
      if(!p.hasFraction){
        write(p.whole,"");
        activePart=p.whole?"den":"num";
      }else{
        activePart=activePart==="num"?"den":"num";
        render();
      }
      editor.focus();
    }

    function append(text){
      if(input.disabled)return;
      const p=split();
      if(!p.hasFraction){
        setValue(input,p.whole+text);
      }else if(activePart==="num"){
        write(p.num+text,p.den);
      }else{
        activePart="den";
        write(p.num,p.den+text);
      }
      editor.focus();
    }

    function erase(){
      if(input.disabled)return;
      const p=split();
      if(!p.hasFraction){
        setValue(input,p.whole.slice(0,-1));
      }else if(activePart==="num"){
        write(p.num.slice(0,-1),p.den);
      }else{
        activePart="den";
        if(p.den){
          write(p.num,p.den.slice(0,-1));
        }else{
          // Backspacing an empty denominator returns to the ordinary numerator.
          setValue(input,p.num);
          activePart="whole";
        }
      }
      editor.focus();
    }

    function negative(){
      if(input.disabled)return;
      const p=split();
      if(!p.hasFraction){
        const v=p.whole;
        setValue(input,v.startsWith("-")?v.slice(1):"-"+v);
      }else{
        const n=p.num;
        write(n.startsWith("-")?n.slice(1):"-"+n,p.den);
      }
      editor.focus();
    }

    function clear(){
      if(input.disabled)return;
      activePart="whole";
      setValue(input,"");
      editor.focus();
    }

    function checkOrNext(){
      const next=document.getElementById("nextBtn");
      if(next && !next.classList.contains("hidden")){ next.click(); return; }
      const check=document.getElementById("checkBtn");
      if(check && !check.disabled)check.click();
    }

    editor.addEventListener("keydown",e=>{
      if(input.disabled){
        if(e.key==="Enter"){e.preventDefault();checkOrNext();}
        return;
      }
      if(e.key==="Enter"){e.preventDefault();checkOrNext();return;}
      if(e.key==="/"){e.preventDefault();startOrSwitch();return;}
      if(e.key==="Backspace"){e.preventDefault();erase();return;}
      if(e.key==="Escape"){e.preventDefault();clear();return;}
      if(e.key==="ArrowUp"||e.key==="ArrowLeft"){
        const p=split();
        if(p.hasFraction){e.preventDefault();activePart="num";render();}
        return;
      }
      if(e.key==="ArrowDown"||e.key==="ArrowRight"){
        const p=split();
        if(p.hasFraction){e.preventDefault();activePart="den";render();}
        return;
      }
      if(e.key==="-"){e.preventDefault();negative();return;}
      if(/^\d$/.test(e.key)){e.preventDefault();append(e.key);}
    });

    editor.addEventListener("click",e=>{
      const target=e.target.closest("[data-fraction-part]");
      if(target){activePart=target.dataset.fractionPart;render();}
      editor.focus();
    });

    // Existing page code calls answer.focus() when a new question starts. Route
    // that focus to the visual editor without changing the page generators.
    input.addEventListener("focus",()=>requestAnimationFrame(()=>editor.focus()));
    input.addEventListener("input",render);
    render();

    return {editor,render,startOrSwitch,append,erase,negative,clear};
  }

  function button(label, cls, action, aria){
    const b=document.createElement("button");
    b.type="button";
    b.className="bm-key"+(cls?" "+cls:"");
    b.textContent=label;
    if(aria) b.setAttribute("aria-label",aria);
    // Prevent a mouse/pointer press from moving focus/caret before the click.
    b.addEventListener("pointerdown", e=>e.preventDefault());
    b.addEventListener("click", action);
    return b;
  }

  function syncPracticeMode(){
    const practice=document.getElementById("practiceCard");
    const active=Boolean(practice && !practice.classList.contains("hidden"));
    const root=document.documentElement;
    const wasActive=root.classList.contains("bm-practice-active");
    root.classList.toggle("bm-practice-active",active);
    if(active && !wasActive && touchMode){
      // Once setup disappears, put the compact practice interface at the top of
      // the viewport instead of leaving the phone scrolled to the old setup card.
      requestAnimationFrame(()=>window.scrollTo(0,0));
    }
  }

  function initPracticeObserver(){
    const practice=document.getElementById("practiceCard");
    if(!practice) return;
    syncPracticeMode();
    new MutationObserver(syncPracticeMode).observe(practice,{attributes:true,attributeFilter:["class"]});
  }

  function init(input){
    if(!input || input.dataset.bmKeypadReady === "true") return;
    const kind=input.dataset.bmKeypad || "digits";
    input.dataset.bmKeypadReady="true";
    input.classList.add("bm-keypad-input");

    // Text inputs preserve useful intermediate states such as a lone minus sign.
    if(input.type !== "text") input.type="text";
    input.setAttribute("autocomplete","off");
    input.setAttribute("spellcheck","false");

    if(touchMode){
      input.readOnly=true;
      input.setAttribute("inputmode","none");
      document.documentElement.classList.add("bm-keypad-touch");
      // Tapping the source input should never summon the OS keyboard.
      input.addEventListener("pointerdown", function(e){ e.preventDefault(); input.blur(); });
    }else{
      input.readOnly=false;
      input.setAttribute("inputmode", kind === "decimal" ? "decimal" : "text");
    }

    const fractionEditor=kind==="fraction" ? createFractionEditor(input) : null;

    const pad=document.createElement("div");
    pad.className="bm-keypad";
    pad.setAttribute("role","group");
    pad.setAttribute("aria-label","On-screen answer keypad");

    const appendDigit = d => () => {
      if(input.disabled)return;
      if(fractionEditor)fractionEditor.append(d);
      else appendText(input,d);
    };

    // Compact 5-column / 3-row layout:
    // 7 8 9 Back Clear
    // 4 5 6 symbol Check
    // 1 2 3 0        Check
    ["7","8","9"].forEach(d=>pad.appendChild(button(d,"",appendDigit(d))));
    pad.appendChild(button("⌫","utility",()=>{
      if(input.disabled)return;
      if(fractionEditor)fractionEditor.erase();
      else backspace(input);
    },"Backspace"));
    pad.appendChild(button("Clear","utility clear-key",()=>{
      if(input.disabled)return;
      if(fractionEditor)fractionEditor.clear();
      else setValue(input,"");
    }));
    ["4","5","6"].forEach(d=>pad.appendChild(button(d,"",appendDigit(d))));

    if(kind === "integer"){
      pad.appendChild(button("−","symbol",()=>{if(!input.disabled)toggleNegative(input)},"Toggle negative sign"));
    }else if(kind === "fraction"){
      pad.appendChild(button("a⁄b","symbol fraction-key",()=>{if(!input.disabled)fractionEditor.startOrSwitch()},"Create or edit a stacked fraction"));
    }else if(kind === "decimal"){
      pad.appendChild(button(".","symbol",()=>{if(!input.disabled)insertDecimal(input)},"Decimal point"));
    }else{
      const spacer=document.createElement("span");
      spacer.className="bm-spacer";
      spacer.setAttribute("aria-hidden","true");
      pad.appendChild(spacer);
    }

    const check=button("Check","check-key",()=>{
      if(input.disabled) return;
      const target=document.getElementById("checkBtn");
      if(target && !target.disabled) target.click();
    },"Check Answer");
    pad.appendChild(check);

    ["1","2","3","0"].forEach(d=>pad.appendChild(button(d,"",appendDigit(d))));

    const area=input.closest(".question-area") || input.parentElement;
    if(area) area.classList.add("bm-has-keypad");
    input.insertAdjacentElement("afterend",pad);

    const keys=[...pad.querySelectorAll("button")];
    function syncDisabled(){
      const disabled=Boolean(input.disabled);
      pad.classList.toggle("is-disabled",disabled);
      if(area) area.classList.toggle("bm-answer-locked",disabled);
      keys.forEach(k=>k.disabled=disabled);
      if(fractionEditor)fractionEditor.render();
    }
    syncDisabled();
    new MutationObserver(syncDisabled).observe(input,{attributes:true,attributeFilter:["disabled"]});
  }

  function initAll(){
    document.querySelectorAll("input[data-bm-keypad]").forEach(init);
    initPracticeObserver();
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",initAll);
  else initAll();

  window.BatchMathKeypad={touchMode,initAll};
})();
