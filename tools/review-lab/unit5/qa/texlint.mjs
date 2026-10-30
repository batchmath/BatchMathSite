// Every TeX macro used in questions, answers and explanations must be a known one.
export const KNOWN=new Set('frac dfrac sqrt left right sin cos tan sec csc cot ln log pi infty int displaystyle qquad quad text cdot lt gt le ge ne approx times to lim Rightarrow implies Longrightarrow theta Delta mid circ pm bigl bigr Bigl Bigr big Big leq geq neq ldots dots cdots mathrm mathbf boxed cup cap underbrace overbrace begin end , ; ! { } | % [ ] dot'.split(' '));
export function lint(html){const bad=new Set();const s=String(html);for(const m of s.matchAll(/\\([A-Za-z]+)/g))if(!KNOWN.has(m[1]))bad.add(m[1]);
 if(/\\\(\s*\\\)/.test(s))bad.add('empty math');
 if(/(?:^|[^\^])--|\+\s*-/.test(s))bad.add('malformed sign sequence (+ − or −−; the site deep audit rule)'); // v12.8.X
 return [...bad];}
