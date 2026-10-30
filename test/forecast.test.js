// The plan screen's odds are the resolver's odds: over many real jobs, the
// forecast chance of being taken that month matches how often it happens.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playGame } from '../sim/bot.js';
import { act } from '../src/engine/month.js';
import { jobForecast, homeRisk } from '../src/engine/derive.js';
import { townById } from '../src/engine/state.js';

test('the forecast for a job matches the outcome over 600 games', () => {
  let predicted = 0, happened = 0, n = 0;
  for (let i = 0; i < 600; i++) {
    playGame(1 + i * 7919, 'careful', {}, (s, a) => {
      if (a.kind !== 'job') return;
      const f = jobForecast(s, townById(a.town), { bold: a.bold, car: a.car });
      const after = act(s, a);
      predicted += f.all;
      happened += after.outcome && after.outcome.kind !== 'disappeared' ? 1 : 0;
      n++;
    });
  }
  const p = predicted / n, h = happened / n;
  const se = Math.sqrt((h * (1 - h)) / n);
  console.log(`jobs ${n}: forecast ${(100 * p).toFixed(1)}%, happened ${(100 * h).toFixed(1)}% (2 SE ${(200 * se).toFixed(1)})`);
  assert.ok(Math.abs(p - h) < 2.5 * se, `forecast ${p} vs happened ${h}`);
});

test('the month screen\'s danger matches the outcome for months lying low at home', () => {
  let predicted = 0, happened = 0, n = 0;
  for (let i = 0; i < 1500; i++) {
    playGame(1 + i * 7919, 'timid', {}, (s, a) => {
      if (a.kind !== 'lielow' || a.where !== s.at) return;
      predicted += homeRisk(s, { lyingLow: true }).total;
      const after = act(s, a);
      happened += after.outcome && after.t === s.t ? 1 : 0;
      n++;
    });
  }
  const p = predicted / n, h = happened / n;
  const se = Math.sqrt(Math.max(h * (1 - h), 1 / n) / n);
  console.log(`months lying low ${n}: forecast ${(100 * p).toFixed(1)}%, happened ${(100 * h).toFixed(1)}% (2 SE ${(200 * se).toFixed(1)})`);
  assert.ok(n > 300);
  assert.ok(Math.abs(p - h) < 2.5 * se, `forecast ${p} vs happened ${h}`);
});
