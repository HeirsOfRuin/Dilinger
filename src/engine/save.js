// Saves. The key and the code prefix are contracts: never rename them. A save is
// the state without its tuning (the tuning comes from the build that loads it),
// with a version and migrations forward.
import { CONFIG } from '../data/config.data.js';
import { SAVE_VERSION } from './state.js';

export const SAVE_KEY = 'public-enemy.save.v1';
export const CODE_PREFIX = 'PE1.';

const b64 = (text) => (typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(text))) : Buffer.from(text, 'utf8').toString('base64'));
const unb64 = (text) => (typeof atob === 'function' ? decodeURIComponent(escape(atob(text))) : Buffer.from(text, 'base64').toString('utf8'));

const MIGRATIONS = {}; // { 1: (s) => ({ ...s, v: 2, ... }) } when version 2 comes

export function toSave(s) {
  const { tune, ...rest } = s;
  return JSON.stringify(rest);
}

export function fromSave(text) {
  let s = JSON.parse(text);
  if (!s || typeof s.v !== 'number' || typeof s.seed !== 'number') throw new Error('That save is damaged.');
  if (s.v > SAVE_VERSION) throw new Error('That save is from a newer version of the game.');
  while (s.v < SAVE_VERSION) s = MIGRATIONS[s.v](s);
  return { ...s, tune: { ...CONFIG } };
}

export const saveCode = (s) => CODE_PREFIX + b64(toSave(s));

export function readSaveCode(code) {
  const c = String(code).trim();
  if (!c.startsWith(CODE_PREFIX)) throw new Error('That is not a save code from this game.');
  try { return fromSave(unb64(c.slice(CODE_PREFIX.length))); } catch (e) {
    throw new Error(/newer/.test(e.message) ? e.message : 'That save code is damaged.');
  }
}
