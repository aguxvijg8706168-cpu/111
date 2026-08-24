/**
 * 数字书信 · 展信“嘉” · 交互与旅途照片列车脚本
 * Digital Letter & Photo Train Experience Script
 */

(function() {
  'use strict';

  // 28 张照片元数据（预设原始宽高比与旅行标签，杜绝布局抖动）
  const PHOTO_ITEMS = [
    { id: 1,  ratio: 0.7505, tag: "CHONGQING" },
    { id: 2,  ratio: 0.7500, tag: "DISTANCE" },
    { id: 3,  ratio: 1.7778, tag: "HORIZON" },
    { id: 4,  ratio: 0.4441, tag: "FOOTSTEPS" },
    { id: 5,  ratio: 0.4500, tag: "COURAGE" },
    { id: 6,  ratio: 0.7500, tag: "STREETS" },
    { id: 7,  ratio: 1.4972, tag: "BEIJING" },
    { id: 8,  ratio: 1.7778, tag: "SUNSET" },
    { id: 9,  ratio: 0.7500, tag: "MOMENTS" },
    { id: 10, ratio: 1.3333, tag: "NIGHT" },
    { id: 11, ratio: 1.4972, tag: "WILDERNESS" },
    { id: 12, ratio: 0.4441, tag: "EXPLORE" },
    { id: 13, ratio: 1.5259, tag: "TIBET" },
    { id: 14, ratio: 1.3333, tag: "MOUNTAINS" },
    { id: 15, ratio: 1.0000, tag: "QUIET" },
    { id: 16, ratio: 0.7500, tag: "SNOW" },
    { id: 17, ratio: 1.9685, tag: "RUSSIA" },
    { id: 18, ratio: 1.7778, tag: "JOURNEY" },
    { id: 19, ratio: 0.7500, tag: "DIALOGUE" },
    { id: 20, ratio: 0.5627, tag: "WILD FLOWER" },
    { id: 21, ratio: 1.7778, tag: "LAKE" },
    { id: 22, ratio: 0.7500, tag: "REFLECTION" },
    { id: 23, ratio: 1.7778, tag: "MOUNTAIN RANGE" },
    { id: 24, ratio: 0.7500, tag: "WANDER" },
    { id: 25, ratio: 0.6634, tag: "FAITH" },
    { id: 26, ratio: 1.7778, tag: "SKY" },
    { id: 27, ratio: 0.7500, tag: "GLACIER" },
    { id: 28, ratio: 0.4500, tag: "EPILOGUE" }
  ];

  // 全局交互状态
  let currentLightboxIndex = 0;
  let isTrainVisible = false;
  let trainAutoPlay = true;
  let trainOffset = 0;
  let trainSpeed = 0.6; // 平稳慢速移动
  let isDragging = false;
  let startX = 0;
  let dragStartOffset = 0;
  let singleLoopWidth = 0;
  let isMobile = window.innerWidth <= 768;

  document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initReadingProgress();
    initStationeryPaper();
    buildPhotoTrain();
    initTrainMotion();
    initLightbox();
    initAudioPlayer();
    initSmoothScroll();
    startBackgroundPreload();
  });

  window.addEventListener('resize', () => {
    isMobile = window.innerWidth <= 768;
    calculateTrackMetrics();
  });

  /**
   * 1. 视口滚动显现动画
   */
  function initScrollReveal() {
    const revealItems = document.querySelectorAll('.reveal-item');
    if (!revealItems.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            obs.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -40px 0px', threshold: 0.08 });

      revealItems.forEach(item => observer.observe(item));
    } else {
      revealItems.forEach(item => item.classList.add('is-revealed'));
    }
  }

  /**
   * 2. 顶部阅读进度条
   */
  function initReadingProgress() {
    const bar = document.getElementById('readingProgress');
    if (!bar) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const top = window.scrollY || document.documentElement.scrollTop;
          const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
          if (height > 0) {
            const percent = Math.min(100, Math.max(0, (top / height) * 100));
            bar.style.width = percent + '%';
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /**
   * 3. 信纸展开与呼吸微动效
   */
  function initStationeryPaper() {
    const paper = document.getElementById('stationeryPaper');
    if (!paper) return;

    // 首屏进场微动效
    setTimeout(() => {
      paper.style.transform = 'translateY(0)';
      paper.style.opacity = '1';
    }, 150);
  }

  /**
   * 4. 构建旅途照片列车车厢卡片（双组循环以实现无缝无限滚动）
   */
  function buildPhotoTrain() {
    const track = document.getElementById('trainTrack');
    if (!track) return;

    // 清空轨道
    track.innerHTML = '';

    // 双组照片构建无缝循环
    const createCard = (item, groupIndex) => {
      const card = document.createElement('div');
      card.className = 'train-card is-loading';
      card.setAttribute('data-id', item.id);
      card.setAttribute('data-index', item.id);

      // 根据设备与比例精确计算固定高度与宽度，杜绝布局抖动
      const baseHeight = isMobile ? 260 : 320;
      const cardWidth = Math.round(baseHeight * item.ratio);

      const frame = document.createElement('div');
      frame.className = 'train-photo-frame';
      frame.style.width = cardWidth + 'px';
      frame.style.height = baseHeight + 'px';
      frame.style.aspectRatio = item.ratio;

      const img = document.createElement('img');
      img.className = 'train-img';
      img.alt = 'Memory ' + item.id + ' · ' + item.tag;
      img.loading = 'lazy';
      
      // 优先加载经过极致压缩的高清 web 格式
      const webPath = 'assets/photos/web/' + item.id + '.jpg';
      const origPath = 'assets/photos/' + item.id + '.jpg';

      img.src = webPath;
      img.onerror = () => { img.src = origPath; };
      img.onload = () => {
        card.classList.remove('is-loading');
        card.classList.add('is-loaded');
      };

      frame.appendChild(img);

      // 底栏信息
      const footer = document.createElement('div');
      footer.className = 'train-card-footer';

      const idxEl = document.createElement('span');
      idxEl.className = 'train-card-index';
      idxEl.textContent = 'NO. ' + String(item.id).padStart(2, '0');

      const tagEl = document.createElement('span');
      tagEl.className = 'train-card-tag';
      tagEl.textContent = item.tag;

      footer.appendChild(idxEl);
      footer.appendChild(tagEl);

      card.appendChild(frame);
      card.appendChild(footer);

      // 点击打开全屏 Lightbox
      card.addEventListener('click', (e) => {
        if (!isDragging) {
          openLightbox(item.id - 1);
        }
      });

      return card;
    };

    // 渲染第一组与第二组（用于无缝衔接）
    PHOTO_ITEMS.forEach(item => track.appendChild(createCard(item, 0)));
    PHOTO_ITEMS.forEach(item => track.appendChild(createCard(item, 1)));

    // 计算循环宽度
    setTimeout(calculateTrackMetrics, 200);
  }

  /**
   * 计算轨道度量与单循环宽度
   */
  function calculateTrackMetrics() {
    const track = document.getElementById('trainTrack');
    if (!track) return;
    const cards = track.querySelectorAll('.train-card');
    if (cards.length >= 28) {
      let width = 0;
      const gap = isMobile ? 18 : 28;
      for (let i = 0; i < 28; i++) {
        width += cards[i].offsetWidth + gap;
      }
      singleLoopWidth = width;
    }
  }

  /**
   * 5. 照片列车动画与拖拽交互
   */
  function initTrainMotion() {
    const section = document.getElementById('trainSection');
    const viewport = document.getElementById('trainViewport');
    const track = document.getElementById('trainTrack');
    const prevBtn = document.getElementById('trainPrevBtn');
    const nextBtn = document.getElementById('trainNextBtn');

    if (!section || !viewport || !track) return;

    // 监听列车进入视口时才启动动画
    if ('IntersectionObserver' in window) {
      const trainObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isTrainVisible = entry.isIntersecting;
        });
      }, { threshold: 0.05 });
      trainObserver.observe(section);
    } else {
      isTrainVisible = true;
    }

    // requestAnimationFrame 驱动的平滑移动
    const animate = () => {
      if (isTrainVisible && trainAutoPlay && !isDragging) {
        trainOffset += trainSpeed;
        if (singleLoopWidth > 0 && trainOffset >= singleLoopWidth) {
          trainOffset = 0;
        }
        track.style.transform = 'translate3d(-' + trainOffset.toFixed(2) + 'px, 0, 0)';
      }
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    // 悬停 / 移入时暂停
    viewport.addEventListener('mouseenter', () => { trainAutoPlay = false; });
    viewport.addEventListener('mouseleave', () => { if (!isDragging) trainAutoPlay = true; });

    // 鼠标拖拽控制
    let dragThreshold = false;

    const onPointerDown = (pageX) => {
      isDragging = false;
      dragThreshold = false;
      startX = pageX;
      dragStartOffset = trainOffset;
      trainAutoPlay = false;
    };

    const onPointerMove = (pageX) => {
      const dx = pageX - startX;
      if (Math.abs(dx) > 6) {
        isDragging = true;
        dragThreshold = true;
      }
      if (dragThreshold) {
        trainOffset = dragStartOffset - dx;
        if (singleLoopWidth > 0) {
          if (trainOffset < 0) trainOffset += singleLoopWidth;
          if (trainOffset >= singleLoopWidth) trainOffset -= singleLoopWidth;
        }
        track.style.transform = 'translate3d(-' + trainOffset.toFixed(2) + 'px, 0, 0)';
      }
    };

    const onPointerUp = () => {
      setTimeout(() => { isDragging = false; }, 50);
      trainAutoPlay = true;
    };

    // 鼠标事件
    viewport.addEventListener('mousedown', (e) => onPointerDown(e.pageX));
    window.addEventListener('mousemove', (e) => { if (startX !== 0) onPointerMove(e.pageX); });
    window.addEventListener('mouseup', () => { if (startX !== 0) { startX = 0; onPointerUp(); } });

    // 触控事件 (移动端与微信浏览器优化)
    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) onPointerDown(e.touches[0].pageX);
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) onPointerMove(e.touches[0].pageX);
    }, { passive: true });

    viewport.addEventListener('touchend', () => {
      startX = 0;
      onPointerUp();
    });

    // 左右按钮控制
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        trainOffset = Math.max(0, trainOffset - 360);
        if (trainOffset < 0 && singleLoopWidth > 0) trainOffset += singleLoopWidth;
        track.style.transform = 'translate3d(-' + trainOffset.toFixed(2) + 'px, 0, 0)';
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        trainOffset += 360;
        if (singleLoopWidth > 0 && trainOffset >= singleLoopWidth) trainOffset -= singleLoopWidth;
        track.style.transform = 'translate3d(-' + trainOffset.toFixed(2) + 'px, 0, 0)';
      });
    }
  }

  /**
   * 6. Lightbox 全屏画廊大图查看器
   */
  function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const closeBtn = document.getElementById('lightboxClose');
    const backdrop = document.getElementById('lightboxBackdrop');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');

    if (!lightbox) return;

    const closeLightbox = () => {
      lightbox.classList.remove('is-active');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      const img = document.getElementById('lightboxImg');
      if (img) {
        setTimeout(() => { img.src = ''; }, 300);
      }
    };

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (backdrop) backdrop.addEventListener('click', closeLightbox);

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(-1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(1);
      });
    }

    window.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });
  }

  function openLightbox(index) {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImg');
    const counter = document.getElementById('lightboxCounter');
    const caption = document.getElementById('lightboxCaption');

    if (!lightbox || !img || index < 0 || index >= PHOTO_ITEMS.length) return;

    currentLightboxIndex = index;
    const item = PHOTO_ITEMS[index];

    // 全屏展示优先加载高清原图（若无则加载优化图）
    img.src = 'assets/photos/' + item.id + '.jpg';
    img.onerror = () => { img.src = 'assets/photos/web/' + item.id + '.jpg'; };

    if (counter) counter.textContent = 'NO. ' + String(item.id).padStart(2, '0') + ' / 28';
    if (caption) caption.textContent = item.tag;

    lightbox.classList.add('is-active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function navigateLightbox(delta) {
    let next = currentLightboxIndex + delta;
    if (next < 0) next = PHOTO_ITEMS.length - 1;
    if (next >= PHOTO_ITEMS.length) next = 0;
    openLightbox(next);
  }

  /**
   * 7. 背景音乐控制器 (非自动播放，温和淡入)
   */
  function initAudioPlayer() {
    const btn = document.getElementById('audioBtn');
    const audio = document.getElementById('bgmAudio');
    const label = document.getElementById('audioLabel');

    if (!btn || !audio) return;

    let isPlaying = false;

    audio.addEventListener('error', () => {
      const widget = document.getElementById('audioWidget');
      if (widget) widget.style.display = 'none';
    });

    btn.addEventListener('click', () => {
      if (isPlaying) {
        audio.pause();
        btn.classList.remove('is-playing');
        btn.setAttribute('aria-label', '播放背景音乐');
        if (label) label.textContent = '♪ 音乐';
        isPlaying = false;
      } else {
        audio.play().then(() => {
          btn.classList.add('is-playing');
          btn.setAttribute('aria-label', '暂停背景音乐');
          if (label) label.textContent = '暂停';
          isPlaying = true;
        }).catch(err => {
          console.warn('Audio waiting for interaction:', err);
        });
      }
    });
  }

  /**
   * 8. 平滑滚动到照片列车
   */
  function initSmoothScroll() {
    const btn = document.getElementById('btnScrollTrain');
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('trainSection');
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - 10;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  }

  /**
   * 9. 后台静默并发预加载机制（在用户阅读信件的数秒内预热缓存）
   */
  function startBackgroundPreload() {
    // 延迟 800ms，优先保证信纸渲染与首屏帧率
    setTimeout(() => {
      let index = 0;
      const batchSize = 3;

      function loadNextBatch() {
        if (index >= PHOTO_ITEMS.length) return;
        const currentBatch = PHOTO_ITEMS.slice(index, index + batchSize);
        index += batchSize;

        let loadedCount = 0;
        currentBatch.forEach(item => {
          const preImg = new Image();
          preImg.onload = preImg.onerror = () => {
            loadedCount++;
            if (loadedCount >= currentBatch.length) {
              // 稍作微小节流后加载下一批
              setTimeout(loadNextBatch, 80);
            }
          };
          preImg.src = 'assets/photos/web/' + item.id + '.jpg';
        });
      }

      loadNextBatch();
    }, 800);
  }

})();
