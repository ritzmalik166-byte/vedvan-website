/* ==========================================================================
   Vedvan — home section 3: schematic map geometry + static (SVG) renderer

   Shared by both map renderers so they draw the same picture:
   - build(data)            roads and plot fills as flat polylines (x, z)
   - camera(map, w, h)      the elevated perspective camera for a stage size
   - project(cam, x, y, z)  map point → stage pixels (matches Three's camera)
   - renderSvg(svg, …)      static fallback, also shown while Three loads

   Street and plot lines are generated from a fixed seed (identical on every
   load) and are purely illustrative; only data.map.arterials is authored.
   ========================================================================== */
(function () {
  'use strict';

  var TONES = {
    major: '#a29d8e',
    street: '#bfbaab',
    plot: '#d8d3c4',
    block: '#f1ede0',
    green: '#e4e7d0'
  };

  function random(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Catmull-Rom through the control points, `steps` samples per span
  function smooth(points, steps) {
    if (points.length < 3) return points.slice();
    var out = [];
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[Math.max(i - 1, 0)];
      var p1 = points[i];
      var p2 = points[i + 1];
      var p3 = points[Math.min(i + 2, points.length - 1)];
      for (var s = 0; s < steps; s++) {
        var t = s / steps;
        var t2 = t * t;
        var t3 = t2 * t;
        out.push([0, 1].map(function (k) {
          return 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t +
            (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
            (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
        }));
      }
    }
    out.push(points[points.length - 1].slice());
    return out;
  }

  function build(data) {
    var map = data.map;
    var b = map.bounds;
    var rnd = random(map.seed || 1);
    var site = data.project;
    var a = site.rotation;
    var u = [Math.cos(a), -Math.sin(a)];
    var v = [Math.sin(a), Math.cos(a)];
    var SX = 3.1;
    var SY = 2.5;
    var I = 8;
    var J = 9;
    var lines = [];
    var fills = [];

    function inside(p, margin) {
      return p[0] > b.minX - margin && p[0] < b.maxX + margin && p[1] > b.minZ - margin && p[1] < b.maxZ + margin;
    }
    function nearSite(p, r) {
      var dx = p[0] - site.x;
      var dz = p[1] - site.z;
      return dx * dx + dz * dz < r * r;
    }
    function lerp(p, q, t) {
      return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    }

    // Street grid aligned with the site, nodes jittered so blocks vary
    var nodes = {};
    for (var i = -I; i <= I; i++) {
      for (var j = -J; j <= J; j++) {
        var ox = (rnd() - 0.5) * 0.7;
        var oy = (rnd() - 0.5) * 0.7;
        nodes[i + ',' + j] = [
          site.x + u[0] * (i * SX + ox) + v[0] * (j * SY + oy),
          site.z + u[1] * (i * SX + ox) + v[1] * (j * SY + oy)
        ];
      }
    }
    function node(i, j) {
      return nodes[i + ',' + j];
    }

    for (i = -I; i <= I; i++) {
      for (j = -J; j <= J; j++) {
        var p = node(i, j);
        var right = node(i + 1, j);
        var down = node(i, j + 1);
        if (right && rnd() < 0.82 && (inside(p, 1) || inside(right, 1))) {
          lines.push({ points: [p, right], width: 0.075, tone: 'street' });
        }
        if (down && rnd() < 0.78 && (inside(p, 1) || inside(down, 1))) {
          lines.push({ points: [p, down], width: 0.075, tone: 'street' });
        }

        var c = node(i + 1, j + 1);
        if (!right || !down || !c || !inside(p, 0)) continue;
        var centre = [(p[0] + c[0]) / 2, (p[1] + c[1]) / 2];
        var r = rnd();
        if (nearSite(centre, 3.6)) {
          fills.push({ points: [p, right, c, down], tone: 'green' });
          continue;
        }
        if (r < (centre[1] < 0 ? 0.46 : 0.3)) {
          // Plot boundaries across the block
          var n = 1 + Math.floor(rnd() * 3);
          var alongU = rnd() < 0.5;
          for (var k = 1; k <= n; k++) {
            var t = k / (n + 1) + (rnd() - 0.5) * 0.08;
            lines.push({
              points: alongU ? [lerp(p, down, t), lerp(right, c, t)] : [lerp(p, right, t), lerp(down, c, t)],
              width: 0.03,
              tone: 'plot'
            });
          }
        } else if (r < 0.42) {
          fills.push({ points: [p, right, c, down], tone: 'block' });
        }
      }
    }

    map.arterials.forEach(function (road) {
      lines.push({ points: smooth(road.points, 8), width: road.width, tone: road.tone || 'major' });
    });

    return { lines: lines, fills: fills };
  }

  /* Camera --------------------------------------------------------------- */

  function rad(deg) {
    return deg * Math.PI / 180;
  }

  // yaw/pitch (degrees) are added for pointer parallax
  function camera(map, width, height, yaw, pitch) {
    var c = map.camera;
    var aspect = width / Math.max(height, 1);
    var vf = rad(c.fov);
    var tanV = Math.tan(vf / 2);
    var el = rad(c.elevation + (pitch || 0));
    var az = rad(c.azimuth + (yaw || 0));
    // Distance that keeps fitWidth × fitDepth (as seen from this angle) in frame
    var d = Math.max(map.fitWidth / (tanV * aspect), map.fitDepth * Math.sin(el) / tanV);
    var target = [c.target.x, 0, c.target.z];
    var eye = [
      target[0] + d * Math.cos(el) * Math.sin(az),
      d * Math.sin(el),
      target[2] + d * Math.cos(el) * Math.cos(az)
    ];
    return { eye: eye, target: target, fov: c.fov, aspect: aspect, width: width, height: height, near: d * 0.2, far: d * 4 };
  }

  function sub(p, q) { return [p[0] - q[0], p[1] - q[1], p[2] - q[2]]; }
  function dot(p, q) { return p[0] * q[0] + p[1] * q[1] + p[2] * q[2]; }
  function cross(p, q) { return [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]]; }
  function norm(p) { var l = Math.sqrt(dot(p, p)) || 1; return [p[0] / l, p[1] / l, p[2] / l]; }

  // Same convention as THREE.PerspectiveCamera + lookAt(target), up = +y.
  // Returns stage pixels plus `scale` (pixels per map unit at that depth).
  function project(cam, x, y, z) {
    var f = norm(sub(cam.target, cam.eye));
    var r = norm(cross(f, [0, 1, 0]));
    var up = cross(r, f);
    var p = sub([x, y, z], cam.eye);
    var depth = dot(p, f);
    var focal = cam.height / (2 * Math.tan(rad(cam.fov) / 2));
    return {
      x: cam.width / 2 + dot(p, r) * focal / depth,
      y: cam.height / 2 - dot(p, up) * focal / depth,
      scale: focal / depth
    };
  }

  /* Static SVG renderer ---------------------------------------------------- */

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function renderSvg(svg, geometry, data, cam) {
    var w = cam.width;
    var h = cam.height;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.replaceChildren();

    function pts(list) {
      return list.map(function (q) {
        var s = project(cam, q[0], 0, q[1]);
        return s.x.toFixed(1) + ',' + s.y.toFixed(1);
      }).join(' ');
    }

    geometry.fills.forEach(function (fill) {
      var poly = document.createElementNS(SVG_NS, 'polygon');
      poly.setAttribute('points', pts(fill.points));
      poly.setAttribute('fill', TONES[fill.tone]);
      svg.appendChild(poly);
    });

    ['plot', 'street', 'major'].forEach(function (tone) {
      geometry.lines.forEach(function (line) {
        if (line.tone !== tone) return;
        var mid = line.points[Math.floor(line.points.length / 2)];
        var scale = project(cam, mid[0], 0, mid[1]).scale;
        var el = document.createElementNS(SVG_NS, 'polyline');
        el.setAttribute('points', pts(line.points));
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', TONES[tone]);
        el.setAttribute('stroke-width', Math.max(0.6, line.width * scale).toFixed(2));
        el.setAttribute('stroke-linecap', 'round');
        el.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(el);
      });
    });

    // Site footprint: top face only (flat fallback)
    var s = data.project;
    var ca = Math.cos(s.rotation);
    var sa = Math.sin(s.rotation);
    var hl = s.length / 2;
    var hd = s.depth / 2;
    var corners = [[-hl, -hd], [hl, -hd], [hl, hd], [-hl, hd]].map(function (q) {
      return [s.x + q[0] * ca + q[1] * sa, s.z - q[0] * sa + q[1] * ca];
    });
    var site = document.createElementNS(SVG_NS, 'polygon');
    site.setAttribute('points', pts(corners));
    site.setAttribute('fill', '#e6cf9f');
    site.setAttribute('stroke', '#c9a670');
    site.setAttribute('stroke-width', '1');
    svg.appendChild(site);
  }

  window.VedvanLocationGeometry = {
    TONES: TONES,
    build: build,
    camera: camera,
    project: project,
    renderSvg: renderSvg
  };
})();
