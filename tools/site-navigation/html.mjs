import {parse} from 'parse5';

export function* elements(node) {
  for (const child of node?.childNodes || []) {
    if (child.tagName) yield child;
    yield* elements(child);
  }
}

export const attr = (node, name) => node?.attrs?.find(item => item.name === name)?.value ?? '';
export const has = (node, name) => node?.attrs?.some(item => item.name === name) ?? false;
export const tagged = (node, name) => node?.tagName === name;
export const hasClass = (node, name) => attr(node, 'class').split(/\s+/).includes(name);
export const all = (node, predicate) => [...elements(node)].filter(predicate);
export const first = (node, predicate) => all(node, predicate)[0];

function contents(node) {
  if (node?.nodeName === '#text') return node.value;
  if (hasClass(node, 'frac')) return node.childNodes.map(contents).join('/');
  return (node?.childNodes || []).map(contents).join('');
}
export const label = node => contents(node).replace(/\s+/g, ' ').trim();
export const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export function document(html) {
  const tree = parse(html, {sourceCodeLocationInfo: true});
  const main = first(tree, node => tagged(node, 'main') && node.sourceCodeLocation?.endTag);
  return {tree, main};
}

export const start = node => node.sourceCodeLocation.startOffset;
export const end = node => node.sourceCodeLocation.endOffset;
export const beforeClose = node => node.sourceCodeLocation.endTag.startOffset;
export const source = (html, node) => html.slice(start(node), end(node));
export const replacement = (node, markup = '') => [start(node), end(node), markup];
export const insert = (offset, markup) => [offset, offset, markup];

export function apply(html, edits) {
  let boundary = html.length;
  for (const [from, to, markup] of edits.sort(([a], [b]) => b - a)) {
    if (to > boundary) throw new Error('Overlapping HTML edits');
    html = html.slice(0, from) + markup + html.slice(to);
    boundary = from;
  }
  return html;
}
