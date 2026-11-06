// Require an explicit relation between the named functions, not just the word inverse.
export function definesInverse(prompt) {
  const s=String(prompt).replace(/<[^>]*>/g,' ').replace(/\\[()]/g,'').replace(/\s+/g,' ').trim();
  return /\b(?:let|if) g be the inverse (?:function )?of f\b/i.test(s)
    || /\b(?:f and g|g and f) are inverse(?:s| functions)\b/i.test(s)
    || /\bg\s*=\s*f\s*(?:\^\{\s*-1\s*\}|\^-1|⁻¹)(?=[\s,.;)]|$)/.test(s);
}
