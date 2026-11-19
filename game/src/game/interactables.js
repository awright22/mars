import * as THREE from 'three';
import { ctx } from './ctx.js';
import { surfaceAt } from '../planet/surface.js';
import { HAB_R, World, buildDeployable, colliders, plotPlants, setSiteShown, siteLocalToWorld } from '../world/build.js';
import { syncDeposit } from '../world/base-sites.js';
import { groundDist, tangentBasis } from '../planet/geo.js';
import { player } from './player.js';
import { addI } from './interact.js';
import { BAL, S, airTime, isBase, roverPowerCap, suitCap } from './state.js';
import { UI, after, clearLog, flashScreen, log, playTime, showOverlay, statusText, toast } from '../ui/dom.js';
import { Snd } from '../audio/sound.js';
import { checkAchievements, discover, onQuestEvent, LINK_NAMES, nextToFit, linkFitted, fitLinkPart, linkPartFrom, takeLinkPart, showHandover } from './story.js';
import { startLaunch } from './launch.js';
import { _fe, _fn, _v1, _v2, _v3 } from '../core/scratch.js';
import { SOL_LOGS } from './text.js';
import { syncAllVisuals, syncIce, syncPod } from './visuals.js';
import { clamp } from '../core/math.js';
import { localSunEl, sleepTime, sleepToDawn } from './sim.js';
import { closeScreens, missingText, toggleScreen } from '../ui/screens.js';
import { boardRover, exitRover, roverF } from './rover.js';
import { ITEM_NAMES, RECIPES, gainLoot } from './inventory.js';
import { COMFORTS, comforts } from './comforts.js';
import { canSample, scienceSummary } from './science.js';
import { fmtDist } from '../planet/geo.js';
import { bagSoilHere } from './fieldwork.js';
import { CROPS, MORALE_WORD, cookDinner, dinnerPlan, foodTotal, harvest, moraleBand, plantable, seedStock, snack, takeSeed } from './farm.js';
import { showChoice } from '../ui/menus.js';
import { R } from '../planet/constants.js';
import { layout } from '../ui/layout.js';
import { WORK_BY_ID } from './base.js';
import { jobLine, standing, waterCap, works } from './works.js';
import { showWork } from '../ui/works.js';
import { costStr, hasCost, payCost } from './inventory.js';
// Every interaction in the world: farming, Hab stations, vehicles, salvage, building, the MAV.
//
// When a thing cannot be done, `enabled` gives the reason as a sentence, never a bare false: the prompt shows it, and a
// refusal with no reason is not shown at all (ui/dom.js, setPrompt). The sentence begins with what is wanting, in a few
// words, and after a colon says what to do about it: "Needs regolith: dig it at the heap outside the airlock". The few
// words are what the action button shows ("NEEDS REGOLITH"). A plain reading of a thing with nothing to do to it
// ("This panel is clean") is made with statusText() and shown without the barred ring. tests/ui.mjs holds every
// refusal here to that form.
//
// A prompt is a line and at most one line under it, each short enough to stand on one line of a small phone:
// `label` is what holding does, in a few words, and `sub` what it costs or gives. (Costs and counts in brackets in
// the label made three-line prompts: "Dig regolith at the / heap (you carry 0) / One load fills one bed".)
// tests/ui.mjs measures every one.
const loads = (n) => `${n} load${n === 1 ? '' : 's'}`;
export function syncPlot(pl) {
  pl.soilMesh.visible = pl.state !== 'empty';
  // a bed shows the plants of the crop it holds: alive and scaled as they grow, or withered
  const shown = plotPlants(pl, pl.crop);
  for (const set of [{ plants: pl.plants, dead: pl.plantsDead }, ...Object.values(pl.crops)]) {
    if (set === shown || (set.plants === shown.plants)) continue;
    set.plants.visible = false;
    if (set.dead) set.dead.visible = false;
  }
  shown.plants.visible = pl.state === 'growing' || pl.state === 'ready';
  if (shown.dead) shown.dead.visible = pl.state === 'dead';
  const k = Math.min(1, 0.25 + pl.growth * 0.75);
  shown.plants.scale.set(k, k, k);
}
export function plantedPlots() { return World.plots.filter(p => p.state === 'growing' || p.state === 'ready').length; }
export function nearestPlot() {
  let best = null, bestD = 2.2;
  for (const pl of World.plots) {
    if (!pl.worldPos) continue;
    const d = groundDist(player.pos, pl.worldPos);
    if (d < bestD) { bestD = d; best = pl; }
  }
  return best;
}
/** Put a crop in a bed of soil. */
function plant(pl, crop) {
  if (pl.state !== 'soil' || seedStock(crop) <= 0 || S.water < BAL.waterPerDose) return;
  takeSeed(crop);
  S.water -= BAL.waterPerDose;
  pl.crop = crop; pl.state = 'growing'; pl.growth = 0.04; pl.watered = 1;
  if (plantedPlots() === 1) log('First bed planted. To the first crew: rinse the soil twice. Perchlorate is patient, and so is hunger.');
  else if (crop !== 'potato' && !S.flags.plantedOther) { S.flags.plantedOther = true; log(`${CROPS[crop].name} in. The seed kit has earned its launch mass.`); }
  Snd.play('plant');
  syncPlot(pl);
}
const cropOf = (pl) => CROPS[pl.crop] || CROPS.potato;
addI({
  pos: () => { const pl = nearestPlot(); return pl ? pl.worldPos : null; },
  r: 2.2, hold: 1.3, mode: 'walk',
  visible: () => !S.flags.coldOpen && S.inside,
  enabled: () => {
    const pl = nearestPlot(); if (!pl) return false;
    switch (pl.state) {
      case 'empty': return S.inv.regolith > 0 ? true : 'Needs regolith: dig it at the heap outside';
      case 'soil': return plantable().length ? (S.water >= BAL.waterPerDose ? true : 'Needs water (5 L): bake some out of regolith at the oven') : 'Needs seed: nothing left to plant from';
      case 'growing':
        if (pl.watered < cropOf(pl).waterings && pl.growth >= 0.42) return S.water >= BAL.waterPerDose ? true : 'Needs water (5 L): bake some out of regolith at the oven';
        // (a reading, not a lock: there is nothing to do to it yet)
        // (a bed sown a moment ago is "just planted": "4% grown" on a bed he had only just filled read as a slip)
        return statusText(`${cropOf(pl).name}: ${pl.growth < 0.08 ? 'just planted' : `${Math.round(pl.growth * 100)}% grown`}${pl.watered < cropOf(pl).waterings ? ', water again at 50%' : ''}`);
      case 'ready': case 'dead': return true;
    }
    return false;
  },
  label: () => {
    const pl = nearestPlot(); if (!pl) return '';
    switch (pl.state) {
      case 'empty': return 'Fill this bed with regolith';
      case 'soil': return plantable().length > 1 ? 'Plant this bed…' : 'Plant potatoes in this bed';
      case 'growing': return `Water the ${cropOf(pl).name.toLowerCase()}`;
      case 'ready': return `Harvest the ${cropOf(pl).name.toLowerCase()}`;
      case 'dead': return 'Clear out the dead crop';
    }
    return '';
  },
  sub: () => {
    const pl = nearestPlot(); if (!pl) return '';
    switch (pl.state) {
      case 'empty': return `Uses 1 of the ${loads(S.inv.regolith || 0)} you carry`;
      case 'soil': return plantable().length > 1 ? 'Choose what to grow' : `Uses 1 ${S.potatoes > 0 ? 'potato' : 'ration'} and 5 L of rinse water`;
      case 'growing': return 'Uses 5 L of water';
      case 'ready': return `Brings in ${cropOf(pl).yield}`;
    }
    return '';
  },
  // (the task this belongs to: standing at a bed, that is the task the HUD leads with)
  task: () => { const pl = nearestPlot(); return !pl ? '' : pl.state === 'growing' ? 'water' : pl.state === 'ready' ? 'harvest' : 'farm'; },
  use: () => {
    const pl = nearestPlot(); if (!pl) return;
    switch (pl.state) {
      case 'empty':
        S.inv.regolith--; pl.state = 'soil';
        Snd.play('fillBed');
        break;
      case 'soil': {
        const can = plantable();
        if (can.length > 1) {
          // more than one thing to plant: ask
          // (which one? Until the staple is in the ground, the card says so. And "6 to plant" says what the six are
          // when they are packets and last harvest's together.)
          const first = !World.plots.some((p) => (p.state === 'growing' || p.state === 'ready') && (p.crop || 'potato') === 'potato') && can.includes('potato');
          showChoice({
            kicker: 'Farm', title: 'What goes in this bed?',
            // (which to plant first is said on the potato's own card, as a mark; under the list it was a second
            //  sentence that wrapped in a narrow column beside Cancel)
            note: 'Each bed takes 5 L of water to rinse the perchlorate out.',
            items: can.map((id) => {
              const c = CROPS[id], n = seedStock(id);
              const packets = id === 'potato' ? 0 : (S.seeds[id] || 0), kept = id === 'potato' ? 0 : (S.pantry[id] || 0);
              // (the count is how many beds he has seed for, and says so: "13 to plant" for a bed that takes one read as a
              // mistake, the more so beside "uses a potato" with six potatoes in the inventory)
              const plural = (k, one) => `${k} ${one}${k === 1 ? '' : 's'}`;
              const potatoNote = S.potatoes > 0 && S.food > 0 ? `Seed potatoes. A bed takes one potato (you have ${S.potatoes}), then one ration (${S.food}).`
                : `Seed potatoes. A bed takes one of your ${S.potatoes > 0 ? plural(S.potatoes, 'potato').replace('potatos', 'potatoes') : plural(S.food, 'ration')}.`;
              return { label: c.name, icon: id, tag: first && id === 'potato' ? 'Plant first' : '', sub: `Ready in ${c.growSols.toFixed(1)} sols · ${c.waterings} watering${c.waterings > 1 ? 's' : ''} · ${c.yield} meal${c.yield === 1 ? '' : 's'}`,
                // (every crop says what it would be planted from: lettuce alone, with packets and nothing in the pantry, said only that it crunched)
                note: id === 'potato' ? potatoNote : packets && kept ? `${packets} seed packet${packets > 1 ? 's' : ''} and ${kept} from the pantry.`
                  : packets ? `${plural(packets, 'seed packet')}. ${c.pick || c.note}` : `${kept} from the pantry. ${c.pick || c.note}`,
                count: `Seed for ${plural(n, 'bed')}`, fn: () => plant(pl, id) };
            }),
          });
        } else plant(pl, can[0] || 'potato');
        break;
      }
      case 'growing':
        S.water -= BAL.waterPerDose; pl.watered++;
        Snd.play('water');
        break;
      case 'ready': {
        const crop = CROPS[pl.crop] ? pl.crop : 'potato';
        const first = crop === 'potato' ? S.stats.potatoes === 0 : !(S.stats.produce > 0);
        pl.state = 'soil'; pl.growth = 0; pl.watered = 0;
        const n = harvest(crop);
        Snd.play('harvest'); Snd.jingle();
        if (crop === 'potato') { if (first) log('First harvest: potatoes. To the first crew: they like the bed nearest the heater. So did I.'); }
        else {
          toast('HARVEST', `${n} ${CROPS[crop].name.toLowerCase()}`, 'In the pantry. Eat it at breakfast, or cook a dinner.');
          if (first) log(`First ${CROPS[crop].name.toLowerCase()} in the pantry. I ate one standing at the bed. Recommended.`);
        }
        checkAchievements();
        break;
      }
      case 'dead':
        pl.state = 'soil'; pl.growth = 0; pl.watered = 0;
        Snd.play('clearBed');
        break;
    }
    syncPlot(pl);
  },
});

// ============================================================
// 18. WORLD INTERACTABLES
// ============================================================
// cold open: seal the suit at the hab door
addI({
  pos: () => siteLocalToWorld(World.hab, 0, 0, HAB_R + 1.6, _v2),
  r: 3.4, hold: 2.2, mode: 'walk',
  visible: () => S.flags.coldOpen,
  label: () => 'Seal the suit',
  use: () => {
    S.flags.coldOpen = false;
    S.flags.suitSealed = true;
    S.suit = suitCap();
    S.shake = 1.2;
    flashScreen('rgba(139,224,164,0.22)', 220);         // (a breath of green, for air: the red it used to be read as a wound)
    Snd.play('suitSeal');
    // One thing at a time. The moment itself is the flash, the dial filling and the next thing to do, alone. The
    // Hab's line comes when that has been read, and his own log entry when the Hab's has. (All of it used to land
    // within a second, on top of the old prompt and the old task struck through.)
    clearLog();                                          // (a line from the run to the door is not left to surface now)
    after(2.8, () => log('Suit sealed at the airlock. Air coming back. Bruised, nothing broken. Taking stock.', 'suit'));
    after(9, () => log(SOL_LOGS[1]));
  },
});
export function addInspect(id, lx, lz, name, doneLine, found, bar) {
  addI({
    pos: () => siteLocalToWorld(World.hab, lx, 0, lz, _v2),
    r: 2.6, hold: 0.7, mode: 'walk', pose: 'stand', task: 'systems',
    visible: () => S.started && !S.flags.coldOpen && !S.checkedSystems[id],
    label: () => `Inspect the ${name}`,
    // (What the inspection found, on a card: the log's line alone was hidden on a phone by the card that came next.
    //  The machine's bar arrives on the HUD with it (ui/hud.js) and is lit while the card that names it is up. His
    //  own remark goes to the journal: on the HUD it was a second card about the same machine.)
    use: () => { S.checkedSystems[id] = true; Snd.ok(); log(doneLine, null, { quiet: true }); toast(name.toUpperCase(), 'Working', found, { lit: UI.bars[bar].wrap, life: 7000 }); },
  });
}
addInspect('oxy', 5.6, -3.6, 'oxygenator',
  'Oxygenator: running. CO2 and power in, air out. To the first crew: it rattles at forty percent. That is normal.', 'It makes the Hab’s air while there is power. Its bar: HAB O2.', 'o2');
addInspect('rec', 5.9, -0.4, 'water reclaimer',
  'Water reclaimer: running. It wins back nine litres in ten. Plan for the tenth.', 'It wins back most of the water you use. Its bar: WATER.', 'water');
// NOTE: world arrays (panels, piles, landers, ice) fill AFTER world build —
// these interactables resolve their nearest target dynamically at query time.
export function nearestOf(list, posOf, maxD, filter) {
  let best = null, bestD = maxD;
  for (const item of list) {
    if (filter && !filter(item)) continue;
    const d = groundDist(player.pos, posOf(item));
    if (d < bestD) { bestD = d; best = item; }
  }
  return best;
}
// solar panels
export function panelPos(p) {
  return _v3.copy(p.group.position).applyQuaternion(World.solarGroup.quaternion).add(World.solarGroup.position);
}
addI({
  pos: () => {
    const p = nearestOf(World.panels, panelPos, 3.0);
    return p ? panelPos(World._activePanel = p) : null;
  },
  r: 3.0, hold: 1.6, mode: 'walk', pose: 'stand', task: 'panels',
  visible: () => !S.flags.coldOpen,
  enabled: () => World._activePanel && World._activePanel.dust > 0.06 ? true : statusText('This panel is clean'),
  // (what wiping it is worth, in the prompt: nothing else on screen said whether it was)
  label: () => 'Wipe this solar panel',
  sub: () => (World._activePanel && World._activePanel.dust > 0.06 ? `Its output: ${Math.round((1 - World._activePanel.dust) * 100)}% → 100%` : ''),
  use: () => {
    const p = World._activePanel;
    if (!p) return;
    p.dust = 0;
    S.stats.panels++;
    syncAllVisuals();
    Snd.play('wipe');
    if (S.stats.panels === 1) log('To the first crew: wipe the panels top down, or you only move the dust round.');
  },
});
// regolith piles (fast) + dig-anywhere (slow, lowest priority)
addI({
  pos: () => {
    const sp = nearestOf(World.soilPiles, s => s.group.position, 2.8, s => s.left > 0);
    return sp ? (World._activePile = sp).group.position : null;
  },
  r: 2.8, hold: 1.4, mode: 'walk', task: 'farm',
  visible: () => !S.flags.coldOpen,
  label: () => 'Dig a load of regolith',
  sub: () => `You carry ${loads(S.inv.regolith || 0)} · one fills a bed`,
  use: () => {
    const sp = World._activePile;
    if (!sp || sp.left <= 0) return;
    sp.left--; S.inv.regolith++;
    syncAllVisuals();
    Snd.play('dig');
  },
});
/**
 * Why the open ground is worth digging where he stands now: { label, sub }, or null when nothing wants it.
 *
 * Digging can be done anywhere out of doors, so it is the one "ambient" interaction, and the rule for those is that
 * they are offered with a reason or not at all (game/interact.js). Offered always, "Dig regolith here (slow)" and a
 * DIG button stood on the screen every second he was outside, and the prompt no longer meant that something was
 * there. The reasons are two:
 *  - something is waiting on a load of regolith (an empty bed, an O2 candle or the window garden he has everything
 *    else for) and there is no heap left within a walk: the heaps are quicker, and the farm's task sends him to them;
 *  - this is new ground and there is room in the sample case: a scoop of it is a sample (and a load besides).
 */
/** Loads of regolith to a turn of digging in a base: he digs for a kiln now, not for a flowerpot. */
const BASE_DIG = 3;
let digMemo = null, digMemoAt = -1;
export function digOffer() {
  if (digMemoAt === playTime()) return digMemo;
  digMemoAt = playTime();
  return (digMemo = digReason());
}
function digReason() {
  if (!S.flags.didMath) return null;
  const carried = S.inv.regolith || 0;
  // (a base's works run on soil where there is nothing better: while one stands and the stores are low, the open
  //  ground is worth digging anywhere, three loads to a turn)
  // (not on the Hab's own doorstep: at the airlock at nightfall the button said DIG where the task said sleep)
  if (isBase() && carried < 12 && groundDist(player.pos, World.hab.position) > HAB_R + 9 && works().some((w) => !w.job && w.def.jobs.some((j) => j.in.regolith)))
    return { label: 'Dig regolith here', sub: `+${BASE_DIG} for the works · ${carried} carried` };
  if (!World.soilPiles.some((s) => s.left > 0 && groundDist(player.pos, s.group.position) < 400)) {
    const why = (what) => ({ label: 'Dig a load of regolith here', sub: `For ${what} · no heap near` });
    if (World.plots.filter((p) => p.state === 'empty').length > carried) return why('an empty farm bed');
    if (!carried) {
      // (a thing he has everything for but the regolith)
      const short = (cost) => cost.regolith > 0 && Object.keys(cost).every((k) => k === 'regolith' || (S.inv[k] || 0) >= cost[k]);
      const r = RECIPES.find((x) => short(x.cost));
      if (r) return why(/^[aeiou]/i.test(r.name) ? `an ${r.name}` : `a ${r.name}`);
      const c = COMFORTS.find((x) => !comforts()[x.id] && short(x.cost) && (!x.needs || x.needs(World)));
      if (c) return why(`the ${c.name.toLowerCase()}`);
    }
  }
  // (soil is sampled once he has a sample case going, or is well away from home: on the Hab's own doorstep on the
  //  first sol it would be one more thing offered before he has heard of samples)
  const sc = scienceSummary();
  if (canSample(player.pos, 'soil') === true && (sc.kinds + sc.bagged > 0 || groundDist(player.pos, World.hab.position) > 300))
    return { label: 'Bag a regolith sample here', sub: `New ground · bag ${sc.bagged + 1} of ${sc.limit}` };
  return null;
}
addI({
  pos: () => player.pos, r: 99, hold: 2.6, mode: 'walk', priority: 9,
  visible: () => !S.flags.coldOpen && !S.inside && !!digOffer(),
  label: () => (digOffer() || { label: 'Dig here' }).label,
  sub: () => (digOffer() || { sub: '' }).sub,
  use: () => { S.inv.regolith += isBase() ? BASE_DIG : 1; Snd.play('dig'); bagSoilHere(); digMemoAt = -1; },
});
// the regolith oven: bakes the water out of a load of soil (about 2% of it by weight, as Curiosity measured), on the
// Hab's battery. It stands where the old station plan put a rig, at the same place on the floor.
addI({
  pos: () => siteLocalToWorld(World.hab, 5.5, 0, 2.6, _v2),
  r: 2.4, hold: 2.0, mode: 'walk', pose: 'stand', task: () => (S.water < 12 ? 'lowwater' : 'oven'),
  visible: () => !S.flags.coldOpen && S.inside,
  enabled: () => ((S.inv.regolith || 0) < 1 ? 'Needs regolith: dig a load at the heap outside'
    : S.power < BAL.ovenPower + 3 ? `Needs power: the oven takes ${BAL.ovenPower}% of the battery` : true),
  label: () => `Bake a load of regolith: +${BAL.ovenWater} L of water`,
  sub: () => `Uses 1 of the ${loads(S.inv.regolith || 0)} you carry · ${BAL.ovenPower}% of the battery`,
  use: () => {
    if ((S.inv.regolith || 0) < 1 || S.power < BAL.ovenPower + 3) return;
    S.inv.regolith--;
    S.power = clamp(S.power - BAL.ovenPower, 0, BAL.powerMax);
    S.water = clamp(S.water + BAL.ovenWater, 0, waterCap());
    S.stats.bakes = (S.stats.bakes || 0) + 1;
    if (World.ovenGlow) { World.ovenGlow.visible = true; setTimeout(() => { World.ovenGlow.visible = false; }, 2600); }
    Snd.play('oven');
    if (S.stats.bakes === 1) log(`To the first crew: the oven gets ${BAL.ovenWater} L out of a load of soil and takes a big bite of the battery. Bake by day, when the panels can pay for it.`);
    else Snd.ok();
    checkAchievements();
  },
});
// bunk
addI({
  pos: () => siteLocalToWorld(World.hab, -5.0, 0, -4.9, _v2),
  r: 2.3, hold: 1.2, mode: 'walk', pose: 'stand', task: 'sleep',
  // (not while the Hab is holed: its button then read NO SLEEP YET, the one thing on the screen that was not about the
  //  breach. The banner, the card and the marker say where to go.)
  visible: () => !S.flags.coldOpen && S.inside && !S.breach.active,
  enabled: () => {
    // (it names what is refused, and leaves where the breach is to the task that leads the list: "Breach first: seal
    //  the far wall, behind the comms desk" was the sixth time the screen said breach, and its button, BREACH FIRST,
    //  did not say what it would not do)
    if (S.breach.active) return 'No sleep yet: seal the breach first';
    // (not yet time is a reading, not a lock: the first prompt on waking was a padlock)
    const ok = sleepTime();
    return ok === true ? true : statusText(`The bunk. ${ok}`);
  },
  label: () => 'Sleep until dawn',
  use: () => sleepToDawn(false),
});
// the food shelf: eat something now, or cook a proper dinner when the pantry allows one
const SNACK = { potato: 'potato. Again.', ration: 'ration', soy: 'bowl of soybeans', radish: 'radish', lettuce: 'handful of lettuce', tomato: 'tomato' };
const nextSnack = () => (S.potatoes > 0 ? 'potato' : ['soy', 'radish', 'lettuce', 'tomato'].find((id) => S.pantry && S.pantry[id] > 0) || (S.food > 0 ? 'ration' : null));
addI({
  pos: () => siteLocalToWorld(World.hab, 4.2, 0, 4.8, _v2),
  r: 2.2, hold: 0.8, mode: 'walk', pose: 'stand',
  visible: () => !S.flags.coldOpen && S.inside && !dinnerPlan().ok,
  enabled: () => S.health > 92 ? statusText('The food shelf. Not hungry right now') : foodTotal() > 0 ? true : statusText('The food shelf is bare'),
  label: () => `Eat a ${SNACK[nextSnack()] || 'ration'}`,
  // what it gives; and once there is produce, what a cooked dinner still wants
  sub: () => (S.stats.produce > 0 ? `Dinner ${dinnerPlan().why.toLowerCase()}` : '+12 health'),
  use: () => {
    if (!snack()) return;
    S.health = clamp(S.health + 12, 0, BAL.healthMax);
    Snd.play('eat');
  },
});
addI({
  pos: () => siteLocalToWorld(World.hab, 4.2, 0, 4.8, _v2),
  r: 2.2, hold: 2.4, mode: 'walk', pose: 'stand', priority: -1, task: 'dinner',
  visible: () => !S.flags.coldOpen && S.inside && dinnerPlan().ok,
  label: () => 'Cook a dinner',
  sub: () => { const p = dinnerPlan(); return `${p.staple === 'soy' ? 'Soybeans' : 'Potato'}, ${p.sides.map((id) => CROPS[id].name.toLowerCase()).join(' and ')}`; },
  use: () => {
    const line = cookDinner();
    if (!line) return;
    Snd.play('eat'); Snd.jingle();
    toast('DINNER', 'A cooked meal', `Morale ${Math.round(S.morale)} · ${MORALE_WORD[moraleBand()]}`);
    log(line);
    checkAchievements();
  },
});
// comms desk: the numbers, messages to Control, the test loop
addI({
  pos: () => siteLocalToWorld(World.hab, 0, 0, -6.6, _v2),
  r: 2.4, hold: 0.8, mode: 'walk', pose: 'stand', task: 'math',
  visible: () => !S.flags.coldOpen && S.inside && !S.flags.didMath,
  label: () => 'Check the numbers',
  use: () => {
    S.flags.didMath = true;
    Snd.play('terminal');
    // (his own entries go to the journal: the card says all of it, and on the HUD they were two more cards to read)
    const base = isBase();
    if (base) {
      log(`${S.food} rations. The Tern is gone and the next ship is 26 months out. Rations will not cover that; the beds will have to.`, null, { quiet: true });
      log('The plan: eat, build an Earth-link and tell Control I am alive, then build the place the next ship will land.', null, { quiet: true });
    } else {
      log(`${S.food} rations. The Tern leaves orbit just after Sol ${S.rescueSol}. Rations will not cover the wait; the beds will have to.`, null, { quiet: true });
      log(`The plan: eat, build an Earth-link and tell Control I am alive, then drive to Arcadia Station. The ascent vehicle can launch on Sol ${S.rescueSol}.`, null, { quiet: true });
    }
    // the premise of the whole game: a card he reads and puts down, not a line that scrolls away
    showOverlay({
      kicker: 'The numbers', title: 'Farm or starve',
      // (food is counted in meals, here as on the FOOD bar: a ration is one; and the date is the rescue, in the same
      //  two words wherever it is given)
      stats: base ? [['Meals left', S.food], ['Launch', 'None'], ['Next ship', '26 months']]
        : [['Meals left', S.food], ['Launch', `Sol ${S.rescueSol}`], ['Sols with nothing to eat', Math.max(0, S.rescueSol - 1 - S.food)]],
      // (short enough to show whole, with its button, on a phone held sideways)
      body: `${S.food} ration packs, one meal a sol: they run out long before ${base ? 'the next ship' : 'the launch'}.\n\n` +
        'The Hab has six farm beds. Fill them with regolith, the soil of Mars, from the heaps outside the airlock; rinse out the perchlorate; plant; and water. <b>A potato bed takes one ration and gives back four potatoes.</b>',
      // (And where it is all going, on the card itself, as the morning's account has it: it used to arrive ten seconds
      //  later as a line of the log, in the slot that carries his jokes, while he stood at a bed with PLANT up.)
      later: base ? 'Build an Earth-link from the parts of old landers and tell Control you are alive. Then build the place the next ship will land.'
        : `Build an Earth-link from the parts of old landers and tell Control you are alive. Then drive to Arcadia Station, ${fmtDist(groundDist(World.hab.position, World.mav.position))} away: the ascent vehicle can launch on Sol ${S.rescueSol}.`,
      wide: true,
      buttons: [{ label: 'Get to work', fn: () => {} }],
    });
  },
});
addI({
  pos: () => siteLocalToWorld(World.hab, -0.9, 0, -6.4, _v2),
  r: 2.2, hold: 0.8, mode: 'walk', pose: 'stand',
  visible: () => !S.flags.coldOpen && S.inside && S.link.connected,
  label: () => 'Message Control',
  use: () => {
    const lines = [
      'To Control: air good, water good, beds green. Full numbers in the morning packet. — Quinn',
      'Asked Control for a weather report. It said dust. It was right.',
      'To Control: the inner airlock seal sticks. Logged for the first crew: kick it low and left.',
      'Told Control the sunset was blue again. They said they know. I said I know they know.',
      'Control reminds me this channel is public. Hello, everyone. The soil is cold and the view is good.',
    ];
    Snd.play('nasaSend');
    log(lines[(S.flags.nasaMsg = (S.flags.nasaMsg + 1)) % lines.length], 'control');
  },
});
addI({
  pos: () => siteLocalToWorld(World.hab, 0.9, 0, -6.4, _v2),
  r: 2.2, hold: 0.6, mode: 'walk', pose: 'stand',
  visible: () => !S.flags.coldOpen && S.inside && S.link.connected,
  label: () => (S.testLoop ? 'Stop the test loop' : 'Play the test loop'),
  sub: () => 'The one audio file the contractor left',
  use: () => {
    S.testLoop = !S.testLoop;
    Snd.testLoop(S.testLoop);
    if (S.testLoop && !S.flags.loopHeard) { S.flags.loopHeard = true; log('To the first crew: the outfitting contractor left one audio file on the Hab system, a test loop. It does not end. You will learn every bar.'); }
  },
});
// workbench — opens the colony screen
addI({
  pos: () => siteLocalToWorld(World.hab, -4.75, 0, 4.2, _v2),          // at the fabricator bench
  r: 2.4, hold: 0.5, mode: 'walk', pose: 'stand',
  visible: () => !S.flags.coldOpen && S.inside,
  label: () => (layout.touch ? 'Use the fabricator' : 'Use the fabricator [C]'),      // (a key's name is no use on a phone)
  // (he has met the Colony screen by opening it here: its button is his from now on, without a card to say so)
  use: () => { S.flags.uiColony = true; toggleScreen('colony'); },
});
// rover enter + exit + camp
addI({
  pos: () => World.rover.group.position,
  r: 3.8, hold: 0.6, mode: 'walk', pose: 'stand',
  visible: () => !S.flags.coldOpen,
  label: () => 'Drive the rover',
  sub: () => `Battery ${Math.round(S.roverPower / roverPowerCap() * 100)}% · O2 ${Math.round(S.roverO2 / BAL.roverO2Cap * 100)}%`,
  use: () => boardRover(),
});
addI({
  pos: () => World.rover.group.position, r: 1e9, hold: 0.4, mode: 'rover',
  // (on a touch screen the EXIT button is the way out: a second control beside it, under another name, was one too many)
  visible: () => !layout.touch && Math.abs(roverF.speed) < 1.5 && localSunEl() >= 0.05,
  label: () => 'Exit the rover',
  use: () => exitRover(),
});
addI({
  pos: () => World.rover.group.position, r: 1e9, hold: 2.2, mode: 'rover',
  visible: () => Math.abs(roverF.speed) < 1.5 && localSunEl() < 0.05 && sleepTime() === true,
  label: () => 'Camp in the rover until dawn',
  sub: () => (layout.touch ? 'or EXIT to get out' : 'or press F to get out'),
  use: () => sleepToDawn(true),
});
// the Earth-link: parts salvaged from landers (game/story.js, LINK_PARTS) are fitted at the dish's mast by the Hab; the
// third one fitted makes the call
addI({
  pos: () => World.uplink.position,
  r: 5.0, hold: 2.6, mode: 'walk', pose: 'stand', task: 'link',
  visible: () => !S.link.connected && !!nextToFit(),
  label: () => { const k = nextToFit(); return k ? `Fit the ${LINK_NAMES[k]}` : ''; },
  sub: () => { const k = nextToFit(); return k ? `From ${S.link.got[k]} · part ${linkFitted() + 1} of 3` : ''; },
  use: () => fitLinkPart(nextToFit()),
});
// landers: salvage + quest hooks (dynamic — landers exist only after world build)
export const LANDER_CIRCUITS = { 'Spirit': 3, 'Beagle 2': 1, 'InSight': 2, 'Curiosity': 1, 'Zhurong': 1, 'Opportunity': 2 };
addI({
  pos: () => {
    const rec = nearestOf(World.landers, l => l.group.position, 5.0, l => !S.salvaged[l.data.name]);
    return rec ? (World._activeLander = rec).group.position : null;
  },
  r: 5.0, hold: 2.4, mode: 'walk', pose: 'stand',
  visible: () => !S.flags.coldOpen,
  label: () => World._activeLander ? `Salvage ${World._activeLander.data.name}` : '',
  sub: () => { const L = World._activeLander; if (!L) return ''; const k = linkPartFrom(L.data); return k ? `Landed in ${L.data.year} · has a ${LINK_NAMES[k]}` : `Landed in ${L.data.year}`; },
  use: () => {
    const rec = World._activeLander;
    if (!rec || S.salvaged[rec.data.name]) return;
    S.salvaged[rec.data.name] = true;
    Snd.play('salvage');
    const loot = { scrap: rec.data.scrap };
    if (LANDER_CIRCUITS[rec.data.name]) loot.circuit = LANDER_CIRCUITS[rec.data.name];
    const got = gainLoot(loot);
    log(`Salvaged ${rec.data.name}: ${got}. ${rec.data.note}`, 'disc');
    takeLinkPart(rec.data);
    discover(rec.data.name, rec.data.note, true);
    onQuestEvent('salvage', rec.data.name);
    checkAchievements();
  },
});
// ice deposits (dynamic)
addI({
  pos: () => {
    const site = nearestOf(World.iceSites, s => s.group.position, 4.5, s => s.left > 0);
    return site ? (World._activeIce = site).group.position : null;
  },
  r: 4.5, hold: 1.6, mode: 'walk',
  visible: () => !S.flags.coldOpen,
  enabled: () => S.upgrades.drill ? true : 'Needs the Ice Drill: an upgrade, made in Colony',
  label: () => 'Mine water ice',
  sub: () => `+1 ice chunk · ${World._activeIce ? World._activeIce.left : 0} left here`,
  use: () => {
    const site = World._activeIce;
    if (!site || site.left <= 0) return;
    site.left--; S.inv.ice++; S.stats.mined++;
    syncIce(site);
    Snd.play('drill');
    checkAchievements();
  },
});
// a base's mineral deposits (dynamic)
addI({
  pos: () => {
    if (!World.deposits) return null;
    const site = nearestOf(World.deposits, (s) => s.group.position, 6.5, (s) => s.left > 0);
    return site ? (World._activeDeposit = site).group.position : null;
  },
  r: 6.5, hold: 2.0, mode: 'walk',
  visible: () => isBase() && !S.flags.coldOpen,
  label: () => (World._activeDeposit ? World._activeDeposit.dep.verb : 'Quarry'),
  sub: () => { const s = World._activeDeposit; return s ? `+${s.dep.per} ${ITEM_NAMES[s.dep.gives].toLowerCase()} · ${s.left} loads left here` : ''; },
  use: () => {
    const site = World._activeDeposit;
    if (!site || site.left <= 0) return;
    site.left = site.left - 1;
    S.inv[site.dep.gives] = (S.inv[site.dep.gives] || 0) + site.dep.per;
    S.stats.quarried = (S.stats.quarried || 0) + site.dep.per;
    (S.stats.minerals = S.stats.minerals || {})[site.dep.gives] = 1;         // (which minerals he has quarried: an achievement counts them)
    syncDeposit(site);
    Snd.play('dig');
    if (site.left === 0) log(`${site.dep.name} worked out. There are others in ${site.field.name}.`, 'sys');
    checkAchievements();
  },
});
// debris & supply pods
addI({
  pos: () => {
    let best = null, bestD = 4.5;
    for (const p of World.pods) {
      if (p.taken) continue;
      const d = groundDist(player.pos, p.group.position);
      if (d < bestD) { bestD = d; best = p; }
    }
    return best ? (World._activePod = best).group.position : null;
  },
  r: 4.5, hold: 1.6, mode: 'walk',
  visible: () => !S.flags.coldOpen,
  // (a reward pod is named for its task on the line under: 'Open "Oppy's Last Message" reward pod' ran to two lines)
  label: () => World._activePod ? World._activePod.label.replace(/^Open ["“].*["”] reward pod$/, 'Open the reward pod') : '',
  sub: () => { const m = World._activePod && /^Open ["“](.*)["”] reward pod$/.exec(World._activePod.label); return m ? `For “${m[1]}”` : ''; },
  use: () => {
    const p = World._activePod;
    if (!p || p.taken) return;
    p.taken = true;
    syncPod(p);
    Snd.play(p.kind === 'pod' ? 'podOpen' : 'salvage');
    const got = gainLoot(p.loot);
    log(`Recovered: ${got}.`);
    // (and as a card: on the quiet HUD a line of the log is a few seconds of small type, and a reviewer of the base
    //  mode opened a supply drop and saw "nothing of its contents": a gauge moved, and that was all)
    toast(p.kind === 'pod' ? 'SUPPLIES' : 'SALVAGE', 'Recovered', `${got.charAt(0).toUpperCase()}${got.slice(1)}.`, { life: 6000 });
    if (p.blueprint) { S.blueprints[p.blueprint] = true; log(`Control sent the drawings with it: ${p.blueprint.toUpperCase()} blueprint unlocked.`, 'control'); }
  },
});
// the Hab lander's RTG, down on its own parachute well out from the Hab
addI({
  pos: () => World.rtgSite.group.position,
  r: 4.0, hold: 3.0, mode: 'walk', pose: 'stand',
  visible: () => !S.flags.coldOpen && !World.rtgSite.taken && S.flags.didMath,
  label: () => 'Recover the RTG',
  sub: () => 'Plutonium heat source, in its casing',
  use: () => {
    World.rtgSite.taken = true;
    syncAllVisuals();
    S.flags.hasRtg = true;
    Snd.play('rtg');
    log('Recovered the RTG: a plutonium heat source in a casing built to outlast the landing, which it did. Fit it at the fabricator.');
  },
});
// breach patch
addI({
  pos: () => siteLocalToWorld(World.hab, 0, 0, -HAB_R + 1.2, _v2),
  // an emergency outranks the desk in front of it (the comms prompts used to win on distance,
  // which left the breach impossible to seal once the link was up)
  r: 3.6, hold: 3.0, mode: 'walk', pose: 'stand', priority: -1, task: 'breach',
  visible: () => S.breach.active && S.inside,
  label: () => 'Seal the breach',
  sub: () => 'Patch canvas and sealant over the landing-damaged seam',
  use: () => {
    S.breach.active = false;
    S.breach.done = true;
    Snd.alarm(false);
    Snd.play('sealBreach');
    S.shake = 0.5;
    syncAllVisuals();
    log(S.breach.cropsKilled ?
      'Sealed. Too late for the crops: the beds froze. To the first crew: that seam took a knock in the landing. Watch it.' :
      'Breach sealed, crops alive. To the first crew: the seam by the comms desk was damaged in the landing. Check it first.');
  },
});
// deployed O2 caches
addI({
  pos: () => {
    let best = null, bestD = 3.5;
    for (const b of World.builtMeshes) {
      if (b.kind !== 'cache' || b.charges <= 0) continue;
      const d = groundDist(player.pos, b.group.position);
      if (d < bestD) { bestD = d; best = b; }
    }
    return best ? (World._activeCache = best).group.position : null;
  },
  r: 3.5, hold: 1.0, mode: 'walk', pose: 'stand',
  visible: () => !S.flags.coldOpen,
  enabled: () => S.suit < suitCap() - 5 ? true : statusText('An O2 cache. The suit is full'),
  label: () => 'Top up the suit here',
  sub: () => `+${airTime(40)} of air · ${World._activeCache ? World._activeCache.charges : 0} left in the cache`,
  use: () => {
    const c = World._activeCache;
    if (!c || c.charges <= 0) return;
    c.charges--;
    S.suit = clamp(S.suit + 40, 0, suitCap());
    Snd.play('o2Refill');
  },
});
// kit deployment
export let deployKind = null;
export function startDeploy(kind) {
  deployKind = kind; buildKind = null;
  closeScreens();
  // (how to do it is said on a card and not kept: in the log it stood under the Hab's name, in red, for the rest of
  //  the run, an instruction with no subject)
  toast('DEPLOY', ITEM_NAMES['kit' + kind.charAt(0).toUpperCase() + kind.slice(1)] || kind, 'Pick a spot outside, then hold to place it.');
}
addI({
  pos: () => player.pos, r: 99, hold: 1.6, mode: 'walk', priority: 2,
  visible: () => !!deployKind && !S.inside,
  label: () => 'Set the kit down here',
  sub: () => ITEM_NAMES['kit' + deployKind.charAt(0).toUpperCase() + deployKind.slice(1)] || deployKind,
  use: () => {
    const kitKey = 'kit' + deployKind.charAt(0).toUpperCase() + deployKind.slice(1);
    if ((S.inv[kitKey] || 0) <= 0) { deployKind = null; return; }
    S.inv[kitKey]--;
    // set it down in front of the astronaut with its front (the greenhouse door) toward them
    const kind = deployKind;
    _v1.copy(player.pos).normalize();
    _v2.set(0, 0, -1).applyQuaternion(player.q);
    _v1.addScaledVector(_v2, (kind === 'greenhouse' ? 6.4 : 2.6) / R).normalize();
    tangentBasis(_v1, _fe, _fn);
    buildDeployable(kind, _v1, Math.atan2(_v2.dot(_fe), _v2.dot(_fn)));
    Snd.play('deploy');
    log(`${ITEM_NAMES[kitKey]} deployed. To the first crew: it is on the map.`);
    syncAllVisuals();
    onQuestEvent('deploy', deployKind);
    deployKind = null;
    checkAchievements();
  },
});
// A base's works (kiln, smelter, glassworks: game/base.js): chosen on the Colony screen, set down outside like a kit.
// What it costs is paid when it is set down, and it must stand where the Hab's power cable will reach.
export let buildKind = null;
export function startBuild(id) {
  buildKind = id; deployKind = null;
  closeScreens();
  toast('BUILD', WORK_BY_ID[id].name, 'Pick a spot outside, near the Hab, then hold to build it. The ring on the ground is where it will stand.');
}
/** Think better of it: nothing is being set down. (The Base tab's card for the thing chosen offers this.) */
export function cancelBuild() { buildKind = null; }
/**
 * Where the thing being set down will stand, drawn on the ground: a ring of its own size, pale green where it can
 * go and red where it cannot. Called every tick. (There was the prompt and nothing else: a kiln appeared three paces
 * ahead of wherever he happened to be looking.)
 */
let ghost = null;
const _gu = new THREE.Vector3(), _gy = new THREE.Vector3(0, 1, 0), OK_C = new THREE.Color(0.5, 1.0, 0.62), NO_C = new THREE.Color(1.0, 0.33, 0.26);
export function updateBuildGhost() {
  const def = buildKind && WORK_BY_ID[buildKind];
  if (!def || S.inside || S.mode !== 'walk' || S.uiOpen || S.sleeping) { if (ghost) ghost.visible = false; return; }
  if (!ghost) {
    ghost = new THREE.Group();
    const mat = (opacity) => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity, depthWrite: false, fog: false, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.94, 1.0, 72), mat(0.9)), fill = new THREE.Mesh(new THREE.CircleGeometry(0.94, 48), mat(0.14));
    for (const m of [ring, fill]) { m.rotation.x = -Math.PI / 2; m.renderOrder = 4; m.frustumCulled = false; ghost.add(m); }
    ghost.userData.mats = [ring.material, fill.material];
    ctx.engine.scene.add(ghost);
  }
  buildSpot(def, _gu);
  ghost.position.copy(_gu).multiplyScalar(surfaceAt(_gu) + 0.09);
  ghost.quaternion.setFromUnitVectors(_gy, _gu);
  ghost.scale.setScalar(def.r);
  const ok = buildBlock() === true;
  for (const m of ghost.userData.mats) m.color.copy(ok ? OK_C : NO_C);
  ghost.visible = true;
}
/** Where a works would stand: ahead of him, far enough that he is not built into it. Writes the place into `out`. */
function buildSpot(def, out) {
  out.copy(player.pos).normalize();
  _v2.set(0, 0, -1).applyQuaternion(player.q);
  return out.addScaledVector(_v2, (def.r + 2.2) / R).normalize();
}
/** Why a works cannot be built where he stands, or true. */
function buildBlock() {
  const def = WORK_BY_ID[buildKind];
  if (!def) return true;                                   // (nothing is chosen, so nothing is refused: its prompt is not up)
  // (each says what is wrong and what to do about it, as every refusal on the prompt does)
  if (!hasCost(def.cost)) return missingText(def.cost);
  buildSpot(def, _v3).multiplyScalar(R);
  const hab = groundDist(_v3, World.hab.position);
  if (hab > 150) return 'Too far out: build within 150 m of the Hab';
  if (hab < HAB_R + def.r + 5) return 'Too close: step back from the Hab';
  if (groundDist(_v3, World.rover.group.position) < def.r + 4) return 'Rover in the way: move a few paces off';
  for (const b of World.builtMeshes) {
    const r = b.def ? b.def.r : b.kind === 'greenhouse' ? 5 : 1.2;
    if (groundDist(_v3, b.group.position) < def.r + r + 1.5) return 'Too close: move off from what is built';
  }
  // (the array, the uplink, a heap, a pod: whatever else stands there)
  for (const c of colliders) if (c.r > 0.01 && groundDist(_v3, c.v) < def.r + c.r + 0.8) return 'Something in the way: move a few paces off';
  return true;
}
// (the task each of a base's things answers to on the list: see OBJECTIVES in ui/hud.js)
const BUILD_TASK = { kiln: 'b-kiln', smelter: 'b-smelter', glassworks: 'b-glass', solarField: 'b-solar', battery: 'b-battery', tank: 'b-tank', dome: 'b-dome', quarters: 'b-quarters', tower: 'b-tower', pad: 'b-pad' };
addI({
  pos: () => player.pos, r: 99, hold: 2.4, mode: 'walk', priority: 2, task: () => BUILD_TASK[buildKind] || '',
  visible: () => !!buildKind && !S.inside,
  enabled: buildBlock,
  label: () => `Build the ${WORK_BY_ID[buildKind].name.toLowerCase()} here`,
  sub: () => costStr(WORK_BY_ID[buildKind].cost),
  use: () => {
    const def = WORK_BY_ID[buildKind];
    if (buildBlock() !== true) return;
    payCost(def.cost);
    buildSpot(def, _v1);
    _v2.set(0, 0, -1).applyQuaternion(player.q);
    tangentBasis(_v1, _fe, _fn);
    // (its front, the mouth of its fire, turned toward him)
    buildDeployable(def.id, _v1, Math.atan2(_v2.dot(_fe), _v2.dot(_fn)));
    S.stats.built = (S.stats.built || 0) + 1;
    Snd.play('deploy');
    log(`${def.name} built. ${def.id === 'kiln' ? 'Stone on stone, the oldest trade there is. It needs a job: walk up to it.' : def.jobs ? 'It needs a job: walk up to it.' : `${def.gives}.`}`);
    syncAllVisuals();
    buildKind = null;
    checkAchievements();
  },
});
// ... and one that stands is given its jobs at its own sheet
addI({
  pos: () => {
    const b = nearestOf(works(), (w) => w.group.position, 5.2);
    return b ? (World._activeWork = b).group.position : null;
  },
  r: 5.2, hold: 0.5, mode: 'walk', pose: 'stand', priority: 1, task: () => (World._activeWork && World._activeWork.kind === 'kiln' ? 'b-brick' : ''),
  visible: () => isBase() && !S.flags.coldOpen && !buildKind,
  label: () => (World._activeWork ? `Use the ${World._activeWork.def.name.toLowerCase()}` : 'Use'),
  sub: () => (World._activeWork ? jobLine(World._activeWork) : ''),
  use: () => { if (World._activeWork) showWork(World._activeWork, syncAllVisuals); },
});
// the ascent vehicle at Arcadia Station: file the handover, then launch
addI({
  pos: () => World.mav.position,
  r: 8.0, hold: 1.6, mode: 'walk', pose: 'stand',
  visible: () => !isBase() && !S.won,
  enabled: () => (S.sol >= S.rescueSol ? true : `Tanks still filling: launch on Sol ${S.rescueSol}`),
  label: () => 'File the handover and launch',
  sub: () => 'The ascent vehicle, Arcadia Station',
  use: () => showHandover(() => startLaunch()),
});
