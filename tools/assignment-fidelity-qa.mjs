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
 ['rectangular-approximations',{},["function_left", "function_right", "function_midpoint", "table_left", "table_right", "table_midpoint"]],
 ['trapezoidal-approximations',{},["table_equal", "table_unequal", "function_equal", "table_relationship", "function_relationship"]],
 ['introduction-to-sigma-notation',{},["sigma_numerical", "sigma_identities", "sigma_riemann"]],
 ['evaluating-definite-integrals-with-a-limit-and-summation',{},["linear_construction", "quadratic_monomial", "quadratic_combination", "nonpolynomial_representation"]],
 ['integrals-using-geometry',{},["linear_triangle", "linear_trapezoid", "cross_axis_line", "absolute_value", "semicircle", "quarter_circle", "rectangle_circle"]],
 ['fundamental-theorem-of-calculus-and-integral-rules',{ftcMode:'ftc'},["upper_identity", "lower_identity", "upper_linear", "upper_power", "lower_power", "upper_trig", "both_algebraic", "both_transcendental"]],
 ['fundamental-theorem-of-calculus-and-integral-rules',{ftcMode:'rules'},["reverse_limits", "zero_width", "linearity", "interval_decomposition", "combined_rules", "reversed_combination"]],
 // v12.8.U: rebuilt typed engines (families audited in tools/unit4-final-four-qa.mjs)
 ['basic-integrals',{},['polynomial_power_rule','radicals_negative_powers','expand_first','divide_each_term','divide_each_term_ln','basic_trig_exponential','trig_identity_rewrite','definite_power_root','definite_trig_exponential','power_reduction','exponential_base_a']],
 ['u-substitution-integrals',{},['linear_inner_trig_exp','linear_inner_power_root','polynomial_inner_constant_adjust','shifted_quadratic_power','trig_power_chain','composite_exponential_log','back_substitution','definite_linear_inner','definite_polynomial_trig_inner','definite_back_substitution','odd_trig_powers']],
 ['mean-value-theorem-for-integrals',{},['average_polynomial','average_substitution_trig_exp_log','average_piecewise','find_c_single','find_c_piecewise']],
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

// Constructed Newton answers replace the former MC representation contract.
for(let i=1;i<=12000;i++){
 const p=gen('evaluating-definite-integrals-with-a-limit-and-summation',(1234567+i*8191)>>>0),d=p.unit4Meta;
 need(p.answerType==='staged-calculus'&&p.stage1.unit4Answer.kind==='newton-expression',`${p.id}: missing constructed Newton summand`);
 need(!p.stage1Choices,`${p.id}: construction replaced by recognition`);
 need(Boolean(p.stage2)===(d.coefficients!==null),`${p.id}: incorrect source-supported evaluation stage`);
 if(d.coefficients){const expected=d.coefficients.reduce((sum,c,power)=>sum+c*(d.b**(power+1)-d.a**(power+1))/(power+1),0),r=p.stage2.unit4Answer.value[''];checks.numeric++;need(near(r[0]/r[1],expected),`${p.id}: independent Newton evaluation differs`);}
}

// Instructional behavior checks from the manual review.
for(let i=1;i<=5000;i++){
 const p=gen('motion',(i*97)>>>0);need(!/\\int|integral/i.test((p.questionHtml||'')+' '+(p.explanation||'')),`${p.id}: Unit 3 Motion requires integration`);
 const av=gen('mean-value-theorem-for-integrals',(i*193)>>>0);if(String(av.variant).startsWith('average_'))need((av.questionHtml||'').includes('Find the average value of the function on the given interval.'),`${av.id}: average-value direction changed`);else if(String(av.variant).startsWith('find_c'))need(/Mean Value Theorem for Integrals/.test(av.questionHtml||''),`${av.id}: find-c direction changed`);
 const sep=gen('separable-differential-equations',(i*389)>>>0);need(!/\bIVP\b/.test((sep.questionHtml||'')+' '+(sep.explanation||'')),`${sep.id}: student-facing IVP abbreviation`);
}

const report={ok:errors.length===0,generatedAt:new Date().toISOString(),contracts:cases.length,coverage,checks,warnings,errors};
fs.writeFileSync(path.join(OUT,'assignment-fidelity-qa.json'),JSON.stringify(report,null,2)+'\n');
const lines=['BatchMath v10.6.3.C working assignment-fidelity QA',`Result: ${report.ok?'PASS':'FAIL'}`,`Generator/mode contracts: ${cases.length}`,`Problems generated: ${checks.generated}`,`Independent numeric/exact checks: ${checks.numeric}`,`Structural checks: ${checks.structural}`,`Warnings: ${warnings.length}`,...warnings.map(x=>'- '+x),`Errors: ${errors.length}`,...errors.slice(0,200).map(x=>'- '+x),''];
fs.writeFileSync(path.join(OUT,'assignment-fidelity-qa.txt'),lines.join('\n'));console.log(lines.join('\n'));if(errors.length)process.exit(1);
