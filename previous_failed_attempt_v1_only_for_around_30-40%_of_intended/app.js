/**
 * Kotoha Fansite v2 - Interactive Application Engine
 * CDNs utilized: GSAP, ScrollTrigger, Lenis, Anime.js, Howler.js, Canvas-Confetti, Lucide
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  /* ==========================================================================
     1. Sound System (Howler.js + Web Audio API Synthesis)
     ========================================================================== */
  const SoundSystem = (() => {
    let isMuted = false;
    let audioCtx = null;

    function getAudioContext() {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioCtx = new AudioContext();
        }
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }

    // Cute bubble pop sound
    function playPop() {
      if (isMuted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } catch (e) {
        console.warn(e);
      }
    }

    // Sparkle chime sound
    function playChime() {
      if (isMuted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          const now = ctx.currentTime + idx * 0.06;
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.25);
        });
      } catch (e) {
        console.warn(e);
      }
    }

    // Celebration fanfare
    function playFanfare() {
      if (isMuted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        chords.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const now = ctx.currentTime + idx * 0.04;
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.4);
        });
      } catch (e) {
        console.warn(e);
      }
    }

    // Discography short melodic sample synthesizer
    let currentSampleTimeout = null;
    function playTrackSample(type) {
      if (isMuted) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      
      let melody = [];
      if (type === 'sample1') {
        // 絶対称賛！ Energetic idol arpeggio
        melody = [
          { f: 587.33, t: 0.0 }, { f: 659.25, t: 0.12 }, { f: 783.99, t: 0.24 }, 
          { f: 880.00, t: 0.36 }, { f: 1046.50, t: 0.50 }, { f: 1174.66, t: 0.70 }
        ];
      } else if (type === 'sample2') {
        // 可愛くてごめん Sweet playful melody
        melody = [
          { f: 659.25, t: 0.0 }, { f: 587.33, t: 0.12 }, { f: 659.25, t: 0.24 }, 
          { f: 783.99, t: 0.38 }, { f: 880.00, t: 0.52 }, { f: 1046.50, t: 0.75 }
        ];
      } else {
        // Lily's Garden Duo harmony
        melody = [
          { f: 523.25, t: 0.0 }, { f: 659.25, t: 0.14 }, { f: 783.99, t: 0.28 }, 
          { f: 987.77, t: 0.45 }, { f: 1046.50, t: 0.65 }
        ];
      }

      const now = ctx.currentTime;
      melody.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + n.t);
        gain.gain.setValueAtTime(0.2, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.t);
        osc.stop(now + n.t + 0.3);
      });
    }

    function toggleMute() {
      isMuted = !isMuted;
      updateSoundIcons();
      if (!isMuted) {
        playPop();
      }
      return isMuted;
    }

    function updateSoundIcons() {
      const desktopIcon = document.getElementById('sound-icon');
      const mobileIcon = document.getElementById('sound-icon-mobile');
      const iconName = isMuted ? 'volume-x' : 'volume-2';
      
      if (desktopIcon) desktopIcon.setAttribute('data-lucide', iconName);
      if (mobileIcon) mobileIcon.setAttribute('data-lucide', iconName);
      if (window.lucide) window.lucide.createIcons();
    }

    return {
      playPop,
      playChime,
      playFanfare,
      playTrackSample,
      toggleMute,
      isMuted: () => isMuted
    };
  })();

  // Sound Toggle buttons
  const soundBtnDesktop = document.getElementById('sound-toggle-btn');
  const soundBtnMobile = document.getElementById('sound-toggle-mobile');
  if (soundBtnDesktop) soundBtnDesktop.addEventListener('click', () => SoundSystem.toggleMute());
  if (soundBtnMobile) soundBtnMobile.addEventListener('click', () => SoundSystem.toggleMute());

  /* ==========================================================================
     2. Canvas-Confetti Trigger Functions
     ========================================================================== */
  function fireConfetti(x = 0.5, y = 0.5) {
    SoundSystem.playFanfare();
    if (typeof confetti !== 'function') return;

    try {
      const cloverShape = confetti.shapeFromText({ text: '🍀', scalar: 2 });
      const heartShape = confetti.shapeFromText({ text: '💖', scalar: 2 });
      const starShape = confetti.shapeFromText({ text: '⭐', scalar: 2 });

      confetti({
        particleCount: 45,
        spread: 70,
        origin: { x, y },
        shapes: [cloverShape, heartShape, starShape],
        colors: ['#74bf43', '#fe9fb9', '#ffd166', '#a58de2', '#ffffff'],
        ticks: 200,
        gravity: 0.9,
        scalar: 1.4
      });
    } catch (e) {
      // Fallback standard confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x, y },
        colors: ['#74bf43', '#fe9fb9', '#ffd166', '#a58de2']
      });
    }
  }

  // Confetti on Celebrate Button
  const celebrateBtn = document.getElementById('celebrate-btn');
  if (celebrateBtn) {
    celebrateBtn.addEventListener('click', (e) => {
      const rect = celebrateBtn.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      fireConfetti(x, y);

      // Cute button bounce
      if (window.anime) {
        window.anime({
          targets: celebrateBtn,
          scale: [1, 1.15, 0.95, 1],
          duration: 400,
          easing: 'easeOutElastic(1, .6)'
        });
      }
    });
  }

  // Interactive Kotoha Pose on About Section
  const kotohaPose = document.getElementById('kotoha-interactive-pose');
  if (kotohaPose) {
    kotohaPose.addEventListener('click', (e) => {
      SoundSystem.playChime();
      const rect = kotohaPose.getBoundingClientRect();
      fireConfetti(
        (rect.left + rect.width / 2) / window.innerWidth,
        (rect.top + rect.height / 3) / window.innerHeight
      );

      if (window.anime) {
        window.anime({
          targets: kotohaPose,
          rotate: [-4, 6, -3, 0],
          scale: [1, 1.08, 1],
          duration: 600,
          easing: 'easeInOutQuad'
        });
      }
    });
  }

  // Header Logo click confetti
  document.querySelectorAll('.header-logo, .brand-logo').forEach(logo => {
    logo.addEventListener('click', (e) => {
      SoundSystem.playChime();
      const rect = logo.getBoundingClientRect();
      fireConfetti(
        (rect.left + rect.width / 2) / window.innerWidth,
        (rect.top + rect.height / 2) / window.innerHeight
      );
    });
  });

  /* ==========================================================================
     3. Loading Screen Controller
     ========================================================================== */
  const loadingScreen = document.getElementById('loading-screen');
  const enterBtn = document.getElementById('enter-btn');
  const loadingBgImg = document.getElementById('loading-bg-img');

  // Randomize initial loading screen artwork from the 3 artworks
  const loadingBgs = [
    'assets/backgrounds/bg1.jpeg',
    'assets/backgrounds/bg2.jpeg',
    'assets/backgrounds/bg3.jpeg'
  ];
  if (loadingBgImg) {
    const randomBg = loadingBgs[Math.floor(Math.random() * loadingBgs.length)];
    loadingBgImg.src = randomBg;
  }

  function dismissLoading() {
    SoundSystem.playChime();
    fireConfetti(0.5, 0.5);
    if (loadingScreen) {
      loadingScreen.classList.add('loaded');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 700);
    }
  }

  if (enterBtn) {
    enterBtn.addEventListener('click', dismissLoading);
  }

  // Auto-ready loading after assets load
  window.addEventListener('load', () => {
    setTimeout(() => {
      const statusText = document.querySelector('.loading-status-text');
      if (statusText) statusText.textContent = 'Welcome!';
      if (enterBtn) {
        enterBtn.style.display = 'flex';
      }
    }, 400);
  });

  /* ==========================================================================
     4. Regular Stream Countdown Timer (Tuesdays & Fridays 21:00 JST)
     ========================================================================== */
  function updateStreamCountdown() {
    const cdDays = document.getElementById('cd-days');
    const cdHours = document.getElementById('cd-hours');
    const cdMins = document.getElementById('cd-mins');
    const cdSecs = document.getElementById('cd-secs');
    if (!cdDays || !cdHours || !cdMins || !cdSecs) return;

    const now = new Date();
    // Convert current time to JST (UTC+9)
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const jstNow = new Date(utc + (3600000 * 9));

    // Stream days: Tuesday = 2, Friday = 5. Target hour = 21:00
    const streamDays = [2, 5];
    let nextStream = null;

    for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
      const checkDate = new Date(jstNow);
      checkDate.setDate(jstNow.getDate() + dayOffset);
      checkDate.setHours(21, 0, 0, 0);

      const dayOfWeek = checkDate.getDay();
      if (streamDays.includes(dayOfWeek)) {
        if (checkDate.getTime() > jstNow.getTime()) {
          nextStream = checkDate;
          break;
        }
      }
    }

    if (!nextStream) {
      nextStream = new Date(jstNow);
      nextStream.setDate(jstNow.getDate() + 1);
      nextStream.setHours(21, 0, 0, 0);
    }

    const diff = Math.max(0, nextStream.getTime() - jstNow.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n) => String(n).padStart(2, '0');
    cdDays.textContent = pad(days);
    cdHours.textContent = pad(hours);
    cdMins.textContent = pad(mins);
    cdSecs.textContent = pad(secs);
  }

  updateStreamCountdown();
  setInterval(updateStreamCountdown, 1000);

  /* ==========================================================================
     5. Snapping Engine & Page Navigation
     "Each section is snappable (like the moment user scroll it will snap the entire page)"
     ========================================================================== */
  const snapContainer = document.getElementById('snap-container');
  const sections = Array.from(document.querySelectorAll('.page-section'));
  const navItems = Array.from(document.querySelectorAll('.nav-item'));
  const dotBtns = Array.from(document.querySelectorAll('.dot-btn'));
  const mobileNavLinks = Array.from(document.querySelectorAll('.m-nav-link'));

  let currentSectionIndex = 0;
  let isNavigating = false;
  let navigationLockTimeout = null;

  function updateActiveIndicators(index) {
    currentSectionIndex = index;
    navItems.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
    dotBtns.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    mobileNavLinks.forEach((link, i) => {
      link.classList.toggle('active', i === index);
    });
  }

  function scrollToSection(index) {
    if (index < 0 || index >= sections.length) return;
    isNavigating = true;
    currentSectionIndex = index;
    updateActiveIndicators(index);

    const targetSection = sections[index];
    targetSection.scrollIntoView({ behavior: 'smooth' });

    clearTimeout(navigationLockTimeout);
    navigationLockTimeout = setTimeout(() => {
      isNavigating = false;
    }, 700);
  }

  // Wheel Snap Detection with Debounce and Lock
  if (snapContainer) {
    window.addEventListener('wheel', (e) => {
      // Check if user is scrolling inside an inner scrollable box (e.g. news list or disco list)
      const innerScrollable = e.target.closest('.news-cards-scrollable, .disco-cards-scrollable, .gallery-grid, .modal-content-wrap');
      if (innerScrollable) {
        const atTop = innerScrollable.scrollTop <= 0;
        const atBottom = innerScrollable.scrollTop + innerScrollable.clientHeight >= innerScrollable.scrollHeight - 2;
        if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) {
          return; // Let inner scrollable scroll!
        }
      }

      if (Math.abs(e.deltaY) < 25) return;
      if (isNavigating) {
        e.preventDefault();
        return;
      }

      if (e.deltaY > 0) {
        if (currentSectionIndex < sections.length - 1) {
          e.preventDefault();
          SoundSystem.playPop();
          scrollToSection(currentSectionIndex + 1);
        }
      } else {
        if (currentSectionIndex > 0) {
          e.preventDefault();
          SoundSystem.playPop();
          scrollToSection(currentSectionIndex - 1);
        }
      }
    }, { passive: false });

    // Touch Swipe Snap Detection (Mobile)
    let touchStartY = 0;
    let touchStartX = 0;

    window.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (isNavigating) return;
      if (!e.changedTouches || e.changedTouches.length === 0) return;

      const innerScrollable = e.target.closest('.news-cards-scrollable, .disco-cards-scrollable, .gallery-grid, .modal-content-wrap');
      if (innerScrollable) {
        const atTop = innerScrollable.scrollTop <= 0;
        const atBottom = innerScrollable.scrollTop + innerScrollable.clientHeight >= innerScrollable.scrollHeight - 2;
        const delta = touchStartY - e.changedTouches[0].clientY;
        if ((delta > 0 && !atBottom) || (delta < 0 && !atTop)) {
          return;
        }
      }

      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      const deltaY = touchStartY - touchEndY;
      const deltaX = touchStartX - touchEndX;

      // Only trigger if vertical swipe is stronger than horizontal
      if (Math.abs(deltaY) > 40 && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY > 0 && currentSectionIndex < sections.length - 1) {
          SoundSystem.playPop();
          scrollToSection(currentSectionIndex + 1);
        } else if (deltaY < 0 && currentSectionIndex > 0) {
          SoundSystem.playPop();
          scrollToSection(currentSectionIndex - 1);
        }
      }
    }, { passive: true });

    // Keyboard Arrow Keys Snap
    window.addEventListener('keydown', (e) => {
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
        if (currentSectionIndex < sections.length - 1) {
          e.preventDefault();
          SoundSystem.playPop();
          scrollToSection(currentSectionIndex + 1);
        }
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        if (currentSectionIndex > 0) {
          e.preventDefault();
          SoundSystem.playPop();
          scrollToSection(currentSectionIndex - 1);
        }
      }
    });

    // IntersectionObserver to keep state in sync if scrolled naturally
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isNavigating) {
          const index = parseInt(entry.target.getAttribute('data-index'), 10);
          if (!isNaN(index)) {
            updateActiveIndicators(index);
          }
        }
      });
    }, {
      root: snapContainer,
      threshold: 0.6
    });

    sections.forEach(sec => sectionObserver.observe(sec));
  }

  // Nav Links click
  document.querySelectorAll('[data-target]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetIdx = parseInt(link.getAttribute('data-target'), 10);
      if (!isNaN(targetIdx)) {
        SoundSystem.playPop();
        scrollToSection(targetIdx);
        closeMobileDrawer();
      }
    });
  });

  // Back to top button
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      SoundSystem.playPop();
      scrollToSection(0);
    });
  }

  /* ==========================================================================
     6. Mobile Drawer Controller
     ========================================================================== */
  const mobileDrawer = document.getElementById('mobile-drawer');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawerClose = document.getElementById('mobile-drawer-close');

  function openMobileDrawer() {
    SoundSystem.playPop();
    if (mobileDrawer) {
      mobileDrawer.classList.add('open');
      if (window.anime) {
        window.anime({
          targets: '.mobile-nav-list .m-nav-link',
          translateX: [-25, 0],
          opacity: [0, 1],
          delay: window.anime.stagger(60, { start: 150 }),
          duration: 350,
          easing: 'easeOutQuad'
        });
      }
    }
  }

  function closeMobileDrawer() {
    if (mobileDrawer) {
      mobileDrawer.classList.remove('open');
    }
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileDrawer);
  if (mobileDrawerClose) mobileDrawerClose.addEventListener('click', () => {
    SoundSystem.playPop();
    closeMobileDrawer();
  });

  /* ==========================================================================
     7. News Section Video Switcher
     ========================================================================== */
  const newsYtPlayer = document.getElementById('news-yt-player');
  const newsPlayerLabel = document.getElementById('news-player-label');
  const videoLinkBtns = document.querySelectorAll('.video-link-btn');

  videoLinkBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      SoundSystem.playPop();
      videoLinkBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const vid = btn.getAttribute('data-vid');
      const title = btn.getAttribute('data-title');

      if (newsPlayerLabel) newsPlayerLabel.textContent = title;
      if (newsYtPlayer && vid) {
        newsYtPlayer.src = `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&enablejsapi=1&rel=0`;
      }

      if (window.anime) {
        window.anime({
          targets: btn,
          scale: [1, 1.04, 1],
          duration: 300,
          easing: 'easeInOutQuad'
        });
      }
    });
  });

  /* ==========================================================================
     8. Discography Audio Sample Previews
     ========================================================================== */
  document.querySelectorAll('.sample-play-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sample = btn.getAttribute('data-audio');
      SoundSystem.playTrackSample(sample);
      
      const icon = btn.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', 'volume-2');
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => {
          icon.setAttribute('data-lucide', 'play');
          if (window.lucide) window.lucide.createIcons();
        }, 1200);
      }
    });
  });

  /* ==========================================================================
     9. Gallery Lightbox & Filter
     ========================================================================== */
  const galleryGrid = document.getElementById('gallery-grid');
  const galleryCards = Array.from(document.querySelectorAll('.gallery-card'));
  const filterChips = document.querySelectorAll('.filter-chip');
  const galleryModal = document.getElementById('gallery-modal');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalImg = document.getElementById('modal-img');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalDownloadBtn = document.getElementById('modal-download-btn');

  // Filter chips
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      SoundSystem.playPop();
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.getAttribute('data-filter');

      galleryCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Open Lightbox
  galleryCards.forEach(card => {
    card.addEventListener('click', () => {
      SoundSystem.playPop();
      const src = card.getAttribute('data-src');
      const title = card.getAttribute('data-title');
      const desc = card.getAttribute('data-desc');

      if (modalImg) modalImg.src = src;
      if (modalTitle) modalTitle.textContent = title;
      if (modalDesc) modalDesc.textContent = desc;
      if (modalDownloadBtn) {
        modalDownloadBtn.href = src;
        modalDownloadBtn.target = '_blank';
      }

      if (galleryModal) {
        galleryModal.classList.add('active');
        galleryModal.setAttribute('aria-hidden', 'false');
      }
    });
  });

  // Close Lightbox
  function closeModal() {
    SoundSystem.playPop();
    if (galleryModal) {
      galleryModal.classList.remove('active');
      galleryModal.setAttribute('aria-hidden', 'true');
    }
  }

  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && galleryModal && galleryModal.classList.contains('active')) {
      closeModal();
    }
  });

  /* ==========================================================================
     10. GSAP Animations & Decorative Polish
     ========================================================================== */
  if (window.gsap) {
    // Subtle float animation for mascot & badges
    window.gsap.to('.stream-schedule-card', {
      y: -4,
      repeat: -1,
      yoyo: true,
      duration: 2.5,
      ease: 'sine.inOut'
    });

    window.gsap.to('.clover-frame-svg', {
      rotation: 3,
      repeat: -1,
      yoyo: true,
      duration: 3,
      ease: 'sine.inOut'
    });
  }
});
