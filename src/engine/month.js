// One month: act(state, action) -> new state. Pure and deterministic: every roll
// comes from a named stream of (seed, turn, label), so the same seed and the same
// choices always give the same game.
import { streamFor } from './rng.js';
import { K, townById } from './state.js';
import { TURNS, neighbours, dateName } from '../data/world.data.js';
import { phase, radioIn, stPaulHolds, fedRisk, localRisk, getawayRisk, informRisk, shootChance, vaultCash, recogRisk } from './odds.js';

/**
 * Actions:
 *   { kind: 'job', town, bold, cross }  cross: a neighbouring state id, or null to stay
 *   { kind: 'lielow', where }           where: a state id (moving there costs a crossing)
 *   { kind: 'surgery', where }          a new face; the month is spent lying low
 *   { kind: 'disappear' }               leave with what you have
 */
export function act(prev, action) {
  if (prev.outcome) return prev;
  const s = structuredClone(prev);
  const k = K(s);
  const rng = (label) => streamFor(s.seed, s.t, label);
  const note = (text) => s.log.push({ t: s.t, text });
  let lyingLow = false;

  if (action.kind === 'disappear') {
    if (s.cash < k.disappearNeed) throw new Error('Not enough money to disappear.');
    return goQuiet(s);
  }

  if (action.kind === 'job') {
    const town = townById(action.town);
    if (!town) throw new Error(`No such town: ${action.town}`);
    if (town.state !== s.at && !neighbours(s.at).includes(town.state)) throw new Error('Too far to drive for a job.');
    if (action.cross && !neighbours(town.state).includes(action.cross)) throw new Error('That state is not over the line.');
    runJob(s, town, action, rng, note);
    if (s.outcome) return s;
  } else if (action.kind === 'lielow' || action.kind === 'surgery') {
    lyingLow = true;
    const where = action.where ?? s.at;
    if (where !== s.at) {
      s.cash -= k.crossCost;
      s.at = where;
    }
    s.cash -= k.lieLowCost + (where === 'mn' && s.t < k.stPaulEnds ? k.stPaulFee - k.lieLowCost : 0);
    s.idle += 1;
    s.stats.lowMonths += 1;
    if (where === 'mn' && s.t < k.stPaulEnds && !s.killedIn.mn) s.stats.stPaulMonths += 1;
    if (action.kind === 'surgery') {
      if (s.surgery) throw new Error('You already have a new face.');
      if (s.cash < k.surgeryCost) throw new Error('Not enough money for the doctor.');
      s.cash -= k.surgeryCost;
      if (rng('surgery').chance(k.surgeryDeath)) return end(s, 'killed', 'died under the ether in a back room');
      s.surgery = true;
      note('A new face: the cleft gone from the chin, the moles burned off.');
    }
  } else throw new Error(`Unknown action: ${action.kind}`);

  return endMonth(s, lyingLow, rng, note);
}

function runJob(s, town, action, rng, note) {
  const k = K(s);
  const r = rng('job');
  s.stats.jobs += 1;
  s.idle = 0;
  const vault = vaultCash(s, town);
  s.robbed[town.id] = s.t;
  const crew = Math.min(1, (s.men.length + 1) / 4);
  let take = Math.round(vault * r.float(...k.takeShare) * crew * (action.bold ? 1 : k.quietTake));
  let killed = 0, lawmen = 0;
  if (r.chance(shootChance(s, town, action.bold))) {
    if (r.chance(k.shootKill)) {
      killed = 1;
      if (r.chance(k.shootLawman)) lawmen = 1;
    }
    if (s.men.length && r.chance(k.shootManDown)) {
      const dead = s.men.splice(r.int(s.men.length), 1)[0];
      s.stats.menDead += 1;
      for (const m of s.men) m.loyalty -= k.loyaltyDeath;
      note(`One of yours (man ${dead.id}) died in ${town.name}.`);
    }
    take = Math.round(take * 0.6);
  }
  // Heat and the Bureau.
  const kc = s.t >= k.kcMassacre ? k.fedKcBoost : 1;
  s.heat[town.state] = Math.min(100, s.heat[town.state] + k.heatJob + killed * k.heatKill + (action.bold ? k.heatBold : 0));
  const legendGain = (take / 1000) * k.legendPerThousand + killed * k.legendKill;
  s.legend = Math.min(100, s.legend + legendGain);
  s.legendPeak = Math.max(s.legendPeak, s.legend);
  s.fed = Math.min(100, s.fed + kc * (k.fedJob + killed * k.fedKill * (1 + lawmen) + legendGain * k.fedLegend));
  if (killed) {
    s.sympathy = Math.max(0, s.sympathy - k.sympathyKill);
    s.killedIn[town.state] = true;
    s.stats.killed += killed;
    s.stats.lawmen += lawmen;
  }
  // Scene: taken before the cars get away (half as likely without radio).
  if (town.guard && r.chance(town.guard * k.sceneCatch * (radioIn(s, town.state) ? 1 : 0.5))) {
    logJob(s, action.cross, true);
    return end(s, 'captured', `taken in the street in ${town.name}`);
  }
  // The getaway: tonight's decision.
  const getaway = getawayRisk(s, town.state, s.heat[town.state], !!action.cross);
  if (action.cross) {
    s.stats.crossed += 1;
    s.cash -= k.crossCost;
    s.fed = Math.min(100, s.fed + kc * k.fedDyer); // the stolen car over the line
    s.at = action.cross;
  } else s.at = town.state;
  const caughtTonight = rng('getaway').chance(getaway);
  // Pay the men.
  const mine = Math.round(take * k.leaderShare);
  const each = s.men.length ? Math.round((take - mine) / s.men.length) : 0;
  s.cash += s.men.length ? mine : take;
  for (const m of s.men) m.loyalty = Math.min(100, m.loyalty + Math.min(k.loyaltyShareCap, each * k.loyaltyShare));
  s.stats.take += take;
  note(`${town.name}: $${take.toLocaleString('en-US')}${killed ? (lawmen ? ', a policeman killed' : ', a man in the bank killed') : ''}${action.cross ? `; over the line by morning` : ''}.`);
  s.jobsLog.push({ t: s.t, phase: phase(s), crossed: !!action.cross, caught: caughtTonight });
  if (caughtTonight) {
    const shot = rng('getaway-end').chance(K(s).localKilledShare);
    return end(s, shot ? 'killed' : 'captured', shot ? 'shot on the road that night' : 'taken on the road that night');
  }
}

function logJob(s, crossed, caught) {
  s.jobsLog.push({ t: s.t, phase: phase(s), crossed: !!crossed, caught });
}

function endMonth(s, lyingLow, rng, note) {
  const k = K(s);
  // Living.
  s.cash -= k.livingLeader + k.livingMan * s.men.length;
  if (s.cash < 0) {
    // Broke: the men drift off before you starve.
    for (const m of s.men) m.loyalty -= 10;
    s.cash = 0;
  }
  if (s.idle >= 2) for (const m of s.men) m.loyalty -= k.loyaltyIdle;
  s.men = s.men.filter((m) => {
    if (m.loyalty >= 25) return true;
    note(`Man ${m.id} went his own way.`);
    return false;
  });

  // The month's dangers, where you are.
  const r = rng('month');
  const local = localRisk(s, s.at, { lyingLow });
  const fed = fedRisk(s, { lyingLow });
  const sold = informRisk(s);
  // Whether the month's last row (a job this month) ended in a catch, for the instruments.
  const job = s.jobsLog.at(-1)?.t === s.t ? s.jobsLog.at(-1) : null;
  if (r.chance(sold)) { if (job) job.caught = true; return end(s, phase(s) === 'armed' && r.chance(0.6) ? 'killed' : 'sold', 'sold for the reward'); }
  if (r.chance(fed)) {
    if (job) job.caught = true;
    const shot = r.chance(k.fedKilledShare[phase(s)]);
    return end(s, shot ? 'killed' : 'captured', shot ? 'shot by federal agents' : 'taken by federal agents');
  }
  if (r.chance(local)) {
    if (job) job.caught = true;
    const shot = r.chance(k.localKilledShare);
    return end(s, shot ? 'killed' : 'captured', shot ? 'shot by police' : 'taken by police');
  }

  // Cooling.
  for (const id of Object.keys(s.heat)) s.heat[id] = Math.round(s.heat[id] * (lyingLow && id === s.at ? k.lieLowHeat : k.heatDecay));
  s.fed = s.fed * (lyingLow ? (stPaulHolds(s, s.at) ? k.fedDecayStPaul : k.fedDecayLieLow) : k.fedDecay);
  s.legend = s.legend * k.legendDecay;
  for (const m of s.men) m.loyalty += (k.loyaltyStart - m.loyalty) * 0.05;

  // Dated events.
  s.t += 1;
  if (s.t === k.kcMassacre) { s.sympathy -= k.sympathyKc; note('Kansas City: four lawmen killed at Union Station. The papers turn.'); }
  if (s.t === k.fdic) { s.sympathy -= k.sympathyFdic; note('Deposits are insured from today. A robbed bank is no longer a ruined farmer.'); }
  if (s.t === k.crimeBills) note('The crime bills are law: robbing a bank is federal, and the agents carry guns.');
  if (s.t >= TURNS) return end(s, 'atlarge', `still wanted at the end of ${dateName(TURNS - 1)}`);
  return s;
}

/** Leave: the quiet months run out here, each a chance of being recognised. */
function goQuiet(s) {
  const k = K(s);
  s.gone = { from: s.t };
  for (let m = 0; m < k.disappearMonths; m++) {
    const r = streamFor(s.seed, s.t + m, 'gone');
    if (r.chance(recogRisk(s))) return end(s, phase(s) === 'armed' && r.chance(0.5) ? 'killed' : 'captured', `recognised ${m + 1} months after leaving`);
    s.fed *= k.fedDecay;
  }
  s.stats.kept = s.cash;
  return end(s, 'disappeared', 'gone, under another name');
}

function end(s, kind, how) {
  s.outcome = { kind, t: s.t, how };
  s.stats.kept = kind === 'disappeared' ? s.cash : 0;
  return s;
}
