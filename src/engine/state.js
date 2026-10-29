// The game state and the one function that makes it. Everything the game knows
// is in here, so a save is this object and nothing else.
import { CONFIG } from '../data/config.data.js';
import { STATES, TOWNS } from '../data/world.data.js';

export const SAVE_VERSION = 1;

/** Tuning for this game: the config with any overrides (the kill gate's other worlds). */
export const K = (s) => s.tune;

/**
 * seed: any integer. tune: overrides of CONFIG (a kill-gate world, a test).
 * start: { at } a starting state; the family code will add to this later.
 */
export function newGame(seed, tune = {}, start = {}) {
  const k = { ...CONFIG, ...tune };
  return {
    v: SAVE_VERSION,
    seed: seed >>> 0,
    t: 0,
    tune: k,
    at: start.at ?? 'in',
    cash: k.startCash,
    heat: Object.fromEntries(STATES.map((st) => [st.id, 0])),
    fed: 0,
    legend: 0,
    legendPeak: 0,
    sympathy: k.sympathyStart,
    men: Array.from({ length: k.menStart }, (_, i) => ({ id: i + 1, loyalty: k.loyaltyStart })),
    nextId: k.menStart + 1,
    idle: 0,
    surgery: false,
    killedIn: {}, // states where you have killed: their arrangements end
    robbed: {}, // town id -> turn last robbed (a vault refills slowly)
    gone: null, // { month, need } once you have left to disappear
    outcome: null, // { kind: 'disappeared'|'killed'|'captured'|'sold'|'atlarge', t, how }
    stats: { jobs: 0, take: 0, kept: 0, killed: 0, lawmen: 0, menDead: 0, crossed: 0, lowMonths: 0, stPaulMonths: 0 },
    jobsLog: [], // one row per job, for the instruments: { t, phase, crossed, caught }
    log: [],
  };
}

export const townById = (id) => TOWNS.find((x) => x.id === id);
export const stateById = (id) => STATES.find((x) => x.id === id);
