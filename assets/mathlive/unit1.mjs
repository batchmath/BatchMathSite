import {startDerivativePilot} from './derivative-pilot.mjs';
import {installNativeFields} from './native-fields.mjs';
import {unit1Profiles,limitContract,translateLimit} from './unit1-contracts.mjs';
for(const [name,profile]of Object.entries(unit1Profiles))window.BatchMathCalculusKeypad.registerProfile(name,profile);
const kind=document.querySelector('script[data-mathlive-unit1]').dataset.mathliveUnit1;
if(kind==='shared'){
 const source=document.getElementById('answer');await startDerivativePilot('Limit answer',translateLimit,{visibility:()=>!source.hidden});
}else{
 const locationField=kind==='location',advanced=kind==='advanced';
 installNativeFields({hostSelector:locationField?'#location-row':advanced?'.answer-row':'#choices',inputSelector:locationField?'#location':advanced?'#answer':'input.practice-answer-input',padSelector:advanced?'.u1-advanced-keypad':'.u1-keypad',contract:limitContract,profile:locationField||kind==='course'?'ml-unit1-rational-value':'ml-unit1-trig-value',label:locationField?'Discontinuity location':'Exact limit'});
}
