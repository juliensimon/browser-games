---
name: build-game
description: Build a faithful browser-based recreation of a classic arcade game from scratch, following the project's established conventions.
argument-hint: <game-name> [year] [extra details]
---

# Build Browser Game: $ARGUMENTS

You are building a faithful browser-based recreation of a classic arcade game for the `browser-games` repository. The game must be as close as possible to the original arcade version.

## Input

The user has provided: `$ARGUMENTS`

Parse this as: **game name** (required), **year** (optional), and **any extra details** about what to emphasize or include.

## Reference Material

Before doing anything, read the project's implementation guide and study existing games:

1. Read `IMPLEMENTATION.md` at the repo root — it contains all project conventions, architecture patterns, and lessons learned
2. Read at least one existing game's `game.js` (e.g., `asteroids/game.js` or `space-invaders/game.js`) to internalize the code style, section structure, and patterns
3. Read the root `README.md` to understand the game index format

## Phase 1: Research (do NOT skip)

Research the original arcade game thoroughly before writing any code:

1. **Web search** for the game's original hardware specs, screen resolution, color system, scoring rules, and gameplay mechanics
2. **Fetch** detailed technical info from `computerarcheology.com` if available (ROM disassembly, attract mode behavior, timing tables, scoring lookup tables)
3. **Search** arcade museum forums (`forums.arcade-museum.com`) for hardware details and obscure authentic behaviors
4. **Note** the original cabinet orientation (portrait vs landscape), control scheme, display resolution, and color technology (vector, raster, cellophane overlay, etc.)

Collect all of this into a structured summary before proceeding.

## Phase 2: Plan (use plan mode)

Enter plan mode and create a comprehensive implementation plan. The plan MUST include:

### Architecture
- Logical display resolution and scale factor
- Aspect ratio (portrait or landscape)
- Rendering approach (pixel art with sprites, vector graphics, or hybrid)
- Color system (how the original achieved color — replicate it authentically)
- Sound design (list every sound effect and how to synthesize each one)

### All 10 Sections
For each of the 10 standard sections (CONFIG, Math Utils, Sprites/Shapes, Sound Engine, Input Handler, Entity Classes, Collision System, Renderer, Game State Machine, Main Loop), specify:
- What it contains
- Estimated line count
- Key classes/functions

### Interface Contracts
Define explicit contracts BEFORE implementation:
- Every **CONFIG key** with its name, type, and value
- Every **SPRITES/SHAPES key** with dimensions and format
- Every **class** with constructor signature, properties, and method APIs
- The **SoundEngine** API (method names and what each sound does)
- The **InputHandler** API
- The **Game.getState()** return shape that connects Game → Renderer

### Parallel Build Strategy
Plan how to split the work across 3 git worktrees:

| Worktree | Branch | Sections | Output File |
|----------|--------|----------|-------------|
| `../browser-games-wt1` | `<abbrev>/foundations` | 1, 2, 3, 5 | `sections-1-3-5.js` |
| `../browser-games-wt2` | `<abbrev>/audio-entities` | 4, 6 | `sections-4-6.js` |
| `../browser-games-wt3` | `<abbrev>/game-engine` | 7, 8, 9, 10 + HTML/CSS | `sections-7-10.js` |

Use a short abbreviation for the branch prefix (e.g., `si/` for Space Invaders, `gx/` for Galaxian).

### Authenticity Checklist
List the top 10 most important authentic behaviors to get right (scoring tables, speed curves, AI patterns, attract screen animations, etc.).

## Phase 3: Build (parallel team)

After the plan is approved:

1. **Create the game directory**: `<game-name>/` (kebab-case)
2. **Set up 3 git worktrees** on separate branches from main
3. **Create a team** with 3 agents, one per worktree
4. **Create tasks** for each agent with the full interface contracts from the plan
5. **Launch all 3 agents in parallel** — each writes their sections to a separate `.js` file in their worktree's `<game-name>/` directory

Each agent must receive:
- The full interface contracts (CONFIG keys, SPRITES keys, class APIs)
- Their specific section assignments
- Instructions to write to their output file (e.g., `sections-1-3-5.js`)
- The coding style from existing games (single quotes, 4-space indent, `'use strict'`)

### Agent Assignment Details

**foundations agent** (sections 1, 2, 3, 5):
- CONFIG object with ALL keys — this defines the contract for everyone
- Math utility functions
- ALL sprite/shape data (pixel arrays, vertex lists, bitmap font)
- InputHandler class

**audio-entities agent** (sections 4, 6):
- SoundEngine class with all sound effect methods
- All entity classes (player, enemies, projectiles, obstacles, effects)
- Each entity needs: constructor, update(), getRect(), and any state methods

**game-engine agent** (sections 7, 8, 9, 10 + HTML/CSS):
- CollisionSystem with all check methods
- Renderer with drawSprite/drawText helpers + all entity/HUD/screen drawing
- Game state machine with all states and transitions
- Main loop bootstrap code
- `index.html` and `style.css` files

## Phase 4: Assembly

After all 3 agents complete:

1. **Concatenate** the section files in order: `sections-1-3-5.js` + `sections-4-6.js` + `sections-7-10.js` → `game.js`
2. **Syntax check**: `node --check game.js`
3. **Copy** HTML and CSS from worktree 3 to the main game directory
4. **Fix** any syntax errors from concatenation

## Phase 5: Test

1. Start a local HTTP server: `python3 -m http.server <port>` (use a port unlikely to conflict, e.g., 8090-8099)
2. Open the game in Playwright and take a screenshot of the attract screen
3. Press Enter to start, then take a gameplay screenshot
4. Verify key behaviors: movement, shooting, scoring, collision, sound triggers
5. Fix any bugs found (common ones: return values ignored in collision checks, death loops, timing issues)
6. Take final screenshots and save to `<game-name>/screenshots/attract-screen.png` and `gameplay.png`

## Phase 6: Polish and Documentation

1. **README.md** for the game — follow the template in IMPLEMENTATION.md (title, controls, features, game history with Origins/Hardware/Arcade Phenomenon/Legacy, technical details, license)
2. **Update root README.md** — add the game to the table, sorted by year
3. **Regenerate composite image** — run the composite generator script to rebuild `screenshots/games-composite.png` from all games' `screenshots/gameplay.png` files. The script uses Python/Pillow to create a 2-column grid of all games in chronological order with labels. If the script doesn't exist, create one that:
   - Collects `<game>/screenshots/gameplay.png` from every game directory
   - Arranges them in a 2-column grid sorted by year (derive from root README table)
   - Scales each to fit a 600×460 cell using LANCZOS resampling
   - Adds centered labels below each cell (e.g., "PONG (1972)") in a monospace font
   - Uses black background to match the CRT-era aesthetic
   - Saves to `screenshots/games-composite.png`
4. **Clean up** — remove git worktrees, delete temporary branches, stop HTTP server, remove temp screenshot files
4. **Commit** with a descriptive message following the project's commit style

## Critical Rules

- **NEVER skip the research phase**. The difference between a good recreation and an authentic one is in the details that only research reveals (scoring tables, speed curves, attract animations).
- **ALWAYS define interface contracts before building**. This is what makes parallel implementation work without merge conflicts.
- **ALWAYS use `Object.freeze()`** for CONFIG.
- **NO external dependencies**. No images, no audio files, no libraries. Everything procedural.
- **Collision return values must be checked by callers**. If a collision function returns true, the caller must also update the entity state (e.g., `bomb.alive = false`).
- **Web Audio init on first user gesture**, not page load.
- **Test in browser via Playwright** before committing. Every game must render and be playable.

## Lessons from Past Builds

### Font/Glyph Size Consistency (from Pong build)
If a game needs both **large score digits** (7-segment style, e.g., 8×12) and **inline text** (e.g., "FIRST TO 11 WINS"), you need TWO sets of digit glyphs at different sizes. The score renderer uses the large FONT_DIGITS directly, while the text renderer (drawText) should use a uniform-sized FONT_ALPHA that includes its own 5×7 digit characters ('0'-'9'). If you only provide large-format digits in FONT_DIGITS, inline text mixing letters and numbers will look broken. **Define this in the interface contracts** — specify which font data each renderer uses and at what size.

### Simpler Games Still Follow 10 Sections
Even very simple games like Pong (~1200 lines vs 2500+ for Space Invaders) follow the full 10-section architecture. Some sections are just much shorter (e.g., Pong's collision system is ~60 lines vs 200+ for Space Invaders). Don't collapse sections — the consistent structure makes every game navigable.

### AI Opponents for Single-Player Browser Games
Many classic arcade games were 2-player only (Pong, early sports games). Since browser games typically lack a second human player, add an AI opponent. Design the AI to be beatable but not trivial:
- Use a reaction distance (AI only moves when ball/threat is within range)
- Add a dead zone to prevent jitter (small threshold before AI reacts)
- Limit AI speed slightly below player speed for fairness
- The AI should track the game object's position, not predict perfectly

### Pre-CPU Hardware Games (Pong, Breakout)
Games from before ~1975 had **no CPU** — they were entirely hardwired circuits. When researching these, there's no ROM to disassemble. Instead focus on:
- **Circuit analysis** documentation (how counters and flip-flops produced game behavior)
- **Observable behavior** from video recordings and emulators
- **Patent filings** (often contain detailed circuit diagrams and behavior descriptions)
The key insight: hardware-level behaviors like "ball travels faster at steep angles" (because horizontal and vertical counters are independent) should be replicated, not "fixed" to normalize speed.

### Parallel Agent Text Rendering
When assigning the game-engine agent (sections 7-10), explicitly tell it to create a FONT_ALPHA with ALL characters needed for UI text, including digits at the same size as letters. List every string that will appear on screen (attract text, game over text, HUD labels) so the agent knows exactly which characters to include. Missing characters result in invisible text that's hard to debug from screenshots alone.

### Sprite Authenticity — Research the Actual Shapes
Generic placeholder sprites (circles, squares, symmetric blobs) look wrong even with correct colors. Each enemy in a classic arcade game has a **distinctive silhouette** documented in arcade preservation resources. During research, specifically look for:
- **Shape descriptions** from wikis (e.g., "box-shaped alien", "flat iridescent spacecraft", "star-like", "teardrop-shaped", "pencil-like craft")
- **ROM sprite data** from sites like `seanriddle.com/ripper.html` and `computerarcheology.com` which document actual pixel layouts from the hardware
- **FPGA recreations** on GitHub (search `fpga-<game>`) which often faithfully reproduce sprite data in VHDL/Verilog
- **The original game's source code** if available (e.g., `mwenge/defender` on GitHub has the 6809 assembly)
- Describe the exact sprite shape in the plan's interface contracts so agents create faithful sprites, not generic ones

### Color Authenticity — Match the Original Palette
Don't assume colors — research them. Common mistakes:
- **Humanoids** in Defender are green (matching the terrain theme), not orange
- **Baiters** are yellow/iridescent (color-cycling), not plain red
- **Mutants** are purple/violet, not hot pink
- Different enemy types that "look red" often have distinct shades (pure red vs orange-red vs crimson)
Each entity's color should be visible in MAME screenshots — compare against at least 3 reference screenshots before finalizing the palette. In the plan, document the exact hex color for every entity.

### Scrolling Games — World Wrap and Camera
Games with horizontally scrolling worlds (Defender, Scramble) need careful coordinate systems:
- All entities store **world-space** x coordinates (0..WORLD_WIDTH-1)
- Camera tracks player position, offset computed per frame
- `worldToScreen()` must handle wrapping (entity near x=0 visible from camera near x=WORLD_WIDTH)
- Terrain must use seamless-wrap frequencies (integer multiples of TAU/WORLD_WIDTH for sine-based terrain)
- The scanner/minimap is a compressed view of the entire world — entity dots use world-space positions divided by compression ratio

### Research — ROM Disassembly and FPGA Sources (from Centipede build)
Go beyond wikis and gameplay videos. The most accurate game behavior details come from:
- **ROM disassembly sites** like `6502disassembly.com` — contain annotated source code for classic 6502/6809 games with detailed comments on game logic, timing tables, scoring formulas, and sprite data
- **FPGA recreation projects** on GitHub (search `fpga-<game>` or `<game>-fpga`) — these contain extremely detailed hardware documentation including exact color palettes, sprite dimensions, timing specifications, and behavioral state machines that must be pixel-accurate to the original hardware
- **computerarcheology.com** — detailed ROM walkthroughs with memory maps, AI state machines, and input handling for many classic arcade games
Include these sources in the research phase and reference specific timing/scoring values from them in the plan's CONFIG section.

### Cross-Agent Interface Mismatches (from Centipede build)
When agents build sections independently, the most common integration bugs are **API mismatches** between what one agent provides and another expects:
1. **Method calls vs property access**: If the InputHandler defines `isLeft()` as a method, all entity agents must call `input.isLeft()`, not `input.left`. Specify in the interface contract whether APIs are methods or properties.
2. **Namespaced vs bare function calls**: If `rectsOverlap` lives in `MathUtils`, agents must call `MathUtils.rectsOverlap()`, not bare `rectsOverlap()`. The entity/collision agents are most likely to get this wrong since they didn't write the utility code.
3. **Function signatures**: If `pixelToGrid(x, y)` returns `{ col, row }`, collision code must destructure the return value, not call it with one argument. Include return types in the interface contracts.
4. **FONT namespace**: If the plan says `SPRITES.FONT`, the foundations agent must put font data inside the SPRITES object (not a separate `const FONT`). Or vice versa — pick one and be explicit.
To prevent these: include **usage examples** (not just signatures) in the interface contracts for any function/method that crosses section boundaries.

### Attract Screen Controls Display
Always show control information on the attract screen. Players need to know how to move and fire before starting. Use a compact format like "ARROWS OR WASD MOVE" / "SPACE FIRE" in the game's accent color. This is especially important since these are browser games with no physical cabinet instructions.

### Ship/Sprite Orientation — Nose vs Engine (from Defender build)
Many classic arcade ships have **asymmetric silhouettes** where the wide/blunt end is the NOSE (front, direction of travel) and the tapered point is the ENGINE/EXHAUST (rear). This is the opposite of a typical arrow. The original Defender ship has a wide flat front and narrows to an exhaust point at the back. When deriving sprites from ROM data:
- **Verify orientation** by cross-referencing MAME gameplay screenshots — watch which direction the ship moves and confirm which end leads
- **The tapered/pointed end is usually the engine**, not the nose — engines concentrate thrust through a nozzle
- **Exhaust glow overlays** (magenta/yellow/blue accent pixels) go at the engine/pointed end, not the nose
- **Laser spawn position** should be at the NOSE (wide/blunt front edge): `this.x + CONFIG.PLAYER_WIDTH` for right-facing, `this.x` for left-facing
- **Thrust flames** also go at the engine/pointed end — same side as the exhaust glow
- If the sprite looks wrong after ROM derivation, check orientation FIRST before redesigning the sprite shape

### Playwright Testing of Canvas Games (from Defender build)
Testing canvas-based games with Playwright is tricky because the player dies almost instantly from enemy collisions. To get stable test screenshots:
1. **Patch `CollisionSystem.checkPlayerCollisions`** to `return false` BEFORE calling `startGame()` — this makes the player immortal without the invulnerability blink effect
2. **Do it in one atomic `page.evaluate()`** — if you set invulnerability in a separate call, the game loop can kill the player between your evaluates
3. **Position the player with `game.player.x = game.cameraX + 146`** to center them on screen
4. **Use `game.player.fire()` directly** rather than keyboard simulation — Playwright's `keyboard.press()` fires keydown+keyup synchronously which can miss `justPressed` detection in snapshot-comparison input handlers
5. **Don't set `game.player.invulnerable = false`** until after patching collision — any gap lets enemies kill the player
