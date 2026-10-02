(function(){
  "use strict";

  const FUNCTIONS=new Set(["sin","cos","tan","sec","csc","cot","asin","acos","atan","acot","asec","acsc","ln","log","exp","sqrt","abs","f","g","fp","gp"]);
  const FUNCTION_NAMES=[...FUNCTIONS].sort((a,b)=>b.length-a.length);
  const CONSTANTS=new Set(["pi","e"]);

  function normalize(raw){
    return String(raw??"")
      .trim()
      .toLowerCase()
      .replace(/[−–—]/g,"-")
      .replace(/π/g,"pi")
      .replace(/√/g,"sqrt")
      .replace(/[×·⋅∙]/g,"*")
      .replace(/÷/g,"/")
      .replace(/\*\*/g,"^")
      .replace(/²/g,"^2")
      .replace(/³/g,"^3")
      .replace(/[\[\{]/g,"(")
      .replace(/[\]\}]/g,")")
      .replace(/f\s*[′']/g,"fp")
      .replace(/g\s*[′']/g,"gp")
      .replace(/\s+/g,"");
  }

  function tokenize(raw){
    const s=normalize(raw),tokens=[];
    let i=0;
    while(i<s.length){
      const ch=s[i];
      if(/[0-9.]/.test(ch)){
        let j=i+1;
        while(j<s.length&&/[0-9.]/.test(s[j]))j++;
        const literal=s.slice(i,j);
        if(literal==="."||(literal.match(/\./g)||[]).length>1)throw Error("number");
        tokens.push({type:"num",value:Number(literal)});i=j;continue;
      }
      if("+-*/^(),".includes(ch)){tokens.push({type:ch,value:ch});i++;continue;}
      if(/[a-z]/.test(ch)){
        const functionName=FUNCTION_NAMES.find(name=>s.startsWith(name,i));
        if(functionName){tokens.push({type:"func",value:functionName});i+=functionName.length;continue;}
        let j=i+1;
        while(j<s.length&&/[a-z]/.test(s[j]))j++;
        const name=s.slice(i,j);
        if(FUNCTIONS.has(name))tokens.push({type:"func",value:name});
        else if(CONSTANTS.has(name))tokens.push({type:"const",value:name});
        else if(name==="x"||name==="y")tokens.push({type:"var",value:name});
        else throw Error("identifier");
        i=j;continue;
      }
      throw Error("character");
    }
    const out=[];
    const ends=t=>t&&(t.type==="num"||t.type==="const"||t.type==="var"||t.type===")");
    const starts=t=>t&&(t.type==="num"||t.type==="const"||t.type==="var"||t.type==="func"||t.type==="(");
    for(const token of tokens){
      const previous=out[out.length-1];
      if(ends(previous)&&starts(token))out.push({type:"*",value:"*",implicit:true});
      out.push(token);
    }
    return out;
  }

  function parse(raw){
    const tokens=tokenize(raw);let index=0;
    const peek=()=>tokens[index],take=()=>tokens[index++];

    function expression(){
      let node=product();
      while(peek()&&(peek().type==="+"||peek().type==="-")){
        const op=take().type;
        node={kind:"op",op,left:node,right:product()};
      }
      return node;
    }
    function product(){
      let node=unary();
      while(peek()&&(peek().type==="*"||peek().type==="/")){
        const op=take().type;
        node={kind:"op",op,left:node,right:unary()};
      }
      return node;
    }
    function unary(){
      if(peek()&&(peek().type==="+"||peek().type==="-")){
        const op=take().type;
        return {kind:"unary",op,value:unary()};
      }
      return power();
    }
    function power(){
      let node=primary();
      if(peek()&&peek().type==="^"){
        take();
        node={kind:"op",op:"^",left:node,right:unary()};
      }
      return node;
    }
    function primary(){
      const token=take();
      if(!token)throw Error("end");
      if(token.type==="num")return {kind:"number",value:token.value};
      if(token.type==="const")return {kind:"constant",name:token.value};
      if(token.type==="var")return {kind:"variable",name:token.value};
      if(token.type==="("){
        const node=expression();
        if(!peek()||take().type!==")")throw Error("parenthesis");
        return node;
      }
      if(token.type==="func"){
        let argument;
        if(peek()?.type==="("){
          take();argument=expression();
          if(!peek()||take().type!==")")throw Error("function parenthesis");
        }else{
          if(!peek())throw Error("function");
          argument=unary();
          while(peek()?.type==="*"&&peek().implicit){take();argument={kind:"op",op:"*",left:argument,right:unary()};}
        }
        return {kind:"function",name:token.value,argument};
      }
      throw Error("primary");
    }

    const tree=expression();
    if(index!==tokens.length)throw Error("extra input");
    return tree;
  }

  function evaluate(tree,context={}){
    if(tree.kind==="number")return tree.value;
    if(tree.kind==="constant")return tree.name==="pi"?Math.PI:Math.E;
    if(tree.kind==="variable"){
      const value=context[tree.name];
      if(!Number.isFinite(value))throw Error("variable");
      return value;
    }
    if(tree.kind==="unary"){
      const value=evaluate(tree.value,context);
      return tree.op==="-"?-value:value;
    }
    if(tree.kind==="op"){
      const left=evaluate(tree.left,context),right=evaluate(tree.right,context);
      if(tree.op==="+")return left+right;
      if(tree.op==="-")return left-right;
      if(tree.op==="*")return left*right;
      if(tree.op==="/")return left/right;
      if(tree.op==="^")return Math.pow(left,right);
    }
    if(tree.kind==="function"){
      const value=evaluate(tree.argument,context),custom=context[tree.name];
      if(typeof custom==="function")return custom(value);
      if(tree.name==="sin")return Math.sin(value);
      if(tree.name==="cos")return Math.cos(value);
      if(tree.name==="tan")return Math.tan(value);
      if(tree.name==="sec")return 1/Math.cos(value);
      if(tree.name==="csc")return 1/Math.sin(value);
      if(tree.name==="cot")return 1/Math.tan(value);
      if(tree.name==="asin")return Math.asin(value);
      if(tree.name==="acos")return Math.acos(value);
      if(tree.name==="atan")return Math.atan(value);
      if(tree.name==="acot")return Math.atan(1/value);
      if(tree.name==="asec")return Math.acos(1/value);
      if(tree.name==="acsc")return Math.asin(1/value);
      if(tree.name==="ln")return Math.log(value);
      if(tree.name==="log")return Math.log10(value);
      if(tree.name==="exp")return Math.exp(value);
      if(tree.name==="sqrt")return Math.sqrt(value);
      if(tree.name==="abs")return Math.abs(value);
      throw Error("function");
    }
    throw Error("node");
  }

  function close(a,b,tolerance=1e-7){
    if(!Number.isFinite(a)||!Number.isFinite(b))return false;
    return Math.abs(a-b)<=tolerance*Math.max(1,Math.abs(a),Math.abs(b));
  }

  function equivalent(student,expected,contexts=[{}],tolerance=1e-7){
    let left,right;
    try{left=parse(student);right=parse(expected);}catch(_){return false;}
    let valid=0;
    for(const context of contexts){
      try{
        const a=evaluate(left,context),b=evaluate(right,context);
        if(!Number.isFinite(a)||!Number.isFinite(b))continue;
        valid++;
        if(!close(a,b,tolerance))return false;
      }catch(_){continue;}
    }
    return valid>=Math.min(3,contexts.length);
  }

  window.BatchMathDerivativeExpressions=Object.freeze({normalize,parse,evaluate,equivalent});
})();
