// Fixed policies for the kill gate. A policy reads only what a player could see
// (the shared formulas in odds.js) and returns one action a month.
import { act } from '../src/engine/month.js';
import { newGame, K, FRIEND_CITY } from '../src/engine/state.js';
import { streamFor } from '../src/engine/rng.js';
import { TOWNS, STATES, neighbours } from '../src/data/world.data.js';
import { fedRisk, localRisk, getawayRisk, informRisk, shootChance, vaultCash, stPaulHolds, friendRisk } from '../src/engine/odds.js';

const BASE = {
  cross: 'smart', // smart | never (rob only at home) | always (rob only over the line) | coin
  bold: false,
  stPaul: true, // live in St. Paul while the arrangement holds
  quit: true, // buy a face and disappear once the money is there
  lieLowAt: 0.1, // lie low when this month's risk at home passes this
  moveAt: 0.08, // move the gang when home is this much riskier than the best other home
  lifeValue: 40000, // what the bot thinks its neck is worth, in dollars
  extra: 0, // money wanted beyond the bare price of disappearing
  v8: true, // buy a fast car of your own
  girl: 'heed', // heed | ignore (stays in her city after the warning) | none
};

export const POLICIES = {
  careful: {},
  nocross: { cross: 'never' },
  alwayscross: { cross: 'always' },
  coin: { cross: 'coin' }, // over the line or at home, at random
  bold: { bold: true },
  stayer: { quit: false },
  greedy: { extra: 8000 }, // stays for $8,000 more before leaving
  nostpaul: { stPaul: false },
  timid: { lieLowAt: 0.06 }, // lies low at the first sign of trouble
  homebody: { moveAt: 1 }, // never moves house
  reckless: { lieLowAt: 1, moveAt: 1, cross: 'never', bold: true },
  nocar: { v8: false },
  nogirl: { girl: 'none' },
  ignore: { girl: 'ignore' },
};

/** A month at home in a state, as the bot reckons it: police, Bureau, informers. */
function homeRisk(s, id, heat = s.heat[id], heed = true) {
  const t = { ...s, heat: { ...s.heat, [id]: heat } };
  return localRisk(t, id) + fedRisk(t, { at: id }) + informRisk(t) + (heed ? friendRisk({ ...t, at: id }, s.t + 1) : 0);
}

function allowedHomes(s, p) {
  return STATES.map((x) => x.id).filter((id) => p.stPaul || !stPaulHolds(s, id));
}

export function choose(s, policy) {
  const p = { ...BASE, ...POLICIES[policy] };
  const k = K(s);
  const surgeryLeft = s.surgery ? 0 : k.surgeryCost;
  if (p.quit && s.cash >= k.disappearNeed + p.extra + surgeryLeft + k.lieLowCost + k.livingLeader) {
    if (!s.surgery) return { kind: 'surgery', where: s.at };
    return { kind: 'disappear' };
  }
  const reserve = k.moveCost + k.livingLeader + k.stPaulFee;
  // Free actions first: the car, the girl.
  if (p.v8 && !s.car.v8 && s.cash > k.v8Cost + 4000) return { kind: 'buy', item: 'v8' };
  if (p.girl !== 'none' && !s.girl && FRIEND_CITY[s.at]) return { kind: 'girl' };
  // Heeding the warning: get out of her friend's city.
  if (p.girl === 'heed' && s.girl && !s.girl.taken && s.girl.warnedAt != null && s.at === s.girl.city) {
    const away = allowedHomes(s, p).filter((id) => id !== s.girl.city).map((id) => ({ id, r: homeRisk(s, id) })).sort((a, b) => a.r - b.r)[0];
    return { kind: 'lielow', where: away.id };
  }
  // Move house when another home is clearly safer (St. Paul, while it holds, usually is).
  const homes = allowedHomes(s, p).filter((id) => p.girl !== 'heed' || !s.girl || s.girl.warnedAt == null || id !== s.girl.city)
    .map((id) => ({ id, r: homeRisk(s, id, s.heat[id], p.girl === 'heed') }));
  const best = homes.sort((a, b) => a.r - b.r)[0];
  const here = homeRisk(s, s.at, s.heat[s.at], p.girl === 'heed');
  if (best.id !== s.at && here - best.r > p.moveAt * (p.stPaul ? 0.25 : 1) && s.cash > reserve) return { kind: 'lielow', where: best.id };
  if (!allowedHomes(s, p).includes(s.at) && s.cash > reserve) return { kind: 'lielow', where: best.id };
  if (here > p.lieLowAt && s.cash > reserve) return { kind: 'lielow', where: s.at };
  // The best job within a drive of home.
  const coin = streamFor(s.seed, s.t, 'bot-coin').chance(0.5);
  const reach = [s.at, ...neighbours(s.at)].filter((id) => {
    const over = id !== s.at;
    if (p.cross === 'never') return !over;
    if (p.cross === 'always') return over;
    if (p.cross === 'coin') return over === coin;
    return true;
  });
  let pick = null;
  for (const town of TOWNS.filter((x) => reach.includes(x.state))) {
    if (town.state === 'mn' && stPaulHolds(s) && s.at === 'mn') continue; // the one rule
    const cross = town.state !== s.at;
    const take = vaultCash(s, town) * 0.72 * (p.bold ? 1 : k.quietTake) * Math.min(1, (s.men.length + 1) / 4) * k.leaderShare;
    const heatAfter = Math.min(100, s.heat[town.state] + k.heatJob + (p.bold ? k.heatBold : 0));
    const after = cross ? homeRisk(s, s.at) : homeRisk(s, s.at, heatAfter * k.heatDecay);
    const risk = getawayRisk(s, town.state, heatAfter, cross, s.t, s.car.v8 ? 'own' : 'stolen') + after + shootChance(s, town, p.bold) * 0.15 + town.guard * k.sceneCatch;
    const value = take - risk * p.lifeValue - (cross ? k.crossCost : 0);
    if (!pick || value > pick.value) pick = { value, town };
  }
  if (!pick) return { kind: 'lielow', where: s.at };
  return { kind: 'job', town: pick.town.id, bold: p.bold, car: s.car.v8 ? 'own' : 'stolen' };
}

const FREE = new Set(['buy', 'girl']);

export function playGame(seed, policy, tune = {}, onChoice = null, start = {}) {
  let s = newGame(seed, tune, start);
  for (let guard = 0; !s.outcome && guard < 120; guard++) {
    const before = s.t;
    const a = choose(s, policy);
    if (onChoice) onChoice(s, a);
    s = act(s, a);
    if (!s.outcome && s.t === before && !FREE.has(a.kind)) throw new Error(`No progress at turn ${s.t} (${policy})`);
  }
  if (!s.outcome) throw new Error('Game did not end');
  return s;
}
