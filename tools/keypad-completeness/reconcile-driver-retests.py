"""Replace only explicitly failed driver cases with exact passing UI reruns."""
import argparse,json
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('before');parser.add_argument('rerun');parser.add_argument('output');args=parser.parse_args()
before=json.loads(Path(args.before).read_text());rerun=json.loads(Path(args.rerun).read_text())
assert not before.get('errors') and not rerun.get('errors')
def key(row):
 return (row.get('route'),row.get('questionId'),row.get('family'),row.get('seed'),row.get('generatorSlug'),json.dumps(row.get('selector',{}),sort_keys=True))
failed={key(row):row for row in before['results'] if row.get('passed') is False}
corrected={key(row):row for row in rerun['results'] if not row.get('coverage')}
assert failed and set(failed)==set(corrected),(set(failed)-set(corrected),set(corrected)-set(failed))
assert all(row.get('passed') is True for row in corrected.values())
rows=[]
for row in before['results']:
 if key(row) in failed:
  replacement=dict(corrected[key(row)]);replacement['driverRetestEvidence']=args.rerun;replacement['driverBeforeEvidence']=args.before;replacement['driverCorrection']='Use the established source-input focus route to select the active MathLive field, and await initial typesetting. All value changes still come from displayed keypad buttons.';rows.append(replacement)
 else:rows.append(row)
before['results']=rows;before['driverRetests']={'before':args.before,'after':args.rerun,'resolvedCases':len(failed),'unresolvedCases':0}
assert all(row.get('passed') is not False for row in rows)
Path(args.output).write_text(json.dumps(before,indent=2)+'\n')
print('Resolved',len(failed),'driver cases; every unaffected result retained')
