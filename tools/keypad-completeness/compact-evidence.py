"""Store one evidence record per line without changing parsed JSON values."""
import importlib.util,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];spec=importlib.util.spec_from_file_location('ledger',Path(__file__).with_name('build-ledger.py'));module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
names=module.SOURCES+['keypad-runtime-profile-observations.json','keypad-runtime-profile-observations-unit1.json','keypad-generator-catalog-coverage.json']
for name in names:
 path=ROOT/'docs/audits/evidence'/name
 if not path.exists():continue
 data=json.loads(path.read_text());key='results' if 'results' in data else'observations' if 'observations' in data else None
 if key:
  out=module.compact_rows(data,key);assert json.loads(out)==data;path.write_text(out)
print('Compacted',len(names),'named evidence files; JSON data unchanged')
