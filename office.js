import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createOffice(host, { plates, workstations, chairPlacement, deskRows, meetingWallThickness, daylightClouds }) {
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

  const outline = new THREE.LineBasicMaterial({ color: '#444653', transparent: true, opacity: .76 });
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
  const frame = '#858693';
  const timber = '#e0d6ba';
  const glass = { transparent: true, opacity: .16, depthWrite: false };

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

  const workstationBlue = '#85b5c3';
  const oak = '#a38763';

  function furnitureSurface(parent, x, y, z, w, h, d, color) {
    const geometry = new RoundedBoxGeometry(w, h, d, 2, Math.min(h / 2, .055));
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color }));
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function furnitureLeg(parent, x, z, height, radius, splayX, splayZ) {
    const foot = new THREE.Vector3(x + splayX, .025, z + splayZ);
    const top = new THREE.Vector3(x, height, z);
    const axis = top.clone().sub(foot);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * .62, axis.length(), 8),
      new THREE.MeshBasicMaterial({ color: oak }));
    leg.position.copy(foot).addScaledVector(axis, .5);
    leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
    parent.add(leg);
  }

  function table(x, z, w, d, parent = scene, color = timber) {
    furnitureSurface(parent, x, .79, z, w, .085, d, color);
    for (const side of [-1, 1]) {
      for (const end of [-1, 1]) {
        furnitureLeg(parent, x + side * (w / 2 - .18), z + end * (d / 2 - .13), .75, .038, side * .07, end * .055);
      }
    }
  }

  function chair(x, z, facing, parent = scene, color = '#a4a572') {
    furnitureSurface(parent, x, .45, z, .57, .095, chairPlacement.seatDepth, color);
    furnitureSurface(parent, x, .67, z + facing * chairPlacement.backOffset,
      .55, .39, chairPlacement.backDepth, color);
    for (const side of [-1, 1]) {
      for (const end of [-1, 1]) {
        furnitureLeg(parent, x + side * .19, z + end * .17, .41, .024, side * .04, end * .05);
      }
    }
  }

  for (const { x, z, w, d, type, atriumSide } of workstations) {
    if (type === 'desk') {
      const cluster = new THREE.Group();
      cluster.position.set(x, 0, z);
      cluster.rotation.y = Math.PI / 2;
      scene.add(cluster);
      for (const row of deskRows) {
        for (const side of [-1, 1]) {
          table(row * w, side * d / 2, w - .025, d - .025, cluster, workstationBlue);
          chair(row * w, side * chairPlacement.offset, side, cluster, '#487f93');
          box(cluster, row * w, 1.02, side * .09, .63, .38, .06, '#b5bac7');
        }
      }
      continue;
    }
    if (type === 'meeting' || type === 'library') {
      const front = z + atriumSide * d / 2;
      const rear = z - atriumSide * d / 2;
      const roomHeight = 2.65;
      const doorWidth = 1.05;
      const glassWidth = (w - doorWidth) / 2;
      box(scene, x, roomHeight / 2, rear, w, roomHeight, meetingWallThickness, '#b4c9d4', glass);
      box(scene, x, roomHeight - .06, rear, w, .12, .12, frame);
      box(scene, x, roomHeight - .06, front, w, .12, .12, frame);
      for (const side of [-1, 1]) {
        const end = x + side * w / 2;
        // The adjacent meeting rooms provide the library's shared glass partitions.
        if (type !== 'library') {
          box(scene, end, roomHeight / 2, z, .08, roomHeight, d, '#b4c9d4', glass);
          box(scene, end, roomHeight - .06, z, .12, .12, d, frame);
          box(scene, end, roomHeight / 2, rear, .08, roomHeight, .12, frame);
          box(scene, end, roomHeight / 2, front, .08, roomHeight, .12, frame);
        }
        box(scene, x + side * (doorWidth / 2 + glassWidth / 2), roomHeight / 2, front, glassWidth, roomHeight, .08, '#b4c9d4', glass);
        box(scene, x + side * doorWidth / 2, roomHeight / 2, front, .08, roomHeight, .12, frame);
      }
      if (type === 'library') {
        const shelves = rear + atriumSide * .28;
        const shelfWidth = w - .7;
        const wood = '#c8b393';
        box(scene, x, .94, shelves - atriumSide * .15, shelfWidth, 1.88, .09, wood);
        for (const height of [.13, .56, .99, 1.42, 1.85]) {
          box(scene, x, height, shelves, shelfWidth, .045, .38, wood);
        }
        for (const edge of [-1, -.5, 0, .5, 1]) box(scene, x + edge * shelfWidth / 2, .95, shelves, .055, 1.85, .38, wood);
        const bookColors = ['#8d9c9b', '#b39483', '#a4aa90', '#c5b59f', '#8b8ba4'];
        for (let bay = 0; bay < 4; bay++) {
          for (let level = 0; level < 4; level++) {
            for (let book = 0; book < 8; book++) {
              const bookHeight = .2 + ((book + level + bay) % 4) * .035;
              box(scene, x - shelfWidth / 2 + bay * shelfWidth / 4 + .14 + book * .18,
                .155 + level * .43 + bookHeight / 2, shelves, .12, bookHeight, .24,
                bookColors[(book + 2 * level + bay) % bookColors.length], {}, false);
            }
          }
        }
        const readingZ = z + atriumSide * .68;
        table(x, readingZ, 3.8, 1, scene, '#c6a36d');
        for (const offset of [-1.25, 0, 1.25]) chair(x + offset, readingZ - atriumSide * .89, -atriumSide);
        continue;
      }
      table(x, z, 3.6, 1.3, scene, '#d8c5a0');
      for (const offset of [-1.2, 0, 1.2]) {
        chair(x + offset, z + .98, 1);
        chair(x + offset, z - .98, -1);
      }
      continue;
    }
    if (type === 'kitchen' || type === 'printing') {
      const kitchen = type === 'kitchen';
      const cabinetColor = kitchen ? '#87916a' : '#aa7474';
      const cabinetWidth = w / 4;
      for (let bay = 0; bay < 4; bay++) {
        const cabinetX = x + (bay - 1.5) * cabinetWidth;
        furnitureSurface(scene, cabinetX, .48, z, cabinetWidth - .04, .76, d - .08, cabinetColor);
        box(scene, cabinetX, .72, z + (d - .06) / 2, .23, .024, .04, '#665e50');
      }
      furnitureSurface(scene, x, .91, z, w, .09, d, '#d8c5a0');

      if (kitchen) {
        furnitureSurface(scene, x - 1.8, .958, z, .68, .018, .47, '#839398');
        box(scene, x - 1.8, 1.08, z - .21, .045, .24, .045, '#66797b');
        box(scene, x - 1.8, 1.2, z - .14, .045, .045, .18, '#66797b');
        furnitureSurface(scene, x + 1.4, 1.2, z - .06, .85, .49, .54, '#3d5361');
        box(scene, x + 1.4, 1.16, z + .218, .54, .17, .02, '#8d9c9b');
        box(scene, x + 1.4, 1.02, z + .22, .65, .05, .22, '#6b7f86');
        for (const offset of [0, .23, .46]) {
          const cup = new THREE.Mesh(new THREE.CylinderGeometry(.075, .055, .13, 16),
            new THREE.MeshBasicMaterial({ color: '#f3ead8' }));
          cup.position.set(x + 2.08 + offset, 1.02, z + .1);
          scene.add(cup);
        }
      } else {
        for (const offset of [-1.68, -.56]) {
          furnitureSurface(scene, x + offset, 1.18, z, .86, .45, .83, '#e4e5df');
          box(scene, x + offset, 1.21, z + .423, .58, .095, .018, '#3d5361');
          box(scene, x + offset, 1.407, z, .61, .02, .54, '#a7aead');
          box(scene, x + offset, 1.164, z + .49, .33, .018, .28, '#ffffff');
        }
        furnitureSurface(scene, x + .65, 1.03, z, .72, .14, .58, '#5b777a');
        box(scene, x + .65, 1.13, z, .61, .065, .11, '#323d43');
        const lever = box(scene, x + .96, 1.27, z - .04, .045, .06, .49, '#323d43');
        lever.rotation.x = -.65;
        for (const [index, offset] of [1.45, 1.95].entries()) {
          box(scene, x + offset, 1.015 + index * .02, z + .12, .42, .12 + index * .04, .46, '#f5f1e7');
        }
      }
      continue;
    }
    if (type === 'coffee') {
      const top = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .055, 30),
        new THREE.MeshBasicMaterial({ color: '#c6a36d' }));
      top.position.set(x, .42, z);
      scene.add(top);
      furnitureLeg(scene, x, z, .4, .065, 0, 0);
      for (const side of [-1, 1]) {
        const seat = new THREE.Group();
        seat.position.set(x + side * .65, 0, z);
        seat.rotation.y = Math.PI / 2;
        seat.scale.set(1, .8, 1);
        scene.add(seat);
        chair(0, 0, side, seat, side === -1 ? '#aa7474' : '#398298');
      }
      continue;
    }
    if (type === 'planter') {
      furnitureSurface(scene, x, .22, z, w, .44, d, '#b6a48b');
      furnitureSurface(scene, x, .446, z, w - .12, .025, d - .12, '#594d3c');
      const leafColors = ['#72804d', '#8d975e', '#526440'];
      for (let tuft = 0; tuft < 17; tuft++) {
        for (let blade = 0; blade < 3; blade++) {
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 5),
            new THREE.MeshBasicMaterial({ color: leafColors[(tuft + blade) % leafColors.length] }));
          leaf.scale.set(.085, .17 + (tuft % 3) * .025, .07);
          leaf.position.set(x + (tuft - 8) * .24 + (blade - 1) * .059, .54, z + (blade - 1) * .11);
          leaf.rotation.z = (blade - 1) * .55;
          scene.add(leaf);
        }
      }
      continue;
    }
    if (type === 'dynamic') {
      table(x, z, w, d, scene, '#a1a653');
      for (const offset of [-1.1, 0, 1.1]) {
        chair(x + offset, z + 1.04, 1, scene, '#626e37');
        chair(x + offset, z - 1.04, -1, scene, '#626e37');
      }

      furnitureSurface(scene, x, .86, z, .76, .07, .31, '#3d5361');
      for (const side of [-1, 1]) {
        for (const offset of [-.2, .2]) {
          box(scene, x + offset, .897, z + side * .069, .13, .008, .105, '#e8edf0', {}, false);
          for (const slot of [-.024, .024]) {
            box(scene, x + offset + slot, .904, z + side * .069, .014, .005, .048, '#263640', {}, false);
          }
        }
      }
      continue;
    }
    if (type === 'oval') {
      const top = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .09, 40),
        new THREE.MeshBasicMaterial({ color: '#a8aa5e' }));
      top.add(new THREE.LineSegments(new THREE.EdgesGeometry(top.geometry), outline));
      top.scale.set(w / 2, 1, d / 2);
      top.position.set(x, .79, z);
      scene.add(top);
      for (const side of [-1, 1]) furnitureLeg(scene, x, z + side * .64, .75, .055, 0, side * .13);
      for (const side of [-1, 1]) {
        const seat = new THREE.Group();
        seat.position.set(x + side * .98, 0, z);
        seat.rotation.y = Math.PI / 2;
        scene.add(seat);
        chair(0, 0, side, seat);
      }
      continue;
    }
    if (type === 'collaboration') {
      table(x, z, w, d, scene, '#bb8e47');
      const colors = ['#aa7474', '#398298', '#79833e'];
      for (const [index, offset] of [-1.2, 0, 1.2].entries()) {
        chair(x + offset, z + 1.03, 1, scene, colors[index]);
        chair(x + offset, z - 1.03, -1, scene, colors[2 - index]);
      }

      const boardZ = z - 2.35;
      box(scene, x, 1.35, boardZ, 2.1, 1.12, .08, '#ffffff');
      for (const offset of [-.92, .92]) {
        box(scene, x + offset, .55, boardZ, .07, 1.1, .08, frame);
        box(scene, x + offset, .05, boardZ, .1, .1, .54, frame);
      }
      box(scene, x, .79, boardZ + .065, 2.04, .04, .15, frame);

      function roundPiece(offsetX, offsetZ, radius, height, base, color) {
        const piece = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 24),
          new THREE.MeshBasicMaterial({ color }));
        piece.add(new THREE.LineSegments(new THREE.EdgesGeometry(piece.geometry), outline));
        piece.position.set(x + offsetX, base + height / 2, z + offsetZ);
        scene.add(piece);
      }

      roundPiece(-1.65, 2.45, .34, .42, 0, '#ab6950');
      roundPiece(1.45, 2.65, .34, .42, 0, '#b88c91');
      for (const [offsetX, offsetZ] of [[-.85, 2.75], [.7, 2.15]]) {
        roundPiece(offsetX, offsetZ, .24, .055, .47, '#c3a553');
        roundPiece(offsetX, offsetZ, .075, .47, 0, frame);
      }
      continue;
    }

    table(x, z, w, .85);
    const seats = w > 3 ? [-1.2, 0, 1.2] : [0];
    for (const offset of seats) {
      chair(x + offset, z + .94, 1);
    }
  }

  for (const points of daylightClouds) {
    const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)));
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: .95,
      bevelEnabled: true,
      bevelThickness: .35,
      bevelSize: .27,
      bevelSegments: 5,
    });
    const cloud = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: '#f1c319',
      opacity: .26,
      transparent: true,
      depthWrite: false,
    }));
    cloud.rotation.x = -Math.PI / 2;
    cloud.position.y = .38;
    scene.add(cloud);
  }

  // Dimension the maximum setback from the window at z = 24 m.
  const dimensionX = 20.52;
  const windowZ = 24;
  const innerZ = windowZ - 8;
  const dimensionMidpoint = (windowZ + innerZ) / 2;
  const dimensionInk = '#171717';
  box(scene, dimensionX, .046, dimensionMidpoint, .055, .013, windowZ - innerZ, dimensionInk, {}, false);
  for (const end of [innerZ, windowZ]) {
    box(scene, dimensionX, .045, end, 1.02, .018, .055, dimensionInk, {}, false);
    const tick = box(scene, dimensionX, .048, end, .36, .016, .047, dimensionInk, {}, false);
    tick.rotation.y = Math.PI / 4;
  }

  const dimensionCanvas = document.createElement('canvas');
  dimensionCanvas.width = 384;
  dimensionCanvas.height = 144;
  const context = dimensionCanvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(8, 22, 368, 100);
  context.fillStyle = dimensionInk;
  context.font = 'bold 76px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('≤ 8 m', 192, 74);
  const dimensionTexture = new THREE.CanvasTexture(dimensionCanvas);
  dimensionTexture.colorSpace = THREE.SRGBColorSpace;
  const dimensionLabel = new THREE.Sprite(new THREE.SpriteMaterial({ map: dimensionTexture, depthTest: false, depthWrite: false }));
  dimensionLabel.position.set(dimensionX + 1.15, .12, dimensionMidpoint);
  dimensionLabel.scale.set(3.1, 1.16, 1);
  dimensionLabel.renderOrder = 5;
  scene.add(dimensionLabel);

  const render = () => renderer.render(scene, camera);

  function resize() {
    const { clientWidth: w, clientHeight: h } = host;
    if (!w || !h) return;
    const aspect = w / h;
    const halfHeight = Math.max(24, 34 / aspect);
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
