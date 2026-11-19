// Named places on Mars: landforms, regions and every lander, at their real coordinates.
// The shape of the land now comes from elevation data; these give names, notes and footprints.
import { llToVec, vecToLl, angDist } from './geo.js';
import { MARS_KM, D2R } from './constants.js';
import { elevationKm3 } from './surface.js';
import { VOLCANOES } from './volcanoes.js';

/*
 * Real Mars features. lat, lonE in degrees; r = footprint radius km; h = relief km (+up/-down).
 * type: volcano | crater | basin | bulge | cap | plain(label) | albedo
 * Coordinates from published planetary data (MOLA-era), good to ~1°.
 */
export const FEATURES = [
  // The Tharsis bulge — continent-sized volcanic rise
  { name: 'Tharsis Rise', lat: 2, lon: 247, r: 2600, h: 5.5, type: 'bulge' },
  ...VOLCANOES,
  // Impact basins
  { name: 'Hellas Planitia', lat: -42.4, lon: 70.5, r: 1050, h: -7.2, type: 'basin',
    note: 'The deepest basin on Mars. The air at the bottom is thick enough that liquid water could last a moment before it boiled.' },
  { name: 'Argyre Planitia', lat: -49.7, lon: 316, r: 450, h: -5.2, type: 'basin',
    note: 'An ancient impact scar ringed by mountains. Named for a mythical island of silver.' },
  { name: 'Isidis Planitia', lat: 12.9, lon: 87, r: 380, h: -3.7, type: 'basin',
    note: 'A great impact basin, flooded and smoothed. Beagle 2 lies here, half opened, as orbiter images found it in 2015.' },
  { name: 'Utopia Planitia', lat: 46.7, lon: 117.5, r: 830, h: -4.1, type: 'basin',
    note: 'One of the largest impact basins in the solar system, buried under the northern plains. Viking 2 and Zhurong landed in it.' },
  // Major craters
  { name: 'Gale Crater', lat: -5.4, lon: 137.8, r: 77, h: -3.8, type: 'crater', peak: 2.8,
    note: 'Home of Mount Sharp, a mountain of layered sediment that Curiosity has been climbing since 2014.' },
  { name: 'Jezero Crater', lat: 18.44, lon: 77.45, r: 24, h: -2.5, type: 'crater',
    note: 'An ancient river delta. Perseverance is here, caching rocks and minding a helicopter.' },
  { name: 'Gusev Crater', lat: -14.57, lon: 175.48, r: 83, h: -1.9, type: 'crater',
    note: 'Spirit\'s ground. It drove backwards for years, dragging a stuck wheel, and the furrow turned up silica from old hot springs.' },
  { name: 'Schiaparelli Crater', lat: -2.71, lon: 16.77, r: 230, h: -2.2, type: 'crater',
    note: 'Named for Giovanni Schiaparelli, whose "canali" (channels) were translated as canals and started a century of speculation.' },
  { name: 'Huygens Crater', lat: -13.88, lon: 55.58, r: 234, h: -2.5, type: 'crater',
    note: 'The largest well-preserved crater on Mars, sitting on some of the oldest crust anywhere.' },
  { name: 'Cassini Crater', lat: 23.82, lon: 32.12, r: 205, h: -1.8, type: 'crater',
    note: 'A vast, soft-shouldered ruin in Arabia Terra. Old enough to have forgotten its own impact.' },
  { name: 'Lyot Crater', lat: 50.47, lon: 29.32, r: 110, h: -3.0, type: 'crater',
    note: 'The deepest point in the northern hemisphere: an impact crater whose floor holds frost through the winter.' },
  { name: 'Korolev Crater', lat: 72.77, lon: 164.58, r: 41, h: -2.0, type: 'crater', ice: true,
    note: 'Permanently full of water ice, 1800 cubic kilometers of it — a frozen lake the size of a small sea.' },
  // Valles Marineris — the grand canyon system, as named segments
  { name: 'Noctis Labyrinthus', lat: -6.9, lon: 261, r: 120, h: -4.5, type: 'canyon', to: { lat: -8, lon: 267 },
    note: 'The Labyrinth of Night: a shattered maze of canyons where Valles Marineris begins.' },
  { name: 'Ius Chasma', lat: -7.5, lon: 269, r: 55, h: -6.5, type: 'canyon', to: { lat: -9, lon: 279 },
    note: 'Twin parallel troughs carved deeper than four Grand Canyons stacked.' },
  { name: 'Melas Chasma', lat: -10, lon: 283, r: 90, h: -7.0, type: 'canyon', to: { lat: -11, lon: 290 },
    note: 'The widest heart of Valles Marineris. The canyon floor has its own weather.' },
  { name: 'Coprates Chasma', lat: -12.5, lon: 293, r: 60, h: -6.8, type: 'canyon', to: { lat: -14, lon: 304 },
    note: 'Nearly 1000 km of unbroken chasm. The walls rise 8 km — you cannot see the top from the floor.' },
  { name: 'Eos Chasma', lat: -13, lon: 307, r: 70, h: -5.2, type: 'canyon', to: { lat: -10, lon: 315 },
    note: 'Where the great canyon exhales into chaos terrain and ancient flood channels.' },
  { name: 'Capri Chasma', lat: -8.5, lon: 313, r: 60, h: -4.2, type: 'canyon', to: { lat: -4, lon: 318 },
    note: 'The canyon\'s outlet ramp, spilling toward the lowlands that once may have held a sea.' },
  // Polar caps
  { name: 'Planum Boreum', lat: 90, lon: 0, r: 600, h: 2.2, type: 'cap',
    note: 'The northern ice cap: water ice, spiral troughs, and winter air that freezes out of the sky.' },
  { name: 'Planum Australe', lat: -90, lon: 0, r: 500, h: 3.0, type: 'cap',
    note: 'The southern cap, taller and colder. Radar hints at buried brine lakes beneath.' },
  // Albedo / label features
  { name: 'Syrtis Major', lat: 8.4, lon: 69.5, r: 600, h: 1.0, type: 'albedo',
    note: 'The dark patch telescopes have watched since 1659 — the oldest continuously observed feature on any other planet.' },
];

// Label-only regions for the map and the region ticker
export const REGIONS = [
  { name: 'Acidalia Planitia', lat: 49.8, lon: 339.3, r: 27 },
  { name: 'Chryse Planitia', lat: 28.4, lon: 319.7, r: 18 },
  { name: 'Amazonis Planitia', lat: 24.8, lon: 196, r: 20 },
  { name: 'Arcadia Planitia', lat: 47.2, lon: 184.3, r: 19 },
  { name: 'Elysium Planitia', lat: 3, lon: 154.7, r: 20 },
  { name: 'Arabia Terra', lat: 22.8, lon: 5, r: 26 },
  { name: 'Terra Sabaea', lat: -2, lon: 42, r: 22 },
  { name: 'Noachis Terra', lat: -45, lon: 350, r: 25 },
  { name: 'Terra Sirenum', lat: -39.7, lon: 205.8, r: 24 },
  { name: 'Terra Cimmeria', lat: -34.7, lon: 145, r: 24 },
  { name: 'Tempe Terra', lat: 39.3, lon: 289, r: 16 },
  { name: 'Meridiani Planum', lat: -0.2, lon: 356.8, r: 10 },
  { name: 'Vastitas Borealis', lat: 68, lon: 90, r: 35 },
  { name: 'Oxia Planum', lat: 18.3, lon: 335.4, r: 4 },
];

// Every soft landing (and famous almost-landing) on Mars, at real coordinates.
// `link`: the parts of a direct-to-Earth radio each really carried, which the Earth-link can be built from (game/story.js):
//   dish   a steerable high-gain antenna: Viking's parabolic S-band dish; the flat X-band arrays of Pathfinder, the two
//          MER rovers, Curiosity and Perseverance; Zhurong's small X-band reflector
//   amp    a direct-to-Earth power amplifier: Viking's S-band TWTAs, the X-band SSPAs of the others; InSight's X-band
//          transmitter fed two fixed medium-gain horns, so it gives an amplifier and nothing else
//   drive  the two-axis gimbal that pointed that antenna at Earth
// Mars 3, Mars 6, Beagle 2, Phoenix and Schiaparelli talked only through an orbiter's UHF relay: they give none.
export const LANDERS = [
  { name: 'Mars 3', lat: -45, lon: 202, year: 1971, scrap: 2, link: [],
    note: 'The first soft landing on Mars. It transmitted through its orbiter for seconds, sent part of one grey picture, and went silent.' },
  { name: 'Mars 6', lat: -23.9, lon: 340.6, year: 1974, scrap: 2, link: [],
    note: 'It sent data through its carrier bus all the way down and fell silent at the surface. Its readings described the air it came through.' },
  { name: 'Viking 1', lat: 22.48, lon: 312.05, year: 1976, scrap: 3, link: ['dish', 'amp', 'drive'],
    note: 'The first lander to work on Mars, for six years. It talked straight to Earth through a steerable S-band dish.' },
  { name: 'Viking 2', lat: 47.97, lon: 134.26, year: 1976, scrap: 3, link: ['dish', 'amp', 'drive'],
    note: 'Landed on a rock and spent its mission slightly tilted, photographing frost on Utopia Planitia. Viking 1\'s twin, dish and all.' },
  { name: 'Pathfinder', lat: 19.13, lon: 326.79, year: 1997, scrap: 2, link: ['dish', 'amp', 'drive'],
    note: 'The 1997 lander and its rover Sojourner, the first wheels on Mars. The lander\'s flat high-gain antenna sat on a two-axis gimbal.' },
  { name: 'Beagle 2', lat: 11.53, lon: 90.43, year: 2003, scrap: 2, link: [],
    note: 'Landed in 2003, but two of its solar panels never opened and covered its relay antenna. Found by an orbiter camera in 2015.' },
  { name: 'Spirit', lat: -14.57, lon: 175.47, year: 2004, scrap: 3, link: ['dish', 'amp', 'drive'],
    note: 'Planned for ninety sols; drove for six years, until soft sand held it. Its flat high-gain antenna pointed itself at Earth.' },
  { name: 'Opportunity', lat: -1.95, lon: 354.47, year: 2004, scrap: 3, link: ['dish', 'amp', 'drive'],
    note: 'Planned for ninety sols; drove more than a marathon over fourteen years, until the 2018 global dust storm.' },
  { name: 'Phoenix', lat: 68.22, lon: 234.25, year: 2008, scrap: 3, link: [],
    note: 'Dug to the polar ice, watched snow fall from the clouds, and found perchlorate in the soil in 2008. Winter buried it in frost.' },
  { name: 'Curiosity', lat: -4.59, lon: 137.44, year: 2012, scrap: 2, link: ['dish', 'amp', 'drive'],
    note: 'Lowered by a sky crane in 2012, nuclear-powered, still at work in Gale Crater. It baked soil and found it about 2% water.' },
  { name: 'Schiaparelli EDM', lat: -2.05, lon: 353.79, year: 2016, scrap: 3, link: [],
    note: 'ESA\'s 2016 landing demonstrator. A saturated sensor made its computer think it had landed, and it fell from about 3.7 km.' },
  { name: 'InSight', lat: 4.5, lon: 135.62, year: 2018, scrap: 3, link: ['amp'],
    note: 'Listened to the inside of Mars: over 1,300 marsquakes. Dust on its panels ended the mission in 2022.' },
  { name: 'Perseverance', lat: 18.44, lon: 77.45, year: 2021, scrap: 2, link: ['dish', 'amp', 'drive'],
    note: 'Carries sample tubes for a return mission, and brought the Ingenuity helicopter, which flew 72 times when it was planned for five.' },
  { name: 'Zhurong', lat: 25.07, lon: 109.93, year: 2021, scrap: 2, link: ['dish', 'drive'],
    note: 'China\'s first Mars rover, in southern Utopia Planitia. It went into hibernation for the 2022 winter and did not wake.' },
];

for (const f of FEATURES) { f.v = llToVec(f.lat, f.lon); f.angR = f.r / MARS_KM; }
for (const r of REGIONS) { r.v = llToVec(r.lat, r.lon); r.angR = r.r * D2R; }
for (const l of LANDERS) { l.v = llToVec(l.lat, l.lon); }

/** Name of the place at a unit direction: the smallest named footprint that contains it. */
export function regionName(v) {
  let best = null, bestR = 1e9;
  for (const list of [REGIONS, FEATURES]) {
    for (const f of list) {
      if (f.type === 'bulge' || f.type === 'albedo') continue;
      const ang = angDist(v.x, v.y, v.z, f.v.x, f.v.y, f.v.z);
      if (ang < f.angR && f.angR < bestR) { bestR = f.angR; best = f.name; }
    }
  }
  if (best) return best;
  const ll = vecToLl(v);
  if (ll.lat > 55) return 'Vastitas Borealis';
  if (ll.lat < -60) return 'Southern Highlands';
  return elevationKm3(v.x, v.y, v.z) < -1.5 ? 'Northern Lowlands' : 'Cratered Highlands';
}
