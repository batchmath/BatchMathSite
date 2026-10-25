(function(){
'use strict';

/*
 * BatchMath AP Calculus AB Unit 3
 * Shared Optimization / Related Rates curriculum expansion (v12.8.F).
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

function escapeRegExp(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function unitPhrase(value,singular,plural){return Number(value)===1?singular:(plural||singular+'s');}
function fractionTex(n,d){return rational(n,d).tex;}
function fractionInput(n,d){return rational(n,d).input;}
function exactDecimal(n,d){var value=rational(n,d);return{value:value.value,input:value.input,tex:value.tex};}
function plainNumber(value){return Number(value).toLocaleString('en-US',{useGrouping:false,maximumFractionDigits:12});}
function money(value){return '\\(\\$'+trim(value,2)+'\\)';}

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
  var filler=[
    /The requested rate is the rate found above\.?/i,
    /The requested rate is .* itself\.?/i,
    /The sign follows the geometry at the stated instant\.?/i,
    /No length values were substituted until after differentiating[^.]*\.?/i,
    /^Therefore (?:the )?requested\b/i,
    /^Thus (?:the )?requested\b/i,
    /^The requested\b/i
  ];
  var useful=(steps||[]).filter(function(step){return step&& !filler.some(function(pattern){return pattern.test(step);});});
  useful=useful.map(function(step){return String(step)
    .replace(/At this event/gi,'At the moment described')
    .replace(/at this event/gi,'at the moment described')
    .replace(/relevant interior critical value/gi,'critical value inside the allowed interval')
    .replace(/admissible critical value/gi,'critical value inside the allowed interval')
    .replace(/interior critical value/gi,'critical value inside the allowed interval')
    .replace(/physical interval/gi,'allowed interval')
    .replace(/physical domain/gi,'allowed values')
    .replace(/one-variable objective/gi,'equation in one variable')
    .replace(/one-variable cost/gi,'cost function')
    .replace(/one-variable expression/gi,'resulting expression')
    .replace(/Substitution gives the equation in one variable/gi,'Substituting this into the original equation gives')
    .replace(/Substitution gives/gi,'Substituting gives')
    .replace(/Keep the full stored value/gi,'Keep the full calculator value');
  });
  return '<div class="worked-steps">'+useful.map(function(step,index){
    return '<p><strong>Step '+(index+1)+':</strong> '+step+'</p>';
  }).join('')+'</div>';
}
function needsSymbolicExact(answer){
  var text=String(answer||'');
  if(/\b(?:pi|sqrt)\b/i.test(text))return true;
  var match=text.match(/\(?\s*-?\d+\s*\)?\s*\/\s*\(?\s*(\d+)\s*\)?/);
  if(!match)return false;
  var denominator=Number(match[1]);while(denominator%2===0)denominator/=2;while(denominator%5===0)denominator/=5;
  return denominator!==1;
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
    requireExact:spec.requireExact==null?needsSymbolicExact(spec.answer):!!spec.requireExact,
    expressionPlaceholder:'Enter the exact value',
    explanation:worked(spec.steps),
    fullWidthChoices:true
  };
}
function fieldsProblem(spec){
  return{
    id:spec.id,
    variant:spec.variant,
    questionHtml:questionHtml(spec.prompt,spec.math||''),
    answerType:'calculus-fields',
    fields:(spec.fields||[]).map(function(field){
      var copy=Object.assign({},field);
      if(copy.requiredDecimals==null&&spec.mode==='calculator')copy.requiredDecimals=3;
      if(copy.requireExact==null)copy.requireExact=spec.mode!=='calculator';
      return copy;
    }),
    answerTex:(spec.fields||[]).map(function(field){return field.label+field.answerTex;}).join(', '),
    explanation:worked(spec.steps),
    fullWidthChoices:true,
    calculatorActive:spec.mode==='calculator'
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
function formulaHint(formulas){
  return '<div class="geometry-formula-hint">'+formulas.map(function(formula){return '\\['+formula+'\\]';}).join('')+'</div>';
}
function diagramEscape(value){
  return String(value==null?'':value)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function diagramNumber(value,places){
  if(typeof value==='string')return value;
  return trim(Number(value),places==null?2:places);
}
function diagramMeasure(value,unit,places){
  return diagramNumber(value,places)+(unit?' '+unit:'');
}
function diagramText(x,y,text,kind,anchor,extra){
  var className='diagram-label diagram-label-'+(kind||'object');
  return '<text class="'+className+'" x="'+x+'" y="'+y+'" text-anchor="'+(anchor||'middle')+'"'+(extra?' '+extra:'')+'>'+diagramEscape(text)+'</text>';
}
function diagramLine(x1,y1,x2,y2,className,extra){
  return '<line class="'+(className||'diagram-object')+'" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'"'+(extra?' '+extra:'')+'/>';
}
function diagramDimension(x1,y1,x2,y2,label,kind,labelX,labelY,anchor){
  var className='diagram-dimension diagram-dimension-'+(kind||'fixed');
  return diagramLine(x1,y1,x2,y2,className,'marker-start="url(#diagram-arrow-start)" marker-end="url(#diagram-arrow-end)"')
    +diagramText(labelX==null?(x1+x2)/2:labelX,labelY==null?(y1+y2)/2-8:labelY,label,kind,anchor||'middle');
}
function diagramNotes(values){
  if(!values||!values.length)return'';
  return '<div class="diagram-fixed-notes" aria-label="Fixed information">'
    +values.map(function(value){return '<span>'+diagramEscape(value)+'</span>';}).join('')
    +'</div>';
}
function svgDiagram(data,body){
  var title=data.title||'Problem diagram';
  var description=data.description||'Diagram showing the geometry and labels used in this problem.';
  return '<div class="geometry-diagram-hint" data-diagram-kind="'+diagramEscape(data.kind||'')+'">'
    +'<div class="diagram-title">'+diagramEscape(title)+'</div>'
    +'<svg class="geometry-diagram" viewBox="0 0 600 340" role="img" aria-label="'+diagramEscape(description)+'" preserveAspectRatio="xMidYMid meet">'
    +'<defs>'
    +'<marker id="diagram-arrow-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M10 0L0 5L10 10Z"/></marker>'
    +'<marker id="diagram-arrow-end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z"/></marker>'
    +'<marker id="diagram-motion-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z"/></marker>'
    +'</defs>'+body+'</svg>'+diagramNotes(data.fixedNotes)+'</div>';
}
function clampDiagram(value,min,max){return Math.max(min,Math.min(max,value));}
function curveProjection(data){
  var left=Number(data.domain&&data.domain[0]),right=Number(data.domain&&data.domain[1]);
  if(!Number.isFinite(left)||!Number.isFinite(right)||right<=left)return null;
  var points=[],minY=Infinity,maxY=-Infinity;
  for(var index=0;index<=120;index+=1){
    var x=left+(right-left)*index/120,y=data.fn(x);
    if(Number.isFinite(y)){points.push({x:x,y:y});minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
    else points.push(null);
  }
  (data.includePoints||[]).forEach(function(point){
    if(point&&Number.isFinite(point[1])){minY=Math.min(minY,point[1]);maxY=Math.max(maxY,point[1]);}
  });
  if(data.includeZero!==false){minY=Math.min(minY,0);maxY=Math.max(maxY,0);}
  if(!Number.isFinite(minY)||!Number.isFinite(maxY))return null;
  if(Math.abs(maxY-minY)<1e-8){minY-=1;maxY+=1;}
  var pad=.1*(maxY-minY);minY-=pad;maxY+=pad;
  var mapX=function(value){return 72+(value-left)/(right-left)*468;};
  var mapY=function(value){return 286-(value-minY)/(maxY-minY)*238;};
  var path='',open=false;
  points.forEach(function(point){
    if(!point){open=false;return;}
    path+=(open?' L ':'M ')+mapX(point.x).toFixed(2)+' '+mapY(point.y).toFixed(2);open=true;
  });
  return{path:path,mapX:mapX,mapY:mapY,left:left,right:right,minY:minY,maxY:maxY};
}
function coordinateAxes(projection){
  var xAxis=projection.minY<=0&&projection.maxY>=0?projection.mapY(0):286;
  var yAxis=projection.left<=0&&projection.right>=0?projection.mapX(0):72;
  return diagramLine(54,xAxis,558,xAxis,'diagram-axis','marker-end="url(#diagram-motion-arrow)"')
    +diagramLine(yAxis,304,yAxis,30,'diagram-axis','marker-end="url(#diagram-motion-arrow)"')
    +diagramText(562,xAxis+5,'x','muted','start')
    +diagramText(yAxis+8,27,'y','muted','start');
}
function renderSheetNet(data){
  var ratio=clampDiagram(Number(data.length)/Number(data.width),1,2.5),height=180,width=height*ratio;
  if(width>410){width=410;height=width/ratio;}
  var x0=(600-width)/2,y0=62+(180-height)/2,cut=Math.min(42,height*.22);
  var body='<rect class="diagram-object-fill" x="'+x0+'" y="'+y0+'" width="'+width+'" height="'+height+'"/>'
    +'<path class="diagram-fold" d="M'+(x0+cut)+' '+y0+'V'+(y0+height)+' M'+(x0+width-cut)+' '+y0+'V'+(y0+height)
    +' M'+x0+' '+(y0+cut)+'H'+(x0+width)+' M'+x0+' '+(y0+height-cut)+'H'+(x0+width)+'"/>'
    +'<path class="diagram-cut" d="M'+x0+' '+y0+'h'+cut+'v'+cut+'h-'+cut+'z M'+(x0+width-cut)+' '+y0+'h'+cut+'v'+cut+'h-'+cut+'z M'+x0+' '+(y0+height-cut)+'h'+cut+'v'+cut+'h-'+cut+'z M'+(x0+width-cut)+' '+(y0+height-cut)+'h'+cut+'v'+cut+'h-'+cut+'z"/>'
    +diagramDimension(x0,y0+height+34,x0+width,y0+height+34,diagramMeasure(data.length,data.unit),'fixed',null,y0+height+57)
    +diagramDimension(x0-34,y0,x0-34,y0+height,diagramMeasure(data.width,data.unit),'fixed',x0-45,y0+height/2,'end')
    +diagramDimension(x0,y0-22,x0+cut,y0-22,data.cutLabel||'x','variable',null,y0-31)
    +diagramDimension(x0+cut+14,y0,x0+cut+14,y0+cut,data.cutLabel||'x','variable',x0+cut+26,y0+cut/2+5,'start');
  return svgDiagram(data,body);
}
function renderBox(data){
  var body='<path class="diagram-object-fill" d="M130 105L350 64L476 126L255 170Z M130 105V250L255 307V170 M255 307L476 257V126"/>'
    +'<path class="diagram-hidden" d="M350 64V212L476 257 M350 212L130 250"/>'
    +diagramDimension(143,82,350,45,data.baseX||'x','variable',245,47)
    +diagramDimension(370,53,488,111,data.baseY||data.baseX||'x','variable',444,68)
    +diagramDimension(505,126,505,257,data.heightLabel||'h','variable',522,197,'start');
  return svgDiagram(data,body);
}
function renderCylinder(data){
  var body='<ellipse class="diagram-object-fill" cx="300" cy="72" rx="118" ry="32"/>'
    +diagramLine(182,72,182,258,'diagram-object')
    +diagramLine(418,72,418,258,'diagram-object')
    +'<ellipse class="diagram-object-fill" cx="300" cy="258" rx="118" ry="32"/>'
    +(data.openTop?'<path class="diagram-hidden" d="M182 72A118 32 0 0 0 418 72"/>':'')
    +diagramDimension(300,72,418,72,data.radiusLabel||'r','variable',360,61)
    +diagramDimension(449,72,449,258,data.heightLabel||'h','variable',468,170,'start');
  if(data.surfaceLabels){
    body+=diagramText(300,111,data.surfaceLabels.top,'fixed')+diagramText(427,170,data.surfaceLabels.side,'fixed','start');
  }
  return svgDiagram(data,body);
}
function renderCapsule(data){
  var body='<path class="diagram-object-fill" d="M170 76A82 82 0 0 0 170 264H430A82 82 0 0 0 430 76Z"/>'
    +'<ellipse class="diagram-hidden" cx="170" cy="170" rx="28" ry="94"/><ellipse class="diagram-hidden" cx="430" cy="170" rx="28" ry="94"/>'
    +diagramDimension(170,296,430,296,data.lengthLabel||'L','variable',300,320)
    +diagramDimension(463,170,463,76,data.radiusLabel||'r','variable',481,126,'start');
  return svgDiagram(data,body);
}
function renderPyramid(data){
  var body='<path class="diagram-object-fill" d="M120 246L360 287L500 218L260 178Z M308 42L120 246 M308 42L360 287 M308 42L500 218 M308 42L260 178"/>'
    +diagramLine(308,42,308,234,'diagram-hidden')
    +diagramDimension(132,271,360,311,data.sideLabel||'s','variable',243,327)
    +diagramDimension(329,43,329,234,data.heightLabel||'h','variable',346,142,'start');
  return svgDiagram(data,body);
}
function renderFence(data){
  var x0=132,y0=78,width=336,height=176,body='';
  if(data.barn){
    body+=diagramLine(x0,y0,x0+width,y0,'diagram-fixed-object')+diagramText(x0+width/2,y0-18,'barn','fixed');
    body+=diagramLine(x0,y0,x0,y0+height,'diagram-accent')+diagramLine(x0,y0+height,x0+width,y0+height,'diagram-accent')+diagramLine(x0+width,y0,x0+width,y0+height,'diagram-accent');
  }else{
    body+='<rect class="diagram-accent-fill" x="'+x0+'" y="'+y0+'" width="'+width+'" height="'+height+'"/>';
  }
  body+=diagramDimension(x0,y0+height+34,x0+width,y0+height+34,data.yLabel||'y','variable',null,y0+height+58)
    +diagramDimension(x0-34,y0,x0-34,y0+height,data.xLabel||'x','variable',x0-47,y0+height/2,'end');
  if(data.costX)body+=diagramText(x0-10,y0+height/2,data.costX,'fixed','end')+diagramText(x0+width+10,y0+height/2,data.costX,'fixed','start');
  if(data.costY)body+=diagramText(x0+width/2,y0+height-12,data.costY,'fixed');
  return svgDiagram(data,body);
}
function renderWindow(data){
  var body='<rect class="diagram-object-fill" x="177" y="143" width="246" height="142"/>'
    +'<path class="diagram-object-fill" d="M177 143L300 46L423 143Z"/>'
    +diagramDimension(177,312,423,312,data.widthLabel||'w','variable',300,334)
    +diagramDimension(449,143,449,285,data.heightLabel||'h','variable',468,220,'start')
    +diagramText(300,105,data.widthLabel||'w','variable');
  return svgDiagram(data,body);
}
function renderInscribed(data){
  var cx=300,cy=data.semicircle?258:170,r=data.semicircle?174:132;
  var body;
  if(data.semicircle){
    body='<path class="diagram-object" d="M126 258A174 174 0 0 1 474 258"/>'+diagramLine(126,258,474,258,'diagram-fixed-object');
    var half=88,top=132,bottom=258;
    body+='<rect class="diagram-accent-fill" x="'+(cx-half)+'" y="'+top+'" width="'+(2*half)+'" height="'+(bottom-top)+'"/>'
      +diagramLine(cx,bottom,cx+half,top,'diagram-hidden')
      +diagramDimension(cx,bottom+28,cx+half,bottom+28,data.halfWidthLabel||'x','variable',cx+half/2,bottom+51)
      +diagramDimension(cx-half,bottom+62,cx+half,bottom+62,data.fullWidthLabel||'2x','variable',cx,bottom+78)
      +diagramDimension(cx+half+28,top,cx+half+28,bottom,data.heightLabel||'y','variable',cx+half+44,(top+bottom)/2,'start')
      +diagramText(cx+half/2+10,(top+bottom)/2-12,diagramMeasure(data.radius,data.unit),'fixed');
  }else{
    /* Use a deliberately non-square rectangle whose four corners lie on the
       circle. The radius begins at the shared center, so the picture gives
       the constraint without revealing the maximizing square. */
    var circleHalfWidth=108,circleHalfHeight=Math.sqrt(r*r-circleHalfWidth*circleHalfWidth);
    var left=cx-circleHalfWidth,right=cx+circleHalfWidth,circleTop=cy-circleHalfHeight,circleBottom=cy+circleHalfHeight;
    body='<circle class="diagram-object" cx="'+cx+'" cy="'+cy+'" r="'+r+'"/>'
      +'<rect class="diagram-accent-fill" x="'+left+'" y="'+circleTop.toFixed(2)+'" width="'+(2*circleHalfWidth)+'" height="'+(2*circleHalfHeight).toFixed(2)+'"/>'
      +'<circle class="diagram-point-fixed" cx="'+cx+'" cy="'+cy+'" r="4"/>'
      +diagramLine(cx,cy,right,circleTop.toFixed(2),'diagram-distance')
      +diagramDimension(left,circleBottom+28,right,circleBottom+28,data.fullWidthLabel||'x','variable',cx,circleBottom+52)
      +diagramDimension(right+30,circleTop,right+30,circleBottom,data.heightLabel||'y','variable',right+47,cy+5,'start')
      +diagramText(cx+67,cy-48,diagramMeasure(data.radius,data.unit),'fixed');
  }
  return svgDiagram(data,body);
}
function renderPage(data){
  var body='<rect class="diagram-object-fill" x="174" y="44" width="252" height="252"/>'
    +'<rect class="diagram-accent-fill" x="202" y="67" width="196" height="206"/>'
    +diagramDimension(174,320,426,320,data.widthLabel||'w','variable',300,338)
    +diagramDimension(450,44,450,296,data.heightLabel||'h','variable',468,174,'start')
    +diagramText(300,57,'top + bottom: '+diagramMeasure(data.verticalMargins,data.unit),'fixed')
    +diagramText(300,291,'left + right: '+diagramMeasure(data.horizontalMargins,data.unit),'fixed');
  return svgDiagram(data,body);
}
function renderCurve(data){
  var projection=curveProjection(data);
  if(!projection)return'';
  var body=coordinateAxes(projection)+'<path class="diagram-curve" d="'+projection.path+'"/>';
  if(data.kind==='curve-rectangle'){
    var preview=Number(data.previewX);
    if(!Number.isFinite(preview))preview=projection.left+.68*(projection.right-projection.left);
    var px=Math.abs(preview),y=data.fn(px),leftX=projection.mapX(-px),rightX=projection.mapX(px),baseY=projection.mapY(0),topY=projection.mapY(y);
    body+='<rect class="diagram-accent-fill" x="'+leftX+'" y="'+topY+'" width="'+(rightX-leftX)+'" height="'+(baseY-topY)+'"/>'
      +diagramLine(projection.mapX(0),baseY,rightX,baseY,'diagram-dimension-variable')
      +diagramText((projection.mapX(0)+rightX)/2,baseY-10,'x','variable')
      +diagramText((leftX+rightX)/2,baseY+24,'2x','variable')
      +diagramText(rightX+12,(topY+baseY)/2,'y','variable','start');
  }else{
    var vx=Number(data.previewX);
    if(!Number.isFinite(vx))vx=projection.left+.55*(projection.right-projection.left);
    var vy=data.fn(vx),fixed=data.fixedPoint,pX=projection.mapX(vx),pY=projection.mapY(vy),fX=projection.mapX(fixed[0]),fY=projection.mapY(fixed[1]);
    var segmentX=pX-fX,segmentY=pY-fY,segmentLength=Math.max(1,Math.hypot(segmentX,segmentY));
    var unitX=segmentX/segmentLength,unitY=segmentY/segmentLength,normalX=-unitY,normalY=unitX;
    var normalSide=((fY+pY)/2+26*normalY<42||(fY+pY)/2+26*normalY>300)?-1:1;
    var fixedLabelX=clampDiagram(fX-18*unitX-18*normalSide*normalX,82,518),fixedLabelY=clampDiagram(fY-18*unitY-18*normalSide*normalY,38,304);
    var variableLabelX=clampDiagram(pX+18*unitX-18*normalSide*normalX,82,518),variableLabelY=clampDiagram(pY+18*unitY-18*normalSide*normalY,38,304);
    var distanceLabelX=clampDiagram((fX+pX)/2+27*normalSide*normalX,82,518),distanceLabelY=clampDiagram((fY+pY)/2+27*normalSide*normalY,38,304);
    body+=diagramLine(fX,fY,pX,pY,'diagram-distance')
      +'<circle class="diagram-point-fixed" cx="'+fX+'" cy="'+fY+'" r="6"/>'
      +'<circle class="diagram-point-variable" cx="'+pX+'" cy="'+pY+'" r="6"/>'
      +diagramText(fixedLabelX,fixedLabelY,data.fixedPointLabel,'fixed')
      +diagramText(variableLabelX,variableLabelY,data.variablePointLabel||'P=(x,f(x))','variable')
      +diagramText(distanceLabelX,distanceLabelY,'d','variable');
  }
  body+=diagramText(530,48,data.curveLabel||'curve','fixed','end');
  return svgDiagram(data,body);
}
function renderPoles(data){
  var maxHeight=Math.max(Number(data.leftHeight),Number(data.rightHeight),1),leftTop=246-150*Number(data.leftHeight)/maxHeight,rightTop=246-150*Number(data.rightHeight)/maxHeight;
  var body=diagramLine(55,246,545,246,'diagram-ground')
    +diagramLine(130,246,130,leftTop,'diagram-fixed-object')
    +diagramLine(470,246,470,rightTop,'diagram-fixed-object')
    +'<circle class="diagram-point-variable" cx="292" cy="246" r="6"/>'
    +diagramLine(130,leftTop,292,246,'diagram-accent')
    +diagramLine(470,rightTop,292,246,'diagram-accent')
    +diagramDimension(95,246,95,leftTop,diagramMeasure(data.leftHeight,data.unit),'fixed',80,(246+leftTop)/2,'end')
    +diagramDimension(505,246,505,rightTop,diagramMeasure(data.rightHeight,data.unit),'fixed',520,(246+rightTop)/2,'start')
    +diagramDimension(130,290,470,290,diagramMeasure(data.distance,data.unit),'fixed',300,315)
    +diagramText(211,266,data.leftDistanceLabel||'x','variable')
    +diagramText(381,266,data.rightDistanceLabel||'d-x','variable');
  return svgDiagram(data,body);
}
function renderLadderFence(data){
  var body=diagramLine(54,267,548,267,'diagram-ground')
    +diagramLine(488,38,488,267,'diagram-fixed-object')
    +diagramLine(360,267,360,151,'diagram-fixed-object')
    +diagramLine(114,267,488,61,'diagram-accent')
    +diagramDimension(326,267,326,151,diagramMeasure(data.fenceHeight,data.unit),'fixed',311,211,'end')
    +diagramDimension(360,299,488,299,diagramMeasure(data.gap,data.unit),'fixed',424,323)
    +diagramDimension(114,285,360,285,data.variableLabel||'x','variable',237,309)
    +diagramText(500,50,'building','fixed','start')+diagramText(360,139,'fence','fixed');
  return svgDiagram(data,body);
}
function renderCone(data){
  var body='<ellipse class="diagram-object" cx="300" cy="79" rx="128" ry="35"/>'
    +'<path class="diagram-object-fill" d="M172 79L300 297L428 79"/>'
    +diagramLine(300,79,300,297,'diagram-hidden')
    +diagramDimension(300,79,428,79,data.radiusLabel||'r','variable',364,66)
    +diagramDimension(321,79,321,297,data.heightLabel||'h','variable',339,191,'start');
  if(data.slantLabel)body+=diagramText(385,192,data.slantLabel,'fixed');
  return svgDiagram(data,body);
}
function renderMotion(data){
  var body=diagramLine(76,270,544,270,'diagram-axis','marker-end="url(#diagram-motion-arrow)"')
    +diagramLine(108,302,108,40,'diagram-axis','marker-end="url(#diagram-motion-arrow)"')
    +'<circle class="diagram-point-variable" cx="430" cy="270" r="7"/><circle class="diagram-point-variable" cx="108" cy="88" r="7"/>'
    +diagramLine(108,88,430,270,'diagram-distance')
    +diagramText(273,290,data.xLabel||'x','variable')
    +diagramText(91,181,data.yLabel||'y','variable','end')
    +diagramText(270,168,data.distanceLabel||'d','variable');
  if(data.initialSeparation)body+=diagramText(122,116,'initial: '+diagramMeasure(data.initialSeparation,data.unit),'fixed','start');
  if(data.horizontalSpeed)body+=diagramText(430,296,diagramMeasure(data.horizontalSpeed,data.speedUnit),'fixed');
  if(data.verticalSpeed)body+=diagramText(83,87,diagramMeasure(data.verticalSpeed,data.speedUnit),'fixed','end');
  return svgDiagram(data,body);
}
function renderPigPen(data){
  var body=diagramLine(104,58,496,58,'diagram-fixed-object')+diagramText(300,38,'barn','fixed')
    +'<path class="diagram-accent-fill" d="M166 58L166 224L300 294L434 224L434 58Z"/>'
    +diagramText(150,145,diagramMeasure(data.side,data.unit),'fixed','end')
    +diagramText(450,145,diagramMeasure(data.side,data.unit),'fixed','start')
    +diagramText(229,269,diagramMeasure(data.side,data.unit),'fixed')
    +diagramText(371,269,diagramMeasure(data.side,data.unit),'fixed')
    +diagramDimension(166,82,434,82,data.baseLabel||'b','variable',300,102);
  return svgDiagram(data,body);
}
function renderWire(data){
  var body=diagramLine(76,58,524,58,'diagram-accent')
    +diagramLine(300,42,300,74,'diagram-cut-line')
    +diagramText(188,42,data.firstLabel||'x','variable')
    +diagramText(412,42,data.secondLabel||'L-x','variable')
    +'<circle class="diagram-object" cx="178" cy="205" r="70"/>'
    +'<rect class="diagram-object-fill" x="363" y="135" width="140" height="140"/>'
    +diagramText(178,301,'circle','fixed')+diagramText(433,301,'square','fixed');
  return svgDiagram(data,body);
}
function renderAxisTriangle(data){
  var body=diagramLine(64,278,546,278,'diagram-axis','marker-end="url(#diagram-motion-arrow)"')
    +diagramLine(100,307,100,42,'diagram-axis','marker-end="url(#diagram-motion-arrow)"')
    +'<path class="diagram-accent-fill" d="M100 83L480 278L100 278Z"/>'
    +'<circle class="diagram-point-fixed" cx="255" cy="162" r="6"/>'
    +diagramText(266,147,'('+diagramNumber(data.point[0])+','+diagramNumber(data.point[1])+')','fixed','start')
    +diagramText(480,302,data.xInterceptLabel||'X','variable')
    +diagramText(82,84,data.yInterceptLabel||'Y','variable','end');
  return svgDiagram(data,body);
}
function renderSphere(data){
  var body='<circle class="diagram-object-fill" cx="300" cy="172" r="118"/>'
    +'<ellipse class="diagram-hidden" cx="300" cy="172" rx="118" ry="34"/>'
    +diagramDimension(300,172,418,172,data.radiusLabel||'r','variable',359,158);
  return svgDiagram(data,body);
}
function renderCircle(data){
  var body='<circle class="diagram-object-fill" cx="300" cy="172" r="118"/>'
    +diagramDimension(300,172,418,172,data.radiusLabel||'r','variable',359,158);
  return svgDiagram(data,body);
}
function renderLadder(data){
  var body=diagramLine(65,274,535,274,'diagram-ground')
    +diagramLine(478,34,478,274,'diagram-fixed-object')
    +diagramLine(135,274,478,68,'diagram-accent')
    +diagramDimension(135,300,478,300,data.xLabel||'x','variable',307,326)
    +diagramDimension(510,274,510,68,data.yLabel||'y','variable',530,176,'start')
    +diagramText(300,154,diagramMeasure(data.length,data.unit),'fixed')
    +(data.angle==='ground'?'<path class="diagram-angle" d="M174 274A40 40 0 0 0 168 253"/>'+diagramText(186,253,'θ','variable'):'')
    +(data.angle==='wall'?'<path class="diagram-angle" d="M478 108A40 40 0 0 1 454 95"/>'+diagramText(448,120,'θ','variable'):'');
  return svgDiagram(data,body);
}
function renderShadow(data){
  var groundY=266,poleX=98,poleTopY=52,tipX=524;
  var heightRatio=clampDiagram(Number(data.personHeight)/Number(data.poleHeight),.18,.72);
  var personX=tipX-heightRatio*(tipX-poleX),personTopY=groundY-heightRatio*(groundY-poleTopY);
  /* The one light ray determines the person's visual location and height, so
     pole top, head, and shadow tip are exactly collinear. */
  var body=diagramLine(42,groundY,558,groundY,'diagram-ground')
    +diagramLine(poleX,groundY,poleX,poleTopY,'diagram-fixed-object')
    +diagramLine(personX,groundY,personX,personTopY,'diagram-fixed-object')
    +diagramLine(poleX,poleTopY,tipX,groundY,'diagram-accent')
    +diagramDimension(72,groundY,72,poleTopY,diagramMeasure(data.poleHeight,data.unit),'fixed',58,(groundY+poleTopY)/2,'end')
    +diagramDimension(personX-24,groundY,personX-24,personTopY,diagramMeasure(data.personHeight,data.unit),'fixed',personX-38,(groundY+personTopY)/2,'end')
    +diagramDimension(poleX,296,personX,296,data.personDistanceLabel||'x','variable',(poleX+personX)/2,324)
    +diagramDimension(personX,296,tipX,296,data.shadowLabel||'s','variable',(personX+tipX)/2,324);
  return svgDiagram(data,body);
}
function renderConicalTank(data){
  var axisX=300,topY=55,vertexY=307,topHalfWidth=142,topEllipseRy=34,waterY=188;
  var waterScale=(vertexY-waterY)/(vertexY-topY);
  var waterHalfWidth=topHalfWidth*waterScale,waterEllipseRy=topEllipseRy*waterScale;
  var waterLeft=axisX-waterHalfWidth,waterRight=axisX+waterHalfWidth;
  var body='<ellipse class="diagram-object" cx="'+axisX+'" cy="'+topY+'" rx="'+topHalfWidth+'" ry="'+topEllipseRy+'"/>'
    +'<path class="diagram-object" d="M'+(axisX-topHalfWidth)+' '+topY+'L'+axisX+' '+vertexY+'L'+(axisX+topHalfWidth)+' '+topY+'"/>'
    +'<path class="diagram-changing-fill" d="M'+waterLeft.toFixed(2)+' '+waterY+'L'+axisX+' '+vertexY+'L'+waterRight.toFixed(2)+' '+waterY+'Z"/>'
    +'<ellipse class="diagram-water-line" cx="'+axisX+'" cy="'+waterY+'" rx="'+waterHalfWidth.toFixed(2)+'" ry="'+waterEllipseRy.toFixed(2)+'"/>'
    +diagramLine(axisX,topY,axisX,vertexY,'diagram-hidden')
    +diagramDimension(axisX,topY,axisX+topHalfWidth,topY,diagramMeasure(data.tankRadius,data.unit),'fixed',axisX+topHalfWidth/2,42)
    +diagramDimension(468,topY,468,vertexY,diagramMeasure(data.tankHeight,data.unit),'fixed',486,(topY+vertexY)/2,'start')
    +diagramDimension(axisX,waterY,axisX,vertexY,data.depthLabel||'h','variable',318,(waterY+vertexY)/2+5,'start')
    +'<circle class="diagram-point-fixed" cx="'+axisX+'" cy="'+waterY+'" r="4"/>'
    +diagramDimension(axisX,waterY,waterRight.toFixed(2),waterY,data.waterRadiusLabel||'r','variable',axisX+waterHalfWidth/2,waterY-14);
  return svgDiagram(data,body);
}
function renderConePile(data){
  var body='<ellipse class="diagram-ground-ellipse" cx="300" cy="266" rx="166" ry="40"/>'
    +'<path class="diagram-changing-fill" d="M134 266L300 56L466 266Z"/>'
    +diagramDimension(300,266,466,266,data.radiusLabel||'r','variable',383,252)
    +diagramDimension(300,56,300,266,data.heightLabel||'h','variable',310,166,'start');
  return svgDiagram(data,body);
}
function renderTrough(data){
  var triangle=data.kind==='triangular-trough';
  var topY=62,bottomY=278,leftTop=112,rightTop=488;
  var leftBottom=triangle?300:188,rightBottom=triangle?300:412,waterY=174;
  var waterFraction=(waterY-topY)/(bottomY-topY);
  var waterLeft=leftTop+(leftBottom-leftTop)*waterFraction;
  var waterRight=rightTop+(rightBottom-rightTop)*waterFraction;
  var widthDimensionY=waterY-20;
  var body=triangle
    ?'<path class="diagram-object" d="M'+leftTop+' '+topY+'L'+leftBottom+' '+bottomY+'L'+rightTop+' '+topY+'"/>'
    :'<path class="diagram-object" d="M'+leftTop+' '+topY+'L'+leftBottom+' '+bottomY+'H'+rightBottom+'L'+rightTop+' '+topY+'"/>';
  body+=triangle
    ?'<path class="diagram-changing-fill" d="M'+waterLeft.toFixed(2)+' '+waterY+'L'+leftBottom+' '+bottomY+'L'+waterRight.toFixed(2)+' '+waterY+'Z"/>'
    :'<path class="diagram-changing-fill" d="M'+waterLeft.toFixed(2)+' '+waterY+'L'+leftBottom+' '+bottomY+'H'+rightBottom+'L'+waterRight.toFixed(2)+' '+waterY+'Z"/>';
  body+=diagramLine(waterLeft.toFixed(2),waterY,waterRight.toFixed(2),waterY,'diagram-water-line')
    +diagramDimension(300,waterY,300,bottomY,data.depthLabel||'h','variable',317,(waterY+bottomY)/2+3,'start')
    +diagramLine(waterLeft.toFixed(2),waterY,waterLeft.toFixed(2),widthDimensionY,'diagram-dimension diagram-dimension-variable')
    +diagramLine(waterRight.toFixed(2),waterY,waterRight.toFixed(2),widthDimensionY,'diagram-dimension diagram-dimension-variable')
    +diagramDimension(waterLeft.toFixed(2),widthDimensionY,waterRight.toFixed(2),widthDimensionY,data.waterWidthLabel||'w','variable',300,widthDimensionY-10)
    +diagramDimension(leftTop,36,rightTop,36,diagramMeasure(data.topWidth,data.unit),'fixed',300,24);
  if(!triangle)body+=diagramDimension(leftBottom,306,rightBottom,306,diagramMeasure(data.bottomWidth,data.unit),'fixed',300,329);
  return svgDiagram(data,body);
}
function renderCylinderTank(data){
  var body='<ellipse class="diagram-object" cx="300" cy="61" rx="122" ry="30"/>'
    +diagramLine(178,61,178,282,'diagram-object')+diagramLine(422,61,422,282,'diagram-object')
    +'<ellipse class="diagram-object" cx="300" cy="282" rx="122" ry="30"/>'
    +'<path class="diagram-changing-fill" d="M178 166V282A122 30 0 0 0 422 282V166A122 30 0 0 1 178 166Z"/>'
    +'<ellipse class="diagram-water-line" cx="300" cy="166" rx="122" ry="30"/>'
    +diagramDimension(300,61,422,61,diagramMeasure(data.radius,data.unit),'fixed',361,48)
    +diagramDimension(447,166,447,282,data.heightLabel||'h','variable',464,230,'start');
  return svgDiagram(data,body);
}
function renderChangingShape(data){
  var body='';
  if(data.shape==='circle'||data.shape==='semicircle'){
    body=data.shape==='circle'
      ?'<circle class="diagram-changing-fill" cx="300" cy="172" r="118"/>'
      :'<path class="diagram-changing-fill" d="M182 236A118 118 0 0 1 418 236H182Z"/>';
    body+=diagramDimension(300,data.shape==='circle'?172:236,418,data.shape==='circle'?172:236,data.radiusLabel||'r','variable',359,data.shape==='circle'?158:222);
  }else if(data.shape==='square'){
    body='<rect class="diagram-changing-fill" x="184" y="56" width="232" height="232"/>'
      +diagramDimension(184,314,416,314,data.sideLabel||'s','variable',300,336);
  }else if(data.shape==='equilateral'){
    body='<path class="diagram-changing-fill" d="M300 46L126 290H474Z"/>'
      +diagramDimension(126,316,474,316,data.sideLabel||'s','variable',300,338);
  }else if(data.shape==='rectangle'){
    body='<rect class="diagram-changing-fill" x="134" y="89" width="332" height="188"/>'
      +diagramDimension(134,308,466,308,data.widthLabel||'ℓ','variable',300,332)
      +diagramDimension(105,89,105,277,data.heightLabel||'w','variable',90,187,'end');
  }else if(data.shape==='isosceles_triangle'){
    var leftX=175,rightX=425,baseY=292,midX=(leftX+rightX)/2,apexY=42;
    var sideMidY=(apexY+baseY)/2,tickDx=6.3,tickDy=3.15;
    body='<path class="diagram-changing-fill" d="M'+leftX+' '+baseY+'H'+rightX+'L'+midX+' '+apexY+'Z"/>'
      +diagramLine(midX,apexY,midX,baseY,'diagram-hidden')
      +diagramLine((leftX+midX)/2-tickDx,sideMidY-tickDy,(leftX+midX)/2+tickDx,sideMidY+tickDy,'diagram-fixed-object')
      +diagramLine((rightX+midX)/2-tickDx,sideMidY+tickDy,(rightX+midX)/2+tickDx,sideMidY-tickDy,'diagram-fixed-object')
      +diagramDimension(leftX,318,rightX,318,data.baseLabel||'b','variable',midX,339)
      +diagramDimension(midX,apexY,midX,baseY,data.heightLabel||'h','variable',midX+17,(apexY+baseY)/2+5,'start');
  }else{
    body='<path class="diagram-changing-fill" d="M138 282H466L276 72Z"/>'
      +diagramDimension(138,311,466,311,data.baseLabel||'b','variable',302,335)
      +diagramDimension(293,72,293,282,data.heightLabel||'h','variable',311,180,'start');
  }
  return svgDiagram(data,body);
}
function renderDiamond(data){
  var center={x:300,y:170},halfDiagonal=130;
  var second={x:center.x,y:center.y-halfDiagonal},first={x:center.x+halfDiagonal,y:center.y};
  var home={x:center.x,y:center.y+halfDiagonal},third={x:center.x-halfDiagonal,y:center.y};
  var runnerFraction=clampDiagram(Number(data.runnerFromThird)/Number(data.side),.08,.92);
  var runner={x:third.x+(second.x-third.x)*runnerFraction,y:third.y+(second.y-third.y)*runnerFraction};
  var rootTwo=Math.sqrt(2),outward={x:-1/rootTwo,y:-1/rootTwo};
  var xOffset=18,x1={x:third.x+outward.x*xOffset,y:third.y+outward.y*xOffset},x2={x:runner.x+outward.x*xOffset,y:runner.y+outward.y*xOffset};
  var sideOut={x:-1/rootTwo,y:1/rootTwo},sideOffset=18;
  var side1={x:third.x+sideOut.x*sideOffset,y:third.y+sideOut.y*sideOffset},side2={x:home.x+sideOut.x*sideOffset,y:home.y+sideOut.y*sideOffset};
  var markerSize=15,homeUnit={x:1/rootTwo,y:1/rootTwo},secondUnit={x:1/rootTwo,y:-1/rootTwo};
  var markerA={x:third.x+homeUnit.x*markerSize,y:third.y+homeUnit.y*markerSize};
  var markerB={x:markerA.x+secondUnit.x*markerSize,y:markerA.y+secondUnit.y*markerSize};
  var markerC={x:third.x+secondUnit.x*markerSize,y:third.y+secondUnit.y*markerSize};
  var body='<path class="diagram-fixed-shape" d="M'+second.x+' '+second.y+'L'+first.x+' '+first.y+'L'+home.x+' '+home.y+'L'+third.x+' '+third.y+'Z"/>'
    +'<path class="diagram-fixed-object" d="M'+markerA.x.toFixed(2)+' '+markerA.y.toFixed(2)+'L'+markerB.x.toFixed(2)+' '+markerB.y.toFixed(2)+'L'+markerC.x.toFixed(2)+' '+markerC.y.toFixed(2)+'"/>'
    +'<circle class="diagram-point-fixed" cx="'+home.x+'" cy="'+home.y+'" r="5"/><circle class="diagram-point-fixed" cx="'+third.x+'" cy="'+third.y+'" r="5"/>'
    +'<circle class="diagram-point-variable" cx="'+runner.x.toFixed(2)+'" cy="'+runner.y.toFixed(2)+'" r="7"/>'
    +diagramLine(home.x,home.y,runner.x.toFixed(2),runner.y.toFixed(2),'diagram-distance')
    +diagramText(home.x,326,'home','fixed')+diagramText(third.x-16,third.y+5,'third','fixed','end')+diagramText(second.x,25,'second','fixed')
    +diagramDimension(side1.x.toFixed(2),side1.y.toFixed(2),side2.x.toFixed(2),side2.y.toFixed(2),diagramMeasure(data.side,data.unit),'fixed',210,263)
    +diagramDimension(x1.x.toFixed(2),x1.y.toFixed(2),x2.x.toFixed(2),x2.y.toFixed(2),data.runnerDistanceLabel||'x','variable',(x1.x+x2.x)/2-10,(x1.y+x2.y)/2-10)
    +diagramText((home.x+runner.x)/2+16,(home.y+runner.y)/2,data.distanceLabel||'d','variable');
  return svgDiagram(data,body);
}
function renderSpotlight(data){
  var buoyX=160,buoyY=66,shoreY=270,visualOffset=shoreY-buoyY;
  var theta=clampDiagram(Number(data.angleValue),.18,1.08),spotX=buoyX+visualOffset*Math.tan(theta);
  var arcRadius=42,arcX=buoyX+arcRadius*Math.sin(theta),arcY=buoyY+arcRadius*Math.cos(theta);
  var labelRadius=63,labelX=buoyX+labelRadius*Math.sin(theta/2),labelY=buoyY+labelRadius*Math.cos(theta/2);
  var body=diagramLine(68,shoreY,548,shoreY,'diagram-fixed-object')
    +'<circle class="diagram-point-fixed" cx="'+buoyX+'" cy="'+buoyY+'" r="8"/>'
    +diagramLine(buoyX,buoyY,buoyX,shoreY,'diagram-fixed-object')
    +diagramLine(buoyX,buoyY,spotX.toFixed(2),shoreY,'diagram-accent')
    +'<path class="diagram-fixed-object" d="M'+buoyX+' '+(shoreY-17)+'H'+(buoyX+17)+'V'+shoreY+'"/>'
    +diagramDimension(134,buoyY,134,shoreY,diagramMeasure(data.offset,data.unit),'fixed',117,(buoyY+shoreY)/2,'end')
    +diagramDimension(buoyX,301,spotX.toFixed(2),301,data.distanceLabel||'x','variable',(buoyX+spotX)/2,328)
    +'<path class="diagram-angle" d="M'+buoyX+' '+(buoyY+arcRadius)+'A'+arcRadius+' '+arcRadius+' 0 0 0 '+arcX.toFixed(2)+' '+arcY.toFixed(2)+'"/>'
    +diagramText(labelX.toFixed(2),labelY.toFixed(2),data.angleLabel||'θ','variable')
    +diagramText(buoyX,47,'spotlight','fixed');
  return svgDiagram(data,body);
}
function renderLineOfSight(data){
  var body=diagramLine(74,275,528,275,'diagram-ground')
    +diagramLine(454,275,454,67,'diagram-changing')
    +diagramLine(118,275,454,67,'diagram-distance')
    +diagramDimension(118,305,454,305,diagramMeasure(data.horizontal,data.unit),'fixed',286,331)
    +diagramDimension(480,275,480,67,data.heightLabel||'y','variable',498,178,'start')
    +(data.distanceLabel?diagramText(285,158,data.distanceLabel,'variable'):'')
    +(data.showAngle===false?'':'<path class="diagram-angle" d="M164 275A46 46 0 0 0 157 251"/>'+diagramText(178,250,data.angleLabel||'θ','variable'));
  return svgDiagram(data,body);
}
function renderIce(data){
  var cx=300,cy=274,innerVisualRadius=185,outerVisualRadius=204;
  var innerAngle=Math.PI/4,outerAngle=Math.PI/7;
  var innerEndX=cx+innerVisualRadius*Math.cos(innerAngle),innerEndY=cy-innerVisualRadius*Math.sin(innerAngle);
  var outerEndX=cx+outerVisualRadius*Math.cos(outerAngle),outerEndY=cy-outerVisualRadius*Math.sin(outerAngle);
  var fixedRadiusLabel=diagramMeasure(data.innerRadius,data.unit);
  var outerRadiusLabel=data.outerRadiusLabel||diagramNumber(data.innerRadius)+' + '+(data.thicknessLabel||'x');
  var body='<path class="diagram-object" d="M'+(cx-innerVisualRadius)+' '+cy+'A'+innerVisualRadius+' '+innerVisualRadius+' 0 0 1 '+(cx+innerVisualRadius)+' '+cy+'"/>'
    +diagramLine(cx-innerVisualRadius,cy,cx+innerVisualRadius,cy,'diagram-fixed-object')
    +'<path class="diagram-changing-stroke" d="M'+(cx-outerVisualRadius)+' '+cy+'A'+outerVisualRadius+' '+outerVisualRadius+' 0 0 1 '+(cx+outerVisualRadius)+' '+cy+'"/>'
    +'<circle class="diagram-point-fixed" cx="'+cx+'" cy="'+cy+'" r="4"/>'
    +diagramDimension(cx,cy,innerEndX.toFixed(2),innerEndY.toFixed(2),fixedRadiusLabel,'fixed',368,191)
    +diagramDimension(cx,cy,outerEndX.toFixed(2),outerEndY.toFixed(2),outerRadiusLabel,'variable',414,208)
    +diagramText(300,57,'changing ice layer','variable');
  return svgDiagram(data,body);
}
function renderSemicirclePoint(data){
  var cx=300,cy=282,visualRadius=190,radius=Number(data.radius);
  var normalizedX=Number(data.pointX)/radius,normalizedY=Number(data.pointY)/radius;
  var pointX=cx+visualRadius*normalizedX,pointY=cy-visualRadius*normalizedY;
  var body=diagramLine(72,cy,538,cy,'diagram-axis','marker-end="url(#diagram-motion-arrow)"')
    +diagramLine(cx,309,cx,36,'diagram-axis','marker-end="url(#diagram-motion-arrow)"')
    +'<path class="diagram-object" d="M'+(cx-visualRadius)+' '+cy+'A'+visualRadius+' '+visualRadius+' 0 0 1 '+(cx+visualRadius)+' '+cy+'"/>'
    +'<path class="diagram-changing-fill" d="M'+cx+' '+cy+'L'+pointX.toFixed(2)+' '+pointY.toFixed(2)+'L'+pointX.toFixed(2)+' '+cy+'Z"/>'
    +diagramLine(cx,cy,pointX.toFixed(2),pointY.toFixed(2),'diagram-distance')
    +'<circle class="diagram-point-variable" cx="'+pointX.toFixed(2)+'" cy="'+pointY.toFixed(2)+'" r="7"/>'
    +diagramDimension(cx,305,pointX.toFixed(2),305,data.xLabel||'x','variable',(cx+pointX)/2,332)
    +diagramDimension(pointX+27,pointY,pointX+27,cy,data.yLabel||'y','variable',pointX+45,(pointY+cy)/2,'start')
    +diagramText((cx+pointX)/2-13,(cy+pointY)/2-12,diagramMeasure(data.radius,data.unit),'fixed');
  return svgDiagram(data,body);
}
function diagramFor(family,spec){
  var data=spec&&spec.diagram;
  if(!data||!data.kind)return null;
  var renderers={
    'sheet-net':renderSheetNet,'box':renderBox,'cylinder':renderCylinder,'capsule':renderCapsule,'pyramid':renderPyramid,
    'fence':renderFence,'window':renderWindow,'inscribed-circle':renderInscribed,'inscribed-semicircle':renderInscribed,
    'page':renderPage,'curve-rectangle':renderCurve,'closest-curve':renderCurve,'poles':renderPoles,
    'ladder-fence':renderLadderFence,'cone':renderCone,'moving-paths':renderMotion,'pig-pen':renderPigPen,
    'wire-split':renderWire,'axis-triangle':renderAxisTriangle,'sphere':renderSphere,'circle':renderCircle,
    'ladder':renderLadder,'shadow':renderShadow,'conical-tank':renderConicalTank,'cone-pile':renderConePile,
    'triangular-trough':renderTrough,'trapezoidal-trough':renderTrough,'cylinder-tank':renderCylinderTank,
    'changing-shape':renderChangingShape,'perpendicular-motion':renderMotion,'softball-diamond':renderDiamond,
    'spotlight':renderSpotlight,'line-of-sight':renderLineOfSight,'rope-balloon':renderLineOfSight,
    'ice-hemisphere':renderIce,'semicircle-point':renderSemicirclePoint
  };
  var renderer=renderers[data.kind];
  return renderer?renderer(data):null;
}
var geometryFormulaHints={
  open_top_square_cardboard:['V=\\ell wh'],
  open_top_rectangular_cardboard:['V=\\ell wh'],
  open_box_dimensions_and_volume:['V=\\ell wh'],
  square_base_box_fixed_material:['V=s^2h'],
  closed_cylinder_fixed_volume:['V=\\pi r^2h','S=2\\pi r^2+2\\pi rh'],
  open_cylinder_fixed_volume:['V=\\pi r^2h','S=\\pi r^2+2\\pi rh'],
  cylinder_different_material_costs:['V=\\pi r^2h','A_{\\text{circle}}=\\pi r^2','A_{\\text{lateral}}=2\\pi rh'],
  capsule_unequal_material_costs:['V_{\\text{cylinder}}=\\pi r^2L','V_{\\text{sphere}}=\\frac43\\pi r^3','A_{\\text{lateral}}=2\\pi rL','A_{\\text{sphere}}=4\\pi r^2'],
  square_pyramid_fixed_volume:['V=\\frac13s^2h','A_{\\text{triangle}}=\\frac12b\\ell'],
  rectangular_fixed_perimeter_fencing:['A=\\ell w'],
  three_side_barn_fencing:['A=\\ell w'],
  different_cost_rectangle_fencing:['A=\\ell w'],
  equilateral_triangle_window:['A_{\\text{rectangle}}=wh','A_{\\text{equilateral triangle}}=\\frac{\\sqrt3}{4}s^2'],
  rectangle_in_semicircle:['A=wh','x^2+y^2=r^2'],
  rectangle_in_circle:['A=wh','x^2+y^2=(2r)^2'],
  rectangle_under_parabola:['A=wh'],
  rectangle_under_even_polynomial:['A=wh'],
  rectangle_under_quartic_arch:['A=wh'],
  rectangle_under_mixed_even_arch:['A=wh'],
  rectangle_under_trig_arch:['A=wh'],
  rectangle_under_semicircle_arch:['A=wh','x^2+y^2=r^2'],
  rectangle_under_ellipse_arch:['A=wh','\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1'],
  page_printed_area:['A=wh'],
  closest_point_square_root:['d=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}'],
  closest_point_polynomial:['d=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}'],
  closest_point_power_curve:['d=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}'],
  closest_point_cubic_curve:['d=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}'],
  closest_point_radical_curve:['d=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}'],
  closest_point_rational_curve:['d=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}'],
  two_poles_minimum_cable:['a^2+b^2=c^2'],
  shortest_ladder_over_fence:['a^2+b^2=c^2'],
  maximum_cone_from_right_triangle:['V=\\frac13\\pi r^2h','r^2+h^2=c^2'],
  minimum_distance_moving_ships:['d=\\sqrt{x^2+y^2}'],
  rigid_four_piece_barn_pen:['A_{\\text{rectangle}}=\\ell w','A_{\\text{triangle}}=\\frac12bh'],
  wire_split_circle_square:['A_{\\text{circle}}=\\pi r^2','C=2\\pi r','A_{\\text{square}}=s^2','P=4s'],
  minimum_axis_intercept_triangle:['A=\\frac12bh'],
  sphere_volume_to_radius:['V=\\frac43\\pi r^3'],
  sphere_diameter_to_volume:['V=\\frac43\\pi r^3','D=2r'],
  sphere_surface_area_to_volume:['S=4\\pi r^2','V=\\frac43\\pi r^3'],
  circular_area_from_radius:['A=\\pi r^2'],
  circular_radius_from_area:['A=\\pi r^2'],
  circular_wave_circumference:['C=2\\pi r'],
  ladder_top:['x^2+y^2=L^2'],
  ladder_bottom:['x^2+y^2=L^2'],
  ladder_area:['x^2+y^2=L^2','A=\\frac12xy'],
  ladder_angle:['x^2+y^2=L^2'],
  ladder_wallAngle:['x^2+y^2=L^2'],
  multi_part_ladder:['x^2+y^2=L^2','A=\\frac12xy'],
  lamppost_shadow_length:['\\text{Corresponding sides of similar triangles are proportional.}'],
  lamppost_shadow_tip:['\\text{Corresponding sides of similar triangles are proportional.}'],
  multi_part_shadow:['\\text{Corresponding sides of similar triangles are proportional.}'],
  conical_pile:['V=\\frac13\\pi r^2h'],
  inverted_conical_tank:['V=\\frac13\\pi r^2h'],
  conical_tank_height_from_volume:['V=\\frac13\\pi r^2h'],
  conical_tank_radius_from_volume:['V=\\frac13\\pi r^2h'],
  conical_tank_volume_from_height:['V=\\frac13\\pi r^2h'],
  multi_part_conical_tank:['V=\\frac13\\pi r^2h'],
  triangular_trough:['A_{\\text{triangle}}=\\frac12bh','V=A_{\\text{cross section}}L'],
  trapezoidal_trough:['A_{\\text{trapezoid}}=\\frac12(b_1+b_2)h','V=A_{\\text{cross section}}L'],
  cylindrical_tank:['V=\\pi r^2h'],
  cylindrical_tank_gallon_conversion:['V=\\pi r^2h'],
  equilateral_area:['A=\\frac{\\sqrt3}{4}s^2'],
  square_area:['A=s^2'],
  rectangle_area:['A=\\ell w'],
  right_triangle_area:['A=\\frac12bh'],
  isosceles_triangle_area:['A=\\frac12bh'],
  circle_area:['A=\\pi r^2'],
  semicircle_area:['A=\\frac12\\pi r^2'],
  semicircle_moving_point_area:['x^2+y^2=r^2','A=\\frac12xy'],
  balloon_bicycle_distance:['d^2=x^2+y^2'],
  softball_diamond:['d^2=x^2+y^2'],
  rope_spool_balloon:['s^2=x^2+y^2'],
  rotating_spotlight:['\\tan\\theta=\\frac{\\text{opposite}}{\\text{adjacent}}'],
  angle_of_elevation:['\\tan\\theta=\\frac{\\text{opposite}}{\\text{adjacent}}'],
  delayed_start_perpendicular_motion:['d^2=x^2+y^2'],
  hemispherical_ice_layer:['V_{\\text{hemisphere}}=\\frac23\\pi r^3']
};
var relatedRateLabels={
  sphere_volume_to_radius:'Rate of change of the radius:',sphere_diameter_to_volume:'Rate of change of the volume:',sphere_surface_area_to_volume:'Rate of change of the volume:',
  circular_area_from_radius:'Rate of change of the area:',circular_radius_from_area:'Rate of change of the radius:',circular_wave_circumference:'Rate of change of the circumference:',
  ladder_top:'Rate of change of the ladder top’s height:',ladder_bottom:'Rate of change of the ladder foot’s distance from the wall:',ladder_area:'Rate of change of the triangular area:',ladder_angle:'Rate of change of the angle with the ground:',ladder_wallAngle:'Rate of change of the angle with the wall:',
  lamppost_shadow_length:'Rate of change of the shadow length:',lamppost_shadow_tip:'Rate of change of the distance from the lamppost to the shadow tip:',
  conical_pile:'Rate of change of the pile’s volume:',inverted_conical_tank:'Rate of change of the water height:',conical_tank_height_from_volume:'Rate of change of the water height:',conical_tank_radius_from_volume:'Rate of change of the water-surface radius:',conical_tank_volume_from_height:'Rate of change of the water volume:',
  triangular_trough:'Rate of change of the water height:',trapezoidal_trough:'Rate of change of the water volume:',cylindrical_tank:'Rate of change of the water height:',cylindrical_tank_gallon_conversion:'Rate of change of the water height:',
  equilateral_area:'Rate of change of the area:',square_area:'Rate of change of the area:',rectangle_area:'Rate of change of the area:',right_triangle_area:'Rate of change of the area:',isosceles_triangle_area:'Rate of change of the area:',circle_area:'Rate of change of the area:',semicircle_area:'Rate of change of the area:',
  balloon_bicycle_distance:'Rate of change of the distance:',softball_diamond:'Rate of change of the distance from home:',rope_spool_balloon:'Rate of change of the rope length:',rotating_spotlight:'Speed of the light spot:',angle_of_elevation:'Rate of change of the angle of elevation:',implicit_equation_rates:'Rate of change of y:',delayed_start_perpendicular_motion:'Rate of change of the separation:',semicircle_moving_point_area:'Rate of change of the triangle’s area:',hemispherical_ice_layer:'Rate of change of the ice volume:'
};
function wordedRatePrompt(value){
  var replacements=[
    ['Find \\(\\frac{dr}{dt}\\)','Find the rate of change of the radius'],
    ['Find \\(\\frac{dV}{dt}\\)','Find the rate of change of the volume'],
    ['Find \\(\\frac{dA}{dt}\\)','Find the rate of change of the area'],
    ['Find \\(\\frac{dh}{dt}\\)','Find the rate of change of the height'],
    ['Find \\(\\frac{dy}{dt}\\)','Find the rate of change of y'],
    ['Find \\(\\frac{dx}{dt}\\)','Find the rate of change of x'],
    ['Find \\(\\frac{dC}{dt}\\)','Find the rate of change of the circumference'],
    ['find \\(\\frac{dr}{dt}\\)','find the rate of change of the radius'],
    ['find \\(\\frac{dV}{dt}\\)','find the rate of change of the volume'],
    ['find \\(\\frac{dA}{dt}\\)','find the rate of change of the area'],
    ['find \\(\\frac{dh}{dt}\\)','find the rate of change of the height'],
    ['find \\(\\frac{dy}{dt}\\)','find the rate of change of y'],
    ['find \\(\\frac{dx}{dt}\\)','find the rate of change of x']
  ];
  var output=String(value||'');replacements.forEach(function(pair){output=output.split(pair[0]).join(pair[1]);});return output;
}
function finish(problem,slug,mode,source,family,spec){
  problem.topicSlug=slug;
  problem.calculatorActive=mode==='calculator';
  problem.sourceKind=source;
  problem.sourceWeight=source==='test'?15:85;
  problem.formulaGroup=source==='extension'?'extension':'course';
  problem.familyId=family;
  problem.unit3V11=true;
  problem.unit3V128=true;
  problem.keypadMode=mode==='calculator'?'unit3-rounded':'unit3-geometry-exact';
  problem.data={unit:'ap_calc_unit_3',mode:mode,sourceKind:source,family:family};
  var formula=geometryFormulaHints[family];
  if(formula){problem.hint=formulaHint(formula);problem.hintButtonLabel='Geometric Formula Hint';}
  var diagram=diagramFor(family,spec||{});
  if(diagram){problem.diagramHint=diagram;problem.diagramHintButtonLabel='Diagram Hint';}
  if(slug==='related-rates'){
    problem.questionHtml=wordedRatePrompt(problem.questionHtml);
    if(!problem.answerLabelText&&relatedRateLabels[family])problem.answerLabelText=relatedRateLabels[family];
  }
  return cleanGeneratedProblem(problem,mode);
}
function scalarProblem(spec){
  var problem=spec.mode==='calculator'?numericProblem(spec):exactProblem(spec);
  return finish(problem,spec.slug,spec.mode,spec.source,spec.family,spec);
}
function multiFieldProblem(spec){
  return finish(fieldsProblem(spec),spec.slug,spec.mode,spec.source,spec.family,spec);
}
function bisectRoot(fn,left,right){
  var a=left,b=right,fa=fn(a),fb=fn(b);if(!Number.isFinite(fa)||!Number.isFinite(fb)||fa*fb>0)return NaN;
  for(var index=0;index<100;index+=1){var midpoint=(a+b)/2,fm=fn(midpoint);if(!Number.isFinite(fm))return NaN;if(fa*fm<=0){b=midpoint;fb=fm;}else{a=midpoint;fa=fm;}}
  return(a+b)/2;
}
function scanRoots(fn,left,right,segments){
  var roots=[],count=segments||500,lastX=left,lastY=fn(left);
  for(var index=1;index<=count;index+=1){var x=left+(right-left)*index/count,y=fn(x);if(Number.isFinite(lastY)&&Number.isFinite(y)&&lastY*y<0){var root=bisectRoot(fn,lastX,x);if(Number.isFinite(root)&&!roots.some(function(value){return Math.abs(value-root)<1e-4;}))roots.push(root);}lastX=x;lastY=y;}
  return roots;
}
function distanceFromSimpleRational(value){var best=Infinity;for(var denominator=1;denominator<=10;denominator+=1)best=Math.min(best,Math.abs(value-Math.round(value*denominator)/denominator));return best;}

function cleanGeneratedProblem(problem,mode){
  function clean(value){
    if(typeof value!=='string')return value;
    var output=value
      .replace(/\^\{1\}/g,'')
      .replace(/\^1(?!\d)/g,'')
      .replace(/\b1([a-zA-Z])\b/g,'$1')
      .replace(/\\frac\{(-[^{}]+)\}\{([^{}]+)\}/g,function(match,numerator,denominator){return '-\\frac{'+numerator.slice(1)+'}{'+denominator+'}';})
      .replace(/\\frac\{([^{}]+)\}\{1\}/g,'$1')
      .replace(/\\frac([0-9]+)\{1\}/g,'$1')
      .replace(/\(([^()]+)\)\^1\b/g,'($1)')
      .replace(/\b1 feet\b/g,'1 foot')
      .replace(/\b1 inches\b/g,'1 inch')
      .replace(/\b1 radians\b/g,'1 radian')
      .replace(/shorter\/left pole/gi,'left pole')
      .replace(/\s{2,}/g,' ');
    output=output.replace(/\\\((-?1(?:\.0+)?)\\\) feet\b/g,'\\($1\\) foot');
    /* Raw comparison symbols inside inline MathJax otherwise look like HTML. */
    output=output.replace(/\\\(([^)]*)\\\)/g,function(match,inside){
      return '\\('+inside.replace(/</g,'\\lt ').replace(/>/g,'\\gt ')+'\\)';
    });
    return output;
  }
  ['questionHtml','explanation','answerTex'].forEach(function(key){if(problem[key])problem[key]=clean(problem[key]);});
  if(Array.isArray(problem.fields))problem.fields.forEach(function(field){if(field.answerTex)field.answerTex=clean(field.answerTex);});
  if(mode==='noncalculator'){
    if(problem.answerType==='exact-expression'&&problem.requireExact==null)problem.requireExact=needsSymbolicExact(problem.expressionAnswer);
    /* Replace a decimal copy of a requested exact answer with its exact TeX.
       Other optional paragraphs that contain only an unneeded approximation
       are omitted rather than presenting a decimal as exact work. */
    if(problem.explanation){
      var exactValues=[];
      function addExact(expression,tex){try{var parser=window.BatchMathDerivativeExpressions,value=parser.evaluate(parser.parse(String(expression)),{});if(Number.isFinite(value))exactValues.push({value:value,tex:String(tex)});}catch(ignore){}}
      if(problem.answerType==='exact-expression')addExact(problem.expressionAnswer,problem.answerTex);
      if(Array.isArray(problem.fields))problem.fields.forEach(function(field){if(field.answer!=null)addExact(field.answer,field.answerTex==null?field.answer:field.answerTex);});
      problem.explanation=problem.explanation.replace(/<p><strong>Step \d+:<\/strong>[^<]*<\/p>/gi,function(paragraph){
        if(!/(?:\\approx|approximately|\d+\.\d{4,})/i.test(paragraph))return paragraph;
        var replaced=paragraph.replace(/-?\d+\.\d{4,}/g,function(token){var number=Number(token),match=exactValues.find(function(item){return Math.abs(item.value-number)<=1e-5*Math.max(1,Math.abs(item.value));});return match?match.tex:token;}).replace(/\\approx/g,'=').replace(/approximately\s*/gi,'');
        return /\d+\.\d{4,}/.test(replaced)?'':replaced;
      });
      var index=0;problem.explanation=problem.explanation.replace(/<strong>Step \d+:<\/strong>/g,function(){index+=1;return '<strong>Step '+index+':</strong>';});
    }
  }
  return problem;
}
var recentConcepts={},recentTemplates={};
var lastGeneratedFamily={};
function remember(store,key,value,limit){var history=store[key]||(store[key]=[]);history.push(value);while(history.length>limit)history.shift();}
function diverseVariant(key,values,limit){var history=recentTemplates[key]||(recentTemplates[key]=[]),available=values.filter(function(value){return history.indexOf(value)<0;});if(!available.length)available=values.filter(function(value){return value!==history[history.length-1];});if(!available.length)available=values.slice();var selected=pick(available);remember(recentTemplates,key,selected,limit||Math.max(1,values.length-1));return selected;}
function diverse(key,descriptors){
  var conceptHistory=recentConcepts[key]||(recentConcepts[key]=[]);
  var groups={};descriptors.forEach(function(item){var group=item.group||item.history||item.family;(groups[group]||(groups[group]=[])).push(item);});
  var groupNames=Object.keys(groups),availableGroups=groupNames.filter(function(group){return conceptHistory.indexOf(group)<0;});
  if(!availableGroups.length){var lastGroup=conceptHistory[conceptHistory.length-1];availableGroups=groupNames.filter(function(group){return group!==lastGroup;});if(!availableGroups.length)availableGroups=groupNames.slice();}
  var group=pick(availableGroups),templateHistory=recentTemplates[key+':'+group]||(recentTemplates[key+':'+group]=[]);
  var templates=groups[group],available=templates.filter(function(item){return templateHistory.indexOf(item.template||item.family)<0;});
  if(!available.length)available=templates.slice();
  var selected=pick(available);
  remember(recentConcepts,key,group,7);remember(recentTemplates,key+':'+group,selected.template||selected.family,5);
  return selected;
}
function descriptor(family,source,build,history,options){
  var item={family:family,source:source,build:build,history:history||family,group:history||family,template:family};
  if(options)Object.keys(options).forEach(function(key){item[key]=options[key];});
  return item;
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
  return 'Graph the derivative on the allowed interval and use the calculator’s zero feature. This gives \\('+(symbol||'x')+'\\approx'+Number(value).toFixed(6)+'\\). Keep the full calculator value for the remaining calculations.';
}

/* ------------------------------ Optimization ----------------------------- */

function optSquareCorner(mode,source){
  var L=mode==='calculator'?pick([17.3,22.6,31.4,43.7]):6*integer(2,9);
  var x=L/6,V=x*Math.pow(L-2*x,2),answer=calcOrExact(mode,x,trim(x),trim(x));
  var Ls=trim(L,1),xs=trim(x,6);
  return scalarProblem({
    slug:'optimization',mode:mode,source:source,family:'open_top_square_cardboard',id:'u3-v127-opt-square-'+mode+'-'+Ls,
    variant:'optimization_open_top_square_cardboard',
    diagram:{kind:'sheet-net',title:'Square sheet with corner cuts',description:'A square sheet labeled with its generated side length and variable corner cuts x.',length:L,width:L,unit:'in',cutLabel:'x'},
    prompt:'Squares of side \\(x\\) are cut from the corners of a square piece of cardboard with side length \\('+Ls+'\\) inches. Find the cut size that produces the maximum-volume open box.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x\\) be the cut size in inches. The box has height \\(x\\) and square base side \\('+Ls+'-2x\\).',
      'The quantity to maximize is volume: \\(V=x('+Ls+'-2x)^2\\). The allowed values are \\(0<x<'+trim(L/2,3)+'\\).',
      'Differentiate: \\(V^{\\prime}(x)=('+Ls+'-2x)('+Ls+'-6x)\\).',
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
    diagram:{kind:'sheet-net',title:'Rectangular sheet with corner cuts',description:'A rectangular sheet labeled with the generated length and width and variable corner cuts x.',length:length,width:width,unit:'in',cutLabel:'x'},
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
    diagram:{kind:'box',title:'Open box with square base',description:'An open box with variable square base side x and variable height h.',baseX:'x',baseY:'x',heightLabel:'h',fixedNotes:['Available material: '+S+' square inches']},
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
    diagram:{kind:'cylinder',title:(openTop?'Open':'Closed')+' cylindrical container',description:'A cylindrical container with variable radius r and variable height h.',radiusLabel:'r',heightLabel:'h',openTop:openTop,fixedNotes:['Required volume: '+Ctext+'π cubic units']},
    prompt:'A '+(openTop?'cylindrical container with no top':'closed cylindrical container')+' must hold \\('+Ctext+'\\pi\\) cubic units. Find the radius that uses the least material.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(r>0\\) be the radius and \\(h>0\\) the height. The quantity to minimize is surface area: \\(S='+surface+'\\).',
      'The fixed-volume constraint is \\(\\pi r^2h='+Ctext+'\\pi\\), so \\(h=\\frac{'+Ctext+'}{r^2}\\).',
      'Substituting this into the original surface-area equation gives \\(S(r)='+reduced+'\\), with \\(r>0\\).',
      'Differentiate: \\(S^{\\prime}(r)='+derivative+'\\).',
      (mode==='calculator'?calculatorCritical(r,'r'):'Solving \\(S^{\\prime}(r)=0\\) gives \\(r='+rs+'\\).'),
      'The derivative changes from negative to positive at this radius, so the surface area has an absolute minimum.',
      'The corresponding height is \\(h='+hs+'\\) units.'+(mode==='calculator'?' The radius rounds to \\('+r.toFixed(3)+'\\) units.':'')
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
    diagram:{kind:'cylinder',title:'Cylinder with two material costs',description:'A closed cylinder with variable radius r and height h and the generated material costs.',radiusLabel:'r',heightLabel:'h',surfaceLabels:{top:'bases: '+cb+'¢/in²',side:'side: '+cs+'¢/in²'},fixedNotes:['Required volume: '+Ct+'π cubic inches']},
    prompt:'A closed cylinder has volume \\('+Ct+'\\pi\\) cubic inches. The two circular bases cost '+cb+' cents per square inch and the lateral material costs '+cs+' cents per square inch. Find the radius that minimizes cost.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(r\\) be the radius and \\(h\\) the height. The cost is \\(C='+cb+'(2\\pi r^2)+'+cs+'(2\\pi rh)\\).',
      'The volume constraint \\(\\pi r^2h='+Ct+'\\pi\\) gives \\(h=\\frac{'+Ct+'}{r^2}\\).',
      'Substituting for \\(h\\) in the cost equation gives \\(C(r)='+trim(2*baseCost,2)+'\\pi r^2+\\frac{'+trim(2*sideCost*C,3)+'\\pi}{r}\\), with \\(r>0\\).',
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
    diagram:{kind:'fence',title:barn?'Enclosure beside a barn':'Four-sided rectangular field',description:'A rectangular enclosure with variable depth x and other dimension y.',barn:barn,xLabel:'x',yLabel:'y',fixedNotes:['Available fencing: '+F+' ft']},
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
      ?'A hotel charges '+money(p)+' per room for an organization reserving '+b+' rooms. For each room above '+b+', the price of every room decreases by '+money(d)+'.'
      :'A wholesaler charges '+money(p)+' per pair for an order of '+b+' pairs. For each additional pair ordered, the price of every pair decreases by '+money(d)+'.')+' How many '+subject+' maximize revenue?',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(q\\) be the total number of '+subject+'. The per-'+(context==='hotel'?'room':'pair')+' price is \\(p(q)='+p+'-'+(Number(d)===1?'':d)+'(q-'+b+')\\).',
      'The quantity to maximize is revenue: \\(R(q)=q['+p+'-'+(Number(d)===1?'':d)+'(q-'+b+')]\\).',
      'After expanding, \\(R(q)=-'+d+'q^2+'+trim(initial+decrease*base,3)+'q\\).',
      'Differentiate: \\(R^{\\prime}(q)=-'+trim(2*decrease,3)+'q+'+trim(initial+decrease*base,3)+'\\).',
      'Solving \\(R^{\\prime}(q)=0\\) gives \\(q='+q+'\\).',
      'Because \\(R^{\\prime\\prime}(q)=-'+trim(2*decrease,3)+'<0\\), this critical point gives maximum revenue.',
      'At this order size the revenue is '+money(maximum)+'.',
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
    diagram:{kind:'window',title:'Rectangle with equilateral-triangle top',description:'A window with variable rectangle width w and height h.',widthLabel:'w',heightLabel:'h',fixedNotes:['Outside perimeter: '+trim(perimeter,1)+' ft']},
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
    diagram:{kind:'inscribed-semicircle',title:'Rectangle inscribed in a semicircle',description:'A symmetric rectangle in a semicircle with fixed generated radius, half-width x, full width 2x, and height y.',semicircle:true,radius:radius,unit:'',halfWidthLabel:'x',fullWidthLabel:'2x',heightLabel:'y'},
    prompt:'A rectangle is inscribed in a semicircle of radius \\('+trim(radius,1)+'\\), with its base on the diameter. Find the rectangle’s full width when its area is largest.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x\\) be half the rectangle’s width and \\(y\\) its height. The full width is \\(2x\\), so the quantity to maximize is \\(A=2xy\\).',
      'The semicircle constraint is \\(x^2+y^2='+trim(radius*radius,2)+'\\), so \\(y=\\sqrt{'+trim(radius*radius,2)+'-x^2}\\).',
      'Thus \\(A(x)=2x\\sqrt{'+trim(radius*radius,2)+'-x^2}\\), with \\(0\\le x\\le'+trim(radius,1)+'\\).',
      'Differentiate: \\(A^{\\prime}(x)=\\frac{2('+trim(radius*radius,2)+'-2x^2)}{\\sqrt{'+trim(radius*radius,2)+'-x^2}}\\).',
      (mode==='calculator'?calculatorCritical(half):'The interior critical value is \\(x=\\frac{'+trim(radius)+'}{\\sqrt2}\\).'),
      'The derivative changes from positive to negative at this critical value. At the endpoints, no rectangle with positive area is formed, so this critical value gives the absolute maximum.',
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
    diagram:{kind:'page',title:'Page and printed region',description:'A page with variable width w and height h and the generated total horizontal and vertical margins.',widthLabel:'w',heightLabel:'h',horizontalMargins:horizontal,verticalMargins:vertical,unit:'in',fixedNotes:['Total page area: '+trim(area,1)+' square inches']},
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
    diagram:{kind:'closest-curve',title:'Distance from a point to the curve',description:'The actual square-root curve, the generated fixed point, a variable point on the curve, and their distance.',domain:[0,Math.max(10,point+2)],fn:function(value){return Math.sqrt(Math.max(0,value));},curveLabel:'y = √x',fixedPoint:[point,0],fixedPointLabel:'('+trim(point,2)+', 0)',variablePointLabel:'P=(x, √x)',includePoints:[[point,0]]},
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
    diagram:{kind:'poles',title:'Two poles and a shared ground stake',description:'Two poles with the generated fixed heights and separation, a variable stake position, and two cable segments.',leftHeight:left,rightHeight:right,distance:distance,unit:'ft',leftDistanceLabel:'x',rightDistanceLabel:trim(distance,1)+'-x'},
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
    diagram:{kind:'ladder-fence',title:'Ladder reaching over a fence',description:'A building, a fence with the generated fixed height and gap, and a variable foot-to-fence distance x.',fenceHeight:height,gap:gap,unit:'ft',variableLabel:'x'},
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
    diagram:{kind:'cone',title:'Cone formed from a right triangle',description:'A cone with variable radius r and height h and the generated fixed hypotenuse as its slant length.',radiusLabel:'r',heightLabel:'h',slantLabel:(mode==='calculator'?trim(hypotenuse,3):(scale===1?'√3':scale+'√3'))},
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
    diagram:{kind:'moving-paths',title:'Perpendicular ship paths',description:'Perpendicular ship paths with the generated initial separation and speeds; the changing separations are labeled with variables.',xLabel:'x(t)',yLabel:'y(t)',distanceLabel:'d(t)',initialSeparation:separation,unit:'mi',horizontalSpeed:west,verticalSpeed:north,speedUnit:'mph',fixedNotes:['Ship A: north at '+trim(north,1)+' mph','Ship B: west at '+trim(west,1)+' mph']},
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
  if(mode==='calculator')return optTrigArch(mode,source);
  var kind=diverseVariant('optimization:noncalculator:symmetric-rectangle',['quadratic','quartic','mixed','semicircle'],3);
  if(kind==='semicircle'){
    var radius=integer(2,9),half=radius/Math.sqrt(2),width=radius*Math.sqrt(2),height=half;
    return scalarProblem({slug:'optimization',mode:mode,source:source,family:'rectangle_under_semicircle_arch',id:'u3-v128a-opt-semicircle-rectangle-'+radius,variant:'optimization_symmetric_rectangle_semicircle',diagram:{kind:'curve-rectangle',title:'Rectangle under the generated semicircle',description:'A variable rectangle symmetric about the y-axis with upper corners on the generated semicircle.',fn:function(value){return Math.sqrt(Math.max(0,radius*radius-value*value));},domain:[-radius,radius],previewX:radius*.45,curveLabel:'y = √('+(radius*radius)+' − x²)'},prompt:'A rectangle is symmetric about the \\(y\\)-axis, has its base on the \\(x\\)-axis, and its upper corners lie on the semicircle \\(y=\\sqrt{'+radius*radius+'-x^2}\\). Find the full width that maximizes area.',answer:radius+'*sqrt(2)',answerTex:radius+'\\sqrt2',steps:[
      'Let \\(x>0\\) be the upper-right corner’s \\(x\\)-coordinate. Because the rectangle is symmetric about the \\(y\\)-axis, its full width is \\(2x\\). The height is \\(\\sqrt{'+radius*radius+'-x^2}\\).',
      'The area is \\(A(x)=2x\\sqrt{'+radius*radius+'-x^2}\\), with \\(0<x<'+radius+'\\).',
      'Differentiate: \\(A^{\\prime}(x)=\\frac{2('+radius*radius+'-2x^2)}{\\sqrt{'+radius*radius+'-x^2}}\\).',
      'Setting the numerator equal to zero gives \\(x=\\frac{'+radius+'}{\\sqrt2}\\).',
      'The derivative changes from positive to negative there, so the area is largest at this value.',
      'At either end of the allowed interval, no rectangle with positive area is formed.',
      'The full width is \\(2x='+radius+'\\sqrt2\\), and the height is \\('+radius+'\\sqrt2/2\\).'
    ]});
  }
  var a=integer(1,kind==='mixed'?3:4),quadratic=kind==='mixed'?pick([1,2]):kind==='quadratic'?pick([1,2,3]):0,quartic=kind==='quartic'?pick([1,2]):kind==='mixed'?pick([1,2]):0;
  var curveHeight=kind==='quadratic'?3*quadratic*a*a:kind==='quartic'?5*quartic*Math.pow(a,4):3*quadratic*a*a+5*quartic*Math.pow(a,4);
  var equation=trim(curveHeight)+(quadratic?' - '+(quadratic===1?'':quadratic)+'x^2':'')+(quartic?' - '+(quartic===1?'':quartic)+'x^4':'');
  var area='2x('+equation+')',derivative=trim(2*curveHeight)+(quadratic?' - '+trim(6*quadratic)+'x^2':'')+(quartic?' - '+trim(10*quartic)+'x^4':''),second=kind==='quadratic'?'-'+trim(12*quadratic)+'x':kind==='quartic'?'-'+trim(40*quartic)+'x^3':'-'+trim(12*quadratic)+'x-'+trim(40*quartic)+'x^3';
  var rectHeight=curveHeight-quadratic*a*a-quartic*Math.pow(a,4),family=kind==='quadratic'?'rectangle_under_parabola':kind==='quartic'?'rectangle_under_quartic_arch':'rectangle_under_even_polynomial';
  var curveFn=function(value){return curveHeight-quadratic*value*value-quartic*Math.pow(value,4);};
  var archLimit=kind==='quadratic'?Math.sqrt(curveHeight/quadratic):kind==='quartic'?Math.pow(curveHeight/quartic,.25):bisectRoot(curveFn,a,Math.max(10,4*a));
  return scalarProblem({slug:'optimization',mode:mode,source:source,family:family,id:'u3-v128a-opt-even-rectangle-'+kind+'-'+a+'-'+quadratic+'-'+quartic,variant:'optimization_symmetric_rectangle_'+kind,diagram:{kind:'curve-rectangle',title:'Rectangle under the generated curve',description:'A variable rectangle symmetric about the y-axis with upper corners on the actual generated curve.',fn:curveFn,domain:[-archLimit,archLimit],previewX:archLimit*.45,curveLabel:'y = '+equation.replace(/x\^2/g,'x²').replace(/x\^4/g,'x⁴').replace(/ - /g,' − ')},prompt:'A rectangle is symmetric about the \\(y\\)-axis, has its base on the \\(x\\)-axis, and its upper corners lie on \\(y='+equation+'\\). Find the full width that maximizes area.',answer:String(2*a),answerTex:String(2*a),steps:[
    'Let \\(x>0\\) be the upper-right corner’s \\(x\\)-coordinate. Because the rectangle is symmetric about the \\(y\\)-axis, its full width is \\(2x\\). The curve gives the height \\('+equation+'\\).',
    'The area is \\(A(x)='+area+'\\), using only values of \\(x\\) for which the height is positive.',
    'Differentiate: \\(A^{\\prime}(x)='+derivative+'\\).',
    (kind==='mixed'?'Let \\(u=x^2\\). Factoring the resulting quadratic in \\(u\\) gives the positive critical value \\(x='+a+'\\).':'Solving \\(A^{\\prime}(x)=0\\) gives the positive critical value \\(x='+a+'\\).'),
    'Since \\(A^{\\prime\\prime}(x)='+second+'<0\\) for \\(x>0\\), this critical value gives the maximum area.',
    'At the endpoints, no rectangle with positive area is actually formed, so an endpoint cannot give the desired maximum.',
    'The full width is \\(2x='+(2*a)+'\\), and the matching height is \\('+rectHeight+'\\).'
  ]});
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
    diagram:{kind:'pig-pen',title:'Four-piece pen beside a barn',description:'A barn-side pen made from four rigid pieces with the generated fixed length and variable opening b.',side:side,unit:'m',baseLabel:'b'},
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
      'Let \\(x\\) and \\(y\\) be the two positive numbers. The quantity to maximize is \\(P=xy\\).',
      'The constraint is \\('+ax+'x+'+by+'y='+total+'\\), so \\(y=\\frac{'+total+'-'+ax+'x}{'+by+'}\\).',
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
    diagram:{kind:'wire-split',title:'One wire split between a circle and a square',description:'A wire with the generated fixed total length split into variable pieces x and L minus x.',firstLabel:'x',secondLabel:trim(length,1)+'-x',fixedNotes:['Total wire length: '+trim(length,1)+' cm']},
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
    diagram:{kind:'axis-triangle',title:'Line through a fixed point',description:'A line through the generated fixed point with variable positive x- and y-intercepts.',point:[a,b],xInterceptLabel:'X',yInterceptLabel:'Y'},
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
    diagram:{kind:'inscribed-circle',title:'Rectangle inscribed in a circle',description:'A variable rectangle inscribed in a circle with the generated fixed radius.',semicircle:false,radius:radius,unit:'',halfWidthLabel:'x/2',fullWidthLabel:'x',heightLabel:'y'},
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
    diagram:{kind:'fence',title:'Rectangle with two fencing costs',description:'A rectangle with variable side lengths x and y and the generated cost on each pair of sides.',barn:false,xLabel:'x',yLabel:'y',costX:'$'+trim(costX,2)+'/ft',costY:'$'+trim(costY,2)+'/ft',fixedNotes:['Budget: $'+trim(budget,2)]},
    prompt:'A rectangular field has one pair of sides costing '+money(costX)+' per foot and the other pair costing '+money(costY)+' per foot. With a '+money(budget)+' budget, find the length of a side in the first pair that maximizes area.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x>0\\) be a side in the first pair and \\(y>0\\) a side in the second pair. The quantity to maximize is area: \\(A=xy\\).',
      'The budget constraint is \\('+trim(2*costX,2)+'x+'+trim(2*costY,2)+'y='+trim(budget,1)+'\\). These positive lengths are limited by the budget.',
      'Solve for \\(y\\): \\(y=\\frac{'+trim(budget,1)+'-'+trim(2*costX,2)+'x}{'+trim(2*costY,2)+'}\\).',
      'Substitute to obtain a downward-opening quadratic area function.',
      'Differentiating and setting the result to zero gives \\(x=\\frac{'+trim(budget,1)+'}{'+trim(4*costX,2)+'}='+trim(x,6)+'\\).',
      'The second derivative is negative, so this critical value gives the maximum area.',
      'The corresponding other side is \\(y='+trim(y,6)+'\\).',
      'Therefore the requested side length is \\('+trim(x,6)+'\\) feet'+(mode==='calculator'?', or \\('+x.toFixed(3)+'\\) feet.':'.')
    ]
  });
}


function optCapsuleCost(mode,source){
  var radius=mode==='calculator'?pick([3.35,4.45,5.65]):pick([3,6,9]);
  var sideCost=mode==='calculator'?pick([2.6,3.4,4.2]):3,endCost=mode==='calculator'?pick([4.3,5.1,6.4]):4;
  var coefficient=4*endCost-8*sideCost/3;
  var volumeConstant=mode==='calculator'?pick([91.7,166.4,288.9]):8*radius*radius*radius/3;
  if(mode==='calculator')radius=Math.cbrt(sideCost*volumeConstant/coefficient);
  var cylinderLength=(volumeConstant-4*radius*radius*radius/3)/(radius*radius);
  var rText=trim(radius,6),lengthText=trim(cylinderLength,6),volumeText=trim(volumeConstant,4);
  var diagram={kind:'capsule',title:'Cylinder with two hemispherical ends',description:'A capsule-shaped container with variable radius r and cylindrical length L and the generated fixed volume and material costs.',radiusLabel:'r',lengthLabel:'L',fixedNotes:['Volume: '+volumeText+'π cubic units','Cylinder: '+trim(sideCost,2)+'¢ per square unit','Ends: '+trim(endCost,2)+'¢ per square unit']};
  var steps=[
    'Let \\(r\\) be the radius and \\(L\\) the length of the cylindrical part. The fixed-volume equation is \\(\\pi r^2L+\\frac43\\pi r^3='+volumeText+'\\pi\\).',
    'Solve the constraint for the cylinder length: \\(L=\\frac{'+volumeText+'}{r^2}-\\frac43r\\).',
    'The cylindrical material costs '+trim(sideCost,2)+' cents per square unit and the two hemispherical ends cost '+trim(endCost,2)+' cents per square unit, so \\(C=2('+trim(sideCost,2)+')\\pi rL+4('+trim(endCost,2)+')\\pi r^2\\).',
    'Substituting the expression for \\(L\\) into the cost equation gives \\(C(r)=\\frac{'+trim(2*sideCost*volumeConstant,4)+'\\pi}{r}+'+trim(coefficient,4)+'\\pi r^2\\), with \\(0<r<\\sqrt[3]{\\frac{3('+volumeText+')}{4}}\\).',
    'Differentiate: \\(C^{\\prime}(r)=-\\frac{'+trim(2*sideCost*volumeConstant,4)+'\\pi}{r^2}+'+trim(2*coefficient,4)+'\\pi r\\).',
    mode==='calculator'?calculatorCritical(radius,'r'):'Solving \\(C^{\\prime}(r)=0\\) gives \\(r='+rText+'\\).',
    'The derivative changes from negative to positive there, so this radius gives the minimum cost.',
    'Using the volume constraint gives \\(L='+lengthText+'\\).'
  ];
  if(mode==='calculator')return scalarProblem({slug:'optimization',mode:mode,source:source,family:'capsule_unequal_material_costs',id:'u3-v128-opt-capsule-calc-'+volumeText,variant:'optimization_capsule_unequal_material_costs',diagram:diagram,prompt:'A container consists of a cylinder with a hemisphere on each end. It holds \\('+volumeText+'\\pi\\) cubic units. Cylindrical material costs '+trim(sideCost,2)+' cents per square unit and the hemispherical material costs '+trim(endCost,2)+' cents per square unit. Find the radius that minimizes material cost.',value:radius,steps:steps});
  return multiFieldProblem({slug:'optimization',mode:mode,source:source,family:'capsule_unequal_material_costs',id:'u3-v128-opt-capsule-exact-'+volumeText,variant:'optimization_capsule_unequal_material_costs_dimensions',diagram:diagram,prompt:'A container consists of a cylinder with a hemisphere on each end. It holds \\('+volumeText+'\\pi\\) cubic units. Cylindrical material costs 3 cents per square unit and the hemispherical material costs 4 cents per square unit. Find the radius and the length of the cylindrical part that minimize material cost.',fields:[{label:'r=',answer:String(radius),answerTex:String(radius),placeholder:'Radius'},{label:'L=',answer:String(cylinderLength),answerTex:String(cylinderLength),placeholder:'Cylinder length'}],steps:steps});
}

function optSquarePyramid(mode,source){
  if(mode==='calculator')return optTrigArch(mode,source);
  var side=pick([3,6,9]),volumeNumerator=side*side*side,volumeTex=fractionTex(volumeNumerator,3)+'\\sqrt2',heightTex=side+'\\sqrt2',surface=4*side*side;
  return multiFieldProblem({
    slug:'optimization',mode:mode,source:source,family:'square_pyramid_fixed_volume',id:'u3-v128-opt-square-pyramid-'+side,
    variant:'optimization_square_pyramid_fixed_volume_dimensions',
    diagram:{kind:'pyramid',title:'Closed square pyramid',description:'A square pyramid with variable base side s and height h.',sideLabel:'s',heightLabel:'h',fixedNotes:['Required volume: '+trim(volumeNumerator/3)+'√2 cubic units']},
    prompt:'A closed square pyramid must have volume \\('+volumeTex+'\\) cubic units. Find the base side length and height that minimize its total surface area.',
    fields:[{label:'s=',answer:String(side),answerTex:String(side),placeholder:'Base side length'},{label:'h=',answer:side+'*sqrt(2)',answerTex:heightTex,placeholder:'Height'}],
    steps:[
      'Let \\(s\\) be the base side and \\(h\\) the height. The constraint is \\(\\frac13s^2h='+volumeTex+'\\).',
      'Write \\(k=\\frac hs\\). Then \\(s=\\left(\\frac{3V}{k}\\right)^{1/3}\\), and the total surface area is \\(S=s^2\\left(1+2\\sqrt{k^2+\\frac14}\\right)\\).',
      'After substituting for \\(s\\), differentiate the resulting expression in \\(k\\). The equation \\(S^{\\prime}(k)=0\\) simplifies to \\(k^2=2\\).',
      'The surface area decreases before \\(k=\\sqrt2\\) and increases after it, so this value gives the minimum.',
      'Thus \\(h=\\sqrt2s\\). Substituting into the volume constraint gives \\(s='+side+'\\).',
      'The height is \\(h='+heightTex+'\\), and the minimum surface area is \\('+surface+'\\) square units.'
    ]
  });
}

function optClosestPolynomial(mode,source){
  if(mode==='calculator')return optClosestPower(mode,source);
  var kind=diverseVariant('optimization:noncalculator:closest-point',['parabola','radical','power'],2);
  var request=diverseVariant('optimization:noncalculator:closest-request',['x','point','distance'],2);
  var x,curveTex,targetTex,yTex,distanceInput,distanceTex,derivativeTex,criticalText,family,curveFn,curveDomain,fixedPoint,fixedPointLabel,curveLabel;
  if(kind==='parabola'){
    x=integer(2,5);var vertical=x*x+1/2,verticalTex=fractionTex(2*x*x+1,2);
    curveTex='x^2';targetTex='(0,'+verticalTex+')';yTex=String(x*x);distanceInput='sqrt('+(4*x*x+1)+')/2';distanceTex='\\frac{\\sqrt{'+(4*x*x+1)+'}}2';
    derivativeTex='2x\\left[1+2\\left(x^2-'+verticalTex+'\\right)\\right]';criticalText='The nonzero critical values satisfy \\(x^2='+x*x+'\\), so the positive one is \\(x='+x+'\\).';family='closest_point_polynomial';
    curveFn=function(value){return value*value;};curveDomain=[0,x+2];fixedPoint=[0,vertical];fixedPointLabel='(0, '+trim(vertical,2)+')';curveLabel='y = x²';
  }else if(kind==='radical'){
    var q=pick([2,3,4]);x=q*q;var targetX=x-1,targetY=3*q;
    curveTex='\\sqrt{x}';targetTex='('+targetX+','+targetY+')';yTex=String(q);distanceInput='sqrt('+(1+4*q*q)+')';distanceTex='\\sqrt{'+(1+4*q*q)+'}';
    derivativeTex='2(x-'+targetX+')+1-\\frac{'+targetY+'}{\\sqrt{x}}';criticalText='The derivative is zero at \\(x='+x+'\\), and it changes from negative to positive there.';family='closest_point_radical_curve';
    curveFn=function(value){return Math.sqrt(Math.max(0,value));};curveDomain=[0,x+4];fixedPoint=[targetX,targetY];fixedPointLabel='('+targetX+', '+targetY+')';curveLabel='y = √x';
  }else{
    var root=pick([2,3]);x=root*root;var targetPowerX=x-1,targetPowerY=fractionTex(3*Math.pow(root,4)+2,3*root);
    curveTex='x^{3/2}';targetTex='('+targetPowerX+','+targetPowerY+')';yTex=String(root*root*root);distanceInput='sqrt('+(9*root*root+4)+')/('+3*root+')';distanceTex='\\frac{\\sqrt{'+(9*root*root+4)+'}}{'+(3*root)+'}';
    derivativeTex='2(x-'+targetPowerX+')+3\\sqrt{x}\\left(x^{3/2}-'+targetPowerY+'\\right)';criticalText='The derivative is zero at \\(x='+x+'\\), and it changes from negative to positive there.';family='closest_point_power_curve';
    var targetPowerExact=rational(3*Math.pow(root,4)+2,3*root),targetPowerValue=targetPowerExact.value;curveFn=function(value){return Math.pow(Math.max(0,value),1.5);};curveDomain=[0,x+3];fixedPoint=[targetPowerX,targetPowerValue];fixedPointLabel='('+targetPowerX+', '+targetPowerExact.input.replace(/[()]/g,'')+')';curveLabel='y = x³ᐟ²';
  }
  var diagram={kind:'closest-curve',title:'Closest point on the generated curve',description:'The actual generated curve, fixed point, variable point on the curve, and distance segment.',fn:curveFn,domain:curveDomain,includePoints:[fixedPoint],previewX:x*.78,fixedPoint:fixedPoint,fixedPointLabel:fixedPointLabel,variablePointLabel:'P = (x, f(x))',curveLabel:curveLabel};
  var prompt=request==='x'?'Find the positive \\(x\\)-coordinate of the point on \\(y='+curveTex+'\\) closest to \\('+targetTex+'\\).'
    :request==='point'?'Find the point on \\(y='+curveTex+'\\), for \\(x>0\\), that is closest to \\('+targetTex+'\\).'
    :'Find the minimum distance from \\(y='+curveTex+'\\), for \\(x>0\\), to \\('+targetTex+'\\).';
  var steps=[
    'Use a point \\((x,'+curveTex+')\\) on the curve, where \\(x>0\\).',
    'Minimize the squared distance \\(D(x)=(x-a)^2+(y-b)^2\\), where \\((a,b)='+targetTex+'\\).',
    'Substitute the curve and target point, then differentiate: \\(D^{\\prime}(x)='+derivativeTex+'\\).',
    criticalText,
    'Because the derivative changes from negative to positive, the closest point is \\('+x+','+yTex+'\\).'
  ];
  if(request==='distance')steps.push('The distance formula gives a minimum distance of \\('+distanceTex+'\\).');
  if(request==='point')return multiFieldProblem({slug:'optimization',mode:mode,source:source,family:family,id:'u3-v128a-opt-closest-'+kind+'-point-'+x,variant:'optimization_closest_point_'+kind,diagram:diagram,prompt:prompt,fields:[{label:'x=',answer:String(x),answerTex:String(x),placeholder:'x-coordinate'},{label:'y=',answer:yTex,answerTex:yTex,placeholder:'y-coordinate'}],steps:steps});
  return scalarProblem({slug:'optimization',mode:mode,source:source,family:family,id:'u3-v128a-opt-closest-'+kind+'-'+request+'-'+x,variant:'optimization_closest_point_'+kind,diagram:diagram,prompt:prompt,answer:request==='x'?String(x):distanceInput,answerTex:request==='x'?String(x):distanceTex,steps:steps});
}

function optClosestPowerLegacy(mode,source){
  var pointX=pick([3.2,4.1,5.3]),pointY=pick([-1.2,0,0.8]);
  var derivative=function(x){var y=Math.pow(x,1.5)-4-pointY;return 2*(x-pointX)+3*Math.sqrt(x)*y;};
  var left=.05,right=1,root=NaN,lastX=left,lastY=derivative(left);
  for(var scan=1;scan<=240;scan+=1){var currentX=.05+scan*(8.95/240),currentY=derivative(currentX);if(lastY*currentY<=0){root=bisectRoot(derivative,lastX,currentX);break;}lastX=currentX;lastY=currentY;}
  if(!Number.isFinite(root))root=bisectRoot(derivative,.05,9);
  var distance=Math.sqrt(Math.pow(root-pointX,2)+Math.pow(Math.pow(root,1.5)-4-pointY,2));
  return scalarProblem({
    slug:'optimization',mode:'calculator',source:source,family:'closest_point_power_curve',id:'u3-v128-opt-closest-power-'+trim(pointX,1)+'-'+trim(pointY,1),variant:'optimization_closest_point_x_three_halves',
    diagram:{kind:'closest-curve',title:'Closest point on a power curve',description:'The actual power curve, generated fixed point, variable point on the curve, and distance segment.',fn:function(value){return Math.pow(Math.max(0,value),1.5)-4;},domain:[0,9],includePoints:[[pointX,pointY]],previewX:clampDiagram(root*.75,.3,8),fixedPoint:[pointX,pointY],fixedPointLabel:'('+trim(pointX,1)+', '+trim(pointY,1)+')',variablePointLabel:'P = (x, x³ᐟ² − 4)',curveLabel:'y = x³ᐟ² − 4'},
    prompt:'Find the \\(x\\)-coordinate of the point on \\(y=x^{3/2}-4\\) that is closest to \\(('+trim(pointX,1)+','+trim(pointY,1)+')\\).',value:root,
    steps:[
      'For a point \\((x,x^{3/2}-4)\\), minimize \\(D(x)=(x-'+trim(pointX,1)+')^2+(x^{3/2}-'+trim(4+pointY,1)+')^2\\) on \\(x\\ge0\\).',
      'Differentiate: \\(D^{\\prime}(x)=2(x-'+trim(pointX,1)+')+3\\sqrt{x}(x^{3/2}-'+trim(4+pointY,1)+')\\).',
      'Graph \\(D^{\\prime}(x)\\) for \\(x\\ge0\\) and use the zero feature. The zero in the physical domain is \\(x\\approx'+root.toFixed(6)+'\\).',
      'The derivative changes from negative to positive there, so the squared distance has a minimum.',
      'The minimum distance is about \\('+distance.toFixed(6)+'\\), confirming the point is in the physical domain.',
      'The requested \\(x\\)-coordinate is \\('+root.toFixed(3)+'\\).'
    ]
  });
}

function optClosestPower(mode,source){
  var kind=diverseVariant('optimization:calculator:closest-point',['power','parabola','radical','rational','cubic'],4),candidate=null;
  for(var attempt=0;attempt<50&&!candidate;attempt+=1){
    var pointX=pick([1.7,2.6,3.4,4.3]),pointY=pick([0.6,1.4,2.1]),left,right,curveTex,curveValue,curveDerivative,derivativeTex,family;
    if(kind==='power'){left=.05;right=8;curveTex='x^{3/2}-4';curveValue=function(v){return Math.pow(v,1.5)-4;};curveDerivative=function(v){return 1.5*Math.sqrt(v);};derivativeTex='2(x-'+pointX+')+3\\sqrt{x}(x^{3/2}-'+trim(4+pointY,1)+')';family='closest_point_power_curve';}
    else if(kind==='parabola'){left=-4;right=5;curveTex='0.4x^2-1.3';curveValue=function(v){return .4*v*v-1.3;};curveDerivative=function(v){return .8*v;};derivativeTex='2(x-'+pointX+')+1.6x(0.4x^2-'+trim(1.3+pointY,1)+')';family='closest_point_polynomial';}
    else if(kind==='radical'){left=-1.9;right=9;curveTex='\\sqrt{x+2}-1.5';curveValue=function(v){return Math.sqrt(v+2)-1.5;};curveDerivative=function(v){return 1/(2*Math.sqrt(v+2));};derivativeTex='2(x-'+pointX+')+\\frac{\\sqrt{x+2}-'+trim(1.5+pointY,1)+'}{\\sqrt{x+2}}';family='closest_point_radical_curve';}
    else if(kind==='rational'){left=-1.7;right=8;curveTex='\\frac6{x+2}+0.4x';curveValue=function(v){return 6/(v+2)+.4*v;};curveDerivative=function(v){return -6/Math.pow(v+2,2)+.4;};derivativeTex='2(x-'+pointX+')+2\\left(\\frac6{x+2}+0.4x-'+pointY+'\\right)\\left(-\\frac6{(x+2)^2}+0.4\\right)';family='closest_point_rational_curve';}
    else{left=-4;right=4;curveTex='0.12x^3-0.8x';curveValue=function(v){return .12*v*v*v-.8*v;};curveDerivative=function(v){return .36*v*v-.8;};derivativeTex='2(x-'+pointX+')+2(0.12x^3-0.8x-'+pointY+')(0.36x^2-0.8)';family='closest_point_cubic_curve';}
    var derivative=(function(a,b,f,fp){return function(v){return 2*(v-a)+2*(f(v)-b)*fp(v);};})(pointX,pointY,curveValue,curveDerivative);
    var roots=scanRoots(derivative,left,right,1000).filter(function(v){return derivative(v-1e-4)<0&&derivative(v+1e-4)>0&&distanceFromSimpleRational(v)>.004;});
    var values=[{x:left,d:Math.pow(left-pointX,2)+Math.pow(curveValue(left)-pointY,2)},{x:right,d:Math.pow(right-pointX,2)+Math.pow(curveValue(right)-pointY,2)}];
    roots.forEach(function(v){values.push({x:v,d:Math.pow(v-pointX,2)+Math.pow(curveValue(v)-pointY,2)});});values.sort(function(a,b){return a.d-b.d;});
    if(roots.length&&values[0].x!==left&&values[0].x!==right&&(values.length<2||values[1].d-values[0].d>.02))candidate={kind:kind,pointX:pointX,pointY:pointY,left:left,right:right,curveTex:curveTex,curveValue:curveValue,derivative:derivative,derivativeTex:derivativeTex,root:values[0].x,family:family};
    if(attempt===24&&!candidate)kind=pick(['power','parabola','radical','cubic']);
  }
  if(!candidate)return optClosestPowerLegacy(mode,source);
  var x=candidate.root,y=candidate.curveValue(x),distance=Math.hypot(x-candidate.pointX,y-candidate.pointY),request=diverseVariant('optimization:calculator:closest-request',['x','point','distance'],2);
  var target='('+trim(candidate.pointX,1)+','+trim(candidate.pointY,1)+')',interval=trim(candidate.left,2)+'\\le x\\le '+trim(candidate.right,2);
  var curveLabels={power:'y = x³ᐟ² − 4',parabola:'y = 0.4x² − 1.3',radical:'y = √(x + 2) − 1.5',rational:'y = 6/(x + 2) + 0.4x',cubic:'y = 0.12x³ − 0.8x'};
  var diagram={kind:'closest-curve',title:'Closest point on the generated curve',description:'The actual generated curve, generated fixed point, variable point on the curve, and distance segment.',fn:candidate.curveValue,domain:[candidate.left,candidate.right],includePoints:[[candidate.pointX,candidate.pointY]],previewX:candidate.left+.58*(candidate.right-candidate.left),fixedPoint:[candidate.pointX,candidate.pointY],fixedPointLabel:'('+trim(candidate.pointX,1)+', '+trim(candidate.pointY,1)+')',variablePointLabel:'P = (x, f(x))',curveLabel:curveLabels[candidate.kind]};
  var prompt=request==='x'?'Find the \\(x\\)-coordinate of the point on \\(y='+candidate.curveTex+'\\), for \\('+interval+'\\), that is closest to \\('+target+'\\).'
    :request==='point'?'Find the point on \\(y='+candidate.curveTex+'\\), for \\('+interval+'\\), that is closest to \\('+target+'\\).'
    :'Find the minimum distance from \\(y='+candidate.curveTex+'\\), for \\('+interval+'\\), to \\('+target+'\\).';
  var steps=[
    'A point on the curve is \\((x,'+candidate.curveTex+')\\). The allowed values are \\('+interval+'\\).',
    'Use the squared distance \\(D(x)=(x-'+trim(candidate.pointX,1)+')^2+('+candidate.curveTex+'-'+trim(candidate.pointY,1)+')^2\\). Minimizing \\(D\\) also minimizes the distance.',
    'Differentiate: \\(D^{\\prime}(x)='+candidate.derivativeTex+'\\).',
    'Graph \\(D^{\\prime}(x)\\) and use the calculator’s zero feature. The critical value that gives the smallest distance is \\(x\\approx'+x.toFixed(6)+'\\).',
    'The graph of \\(D^{\\prime}\\) is below the \\(x\\)-axis just before this value and above it just after, so \\(D\\) has a minimum there.',
    'Checking the endpoints and critical values gives the closest point \\('+x.toFixed(6)+','+y.toFixed(6)+'\\).'
  ];
  if(request==='distance')steps.push('The distance from that point to the given point is \\('+distance.toFixed(6)+'\\).');
  if(request==='point')return multiFieldProblem({slug:'optimization',mode:'calculator',source:source,family:candidate.family,id:'u3-v128a-opt-closest-'+candidate.kind+'-point-'+trim(candidate.pointX,1),variant:'optimization_closest_point_'+candidate.kind,diagram:diagram,prompt:prompt,fields:[{label:'x=',numericAnswer:x,answerTex:x.toFixed(3),placeholder:'x-coordinate'},{label:'y=',numericAnswer:y,answerTex:y.toFixed(3),placeholder:'y-coordinate'}],steps:steps});
  return scalarProblem({slug:'optimization',mode:'calculator',source:source,family:candidate.family,id:'u3-v128a-opt-closest-'+candidate.kind+'-'+request+'-'+trim(candidate.pointX,1),variant:'optimization_closest_point_'+candidate.kind,diagram:diagram,prompt:prompt,value:request==='x'?x:distance,steps:steps});
}

function optTrigArch(mode,source){
  var kind=diverseVariant('optimization:calculator:symmetric-rectangle',['trig','quartic','mixed','semicircle','ellipse'],4);
  var equationTex,areaTex,derivativeTex,upper,upperTex,heightFunction,derivative,family,idPart,curveDiagramLabel;
  if(kind==='trig'){
    var scale=pick([1.2,1.5,1.8]),frequency=pick([1,2]);
    upper=Math.PI/frequency;upperTex=frequency===1?'\\pi':'\\frac{\\pi}{2}';
    heightFunction=function(x){return scale*(1+Math.cos(frequency*x));};
    derivative=function(x){return 2*scale*(1+Math.cos(frequency*x))-2*scale*frequency*x*Math.sin(frequency*x);};
    equationTex=trim(scale,1)+'(1+\\cos('+frequency+'x))';areaTex='2x['+equationTex+']';
    derivativeTex='2('+trim(scale,1)+')(1+\\cos('+frequency+'x))-2('+trim(scale,1)+')('+frequency+')x\\sin('+frequency+'x)';
    family='rectangle_under_trig_arch';idPart='trig-'+trim(scale,1)+'-'+frequency;
    curveDiagramLabel='y = '+trim(scale,1)+'(1 + cos('+(frequency===1?'x':frequency+'x')+'))';
  }else if(kind==='quartic'){
    var quarticHeight=pick([17.6,24.3,31.8]),quarticCoefficient=pick([0.6,1.1,1.7]);
    upper=Math.pow(quarticHeight/quarticCoefficient,.25);upperTex=trim(upper,6);
    heightFunction=function(x){return quarticHeight-quarticCoefficient*Math.pow(x,4);};
    derivative=function(x){return 2*quarticHeight-10*quarticCoefficient*Math.pow(x,4);};
    equationTex=trim(quarticHeight,1)+'-'+trim(quarticCoefficient,1)+'x^4';areaTex='2x('+equationTex+')';
    derivativeTex=trim(2*quarticHeight,2)+'-'+trim(10*quarticCoefficient,2)+'x^4';
    family='rectangle_under_quartic_arch';idPart='quartic-'+trim(quarticHeight,1)+'-'+trim(quarticCoefficient,1);
    curveDiagramLabel='y = '+trim(quarticHeight,1)+' − '+trim(quarticCoefficient,1)+'x⁴';
  }else if(kind==='mixed'){
    var mixedHeight=pick([18.7,26.4,34.1]),quadratic=pick([0.7,1.2,1.6]),quartic=pick([0.08,0.14,0.21]);
    heightFunction=function(x){return mixedHeight-quadratic*x*x-quartic*Math.pow(x,4);};
    var boundary=function(x){return heightFunction(x);};upper=bisectRoot(boundary,.0001,10);upperTex=trim(upper,6);
    derivative=function(x){return 2*mixedHeight-6*quadratic*x*x-10*quartic*Math.pow(x,4);};
    equationTex=trim(mixedHeight,1)+'-'+trim(quadratic,1)+'x^2-'+trim(quartic,2)+'x^4';areaTex='2x('+equationTex+')';
    derivativeTex=trim(2*mixedHeight,2)+'-'+trim(6*quadratic,2)+'x^2-'+trim(10*quartic,2)+'x^4';
    family='rectangle_under_mixed_even_arch';idPart='mixed-'+trim(mixedHeight,1)+'-'+trim(quadratic,1)+'-'+trim(quartic,2);
    curveDiagramLabel='y = '+trim(mixedHeight,1)+' − '+trim(quadratic,1)+'x² − '+trim(quartic,2)+'x⁴';
  }else if(kind==='semicircle'){
    var radius=pick([6.7,9.4,12.3]);upper=radius;upperTex=trim(radius,1);
    heightFunction=function(x){return Math.sqrt(radius*radius-x*x);};
    derivative=function(x){return 2*(radius*radius-2*x*x)/Math.sqrt(radius*radius-x*x);};
    equationTex='\\sqrt{'+trim(radius*radius,2)+'-x^2}';areaTex='2x\\sqrt{'+trim(radius*radius,2)+'-x^2}';
    derivativeTex='\\frac{2('+trim(radius*radius,2)+'-2x^2)}{\\sqrt{'+trim(radius*radius,2)+'-x^2}}';
    family='rectangle_under_semicircle_arch';idPart='semicircle-'+trim(radius,1);
    curveDiagramLabel='y = √('+trim(radius*radius,2)+' − x²)';
  }else{
    var horizontal=pick([7.3,10.6,13.8]),vertical=pick([4.4,6.7,8.9]);upper=horizontal;upperTex=trim(horizontal,1);
    heightFunction=function(x){return vertical*Math.sqrt(1-x*x/(horizontal*horizontal));};
    derivative=function(x){return 2*vertical*(1-2*x*x/(horizontal*horizontal))/Math.sqrt(1-x*x/(horizontal*horizontal));};
    equationTex=trim(vertical,1)+'\\sqrt{1-\\frac{x^2}{'+trim(horizontal*horizontal,2)+'}}';areaTex='2x['+equationTex+']';
    derivativeTex='\\frac{2('+trim(vertical,1)+')\\left(1-\\frac{2x^2}{'+trim(horizontal*horizontal,2)+'}\\right)}{\\sqrt{1-\\frac{x^2}{'+trim(horizontal*horizontal,2)+'}}}';
    family='rectangle_under_ellipse_arch';idPart='ellipse-'+trim(horizontal,1)+'-'+trim(vertical,1);
    curveDiagramLabel='y = '+trim(vertical,1)+'√(1 − x²/'+trim(horizontal*horizontal,2)+')';
  }
  var root=bisectRoot(derivative,.0001,upper-.0001),height=heightFunction(root),width=2*root,area=width*height;
  var request=pick(['width','dimensions','area']);
  var diagram={kind:'curve-rectangle',title:'Rectangle under the generated curve',description:'A variable rectangle symmetric about the y-axis with upper corners on the actual generated curve.',fn:heightFunction,domain:[-upper,upper],previewX:upper*.45,curveLabel:curveDiagramLabel};
  var commonSteps=[
    'Let \\(x>0\\) be the upper-right corner’s \\(x\\)-coordinate. Because the rectangle is symmetric about the \\(y\\)-axis, its full width is \\(2x\\). The curve gives the height \\(y='+equationTex+'\\).',
    'The area is \\(A(x)='+areaTex+'\\), with \\(0<x<'+upperTex+'\\).',
    'Differentiate: \\(A^{\\prime}(x)='+derivativeTex+'\\).',
    'Graph \\(A^{\\prime}(x)\\) on this restricted interval and use the calculator’s zero feature. This gives \\(x\\approx'+root.toFixed(6)+'\\).',
    'The graph of \\(A^{\\prime}\\) is positive to the left of this value and negative to the right, so the area is largest there.',
    'At either end of the allowed interval, no rectangle with positive area is formed, so the interior critical value gives the absolute maximum.',
    'Using the full calculator value, the width is \\('+width.toFixed(6)+'\\), the height is \\('+height.toFixed(6)+'\\), and the maximum area is \\('+area.toFixed(6)+'\\).'
  ];
  var prompt='A rectangle is symmetric about the \\(y\\)-axis, has its base on the \\(x\\)-axis, and its upper corners lie on \\(y='+equationTex+'\\). Find the '+(request==='dimensions'?'width and height of the maximum-area rectangle':request==='area'?'maximum area':'width of the maximum-area rectangle')+'.';
  if(request==='dimensions')return multiFieldProblem({slug:'optimization',mode:'calculator',source:source,family:family,id:'u3-v128a-opt-symmetric-'+idPart+'-dimensions',variant:'optimization_symmetric_rectangle_'+kind+'_dimensions',diagram:diagram,prompt:prompt,fields:[{label:'w=',numericAnswer:width,answerTex:width.toFixed(3),placeholder:'Width'},{label:'h=',numericAnswer:height,answerTex:height.toFixed(3),placeholder:'Height'}],steps:commonSteps});
  return scalarProblem({slug:'optimization',mode:'calculator',source:source,family:family,id:'u3-v128a-opt-symmetric-'+idPart+'-'+request,variant:'optimization_symmetric_rectangle_'+kind+'_'+request,diagram:diagram,prompt:prompt,value:request==='area'?area:width,steps:commonSteps});
}

function optBoxDimensions(mode,source){
  var cut=integer(2,7),sheet=6*cut,base=4*cut,volume=cut*base*base;
  return multiFieldProblem({slug:'optimization',mode:'noncalculator',source:source,family:'open_box_dimensions_and_volume',id:'u3-v128-opt-box-fields-'+sheet,variant:'optimization_open_box_dimensions_and_maximum_volume',diagram:{kind:'sheet-net',title:'Square sheet with corner cuts',description:'The generated square sheet with four variable corner cuts labeled x.',length:sheet,width:sheet,unit:'in',cutLabel:'x'},prompt:'Squares are cut from the corners of a square piece of cardboard with side length \\('+sheet+'\\) inches. Find the cut size, the base side length, and the maximum box volume.',fields:[{label:'x=',answer:String(cut),answerTex:String(cut),placeholder:'Cut size'},{label:'b=',answer:String(base),answerTex:String(base),placeholder:'Base side length'},{label:'V=',answer:String(volume),answerTex:String(volume),placeholder:'Maximum volume'}],steps:[
    'Let \\(x\\) be the cut size. Then \\(V(x)=x('+sheet+'-2x)^2\\), with \\(0<x<'+sheet/2+'\\).',
    'Differentiate: \\(V^{\\prime}(x)=('+sheet+'-2x)('+sheet+'-6x)\\).',
    'The critical value in the physical domain is \\(x='+cut+'\\). The derivative changes from positive to negative there, so it gives the maximum.',
    'The base side is \\('+sheet+'-2('+cut+')='+base+'\\) inches.',
    'The maximum volume is \\(V='+cut+'('+base+')^2='+volume+'\\) cubic inches.'
  ]});
}

function optDiscreteRevenue(mode,source){
  var context=pick(['hotel','orchard']),base=integer(18,36),lower=integer(42,68),fraction=pick([.3,.4,.6,.7]),continuous=lower+fraction;
  if(context==='hotel'){
    var decrease=pick([1,2,3]),price=2*decrease*continuous-decrease*base,model=function(q){return q*(price-decrease*(q-base));},left=Math.floor(continuous),right=Math.ceil(continuous),answer=model(left)>model(right)?left:right;
    return scalarProblem({slug:'optimization',mode:'noncalculator',source:source,family:'discrete_hotel_revenue',id:'u3-v128-opt-discrete-hotel-'+base+'-'+price,variant:'optimization_discrete_hotel_revenue',prompt:'A hotel charges '+money(price)+' per room when '+base+' rooms are reserved. For each additional room, the price of every room drops by '+money(decrease)+'. How many whole rooms maximize revenue?',answer:String(answer),answerTex:String(answer),steps:[
      'Let \\(q\\) be the number of rooms. Revenue is \\(R(q)=q['+price.toFixed(2)+'-'+(decrease===1?'':decrease)+'(q-'+base+')]\\).',
      'Differentiate the continuous model and solve \\(R^{\\prime}(q)=0\\). This gives \\(q='+continuous.toFixed(1)+'\\).',
      'A room count must be an integer, so compare the neighboring choices \\(q='+left+'\\) and \\(q='+right+'\\).',
      '\\(R('+left+')='+model(left).toFixed(2)+'\\) and \\(R('+right+')='+model(right).toFixed(2)+'\\).',
      'Therefore '+answer+' rooms give the larger revenue.'
    ]});
  }
  var drop=pick([6,8,10]),yieldAtBase=Number((2*drop*continuous-drop*base).toFixed(1)),orchard=function(q){return q*(yieldAtBase-drop*(q-base));},lo=Math.floor(continuous),hi=Math.ceil(continuous),best=orchard(lo)>orchard(hi)?lo:hi;
  return scalarProblem({slug:'optimization',mode:'noncalculator',source:source,family:'discrete_orchard_yield',id:'u3-v128-opt-discrete-orchard-'+base+'-'+yieldAtBase,variant:'optimization_discrete_orchard_yield',prompt:'An orchard produces '+trim(yieldAtBase,1)+' pieces of fruit per tree when '+base+' trees are planted per acre. Each additional tree reduces every tree’s yield by '+drop+'. How many whole trees per acre maximize total yield?',answer:String(best),answerTex:String(best),steps:[
    'Let \\(q\\) be the number of trees. The model is \\(Y(q)=q['+yieldAtBase+'-'+drop+'(q-'+base+')]\\).',
    'Differentiate the continuous model and solve \\(Y^{\\prime}(q)=0\\). This gives \\(q='+continuous.toFixed(1)+'\\).',
    'Because the number of trees must be whole, compare \\(q='+lo+'\\) and \\(q='+hi+'\\).',
    '\\(Y('+lo+')='+trim(orchard(lo),2)+'\\) and \\(Y('+hi+')='+trim(orchard(hi),2)+'\\).',
    'Therefore '+best+' trees per acre give the larger modeled yield.'
  ]});
}

var optimizationAssignment=[
  descriptor('open_top_square_cardboard','assignment',optSquareCorner,null,{calculator:false}),
  descriptor('open_top_rectangular_cardboard','assignment',optRectangularCardboard),
  descriptor('open_box_dimensions_and_volume','assignment',optBoxDimensions,'open_top_box',{calculator:false}),
  descriptor('square_base_box_fixed_material','assignment',optSquareBaseMaterial,null,{calculator:false}),
  descriptor('closed_cylinder_fixed_volume','assignment',function(mode,source){return optCylinder(mode,source,false);},null,{calculator:false}),
  descriptor('open_cylinder_fixed_volume','assignment',function(mode,source){return optCylinder(mode,source,true);},null,{calculator:false}),
  descriptor('cylinder_different_material_costs','assignment',optCylinderCost),
  descriptor('capsule_unequal_material_costs','assignment',optCapsuleCost,'container_costs'),
  descriptor('square_pyramid_fixed_volume','assignment',optSquarePyramid,'pyramid_material',{calculator:false}),
  descriptor('rectangular_fixed_perimeter_fencing','assignment',function(mode,source){return optRectangleFence(mode,source,false);},null,{calculator:false}),
  descriptor('three_side_barn_fencing','assignment',function(mode,source){return optRectangleFence(mode,source,true);},null,{calculator:false}),
  descriptor('hotel_room_revenue','assignment',function(mode,source){return optLinearRevenue(mode,source,'hotel');},'linear_revenue',{calculator:false}),
  descriptor('wholesale_order_revenue','assignment',function(mode,source){return optLinearRevenue(mode,source,'wholesale');},'linear_revenue',{calculator:false}),
  descriptor('discrete_revenue_or_yield','assignment',optDiscreteRevenue,'linear_revenue',{calculator:false}),
  descriptor('orchard_yield','assignment',optOrchard,'linear_revenue',{calculator:false}),
  descriptor('equilateral_triangle_window','assignment',optTriangleWindow,null,{calculator:false}),
  descriptor('rectangle_in_semicircle','assignment',optSemicircleRectangle,'inscribed_rectangles',{calculator:false}),
  descriptor('rectangle_under_trig_arch','assignment',optTrigArch,'inscribed_rectangles',{noncalculator:false}),
  descriptor('page_printed_area','assignment',optPageMargins),
  descriptor('closest_point_square_root','assignment',optClosestSquareRoot,'closest_point',{calculator:false}),
  descriptor('closest_point_polynomial','assignment',optClosestPolynomial,'closest_point',{calculator:false}),
  descriptor('closest_point_power_curve','assignment',optClosestPower,'closest_point',{noncalculator:false}),
  descriptor('two_poles_minimum_cable','assignment',optPoleCable),
  descriptor('shortest_ladder_over_fence','assignment',optLadderFence),
  descriptor('maximum_cone_from_right_triangle','assignment',optConeFromTriangle,null,{calculator:false}),
  descriptor('minimum_distance_moving_ships','assignment',optMovingShips,null,{calculator:false}),
  descriptor('rectangle_under_parabola','assignment',optParabolaRectangle,'inscribed_rectangles',{calculator:false})
];
var optimizationTest=[
  descriptor('test_square_base_box','test',optSquareBaseMaterial,'square_base_box_fixed_material',{calculator:false}),
  descriptor('test_cylinder_cost','test',optCylinderCost,'cylinder_different_material_costs',{calculator:false}),
  descriptor('test_open_top_box','test',optSquareCorner,'open_top_square_cardboard',{calculator:false}),
  descriptor('test_rectangular_box_numerical','test',optRectangularCardboard,'open_top_rectangular_cardboard',{noncalculator:false}),
  descriptor('test_rigid_barn_pen','test',function(mode,source){return mode==='calculator'?optPigPen(mode,source):optRectangleFence(mode,source,true);})
];
var optimizationExtension=[
  descriptor('two_number_product','extension',optTwoNumbers,null,{calculator:false}),
  descriptor('wire_split_circle_square','extension',optWireSplit,null,{calculator:false}),
  descriptor('minimum_axis_intercept_triangle','extension',optAxisTriangle,null,{calculator:false}),
  descriptor('rectangle_in_circle','extension',optCircleRectangle,null,{calculator:false}),
  descriptor('different_cost_rectangle_fencing','extension',optWeightedFence,null,{calculator:false}),
  descriptor('extension_closest_power_curve','extension',optClosestPower,'closest_point',{noncalculator:false}),
  descriptor('extension_trigonometric_arch','extension',optTrigArch,'inscribed_rectangles',{noncalculator:false}),
  descriptor('extension_rigid_pen','extension',optPigPen,'rigid_pen',{noncalculator:false})
];
function optimization(options){
  var mode=modeOf(options),selection=sourcePool(optimizationAssignment,optimizationTest,optimizationExtension);
  var eligible=selection.pool.filter(function(item){return mode==='calculator'?item.calculator!==false:item.noncalculator!==false;});
  if(!eligible.length)eligible=selection.pool.slice();
  var key='optimization:'+mode,problem=null;
  for(var attempt=0;attempt<8;attempt+=1){var chosen=diverse(key,eligible);problem=chosen.build(mode,selection.source);if(problem.familyId!==lastGeneratedFamily[key])break;}
  lastGeneratedFamily[key]=problem.familyId;return problem;
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
  if(mode!=='calculator')return'';
  return 'Rounded to three decimal places, the rate is \\('+Number(value).toFixed(3)+'\\)'+(units?' '+units:'')+'.';
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
    diagram:{kind:'sphere',title:'Changing spherical balloon',description:'A spherical balloon whose changing radius is labeled r.',radiusLabel:'r'},
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
    diagram:{kind:'sphere',title:'Changing spherical balloon',description:'A spherical balloon whose changing radius is labeled r.',radiusLabel:'r'},
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
    diagram:{kind:'sphere',title:'Changing spherical balloon',description:'A spherical balloon whose changing radius is labeled r.',radiusLabel:'r'},
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
      diagram:{kind:'circle',title:'Changing circular region',description:'A changing circle whose radius remains labeled r.',radiusLabel:'r'},
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
    diagram:{kind:'circle',title:'Changing circular region',description:'A changing circle whose radius remains labeled r.',radiusLabel:'r'},
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
    diagram:{kind:'circle',title:'Expanding circular wave',description:'An expanding circular wave whose changing radius remains labeled r.',radiusLabel:'r'},
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
  var data=ladderData(mode),x=data.x,y=data.y,L=data.length,dx=data.dx,dy=-x*dx/y,givenDy=null;
  if(request==='bottom'){
    givenDy=-(mode==='calculator'?pick([1.35,2.15,2.8]):pick([1,2,3]));
    dx=-y*givenDy/x;dy=givenDy;
  }
  var value,units,name,variant;
  if(request==='top'){value=dy;units='feet per second';name='\\frac{dy}{dt}';variant='related_rates_sliding_ladder_top';}
  else if(request==='bottom'){value=dx;units='feet per second';name='\\frac{dx}{dt}';variant='related_rates_sliding_ladder_bottom';}
  else if(request==='area'){value=(x*dy+y*dx)/2;units='square feet per second';name='\\frac{dA}{dt}';variant='related_rates_sliding_ladder_area';}
  else if(request==='wallAngle'){value=dx/y;units='radians per second';name='\\frac{d\\theta}{dt}';variant='related_rates_sliding_ladder_wall_angle';}
  else{value=-dx/y;units='radians per second';name='\\frac{d\\theta}{dt}';variant='related_rates_sliding_ladder_ground_angle';}
  var exact;
  if(mode==='noncalculator'){
    if(request==='top')exact=rational(-x*dx,y);
    else if(request==='bottom')exact=rational(-y*givenDy,x);
    else if(request==='area')exact=rational(dx*(y*y-x*x),2*y);
    else if(request==='wallAngle')exact=rational(dx,y);
    else exact=rational(-dx,y);
  }
  var answer=mode==='calculator'?calcOrExact(mode,value,'',''):{answer:exact.input,answerTex:exact.tex,value:null};
  var requestText=request==='top'?'Find how fast the height of the top of the ladder is changing.'
    :request==='bottom'?'Find how fast the foot of the ladder is moving away from the wall.'
    :request==='area'?'Find the rate of change of the triangular area between the ladder, wall, and ground.'
    :request==='wallAngle'?'Let \\(\\theta\\) be the angle between the ladder and the wall. Find how fast this angle is changing.'
    :'Let \\(\\theta\\) be the angle between the ladder and the ground. Find how fast this angle is changing.';
  var motionText=request==='bottom'
    ?'Its top is \\('+trim(y,2)+'\\) feet above the ground and slides down at \\('+trim(Math.abs(givenDy),2)+'\\) feet per second. '
    :'Its foot is \\('+trim(x,2)+'\\) feet from the wall and moves away at \\('+trim(dx,2)+'\\) feet per second. ';
  var steps=[
    'Let \\(x\\) be the foot’s distance and \\(y\\) the top’s height. The fixed ladder gives \\(x^2+y^2='+trim(L*L,4)+'\\).',
    'At the moment described, \\(x='+trim(x,2)+'\\) and \\(y='+trim(y,2)+'\\). The signed known rate is '+(request==='bottom'?'\\(\\frac{dy}{dt}='+trim(givenDy,2)+'\\).':'\\(\\frac{dx}{dt}='+trim(dx,2)+'\\).'),
    'Differentiate with respect to time: \\(2x\\frac{dx}{dt}+2y\\frac{dy}{dt}=0\\).',
    request==='bottom'
      ?'Substitute and solve: \\(\\frac{dx}{dt}=-\\frac{y(dy/dt)}x='+trim(dx,8)+'\\) feet per second.'
      :'Substitute and solve: \\(\\frac{dy}{dt}=-\\frac{x(dx/dt)}y='+trim(dy,8)+'\\) feet per second.'
  ];
  if(request==='area')steps.push('Use \\(A=\\frac12xy\\). Then \\(\\frac{dA}{dt}=\\frac12\\left(x\\frac{dy}{dt}+y\\frac{dx}{dt}\\right)='+trim(value,8)+'\\) square feet per second.');
  else if(request==='angle')steps.push('Because \\(\\cos\\theta=\\frac{x}{L}\\), differentiation gives \\(\\frac{d\\theta}{dt}=-\\frac{dx/dt}{y}='+trim(value,8)+'\\) radians per second.');
  else if(request==='wallAngle')steps.push('Because \\(\\sin\\theta=\\frac{x}{L}\\), differentiation gives \\(\\frac{d\\theta}{dt}=\\frac{dx/dt}{y}='+trim(value,8)+'\\) radians per second.');
  steps.push('The '+(value<0?'negative':'positive')+' sign means the requested quantity is '+(value<0?'decreasing':'increasing')+'.');
  steps.push(rateConclusion(name,value,units,mode));
  return scalarProblem({slug:'related-rates',mode:mode,source:source,family:'ladder_'+request,id:'u3-v128-rr-ladder-'+request+'-'+mode+'-'+trim(L,2)+'-'+trim(x,2),variant:variant,diagram:{kind:'ladder',title:'Sliding ladder',description:'A fixed-length ladder against a wall with changing horizontal distance x and vertical height y.',length:L,unit:'ft',xLabel:'x',yLabel:'y',angle:request==='angle'?'ground':request==='wallAngle'?'wall':null},prompt:'A \\('+trim(L,2)+'\\)-foot ladder leans against a wall. '+motionText+requestText,answer:answer.answer,answerTex:answer.answerTex,value:answer.value,steps:steps});
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
    diagram:{kind:'shadow',title:'Person and lamppost shadow',description:'A generated lamppost and person with fixed heights and changing distances x and s.',poleHeight:pole,personHeight:person,unit:'ft',personDistanceLabel:'x',shadowLabel:'s',totalLabel:'x + s'},
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
    diagram:{kind:'cone-pile',title:'Changing conical pile',description:'A conical pile with changing radius r and height h.',radiusLabel:'r',heightLabel:'h',fixedNotes:['Shape ratio: r = '+(mode==='calculator'?trim(ratio,3):(ratioData.denominator===1?String(ratioData.numerator):ratioData.numerator+'/'+ratioData.denominator))+' h']},
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
    diagram:{kind:'conical-tank',title:'Water in an inverted conical tank',description:'The generated fixed tank with changing water depth h and surface radius r.',tankHeight:tankHeight,tankRadius:tankRadius,unit:'ft',depthLabel:'h',waterRadiusLabel:'r'},
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
    diagram:{kind:'triangular-trough',title:'Triangular trough cross-section',description:'A triangular trough with generated fixed dimensions and changing water depth h and surface width w.',topWidth:fullWidth,unit:'ft',depthLabel:'h',waterWidthLabel:'w',fixedNotes:['Full height: '+trim(fullHeight,1)+' ft','Trough length: '+trim(length,1)+' ft']},
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
    diagram:{kind:'trapezoidal-trough',title:'Trapezoidal trough cross-section',description:'A trapezoidal trough with generated fixed dimensions and changing water depth h and surface width w.',topWidth:top,bottomWidth:bottom,unit:'ft',depthLabel:'h',waterWidthLabel:'w',fixedNotes:['Full height: '+trim(fullHeight,1)+' ft','Trough length: '+trim(length,1)+' ft']},
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
    diagram:{kind:'cylinder-tank',title:'Water in a cylindrical tank',description:'A cylindrical tank with generated fixed radius and changing water depth h.',radius:radius,unit:'ft',heightLabel:'h'},
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

function rrPolygonAreaLegacy(mode,source,shape){
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
    diagram:{kind:'changing-shape',title:shape==='square'?'Changing square':'Changing equilateral triangle',description:'A changing '+(shape==='square'?'square':'equilateral triangle')+' whose side remains labeled s.',shape:shape,sideLabel:'s'},
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

function rrPolygonArea(mode,source,shape){
  var choices=['equilateral','square','rectangle','right_triangle','isosceles_triangle','circle','semicircle'];
  shape=shape&&shape!=='equilateral'?shape:diverseVariant('related-rates:'+mode+':changing-shape',choices,6);
  var s=mode==='calculator'?pick([4.3,6.1,8.7]):pick([4,6,8]),ds=mode==='calculator'?pick([-0.65,0.4,1.15]):pick([-2,-1,1,2]);
  var family=shape+'_area',description,formula,derivativeTex,rate,extra='',known='',symbol,relationshipStep='',substitutionTex;
  if(shape==='square'){description='a square';formula='A=s^2';derivativeTex='\\frac{dA}{dt}=2s\\frac{ds}{dt}';rate=2*s*ds;known='side length';symbol='s';substitutionTex='2('+trim(s,1)+')('+trim(ds,2)+')';}
  else if(shape==='equilateral'){description='an equilateral triangle';formula='A=\\frac{\\sqrt3}{4}s^2';derivativeTex='\\frac{dA}{dt}=\\frac{\\sqrt3}{2}s\\frac{ds}{dt}';rate=Math.sqrt(3)*s*ds/2;known='side length';symbol='s';substitutionTex='\\frac{\\sqrt3}{2}('+trim(s,1)+')('+trim(ds,2)+')';}
  else if(shape==='circle'||shape==='semicircle'){description=shape==='circle'?'a circle':'a semicircle';formula=shape==='circle'?'A=\\pi r^2':'A=\\frac12\\pi r^2';derivativeTex=shape==='circle'?'\\frac{dA}{dt}=2\\pi r\\frac{dr}{dt}':'\\frac{dA}{dt}=\\pi r\\frac{dr}{dt}';rate=(shape==='circle'?2:1)*Math.PI*s*ds;known='radius';symbol='r';substitutionTex=(shape==='circle'?'2\\pi':'\\pi')+'('+trim(s,1)+')('+trim(ds,2)+')';}
  else{
    var ratio=shape==='rectangle'?pick([2,3]):shape==='right_triangle'?pick([2,3]):pick([1,2]),other=ratio*s,otherRate=ratio*ds;
    description=shape==='rectangle'?'a rectangle':shape==='right_triangle'?'a right triangle':'an isosceles triangle';
    formula=shape==='rectangle'?'A=\\ell w':'A=\\frac12bh';
    derivativeTex=shape==='rectangle'?'\\frac{dA}{dt}=\\ell\\frac{dw}{dt}+w\\frac{d\\ell}{dt}':'\\frac{dA}{dt}=\\frac12\\left(b\\frac{dh}{dt}+h\\frac{db}{dt}\\right)';
    rate=shape==='rectangle'?(s*otherRate+other*ds):(s*otherRate+other*ds)/2;
    known=shape==='rectangle'?'width':'base';symbol=shape==='rectangle'?'w':'b';extra=' Its '+(shape==='rectangle'?'length':'height')+' is always '+ratio+' times its '+known+'.';
    relationshipStep=shape==='rectangle'
      ?'Because \\(\\ell='+ratio+'w\\), the length is \\('+trim(other,2)+'\\) centimeters and \\(\\frac{d\\ell}{dt}='+ratio+'\\frac{dw}{dt}='+trim(otherRate,2)+'\\) centimeters per minute.'
      :'Because \\(h='+ratio+'b\\), the height is \\('+trim(other,2)+'\\) centimeters and \\(\\frac{dh}{dt}='+ratio+'\\frac{db}{dt}='+trim(otherRate,2)+'\\) centimeters per minute.';
    substitutionTex=shape==='rectangle'
      ?'('+trim(other,2)+')('+trim(ds,2)+')+('+trim(s,2)+')('+trim(otherRate,2)+')'
      :'\\frac12\\left[('+trim(s,2)+')('+trim(otherRate,2)+')+('+trim(other,2)+')('+trim(ds,2)+')\\right]';
  }
  var answer;
  if(mode==='calculator')answer=calcOrExact(mode,rate,'','');
  else if((shape==='circle'||shape==='semicircle')){var piAnswer=piMultiple((shape==='circle'?2:1)*s*ds,1);answer={answer:piAnswer.input,answerTex:piAnswer.tex,value:null};}
  else if(shape==='equilateral'){var coefficient=rational(s*ds,2);answer={answer:'('+coefficient.input+')*sqrt(3)',answerTex:(coefficient.tex==='1'?'':coefficient.tex==='-1'?'-':coefficient.tex)+'\\sqrt3',value:null};}
  else{var exact=rational(rate,1);answer={answer:exact.input,answerTex:exact.tex,value:null};}
  var rateSymbol='\\frac{d'+symbol+'}{dt}';
  var diagram={kind:'changing-shape',title:'Changing '+description.replace(/^an? /,''),description:'The actual generated changing shape with its changing dimensions labeled by variables.',shape:shape,radiusLabel:'r',sideLabel:'s',widthLabel:'ℓ',heightLabel:shape==='rectangle'?'w':'h',baseLabel:'b'};
  return scalarProblem({slug:'related-rates',mode:mode,source:source,family:family,id:'u3-v128a-rr-'+shape+'-'+mode+'-'+trim(s,1)+'-'+trim(ds,2),variant:'related_rates_'+shape+'_area',diagram:diagram,prompt:'The '+known+' of '+description+' is \\('+trim(s,1)+'\\) '+unitPhrase(s,'centimeter','centimeters')+' and changes at \\('+trim(ds,2)+'\\) '+unitPhrase(Math.abs(ds),'centimeter','centimeters')+' per minute.'+extra+' Find how fast the area is changing.',answer:answer.answer,answerTex:answer.answerTex,value:answer.value,steps:[
    'Let \\('+symbol+'\\) represent the '+known+'. The known rate is \\('+rateSymbol+'='+trim(ds,2)+'\\) centimeters per minute.',
    relationshipStep,
    'Use the area formula \\('+formula+'\\).',
    'Differentiate with respect to time: \\('+derivativeTex+'\\).',
    'Substitute the measurements and rates: \\(\\frac{dA}{dt}='+substitutionTex+'='+(mode==='calculator'?trim(rate,8):answer.answerTex)+'\\) square centimeters per minute.',
    'The '+(rate<0?'negative':'positive')+' sign means the area is '+(rate<0?'decreasing':'increasing')+'.',
    rateConclusion('\\frac{dA}{dt}',rate,'square centimeters per minute',mode)
  ]});
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
    diagram:{kind:'perpendicular-motion',title:'Balloon and bicyclist separation',description:'Perpendicular changing distances x and y with their changing separation d.',xLabel:'x',yLabel:'y',distanceLabel:'d',fixedNotes:['Initial balloon height: '+trim(initialHeight,1)+' ft','Bicyclist speed: '+trim(horizontalRate,1)+' ft/s','Balloon rise speed: '+trim(verticalRate,1)+' ft/s']},
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
    diagram:{kind:'softball-diamond',title:'Runner on a softball diamond',description:'A generated square diamond with fixed side length, changing runner distance x from third, and changing distance d from home.',side:side,runnerFromThird:fromThird,unit:'ft',runnerDistanceLabel:'x',distanceLabel:'d'},
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
    ?{theta:pick([2*Math.PI/7,2*Math.PI/9,0.73]),label:null,secNumerator:null,secDenominator:null}
    :pick([
      {theta:Math.PI/6,label:'\\pi/6',secNumerator:4,secDenominator:3},
      {theta:Math.PI/4,label:'\\pi/4',secNumerator:2,secDenominator:1},
      {theta:Math.PI/3,label:'\\pi/3',secNumerator:4,secDenominator:1}
    ]);
  var theta=angleData.theta;
  var omega=mode==='calculator'?pick([2.1,2.8,3.5]):pick([0.5,1,2]);
  var signed=distance*omega/(Math.cos(theta)*Math.cos(theta)),speed=Math.abs(signed);
  var answer;
  if(mode==='calculator')answer=calcOrExact(mode,speed,'','');
  else{
    var exact=rational(distance*omega*angleData.secNumerator,angleData.secDenominator);
    answer={answer:exact.input,answerTex:exact.tex,value:null};
  }
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'rotating_spotlight',id:'u3-v127-rr-spotlight-'+mode+'-'+distance+'-'+trim(theta,4),
    variant:'related_rates_rotating_spotlight',
    diagram:{kind:'spotlight',title:'Rotating spotlight and shoreline',description:'A spotlight on a buoy at the generated fixed perpendicular distance from shore, with changing shoreline distance x and angle theta at the spotlight.',offset:distance,angleValue:theta,unit:'ft',distanceLabel:'x',angleLabel:'θ'},
    prompt:'A spotlight on a buoy is \\('+distance+'\\) feet from a straight shoreline, measured along the perpendicular to the shore. Let \\(\\theta\\) be the angle at the spotlight between that perpendicular and the beam. When \\(\\theta='+(mode==='calculator'?trim(theta,9):angleData.label)+'\\), the beam rotates away from the perpendicular at \\('+trim(omega,2)+'\\) radians per minute. Find the speed of the light spot along the shoreline.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Let \\(x\\) be the shoreline distance from the point nearest the buoy to the light spot. The given angular rate is \\(\\frac{d\\theta}{dt}='+trim(omega,2)+'\\).',
      'Because \\(\\theta\\) is measured at the spotlight from the perpendicular, \\(\\tan\\theta=\\frac{x}{'+distance+'}\\), so \\(x='+distance+'\\tan\\theta\\).',
      'Differentiate with respect to time: \\(\\frac{dx}{dt}='+distance+'\\sec^2\\theta\\frac{d\\theta}{dt}\\).',
      'Substitute the stated angle and angular rate.',
      'The signed velocity is \\(\\frac{dx}{dt}='+trim(signed,8)+'\\) feet per minute.',
      'Speed is the magnitude, so \\(|\\frac{dx}{dt}|='+trim(speed,8)+'\\).',
      'The positive sign means the spot is moving away from the point on shore nearest the buoy.',
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
    diagram:{kind:'line-of-sight',title:'Angle of elevation to a balloon',description:'A fixed horizontal separation with changing balloon height y and angle theta.',horizontal:distance,unit:'ft',heightLabel:'y',angleLabel:'θ'},
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

function rrRopeBalloonLegacy(mode,source){
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
    diagram:{kind:'rope-balloon',title:'Balloon and fixed rope spool',description:'A fixed horizontal distance with changing balloon height y and rope length s.',horizontal:horizontal,unit:'ft',heightLabel:'y',distanceLabel:'s',showAngle:false},
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

function rrRopeBalloon(mode,source){
  var horizontal,height,rise;
  if(mode==='noncalculator'){
    var config=pick([[60,80,5],[90,120,6],[120,160,8],[150,200,9]]);horizontal=config[0];height=config[1];rise=config[2];
  }else{horizontal=pick([93.4,128.6,156.2]);height=pick([74.5,112.8,143.7]);rise=pick([4.6,7.3,9.2]);}
  var rope=Math.hypot(horizontal,height),rate=height*rise/rope,answer;
  if(mode==='calculator')answer=calcOrExact(mode,rate,'','');
  else{var exact=rational(height*rise,rope);answer={answer:exact.input,answerTex:exact.tex,value:null};}
  return scalarProblem({slug:'related-rates',mode:mode,source:source,family:'rope_spool_balloon',id:'u3-v128a-rr-rope-balloon-'+mode+'-'+trim(horizontal,1)+'-'+trim(height,1),variant:'related_rates_rope_spool_balloon',diagram:{kind:'rope-balloon',title:'Balloon and fixed rope holder',description:'A fixed horizontal distance with changing balloon height y and rope length s.',horizontal:horizontal,unit:'ft',heightLabel:'y',distanceLabel:'s',showAngle:false},prompt:'A balloon is directly above a point \\('+trim(horizontal,1)+'\\) feet from a person holding a taut rope. At the moment the balloon is \\('+trim(height,1)+'\\) feet high, it is rising at \\('+trim(rise,1)+'\\) feet per second. How fast is the rope length increasing?',answer:answer.answer,answerTex:answer.answerTex,value:answer.value,steps:[
    'Let \\(y\\) be the balloon’s height and \\(s\\) the rope length. The horizontal distance is fixed at \\('+trim(horizontal,1)+'\\) feet, and \\(\\frac{dy}{dt}='+trim(rise,1)+'\\).',
    'Use the right-triangle relationship \\(s^2='+trim(horizontal*horizontal,3)+'+y^2\\).',
    'At the moment described, \\(s=\\sqrt{'+trim(horizontal*horizontal,3)+'+'+trim(height*height,3)+'}='+trim(rope,8)+'\\) feet.',
    'Differentiate with respect to time: \\(2s\\frac{ds}{dt}=2y\\frac{dy}{dt}\\).',
    'Substitute \\(y='+trim(height,1)+'\\), \\(s='+trim(rope,8)+'\\), and \\(\\frac{dy}{dt}='+trim(rise,1)+'\\).',
    'Solving gives \\(\\frac{ds}{dt}=\\frac{y(dy/dt)}s='+(mode==='calculator'?trim(rate,8):answer.answerTex)+'\\) feet per second.',
    'The positive rate means the rope length is increasing.',
    rateConclusion('\\frac{ds}{dt}',rate,'feet per second',mode)
  ]});
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
      rateConclusion('\\frac{dy}{dt}',rate,'',mode)
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
    diagram:{kind:'perpendicular-motion',title:'Cyclists on perpendicular paths',description:'Two changing perpendicular distances x and y with changing separation d.',xLabel:'x',yLabel:'y',distanceLabel:'d',fixedNotes:['North cyclist: '+trim(northRate,1)+' m/s','East cyclist: '+trim(eastRate,1)+' m/s','Start delay: '+trim(delay,1)+' s']},
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

function rrConeReverse(mode,source,request){
  request=request||pick(['height_from_volume','radius_from_volume','volume_from_height']);
  var tankHeight=mode==='calculator'?pick([13.6,17.2,21.4]):pick([8,12,16]);
  var tankRadius=mode==='calculator'?pick([5.1,7.3,9.2]):tankHeight/2;
  var depth=mode==='calculator'?pick([3.2,4.7,6.1]):tankHeight/4;
  var ratio=tankRadius/tankHeight,volumeCoefficient=mode==='calculator'?pick([-3.4,-2.15,2.8,4.25]):pick([-6,-3,3,6]);
  var volumeRate=mode==='calculator'?volumeCoefficient:volumeCoefficient*Math.PI;
  var heightRate=volumeRate/(Math.PI*ratio*ratio*depth*depth),radiusRate=ratio*heightRate;
  if(request==='volume_from_height'){
    heightRate=mode==='calculator'?pick([-0.37,-0.22,0.31,0.46]):pick([-1,-.5,.5,1]);
    volumeRate=Math.PI*ratio*ratio*depth*depth*heightRate;radiusRate=ratio*heightRate;
  }
  var value=request==='height_from_volume'?heightRate:request==='radius_from_volume'?radiusRate:volumeRate;
  var answer;
  if(mode==='calculator')answer=calcOrExact(mode,value,'','');
  else if(request==='volume_from_height'){var volumeExact=piMultiple(Math.round(ratio*ratio*depth*depth*heightRate*4),4);answer={answer:volumeExact.input,answerTex:volumeExact.tex,value:null};}
  else{
    var numerator=volumeCoefficient*tankHeight*tankHeight,denominator=tankRadius*tankRadius*depth*depth;
    if(request==='radius_from_volume'){numerator*=tankRadius;denominator*=tankHeight;}
    var fraction=rational(numerator,denominator);answer={answer:fraction.input,answerTex:fraction.tex,value:null};
  }
  var rateText=request==='volume_from_height'?(mode==='calculator'?trim(heightRate,3):rational(Math.round(heightRate*2),2).tex):mode==='calculator'?trim(volumeRate,3):volumeCoefficient+'\\pi';
  var prompt='An inverted conical tank is '+trim(tankHeight,1)+' feet high with top radius '+trim(tankRadius,1)+' feet. When the water is '+trim(depth,1)+' feet deep, ';
  if(request==='volume_from_height')prompt+='the water level changes at \\('+rateText+'\\) '+unitPhrase(Math.abs(heightRate),'foot','feet')+' per minute. Find \\(\\frac{dV}{dt}\\).';
  else prompt+='the water volume changes at \\('+rateText+'\\) cubic feet per minute. Find '+(request==='radius_from_volume'?'\\(\\frac{dr}{dt}\\) for the water-surface radius.':'\\(\\frac{dh}{dt}\\).');
  var steps=[
    'Let \\(h\\) be the water depth and \\(r\\) the water-surface radius. Similar cones give \\(\\frac rh=\\frac{'+trim(tankRadius,1)+'}{'+trim(tankHeight,1)+'}\\), so \\(r='+trim(ratio,6)+'h\\).',
    'Substitute into \\(V=\\frac13\\pi r^2h\\): \\(V=\\frac13\\pi('+trim(ratio,6)+')^2h^3\\).',
    'Differentiate with respect to time: \\(\\frac{dV}{dt}=\\pi('+trim(ratio,6)+')^2h^2\\frac{dh}{dt}\\).',
    'At the moment described, substitute \\(h='+trim(depth,1)+'\\) and the given signed rate.'
  ];
  if(request==='height_from_volume')steps.push('Solve for the depth rate: \\(\\frac{dh}{dt}='+trim(heightRate,8)+'\\) feet per minute.');
  else if(request==='radius_from_volume')steps.push('First find \\(\\frac{dh}{dt}='+trim(heightRate,8)+'\\). Since \\(r='+trim(ratio,6)+'h\\), \\(\\frac{dr}{dt}='+trim(ratio,6)+'\\frac{dh}{dt}='+trim(radiusRate,8)+'\\) feet per minute.');
  else steps.push('Substitution gives \\(\\frac{dV}{dt}='+trim(volumeRate,8)+'\\) cubic feet per minute.');
  steps.push('The '+(value<0?'negative':'positive')+' sign means the requested quantity is '+(value<0?'decreasing':'increasing')+'.');
  return scalarProblem({slug:'related-rates',mode:mode,source:source,family:'conical_tank_'+request,id:'u3-v128-rr-cone-reverse-'+request+'-'+mode+'-'+trim(depth,1),variant:'related_rates_conical_tank_'+request,diagram:{kind:'conical-tank',title:'Water in an inverted conical tank',description:'The generated fixed tank with changing water depth h and surface radius r.',tankHeight:tankHeight,tankRadius:tankRadius,unit:'ft',depthLabel:'h',waterRadiusLabel:'r'},prompt:prompt,answer:answer.answer,answerTex:answer.answerTex,value:mode==='calculator'?value:null,steps:steps});
}

function rrGallonTank(mode,source){
  var radius=mode==='calculator'?pick([3.4,4.6,5.3]):pick([3,4,5]);
  var gallons=mode==='calculator'?pick([-47.3,68.5,92.4]):pick([-45,60,75]);
  var gallonsPerCubicFoot=mode==='calculator'?7.48052:7.5;
  var volumeRate=gallons/gallonsPerCubicFoot,heightRate=volumeRate/(Math.PI*radius*radius),answer;
  if(mode==='calculator')answer=calcOrExact(mode,heightRate,'','');
  else{var converted=rational(gallons*2,15),exact=overPi(converted.value,radius*radius);answer={answer:exact.input,answerTex:exact.tex,value:null};}
  var conversionText=mode==='calculator'?'7.48052':'\\frac{15}{2}';
  return scalarProblem({slug:'related-rates',mode:mode,source:source,family:'cylindrical_tank_gallon_conversion',id:'u3-v128-rr-gallon-tank-'+mode+'-'+radius+'-'+gallons,variant:'related_rates_cylindrical_tank_gallons',diagram:{kind:'cylinder-tank',title:'Water in a cylindrical tank',description:'A cylindrical tank with generated fixed radius and changing water depth h.',radius:radius,unit:'ft',heightLabel:'h'},prompt:'A vertical cylindrical tank has radius \\('+trim(radius,1)+'\\) feet. Water changes at \\('+trim(gallons,1)+'\\) gallons per minute. Use \\(1\\text{ cubic foot}='+conversionText+'\\text{ gallons}\\). Find \\(\\frac{dh}{dt}\\).',answer:answer.answer,answerTex:answer.answerTex,value:answer.value,steps:[
    'First convert the volume rate: \\(\\frac{dV}{dt}=\\frac{'+trim(gallons,1)+'}{'+conversionText+'}='+trim(volumeRate,8)+'\\) cubic feet per minute.',
    'For a cylinder, \\(V=\\pi r^2h\\), and the radius is constant.',
    'Differentiate with respect to time: \\(\\frac{dV}{dt}=\\pi r^2\\frac{dh}{dt}\\).',
    'Substitute \\(r='+trim(radius,1)+'\\) and the converted volume rate.',
    'Solve: \\(\\frac{dh}{dt}=\\frac{dV/dt}{\\pi('+trim(radius,1)+')^2}='+trim(heightRate,8)+'\\) feet per minute.',
    'The '+(heightRate<0?'negative':'positive')+' sign means the water level is '+(heightRate<0?'falling':'rising')+'.'
  ]});
}

function rrSemicirclePoint(mode,source){
  var x,y,radius,dx;
  if(mode==='calculator'){radius=pick([8.7,11.4,14.2]);x=pick([3.6,5.2,7.1]);y=Math.sqrt(radius*radius-x*x);dx=pick([-2.3,-1.4,1.7,2.6]);}
  else{var triple=pick([[3,4,5],[5,12,13],[8,15,17]]);x=triple[0];y=triple[1];radius=triple[2];dx=pick([-2,-1,1,2]);}
  var dy=-x*dx/y,areaRate=(x*dy+y*dx)/2,answer;
  if(mode==='calculator')answer=calcOrExact(mode,areaRate,'','');
  else{var exact=rational(dx*(y*y-x*x),2*y);answer={answer:exact.input,answerTex:exact.tex,value:null};}
  return scalarProblem({slug:'related-rates',mode:mode,source:source,family:'semicircle_moving_point_area',id:'u3-v128-rr-semicircle-area-'+mode+'-'+trim(radius,1)+'-'+trim(x,1),variant:'related_rates_semicircle_moving_point_triangle_area',diagram:{kind:'semicircle-point',title:'Moving point on a semicircle',description:'A point with changing coordinates x and y on a semicircle with generated fixed radius.',radius:radius,pointX:x,pointY:y,unit:'',xLabel:'x',yLabel:'y'},prompt:'A point \\((x,y)\\) moves on the upper semicircle \\(x^2+y^2='+trim(radius*radius,3)+'\\). At the moment \\(x='+trim(x,1)+'\\), the point moves horizontally with \\(\\frac{dx}{dt}='+trim(dx,1)+'\\). Find the rate of change of the area of the right triangle formed by the point and the coordinate axes.',answer:answer.answer,answerTex:answer.answerTex,value:answer.value,steps:[
    'At the moment described, \\(y=\\sqrt{'+trim(radius*radius,3)+'-'+trim(x*x,3)+'}='+trim(y,8)+'\\).',
    'Differentiate \\(x^2+y^2='+trim(radius*radius,3)+'\\): \\(2x\\frac{dx}{dt}+2y\\frac{dy}{dt}=0\\).',
    'Solve for the vertical rate: \\(\\frac{dy}{dt}=-\\frac{x(dx/dt)}y='+trim(dy,8)+'\\).',
    'The triangle area is \\(A=\\frac12xy\\), so \\(\\frac{dA}{dt}=\\frac12\\left(x\\frac{dy}{dt}+y\\frac{dx}{dt}\\right)\\).',
    'Substituting the known values gives \\(\\frac{dA}{dt}='+trim(areaRate,8)+'\\).',
    'The '+(areaRate<0?'negative':'positive')+' sign means the triangle area is '+(areaRate<0?'decreasing':'increasing')+'.'
  ]});
}

function rrMultiPart(mode,source){
  var multiKey='related-rates-multipart:'+mode,multiHistory=recentTemplates[multiKey]||(recentTemplates[multiKey]=[]),multiChoices=['ladder','cone','shadow'].filter(function(name){return multiHistory.indexOf(name)<0;});
  if(!multiChoices.length)multiChoices=['ladder','cone','shadow'].filter(function(name){return name!==multiHistory[multiHistory.length-1];});
  var kind=pick(multiChoices);remember(recentTemplates,multiKey,kind,2);
  if(kind==='ladder'){
    var data=ladderData(mode),x=data.x,y=data.y,L=data.length,dx=data.dx,dy=-x*dx/y,area=(x*dy+y*dx)/2,angle=-dx/y;
    var fields=mode==='calculator'
      ?[{label:'',labelText:'Rate of change of the ladder top’s height:',numericAnswer:dy,answerTex:dy.toFixed(3),placeholder:'Part 1: top height rate'},{label:'',labelText:'Rate of change of the triangular area:',numericAnswer:area,answerTex:area.toFixed(3),placeholder:'Part 2: area rate'},{label:'',labelText:'Rate of change of the angle with the ground:',numericAnswer:angle,answerTex:angle.toFixed(3),placeholder:'Part 3: angle rate'}]
      :[{label:'',labelText:'Rate of change of the ladder top’s height:',answer:rational(-x*dx,y).input,answerTex:rational(-x*dx,y).tex,placeholder:'Part 1: top height rate'},{label:'',labelText:'Rate of change of the triangular area:',answer:rational(dx*(y*y-x*x),2*y).input,answerTex:rational(dx*(y*y-x*x),2*y).tex,placeholder:'Part 2: area rate'},{label:'',labelText:'Rate of change of the angle with the ground:',answer:rational(-dx,y).input,answerTex:rational(-dx,y).tex,placeholder:'Part 3: angle rate'}];
    return multiFieldProblem({slug:'related-rates',mode:mode,source:source,family:'multi_part_ladder',id:'u3-v128-rr-multi-ladder-'+mode+'-'+L+'-'+x,variant:'related_rates_multi_part_ladder',diagram:{kind:'ladder',title:'Sliding ladder',description:'A fixed-length ladder against a wall with changing horizontal distance x, vertical height y, and ground angle theta.',length:L,unit:'ft',xLabel:'x',yLabel:'y',angle:'ground'},prompt:'A \\('+trim(L,2)+'\\)-foot ladder has its foot \\('+trim(x,2)+'\\) feet from a wall and moving away at \\('+trim(dx,2)+'\\) feet per second. At this moment, find (1) how fast the top’s height is changing, (2) how fast the triangular area is changing, and (3) how fast the angle between the ladder and the ground is changing.',fields:fields,steps:[
      'The fixed-length equation is \\(x^2+y^2='+trim(L*L,4)+'\\), so \\(y='+trim(y,8)+'\\) at this instant.',
      'Differentiate: \\(2x\\frac{dx}{dt}+2y\\frac{dy}{dt}=0\\). This gives \\(\\frac{dy}{dt}='+trim(dy,8)+'\\).',
      'For \\(A=\\frac12xy\\), \\(\\frac{dA}{dt}=\\frac12\\left(x\\frac{dy}{dt}+y\\frac{dx}{dt}\\right)='+trim(area,8)+'\\).',
      'For \\(\\cos\\theta=\\frac{x}{L}\\), \\(\\frac{d\\theta}{dt}=-\\frac{dx/dt}{y}='+trim(angle,8)+'\\).',
      'All three values use the same ladder dimensions and the same stated instant.'
    ]});
  }
  if(kind==='shadow'){
    var pole=mode==='calculator'?17.3:15,person=mode==='calculator'?5.7:6,walk=mode==='calculator'?3.4:3,shadow=person*walk/(pole-person),tip=walk+shadow;
    var shadowFields=mode==='calculator'?[{label:'',labelText:'Rate of change of the shadow length:',numericAnswer:shadow,answerTex:shadow.toFixed(3),placeholder:'Part 1: shadow-length rate'},{label:'',labelText:'Rate of change of the distance from the pole to the shadow tip:',numericAnswer:tip,answerTex:tip.toFixed(3),placeholder:'Part 2: shadow-tip rate'}]:[{label:'',labelText:'Rate of change of the shadow length:',answer:rational(person*walk,pole-person).input,answerTex:rational(person*walk,pole-person).tex,placeholder:'Part 1: shadow-length rate'},{label:'',labelText:'Rate of change of the distance from the pole to the shadow tip:',answer:rational(pole*walk,pole-person).input,answerTex:rational(pole*walk,pole-person).tex,placeholder:'Part 2: shadow-tip rate'}];
    return multiFieldProblem({slug:'related-rates',mode:mode,source:source,family:'multi_part_shadow',id:'u3-v128-rr-multi-shadow-'+mode+'-'+pole,variant:'related_rates_multi_part_shadow',diagram:{kind:'shadow',title:'Person and lamppost shadow',description:'A generated lamppost and person with fixed heights and changing distances x and s.',poleHeight:pole,personHeight:person,unit:'ft',personDistanceLabel:'x',shadowLabel:'s',totalLabel:'x + s'},prompt:'A \\('+trim(person,1)+'\\)-foot person walks away from a \\('+trim(pole,1)+'\\)-foot lamppost at \\('+trim(walk,1)+'\\) feet per second. Using this one situation, find (1) the shadow-length rate and (2) the shadow-tip rate.',fields:shadowFields,steps:[
      'Let \\(x\\) be the person’s distance from the pole and \\(s\\) the shadow length. Similar triangles give \\(\\frac{'+trim(pole,1)+'}{x+s}=\\frac{'+trim(person,1)+'}{s}\\).',
      'Simplify and differentiate: \\('+trim(pole-person,1)+'\\frac{ds}{dt}='+trim(person,1)+'\\frac{dx}{dt}\\).',
      'Substitute \\(\\frac{dx}{dt}='+trim(walk,1)+'\\) to get \\(\\frac{ds}{dt}='+trim(shadow,8)+'\\).',
      'The tip is \\(x+s\\) feet from the pole, so its rate is \\(\\frac{dx}{dt}+\\frac{ds}{dt}='+trim(tip,8)+'\\).'
    ]});
  }
  var tankHeight=mode==='calculator'?14.6:12,tankRadius=mode==='calculator'?6.3:6,depth=mode==='calculator'?4.7:4,volumeRate=mode==='calculator'?-3.35:-3*Math.PI,ratio=tankRadius/tankHeight,dh=volumeRate/(Math.PI*ratio*ratio*depth*depth),dr=ratio*dh;
  var coneFields=mode==='calculator'?[{label:'',labelText:'Rate of change of the water height:',numericAnswer:dh,answerTex:dh.toFixed(3),placeholder:'Part 1: water-height rate'},{label:'',labelText:'Rate of change of the water-surface radius:',numericAnswer:dr,answerTex:dr.toFixed(3),placeholder:'Part 2: surface-radius rate'}]:[{label:'',labelText:'Rate of change of the water height:',answer:rational(-3*tankHeight*tankHeight,tankRadius*tankRadius*depth*depth).input,answerTex:rational(-3*tankHeight*tankHeight,tankRadius*tankRadius*depth*depth).tex,placeholder:'Part 1: water-height rate'},{label:'',labelText:'Rate of change of the water-surface radius:',answer:rational(-3*tankHeight,tankRadius*depth*depth).input,answerTex:rational(-3*tankHeight,tankRadius*depth*depth).tex,placeholder:'Part 2: surface-radius rate'}];
  return multiFieldProblem({slug:'related-rates',mode:mode,source:source,family:'multi_part_conical_tank',id:'u3-v128-rr-multi-cone-'+mode+'-'+depth,variant:'related_rates_multi_part_conical_tank',diagram:{kind:'conical-tank',title:'Water in an inverted conical tank',description:'The generated fixed tank with changing water depth h and surface radius r.',tankHeight:tankHeight,tankRadius:tankRadius,unit:'ft',depthLabel:'h',waterRadiusLabel:'r'},prompt:'An inverted conical tank is \\('+trim(tankHeight,1)+'\\) feet high with top radius \\('+trim(tankRadius,1)+'\\) feet. At the same moment, the water depth is \\('+trim(depth,1)+'\\) feet and water leaves at \\('+(mode==='calculator'?trim(Math.abs(volumeRate),2):'3\\pi')+'\\) cubic feet per minute. Find (1) how fast the water height is changing and (2) how fast the water-surface radius is changing.',fields:coneFields,steps:[
    'Similar cones give \\(r='+trim(ratio,8)+'h\\). Substituting into \\(V=\\frac13\\pi r^2h\\) gives a volume equation in terms of \\(h\\).',
    'Differentiate: \\(\\frac{dV}{dt}=\\pi('+trim(ratio,8)+')^2h^2\\frac{dh}{dt}\\).',
    'Use the signed outflow rate and \\(h='+trim(depth,1)+'\\) to obtain \\(\\frac{dh}{dt}='+trim(dh,8)+'\\).',
    'Differentiate \\(r='+trim(ratio,8)+'h\\): \\(\\frac{dr}{dt}='+trim(ratio,8)+'\\frac{dh}{dt}='+trim(dr,8)+'\\).',
    'Both rates are negative because the water level and surface radius are decreasing.'
  ]});
}

function rrIceHemisphere(mode,source){
  var exactConfig=pick([{inner:10,thickness:2,rateN:-1,rateD:4},{inner:8,thickness:3,rateN:-1,rateD:8},{inner:12,thickness:1,rateN:-3,rateD:8}]);
  var inner=mode==='calculator'?pick([8.4,10.2,12.7]):exactConfig.inner;
  var thicknessInches=mode==='calculator'?pick([1.5,2.25,3]):exactConfig.thickness;
  var rateInches=mode==='calculator'?pick([-0.18,-0.27,-0.36]):exactConfig.rateN/exactConfig.rateD;
  var thickness=thicknessInches/12,thicknessRate=rateInches/12;
  var outer=inner+thickness,rate=2*Math.PI*outer*outer*thicknessRate;
  var answer;
  if(mode==='calculator')answer=calcOrExact(mode,rate,'','');
  else{var iceExact=piMultiple(exactConfig.rateN*Math.pow(exactConfig.inner*12+exactConfig.thickness,2),864*exactConfig.rateD);answer={answer:iceExact.input,answerTex:iceExact.tex,value:null};}
  var rateInchesTex=mode==='calculator'?trim(rateInches,2):rational(exactConfig.rateN,exactConfig.rateD).tex;
  var thicknessFeet=mode==='calculator'?trim(thickness,8):rational(exactConfig.thickness,12).tex;
  var rateFeet=mode==='calculator'?trim(thicknessRate,8):rational(exactConfig.rateN,12*exactConfig.rateD).tex;
  var outerFeet=mode==='calculator'?trim(outer,8):rational(exactConfig.inner*12+exactConfig.thickness,12).tex;
  return scalarProblem({
    slug:'related-rates',mode:mode,source:source,family:'hemispherical_ice_layer',id:'u3-v128-rr-ice-'+mode+'-'+trim(inner,1),
    variant:'related_rates_hemispherical_ice_layer',
    diagram:{kind:'ice-hemisphere',title:'Ice coating on a hemispherical roof',description:'A hemispherical roof with generated fixed inner radius and changing ice thickness x.',innerRadius:inner,unit:'ft',thicknessLabel:'x',outerRadiusLabel:trim(inner,1)+' + x'},
    prompt:'A hemispherical roof of radius \\('+trim(inner,1)+'\\) feet is coated uniformly with ice. When the ice is \\('+trim(thicknessInches,2)+'\\) '+unitPhrase(thicknessInches,'inch','inches')+' thick, its thickness changes at \\('+rateInchesTex+'\\) '+unitPhrase(Math.abs(rateInches),'inch','inches')+' per hour. Find the rate of change of the ice volume in cubic feet per hour.',
    answer:answer.answer,answerTex:answer.answerTex,value:answer.value,
    steps:[
      'Convert the measurements before using them: \\('+trim(thicknessInches,2)+'\\text{ in}='+thicknessFeet+'\\text{ ft}\\) and \\('+rateInchesTex+'\\text{ in/hr}='+rateFeet+'\\text{ ft/hr}\\).',
      'Let \\(R\\) be the outer radius. The inner radius is constant, and \\(\\frac{dR}{dt}='+rateFeet+'\\).',
      'The outer radius at this instant is \\(R='+trim(inner,1)+'+'+thicknessFeet+'='+outerFeet+'\\) feet.',
      'Ice volume is \\(V=\\frac23\\pi(R^3-'+trim(inner*inner*inner,4)+')\\).',
      'Differentiate with respect to time: \\(\\frac{dV}{dt}=2\\pi R^2\\frac{dR}{dt}\\).',
      'Substitute the converted values. This gives \\(\\frac{dV}{dt}='+(mode==='noncalculator'?answer.answerTex:trim(rate,8))+'\\) cubic feet per hour.',
      'The negative sign means the ice volume is decreasing.'
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
  descriptor('ladder_bottom','assignment',function(mode,source){return rrLadder(mode,source,'bottom');},'ladder_rates'),
  descriptor('ladder_area','assignment',function(mode,source){return rrLadder(mode,source,'area');},'ladder_rates'),
  descriptor('ladder_angle','assignment',function(mode,source){return rrLadder(mode,source,'angle');},'ladder_rates'),
  descriptor('ladder_wall_angle','assignment',function(mode,source){return rrLadder(mode,source,'wallAngle');},'ladder_rates'),
  descriptor('lamppost_shadow_length','assignment',function(mode,source){return rrShadow(mode,source,false);},'shadow_rates'),
  descriptor('lamppost_shadow_tip','assignment',function(mode,source){return rrShadow(mode,source,true);},'shadow_rates'),
  descriptor('conical_pile','assignment',rrConePile,'cone_rates'),
  descriptor('inverted_conical_tank','assignment',rrConicalTank,'cone_rates'),
  descriptor('conical_tank_height_from_volume','assignment',function(mode,source){return rrConeReverse(mode,source,'height_from_volume');},'cone_rates'),
  descriptor('conical_tank_radius_from_volume','assignment',function(mode,source){return rrConeReverse(mode,source,'radius_from_volume');},'cone_rates'),
  descriptor('conical_tank_volume_from_height','assignment',function(mode,source){return rrConeReverse(mode,source,'volume_from_height');},'cone_rates'),
  descriptor('triangular_trough','assignment',rrTriangularTrough,'trough_rates'),
  descriptor('trapezoidal_trough','assignment',rrTrapezoidTrough,'trough_rates'),
  descriptor('cylindrical_tank_gallon_conversion','assignment',rrGallonTank,'tank_rates'),
  descriptor('equilateral_triangle_area','assignment',function(mode,source){return rrPolygonArea(mode,source,'equilateral');},'polygon_area_rates'),
  descriptor('semicircle_moving_point_area','assignment',rrSemicirclePoint,'dynamic_area_rates'),
  descriptor('balloon_bicycle_distance','assignment',rrBalloonBike,'perpendicular_motion'),
  descriptor('softball_diamond','assignment',rrSoftball,'perpendicular_motion'),
  descriptor('rope_spool_balloon','assignment',rrRopeBalloon,'perpendicular_motion'),
  descriptor('hemispherical_ice_layer','assignment',rrIceHemisphere)
];
var relatedTest=[
  descriptor('test_rotating_spotlight','test',rrSpotlight),
  descriptor('test_conical_pile','test',rrConePile,'cone_rates'),
  descriptor('test_reverse_conical_tank','test',rrConeReverse,'cone_rates'),
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
  var key='related-rates:'+mode,useMulti=random()<0.225,problem=null;
  for(var attempt=0;attempt<8;attempt+=1){if(useMulti)problem=rrMultiPart(mode,selection.source);else{var chosen=diverse(key,selection.pool);problem=chosen.build(mode,selection.source);}if(problem.familyId!==lastGeneratedFamily[key])break;}
  lastGeneratedFamily[key]=problem.familyId;return problem;
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

