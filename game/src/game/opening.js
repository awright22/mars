// The opening: how Quinn came to be here. A new game begins with it, and it ends where the game has always begun:
// on the ground eighty-five metres from the Hab, with a leaking suit, beside the wrecked capsule.
//
// The entry of the advance mission Groundwork, in twenty-four seconds and three shots, with no one in them:
//   1  the evening sky from the ground: two fireballs, the Hab lander and Quinn's capsule, coming in over the land,
//      and a faint green aurora (the solar storm is arriving); Control's voice, then the voice breaking up
//   2  closer: the capsule out of the dusk on an unsteady engine; guidance lost; it hits, and rolls
//   3  low beside it as the dust settles, the Hab's beacon far off; Control calling, unanswered
// and then black, a card on it (a night has passed), and morning: the game comes up on Quinn lying beside the
// capsule (game/player.js, wakeOnGround).
//
// Like everything else drawn at dusk in this game, the film is made of what reads in it: lights and silhouettes. It
// borrows the launch's flame (game/launch.js) and the game's own lamp pool (world/lamps.js): no light is added to the
// scene, which on a phone would stop the picture for a second while every shader was built again. The capsule in it
// is the game's own wreck (world/build.js, CAPSULE_DEBRIS), hidden while a copy of it comes down, and there again at
// the end where it rolled to rest.
//
// It can be skipped from its first frame, and it is not shown when a game is continued.
import * as THREE from 'three';
import { S } from './state.js';
import { Snd } from '../audio/sound.js';
import { World, setSiteShown } from '../world/build.js';
import { addLamp, removeLampsOf } from '../world/lamps.js';
import { el, log, root } from '../ui/dom.js';
import { astro, camLookAt, player, resetWalkCamera, wakeOnGround } from './player.js';
import { surfaceAt } from '../planet/surface.js';
import { model, ownMaterials } from '../world/models.js';
import { ctx } from './ctx.js';
import { clamp, smoothstep } from '../core/math.js';
import { updateSunDir } from './sim.js';
import { buildFlame, flameTime, softDisc } from './launch.js';
import { reducedMotion } from '../ui/settings.js';

const HOUR = 18.75;           // local time of the film: the sun just down, the west still bright
const DUST = 0.32;            // a dusty evening (the storm that matters is the solar one, which cannot be seen)
// seconds from the first frame
const T_CLOSE = 7.6;          // cut: from the sky to the capsule coming in
const T_HIT = 10.2;           // it hits the ground
const ROLL = 2.4;             // seconds it rolls before it lies still
const T_LOW = 12.2;           // cut: low beside it, as the dust settles
const T_OUT = 21.3;           // the fade to black begins
const T_CARD = 22.2;          // on the black, a card: the night has passed
const T_END = 24.3;           // morning
const WAKE_FADE = 0.9;        // seconds the first picture of the game takes to come up out of the black
const WAKE_RISE = 3.2;        // ... and that Quinn takes to get from the ground to their feet (game/player.js, wakeOnGround)
const CARD = 'Sol 1, morning';
// What is said: Control, on a link that the storm is taking apart, and the capsule's own voice. A line of two
// sentences is set as two rows; the gaps are where the signal drops.
const LINES = [
  [0.7, 3.4, 'CONTROL', 'Groundwork, Control. Entry interface,\nboth vehicles. You look good.'],
  [4.4, 2.9, 'CONTROL', 'Groundwork, the storm front is early.\nExpect a loss of — — signal, —'],
  [8.1, 1.9, 'CAPSULE', 'Guidance fault.\nGuidance lost.'],
  [13.2, 3.0, 'CONTROL', 'Groundwork, Control. We have no\ntelemetry. Groundwork, respond.'],
  [17.0, 3.4, 'CONTROL', 'All stations: the relays are down.\nWe will keep calling.'],
];

const V = () => new THREE.Vector3();
const _a = V(), _b = V(), _c = V(), _d = V(), _e = V();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();

/** The point of the ground under (or over) `p`, `h` metres above it. */
function ground(p, h = 0, out = V()) {
  const r = surfaceAt(p) + h;
  return out.copy(p).normalize().multiplyScalar(r);
}
/** Which way a body faces: its head along `up`, its front along `front` (which need not be level). */
function facing(up, front, out) {
  _e.crossVectors(up, front).normalize();
  _d.crossVectors(_e, up).normalize();
  return out.setFromRotationMatrix(_m.makeBasis(_e, up, _d));
}

/** Is the ground clear of the straight line between two places? (looked at every two metres, with `margin` to spare) */
function clearLine(a, b, margin = 0.5) {
  const n = Math.max(2, Math.ceil(a.distanceTo(b) / 2));
  for (let i = 1; i < n; i++) { _e.copy(a).lerp(b, i / n); if (surfaceAt(_e) + margin > _e.length()) return false; }
  return true;
}
/** How a body lies at `p` with its head toward `front`: along the ground there, whatever its slope. */
function lying(p, front, out) {
  const up = _a.copy(p).normalize(), f = _b.copy(front).addScaledVector(up, -front.dot(up)).normalize(), r = _c.crossVectors(up, f).normalize();
  const o = ground(p, 0, V()), a = ground(_d.copy(p).addScaledVector(f, 1.6), 0, V()).sub(o), b = ground(_d.copy(p).addScaledVector(r, 0.7), 0, V()).sub(o);
  const n = V().crossVectors(a, b).normalize();
  if (n.dot(up) < 0) n.negate();
  return facing(n, a.normalize(), out);
}
/**
 * A glow with no edge and no core: for a fire seen through a hundred metres of dust. It falls away from its middle
 * all the way out, steeply and then for a long way gently. (Flat across its middle and falling only near its rim, it
 * was a disc of light with the rocket in front of it.)
 */
function hazeTexture() {
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d'), img = g.createImageData(N, N), rim = 0.72 * Math.exp(-9) + 0.28 * Math.exp(-2.6);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const d = Math.min(1, Math.hypot(i - (N - 1) / 2, j - (N - 1) / 2) / (N / 2)), v = Math.max(0, 0.72 * Math.exp(-d * d * 9) + 0.28 * Math.exp(-d * d * 2.6) - rim) / (1 - rim) * (1 - d * d * d);
    const k = (j * N + i) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = 255; img.data[k + 3] = Math.round(255 * v);
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace;
  return t;
}

/**
 * A green glow along the sky: the oxygen line an aurora on Mars gives off (seen from the surface by Perseverance in
 * March 2024). Soft, banded and faint.
 */
function auroraTexture() {
  const W = 256, H = 64, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), img = g.createImageData(W, H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const x = i / (W - 1), y = j / (H - 1);
    const across = Math.sin(Math.PI * x) ** 1.5, curtain = 0.6 + 0.4 * Math.sin(x * 37 + Math.sin(x * 9) * 2.2);
    const v = across * curtain * Math.exp(-(((y - 0.55) / 0.22) ** 2)) * (1 - 0.6 * y);
    const k = (j * W + i) * 4; img.data[k] = 70; img.data[k + 1] = 255; img.data[k + 2] = 140; img.data[k + 3] = Math.round(255 * clamp(v, 0, 1));
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let film = null;
let fadeIn = 0;
let ui = null;

/** True while the film is on the screen. */
export function openingOn() { return !!film; }

function buildUi() {
  if (ui) return ui;
  const box = el('div', 'mg-film', null, root, `<p class="sub" role="status"><b></b><span></span></p><p class="later">${CARD}</p><button type="button" class="skip">Skip</button>`);
  ui = { box, sub: box.querySelector('.sub'), who: box.querySelector('.sub b'), said: box.querySelector('.sub span'), card: box.querySelector('.later'), skip: box.querySelector('.skip'), line: -1 };
  ui.skip.addEventListener('click', () => skipOpening());
  window.addEventListener('keydown', (ev) => {
    if (!film) return;
    if (ev.key === 'Escape' || ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); skipOpening(); }
  }, true);
  return ui;
}
function say(i) {
  if (!ui || ui.line === i) return;
  ui.line = i;
  if (i < 0) { ui.sub.classList.remove('on'); return; }
  ui.who.textContent = LINES[i][2]; ui.said.textContent = LINES[i][3];
  ui.sub.classList.add('on');
  Snd.play('radioKey');
  // (and it is in the journal's log afterwards, as everything said over the radio is)
  log(`${LINES[i][2]}: ${LINES[i][3].replace(/\n/g, ' ')}`, 'radio', { quiet: true });
}

/**
 * Play the opening. `done` is called once, when it is over or skipped, with the world put back as the game begins
 * in it: that is where the first lines of the game are said.
 */
export function startOpening(done) {
  if (film) return;
  const e = ctx.engine, cam = e.camera;
  const keep = { tod: S.tod, storm: S.storm.i, hold: S.storm.hold, fov: cam.fov };
  const wake = ground(player.pos), up = wake.clone().normalize();
  // the capsule where it will lie, and the way it came in: along the line from beyond it toward the Hab
  const wreck = World.pods.find((p) => p.kind === 'debris') || null;
  const rest = wreck ? wreck.group.position.clone() : ground(_a.copy(wake).addScaledVector(_b.set(1, 0, 0), 5));
  const restQ = wreck ? wreck.group.quaternion.clone() : new THREE.Quaternion();
  const track = V().copy(World.hab.position).sub(rest); track.addScaledVector(up, -track.dot(up)).normalize();
  const side = V().crossVectors(up, track).normalize();
  const impact = ground(_a.copy(rest).addScaledVector(track, -13));
  const habAt = ground(World.hab.position);
  /** A point `back` metres behind `p` along the track (toward where they came from), `h` metres over the ground. */
  const behind = (p, back, h, off = 0, out = V()) => ground(out.copy(p).addScaledVector(track, -back).addScaledVector(side, off), h, out);

  // ---- the hour and the weather
  {
    const lon = ((Math.atan2(-up.z, up.x) * 180 / Math.PI) + 360) % 360;
    S.tod = (((HOUR / 24.66 - 0.5) - lon / 360) % 1 + 1) % 1;
    S.storm.hold = undefined; S.storm.i = DUST;
    updateSunDir();
    e.sky.update(e.sunDir, cam.position, DUST, e.time);
    e.snapLight = 3;
  }

  // ---- the two fireballs: a glowing head and a fading trail of sprites behind it
  const glowMap = softDisc(64), hazeMap = hazeTexture();
  const fireball = (color, size) => {
    const group = new THREE.Group(), parts = [];
    for (let i = 0; i < 9; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: i ? hazeMap : glowMap, color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      sp.renderOrder = 22; group.add(sp); parts.push(sp);
    }
    ctx.world.add(group);
    return { group, parts, size, path: [] };
  };
  const hot = new THREE.Color(2.6, 1.5, 0.7), cool = new THREE.Color(2.2, 1.0, 0.45);
  const landerBall = fireball(hot, 26), capsuleBall = fireball(cool, 18);
  /** Where each is at a moment: the Hab lander comes down behind the Hab; the capsule comes in along the track. */
  const landerAt = (t, out) => {
    const k = smoothstep(0.4, 7.0, t);
    return behind(habAt, 900 * (1 - k) - 40, 560 * (1 - k) * (1 - k) + 30 * (1 - k) + 4, -220 * (1 - k), out);
  };
  const capsuleAt = (t, out) => {
    if (t < T_HIT) {
      const k = clamp((t - 0.9) / (T_HIT - 0.9), 0, 1), q = 1 - k;
      return behind(impact, 1100 * q * (0.55 + 0.45 * q), 820 * q * q * q + 40 * q * q + 0.6, 160 * q * q, out);
    }
    return out.copy(rest);
  };
  const placeBall = (b, at, t, on) => {
    // (the trail: where the head was in the second before, each sprite a little older, larger and fainter)
    for (let i = 0; i < b.parts.length; i++) {
      const sp = b.parts[i];
      at(Math.max(0, t - i * 0.11), sp.position);
      const d = sp.position.distanceTo(cam.position);
      sp.scale.setScalar(b.size * (1 + i * 0.22) * clamp(d / 1100, 0.12, 0.9));
      sp.material.opacity = on * (i ? 0.42 * Math.pow(0.78, i) : 1);
    }
  };

  // ---- the capsule: a copy of the wreck that comes down, its heat glow, and an engine that will not hold
  const caps = model('debris_a');
  const capsule = new THREE.Group();
  capsule.add(caps.root);
  capsule.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  ctx.world.add(capsule);
  if (wreck) setSiteShown(wreck.group, false);
  const flame = buildFlame();
  capsule.add(flame);
  flame.position.set(0, -0.3, 0); flame.rotation.x = Math.PI; flame.visible = true; flame.scale.setScalar(0.001);
  const heat = new THREE.Sprite(new THREE.SpriteMaterial({ map: hazeMap, color: new THREE.Color(2.4, 1.1, 0.4), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  heat.renderOrder = 23; ctx.world.add(heat);
  // light: one lamp from the pool travels with the capsule's fire and lights the ground it comes down on
  const lightFire = new THREE.Object3D(); ctx.world.add(lightFire);
  const st = { fire: 0 };
  addLamp(lightFire, { color: 0xff9a4a, power: 260, range: 160, decay: 1.0, level: () => st.fire });

  // ---- the aurora, low in the sky opposite the sunset (a plane turned to the lens, far off and faint)
  const auroraTex = auroraTexture();
  const aurora = new THREE.Mesh(new THREE.PlaneGeometry(3600, 520), new THREE.MeshBasicMaterial({ map: auroraTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }));
  aurora.renderOrder = 1; aurora.frustumCulled = false;
  ctx.world.add(aurora);
  const auroraAt = V().copy(wake).addScaledVector(_a.copy(e.sunDir).addScaledVector(up, -e.sunDir.dot(up)).normalize().negate(), 2000).addScaledVector(up, 380);

  if (astro) astro.visible = false;
  S.mode = 'cutscene';
  World.launch = { burning: false, alt: 0, focus: wake.clone(), ground: true };
  World.opening = { hit: false, hero: null, t: 0 };
  buildUi();
  root.classList.add('is-opening');
  ui.line = -1;
  e.final.uniforms.uFade.value = 1;
  e.final.uniforms.uStreamers.value = 0;
  const still = reducedMotion();
  const shake = (k) => { if (!still && k > 0) cam.position.addScaledVector(_a.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5), k); };
  const setFov = (f) => { if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } };
  let t = 0, struck = false, calls = 0, waited = 0, lastPuff = 0;
  // (the ground is built a tile at a time, in the background, and a game that has just begun has not got the tiles the
  //  first shot stands on: the film stays on its black until they are there, two seconds at the most)
  const groundBusy = () => { const g = ctx.terrain; return !!g && ((g.queue && g.queue.length > 0) || (g.pending && g.pending.size > 0)); };
  const camA = behind(wake, -6, 1.6, 3.0), camB = behind(rest, 9, 2.0, 16), camC = behind(rest, 7.5, 1.25, -2.2);

  const step = (dt) => {
    if (t === 0 && dt > 0 && waited < 2 && (calls++ < 3 || groundBusy())) { waited += dt; dt = 0; }
    t += dt;
    World.opening.t = t;
    flameTime.value = t;
    // ---- what is said
    { let line = -1; for (let i = 0; i < LINES.length; i++) if (t >= LINES[i][0] && t < LINES[i][0] + LINES[i][1]) line = i; say(line); }

    // ---- the capsule: in the sky as a fireball, low on its engine, down, rolling, still
    capsuleAt(t, _d);
    const descending = t < T_HIT, low = smoothstep(T_CLOSE - 1.2, T_CLOSE + 0.6, t);
    if (descending) {
      capsule.position.copy(_d);
      _b.copy(_d).normalize();
      capsuleAt(t + 0.05, _e); _e.sub(_d);
      // (nose first along its path, and swinging as the guidance hunts)
      const sway = 0.45 * smoothstep(8.0, 9.0, t) * Math.sin(t * 9.0);
      capsule.quaternion.setFromUnitVectors(_c.set(0, 1, 0), _e.lengthSq() > 1e-6 ? _e.normalize().negate() : _b).multiply(_q.setFromAxisAngle(_a.set(0, 0, 1), sway));
    } else {
      // rolls along the track, slowing, and comes to rest exactly as the wreck lies
      const u = clamp((t - T_HIT) / ROLL, 0, 1), go = 1 - (1 - u) * (1 - u);
      ground(_a.copy(impact).lerp(rest, go), 0.9 * (1 - u) * Math.abs(Math.sin(u * Math.PI * 2.5)), capsule.position);
      _q.setFromAxisAngle(side, -go * Math.PI * 3.0);
      capsule.quaternion.copy(_q).multiply(restQ);
      capsule.quaternion.slerp(restQ, smoothstep(0.75, 1, u));
    }
    capsule.visible = low > 0.01 || !descending;
    const ballOn = 1 - smoothstep(T_CLOSE - 0.8, T_CLOSE + 0.4, t);
    placeBall(capsuleBall, capsuleAt, t, ballOn);
    placeBall(landerBall, landerAt, t, 1 - smoothstep(6.0, 7.2, t));
    // the engine: lit from the cut, sputtering as guidance goes, out at the ground
    // (it sputters, but slowly: under three changes a second, as every light that fills much of the picture does)
    const burn = descending ? low * (0.55 + 0.45 * Math.sin(t * 13) * Math.sin(t * 5)) * (t > 9.0 ? 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * 15)) : 1) : 0;
    flame.scale.setScalar(Math.max(0.001, burn * 0.7));
    { const P = flame.userData; if (P.flame) P.flame.material.uniforms.uGain.value = 1.6; if (P.core) P.core.material.uniforms.uGain.value = 2.4; if (P.wide) P.wide.material.uniforms.uGain.value = 1.0; if (P.glow) P.glow.material.opacity = 0.8 * burn; }
    heat.position.copy(capsule.position);
    heat.scale.setScalar(descending ? 7 + 5 * (1 - low) : 0.01);
    heat.material.opacity = descending ? 0.5 * low * (0.75 + 0.25 * Math.sin(t * 13)) : 0;
    lightFire.position.copy(capsule.position).addScaledVector(up, 6);
    st.fire = descending ? low * 0.9 : Math.max(0, 0.6 * (1 - smoothstep(0, 1.6, t - T_HIT)));
    World.launch.burning = burn > 0.05;
    World.launch.alt = descending ? Math.max(0, capsule.position.length() - surfaceAt(capsule.position)) : 0;
    Snd.rumble(descending ? 0.55 * low : 0.4 * (1 - smoothstep(0, 2.0, t - T_HIT)));
    if (!struck && t >= T_HIT) {
      struck = true;
      World.opening.hit = true;                      // (from here the suit leaks: the sound of it begins. See audio/driver.js)
      Snd.play('roverThud'); Snd.play('land', { hard: true, g: 1 });
      if (ctx.vfx) ctx.vfx.puff(impact, { count: 40, speed: 6, up: 3.5, spread: 3, size: 2.6, life: 3.4, tone: 0.3 });
    }
    // dust thrown up where it rolls, for as long as it rolls
    if (!descending && t - T_HIT < ROLL && t - lastPuff > 0.12 && ctx.vfx) { lastPuff = t; ctx.vfx.puff(capsule.position, { count: 5, speed: 2.4, up: 1.6, spread: 1.2, size: 1.6, life: 2.6, tone: 0.3 }); }

    // ---- the aurora
    aurora.position.copy(auroraAt);
    aurora.lookAt(cam.position);
    aurora.material.opacity = 0.32 * (t < T_CLOSE ? smoothstep(1.0, 4.0, t) : t > T_LOW ? smoothstep(T_LOW, T_LOW + 2.5, t) * (1 - smoothstep(T_OUT - 1, T_OUT, t)) : 0.5);

    // ---- the three shots
    if (t < T_CLOSE) {
      // 1. From the ground, looking up the track: the two of them coming in over the land
      setFov(56);
      cam.position.copy(camA);
      behind(wake, 380, 180 - 12 * t, 40, _c);
      camLookAt(_c, _b.copy(cam.position).normalize());
      World.opening.hero = null;
    } else if (t < T_LOW) {
      // 2. Closer, from off to one side: the capsule out of the dusk on its engine; it hits and rolls
      setFov(46);
      cam.position.copy(camB);
      _c.copy(capsule.position).lerp(rest, 0.25);
      camLookAt(_c, _b.copy(cam.position).normalize());
      if (t > T_HIT) shake(0.6 * (1 - smoothstep(0, 0.9, t - T_HIT)));
      World.opening.hero = null;
    } else {
      // 3. Low, behind the wreck as the dust settles: the Hab's beacon far off along the line it came in on
      setFov(44);
      cam.position.copy(camC);
      _c.copy(rest).lerp(ground(habAt, 3, _e), 0.35);
      ground(_c, 1.2 + 0.5 * smoothstep(T_LOW, T_OUT, t), _c);
      camLookAt(_c, _b.copy(cam.position).normalize());
      World.opening.hero = null;
    }
    World.launch.focus.copy(cam.position);
    ui.card.classList.toggle('on', t >= T_CARD && t < T_END - 0.5);
    // ---- up out of black, and out
    e.final.uniforms.uFade.value = Math.max(1 - smoothstep(0.15, 1.1, t), smoothstep(T_OUT, T_OUT + 1.0, t));
    if (t >= T_END) finish();
  };

  const finish = () => {
    if (!film) return;
    film = null;
    say(-1);
    ui.card.classList.remove('on');
    root.classList.remove('is-opening');
    removeLampsOf(lightFire); ctx.world.remove(lightFire);
    flame.removeFromParent();
    flame.traverse((o) => { if (o.material) o.material.dispose(); if (o.geometry) o.geometry.dispose(); });
    for (const b of [landerBall, capsuleBall]) { for (const sp of b.parts) sp.material.dispose(); ctx.world.remove(b.group); }
    for (const o of [capsule, heat, aurora]) ctx.world.remove(o);
    heat.material.dispose(); aurora.material.dispose(); aurora.geometry.dispose(); auroraTex.dispose(); glowMap.dispose(); hazeMap.dispose();
    if (wreck && !wreck.taken) setSiteShown(wreck.group, true);
    Snd.rumble(0);
    e.final.uniforms.uStreamers.value = 1;
    // the morning after, as the game has always begun
    S.tod = keep.tod; S.storm.i = keep.storm; S.storm.hold = keep.hold;
    updateSunDir();
    setFov(keep.fov);
    S.mode = 'walk';
    World.launchAnim = null; World.launch = null; World.opening = null;
    if (astro) astro.visible = true;
    resetWalkCamera();
    wakeOnGround(WAKE_RISE);
    e.sky.update(e.sunDir, cam.position, S.storm.i, e.time);
    e.snapLight = 3;
    e.final.uniforms.uFade.value = 1;
    fadeIn = WAKE_FADE;
    if (done) done();
  };

  film = { step, finish };
  World.launchAnim = step;
  step(0);
}

/** Leave the film now: to the morning. */
export function skipOpening() { if (film) film.finish(); }

/** The first picture of the game comes up out of the black the film ended in (called every step of play). */
export function updateOpeningFade(dt) {
  if (fadeIn <= 0) return;
  fadeIn = Math.max(0, fadeIn - dt);
  ctx.engine.final.uniforms.uFade.value = smoothstep(0, WAKE_FADE, fadeIn);
}

/** How long the film runs, in seconds (for the tests). */
export const OPENING_LENGTH = T_END;
