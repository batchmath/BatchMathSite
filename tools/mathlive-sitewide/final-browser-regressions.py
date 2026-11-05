"""Run existing focused browser suites; archive evidence without replacing broader historical artifacts."""
import os,sys,subprocess,json
from pathlib import Path
root=Path(__file__).resolve().parents[2];out=root/'tools/mathlive-sitewide/artifacts/final-regressions';out.mkdir(exist_ok=True)
fixtures=os.environ.get('MATHJAX_FIXTURE_ROOT','/workspace/work/math-entry-comparison/experiments/math-entry/vendor')
groups={
'pilots':[
 ('power','tools/mathlive-power-rule/browser.mjs',{},'tools/mathlive-power-rule/artifacts','browser-results.json'),
 ('chain','tools/mathlive-derivatives-pilot/browser.mjs',{},'tools/mathlive-derivatives-pilot/artifacts','browser-results.json'),
 ('product','tools/mathlive-batch1/browser.mjs',{'RULE':'product','INTERACTIONS_ONLY':'1'},'tools/mathlive-batch1/artifacts','product-current-profile-browser.json'),
 ('quotient','tools/mathlive-batch1/browser.mjs',{'RULE':'quotient','INTERACTIONS_ONLY':'1'},'tools/mathlive-batch1/artifacts','quotient-current-profile-browser.json'),
 ('basic','tools/mathlive-advanced-pilot/basic-browser.mjs',{},'tools/mathlive-advanced-pilot/artifacts','basic-browser.json')],
'contracts':[
 ('limits','tools/mathlive-sitewide/unit1-browser.mjs',{'ROUTE_INDEX':'0,2,4','INTERACTIONS_ONLY':'1','REPORT_SUFFIX':'-final-regression'},'tools/mathlive-sitewide/artifacts','unit1-browser-final-regression.json'),
 ('applications','tools/mathlive-sitewide/applications-browser.mjs',{'ROUTE_INDEX':'1,5,16','CONTROLS':'1','ENTER':'1','RECOVERY':'1','REPORT_SUFFIX':'-final-regression'},'tools/mathlive-sitewide/artifacts','applications-browser-final-regression.json'),
 ('integrals-de','tools/mathlive-sitewide/staged-browser.mjs',{'ROUTE_INDEX':'3,8,9,11','CONTROLS':'1','ENTER':'1','RECOVERY':'1','REPORT_SUFFIX':'-final-regression'},'tools/mathlive-sitewide/artifacts','staged-browser-final-regression.json'),
 ('im1-values','tools/mathlive-sitewide/im1-batch5-browser.mjs',{'ROUTE_INDEX':'1,2,9,10,11','INTERACTIONS_ONLY':'1','RECOVERY':'1','REPORT_SUFFIX':'-final-regression'},'tools/mathlive-sitewide/artifacts','im1-batch5-browser-final-regression.json'),
 ('im1-structured','tools/mathlive-sitewide/im1-batch6-browser.mjs',{'ROUTE_INDEX':'0,5,8,11','RECOVERY':'1','REPORT_SUFFIX':'-final-regression'},'tools/mathlive-sitewide/artifacts','im1-batch6-browser-final-regression.json'),
 ('prep','tools/mathlive-sitewide/prep-browser.mjs',{'ROUTE_INDEX':'1,2,4,5','RECOVERY':'1','REPORT_SUFFIX':'-final-regression'},'tools/mathlive-sitewide/artifacts','prep-browser-final-regression.json')]
}
summary=out/(sys.argv[1]+'-summary.json');results=json.loads(summary.read_text()) if summary.exists() else []
for name,script,extra,directory,report in groups[sys.argv[1]]:
 if os.environ.get('SUITES') and name not in os.environ['SUITES'].split(','):continue
 directory=root/directory;old={p:p.read_bytes() for p in directory.glob('*.png')};rp=directory/report;old_report=rp.read_bytes() if rp.exists() else None
 env=os.environ.copy();env.update({'CHROMIUM_PATH':'/usr/bin/chromium','MATHJAX_FIXTURE_ROOT':fixtures});env.update(extra)
 with open('/tmp/mathlive-final-'+name+'.log','w') as log:run=subprocess.run(['node',script],cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT)
 target=out/name;target.mkdir(exist_ok=True)
 if rp.exists():(target/report).write_bytes(rp.read_bytes())
 for p in directory.glob('*.png'):
  if p in old:p.write_bytes(old[p])
  else:p.unlink()
 if old_report is not None:rp.write_bytes(old_report)
 elif rp.exists():rp.unlink()
 results=[r for r in results if r['suite']!=name]
 results.append({'suite':name,'script':script,'environment':extra,'exitCode':run.returncode,'evidence':str((target/report).relative_to(root))});print(name,run.returncode,flush=True)
 (out/(sys.argv[1]+'-summary.json')).write_text(json.dumps(results,indent=2)+'\n')
 if run.returncode:sys.exit(run.returncode)
