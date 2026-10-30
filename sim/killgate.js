// The kill gate: do the period's decisions matter? Numbers only, before any
// screens. Same seeds for every policy; every gap printed with its noise floor.
//   node sim/killgate.js [runs=400]
import { compare, noiseFloor } from './stats.js';
import { playGame } from './bot.js';

const runs = Number(process.argv[2] || 400);
const seeds = Array.from({ length: runs }, (_, i) => 1 + i * 7919);
const NO_LAWS = { crownPoint: 99, crimeBills: 99 }; // the world where 1934 never comes

const cache = {};
const games = (pol, tune = {}, tag = '') => (cache[pol + tag] ||= seeds.map((sd) => playGame(sd, pol, tune)));

export function metrics(s) {
  const o = s.outcome.kind;
  return {
    disappeared: o === 'disappeared', killed: o === 'killed', captured: o === 'captured', sold: o === 'sold', atlarge: o === 'atlarge',
    months: s.outcome.t + 1, jobs: s.stats.jobs, take: s.stats.take, kept: s.stats.kept,
    townsfolk: s.stats.killed, crossed: s.stats.crossed, legendPeak: s.legendPeak,
    freeIn1934: Math.max(0, s.outcome.t + 1 - 8), // months lived past December 1933
    lowMonths: s.stats.lowMonths, stPaulMonths: s.stats.stPaulMonths, moves: s.stats.moves,
  };
}

const rows = (list) => list.map(metrics);
const AXES = ['disappeared', 'killed', 'captured', 'sold', 'atlarge', 'months', 'freeIn1934', 'jobs', 'take', 'kept', 'townsfolk', 'crossed', 'lowMonths', 'stPaulMonths', 'moves'];
function pair(q, a, b) {
  const A = rows(a), B = rows(b);
  console.log(`\n${q}`);
  console.log(compare(AXES.map((key) => ({ label: key, base: A.map((r) => r[key]), variant: B.map((r) => r[key]) }))));
}

// 1. The line by date, paired: take every job a careful player chose, and replay
// it from the same state with the same dice twice: once with the gang living in
// the town's own state (no crossing) and once living over the line (crossing on
// the way home). Both homes get the home's heat, so only the line differs.
// Caught = that night or that month.
import { act } from '../src/engine/month.js';
import { phase, stPaulHolds } from '../src/engine/odds.js';
import { neighbours, townById } from './world.js';
console.log(`Kill gate, ${runs} seeds per policy\n`);
console.log('1. Robbing over the line from home vs at home: caught that night or that month, by phase (paired)');
const probe = { early: [[], []], named: [[], []], armed: [[], []] };
for (const sd of seeds) playGame(sd, 'careful', {}, (s, a) => {
  if (a.kind !== 'job') return;
  const st = townById(a.town).state;
  const over = neighbours(st).find((id) => !stPaulHolds(s, id) && id !== 'mn') ?? neighbours(st)[0];
  if (stPaulHolds(s, st) || st === 'mn') return; // keep the arrangement out of this measure
  for (let r = 0; r < 10; r++) {
    const heat = { ...s.heat, [st]: s.heat[s.at], [over]: s.heat[s.at] };
    const base = { ...s, heat, seed: (s.seed + r * 104729) >>> 0 };
    const caught = (x) => !!x.outcome && x.outcome.kind !== 'disappeared';
    probe[phase(s)][0].push(caught(act({ ...base, at: st }, a)));
    probe[phase(s)][1].push(caught(act({ ...base, at: over }, a)));
  }
});
for (const ph of ['early', 'named', 'armed']) {
  const [st, cr] = probe[ph];
  const ps = st.filter(Boolean).length / (st.length || 1), pc = cr.filter(Boolean).length / (cr.length || 1);
  const gap = 100 * (pc - ps), floor = noiseFloor(pc, cr.length || 1, ps, st.length || 1);
  console.log(`  ${ph.padEnd(6)} stayed ${(100 * ps).toFixed(1).padStart(5)}%  crossed ${(100 * pc).toFixed(1).padStart(5)}%  (${st.length} pairs)  gap ${gap >= 0 ? '+' : ''}${gap.toFixed(1)}  floor ${floor.toFixed(1)}  ${Math.abs(gap) < floor ? 'NOISE' : 'REAL'}`);
}

pair('2a. The federal track: a man who never quits, real 1934 -> the laws never pass', games('stayer'), games('stayer', NO_LAWS, 'nolaws-stayer'));
pair('2c. Leaving late: greedy (wants $8,000 more), real 1934 -> the laws never pass', games('greedy'), games('greedy', NO_LAWS, 'nolaws-greedy'));
pair('2d. Leaving late, real 1934: careful -> greedy', games('careful'), games('greedy'));
pair('2b. The federal track: careful, real 1934 -> the laws never pass', games('careful'), games('careful', NO_LAWS, 'nolaws'));
pair('3a. Disappearing: careful -> never quits', games('careful'), games('stayer'));
pair('3b. The line as a decision: careful -> robs only in its home state', games('careful'), games('nocross'));
pair('3c. careful -> robs only over the line', games('careful'), games('alwayscross'));
pair('3d. careful -> bold approach', games('careful'), games('bold'));
pair('3e. careful -> reckless (never lies low, never crosses, bold)', games('careful'), games('reckless'));
pair('3f. careful -> lies low sooner (timid)', games('careful'), games('timid'));
pair('4. St. Paul: careful -> never lives there', games('careful'), games('nostpaul'));
pair('5. Moving house: careful -> never moves', games('careful'), games('homebody'));
