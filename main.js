const width = 24;
const depth = 20;
const workstations = [
  ...[-8, -4, 0, 4, 8].map((x) => ({ x, z: -7, w: 2.6, d: 1.3, hours: 4, type: 'desk' })),
  { x: 8, z: -1.5, w: 2.6, d: 1.3, hours: 3, type: 'desk' },
  { x: -8, z: 4, w: 3.6, d: 3.4, hours: 1, type: 'booth', label: 'Focus booth' },
  { x: 0, z: 4, w: 5, d: 3.4, hours: 1, type: 'lounge', label: 'Informal seating' },
  { x: 8, z: 4, w: 4, d: 2.6, hours: 2, type: 'touchdown', label: 'Touchdown desk' },
];
const host = document.querySelector('#model');

function showPlan() {
  const furniture = workstations.map(({ x, z, w, d, type }) =>
    `<rect x="${x - w / 2}" y="${z - d / 2}" width="${w}" height="${d}" rx=".15" fill="${type === 'desk' ? '#fff' : '#e5d1b7'}"/>`,
  ).join('');
  host.innerHTML = `<svg viewBox="-13 -11 26 27" role="img" aria-label="Office floor plan, 20 meters from exterior glazing to atrium edge">
    <g stroke="#424342" stroke-width=".07">
      <rect x="-12" y="-10" width="24" height="20" fill="#f8f6f0"/>
      <path d="M-12 10V16 M12 10V16 M-12 16H12" fill="none" stroke-dasharray=".2 .2"/>
      <path d="M-12 10H12" stroke="#565c5a" stroke-width=".16"/>
      ${furniture}
      <path d="M-12 -10H12" stroke="#769191" stroke-width=".19"/>
    </g>
  </svg>`;
}

try {
  const { createOffice } = await import('./office.js?v=atrium');
  const canvas = createOffice(host, { width, depth, workstations });
  canvas.addEventListener('webglcontextlost', showPlan, { once: true });
} catch {
  showPlan();
}
