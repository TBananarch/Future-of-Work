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
    const x = (cluster - (clusterCount - 1) / 2) * clusterPitch;
    const z = side * deskBandCenter;
    if (cluster === 3 || cluster === 7) {
      const type = cluster === 3 ? 'round-collab' : side < 0 ? 'huddle' : 'phone';
      workstations.push({ x, z, w: 2.8, d: 3.65, type, atriumSide: -side });
      continue;
    }
    workstations.push({ x, z, w: deskWidth, d: .75, type: 'desk' });
  }
  for (const [x, roomWidth] of [[-15, 6.2], [0, 5.4], [15, 6.2]]) {
    workstations.push({ x, z: side * meetingCenter, w: roomWidth, d: meetingDepth, type: 'meeting', atriumSide: -side });
  }
  workstations.push({ x: side * 8, z: 0, w: 3.8, d: 1.35, type: 'collaboration' });
  for (const z of [-6.2, 6.8]) {
    workstations.push({ x: side * 8, z, w: 3.5, d: 1.4, type: 'dynamic' });
  }
  for (const z of [-10.1, 10.25]) {
    workstations.push({ x: side * 8, z, w: 3.5, d: 1.4, type: 'dynamic' });
  }
  for (const z of [-3.65, 4.15]) {
    workstations.push({ x: side * 8.65, z, w: 4.4, d: .55, type: 'planter' });
  }
}

for (const x of [-9.9, -4.8, 4.8, 9.9]) {
  workstations.push({ x, z: -meetingCenter, w: 3.5, d: 1.4, type: 'dynamic' });
}

workstations.push(
  { x: -7.3, z: meetingCenter, w: 9.2, d: meetingDepth, type: 'library', atriumSide: -1 },
  { x: 5.6, z: 15.2, w: 1.35, d: 2.3, type: 'oval' },
  { x: 8.8, z: 15.2, w: 1.35, d: 2.3, type: 'oval' },
);

workstations.push(
  { x: 0, z: -9.65, w: 5.8, d: .85, type: 'kitchen' },
  { x: 0, z: 8.2, w: 5.3, d: 1.25, type: 'printing' },
  ...[-2.88, -.96, .96, 2.88].map(x => ({ x, z: -5.55, w: 1.9, d: .8, type: 'coffee' })),
);

// Rounded, softly scalloped bands follow the two rows of window seating.
const cloudHalfDepth = 2.43;
const cloudEnd = wingLength / 2 - cloudHalfDepth;
const cloudSide = Array.from({ length: 101 }, (_, index) => {
  const t = index / 100;
  return [-cloudEnd + 2 * cloudEnd * t, cloudHalfDepth - .25 * Math.sin(10 * Math.PI * t) ** 2];
});
const cloudCap = Array.from({ length: 21 }, (_, index) => {
  const angle = Math.PI * index / 20;
  return [cloudEnd + cloudHalfDepth * Math.sin(angle), cloudHalfDepth * Math.cos(angle)];
});
const daylightClouds = [-deskBandCenter, deskBandCenter].map(z => [
  ...cloudSide,
  ...cloudCap.slice(1, -1),
  ...cloudSide.map(([x, depth]) => [-x, -depth]),
  ...cloudCap.slice(1, -1).map(([x, depth]) => [-x, -depth]),
].map(([x, offset]) => [x, z + offset]));

const topicTitle = document.querySelector('#topic-title');
const topicDescription = document.querySelector('#topic-description');
const topics = [
  { title: topicTitle.textContent, description: topicDescription.innerHTML },
  { title: 'Dynamic Workstations', description: 'Everyone has different workstyle needs. Hybrid schedules mean headcounts fluctuate, so a mix of settings helps people find a place that suits the task and the day.' },
  { title: 'Adaptive Climate', description: 'Chilled beams above the window desks and radiant loops in the floor provide tighter cooling control. The center is heated and cooled by air. Arrows show air moving from the atrium to the floor edges, then turning toward the windows. Flexible settings can vary by an illustrative ±2 °C. <br><strong style="color:#236588">Blue · tighter control</strong><br><strong style="color:#895019">Light orange · lighter conditioning</strong>' },
];
let currentTopic = 0;
let officeView;
document.querySelector('#next-topic').addEventListener('click', () => {
  currentTopic = (currentTopic + 1) % topics.length;
  topicTitle.textContent = topics[currentTopic].title;
  topicDescription.innerHTML = topics[currentTopic].description;
  if (officeView) officeView.setTopic(currentTopic);
  else showPlan();
});

const host = document.querySelector('#model');
function showPlan() {
  const footprint = plates.map(({ x, z, w, d }) => `<rect x="${x-w/2}" y="${z-d/2}" width="${w}" height="${d}" fill="${currentTopic === 2 ? 'url(#climate-floor)' : '#fafafa'}"/>`).join('');
  const clouds = daylightClouds.map(points =>
    `<polygon points="${points.map(point => point.join(',')).join(' ')}" fill="#f1c319" fill-opacity=".34" stroke="none"/>`,
  ).join('');
  const furniture = workstations.map(({ x, z, w, d, type }) => {
    if (type === 'desk') {
      return deskRows.flatMap(row => [-1, 1].map(side =>
        `<rect x="${x + (side - 1) * d / 2}" y="${z + (row - .5) * w}" width="${d}" height="${w}" fill="#e0d6ba"/>`,
      )).join('');
    }
    if (type === 'round-collab') return `<circle cx="${x}" cy="${z}" r=".65" fill="#bb8e47"/>`;
    if (type === 'huddle' || type === 'phone') return `<rect x="${x-w/2}" y="${z-d/2}" width="${w}" height="${d}" fill="none"/>`;
    if (type === 'library') {
      return `<rect x="${x-w/2}" y="${z-d/2}" width="${w}" height="${d}" fill="none"/><rect x="${x-w/2+.35}" y="${z+d/2-.48}" width="${w-.7}" height=".35" fill="#c8b393"/><rect x="${x-1.9}" y="${z-.55}" width="3.8" height="1" fill="#e0d6ba"/>`;
    }
    if (type === 'collaboration') {
      return `<rect x="${x-w/2}" y="${z-d/2}" width="${w}" height="${d}" rx=".12" fill="#e0d6ba"/><rect x="${x-1.05}" y="${z-2.4}" width="2.1" height=".1" fill="#fff"/><circle cx="${x-1.65}" cy="${z+2.45}" r=".34" fill="#79833e"/><circle cx="${x+1.45}" cy="${z+2.65}" r=".34" fill="#79833e"/><circle cx="${x-.85}" cy="${z+2.75}" r=".24" fill="#e0d6ba"/><circle cx="${x+.7}" cy="${z+2.15}" r=".24" fill="#e0d6ba"/>`;
    }
    if (type === 'kitchen' || type === 'printing' || type === 'coffee') {
      return `<rect x="${x-w/2}" y="${z-d/2}" width="${w}" height="${d}" rx=".1" fill="#d8c5a0"/>`;
    }
    if (type === 'planter') {
      return `<rect x="${x-w/2}" y="${z-d/2}" width="${w}" height="${d}" rx=".08" fill="#87956a"/>`;
    }
    if (type === 'dynamic') {
      return `<rect x="${x-w/2}" y="${z-d/2}" width="${w}" height="${d}" rx=".08" fill="#a1a653"/><rect x="${x-.33}" y="${z-.12}" width=".66" height=".24" rx=".03" fill="#3d5361"/>`;
    }
    if (type === 'oval') {
      return `<ellipse cx="${x}" cy="${z}" rx="${w/2}" ry="${d/2}" fill="#e0d6ba"/>`;
    }
    if (type === 'meeting') {
      return `<rect x="${x-w/2}" y="${z-d/2}" width="${w}" height="${d}" fill="none"/><rect x="${x-1.8}" y="${z-.65}" width="3.6" height="1.3" fill="#e0d6ba"/>`;
    }
    return `<rect x="${x-w/2}" y="${z-.45}" width="${w}" height=".9" fill="#e0d6ba"/>`;
  }).join('');
  host.innerHTML = `<svg viewBox="-23 -26 46 52" role="img" aria-label="Office floor plan with two wings and a central atrium"><defs><linearGradient id="climate-floor" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="-24" y2="24"><stop offset="0" stop-color="#8abbd5"/><stop offset=".5" stop-color="#edc390"/><stop offset="1" stop-color="#8abbd5"/></linearGradient></defs><g stroke="#545563" stroke-width=".09">${footprint}${currentTopic === 0 ? clouds : ''}${furniture}</g>${currentTopic === 0 ? '<path d="M20.52 16v8 M20 16h1 M20 24h1" fill="none" stroke="#171717" stroke-width=".09"/><text x="19.95" y="20" text-anchor="end" fill="#171717" font-size=".8" font-family="Arial, sans-serif">≤ 8 m</text>' : ''}</svg>`;
}
try {
  const { createOffice } = await import('./office.js?v=climate-and-social');
  officeView = createOffice(host, { plates, workstations, chairPlacement, deskRows, meetingWallThickness, daylightClouds });
  officeView.setTopic(currentTopic);
  officeView.canvas.addEventListener('webglcontextlost', () => {
    officeView = undefined;
    showPlan();
  }, { once: true });
} catch {
  showPlan();
}
