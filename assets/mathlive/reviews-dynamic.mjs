import {installSlopeEntry} from './slope-entry.mjs';
import {installDynamicFields} from './dynamic-fields.mjs';
import {installNewtonControls} from './newton-controls.mjs';
import {reviewProfiles,reviewKeypads} from './review-contracts.mjs';
for(const[name,spec]of Object.entries(reviewKeypads))window.BatchMathCalculusKeypad.registerProfile(name,spec);
installNewtonControls();
installDynamicFields({label:'Calculus Review',profiles:reviewProfiles({calculator:window.BM_TOPIC_PRACTICE?.defaultMode==='calculator'})});

installSlopeEntry();
