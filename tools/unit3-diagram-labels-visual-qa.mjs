import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

// Render the randomized SVGs with the actual diagram CSS. Inkscape's text
// bounds detect clipping/collisions; the PNGs support the visual review.
const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = process.argv.find(value => value.startsWith('--source-dir='))?.slice(13);
const out = sourceDirectory ? path.resolve(root, sourceDirectory) : path.join(root, 'qa-results', 'diagram-labels-v128g');
const samples = JSON.parse(fs.readFileSync(path.join(out, 'samples.json'), 'utf8'));
const css = fs.readFileSync(path.join(root, 'assets/ap-topic-practice.css'), 'utf8');
const diagramCss = css.split('\n').find(line => line.startsWith('.practice-diagram-hint'))
  .replace(/var\(--yellow\)/g, '#f5c400').replace(/var\(--red\)/g, '#d71920');
const failures = [], images = [];
let next = 0;
const jobs = samples.flatMap((sample, index) => ['desktop', 'mobile'].map(size => ({ sample, index, size })));

async function worker() {
  for (;;) {
    const job = jobs[next++];
    if (!job) return;
    const { sample, index, size } = job;
    const directory = path.join(out, size);
    fs.mkdirSync(directory, { recursive: true });
    const name = `${String(index).padStart(3, '0')}-${sample.family}-${sample.mode}`;
    const file = path.join(directory, name + '.svg');
    const image = path.join(directory, name + '.png');
    let labelCount = 0;
    const visibleLabels = [];
    let svg = sample.html.match(/<svg[\s\S]*?<\/svg>/)[0];
    svg = svg.replace(/<text([^>]*)>([\s\S]*?)<\/text>/g, (_, attributes, text) => {
      const id = `label-${labelCount++}`;
      visibleLabels.push({ id, text });
      return `<text id="${id}"${attributes}>${text}</text>`;
    });
    svg = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" ');
    const opening = svg.indexOf('>') + 1;
    const mobileSize = css.match(/@media\(max-width:520px\)[^\n]*\.geometry-diagram \.diagram-label\{font-size:(\d+)px\}/)?.[1];
    assert.ok(mobileSize, 'the responsive diagram label size must be present');
    const style = `<style>${diagramCss}${size === 'mobile' ? `.geometry-diagram .diagram-label{font-size:${mobileSize}px}` : ''}</style>`;
    svg = svg.slice(0, opening) + style + '<rect width="600" height="340" fill="#030303"/>' + svg.slice(opening);
    fs.writeFileSync(file, svg);
    const { stdout } = await exec('inkscape', [file, '--query-all', '--export-type=png', `--export-width=${size === 'mobile' ? 350 : 650}`, `--export-filename=${image}`], { maxBuffer: 2000000 });
    const bounds = new Map(stdout.trim().split('\n').map(line => {
      const [id, ...numbers] = line.split(',');
      return [id, numbers.map(Number)];
    }));
    for (let i = 0; i < visibleLabels.length; i += 1) {
      const label = visibleLabels[i], box = bounds.get(label.id);
      assert.ok(box && box.every(Number.isFinite), `missing text bounds ${name}/${label.id}`);
      const [x, y, width, height] = box;
      if (x < 2 || y < 2 || x + width > 598 || y + height > 338) failures.push({ name, size, issue: 'clipping', label: label.text, box });
      for (let j = i + 1; j < visibleLabels.length; j += 1) {
        const other = visibleLabels[j], second = bounds.get(other.id);
        const overlapWidth = Math.min(x + width, second[0] + second[2]) - Math.max(x, second[0]);
        const overlapHeight = Math.min(y + height, second[1] + second[3]) - Math.max(y, second[1]);
        if (overlapWidth > .5 && overlapHeight > .5) failures.push({ name, size, issue: 'label collision', first: label.text, second: other.text, boxes: [box, second] });
      }
    }
    images.push({ index, name, size, file: image, kind: sample.kind, family: sample.family, mode: sample.mode });
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
fs.writeFileSync(path.join(out, 'visual-results.json'), JSON.stringify({ samples: samples.length, images: images.length, failures }, null, 2));
fs.writeFileSync(path.join(out, 'images.json'), JSON.stringify(images.sort((a, b) => a.index - b.index || a.size.localeCompare(b.size))));
if (failures.length) console.error(JSON.stringify(failures.slice(0, 20), null, 2));
assert.equal(failures.length, 0, `${failures.length} diagram-label clipping/collision failures`);
console.log(`Rendered label QA passed: ${samples.length} randomized examples, ${images.length} desktop/mobile SVGs; no clipped or overlapping labels.`);
