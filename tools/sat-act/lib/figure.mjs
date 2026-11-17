// Draws a question figure from the verified record's own geometry. Nothing is added that the
// record does not state: vertex labels come from figure.vertices and the right-angle mark from
// question.spec.right_angle. Side lengths are deliberately not drawn, matching the question as posed.
import { escapeHtml } from './markup.mjs';

export function renderFigure(record) {
  const figure = record.figure;
  if (!figure) return '';
  const names = Object.keys(figure.vertices || {});
  if (names.length !== 3) throw new Error(`${record.sourceId}: only triangle figures are supported (got ${names.length} vertices)`);
  const right = record.rightAngle;
  if (right && !names.includes(right)) throw new Error(`${record.sourceId}: right angle ${right} is not a vertex`);

  const pts = names.map(n => ({ n, x: figure.vertices[n][0], y: figure.vertices[n][1] }));
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = maxX - minX || 1, spanY = maxY - minY || 1;
  // to_scale figures keep their true proportions; the longest side is fit into the box.
  const box = 200, pad = 34;
  const scale = box / Math.max(spanX, spanY);
  const w = spanX * scale + pad * 2, h = spanY * scale + pad * 2;
  const P = p => ({ x: pad + (p.x - minX) * scale, y: pad + (maxY - p.y) * scale });
  const sp = Object.fromEntries(pts.map(p => [p.n, { ...P(p), n: p.n }]));
  const cx = (sp[names[0]].x + sp[names[1]].x + sp[names[2]].x) / 3;
  const cy = (sp[names[0]].y + sp[names[1]].y + sp[names[2]].y) / 3;
  const f = v => Number(v.toFixed(1));

  const polygon = names.map(n => `${f(sp[n].x)},${f(sp[n].y)}`).join(' ');
  let mark = '';
  if (right) {
    const c = sp[right];
    const others = names.filter(n => n !== right).map(n => sp[n]);
    const unit = q => { const dx = q.x - c.x, dy = q.y - c.y, len = Math.hypot(dx, dy); return { x: dx / len, y: dy / len }; };
    const [u, v] = others.map(unit);
    const s = 16;
    mark = `<polyline class="satact-fig-right" points="${f(c.x + u.x * s)},${f(c.y + u.y * s)} ${f(c.x + (u.x + v.x) * s)},${f(c.y + (u.y + v.y) * s)} ${f(c.x + v.x * s)},${f(c.y + v.y * s)}"/>`;
  }
  const labels = names.map(n => {
    const p = sp[n];
    const dx = p.x - cx, dy = p.y - cy, len = Math.hypot(dx, dy) || 1;
    const lx = p.x + (dx / len) * 20, ly = p.y + (dy / len) * 20;
    return `<text class="satact-fig-label" x="${f(lx)}" y="${f(ly)}" text-anchor="middle" dominant-baseline="central">${escapeHtml(n)}</text>`;
  }).join('');
  const label = right
    ? `Triangle ${names.join('')} with a right angle at ${right}.`
    : `Triangle ${names.join('')}.`;
  return `<figure class="satact-figure"><svg class="satact-fig-svg" viewBox="0 0 ${f(w)} ${f(h)}" width="${f(w)}" height="${f(h)}" role="img" aria-labelledby="satact-fig-title"><title id="satact-fig-title">${escapeHtml(label)}</title>` +
    `<polygon class="satact-fig-shape" points="${polygon}"/>${mark}${labels}</svg></figure>`;
}
