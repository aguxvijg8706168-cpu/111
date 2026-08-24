/**
 * 数字书信 / 网页展信交互脚本
 * Letters & Photography Collection Script
 */

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initReadingProgress();
  initImageAspectRatios();
  initLightbox();
  initAudioPlayer();
  initSmoothScroll();
});

/**
 * 1. 视口滚动进入动画 (IntersectionObserver)
 */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal-item');
  if (!revealElements.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    });

    revealElements.forEach(el => observer.observe(el));
  } else {
    // Fallback for older browsers
    revealElements.forEach(el => el.classList.add('is-revealed'));
  }
}

/**
 * 2. 页面顶部阅读进度条
 */
function initReadingProgress() {
  const progressBar = document.getElementById('readingProgress');
  if (!progressBar) return;

  let ticking = false;

  const updateProgress = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (scrollHeight > 0) {
      const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
      progressBar.style.width = ${progress}%;
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }, { passive: true });
}

/**
 * 3. 智能检测每张图片的原始比例并标记类名
 */
function initImageAspectRatios() {
  const images = document.querySelectorAll('.photo-img');

  images.forEach(img => {
    const applyRatioClass = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (!w || !h) return;

      const ratio = w / h;
      const card = img.closest('.photo-card');
      if (!card) return;

      if (ratio > 1.25) {
        card.classList.add('photo--landscape');
      } else if (ratio < 0.6) {
        card.classList.add('photo--tall');
      } else if (ratio < 0.88) {
        card.classList.add('photo--portrait');
      } else {
        card.classList.add('photo--square');
      }
    };

    if (img.complete && img.naturalWidth > 0) {
      applyRatioClass();
    } else {
      img.addEventListener('load', applyRatioClass, { once: true });
    }
  });
}

/**
 * 4. 照片 Lightbox 全屏预览
 */
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const photoCards = document.querySelectorAll('.photo-card');

  if (!lightbox || !lightboxImg) return;

  const openLightbox = (card) => {
    const img = card.querySelector('.photo-img');
    const captionEl = card.querySelector('.photo-caption');
    const index = card.getAttribute('data-index') || '';

    if (!img) return;

    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || Photo ;
    lightboxCounter.textContent = index ? ${String(index).padStart(2, '0')} / 28 : '';
    lightboxCaption.textContent = captionEl ? captionEl.textContent.replace(/^\d+\s*\/\s*\d+\s*·?\s*/, '') : '';

    lightbox.classList.add('is-active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    lightbox.classList.remove('is-active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (!lightbox.classList.contains('is-active')) {
        lightboxImg.src = '';
      }
    }, 350);
  };

  photoCards.forEach(card => {
    card.addEventListener('click', () => openLightbox(card));
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-active')) {
      closeLightbox();
    }
  });
}

/**
 * 5. 背景音乐控制器 (非自动播放，温和淡入)
 */
function initAudioPlayer() {
  const audioBtn = document.getElementById('audioBtn');
  const audio = document.getElementById('bgmAudio');
  const audioLabel = document.getElementById('audioLabel');

  if (!audioBtn || !audio) return;

  let isPlaying = false;

  audio.addEventListener('error', () => {
    // Graceful silent fallback if audio not found
    const widget = document.getElementById('audioWidget');
    if (widget) widget.style.display = 'none';
  });

  audioBtn.addEventListener('click', () => {
    if (isPlaying) {
      audio.pause();
      audioBtn.classList.remove('is-playing');
      audioBtn.setAttribute('aria-label', '播放背景音乐');
      if (audioLabel) audioLabel.textContent = '音乐';
      isPlaying = false;
    } else {
      audio.play().then(() => {
        audioBtn.classList.add('is-playing');
        audioBtn.setAttribute('aria-label', '暂停背景音乐');
        if (audioLabel) audioLabel.textContent = '暂停';
        isPlaying = true;
      }).catch(err => {
        console.warn('Audio playback waiting for interaction:', err);
      });
    }
  });
}

/**
 * 6. 平滑滚动到信件内容
 */
function initSmoothScroll() {
  const btn = document.getElementById('btnOpenLetter');
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById('letterStart');
    if (target) {
      const topOffset = target.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({
        top: topOffset,
        behavior: 'smooth'
      });
    }
  });
}
