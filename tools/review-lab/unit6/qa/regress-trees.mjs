// v13.0.B: seed-by-seed comparison of two site trees for every Unit 6 engine (Cross Sections and Solids with their Practice
// Types) and the Unit 6 Comprehensive Review. Usage: node tools/review-lab/unit6/qa/regress-trees.mjs <old tree> <new tree> [seeds per family, tier, kind, type=40]
const [oldRoot,newRoot,N0]=process.argv.slice(2),N=+(N0||40);
const libs=await Promise.all([oldRoot,newRoot].map(r=>import(`${r}/tools/review-lab/unit6/qa/lib.mjs`)));
const files=['unit6-regions.js','unit6-area.js','unit6-volume.js','unit6-frq.js','unit6-piecewise.js','unit6-review.js'];
const Ls=libs.map(l=>{const L=l.load(files);L.ctx.console={...console,warn(){}};return L;});
const ENG=[['area','BatchMathUnit6Area','make','FAMILIES',[undefined]],['area_y','BatchMathUnit6Area','makeY','FAMILIES_Y',[undefined]],['cs','BatchMathUnit6Volume','makeCS','FAMILIES_CS',[undefined,'perp_x','perp_y']],['solids','BatchMathUnit6Volume','makeSolid','FAMILIES_SOLID',[undefined,'disks_washers','shells']],['frq','BatchMathUnit6FRQ','make','FAMILIES',[undefined]],['piecewise','BatchMathUnit6Piecewise','make','FAMILIES',[undefined]]];
const kt=f=>f.calc||(f.calculator?{calculator:f.tiers,noncalculator:[]}:{calculator:[],noncalculator:f.tiers});
const ser=v=>JSON.stringify(v,(k,x)=>typeof x==='function'?`fn:${x.length}`:x);
const out={problems:0,identical:0,differ:0,errorsBoth:0,byEngine:{},diffs:[],descriptors:{withDescriptor:0,enumerable:0}};
for(const [name,obj,mk,FK,modes] of ENG){const fams=Ls[1].W[obj]?.[FK];if(!fams){out.byEngine[name]='missing';continue;}
 for(const [fam,f] of Object.entries(fams))for(const kind of ['calculator','non-calculator'])for(const tier of kt(f)[kind==='calculator'?'calculator':'noncalculator'])for(const mode of modes){const MO=Ls[1].W[obj][FK.replace('FAMILIES','MODES')];if(mode&&MO&&MO[mode]&&!MO[mode].families[fam])continue;for(let i=0;i<N;i++){
  const seed=i*7919+fam.length*131+tier.length*17+kind.length+(mode?mode.length*7:0)+11,ps=Ls.map(L=>{L.seed(seed);try{return L.W[obj][mk]({family:fam,tier,calc:kind,mode});}catch(e){return {err:String(e)};}});
  out.problems++;const b=out.byEngine[name]=out.byEngine[name]||{n:0,identical:0};b.n++;
  const [a,c]=ps;if(c.u6Solid){out.descriptors.withDescriptor++;if(Object.keys(c).includes('u6Solid'))out.descriptors.enumerable++;}
  const sa=ser(a),sc=ser(c);
  if(a.err&&c.err){out.errorsBoth++;const k=`${name}/${fam}/${kind}/${mode||"all"}: ${c.err.slice(0,80)}`;out.errorKinds=out.errorKinds||{};out.errorKinds[k]=(out.errorKinds[k]||0)+1;}
  if(sa===sc){out.identical++;b.identical++;}else{out.differ++;if(out.diffs.length<10){let k=0;while(sa[k]===sc[k])k++;out.diffs.push({name,fam,tier,kind,mode,seed,at:sa.slice(Math.max(0,k-80),k+80),now:sc.slice(Math.max(0,k-80),k+80)});}}
 }}}
// the Unit 6 Comprehensive Review, which serves problems of these engines (both calculator kinds)
for(const calc of ['non-calculator','calculator'])for(let i=0;i<N*10;i++){const seed=i*104729+calc.length;
 const ps=Ls.map(L=>{L.seed(seed);try{return L.W.BatchMathUnit6Review.make({calc});}catch(e){return {err:String(e)};}});
 out.problems++;const b=out.byEngine.review=out.byEngine.review||{n:0,identical:0};b.n++;
 if(ser(ps[0])===ser(ps[1])){out.identical++;b.identical++;}else{out.differ++;if(out.diffs.length<10)out.diffs.push({name:'review',calc,seed});}}
console.log(JSON.stringify(out,null,1));
if(out.differ)process.exitCode=1;
