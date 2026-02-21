'use strict';

/* ==========================================================
   Project: Michelle Arumemi — Portfolio Script
   File: assets/js/script.js
   Purpose: Handles interactive behaviors for the portfolio site.
     - Preloader and page init
     - Navbar toggling and header behavior
     - Dark mode toggle with animation
     - Horizontal scroll pin animation
     - Service slider, reveal effects, scroll to top
   Author: Michelle Arumemi
  ========================================================== */


/* ==========================================================
   UTILITY — add event listener on multiple elements
  ========================================================== */
const addEventOnElements = function (elements, eventType, callback) {
  for (let i = 0, len = elements.length; i < len; i++) {
    elements[i].addEventListener(eventType, callback);
  }
};


/* ==========================================================
   HORIZONTAL SCROLL PIN ANIMATION

   HOW IT WORKS:
   - #sectionPin is a tall container. Its height is set in px
     so that the user has enough vertical scroll distance to
     move the entire card strip (pinWrap) across the screen.
   - .pin-wrap-sticky is position:sticky so it stays in view
     while the user scrolls through #sectionPin.
   - We read how far through #sectionPin the user has scrolled
     (0 = top, 1 = bottom) and map that to translateX on pinWrap.

   KEY FIX: setSectionHeight() is called:
     1. At DOMContentLoaded (rough first pass)
     2. At window 'load' (after images have painted — more accurate)
     3. After a 500ms delay (catches any late layout shifts)
     4. On every resize
   This ensures pinWrap.scrollWidth is correct before we commit
   to a section height.
  ========================================================== */
function initHorizontalScrollPin() {
  const sectionPin = document.querySelector('#sectionPin');
  const pinWrap    = document.querySelector('.pin-wrap');
  const scrollHint = document.querySelector('.scroll-hint');

  if (!sectionPin || !pinWrap) return;

  /* Set #sectionPin tall enough to scroll through all cards */
  function setSectionHeight() {
    // Force a reflow so scrollWidth is up-to-date
    pinWrap.style.transform = 'translateX(0)';

    const cardStripWidth  = pinWrap.scrollWidth;
    const viewportWidth   = window.innerWidth;
    const horizontalTravel = Math.max(0, cardStripWidth - viewportWidth);

    // Vertical pixels needed = pixels the strip must travel + 1 viewport
    // so the section eases in and out cleanly
    const totalHeight = horizontalTravel + window.innerHeight;
    sectionPin.style.height = totalHeight + 'px';

    // Re-apply correct position after reset
    updateHorizontalScroll();
  }

  /* Map vertical scroll progress to horizontal translateX */
  function updateHorizontalScroll() {
    const rect             = sectionPin.getBoundingClientRect();
    const sectionTop       = rect.top;
    const sectionHeight    = sectionPin.offsetHeight;
    const windowHeight     = window.innerHeight;
    const scrollableDistance = sectionHeight - windowHeight;

    if (scrollableDistance <= 0) return;

    // 0 = entering section top, 1 = leaving section bottom
    const progress   = Math.max(0, Math.min(1, -sectionTop / scrollableDistance));
    const maxSlide   = pinWrap.scrollWidth - window.innerWidth;
    const translateX = progress * maxSlide;

    pinWrap.style.transform = `translateX(-${translateX}px)`;

    // Scroll hint: appear at section entry, disappear after 8% progress
    if (scrollHint) {
      if (progress > 0.001 && progress < 0.08) {
        scrollHint.classList.add('visible');
      } else {
        scrollHint.classList.remove('visible');
      }
    }
  }

  // 1. First pass at DOMContentLoaded (images may not be loaded yet)
  setSectionHeight();

  // 2. Accurate pass once all images/fonts are loaded
  window.addEventListener('load', () => {
    setSectionHeight();
    // 3. Extra safety pass after late layout shifts
    setTimeout(setSectionHeight, 500);
  });

  // 4. Recalculate on resize
  window.addEventListener('resize', setSectionHeight, { passive: true });

  // Throttled scroll listener
  let ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        updateHorizontalScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}


/* ==========================================================
   DARK MODE TOGGLE WITH CIRCLE EXPAND ANIMATION
  ========================================================== */
function initDarkModeToggle() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const htmlElement    = document.documentElement;

  if (!darkModeToggle) return;

  const moonExpand = document.createElement('div');
  moonExpand.className = 'moon-expand';
  const sunExpand = document.createElement('div');
  sunExpand.className = 'sun-expand';
  document.body.appendChild(moonExpand);
  document.body.appendChild(sunExpand);

  const updateToggleIcon = (theme) => {
    const moonIcon = darkModeToggle.querySelector('.moon-icon');
    const sunIcon  = darkModeToggle.querySelector('.sun-icon');
    if (!moonIcon || !sunIcon) return;

    if (theme === 'dark') {
      moonIcon.style.opacity   = '0';
      moonIcon.style.transform = 'scale(0)';
      sunIcon.style.opacity    = '1';
      sunIcon.style.transform  = 'scale(1)';
    } else {
      moonIcon.style.opacity   = '1';
      moonIcon.style.transform = 'scale(1)';
      sunIcon.style.opacity    = '0';
      sunIcon.style.transform  = 'scale(0)';
    }
  };

  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlElement.setAttribute('data-theme', savedTheme);
    updateToggleIcon(savedTheme);
  };

  darkModeToggle.addEventListener('click', function (e) {
    e.preventDefault();
    const isDark   = htmlElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';

    document.body.classList.add('switching-mode');

    if (isDark) {
      document.body.classList.add('switching-to-light');
      document.body.classList.remove('switching-to-dark');
      moonExpand.style.transform = 'scale(0)';
      moonExpand.offsetHeight;
    } else {
      document.body.classList.add('switching-to-dark');
      document.body.classList.remove('switching-to-light');
      sunExpand.style.transform = 'scale(0)';
      sunExpand.offsetHeight;
    }

    setTimeout(() => {
      htmlElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateToggleIcon(newTheme);

      setTimeout(() => {
        if (isDark) sunExpand.style.transform  = 'scale(0)';
        else        moonExpand.style.transform = 'scale(0)';
        sunExpand.offsetHeight;
        setTimeout(() => {
          document.body.classList.remove('switching-mode', 'switching-to-light', 'switching-to-dark');
        }, 50);
      }, 1000);
    }, 10);
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      const newTheme = e.matches ? 'dark' : 'light';
      htmlElement.setAttribute('data-theme', newTheme);
      updateToggleIcon(newTheme);
    }
  });

  initTheme();
}


/* ==========================================================
   PRELOADER — hide once DOM is ready
  ========================================================== */
const preloader = document.querySelector("[data-preloader]");

window.addEventListener("DOMContentLoaded", function () {
  if (preloader) {
    preloader.classList.add("loaded");
    document.body.classList.add("loaded");
  }

  initHorizontalScrollPin();
  initDarkModeToggle();
});


/* ==========================================================
   NAVBAR — mobile slide-in toggle
  ========================================================== */
const navTogglers  = document.querySelectorAll("[data-nav-toggler]");
const navToggleBtn = document.querySelector("[data-nav-toggle-btn]");
const navbar       = document.querySelector("[data-navbar]");
const overlay      = document.querySelector("[data-overlay]");

const toggleNavbar = function () {
  navbar.classList.toggle("active");
  navToggleBtn.classList.toggle("active");
  overlay.classList.toggle("active");
  document.body.classList.toggle("nav-active");
};

addEventOnElements(navTogglers, "click", toggleNavbar);


/* ==========================================================
   HEADER — frosted glass on scroll
  ========================================================== */
const header = document.querySelector("[data-header]");

window.addEventListener("scroll", function () {
  if (!header) return;
  header.classList.toggle("active", window.scrollY >= 100);
});


/* ==========================================================
   TOUCHPAD / WHEEL helper for the service slider
  ========================================================== */
const enableTouchpadScroll = function (sliderElement, scrollCallback) {
  let isScrolling = false;
  let scrollTimeout;

  sliderElement.addEventListener("wheel", function (event) {
    const isHorizontal    = Math.abs(event.deltaX) > Math.abs(event.deltaY) * 2;
    const isShiftVertical = event.shiftKey && Math.abs(event.deltaY) > 0;

    if (!isHorizontal && !isShiftVertical) return;

    event.preventDefault();
    if (isScrolling) return;
    isScrolling = true;

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => { isScrolling = false; }, 100);

    const threshold = 30;
    if (isHorizontal) {
      if (event.deltaX >  threshold) scrollCallback('next');
      if (event.deltaX < -threshold) scrollCallback('prev');
    } else {
      if (event.deltaY > 0) scrollCallback('next');
      else                  scrollCallback('prev');
    }
  }, { passive: false });
};


/* ==========================================================
   SERVICE SLIDER — button-driven card carousel
  ========================================================== */
const serviceSliders = document.querySelectorAll("[data-slider]:not(.portfolio [data-slider])");

const initServiceSlider = function (currentSlider) {
  const sliderContainer = currentSlider.querySelector("[data-slider-container]");
  const sliderPrevBtn   = currentSlider.querySelector("[data-slider-prev]");
  const sliderNextBtn   = currentSlider.querySelector("[data-slider-next]");

  let totalVisible  = Number(getComputedStyle(currentSlider).getPropertyValue("--slider-items"));
  let totalSlidable = sliderContainer.childElementCount - totalVisible;
  let currentPos    = 0;

  const moveSlider = () => {
    sliderContainer.style.transform =
      `translateX(-${sliderContainer.children[currentPos].offsetLeft}px)`;
  };

  const slideNext = () => {
    currentPos = currentPos >= totalSlidable ? 0 : currentPos + 1;
    moveSlider();
  };

  const slidePrev = () => {
    currentPos = currentPos <= 0 ? totalSlidable : currentPos - 1;
    moveSlider();
  };

  sliderNextBtn.addEventListener("click", slideNext);
  sliderPrevBtn.addEventListener("click", slidePrev);
  enableTouchpadScroll(currentSlider, dir => dir === 'next' ? slideNext() : slidePrev());

  window.addEventListener("resize", () => {
    totalVisible  = Number(getComputedStyle(currentSlider).getPropertyValue("--slider-items"));
    totalSlidable = sliderContainer.childElementCount - totalVisible;
    moveSlider();
  });

  moveSlider();
};

serviceSliders.forEach(slider => initServiceSlider(slider));


/* ==========================================================
   TECHNOLOGIES REVEAL — staggered fade-in on scroll
  ========================================================== */
const revealElements = document.querySelectorAll(".language-item");

if (revealElements.length > 0) {
  const revealOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el    = entry.target;
      const index = Array.from(revealElements).indexOf(el);

      if (entry.isIntersecting) {
        setTimeout(() => { el.classList.add("reveal"); el.classList.remove("hidden"); }, index * 100);
      } else {
        setTimeout(() => { el.classList.remove("reveal"); el.classList.add("hidden"); }, index * 100);
      }
    });
  }, { threshold: 0.1 });

  window.addEventListener("load", () => {
    revealElements.forEach(el => { el.classList.add("hidden"); revealOnScroll.observe(el); });
  });
}


/* ==========================================================
   SCROLL TO TOP — rocket launch animation
  ========================================================== */
const scrollToTopBtn = document.getElementById('scrollToTop');
let isLaunching = false;

window.addEventListener('scroll', function () {
  if (isLaunching || !scrollToTopBtn) return;
  scrollToTopBtn.classList.toggle('show', window.scrollY > 300);
});

if (scrollToTopBtn) {
  scrollToTopBtn.addEventListener('click', function () {
    isLaunching = true;
    scrollToTopBtn.classList.add('launching');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const checkInterval = setInterval(() => {
      if (window.scrollY <= 5) {
        clearInterval(checkInterval);
        scrollToTopBtn.classList.remove('launching', 'show');
        isLaunching = false;
      }
    }, 50);

    setTimeout(() => {
      if (isLaunching) {
        clearInterval(checkInterval);
        scrollToTopBtn.classList.remove('launching', 'show');
        isLaunching = false;
      }
    }, 1500);
  });
}


/* ==========================================================
   SCROLL REVEAL — fade / slide in on viewport entry
  ========================================================== */
const scrollRevealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.addEventListener('DOMContentLoaded', () => {
  // Text elements: alternate left / right slide
  document.querySelectorAll('.section-title, .title-wrapper, .section .section-text')
    .forEach((el, i) => {
      el.classList.add(i % 2 === 0 ? 'scroll-reveal-left' : 'scroll-reveal-right');
      scrollRevealObserver.observe(el);
    });

  // Cards: slide up
  document.querySelectorAll('.service-card, .language-item, .projects-card, .contact-wrapper, .footer-content')
    .forEach(el => {
      el.classList.add('scroll-reveal');
      scrollRevealObserver.observe(el);
    });
});