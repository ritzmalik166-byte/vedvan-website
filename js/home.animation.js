// Homepage motion: Lenis smooth scrolling, navbar scroll state and the hero shrink.
// Future section timelines should get their own init function and be registered in `init()`.
(() => {
  "use strict";

  const CONFIG = {
    lenis: {
      lerp: 0.1,
      wheelMultiplier: 1,
      anchors: true,
    },
    navbar: {
      scrolledClass: "is-scrolled",
      threshold: 12, // px scrolled before the navbar turns solid
    },
    hero: {
      scrub: 0.8,
      // Per breakpoint: pin length (fraction of viewport height), side inset (px),
      // gap below the fixed navbar (px), bottom inset (fraction of hero height), corner radius (px).
      breakpoints: {
        "(min-width: 1024px)": { distance: 0.7, x: 48, gapTop: 24, bottom: 0.12, radius: 20 },
        "(min-width: 768px) and (max-width: 1023.98px)": { distance: 0.6, x: 24, gapTop: 16, bottom: 0.08, radius: 16 },
        "(max-width: 767.98px)": { distance: 0.45, x: 12, gapTop: 12, bottom: 0.05, radius: 12 },
      },
    },
  };

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lenis = null;

  function initSmoothScroll() {
    if (prefersReducedMotion || typeof window.Lenis !== "function") return;

    lenis = new window.Lenis(CONFIG.lenis);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function initNavbarScrollState() {
    const header = document.getElementById("site-header");
    if (!header) return;

    const { scrolledClass, threshold } = CONFIG.navbar;
    let isScrolled = null;

    const update = (scrollY) => {
      const next = scrollY > threshold;
      if (next === isScrolled) return;
      isScrolled = next;
      header.classList.toggle(scrolledClass, next);
    };

    update(window.scrollY);

    if (lenis) {
      lenis.on("scroll", ({ scroll }) => update(scroll));
    } else {
      window.addEventListener("scroll", () => update(window.scrollY), { passive: true });
    }
  }

  function initHeroShrinkAnimation() {
    const hero = document.querySelector(".js-hero");
    const frame = hero?.querySelector(".js-hero-frame");
    if (!frame || prefersReducedMotion) return;

    const header = document.getElementById("site-header");
    const indicator = hero.querySelector(".js-scroll-indicator");
    const mm = gsap.matchMedia();

    Object.entries(CONFIG.hero.breakpoints).forEach(([query, bp]) => {
      mm.add(query, () => {
        const headerHeight = () => (header ? header.offsetHeight : 0);

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * bp.distance)}`,
            pin: true,
            scrub: CONFIG.hero.scrub,
            invalidateOnRefresh: true,
          },
        });

        tl.to(frame, {
          top: () => headerHeight() + bp.gapTop,
          bottom: () => Math.round(hero.offsetHeight * bp.bottom),
          left: bp.x,
          right: bp.x,
          borderRadius: bp.radius,
          duration: 1,
        }, 0);

        if (indicator) tl.to(indicator, { autoAlpha: 0, duration: 0.35 }, 0);
      });
    });
  }

  function init() {
    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
      initNavbarScrollState();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    initSmoothScroll();
    initNavbarScrollState();
    initHeroShrinkAnimation();
  }

  init();
})();
