/* Both ordinary thumbnails and opt-in previews use the same player factory. */
(() => {
  function createPlayer(id, title) {
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    const frame = document.createElement('iframe');
    frame.title = title;
    // Playback follows a student's selection, without playlist or time offsets.
    frame.src = `https://www.youtube.com/embed/${id}?rel=0&playsinline=1&autoplay=1`;
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    return frame;
  }

  const mode = new URL(window.location.href).searchParams.get('videoPreview');
  document.querySelectorAll('.im1-video-section').forEach(section => {
    if (section.hasAttribute('data-video-preview') && ['modal', 'inline'].includes(mode)
        && window.BatchMathVideoPreview) {
      window.BatchMathVideoPreview.init(section, mode, createPlayer);
      return;
    }
    section.querySelectorAll('.video-play').forEach(button => {
      button.addEventListener('click', () => {
        const box = button.closest('.video-embed');
        const title = box.closest('.video-item').querySelector('.video-title').textContent;
        const frame = createPlayer(box.dataset.videoId, title);
        if (!frame) return;
        box.replaceChildren(frame);
        frame.focus();
      }, { once: true });
    });
  });
})();
