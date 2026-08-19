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
       Nav — hide on scroll down, reappear on scroll up.
       Header (avatar + meta) stays pinned and always visible.
       ------------------------------------------------------------------ */
    var header = document.getElementById('header');
    var nav = document.querySelector('.nav');
    var lastY = window.pageYOffset || 0;
    var ticking = false;

    function onScroll() {
      var y = window.pageYOffset || 0;
      var delta = y - lastY;
      var atTop = y <= 0;

      if (!atTop && delta > 2) {
        if (nav) nav.classList.add('is-hidden');
      } else if (atTop || delta < -2) {
        if (nav) nav.classList.remove('is-hidden');
      }
      lastY = y;
      ticking = false;
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
          ' ' + meridiem + ', (UTC+3)';
      }

      renderTime();
      window.setInterval(renderTime, 30000);
    }

    /* ------------------------------------------------------------------
       Mobile bottom-sheet menu
       ------------------------------------------------------------------ */
    var btn = document.querySelector('.header__burger');
    var sheet = document.getElementById('mobileMenu');
    var scrim = document.getElementById('sheetScrim');
    var MENU_DURATION = 270; // ms (matches CSS transition)

    function openMenu() {
      if (!sheet || !scrim) return;
      sheet.classList.add('is-open');
      scrim.classList.add('is-open');
      sheet.setAttribute('aria-hidden', 'false');
      scrim.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
      btn.setAttribute('aria-expanded', 'true');
      header.classList.add('is-open');
      btn.classList.add('is-open');
      btn.setAttribute('aria-label', 'Close menu');
    }

    function closeMenu() {
      if (!sheet || !scrim) return;
      sheet.classList.remove('is-open');
      scrim.classList.remove('is-open');
      sheet.setAttribute('aria-hidden', 'true');
      scrim.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
      btn.setAttribute('aria-expanded', 'false');
      header.classList.remove('is-open');
      btn.classList.remove('is-open');
      btn.setAttribute('aria-label', 'Open menu');
      // restore nav visibility once the sheet is hidden
      if (nav) nav.classList.remove('is-hidden');
    }

    function toggleMenu() {
      var open = sheet.classList.contains('is-open');
      if (open) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    if (btn && sheet) {
      btn.addEventListener('click', toggleMenu);

      scrim.addEventListener('click', closeMenu);

      // Close after navigating (allow a little time for click to register).
      // On the same page (Home) links just close the menu.
      Array.prototype.forEach.call(sheet.querySelectorAll('.sheet__link'), function (link) {
        link.addEventListener('click', function () {
          window.setTimeout(closeMenu, MENU_DURATION);
        });
      });

      // Close on Escape
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && sheet.classList.contains('is-open')) {
          closeMenu();
        }
      });
    }

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
      /* TEMPORARY (testing): re-show the modal every 2 minutes after
         unlocking. To restore the previous timing (modal stays dismissed
         until the next reload / next day after unlocking), set
         ACCESS_MODAL_TEST_MODE to false — nothing else needs to change. */
      var ACCESS_MODAL_TEST_MODE = false;
      var ACCESS_MODAL_RELOCK_MS = 2 * 60 * 1000; // 2 minutes

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
      var accessCheck = document.getElementById('accessCheck');
      var accessActions = accessOverlay.querySelector('.modal__actions');
      var accessModal = accessOverlay.querySelector('.modal');
      var accessTitle = document.getElementById('accessModalTitle');
      var accessText = accessOverlay.querySelector('.modal__text');
      var accessState = 'locked'; // 'locked' | 'unlocked'
      var accessRelockTimer = null;

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
        accessCode.classList.remove('is-success');
        accessCheck.hidden = true;
        accessActions.classList.remove('is-done');
        accessModal.classList.remove('is-success');
        accessTitle.textContent = 'Private cases';
        if (accessText) accessText.classList.remove('is-done');
        accessClearErrors();
        accessPrimary.textContent = 'Unlock page';
        accessSecondary.textContent = 'Publish visuals';
        accessSecondary.removeAttribute('data-cancel-mode');
        accessState = 'locked';
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
        document.body.classList.add('is-locked');
        window.setTimeout(function () {
          if (accessDigits[0]) accessDigits[0].focus();
        }, 60);
      }

      function accessClose() {
        accessOverlay.classList.remove('is-open');
        accessOverlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('is-locked');
      }

      /* Original timing: show the modal only when the cases have not been
         unlocked today yet. TEMPORARY (testing): force it open on every
         load so the every-2-minutes re-appearance can be verified. */
      if (ACCESS_MODAL_TEST_MODE || !accessUnlockedToday()) {
        accessOpen();
      }

      function accessSubmit() {
        if (accessState === 'unlocked') {
          accessContinue();
          return;
        }
        var code = accessGetCode();
        if (code === '') {
          accessShowError('Code is required for unlocking');
          return;
        }
        if (code !== ACCESS_PASSWORD) {
          accessShowError('Incorrect or expired code');
          return;
        }

        /* Success — inputs slide out to the left, green check badge slides
           in from the right to the center. */
        accessState = 'unlocked';
        accessDigits.forEach(function (d) {
          d.blur();
          d.setAttribute('disabled', '');
        });
        accessCode.classList.add('is-success');
        accessCheck.hidden = false;
        accessActions.classList.add('is-done');
        accessModal.classList.add('is-success');
        accessTitle.textContent = 'Successfully';
        if (accessText) accessText.classList.add('is-done');
        accessPrimary.textContent = 'Continue';
        accessSecondary.textContent = 'Cancel';
        accessSecondary.setAttribute('data-cancel-mode', '');

        /* One confetti burst from the center once the badge has settled. */
        if (typeof window.confetti === 'function') {
          window.setTimeout(function () {
            window.confetti({
              particleCount: 140,
              spread: 80,
              startVelocity: 45,
              scalar: 0.9,
              origin: { x: 0.5, y: 0.5 },
              zIndex: 200
            });
          }, 1200);
        }

        /* The modal disappears by itself 5s after a successful unlock
           (confetti has already finished by then). */
        window.setTimeout(accessContinue, 5000);
      }

      function accessContinue() {
        /* Original behavior: remember today's unlock, hide modal + blur. */
        try {
          localStorage.setItem(ACCESS_UNLOCK_KEY, accessToday());
        } catch (e) { /* storage unavailable — ignore */ }
        accessClose();

        /* TEMPORARY (testing): re-show the modal every 2 minutes after
           unlocking. Remove this block (and the two flags above) to go
           back to the original timing. */
        if (ACCESS_MODAL_TEST_MODE && !accessRelockTimer) {
          accessRelockTimer = window.setInterval(accessOpen, ACCESS_MODAL_RELOCK_MS);
        }
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
            accessSubmit();
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

      accessPrimary.addEventListener('click', accessSubmit);

      /* "Publish visuals" (normal state) / "Cancel" (after unlock). */
      accessSecondary.addEventListener('click', function (e) {
        if (accessSecondary.hasAttribute('data-cancel-mode')) {
          e.preventDefault();
          window.location.href = 'index.html';
        }
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
      }

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
      var target = e.target.closest('a.nav__link, a.sheet__link, a.btn, a.case-card, a.case-next-link, a.case-sidebar__nav-item');
      if (!target) return;
      var href = target.getAttribute('href');
      if (!href && target.classList.contains('case-card')) {
        var anchor = target.querySelector('a');
        if (anchor) href = anchor.getAttribute('href');
      }
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;

      if (!document.querySelector('link[rel="prefetch"][href="' + href + '"]')) {
        var link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
      }
    }, { passive: true });



document.addEventListener('DOMContentLoaded', () => {
  const placeholder = document.getElementById('footer-placeholder');
  if (placeholder) {
    fetch('components/footer.html')
      .then(response => response.text())
      .then(data => {
        placeholder.outerHTML = data;
      });
  }
});
