# 🦝 Terminal Teacher

**Duolingo-style terminal lessons for kids** — led by Byte the raccoon.

A colorful, pixel-art web app that teaches the basics of the terminal on
**Linux**, **macOS**, and **Windows**. Everything runs in a **simulated
terminal** in the browser: real prompts, real error messages, real commands —
but a completely safe sandbox. Nothing on the actual computer can be touched
or broken, which makes it classroom-friendly (works great on Chromebooks too).

## Features

- 🖥️ **OS detection** — sniffs the student's system on startup and asks whether
  to learn that one or pick another. Lessons, prompts, paths, and commands all
  adapt (`ls`/`pwd`/`cat` on Linux & macOS, `dir`/`cd`/`type` on Windows).
- 📚 **8 beginner lessons** — whoami/date, pwd, ls/dir, cd, cat/type,
  mkdir, touch/echo `>`, clear/cls — each one a short daily exercise.
- ⛏️ **7 intermediate lessons** — everyday quests: rescuing a lost download
  (mv/move), backing up a Minecraft world (cp/copy), deleting junk safely
  (rm/del), ping, finding your IP (ifconfig/ipconfig) — capped by a two-part
  finale that walks through the real first steps of running a Minecraft
  server (mkdir → java -version → curl -O → EULA error → fix → launch).
- ⭐ **XP + 🔥 daily streaks** — Duolingo-style motivation, saved in
  localStorage per browser.
- ✨ **Easter eggs** — `cmatrix`, `sl`, `cowsay`, `fortune`, `tree`, unlocked
  as "secret powers" in the final lesson, plus a free-play **Fun Zone**.
- 🦝 **Byte the mascot** — a draggable, Clippy-style companion who floats
  above everything, explains, celebrates, and gently helps when a command
  goes sideways.
- 🖥️ **Retro desktop** — lessons play out on a pixel desktop: draggable,
  resizable windows with minimize/maximize, a taskbar with window buttons
  and a clock, and 8-bit sound effects (mutable). Falls back to a simple
  stacked layout on narrow screens.

## Run it (Docker)

```bash
docker run -p 8080:80 ghcr.io/adamkovic/terminal-teacher:latest
```

Then open <http://localhost:8080>. Or build locally:

```bash
docker build -t terminal-teacher .
docker run -p 8080:80 terminal-teacher
```

Pushing to `main` automatically publishes the image to GitHub Container
Registry and deploys the site to GitHub Pages (see `.github/workflows/`).

## Run it (no Docker)

```bash
python3 serve.py 4173
```

Then open <http://localhost:4173>. No build step, no dependencies.
(`serve.py` is a stock static server plus `Cache-Control: no-cache`, so
students always get the latest code after an update. Any other static
server works too if it sends sensible cache headers.)

## Project layout

```
index.html          app shell (screens, mascot, overlay)
css/style.css       pixel-art theme
js/main.js          app flow + lesson engine
js/terminal.js      simulated terminal + virtual filesystem (per OS)
js/data/lessons.js  beginner lesson content (per OS)
js/easter-eggs.js   cmatrix, sl train, cowsay, fortune
js/mascot.js        Byte's poses + speech bubble
js/progress.js      XP, streaks, completed lessons (localStorage)
assets/mascot/      Byte's pixel art poses (generated — do not edit by hand)
tools/make_mascot_assets.py   regenerates assets/mascot/ from the masters
                              in mascot/ (de-dither + sticker outline);
                              needs a Python with Pillow + numpy
```
