(function(){'use strict';
const R=()=>window.BatchMathRNG.random(),ri=(a,b)=>Math.floor(R()*(b-a+1))+a,pick=a=>a[ri(0,a.length-1)];
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a||1};
const rat=(n,d=1)=>{if(d<0){n=-n;d=-d}const g=gcd(n,d);return{kind:'rat',n:n/g,d:d/g}};
const exact=(value,tex,text)=>({kind:'exact',value,tex,text:text||tex.replace(/\\/g,'')});
const tr=a=>a.kind==='rat'?(a.d===1?String(a.n):`${a.n<0?'-':''}\\frac{${Math.abs(a.n)}}{${a.d}}`):a.tex;
const shift=(v,a)=>a===0?v:a>0?`${v}-${a}`:`${v}+${-a}`;
const term=(c,v,first=false)=>{if(!c)return'';const core=(Math.abs(c)===1&&v?'':Math.abs(c))+v;return first?(c<0?'-':'')+core:(c<0?' - ':' + ')+core};
const poly=(coefs,v='x')=>coefs.map((c,j)=>{const p=coefs.length-j-1,body=p===0?'':p===1?v:`${v}^{${p}}`;return term(c,body,j===0)}).join('');
const multiply=(a,b)=>{const out=Array(a.length+b.length-1).fill(0);a.forEach((x,i)=>b.forEach((y,j)=>out[i+j]+=x*y));return out};
const fromRoots=(lead,...roots)=>roots.reduce((c,r)=>multiply(c,[1,-r]),[lead]);
const problem=(cat,family,id,q,ans,sol,data={})=>({cat,familyId:family,problemType:cat==='substitution'?'variable_substitution':cat==='complex'?'complex_fraction_limits':undefined,problemVariant:family,id,q,ans,sol,data:{family,...data}});

function continuous(mode='mixed'){
 const algebraFamilies=['constant','linear','quadratic','cubic','rational','square_root','cube_root'];
 const family=pick(mode==='core'?algebraFamilies:[...algebraFamilies,'nth_root','trig','trig','exponential','logarithm','logarithm']);
 if(family==='constant'){
  const k=ri(-12,12),a=ri(-7,7);return problem('continuous','continuous_direct_constant',`c-constant-${k}-${a}`,`\\(\\displaystyle\\lim_{x\\to${a}}${k}\\)`,rat(k),`A constant function has the same output at every nearby input, so the limit is \\(${k}\\).`,{mode,a});
 }
 if(['linear','quadratic','cubic'].includes(family)){
  const degree={linear:1,quadratic:2,cubic:3}[family],a=ri(-4,4),cs=Array.from({length:degree+1},(_,i)=>i===0?pick([-4,-3,-2,-1,1,2,3,4]):ri(-7,7));
  const value=cs.reduce((s,c)=>s*a+c,0),display=poly(cs);
  return problem('continuous',`continuous_direct_${family}`,`c-${family}-${a}-${cs.join('_')}`,`\\(\\displaystyle\\lim_{x\\to${a}}\\left(${display}\\right)\\)`,rat(value),`Polynomials are continuous. Substitute \\(x=${a}\\): \\(${display.replaceAll('x',`(${a})`)}=${value}\\).`,{mode,a,coefs:cs});
 }
 if(family==='rational'){
  let a,n,d,top,bottom;do{a=ri(-4,4);top=[pick([-4,-3,-2,-1,1,2,3,4]),ri(-7,7),ri(-9,9)];bottom=[pick([-3,-2,-1,1,2,3]),ri(-6,6),ri(-8,8)];n=top.reduce((s,c)=>s*a+c,0);d=bottom.reduce((s,c)=>s*a+c,0);}while(d===0);
  const ans=rat(n,d);return problem('continuous','continuous_direct_rational_quadratic',`c-rational-${a}-${top.join('_')}-${bottom.join('_')}`,`\\(\\displaystyle\\lim_{x\\to${a}}\\frac{${poly(top)}}{${poly(bottom)}}\\)`,ans,`At \\(x=${a}\\), the denominator is \\(${d}\\), not zero. The rational function is continuous there, so substitution gives \\(\\frac{${n}}{${d}}=${tr(ans)}\\).`,{mode,a,top,bottom});
 }
 if(family==='square_root'){
  const item=pick([
   {a:1,inside:'x^2+3',rad:4},{a:2,inside:'2x+5',rad:9},{a:1,inside:'x^2+x+1',rad:3},
   {a:-1,inside:'x^2+6',rad:7},{a:3,inside:'x^2-2x+5',rad:8}
  ]),root=Math.sqrt(item.rad),ans=Number.isInteger(root)?rat(root):exact(root,`\\sqrt{${item.rad}}`,`sqrt(${item.rad})`);
  return problem('continuous','continuous_direct_square_root_composition',`c-sqrt-${item.a}-${item.inside}`,`\\(\\displaystyle\\lim_{x\\to${item.a}}\\sqrt{${item.inside}}\\)`,ans,`The inner expression is continuous and approaches \\(${item.rad}>0\\). Therefore the square-root composition is continuous there, and substitution gives \\(\\sqrt{${item.rad}}=${tr(ans)}\\).`,{mode,a:item.a,radicand:item.rad});
 }
 if(family==='cube_root'){
  const item=pick([{a:1,inside:'2x+6',rad:8},{a:-2,inside:'x^3+19',rad:11},{a:2,inside:'x^2+4',rad:8},{a:-1,inside:'3x-5',rad:-8}]);
  const value=Math.cbrt(item.rad),ans=Number.isInteger(value)?rat(value):exact(value,`\\sqrt[3]{${item.rad}}`,`cbrt(${item.rad})`);
  return problem('continuous','continuous_direct_cube_root_composition',`c-cbrt-${item.a}-${item.inside}`,`\\(\\displaystyle\\lim_{x\\to${item.a}}\\sqrt[3]{${item.inside}}\\)`,ans,`Cube-root compositions are continuous for every real inner value. The inner expression approaches \\(${item.rad}\\), so substitution gives \\(\\sqrt[3]{${item.rad}}=${tr(ans)}\\).`,{mode,a:item.a,radicand:item.rad});
 }
 if(family==='nth_root'){
  const item=pick([
   {n:4,a:1,inside:'3x+13',rad:16,value:2,tex:'2',text:'2'},
   {n:6,a:1,inside:'x+63',rad:64,value:2,tex:'2',text:'2'},
   {n:5,a:1,inside:'x^2+2',rad:3,value:Math.pow(3,1/5),tex:'\\sqrt[5]{3}',text:'root(5,3)'},
   {n:4,a:2,inside:'x^2+3',rad:7,value:Math.pow(7,.25),tex:'\\sqrt[4]{7}',text:'root(4,7)'}
  ]),ans=Number.isInteger(item.value)?rat(item.value):exact(item.value,item.tex,item.text);
  return problem('continuous','continuous_direct_nth_root_composition',`c-nroot-${item.n}-${item.a}-${item.rad}`,`\\(\\displaystyle\\lim_{x\\to${item.a}}\\sqrt[${item.n}]{${item.inside}}\\)`,ans,`The inner expression approaches \\(${item.rad}>0\\), so the \\(${item.n}\\)th-root composition is continuous at the approach value. Direct substitution gives \\(${item.tex}\\).`,{mode,n:item.n,a:item.a,radicand:item.rad});
 }
 if(family==='trig'){
  const item=pick([
   {id:'sin-affine',a:'\\frac{\\pi}{6}',expr:'\\sin\\!\\left(2x+\\frac{\\pi}{6}\\right)',inside:'2\\left(\\frac{\\pi}{6}\\right)+\\frac{\\pi}{6}=\\frac{\\pi}{2}',value:1,tex:'1'},
   {id:'cos-affine',a:'\\frac{\\pi}{4}',expr:'\\cos\\!\\left(3x-\\frac{\\pi}{4}\\right)',inside:'3\\left(\\frac{\\pi}{4}\\right)-\\frac{\\pi}{4}=\\frac{\\pi}{2}',value:0,tex:'0'},
   {id:'tan-affine',a:'0',expr:'\\tan\\!\\left(\\frac{x}{2}+\\frac{\\pi}{4}\\right)',inside:'0+\\frac{\\pi}{4}=\\frac{\\pi}{4}',value:1,tex:'1'},
   {id:'sin-quadratic',a:'0',expr:'\\sin\\!\\left(x^2+\\frac{\\pi}{6}\\right)',inside:'0^2+\\frac{\\pi}{6}=\\frac{\\pi}{6}',value:.5,tex:'\\frac12'},
   {id:'cos-scaled',a:'1',expr:'\\cos\\!\\left(\\frac{\\pi x}{3}\\right)',inside:'\\frac{\\pi(1)}3=\\frac{\\pi}{3}',value:.5,tex:'\\frac12'},
   {id:'sin-scaled',a:'1',expr:'\\sin\\!\\left(\\frac{\\pi x}{4}\\right)',inside:'\\frac{\\pi(1)}4=\\frac{\\pi}{4}',value:Math.SQRT1_2,tex:'\\frac{\\sqrt2}{2}'}
  ]),ans=Number.isInteger(item.value)?rat(item.value):exact(item.value,item.tex,item.tex==='\\frac12'?'1/2':'sqrt(2)/2');
  return problem('continuous','continuous_direct_trig_composition',`c-trig-${item.id}-${item.a}`,`\\(\\displaystyle\\lim_{x\\to${item.a}}${item.expr}\\)`,ans,`The inner function and the indicated trigonometric function are continuous at the approach value. Substitution makes the angle \\(${item.inside}\\), so the limit is \\(${item.tex}\\).`,{mode,item:item.id});
 }
 if(family==='exponential'){
  const item=pick([
   {id:'e-linear',a:0,expr:'e^{2x-1}',value:1/Math.E,tex:'\\frac1e',text:'1/e',work:'e^{2(0)-1}=e^{-1}'},
   {id:'base-quadratic',a:0,expr:'3^{x^2-1}',value:1/3,tex:'\\frac13',text:'1/3',work:'3^{0^2-1}=3^{-1}'},
   {id:'base-linear',a:-1,expr:'2^{3x+1}',value:1/4,tex:'\\frac14',text:'1/4',work:'2^{3(-1)+1}=2^{-2}'},
   {id:'e-quadratic',a:1,expr:'e^{x^2}',value:Math.E,tex:'e',text:'e',work:'e^{1^2}=e'}
  ]),ans=Number.isInteger(item.value)?rat(item.value):exact(item.value,item.tex,item.text);
  return problem('continuous','continuous_direct_exponential_composition',`c-exp-${item.id}-${item.a}`,`\\(\\displaystyle\\lim_{x\\to${item.a}}${item.expr}\\)`,ans,`Exponential compositions are continuous for every real exponent. Direct substitution gives \\(${item.work}=${item.tex}\\).`,{mode,item:item.id,a:item.a});
 }
 const item=pick([
  {id:'quadratic',a:1,arg:'x^2+2',inside:3},{id:'linear',a:1,arg:'3x-1',inside:2},
  {id:'square',a:2,arg:'(x+1)^2',inside:9},{id:'exp-sum',a:0,arg:'2+e^x',inside:3},
  {id:'quadratic-two',a:-1,arg:'x^2+4',inside:5}
 ]),ans=exact(Math.log(item.inside),`\\ln(${item.inside})`,`ln(${item.inside})`);
 return problem('continuous','continuous_direct_logarithm_composition',`c-log-${item.id}-${item.a}`,`\\(\\displaystyle\\lim_{x\\to${item.a}}\\ln\\!\\left(${item.arg}\\right)\\)`,ans,`The logarithm's inner expression is continuous and approaches \\(${item.inside}>0\\). Thus the logarithmic composition is continuous at the approach value, and substitution gives the exact answer \\(\\ln(${item.inside})\\).`,{mode,item:item.id,a:item.a,inside:item.inside});
}

function factoring(){
 const family=pick(['nonmonic_quadratic','sum_cubes','gcf_then_difference_squares','reversed_factor','richer_common_factor']);
 if(family==='nonmonic_quadratic'){
  const A=ri(2,5),r=pick([-4,-3,-2,2,3,4]),s=pick([-6,-5,-1,1,5,6].filter(x=>x!==r)),coefs=fromRoots(A,r,s),ans=rat(A*(r-s));
  return problem('factoring','factoring_nonmonic_quadratic',`f-extra-nonmonic-${A}-${r}-${s}`,`\\(\\displaystyle\\lim_{x\\to${r}}\\frac{${poly(coefs)}}{${shift('x',r)}}\\)`,ans,`Substitution gives \\(0/0\\). Factor the numerator as \\(${A}(${shift('x',r)})(${shift('x',s)})\\). Cancel \\(${shift('x',r)}\\) for nearby \\(x\\ne${r}\\), then substitute: \\(${A}(${r}-${s})=${tr(ans)}\\).`,{A,r,s});
 }
 if(family==='sum_cubes'){
  const a=ri(2,6),ans=rat(3*a*a);return problem('factoring','factoring_sum_of_cubes',`f-extra-sumcube-${a}`,`\\(\\displaystyle\\lim_{x\\to-${a}}\\frac{x^3+${a**3}}{x+${a}}\\)`,ans,`Use \\(x^3+${a**3}=(x+${a})(x^2-${a}x+${a*a})\\). Cancel \\(x+${a}\\), then substitute \\(x=-${a}\\): \\(${a*a}+${a*a}+${a*a}=${tr(ans)}\\).`,{a});
 }
 if(family==='gcf_then_difference_squares'){
  const A=ri(2,5),r=ri(2,6),ans=rat(2*A*r*r);return problem('factoring','factoring_gcf_then_difference_squares',`f-extra-gcf-${A}-${r}`,`\\(\\displaystyle\\lim_{x\\to${r}}\\frac{${A}x^3-${A*r*r}x}{x-${r}}\\)`,ans,`First factor out the GCF: \\(${A}x(x^2-${r*r})\\). Then factor the difference of squares: \\(${A}x(x-${r})(x+${r})\\). Cancel \\(x-${r}\\) and substitute to obtain \\(${A}(${r})(${2*r})=${tr(ans)}\\).`,{A,r});
 }
 if(family==='reversed_factor'){
  const a=ri(2,8),ans=rat(-2*a);return problem('factoring','factoring_reversed_common_factor',`f-extra-reversed-${a}`,`\\(\\displaystyle\\lim_{x\\to${a}}\\frac{x^2-${a*a}}{${a}-x}\\)`,ans,`Factor the numerator as \\((x-${a})(x+${a})\\) and note that \\(${a}-x=-(x-${a})\\). The quotient simplifies to \\(-(x+${a})\\), so the limit is \\(-${2*a}\\).`,{a});
 }
 let A,B,r,s,t,u,den;do{A=ri(1,4);B=ri(1,4);r=pick([-3,-2,2,3]);s=pick([-5,-4,-1,1,4,5].filter(x=>x!==r));t=pick([-6,-1,1,6].filter(x=>x!==r&&x!==s));u=pick([-5,-2,2,5].filter(x=>x!==r));den=B*(r-u);}while(!den);
 const ans=rat(A*(r-s)*(r-t),den),num=fromRoots(A,r,s,t),bot=fromRoots(B,r,u);
 return problem('factoring','factoring_richer_common_factor',`f-extra-rich-${A}-${B}-${r}-${s}-${t}-${u}`,`\\(\\displaystyle\\lim_{x\\to${r}}\\frac{${poly(num)}}{${poly(bot)}}\\)`,ans,`Factor both polynomials: \\(\\frac{${A}(${shift('x',r)})(${shift('x',s)})(${shift('x',t)})}{${B}(${shift('x',r)})(${shift('x',u)})}\\). Cancel only the common \\(${shift('x',r)}\\). The remaining denominator is nonzero at \\(x=${r}\\), giving \\(${tr(ans)}\\).`,{A,B,r,s,t,u});
}

function substitution(){
 const family=pick(['eighth_root_over_power','power_over_eighth_root','cube_squared_reciprocal','cube_polynomial_ratio']);
 if(family==='eighth_root_over_power'||family==='power_over_eighth_root'){
  const k=pick([1,1,2]),a=ri(-4,4),m=ri(1,3),b=k**8-m*a,factor=8*k**7,inside=term(m,'x',true)+term(b,''),root=`\\sqrt[8]{${inside}}`,xa=shift('x',a);
  if(family==='eighth_root_over_power')return problem('substitution','substitution_eighth_root_over_power',`sub-extra-eighth-over-${k}-${a}-${m}`,`\\(\\displaystyle\\lim_{x\\to${a}}\\frac{${root}-${k}}{${xa}}\\)`,rat(m,factor),`Let \\(u=${root}\\). Then \\(u\\to${k}\\) and \\(u^8-${k**8}=${m}(${xa})\\). Replace \\(${xa}\\) with \\(\\frac{u^8-${k**8}}{${m}}\\), factor the difference of eighth powers, and cancel \\(u-${k}\\). The eight remaining terms each approach \\(${k**7}\\), giving \\(\\frac{${m}}{${factor}}=${tr(rat(m,factor))}\\).`,{k,a,m,b});
  return problem('substitution','substitution_power_over_eighth_root',`sub-extra-over-eighth-${k}-${a}-${m}`,`\\(\\displaystyle\\lim_{x\\to${a}}\\frac{${xa}}{${root}-${k}}\\)`,rat(factor,m),`Let \\(u=${root}\\). Since \\(${xa}=\\frac{u^8-${k**8}}{${m}}\\), factor the difference of eighth powers and cancel \\(u-${k}\\). The remaining sum approaches \\(${factor}\\), so the limit is \\(\\frac{${factor}}{${m}}=${tr(rat(factor,m))}\\).`,{k,a,m,b});
 }
 if(family==='cube_squared_reciprocal'){
  const k=pick([2,3,4]),a=k**3,ans=rat(1,9*k**4);return problem('substitution','substitution_cube_root_squared_reciprocal',`sub-extra-cube-square-recip-${k}`,`\\(\\displaystyle\\lim_{x\\to${a}}\\frac{(\\sqrt[3]{x}-${k})^2}{(x-${a})^2}\\)`,ans,`Let \\(u=\\sqrt[3]{x}\\). Since \\(x-${a}=(u-${k})(u^2+${k}u+${k*k})\\), the squared common factor cancels. The limit becomes \\(\\frac1{(${k*k}+${k*k}+${k*k})^2}=${tr(ans)}\\).`,{k});
 }
 const k=pick([2,3,4]),r=pick([1,5,6].filter(x=>x!==k)),s=pick([-2,-1,1,2].filter(x=>x!==k)),a=k**3,ans=rat(k-r,k-s);
 return problem('substitution','substitution_cube_root_polynomial_over_polynomial',`sub-extra-cube-ratio-${k}-${r}-${s}`,`\\(\\displaystyle\\lim_{x\\to${a}}\\frac{(\\sqrt[3]{x})^2-${k+r}\\sqrt[3]{x}+${k*r}}{(\\sqrt[3]{x})^2-${k+s}\\sqrt[3]{x}+${k*s}}\\)`,ans,`Let \\(u=\\sqrt[3]{x}\\), so \\(u\\to${k}\\). Factor to get \\(\\frac{(u-${k})(u-${r})}{(u-${k})(u-${s})}\\). Cancel \\(u-${k}\\); the remaining denominator is nonzero, and substitution gives \\(${tr(ans)}\\).`,{k,r,s});
}

function rationalizing(){
 const family=pick(['irrational_target','affine_radicand','reversed_difference','polynomial_companion']);
 if(family==='irrational_target')return problem('rationalizing','rationalizing_irrational_target','rat-extra-sqrt3',`\\(\\displaystyle\\lim_{x\\to3}\\frac{\\sqrt{x}-\\sqrt3}{x-3}\\)`,exact(Math.sqrt(3)/6,'\\frac{\\sqrt3}{6}','sqrt(3)/6'),`Multiply by the conjugate \\(\\sqrt{x}+\\sqrt3\\). The numerator becomes \\(x-3\\), which cancels. Substitution gives \\(\\frac1{2\\sqrt3}=\\frac{\\sqrt3}{6}\\); either equivalent exact form is accepted.`,{a:3});
 if(family==='affine_radicand'){
  const m=pick([2,3,4]),k=pick([2,3,4]),a=ri(-2,3),b=k*k-m*a,ans=rat(m,2*k),inside=term(m,'x',true)+term(b,'');return problem('rationalizing','rationalizing_affine_radicand',`rat-extra-affine-${m}-${k}-${a}`,`\\(\\displaystyle\\lim_{x\\to${a}}\\frac{\\sqrt{${inside}}-${k}}{x-${a}}\\)`,ans,`Multiply by \\(\\sqrt{${inside}}+${k}\\). The new numerator is \\(${inside}-${k*k}=${m}(x-${a})\\). Cancel \\(x-${a}\\), then substitute to obtain \\(\\frac{${m}}{${2*k}}=${tr(ans)}\\).`,{m,k,a,b});
 }
 if(family==='reversed_difference'){
  const k=ri(2,7),a=k*k,ans=rat(-1,2*k);return problem('rationalizing','rationalizing_reversed_difference',`rat-extra-reverse-${k}`,`\\(\\displaystyle\\lim_{x\\to${a}}\\frac{${k}-\\sqrt{x}}{x-${a}}\\)`,ans,`Multiply by the conjugate \\(${k}+\\sqrt{x}\\). The numerator becomes \\(${a}-x=-(x-${a})\\). Cancel to get \\(-\\frac1{${k}+\\sqrt{x}}\\), so the limit is \\(${tr(ans)}\\).`,{k,a});
 }
 return problem('rationalizing','rationalizing_polynomial_companion','rat-extra-poly-sqrt3',`\\(\\displaystyle\\lim_{x\\to3}\\frac{x^2-9}{\\sqrt{x}-\\sqrt3}\\)`,exact(12*Math.sqrt(3),'12\\sqrt3','12*sqrt(3)'),`Factor \\(x^2-9=(x-3)(x+3)\\), then rationalize with \\(\\sqrt{x}+\\sqrt3\\). Because \\(x-3=(\\sqrt{x}-\\sqrt3)(\\sqrt{x}+\\sqrt3)\\), the quotient becomes \\((x+3)(\\sqrt{x}+\\sqrt3)\\). Substitution gives \\(6(2\\sqrt3)=12\\sqrt3\\).`,{a:3});
}

function complex(){
 let a,b,c,A,B;for(let tries=0;tries<200;tries++){a=pick([-4,-3,-2,2,3,4]);b=ri(1,7);c=pick([-5,-4,-2,2,4,5].filter(v=>a+v!==0));A=ri(1,6);const candidate=A*(a+c)/(a*a+b);if(Number.isInteger(candidate)&&candidate!==0&&A%Math.abs(candidate)===0){B=candidate;break;}}
 if(!B){a=3;b=1;c=2;A=2;B=1;}
 const r2=A/B-a,ans=rat(-B*(a-r2),(a*a+b)*(a+c)),xa=shift('x',a),xc=shift('x',-c);
 const displayedDifference=B<0?`\\frac{${A}}{x^2+${b}}+\\frac{${-B}}{${xc}}`:`\\frac{${A}}{x^2+${b}}-\\frac{${B}}{${xc}}`;
 const combinedNumerator=`${A}(${xc})${term(-B,`(x^2+${b})`)}`;
 const factoredNumerator=term(-B,`(${xa})(${shift('x',r2)})`,true);
 const simplified=B<0?`\\frac{${-B}(${shift('x',r2)})}{(x^2+${b})(${xc})}`:`-\\frac{${B}(${shift('x',r2)})}{(x^2+${b})(${xc})}`;
 return problem('complex','complex_two_variable_fractions',`cf-extra-two-variable-${A}-${B}-${a}-${b}-${c}`,`\\(\\displaystyle\\lim_{x\\to${a}}\\frac{${displayedDifference}}{${xa}}\\)`,ans,`Use the common denominator \\((x^2+${b})(${xc})\\). The numerator becomes \\(${combinedNumerator}=${factoredNumerator}\\). Cancel \\(${xa}\\) from the full quotient. Substituting \\(x=${a}\\) into \\(${simplified}\\) gives \\(${tr(ans)}\\).`,{A,B,a,b,c,r2});
}

window.BMUnit1CoreExpansions={continuous,factoring,substitution,rationalizing,complex,rat,exact,texAnswer:tr};
})();
