// Independent check of the Growth / Decay / Interest / Newton's Law engine. The numbers are read back from the
// question's own wording, every answer is recomputed here from first principles (k from the data, half-life,
// percent remaining, Newton's law for cooling and warming, periodic and continuous interest, and the reverse
// forms), and the engine's value must agree. Also checks physical sense: targets lie between the start and the
// surroundings, amounts and times are positive, and warming problems really warm.
// Usage: node tools/review-lab/unit5/qa/verify-growth.mjs [N]
import {load,keypadForm} from './lib.mjs';
const N=+(process.argv[2]||2000);const L=load(['unit5-growth.js']),gen=L.G.get('exponential-growth-and-decay-interest-newton-s-law-of-cooling'),A=L.A;
const num=s=>Number(String(s).replace(/,/g,''));
const tex=s=>A.value(A.parse(keypadForm(String(s).replace(/\{,\}/g,'')),null),0);
const plain=h=>h.replace(/\{,\}/g,',').replace(/<[^>]+>/g,' ').replace(/\\\(|\\\)/g,'').replace(/\\left|\\right/g,'').replace(/\s+/g,' ').trim();
const HOW={annually:1,semiannually:2,quarterly:4,monthly:12,daily:365};
const NUM='([\\d,]+(?:\\.\\d+)?)';
let checked=0,unread=0;const bad=[],unreadKinds={},sense=[];
const near=(x,y)=>Math.abs(x-y)<=Math.max(1e-6,1e-9*Math.abs(y));
for(let i=1;i<=N;i++){L.seed(i*3301);const p=gen({});const q=plain(p.questionHtml);let m;const ctx={};
 // the model behind the problem, from the wording
 if((m=q.match(new RegExp(`At time t=0 it is ${NUM} (.+?), and (\\d+) \\w+ later it is ${NUM}`)))){const y0=num(m[1]),T=+m[3],y1=num(m[4]);ctx.k=Math.log(y1/y0)/T;ctx.y=t=>y0*Math.exp(ctx.k*t);ctx.kind='growth';}
 else if((m=q.match(new RegExp(`After (\\d+) \\w+ it is ${NUM} .+?, and after (\\d+) \\w+ it is ${NUM}`)))){const t1=+m[1],a=num(m[2]),t2=+m[3],b=num(m[4]);ctx.k=Math.log(b/a)/(t2-t1);ctx.y0=a*Math.exp(-ctx.k*t1);ctx.kind='initial count';}
 else if((m=q.match(new RegExp(`half-life of ${NUM} (\\w+)\\. A sample contains ${NUM} milligrams`)))||(m=q.match(new RegExp(`half-life of ${NUM} (\\w+)\\. A dose of ${NUM} milligrams`)))){const H=num(m[1]),M0=num(m[3]);ctx.k=Math.LN2/H;ctx.y=t=>M0*Math.pow(2,-t/H);ctx.kind='half-life';}
 else if((m=q.match(new RegExp(`After (\\d+) \\w+, .+? has decayed to ${NUM}% of its original amount`)))){const T=+m[1],P=num(m[2])/100;ctx.k=-Math.log(P)/T;ctx.kind='percent';}
 else if((m=q.match(new RegExp(`dy/dt=-${NUM}y.*?contains ${NUM} milligrams`)))||(m=q.match(new RegExp(`\\\\frac\\{dy\\}\\{dt\\}=-${NUM}y.*?contains ${NUM} milligrams`)))){const K=num(m[1]),M0=num(m[2]);ctx.k=K;ctx.y=t=>M0*Math.exp(-K*t);ctx.kind='decay equation';}
 else if((m=q.match(new RegExp(`is at ${NUM}°[CF] when it is placed in .+? ${NUM}°[CF]\\. After (\\d+) minutes its temperature is ${NUM}°`)))){const T0=num(m[1]),Ts=num(m[2]),t1=+m[3],T1=num(m[4]);
  ctx.k=Math.log((T0-Ts)/(T1-Ts))/t1;ctx.T=t=>Ts+(T0-Ts)*Math.exp(-ctx.k*t);Object.assign(ctx,{T0,Ts,t1,T1,kind:'newton'});
  if(!(ctx.k>0))sense.push(`${p.id}: k = ${ctx.k} is not positive`);if((T1-Ts)*(T0-Ts)<=0||Math.abs(T1-Ts)>=Math.abs(T0-Ts))sense.push(`${p.id}: reading ${T1} is not between ${T0} and ${Ts}`);
  if(/warming/.test(q)!==(T0<Ts))sense.push(`${p.id}: warming label does not match the temperatures`);}
 else if((m=q.match(new RegExp(`${NUM} dollars is invested in an account that earns ${NUM}% annual interest(?: compounded (\\w+))?`)))){Object.assign(ctx,{P:num(m[1]),r:num(m[2])/100,how:m[3]||null,kind:'interest'});}
 else if((m=q.match(new RegExp(`An account earns ${NUM}% annual interest compounded continuously`)))){Object.assign(ctx,{r:num(m[1])/100,kind:'present value'});}
 else if((m=q.match(new RegExp(`half-life of ${NUM} hours\\. A treatment requires at least ${NUM} milligrams to remain (\\d+) hours`)))){const H=num(m[1]);Object.assign(ctx,{need:num(m[2])*Math.pow(2,+m[3]/H),k:Math.LN2/H,kind:'dose'});}
 else if((m=q.match(new RegExp(`half-life of ${NUM} (\\w+)\\. Delivery takes (\\d+|1) \\w+, and the experiment needs ${NUM} units`)))){const H=num(m[1]);Object.assign(ctx,{need:num(m[4])*Math.pow(2,+m[3]/H),kind:'shipping'});}
 else if((m=q.match(new RegExp(`An investment of ${NUM} dollars earns interest compounded continuously`)))){Object.assign(ctx,{P:num(m[1]),kind:'rate needed'});}
 else if((m=q.match(new RegExp(`in .+? ${NUM}°[CF]\\. Its temperature is ${NUM}°[CF] after (\\d+) minutes and ${NUM}°[CF] after (\\d+) minutes`)))){const Ts=num(m[1]),T1=num(m[2]),T2=num(m[4]);ctx.T0=Ts+(T1-Ts)*(T1-Ts)/(T2-Ts);ctx.kind='initial temperature';}
 else if((m=q.match(new RegExp(`is at ${NUM}°[CF] when it is placed in .+? whose temperature is unknown\\. .*?with k=(.+?) per minute, and after (\\d+) minutes it is ${NUM}°`)))){const T0=num(m[1]),k=tex(m[2]),t1=+m[3],T1=num(m[4]),f=Math.exp(-k*t1);ctx.Ts=(T1-f*T0)/(1-f);ctx.kind='ambient';}
 else if((m=q.match(new RegExp(`Its temperature is ${NUM}°[CF] at t=0, ${NUM}°[CF] at t=(\\d+) and ${NUM}°[CF] at t=(\\d+) minutes`)))){const a=num(m[1]),b=num(m[2]),c=num(m[4]);ctx.Ts=(a*c-b*b)/(a+c-2*b);ctx.kind='ambient from three readings';}
 else if((m=q.match(new RegExp(`An account pays ${NUM}% annual interest compounded (\\w+)`)))){const r=num(m[1])/100,n=HOW[m[2]];ctx.rc=100*n*Math.log(1+r/n);ctx.kind='equivalent rate';}
 else if((m=q.match(new RegExp(`A radioactive sample has ${NUM} milligrams remaining after (\\d+) \\w+ and ${NUM} milligrams remaining after (\\d+) \\w+`)))){const a=num(m[1]),t1=+m[2],b=num(m[3]),t2=+m[4];ctx.k=Math.log(a/b)/(t2-t1);ctx.y0=a*Math.exp(ctx.k*t1);ctx.kind='two measurements';}
 for(const part of p.parts){const pr=plain(part.prompt),ans=part.answer;let want=null;
  const got=ans.kind==='numeric'?ans.value:ans.kind==='exact'?ans.value:null;
  if(ctx.kind==='growth'){
   if((m=pr.match(/after (\d+) \w+\./)))want=ctx.y(+m[1]);
   else if((m=pr.match(new RegExp(`reach ${NUM}`))))want=Math.log(num(m[1])/ctx.y(0))/ctx.k;
   else if(/to double/.test(pr))want=Math.LN2/ctx.k;
   else if(/exact value of the growth constant/.test(pr))want=ctx.k;
   else if((m=pr.match(/increasing at t=(\d+)/)))want=ctx.k*ctx.y(+m[1]);
   else if(/as a function of t/.test(pr)){const tree=A.parse(ans.expression,'x');want='fn';if(![0,0.7,1.9,3.2].every(t=>near(A.value(tree,t),ctx.y(t))))bad.push(`${p.id}: model function disagrees`);}}
  else if(ctx.kind==='initial count'&&/at t=0/.test(pr))want=ctx.y0;
  else if(ctx.kind==='half-life'||ctx.kind==='decay equation'){
   if((m=pr.match(/remain after ([\d,.]+) \w+/)))want=ctx.y(num(m[1]));
   else if((m=pr.match(new RegExp(`will ${NUM} milligrams remain`))))want=Math.log(ctx.y(0)/num(m[1]))/ctx.k;
   else if((m=pr.match(/changing at t=([\d,.]+)/)))want=-ctx.k*ctx.y(num(m[1]));
   else if(/half-life/.test(pr))want=Math.LN2/ctx.k;}
  else if(ctx.kind==='percent'){if(/half-life/.test(pr))want=Math.LN2/ctx.k;else if((m=pr.match(new RegExp(`decay to ${NUM}%`))))want=-Math.log(num(m[1])/100)/ctx.k;}
  else if(ctx.kind==='newton'){
   if((m=pr.match(/temperature after (\d+) minutes/)))want=ctx.T(+m[1]);
   else if((m=pr.match(new RegExp(`How much longer after the (\\d+)-minute reading .*? reach (-?${NUM})°`))))want=Math.log((ctx.T0-ctx.Ts)/(num(m[2])-ctx.Ts))/ctx.k-(+m[1]);
   else if((m=pr.match(new RegExp(`When will the temperature be (-?${NUM})°`)))){const Tst=num(m[1]);want=Math.log((ctx.T0-ctx.Ts)/(Tst-ctx.Ts))/ctx.k;if((Tst-ctx.Ts)*(ctx.T1-ctx.Ts)<=0||Math.abs(Tst-ctx.Ts)>=Math.abs(ctx.T1-ctx.Ts))sense.push(`${p.id}: target ${Tst} is not reached after the reading`);}
   else if((m=pr.match(/changing at t=(\d+) minutes/)))want=-ctx.k*(ctx.T(+m[1])-ctx.Ts);
   else if(/exact value of k/.test(pr))want=ctx.k;}
  else if(ctx.kind==='interest'){const {P,r}=ctx,bal=(t,how)=>how==='continuously'?P*Math.exp(r*t):P*Math.pow(1+r/HOW[how],HOW[how]*t);
   if((m=pr.match(/after (\d+) years if the interest is compounded (\w+)/)))want=bal(+m[1],m[2]);
   else if((m=pr.match(/interest does the account earn in (\d+) years if the interest is compounded (\w+)/))){want=bal(+m[1],m[2])-P;ctx.prev=m[2];}
   else if((m=pr.match(/How much more would the account contain after (\d+) years with continuous compounding/)))want=bal(+m[1],'continuously')-bal(+m[1],ctx.prev);
   else if((m=pr.match(/after (\d+) years\?/))&&ctx.how)want=bal(+m[1],ctx.how);
   else if((m=pr.match(new RegExp(`(?:reach|grow to) ${NUM} dollars`)))&&ctx.how){const f=num(m[1])/P;want=ctx.how==='continuously'?Math.log(f)/r:Math.log(f)/(HOW[ctx.how]*Math.log(1+r/HOW[ctx.how]));}}
  else if(ctx.kind==='present value'&&(m=pr.match(new RegExp(`contains ${NUM} dollars after (\\d+) years`))))want=num(m[1])*Math.exp(-ctx.r*(+m[2]));
  else if(ctx.kind==='dose'){want=/exact value of/.test(pr)?ctx.k:ctx.need;}
  else if(ctx.kind==='shipping')want=ctx.need;
  else if(ctx.kind==='rate needed'&&(m=pr.match(new RegExp(`grow to ${NUM} dollars in (\\d+) years`))))want=100*Math.log(num(m[1])/ctx.P)/(+m[2]);
  else if(ctx.kind==='initial temperature')want=ctx.T0;
  else if(ctx.kind==='ambient'||ctx.kind==='ambient from three readings')want=ctx.Ts;
  else if(ctx.kind==='equivalent rate')want=ctx.rc;
  else if(ctx.kind==='two measurements'){if(/half-life/.test(pr))want=Math.LN2/ctx.k;else if(/at t=0/.test(pr))want=ctx.y0;}
  if(want===null){unread++;const k=`${p.variant}/${ctx.kind||'unread intro'}`;unreadKinds[k]=(unreadKinds[k]||0)+1;if(process.env.SHOW_SKIPS&&unreadKinds[k]<=2)console.log('unread',k,'|',q.slice(0,160),'|',pr.slice(0,100));continue;}
  checked++;if(want==='fn')continue;
  if(!(Number.isFinite(want)&&near(got,want)))bad.push(`${p.id} [${ctx.kind}] ${pr.slice(0,60)} | engine ${got} independent ${want}`);
  if(ans.kind==='numeric'&&/how long|how many years|after how many|when will|what time|half-life/i.test(pr)&&!(want>0))sense.push(`${p.id}: time ${want} is not positive`);}}
console.log(`problems ${N}; parts recomputed independently ${checked}; parts not read ${unread}; disagreements ${bad.length}; physical-sense issues ${sense.length}`);
if(unread)console.log('not read:',JSON.stringify(unreadKinds));console.log([...bad,...sense].slice(0,15).join('\n'));process.exitCode=bad.length||sense.length?1:0;
