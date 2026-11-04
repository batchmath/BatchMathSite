import {installSlopeEntry} from './slope-entry.mjs';
import {installDynamicFields} from './dynamic-fields.mjs';
import {stagedProfiles,stagedKeypads} from './staged-profiles.mjs';
for(const [name,spec]of Object.entries(stagedKeypads))window.BatchMathCalculusKeypad.registerProfile(name,spec);
export const profiles={...stagedProfiles,'unit4-exact':{...stagedProfiles['unit4-exact'],keypad:window.BM_TOPIC_PRACTICE?.slug==='introduction-to-sigma-notation'?'ml-unit4-sigma-value':'ml-unit4-approx-exact'}};
installDynamicFields({label:'Integrals and Differential Equations',profiles});

installSlopeEntry();
