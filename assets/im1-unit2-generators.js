(function(global){
'use strict';
const R=()=>global.BatchMathRNG?.random?.() ?? 0.5;
const ri=(a,b)=>Math.floor(R()*(b-a+1))+a;
const pick=a=>a[Math.floor(R()*a.length)];
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a||1};
const clean=s=>String(s).replace(/\+\s*-/g,'- ').replace(/-\s*-/g,'+ ').replace(/\s+/g,' ').trim();
const signTerm=(n,t)=>n===0?'':n>0?`+ ${n===1&&t?'':n}${t}`:`- ${n===-1&&t?'':Math.abs(n)}${t}`;
function poly(terms){let out='';for(const [c,t] of terms){if(!c)continue;if(!out){out=(c<0?'-':'')+(Math.abs(c)===1&&t?'':Math.abs(c))+t}else out+=' '+signTerm(c,t)}return out||'0'}
const lin=(a,b,v='x')=>poly([[a,v],[b,'']]);
const tex=s=>`\\(${clean(s)}\\)`;
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function mc(id,variant,q,correct,distractors,explain,fill=true){const vals=[];for(const x of [correct,...distractors])if(x!=null&&!vals.includes(String(x)))vals.push(String(x));const fillers=['Cannot be determined','No solution','Infinitely many solutions','None of these'];for(const x of fill?fillers:[]){if(vals.length>=4)break;if(!vals.includes(x)&&x!==String(correct))vals.push(x)}const choices=shuffle(vals.slice(0,4));return{id,variant,q,choices,correctIndex:choices.indexOf(String(correct)),answer:String(correct),explain};}
function numChoices(n){return [n+1,n-1,-n,n+2].map(String)}
function interval(bound,op){if(op==='<')return`(-∞, ${bound})`;if(op==='<=')return`(-∞, ${bound}]`;if(op==='>')return`(${bound}, ∞)`;return`[${bound}, ∞)`}
function inequalityText(bound,op){return `x ${op==='<='?'≤':op==='>='?'≥':op} ${bound}`}
function graphDesc(bound,op){const closed=op.includes('=');const dir=op[0]==='<'?'left':'right';return `${closed?'closed':'open'} circle at ${bound}; shade ${dir}`}
function svgGraph(points,dot=null){const W=360,H=300,s=25,ox=W/2,oy=H/2;const X=x=>ox+x*s,Y=y=>oy-y*s;let ticks='';for(let i=-5;i<=5;i++){if(i){ticks+=`<line x1="${X(i)}" y1="${oy-4}" x2="${X(i)}" y2="${oy+4}" stroke="#777"/><text x="${X(i)}" y="${oy+17}" fill="#bbb" font-size="10" text-anchor="middle">${i}</text>`;ticks+=`<line x1="${ox-4}" y1="${Y(i)}" x2="${ox+4}" y2="${Y(i)}" stroke="#777"/><text x="${ox-8}" y="${Y(i)+3}" fill="#bbb" font-size="10" text-anchor="end">${i}</text>`}}const pl=points?.length?`<polyline points="${points.map(([x,y])=>`${X(x)},${Y(y)}`).join(' ')}" fill="none" stroke="#f5c400" stroke-width="3"/>${points.map(([x,y])=>`<circle cx="${X(x)}" cy="${Y(y)}" r="4" fill="#f5c400"/>`).join('')}`:'';const d=dot?`<circle cx="${X(dot[0])}" cy="${Y(dot[1])}" r="6" fill="#d71920"/>`:'';return`<div class="bm-mini-graph"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Coordinate graph"><line x1="${X(-5.5)}" y1="${oy}" x2="${X(5.5)}" y2="${oy}" stroke="#aaa"/><line x1="${ox}" y1="${Y(-5.5)}" x2="${ox}" y2="${Y(5.5)}" stroke="#aaa"/>${ticks}${pl}${d}</svg></div>`}

// Targeted algebra choices need only genuine answers, never generic fillers.
const algebraChoice=(...args)=>mc(...args,false);
const coeff=()=>pick([-9,-8,-7,-6,-5,-4,-3,-2,2,3,4,5,6,7,8,9]);
function equivalent(){
 const v=pick(['combine','constants','multi','two_variables','mixed_products','three_groups','like_terms']);
 const [x,y]=pick([['x','y'],['a','b'],['m','n'],['p','q'],['r','s'],['u','v']]);
 const power=ri(2,4);
 if(v==='like_terms'){
  const a=coeff(),b=coeff(),part=pick([x,`${x}^{${power}}`,`${x}${y}^{${power}}`,`${x}^{2}${y}`]);
  const pair=(t,u)=>`${tex(poly([[a,t]]))} and ${tex(poly([[b,u]]))}`;
  return algebraChoice(`u2-like-${a}-${b}-${part}`,v,'Which pair contains like terms?',pair(part,part),[pair(x,y),pair(x,`${x}^{${power}}`),pair(`${x}${y}`,`${x}${y}^{${power}}`)],`Like terms have identical variables with identical exponents. In the correct pair, both variable parts are ${tex(part)}; the coefficients may differ.`);
 }
 const parts={combine:[x],constants:[x,''],multi:[`${x}^{${power}}`,x],two_variables:[x,y],mixed_products:[`${x}${y}^{${power}}`,`${x}^{${power}}${y}`,`${x}${y}`],three_groups:[`${x}^{${power}}`,x,'']}[v];
 const groups=parts.map(part=>{
  const first=coeff(),second=pick([-9,-8,-7,-6,-5,-4,-3,-2,2,3,4,5,6,7,8,9].filter(n=>Math.abs(first+n)!==1));
  return {part,values:[first,second],total:first+second};
 });
 const terms=shuffle(groups.flatMap(g=>g.values.map(c=>[c,g.part]))),answer=poly(groups.map(g=>[g.total,g.part]));
 const steps=groups.map(g=>{
  const sum=g.values.map(n=>n<0?`(${n})`:String(n)).join('+');
  const label=g.part?`For the ${tex(g.part)} terms`:'For the constants';
  return `<li>${label}, add ${g.part?'the coefficients':'their values'}: ${tex(`${sum}=${g.total}`)}.${g.part?` Keep the variable part ${tex(g.part)} unchanged.`:''}${g.total===0?' These terms cancel.':''}</li>`;
 }).join('');
 return {id:`u2-like-input-${v}-${JSON.stringify(terms)}`,variant:v,kind:'polynomial',q:`Combine like terms: ${tex(poly(terms))}.`,answer,answerTex:tex(answer),terms,variables:[x,y].filter(letter=>parts.some(part=>part.includes(letter))),explain:`<ol>${steps}</ol>So the simplified expression is ${tex(answer)}.`};
}
function equivalenceQuestion(v){
 const variable=pick(['x','y','a','m','p']),k=ri(2,7),a=ri(2,6),b=coeff();
 const left=`${k}(${lin(a,b,variable)})`,target=lin(k*a,k*b,variable);
 if(v==='equivalent'){
  const yes=R()<.5,other=lin(k*a,k*b+(yes?0:pick([-3,-2,2,3])),variable);
  return algebraChoice(`u2-dist-equivalent-${variable}-${k}-${a}-${b}-${yes}`,v,`Are ${tex(left)} and ${tex(other)} equivalent for every value of ${tex(variable)}?`,yes?'Equivalent':'Not equivalent',[yes?'Not equivalent':'Equivalent'],`Distribute ${k} to both terms: ${tex(`${left}=${target}`)}. ${yes?'Both expressions simplify to the same expression.':'The constant terms differ, so the expressions are not equivalent.'}`);
 }
 return algebraChoice(`u2-dist-construct-${variable}-${k}-${a}-${b}`,v,`Which expression is equivalent to ${tex(target)}?`,tex(left),[tex(`${k}(${lin(a,b+2,variable)})`),tex(`${k}(${lin(a+2,b,variable)})`),tex(`${k}(${lin(a,-b,variable)})`)],`Distribute to both terms: ${tex(`${left}=${target}`)}. The coefficient of ${tex(variable)} and the constant must both match.`);
}

function distributive(){const v=pick(['basic','negative','multiterm','combine','two_groups','three_groups','reverse','equivalent','construct']);
 if(v==='equivalent'||v==='construct')return equivalenceQuestion(v);
 if(v==='reverse'){const g=pick([2,3,4,5,6,7]),a=ri(2,5),b=ri(-7,7)||3;const expr=lin(g*a,g*b);const correct=tex(`${g}(${lin(a,b)})`);return algebraChoice(`u2-dist-rev-${g}-${a}-${b}`,v,`Rewrite ${tex(expr)} using the distributive property in reverse.`,correct,[tex(`${g}(${lin(a,g*b)})`),tex(`${g}(${lin(a+1,b)})`),tex(`${g}(${lin(a,-b)})`)],`Factor ${g} from both terms: ${tex(`${expr}=${g}(${lin(a,b)})`)}. Distribute to check the result.`)}
 if(v==='three_groups'){
  const groups=Array.from({length:3},()=>[coeff(),ri(2,5),coeff()]);
  const raw=poly(groups.map(([k,a,b])=>[k,`(${lin(a,b)})`]));
  const A=groups.reduce((sum,[k,a])=>sum+k*a,0),B=groups.reduce((sum,[k,,b])=>sum+k*b,0),ans=lin(A,B);
  const expanded=poly(groups.flatMap(([k,a,b])=>[[k*a,'x'],[k*b,'']]));
  return algebraChoice(`u2-dist-three-${JSON.stringify(groups)}`,v,`Distribute and simplify ${tex(raw)}.`,tex(ans),[tex(lin(A+2,B)),tex(lin(A,B+3)),tex(lin(A-2,B-3))],`Multiply each outside factor by every term in its parentheses: ${tex(expanded)}. Then combine the x-terms and constants: ${tex(ans)}.`);
 }
 if(v==='two_groups'){const a=ri(2,6),b=ri(-5,5)||-2,p=coeff(),q=coeff();const A=a+b,B=a*p+b*q;const raw=poly([[a,`(${lin(1,p)})`],[b,`(${lin(1,q)})`]]);return algebraChoice(`u2-dist-two-${a}-${b}-${p}-${q}`,v,`Distribute and simplify ${tex(raw)}.`,tex(lin(A,B)),[tex(lin(a+b,a*p-b*q)),tex(lin(a-b,B)),tex(lin(A,B+1))],`Distribute through both sets of parentheses, then combine like terms.`)}
 if(v==='combine'){const k=pick([-6,-5,-4,-3,-2,2,3,4,5]),p=coeff(),c=coeff();const raw=poly([[k,`(${lin(1,p)})`],[c,'x']]);return algebraChoice(`u2-dist-comb-${k}-${p}-${c}`,v,`Distribute and simplify ${tex(raw)}.`,tex(lin(k+c,k*p)),[tex(lin(k-c,k*p)),tex(lin(k+c,p)),tex(lin(k+c,k*p+c))],`Distribute ${k} first, then combine the x-terms.`)}
 if(v==='multiterm'){const k=pick([-5,-4,-3,2,3,4,5]),a=ri(2,5),b=ri(-5,5)||2,c=ri(-5,5)||-1;const ans=poly([[k*a,'x'],[k*b,'y'],[k*c,'']]);return algebraChoice(`u2-dist-multi-${k}-${a}-${b}-${c}`,v,`Distribute ${tex(`${k}(${poly([[a,'x'],[b,'y'],[c,'']])})`)}.`,tex(ans),[tex(poly([[k*a,'x'],[b,'y'],[c,'']])),tex(poly([[k+a,'x'],[k+b,'y'],[k+c,'']])),tex(poly([[-k*a,'x'],[-k*b,'y'],[-k*c,'']]))],`Multiply ${k} by every term inside the parentheses.`)}
 const k=v==='negative'?pick([-7,-6,-5,-4,-3,-2]):pick([2,3,4,5,6,7]),a=ri(2,5),b=ri(-8,8)||3;return algebraChoice(`u2-dist-${v}-${k}-${a}-${b}`,v,`Distribute ${tex(`${k}(${lin(a,b)})`)}.`,tex(lin(k*a,k*b)),[tex(lin(k*a,b)),tex(lin(k+a,k*b)),tex(lin(-k*a,-k*b))],`Multiply ${k} by both terms inside the parentheses.`)}

function ratio(n,d){if(d<0){n=-n;d=-d;}const g=gcd(n,d);n/=g;d/=g;return d===1?String(n):`${n<0?'-':''}\\frac{${Math.abs(n)}}{${d}}`;}
function equation(){
 const roll=R(),v=roll<.11?'identity':roll<.22?'contradiction':pick(['one_step','two_step','distribution','both_sides','fraction_coefficient','fraction_expression','two_fractions']);
 let A=coeff(),B=coeff(),C=0,D=0,left='',right='',scale=1,s=ri(-9,9),pre='',hint='';
 if(v==='identity'||v==='contradiction'){
  const k=pick([-4,-3,-2,2,3,4]),a=ri(2,5),b=coeff();A=k*a;B=k*b;C=A;D=B+(v==='identity'?0:coeff());
  left=`${k}(${lin(a,b)})`;right=lin(C,D);
  pre='Distribute to every term inside the parentheses.';hint='Distribute first, then collect the variable terms. Check whether the remaining statement is true or false.';
 }else if(v==='one_step'){
  if(R()<.5){A=1;D=s+B;left=lin(A,B);hint='Undo the addition or subtraction using the same operation on both sides.';}
  else{B=0;D=A*s;left=lin(A,B);hint='Divide both sides by the coefficient of x.';}
  right=String(D);
 }else if(v==='two_step'){
  D=A*s+B;left=lin(A,B);right=String(D);hint='Undo the constant term first, then divide by the coefficient of x.';
 }else if(v==='distribution'){
  const k=pick([-4,-3,-2,2,3,4]),a=ri(2,5),b=coeff();A=k*a;B=k*b;D=A*s+B;left=`${k}(${lin(a,b)})`;right=String(D);
  pre='Distribute to both terms inside the parentheses.';hint='Multiply both terms inside the parentheses by the outside factor, then isolate x.';
 }else if(v==='both_sides'){
  C=pick([-7,-5,-3,2,4,6,8].filter(n=>n!==A));D=(A-C)*s+B;left=lin(A,B);right=lin(C,D);
  hint='Move the variable terms to one side and the constant terms to the other.';
 }else if(v==='fraction_coefficient'){
  scale=ri(2,5);A=pick([2,3,4,5,7,-2,-3,-5].filter(n=>gcd(n,scale)===1));s=scale*ri(-4,4);B=scale*coeff();D=A*s+B;
  left=poly([[1,`${ratio(A,scale)}x`],[B/scale,'']]);right=String(D/scale);
  hint=`Multiply both sides by ${scale} to clear the denominator, then solve the resulting equation.`;
 }else if(v==='fraction_expression'){
  scale=ri(2,6);A=pick([1,2,3,4]);D=scale*ri(-8,8);B=D-A*s;if(B===0){B=scale;D+=scale;}
  left=`\\frac{${lin(A,B)}}{${scale}}`;right=String(D/scale);
  hint=`Multiply both sides by ${scale}. The fraction bar groups the entire numerator.`;
 }else{
  const d=ri(2,5),e=pick([2,3,4,5].filter(n=>n!==d)),a=ri(2,5),c=pick([2,3,4,5].filter(n=>e*a!==d*n)),b=d*coeff();
  s=d*ri(-4,4);const rhs=e*(a*s+b)/d-c*s;scale=d*e;A=e*a;B=e*b;C=d*c;D=d*rhs;
  left=`\\frac{${lin(a,b)}}{${d}}`;right=`\\frac{${lin(c,rhs)}}{${e}}`;
  hint=`Multiply both sides by a common denominator, such as ${scale}, before collecting like terms.`;
 }
 // Everything below solves the exact integer equation after clearing denominators.
 const steps=[];const show=(instruction,math)=>steps.push(`<li>${instruction} ${tex(math)}</li>`);
 if(scale>1)show(`Multiply both sides by ${scale} to clear the denominators:`,`${lin(A,B)}=${lin(C,D)}`);
 else if(pre)show(pre,`${lin(A,B)}=${lin(C,D)}`);
 if(C!==0)show(`${C<0?'Add':'Subtract'} ${tex(poly([[Math.abs(C),'x']]))} ${C<0?'to':'from'} both sides:`,`${lin(A-C,B)}=${D}`);
 const coefficient=A-C,numerator=D-B;
 let answer,answerTex;
 if(coefficient===0){
  answer=B===D?'Infinitely many solutions':'No solution';answerTex=answer;
  if(!C)show('The variable terms cancel:',`${B}=${D}`);
  steps.push(`<li>${tex(`${B}=${D}`)} is ${B===D?'true, regardless of x. Every real number is a solution.':'false. No value of x can make the original equation true.'}</li>`);
 }else{
  if(B!==0)show(`${B<0?'Add':'Subtract'} ${Math.abs(B)} ${B<0?'to':'from'} both sides:`,`${lin(coefficient,0)}=${numerator}`);
  answer=String(s);answerTex=tex(`x=${ratio(numerator,coefficient)}`);
  if(coefficient!==1)show(`Divide both sides by ${coefficient}:`,`x=${ratio(numerator,coefficient)}`);
  else if(B===0&&C===0&&!pre&&scale===1)show('The variable is already isolated:',`x=${s}`);
 }
 return {id:`u2-equation-${v}-${left}=${right}`,variant:v,kind:'equation',q:`Solve ${tex(`${left}=${right}`)}.`,answer,answerTex,hint,explain:`<ol>${steps.join('')}</ol>`,math:{A,B,C,D,scale,solution:coefficient===0?null:s},variables:['x']};
}

function inequality(){const v=pick(['basic','negative_flip','distribution','both_sides','compound','creation']);const strict=R()<.5,op=strict?'<':'≤',s=ri(-8,9);
 if(v==='negative_flip'){const a=pick([2,3,4,5]),b=ri(-8,8),rhs=-a*s+b;const corr=`x ${strict?'>':'≥'} ${s}`;return algebraChoice(`u2-ineq-flip-${a}-${b}-${rhs}-${strict?1:0}`,v,`Solve ${tex(`${-a}x ${b>=0?'+':''}${b} ${op} ${rhs}`)}.`,tex(corr),[tex(`x ${op} ${s}`),tex(`x ${strict?'>':'≥'} ${-s}`),tex(`x ${strict?'<':'≤'} ${s}`)],`Dividing by a negative reverses the inequality sign.`)}
 if(v==='compound'){const a=pick([2,3,4]),l=ri(-6,-1),u=ri(1,7),b=ri(-4,4),L=a*l+b,U=a*u+b;const corr=`${l} < x ≤ ${u}`;return algebraChoice(`u2-ineq-comp-${a}-${b}-${l}-${u}`,v,`Solve ${tex(`${L} < ${a}x ${b>=0?'+':''}${b} ≤ ${U}`)}.`,tex(corr),[tex(`${l} ≤ x < ${u}`),tex(`x < ${l} or x ≥ ${u}`),tex(`${L} < x ≤ ${U}`)],`Perform the same inverse operations on all three parts of the compound inequality.`)}
 if(v==='both_sides'){let a=ri(2,7),c=ri(1,6);if(a===c)c++;const b=ri(-8,8),d=b+(a-c)*s;const diff=a-c;const sign=diff>0?(strict?'<':'≤'):(strict?'>':'≥');const corr=`x ${sign} ${s}`;return algebraChoice(`u2-ineq-both-${a}-${b}-${c}-${d}-${strict?1:0}`,v,`Solve ${tex(`${lin(a,b)} ${op} ${lin(c,d)}`)}.`,tex(corr),[tex(`x ${op} ${s}`),tex(`x ${strict?'>':'≥'} ${s}`),tex(`x ${strict?'<':'≤'} ${-s}`)],`Collect x-terms first. If the final coefficient of x is negative, reverse the inequality when dividing.`)}
 if(v==='distribution'){const k=pick([2,3,4,-2,-3,-4]),p=ri(-5,5),rhs=k*(s+p);const sign=k>0?op:(strict?'>':'≥');return algebraChoice(`u2-ineq-dist-${k}-${p}-${rhs}-${strict?1:0}`,v,`Solve ${tex(`${k}(x ${p>=0?'+':''}${p}) ${op} ${rhs}`)}.`,tex(`x ${sign} ${s}`),[tex(`x ${op} ${s}`),tex(`x ${sign} ${-s}`),tex(`x ${strict?'<':'≤'} ${s+1}`)],`Divide by ${k}; remember that a negative divisor reverses the inequality.`)}
 if(v==='creation'){
  const a=ri(2,7),b=coeff(),boundary=ri(-8,8),rhs=-a*boundary+b,relation=pick(['<','≤','>','≥']),flipped={'<':'>','≤':'≥','>':'<','≥':'≤'}[relation];
  const raw=`${lin(-a,b)} ${relation} ${rhs}`;
  const first=algebraChoice(`u2-ineq-create-${a}-${b}-${boundary}-${relation}`,v,'Part 1: Which inequality requires reversing the sign when dividing to isolate x?',tex(raw),[tex(`${lin(a,b)} ${relation} ${rhs}`),tex(`${lin(a+1,b)} ${relation} ${rhs}`),tex(`${lin(a+2,b)} ${relation} ${rhs}`)],`The x-coefficient is negative in ${tex(raw)}. Dividing both sides by ${-a} reverses the inequality sign.`);
  first.part2=algebraChoice(first.id+'-solve','creation_solve',`Part 2: Solve ${tex(raw)}.`,tex(`x ${flipped} ${boundary}`),[tex(`x ${relation} ${boundary}`),tex(`x ${flipped} ${boundary+1}`),tex(`x ${flipped} ${boundary-1}`)],`<ol><li>${b<0?'Add':'Subtract'} ${Math.abs(b)} ${b<0?'to':'from'} both sides: ${tex(`${-a}x ${relation} ${rhs-b}`)}.</li><li>Divide both sides by ${-a} and reverse the sign: ${tex(`x ${flipped} ${boundary}`)}.</li></ol>`);
  return first;
 }

 const a=pick([2,3,4,5]),b=ri(-8,8),rhs=a*s+b;return algebraChoice(`u2-ineq-basic-${a}-${b}-${rhs}-${strict?1:0}`,v,`Solve ${tex(`${lin(a,b)} ${op} ${rhs}`)}.`,tex(`x ${op} ${s}`),[tex(`x ${strict?'>':'≥'} ${s}`),tex(`x ${op} ${-s}`),tex(`x ${strict?'<':'≤'} ${s+1}`)],`Isolate x using the same operations as an equation.`)}

function graphInterval(){const v=pick(['ineq_to_interval','interval_result','interval_to_ineq','ineq_to_graph','graph_to_interval','union','solve_then_interval']);const b=ri(-8,8),op=pick(['<','<=','>','>=']); if(v==='interval_result'){const op2=pick(['<','<=','>','>=']);return algebraChoice(`u2-ineq-int-${b}-${op2}`,v,`Which interval represents ${tex(inequalityText(b,op2))}?`,interval(b,op2),[interval(b,op2[0]==='<'?'>':'<'),interval(b,op2.includes('=')?op2[0]:op2+'='),`[${b}, ${b}]`],'Open endpoints represent strict inequalities; closed endpoints include equality.')}

 if(v==='ineq_to_interval')return mc(`u2-int-i2n-${b}-${op}`,v,`Write ${tex(inequalityText(b,op))} in interval notation.`,interval(b,op),[interval(b,op[0]==='<'?'>':'<'),interval(b,op.includes('=')?op[0]:op+'='),`(${b}, ${b})`],'Use a parenthesis for a strict endpoint and a bracket when the endpoint is included.');
 if(v==='interval_to_ineq')return mc(`u2-int-n2i-${b}-${op}`,v,`Which inequality matches the interval ${tex(interval(b,op))}?`,tex(inequalityText(b,op)),[tex(inequalityText(b,op[0]==='<'?'>':'<')),tex(inequalityText(b,op.includes('=')?op[0]:op+'=')),tex(`x = ${b}`)],'The direction of the interval tells which side of the endpoint is included.');
 if(v==='ineq_to_graph')return mc(`u2-int-i2g-${b}-${op}`,v,`Which number-line description represents ${tex(inequalityText(b,op))}?`,graphDesc(b,op),[graphDesc(b,op[0]==='<'?'>':'<'),graphDesc(b,op.includes('=')?op[0]:op+'='),`${op.includes('=')?'open':'closed'} circle at ${b}; shade ${op[0]==='<'?'right':'left'}`],'An open circle means the endpoint is excluded; a closed circle means it is included.');
 if(v==='graph_to_interval')return mc(`u2-int-g2n-${b}-${op}`,v,`A number line has an ${op.includes('=')?'closed':'open'} circle at ${b} and is shaded ${op[0]==='<'?'left':'right'}. Which interval is represented?`,interval(b,op),[interval(b,op[0]==='<'?'>':'<'),interval(b,op.includes('=')?op[0]:op+'='),`[${b}, ${b}]`],'Translate the endpoint type and shading direction into interval notation.');
 if(v==='union'){const a=ri(-8,-1),c=ri(1,8);const leftClosed=R()<.5,rightClosed=R()<.5;const ans=`${leftClosed?'(-∞, '+a+']':'(-∞, '+a+')'} ∪ ${rightClosed?'['+c+', ∞)':'('+c+', ∞)'}`;const prompt=`x ${leftClosed?'≤':'<'} ${a} or x ${rightClosed?'≥':'>'} ${c}`;return mc(`u2-int-union-${a}-${c}-${leftClosed?1:0}-${rightClosed?1:0}`,v,`Write ${tex(prompt.split(' or ')[0])} or ${tex(prompt.split(' or ')[1])} in interval notation.`,ans,[`(${a}, ${c})`,`[${a}, ${c}]`,`(-∞, ${c}) ∪ (${a}, ∞)`],'A disconnected solution uses a union of two intervals.');}
 const a=pick([2,3,4]),s=ri(-6,6),c=ri(-7,7),rhs=a*s+c;return mc(`u2-int-solve-${a}-${c}-${rhs}-${op}`,v,`Solve ${tex(`${lin(a,c)} ${op==='<'?'<':op==='<='?'≤':op==='>'?'>':'≥'} ${rhs}`)} and give the answer in interval notation.`,interval(s,op),[interval(s,op[0]==='<'?'>':'<'),interval(s,op.includes('=')?op[0]:op+'='),`[${s}, ${s}]`],'Solve first, then translate the solution inequality into interval notation.');}

function coordinateFeatures(){const v=pick(['plot_point','domain','range','increasing','decreasing','constant','x_intercepts','y_intercept','absolute_max','absolute_min']);
 if(v==='plot_point'){let x=ri(-4,4),y=ri(-4,4);if(x===0&&y===0)x=2;const g=svgGraph([], [x,y]);return mc(`u2-graph-point-${x}-${y}`,v,`${g}<p>What are the coordinates of the plotted point?</p>`,tex(`(${x}, ${y})`),[tex(`(${y}, ${x})`),tex(`(${-x}, ${y})`),tex(`(${x}, ${-y})`)],'Read x horizontally first, then y vertically.');}
 let sx=ri(-1,1),sy=ri(-1,1);if(v==='x_intercepts')sy=0;if(v==='y_intercept')sx=0;const pts=[[-4+sx,-2+sy],[-2+sx,2+sy],[0+sx,2+sy],[2+sx,-2+sy],[4+sx,0+sy]],g=svgGraph(pts);
 if(v==='domain')return mc(`u2-graph-domain-${sx}-${sy}`,v,`${g}<p>What is the domain of the graphed function?</p>`,tex(`[${-4+sx}, ${4+sx}]`),[tex(`[${-2+sy}, ${2+sy}]`),tex(`(${-4+sx}, ${4+sx})`),tex(`[${-4+sx}, ∞)`)],'The domain is the set of x-values covered by the graph.');
 if(v==='range')return mc(`u2-graph-range-${sx}-${sy}`,v,`${g}<p>What is the range of the graphed function?</p>`,tex(`[${-2+sy}, ${2+sy}]`),[tex(`[${-4+sx}, ${4+sx}]`),tex(`(${-2+sy}, ${2+sy})`),tex(`[${sy}, ${2+sy}]`)],'The range is the set of y-values attained by the graph.');
 if(v==='increasing')return mc(`u2-graph-inc-${sx}-${sy}`,v,`${g}<p>On which intervals is the function increasing?</p>`,tex(`(${-4+sx}, ${-2+sx}) and (${2+sx}, ${4+sx})`),[tex(`(${-2+sx}, ${0+sx})`),tex(`(${0+sx}, ${2+sx})`),tex(`(${-2+sx}, ${2+sx})`)],'Increasing means the graph rises as x moves from left to right.');
 if(v==='decreasing')return mc(`u2-graph-dec-${sx}-${sy}`,v,`${g}<p>On which interval is the function decreasing?</p>`,tex(`(${0+sx}, ${2+sx})`),[tex(`(${-4+sx}, ${-2+sx})`),tex(`(${-2+sx}, ${0+sx})`),tex(`(${2+sx}, ${4+sx})`)],'Decreasing means the graph falls as x moves from left to right.');
 if(v==='constant')return mc(`u2-graph-const-${sx}-${sy}`,v,`${g}<p>On which interval is the function constant?</p>`,tex(`(${-2+sx}, ${0+sx})`),[tex(`(${-4+sx}, ${-2+sx})`),tex(`(${0+sx}, ${2+sx})`),tex(`(${2+sx}, ${4+sx})`)],'A constant interval is horizontal.');
 if(v==='x_intercepts')return mc(`u2-graph-xint-${sx}`,v,`${g}<p>Which list gives all x-intercepts?</p>`,tex(`${-3+sx}, ${1+sx}, ${4+sx}`),[tex(`${-2+sx}, ${2+sx}`),tex(`${-4+sx}, ${0+sx}, ${4+sx}`),tex(`${1+sx}, ${4+sx}`)],'x-intercepts occur where the graph crosses or touches y=0.');
 if(v==='y_intercept')return mc(`u2-graph-yint-${sy}`,v,`${g}<p>What is the y-intercept?</p>`,tex(`(0, ${2+sy})`),[tex(`(${2+sy}, 0)`),tex(`(0, ${sy})`),tex(`(0, ${-2+sy})`)],'The y-intercept occurs where x=0.');
 if(v==='absolute_max')return mc(`u2-graph-max-${sx}-${sy}`,v,`${g}<p>What is the absolute maximum value?</p>`,String(2+sy),[String(-2+sy),String(4+sx),String(sy)],'The absolute maximum value is the greatest y-value on the graph.');
 return mc(`u2-graph-min-${sx}-${sy}`,v,`${g}<p>What is the absolute minimum value?</p>`,String(-2+sy),[String(2+sy),String(-4+sx),String(sy)],'The absolute minimum value is the least y-value on the graph.');}

const map={
 'equivalent-expressions-combining-like-terms':equivalent,
 'distributive-property':distributive,
 'solving-linear-equations':equation,
 'solving-linear-inequalities':inequality,
 'graphing-inequalities-interval-notation':graphInterval,
 'coordinate-system-nine-key-features':coordinateFeatures
};
function get(slug){if(slug==='comprehensive-review')return()=>pick(Object.values(map))();return map[slug]||null}
global.BatchMathIM1Unit2Generators={get,slugs:Object.keys(map),all:map};
})(window);
