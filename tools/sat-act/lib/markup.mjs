// Converts the verified records' light markup into static HTML without changing any mathematics.
// Records use $...$ for inline TeX (with \$ for a literal dollar sign) and **...** for emphasis.
// TeX is emitted verbatim between MathJax's \( \) and \[ \] delimiters; only the HTML-special
// characters &, < and > are escaped, which MathJax reads back as the original characters.

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Splits text into {type:'text'|'math', value} tokens. Inside math, \$ is a TeX command and is kept.
export function tokenize(source) {
  const s = String(source ?? '');
  const tokens = [];
  let text = '';
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '\\' && s[i + 1] === '$') { text += '$'; i += 2; continue; }
    if (ch === '$') {
      let j = i + 1;
      let tex = '';
      let closed = false;
      while (j < s.length) {
        if (s[j] === '\\' && j + 1 < s.length) { tex += s[j] + s[j + 1]; j += 2; continue; }
        if (s[j] === '$') { closed = true; break; }
        tex += s[j];
        j++;
      }
      if (!closed) throw new Error(`unbalanced $ in: ${s}`);
      if (text) tokens.push({ type: 'text', value: text });
      tokens.push({ type: 'math', value: tex });
      text = '';
      i = j + 1;
      continue;
    }
    text += ch;
    i++;
  }
  if (text) tokens.push({ type: 'text', value: text });
  return tokens;
}

// Inline markup -> HTML. Bold markers are only recognised in text, never inside TeX.
export function inline(source) {
  let html = '';
  let bold = false;
  for (const token of tokenize(source)) {
    if (token.type === 'math') {
      html += '\\(' + escapeHtml(token.value) + '\\)';
      continue;
    }
    const parts = token.value.split('**');
    parts.forEach((part, index) => {
      if (index > 0) { html += bold ? '</strong>' : '<strong>'; bold = !bold; }
      html += escapeHtml(part);
    });
  }
  if (bold) throw new Error(`unbalanced ** in: ${source}`);
  return html;
}

// Plain reading text (for aria labels and search snippets): TeX kept as written.
export function plain(source) {
  return tokenize(source).map(t => t.value).join('').replace(/\*\*/g, '');
}

export function displayMath(tex, className = 'satact-math') {
  return `<div class="${className}">\\[${escapeHtml(tex)}\\]</div>`;
}
