/* Shared topic disclosure and engagement for site resources. */
(() => {
  'use strict';

  const courseButton = document.querySelector('.topbar .menu-toggle[aria-controls="course-menu"]');
  const courseMenu = document.getElementById('course-menu');
  if (courseButton && courseMenu) {
    const syncCourseMenu = () => courseButton.setAttribute('aria-expanded', String(courseMenu.classList.contains('open')));
    new MutationObserver(syncCourseMenu).observe(courseMenu, {attributes: true, attributeFilter: ['class']});
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !courseMenu.classList.contains('open')) return;
      event.preventDefault();
      courseMenu.classList.remove('open');
      courseButton.focus({preventScroll: true});
    });
  }

  const topics = document.querySelector('.bm-topics');
  if (topics) {
    const summary = topics.querySelector('summary');
    const panel = topics.querySelector('.bm-topics-panel');
    const portrait = document.querySelector('.topbar > img.corner, .topbar > img.corner-person');
    const main = topics.closest('main');
    const viewport = window.visualViewport;
    const desktop = window.matchMedia('(min-width: 1200px) and (min-height: 350px)');
    let frame = 0;
    let fixed = false;
    let left = 12;
    let headerTop = 12;

    function paint() {
      frame = 0;
      if (fixed) topics.style.setProperty('--bm-topics-top', Math.max(12, headerTop - window.scrollY) + 'px');
    }

    function position() {
      const gutter = main.getBoundingClientRect().left;
      const image = portrait?.getBoundingClientRect();
      left = image ? image.left + (image.width - 110) / 2 : 12;
      const panelWidth = gutter - left - 10;
      fixed = desktop.matches && panelWidth >= 156 && (viewport?.scale ?? 1) <= 1;
      headerTop = courseButton ? courseButton.getBoundingClientRect().top + window.scrollY : 12;
      topics.classList.toggle('bm-topics-fixed', fixed);
      if (!fixed) return;
      topics.style.setProperty('--bm-topics-left', left + 'px');
      topics.style.setProperty('--bm-topics-width', Math.min(352, panelWidth) + 'px');
      paint();
    }

    function close({restoreFocus = false} = {}) {
      if (!topics.open) return;
      topics.open = false;
      if (restoreFocus) summary.focus({preventScroll: true});
    }

    document.addEventListener('pointerdown', event => {
      if (!topics.contains(event.target)) close();
    }, true);
    document.addEventListener('focusin', event => {
      if (!topics.contains(event.target)) close();
    });
    topics.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !topics.open) return;
      event.preventDefault();
      event.stopPropagation();
      close({restoreFocus: true});
    });
    panel.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (link) close({restoreFocus: link.getAttribute('aria-current') === 'page'});
    });
    topics.addEventListener('toggle', () => {
      if (!topics.open) return;
      if (!fixed) panel.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: 'instant'});
      panel.querySelector('[aria-current]')?.scrollIntoView({
        block: 'nearest', inline: 'nearest', container: 'nearest', behavior: 'instant',
      });
    });
    window.addEventListener('resize', position, {passive: true});
    viewport?.addEventListener('resize', position, {passive: true});
    window.addEventListener('scroll', () => {
      if (fixed && !frame) frame = requestAnimationFrame(paint);
    }, {passive: true});
    window.addEventListener('pageshow', position);
    position();
  }

  const resourceTypes = {
    assignment: ['assignment', 'pdf'], 'answer-key': ['answer_key', 'pdf'],
    practice: ['practice', 'practice_engine'], 'related-practice': ['related_practice', 'practice_engine'],
    lesson: ['lesson', 'instruction'], topic: ['topic', 'instruction'],
    'next-topic': ['next_topic', 'instruction'], unit: ['unit', 'course_navigation'],
    'exam-prep': ['exam_prep', 'instruction'], frq: ['frq', 'exam_resource'],
    scoring: ['scoring', 'exam_resource'], playlist: ['playlist', 'instruction'],
    video: ['video_open', 'video'],
  };
  const courseNames = {
    'ap-calculus': 'ap_calculus_ab', im1: 'im1', 'calculus-prep': 'calculus_prep',
    'sat-act-math': 'sat_act_math',
  };
  function trackResource(event) {
    if ((event.type === 'auxclick' && event.button !== 1) || typeof window.gtag !== 'function' ||
        navigator.onLine === false) return;
    const element = event.target.closest?.('[data-bm-engagement], a[data-bm-resource], .video-play');
    if (!element) return;
    const kind = element.dataset.bmEngagement || element.dataset.bmResource ||
      (element.closest('.video-embed[data-video-id]') && 'video');
    if (!Object.hasOwn(resourceTypes, kind)) return;
    const [resourceType, destinationCategory] = resourceTypes[kind];
    // Use the site's static curriculum slugs and an allowlist of resource categories.
    // Link URLs, query values, student input and question text are never read into the event.
    const route = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
    const match = route.match(/^https:\/\/batchmath\.net\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?(?:\/|$)/);
    const course = courseNames[match?.[1]] || 'batchmath';
    const unit = match?.[2]?.match(/^unit-(\d+)-/)?.[1];
    const topic = route.match(/\/topics\/(?:[a-d]-[^/]+\/)?([a-z0-9-]+)\//)?.[1] ||
      (course === 'calculus_prep' ? match?.[2] : '');
    const params = {resource_type: resourceType, destination_category: destinationCategory, course};
    if (unit) params.unit = unit;
    if (topic) params.topic = topic.slice(0, 100);
    window.gtag('event', 'resource_click', params);
  }
  document.addEventListener('click', trackResource, true);
  document.addEventListener('auxclick', trackResource, true);
})();
