/* ==========================================================================
   Vedvan — location & connectivity (controller)

   Reads window.VedvanLocationData (location.data.js) and renders the
   destination list, map markers, floating preview and details panel.

   The map starts as a static SVG (location.geometry.js) so it is never
   blank, then upgrades to Three.js (location-map.js) when WebGL and the
   module load.
   ========================================================================== */
(function () {
  "use strict";

  var moduleUrl = new URL("location-map.js", document.currentScript ? document.currentScript.src : window.location.href).href;
  var LERP = 0.08;
  var reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
  }

  function prefersReducedMotion() {
    return reducedMotionQuery.matches;
  }

  function supportsWebGL() {
    try {
      var canvas = document.createElement("canvas");
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")));
    } catch (e) {
      return false;
    }
  }

  function initLocation() {
    var section = document.querySelector("[data-location]");
    var data = window.VedvanLocationData;
    var G = window.VedvanLocationGeometry;
    if (!section || !data || !G) return;

    var gsap = window.gsap;
    var list = section.querySelector("[data-location-list]");
    var mapEl = section.querySelector("[data-location-map]");
    var stage = section.querySelector("[data-location-stage]");
    var canvasHost = section.querySelector("[data-location-canvas]");
    var svg = section.querySelector("[data-location-svg]");
    var markerLayer = section.querySelector("[data-location-markers]");
    var siteEl = section.querySelector("[data-location-site]");
    var preview = section.querySelector("[data-location-preview]");
    var previewFrame = section.querySelector("[data-location-preview-frame]");
    var previewImg = section.querySelector("[data-location-preview-img]");
    var detailsInner = section.querySelector("[data-location-details-inner]");
    var nameEl = section.querySelector("[data-location-name]");
    var timeEl = section.querySelector("[data-location-time]");
    var descEl = section.querySelector("[data-location-description]");
    if (!list || !mapEl || !stage || !canvasHost || !svg || !markerLayer) return;

    var wideQuery = window.matchMedia("(min-width: 1024px)");
    var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    // Matches the mobile breakpoint in location.css
    var mobileQuery = window.matchMedia("(max-width: 47.99rem)");

    var destinations = data.destinations;
    var byId = {};
    var items = [];
    var markers = [];
    var destroyed = false;

    destinations.forEach(function (d) {
      byId[d.id] = d;

      var li = document.createElement("li");
      var item = document.createElement("button");
      item.type = "button";
      item.className = "location__item";
      item.setAttribute("aria-pressed", "false");
      item.dataset.locationId = d.id;
      var name = document.createElement("span");
      name.className = "location__item-name";
      name.textContent = d.name;
      var time = document.createElement("span");
      time.className = "sr-only";
      time.textContent = ", " + d.travelTime;
      item.append(name, time);
      li.appendChild(item);
      list.appendChild(li);
      items.push(item);

      var marker = document.createElement("button");
      marker.type = "button";
      marker.className = "location__marker" + (d.arrow ? " location__marker--" + d.arrow : "");
      marker.setAttribute("aria-pressed", "false");
      marker.setAttribute("aria-label", d.name + ", " + d.travelTime);
      marker.dataset.locationId = d.id;
      var body = document.createElement("span");
      body.className = "location__marker-body";
      body.setAttribute("aria-hidden", "true");
      var pin = document.createElement("span");
      pin.className = "location__pin";
      var label = document.createElement("span");
      label.className = "location__label";
      label.textContent = d.name;
      body.append(pin, label);
      marker.appendChild(body);
      markerLayer.appendChild(marker);
      markers.push({ el: marker, label: label, pin: pin, d: d, pos: { x: 0, y: 0 }, labelHalf: 0, labelH: 0, pinH: 0, labelTop: 0 });
    });

    var geometry = G.build(data);
    var size = { w: 0, h: 0 };
    var view = { yaw: 0, pitch: 0, toYaw: 0, toPitch: 0 };
    var cam = null;

    var svgRenderer = {
      kind: "svg",
      resize: function () {},
      render: function (next) {
        G.renderSvg(svg, geometry, data, next);
      },
      project: function (x, y, z) {
        return G.project(cam, x, y, z);
      },
      destroy: function () {
        svg.replaceChildren();
      }
    };
    var renderer = svgRenderer;

    function setPos(el, p) {
      el.style.setProperty("--x", p.x.toFixed(1) + "px");
      el.style.setProperty("--y", p.y.toFixed(1) + "px");
    }

    function draw() {
      if (!size.w || !size.h) return;
      cam = G.camera(data.map, size.w, size.h, view.yaw, view.pitch);
      renderer.render(cam);
      markers.forEach(function (m) {
        m.pos = renderer.project(m.d.x, 0, m.d.z);
        setPos(m.el, m.pos);
      });
      placeLabels();
      var s = data.project;
      if (siteEl) setPos(siteEl, renderer.project(s.x, s.height, s.z));
      placePreview();
    }

    // Keep marker labels from overlapping each other (and other pins).
    // Each label tries, in order: below its pin, above its pin, then the
    // below/above slots shifted sideways away from whatever it hits.
    function placeLabels() {
      var GAP = 4;
      var placed = markers.map(function (m) {
        // Pin footprint: the dot and stem above the map point
        return { l: m.pos.x - 7, r: m.pos.x + 7, t: m.pos.y - m.pinH, b: m.pos.y };
      });

      function overlaps(a, b) {
        return a.l < b.r + GAP && a.r + GAP > b.l && a.t < b.b + GAP && a.b + GAP > b.t;
      }

      function clampNudge(m, nudge) {
        var left = m.pos.x + nudge - m.labelHalf;
        var right = m.pos.x + nudge + m.labelHalf;
        if (left < 4) nudge += 4 - left;
        else if (right > size.w - 4) nudge -= right - (size.w - 4);
        return nudge;
      }

      // Lay out top-to-bottom, left-to-right so results are stable
      var order = markers.slice().sort(function (a, b) {
        return a.pos.y - b.pos.y || a.pos.x - b.pos.x;
      });

      // Mobile: labels must stay over their own pin, and arrow labels start
      // (←) or end (→) at the pin so the arrow points away from it.
      var mobile = mobileQuery.matches;

      order.forEach(function (m) {
        var own = markers.indexOf(m);
        var lifts = [0, -(m.labelTop + m.labelH + m.pinH + GAP)];
        var best = null;

        var anchor = 0;
        if (mobile && m.d.arrow === "left") anchor = m.labelHalf - 8;
        else if (mobile && m.d.arrow === "right") anchor = -(m.labelHalf - 8);
        var baseNudge = clampNudge(m, anchor);

        function box(nudge, lift) {
          var cx = m.pos.x + nudge;
          var top = m.pos.y + m.labelTop + lift;
          return { l: cx - m.labelHalf, r: cx + m.labelHalf, t: top, b: top + m.labelH };
        }

        function collisions(b) {
          return placed.filter(function (p, i) {
            return i !== own && overlaps(b, p);
          });
        }

        function staysOnPin(b) {
          return !mobile || (b.l <= m.pos.x - 2 && b.r >= m.pos.x + 2);
        }

        // 1) below, 2) above (mobile weighs these against small sideways
        // shifts instead, so a label stays beside its own pin when it can)
        var options = [];
        for (var i = 0; i < lifts.length && !best; i++) {
          var b = box(baseNudge, lifts[i]);
          if (collisions(b).length) continue;
          if (mobile) options.push({ nudge: baseNudge, lift: lifts[i], box: b, cost: Math.abs(lifts[i]) * 0.5 });
          else best = { nudge: baseNudge, lift: lifts[i], box: b };
        }

        // 3) shift sideways clear of the obstacles, keeping the label near its pin
        if (!best) {
          lifts.forEach(function (lift) {
            var base = box(baseNudge, lift);
            collisions(base).forEach(function (p) {
              [p.r + GAP - base.l, p.l - GAP - base.r].forEach(function (shift) {
                var n2 = clampNudge(m, baseNudge + shift);
                var b2 = box(n2, lift);
                if (!collisions(b2).length && staysOnPin(b2)) {
                  options.push({ nudge: n2, lift: lift, box: b2, cost: Math.abs(n2 - baseNudge) + Math.abs(lift) * 0.5 });
                }
              });
            });
          });
          options.sort(function (a, b) { return a.cost - b.cost; });
          best = options[0] || { nudge: baseNudge, lift: 0, box: box(baseNudge, 0) };
        }

        m.label.style.setProperty("--nudge", best.nudge.toFixed(1) + "px");
        m.label.style.setProperty("--lift", best.lift.toFixed(1) + "px");
        placed.push(best.box);
      });
    }

    function measure() {
      size.w = stage.clientWidth;
      size.h = stage.clientHeight;
      markers.forEach(function (m) {
        m.labelHalf = m.label.offsetWidth / 2;
        m.labelH = m.label.offsetHeight;
        m.pinH = m.pin.offsetHeight;
        // Label top relative to the map point when sitting below the pin
        m.labelTop = m.label.offsetTop - m.pinH;
      });
      renderer.resize(size.w, size.h);
      draw();
    }

    var resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(stage);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (!destroyed) measure();
      });
    }

    if (supportsWebGL()) {
      import(moduleUrl)
        .then(function (mod) {
          if (destroyed) return;
          var three = mod.mountMap(canvasHost, { data: data, geometry: geometry, G: G, maxPixelRatio: 1.75 });
          renderer = three;
          svgRenderer.destroy();
          section.classList.add("has-webgl");
          measure();
        })
        .catch(function (error) {
          console.warn("[Vedvan] Location map is using the static fallback:", error);
        });
    }

    var raf = 0;
    var lastStep = 0;
    function step(now) {
      raf = 0;
      var dt = lastStep ? Math.min((now - lastStep) / 16.667, 4) : 1;
      lastStep = now;
      var k = 1 - Math.pow(1 - LERP, dt);
      view.yaw += (view.toYaw - view.yaw) * k;
      view.pitch += (view.toPitch - view.pitch) * k;
      var settled = Math.abs(view.toYaw - view.yaw) < 0.01 && Math.abs(view.toPitch - view.pitch) < 0.01;
      if (settled) {
        view.yaw = view.toYaw;
        view.pitch = view.toPitch;
      }
      draw();
      if (settled) lastStep = 0;
      else raf = requestAnimationFrame(step);
    }
    function kick() {
      if (!raf) raf = requestAnimationFrame(step);
    }

    function onPointerMove(event) {
      if (event.pointerType !== "mouse" || renderer.kind !== "three" || !finePointer.matches || prefersReducedMotion()) return;
      var rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var amp = wideQuery.matches ? 1 : 0.5;
      var nx = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
      var ny = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
      view.toYaw = nx * data.map.parallax.yaw * amp;
      view.toPitch = -ny * data.map.parallax.pitch * amp;
      kick();
    }
    function resetView() {
      view.toYaw = 0;
      view.toPitch = 0;
      kick();
    }
    section.addEventListener("pointermove", onPointerMove);
    section.addEventListener("pointerleave", resetView);
    var motionHandler = function () { resetView(); };
    reducedMotionQuery.addEventListener("change", motionHandler);

    var shownId = null;
    var pinnedId = null;
    var previewId = null;
    var previewOpen = false;

    function setPreviewXY(x, y) {
      if (gsap) gsap.set(preview, { x: x, y: y });
      else preview.style.transform = "translate(" + x + "px," + y + "px)";
    }

    function overlap(a, b) {
      var w = Math.min(a.r, b.r) - Math.max(a.l, b.l);
      var h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      return w > 0 && h > 0 ? w * h : 0;
    }

    function markerBox(m) {
      var w = m.el.offsetWidth;
      var h = m.el.offsetHeight;
      var pin = m.el.querySelector(".location__pin").offsetHeight;
      var nudge = parseFloat(m.label.style.getPropertyValue("--nudge")) || 0;
      var lift = parseFloat(m.label.style.getPropertyValue("--lift")) || 0;
      // Union of the button and its (possibly moved) label
      var top = m.pos.y + m.labelTop + lift;
      return {
        l: Math.min(m.pos.x - w / 2, m.pos.x + nudge - m.labelHalf),
        r: Math.max(m.pos.x + w / 2, m.pos.x + nudge + m.labelHalf),
        t: Math.min(m.pos.y - pin, top),
        b: Math.max(m.pos.y - pin + h, top + m.labelH)
      };
    }

    function placePreview() {
      if (!previewId || !preview) return;
      var m = markers.filter(function (k) { return k.d.id === previewId; })[0];
      var pw = preview.offsetWidth;
      var ph = preview.offsetHeight;
      var W = mapEl.clientWidth;
      var H = mapEl.clientHeight;
      var own = markerBox(m);
      var others = markers.filter(function (k) { return k !== m; }).map(markerBox);
      var x0 = m.pos.x;
      var y0 = own.t;
      var candidates = [
        [x0 - pw / 2, y0 - 14 - ph],
        [x0 - pw * 0.85, y0 - 14 - ph],
        [x0 - pw * 0.15, y0 - 14 - ph],
        [own.r + 14, m.pos.y - ph * 0.7],
        [own.l - 14 - pw, m.pos.y - ph * 0.7],
        [x0 - pw / 2, own.b + 14]
      ];
      var best = null;
      candidates.forEach(function (c, i) {
        var x = clamp(c[0], 8, W - pw - 8);
        var y = clamp(c[1], 8, H - ph - 8);
        var box = { l: x, r: x + pw, t: y, b: y + ph };
        if (overlap(box, own) > 0) return;
        var cost = others.reduce(function (sum, o) { return sum + overlap(box, o); }, 0) + i;
        if (!best || cost < best.cost) best = { x: x, y: y, cost: cost };
      });
      if (!best) best = { x: clamp(candidates[0][0], 8, W - pw - 8), y: clamp(candidates[0][1], 8, H - ph - 8) };
      setPreviewXY(best.x, best.y);
    }

    var detailsTl = null;
    var previewTl = null;
    function quiet() {
      return !gsap || prefersReducedMotion();
    }

    function fillDetails(d) {
      if (nameEl) nameEl.textContent = d.name;
      if (timeEl) timeEl.textContent = d.travelTime;
      if (descEl) descEl.textContent = d.description;
    }

    function updateDetails(d, instant) {
      if (detailsTl) detailsTl.kill();
      detailsTl = null;
      if (instant || quiet() || !detailsInner) {
        fillDetails(d);
        if (gsap && detailsInner) gsap.set(detailsInner, { autoAlpha: 1, y: 0, filter: "none" });
        return;
      }
      detailsTl = gsap.timeline()
        .to(detailsInner, { autoAlpha: 0, y: -6, filter: "blur(6px)", duration: 0.22, ease: "power1.in" })
        .call(fillDetails, [d])
        .fromTo(detailsInner,
          { autoAlpha: 0, y: 10, filter: "blur(6px)" },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power2.out" });
    }

    function setImage(d) {
      if (!previewImg) return;
      previewImg.src = d.image;
      previewImg.alt = d.imageAlt;
      placePreview();
    }

    function setFrameVisible(on) {
      if (!previewFrame) return;
      if (gsap) {
        gsap.set(previewFrame, { autoAlpha: on ? 1 : 0, scale: 1, filter: "none" });
      } else {
        previewFrame.style.opacity = on ? "1" : "0";
        previewFrame.style.visibility = on ? "visible" : "hidden";
      }
    }

    function openPreview(id) {
      var d = byId[id];
      if (!d || !previewFrame || (previewOpen && previewId === id)) return;
      // Destinations without a photo (e.g. the EPE until one is supplied) get no preview
      if (!d.image) {
        if (previewOpen) closePreview();
        return;
      }
      var swap = previewOpen;
      previewOpen = true;
      previewId = id;
      if (previewTl) previewTl.kill();
      previewTl = null;
      if (quiet()) {
        setImage(d);
        setFrameVisible(true);
        return;
      }
      var tl = gsap.timeline();
      previewTl = tl;
      if (swap) tl.to(previewFrame, { autoAlpha: 0, scale: 0.97, filter: "blur(6px)", duration: 0.22, ease: "power1.in" });
      tl.call(function () {
        setImage(d);
        if (!previewImg.decode) return;
        tl.pause();
        previewImg.decode().catch(function () {}).then(function () {
          if (previewTl === tl) tl.resume();
        });
      })
        .fromTo(previewFrame,
          { autoAlpha: 0, scale: 1.04, filter: "blur(6px)" },
          { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.55, ease: "power2.out" });
    }

    function closePreview() {
      if (!previewOpen) return;
      previewOpen = false;
      if (previewTl) previewTl.kill();
      previewTl = null;
      if (quiet()) {
        setFrameVisible(false);
        return;
      }
      previewTl = gsap.to(previewFrame, { autoAlpha: 0, scale: 0.97, filter: "blur(6px)", duration: 0.3, ease: "power1.in" });
    }

    function show(id, instant) {
      var d = byId[id];
      if (!d || id === shownId) return;
      shownId = id;
      items.forEach(function (item) {
        item.setAttribute("aria-pressed", String(item.dataset.locationId === id));
      });
      markers.forEach(function (m) {
        var on = m.d.id === id;
        m.el.classList.toggle("is-active", on);
        m.el.setAttribute("aria-pressed", String(on));
      });
      updateDetails(d, instant);
    }

    function select(id) {
      pinnedId = id;
      show(id);
      openPreview(id);
    }

    function idOf(event) {
      var el = event.target.closest && event.target.closest("[data-location-id]");
      return el ? el.dataset.locationId : null;
    }

    function onPick(event) {
      var id = idOf(event);
      if (id) select(id);
    }
    function onHover(event) {
      if (event.pointerType !== "mouse") return;
      var id = idOf(event);
      if (!id) return;
      show(id);
      openPreview(id);
    }
    function onHoverEnd(event) {
      if (event.pointerType !== "mouse") return;
      var to = event.relatedTarget;
      if (to && to.closest && to.closest("[data-location-id]")) return;
      if (pinnedId) {
        show(pinnedId);
        openPreview(pinnedId);
      } else {
        closePreview();
      }
    }
    function onOutsideClick(event) {
      if (idOf(event)) return;
      pinnedId = null;
      closePreview();
    }
    function onListKey(event) {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      var i = items.indexOf(document.activeElement);
      if (i < 0) return;
      event.preventDefault();
      var next = items[(i + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length];
      next.focus();
      select(next.dataset.locationId);
    }

    [list, markerLayer].forEach(function (el) {
      el.addEventListener("click", onPick);
      el.addEventListener("pointerover", onHover);
      el.addEventListener("pointerout", onHoverEnd);
    });
    list.addEventListener("keydown", onListKey);
    document.addEventListener("click", onOutsideClick);

    var preloaded = false;
    var nearObserver = new IntersectionObserver(function (entries) {
      if (preloaded || !entries[0].isIntersecting) return;
      preloaded = true;
      destinations.forEach(function (d) {
        if (!d.image) return;
        var img = new Image();
        img.src = d.image;
      });
      nearObserver.disconnect();
    }, { rootMargin: "600px 0px" });
    nearObserver.observe(section);

    show(data.defaultId && byId[data.defaultId] ? data.defaultId : destinations[0].id, true);
    measure();
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();

    if (gsap && window.ScrollTrigger && !prefersReducedMotion()) {
      var bodies = markers.map(function (m) { return m.el.querySelector(".location__marker-body"); });
      gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: { trigger: section, start: "top 72%", once: true, refreshPriority: -1 }
      })
        .from(section.querySelector(".location__eyebrow"), { autoAlpha: 0, y: 12, duration: 0.6 }, 0)
        .from(section.querySelector(".location__title"), { autoAlpha: 0, y: 18, duration: 0.8 }, 0.08)
        .from(items, { autoAlpha: 0, y: 16, duration: 0.7, stagger: 0.07 }, 0.2)
        .from(canvasHost, { autoAlpha: 0, scale: 1.035, duration: 1.3 }, 0.1)
        .from(siteEl, { autoAlpha: 0, y: 8, duration: 0.6 }, 0.5)
        .from(bodies, { autoAlpha: 0, y: 10, duration: 0.6, stagger: 0.08 }, 0.6)
        .from(preview, { autoAlpha: 0, duration: 0.7 }, 1);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initLocation);
  else initLocation();
})();
