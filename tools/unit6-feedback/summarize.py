"""Verify existing feedback-audit evidence and write a concise truthful ledger."""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
E=ROOT/'docs/feedback-audit/evidence'
def read(name):return json.loads((E/name).read_text())
def log_json(name):
    s=(E/name).read_text();starts=[i for i in [s.find('{'),s.find('[')] if i>=0]
    return json.JSONDecoder().raw_decode(s[min(starts):])[0]
before,after=read('audit-before.json'),read('audit-after.json')
assert before['confirmedDisclosures']==373 and after['confirmedDisclosures']==0
assert (after['families'],len(after['configurations']),after['problems'],after['parts'],after['earlierLaterPairs'])==(37,69,2760,5236,4095)
modes=read('modes-and-reviews.json');assert modes['allFutureDisclosureChecksPass'] and modes['allNonFeedbackContractsAndRngCountsMatchE']
assert (modes['topicModeProblems'],modes['reviewWrapperProblems'])==(1072,1088)
assert '# pass 0' in (E/'known-leaks-before-13.tap').read_text() and '# fail 13' in (E/'known-leaks-before-13.tap').read_text()
assert '# pass 13' in (E/'known-leaks-final-13.tap').read_text() and '# fail 0' in (E/'known-leaks-final-13.tap').read_text()
primary=read('browser-after.json');supplement=read('browser-supplement-after.json');area=read('browser-all-area-final.json')
current=[r for r in primary['results'] if r['fixture']!='choose_dx_dy']+[r for r in supplement['results'] if r['fixture']!='choose_dy']+area['results']
assert len(current)==88 and len({(r['fixture'],r['wrapped'],r['width'],r['wrong']) for r in current})==88
assert all(r['passed'] and not r['failures'] for r in current)
assert not any(d['errors'] for d in [primary,supplement,area])
original=[read('browser-before.json'),read('browser-both-directions-before.json')]
assert sum(len(d['results']) for d in original)==48 and all(r['passed'] for d in original for r in d['results'])
tap=(E/'mathlive-node-final-bounds.tap').read_text();assert '# tests 294' in tap and '# pass 294' in tap and '# fail 0' in tap
runs=read('regressions/summary.json');assert len(runs)==8 and all(r['exitCode']==0 for r in runs)
browser=read('browser-regressions/summary.json');assert len(browser)==18 and all(r['exitCode']==0 for r in browser)
legacy=[read('browser-regressions/'+r['name']+'.json') for r in browser if r['name'].startswith('legacy-')]
graph=[read('browser-regressions/'+r['name']+'.json') for r in browser if r['name'].startswith('graph-after-')]
for d in legacy+graph:assert not any(d[k] for k in ['failures','errors','scrollBoxes','pageOverflow'])
piecewise=read('browser-regressions/piecewise-fit.json')
for v in piecewise['widths'].values():assert not any(v[k] for k in ['overflowBraces','overflowLines','raw','merror','errors'])
assert all(r['ok'] for r in log_json('browser-regressions/render-check.json'))
layout=read('radius-height-layout.json');assert len(layout['selectedCases'])==16 and all(not r['issues'] and not r['mathErrors'] and not r['documentOverflow'] for r in layout['results'])
routes=read('routes-unit6-F.json');assert len(routes['results'])==30 and all(r['passed'] for r in routes['results']) and not routes['errors']
assert read('pwa-browser.json')['passed'] and all(r['exitCode']==0 for r in read('static-analytics-pwa.json'))
summary={'baseline':'6de1b027f45f43285be9fdc98d38d5f49419aecd','version':'12.9.F',
         'audit':{'families':37,'eligibleConfigurations':69,'generatedProblems':2760,'parts':5236,'earlierLaterPairs':4095,'sourceEDisclosures':373,'correctedDisclosures':0,'affectedFamilies':7,'topicModeProblems':1072,'reviewWrapperProblems':1088,'mathematicalContractsAndRngPreserved':True},
         'explicitFixtures':{'sourceEFails':13,'correctedPass':13},
         'browser':{'currentDistinctScenarios':88,'sourceEBrowserReproductions':48,'recordedOriginalVisibleDisclosures':sum(d['expectedOriginalDisclosures'] for d in original),'errors':0},
         'mathliveNode':{'tests':294,'pass':294,'fail':0},'originalMathematicalSuites':runs,
         'legacy':{'runs':12,**{k:sum(d[k] for d in legacy) for k in ['checked','parts','integrals']}},
         'delayedGraphs':{'runs':4,'checks':sum(d['graphChecks'] for d in graph)},
         'piecewiseLayout':{'steps':piecewise['steps'],'widths':list(piecewise['widths']),'failures':0},
         'longRadiusHeightLayout':{'cases':16,'widths':5,'failures':0},'unit6RouteVisits':30,
         'serviceWorkerOldCachesPurgedAndSevenResourcesMatch':True,
         'historicalSiteSuite':'Ten inherited E site-suite failure groups remain documented separately; this is not a claim that all 48 historical scripts pass.'}
if (E/'downloaded-package-qa.json').exists():
    summary['downloadedPackage']=read('downloaded-package-qa.json');assert summary['downloadedPackage']['passed']
(E/'final-qa.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k in ['audit','browser','mathliveNode','legacy','piecewiseLayout']},indent=2))
