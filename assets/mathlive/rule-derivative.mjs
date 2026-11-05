import {startDerivativePilot} from './derivative-pilot.mjs';
import {translateDerivative} from './answer-adapter.mjs';
// Explicit page opt-in. The original generators and checker remain owners.

await startDerivativePilot('Rule derivative',raw=>translateDerivative(raw,{inverseTrig:true}));
