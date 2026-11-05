import {installNativeFields} from './native-fields.mjs';
import {im1ValueContract,im1PolynomialContract,im1IntervalContract} from './im1-contracts.mjs';
import {im1Profiles} from './im1-profiles.mjs';
const api=window.BatchMathCalculusKeypad;
for(const [name,spec]of Object.entries(im1Profiles))api.registerProfile(name,spec);
const unit2=document.documentElement.dataset.mathliveIm1==='unit2';
function polynomialProfile({host}){
 const variables=[...host.querySelectorAll('.algebra-keypad button')].map(b=>b.textContent.trim()).filter(s=>/^[a-z]$/.test(s)),name='ml-im1-polynomial-'+variables.join('');
 api.registerProfile(name,{variables,exponent:true,arithmetic:true});return name;
}
const start=()=>installNativeFields(unit2?{
 hostSelector:'#choices .im1-algebra-entry',inputSelector:'input',padSelector:'.algebra-keypad,.algebra-preview',
 contract:({inputs})=>inputs[0].id==='algebra-answer'?im1PolynomialContract:inputs[0].id==='interval-answer'?im1IntervalContract:im1ValueContract,
 profile:context=>context.inputs[0].id==='algebra-answer'?polynomialProfile(context):context.inputs[0].id==='interval-answer'?'ml-im1-interval':'ml-im1-equation-value',label:'Mathematical answer'
}:{
 hostSelector:'#practiceCard .question-area',inputSelector:'#answer',padSelector:'.bm-keypad,.bm-fraction-editor',whenVisible:true,
 contract:({inputs})=>({...im1ValueContract,toggleNegative:['integer','decimal'].includes(inputs[0].dataset.bmKeypad),literalDecimal:inputs[0].dataset.bmKeypad==='decimal',hideWhenDisabled:Boolean(window.BatchMathKeypad?.touchMode)}),
 profile:({inputs})=>'ml-im1-'+inputs[0].dataset.bmKeypad,label:'Answer'
});
if(document.readyState==='complete')start();else document.addEventListener('DOMContentLoaded',start,{once:true});
