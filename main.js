const width = 24;
const depth = 16;
const daylightDepth = 8;
const workstations = [
  ...[-8, -4, 0, 4, 8].map((x) => ({ x, z: -5, w: 2.6, d: 1.3, hours: 4, type: 'desk' })),
  { x: 8, z: -1.5, w: 2.6, d: 1.3, hours: 3, type: 'desk' },
  { x: -8, z: 4, w: 3.6, d: 3.4, hours: 1, type: 'booth', label: 'Focus booth' },
  { x: 0, z: 4, w: 5, d: 3.4, hours: 1, type: 'lounge', label: 'Informal seating' },
  { x: 8, z: 4, w: 4, d: 2.6, hours: 2, type: 'touchdown', label: 'Touchdown desk' },
];
const flexible = workstations.filter((station) => station.label);
const tight = workstations.filter((station) => station.hours > 2);
const themes = { daylight: '#e7be59', choice: '#83ae83', tight: '#6fa1bd', adaptive: '#db9f76' };
const zone = (x, z, w, d, color) => ({ x, z, w, d, color });
const topics = [
  {
    title: 'Daylighting',
    description: 'Give daylight priority to the desks people use longest. Every workstation intended for more than 3 hours sits within 8 m of the glazed façade, measured in plan.',
    legend: [[themes.daylight, '8 m from glazing', 'The shaded band marks the daylight design criterion.']],
    zones: [zone(0, -depth / 2 + daylightDepth / 2, width, daylightDepth, themes.daylight)],
    labels: [{ x: -10.5, z: -4, text: '8 m from glazing' }],
  },
  {
    title: 'Dynamic Workstations',
    description: 'Match the setting to the task. Shorter stays can move between enclosed, informal, and open work settings as the day changes.',
    legend: [[themes.choice, 'Focus booth', 'Take a private call.'], [themes.choice, 'Informal seating', 'Have a quick conversation.'], [themes.choice, 'Touchdown desk', 'Work briefly between meetings.']],
    zones: flexible.map(({ x, z, w, d }) => zone(x, z, w + 1, d + 1, themes.choice)),
    labels: flexible.map(({ x, z, label }) => ({ x, z, text: label })),
  },
  {
    title: 'Adaptive Climate',
    description: 'Set the cooling strategy around how long people stay. Desks intended for more than 2 hours receive tighter cooling control, while flexible settings can vary within an illustrative ±2 °C band.',
    legend: [[themes.tight, 'Tighter cooling · >2 h', 'Prioritize stable conditions for longer sessions.'], [themes.adaptive, 'Adaptive zone · ±2 °C', 'Allow variation around the zone setpoint.']],
    zones: [...tight.map(({ x, z, w, d }) => zone(x, z, w + 1, d + 1.4, themes.tight)), zone(0, 4, 23, 5.6, themes.adaptive)],
    labels: [{ x: 0, z: -5, text: 'Tighter cooling · >2 h' }, { x: 0, z: 4, text: 'Adaptive zone · ±2 °C' }],
  },
];

const plan = document.querySelector('#plan');
const model = document.querySelector('#model');
const hint = document.querySelector('#view-hint');
let active = 0;
let sceneView;

function drawPlan(topic) {
  const rectangle = ({ x, z, w, d, color }, opacity = 1) =>
    `<rect x="${x - w / 2}" y="${z - d / 2}" width="${w}" height="${d}" fill="${color}" opacity="${opacity}"/>`;
  plan.innerHTML = `<svg viewBox="-13 -10 26 20" role="img" aria-label="${topic.title} floor plan">
    ${rectangle(zone(0, 0, width, depth, '#f9f7ef'))}
    ${topic.zones.map((item) => rectangle(item, .62)).join('')}
    ${workstations.map((station) => rectangle({ ...station, color: '#61746a' })).join('')}
    <rect x="-12" y="-8" width="24" height="16" fill="none" stroke="#54685b" stroke-width=".1"/>
    <path d="M-12 -8H12" stroke="#4e8296" stroke-width=".3"/>
    <text x="0" y="-8.6" text-anchor="middle" font-size=".6" fill="#354b40">Glazed façade</text>
    ${active === 0 ? '<path d="M-11 -8V0 M-11.4 -8h.8 M-11.4 0h.8" fill="none" stroke="#53624f" stroke-width=".1"/>' : ''}
    ${topic.labels.map(({ x, z, text }) => `<text x="${active === 0 ? -10.6 : x}" y="${active === 0 ? z : z + 2.5}" text-anchor="${active === 0 ? 'start' : 'middle'}" font-size=".56" fill="#24352b">${text}</text>`).join('')}
  </svg>`;
}

function showTopic() {
  const topic = topics[active];
  document.querySelector('#position').textContent = `Topic ${active + 1} of ${topics.length}`;
  document.querySelector('#topic-title').textContent = topic.title;
  document.querySelector('#description').textContent = topic.description;
  document.querySelector('#legend').innerHTML = topic.legend.map(([color, name, detail]) =>
    `<li><i aria-hidden="true" style="--swatch:${color}"></i><div><strong>${name}</strong>${detail}</div></li>`).join('');
  drawPlan(topic);
  sceneView?.show(topic);
}

document.querySelector('#next').addEventListener('click', () => {
  active = (active + 1) % topics.length;
  showTopic();
});
showTopic();

async function loadModel() {
  const { createOffice } = await import('./office.js');
  sceneView = createOffice(model, { width, depth, daylightDepth, workstations, daylight: topics[0] });
  sceneView.show(topics[active]);
  model.hidden = false;
  plan.hidden = true;
  hint.textContent = 'Drag to orbit · Scroll or pinch to zoom';
  sceneView.resize();
  model.querySelector('canvas').addEventListener('webglcontextlost', () => {
    sceneView = undefined;
    model.hidden = true;
    plan.hidden = false;
    hint.textContent = 'Floor plan';
  }, { once: true });
}

loadModel().catch(() => {
  sceneView = undefined;
  model.hidden = true;
  plan.hidden = false;
  hint.textContent = 'Floor plan';
});
