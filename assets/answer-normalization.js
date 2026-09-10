/* BatchMath answer normalization — v10.6.3.V
   Canonicalizes mathematically equivalent negative-fraction sign placement
   before practice engines inspect a typed response. This is intentionally
   sitewide so numerator, denominator, and leading-minus forms are treated
   consistently by current and future practice engines. */
(() => {
  'use strict';

  const MINUS_RE = /[−–—]/g;
  const trim = value => String(value ?? '').trim().replace(MINUS_RE, '-');

  function matchingClose(s, start, open='(', close=')') {
    let depth = 0;
    for (let i=start;i<s.length;i++) {
      if (s[i]===open) depth++;
      else if (s[i]===close) {
        depth--;
        if (depth===0) return i;
      }
    }
    return -1;
  }

  function stripOuterParens(s) {
    s=s.trim();
    while (s.startsWith('(')) {
      const end=matchingClose(s,0,'(',')');
      if (end!==s.length-1) break;
      s=s.slice(1,-1).trim();
    }
    return s;
  }

  function topLevelOps(s) {
    let p=0,b=0,c=0;
    const slashes=[];
    for (let i=0;i<s.length;i++) {
      const ch=s[i];
      if (ch==='(') p++; else if (ch===')') p=Math.max(0,p-1);
      else if (ch==='[') b++; else if (ch===']') b=Math.max(0,b-1);
      else if (ch==='{') c++; else if (ch==='}') c=Math.max(0,c-1);
      else if (ch==='/' && p===0 && b===0 && c===0) slashes.push(i);
    }
    return slashes;
  }

  function hasTopLevelPlusMinusAfterFirst(s) {
    let p=0,b=0,c=0;
    for (let i=1;i<s.length;i++) {
      const ch=s[i];
      if (ch==='(') p++; else if (ch===')') p=Math.max(0,p-1);
      else if (ch==='[') b++; else if (ch===']') b=Math.max(0,b-1);
      else if (ch==='{') c++; else if (ch==='}') c=Math.max(0,c-1);
      else if ((ch==='+'||ch==='-') && p===0 && b===0 && c===0) {
        // Signs immediately following an exponent marker are not additive ops.
        if (s[i-1]==='^') continue;
        return true;
      }
    }
    return false;
  }

  // Extract a sign only when it applies to the entire numerator/denominator.
  // Examples extracted: (-2), -2, -(x+1), -sqrt(2), -x^2.
  // Example intentionally NOT extracted: (-x+2), because the minus is only
  // on the first term rather than on the whole denominator.
  function wholeSign(part) {
    let s=stripOuterParens(part.trim());
    let sign=1;
    while (s[0]==='+' || s[0]==='-') {
      const ch=s[0];
      let rest=s.slice(1).trim();
      if (!rest) break;
      if (ch==='-') {
        if (rest.startsWith('(')) {
          const end=matchingClose(rest,0,'(',')');
          if (end===rest.length-1) {
            sign*=-1;
            s=stripOuterParens(rest);
            continue;
          }
        }
        if (!hasTopLevelPlusMinusAfterFirst(s)) {
          sign*=-1;
          s=stripOuterParens(rest);
          continue;
        }
        break;
      }
      s=stripOuterParens(rest);
    }
    return {sign,body:s};
  }

  function numericAtom(s) {
    return /^[+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(stripOuterParens(s));
  }

  function wrapFactor(s) {
    s=stripOuterParens(s);
    if (/^(?:[A-Za-z]+(?:\([^()]*\))?|\d+(?:\.\d*)?|\.\d+|[A-Za-z]+(?:\^[-+]?\d+(?:\.\d*)?)?)$/.test(s)) return s;
    return `(${s})`;
  }

  function normalizeFractionSigns(value) {
    const original=String(value ?? '');
    let s=trim(original).replace(/\s+/g,'');
    if (!s || !s.includes('/')) return original.replace(MINUS_RE,'-');

    let outerSign=1;
    // Accept a sign in front of an entire parenthesized fraction: -(1/2).
    while (s[0]==='+' || s[0]==='-') {
      const ch=s[0],rest=s.slice(1);
      if (rest.startsWith('(') && matchingClose(rest,0,'(',')')===rest.length-1) {
        if (ch==='-') outerSign*=-1;
        s=stripOuterParens(rest);
      } else break;
    }
    s=stripOuterParens(s);
    const slashes=topLevelOps(s);
    if (slashes.length!==1) return trim(original);
    const slash=slashes[0];
    const left=s.slice(0,slash),right=s.slice(slash+1);
    if (!left || !right) return trim(original);

    const n=wholeSign(left), d=wholeSign(right);
    if (!n.body || !d.body) return trim(original);
    const sign=outerSign*n.sign*d.sign;

    // If there was no movable sign, leave the student's structure alone.
    const changed = outerSign!==1 || n.sign!==1 || d.sign!==1 || /[−–—]/.test(original);
    if (!changed) return trim(original);

    const nb=stripOuterParens(n.body), db=stripOuterParens(d.body);
    if (numericAtom(nb) && numericAtom(db)) return `${sign<0?'-':''}${nb}/${db}`;
    const numerator=sign<0?`-${wrapFactor(nb)}`:wrapFactor(nb);
    return `${numerator}/${wrapFactor(db)}`;
  }

  function candidateInputs(root=document) {
    const sel='input[type="text"],input[type="number"],input:not([type]),textarea';
    return [...root.querySelectorAll(sel)].filter(el => {
      if (el.disabled || el.readOnly) return false;
      if (el.closest('#bm-report-dialog')) return false;
      const meta=`${el.id||''} ${el.name||''} ${el.getAttribute('aria-label')||''} ${el.className||''} ${el.getAttribute('data-bm-calc-keypad')||''} ${el.getAttribute('data-bm-keypad')||''}`;
      return /answer|response|location|quotient|remainder|practice-answer|keypad|factor/i.test(meta) || !!el.closest('.practice-shell,.question-area,#practiceCard');
    });
  }

  function normalizeElement(el) {
    if (!el || typeof el.value!=='string') return false;
    const next=normalizeFractionSigns(el.value);
    if (next===el.value) return false;
    el.value=next;
    return true;
  }

  function normalizeAnswerInputs(root=document) {
    let count=0;
    for (const el of candidateInputs(root)) if (normalizeElement(el)) count++;
    return count;
  }

  const api=Object.freeze({normalizeFractionSigns,normalizeElement,normalizeAnswerInputs});
  window.BatchMathAnswers=api;

  // Normalize immediately before the engine's own checking handler runs.
  document.addEventListener('click', event => {
    const button=event.target?.closest?.('button,input[type="submit"]');
    if (!button) return;
    const label=`${button.id||''} ${button.name||''} ${button.className||''} ${button.textContent||''}`;
    if (/check|submit|answer|part\s*2|evaluate/i.test(label)) normalizeAnswerInputs(document);
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key!=='Enter' || event.isComposing) return;
    const el=event.target;
    if (el && /^(INPUT|TEXTAREA)$/.test(el.tagName)) normalizeElement(el);
  }, true);

  document.addEventListener('submit', () => normalizeAnswerInputs(document), true);
  document.addEventListener('change', event => {
    const el=event.target;
    if (el && /^(INPUT|TEXTAREA)$/.test(el.tagName)) normalizeElement(el);
  }, true);
})();
