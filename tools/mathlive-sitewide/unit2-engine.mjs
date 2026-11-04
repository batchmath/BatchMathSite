import fs from 'node:fs';import vm from 'node:vm';import {fileURLToPath} from 'node:url';
import {rng} from '../mathlive-power-rule/engine.mjs';export {rng};
export const root=fileURLToPath(new URL('../../',import.meta.url));
export const routes=JSON.parse(fs.readFileSync(root+'tools/mathlive-sitewide/unit2-routes.json'));
export function kind(html){return html.includes('topic-derivative-at-point-practice.js')?'topic-point':html.includes('nested-chain-rule-practice.js')?'nested':html.includes('/derivative-at-point-practice.js')?'point':'inline';}
export function instrument(code,type){const expose=`globalThis.siteQA={check,makeProblem:${type==='inline'?'makeProblem':type==='nested'?'newProblem':'next'},get current(){return current},set current(p){current=p}};`;
 return type==='inline'?code.replace('function boot(){makeProblem()}',expose+'function boot(){makeProblem()}'):code.replace(/\}\)\(\);\s*$/,expose+'})();');}
export const external={'topic-point':'topic-derivative-at-point-practice','nested':'nested-chain-rule-practice',point:'derivative-at-point-practice'};
export function engine(route){const html=fs.readFileSync(root+route.path,'utf8'),type=kind(html),els={};
 const el=id=>els[id]??={value:'',innerHTML:'',textContent:'',hidden:true,style:{},selectedOptions:[{textContent:'test'}],addEventListener(){},focus(){},setAttribute(){}};
 for(const match of html.matchAll(/<select[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)){const opts=[...match[2].matchAll(/<option([^>]*)value="([^"]+)"([^>]*)>/g)];el(match[1]).value=(opts.find(m=>(m[1]+m[3]).includes('selected'))||opts[0])?.[2]||'mixed';}
 const b={console,Math,URLSearchParams,location:{search:'?bm_qa=1'},document:{getElementById:el,addEventListener(){},querySelectorAll(){return[]}},addEventListener(){},BatchMathRNG:{random:rng(1)}};b.window=b;vm.createContext(b);
 for(const n of ['answer-normalization','derivative-rule-factors','derivative-expression-checker'])vm.runInContext(fs.readFileSync(root+'assets/'+n+'.js','utf8'),b);
 let code;
 if(type==='inline')code=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(m=>!m[1].includes('src=')&&m[2].includes('function product()'))[2];
 else {if(type==='topic-point')b.BM_TOPIC_AT_POINT_CONFIG={stage:html.match(/stage:\s*["']([^"']+)/)[1]};code=fs.readFileSync(root+'assets/'+external[type]+'.js','utf8');el('practice-type').value='mixed';}
 vm.runInContext(instrument(code,type),b);if(!b.siteQA)throw Error('Instrumentation failed: '+route.path);return {b,qa:b.siteQA,el,html,type};}
export function modes(e){if(e.type==='topic-point')return e.b.BatchMathTopicAtPointQA.stages[e.b.BM_TOPIC_AT_POINT_CONFIG.stage].options.map(x=>({'practice-type':x[0]}));
 if(e.type==='nested')return ['mixed',...e.b.BatchMathNestedChainQA.groups].map(x=>({'practice-type':x}));
 if(e.type==='point')return ['mixed',...Object.keys(e.b.BatchMathAtPointQA.generators),'composite'].map(x=>({'practice-type':x}));
 const fields=['ruleMode','practice-scope'].filter(id=>e.html.includes('id="'+id+'"'));let out=[{}];for(const id of fields){const part=e.html.match(new RegExp('<select[^>]*id="'+id+'"[^>]*>([\\s\\S]*?)<\\/select>'))[1],values=[...part.matchAll(/<option[^>]*value="([^"]+)"/g)].map(x=>x[1]);out=out.flatMap(p=>values.map(v=>({...p,[id]:v})));}return out;}
export function signature(p){
 if(p.factorKinds)return p.cat+':'+p.factorKinds.join('/');if(p.family)return p.group+':'+p.family;
 if(p.group)return p.group+':'+p.id.replace(/-?\d.*$/,'');
 const a=p.id.split('-');let family=a[0];
 if(a[0]==='imp')family=p.id.replace(/-[-\d].*$/,'');
 if(a[0]==='ld')family=a[1]==='var'?`ld-var-${a[2]}-${p.id.match(/-e[1-7]-/)?.[0].slice(1,-1)}`:a.slice(0,3).join('-');
 if(a[0]==='lg'||a[0]==='tnc'||a[0]==='eadv'||a[0]==='vadv'||a[0]==='iv'&&['exp','log'].includes(a[1]))family=a.slice(0,a[0]==='lg'&&a[1]==='base'?3:2).join('-');
 if(a[0]==='tcj'&&['cube','poly'].includes(a[1]))family=a.slice(0,3).join('-');
 return p.cat+':'+family;
}
export function samples(route,count=120){const e=engine(route),reps=new Map();for(const mode of modes(e)){for(const[k,v]of Object.entries(mode))e.el(k).value=v;for(let i=1;i<=count;i++){e.b.BatchMathRNG.random=rng(i*719+JSON.stringify(mode).length);e.qa.makeProblem();const p=JSON.parse(JSON.stringify(e.qa.current)),sig=JSON.stringify(mode)+':'+signature(p);if(!reps.has(sig))reps.set(sig,p);}}return {e,reps};}
