const wingLength = 42;
const plates = [
  ...[-18, 18].map(z => ({ x: 0, z, w: wingLength, d: 12 })),
  ...[-8, 8].map(x => ({ x, z: 0, w: 8, d: 24 })),
  ...[-8, 8].map(z => ({ x: 0, z, w: 8, d: 8 })),
];
const chairPlacement = { offset: .94, seatDepth: .55, backOffset: .23, backDepth: .09 };
const chairReach = chairPlacement.offset + Math.max(chairPlacement.seatDepth / 2, chairPlacement.backOffset + chairPlacement.backDepth / 2);
const clusterPitch = 2 * chairReach + 1.6;
const clusterCount = Math.floor((wingLength - 1.6) / clusterPitch);
const deskRows = [-1, 0, 1];
const workstations = [];
for (const side of [-1, 1]) {
  for (let cluster = 0; cluster < clusterCount; cluster++) {
    workstations.push({ x: (cluster - (clusterCount - 1) / 2) * clusterPitch, z: side * 21.3, w: 1.45, d: .75, type: 'desk' });
  }
  for (const x of [-15, 15]) workstations.push({ x, z: side * 15.5, w: 4.8, d: 4.5, type: 'meeting' });
  workstations.push({ x: 0, z: side * 9, w: 3.8, d: 2, type: 'meeting' });
  workstations.push({ x: side * 8, z: -5, w: 2.2, d: 2.1, type: 'booth' });
  workstations.push({ x: side * 8, z: 0, w: 3.8, d: 2, type: 'lounge' });
  workstations.push({ x: side * 8, z: 6, w: 3.8, d: 2, type: 'touchdown' });
}

const host = document.querySelector('#model');
function showPlan() {
  const footprint = plates.map(({ x, z, w, d }) => `<rect x="${x-w/2}" y="${z-d/2}" width="${w}" height="${d}" fill="#fafafa"/>`).join('');
  const furniture = workstations.map(({ x, z, w, d, type }) => {
    if (type === 'desk') {
      return deskRows.flatMap(row => [-1, 1].map(side =>
        `<rect x="${x + (side - 1) * d / 2}" y="${z + (row - .5) * w}" width="${d}" height="${w}" fill="#faf9f5"/>`,
      )).join('');
    }
    return `<rect x="${x-w/2}" y="${z-.45}" width="${w}" height=".9" fill="#faf9f5"/>`;
  }).join('');
  host.innerHTML = `<svg viewBox="-23 -26 46 52" role="img" aria-label="Office floor plan with two wings and a central atrium"><g stroke="#92949e" stroke-width=".065">${footprint}${furniture}</g></svg>`;
}
try {
  const { createOffice } = await import('./office.js?v=daylight-base');
  const canvas = createOffice(host, { plates, workstations, chairPlacement, deskRows });
  canvas.addEventListener('webglcontextlost', showPlan, { once: true });
} catch {
  showPlan();
}
