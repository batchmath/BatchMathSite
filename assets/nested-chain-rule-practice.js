(function(){
  "use strict";
  const $=id=>document.getElementById(id);
  const rng=()=>window.BatchMathRNG.random();
  const ri=(a,b)=>Math.floor(rng()*(b-a+1))+a;
  const pick=list=>list[Math.floor(rng()*list.length)];
  const nz=(a,b)=>{let value=0;while(value===0)value=ri(a,b);return value;};
  const typeset=nodes=>window.MathJax?.typesetPromise?.(nodes).catch(()=>{});
  const seen=new Set();
  let current=null,correct=0,attempted=0;

  const signed=(c,term,first=false)=>{
    if(c===0)return"";
    const a=Math.abs(c),core=(a===1&&term?"":a)+term;
    return first?(c<0?"-":"")+core:(c<0?" - ":" + ")+core;
  };
  const rawSigned=(c,term,first=false)=>{
    if(c===0)return"";
    const a=Math.abs(c),core=term?(a===1?term:`${a}*${term}`):String(a);
    return first?(c<0?"-":"")+core:(c<0?"-":"+")+core;
  };
  const base=(id,tex,raw,dTex,dRaw,steps=[])=>({kind:"base",id,tex,raw,dTex,dRaw,steps});
  const wrap=(operation,inner)=>({kind:"compose",operation,inner,id:`${operation}-${inner.id}`});
  const nest=(inner,operations)=>operations.reduce((node,operation)=>wrap(operation,node),inner);

  function operationTex(operation,inside){
    if(operation==="f"||operation==="g")return `${operation}\\left(${inside}\\right)`;
    if(operation==="sqrt")return `\\sqrt{${inside}}`;
    return `\\${operation}\\left(${inside}\\right)`;
  }
  function operationRaw(operation,inside){
    return `${operation}(${inside})`;
  }
  function expressionTex(node){return node.kind==="base"?node.tex:operationTex(node.operation,expressionTex(node.inner));}
  function expressionRaw(node){return node.kind==="base"?node.raw:operationRaw(node.operation,expressionRaw(node.inner));}

  function derivativeFactor(operation,insideTex,insideRaw){
    if(operation==="f")return {tex:`f'\\left(${insideTex}\\right)`,raw:`fp(${insideRaw})`,description:`Differentiate the outer \\(f\\): write \\(f'(${insideTex})\\), then multiply by the derivative of its input.`};
    if(operation==="g")return {tex:`g'\\left(${insideTex}\\right)`,raw:`gp(${insideRaw})`,description:`Differentiate the outer \\(g\\): write \\(g'(${insideTex})\\), then multiply by the derivative of its input.`};
    if(operation==="sin")return {tex:`\\cos\\left(${insideTex}\\right)`,raw:`cos(${insideRaw})`,description:`Differentiate the sine layer: \\(\\sin(u)\\) becomes \\(\\cos(u)\\), then multiply by \\(u'\\).`};
    if(operation==="cos")return {tex:`-\\sin\\left(${insideTex}\\right)`,raw:`-sin(${insideRaw})`,description:`Differentiate the cosine layer: \\(\\cos(u)\\) becomes \\(-\\sin(u)\\), then multiply by \\(u'\\).`};
    if(operation==="tan")return {tex:`\\sec^2\\left(${insideTex}\\right)`,raw:`sec(${insideRaw})^2`,description:`Differentiate the tangent layer: \\(\\tan(u)\\) becomes \\(\\sec^2(u)\\), then multiply by \\(u'\\).`};
    if(operation==="cot")return {tex:`-\\csc^2\\left(${insideTex}\\right)`,raw:`-csc(${insideRaw})^2`,description:`Differentiate the cotangent layer: \\(\\cot(u)\\) becomes \\(-\\csc^2(u)\\), then multiply by \\(u'\\).`};
    return {tex:`\\frac{1}{2\\sqrt{${insideTex}}}`,raw:`1/(2*sqrt(${insideRaw}))`,description:`Differentiate the square-root layer: \\(\\sqrt{u}\\) contributes \\(\\frac{1}{2\\sqrt{u}}\\), then multiply by \\(u'\\).`};
  }

  function derivative(node){
    if(node.kind==="base")return {raw:node.dRaw,tex:node.dTex,factors:[],steps:node.steps};
    const inner=derivative(node.inner),insideTex=expressionTex(node.inner),insideRaw=expressionRaw(node.inner),factor=derivativeFactor(node.operation,insideTex,insideRaw);
    const raw=inner.raw==="1"?factor.raw:`(${factor.raw})*(${inner.raw})`;
    return {raw,tex:"",factors:[factor.tex,...inner.factors],steps:[factor.description,...inner.steps]};
  }

  function finalDerivative(node){
    const work=derivative(node),baseNode=findBase(node),parts=[...work.factors];
    if(baseNode.dRaw!=="1")parts.push(baseNode.dTex);
    const tex=parts.length===1?parts[0]:parts.map(part=>`\\left[${part}\\right]`).join("\\,");
    return {raw:work.raw,tex,steps:[...work.steps,`Multiply all of the derivative factors. One correct final form is \\(y'=${tex}\\).`]};
  }
  function findBase(node){while(node.kind!=="base")node=node.inner;return node;}

  function quadratic(tag,constant=true){
    const a=pick([1,2,3]),b=nz(-5,5),c=constant?ri(-4,5):0;
    const tex=signed(a,"x^2",true)+signed(b,"x")+signed(c,"");
    const raw=rawSigned(a,"x^2",true)+rawSigned(b,"x")+rawSigned(c,"");
    const dTex=signed(2*a,"x",true)+signed(b,"");
    const dRaw=rawSigned(2*a,"x",true)+rawSigned(b,"");
    return base(`${tag}-${a}-${b}-${c}`,tex,raw,dTex,dRaw,[`Differentiate the innermost polynomial: \\(\\frac{d}{dx}(${tex})=${dTex}\\).`]);
  }
  function cubic(tag){
    const a=pick([1,2]),b=nz(-4,4);
    const tex=signed(a,"x^3",true)+signed(b,"x"),raw=rawSigned(a,"x^3",true)+rawSigned(b,"x"),dTex=signed(3*a,"x^2",true)+signed(b,"");
    const dRaw=rawSigned(3*a,"x^2",true)+rawSigned(b,"");
    return base(`${tag}-${a}-${b}`,tex,raw,dTex,dRaw,[`Differentiate the innermost polynomial: \\(\\frac{d}{dx}(${tex})=${dTex}\\).`]);
  }
  function linearTrig(tag){
    const k=ri(2,5);
    return base(`${tag}-${k}`,`${k}x`,`${k}*x`,String(k),String(k),[`Differentiate the innermost expression: \\(\\frac{d}{dx}(${k}x)=${k}\\).`]);
  }
  function variedInner(tag){
    const style=pick(["linear","affine","quadratic","cubic","power-affine"]),k=pick([1,2,3,4,5]);
    if(style==="linear"){
      const tex=k===1?"x":`${k}x`,raw=k===1?"x":`${k}*x`;
      return base(`${tag}-linear-${k}`,tex,raw,String(k),String(k),[`Differentiate the innermost expression: \\(\\frac{d}{dx}(${tex})=${k}\\).`]);
    }
    if(style==="affine"){
      const b=nz(-4,4),tex=signed(k,"x",true)+signed(b,""),raw=rawSigned(k,"x",true)+rawSigned(b,"");
      return base(`${tag}-affine-${k}-${b}`,tex,raw,String(k),String(k),[`Differentiate the innermost expression: \\(\\frac{d}{dx}(${tex})=${k}\\).`]);
    }
    const degree=style==="cubic"?3:2,coefficient=style==="power-affine"?pick([1,2,3]):k,b=style==="power-affine"?nz(-4,4):0;
    const term=degree===2?"x^2":"x^3",tex=signed(coefficient,term,true)+signed(b,""),raw=rawSigned(coefficient,term,true)+rawSigned(b,"");
    const dCoefficient=coefficient*degree,dTerm=degree===2?"x":"x^2",dTex=signed(dCoefficient,dTerm,true),dRaw=rawSigned(dCoefficient,dTerm,true);
    return base(`${tag}-${style}-${coefficient}-${degree}-${b}`,tex,raw,dTex,dRaw,[`Differentiate the innermost expression: \\(\\frac{d}{dx}(${tex})=${dTex}\\).`]);
  }
  const trigLayer=()=>pick(["sin","cos","tan","cot"]);
  function squarePlusConstant(tag){
    const c=ri(2,7);
    return base(`${tag}-${c}`,`x^2+${c}`,`x^2+${c}`,`2x`,`2*x`,[`Differentiate the radicand: \\(\\frac{d}{dx}(x^2+${c})=2x\\).`]);
  }
  function squarePlusSine(){
    return base("square-plus-sine",`x^2+\\sin x`,`x^2+sin(x)`,`2x+\\cos x`,`2*x+cos(x)`,[`Differentiate the radicand term by term: \\(\\frac{d}{dx}(x^2+\\sin x)=2x+\\cos x\\).`]);
  }
  function cubicMinusCosine(){
    return base("cubic-minus-cosine",`x^3-\\cos x`,`x^3-cos(x)`,`3x^2+\\sin x`,`3*x^2+sin(x)`,[`Differentiate the innermost expression: \\(\\frac{d}{dx}(x^3-\\cos x)=3x^2+\\sin x\\).`]);
  }
  function squarePlusLinear(){
    const c=ri(2,5);
    return base(`square-plus-linear-${c}`,`x^2+${c}x`,`x^2+${c}*x`,`2x+${c}`,`2*x+${c}`,[`Differentiate the radicand: \\(\\frac{d}{dx}(x^2+${c}x)=2x+${c}\\).`]);
  }
  function fourthMinusTangent(){
    const k=pick([1,2]),argTex=k===1?"x^2":`${k}x^2`;
    return base(`fourth-minus-tangent-${k}`,`x^4-\\tan(${argTex})`,`x^4-tan(${k}*x^2)`,`4x^3-${2*k}x\\sec^2(${argTex})`,`4*x^3-${2*k}*x*sec(${k}*x^2)^2`,[
      `Differentiate the two terms in the radicand: \\(\\frac{d}{dx}(x^4)=4x^3\\).`,
      `For \\(-\\tan(${argTex})\\), the chain rule gives \\(-${2*k}x\\sec^2(${argTex})\\). Therefore the radicand derivative is \\(4x^3-${2*k}x\\sec^2(${argTex})\\).`
    ]);
  }
  function cubicMinusCompositeCosine(){
    const k=pick([1,2]);
    return base(`cubic-minus-composite-cos-${k}`,`x^3-\\cos(${k===1?"":k}x^2)`,`x^3-cos(${k}*x^2)`,`3x^2+${2*k}x\\sin(${k===1?"":k}x^2)`,`3*x^2+${2*k}*x*sin(${k}*x^2)`,[
      `Differentiate \\(x^3\\) to get \\(3x^2\\).`,
      `The derivative of \\(-\\cos(${k===1?"":k}x^2)\\) is \\(${2*k}x\\sin(${k===1?"":k}x^2)\\). Add the two results.`
    ]);
  }
  function squarePlusNestedF(){
    const k=pick([1,2]),argTex=k===1?"x^3":`${k}x^3`;
    return base(`square-plus-f-cubic-${k}`,`x^2+f(${argTex})`,`x^2+f(${k}*x^3)`,`2x+${3*k}x^2f'(${argTex})`,`2*x+${3*k}*x^2*fp(${k}*x^3)`,[
      `Inside the square root, \\(x^2\\) differentiates to \\(2x\\).`,
      `For \\(f(${argTex})\\), apply the chain rule: \\(f'(${argTex})(${3*k}x^2)\\). Thus the radicand derivative is \\(2x+${3*k}x^2f'(${argTex})\\).`
    ]);
  }

  function finish(group,node,label){
    const result=finalDerivative(node);
    const operations=[];let cursor=node;while(cursor.kind!=="base"){operations.push(cursor.operation);cursor=cursor.inner;}
    return {group,id:`${group}-${label}-${node.id}`,math:expressionTex(node),functionExpr:expressionRaw(node),answerExpr:result.raw,answerTex:result.tex,steps:result.steps,operations,innerId:cursor.id};
  }

  function foundationProblem(){
    const style=pick([1,2,3,4]);
    if(style===1)return finish("foundation",nest(quadratic("f-poly"),["f"]),"f-poly");
    if(style===2){const trig=trigLayer();return finish("foundation",nest(variedInner(`g-${trig}`),[trig,"g"]),`g-${trig}`);}
    if(style===3){const trig=trigLayer();return finish("foundation",nest(quadratic(`${trig}-f`),["f",trig]),`${trig}-f`);}
    return finish("foundation",nest(variedInner("f-g"),["g","f"]),"f-g");
  }
  function threeLayerProblem(){
    const style=pick([1,2,3,4]);
    if(style===1){const innerTrig=trigLayer(),outerTrig=trigLayer();return finish("three",nest(variedInner(`${outerTrig}-g-${innerTrig}`),[innerTrig,"g",outerTrig]),`${outerTrig}-g-${innerTrig}`);}
    if(style===2){const trig=trigLayer();return finish("three",nest(quadratic(`g-${trig}-f`),["f",trig,"g"]),`g-${trig}-f`);}
    if(style===3){const trig=trigLayer();return finish("three",nest(quadratic(`f-${trig}-g`,false),["g",trig,"f"]),`f-${trig}-g`);}
    const trig=trigLayer();return finish("three",nest(squarePlusConstant(`${trig}-f-root`),["sqrt","f",trig]),`${trig}-f-root`);
  }
  function fourLayerProblem(){
    const style=pick([1,2,3,4]);
    if(style===1){const first=trigLayer(),second=trigLayer();return finish("four",nest(variedInner(`g-${second}-f-${first}`),[first,"f",second,"g"]),`g-${second}-f-${first}`);}
    if(style===2)return finish("four",nest(squarePlusSine(),["sqrt","g","cos","f"]),"f-cos-g-root");
    if(style===3){const first=trigLayer(),second=trigLayer();return finish("four",nest(cubicMinusCosine(),["f",first,"g",second]),`${second}-g-${first}-f`);}
    const first=trigLayer(),second=trigLayer();return finish("four",nest(quadratic(`g-${second}-f-${first}`),[first,"f",second,"g"]),`g-${second}-f-${first}`);
  }
  function fiveLayerProblem(){
    const style=pick([1,2,3,4]);
    if(style===1){const first=trigLayer(),second=trigLayer();return finish("five",nest(squarePlusLinear(),["sqrt",first,"f",second,"g"]),`g-${second}-f-${first}-root`);}
    if(style===2){const first=trigLayer(),second=trigLayer();return finish("five",nest(fourthMinusTangent(),["sqrt",first,"g",second,"f"]),`f-${second}-g-${first}-root`);}
    if(style===3){const first=trigLayer(),second=trigLayer();return finish("five",nest(cubicMinusCompositeCosine(),["sqrt",first,"f",second,"g"]),`g-${second}-f-${first}-root`);}
    const first=trigLayer(),second=trigLayer(),outer=trigLayer();return finish("five",nest(squarePlusNestedF(),["sqrt",first,"g",second,outer]),`${outer}-${second}-g-${first}-root`);
  }

  const generators={foundation:foundationProblem,three:threeLayerProblem,four:fourLayerProblem,five:fiveLayerProblem};
  const groups=Object.keys(generators);
  function contexts(){
    const parameterSets=[
      {a:.42,b:.31,c:2.1,d:.36,e:.27,h:-.2},
      {a:-.28,b:.47,c:2.4,d:.51,e:-.19,h:.35}
    ];
    const xs=[1.35,1.47,1.62,1.78],out=[];
    for(const p of parameterSets)for(const x of xs)out.push({
      x,
      f:u=>p.a*Math.sin(u)+p.b*u+p.c,
      fp:u=>p.a*Math.cos(u)+p.b,
      g:u=>p.d*Math.cos(u)+p.e*u+p.h,
      gp:u=>-p.d*Math.sin(u)+p.e
    });
    return out;
  }

  function solutionHtml(problem){return `<div class="solution-title">Step-by-step walkthrough</div><ol class="solution-steps">${problem.steps.map(step=>`<li>${step}</li>`).join("")}</ol>`;}
  function revealSolution(reason){
    const method=$("method");if(!method||!method.hidden)return;
    method.hidden=false;$("show-explanation")?.setAttribute("hidden","");
    window.BMAnalytics?.solutionRevealed(current,{reveal_reason:reason});typeset([method]);
  }
  function newProblem(){
    const selected=$("practice-type").value;let problem;
    for(let tries=0;tries<120;tries++){
      const group=selected==="mixed"?pick(groups):selected;problem=generators[group]();
      if(!seen.has(problem.id)){seen.add(problem.id);break;}if(seen.size>500)seen.clear();
    }
    current=problem;current.answered=false;
    if(new URLSearchParams(location.search).get("bm_qa")==="1")window.__BM_CURRENT_PROBLEM=current;
    $("question").innerHTML=`<div class="question-prompt">Assume \\(f\\) and \\(g\\) are differentiable. Find \\(y'\\).</div><div>\\(y=${problem.math}\\)</div>`;
    $("answer").value="";window.BatchMathCalculusKeypad?.reset?.();$("answer").disabled=false;$("submit").disabled=false;$("next").style.display="none";
    $("feedback").className="feedback";$("feedback").innerHTML="";$("topic-name").textContent=$("practice-type").selectedOptions[0].textContent;
    window.BMAnalytics?.ensurePracticeStarted({practice_mode:selected});window.BMAnalytics?.problemGenerated(current,{practice_mode:selected});
    typeset([$("question")]);window.BatchMathCalculusKeypad?.focus?.();
  }
  function check(){
    if(!current||current.answered)return;const raw=$("answer").value.trim();
    if(!raw){$("feedback").className="feedback wrong";$("feedback").innerHTML='<div class="status">Enter an answer first.</div>';return;}
    const ok=window.BatchMathDerivativeExpressions.equivalent(raw,current.answerExpr,contexts(),2e-6);
    current.answered=true;attempted++;if(ok)correct++;
    $("correct-count").textContent=correct;$("attempted").textContent=attempted;$("answer").disabled=true;$("submit").disabled=true;$("next").style.display="inline-block";
    $("feedback").className=`feedback ${ok?"correct":"wrong"}`;
    $("feedback").innerHTML=`<div class="status">${ok?"Correct.":"Not quite."}</div><div class="correct-answer">One correct form: \\(y'=${current.answerTex}\\)</div><button id="show-explanation" class="practice-button show-explanation" type="button"${ok?"":" hidden"}>Show Explanation</button><div id="method" class="method"${ok?" hidden":""}>${solutionHtml(current)}</div>`;
    $("show-explanation")?.addEventListener("click",()=>revealSolution("student_request"));
    if(!ok)window.BMAnalytics?.solutionRevealed(current,{reveal_reason:"wrong_answer"});window.BMAnalytics?.answerChecked(current,ok);
    typeset([$("feedback")]);$("next").focus();
  }

  window.BatchMathNestedChainQA=Object.freeze({generators,groups});
  $("submit").addEventListener("click",check);$("next").addEventListener("click",newProblem);$("practice-type").addEventListener("change",newProblem);
  $("answer").addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();current?.answered?newProblem():check();}});
  const boot=()=>newProblem();if(window.MathJax?.startup?.promise)window.MathJax.startup.promise.then(boot);else window.addEventListener("load",boot);
})();
