import { DIFFICULTIES, OLD_RESCUE_SOL, S, suitCap } from './state.js';
import { adoptOld, storeKey } from '../core/storage.js';
import { World, addSupplyPod, buildDeployable, placeAt } from '../world/build.js';
import { llToVec, vecToLl } from '../planet/geo.js';
import { _v1 } from '../core/scratch.js';
import { player, syncPlayerPos } from './player.js';
import { roverF, syncRoverVisual } from './rover.js';
import { Snd } from '../audio/sound.js';
import { hideOverlay, log, logSnapshot, restoreLog } from '../ui/dom.js';
import { initScience } from './science.js';
import { initMachines } from './machines.js';
import { farm } from './farm.js';
import { syncAllVisuals } from './visuals.js';
import { serializeWear, restoreWear } from './wear.js';
// Checkpoints and the saved game.
export function serializeState() {
  return {
    v: SAVE_VERSION, kind: S.kind, diff: S.diff, spawn: { lat: World.spawn.lat, lon: World.spawn.lon },
    sol: S.sol, tod: S.tod,
    o2: S.o2, water: S.water, food: S.food, potatoes: S.potatoes, power: S.power,
    health: Math.max(S.health, 50), suit: suitCap(), roverPower: S.roverPower, roverO2: S.roverO2,
    inv: { ...S.inv }, upgrades: { ...S.upgrades }, blueprints: { ...S.blueprints },
    quests: { ...S.quests }, salvaged: { ...S.salvaged }, discovered: { ...S.discovered },
    achieved: { ...S.achieved }, checkedSystems: { ...S.checkedSystems },
    flags: { ...S.flags }, stats: JSON.parse(JSON.stringify(S.stats)),            // stats hold nested counts: copy them whole
    science: S.science ? JSON.parse(JSON.stringify(S.science)) : null,
    machines: S.machines ? { ...S.machines } : null,
    mail: { ...(S.mail || {}) },
    pantry: { ...farm().pantry }, seeds: { ...S.seeds }, morale: S.morale, diet: { ...S.diet },
    comforts: { ...(S.comforts || {}) }, sights: { ...(S.sights || {}) }, album: { ...(S.album || {}) },
    base: S.base ? JSON.parse(JSON.stringify(S.base)) : null,              // (a base's deposits: found, and what is left in each)
    breach: { ...S.breach }, link: JSON.parse(JSON.stringify(S.link)),
    stormCells: S.storm.cells.map(c => ({ ...c })),
    plots: World.plots.map(p => ({ state: p.state, growth: p.growth, watered: p.watered, crop: p.crop || 'potato' })),
    panels: World.panels.map(p => p.dust),
    piles: World.soilPiles.map(p => p.left),
    pods: World.pods.map(p => p.taken),
    podLoot: World.pods.map(p => ({ loot: p.loot, label: p.label, blueprint: p.blueprint || null,
      ll: vecToLl(_v1.copy(p.group.position).normalize()) })),
    ice: World.iceSites.map(s => s.left),
    rtgTaken: World.rtgSite ? World.rtgSite.taken : false,
    built: World.builtMeshes.map(b => ({ kind: b.kind, charges: b.charges, yaw: b.yaw || 0,
      ll: vecToLl(_v1.copy(b.group.position).normalize()), ...(b.job ? { job: { ...b.job } } : {}) })),
    playerQ: player.q.toArray(), roverQ: roverF.q.toArray(),
    wear: serializeWear(),               // (optional: the paths worn round the Hab; older saves have none)
    log: logSnapshot(),                  // (optional: the last lines of the log, for the journal; older saves have none)
  };
}
export function applyState(d) {
  restoreLog(d.log);
  Object.assign(S, {
    sol: d.sol, tod: d.tod, o2: d.o2, water: d.water, food: d.food, potatoes: d.potatoes,
    power: d.power, health: d.health, suit: d.suit, roverPower: d.roverPower, roverO2: d.roverO2,
  });
  S.inv = { ...d.inv }; S.upgrades = { ...d.upgrades }; S.blueprints = { ...d.blueprints };
  S.quests = { ...d.quests }; S.salvaged = { ...d.salvaged }; S.discovered = { ...d.discovered };
  S.achieved = { ...d.achieved }; S.checkedSystems = { ...d.checkedSystems };
  S.flags = { ...d.flags }; S.stats = { ...d.stats };
  S.breach = { ...d.breach }; S.link = { got: { ...((d.link && d.link.got) || {}) }, fitted: { ...((d.link && d.link.fitted) || {}) }, connected: !!(d.link && d.link.connected) };
  if (d.science) S.science = JSON.parse(JSON.stringify(d.science)); else initScience();
  if (d.machines) { S.machines = { ...d.machines }; S.machineWarn = {}; } else initMachines();
  S.mail = { ...(d.mail || {}) };
  // the farm's pantry and morale came later than format 4's first saves: absent means a fresh start for them
  S.pantry = d.pantry ? { ...d.pantry } : null; S.seeds = d.seeds ? { ...d.seeds } : null;
  S.morale = typeof d.morale === 'number' ? d.morale : undefined; S.diet = d.diet ? { ...d.diet } : null;
  farm();
  S.comforts = { ...(d.comforts || {}) };
  S.sights = { ...(d.sights || {}) };
  S.album = { ...(d.album || {}) };
  S.base = d.base ? JSON.parse(JSON.stringify(d.base)) : null;
  S.storm.cells = d.stormCells.map(c => ({ ...c }));
  S.storm.i = 0;
  // rebuild deployed structures FIRST so greenhouse plots exist before plot restore
  for (let i = World.builtMeshes.length; i < (d.built || []).length; i++) {
    const b = d.built[i];
    const bb = buildDeployable(b.kind, llToVec(b.ll.lat, b.ll.lon), b.yaw || 0);
    bb.charges = b.charges;
  }
  (d.built || []).forEach((b, i) => { const bb = World.builtMeshes[i]; if (bb && bb.def) bb.job = b.job ? { ...b.job } : null; });
  d.plots.forEach((cp, i) => { if (World.plots[i]) Object.assign(World.plots[i], { crop: 'potato' }, cp); });
  d.panels.forEach((v, i) => { if (World.panels[i]) World.panels[i].dust = v; });
  d.piles.forEach((v, i) => { if (World.soilPiles[i]) World.soilPiles[i].left = v; });
  // rebuild dynamically dropped pods missing from the world (load path)
  for (let i = World.pods.length; i < (d.podLoot || []).length; i++) {
    const pd = d.podLoot[i];
    const pod = addSupplyPod(placeAt(pd.ll.lat, pd.ll.lon, i * 2.1), pd.loot, pd.label);
    if (pd.blueprint) pod.blueprint = pd.blueprint;
  }
  d.pods.forEach((v, i) => { if (World.pods[i]) World.pods[i].taken = v; });
  d.ice.forEach((v, i) => { if (World.iceSites[i]) World.iceSites[i].left = v; });
  if (World.rtgSite) World.rtgSite.taken = d.rtgTaken;
  for (let i = 0; i < Math.min(World.builtMeshes.length, d.built.length); i++)
    World.builtMeshes[i].charges = d.built[i].charges;
  player.q.fromArray(d.playerQ);
  player.alt = 0; player.vy = 0;
  roverF.q.fromArray(d.roverQ);
  roverF.speed = 0;
  S.over = false; S.dead = null; S.sleeping = false; S.mode = 'walk'; S.uiOpen = false;
  Snd.alarm(false); Snd.testLoop(false); S.testLoop = false;
  syncPlayerPos();
  restoreWear(d.wear);
  syncRoverVisual(0);
  syncAllVisuals();
  hideOverlay();
}
export const Save = { checkpoint: null };
export function checkpoint() {
  if (S.over) return;                    // review finding: never checkpoint a corpse
  Save.checkpoint = serializeState();
}
export function restoreCheckpoint() {
  if (!Save.checkpoint) { try { location.reload(); } catch (e) {} return; }
  applyState(JSON.parse(JSON.stringify(Save.checkpoint)));
  log(`Woke at dawn, Sol ${S.sol}. To the first crew: whatever that was, do not do it again.`);
}
export const SAVE_KEY = storeKey('save');
adoptOld('save'); adoptOld('save-base');
/** Each kind of game has a save of its own: a story run and a base can both be kept. */
export const saveKey = (kind) => (kind === 'base' ? SAVE_KEY + '-base' : SAVE_KEY);
export function saveGame() {
  // (not during the opening film, which borrows the clock and the weather: the game it would save is not this one)
  if (S.over || !S.started || World.opening || World.importing) return;
  try { localStorage.setItem(saveKey(S.kind), JSON.stringify(serializeState())); } catch (e) {}
}
/** Save format history:
 *    2  the first full-planet version (analytic terrain)
 *    3  real-elevation terrain; same fields. Positions are stored as directions on the sphere,
 *       so everything is simply re-seated on the new ground when an old save is loaded.
 *    4  longer sols (the launch sol moved; a 3 is converted keeping its fraction of the way there)
 *    5  the game's own story (19 November 2026): the Earth-link in place of the old radio, water from the regolith
 *       oven in place of burning fuel, renamed achievements and statistics. A 4 is carried over (story5 below). */
export const SAVE_VERSION = 5;
/** Bring an older save up to the current format, or return null if it cannot be read. */
export function migrateSave(d) {
  if (!d || typeof d !== 'object' || !d.spawn || !d.playerQ) return null;
  if (d.v === 2) d = { ...d, v: 3, migrated: ['terrain'] };
  if (d.v === 3) {
    // sols became longer and the launch came forward: keep the save the same fraction of the way there
    const was = OLD_RESCUE_SOL[d.diff] || 45, now = (DIFFICULTIES[d.diff] || DIFFICULTIES.survival).rescueSol;
    d = { ...d, v: 4, sol: Math.max(1, Math.round(d.sol * now / was)), migrated: [...(d.migrated || []), 'pacing'] };
  }
  if (d.v === 4) d = story5(d);
  return d.v === SAVE_VERSION ? d : null;
}
/**
 * Ids and keys of the story before the move are matched by a short hash of the old name, so that the old story's
 * words are not kept in the source (game/story.js and game/mail.js have the new ones).
 */
const oldHash = (str) => { let x = 5381; for (const c of str) x = ((x * 33) ^ c.charCodeAt(0)) >>> 0; return x.toString(36); };
const OLD_ACHIEVEMENT = { '1b4sdp0': 'firstdawn', '33w7mh': 'link', '1ci4531': 'grower', '2z206f': 'oven', '2pt653': 'music', 'vjywda': 'homeward' };
const OLD_MAIL = { '2pt653': 'music' };
const OLD_MUSIC_SECONDS = '1m8icxu', OLD_MUSIC = '2pt653';
/** The value under the key of `o` whose old name hashes to `h` (and that key's name), or undefined. */
function byOldHash(o, h) { for (const k of Object.keys(o || {})) if (oldHash(k) === h) return [k, o[k]]; return undefined; }
/** A save of the old story, carried into this one. What does not carry is said on load (game/flow.js). */
function story5(d) {
  d = JSON.parse(JSON.stringify(d));
  const notes = [];
  // the radio: a run that had called Earth has the Earth-link built; one that had the old radio aboard has its antenna
  const old = d.pf || {};
  d.link = { got: {}, fitted: {}, connected: !!old.connected };
  if (old.connected) d.link.fitted = { dish: 'an older version', amp: 'an older version', drive: 'an older version' };
  else if (old.loaded) { d.link.got = { dish: 'Pathfinder' }; (d.salvaged = d.salvaged || {}).Pathfinder = true; notes.push('the old radio you were carrying is now the Earth-link\'s antenna'); }
  delete d.pf;
  // water from burning fuel is gone: what fuel was left becomes the water it would have made
  if (d.hydrazine > 0) { d.water = Math.min(120, (d.water || 0) + 28 * d.hydrazine); notes.push(`your ${d.hydrazine} unburnt fuel became ${28 * d.hydrazine} L of water`); }
  delete d.hydrazine;
  for (const pl of d.podLoot || []) {
    if (pl.loot && pl.loot.hydrazine) { pl.loot.water = (pl.loot.water || 0) + 28 * pl.loot.hydrazine; delete pl.loot.hydrazine; }
    if (/reward pod$/.test(pl.label || '')) pl.label = 'Open the reward pod';
    else if (/route cache/i.test(pl.label || '')) pl.label = 'Open the cargo canister';
    else if (/grant/i.test(pl.label || '')) pl.label = 'Open the science team\'s canister';
    else if (/care package|supply pod/i.test(pl.label || '')) pl.label = 'Open the cargo canister';
  }
  // statistics, flags and marks under their new names
  const st = d.stats = d.stats || {};
  const ms = byOldHash(st, OLD_MUSIC_SECONDS); if (ms) { st.musicTime = ms[1] || 0; delete st[ms[0]]; }
  st.bakes = st.bakes || 0; delete st.booms;
  if (st.marks) { if (st.marks.pf) { st.marks.link = st.marks.pf; delete st.marks.pf; } if (st.marks.hydra) { st.marks.oven = st.marks.hydra; delete st.marks.hydra; } }
  if (d.diet) { const dm = byOldHash(d.diet, OLD_MUSIC); if (dm) { d.diet.tunes = dm[1] || 0; delete d.diet[dm[0]]; } }
  const fl = d.flags = d.flags || {};
  if (fl.pfRevealed) fl.linkRevealed = true;
  for (const k of ['pfRevealed', 'mavStripped', 'hydrazineBoom']) delete fl[k];
  const music = byOldHash(d, OLD_MUSIC); if (music) delete d[music[0]];
  // achievements and letters that were renamed
  const ach = {};
  for (const [k, v] of Object.entries(d.achieved || {})) ach[OLD_ACHIEVEMENT[oldHash(k)] || k] = v;
  d.achieved = ach;
  const mail = {};
  for (const [k, v] of Object.entries(d.mail || {})) mail[OLD_MAIL[oldHash(k)] || k] = v;
  d.mail = mail;
  return { ...d, v: 5, migrated: [...(d.migrated || []), 'story'], storyNotes: notes };
}
/** All saved runs as text, to paste into another copy of the game (Settings, Saved games). '' when there is none. */
const XFER = 'MGSAVE1:';
export function exportSaves() {
  const out = {};
  for (const k of ['story', 'base']) { try { const raw = localStorage.getItem(saveKey(k)); if (raw) out[k] = JSON.parse(raw); } catch (e) { /* unreadable: left out */ } }
  if (!Object.keys(out).length) return '';
  return XFER + btoa(unescape(encodeURIComponent(JSON.stringify(out))));
}
/** Load runs from exportSaves() text (or from the old address's export, which is the same). Returns { ok, msg }. */
export function importSaves(text) {
  const t = String(text || '').replace(/\s+/g, '');
  if (!t) return { ok: false, msg: 'Paste the text first.' };
  let data;
  try { data = JSON.parse(decodeURIComponent(escape(atob(t.startsWith(XFER) ? t.slice(XFER.length) : t)))); } catch (e) { return { ok: false, msg: 'That text is not a saved game. Copy all of it, from the start.' }; }
  if (data && data.spawn && data.playerQ) data = { [data.kind === 'base' ? 'base' : 'story']: data };      // (a bare save: one run)
  const runs = ['story', 'base'].filter((k) => data && data[k] && migrateSave(JSON.parse(JSON.stringify(data[k]))));
  if (!runs.length) return { ok: false, msg: 'That text holds no run this version can read.' };
  try { for (const k of runs) localStorage.setItem(saveKey(k), JSON.stringify(data[k])); } catch (e) { return { ok: false, msg: 'This browser would not store it.' }; }
  World.importing = true;              // (the running game must not save over it as the page reloads)
  return { ok: true, msg: `Loaded ${runs.map((k) => (k === 'base' ? 'the base' : 'the story run')).join(' and ')}. Starting again…` };
}
export function loadSavedData(kind = 'story') {
  try {
    const raw = localStorage.getItem(saveKey(kind));
    if (!raw) return null;
    const d = migrateSave(JSON.parse(raw));
    if (d) d.kind = kind;                // (the slot says which game it is: saves from before there were two have no word for it)
    return d;
  } catch (e) { return null; }
}
/** True when a save exists but this version of the game cannot read it (say so on the title). */
export function unreadableSaveExists() {
  try { return ['story', 'base'].some((k) => !!localStorage.getItem(saveKey(k)) && !loadSavedData(k)); } catch (e) { return false; }
}
export function wipeSave(kind = S.kind) { try { localStorage.removeItem(saveKey(kind)); } catch (e) {} }
