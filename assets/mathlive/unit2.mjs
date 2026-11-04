import {startDerivativePilot} from './derivative-pilot.mjs';
import {translateDerivative} from './answer-adapter.mjs';
const nested=document.getElementById('answer')?.dataset.bmMathliveContract==='nested';
await startDerivativePilot('Mathematical answer',raw=>translateDerivative(raw,{inverseTrig:true,symbolicFunctions:nested}));
