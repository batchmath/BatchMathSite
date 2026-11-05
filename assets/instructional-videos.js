/* BatchMath's permanent, per-collection video standard. See docs/VIDEO-PRESENTATION-STANDARD.md. */
(() => {
  let modal;
  let activeButton = null;
  let scrollStyles = null;

  function createPlayer(box) {
    const id = box.dataset.videoId;
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    const source = box.dataset.videoSrc || `https://www.youtube.com/embed/${id}?rel=0&playsinline=1`;
    const url = new URL(source, window.location.href);
    if (!['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com'].includes(url.hostname)
        || url.protocol !== 'https:' || url.pathname !== `/embed/${id}`) return null;
    // Preserve intentional existing playback parameters; autoplay follows a click only.
    url.searchParams.set('autoplay', '1');
    const frame = document.createElement('iframe');
    frame.src = url.href;
    frame.title = box.dataset.playerTitle || box.closest('.video-item').querySelector('.video-title').textContent;
    frame.allow = box.dataset.playerAllow || 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    frame.referrerPolicy = box.dataset.playerReferrerpolicy || 'strict-origin-when-cross-origin';
    if (box.dataset.playerLoading) frame.loading = box.dataset.playerLoading;
    return frame;
  }

  function fitModal() {
    if (!modal?.open) return;
    const view = window.visualViewport;
    const maxWidth = Math.min(1600, (view?.width || window.innerWidth) - 24);
    const maxHeight = (view?.height || window.innerHeight) - 24;
    const style = getComputedStyle(modal);
    const header = modal.querySelector('.bm-video-player-header');
    const number = value => parseFloat(value) || 0;
    const horizontal = number(style.paddingLeft) + number(style.paddingRight) + number(style.borderLeftWidth) + number(style.borderRightWidth);
    const vertical = number(style.paddingTop) + number(style.paddingBottom) + number(style.borderTopWidth) + number(style.borderBottomWidth);
    modal.style.width = `${maxWidth}px`;
    // Title wrapping can change the header height as the player gets narrower.
    for (let pass = 0; pass < 4; pass++) {
      const overhead = header.getBoundingClientRect().height + number(getComputedStyle(header).marginBottom) + vertical;
      const width = Math.min(maxWidth, Math.max(0, maxHeight - overhead) * 16 / 9 + horizontal);
      modal.style.width = `${width}px`;
    }
  }

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('dialog');
    modal.className = 'bm-video-player bm-video-dialog';
    modal.id = 'bm-instructional-video-player';
    modal.setAttribute('aria-labelledby', 'bm-instructional-video-title');
    const header = document.createElement('div');
    header.className = 'bm-video-player-header';
    const title = document.createElement('h2');
    title.id = 'bm-instructional-video-title';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'bm-video-player-close';
    close.textContent = 'Close ×';
    close.setAttribute('aria-label', 'Close video');
    header.append(title, close);
    const screen = document.createElement('div');
    screen.className = 'bm-video-player-frame';
    modal.append(header, screen);
    document.body.append(modal);
    close.addEventListener('click', () => modal.close());
    modal.addEventListener('cancel', event => {
      event.preventDefault();
      modal.close();
    });
    modal.addEventListener('click', event => {
      if (event.target !== modal) return;
      const rect = modal.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right
          || event.clientY < rect.top || event.clientY > rect.bottom) modal.close();
    });
    modal.addEventListener('close', () => {
      screen.replaceChildren(); // Detaching the player stops video and audio.
      if (scrollStyles) {
        document.documentElement.style.overflow = scrollStyles.html;
        document.body.style.overflow = scrollStyles.body;
        scrollStyles = null;
      }
      if (activeButton) {
        activeButton.closest('.video-item').classList.remove('bm-video-selected');
        activeButton.focus({ preventScroll: true });
        activeButton = null;
      }
    });
    window.addEventListener('resize', fitModal);
    window.visualViewport?.addEventListener('resize', fitModal);
    return modal;
  }

  document.querySelectorAll('[data-bm-videos]').forEach(grid => {
    const cards = [...grid.children].filter(child => child.classList.contains('video-item'));
    // A designated supporting collection always uses the modal, independently
    // of its size. Unmarked collections and lecture groups retain the count rule.
    const layout = grid.dataset.videoRole === 'supporting' || cards.length >= 3 ? 'gallery' : cards.length === 2 ? 'pair' : 'large';
    grid.dataset.videoLayout = layout;
    grid.dataset.videoCount = String(cards.length);
    if (layout === 'gallery') {
      ensureModal();
      for (const button of grid.querySelectorAll('.video-play')) {
        button.setAttribute('aria-haspopup', 'dialog');
        button.setAttribute('aria-controls', modal.id);
      }
    }
    grid.addEventListener('click', event => {
      const button = event.target.closest('.video-play');
      if (!button || !grid.contains(button)) return;
      const box = button.closest('.video-embed');
      const frame = createPlayer(box);
      if (!frame) return;
      if (layout !== 'gallery') {
        box.replaceChildren(frame);
        frame.focus();
        return;
      }
      if (activeButton) activeButton.closest('.video-item').classList.remove('bm-video-selected');
      activeButton = button;
      button.closest('.video-item').classList.add('bm-video-selected');
      modal.querySelector('h2').textContent = button.closest('.video-item').querySelector('.video-title').textContent;
      modal.querySelector('.bm-video-player-frame').replaceChildren(frame);
      if (!modal.open) {
        scrollStyles = { html: document.documentElement.style.overflow, body: document.body.style.overflow };
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        modal.showModal();
      }
      fitModal();
      modal.querySelector('button').focus({ preventScroll: true });
    });
  });
})();
