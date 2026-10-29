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
  act(s, { kind: 'job', town: 'daleville', bold: false, cross: 'oh' });
  assert.deepEqual(s, copy);
});

test('no number goes bad over 300 games of every policy', () => {
  for (const pol of Object.keys(POLICIES)) {
    for (let i = 0; i < 300; i++) {
      const s = playGame(1 + i * 31, pol);
      const nums = [s.cash, s.fed, s.legend, s.sympathy, ...Object.values(s.heat), ...s.men.map((m) => m.loyalty)];
      assert.ok(nums.every(Number.isFinite), `${pol} seed ${i}: non-finite`);
      assert.ok(s.cash >= 0, `${pol} seed ${i}: negative cash`);
      assert.ok(s.outcome && s.outcome.t <= 20, `${pol} seed ${i}: no ending`);
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
  assert.throws(() => act(s, { kind: 'job', town: 'daleville', cross: 'mn' }), /not over the line/);
  assert.throws(() => act(s, { kind: 'disappear' }), /Not enough money/);
  assert.throws(() => act(s, { kind: 'fly' }), /Unknown action/);
});
