import{answerShape}from'./answer-shape.mjs';
function features(q){
 const parts=q.parts||[q.stage1,q.stage2].filter(Boolean);
 const sources=parts.length?parts.map(p=>p.answerTex||''):q.fields?.map(f=>f.answerTex||String(f.acceptedExpressions?.[0]??f.answer??f.numericAnswer??''))||[q.answerTex||String(q.expressionAnswer??q.numericAnswer??'')];
 return new Set(sources.flatMap((s,i)=>answerShape(s).split(',').filter(Boolean).map(t=>i+':'+t)));
}
// Numeric parameter changes do not create new keypad requirements. Cover each
// observed control feature within each generator-family/field-contract group,
// retaining actual questions as witnesses, rather than every combination of
// already-covered signs, coefficients, variables and functions.
export function coverageWitnesses(candidates,passed,route){
 const groups=new Map();for(const c of candidates){const list=groups.get(c.baseKey)||[];list.push({...c,features:features(c.q)});groups.set(c.baseKey,list);}
 const selected=[],proof=[];
 for(const[key,list]of groups){
  const required=new Set(list.flatMap(c=>[...c.features])),remaining=new Set(required),witnesses=[];
  while(remaining.size||!witnesses.length){
   const options=list.filter(c=>!witnesses.includes(c));if(!options.length)throw Error('No coverage witness: '+key);
   const score=c=>[...c.features].filter(f=>remaining.has(f)).length;
   options.sort((a,b)=>score(b)-score(a)||Number(passed.has(route+'|'+b.q.id))-Number(passed.has(route+'|'+a.q.id)));
   const already=options.filter(c=>passed.has(route+'|'+c.q.id)&&score(c)>0);
   const best=already.length?already[0]:options[0];witnesses.push(best);for(const f of best.features)remaining.delete(f);
  }
  selected.push(...witnesses);proof.push({familyFieldContract:key,requiredFeatures:[...required].sort(),coveredFeatures:[...new Set(witnesses.flatMap(c=>[...c.features]))].sort(),witnessQuestionIds:witnesses.map(c=>c.q.id),uncoveredFeatures:[...remaining]});
 }
 return{selected,proof,sourceAnswerFormGroups:candidates.length,familyFieldGroups:groups.size,selectedWitnesses:selected.length};
}
