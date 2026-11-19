// The launch: the last act of the story. Ignition and lift-off from Arcadia Station seen from the ground, the climb
// out of the dust into a black sky, the burnout; and then the docking. The Tern waits dark against the planet's
// edge, empty, as she has since the storm; the capsule closes on her docking port and makes contact; her lights
// come on along her length; her engine lights, and Mars falls away. Quinn launches alone: nobody else is in it.
//
// It is eight shots, cut like film, and three effects that exist only here:
//   the flame   three nested cones of light (a white core, the flame, a wide faint plume that spreads as the air thins)
//   the smoke   lit puffs: a skirt of dust rolling out along the ground, and the column the engine leaves up the sky
//   the glow    the engine's light on the pad and on the smoke round it
import * as THREE from 'three';
import { S } from './state.js';
import { Snd } from '../audio/sound.js';
import { tangentBasis } from '../planet/geo.js';
import { World, groundGlow, drape } from '../world/build.js';
import { log, setPrompt } from '../ui/dom.js';
import { camLookAt, astro } from './player.js';
import { R } from '../planet/constants.js';
import { closeScreens } from '../ui/screens.js';
import { surfaceAt } from '../planet/surface.js';
import { model } from '../world/models.js';
import { ctx } from './ctx.js';
import { clamp, lerp, smoothstep } from '../core/math.js';
import { winGame } from './story.js';
import { SUN_DECLINATION, updateSunDir } from './sim.js';

const LIFT = 5.2;            // seconds from "punch it" to lift-off
const IGNITE = 4.3;          // the engine lights just before
const CUT_WIDE = 1.7;        // seconds after lift-off: cut from the pad to the far camera
const CUT_CHASE = 4.0;       // ... to the camera that climbs beside the rocket
const CUT_PASS = 7.2;        // ... to a long lens far off to one side, level with it: the sky going black behind it
const CUT_LEAVE = 10.4;      // ... to the one ahead of it, looking back down at it over the curve of the planet
const MECO = 15.2;           // the engine burns out
const CUT_ORBIT = 16.4;      // ... the Tern
const DOCK_AT = 6.2;         // seconds into the last scene: contact
const LIGHTS_AT = 7.4;       // ... her lights come on, nose to tail
const BURN_AT = 11.6;        // ... her engine lights
const WIN = CUT_ORBIT + 19.0;  // the run is won, a while into the burn
const ORBIT_R = R * 1.45;    // where the Tern waits, from the planet's centre
const TERN_SPINE = 8.0;      // how far above the model's origin her spine runs (tools/assets/vehicles.py, TERN_Z)
const climb = (lt) => 14 * lt * lt;        // height of the ascent stage above the pad (m), lt seconds after lift-off
/**
 * A light's unsteadiness, 0..1, made of two slow waves (1.7 and 2.6 a second): what lights a large part of the picture
 * (the glow on the pad, the smoke the engine lights) varies smoothly and well under three times a second, never at
 * random from frame to frame, which on a close shot would be large-area flicker. (The photosensitivity bar: QUALITY.md.)
 */
export const flicker = (t, seed = 0) => 0.5 + 0.25 * Math.sin(t * 10.68 + seed) + 0.25 * Math.sin(t * 16.34 + seed * 2.3);

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion();
const _bq = new THREE.Quaternion(), _pq = new THREE.Quaternion(), _dq = new THREE.Quaternion(), _bv = new THREE.Vector3(), _bw = new THREE.Vector3(), _bt = new THREE.Vector3();
const DEG = Math.PI / 180;
let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ---- the smoke ---------------------------------------------------------------------------------------------------
const SMOKE_N = 2600;

export function softDisc(size = 64) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.14, 'rgba(255,255,255,0.5)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.11)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace;
  return t;
}

/** A lumpy cloud: a soft core and a ring of smaller lobes, so that puffs that overlap make billows and not discs. */
function smokeTexture() {
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d');
  let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const blob = (x, y, rad, a) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.55, `rgba(255,255,255,${a * 0.5})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, N, N);
  };
  blob(N / 2, N / 2, N * 0.42, 0.85);
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + r(), d = N * (0.13 + r() * 0.11);
    blob(N / 2 + Math.cos(a) * d, N / 2 + Math.sin(a) * d, N * (0.12 + r() * 0.10), 0.45 + r() * 0.3);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace;
  return t;
}

class Smoke {
  constructor(scene) {
    const n = SMOKE_N, g = new THREE.BufferGeometry();
    this.start = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
    this.vel = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
    this.info = new THREE.BufferAttribute(new Float32Array(n * 4), 4);       // born, life, size at birth, tone (0 dust .. 1 white smoke)
    this.grow = new THREE.BufferAttribute(new Float32Array(n * 4), 4);       // metres it swells by, drag, turn, how thick it is
    for (const a of [this.start, this.vel, this.info, this.grow]) a.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < n; i++) { this.info.setXYZW(i, -1000, 1, 0, 0); this.grow.setXYZW(i, 0, 1, 0, 1); }
    g.setAttribute('position', this.start); g.setAttribute('aVel', this.vel); g.setAttribute('aInfo', this.info); g.setAttribute('aGrow', this.grow);
    this.i = 0; this.time = 0;
    this.u = {
      uTime: { value: 0 }, uPx: { value: 600 }, uMaxPx: { value: 256 }, uMap: { value: smokeTexture() },
      uUp: { value: new THREE.Vector3(0, 1, 0) }, uWind: { value: new THREE.Vector3() }, uSunFlat: { value: new THREE.Vector3(1, 0, 0) }, uColumn: { value: 1 },
      uSunV: { value: new THREE.Vector3(0, 1, 0) }, uUpV: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color(1, 0.9, 0.8) }, uAmb: { value: new THREE.Color(0.2, 0.15, 0.1) },
      uGlowPos: { value: new THREE.Vector3() }, uGlowCol: { value: new THREE.Color(2.4, 1.05, 0.3) }, uGlow: { value: 0 },
      fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, fogNear: { value: 1 }, fogFar: { value: 2000 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u, transparent: true, depthWrite: false, fog: true,
      vertexShader: /* glsl */`
        #include <fog_pars_vertex>
        attribute vec3 aVel; attribute vec4 aInfo, aGrow;
        uniform float uTime, uPx, uMaxPx, uGlow, uColumn; uniform vec3 uUp, uWind, uGlowPos, uSunFlat;
        varying float vA, vTone, vTurn, vGlow, vShade;
        void main() {
          float age = uTime - aInfo.x;
          float k = clamp(age / aInfo.y, 0.0, 1.0);
          // thrown out fast, then hanging: there is almost no air to carry it and none to clear it
          float travel = (1.0 - exp(-age * aGrow.y)) / aGrow.y;
          float span = aInfo.z + aGrow.x * (1.0 - exp(-age * 0.5));
          vec3 p = position + aVel * travel;
          // Where it stands in the column, toward the sun or away from it: the far side of a column of smoke lies in
          // the shadow of the near side. (Each puff lit alike, the column was a string of white balls.)
          float high = max(dot(p, uUp), 0.0);
          vec3 off = p - uUp * dot(p, uUp);
          vShade = mix(1.0, clamp(0.5 + dot(off, uSunFlat) / (span * 0.8 + 4.0), 0.0, 1.0), smoothstep(3.0, 16.0, high) * uColumn);
          // what wind there is leans the column, more with height; and the winds aloft are not one wind: it kinks as it ages
          p += uWind * (age * (1.0 + high / 260.0));
          p += (uWind * sin(high * 0.011 + 1.3) + cross(uUp, uWind) * sin(high * 0.017 + 0.4)) * (age * 0.9);
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          float px = span * uPx / max(-mvPosition.z, 0.5);
          gl_PointSize = clamp(px, 1.0, uMaxPx);
          // (a puff that would be drawn larger than a point may be is thinned instead, and one the camera stands in is not a wall)
          float room = smoothstep(span * 0.2, span * 1.1, -mvPosition.z) * min(1.0, uMaxPx / px);
          // (seen at once: the rocket is a hundred metres on before a slow puff would have shown)
          vA = (age < 0.0 || k >= 1.0) ? 0.0 : pow(1.0 - k, 1.4) * smoothstep(0.0, 0.12, age) * room * 0.78 * aGrow.w;
          vTone = aInfo.w;
          vTurn = aGrow.z * 6.2832 + age * 0.25 * (fract(aGrow.z * 7.0) - 0.5);
          vec3 gd = p - uGlowPos;
          vGlow = uGlow / (1.0 + dot(gd, gd) / 200.0);
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        #include <fog_pars_fragment>
        uniform sampler2D uMap; uniform vec3 uSunV, uUpV, uSunCol, uAmb, uGlowCol;
        varying float vA, vTone, vTurn, vGlow, vShade;
        void main() {
          vec2 c = gl_PointCoord * 2.0 - 1.0;
          float r2 = dot(c, c);
          float cs = cos(vTurn), sn = sin(vTurn);
          vec2 q = vec2(c.x * cs - c.y * sn, c.x * sn + c.y * cs) * 0.5 + 0.5;
          float a = texture2D(uMap, q).a * vA * smoothstep(1.0, 0.2, r2);
          if (a < 0.004) discard;
          // Each puff is lit as a ball of smoke, bright toward the sun, and light gets some way through it; and the
          // whole column is lit as one thing, its far side in the shade of its near side. Small puffs and many: the
          // balls make the billows of a cloud's edge, and the column's own light and shade make its shape.
          vec3 n = normalize(vec3(c.x, -c.y, sqrt(max(1.0 - r2, 0.0)) + 0.35));
          // (but not as a hard ball: one puff alone in the air beside the rocket was a beige ball with a lit side)
          float lit = mix(0.42, smoothstep(-0.35, 0.85, dot(n, uSunV)), 0.62) * (0.22 + 0.78 * vShade);
          vec3 base = mix(vec3(0.44, 0.22, 0.115), vec3(0.95, 0.91, 0.86), vTone);
          // (the sky lights it from above and the red ground from below, and less)
          vec3 col = base * (uAmb * (0.72 + 0.28 * dot(n, uUpV)) + uSunCol * lit) + uGlowCol * (vGlow * (0.35 + 0.65 * lit));
          gl_FragColor = vec4(col, a);
          #include <fog_fragment>
        }`,
    });
    this.points = new THREE.Points(g, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 22;
    scene.add(this.points);
  }

  /** One puff. `at` and `vel` are in the world's frame; everything is stored about the pad so that it stays exact. */
  emit(at, vel, size, grow, life, tone, drag, thick = 1) {
    const k = this.i; this.i = (this.i + 1) % SMOKE_N;
    const o = this.points.position;
    this.start.setXYZ(k, at.x - o.x, at.y - o.y, at.z - o.z);
    this.vel.setXYZ(k, vel.x, vel.y, vel.z);
    this.info.setXYZW(k, this.time, life, size, tone);
    this.grow.setXYZW(k, grow, drag, rnd(), thick);
    this.dirty = true;
  }

  update(dt, camera, pixelHeight) {
    this.time += dt;
    this.u.uTime.value = this.time;
    this.u.uPx.value = pixelHeight / (2 * Math.tan((camera.fov * Math.PI) / 360));
    this.u.uMaxPx.value = Math.min(420, pixelHeight * 0.6);
    if (this.dirty) { this.dirty = false; this.start.needsUpdate = this.vel.needsUpdate = this.info.needsUpdate = this.grow.needsUpdate = true; }
  }
}

// ---- the column -------------------------------------------------------------------------------------------------
// What the engine leaves up the sky, as one thing: a tube about the rocket's path that swells with age, billows,
// leans and kinks in the wind, thins as the air does and is lit as a cloud is, its far side in its own shade.
// (It was puffs, each a lit ball, and from far off any number of them is a string of beads.) Its shape is worked out
// on the graphics card from how long ago the rocket passed each height.
const GLSL_NOISE = /* glsl */`
  float hash3(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  float vnoise(vec3 p) {
    vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x), mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x), mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }`;
function buildColumn(scene, smokeU) {
  const NS = 22, NH = 300, at = new Float32Array((NS + 1) * (NH + 1) * 2), idx = [];
  for (let j = 0; j <= NH; j++) for (let i = 0; i <= NS; i++) { at[(j * (NS + 1) + i) * 2] = i / NS; at[(j * (NS + 1) + i) * 2 + 1] = j / NH; }
  for (let j = 0; j < NH; j++) for (let i = 0; i < NS; i++) {
    const a = j * (NS + 1) + i, b = a + 1, c = a + NS + 1, d = c + 1;
    idx.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((NS + 1) * (NH + 1) * 3), 3));
  g.setAttribute('aAt', new THREE.BufferAttribute(at, 2));
  g.setIndex(idx);
  // (it shares the smoke's light, wind and fog: one set of numbers for both)
  const u = { uLt: { value: 0 }, uTop: { value: 0 }, uE: { value: new THREE.Vector3(1, 0, 0) }, uN: { value: new THREE.Vector3(0, 0, 1) },
    uUp: smokeU.uUp, uWind: smokeU.uWind, uSunV: smokeU.uSunV, uUpV: smokeU.uUpV, uSunCol: smokeU.uSunCol, uAmb: smokeU.uAmb,
    uGlowPos: smokeU.uGlowPos, uGlowCol: smokeU.uGlowCol, uGlow: smokeU.uGlow,
    fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, fogNear: { value: 1 }, fogFar: { value: 2000 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, fog: true, side: THREE.FrontSide,
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      attribute vec2 aAt;
      uniform float uLt, uTop; uniform vec3 uUp, uE, uN, uWind;
      varying vec3 vN, vV, vP; varying float vAlpha, vHgt, vAge;
      ${GLSL_NOISE}
      vec3 place(float th, float hgt, out float age) {
        age = max(uLt - sqrt(max(hgt, 0.0) / 14.0), 0.0);         // (the rocket's height is fourteen times the square of the seconds since lift-off)
        float a = th * 6.2832;
        vec2 d = vec2(cos(a), sin(a));
        // it swells fast and then slowly; wider where the air is thin; and at the ground it splashes
        float rad = (1.2 + 5.0 * (1.0 - exp(-age * 0.9)) + 2.2 * pow(age, 0.75)) * (1.0 + 1.3 * smoothstep(200.0, 900.0, hgt));
        // (no skirt at its foot: the pad's dust is the skirt. Flared at the ground it was a draped bell between the
        // flame and the ground, with folds in it.)
        vec3 q = vec3(d * 1.9, hgt / 9.0 - age * 0.10);
        float n = (vnoise(q) - 0.5) * 1.2 + (vnoise(q * 2.3 + 7.1) - 0.5) * 0.8;
        float r = rad * (1.0 + 0.55 * n) * smoothstep(0.0, 0.4, age + 0.04);
        vec3 p = uE * (d.x * r) + uN * (d.y * r) + uUp * hgt;
        p += uWind * (age * (1.0 + hgt / 260.0));
        p += (uWind * sin(hgt * 0.011 + 1.3) + cross(uUp, uWind) * sin(hgt * 0.017 + 0.4)) * (age * 0.9);
        return p;
      }
      void main() {
        float hgt = aAt.y * uTop, age, other;
        vec3 p = place(aAt.x, hgt, age);
        vec3 nrm = normalize(cross(place(aAt.x + 0.02, hgt, other) - p, place(aAt.x, hgt + 1.2, other) - p));
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        vN = normalMatrix * nrm; vV = -mvPosition.xyz; vP = p; vHgt = hgt; vAge = age;
        gl_Position = projectionMatrix * mvPosition;
        // it is the air that makes smoke of an engine's breath: above nine hundred metres there is none; and it disperses
        // (and it does not reach the ground as a solid: its foot is the dust the skirt throws out. A wide foot to the
        // tube, seen from the pad, was a tent of cloth with fold lines.)
        // (and it does not hang for half a minute as a thing with an edge: in this thin air it is gone in a dozen seconds)
        vAlpha = (1.0 - smoothstep(260.0, 950.0, hgt)) * (1.0 - smoothstep(5.0, 14.0, age)) * smoothstep(0.0, 0.25, age) * smoothstep(4.0, 22.0, hgt);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      uniform vec3 uSunV, uUpV, uSunCol, uAmb, uGlowCol, uGlowPos; uniform float uGlow;
      varying vec3 vN, vV, vP; varying float vAlpha, vHgt, vAge;
      ${GLSL_NOISE}
      void main() {
        vec3 n = normalize(vN);
        float facing = abs(dot(n, normalize(vV)));
        // the billows on the billows
        float fine = vnoise(vP * 0.5 + vec3(0.0, vAge * 0.15, 0.0)) * 0.6 + vnoise(vP * 1.25 + 3.7) * 0.4;
        // (soft where it turns away from the eye: a cloud has no outline)
        // (torn, with thin places in it: evenly thick it was a ribbon of cloth, and from far off a white stalagmite)
        float a = vAlpha * smoothstep(0.03, 0.42 + 0.30 * fine, facing) * (0.22 + 0.95 * smoothstep(0.25, 0.75, fine));
        if (a < 0.004) discard;
        // (lit softly, as smoke is, light going some way through it: lit as a solid its billows were lumps of wax)
        float lit = mix(0.55, smoothstep(-0.5, 0.85, dot(n, uSunV)), 0.5) * (0.74 + 0.52 * fine);
        // (pale, and of the dust it rose through, not white: nothing in this engine's breath makes a white cloud)
        vec3 base = mix(vec3(0.52, 0.31, 0.17), vec3(0.88, 0.78, 0.66), smoothstep(3.0, 40.0, vHgt));
        vec3 col = base * (uAmb * (0.72 + 0.28 * dot(n, uUpV)) + uSunCol * lit);
        vec3 gd = vP - uGlowPos;
        col += uGlowCol * (uGlow * 0.5 / (1.0 + dot(gd, gd) / 260.0));
        gl_FragColor = vec4(col, a * 0.62);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat);
  m.frustumCulled = false; m.renderOrder = 21; m.visible = false;
  scene.add(m);
  return m;
}

// ---- the flame ---------------------------------------------------------------------------------------------------
export const flameTime = { value: 0 };
function plume(rTop, rBottom, length, color, hot, gain, edge, bulge = 0, soft = 0, fall = 1.4, beads = 0) {
  const g = new THREE.CylinderGeometry(rTop, rBottom, length, 20, 10, true);
  g.translate(0, -length / 2, 0);                      // the nozzle at the origin, the tail below
  const u = { uTime: flameTime, uColor: { value: new THREE.Color(...color) }, uHot: { value: new THREE.Color(...hot) }, uGain: { value: gain }, uEdge: { value: edge },
    uBulge: { value: bulge }, uSoft: { value: soft }, uFall: { value: fall }, uBeads: { value: beads } };
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vN, vV;
      uniform float uTime, uBulge;
      void main() {
        vUv = uv;
        // (its edge is never still, and it swells below the nozzle before it tapers, as a flame in thin air does:
        // straight-sided, it was a white bar under the engine)
        vec3 p = position;
        p.xz *= 1.0 + (1.0 - uv.y) * (0.16 * sin(p.y * 1.9 + uTime * 37.0) + 0.10 * sin(p.y * 4.3 - uTime * 53.0)) + uBulge * sin(3.14159 * pow(1.0 - uv.y, 0.7));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vN = normalMatrix * normal; vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uGain, uEdge, uSoft, uFall, uBeads; uniform vec3 uColor, uHot;
      varying vec2 vUv; varying vec3 vN, vV;
      // (no sine in it: a hash through sin() comes out in bands on some phone GPUs)
        float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      // (noise that closes on itself round the plume: no seam down one side)
      float vn(vec2 p, float wrap) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        float x0 = mod(i.x, wrap), x1 = mod(i.x + 1.0, wrap);
        return mix(mix(hash(vec2(x0, i.y)), hash(vec2(x1, i.y)), f.x), mix(hash(vec2(x0, i.y + 1.0)), hash(vec2(x1, i.y + 1.0)), f.x), f.y);
      }
      void main() {
        // a shell drawn as if it were a volume: brightest where the eye looks through most of it
        float f = abs(dot(normalize(vN), normalize(vV)));
        float along = vUv.y;                             // 1 at the nozzle, 0 at the tail
        float n = vn(vec2(vUv.x * 12.0, along * 4.0 + uTime * 19.0), 12.0) * 0.6 + vn(vec2(vUv.x * 28.0, along * 9.0 + uTime * 33.0), 28.0) * 0.4;
        // (how fast it dims down its length: a flame as bright at its tail as at the nozzle, three of them laid over
        // one another, was a white bar from the engine to the ground)
        float body = pow(f, uEdge) * pow(along, uFall) * smoothstep(0.0, 0.45, along) * (0.62 + 0.76 * n);
        // the jet is faster than sound in it: it stands in beads of light below the nozzle, closer as they fade
        body *= 1.0 + uBeads * (0.5 + 0.5 * cos(pow(1.0 - along, 0.8) * 44.0)) * smoothstep(0.25, 0.9, along);
        // (a wide plume has no rim where it leaves the engine: seen from ahead, its open end was a hard pale disc round the nozzle)
        body *= 1.0 - uSoft * smoothstep(0.80, 0.98, along);
        gl_FragColor = vec4(mix(uColor, uHot, pow(f, 3.0) * along) * (body * uGain), 1.0);
      }`,
  }));
  m.frustumCulled = false;
  m.renderOrder = 23;
  return m;
}

export function buildFlame() {
  const g = new THREE.Group();
  const wide = plume(0.95, 3.6, 17, [1.0, 0.36, 0.10], [1.0, 0.55, 0.22], 1.5, 2.6, 0, 1);
  const flame = plume(0.62, 0.10, 11, [1.0, 0.34, 0.07], [1.0, 0.70, 0.36], 2.0, 1.6, 0.85, 0, 2.1);
  const core = plume(0.36, 0.05, 4.6, [1.0, 0.72, 0.38], [1.0, 0.93, 0.80], 3.4, 2.2, 0.45, 0, 1.8, 0.9);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDisc(), color: new THREE.Color(2.8, 1.35, 0.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  glow.position.y = -0.8; glow.renderOrder = 23;
  g.add(wide, flame, core, glow);
  g.userData = { wide, flame, core, glow };
  g.visible = false;
  return g;
}

// ---- the sequence ------------------------------------------------------------------------------------------------
let fx = null;
function effects() {
  if (fx) return fx;
  const flame = buildFlame();
  (World.mavFlameAt || World.mavRocket).add(flame);
  fx = { smoke: new Smoke(ctx.engine.scene), flame, level: 0, glow: 0 };
  fx.column = buildColumn(ctx.engine.scene, fx.smoke.u);
  drape(groundGlow(World.mav, 34, new THREE.Color(1.0, 0.50, 0.18), 1.0, 'pool', () => fx.glow, 0.07), 0.07);
  return fx;
}

export let tern = null;

/** The sun's place in its daily round (S.tod) that puts it `sinEl` high over the place `up`, later the same sol. */
function todForSunHeight(up, sinEl) {
  const c = Math.cos(SUN_DECLINATION), A = Math.hypot(up.x, up.z), phi = Math.atan2(up.z, up.x);
  const need = clamp((sinEl - up.y * Math.sin(SUN_DECLINATION)) / Math.max(c * A, 1e-6), -1, 1);
  return ((phi - Math.acos(need)) / (Math.PI * 2) % 1 + 1) % 1;
}

export function startLaunch() {
  S.mode = 'cutscene';
  S.uiOpen = false;
  setPrompt(null);
  closeScreens();
  if (astro) astro.visible = false;        // Quinn is in the capsule (left standing, the figure watched its own launch)
  const e = ctx.engine, cam = e.camera;
  const up = World.mav.position.clone().normalize(), east = new THREE.Vector3(), north = new THREE.Vector3();
  tangentBasis(up, east, north);
  const pad = World.mav.position.clone();
  // The cameras stand on the sun's side of the rocket, so that it and its smoke are lit and not a silhouette.
  // (With no sun to speak of, or one straight overhead, any side will do.)
  const sunFlat = e.sunDir.clone().addScaledVector(up, -e.sunDir.dot(up));
  if (sunFlat.lengthSq() < 0.02) sunFlat.copy(east);
  sunFlat.normalize();
  const side = new THREE.Vector3().crossVectors(up, sunFlat);
  const around = (deg) => new THREE.Vector3().copy(sunFlat).multiplyScalar(Math.cos(deg * DEG)).addScaledVector(side, Math.sin(deg * DEG));
  const onGround = (dir, dist, h) => { const p = pad.clone().addScaledVector(dir, dist); return p.normalize().multiplyScalar(surfaceAt(p) + h); };
  // (a camera on the ground needs a clear line to the pad: where a dune stands in the way it is raised until it sees over)
  const clear = (c) => {
    for (let n = 0; n < 10; n++) {
      let hidden = false;
      for (let i = 1; i < 14 && !hidden; i++) { _a.copy(pad).addScaledVector(up, 1.5).lerp(c, i / 14); hidden = surfaceAt(_a) + 0.6 > _a.length(); }
      if (!hidden) break;
      c.addScaledVector(up, 2.5);
    }
    return c;
  };
  // (the far camera stands well back, so that the land and its horizon stay under the column for the whole of the shot:
  // at a hundred and fifty metres it had tilted up into bare sky within a second)
  const FAR = 250;
  const nearDir = around(38), farDir = around(-52);
  // (at eye height. Tried from eight metres up, to put the stones at the foot of its picture further off: the horizon
  // left the frame with them, and the shot was a rocket in a blank sky. The land under the column is what gives it its size.)
  const camNear = clear(onGround(nearDir, 46, 2.0)), camFar = clear(onGround(farDir, FAR, 3.2));

  log('Handover filed. Strapped in. To the first crew: the seat is better than it looks.');
  if (S.link.connected) setTimeout(() => log('Control: Groundwork, you are go for launch. The Tern is ready for you.', 'control'), 1400);
  [3, 2, 1].forEach((n, i) => setTimeout(() => { Snd.play('countdown'); log(`${n}...`, 'control'); }, 2000 + i * 1000));

  if (!tern) {
    const m = model('tern');
    tern = m.root;
    // her lamps, nose to tail, each with a material of its own so that they can come on one after another; dark until docking
    World.ternLamps = [];
    for (let k = 0; k < 9; k++) {
      const lp = m.part('lamp_' + k);
      if (!lp) continue;
      lp.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); World.ternLamps.push({ k, mat: o.material, full: o.material.emissiveIntensity || 4 }); } });
    }
    World.ternNav = [];
    const lights = m.part('lights');
    if (lights) lights.traverse((o) => { if (o.isMesh && !World.ternLamps.some((l) => l.mat === o.material)) { o.material = o.material.clone(); World.ternNav.push({ mat: o.material, full: o.material.emissiveIntensity || 4 }); } });
    World.ternNozzle = m.part('nozzle');
    World.ternFlame = buildFlame();
    // (a plume's tail runs down its group's -Y: turned, it runs aft, along her -Z)
    World.ternFlame.rotation.x = Math.PI / 2;
    (World.ternNozzle || tern).add(World.ternFlame);
    ctx.world.add(tern);
  }
  tern.visible = false;
  for (const l of World.ternLamps) l.mat.emissiveIntensity = 0;
  for (const l of World.ternNav) l.mat.emissiveIntensity = 0;
  const F = effects(), smoke = F.smoke, parts = F.flame.userData;
  smoke.points.position.copy(pad);
  F.column.position.copy(pad); F.column.visible = true;
  F.column.material.uniforms.uE.value.copy(east); F.column.material.uniforms.uN.value.copy(north);
  F.column.material.uniforms.uLt.value = 0; F.column.material.uniforms.uTop.value = 0;
  smoke.u.uUp.value.copy(up);
  smoke.u.uSunFlat.value.copy(sunFlat);
  smoke.u.uColumn.value = 1;
  smoke.u.uWind.value.copy(around(115)).multiplyScalar(1.1);
  // (drawn from the first frame, with nothing in them, so that their shaders are built during the countdown and not at ignition)
  F.flame.visible = true; F.flame.scale.setScalar(0.001);
  World.launch = { burning: false, alt: 0, focus: World.mav.position };

  const rocket = World.mavRocket, restY = World.mavRocketY;
  const nozzle = new THREE.Vector3(), focusAt = new THREE.Vector3();
  e.thinAir = 1;
  let t = 0, shot = '', skirtDue = 0, orbit = null;
  const setShot = (name, fov) => { shot = name; if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); } };
  // (the canvas is already at the render scale. The 0.8 is the size the smoke was drawn and judged at: the same on every preset.)
  const pixelHeight = () => e.renderer.domElement.height * 0.8;
  // A camera that stands off a place and above it, and looks down across it at the planet: `az` is the level direction
  // from the place to where the camera stands, `pitch` how high above it, `roll` turns the horizon.
  const stand = (target, az, pitch, dist, roll) => {
    cam.position.copy(target).addScaledVector(az, Math.cos(pitch) * dist).addScaledVector(up, Math.sin(pitch) * dist);
    _b.copy(up).applyAxisAngle(_c.copy(cam.position).sub(target).normalize(), roll);
    camLookAt(target, _b);
  };

  World.launchAnim = (dt) => {
    t += dt;
    const lt = t - LIFT, alt = lt > 0 ? climb(lt) : 0;
    // the engine: lit just before lift-off, burnt out a second before the cut to the Tern
    const burn = smoothstep(IGNITE, IGNITE + 0.45, t) * (1 - smoothstep(MECO, MECO + 0.4, lt));
    World.launch.burning = burn > 0.02;
    // (what the sound hears as height: the roar has thinned to nothing by the time the Tern is on screen)
    World.launch.alt = alt * 3.6;
    flameTime.value = t;

    // ---- the rocket and its flame
    if (!orbit) {
      rocket.position.y = restY + alt;
      const thin = smoothstep(150, 2600, alt);                       // the air gives out: the plume spreads and pales
      const flick = 0.9 + Math.random() * 0.2;
      F.flame.scale.setScalar(Math.max(0.001, burn));
      // (and high up it is short: a long flame that pointed straight down at the planet, seen from ahead of the rocket,
      //  was a flame that reached the ground)
      const high = smoothstep(900, 2600, alt);
      parts.flame.scale.set(1 + thin * 0.5, flick * (1 + thin * 0.6) * (1 - 0.52 * high), 1 + thin * 0.5);
      parts.core.scale.set(1, 0.9 + Math.random() * 0.25, 1);
      parts.wide.scale.set(1 + thin * 3.2, (0.95 + Math.random() * 0.1) * (1 + thin * 1.4), 1 + thin * 3.2);
      // (in a vacuum there is nothing for it to light: over lit ground it was a tan puff that sat on the surface under the flame)
      // (and from the camera ahead of it, which looks down its length, nothing at all: there the last of it was a pale
      //  ring lying on the ground round the tip of the flame)
      parts.wide.material.uniforms.uGain.value = 1.5 * (1 - 0.93 * thin) * (1 - smoothstep(CUT_LEAVE - 0.6, CUT_LEAVE, lt));
      parts.glow.scale.setScalar((3.6 + thin * 2.4) * (0.92 + 0.16 * flicker(t, 0.4)));
      F.flame.getWorldPosition(nozzle);
      F.glow = burn * (1 - smoothstep(6, 90, alt)) * (0.85 + 0.15 * flicker(t, 1.9));
      smoke.u.uGlowPos.value.copy(nozzle).addScaledVector(up, -3).sub(pad);
      smoke.u.uGlow.value = burn * (0.8 + 0.2 * flicker(t, 3.1));

      // the skirt: the pad's dust driven out along the ground in every direction
      const blast = burn * (1 - smoothstep(35, 150, alt));
      skirtDue += dt * 150 * blast;
      while (skirtDue >= 1) {
        skirtDue -= 1;
        const a = rnd() * Math.PI * 2, far = 1.5 + rnd() * 2.5;
        _a.copy(east).multiplyScalar(Math.cos(a)).addScaledVector(north, Math.sin(a));
        _b.copy(pad).addScaledVector(_a, far).addScaledVector(up, 0.5 + rnd() * 0.6);
        _c.copy(_a).multiplyScalar(12 + rnd() * 15).addScaledVector(up, 0.5 + rnd() * 2.8);      // (along the ground: thrown high, single puffs hung in the air beside the rocket)
        smoke.emit(_b, _c, 1.5 + rnd() * 1.3, 6 + rnd() * 8, 6 + rnd() * 4.5, rnd() * 0.16, 0.55 + rnd() * 0.2);
      }
      // the column the engine leaves up the sky
      F.column.material.uniforms.uLt.value = Math.max(lt, 0);
      F.column.material.uniforms.uTop.value = Math.min(alt, 950);
    }

    // (the air thins under the cameras that climb: at the dust's full depth the ground a few hundred metres down was a
    //  tan smear, and what the climb is a picture of is the land falling away)
    e.thinAir = orbit ? 1 : Math.exp(-Math.max(0, cam.position.length() - pad.length() - 60) / 420);

    // (The ground is drawn for the height the rocket is at, once it has left: drawn for the pad, the land for half a
    //  kilometre round it kept its close-range grain and colour, and from the cameras that look down from a height
    //  that was a grey patch under the rocket, which read as a ring of dust where the flame met the ground.)
    if (!orbit && lt > CUT_CHASE) World.launch.focus = focusAt.copy(pad).addScaledVector(up, alt);

    // ---- the camera
    const rocketAt = _d.copy(pad).addScaledVector(up, alt + 9);
    S.shake = 0;
    if (lt < CUT_WIDE) {
      // 1. Close and low, the whole rocket on its pad. It lights, the dust rolls out toward the lens, it rises.
      setShot('pad', 46);
      S.shake = burn * 0.5;
      cam.position.copy(camNear).addScaledVector(nearDir, -t * 0.35);
      camLookAt(_a.copy(pad).addScaledVector(up, 7.5 + alt * 0.2), up);
    } else if (lt < CUT_CHASE) {
      // 2. From far off: the land and its horizon, the skirt of dust spreading over it, the column standing on it,
      //    the rocket at its head. The horizon is held in the lower part of the frame until the cut.
      //    (A long lens that follows it. With a wide one held on the horizon the rocket was 25 px of a phone's 390
      //    two seconds after lift-off, and then out of the top of the frame: a column of smoke with nothing on it.
      //    Now it is a third of the frame's height with its flame, in the upper part, the column under it; the
      //    horizon is at the foot of the frame at the cut and drops out as it climbs.)
      setShot('wide', 19);
      S.shake = 0.05;
      cam.position.copy(camFar);
      camLookAt(_a.copy(pad).addScaledVector(up, Math.max(40, alt + 9 - 12 - alt * 0.05)), up);
    } else if (lt < CUT_PASS) {
      // 3. Beside it and above, climbing with it: its trail running down to the pad, the ground dropping away, the
      //    horizon bending.
      setShot('chase', 50);
      // (above it from the first frame, looking down its trail to the pad and the dust still spreading there: level
      // with it, the shot began as a rocket in a beige void over a blank horizon)
      const rel = (lt - CUT_CHASE) / (CUT_PASS - CUT_CHASE), over = 1;
      const dist = 38 + Math.min(alt, 2400) * 0.014;
      S.shake = clamp(0.5 - (lt - CUT_CHASE) * 0.07, 0, 0.5);
      cam.position.copy(pad).addScaledVector(nearDir, dist).addScaledVector(side, -dist * (0.35 + 0.25 * rel))
        .addScaledVector(up, alt + lerp(5, 31 + Math.min(alt, 2400) * 0.008, over));
      camLookAt(rocketAt.addScaledVector(up, -6 * over), up);
    } else if (lt < CUT_LEAVE) {
      // 4. From far off to one side, a long lens level with it: the rocket and its flame against the sky as the sky
      //    goes from dust to black, the planet's edge sinking under it. (The climb was one angle for eight and a half
      //    seconds, looking down the whole time at ground that is neither near enough nor far enough to be anything.)
      setShot('pass', 30);
      const k = (lt - CUT_PASS) / (CUT_LEAVE - CUT_PASS), dist = 112 - 22 * k;
      cam.position.copy(pad).addScaledVector(farDir, dist).addScaledVector(side, -dist * 0.2).addScaledVector(up, alt + 9 + 12);
      _b.copy(up).applyAxisAngle(farDir, -0.1);
      camLookAt(rocketAt.addScaledVector(up, -8 - 14 * k), _b);
    } else if (lt < CUT_ORBIT) {
      // 5. From ahead of it and above, looking back down: the rocket climbing toward the lens out of the curve of
      //    the planet, the plume spread wide in the vacuum behind it; the engine burns out, and it coasts.
      //    (Nothing of the pad is in it: from here the column it left was a thread ending in a puff on the ground.)
      //    (A long lens, from twice as far: through a wide one the planet behind it was a ball a few rocket-lengths
      //    across. Through this one its edge is a shallow arc across the top of the picture and its surface fills the rest.)
      setShot('above', 27);
      F.column.visible = false; smoke.points.visible = false;
      const k = (lt - CUT_LEAVE) / (CUT_ORBIT - CUT_LEAVE);
      const lead = 76 - 40 * k, off = 70 - 32 * k;
      cam.position.copy(pad).addScaledVector(up, alt + 9 + lead).addScaledVector(nearDir, off * 0.94).addScaledVector(side, off * 0.34);
      _b.copy(up).applyAxisAngle(nearDir, 0.16);
      camLookAt(rocketAt.addScaledVector(up, -3), _b);
    } else {
      // 6. The Tern, dark against the planet's edge, and the capsule closing on her docking port; contact.
      // 7. Along her length as her lights come on, nose to tail.
      // 8. Her engine lights, and she goes, the capsule at her nose; Mars falls away behind.
      if (!orbit) { orbit = enterOrbit(up, F); smoke.points.visible = false; }
      const ot = lt - CUT_ORBIT, O = orbit;
      tern.visible = true;
      F.flame.scale.setScalar(0.001);
      F.column.visible = false;
      // the burn: from BURN_AT she accelerates along her nose, and the capsule goes with her
      const bt = Math.max(0, ot - BURN_AT), run = 0.5 * 260 * bt * bt;
      O.shipAt.copy(O.centre).addScaledVector(O.f, run);
      tern.position.copy(O.shipAt).addScaledVector(up, -TERN_SPINE);
      const dock = O.dockAt.copy(O.shipAt).addScaledVector(O.f, 20);
      // the capsule: in from ahead of her and below, nose first, slowing to a touch
      const close = smoothstep(0, DOCK_AT, ot), q = 1 - close;
      const gap = 46 * q * q;
      const stageAt = O.stageAt.copy(dock).addScaledVector(O.f, O.stageLength + gap).addScaledVector(O.x, -7 * q * q).addScaledVector(up, -5 * q * q);
      _q.setFromAxisAngle(O.x, 0.18 * q * Math.sin(ot * 0.7)).multiply(O.rocketWorldQ);
      rocket.position.copy(rocket.parent.worldToLocal(_a.copy(stageAt)));
      rocket.quaternion.copy(O.parentInvQ).multiply(_q);
      if (ot >= DOCK_AT && !O.docked) {
        O.docked = true;
        Snd.play('land', { hard: false, g: 0.5 }); Snd.play('craft');
        log('Contact. Capture. Hard dock. The Tern has me.');
      }
      // her lamps, one station after another from the nose aft, and her wingtip lights once they are all on
      for (const l of World.ternLamps) l.mat.emissiveIntensity = l.full * smoothstep(0, 0.3, ot - LIGHTS_AT - l.k * 0.28);
      const navOn = smoothstep(0, 0.3, ot - LIGHTS_AT - 2.8), blink = Math.sin(ot * Math.PI * 1.6) > 0.2 ? 1 : 0.15;      // (under one flash a second)
      for (const l of World.ternNav) l.mat.emissiveIntensity = l.full * navOn * blink;
      if (ot > LIGHTS_AT + 0.6 && O.said < 1) { O.said = 1; log('Control: Groundwork, the Tern reports you aboard. She is all yours.', 'control'); }
      // her engine
      const eng = smoothstep(BURN_AT, BURN_AT + 0.6, ot);
      World.ternFlame.visible = eng > 0.001;
      World.ternFlame.scale.setScalar(Math.max(0.001, eng * 1.8));
      { const P = World.ternFlame.userData; if (P.flame) P.flame.material.uniforms.uGain.value = 2.0; if (P.core) P.core.material.uniforms.uGain.value = 3.2; if (P.wide) P.wide.material.uniforms.uGain.value = 0.6; if (P.glow) P.glow.material.opacity = 0.9 * eng; }
      World.launch.burning = eng > 0.05;
      World.launch.alt = 3000 + run;
      if (ot > BURN_AT + 1.2 && O.said < 2) { O.said = 2; log('Burn for Earth. Mars is getting smaller.'); }
      World.launch.focus = O.shipAt;
      if (ot < DOCK_AT + 0.8) {
        // off her bow on the lit side and above, looking down across her at the planet's edge: she is dark against it
        setShot('approach', 34);
        const k = ot / (DOCK_AT + 0.8);
        _a.copy(O.f).multiplyScalar(Math.cos(O.appAz)).addScaledVector(O.x, -Math.sin(O.appAz));
        stand(_d.copy(dock).addScaledVector(O.f, 6 + 14 * (1 - k)), _a, O.appPitch, 58 - 10 * k, O.appRoll);
      } else if (ot < BURN_AT) {
        // along her length, from the nose aft, as the lights come on
        setShot('lights', 40);
        const k = smoothstep(DOCK_AT + 0.8, BURN_AT, ot);
        _d.copy(O.shipAt).addScaledVector(O.f, 18 - 34 * k);
        _a.copy(O.x).multiplyScalar(-1);
        stand(_d, _a, O.lightPitch, 34, O.lightRoll);
      } else {
        // riding ahead of her and above, looking back down her length at Mars as it falls away
        setShot('away', 44);
        const k = smoothstep(BURN_AT, BURN_AT + 6, ot);
        cam.position.copy(O.shipAt).addScaledVector(O.f, 34 + 8 * k).addScaledVector(up, 11 + 4 * k).addScaledVector(O.x, -9);
        _d.copy(O.shipAt).addScaledVector(O.f, -30).addScaledVector(up, -26 - 30 * k);
        camLookAt(_d, up);
      }
    }
    if (S.shake > 0) cam.position.addScaledVector(_a.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5), S.shake * 0.35);
    // a short dip to black over the one cut that crosses half a planet
    e.final.uniforms.uFade.value = 1 - smoothstep(0.0, 0.7, Math.abs(lt - CUT_ORBIT));
    Snd.rumble(clamp(burn * 0.85 * (1 - smoothstep(CUT_LEAVE, MECO, lt)), 0, 0.85));

    // the smoke is lit by this frame's sun, as this camera sees it
    cam.updateMatrixWorld();
    smoke.u.uSunV.value.copy(e.sunDir).transformDirection(cam.matrixWorldInverse);
    smoke.u.uUpV.value.copy(up).transformDirection(cam.matrixWorldInverse);
    const sunI = e.sky.sunIntensity || 0;
    smoke.u.uSunCol.value.copy(e.sky.sunColor).multiplyScalar(Math.min(1.5, sunI * 0.34));
    smoke.u.uAmb.value.copy(e.sky.ambientSky).multiplyScalar(0.5).addScalar(0.015);
    smoke.update(dt, cam, pixelHeight());
    if (lt > WIN && !S.won) winGame();
  };
}

/** Set the last scene: the hour, the Tern, and where the camera and the ascent stage are about her. */
function enterOrbit(up, F) {
  const e = ctx.engine;
  // Hours later, where the sun stands low over the place: the line between day and night crosses the ground behind her.
  S.tod = todForSunHeight(up, -0.12);       // (just past dusk below her: she is unlit, against the day side's edge, until her own lights come on)
  updateSunDir();
  const s = e.sunDir.clone().addScaledVector(up, -e.sunDir.dot(up)).normalize();       // toward the sun, level
  const h = new THREE.Vector3().crossVectors(up, s);                                    // level, square to the sun
  // She flies square to the sun and a little away from it; the cameras stand off her on the side away from it, so
  // that she is seen dark against the lit planet.
  const f = h.clone().multiplyScalar(Math.cos(25 * DEG)).addScaledVector(s, -Math.sin(25 * DEG)).normalize();
  const x = new THREE.Vector3().crossVectors(up, f);
  const centre = up.clone().multiplyScalar(ORBIT_R);
  tern.scale.setScalar(1);
  tern.quaternion.setFromRotationMatrix(_m.makeBasis(x, up, f));
  tern.position.copy(centre).addScaledVector(up, -TERN_SPINE);
  tern.updateMatrixWorld(true);
  // the ascent stage lies nose toward the ship: its own "up" is the way it points
  const rocketWorldQ = new THREE.Quaternion().setFromRotationMatrix(_m.makeBasis(x, f.clone().negate(), up));
  const rocket = World.mavRocket;
  rocket.parent.updateWorldMatrix(true, false);
  const parentInvQ = rocket.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  // How long the stage is, from the point it is placed by to the top of its capsule, along its own axis.
  rocket.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(rocket.matrixWorld).invert();
  let top = 0;
  rocket.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    for (let q = o; q && q !== rocket; q = q.parent) if (!q.visible) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const bb = o.geometry.boundingBox;
    _m.multiplyMatrices(inv, o.matrixWorld);
    for (let i = 0; i < 8; i++) top = Math.max(top, _a.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z).applyMatrix4(_m).y);
  });
  const stageLength = clamp(top - 0.2, 3, 14);
  World.launch.focus = centre;
  e.snapLight = 3;                 // (the light is metered and the sky's light taken afresh at once, under the cut, not a second into the shot)
  F.glow = 0; F.smoke.u.uGlow.value = 0; F.smoke.u.uColumn.value = 0; F.smoke.u.uWind.value.set(0, 0, 0);
  const V = () => new THREE.Vector3();
  return { centre, f, x, s, h, rocketWorldQ, parentInvQ, stageLength, said: 0, docked: false,
    shipAt: centre.clone(), dockAt: V(), stageAt: V(),
    appAz: 118 * DEG, appPitch: 34 * DEG, appRoll: -0.12,
    lightPitch: 18 * DEG, lightRoll: 0.06 };
}
