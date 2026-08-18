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

  function insertSlash(input){
    if(input.value.includes("/") || input.value === "" || input.value === "-") return;
    appendText(input,"/");
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
      // Tapping the display should never summon or reposition around the OS keyboard.
      input.addEventListener("pointerdown", function(e){ e.preventDefault(); input.blur(); });
    }else{
      input.readOnly=false;
      input.setAttribute("inputmode", kind === "decimal" ? "decimal" : "text");
    }

    const pad=document.createElement("div");
    pad.className="bm-keypad";
    pad.setAttribute("role","group");
    pad.setAttribute("aria-label","On-screen answer keypad");

    const appendDigit = d => () => { if(!input.disabled) appendText(input,d); };

    // Compact 5-column / 3-row layout:
    // 7 8 9 Back Clear
    // 4 5 6 symbol Check
    // 1 2 3 0        Check
    ["7","8","9"].forEach(d=>pad.appendChild(button(d,"",appendDigit(d))));
    pad.appendChild(button("⌫","utility",()=>{if(!input.disabled)backspace(input)},"Backspace"));
    pad.appendChild(button("Clear","utility clear-key",()=>{if(!input.disabled)setValue(input,"")}));
    ["4","5","6"].forEach(d=>pad.appendChild(button(d,"",appendDigit(d))));

    if(kind === "integer"){
      pad.appendChild(button("−","symbol",()=>{if(!input.disabled)toggleNegative(input)},"Toggle negative sign"));
    }else if(kind === "fraction"){
      pad.appendChild(button("a⁄b","symbol fraction-key",()=>{if(!input.disabled)insertSlash(input)},"Enter a fraction"));
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
