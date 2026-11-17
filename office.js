import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createOffice(host, { width, depth, workstations }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#ffffff');
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = false;
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Interactive cutaway of the concept office');
  host.append(canvas);

  const camera = new THREE.OrthographicCamera(-17, 17, 12, -12, .1, 140);
  camera.position.set(28, 27, 28);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, .4, 0);
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI * .46;
  controls.minZoom = .65;
  controls.maxZoom = 2.4;
  controls.update();

  const outline = new THREE.LineBasicMaterial({ color: '#353735', transparent: true, opacity: .68 });
  function box(parent, x, y, z, w, h, d, color, options = {}, edged = true) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshBasicMaterial({ color, ...options }),
    );
    mesh.position.set(x, y, z);
    if (edged && !options.transparent) {
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), outline));
    }
    parent.add(mesh);
    return mesh;
  }

  const wall = '#fafaf8';
  const timber = '#e2bd94';
  const frame = '#5b605d';
  const glazing = -depth / 2;
  box(scene, 0, -.22, 0, width, .44, depth, '#e5e1d9');
  box(scene, 0, -.01, 0, width - .12, .04, depth - .12, '#faf8f3');
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
    box(scene, x, .42, z, .57, .11, .55, '#e9ece7');
    box(scene, x, .66, z + facing * .23, .57, .43, .09, '#e9ece7');
    box(scene, x, .2, z, .12, .4, .12, frame);
  }

  for (const { x, z, w, d, type } of workstations) {
    if (type === 'lounge') {
      box(scene, x, .28, z + .65, w * .8, .53, .9, '#a8b2a2');
      box(scene, x, .6, z + 1, w * .8, .52, .2, '#a8b2a2');
      box(scene, x, .32, z - .55, 1.8, .64, .75, timber);
      continue;
    }
    if (type === 'booth') {
      box(scene, x, 1.15, z + d / 2, w, 2.3, .16, '#c9bab1');
      box(scene, x - w / 2, 1.15, z, .16, 2.3, d, '#c9bab1');
    }
    table(x, z, type === 'booth' ? 1.8 : w, .85);
    chair(x, z + (type === 'booth' ? -.8 : .85), type === 'booth' ? -1 : 1);
    if (type === 'desk') {
      box(scene, x, .88, z - .2, .29, .08, .18, frame);
      box(scene, x, 1.16, z - .23, .69, .43, .055, '#424b47');
    }
    if (type === 'touchdown') chair(x + 1.25, z + .85, 1);
  }

  // Warm floorboards ground the flexible work settings in the cutaway.
  for (let row = 0; row < 11; row++) {
    const z = 2.1 + row * .48;
    box(scene, 0, .015, z, 22.6, .024, .465, row % 3 === 0 ? '#ead0af' : '#e7c6a1', {}, false);
  }

  function plant(x, z) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(.29, .22, .42, 10), new THREE.MeshBasicMaterial({ color: '#e1dfd5' }));
    pot.position.set(x, .22, z);
    pot.add(new THREE.LineSegments(new THREE.EdgesGeometry(pot.geometry, 38), outline));
    scene.add(pot);
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI * .76;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 5), new THREE.MeshBasicMaterial({
        color: ['#536f54', '#748c60', '#a2ad7d'][i % 3],
      }));
      leaf.scale.set(.13, .39, .07);
      leaf.position.set(x + Math.cos(angle) * .22, .66 + (i % 3) * .12, z + Math.sin(angle) * .22);
      leaf.rotation.set(.55 * Math.sin(angle), -angle, -.55 * Math.cos(angle));
      scene.add(leaf);
    }
  }

  for (const [x, z] of [[-10.9, 6.2], [-4.1, 5.8], [3.6, 5.9], [10.7, -6.7], [-10.8, -6.6]]) plant(x, z);

  const render = () => renderer.render(scene, camera);
  function resize() {
    const { clientWidth: w, clientHeight: h } = host;
    if (!w || !h) return;
    const aspect = w / h;
    const halfHeight = Math.max(8.15, 14.6 / aspect);
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
  resize();
  return canvas;
}
