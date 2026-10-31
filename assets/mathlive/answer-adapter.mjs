// Restricted, non-evaluating structural parser. No grading, solving or simplification.
const functions = new Set(['sin','cos','tan','sec','csc','cot','asin','acos','atan','acot','asec','acsc','ln','log','exp','sqrt','cbrt','root','abs','f','g','fp','gp']);
const aliases = {arcsin:'asin',arccos:'acos',arctan:'atan',arcsec:'asec',arccsc:'acsc',arccot:'acot'};
const words = ['Infinite Solutions','No Solution','Does not apply','infinity','undefined','None','DNE'];
class InputError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = message => { throw new InputError('unsupported',message); };
const incomplete = message => { throw new InputError('incomplete',message); };
const empty = () => ({type:'empty'});

function lex(source, format) {
  const s = String(source).replace(/[−–—]/g,'-').replace(/[×·⋅]/g,'*').replace(/÷/g,'/');
  if(s.length > 5000) fail('This experimental translator is limited to 5,000 characters.');
  const out=[]; let i=0;
  const push=(kind,value=kind)=>out.push({kind,value});
  while(i<s.length) {
    const ch=s[i];
    if(/\s/.test(ch)){i++;continue;}
    if(ch==='\\' && format==='latex') {
      const command=/^\\([a-zA-Z]+|.)/.exec(s.slice(i));
      if(!command) incomplete('Finish the LaTeX command.');
      const name=command[1];i+=command[0].length;
      if(['left','right','mleft','mright'].includes(name)&&s[i]==='|'){
        push(name.endsWith('left')?'abs-open':'abs-close');i++;continue;
      }
      if(['left','right','mleft','mright','big','Big','bigl','bigr','displaystyle','textstyle','limits','nolimits'].includes(name))continue;
      if([',',';','!',' ', 'quad','qquad'].includes(name))continue;
      if(name==='placeholder') {
        if(s[i]==='{'){let d=1;i++;while(i<s.length&&d){if(s[i]==='{')d++;if(s[i]==='}')d--;i++;}}
        push('empty');continue;
      }
      if(['square','Box','blacksquare'].includes(name)){push('empty');continue;}
      if(['frac','dfrac','tfrac'].includes(name)){push('frac');continue;}
      if(name==='sqrt'){push('radical');continue;}
      if(['operatorname','mathrm','mathit','text','textrm'].includes(name)) {
        if(s[i]!=='{')fail('Unsupported formatted command.');
        const end=s.indexOf('}',i+1);if(end<0)incomplete('Finish the formatted name.');
        const text=s.slice(i+1,end);i=end+1;
        if(functions.has(text)){push('fn',text);continue;}
        if(words.some(w=>w.toLowerCase()===text.toLowerCase())){push('sym',text);continue;}
        if(/^[A-Za-z]$/.test(text)){push('sym',text);continue;}
        fail('Formatted text is supported only for named functions and listed answer words.');
      }
      if(functions.has(name)||aliases[name]){push('fn',aliases[name]||name);continue;}
      if(['pi','theta'].includes(name)){push('sym',name==='theta'?'θ':'pi');continue;}
      if(name==='infty'){push('sym','infinity');continue;}
      if(['cdot','times'].includes(name)){push('*');continue;}
      if(name==='div'){push('/');continue;}
      if(name==='cup'){push('U');continue;}
      if(['le','leq','ge','geq'].includes(name)){push(name.startsWith('l')?'≤':'≥');continue;}
      if(name==='lvert'){push('abs-open');continue;}
      if(name==='rvert'){push('abs-close');continue;}
      if(name==='vert'){push('|');continue;}
      if(['lbrace','rbrace','{','}'].includes(name))fail('Set braces are outside this experiment’s supported answer grammar.');
      fail(`The command \\${name} is not supported by this experiment.`);
    }
    if(ch==='\\')fail('Raw LaTeX is not BatchMath input.');
    const word=words.find(w=>s.slice(i,i+w.length).toLowerCase()===w.toLowerCase());
    if(word){push('sym',word);i+=word.length;continue;}
    if(ch==='□'){push('empty');i++;continue;}
    if(ch==='∞'){push('sym','infinity');i++;continue;}
    if(ch==='π'){push('sym','pi');i++;continue;}
    if(ch==='√'||ch==='∛'){push('fn',ch==='√'?'sqrt':'cbrt');i++;continue;}
    if(ch==='∪'||ch==='U'){push('U');i++;continue;}
    const sub=/^a[₁ₙ](?:₋₁)?/.exec(s.slice(i));
    if(sub){push('sym',sub[0]);i+=sub[0].length;continue;}
    if(/[0-9.]/.test(ch)){
      const n=/^(?:\d+(?:\.\d*)?|\.\d+)/.exec(s.slice(i));
      if(n){push('num',n[0]);i+=n[0].length;continue;}
      if(ch==='.'&&[')',']','}'].includes(s[i+1])){push('empty');i++;continue;}
      incomplete('Finish the decimal number.');
    }
    const name=[...functions,...Object.keys(aliases)].sort((a,b)=>b.length-a.length).find(f=>s.startsWith(f,i));
    if(name){push('fn',aliases[name]||name);i+=name.length;continue;}
    if(s.startsWith('pi',i)){push('sym','pi');i+=2;continue;}
    if(/[a-zA-Zθ]/.test(ch)){push('sym',ch);i++;continue;}
    if('+-*/^_()[]{},;=<>≤≥|'.includes(ch)){push(ch);i++;continue;}
    if(ch==='′'||ch==="'"){push('prime');i++;continue;}
    fail(`The character ${ch} is not supported.`);
  }
  if(out.length>2000)fail('This expression is too large for the experimental translator.');
  return out;
}

export function parseInput(source,format='batchmath') {
  try {
    const tokens=lex(source,format);let at=0,depth=0,plainBar=0;
    const peek=()=>tokens[at]?.kind,take=()=>tokens[at++];
    const match=k=>peek()===k?(take(),true):false;
    const starts=()=>['num','sym','fn','frac','radical','empty','(','[','{','|','abs-open'].includes(peek())&&!(peek()==='|'&&plainBar);
    const isStop=()=>!peek()||[')',']','}',',',';','=','<','>','≤','≥','U','abs-close'].includes(peek())||peek()==='|'&&plainBar;
    function requiredGroup() {
      if(peek()!=='{')incomplete('A structural argument is missing.');
      take();if(match('}'))return empty();
      const node=sequence();if(!match('}'))incomplete('Finish the grouped argument.');
      return node;
    }
    function argument() {
      if(peek()==='{')return requiredGroup();
      if(!peek())return empty();
      if(peek()==='num'){
        // A bare TeX structural argument is one token: \\frac34 means 3 over 4.
        const tok=tokens[at],first=tok.value[0];
        if(!/\d/.test(first))fail('Use braces around decimal structural arguments.');
        if(tok.value.length===1)take();else tok.value=tok.value.slice(1);
        return{type:'num',raw:first};
      }
      if(peek()==='+'||peek()==='-')incomplete('Use a grouped argument for a signed exponent.');
      return primary();
    }
    function exponent() {
      if(isStop())return empty();
      if(peek()==='{')return requiredGroup();
      return format==='latex'?argument():unary();
    }
    function sequence() {
      let node=relation();const items=[node];
      while(peek()===','||peek()===';'){take();items.push(isStop()?empty():relation());}
      return items.length===1?node:{type:'list',items};
    }
    function relation() {
      let node=sum();
      while(['=','<','>','≤','≥','U'].includes(peek())){
        const op=take().kind;node={type:'binary',op,left:node,right:isStop()?empty():sum()};
      }
      return node;
    }
    function sum() {
      let node=product();
      while(peek()==='+'||peek()==='-'){const op=take().kind;node={type:'binary',op,left:node,right:isStop()?empty():product()};}
      return node;
    }
    function product() {
      let node=unary();
      while(peek()==='*'||peek()==='/'||starts()){
        const implicit=starts();const op=implicit?'*':take().kind;
        node={type:'binary',op,implicit,left:node,right:isStop()?empty():unary()};
      }
      return node;
    }
    function unary(allowPower=true) {
      if(peek()==='+'||peek()==='-'){const op=take().kind;return{type:'unary',op,value:isStop()?empty():unary(allowPower)};}
      return power(allowPower);
    }
    function power(allowPower=true) {
      let node=primary();
      if(allowPower&&match('^'))node={type:'binary',op:'^',left:node,right:exponent()};
      return node;
    }
    function primary() {
      if(++depth>60)fail('Too many nested structures.');
      try {
        const tok=take();if(!tok)return empty();
        if(tok.kind==='empty')return empty();
        if(tok.kind==='num')return{type:'num',raw:tok.value};
        if(tok.kind==='sym') {
          let name=tok.value;
          if(match('_')) {
            let sub;
            if(peek()==='{'){sub=requiredGroup();}else {const t=take();if(!t)incomplete('Finish the subscript.');sub=t.kind==='num'?{type:'num',raw:t.value}:{type:'sym',name:t.value};}
            const text=emitBatch(sub);
            if(name!=='a'||!['1','n','n-1'].includes(text))fail('Only a₁, aₙ and aₙ₋₁ subscripts are supported.');
            name={1:'a₁',n:'aₙ','n-1':'aₙ₋₁'}[text];
          }
          if(match('prime')){if(!['f','g'].includes(name))fail('Only f′ and g′ are supported.');name+='p';}
          return{type:'sym',name};
        }
        if(tok.kind==='frac')return{type:'fraction',numerator:argument(),denominator:argument()};
        if(tok.kind==='radical') {
          let index=null;
          if(match('[')){index=peek()===']'?empty():sequence();if(!match(']'))incomplete('Finish the root index.');}
          return{type:'call',name:index?'root':'sqrt',args:index?[index,argument()]:[argument()]};
        }
        if(tok.kind==='fn') {
          const name=tok.value;let exp=null;
          if(match('_'))fail('Logarithms with a base subscript require an adapter outside this experiment.');
          if(match('^'))exp=exponent();
          let arg;
          if(peek()==='{')arg=requiredGroup();
          else if(peek()==='('){const g=primary();arg=g.value;}
          else if(starts()) {
            arg=unary();
            // Match this checker's conventional bare function argument:
            // cos 3x absorbs 3x; sin x cos x stops before the next function.
            while(starts()&&!['fn','radical','abs-open','|'].includes(peek()))arg={type:'binary',op:'*',implicit:true,left:arg,right:unary()};
          }
          else arg=empty();
          const args=arg.type==='list'?arg.items:[arg];
          let call={type:'call',name,args};
          if(exp) {
            if(exp.type==='unary'&&exp.op==='-'&&exp.value.type==='num'&&exp.value.raw==='1'&&['sin','cos','tan','sec','csc','cot'].includes(name))call={type:'call',name:'a'+name,args};
            else call={type:'binary',op:'^',left:call,right:exp};
          }
          return call;
        }
        if(['(','[','{'].includes(tok.kind)) {
          const open=tok.kind,want={'(':')','[':']','{':'}'}[open];
          if(match(want))return{type:'group',open,close:want,value:empty()};
          const value=sequence();let close=want,closed=true;
          if(peek()===want)take();
          else if(['(', '['].includes(open)&&[')',']'].includes(peek())&&value.type==='list'){close=take().kind;}
          else {closed=false;close='';}
          return{type:'group',open,close,value,closed};
        }
        if(tok.kind==='|'||tok.kind==='abs-open') {
          const plain=tok.kind==='|';if(plain)plainBar++;
          const value=isStop()?empty():sequence();if(plain)plainBar--;
          if(!match(plain?'|':'abs-close'))incomplete('Close the absolute value.');
          return{type:'call',name:'abs',args:[value]};
        }
        fail(`Unexpected ${tok.value}.`);
      } finally {depth--;}
    }
    const tree=tokens.length?sequence():empty();
    if(at!==tokens.length)fail(`Unexpected ${tokens[at].value}; check grouping.`);
    const missing=hasIncomplete(tree);
    return{status:missing?'incomplete':'complete',tree,message:missing?'Complete the empty slots or unfinished groups before checking.':''};
  } catch(e) {return{status:e.status||'unsupported',message:e.message};}
}

export function hasIncomplete(node) {
  if(!node||node.type==='empty'||node.closed===false)return true;
  return Object.values(node).some(v=>Array.isArray(v)?v.some(x=>typeof x==='object'&&hasIncomplete(x)):v&&typeof v==='object'&&hasIncomplete(v));
}
const precedence=n=>n.type==='binary'?({'=':1,'<':1,'>':1,'≤':1,'≥':1,U:1,'+':2,'-':2,'*':3,'/':3,'^':5}[n.op]):n.type==='fraction'?3:n.type==='unary'?4:9;
function emitBatch(node,parent=0) {
  let text='';const p=precedence(node);
  switch(node.type) {
    case 'num':text=node.raw;break;
    case 'sym':text=node.name;break;
    case 'empty':text='';break;
    case 'group':text=node.open==='{'?(precedence(node.value)<9?`(${emitBatch(node.value)})`:emitBatch(node.value)):node.open+emitBatch(node.value)+(node.close||'');break;
    case 'list':text=node.items.map(n=>emitBatch(n)).join(',');break;
    case 'fraction':text=`(${emitBatch(node.numerator)})/(${emitBatch(node.denominator)})`;break;
    case 'call':text=`${node.name}(${node.args.map(n=>emitBatch(n)).join(',')})`;break;
    case 'unary':text=node.op+emitBatch(node.value,p);break;
    case 'binary':
      if(node.op==='^')text=emitBatch(node.left,6)+'^'+(node.right.type==='num'?node.right.raw:`(${emitBatch(node.right)})`);
      else {
        const implicit=node.implicit&&node.right.type!=='num';
        const op=implicit?'':node.op;
        text=emitBatch(node.left,p)+op+emitBatch(node.right,p+(['-','/'].includes(node.op)?1:0));
      }
      break;
    default:fail('Unsupported structure.');
  }
  return p<parent?`(${text})`:text;
}

function literal(node) {
  if(node.type==='group'&&node.open==='('&&node.close===')')return literal(node.value);
  if(node.type==='num')return node.raw;
  if(node.type==='unary')return node.op+literal(node.value);
  if(node.type==='fraction')return literal(node.numerator)+'/'+literal(node.denominator);
  if(node.type==='binary'&&node.op==='/')return literal(node.left)+'/'+literal(node.right);
  if(node.type==='sym'&&words.some(w=>w.toLowerCase()===node.name.toLowerCase()))return node.name;
  fail('This answer field accepts literal numbers/fractions or its listed special outcomes, not general expressions.');
}

export function translateLatex(source,mode='expression') {
  const parsed=parseInput(source,'latex');
  if(parsed.status!=='complete')return{...parsed,input:null};
  try {
    const input=mode==='literal'?literal(parsed.tree):emitBatch(parsed.tree);
    // The interval parser deliberately retains the original bracket types. No completion or simplification.
    return{...parsed,input};
  } catch(e){return{status:e.status||'unsupported',message:e.message,input:null,tree:parsed.tree};}
}

export function toLatex(n) {
  switch(n.type) {
    case 'empty':return '\\placeholder{}';
    case 'num':return n.raw;
    case 'sym':return({pi:'\\pi',infinity:'\\infty','θ':'\\theta','a₁':'a_{1}','aₙ':'a_{n}','aₙ₋₁':'a_{n-1}'})[n.name]||(/^[A-Za-z]$/.test(n.name)?n.name:`\\text{${n.name}}`);
    case 'list':return n.items.map(toLatex).join(',');
    case 'group':return n.open==='{'?`{${toLatex(n.value)}}`:`\\left${n.open}${toLatex(n.value)}\\right${n.close||'.'}`;
    case 'fraction':return`\\frac{${toLatex(n.numerator)}}{${toLatex(n.denominator)}}`;
    case 'unary':return n.op+toLatex(n.value);
    case 'binary':{
      if(n.op==='^')return`{${toLatex(n.left)}}^{${toLatex(unwrap(n.right))}}`;
      if(n.op==='/')return`\\frac{${toLatex(unwrap(n.left))}}{${toLatex(unwrap(n.right))}}`;
      const op=n.op==='*'?(n.implicit?' ':'\\cdot '):n.op==='U'?'\\cup ':n.op;
      return toLatex(n.left)+op+toLatex(n.right);
    }
    case 'call':{
      if(n.name==='root')return`\\sqrt[${toLatex(n.args[0]||empty())}]{${toLatex(n.args[1]||empty())}}`;
      if(n.name==='sqrt'||n.name==='cbrt')return`\\sqrt${n.name==='cbrt'?'[3]':''}{${toLatex(n.args[0]||empty())}}`;
      if(n.name==='abs')return`\\left|${toLatex(n.args[0])}\\right|`;
      const name={asin:'arcsin',acos:'arccos',atan:'arctan',acot:'arccot',asec:'arcsec',acsc:'arccsc'}[n.name]||n.name;
      return`\\${name}\\left(${n.args.map(toLatex).join(',')}\\right)`;
    }
    default:fail('Unsupported preview structure.');
  }
}

// In the current editor, these parentheses are the invisible fraction/exponent shell.
// TeX braces supply that shell; removing this one layer changes no mathematical operation.
function unwrap(n){return n.type==='group'&&n.open==='('&&n.close===')'?n.value:n;}

export function batchmathToLatex(source) {
  const parsed=parseInput(source,'batchmath');
  return{...parsed,latex:parsed.tree?toLatex(parsed.tree):null};
}

// Power Rule's existing grammar has no root() identifier. Lower nth-root
// notation to the same fractional-power notation used by its generators.
// This is structural translation only: retain the index, arithmetic and slots.
export function translatePowerRule(source) {
  // The existing normalizer intentionally checks only the text after the last
  // equals sign (e.g. f'(x)=...). Preserve that policy without parsing/solving
  // the label on the left. Retain '=' so an empty RHS stays nonempty invalid.
  const raw=String(source),equalAt=raw.lastIndexOf('=');
  const parsed=parseInput(equalAt<0?raw:raw.slice(equalAt+1),'latex');
  if(!String(source).trim())return {...parsed,input:''};
  if(!parsed.tree)return {...parsed,input:null};
  const allowed=new Set(['sin','cos','tan','sec','csc','cot','sqrt','ln','log','abs','exp']);
  function lower(n) {
    if(n.type==='sym'&&!['x','y','e','pi'].includes(n.name))fail(`The Power Rule checker does not support ${n.name}.`);
    if(n.type==='list'||n.type==='binary'&&!['+','-','*','/','^'].includes(n.op))fail('This answer requires an expression.');
    if(n.type==='call') {
      const args=n.args.map(lower);
      if(n.name==='root'||n.name==='cbrt') {
        const index=n.name==='cbrt'?{type:'num',raw:'3'}:args[0];
        return {type:'binary',op:'^',left:{type:'group',open:'(',close:')',value:args[n.name==='cbrt'?0:1]},right:{type:'fraction',numerator:{type:'num',raw:'1'},denominator:index}};
      }
      if(!allowed.has(n.name)||args.length!==1)fail(`The Power Rule checker does not support ${n.name}.`);
      return {...n,args};
    }
    const result={...n};
    for(const k of ['left','right','value','numerator','denominator'])if(n[k]&&typeof n[k]==='object')result[k]=lower(n[k]);
    return result;
  }
  try{return {...parsed,input:(equalAt<0?'':'=')+emitBatch(lower(parsed.tree))};}
  catch(e){return {status:'unsupported',message:e.message,input:null};}
}
