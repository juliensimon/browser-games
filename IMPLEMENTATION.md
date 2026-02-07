# Implementation Guide

Lessons learned and patterns established across the browser-games project. This document captures what works, what to avoid, and architectural decisions for efficiently building future games.

## Project Conventions

### File Structure

Every game follows a strict 3-file structure:

```
game-name/
├── index.html          # Minimal HTML shell (~13 lines)
├── style.css           # Layout only (~24 lines)
├── game.js             # All game logic (1500-2500 lines)
├── README.md           # History, controls, features, technical details
└── screenshots/
    ├── attract-screen.png
    └── gameplay.png
```

No build step. No dependencies. No asset files. Everything is procedurally generated — sprites are defined as 2D arrays of 0/1, sounds are synthesized via Web Audio API.

### game.js Section Order

Every `game.js` follows the same 10-section architecture:

| # | Section | Purpose | Typical Size |
|---|---------|---------|-------------|
| 1 | **CONFIG** | Frozen object with all tunable constants | 60-80 lines |
| 2 | **Math Utilities** | Collision checks, clamping, vector math | 20-40 lines |
| 3 | **Sprite / Shape Data** | Visual data (2D pixel arrays or vertex lists) | 150-300 lines |
| 4 | **Sound Engine** | Web Audio API procedural synthesis | 150-200 lines |
| 5 | **Input Handler** | Keyboard state with just-pressed tracking | 40-60 lines |
| 6 | **Entity Classes** | Game objects (player, enemies, projectiles) | 300-500 lines |
| 7 | **Collision System** | Hit detection, damage application | 100-200 lines |
| 8 | **Renderer** | Canvas drawing, HUD, screen effects | 300-500 lines |
| 9 | **Game State Machine** | State transitions, game logic orchestration | 400-600 lines |
| 10 | **Main Loop & Bootstrap** | Fixed-timestep loop, DOM setup | 25-35 lines |

This order ensures each section only depends on sections above it — no forward references.

### CONFIG Object

All magic numbers go here. Use `Object.freeze()`. Naming convention: `SCREAMING_SNAKE_CASE`.

```javascript
const CONFIG = Object.freeze({
    LOGICAL_WIDTH: 224,      // Game's internal resolution
    LOGICAL_HEIGHT: 256,
    SCALE: 3,                // Integer multiplier for crisp pixels
    WIDTH: 672,              // LOGICAL_WIDTH * SCALE
    HEIGHT: 768,             // LOGICAL_HEIGHT * SCALE
    FPS: 60,
    FRAME_TIME: 1000 / 60,
    MAX_DELTA: 200,          // Clamp to prevent spiral after tab-away
    // ... all other constants
});
```

Always compute derived values inline (e.g., `WIDTH: 672` not `WIDTH: LOGICAL_WIDTH * SCALE` — the latter fails inside `Object.freeze`).

### Main Loop Pattern

Every game uses the same fixed-timestep accumulator:

```javascript
let lastTime = performance.now();
let accumulator = 0;

function gameLoop(timestamp) {
    let delta = timestamp - lastTime;
    lastTime = timestamp;
    if (delta > CONFIG.MAX_DELTA) delta = CONFIG.MAX_DELTA;
    accumulator += delta;
    while (accumulator >= CONFIG.FRAME_TIME) {
        game.update();
        accumulator -= CONFIG.FRAME_TIME;
    }
    game.render();
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
```

This gives deterministic 60Hz physics regardless of display refresh rate. The `MAX_DELTA` clamp prevents the accumulator from spiraling when the user switches tabs and comes back.

### HTML Shell

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GAME TITLE</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    <script src="game.js"></script>
</body>
</html>
```

### CSS

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
    width: 100%; height: 100%;
    background: #000;
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
}
canvas {
    display: block;
    max-width: 100vw; max-height: 100vh;
    aspect-ratio: <width> / <height>;  /* 4/3 for landscape, 7/8 for portrait */
    background: #000;
}
```

The `aspect-ratio` CSS property handles responsive scaling without JavaScript.

---

## Rendering Approaches

### Pixel Art (Space Invaders)

For games with sprite-based graphics:

```javascript
// Logical resolution at integer scale
ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
ctx.imageSmoothingEnabled = false;
```

Sprites are 2D arrays of 0/1 rendered pixel-by-pixel with `fillRect(x, y, 1, 1)`. This is simple and gives perfectly crisp results at any scale.

**Cellophane overlay trick**: The original Space Invaders cabinet used colored plastic strips over a monochrome CRT. Replicate this with Canvas `multiply` blend mode:

```javascript
ctx.globalCompositeOperation = 'multiply';
ctx.fillStyle = '#ff3333';  // Red strip
ctx.fillRect(0, 0, width, redZoneY);
ctx.fillStyle = '#33ff33';  // Green strip
ctx.fillRect(0, greenZoneY, width, height - greenZoneY);
```

Draw everything in white first, then apply the overlay. White pixels take the overlay color; black stays black — exactly how cellophane works with light.

### Vector Graphics (Asteroids)

For games with line-based graphics, draw vertex arrays using `moveTo`/`lineTo` with rotation transforms. Add CRT phosphor glow via multiple passes at decreasing opacity and increasing `lineWidth` + blur.

### Monochrome Rectangle-Based (Pong)

For games with no sprites at all — just rectangles (paddles, ball, net dashes) — everything is drawn with `ctx.fillRect()`. This is the simplest rendering approach: white on black, no sprite data needed beyond score digits and text characters. Add a CRT scanline overlay for authenticity:

```javascript
ctx.fillStyle = 'rgba(0,0,0,0.15)';
for (let y = 0; y < LOGICAL_HEIGHT; y += 2) {
    ctx.fillRect(0, y, LOGICAL_WIDTH, 1);
}
```

For block-letter titles (e.g., "PONG"), define inline pixel grids and render with a helper that scales each cell to s×s pixels, rather than creating full sprite data. This keeps the code lightweight for simple games.

---

## Sound Engine Pattern

All games use procedural Web Audio API synthesis. No audio files.

```javascript
class SoundEngine {
    constructor() {
        this.ctx = null;  // Created on first user interaction
    }
    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Each sound effect is a method that creates short-lived oscillator/noise nodes
}
```

**Key patterns:**
- Laser/zap: sawtooth oscillator with frequency sweep (high → low, fast)
- Explosion: filtered noise burst (bandpass at low frequency, 100-500ms)
- Continuous tone: oscillator + LFO for warble effect (mystery ship)
- March/beat: triangle wave at bass frequencies, one short burst per step
- Always call `init()` on first user input (browsers block autoplay)

---

## Collision Detection

### AABB (Axis-Aligned Bounding Box)

Sufficient for most retro arcade games:

```javascript
rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
```

### Pixel-Level (Shield Erosion)

For destructible terrain, store pixels as a mutable `boolean[][]` and erode on impact:

```javascript
class Shield {
    constructor(x, y) {
        this.pixels = deepCopy(SPRITES.SHIELD);  // Mutable copy
    }
    erodeFrom(localX, localY, fromBelow) {
        // Clear pixels in a small pattern around the impact point
    }
}
```

Bullets erode from below (biting upward), bombs erode from above (biting downward). Pre-check with AABB before doing per-pixel work.

---

## State Machine Pattern

Every game uses a string-based state machine:

```javascript
this.state = 'attract';  // 'attract' | 'playing' | 'playerDeath' | 'waveComplete' | 'gameOver'

update() {
    switch (this.state) {
        case 'attract':    this.updateAttract(); break;
        case 'playing':    this.updatePlaying(dt); break;
        case 'playerDeath': this.updatePlayerDeath(dt); break;
        // ...
    }
}
```

Transitions happen by setting `this.state` and initializing any timers/flags for the new state. The Renderer checks the same state to decide what to draw.

### Attract Screen

Every game needs an attract screen that:
- Shows the game title and branding
- Demonstrates gameplay elements (score table, sprites, animations)
- Responds to Enter/Start to begin playing
- Returns to attract after game over

For authenticity, replicate any attract-mode animations from the original ROM (e.g., Space Invaders' "INSERT CCOIN" and upside-down Y gags).

---

## Parallel Implementation Strategy

For large games (~2000+ lines), parallelize with **git worktrees**:

```bash
# Create worktrees on separate branches
git worktree add ../game-wt1 -b section/foundations
git worktree add ../game-wt2 -b section/audio-entities
git worktree add ../game-wt3 -b section/game-engine
```

### Splitting the Work

The 10-section architecture naturally divides into 3 independent workstreams:

| Workstream | Sections | Dependencies |
|-----------|----------|-------------|
| **Foundations** | 1 (CONFIG), 2 (Math), 3 (Sprites), 5 (Input) | None — defines the interfaces |
| **Audio + Entities** | 4 (Sound), 6 (Entities) | Reads CONFIG keys |
| **Game Engine** | 7 (Collision), 8 (Renderer), 9 (Game), 10 (Loop) + HTML/CSS | Reads CONFIG, SPRITES, Entity APIs |

### Interface Contracts

**Before splitting work**, define explicit contracts:
- Every CONFIG key name and value
- Every SPRITES key, dimensions, and format
- Every class with its constructor signature, properties, and method APIs
- The `getState()` return shape that connects Game → Renderer

Each workstream writes to a separate file (`sections-1-3-5.js`, `sections-4-6.js`, `sections-7-10.js`). After all complete, concatenate into `game.js` and syntax-check.

### Cleanup

Always clean up worktrees and temporary branches after assembly:

```bash
git worktree remove ../game-wt1 --force
git branch -D section/foundations
```

---

## Bugs and Pitfalls

### Common Bugs

1. **Return values ignored in collision checks** — If `checkBombShields()` returns `true` (hit), the caller must also set `bomb.alive = false`. Easy to miss when the collision function mutates the shield but the caller doesn't check the return value.

2. **Death loops from unreachable states** — If aliens reach the bottom row, killing the player causes a death → respawn → instant death loop (aliens are still there). The correct behavior is immediate game over.

3. **Web Audio autoplay policy** — Browsers block `AudioContext` creation until a user gesture. Always call `init()` on the first keypress/click, not at page load.

4. **Tab-away time spiral** — Without `MAX_DELTA` clamping, switching tabs for 30 seconds builds up a huge delta. The accumulator then runs hundreds of updates at once, which can freeze or break the game. Always clamp.

5. **Object.freeze and self-references** — You can't reference other keys inside `Object.freeze({})`. Compute derived values explicitly: write `WIDTH: 672` not `WIDTH: this.LOGICAL_WIDTH * this.SCALE`.

6. **Dual-size font glyphs** — If the game needs large score digits (7-segment, e.g., 8×12 pixels) AND inline text containing numbers (e.g., "FIRST TO 11 WINS"), you need digits in TWO sizes. The score renderer uses large `FONT_DIGITS`; the text renderer (`drawText`) uses a uniform-sized `FONT_ALPHA` that includes its own small digit characters ('0'-'9'). Mixing sizes in a single `drawText` call produces garbled output.

7. **Ball/entity sticking on paddle/wall collisions** — After reversing velocity, always reposition the entity just outside the collision surface. Without this, the entity can remain inside the collider and trigger the same collision on the next frame, causing it to vibrate or get stuck.

### Testing Tips

- Playwright is effective for automated visual testing, but screenshot timing is tricky for animations. Use `page.evaluate()` to poll game state and trigger screenshots at exact moments rather than relying on fixed delays.
- Always start a local HTTP server (`python3 -m http.server`) — `file://` protocol blocks some Canvas/Audio APIs in Playwright.
- Run `node --check game.js` after any concatenation or major edit to catch syntax errors before browser testing.

---

## Research Approach

When recreating a classic game, invest time in research before writing code:

1. **Computer Archeology** (computerarcheology.com) — disassembled ROM analysis with detailed documentation of original game logic, attract modes, scoring tables, and timing
2. **Arcade Museum forums** (forums.arcade-museum.com) — hardware details, cabinet specifications, and obscure behavior
3. **Wikipedia** — high-level history, commercial impact, cultural context for the README
4. **YouTube longplays** — visual reference for timing, colors, and animations that text sources miss

The most authentic details come from ROM analysis rather than playing the game. For example, the mystery ship scoring table in Space Invaders is indexed by the player's shot count — a detail invisible from gameplay alone but well-documented in ROM disassembly.

---

## README Structure

Each game README follows this template:

1. **Title + one-line description** with screenshot links
2. **How to Play** — open instructions + controls table
3. **Features** — bulleted list of implemented mechanics
4. **Game History** — Origins, Hardware, Arcade Phenomenon, Legacy subsections
5. **Technical Details** — section list with line counts
6. **License** — fan recreation disclaimer

The top-level README has a table of all games sorted by year, plus the design philosophy section explaining shared conventions.

---

## Lunar Lander Lessons

- **Zoom vs camera offset conflict**: If a game has altitude-dependent zoom, the zoom range and camera positioning must be co-designed. Zooming in too early (e.g., starting at altitude 3500) makes the visible window too small to show both the player and terrain. Solution: delay zoom until the final approach (altitude < 600) and use a camera midpoint blend between player and terrain at overview zoom.
- **Camera midpoint blend**: At overview zoom, target the camera at the midpoint between the player and the terrain so both are visible. Blend toward player-centered as `smoothT` increases: `targetY = lerp(midpointY, landerY, smoothT)`.
- **Pad label positioning**: `drawCenteredText()` centers on the screen, not on a world position. For labels attached to world objects (landing pad multipliers), use `drawText()` with the object's screen-space X coordinate.
- **Stars in world-space cause phosphor smearing**: Drawing stars in world coordinates makes them streak across the phosphor persistence canvas as the camera pans. Draw stars in screen-space with minimal parallax (0.02) instead.
