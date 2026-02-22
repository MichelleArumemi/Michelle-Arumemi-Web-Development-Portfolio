'use strict';

// Remove the import lines - they're not needed for Vercel deployment
// Just use the script tag method instead

/* ==========================================================
   UTILITY
  ========================================================== */
const addEventOnElements = function (elements, eventType, callback) {
  for (let i = 0, len = elements.length; i < len; i++) {
    elements[i].addEventListener(eventType, callback);
  }
};


/* ==========================================================
   HORIZONTAL SCROLL PIN ANIMATION
  ========================================================== */
function initHorizontalScrollPin() {
  const sectionPin    = document.querySelector('#sectionPin');
  const pinWrapSticky = document.querySelector('.pin-wrap-sticky');
  const pinWrap       = document.querySelector('.pin-wrap');
  const scrollHint    = document.querySelector('.scroll-hint');

  if (!sectionPin || !pinWrapSticky || !pinWrap) return;
  if (window.innerWidth <= 600) return;

  sectionPin.style.height   = '500vh';
  sectionPin.style.overflow = 'visible';

  pinWrapSticky.style.cssText = `
    height: 100vh;
    width: 100vw;
    position: sticky;
    top: 0;
    overflow-x: hidden;
    overflow-y: visible;
    display: flex;
    align-items: center;
  `;

  pinWrap.style.cssText = `
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 15px;
    padding: 0 5vw;
    height: 100%;
    will-change: transform;
  `;

  function update() {
    const rect  = sectionPin.getBoundingClientRect();
    const total = sectionPin.offsetHeight - window.innerHeight;
    if (total <= 0) return;

    const progress = Math.max(0, Math.min(1, -rect.top / total));
    const maxSlide = pinWrap.scrollWidth - window.innerWidth;
    pinWrap.style.transform = `translateX(-${progress * maxSlide}px)`;

    if (scrollHint) {
      scrollHint.classList.toggle('visible', progress > 0.001 && progress < 0.10);
    }
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { update(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('load', () => { update(); setTimeout(update, 300); });
  update();
}


/* ==========================================================
   DARK MODE TOGGLE
  ========================================================== */
function initDarkModeToggle() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const htmlElement    = document.documentElement;

  if (!darkModeToggle) return;

  const updateToggleIcon = (theme) => {
    const moonIcon = darkModeToggle.querySelector('.moon-icon');
    const sunIcon  = darkModeToggle.querySelector('.sun-icon');
    if (!moonIcon || !sunIcon) return;

    if (theme === 'dark') {
      moonIcon.style.opacity   = '0';
      moonIcon.style.transform = 'translate(-50%, -50%) scale(0)';
      sunIcon.style.opacity    = '1';
      sunIcon.style.transform  = 'translate(-50%, -50%) scale(1)';
    } else {
      moonIcon.style.opacity   = '1';
      moonIcon.style.transform = 'translate(-50%, -50%) scale(1)';
      sunIcon.style.opacity    = '0';
      sunIcon.style.transform  = 'translate(-50%, -50%) scale(0)';
    }
  };

  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlElement.setAttribute('data-theme', savedTheme);
    updateToggleIcon(savedTheme);
  };

  darkModeToggle.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    const isDark   = htmlElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateToggleIcon(newTheme);
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
   PRELOADER
  ========================================================== */
const preloader = document.querySelector("[data-preloader]");

window.addEventListener("DOMContentLoaded", function () {
  if (preloader) {
    preloader.classList.add("loaded");
    document.body.classList.add("loaded");
  }

  initHorizontalScrollPin();
  initDarkModeToggle();
  initNavbar();
});


/* ==========================================================
   NAVBAR
  ========================================================== */
function initNavbar() {

  const navToggleBtn = document.querySelector(".nav-toggle-btn");
  const navbar       = document.querySelector(".navbar");
  const overlay      = document.querySelector(".overlay");

  if (!navToggleBtn) { console.error("❌ .nav-toggle-btn not found"); return; }
  if (!navbar)       { console.error("❌ .navbar not found"); return; }
  if (!overlay)      { console.error("❌ .overlay not found"); return; }

  console.log("✅ Navbar init — button, navbar, overlay all found");

  function openNav() {
    navbar.classList.add("active");
    navToggleBtn.classList.add("active");
    overlay.classList.add("active");
    document.body.classList.add("nav-active");
  }

  function closeNav() {
    navbar.classList.remove("active");
    navToggleBtn.classList.remove("active");
    overlay.classList.remove("active");
    document.body.classList.remove("nav-active");
  }

  navToggleBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    navbar.classList.contains("active") ? closeNav() : openNav();
  });

  overlay.addEventListener("click", function (e) {
    e.stopPropagation();
    closeNav();
  });

  overlay.addEventListener("touchend", function (e) {
    e.preventDefault();
    e.stopPropagation();
    closeNav();
  }, { passive: false });

  navbar.querySelectorAll(".navbar-link").forEach(link => {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && navbar.classList.contains("active")) closeNav();
  });
}


/* ==========================================================
   HEADER — frosted glass on scroll
  ========================================================== */
const header = document.querySelector("[data-header]");

window.addEventListener("scroll", function () {
  if (!header) return;
  header.classList.toggle("active", window.scrollY >= 100);
}, { passive: true });


/* ==========================================================
   SERVICE SLIDER
  ========================================================== */
const serviceSliders = document.querySelectorAll("[data-slider]:not(.portfolio [data-slider])");

const initServiceSlider = function (currentSlider) {
  const sliderContainer = currentSlider.querySelector("[data-slider-container]");
  const sliderPrevBtn   = currentSlider.querySelector("[data-slider-prev]");
  const sliderNextBtn   = currentSlider.querySelector("[data-slider-next]");

  if (!sliderContainer || !sliderPrevBtn || !sliderNextBtn) return;

  let totalVisible  = Number(getComputedStyle(currentSlider).getPropertyValue("--slider-items"));
  let totalSlidable = sliderContainer.childElementCount - totalVisible;
  let currentPos    = 0;

  const moveSlider = () => {
    sliderContainer.style.transition = "transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)";
    sliderContainer.style.transform  = `translateX(-${sliderContainer.children[currentPos].offsetLeft}px)`;
  };

  const slideNext = () => { currentPos = currentPos >= totalSlidable ? 0 : currentPos + 1; moveSlider(); };
  const slidePrev = () => { currentPos = currentPos <= 0 ? totalSlidable : currentPos - 1; moveSlider(); };

  sliderNextBtn.addEventListener("click", slideNext);
  sliderPrevBtn.addEventListener("click", slidePrev);

  let isScrolling = false;
  let accumulatedDelta = 0;
  const threshold = 60;

  currentSlider.addEventListener("wheel", function (event) {
    const isHorizontal    = Math.abs(event.deltaX) > Math.abs(event.deltaY) * 2;
    const isShiftVertical = event.shiftKey && Math.abs(event.deltaY) > 0;
    if (!isHorizontal && !isShiftVertical) return;

    event.preventDefault();
    accumulatedDelta += isHorizontal ? event.deltaX : event.deltaY;
    if (Math.abs(accumulatedDelta) < threshold || isScrolling) return;

    isScrolling = true;
    accumulatedDelta > 0 ? slideNext() : slidePrev();
    accumulatedDelta = 0;
    setTimeout(() => { isScrolling = false; }, 200);
  }, { passive: false });

  window.addEventListener("resize", () => {
    totalVisible  = Number(getComputedStyle(currentSlider).getPropertyValue("--slider-items"));
    totalSlidable = sliderContainer.childElementCount - totalVisible;
    moveSlider();
  });

  moveSlider();
};

serviceSliders.forEach(slider => initServiceSlider(slider));


/* ==========================================================
   TECHNOLOGIES REVEAL
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
   SCROLL TO TOP
  ========================================================== */
const scrollToTopBtn = document.getElementById('scrollToTop');
let isLaunching = false;

window.addEventListener('scroll', function () {
  if (isLaunching || !scrollToTopBtn) return;
  scrollToTopBtn.classList.toggle('show', window.scrollY > 300);
}, { passive: true });

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
   SCROLL REVEAL
  ========================================================== */
const scrollRevealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.section-title, .title-wrapper, .section .section-text')
    .forEach((el, i) => {
      el.classList.add(i % 2 === 0 ? 'scroll-reveal-left' : 'scroll-reveal-right');
      scrollRevealObserver.observe(el);
    });

  document.querySelectorAll('.service-card, .language-item, .contact-wrapper, .footer-content')
    .forEach(el => {
      el.classList.add('scroll-reveal');
      scrollRevealObserver.observe(el);
    });
});