// Shared formulas. The resolver rolls against these and the forecast (later)
// shows them; neither may compute a chance of its own.
import { K } from './state.js';
import { stateById } from './state.js';

/** Which federal phase a turn is in. */
export function phase(s, t = s.t) {
  const k = K(s);
  if (t >= k.crimeBills) return 'armed';
  if (t >= k.crownPoint) return 'named';
  return 'early';
}

export const radioIn = (s, stateId, t = s.t) => t >= stateById(stateId).radioFrom;

/** Monthly chance the Bureau takes you where you are. */
export function fedRisk(s, { lyingLow = false, at = s.at, t = s.t } = {}) {
  const k = K(s);
  const recog = s.surgery ? k.surgeryRecog : 1;
  const low = (lyingLow ? k.fedLieLow : 1) * (stPaulHolds(s, at, t) ? k.fedStPaul : 1);
  return Math.min(0.9, (s.fed / 100) * k.fedReach[phase(s, t)] * k.fedCatch * recog * low);
}

/** Monthly chance local police take you in a state, from its heat. */
export function localRisk(s, stateId, { lyingLow = false, t = s.t } = {}) {
  const k = K(s);
  const h = s.heat[stateId] / 100;
  const radio = radioIn(s, stateId, t) ? k.radioX : 1;
  const sym = 1.4 - s.sympathy / 100; // a county that likes you looks the other way
  const base = lyingLow ? k.hideRisk : k.localCatch;
  let p = h * base * radio * sym;
  if (stPaulHolds(s, stateId, t)) p *= k.stPaulX;
  return Math.min(0.9, p);
}

/** The St. Paul arrangement shelters a gang that lives there, until summer 1934,
 * or until the gang breaks its one rule: no jobs and no killing in Minnesota. */
export function stPaulHolds(s, stateId = 'mn', t = s.t) {
  return stateId === 'mn' && t < K(s).stPaulEnds && !s.killedIn.mn && !s.stPaulBroken;
}

/** Tonight's chance the pursuit catches you after a job, staying or crossing. */
export function getawayRisk(s, stateId, heatAfter, cross, t = s.t) {
  const k = K(s);
  const radio = radioIn(s, stateId, t) ? k.radioX : 1;
  let p = (heatAfter / 100) * k.getawayCatch * radio;
  if (cross) p *= phase(s, t) === 'armed' ? k.crossShakeArmed : k.crossShake;
  return Math.min(0.9, p);
}

/** The reward on you: the states', from your rank, and the federal one once the bills pass. */
export function reward(s, t = s.t) {
  const k = K(s);
  return Math.round(s.legend * k.rewardPerLegend + (phase(s, t) === 'armed' && s.legend >= 60 ? k.rewardFed : 0));
}

/** Monthly chance someone sells you: each man by his disloyalty, plus the people you rent from. */
export function informRisk(s, t = s.t) {
  const k = K(s);
  const r = reward(s, t);
  const doubt = s.men.reduce((a, m) => a + (100 - m.loyalty) / 100, 0) + 0.4; // the landlord, the girl
  const sym = 1.3 - s.sympathy / 100;
  return Math.min(0.5, (r * doubt * sym) / k.informScale);
}

/** Chance a job turns into a shooting. */
export function shootChance(s, town, bold) {
  const k = K(s);
  return Math.min(0.9, town.guard * k.guardShoot + (bold ? k.boldShoot : 0) + (s.men.length < 2 ? 0.1 : 0));
}

/** Cash in a town's vault now: it refills over a year after a robbery. */
export function vaultCash(s, town, t = s.t) {
  const last = s.robbed[town.id];
  const fill = last == null ? 1 : Math.min(1, 0.2 + (t - last) / 12);
  const fdic = t >= K(s).fdic ? 1.1 : 1; // deposits come back once they are insured
  return Math.round(town.cash * fill * fdic);
}

/** Monthly chance of being recognised after you have gone. */
// The men you leave know the name you left under; each one's doubt counts.
export function recogRisk(s) {
  const k = K(s);
  const talk = 1 + s.men.reduce((a, m) => a + (100 - m.loyalty) / 100, 0) * k.recogMenTalk;
  return Math.min(0.6, k.recogBase * (0.3 + s.legendPeak / 100) * (0.3 + s.fed / 100) * (s.surgery ? k.surgeryRecog : 1) * talk * 2);
}
