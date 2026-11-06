"""Classify the actual merged assertion failures against both exact, freshly run source baselines."""
import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/final-integration/evidence/site-suite'

def normalize(text):
    for path in [str(ROOT),'/workspace/work/v12.9.E/source-a','/workspace/work/v12.9.E/source-b']:
        text=text.replace(path,'<repo>')
    return re.sub(r'\x1b\[[0-9;]*m','',text).strip()

def errors(path):
    text=normalize(path.read_text())
    bullets=[line[2:].rstrip() for line in text.splitlines() if line.startswith('- ')]
    if bullets:
        declared=re.search(r'^Errors:\s*(\d+)',text,re.M)
        return {'kind':'error-list','declaredErrors':int(declared[1]) if declared else len(bullets),'messages':bullets}
    # VM/DOM fixtures can terminate with a real exception. Keep the complete
    # exception and stack, normalizing only the checkout path and ANSI styling.
    match=re.search(r'^(?:[A-Za-z.]*Error|AssertionError\s*\[[^]]+\]):[^\n]*',text,re.M)
    if match:
        block=text[match.start():].split('\nNode.js v')[0].strip()
        return {'kind':'exception','declaredErrors':1,'messages':block.splitlines()}
    # Some scripts emit structured error arrays rather than a human report.
    decoder=json.JSONDecoder()
    for match in re.finditer(r'\{',text):
        try:data,_=decoder.raw_decode(text[match.start():])
        except json.JSONDecodeError:continue
        if isinstance(data,dict):
            for key in ['errors','failures']:
                if isinstance(data.get(key),list) and data[key]:
                    return {'kind':'json-'+key,'declaredErrors':len(data[key]),'messages':data[key]}
    raise AssertionError('No complete failure evidence recognized: '+str(path))

def compare(partial=False):
    runs=json.loads((OUT/'summary.json').read_text())
    failed=[r for r in runs if r['tree']=='merged' and r['exitCode'] not in [0,124]]
    assert failed,'The raw merged run must retain its actual assertion failures'
    result=[]
    for row in failed:
        script=row['script'];merged=errors(OUT/'merged'/(script+'.log'))
        record={'script':script,'merged':merged,'baselines':{}}
        for source in ['source-a','source-b']:
            run=next((r for r in runs if r['tree']==source and r['script']==script),None)
            if not run:
                record['baselines'][source]={'pending':True};continue
            baseline=errors(OUT/source/(script+'.log')) if run['exitCode'] else {'kind':'passed','declaredErrors':0,'messages':[]}
            record['baselines'][source]={'exitCode':run['exitCode'],'sameErrorList':baseline==merged,'errors':baseline}
        complete=all(not x.get('pending') for x in record['baselines'].values())
        inherited=any(x.get('sameErrorList') for x in record['baselines'].values())
        record['bothSourcesChecked']=complete;record['inherited']=inherited
        if not partial:assert complete and inherited,record
        result.append(record)
    report={'assertionFailureGroups':len(result),'allComparedWithBothSources':all(r['bothSourcesChecked'] for r in result),
            'allInherited':all(r['inherited'] for r in result),'rows':result,
            'timingFailures':[r for r in runs if r['tree']=='merged' and r['exitCode']==124],
            'note':'Timing failures remain separate from mathematical/assertion failures. Their complete unchanged-command reruns are recorded in the final integration QA summary.'}
    (OUT/'failure-comparison.json').write_text(json.dumps(report,indent=2)+'\n')
    for r in result:print(r['script'],r['merged']['declaredErrors'],{k:v.get('sameErrorList','pending') for k,v in r['baselines'].items()})
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--partial',action='store_true')
    compare(parser.parse_args().partial)
