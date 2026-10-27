/* ==========================================================================
   Vedvan — home section 3: Three.js map renderer (ES module, loaded on demand)

   Draws the schematic geometry from location.geometry.js: roads as flat
   ribbons (real line weights, one merged mesh per tone), soft plot fills and
   the site as a low two-tone slab. Renders only when asked to (no loop of
   its own); location.js drives it and positions the HTML markers using
   project(). Same interface as the SVG renderer in location.js.
   ========================================================================== */
import * as THREE from 'three';

const LAYERS = ['green', 'block', 'plot', 'street', 'major'];

function ribbonGeometry(lines) {
  const positions = [];
  lines.forEach(({ points, width }) => {
    const half = width / 2;
    for (let i = 0; i < points.length - 1; i++) {
      const [x1, z1] = points[i];
      const [x2, z2] = points[i + 1];
      const len = Math.hypot(x2 - x1, z2 - z1) || 1;
      const dx = (x2 - x1) / len;
      const dz = (z2 - z1) / len;
      // Extend each segment by half its width so joints close up
      const ax = x1 - dx * half, az = z1 - dz * half;
      const bx = x2 + dx * half, bz = z2 + dz * half;
      const nx = -dz * half, nz = dx * half;
      positions.push(
        ax + nx, 0, az + nz, ax - nx, 0, az - nz, bx + nx, 0, bz + nz,
        bx + nx, 0, bz + nz, ax - nx, 0, az - nz, bx - nx, 0, bz - nz
      );
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

function fillGeometry(fills) {
  const positions = [];
  fills.forEach(({ points }) => {
    for (let i = 1; i < points.length - 1; i++) {
      [points[0], points[i], points[i + 1]].forEach(([x, z]) => positions.push(x, 0, z));
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

export function mountMap(host, { data, geometry, G, maxPixelRatio = 1.75 }) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = 'location__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);
  const disposables = [];

  // Flat layers: drawn in order without depth so nothing z-fights
  LAYERS.forEach((tone, order) => {
    const isFill = tone === 'green' || tone === 'block';
    const items = isFill
      ? geometry.fills.filter((f) => f.tone === tone)
      : geometry.lines.filter((l) => l.tone === tone);
    if (!items.length) return;
    const geo = isFill ? fillGeometry(items) : ribbonGeometry(items);
    const mat = new THREE.MeshBasicMaterial({ color: G.TONES[tone], depthTest: false, depthWrite: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = order;
    scene.add(mesh);
    disposables.push(geo, mat);
  });

  // Site: low slab, lit by flat per-face tones (BoxGeometry face order: +x −x +y −y +z −z)
  const s = data.project;
  const slabGeo = new THREE.BoxGeometry(s.length, s.height, s.depth);
  const faces = ['#cfae78', '#cfae78', '#ead6ab', '#cfae78', '#dcc08d', '#c3a06a'].map(
    (color) => new THREE.MeshBasicMaterial({ color })
  );
  const slab = new THREE.Mesh(slabGeo, faces);
  slab.position.set(s.x, s.height / 2, s.z);
  slab.rotation.y = s.rotation;
  slab.renderOrder = LAYERS.length;
  scene.add(slab);
  disposables.push(slabGeo, ...faces);

  let cam = null;

  function apply(next) {
    cam = next;
    camera.fov = next.fov;
    camera.aspect = next.aspect;
    camera.near = next.near;
    camera.far = next.far;
    camera.position.set(next.eye[0], next.eye[1], next.eye[2]);
    camera.lookAt(next.target[0], next.target[1], next.target[2]);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  const v = new THREE.Vector3();

  return {
    kind: 'three',
    resize(width, height) {
      renderer.setSize(width, height, false);
    },
    render(nextCam) {
      apply(nextCam);
      renderer.render(scene, camera);
    },
    project(x, y, z) {
      v.set(x, y, z).project(camera);
      return { x: (v.x + 1) / 2 * cam.width, y: (1 - v.y) / 2 * cam.height };
    },
    destroy() {
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      canvas.remove();
    }
  };
}
