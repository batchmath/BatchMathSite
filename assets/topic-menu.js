(() => {
  const placement = document.querySelector('.bm-topics');
  if (!placement) return;

  const disclosure = placement.querySelector('details');
  const trigger = disclosure.querySelector('summary');
  const menu = disclosure.querySelector('nav');
  const content = document.getElementById('main-content');

  let inGutter = false;
  let canPin = false;

  function positionMenu() {
    if (canPin) {
      disclosure.classList.toggle('is-pinned', placement.getBoundingClientRect().top < 8);
    }
    const {top, bottom} = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - bottom - 16;
    const spaceAbove = top - 14;
    const opensAbove = inGutter && spaceBelow < 200 && spaceAbove > spaceBelow;
    menu.classList.toggle('opens-above', opensAbove);
    menu.style.setProperty('--bm-topics-menu-height', `${Math.max(0, opensAbove ? spaceAbove : spaceBelow)}px`);
  }

  function measureGutter() {
    inGutter = getComputedStyle(placement).position === 'absolute';
    canPin = inGutter && content && placement.getBoundingClientRect().left + trigger.offsetWidth + 8
      <= content.getBoundingClientRect().left;
    if (!canPin) disclosure.classList.remove('is-pinned');
    positionMenu();
  }

  document.addEventListener('click', event => {
    if (!disclosure.open) return;
    const destination = event.target.closest?.('.bm-topics-menu a');
    if (destination || !disclosure.contains(event.target)) {
      disclosure.open = false;
    }
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && disclosure.open) {
      disclosure.open = false;
      trigger.focus({preventScroll:true});
    }
  });

  disclosure.addEventListener('toggle', () => {
    if (!disclosure.open) return;
    positionMenu();
    const current = menu.querySelector('[aria-current]');
    if (current) {
      const overflow = current.getBoundingClientRect().bottom - menu.getBoundingClientRect().bottom;
      if (overflow > 0) menu.scrollTop += overflow + 8;
    }
  });
  window.addEventListener('resize', measureGutter);
  window.addEventListener('scroll', positionMenu, {passive:true});
  measureGutter();
})();
