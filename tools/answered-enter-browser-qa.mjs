// Browser regression cases for the shared MC, numeric, two-stage, derivative
// editor and Calculus Prep exact-editor workflows. Never reveal Next artificially.
export const realEnterEngines = new Set([
  'ap_topic_difference_quotient',
  'ap_topic_fundamental_theorem_of_calculus',
  'ap_topic_combining_integral_rules',
  'ap_topic_integrals_using_geometry',
  'ap_topic_rectangular_approximations',
  'ap_topic_evaluating_definite_integrals_with_a_limit_and_summation',
  'ap_topic_derivatives_with_the_power_rule',
  'calc_prep_unit_circle_values',
  'calc_prep_trig_equations',
]);
// Wait for opt-in adapters to finish; a still-visible legacy editor can be replaced mid-click.
export async function readyVisibleEditor(page,host=page){
  const migrated=await page.locator('script[src*="/assets/mathlive/"]').count();
  if(migrated&&new URL(page.url()).searchParams.get('editor')!=='legacy'){
    await host.locator('math-field:visible').first().waitFor({state:'visible',timeout:12000});
    return host.locator('math-field:visible').first();
  }
  return null;
}
export async function fillVisibleAnswer(page,legacy,value,host=page){
  const field=await readyVisibleEditor(page,host);
  if(field){
    await field.click();await page.keyboard.press('ControlOrMeta+A');
    if(value)await page.keyboard.type(value);else await page.keyboard.press('Backspace');
    await page.waitForTimeout(80);
    const proof=await field.evaluate(e=>{const input=e.nextElementSibling?.matches('input,textarea')?e.nextElementSibling:e.parentElement.querySelector('[data-editor="mathlive"]');return {latex:e.value,source:input?.value,editor:input?.dataset.editor};});
    if(proof.editor!=='mathlive'||typeof proof.source!=='string'||Boolean(proof.source.trim())!==Boolean(value))throw Error('Visible MathLive answer did not serialize: '+JSON.stringify(proof));
    (page._answerEvidence??=[]).push(proof);return field;
  }
  if(!await legacy.isVisible())throw Error('Legacy answer control is not visible');
  await legacy.fill(value);return legacy;
}
export async function exerciseAnsweredEnter(page) {
  if(await page.locator('#choices.unit4-typed-answer.staged-calculus-answer').count())return exerciseStagedAnsweredEnter(page);
  const before=await page.evaluate(()=>window.BatchMathRepro.problemCount);
  const stage1=page.locator('[data-stage1]').first();
  if(await stage1.count())await stage1.click();
  const input=page.locator('#numeric-answer, #stage2-answer, #approx-answer').first();
  const exact=page.locator('#exactEditor');
  const derivative=page.locator('.bm-calc-editor');
  if(!await page.locator('#choices .choice:visible').count())await readyVisibleEditor(page);
  if(await input.count()){
    const active=await fillVisibleAnswer(page,input,'12345');
    if(await page.locator('.classification-choice').count())await page.locator('.classification-choice').first().click();
    else await active.press('Enter');
  } else if(await page.locator('math-field:visible').count()){
    const active=await fillVisibleAnswer(page,page.locator('#answer'),'12345');await active.press('Enter');
  } else if(await exact.count()){
    await exact.click();await page.keyboard.type('12345');await page.keyboard.press('Enter');
  } else if(await derivative.count()){
    await derivative.click();await page.keyboard.type('12345');await page.keyboard.press('Enter');
  } else {
    const choices=page.locator('#choices .choice');
    if(await choices.count())await choices.first().click();
    else {await page.locator('#answer').fill('12345');await page.locator('#answer').press('Enter');}
  }
  await page.waitForTimeout(250);
  const submitted=await page.evaluate(()=>({count:window.BatchMathRepro.problemCount,feedback:document.querySelector('#feedback')?.textContent.trim()}));
  if(submitted.count!==before)throw new Error('answer submission skipped its feedback and generated another problem');
  if(!submitted.feedback)throw new Error('answer submission did not reveal feedback');
  await page.locator('#next').waitFor({state:'visible',timeout:3000});
  await advanceAnsweredExactlyOnce(page,before);
  return {staged:false,parts:await stage1.count()?2:1};
}

async function advanceAnsweredExactlyOnce(page,before){
  // Hold the physical key across the transition; repeated keydown events must
  // reach the actual focused editor/document, rather than an unrelated window.
  await page.keyboard.down('Enter');
  try{
    await page.waitForFunction(n=>window.BatchMathRepro.problemCount===n+1,before,{timeout:3000});
    await page.keyboard.down('Enter');await page.waitForTimeout(180);
    await page.keyboard.down('Enter');await page.waitForTimeout(180);
  }finally{await page.keyboard.up('Enter');}
  await page.waitForTimeout(650);
  const after=await page.evaluate(()=>window.BatchMathRepro.problemCount);
  if(after!==before+1)throw new Error(`answered/held Enter generated ${after-before} problems instead of 1`);
}
async function exerciseStagedAnsweredEnter(page){
  const before=await page.evaluate(()=>window.BatchMathRepro.problemCount),box=page.locator('#choices'),one=box.locator('.staged-part-one');
  const sameCount=async label=>{if(await page.evaluate(()=>window.BatchMathRepro.problemCount)!==before)throw new Error(label+' silently generated another problem');};
  const submit=async host=>{
    const choices=host.locator('.staged-choice:enabled');
    if(await choices.count())await choices.first().click();
    else{
      await readyVisibleEditor(page,host);
      const field=host.locator('math-field:visible').first();
      const editor=host.locator('.bm-calc-editor');
      if(await field.count()){const active=await fillVisibleAnswer(page,host.locator('.staged-exact-input'),'12345',host);await active.press('Enter');}
      else
      if(await editor.count()){await editor.click();await page.keyboard.type('12345');await page.keyboard.press('Enter');}
      else{const input=host.locator('.staged-exact-input');await input.fill('12345');await input.press('Enter');}
    }
    const feedback=host.locator('.staged-feedback .result');await feedback.waitFor({state:'visible',timeout:3000});
    if(!(await feedback.textContent()).trim())throw new Error('stage submission did not reveal its feedback');
    await sameCount('Stage submission');
  };
  if(await page.locator('#next').isVisible())throw new Error('Next appeared before an answer');
  await submit(one);const advance=one.locator('.staged-continue');let parts=1;
  if(await advance.count()){
    parts=2;
    if(await page.locator('#next').isVisible())throw new Error('Next appeared before Part 2 was answered');
    if(await box.locator('.staged-part-two').count())throw new Error('Part 2 appeared before Continue');
    await page.keyboard.press('Enter');await page.waitForTimeout(100);await sameCount('Premature Enter');
    if(await box.locator('.staged-part-two').count())throw new Error('Wrong Part 1 feedback was skipped by Enter');
    await advance.click();const two=box.locator('.staged-part-two');await two.waitFor({state:'visible'});
    await sameCount('Continue');if(await page.locator('#next').isVisible())throw new Error('Next appeared before the second answer');
    await submit(two);
  }
  await page.locator('#next').waitFor({state:'visible',timeout:3000});await sameCount('Completed feedback');
  if(await box.locator('.staged-feedback .result').count()!==parts)throw new Error('A completed stage lost its feedback');
  await page.waitForFunction(()=>document.activeElement===document.getElementById('next'),null,{timeout:3000});
  await advanceAnsweredExactlyOnce(page,before);
  return {staged:true,parts,feedback:true,nextAfterCompletion:true,heldEnter:true};
}

export async function exerciseAdvancedHints(page){
  const before=await page.evaluate(()=>window.BatchMathRepro.problemCount);
  await fillVisibleAnswer(page,page.locator('#answer'),'7/9');
  const entered=await page.locator('#answer').inputValue();
  if(!entered.trim())throw new Error('visible editor did not serialize the draft answer');
  await page.locator('#hint').click();
  if(!await page.locator('#hint-panel').isVisible())throw new Error('hint did not open');
  if(await page.locator('#answer').inputValue()!==entered)throw new Error('hint changed the answer');
  if(await page.evaluate(()=>window.BatchMathRepro.problemCount)!==before)throw new Error('hint generated another problem');
  if(await page.locator('#attempted').textContent()!=='0')throw new Error('hint counted as an attempt');
  await page.locator('#hint').click();
  if(await page.locator('#hint-panel').isVisible())throw new Error('hint did not close');
  const empty=await fillVisibleAnswer(page,page.locator('#answer'),'');await empty.press('Enter');await empty.press('Enter');
  if(await page.evaluate(()=>window.BatchMathRepro.problemCount)!==before)throw new Error('invalid input Enter advanced');
  const active=await fillVisibleAnswer(page,page.locator('#answer'),'1234567');await active.press('Enter');
  await page.waitForTimeout(220);
  if(await page.evaluate(()=>window.BatchMathRepro.problemCount)!==before)throw new Error('submission skipped the explanation');
  if(await page.locator('#feedback .method-steps li').count()<2)throw new Error('numbered method missing');
  await page.keyboard.press('Enter');await page.waitForTimeout(220);
  if(await page.evaluate(()=>window.BatchMathRepro.problemCount)!==before+1)throw new Error('advanced trig Enter did not generate exactly once');
  if(await page.locator('#hint-panel').isVisible())throw new Error('hint not reset');
}
