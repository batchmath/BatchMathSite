"""Keep the N fallback gate equal to the existing production command sequence."""
import hashlib
import re
from pathlib import Path
production = Path('.github/workflows/batchmath-qa.yml').read_bytes()
assert hashlib.sha256(production).hexdigest() == 'd8823214cd05a010f6d2dedd12c1de1d290ab73736ac13f631e6539a44293f36'
commands = re.findall(r'run: (npm run qa:[a-z0-9-]+)', production.decode())
targeted = Path('.github/workflows/unit4-v128n-qa.yml').read_text()
fallback = targeted.split('name: Full production-equivalent BatchMath QA', 1)[1].split('- name:', 1)[0]
assert re.findall(r'^          (npm run qa:[a-z0-9-]+)$', fallback, re.M) == commands
assert len(commands) == 17
print('Exact production parity: 17 commands, including complete seeded browser QA. Production workflow unchanged.')
