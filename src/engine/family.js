// Reading the family code from Dead or Alive (HeirsOfRuin/Wild-West,
// src/engine/dynasty.js). The code is a contract: DOAFAM<version>.<base64 JSON>.
// This reader accepts version 1 and refuses newer ones with a reason.

import { FAMILY_SKILL } from '../data/gang.data.js';

const unb64 = (text) => (typeof atob === 'function' ? decodeURIComponent(escape(atob(text))) : Buffer.from(text, 'base64').toString('utf8'));

export function readFamilyCode(code) {
  const m = String(code).trim().match(/^DOAFAM(\d+)\.([A-Za-z0-9+/=]+)$/);
  if (!m) throw new Error('That is not a family code from Dead or Alive.');
  if (Number(m[1]) > 1) throw new Error('That family code is from a newer version of Dead or Alive.');
  let r;
  try { r = JSON.parse(unb64(m[2])); } catch { throw new Error('That family code is damaged.'); }
  if (r.game !== 'dead-or-alive' || !r.founder?.name) throw new Error('That family code is damaged.');
  return r;
}

/** What a family record gives a grandchild in 1933, as plain numbers. */
export function inheritance(r, k) {
  const f = r.founder;
  const hero = (f.peakLegend ?? 0) >= 40 && (f.townsfolkKilled ?? 0) <= 2;
  const murderer = (f.townsfolkKilled ?? 0) >= 5;
  return {
    last: f.last || String(f.name).split(' ').pop(),
    founder: f.name,
    skill: FAMILY_SKILL[f.takesAfter] ?? 'nerve',
    cash: Math.min(k.familyCashCap, Math.round((r.inheritance?.cash ?? 0) * k.familyCashShare)),
    farm: !!r.inheritance?.farm,
    heirloom: r.founder.heirlooms?.gun ?? null,
    sympathy: hero ? k.familySym : murderer ? -k.familySym : 0,
    loyalFriend: (r.friends ?? []).length > 0 ? r.friends[0].name : null,
    informers: (r.enemies ?? []).length > 0,
    lawGrudge: (r.lawmen ?? []).length > 0,
  };
}
