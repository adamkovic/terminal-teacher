// ============================================================
// Simulated terminal: virtual filesystem + per-OS commands.
// Nothing here touches the real machine — it's a safe sandbox.
// ============================================================

import { runMatrix, runTrain, cowsay, randomFortune } from './easter-eggs.js';

export const OS_META = {
  linux:   { family: 'unix',    home: ['home', 'student'],  user: 'student', host: 'school',    shell: 'bash' },
  macos:   { family: 'unix',    home: ['Users', 'student'], user: 'student', host: 'school',    shell: 'zsh'  },
  windows: { family: 'windows', home: ['Users', 'Student'], user: 'Student', host: 'SCHOOL-PC', shell: 'cmd'  },
};

// ---------- virtual filesystem ----------

const d = (children = {}) => ({ type: 'dir', children });
const f = (content = '') => ({ type: 'file', content });

const WELCOME_TXT = [
  'Hello, explorer!',
  '',
  'If you can read this, you just used a real',
  'terminal command. That is seriously cool.',
  '',
  'Keep going — there is more hidden around here.',
  '',
  '        — Byte the Raccoon',
].join('\n');

const JOKES_TXT = [
  'Why did the computer go to the doctor?',
  '...because it caught a virus! 🤒',
  '',
  'Why was the keyboard up all night?',
  '...because it had two shift keys!',
  '',
  'What do you call 8 hobbits?',
  '...a hobbyte!',
].join('\n');

const CAT_TXT = [
  ' /\\_/\\',
  '( o.o )  < this is cat art,',
  ' > ^ <     in a file named cat.txt!',
].join('\n');

const JUNK = '◒▓▒ corrupted junk ▒▓◒';

function homeTree() {
  return d({
    'Desktop': d(),
    'Documents': d({
      'welcome.txt': f(WELCOME_TXT),
      'jokes.txt': f(JOKES_TXT),
      'homework': d({ 'math.txt': f('9 x 7 = 63  (you got this!)') }),
    }),
    'Downloads': d({
      'homework-draft.txt': f('My Essay About Raccoons\n(they are the best animal, the end)'),
      'old-meme.tmp': f(JUNK),
      'blurry-photo-1.tmp': f(JUNK),
    }),
    'Games': d({
      'minecraft': d({ 'my-world.dat': f('⛏ [world data] 100% diamonds (definitely)') }),
    }),
    'Music': d(),
    'Pictures': d({ 'cat.txt': f(CAT_TXT) }),
  });
}

export function makeFS(os) {
  const meta = OS_META[os];
  if (meta.family === 'windows') {
    return d({
      'Users': d({ [meta.home[1]]: homeTree() }),
      'Windows': d(),
      'Program Files': d(),
    });
  }
  if (os === 'macos') {
    return d({
      'Users': d({ [meta.home[1]]: homeTree() }),
      'Applications': d(),
      'System': d(),
    });
  }
  return d({
    'home': d({ [meta.home[1]]: homeTree() }),
    'bin': d(),
    'etc': d(),
    'tmp': d(),
  });
}

// ---------- terminal ----------

export class Terminal {
  constructor(os, mountEl, opts = {}) {
    this.os = os;
    this.meta = OS_META[os];
    this.fs = opts.fs || makeFS(os);
    this.cwd = [...this.meta.home];
    this.history = [];
    this.historyIdx = -1;
    this.busy = false;            // true while an animation owns the screen
    this.onCommand = opts.onCommand || null;

    this.buildDOM(mountEl);
    this.printWelcome();
    this.refreshPrompt();
  }

  buildDOM(mountEl) {
    mountEl.innerHTML = '';
    const term = document.createElement('div');
    term.className = 'terminal';
    term.innerHTML = `
      <div class="term-titlebar">
        <span class="tdot r"></span><span class="tdot y"></span><span class="tdot g"></span>
        <span class="term-title-text"></span>
      </div>
      <div class="term-body">
        <div class="term-output"></div>
        <div class="term-input-row">
          <span class="term-prompt"></span>
          <input class="term-input" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="terminal input">
        </div>
      </div>
      <div class="term-statusbar">
        <span class="term-status-path"></span>
        <span class="term-status-safe">🛡 safe practice mode</span>
      </div>`;
    mountEl.appendChild(term);

    this.el = term;
    this.body = term.querySelector('.term-body');
    this.output = term.querySelector('.term-output');
    this.promptEl = term.querySelector('.term-prompt');
    this.input = term.querySelector('.term-input');
    this.statusPath = term.querySelector('.term-status-path');
    term.querySelector('.term-title-text').textContent =
      this.meta.family === 'windows'
        ? 'Command Prompt — practice mode'
        : `${this.meta.user}@${this.meta.host} — ${this.meta.shell} (practice mode)`;

    this.body.addEventListener('click', () => { if (!this.busy) this.input.focus(); });
    this.input.addEventListener('keydown', (e) => this.onKey(e));
  }

  onKey(e) {
    if (this.busy) { e.preventDefault(); return; }
    if (e.key === 'Enter') {
      const line = this.input.value;
      this.input.value = '';
      this.run(line);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.history.length) {
        this.historyIdx = Math.max(0, this.historyIdx < 0 ? this.history.length - 1 : this.historyIdx - 1);
        this.input.value = this.history[this.historyIdx];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.historyIdx >= 0) {
        this.historyIdx++;
        if (this.historyIdx >= this.history.length) { this.historyIdx = -1; this.input.value = ''; }
        else this.input.value = this.history[this.historyIdx];
      }
    }
  }

  // ----- output helpers -----

  print(content, cls = '') {
    const line = document.createElement('div');
    line.className = 'term-line' + (cls ? ' ' + cls : '');
    if (Array.isArray(content)) {
      for (const seg of content) {
        const span = document.createElement('span');
        span.textContent = seg.t;
        if (seg.c) span.className = 'seg-' + seg.c;
        line.appendChild(span);
      }
    } else {
      line.textContent = content;
    }
    this.output.appendChild(line);
    this.scroll();
  }

  printLines(lines, cls = '') { for (const l of lines) this.print(l, cls); }
  scroll() { this.body.scrollTop = this.body.scrollHeight; }
  clear() { this.output.innerHTML = ''; }
  focus() { if (!this.busy) this.input.focus(); }

  printWelcome() {
    if (this.meta.family === 'windows') {
      this.print('Terminal Teacher [Practice Command Prompt]', 'echoed');
      this.print('(c) Byte the Raccoon. All rights reserved... to have fun.');
    } else {
      this.print(`Welcome to the practice terminal! (${this.os === 'macos' ? 'macOS · zsh' : 'Linux · bash'})`, 'echoed');
    }
    this.print('');
  }

  // ----- prompt & paths -----

  promptText() {
    if (this.meta.family === 'windows') return this.pathString(this.cwd) + '>';
    const homeStr = '/' + this.meta.home.join('/');
    let p = '/' + this.cwd.join('/');
    if (p === homeStr) p = '~';
    else if (p.startsWith(homeStr + '/')) p = '~' + p.slice(homeStr.length);
    return this.os === 'macos'
      ? `${this.meta.user}@${this.meta.host} ${p} % `
      : `${this.meta.user}@${this.meta.host}:${p}$ `;
  }

  refreshPrompt() {
    this.promptEl.textContent = this.promptText();
    this.statusPath.textContent = '📁 ' + this.pathString(this.cwd);
  }

  pathString(parts) {
    return this.meta.family === 'windows'
      ? 'C:\\' + parts.join('\\')
      : '/' + parts.join('/');
  }

  // Resolve a user-typed path to an absolute parts array (no fs check).
  resolveParts(pathStr) {
    const win = this.meta.family === 'windows';
    let s = (pathStr || '').trim();
    if (win) s = s.replace(/^[A-Za-z]:/, '').replace(/\\/g, '/');
    let parts;
    if (!win && (s === '~' || s.startsWith('~/'))) {
      parts = [...this.meta.home];
      s = s.slice(1);
    } else if (s.startsWith('/')) {
      parts = [];
    } else {
      parts = [...this.cwd];
    }
    for (const seg of s.split('/')) {
      if (!seg || seg === '.') continue;
      if (seg === '..') parts.pop();
      else parts.push(seg);
    }
    return parts;
  }

  // Walk the fs; returns {node, parts} or null. Windows = case-insensitive.
  getNode(parts) {
    const win = this.meta.family === 'windows';
    let node = this.fs;
    const real = [];
    for (const seg of parts) {
      if (node.type !== 'dir') return null;
      let key = seg;
      if (!(key in node.children) && win) {
        key = Object.keys(node.children).find(k => k.toLowerCase() === seg.toLowerCase());
      } else if (!(key in node.children)) {
        // forgiving: unique case-insensitive match still fails on unix,
        // but we detect it elsewhere for a friendly hint
        key = undefined;
      }
      if (key === undefined) return null;
      node = node.children[key];
      real.push(key);
    }
    return { node, parts: real };
  }

  // Does a case-insensitive twin exist? (for "check your capitalization" hints)
  caseTwin(parts) {
    let node = this.fs;
    const real = [];
    for (const seg of parts) {
      if (node.type !== 'dir') return null;
      const key = Object.keys(node.children).find(k => k.toLowerCase() === seg.toLowerCase());
      if (!key) return null;
      node = node.children[key];
      real.push(key);
    }
    return real.join('/');
  }

  // ----- running commands -----

  run(rawLine) {
    if (this.busy) return;
    const raw = rawLine.trim();
    this.print([{ t: this.promptText(), c: 'green' }, { t: rawLine, c: '' }], 'echoed');
    if (!raw) { this.refreshPrompt(); return; }
    this.history.push(rawLine);
    this.historyIdx = -1;

    const result = this.exec(raw);
    this.refreshPrompt();
    this.scroll();
    if (this.onCommand) this.onCommand(raw, result);
  }

  exec(raw) {
    const win = this.meta.family === 'windows';
    // echo redirection: echo something > file.txt (both OS families)
    const redir = raw.match(/^echo\s+(.+?)\s*>\s*(\S+)$/i);
    if (redir && (!win || /^echo/i.test(raw)) && /^echo/i.test(raw)) {
      return this.cmdEchoRedirect(redir[1], redir[2]);
    }

    const tokens = raw.split(/\s+/);
    let cmd = tokens[0];
    if (win) cmd = cmd.toLowerCase();
    const args = tokens.slice(1);

    const table = win ? this.windowsCommands() : this.unixCommands();
    const handler = table[cmd];
    if (!handler) {
      if (win) {
        this.print(`'${tokens[0]}' is not recognized as an internal or external command,`, '');
        this.print('operable program or batch file.', '');
      } else if (this.os === 'macos') {
        this.print(`zsh: command not found: ${cmd}`, '');
      } else {
        this.print(`bash: ${cmd}: command not found`, '');
      }
      return { ok: false, error: 'not-found', cmd };
    }
    return handler(args, raw) || { ok: true };
  }

  err(lines) {
    for (const l of [].concat(lines)) this.print([{ t: l, c: 'err' }]);
    return { ok: false, error: 'cmd-error' };
  }

  // ----- shared helpers used by both command sets -----

  listDir(node) {
    const names = Object.keys(node.children).sort((a, b) => a.localeCompare(b));
    return names.map(n => ({ name: n, isDir: node.children[n].type === 'dir' }));
  }

  cmdEchoRedirect(text, fileName) {
    if (!/^[\w.\-]+$/.test(fileName)) {
      return this.err('Hmm, keep file names simple: letters, numbers, dots and dashes.');
    }
    const here = this.getNode(this.cwd);
    if (!here || here.node.type !== 'dir') return this.err('Something went wrong finding this folder.');
    here.node.children[fileName] = f(text.replace(/^"(.*)"$/, '$1'));
    return { ok: true, wrote: fileName };
  }

  badPathError(pathArg, unixPrefix) {
    // friendly capitalization detection (mainly matters on unix)
    const twin = this.caseTwin(this.resolveParts(pathArg));
    if (twin && this.meta.family !== 'windows') {
      const name = twin.split('/').pop();
      this.print([{ t: `${unixPrefix}: ${pathArg}: No such file or directory`, c: 'err' }]);
      this.print([{ t: `(psst — capitalization matters! Did you mean "${name}"?)`, c: 'warn' }]);
      return { ok: false, error: 'case' };
    }
    if (this.meta.family === 'windows') {
      return this.err('The system cannot find the path specified.');
    }
    return this.err(`${unixPrefix}: ${pathArg}: No such file or directory`);
  }

  doCd(arg) {
    if (!arg) {
      this.cwd = [...this.meta.home];      // unix: cd → home
      return { ok: true };
    }
    const parts = this.resolveParts(arg);
    const found = this.getNode(parts);
    if (!found) return this.badPathError(arg, 'cd');
    if (found.node.type !== 'dir') {
      return this.meta.family === 'windows'
        ? this.err('The directory name is invalid.')
        : this.err(`cd: not a directory: ${arg}`);
    }
    this.cwd = found.parts;
    return { ok: true };
  }

  doMkdir(arg) {
    if (!arg) return this.err(this.meta.family === 'windows'
      ? 'The syntax of the command is incorrect. (Try: mkdir myfolder)'
      : 'usage: mkdir folder_name');
    if (!/^[\w.\-]+$/.test(arg)) {
      return this.err('Keep folder names simple: letters, numbers, dashes. No spaces!');
    }
    const here = this.getNode(this.cwd);
    const exists = Object.keys(here.node.children)
      .some(k => this.meta.family === 'windows' ? k.toLowerCase() === arg.toLowerCase() : k === arg);
    if (exists) {
      return this.meta.family === 'windows'
        ? this.err(`A subdirectory or file ${arg} already exists.`)
        : this.err(`mkdir: ${arg}: File exists`);
    }
    here.node.children[arg] = d();
    return { ok: true, made: arg };
  }

  doReadFile(arg, cmdName) {
    if (!arg) return this.err(`usage: ${cmdName} file_name`);
    const parts = this.resolveParts(arg);
    const found = this.getNode(parts);
    if (!found) return this.badPathError(arg, cmdName);
    if (found.node.type === 'dir') {
      return this.meta.family === 'windows'
        ? this.err('Access is denied. (That is a folder, not a file!)')
        : this.err(`${cmdName}: ${arg}: Is a directory`);
    }
    this.printLines(found.node.content.split('\n'));
    return { ok: true, read: arg };
  }

  doTree() {
    const start = this.getNode(this.cwd);
    this.print([{ t: this.pathString(this.cwd), c: 'info' }]);
    const walk = (node, prefix) => {
      const entries = this.listDir(node);
      entries.forEach((e, i) => {
        const last = i === entries.length - 1;
        const branch = last ? '└── ' : '├── ';
        this.print([
          { t: prefix + branch, c: '' },
          { t: e.name, c: e.isDir ? 'dir' : 'file' },
        ]);
        if (e.isDir) walk(node.children[e.name], prefix + (last ? '    ' : '│   '));
      });
    };
    walk(start.node, '');
    return { ok: true };
  }

  // ----- intermediate-tier helpers: file ops, network, java -----

  // Case-aware child lookup; returns the real key or undefined.
  keyIn(node, name) {
    if (name in node.children) return name;
    if (this.meta.family === 'windows') {
      return Object.keys(node.children).find(k => k.toLowerCase() === name.toLowerCase());
    }
    return undefined;
  }

  // Resolve a path into {name, parent, existing} for mv/cp/rm-style commands.
  splitTarget(str) {
    const parts = this.resolveParts(str);
    if (!parts.length) return null;
    const existing = this.getNode(parts);
    const parentParts = existing ? existing.parts.slice(0, -1) : parts.slice(0, -1);
    const parent = this.getNode(parentParts);
    const name = existing ? existing.parts[existing.parts.length - 1] : parts[parts.length - 1];
    return { parts, name, parent, existing };
  }

  fileNotFound(arg, cmdName) {
    return this.meta.family === 'windows'
      ? this.err('The system cannot find the file specified.')
      : this.err(`${cmdName}: ${arg}: No such file or directory`);
  }

  doMove(srcStr, dstStr, cmdName) {
    if (!srcStr || !dstStr) return this.err(`usage: ${cmdName} <what> <where>`);
    const src = this.splitTarget(srcStr);
    if (!src || !src.existing) return this.fileNotFound(srcStr, cmdName);
    const dst = this.splitTarget(dstStr);
    if (!dst) return this.fileNotFound(dstStr, cmdName);

    let targetDir, newName;
    if (dst.existing && dst.existing.node.type === 'dir') {
      targetDir = dst.existing.node;
      newName = src.name;
    } else if (dst.parent && dst.parent.node.type === 'dir') {
      targetDir = dst.parent.node;
      newName = dst.name;
      if (!/^[\w.\-]+$/.test(newName)) {
        return this.err('Keep names simple: letters, numbers, dots, dashes. No spaces!');
      }
    } else {
      return this.fileNotFound(dstStr, cmdName);
    }

    if (src.existing.node.type === 'dir') {
      const srcPath = src.existing.parts.join('/') + '/';
      if ((dst.parts.join('/') + '/').startsWith(srcPath)) {
        return this.err(`${cmdName}: you can't move a folder inside itself! (mind-bending, right?)`);
      }
    }
    const clash = this.keyIn(targetDir, newName);
    if (clash && targetDir.children[clash] !== src.existing.node) {
      return this.err(this.meta.family === 'windows'
        ? `A file named ${newName} already exists there.`
        : `${cmdName}: ${newName}: already exists there`);
    }
    delete src.parent.node.children[src.name];
    targetDir.children[newName] = src.existing.node;
    return { ok: true, moved: newName };
  }

  doCopy(srcStr, dstStr, cmdName) {
    if (!srcStr || !dstStr) return this.err(`usage: ${cmdName} <file> <copy-name>`);
    const src = this.splitTarget(srcStr);
    if (!src || !src.existing) return this.fileNotFound(srcStr, cmdName);
    if (src.existing.node.type === 'dir') {
      return this.err(`${cmdName}: ${srcStr}: that's a folder — copying folders is a power tool for later!`);
    }
    const dst = this.splitTarget(dstStr);
    if (!dst) return this.fileNotFound(dstStr, cmdName);

    let targetDir, newName;
    if (dst.existing && dst.existing.node.type === 'dir') {
      targetDir = dst.existing.node;
      newName = src.name;
    } else if (dst.parent && dst.parent.node.type === 'dir') {
      targetDir = dst.parent.node;
      newName = dst.name;
      if (!/^[\w.\-]+$/.test(newName)) {
        return this.err('Keep names simple: letters, numbers, dots, dashes. No spaces!');
      }
    } else {
      return this.fileNotFound(dstStr, cmdName);
    }
    targetDir.children[newName] = f(src.existing.node.content);   // cp overwrites, like the real one
    return { ok: true, copied: newName };
  }

  doRemove(args, cmdName) {
    if (!args.length) return this.err(`usage: ${cmdName} <file>`);
    for (const arg of args) {
      if (arg.startsWith('-')) {
        return this.err(`${cmdName}: flags like ${arg} are power tools for later — one file at a time for now!`);
      }
      const t = this.splitTarget(arg);
      if (!t || !t.existing) return this.fileNotFound(arg, cmdName);
      if (t.existing.node.type === 'dir') {
        return this.err(this.meta.family === 'windows'
          ? `${arg} is a folder — del only deletes files.`
          : `${cmdName}: ${arg}: is a directory`);
      }
      delete t.parent.node.children[t.name];
    }
    return { ok: true, removed: args };
  }

  // Print lines one at a time on a timer (ping replies, server logs).
  playScript(lines, interval = 550, doneCb = null) {
    this.busy = true;
    let i = 0;
    const t = setInterval(() => {
      if (i >= lines.length) {
        clearInterval(t);
        this.busy = false;
        this.refreshPrompt();
        this.scroll();
        this.focus();
        if (doneCb) doneCb();
        return;
      }
      this.print(lines[i++]);
      this.scroll();
    }, interval);
  }

  doPing(host) {
    if (!host) return this.err('usage: ping <address>   (example: ping byte.school)');
    const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
    let hash = 0;
    for (const ch of host) hash = (hash * 31 + ch.charCodeAt(0)) % 199;
    const ip = isIp ? host : `203.0.113.${hash + 10}`;
    const time = () => (12 + Math.random() * 30).toFixed(this.meta.family === 'windows' ? 0 : 1);
    const win = this.meta.family === 'windows';
    const lines = win
      ? [
          `Pinging ${host} [${ip}] with 32 bytes of data:`,
          ...[1, 2, 3, 4].map(() => `Reply from ${ip}: bytes=32 time=${time()}ms TTL=64`),
          '',
          `Ping statistics for ${ip}:`,
          '    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)',
        ]
      : [
          `PING ${host} (${ip}): 56 data bytes`,
          ...[0, 1, 2, 3].map(s => `64 bytes from ${ip}: icmp_seq=${s} ttl=64 time=${time()} ms`),
          '',
          `--- ${host} ping statistics ---`,
          '4 packets transmitted, 4 packets received, 0.0% packet loss',
        ];
    this.playScript(lines, 600);
    return { ok: true, pinged: host };
  }

  doNet() {
    const win = this.meta.family === 'windows';
    const iface = this.os === 'macos' ? 'en0' : 'wlan0';
    if (win) {
      this.printLines([
        'Windows IP Configuration',
        '',
        'Wireless LAN adapter Wi-Fi:',
        '',
      ]);
      this.print([{ t: '   IPv4 Address. . . . . . . . . . . : ', c: '' }, { t: '192.168.1.42', c: 'info' }]);
      this.printLines([
        '   Subnet Mask . . . . . . . . . . . : 255.255.255.0',
        '   Default Gateway . . . . . . . . . : 192.168.1.1',
      ]);
    } else {
      this.print(`${iface}: flags=8863<UP,BROADCAST,RUNNING> mtu 1500`);
      this.print([{ t: '        inet ', c: '' }, { t: '192.168.1.42', c: 'info' }, { t: ' netmask 0xffffff00 broadcast 192.168.1.255', c: '' }]);
    }
    this.print([{ t: '        (↑ that is YOUR address on this network: 192.168.1.42)', c: 'green' }]);
    return { ok: true };
  }

  doCurl(args) {
    const url = args.find(a => !a.startsWith('-'));
    const save = args.includes('-O');
    if (!url) return this.err('usage: curl -O <web-address-of-a-file>');
    const fileName = (url.split('/').pop() || 'file.bin').split('?')[0];
    if (!save) {
      this.printLines(['◒$▓{▒%!!◒▒#▓~�◒▓!▒%◒{{▓#◒▒~$▓◒!!▒◒▓%◒#▒▓◒!◒'], '');
      this.print([{ t: `(that was the file's raw data spraying onto the screen! 😅 add -O to SAVE it: curl -O ${url})`, c: 'warn' }]);
      return { ok: true, curlRaw: true };
    }
    if (!/^[\w.\-]+$/.test(fileName)) return this.err(`curl: can't figure out a file name from that address`);

    this.busy = true;
    const line = document.createElement('div');
    line.className = 'term-line';
    this.output.appendChild(line);
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(100, p + 3 + Math.random() * 9);
      const filled = Math.round(p / 4);
      line.textContent = `${fileName}  [${'█'.repeat(filled)}${'░'.repeat(25 - filled)}] ${Math.floor(p)}%`;
      this.scroll();
      if (p >= 100) {
        clearInterval(t);
        const here = this.getNode(this.cwd);
        here.node.children[fileName] = f('[minecraft server program bytes — 47 MB of them]');
        this.print([{ t: `Saved ${fileName} (47 MB) ✔`, c: 'green' }]);
        this.busy = false;
        this.refreshPrompt();
        this.scroll();
        this.focus();
      }
    }, 110);
    return { ok: true, downloading: fileName };
  }

  doJava(args) {
    if (args[0] === '-version' || args[0] === '--version') {
      this.printLines([
        'openjdk version "21.0.2" 2024-01-16',
        'OpenJDK Runtime Environment (build 21.0.2+13)',
      ]);
      return { ok: true, javaVersion: true };
    }
    if (args[0] !== '-jar') {
      return this.err('usage: java -jar <file.jar>   (or java -version)');
    }
    const jar = args[1];
    if (!jar) return this.err('usage: java -jar <file.jar>');
    const found = this.splitTarget(jar);
    if (!found || !found.existing || found.existing.node.type !== 'file') {
      return this.err(`Error: Unable to access jarfile ${jar}`);
    }

    const here = this.getNode(this.cwd).node;
    const eulaKey = this.keyIn(here, 'eula.txt');
    const eulaOk = eulaKey && /eula\s*=\s*true/i.test(here.children[eulaKey].content);

    if (!eulaOk) {
      if (!eulaKey) {
        here.children['eula.txt'] = f(
          '# By changing the setting below to TRUE you are\n' +
          '# agreeing to the Minecraft EULA (the rules of use).\n' +
          'eula=false');
      }
      this.playScript([
        '[12:00:41] [Server thread/INFO]: Loading libraries, please wait...',
        [{ t: '[12:00:44] [Server thread/WARN]: Failed to start the minecraft server', c: 'warn' }],
        '[12:00:44] [Server thread/INFO]: You need to agree to the EULA in order to run the server.',
        '[12:00:44] [Server thread/INFO]: Go to eula.txt for more info.',
      ], 650);
      return { ok: true, java: 'eula' };
    }

    this.playScript([
      '[12:01:03] [Server thread/INFO]: Starting minecraft server version 1.21',
      '[12:01:03] [Server thread/INFO]: Loading properties',
      '[12:01:04] [Server thread/INFO]: Preparing level "world"',
      '[12:01:05] [Server thread/INFO]: Preparing spawn area: 44%',
      '[12:01:06] [Server thread/INFO]: Preparing spawn area: 87%',
      [{ t: '[12:01:07] [Server thread/INFO]: Done (3.152s)! For help, type "help"', c: 'green' }],
      [{ t: '[Byte 🦝] Server is UP! Friends on your network could join at 192.168.1.42:25565', c: 'magic' }],
      [{ t: '(the practice server takes a bow and stops here — a real one keeps running until you close it)', c: 'info' }],
    ], 620);
    return { ok: true, java: 'started' };
  }

  printHelp() {
    const win = this.meta.family === 'windows';
    const rows = win ? [
      ['cd',        'show where you are (or move: cd Documents)'],
      ['dir',       'list what is in this folder'],
      ['cd ..',     'go up to the parent folder'],
      ['mkdir',     'make a new folder'],
      ['type',      'read a text file'],
      ['echo',      'print text (echo hi > file.txt makes a file)'],
      ['cls',       'wipe the screen clean'],
      ['whoami',    'who is logged in?'],
      ['date',      'what day is it?'],
      ['tree',      'draw the folder tree'],
    ] : [
      ['pwd',       'print where you are'],
      ['ls',        'list what is in this folder'],
      ['cd',        'move to a folder (cd .. goes up, cd goes home)'],
      ['mkdir',     'make a new folder'],
      ['touch',     'make a new empty file'],
      ['cat',       'read a text file'],
      ['echo',      'print text (echo hi > file.txt makes a file)'],
      ['clear',     'wipe the screen clean'],
      ['whoami',    'who is logged in?'],
      ['date',      'what day is it?'],
      ['tree',      'draw the folder tree'],
    ];
    const rows2 = win ? [
      ['move',      'move a file (or rename across folders)'],
      ['copy',      'copy a file'],
      ['ren',       'rename a file'],
      ['del',       'delete a file (careful — no trash can!)'],
      ['ping',      'check if another computer answers'],
      ['ipconfig',  'show YOUR address on the network'],
      ['hostname',  'show this computer\'s name'],
      ['curl -O',   'download a file from the web'],
      ['java -jar', 'run a java program (like a Minecraft server!)'],
    ] : [
      ['mv',        'move or rename a file'],
      ['cp',        'copy a file'],
      ['rm',        'delete a file (careful — no trash can!)'],
      ['ping',      'check if another computer answers'],
      ['ifconfig',  'show YOUR address on the network'],
      ['hostname',  'show this computer\'s name'],
      ['curl -O',   'download a file from the web'],
      ['java -jar', 'run a java program (like a Minecraft server!)'],
    ];
    this.print([{ t: '── BASICS ────────────────────', c: 'info' }]);
    for (const [c, desc] of rows) {
      this.print([{ t: '  ' + c.padEnd(11), c: 'green' }, { t: desc, c: '' }]);
    }
    this.print([{ t: '── EVERYDAY QUESTS ───────────', c: 'info' }]);
    for (const [c, desc] of rows2) {
      this.print([{ t: '  ' + c.padEnd(11), c: 'green' }, { t: desc, c: '' }]);
    }
    this.print([{ t: '── SECRET FUN ────────────────', c: 'magic' }]);
    for (const [c, desc] of [
      ['cmatrix', 'enter the matrix (press q to leave)'],
      ['sl',      'a surprise on rails'],
      ['cowsay',  'a cow says your words: cowsay hello'],
      ['fortune', 'crack open a fortune cookie'],
    ]) {
      this.print([{ t: '  ' + c.padEnd(9), c: 'magic' }, { t: desc, c: '' }]);
    }
    return { ok: true };
  }

  // ----- easter eggs (shared) -----

  eggCommands() {
    return {
      cmatrix: () => { runMatrix(this); return { ok: true, egg: 'cmatrix' }; },
      sl:      () => { runTrain(this);  return { ok: true, egg: 'sl' }; },
      cowsay:  (args) => {
        this.printLines(cowsay(args.join(' ') || 'Moo?'));
        return { ok: true, egg: 'cowsay' };
      },
      fortune: () => {
        this.print([{ t: randomFortune(), c: 'info' }]);
        return { ok: true, egg: 'fortune' };
      },
    };
  }

  // ----- unix (linux + macos) -----

  unixCommands() {
    return {
      ...this.eggCommands(),
      help: () => this.printHelp(),
      mv: (args) => this.doMove(args[0], args[1], 'mv'),
      cp: (args) => this.doCopy(args[0], args[1], 'cp'),
      rm: (args) => this.doRemove(args, 'rm'),
      ping: (args) => this.doPing(args[0]),
      curl: (args) => this.doCurl(args),
      java: (args) => this.doJava(args),
      ifconfig: () => this.doNet(),
      hostname: () => { this.print(this.meta.host); return { ok: true }; },
      pwd: () => { this.print(this.pathString(this.cwd)); return { ok: true }; },
      whoami: () => { this.print(this.meta.user); return { ok: true }; },
      date: () => { this.print(new Date().toString()); return { ok: true }; },
      clear: () => { this.clear(); return { ok: true }; },
      echo: (args) => { this.print(args.join(' ')); return { ok: true }; },
      cd: (args) => this.doCd(args[0]),
      mkdir: (args) => this.doMkdir(args[0]),
      tree: () => this.doTree(),
      cat: (args) => this.doReadFile(args[0], 'cat'),
      touch: (args) => {
        const name = args[0];
        if (!name) return this.err('usage: touch file_name');
        if (!/^[\w.\-]+$/.test(name)) {
          return this.err('Keep file names simple: letters, numbers, dots, dashes. No spaces!');
        }
        const here = this.getNode(this.cwd);
        if (!(name in here.node.children)) here.node.children[name] = f('');
        return { ok: true, made: name };
      },
      ls: (args) => {
        let target = this.cwd;
        if (args[0]) {
          const found = this.getNode(this.resolveParts(args[0]));
          if (!found) return this.badPathError(args[0], 'ls');
          if (found.node.type === 'file') { this.print(args[0]); return { ok: true }; }
          target = found.parts;
        }
        const entries = this.listDir(this.getNode(target).node);
        if (!entries.length) { return { ok: true, empty: true }; }
        const segs = [];
        entries.forEach((e, i) => {
          segs.push({ t: e.name, c: e.isDir ? 'dir' : 'file' });
          if (i < entries.length - 1) segs.push({ t: '   ', c: '' });
        });
        this.print(segs);
        return { ok: true };
      },
    };
  }

  // ----- windows (cmd) -----

  windowsCommands() {
    return {
      ...this.eggCommands(),
      help: () => this.printHelp(),
      move: (args) => this.doMove(args[0], args[1], 'move'),
      copy: (args) => this.doCopy(args[0], args[1], 'copy'),
      del: (args) => this.doRemove(args, 'del'),
      ren: (args) => {
        if (args[1] && /[\\/]/.test(args[1])) {
          return this.err('ren renames in place — the new name cannot contain \\ or /');
        }
        return this.doMove(args[0], args[1], 'ren');
      },
      ping: (args) => this.doPing(args[0]),
      curl: (args) => this.doCurl(args),
      java: (args) => this.doJava(args),
      ipconfig: () => this.doNet(),
      hostname: () => { this.print(this.meta.host); return { ok: true }; },
      whoami: () => {
        this.print(`${this.meta.host.toLowerCase()}\\${this.meta.user.toLowerCase()}`);
        return { ok: true };
      },
      date: () => { this.print('The current date is: ' + new Date().toDateString()); return { ok: true }; },
      cls: () => { this.clear(); return { ok: true }; },
      ver: () => { this.print('Terminal Teacher Practice Windows [Version 1.0.raccoon]'); return { ok: true }; },
      echo: (args) => { this.print(args.join(' ') || 'ECHO is on.'); return { ok: true }; },
      tree: () => this.doTree(),
      type: (args) => this.doReadFile(args[0], 'type'),
      mkdir: (args) => this.doMkdir(args[0]),
      md: (args) => this.doMkdir(args[0]),
      cd: (args) => {
        if (!args.length) {
          // real cmd prints the current directory
          this.print(this.pathString(this.cwd));
          return { ok: true, printedCwd: true };
        }
        return this.doCd(args[0]);
      },
      chdir: (args) => this.windowsCommands().cd(args),
      dir: (args) => {
        let target = this.cwd;
        if (args[0]) {
          const found = this.getNode(this.resolveParts(args[0]));
          if (!found) return this.err('File Not Found');
          if (found.node.type === 'dir') target = found.parts;
          else { this.print(args[0]); return { ok: true }; }
        }
        this.print(' Directory of ' + this.pathString(target));
        this.print('');
        const entries = this.listDir(this.getNode(target).node);
        if (!entries.length) this.print('    (empty — nothing here yet!)');
        for (const e of entries) {
          this.print(e.isDir
            ? [{ t: '    <DIR>    ', c: 'info' }, { t: e.name, c: 'dir' }]
            : [{ t: '             ', c: '' }, { t: e.name, c: 'file' }]);
        }
        this.print('');
        return { ok: true };
      },
    };
  }
}
