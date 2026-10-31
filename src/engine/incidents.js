// Incidents: one question a month at most, answered before the month's action.
// The table is src/data/incidents.data.js. This module binds one, words each
// option's stakes from its effects, and applies the answer. An unknown effect
// key is an error, so nothing in the table can be decoration.
import { INCIDENTS } from '../data/incidents.data.js';
import { FIRST, LAST } from '../data/gang.data.js';
import { TOWNS, neighbours } from '../data/world.data.js';
import { K, stateById } from './state.js';

const KNOWN = new Set(['cash', 'sympathy', 'heatHome', 'fed', 'legend', 'loyaltyAll', 'loyaltyMan', 'manLeaves', 'recruit', 'tip', 'chance', 'manDies']);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`;

function helpers(s, rng) {
  return {
    homeName: stateById(s.at).name,
    oneMan: (pred) => {
      const xs = s.men.filter(pred);
      if (!xs.length) return null;
      const m = rng.pick(xs);
      return { man: m.id, manName: m.name };
    },
    nearTown: () => {
      const reach = [s.at, ...neighbours(s.at)];
      const xs = TOWNS.filter((t) => reach.includes(t.state) && t.state !== 'mn');
      if (!xs.length) return null;
      const t = rng.pick(xs);
      return { town: t.id, townName: t.name };
    },
  };
}

/** Maybe a question for the month just begun. */
export function rollIncident(s, rng) {
  const k = K(s);
  if (s.outcome || s.pending || !(k.incidentChance > 0)) return;
  if (s.t - (s.lastIncident ?? -9) < k.incidentGap) return;
  if (!rng.chance(k.incidentChance)) return;
  const h = helpers(s, rng);
  const open = rng.shuffle(INCIDENTS.filter((inc) => (s.seen?.[inc.id] ?? -99) < s.t - 8));
  for (const inc of open) {
    const b = inc.when(s, h);
    if (!b) continue;
    s.pending = { id: inc.id, b };
    s.lastIncident = s.t;
    s.seen = { ...(s.seen ?? {}), [inc.id]: s.t };
    return;
  }
}

/** Words for what an option does, from its effects. */
export function stakes(effects, b = {}) {
  const out = [];
  for (const [key, v] of Object.entries(effects)) {
    if (!KNOWN.has(key)) throw new Error(`Unknown incident effect: ${key}`);
    if (key === 'cash') out.push(v < 0 ? `costs ${money(-v)}` : `${money(v)}`);
    if (key === 'sympathy') out.push(v > 0 ? 'the public warms to you' : 'the public turns');
    if (key === 'heatHome') out.push(v < 0 ? 'the police at home cool off' : 'the police at home look harder');
    if (key === 'fed') out.push(v > 0 ? 'the Bureau\'s file grows' : 'the Bureau\'s file shrinks');
    if (key === 'legend') out.push(v > 0 ? 'your name grows' : 'your name fades');
    if (key === 'loyaltyAll') out.push(v > 0 ? 'the gang warms' : 'the gang sours');
    if (key === 'loyaltyMan') out.push(`${b.manName ?? 'he'} ${v > 0 ? 'warms to you' : 'sours'}`);
    if (key === 'manLeaves') out.push(`${b.manName} goes home, loyal`);
    if (key === 'recruit') out.push('one more man');
    if (key === 'tip') out.push(`a bigger take at ${b.townName}, this month or next`);
    if (key === 'manDies') out.push(`${b.manName} dies`);
    if (key === 'chance') {
      const win = stakes(v.win, b).join(', ') || 'no harm', lose = stakes(v.lose, b).join(', ') || 'nothing';
      out.push(`${Math.round(v.p * 100)}%: ${win}; otherwise ${lose}`);
    }
  }
  return out;
}

/** The pending question, worded, with what each option costs and whether you can pay. */
export function pendingView(s) {
  if (!s.pending) return null;
  const inc = INCIDENTS.find((x) => x.id === s.pending.id);
  const b = s.pending.b;
  return {
    id: inc.id, text: inc.text(b),
    options: inc.options.map((o) => ({
      id: o.id, label: o.label, stakes: stakes(o.effects, b),
      afford: s.cash >= -(o.effects.cash ?? 0),
    })),
  };
}

function apply(s, e, b, rng, note) {
  const k = K(s);
  const man = s.men.find((m) => m.id === b.man);
  for (const [key, v] of Object.entries(e)) {
    if (!KNOWN.has(key)) throw new Error(`Unknown incident effect: ${key}`);
    if (key === 'cash') s.cash = Math.max(0, s.cash + v);
    if (key === 'sympathy') s.sympathy = clamp(s.sympathy + v, 0, 100);
    if (key === 'heatHome') s.heat[s.at] = clamp(s.heat[s.at] + v, 0, 100);
    if (key === 'fed') s.fed = clamp(s.fed + v, 0, 100);
    if (key === 'legend') { s.legend = clamp(s.legend + v, 0, 100); s.legendPeak = Math.max(s.legendPeak, s.legend); }
    if (key === 'loyaltyAll') for (const m of s.men) m.loyalty = clamp(m.loyalty + v, 0, 100);
    if (key === 'loyaltyMan' && man) man.loyalty = clamp(man.loyalty + v, 0, 100);
    if (key === 'manLeaves' && man) {
      s.men = s.men.filter((m) => m !== man);
      s.formerMen = [...(s.formerMen ?? []), { name: man.name, loyalty: Math.max(man.loyalty, 80), t: s.t }];
      note(`${man.name} went home to his mother's farm.`);
    }
    if (key === 'manDies' && man) {
      s.men = s.men.filter((m) => m !== man);
      s.stats.menDead += 1;
      note(`${man.name} died of the wound.`);
    }
    if (key === 'recruit' && s.men.length < k.hireMax) {
      const taken = new Set(s.men.map((m) => m.name));
      let name;
      do { name = `${rng.pick(FIRST)} ${rng.pick(LAST)}`; } while (taken.has(name));
      s.men.push({ id: s.nextId++, name, loyalty: v });
      note(`${name} joined the gang.`);
    }
    if (key === 'tip') s.tip = { town: b.town, t: s.t };
    if (key === 'chance') {
      const won = rng.chance(v.p);
      apply(s, won ? v.win : v.lose, b, rng, note);
    }
  }
}

/** Answer the pending question. Free: no time passes. */
export function answer(s, optionId, rng, note) {
  const inc = INCIDENTS.find((x) => x.id === s.pending.id);
  const opt = inc.options.find((o) => o.id === optionId);
  if (!opt) throw new Error('That is not one of the answers.');
  if (s.cash < -(opt.effects.cash ?? 0)) throw new Error('Not enough money for that.');
  note(`${inc.text(s.pending.b)} You: ${opt.label.charAt(0).toLowerCase()}${opt.label.slice(1)}.`);
  apply(s, opt.effects, s.pending.b, rng, note);
  s.pending = null;
}

