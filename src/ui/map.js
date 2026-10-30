// The map: six states laid out roughly as they lie, the lines between them, the
// banks, home, heat, police radio and St. Paul. Colours are inline fills from the
// CSS variables (Dead or Alive's map text vanished when page CSS overrode SVG fills).
import { STATES, TOWNS, LINES } from '../data/world.data.js';
import { radioIn, stPaulHolds } from '../engine/odds.js';

const BOX = {
  mn: [4, 6, 104, 126], wi: [114, 6, 90, 126], ia: [4, 138, 104, 96],
  il: [114, 138, 78, 148], in: [198, 150, 80, 128], oh: [284, 140, 76, 112],
};
const centre = (id) => { const [x, y, w, h] = BOX[id]; return [x + w / 2, y + h / 2]; };

/** Town dots stacked down each state's box, label to the right: nothing leaves its box. */
function townPoints() {
  const pts = {};
  for (const st of STATES) {
    const [x, y] = BOX[st.id];
    TOWNS.filter((t) => t.state === st.id).forEach((t, i) => { pts[t.id] = [x + 9, y + 40 + i * 20]; });
  }
  return pts;
}

export function mapSvg(s, { pick = null } = {}) {
  const pts = townPoints();
  const lines = LINES.map(([a, b]) => {
    const [x1, y1] = centre(a), [x2, y2] = centre(b);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:var(--rule-2);stroke-width:1.5;stroke-dasharray:4 4"/>`;
  }).join('');
  const states = STATES.map((st) => {
    const [x, y, w, h] = BOX[st.id];
    const heat = s.heat[st.id] / 100;
    const home = s.at === st.id;
    const marks = [radioIn(s, st.id) ? 'radio' : '', stPaulHolds(s, st.id) ? 'shelter' : ''].filter(Boolean).join(' · ');
    return `<g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" style="fill:var(--surface);stroke:${home ? 'var(--ink)' : 'var(--rule-2)'};stroke-width:${home ? 3 : 1}"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" style="fill:var(--blood);opacity:${(heat * 0.45).toFixed(2)}"/>
      <text x="${x + 6}" y="${y + 15}" style="fill:var(--ink);font:600 10px var(--ui);text-transform:uppercase;letter-spacing:.04em">${st.name}</text>${home ? `<text x="${x + 6}" y="${y + 26}" style="fill:var(--blood);font:600 9px var(--ui);text-transform:uppercase">home</text>` : ''}
      ${marks ? `<text x="${x + 6}" y="${y + h - 6}" style="fill:var(--ink-3);font:10px var(--ui)">${marks}</text>` : ''}
    </g>`;
  }).join('');
  const towns = TOWNS.map((t) => {
    const [x, y] = pts[t.id];
    const robbed = s.robbed[t.id] != null;
    const chosen = pick === t.id;
    return `<g><circle cx="${x}" cy="${y}" r="${chosen ? 5 : 3.2}" style="fill:${chosen ? 'var(--blood)' : robbed ? 'var(--ink-3)' : 'var(--ink)'}"/>
      <text x="${x + 6}" y="${y + 3.5}" style="fill:var(--ink-2);font:9.5px var(--ui)">${t.name}</text></g>`;
  }).join('');
  return `<svg class="map" viewBox="0 0 362 290" role="img" aria-label="Map of the six states">${lines}${states}${towns}</svg>`;
}
