import {installDynamicFields} from './dynamic-fields.mjs';
import {translateAdvancedExpression} from './answer-adapter.mjs';
// Part B intentionally keeps its existing interval editor/checker contract.
installDynamicFields({label:'Separable Differential Equations',profiles:{
  'unit5-sep-x':{translate:translateAdvancedExpression},
  'unit5-sep-t':{translate:translateAdvancedExpression},
  'unit5-sep-theta':{translate:translateAdvancedExpression}
}});
