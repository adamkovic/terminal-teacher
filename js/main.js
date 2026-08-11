// ============================================================
// Terminal Teacher — app flow
// title → OS pick → lesson map → lesson / fun zone
// ============================================================

import { Terminal, makeFS, OS_META } from './terminal.js';
import { getTiers } from './data/lessons.js';
import * as mascot from './mascot.js';
import * as progress from './progress.js';
import * as sound from './sound.js';
import { mountDesktop, startClock } from './windows.js';

const $ = (sel) => document.querySelector(sel);

const OS_LABELS = { linux: 'Linux', macos: 'macOS', windows: 'Windows' };

const app = {
  p: progress.load(),
  os: null,
  fs: null,            // one virtual filesystem per session (per OS)
  tiers: [],
  lessons: [],         // all tiers, flattened, in play order
  term: null,
  lesson: null,
  stepIdx: 0,
  funTerm: null,
};

// ---------- screens ----------

const SCREENS = ['title', 'os', 'level', 'map', 'lesson', 'fun'];
function show(name) {
  for (const s of SCREENS) $(`#screen-${s}`).hidden = (s !== name);
  $('#hud').hidden = (name === 'title' || name === 'os');
  $('#taskbar').hidden = (name !== 'lesson' && name !== 'fun');
  mascot.reclamp();                 // taskbar may have appeared under Byte
  window.scrollTo(0, 0);
}

// ---------- OS detection ----------

function detectOS() {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'windows';
  if (/Macintosh|Mac OS/i.test(ua)) return 'macos';
  if (/Linux|CrOS|X11/i.test(ua)) return 'linux';
  return null;
}

// ---------- HUD ----------

function refreshHUD() {
  $('#hud-xp').textContent = app.p.xp;
  $('#hud-streak').textContent = progress.currentStreak(app.p);
  $('#hud-os-name').textContent = app.os ? OS_LABELS[app.os] : '?';
}

// ---------- OS picker ----------

function initOSScreen() {
  const detected = detectOS();
  const msg = $('#os-detect-msg');
  if (detected) {
    msg.innerHTML = mascot.format(
      `Byte peeked at this computer... it looks like you're on **${OS_LABELS[detected]}**! ` +
      `Learn that one, or pick a different system to explore.`);
  } else {
    msg.textContent = `Byte couldn't tell what computer this is — pick whichever you like!`;
  }
  for (const card of document.querySelectorAll('#screen-os .os-card')) {
    const isDetected = card.dataset.os === detected;
    card.classList.toggle('detected', isDetected);
    card.querySelector('.os-flag').hidden = !isDetected;
    card.onclick = () => chooseOS(card.dataset.os);
  }
  mascot.showMascot();
  mascot.say('inspecting', detected
    ? `Sniff sniff... this smells like a **${OS_LABELS[detected]}** machine! 🐾`
    : `Hmm, a mystery machine! Pick any system — they're all fun.`);
}

function chooseOS(os) {
  app.os = os;
  app.fs = makeFS(os);                    // fresh sandbox for this session
  app.tiers = getTiers(os);
  app.lessons = app.tiers.flatMap(t => t.lessons);
  app.tier = null;
  progress.setOS(app.p, os);
  refreshHUD();
  renderLevels();
  show('level');
  const done = app.p.perOS[os].completed.length;
  mascot.say('greeting', done
    ? `Welcome back! Ready for today's exercise? 🔥`
    : `New here? Start with **Beginner** — I'll teach you everything!`);
}

// ---------- level picker ----------

function renderLevels() {
  for (const card of document.querySelectorAll('#screen-level .os-card')) {
    const tier = app.tiers.find(t => t.id === card.dataset.tier);
    if (!tier) continue;                  // "pro" has no tier yet — stays coming soon
    const doneCount = tier.lessons.filter(l => progress.isDone(app.p, app.os, l.id)).length;
    const flag = card.querySelector('.level-progress');
    flag.hidden = doneCount === 0;
    flag.textContent = doneCount === tier.lessons.length
      ? '✔ ALL DONE'
      : `${doneCount}/${tier.lessons.length} DONE`;
    card.onclick = () => chooseLevel(tier);
  }
}

function chooseLevel(tier) {
  app.tier = tier;
  renderMap();
  show('map');
}

// ---------- lesson map ----------

function tierDone(tier) {
  return tier.lessons.every(l => progress.isDone(app.p, app.os, l.id));
}
function beginnerDone() { return tierDone(app.tiers[0]); }
function allDone() {
  return app.lessons.every(l => progress.isDone(app.p, app.os, l.id));
}

function renderMap() {
  const tier = app.tier;
  $('#map-title').textContent = tier.title;
  $('#map-sub').textContent = tier.sub;
  const path = $('#lesson-path');
  path.innerHTML = '';
  let unlocked = true;                    // sequential chain within this level

  tier.lessons.forEach((lesson, i) => {
    const done = progress.isDone(app.p, app.os, lesson.id);
    const node = document.createElement('button');
    node.className = 'map-node' + (done ? ' done' : '') + (!unlocked ? ' locked' : '');
    node.innerHTML = `
      <span class="node-badge">${done ? '✔' : unlocked ? lesson.icon : '🔒'}</span>
      <span class="node-info">
        <span class="node-title">${i + 1}. ${lesson.title}</span>
        <span class="node-desc">${lesson.desc}</span>
      </span>
      <span class="node-xp">+${lesson.xp} XP</span>`;
    if (unlocked) node.onclick = () => startLesson(lesson);
    path.appendChild(node);
    if (!done) unlocked = false;          // only the first unfinished lesson is playable
  });

  // Fun zone lives on the beginner map; unlocks with that path
  if (tier.id === 'beginner') {
    const fun = document.createElement('button');
    const funOpen = tierDone(tier);
    fun.className = 'map-node fun' + (funOpen ? '' : ' locked');
    fun.innerHTML = `
      <span class="node-badge">${funOpen ? '✨' : '🔒'}</span>
      <span class="node-info">
        <span class="node-title">Fun Zone</span>
        <span class="node-desc">${funOpen ? 'Free play! All the secret toys.' : 'Finish the Beginner Path to unlock!'}</span>
      </span>
      <span class="node-xp">∞ fun</span>`;
    if (funOpen) fun.onclick = openFunZone;
    path.appendChild(fun);
  }
}

// ---------- typing practice: paste stays locked until Byte unlocks it ----------

const PASTE_KEY = 'terminal-teacher-paste-unlocked';
const paste = {
  attempts: 0,
  unlocked: (() => { try { return localStorage.getItem(PASTE_KEY) === '1'; } catch { return false; } })(),
};

const PASTE_NAGS = [
  `Whoa there — no pasting! 🖐 Real terminals let you paste, but typing it yourself is how the magic sticks.`,
  `I saw that! 🦝 Your fingers learn the command, not your clipboard. Type it out!`,
  `Nice try! 😄 In here we type. Slow is smooth, and smooth is fast.`,
  `Still no pasting! Every keystroke is a tiny workout for your terminal muscles. 💪`,
];

function onPasteBlocked() {
  paste.attempts++;
  sound.play('error');
  if (paste.attempts >= 5) {
    askYesNo(
      'thinking',
      `It looks like you REALLY want to paste your commands. Real terminals allow it... want me to unlock pasting?`,
      'Yes, unlock it', `No, I'll type!`,
      () => {   // yes
        paste.unlocked = true;
        try { localStorage.setItem(PASTE_KEY, '1'); } catch { /* ok */ }
        mascot.say('laughing', `Pasting unlocked! Use it wisely — and keep those fingers nimble. 😉`);
      },
      () => {   // no
        paste.attempts = 0;
        mascot.say('great-job', `THAT'S the spirit! Typing it out is the way of the terminal master. 🥋`);
      });
    return;
  }
  mascot.say(['inspecting', 'laughing', 'its-ok'][paste.attempts % 3],
    PASTE_NAGS[(paste.attempts - 1) % PASTE_NAGS.length], { ms: 6000 });
}

const pasteHooks = {
  allowPaste: () => paste.unlocked,
  onPasteBlocked,
};

// small yes/no dialog fronted by Byte
function askYesNo(pose, msg, yesLabel, noLabel, onYes, onNo) {
  $('#ask-mascot').src = `assets/mascot/${pose}.png`;
  $('#ask-msg').innerHTML = mascot.format(msg);
  $('#btn-ask-yes').textContent = yesLabel;
  $('#btn-ask-no').textContent = noLabel;
  $('#btn-ask-yes').onclick = () => { $('#ask-overlay').hidden = true; onYes(); };
  $('#btn-ask-no').onclick = () => { $('#ask-overlay').hidden = true; onNo(); };
  $('#ask-overlay').hidden = false;
}

// ---------- lesson engine ----------

function startLesson(lesson) {
  app.lesson = lesson;
  app.stepIdx = 0;
  $('#lesson-title').textContent = `${lesson.icon} ${lesson.title}`;
  app.term = new Terminal(app.os, $('#term-mount'), {
    fs: app.fs,
    onCommand: onLessonCommand,
    ...pasteHooks,
  });
  app.term.onEggDone = null;
  if (lesson.setup) lesson.setup(app.term);   // re-seed files the lesson needs

  show('lesson');                              // visible first, so the area has a size
  const area = $('#screen-lesson .desktop-area');
  const termEl = $('#term-mount .terminal');
  const panelW = Math.min(420, Math.max(330, Math.round(area.clientWidth * 0.34)));
  mountDesktop(area, $('#task-windows'), [
    { win: $('#lesson-panel'), bar: $('#lesson-panel .window-bar'),
      label: '🎯 Mission', x: 14, y: 14, w: panelW },
    { win: termEl, bar: termEl.querySelector('.term-titlebar'),
      label: '>_ Terminal', x: panelW + 36, y: 14,
      w: Math.min(940, area.clientWidth - panelW - 54),
      h: Math.min(600, area.clientHeight - 28) },
  ]);
  renderStep();
}

function renderStep() {
  const lesson = app.lesson;
  const step = lesson.steps[app.stepIdx];

  // progress dots
  const dots = $('#step-dots');
  dots.innerHTML = '';
  lesson.steps.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'dot' + (i < app.stepIdx ? ' done' : i === app.stepIdx ? ' now' : '');
    dots.appendChild(dot);
  });

  const card = $('#step-card');
  const actions = $('#step-actions');
  actions.innerHTML = '';

  if (step.type === 'talk') {
    card.innerHTML = `<span class="talk-label">🦝 BYTE SAYS</span>${mascot.format(step.text)}`;
    const btn = document.createElement('button');
    btn.className = 'pixel-btn primary';
    btn.textContent = 'Continue ▶';
    btn.onclick = nextStep;
    actions.appendChild(btn);
    mascot.say(step.pose || 'explaining', null);
    mascot.setPose(step.pose || 'explaining');
  } else {
    card.innerHTML = `<span class="mission-label">🎯 YOUR MISSION</span>${mascot.format(step.text)}`;
    mascot.setPose(step.pose || 'thinking');
    app.term.focus();
  }
}

function nextStep() {
  app.stepIdx++;
  if (app.stepIdx >= app.lesson.steps.length) {
    finishLesson();
  } else {
    renderStep();
  }
}

const CHEERS = ['Nailed it!', 'Perfect!', 'You got it!', 'Yes!! 🎉', 'Like a pro!'];
const OOPS = [
  `Hmm, that didn't work — but errors are clues, not fails!`,
  `Almost! Read the red text — it's a hint.`,
  `No worries — even pros typo. Try again!`,
];

function onLessonCommand(raw, result) {
  const step = app.lesson.steps[app.stepIdx];
  if (!step || step.type !== 'try') return;

  const matched = step.accept.test(raw.trim());
  const verified = !step.after || step.after(app.term);

  if (matched && result.ok && verified) {
    sound.play('step');
    const cheer = CHEERS[Math.floor(Math.random() * CHEERS.length)];
    const pose = ['good-job', 'great-job', 'proud'][Math.floor(Math.random() * 3)];
    mascot.say(pose, step.success ? `${cheer} ${step.success}` : cheer, { ms: 6000 });
    setTimeout(nextStep, 700);
  } else if (!result.ok) {
    sound.play('error');
    const oops = OOPS[Math.floor(Math.random() * OOPS.length)];
    mascot.say(Math.random() > 0.5 ? 'worried' : 'its-ok',
      `${oops} ${step.hint ? '💡 ' + step.hint : ''}`, { ms: 7000 });
  } else {
    // valid command, just not the mission — encourage exploring
    mascot.say('thinking', `Nice exploring! For the mission: ${step.hint || 'check the panel on the left!'}`, { ms: 6000 });
  }
}

function finishLesson() {
  const { xpGained, streakGrew } = progress.completeLesson(app.p, app.os, app.lesson);
  refreshHUD();
  sound.play(app.lesson.id === 'secret' && beginnerDone() ? 'unlock' : 'lesson');

  $('#overlay-title').textContent = 'LESSON COMPLETE!';
  const msgParts = [`**+${xpGained} XP** earned!`];
  if (streakGrew) msgParts.push(`🔥 Daily exercise done — streak is now **${progress.currentStreak(app.p)}**!`);
  if (app.lesson.id === 'secret' && beginnerDone()) {
    msgParts.push(`✨ The **Fun Zone** is unlocked — and you're ready for the **Intermediate** level!`);
  }
  if (allDone()) msgParts.push(`🏆 You finished EVERY lesson. Legend status.`);
  $('#overlay-msg').innerHTML = msgParts.map(mascot.format).join('<br>');

  const isLast = app.tier.lessons.indexOf(app.lesson) === app.tier.lessons.length - 1;
  $('#btn-overlay-next').hidden = isLast;
  confetti();
  $('#overlay').hidden = false;
  mascot.hush();
}

function closeOverlay(goNext) {
  $('#overlay').hidden = true;
  const idx = app.tier.lessons.indexOf(app.lesson);
  renderMap();
  if (goNext && idx < app.tier.lessons.length - 1) {
    startLesson(app.tier.lessons[idx + 1]);
  } else {
    show('map');
    mascot.say('idle', allDone()
      ? `Every single lesson, done. Go show off in the **Fun Zone**! 🏆`
      : beginnerDone() && app.lesson.id === 'secret'
      ? `Hit **◀ Levels** and try **Intermediate** — real quests ahead! Or go play in the **Fun Zone**! ✨`
      : `See you tomorrow for the next one? Streaks love company! 🔥`);
  }
}

function confetti() {
  const layer = $('#confetti-layer');
  layer.innerHTML = '';
  const colors = ['#ffd23f', '#ff6b97', '#45e0d8', '#7cfc98', '#ff9f43'];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('div');
    c.className = 'confetto';
    c.style.left = Math.random() * 100 + '%';
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = (1.6 + Math.random() * 1.8) + 's';
    c.style.animationDelay = (Math.random() * 0.8) + 's';
    layer.appendChild(c);
  }
}

// ---------- fun zone ----------

function openFunZone() {
  app.funTerm = new Terminal(app.os, $('#fun-term-mount'), { fs: app.fs, ...pasteHooks });
  show('fun');                                 // visible first, so the area has a size
  const area = $('#screen-fun .desktop-area');
  const funTermEl = $('#fun-term-mount .terminal');
  const panelW = Math.min(430, Math.max(340, Math.round(area.clientWidth * 0.36)));
  mountDesktop(area, $('#task-windows'), [
    { win: $('#fun-panel'), bar: $('#fun-panel .window-bar'),
      label: '✨ Fun Zone', x: 14, y: 14, w: panelW },
    { win: funTermEl, bar: funTermEl.querySelector('.term-titlebar'),
      label: '>_ Terminal', x: panelW + 36, y: 14,
      w: Math.min(940, area.clientWidth - panelW - 54),
      h: Math.min(600, area.clientHeight - 28) },
  ]);
  mascot.say('hey-cool', `Free play! Click a card or just type. Try \`sl\`... trust me. 🚂`);
  for (const card of document.querySelectorAll('.fun-card')) {
    card.onclick = () => {
      app.funTerm.run(card.dataset.cmd);
      app.funTerm.focus();
    };
  }
}

// ---------- wire up ----------

const soundBtn = $('#hud-sound');
soundBtn.textContent = sound.isMuted() ? '🔇' : '🔊';
soundBtn.onclick = () => { soundBtn.textContent = sound.toggleMuted() ? '🔇' : '🔊'; };

$('#btn-start').onclick = () => { initOSScreen(); show('os'); };
$('#hud-os').onclick = () => { initOSScreen(); show('os'); };
$('#hud-home').onclick = () => {
  if (app.tier) { renderMap(); show('map'); }
  else if (app.os) { renderLevels(); show('level'); }
};
$('#btn-map-levels').onclick = () => { renderLevels(); show('level'); };
$('#btn-quit-lesson').onclick = () => { renderMap(); show('map'); mascot.hush(); mascot.setPose('neutral'); };
$('#btn-quit-fun').onclick = () => { renderMap(); show('map'); mascot.hush(); mascot.setPose('neutral'); };
$('#btn-overlay-map').onclick = () => closeOverlay(false);
$('#btn-overlay-next').onclick = () => closeOverlay(true);

$('#task-start').onclick = () => { renderMap(); show('map'); mascot.hush(); };
startClock($('#task-clock'));

mascot.enableDragging();
refreshHUD();
show('title');
