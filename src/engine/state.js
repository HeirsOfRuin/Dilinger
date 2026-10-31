// The game state and the one function that makes it. Everything the game knows
// is in here, so a save is this object and nothing else.
import { CONFIG } from '../data/config.data.js';
import { STATES, TOWNS } from '../data/world.data.js';
import { FIRST, LAST, SKILLS } from '../data/gang.data.js';
import { streamFor } from './rng.js';
import { inheritance } from './family.js';

export const SAVE_VERSION = 1;

/** Tuning for this game: the config with any overrides (the kill gate's other worlds). */
export const K = (s) => s.tune;

/**
 * seed: any integer. tune: overrides of CONFIG (a kill-gate world, a test).
 * start: { at, name, skill, family } a starting state; family is a record read
 * from a Dead or Alive family code (src/engine/family.js).
 */
export function newGame(seed, tune = {}, start = {}) {
  const k = { ...CONFIG, ...tune };
  const r = streamFor(seed >>> 0, 0, 'creation');
  const fam = start.family ? inheritance(start.family, k) : null;
  const taken = new Set();
  const name = () => {
    for (;;) {
      const n = `${r.pick(FIRST)} ${r.pick(LAST)}`;
      if (!taken.has(n)) { taken.add(n); return n; }
    }
  };
  const men = Array.from({ length: k.menStart }, (_, i) => ({
    id: i + 1, name: name(), loyalty: k.loyaltyStart,
  }));
  if (fam?.loyalFriend) {
    // A grandson of a man who kept faith with your grandfather.
    men[0].name = `${r.pick(FIRST)} ${String(fam.loyalFriend).split(' ').pop()}`;
    men[0].loyalty = 85;
    men[0].kin = 'family friend';
  }
  const me = {
    name: start.name ?? (fam ? `${r.pick(FIRST)} ${fam.last}` : name()),
    skill: start.skill ?? fam?.skill ?? r.pick(Object.keys(SKILLS)),
  };
  return {
    v: SAVE_VERSION,
    seed: seed >>> 0,
    t: 0,
    tune: k,
    at: start.at ?? 'in', // the gang's home state
    lodge: false, // living at a lodge in the Wisconsin woods (at is 'wi')
    me,
    family: fam, // what the grandfather left, or null
    familyFound: false, // the papers have found the name
    cash: k.startCash + (fam?.cash ?? 0),
    heat: Object.fromEntries(STATES.map((st) => [st.id, 0])),
    fed: fam?.lawGrudge ? k.familyFedGrudge : 0,
    legend: 0,
    legendPeak: 0,
    sympathy: k.sympathyStart,
    car: { v8: false },
    girl: null, // { name, loyalty, taken, city, warnedAt }
    men,
    nextId: k.menStart + 1,
    idle: 0,
    surgery: false,
    killedIn: {}, // states where you have killed: their arrangements end
    stPaulBroken: false, // a job in Minnesota ends the St. Paul arrangement
    robbed: {}, // town id -> turn last robbed (a vault refills slowly)
    gone: null, // { from } once you have left to disappear
    pending: null, // the month's question: { id, b } (src/engine/incidents.js)
    tip: null, // { town, t }: a payroll day bought from a bartender
    outcome: null, // { kind: 'disappeared'|'killed'|'captured'|'sold'|'atlarge', t, how }
    stats: { jobs: 0, take: 0, kept: 0, killed: 0, lawmen: 0, menDead: 0, crossed: 0, lowMonths: 0, stPaulMonths: 0, moves: 0, warned: 0 },
    jobsLog: [], // one row per job, for the instruments: { t, phase, crossed, caught }
    log: [],
  };
}

export const townById = (id) => TOWNS.find((x) => x.id === id);
export const stateById = (id) => STATES.find((x) => x.id === id);

export const FRIEND_CITY = { il: 'Chicago', mn: 'St. Paul' };
