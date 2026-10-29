// Fixed policies for the kill gate. A policy reads only what a player could see
// (the shared formulas in odds.js) and returns one action a month.
import { act } from '../src/engine/month.js';
import { newGame, K } from '../src/engine/state.js';
import { streamFor } from '../src/engine/rng.js';
import { TOWNS, STATES, neighbours } from '../src/data/world.data.js';
import { fedRisk, localRisk, getawayRisk, informRisk, shootChance, vaultCash, phase, stPaulHolds } from '../src/engine/odds.js';

const BASE = {
  cross: 'smart', // smart | never | always | coin | early (only before the bills)
  bold: false,
  stPaul: true, // lie low in St. Paul while the arrangement holds
  quit: true, // buy a face and disappear once the money is there
  lieLowAt: 0.1, // lie low when this month's risk where you are passes this
  lifeValue: 40000, // what the bot thinks its neck is worth, in dollars
  extra: 0, // money wanted beyond the bare price of disappearing
};

export const POLICIES = {
  careful: {},
  nocross: { cross: 'never' },
  alwayscross: { cross: 'always' },
  coin: { cross: 'coin' }, // crosses at random: the clean measure of the line's value
  early: { cross: 'early' },
  bold: { bold: true },
  stayer: { quit: false },
  greedy: { extra: 15000 }, // stays for $15,000 more before leaving
  nostpaul: { stPaul: false },
  timid: { lieLowAt: 0.06 }, // lies low at the first sign of trouble
  reckless: { lieLowAt: 1, cross: 'never', bold: true },
};

function stayRisk(s, stateId, heat) {
  const t = { ...s, heat: { ...s.heat, [stateId]: heat } };
  return localRisk(t, stateId);
}

/** The bot's choice of where to go over the line, and whether to go at all. */
function crossChoice(s, town, p, heatAfter) {
  const over = neighbours(town.state);
  const best = over.sort((a, b) => s.heat[a] - s.heat[b])[0];
  if (p.cross === 'never') return null;
  if (p.cross === 'always') return best;
  if (p.cross === 'coin') return streamFor(s.seed, s.t, 'bot-coin').chance(0.5) ? best : null;
  if (p.cross === 'early') return phase(s) === 'armed' ? null : best;
  // smart: compare tonight plus the month after, both ways, against the cost.
  const stay = getawayRisk(s, town.state, heatAfter, false) + stayRisk(s, town.state, heatAfter * K(s).heatDecay);
  const go = getawayRisk(s, town.state, heatAfter, true) + stayRisk(s, best, s.heat[best] * K(s).heatDecay) + (K(s).fedDyer / 100) * 0.1;
  return go * p.lifeValue + K(s).crossCost < stay * p.lifeValue ? best : null;
}

export function choose(s, policy) {
  const p = { ...BASE, ...POLICIES[policy] };
  const k = K(s);
  const surgeryLeft = s.surgery ? 0 : k.surgeryCost;
  if (p.quit && s.cash >= k.disappearNeed + p.extra + surgeryLeft + k.lieLowCost + k.livingLeader) {
    if (!s.surgery) return { kind: 'surgery', where: safest(s, p) };
    return { kind: 'disappear' };
  }
  const here = localRisk(s, s.at) + fedRisk(s) + informRisk(s);
  if (here > p.lieLowAt && s.cash > k.lieLowCost + k.livingLeader + k.stPaulFee) return { kind: 'lielow', where: safest(s, p) };
  // The best job within a drive.
  const reach = [s.at, ...neighbours(s.at)];
  let best = null;
  for (const town of TOWNS.filter((x) => reach.includes(x.state))) {
    const take = vaultCash(s, town) * 0.72 * (p.bold ? 1 : k.quietTake) * Math.min(1, (s.men.length + 1) / 4) * k.leaderShare;
    const heatAfter = Math.min(100, s.heat[town.state] + k.heatJob + (p.bold ? k.heatBold : 0));
    const cross = crossChoice(s, town, p, heatAfter);
    const risk = getawayRisk(s, town.state, heatAfter, !!cross) + shootChance(s, town, p.bold) * 0.15 + town.guard * k.sceneCatch;
    const value = take - risk * p.lifeValue;
    if (!best || value > best.value) best = { value, town, cross };
  }
  return { kind: 'job', town: best.town.id, bold: p.bold, cross: best.cross };
}

function safest(s, p) {
  const options = STATES.map((x) => x.id).filter((id) => p.stPaul || id !== 'mn' || !stPaulHolds(s, 'mn'));
  return options.map((id) => ({ id, r: localRisk(s, id, { lyingLow: true }) + fedRisk(s, { lyingLow: true, at: id }) + (id === s.at ? 0 : 0.002) }))
    .sort((a, b) => a.r - b.r)[0].id;
}

export function playGame(seed, policy, tune = {}, onChoice = null) {
  let s = newGame(seed, tune);
  for (let guard = 0; !s.outcome && guard < 40; guard++) {
    const before = s.t;
    const a = choose(s, policy);
    if (onChoice) onChoice(s, a);
    s = act(s, a);
    if (!s.outcome && s.t === before) throw new Error(`No progress at turn ${s.t} (${policy})`);
  }
  if (!s.outcome) throw new Error('Game did not end');
  return s;
}
