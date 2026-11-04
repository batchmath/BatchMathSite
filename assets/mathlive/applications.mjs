import {installDynamicFields} from './dynamic-fields.mjs';
import {applicationProfiles,applicationKeypads} from './applications-profiles.mjs';
for(const [name,spec]of Object.entries(applicationKeypads))window.BatchMathCalculusKeypad.registerProfile(name,spec);
export const profiles=applicationProfiles({calculator:location.pathname.includes('/calculator-practice/'),algebraic:location.pathname.includes('/linearization-and-differentials/')});
installDynamicFields({label:'Applications of Derivatives',profiles});
