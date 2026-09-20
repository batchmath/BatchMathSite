#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const context={window:{},console};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'assets/ap-topic-generators.js'),'utf8'),context);
const gen=context.window.BatchMathAPTopicGenerators.get('derivatives-conceptual-review');
const families=new Map(),errors=[];
function random(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function readAnswer(tex){
  const v=tex.replace(/^\\\(|\\\)$/g,'');
  if(/^-?\d+$/.test(v))return Number(v);
  const m=v.match(/^(-?)\\frac\{(\d+)\}\{(\d+)\}$/);
  return m?(m[1]?-1:1)*Number(m[2])/Number(m[3]):NaN;
}
for(let seed=1;seed<=12000;seed++){
  context.window.BatchMathRNG={random:random(seed*7919)};
  try{
    const p=gen();families.set(p.variant,(families.get(p.variant)||0)+1);
    if(!p.variant.startsWith('table_'))continue;
    const rows={};
    for(const tr of p.questionHtml.matchAll(/<tr>(.*?)<\/tr>/g)){
      const values=[...tr[1].matchAll(/<td[^>]*>\\\((-?\d+)\\\)<\/td>/g)].map(m=>Number(m[1]));
      if(values.length===5)rows[values[0]]={f:values[1],g:values[2],fp:values[3],gp:values[4]};
    }
    const x=Number(p.questionHtml.match(/h'\((\d+)\)=\?/ )?.[1]);
    const a=rows[x];
    if(!a)throw Error('missing evaluation point');
    const mono=p.questionHtml.match(/([+-])(\d*)x(?:\^(\d+))?,\\quad h'/);
    const extra=mono?(mono[1]==='-'?-1:1)*Number(mono[2]||1)*Number(mono[3]||1)*x**(Number(mono[3]||1)-1):0;
    let expected;
    switch(p.variant){
      case 'table_product':expected=a.fp*a.g+a.f*a.gp;break;
      case 'table_quotient':expected=(a.fp*a.g-a.f*a.gp)/(a.g*a.g);break;
      case 'table_scaled_quotient':expected=2*(a.fp*a.g-a.f*a.gp)/(3*a.g*a.g);break;
      case 'table_comp':expected=rows[a.g]?.fp*a.gp;break;
      case 'table_scaled_chain':expected=3*rows[3*x]?.fp;break;
      case 'table_nested_scaled':{
        const k=Number(p.questionHtml.match(/h\(x\)=f\(g\((\d+)x\)\)/)?.[1]);
        const middle=rows[k*x];expected=k*rows[middle?.g]?.fp*middle?.gp;break;
      }
      case 'table_reverse_nested':{
        const middle=rows[2*x];expected=2*rows[middle?.f]?.gp*middle?.fp;break;
      }
      case 'table_square_chain':expected=2*x*rows[x*x]?.fp;break;
      case 'table_scaled_quotient_chain':{
        const c=rows[5*x];expected=(5*c?.fp*a.g-c?.f*a.gp)/(a.g*a.g);break;
      }
      case 'table_scaled_product':{
        const c=rows[3*x];expected=3*c?.fp*a.g+c?.f*a.gp;break;
      }
      case 'table_scaled_plus_monomial':{
        const k=Number(p.questionHtml.match(/h\(x\)=f\((\d+)x\)/)?.[1]);
        expected=k*rows[k*x]?.fp+extra;break;
      }
      case 'table_comp_plus_monomial':{
        const c=rows[2*x];expected=2*rows[c?.f]?.gp*c?.fp+extra;break;
      }
      case 'table_quotient_plus_monomial':{
        const k=Number(p.questionHtml.match(/h\(x\)=\\frac\{f\((\d+)x\)\}/)?.[1]);
        const c=rows[k*x];expected=(k*c?.fp*a.g-c?.f*a.gp)/(a.g*a.g)+extra;break;
      }
      case 'table_two_scaled_product':{
        const m=p.questionHtml.match(/h\(x\)=f\((\d+)x\)g\((\d+)x\)/),k=Number(m?.[1]),l=Number(m?.[2]);
        const c=rows[k*x],d=rows[l*x];expected=k*c?.fp*d?.g+l*c?.f*d?.gp;break;
      }
      case 'table_two_scaled_quotient':{
        const m=p.questionHtml.match(/h\(x\)=\\frac\{f\((\d+)x\)\}\{g\((\d+)x\)\}/),k=Number(m?.[1]),l=Number(m?.[2]);
        const c=rows[k*x],d=rows[l*x];expected=(k*c?.fp*d?.g-l*c?.f*d?.gp)/(d?.g*d?.g);break;
      }
      case 'table_nested_square':{
        const c=rows[x*x];expected=2*x*rows[c?.g]?.fp*c?.gp;break;
      }
      default:throw Error('unexpected chart family');
    }
    const actual=readAnswer(p.choices[p.correctIndex]);
    if(!Number.isFinite(expected)||Math.abs(actual-expected)>1e-10||p.choices.length!==4||new Set(p.choices).size!==4||!p.explanation?.includes('\\('))throw Error(`chart/answer mismatch ${p.variant}: actual ${actual}, expected ${expected}`);
    if(p.choices.some(c=>/\d+\.\d{3,}/.test(c)))throw Error('long decimal choice');
  }catch(e){errors.push(`seed ${seed}: ${e.message}`);if(errors.length>10)break;}
}
const basic=['table_product','table_quotient','table_scaled_quotient','table_comp'];
const advanced=['table_scaled_chain','table_nested_scaled','table_reverse_nested','table_square_chain','table_scaled_quotient_chain','table_scaled_product','table_scaled_plus_monomial','table_comp_plus_monomial','table_quotient_plus_monomial','table_two_scaled_product','table_two_scaled_quotient','table_nested_square'];
for(const name of [...basic,...advanced])if(!families.has(name))errors.push(`missing ${name}`);
const charts=[...basic,...advanced].reduce((n,v)=>n+(families.get(v)||0),0);
const simple=basic.reduce((n,v)=>n+(families.get(v)||0),0);
const chartRate=charts/12000,simpleChartRate=simple/charts;
if(Math.abs(chartRate-.75)>.02)errors.push(`chart rate ${chartRate} outside 75% tolerance`);
if(Math.abs(simpleChartRate-.20)>.02)errors.push(`basic chart share ${simpleChartRate} outside 20% tolerance`);
console.log(JSON.stringify({status:errors.length?'FAIL':'PASS',generated:[...families.values()].reduce((a,b)=>a+b,0),chartRate,simpleChartRate,families:Object.fromEntries(families),errors},null,2));
if(errors.length)process.exitCode=1;
