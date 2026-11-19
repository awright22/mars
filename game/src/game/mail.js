/*
 * Mail. Once the Earth-link is up, Control, the people behind it, and home write. One exchange arrives at dawn,
 * chosen from those whose moment has come: they answer what Quinn has actually done (a harvest, a storm sat out, a
 * failed machine, a sample nobody expected), so the planet stops being quite so empty. Messages arrive in the log;
 * nothing needs replying to.
 */
import { S, isBase } from './state.js';
import { cheer } from './farm.js';
import { log } from '../ui/dom.js';
import { Snd } from '../audio/sound.js';

const kinds = () => (S.science ? Object.keys(S.science.found).length : 0);
const worst = () => (S.machines ? Math.min(...Object.values(S.machines)) : 100);

/*
 * who: n = Control, w = Quinn, or a person's name (Adeyemi, the flight director; Lindqvist, the capcom; Duarte, the
 * mission agronomist; Mori, the systems engineer; Maren, Quinn's sister; a school class).
 * `when` decides whether the message can be sent; the first unread one that can, is.
 * Order matters: earlier entries win, so the specific come before the general.
 */
export const MAIL = [
  { id: 'welcome', when: () => true, lines: [
    ['n', 'Good morning, Groundwork. Your first call went out live. We have a queue of people who want to say hello; we will ration it to one a morning.'],
    ['w', 'One a morning is about right. The delay makes every conversation a letter anyway.'] ] },
  { id: 'director', when: () => S.sol >= 3, lines: [
    ['Adeyemi', 'Quinn, Ruth Adeyemi. I gave the go for landing with the storm warning on my screen. I have read that call back every night since. You should hear it from me.'],
    ['w', 'Flight, the storm arrived early and the guidance did the rest. I am alive to read your note. Call it even.'] ] },
  { id: 'breach', when: () => S.breach.done, lines: [
    ['Mori', 'Aiko Mori, systems. I watched your pressure come back after that seam let go. The repair is holding inside limits. Please send me a photo of it anyway.'],
    ['w', 'Photo attached. The seam is ugly and it is holding. Logged both for the first crew.'] ] },
  { id: 'crops_dead', when: () => S.breach.cropsKilled, lines: [
    ['Duarte', 'Ines Duarte, agronomy. The beds froze when the Hab lost pressure. Replant today, and rinse the soil again first: the perchlorate does not care what kind of week you had.'],
    ['w', 'Replanting now. Rinsed twice. Noted for the first crew: the beds nearest the seam freeze first.'] ] },
  { id: 'machine', when: () => worst() < 30, lines: [
    ['Mori', 'Your telemetry shows machines well past their service intervals. They were rated for an advance stay of sixty sols with servicing. Service them before they decide for you.'],
    ['w', 'On the list. The maintenance department is one person, and the farm keeps calling.'] ] },
  { id: 'first_harvest', when: () => S.stats.potatoes >= 4, lines: [
    ['Duarte', 'Your first yields are in. Good, for a first bed. You are overwatering the potatoes and underwatering everything else. Plant the radishes; they are fast and they forgive a lot.'],
    ['w', 'Radishes going in. To the first crew: Duarte is right about the watering. Duarte is usually right.'] ] },
  { id: 'storm', when: () => S.stats.stormOut >= 20, lines: [
    ['Mori', 'Your suit logged a long stretch outside in that dust storm. I would like to know why, as your systems engineer and as someone who has to read these logs.'],
    ['w', 'The panels were going under. I stayed within sight of the Hab and I counted my air. Logged, with apologies.'] ] },
  { id: 'devil', when: () => S.flags.devilSeen, lines: [
    ['n', 'The atmosphere group saw your dust devil in the rover camera feed. If one crosses your road again, a pressure reading from the rover would be worth a great deal to them.'],
    ['w', 'If one crosses my road, they get a reading. I am not chasing them.'] ] },
  { id: 'science1', when: () => kinds() >= 3, lines: [
    ['n', 'Three materials catalogued. The science team has started a shared notebook under your name. Every new kind of rock you bag is somebody\'s paper.'],
    ['w', 'Tell them the notes are honest and the handwriting is bad.'] ] },
  { id: 'meteorite', when: () => S.science && S.science.found.meteorite, lines: [
    ['n', 'Quinn, the iron meteorite is older than Mars. The meteorite curators asked us to ask you, politely, to keep it out of the tool drawer.'],
    ['w', 'It has its own shelf now. To the first crew: do not use it as a hammer. I checked; it is a very good hammer.'] ] },
  { id: 'hematite', when: () => S.science && S.science.found.hematite, lines: [
    ['n', 'You found hematite spherules, the grey beads Opportunity found in 2004. Some of her old team watched your analysis come in. Nobody said anything for a while.'],
    ['w', 'Tell them she chose her ground well.'] ] },
  { id: 'lander', when: () => Object.keys(S.salvaged).length >= 1, lines: [
    ['n', 'A note from the agreements office: the landers you are taking parts from belong to the agencies that built them, and each has asked for photographs of anything you remove.'],
    ['w', 'Photographed, serials logged, every part labelled with where it came from. They are getting me home; they get the credit.'] ] },
  { id: 'capcom', when: () => S.sol >= 6, lines: [
    ['Lindqvist', 'Tomas again. I am on the morning shift so I get to read your packets first. Your handwriting is worse on Mars. I did not think that was possible.'],
    ['w', 'Tell the evening shift I said hello, and that you hog the first read.'] ] },
  { id: 'drive', when: () => S.stats.driven >= 8000, lines: [
    ['n', 'You have now driven further on Mars than any rover. Opportunity held that record for fourteen years.'],
    ['w', 'It did it on solar power and patience. I had a heater. Put a note on mine.'] ] },
  { id: 'music', when: () => S.stats.musicTime >= 60, lines: [
    ['Mori', 'The Hab system says the contractor\'s test loop has been playing. It was only meant to check the speakers. I am so sorry.'],
    ['w', 'It is the only music on the planet. I know every bar. To the first crew: you will too.'] ] },
  { id: 'closecall', when: () => S.stats.closeCalls >= 3, lines: [
    ['Lindqvist', 'Three low-oxygen alarms on your suit now. I watched the last one live, all twelve minutes late. Carry more candles. Then one more. For me.'],
    ['w', 'Packed one more, for you.'] ] },
  { id: 'greenhouse', when: () => World_built('greenhouse'), lines: [
    ['Duarte', 'A greenhouse, from salvage, away from the Hab. The spacing is wrong and the light is wrong and it is the best thing I have seen this year.'],
    ['w', 'It leaks a little and grows a lot. Send the right spacing; I will move the beds.'] ] },
  { id: 'home', when: () => !!S.comforts && Object.keys(S.comforts).length >= 3, lines: [
    ['Mori', 'Hab telemetry shows a lighting circuit that is not on any drawing, and the inside camera shows a rug. Should I update the drawings?'],
    ['w', 'Please do. The first crew should know where the good chair is.'] ] },
  { id: 'science2', when: () => kinds() >= 8, lines: [
    ['n', 'Eight materials. Sample-return studies have been costed in the billions to bring back a fraction of what is in your case. The science team would like the case on the Tern.'],
    ['w', 'The case is strapped in by the hatch already.'] ] },
  { id: 'halfway', when: () => !isBase() && S.sol >= Math.ceil(S.rescueSol / 2), lines: [
    ['Adeyemi', 'Halfway to your launch sol. The propellant plant is on its curve. The Tern is healthy. I will not promise you anything; I will tell you the numbers every morning.'],
    ['w', 'Numbers every morning is the best promise there is, Flight.'] ] },
  { id: 'tern', when: () => !isBase() && S.sol >= S.rescueSol - 4, lines: [
    ['Lindqvist', 'Four sols to launch. The Tern is lit up in our tracking like a lamp. When you dock, I am on the console. First thing you hear will be me.'],
    ['w', 'Then the first thing you hear will be me saying the seal took. See you on the other side of the window.'] ] },
  { id: 'mav', when: () => S.flags.mavRevealed, lines: [
    ['n', 'The ascent vehicle reports full tanks. The Tern\'s window is open. It is a long drive to Arcadia: service the rover, take every candle you have, and bring the samples.'],
    ['w', 'Rover serviced, candles packed, samples strapped down. And Greg. Greg is a rock. Greg is coming.'] ] },
  { id: 'family', when: () => S.sol >= 8, lines: [
    ['Maren', 'It is Maren. They let me send one. Mum keeps the news on all day with the sound off, watching the little map with your dot on it. Come home and be boring.'],
    ['w', 'Tell Mum the dot is fine and the dot misses her. Boring is the plan.'] ] },
  { id: 'quiet', when: () => S.sol >= 9, lines: [
    ['A school class', 'Dear Quinn, our class voted on a question. The question is: is it lonely? We also want to know what the dust smells like.'],
    ['w', 'Sometimes. Then the sun comes up over ground nobody has walked on, and I go and walk on it. The dust smells like a struck match. Thank you for writing.'] ] },
];
/**
 * Letters renamed in the move to the game's own story are new letters, and arrive again in their new form; game/save.js
 * carries over the read marks of those whose ids stayed.
 */
// World is imported lazily: mail must not pull the whole world builder into its own tests
let WorldRef = null;
export function bindWorld(World) { WorldRef = World; }
function World_built(kind) { return !!(WorldRef && WorldRef.builtMeshes.some((b) => b.kind === kind)); }


/** The next exchange whose moment has come, or null. */
export function nextMail() {
  if (!S.link.connected) return null;
  const read = S.mail || (S.mail = {});
  for (const m of MAIL) {
    if (read[m.id]) continue;
    let ok = false;
    try { ok = !!m.when(); } catch (e) { ok = false; }
    if (ok) return m;
  }
  return null;
}
/** Deliver one exchange into the log (called at dawn). Returns its id, or null if there was none. */
export function deliverMail(delay = 14000) {
  const m = nextMail();
  if (!m) return null;
  S.mail[m.id] = 1;
  cheer(4);                                              // word from home
  let t = delay;
  for (const [who, text] of m.lines) {
    setTimeout(() => {
      if (who === 'w') log(text);
      else { log(who === 'n' ? text : `${who.toUpperCase()}, from Earth — ${text}`, 'control'); Snd.play('nasaMsg'); }
    }, t);
    t += 5200;
  }
  return m.id;
}
