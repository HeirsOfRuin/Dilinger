// The phone test: play whole games through the real screens at 390 x 844, the
// way a player would, and fail on anything a player would hit: a script error, a
// page wider than the phone, a button too small to tap, a screen that never
// appears, a save that does not come back.
//   node tools/smoke.mjs [games=6]      screenshots go to $SHOTS (default /tmp/pe-shots)
const PW = process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright/index.js';
const pw = await import(PW);
const chromium = pw.chromium || pw.default?.chromium;
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const GAMES = Number(process.argv[2] || 6);
const SHOTS = process.env.SHOTS || '/tmp/pe-shots';
await mkdir(SHOTS, { recursive: true });
const FILE = 'file://' + resolve('dist/public-enemy.html');
const FAMILY = (await readFile(resolve('test/fixtures/family-v1.txt'), 'utf8')).trim();

const problems = [];
const seen = new Set();
const check = (label, ok) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`); if (!ok) problems.push(label); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|net::|ERR_/.test(m.text())) errors.push(m.text()); });

const screen = () => page.evaluate(() => globalThis.__pe.screen);
const state = () => page.evaluate(() => globalThis.__pe.state);
const has = async (sel) => (await page.locator(sel).count()) > 0;
const click = async (sel) => { await page.locator(sel).first().click(); };

/** Every screen: no sideways scroll, every button tappable. Screenshot each kind once. */
async function inspect(name) {
  const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (wide) problems.push(`${name}: wider than the phone`);
  const small = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => {
    const r = b.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.height < 32;
  }).map((b) => b.textContent.trim()).slice(0, 3));
  if (small.length) problems.push(`${name}: buttons under 32px tall: ${small.join(', ')}`);
  if (!seen.has(name)) {
    seen.add(name);
    await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
  }
}

await page.goto(FILE);
await inspect('title');
check('the title screen offers a new game', await has('[data-a="new"]'));

// One game with the family code, the rest without.
let ended = 0, won = 0, months = 0;
for (let g = 0; g < GAMES; g++) {
  await page.goto(FILE);
  await click('[data-a="new"]');
  await inspect('create');
  if (g === 0) {
    await page.fill('#famcode', FAMILY);
    await click('[data-a="readfamily"]');
    check('a Dead or Alive family code is read on the creation screen', await has('text=Grandson of'));
    await inspect('create-family');
  } else {
    await page.fill('#myname', `Jack Harlan ${g}`);
    await click(`[data-a="skill"][data-v="${['drive', 'gun', 'nerve'][g % 3]}"]`);
  }
  await click('[data-a="start"]');
  check(`game ${g + 1} starts on the month screen`, (await screen()) === 'hub');

  let hubVisits = 0;
  for (let guard = 0; guard < 80; guard++) {
    const sc = await screen();
    if (sc === 'end') break;
    if (sc === 'night') {
      await inspect('night');
      const s = await state();
      await click(s.outcome ? '[data-a="end"]' : '[data-a="back"]');
      continue;
    }
    await inspect('hub');
    hubVisits++;
    const s = await state();
    const v = { t: s.t, cash: s.cash, at: s.at };
    // Visit the other tabs once per game, from the hub.
    if (hubVisits === 2) {
      for (const tab of ['map', 'gang', 'papers']) { await click(`[data-a="tab"][data-v="${tab}"]`); await inspect(tab); }
      await click('[data-a="tab"][data-v="month"]');
    }
    if (hubVisits === 3) { await click('[data-a="help"]'); await inspect('help'); await click('[data-a="back"]'); }
    // A simple player: buy the car, leave when the money is there, flee a warning, rob otherwise.
    if (!s.car.v8 && s.cash > 5000 && await has('[data-a="buy"]:not([disabled])')) { await click('[data-a="buy"]'); continue; }
    const warned = s.girl && s.girl.warnedAt != null && !s.girl.taken && s.at === s.girl.city;
    if (s.cash >= 22500) {
      await click('[data-a="screen"][data-v="leave"]');
      await inspect('leave');
      if (!s.surgery) await click('[data-a="surgery"]'); else await click('[data-a="disappear"]');
      continue;
    }
    if (warned || (guard % 5 === 4)) {
      await click('[data-a="screen"][data-v="move"]');
      await inspect('move');
      await page.locator('[data-a="moveto"][aria-pressed="false"]').first().click();
      continue;
    }
    await click('[data-a="plan"]');
    await page.locator('[data-a="pick"]').first().click();
    await inspect('plan');
    await click('[data-a="dojob"]');
    const after = await state();
    if (after.t === v.t && !after.outcome) problems.push(`game ${g + 1}: a job did not take the month`);
  }
  const s = await state();
  check(`game ${g + 1} reaches an ending (${s.outcome?.kind}: ${s.outcome?.how})`, !!s.outcome && (await screen()) === 'end');
  await inspect('end');
  if (s.outcome) { ended++; months += Math.min(s.outcome.t + 1, 20); if (s.outcome.kind === 'disappeared') won++; }
}

// Saves: start, play a month, reload, continue; then a save code into a fresh browser.
await page.goto(FILE);
await click('[data-a="new"]');
await page.fill('#myname', 'Save Test');
await click('[data-a="start"]');
await click('[data-a="lielow"]');
await click('[data-a="back"]');
const before = await state();
await page.goto(FILE);
check('Continue is offered after a reload', await has('[data-a="continue"]'));
await click('[data-a="continue"]');
const after = await state();
check('Continue brings back the same month and cash', after.t === before.t && after.cash === before.cash && after.me.name === 'Save Test');
await click('[data-a="tab"][data-v="papers"]');
const code = await page.locator('details textarea').inputValue();
const fresh = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await fresh.goto(FILE);
await fresh.locator('details summary').click();
await fresh.fill('#loadcode', code);
await fresh.locator('[data-a="loadcode"]').click();
const loaded = await fresh.evaluate(() => globalThis.__pe.state);
check('a save code carries the game to another browser', loaded?.t === before.t && loaded?.me.name === 'Save Test');

check(`no script errors (${errors.length})`, errors.length === 0);
for (const e of [...new Set(errors)].slice(0, 5)) console.log('   ' + e);
for (const p of [...new Set(problems)].slice(0, 12)) if (!/^game \d+ (starts|reaches)|family|Continue|save code|title/.test(p)) console.log('   ' + p);
console.log(`\n${ended} of ${GAMES} games ended through the screens; ${won} got out; ${(months / Math.max(1, ended)).toFixed(1)} months on average. Screens seen: ${[...seen].join(', ')}`);
console.log(`screenshots: ${SHOTS}`);
await browser.close();
if (problems.length) { console.log(`\n!! ${new Set(problems).size} problem(s)`); process.exit(1); }
console.log('\nthe phone test passed');
