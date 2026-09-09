// Browser regression cases for the shared MC, numeric, two-stage, derivative
// editor and Calculus Prep exact-editor workflows. Never reveal Next artificially.
export const realEnterEngines = new Set([
  'ap_topic_difference_quotient',
  'ap_topic_rectangular_approximations',
  'ap_topic_evaluating_definite_integrals_with_a_limit_and_summation',
  'ap_topic_derivatives_with_the_power_rule',
  'calc_prep_unit_circle_values',
  'calc_prep_trig_equations',
]);
export async function exerciseAnsweredEnter(page) {
  const before=await page.evaluate(()=>window.BatchMathRepro.problemCount);
  const stage1=page.locator('[data-stage1]').first();
  if(await stage1.count())await stage1.click();
  const input=page.locator('#numeric-answer, #stage2-answer, #approx-answer').first();
  const exact=page.locator('#exactEditor');
  const derivative=page.locator('.bm-calc-editor');
  if(await input.count()){
    await input.fill('12345');
    if(await page.locator('.classification-choice').count())await page.locator('.classification-choice').first().click();
    else await input.press('Enter');
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
  // Use focus left by the actual answer handler, including custom editors.
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000); // catches delayed default activation/auto-next
  const after=await page.evaluate(()=>window.BatchMathRepro.problemCount);
  if(after!==before+1)throw new Error(`answered Enter generated ${after-before} problems instead of 1`);
  await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',repeat:true,bubbles:true,cancelable:true})));
  await page.waitForTimeout(250);
  if(await page.evaluate(()=>window.BatchMathRepro.problemCount)!==after)throw new Error('held Enter generated another problem');
}

export async function exerciseAdvancedHints(page){
  const before=await page.evaluate(()=>window.BatchMathRepro.problemCount);
  await page.locator('#answer').fill('7/9');
  await page.locator('#hint').click();
  if(!await page.locator('#hint-panel').isVisible())throw new Error('hint did not open');
  if(await page.locator('#answer').inputValue()!=='7/9')throw new Error('hint changed the answer');
  if(await page.evaluate(()=>window.BatchMathRepro.problemCount)!==before)throw new Error('hint generated another problem');
  if(await page.locator('#attempted').textContent()!=='0')throw new Error('hint counted as an attempt');
  await page.locator('#hint').click();
  if(await page.locator('#hint-panel').isVisible())throw new Error('hint did not close');
  await page.locator('#answer').fill('');await page.locator('#answer').press('Enter');await page.locator('#answer').press('Enter');
  if(await page.evaluate(()=>window.BatchMathRepro.problemCount)!==before)throw new Error('invalid input Enter advanced');
  await page.locator('#answer').fill('1234567');await page.locator('#answer').press('Enter');
  await page.waitForTimeout(220);
  if(await page.evaluate(()=>window.BatchMathRepro.problemCount)!==before)throw new Error('submission skipped the explanation');
  if(await page.locator('#feedback .method-steps li').count()<2)throw new Error('numbered method missing');
  await page.keyboard.press('Enter');await page.waitForTimeout(220);
  if(await page.evaluate(()=>window.BatchMathRepro.problemCount)!==before+1)throw new Error('advanced trig Enter did not generate exactly once');
  if(await page.locator('#hint-panel').isVisible())throw new Error('hint not reset');
}
