/* ==========================================================================
   Main site logic
   ========================================================================== */

(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function () {
    /* ------------------------------------------------------------------
       Chrome hide on scroll down, reappear on scroll up:
       - Desktop (>=800px): primary nav slides up inside the pinned header.
       - Tablet (592–799px): the whole header slides up.
       - Mobile (<=591px): header slides up and the bottom tab bar slides
         down at the same time.
       ------------------------------------------------------------------ */
    var header = document.getElementById('header');
    var nav = document.querySelector('.nav');
    var tabbar = document.querySelector('.tabbar');
    var lastY = window.pageYOffset || 0;
    var ticking = false;
    var chromeHidden = false;
    var desktopNavMQ = window.matchMedia('(min-width: 800px)');

    function updateChrome() {
      if (desktopNavMQ.matches) {
        /* Desktop: nav hides, header (avatar + meta) stays pinned */
        if (nav) nav.classList.toggle('is-hidden', chromeHidden);
        if (header) header.classList.remove('is-hidden');
        if (tabbar) tabbar.classList.remove('is-hidden');
      } else {
        /* Tablet/mobile: nav stays inside the header, the chrome itself
           hides — header up (+ tab bar down on mobile) */
        if (nav) nav.classList.remove('is-hidden');
        if (header) header.classList.toggle('is-hidden', chromeHidden);
        if (tabbar) tabbar.classList.toggle('is-hidden', chromeHidden);
      }
    }

    function onScroll() {
      var y = window.pageYOffset || 0;
      var delta = y - lastY;
      var atTop = y <= 0;

      if (!atTop && delta > 2) {
        chromeHidden = true;
      } else if (atTop || delta < -2) {
        chromeHidden = false;
      }

      updateChrome();
      lastY = y;
      ticking = false;
    }

    /* Crossing the breakpoint while scrolled down — reveal immediately */
    function onNavMQChange() {
      chromeHidden = false;
      updateChrome();
    }
    if (desktopNavMQ.addEventListener) {
      desktopNavMQ.addEventListener('change', onNavMQChange);
    } else if (desktopNavMQ.addListener) {
      desktopNavMQ.addListener(onNavMQChange); /* older Safari */
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });

    /* ------------------------------------------------------------------
       Header time ([data-time]) — current time formatted like the mockup
       ------------------------------------------------------------------ */
    var timeEl = document.querySelector('[data-time]');
    if (timeEl) {
      var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

      function renderTime() {
        var d = new Date();
        var hours = d.getHours();
        var meridiem = hours >= 12 ? 'PM' : 'AM';
        var h12 = hours % 12;
        h12 = h12 === 0 ? 12 : h12;
        timeEl.textContent = pad2(h12) + ':' + pad2(d.getMinutes()) +
          ' ' + meridiem;
      }

      renderTime();
      window.setInterval(renderTime, 30000);
    }

    /* ------------------------------------------------------------------
       (bottom-sheet menu removed — replaced by the fixed mobile tab bar)
       ------------------------------------------------------------------ */

    /* ------------------------------------------------------------------
       Interactive eyes — pupils follow the cursor inside the block
       ------------------------------------------------------------------ */
    var eyes = document.getElementById('eyes');
    if (eyes) {
      var pupils = eyes.querySelectorAll('.pupil');
      var MAX_OFFSET = 3;

      function lookAt(targetX, targetY) {
        const rect = eyes.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = targetX - cx;
        const dy = targetY - cy;
        const angle = Math.atan2(dy, dx);
        const distance = Math.min(MAX_OFFSET, Math.hypot(dx, dy) / 10);
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        pupils.forEach((pupil) => {
          pupil.setAttribute('transform', `translate(${x}, ${y})`);
        });
      }

      function resetPupils() {
        pupils.forEach((pupil) => {
          pupil.setAttribute('transform', 'translate(0, 0)');
        });
      }

      document.addEventListener('mousemove', function(e) {
        lookAt(e.clientX, e.clientY);
      });
      
      eyes.addEventListener('mouseleave', resetPupils);

      var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var isSleepingByCursorOrTab = false;
      var blinkTimeout = null;
      var clickTimeout = null;

      function setSleeping(sleeping) {
        isSleepingByCursorOrTab = sleeping;
        if (sleeping) {
          eyes.classList.add('is-sleeping');
        } else {
          eyes.classList.remove('is-sleeping');
        }
      }

      function startBlinking() {
        if (prefersReducedMotion) return;

        var interval = Math.random() * 3000 + 3000;
        blinkTimeout = setTimeout(function() {
          if (isSleepingByCursorOrTab || eyes.classList.contains('is-sleeping')) {
            startBlinking();
            return;
          }

          var isDouble = Math.random() < 0.25;

          function doBlink(onComplete) {
            eyes.classList.add('is-blinking');
            setTimeout(function() {
              eyes.classList.remove('is-blinking');
              setTimeout(function() {
                if (typeof onComplete === 'function') onComplete();
              }, 160);
            }, 140);
          }

          doBlink(function() {
            if (isDouble) {
              setTimeout(function() {
                doBlink(startBlinking);
              }, 80);
            } else {
              startBlinking();
            }
          });
        }, interval);
      }

      if (!prefersReducedMotion) {
        startBlinking();
      }

      document.addEventListener('mouseleave', function(e) {
        if (!e.relatedTarget && e.toElement === null) {
          setSleeping(true);
        }
      });
      document.addEventListener('mouseenter', function() {
        if (!document.hidden) {
          setSleeping(false);
        }
      });

      document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
          setSleeping(true);
        } else {
          setSleeping(false);
        }
      });

      window.addEventListener('blur', function() {
        setSleeping(true);
      });
      window.addEventListener('focus', function() {
        if (!document.hidden) {
          setSleeping(false);
        }
      });

      eyes.addEventListener('click', function() {
        if (isSleepingByCursorOrTab) return;
        eyes.classList.add('is-sleeping');
        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(function() {
          if (!isSleepingByCursorOrTab) {
            eyes.classList.remove('is-sleeping');
          }
        }, 600);
      });
    }

    /* ------------------------------------------------------------------
       Case cards — show the right-edge fade only when a tag is clipped.
       The gradient is hidden when all tags fit inside the card.
       ------------------------------------------------------------------ */
    var tagRows = document.querySelectorAll('.case-card__tags');

    function updateTagFades() {
      Array.prototype.forEach.call(tagRows, function (row) {
        var overflowing = row.scrollWidth > row.clientWidth + 1; // +1px tolerance
        row.classList.toggle('is-overflowing', overflowing);
      });
    }

    updateTagFades();
    window.addEventListener('resize', updateTagFades);
    window.addEventListener('load', updateTagFades);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateTagFades); // re-measure after font swap
    }

    /* ------------------------------------------------------------------
       Case page scrollspy
       ------------------------------------------------------------------ */
    (function() {
      // Only run on case study pages
      if (!document.querySelector('.case-sidebar')) return;
      
      const sections = document.querySelectorAll('.case-section');
      const navItems = document.querySelectorAll('.case-sidebar__nav-item');
      
      if (sections.length === 0 || navItems.length === 0) return;
      
      // Create intersection observer
      const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          const id = entry.target.getAttribute('id');
          const navItem = document.querySelector(`.case-sidebar__nav-item[href="#${id}"]`);
          
          if (entry.isIntersecting) {
            // Remove active class from all items
            navItems.forEach(function(item) {
              item.classList.remove('case-sidebar__nav-item--active');
            });
            
            // Add active class to current item
            if (navItem) {
              navItem.classList.add('case-sidebar__nav-item--active');
            }
          }
        });
      }, {
        rootMargin: '-20% 0px -80% 0px' // Trigger when section is 20% from top
      });
      
      // Observe all sections
      sections.forEach(function(section) {
        observer.observe(section);
      });
      
      // Smooth scrolling for navigation links
      navItems.forEach(function(link) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          
          const targetId = this.getAttribute('href');
          const targetElement = document.querySelector(targetId);
          
          if (targetElement) {
            window.scrollTo({
              top: targetElement.offsetTop - 100,
              behavior: 'smooth'
            });
          }
        });
      });
    })();

    /* ------------------------------------------------------------------
       Case studies — private access modal
       ------------------------------------------------------------------ */
    var accessOverlay = document.getElementById('accessModal');
    if (accessOverlay) {
      var ACCESS_UNLOCK_KEY = 'cases_unlocked_date';
      var ACCESS_PASSWORD = (typeof window.PORTFOLIO_PASSWORD === 'string' && window.PORTFOLIO_PASSWORD)
        ? window.PORTFOLIO_PASSWORD
        : '6661';

      var accessDigits = Array.prototype.slice.call(accessOverlay.querySelectorAll('.modal__digit'));
      var accessPrimary = document.getElementById('accessPrimary');
      var accessSecondary = document.getElementById('accessSecondary');
      var accessBanner = document.getElementById('accessBanner');
      var accessBannerText = document.getElementById('accessBannerText');
      var accessCode = document.getElementById('accessCode');

      /* URL of the case the user clicked — navigation happens only after
         the correct password is entered. */
      var pendingCaseUrl = null;

      function accessToday() {
        var d = new Date();
        return d.getFullYear() + '-' +
          ('0' + (d.getMonth() + 1)).slice(-2) + '-' +
          ('0' + d.getDate()).slice(-2);
      }

      function accessUnlockedToday() {
        try {
          return localStorage.getItem(ACCESS_UNLOCK_KEY) === accessToday();
        } catch (e) {
          return false;
        }
      }

      function accessGetCode() {
        return accessDigits.map(function (d) { return d.value; }).join('');
      }

      function accessClearErrors() {
        accessBanner.hidden = true;
        accessDigits.forEach(function (d) { d.classList.remove('is-error'); });
      }

      function accessResetState() {
        accessDigits.forEach(function (d) {
          d.disabled = false;
          d.value = '';
        });
        accessClearErrors();
      }

      function accessShowError(text) {
        accessBannerText.textContent = text;
        accessBanner.hidden = false;
        accessDigits.forEach(function (d) { d.classList.add('is-error'); });
      }

      function accessOpen() {
        accessResetState();
        accessOverlay.classList.add('is-open');
        accessOverlay.setAttribute('aria-hidden', 'false');
        /* Scroll lock lives on the root element: html { overflow-x: clip }
           prevents body { overflow } from reaching the viewport, and locking
           body would turn it into a scroll container and un-stick the
           sticky header. */
        document.documentElement.classList.add('is-locked');
        /* The header must stay pinned above the modal — reveal it if the
           scroll-down chrome hiding had tucked it away (tablet/mobile). */
        if (header) header.classList.remove('is-hidden');
        window.setTimeout(function () {
          if (accessDigits[0]) accessDigits[0].focus();
        }, 60);
      }

      function accessClose() {
        accessOverlay.classList.remove('is-open');
        accessOverlay.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('is-locked');
        pendingCaseUrl = null;
      }

      /* Hook for the home-page featured-works preview frame click handler
         (defined later in this file): the same password gate applies when a
         case preview is clicked on the home page. Returns true when the
         navigation may proceed (cases already unlocked today), false when
         the password modal was opened instead. */
      window.accessGate = function (href) {
        if (accessUnlockedToday()) return true;
        pendingCaseUrl = href;
        accessOpen();
        return false;
      };

      /* The modal is not shown on page load. It opens only when a case card
         is clicked (see the click interception below). */

      function accessUnlock() {
        var code = accessGetCode();
        if (code.length < 4) {
          accessShowError('Please enter a code to unlock.');
          return;
        }
        if (code !== ACCESS_PASSWORD) {
          accessShowError('Incorrect or expired code');
          return;
        }

        /* Correct password — remember today's unlock, close the modal and
           only now navigate to the case detail page. */
        try {
          localStorage.setItem(ACCESS_UNLOCK_KEY, accessToday());
        } catch (e) { /* storage unavailable — ignore */ }
        var url = pendingCaseUrl;
        accessClose();
        if (url) window.location.href = url;
      }

      /* Digit inputs — numeric only, auto-advance to next, backspace on an
         empty field goes back, arrows move focus, 4-digit paste is
         distributed across the fields, Enter submits. */
      accessDigits.forEach(function (input, index) {
        input.addEventListener('input', function () {
          accessClearErrors();
          var filtered = input.value.replace(/[^0-9]/g, '').slice(0, 1);
          input.value = filtered;
          if (filtered && index < accessDigits.length - 1) {
            accessDigits[index + 1].focus();
          }
        });

        input.addEventListener('keydown', function (e) {
          if (e.key === 'Backspace') {
            if (input.value === '' && index > 0) {
              e.preventDefault();
              accessDigits[index - 1].focus();
            }
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (index > 0) accessDigits[index - 1].focus();
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (index < accessDigits.length - 1) accessDigits[index + 1].focus();
          } else if (e.key === 'Enter') {
            e.preventDefault();
            accessUnlock();
          }
        });

        input.addEventListener('paste', function (e) {
          e.preventDefault();
          accessClearErrors();
          var pasted = (e.clipboardData || window.clipboardData).getData('text');
          pasted = (pasted || '').replace(/[^0-9]/g, '').slice(0, accessDigits.length);
          for (var i = 0; i < pasted.length; i++) {
            accessDigits[i].value = pasted.charAt(i);
          }
          var target = pasted.length < accessDigits.length
            ? accessDigits[pasted.length]
            : accessDigits[accessDigits.length - 1];
          if (target) target.focus();
        });
      });

      accessPrimary.addEventListener('click', accessUnlock);

      /* Cancel — just close the modal and stay on the page. */
      accessSecondary.addEventListener('click', function (e) {
        e.preventDefault();
        accessClose();
      });

      /* Click on the empty overlay area around the card closes the modal.
         Clicks inside the card land on descendants, so only an exact hit
         on the overlay itself (the dimmed backdrop) dismisses it. */
      accessOverlay.addEventListener('click', function (e) {
        if (e.target === accessOverlay) accessClose();
      });

      /* Clicking a case card opens the modal instead of navigating right
         away; the transition to the case page happens only after the
         correct password is entered. When the cases were already unlocked
         today, the card navigates straight to the detail page.
         a.case — work-cases page; a.brack-link — home featured-works
         [case ↗] anchors pointing at cases/ pages. */
      Array.prototype.forEach.call(document.querySelectorAll('a.case, a.brack-link'), function (link) {
        var href = link.getAttribute('href');
        if (!href || href.indexOf('cases/') === -1) return;
        link.addEventListener('click', function (e) {
          if (!accessUnlockedToday()) {
            e.preventDefault();
            pendingCaseUrl = href;
            accessOpen();
          }
        });
      });
    }

    /* ------------------------------------------------------------------
       Skeleton image loading
       ------------------------------------------------------------------ */
    var skels = document.querySelectorAll('.skel');
    skels.forEach(function (skel) {
      var imgs = skel.querySelectorAll('img');
      if (!imgs.length) return;

      function onLoaded() {
        skel.classList.add('is-loaded');
      }

      imgs.forEach(function (img) {
        if (img.complete && img.naturalWidth) {
          onLoaded();
        } else {
          img.addEventListener('load', onLoaded, { once: true });
          img.addEventListener('error', onLoaded, { once: true });
        }
      });
    });
  });

    /* ------------------------------------------------------------------
       Featured image slideshow
       ------------------------------------------------------------------ */
    (function() {
      var slides = document.querySelectorAll('.preview__stack');
      if (slides.length === 0) return;

      var currentIndex = 0;
      var interval;
      var isPaused = false;
      var featuredLabel = document.querySelector('.featured__label');

      function nextSlide() {
        if (isPaused || document.hidden) return;

        var currentSlide = slides[currentIndex];
        currentIndex = (currentIndex + 1) % slides.length;
        var nextSlide = slides[currentIndex];

        currentSlide.classList.remove('in');
        currentSlide.classList.add('out');
        
        nextSlide.classList.remove('out');
        nextSlide.classList.add('in');

        // Removed the setTimeout that cleared the 'out' class
        // to keep the sequence clean and immediate
        currentSlide.classList.remove('out');

        updateLabel();
      }

      /* Label (next to the "concepts" link) follows the visible slide:
         the text comes from data-label on the image, i.e. the same
         captions that sit under these images on the concepts page. */
      function updateLabel() {
        if (!featuredLabel) return;
        var label = slides[currentIndex].getAttribute('data-label');
        if (label) featuredLabel.textContent = label;
      }
      updateLabel();

      interval = setInterval(nextSlide, 5000); // Changed from 3000ms to 5000ms

      var container = document.querySelector('.preview');
      // Hover functionality removed per request


      document.addEventListener('visibilitychange', function() {
        isPaused = document.hidden;
      });
    })();
})();

    /* ------------------------------------------------------------------
       Prefetch on hover for navigation links and main buttons
       ------------------------------------------------------------------ */
    document.addEventListener('mouseover', function (e) {
      var target = e.target.closest('a.nav__link, a.tabbar__link, a.btn, a.case-card, a.case-next-link, a.case-sidebar__nav-item');
      if (!target) return;
      var href = target.getAttribute('href');
      if (!href && target.classList.contains('case-card')) {
        var anchor = target.querySelector('a');
        if (anchor) href = anchor.getAttribute('href');
      }
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
      if (target.hasAttribute('download') || href.endsWith('.pdf')) return;

      if (!document.querySelector('link[rel="prefetch"][href="' + href + '"]')) {
        var link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
      }
    }, { passive: true });



document.addEventListener('DOMContentLoaded', function () {
  /* Back to top — smooth scroll, instant when reduced motion is preferred. */
  var fwReduceMotion = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var backToTop = document.querySelector('[data-back-to-top]');
  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: fwReduceMotion ? 'auto' : 'smooth' });
    });
  }
});


/* ==========================================================================
   Reveal on scroll ([data-reveal])
   Blocks marked with data-reveal fade and slide up once as they enter the
   viewport. Header and footer stay untouched (no data-reveal there).
   Initial hidden state lives in main.css scoped to html.js, so every page
   stays fully visible without JavaScript and under reduced motion.
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reduced motion or missing IntersectionObserver support: skip everything.
     Without the html.js class the hidden styles in CSS never apply,
     so all blocks are visible immediately */
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  document.documentElement.classList.add('js');

  var els = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if (els.length === 0) return;

  /* Home: the first case of the Featured works section appears together
     with the section heading — as soon as the heading is revealed, the
     first case follows it (same 100ms stagger as the initial batch).
     The remaining cards keep their own scroll reveal. */
  var featuredHead = document.querySelector('.featured-works .section-head');
  var featuredFirstCard = document.querySelector('.featured-works__card[data-reveal]');

  var initialBatchDone = false;

  function reveal(el, delayMs) {
    /* One-shot: stop watching once the block has been revealed */
    if (el.classList.contains('is-revealed')) return;
    observer.unobserve(el);

    /* The first case is bound to its section heading appearance */
    if (el === featuredHead && featuredFirstCard) {
      reveal(featuredFirstCard, 100);
    }

    /* Drop the stagger delay after the entrance finishes so any future
       transitions on the element run without it */
    el.addEventListener('transitionend', function handler(e) {
      if (e.target !== el || e.propertyName !== 'opacity') return;
      el.style.transitionDelay = '';
      el.removeEventListener('transitionend', handler);
    });

    if (delayMs > 0) {
      el.style.transitionDelay = delayMs + 'ms';
    }

    el.classList.add('is-revealed');
  }

  var observer = new IntersectionObserver(function (entries) {
    if (!initialBatchDone) {
      initialBatchDone = true;

      /* Blocks already in the viewport on load: reveal them right away
         with a light 100ms stagger between adjacent ones (top to bottom) */
      entries.filter(function (entry) {
        return entry.isIntersecting;
      }).sort(function (a, b) {
        return a.target.getBoundingClientRect().top -
               b.target.getBoundingClientRect().top;
      }).forEach(function (entry, i) {
        reveal(entry.target, i * 100);
      });
      return;
    }

    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        reveal(entry.target, 0);
      }
    });
  }, { threshold: 0.15 });

  els.forEach(function (el) {
    observer.observe(el);
  });
})();

/* ==========================================================================
   Case Detail — розовые плашки-подсветки
   Фразы в .case-hl подсвечиваются при попадании в вьюпорт: плашка
   «выезжает» слева (см. .case-hl в main.css). Блок отключается сам,
   если на странице нет .case-hl.
   ========================================================================== */
(function () {
  var highlights = document.querySelectorAll('.case-hl');
  if (!highlights.length) return;

  function reveal(hl, delay) {
    hl.style.transitionDelay = delay + 'ms';
    hl.classList.add('is-in');
  }

  if (!('IntersectionObserver' in window)) {
    highlights.forEach(function (hl, i) { reveal(hl, i * 120); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var container = entry.target.closest('.case-detail__section') ||
                      entry.target.parentElement;
      if (container.dataset.hlDone) {
        observer.unobserve(entry.target);
        return;
      }
      container.dataset.hlDone = 'true';
      var nodes = container.querySelectorAll('.case-hl');
      var delay = 0;
      nodes.forEach(function (hl) {
        reveal(hl, delay);
        delay += 220;
      });
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  highlights.forEach(function (hl) { observer.observe(hl); });
})();

/* ==========================================================================
   Case Detail — автозапуск видео в панелях
   muted+playsinline уже в атрибутах; Safari (включая iOS) может не стартовать
   autoplay сам — особенно у видео ниже первого экрана. Страховка в три слоя:
   1) после загрузки ставим muted свойством и явно зовём play();
   2) повторяем попытку на canplay (когда данные видео доехали);
   3) повторяем при попадании видео во вьюпорт (IntersectionObserver).
   При prefers-reduced-motion: reduce autoplay убираем — preload="metadata"
   оставляет первый кадр как постер.
   ========================================================================== */
(function () {
  var videos = document.querySelectorAll('.case-detail__panel video');
  if (!videos.length) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function tryPlay(video) {
    if (video.paused) {
      video.muted = true;
      video.play().catch(function () {});
    }
  }

  videos.forEach(function (video) {
    if (reducedMotion.matches) {
      /* Анимацию не запускаем: первый кадр уже показан через preload="metadata" */
      video.removeAttribute('autoplay');
      video.pause();
      return;
    }

    tryPlay(video);
    video.addEventListener('canplay', function () {
      tryPlay(video);
    });
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) tryPlay(entry.target);
      });
    }, { threshold: 0.25 });
    videos.forEach(function (video) { io.observe(video); });
  }
})();
/* ==========================================================================
   Featured works card click — clicking the preview frame navigates to the
   same case page as the [case ↗] brack-link. Scoped to the frame only:
   clicks on the card header or the subtitle text do nothing (hover is
   scoped the same way in CSS). Clicks on the brack-link itself (or any
   other <a>) and modifier-clicks keep the native browser behaviour.
   ========================================================================== */
(function () {
  'use strict';

  var cards = document.querySelectorAll('.featured-works__card');
  if (!cards.length) return;

  Array.prototype.forEach.call(cards, function (card) {
    var link = card.querySelector('.brack-link');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href) return;
    var frame = card.querySelector('.featured-works__frame');
    if (!frame) return;

    frame.addEventListener('click', function (e) {
      if (e.defaultPrevented ||
          e.button !== 0 ||
          e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ||
          e.target.closest('a')) {
        return;
      }
      /* Password gate — same modal as on the work-cases page. Navigation
         happens only after the correct password is entered (or immediately
         when the cases were already unlocked today). */
      if (window.accessGate && !window.accessGate(href)) return;
      window.location.href = href;
    });
  });
})();

/* ==========================================================================
   Featured preview click (home) — clicking the preview card navigates to
   the concepts page (same as the [concepts ↗] brack-link).
   The handler is scoped to the card (.featured__frame) only, so clicks on
   the label row or on the space around the card do nothing. Modifier-clicks
   keep the native browser behaviour.
   ========================================================================== */
(function () {
  'use strict';

  var featuredCard = document.querySelector('.featured__frame');
  if (!featuredCard) return;

  var link = document.querySelector('.featured .brack-link');
  if (!link) return;
  var href = link.getAttribute('href');
  if (!href) return;

  featuredCard.addEventListener('click', function (e) {
    if (e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ||
        e.target.closest('a')) {
      return;
    }
    window.location.href = href;
  });
})();
