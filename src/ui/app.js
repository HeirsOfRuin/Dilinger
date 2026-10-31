// The screens. Every number comes from src/engine/derive.js; this file formats
// and wires buttons, nothing more. One render function per screen; a click on
// anything with data-a runs that action and re-renders.
import { newGame, K } from '../engine/state.js';
import { act } from '../engine/month.js';
import { view, jobList, jobForecast, homes, leaving, ending, money, pct, riskWords, moodWords } from '../engine/derive.js';
import { readFamilyCode, inheritance } from '../engine/family.js';
import { SAVE_KEY, toSave, fromSave, saveCode, readSaveCode } from '../engine/save.js';
import { lsGet, lsSet, lsDel, STORAGE_OK } from './storage.js';
import { mapSvg } from './map.js';
import { SKILLS } from '../data/gang.data.js';
import { CONFIG } from '../data/config.data.js';
import { dateName, TURNS } from '../data/world.data.js';
import { townById } from '../engine/state.js';

const app = document.getElementById('app');
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let s = null; // the game
let ui = { screen: 'title', tab: 'month', plan: { town: null, bold: false, car: 'stolen' }, create: { skill: 'nerve', family: null, famError: '' }, night: null, toast: '' };

function save() { if (s) lsSet(SAVE_KEY, toSave(s)); }
function loadSaved() { const t = lsGet(SAVE_KEY); if (!t) return null; try { return fromSave(t); } catch { return null; } }

function play(action) {
  const before = s;
  try {
    s = act(s, action);
  } catch (e) {
    toast(e.message);
    return false;
  }
  save();
  if (s.t !== before.t || s.outcome) {
    ui.night = { t: before.t, kind: action.kind, lines: s.log.slice(before.log.length).map((l) => l.text) };
    ui.screen = 'night';
  }
  return true;
}

function toast(text) {
  ui.toast = text;
  render();
  setTimeout(() => { if (ui.toast === text) { ui.toast = ''; render(); } }, 3200);
}

// ---------- pieces ----------

function bar(v) {
  return `<div class="bar">
    <div class="date"><span>${esc(v.date)}</span><span class="who">${esc(v.me.name)}</span></div>
    <div class="stats"><span>Cash <b>${money(v.cash)}</b></span><span>Reward <b>${money(v.reward)}</b></span><span>Home <b>${esc(v.home)}</b></span><span><b>${v.turnsLeft}</b> months to 1935</span>
    <button class="help-link" data-a="help">How it works</button></div>
  </div>`;
}

function tabs() {
  const t = (id, label) => `<button data-a="tab" data-v="${id}" aria-current="${ui.tab === id}">${label}</button>`;
  return `<nav class="tabs">${t('month', 'Month')}${t('map', 'Map')}${t('gang', 'Gang')}${t('papers', 'Papers')}</nav>`;
}

const riskClass = (p) => (p < 0.02 ? 'r0' : p < 0.06 ? 'r1' : p < 0.12 ? 'r2' : p < 0.25 ? 'r3' : 'r4');

function riskCard(v) {
  const r = v.risk;
  return `<div class="card">
    <div class="risk"><span class="small">This month at home</span><span class="big ${riskClass(r.total)}">${esc(v.riskWords)}</span></div>
    <div class="forecast">
      <div class="line"><span>Police in ${esc(v.home)}</span><span>${pct(r.police)}</span></div>
      <div class="line"><span>The Bureau</span><span>${pct(r.bureau)}</span></div>
      <div class="line"><span>Someone selling you (reward ${money(v.reward)})</span><span>${pct(r.informers)}</span></div>
      ${r.friend ? `<div class="line"><span class="blood">${esc(v.girl.friend)}</span><span class="blood">${pct(r.friend)}</span></div>` : ''}
      ${r.keeper ? `<div class="line"><span>The lodge keeper, who reads the papers</span><span>${pct(r.keeper)}</span></div>` : ''}
      <div class="line"><span>Taken this month, all told</span><span>${pct(r.total)}</span></div>
    </div>
    <p class="small">Lying low cuts the police and the Bureau. ${v.stPaul ? `St. Paul's police shelter you for ${v.stPaulEndsIn} more month${v.stPaulEndsIn === 1 ? '' : 's'}: no jobs in Minnesota.` : ''}</p>
  </div>`;
}

// ---------- screens ----------

function title() {
  const saved = loadSaved();
  return `<div class="title">
    <h1>Public Enemy</h1>
    <div class="sub">The Midwest, May 1933 to December 1934.<br>The law learns faster than you do.</div>
    <div class="rule"></div>
  </div>
  ${saved && !saved.outcome ? `<button class="btn block" data-a="continue">Continue: ${esc(saved.me.name)}, ${esc(dateName(saved.t))}</button>` : ''}
  <button class="btn block ${saved && !saved.outcome ? 'secondary' : ''}" data-a="new">New game</button>
  <details style="margin-top:14px"><summary>Load a save code</summary>
    <textarea id="loadcode" placeholder="PE1...."></textarea>
    <button class="btn small" data-a="loadcode">Load</button>
  </details>
  ${STORAGE_OK ? '' : '<p class="small warn">This browser will not keep a save. Use the save code under Papers to carry a game over.</p>'}
  <p class="small" style="margin-top:20px">A fictional robber among real ones. Bank robbers, agents and the people they killed are named from the record; your crimes are your own.</p>`;
}

function create() {
  const c = ui.create;
  const inh = c.family ? inheritance(c.family, CONFIG) : null;
  const skill = inh ? inh.skill : c.skill;
  const skills = Object.entries(SKILLS).map(([id, name]) => {
    const what = { drive: 'A third fewer caught on the road home.', gun: 'You end a shooting before it kills: half as many dead in the banks.', nerve: 'A quarter fewer taken in the street before the cars get away.' }[id];
    return `<button class="choice" data-a="skill" data-v="${id}" aria-pressed="${skill === id}" ${inh ? 'disabled' : ''}><b>${esc(name)}</b><span>${what}</span></button>`;
  }).join('');
  return `<h1>Who you are</h1>
  <div class="names"><label>Your name<input id="myname" maxlength="28" value="${esc(c.name ?? (inh ? `John ${inh.last}` : ''))}" placeholder="${inh ? `John ${esc(inh.last)}` : 'Jack Harlan'}"></label></div>
  <h2>Your best skill</h2>
  ${inh ? `<p class="small">You take after your grandfather: ${esc(SKILLS[inh.skill])}.</p>` : ''}
  ${skills}
  <h2>Family</h2>
  ${inh ? `<div class="card"><b>Grandson of ${esc(inh.founder)}</b><p class="small">${[
    inh.cash ? `${money(inh.cash)} left of his money` : 'nothing left of his money',
    inh.heirloom ? `his ${esc(inh.heirloom)} in a trunk` : '',
    inh.loyalFriend ? `a friend's grandson rides with you` : '',
    inh.sympathy > 0 ? 'the papers will call you a folk hero\'s grandson' : inh.sympathy < 0 ? 'the papers will call you a murderer\'s grandson' : '',
    inh.lawGrudge ? 'a lawman\'s family remembers the name' : '',
    inh.informers ? 'the grandsons of men who sold him are about' : '',
  ].filter(Boolean).join('; ')}.</p><button class="btn small secondary" data-a="nofamily">Play without him</button></div>`
    : `<p class="small">A <i>Dead or Alive</i> outlaw who got away left a family code. Paste it to play his grandson.</p>
  <textarea id="famcode" placeholder="DOAFAM1...."></textarea>
  ${c.famError ? `<p class="small blood">${esc(c.famError)}</p>` : ''}
  <button class="btn small secondary" data-a="readfamily">Read the code</button>`}
  <button class="btn block" data-a="start">Begin: May 1933, Indiana</button>
  <button class="btn block secondary" data-a="title">Back</button>`;
}

function hub(v) {
  const girl = v.girl;
  return `${bar(v)}
  <div class="phase ${v.phase}">${esc(v.phaseLabel)}</div>
  ${girl?.warned && v.homeId === girl.city ? `<div class="warning"><b>${esc(girl.name)} is worried.</b> ${esc(girl.friend)} has been asking about the reward, and about her own papers. Every month you stay in ${esc(girl.cityName)}, she may sell you.</div>` : ''}
  ${v.pending ? `<div class="card incident"><span class="t">Before anything else</span><p>${esc(v.pending.text)}</p>
    ${v.pending.options.map((o) => `<button class="choice" data-a="answer" data-v="${o.id}" ${o.afford ? '' : 'disabled'}><b>${esc(o.label)}</b><small>${esc(o.stakes.join(' · ') || 'nothing changes')}${o.afford ? '' : ' · you cannot afford it'}</small></button>`).join('')}
  </div>` : ''}
  ${riskCard(v)}
  ${v.pending ? '' : `<div class="card"><h3>This month</h3>
    <button class="btn block" data-a="plan">Plan a job</button>
    <button class="btn block secondary" data-a="lielow">Lie low ${v.lodge ? 'at the lodge' : `in ${esc(v.home)}`} (${money(K(s).lieLowCost)} beyond living)</button>
    <button class="btn block secondary" data-a="screen" data-v="move">Move the gang</button>
    <button class="btn block secondary" data-a="screen" data-v="leave">Get out: a new face, a new name</button>
  </div>`}
  <div class="card"><h3>The car</h3>
    ${v.car.v8 ? '<p>A Ford V-8 of your own, bought under another name. It outruns most police cars; the Bureau can trace its plates.</p>'
      : `<p>You steal a car for every job. A stolen car over a state line is a federal crime.</p><button class="btn small" data-a="buy" ${v.cash < v.v8Cost ? 'disabled' : ''}>Buy a Ford V-8 (${money(v.v8Cost)})</button>`}
  </div>
  <h2>The papers</h2>
  <ul class="events">${v.papers.map((p) => `<li class="${p.kind === 'history' ? 'history' : p.kind === 'you' ? 'warn' : ''}">${esc(p.text)}</li>`).join('')}</ul>
  ${tabs()}`;
}

function plan(v) {
  const p = ui.plan;
  const list = jobList(s, { bold: p.bold, car: p.car });
  const pick = p.town ? jobForecast(s, townById(p.town), { bold: p.bold, car: p.car }) : null;
  const row = (f) => `<button class="job" data-a="pick" data-v="${f.town.id}" aria-pressed="${p.town === f.town.id}">
    <div class="row"><b>${esc(f.town.name)}</b><span>${money(f.yours[0])}-${money(f.yours[1])} yours</span></div>
    <small>${f.cross ? 'over the line from home' : 'in your home state'} · taken this month ${pct(f.all)} · ${f.radio ? 'police radio' : 'no radio'}${f.drained ? ' · robbed lately' : ''}${f.breaksStPaul ? ' · breaks St. Paul' : ''}</small>
  </button>`;
  return `${bar(v)}<h1>Plan a job</h1>
  <p class="small">Banks within a drive of ${esc(v.home)}. The gang drives home after: a bank over the line means crossing it tonight. ${v.phase === 'armed' ? 'Since June the line shakes nobody that matters.' : 'Local police stop at the line.'}</p>
  <div class="seg" style="margin:8px 0"><button data-a="bold" data-v="0" aria-pressed="${!p.bold}">Quiet</button><button data-a="bold" data-v="1" aria-pressed="${p.bold}">Guns out</button>
  ${s.car.v8 ? `<button data-a="car" data-v="own" aria-pressed="${p.car === 'own'}">Your V-8</button><button data-a="car" data-v="stolen" aria-pressed="${p.car === 'stolen'}">A stolen car</button>` : ''}</div>
  ${list.map(row).join('')}
  ${pick ? `<div class="card"><h3>${esc(pick.town.name)}</h3><div class="forecast">
    <div class="line"><span>The take (yours)</span><span>${money(pick.lo)}-${money(pick.hi)} (${money(pick.yours[0])}-${money(pick.yours[1])})</span></div>
    <div class="line"><span>A shooting</span><span>${pct(pick.shoot)}</span></div>
    <div class="line"><span>Someone dies on the floor</span><span>${pct(pick.kill)}</span></div>
    <div class="line"><span>Taken in the street</span><span>${pct(pick.street)}</span></div>
    <div class="line"><span>Caught on the road tonight</span><span>${pct(pick.tonight)}</span></div>
    <div class="line"><span>Then the month at home${pick.cross ? '' : ', with the heat at your door'}</span><span>${pct(pick.homeAfter)}</span></div>
    <div class="line"><span>Taken this month, all told</span><span>${pct(pick.all)}</span></div>
    </div>
    ${pick.breaksStPaul ? '<p class="small blood">A job in Minnesota ends the St. Paul arrangement for good.</p>' : ''}
    <button class="btn block danger" data-a="dojob">Do it</button></div>` : ''}
  <button class="btn block secondary" data-a="back">Back</button>`;
}

function night(v) {
  const n = ui.night;
  const ended = !!s.outcome;
  return `${ended ? '' : bar(v)}<div class="paper"><div class="masthead">${esc(dateName(n.t))}</div>
    <ul class="events">${n.lines.map((l) => `<li class="${/killed|died|shot|taken|sold|raid|want you/.test(l) ? 'bad' : /asking/.test(l) ? 'warn' : ''}">${esc(l)}</li>`).join('') || '<li>A quiet month.</li>'}</ul>
    ${ended ? `<p class="headline">${esc(s.outcome.how)}</p>` : ''}
  </div>
  <button class="btn block" data-a="${ended ? 'end' : 'back'}">${ended ? 'How it ended' : `On to ${esc(v.date)}`}</button>`;
}

function move(v) {
  const list = homes(s);
  return `${bar(v)}<h1>Move the gang</h1>
  <p class="small">Moving takes the month (you lie low on arrival). The danger shown is a month lying low there.</p>
  ${list.map((h) => `<button class="job" data-a="moveto" data-v="${h.id}" aria-pressed="${h.here}">
    <div class="row"><b>${esc(h.name)}${h.here ? ' (home)' : ''}</b><span>${riskWords(h.risk)}, ${pct(h.risk)}</span></div>
    <small>${money(h.cost)} · ${h.lodge ? 'no police for miles' : `heat ${Math.round(h.heat)} · ${h.radio ? 'police radio' : 'no radio'}`}${h.stPaul ? ' · St. Paul shelters you' : ''}${h.keeper ? ' · the keeper may call the agents' : ''}${h.girlsCity ? ' · her friend is here' : ''}</small></button>`).join('')}
  <button class="btn block secondary" data-a="back">Back</button>`;
}

function leave(v) {
  const l = leaving(s);
  return `${bar(v)}<h1>Get out</h1>
  <p>Leave with ${money(l.need)} or more: a name, a trade, a town where nobody reads the papers. Then ${l.months} quiet months. Each month someone may know your face, and the men you leave know the name you left under.</p>
  <div class="card forecast">
    <div class="line"><span>Cash</span><span>${money(l.have)} of ${money(l.need)}</span></div>
    <div class="line"><span>Recognised in a month</span><span>${pct(l.monthly)}</span></div>
    <div class="line"><span>Through all ${l.months} months</span><span>${pct(l.survive)}</span></div>
    ${l.talkers.length ? `<div class="line"><span>Men who might talk</span><span>${esc(l.talkers.join(', '))}</span></div>` : ''}
  </div>
  ${l.surgery ? '<p class="small">You have a new face.</p>' : `<div class="card"><h3>A new face</h3><p>A back-room doctor: the cleft gone from the chin, the moles burned off. Recognition falls by more than half. ${money(l.surgeryCost)}, and ${pct(l.surgeryDeath)} die under the ether. Takes the month.</p>
    <button class="btn small" data-a="surgery" ${l.have < l.surgeryCost ? 'disabled' : ''}>See the doctor</button></div>`}
  <button class="btn block danger" data-a="disappear" ${l.ready ? '' : 'disabled'}>Disappear now</button>
  <button class="btn block secondary" data-a="back">Back</button>`;
}

function gang(v) {
  return `${bar(v)}<h1>The gang</h1>
  <div class="card"><div class="kv"><dt>You</dt><dd>${esc(v.me.name)}: ${esc(v.me.skillName)}</dd>
    <dt>Known as</dt><dd>${esc(v.rank)}</dd><dt>The public</dt><dd>${v.sympathy >= 55 ? 'on your side' : v.sympathy >= 40 ? 'of two minds' : 'against you'}</dd></div>
    ${v.family ? `<p class="small">Grandson of ${esc(v.family.founder)}${v.familyFound ? ': the papers know it.' : '. The papers have not found the name yet.'}</p>` : ''}</div>
  ${v.men.map((m) => `<div class="man"><div class="row"><span class="name">${esc(m.name)}</span><span class="small">${esc(m.mood)}</span></div>
    ${m.kin ? '<span class="tag">family friend</span>' : ''}
    <div class="btns"><button class="btn small secondary" data-a="bonus" data-v="${m.id}" ${m.bonusDone || v.cash < 250 ? 'disabled' : ''}>Bonus $250</button>
    <button class="btn small secondary" data-a="release" data-v="${m.id}">Send him home</button></div></div>`).join('') || '<p>Nobody rides with you.</p>'}
  ${v.canHire ? `<button class="btn small" data-a="hire" ${v.cash < v.hireCost ? 'disabled' : ''}>Take on a man (${money(v.hireCost)})</button>` : ''}
  <h2>Your girl</h2>
  ${v.girl ? `<div class="card"><b>${esc(v.girl.name)}</b>, ${esc(v.girl.cityName)}. ${v.girl.taken ? 'The agents took her. She will not talk.' : `She rents rooms in her name: home is safer. Her friend ${esc(v.girl.friend)} rents rooms too.`}
    ${v.girl.warned ? `<p class="blood small">${esc(v.girl.friend)} has been asking about the reward. Stay out of ${esc(v.girl.cityName)}.</p>` : ''}</div>`
    : v.canGirl ? '<p class="small">A hat-check girl who does not ask questions. Her rooms make home safer; her friends are another matter.</p><button class="btn small" data-a="girl">Take up with her</button>'
      : '<p class="small">You meet her in a city: live in Illinois (Chicago) or Minnesota (St. Paul).</p>'}
  ${tabs()}`;
}

function mapScreen(v) {
  return `${bar(v)}<h1>The map</h1>${mapSvg(s)}
  <div class="key"><span><i style="background:var(--blood);opacity:.45"></i>heat</span><span>Bold border: home</span><span>Grey dot: robbed lately</span><span>Shelter: St. Paul's arrangement</span></div>
  <p class="small">Robbing over a line puts it between the job and your bed. Police radio makes a state's posses faster.</p>${tabs()}`;
}

function papersScreen(v) {
  const code = saveCode(s);
  return `${bar(v)}<h1>The papers</h1>
  <div class="phase ${v.phase}">${esc(v.phaseLabel)}</div><p>${esc(v.phaseWords)}</p>
  <ul class="events">${v.papers.map((p) => `<li class="${p.kind === 'history' ? 'history' : ''}">${esc(p.text)}</li>`).join('')}</ul>
  <h2>Last month</h2><ul class="events">${v.log.map((l) => `<li><span class="t">${esc(dateName(l.t))}</span>${esc(l.text)}</li>`).join('') || '<li>Nothing.</li>'}</ul>
  <details><summary>Save code</summary><p class="small">Copy this to carry the game to another browser.</p><textarea readonly>${esc(code)}</textarea></details>
  <button class="btn small secondary" data-a="quit" style="margin-top:12px">Back to the title</button>
  ${tabs()}`;
}

function end() {
  const e = ending(s);
  return `<div class="circular ${e.won ? 'won' : 'lost'}"><div class="t">${esc(s.me.name)} · ${esc(e.when)}</div><div class="verdict">${esc(e.title)}</div><p>${esc(e.how)}</p></div>
  <table class="score"><tr><td>Months free</td><td>${e.months} of ${TURNS}</td></tr><tr><td>Jobs</td><td>${e.jobs}</td></tr><tr><td>Taken in all</td><td>${money(e.take)}</td></tr>
  ${e.won ? `<tr><td>Left with</td><td>${money(e.kept)}</td></tr>` : ''}
  <tr><td>Killed in the banks</td><td>${e.killed}${e.lawmen ? ` (${e.lawmen} lawmen)` : ''}</td></tr><tr><td>Your men dead</td><td>${e.menDead}</td></tr>
  <tr><td>At your peak</td><td>${esc(e.peak)}</td></tr><tr><td><b>Score</b></td><td><b>${e.score.toLocaleString('en-US')}</b></td></tr></table>
  <p class="small">${e.won ? 'Most who tried this were dead or in prison by 1936.' : 'Of the men still free at the end of 1934, the Bureau killed or took most within a year.'}</p>
  <button class="btn block" data-a="new">Play again</button><button class="btn block secondary" data-a="title">Title</button>`;
}

function help(v) {
  const k = K(s);
  return `${s ? bar(v) : ''}<h1>How it works</h1>
  <p><b>A month a turn,</b> May 1933 to December 1934. Rob a bank, lie low, or move the gang. The month's danger finds you at home.</p>
  <p><b>The line.</b> The gang drives home after a job. Rob a bank over the line from home and the line is between the job and your bed: local police stop at it. A stolen car taken over a line is federal from the start.</p>
  <p><b>The Bureau</b> learns by date. Until March 1934 it can only watch. After Crown Point it hunts by name. From June 1934 robbing a bank is federal and the agents carry guns: the line no longer helps much, and a catch is more often a killing.</p>
  <p><b>St. Paul</b> shelters a gang that lives there, for a fee, until summer 1934, or until you rob or kill in Minnesota. Still living there when it ends, and the police you paid come for you.</p>
  <p><b>A lodge</b> in the Wisconsin woods has no police for miles. After March 1934 the agents ask at the resorts, and a keeper who reads about the reward may call them.</p>
  <p><b>Your girl</b> makes home safer. If her friend starts asking about the reward, you will be told: leave her city.</p>
  <p><b>Winning</b> is leaving with ${money(k.disappearNeed)} or more and lasting ${k.disappearMonths} quiet months. Careful players manage it about one time in five.</p>
  <button class="btn block" data-a="back">Back</button>`;
}

// ---------- render and wiring ----------

function render() {
  let html;
  const v = s && !s.outcome ? view(s) : s ? view({ ...s, outcome: null }) : null;
  switch (ui.screen) {
    case 'title': html = title(); break;
    case 'create': html = create(); break;
    case 'night': html = night(v); break;
    case 'plan': html = plan(v); break;
    case 'move': html = move(v); break;
    case 'leave': html = leave(v); break;
    case 'help': html = help(v); break;
    case 'end': html = end(); break;
    default:
      html = ui.tab === 'map' ? mapScreen(v) : ui.tab === 'gang' ? gang(v) : ui.tab === 'papers' ? papersScreen(v) : hub(v);
  }
  app.innerHTML = html + (ui.toast ? `<div class="toast" role="status">${esc(ui.toast)}</div>` : '');
  if (ui.screen !== 'night' && ui.screen !== 'create') window.scrollTo?.(0, 0);
}

const HANDLERS = {
  new: () => { ui.screen = 'create'; ui.create = { skill: 'nerve', family: null, famError: '' }; },
  continue: () => { s = loadSaved(); ui.screen = 'hub'; ui.tab = 'month'; },
  loadcode: () => {
    try { s = readSaveCode(document.getElementById('loadcode').value); save(); ui.screen = s.outcome ? 'end' : 'hub'; ui.tab = 'month'; } catch (e) { toast(e.message); }
  },
  title: () => { ui.screen = 'title'; },
  quit: () => { ui.screen = 'title'; },
  skill: (v) => { ui.create.name = document.getElementById('myname')?.value; ui.create.skill = v; },
  readfamily: () => {
    ui.create.name = document.getElementById('myname')?.value;
    try { ui.create.family = readFamilyCode(document.getElementById('famcode').value); ui.create.famError = ''; } catch (e) { ui.create.famError = e.message; }
  },
  nofamily: () => { ui.create.family = null; },
  start: () => {
    const c = ui.create;
    const name = (document.getElementById('myname')?.value || '').trim();
    const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0; // the UI may pick a seed; the engine never does
    s = newGame(seed, {}, { family: c.family ?? undefined, skill: c.family ? undefined : c.skill, name: name || undefined });
    lsDel(SAVE_KEY);
    save();
    ui.screen = 'hub'; ui.tab = 'month'; ui.plan = { town: null, bold: false, car: 'stolen' };
  },
  tab: (v) => { ui.tab = v; ui.screen = 'hub'; },
  screen: (v) => { ui.screen = v; },
  back: () => { ui.screen = s?.outcome ? 'end' : 'hub'; },
  help: () => { ui.prev = ui.screen; ui.screen = 'help'; },
  plan: () => { ui.screen = 'plan'; ui.plan = { town: null, bold: false, car: s.car.v8 ? 'own' : 'stolen' }; },
  pick: (v) => { ui.plan.town = v; },
  bold: (v) => { ui.plan.bold = v === '1'; },
  car: (v) => { ui.plan.car = v; },
  dojob: () => { play({ kind: 'job', town: ui.plan.town, bold: ui.plan.bold, car: ui.plan.car }); },
  lielow: () => { play({ kind: 'lielow', where: s.lodge ? 'lodge' : s.at }); },
  moveto: (v) => { play({ kind: 'lielow', where: v }); },
  surgery: () => { play({ kind: 'surgery', where: s.at }); },
  disappear: () => { play({ kind: 'disappear' }); },
  buy: () => { if (play({ kind: 'buy', item: 'v8' })) toast('A Ford V-8, bought under another name.'); },
  hire: () => { if (play({ kind: 'hire' })) toast(`${s.men.at(-1).name} joined the gang.`); },
  bonus: (v) => { play({ kind: 'bonus', man: Number(v), amount: 250 }); },
  release: (v) => { play({ kind: 'release', man: Number(v) }); },
  girl: () => { if (play({ kind: 'girl' })) toast(`You took up with ${s.girl.name}.`); },
  answer: (v) => { if (play({ kind: 'answer', option: v })) toast(s.log.at(-1)?.text.split('. You: ').pop() ?? 'Done.'); },
  end: () => { ui.screen = 'end'; },
};

app.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-a]');
  if (!el || el.disabled) return;
  const h = HANDLERS[el.dataset.a];
  if (!h) return;
  ui.toast = '';
  h(el.dataset.v);
  render();
});

const saved = loadSaved();
if (saved && saved.outcome) lsDel(SAVE_KEY);
// For the smoke test: read-only access to the game in play.
globalThis.__pe = { get state() { return s; }, get screen() { return ui.screen; } };
render();
