(function(){
'use strict';

/*
 * BatchMath AP Calculus AB Unit 3
 * Shared Optimization / Related Rates curriculum expansion (v12.7).
 *
 * Loaded after unit3-applications-generators.js on the two focused topics and
 * both Unit 3 comprehensive-review pages.  This deliberately reuses the
 * existing renderer, typed-answer parser, keypad, feedback, and analytics
 * infrastructure while replacing only these two generators.
 */

var previousApi=window.BatchMathAPTopicGenerators;
var previousUnit3=window.BatchMathUnit3ApplicationsGenerators;
var random=function(){return window.BatchMathRNG&&window.BatchMathRNG.random?window.BatchMathRNG.random():0.5;};
var integer=function(a,b){return Math.floor(random()*(b-a+1))+a;};
var pick=function(values){return values[Math.floor(random()*values.length)];};
var gcd=function(a,b){a=Math.abs(Math.round(a));b=Math.abs(Math.round(b));while(b){var t=b;b=a%b;a=t;}return a||1;};
var trim=function(value,places){var n=Number(value);if(Number.isInteger(n))return String(n);return n.toFixed(places==null?6:places).replace(/0+$/,'').replace(/\.$/,'');};
var modeOf=function(options){var value=String(options&&options.mode||'noncalculator').toLowerCase();return value.indexOf('calculator')>=0&&value.indexOf('non')<0?'calculator':'noncalculator';};

function rational(n,d){
  if(d<0){n=-n;d=-d;}
  var factor=gcd(n,d);n=Math.round(n/factor);d=Math.round(d/factor);
  return{
    value:n/d,
    input:d===1?String(n):'('+n+')/('+d+')',
    tex:d===1?String(n):(n<0?'-':'')+'\\frac{'+Math.abs(n)+'}{'+d+'}'
  };
}
function signedTerm(n,body,first){
  if(!n)return'';
  var absolute=Math.abs(n),coefficient=absolute===1&&body?'':String(absolute);
  if(first)return(n<0?'-':'')+coefficient+body;
  return(n<0?' - ':' + ')+coefficient+body;
}
function questionHtml(prompt,math){
  return '<div><div class="question-prompt">'+prompt+'</div>'+(math?'<div>\\('+math+'\\)</div>':'')+'</div>';
}
function worked(steps){
  return '<div class="worked-steps">'+steps.map(function(step,index){
    return '<p><strong>Step '+(index+1)+':</strong> '+step+'</p>';
  }).join('')+'</div>';
}
function exactProblem(spec){
  var accepted=[String(spec.answer)];
  (spec.accepted||[]).forEach(function(value){accepted.push(String(value));});
  return{
    id:spec.id,
    variant:spec.variant,
    questionHtml:questionHtml(spec.prompt,spec.math||''),
    answerType:'exact-expression',
    expressionAnswer:String(spec.answer),
    acceptedExpressions:accepted,
    answerTex:String(spec.answerTex==null?spec.answer:spec.answerTex),
    expressionPlaceholder:'Enter the exact value',
    explanation:worked(spec.steps),
    fullWidthChoices:true
  };
}
function numericProblem(spec){
  var prompt=spec.prompt;
  if(!/exactly three decimal places/i.test(prompt)){
    prompt+=' Round your final answer to exactly three decimal places. Do not round intermediate work.';
  }
  return{
    id:spec.id,
    variant:spec.variant,
    questionHtml:questionHtml(prompt,spec.math||''),
    answerType:'numeric',
    numericAnswer:Number(spec.value),
    numericTolerance:0.000500000001,
    requiredDecimals:3,
    answerTex:Number(spec.value).toFixed(3),
    numericPlaceholder:'Enter an answer with exactly three decimal places',
    explanation:worked(spec.steps),
    fullWidthChoices:true,
    calculatorActive:true
  };
}
function finish(problem,slug,mode,source,family){
  problem.topicSlug=slug;
  problem.calculatorActive=mode==='calculator';
  problem.sourceKind=source;
  problem.sourceWeight=source==='test'?15:85;
  problem.formulaGroup=source==='extension'?'extension':'course';
  problem.familyId=family;
  problem.unit3V11=true;
  problem.data={unit:'ap_calc_unit_3',mode:mode,sourceKind:source,family:family};
  return problem;
}
function scalarProblem(spec){
  var problem=spec.mode==='calculator'?numericProblem(spec):exactProblem(spec);
  return finish(problem,spec.slug,spec.mode,spec.source,spec.family);
}

var recentFamilies={};
function diverse(key,descriptors){
  var history=recentFamilies[key]||(recentFamilies[key]=[]);
  var choices=descriptors.filter(function(item){return history.indexOf(item.history||item.family)<0;});
  if(!choices.length)choices=descriptors.slice();
  var selected=pick(choices);
  var marker=selected.history||selected.family;
  history.push(marker);
  while(history.length>7)history.shift();
  return selected;
}
function descriptor(family,source,build,history){
  return{family:family,source:source,build:build,history:history||family};
}
function sourcePool(assignment,test,extension){
  var roll=random();
  if(roll<0.15)return{source:'test',pool:test};
  if(roll<0.75)return{source:'assignment',pool:assignment};
  return{source:'extension',pool:extension};
}
function calcOrExact(mode,calculatorValue,exactInput,exactTex){
  return mode==='calculator'
    ?{value:Number(calculatorValue),answer:null,answerTex:null}
    :{value:null,answer:String(exactInput),answerTex:String(exactTex==null?exactInput:exactTex)};
}
function secondDerivativeConclusion(symbol,value,kind){
  return 'Here \\('+symbol+'='+value+'\\), so the critical point gives the required '+kind+'.';
}
function calculatorCritical(value,symbol){
  return 'A graphing-calculator zero command applied to the derivative gives the relevant critical value \\('+(symbol||'x')+'\\approx'+Number(value).toFixed(6)+'\\). Keep the full stored value for the remaining calculations.';
}

/* ------------------------------ Optimization ----------------------------- */

function optSquareCorner(mode,source){
  var L=mode==='calculator'?pick([17.3,22.6,31.4,43.7]):6*integer(2,9);
  var x=L/6,V=x*Math.pow(L-2*x,2),answer=calcOrExact(mode,x,trim(x),trim(x));
  var Ls=trim(L,1),xs=trim(x,6);
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'open_top_square_cardboard',id:'u3-v127-opt-square-'+mode+'-'+Ls,
    variant:'optimization_open_top_square_cardboard',
    prompt:'Squares of side \\(x\\) are cut from the corners of a square piece of cardboard with side length \\('+Ls+'\\) inches. Find the cut size that produces the maximum-volume open box.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x\\) be the cut size in inches. The box has height \\(x\\) and square base side \\('+Ls+'-2x\\).',
      'The quantity to maximize is volume: \\(V=x('+Ls+'-2x)^2\\). The physical domain is \\(0<x<'+trim(L/2,3)+'\\).',
      'Differentiate the actual objective: \\(V^{\\prime}(x)=('+Ls+'-2x)('+Ls+'-6x)\\).',
      (mode==='calculator'?calculatorCritical(x):'Solving \\(V^{\\prime}(x)=0\\) gives the interior critical value \\(x='+xs+'\\). The other zero, \\(x='+trim(L/2,3)+'\\), is the boundary where the box collapses.'),
      'The endpoint volumes are \\(0\\), and \\(V^{\\prime}\\) changes from positive to negative at \\(x='+xs+'\\), so this critical point gives the absolute maximum.',
      'The resulting box is \\('+trim(L-2*x,6)+'\\) inches by \\('+trim(L-2*x,6)+'\\) inches by \\('+xs+'\\) inches, with maximum volume \\('+trim(V,6)+'\\) cubic inches.',
      'Therefore the requested cut size is \\('+xs+'\\) inches'+(mode==='calculator'?', which rounds to \\('+x.toFixed(3)+'\\) inches.':'.')
    ]
  });
}

function optRectangularCardboard(mode,source){
  var scale=mode==='calculator'?1:pick([1,2,3]);
  var length=mode==='calculator'?pick([27.8,33.6,41.5]):30*scale;
  var width=mode==='calculator'?pick([13.7,19.2,24.8]):14*scale;
  if(width>=length){var swap=width;width=length;length=swap;}
  var discriminant=length*length-length*width+width*width;
  var x=(length+width-Math.sqrt(discriminant))/6;
  var V=x*(length-2*x)*(width-2*x),answer=calcOrExact(mode,x,trim(x),trim(x));
  var L=trim(length,1),W=trim(width,1),xs=trim(x,6);
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'open_top_rectangular_cardboard',id:'u3-v127-opt-rect-sheet-'+mode+'-'+L+'-'+W,
    variant:'optimization_open_top_rectangular_cardboard',
    prompt:'An open box is made by cutting congruent squares from a \\('+L+'\\)-inch by \\('+W+'\\)-inch piece of cardboard. Find the cut size that maximizes volume.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x\\) be the side length of each removed square. The box dimensions are \\('+L+'-2x\\), \\('+W+'-2x\\), and \\(x\\).',
      'Maximize \\(V(x)=x('+L+'-2x)('+W+'-2x)\\) on \\(0<x<'+trim(width/2,3)+'\\).',
      'Differentiate and combine like terms: \\(V^{\\prime}(x)=12x^2-4('+trim(length+width,2)+')x+'+trim(length*width,2)+'\\).',
      (mode==='calculator'?calculatorCritical(x):'Factoring the derivative gives the relevant interior critical value \\(x='+xs+'\\).'),
      'The second derivative is \\(V^{\\prime\\prime}(x)=24x-4('+trim(length+width,2)+')\\), which is negative at \\(x='+xs+'\\); the endpoint volumes are also zero.',
      'The maximizing box dimensions are \\('+trim(length-2*x,6)+'\\) by \\('+trim(width-2*x,6)+'\\) by \\('+xs+'\\) inches.',
      'Thus the requested cut size is \\('+xs+'\\) inches'+(mode==='calculator'?', or \\('+x.toFixed(3)+'\\) inches to three decimals.':'.')
    ]
  });
}

function optSquareBaseMaterial(mode,source){
  var a=integer(3,10);
  var material=mode==='calculator'?pick([71.4,88.6,137.2]):3*a*a;
  var x=Math.sqrt(material/3),h=(material-x*x)/(4*x),volume=x*x*h;
  var answer=calcOrExact(mode,x,String(a),String(a));
  if(mode==='calculator')answer.value=x;
  var S=trim(material,1),xs=trim(x,6),hs=trim(h,6);
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'square_base_box_fixed_material',id:'u3-v127-opt-square-base-'+mode+'-'+S,
    variant:'optimization_square_base_open_box_fixed_material',
    prompt:'A box with a square base and no top is constructed from \\('+S+'\\) square inches of material. Find the base side length that maximizes its volume.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x\\) be the base side and \\(h\\) the height. Maximize \\(V=x^2h\\).',
      'The material constraint is \\(x^2+4xh='+S+'\\), so \\(h=\\frac{'+S+'-x^2}{4x}\\).',
      'Substitute into the objective: \\(V(x)=\\frac{'+S+'x-x^3}{4}\\), with \\(0<x<\\sqrt{'+S+'}\\).',
      'Differentiate: \\(V^{\\prime}(x)=\\frac{'+S+'-3x^2}{4}\\).',
      (mode==='calculator'?calculatorCritical(x):'Setting \\(V^{\\prime}(x)=0\\) gives \\(x='+xs+'\\).'),
      secondDerivativeConclusion('V^{\\prime\\prime}(x)','-\\frac32x<0','maximum'),
      'The corresponding height is \\(h='+hs+'\\), and the maximum volume is \\('+trim(volume,6)+'\\) cubic inches.',
      'Therefore the requested base side is \\('+xs+'\\) inches'+(mode==='calculator'?', which rounds to \\('+x.toFixed(3)+'\\).':'.')
    ]
  });
}

function optCylinder(mode,source,openTop){
  var a=integer(2,8);
  var C=mode==='calculator'?pick([73.6,128.5,211.7]):(openTop?a*a*a:2*a*a*a);
  var r=openTop?Math.cbrt(C):Math.cbrt(C/2);
  var h=C/(r*r);
  var answer=calcOrExact(mode,r,String(a),String(a));
  if(mode==='calculator')answer.value=r;
  var Ctext=trim(C,1),rs=trim(r,6),hs=trim(h,6);
  var surface=openTop?'\\pi r^2+2\\pi rh':'2\\pi r^2+2\\pi rh';
  var reduced=openTop?'\\pi r^2+\\frac{2('+Ctext+')\\pi}{r}':'2\\pi r^2+\\frac{2('+Ctext+')\\pi}{r}';
  var derivative=openTop?'2\\pi r-\\frac{2('+Ctext+')\\pi}{r^2}':'4\\pi r-\\frac{2('+Ctext+')\\pi}{r^2}';
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:openTop?'open_cylinder_fixed_volume':'closed_cylinder_fixed_volume',
    id:'u3-v127-opt-cylinder-'+(openTop?'open':'closed')+'-'+mode+'-'+Ctext,
    variant:openTop?'optimization_open_cylinder_fixed_volume':'optimization_closed_cylinder_fixed_volume',
    prompt:'A '+(openTop?'cylindrical container with no top':'closed cylindrical container')+' must hold \\('+Ctext+'\\pi\\) cubic units. Find the radius that uses the least material.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(r\\) be the radius and \\(h\\) the height. Minimize \\(S='+surface+'\\).',
      'The volume constraint is \\(\\pi r^2h='+Ctext+'\\pi\\), so \\(h=\\frac{'+Ctext+'}{r^2}\\).',
      'Substitution gives the one-variable objective \\(S(r)='+reduced+'\\), for \\(r>0\\).',
      'Differentiate: \\(S^{\\prime}(r)='+derivative+'\\).',
      (mode==='calculator'?calculatorCritical(r,'r'):'Solving \\(S^{\\prime}(r)=0\\) gives \\(r='+rs+'\\).'),
      'The derivative changes from negative to positive at this radius, so the surface area has an absolute minimum.',
      'The corresponding height is \\(h='+hs+'\\) units.',
      'Therefore the requested radius is \\('+rs+'\\) units'+(mode==='calculator'?', or \\('+r.toFixed(3)+'\\) units to three decimals.':'.')
    ]
  });
}

function optCylinderCost(mode,source){
  var baseCost=mode==='calculator'?pick([17.5,22.4,28.6]):20;
  var sideCost=mode==='calculator'?pick([8.2,11.3,13.7]):10;
  var a=integer(3,8);
  var C=mode==='calculator'?pick([287.3,436.8,612.5]):2*baseCost*a*a*a/sideCost;
  var r=Math.cbrt(sideCost*C/(2*baseCost)),h=C/(r*r);
  var answer=calcOrExact(mode,r,String(a),String(a));if(mode==='calculator')answer.value=r;
  var cb=trim(baseCost,1),cs=trim(sideCost,1),Ct=trim(C,1),rs=trim(r,6);
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'cylinder_different_material_costs',id:'u3-v127-opt-cylinder-cost-'+mode+'-'+cb+'-'+cs+'-'+Ct,
    variant:'optimization_cylinder_different_material_costs',
    prompt:'A closed cylinder has volume \\('+Ct+'\\pi\\) cubic inches. The two circular bases cost '+cb+' cents per square inch and the lateral material costs '+cs+' cents per square inch. Find the radius that minimizes cost.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(r\\) be the radius and \\(h\\) the height. The cost is \\(C='+cb+'(2\\pi r^2)+'+cs+'(2\\pi rh)\\).',
      'The volume constraint \\(\\pi r^2h='+Ct+'\\pi\\) gives \\(h=\\frac{'+Ct+'}{r^2}\\).',
      'The one-variable cost is \\(C(r)='+trim(2*baseCost,2)+'\\pi r^2+\\frac{'+trim(2*sideCost*C,3)+'\\pi}{r}\\), for \\(r>0\\).',
      'Differentiate: \\(C^{\\prime}(r)='+trim(4*baseCost,2)+'\\pi r-\\frac{'+trim(2*sideCost*C,3)+'\\pi}{r^2}\\).',
      (mode==='calculator'?calculatorCritical(r,'r'):'Solving \\(C^{\\prime}(r)=0\\) gives \\(r='+rs+'\\).'),
      'Because \\(C^{\\prime\\prime}(r)='+trim(4*baseCost,2)+'\\pi+\\frac{'+trim(4*sideCost*C,3)+'\\pi}{r^3}>0\\), this critical point is the absolute minimum.',
      'The matching height is \\(h='+trim(h,6)+'\\) inches.',
      'Therefore the cost-minimizing radius is \\('+rs+'\\) inches'+(mode==='calculator'?', or \\('+r.toFixed(3)+'\\) inches.':'.')
    ]
  });
}

function optRectangleFence(mode,source,barn){
  var fencing=mode==='calculator'?pick([83.5,117.8,146.3]):4*integer(12,35);
  var depth=fencing/4;
  var length=barn?fencing/2:fencing/4;
  var answer=calcOrExact(mode,depth,trim(depth),trim(depth));
  var F=trim(fencing,1),d=trim(depth,6),l=trim(length,6);
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:barn?'three_side_barn_fencing':'rectangular_fixed_perimeter_fencing',
    id:'u3-v127-opt-fence-'+(barn?'barn':'four')+'-'+mode+'-'+F,
    variant:barn?'optimization_barn_three_sides':'optimization_rectangle_fixed_fencing',
    prompt:(barn?'A rectangular enclosure uses a barn as one side. ':'A rectangular field is enclosed on all four sides. ')+'There are \\('+F+'\\) feet of fencing. Find the depth that maximizes area.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x\\) be the depth and \\(y\\) the other dimension. Maximize \\(A=xy\\).',
      (barn?'The constraint is \\(2x+y='+F+'\\), so \\(y='+F+'-2x\\).':'The constraint is \\(2x+2y='+F+'\\), so \\(y='+trim(fencing/2,3)+'-x\\).'),
      'Substitute to obtain \\(A(x)='+(barn?'x('+F+'-2x)':'x('+trim(fencing/2,3)+'-x')+'\\).',
      'Differentiate: \\(A^{\\prime}(x)='+(barn?F+'-4x':trim(fencing/2,3)+'-2x')+'\\).',
      'The only interior critical value is \\(x='+d+'\\).',
      'Since \\(A^{\\prime\\prime}(x)='+(barn?'-4':'-2')+'<0\\), this value gives the absolute maximum.',
      'The maximizing dimensions are \\('+d+'\\) feet by \\('+l+'\\) feet.',
      'Therefore the requested depth is \\('+d+'\\) feet'+(mode==='calculator'?', or \\('+depth.toFixed(3)+'\\) feet.':'.')
    ]
  });
}

function optLinearRevenue(mode,source,context){
  var base=context==='hotel'?integer(25,35):integer(40,80);
  var optimum=context==='hotel'?integer(base+8,base+24):integer(180,420);
  var decrease=context==='hotel'?(mode==='calculator'?pick([1.15,1.35,1.6]):pick([1,2])):(mode==='calculator'?pick([0.017,0.023,0.031]):pick([0.02,0.04]));
  var initial=decrease*(2*optimum-base);
  var maximum=optimum*(initial-decrease*(optimum-base));
  var answer=calcOrExact(mode,optimum,String(optimum),String(optimum));
  if(mode==='calculator')answer.value=optimum;
  var b=trim(base),p=trim(initial,3),d=trim(decrease,3),q=trim(optimum,6);
  var subject=context==='hotel'?'rooms':'pairs';
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:context==='hotel'?'hotel_room_revenue':'wholesale_order_revenue',
    id:'u3-v127-opt-revenue-'+context+'-'+mode+'-'+base+'-'+optimum,
    variant:context==='hotel'?'optimization_hotel_revenue':'optimization_wholesale_revenue',
    prompt:(context==='hotel'
      ?'A hotel charges $'+p+' per room for an organization reserving '+b+' rooms. For each room above '+b+', the price of every room decreases by $'+d+'.'
      :'A wholesaler charges $'+p+' per pair for an order of '+b+' pairs. For each additional pair ordered, the price of every pair decreases by $'+d+'.')+' How many '+subject+' maximize revenue?',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(q\\) be the total number of '+subject+'. The per-'+(context==='hotel'?'room':'pair')+' price is \\(p(q)='+p+'-'+d+'(q-'+b+')\\).',
      'The quantity to maximize is revenue: \\(R(q)=q['+p+'-'+d+'(q-'+b+')]\\).',
      'After expanding, \\(R(q)=-'+d+'q^2+'+trim(initial+decrease*base,3)+'q\\).',
      'Differentiate: \\(R^{\\prime}(q)=-'+trim(2*decrease,3)+'q+'+trim(initial+decrease*base,3)+'\\).',
      'Solving \\(R^{\\prime}(q)=0\\) gives \\(q='+q+'\\).',
      'Because \\(R^{\\prime\\prime}(q)=-'+trim(2*decrease,3)+'<0\\), this critical point gives maximum revenue.',
      'At this order size the revenue is $'+trim(maximum,2)+'.',
      'Therefore \\('+q+'\\) '+subject+' should be '+(context==='hotel'?'reserved':'ordered')+(mode==='calculator'?', entered as \\('+Number(optimum).toFixed(3)+'\\).':'.')
    ]
  });
}

function optOrchard(mode,source){
  var base=integer(18,30),loss=mode==='calculator'?pick([7.5,9.5,12.5]):pick([8,10,12]);
  var extra=integer(8,22),yieldAtBase=loss*(base+2*extra);
  var total=base+extra,maxYield=total*(yieldAtBase-loss*extra);
  var answer=calcOrExact(mode,total,String(total),String(total));if(mode==='calculator')answer.value=total;
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'orchard_yield',id:'u3-v127-opt-orchard-'+mode+'-'+base+'-'+total,
    variant:'optimization_orchard_yield',
    prompt:'An orchard produces \\('+trim(yieldAtBase,2)+'\\) pieces of fruit per tree when \\('+base+'\\) trees are planted per acre. Each additional tree reduces every tree’s yield by \\('+trim(loss,2)+'\\). How many trees per acre maximize the total yield?',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x\\) be the number of additional trees. Then there are \\('+base+'+x\\) trees and each produces \\('+trim(yieldAtBase,2)+'-'+trim(loss,2)+'x\\) pieces of fruit.',
      'Maximize \\(Y(x)=('+base+'+x)('+trim(yieldAtBase,2)+'-'+trim(loss,2)+'x)\\), with \\(x\\ge0\\).',
      'Differentiate: \\(Y^{\\prime}(x)='+trim(yieldAtBase-loss*base,2)+'-'+trim(2*loss,2)+'x\\).',
      'Setting the derivative equal to zero gives \\(x='+extra+'\\).',
      'Since \\(Y^{\\prime\\prime}(x)=-'+trim(2*loss,2)+'<0\\), the critical point is a maximum.',
      'The total number of trees is \\('+base+'+'+extra+'='+total+'\\).',
      'The maximum modeled yield is \\('+trim(maxYield,2)+'\\) pieces of fruit per acre.',
      'Therefore the orchard should plant \\('+total+'\\) trees per acre'+(mode==='calculator'?', entered as \\('+total.toFixed(3)+'\\).':'.')
    ]
  });
}

function optTriangleWindow(mode,source){
  var perimeter=mode==='calculator'?pick([11.7,14.3,18.6]):pick([12,18,24]);
  var width=perimeter/(6-Math.sqrt(3));
  var height=(perimeter-3*width)/2;
  var answer=mode==='calculator'?calcOrExact(mode,width,'',''):{answer:String(perimeter)+'/(6-sqrt(3))',answerTex:'\\frac{'+trim(perimeter)+'}{6-\\sqrt3}',value:null};
  if(mode==='calculator')answer.value=width;
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'equilateral_triangle_window',id:'u3-v127-opt-window-'+mode+'-'+trim(perimeter,1),
    variant:'optimization_rectangle_equilateral_triangle_window',
    prompt:'A window is a rectangle topped by an equilateral triangle. Its outside perimeter is \\('+trim(perimeter,1)+'\\) feet. Find the rectangle’s width that maximizes the total window area.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(w\\) be the rectangle width and \\(h\\) its height. Maximize \\(A=wh+\\frac{\\sqrt3}{4}w^2\\).',
      'The outside-perimeter constraint is \\(3w+2h='+trim(perimeter,1)+'\\), so \\(h=\\frac{'+trim(perimeter,1)+'-3w}{2}\\).',
      'Substitution gives \\(A(w)=\\frac{'+trim(perimeter,1)+'w-3w^2}{2}+\\frac{\\sqrt3}{4}w^2\\).',
      'Differentiate: \\(A^{\\prime}(w)=\\frac{'+trim(perimeter,1)+'}{2}-3w+\\frac{\\sqrt3}{2}w\\).',
      (mode==='calculator'?calculatorCritical(width,'w'):'Solving \\(A^{\\prime}(w)=0\\) gives \\(w=\\frac{'+trim(perimeter)+'}{6-\\sqrt3}\\).'),
      'Because \\(A^{\\prime\\prime}(w)=-3+\\frac{\\sqrt3}{2}<0\\), this critical value gives the maximum area.',
      'The matching rectangle height is \\(h\\approx'+trim(height,6)+'\\) feet.',
      'Therefore the requested width is '+(mode==='calculator'?'\\('+width.toFixed(3)+'\\) feet.':'\\(\\frac{'+trim(perimeter)+'}{6-\\sqrt3}\\) feet.')
    ]
  });
}

function optSemicircleRectangle(mode,source){
  var radius=mode==='calculator'?pick([4.7,6.3,9.2]):integer(2,10);
  var half=radius/Math.sqrt(2),width=2*half,height=Math.sqrt(radius*radius-half*half);
  var exactInput=trim(radius)+'*sqrt(2)',exactTex=trim(radius)+'\\sqrt2';
  var answer=calcOrExact(mode,width,exactInput,exactTex);
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'rectangle_in_semicircle',id:'u3-v127-opt-semicircle-'+mode+'-'+trim(radius,1),
    variant:'optimization_rectangle_inscribed_semicircle',
    prompt:'A rectangle is inscribed in a semicircle of radius \\('+trim(radius,1)+'\\), with its base on the diameter. Find the rectangle’s full width when its area is largest.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x\\) be half the rectangle’s width and \\(y\\) its height. Maximize \\(A=2xy\\).',
      'The semicircle constraint is \\(x^2+y^2='+trim(radius*radius,2)+'\\), so \\(y=\\sqrt{'+trim(radius*radius,2)+'-x^2}\\).',
      'Thus \\(A(x)=2x\\sqrt{'+trim(radius*radius,2)+'-x^2}\\), with \\(0\\le x\\le'+trim(radius,1)+'\\).',
      'Differentiate: \\(A^{\\prime}(x)=\\frac{2('+trim(radius*radius,2)+'-2x^2)}{\\sqrt{'+trim(radius*radius,2)+'-x^2}}\\).',
      (mode==='calculator'?calculatorCritical(half):'The interior critical value is \\(x=\\frac{'+trim(radius)+'}{\\sqrt2}\\).'),
      'The endpoint areas are zero and the derivative changes from positive to negative at this critical value, so it gives the absolute maximum.',
      'The full width is \\(2x='+trim(width,6)+'\\) and the height is \\('+trim(height,6)+'\\).',
      'Therefore the requested width is '+(mode==='calculator'?'\\('+width.toFixed(3)+'\\).':'\\('+exactTex+'\\).')
    ]
  });
}

function optPageMargins(mode,source){
  var horizontal=mode==='calculator'?pick([1.6,2.4,3.2]):2;
  var vertical=mode==='calculator'?pick([1.1,1.7,2.3]):1.5;
  var area=mode==='calculator'?pick([91.7,126.4,173.8]):108;
  var width=Math.sqrt(horizontal*area/vertical),height=area/width;
  var answer=calcOrExact(mode,width,'12','12');if(mode==='calculator')answer.value=width;
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'page_printed_area',id:'u3-v127-opt-page-'+mode+'-'+trim(area,1),
    variant:'optimization_page_printed_area',
    prompt:'A page has total area \\('+trim(area,1)+'\\) square inches. The combined left-and-right margins use \\('+trim(horizontal,1)+'\\) inches of width, and the combined top-and-bottom margins use \\('+trim(vertical,1)+'\\) inches of height. Find the page width that maximizes printed area.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(w\\) and \\(h\\) be the page dimensions. Maximize printed area \\(P=(w-'+trim(horizontal,1)+')(h-'+trim(vertical,1)+')\\).',
      'The page-area constraint is \\(wh='+trim(area,1)+'\\), so \\(h=\\frac{'+trim(area,1)+'}{w}\\).',
      'Substitute: \\(P(w)=(w-'+trim(horizontal,1)+')(\\frac{'+trim(area,1)+'}{w}-'+trim(vertical,1)+')\\), with \\(w>'+trim(horizontal,1)+'\\).',
      'Differentiate and simplify: \\(P^{\\prime}(w)=-'+trim(vertical,1)+'+\\frac{'+trim(horizontal*area,3)+'}{w^2}\\).',
      (mode==='calculator'?calculatorCritical(width,'w'):'Solving \\(P^{\\prime}(w)=0\\) gives \\(w=12\\).'),
      'The second derivative is negative for \\(w>0\\), so this critical value gives the maximum printed area.',
      'The matching page height is \\(h='+trim(height,6)+'\\) inches.',
      'Therefore the requested page width is \\('+trim(width,6)+'\\) inches'+(mode==='calculator'?', or \\('+width.toFixed(3)+'\\) inches.':'.')
    ]
  });
}

function optClosestSquareRoot(mode,source){
  var point=mode==='calculator'?pick([5.8,7.35,9.6]):pick([5,7,9]);
  var x=point-0.5,y=Math.sqrt(x),distance=Math.sqrt((x-point)*(x-point)+x);
  var exact=rational(Math.round(2*point-1),2);
  var answer=calcOrExact(mode,x,exact.input,exact.tex);
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'closest_point_square_root',id:'u3-v127-opt-close-root-'+mode+'-'+trim(point,2),
    variant:'optimization_closest_point_square_root',
    prompt:'Find the \\(x\\)-coordinate of the point on \\(y=\\sqrt{x}\\) that is closest to \\(('+trim(point,2)+',0)\\).',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'A point on the curve is \\((x,\\sqrt{x})\\), with \\(x\\ge0\\).',
      'Minimizing distance is equivalent to minimizing its square: \\(D(x)=(x-'+trim(point,2)+')^2+x\\).',
      'Differentiate: \\(D^{\\prime}(x)=2(x-'+trim(point,2)+')+1\\).',
      'Setting \\(D^{\\prime}(x)=0\\) gives \\(x='+trim(x,6)+'\\).',
      'Since \\(D^{\\prime\\prime}(x)=2>0\\), this critical value gives the absolute minimum distance.',
      'The corresponding point is \\(('+trim(x,6)+','+trim(y,6)+')\\).',
      'Its distance from the given point is approximately \\('+trim(distance,6)+'\\).',
      'Therefore the requested \\(x\\)-coordinate is \\('+trim(x,6)+'\\)'+(mode==='calculator'?', or \\('+x.toFixed(3)+'\\) to three decimals.':'.')
    ]
  });
}

function optPoleCable(mode,source){
  var left=mode==='calculator'?pick([5.6,7.4,9.1]):pick([6,8,12]);
  var right=mode==='calculator'?pick([8.3,10.7,13.2]):pick([8,12,15]);
  var distance=mode==='calculator'?pick([17.5,24.8,31.6]):pick([10,20,30]);
  var x=left*distance/(left+right);
  var length=Math.hypot(x,left)+Math.hypot(distance-x,right);
  var exact=rational(left*distance,left+right);
  var answer=mode==='calculator'?calcOrExact(mode,x,'',''):{answer:exact.input,answerTex:exact.tex,value:null};
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'two_poles_minimum_cable',id:'u3-v127-opt-poles-'+mode+'-'+trim(left,1)+'-'+trim(right,1)+'-'+trim(distance,1),
    variant:'optimization_two_poles_minimum_cable',
    prompt:'Two vertical poles are \\('+trim(distance,1)+'\\) feet apart and have heights \\('+trim(left,1)+'\\) and \\('+trim(right,1)+'\\) feet. A cable runs from the top of each pole to one common ground stake between them. Find the stake’s distance from the shorter/left pole that minimizes total cable.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x\\) be the stake’s distance from the left pole. The two cable lengths are \\(\\sqrt{x^2+'+trim(left*left,3)+'}\\) and \\(\\sqrt{('+trim(distance,1)+'-x)^2+'+trim(right*right,3)+'}\\).',
      'Minimize \\(L(x)=\\sqrt{x^2+'+trim(left*left,3)+'}+\\sqrt{('+trim(distance,1)+'-x)^2+'+trim(right*right,3)+'}\\) on \\(0\\le x\\le'+trim(distance,1)+'\\).',
      'Differentiate: \\(L^{\\prime}(x)=\\frac{x}{\\sqrt{x^2+'+trim(left*left,3)+'}}-\\frac{'+trim(distance,1)+'-x}{\\sqrt{('+trim(distance,1)+'-x)^2+'+trim(right*right,3)+'}}\\).',
      (mode==='calculator'?calculatorCritical(x):'Solving \\(L^{\\prime}(x)=0\\) gives \\(x=\\frac{'+trim(left*distance,3)+'}{'+trim(left+right,3)+'}='+exact.tex+'\\).'),
      'Each square-root distance function is convex, so their sum is convex and this critical point gives the absolute minimum.',
      'The two cable segments have lengths \\('+trim(Math.hypot(x,left),6)+'\\) and \\('+trim(Math.hypot(distance-x,right),6)+'\\) feet.',
      'The minimum total cable length is \\('+trim(length,6)+'\\) feet.',
      'Therefore the stake should be placed \\('+trim(x,6)+'\\) feet from the left pole'+(mode==='calculator'?', or \\('+x.toFixed(3)+'\\) feet.':'.')
    ]
  });
}

function optLadderFence(mode,source){
  var pair=mode==='calculator'?pick([[7.4,1.8],[9.6,2.7],[12.3,3.4]]):pick([[8,1],[8,8],[27,1]]);
  var height=pair[0],gap=pair[1];
  var a=Math.cbrt(height),b=Math.cbrt(gap),length=Math.pow(a*a+b*b,1.5);
  var critical=Math.cbrt(gap*height*height);
  var answer;
  if(mode==='calculator')answer=calcOrExact(mode,length,'','');
  else{
    var base=a*a+b*b;
    var root=Math.sqrt(base);
    if(Number.isInteger(root))answer={answer:String(root*root*root),answerTex:String(root*root*root),value:null};
    else answer={answer:trim(base)+'*sqrt('+trim(base)+')',answerTex:trim(base)+'\\sqrt{'+trim(base)+'}',value:null};
  }
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'shortest_ladder_over_fence',id:'u3-v127-opt-ladder-fence-'+mode+'-'+trim(height,1)+'-'+trim(gap,1),
    variant:'optimization_shortest_ladder_over_fence',
    prompt:'A \\('+trim(height,1)+'\\)-foot fence is parallel to a building and \\('+trim(gap,1)+'\\) feet from it. Find the length of the shortest ladder that reaches from the ground over the fence to the building.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x>0\\) be the horizontal distance from the ladder’s foot to the fence. Similar triangles make the ladder length \\(L(x)=\\frac{x+'+trim(gap,1)+'}{x}\\sqrt{x^2+'+trim(height*height,3)+'}\\).',
      'The objective is to minimize this \\(L(x)\\) for \\(x>0\\).',
      'Logarithmic differentiation gives \\(\\frac{L^{\\prime}(x)}{L(x)}=\\frac1{x+'+trim(gap,1)+'}-\\frac1x+\\frac{x}{x^2+'+trim(height*height,3)+'}\\).',
      'Setting \\(L^{\\prime}(x)=0\\) simplifies to \\(x^3='+trim(gap*height*height,4)+'\\), so \\(x='+trim(critical,6)+'\\).',
      'The ladder length tends to infinity at both ends of the domain, so the interior critical point gives the absolute minimum.',
      'Substitution gives \\(L_{\\min}=('+trim(Math.pow(height,2/3),6)+'+'+trim(Math.pow(gap,2/3),6)+')^{3/2}\\).',
      'For the given measurements, \\(L_{\\min}='+trim(length,6)+'\\) feet.',
      'Therefore the shortest ladder is '+(mode==='calculator'?'\\('+length.toFixed(3)+'\\) feet.':'\\('+answer.answerTex+'\\) feet.')
    ]
  });
}

function optConeFromTriangle(mode,source){
  var scale=integer(1,5),hypotenuse=mode==='calculator'?pick([3.7,5.4,7.8]):Math.sqrt(3)*scale;
  var height=hypotenuse/Math.sqrt(3),radius=hypotenuse*Math.sqrt(2/3),volume=Math.PI*radius*radius*height/3;
  var answer=calcOrExact(mode,height,String(scale),String(scale));
  var hypotenuseText=mode==='calculator'?trim(hypotenuse,3):(scale===1?'\\sqrt3':scale+'\\sqrt3');
  var hypotenuseSquaredText=mode==='calculator'?trim(hypotenuse*hypotenuse,6):String(3*scale*scale);
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'maximum_cone_from_right_triangle',id:'u3-v127-opt-cone-triangle-'+mode+'-'+trim(hypotenuse,3),
    variant:'optimization_cone_from_right_triangle',
    prompt:'A right triangle with fixed hypotenuse \\('+hypotenuseText+'\\) is revolved about one leg to form a cone. Find the cone height that maximizes volume.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(h\\) be the cone height and \\(r\\) its radius. Maximize \\(V=\\frac13\\pi r^2h\\).',
      'The right-triangle constraint is \\(r^2+h^2='+hypotenuseSquaredText+'\\), so \\(r^2='+hypotenuseSquaredText+'-h^2\\).',
      'Substitution gives \\(V(h)=\\frac\\pi3('+hypotenuseSquaredText+'h-h^3)\\), with \\(0<h<'+hypotenuseText+'\\).',
      'Differentiate: \\(V^{\\prime}(h)=\\frac\\pi3('+hypotenuseSquaredText+'-3h^2)\\).',
      (mode==='calculator'?calculatorCritical(height,'h'):'Solving \\(V^{\\prime}(h)=0\\) gives \\(h='+trim(height,6)+'\\).'),
      'Since \\(V^{\\prime\\prime}(h)=-2\\pi h<0\\), this critical point gives maximum volume.',
      'The corresponding radius is \\(r='+trim(radius,6)+'\\), and the maximum volume is \\('+trim(volume,6)+'\\).',
      'Therefore the requested height is \\('+trim(height,6)+'\\)'+(mode==='calculator'?', or \\('+height.toFixed(3)+'\\).':'.')
    ]
  });
}

function optMovingShips(mode,source){
  var separation=mode==='calculator'?pick([27.5,36.2,48.7]):30;
  var north=mode==='calculator'?pick([12.4,16.7,19.3]):15;
  var west=mode==='calculator'?pick([8.6,11.2,14.8]):10;
  var time=separation*north/(north*north+west*west);
  var exact=rational(separation*north,north*north+west*west);
  var answer=mode==='calculator'?calcOrExact(mode,time,'',''):{answer:exact.input,answerTex:exact.tex,value:null};
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'minimum_distance_moving_ships',id:'u3-v127-opt-ships-'+mode+'-'+trim(separation,1),
    variant:'optimization_minimum_distance_moving_objects',
    prompt:'At noon, ship A is \\('+trim(separation,1)+'\\) miles south of ship B and sails north at \\('+trim(north,1)+'\\) mph while ship B sails west at \\('+trim(west,1)+'\\) mph. How many hours after noon are the ships closest?',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(t\\) be hours after noon. The east-west separation is \\('+trim(west,1)+'t\\), and the north-south separation is \\('+trim(separation,1)+'-'+trim(north,1)+'t\\).',
      'Minimize squared distance \\(D(t)=('+trim(west,1)+'t)^2+('+trim(separation,1)+'-'+trim(north,1)+'t)^2\\), for \\(t\\ge0\\).',
      'Differentiate: \\(D^{\\prime}(t)=2('+trim(west*west+north*north,3)+')t-'+trim(2*separation*north,3)+'\\).',
      'Setting \\(D^{\\prime}(t)=0\\) gives \\(t='+trim(time,6)+'\\).',
      'Because \\(D^{\\prime\\prime}(t)=2('+trim(west*west+north*north,3)+')>0\\), this is the absolute minimum distance.',
      'At that time both coordinate separations are physically meaningful.',
      'The actual distance is minimized at the same time because square root is increasing.',
      'Therefore the ships are closest after \\('+trim(time,6)+'\\) hours'+(mode==='calculator'?', or \\('+time.toFixed(3)+'\\) hours.':'.')
    ]
  });
}

function optParabolaRectangle(mode,source){
  var k=mode==='calculator'?pick([0.7,1.3,1.8]):pick([1,2,3]);
  var a=integer(1,5);
  var height=mode==='calculator'?pick([13.4,21.7,29.6]):3*k*a*a;
  var half=Math.sqrt(height/(3*k)),width=2*half,rectHeight=height-k*half*half;
  var answer=calcOrExact(mode,width,String(2*a),String(2*a));if(mode==='calculator')answer.value=width;
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'rectangle_under_parabola',id:'u3-v127-opt-parabola-'+mode+'-'+trim(k,1)+'-'+trim(height,1),
    variant:'optimization_rectangle_under_parabola',
    prompt:'A rectangle is symmetric about the \\(y\\)-axis, has its base on the \\(x\\)-axis, and its upper corners on \\(y='+trim(height,1)+'-'+trim(k,1)+'x^2\\). Find the full width that maximizes area.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x>0\\) be half the width. Then the rectangle height is \\('+trim(height,1)+'-'+trim(k,1)+'x^2\\).',
      'Maximize \\(A(x)=2x('+trim(height,1)+'-'+trim(k,1)+'x^2)\\) on the interval where the height is nonnegative.',
      'Differentiate: \\(A^{\\prime}(x)=2('+trim(height,1)+')-6('+trim(k,1)+')x^2\\).',
      'The positive critical value is \\(x='+trim(half,6)+'\\).',
      'Since \\(A^{\\prime\\prime}(x)=-12('+trim(k,1)+')x<0\\) for \\(x>0\\), the critical point gives the maximum.',
      'The full width is \\(2x='+trim(width,6)+'\\), and the matching height is \\('+trim(rectHeight,6)+'\\).',
      'The endpoint rectangles have zero area.',
      'Therefore the requested width is \\('+trim(width,6)+'\\)'+(mode==='calculator'?', or \\('+width.toFixed(3)+'\\).':'.')
    ]
  });
}

function optPigPen(mode,source){
  var side=mode==='calculator'?pick([3.2,4.7,5.6]):pick([3,5]);
  var derivative=function(base){
    var root=Math.sqrt(4*side*side-base*base);
    return side+(4*side*side-2*base*base)/(4*root);
  };
  var lo=0.0001,hi=2*side-0.0001;
  for(var i=0;i<90;i++){var mid=(lo+hi)/2;if(derivative(mid)>0)lo=mid;else hi=mid;}
  var base=(lo+hi)/2;
  var area=side*base+base*Math.sqrt(4*side*side-base*base)/4;
  var answer=calcOrExact('calculator',area,'','');
  return scalarProblem({
    slug:'optimization',mode:'calculator',source:source,family:'rigid_four_piece_barn_pen',id:'u3-v127-opt-pig-pen-'+trim(side,1),
    variant:'optimization_rigid_four_piece_barn_pen',
    prompt:'A pen is made from four rigid fence pieces, each \\('+trim(side,1)+'\\) meters long. Two pieces extend perpendicularly from a barn; the other two connect their outer ends and meet at a point. Find the maximum enclosed area.',
    answer:answer.answer,answerTex:answer.answerTex,value:area,
    steps:[
      'Let \\(b\\) be the distance between the two pieces attached to the barn. The first part is a rectangle of area \\('+trim(side,1)+'b\\).',
      'The two remaining pieces form an isosceles triangle with base \\(b\\), height \\(\\frac12\\sqrt{4('+trim(side,1)+')^2-b^2}\\), and area \\(\\frac b4\\sqrt{4('+trim(side,1)+')^2-b^2}\\).',
      'Maximize \\(A(b)='+trim(side,1)+'b+\\frac b4\\sqrt{4('+trim(side,1)+')^2-b^2}\\) on \\(0<b<'+trim(2*side,2)+'\\).',
      'Differentiate: \\(A^{\\prime}(b)='+trim(side,1)+'+\\frac{4('+trim(side,1)+')^2-2b^2}{4\\sqrt{4('+trim(side,1)+')^2-b^2}}\\).',
      calculatorCritical(base,'b'),
      'The derivative changes from positive to negative at this value, so the area is maximized there.',
      'Substitution into the full area model gives \\(A\\approx'+trim(area,6)+'\\) square meters.',
      'Therefore the maximum area is \\('+area.toFixed(3)+'\\) square meters.'
    ]
  });
}

function optTwoNumbers(mode,source){
  var ax=integer(1,4),by=integer(1,5),xTarget=integer(8,25),yTarget=integer(6,22);
  var total=ax*xTarget+by*yTarget;
  /* Adjust the displayed target so the product optimum is exact. */
  xTarget=total/(2*ax);yTarget=total/(2*by);
  var exactX=rational(total,2*ax);
  var answer=mode==='calculator'
    ?calcOrExact(mode,xTarget,'','')
    :{answer:exactX.input,answerTex:exactX.tex,value:null};
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'two_number_product',id:'u3-v127-opt-two-number-'+mode+'-'+ax+'-'+by+'-'+total,
    variant:'optimization_two_positive_numbers',
    prompt:'Two positive numbers \\(x\\) and \\(y\\) satisfy \\('+ax+'x+'+by+'y='+total+'\\). Find \\(x\\) so their product is as large as possible.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'The quantity to maximize is \\(P=xy\\).',
      'The constraint gives \\(y=\\frac{'+total+'-'+ax+'x}{'+by+'}\\).',
      'Thus \\(P(x)=\\frac{x('+total+'-'+ax+'x)}{'+by+'}\\), with \\(0<x<'+trim(total/ax,4)+'\\).',
      'Differentiate: \\(P^{\\prime}(x)=\\frac{'+total+'-'+(2*ax)+'x}{'+by+'}\\).',
      'Setting the derivative equal to zero gives \\(x='+trim(xTarget,6)+'\\).',
      'The second derivative is \\(-\\frac{'+(2*ax)+'}{'+by+'}<0\\), so this is the maximum.',
      'The corresponding value is \\(y='+trim(yTarget,6)+'\\).',
      'Therefore the requested value is \\(x='+trim(xTarget,6)+'\\)'+(mode==='calculator'?', or \\('+xTarget.toFixed(3)+'\\).':'.')
    ]
  });
}

function optWireSplit(mode,source){
  var length=mode==='calculator'?pick([73.4,91.7,124.6]):pick([40,60,80]);
  var circleLength=Math.PI*length/(4+Math.PI);
  var squareLength=length-circleLength;
  var answer=mode==='calculator'?calcOrExact(mode,circleLength,'',''):{answer:trim(length)+'*pi/(4+pi)',answerTex:'\\frac{'+trim(length)+'\\pi}{4+\\pi}',value:null};
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'wire_split_circle_square',id:'u3-v127-opt-wire-'+mode+'-'+trim(length,1),
    variant:'optimization_wire_split_two_shapes',
    prompt:'A wire of length \\('+trim(length,1)+'\\) centimeters is cut into two pieces. One forms a circle and the other a square. How much wire should be used for the circle to minimize the total enclosed area?',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x\\) be the length used for the circle, so \\('+trim(length,1)+'-x\\) is used for the square.',
      'The circle area is \\(\\frac{x^2}{4\\pi}\\), and the square area is \\(\\frac{('+trim(length,1)+'-x)^2}{16}\\).',
      'Minimize \\(A(x)=\\frac{x^2}{4\\pi}+\\frac{('+trim(length,1)+'-x)^2}{16}\\) on \\(0\\le x\\le'+trim(length,1)+'\\).',
      'Differentiate: \\(A^{\\prime}(x)=\\frac{x}{2\\pi}-\\frac{'+trim(length,1)+'-x}{8}\\).',
      (mode==='calculator'?calculatorCritical(circleLength):'Solving \\(A^{\\prime}(x)=0\\) gives \\(x=\\frac{'+trim(length)+'\\pi}{4+\\pi}\\).'),
      'Since \\(A^{\\prime\\prime}(x)=\\frac1{2\\pi}+\\frac18>0\\), this critical point is the absolute minimum.',
      'The remaining wire length is \\('+trim(squareLength,6)+'\\) centimeters.',
      'Therefore the circle should use '+(mode==='calculator'?'\\('+circleLength.toFixed(3)+'\\) centimeters.':'\\(\\frac{'+trim(length)+'\\pi}{4+\\pi}\\) centimeters.')
    ]
  });
}

function optAxisTriangle(mode,source){
  var a=mode==='calculator'?pick([2.4,3.7,5.2]):integer(1,6);
  var b=mode==='calculator'?pick([3.3,4.8,6.1]):integer(2,8);
  var intercept=2*a;
  var answer=calcOrExact(mode,intercept,trim(intercept),trim(intercept));
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'minimum_axis_intercept_triangle',id:'u3-v127-opt-axis-triangle-'+mode+'-'+trim(a,1)+'-'+trim(b,1),
    variant:'optimization_line_minimum_axis_triangle',
    prompt:'A line through \\(('+trim(a,1)+','+trim(b,1)+')\\) meets the positive coordinate axes and forms a triangle with them. Find the \\(x\\)-intercept that minimizes the triangle’s area.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(X\\) and \\(Y\\) be the positive intercepts. The line constraint is \\(\\frac{'+trim(a,1)+'}{X}+\\frac{'+trim(b,1)+'}{Y}=1\\).',
      'Solve for \\(Y\\): \\(Y=\\frac{'+trim(b,1)+'X}{X-'+trim(a,1)+'}\\), where \\(X>'+trim(a,1)+'\\).',
      'The triangle area is \\(A(X)=\\frac12XY=\\frac{'+trim(b,1)+'X^2}{2(X-'+trim(a,1)+')}\\).',
      'Differentiate: \\(A^{\\prime}(X)=\\frac{'+trim(b,1)+'X(X-'+trim(2*a,2)+')}{2(X-'+trim(a,1)+')^2}\\).',
      'The admissible critical value is \\(X='+trim(intercept,6)+'\\).',
      'The derivative changes from negative to positive there, so the triangle area is minimized.',
      'The corresponding \\(y\\)-intercept is \\(Y='+trim(2*b,6)+'\\).',
      'Therefore the requested \\(x\\)-intercept is \\('+trim(intercept,6)+'\\)'+(mode==='calculator'?', or \\('+intercept.toFixed(3)+'\\).':'.')
    ]
  });
}

function optCircleRectangle(mode,source){
  var radius=mode==='calculator'?pick([3.8,5.7,8.4]):integer(2,9);
  var side=radius*Math.sqrt(2),answer=mode==='calculator'?calcOrExact(mode,side,'',''):{answer:trim(radius)+'*sqrt(2)',answerTex:trim(radius)+'\\sqrt2',value:null};
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'rectangle_in_circle',id:'u3-v127-opt-circle-rectangle-'+mode+'-'+trim(radius,1),
    variant:'optimization_rectangle_inscribed_circle',
    prompt:'A rectangle is inscribed in a circle of radius \\('+trim(radius,1)+'\\). Find the side length when the rectangle has maximum area.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let the rectangle sides be \\(x\\) and \\(y\\). Its diagonal is the circle diameter, so \\(x^2+y^2=4('+trim(radius*radius,3)+')\\).',
      'Maximize \\(A=xy\\), using \\(y=\\sqrt{4('+trim(radius*radius,3)+')-x^2}\\).',
      'Thus \\(A(x)=x\\sqrt{4('+trim(radius*radius,3)+')-x^2}\\).',
      'Differentiate: \\(A^{\\prime}(x)=\\frac{4('+trim(radius*radius,3)+')-2x^2}{\\sqrt{4('+trim(radius*radius,3)+')-x^2}}\\).',
      'The interior critical value is \\(x='+trim(side,6)+'\\).',
      'The constraint then gives \\(y='+trim(side,6)+'\\), so the maximizing rectangle is a square.',
      'The endpoint areas are zero, confirming the interior point is the absolute maximum.',
      'Therefore the requested side length is '+(mode==='calculator'?'\\('+side.toFixed(3)+'\\).':'\\('+trim(radius)+'\\sqrt2\\).')
    ]
  });
}

function optWeightedFence(mode,source){
  var costX=mode==='calculator'?pick([4.7,6.3,8.1]):pick([4,6,8]);
  var costY=mode==='calculator'?pick([7.4,9.6,12.5]):pick([6,10,12]);
  var budget=mode==='calculator'?pick([843.5,1127.4,1486.2]):4*costX*integer(12,30);
  var x=budget/(4*costX),y=budget/(4*costY);
  var answer=calcOrExact(mode,x,trim(x),trim(x));
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'different_cost_rectangle_fencing',id:'u3-v127-opt-weighted-fence-'+mode+'-'+trim(budget,1),
    variant:'optimization_rectangle_different_fence_costs',
    prompt:'A rectangular field has one pair of sides costing $'+trim(costX,1)+' per foot and the other pair costing $'+trim(costY,1)+' per foot. With a $'+trim(budget,1)+' budget, find the length of a side in the first pair that maximizes area.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x\\) be a side in the first pair and \\(y\\) a side in the second pair. Maximize \\(A=xy\\).',
      'The budget constraint is \\('+trim(2*costX,2)+'x+'+trim(2*costY,2)+'y='+trim(budget,1)+'\\).',
      'Solve for \\(y\\): \\(y=\\frac{'+trim(budget,1)+'-'+trim(2*costX,2)+'x}{'+trim(2*costY,2)+'}\\).',
      'Substitute to obtain a downward-opening quadratic area function.',
      'Differentiating and setting the result to zero gives \\(x=\\frac{'+trim(budget,1)+'}{'+trim(4*costX,2)+'}='+trim(x,6)+'\\).',
      'The second derivative is negative, so this critical value gives the maximum area.',
      'The corresponding other side is \\(y='+trim(y,6)+'\\).',
      'Therefore the requested side length is \\('+trim(x,6)+'\\) feet'+(mode==='calculator'?', or \\('+x.toFixed(3)+'\\) feet.':'.')
    ]
  });
}

var optimizationAssignment=[
  descriptor('open_top_square_cardboard','assignment',optSquareCorner),
  descriptor('open_top_rectangular_cardboard','assignment',optRectangularCardboard),
  descriptor('square_base_box_fixed_material','assignment',optSquareBaseMaterial),
  descriptor('closed_cylinder_fixed_volume','assignment',function(mode,source){return optCylinder(mode,source,false);}),
  descriptor('open_cylinder_fixed_volume','assignment',function(mode,source){return optCylinder(mode,source,true);}),
  descriptor('cylinder_different_material_costs','assignment',optCylinderCost),
  descriptor('rectangular_fixed_perimeter_fencing','assignment',function(mode,source){return optRectangleFence(mode,source,false);}),
  descriptor('three_side_barn_fencing','assignment',function(mode,source){return optRectangleFence(mode,source,true);}),
  descriptor('hotel_room_revenue','assignment',function(mode,source){return optLinearRevenue(mode,source,'hotel');},'linear_revenue'),
  descriptor('wholesale_order_revenue','assignment',function(mode,source){return optLinearRevenue(mode,source,'wholesale');},'linear_revenue'),
  descriptor('orchard_yield','assignment',optOrchard),
  descriptor('equilateral_triangle_window','assignment',optTriangleWindow),
  descriptor('rectangle_in_semicircle','assignment',optSemicircleRectangle),
  descriptor('page_printed_area','assignment',optPageMargins),
  descriptor('closest_point_square_root','assignment',optClosestSquareRoot),
  descriptor('two_poles_minimum_cable','assignment',optPoleCable),
  descriptor('shortest_ladder_over_fence','assignment',optLadderFence),
  descriptor('maximum_cone_from_right_triangle','assignment',optConeFromTriangle),
  descriptor('minimum_distance_moving_ships','assignment',optMovingShips),
  descriptor('rectangle_under_parabola','assignment',optParabolaRectangle)
];
var optimizationTest=[
  descriptor('test_square_base_box','test',optSquareBaseMaterial,'square_base_box_fixed_material'),
  descriptor('test_cylinder_cost','test',optCylinderCost,'cylinder_different_material_costs'),
  descriptor('test_open_top_box','test',optSquareCorner,'open_top_square_cardboard'),
  descriptor('test_rigid_barn_pen','test',function(mode,source){return mode==='calculator'?optPigPen(mode,source):optRectangleFence(mode,source,true);})
];
var optimizationExtension=[
  descriptor('two_number_product','extension',optTwoNumbers),
  descriptor('wire_split_circle_square','extension',optWireSplit),
  descriptor('minimum_axis_intercept_triangle','extension',optAxisTriangle),
  descriptor('rectangle_in_circle','extension',optCircleRectangle),
  descriptor('different_cost_rectangle_fencing','extension',optWeightedFence)
];
function optimization(options){
  var mode=modeOf(options),selection=sourcePool(optimizationAssignment,optimizationTest,optimizationExtension);
  var chosen=diverse('optimization:'+mode,selection.pool);
  return chosen.build(mode,selection.source);
}

/* ----------------------------- Related Rates ----------------------------- */

function piMultiple(n,d){
  var value=rational(n,d||1);
  var input=value.input==='1'?'pi':value.input==='-1'?'-pi':value.input+'*pi';
  var texCoefficient=value.tex==='1'?'':value.tex==='-1'?'-':value.tex;
  return{value:value.value*Math.PI,input:input,tex:texCoefficient+'\\pi'};
}
function overPi(n,d){
  var value=n/(d*Math.PI),sign=n<0?-1:1,factor=gcd(n,d);
  var numerator=Math.abs(Math.round(n/factor)),denominator=Math.abs(Math.round(d/factor));
  var signedNumerator=sign*numerator;
  return{
    value:value,
    input:denominator===1?signedNumerator+'/pi':signedNumerator+'/('+denominator+'*pi)',
    tex:(sign<0?'-':'')+'\\frac{'+numerator+'}{'+(denominator===1?'':denominator)+'\\pi}'
  };
}
function rateConclusion(name,value,units,mode){
  return 'Therefore \\('+name+'='+trim(value,6)+'\\) '+units+(mode==='calculator'?', which rounds to \\('+Number(value).toFixed(3)+'\\) '+units+'.':'.');
}

function rrSphereFromVolume(mode,source){
  var radius=mode==='calculator'?pick([1.35,2.4,3.75]):pick([1.5,2,3]);
  var volumeRate=mode==='calculator'?pick([4.7,8.3,12.6]):pick([5,8,12]);
  var rate=volumeRate/(4*Math.PI*radius*radius),answer;
  if(mode==='calculator')answer=calcOrExact(mode,rate,'','');
  else{
    var scaled=Math.round(radius*2);
    var exact=overPi(volumeRate,scaled*scaled);
    answer={answer:exact.input,answerTex:exact.tex,value:null};
  }
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'sphere_volume_to_radius',id:'u3-v127-rr-sphere-dr-'+mode+'-'+trim(radius,2)+'-'+trim(volumeRate,1),
    variant:'related_rates_sphere_volume_to_radius',
    prompt:'Air is pumped into a spherical balloon at \\('+trim(volumeRate,1)+'\\) cubic feet per minute. Find \\(\\frac{dr}{dt}\\) when the radius is \\('+trim(radius,2)+'\\) feet.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(r\\) be the radius and \\(V\\) the volume. The given rate is \\(\\frac{dV}{dt}='+trim(volumeRate,1)+'\\); the requested rate is \\(\\frac{dr}{dt}\\).',
      'Use the sphere relationship \\(V=\\frac43\\pi r^3\\).',
      'Differentiate with respect to time before substituting: \\(\\frac{dV}{dt}=4\\pi r^2\\frac{dr}{dt}\\).',
      'At the stated instant, substitute \\(r='+trim(radius,2)+'\\) and \\(\\frac{dV}{dt}='+trim(volumeRate,1)+'\\).',
      'Solve: \\(\\frac{dr}{dt}=\\frac{'+trim(volumeRate,1)+'}{4\\pi('+trim(radius,2)+')^2}\\).',
      'This gives \\(\\frac{dr}{dt}='+trim(rate,8)+'\\) feet per minute.',
      'The rate is positive because the balloon is being filled.',
      rateConclusion('\\frac{dr}{dt}',rate,'feet per minute',mode)
    ]
  });
}

function rrSphereFromDiameter(mode,source){
  var radius=mode==='calculator'?pick([2.35,3.6,4.85]):pick([2,3,5]);
  var diameterRate=mode==='calculator'?pick([0.7,1.15,1.6]):pick([1,2,3]);
  var radialRate=diameterRate/2,rate=4*Math.PI*radius*radius*radialRate;
  var exact=piMultiple(Math.round(2*radius*radius*diameterRate*100),100);
  var answer=mode==='calculator'?calcOrExact(mode,rate,'',''):{answer:exact.input,answerTex:exact.tex,value:null};
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'sphere_diameter_to_volume',id:'u3-v127-rr-sphere-diameter-'+mode+'-'+trim(radius,2)+'-'+trim(diameterRate,2),
    variant:'related_rates_sphere_diameter_to_volume',
    prompt:'The diameter of a spherical balloon increases at \\('+trim(diameterRate,2)+'\\) centimeters per second. Find \\(\\frac{dV}{dt}\\) when the radius is \\('+trim(radius,2)+'\\) centimeters.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(D=2r\\). The given rate is \\(\\frac{dD}{dt}='+trim(diameterRate,2)+'\\), so \\(\\frac{dr}{dt}=\\frac12\\frac{dD}{dt}='+trim(radialRate,6)+'\\).',
      'The requested quantity is the sphere-volume rate, using \\(V=\\frac43\\pi r^3\\).',
      'Differentiate with respect to time: \\(\\frac{dV}{dt}=4\\pi r^2\\frac{dr}{dt}\\).',
      'Substitute \\(r='+trim(radius,2)+'\\) and \\(\\frac{dr}{dt}='+trim(radialRate,6)+'\\).',
      'Thus \\(\\frac{dV}{dt}=4\\pi('+trim(radius,2)+')^2('+trim(radialRate,6)+')\\).',
      'The value is \\('+trim(rate,8)+'\\) cubic centimeters per second.',
      'The positive sign agrees with the increasing diameter.',
      rateConclusion('\\frac{dV}{dt}',rate,'cubic centimeters per second',mode)
    ]
  });
}

function rrSphereSurfaceToVolume(mode,source){
  var radius=mode==='calculator'?pick([1.8,2.65,4.1]):pick([2,3,4]);
  var surfaceRate=mode==='calculator'?pick([13.7,19.4,26.8]):pick([12,18,24]);
  var rate=radius*surfaceRate/2;
  var exact=rational(radius*surfaceRate,2),answer=mode==='calculator'?calcOrExact(mode,rate,'',''):{answer:exact.input,answerTex:exact.tex,value:null};
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'sphere_surface_area_to_volume',id:'u3-v127-rr-sphere-surface-'+mode+'-'+trim(radius,2),
    variant:'related_rates_sphere_surface_to_volume',
    prompt:'A spherical balloon’s surface area increases at \\('+trim(surfaceRate,1)+'\\) square centimeters per second. Find \\(\\frac{dV}{dt}\\) when \\(r='+trim(radius,2)+'\\) centimeters.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Use \\(S=4\\pi r^2\\) and \\(V=\\frac43\\pi r^3\\). The given rate is \\(\\frac{dS}{dt}='+trim(surfaceRate,1)+'\\).',
      'Differentiate the surface-area relationship: \\(\\frac{dS}{dt}=8\\pi r\\frac{dr}{dt}\\).',
      'Solve for the radius rate: \\(\\frac{dr}{dt}=\\frac{'+trim(surfaceRate,1)+'}{8\\pi('+trim(radius,2)+')}\\).',
      'Differentiate volume: \\(\\frac{dV}{dt}=4\\pi r^2\\frac{dr}{dt}\\).',
      'Substitute the event values before simplifying.',
      'The \\(\\pi\\) factors cancel, giving \\(\\frac{dV}{dt}=\\frac{r}{2}\\frac{dS}{dt}='+trim(rate,8)+'\\).',
      'The positive sign means the volume is increasing.',
      rateConclusion('\\frac{dV}{dt}',rate,'cubic centimeters per second',mode)
    ]
  });
}

function rrCircleArea(mode,source,inverse){
  var radius=mode==='calculator'?pick([3.7,5.25,8.4]):pick([3,4,5]);
  if(!inverse){
    var radial=mode==='calculator'?pick([0.45,0.8,1.35]):pick([0.5,1,1.5]);
    var areaRate=2*Math.PI*radius*radial,scaled=Math.round(2*radius*radial*100),exact=piMultiple(scaled,100);
    var answer=mode==='calculator'?calcOrExact(mode,areaRate,'',''):{answer:exact.input,answerTex:exact.tex,value:null};
    return scalarProblem({
      slug:'related-rates',mode:mode,source:source,family:'circular_area_from_radius',id:'u3-v127-rr-circle-area-'+mode+'-'+trim(radius,2)+'-'+trim(radial,2),
      variant:'related_rates_circular_pool_area',
      prompt:'A circular pool’s radius increases at \\('+trim(radial,2)+'\\) meters per minute. Find \\(\\frac{dA}{dt}\\) when \\(r='+trim(radius,2)+'\\) meters.',
      answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
      steps:[
        'Let \\(r\\) be the radius and \\(A\\) the area. The given rate is \\(\\frac{dr}{dt}='+trim(radial,2)+'\\).',
        'Use the relationship \\(A=\\pi r^2\\).',
        'Differentiate with respect to time: \\(\\frac{dA}{dt}=2\\pi r\\frac{dr}{dt}\\).',
        'Substitute \\(r='+trim(radius,2)+'\\) and \\(\\frac{dr}{dt}='+trim(radial,2)+'\\).',
        'This gives \\(\\frac{dA}{dt}=2\\pi('+trim(radius,2)+')('+trim(radial,2)+')\\).',
        'Numerically, the area rate is \\('+trim(areaRate,8)+'\\).',
        'The rate is positive because the pool is spreading.',
        rateConclusion('\\frac{dA}{dt}',areaRate,'square meters per minute',mode)
      ]
    });
  }
  var given=mode==='calculator'?pick([14.6,23.8,31.7]):pick([8,12,20])*Math.PI;
  var radialRate=given/(2*Math.PI*radius),answerInverse;
  if(mode==='calculator')answerInverse=calcOrExact(mode,radialRate,'','');
  else{
    var coefficient=Math.round(given/Math.PI),fraction=rational(coefficient,2*radius);
    answerInverse={answer:fraction.input,answerTex:fraction.tex,value:null};
  }
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'circular_radius_from_area',id:'u3-v127-rr-circle-radius-'+mode+'-'+trim(radius,2),
    variant:'related_rates_circular_spill_radius',
    prompt:'A circular spill’s area increases at \\('+(mode==='calculator'?trim(given,2):trim(given/Math.PI)+'\\pi')+'\\) square meters per minute. Find \\(\\frac{dr}{dt}\\) when \\(r='+trim(radius,2)+'\\) meters.',
    answer:answerInverse.answer,answerTex:answerInverse.answerTex,value:answerInverse.value,
    steps:[
      'Let \\(r\\) be the spill radius. The requested rate is \\(\\frac{dr}{dt}\\).',
      'Use \\(A=\\pi r^2\\).',
      'Differentiate before substituting: \\(\\frac{dA}{dt}=2\\pi r\\frac{dr}{dt}\\).',
      'Substitute the given area rate and \\(r='+trim(radius,2)+'\\).',
      'Solve: \\(\\frac{dr}{dt}=\\frac{dA/dt}{2\\pi r}\\).',
      'The resulting radius rate is \\('+trim(radialRate,8)+'\\) meters per minute.',
      'It is positive because the area is increasing.',
      rateConclusion('\\frac{dr}{dt}',radialRate,'meters per minute',mode)
    ]
  });
}

function rrCircularWave(mode,source){
  var radial=mode==='calculator'?pick([0.37,0.62,1.18]):pick([0.5,1,1.5]);
  var rate=2*Math.PI*radial,exact=piMultiple(Math.round(2*radial*100),100);
  var answer=mode==='calculator'?calcOrExact(mode,rate,'',''):{answer:exact.input,answerTex:exact.tex,value:null};
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'circular_wave_circumference',id:'u3-v127-rr-wave-'+mode+'-'+trim(radial,2),
    variant:'related_rates_circular_wave_circumference',
    prompt:'A circular wave’s radius increases at \\('+trim(radial,2)+'\\) '+(radial===1?'meter':'meters')+' per second. Find the rate at which its circumference changes.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(C\\) be circumference and \\(r\\) radius. The given rate is \\(\\frac{dr}{dt}='+trim(radial,2)+'\\).',
      'Use \\(C=2\\pi r\\).',
      'Differentiate with respect to time: \\(\\frac{dC}{dt}=2\\pi\\frac{dr}{dt}\\).',
      'Substitute the given radius rate.',
      'This gives \\(\\frac{dC}{dt}=2\\pi('+trim(radial,2)+')\\).',
      'The radius itself is not needed because circumference is linear in radius.',
      'The positive sign means the wave circumference is increasing.',
      rateConclusion('\\frac{dC}{dt}',rate,'meters per second',mode)
    ]
  });
}

function ladderData(mode){
  if(mode==='noncalculator'){
    var triple=pick([[5,12,13],[6,8,10],[9,12,15],[8,15,17]]);
    return{x:triple[0],y:triple[1],length:triple[2],dx:pick([1,2,3,4])};
  }
  var length=pick([14.7,18.3,22.6]),x=pick([5.4,7.8,10.1]);
  return{x:x,y:Math.sqrt(length*length-x*x),length:length,dx:pick([1.25,2.4,3.15])};
}
function rrLadder(mode,source,request){
  var data=ladderData(mode),x=data.x,y=data.y,L=data.length,dx=data.dx,dy=-x*dx/y;
  var value,units,name,variant;
  if(request==='top'){value=dy;units='feet per second';name='\\frac{dy}{dt}';variant='related_rates_sliding_ladder_top';}
  else if(request==='area'){value=(x*dy+y*dx)/2;units='square feet per second';name='\\frac{dA}{dt}';variant='related_rates_sliding_ladder_area';}
  else{value=-dx/y;units='radians per second';name='\\frac{d\\theta}{dt}';variant='related_rates_sliding_ladder_angle';}
  var exact;
  if(mode==='noncalculator'){
    if(request==='top')exact=rational(-x*dx,y);
    else if(request==='area')exact=rational((-x*x*dx+y*y*dx),2*y);
    else exact=rational(-dx,y);
  }
  var answer=mode==='calculator'?calcOrExact(mode,value,'',''):{answer:exact.input,answerTex:exact.tex,value:null};
  var prompt=request==='top'
    ?'Find how fast the top of the ladder is moving.'
    :request==='area'?'Find the rate of change of the triangular area between the ladder, wall, and ground.'
    :'Let \\(\\theta\\) be the angle between the ladder and ground. Find \\(\\frac{d\\theta}{dt}\\).';
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'ladder_'+request,id:'u3-v127-rr-ladder-'+request+'-'+mode+'-'+trim(L,2)+'-'+trim(x,2),
    variant:variant,
    prompt:'A \\('+trim(L,2)+'\\)-foot ladder leans against a wall. Its foot is \\('+trim(x,2)+'\\) feet from the wall and moves away at \\('+trim(dx,2)+'\\) feet per second. '+prompt,
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x\\) be the foot’s distance and \\(y\\) the top’s height. Here \\(\\frac{dx}{dt}='+trim(dx,2)+'\\), and '+(request==='top'?'\\(\\frac{dy}{dt}\\) is requested.':request==='area'?'\\(\\frac{dA}{dt}\\) is requested.':'\\(\\frac{d\\theta}{dt}\\) is requested.'),
      'The fixed ladder gives \\(x^2+y^2='+trim(L*L,4)+'\\). At this instant, \\(y=\\sqrt{'+trim(L*L,4)+'-'+trim(x*x,4)+'}='+trim(y,6)+'\\).',
      'Differentiate the length relationship with respect to time: \\(2x\\frac{dx}{dt}+2y\\frac{dy}{dt}=0\\).',
      'Substitution gives \\(\\frac{dy}{dt}=-\\frac{('+trim(x,2)+')('+trim(dx,2)+')}{'+trim(y,6)+'}='+trim(dy,8)+'\\) feet per second.',
      (request==='area'
        ?'Use \\(A=\\frac12xy\\), so \\(\\frac{dA}{dt}=\\frac12(x\\frac{dy}{dt}+y\\frac{dx}{dt})\\).'
        :request==='angle'
          ?'Use \\(\\cos\\theta=\\frac{x}{'+trim(L,2)+'}\\). Differentiating gives \\(-\\sin\\theta\\frac{d\\theta}{dt}=\\frac1{'+trim(L,2)+'}\\frac{dx}{dt}\\), and \\(\\sin\\theta=\\frac{y}{'+trim(L,2)+'}\\).'
          :'The requested rate is the \\(\\frac{dy}{dt}\\) found above.'),
      (request==='area'
        ?'Substituting the event values gives \\(\\frac{dA}{dt}='+trim(value,8)+'\\) square feet per second.'
        :request==='angle'
          ?'Solving gives \\(\\frac{d\\theta}{dt}=-\\frac{dx/dt}{y}='+trim(value,8)+'\\) radians per second.'
          :'The negative sign means the top is moving downward.'),
      'The sign follows the geometry at the stated instant.',
      rateConclusion(name,value,units,mode)
    ]
  });
}

function rrShadow(mode,source,tip){
  var pole=mode==='calculator'?pick([13.8,17.4,21.6]):pick([15,16,20]);
  var person=mode==='calculator'?pick([5.3,5.8,6.2]):pick([5,6,7]);
  if(person>=pole)person=pole-3;
  var walking=mode==='calculator'?pick([2.35,3.1,4.25]):pick([2,3,4,5]);
  var shadow=person*walking/(pole-person),value=tip?walking+shadow:shadow;
  var exact=rational((tip?pole:person)*walking,pole-person);
  var answer=mode==='calculator'?calcOrExact(mode,value,'',''):{answer:exact.input,answerTex:exact.tex,value:null};
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:tip?'lamppost_shadow_tip':'lamppost_shadow_length',
    id:'u3-v127-rr-shadow-'+(tip?'tip':'length')+'-'+mode+'-'+trim(pole,1)+'-'+trim(person,1),
    variant:tip?'related_rates_lamppost_shadow_tip':'related_rates_lamppost_shadow_length',
    prompt:'A \\('+trim(person,1)+'\\)-foot person walks away from a \\('+trim(pole,1)+'\\)-foot lamppost at \\('+trim(walking,2)+'\\) feet per second. Find how fast '+(tip?'the tip of the shadow moves away from the pole':'the shadow length increases')+'.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x\\) be the person’s distance from the pole and \\(s\\) the shadow length. Then \\(\\frac{dx}{dt}='+trim(walking,2)+'\\).',
      'Similar triangles give \\(\\frac{'+trim(pole,1)+'}{x+s}=\\frac{'+trim(person,1)+'}{s}\\).',
      'Cross-multiply and simplify: \\(('+trim(pole-person,2)+')s='+trim(person,1)+'x\\).',
      'Differentiate with respect to time: \\(('+trim(pole-person,2)+')\\frac{ds}{dt}='+trim(person,1)+'\\frac{dx}{dt}\\).',
      'Therefore \\(\\frac{ds}{dt}='+trim(shadow,8)+'\\) feet per second.',
      (tip?'The tip is at distance \\(x+s\\), so its rate is \\(\\frac{dx}{dt}+\\frac{ds}{dt}='+trim(value,8)+'\\).':'The requested rate is \\(\\frac{ds}{dt}\\) itself.'),
      'The rate is positive because both the person and the shadow tip move away from the pole.',
      rateConclusion(tip?'\\frac{d(x+s)}{dt}':'\\frac{ds}{dt}',value,'feet per second',mode)
    ]
  });
}

function rrConePile(mode,source){
  var ratioData=mode==='calculator'
    ?{value:pick([0.62,0.74,1.18]),numerator:null,denominator:null}
    :pick([{value:1,numerator:1,denominator:1},{value:4/3,numerator:4,denominator:3},{value:3/8,numerator:3,denominator:8}]);
  var ratio=ratioData.value;
  var ratioText=mode==='calculator'
    ?trim(ratio,3)
    :(ratioData.denominator===1?String(ratioData.numerator):'\\frac{'+ratioData.numerator+'}{'+ratioData.denominator+'}');
  var height=mode==='calculator'?pick([7.3,10.5,12.8]):pick([4,8,10]);
  var dh=mode==='calculator'?pick([1.35,2.2,3.15]):pick([1,2,3,6]);
  var radius=ratio*height,rate=Math.PI*ratio*ratio*height*height*dh;
  var exact=mode==='noncalculator'
    ?piMultiple(ratioData.numerator*ratioData.numerator*height*height*dh,ratioData.denominator*ratioData.denominator)
    :null;
  var answer=mode==='calculator'?calcOrExact(mode,rate,'',''):{answer:exact.input,answerTex:exact.tex,value:null};
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'conical_pile',id:'u3-v127-rr-cone-pile-'+mode+'-'+trim(ratio,3)+'-'+trim(height,1),
    variant:'related_rates_conical_pile',
    prompt:'A conical pile keeps the constant shape ratio \\(r='+ratioText+'h\\). When \\(h='+trim(height,1)+'\\) feet, the height increases at \\('+trim(dh,2)+'\\) feet per minute. Find \\(\\frac{dV}{dt}\\).',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(r\\), \\(h\\), and \\(V\\) change with time. The given rate is \\(\\frac{dh}{dt}='+trim(dh,2)+'\\); the requested rate is \\(\\frac{dV}{dt}\\).',
      'The shape relationship is \\(r='+ratioText+'h\\), so \\(\\frac{dr}{dt}='+ratioText+'\\frac{dh}{dt}\\).',
      'Use \\(V=\\frac13\\pi r^2h\\). Substitute the shape relationship first to get \\(V=\\frac13\\pi('+ratioText+')^2h^3\\).',
      'Differentiate with respect to time: \\(\\frac{dV}{dt}=\\pi('+ratioText+')^2h^2\\frac{dh}{dt}\\).',
      'Substitute \\(h='+trim(height,1)+'\\) and \\(\\frac{dh}{dt}='+trim(dh,2)+'\\).',
      'This gives \\(\\frac{dV}{dt}='+trim(rate,8)+'\\) cubic feet per minute.',
      'The positive sign means material is entering the pile.',
      rateConclusion('\\frac{dV}{dt}',rate,'cubic feet per minute',mode)
    ]
  });
}

function rrConicalTank(mode,source){
  var tankHeight=mode==='calculator'?pick([11.4,14.8,18.6]):pick([8,12,16]);
  var tankRadius=mode==='calculator'?pick([4.3,6.7,8.2]):tankHeight/2;
  var depth=mode==='calculator'?pick([2.7,4.1,5.6]):tankHeight/4;
  var volumeRate=mode==='calculator'?pick([1.337,2.45,3.18]):pick([3,6,9])*Math.PI;
  var radius=tankRadius*depth/tankHeight;
  var dh=volumeRate*tankHeight*tankHeight/(Math.PI*tankRadius*tankRadius*depth*depth);
  var answer;
  if(mode==='calculator')answer=calcOrExact(mode,dh,'','');
  else{
    var coefficient=Math.round(volumeRate/Math.PI);
    var exact=rational(coefficient*tankHeight*tankHeight,tankRadius*tankRadius*depth*depth);
    answer={answer:exact.input,answerTex:exact.tex,value:null};
  }
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'inverted_conical_tank',id:'u3-v127-rr-cone-tank-'+mode+'-'+trim(tankHeight,1)+'-'+trim(depth,1),
    variant:'related_rates_inverted_conical_tank',
    prompt:'An inverted conical tank has height \\('+trim(tankHeight,1)+'\\) feet and top radius \\('+trim(tankRadius,1)+'\\) feet. Water enters at \\('+(mode==='calculator'?trim(volumeRate,3):trim(volumeRate/Math.PI)+'\\pi')+'\\) cubic feet per minute. Find \\(\\frac{dh}{dt}\\) when the water depth is \\('+trim(depth,1)+'\\) feet.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(h\\) be water depth and \\(r\\) the surface radius. The given rate is \\(\\frac{dV}{dt}='+(mode==='calculator'?trim(volumeRate,3):trim(volumeRate/Math.PI)+'\\pi')+'\\).',
      'Similar cones give \\(\\frac r h=\\frac{'+trim(tankRadius,1)+'}{'+trim(tankHeight,1)+'}\\), so \\(r=\\frac{'+trim(tankRadius,1)+'}{'+trim(tankHeight,1)+'}h\\).',
      'Substitute into \\(V=\\frac13\\pi r^2h\\) to obtain \\(V=\\frac{\\pi('+trim(tankRadius*tankRadius,3)+')}{3('+trim(tankHeight*tankHeight,3)+')}h^3\\).',
      'Differentiate with respect to time: \\(\\frac{dV}{dt}=\\frac{\\pi('+trim(tankRadius*tankRadius,3)+')}{'+trim(tankHeight*tankHeight,3)+'}h^2\\frac{dh}{dt}\\).',
      'Now substitute the instantaneous depth \\(h='+trim(depth,1)+'\\) and the given volume rate.',
      'Solving gives \\(\\frac{dh}{dt}='+trim(dh,8)+'\\) feet per minute.',
      'The positive sign means the water level is rising.',
      rateConclusion('\\frac{dh}{dt}',dh,'feet per minute',mode)
    ]
  });
}

function rrTriangularTrough(mode,source){
  var length=mode==='calculator'?pick([7.6,10.4,13.2]):pick([8,10,12]);
  var fullWidth=mode==='calculator'?pick([2.3,3.7,4.6]):pick([2,3,4]);
  var fullHeight=mode==='calculator'?pick([1.8,2.6,3.4]):pick([1,2,3]);
  var depth=mode==='calculator'?pick([0.65,1.15,1.7]):fullHeight/2;
  var volumeRate=mode==='calculator'?pick([2.4,4.7,6.3]):pick([2,4,6]);
  var dh=volumeRate*fullHeight/(length*fullWidth*depth);
  var exact=rational(volumeRate*fullHeight,length*fullWidth*depth),answer=mode==='calculator'?calcOrExact(mode,dh,'',''):{answer:exact.input,answerTex:exact.tex,value:null};
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'triangular_trough',id:'u3-v127-rr-tri-trough-'+mode+'-'+trim(length,1)+'-'+trim(depth,2),
    variant:'related_rates_triangular_trough',
    prompt:'A \\('+trim(length,1)+'\\)-foot trough has triangular ends of full width \\('+trim(fullWidth,1)+'\\) feet and height \\('+trim(fullHeight,1)+'\\) feet. Water enters at \\('+trim(volumeRate,1)+'\\) cubic feet per minute. Find \\(\\frac{dh}{dt}\\) when the water depth is \\('+trim(depth,2)+'\\) '+(depth===1?'foot':'feet')+'.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(h\\) be water depth and \\(w\\) the water-surface width. The given rate is \\(\\frac{dV}{dt}='+trim(volumeRate,1)+'\\).',
      'Similar triangles give \\(\\frac wh=\\frac{'+trim(fullWidth,1)+'}{'+trim(fullHeight,1)+'}\\), so \\(w=\\frac{'+trim(fullWidth,1)+'}{'+trim(fullHeight,1)+'}h\\).',
      'The cross-sectional area is \\(\\frac12wh\\), so \\(V='+trim(length,1)+'(\\frac12)(\\frac{'+trim(fullWidth,1)+'}{'+trim(fullHeight,1)+'}h)h\\).',
      'Differentiate with respect to time: \\(\\frac{dV}{dt}=\\frac{'+trim(length*fullWidth,3)+'}{'+trim(fullHeight,1)+'}h\\frac{dh}{dt}\\).',
      'Substitute \\(h='+trim(depth,2)+'\\) and \\(\\frac{dV}{dt}='+trim(volumeRate,1)+'\\).',
      'Solving gives \\(\\frac{dh}{dt}='+trim(dh,8)+'\\) feet per minute.',
      'The positive sign is consistent with water entering.',
      rateConclusion('\\frac{dh}{dt}',dh,'feet per minute',mode)
    ]
  });
}

function rrTrapezoidTrough(mode,source){
  var length=mode==='calculator'?pick([8.7,11.3,14.6]):10;
  var bottom=mode==='calculator'?pick([2.6,3.4,4.1]):3;
  var top=mode==='calculator'?pick([5.2,6.7,7.8]):5;
  var fullHeight=mode==='calculator'?pick([2.4,3.1,3.8]):2;
  var depth=mode==='calculator'?pick([0.9,1.35,1.8]):1;
  var dh=mode==='calculator'?pick([0.018,0.027,0.041]):1/48;
  var dhText=mode==='calculator'?trim(dh,4):'\\frac1{48}';
  var width=bottom+(top-bottom)*depth/fullHeight;
  var volumeRate=length*(bottom+(top-bottom)*depth/fullHeight)*dh;
  var exact=mode==='noncalculator'?rational(5,6):null;
  var answer=mode==='calculator'?calcOrExact(mode,volumeRate,'',''):{answer:exact.input,answerTex:exact.tex,value:null};
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'trapezoidal_trough',id:'u3-v127-rr-trap-trough-'+mode+'-'+trim(length,1)+'-'+trim(depth,2),
    variant:'related_rates_trapezoidal_trough',
    prompt:'A \\('+trim(length,1)+'\\)-foot trough has trapezoidal ends with bottom width \\('+trim(bottom,1)+'\\), top width \\('+trim(top,1)+'\\), and height \\('+trim(fullHeight,1)+'\\) feet. When the water depth is \\('+trim(depth,2)+'\\) '+(depth===1?'foot':'feet')+', it rises at \\('+dhText+'\\) feet per minute. Find \\(\\frac{dV}{dt}\\).',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(h\\) be water depth and \\(w\\) the top width of the water. The requested rate is \\(\\frac{dV}{dt}\\).',
      'The side slope gives \\(w='+trim(bottom,1)+'+\\frac{'+trim(top-bottom,2)+'}{'+trim(fullHeight,1)+'}h\\). At \\(h='+trim(depth,2)+'\\), \\(w='+trim(width,6)+'\\).',
      'The trapezoid cross-sectional area is \\(A=\\frac h2('+trim(bottom,1)+'+w)\\). After substitution, \\(V='+trim(length,1)+'['+trim(bottom,1)+'h+\\frac{'+trim(top-bottom,2)+'}{2('+trim(fullHeight,1)+')}h^2]\\).',
      'Differentiate with respect to time: \\(\\frac{dV}{dt}='+trim(length,1)+'['+trim(bottom,1)+'+\\frac{'+trim(top-bottom,2)+'}{'+trim(fullHeight,1)+'}h]\\frac{dh}{dt}\\).',
      'Substitute \\(h='+trim(depth,2)+'\\) and \\(\\frac{dh}{dt}='+dhText+'\\).',
      'This gives \\(\\frac{dV}{dt}='+trim(volumeRate,8)+'\\) cubic feet per minute.',
      'The positive sign means water is entering the trough.',
      rateConclusion('\\frac{dV}{dt}',volumeRate,'cubic feet per minute',mode)
    ]
  });
}

function rrCylinderTank(mode,source){
  var radius=mode==='calculator'?pick([2.35,3.8,5.15]):pick([2,3,5]);
  var volumeRate=mode==='calculator'?pick([-1.7,-2.45,3.2]):pick([-4,-3,5])*Math.PI;
  var dh=volumeRate/(Math.PI*radius*radius),answer;
  if(mode==='calculator')answer=calcOrExact(mode,dh,'','');
  else{
    var coefficient=Math.round(volumeRate/Math.PI),exact=rational(coefficient,radius*radius);
    answer={answer:exact.input,answerTex:exact.tex,value:null};
  }
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'cylindrical_tank',id:'u3-v127-rr-cylinder-tank-'+mode+'-'+trim(radius,2),
    variant:'related_rates_cylindrical_tank',
    prompt:'A vertical cylindrical tank has fixed radius \\('+trim(radius,2)+'\\) feet. Its water volume changes at \\('+(mode==='calculator'?trim(volumeRate,2):trim(volumeRate/Math.PI)+'\\pi')+'\\) cubic feet per second. Find \\(\\frac{dh}{dt}\\).',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(h\\) be the water depth. The signed volume rate is \\(\\frac{dV}{dt}='+(mode==='calculator'?trim(volumeRate,2):trim(volumeRate/Math.PI)+'\\pi')+'\\).',
      'Use \\(V=\\pi r^2h\\), where \\(r='+trim(radius,2)+'\\) is constant.',
      'Differentiate with respect to time: \\(\\frac{dV}{dt}=\\pi r^2\\frac{dh}{dt}\\).',
      'Substitute the fixed radius and the signed volume rate.',
      'Solve: \\(\\frac{dh}{dt}=\\frac{dV/dt}{\\pi('+trim(radius,2)+')^2}\\).',
      'This gives \\(\\frac{dh}{dt}='+trim(dh,8)+'\\) feet per second.',
      'The '+(dh<0?'negative':'positive')+' sign means the water level is '+(dh<0?'falling':'rising')+'.',
      rateConclusion('\\frac{dh}{dt}',dh,'feet per second',mode)
    ]
  });
}

function rrPolygonArea(mode,source,shape){
  var side=mode==='calculator'?pick([4.3,6.1,8.7]):pick([4,6,8]);
  var sideRate=mode==='calculator'?pick([-0.65,0.4,1.15]):pick([-2,-1,1,2]);
  var rate=shape==='square'?2*side*sideRate:Math.sqrt(3)*side*sideRate/2;
  var answer;
  if(mode==='calculator')answer=calcOrExact(mode,rate,'','');
  else if(shape==='square'){
    var exact=rational(2*side*sideRate,1);answer={answer:exact.input,answerTex:exact.tex,value:null};
  }else{
    var coefficient=rational(side*sideRate,2);
    answer={answer:'('+coefficient.input+')*sqrt(3)',answerTex:(coefficient.tex==='1'?'':coefficient.tex==='-1'?'-':coefficient.tex)+'\\sqrt3',value:null};
  }
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:shape+'_area',id:'u3-v127-rr-'+shape+'-'+mode+'-'+trim(side,1)+'-'+trim(sideRate,2),
    variant:shape==='square'?'related_rates_square_area':'related_rates_equilateral_triangle_area',
    prompt:'The side length of '+(shape==='square'?'a square':'an equilateral triangle')+' changes at \\('+trim(sideRate,2)+'\\) centimeters per minute. Find \\(\\frac{dA}{dt}\\) when the side length is \\('+trim(side,1)+'\\) centimeters.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(s\\) be side length. The signed rate is \\(\\frac{ds}{dt}='+trim(sideRate,2)+'\\); the requested rate is \\(\\frac{dA}{dt}\\).',
      (shape==='square'?'Use \\(A=s^2\\).':'Use \\(A=\\frac{\\sqrt3}{4}s^2\\).'),
      (shape==='square'?'Differentiate: \\(\\frac{dA}{dt}=2s\\frac{ds}{dt}\\).':'Differentiate: \\(\\frac{dA}{dt}=\\frac{\\sqrt3}{2}s\\frac{ds}{dt}\\).'),
      'Substitute \\(s='+trim(side,1)+'\\) and \\(\\frac{ds}{dt}='+trim(sideRate,2)+'\\).',
      'The resulting area rate is \\('+trim(rate,8)+'\\) square centimeters per minute.',
      'No length values were substituted until after differentiating with respect to time.',
      'The '+(rate<0?'negative':'positive')+' sign means area is '+(rate<0?'decreasing':'increasing')+'.',
      rateConclusion('\\frac{dA}{dt}',rate,'square centimeters per minute',mode)
    ]
  });
}

function rrBalloonBike(mode,source){
  var t=mode==='calculator'?pick([2.7,4.2,5.6]):3;
  var horizontalRate=mode==='calculator'?pick([14.6,18.3,21.7]):17;
  var initialHeight=mode==='calculator'?pick([58.4,67.2,74.6]):65;
  var verticalRate=mode==='calculator'?pick([0.8,1.3,1.7]):1;
  var x=horizontalRate*t,y=initialHeight+verticalRate*t,distance=Math.hypot(x,y);
  var rate=(x*horizontalRate+y*verticalRate)/distance;
  var answer;
  if(mode==='calculator')answer=calcOrExact(mode,rate,'','');
  else{var exact=rational(x*horizontalRate+y*verticalRate,distance);answer={answer:exact.input,answerTex:exact.tex,value:null};}
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'balloon_bicycle_distance',id:'u3-v127-rr-balloon-bike-'+mode+'-'+trim(t,1),
    variant:'related_rates_balloon_bicycle_distance',
    prompt:'A balloon is \\('+trim(initialHeight,1)+'\\) feet above a road and rises at \\('+trim(verticalRate,1)+'\\) foot per second as a bicyclist passes beneath it at \\('+trim(horizontalRate,1)+'\\) feet per second. How fast is the distance between them changing \\('+trim(t,1)+'\\) seconds later?',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x\\) be horizontal separation, \\(y\\) balloon height, and \\(d\\) their distance. Then \\(\\frac{dx}{dt}='+trim(horizontalRate,1)+'\\) and \\(\\frac{dy}{dt}='+trim(verticalRate,1)+'\\).',
      'At \\(t='+trim(t,1)+'\\), \\(x='+trim(horizontalRate,1)+'('+trim(t,1)+')='+trim(x,6)+'\\) and \\(y='+trim(initialHeight,1)+'+'+trim(verticalRate,1)+'('+trim(t,1)+')='+trim(y,6)+'\\).',
      'The geometric relationship is \\(d^2=x^2+y^2\\).',
      'Differentiate with respect to time: \\(2d\\frac{dd}{dt}=2x\\frac{dx}{dt}+2y\\frac{dy}{dt}\\).',
      'At this event, \\(d=\\sqrt{'+trim(x*x,4)+'+'+trim(y*y,4)+'}='+trim(distance,8)+'\\).',
      'Substitute all event values: \\(\\frac{dd}{dt}=\\frac{('+trim(x,6)+')('+trim(horizontalRate,1)+')+('+trim(y,6)+')('+trim(verticalRate,1)+')}{'+trim(distance,8)+'}\\).',
      'The result is positive, so the distance is increasing.',
      rateConclusion('\\frac{dd}{dt}',rate,'feet per second',mode)
    ]
  });
}

function rrSoftball(mode,source){
  var side=mode==='calculator'?pick([58.7,63.4,71.2]):60;
  var fromThird=mode==='calculator'?pick([17.3,22.6,31.4]):20;
  var speed=mode==='calculator'?pick([19.6,23.4,27.1]):24;
  var distance=Math.hypot(fromThird,side),rate=-fromThird*speed/distance;
  var answer=mode==='calculator'?calcOrExact(mode,rate,'',''):{answer:'-24/sqrt(10)',answerTex:'-\\frac{24}{\\sqrt{10}}',value:null};
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'softball_diamond',id:'u3-v127-rr-softball-'+mode+'-'+trim(side,1)+'-'+trim(fromThird,1),
    variant:'related_rates_softball_diamond',
    prompt:'A square softball diamond has side length \\('+trim(side,1)+'\\) feet. A runner travels from second toward third at \\('+trim(speed,1)+'\\) feet per second. How fast is her distance from home changing when she is \\('+trim(fromThird,1)+'\\) feet from third?',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x\\) be the runner’s distance from third and \\(d\\) her distance from home. Since she approaches third, \\(\\frac{dx}{dt}=-'+trim(speed,1)+'\\).',
      'The diamond geometry gives \\(d^2=x^2+'+trim(side*side,3)+'\\).',
      'Differentiate with respect to time: \\(2d\\frac{dd}{dt}=2x\\frac{dx}{dt}\\).',
      'At the stated instant, \\(d=\\sqrt{'+trim(fromThird*fromThird,3)+'+'+trim(side*side,3)+'}='+trim(distance,8)+'\\).',
      'Substitute: \\(\\frac{dd}{dt}=\\frac{('+trim(fromThird,1)+')(-'+trim(speed,1)+')}{'+trim(distance,8)+'}\\).',
      'This gives \\(\\frac{dd}{dt}='+trim(rate,8)+'\\) feet per second.',
      'The negative sign means her distance from home is decreasing.',
      rateConclusion('\\frac{dd}{dt}',rate,'feet per second',mode)
    ]
  });
}

function rrSpotlight(mode,source){
  var distance=mode==='calculator'?pick([175,230,315]):pick([100,200,300]);
  var angleData=mode==='calculator'
    ?{theta:pick([2*Math.PI/7,2*Math.PI/9,0.73]),label:null,cscNumerator:null,cscDenominator:null}
    :pick([
      {theta:Math.PI/6,label:'\\pi/6',cscNumerator:4,cscDenominator:1},
      {theta:Math.PI/4,label:'\\pi/4',cscNumerator:2,cscDenominator:1},
      {theta:Math.PI/3,label:'\\pi/3',cscNumerator:4,cscDenominator:3}
    ]);
  var theta=angleData.theta;
  var omega=mode==='calculator'?pick([2.1,2.8,3.5]):pick([0.5,1,2]);
  var signed=-distance*omega/(Math.sin(theta)*Math.sin(theta)),speed=Math.abs(signed);
  var answer;
  if(mode==='calculator')answer=calcOrExact(mode,speed,'','');
  else{
    var exact=rational(distance*omega*angleData.cscNumerator,angleData.cscDenominator);
    answer={answer:exact.input,answerTex:exact.tex,value:null};
  }
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'rotating_spotlight',id:'u3-v127-rr-spotlight-'+mode+'-'+distance+'-'+trim(theta,4),
    variant:'related_rates_rotating_spotlight',
    prompt:'A rotating spotlight is on a buoy \\('+distance+'\\) feet perpendicular from a straight shoreline. The beam makes angle \\('+(mode==='calculator'?trim(theta,6):angleData.label)+'\\) with the shoreline and turns at \\('+trim(omega,2)+'\\) radians per minute. Find the speed of the light spot along the shoreline.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x\\) be the signed shoreline distance from the nearest point to the buoy. The given angular rate is \\(\\frac{d\\theta}{dt}='+trim(omega,2)+'\\).',
      'Because \\(\\theta\\) is measured from the shoreline, \\(\\tan\\theta=\\frac{'+distance+'}{x}\\), so \\(x='+distance+'\\cot\\theta\\).',
      'Differentiate with respect to time: \\(\\frac{dx}{dt}=-'+distance+'\\csc^2\\theta\\frac{d\\theta}{dt}\\).',
      'Substitute the stated angle and angular rate.',
      'The signed velocity is \\(\\frac{dx}{dt}='+trim(signed,8)+'\\) feet per minute.',
      'Speed is the magnitude, so \\(|\\frac{dx}{dt}|='+trim(speed,8)+'\\).',
      'The sign only indicates which direction the spot moves along the shoreline.',
      rateConclusion('\\text{speed}',speed,'feet per minute',mode)
    ]
  });
}

function rrAngleElevation(mode,source){
  var distance=mode==='calculator'?pick([243.5,387.2,512.6]):pick([100,200,500]);
  var height=mode==='calculator'?pick([127.4,215.8,336.1]):pick([100,150,200]);
  var vertical=mode==='calculator'?pick([-12.7,8.4,15.3]):pick([-15,10,20]);
  var rate=distance*vertical/(distance*distance+height*height);
  var exact=rational(distance*vertical,distance*distance+height*height),answer=mode==='calculator'?calcOrExact(mode,rate,'',''):{answer:exact.input,answerTex:exact.tex,value:null};
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'angle_of_elevation',id:'u3-v127-rr-angle-'+mode+'-'+trim(distance,1)+'-'+trim(height,1),
    variant:'related_rates_angle_of_elevation',
    prompt:'An observer stands \\('+trim(distance,1)+'\\) feet from a balloon’s vertical path. When the balloon is \\('+trim(height,1)+'\\) feet high, its vertical velocity is \\('+trim(vertical,1)+'\\) feet per second. Find the rate of change of the angle of elevation.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(y\\) be balloon height and \\(\\theta\\) the angle of elevation. The horizontal distance \\('+trim(distance,1)+'\\) is constant.',
      'The relationship is \\(\\tan\\theta=\\frac{y}{'+trim(distance,1)+'}\\).',
      'Differentiate with respect to time: \\(\\sec^2\\theta\\frac{d\\theta}{dt}=\\frac1{'+trim(distance,1)+'}\\frac{dy}{dt}\\).',
      'Use \\(\\sec^2\\theta=1+\\tan^2\\theta=\\frac{'+trim(distance*distance+height*height,3)+'}{'+trim(distance*distance,3)+'}\\) at this instant.',
      'Substitute \\(y='+trim(height,1)+'\\) and \\(\\frac{dy}{dt}='+trim(vertical,1)+'\\).',
      'Solving gives \\(\\frac{d\\theta}{dt}=\\frac{('+trim(distance,1)+')('+trim(vertical,1)+')}{'+trim(distance*distance+height*height,3)+'}='+trim(rate,8)+'\\).',
      'The '+(rate<0?'negative':'positive')+' sign means the angle is '+(rate<0?'decreasing':'increasing')+'.',
      rateConclusion('\\frac{d\\theta}{dt}',rate,'radians per second',mode)
    ]
  });
}

function rrRopeBalloon(mode,source){
  var horizontal=mode==='calculator'?pick([93.4,128.6,156.2]):120;
  var elapsed=mode==='calculator'?pick([12.7,18.3,24.6]):20;
  var ropeRate=mode==='calculator'?pick([8.4,12.6,15.7]):4;
  var rope=horizontal+ropeRate*elapsed;
  var height=Math.sqrt(rope*rope-horizontal*horizontal),rate=rope*ropeRate/height;
  var exactRate=mode==='noncalculator'?rational(rope*ropeRate,height):null;
  var answer=mode==='calculator'?calcOrExact(mode,rate,'',''):{answer:exactRate.input,answerTex:exactRate.tex,value:null};
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'rope_spool_balloon',id:'u3-v127-rr-rope-balloon-'+mode+'-'+trim(horizontal,1),
    variant:'related_rates_rope_spool_balloon',
    prompt:'A balloon rises vertically from a point \\('+trim(horizontal,1)+'\\) feet from a fixed rope spool. The rope is paid out at \\('+trim(ropeRate,1)+'\\) feet per second. Find the balloon’s vertical speed \\('+trim(elapsed,1)+'\\) seconds after lift-off.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(y\\) be balloon height and \\(s\\) rope length. The horizontal distance is fixed and \\(\\frac{ds}{dt}='+trim(ropeRate,1)+'\\).',
      'After \\('+trim(elapsed,1)+'\\) seconds, \\(s='+trim(horizontal,1)+'+'+trim(ropeRate,1)+'('+trim(elapsed,1)+')='+trim(rope,6)+'\\) feet.',
      'The geometry gives \\(s^2='+trim(horizontal*horizontal,3)+'+y^2\\), so \\(y='+trim(height,8)+'\\) feet at this instant.',
      'Differentiate with respect to time: \\(2s\\frac{ds}{dt}=2y\\frac{dy}{dt}\\).',
      'Substitute \\(s='+trim(rope,6)+'\\), \\(y='+trim(height,8)+'\\), and \\(\\frac{ds}{dt}='+trim(ropeRate,1)+'\\).',
      'Solving gives \\(\\frac{dy}{dt}=\\frac{s(ds/dt)}{y}='+trim(rate,8)+'\\) feet per second.',
      'The rate is positive because the balloon is rising.',
      rateConclusion('\\frac{dy}{dt}',rate,'feet per second',mode)
    ]
  });
}

function rrImplicit(mode,source){
  var x=mode==='calculator'?pick([1.7,2.4,3.1]):pick([1,2,3]);
  var y=mode==='calculator'?pick([2.2,3.6,4.3]):pick([2,3,4]);
  var dx=mode==='calculator'?pick([-1.25,0.8,1.7]):pick([-2,-1,1,2]);
  var rate=-(x*x*dx)/(y*y);
  var exact=rational(-x*x*dx,y*y),answer=mode==='calculator'?calcOrExact(mode,rate,'',''):{answer:exact.input,answerTex:exact.tex,value:null};
  var constant=x*x*x+y*y*y;
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'implicit_equation_rates',id:'u3-v127-rr-implicit-'+mode+'-'+trim(x,1)+'-'+trim(y,1),
    variant:'related_rates_implicit_equation',
    prompt:'Variables \\(x\\) and \\(y\\) satisfy \\(x^3+y^3='+trim(constant,5)+'\\). At the instant \\(x='+trim(x,1)+'\\), \\(y='+trim(y,1)+'\\), and \\(\\frac{dx}{dt}='+trim(dx,2)+'\\), find \\(\\frac{dy}{dt}\\).',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Both \\(x\\) and \\(y\\) are functions of time. The known rate is \\(\\frac{dx}{dt}='+trim(dx,2)+'\\); the requested rate is \\(\\frac{dy}{dt}\\).',
      'Use the given relationship \\(x^3+y^3='+trim(constant,5)+'\\).',
      'Differentiate with respect to time: \\(3x^2\\frac{dx}{dt}+3y^2\\frac{dy}{dt}=0\\).',
      'Substitute \\(x='+trim(x,1)+'\\), \\(y='+trim(y,1)+'\\), and \\(\\frac{dx}{dt}='+trim(dx,2)+'\\).',
      'Solve: \\(\\frac{dy}{dt}=-\\frac{x^2(dx/dt)}{y^2}\\).',
      'This gives \\(\\frac{dy}{dt}='+trim(rate,8)+'\\).',
      'The sign shows that \\(y\\) is '+(rate<0?'decreasing':'increasing')+' at this instant.',
      rateConclusion('\\frac{dy}{dt}',rate,'units per unit time',mode)
    ]
  });
}

function rrDelayedBikes(mode,source){
  var northRate=mode==='calculator'?pick([7.3,9.6,12.4]):8;
  var eastRate=mode==='calculator'?pick([4.7,6.2,8.5]):5;
  var delay=mode==='calculator'?pick([3.4,5.7,7.2]):5;
  var after=mode==='calculator'?pick([13.6,18.4,22.7]):20;
  var north=northRate*(after+delay),east=eastRate*after,distance=Math.hypot(north,east);
  var rate=(north*northRate+east*eastRate)/distance;
  var answer=mode==='calculator'
    ?calcOrExact(mode,rate,'','')
    :{answer:'21/sqrt(5)',answerTex:'\\frac{21}{\\sqrt5}',value:null};
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'delayed_start_perpendicular_motion',id:'u3-v127-rr-delayed-bikes-'+mode+'-'+trim(delay,1)+'-'+trim(after,1),
    variant:'related_rates_delayed_start_bicycles',
    prompt:'One cyclist rides north at \\('+trim(northRate,1)+'\\) meters per second. After \\('+trim(delay,1)+'\\) seconds, a second cyclist starts east from the same point at \\('+trim(eastRate,1)+'\\) meters per second. How fast is their separation changing \\('+trim(after,1)+'\\) seconds after the second cyclist starts?',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x\\) be eastward distance, \\(y\\) northward distance, and \\(d\\) separation.',
      'At the requested time, \\(x='+trim(eastRate,1)+'('+trim(after,1)+')='+trim(east,6)+'\\) and \\(y='+trim(northRate,1)+'('+trim(after+delay,1)+')='+trim(north,6)+'\\).',
      'The known rates are \\(\\frac{dx}{dt}='+trim(eastRate,1)+'\\) and \\(\\frac{dy}{dt}='+trim(northRate,1)+'\\).',
      'Use \\(d^2=x^2+y^2\\) and differentiate: \\(2d\\frac{dd}{dt}=2x\\frac{dx}{dt}+2y\\frac{dy}{dt}\\).',
      'The event-time distance is \\(d='+trim(distance,8)+'\\).',
      'Substitute all event values to get \\(\\frac{dd}{dt}=\\frac{x(dx/dt)+y(dy/dt)}d='+trim(rate,8)+'\\).',
      'The result is positive, so their separation is increasing.',
      rateConclusion('\\frac{dd}{dt}',rate,'meters per second',mode)
    ]
  });
}

function rrIceHemisphere(mode,source){
  var inner=mode==='calculator'?pick([8.4,10.2,12.7]):10;
  var thickness=mode==='calculator'?pick([0.12,0.18,0.27]):1/6;
  var thicknessRate=mode==='calculator'?pick([-0.014,-0.021,-0.033]):-1/48;
  var outer=inner+thickness,rate=2*Math.PI*outer*outer*thicknessRate;
  var answer;
  if(mode==='calculator')answer=calcOrExact(mode,rate,'','');
  else answer={answer:'-3721*pi/864',answerTex:'-\\frac{3721\\pi}{864}',value:null};
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'hemispherical_ice_layer',id:'u3-v127-rr-ice-'+mode+'-'+trim(inner,1),
    variant:'related_rates_hemispherical_ice_layer',
    prompt:'A hemispherical roof of radius \\('+trim(inner,1)+'\\) feet is coated uniformly with ice. When the ice is \\('+trim(thickness,3)+'\\) feet thick, its thickness changes at \\('+trim(thicknessRate,4)+'\\) feet per hour. Find the rate of change of the ice volume.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(R\\) be the outer radius. The inner radius is constant, and \\(\\frac{dR}{dt}='+trim(thicknessRate,4)+'\\).',
      'The outer radius at this instant is \\(R='+trim(inner,1)+'+'+trim(thickness,3)+'='+trim(outer,6)+'\\) feet.',
      'Ice volume is \\(V=\\frac23\\pi(R^3-'+trim(inner*inner*inner,4)+')\\).',
      'Differentiate with respect to time: \\(\\frac{dV}{dt}=2\\pi R^2\\frac{dR}{dt}\\).',
      'Substitute \\(R='+trim(outer,6)+'\\) and \\(\\frac{dR}{dt}='+trim(thicknessRate,4)+'\\).',
      'This gives \\(\\frac{dV}{dt}='+trim(rate,8)+'\\) cubic feet per hour.',
      'The negative sign means the ice volume is decreasing.',
      rateConclusion('\\frac{dV}{dt}',rate,'cubic feet per hour',mode)
    ]
  });
}

var relatedAssignment=[
  descriptor('sphere_volume_to_radius','assignment',rrSphereFromVolume,'sphere_rates'),
  descriptor('sphere_diameter_to_volume','assignment',rrSphereFromDiameter,'sphere_rates'),
  descriptor('circular_area_from_radius','assignment',function(mode,source){return rrCircleArea(mode,source,false);},'circle_rates'),
  descriptor('circular_radius_from_area','assignment',function(mode,source){return rrCircleArea(mode,source,true);},'circle_rates'),
  descriptor('circular_wave_circumference','assignment',rrCircularWave,'circle_rates'),
  descriptor('ladder_top','assignment',function(mode,source){return rrLadder(mode,source,'top');},'ladder_rates'),
  descriptor('ladder_area','assignment',function(mode,source){return rrLadder(mode,source,'area');},'ladder_rates'),
  descriptor('ladder_angle','assignment',function(mode,source){return rrLadder(mode,source,'angle');},'ladder_rates'),
  descriptor('lamppost_shadow_length','assignment',function(mode,source){return rrShadow(mode,source,false);},'shadow_rates'),
  descriptor('lamppost_shadow_tip','assignment',function(mode,source){return rrShadow(mode,source,true);},'shadow_rates'),
  descriptor('conical_pile','assignment',rrConePile),
  descriptor('inverted_conical_tank','assignment',rrConicalTank),
  descriptor('triangular_trough','assignment',rrTriangularTrough,'trough_rates'),
  descriptor('trapezoidal_trough','assignment',rrTrapezoidTrough,'trough_rates'),
  descriptor('equilateral_triangle_area','assignment',function(mode,source){return rrPolygonArea(mode,source,'equilateral');},'polygon_area_rates'),
  descriptor('balloon_bicycle_distance','assignment',rrBalloonBike,'perpendicular_motion'),
  descriptor('softball_diamond','assignment',rrSoftball,'perpendicular_motion'),
  descriptor('rope_spool_balloon','assignment',rrRopeBalloon,'perpendicular_motion'),
  descriptor('hemispherical_ice_layer','assignment',rrIceHemisphere)
];
var relatedTest=[
  descriptor('test_rotating_spotlight','test',rrSpotlight),
  descriptor('test_conical_pile','test',rrConePile),
  descriptor('test_ladder_area','test',function(mode,source){return rrLadder(mode,source,'area');},'ladder_rates')
];
var relatedExtension=[
  descriptor('sphere_surface_area_to_volume','extension',rrSphereSurfaceToVolume,'sphere_rates'),
  descriptor('cylindrical_tank','extension',rrCylinderTank),
  descriptor('square_area','extension',function(mode,source){return rrPolygonArea(mode,source,'square');},'polygon_area_rates'),
  descriptor('angle_of_elevation','extension',rrAngleElevation),
  descriptor('implicit_equation_rates','extension',rrImplicit),
  descriptor('delayed_start_perpendicular_motion','extension',rrDelayedBikes,'perpendicular_motion')
];
function relatedRates(options){
  var mode=modeOf(options),selection=sourcePool(relatedAssignment,relatedTest,relatedExtension);
  var chosen=diverse('related-rates:'+mode,selection.pool);
  return chosen.build(mode,selection.source);
}

/* Replace only the two requested generators while retaining every other API. */
var replacements={'optimization':optimization,'related-rates':relatedRates};
window.BatchMathAPTopicGenerators={
  get:function(slug){return replacements[slug]||(previousApi&&previousApi.get?previousApi.get(slug):null);},
  slugs:function(){
    var old=previousApi&&previousApi.slugs?previousApi.slugs():[];
    return Array.from(new Set(old.concat(Object.keys(replacements))));
  },
  unit3Slugs:previousApi&&previousApi.unit3Slugs?function(){return previousApi.unit3Slugs();}:undefined
};
window.BatchMathUnit3ApplicationsGenerators={
  get:function(slug){return replacements[slug]||(previousUnit3&&previousUnit3.get?previousUnit3.get(slug):null);},
  slugs:function(){
    var old=previousUnit3&&previousUnit3.slugs?previousUnit3.slugs():[];
    return Array.from(new Set(old.concat(Object.keys(replacements))));
  }
};
window.BatchMathUnit3OptimizationRelatedRates={
  optimizationFamilies:function(){return optimizationAssignment.concat(optimizationTest,optimizationExtension).map(function(item){return item.family;});},
  relatedRatesFamilies:function(){return relatedAssignment.concat(relatedTest,relatedExtension).map(function(item){return item.family;});}
};
})();

