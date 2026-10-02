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
function linear(m,b,v='x'){
 const first=m===1?v:m===-1?`-${v}`:`${m}${v}`;
 return b===0?first:`${first} ${signed(b)}`;
}
function slopeTerm(m,v='x'){return m.n===m.d?v:m.n===-m.d?`-${v}`:`${m.tex}${v}`;}
function subtractTerm(v,n){return n===0?v:n>0?`${v}-${n}`:`${v}+${Math.abs(n)}`;}
function pointSlope(m,x,y){const factor=m.n===m.d?'':m.n===-m.d?'-':m.tex;return `${subtractTerm('y',y)}=${factor}(${subtractTerm('x',x)})`;}
function slopeInterceptEquation(m,b){
 const constant=b.n===0?'':b.n<0?` - ${ratio(Math.abs(b.n),b.d).tex}`:` + ${b.tex}`;
 return `y=${slopeTerm(m)}${constant}`;
}
function explicit(a,d){return `a_n=${a}${d===0?'':` ${signed(d)}(n-1)`}`;}
function recursive(a,d){return `a_1=${a},\\quad a_n=a_{n-1}${d===0?'':` ${signed(d)}`}`;}
function sequence(values){return values.map(num).join(', ')+', \\ldots';}
function mc(id,variant,q,correct,distractors,explain){
 const unique=[];for(const choice of [correct,...distractors])if(choice!=null&&!unique.includes(String(choice)))unique.push(String(choice));
 const fallback=['Not enough information','None of these','The values are not related','The relationship is not linear'];
 for(const choice of fallback){if(unique.length>=4)break;if(!unique.includes(choice)&&choice!==String(correct))unique.push(choice);}
 const choices=shuffle(unique.slice(0,4));
 return{id,variant,kind:'mc',q,choices,correctIndex:choices.indexOf(String(correct)),answerText:String(correct),explain};
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
function arithmeticIdentification(){
 const arithmetic=random()<.58,a=ri(-30,35),d=pick([-12,-9,-7,-5,-3,0,2,4,6,8,11]);let values,diffs;
 if(arithmetic){values=Array.from({length:5},(_,i)=>a+i*d);diffs=[d,d,d,d];}
 else if(random()<.5){const step=pick([1,2,3]),first=pick([-8,-5,-3,2,4,7]);diffs=[first,first+step,first+2*step,first+3*step];values=[a];for(const change of diffs)values.push(values.at(-1)+change);}
 else{const r=pick([-3,-2,2,3]),start=pick([-4,-3,-2,2,3,4]);values=Array.from({length:5},(_,i)=>start*r**i);diffs=values.slice(1).map((x,i)=>x-values[i]);}
 const correct=arithmetic?`Arithmetic; ${tex(`d=${d}`)}`:'Not arithmetic';
 const differences=diffs.map(num).join(', ');
 return mc(`u3-01a-${values.join('_')}`,'identify',`Determine whether ${tex(sequence(values))} is arithmetic. If it is, find the common difference.`,correct,[arithmetic?'Not arithmetic':`Arithmetic; ${tex(`d=${diffs[0]}`)}`,`Arithmetic; ${tex(`d=${-diffs[0]}`)}`,`Arithmetic; ${tex(`d=${diffs.at(-1)}`)}`],`Subtract each term from the term after it. The consecutive differences are ${differences}. ${arithmetic?`They are all ${d}, so the sequence is arithmetic with ${tex(`d=${d}`)}.`:'They are not all the same, so the sequence is not arithmetic.'}`);
}
function commonDifferenceNext(){
 const a=ri(-50,70),d=pick([-13,-11,-8,-6,-4,-3,2,5,7,9,12]),shown=Array.from({length:4},(_,i)=>a+i*d),next=[4,5,6].map(i=>a+i*d);
 const fields=[
  {id:'difference',label:'Common difference',answer:String(d),answerText:tex(`d=${d}`),check:'number',inputKind:'integer'},
  ...next.map((value,index)=>({id:`next-${index+1}`,label:`Next term ${index+1}`,answer:String(value),answerText:tex(String(value)),check:'number',inputKind:'integer'}))
 ];
 return multiInput(`u3-01b-${a}-${d}`,'next_terms',`Find the common difference and the next three terms of ${tex(sequence(shown))}.`,fields,`${tex(`d=${d}`)}; next terms: ${next.map(num).join(', ')}`,`Each term changes by ${d}. Continue adding ${d}: ${shown.at(-1)} ${signed(d)}=${next[0]}, then ${next[0]} ${signed(d)}=${next[1]}, then ${next[1]} ${signed(d)}=${next[2]}.`,{a,d,shown,next});
}
function explicitFormula(){
 const a=ri(-25,45),d=pick([-12,-9,-7,-5,-3,0,2,4,6,8,11]),fromValues=random()<.48;
 const prompt=fromValues?`Write an explicit formula for ${tex(sequence(Array.from({length:4},(_,i)=>a+i*d)))}.`:`An arithmetic sequence has ${tex(`a_1=${a}`)} and ${tex(`d=${d}`)}. Write an explicit formula for ${tex('a_n')}.`;
 const formula=tex(explicit(a,d));
 return formulaInput(`u3-01c-${fromValues?1:0}-${a}-${d}`,fromValues?'from_sequence':'from_values',prompt,a,d,`The first term is ${tex(`a_1=${a}`)} and the common difference is ${tex(`d=${d}`)}. Use ${tex('a_n=a_1+d(n-1)')}: ${formula}.`);
}
function specificTerm(){
 const a=ri(-30,55),d=pick([-11,-8,-6,-4,-3,-2,-1,1,2,3,4,5,7,9,12]),n=Math.abs(d)<4&&random()<.28?ri(26,50):ri(10,25),answer=a+(n-1)*d,showSequence=random()<.5;
 const given=showSequence?`the arithmetic sequence ${tex(sequence(Array.from({length:4},(_,i)=>a+i*d)))}`:`${tex(`a_1=${a}`)} and ${tex(`d=${d}`)}`;
 return Object.assign(input(`u3-01d-${a}-${d}-${n}`,'specific_term',`Find ${tex(`a_{${n}}`)} for ${given}.`,answer,tex(String(answer)),`Use ${tex('a_n=a_1+d(n-1)')}: ${tex(`a_{${n}}=${a}+${par(d)}(${n}-1)=${answer}`)}.`,'integer'),{a,d,n,calculationSize:Math.abs((n-1)*d)});
}
function termNumber(){
 const a=ri(-25,80),d=pick([-11,-8,-6,-4,-3,2,5,7,9,12]),n=ri(8,32),target=a+(n-1)*d;
 return input(`u3-01e-${a}-${d}-${n}`,'term_number',`Which term of ${tex(sequence(Array.from({length:4},(_,i)=>a+i*d)))} is ${target}? Enter the term number.`,n,tex(String(n)),`Set the explicit formula equal to ${target}: ${tex(`${target}=${a}+${par(d)}(n-1)`)}. Solving gives ${tex(`n=${n}`)}, so ${target} is term ${n}.`,'integer');
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
 return multiInput(`u3-01f-${story.key}-${a}-${d}-${n}`,'model',q,fields,`${formula}; ${answer} ${story.unit}`,`At ${story.count} 1, the value is ${a}, so ${tex(`a_1=${a}`)}. The amount changes by ${d} each ${story.count}, so ${formula}. Then ${tex(`a_{${n}}=${a}+${par(d)}(${n}-1)=${answer}`)}.`,{storyKey:story.key,a,d,n,answer,allValues:values,validRange:[story.min,story.max],wholeRequired:true,unit:story.unit,countLabel:story.count});
}
function evaluateFunction(){
 const letter=pick(['f','g','h','p','q','r']),x=ri(-8,8),quadratic=random()<.28;
 if(quadratic){const a=pick([-3,-2,-1,1,2,3]),b=ri(-6,6),c=ri(-9,9),answer=a*x*x+b*x+c,lead=a===1?'x^2':a===-1?'-x^2':`${a}x^2`,middle=b===0?'':b>0?` + ${b===1?'':b}x`:` - ${b===-1?'':Math.abs(b)}x`,constant=c===0?'':c>0?` + ${c}`:` - ${Math.abs(c)}`,rule=`${lead}${middle}${constant}`;return input(`u3-02a-q-${a}-${b}-${c}-${x}`,'quadratic',`If ${tex(`${letter}(x)=${rule}`)}, find ${tex(`${letter}(${x})`)}.`,answer,tex(String(answer)),`Substitute ${x} for every ${tex('x')}: ${tex(`${letter}(${x})=${a}(${par(x)})^2+${par(b)}(${par(x)})+${par(c)}=${answer}`)}.`,'integer');}
 const m=pick([-8,-6,-5,-3,-2,2,3,4,6,7,9]),b=ri(-15,15),answer=m*x+b;
 return input(`u3-02a-l-${m}-${b}-${x}`,'linear',`If ${tex(`${letter}(x)=${linear(m,b)}`)}, find ${tex(`${letter}(${x})`)}.`,answer,tex(String(answer)),`Replace ${tex('x')} with ${x}: ${tex(`${letter}(${x})=${m}(${par(x)})+${par(b)}=${answer}`)}.`,'integer');
}
function solveFunctionEquation(){
 const letter=pick(['f','g','h','p','q','w']),m=pick([-8,-6,-5,-4,-3,-2,2,3,4,5,6,7,8]),b=ri(-16,16),whole=random()<.72,q=whole?1:pick([2,3,4,5]),p=whole?ri(-9,9):pick(Array.from({length:71},(_,i)=>i-35).filter(n=>n%q!==0));
 const targetRatio=ratio(m*p+b*q,q),answer=ratio(p,q);
 return input(`u3-02b-${m}-${b}-${targetRatio.plain}`,'solve',`If ${tex(`${letter}(x)=${linear(m,b)}`)}, solve ${tex(`${letter}(x)=${targetRatio.tex}`)}.`,answer.plain,tex(answer.tex),`Write ${tex(`${linear(m,b)}=${targetRatio.tex}`)}. Undo the constant term, then divide by ${m}. This gives ${tex(`x=${answer.tex}`)}.`,'fraction');
}
function slopeFromPoints(){
 const dx=pick([1,2,3,4,5,6]),dy=pick([-9,-7,-5,-4,-3,-2,1,2,3,4,5,7,9]),x1=ri(-8,2),y1=ri(-8,8),x2=x1+dx,y2=y1+dy,s=ratio(dy,dx);
 return input(`u3-02c-${x1}-${y1}-${x2}-${y2}`,'two_points',`Find the slope through ${tex(`(${x1},${y1})`)} and ${tex(`(${x2},${y2})`)}.`,s.plain,tex(s.tex),`Use ${tex('m=\\frac{y_2-y_1}{x_2-x_1}')}: ${tex(`m=\\frac{${y2}-${par(y1)}}{${x2}-${par(x1)}}=\\frac{${dy}}{${dx}}=${s.tex}`)}.`,'fraction');
}
function collinearity(){
 const dx=pick([1,2,3,4]),dy=pick([-6,-4,-3,-2,1,2,3,4,6]),x0=ri(-7,-1),y0=ri(-7,7),count=random()<.5?3:4,points=Array.from({length:count},(_,i)=>[x0+i*dx,y0+i*dy]),yes=random()<.55;
 if(!yes)points[pick([...Array(count-1).keys()].slice(1).concat(count-1))][1]+=pick([-3,-2,2,3]);
 const slopes=points.slice(1).map((p,i)=>ratio(p[1]-points[i][1],p[0]-points[i][0]));
 const pointText=points.map(p=>tex(`(${p[0]},${p[1]})`)).join(', '),correct=yes?'Yes, the points are collinear.':'No, the points are not collinear.';
 return mc(`u3-02d-${points.flat().join('_')}`,'collinearity',`Are these points collinear? ${pointText}`,correct,[yes?'No, the points are not collinear.':'Yes, the points are collinear.'],`Compare slopes between consecutive points: ${slopes.map((s,i)=>tex(`m_${i+1}=${s.tex}`)).join(', ')}. ${yes?'The slopes match, so all points lie on one line.':'The slopes do not all match, so the points do not all lie on one line.'}`);
}
function graphSvg(x1,y1,x2,y2){
 const W=480,H=360,s=32,ox=W/2,oy=H/2,X=x=>ox+x*s,Y=y=>oy-y*s;let ticks='';
 for(let i=-5;i<=5;i++){if(i){ticks+=`<line x1="${X(i)}" y1="${oy-4}" x2="${X(i)}" y2="${oy+4}" stroke="#777"/><text x="${X(i)}" y="${oy+20}" fill="#bbb" font-size="12" text-anchor="middle">${i}</text><line x1="${ox-4}" y1="${Y(i)}" x2="${ox+4}" y2="${Y(i)}" stroke="#777"/><text x="${ox-10}" y="${Y(i)+4}" fill="#bbb" font-size="12" text-anchor="end">${i}</text>`;}}
 const m=(y2-y1)/(x2-x1),leftY=y1+m*(-5.5-x1),rightY=y1+m*(5.5-x1);
 return `<div class="bm-u3-graph"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Coordinate graph of a line through two lattice points"><line x1="${X(-5.7)}" y1="${oy}" x2="${X(5.7)}" y2="${oy}" stroke="#bbb"/><line x1="${ox}" y1="${Y(-5.3)}" x2="${ox}" y2="${Y(5.3)}" stroke="#bbb"/>${ticks}<line x1="${X(-5.5)}" y1="${Y(leftY)}" x2="${X(5.5)}" y2="${Y(rightY)}" stroke="#d71920" stroke-width="3"/><circle cx="${X(x1)}" cy="${Y(y1)}" r="6" fill="#f5c400"/><circle cx="${X(x2)}" cy="${Y(y2)}" r="6" fill="#f5c400"/></svg></div>`;
}
function slopeFromGraph(){
 const dx=pick([1,2,3,4]),dy=pick([-4,-3,-2,-1,1,2,3,4]),x1=pick([-3,-2,-1]),x2=x1+dx,y1=ri(-3,3),y2=y1+dy;
 if(Math.abs(y2)>5)return slopeFromGraph();const s=ratio(dy,dx);
 return input(`u3-02e-${x1}-${y1}-${x2}-${y2}`,'graph',`${graphSvg(x1,y1,x2,y2)}Find the slope of the graphed line.`,s.plain,tex(s.tex),`Use the two highlighted lattice points. The rise is ${dy} and the run is ${dx}, so ${tex(`m=\\frac{${dy}}{${dx}}=${s.tex}`)}.`,'fraction');
}
function slopeIntercept(){
 const m=ratio(pick([-8,-6,-5,-4,-3,-2,1,2,3,4,5,6,8]),pick([1,1,1,2,3,4,5])),b=ri(-9,9),identify=random()<.5;
 const eq=tex(slopeInterceptEquation(m,ratio(b)));
 if(identify)return mc(`u3-03a-id-${m.plain}-${b}`,'identify',`Identify the slope and y-intercept of ${eq}.`,`Slope ${tex(m.tex)}; y-intercept ${tex(`(0,${b})`)}`,[`Slope ${tex(String(b))}; y-intercept ${tex(`(0,${m.tex})`)}`,`Slope ${tex('-'+m.tex.replace(/^-/,''))}; y-intercept ${tex(`(0,${b})`)}`,`Slope ${tex(m.tex)}; y-intercept ${tex(`(${b},0)`)}`],`In ${tex('y=mx+b')}, ${tex('m')} is the slope and ${tex('b')} is the y-value where the line crosses the y-axis. Here ${tex(`m=${m.tex}`)} and the y-intercept is ${tex(`(0,${b})`)}.`);
 return mc(`u3-03a-write-${m.plain}-${b}`,'write',`Write an equation in slope-intercept form with slope ${tex(m.tex)} and y-intercept ${tex(`(0,${b})`)}.`,eq,[tex(`y=${b}x ${signed(m.n)}`),tex(slopeInterceptEquation(ratio(-m.n,m.d),ratio(b))),tex(slopeInterceptEquation(m,ratio(-b)))],`Use ${tex('y=mx+b')}. Substitute ${tex(`m=${m.tex}`)} and ${tex(`b=${b}`)} to get ${eq}.`);
}
function lineEquations(){
 const family=pick(['slope_intercept_points','point_slope_given','point_slope_points']),m=ratio(pick([-6,-5,-4,-3,-2,1,2,3,4,5,6]),pick([1,1,2,3])),x1=pick([-6,-5,-4,-3,-2,-1,1,2,3,4,5,6]),y1=ri(-7,7);
 if(family==='slope_intercept_points'){
  const b=ri(-8,8),x2=pick([-6,-4,-3,2,3,4,6]),y2=m.n*x2/m.d+b;if(!Number.isInteger(y2))return lineEquations();
  const eq=tex(slopeInterceptEquation(m,ratio(b)));return mc(`u3-03b-si-${m.plain}-${b}-${x2}`,family,`Write the line through ${tex(`(0,${b})`)} and ${tex(`(${x2},${y2})`)} in slope-intercept form.`,eq,[tex(slopeInterceptEquation(ratio(-m.n,m.d),ratio(b))),tex(slopeInterceptEquation(m,ratio(-b))),tex(`y=${b}x ${signed(m.n)}`)],`The first point gives the y-intercept ${tex(`b=${b}`)}. The slope is ${tex(`\\frac{${y2}-${b}}{${x2}-0}=${m.tex}`)}. Therefore ${eq}.`);
 }
 const x2=x1+m.d,y2=y1+m.n,correct=tex(pointSlope(m,x1,y1));
 const prompt=family==='point_slope_given'?`Write a point-slope equation with slope ${tex(m.tex)} through ${tex(`(${x1},${y1})`)}.`:`Write a point-slope equation through ${tex(`(${x1},${y1})`)} and ${tex(`(${x2},${y2})`)}.`;
 return mc(`u3-03b-ps-${family}-${m.plain}-${x1}-${y1}`,family,prompt,correct,[tex(pointSlope(m,y1,x1)),tex(pointSlope(ratio(-m.n,m.d),x1,y1)),tex(`${subtractTerm('y',-y1)}=${m.tex}(${subtractTerm('x',-x1)})`)],`${family==='point_slope_points'?`First find the slope: ${tex(`m=\\frac{${y2}-${par(y1)}}{${x2}-${par(x1)}}=${m.tex}`)}. `:''}Use ${tex('y-y_1=m(x-x_1)')} with ${tex(`(x_1,y_1)=(${x1},${y1})`)} to get ${correct}.`);
}
function convertPointSlope(){
 const m=ratio(pick([-6,-5,-4,-3,-2,1,2,3,4,5,6]),pick([1,1,2,3,4])),x1=ri(-8,8),y1=ri(-8,8),b=ratio(y1*m.d-m.n*x1,m.d);
 const original=tex(pointSlope(m,x1,y1)),answer=tex(slopeInterceptEquation(m,b));
 return mc(`u3-03c-${m.plain}-${x1}-${y1}`,'convert',`Convert ${original} to slope-intercept form.`,answer,[tex(slopeInterceptEquation(m,ratio(y1))),tex(slopeInterceptEquation(ratio(-m.n,m.d),b)),tex(slopeInterceptEquation(m,ratio(-b.n,b.d)))],`Distribute the slope, then move the y-value to the other side and combine constants. The result is ${answer}.`);
}
const linearStories=[
 {subject:'A taxi ride',start:'starts with a fee of',rate:'per mile',input:'miles',output:'total cost',prefix:'$',decreasing:false,min:4,max:18,rates:[2,3,4,5,6,8]},
 {subject:'A bicycle rental',start:'starts with a fee of',rate:'per hour',input:'hours',output:'total cost',prefix:'$',decreasing:false,min:8,max:35,rates:[3,4,5,6,8,10,12]},
 {subject:'A phone battery',start:'begins at',rate:'percentage points per hour',input:'hours',output:'battery percentage',suffix:'%',decreasing:true,min:65,max:100,rates:[3,4,5,6,7,8]},
 {subject:'A water tank',start:'begins with',rate:'gallons per minute',input:'minutes',output:'water remaining',suffix:' gallons',decreasing:true,min:400,max:900,rates:[15,20,25,30,35]},
 {subject:'A candle',start:'begins at',rate:'centimeters per hour',input:'hours',output:'candle height',suffix:' cm',decreasing:true,min:18,max:40,rates:[1,2,3]},
 {subject:'A savings account',start:'starts with',rate:'per week',input:'weeks',output:'total saved',prefix:'$',decreasing:false,min:15,max:80,rates:[5,8,10,12,15,20]}
];
function linearWordProblem(){
 const story=pick(linearStories),b=ri(story.min,story.max),rate=(story.decreasing?-1:1)*pick(story.rates),x=ri(4,12),value=b+rate*x,fn=tex(`f(x)=${linear(rate,b)}`);
 if(value<0)return linearWordProblem();
 const display=n=>`${story.prefix||''}${n}${story.suffix||''}`,q=`${story.subject} ${story.start} ${display(b)} and ${story.decreasing?'decreases':'increases'} by ${story.prefix||''}${Math.abs(rate)} ${story.rate}. Write a linear function for the ${story.output} after ${tex('x')} ${story.input}, then find it after ${x} ${story.input}.`;
 return mc(`u3-03d-${b}-${rate}-${x}-${story.input}`,'model',q,`${fn}; ${display(value)}`,[`${tex(`f(x)=${linear(rate,0)} ${signed(b)}`)}; ${display(b+rate*x+b)}`,`${tex(`f(x)=${linear(-rate,b)}`)}; ${display(b-rate*x)}`,`${fn}; ${display(b+rate*(x-1))}`],`The starting value is ${b}, so it is the y-intercept. The rate is ${rate}, so it is the slope. Thus ${fn}, and ${tex(`f(${x})=${b}+${par(rate)}(${x})=${value}`)}.`);
}
function recursiveFromSequences(){
 const a=ri(-30,55),d=pick([-13,-10,-8,-6,-4,-3,2,5,7,9,12,14]),family=pick(['write','terms','difference']);
 if(family==='write'){
  const correct=tex(recursive(a,d));return mc(`u3-04a-write-${a}-${d}`,family,`Write a recursive formula for ${tex(sequence(Array.from({length:4},(_,i)=>a+i*d)))}.`,correct,[tex(recursive(a,-d)),tex(`a_1=${a+d},\\quad a_n=a_{n-1} ${signed(d)}`),tex(explicit(a,d))],`The first term is ${a}. Each term changes by ${d}, so start with ${tex(`a_1=${a}`)} and use ${tex(`a_n=a_{n-1} ${signed(d)}`)}.`);
 }
 const count=family==='terms'?6:5,terms=Array.from({length:count},(_,i)=>a+i*d),formula=tex(recursive(a,d)),correct=family==='terms'?tex(sequence(terms)):`${tex(`d=${d}`)}; ${tex(sequence(terms))}`;
 return mc(`u3-04a-${family}-${a}-${d}`,family,`${family==='terms'?`Write the first ${count} terms`:'Find the common difference and write the first five terms'} for ${formula}.`,correct,[family==='terms'?tex(sequence(Array.from({length:count},(_,i)=>a-i*d))):`${tex(`d=${-d}`)}; ${tex(sequence(terms))}`,tex(sequence(Array.from({length:count},(_,i)=>a+(i+1)*d))),family==='terms'?tex(sequence(Array.from({length:count},(_,i)=>a+i*(d+1)))):`${tex(`d=${d}`)}; ${tex(sequence(Array.from({length:count},(_,i)=>a+(i+1)*d)))}`],`Begin with ${tex(`a_1=${a}`)}. ${d>0?'Add':'Subtract'} ${Math.abs(d)} each time: ${tex(sequence(terms))}${family==='difference'?` Therefore ${tex(`d=${d}`)}.`:''}`);
}
function recursiveToExplicit(){
 const a=ri(-25,50),d=pick([-12,-9,-7,-5,-4,-3,2,4,6,8,11,14]),given=tex(recursive(a,d)),answer=tex(explicit(a,d));
 return mc(`u3-04b-${a}-${d}`,'convert',`Convert ${given} to an explicit formula.`,answer,[tex(`a_n=${a} ${signed(d)}n`),tex(explicit(a,-d)),tex(`a_n=${d} ${signed(a)}(n-1)`) ],`The recursive rule gives ${tex(`a_1=${a}`)} and common difference ${tex(`d=${d}`)}. Substitute into ${tex('a_n=a_1+d(n-1)')} to get ${answer}.`);
}
function commonDifferenceRecursive(){
 const a=ri(-25,45),d=pick([-10,-8,-7,-6,-5,-4,-3,2,3,4,5,6,7,8,10]),k=ri(4,10),ak=a+(k-1)*d,answer=`${tex(`d=${d}`)}; ${tex(recursive(a,d))}`;
 return mc(`u3-04c-${a}-${d}-${k}`,'missing_difference',`An arithmetic sequence has ${tex(`a_1=${a}`)} and ${tex(`a_{${k}}=${ak}`)}. Find the common difference and write a recursive formula.`,answer,[`${tex(`d=${-d}`)}; ${tex(recursive(a,-d))}`,`${tex(`d=${ratio(ak-a,k).tex}`)}; ${tex(recursive(a,Math.trunc((ak-a)/k)))}`,`${tex(`d=${d}`)}; ${tex(recursive(ak,d))}`],`There are ${k-1} equal steps from term 1 to term ${k}. So ${tex(`d=\\frac{${ak}-${par(a)}}{${k}-1}=${d}`)}. The recursive formula is ${tex(recursive(a,d))}.`);
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
