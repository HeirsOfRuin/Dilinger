// Every number and phrase a screen shows comes from here, computed from the
// state with the same formulas the engine rolls against (odds.js). A screen may
// format; it may not compute.
import { K, townById, stateById, FRIEND_CITY } from './state.js';
import { STATES, TOWNS, TURNS, neighbours, dateName, dateOf } from '../data/world.data.js';
import { HISTORY, FILLER, ABOUT_YOU } from '../data/news.data.js';
import { SKILLS } from '../data/gang.data.js';
import { phase, radioIn, stPaulHolds, fedRisk, localRisk, getawayRisk, informRisk, shootChance, killChance, sceneChance, friendRisk, reward, vaultCash, recogRisk } from './odds.js';
import { streamFor } from './rng.js';

export const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
export const pct = (p) => (p < 0.005 ? 'under 1%' : `${Math.round(p * 100)}%`);

const PHASE = {
  early: { label: 'The Bureau: no guns, no arrests', words: 'Federal agents can watch and tell the local police. A state line still shakes most pursuit.' },
  named: { label: 'The Bureau: hunting by name', words: 'Since Crown Point the federal men keep a list. They follow across lines, but still lean on local police to make arrests.' },
  armed: { label: 'The Bureau: armed, and federal law', words: 'Robbing a bank is a federal crime and the agents carry guns. Roadblocks wait at the bridges and the lines.' },
};

/** Risk in words, from a chance. One scale for every screen. */
export function riskWords(p) {
  if (p < 0.02) return 'quiet';
  if (p < 0.06) return 'some danger';
  if (p < 0.12) return 'real danger';
  if (p < 0.25) return 'grave danger';
  return 'the net is closing';
}

export function moodWords(loyalty) {
  if (loyalty >= 80) return 'would die for you';
  if (loyalty >= 65) return 'steady';
  if (loyalty >= 50) return 'content, for now';
  if (loyalty >= 40) return 'grumbling';
  return 'counting the reward';
}

export function rankWords(legend) {
  if (legend >= 80) return 'Public Enemy Number One';
  if (legend >= 60) return 'on every front page';
  if (legend >= 35) return 'known in six states';
  if (legend >= 15) return 'a name in the local papers';
  return 'nobody, yet';
}

/** The month's danger at home, broken down, as the engine will roll it. */
export function homeRisk(s, { lyingLow = false } = {}) {
  const parts = {
    police: localRisk(s, s.at, { lyingLow }),
    bureau: fedRisk(s, { lyingLow }),
    informers: informRisk(s),
    friend: friendRisk(s, s.t),
  };
  const total = 1 - Object.values(parts).reduce((a, p) => a * (1 - p), 1);
  return { ...parts, total };
}

/** One job, forecast from the same formulas the resolver uses. */
export function jobForecast(s, town, { bold = false, car = 'stolen' } = {}) {
  const k = K(s);
  const vault = vaultCash(s, town);
  const crew = Math.min(1, (s.men.length + 1) / 4);
  const mult = crew * (bold ? 1 : k.quietTake);
  const lo = Math.round(vault * k.takeShare[0] * mult), hi = Math.round(vault * k.takeShare[1] * mult);
  const cross = town.state !== s.at;
  const heatAfter = Math.min(100, s.heat[town.state] + k.heatJob + (bold ? k.heatBold : 0));
  const shoot = shootChance(s, town, bold);
  const tonight = getawayRisk(s, town.state, heatAfter, cross, s.t, car);
  const street = town.guard ? sceneChance(s, town) : 0;
  // The month at home after, as the job leaves things: the heat in that state, the
  // Bureau's file and the reward grown by this job (expected take, expected killing).
  const kc = s.t >= k.kcMassacre ? k.fedKcBoost : 1;
  const mid = (lo + hi) / 2;
  const kill = shoot * killChance(s);
  const legendGain = (mid / 1000) * k.legendPerThousand + kill * k.legendKill;
  const own = car === 'own' && s.car?.v8;
  const fedGain = kc * (k.fedJob + kill * k.fedKill * (1 + k.shootLawman) + legendGain * k.fedLegend + (own ? k.fedPlates : cross ? k.fedDyer : 0));
  const after = {
    ...s,
    heat: { ...s.heat, [town.state]: Math.min(100, heatAfter + kill * k.heatKill) },
    fed: Math.min(100, s.fed + fedGain),
    legend: Math.min(100, s.legend + legendGain),
  };
  const homeAfter = homeRisk(after).total;
  return {
    town, cross, lo, hi, yours: [Math.round(lo * k.leaderShare), Math.round(hi * k.leaderShare)], homeAfter,
    all: 1 - (1 - street) * (1 - tonight) * (1 - homeAfter),
    shoot, kill: shoot * killChance(s), street, tonight,
    caught: 1 - (1 - street) * (1 - tonight),
    radio: radioIn(s, town.state),
    breaksStPaul: town.state === 'mn' && stPaulHolds(s),
    drained: vault < town.cash * 0.6,
  };
}

/** The banks within a drive of home, best first by the take you keep against the risk. */
export function jobList(s, opts = {}) {
  const reach = [s.at, ...neighbours(s.at)];
  return TOWNS.filter((t) => reach.includes(t.state))
    .map((t) => jobForecast(s, t, opts))
    .sort((a, b) => (b.yours[0] + b.yours[1]) * (1 - b.all) - (a.yours[0] + a.yours[1]) * (1 - a.all));
}

/** Where the gang could live, with the month's danger there. */
export function homes(s) {
  return STATES.map((st) => {
    const t = { ...s, at: st.id };
    const r = homeRisk(t, { lyingLow: true });
    return {
      id: st.id, name: st.name, here: st.id === s.at, risk: r.total,
      stPaul: stPaulHolds(s, st.id), radio: radioIn(s, st.id), heat: s.heat[st.id],
      cost: st.id === s.at ? K(s).lieLowCost : K(s).lieLowCost + K(s).moveCost,
      girlsCity: s.girl && !s.girl.taken && s.girl.city === st.id && s.girl.warnedAt != null,
    };
  });
}

/** Can you leave, and what are your odds over the quiet months? */
export function leaving(s) {
  const k = K(s);
  const p = recogRisk(s);
  const survive = (1 - p) ** k.disappearMonths;
  return {
    need: k.disappearNeed, have: s.cash, ready: s.cash >= k.disappearNeed,
    surgery: s.surgery, surgeryCost: k.surgeryCost, surgeryDeath: k.surgeryDeath,
    monthly: p, survive, months: k.disappearMonths,
    talkers: s.men.filter((m) => m.loyalty < 50).map((m) => m.name),
  };
}

/** The papers this month: history in the month it happened, then you, then the country. */
export function papers(s) {
  const out = HISTORY.filter((h) => h.t === s.t).map((h) => ({ kind: 'history', text: h.text }));
  const lastJob = [...s.log].reverse().find((l) => l.t === s.t - 1 && / \$[\d,]+/.test(l.text));
  if (lastJob) {
    const town = lastJob.text.split(':')[0];
    const killed = /killed/.test(lastJob.text);
    out.push({ kind: 'you', text: (killed ? ABOUT_YOU.jobKilled : ABOUT_YOU.job).replace('{town}', town) });
    if (s.legend >= 35) out.push({ kind: 'you', text: ABOUT_YOU.rank.replace('{town}', town).replace('{name}', s.me.name) });
  }
  if (out.length < 2) out.push({ kind: 'country', text: streamFor(s.seed, s.t, 'filler').pick(FILLER) });
  return out;
}

/** Everything the hub screen shows. */
export function view(s) {
  const k = K(s);
  const ph = phase(s);
  const d = dateOf(s.t);
  const risk = homeRisk(s);
  const st = stateById(s.at);
  return {
    date: dateName(s.t), year: d.year, turn: s.t, turnsLeft: TURNS - s.t,
    phase: ph, phaseLabel: PHASE[ph].label, phaseWords: PHASE[ph].words,
    me: { ...s.me, skillName: SKILLS[s.me.skill] },
    home: st.name, homeId: s.at, stPaul: stPaulHolds(s, s.at),
    stPaulEndsIn: stPaulHolds(s, s.at) ? k.stPaulEnds - s.t : 0,
    cash: s.cash, reward: reward(s), rank: rankWords(s.legend), legend: Math.round(s.legend),
    sympathy: Math.round(s.sympathy), fed: Math.round(s.fed),
    risk, riskWords: riskWords(risk.total),
    men: s.men.map((m) => ({ ...m, mood: moodWords(m.loyalty), bonusDone: m.bonusAt === s.t })),
    girl: s.girl ? { ...s.girl, cityName: FRIEND_CITY[s.girl.city], warned: s.girl.warnedAt != null && !s.girl.taken } : null,
    canGirl: !s.girl && !!FRIEND_CITY[s.at],
    car: s.car, v8Cost: k.v8Cost, hireCost: k.hireCost, canHire: s.men.length < k.hireMax,
    leaving: leaving(s), papers: papers(s),
    log: s.log.filter((l) => l.t >= s.t - 1),
    family: s.family, familyFound: s.familyFound,
  };
}

/** The end: how it ended, and what it scores. */
export function ending(s) {
  const o = s.outcome;
  const months = Math.min(o.t + 1, TURNS);
  const score = Math.round(months * 100 + (o.kind === 'disappeared' ? 5000 + s.cash / 10 : 0) + s.legendPeak * 20 - s.stats.killed * 300);
  const title = {
    disappeared: 'Gone',
    killed: 'Dead',
    captured: 'Taken',
    sold: 'Sold',
    atlarge: 'Never free',
  }[o.kind];
  return {
    title, how: o.how, when: dateName(Math.min(o.t, TURNS - 1)), months, score,
    jobs: s.stats.jobs, take: s.stats.take, kept: o.kind === 'disappeared' ? s.cash : 0,
    killed: s.stats.killed, lawmen: s.stats.lawmen, menDead: s.stats.menDead,
    peak: rankWords(s.legendPeak), won: o.kind === 'disappeared',
  };
}
