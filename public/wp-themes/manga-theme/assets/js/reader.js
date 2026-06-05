/**
 * Comic Reader — Chapter Reader JS
 *
 * Features:
 *  1. Reading mode switch (scroll / paged) + localStorage persistence
 *  2. Page-by-page navigation controls in paged mode
 *  3. Keyboard + swipe navigation aware of current mode
 *  4. Lazy-load images via IntersectionObserver
 *  5. Prefetch adjacent chapter pages
 */
(function () {
  'use strict';

  if (!window.crcReader) return;

  const readerData = window.crcReader;
  const prevUrl = readerData.prevUrl || null;
  const nextUrl = readerData.nextUrl || null;
  const i18n = readerData.i18n || {};

  const MODE_SCROLL = 'scroll';
  const MODE_PAGED = 'paged';
  const MODE_KEY = 'crc_reader_mode';

  const readerRoot = document.getElementById('crc-reader');
  const pageElements = Array.from(document.querySelectorAll('.crc-reader__page'));
  const modeButtons = Array.from(document.querySelectorAll('.crc-mode-btn'));
  const pageNav = document.getElementById('crc-page-nav');
  const pagePrevBtn = document.getElementById('crc-page-prev');
  const pageNextBtn = document.getElementById('crc-page-next');
  const pageCurrentEl = document.getElementById('crc-page-current');
  const pageTotalEl = document.getElementById('crc-page-total');

  let currentMode = MODE_SCROLL;
  let currentPageIndex = 0;

  function text(key, fallback) {
    return typeof i18n[key] === 'string' && i18n[key] ? i18n[key] : fallback;
  }

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_err) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_err) {
      // Ignore storage failures (private mode / denied storage).
    }
  }

  function clampPage(index) {
    if (!pageElements.length) return 0;
    if (index < 0) return 0;
    if (index >= pageElements.length) return pageElements.length - 1;
    return index;
  }

  function navigate(url) {
    if (!url) return;
    window.scrollTo(0, 0);
    window.location.href = url;
  }

  function markImageLoaded(img) {
    if (!img) return;
    if (img.complete) {
      img.classList.add('crc-loaded');
      return;
    }
    img.addEventListener('load', () => img.classList.add('crc-loaded'), { once: true });
    img.addEventListener('error', () => img.classList.add('crc-loaded'), { once: true });
  }

  function markPageImageLoaded(pageElement) {
    if (!pageElement) return;
    const img = pageElement.querySelector('.crc-reader__img');
    markImageLoaded(img);
  }

  function detectNearestPageIndex() {
    if (!pageElements.length) return 0;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    const anchorY = 110;

    pageElements.forEach((page, index) => {
      const rect = page.getBoundingClientRect();
      const distance = Math.abs(rect.top - anchorY);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  function setButtonLabel(button, label) {
    if (!button) return;
    const textEl = button.querySelector('.crc-page-nav__btn-text');
    if (textEl) textEl.textContent = label;
  }

  function updatePageNavState() {
    if (!pageElements.length) return;

    const total = pageElements.length;
    const current = currentPageIndex + 1;

    if (pageCurrentEl) pageCurrentEl.textContent = String(current);
    if (pageTotalEl) pageTotalEl.textContent = String(total);

    const atFirstPage = currentPageIndex === 0;
    const atLastPage = currentPageIndex === total - 1;

    if (pagePrevBtn) {
      const shouldGoPrevChapter = atFirstPage && !!prevUrl;
      const disabled = atFirstPage && !prevUrl;
      pagePrevBtn.disabled = disabled;
      pagePrevBtn.classList.toggle('is-disabled', disabled);
      setButtonLabel(
        pagePrevBtn,
        shouldGoPrevChapter ? text('prevChapter', 'Previous chapter') : text('prevPage', 'Previous page')
      );
    }

    if (pageNextBtn) {
      const shouldGoNextChapter = atLastPage && !!nextUrl;
      const disabled = atLastPage && !nextUrl;
      pageNextBtn.disabled = disabled;
      pageNextBtn.classList.toggle('is-disabled', disabled);
      setButtonLabel(
        pageNextBtn,
        shouldGoNextChapter ? text('nextChapter', 'Next chapter') : text('nextPage', 'Next page')
      );
    }
  }

  function showAllPages() {
    pageElements.forEach((page) => page.classList.remove('is-active'));
  }

  function goToPage(index, behavior = 'auto') {
    if (!pageElements.length) return;

    currentPageIndex = clampPage(index);

    pageElements.forEach((page, pageIndex) => {
      page.classList.toggle('is-active', pageIndex === currentPageIndex);
    });

    const activePage = pageElements[currentPageIndex];
    markPageImageLoaded(activePage);
    if (activePage) {
      activePage.scrollIntoView({ behavior, block: 'start' });
    }

    updatePageNavState();
  }

  function setMode(nextMode, options = {}) {
    if (!readerRoot) return;

    const normalizedMode = nextMode === MODE_PAGED ? MODE_PAGED : MODE_SCROLL;
    currentMode = normalizedMode;

    readerRoot.classList.toggle('crc-mode-scroll', currentMode === MODE_SCROLL);
    readerRoot.classList.toggle('crc-mode-paged', currentMode === MODE_PAGED);
    readerRoot.setAttribute('data-reading-mode', currentMode);

    modeButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.mode === currentMode);
      button.setAttribute('aria-pressed', button.dataset.mode === currentMode ? 'true' : 'false');
    });

    if (currentMode === MODE_PAGED) {
      if (options.fromScrollPosition) {
        currentPageIndex = detectNearestPageIndex();
      }
      if (pageNav) pageNav.hidden = false;
      goToPage(currentPageIndex, options.behavior || 'auto');
    } else {
      if (pageNav) pageNav.hidden = true;
      showAllPages();

      const currentPage = pageElements[currentPageIndex];
      if (currentPage && options.scrollToCurrent !== false) {
        currentPage.scrollIntoView({ behavior: options.behavior || 'auto', block: 'start' });
      }
    }

    updatePageNavState();

    if (options.persist !== false) {
      safeStorageSet(MODE_KEY, currentMode);
    }
  }

  function previousByMode() {
    if (currentMode === MODE_PAGED && pageElements.length) {
      if (currentPageIndex > 0) {
        goToPage(currentPageIndex - 1, 'smooth');
      } else {
        navigate(prevUrl);
      }
      return;
    }
    navigate(prevUrl);
  }

  function nextByMode() {
    if (currentMode === MODE_PAGED && pageElements.length) {
      if (currentPageIndex < pageElements.length - 1) {
        goToPage(currentPageIndex + 1, 'smooth');
      } else {
        navigate(nextUrl);
      }
      return;
    }
    navigate(nextUrl);
  }

  function isInteractiveFocus() {
    const active = document.activeElement;
    if (!active) return false;
    const tag = active.tagName;
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      tag === 'BUTTON' ||
      tag === 'A' ||
      active.isContentEditable
    );
  }

  function initLazyLoad() {
    const images = document.querySelectorAll('.crc-reader__img');
    if (!images.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const img = entry.target;
            markImageLoaded(img);
            observer.unobserve(img);
          });
        },
        {
          rootMargin: '400px 0px',
          threshold: 0,
        }
      );

      images.forEach((img) => observer.observe(img));
    } else {
      images.forEach((img) => markImageLoaded(img));
    }
  }

  function initModeSwitch() {
    if (!modeButtons.length) return;

    modeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const mode = button.dataset.mode === MODE_PAGED ? MODE_PAGED : MODE_SCROLL;
        setMode(mode, { fromScrollPosition: mode === MODE_PAGED, behavior: 'smooth' });
      });
    });

    const saved = safeStorageGet(MODE_KEY);
    const initialMode = saved === MODE_PAGED ? MODE_PAGED : MODE_SCROLL;
    setMode(initialMode, { persist: false, behavior: 'auto', scrollToCurrent: false });
  }

  function initPageNavButtons() {
    if (pagePrevBtn) {
      pagePrevBtn.addEventListener('click', () => {
        if (pagePrevBtn.disabled) return;
        previousByMode();
      });
    }

    if (pageNextBtn) {
      pageNextBtn.addEventListener('click', () => {
        if (pageNextBtn.disabled) return;
        nextByMode();
      });
    }
  }

  function initMobileFooterToggle() {
    const footerBar = document.querySelector('.crc-reader-bar--bottom');
    const toggleBtn = document.getElementById('crc-reader-footer-toggle');
    const footerInner = document.getElementById('crc-reader-footer-inner');

    if (!footerBar || !toggleBtn || !footerInner || !window.matchMedia) return;

    const STORAGE_KEY = 'crc_reader_footer_collapsed';
    const mobileQuery = window.matchMedia('(max-width: 600px)');
    const showLabel = toggleBtn.dataset.labelShow || 'แสดงเมนูนำทาง';
    const hideLabel = toggleBtn.dataset.labelHide || 'ซ่อนเมนูนำทาง';

    function applyState(collapsed, persist) {
      const shouldCollapse = !!collapsed && mobileQuery.matches;
      footerBar.classList.toggle('is-collapsed', shouldCollapse);
      footerInner.hidden = shouldCollapse;
      toggleBtn.setAttribute('aria-expanded', shouldCollapse ? 'false' : 'true');
      toggleBtn.textContent = shouldCollapse ? showLabel : hideLabel;

      if (persist) {
        safeStorageSet(STORAGE_KEY, shouldCollapse ? '1' : '0');
      }
    }

    function syncForViewport() {
      if (!mobileQuery.matches) {
        applyState(false, false);
        return;
      }
      const saved = safeStorageGet(STORAGE_KEY);
      applyState(saved === '1', false);
    }

    toggleBtn.addEventListener('click', () => {
      const collapsed = footerBar.classList.contains('is-collapsed');
      applyState(!collapsed, true);
    });

    if (typeof mobileQuery.addEventListener === 'function') {
      mobileQuery.addEventListener('change', syncForViewport);
    } else if (typeof mobileQuery.addListener === 'function') {
      mobileQuery.addListener(syncForViewport);
    }

    syncForViewport();
  }

  function initKeyboard() {
    const hint = document.getElementById('crc-keyboard-hint');
    let hintShown = false;

    document.addEventListener('keydown', (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (isInteractiveFocus()) return;

      switch (event.key) {
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault();
          previousByMode();
          break;

        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          event.preventDefault();
          nextByMode();
          break;

        case 'Home':
          if (currentMode === MODE_PAGED && pageElements.length) {
            event.preventDefault();
            goToPage(0, 'smooth');
          }
          break;

        case 'End':
          if (currentMode === MODE_PAGED && pageElements.length) {
            event.preventDefault();
            goToPage(pageElements.length - 1, 'smooth');
          }
          break;

        default:
          break;
      }

      if (hint && !hintShown) {
        hintShown = true;
        hint.classList.add('visible');
        setTimeout(() => hint.classList.remove('visible'), 3000);
      }
    });
  }

  function initSwipe() {
    let touchStartX = 0;
    let touchStartY = 0;
    const SWIPE_THRESHOLD = 60;
    const VERTICAL_TOLERANCE = 40;

    document.addEventListener(
      'touchstart',
      (event) => {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
      },
      { passive: true }
    );

    document.addEventListener(
      'touchend',
      (event) => {
        const dx = event.changedTouches[0].clientX - touchStartX;
        const dy = Math.abs(event.changedTouches[0].clientY - touchStartY);
        if (dy > VERTICAL_TOLERANCE) return;

        if (dx > SWIPE_THRESHOLD) {
          previousByMode();
        } else if (dx < -SWIPE_THRESHOLD) {
          nextByMode();
        }
      },
      { passive: true }
    );
  }

  function initPrefetch() {
    if (!('IntersectionObserver' in window)) return;

    function addPrefetch(url) {
      if (!url) return;
      const existing = document.querySelector(`link[rel="prefetch"][href="${url}"]`);
      if (existing) return;
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'document';
      document.head.appendChild(link);
    }

    const target = document.getElementById('crc-next-bottom') || document.getElementById('crc-prev-bottom');
    if (!target) return;

    const prefetchObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          addPrefetch(nextUrl);
          addPrefetch(prevUrl);
          prefetchObserver.disconnect();
        });
      },
      { threshold: 0 }
    );
    prefetchObserver.observe(target);
  }

  function scrollToTop() {
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }

  function init() {
    scrollToTop();
    initLazyLoad();
    initModeSwitch();
    initPageNavButtons();
    initMobileFooterToggle();
    initKeyboard();
    initSwipe();
    initPrefetch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
