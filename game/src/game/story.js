import { DIFFICULTIES, S, isBase } from './state.js';
import { syncAllVisuals } from './visuals.js';
import { Snd } from '../audio/sound.js';
import { checkpoint, saveGame, wipeSave } from './save.js';
import { angDist, fmtDist, groundDist } from '../planet/geo.js';
import { World, dropSupplyPod } from '../world/build.js';
import { hideOverlay, log, showOverlay, toast } from '../ui/dom.js';
import { revealMav } from './sim.js';
import { player } from './player.js';
import { _v1, _v2 } from '../core/scratch.js';
import { FEATURES } from '../planet/features.js';
import { R } from '../planet/constants.js';
import { BUILDINGS } from './base.js';
import { discoveriesFound } from '../ui/screens.js';
import { tryReload } from './flow.js';
import { showComms } from '../ui/menus.js';
import { baseState } from './base.js';
// The story: the Earth-link and the first call, survey quests, discoveries, achievements, the handover, the ending.

// ---- the Earth-link: three parts, each from a different lander that really carried one (planet/features.js, LANDERS[].link)
export const LINK_ORDER = ['dish', 'amp', 'drive'];
export const LINK_NAMES = { dish: 'high-gain antenna', amp: 'power amplifier', drive: 'pointing drive' };
/** How many of the three parts are fitted at the Hab. */
export const linkFitted = () => LINK_ORDER.filter((k) => S.link.fitted && S.link.fitted[k]).length;
/** The parts still wanted: neither carried nor fitted. */
export const linkNeeded = () => LINK_ORDER.filter((k) => !(S.link.got && S.link.got[k]) && !(S.link.fitted && S.link.fitted[k]));
/** The part a lander would give now (the first it carried that is still wanted), or null. One part to a lander. */
export function linkPartFrom(L) {
  if (!L || S.salvaged[L.name]) return null;
  return partFor(L);
}
/** The part a lander carries that the link still wants, salvaged or not (the salvage itself asks, as it happens). */
function partFor(L) {
  if (S.link.connected || !L || !L.link) return null;
  const need = linkNeeded();
  return L.link.find((k) => need.includes(k)) || null;
}
/** A part carried and not yet fitted, or null. */
export const nextToFit = () => LINK_ORDER.find((k) => S.link.got && S.link.got[k] && !(S.link.fitted && S.link.fitted[k])) || null;
/** Salvaging a lander: take the part it gives, if it gives one. */
export function takeLinkPart(L) {
  const k = partFor(L);
  if (!k) return null;
  (S.link.got = S.link.got || {})[k] = L.name;
  S.flags.linkRevealed = true;
  Snd.jingle();
  toast('EARTH-LINK', `${LINK_NAMES[k]}`.toUpperCase(), `From ${L.name}. Fit it at the dish mast by the Hab (${Object.keys(S.link.got).length} of 3 found).`);
  log(`To the first crew: took the ${LINK_NAMES[k]} off ${L.name}. ${LINK_CREDIT[k]}`);
  return k;
}
const LINK_CREDIT = {
  dish: 'It was built to find Earth from here. It still can.',
  amp: 'It last shouted at Earth years ago. It has one more message in it.',
  drive: 'It turned an antenna toward Earth every day of its mission. It can do it for mine.',
};
/** Fit a carried part at the dish mast. The third one fitted makes the call. */
export function fitLinkPart(k) {
  if (!k || !S.link.got || !S.link.got[k]) return;
  (S.link.fitted = S.link.fitted || {})[k] = S.link.got[k];
  syncAllVisuals();
  Snd.play('craft');
  const n = linkFitted();
  if (n >= 3) { connectComms(); return; }
  log(`${LINK_NAMES[k].charAt(0).toUpperCase() + LINK_NAMES[k].slice(1)} fitted: ${n} of 3. Still wanted: ${linkNeeded().map((x) => LINK_NAMES[x]).join(' and ') || 'the parts I carry'}.`);
  checkpoint(); saveGame();
}

export function connectComms() {
  S.link.connected = true;
  syncAllVisuals();
  Snd.play('linkUp');
  checkpoint();
  const dist = fmtDist(groundDist(World.hab.position, World.mav.position));
  const parts = LINK_ORDER.map((k) => S.link.fitted && S.link.fitted[k]).filter(Boolean);
  const convo = [
    ['n', 'Groundwork, Control. We have a carrier on the Earth-link frequency. If that is you, Quinn, key twice.'],
    ['w', `Keying twice. Alive, Hab sealed, beds planted. The link is ${parts.length === 3 ? `${parts[0]}'s antenna, ${parts[1]}'s amplifier and ${parts[2]}'s pointing drive` : 'built from three old landers'}. It works.`],
    ['Lindqvist', 'Quinn, it is Tomas. We had nothing from you since the storm. Nothing. Give me a minute.'],
    ...(isBase() ? [
      // (the game with no way home: the same call, and the other answer)
      ['n', 'We have to tell you about the Tern. The storm took her electronics; she is dark and tumbling. The next ship can leave in 26 months, the next window. We can send cargo that is already on its way. Nothing faster.'],
      ['w', 'Then the next ship needs somewhere to land. I will build it. Send seeds, and the drawings for everything.'],
    ] : [
      ['n', `The Tern is healthy and waiting in orbit. We restarted the propellant plant at Arcadia the morning after the storm, in case you were alive. The ascent vehicle will be full on Sol ${S.rescueSol}, and the Tern's window closes just after.`],
      ['w', S.sol >= S.rescueSol
        ? `Then the tanks are full now, and Arcadia is ${dist} away. I am leaving.`
        : `Then I have ${S.rescueSol - S.sol} sol${S.rescueSol - S.sol === 1 ? '' : 's'} to stay fed and ${dist} to drive. Understood.`],
    ]),
    ['n', 'The science team has requests: old landers with parts and records worth bringing in. Each one you close, the Tern drops you a cargo canister. Also, Quinn: this channel is public now. Half of Earth is listening.'],
    ['w', 'Then, half of Earth: it is cold here, the sky goes blue at sunset, and the soil needs rinsing before you plant it. More in the notes.'],
  ];
  let i = 0;
  const step = () => {
    if (i >= convo.length) {
      hideOverlay();
      log('The link holds. Earth is minutes away by light, and listening.', 'control');
      offerQuests();
      if (S.sol >= S.rescueSol) revealMav();
      checkpoint();
      saveGame();
      return;
    }
    showComms({
      title: 'Earth-link', subtitle: 'Signal delay: several minutes each way, cut out here',
      lines: convo, index: i,
      onNext: () => { i++; Snd.click(); step(); },
      onSkip: () => { i = convo.length - 1; Snd.click(); step(); },
    });
    if (i === 0) Snd.ok();
  };
  step();
  log('A carrier, then a voice. Earth.');
  onQuestEvent('link-up', '');
  checkAchievements();
}

// ============================================================
// 24. QUESTS
// ============================================================
export const QUEST_DEFS = [
  { id: 'viking1', name: 'First Light', target: 'Viking 1',
    desc: 'Visit Viking 1 (1976) in Chryse Planitia, the first lander to work on Mars. Photograph it for the archive.',
    ev: ['salvage', 'Viking 1'], loot: { scrap: 4, rations: 2, water: 10, seedTomato: 1 } },
  { id: 'spirit', name: 'Soft Sand', target: 'Spirit',
    desc: 'Recover Spirit\'s memory boards at Gusev crater, where the rover drove for six years and stopped in the sand.',
    ev: ['salvage', 'Spirit'], loot: { rations: 3, candle: 1, seedSoy: 1 }, bp: 'recycler' },
  { id: 'oppy', name: 'Clean Panels', target: 'Opportunity',
    desc: 'Find Opportunity in Meridiani Planum and brush the dust off her panels. Her old team asked for it by name.',
    ev: ['salvage', 'Opportunity'], loot: { rations: 4, circuit: 1 }, bp: 'drive2' },
  { id: 'insight', name: 'Listening Post', target: 'InSight',
    desc: 'Retrieve InSight\'s seismometer records from Elysium Planitia: years of marsquakes that never reached Earth.',
    ev: ['salvage', 'InSight'], loot: { scrap: 2, candle: 1 }, reveal: true },
  { id: 'phoenix', name: 'High Latitude', target: 'Phoenix',
    desc: 'Reach Phoenix at the edge of the northern ice, where it found perchlorate in 2008. Take more candles than seems sensible.',
    ev: ['salvage', 'Phoenix'], loot: { rations: 4, water: 20 }, bp: 'tank2' },
  { id: 'mars3', name: 'The First One Down', target: 'Mars 3',
    desc: 'Find Mars 3, silent since 1971, and recover its camera. Nobody has stood beside it before.',
    ev: ['salvage', 'Mars 3'], loot: { scrap: 5, rations: 5, circuit: 1, seedTomato: 1, seedLettuce: 1 } },
  { id: 'breadcrumbs', name: 'Waystation', target: null,
    // (a base has no escape to lay a trail for: there the same two things are an outstation)
    get desc() { return isBase() ? 'Set up an outstation: deploy an O2 Cache and a Nav Beacon at least 2 km from the Hab, somewhere to run to when a long drive goes wrong.' : 'Lay out the road to Arcadia: deploy an O2 Cache and a Nav Beacon at least 2 km from the Hab, toward the station.'; },
    ev: ['deploy', null], loot: { rations: 3, candle: 2 } },
];
export function questTargetPos(q) {
  if (q.target) {
    const rec = World.landers.find(l => l.data.name === q.target);
    return rec ? rec.group.position : null;
  }
  return null;
}
export function offerQuests() {
  for (const q of QUEST_DEFS) if (!S.quests[q.id]) S.quests[q.id] = 'active';
  // retro-complete survey tasks for landers already stripped before the uplink
  for (const name of Object.keys(S.salvaged)) onQuestEvent('salvage', name);
  log('Requests from the science team: old landers with parts and records worth bringing in. They are in the journal; each pays in a cargo canister from the Tern.', 'control');
  // the first canister: the ice drill's blueprint, and soybeans from the mission agronomist
  dropSupplyPod({ scrap: 3, rations: 3, candle: 1, seedSoy: 2 }, 'Open the first cargo canister').blueprint = 'drill';
}
export function onQuestEvent(type, name) {
  for (const q of QUEST_DEFS) {
    if (S.quests[q.id] !== 'active') continue;
    let hit = false;
    if (q.ev[0] === 'salvage' && type === 'salvage' && q.ev[1] === name) hit = true;
    if (q.id === 'breadcrumbs' && type === 'deploy') {
      let cache = false, beacon = false;
      for (const b of World.builtMeshes) {
        const d = groundDist(b.group.position, World.hab.position);
        if (d > 2000 && b.kind === 'cache') cache = true;
        if (d > 2000 && b.kind === 'beacon') beacon = true;
      }
      hit = cache && beacon;
    }
    if (!hit) continue;
    S.quests[q.id] = 'done';
    Snd.play('questDone');
    const pod = dropSupplyPod(q.loot, `Open "${q.name}" reward pod`);
    if (q.bp) pod.blueprint = q.bp;
    if (q.reveal) {
      S.flags.mapRevealed = true;
      log('With InSight\'s records, the science team sent the full survey map. Every landmark is on it now: see the map.', 'control');
    }
    log(`Request complete: ${q.name}. The Tern is dropping a cargo canister.`, 'control');
  }
}

// ============================================================
// 25. DISCOVERIES & ACHIEVEMENTS
// ============================================================
export function discover(name, note, isLander) {
  if (S.discovered[name]) return;
  S.discovered[name] = true;
  S.stats.discoveries++;
  Snd.discovery();
  // (not while he is running for the airlock on a holed suit: the card for the region he woke up in landed on the Hab
  //  in the middle of that, and repeated the name already at the top of the screen. The journal has it all the same.)
  if (!S.flags.coldOpen) toast(isLander ? 'SITE DISCOVERED' : 'REGION DISCOVERED', name.toUpperCase(), note || '');
  checkAchievements();
}
export let discTimer = 0;
export function updateDiscoveries(dt) {
  discTimer += dt;
  if (discTimer < 1.5) return;
  discTimer = 0;
  // (a base's works make things and its pad takes drops while he is elsewhere: nothing he does marks the moment)
  if (isBase()) checkAchievements();
  if (World.deposits) {
    const found = baseState().found, at = S.mode === 'rover' ? World.rover.group.position : player.pos;
    const tower = World.builtMeshes.some((b) => b.kind === 'tower');
    for (const site of World.deposits) {
      if (found[site.key]) continue;
      if (tower) { found[site.key] = S.sol; continue; }                     // (talked in from orbit: no card for each of forty)
      if (groundDist(at, site.group.position) > 70) continue;
      found[site.key] = S.sol;
      Snd.discovery();
      toast('DEPOSIT FOUND', site.dep.name.toUpperCase(), site.dep.note);
      log(`${site.dep.name}, ${site.field.name}. ${site.dep.note}`, 'disc');
    }
  }
  const pp = S.mode === 'rover' ? World.rover.group.position : player.pos;
  _v1.copy(pp).normalize();
  for (const rec of World.landers) {
    if (S.discovered[rec.data.name]) continue;
    if (groundDist(pp, rec.group.position) < 160) discover(rec.data.name, rec.data.note, true);
  }
  for (const f of FEATURES) {
    if (f.type === 'bulge' || f.type === 'albedo' || S.discovered[f.name]) continue;
    if (angDist(_v1.x, _v1.y, _v1.z, f.v.x, f.v.y, f.v.z) < f.angR) discover(f.name, f.note, false);
  }
}
export const ACHIEVEMENTS = [
  // (each says what to do, in the same form: "Five loads baked" would sit badly among "Harvest 50 potatoes")
  { id: 'firstdawn', name: 'First Dawn', desc: 'Reach the dawn of Sol 2', check: () => S.sol >= 2 },
  { id: 'link', name: 'Carrier Wave', desc: 'Call Earth on the Earth-link', check: () => S.link.connected },
  { id: 'grower', name: 'Root Cellar', desc: 'Harvest 50 potatoes', check: () => S.stats.potatoes >= 50 },
  { id: 'oven', name: 'Two Percent', desc: 'Bake 5 loads of regolith for water', check: () => (S.stats.bakes || 0) >= 5 },
  { id: 'arch', name: 'Field Archivist', desc: 'Salvage 8 historic landers', check: () => Object.keys(S.salvaged).length >= 8 },
  { id: 'olympus', name: 'Above the Weather', desc: 'Stand on the summit of Olympus Mons',
    check: () => { const f = FEATURES.find(f => f.name === 'Olympus Mons'); _v2.copy(player.pos).normalize(); return angDist(_v2.x, _v2.y, _v2.z, f.v.x, f.v.y, f.v.z) * R < 120; } },
  { id: 'hellas', name: 'Low Point', desc: 'Stand on the floor of Hellas Planitia',
    check: () => { const f = FEATURES.find(f => f.name === 'Hellas Planitia'); _v2.copy(player.pos).normalize(); return angDist(_v2.x, _v2.y, _v2.z, f.v.x, f.v.y, f.v.z) * R < 800; } },
  { id: 'circum', name: 'All the Way Round', desc: 'Drive 75.4 km — one full lap of Mars', check: () => S.stats.driven >= 75400 },
  { id: 'ice', name: 'Ice Miner', desc: 'Mine 25 ice chunks', check: () => S.stats.mined >= 25 },
  { id: 'storm', name: 'Weathered', desc: 'Spend 60 seconds outside in a dust storm', check: () => S.stats.stormOut >= 60 },
  { id: 'marathon', name: 'Long Walk', desc: 'Walk 10 km on foot', check: () => S.stats.walked >= 10000 },
  { id: 'music', name: 'On Loop', desc: 'Listen to 3 minutes of the test loop', check: () => S.stats.musicTime >= 180 },
  { id: 'rockhound', name: 'Rock Hound', desc: 'Catalogue 5 different materials', check: () => S.science && Object.keys(S.science.found).length >= 5 },
  { id: 'curator', name: 'Cabinet of Mars', desc: 'Catalogue 12 different materials', check: () => S.science && Object.keys(S.science.found).length >= 12 },
  { id: 'oldiron', name: 'Older Than the Planet', desc: 'Find an iron meteorite', check: () => S.science && !!S.science.found.meteorite },
  { id: 'fiveaday', name: 'Full Pantry', desc: 'Harvest all five crops', check: () => !!S.stats.grown && Object.keys(S.stats.grown).length >= 5 },
  { id: 'chef', name: 'Table for One', desc: 'Cook 5 dinners', check: () => !!(S.diet && S.diet.meals >= 5) },
  { id: 'home', name: 'Lived In', desc: 'Make 6 comforts for the Hab', check: () => !!S.comforts && Object.keys(S.comforts).length >= 6 },
  { id: 'homeward', name: 'Handover', desc: 'Leave Mars on the Tern', story: true, check: () => S.won },
  // ---- a base's own (the game with no rescue: there is no leaving Mars in it, and these stand in that one's place)
  { id: 'mason', name: 'Fired Clay', desc: 'Build a kiln', base: true, check: () => stands('kiln') },
  { id: 'industry', name: 'Works Yard', desc: 'Build a kiln, a smelter and a glassworks', base: true, check: () => stands('kiln') && stands('smelter') && stands('glassworks') },
  { id: 'prospector', name: 'Prospector', desc: 'Quarry all five minerals', base: true, check: () => Object.keys(S.stats.minerals || {}).length >= 5 },
  { id: 'foreman', name: 'Production Run', desc: 'Make 100 things in the works', base: true, check: () => (S.stats.made || 0) >= 100 },
  { id: 'signed', name: 'Delivery', desc: 'Receive a supply drop on the landing pad', base: true, check: () => !!(S.base && S.base.drops) },
  { id: 'town', name: 'Settlement', desc: 'Build one of every building', base: true, check: () => BUILDINGS.every((w) => stands(w.builds || w.id)) },
];
const stands = (kind) => World.builtMeshes.some((b) => b.kind === kind);
/** The achievements of the game being played: the story's, or a base's (which has its own in place of leaving Mars). */
export const achievements = () => ACHIEVEMENTS.filter((a) => (a.base ? isBase() : a.story ? !isBase() : true));
const DONE = { Reach: 'Reached', Restore: 'Restored', Harvest: 'Harvested', Survive: 'Survived', Salvage: 'Salvaged', Stand: 'Stood', Drive: 'Drove', Mine: 'Mined', Spend: 'Spent',
  Walk: 'Walked', Listen: 'Listened', Call: 'Called', Bake: 'Baked', Catalogue: 'Catalogued', Find: 'Found', Cook: 'Cooked', Make: 'Made', Leave: 'Left', Build: 'Built', Quarry: 'Quarried', Receive: 'Received' };
/**
 * What an achievement was earned for, as a thing done: "Spent 60 seconds outside in a dust storm". Its description
 * says what to do, which is right until it is done. (The card that announces one read "Spend 60 seconds…".)
 */
export function achievementDone(a) { const w = a.desc.split(' ')[0]; return DONE[w] ? DONE[w] + a.desc.slice(w.length) : a.desc; }
export function checkAchievements() {
  for (const a of achievements()) {
    if (S.achieved[a.id]) continue;
    let ok = false;
    try { ok = a.check(); } catch (e) {}
    if (ok) {
      S.achieved[a.id] = true;
      Snd.play('achievement');
      toast('ACHIEVEMENT', a.name, achievementDone(a));
    }
  }
}

/**
 * The handover: before launch, Quinn files the notes for the first crew. It is the run's record (what is planted,
 * catalogued, photographed and left for them), and its button launches. `onFile` starts the launch (game/launch.js).
 */
export function showHandover(onFile) {
  const st = S.stats;
  const grown = st.potatoes + (st.produce || 0), meals = (S.diet && S.diet.meals) || 0;
  const marks = st.marks || {};
  const STEPS = [['reach', 'Reached the Hab on a leaking suit'], ['farm', 'Rinsed and planted the first beds'], ['oven', 'Baked the first water out of the soil'],
    ['harvest', 'Brought in the first harvest'], ['dinner', 'Cooked a dinner worth the name'], ['link', 'Called Earth on the Earth-link'],
    ['survive', 'Held out until the tanks were full']];
  const steps = STEPS.filter(([id]) => marks[id]).map(([id, text]) => `<li><b class="t-num">Sol ${marks[id]}</b><span>${text}</span></li>`).join('') +
    `<li class="last"><b class="t-num">Sol ${S.sol}</b><span>Filed this handover at Arcadia Station</span></li>`;
  const beds = World.plots.filter((p) => p.state === 'growing' || p.state === 'ready');
  const crops = [...new Set(beds.map((p) => (CROP_NAME[p.crop] || 'potatoes')))];
  const kinds = S.science ? Object.keys(S.science.found).length : 0;
  const shots = (st.photographed || 0) + (st.sights || 0);
  const left = [];
  if (S.comforts && Object.keys(S.comforts).length) left.push(`${Object.keys(S.comforts).length} comforts in the Hab`);
  const built = World.builtMeshes.length;
  if (built) left.push(`${built} thing${built === 1 ? '' : 's'} built and on the map`);
  if (S.link.connected) left.push('a working Earth-link');
  const notes = [
    ['Planted', beds.length ? `${beds.length} bed${beds.length === 1 ? '' : 's'} growing: ${crops.join(', ')}. Water them at half-grown.` : 'The beds are empty. Rinse the soil twice before you plant.'],
    ['Catalogued', kinds ? `${kinds} material${kinds === 1 ? '' : 's'} in the analyser's catalogue, samples on the shelf.` : 'Nothing catalogued. The analyser works; the rocks are waiting.'],
    ['Photographed', shots ? `${st.photographed || 0} lander${(st.photographed || 0) === 1 ? '' : 's'} and ${st.sights || 0} sight${(st.sights || 0) === 1 ? '' : 's'} in the log.` : 'No photographs. Go and look at the blue sunset.'],
    ['Left for you', left.length ? left.join(', ') + '.' : 'The Hab as it landed, and these notes.'],
  ];
  showOverlay({
    kind: 'win',
    kicker: `Handover · Sol ${S.sol} · ${DIFFICULTIES[S.diff].name}`,
    title: 'For the first crew',
    subtitle: 'Groundwork, surface notes before launch',
    stats: [
      ['Sols on Mars', S.sol], ['Meals grown', grown], ['Dinners cooked', meals],
      ['Driven', `${(st.driven / 1000).toFixed(1)}<small>km</small>`], ['Walked', `${(st.walked / 1000).toFixed(1)}<small>km</small>`], ['Discoveries', discoveriesFound()],
      ['Landers salvaged', Object.keys(S.salvaged).length], ['Close calls', st.closeCalls], ['Achievements', `${achievements().filter((a) => S.achieved[a.id]).length}<small>of ${achievements().length}</small>`],
    ],
    extra: `<dl class="handover">${notes.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl><ol class="steps" aria-label="The mission, sol by sol">${steps}</ol>`,
    buttons: [{ label: 'File it and launch', fn: () => onFile() }, { label: 'Not yet', ghost: true, fn: () => {} }],
  });
}
const CROP_NAME = { potato: 'potatoes', radish: 'radishes', lettuce: 'lettuce', soy: 'soybeans', tomato: 'tomatoes' };

/** Docked with the Tern and on the way home: the run is won. The last words are Quinn's final note to the first crew. */
export function winGame() {
  S.won = true;
  Snd.rumble(0);
  Snd.play('rescued');
  checkAchievements();
  setTimeout(() => Snd.testLoop(false), 6000);
  wipeSave();
  const st = S.stats, grown = st.potatoes + (st.produce || 0);
  const fed = grown >= 30 ? 'The beds fed me most of the way.' : grown > 0 ? 'The beds fed me some of the way; the rations did the rest.' : 'I lived on the rations. Do better than me with the beds.';
  const mood = S.morale >= 70 ? ' It was a good place to be alone.' : S.morale < 30 ? ' It was a hard place to be alone. It will be easier with six.' : '';
  showOverlay({
    kind: 'win',
    kicker: `Docked with the Tern · Sol ${S.sol} · ${DIFFICULTIES[S.diff].name}`,
    title: 'Homeward',
    subtitle: 'The Tern\'s engine is lit. Mars is falling away.',
    quote: `<cite>Last note from Groundwork, Sol ${S.sol}</cite>To the first crew: the Hab is yours. ${fed} The inner airlock seal sticks; kick it low and left. Leave the light on over the comms desk. I did.${mood}`,
    buttons: [{ label: 'Back to the title', keep: true, fn: () => tryReload() }],
  });
}
