import {installDynamicFields} from './dynamic-fields.mjs';
import {translateAdvancedExpression} from './answer-adapter.mjs';
installDynamicFields({label:'FTC and Rules',profiles:{'unit4-ftc':{translate:translateAdvancedExpression},'unit4-exact':{translate:translateAdvancedExpression}}});
