// Welcome intro and in-site page transitions.
// The overlay markup and its initial state come from the HTML/CSS (painted before this runs);
// the inline <head> script decides whether this load is an intro (`is-intro`) or an arrival (`is-transitioning`).
(() => {
  const CONFIG = {
    storage: { intro: "vedvan:intro", transition: "vedvan:transition" },
    // Times in seconds. `maxWait` caps how long the reveal waits for fonts and the hero image.
    intro: { logo: 0.9, line: 0.65, hold: 0.2, maxWait: 1.2 },
    arrive: { hold: 0.15, maxWait: 0.8 },
    exit: { brand: 0.45, panels: 0.9, stagger: 0.06, after: 0.15, ease: "expo.inOut", heroScale: 1.06, heroDuration: 1.6 },
    leave: { panels: 0.7, stagger: 0.05, ease: "power3.inOut", brand: 0.35 },
    reduced: { fade: 0.35, hold: 0.3 },
    // The CSS failsafe hides an untouched overlay 4s after load; past this point, leave it to CSS
    takeoverLimit: 3.5,
    watchdog: 6,
    leaveTimeout: 8,
  };

  const root = document.documentElement;
  const overlay = document.querySelector(".js-page-transition");
  if (!overlay) return;

  const panels = [...overlay.querySelectorAll(".page-transition__panel")];
  const logo = overlay.querySelector(".page-transition__logo");
  const glow = overlay.querySelector(".page-transition__glow");
  const line = overlay.querySelector(".page-transition__line");
  const brandParts = [logo, glow, line].filter(Boolean);
  const hasGsap = typeof window.gsap !== "undefined";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const storage = {
    get: (key) => { try { return sessionStorage.getItem(key); } catch { return null; } },
    set: (key, value) => { try { sessionStorage.setItem(key, value); } catch {} },
    remove: (key) => { try { sessionStorage.removeItem(key); } catch {} },
  };

  const delay = (s) => new Promise((resolve) => setTimeout(resolve, s * 1000));
  const played = (tl) => new Promise((resolve) => tl.eventCallback("onComplete", resolve));

  let run = 0; // bumped on every start/finish so stale async steps bail out
  let busy = false;
  let active = null;
  let watchdog = null;

  // Scrolling is blocked only while the overlay is up; capture on window runs before Lenis sees the event
  const scrollKeys = new Set([" ", "PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
  const blockScroll = (e) => {
    if (e.type === "keydown" && !scrollKeys.has(e.key)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  const setInputLocked = (locked) => {
    const method = locked ? "addEventListener" : "removeEventListener";
    ["wheel", "touchmove", "keydown"].forEach((type) => window[method](type, blockScroll, { capture: true, passive: false }));
  };

  function start(timeoutSeconds, onTimeout = finish) {
    run += 1;
    busy = true;
    overlay.classList.add("is-controlled");
    setInputLocked(true);
    clearTimeout(watchdog);
    watchdog = setTimeout(onTimeout, timeoutSeconds * 1000);
    return run;
  }

  function finish() {
    run += 1;
    clearTimeout(watchdog);
    active?.kill();
    active = null;
    if (hasGsap) gsap.set([overlay, ...panels, ...brandParts], { clearProps: "all" });
    overlay.classList.remove("is-active", "is-controlled");
    root.classList.remove("is-intro", "is-transitioning");
    setInputLocked(false);
    busy = false;
  }

  // Fonts and the page's priority image (the hero), capped so a slow network never holds the intro
  function pageReady(maxWait) {
    const hero = document.querySelector('img[fetchpriority="high"]:not(.page-transition__logo)');
    const tasks = [document.fonts?.ready, hero?.decode?.().catch(() => {})].filter(Boolean);
    return Promise.race([Promise.all(tasks), delay(maxWait)]);
  }

  function brandIn() {
    const { logo: duration, line: lineDuration } = CONFIG.intro;
    const tl = gsap.timeline();
    if (prefersReducedMotion) return tl.fromTo(brandParts, { autoAlpha: 0 }, { autoAlpha: 1, duration: CONFIG.reduced.fade, ease: "power1.out" });

    return tl
      .fromTo(logo, { autoAlpha: 0, scale: 0.92, filter: "blur(14px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration, ease: "power3.out" }, 0)
      .fromTo(glow, { autoAlpha: 0 }, { autoAlpha: 1, duration, ease: "sine.out" }, 0)
      .fromTo(line, { autoAlpha: 0, scaleX: 0 }, { autoAlpha: 1, scaleX: 1, duration: lineDuration, ease: "power3.inOut" }, duration - lineDuration);
  }

  // Brand fades up and out, then the curtain panels lift from the centre outwards
  function reveal() {
    if (prefersReducedMotion) {
      return gsap.timeline({ onComplete: finish }).to(overlay, { autoAlpha: 0, duration: CONFIG.reduced.fade, ease: "power1.inOut" });
    }

    const { brand, panels: duration, stagger, after, ease, heroScale, heroDuration } = CONFIG.exit;
    const hero = document.querySelector(".js-hero-image");
    if (hero && hero.getBoundingClientRect().bottom > 0) {
      gsap.fromTo(hero, { scale: heroScale }, { scale: 1, duration: heroDuration, delay: after + duration * 0.3, ease: "expo.out", clearProps: "transform" });
    }

    return gsap.timeline({ onComplete: finish })
      .to(logo, { autoAlpha: 0, y: -14, filter: "blur(6px)", duration: brand, ease: "power2.in" }, 0)
      .to(line, { autoAlpha: 0, scaleX: 0, duration: brand * 0.9, ease: "power2.in" }, 0)
      .to(glow, { autoAlpha: 0, duration: brand, ease: "power1.in" }, 0)
      .to(panels, { yPercent: -100, duration, ease, stagger: { each: stagger, from: "center" } }, after);
  }

  async function enter(mode) {
    const id = start(CONFIG.watchdog);
    const settings = mode === "intro" ? CONFIG.intro : CONFIG.arrive;
    const ready = pageReady(settings.maxWait);

    if (mode === "intro") {
      storage.set(CONFIG.storage.intro, "1");
      await Promise.race([logo.decode?.().catch(() => {}), delay(0.6)]);
      if (id !== run) return;
      active = brandIn();
      await played(active);
    }
    if (id !== run) return;

    await Promise.all([delay(prefersReducedMotion ? CONFIG.reduced.hold : settings.hold), ready]);
    if (id !== run) return;
    active = reveal();
  }

  // Cover the page, then navigate; the destination page plays the matching reveal
  function leave(url) {
    if (busy) return;
    overlay.classList.add("is-active");
    start(CONFIG.leaveTimeout, () => {
      storage.remove(CONFIG.storage.transition);
      finish();
    });
    storage.set(CONFIG.storage.transition, String(Date.now()));

    const go = () => window.location.assign(url);
    if (prefersReducedMotion) {
      gsap.set(brandParts, { autoAlpha: 1 });
      active = gsap.timeline({ onComplete: go }).fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: CONFIG.reduced.fade, ease: "power1.out" });
      return;
    }

    const { panels: duration, stagger, ease, brand } = CONFIG.leave;
    const coveredAt = duration + stagger * (panels.length - 1);
    active = gsap.timeline({ onComplete: go })
      .fromTo(panels, { yPercent: 100 }, { yPercent: 0, duration, ease, stagger: { each: stagger, from: "center" } }, 0)
      .fromTo(logo, { autoAlpha: 0, scale: 0.96, filter: "blur(10px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: brand, ease: "power2.out" }, coveredAt - 0.25)
      .fromTo([glow, line], { autoAlpha: 0 }, { autoAlpha: 1, duration: brand, ease: "power1.out" }, coveredAt - 0.25)
      .set({}, {}, coveredAt + 0.2);
  }

  const samePage = (url) => {
    const path = (p) => p.replace(/\/index\.html?$/, "/");
    return path(url.pathname) === path(window.location.pathname) && url.search === window.location.search;
  };

  function onLinkClick(e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest?.("a[href]");
    if (!link || link.hasAttribute("download") || link.dataset.transition === "off") return;
    if (link.target && link.target !== "_self") return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol) || samePage(url) || busy) return;

    e.preventDefault();
    leave(url.href);
  }

  // Restored from the back/forward cache mid-transition: drop the cover
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    storage.remove(CONFIG.storage.transition);
    if (busy || overlay.classList.contains("is-active")) finish();
  });

  const mode = root.classList.contains("is-intro") ? "intro" : root.classList.contains("is-transitioning") ? "arrive" : null;
  storage.remove(CONFIG.storage.transition);

  if (!hasGsap) {
    if (mode) finish();
    return;
  }

  document.addEventListener("click", onLinkClick);

  if (mode) {
    if (performance.now() > CONFIG.takeoverLimit * 1000) finish();
    else enter(mode);
  }
})();
