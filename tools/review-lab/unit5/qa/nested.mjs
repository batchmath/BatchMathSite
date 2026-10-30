// node nested.mjs <slug> <files> [N] — find answers with a fraction nested inside a fraction
import {load} from './lib.mjs';
const [slug,files,N0]=process.argv.slice(2);const L=load(files.split(',')),gen=L.G.get(slug);const hits={};
const nestedIn=t=>{for(let i=t.indexOf('\\frac{');i>=0;i=t.indexOf('\\frac{',i+1)){let d=0,j=i+5,k=0,args=[];for(;j<t.length&&args.length<2;j++){if(t[j]==='{'){if(d===0)k=j;d++;}else if(t[j]==='}'){d--;if(d===0)args.push(t.slice(k+1,j));}}if(args.some(a=>a.includes('\\frac')))return true;}return false;};
for(let i=1;i<=+(N0||1500);i++){L.seed(i*31);const p=gen({});for(const pt of p.parts){if(pt.answerIsText)continue;if(nestedIn(pt.answerTex)){const k=p.id.split('-')[2];hits[k]=hits[k]||pt.answerTex;}}}
console.log(JSON.stringify(hits,null,1));
