/**
 * Comic Reader Theme — Homepage JS
 *
 * Handles:
 *  - Hero carousel: auto-rotate, tab switching, prev/next, thumbnail strip, dots
 *  - Comic row horizontal scroll arrows
 */
(function () {
    'use strict';

    /* ─────────────────────────────────────────────────────────────
     * HERO
     * ───────────────────────────────────────────────────────────── */

    var ROTATE_MS = 6000;

    var hero = document.getElementById('crc-hero');
    if (!hero) return;

    // ── Parse embedded data ──────────────────────────────────────
    var data = { new: [], trending: [] };
    try { data.new      = JSON.parse(hero.getAttribute('data-new')      || '[]'); } catch (e) {}
    try { data.trending = JSON.parse(hero.getAttribute('data-trending') || '[]'); } catch (e) {}

    // ── State ────────────────────────────────────────────────────
    var activeTab   = 'new';
    var activeIndex = 0;
    var paused      = false;
    var rotateTimer = null;

    // ── DOM refs ─────────────────────────────────────────────────
    var bgImg         = document.getElementById('crc-hero-bg-img');
    var coverLink     = document.getElementById('crc-hero-cover-link');
    var coverImg      = document.getElementById('crc-hero-cover-img');
    var coverPh       = document.getElementById('crc-hero-cover-placeholder');
    var heroStatus    = document.getElementById('crc-hero-status');
    var heroTitle     = document.getElementById('crc-hero-title');
    var heroAuthor    = document.getElementById('crc-hero-author');
    var heroBtnRead   = document.getElementById('crc-hero-btn-read');
    var heroBtnDetail = document.getElementById('crc-hero-btn-detail');
    var thumbsEl      = document.getElementById('crc-hero-thumbs');
    var dotsEl        = document.getElementById('crc-hero-dots');
    var prevBtn       = document.getElementById('crc-hero-prev');
    var nextBtn       = document.getElementById('crc-hero-next');
    var heroInfo      = document.getElementById('crc-hero-info');
    var tabs          = document.querySelectorAll('.crc-hero-tab');

    var STATUS_LABELS = {
        ongoing:   'กำลังดำเนิน',
        completed: 'จบแล้ว',
        hiatus:    'หยุดชั่วคราว'
    };

    var STATUS_CLASS = {
        ongoing:   'crc-badge--ongoing',
        completed: 'crc-badge--completed',
        hiatus:    'crc-badge--hiatus'
    };

    // ── Render current state ─────────────────────────────────────
    function render(animate) {
        var list  = data[activeTab];
        var comic = list[activeIndex] || list[0];
        if (!comic) return;

        if (animate && heroInfo) {
            heroInfo.classList.add('is-transitioning');
        }

        // Use requestAnimationFrame to let the transition class paint first
        requestAnimationFrame(function () {
            updateHero(comic);
            renderThumbs(list);
            renderDots(list.length);

            if (animate && heroInfo) {
                // Remove transition class after a short delay
                setTimeout(function () {
                    heroInfo.classList.remove('is-transitioning');
                }, 220);
            }
        });
    }

    function updateHero(comic) {
        // Background.
        if (bgImg) {
            bgImg.style.backgroundImage = comic.cover ? 'url(' + comic.cover + ')' : 'none';
        }

        // Cover image.
        if (comic.cover) {
            if (coverImg)  { coverImg.src = comic.cover; coverImg.alt = comic.title; coverImg.style.display = 'block'; }
            if (coverPh)   { coverPh.style.display = 'none'; }
        } else {
            if (coverImg)  { coverImg.style.display = 'none'; }
            if (coverPh)   { coverPh.style.display = 'flex'; }
        }

        // Links.
        if (coverLink)     { coverLink.href = comic.url; coverLink.setAttribute('aria-label', 'ดู ' + comic.title); }
        if (heroBtnRead)   { heroBtnRead.href = comic.url; }
        if (heroBtnDetail) { heroBtnDetail.href = comic.url; }

        // Status badge.
        if (heroStatus) {
            var statusLabel = STATUS_LABELS[comic.status] || comic.status || '';
            heroStatus.textContent = statusLabel;
            heroStatus.className = 'crc-badge crc-hero-status ' + (STATUS_CLASS[comic.status] || '');
            heroStatus.style.display = statusLabel ? '' : 'none';
        }

        // Title.
        if (heroTitle) { heroTitle.textContent = comic.title || ''; }

        // Author + chapter count.
        if (heroAuthor) {
            var parts = [];
            if (comic.author)   { parts.push('โดย ' + comic.author); }
            if (comic.chapters > 0) { parts.push(comic.chapters + ' ตอน'); }
            heroAuthor.textContent = parts.join(' · ');
            heroAuthor.style.display = parts.length ? '' : 'none';
        }
    }

    function renderThumbs(list) {
        if (!thumbsEl) return;
        thumbsEl.innerHTML = '';

        list.forEach(function (comic, i) {
            var btn = document.createElement('button');
            btn.className = 'crc-hero-thumb' + (i === activeIndex ? ' crc-hero-thumb--active' : '');
            btn.setAttribute('role', 'listitem');
            btn.setAttribute('aria-label', 'เลือก ' + comic.title);
            btn.setAttribute('aria-current', i === activeIndex ? 'true' : 'false');

            if (comic.cover) {
                var img = document.createElement('img');
                img.src = comic.cover;
                img.alt = comic.title;
                img.loading = 'lazy';
                btn.appendChild(img);
            } else {
                btn.textContent = '📚';
            }

            btn.addEventListener('click', function () {
                paused = true;
                goTo(i);
            });

            thumbsEl.appendChild(btn);
        });
    }

    function renderDots(total) {
        if (!dotsEl) return;
        dotsEl.innerHTML = '';

        for (var i = 0; i < total; i++) {
            var dot = document.createElement('span');
            dot.className = 'crc-hero-dot' + (i === activeIndex ? ' crc-hero-dot--active' : '');
            dotsEl.appendChild(dot);
        }
    }

    // ── Navigation ───────────────────────────────────────────────
    function goTo(index) {
        var list = data[activeTab];
        if (index === activeIndex || !list[index]) return;
        activeIndex = index;
        render(true);
    }

    function goNext() {
        var len = data[activeTab].length;
        if (len <= 1) return;
        goTo((activeIndex + 1) % len);
    }

    function goPrev() {
        var len = data[activeTab].length;
        if (len <= 1) return;
        goTo((activeIndex - 1 + len) % len);
    }

    // ── Auto-rotate ──────────────────────────────────────────────
    function startRotation() {
        stopRotation();
        rotateTimer = setInterval(function () {
            if (!paused) goNext();
        }, ROTATE_MS);
    }

    function stopRotation() {
        if (rotateTimer) { clearInterval(rotateTimer); rotateTimer = null; }
    }

    // ── Tab switching ────────────────────────────────────────────
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            var newTab = tab.getAttribute('data-tab');
            if (!newTab || newTab === activeTab) return;

            activeTab   = newTab;
            activeIndex = 0;
            paused      = false;

            // Update aria + active class.
            tabs.forEach(function (t) {
                var isActive = t.getAttribute('data-tab') === newTab;
                t.classList.toggle('crc-hero-tab--active', isActive);
                t.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });

            render(true);
            startRotation();
        });
    });

    // ── Arrow buttons ────────────────────────────────────────────
    if (prevBtn) {
        prevBtn.addEventListener('click', function () { paused = true; goPrev(); });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', function () { paused = true; goNext(); });
    }

    // ── Pause on hover / focus ───────────────────────────────────
    hero.addEventListener('mouseenter', function () { paused = true; });
    hero.addEventListener('mouseleave', function () { paused = false; });
    hero.addEventListener('focusin',    function () { paused = true; });
    hero.addEventListener('focusout',   function () { paused = false; });

    // ── Init ─────────────────────────────────────────────────────
    render(false);    // no animate on first paint (PHP already pre-rendered first comic)
    startRotation();

    /* ─────────────────────────────────────────────────────────────
     * COMIC ROW SCROLL ARROWS
     * ───────────────────────────────────────────────────────────── */

    document.querySelectorAll('[data-crc-row]').forEach(function (wrap) {
        var scrollEl  = wrap.querySelector('.crc-home-row__scroll');
        var prevArrow = wrap.querySelector('.crc-row-arrow--prev');
        var nextArrow = wrap.querySelector('.crc-row-arrow--next');

        if (!scrollEl) return;

        function scrollRow(dir) {
            var amount = scrollEl.clientWidth * 0.75;
            scrollEl.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
        }

        if (prevArrow) { prevArrow.addEventListener('click', function () { scrollRow('left');  }); }
        if (nextArrow) { nextArrow.addEventListener('click', function () { scrollRow('right'); }); }
    });

})();
