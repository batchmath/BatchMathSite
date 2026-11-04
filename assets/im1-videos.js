/* Load a YouTube player only after the student activates its thumbnail. */
document.querySelectorAll('.im1-video-section .video-play').forEach(button => {
  button.addEventListener('click', () => {
    const box = button.closest('.video-embed');
    const id = box.dataset.videoId;
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;
    const frame = document.createElement('iframe');
    frame.title = box.closest('.video-item').querySelector('.video-title').textContent;
    // User-requested playback starts at the beginning; no playlist or time offsets.
    frame.src = `https://www.youtube.com/embed/${id}?rel=0&playsinline=1&autoplay=1`;
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    box.replaceChildren(frame);
    frame.focus();
  }, { once: true });
});
