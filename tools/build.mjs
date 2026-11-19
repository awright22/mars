#!/usr/bin/env node
/*
 * Build the game:  game/src/**  ->  game/{game.js, terrain-worker.js, game.css, sw.js}
 *
 *   node tools/build.mjs            one build (minified)
 *   node tools/build.mjs --watch    rebuild on change (unminified, fast)
 *   node tools/build.mjs --dev      one unminified build
 *
 * The outputs are committed, so the game runs from a plain static server (and from GitHub Pages)
 * without a build step. sw.js is generated last: its cache name is a hash of
 * every shipped file, so any change to the game gives installed copies a new cache.
 */
import { build, context } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const tools = path.dirname(fileURLToPath(import.meta.url));
const game = path.join(path.dirname(tools), 'game');
const src = path.join(game, 'src');
const watch = process.argv.includes('--watch');
const dev = watch || process.argv.includes('--dev');

const common = {
  bundle: true,
  minify: !dev,
  sourcemap: dev ? 'inline' : false,
  target: ['es2020', 'safari15'],
  legalComments: 'none',
  logLevel: 'info',
  nodePaths: [path.join(tools, 'node_modules')],
  define: { __DEV__: JSON.stringify(dev) },
};

const configs = [
  { ...common, entryPoints: [path.join(src, 'main.js')], outfile: path.join(game, 'game.js'), format: 'esm' },
  { ...common, entryPoints: [path.join(src, 'terrain', 'worker.js')], outfile: path.join(game, 'terrain-worker.js'), format: 'iife' },
  {
    ...common,
    entryPoints: [path.join(src, 'ui', 'game.css')],
    outfile: path.join(game, 'game.css'),
    loader: { '.woff2': 'file', '.woff': 'empty' },
    assetNames: 'assets/fonts/[name]',
  },
];

// Files that make up the running game, relative to game. Everything here is
// precached by the service worker and copied to gh-pages by tools/publish.mjs.
export async function shippedFiles() {
  const out = ['index.html', 'game.js', 'terrain-worker.js', 'game.css', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'licenses.txt'];
  async function walk(dir) {
    let entries = [];
    try { entries = await readdir(path.join(game, dir), { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const rel = path.posix.join(dir, e.name);
      if (e.isDirectory()) await walk(rel);
      else if (!e.name.startsWith('.')) out.push(rel);
    }
  }
  await walk('assets');
  await walk('icons');
  const present = [];
  for (const f of out) { try { await stat(path.join(game, f)); present.push(f); } catch { /* not built yet */ } }
  return present.sort();
}

// Names inside the bundled libraries that the game would rather not carry, renamed in the built file: three.js's
// shadow-sampling helper is named for the mathematician whose spiral it uses, and the name is one the game keeps out
// of everything it ships. A GLSL function inside one shader string: renamed everywhere it occurs, it works the same.
async function renameInBundle() {
  const file = path.join(game, 'game.js');
  const was = await readFile(file, 'utf8');
  const now = was.replace(/vogelDiskSample/g, 'spiralDiskSample');
  if (now !== was) await writeFile(file, now);
}

// The game's name lives in src/core/brand.js. It is written into the page's title, its app titles and the boot
// screen, and into the manifest, so that renaming the game is one edit there.
async function stampTitle() {
  const brand = await import(pathToFileURL(path.join(src, 'core', 'brand.js')).href + `?t=${Date.now()}`);
  const page = path.join(game, 'index.html');
  let html = await readFile(page, 'utf8');
  const was = html;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${brand.TITLE}</title>`)
    .replace(/(<meta name="apple-mobile-web-app-title" content=")[^"]*(")/, `$1${brand.TITLE}$2`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${brand.TITLE}: ${brand.DESCRIPTION}$2`)
    .replace(/(<div class="mg-wordmark">)[\s\S]*?(<\/div>)/, `$1${brand.WORDMARK_HTML}$2`)
    .replace(/(<noscript><p[^>]*>)[^<]*?( needs JavaScript)/, `$1${brand.TITLE}$2`);
  if (html !== was) await writeFile(page, html);
  const mf = path.join(game, 'manifest.webmanifest');
  const m = JSON.parse(await readFile(mf, 'utf8'));
  Object.assign(m, { name: brand.TITLE, short_name: brand.TITLE, description: brand.DESCRIPTION });
  const out = JSON.stringify(m, null, 2) + '\n';
  if (out !== await readFile(mf, 'utf8')) await writeFile(mf, out);
}

// game/licenses.txt, shipped with the build and linked from the in-game credits: the MIT notices of the libraries in
// game.js and terrain-worker.js, and the SIL Open Font License with the fonts' copyright lines, taken from the
// installed packages so that they always match what is shipped. (Without node_modules the committed file stays.)
async function writeLicences() {
  const nm = path.join(tools, 'node_modules');
  const read = async (...p) => readFile(path.join(nm, ...p), 'utf8');
  let three, fflate, meshopt, barlow, mono;
  try {
    [three, fflate, meshopt, barlow, mono] = await Promise.all([read('three', 'LICENSE'), read('fflate', 'LICENSE'), read('gltfpack', 'LICENSE.md'),
      read('@fontsource', 'barlow', 'LICENSE'), read('@fontsource', 'jetbrains-mono', 'LICENSE')]);
  } catch { return; }
  // the font licence's own text: everything after the lines that name the fonts and point to it
  const ofl = barlow.slice(barlow.indexOf('-----------------------------------------------------------') >= 0 ? barlow.indexOf('-----------------------------------------------------------') : barlow.indexOf('SIL OPEN FONT LICENSE')).trim();
  const rule = '='.repeat(78);
  const part = (title, body) => `${rule}\n${title}\n${rule}\n\n${body.trim()}\n\n`;
  const text =
    'Third-party software and fonts in this game, and their licences.\n\n' +
    'The game\'s own code, models and sound are original work. The libraries below are bundled into game.js and\n' +
    'terrain-worker.js, and the fonts are shipped in assets/fonts/. Their licences require these notices.\n\n' +
    part('three.js (https://threejs.org), MIT License', three) +
    part('fflate (https://github.com/101arrowz/fflate), MIT License', fflate) +
    part('meshoptimizer (https://github.com/zeux/meshoptimizer): the mesh decoder, MIT License', meshopt) +
    part('Fonts: Barlow, Barlow Condensed and JetBrains Mono, SIL Open Font License 1.1',
      'Barlow and Barlow Condensed: Copyright 2017 The Barlow Project Authors (https://github.com/jpt/barlow)\n' +
      'JetBrains Mono: Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono)\n\n' +
      'These Font Software are licensed under the SIL Open Font License, Version 1.1, reproduced below.\n\n' + ofl) +
    part('Data', 'Mars elevation: Mars Orbiter Laser Altimeter (MOLA) Mission Experiment Gridded Data Record, via the NASA Planetary\n' +
      'Data System Geosciences Node. Mars colour: Viking MDIM 2.1 global mosaic, via the USGS Astrogeology Science Center.\n' +
      'Both are public domain. Their use does not imply endorsement by NASA, JPL, USGS or any other agency.');
  const out = path.join(game, 'licenses.txt');
  let was = '';
  try { was = await readFile(out, 'utf8'); } catch { /* first build */ }
  if (text !== was) await writeFile(out, text);
}

// The page carries the build it belongs to (index.html checks the offline copy against it before it loads the game).
// The stamp is left out of the hash it is made from.
const STAMP = /\/\*BUILD\*\/'[0-9a-f]*'\/\*END\*\//;
// What must be in the offline copy for the game to start at all; the rest is fetched as well, but one file that
// fails to arrive does not fail the whole install.
const SHELL = /^(game\.js|game\.css|terrain-worker\.js|manifest\.webmanifest|icon-\d+\.png|assets\/fonts\/)/;

async function writeServiceWorker() {
  await stampTitle();
  await writeLicences();
  const files = await shippedFiles();
  const page = path.join(game, 'index.html');
  const html = await readFile(page, 'utf8');
  const hash = createHash('sha256');
  for (const f of files) { hash.update(f); hash.update(f === 'index.html' ? html.replace(STAMP, "/*BUILD*/''/*END*/") : await readFile(path.join(game, f))); }
  const version = hash.digest('hex').slice(0, 12);
  if (!STAMP.test(html)) throw new Error('index.html has no /*BUILD*/ stamp to write the build into');
  const stamped = html.replace(STAMP, `/*BUILD*/'${version}'/*END*/`);
  if (stamped !== html) await writeFile(page, stamped);
  const template = await readFile(path.join(src, 'sw.template.js'), 'utf8');
  const rest = files.filter((f) => f !== 'index.html');
  const sw = template
    .replace('__CACHE_VERSION__', version)
    .replace('__SHELL__', JSON.stringify(['./', ...rest.filter((f) => SHELL.test(f))], null, 0))
    .replace('__PRECACHE__', JSON.stringify(rest.filter((f) => !SHELL.test(f)), null, 0));
  await writeFile(path.join(game, 'sw.js'), sw);
  let bytes = 0;
  for (const f of files) bytes += (await stat(path.join(game, f))).size;
  console.log(`sw.js: cache mg-${version}, ${files.length} files, ${(bytes / 1e6).toFixed(2)} MB to precache`);
  return version;
}

if (watch) {
  const ctxs = await Promise.all(configs.map((c) => context({
    ...c,
    plugins: [{ name: 'sw', setup(b) { b.onEnd(() => { writeServiceWorker().catch(() => {}); }); } }],
  })));
  await Promise.all(ctxs.map((c) => c.watch()));
  console.log('watching for changes…');
} else if (import.meta.url === `file://${process.argv[1]}`) {
  await Promise.all(configs.map((c) => build(c)));
  await renameInBundle();
  await writeServiceWorker();
}
