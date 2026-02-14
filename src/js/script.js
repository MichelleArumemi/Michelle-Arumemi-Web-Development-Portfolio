'use strict';

/* ==========================================================
   Project: Michelle Arumemi — Portfolio Script
   File: assets/js/script.js
   Purpose: Handles interactive behaviors for the portfolio site.
     - Preloader and page init
     - Navbar toggling and header behavior
     - Dark mode toggle with animation
     - Horizontal scroll pin animation
     - Service slider, reveal effects, sparkle & neon cursor
   Author: Michelle Arumemi
   Notes: Each major section/function is marked with a header comment.
  ========================================================== */

/**
 * HORIZONTAL SCROLL PIN ANIMATION
 */
function initHorizontalScrollPin() {
  const $sectionPin = document.querySelector('#sectionPin');
  const $pinWrap = document.querySelector('.pin-wrap');
  
  if (!$sectionPin || !$pinWrap) return;

  function updateHorizontalScroll() {
    const sectionRect = $sectionPin.getBoundingClientRect();
    const sectionTop = sectionRect.top;
    const sectionHeight = sectionRect.height;
    const windowHeight = window.innerHeight;
    
    const scrollEnd = sectionHeight - windowHeight;
    const scrollProgress = Math.max(0, Math.min(1, -sectionTop / scrollEnd));
    
    const pinWrapWidth = $pinWrap.scrollWidth;
    const maxTranslate = pinWrapWidth - window.innerWidth;
    const translateX = scrollProgress * maxTranslate;
    
    $pinWrap.style.transform = `translateX(-${translateX}px)`;
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateHorizontalScroll();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  updateHorizontalScroll();
  window.addEventListener('resize', updateHorizontalScroll, { passive: true });
}

/**
 * ANIMATED DARK MODE TOGGLE WITH CIRCLE EXPAND
 */
function initDarkModeToggle() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const htmlElement = document.documentElement;
  
  if (!darkModeToggle) return;
  
  // Create moon and sun expanding circles
  const moonExpand = document.createElement('div');
  moonExpand.className = 'moon-expand';
  
  const sunExpand = document.createElement('div');
  sunExpand.className = 'sun-expand';
  
  document.body.appendChild(moonExpand);
  document.body.appendChild(sunExpand);
  
  // Initialize theme
  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlElement.setAttribute('data-theme', savedTheme);
    updateToggleIcon(savedTheme);
  };
  
  // Update toggle icon
  const updateToggleIcon = (theme) => {
    if (!darkModeToggle) return;
    
    const moonIcon = darkModeToggle.querySelector('.moon-icon');
    const sunIcon = darkModeToggle.querySelector('.sun-icon');
    
    if (moonIcon && sunIcon) {
      if (theme === 'dark') {
        moonIcon.style.opacity = '0';
        moonIcon.style.transform = 'scale(0)';
        sunIcon.style.opacity = '1';
        sunIcon.style.transform = 'scale(1)';
      } else {
        moonIcon.style.opacity = '1';
        moonIcon.style.transform = 'scale(1)';
        sunIcon.style.opacity = '0';
        sunIcon.style.transform = 'scale(0)';
      }
    }
  };
  
  // Animated theme toggle with circle expansion
  darkModeToggle.addEventListener('click', function(e) {
    e.preventDefault();
    
    const isDarkMode = htmlElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDarkMode ? 'light' : 'dark';
    
    // Add switching mode class
    document.body.classList.add('switching-mode');
    
    // Start the circle expansion
    if (isDarkMode) {
      // Switching to light mode - expand sun
      document.body.classList.add('switching-to-light');
      document.body.classList.remove('switching-to-dark');
      
      // Reset moon expand first
      moonExpand.style.transform = 'scale(0)';
      
      // Force reflow
      moonExpand.offsetHeight;
      sunExpand.offsetHeight;
    } else {
      // Switching to dark mode - expand moon
      document.body.classList.add('switching-to-dark');
      document.body.classList.remove('switching-to-light');
      
      // Reset sun expand first
      sunExpand.style.transform = 'scale(0)';
      
      // Force reflow
      sunExpand.offsetHeight;
      moonExpand.offsetHeight;
    }
    
    // Wait for circle to fully expand, then change theme
    setTimeout(() => {
      // Change theme
      htmlElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateToggleIcon(newTheme);
      
      // Wait for expansion to complete, then collapse
      setTimeout(() => {
        // Collapse the expanded circle
        if (isDarkMode) {
          sunExpand.style.transform = 'scale(0)';
        } else {
          moonExpand.style.transform = 'scale(0)';
        }
        
        // Force reflow
        sunExpand.offsetHeight;
        moonExpand.offsetHeight;
        
        // Remove switching classes
        setTimeout(() => {
          document.body.classList.remove('switching-mode', 'switching-to-light', 'switching-to-dark');
        }, 50);
      }, 1000); // Wait for expansion to complete
    }, 10);
  });
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      const newTheme = e.matches ? 'dark' : 'light';
      htmlElement.setAttribute('data-theme', newTheme);
      updateToggleIcon(newTheme);
    }
  });
  
  // Initialize theme on load
  initTheme();
}

/**
 * add event listener on multiple elements
 */
const addEventOnElements = function (elements, eventType, callback) {
  for (let i = 0, len = elements.length; i < len; i++) {
    elements[i].addEventListener(eventType, callback);
  }
}

/**
 * PRELOADER
 */
const preloader = document.querySelector("[data-preloader]");

window.addEventListener("DOMContentLoaded", function () {
  preloader.classList.add("loaded");
  document.body.classList.add("loaded");
  
  // Initialize horizontal scroll pin animation
  initHorizontalScrollPin();
  
  // Initialize dark mode toggle
  initDarkModeToggle();
});

/**
 * NAVBAR
 */
const navTogglers = document.querySelectorAll("[data-nav-toggler]");
const navToggleBtn = document.querySelector("[data-nav-toggle-btn]");
const navbar = document.querySelector("[data-navbar]");
const overlay = document.querySelector("[data-overlay]");

const toggleNavbar = function () {
  navbar.classList.toggle("active");
  navToggleBtn.classList.toggle("active");
  overlay.classList.toggle("active");
  document.body.classList.toggle("nav-active");
}

addEventOnElements(navTogglers, "click", toggleNavbar);

/**
 * HEADER
 */
const header = document.querySelector("[data-header]");

window.addEventListener("scroll", function () {
  if (window.scrollY >= 100) {
    header.classList.add("active");
  } else {
    header.classList.remove("active");
  }
});

/**
 * UNIVERSAL TOUCHPAD SCROLL DETECTION FUNCTION
 */
/**
 * UNIVERSAL TOUCHPAD SCROLL DETECTION FUNCTION
 */
const enableTouchpadScroll = function (sliderElement, scrollCallback) {
  let isScrolling = false;
  let scrollTimeout;
  
  sliderElement.addEventListener("wheel", function (event) {
    // Only prevent default for intentional horizontal scrolling
    const isHorizontalScroll = Math.abs(event.deltaX) > Math.abs(event.deltaY) * 2;
    const isShiftVerticalScroll = event.shiftKey && Math.abs(event.deltaY) > 0;
    
    // Don't prevent default for normal vertical scrolling
    if (!isHorizontalScroll && !isShiftVerticalScroll) {
      return; // Allow normal page scroll
    }
    
    event.preventDefault();
    
    if (isScrolling) return;
    isScrolling = true;
    
    clearTimeout(scrollTimeout);
    
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 100);
    
    // Increased threshold for more deliberate horizontal scrolling
    const scrollThreshold = 30;
    
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) * 2) {
      if (event.deltaX > scrollThreshold) {
        scrollCallback('next');
      } else if (event.deltaX < -scrollThreshold) {
        scrollCallback('prev');
      }
    } else if (event.shiftKey && Math.abs(event.deltaY) > 0) {
      if (event.deltaY > 0) {
        scrollCallback('next');
      } else {
        scrollCallback('prev');
      }
    }
  }, { passive: false });
}

/**
 * SIMPLE SLIDER for Services
 */
const serviceSliders = document.querySelectorAll("[data-slider]:not(.portfolio [data-slider])");

const initServiceSlider = function (currentSlider) {
  const sliderContainer = currentSlider.querySelector("[data-slider-container]");
  const sliderPrevBtn = currentSlider.querySelector("[data-slider-prev]");
  const sliderNextBtn = currentSlider.querySelector("[data-slider-next]");

  let totalSliderVisibleItems = Number(getComputedStyle(currentSlider).getPropertyValue("--slider-items"));
  let totalSlidableItems = sliderContainer.childElementCount - totalSliderVisibleItems;
  let currentSlidePos = 0;

  const moveSliderItem = function () {
    sliderContainer.style.transform = `translateX(-${sliderContainer.children[currentSlidePos].offsetLeft}px)`;
  }

  const slideNext = function () {
    const slideEnd = currentSlidePos >= totalSlidableItems;
    if (slideEnd) {
      currentSlidePos = 0;
    } else {
      currentSlidePos++;
    }
    moveSliderItem();
  }

  const slidePrev = function () {
    if (currentSlidePos <= 0) {
      currentSlidePos = totalSlidableItems;
    } else {
      currentSlidePos--;
    }
    moveSliderItem();
  }

  sliderNextBtn.addEventListener("click", slideNext);
  sliderPrevBtn.addEventListener("click", slidePrev);

  enableTouchpadScroll(currentSlider, (direction) => {
    if (direction === 'next') {
      slideNext();
    } else if (direction === 'prev') {
      slidePrev();
    }
  });

  window.addEventListener("resize", function () {
    totalSliderVisibleItems = Number(getComputedStyle(currentSlider).getPropertyValue("--slider-items"));
    totalSlidableItems = sliderContainer.childElementCount - totalSliderVisibleItems;
    moveSliderItem();
  });

  moveSliderItem();
}

serviceSliders.forEach(slider => initServiceSlider(slider));

/**
 * TECHNOLOGIES REVEAL EFFECT
 */
const revealElements = document.querySelectorAll(".language-item");

if (revealElements.length > 0) {
  const revealOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const element = entry.target;
      const index = Array.from(revealElements).indexOf(element);
      
      if (entry.isIntersecting) {
        setTimeout(() => {
          element.classList.add("reveal");
          element.classList.remove("hidden");
        }, index * 100);
      } else {
        setTimeout(() => {
          element.classList.remove("reveal");
          element.classList.add("hidden");
        }, index * 100);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: "0px"
  });

  window.addEventListener("load", () => {
    revealElements.forEach(el => {
      el.classList.add("hidden");
      revealOnScroll.observe(el);
    });
  });
}

/**
 * SCROLL TO TOP BUTTON
 */
const scrollToTopBtn = document.getElementById('scrollToTop');
let isLaunching = false;

// Show button when scrolled down
window.addEventListener('scroll', function() {
  // Don't modify button state during launch animation
  if (isLaunching) return;
  
  if (window.scrollY > 300) {
    scrollToTopBtn.classList.add('show');
  } else {
    scrollToTopBtn.classList.remove('show');
  }
});

// Scroll to top with rocket launch animation
scrollToTopBtn.addEventListener('click', function() {
  isLaunching = true;
  scrollToTopBtn.classList.add('launching');
  
  // Smooth scroll to top
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
  
  // Wait for scroll to actually reach the top
  const scrollCheckInterval = setInterval(() => {
    if (window.scrollY <= 5) {
      clearInterval(scrollCheckInterval);
      scrollToTopBtn.classList.remove('launching');
      scrollToTopBtn.classList.remove('show');
      isLaunching = false;
    }
  }, 50);
  
  // Fallback timeout in case scroll completes faster
  setTimeout(() => {
    if (isLaunching) {
      clearInterval(scrollCheckInterval);
      scrollToTopBtn.classList.remove('launching');
      scrollToTopBtn.classList.remove('show');
      isLaunching = false;
    }
  }, 1500);
});

/**
 * SCROLL REVEAL EFFECT
 */
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const scrollRevealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

// Apply scroll reveal to text and section elements
document.addEventListener('DOMContentLoaded', () => {
  // Apply left-right sliding only to TEXT elements (titles, wrappers, text)
  const textElements = document.querySelectorAll(
    '.section-title, .title-wrapper, .section .section-text'
  );
  
  textElements.forEach((element, index) => {
    // Alternate between left and right for text
    if (index % 2 === 0) {
      element.classList.add('scroll-reveal-left');
    } else {
      element.classList.add('scroll-reveal-right');
    }
    scrollRevealObserver.observe(element);
  });
  
  // Apply slide-up only (no left/right) to CARDS and other elements
  const cardElements = document.querySelectorAll(
    '.service-card, .language-item, .portfolio-card, .contact-wrapper, .footer-content'
  );
  
  cardElements.forEach(element => {
    element.classList.add('scroll-reveal');
    scrollRevealObserver.observe(element);
  });
});


/**
 * OPTIMIZED NEON CURSOR - Ultra fast with requestAnimationFrame
 */
function initNeoCursor() {
  const neoCursor = document.getElementById('neon-cursor');
  if (!neoCursor) return;

  let cursorX = 0;
  let cursorY = 0;
  let ticking = false;

  // Update cursor position with requestAnimationFrame for smooth 60fps
  function updateCursor() {
    neoCursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
    ticking = false;
  }

  document.addEventListener(
    'mousemove',
    (e) => {
      cursorX = e.clientX;
      cursorY = e.clientY;

      if (!ticking) {
        requestAnimationFrame(updateCursor);
        ticking = true;
      }
    },
    { passive: true }
  );
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', function () {
  // Create neon cursor if it doesn't exist
  if (!document.getElementById('neon-cursor')) {
    const neoCursor = document.createElement('div');
    neoCursor.id = 'neon-cursor';
    document.body.appendChild(neoCursor);
  }
});