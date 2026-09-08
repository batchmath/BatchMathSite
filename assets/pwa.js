/* BatchMath PWA registration/update foundation — v10.6.3.P */
(() => {
  'use strict';

  const APP_VERSION = '10.6.3.P';
  const state = {
    version: APP_VERSION,
    supported: 'serviceWorker' in navigator,
    registration: null,
    updateReady: false,
    installAvailable: false,
    applyUpdate() {
      const waiting = state.registration && state.registration.waiting;
      if (!waiting) return false;
      state._reloadOnControllerChange = true;
      waiting.postMessage({ type: 'SKIP_WAITING' });
      return true;
    },
    async install() {
      const prompt = state._installPrompt;
      if (!prompt) return false;
      state._installPrompt = null;
      state.installAvailable = false;
      syncActionUI();
      try {
        await prompt.prompt();
        await prompt.userChoice;
        return true;
      } catch (_) {
        return false;
      }
    }
  };

  window.BatchMathPWA = state;

  function ensureActionUI() {
    if (document.querySelector('.bm-pwa-actions')) return;
    const wrap = document.createElement('div');
    wrap.className = 'bm-pwa-actions';
    wrap.setAttribute('aria-label', 'BatchMath app actions');

    const install = document.createElement('button');
    install.type = 'button';
    install.className = 'bm-pwa-action bm-install';
    install.textContent = 'Install BatchMath';
    install.addEventListener('click', () => state.install());

    const update = document.createElement('button');
    update.type = 'button';
    update.className = 'bm-pwa-action bm-update';
    update.textContent = 'Update BatchMath';
    update.addEventListener('click', () => state.applyUpdate());

    const status = document.createElement('span');
    status.className = 'sr-only';
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    status.dataset.bmPwaStatus = '1';

    wrap.append(install, update, status);
    document.body.appendChild(wrap);
  }

  function syncActionUI() {
    if (!document.body) return;
    ensureActionUI();
    const install = document.querySelector('.bm-pwa-action.bm-install');
    const update = document.querySelector('.bm-pwa-action.bm-update');
    const status = document.querySelector('[data-bm-pwa-status]');
    if (install) install.classList.toggle('is-visible', !!state.installAvailable);
    if (update) update.classList.toggle('is-visible', !!state.updateReady);
    if (status) {
      if (state.updateReady) status.textContent = 'A BatchMath update is available.';
      else if (state.installAvailable) status.textContent = 'BatchMath can be installed as an app.';
      else status.textContent = '';
    }
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    state._installPrompt = event;
    state.installAvailable = true;
    syncActionUI();
    window.dispatchEvent(new CustomEvent('batchmath:pwa-install-available'));
  });

  window.addEventListener('appinstalled', () => {
    state._installPrompt = null;
    state.installAvailable = false;
    syncActionUI();
    window.dispatchEvent(new CustomEvent('batchmath:pwa-installed'));
  });

  // Calculus / Calculus Prep keyboard convention: after an answered problem
  // has revealed its feedback and a next/new-problem control is available,
  // Enter advances. IM1 is intentionally excluded because its engines do not
  // use this auto-advance convention. Capture phase prevents duplicate page-
  // specific Enter handlers from advancing twice.
  if (/^\/(?:ap-calculus|calculus-prep)\//.test(location.pathname) && !window.__BM_CALC_ENTER_ADVANCE_BOUND__) {
    window.__BM_CALC_ENTER_ADVANCE_BOUND__ = true;
    const visibleEnabled = button => {
      if (!button || button.disabled || button.hidden) return false;
      const style = getComputedStyle(button);
      return style.display !== 'none' && style.visibility !== 'hidden' && button.getClientRects().length > 0;
    };
    const feedbackShown = () => {
      const feedback = document.querySelector('#feedback, .feedback');
      if (!feedback) return false;
      const text = (feedback.textContent || '').trim();
      return !!text && (feedback.classList.contains('shown') || feedback.classList.contains('correct') || feedback.classList.contains('wrong') || feedback.classList.contains('incorrect'));
    };
    document.addEventListener('keydown', event => {
      if (event.key !== 'Enter' || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const next = document.querySelector('button#next');
      let target = visibleEnabled(next) ? next : null;
      if (!target && feedbackShown()) {
        const fresh = document.querySelector('button#new');
        if (visibleEnabled(fresh)) target = fresh;
      }
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      target.click();
    }, true);
  }

  if (!state.supported || !/^https?:$/.test(location.protocol)) return;

  let lastUpdateCheck = 0;
  const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000;

  async function checkForUpdate(force = false) {
    const registration = state.registration;
    if (!registration) return;
    const now = Date.now();
    if (!force && now - lastUpdateCheck < UPDATE_CHECK_INTERVAL) return;
    lastUpdateCheck = now;
    try { await registration.update(); } catch (_) {}
  }

  function markUpdateReady(registration) {
    if (!registration.waiting || !navigator.serviceWorker.controller) return;
    state.updateReady = true;
    syncActionUI();
    window.dispatchEvent(new CustomEvent('batchmath:pwa-update-ready', {
      detail: { version: APP_VERSION }
    }));
  }

  window.addEventListener('load', async () => {
    syncActionUI();
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      state.registration = registration;
      markUpdateReady(registration);

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed') markUpdateReady(registration);
        });
      });

      checkForUpdate(true);
    } catch (error) {
      console.warn('BatchMath PWA registration was not available:', error);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate(false);
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (state._reloadOnControllerChange) location.reload();
  });
})();


// v10.6.3.P — Practice feedback MathJax safety net.
(function batchMathMathJaxSafety(){
  const commandRE=/\\\\(?:frac|dfrac|tfrac|sqrt|pi|infty|pm|mp|cup|cap|lt|gt|leq?|geq?|neq|approx|cdot|times|sin|cos|tan|sec|csc|cot|ln|log|arcsin|arccos|arctan|quad|qquad|theta|Delta|to|le|ge|ne|equiv|partial)\b/;
  const protectedRE=/\\\\\([\\s\\S]*?\\\\\)|\\\\\[[\\s\\S]*?\\\\\]/g;
  function balanced(s,start,open,close){let d=0;for(let i=start;i<s.length;i++){if(s[i]===open)d++;else if(s[i]===close){d--;if(d===0)return i+1;}}return start;}
  function commandEnd(s,i){
    const m=s.slice(i).match(/^\\\\([A-Za-z]+)/);if(!m)return i+1;let j=i+m[0].length,name=m[1];
    if(name==='frac'||name==='dfrac'||name==='tfrac'){
      if(s[j]==='{')j=balanced(s,j,'{','}');if(s[j]==='{')j=balanced(s,j,'{','}');return j;
    }
    if(name==='sqrt'){
      if(s[j]==='['){const q=s.indexOf(']',j+1);if(q>=0)j=q+1;}if(s[j]==='{')j=balanced(s,j,'{','}');return j;
    }
    if(['sin','cos','tan','sec','csc','cot','ln','log','arcsin','arccos','arctan'].includes(name)){
      while(j<s.length&&/\s/.test(s[j]))j++;if(s[j]==='(')j=balanced(s,j,'(',')');else while(j<s.length&&/[A-Za-z0-9_^{}+\-*/.]/.test(s[j]))j++;return j;
    }
    return j;
  }
  function wrapSegment(seg){
    if(!commandRE.test(seg))return seg;let out='',i=0;
    while(i<seg.length){const m=seg.slice(i).match(/\\\\(?:frac|dfrac|tfrac|sqrt|pi|infty|pm|mp|cup|cap|lt|gt|leq?|geq?|neq|approx|cdot|times|sin|cos|tan|sec|csc|cot|ln|log|arcsin|arccos|arctan|quad|qquad|theta|Delta|to|le|ge|ne|equiv|partial)\b/);if(!m){out+=seg.slice(i);break;}const st=i+m.index;out+=seg.slice(i,st);const en=commandEnd(seg,st);out+=`\\(${seg.slice(st,en)}\\)`;i=en;}return out;
  }
  function normalizeText(text){
    if(!commandRE.test(text)||/\\\\\(|\\\\\[/.test(text)===false)return wrapSegment(text);
    const slots=[];let t=text.replace(protectedRE,m=>{slots.push(m);return `@@BMMATH${slots.length-1}@@`;});t=wrapSegment(t);return t.replace(/@@BMMATH(\d+)@@/g,(_,n)=>slots[+n]);
  }
  function process(root){
    if(!root||root.nodeType!==1||root.closest?.('mjx-container,script,style,textarea'))return false;let changed=false;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    for(const n of nodes){if(n.parentElement?.closest('mjx-container,script,style,textarea'))continue;const next=normalizeText(n.nodeValue||'');if(next!==n.nodeValue){n.nodeValue=next;changed=true;}}
    return changed;
  }
  let queue=new Set(),timer=null;
  function schedule(el){if(!el)return;queue.add(el);clearTimeout(timer);timer=setTimeout(()=>{const els=[...queue];queue.clear();for(const e of els)process(e);if(window.MathJax?.typesetPromise)window.MathJax.typesetPromise(els).catch(()=>{});},0);}
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('.practice-shell .feedback,.practice-shell .choice,.practice-shell .correct-answer,.practice-shell .method').forEach(schedule);
    const obs=new MutationObserver(ms=>{for(const m of ms){const el=m.target.nodeType===1?m.target:m.target.parentElement;const box=el?.closest?.('.practice-shell .feedback,.practice-shell .choice,.practice-shell .correct-answer,.practice-shell .method');if(box)schedule(box);for(const n of m.addedNodes){if(n.nodeType===1){const b=n.matches?.('.feedback,.choice,.correct-answer,.method')?n:n.querySelector?.('.feedback,.choice,.correct-answer,.method');if(b&&b.closest('.practice-shell'))schedule(b);}}}});
    document.querySelectorAll('.practice-shell').forEach(x=>obs.observe(x,{subtree:true,childList:true,characterData:true}));
  });
})();
