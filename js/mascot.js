// ============================================================
// Byte the raccoon — pose changes + speech bubble
// ============================================================

const POSES = [
  'greeting', 'explaining', 'thinking', 'inspecting', 'neutral',
  'good-job', 'great-job', 'worried', 'shocked', 'laughing', 'idle',
  'its-ok', 'proud', 'hey-cool',
];

const el = () => document.getElementById('mascot');
const img = () => document.getElementById('mascot-img');
const bubble = () => document.getElementById('mascot-bubble');

let hideTimer = null;

export function showMascot() { el().hidden = false; }
export function hideMascot() { el().hidden = true; }

export function setPose(pose) {
  if (!POSES.includes(pose)) pose = 'neutral';
  img().src = `assets/mascot/${pose}.png`;
  el().classList.remove('pop');
  void el().offsetWidth;              // restart the pop animation
  el().classList.add('pop');
}

// Short reactions in the speech bubble. `sticky` keeps it on screen.
export function say(pose, text, { sticky = false, ms = 4500 } = {}) {
  setPose(pose);
  const b = bubble();
  clearTimeout(hideTimer);
  if (!text) { b.hidden = true; return; }
  b.innerHTML = format(text);
  b.hidden = false;
  if (!sticky) hideTimer = setTimeout(() => { b.hidden = true; }, ms);
}

export function hush() {
  clearTimeout(hideTimer);
  bubble().hidden = true;
}

// ----- Clippy mode: Byte floats above everything and can be
// picked up and dropped anywhere. His spot survives screen
// changes and window resizes; he's clamped to stay visible. -----

let dragReady = false;
let reclampFn = null;

// keep Byte off the taskbar whenever it's on screen
const bottomGap = () => {
  const t = document.getElementById('taskbar');
  return t && !t.hidden ? 54 : 0;
};

export function reclamp() { if (reclampFn) reclampFn(); }

export function enableDragging() {
  if (dragReady) return;
  dragReady = true;
  const m = el();
  const im = img();

  const offset = () => {
    const t = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(m.style.transform);
    return t ? [+t[1], +t[2]] : [0, 0];
  };
  const clamp = (nx, ny) => {
    const r = im.getBoundingClientRect();
    const [cx, cy] = offset();
    const ox = r.left - cx;                 // untranslated position
    const oy = r.top - cy;
    nx = Math.max(10 - ox, Math.min(nx, window.innerWidth - r.width - 10 - ox));
    ny = Math.max(60 - oy, Math.min(ny, window.innerHeight - bottomGap() - r.height - oy));
    return [nx, ny];
  };

  reclampFn = () => {
    const [cx, cy] = offset();
    const [nx, ny] = clamp(cx, cy);
    if (nx !== cx || ny !== cy) m.style.transform = `translate(${nx}px, ${ny}px)`;
  };

  let dragging = false;
  let sx = 0, sy = 0, bx = 0, by = 0;

  im.addEventListener('pointerdown', (e) => {
    dragging = true;
    try { im.setPointerCapture(e.pointerId); } catch { /* synthetic pointers */ }
    [bx, by] = offset();
    sx = e.clientX;
    sy = e.clientY;
    im.style.cursor = 'grabbing';
  });
  im.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const [nx, ny] = clamp(bx + e.clientX - sx, by + e.clientY - sy);
    m.style.transform = `translate(${nx}px, ${ny}px)`;
  });
  const end = () => { dragging = false; im.style.cursor = 'grab'; };
  im.addEventListener('pointerup', end);
  im.addEventListener('pointercancel', end);

  // if the browser window shrinks, nudge Byte back into view
  window.addEventListener('resize', reclampFn);
}

// tiny markdown: `code` and **bold**, safely escaped
export function format(text) {
  const esc = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
