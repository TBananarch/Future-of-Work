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
const deskWidth = 1.45;
const deskBandCenter = 21.3;
const meetingDepth = 4.2;
const meetingWallThickness = .12;
const circulationWidth = 2;
const deskBandInnerEdge = deskBandCenter - deskWidth * deskRows.length / 2;
const meetingCenter = deskBandInnerEdge - circulationWidth - (meetingDepth + meetingWallThickness) / 2;
const workstations = [];
for (const side of [-1, 1]) {
  for (let cluster = 0; cluster < clusterCount; cluster++) {
    workstations.push({ x: (cluster - (clusterCount - 1) / 2) * clusterPitch, z: side * deskBandCenter, w: deskWidth, d: .75, type: 'desk' });
  }
  for (const [x, roomWidth] of [[-15, 6.2], [0, 5.4], [15, 6.2]]) {
    workstations.push({ x, z: side * meetingCenter, w: roomWidth, d: meetingDepth, type: 'meeting', atriumSide: -side });
  }
  workstations.push({ x: side * 8, z: -5, w: 2.2, d: 2.1, type: 'booth' });
  workstations.push({ x: side * 8, z: 0, w: 3.8, d: 1.35, type: 'collaboration' });
  workstations.push({ x: side * 8, z: 6, w: 3.8, d: 2, type: 'touchdown' });
}

workstations.push(
  { x: -7.3, z: meetingCenter, w: 9.2, d: meetingDepth, type: 'library', atriumSide: -1 },
  { x: 5.6, z: 15.2, w: 1.35, d: 2.3, type: 'oval' },
  { x: 8.8, z: 15.2, w: 1.35, d: 2.3, type: 'oval' },
);

const host = document.querySelector('#model');
function showPlan() {
  const footprint = plates.map(({ x, z, w, d }) => `<rect x="${x-w/2}" y="${z-d/2}" width="${w}" height="${d}" fill="#fafafa"/>`).join('');
  const furniture = workstations.map(({ x, z, w, d, type }) => {
    if (type === 'desk') {
      return deskRows.flatMap(row => [-1, 1].map(side =>
        `<rect x="${x + (side - 1) * d / 2}" y="${z + (row - .5) * w}" width="${d}" height="${w}" fill="#faf9f5"/>`,
      )).join('');
    }
    if (type === 'meeting') {
      if (type === 'library') {
      return `<rect x="${x-w/2}" y="${z-d/2}" width="${w}" height="${d}" fill="none"/><rect x="${x-w/2+.35}" y="${z+d/2-.48}" width="${w-.7}" height=".35" fill="#dbd4c9"/><rect x="${x-1.9}" y="${z-.55}" width="3.8" height="1" fill="#faf9f5"/>`;
    }
    if (type === 'collaboration') {
      return `<rect x="${x-w/2}" y="${z-d/2}" width="${w}" height="${d}" rx=".12" fill="#faf9f5"/><rect x="${x-1.05}" y="${z-2.4}" width="2.1" height=".1" fill="#fff"/><circle cx="${x-1.65}" cy="${z+2.45}" r=".34" fill="#c3cba7"/><circle cx="${x+1.45}" cy="${z+2.65}" r=".34" fill="#c3cba7"/><circle cx="${x-.85}" cy="${z+2.75}" r=".24" fill="#faf9f5"/><circle cx="${x+.7}" cy="${z+2.15}" r=".24" fill="#faf9f5"/>`;
    }
    if (type === 'oval') {
      return `<ellipse cx="${x}" cy="${z}" rx="${w/2}" ry="${d/2}" fill="#faf9f5"/>`;
    }
    return `<rect x="${x-w/2}" y="${z-d/2}" width="${w}" height="${d}" fill="none"/><rect x="${x-1.8}" y="${z-.65}" width="3.6" height="1.3" fill="#faf9f5"/>`;
    }
    return `<rect x="${x-w/2}" y="${z-.45}" width="${w}" height=".9" fill="#faf9f5"/>`;
  }).join('');
  host.innerHTML = `<svg viewBox="-23 -26 46 52" role="img" aria-label="Office floor plan with two wings and a central atrium"><g stroke="#92949e" stroke-width=".065">${footprint}${furniture}</g></svg>`;
}
try {
  const { createOffice } = await import('./office.js?v=glazed-furniture');
  const canvas = createOffice(host, { plates, workstations, chairPlacement, deskRows, meetingWallThickness });
  canvas.addEventListener('webglcontextlost', showPlan, { once: true });
} catch {
  showPlan();
}
