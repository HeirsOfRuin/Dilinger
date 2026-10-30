// One month: act(state, action) -> new state. Pure and deterministic: every roll
// comes from a named stream of (seed, turn, label), so the same seed and the same
// choices always give the same game.
import { streamFor } from './rng.js';
import { K, townById, stateById, FRIEND_CITY } from './state.js';
import { GIRLS, FRIENDS } from '../data/gang.data.js';
import { TURNS, MONTHS, neighbours } from '../data/world.data.js';
import { phase, stPaulHolds, fedRisk, localRisk, getawayRisk, informRisk, shootChance, killChance, sceneChance, friendRisk, reward, vaultCash, recogRisk } from './odds.js';

/**
 * Actions:
 *   { kind: 'job', town, bold }   a town in the state you live in or one next to it.
 *                                  The gang drives home after: a town over the line
 *                                  means crossing it tonight.
 *   { kind: 'lielow', where }     a month off the streets; where: a state id to move
 *                                  the gang's home to (or the one you live in)
 *   { kind: 'surgery', where }    a new face; the month is spent lying low
 *   { kind: 'disappear' }         leave with what you have
 * Free actions (no time passes):
 *   { kind: 'buy', item }         'v8': a fast car of your own
 *   { kind: 'girl' }              take up with a woman (home in Chicago's or St. Paul's state)
 * A job may name car: 'own' (your V-8) or 'stolen' (the default).
 *
 * s.at is the gang's home: where it lives, and where the month's dangers find it.
 */
export function act(prev, action) {
  if (prev.outcome) return prev;
  const s = structuredClone(prev);
  const k = K(s);
  const rng = (label) => streamFor(s.seed, s.t, label);
  const note = (text) => s.log.push({ t: s.t, text });
  let lyingLow = false;

  if (action.kind === 'buy') {
    const cost = { v8: k.v8Cost }[action.item];
    if (cost == null) throw new Error(`Nothing called ${action.item} for sale.`);
    if (s.car[action.item]) throw new Error('You already have one.');
    if (s.cash < cost) throw new Error('Not enough money.');
    s.cash -= cost;
    s.car[action.item] = true;
    note('A Ford V-8, bought under another name.');
    return s;
  }
  if (action.kind === 'girl') {
    if (s.girl) throw new Error('You already have a girl.');
    if (!FRIEND_CITY[s.at]) throw new Error('You meet her in a city: live in Illinois or Minnesota.');
    const r = rng('girl');
    s.girl = { name: r.pick(GIRLS), friend: r.pick(FRIENDS), loyalty: 70, taken: false, city: s.at, warnedAt: null };
    note(`You took up with ${s.girl.name}, a hat-check girl in ${FRIEND_CITY[s.at]}. Her friend ${s.girl.friend} rents rooms.`);
    return s;
  }

  if (action.kind === 'disappear') {
    if (s.cash < k.disappearNeed) throw new Error('Not enough money to disappear.');
    return goQuiet(s);
  }

  if (action.kind === 'job') {
    const town = townById(action.town);
    if (!town) throw new Error(`No such town: ${action.town}`);
    if (town.state !== s.at && !neighbours(s.at).includes(town.state)) throw new Error('Too far to drive for a job.');
    runJob(s, town, action, rng, note);
    if (s.outcome) return s;
  } else if (action.kind === 'lielow' || action.kind === 'surgery') {
    lyingLow = true;
    const where = action.where ?? s.at;
    if (where !== s.at) {
      s.cash -= k.moveCost;
      s.at = where;
      s.stats.moves += 1;
      note(`The gang moved to ${stateById(where).name}.`);
    }
    s.cash -= k.lieLowCost;
    s.idle += 1;
    s.stats.lowMonths += 1;
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
  const cross = town.state !== s.at; // the drive home goes over the line
  if (town.state === 'mn' && stPaulHolds(s)) {
    s.stPaulBroken = true;
    note('A job in Minnesota: the St. Paul police will not protect you again.');
  }
  const crew = Math.min(1, (s.men.length + 1) / 4);
  let take = Math.round(vault * r.float(...k.takeShare) * crew * (action.bold ? 1 : k.quietTake));
  let killed = 0, lawmen = 0;
  if (r.chance(shootChance(s, town, action.bold))) {
    if (r.chance(killChance(s))) {
      killed = 1;
      if (r.chance(k.shootLawman)) lawmen = 1;
    }
    if (s.men.length && r.chance(k.shootManDown)) {
      const dead = s.men.splice(r.int(s.men.length), 1)[0];
      s.stats.menDead += 1;
      for (const m of s.men) m.loyalty -= k.loyaltyDeath;
      note(`${dead.name} died in ${town.name}.`);
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
  if (town.guard && r.chance(sceneChance(s, town))) {
    logJob(s, cross, true);
    return end(s, 'captured', `taken in the street in ${town.name}`);
  }
  // The getaway: tonight's decision.
  const own = action.car === 'own';
  if (own && !s.car.v8) throw new Error('You have no car of your own.');
  const getaway = getawayRisk(s, town.state, s.heat[town.state], cross, s.t, own ? 'own' : 'stolen');
  if (own) s.fed = Math.min(100, s.fed + kc * k.fedPlates); // plates the Bureau can trace
  if (cross) {
    s.stats.crossed += 1;
    s.cash -= k.crossCost;
    if (!own) s.fed = Math.min(100, s.fed + kc * k.fedDyer); // a stolen car over the line
  }
  const caughtTonight = rng('getaway').chance(getaway);
  // Pay the men.
  const mine = Math.round(take * k.leaderShare);
  const each = s.men.length ? Math.round((take - mine) / s.men.length) : 0;
  s.cash += s.men.length ? mine : take;
  for (const m of s.men) m.loyalty = Math.min(100, m.loyalty + Math.min(k.loyaltyShareCap, each * k.loyaltyShare));
  s.stats.take += take;
  note(`${town.name}: $${take.toLocaleString('en-US')}${killed ? (lawmen ? ', a policeman killed' : ', a man in the bank killed') : ''}${cross ? '; over the line by morning' : ''}.`);
  s.jobsLog.push({ t: s.t, phase: phase(s), crossed: cross, caught: caughtTonight });
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
  // Living, and the St. Paul police's cut.
  const sheltered = stPaulHolds(s, s.at);
  const girl = s.girl && !s.girl.taken;
  s.cash -= k.livingLeader + k.livingMan * s.men.length + (sheltered ? k.stPaulFee : 0) + (girl ? k.girlCost : 0);
  if (sheltered) s.stats.stPaulMonths += 1;
  if (s.cash < 0) {
    // Broke: the men drift off before you starve.
    for (const m of s.men) m.loyalty -= 10;
    s.cash = 0;
  }
  if (s.idle >= 2) for (const m of s.men) m.loyalty -= k.loyaltyIdle;
  s.men = s.men.filter((m) => {
    if (m.loyalty >= 25) return true;
    note(`${m.name} went his own way.`);
    return false;
  });

  // The month's dangers, where you are.
  const r = rng('month');
  const local = localRisk(s, s.at, { lyingLow });
  const fed = fedRisk(s, { lyingLow });
  const sold = informRisk(s);
  const friend = friendRisk(s);
  // Whether the month's last row (a job this month) ended in a catch, for the instruments.
  const job = s.jobsLog.at(-1)?.t === s.t ? s.jobsLog.at(-1) : null;
  if (friend && r.chance(friend)) {
    if (job) job.caught = true;
    return end(s, 'killed', `sold by ${s.girl.friend}: the agents were waiting outside the picture house`);
  }
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

  // Her month: the Bureau may take her; her friend may start asking.
  if (girl) {
    const g = s.girl;
    if (r.chance(fed * k.girlTakenX)) {
      g.taken = true;
      note(`The agents took ${g.name}. She will not talk, but the rooms are gone.`);
    } else if (g.warnedAt == null && s.at === g.city && reward(s) >= k.friendReward && phase(s) !== 'early' && r.chance(k.friendWarnChance)) {
      g.warnedAt = s.t;
      s.stats.warned += 1;
      note(`${g.name} says ${g.friend} has been asking about the reward, and about her own papers.`);
    }
  }

  // The papers find the family name.
  if (s.family && !s.familyFound && s.legend >= k.familyFound) {
    s.familyFound = true;
    s.legend = Math.min(100, s.legend + k.familyLegend);
    s.sympathy += s.family.sympathy;
    note(`The papers have found the name: grandson of ${s.family.founder}${s.family.heirloom ? `, and the ${s.family.heirloom} he carries was his` : ''}.`);
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
  if (sheltered && !stPaulHolds(s, s.at)) {
    // The arrangement ends while you live under it: the raid comes to your door.
    s.heat.mn = Math.max(s.heat.mn, k.stPaulRaidHeat);
    note('The St. Paul arrangement is over. The police who took your money now want you.');
  }
  if (s.t >= TURNS) return epilogue(s);
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

/** Still at large at the end of 1934: 1935, a month at a time, with the Bureau
 * armed and your file open (Floyd was shot in October 1934, Nelson in November,
 * the Barkers in January 1935; Karpis lasted until May 1936). */
function epilogue(s) {
  const k = K(s);
  const t = TURNS - 1;
  s.fed = Math.max(s.fed, k.epilogueFedFloor);
  for (let m = 0; m < k.epilogueMonths; m++) {
    const r = streamFor(s.seed, TURNS + m, 'epilogue');
    const month = MONTHS[m];
    if (r.chance(informRisk(s, t))) return end(s, r.chance(0.6) ? 'killed' : 'sold', `sold for the reward in ${month} 1935`, t);
    if (r.chance(fedRisk(s, { lyingLow: true, t }))) {
      return r.chance(k.fedKilledShare.armed) ? end(s, 'killed', `shot by federal agents in ${month} 1935`, t) : end(s, 'captured', `taken by federal agents in ${month} 1935`, t);
    }
    s.fed = Math.max(k.epilogueFedFloor, s.fed * k.fedDecay);
  }
  return end(s, 'atlarge', 'never taken, never free: still on the list at the end of 1935', t);
}

function end(s, kind, how, t = s.t) {
  s.outcome = { kind, t, how };
  s.stats.kept = kind === 'disappeared' ? s.cash : 0;
  return s;
}
