// The map: five states, their towns, and the dates that change them.
// Turn 0 is May 1933; turn 19 is December 1934.

export const START = { year: 1933, month: 4 }; // month is 0-based: 4 = May
export const TURNS = 20;
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function dateOf(t) {
  const m = START.month + t;
  return { year: START.year + Math.floor(m / 12), month: m % 12 };
}
export function dateName(t) { const d = dateOf(t); return `${MONTHS[d.month]} ${d.year}`; }
/** Turn number of a calendar month (month 0-based). */
export function turnOf(year, month) { return (year - START.year) * 12 + month - START.month; }

// radioFrom: the turn police radio covers the state's roads. GAME ASSUMPTION, not
// sourced history: Chicago had radio cars before 1933; the rest are spread across
// the period so the map changes under the player.
export const STATES = [
  { id: 'in', name: 'Indiana', radioFrom: turnOf(1934, 0), sympathy: 60 },
  { id: 'il', name: 'Illinois', radioFrom: 0, sympathy: 50 },
  { id: 'oh', name: 'Ohio', radioFrom: turnOf(1933, 10), sympathy: 55 },
  { id: 'wi', name: 'Wisconsin', radioFrom: turnOf(1934, 5), sympathy: 55 },
  { id: 'mn', name: 'Minnesota', radioFrom: turnOf(1934, 3), sympathy: 50 },
];

export const LINES = [['in', 'il'], ['in', 'oh'], ['il', 'wi'], ['wi', 'mn']];
export const neighbours = (id) => LINES.flatMap(([a, b]) => (a === id ? [b] : b === id ? [a] : []));

// Banks. cash: what the vault usually holds (1933 dollars). Real hauls for scale:
// New Carlisle, Ohio, June 1933, about $10,000; Greencastle, Indiana, Oct 1933,
// about $75,000; Mason City, Iowa, March 1934, about $52,000.
export const TOWNS = [
  { id: 'greencastle', name: 'Greencastle', state: 'in', cash: 30000, guard: 1 },
  { id: 'daleville', name: 'Daleville', state: 'in', cash: 4000, guard: 0 },
  { id: 'montpelier', name: 'Montpelier', state: 'in', cash: 9000, guard: 0 },
  { id: 'eastchicago', name: 'East Chicago', state: 'in', cash: 20000, guard: 2 },
  { id: 'chicago', name: 'Chicago', state: 'il', cash: 40000, guard: 3, city: true },
  { id: 'rockford', name: 'Rockford', state: 'il', cash: 12000, guard: 1 },
  { id: 'newcarlisle', name: 'New Carlisle', state: 'oh', cash: 8000, guard: 0 },
  { id: 'bluffton', name: 'Bluffton', state: 'oh', cash: 6000, guard: 0 },
  { id: 'lima', name: 'Lima', state: 'oh', cash: 14000, guard: 1 },
  { id: 'racine', name: 'Racine', state: 'wi', cash: 25000, guard: 2 },
  { id: 'sheboygan', name: 'Sheboygan', state: 'wi', cash: 10000, guard: 1 },
  { id: 'stpaul', name: 'St. Paul', state: 'mn', cash: 30000, guard: 2, city: true },
  { id: 'southstpaul', name: 'South St. Paul', state: 'mn', cash: 20000, guard: 1 },
  { id: 'mankato', name: 'Mankato', state: 'mn', cash: 8000, guard: 0 },
];
