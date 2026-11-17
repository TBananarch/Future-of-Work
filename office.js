import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createOffice(host, { width, depth, daylightDepth, workstations, daylight }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e9ece3');
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Interactive cutaway of the concept office');
  host.append(canvas);

  const camera = new THREE.OrthographicCamera(-17, 17, 12, -12, .1, 140);
  camera.position.set(24, 23, 31);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, .4, 0);
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI * .46;
  controls.minZoom = .65;
  controls.maxZoom = 2.4;
  controls.update();

  scene.add(new THREE.HemisphereLight('#ffffff', '#686e61', 2.2));
  const sunlight = new THREE.DirectionalLight('#fff1db', 2.5);
  sunlight.position.set(-12, 25, 9);
  sunlight.castShadow = true;
  Object.assign(sunlight.shadow.camera, { left: -19, right: 19, top: 19, bottom: -19 });
  sunlight.shadow.mapSize.set(2048, 2048);
  sunlight.shadow.normalBias = .03;
  scene.add(sunlight);

  function box(parent, x, y, z, w, h, d, color, options = {}) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color, ...options }),
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = !options.transparent;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const wall = '#d9ded3';
  const timber = '#a77950';
  const frame = '#374f46';
  const glazing = -depth / 2;
  box(scene, 0, -.22, 0, width, .44, depth, '#d0c8b3');
  box(scene, 0, -.01, 0, width - .12, .04, depth - .12, '#f4ecdb');
  box(scene, -width / 2, 1.35, -3.5, .18, 2.7, 9, wall);
  box(scene, 0, .13, glazing, width, .26, .18, frame);
  box(scene, 0, 2.7, glazing, width, .12, .15, frame);
  for (let x = -width / 2; x <= width / 2; x += 2) {
    box(scene, x, 1.42, glazing, .09, 2.65, .15, frame);
  }
  box(scene, 0, 1.48, glazing, width - .1, 2.4, .07, '#90c8d0', { transparent: true, opacity: .24, depthWrite: false });

  function table(x, z, w, d) {
    box(scene, x, .79, z, w, .1, d, timber);
    for (const side of [-1, 1]) {
      box(scene, x + side * (w / 2 - .17), .38, z, .09, .77, d * .77, frame);
    }
  }

  function chair(x, z, facing) {
    box(scene, x, .42, z, .57, .11, .55, '#648176');
    box(scene, x, .66, z + facing * .23, .57, .43, .09, '#648176');
    box(scene, x, .2, z, .12, .4, .12, frame);
  }

  for (const { x, z, w, d, type } of workstations) {
    if (type === 'lounge') {
      box(scene, x, .28, z + .65, w * .8, .53, .9, '#8d9b7a');
      box(scene, x, .6, z + 1, w * .8, .52, .2, '#8d9b7a');
      box(scene, x, .32, z - .55, 1.8, .64, .75, timber);
      continue;
    }
    if (type === 'booth') {
      box(scene, x, 1.15, z + d / 2, w, 2.3, .16, '#7c8d7a');
      box(scene, x - w / 2, 1.15, z, .16, 2.3, d, '#7c8d7a');
    }
    table(x, z, type === 'booth' ? 1.8 : w, .85);
    chair(x, z + (type === 'booth' ? -.8 : .85), type === 'booth' ? -1 : 1);
    if (type === 'desk') {
      box(scene, x, .88, z - .2, .29, .08, .18, frame);
      box(scene, x, 1.16, z - .23, .69, .43, .055, '#424b47');
    }
    if (type === 'touchdown') chair(x + 1.25, z + .85, 1);
  }

  const overlays = new THREE.Group();
  scene.add(overlays);
  let markers = [];

  function render() {
    renderer.render(scene, camera);
    for (const { element, point } of markers) {
      const { x, y } = point.clone().project(camera);
      element.style.left = `${(x + 1) * 50}%`;
      element.style.top = `${(1 - y) * 50}%`;
    }
  }

  function resize() {
    const { clientWidth: w, clientHeight: h } = host;
    if (!w || !h) return;
    const aspect = w / h;
    const halfHeight = Math.max(11.5, 16 / aspect);
    Object.assign(camera, { left: -halfHeight * aspect, right: halfHeight * aspect, top: halfHeight, bottom: -halfHeight });
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    render();
  }

  controls.addEventListener('change', render);
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  canvas.addEventListener('webglcontextlost', () => {
    observer.disconnect();
    controls.dispose();
  }, { once: true });

  return {
    resize,
    show(topic) {
      for (const mesh of [...overlays.children]) {
        mesh.removeFromParent();
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      for (const { element } of markers) element.remove();
      for (const { x, z, w, d, color } of topic.zones) {
        box(overlays, x, .027, z, w, .018, d, color, { transparent: true, opacity: .7, depthWrite: false });
      }
      if (topic === daylight) {
        const x = -10.5;
        box(overlays, x, .06, glazing + daylightDepth / 2, .055, .04, daylightDepth, frame);
        for (const z of [glazing, glazing + daylightDepth]) box(overlays, x, .06, z, .65, .04, .06, frame);
      }
      markers = topic.labels.map(({ x, z, text }) => {
        const element = document.createElement('span');
        element.className = 'marker';
        element.setAttribute('aria-hidden', 'true');
        element.textContent = text;
        host.append(element);
        return { element, point: new THREE.Vector3(x, topic === daylight ? .3 : 2.65, z) };
      });
      render();
    },
  };
}
