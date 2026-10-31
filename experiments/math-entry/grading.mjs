export const checkerNames={expression:'BatchMathDerivativeExpressions.parse / equivalent',unit4:'BatchMathUnit4Answers.check',unit5:'BatchMathUnit5Answers.check',line:'BatchMathLineEquations.check','im1-polynomial':'BatchMathIM1Algebra.check','im1-equation':'BatchMathIM1Equation.check','im1-interval':'BatchMathIM1Interval.check','im1-line':'BatchMathIM1Unit3PracticeQA.lineEquationEquivalent','im1-sequence':'BatchMathIM1Unit3PracticeQA.formulaEquivalent','im1-recursive':'BatchMathIM1Unit3PracticeQA.recursiveFormulaEquivalent',unsupported:'No exported checker selected'};
export function grade(raw,field,api=globalThis) {
  try {
    let result;
    switch(field.checker) {
      case 'expression': {
        const checker=api.BatchMathDerivativeExpressions;
        checker.parse(raw); // Preserve syntax errors as invalid, not wrong.
        result={valid:true,ok:checker.equivalent(raw,field.expected,field.contexts||[{}],1e-7)};break;
      }
      case 'unit4':result=api.BatchMathUnit4Answers.check(raw,field.expected);break;
      case 'unit5':result=api.BatchMathUnit5Answers.check(raw,field.expected);break;
      case 'line':result=api.BatchMathLineEquations.check(raw,field.expected);break;
      case 'im1-polynomial':result=api.BatchMathIM1Algebra.check(raw,field.expected);break;
      case 'im1-equation':result=api.BatchMathIM1Equation.check(raw,field.expected);break;
      case 'im1-interval':result=api.BatchMathIM1Interval.check(raw,field.expected);break;
      case 'im1-line':result=api.BatchMathIM1Unit3PracticeQA.lineEquationEquivalent(raw,field.expected);break;
      case 'im1-sequence':result=api.BatchMathIM1Unit3PracticeQA.formulaEquivalent(raw,field.expected);break;
      case 'im1-recursive':result=api.BatchMathIM1Unit3PracticeQA.recursiveFormulaEquivalent(raw,field.expected);break;
      default:return{status:'unsupported',message:field.reason||'No existing checker is selected.',checker:checkerNames.unsupported};
    }
    const status=result.error||result.valid===false?'invalid':result.unsimplified?'unsimplified':(result.ok??result.correct)?'correct':'incorrect';
    return{status,message:result.message||result.error||result.note||(result.unsimplified?'Equivalent, but not simplified.':''),result,checker:checkerNames[field.checker]};
  } catch(e){return{status:'invalid',message:`Existing checker could not accept this answer: ${e.message}`,checker:checkerNames[field.checker]};}
}
