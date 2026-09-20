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
function svgGraph(points,dot=null,ends={},highlight=[]){
 const W=360,H=300,s=25,ox=W/2,oy=H/2,X=x=>ox+x*s,Y=y=>oy-y*s;
 let ticks='';for(let i=-5;i<=5;i++){if(i){ticks+=`<line x1="${X(i)}" y1="${oy-4}" x2="${X(i)}" y2="${oy+4}" stroke="#777"/><text x="${X(i)}" y="${oy+17}" fill="#bbb" font-size="10" text-anchor="middle">${i}</text>`;ticks+=`<line x1="${ox-4}" y1="${Y(i)}" x2="${ox+4}" y2="${Y(i)}" stroke="#777"/><text x="${ox-8}" y="${Y(i)+3}" fill="#bbb" font-size="10" text-anchor="end">${i}</text>`}}
 let pl='';if(points?.length){
  const left=points[0],right=points.at(-1),leftMode=ends.leftEnd||'closed',rightMode=ends.rightEnd||'closed';
  const rays=`${leftMode==='infinite'?`<line x1="${X(left[0])}" y1="${Y(left[1])}" x2="${X(-5.3)}" y2="${Y(ends.leftInfinity>0?4.8:-4.8)}" stroke="#d71920" stroke-width="3" marker-end="url(#bm-graph-arrow)"/>`:''}${rightMode==='infinite'?`<line x1="${X(right[0])}" y1="${Y(right[1])}" x2="${X(5.3)}" y2="${Y(ends.rightInfinity>0?4.8:-4.8)}" stroke="#d71920" stroke-width="3" marker-end="url(#bm-graph-arrow)"/>`:''}`;
  const markers=points.map(([x,y],i)=>{const color=highlight.some(([a,b])=>x>=a&&x<=b)?'#f5c400':'#d71920';const mode=i===0?leftMode:i===points.length-1?rightMode:'closed';if(mode==='infinite')return `<circle cx="${X(x)}" cy="${Y(y)}" r="3" fill="${color}"/>`;return `<circle cx="${X(x)}" cy="${Y(y)}" r="5" fill="${mode==='open'?'#111827':color}" stroke="${color}" stroke-width="3"/>`;}).join('');
  const marked=([a,b])=>highlight.some(([lo,hi])=>a>=lo&&b<=hi);
  const redSegments=points.slice(1).map((p,i)=>marked([points[i][0],p[0]])?`<line x1="${X(points[i][0])}" y1="${Y(points[i][1])}" x2="${X(p[0])}" y2="${Y(p[1])}" stroke="#f5c400" stroke-width="5"/>`:'').join('');
  const redRays=`${leftMode==='infinite'&&marked([-Infinity,left[0]])?`<line x1="${X(left[0])}" y1="${Y(left[1])}" x2="${X(-5.3)}" y2="${Y(ends.leftInfinity>0?4.8:-4.8)}" stroke="#f5c400" stroke-width="5" marker-end="url(#bm-graph-arrow-red)"/>`:''}${rightMode==='infinite'&&marked([right[0],Infinity])?`<line x1="${X(right[0])}" y1="${Y(right[1])}" x2="${X(5.3)}" y2="${Y(ends.rightInfinity>0?4.8:-4.8)}" stroke="#f5c400" stroke-width="5" marker-end="url(#bm-graph-arrow-red)"/>`:''}`;
  pl=`${rays}<polyline points="${points.map(([x,y])=>`${X(x)},${Y(y)}`).join(' ')}" fill="none" stroke="#d71920" stroke-width="3"/>${redSegments}${redRays}${markers}`;
 }
 const d=dot?`<circle cx="${X(dot[0])}" cy="${Y(dot[1])}" r="6" fill="#d71920"/>`:'';
 return`<div class="bm-mini-graph"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Coordinate graph${highlight.length?' with the correct interval highlighted in yellow':''}"><defs><marker id="bm-graph-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#d71920"/></marker><marker id="bm-graph-arrow-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#f5c400"/></marker></defs><line x1="${X(-5.5)}" y1="${oy}" x2="${X(5.5)}" y2="${oy}" stroke="#aaa"/><line x1="${ox}" y1="${Y(-5.5)}" x2="${ox}" y2="${Y(5.5)}" stroke="#aaa"/>${ticks}${pl}${d}</svg></div>`;
}

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
 const roll=R(),v=roll<.11?'identity':roll<.22?'contradiction':pick(['one_step','two_step','distribution','both_distribute_unique','both_sides','fraction_coefficient','fraction_expression','fraction_x','fraction_linear']);
 let A=coeff(),B=coeff(),C=0,D=0,left='',right='',scale=1,s=ri(-9,9),pre='',hint='';
 if(v==='identity'||v==='contradiction'){
  const shape=pick(['distribute_one','distribute_both','combine_one','combine_both','distribute_combine']);
  if(shape==='distribute_one'){
   const k=pick([-4,-3,-2,2,3,4]),a=ri(2,5),b=coeff();A=k*a;B=k*b;D=B+(v==='identity'?0:pick([-7,-5,-3,2,4,6,8]));
   left=`${k}(${lin(a,b)})`;right=lin(A,D);pre='Distribute on the left:';
  }else if(shape==='distribute_both'){
   const k=pick([2,3,4]),m=pick([2,3,4]),a=ri(2,5),b=m*ri(2,5);A=k*a;B=k*b;C=A;D=B+(v==='identity'?0:k*m*pick([-3,-2,2,3]));
   left=`${k}(${lin(m*a,b)})`;right=`${m}(${lin(k*a,D/m)})`;
   // The two outside factors create matching variable terms and the requested constant relationship.
   A=k*m*a;B=k*b;C=A;pre='Distribute on both sides:';
  }else if(shape==='combine_one'||shape==='combine_both'){
   const a=ri(2,5),c=ri(2,5),b=coeff(),d=coeff();A=a+c;B=b+d;D=B+(v==='identity'?0:pick([-7,-5,-3,2,4,6,8]));
   left=`${lin(a,b)}+${lin(c,d)}`;pre='Combine like terms on the left:';
   if(shape==='combine_one'){C=A;right=lin(C,D)}
   else{const e=ri(2,A-2),f=coeff();C=A;right=`${lin(e,f)}+${lin(A-e,D-f)}`;pre='Combine like terms on both sides:';}
  }else{
   const k=pick([2,3,4]),a=ri(2,5),b=coeff(),e=ri(2,k*a-2),f=coeff();A=k*a;B=k*b;C=A;D=B+(v==='identity'?0:pick([-7,-5,-3,2,4,6,8]));
   left=`${k}(${lin(a,b)})`;right=`${lin(e,f)}+${lin(A-e,D-f)}`;
   pre='Distribute on the left and combine like terms on the right:';
  }
  // These forms all reduce to equal x-coefficients, so the constants determine the answer.
  C=A;hint='Simplify each side first. If the x-terms match, compare the remaining constants to decide whether every x works or none do.';
 }else if(v==='both_distribute_unique'){
  let k,m,a,c,b,d;do{
   k=pick([-4,-3,-2,2,3,4]);m=pick([-4,-3,-2,2,3,4]);a=ri(2,5);c=ri(2,5);b=m*pick([-4,-3,-2,2,3,4]);
   A=k*a;B=k*b;C=m*c;s=m*ri(-3,3);D=B+(A-C)*s;d=D/m;
  }while(A===C||d===0||D===0);
  left=`${k}(${lin(a,b)})`;right=`${m}(${lin(c,d)})`;
  pre='Distribute on both sides:';hint='Distribute both parentheses. Move the x-terms to one side, then isolate x.';
 }else if(v==='one_step'){
  if(R()<.5){A=1;D=s+B;left=lin(A,B);hint='Undo the addition or subtraction using the same operation on both sides.';}
  else{B=0;D=A*s;left=lin(A,B);hint='Divide both sides by the coefficient of x.';}
  right=String(D);
 }else if(v==='two_step'){
  if(R()<.20){A=-pick([2,3,4,5,6,7]);B=coeff();left=`${B} - ${-A}x`;hint='Subtract the constant from both sides, then divide by the negative x-coefficient.';}
  else{left=lin(A,B);hint='Undo the constant term first, then divide by the coefficient of x.';}
  D=A*s+B;right=String(D);
 }else if(v==='distribution'){
  const k=pick([-4,-3,-2,2,3,4]),a=ri(2,5),b=coeff();A=k*a;B=k*b;D=A*s+B;left=`${k}(${lin(a,b)})`;right=String(D);
  pre='Distribute to both terms inside the parentheses:';hint='Multiply both terms inside the parentheses by the outside factor, then isolate x.';
 }else if(v==='both_sides'){
  C=pick([-7,-5,-3,2,4,6,8].filter(n=>n!==A));D=(A-C)*s+B;left=lin(A,B);right=lin(C,D);
  hint='Move the variable terms to one side and the constant terms to the other.';
 }else if(v==='fraction_coefficient'){
  scale=ri(2,5);A=pick([2,3,4,5,7,-2,-3,-5].filter(n=>gcd(n,scale)===1));s=scale*ri(-4,4);B=scale*coeff();D=A*s+B;
  left=poly([[1,`${ratio(A,scale)}x`],[B/scale,'']]);right=String(D/scale);
  hint=`First ${B<0?'add':'subtract'} ${Math.abs(B/scale)} to isolate ${tex(`${ratio(A,scale)}x`)}. Then multiply both sides by ${tex(ratio(scale,A))} to isolate x.`;
 }else{
  scale=ri(2,6);A=ri(2,5);
  const rhsCoefficient=v==='fraction_expression'?0:pick([-5,-4,-3,-2,2,3,4,5].filter(c=>scale*c!==A));
  const rhsConstant=v==='fraction_x'?0:coeff();
  s=pick([-9,-8,-7,-6,-5,-4,-3,-2,-1,1,2,3,4,5,6,7,8,9].filter(n=>(scale*rhsCoefficient-A)*n+scale*rhsConstant!==0));
  C=scale*rhsCoefficient;D=scale*rhsConstant;B=(C-A)*s+D;
  left=`\\frac{${lin(A,B)}}{${scale}}`;right=lin(rhsCoefficient,rhsConstant);
  hint=`Multiply both sides by ${scale} to clear the fraction. Then collect the variable terms and isolate x.`;
 }
 const steps=[];const show=(instruction,math)=>steps.push(`<li>${instruction} ${tex(math)}</li>`);
 if(scale>1)show(`Multiply both sides by ${scale} to clear the denominator:`,`${lin(A,B)}=${lin(C,D)}`);
 else if(pre)show(pre,`${lin(A,B)}=${lin(C,D)}`);
 if(C!==0)show(`${C<0?'Add':'Subtract'} ${tex(poly([[Math.abs(C),'x']]))} ${C<0?'to':'from'} both sides:`,`${lin(A-C,B)}=${D}`);
 const coefficient=A-C,numerator=D-B;let answer,answerTex;
 if(coefficient===0){
  answer=B===D?'Infinitely many solutions':'No solution';answerTex=answer;
  if(!C)show('The variable terms cancel:',`${B}=${D}`);
  steps.push(`<li>${tex(`${B}=${D}`)} is ${B===D?'true for every x, so every real number works.':'false for every x, so there is no solution.'}</li>`);
 }else{
  if(B!==0)show(`${B<0?'Add':'Subtract'} ${Math.abs(B)} ${B<0?'to':'from'} both sides:`,`${lin(coefficient,0)}=${numerator}`);
  answer=String(s);answerTex=tex(`x=${ratio(numerator,coefficient)}`);
  if(coefficient!==1)show(`Divide both sides by ${coefficient}:`,`x=${ratio(numerator,coefficient)}`);
  else if(B===0&&C===0&&!pre&&scale===1)show('The variable is already isolated:',`x=${s}`);
 }
 return {id:`u2-equation-${v}-${left}=${right}`,variant:v,kind:'equation',q:`Solve ${tex(`${left}=${right}`)}.`,answer,answerTex,hint,explain:`<ol>${steps.join('')}</ol>`,math:{A,B,C,D,scale,solution:coefficient===0?null:s},variables:['x']};
}
const reverseIneq={'<':'>','≤':'≥','>':'<','≥':'≤'};
function inequalitySteps(A,B,C,D,op,initial=''){
 const out=[];const step=(action,math)=>out.push(`<li>${action} ${tex(math)}</li>`);
 if(initial)out.push(`<li>${initial}</li>`);
 if(C)step(`Move the ${tex(poly([[C,'x']]))} term to the left:`,`${lin(A-C,B)} ${op} ${D}`);
 const rhs=D-B,coefficient=A-C;
 if(B)step(`${B<0?'Add':'Subtract'} ${Math.abs(B)} ${B<0?'to':'from'} both sides:`,`${lin(coefficient,0)} ${op} ${rhs}`);
 const final=coefficient<0?reverseIneq[op]:op;
 step(`Divide by ${coefficient}${coefficient<0?' and reverse the inequality sign':''}:`,`x ${final} ${ratio(rhs,coefficient)}`);
 return `<ol>${out.join('')}</ol>`;
}
function inequality(){
 const v=pick(['basic','negative_flip','distribution','both_sides','compound','creation']),op=pick(['<','≤','>','≥']),s=ri(-8,9);
 if(v==='negative_flip'){
  const a=pick([2,3,4,5]),b=coeff(),rhs=-a*s+b,sign=reverseIneq[op],corr=`x ${sign} ${s}`;
  const left=R()<.35?`${b} - ${a}x`:lin(-a,b);
  return algebraChoice(`u2-ineq-flip-${a}-${b}-${rhs}-${op}-${left}`,v,`Solve ${tex(`${left} ${op} ${rhs}`)}.`,tex(corr),[tex(`x ${op} ${s}`),tex(`x ${sign} ${s+1}`),tex(`x ${sign} ${s-1}`)],inequalitySteps(-a,b,0,rhs,op));
 }
 if(v==='compound'){
  const a=pick([2,3,4]),l=ri(-6,-1),u=ri(1,7),b=coeff(),L=a*l+b,U=a*u+b,corr=`${l} < x ≤ ${u}`;
  return algebraChoice(`u2-ineq-comp-${a}-${b}-${l}-${u}`,v,`Solve ${tex(`${L} < ${a}x ${b>=0?'+':''}${b} ≤ ${U}`)}.`,tex(corr),[tex(`${l} ≤ x < ${u}`),`${tex(`x < ${l}`)} or ${tex(`x ≥ ${u}`)}`,tex(`${l-1} < x ≤ ${u+1}`)],`<ol><li>Subtract ${b} from all three parts: ${tex(`${a*l} < ${a}x ≤ ${a*u}`)}.</li><li>Divide each part by ${a}: ${tex(corr)}.</li></ol>`);
 }
 if(v==='both_sides'){
  let a=ri(2,7),c=ri(1,6);if(a===c)c++;const b=coeff(),d=b+(a-c)*s,diff=a-c,sign=diff>0?op:reverseIneq[op],corr=`x ${sign} ${s}`;
  return algebraChoice(`u2-ineq-both-${a}-${b}-${c}-${d}-${op}`,v,`Solve ${tex(`${lin(a,b)} ${op} ${lin(c,d)}`)}.`,tex(corr),[tex(`x ${reverseIneq[sign]} ${s}`),tex(`x ${sign} ${s+1}`),tex(`x ${sign} ${s-1}`)],inequalitySteps(a,b,c,d,op));
 }
 if(v==='distribution'){
  const k=pick([2,3,4,-2,-3,-4]),p=coeff(),rhs=k*(s+p),sign=k>0?op:reverseIneq[op],corr=`x ${sign} ${s}`;
  return algebraChoice(`u2-ineq-dist-${k}-${p}-${rhs}-${op}`,v,`Solve ${tex(`${k}(x ${p>=0?'+':''}${p}) ${op} ${rhs}`)}.`,tex(corr),[tex(`x ${reverseIneq[sign]} ${s}`),tex(`x ${sign} ${s+1}`),tex(`x ${sign} ${s-1}`)],inequalitySteps(k,k*p,0,rhs,op,`Distribute ${k}: ${tex(`${lin(k,k*p)} ${op} ${rhs}`)}.`));
 }
 if(v==='creation'){
  const a=ri(2,7),b=coeff(),boundary=ri(-8,8),rhs=-a*boundary+b,relation=pick(['<','≤','>','≥']),flipped=reverseIneq[relation],raw=`${lin(-a,b)} ${relation} ${rhs}`;
  const first=algebraChoice(`u2-ineq-create-${a}-${b}-${boundary}-${relation}`,v,'Part 1: Which inequality requires reversing the sign when dividing to isolate x?',tex(raw),[tex(`${lin(a,b)} ${relation} ${rhs}`),tex(`${lin(a+1,b)} ${relation} ${rhs}`),tex(`${lin(a+2,b)} ${relation} ${rhs}`)],`The x-coefficient is negative in ${tex(raw)}. Dividing by ${-a} reverses the sign.`);
  first.part2=algebraChoice(first.id+'-solve','creation_solve',`Part 2: Solve ${tex(raw)}.`,tex(`x ${flipped} ${boundary}`),[tex(`x ${relation} ${boundary}`),tex(`x ${flipped} ${boundary+1}`),tex(`x ${flipped} ${boundary-1}`)],inequalitySteps(-a,b,0,rhs,relation));
  return first;
 }
 const a=pick([2,3,4,5]),b=coeff(),rhs=a*s+b,corr=`x ${op} ${s}`;
 return algebraChoice(`u2-ineq-basic-${a}-${b}-${rhs}-${op}`,v,`Solve ${tex(`${lin(a,b)} ${op} ${rhs}`)}.`,tex(corr),[tex(`x ${reverseIneq[op]} ${s}`),tex(`x ${op} ${s-1}`),tex(`x ${op} ${s+1}`)],inequalitySteps(a,b,0,rhs,op));
}
function intervalExplanation(b,op){
 op=op.replace('≤','<=').replace('≥','>=');
 const left=op[0]==='<',closed=op.includes('='),answer=interval(b,op),direction=left?'less than':'greater than';
 return `The solution contains all numbers ${direction} ${b}${closed?', including '+b:''}. On a number line, shade ${left?'left':'right'} toward ${left?'negative':'positive'} infinity. Infinity always gets a parenthesis; ${b} gets a ${closed?'bracket because equality is allowed':'parenthesis because equality is excluded'}. The interval is ${tex(answer.replace(/∞/g,'\\infty'))}.`;
}
function solveInterval(){
 const style=pick(['linear','both_sides','distribution','combine','constant_first']),op=pick(['<','≤','>','≥']),s=ri(-8,8);
 let A=ri(2,6),B=coeff(),C=0,D=0,left='',right='',initial='';
 if(style==='linear')left=lin(A,B);
 else if(style==='constant_first'){A=-ri(2,6);left=`${B} - ${-A}x`;}
 else if(style==='both_sides'){C=ri(2,6);if(A===C)A++;left=lin(A,B);}
 else if(style==='distribution'){const k=pick([-4,-3,-2,2,3,4]),a=ri(2,5),b=coeff();A=k*a;B=k*b;C=pick([0,2,3,-2,-3].filter(n=>n!==A));left=`${k}(${lin(a,b)})`;initial=`Distribute first: ${tex(`${lin(A,B)} ${op} ${lin(C,B+(A-C)*s)}`)}.`;}
 else{const a=ri(2,5),c=ri(2,5),b=coeff(),d=coeff();A=a+c;B=b+d;C=pick([0,2,3,-2,-3].filter(n=>n!==A));left=`${lin(a,b)}+${lin(c,d)}`;initial=`Combine like terms on the left: ${tex(`${lin(A,B)} ${op} ${lin(C,B+(A-C)*s)}`)}.`;}
 D=B+(A-C)*s;right=lin(C,D);
 const resultOp=A-C<0?reverseIneq[op]:op,ans=interval(s,resultOp.replace('≤','<=').replace('≥','>=')),answerTex=tex(ans.replace(/∞/g,'\\infty'));
 return {id:`u2-int-solve-${style}-${left}-${op}-${right}`,variant:'solve_then_interval',kind:'interval',q:`Solve ${tex(`${left} ${op} ${right}`)} and enter the answer in interval notation.`,answer:ans,answerTex,explain:`${inequalitySteps(A,B,C,D,op,initial)}${intervalExplanation(s,resultOp)}`};
}
function graphIntervalRaw(){
 if(R()<.65)return solveInterval();
 const v=pick(['ineq_to_interval','interval_result','interval_to_ineq','ineq_to_graph','graph_to_interval','union']),b=ri(-8,8),op=pick(['<','<=','>','>=']);
 if(v==='interval_result'){const op2=pick(['<','<=','>','>=']);return algebraChoice(`u2-ineq-int-${b}-${op2}`,v,`Which interval represents ${tex(inequalityText(b,op2))}?`,interval(b,op2),[interval(b,op2[0]==='<'?'>':'<'),interval(b,op2.includes('=')?op2[0]:op2+'='),`[${b}, ${b}]`],intervalExplanation(b,op2))}
 if(v==='ineq_to_interval')return mc(`u2-int-i2n-${b}-${op}`,v,`Write ${tex(inequalityText(b,op))} in interval notation.`,interval(b,op),[interval(b,op[0]==='<'?'>':'<'),interval(b,op.includes('=')?op[0]:op+'='),`(${b}, ${b})`],intervalExplanation(b,op));
 if(v==='interval_to_ineq')return mc(`u2-int-n2i-${b}-${op}`,v,`Which inequality matches the interval ${tex(interval(b,op))}?`,tex(inequalityText(b,op)),[tex(inequalityText(b,op[0]==='<'?'>':'<')),tex(inequalityText(b,op.includes('=')?op[0]:op+'=')),tex(`x = ${b}`)],`The interval extends ${op[0]==='<'?'left toward negative':'right toward positive'} infinity and ${op.includes('=')?'includes':'excludes'} ${b}. Therefore ${tex(inequalityText(b,op))}.`);
 if(v==='ineq_to_graph')return mc(`u2-int-i2g-${b}-${op}`,v,`Which number-line description represents ${tex(inequalityText(b,op))}?`,graphDesc(b,op),[graphDesc(b,op[0]==='<'?'>':'<'),graphDesc(b,op.includes('=')?op[0]:op+'='),`${op.includes('=')?'open':'closed'} circle at ${b}; shade ${op[0]==='<'?'right':'left'}`],`At ${b}, draw ${op.includes('=')?'a closed circle because equality is included':'an open circle because equality is excluded'}; shade ${op[0]==='<'?'left for smaller':'right for larger'} numbers.`);
 if(v==='graph_to_interval')return mc(`u2-int-g2n-${b}-${op}`,v,`A number line has an ${op.includes('=')?'closed':'open'} circle at ${b} and is shaded ${op[0]==='<'?'left':'right'}. Which interval is represented?`,interval(b,op),[interval(b,op[0]==='<'?'>':'<'),interval(b,op.includes('=')?op[0]:op+'='),`[${b}, ${b}]`],intervalExplanation(b,op));
 const a=ri(-8,-1),c=ri(1,8),leftClosed=R()<.5,rightClosed=R()<.5,ans=`${leftClosed?'(-∞, '+a+']':'(-∞, '+a+')'} ∪ ${rightClosed?'['+c+', ∞)':'('+c+', ∞)'}`,prompt=`x ${leftClosed?'≤':'<'} ${a} or x ${rightClosed?'≥':'>'} ${c}`;
 return mc(`u2-int-union-${a}-${c}-${leftClosed?1:0}-${rightClosed?1:0}`,v,`Write ${tex(prompt.split(' or ')[0])} or ${tex(prompt.split(' or ')[1])} in interval notation.`,ans,[`(${a}, ${c})`,`[${a}, ${c}]`,`(-∞, ${c}) ∪ (${a}, ∞)`],`The first inequality covers numbers left of ${a}, and the second covers numbers right of ${c}. The gap between them is excluded, so join ${tex(interval(a,leftClosed?'<=':'<').replace(/∞/g,'\\infty'))} and ${tex(interval(c,rightClosed?'>=':'>').replace(/∞/g,'\\infty'))} with a union.`);
}
function graphInterval(){
 const p=graphIntervalRaw();
 if(p.kind==='interval')return p;
 p.choices=p.choices.map(choice=>/^[[(]/.test(choice)?tex(choice.replace(/∞/g,'\\infty').replace(/∪/g,'\\cup')):choice);
 p.answer=p.choices[p.correctIndex];return p;
}
function coordinateFeatures(options='mixed'){
 const modes=['plot_point','domain','range','increasing','decreasing','constant','x_intercepts','y_intercept','absolute_max','absolute_min'];
 const requested=typeof options==='string'?options:options?.mode;
 const v=modes.includes(requested)&&requested!=='mixed'?requested:pick(modes);
 const point=([x,y])=>tex(`(${x}, ${y})`),pointsText=pts=>pts.map(point).join(' and ');
 if(v==='plot_point'){
  const dot=[ri(-5,5),ri(-4,4)];
  const p=algebraChoice(`u2-coord-point-${dot}`,v,`${svgGraph([],dot)}<p>What are the coordinates of the plotted point?</p>`,point(dot),[point([dot[0]+1,dot[1]]),point([dot[0],dot[1]+1]),point([dot[0]-1,dot[1]-1])],`Read the horizontal coordinate first and the vertical coordinate second: ${point(dot)}.`);
  p.graph={dot};return p;
 }
 const left=ri(-5,-2),right=ri(2,5),count=ri(4,Math.min(7,right-left+1));
 const middle=shuffle(Array.from({length:right-left-1},(_,i)=>left+i+1).filter(x=>x!==0)).slice(0,count-3);
 const xs=[left,...middle,0,right].sort((a,b)=>a-b);
 const shape=pick(['rising','falling','peak','valley','zigzag','plateaus']);
 let ys=xs.map(()=>ri(-4,4));
 if(shape==='rising'||shape==='falling')ys=shuffle([-4,-3,-2,-1,0,1,2,3,4]).slice(0,count).sort((a,b)=>shape==='rising'?a-b:b-a);
 else if(shape==='peak'||shape==='valley'){
  const turn=ri(1,count-2),height=ri(2,4),slope=ri(1,2);
  ys=xs.map((_,i)=>Math.max(-4,height-Math.abs(i-turn)*slope)*(shape==='peak'?1:-1));
 }else if(shape==='plateaus'){const j=ri(1,count-1);ys[j]=ys[j-1];}
 if(v==='constant'){const j=ri(1,count-1);ys[j]=ys[j-1];}
 if(v==='increasing'&&!ys.some((y,i)=>i&&y>ys[i-1])){ys[0]=-4;ys[1]=ri(-2,3);}
 if(v==='decreasing'&&!ys.some((y,i)=>i&&y<ys[i-1])){ys[0]=4;ys[1]=ri(-3,2);}
 if(v==='x_intercepts'){
  // Keep intercepts on marked integer coordinates, without a flat segment on the axis.
  for(let i=1;i<ys.length;i++){
   if(ys[i-1]===0&&ys[i]===0)ys[i]=pick([-3,-2,-1,1,2,3]);
   if(ys[i-1]*ys[i]<0)ys[i]=0;
  }
  if(!ys.includes(0))ys[ri(1,count-2)]=0;
 }
 let leftEnd=pick(['closed','open','infinite']),rightEnd=pick(['closed','open','infinite']);
 let leftInfinity=leftEnd==='infinite'?pick([-1,1]):0,rightInfinity=rightEnd==='infinite'?pick([-1,1]):0;
 if(v==='x_intercepts'){
  const zeroIndex=ri(1,count-2),side=pick([-1,1]);
  ys=ys.map((_,i)=>i===zeroIndex?0:side*ri(1,4));
  if(leftEnd==='infinite')leftInfinity=side;if(rightEnd==='infinite')rightInfinity=side;
 }
 const pts=xs.map((x,i)=>[x,ys[i]]),ends={leftEnd,rightEnd,leftInfinity,rightInfinity},g=svgGraph(pts,null,ends),lo=Math.min(...ys),hi=Math.max(...ys);
 const leftUnbounded=leftEnd==='infinite',rightUnbounded=rightEnd==='infinite';
 const lowUnbounded=leftInfinity<0||rightInfinity<0,highUnbounded=leftInfinity>0||rightInfinity>0;
 const included=(i)=>i>0&&i<ys.length-1||i===0&&leftEnd!=='open'||i===ys.length-1&&rightEnd!=='open';
 const attained=value=>ys.some((y,i)=>y===value&&included(i))||ys.some((y,i)=>i&&y===value&&ys[i-1]===value);
 const loAttained=attained(lo),hiAttained=attained(hi);
 const fmtBound=x=>Number.isFinite(x)?String(x):x<0?'-\\infty':'\\infty';
 const intervalText=(a,b,leftClosed=false,rightClosed=false)=>`${leftClosed?'[':'('}${fmtBound(a)}, ${fmtBound(b)}${rightClosed?']':')'}`;
 const domain=intervalText(leftUnbounded?-Infinity:left,rightUnbounded?Infinity:right,!leftUnbounded&&leftEnd==='closed',!rightUnbounded&&rightEnd==='closed');
 const range=intervalText(lowUnbounded?-Infinity:lo,highUnbounded?Infinity:hi,!lowUnbounded&&loAttained,!highUnbounded&&hiAttained);
 const uniqueChoices=(correct,candidates)=>{const out=[];for(const value of [correct,...candidates])if(!out.includes(value))out.push(value);let k=1;while(out.length<4){const fallback=tex(`[${left-k}, ${right+k}]`);if(!out.includes(fallback))out.push(fallback);k++;}return out.slice(1,4)};
 const runs=direction=>{
  const segments=[];
  if(leftUnbounded)segments.push([-Infinity,left,-leftInfinity]);
  for(let i=0;i<pts.length-1;i++)segments.push([xs[i],xs[i+1],Math.sign(ys[i+1]-ys[i])]);
  if(rightUnbounded)segments.push([right,Infinity,rightInfinity]);
  const out=[];for(const [a,b,d] of segments)if(d===direction){if(out.length&&out.at(-1)[1]===a)out.at(-1)[1]=b;else out.push([a,b]);}return out;
 };
 const rangeText=list=>list.map(([a,b])=>tex(intervalText(a,b,Number.isFinite(a),Number.isFinite(b)))).join(' and ');
 const id=`u2-coord-${v}-${JSON.stringify({pts,ends})}`;let p;
 if(v==='domain'){
  const correct=tex(domain),alts=[tex(intervalText(left,right)),tex(intervalText(left,right,true,true)),tex(intervalText(left-1,right+1))];
  p=algebraChoice(id,v,`${g}<p>What is the domain of the graphed function?</p>`,correct,uniqueChoices(correct,alts),`Read the x-values covered by the graph. An arrow means the graph continues without bound; an open circle excludes an endpoint, and a filled circle includes it. Therefore the domain is ${correct}.`);
 }else if(v==='range'){
  const correct=tex(range),alts=[tex(intervalText(lo,hi)),tex(intervalText(lo,hi,true,true)),tex(intervalText(lo-1,hi+1))];
  const unboundedDirection=lowUnbounded&&highUnbounded?'both negative and positive infinity':lowUnbounded?'negative infinity':highUnbounded?'positive infinity':'finite boundary values';
  p=algebraChoice(id,v,`${g}<p>What is the range of the graphed function?</p>`,correct,uniqueChoices(correct,alts),`Read the y-values reached by the graph. Follow any arrows to determine whether the outputs continue toward ${unboundedDirection}, and use brackets only for finite boundary values the graph actually reaches. The range is ${correct}.`);
 }
 else if(['increasing','decreasing','constant'].includes(v)){
  const direction={increasing:1,decreasing:-1,constant:0}[v],intervals=runs(direction),answer=rangeText(intervals);
  const shifted=(x,d)=>Number.isFinite(x)?x+d:x,candidates=[...[-1,1,2].map(shift=>rangeText(intervals.map(([a,b])=>[shifted(a,shift),shifted(b,shift)]))),rangeText([[left,right]]),rangeText([[-Infinity,left]]),rangeText([[right,Infinity]])];
  p=algebraChoice(id,v,`${g}<p>On which interval${intervals.length===1?'':'s'} is the function ${v}?</p>`,answer,uniqueChoices(answer,candidates),`Read from left to right. The graph ${v==='increasing'?'rises':v==='decreasing'?'falls':'stays horizontal'} on ${answer}. Use the x-coordinates where each such section starts and ends; the finite endpoints are shown with brackets.`);
  p.correctIntervals=intervals;
 }else if(v==='x_intercepts'){
  const intercepts=pts.filter(([,y])=>y===0),answer=pointsText(intercepts);
  p=algebraChoice(id,v,`${g}<p>Which list gives all x-intercepts?</p>`,answer,[-1,1,2].map(d=>pointsText(intercepts.map(([x])=>[x+d,0]))),`An x-intercept has ${tex('y=0')}. Read every place the graph meets the horizontal axis: ${answer}.`);
 }else if(v==='y_intercept'){
  const y=ys[xs.indexOf(0)];p=algebraChoice(id,v,`${g}<p>What is the y-intercept?</p>`,point([0,y]),[point([0,y+1]),point([0,y-1]),point([0,y+2])],`At the vertical axis, ${tex('x=0')}. The graph passes through ${point([0,y])}, so that is the y-intercept.`);
 }else{
  const isMax=v==='absolute_max',value=isMax?hi:lo,exists=isMax?!highUnbounded&&hiAttained:!lowUnbounded&&loAttained,word=isMax?'maximum':'minimum';
  const correct=exists?tex(String(value)):'Does not exist',candidates=exists?['Does not exist',tex(String(value-1)),tex(String(value+1))]:[tex(String(value)),tex(String(isMax?lo:hi)),tex(String(value+(isMax?1:-1)))];
  p=algebraChoice(id,v,`${g}<p>What is the absolute ${word} value?</p>`,correct,uniqueChoices(correct,candidates),exists?`The graph reaches ${tex(String(value))}, and no output is ${isMax?'greater':'less'}. Therefore the absolute ${word} value is ${tex(String(value))}.`:`The graph has no absolute ${word}: ${isMax&&highUnbounded||!isMax&&lowUnbounded?'an arrow shows that the outputs are unbounded in that direction':'the only point at the boundary is open, so that value is not attained'}.`);
 }
 p.graph={points:pts,shape,...ends,domain,range,...(p.correctIntervals?{correctIntervalGraph:svgGraph(pts,null,ends,p.correctIntervals)}:{})};return p;
}

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
