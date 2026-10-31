import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
export function loadCheckers() {
  const context={window:{},document:{addEventListener(){},documentElement:{classList:{add(){}}}},console,Math};vm.createContext(context);
  for(const name of ['answer-normalization','derivative-expression-checker','line-equation-checker','unit4-exact-answers','unit5-core','unit5-answers','im1-algebra-input','im1-equation-input','im1-interval-input','im1-unit3-practice'])vm.runInContext(fs.readFileSync(path.join(root,'assets',name+'.js'),'utf8'),context,{filename:name+'.js'});
  return context.window;
}
