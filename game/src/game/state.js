// Game state and balance. S is the live run; BAL the tuning numbers.
// (rescueSol is the sol the ascent vehicle can launch: the propellant plant has filled its tanks, and the Tern's
//  window home closes just after. The interface calls it the launch sol.)
export const DIFFICULTIES = {
  story:    { name: 'FLYBY',   rescueSol: 15, drain: 0.75, desc: 'Launch: Sol 15. Forgiving drains,\nstorms always forecast. Time to look around.' },
  survival: { name: 'ORBITER', rescueSol: 25, drain: 1.0,  desc: 'Launch: Sol 25. The game as intended.\nPlan every drive; carry spare air.' },
  iron:     { name: 'LANDER',  rescueSol: 35, drain: 1.15, desc: 'Launch: Sol 35. One life: a death\nends the run and deletes the save.' },
};

/**
 * The two games. 'story': hold out until the launch sol, drive to Arcadia Station, launch and dock with the Tern.
 * 'base' has no way home: the same landing, the Tern lost in the storm, and a base to build for the next ship, 26
 * months out. (QUALITY.md, "Base mode", says what is in it.)
 */
export const KINDS = ['story', 'base'];
/** In Base mode there is no launch: its sol is a number no run reaches. */
export const NO_RESCUE = 1e9;

export const S = {
  kind: 'story',
  started: false, uiOpen: false, over: false, won: false, sleeping: false,
  firstPerson: false,
  cockpit: false,                 // in the rover: the picture from the driver's seat, not from behind (game/rover.js)
  mode: 'walk',                    // walk | rover | cutscene
  diff: 'survival', rescueSol: 25, drainMult: 1.0,
  sol: 1, tod: 0.02,
  o2: 100, water: 42, food: 10, potatoes: 0, power: 72, health: 100, suit: 46,
  roverPower: 100, roverO2: 300,
  inv: { scrap: 0, circuit: 0, regolith: 0, ice: 0, candle: 0,
         kitSolar: 0, kitGreenhouse: 0, kitBeacon: 0, kitCache: 0 },
  upgrades: {},                    // drive1, drive2, tank1, tank2, recycler, insulation, wiper, drill, roverBattery, rtg
  blueprints: { drill: false, drive2: false, tank2: false, recycler: false },
  inside: false,
  storm: { i: 0, cells: [] },
  breach: { active: false, done: false, cropsKilled: false, timer: 0 },
  link: { got: {}, fitted: {}, connected: false },   // the Earth-link: parts salvaged from landers (got), fitted at the Hab
  testLoop: false,                 // the contractor's test loop is playing (audio/testloop.js)
  discovered: {}, salvaged: {}, achieved: {},
  quests: {},                      // id -> 'offered' | 'active' | 'done'
  checkedSystems: {},
  flags: { coldOpen: true, suitSealed: false, didMath: false,
           linkRevealed: false, mavRevealed: false, nasaMsg: 0, routePods: false },
  stats: { potatoes: 0, panels: 0, walked: 0, driven: 0, closeCalls: 0, bakes: 0, mined: 0,
           crafted: 0, discoveries: 0, musicTime: 0, stormOut: 0 },
  holdT: 0, shake: 0, dead: null,
};

/** True in the game with no way home. */
export const isBase = () => S.kind === 'base';
/** The launch sol for a difficulty in a kind of game. */
export const rescueSolFor = (diffKey, kind) => (kind === 'base' ? NO_RESCUE : (DIFFICULTIES[diffKey] || DIFFICULTIES.survival).rescueSol);

/** Launch sols before sols were lengthened (saves made then are converted on load). */
export const OLD_RESCUE_SOL = { story: 20, survival: 45, iron: 60 };

export const BAL = {
  // A sol is eight minutes: long enough for a dawn to be watched and a day's work to be planned.
  // (It was 220 s, with rescue on Sol 45; the mission is about as long as before in real time.)
  solLen: 480,
  o2Drain: 22, o2Gen: 42, o2BreachDrain: 210,
  waterMax: 120, waterDrain: 6, waterRecl: 4.5, waterPerDose: 5,
  ovenWater: 6, ovenPower: 12, iceWater: 10,         // a load of regolith baked: litres out, and the Hab battery it takes (%)
  powerMax: 100, powerBase: 34, solarGen: 118,
  dustRate: 0.08, stormDustRate: 0.7, stormGenMult: 0.14,
  potatoYield: 4, growSols: 2.4, waterings: 2,
  healthMax: 100, starveDrain: 16, suffocateDrain: 10, healRegen: 4, sleepHeal: 10,
  walkSpeed: 5.1, runSpeed: 9.2, jumpV: 3.4, gravity: 3.72,       // Mars gravity; the gait clips are made for these speeds
  suitCap: 100,
  // suit oxygen per second: a full standard tank is about six minutes on foot, four at a run
  suitWalk: 0.28, suitRun: 0.44, suitRest: 0.155, suitIndoors: 0.14,
  roverO2Cap: 300, roverPowerCap: 100, roverDrainPerMin: 5, roverChargeAtHab: 25,
};
/** How well a machine works at its condition: full above 60%, falling to half at 20%, to nothing at 0. */
export function machineEff(id) {
  const c = S.machines ? S.machines[id] : 100;
  if (c === undefined || c >= 60) return 1;
  return c >= 20 ? 0.55 + 0.45 * (c - 20) / 40 : 0.55 * c / 20;
}
export function suitCap() { return S.upgrades.tank2 ? 200 : S.upgrades.tank1 ? 150 : BAL.suitCap; }
/**
 * How long an amount of suit oxygen lasts at a walk, as minutes and seconds. Suit oxygen has one unit wherever it is
 * not a share of the tank: time, as under the dial ("5:56 of air"). (A candle gave "+40 suit O2" and a tank went
 * "150 → 200", beside a dial that read 100%.)
 */
export function airTime(units) { const s = Math.floor(units / BAL.suitWalk); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} min`; }
/** The same in whole minutes, for a tank's size. */
export function airMinutes(units) { return Math.round(units / BAL.suitWalk / 60); }
export function roverTopSpeed() { return (S.upgrades.drive2 ? 55 : S.upgrades.drive1 ? 45 : 35) * (0.62 + 0.38 * machineEff('rover')); }
export function roverPowerCap() { return S.upgrades.roverBattery ? 160 : BAL.roverPowerCap; }
