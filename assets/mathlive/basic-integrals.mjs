import {installDynamicFields} from './dynamic-fields.mjs';
import {translateAdvancedExpression} from './answer-adapter.mjs';
installDynamicFields({label:'Basic Integrals',profiles:{'unit4-basic-indef':{translate:translateAdvancedExpression},'unit4-basic-def':{translate:translateAdvancedExpression}}});
