import fs from 'node:fs';import {root} from './unit2-engine.mjs';export{root};
export const unit2Route={path:'im1/unit-2-algebraic-operations-equations-inequalities/topics/comprehensive-review/practice/index.html',unit:'unit2',slug:'comprehensive-review'};
export const unit3Routes=['a-arithmetic-sequences-and-arithmetic-progression-models/section-a-review','b-functions-function-notation-and-slope/section-b-review','c-slope-intercept-form-and-point-slope-form/section-c-review','d-recursive-formulas-for-linear-relationships/section-d-review','comprehensive-review'].map(s=>'im1/unit-3-linear-equation/topics/'+s+'/practice/index.html');
export function slug(route){return fs.readFileSync(root+route,'utf8').match(/BM_UNIT3_PRACTICE=\{slug:"([^"]+)"/)[1];}
export function modes(route){return [...fs.readFileSync(root+route,'utf8').matchAll(/<option\b[^>]*value="([^"]*)"/g)].map(m=>m[1]);}
