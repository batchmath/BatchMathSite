#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'qa-results');fs.mkdirSync(OUT,{recursive:true});
const errors=[],warnings=[],coverage={},checks={generated:0,numeric:0,structural:0};
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
const src=fs.readFileSync(path.join(ROOT,'assets/ap-topic-generators.js'),'utf8');
const sb={window:{BatchMathRNG:{random:rng(1)}},console};vm.createContext(sb);vm.runInContext(src,sb);
function get(slug){return sb.window.BatchMathAPTopicGenerators.get(slug)}
function gen(slug,seed,opts={}){const f=get(slug);if(typeof f!=='function')throw Error(`missing generator ${slug}`);sb.window.BatchMathRNG={random:rng(seed)};checks.generated++;return f(opts)}
function answer(p){if(p.answerType==='numeric'||p.answerType==='two-stage')return p.numericAnswer;return p.choices?.[p.correctIndex]}
function norm(x){return String(x??'').replace(/\s+/g,'').replace(/\\dfrac/g,'\\frac')}
function near(a,b,tol=1e-8){return Number.isFinite(+a)&&Math.abs(+a-b)<=tol*Math.max(1,Math.abs(b))}

function gcd(a,b){a=Math.abs(Math.trunc(a));b=Math.abs(Math.trunc(b));while(b){const t=a%b;a=b;b=t}return a||1}
function texR(n,d=1){if(d<0){n=-n;d=-d}const g=gcd(n,d);n/=g;d/=g;return d===1?String(n):`\\frac{${n}}{${d}}`}
function need(cond,msg){checks.structural++;if(!cond)errors.push(msg)}
const cases=[
 ['equations-of-tangent-and-normal-lines',{},['quadratic_tangent','cubic_normal','radical_tangent','reciprocal_normal','sine_tangent','cosine_normal','exponential_tangent','log_tangent']],
 ['motion',{},['position_velocity','position_speed','position_acceleration','velocity_speed','velocity_acceleration','trig_position_velocity','exponential_position_velocity','rest_time_numeric','velocity_at_position','projectile_maximum_altitude']],
 ['absolute-and-local-extrema-and-the-extreme-value-theorem',{},['absolute_cubic','absolute_quartic','absolute_rational','absolute_radical','absolute_trig_combination','absolute_exponential_product','local_cubic','local_quartic_max','local_quartic_min','local_exponential_product','local_logarithm','local_trig','local_rational']],
 ['increasing-decreasing-intervals-concavity-and-extrema',{},['f_given_increasing','f_given_decreasing','f_given_rational_increasing','f_given_log_increasing','f_given_trig_increasing','f_given_exponential_increasing','first_derivative_given_increasing','first_derivative_given_concavity','second_derivative_given_concavity','f_given_concavity_hard','f_given_rational_concavity','first_derivative_given_local_extrema','factored_first_derivative']],
 ['linearization-and-differentials',{},['linearization_square_root','linearization_cube_root','linearization_logarithm','linearization_sine','linearization_tangent','differential_polynomial','differential_trig_composition','differential_implicit','differential_sphere','differential_equilateral_triangle','differential_trig_degrees']],
 ['rolle-s-theorem-and-the-mean-value-theorem',{mvtMode:'theorem'},['rolle_quadratic','rolle_sine','rolle_cosine','mvt_hypothesis_rational','mvt_hypothesis_corner']],
 ['rolle-s-theorem-and-the-mean-value-theorem',{mvtMode:'find-c'},['mvt_quadratic','mvt_cubic_symmetric','mvt_reciprocal','mvt_square_root','mvt_logarithm','mvt_exponential']],
 ['l-hopital-s-rule',{},['simple_exponential','simple_radical','two_application_exponential','three_application_trig','cosine_ratio','nested_log_trig','logarithm_over_power','power_over_exponential','exponential_cosine_remainders','cosine_exponential_remainders','radical_difference_quotient','inverse_trig_limit','shifted_exponential_trig']],
 ['rectangular-approximations',{},['left_function','right_function','midpoint_function','left_quadratic','right_table','left_table','midpoint_table']],
 ['trapezoidal-approximations',{},['equal_table','unequal_table','function_evaluation']],
 ['introduction-to-sigma-notation',{},['sigma_polynomial']],
 ['evaluating-definite-integrals-with-a-limit-and-summation',{},['integral_to_sum']],
 ['integrals-using-geometry',{},['triangle_area','signed_triangle','upper_semicircle','lower_semicircle_signed_area','quarter_circle_area','shifted_semicircle','complementary_semicircle','absolute_value_geometry','rectangle_plus_semicircle','cross_axis_linear']],
 ['fundamental-theorem-of-calculus-and-integral-rules',{ftcMode:'ftc'},['ftc_linear_upper','ftc_quadratic_upper','ftc_variable_lower','ftc_two_variable_bounds','ftc_trig_upper','ftc_exponential_upper','ftc_trig_lower','ftc_two_nonlinear_bounds']],
 ['fundamental-theorem-of-calculus-and-integral-rules',{ftcMode:'rules'},['reverse_bounds','split_interval','combine_functions','constant_multiple','solve_missing_interval','sum_difference']],
 ['basic-integrals',{},['polynomial','negative_power','fractional_power','divide_each_term','trig_identity','basic_trig','definite_polynomial']],
 ['u-substitution-integrals',{},['linear_inner_power','trig_linear','secant_tangent','cosecant_cotangent','exponential_of_trig','linear_denominator','radical_linear','power_composition','power_times_root','fourth_root']],
 ['mean-value-theorem-for-integrals',{},['average_polynomial','average_trig','average_radical','average_exponential','find_c']],
 ['basic-first-order-differential-equations',{},['initial_value_polynomial','initial_value_trig','initial_value_exponential','initial_value_secant','initial_value_composition','initial_value_log']],
 ['motion-problems',{},['velocity_from_acceleration','speed_from_acceleration','total_distance','speed_increasing','direction_from_velocity']],
 ['separable-differential-equations',{},['general_solution','initial_value_solution','validity_interval','contextual_separable','contextual_separable_cooling']],
 ['rate-problems',{},['calculator_traffic','calculator_tank','calculator_ballots','calculator_delayed_outflow','calculator_attendance']],
 ['area-below-and-between-curves',{areaMode:'noncalc'},['shifted_scaled_parabola_axis','parameterized_line_parabola','shifted_two_parabolas','translated_cubic_total_area','trig_between_horizontal','trig_between_horizontal_sine','absolute_value_cap','radical_semicircle_area']],
 ['area-below-and-between-curves',{areaMode:'calc'},['calculator_non_elementary_axis','calculator_between_exp_log','calculator_between_radical_trig','calculator_between_oscillatory_decay','calculator_between_mixed_functions']],
 ['finding-area-in-terms-of-y',{},['horizontal_scaled_parabola','horizontal_line_parabola','horizontal_two_sideways','horizontal_triangle','horizontal_cubic_width','translated_horizontal_parabola']],
 ['integrals-on-piecewise-defined-functions',{},['piecewise_two_linear','piecewise_three_polynomial','piecewise_four_formula','piecewise_trig_stable','piecewise_log_linear','piecewise_constant_quadratic']],
 ['volume-by-cross-sections',{},['squares_parameterized_parabola','rectangles_scaled_height','semicircles_polynomial_arch','equilateral_parabola_sections','isosceles_right_leg_sections','horizontal_square_sections','quarter_circle_radius_sections']],
 ['solids-of-revolution',{solidMethod:'disk',solidCalcMode:'noncalc'},['disk_power_family','disk_radical_family','washer_constant_and_power','washer_shifted_axis_parameterized','washer_radical_power']],
 ['solids-of-revolution',{solidMethod:'shell',solidCalcMode:'noncalc'},['shell_power_y_axis','shell_line_parabola','shell_shifted_vertical_axis','horizontal_shell_sideways','horizontal_shell_shifted_axis']],
 ['solids-of-revolution',{solidMethod:'disk',solidCalcMode:'calc'},['calculator_disk_fresnel','calculator_two_curve_revolution','calculator_shifted_horizontal_axis','calculator_log_disk']],
 ['solids-of-revolution',{solidMethod:'shell',solidCalcMode:'calc'},['calculator_shell_gaussian','calculator_shell_shifted_axis','calculator_horizontal_shell_non_elementary','calculator_shell_logarithmic']]
];
for(const [slug,opts,required] of cases){const seen=new Set();for(let i=1;i<=3000;i++){const p=gen(slug,(i*2654435761+slug.length)>>>0,opts);seen.add(p.variant)}const key=slug+':'+JSON.stringify(opts);coverage[key]=[...seen].sort();for(const v of required)need(seen.has(v),`${key}: missing required family ${v}`)}

// Retired engines: lesson/resource pages remain, practice generators and practice directories must not.
const retired=[
 ['limit-proof','ap-calculus/unit-1-limits-continuity/topics/delta-epsilon-proofs/practice'],
 ['optimization','ap-calculus/unit-3-applications-derivative/topics/optimization/practice'],
 ['related-rates','ap-calculus/unit-3-applications-derivative/topics/related-rates/practice'],
 ['graphing-functions','ap-calculus/unit-3-applications-derivative/topics/graphing-functions/practice'],
 ['converting-a-rectangular-approximation-into-exact-area','ap-calculus/unit-4-integrals/topics/converting-a-rectangular-approximation-into-exact-area/practice'],
 ['slope-fields','ap-calculus/unit-5-differential-equations/topics/slope-fields/practice'],
 ['exponential-growth-and-decay-interest-newton-s-law-of-cooling','ap-calculus/unit-5-differential-equations/topics/exponential-growth-and-decay-interest-newton-s-law-of-cooling/practice']
];
for(const [slug,rel] of retired){if(slug!=='limit-proof')need(typeof get(slug)!=='function',`retired generator still exported: ${slug}`);need(!fs.existsSync(path.join(ROOT,rel)),`retired practice directory still exists: ${rel}`)}

// Exact known-answer checks for the rebuilt fixed families.
const exactById=new Map([
 ['rect-left-x2','14'],['rect-right-lin','24'],['rect-mid-q','21'],['rect-table-left','17'],['rect-table-right','21'],
 ['trap-x2','22'],['trap-lin','20'],['trap-table-eq','19'],['trap-table-uneq','22'],
 ['area-two-p','64/3'],['area-sign-cubic','8'],['area-trig-exact','2'],['areay-line-par','4/3'],['areay-two','64/3'],['areay-tri','9'],
 ['piece-3','32/3'],['piece-4','19/6'],['piece-trig','\\pi'],['piece-rec','1+e+\\frac12'],
 ['cross-sq-semi','72'],['cross-rect-par','\\frac{1024}{5}'],['cross-ellipse','24'],['cross-eq-tri','\\frac{\\sqrt3}{12}'],['cross-dy-sq','2'],['cross-semi-assn','\\frac{2\\pi}{15}'],['cross-quarter-assn','2\\pi'],
 ['solid-shell-y','8\\pi'],['solid-shell-x3','\\frac{20\\pi}{3}'],['solid-shell-horizontal','8\\pi'],['solid-disk','36\\pi'],['solid-washer','\\frac{128\\pi}{5}'],['solid-shift-h','\\frac{28\\pi}{3}'],['solid-curves','\\frac{3\\pi}{10}'],
 ['av-tan','\\frac{2\\ln 2}{\\pi}']
]);
const exactSlugs=['rectangular-approximations','trapezoidal-approximations','mean-value-theorem-for-integrals','area-below-and-between-curves','finding-area-in-terms-of-y','integrals-on-piecewise-defined-functions','volume-by-cross-sections','solids-of-revolution'];
for(const slug of exactSlugs){for(let i=1;i<=6000;i++){let opts={};if(slug==='area-below-and-between-curves')opts={areaMode:'noncalc'};if(slug==='solids-of-revolution')opts={solidMethod:i%2?'disk':'shell',solidCalcMode:'noncalc'};const p=gen(slug,(0x9e3779b9+i*7919+slug.length)>>>0,opts);if(exactById.has(p.id)){checks.numeric++;need(norm(answer(p))===norm(exactById.get(p.id)),`${p.id}: ${answer(p)} != ${exactById.get(p.id)}`)}}}


// Independent checks for the newest parameterized exact-answer families.
const paramExactSlugs=['rectangular-approximations','trapezoidal-approximations','area-below-and-between-curves','finding-area-in-terms-of-y','integrals-on-piecewise-defined-functions'];
for(const slug of paramExactSlugs){
 for(let i=1;i<=12000;i++){
  const opts=slug==='area-below-and-between-curves'?{areaMode:'noncalc'}:{};
  const p=gen(slug,(0x51f15e5+i*12289+slug.length)>>>0,opts);let m,expected=null;
  if((m=p.id.match(/^rect-var-(-?\d+)-(-?\d+)-(-?\d+)-(-?\d+)-(-?\d+)-(left|right|midpoint)$/))){
    const [D,A,B,C,a]=m.slice(1,6).map(Number),method=m[6],f=x=>D*x**3+A*x*x+B*x+C;let total=0;
    for(let j=0;j<4;j++){const x=method==='left'?a+j:method==='right'?a+j+1:a+j+.5;total+=f(x)}
    expected=method==='midpoint'?texR(Math.round(total*8),8):texR(Math.round(total),1);
  } else if((m=p.id.match(/^trap-var-(-?\d+)-(-?\d+)-(-?\d+)-(-?\d+)$/))){
    const [A,B,C,a]=m.slice(1).map(Number),f=x=>A*x*x+B*x+C,ys=[0,1,2,3,4].map(j=>f(a+j));expected=texR(ys[0]+2*ys[1]+2*ys[2]+2*ys[3]+ys[4],2);
  } else if((m=p.id.match(/^trap-eq-([\d-]+)$/))){const ys=m[1].split('-').map(Number);expected=texR(ys[0]+2*ys[1]+2*ys[2]+2*ys[3]+ys[4],2);
  } else if((m=p.id.match(/^trap-uneq-([\d-]+)$/))){const ys=m[1].split('-').map(Number),xs=[0,1,3,4,7];let twice=0;for(let j=0;j<4;j++)twice+=(xs[j+1]-xs[j])*(ys[j]+ys[j+1]);expected=texR(twice,2);
  } else if((m=p.id.match(/^area-axis-(\d+)$/))){const a=+m[1];expected=texR(4*a**3,3);
  } else if((m=p.id.match(/^area-lp-(\d+)$/))){const a=+m[1];expected=texR(a**3,6);
  } else if((m=p.id.match(/^area-two-p-(\d+)$/))){const r=+m[1];expected=texR(8*r**3,3);
  } else if((m=p.id.match(/^area-sign-cubic-(\d+)$/))){const r=+m[1];expected=texR(r**4,2);
  } else if((m=p.id.match(/^area-trig-exact-(\d+)$/))){expected=String(2*(+m[1]));
  } else if((m=p.id.match(/^areay-par-(\d+)$/))){const h=+m[1];expected=texR(4*h**3,3);
  } else if((m=p.id.match(/^areay-line-par-(\d+)$/))){const k=+m[1];expected=texR(k**3,6);
  } else if((m=p.id.match(/^areay-two-(\d+)$/))){const r=+m[1];expected=texR(8*r**3,3);
  } else if((m=p.id.match(/^areay-tri-(\d+)-(\d+)$/))){const h=+m[1],c=+m[2];expected=texR(c*h*h,2);
  } else if((m=p.id.match(/^piece-3-(\d+)-(\d+)-(\d+)$/))){const [a,b,c]=m.slice(1).map(Number);expected=texR(6*a+8*b+6*c-18,3);
  } else if((m=p.id.match(/^piece-4-(\d+)-(\d+)-(\d+)-(\d+)$/))){const [a,b,c,d]=m.slice(1).map(Number);expected=texR(-9*a+4*b+6*c+3+12*d,6);
  } else if((m=p.id.match(/^piece-trig-(\d+)$/))){expected=`${+m[1]}\\pi`;
  } else if((m=p.id.match(/^piece-rec-(\d+)$/))){expected=`${+m[1]}+e+\\frac12`;}
  if(expected!==null){checks.numeric++;need(norm(answer(p))===norm(expected),`${p.id}: parameterized exact answer ${answer(p)} != ${expected}`)}
 }
}

// Calculator-active independent values.
const calcVariants=[
 ['rate-problems',{},'calculator_traffic'],
 ['rate-problems',{},'calculator_tank'],
 ['rate-problems',{},'calculator_ballots'],
 ['rate-problems',{},'calculator_delayed_outflow'],
 ['rate-problems',{},'calculator_attendance'],
 ['area-below-and-between-curves',{areaMode:'calc'},'calculator_non_elementary_axis'],
 ['area-below-and-between-curves',{areaMode:'calc'},'calculator_between_exp_log'],
 ['area-below-and-between-curves',{areaMode:'calc'},'calculator_between_radical_trig'],
 ['area-below-and-between-curves',{areaMode:'calc'},'calculator_between_oscillatory_decay'],
 ['area-below-and-between-curves',{areaMode:'calc'},'calculator_between_mixed_functions'],
 ['solids-of-revolution',{solidMethod:'disk',solidCalcMode:'calc'},'calculator_disk_fresnel'],
 ['solids-of-revolution',{solidMethod:'disk',solidCalcMode:'calc'},'calculator_two_curve_revolution'],
 ['solids-of-revolution',{solidMethod:'disk',solidCalcMode:'calc'},'calculator_shifted_horizontal_axis'],
 ['solids-of-revolution',{solidMethod:'disk',solidCalcMode:'calc'},'calculator_log_disk'],
 ['solids-of-revolution',{solidMethod:'shell',solidCalcMode:'calc'},'calculator_shell_gaussian'],
 ['solids-of-revolution',{solidMethod:'shell',solidCalcMode:'calc'},'calculator_shell_shifted_axis'],
 ['solids-of-revolution',{solidMethod:'shell',solidCalcMode:'calc'},'calculator_horizontal_shell_non_elementary'],
 ['solids-of-revolution',{solidMethod:'shell',solidCalcMode:'calc'},'calculator_shell_logarithmic']
];
for(const [slug,opts,variant] of calcVariants){
 let found=null;for(let i=1;i<=5000&&!found;i++){const p=gen(slug,(i*104729+variant.length)>>>0,opts);if(p.variant===variant)found=p}
 need(!!found,`${variant}: calculator family not generated`);if(!found)continue;
 need(found.answerType==='numeric',`${found.id}: calculator problem does not use numeric answer checking`);
 need(Number.isFinite(Number(found.numericAnswer)),`${found.id}: calculator answer is not finite`);
 need(Number(found.numericTolerance)>0,`${found.id}: calculator answer tolerance missing`);
}

// Riemann Part 1/Part 2 structural + independent evaluation.
for(let i=1;i<=12000;i++){const p=gen('evaluating-definite-integrals-with-a-limit-and-summation',(1234567+i*8191)>>>0);need(p.answerType==='two-stage',`${p.id}: not two-stage`);need(p.stage1CorrectIndex>=0&&p.stage1CorrectIndex<p.stage1Choices.length,`${p.id}: invalid Part 1 correct index`);need(p.stage1Choices[p.stage1CorrectIndex]===p._correctRep||!p._correctRep,`${p.id}: Part 1 correct representation mismatch`);need(!p.stage1Choices.some(x=>/\\sum_\{i\b/.test(x)),`${p.id}: uses i instead of k`);let m;if((m=p.id.match(/^riemV-mono-(\d+)-(\d+)-(\d+)$/))){const [b,pow,c]=m.slice(1).map(Number),e=c*Math.pow(b,pow+1)/(pow+1);checks.numeric++;need(near(p.numericAnswer,e),`${p.id}: Part 2 ${p.numericAnswer} != ${e}`)}else if((m=p.id.match(/^riemV-lin-(-?\d+)-(\d+)-(\d+)-(-?\d+)$/))){const [a,w,A,C]=m.slice(1).map(Number),b=a+w,e=A*(b*b-a*a)/2+C*(b-a);checks.numeric++;need(near(p.numericAnswer,e),`${p.id}: Part 2 ${p.numericAnswer} != ${e}`)}else if((m=p.id.match(/^riemV-shift-(-?\d+)-(\d+)$/))){const w=+m[2],e=w**3/3;checks.numeric++;need(near(p.numericAnswer,e),`${p.id}: Part 2 ${p.numericAnswer} != ${e}`)}else if((m=p.id.match(/^riem2-l-(-?\d+)-(-?\d+)-(-?\d+)-(-?\d+)$/))){const [A,C,a,b]=m.slice(1).map(Number),e=A*(b*b-a*a)/2+C*(b-a);checks.numeric++;need(near(p.numericAnswer,e),`${p.id}: Part 2 ${p.numericAnswer} != ${e}`)}else if((m=p.id.match(/^riem2-q-(-?\d+)-(-?\d+)-(-?\d+)$/))){const [C,a,b]=m.slice(1).map(Number),e=(b**3-a**3)/3+C*(b-a);checks.numeric++;need(near(p.numericAnswer,e),`${p.id}: Part 2 ${p.numericAnswer} != ${e}`)}}

// Instructional behavior checks from the manual review.
for(let i=1;i<=5000;i++){
 const p=gen('motion',(i*97)>>>0);need(!/\\int|integral/i.test((p.questionHtml||'')+' '+(p.explanation||'')),`${p.id}: Unit 3 Motion requires integration`);
 const av=gen('mean-value-theorem-for-integrals',(i*193)>>>0);if(String(av.variant).startsWith('average_'))need((av.questionHtml||'').includes('Find the average value of the function on the given interval.'),`${av.id}: average-value direction changed`);else if(av.variant==='find_c')need(/Mean Value Theorem for Integrals/.test(av.questionHtml||''),`${av.id}: find-c direction changed`);
 const sep=gen('separable-differential-equations',(i*389)>>>0);need(!/\bIVP\b/.test((sep.questionHtml||'')+' '+(sep.explanation||'')),`${sep.id}: student-facing IVP abbreviation`);
}

const report={ok:errors.length===0,generatedAt:new Date().toISOString(),contracts:cases.length,coverage,checks,warnings,errors};
fs.writeFileSync(path.join(OUT,'assignment-fidelity-qa.json'),JSON.stringify(report,null,2)+'\n');
const lines=['BatchMath v10.6.3.C working assignment-fidelity QA',`Result: ${report.ok?'PASS':'FAIL'}`,`Generator/mode contracts: ${cases.length}`,`Problems generated: ${checks.generated}`,`Independent numeric/exact checks: ${checks.numeric}`,`Structural checks: ${checks.structural}`,`Warnings: ${warnings.length}`,...warnings.map(x=>'- '+x),`Errors: ${errors.length}`,...errors.slice(0,200).map(x=>'- '+x),''];
fs.writeFileSync(path.join(OUT,'assignment-fidelity-qa.txt'),lines.join('\n'));console.log(lines.join('\n'));if(errors.length)process.exit(1);
