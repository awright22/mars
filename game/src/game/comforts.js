/*
 * Comforts: things Quinn makes to turn the Hab into a home.
 *
 * Each is made once at the Hab (Colony > Home), from scrap and from what the mission has turned
 * up, and then it is there: lights over the table, photos by the bunk, a chair at the window.
 * Each adds a little morale every dawn, and making one lifts it at once. With all of them the
 * Hab holds Quinn's spirits level by itself; without any, only food, music and mail do.
 *
 * The models are parts of one file, hab_comforts.glb, built in the Hab's own frame, so the game
 * only shows or hides them (world/build.js keeps the nodes in World.comfortParts).
 */
import { S } from './state.js';
import { cheer } from './farm.js';

const kinds = () => (S.science ? Object.keys(S.science.found).length : 0);

/**
 * needs(): true when it can be thought of at all; `why` is shown while it cannot.
 * cost: materials from the inventory (S.inv); `pantry` takes one thing from the pantry.
 */
export const COMFORTS = [
  { id: 'lights', name: 'String lights', cost: { circuit: 1, scrap: 1 }, cheer: 1,
    desc: 'Salvaged indicator LEDs on a wire over the table. At night the Hab stops looking like an operating theatre.',
    made: 'String lights up over the table. To the first crew: they draw almost nothing. Leave them on.' },
  { id: 'chair', name: 'Reading chair', cost: { scrap: 3 }, cheer: 1,
    desc: 'A spare rover seat on a welded frame, by the window, with a blanket. Somewhere to sit that is not a workstation.',
    made: 'A chair by the window. Not a seat: a chair. To the first crew: nothing is to be operated from it, ever.' },
  { id: 'chess', name: 'Chess set', cost: { scrap: 1 }, cheer: 0.5,
    desc: 'Nuts against bolts, on a board scratched into sheet metal. You play both sides and still lose.',
    made: 'Chess set done. Bolts play white. To the first crew: the black knight is the wing nut.' },
  { id: 'greg', name: 'Greg', cost: {}, cheer: 1,
    needs: () => !!(S.science && S.science.serial > 0), why: 'Chip a rock sample first. One of them will have a personality',
    desc: 'A rock with a face and a washer-and-nut hat. A good listener. Give it a place at the table.',
    made: 'To the first crew: this is Greg, a rock. Greg has the head of the table and is not moving.' },
  { id: 'photos', name: 'Photos from home', cost: {}, cheer: 1,
    needs: () => !!(S.mail && (S.mail.director || S.mail.capcom)), why: 'Wait for the first letters from Control',
    desc: 'Twelve photos from home, sent over the Earth-link, printed and taped by the bunk. Everyone in them expects you back.',
    made: 'Photos from home up by the bunk. Somebody sent the same one three times. It is a good photo.' },
  { id: 'herbs', name: 'Window garden', cost: { regolith: 1 }, cheer: 0.5,
    needs: () => S.stats.produce > 0, why: 'Harvest a crop other than potatoes first',
    desc: 'Cut bottles and a ration tin under the porthole, with something green in each. Not food. Just green.',
    made: 'A window garden. It produces nothing. That is the point of it.' },
  { id: 'rocks', name: 'Specimen shelf', cost: { scrap: 2 }, cheer: 0.5,
    needs: () => kinds() >= 3, why: 'Catalogue three different materials first',
    desc: 'The best of the samples, each on a stand with a label. A museum with one visitor.',
    made: 'Specimen shelf up, each sample labelled with place and sol. To the first crew: the labels are the valuable part.' },
  { id: 'flag', name: 'Banner', cost: { scrap: 1 }, cheer: 0.5,
    needs: () => Object.keys(S.salvaged).length >= 1, why: 'Salvage a lander first. A banner wants some progress to mark',
    desc: 'Mars in marker on Hab canvas, the Tern’s orbit a dashed ring round it, a tally of sols beside. Hung over the airlock.',
    made: 'Banner up over the airlock. One stroke a sol. To the first crew: start your tally under mine.' },
  { id: 'rug', name: 'Parachute rug', cost: { scrap: 1 }, cheer: 0.5,
    needs: (World) => !!(World && World.pods.some((p) => p.kind === 'pod' && p.taken)), why: 'Open a supply pod first: the rug is its parachute',
    desc: 'Orange and white gores from a supply parachute, stitched into an oval. Bare feet on something soft.',
    made: 'A rug. The Hab has a rug. I took my boots off and stood on it for a while.' },
];
const BY_ID = Object.fromEntries(COMFORTS.map((c) => [c.id, c]));

export function comforts() { if (!S.comforts) S.comforts = {}; return S.comforts; }
export function comfortCount() { return Object.keys(comforts()).length; }
/** Morale the Hab gives each dawn. */
export function comfortCheer() { return COMFORTS.reduce((n, c) => n + (comforts()[c.id] ? c.cheer : 0), 0); }

/** null if it can be made now, otherwise the reason. `World` is passed in so this module stays free of the world builder. */
export function comfortBlock(id, World) {
  const c = BY_ID[id];
  if (!c) return 'No such thing';
  if (comforts()[id]) return 'Made';
  if (c.needs && !c.needs(World)) return c.why;
  for (const k in c.cost) if ((S.inv[k] || 0) < c.cost[k]) return 'Not enough materials';
  return null;
}
/** Make it: pay, mark it made, lift morale. Returns the line for the log, or null if it could not be made. */
export function makeComfort(id, World) {
  if (comfortBlock(id, World)) return null;
  const c = BY_ID[id];
  for (const k in c.cost) S.inv[k] -= c.cost[k];
  comforts()[id] = true;
  S.stats.crafted++;
  cheer(4);
  return c.made;
}
