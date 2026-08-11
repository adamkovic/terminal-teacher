// ============================================================
// Lesson content, organized in tiers — generated per OS so the
// commands, prompts, and paths always match what the kid sees.
//
// Step types:
//   talk — Byte explains something; kid presses Continue
//   try  — kid must run a command; `accept` regex matches it,
//          optional `after(term)` verifies the result
//
// A lesson may define setup(term) — it runs when the lesson
// starts and re-seeds any files the lesson depends on, so any
// unlocked lesson can be replayed in a fresh session.
// ============================================================

const d = (children = {}) => ({ type: 'dir', children });
const f = (content = '') => ({ type: 'file', content });

// ensure home/<path parts> exists, creating dirs / a file as needed
function ensure(term, parts, fileContent = null) {
  let node = term.getNode(term.meta.home).node;
  parts.forEach((name, i) => {
    const last = i === parts.length - 1;
    const key = term.keyIn(node, name) || name;
    if (!(key in node.children)) {
      node.children[key] = (last && fileContent !== null) ? f(fileContent) : d();
    }
    node = node.children[key];
  });
}

export function getTiers(os) {
  return [
    {
      id: 'beginner',
      title: 'Beginner Path',
      sub: 'First steps — the magic words every explorer needs.',
      lessons: beginnerLessons(os),
    },
    {
      id: 'intermediate',
      title: 'Intermediate Path',
      sub: 'Everyday quests — ending with a real Minecraft server! ⛏️',
      lessons: intermediateLessons(os),
    },
  ];
}

// ============================================================
// BEGINNER
// ============================================================

function beginnerLessons(os) {
  const u = os !== 'windows';                       // unix-like?
  const HOME = os === 'linux' ? '/home/student'
             : os === 'macos' ? '/Users/student'
             : 'C:\\Users\\Student';
  const LS = u ? 'ls' : 'dir';
  const CAT = u ? 'cat' : 'type';
  const CLEAR = u ? 'clear' : 'cls';
  const SHELL = os === 'macos' ? 'zsh' : os === 'linux' ? 'bash' : 'Command Prompt';

  // windows commands are case-insensitive; unix are not
  const rx = (pattern) => new RegExp(pattern, u ? '' : 'i');

  return [

    // ---------------- 1 ----------------
    {
      id: 'meet',
      icon: '👋',
      title: 'Meet the Terminal',
      desc: 'Say hello to the magic box.',
      xp: 10,
      steps: [
        { type: 'talk', pose: 'greeting',
          text: `Hi! I'm **Byte**! 🦝 This dark box next to me is a **terminal** — a place where you type instructions and the computer obeys. No mouse, no buttons. Just magic words!` },
        { type: 'talk', pose: 'explaining',
          text: `See the blinking cursor in the terminal? It's waiting for YOU. Don't worry — this is a practice terminal. You literally cannot break anything. Let's make the computer talk!` },
        { type: 'try', pose: 'thinking',
          text: 'Click the terminal, type `whoami` and press **Enter**. It asks the computer: "who is logged in right now?"',
          accept: rx('^whoami$'),
          hint: 'Type exactly: `whoami` — all one word, all lowercase — then press Enter.',
          success: 'The computer answered! That\'s YOUR username. It knows you! 👀' },
        { type: 'try', pose: 'explaining',
          text: 'Computers are also excellent clocks. Type `date` and press Enter.',
          accept: rx('^date$'),
          hint: 'Just the word `date`, then Enter!',
          success: 'Boom — the exact date and time. No calendar app needed!' },
        { type: 'talk', pose: 'great-job',
          text: `You just ran **two real commands**. This is exactly what professional programmers do all day. Welcome to the club! 🎉` },
      ],
    },

    // ---------------- 2 ----------------
    {
      id: 'where',
      icon: '📍',
      title: 'Where Am I?',
      desc: 'Folders are rooms. Find your room!',
      xp: 10,
      steps: [
        { type: 'talk', pose: 'explaining',
          text: `Your computer is like a giant **house** 🏠. Every **folder** is a room, and rooms can have smaller rooms inside. When you use a terminal, you're always *standing* in one folder.` },
        u
        ? { type: 'try', pose: 'thinking',
            text: 'So... where are we standing right now? Type `pwd` — it means **p**rint **w**orking **d**irectory (directory = folder).',
            accept: rx('^pwd$'),
            hint: 'Type `pwd` and press Enter. Three little letters!',
            success: `That's your address in the computer-house: \`${HOME}\`. It's called your **home folder**.` }
        : { type: 'try', pose: 'thinking',
            text: 'So... where are we standing right now? On Windows, type `cd` all by itself and press Enter — it shows your current folder.',
            accept: rx('^cd$'),
            hint: 'Just type `cd` with nothing after it, then Enter.',
            success: `That's your address in the computer-house: \`${HOME}\`. It's called your **home folder**.` },
        { type: 'talk', pose: 'inspecting',
          text: `Read it like a treasure map: ${u ? `\`${HOME}\` means: start at the very bottom of the house, go into \`${HOME.split('/')[1]}\`, then into your room, \`${HOME.split('/')[2]}\`.` : `\`${HOME}\` means: start on drive \`C:\`, go into \`Users\`, then into your room, \`Student\`.`} Every slash is a doorway! 🚪` },
      ],
    },

    // ---------------- 3 ----------------
    {
      id: 'look',
      icon: '👀',
      title: 'Look Around',
      desc: 'What\'s inside this room?',
      xp: 15,
      steps: [
        { type: 'talk', pose: 'explaining',
          text: `You're standing in your home folder... but what's IN here? Time for X-ray vision. ${u ? 'The command `ls` means **l**i**s**t everything here.' : 'The command `dir` lists the **dir**ectory — everything in this room.'}` },
        { type: 'try', pose: 'thinking',
          text: `Type \`${LS}\` and press Enter to look around.`,
          accept: u ? rx('^ls$') : rx('^dir$'),
          hint: `Type \`${LS}\` — that's it! — and press Enter.`,
          success: `See those? \`Desktop\`, \`Documents\`, \`Games\`... ${u ? 'The teal ones are folders (rooms you can enter).' : 'The ones marked <DIR> are folders (rooms you can enter).'}` },
        { type: 'try', pose: 'inspecting',
          text: `You can peek inside a room WITHOUT entering it. Type \`${LS} Documents\` — careful, the capital **D** matters!`,
          accept: u ? rx('^ls\\s+Documents$') : rx('^dir\\s+Documents$'),
          hint: `Type \`${LS}\`, then a space, then \`Documents\` with a capital D.`,
          success: 'Sneaky! 🕵️ There are files in there... one is called `welcome.txt`. We should read that soon!' },
        { type: 'talk', pose: 'good-job',
          text: `Awesome! Now you can always answer two big questions: *"Where am I?"* and *"What's in here?"* Those two commands are a terminal explorer's best friends.` },
      ],
    },

    // ---------------- 4 ----------------
    {
      id: 'move',
      icon: '🚪',
      title: 'Moving Around',
      desc: 'Walk from room to room.',
      xp: 15,
      steps: [
        { type: 'talk', pose: 'explaining',
          text: `Time to actually WALK through a doorway. The command \`cd\` means **c**hange **d**irectory. It's how you move between rooms.` },
        { type: 'try', pose: 'thinking',
          text: 'Type `cd Documents` to step into the Documents room. (Capital D!)',
          accept: rx('^cd\\s+Documents$'),
          hint: '`cd`, space, `Documents`. Watch that capital D!',
          success: `You moved! ${u ? 'Notice the prompt changed — it now shows `~/Documents`.' : 'Notice the prompt changed — it now ends with `\\Documents`.'}` },
        u
        ? { type: 'try', pose: 'inspecting',
            text: 'Prove it — type `pwd` to see your new address.',
            accept: rx('^pwd$'),
            hint: 'Remember lesson 2? Type `pwd`!',
            success: 'Yep — you\'re really standing in `Documents` now.' }
        : { type: 'try', pose: 'inspecting',
            text: 'Prove it — type `cd` (by itself) to see your new address.',
            accept: rx('^cd$'),
            hint: 'Remember lesson 2? Type `cd` with nothing after it!',
            success: 'Yep — you\'re really standing in `Documents` now.' },
        { type: 'try', pose: 'explaining',
          text: 'To go BACK to the room above you, type `cd ..` — those two dots mean "the parent folder".',
          accept: rx('^cd\\s+\\.\\.$'),
          hint: '`cd`, space, then two dots: `..`',
          success: 'And you\'re back home! `..` always means "up one level". Super useful.' },
        u
        ? { type: 'try', pose: 'thinking',
            text: 'One more trick: from ANYWHERE, typing `cd` all by itself teleports you home. Try it!',
            accept: rx('^cd$'),
            hint: 'Just `cd`, nothing else!',
            success: 'Instant teleport! 🏠 You can never get lost — home is one `cd` away.' }
        : { type: 'try', pose: 'thinking',
            text: 'Practice once more: type `cd Documents` to step in again — moving around should feel easy!',
            accept: rx('^cd\\s+Documents$'),
            hint: '`cd`, space, `Documents`.',
            success: 'Look at you go! In... out... you\'re a folder ninja now. 🥷' },
        { type: 'talk', pose: 'great-job',
          text: `That's the big three: *where am I*, *what's here*, and *let's go*. With those you can explore ANY computer on Earth. Not kidding!` },
      ],
    },

    // ---------------- 5 ----------------
    {
      id: 'read',
      icon: '📜',
      title: 'Read a Secret Note',
      desc: 'Open files without clicking anything.',
      xp: 15,
      steps: [
        { type: 'talk', pose: 'explaining',
          text: `Remember that \`welcome.txt\` we spotted in Documents? Someone left it for you... 👀 Let's go read it. The command \`${CAT}\` prints a file's contents right onto the screen.` },
        { type: 'try', pose: 'thinking',
          text: 'First, walk into the room: `cd Documents`',
          accept: rx('^cd\\s+Documents$'),
          hint: '`cd`, space, `Documents` — capital D!',
          success: 'In we go...' },
        { type: 'try', pose: 'inspecting',
          text: `Now read the note: \`${CAT} welcome.txt\``,
          accept: u ? rx('^cat\\s+welcome\\.txt$') : rx('^type\\s+welcome\\.txt$'),
          hint: `Type \`${CAT}\`, space, \`welcome.txt\` — don't forget the \`.txt\` part!`,
          success: 'A secret message! 🦝 (I may have written that myself.)' },
        { type: 'try', pose: 'laughing',
          text: `There's another file here called \`jokes.txt\`. You know what to do...`,
          accept: u ? rx('^cat\\s+jokes\\.txt$') : rx('^type\\s+jokes\\.txt$'),
          hint: `\`${CAT} jokes.txt\``,
          success: 'A hobbyte!! 😂 Okay okay, back to work.' },
        { type: 'talk', pose: 'good-job',
          text: `You can now read any text file on a computer without opening a single window. ${u ? '(`cat` is short for con**cat**enate — a fancy word for sticking text together.)' : '(`type` shows what\'s typed inside a file. Makes sense, right?)'}` },
      ],
    },

    // ---------------- 6 ----------------
    {
      id: 'build',
      icon: '🏗️',
      title: 'Build a Clubhouse',
      desc: 'Make your very own folder.',
      xp: 15,
      steps: [
        { type: 'talk', pose: 'explaining',
          text: `So far we've explored rooms other people built. Time to build YOUR OWN. The command \`mkdir\` means **m**a**k**e **dir**ectory — it builds a brand-new folder.` },
        u
        ? { type: 'try', pose: 'thinking',
            text: 'First head home — type `cd` by itself.',
            accept: rx('^cd$'),
            hint: 'Just `cd` on its own teleports you home!',
            success: 'Home sweet home.' }
        : { type: 'try', pose: 'thinking',
            text: `First head home — type \`cd ${'\\'}Users${'\\'}Student\``,
            accept: rx('^cd\\s+\\\\?Users\\\\Student$'),
            hint: `Type \`cd ${'\\'}Users${'\\'}Student\` — those are backslashes, usually above the Enter key.`,
            success: 'Home sweet home.' },
        { type: 'try', pose: 'explaining',
          text: 'Now build it! Type `mkdir clubhouse` to make a folder named clubhouse.',
          accept: rx('^(mkdir|md)\\s+clubhouse$'),
          after: (term) => !!term.getNode([...term.meta.home, 'clubhouse']),
          hint: '`mkdir`, space, `clubhouse` (all lowercase, no spaces in the name).',
          success: 'You just built a folder with your bare hands! 🔨 But wait — did it work?' },
        { type: 'try', pose: 'inspecting',
          text: `Check your work: type \`${LS}\` and look for your new folder.`,
          accept: u ? rx('^ls$') : rx('^dir$'),
          hint: `Type \`${LS}\` to list this folder.`,
          success: 'There it is — `clubhouse`, sitting right next to Documents. It\'s real!' },
        { type: 'try', pose: 'thinking',
          text: 'Now step inside your creation: `cd clubhouse`',
          accept: rx('^cd\\s+clubhouse$'),
          hint: '`cd`, space, `clubhouse`.',
          success: 'Welcome to YOUR clubhouse. No grown-ups allowed. 🚫🧑‍🦳' },
        { type: 'talk', pose: 'great-job',
          text: `Builders build! Every project, game, and app ever made started with someone making a folder — exactly like you just did.` },
      ],
    },

    // ---------------- 7 ----------------
    {
      id: 'create',
      icon: '✏️',
      title: 'Make Your Mark',
      desc: 'Create files of your very own.',
      xp: 15,
      steps: [
        { type: 'talk', pose: 'explaining',
          text: `A clubhouse needs stuff in it! Today you'll create **files** — ${u ? 'with `touch` (makes an empty file) and a neat `echo` trick.' : 'with a neat `echo` trick that writes words straight into a file.'}` },
        { type: 'try', pose: 'thinking',
          text: 'Head into your clubhouse: `cd clubhouse` (if it\'s gone, build it again with `mkdir clubhouse` first!)',
          accept: rx('^cd\\s+clubhouse$'),
          hint: 'If `cd clubhouse` fails, run `mkdir clubhouse` first, then `cd clubhouse`.',
          success: 'Inside! Let\'s decorate.' },
        ...(u ? [
        { type: 'try', pose: 'explaining',
          text: 'Type `touch flag.txt` — `touch` creates a brand-new empty file.',
          accept: rx('^touch\\s+flag\\.txt$'),
          after: (term) => !!term.getNode([...term.cwd, 'flag.txt']),
          hint: '`touch`, space, `flag.txt`.',
          success: 'A file is born! (It\'s empty, like a blank piece of paper.)' },
        ] : []),
        { type: 'try', pose: 'explaining',
          text: 'Now the magic trick — type `echo I was here > sign.txt` — the `>` arrow shoots your words INTO a file!',
          accept: rx('^echo\\s+.+>\\s*sign\\.txt$'),
          after: (term) => !!term.getNode([...term.cwd, 'sign.txt']),
          hint: 'Type `echo`, then your message, then `> sign.txt`. Example: `echo I was here > sign.txt`',
          success: 'Words, captured in a file! The `>` arrow means "put it in there instead of on screen".' },
        { type: 'try', pose: 'inspecting',
          text: `Did it really save your words? Read it back: \`${CAT} sign.txt\``,
          accept: u ? rx('^cat\\s+sign\\.txt$') : rx('^type\\s+sign\\.txt$'),
          hint: `\`${CAT} sign.txt\``,
          success: 'Your own words, stored on the computer, written and read entirely by command. ✍️' },
        { type: 'try', pose: 'thinking',
          text: `Take a proud look at everything you made: \`${LS}\``,
          accept: u ? rx('^ls$') : rx('^dir$'),
          hint: `Just \`${LS}\`!`,
          success: 'A whole clubhouse of your OWN files. You made all of that with words!' },
        { type: 'talk', pose: 'great-job',
          text: `Creating folders ✅ Creating files ✅ Writing into them ✅ — you're not just visiting the computer anymore. You're building in it.` },
      ],
    },

    // ---------------- 8 ----------------
    {
      id: 'secret',
      icon: '✨',
      title: 'Secret Powers',
      desc: 'Graduation day — unlock the fun stuff!',
      xp: 20,
      steps: [
        { type: 'talk', pose: 'explaining',
          text: `Final beginner lesson! First, a tidy-up trick. Your screen is full of old text. Type-masters keep it clean...` },
        { type: 'try', pose: 'thinking',
          text: `Type \`${CLEAR}\` to wipe the screen sparkling clean.`,
          accept: u ? rx('^clear$') : rx('^cls$'),
          hint: `Type \`${CLEAR}\` and press Enter.`,
          success: 'Ahhh. Fresh and clean. ✨' },
        { type: 'talk', pose: 'laughing',
          text: `Now... you've earned this. Terminals are full of **secret toys** that programmers hide for fun. ${u ? '' : '(On real Windows you\'d install these first — in my dojo, they\'re always ready.)'} Let me show you.` },
        { type: 'try', pose: 'explaining',
          text: 'Type `cowsay Hello world` — or make the cow say anything you want!',
          accept: rx('^cowsay\\s+.+$'),
          hint: '`cowsay`, space, then any message. Try `cowsay I am learning!`',
          success: 'A talking cow. In a terminal. This is 100% a real program on real computers. 🐮' },
        { type: 'try', pose: 'thinking',
          text: 'Crack open a fortune cookie: type `fortune`',
          accept: rx('^fortune$'),
          hint: 'Just `fortune`!',
          success: 'Wise words! Run it again later — it always has a new one.' },
        { type: 'try', pose: 'shocked',
          text: 'Ready for the coolest one? Type `cmatrix` ... and when you\'ve seen enough, press `q` to escape.',
          accept: rx('^cmatrix$'),
          hint: 'Type `cmatrix` and press Enter. Press `q` when you want out!',
          success: 'THE MATRIX! 🟩 You looked like a movie hacker just now. I saw it.' },
        { type: 'talk', pose: 'great-job',
          text: `🎓 **BEGINNER PATH COMPLETE!** You speak ${SHELL} now! The **Fun Zone** is open — and you're officially ready for the **Intermediate** level: real-life quests, ending with your own Minecraft server. 🔥` },
      ],
    },
  ];
}

// ============================================================
// INTERMEDIATE — everyday scenarios
// ============================================================

function intermediateLessons(os) {
  const u = os !== 'windows';
  const LS = u ? 'ls' : 'dir';
  const CAT = u ? 'cat' : 'type';
  const MV = u ? 'mv' : 'move';
  const CP = u ? 'cp' : 'copy';
  const RM = u ? 'rm' : 'del';
  const NET = u ? 'ifconfig' : 'ipconfig';
  const SEP = u ? '/' : '\\';
  const rx = (pattern) => new RegExp(pattern, u ? '' : 'i');
  const sep = '[\\\\/]';   // accept / or \ in paths on both systems

  return [

    // ---------------- 9 ----------------
    {
      id: 'moving-day',
      icon: '📦',
      title: 'Moving Day',
      desc: 'A homework file is lost in Downloads. Rescue it!',
      xp: 20,
      setup: (term) => {
        ensure(term, ['Downloads', 'homework-draft.txt'],
          'My Essay About Raccoons\n(they are the best animal, the end)');
        ensure(term, ['Documents', 'homework']);
      },
      steps: [
        { type: 'talk', pose: 'explaining',
          text: `Classic everyday mess: you saved your essay... and it landed in **Downloads** with all the other random stuff. 🙈 The command \`${MV}\` **moves** a file from one place to another. Let's rescue that homework.` },
        { type: 'try', pose: 'thinking',
          text: 'Head to the scene: `cd Downloads`',
          accept: rx('^cd\\s+Downloads$'),
          hint: '`cd`, space, `Downloads` — capital D!',
          success: 'There\'s the mess...' },
        { type: 'try', pose: 'inspecting',
          text: `Look around with \`${LS}\` — can you spot \`homework-draft.txt\`?`,
          accept: u ? rx('^ls$') : rx('^dir$'),
          hint: `Just \`${LS}\`!`,
          success: 'There it is, stuck between junk files. Let\'s get it out of here.' },
        { type: 'try', pose: 'explaining',
          text: `Now the rescue: \`${MV} homework-draft.txt ..${SEP}Documents${SEP}homework\` — that means "move this file UP one level, then into Documents, then into homework".`,
          accept: rx(`^${MV}\\s+homework-draft\\.txt\\s+\\.\\.${sep}Documents${sep}homework$`),
          after: (term) => !!term.getNode([...term.meta.home, 'Documents', 'homework', 'homework-draft.txt']),
          hint: `Type \`${MV}\`, the file name, then the path: \`..${SEP}Documents${SEP}homework\` — the \`..\` means "up one level".`,
          success: 'One command, and the file teleported across three folders! 📦✨' },
        { type: 'try', pose: 'thinking',
          text: `Go check your work: \`cd ..${SEP}Documents${SEP}homework\``,
          accept: rx(`^cd\\s+\\.\\.${sep}Documents${sep}homework$`),
          hint: `\`cd ..${SEP}Documents${SEP}homework\` — same path you just moved the file to.`,
          success: 'Walking multiple doorways in ONE command now. Big-kid moves.' },
        { type: 'try', pose: 'explaining',
          text: `\`${MV}\` has a second power: **renaming**. "Draft"? This essay is DONE. Type ${u ? '`mv homework-draft.txt essay-final.txt`' : '`ren homework-draft.txt essay-final.txt`'}`,
          accept: u ? rx('^mv\\s+homework-draft\\.txt\\s+essay-final\\.txt$') : rx('^ren\\s+homework-draft\\.txt\\s+essay-final\\.txt$'),
          after: (term) => !!term.getNode([...term.cwd, 'essay-final.txt']),
          hint: u ? '`mv old-name new-name` renames a file: `mv homework-draft.txt essay-final.txt`' : '`ren old-name new-name` renames a file: `ren homework-draft.txt essay-final.txt`',
          success: 'Renamed! Moving and renaming — same tool. 🏷️' },
        { type: 'talk', pose: 'proud',
          text: `Real talk: "where did my download go?" is one of the most common computer problems on Earth. You can now FIX it from the terminal. Grown-ups will be impressed.` },
      ],
    },

    // ---------------- 10 ----------------
    {
      id: 'copy-that',
      icon: '💾',
      title: 'Copy That',
      desc: 'Back up a Minecraft world before it\'s too late.',
      xp: 20,
      setup: (term) => {
        ensure(term, ['Games', 'minecraft', 'my-world.dat'],
          '⛏ [world data] 100% diamonds (definitely)');
      },
      steps: [
        { type: 'talk', pose: 'worried',
          text: `Imagine: your Minecraft world — the one with the diamond castle — gets corrupted. 😱 Gone. Unless... you made a **backup**. The command \`${CP}\` copies a file, so let's protect that world RIGHT NOW.` },
        { type: 'try', pose: 'thinking',
          text: `The world file lives deep in your folders. Get there in one hop: \`cd Games${SEP}minecraft\``,
          accept: rx(`^cd\\s+Games${sep}minecraft$`),
          hint: `\`cd Games${SEP}minecraft\` — two doorways, one command.`,
          success: 'Deep in the game files. This is where the treasure is kept.' },
        { type: 'try', pose: 'inspecting',
          text: `Peek with \`${LS}\` — see \`my-world.dat\`? That's an ENTIRE world in one file.`,
          accept: u ? rx('^ls$') : rx('^dir$'),
          hint: `\`${LS}\`!`,
          success: 'A whole world of builds in one little file. Precious cargo.' },
        { type: 'try', pose: 'explaining',
          text: `Make the backup: \`${CP} my-world.dat my-world-backup.dat\` — that's "${CP === 'cp' ? 'copy' : 'copy'}: this file, to this new name".`,
          accept: rx(`^${CP}\\s+my-world\\.dat\\s+my-world-backup\\.dat$`),
          after: (term) => !!term.getNode([...term.cwd, 'my-world-backup.dat']),
          hint: `\`${CP}\`, space, \`my-world.dat\`, space, \`my-world-backup.dat\`.`,
          success: 'BACKED UP! 🛡️ Now a creeper can blow up the original and you\'ll still have every diamond.' },
        { type: 'try', pose: 'thinking',
          text: `Trust, but verify: \`${LS}\` — are there two world files now?`,
          accept: u ? rx('^ls$') : rx('^dir$'),
          hint: `\`${LS}\` one more time!`,
          success: 'Original AND backup, side by side. That\'s how the pros sleep at night.' },
        { type: 'talk', pose: 'proud',
          text: `Rule of the wise: **anything you'd cry about losing gets a copy.** Worlds, essays, drawings. One \`${CP}\` command = zero tears later. 🛡️` },
      ],
    },

    // ---------------- 11 ----------------
    {
      id: 'trash-day',
      icon: '🗑️',
      title: 'Take Out the Trash',
      desc: 'Delete junk files — carefully. Very carefully.',
      xp: 20,
      setup: (term) => {
        ensure(term, ['Downloads', 'old-meme.tmp'], JUNKY);
        ensure(term, ['Downloads', 'blurry-photo-1.tmp'], JUNKY);
      },
      steps: [
        { type: 'talk', pose: 'worried',
          text: `Today's tool is powerful, so listen up: \`${RM}\` **deletes files**. And here's the thing — in the terminal there is **NO trash can**. No undo. Deleted means GONE. Forever. 😨` },
        { type: 'talk', pose: 'explaining',
          text: `That's why terminal pros follow one rule: **read the name twice, delete once.** Your Downloads folder has two junk \`.tmp\` files cluttering it up. Let's practice on those — they're truly worthless, I checked.` },
        { type: 'try', pose: 'thinking',
          text: 'Go to the junk drawer: `cd Downloads`',
          accept: rx('^cd\\s+Downloads$'),
          hint: '`cd Downloads`',
          success: 'Mess located.' },
        { type: 'try', pose: 'inspecting',
          text: `\`${LS}\` — spot the two files ending in \`.tmp\`? Those are leftovers programs forgot to clean up.`,
          accept: u ? rx('^ls$') : rx('^dir$'),
          hint: `\`${LS}\`!`,
          success: '`old-meme.tmp` and `blurry-photo-1.tmp`. Confirmed junk. Say your goodbyes.' },
        { type: 'try', pose: 'explaining',
          text: `Read it twice... then: \`${RM} old-meme.tmp\``,
          accept: rx(`^${RM}\\s+old-meme\\.tmp$`),
          after: (term) => !term.getNode([...term.cwd, 'old-meme.tmp']),
          hint: `\`${RM}\`, space, \`old-meme.tmp\` — spelled exactly.`,
          success: 'Gone. Not in a trash can — GONE gone. Feel the power? Respect the power. 🫡' },
        { type: 'try', pose: 'thinking',
          text: `One more: \`${RM} blurry-photo-1.tmp\``,
          accept: rx(`^${RM}\\s+blurry-photo-1\\.tmp$`),
          after: (term) => !term.getNode([...term.cwd, 'blurry-photo-1.tmp']),
          hint: `\`${RM} blurry-photo-1.tmp\``,
          success: 'And the other one. So tidy!' },
        { type: 'try', pose: 'inspecting',
          text: `Admire the clean room: \`${LS}\``,
          accept: u ? rx('^ls$') : rx('^dir$'),
          hint: `\`${LS}\`!`,
          success: 'Sparkling. ✨' },
        { type: 'talk', pose: 'proud',
          text: `You wielded the delete command and nothing precious was harmed. Remember the rule forever: **read twice, delete once** — and never delete what you didn't recognize.` },
      ],
    },

    // ---------------- 12 ----------------
    {
      id: 'ping',
      icon: '📡',
      title: 'Is Anyone Out There?',
      desc: 'Send a sonar ping across the network.',
      xp: 20,
      steps: [
        { type: 'talk', pose: 'explaining',
          text: `New superpower: talking to OTHER computers. 🌐 Every computer on a network has an address, and \`ping\` is like sonar — it shouts *"are you there?!"* and waits for the echo.` },
        { type: 'try', pose: 'thinking',
          text: 'Try it on my school server: `ping byte.school` — then watch the replies roll in.',
          accept: rx('^ping\\s+byte\\.school$'),
          hint: '`ping`, space, `byte.school`',
          success: 'Four shouts, four echoes! The server is alive and answering.' },
        { type: 'talk', pose: 'inspecting',
          text: `See \`time=18 ms\` in the replies? That's the round trip in **milliseconds** — thousandths of a second. Your shout crossed the network and came back faster than a blink. ⚡` },
        { type: 'try', pose: 'explaining',
          text: `Computers also answer on their number-address. Pretend your friend's computer is at \`192.168.1.77\` — ping it!`,
          accept: rx('^ping\\s+192\\.168\\.1\\.77$'),
          hint: '`ping 192.168.1.77`',
          success: 'Your friend\'s computer answered! (In here, it\'s always home. 😄)' },
        { type: 'talk', pose: 'good-job',
          text: `Those number-addresses are called **IP addresses** — every computer has one, like a house number on a street. "Can I ping it?" is the FIRST question every network wizard asks when something's broken.` },
      ],
    },

    // ---------------- 13 ----------------
    {
      id: 'my-address',
      icon: '🏠',
      title: 'What\'s My Address?',
      desc: 'Find your computer\'s address on the network.',
      xp: 20,
      steps: [
        { type: 'talk', pose: 'explaining',
          text: `You can ping OTHER computers... but what about the reverse? If a friend wants to connect to **YOUR** computer — say, for a Minecraft server 👀 — they need YOUR address. Let's find it.` },
        { type: 'try', pose: 'thinking',
          text: `Type \`${NET}\` — it lists your network info. Look for the line with \`192.168...\``,
          accept: rx(`^${NET}$`),
          hint: `Just \`${NET}\` and Enter.`,
          success: 'Found it: `192.168.1.42` — that\'s YOU on your home network!' },
        { type: 'talk', pose: 'inspecting',
          text: `Addresses starting with \`192.168.\` are **local** — they only work inside your own network, like room numbers inside one school. Perfect for friends on the same WiFi.` },
        { type: 'try', pose: 'explaining',
          text: 'Computers have names too, not just numbers. Type `hostname` to see yours.',
          accept: rx('^hostname$'),
          hint: '`hostname` — all one word.',
          success: 'That\'s your computer\'s name tag on the network. 🏷️' },
        { type: 'talk', pose: 'proud',
          text: `Write it on your paw: **192.168.1.42**. In the next two lessons you're going to build something your friends connect to at that exact address... ⛏️` },
      ],
    },

    // ---------------- 14 ----------------
    {
      id: 'server-setup',
      icon: '⛏️',
      title: 'Minecraft Server: Setup',
      desc: 'The big project begins — get the server file.',
      xp: 25,
      steps: [
        { type: 'talk', pose: 'hey-cool',
          text: `THE BIG ONE. 🎉 Your friend says: *"can we run our own Minecraft server?"* — and YOU know enough terminal to actually do it. Today: make a home for the server and download it. For real, this is how it's done.` },
        { type: 'try', pose: 'thinking',
          text: 'Projects get their own folder. Head home first: `cd`' + (u ? '' : ' `\\Users\\Student`'),
          accept: u ? rx('^cd$') : rx('^cd\\s+\\\\?Users\\\\Student$'),
          hint: u ? 'Just `cd` teleports home!' : 'Type `cd \\Users\\Student`',
          success: 'Home base.' },
        { type: 'try', pose: 'explaining',
          text: 'Build the project folder: `mkdir minecraft-server`',
          accept: rx('^(mkdir|md)\\s+minecraft-server$'),
          after: (term) => !!term.getNode([...term.meta.home, 'minecraft-server']),
          hint: '`mkdir minecraft-server` — with the dash, no spaces.',
          success: 'A home for the server.' },
        { type: 'try', pose: 'thinking',
          text: 'Step inside: `cd minecraft-server`',
          accept: rx('^cd\\s+minecraft-server$'),
          hint: '`cd minecraft-server`',
          success: 'This folder is about to get interesting.' },
        { type: 'try', pose: 'inspecting',
          text: 'Minecraft servers run on **Java**. Check it\'s ready: `java -version`',
          accept: rx('^java\\s+(-|--)version$'),
          hint: '`java -version` — with the dash!',
          success: 'Java is installed and ready. (On a friend\'s real computer, this check is ALWAYS step one!)' },
        { type: 'try', pose: 'explaining',
          text: 'Now download the server program straight from the terminal: `curl -O https://mc.example.com/server.jar` — watch the progress bar!',
          accept: rx('^curl\\s+-O\\s+https://mc\\.example\\.com/server\\.jar$'),
          hint: '`curl`, space, `-O` (capital O!), space, the address: `https://mc.example.com/server.jar`',
          success: 'You just downloaded a file with a COMMAND. No browser needed. 😎' },
        { type: 'try', pose: 'thinking',
          text: `Make sure it arrived: \`${LS}\``,
          accept: u ? rx('^ls$') : rx('^dir$'),
          after: (term) => !!term.getNode([...term.cwd, 'server.jar']),
          hint: `\`${LS}\` — you should see \`server.jar\`.`,
          success: '`server.jar` — 47 MB of Minecraft server, sitting in YOUR folder.' },
        { type: 'talk', pose: 'proud',
          text: `Setup complete: project folder ✅ Java checked ✅ server downloaded ✅. Next lesson: we **launch it**. (Come back tomorrow for the streak... or do it right now. I won't tell.) 🔥` },
      ],
    },

    // ---------------- 15 ----------------
    {
      id: 'server-launch',
      icon: '🚀',
      title: 'Minecraft Server: Launch!',
      desc: 'Rules, fixes, and LIFT-OFF.',
      xp: 30,
      setup: (term) => {
        ensure(term, ['minecraft-server', 'server.jar'],
          '[minecraft server program bytes — 47 MB of them]');
      },
      steps: [
        { type: 'talk', pose: 'hey-cool',
          text: `Launch day. 🚀 Fair warning: the first launch **never works** — and that's on purpose! You'll hit a real error, read it, and fix it like a pro. Ready?` },
        { type: 'try', pose: 'thinking',
          text: 'Into the project: `cd minecraft-server`',
          accept: rx('^cd\\s+minecraft-server$'),
          hint: '`cd minecraft-server` (from home — type `cd` first if you\'re lost).',
          success: 'On the launchpad.' },
        { type: 'try', pose: 'explaining',
          text: 'Fire it up: `java -jar server.jar` — this means "Java, run this program".',
          accept: rx('^java\\s+-jar\\s+server\\.jar$'),
          after: (term) => !!term.getNode([...term.cwd, 'eula.txt']),
          hint: '`java`, space, `-jar`, space, `server.jar`.',
          success: '...and it REFUSED. Perfect! Read the message — it says to look at `eula.txt`.' },
        { type: 'try', pose: 'inspecting',
          text: `The server left a note explaining itself. Read it: \`${CAT} eula.txt\``,
          accept: u ? rx('^cat\\s+eula\\.txt$') : rx('^type\\s+eula\\.txt$'),
          hint: `\`${CAT} eula.txt\``,
          success: 'See it? `eula=false`. The EULA is the game\'s rulebook — the server won\'t start until someone agrees to the rules.' },
        { type: 'try', pose: 'explaining',
          text: 'You know a trick for writing into files... Type `echo eula=true > eula.txt` to agree!',
          accept: rx('^echo\\s+eula\\s*=\\s*true\\s*>\\s*eula\\.txt$'),
          after: (term) => {
            const t = term.getNode([...term.cwd, 'eula.txt']);
            return t && /eula\s*=\s*true/i.test(t.node.content);
          },
          hint: '`echo eula=true > eula.txt` — the `>` arrow from the beginner lessons!',
          success: 'Rules accepted, in writing. That was a REAL error fixed by READING it. Most grown-ups skip that part.' },
        { type: 'try', pose: 'shocked',
          text: 'Moment of truth. Launch again: `java -jar server.jar`',
          accept: rx('^java\\s+-jar\\s+server\\.jar$'),
          hint: 'Same as before: `java -jar server.jar`',
          success: 'IT\'S ALIVE!! Look at that startup log roll!! 🎆' },
        { type: 'talk', pose: 'great-job',
          text: `🏆 **INTERMEDIATE PATH COMPLETE!** Folder → Java check → download → error → fix → **launch**. Those are the honest-to-goodness first steps of running a Minecraft server, and you just did every one. Tell your friends to meet you at \`192.168.1.42:25565\`. ⛏️🎉` },
      ],
    },
  ];
}

const JUNKY = '◒▓▒ corrupted junk ▒▓◒';
