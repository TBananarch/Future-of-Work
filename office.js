import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createOffice(host, { plates, workstations, chairPlacement, deskRows }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#ffffff');
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = false;
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Interactive cutaway of an office floor plate, with two workplace wings and a central atrium');
  host.append(canvas);

  const camera = new THREE.OrthographicCamera(-17, 17, 12, -12, .1, 220);
  camera.position.set(48, 47, 43);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, -.8, 0);
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI * .46;
  controls.minZoom = .65;
  controls.maxZoom = 2.4;
  controls.update();

  const outline = new THREE.LineBasicMaterial({ color: '#777887', transparent: true, opacity: .48 });
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

  const wall = '#f5f4fa';
  const frame = '#b7b8c3';
  const timber = '#f4f1eb';
  const glass = { transparent: true, opacity: .2, depthWrite: false };

  for (const { x, z, w, d } of plates) {
    box(scene, x, -.22, z, w, .44, d, '#dedede');
    box(scene, x, .012, z, w - .04, .025, d - .04, '#fafafa', {}, false);
    box(scene, x, -3.7, z, w, .32, d, '#e8e8e8');
  }

  // Two glazed wings frame a 20 m approach to either side of the atrium.
  for (const side of [-1, 1]) {
    const facade = side * 24;
    for (let x = -21; x <= 21; x += 3) {
      box(scene, x, -.5, facade, .13, 6.2, .2, frame);
      if (x < 21) {
        box(scene, x + 1.5, -1.95, facade, 2.86, 3.1, .07, '#a8b2c8', glass);
        box(scene, x + 1.5, 1.35, facade, 2.86, 2.6, .07, '#bdd0dc', glass);
      }
    }
    for (const y of [-3.52, -.46, 2.7]) box(scene, 0, y, facade, 42, .12, .18, frame);
  }

  for (const side of [-1, 1]) {
    box(scene, side * 4, .98, 0, .09, .09, 8, frame);
    box(scene, side * 4, .49, 0, .055, .94, 8, '#bdcccc', glass);
    box(scene, 0, .98, side * 4, 8, .09, .09, frame);
    box(scene, 0, .49, side * 4, 8, .94, .055, '#bdcccc', glass);
    for (const offset of [-4, -2, 0, 2, 4]) {
      box(scene, side * 4, .49, offset, .065, .98, .065, frame);
      box(scene, offset, .49, side * 4, .065, .98, .065, frame);
    }
  }

  box(scene, 0, -3.7, 0, 8, .32, 8, '#dedede');
  for (let step = 0; step < 20; step++) {
    const rise = (step + 1) * .175;
    box(scene, .8, -3.5 + rise / 2, -3.7 + step * .39, 2.2, rise, .39, '#e7e7e7');
  }

  function table(x, z, w, d, parent = scene) {
    box(parent, x, .79, z, w, .1, d, timber);
    for (const side of [-1, 1]) {
      box(parent, x + side * (w / 2 - .17), .38, z, .09, .77, d * .77, frame);
    }
  }

  function chair(x, z, facing, parent = scene) {
    box(parent, x, .42, z, .57, .11, chairPlacement.seatDepth, '#e9e9f0');
    box(parent, x, .66, z + facing * chairPlacement.backOffset, .57, .43, chairPlacement.backDepth, '#e9e9f0');
    box(parent, x, .2, z, .12, .4, .12, frame);
  }

  for (const { x, z, w, d, type } of workstations) {
    if (type === 'desk') {
      const cluster = new THREE.Group();
      cluster.position.set(x, 0, z);
      cluster.rotation.y = Math.PI / 2;
      scene.add(cluster);
      for (const row of deskRows) {
        for (const side of [-1, 1]) {
          table(row * w, side * d / 2, w - .025, d - .025, cluster);
          chair(row * w, side * chairPlacement.offset, side, cluster);
          box(cluster, row * w, 1.02, side * .09, .63, .38, .06, '#b5bac7');
        }
      }
      continue;
    }
    if (type === 'meeting' || type === 'booth') {
      box(scene, x, 1.04, z - d / 2, w + 1, 2.08, .12, wall);
      box(scene, x - (w + 1) / 2, 1.04, z, .12, 2.08, d, wall);
      box(scene, x + (w + 1) / 2, 1.04, z, .08, 2.08, d, '#b4c9d4', glass);
    }
    if (type === 'lounge') {
      box(scene, x, .3, z, w, .6, 1, '#c3cba7');
      box(scene, x, .69, z + .41, w, .5, .2, '#c3cba7');
      table(x, z - 1.25, 1.5, .65);
      continue;
    }

    table(x, z, w, type === 'meeting' ? 1.3 : .85);
    const seats = w > 3 ? [-1.2, 0, 1.2] : [0];
    for (const offset of seats) {
      chair(x + offset, z + .94, 1);
      if (type === 'meeting') chair(x + offset, z - .94, -1);
    }
  }

  const render = () => renderer.render(scene, camera);

  function resize() {
    const { clientWidth: w, clientHeight: h } = host;
    if (!w || !h) return;
    const aspect = w / h;
    const halfHeight = Math.max(23, 34 / aspect);
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
