/* Opt-in comparison: one gallery and one player, with two ways to expand it. */
window.BatchMathVideoPreview = {
  init(section, mode, createPlayer) {
    const grid = section.querySelector('.video-grid');
    const buttons = [...grid.querySelectorAll('.video-play')];
    const modal = mode === 'modal';
    const key = section.getAttribute('aria-labelledby') || 'video-preview';

    const switcher = document.createElement('nav');
    switcher.className = 'bm-video-mode-switcher';
    switcher.setAttribute('aria-label', 'Compare video layouts');
    const label = document.createElement('p');
    label.className = 'bm-video-mode-label';
    label.textContent = 'Compare video layouts';
    switcher.append(label);
    for (const [value, title] of [['modal', 'Version A — Pop-up Player'], ['inline', 'Version B — In-Page Player']]) {
      const link = document.createElement('a');
      const url = new URL(window.location.href);
      url.searchParams.set('videoPreview', value);
      link.href = url.href;
      link.textContent = title;
      if (value === mode) link.setAttribute('aria-current', 'page');
      switcher.append(link);
    }
    grid.before(switcher);

    const panel = document.createElement(modal ? 'dialog' : 'section');
    panel.id = `${key}-player`;
    panel.className = `bm-video-player ${modal ? 'bm-video-dialog' : 'bm-video-inline'}`;
    panel.setAttribute('aria-labelledby', `${key}-player-title`);
    if (!modal) panel.hidden = true;
    const header = document.createElement('div');
    header.className = 'bm-video-player-header';
    const title = document.createElement('h3');
    title.id = `${key}-player-title`;
    title.tabIndex = -1;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'bm-video-player-close';
    close.textContent = 'Close ×';
    close.setAttribute('aria-label', 'Close video');
    header.append(title, close);
    const screen = document.createElement('div');
    screen.className = 'bm-video-player-frame';
    panel.append(header, screen);
    if (modal) section.append(panel);
    else grid.before(panel);

    let selected = null;
    let scrollStyles = null;
    function resetSelection() {
      for (const button of buttons) {
        button.closest('.video-item').classList.remove('bm-video-selected');
        if (!modal) button.setAttribute('aria-expanded', 'false');
      }
    }
    function cleanup() {
      // Removing the iframe terminates playback instead of merely hiding it.
      screen.replaceChildren();
      if (!modal) panel.hidden = true;
      if (scrollStyles) {
        document.documentElement.style.overflow = scrollStyles.html;
        document.body.style.overflow = scrollStyles.body;
        scrollStyles = null;
      }
      resetSelection();
      if (selected) {
        selected.focus({ preventScroll: true });
        if (!modal) selected.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      }
      selected = null;
    }
    function closePlayer() {
      if (modal) panel.close();
      else cleanup();
    }
    close.addEventListener('click', closePlayer);
    if (modal) {
      panel.addEventListener('close', cleanup);
      panel.addEventListener('cancel', event => {
        event.preventDefault();
        closePlayer();
      });
      panel.addEventListener('click', event => {
        if (event.target !== panel) return;
        const rect = panel.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right
            || event.clientY < rect.top || event.clientY > rect.bottom) closePlayer();
      });
    }

    for (const button of buttons) {
      button.setAttribute('aria-controls', panel.id);
      if (modal) button.setAttribute('aria-haspopup', 'dialog');
      else button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', () => {
        const card = button.closest('.video-item');
        const videoTitle = card.querySelector('.video-title').textContent;
        const frame = createPlayer(card.querySelector('[data-video-id]').dataset.videoId, videoTitle);
        if (!frame) return;
        resetSelection();
        selected = button;
        card.classList.add('bm-video-selected');
        title.textContent = videoTitle;
        // Replacing this sole player also stops the previously selected video.
        screen.replaceChildren(frame);
        if (modal) {
          scrollStyles = { html: document.documentElement.style.overflow, body: document.body.style.overflow };
          document.documentElement.style.overflow = 'hidden';
          document.body.style.overflow = 'hidden';
          panel.showModal();
          close.focus({ preventScroll: true });
        } else {
          panel.hidden = false;
          button.setAttribute('aria-expanded', 'true');
          title.focus({ preventScroll: true });
          const rect = panel.getBoundingClientRect();
          if (rect.top < 0 || rect.bottom > window.innerHeight) {
            panel.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
          }
        }
      });
    }
    section.setAttribute('data-video-preview-active', mode);
  }
};
