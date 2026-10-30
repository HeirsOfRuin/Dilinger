// The engine's contracts: same seed and choices give the same game; no number
// goes bad; dates fire on their turns.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playGame, POLICIES } from '../sim/bot.js';
import { newGame } from '../src/engine/state.js';
import { act } from '../src/engine/month.js';
import { phase } from '../src/engine/odds.js';
import { CONFIG } from '../src/data/config.data.js';
import { dateName, turnOf } from '../src/data/world.data.js';

test('the same seed and policy give the same game', () => {
  for (const pol of Object.keys(POLICIES)) {
    assert.deepEqual(playGame(42, pol), playGame(42, pol), pol);
  }
});

test('act never changes the state it is given', () => {
  const s = newGame(7);
  const copy = structuredClone(s);
  act(s, { kind: 'job', town: 'daleville', bold: false });
  assert.deepEqual(s, copy);
});

test('no number goes bad over 300 games of every policy', () => {
  for (const pol of Object.keys(POLICIES)) {
    for (let i = 0; i < 300; i++) {
      const s = playGame(1 + i * 31, pol);
      const nums = [s.cash, s.fed, s.legend, s.sympathy, ...Object.values(s.heat), ...s.men.map((m) => m.loyalty)];
      assert.ok(nums.every(Number.isFinite), `${pol} seed ${i}: non-finite`);
      assert.ok(s.cash >= 0, `${pol} seed ${i}: negative cash`);
      assert.ok(s.outcome && s.outcome.t <= 19, `${pol} seed ${i}: no ending`);
    }
  }
});

test('the dates are where the sources put them', () => {
  assert.equal(dateName(0), 'May 1933');
  assert.equal(dateName(CONFIG.kcMassacre), 'June 1933');
  assert.equal(dateName(CONFIG.fdic), 'January 1934');
  assert.equal(dateName(CONFIG.crownPoint), 'March 1934');
  assert.equal(dateName(CONFIG.crimeBills), 'June 1934');
  assert.equal(turnOf(1934, 11), 19);
  const s = newGame(1);
  assert.equal(phase(s, 0), 'early');
  assert.equal(phase(s, CONFIG.crownPoint), 'named');
  assert.equal(phase(s, CONFIG.crimeBills), 'armed');
});

test('bad actions are refused, not guessed at', () => {
  const s = newGame(3);
  assert.throws(() => act(s, { kind: 'job', town: 'mankato' }), /Too far/);
  assert.throws(() => act(s, { kind: 'disappear' }), /Not enough money/);
  assert.throws(() => act(s, { kind: 'fly' }), /Unknown action/);
});

test('St. Paul shelters a gang that lives there, until it breaks the rule or the date passes', async () => {
  const { stPaulHolds, localRisk } = await import('../src/engine/odds.js');
  const s = newGame(5, {}, { at: 'mn' });
  s.heat.mn = 60;
  s.heat.wi = 60;
  assert.ok(stPaulHolds(s));
  assert.ok(localRisk(s, 'mn') < localRisk(s, 'wi') / 5);
  const after = act(s, { kind: 'job', town: 'mankato', bold: false });
  assert.equal(after.stPaulBroken, true);
  assert.equal(stPaulHolds(after), false);
  assert.equal(stPaulHolds(s, 'mn', CONFIG.stPaulEnds), false);
});

test('robbing over the line means crossing on the way home; at home it does not', () => {
  const s = newGame(9);
  const over = act(s, { kind: 'job', town: 'rockford', bold: false });
  const home = act(s, { kind: 'job', town: 'daleville', bold: false });
  assert.equal(over.jobsLog[0].crossed, true);
  assert.equal(home.jobsLog[0].crossed, false);
  if (!over.outcome) assert.equal(over.at, 'in');
});

test('a man still free at the end of 1934 gets an ending from 1935', () => {
  let found = 0;
  for (let i = 0; i < 400 && found < 5; i++) {
    const s = playGame(1 + i * 7919, 'stayer');
    if (s.outcome.t === 19 && /1935/.test(s.outcome.how)) found++;
  }
  assert.ok(found >= 5, 'no epilogue endings found');
});

test('a real Dead or Alive family code is read, and a bad one is refused with a reason', async () => {
  const { readFileSync } = await import('node:fs');
  const { readFamilyCode, inheritance } = await import('../src/engine/family.js');
  const code = readFileSync(new URL('./fixtures/family-v1.txt', import.meta.url), 'utf8');
  const r = readFamilyCode(code);
  assert.equal(r.game, 'dead-or-alive');
  const inh = inheritance(r, CONFIG);
  assert.ok(['drive', 'gun', 'nerve'].includes(inh.skill));
  assert.ok(inh.cash >= 0 && inh.cash <= CONFIG.familyCashCap);
  const s = newGame(11, {}, { family: r });
  assert.ok(s.me.name.endsWith(inh.last), s.me.name);
  assert.equal(s.cash, CONFIG.startCash + inh.cash);
  assert.throws(() => readFamilyCode('OUTLAW1.abc'), /not a family code/);
  assert.throws(() => readFamilyCode('DOAFAM2.abc'), /newer version/);
  assert.throws(() => readFamilyCode('DOAFAM1.!!!!'), /not a family code|damaged/);
});

test('the friend never sells without a warning first, and never outside her city', async () => {
  const { friendRisk } = await import('../src/engine/odds.js');
  const s = newGame(13, {}, { at: 'mn' });
  const g = act(s, { kind: 'girl' });
  assert.equal(g.t, 0, 'taking up with her takes no time');
  assert.equal(friendRisk(g, 5), 0);
  const warned = { ...g, girl: { ...g.girl, warnedAt: 4 } };
  assert.equal(friendRisk(warned, 4), 0, 'not in the month of the warning');
  assert.ok(friendRisk(warned, 5) > 0);
  assert.equal(friendRisk({ ...warned, at: 'wi' }, 5), 0);
  for (let i = 0; i < 400; i++) {
    const end = playGame(1 + i * 7919, 'ignore');
    if (/sold by Mrs/.test(end.outcome.how)) assert.ok(end.girl.warnedAt != null && end.girl.warnedAt < end.outcome.t);
  }
});

test('a V-8 is bought once, costs what the config says, and is needed to drive your own car', () => {
  const s = { ...newGame(17), cash: 5000 };
  const b = act(s, { kind: 'buy', item: 'v8' });
  assert.equal(b.cash, 5000 - CONFIG.v8Cost);
  assert.equal(b.t, 0);
  assert.throws(() => act(b, { kind: 'buy', item: 'v8' }), /already/);
  assert.throws(() => act(newGame(17), { kind: 'job', town: 'daleville', car: 'own' }), /no car/);
});
