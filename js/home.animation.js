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
    // Shared text and image reveals (addTextReveal / addImageReveal). Px for distances, degrees for rotations.
    reveal: {
      title: { x: [14, 56], y: 22, rotation: 2, blur: 9, ease: "power2.out" }, // headings: scattered words gather
      text: { y: [6, 12], blur: 4, ease: "sine.out" }, // other text: words rise out of a soft blur
      block: { y: 12, blur: 5, ease: "sine.out" }, // elements that can't be split into words
      stagger: 0.4, // share of a reveal's duration over which its words start
      mobileReach: 0.55, // heading scatter scale below 768px
      // `offset` (% of the frame) and `rotationY` are where the frame starts; its photo zooms from `zoom` to
      // `overscan`, which leaves room for a `drift` % parallax inside the frame.
      image: { offset: 6, scale: 0.9, rotationY: -14, blur: 14, zoom: 1.3, overscan: 1.08, drift: 3.5, ease: "power2.out" },
    },
    intro: {
      // Scrubbed over the section's height: each element starts as it crosses the `line` viewport position.
      // `duration` and `gap` (minimum delay after the previous element) are fractions of that scroll distance.
      line: "85%",
      scrub: 1.2,
      duration: 0.4,
      gap: 0.08,
    },
    butterfly: {
      start: "top 80%",
      duration: 2.2,
      arc: 36, // px the flight path dips below and rises above the resting point
      tilt: 14,
      flap: { duration: 0.16, near: { rotation: -8, scaleX: 0.86 }, far: { rotation: 14, scaleX: 0.7 } },
      hover: { y: 4, rotation: 2, duration: 2.4 },
    },
    introStack: {
      // The intro pins with its middle at the viewport's middle (never under the header) while its text blurs away
      // over `fade` viewport heights. Vision & Mission holds still for `hold` of that distance, then eases into
      // climbing over the pinned intro across `climb` viewport heights. The pin releases once the intro is fully covered.
      scrub: 1.2,
      hold: 0.85,
      // Timeline units: each step (heading → paragraphs → tagline) blurs to `blur` px while fading out over `duration`;
      // the next starts `overlap` before it ends.
      steps: { duration: 1, overlap: 0.4, blur: 14, ease: "sine.in" },
      breakpoints: {
        "(min-width: 1024px)": { fade: 2.6, climb: 0.45 },
        "(min-width: 768px) and (max-width: 1023.98px)": { fade: 2.4, climb: 0.4 },
        "(max-width: 767.98px)": { fade: 2.2, climb: 0.35 },
      },
    },
    visionMission: {
      // Seconds. Each block plays once its top crosses `margin` above the viewport bottom, and rewinds after it leaves
      // through the bottom. Text lines start `stagger` apart; images start `image.delay` after coming into view.
      reveal: {
        margin: "0px 0px -15% 0px",
        text: { y: 32, blur: 6, duration: 1, stagger: 0.14, ease: "power3.out" },
        image: { duration: 1.3, delay: 0.2, ease: "power2.inOut" },
      },
      watermark: { x: 16, y: 12, rotation: 1.5, durationX: 11, durationY: 8 },
    },
    elements: {
      // The pin's progress picks the slide: slide i + 1 becomes the target once progress passes thresholds[i].
      // `distance` is the pin length as a multiple of the viewport height.
      breakpoints: {
        "(min-width: 1024px)": { distance: 2, thresholds: [0.22, 0.58] },
        "(max-width: 1023.98px)": { distance: 1.6, thresholds: [0.22, 0.58] },
      },
      // Seconds, px for `y` and `blur`. The current card's text blurs away (`out`) while the incoming card fades in
      // over it; the incoming text then comes into focus from `text.at`. Steps run `catchUp` times faster while more
      // are queued. With reduced motion the slides crossfade over `reduced`.
      transition: {
        image: 2.8, ease: "sine.inOut",
        out: { duration: 0.8, stagger: 0.08, y: 12, blur: 10, ease: "power2.in" },
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
      // The image comes in (addImageReveal) while the stage scrolls in; the card then rises during the pin. Unpinned,
      // both share one timeline: the image takes 1 unit and the card's 1-unit rise starts at `cardAt`.
      image: { cardAt: 0.8 },
      // Card lines, in units of the card's rise: the first starts at `at`, each next one `step` later
      text: { at: 0.25, step: 0.1, duration: 0.45 },
      breakpoints: {
        "(min-width: 1024px)": { distance: 1.1, y: 110 },
        "(max-width: 1023.98px)": { distance: 0.85, y: 80 },
      },
    },
    experience: {
      // Timeline units: the eyebrow (with its rules) and the heading each take `duration`, the heading `stagger` later
      header: { start: "top 90%", end: "top 45%", scrub: 0.8, duration: 1, stagger: 0.35 },
      // The section pins while the cards slide one scroll px per px of travel, eased by `scrub` seconds.
      // `hold` adds that share of the travel as a pause at the end before the pin releases.
      slider: { scrub: 1, hold: 0.15 },
    },
    community: {
      // Timeline units: each line takes `duration` and starts `stagger` after the previous one
      header: { start: "top 95%", end: "top 30%", scrub: 1.5, duration: 1, stagger: 0.3 },
      // Image timeline: from the map's top reaching `start` (fraction of the viewport height) over `distance` viewport heights.
      // Positions and durations of `image` and `markers` are fractions of that scroll distance.
      reveal: { start: 0.92, distance: 0.6, scrub: 1.6 },
      image: { duration: 0.78 },
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
      text: { distance: 0.3, gap: 0.06 },
      image: { distance: 0.55, anchor: 0.15, after: 0.08 },
      cta: { from: 0.75, scale: 0.8 },
    },
    location: {
      // Plays once when its trigger's top reaches `start`. Times in seconds; `card.delay` is measured from the
      // first text line when side by side. `outset` (px) keeps the card's shadow unclipped.
      start: "top 80%",
      text: { duration: 1.4, stagger: 0.16 },
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
    // Seconds. Heading lines start `text.stagger` apart; the form starts at `text.formAt`.
    privateVisit: { start: "top 80%", y: 60, blur: 10, duration: 1.2, ease: "power3.out", text: { duration: 1.4, stagger: 0.2, formAt: 0.45 } },
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
  let introPinEnd = null; // scroll position where the intro's pin ends, set by initIntroBlurStack

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
  // hero carries on from where it was held, so both scroll on together. While the intro is itself pinned
  // (initIntroBlurStack), the hero stays pinned too, so it keeps filling the space above the intro.
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

        const start = `${pinAt * 100}% top`;

        ScrollTrigger.create({
          trigger: hero,
          start,
          end: (self) => Math.max(self.start + distance(), introPinEnd?.() ?? 0),
          pin: true,
          pinSpacing: false,
          invalidateOnRefresh: true,
        });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: hero, start, end: () => `+=${distance()}`, scrub, invalidateOnRefresh: true },
        });

        tl.fromTo(content, { y: 0, opacity: 1, filter: "blur(0px)" }, { y: end.y, opacity: 0, filter: `blur(${end.blur}px)`, duration: 1 }, 0);
        if (indicator) tl.to(indicator, { autoAlpha: 0, duration: 0.35 }, 0);
      });
    });
  }

  // Each text line reveals word by word (addTextReveal) on one scrubbed timeline, placed at its position within the
  // section. The lotus watermark rises in ahead of the heading; the butterfly flies in and lands on the emblem
  // (see initButterflyAnimation).
  function initIntroReveal() {
    const section = document.getElementById("intro");
    if (!section || prefersReducedMotion || section.dataset.introReady) return;

    const lines = [
      section.querySelector(".js-intro-lotus"),
      section.querySelector(".js-section-heading"),
      ...section.querySelectorAll(".js-section-content > p"),
      section.querySelector(".js-section-tagline"),
    ].filter(Boolean);
    if (!lines.length) return;
    section.dataset.introReady = "true";

    const { line, scrub, duration, gap } = CONFIG.intro;
    const mm = gsap.matchMedia();

    ["(min-width: 768px)", "(max-width: 767.98px)"].forEach((query) => {
      mm.add(query, () => {
        const sectionBox = section.getBoundingClientRect();
        const at = (el) => (el.getBoundingClientRect().top - sectionBox.top) / sectionBox.height;

        const tl = gsap.timeline({
          scrollTrigger: { trigger: section, start: `top ${line}`, end: `bottom ${line}`, scrub },
        });
        tl.set({}, {}, 1);

        let previous = -Infinity;
        lines.forEach((el) => {
          previous = Math.min(Math.max(at(el), previous + gap), 1 - duration);
          addTextReveal(tl, el, previous, duration);
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

  // Repeatable pseudo-random value in [0, 1) for a given seed, so the fragment layout and motion are stable
  const seeded = (seed) => {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  const spread = (i, seed, min, max) => min + seeded((i + 1) * 13 + seed * 101) * (max - min);

  // Wraps each word in an inline-block span inside an aria-hidden layer, next to one screen-reader copy of the text.
  // Only plain text with inline formatting is split; anything else (links, icons, controls) returns null.
  const SPLITTABLE = new Set(["SPAN", "EM", "STRONG", "B", "I", "SMALL", "BR"]);
  const splitCache = new WeakMap();
  function splitWords(el) {
    if (splitCache.has(el)) return splitCache.get(el);
    let words = null;
    if (el.textContent.trim() && [...el.querySelectorAll("*")].every((node) => SPLITTABLE.has(node.tagName))) {
      const label = document.createElement("span");
      label.className = "sr-only";
      label.textContent = el.textContent.replace(/\s+/g, " ").trim();
      const visual = document.createElement("span");
      visual.setAttribute("aria-hidden", "true");
      const walk = (source, target) => {
        source.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            node.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) {
                target.append(" ");
                return;
              }
              const word = document.createElement("span");
              word.className = "split-word";
              word.textContent = part;
              target.append(word);
            });
          } else if (node.nodeName === "BR") {
            target.append(document.createElement("br"));
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const clone = node.cloneNode(false);
            clone.removeAttribute("id");
            target.append(clone);
            walk(node, clone);
          }
        });
      };
      walk(el, visual);
      el.replaceChildren(label, visual);
      words = [...visual.querySelectorAll(".split-word")];
    }
    splitCache.set(el, words);
    return words;
  }

  const isTitle = (el) => /^H[1-3]$/.test(el.tagName) || el.classList.contains("font-display");

  // Adds a text reveal to `tl`: headings gather word by word from a blurred, scattered state, other text rises word by
  // word out of a soft blur, and elements that can't be split rise as one. Words start over `stagger` of `duration`.
  function addTextReveal(tl, el, position, duration) {
    const { title, text, block, stagger, mobileReach } = CONFIG.reveal;
    const words = splitWords(el);
    if (!words) {
      tl.fromTo(el, { autoAlpha: 0, y: block.y, filter: `blur(${block.blur}px)` },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration, ease: block.ease }, position);
      return;
    }

    const amount = words.length > 1 ? duration * stagger : 0;
    const shown = { autoAlpha: 1, x: 0, y: 0, rotation: 0, filter: "blur(0px)", duration: duration - amount, stagger: { amount } };
    if (isTitle(el)) {
      const reach = window.matchMedia("(max-width: 767.98px)").matches ? mobileReach : 1;
      tl.fromTo(words, {
        autoAlpha: 0,
        x: (i) => spread(i, 1, title.x[0], title.x[1]) * reach,
        y: (i) => spread(i, 2, -title.y, title.y),
        rotation: (i) => spread(i, 3, -title.rotation, title.rotation),
        filter: `blur(${title.blur}px)`,
      }, { ...shown, ease: title.ease }, position);
    } else {
      tl.fromTo(words, { autoAlpha: 0, y: (i) => spread(i, 4, text.y[0], text.y[1]), filter: `blur(${text.blur}px)` },
        { ...shown, ease: text.ease }, position);
    }
  }

  // Adds an image reveal to `tl`: the frame fades in, sharpens and turns to face the viewer from a slight offset while
  // the photo inside it (when it has its own clipping frame) settles out of a zoom into its parallax overscan.
  function addImageReveal(tl, frame, position, duration, photo = null) {
    const { image } = CONFIG.reveal;
    tl.fromTo(frame, {
      autoAlpha: 0,
      xPercent: image.offset,
      yPercent: image.offset * 0.8,
      scale: image.scale,
      rotationY: image.rotationY,
      transformPerspective: 1200,
      filter: `blur(${image.blur}px)`,
    }, { autoAlpha: 1, xPercent: 0, yPercent: 0, scale: 1, rotationY: 0, filter: "blur(0px)", duration, ease: image.ease }, position);
    if (photo) tl.fromTo(photo, { scale: image.zoom }, { scale: image.overscan, duration, ease: image.ease }, position);
  }

  // The photo drifts against the scroll inside its clipping frame while the frame crosses the viewport
  function addImageDrift(frame, photo) {
    const { drift } = CONFIG.reveal.image;
    gsap.fromTo(photo, { yPercent: -drift }, {
      yPercent: drift,
      ease: "none",
      scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true, refreshPriority: -1 },
    });
  }

  // The intro pins mid-viewport and its text blurs away in three scrubbed steps. Vision & Mission is pushed down by a
  // margin and translated back up by the same amount, so it holds still below the intro, then eases into scrolling
  // over it (translation reaches 0 with zero slope, so its speed never jumps). The pin has no spacing and lasts until
  // Vision & Mission covers the intro, so the intro stays underneath, as with the hero.
  function initIntroBlurStack() {
    const section = document.getElementById("intro");
    const next = document.getElementById("vision-mission");
    if (!section || !next || prefersReducedMotion) return;

    const groups = [
      [section.querySelector(".js-intro-lotus"), section.querySelector(".js-butterfly"), section.querySelector(".js-section-heading")],
      [...section.querySelectorAll(".js-section-content > p")],
      [section.querySelector(".js-section-tagline")],
    ].map((group) => group.filter(Boolean)).filter((group) => group.length);
    if (!groups.length) return;

    const header = document.getElementById("site-header");
    const { scrub, hold, steps, breakpoints } = CONFIG.introStack;
    const mm = gsap.matchMedia();

    Object.entries(breakpoints).forEach(([query, bp]) => {
      mm.add(query, () => {
        const fadeFor = () => window.innerHeight * bp.fade;
        const holdFor = () => Math.round(fadeFor() * hold);
        const climbFor = () => Math.round(window.innerHeight * bp.climb);
        // Extra scroll the stack adds to the page: the hold plus half the climb (it eases from rest to scroll speed)
        const liftBy = () => holdFor() + Math.round(climbFor() / 2);
        const pinTop = () => {
          const vh = window.innerHeight;
          const height = section.offsetHeight;
          const headerHeight = header?.offsetHeight || 0;
          // Too tall to sit below the header: align its bottom with the viewport's instead
          return Math.round(height > vh - headerHeight ? vh - height : Math.max(headerHeight, (vh - height) / 2));
        };
        const start = () => `top ${pinTop()}px`;

        // Before every refresh, so triggers further down measure the final layout
        const applyOffset = () => {
          next.style.marginTop = `${liftBy()}px`;
          gsap.set(next, { y: 0 });
        };
        applyOffset();
        ScrollTrigger.addEventListener("refreshInit", applyOffset);

        const pinLength = () => liftBy() + section.offsetHeight;
        // Measured on the pin spacer, which stays in the flow while the intro itself is fixed
        introPinEnd = () => {
          const flow = section.parentElement?.classList.contains("pin-spacer") ? section.parentElement : section;
          return Math.round(flow.getBoundingClientRect().top + window.scrollY - pinTop() + pinLength());
        };

        ScrollTrigger.create({
          trigger: section,
          start,
          end: () => `+=${pinLength()}`,
          pin: true,
          pinSpacing: false,
          invalidateOnRefresh: true,
        });

        // Hold: translation cancels the scroll. Ease: power1.out over twice the remaining offset starts at the
        // scroll's speed and ends at rest, so the section accelerates smoothly into its normal scroll.
        gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start,
            end: () => `+=${holdFor() + climbFor()}`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
          .fromTo(next, { y: () => -liftBy() }, { y: () => holdFor() - liftBy(), ease: "none", duration: bp.fade * hold })
          .to(next, { y: 0, ease: "power1.out", duration: bp.climb });

        const tl = gsap.timeline({
          scrollTrigger: { trigger: section, start, end: () => `+=${fadeFor()}`, scrub, invalidateOnRefresh: true },
        });
        // Each step softens into a blur while it fades out, in place
        groups.forEach((group, g) => {
          tl.fromTo(group, { autoAlpha: 1, filter: "blur(0px)" },
            { autoAlpha: 0, filter: `blur(${steps.blur}px)`, duration: steps.duration, ease: steps.ease, immediateRender: false },
            g * (steps.duration - steps.overlap));
        });

        return () => {
          ScrollTrigger.removeEventListener("refreshInit", applyOffset);
          next.style.marginTop = "";
          introPinEnd = null;
        };
      });
    });
  }

  // Heading (with its butterfly), each row's text (line by line) and each row's image (Vision right to left, Mission
  // left to right) play their own timed reveal as they scroll into view. Visibility is observed rather than
  // scroll-triggered because the section is translated while it stacks over the intro, and IntersectionObserver
  // sees where it is actually drawn.
  function initVisionMissionReveal() {
    const section = document.getElementById("vision-mission");
    if (!section || prefersReducedMotion) return;

    const { margin, text, image } = CONFIG.visionMission.reveal;
    const blocks = new Map();

    const addBlock = (el, build) => {
      if (!el) return;
      const tl = gsap.timeline({ paused: true });
      build(tl);
      blocks.set(el, tl);
    };
    const revealLines = (tl, lines) => tl.fromTo(lines, { y: text.y, autoAlpha: 0, filter: `blur(${text.blur}px)` },
      { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: text.duration, ease: text.ease, stagger: text.stagger });

    const heading = section.querySelector(".js-section-heading");
    addBlock(heading, (tl) => revealLines(tl, [heading, section.querySelector(".js-butterfly")].filter(Boolean)));

    section.querySelectorAll(".js-vision-row, .js-mission-row").forEach((row, i) => {
      const content = row.querySelector(".js-section-content");
      addBlock(content, (tl) => revealLines(tl, content.querySelectorAll("h3, p")));

      const img = row.querySelector(".js-reveal-image");
      addBlock(img?.parentElement, (tl) => tl.fromTo(img,
        { clipPath: i % 2 ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 0% 100%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: image.duration, ease: image.ease, delay: image.delay }));
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting, boundingClientRect, rootBounds }) => {
        const tl = blocks.get(target);
        if (isIntersecting) tl.play();
        else if (rootBounds && boundingClientRect.top >= rootBounds.bottom) tl.reverse();
      });
    }, { rootMargin: margin });
    blocks.forEach((_, el) => observer.observe(el));
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
  // spreads over the current one like water from its bottom-left corner, while the current card's text blurs away
  // and the incoming card's text comes into focus. Transitions run one at a time until the target is reached;
  // a running one always completes.
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
          gsap.set(cardText.filter((el) => cards[from].contains(el)), { clearProps: "opacity,filter,transform" });
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
        const { out } = transition;
        tl.add(spreadOver(images[to], transition.image, to * 2.1), 0)
          .to(cardText.filter((el) => cards[from].contains(el)),
            { y: out.y, opacity: 0, filter: `blur(${out.blur}px)`, duration: out.duration, stagger: out.stagger, ease: out.ease }, 0)
          .fromTo(cards[to], { clipPath: "none", opacity: 0 }, { opacity: 1, duration: out.duration, ease: "none" }, 0)
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

  // As the image + card wrapper scrolls into view the image comes in (addImageReveal); the wrapper then pins while
  // the card rises into its layout position, blurred to sharp, its lines revealing word by word.
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
    const { scrub, blur, hold, minImageVisible, image: reveal, text } = CONFIG.philosophy;
    const cardText = [...card.querySelectorAll(":scope > p, :scope > h3")];
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
          // The card's lines follow its rise, word by word, and settle as it does
          const revealCardText = (tl, at) => cardText.forEach((el, i) => addTextReveal(tl, el, at + text.at + i * text.step, text.duration));

          if (!pinned) {
            const tl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: stage, start: "top bottom", end: "bottom 85%", scrub, invalidateOnRefresh: true } });
            addImageReveal(tl, image, 0, 1);
            tl.fromTo(card, hidden, shown, reveal.cardAt);
            revealCardText(tl, reveal.cardAt);
            return;
          }

          const pinTop = () => Math.min(headerHeight(), fitTop());
          // The image comes in while the stage scrolls in, from its top entering the viewport until it pins
          addImageReveal(gsap.timeline({
            scrollTrigger: { trigger: stage, start: "top bottom", end: () => `top ${pinTop()}px`, scrub, invalidateOnRefresh: true },
          }), image, 0, 1);

          const tl = gsap.timeline({
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
            .fromTo(card, hidden, shown, 0);
          revealCardText(tl, 0);
          tl.set({}, {}, 1 + hold);
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

    const { start, end, scrub, duration, stagger } = CONFIG.experience.header;
    const eyebrow = header.querySelector("p");
    const rules = [...header.querySelectorAll("span[aria-hidden]")];
    const title = header.querySelector("h2");
    const tl = gsap.timeline({ scrollTrigger: { trigger: header, start, end, scrub } });
    if (rules.length) {
      tl.fromTo(rules, { scaleX: 0, transformOrigin: (i) => (i ? "0% 50%" : "100% 50%") }, { scaleX: 1, duration, ease: "power2.out" }, 0);
    }
    if (eyebrow) addTextReveal(tl, eyebrow, 0, duration);
    if (title) addTextReveal(tl, title, stagger, duration);
  }

  // The section pins while scrolling slides the cards to the left until the last one reaches the track's far
  // content edge, then holds briefly before releasing. Distances are re-measured on every refresh, so it fits any
  // screen; when all cards already fit there is nothing to travel. Without JS (or with reduced motion) the track
  // scrolls natively.
  function initSection6ScrollSlider() {
    const section = document.getElementById("experience");
    const track = section?.querySelector(".js-card-track");
    const cards = track ? [...track.querySelectorAll(".js-feature-card")] : [];
    if (cards.length < 2 || prefersReducedMotion || track.dataset.sliderReady) return;
    track.dataset.sliderReady = "true";

    const { scrub, hold } = CONFIG.experience.slider;
    const header = document.getElementById("site-header");
    const rail = document.createElement("div");
    rail.className = "js-card-rail";
    rail.append(...cards);
    track.appendChild(rail);
    track.classList.add("is-slider");

    // When the track bleeds to the right edge (no right padding) the last card stops at the mirrored left inset
    const travel = () => {
      const { paddingLeft, paddingRight } = getComputedStyle(track);
      const startInset = parseFloat(paddingLeft) || 0;
      const endInset = parseFloat(paddingRight) || startInset;
      return Math.max(0, Math.round(rail.offsetWidth - (track.clientWidth - startInset - endInset)));
    };
    // Centred in the space below the header, or bottom-aligned when the section is taller than that space
    const start = () => {
      const headerHeight = header?.offsetHeight || 0;
      const space = window.innerHeight - headerHeight;
      return section.offsetHeight > space ? "bottom bottom" : `center ${Math.round(headerHeight + space / 2)}px`;
    };

    gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start,
        end: () => `+=${Math.round(travel() * (1 + hold))}`,
        pin: true,
        scrub,
        invalidateOnRefresh: true,
      },
    })
      .to(rail, { x: () => -travel(), duration: 1, ease: "none" })
      .to({}, { duration: hold });
  }

  function initSection7HeaderAnimation() {
    const section = document.getElementById("wellness-community");
    const targets = section ? [section.querySelector(".js-section-heading"), ...section.querySelectorAll(".js-section-content > p")].filter(Boolean) : [];
    if (!targets.length || prefersReducedMotion) return;

    const { start, end, scrub, duration, stagger } = CONFIG.community.header;
    const tl = gsap.timeline({ scrollTrigger: { trigger: targets[0].parentElement, start, end, scrub } });
    targets.forEach((el, i) => addTextReveal(tl, el, i * stagger, duration));
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

  // The map comes in (addImageReveal) and its photo drifts while on screen, markers settle in, then the stats strip
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
    // The strip's left inset runs from 100% to -5% with power1.inOut
    const stripFrom = 100;
    const stripTo = -5;
    const easeInOutInverse = (y) => (y < 0.5 ? Math.sqrt(y / 2) : 1 - Math.sqrt((1 - y) / 2));

    statCounters.forEach((c) => c.reserveWidth());
    document.fonts?.ready.then(() => statCounters.forEach((c) => c.reserveWidth()));
    addImageDrift(figure, image);

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

        addImageReveal(imageTl, figure, 0, img.duration, image);
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

  // Heading reveals, the image comes in with the arrow button settling in at the end (its photo then drifts while on
  // screen), then the closing lines follow. One scrubbed timeline.
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
    addImageDrift(figure, image);

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
        const revealText = (el, at) => addTextReveal(tl, el, at / total, textLength / total);

        revealText(heading, headingAt);
        addImageReveal(tl, figure, imageAt / total, imageLength / total, image);
        if (button) {
          tl.fromTo(button, { opacity: 0, scale: cta.scale }, { opacity: 1, scale: 1, duration: (imageLength * (1 - cta.from)) / total, ease: "power1.out" },
            (imageAt + imageLength * cta.from) / total);
        }
        lineSteps.forEach(([el, at]) => revealText(el, at));
      });
    });
  }

  // Text reveals line by line while the connectivity card opens from its top-right corner,
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
      lines.forEach((el, i) => addTextReveal(tl, el, i * text.stagger, text.duration));
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

  // The heading lines reveal word by word, then the form rises out of a blur, once, as the section comes into view.
  // The background stays put.
  function initSection11VisitAnimation() {
    const section = document.getElementById("private-visit");
    const header = section?.querySelector(".js-section-heading");
    const form = section?.querySelector(".js-visit-form");
    if ((!header && !form) || prefersReducedMotion || section.dataset.visitReady) return;
    section.dataset.visitReady = "true";

    const { start, y, blur, duration, ease, text } = CONFIG.privateVisit;
    // Refreshed after the pinned sections above, which rebuild at other breakpoints and shift this one
    const tl = gsap.timeline({ scrollTrigger: { trigger: section, start, once: true, refreshPriority: -1 } });
    [...(header?.children ?? [])].forEach((el, i) => addTextReveal(tl, el, i * text.stagger, text.duration));
    if (form) {
      tl.fromTo(form, { y, opacity: 0, filter: `blur(${blur}px)` }, {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration,
        ease,
        // A leftover filter would make the form a containing block for its fixed-position descendants
        clearProps: "transform,opacity,filter",
      }, header ? text.formAt : 0);
    }
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
    initIntroBlurStack();
    initVisionMissionReveal();
    initVisionMissionWatermark();
    initSection4PinnedSlider();
    initSection5PhilosophyAnimation();
    initSection6HeaderAnimation();
    initSection6ScrollSlider();
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
