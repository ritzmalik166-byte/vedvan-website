// Homepage hero: background video and intro reveal.
// The video plays once and rests on its final frame. It fades in once a frame is ready, falls back to the
// gradient if the file fails, waits for the welcome intro / page transition overlay to lift, pauses while
// off-screen (resuming from the same point), and stays on its first frame for reduced motion and Save-Data.
// Calling play() on an ended video restarts it, so nothing calls it once playback has finished.
(() => {
  "use strict";

  const CONFIG = {
    // Seconds. The video settles from `video.scale` while the [data-animate] lines rise in from `reveal.yPercent`.
    video: { scale: 1.12, duration: 2.6 },
    reveal: { yPercent: 40, duration: 1.6, stagger: 0.12, at: 0.35 },
    ease: "expo.out",
    // Classes the inline <head> script and js/page-transition.js keep on <html> while the overlay is up
    overlayClasses: ["is-intro", "is-transitioning"],
  };

  const root = document.documentElement;
  const hero = document.querySelector("[data-hero]");
  const video = hero?.querySelector("[data-hero-video]");
  if (!hero) return;

  const reveals = hero.querySelectorAll("[data-animate]");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = !!navigator.connection?.saveData;
  const hasGsap = typeof window.gsap !== "undefined";

  const overlayUp = () => CONFIG.overlayClasses.some((name) => root.classList.contains(name));

  function whenRevealed(callback) {
    if (!overlayUp()) {
      callback();
      return;
    }
    const observer = new MutationObserver(() => {
      if (overlayUp()) return;
      observer.disconnect();
      callback();
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  }

  function initIntro() {
    if (!hasGsap || prefersReducedMotion) {
      if (hasGsap) gsap.set(reveals, { autoAlpha: 1 });
      else reveals.forEach((el) => { el.style.visibility = "visible"; });
      return;
    }

    const { video: v, reveal: r, ease } = CONFIG;
    const intro = gsap.timeline({ paused: true, defaults: { ease } });
    if (video) intro.fromTo(video, { scale: v.scale }, { scale: 1, duration: v.duration }, 0);
    intro.fromTo(reveals,
      { autoAlpha: 0, yPercent: r.yPercent },
      { autoAlpha: 1, yPercent: 0, duration: r.duration, stagger: r.stagger },
      r.at);

    whenRevealed(() => intro.play());
  }

  function initVideo() {
    if (!video) return;

    const held = prefersReducedMotion || saveData;
    let waiting = overlayUp();
    let ended = video.ended;
    let inView = true;

    const sync = () => {
      if (ended) return;
      if (held || waiting || !inView) {
        video.pause();
        return;
      }
      // Autoplay blocked (e.g. Low Power Mode): the current frame stays as the background
      video.play()?.catch?.(() => {});
    };

    const onReady = () => hero.classList.add("is-video-ready");
    const onError = () => {
      hero.classList.add("has-video-error");
      console.warn("[Vedvan] Hero video failed to load:", video.currentSrc || video.getAttribute("src"));
    };

    if (held || waiting) {
      video.removeAttribute("autoplay");
      video.pause();
      // Autoplay may already have advanced behind the overlay; start the single play from the top
      if (waiting && video.currentTime > 0) video.currentTime = 0;
    }

    if (video.error) onError();
    else if (video.readyState >= 2) onReady();

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("error", onError);
    video.addEventListener("ended", () => { ended = true; });

    new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      sync();
    }).observe(hero);

    if (waiting) {
      whenRevealed(() => {
        waiting = false;
        sync();
      });
    }
  }

  initVideo();
  initIntro();
})();

/* Responsive Hero Video */

(() => {
  const heroVideo = document.querySelector("[data-hero-video]");
  const soundButton = document.querySelector("[data-hero-sound]");
  const mutedIcon = document.querySelector("[data-sound-muted-icon]");
  const soundOnIcon = document.querySelector("[data-sound-on-icon]");

  if (!heroVideo) return;

  const videoSources = {
    desktop:
      "https://contenaissance.blob.core.windows.net/ct-assets/VEDVAN%20%20Walkthrough%20Final%201440%20x%20797%20(2).mp4",

    tablet:
      "https://contenaissance.blob.core.windows.net/ct-assets/Vedvan%2012sep%20Video%20768px%20-%20797px%2001.mp4",

    mobile:
      "https://contenaissance.blob.core.windows.net/ct-assets/Vedvan%2012sep%20Video%20375px%20-%20797px%2001.mp4",
  };

  let currentSource = "";

  const getVideoSource = () => {
    const width = window.innerWidth;

    if (width >= 1024) return videoSources.desktop;
    if (width >= 768) return videoSources.tablet;

    return videoSources.mobile;
  };

  // Update sound button appearance and accessibility state.
  const updateSoundButton = () => {
    if (!soundButton) return;

    const isMuted = heroVideo.muted;

    soundButton.setAttribute(
      "aria-label",
      isMuted ? "Unmute video" : "Mute video"
    );

    soundButton.setAttribute(
      "aria-pressed",
      String(!isMuted)
    );

    if (mutedIcon) {
      mutedIcon.classList.toggle("hidden", !isMuted);
    }

    if (soundOnIcon) {
      soundOnIcon.classList.toggle("hidden", isMuted);
    }
  };

  // Start muted by default.
  heroVideo.muted = true;
  heroVideo.defaultMuted = true;

  const updateHeroVideo = () => {
    const newSource = getVideoSource();

    if (currentSource === newSource) return;

    currentSource = newSource;

    heroVideo.src = newSource;
    heroVideo.load();

    const playPromise = heroVideo.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Browser autoplay restrictions may prevent playback.
      });
    }
  };

  // Toggle mute/unmute when the sound button is clicked.
  if (soundButton) {
    soundButton.addEventListener("click", () => {
      heroVideo.muted = !heroVideo.muted;
      updateSoundButton();

      // Ensure playback continues after the interaction.
      if (heroVideo.paused) {
        heroVideo.play().catch(() => {});
      }
    });
  }

  // Set the correct video on page load.
  updateHeroVideo();
  updateSoundButton();

  // Switch video when crossing responsive breakpoints.
  window.addEventListener("resize", updateHeroVideo, {
    passive: true,
  });

  // Keep the icon in sync if mute state changes elsewhere.
  heroVideo.addEventListener("volumechange", updateSoundButton);
})();
