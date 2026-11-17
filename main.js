const plates = [
  ...[-18, 18].map(z => ({ x: 0, z, w: 42, d: 12, color: '#e6edf5' })),
  ...[-8, 8].map(x => ({ x, z: 0, w: 8, d: 24, color: '#e5edc8' })),
  ...[-8, 8].map(z => ({ x: 0, z, w: 8, d: 8, color: '#e5edc8' })),
];
const workstations = [];
for (const side of [-1, 1]) {
  for (const x of [-17, -11, -5, 2, 9, 16]) {
    workstations.push({ x, z: side * 21.5, w: 3.8, d: 2, type: 'desk' });
  }
  for (const x of [-15, 15]) workstations.push({ x, z: side * 15.5, w: 4.8, d: 4.5, type: 'meeting' });
  workstations.push({ x: 0, z: side * 9, w: 3.8, d: 2, type: 'meeting' });
  workstations.push({ x: side * 8, z: -5, w: 2.2, d: 2.1, type: 'booth' });
  workstations.push({ x: side * 8, z: 0, w: 3.8, d: 2, type: 'lounge' });
  workstations.push({ x: side * 8, z: 6, w: 3.8, d: 2, type: 'touchdown' });
}

const host = document.querySelector('#model');
function showPlan() {
  const footprint = plates.map(({ x, z, w, d, color }) => `<rect x="${x-w/2}" y="${z-d/2}" width="${w}" height="${d}" fill="${color}"/>`).join('');
  const furniture = workstations.map(({ x, z, w }) => `<rect x="${x-w/2}" y="${z-.45}" width="${w}" height=".9" fill="#faf9f5"/>`).join('');
  host.innerHTML = `<svg viewBox="-23 -26 46 52" role="img" aria-label="Office floor plan with two wings and a central atrium"><g stroke="#92949e" stroke-width=".065">${footprint}${furniture}</g></svg>`;
}
try {
  const { createOffice } = await import('./office.js?v=neighborhoods');
  const canvas = createOffice(host, { plates, workstations });
  canvas.addEventListener('webglcontextlost', showPlan, { once: true });
} catch {
  showPlan();
}
