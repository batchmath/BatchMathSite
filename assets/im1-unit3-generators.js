(function(global){
'use strict';

const random=()=>global.BatchMathRNG?.random?.() ?? 0.5;
const ri=(a,b)=>Math.floor(random()*(b-a+1))+a;
const pick=a=>a[Math.floor(random()*a.length)];
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a||1;};
const tex=s=>`\\(${s}\\)`;
const num=n=>n<0?`-${Math.abs(n)}`:String(n);
const signed=n=>n<0?`- ${Math.abs(n)}`:`+ ${n}`;
const par=n=>n<0?`(${n})`:String(n);
function ratio(n,d=1){if(d<0){n=-n;d=-d;}const g=gcd(n,d);n/=g;d/=g;return{plain:d===1?String(n):`${n}/${d}`,tex:d===1?String(n):`${n<0?'-':''}\\frac{${Math.abs(n)}}{${d}}`,n,d};}
function rawFraction(n,d){if(d<0){n=-n;d=-d;}return `${n<0?'-':''}\\frac{${Math.abs(n)}}{${d}}`;}
function linear(m,b,v='x'){
 const first=m===1?v:m===-1?`-${v}`:`${m}${v}`;
 return b===0?first:`${first} ${signed(b)}`;
}
function slopeTerm(m,v='x'){return m.n===m.d?v:m.n===-m.d?`-${v}`:`${m.tex}${v}`;}
function subtractTerm(v,n){return n===0?v:n>0?`${v}-${n}`:`${v}+${Math.abs(n)}`;}
function pointSlope(m,x,y){
 const inside=subtractTerm('x',x);
 if(m.n===m.d)return `${subtractTerm('y',y)}=${inside}`;
 const factor=m.n===-m.d?'-':m.tex,xFactor=x===0?'x':`(${inside})`;
 return `${subtractTerm('y',y)}=${factor}${xFactor}`;
}
function affineExpression(m,b,v='x'){
 const variable=slopeTerm(m,v),constant=b.n===0?'':b.n<0?` - ${ratio(Math.abs(b.n),b.d).tex}`:` + ${b.tex}`;
 return `${variable}${constant}`;
}
function slopeInterceptEquation(m,b,label='y'){
 return `${label}=${affineExpression(m,b)}`;
}
function explicit(a,d){return `a_n=${a}${d===0?'':` ${signed(d)}(n-1)`}`;}
function recursive(a,d){return `a_1=${a},\\quad a_n=a_{n-1}${d===0?'':` ${signed(d)}`}`;}
function sequence(values){return values.map(num).join(', ')+', \\ldots';}
function steps(...items){return `<div class="bm-u3-worked-steps">${items.map((item,index)=>`<p><strong>Step ${index+1}:</strong> ${item}</p>`).join('')}</div>`;}
function mc(id,variant,q,correct,distractors,explain){
 const unique=[];for(const choice of [correct,...distractors])if(choice!=null&&!unique.includes(String(choice)))unique.push(String(choice));
 const fallback=['Not enough information','None of these','The values are not related','The relationship is not linear'];
 for(const choice of fallback){if(unique.length>=4)break;if(!unique.includes(choice)&&choice!==String(correct))unique.push(choice);}
 const choices=shuffle(unique.slice(0,4));
 return{id,variant,kind:'mc',q,choices,correctIndex:choices.indexOf(String(correct)),answerText:String(correct),explain};
}
function yesNo(id,variant,q,correct,explain){
 const answer=correct?'Yes':'No',choices=shuffle(['Yes','No']);
 return{id,variant,kind:'mc',q,choices,correctIndex:choices.indexOf(answer),answerText:answer,explain};
}
function input(id,variant,q,answer,answerTex,explain,inputKind='fraction'){
 return{id,variant,kind:'input',q,answer:String(answer),answerText:answerTex||tex(String(answer)),explain,inputKind};
}
function formulaInput(id,variant,q,a,d,explain){
 return{id,variant,kind:'formula',q,formula:{a,d},answerText:tex(explicit(a,d)),explain,inputKind:'formula'};
}
function multiInput(id,variant,q,fields,answerText,explain,meta={}){
 return{id,variant,kind:'multi',q,fields,answerText,explain,...meta};
}
function lineInput(id,variant,q,line,answerTex,explain,label='Equation'){
 return multiInput(id,variant,q,[{id:'equation',label,check:'line',line,answerText:answerTex,inputKind:'equation'}],answerTex,explain);
}
function arithmeticIdentification(){
 const arithmetic=random()<.58,a=ri(-30,35),d=pick([-12,-9,-7,-5,-3,0,2,4,6,8,11]);let values,diffs;
 if(arithmetic){values=Array.from({length:5},(_,i)=>a+i*d);diffs=[d,d,d,d];}
 else if(random()<.5){const step=pick([1,2,3]),first=pick([-8,-5,-3,2,4,7]);diffs=[first,first+step,first+2*step,first+3*step];values=[a];for(const change of diffs)values.push(values.at(-1)+change);}
 else{const r=pick([-3,-2,2,3]),start=pick([-4,-3,-2,2,3,4]);values=Array.from({length:5},(_,i)=>start*r**i);diffs=values.slice(1).map((x,i)=>x-values[i]);}
 const differenceWork=diffs.map((difference,index)=>tex(`${values[index+1]}-${par(values[index])}=${difference}`)).join(', ');
 const explanation=steps('Subtract each term from the term after it.',differenceWork,arithmetic?`Every difference is ${d}, so the sequence is arithmetic and ${tex(`d=${d}`)}.`:'The differences are not all equal, so the sequence is not arithmetic.');
 return{
  id:`u3-01a-${values.join('_')}`,
  variant:'identify',
  kind:'arithmetic-identification',
  q:`Is ${tex(sequence(values))} an arithmetic sequence?`,
  choices:['Yes','No'],
  correctIndex:arithmetic?0:1,
  arithmetic,
  difference:d,
  differencePrompt:'Enter the common difference.',
  decisionFeedback:arithmetic?'Yes. The sequence is arithmetic. Now enter its common difference.':'No. The differences are not all equal, so the sequence is not arithmetic.',
  answerText:arithmetic?`Yes; ${tex(`d=${d}`)}`:'No',
  explain:explanation
 };
}
function commonDifferenceNext(){
 const a=ri(-50,70),d=pick([-13,-11,-8,-6,-4,-3,2,5,7,9,12]),shown=Array.from({length:4},(_,i)=>a+i*d),next=[4,5,6].map(i=>a+i*d);
 const fields=[
  {id:'difference',label:'Common difference',answer:String(d),answerText:tex(`d=${d}`),check:'number',inputKind:'integer'},
  ...next.map((value,index)=>({id:`next-${index+1}`,label:`Next term ${index+1}`,answer:String(value),answerText:tex(String(value)),check:'number',inputKind:'integer'}))
 ];
 const explanation=steps(`Find the common difference: ${tex(`${shown[1]}-${par(shown[0])}=${d}`)}.`,`Apply that change to the last shown term: ${tex(`${shown.at(-1)} ${signed(d)}=${next[0]}`)}.`,`Keep applying the same change: ${tex(`${next[0]} ${signed(d)}=${next[1]}`)} and ${tex(`${next[1]} ${signed(d)}=${next[2]}`)}.`);
 return multiInput(`u3-01b-${a}-${d}`,'next_terms',`Find the common difference and the next three terms of ${tex(sequence(shown))}.`,fields,`${tex(`d=${d}`)}; next terms: ${next.map(num).join(', ')}`,explanation,{a,d,shown,next});
}
function explicitFormula(){
 const a=ri(-25,45),d=pick([-12,-9,-7,-5,-3,0,2,4,6,8,11]),fromValues=random()<.48;
 const prompt=fromValues?`Write an explicit formula for ${tex(sequence(Array.from({length:4},(_,i)=>a+i*d)))}.`:`An arithmetic sequence has ${tex(`a_1=${a}`)} and ${tex(`d=${d}`)}. Write an explicit formula for ${tex('a_n')}.`;
 const formula=tex(explicit(a,d));
 const firstStep=fromValues?`The first term is ${tex(`a_1=${a}`)}, and ${tex(`${a+d}-${par(a)}=${d}`)}, so ${tex(`d=${d}`)}.`:`Use the given values ${tex(`a_1=${a}`)} and ${tex(`d=${d}`)}.`;
 return formulaInput(`u3-01c-${fromValues?1:0}-${a}-${d}`,fromValues?'from_sequence':'from_values',prompt,a,d,steps(firstStep,`Start with ${tex('a_n=a_1+d(n-1)')}.`,`Substitute ${tex(`a_1=${a}`)} and ${tex(`d=${d}`)}: ${formula}.`));
}
function specificTerm(){
 const a=ri(-30,55),d=pick([-11,-8,-6,-4,-3,-2,-1,1,2,3,4,5,7,9,12]),n=Math.abs(d)<4&&random()<.28?ri(26,50):ri(10,25),answer=a+(n-1)*d,showSequence=random()<.5;
 const given=showSequence?`the arithmetic sequence ${tex(sequence(Array.from({length:4},(_,i)=>a+i*d)))}`:`${tex(`a_1=${a}`)} and ${tex(`d=${d}`)}`;
 const firstStep=showSequence?`The first term is ${a}, and ${tex(`${a+d}-${par(a)}=${d}`)}, so ${tex(`a_1=${a}`)} and ${tex(`d=${d}`)}.`:`Use ${tex(`a_1=${a}`)} and ${tex(`d=${d}`)}.`;
 const work=tex(`a_{${n}}=${a}+${par(d)}(${n}-1)=${a}+${par(d)}(${n-1})=${answer}`);
 return Object.assign(input(`u3-01d-${a}-${d}-${n}`,'specific_term',`Find ${tex(`a_{${n}}`)} for ${given}.`,answer,tex(String(answer)),steps(firstStep,`Use ${tex('a_n=a_1+d(n-1)')}.`,`Substitute ${tex(`n=${n}`)} and simplify: ${work}.`),'integer'),{a,d,n,calculationSize:Math.abs((n-1)*d)});
}
function termNumber(){
 const a=ri(-25,80),d=pick([-11,-8,-6,-4,-3,2,5,7,9,12]),n=ri(8,32),target=a+(n-1)*d;
 const numerator=target-a,quotient=ratio(numerator,d);
 const explanation=steps(`The first term is ${tex(`a_1=${a}`)}, and the common difference is ${tex(`d=${d}`)}.`,`Set ${tex('a_n=a_1+d(n-1)')} equal to ${target}: ${tex(`${target}=${a}+${par(d)}(n-1)`)}.`,`Subtract ${a}: ${tex(`${numerator}=${d}(n-1)`)}. Divide by ${d}: ${tex(`n-1=${quotient.tex}`)}, so ${tex(`n=${n}`)}.`);
 return input(`u3-01e-${a}-${d}-${n}`,'term_number',`Which term of ${tex(sequence(Array.from({length:4},(_,i)=>a+i*d)))} is ${target}? Enter the term number.`,n,tex(String(n)),explanation,'integer');
}
const sequenceStories=[
 {key:'warehouse',subject:'A warehouse packs',unit:'boxes',count:'hour',a:[24,60],d:[3,5,7,9],n:[8,16],min:1,max:220},
 {key:'tiles',subject:'A tile design has',unit:'tiles',count:'row',a:[6,18],d:[2,3,4,5],n:[8,18],min:1,max:120},
 {key:'seats',subject:'A theater has',unit:'seats',count:'row',a:[16,30],d:[2,3,4],n:[10,25],min:1,max:125},
 {key:'parking',subject:'A parking garage has',unit:'parking spaces',count:'level',a:[130,220],d:[-12,-10,-8,-6,-5],n:[5,14],min:20,max:220},
 {key:'plant',subject:'A plant is',unit:'centimeters tall',count:'week',a:[8,24],d:[1,2,3,4],n:[8,18],min:1,max:100},
 {key:'problems',subject:'A student completes',unit:'practice problems',count:'day',a:[8,24],d:[1,2,3,4,5],n:[7,16],min:1,max:90},
 {key:'tank',subject:'A tank contains',unit:'gallons',count:'measurement',a:[300,650],d:[-30,-25,-20,-15,-10],n:[5,16],min:25,max:650},
 {key:'savings',subject:'A student deposits',unit:'dollars',count:'week',a:[20,60],d:[5,8,10,12,15],n:[6,16],min:1,max:250}
];
function sequenceWordProblem(){
 const story=pick(sequenceStories);let a,d,n,values;
 do{a=ri(story.a[0],story.a[1]);d=pick(story.d);n=ri(story.n[0],story.n[1]);values=Array.from({length:n},(_,i)=>a+i*d);}while(Math.min(...values)<story.min||Math.max(...values)>story.max);
 const answer=values[n-1],direction=d>0?'increases':'decreases';
 const q=`${story.subject} ${a} ${story.unit} at ${story.count} 1. The amount ${direction} by ${Math.abs(d)} ${story.unit} each ${story.count}. Write an explicit formula and find the number of ${story.unit} at ${story.count} ${n}.`;
 const formula=tex(explicit(a,d));
 const fields=[
  {id:'model',label:'Arithmetic-sequence model',check:'formula',formula:{a,d},answerText:formula,inputKind:'formula'},
  {id:'final',label:`Value at ${story.count} ${n}`,check:'number',answer:String(answer),answerText:tex(String(answer)),inputKind:'integer'}
 ];
 const explanation=steps(`The amount at ${story.count} 1 is ${a}, so ${tex(`a_1=${a}`)}. The common difference is ${tex(`d=${d}`)}.`,`Use ${tex('a_n=a_1+d(n-1)')}: ${formula}.`,`Evaluate the model at ${tex(`n=${n}`)}: ${tex(`a_{${n}}=${a} ${signed(d)}(${n}-1)=${a} ${signed(d*(n-1))}=${answer}`)} ${story.unit}.`);
 return multiInput(`u3-01f-${story.key}-${a}-${d}-${n}`,'model',q,fields,`${formula}; ${answer} ${story.unit}`,explanation,{storyKey:story.key,a,d,n,answer,allValues:values,validRange:[story.min,story.max],wholeRequired:true,unit:story.unit,countLabel:story.count});
}
function evaluateFunction(){
 const letter=pick(['f','g','h','p','q','r']),x=ri(-8,8),quadratic=random()<.28;
 if(quadratic){const a=pick([-3,-2,-1,1,2,3]),b=ri(-6,6),c=ri(-9,9),square=x*x,first=a*square,second=b*x,answer=first+second+c,lead=a===1?'x^2':a===-1?'-x^2':`${a}x^2`,middle=b===0?'':b>0?` + ${b===1?'':b}x`:` - ${b===-1?'':Math.abs(b)}x`,constant=c===0?'':c>0?` + ${c}`:` - ${Math.abs(c)}`,rule=`${lead}${middle}${constant}`,xValue=x<0?`(${x})`:String(x),firstSub=a===1?`${xValue}^2`:a===-1?`-${xValue}^2`:`${a}${xValue}^2`,secondSub=b===0?'':b>0?` + ${b===1?'':b}${xValue}`:` - ${b===-1?'':Math.abs(b)}${xValue}`,constantSub=c===0?'':` ${signed(c)}`,numericWork=`${first}${second===0?'':` ${signed(second)}`}${c===0?'':` ${signed(c)}`}=${answer}`,explanation=steps(`Replace every ${tex('x')} with ${x}: ${tex(`${letter}(${x})=${firstSub}${secondSub}${constantSub}`)}.`,`Compute the power and products, then combine: ${tex(numericWork)}.`);return input(`u3-02a-q-${a}-${b}-${c}-${x}`,'quadratic',`If ${tex(`${letter}(x)=${rule}`)}, find ${tex(`${letter}(${x})`)}.`,answer,tex(String(answer)),explanation,'integer');}
 const m=pick([-8,-6,-5,-3,-2,2,3,4,6,7,9]),b=ri(-15,15),answer=m*x+b;
 const substitution=`${letter}(${x})=${m}(${x<0?`(${x})`:x})${b===0?'':` ${signed(b)}`}`,calculation=b===0?`${m*x}=${answer}`:`${m*x} ${signed(b)}=${answer}`;
 return input(`u3-02a-l-${m}-${b}-${x}`,'linear',`If ${tex(`${letter}(x)=${linear(m,b)}`)}, find ${tex(`${letter}(${x})`)}.`,answer,tex(String(answer)),steps(`Replace ${tex('x')} with ${x}: ${tex(substitution)}.`,`Multiply, then combine with the constant: ${tex(calculation)}.`),'integer');
}
function solveFunctionEquation(){
 const letter=pick(['f','g','h','p','q','w']),m=pick([-8,-6,-5,-4,-3,-2,2,3,4,5,6,7,8]),b=ri(-16,16),whole=random()<.72,q=whole?1:pick([2,3,4,5]),p=whole?ri(-9,9):pick(Array.from({length:71},(_,i)=>i-35).filter(n=>n%q!==0));
 const targetRatio=ratio(m*p+b*q,q),answer=ratio(p,q),afterConstant=ratio(targetRatio.n-b*targetRatio.d,targetRatio.d);
 const undo=b>0?`Subtract ${b} from both sides.`:b<0?`Add ${Math.abs(b)} to both sides.`:'There is no constant term to undo.';
 const explanation=steps(`Set the function rule equal to the requested output: ${tex(`${linear(m,b)}=${targetRatio.tex}`)}.`,`${undo} This gives ${tex(`${m}x=${afterConstant.tex}`)}.`,`Divide both sides by ${m}: ${tex(`x=${answer.tex}`)}.`);
 return input(`u3-02b-${m}-${b}-${targetRatio.plain}`,'solve',`If ${tex(`${letter}(x)=${linear(m,b)}`)}, solve ${tex(`${letter}(x)=${targetRatio.tex}`)}.`,answer.plain,tex(answer.tex),explanation,'fraction');
}
function slopeFromPoints(){
 const dx=pick([1,2,3,4,5,6]),dy=pick([-9,-7,-5,-4,-3,-2,1,2,3,4,5,7,9]),x1=ri(-8,2),y1=ri(-8,8),x2=x1+dx,y2=y1+dy,s=ratio(dy,dx);
 const rawSlope=rawFraction(dy,dx),slopeCalculation=rawSlope===s.tex?tex(`m=${rawSlope}`):tex(`m=${rawSlope}=${s.tex}`);
 const explanation=steps(`Label the points ${tex(`(x_1,y_1)=(${x1},${y1})`)} and ${tex(`(x_2,y_2)=(${x2},${y2})`)}.`,`Find the vertical change: ${tex(`y_2-y_1=${y2}-${par(y1)}=${dy}`)}. Find the horizontal change: ${tex(`x_2-x_1=${x2}-${par(x1)}=${dx}`)}.`,`Use ${tex('m=\\frac{y_2-y_1}{x_2-x_1}')}: ${slopeCalculation}.`);
 return input(`u3-02c-${x1}-${y1}-${x2}-${y2}`,'two_points',`Find the slope through ${tex(`(${x1},${y1})`)} and ${tex(`(${x2},${y2})`)}.`,s.plain,tex(s.tex),explanation,'fraction');
}
function collinearity(){
 const dx=pick([1,2,3,4]),dy=pick([-6,-4,-3,-2,1,2,3,4,6]),x0=ri(-7,-1),y0=ri(-7,7),count=random()<.5?3:4,points=Array.from({length:count},(_,i)=>[x0+i*dx,y0+i*dy]),yes=random()<.55;
 if(!yes)points[pick([...Array(count-1).keys()].slice(1).concat(count-1))][1]+=pick([-3,-2,2,3]);
 const slopes=points.slice(1).map((p,i)=>ratio(p[1]-points[i][1],p[0]-points[i][0]));
 const pointText=points.map(p=>tex(`(${p[0]},${p[1]})`)).join(', ');
 const slopeWork=points.slice(1).map((point,index)=>{const dyValue=point[1]-points[index][1],dxValue=point[0]-points[index][0],raw=rawFraction(dyValue,dxValue);return tex(`m_${index+1}=\\frac{${point[1]}-${par(points[index][1])}}{${point[0]}-${par(points[index][0])}}=${raw}${raw===slopes[index].tex?'':`=${slopes[index].tex}`}`);}).join(', ');
 return yesNo(`u3-02d-${points.flat().join('_')}`,'collinearity',`Are these points collinear? ${pointText}`,yes,steps('Find the slope between each pair of consecutive points.',slopeWork,yes?'The slopes are equal, so every point lies on the same line. The answer is Yes.':'The slopes are not all equal, so the points do not all lie on one line. The answer is No.'));
}
function graphSvg(x1,y1,x2,y2){
 const W=480,H=360,s=32,ox=W/2,oy=H/2,X=x=>ox+x*s,Y=y=>oy-y*s;let grid='',ticks='';
 for(let i=-5;i<=5;i++)grid+=`<line class="bm-u3-grid-line" x1="${X(i)}" y1="${Y(-5)}" x2="${X(i)}" y2="${Y(5)}"/><line class="bm-u3-grid-line" x1="${X(-5)}" y1="${Y(i)}" x2="${X(5)}" y2="${Y(i)}"/>`;
 for(let i=-5;i<=5;i++){if(i){ticks+=`<line x1="${X(i)}" y1="${oy-4}" x2="${X(i)}" y2="${oy+4}" stroke="#777"/><text x="${X(i)}" y="${oy+20}" fill="#bbb" font-size="12" text-anchor="middle">${i}</text><line x1="${ox-4}" y1="${Y(i)}" x2="${ox+4}" y2="${Y(i)}" stroke="#777"/><text x="${ox-10}" y="${Y(i)+4}" fill="#bbb" font-size="12" text-anchor="end">${i}</text>`;}}
 const m=(y2-y1)/(x2-x1),leftY=y1+m*(-5.5-x1),rightY=y1+m*(5.5-x1);
 return `<div class="bm-u3-graph"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Coordinate graph of a line through two points"><g class="bm-u3-grid">${grid}</g><line x1="${X(-5.7)}" y1="${oy}" x2="${X(5.7)}" y2="${oy}" stroke="#bbb" stroke-width="1.5"/><line x1="${ox}" y1="${Y(-5.3)}" x2="${ox}" y2="${Y(5.3)}" stroke="#bbb" stroke-width="1.5"/>${ticks}<line x1="${X(-5.5)}" y1="${Y(leftY)}" x2="${X(5.5)}" y2="${Y(rightY)}" stroke="#d71920" stroke-width="3"/><circle class="bm-u3-highlight-point" cx="${X(x1)}" cy="${Y(y1)}" r="7" fill="#d71920" stroke="none"/><circle class="bm-u3-highlight-point" cx="${X(x2)}" cy="${Y(y2)}" r="7" fill="#d71920" stroke="none"/></svg></div>`;
}
function slopeFromGraph(){
 const dx=pick([1,2,3,4]),dy=pick([-4,-3,-2,-1,1,2,3,4]),x1=pick([-3,-2,-1]),x2=x1+dx,y1=ri(-3,3),y2=y1+dy;
 if(Math.abs(y2)>5)return slopeFromGraph();const s=ratio(dy,dx);
 const rawSlope=rawFraction(dy,dx),slopeCalculation=rawSlope===s.tex?tex(`m=${rawSlope}`):tex(`m=${rawSlope}=${s.tex}`);
 const explanation=steps(`Identify the two points: ${tex(`(x_1,y_1)=(${x1},${y1})`)} and ${tex(`(x_2,y_2)=(${x2},${y2})`)}.`,`Find the rise by comparing the y-coordinates: ${tex(`y_2-y_1=${y2}-${par(y1)}=${dy}`)}.`,`Find the run by comparing the x-coordinates: ${tex(`x_2-x_1=${x2}-${par(x1)}=${dx}`)}.`,`Use ${tex('m=\\frac{\\text{rise}}{\\text{run}}')}: ${slopeCalculation}.`);
 return input(`u3-02e-${x1}-${y1}-${x2}-${y2}`,'graph',`${graphSvg(x1,y1,x2,y2)}Find the slope of the graphed line.`,s.plain,tex(s.tex),explanation,'fraction');
}
function slopeIntercept(){
 const m=ratio(pick([-8,-6,-5,-4,-3,-2,1,2,3,4,5,6,8]),pick([1,1,1,2,3,4,5])),b=ri(-9,9),identify=random()<.5;
 const bRatio=ratio(b),equation=slopeInterceptEquation(m,bRatio),eq=tex(equation);
 if(identify){
  const fields=[
   {id:'slope',label:'Slope',check:'number',answer:m.plain,answerText:tex(m.tex),inputKind:'fraction'},
   {id:'intercept',label:'y-intercept y-value',check:'number',answer:String(b),answerText:tex(String(b)),inputKind:'integer'}
  ];
  const explanation=steps(`Compare ${eq} with ${tex('y=mx+b')}.`,`The coefficient of ${tex('x')} is the slope, so ${tex(`m=${m.tex}`)}.`,`The constant is ${tex(`b=${b}`)}, so the graph crosses the y-axis at ${tex(`(0,${b})`)}.`);
  return multiInput(`u3-03a-id-${m.plain}-${b}`,'identify',`Identify the slope and y-intercept of ${eq}. Enter the slope and the y-coordinate of the y-intercept.`,fields,`Slope ${tex(m.tex)}; y-intercept ${tex(`(0,${b})`)}`,explanation);
 }
 const explanation=steps(`Start with slope-intercept form ${tex('y=mx+b')}.`,`Substitute ${tex(`m=${m.tex}`)} and ${tex(`b=${b}`)}.`,`Write the simplified equation: ${eq}.`);
 return lineInput(`u3-03a-write-${m.plain}-${b}`,'write',`Write an equation in slope-intercept form with slope ${tex(m.tex)} and y-intercept ${tex(`(0,${b})`)}.`,{form:'slope-intercept',m:m.n/m.d,b,left:['y']},eq,explanation);
}
function lineEquations(){
 const family=pick(['slope_intercept_points','point_slope_given','point_slope_points']),m=ratio(pick([-6,-5,-4,-3,-2,1,2,3,4,5,6]),pick([1,1,2,3])),x1=pick([-6,-5,-4,-3,-2,-1,1,2,3,4,5,6]),y1=ri(-7,7);
 if(family==='slope_intercept_points'){
  const b=ri(-8,8),x2=pick([-6,-4,-3,2,3,4,6]),y2=m.n*x2/m.d+b;if(!Number.isInteger(y2))return lineEquations();
  const eq=tex(slopeInterceptEquation(m,ratio(b))),explanation=steps(`Find the slope: ${tex(`m=\\frac{${y2}-${par(b)}}{${x2}}=${m.tex}`)}.`,`The point ${tex(`(0,${b})`)} shows that the y-intercept is ${tex(`b=${b}`)}.`,`Substitute into ${tex('y=mx+b')}: ${eq}.`);
  return lineInput(`u3-03b-si-${m.plain}-${b}-${x2}`,family,`Write the line through ${tex(`(0,${b})`)} and ${tex(`(${x2},${y2})`)} in slope-intercept form.`,{form:'slope-intercept',m:m.n/m.d,b,left:['y']},eq,explanation);
 }
 const x2=x1+m.d,y2=y1+m.n,equation=pointSlope(m,x1,y1),correct=tex(equation);
 const prompt=family==='point_slope_given'?`Write the equation in point-slope form for the line with slope ${tex(m.tex)} through ${tex(`(${x1},${y1})`)}.`:`Write the equation in point-slope form for the line through ${tex(`(${x1},${y1})`)} and ${tex(`(${x2},${y2})`)}.`;
 const explanation=family==='point_slope_points'?steps(`Find the slope: ${tex(`m=\\frac{${y2}-${par(y1)}}{${x2}-${par(x1)}}=${m.tex}`)}.`,`Use ${tex('y-y_1=m(x-x_1)')} with ${tex(`(x_1,y_1)=(${x1},${y1})`)}.`,`Substitute the point and slope: ${correct}.`):steps(`Use ${tex('y-y_1=m(x-x_1)')}.`,`Substitute ${tex(`m=${m.tex}`)} and ${tex(`(x_1,y_1)=(${x1},${y1})`)}: ${correct}.`);
 const points=family==='point_slope_points'?[[x1,y1],[x2,y2]]:[[x1,y1]];
 return lineInput(`u3-03b-ps-${family}-${m.plain}-${x1}-${y1}`,family,prompt,{form:'point-slope',m:m.n/m.d,x1,y1,points},correct,explanation);
}
function convertPointSlope(){
 const m=ratio(pick([-6,-5,-4,-3,-2,1,2,3,4,5,6]),pick([1,1,2,3,4])),x1=ri(-8,8),y1=ri(-8,8),b=ratio(y1*m.d-m.n*x1,m.d);
 const original=tex(pointSlope(m,x1,y1)),answerEquation=slopeInterceptEquation(m,b),answer=tex(answerEquation),distributedConstant=ratio(-m.n*x1,m.d),distributed=tex(`${subtractTerm('y',y1)}=${affineExpression(m,distributedConstant)}`);
 const moveText=y1===0?'The left side is already isolated as y.':y1>0?`Add ${y1} to both sides to isolate y.`:`Subtract ${Math.abs(y1)} from both sides to isolate y.`;
 const explanation=steps(`Distribute the slope across the x-expression: ${distributed}.`,`${moveText} Combine the constants to get ${answer}.`);
 return lineInput(`u3-03c-${m.plain}-${x1}-${y1}`,'convert',`Convert ${original} to slope-intercept form.`,{form:'slope-intercept',m:m.n/m.d,b:b.n/b.d,left:['y']},answer,explanation);
}
const linearStories=[
 {subject:'A taxi ride',start:'starts with a fee of',rate:'per mile',input:'miles',output:'total cost',prefix:'$',decreasing:false,min:4,max:18,rates:[2,3,4,5,6,8],conclusion:(x,value)=>`the total cost of the taxi ride after ${x} miles is ${value}`},
 {subject:'A bicycle rental',start:'starts with a fee of',rate:'per hour',input:'hours',output:'total cost',prefix:'$',decreasing:false,min:8,max:35,rates:[3,4,5,6,8,10,12],conclusion:(x,value)=>`the cost to rent the bicycle for ${x} hours is ${value}`},
 {subject:'A phone battery',start:'begins at',rate:'percentage points per hour',input:'hours',output:'battery percentage',suffix:'%',decreasing:true,min:65,max:100,rates:[3,4,5,6,7,8],conclusion:(x,value)=>`the battery percentage after ${x} hours is ${value}`},
 {subject:'A water tank',start:'begins with',rate:'gallons per minute',input:'minutes',output:'water remaining',suffix:' gallons',decreasing:true,min:400,max:900,rates:[15,20,25,30,35],conclusion:(x,value)=>`the amount of water remaining after ${x} minutes is ${value}`},
 {subject:'A candle',start:'begins at',rate:'centimeters per hour',input:'hours',output:'candle height',suffix:' cm',decreasing:true,min:18,max:40,rates:[1,2,3],conclusion:(x,value)=>`the candle's height after ${x} hours is ${value}`},
 {subject:'A savings account',start:'starts with',rate:'per week',input:'weeks',output:'total saved',prefix:'$',decreasing:false,min:15,max:80,rates:[5,8,10,12,15,20],conclusion:(x,value)=>`the total amount saved after ${x} weeks is ${value}`}
];
function linearWordProblem(){
 const story=pick(linearStories),b=ri(story.min,story.max),rate=(story.decreasing?-1:1)*pick(story.rates),x=ri(4,12),value=b+rate*x,fn=tex(`f(x)=${linear(rate,b)}`);
 if(value<0)return linearWordProblem();
 const display=n=>`${story.prefix||''}${n}${story.suffix||''}`,q=`${story.subject} ${story.start} ${display(b)} and ${story.decreasing?'decreases':'increases'} by ${story.prefix||''}${Math.abs(rate)} ${story.rate}. Write a linear function for the ${story.output} after ${tex('x')} ${story.input}, then find it after ${x} ${story.input}.`;
 const fields=[
  {id:'model',label:'Linear equation/model',check:'line',line:{form:'slope-intercept',m:rate,b,left:['f(x)','y']},answerText:fn,inputKind:'equation'},
  {id:'amount',label:`Value after ${x} ${story.input}`,check:'number',answer:String(value),answerText:tex(String(value)),inputKind:'integer'}
 ];
 const evaluatedModel=`f(${x})=${rate===1?'':rate===-1?'-':rate}(${x})${b===0?'':` ${signed(b)}`}=${value}`;
 const explanation=steps(`The starting amount is ${b}, so ${tex(`b=${b}`)}. The rate is ${tex(`m=${rate}`)}.`,`Substitute into ${tex('f(x)=mx+b')}: ${fn}.`,`Evaluate the model at ${tex(`x=${x}`)}: ${tex(evaluatedModel)}. So ${story.conclusion(x,display(value))}.`);
 return multiInput(`u3-03d-${b}-${rate}-${x}-${story.input}`,'model',q,fields,`${fn}; ${display(value)}`,explanation,{rate,b,x,value,storyInput:story.input});
}
function recursiveFromSequences(){
 const a=ri(-30,55),d=pick([-13,-10,-8,-6,-4,-3,2,5,7,9,12,14]),family=pick(['write','terms','difference']);
 if(family==='write'){
  const values=Array.from({length:4},(_,i)=>a+i*d),correct=tex(recursive(a,d)),fields=[
   {id:'initial',label:'Initial value a₁',check:'number',answer:String(a),answerText:tex(String(a)),inputKind:'integer'},
   {id:'change',label:'Common difference after aₙ₋₁',check:'number',answer:String(d),answerText:tex(String(d)),inputKind:'integer'}
  ];
  const explanation=steps(`The first displayed term is ${a}, so ${tex(`a_1=${a}`)}.`,`Find the common difference: ${tex(`${values[1]}-${par(values[0])}=${d}`)}.`,`Use the previous term plus the common difference: ${correct}.`);
  return multiInput(`u3-04a-write-${a}-${d}`,family,`Write a recursive formula for ${tex(sequence(values))}. Enter the initial value and the common difference used after ${tex('a_{n-1}')}.`,fields,correct,explanation);
 }
 const count=family==='terms'?6:5,terms=Array.from({length:count},(_,i)=>a+i*d),formula=tex(recursive(a,d));
 const termFields=terms.map((value,index)=>({id:`term-${index+1}`,label:`Term ${index+1}`,check:'number',answer:String(value),answerText:tex(String(value)),inputKind:'integer'}));
 const fields=family==='difference'?[{id:'difference',label:'Common difference',check:'number',answer:String(d),answerText:tex(String(d)),inputKind:'integer'},...termFields]:termFields;
 const answerText=family==='terms'?tex(terms.map(num).join(', ')):`${tex(`d=${d}`)}; ${tex(terms.map(num).join(', '))}`;
 const calculations=terms.slice(1).map((value,index)=>tex(`${terms[index]} ${signed(d)}=${value}`)).join(', ');
 const explanation=steps(`Begin with ${tex(`a_1=${a}`)}. The recursive rule changes each term by ${tex(`d=${d}`)}.`,`${family==='difference'?`The common difference is ${d}. `:''}Apply that change repeatedly to get the requested terms: ${calculations}.`);
 return multiInput(`u3-04a-${family}-${a}-${d}`,family,`${family==='terms'?`Write the first ${count} terms`:'Find the common difference and write the first five terms'} for ${formula}.`,fields,answerText,explanation,{a,d,terms});
}
function recursiveToExplicit(){
 const a=ri(-25,50),d=pick([-12,-9,-7,-5,-4,-3,2,4,6,8,11,14]),given=tex(recursive(a,d)),answer=tex(explicit(a,d));
 return formulaInput(`u3-04b-${a}-${d}`,'convert',`Convert ${given} to an explicit formula.`,a,d,steps(`Read ${tex(`a_1=${a}`)} from the initial condition and ${tex(`d=${d}`)} from the common difference in the recursive rule.`,`Use ${tex('a_n=a_1+d(n-1)')}.`,`Substitute the values: ${answer}.`));
}
function commonDifferenceRecursive(){
 const a=ri(-25,45),d=pick([-10,-8,-7,-6,-5,-4,-3,2,3,4,5,6,7,8,10]),k=ri(4,10),ak=a+(k-1)*d,rule=`a_n=a_{n-1} ${signed(d)}`,answer=`${tex(`d=${d}`)}; ${tex(`a_1=${a}`)}; ${tex(rule)}`;
 const fields=[
  {id:'difference',label:'Common difference',check:'number',answer:String(d),answerText:tex(String(d)),inputKind:'integer'},
  {id:'initial',label:'Initial term a₁',labelHtml:'Initial Term \\(a_1\\)',check:'initial-term',answer:String(a),answerText:tex(`a_1=${a}`),inputKind:'initial-term'},
  {id:'recursive',label:'Recursive formula',labelHtml:'Recursive Formula \\(a_n=\\)',check:'recursive-rule',recursive:{a,d},answerText:tex(rule),inputKind:'recursive'}
 ];
 const differenceFraction=rawFraction(ak-a,k-1),explanation=steps(`There are ${k-1} equal changes from term 1 to term ${k}.`,`Divide the total change by the number of steps: ${tex(`d=\\frac{${ak}-${par(a)}}{${k}-1}=${differenceFraction}=${d}`)}.`,`Use ${tex(`a_1=${a}`)} and the common difference ${d} to write the recursive formula: ${tex(recursive(a,d))}.`);
 return multiInput(`u3-04c-${a}-${d}-${k}`,'missing_difference',`An arithmetic sequence has ${tex(`a_1=${a}`)} and ${tex(`a_{${k}}=${ak}`)}. Find the common difference, enter the initial term, and complete the recursive formula.`,fields,answer,explanation,{a,d,k,ak});
}

const lessonGenerators={
 'identifying-arithmetic-sequences':arithmeticIdentification,
 'common-difference-next-terms':commonDifferenceNext,
 'explicit-formulas-arithmetic-sequences':explicitFormula,
 'finding-a-specific-term':specificTerm,
 'finding-the-term-number':termNumber,
 'arithmetic-sequence-word-problems':sequenceWordProblem,
 'evaluating-functions':evaluateFunction,
 'solving-function-equations':solveFunctionEquation,
 'slope-from-two-points':slopeFromPoints,
 'collinearity-and-slope':collinearity,
 'slope-from-graphs':slopeFromGraph,
 'slope-intercept-form':slopeIntercept,
 'writing-equations-of-lines':lineEquations,
 'converting-point-slope-to-slope-intercept':convertPointSlope,
 'linear-function-word-problems':linearWordProblem,
 'recursive-formulas-from-sequences':recursiveFromSequences,
 'recursive-to-explicit-formulas':recursiveToExplicit,
 'common-difference-recursive-formulas':commonDifferenceRecursive
};
const sections={
 a:['identifying-arithmetic-sequences','common-difference-next-terms','explicit-formulas-arithmetic-sequences','finding-a-specific-term','finding-the-term-number','arithmetic-sequence-word-problems'],
 b:['evaluating-functions','solving-function-equations','slope-from-two-points','collinearity-and-slope','slope-from-graphs'],
 c:['slope-intercept-form','writing-equations-of-lines','converting-point-slope-to-slope-intercept','linear-function-word-problems'],
 d:['recursive-formulas-from-sequences','recursive-to-explicit-formulas','common-difference-recursive-formulas']
};
function mixed(keys,options){const requested=options?.mode;if(requested&&lessonGenerators[requested]&&keys.includes(requested))return lessonGenerators[requested]();return lessonGenerators[pick(keys)]();}
function review(section){return options=>mixed(sections[section],options);}
function comprehensive(options){const mode=options?.mode;if(sections[mode])return mixed(sections[mode],{});return mixed(Object.keys(lessonGenerators),options);}
const generators={...lessonGenerators,'section-a-review':review('a'),'section-b-review':review('b'),'section-c-review':review('c'),'section-d-review':review('d'),'unit-3-comprehensive-review':comprehensive};

global.BatchMathIM1Unit3Generators={
 get:slug=>generators[slug],
 list:()=>Object.keys(generators),
 lessons:lessonGenerators,
 sections
};
})(window);
