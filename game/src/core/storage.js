// Where the game keeps things in the browser (local storage keys and the offline cache's name), and the one-time
// move of what an earlier version kept under the game's old name: a save, the settings, the graphics preset. The
// old keys are read, copied to the new ones, and left in place as a fallback. The cache prefix must match the
// copies of it in src/sw.template.js and index.html.
export const PREFIX = 'mg-';
/** The prefix the game used before it was renamed (read only, to carry saves and settings over). */
export const OLD_PREFIX = 'stranded2-';
export const storeKey = (name) => PREFIX + name;
/** Copy an old key's value to its new key, once, when the new one is empty. Safe without storage. */
export function adoptOld(name) {
  try {
    if (localStorage.getItem(PREFIX + name) !== null) return;
    const v = localStorage.getItem(OLD_PREFIX + name);
    if (v !== null) localStorage.setItem(PREFIX + name, v);
  } catch (e) { /* no storage: nothing to carry */ }
}
