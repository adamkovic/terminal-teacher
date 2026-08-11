// ============================================================
// Terminal toys: cmatrix, sl train, cowsay, fortune
// ============================================================

// ---------- cmatrix ----------

export function runMatrix(term) {
  term.busy = true;
  term.input.blur();

  const overlay = document.createElement('div');
  overlay.className = 'term-overlay';
  const canvas = document.createElement('canvas');
  overlay.appendChild(canvas);
  term.body.appendChild(overlay);

  canvas.width = term.body.clientWidth;
  canvas.height = term.body.clientHeight;
  const ctx = canvas.getContext('2d');

  const fontSize = 18;
  const cols = Math.floor(canvas.width / fontSize);
  const drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -30));
  const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFXYZ<>*+=';

  const timer = setInterval(() => {
    ctx.fillStyle = 'rgba(10, 12, 16, 0.12)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = fontSize + 'px monospace';
    for (let i = 0; i < drops.length; i++) {
      const ch = glyphs[Math.floor(Math.random() * glyphs.length)];
      // leading glyph bright, trail green
      ctx.fillStyle = Math.random() > 0.1 ? '#3fda5d' : '#c8ffd0';
      ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    // hint in the corner
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(canvas.width - 190, canvas.height - 30, 190, 30);
    ctx.fillStyle = '#ffd23f';
    ctx.font = '15px monospace';
    ctx.fillText('press  q  to escape', canvas.width - 178, canvas.height - 10);
  }, 55);

  const stop = (e) => {
    if (e.type === 'keydown' && e.key.toLowerCase() !== 'q' && e.key !== 'Escape') return;
    e.preventDefault();
    clearInterval(timer);
    overlay.remove();
    window.removeEventListener('keydown', stop, true);
    term.busy = false;
    term.print([{ t: 'You escaped the Matrix. 😎', c: 'magic' }]);
    term.scroll();
    term.focus();
    if (term.onEggDone) term.onEggDone('cmatrix');
  };
  window.addEventListener('keydown', stop, true);
}

// ---------- sl (steam locomotive) ----------

const TRAIN = String.raw`
      ====        ________
  _D _|  |_______/        \__I_I_____===__|_________
   |(_)---  |   H\________/ |   |        =|___ ___|
   /     |  |   H  |  |     |   |         ||_| |_||
  |      |  |   H  |__--------------------| [___] |
  | ________|___H__/__|_____/[][]~\_______|       |
  |/ |   |-----------I_____I [][] []  D   |=======|__
__/ =| o |=-~~\  /~~\  /~~\  /~~\ ____Y___________|__
 |/-=|___|=    ||    ||    ||    |_____/~\___/
  \_/      \O=====O=====O=====O_/      \_/`;

export function runTrain(term) {
  term.busy = true;
  term.input.blur();

  const pre = document.createElement('pre');
  pre.className = 'train-pre';
  pre.textContent = TRAIN;
  term.body.appendChild(pre);

  const w = term.body.clientWidth;
  let x = w;
  const trainWidth = 560;

  const timer = setInterval(() => {
    x -= 7;
    pre.style.left = x + 'px';
    if (x < -trainWidth - 60) {
      clearInterval(timer);
      pre.remove();
      term.busy = false;
      term.print([{ t: 'Choo choo! 🚂 (fun fact: "sl" is what you get when you type "ls" too fast)', c: 'info' }]);
      term.scroll();
      term.focus();
      if (term.onEggDone) term.onEggDone('sl');
    }
  }, 30);
}

// ---------- cowsay ----------

export function cowsay(text) {
  const msg = text.trim() || 'Moo?';
  const width = Math.min(msg.length, 38);

  // wrap text
  const words = msg.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const wd of words) {
    if ((cur + ' ' + wd).trim().length > width) { lines.push(cur.trim()); cur = wd; }
    else cur = (cur + ' ' + wd).trim();
  }
  if (cur) lines.push(cur);
  const w = Math.max(...lines.map(l => l.length));

  const out = [];
  out.push(' ' + '_'.repeat(w + 2));
  if (lines.length === 1) {
    out.push(`< ${lines[0].padEnd(w)} >`);
  } else {
    lines.forEach((l, i) => {
      const bars = i === 0 ? ['/', '\\'] : i === lines.length - 1 ? ['\\', '/'] : ['|', '|'];
      out.push(`${bars[0]} ${l.padEnd(w)} ${bars[1]}`);
    });
  }
  out.push(' ' + '-'.repeat(w + 2));
  out.push('        \\   ^__^');
  out.push('         \\  (oo)\\_______');
  out.push('            (__)\\       )\\/\\');
  out.push('                ||----w |');
  out.push('                ||     ||');
  return out;
}

// ---------- fortune ----------

const FORTUNES = [
  'You will type a command today that works on the FIRST try. ⭐',
  'A wise raccoon says: read the error message. It is trying to help you!',
  'Your future holds many folders... organize them well.',
  'Fortune favors the one who presses Enter with confidence.',
  'Today is a great day to teach a grown-up a terminal command.',
  'The cursor blinks for those who dare to type.',
  'You are 100% less likely to break a computer than you think.',
  'Somewhere, a server is grateful you learned "cd".',
  'Big journeys begin with a single keystroke.',
  'Trust the terminal. It only does exactly what you tell it. That is the fun part.',
];

export function randomFortune() {
  return FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
}
