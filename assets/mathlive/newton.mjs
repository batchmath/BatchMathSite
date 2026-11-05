import {installNewtonControls} from './newton-controls.mjs';
import {installDynamicFields} from './dynamic-fields.mjs';
import {translateAdvancedExpression} from './answer-adapter.mjs';
import {translateNewtonLatex,newtonToLatex} from './newton-notation.mjs';
installNewtonControls();
installDynamicFields({label:'Newton Sums and Limits',profiles:{
  'unit4-newton':{translate:raw=>translateNewtonLatex(raw,window.BatchMathNewtonNotation.normalize),toLatex:raw=>newtonToLatex(raw,window.BatchMathNewtonNotation.read)},
  'unit4-newton-value':{translate:translateAdvancedExpression}
}});
