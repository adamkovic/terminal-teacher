// ============================================================
// Progress: XP, per-OS completed lessons, daily streak.
// Stored in localStorage so it survives between visits.
// ============================================================

const KEY = 'terminal-teacher-progress-v1';

function today() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

function yesterday() {
  const t = new Date();
  t.setDate(t.getDate() - 1);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

function blank() {
  return {
    xp: 0,
    os: null,
    streak: { count: 0, lastDate: null },
    perOS: { linux: { completed: [] }, macos: { completed: [] }, windows: { completed: [] } },
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const p = JSON.parse(raw);
    return { ...blank(), ...p, perOS: { ...blank().perOS, ...(p.perOS || {}) } };
  } catch {
    return blank();
  }
}

export function save(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode etc. */ }
}

export function setOS(p, os) { p.os = os; save(p); }

export function isDone(p, os, lessonId) {
  return p.perOS[os].completed.includes(lessonId);
}

// Returns { xpGained, streakGrew } for the celebration screen.
export function completeLesson(p, os, lesson) {
  const first = !isDone(p, os, lesson.id);
  if (first) p.perOS[os].completed.push(lesson.id);
  const xpGained = first ? lesson.xp : Math.ceil(lesson.xp / 2);  // replays earn half
  p.xp += xpGained;

  let streakGrew = false;
  const t = today();
  if (p.streak.lastDate !== t) {
    p.streak.count = (p.streak.lastDate === yesterday()) ? p.streak.count + 1 : 1;
    p.streak.lastDate = t;
    streakGrew = true;
  }
  save(p);
  return { xpGained, streakGrew };
}

// Streak shown in the HUD: 0 if the chain is already broken.
export function currentStreak(p) {
  const t = today();
  if (p.streak.lastDate === t || p.streak.lastDate === yesterday()) return p.streak.count;
  return 0;
}
