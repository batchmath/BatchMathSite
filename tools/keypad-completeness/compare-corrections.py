"""Compare each blocked B field row with actual corrected keypad evidence."""
import collections,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BASE='961f54ed0d6e42701df0f65f43b2ea625d2c946c'
FILE='docs/audits/KEYPAD-COMPLETENESS-INVENTORY.json'
before=json.loads(subprocess.check_output(['git','show',BASE+':'+FILE],cwd=ROOT))
after=json.loads((ROOT/FILE).read_text())
def key(row):
 representation=(row.get('requiredRepresentation') or row.get('requiredAnswer')) if row['representation']=='indexed-root' else row.get('requiredAnswer')
 return tuple(row.get(k) for k in ['route','questionId','family','representation','part','field'])+(representation,)
available=collections.defaultdict(list)
for index,row in enumerate(after['fields']):
 if row['originalCorrectAccepted'] and row['wrongRejected']:
  available[key(row)].append((index,row))
used=collections.Counter();rows=[]
for index,row in enumerate(before['fields']):
 if not row['missingControl']:continue
 candidates=available[key(row)];offset=used[key(row)];used[key(row)]+=1
 assert offset<len(candidates),f'No distinct passing replacement: {row}'
 after_index,corrected=candidates[offset]
 assert corrected['enteredLatex'] and corrected['serializedSource'],corrected
 assert corrected['controlsUsed'],corrected
 rows.append({'beforeFieldRow':index,'afterFieldRow':after_index,
              **{k:row[k] for k in ['route','questionId','family','representation','part','field','requiredAnswer','requiredRepresentation','missingControl']},
              'beforeProfile':row['runtimeProfile'],'afterProfile':corrected['runtimeProfile'],
              'beforeRecordedDraft':row.get('requiredRepresentation'),'requiredRepresentation':corrected['requiredRepresentation'],
              'beforeEvidence':row['evidence'],'afterEvidence':corrected['evidence'],
              'enteredLatex':corrected['enteredLatex'],'serializedSource':corrected['serializedSource'],
              'controlsUsed':corrected['controlsUsed'],'correctAccepted':True,'wrongRejected':True,'resolved':True})
assert len(rows)==119,len(rows)
assert after['summary']['missingControlRows']==0
assert after['summary']['unresolvedDriverFailures']==0
report={'beforeCommit':BASE,'beforeSummary':before['summary'],'blockedBefore':119,
        'resolved':len(rows),'unresolved':0,'rows':rows,
        'note':'Each B row maps to a distinct current field row with actual keypad clicks, rendered LaTeX, hidden answer serialization and original correct/wrong grading. Row numbers are zero-based JSON field-array indices. Controls reference the current inventory dictionary. Repeated degree rows retain three separate prior-mode witnesses in the referenced raw evidence.'}
target='docs/audits/evidence/keypad-corrections-before-after.json'
(ROOT/target).write_text(json.dumps(report,indent=2)+'\n')
after['priorFindings']={'commit':BASE,'summary':before['summary']}
after['corrections']={'blockedBefore':119,'resolved':119,'unresolved':0,'evidence':target}
# Preserve the compact field-array layout used by build-ledger.py.
import importlib.util
spec=importlib.util.spec_from_file_location('ledger',Path(__file__).with_name('build-ledger.py'))
ledger=importlib.util.module_from_spec(spec);spec.loader.exec_module(ledger)
(ROOT/FILE).write_text(ledger.compact_rows(after,'fields'))
print('119/119 blocked field rows resolved; zero unresolved rows')
