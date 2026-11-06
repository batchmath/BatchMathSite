"""Verify the final downloaded-package evidence and export its actual field ledger."""
import csv
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
E=ROOT/'docs/final-integration/evidence'
def read(name):return json.loads((E/name).read_text())

receipt=read('delivery-receipt.json')
assert receipt['workflowConclusion']=='success' and receipt['prerelease'] and not receipt['latest']
assert receipt['publishedZipDownloadedIndependently'] and receipt['publishedManifestAndChecksumMatch']
assert receipt['oldTagsUnchanged']==16 and receipt['protectedBranchesUnchanged']
manifest=read('delivery-manifest.json')
assert manifest['testedCommit']=='2fbfd3f7eb482fd6ef5f890ba86fe2a9554db8b6'
assert manifest['zip']=='batchmath-site-v12.9.E.zip' and manifest['rootDirectory']=='batchmath-site-v12.9.E/'
assert (manifest['includedFiles'],manifest['htmlPages'],manifest['pdfFiles'],manifest['lockedMathLiveFiles'])==(768,288,290,24)
assert manifest['allFilesMatchTestedCommit'] and manifest['crcPassed'] and manifest['cleanExtraction']
assert manifest['localMachinePaths']==0
smoke=read('downloaded-zip-smoke/zip-smoke.json')
assert not smoke['failures'] and smoke['version']['version']=='12.9.E'
assert (len(smoke['pages']),len(smoke['setup']),len(smoke['cubic']),len(smoke['fallback']))==(20,6,2,4)
assert read('pwa-browser-downloaded.json')['passed']
static=read('downloaded-static.json')
assert static['ok'] and not static['errors'] and not static['warnings']
assert static['stats']['htmlPages']==288 and static['stats']['brokenInternalReferences']==0
runs=read('downloaded-package-matrix-runs.json')
assert len(runs)==56 and all(r['exitCode']==0 for r in runs)
docs=[json.loads(p.read_text()) for p in (E/'downloaded-package-matrix').glob('*.json')]
assert len(docs)==56
ledger=[]
for d in docs:
    assert d['setupKeypadOnly'] and not any(d[k] for k in ['failures','errors','scrollBoxes','pageOverflow'])
    assert len(d['fieldEvidence'])==d['mathliveFields']==d['blankAtStart']==d['locked']
    for f in d['fieldEvidence']:
        assert all(f[k] for k in ['blankAtStart','enteredLatex','serializedSource','profile','correctAccepted','locked'])
        if f['control']=='u6-integral':
            assert f['inputMethod']=='displayed-keypad-only' and f['buttonsUsed']
        ledger.append({'route':d['page'],'mode':d['mode'],'viewport':d['viewport'],
                       **{k:v for k,v in f.items() if k!='buttonsUsed'},
                       'keypadButtonActions':len(f['buttonsUsed'] or [])})
totals={k:sum(d[k] for d in docs) for k in ['checked','parts','integrals','mathliveFields','blankAtStart','locked']}
assert (totals['checked'],totals['parts'],totals['integrals'],totals['mathliveFields'])==(336,627,159,613),totals
assert len(ledger)==613
setups=[r for r in ledger if r['control']=='u6-integral']
assert len(setups)==159
with (E/'downloaded-unit6-fields.csv').open('w') as file:
    writer=csv.DictWriter(file,fieldnames=list(ledger[0]),lineterminator='\n')
    writer.writeheader();writer.writerows(ledger)
proof={'matrixRuns':56,**totals,'entireSetupKeypadOnly':159,
       'recordedSetupButtonActions':sum(r['keypadButtonActions'] for r in setups),
       'allFieldsInitiallyBlankCorrectAndLocked':True,
       'allSetupProfilesLatexSerializationAndButtonsRecorded':True,
       'nonSetupEntryPolicy':'Original mixed physical-keyboard/keypad/complex-LaTeX insertion; not all 627 parts are keypad-only.',
       'zipSmoke':{'pageVisits':20,'sameValueWrongSetupsRejected':6,'cubicGraphs':2,'fallbacks':4,'failures':0},
       'downloadedServiceWorkerActivationAndOfflineHashesPassed':True,
       'downloadedStaticQa':{'htmlPages':288,'internalReferences':static['stats']['internalReferences'],'brokenReferences':0,'warnings':0,'errors':0},
       'testedWebsiteCommit':manifest['testedCommit'],'archiveSha256':manifest['sha256'],'passed':True}
(E/'downloaded-package-qa.json').write_text(json.dumps(proof,indent=2)+'\n')
print(json.dumps(proof,indent=2))
