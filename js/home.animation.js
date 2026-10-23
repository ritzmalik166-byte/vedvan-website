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
      scrub: 1,
      // The hero scrolls this share of its height before pinning; the intro then slides over it until it
      // covers `cover` of the viewport height, and both scroll on together.
      pinAt: 0.1,
      minDistance: 0.25, // shortest pin, as a fraction of the viewport height
      content: { y: -15, blur: 8 }, // end state of the centred hero content
      breakpoints: {
        "(min-width: 1024px)": { cover: 0.6 },
        "(min-width: 768px) and (max-width: 1023.98px)": { cover: 0.55 },
        "(max-width: 767.98px)": { cover: 0.5 },
      },
    },
    intro: {
      // Scrubbed over the section's height: each element starts as it crosses the `line` viewport position.
      // `duration` and `gap` (minimum delay after the previous element) are fractions of that scroll distance.
      line: "85%",
      scrub: 1.2,
      duration: 0.4,
      gap: 0.08,
      breakpoints: {
        "(min-width: 768px)": { y: 60, blur: 10 },
        "(max-width: 767.98px)": { y: 40, blur: 6 },
      },
    },
    butterfly: {
      start: "top 80%",
      duration: 2.2,
      arc: 36, // px the flight path dips below and rises above the resting point
      tilt: 14,
      flap: { duration: 0.16, near: { rotation: -8, scaleX: 0.86 }, far: { rotation: 14, scaleX: 0.7 } },
      hover: { y: 4, rotation: 2, duration: 2.4 },
    },
    visionMission: {
      // Scrubbed over the section's height: an element animates as it crosses the `line` viewport position.
      // Durations are fractions of that scroll distance.
      reveal: { line: "85%", scrub: 1.2, text: { y: 32, blur: 8, duration: 0.12 }, image: { duration: 0.4, after: 0.04 } },
      watermark: { x: 16, y: 12, rotation: 1.5, durationX: 11, durationY: 8 },
    },
    elements: {
      // The pin's progress picks the slide: slide i + 1 becomes the target once progress passes thresholds[i].
      // `distance` is the pin length as a multiple of the viewport height.
      breakpoints: {
        "(min-width: 1024px)": { distance: 2, thresholds: [0.22, 0.58] },
        "(max-width: 1023.98px)": { distance: 1.6, thresholds: [0.22, 0.58] },
      },
      // Seconds, px for `drift`. The text card starts `cardDelay` after the image and both end together; the card's
      // text then comes into focus from `text.at`. Steps run `catchUp` times faster while more are queued. With
      // reduced motion the slides crossfade over `reduced`.
      transition: {
        image: 2.8, card: 2.6, cardDelay: 0.2, ease: "sine.inOut", drift: 28,
        text: { at: 0.9, duration: 1.6, stagger: 0.15, y: -16, blur: 6, ease: "power2.out" },
        dot: 0.5, dotAt: 1.3, catchUp: 2.2, reduced: 0.35,
      },
      // Water-spread edge: `reach` is the final radius (box-normalised, past the far corner), `lead` pushes the
      // diagonal ahead of the sides, `ripple` is the wave height as a share of the box's shorter side.
      spread: { reach: 1.36, lead: 0.08, ripple: 0.04, points: 72 },
    },
    philosophy: {
      scrub: 0.8,
      blur: 8,
      hold: 0.15, // share of the pin spent fully revealed before unpinning
      minImageVisible: 0.5, // below this share of the image left under the header, reveal without pinning
      // The image grows from its bottom-left corner, starting clipped by `inset` % on its top and right sides, while
      // the stage scrolls in; the card then rises during the pin. Unpinned, both share one timeline: the image
      // takes 1 unit and the card's 1-unit rise starts at `cardAt`.
      image: { cardAt: 0.8, inset: 40 },
      breakpoints: {
        "(min-width: 1024px)": { distance: 1.1, y: 110 },
        "(max-width: 1023.98px)": { distance: 0.85, y: 80 },
      },
    },
    experience: {
      header: { y: 36, blur: 8, start: "top 90%", end: "top 55%", scrub: 0.8, stagger: 0.15 },
      // Times in seconds; `dragThreshold` in px; `throw` projects the release velocity (px/ms) this many ms ahead.
      slider: { interval: 5, duration: 0.8, settle: 0.6, dragThreshold: 6, throw: 120 },
    },
    community: {
      header: { y: 40, blur: 8, start: "top 95%", end: "top 30%", scrub: 1.5, stagger: 0.15 },
      // Image timeline: from the map's top reaching `start` (fraction of the viewport height) over `distance` viewport heights.
      // Positions and durations of `image` and `markers` are fractions of that scroll distance.
      reveal: { start: 0.92, distance: 0.6, scrub: 1.6 },
      image: { duration: 0.78, top: 45, right: 40, scale: 1.1 }, // collapsed clip insets in %
      markers: { at: 0.56, duration: 0.22, stagger: 0.055, y: 12 },
      // Strip timeline: begins once the image timeline ends and the strip's bottom has reached `start`,
      // then runs `distance` viewport heights so the strip is on screen while it opens.
      stats: { start: 0.95, distance: 0.5, duration: 0.7 },
      // Each counter starts once `visible` of its column has been uncovered by the opening strip
      counters: { duration: 0.3, visible: 0.4 },
    },
    communityStory: {
      // One scrubbed timeline from the section's top reaching `line`. Each element starts as its own top reaches
      // `line` and its tween lasts `distance` viewport heights of scrolling; `gap` and `after` are minimum delays
      // (viewport heights) after the previous text line or the start of the main image.
      line: 0.88,
      scrub: 1.6,
      text: { y: 56, blur: 8, distance: 0.3, gap: 0.05 },
      image: { distance: 0.55, after: 0.06, top: 40, scale: 1.12 }, // collapsed top inset in %
      gallery: { distance: 0.4, after: 0.18, stagger: 0.08, y: 40 },
      breakpoints: {
        // Side by side, the main image waits for the heading; stacked, it sits above the text and leads
        "(min-width: 1024px)": { imageFollowsHeading: true },
        "(max-width: 1023.98px)": { imageFollowsHeading: false },
      },
    },
    rooted: {
      // Same scheme as `communityStory`. The image starts once `anchor` of its height has passed `line`,
      // and the arrow button fades in over the last `cta.from` share of the image reveal.
      line: 0.88,
      scrub: 1.6,
      text: { y: 50, blur: 8, distance: 0.3, gap: 0.06 },
      image: { distance: 0.55, anchor: 0.15, after: 0.08, top: 40, scale: 1.1 }, // collapsed top inset in %
      cta: { from: 0.75, scale: 0.8 },
    },
    location: {
      // Plays once when its trigger's top reaches `start`. Times in seconds; `card.delay` is measured from the
      // first text line when side by side. `outset` (px) keeps the card's shadow unclipped.
      start: "top 80%",
      text: { y: 56, blur: 8, duration: 1.1, stagger: 0.14, ease: "power3.out" },
      card: { duration: 1.4, delay: 0.25, ease: "power2.inOut", outset: 40 },
      // Per badge: float height (px), half-cycle duration (s) and starting phase. Smaller below 640px,
      // where the badges sit in a tight grid instead of around the hub.
      float: {
        durations: [3.2, 3.8, 3.5, 4.1],
        phases: [0, 0.4, 0.75, 0.2],
        breakpoints: {
          "(min-width: 640px)": [9, 12, 7, 10],
          "(max-width: 639.98px)": [3, 4, 3, 4],
        },
      },
    },
    privateVisit: { start: "top 80%", y: 60, blur: 10, duration: 1.2, ease: "power3.out" },
    // The footer ends the page, so it triggers a little lower to be reachable on tall viewports
    footer: { start: "top 90%", y: 60, blur: 10, duration: 1.2, ease: "power3.out" },
  };

  const ELEMENT_SLIDES = [
    {
      number: "01",
      title: "Earth",
      tagline: "The Art of Being Grounded.",
      description: "A connection to the soil, greenery and natural surroundings that brings us closer to our roots.",
      image: { src: "assets/images/earth-mountains.jpg", alt: "Mist rolling over lush green mountain valleys", width: 2880, height: 1614 },
    },
    {
      number: "02",
      title: "Water",
      tagline: "The Art of Finding Flow.",
      description: "Discover a calmer rhythm through flowing water, mindful living and a deeper connection with nature.",
      image: { src: "assets/images/experience-water-bodies.jpg", alt: "A still forest river edged with lotus leaves and tall grass", width: 928, height: 1152 },
    },
    {
      number: "03",
      title: "Air",
      tagline: "The Art of Breathing Freely.",
      description: "Reconnect with open skies, fresh air and the quiet balance of a life shaped by nature.",
      image: { src: "assets/images/air-mountain-sky.jpg", alt: "Mountain peaks under an open sky with soft drifting clouds", width: 2400, height: 1600 },
    },
  ];

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

  // The hero scrolls a little, then pins at full size while the intro section scrolls up over it (no pin
  // spacing, so the intro keeps its natural position and its own triggers). Meanwhile the centred hero
  // content blurs, lifts and fades. Once the intro covers its share of the viewport the pin ends and the
  // hero carries on from where it was held, so both scroll on together.
  function initHeroStackAnimation() {
    const hero = document.querySelector(".js-hero");
    const content = hero?.querySelector(".js-hero-content");
    const intro = document.getElementById("intro");
    if (!content || !intro || prefersReducedMotion) return;

    const indicator = hero.querySelector(".js-scroll-indicator");
    const { scrub, pinAt, minDistance, content: end } = CONFIG.hero;
    const mm = gsap.matchMedia();

    Object.entries(CONFIG.hero.breakpoints).forEach(([query, bp]) => {
      mm.add(query, () => {
        // Scroll from the pin until the intro's top (at 1 - pinAt of the hero height) reaches 1 - cover of the viewport
        const distance = () => {
          const vh = window.innerHeight;
          return Math.round(Math.max(vh * minDistance, hero.offsetHeight * (1 - pinAt) - vh * (1 - bp.cover)));
        };

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: hero,
            start: `${pinAt * 100}% top`,
            end: () => `+=${distance()}`,
            pin: true,
            pinSpacing: false,
            scrub,
            invalidateOnRefresh: true,
          },
        });

        tl.fromTo(content, { y: 0, opacity: 1, filter: "blur(0px)" }, { y: end.y, opacity: 0, filter: `blur(${end.blur}px)`, duration: 1 }, 0);
        if (indicator) tl.to(indicator, { autoAlpha: 0, duration: 0.35 }, 0);
      });
    });
  }

  // Each text line rises into place out of a blur on one scrubbed timeline, placed at its position within the
  // section. The lotus emblem stays put: the butterfly flies in and lands on it (see initButterflyAnimation).
  function initIntroReveal() {
    const section = document.getElementById("intro");
    if (!section || prefersReducedMotion || section.dataset.introReady) return;

    const lines = [
      section.querySelector(".js-section-heading"),
      ...section.querySelectorAll(".js-section-content > p"),
      section.querySelector(".js-section-tagline"),
    ].filter(Boolean);
    if (!lines.length) return;
    section.dataset.introReady = "true";

    const { line, scrub, duration, gap, breakpoints } = CONFIG.intro;
    const mm = gsap.matchMedia();

    Object.entries(breakpoints).forEach(([query, bp]) => {
      mm.add(query, () => {
        const sectionBox = section.getBoundingClientRect();
        const at = (el) => (el.getBoundingClientRect().top - sectionBox.top) / sectionBox.height;

        const tl = gsap.timeline({
          defaults: { ease: "power2.out", duration },
          scrollTrigger: { trigger: section, start: `top ${line}`, end: `bottom ${line}`, scrub },
        });
        tl.set({}, {}, 1);

        let previous = -Infinity;
        lines.forEach((el) => {
          previous = Math.min(Math.max(at(el), previous + gap), 1 - duration);
          tl.fromTo(el, { y: bp.y, opacity: 0, filter: `blur(${bp.blur}px)` },
            { y: 0, opacity: 1, filter: "blur(0px)" }, previous);
        });
      });
    });
  }

  function initButterflyFlap(near, far) {
    const { duration, near: nearPose, far: farPose } = CONFIG.butterfly.flap;

    return gsap.timeline({ repeat: -1, yoyo: true, paused: true, defaults: { duration, ease: "sine.inOut" } })
      .to(near, nearPose, 0)
      .to(far, farPose, 0);
  }

  function initButterflyAnimation() {
    const section = document.getElementById("intro");
    const butterfly = section?.querySelector(".js-butterfly");
    if (!butterfly || prefersReducedMotion) return;

    const emblem = butterfly.offsetParent || butterfly.parentElement;
    const near = butterfly.querySelector(".js-butterfly-wing-near");
    const far = butterfly.querySelector(".js-butterfly-wing-far");
    const { start, duration, arc, tilt, hover } = CONFIG.butterfly;

    const flap = near && far ? initButterflyFlap(near, far) : null;
    const float = gsap.timeline({ repeat: -1, yoyo: true, paused: true, defaults: { duration: hover.duration, ease: "sine.inOut" } })
      .fromTo(butterfly, { y: -hover.y, rotation: -hover.rotation }, { y: hover.y, rotation: hover.rotation, immediateRender: false });

    // Distance from the butterfly's resting spot to just past the left edge of the viewport
    const offscreenX = () => -(emblem.getBoundingClientRect().left + butterfly.offsetLeft + butterfly.offsetWidth + 24);

    let entered = false;

    const visibility = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onToggle: ({ isActive }) => {
        if (!entered) return;
        flap?.paused(!isActive);
        float.paused(!isActive);
      },
    });

    const entrance = gsap.timeline({
      paused: true,
      onComplete: () => {
        entered = true;
        float.progress(0.5);
        if (visibility.isActive) float.play();
        else flap?.pause();
      },
    })
      .fromTo(butterfly, { x: offscreenX }, { x: 0, duration, ease: "power2.out" }, 0)
      .fromTo(butterfly, { y: arc, rotation: tilt }, { y: -arc * 0.5, rotation: -tilt * 0.4, duration: duration * 0.55, ease: "sine.out" }, 0)
      .to(butterfly, { y: 0, rotation: 0, duration: duration * 0.45, ease: "sine.inOut" }, duration * 0.55);

    const resetStartPosition = () => {
      if (entrance.progress() === 0 && !entrance.isActive()) entrance.invalidate().progress(0).pause();
    };
    ScrollTrigger.addEventListener("refresh", resetStartPosition);
    entrance.eventCallback("onStart", () => {
      ScrollTrigger.removeEventListener("refresh", resetStartPosition);
      flap?.play();
    });

    ScrollTrigger.create({
      trigger: section,
      start,
      once: true,
      onEnter: () => entrance.play(),
    });
  }

  // Heading → Vision text → Vision image (right to left) → Mission text → Mission image (left to right),
  // each placed on one scrubbed timeline at its position within the section so it reveals as it scrolls in.
  function initVisionMissionReveal() {
    const section = document.getElementById("vision-mission");
    if (!section || prefersReducedMotion) return;

    const { line, scrub, text, image } = CONFIG.visionMission.reveal;
    const rows = [...section.querySelectorAll(".js-vision-row, .js-mission-row")];
    const hiddenClip = ["inset(0% 0% 0% 100%)", "inset(0% 100% 0% 0%)"];
    const mm = gsap.matchMedia();

    // Positions depend on whether rows are stacked or side by side, so rebuild when that changes
    ["(min-width: 1024px)", "(max-width: 1023.98px)"].forEach((query) => {
      mm.add(query, () => {
        const sectionBox = section.getBoundingClientRect();
        const at = (el) => (el.getBoundingClientRect().top - sectionBox.top) / sectionBox.height;
        const place = (el, duration) => Math.max(0, Math.min(at(el), 1 - duration));

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: section, start: `top ${line}`, end: `bottom ${line}`, scrub },
        });
        tl.set({}, {}, 1);

        const revealText = (el) => {
          tl.fromTo(el, { y: text.y, opacity: 0, filter: `blur(${text.blur}px)` },
            { y: 0, opacity: 1, filter: "blur(0px)", duration: text.duration, ease: "power2.out" }, place(el, text.duration));
        };

        const heading = section.querySelector(".js-section-heading");
        if (heading) revealText(heading);

        rows.forEach((row, i) => {
          const lines = [...row.querySelectorAll(".js-section-content h3, .js-section-content p")];
          lines.forEach(revealText);

          const img = row.querySelector(".js-reveal-image");
          if (!img) return;
          const start = Math.max(place(img.parentElement, image.duration), lines[0] ? at(lines[0]) + image.after : 0);
          tl.fromTo(img, { clipPath: hiddenClip[i % 2] }, { clipPath: "inset(0% 0% 0% 0%)", duration: image.duration, ease: "power1.inOut" },
            Math.min(start, 1 - image.duration));
        });
      });
    });
  }

  function initVisionMissionWatermark() {
    const section = document.getElementById("vision-mission");
    const watermark = section?.querySelector(".js-vision-watermark");
    if (!watermark || prefersReducedMotion) return;

    const { x, y, rotation, durationX, durationY } = CONFIG.visionMission.watermark;
    const loop = { ease: "sine.inOut", repeat: -1, yoyo: true, paused: true };
    // Each loop starts halfway through, i.e. at the watermark's design position
    const drift = [
      gsap.fromTo(watermark, { x: -x, rotation: -rotation }, { ...loop, x, rotation, duration: durationX }).progress(0.5),
      gsap.fromTo(watermark, { y: -y }, { ...loop, y, duration: durationY }).progress(0.5),
    ];

    ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onToggle: ({ isActive }) => drift.forEach((tween) => tween.paused(!isActive)),
    });
  }

  function applyElementSlide(scope, slide) {
    const set = (selector, apply) => {
      const el = scope.querySelector(selector);
      if (el) apply(el);
    };
    set(".js-element-number", (el) => { el.textContent = slide.number; });
    set(".js-element-name", (el) => { el.textContent = slide.title; });
    set(".js-element-tagline", (el) => { el.textContent = slide.tagline; });
    set(".js-element-description", (el) => { el.textContent = slide.description; });
    set(".js-element-image", (el) => {
      const { src, alt, width, height } = slide.image;
      Object.assign(el, { src, alt, width, height });
    });
  }

  // Without GSAP the Water and Air slides follow Earth as static sections.
  function renderStaticElementSlides(section) {
    let previous = section;
    ELEMENT_SLIDES.slice(1).forEach((slide, i) => {
      const clone = section.cloneNode(true);
      clone.id = `elements-${slide.title.toLowerCase()}`;
      clone.setAttribute("aria-label", `${slide.title} element`);
      applyElementSlide(clone, slide);
      clone.querySelectorAll(".element-dot").forEach((dot, d) => dot.classList.toggle("is-active", d === i + 1));
      previous.after(clone);
      previous = clone;
    });
  }

  // Pinned Earth → Water → Air slider. The pin's progress only picks the target slide; each change then plays as
  // a timed (not scrubbed) transition to the neighbouring slide, in either scroll direction: the incoming image
  // spreads over the current one like water from its bottom-left corner, and the incoming text card spreads over
  // the panel the same way while settling up and to the right. Transitions run one at a time until the target is
  // reached; a running one always completes.
  function initSection4PinnedSlider() {
    const section = document.getElementById("elements");
    if (!section || section.dataset.sliderReady) return;
    section.dataset.sliderReady = "true";

    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
      renderStaticElementSlides(section);
      return;
    }

    const panel = section.querySelector(".js-element-panel");
    const image = section.querySelector(".js-element-image");
    const sharedDots = panel?.querySelector(".js-element-dots");
    if (!panel || !image || !sharedDots) return;

    // Every slide gets a full-panel card (with a hidden copy of the dots so its layout matches the panel's) and an
    // image layer. The original panel content stays in place, invisible, to keep the panel's size.
    const panelContent = [...panel.children];
    const cards = ELEMENT_SLIDES.map((slide) => {
      const card = document.createElement("div");
      card.className = "element-card";
      card.append(...panelContent.map((el) => el.cloneNode(true)));
      applyElementSlide(card, slide);
      panel.appendChild(card);
      return card;
    });
    panelContent.filter((el) => el !== sharedDots).forEach((el) => {
      el.style.visibility = "hidden";
      el.setAttribute("aria-hidden", "true");
    });
    const images = ELEMENT_SLIDES.map((slide, k) => {
      if (!k) return image;
      const layer = image.cloneNode(true);
      const { src, alt, width, height } = slide.image;
      Object.assign(layer, { src, alt, width, height });
      image.parentNode.appendChild(layer);
      return layer;
    });

    // Cards sit inside the panel, so its percentage paddings would resolve differently; copy the used values
    const syncCardPadding = () => {
      const { paddingTop, paddingRight, paddingBottom, paddingLeft } = getComputedStyle(panel);
      cards.forEach((card) => Object.assign(card.style, { paddingTop, paddingRight, paddingBottom, paddingLeft }));
    };
    syncCardPadding();
    new ResizeObserver(syncCardPadding).observe(panel);

    const dots = [...sharedDots.querySelectorAll(".element-dot")];
    const header = document.getElementById("site-header");
    const { transition, spread, breakpoints } = CONFIG.elements;
    const { text } = transition;
    const cardText = cards.flatMap((card) => [...card.querySelectorAll(":scope > .js-element-title, :scope > .js-section-content")]);
    const mm = gsap.matchMedia();
    const HIDDEN = "polygon(0% 100%, 0% 100%, 0% 100%)";
    const dotState = (active) => (active
      ? { backgroundColor: "rgba(255, 255, 255, 1)", borderColor: "rgba(255, 255, 255, 1)" }
      : { backgroundColor: "rgba(255, 255, 255, 0)", borderColor: "rgba(192, 207, 221, 1)" });

    // Boundary of a reveal spreading from the bottom-left corner of a w × h box at progress p (0–1): a quarter
    // ellipse (box-normalised, so it sweeps along the diagonal) that bulges towards the top-right corner, with
    // two slow waves travelling along its edge. The waves fade out at both ends so it starts and ends cleanly.
    const spreadClip = (w, h, p, seed) => {
      if (p <= 0) return HIDDEN;
      if (p >= 1) return "none";
      const r = spread.reach * p;
      const ref = Math.min(w, h);
      const amp = ref * spread.ripple * Math.sin(Math.PI * p);
      const points = [`0px ${h}px`];
      for (let i = 0; i <= spread.points; i++) {
        const a = (i / spread.points) * (Math.PI / 2);
        const s = (a * r * (w + h)) / 2; // ≈ distance along the edge, so wave sizes don't depend on the angle
        const wave = 0.7 * Math.sin(s / (ref * 0.3) + p * 3.5 + seed) + 0.3 * Math.sin(s / (ref * 0.14) - p * 5 + seed * 1.7);
        const k = r * (1 + spread.lead * Math.sin(2 * a));
        const d = amp * wave;
        points.push(`${((k * w + d) * Math.cos(a)).toFixed(1)}px ${(h - (k * h + d) * Math.sin(a)).toFixed(1)}px`);
      }
      return `polygon(${points.join(", ")})`;
    };

    const spreadOver = (el, duration, seed) => {
      const state = { p: 0 };
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      return gsap.to(state, {
        p: 1,
        duration,
        ease: transition.ease,
        onUpdate: () => { el.style.clipPath = spreadClip(w, h, state.p, seed); },
      });
    };

    let current = 0; // settled slide
    let target = 0; // slide picked by the scroll position
    let active = null; // running transition: { tl, to }

    const setHidden = (el, hidden) => (hidden ? el.setAttribute("aria-hidden", "true") : el.removeAttribute("aria-hidden"));
    const markActive = (index) => {
      current = index;
      cards.forEach((card, k) => setHidden(card, k !== index));
      images.forEach((img, k) => setHidden(img, k !== index));
    };

    // Shows a slide immediately (layout changes, restored scroll positions)
    const showSlide = (index) => {
      gsap.set([...cards, ...images], { zIndex: 1, opacity: 1, clipPath: (k, el) => (el === cards[index] || el === images[index] ? "none" : HIDDEN) });
      gsap.set(cards, { x: 0, y: 0 });
      gsap.set(cardText, { clearProps: "opacity,filter,transform" });
      dots.forEach((dot, k) => gsap.set(dot, dotState(k === index)));
      markActive(index);
    };

    // Plays the neighbouring slide `to` over the current one; the outgoing layers stay visible underneath until it ends
    function transitionToSlide(to) {
      const from = current;
      const incoming = [cards[to], images[to]];
      const outgoing = [cards[from], images[from]];
      gsap.set(outgoing, { zIndex: 1 });
      gsap.set(incoming, { zIndex: 2 });

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(outgoing, { clipPath: HIDDEN });
          gsap.set(incoming, { zIndex: 1 });
          active = null;
          markActive(to);
          advance();
        },
      });

      if (prefersReducedMotion) {
        tl.fromTo(incoming, { clipPath: "none", opacity: 0 }, { opacity: 1, duration: transition.reduced, ease: "none" }, 0)
          .to(dots[from], { ...dotState(false), duration: transition.reduced }, 0)
          .to(dots[to], { ...dotState(true), duration: transition.reduced }, 0);
      } else {
        tl.add(spreadOver(images[to], transition.image, to * 2.1), 0)
          .add(spreadOver(cards[to], transition.card, to * 2.1 + 1), transition.cardDelay)
          .fromTo(cards[to], { x: -transition.drift, y: transition.drift }, { x: 0, y: 0, duration: transition.card, ease: transition.ease }, transition.cardDelay)
          .fromTo(
            cardText.filter((el) => cards[to].contains(el)),
            { y: text.y, opacity: 0, filter: `blur(${text.blur}px)` },
            { y: 0, opacity: 1, filter: "blur(0px)", duration: text.duration, stagger: text.stagger, ease: text.ease, clearProps: "filter" },
            text.at,
          )
          .to(dots[from], { ...dotState(false), duration: transition.dot }, transition.dotAt)
          .to(dots[to], { ...dotState(true), duration: transition.dot }, transition.dotAt);
      }

      active = { tl, to };
      pace();
    }

    // Runs faster while more transitions are queued behind the current one
    const pace = () => active.tl.timeScale(target === active.to ? 1 : transition.catchUp);

    function advance() {
      if (active) {
        pace();
        return;
      }
      if (target !== current) transitionToSlide(current + Math.sign(target - current));
    }

    // While a transition runs (or more are queued), the page can scroll within the pin but not out of it, so a
    // fast fling can't carry the section away before the slides it triggered have finished
    let pin = null;
    let holding = false;
    function holdInPin() {
      if (!active || !pin || holding) return;
      const y = pin.scroll();
      const to = gsap.utils.clamp(pin.start + 1, pin.end - 1, y);
      if (to === y) return;
      holding = true;
      if (lenis) lenis.scrollTo(to, { immediate: true, force: true });
      else window.scrollTo(0, to);
      ScrollTrigger.update();
      holding = false;
    }

    showSlide(0);

    Object.entries(breakpoints).forEach(([query, bp]) => {
      mm.add(query, () => {
        section.classList.add("is-slider");
        const targetFor = (progress) => bp.thresholds.filter((t) => progress >= t).length;

        pin = ScrollTrigger.create({
          trigger: section,
          start: () => `top ${header ? header.offsetHeight : 0}px`,
          end: () => `+=${Math.round(window.innerHeight * bp.distance)}`,
          pin: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            target = targetFor(self.progress);
            advance();
            holdInPin();
          },
          onRefresh: (self) => {
            target = targetFor(self.progress);
            if (!active) showSlide(target);
          },
        });

        return () => {
          pin = null;
          active?.tl.kill();
          active = null;
          showSlide(current);
          section.classList.remove("is-slider");
        };
      });
    });
  }

  // As the image + card wrapper scrolls into view the image grows from its bottom-left corner to its full shape
  // (clipped, not scaled); the wrapper then pins while the card rises into its layout position, blurred to sharp.
  // It pins with the image just below the header, or higher when that is needed to show the whole card;
  // when that would hide the card or most of the image, the reveal is scrubbed without a pin.
  function initSection5PhilosophyAnimation() {
    const section = document.getElementById("philosophy");
    const stage = section?.querySelector(".js-philosophy-stage");
    const card = stage?.querySelector(".js-philosophy-panel");
    const image = stage?.querySelector(".js-section-image");
    if (!card || !image || prefersReducedMotion || section.dataset.philosophyReady) return;
    section.dataset.philosophyReady = "true";

    const header = document.getElementById("site-header");
    const { scrub, blur, hold, minImageVisible, image: reveal } = CONFIG.philosophy;
    const headerHeight = () => (header ? header.offsetHeight : 0);
    const cardOffset = () => card.offsetTop;
    // Highest viewport position for the stage that keeps the whole card on screen
    const fitTop = () => window.innerHeight - stage.offsetHeight;
    // Pin only if the card's content (its top padding may tuck under the header) and at least half the image stay visible
    const canPin = () => {
      const top = Math.min(headerHeight(), fitTop());
      const cardContentVisible = top + cardOffset() + parseFloat(getComputedStyle(card).paddingTop) >= headerHeight();
      const imageVisible = (top + image.offsetHeight - headerHeight()) / image.offsetHeight;
      return cardContentVisible && imageVisible >= minImageVisible;
    };

    let mm = null;
    let pinned = null;

    const build = () => {
      mm = gsap.matchMedia();
      pinned = canPin();
      Object.entries(CONFIG.philosophy.breakpoints).forEach(([query, bp]) => {
        mm.add(query, () => {
          const hidden = { y: bp.y, opacity: 0, filter: `blur(${blur}px)` };
          const shown = { y: 0, opacity: 1, filter: "blur(0px)", ease: "power2.out", duration: 1 };

          const grow = [
            image,
            { clipPath: `inset(${reveal.inset}% ${reveal.inset}% 0% 0%)` },
            { clipPath: "inset(0% 0% 0% 0%)", ease: "power1.inOut", duration: 1 },
          ];

          if (!pinned) {
            gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: stage, start: "top bottom", end: "bottom 85%", scrub, invalidateOnRefresh: true } })
              .fromTo(...grow, 0)
              .fromTo(card, hidden, shown, reveal.cardAt);
            return;
          }

          const pinTop = () => Math.min(headerHeight(), fitTop());
          // The image grows while the stage scrolls in, from its top entering the viewport until it pins
          gsap.fromTo(...grow.slice(0, 2), {
            ...grow[2],
            scrollTrigger: { trigger: stage, start: "top bottom", end: () => `top ${pinTop()}px`, scrub, invalidateOnRefresh: true },
          });

          gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: stage,
              start: () => `top ${pinTop()}px`,
              end: () => `+=${Math.round(window.innerHeight * bp.distance)}`,
              pin: true,
              scrub,
              invalidateOnRefresh: true,
            },
          })
            .fromTo(card, hidden, shown, 0)
            .set({}, {}, 1 + hold);
        });
      });
    };

    build();

    // Font loading and viewport changes can move the card across the fit threshold
    const rebuildIfNeeded = () => {
      if (canPin() === pinned) return;
      mm.revert();
      build();
      ScrollTrigger.refresh();
    };
    document.fonts?.ready.then(rebuildIfNeeded);
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(rebuildIfNeeded, 200);
    });
  }

  function initSection6HeaderAnimation() {
    const header = document.querySelector("#experience .js-section-heading");
    if (!header || prefersReducedMotion) return;

    const { y, blur, start, end, scrub, stagger } = CONFIG.experience.header;
    gsap.fromTo(header.children, { y, opacity: 0, filter: `blur(${blur}px)` }, {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      ease: "power2.out",
      stagger,
      scrollTrigger: { trigger: header, start, end, scrub },
    });
  }

  // Cards sit on a rail of [clones][originals][clones][clones]. The rail position wraps modulo one set width,
  // so it can move forever in either direction without a visible reset. Without JS the track scrolls natively.
  function initSection6InfiniteSlider() {
    const track = document.querySelector("#experience .js-card-track");
    const cards = track ? [...track.querySelectorAll(".js-feature-card")] : [];
    if (cards.length < 2 || track.dataset.sliderReady) return;
    track.dataset.sliderReady = "true";

    const { interval, duration, settle, dragThreshold, throw: throwMs } = CONFIG.experience.slider;
    const count = cards.length;
    const cloneSet = () => cards.map((card) => {
      const clone = card.cloneNode(true);
      clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      clone.setAttribute("aria-hidden", "true");
      clone.inert = true;
      return clone;
    });

    // The viewport clips at the track's content edge (cards rest there, as designed) and bleeds to its right edge
    const viewport = document.createElement("div");
    const rail = document.createElement("div");
    viewport.className = "js-card-viewport";
    rail.className = "js-card-rail";
    rail.append(...cloneSet(), ...cards, ...cloneSet(), ...cloneSet());
    viewport.appendChild(rail);
    track.appendChild(viewport);
    track.classList.add("is-slider");

    const setX = gsap.quickSetter(rail, "x", "px");
    const pos = { x: 0 }; // px travelled from the first original card; may be any value
    let step = 0;
    let index = 0; // card the rail is resting on or heading to
    let tween = null;
    let timer = null;
    let drag = null;
    let hovering = false;
    let inView = false;
    let suppressClick = false;

    const measure = () => {
      step = cards[0].offsetWidth + (parseFloat(getComputedStyle(rail).columnGap) || 0);
      viewport.style.marginRight = `-${getComputedStyle(track).paddingRight}`;
    };
    const render = () => setX(-count * step - gsap.utils.wrap(0, count * step, pos.x));

    const goTo = (target, time = duration, ease = "power2.inOut") => {
      index = target;
      tween?.kill();
      tween = gsap.to(pos, { x: index * step, duration: time, ease, onUpdate: render });
    };

    const stopAutoplay = () => {
      timer?.kill();
      timer = null;
    };
    const startAutoplay = () => {
      stopAutoplay();
      if (prefersReducedMotion || !inView || hovering || drag || document.hidden || track.matches(":focus-visible")) return;
      timer = gsap.delayedCall(interval, () => {
        goTo(index + 1);
        startAutoplay();
      });
    };

    const onPointerMove = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      if (!drag.active) {
        if (Math.abs(dx) < dragThreshold) return;
        // Mostly vertical: leave the gesture to the page
        if (Math.abs(e.clientY - drag.y) > Math.abs(dx)) {
          drag = null;
          startAutoplay();
          return;
        }
        drag.active = true;
        tween?.kill();
        track.setPointerCapture(e.pointerId);
        track.classList.add("is-dragging");
      }
      const dt = e.timeStamp - drag.lastT;
      if (dt > 0) drag.velocity = (e.clientX - drag.lastX) / dt;
      drag.lastX = e.clientX;
      drag.lastT = e.timeStamp;
      pos.x = drag.startX - dx;
      render();
    };

    const onPointerUp = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const { active, velocity, lastT } = drag;
      drag = null;
      track.classList.remove("is-dragging");
      if (active) {
        suppressClick = true;
        const fling = e.timeStamp - lastT < 100 ? velocity * throwMs : 0;
        const nearest = Math.round(pos.x / step);
        goTo(gsap.utils.clamp(nearest - 1, nearest + 1, Math.round((pos.x - fling) / step)), settle, "power3.out");
      }
      startAutoplay();
    };

    track.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      suppressClick = false;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, startX: pos.x, lastX: e.clientX, lastT: e.timeStamp, velocity: 0, active: false };
      stopAutoplay();
    });
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", onPointerUp);
    track.addEventListener("pointercancel", onPointerUp);
    track.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      hovering = true;
      stopAutoplay();
    });
    track.addEventListener("pointerleave", (e) => {
      if (e.pointerType !== "mouse") return;
      hovering = false;
      startAutoplay();
    });
    track.addEventListener("dragstart", (e) => e.preventDefault());
    track.addEventListener("click", (e) => {
      if (!suppressClick) return;
      suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
    }, true);
    track.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      goTo(index + (e.key === "ArrowRight" ? 1 : -1));
    });
    track.addEventListener("focusin", stopAutoplay);
    track.addEventListener("focusout", () => setTimeout(startAutoplay));
    document.addEventListener("visibilitychange", startAutoplay);

    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      startAutoplay();
    }).observe(track);

    // Re-measure on layout changes and keep the current card aligned
    const resizeObserver = new ResizeObserver(() => {
      const previous = step;
      measure();
      if (step === previous) return;
      tween?.kill();
      pos.x = index * step;
      render();
    });
    resizeObserver.observe(track);
    resizeObserver.observe(cards[0]);

    measure();
    render();
  }

  function initSection7HeaderAnimation() {
    const section = document.getElementById("wellness-community");
    const targets = section ? [section.querySelector(".js-section-heading"), ...section.querySelectorAll(".js-section-content > p")].filter(Boolean) : [];
    if (!targets.length || prefersReducedMotion) return;

    const { y, blur, start, end, scrub, stagger } = CONFIG.community.header;
    gsap.fromTo(targets, { y, opacity: 0, filter: `blur(${blur}px)` }, {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      ease: "power1.out",
      stagger,
      scrollTrigger: { trigger: targets[0].parentElement, start, end, scrub },
    });
  }

  // Splits "40%" into an animated number and an unchanging screen-reader copy of the real value
  function createStatCounter(dd) {
    const match = dd.textContent.trim().match(/^(\D*)(\d+(?:\.\d+)?)(\D*)$/);
    if (!match) return null;

    const [text, prefix, number, suffix] = match;
    const decimals = (number.split(".")[1] || "").length;
    const visual = document.createElement("span");
    const label = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");
    visual.style.display = "inline-block";
    label.className = "sr-only";
    label.textContent = text;
    dd.replaceChildren(visual, label);

    const counter = { value: 0 };
    const render = () => { visual.textContent = `${prefix}${counter.value.toFixed(decimals)}${suffix}`; };
    // Reserve the final width so the strip's layout does not shift while digits change
    const reserveWidth = () => {
      visual.style.minWidth = "";
      visual.textContent = text;
      visual.style.minWidth = `${visual.offsetWidth}px`;
      render();
    };
    return { el: dd, counter, end: +number, render, reserveWidth };
  }

  // Image grows up and to the right from its bottom-left corner, markers settle in, then the stats strip
  // opens from its right edge while the counters run. The strip has its own scrubbed timeline that waits for the
  // image to finish, so it only opens once it is on screen.
  function initSection7CommunityAnimation() {
    const section = document.getElementById("wellness-community");
    const map = section?.querySelector(".js-estate-map");
    const figure = map?.querySelector("figure");
    const image = figure?.querySelector(".js-section-image");
    const stats = section?.querySelector(".js-estate-stats");
    if (!image || !stats || prefersReducedMotion || section.dataset.communityReady) return;
    section.dataset.communityReady = "true";

    const { reveal, image: img, markers, stats: strip, counters } = CONFIG.community;
    const markerItems = [...map.querySelectorAll(".js-estate-marker")];
    const statCounters = [...stats.querySelectorAll("dd")].map(createStatCounter).filter(Boolean);
    const radius = () => getComputedStyle(figure).borderTopRightRadius;
    const clip = (top, right) => `inset(${top}% ${right}% 0% 0% round 0px ${radius()} ${radius()} 0px)`;
    // The strip's left inset runs from 100% to -5% with power1.inOut
    const stripFrom = 100;
    const stripTo = -5;
    const easeInOutInverse = (y) => (y < 0.5 ? Math.sqrt(y / 2) : 1 - Math.sqrt((1 - y) / 2));

    statCounters.forEach((c) => c.reserveWidth());
    document.fonts?.ready.then(() => statCounters.forEach((c) => c.reserveWidth()));

    // Rebuilt when the stats switch between a 2×2 grid and a single row, since counter timing follows their layout
    const mm = gsap.matchMedia();
    ["(min-width: 768px)", "(max-width: 767.98px)"].forEach((query) => {
      mm.add(query, () => {
        const imageTl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: map,
            start: `top ${reveal.start * 100}%`,
            end: () => `+=${Math.round(window.innerHeight * reveal.distance)}`,
            scrub: reveal.scrub,
            invalidateOnRefresh: true,
          },
        });

        imageTl
          .fromTo(figure, { clipPath: () => clip(img.top, img.right) }, { clipPath: () => clip(0, 0), duration: img.duration, ease: "power1.inOut" }, 0)
          .fromTo(image, { scale: img.scale, transformOrigin: "0% 100%" }, { scale: 1, duration: img.duration, ease: "power1.out" }, 0);
        // One tween per marker (rather than `stagger`) so each start state renders before the timeline reaches it
        markerItems.forEach((item, i) => {
          imageTl.fromTo(item, { opacity: 0, y: markers.y }, { opacity: 1, y: 0, duration: markers.duration, ease: "power1.out" }, markers.at + i * markers.stagger);
        });
        imageTl.set({}, {}, 1);

        const stripTl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: stats,
            start: () => Math.max(
              imageTl.scrollTrigger.end,
              stats.getBoundingClientRect().bottom + window.scrollY - window.innerHeight * strip.start,
            ),
            end: (self) => self.start + Math.round(window.innerHeight * strip.distance),
            scrub: reveal.scrub,
            invalidateOnRefresh: true,
            // Refresh renders with callbacks suppressed, so redraw the digits from the counters' current values
            onRefresh: () => statCounters.forEach((c) => c.render()),
          },
        });

        // Negative insets keep the strip's drop shadow; the left inset opens from the right edge
        stripTl.fromTo(stats, { clipPath: `inset(-30% 0% -30% ${stripFrom}%)` }, { clipPath: `inset(-30% ${stripTo}% -30% ${stripTo}%)`, duration: strip.duration, ease: "power1.inOut" }, 0);

        const stripBox = stats.getBoundingClientRect();
        statCounters.forEach((c) => {
          const column = (c.el.closest(".js-stat") || c.el).getBoundingClientRect();
          const inset = ((column.right - column.width * counters.visible - stripBox.left) / stripBox.width) * 100;
          const opened = gsap.utils.clamp(0, 1, (stripFrom - inset) / (stripFrom - stripTo));
          const at = Math.min(easeInOutInverse(opened) * strip.duration, 1 - counters.duration);
          stripTl.fromTo(c.counter, { value: 0 }, { value: c.end, duration: counters.duration, ease: "power1.out", onUpdate: c.render }, at);
        });
        stripTl.set({}, {}, 1);
      });
    });
  }

  // Text rises out of a blur line by line, the main image opens upward and outward from its bottom-left corner,
  // then the two smaller images rise into place. Everything sits on one scrubbed timeline.
  function initSection8CommunityAnimation() {
    const section = document.getElementById("community");
    const content = section?.querySelector(".js-section-content");
    const figure = section?.querySelector("figure.js-section-image");
    const image = figure?.querySelector("img");
    if (!content || !image || prefersReducedMotion || section.dataset.communityStoryReady) return;
    section.dataset.communityStoryReady = "true";

    const { line, scrub, text, image: img, gallery, breakpoints } = CONFIG.communityStory;
    const heading = content.querySelector(".js-section-heading");
    const lines = [...content.children].flatMap((el) => (el.tagName === "UL" ? [...el.children] : [el]));
    const galleryImages = [...section.querySelectorAll(".js-community-image")];
    const mm = gsap.matchMedia();

    Object.entries(breakpoints).forEach(([query, { imageFollowsHeading }]) => {
      mm.add(query, () => {
        const vh = window.innerHeight;
        const sectionTop = section.getBoundingClientRect().top;
        // Scroll distance (px) from the timeline's start until the element's top reaches `line`
        const reach = (el) => Math.max(0, el.getBoundingClientRect().top - sectionTop);
        const steps = [];

        let previous = -Infinity;
        let headingAt = 0;
        lines.forEach((el) => {
          const at = Math.max(reach(el), previous + text.gap * vh);
          if (el === heading) headingAt = at;
          previous = at;
          steps.push([el, at, text.distance * vh, "text"]);
        });

        const imageAt = imageFollowsHeading ? Math.max(reach(figure), headingAt + img.after * vh) : reach(figure);
        steps.push([figure, imageAt, img.distance * vh, "image"]);
        galleryImages.forEach((el, i) => {
          const at = Math.max(reach(el), imageAt + gallery.after * vh) + i * gallery.stagger * vh;
          steps.push([el, at, gallery.distance * vh, "gallery"]);
        });

        const total = Math.max(...steps.map(([, at, length]) => at + length));
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: section, start: `top ${line * 100}%`, end: `+=${Math.round(total)}`, scrub },
        });

        steps.forEach(([el, at, length, kind]) => {
          const position = at / total;
          const duration = length / total;
          if (kind === "text") {
            tl.fromTo(el, { y: text.y, opacity: 0, filter: `blur(${text.blur}px)` },
              { y: 0, opacity: 1, filter: "blur(0px)", duration, ease: "power1.out" }, position);
          } else if (kind === "image") {
            tl.fromTo(figure, { clipPath: `inset(${img.top}% 100% 0% 0%)` }, { clipPath: "inset(0% 0% 0% 0%)", duration, ease: "power1.inOut" }, position)
              .fromTo(image, { scale: img.scale, transformOrigin: "0% 100%" }, { scale: 1, duration, ease: "power1.out" }, position);
          } else {
            tl.fromTo(el, { y: gallery.y, clipPath: "inset(100% 0% 0% 0%)" }, { y: 0, clipPath: "inset(0% 0% 0% 0%)", duration, ease: "power1.inOut" }, position);
          }
        });
      });
    });
  }

  // Heading rises out of a blur, the image opens upward and to the right from its bottom-left corner with the
  // arrow button settling in at the end, then the closing lines follow. One scrubbed timeline.
  function initSection9RootedAnimation() {
    const section = document.getElementById("rooted");
    const heading = section?.querySelector(".js-section-heading");
    const image = section?.querySelector("figure .js-section-image");
    const figure = image?.parentElement;
    const content = section?.querySelector(".js-section-content");
    if (!heading || !image || !content || prefersReducedMotion || section.dataset.rootedReady) return;
    section.dataset.rootedReady = "true";

    const { line, scrub, text, image: img, cta } = CONFIG.rooted;
    const button = figure.querySelector(".js-cta");
    const lines = [...content.children];
    const mm = gsap.matchMedia();

    // The figure's aspect ratio and type sizes change at 768px, so positions are measured per layout
    ["(min-width: 768px)", "(max-width: 767.98px)"].forEach((query) => {
      mm.add(query, () => {
        const vh = window.innerHeight;
        const sectionTop = section.getBoundingClientRect().top;
        // Scroll distance (px) from the timeline's start until the element's top reaches `line`
        const reach = (el) => Math.max(0, el.getBoundingClientRect().top - sectionTop);

        const headingAt = reach(heading);
        const imageAt = Math.max(reach(figure) + figure.offsetHeight * img.anchor, headingAt + img.after * vh);
        const imageLength = img.distance * vh;
        let previous = imageAt;
        const lineSteps = lines.map((el) => {
          previous = Math.max(reach(el), previous + text.gap * vh);
          return [el, previous];
        });
        const textLength = text.distance * vh;
        const total = Math.max(imageAt + imageLength, ...lineSteps.map(([, at]) => at + textLength));

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: section, start: `top ${line * 100}%`, end: `+=${Math.round(total)}`, scrub },
        });
        const revealText = (el, at) => {
          tl.fromTo(el, { y: text.y, opacity: 0, filter: `blur(${text.blur}px)` },
            { y: 0, opacity: 1, filter: "blur(0px)", duration: textLength / total, ease: "power1.out" }, at / total);
        };

        revealText(heading, headingAt);
        tl.fromTo(figure, { clipPath: `inset(${img.top}% 100% 0% 0%)` }, { clipPath: "inset(0% 0% 0% 0%)", duration: imageLength / total, ease: "power1.inOut" }, imageAt / total)
          .fromTo(image, { scale: img.scale, transformOrigin: "0% 100%" }, { scale: 1, duration: imageLength / total, ease: "power1.out" }, imageAt / total);
        if (button) {
          tl.fromTo(button, { opacity: 0, scale: cta.scale }, { opacity: 1, scale: 1, duration: (imageLength * (1 - cta.from)) / total, ease: "power1.out" },
            (imageAt + imageLength * cta.from) / total);
        }
        lineSteps.forEach(([el, at]) => revealText(el, at));
      });
    });
  }

  // Text rises out of a blur line by line while the connectivity card opens from its top-right corner,
  // played once on entering the viewport. Clipping (rather than scaling) leaves the card's contents undistorted.
  function initSection10LocationAnimation() {
    const section = document.getElementById("location");
    const content = section?.querySelector(".js-section-content");
    const card = section?.querySelector(".js-connectivity-map");
    if (!content || !card || prefersReducedMotion || section.dataset.locationReady) return;
    section.dataset.locationReady = "true";

    const { start, text, card: reveal } = CONFIG.location;
    const lines = [...content.children];
    const radius = () => parseFloat(getComputedStyle(card).borderTopRightRadius) || 0;
    const hiddenClip = () => `inset(0px 0px ${card.offsetHeight}px ${card.offsetWidth}px round ${radius()}px)`;
    const shownClip = () => {
      const o = reveal.outset;
      return `inset(${-o}px ${-o}px ${-o}px ${-o}px round ${radius() + o}px)`;
    };
    const mm = gsap.matchMedia();

    // Refreshed after the pinned sections above, which rebuild at other breakpoints and shift this one
    // Parts that have already played stay revealed when a breakpoint change rebuilds the timelines
    const played = { text: false, card: false };
    const entrance = (trigger, parts) => gsap.timeline({
      scrollTrigger: { trigger, start, once: true, refreshPriority: -1, onEnter: () => parts.forEach((part) => (played[part] = true)) },
    });
    const revealText = (tl) => {
      if (played.text) return;
      // One tween per line (rather than `stagger`) so every line starts hidden before the timeline plays
      lines.forEach((el, i) => {
        tl.fromTo(el, { y: text.y, opacity: 0, filter: `blur(${text.blur}px)` },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: text.duration, ease: text.ease }, i * text.stagger);
      });
    };
    const revealCard = (tl, at) => {
      if (!played.card) tl.fromTo(card, { clipPath: hiddenClip }, { clipPath: shownClip, duration: reveal.duration, ease: reveal.ease }, at);
    };

    // Side by side, text and card share one entrance; stacked, the card waits until it is itself in view
    mm.add("(min-width: 1024px)", () => {
      const tl = entrance(section, ["text", "card"]);
      revealText(tl);
      revealCard(tl, reveal.delay);
    });
    mm.add("(max-width: 1023.98px)", () => {
      revealText(entrance(content, ["text"]));
      revealCard(entrance(card, ["card"]), 0);
    });
  }

  // The four destination badges drift gently up and down, each on its own rhythm, while the card is on screen
  function initSection10DestinationFloat() {
    const section = document.getElementById("location");
    const card = section?.querySelector(".js-connectivity-map");
    const badges = card ? [...card.querySelectorAll(".js-destination-badge")] : [];
    if (!badges.length || prefersReducedMotion || section.dataset.locationFloatReady) return;
    section.dataset.locationFloatReady = "true";

    const { durations, phases, breakpoints } = CONFIG.location.float;
    const mm = gsap.matchMedia();

    Object.entries(breakpoints).forEach(([query, heights]) => {
      mm.add(query, () => {
        const floats = badges.map((badge, i) => {
          const duration = durations[i % durations.length];
          return gsap.fromTo(badge, { y: 0 }, { y: -heights[i % heights.length], duration, ease: "sine.inOut", repeat: -1, yoyo: true, paused: true })
            .seek(duration * 2 * phases[i % phases.length]);
        });

        ScrollTrigger.create({
          trigger: card,
          start: "top bottom",
          end: "bottom top",
          refreshPriority: -1,
          onToggle: ({ isActive }) => floats.forEach((tween) => (isActive ? tween.play() : tween.pause())),
        });
      });
    });
  }

  // The heading and form rise together out of a blur, once, as the section comes into view. The background stays put.
  function initSection11VisitAnimation() {
    const section = document.getElementById("private-visit");
    const targets = section ? [section.querySelector(".js-section-heading"), section.querySelector(".js-visit-form")].filter(Boolean) : [];
    if (!targets.length || prefersReducedMotion || section.dataset.visitReady) return;
    section.dataset.visitReady = "true";

    const { start, y, blur, duration, ease } = CONFIG.privateVisit;
    gsap.fromTo(targets, { y, opacity: 0, filter: `blur(${blur}px)` }, {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration,
      ease,
      // A leftover filter would make the form a containing block for its fixed-position descendants
      clearProps: "transform,opacity,filter",
      // Refreshed after the pinned sections above, which rebuild at other breakpoints and shift this one
      scrollTrigger: { trigger: section, start, once: true, refreshPriority: -1 },
    });
  }

  // The footer's content rises out of a blur, once, as it comes into view. The black background stays put.
  function initFooterAnimation() {
    const footer = document.getElementById("site-footer");
    const content = footer?.firstElementChild;
    if (!content || prefersReducedMotion || footer.dataset.footerReady) return;
    footer.dataset.footerReady = "true";

    const { start, y, blur, duration, ease } = CONFIG.footer;
    gsap.fromTo(content, { y, opacity: 0, filter: `blur(${blur}px)` }, {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration,
      ease,
      clearProps: "transform,opacity,filter",
      // Refreshed after the pinned sections above, which rebuild at other breakpoints and shift this one
      scrollTrigger: { trigger: footer, start, once: true, refreshPriority: -1 },
    });
  }

  function init() {
    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
      initNavbarScrollState();
      initSection4PinnedSlider();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    initSmoothScroll();
    initNavbarScrollState();
    initHeroStackAnimation();
    initIntroReveal();
    initButterflyAnimation();
    initVisionMissionReveal();
    initVisionMissionWatermark();
    initSection4PinnedSlider();
    initSection5PhilosophyAnimation();
    initSection6HeaderAnimation();
    initSection6InfiniteSlider();
    initSection7HeaderAnimation();
    initSection7CommunityAnimation();
    initSection8CommunityAnimation();
    initSection9RootedAnimation();
    initSection10LocationAnimation();
    initSection10DestinationFloat();
    initSection11VisitAnimation();
    initFooterAnimation();
  }

  init();
})();
