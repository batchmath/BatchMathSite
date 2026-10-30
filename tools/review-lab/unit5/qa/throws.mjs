// node throws.mjs <engine global> <file> [N] — call each family directly per tier and count self-check throws and nulls
import {load} from './lib.mjs';
const [glob,file,N0]=process.argv.slice(2);const N=+N0||400;const L=load(file.split(','));const E=L.W[glob];
for(const [name,f] of Object.entries(E.FAMILIES))for(const t of f.tiers){const msgs={};let ok=0,nul=0;
 for(let i=1;i<=N;i++){L.seed(i*104729+t.length);try{const p=f.make(t);if(p)ok++;else nul++;}catch(e){const k=e.message.replace(/-?\d+(\.\d+)?/g,'#').slice(0,70);msgs[k]=(msgs[k]||0)+1;}}
 const th=Object.values(msgs).reduce((a,b)=>a+b,0);console.log(`${name}/${t}: ok ${ok} null ${nul} throw ${th}`,th?JSON.stringify(msgs):'');}
