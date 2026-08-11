// ============================================================
// Tiny 8-bit sound effects — pure Web Audio, no audio files.
// Muting persists per browser (classroom-friendly).
// ============================================================

const KEY = 'terminal-teacher-muted';

let ctx = null;
let muted = false;
try { muted = localStorage.getItem(KEY) === '1'; } catch { /* private mode */ }

function ensureCtx() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// one bleep: freq in Hz, t0 seconds from now, dur seconds
function note(freq, t0, dur, type = 'square', vol = 0.12) {
  const c = ensureCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(c.destination);
  const now = c.currentTime + t0;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(vol, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.start(now);
  osc.stop(now + dur + 0.03);
}

export function play(name) {
  if (muted) return;
  switch (name) {
    case 'step':      // little rising "got it!"
      note(660, 0, 0.09);
      note(880, 0.09, 0.13);
      break;
    case 'lesson':    // victory arpeggio
      [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.11, 0.14, 'square', 0.14));
      note(1319, 0.44, 0.32, 'triangle', 0.12);
      break;
    case 'error':     // soft "whoops" boop — gentle, not punishing
      note(220, 0, 0.1, 'triangle', 0.09);
      note(175, 0.09, 0.14, 'triangle', 0.08);
      break;
    case 'unlock':    // something new appeared
      note(392, 0, 0.1);
      note(523, 0.1, 0.1);
      note(659, 0.2, 0.22);
      break;
  }
}

export function isMuted() { return muted; }

export function toggleMuted() {
  muted = !muted;
  try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch { /* ok */ }
  if (!muted) play('step');       // audible confirmation when unmuting
  return muted;
}
