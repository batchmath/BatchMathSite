import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

const labelChanges = new Map(Object.entries({
  'ap-calculus/unit-1-limits-continuity/topics/basic-techniques-indeterminate-limits/practice/index.html#category': 'Practice Type',
  'ap-calculus/unit-1-limits-continuity/topics/comprehensive-review/practice/index.html#category': 'Practice Type',
  'ap-calculus/unit-1-limits-continuity/topics/limits-at-infinity/practice/index.html#category': 'Practice Type',
  'ap-calculus/unit-1-limits-continuity/topics/one-sided-limits/practice/index.html#category': 'Practice Type',
  'ap-calculus/unit-1-limits-continuity/topics/squeeze-theorem-trigonometric-limits/practice/index.html#focus': 'Practice Type',
  'ap-calculus/unit-2-derivatives/topics/comprehensive-review/practice/index.html#category': 'Practice Type',
  'ap-calculus/unit-2-derivatives/topics/the-chain-rule/practice/index.html#chain-mode': 'Practice Type',
  'calculus-prep/domains/index.html#mode': 'Practice Type',
  'calculus-prep/function-graphs/index.html#family': 'Practice Type',
  'calculus-prep/rational-functions/index.html#displayMode': 'Practice Type',
  'calculus-prep/special-factoring/index.html#mode': 'Practice Type',
  'calculus-prep/trig-equations/index.html#mode': 'Practice Type',
  'calculus-prep/trig-identities/index.html#set': 'Practice Type',
  'calculus-prep/unit-circle-values/index.html#mode': 'Practice Type',
  'im1/unit-2-algebraic-operations-equations-inequalities/topics/coordinate-system-nine-key-features/practice/index.html#featureMode': 'Practice Type',
}));

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

function addClass(tag, className) {
  if (new RegExp(`(?:^|\\s)${className}(?:\\s|$)`).test(tag.match(/class=["']([^"']*)["']/)?.[1] || '')) return tag;
  if (/class=["'][^"']*["']/.test(tag)) {
    return tag.replace(/class=(["'])([^"']*)\1/, (_match, quote, classes) => `class=${quote}${classes} ${className}${quote}`);
  }
  return tag.replace(/>$/, ` class="${className}">`);
}

let pageCount = 0;
let selectCount = 0;
let labelCount = 0;
let renameCount = 0;

for (const absolute of htmlFiles(root)) {
  let html = fs.readFileSync(absolute, 'utf8');
  if (!html.includes('BM_ANALYTICS_CONFIG') || !html.includes('<select')) continue;
  const relative = path.relative(root, absolute).replaceAll(path.sep, '/');
  pageCount += 1;

  const ids = [];
  html = html.replace(/<select\b[^>]*>/g, (tag) => {
    const id = tag.match(/\bid=["']([^"']+)["']/)?.[1];
    if (id) ids.push(id);
    selectCount += 1;
    return addClass(tag, 'bm-practice-select');
  });

  for (const id of ids) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const labelPattern = new RegExp(`<label\\b[^>]*\\bfor=(["'])${escaped}\\1[^>]*>[\\s\\S]*?<\\/label>`, 'g');
    html = html.replace(labelPattern, (label) => {
      labelCount += 1;
      let updated = label.replace(/^<label\b[^>]*>/, (tag) => addClass(tag, 'bm-practice-select-label'));
      const replacement = labelChanges.get(`${relative}#${id}`);
      if (replacement) {
        updated = updated.replace(/(<label\b[^>]*>)[\s\S]*?(<\/label>)/, `$1${replacement}$2`);
        renameCount += 1;
      }
      return updated;
    });

    const adjacentLabelPattern = new RegExp(`<label(?![^>]*\\bfor=)[^>]*>([\\s\\S]*?)<\\/label>(\\s*<select\\b[^>]*\\bid=(["'])${escaped}\\3)`, 'g');
    html = html.replace(adjacentLabelPattern, (match, labelText, selectStart) => {
      labelCount += 1;
      return `<label for="${id}" class="bm-practice-select-label">${labelText}</label>${selectStart}`;
    });
  }

  fs.writeFileSync(absolute, html);
}

console.log(JSON.stringify({ pageCount, selectCount, labelCount, renameCount }, null, 2));
