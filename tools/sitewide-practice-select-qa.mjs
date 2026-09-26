import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

function htmlFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(absolute));
    else if (entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

const manifest = [];
const labelByControl = new Map();
const pages = new Set();

for (const absolute of htmlFiles(root)) {
  const html = fs.readFileSync(absolute, 'utf8');
  if (!html.includes('BM_ANALYTICS_CONFIG') || !html.includes('<select')) continue;
  const relative = path.relative(root, absolute).replaceAll(path.sep, '/');
  pages.add(relative);
  assert.match(html, /(?:^|\/)assets\/site\.css/, `${relative}: shared site stylesheet is missing`);

  for (const match of html.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)) {
    const attrs = match[1];
    const id = attrs.match(/\bid=["']([^"']+)["']/)?.[1] || '';
    assert.ok(id, `${relative}: select without an id`);
    const classes = attrs.match(/\bclass=["']([^"']*)["']/)?.[1].split(/\s+/) || [];
    assert.ok(classes.includes('bm-practice-select'), `${relative}#${id}: shared select class is missing`);

    const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const label = html.match(new RegExp(`<label\\b([^>]*)\\bfor=(["'])${escapedId}\\2([^>]*)>([\\s\\S]*?)<\\/label>`));
    assert.ok(label, `${relative}#${id}: associated label is missing`);
    const labelAttrs = `${label[1]} ${label[3]}`;
    const labelClasses = labelAttrs.match(/\bclass=["']([^"']*)["']/)?.[1].split(/\s+/) || [];
    assert.ok(labelClasses.includes('bm-practice-select-label'), `${relative}#${id}: shared label class is missing`);
    labelByControl.set(`${relative}#${id}`, label[4].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' '));

    const options = [...match[2].matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/g)].map((option) => ({
      attrs: option[1].trim().replace(/\s+/g, ' '),
      text: option[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' '),
    }));
    manifest.push({ file: relative, id, options });
  }
}

manifest.sort((a, b) => `${a.file}#${a.id}`.localeCompare(`${b.file}#${b.id}`));
const optionHash = crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
assert.equal(pages.size, 50, 'active generator-page count changed');
assert.equal(manifest.length, 86, 'practice select count changed');
assert.equal(manifest.reduce((sum, select) => sum + select.options.length, 0), 401, 'static option count changed');
assert.equal(optionHash, '97f84f08049d61f80bb2b91735ce823279190240b4978c99ca11446bfce854cf', 'select options, order, values, or defaults changed from the approved v10.7.21 manifest');

const expectedPracticeType = [
  'ap-calculus/unit-1-limits-continuity/topics/basic-techniques-indeterminate-limits/practice/index.html#category',
  'ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/practice/index.html#category',
  'ap-calculus/unit-1-limits-continuity/topics/limits-at-infinity/practice/index.html#category',
  'ap-calculus/unit-1-limits-continuity/topics/one-sided-limits/practice/index.html#category',
  'ap-calculus/unit-1-limits-continuity/topics/squeeze-theorem-trigonometric-limits/practice/index.html#focus',
  'ap-calculus/unit-2-derivatives/topics/comprehensive-review/practice/index.html#category',
  'ap-calculus/unit-2-derivatives/topics/the-chain-rule/practice/index.html#chain-mode',
  'calculus-prep/domains/index.html#mode',
  'calculus-prep/function-graphs/index.html#family',
  'calculus-prep/rational-functions/index.html#displayMode',
  'calculus-prep/special-factoring/index.html#mode',
  'calculus-prep/trig-equations/index.html#mode',
  'calculus-prep/trig-identities/index.html#set',
  'calculus-prep/unit-circle-values/index.html#mode',
  'im1/unit-2-algebraic-operations-equations-inequalities/topics/coordinate-system-nine-key-features/practice/index.html#featureMode',
];
for (const key of expectedPracticeType) assert.equal(labelByControl.get(key), 'Practice Type', `${key}: main selector label is not standardized`);

const preservedSecondaryLabels = new Map(Object.entries({
  'ap-calculus/unit-2-derivatives/topics/derivatives-with-the-power-rule/practice/index.html#derivativeOrder': 'Derivative Order',
  'ap-calculus/unit-2-derivatives/topics/derivatives-with-the-power-rule/practice/index.html#powerType': 'Function Type',
  'ap-calculus/unit-6-applications-integration/topics/solids-of-revolution/practice/index.html#solidCalcMode': 'Calculator Use',
  'calculus-prep/function-graphs/index.html#qtype': 'Question Type',
  'calculus-prep/special-factoring/index.html#difficulty': 'Difficulty',
  'calculus-prep/synthetic-division/index.html#degree': 'Polynomial Degree',
  'calculus-prep/trig-angle-skills/index.html#angleSet': 'Angle Set',
  'calculus-prep/trig-angle-skills/index.html#format': 'Angle Format',
  'calculus-prep/trig-identities/index.html#qtype': 'Question Type',
  'calculus-prep/unit-circle-values/index.html#quadrant': 'Angle Set',
  'calculus-prep/unit-circle-values/index.html#format': 'Angle Format',
}));
for (const [key, expected] of preservedSecondaryLabels) assert.equal(labelByControl.get(key), expected, `${key}: secondary label changed`);

const css = read('assets/site.css');
const sharedSelectBlock = css.match(/select\.bm-practice-select\s*\{[\s\S]*?\}/)?.[0] || '';
for (const rule of [
  'padding:9px 11px!important;',
  'border:1px solid var(--bm-red,var(--red,#d71920))!important;',
  'border-radius:7px!important;',
  'background:#070707!important;',
  'color:var(--bm-yellow,var(--yellow,#f5c400))!important;',
  'font-weight:700!important;',
]) assert.ok(sharedSelectBlock.includes(rule), `shared select styling is missing ${rule}`);
assert.match(css, /select\.bm-practice-select:hover:not\(:disabled\)/, 'mouse hover treatment is missing');
assert.match(css, /select\.bm-practice-select:focus,[\s\S]*?select\.bm-practice-select:focus-visible/, 'keyboard focus treatment is missing');
assert.match(css, /@media\(max-width:600px\)\{[\s\S]*?select\.bm-practice-select\{font-size:16px!important\}/, 'mobile select sizing is missing');
assert.match(css, /select\.bm-practice-select\{[\s\S]*?width:100%!important;[\s\S]*?min-width:0!important;[\s\S]*?max-width:100%!important;/, 'responsive overflow protection is missing');
assert.doesNotMatch(sharedSelectBlock, /appearance\s*:/, 'native select behavior must remain enabled');

console.log(JSON.stringify({
  generatorPages: pages.size,
  selects: manifest.length,
  options: manifest.reduce((sum, select) => sum + select.options.length, 0),
  optionManifestHash: optionHash,
  standardizedMainLabels: expectedPracticeType.length,
  preservedSecondaryLabels: preservedSecondaryLabels.size,
  result: 'PASS',
}, null, 2));
