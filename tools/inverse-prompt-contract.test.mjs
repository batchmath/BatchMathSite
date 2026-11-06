import {test} from 'node:test';
import assert from 'node:assert/strict';
import {definesInverse} from './inverse-prompt-contract.mjs';
test('clear inverse definitions, including existing English, TeX and Unicode',()=>{
 for(const s of ['Let g be the inverse of f.','Let g be the inverse function of f.','f and g are inverses.','g and f are inverse functions.','If \\(g=f^{-1}\\), find g\'.','Let g=f⁻¹.','g = f^-1;'])assert.ok(definesInverse(s),s);
});
test('ambiguous or different function relations remain invalid',()=>{
 for(const s of ['Find the indicated derivative. f(x)=3+e^{4x}, g\'(4)=?','Find the inverse derivative.','f and g are not inverses.','Let h be the inverse of f.','Let g be the inverse of h.','g=f','g=f^{-10}','g=f^-10'])assert.ok(!definesInverse(s),s);
});
