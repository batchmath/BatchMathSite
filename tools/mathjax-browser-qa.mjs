// Real, pinned MathJax for browser QA. Production HTML keeps its existing CDN
// URL; these routes serve the identical npm distribution and fonts locally so
// a transient CDN outage cannot turn a site/data test into a false failure.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const packages={mathjax:path.dirname(require.resolve('mathjax/package.json')),'@mathjax/mathjax-newcm-font':path.dirname(require.resolve('@mathjax/mathjax-newcm-font/package.json'))};
export async function localMathJax(context){
 const served=[];
 await context.route(/^https:\/\/cdn\.jsdelivr\.net\/npm\/(?:mathjax@|@mathjax\/)/,async route=>{
  const url=new URL(route.request().url()),match=url.pathname.match(/^\/npm\/(mathjax|@mathjax\/mathjax-newcm-font)@4\.1\.3\/(.+)$/);
  if(!match)throw Error('Unexpected MathJax package/version in browser QA: '+url.pathname);
  const root=packages[match[1]],file=path.resolve(root,decodeURIComponent(match[2]));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file))throw Error('Missing pinned MathJax QA resource: '+url.pathname);
  served.push(url.pathname);const ext=path.extname(file),contentType=ext==='.js'?'text/javascript':ext==='.css'?'text/css':ext==='.woff2'?'font/woff2':ext==='.woff'?'font/woff':'application/octet-stream';
  await route.fulfill({status:200,contentType,headers:{'access-control-allow-origin':'*'},body:fs.readFileSync(file)});
 });
 return served;
}
