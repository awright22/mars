# Mars Survival: quality bar and open items

This file is the bar the game is held to, what has been measured against it, and what is still open. A session
that changes the game updates it. "Measured" always says how: a number from headless Chromium with software
rendering (SwiftShader) is not a real frame rate.

It was condensed on 19 November 2026, when the game moved into its own repository and its story was made
original. The full record of the review rounds, their numbered findings and the passes made on them stays with the
old repository and is not carried here, because it quoted the source material the game no longer uses. What is
kept is the bar, the latest measured state of each part of it, what each set of reviews settled, and every item
still open. A finding cited by letter and number (V3, P5, K16) uses the old record's numbering.

Paths to source files are relative to `game/src/` unless they begin with `tools/`.

## The game after the move

**The repository.** `game/` is the static site (`index.html`, `src/`, `assets/`, and the built `game.js`,
`terrain-worker.js`, `game.css` and `sw.js`, committed so the game runs from any static host). `tools/` holds
`build.mjs`, `serve.mjs`, `publish.mjs`, `lint.mjs`, the tests (`tools/tests/`) and the Blender scripts
(`tools/assets/`). The docs are at the root. The game is published from this repository's `gh-pages` branch to
https://awright22.github.io/mars/, with a preview under `next/`. There is no server-side route.

**The story, as fixed by the owner for the move.** Quinn (a surname only, never gendered in game text) is
Groundwork, a one-person advance mission sent to switch on Arcadia Station in Arcadia Planitia before the first full
crew flies. A solar storm during the descent breaks guidance; Quinn's capsule and the Hab lander come down together
far off target (hence the random start), and every relay at Mars goes dark. Nobody is coming: the ride home is the
empty transit ship Tern, parked in orbit, which leaves on a fixed sol to catch the return window. The acts: Down (air,
power, the first beds; water from ice and from regolith baked in a power-hungry oven); Signal (an Earth-link built at
the Hab from a dish, an amplifier and a pointing drive salvaged from three dead landers); Fill (Control, a fictional
international programme, restarts the station's propellant plant to fill the ascent vehicle by the difficulty's
sol; survey requests are paid in cargo canisters dropped from the Tern); Traverse (the drive to Arcadia Station and a
handover note for the first crew); Ascent (Quinn launches alone and docks with the Tern). The speakers are Control
(Ruth Adeyemi, Tomas Lindqvist, Ines Duarte, Aiko Mori); letters also come from Quinn's family and a school class.
The difficulties are FLYBY (launch Sol 15), ORBITER (Sol 25) and LANDER (Sol 35, one life). In Base mode ("Stay")
the Tern did not survive the storm, the next ship is 26 months out, and Quinn builds the place it will land. Real
places and spacecraft stay; real agencies appear only as the makers of historic landers. Pathfinder's site is named
Chryse Planitia.

## The move (19 November 2026)

**Done.** The game was copied out of its old repository into this one as a standalone project, in one first
commit with none of the old history. The story was replaced by the owner's design (above), and every element that
came from another work was removed or replaced: names, dialogue, letters, log lines, achievements, difficulty names,
tips, the opening film, the comms beat, the rescue and the ending, the music's framing, a banner and a mission
patch in the Hab, and the transit ship's model (the old one was replaced by the Tern, `tools/assets/vehicles.py`,
build_tern). The water rig became a regolith oven (`tools/assets/hab.py`, st_oven). Saves from before the move are
carried into the new story and the player is told so plainly; saves can be copied out and pasted in as text. The
build ships `licenses.txt`, linked from the credits, which also say the game is not affiliated with any agency. A
photosensitivity notice is shown on first launch. The name is Mars Survival, the owner's choice (19 November). The
game is served at https://awright22.github.io/mars/ (the repository made public, 22 November). The redirect for the
old address (`tools/old-address/`) is on workos-test-app's `gh-pages`, but that repository was made private the same
day, which switched its Pages off: the old address serves nothing (item 12).

**Checked.** Every test of the suite passed on the published files (20 November, cache `mg-d77108870246`):
seventeen in the publish run, then ui-audit (after its measuring was made to wait out a gauge's few seconds of
news), ui-audit-selftest and update on the same build, which was published with `--skip-tests` because only a
test had changed. A walk through the game at iPhone size (Playwright's iPhone 14 held sideways) against a local copy:
the photosensitivity notice, the title, the credits with the licences link, the opening film, first contact, a
letter in the log and the journal, the handover, the launch, the docking and the last note, with no console errors;
the ending again after its fixes. An independent reviewer judged the films from those stills (item 43). On 22
November the same walk through the published build at its address: every step, no console errors. The old address
landed on the new one in a browser for the quarter of an hour it was served.

## Originality

Everything in the game is its own: no names, lines, jokes, distinctive chain of events, ship designs or insignia
taken from any book, film or game. When writing new text, keep to the voice (handover notes to the first crew:
practical, dry, exact, funny only through understatement) and to the cast and story in "The game after the move".
Real places, real spacecraft and real Mars science are kept and must stay factually right. Facts checked in the move
(primary sources, through a research pass): the radio hardware each lander really carried (planet/features.js,
`link`); about 2% water by weight in Martian soil (Curiosity, Leshin and others 2013); perchlorate found by Phoenix
in 2008 (Hecht and others 2009); launch windows about 26 months apart; shallow ice under Arcadia and the candidate
crew site AP-1 at 39.8 N, 202.1 E (Golombek and others 2021; a later paper puts it on the Arcadia–Amazonis
boundary); the first visible aurora seen from the surface, by Perseverance in March 2024, mostly by spectrometer
(Knutsen and others 2025).

## Direction from the owner

On 12 November, after the fifth picture review, the owner asked for the game to be made for the owner's iPhone held
in landscape, with the desktop a bonus, and for two modes: **Story mode**, played through to the flight home, and
**Base mode**, with the same opening and no flight home, in which the player gathers far more kinds of resource and
builds a whole base, in the manner of Valheim without enemies. Story mode first. What follows:

1. **The iPhone in landscape is the target; desktop is a bonus.** Phones start on "medium" and step themselves down
   if they cannot hold the frame rate. Review pictures are taken at iPhone size with touch on. A fault on the phone
   outranks any fault on the desktop.
2. **Story mode first.** It is finished when the picture and interface bars are met on the phone and the owner has
   played it on the iPhone.
3. **Base mode after.** Begun on 14 November, once Story mode's bars were reached.
4. **The standard is a solid indie release, not AAA** (14 November). A bar marked NEARLY counts as reached.
   Reviewers still grade MET, NEARLY or NOT MET against that standard. What is left in Story mode is whatever a
   review still marks NOT MET, and bugs; findings on a NEARLY bar are polish, kept listed and done where cheap.

On 15 November, after playing on the iPhone:

5. **The rover stuck on very small rocks.** Fixed (see "In motion").
6. **The HUD was too crowded.** The owner asked for a quiet HUD when nothing is wrong and detail on asking or when
   something needs the player; each fact said once; an emergency impossible to miss; the calm state's cover measured
   on foot and in the rover at both phone sizes, about 15% or less with the middle and most of the top third clear;
   the full HUD kept as a setting. Built (see "The quiet HUD").
7. **Put the effort where code can still raise quality; stop re-attempting what has plateaued.** Plateaued and left
   unless cheap: how ice, lava and rock surfaces look, the Schiaparelli wreck, the shape of the astronaut's shadow.
   Worth pushing, in order: (a) the game checked in motion by a scripted player with frame strips; (b) driving and
   walking feel; (c) the interface to MET at both phone sizes; (d) the launch and the ending as cutscenes; (e) baked
   lighting from the Blender build; (f) wear by code; (g) sharpness on the phone, a 30 or 40 fps setting.
8. **Bounds.** One pass per item and one re-check. An item not improved after two attempts is recorded as
   plateaued. Publish to the preview as items land.
9. **Four additions the same day:** the HUD in an emergency (one lead alert with what to do and the bar it affects;
   other warnings queue or shrink to marks); two motion checks, the dust storm ("painted, not moving") and the idle
   stance ("stiff"); light for getting about at night, and haze on dark boulders on the horizon; a pass on the
   built objects the reviewers flagged. Every item from (a) to (g) and every addition has had its pass and re-check.

On 16 November: **a first-person view from the rover's seat** with the cockpit in sight (built), and **one picture
and one interface review against a higher bar**, "a high-end indie or premium mobile release", with every finding
marked code or sourced art and given an effort (recorded; a first batch of ten acted on). On 17 November: an opening
sequence (built, then replaced in the move) and footsteps out of time with a high-stepping walk (fixed).

**Where Story mode stands.** Against the solid-indie standard every picture and interface bar is NEARLY or MET
(the eleventh picture review, the tenth interface review). Against the premium bar both overall verdicts are NOT
MET. The films that open and close the story were re-authored in the move and have not been reviewed since.

## How to check

```
(cd tools && npm ci)
node tools/build.mjs                  # game/src/ -> game/game.js, terrain-worker.js, game.css, sw.js (--watch, --dev)
node tools/lint.mjs                   # undefined names, bad imports
node tools/tests/run.mjs              # the whole suite, twenty parts, stopping at the first failure
node tools/tests/ui.mjs --size=phone-844x390   # one part of the interface suite alone
node tools/tests/ui-audit.mjs         # every phone state: text under the floor, targets under 44 px, clipping, HUD cover
node tools/tests/hud-cover.mjs --shoot   # the quiet HUD's share of the screen, with pictures
node tools/tests/first-ten.mjs        # a new player's first ten minutes on a phone, as numbered screenshots
node tools/tests/film.mjs --opening --hud   # the opening film as stills (--phone: the launch as a strip)
node tools/tests/shots.mjs --phone    # the picture matrix at iPhone size -> tools/tests/.cache/shots-phone/
node tools/tests/ui-shots.mjs         # every interface state at every size -> tools/tests/.cache/ui/
node tools/tests/audio.mjs            # 129 offline audio renders measured for loudness and clicks (5 min)
node tools/tests/perf.mjs             # draw calls and triangles per frame against the budgets
node tools/serve.mjs                  # play at http://127.0.0.1:8765/  (?q=low|medium|high|ultra, ?nofilm)
node tools/publish.mjs "what changed"            # build, lint, test, then publish to gh-pages
node tools/publish.mjs --to next "what changed"  # ... into gh-pages/next/, beside the live game
```

The suite: smoke, opening, arc, save, science, machines, farm, photo, sights, rocks, drive, motion, steps,
audio-hooks, base, card-open, ui, ui-audit, ui-audit-selftest, update. Picture and strip tools beside it:
`motion.mjs --strips`, `cockpit-shots.mjs`, `night-shots.mjs`, `sharp-shots.mjs`, `base-walk.mjs`. The debug hook
`window.__MG` (`main.js`) starts a game at any site, teleports, sets the hour and weather, steps the simulation
without drawing and places a free camera.

In a cloud session the browser draws in software on four cores inside a 14 GB limit shared by everything the
session starts; one phone-size browser can hold 4 GB. Run one browser at a time, two at most, and tell helpers the
same. The local server serves as the published site does (stated lengths, gzip with the compressed length): it once
did neither, which hid the fault that kept the game from starting on the owner's iPhone. Tests poll for the state
they expect rather than wait a fixed time, and a call into the page that does not return in fifteen minutes fails
with the site and what was drawn (`tools/tests/lib.mjs`), after one unexplained half-hour hang. The debug hook's
`settle()` waits twenty seconds for the ground about the camera; here the two terrain workers share the four cores
with the software renderer, and the finest chunks (the only ones that carry stones, and where boulders become
colliders) can take minutes. A test that looks at rocks or boulders waits for all of it, `G.settle(420000)`
(`rocks.mjs`, `base.mjs`): without that the rocks test found no stones at all and the base test no boulder. A test
run beside two other browsers can also flag a slow step that is only the machine (`motion.mjs` did once).

## The bar

| Area | Bar | State |
| --- | --- | --- |
| Frame rate | 30 fps or better on the owner's iPhone, in landscape, on "medium"; 60 fps on a mid-range laptop at "high" is a bonus | **MET on an old build; to be measured on the current one.** First report (932 x 430 points at 3x, iOS 18.7, Safari, build `775c4ab5aec2`): 60 fps average, 37 at the slowest 1%, worst frame 55 ms; 60 draw calls (21 shadow), 322k triangles; no errors; drawn at a scale of 0.64. Second report, same build: 51 fps average, 14 at the slowest 1%, worst 765 ms, drawn at 820 x 378, 94 calls, 373k triangles, in the rover. Both show the old governor stepping down and never up; it now climbs, and a hitch no longer costs a step. Later builds cost more per pixel and are unmeasured on a phone. No laptop GPU measured (software rendering gives 0.4 to 12 fps) |
| Scene cost | Per frame (`perf.mjs`). "low": 180 calls, 340k triangles in the picture, 230k in shadow. "high": 290 / 600k / 400k. Estimates, to catch regressions | low: 69 to 180 calls, 130k to 251k, 47k to 222k. high: 83 to 229, 130k to 389k, 84k to 266k. "low" outside the Hab sits on its call budget, 75 of them shadow passes |
| Load | Title interactive in under 5 s on 20 Mbit; under 14 MB; works offline after first load | 15.31 MB precached (69 files) in the build of 20 November, against a bar of 14 MB: **over** (the move's new models, the licences file and the regolith oven; not yet looked into); 1.2 to 5.5 s headless from localhost. Starts on the owner's iPhone since the loader fix (confirmed). Not measured on a phone network |
| Console | Zero errors or warnings in a full playthrough | zero in every test and screenshot run |
| Story arc | Every step from the landing to the docking with the Tern works | 24 of 24 scripted checks (`arc.mjs`), the regolith oven and the three-part Earth-link among them (19 November) |
| Systems | Every system does what it says | science 16/16, equipment wear 8/8, farm, meals, morale and comforts 8/8, photo mode 9/9, sights, moons and compass 9/9, audio wiring 26/26 |
| Saves | Old saves load, or the player is told plainly why not | Format 5. A save from before the move (format 4, under the old storage key) is carried into the new story and the player is told so on Continue; version-2 and -3 saves migrate with a notice; unreadable saves are reported on the title; saves go out and come back in as text (Settings, Saved games). All tested in Chromium (`save.mjs`); not yet on the owner's iPhone |
| Picture: day | Reads as Mars at a glance: butterscotch sky paler at the horizon, sunlit regolith with rocks, hard shadows, haze with distance | **MET** (round 11). Premium: NEARLY |
| Picture: dawn and dusk | Low sun, long shadows, the blue glow round the sun, readable ground | **MET**. Premium: NEARLY (the sun a small pin) |
| Picture: night | Stars, a readable silhouette of the ground, lamps and headlights light the way, Hab windows glow | **MET**, narrowly; walking light MET after the night pass. Premium: NEARLY |
| Picture: dust storm | Visibility collapses, the sun a dim disc, dust streams past, audibly and visibly dangerous | NEARLY, reached; the storm moves MET in motion. Premium: **NOT MET** ("a banded overlay, not weather") |
| Picture: poles | Ice caps look like ice, no artefacts at the poles | NEARLY, "the closest to NOT MET", reached; plateaued. Premium: **NOT MET** |
| Picture: orbit | The title and the launch show a real globe with a thin atmosphere | **MET**; the title MET at the premium bar too |
| Models | Every object purpose-built; nothing reads as a primitive | **MET**. Premium: NEARLY ("the same matte paint") |
| Animation | Never slides, pops or T-poses; every action has a pose | Fourteen clips; the builder finds no sliding or sinking foot. From frame strips: the gait NEARLY, work and transitions NOT MET, the stance NEARLY. The walk redone on 17 November |
| First ten minutes | A new player always knows what to do next and why, without a wall of text | NEARLY at both phone sizes, reached. Premium: NEARLY, "closest to MET" |
| Interface | Every screen legible and unclipped at phone sizes under the notch and status bar; touch has a pause button | NEARLY at 844 x 390 and 667 x 375, reached; not the MET item (c) asked for. `ui-audit.mjs` finds nothing in 156 states; `ui.mjs` makes 208 checks. Premium: **NOT MET**; the HUD in play and emergencies MET |
| Opening and ending | Told to someone who knows nothing of it; each shot reads at once on a phone; nothing broken; lines readable inside the safe areas; Skip works; nothing left in the scene; the launch one continuous climb | Re-authored in the move and reviewed once from stills (item 43): before the fixes, told NEARLY (opening) and NOT MET (ending), reads at once NOT MET, nothing broken NOT MET. The ending's faults it found are fixed and not yet reviewed again; the opening's capsule and wreck are open |
| Sound | Wind, suit, footsteps, rover, Hab, actions, events, an adaptive score; nothing clips | Synthesised in the browser. Offline: peaks under -1.4 dBFS with everything at once, a calm day about -34 LUFS, a storm -18. **Nobody has listened to it.** Calm beds are mostly under 300 Hz, faint on a phone speaker. The Hab's music changed in the move (item 44) |
| Feel | Walking, jumping and driving have weight; the camera never clips through walls or ground | From frame strips: on foot NEARLY, the rover NEARLY ("weak"), contact NEARLY to MET, the camera NOT MET, then fixed and checked by the scripted player only |
| The rover from the driver's seat | The view from the seat, a cab that reads as this rover's, true instruments, right light, one tap, a clean change of view (K1 to K7) | K2 to K6 **MET**, K1 NEARLY; no blocker |
| Depth | On a par with Stardew Valley or Animal Crossing: systems that feed each other, always something worth doing | Survival, five crops with a pantry and cooked dinners, morale, field science with 17 materials and science grants, equipment wear, ten upgrades, four deployables, seven survey tasks, fourteen landers to salvage, storms and dust devils, letters, nine comforts, photo mode, nineteen achievements, Base mode. Thin: a second greenhouse; other people's hardware beyond salvage |

## Picture reviews: what they settled

Each round a fresh reviewer was given the picture matrix and the bar, not my reading of it: from round 6 the stills
of `shots.mjs --phone` (844 x 390 at twice the pixels, the interface hidden, "medium"), and from round 8 a strip of
the launch. Eleven rounds were run, 12 to 16 November. Round 1 met nothing; orbit was met by round 2, dawn and dusk by
round 4, day and models by round 6, when the overall verdict first reached NEARLY. Rounds 7 to 10 held NEARLY with
the poles, landmarks and at times terrain NOT MET. **Round 11**, the first held to the solid-indie standard, found
nothing NOT MET: "about three-quarters of the set would pass as a solid indie release without comment". It graded
day, dawn and dusk, night (narrowly), orbit, landmarks, models, the astronaut and interiors MET; the storm, the poles,
the launch, terrain and overall NEARLY.

**Settled, not to be re-opened.** Slope faults (saw-teeth, seams, stair-steps, stretched textures) are gone: each
terrain square is cut along its grain, no ledge is drawn narrower than its mesh can carry, and every detail period
divides 64 m. Nothing floats or sinks: everything stands on the drawn triangle. Valles Marineris reads from its real
rim (293 E) and from inside; Olympus reads as a volcano. The title globe, the night's floodlighting, the storm's
ribbons, the figure's backward lean and its lighting from the sun's side were put right. Several "faults" were the
picture script's own, and the script was fixed.

**What round 11 left.**

| # | Finding | State |
| --- | --- | --- |
| V1 | A straight line between near and far ground | fixed at the Hab (trodden ground is the middle of a big site only, `_pad` in `planet/height.js`); milder cases elsewhere open |
| V3, V14, V15 | Ice not like ice; Olympus's caldera dapples and dough lobes; the Schiaparelli wreck close up | open; plateaued by the owner's item 7 |
| V4 | The figure's shadow a blob at most sun angles | tried and dropped; plateaued |
| V7 | One crack net everywhere; pen lines on Mars 3's mesa; twig and hexagon lines | open |
| V8 | Ruler horizons | the boulders on the line are hazed; the line itself across a flat plain is **plateaued** |
| V9 | Storm: ground bands darker than the ground, the sun a point, dashes like rain | open (premium A3) |
| V10 | Night: the figure a cut-out, a small helmet pool, a short beam | acted on in the night pass |
| V11 | The suit beige against ice; no rim at dusk | open |
| V12 | Rocks: bevelled boxes, a bun with drawn cracks, pebbles of one colour evenly sprinkled, a dot lattice | open |
| V13 | Props on the surface and clean; no furrow behind the tank | part: contact shadows and dust that deepens; the furrow open |
| V16, V17 | Flat noon; the Hab's light mostly even | noon open; the Hab's lamps baked (NEARLY) |
| V18 | A weave on the dome; the greenhouse's fan ring; wide rover trails; the title's globe touching the credit line; stars of one size | open |

Older and still open: Mars 3's stretched scarp; the canyon's rim a rounded shoulder with no caprock (the elevation
data is smooth there); canyon walls close up one cracked pattern at one scale.

## Interface reviews: what they settled

Fresh reviewers were given every interface state (`ui-audit.mjs --shoot`, 78 states), a new player's first ten
minutes (`first-ten.mjs`) and from the tenth the HUD alone, at 844 x 390 and 667 x 375; from the sixth, one reviewer
to a size, every picture opened. The first three reviews found the phone NOT MET (9 px text, overlaps, small
targets, emergencies that did not lead); the fourth to eighth moved between NEARLY and NOT MET at 667; the ninth,
held to the indie standard, found NEARLY at both sizes and for the first ten minutes: reached. The tenth, with the
quiet HUD, was item (c), asking for MET: NEARLY at both sizes, recorded under the bounds. "The sheets are at
indie-release level"; "the player always has a task, a reason, a place and a distance".

**Rules settled, held in the suite.** Nothing under the notch or home indicator. Text on a phone never under the
floor (13 px on every phone wider than the smallest, 12 px at 667), measured in the page. Every touch target 44 px,
measured. No keyboard wording on touch. One function gives the distance to a target for marker, task line, compass,
journal and map, in the same frame. An emergency always leads the mission list. A refusal says what is wanting and
what to do, or is not shown. A tab's figure counts what its page lists. Units are spaced by one function. Task
titles fit one line. The screens' buttons arrive one at a time, each with its card. Dialogs scroll their body and pin
their buttons. Settings on a phone is four tabs that each fit.

**What the tenth review left open:** the direction arrow, with no distance on the quiet HUD and never introduced
(P5; "a stray cursor" to the premium reviewer), the first thing for the next pass; lists sliced at the fold (P6),
**plateaued as a cue** (a fade and a shelf both failed), so what is left is making rows fit (one row of headers, cards
sized for two rows); small drawn targets (the task line, "? GUIDE" as bare text, the panel's chevron: what is pressed
is a thumb, what is drawn is not); things shown before they are explained (a trend arrow, morale before its bar, five
NEW cards in forty game minutes; VIEW, JUMP, the rover and watering never explained); wording (refusals in three or
four styles, two names for a storm, "water again at 50%" of what); finish (the plate changes size, the task line's
edge moves with its digits, gauge rows on a 20 px pitch, map rings 14 to 20 px, storm discs over labels, the win sheet
scrolls at 667, half-empty settings tabs, "LOG" three times, ragged inventory rows, long log entries cut on a phone,
morale a percentage on the HUD and points in the night's account, litres per watering not stated).

## The quiet HUD (a phone's)

On a touch screen in the phone arrangement the HUD is the quiet one unless "Full HUD" is on (Settings, Interface).
`ui/hud.js` decides what shows; the styles end `ui/css/hud.css` and `ui/css/touch.css`.

| Part | When nothing is wrong | What brings the rest |
| --- | --- | --- |
| Suit | the dial, a share of the tank, with the suit's mark | under half a tank, a refill, the first minute's leak, or a tap: its name and the minutes of air |
| Sol and hour | beside the dial | a tap: the launch sol and the temperature |
| Six gauges | none | one that is low, falling fast (at its warning within 150 s) or just changed by a step, alone; a tap on the dial shows all six for 7 s; a second tap opens the guide |
| Task | one line: title and distance | a tap, a new task or a moved count opens it for 9 s (4.5 s at the wheel); opening the gauges shuts it; not opened in an emergency |
| Compass | the tape; the task's diamond with its place's name; other marks as pictures | the name and distance of the mark the player faces |
| Marker | the diamond, or the dart at the screen's edge | |
| Top right | colony, map, journal, pause, a thumb wide | each named on a card when it arrived |
| Action button | the verb and HOLD when something is in reach; else nothing | a pill only for a detail line, a refusal's reason or a reading |
| RUN, JUMP | not there standing still | while the stick is held and 2.5 s after; the first minute; RUN while the tank is what is wrong |
| Candle | not there | the tank under half |
| VIEW | a switch in Settings, Controls on foot | above EXIT while driving |
| Rover | the speed | battery and tank for 6 s on getting in, under a third, or on a tap |
| Log line | 3.2 s plus 45 ms a letter, 9 s at most; none while a red task leads | |
| Alarms | none | the banner, the red task, the ringed gauge, the screen's edge |

**Each fact once.** The task's distance: the task line. The tank: the dial. HOLD: the button. The launch sol: the
opened dial, the journal and the pause screen.

**How it is measured.** `tools/tests/hud-cover.mjs` (the last part of `ui-audit.mjs`) lays everything showing on a
2 px grid and gives the share of the screen covered, of its middle (two fifths across by half down) and of its top
third; the marker in the world is left out. The bar, held in the suite: standing, walking, at the rover and driving,
at most 15% (16% on the smallest phone), the middle clear, at most 35% of the top third. It measures layout, so
software rendering does not enter into it.

| State (screen; middle; top third) | 932 x 430 (the owner's) | 844 x 390 | 667 x 375 |
| --- | --- | --- | --- |
| Standing in the open | 9.2%; 0; 23% | 11.2%; 0; 28% | 12.6%; 0; 31% |
| Walking | 11.2%; 0; 23% | 13.6%; 0; 28% | 15.5%; 0; 31% |
| At the rover, DRIVE up | 11.2%; 0; 23% | 13.6%; 0; 28% | 15.4%; 0; 31% |
| Driving, behind the rover / in the seat (17 November) | 12.0% / 11.2% | 14.6% / 13.7% | 15.7% / 15.0% |
| Getting in, 6 s (no bar) | 12.7% | 15.4% | 17.6% |
| Gauges opened, on foot / in the rover (no bar) | 18.2% / 21.5% | 22.1% / 26.1% | 24.0% / 28.6% |
| Task opened (no bar) | 13.8% | 16.8% | 18.5% |
| Water and power low, tank at 20% (no bar) | 19.7% | 24.0% | 25.3% |
| The full HUD at the rover (the setting) | 28.5%; 4%; 52% | 34.6%; 9%; 59% | 37.7%; 15%; 62% |

**Reviewed** (15 November: one review, one pass, one re-check). The reviewers' estimates by eye matched the table
to within a point and a half. At the re-check: calm MET by both reviewers; detail on asking MET and NEARLY; enough
(nothing needed more than a tap away) MET narrowly and NEARLY; each fact once, emergencies and finish NEARLY by both.
The premium review later called the quiet state "excellent" and its re-check graded the HUD in play MET.

Left, with the reason: the sol and the clock stand beside the dial, not on the buttons' row (four thumb-wide buttons
fill that row; one menu button in place of four would free it, which is the owner's to choose); the direction is the
compass's mark and the dart at the edge (the dart is the marker when the place is out of view); the suit is said four
ways in an emergency, which is the emergency taking room. Polish: the compass's E fades at the strip's end; the dart
is orange over the landing pad's orange marks.

**An emergency: one thing leads** (`ui/hud.js`). Whatever is wrong is put in one order: an emptying tank, then a
breach (`hud-cover.mjs` holds this in `foot-breach-behind`, after a review found the breach leading with half a
minute of air left), then critical before low, and within a level air, health, water, food, power, the rover's
battery, a storm, cold, morale. What leads shows its banner, which leads with the action in capitals over the cause
(RUN TO THE HAB over "suit O2 critical", SEAL THE BREACH over "the Hab is losing its air"), the gauge it bears on,
and the task card at one line (place and distance). The rest are rings with their sign, red or amber, under the word
ALSO (not on the smallest phone), in one plate a thumb high that opens every gauge. Measured: 19 to 25% of the screen
at 844 and 21 to 27% at 667, against 35 to 38% for the full HUD at rest. The premium re-check graded emergencies MET.
Open: no action button 4 m from a breached wall indoors; RUN not offered out of doors with the Hab holed; the ALSO
marks still read as buttons without a word.

## Base mode

**What it is.** The same storm, leaking suit, Hab and first sols as the story, with no ride home: the Tern did not
survive the storm and the next ship is 26 months out, so the long game is a base that keeps Quinn alive until then
and is the place that ship will land. The loop is Valheim's without the fighting: find a material, bring it home,
build the station that works it, and what it makes opens the next thing. **Where the materials are is real**:
hematite on Meridiani, silica in Gusev and Nili Patera, clays at Mawrth Vallis, Jezero and Gale, sulfates in Valles
Marineris, basalt on the volcanic provinces, ice at the poles and mid-latitude scarps. The rare ones are a rover
journey, which is what the whole explorable planet is for.

| Part | What | State |
| --- | --- | --- |
| A | **A second game with no flight home.** New Game asks "Get home" or "Stay". Its own save beside the story's; the title offers "Continue the base". Nothing counts down: clock, dawn sheet, journal ("The long stay"), map, pause card, Control's first call and the letters say what is true | built, tested (`tools/tests/base.mjs`), on the title |
| B | **Materials.** Basalt off any boulder (after its rock sample), five minerals at 47 deposits in 23 real fields (`game/base.js`), shown on the map from the first sol. Each deposit a Blender model (`tools/assets/deposits.py`) with six loose pieces that go as it is worked | reviewed three times and looked at again: nothing NOT MET (silica and sulfate MET; hematite, salt and clay NEARLY) |
| C | **Works.** A kiln (brick, cement), a smelter (iron) and a glassworks (glass), set down within reach of the Hab's power and given jobs at a sheet of their own (`ui/works.js`): batches that take hours and Hab power, run through the night, and wait when the Hab is under 12% (`game/works.js`). Models with fire and smoke while working (`tools/assets/works.py`) | kiln MET, smelter MET, glassworks NEARLY |
| D | **Buildings.** A solar field, a battery bank, a water tank (240 L), a farm dome, living quarters (morale +2 a dawn), a comms tower (every deposit on the map) and a landing pad (a supply drop every ten sols, with the circuit boards nothing on Mars makes); three of each at most (`BUILDINGS` in `game/base.js`, `tools/assets/buildings.py`). The fuel plant was dropped | MET as a set |

| Material | Comes from | Goes into |
| --- | --- | --- |
| Basalt | any boulder | the kiln and smelter, foundations, the pad |
| Regolith | dug anywhere | bricks, and low-grade iron and dark glass |
| Hematite | Meridiani, Aram Chaos, Candor | iron, at twice the yield |
| Silica | Gusev, Nili Patera, the plains above Ius | clear glass |
| Clay | Mawrth, Nili Fossae, Gale, Oxia, Eridania | brick at three times the yield |
| Gypsum | Candor, Melas, Juventae, Meridiani, Olympia Undae | cement (the quarters, the pad) |
| Salt | the northern plains, Terra Sirenum, Cimmeria, Noachis | oxygen candles, batteries, flux |
| Ice | ice outcrops | water |

**Played from its start** (`tools/tests/base-walk.mjs`, New Game to the first supply drop; 31 pictures, then a
re-check on 37): the loop **MET** at the re-check ("a real chain, not a layer on the story"); guidance, screens,
picture and finish NEARLY. Its one blocker, a supply drop that showed nothing of what it held, is fixed with a card.
By design: every gathering act is a hold and every job a timer; the Base tab offers every building from the start.

**Its bar.** Story mode's bars, unchanged, and its own: an hour of things to do past the opening; every new sheet
inside the safe area at both phone sizes (`ui-audit.mjs --only=base`, eight states each: met); a base saved in one
build loads in the next (`base.mjs` within a build; across builds it rests on the story's migration; a save from the
first preview of Base mode has not been loaded); the story plays as it did (the whole suite). **The hour** is reached
by the recipes, not by a played hour: one of everything takes 62 brick, 54 iron, 22 glass and 30 cement; from
regolith alone 310 hours of works' time, of which the smelter's 162 hours are about 52 minutes of play if it never
stands idle (it does: its batches draw five and a half times the Hab's battery); from ore, silica and clay about 90.

**Open in Base mode (polish unless said):** the salt's lattice ends in blunt prongs; hematite's plates fan from one
centre with sparse beads; the glassworks' furnace and sand bin near-primitive, its glory hole flat, its pane rack not
glass; the glassworks' mirror and the clay close up changed and not looked at again; battery cells read as gas
bottles; silica's pale apron; sulfate's concentric tiers; the tower's guy wires unanchored; the pad tarmac-dark;
smoke from the smelter's cap tip; the quarters' bricks larger than the end wall's and the hatch a flat disc;
everything built spotless; gathering leaves no mark on a boulder; the line saying when the next ship comes needs
judging again under the new premise; map labels crowded and storms unlabelled; no prompt at the airlock at night;
the smelter's task not naming its circuit board; "Find a mineral deposit" not pointing at the map or a rover; the
base at night from above a few glows; no way to cancel placing a building. Not looked into: a green cast over the
whole screen in one walk picture (`base/03-the-numbers`), and a "0 STANDING" count with works standing. From the
premium review: the Base tab and works' sheets (I5), the mode's missing "where" and feedback (I17), weak deposits
(A18). An hour of it has not been played through by hand.

## In motion

**The rover against rocks.** A rock had blocked everything from 0.4 m high, the rover met rocks as a 2 m circle,
and every frame of contact took two thirds of its speed, so it could not build speed to leave. Now each collider
carries its height: the wheels (1.24 m) go over what stands under 0.9 m with a jolt and a twentieth of the speed; a
boulder pushes the body (three circles) out along the ground, costing only what carried it in, by the clock; the
throttle held against one turns the nose off it. On foot the same rule keeps pace along a rock.
`tools/tests/drive.mjs`, on the game's own clock:

| Case | Result |
| --- | --- |
| Open ground, six seconds of full throttle | 104 m |
| A 0.6 m rock under the wheels | over it with one jolt, 103 m |
| A boulder off the flank / dead ahead | slides past (3.12 s against 2.98 s to 34 m) / turned round it (4.2 s), never under 3.8 m/s |
| The same at 30, 60 and 120 frames a second | 3.10, 3.12 and 3.11 s |
| Nose to a boulder, then reverse | 9 m back in two seconds |
| On foot past a rock in the way, four seconds | 19.6 m at 30 fps, 19.4 m at 120 |
| Chryse Planitia at Pathfinder's site (165 rocks, 43 boulders), a minute of full throttle | 1.5 km; the slowest two seconds 17 m |

**A scripted player.** `tools/tests/motion.mjs` walks and drives eleven routes (the base on foot and at a run, a
boulder field at Chryse Planitia, Olympus's flank, Valles Marineris's foot and rim, a night drive, a storm on foot
and driving) and flags no progress, the figure through the ground or hovering, the rover's belly in the ground or in
the air, the camera in the ground, a rock, the rover or the Hab, the rover hidden from the camera (`rover-hidden`) or
far from it (`camera-far`), jumps and snaps, the head not following the camera (`head`), and slow steps (30 ms three
times, 120 ms once) or a main-thread share over 50 ms. Open from its runs: over a sharp crest at speed the wheel plane
stands 0.54 m under the ground for a tenth of a second; against the Hab's wall the rover slides round at about a
metre a second. Step times here say nothing under about 20 ms (the software renderer takes the processor). The heap
grows 2 to 3 MB a second in Chromium (V8 boxing the terrain code's fractions; Safari's engine does not): not chased.

**Frame strips reviewed** (two reviewers, seventeen sheets; one pass; a re-check). At the re-check: on foot NEARLY
(A, was NOT MET; C); the rover NEARLY (A) and "NEARLY, weak" (C); contact NEARLY (A) and **MET** (C); the camera
**NOT MET** (both); work and transitions NOT MET (both); faults in any frame NEARLY (both). The camera's two faults
were fixed afterwards and checked by the scripted player only: down the canyon wall the chase camera lost the rover
(it now stands behind the rover along its slope, at most 2.4 m behind its place and 17.5 m from the rover, and rises
over a hiding crest); turned beside the rover it went through it (a place with something standing between camera and
figure is refused). Also fixed since: the tail glow cut by wedges, the parked rover creeping, a panel cleaned in one
frame, the edge arrow flipping sides, getting out at speed (it pulls up first). Second attempts not reviewed:
getting in (the figure steps to the hull and goes up and in; no climbing clip exists, so if it does not read on the
phone it is a plateau) and the rover's weight (springs working over ground, a squat pulling away, pace lost on a
climb). **Plateaued for code:** a second soft shadow on slopes; no lean or shorter stride on a slope. Polish: footfall
dust as pale discs, footprints in pairs, the storm not changing the gait, a prompt over the shins, a staircase line
where a boulder meets sand.

**The storm and standing still.** The strips had been lying (stepped by hand, the picture's clock did not move), and
"stiff" was a bug: the head turn acted on a mesh named like the head bone, so the head never moved. One pass: the
storm's sheets stream along the wind at three to four times their old pace, layer by layer; the figure leans into the
wind and gusts rock it; the camera sways; standing, the head follows the camera, looks about and now and then reads
the wrist display. Re-check: **the storm moves MET** (about 180 px a second, "no flicker or noise"); acting on things,
the storm as a picture, and standing still NEARLY ("a look, then something done with a hand. That reads as a
person"). Since, seen by no reviewer: layers wander and bend, the weight shifts leg to leg. Open: a hard cast shadow
all through a storm; nothing streaming off rocks; the lean shows only in a cross-wind.

**Light at night, and the horizon.** The two aimable lamps are shared by whoever is travelling (`LAMPS`,
`mountLamps` in `game/player.js`): on foot a wide soft pool and a narrow beam where the player looks; driving, the
rover's wide lamps and a long beam down the road; each stronger with distance; the pool's lamp above and behind the
helmet so some falls on the figure. Re-check (`night-shots.mjs`): light to walk by **MET** on level ground ("a soft
keyhole reaching roughly 30 to 45 m"), NEARLY on a slope; still a night **MET**; the figure at night, light to drive
by (lit stones to 100 m and more) and the horizon NEARLY. Since, seen by no reviewer: the pool aimed lower so the boots
are in it, the rover's lamps reaching its sides, lit stones capped at a sunlit stone's brightness. Left: no lamp
casts a shadow (a second shadow map a frame). The horizon's ruled line across a flat plain is **plateaued**.

**The figure's steps** (17 November). The step sound kept a counter of its own, and the walk was the Run clip at
half speed (the boot 0.37 m up: "high stepping"), because an earlier pass had misread the Walk clip, a bounding gait,
as a short stride. Now a step sounds when a boot comes down, the walk is the Walk clip at its own pace (2 steps a
second at 4.8 m/s, its swing lowered to 0.15 m in `tools/assets/astronaut.py`), and the run is the Run clip from
6.4 m/s. At a stroll a planted boot slides 0.24 m/s, where it skated at 2.3 times the ground. `tools/tests/steps.mjs`
holds the slide, the step count, the lift and silence standing still. Open: the stroll is slow and floating (a new
clip); the first-person bob runs on the old counter; under about 15 fps a footfall at a run can be missed; nobody
has watched it move or heard it.

## Replaced in the move

**The opening film.** Before the move a new game opened on a 24-second film drawn by the game on the player's own
site, telling the old story's evacuation in the storm; it was reviewed and re-checked. In the move it was replaced by
the new opening, with no other people in it: the entry at dusk with two fireballs, Control's voice breaking up,
guidance lost, the capsule hitting and rolling, a card, and the game beginning with Quinn by the wrecked capsule, the
suit leaking and the Hab's beacon 85 m away. Its bar applies unchanged: every line readable at phone size with who
says it, inside the safe areas, no console errors, nothing saved from inside it or left in the scene, and Skip (or
Escape) ending it at once.

**The launch and the ending.** Before the move the ending was a launch followed by a rescue in orbit (reviewed:
NEARLY on all four points; the premium batch took the launch from NOT MET to NEARLY). It was replaced by Quinn's
launch from Arcadia Station (pad, climb, burnout) and a docking with the Tern, dark against the planet's edge, whose
lights come on along its length before its engine lights and Mars falls away; no figures in space, and Quinn's note to
the first crew last. Its bar still applies: one continuous climb, nothing broken in any frame, readable lines inside
the safe areas, no console errors, nothing left in the scene. What the premium re-check left in the old climb (ground
from a few hundred metres up a tan smear; a small rocket over a small ball) is to be judged again in the new one.

**Reaching Earth.** Before the move Earth was reached through an old lander revived as a radio. It became the
Earth-link, built at the Hab from a dish, an amplifier and a pointing drive salvaged from three dead landers, with
first contact when the third is fitted. The interface bar applies: lines readable inside the safe areas, no console
errors, and the journal and task card always saying where the next part is and how far.

## Baked lighting and the built objects

**Props sit in the ground** (`tools/build_contact.mjs`, `contactPatch` in `world/build.js`): for each of 40 outdoor
models the bake sums its shadow from 128 sky directions into a 64 px tile laid under it as a soft patch. Nothing lower
than 7 cm counts as shading the ground; the shrinking soil heap has none. **The Hab's lamps are baked** into its
interior's vertex colours (`bake_light` in `tools/assets/lib.py`: 0.7 where no lamp is seen, 1 in a pool). **The
built objects:** the greenhouse's frame thinned, a made vent for its cap, its panes more solid, the dark band at its
door removed; the rover's panes tinted and mirroring; the old ship's ring rounded; the soil heap in twice the columns.

Re-check: the greenhouse **MET**; the ship's ring **MET** (the new ending shows the Tern, to be judged in its review);
the Hab's interior NEARLY; the rover's windows, the soil heap and props' contact NOT MET (the last "NEARLY with the
heap patch removed", which was a bug of the pass, since fixed). Second and last attempts, seen by no reviewer: the
heap's dug face **plateaued** (each spade cut is a flat face; it needs scoops modelled); the rover's window
**plateaued** as judged from the one side view; contact patches lifted where slight. Left: weak shade under the Hab's
tables; the figure pink under a grow light in one view; a rimmed disc under it indoors; two floor stains.

## Sharpness and the frame rate (item (g))

On the owner's phone (932 x 430 points at three pixels to the point, of which the game uses two at most) "medium"
draws 1.6 to the point when it can (1491 x 688) and steps down toward 0.88 (820 x 378). Built in one pass: **a frame
rate setting** (Settings, Display: 60 or 30; at 30 the resolution may rise to two pixels to the point; 40 is offered
only where the screen gives 100 frames a second or more, since on a 60 Hz screen it judders); **a hitch no longer costs
resolution** (each second is judged without its worst few frames; the phone's 51 fps average with a 765 ms worst frame
works out at about 57 between half a dozen hitches, an inference from one report); **the stretched picture firmed
up** in the final pass (`uSharp`, more the smaller it is drawn); and **fuller diagnostics** (four taps top left,
`ui/diag.js`: the game's own frames, the rate held to, what the screen gives, long frames, the main thread's share,
resolution changes). `sharp-shots.mjs`: the step that matters is from 0.88 to 1.6. Not known: what the phone reaches
at 30, and whether it holds 1.6 at 60; both need its own report.

## Wear (item (f))

**Paths** (`game/wear.js`, `uWear` in `render/terrain-material.js`): the ground round the Hab is mapped (160 m square,
five eighths of a metre a cell); every metre walked or driven wears it darker, packed and without ripples (twenty
crossings make a path; the rover's ruts show after one pass); a storm fills them slowly; the map is saved, run-length
coded, and older saves load without it. **Dust that deepens** (`dustAge`): dust on Quinn's own things settles over
thirty sols, and a storm lays a coat that wears off over four; old landers do not change. Seen by me, reviewed by
nobody else. Left: dirt in props' creases, a furrow behind a dragged thing, paths away from the Hab.

## The rover from the driver's seat

| | Point | Bar |
| --- | --- | --- |
| K1 | The view | From Quinn's eyes in the seat; the cab still and Mars moving in the glass; at rest the horizon in the upper half, the bonnet and wipers under it, the display and the top of the wheel along the foot; a drag looks round as far as a seated person can turn, with no head in the way and no hole in a wall |
| K2 | The cab | Reads as this rover's inside: a dashboard wall to wall, instruments, a wheel in Quinn's hands, seats, framed windows, fittings overhead and behind; nothing a bare box |
| K3 | Instruments | The true speed, heading, drive setting, power and air, readable at phone size; the hands go with the steering |
| K4 | Light | By day darker than Mars with parts told apart; at night dim, lit by its own lamp and screens, the road lit, the headlamps not lighting the cab; a low sun through the glass; a storm outside the glass |
| K5 | On the phone | One tap in and one out; the button found untold; a new driver told once; the quiet HUD under its bar at all three phones |
| K6 | The change | Never the inside of a wall, a tank or the driver's seat |
| K7 | Cost | No light and no pass added to an ordinary frame; the cab's fittings under 9,000 triangles |

**What was built.** A seat camera at the figure's eyes, fixed to the sprung body, resting 11.5 degrees down with a
wider lens, the head turning 112 degrees each way (`seatCamera` in `game/rover.js`). The cab rebuilt round a driver in
the middle (`cabin`, 8,226 triangles; `tools/assets/vehicles.py`): pillars 34 degrees off, a wall-to-wall dash, a
wide display in a hood, side screens, desks, a harnessed seat, an overhead console, wipers parked on the sill. A true
display (`drawDash` in `world/models.js`, drawn after the task card so the two agree). The yoke turned by the
steering with the Drive clip held to match (`holdDrive`). The cab's light as a shader term, not a light. Glass from
the seat drawn by a few lines of its own (`paneView`). In a storm, from the seat only, a mask keeps the veil off the
cab (`cabMask` in `render/engine.js`), the only added pass. VIEW above EXIT while driving; a blink of a tenth of a
second for the change. A fault of mine, caught before publishing: the switch giving the driving display its whole
picture shadowed a variable, so every monitor showed all four panels; `drive.mjs` now checks it.

**Reviewed and re-checked** (one reviewer, 25 then 27 pictures): K1 NEARLY, "one clause short" (no bonnet or wiper in
sight: they are below the instruments' line of sight); K2 **MET**, "just"; K3 to K6 **MET**; no blocker. "As it stands
this is a cockpit view a solid indie release could ship." Open: the nose and wipers out of sight; the side screens
set dressing; plain pillars a third too wide; the storm's banded sky (the storm's own); getting in a blink, not a
climb; the HUD's compass and card repeating the display; the controls over the dashboard and the cab's sides and
ceiling as greybox (premium I12, A10); the seat view's cost in frames on a phone.

## Against a higher bar: a high-end indie or premium mobile release

The owner asked (16 November) for one picture and one interface review held to "a high-end indie or premium mobile
release", by fresh reviewers given the bar and not past findings, every finding marked CODE or SOURCED ART with an
effort and an impact. These verdicts do not change the bars reached under the indie standard. Both reviewers were
told how the game is made (nothing bought or scanned, procedural textures, scripted Blender models with per-vertex
colour and occlusion, the interface in HTML and CSS).

**The interface** (844 x 390, 162 pictures; yardsticks The Long Dark, Subnautica, Alto's Odyssey): **NOT MET**, "a
clean, consistent, well-written solid-indie interface"; the sheets, the Base screens and the absence of authored art
are below the standard. Layout, legibility, visual design ("a tidy kit with no art direction"), the first ten
minutes ("closest to MET"), the sheets and Base mode ("low") NEARLY; wording NOT MET; the HUD in play and emergencies
NEARLY. After the first batch: wording NEARLY, the HUD in play **MET**, emergencies **MET**, legibility NEARLY.

**The pictures** (121 pictures; yardsticks Journey, Sky: Children of the Light, Astroneer): **NOT MET**, "the best
twenty pictures would pass as a high-end indie release. The set as a whole would not." The storm and the ice NOT
MET; the launch NOT MET (NEARLY after the batch, since replaced); day, dawn and dusk, night, orbit (the title MET),
landmarks (Valles Marineris MET at distance, Olympus not), terrain, models ("the same matte paint"), the astronaut,
interiors and Base mode NEARLY. At the re-check "artefacts" were graded on their own: NOT MET (about a dozen small
faults). At the standard already, by their account: the cold open, the quiet HUD, the journal's way home, the
writing; the rover and Hab outside, the Hab inside, the greenhouse at night, the cab's dashboard, the title's globe,
Valles Marineris at distance, ripples under a low sun.

**The code-fixable findings, by impact, and their state.** "Part" means code gets part of the way. The first batch
was ten findings, one pass and one re-check each; the storm, ice, materials and sourced art were left out.

| Impact | Effort | # | What | State |
| --- | --- | --- | --- | --- |
| high | small | A5 | A graded daytime sky | **GONE** (`render/sky.js`) |
| high | small | A9 | Colour at dawn and dusk | PARTLY: the glow blue, the low light warm; the sun a small pin, no warm light facing it |
| high | small | I2 | One name for each thing | PARTLY: the big double names gone; about thirteen small ones left (BATTERY and ROVER O2 against the cab's POWER and AIR; TASKS, MISSION and "to do"; SAMPLES and FIELD SAMPLES; "saved run" and "saved game"; MENU for PAUSED; "Scrap Metal" and "scrap"; the launch sol written two ways) |
| high | small | I4 | The task card puts itself away | **GONE** (`card-open.mjs`: 4% of a drive, 0% of a walk) |
| high | medium | A1, A2 | The launch's climb; the rescue's staging | replaced in the move |
| high | medium | A3 | The storm as weather (more than medium: the veil knows no depth) | not started |
| high | medium | I3 | Emergencies that say what to do | PARTLY (see "The quiet HUD") |
| high | medium | I5 | The Base tab and works' sheets | not started |
| high | medium | I6 | Larger secondary type | PARTLY: one step up and lighter; two or three steps wanted, which means re-fitting sheets |
| high | medium, part | A6, A8 | Ground and rock variety; the figure lit by the scene and its shadow | not started; no shadow at all in `night/dusk-plain` is a bug to find |
| high | large, part | A4, I1 | Materials that read as foil, glass, metal; pictures of items from the game's own models | not started |
| medium | small | A13 | Night floodlighting | PARTLY: the dome fixed; the smelter's cone bright, a few near-white rocks |
| medium | small | A17 | Eight small artefacts | three gone, one part; left: a ladder mark in the rover's shadow, the headlamp patch's hard edge, the wreck's pebbles and blot, the far canyon wall ("possible") |
| medium | small | A18, I8 to I11, I13, I14, I16, I18, I19 | Base deposits; new things piling up early; the first hold unexplained; the target arrow; the top-centre stack; two HUDs; settings; the map's scale text; the grey ring; small targets | not started |
| medium | medium | A10, A12, A14, I7, I12, I17 | The cab's sides; Olympus; lift-off effects; lists at the fold; the cab view's controls; Base's "where" | not started |
| medium | medium, part | A7, A11, A15, A16, I15 | Ice; canyon walls close up; boulders; plants and the bare head; the ending and dawn sheets | not started |
| low | small, medium | A19, I20 to I27 | The heap; small wording; photo mode | not started |

**Sourced art**, by their account: hand-keyed animation for the idle and walk; scanned detail normals and decals;
scanned ground, rock, cliff and ice; a sculpted head and plants; a drawn icon family of about sixty, key art for title,
ending, death and dawn, a display face and authored motion. No finding needs sourced art alone. The sky and the
emergencies were where one pass did the whole job; the ice, the figure's shadow and the ruled horizon have been tried
before and may be worth less than their marks; twenty-five of the twenty-seven interface findings are code alone.

## Open items

| # | Item | State |
| --- | --- | --- |
| 43 | **The story's films, re-authored in the move**: the opening film, the comms beat (the Earth-link's first contact), the launch and the docking with the Tern, and the ending | **reviewed once** (19 November, stills at iPhone size, an independent reviewer against the bar): told NEARLY for the opening and NOT MET for the ending, "reads at once" NOT MET, "nothing broken" NOT MET. **Fixed after it**: Mars now sinks out of the picture as the Tern burns (it grew while the log said it was getting smaller), and her plume stays in shot; her lamps are halos along her length (they were dim dots, then half-domes cut by bands); notices wait out a film (a card stood over the launch); the aurora is cut (a corner smudge); the log's CONTROL label no longer runs into its line, and Control's lines no longer say "Control:" twice; the handover's notes fill its left column on a phone. **Still open**: in the opening the capsule's fireball, low on the horizon, can read as the setting sun; the wreck is the debris model, a dark curled shell, and does not read as a capsule (a capsule-wreck model is wanted, `tools/assets/`); the approach to the Tern is dark against black sky, not against the planet's lit edge; the morning after the film shows no wreck; "ORBITER" in the sheets' headers is the difficulty but can read as a place; the films' lines are set two ways (the opening's centred, the launch's in the log); a letter's "ADEYEMI, from Earth —" reads like a formatting leak to a newcomer. Not yet watched moving on a phone or heard |
| 44 | **The Hab's music**, now "the test loop": the one audio file the outfitting contractor left on the Hab's system. The synthesised track itself is the one the game had; it was renamed and reframed in the move, with no word of the old framing left | **open**: not heard on speakers or a phone since (item 15) |
| 31 | **The owner's iPhone.** The preview first failed at startup: the elevation loader filled a buffer of the stated length, GitHub Pages states the compressed length, and the fallback re-read a download Safari was already reading | **confirmed fixed on the phone** (starts, no errors, 60 fps on an old build). Nobody has looked at the phone's picture or layout with the bar in hand on a current build |
| 10 | Frame rate on a real phone and laptop | the phone measured on an old build only; to measure again on the current one, at 60 and 30. Laptop not measured |
| 11 | WebKit and iOS checks | blocked: only Chromium in sessions; needs the owner's phone |
| 15 | Listen to the audio on speakers and a phone; retune by ear | blocked on a listener; nothing has been heard |
| 12 | Publish to `gh-pages` | **Published and served.** `gh-pages` holds the build of 20 November (`fec9002`, built from `90f8a5d` of the working branch; cache `mg-d77108870246`, 70 files, 15.3 MB), begun as a branch of its own with no history of the code's, and served at https://awright22.github.io/mars/ since the repository was made public on 22 November. Loaded there at iPhone size and walked through (title, opening, first contact, a letter, the ending): no console errors. The redirect for the old address is on workos-test-app's `gh-pages` (`tools/old-address/`, pushed 22 November) and worked while served; that repository was then made private, so its Pages are off and the old address answers 404. A copy of the old game added to a home screen keeps running from its own offline cache (its worker's update finds nothing and it stays), and cannot hand its save over unless the old address is served again for a visit Publish only from a commit whose whole suite passes |
| 37 | **The quiet HUD on the owner's phone** | closed under the bounds. For the owner: the sol and clock beside the dial or on the buttons' row (one menu button would make room); whether it suits in play |
| 38 | **The owner's direction of 15 November** | every item passed and re-checked. Open: two motion fixes seen by nobody but me (getting in, the rover's weight); props' contact second attempt unreviewed; the heap and the rover's window plateaued; wear reviewed by nobody else; whether the 30 fps setting suits the owner (the phone's diagnostics) |
| 45 | **The interface after the tenth review** | see "Interface reviews": the direction arrow first, then rows fitted to the fold, untaught gestures, wording, finish |
| 46 | **The pictures after round 11** | see "Picture reviews"; ice, lava and rock surfaces, the wreck and the figure's shadow plateaued |
| 47 | **In motion, left** | the belly over sharp crests; the slow slide along the Hab's wall; the second shadow and the slope lean (plateaued); footfall dust, footprint pairs, the prompt over the shins; the storm's cast shadow; no lamp shadows |
| 39 | **The driver's seat** | K1 NEARLY, the rest MET; open list under its section; its frame cost on a phone |
| 42 | **The figure's steps** | fixed and measured. Open: the owner's eye and ear; a slow-walk clip; the first-person bob's counter |
| 40 | **The premium-bar audit** (46 findings) | ten acted on (two GONE, the rest PARTLY or replaced); the storm, ice, materials, sourced art and the rest not started |
| 26 | **Base mode polish** | the list under "Base mode"; the green cast and the "0 STANDING" count not looked into; an hour not played by hand |
| 23 | A desktop-only interface review | low priority: the desktop is a bonus |
| 17 | More depth: uses for a second greenhouse; landers that offer more than salvage | part done: eleven sights to stop and watch, and photographs of the landers for the science team's archive |
| 13 | Shadow cost at the base: the rover (45k triangles) and the Hab are in both cascades; "low" sits on its call budget there | open: simplified shadow models would halve it |
| 6 | Regional variety: landmarks particular to a site (Gale's mountain, Jezero's delta); more than a ruled horizon | open |
| 27 | Rocks: past about 170 m distant boulders can float or sink by decimetres (a coarser mesh than they were seated on); the shade under far rocks does not lengthen at a low sun; close up a rock is soft (128 px a shape) | open |
| 19 | The astronaut: a plain face under a metre; simple head and hands close up (six-sided fingers, a flat band of hair); the half-curled fingers are fixed, so a wave is half-closed | part done: fingered gloves, an unmirrored stance, a bare head, a curved-mirror visor, dust on boots and legs, the hands on the yoke |
| 20 | Elysium Mons and Hecates Tholus have no caldera (a texel or two in the elevation data) | open |
| 14 | Asset tooling: fold the helpers the model scripts each copied into `tools/assets/lib.py` | open |
| 24 | Interface tests sensitive to load: a long test lets the suit drain and the log fill, and two layout checks then fail on overlaps a short test never reaches | open: the overlaps are real; the tests should set their own state |
| 48 | **The Tern's window** is told in the story (it closes just after the launch sol), but launching later still works: no deadline is enforced | **open**: a decision for the owner, whether a missed window should end the run |
| 49 | **Saved games as text** (Settings, Saved games) and the old address's copy step | tested in Chromium (tools/tests/save.mjs); **open**: on the owner's iPhone, a home-screen copy at the old address and one at the new |
| 50 | **The photosensitivity bar**: a notice on first launch; full-screen flashes rate-limited to one in 0.4 s (`ui/dom.js`, `ui/photo.js`); the large glows of the launch and the opening vary smoothly under 3 Hz (`game/launch.js`, flicker) | met as built; **open**: no measured check over a whole run (a frame-luminance test would make it one) |

## Decisions worth knowing

**The page and the build**

- **Outputs are committed** (`game/game.js`, `terrain-worker.js`, `game.css`, `sw.js`, from `tools/build.mjs`). The
  worker's cache name is a hash of every shipped file, so any change reaches installed copies.
- **The page checks its own build.** `index.html` is stamped with its build and fetched from the network when it can
  be; if the offline copy's build differs, the old copy and its worker are dropped (`tools/tests/update.mjs`). A worker
  whose install failed on one dropped request had once kept the owner's phone nineteen builds behind. The worker's
  install does not fail for one missing file of the planet's data.
- **The resolution governor climbs as well as falls.** After a run of on-time seconds it tries a step up, doubling
  its wait each time that brings late frames back, and it judges each second without its worst few frames.

**The world**

- **Terrain is real.** NASA MOLA elevation (MEGDR, 32 px/deg) on six 1024-texel cube faces, Viking MDIM 2.1 colour,
  relief exaggerated 4x, procedural detail below about 40 m scaled by the real roughness. The planet is at 1:282.
- **What you stand on is what is drawn.** `surfaceAt` (`planet/surface.js`) returns the height of the triangle the
  finest mesh draws (`meshPoint` in `terrain/chunk.js`); physics, the camera, wheels, rocks and placed objects use it.
  Sites are levelled in the height function, not by moving meshes.
- **Each terrain square is cut along its own grain** (the diagonal whose ends are nearer in height), and ledges and
  flow edges are never drawn narrower than two to three cells. A height function that jumps draws as a saw.
- **Every detail period divides 64 m**, the texture coordinates' wrap (the crag layer runs at 12.8 m, not 12).
- **Level ground uses 2D textures, slopes 3D ones** (only 2D filters anisotropically at grazing angles; volumes cannot
  smear on a cliff). Only grit is painted: anything bigger is geometry.
- **Rocks, dust and soil take their colour from the ground**: stone a darker, greyer local colour; dust and heaps
  (`ground_dust`) the ground's own. Dark ground is grey basalt sand (`groundGrade`), not maroon.
- **A rock is a ball with a surface laid over it.** `world/rock-shapes.js` builds twenty-six jointed shapes into a
  texture array of distance and normal; the shader pushes a ball's vertices onto the surface and its nearest arris,
  so 80 triangles have corners and new shapes cost no draw calls. Each seats where it stops overhanging its foot. On
  foot a rock is a boulder (40 cm and up, a collider), a stone (under 22 cm, sunk under the boots) or a plate. Rocks
  cast from their sunlit faces. `rocks.js` copies the ground shader's ice and lava tests: change both together.
- **Steep ground is spur, chute and foot.** Above about one in four the height model adds ridges down the fall line
  in three sizes (150, 56, 21 m), as high as their reach times the slope (`_gully` in `planet/height.js`); vertices
  carry their depth in a gully (`aChute`), drawn as bedded rock on spurs and bedless scree in chutes; boulders gather
  within sixteen metres of steep land.
- **A wall's beds are relief, not paint** (`bedRise`, `bedCut` in `render/terrain-material.js`), and its hard beds
  are jointed with the clinker texture laid from three sides. Laid evenly it was dried mud.
- **Volcanoes are flow on flow** (`planet/volcanoes.js`): lobes and leveed channels from each caldera, clinker on bare
  lava (`clinkerTexture` in `render/detail2d.js`, read only where there is lava), pressure ridges across the flow
  (`lavaSummit`). Calderas are cut level from the largest closed hollow in the data (Olympus, Ascraeus, Pavonis, Alba;
  Arsia by eye) into a frozen-lava floor inside a cliff with a scree foot.
- **A polar cap is drifts on ice** (`sastrugiTexture`): packed white snow where a drift lies, glossy blue ice with
  thin cracks in broad windows. **Ice is painted darker and bluer than ice is**, because the exposure is set for red
  ground and anything paler washes to white. The outcrop is a ledge broken into flat-faced slabs, frosted at their
  edges, banked in drifted soil, with six loose blocks to take.
- **Tried and dropped: finer mesh on steep land from further off** (no visible change for half again the triangles;
  far walls lack a caprock and talus, which the height model does not make).
- **East is east** (`tangentBasis` in `planet/geo.js`; `sights.mjs` checks the compass against the pole and sunset).
- **Stains and pools of light are draped** on the drawn ground (`drape` in `world/build.js`), or rising land cuts
  them along a hard line.

**Light, air and the sky**

- **Haze is to scale and knows height** (`airHaze` in `render/engine.js`, replacing three.js's fog for every
  material): clear-day density 0.0019, thinning with height (scale height 180 m), summed exactly along the line of
  sight, extra within a degree of the horizon past a hundred metres, linear as well as squared. `fogNear` carries the
  density and `fogFar` the horizon's dip, set each frame in `main.js`. Near haze is the ground's dust colour and far
  haze the sky's; the air lies thicker in a deep (`fogDeep`, up to 2.3 times).
- **A low sun is not a stronger sun.** The sun rises to 1.3 times at the horizon and the sky's light by up to 2.3
  (at 2.2 times for the sun, slopes facing it were lit two to three times as level ground). Low sunlight is warm.
- **The day sky is three tones** (`render/sky.js`), paler toward the sun; under a low sun the sky round it is blue in
  place of the brown, with a rose belt beyond; the sun is drawn larger than true, most when low. The day sky thins by
  line of sight, so a climb darkens it from the top down.
- **Ground seen from height keeps its own sky's light** (`uSkyLit`), since above the dust the camera's sky is black.
- **Two shadow cascades** split at 10 to 18 m, the near one so the astronaut's shadow has a figure's shape; sealed in
  the Hab they serve the ceiling light. Shadow bias is mostly along the surface normal.
- **What is turned from the sun is in shade**: what is built takes seven tenths less sky light on faces turned from
  the sun, a cool fill brighter on top, and a rim light that grows as the sun sinks.
- **Lamps are pooled and are not true lamps.** A small pool of real lights (`world/lamps.js`) goes each frame to the
  sources nearest the camera; adding a light rebuilds every shader and stalls a phone, so nothing adds one. Lamps
  hardly fall off and end at a set reach; what they add to a model is capped (`capLocalLights`), with a shoulder
  above a third of white after dark.
- **Exposure is metered**: it opens as the sun sinks, closes into a low sun, and eases over about a second.
- **A storm's veils are the colour of its haze.** The veil is laid over the finished picture and knows no depth,
  which is why the storm is the weakest thing drawn and dust by distance is more than a tuning pass.
- **Glass is seen by what it does to light** (`glass_clear`): clear looked through, mirroring looked along, with a
  lit film of dust.
- **Furniture shades the Hab's floor from a mask** (`world/floor-shade.js`): a 512 px top-down mask of what stands
  within 1.25 m of the floor, its blurred mips laid on the floor.

**The figure and the camera**

- **A packed model is unpacked before the dust shader sees it** (`mergeSkinned` in `world/models.js`): skinning
  ignores the scaling node, so the shader saw positions thousands of units tall.
- **What is added to a bone is reset every frame** (`PROC_BONES` in `game/player.js`): the mixer writes a bone only
  when its clip changes, so a lean or glance was added again on every still frame.
- **The head looks, the chest does not**: a twentieth of the camera's tilt goes into the chest, half into the head.
- **Out of doors the camera rides over the ground**: walls shorten its boom, a slope behind swings it up (up to twenty
  degrees to see the boots past a rise). It refuses a place inside anything that blocks walking or with something on
  the ground between it and the figure. Behind the rover it follows the rover's slope and rises over a hiding crest.
- **The helmet is on the instant the air is in doubt**, and off about a second after Quinn is in the Hab, a dome or
  the rover's cabin.
- **Mars gravity is real** (3.72 m/s2). The Walk and Run clips are bounding gaits made for 5.1 and 9.2 m/s; a step
  sounds when a boot comes down.

**The films**

- **A film is drawn by the game and changes nothing** (as built before the move; the new films use the same
  machinery). No video file: the player's own site and the game's own models. Hour and weather are set and put back;
  nothing is saved from inside it; its props are removed; its lamps are borrowed from the pool. Sight lines are worked
  out for the random site, and it waits on black for the ground's tiles. Words stand at the foot with the speaker,
  a radio click and a copy in the log; no voices. A continued game does not play it; `?nofilm` skips it (every test
  but its own does); "reduce motion" stops the shake. `wakeOnGround` gets the figure up under the game's control.
- **Launch smoke and flame are shapes, not particles.** The column is one volume shaped on the graphics card from
  when the rocket passed each height, thinning as the air does (none above 950 m); puffs only for the dust skirt; the
  flame nested shells whose outer plume gives out with the air. Cameras stand on the sun's side, raised over dunes.

**The game**

- **A sol is eight minutes**; the launch sols are 15, 25 and 35 (FLYBY, ORBITER, LANDER); a tank is about six
  minutes' walking.
- **Samples are identified by place**: a bag's contents are fixed by its coordinates, so the catalogue is a reason to
  travel.
- **Morale never kills**: it changes how fast Quinn works and mends (about a fifth either way); variety on the plate
  holds it, and a cooked dinner, letters, music, a harvest or a new find lift it.
- **A bed asks what to plant**, with each crop's pace and thirst on its card.
- **A refusal says what is wanting and what to do**, or is not shown.
- **Photo mode's looks are in the final pass**, so the saved file is the screen, redrawn at full resolution.
- **Comforts are one model** (`hab_comforts.glb`, a part per comfort, shown or hidden).
- **The sol turns at dawn at the Hab**; local clocks elsewhere differ.
- **The rover reaches its listed top speed**, so the drivetrain upgrades count; its speed is the game's own on a
  scale-model planet.
- **A greenhouse is a place**: it levels its site, has walls, a doorway and a door, faces the astronaut when set
  down, and saves keep its bearing.
