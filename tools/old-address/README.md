# The old address

The game used to be served from awright22/workos-test-app's `gh-pages` branch, at
https://awright22.github.io/workos-test-app/ (the latest build under `next/`). These files replace everything on
that branch, at its root and in `next/`, so that the old address serves only:

- `index.html` (and `next/index.html`, `404.html`): a page that sends the player to https://awright22.github.io/mars/.
  In a copy added to the home screen that still holds a saved run, it offers the run as text instead, to paste into
  the new game (Settings, Saved games, Load from text): a home-screen copy at the new address starts with empty
  storage. In a browser tab both addresses share storage, and the new game reads the old save itself.
- `sw.js` (and `next/sw.js`): replaces the old service worker, clears the old game's offline copy and retires itself,
  so the old address stops serving the old game from the cache.

Push them only once the new address serves the game, or players are sent to a 404. From a clone of
workos-test-app: check out `gh-pages`, remove everything but `.git`, copy these files in (keeping `next/`), commit and
push to `gh-pages`. No other branch, and nothing of the WorkOS app, is touched.
