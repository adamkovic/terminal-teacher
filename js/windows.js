// ============================================================
// Retro desktop window manager.
// Windows are absolutely positioned inside a .desktop-area:
// draggable by their title bar, resizable by the corner grip,
// minimizable/maximizable, with taskbar buttons + focus rings.
// Below 900px the desktop collapses to a stacked layout and
// window management turns off (CSS neutralizes positions).
// ============================================================

const desktopMode = () => window.innerWidth >= 900;

let zTop = 10;
const registry = new Map();   // win -> {btn, bar, area, prev}

function bringToFront(win) {
  win.style.zIndex = ++zTop;
  for (const [w, info] of registry) {
    const isTop = w === win;
    w.classList.toggle('focused', isTop);
    info.btn?.classList.toggle('active', isTop && !w.hidden);
  }
}

function toggleMax(win) {
  const info = registry.get(win);
  if (!info || !desktopMode()) return;
  if (win.classList.contains('maximized')) {
    const p = info.prev || {};
    win.style.left = p.l || '';
    win.style.top = p.t || '';
    win.style.width = p.w || '';
    win.style.height = p.h || '';
    win.classList.remove('maximized');
  } else {
    info.prev = { l: win.style.left, t: win.style.top, w: win.style.width, h: win.style.height };
    win.style.left = '0px';
    win.style.top = '0px';
    win.style.width = info.area.clientWidth + 'px';
    win.style.height = info.area.clientHeight + 'px';
    win.classList.add('maximized');
  }
  bringToFront(win);
}

function initWindow(area, taskMount, { win, bar, label, x, y, w, h }) {
  win.classList.add('wm-window');
  win.classList.remove('maximized');
  win.hidden = false;

  // default placement (fresh every mount)
  if (desktopMode()) {
    win.style.left = x + 'px';
    win.style.top = y + 'px';
    win.style.width = w ? w + 'px' : '';
    win.style.height = h ? h + 'px' : '';
  } else {
    win.style.left = win.style.top = win.style.width = win.style.height = '';
  }
  win.style.zIndex = '';

  // taskbar button: restore if hidden, minimize if focused, else focus
  const btn = document.createElement('button');
  btn.className = 'task-btn';
  btn.textContent = label;
  btn.onclick = () => {
    if (win.hidden) { win.hidden = false; bringToFront(win); }
    else if (+win.style.zIndex === zTop) { win.hidden = true; btn.classList.remove('active'); }
    else bringToFront(win);
  };
  taskMount.appendChild(btn);
  registry.set(win, { btn, bar, area });

  if (win.dataset.wm) return;   // handlers + chrome already attached
  win.dataset.wm = '1';

  win.addEventListener('pointerdown', () => bringToFront(win), true);

  // ── window controls: ─ (minimize) and □ (maximize) ──
  const controls = document.createElement('span');
  controls.className = 'win-controls';
  const minB = document.createElement('button');
  minB.className = 'win-btn';
  minB.textContent = '─';
  minB.title = 'Minimize to the taskbar';
  const maxB = document.createElement('button');
  maxB.className = 'win-btn';
  maxB.textContent = '□';
  maxB.title = 'Maximize / restore';
  controls.append(minB, maxB);
  bar.insertBefore(controls, bar.querySelector('button'));
  minB.onclick = (e) => {
    e.stopPropagation();
    win.hidden = true;
    registry.get(win)?.btn.classList.remove('active');
  };
  maxB.onclick = (e) => { e.stopPropagation(); toggleMax(win); };
  bar.addEventListener('dblclick', (e) => { if (!e.target.closest('button')) toggleMax(win); });

  // ── drag by the title bar ──
  bar.style.cursor = 'grab';
  bar.style.touchAction = 'none';
  let dragging = false, sx = 0, sy = 0, bx = 0, by = 0;
  bar.addEventListener('pointerdown', (e) => {
    if (!desktopMode() || e.target.closest('button')) return;
    dragging = true;
    try { bar.setPointerCapture(e.pointerId); } catch { /* synthetic */ }
    sx = e.clientX; sy = e.clientY;
    bx = win.offsetLeft; by = win.offsetTop;
    bar.style.cursor = 'grabbing';
  });
  bar.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const a = registry.get(win).area;
    let nx = bx + e.clientX - sx;
    let ny = by + e.clientY - sy;
    nx = Math.max(70 - win.offsetWidth, Math.min(nx, a.clientWidth - 80));
    ny = Math.max(0, Math.min(ny, a.clientHeight - 46));
    win.style.left = nx + 'px';
    win.style.top = ny + 'px';
    win.classList.remove('maximized');
  });
  const dragEnd = () => { dragging = false; bar.style.cursor = 'grab'; };
  bar.addEventListener('pointerup', dragEnd);
  bar.addEventListener('pointercancel', dragEnd);

  // ── resize by the corner grip ──
  const grip = document.createElement('div');
  grip.className = 'resize-grip';
  grip.title = 'Drag to resize';
  win.appendChild(grip);
  let resizing = false, rx = 0, ry = 0, rw = 0, rh = 0;
  grip.addEventListener('pointerdown', (e) => {
    if (!desktopMode()) return;
    e.preventDefault();
    resizing = true;
    try { grip.setPointerCapture(e.pointerId); } catch { /* synthetic */ }
    rx = e.clientX; ry = e.clientY;
    rw = win.offsetWidth; rh = win.offsetHeight;
    bringToFront(win);
  });
  grip.addEventListener('pointermove', (e) => {
    if (!resizing) return;
    const a = registry.get(win).area;
    win.style.width = Math.min(Math.max(280, rw + e.clientX - rx), a.clientWidth) + 'px';
    win.style.height = Math.min(Math.max(200, rh + e.clientY - ry), a.clientHeight) + 'px';
    win.classList.remove('maximized');
  });
  const resizeEnd = () => { resizing = false; };
  grip.addEventListener('pointerup', resizeEnd);
  grip.addEventListener('pointercancel', resizeEnd);
}

// (Re)build a desktop: default placements + fresh taskbar buttons.
// The last window in `defs` starts focused.
export function mountDesktop(area, taskMount, defs) {
  taskMount.innerHTML = '';
  for (const win of [...registry.keys()]) {
    if (!defs.some(d => d.win === win)) registry.delete(win);
  }
  for (const d of defs) initWindow(area, taskMount, d);
  if (defs.length) bringToFront(defs[defs.length - 1].win);
}

// little pixel clock for the taskbar
export function startClock(el) {
  const tick = () => {
    const d = new Date();
    el.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  tick();
  setInterval(tick, 15000);
}
