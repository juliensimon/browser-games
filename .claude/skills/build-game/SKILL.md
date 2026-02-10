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

## Phase 1: Research (MANDATORY — do NOT skip)

Your goal is **pixel-perfect authenticity**. Research the original arcade game exhaustively before writing any code.

### Primary Sources (use ALL that apply)

1. **ROM disassembly sites** — These contain the ground truth:
   - `computerarcheology.com` — Annotated 6502/Z80/6809 assembly with memory maps, AI logic, timing tables, scoring formulas
   - `6502disassembly.com` — Detailed ROM walkthroughs for many classic games
   - `seanriddle.com/ripper.html` — Raw sprite data extracted directly from ROM chips
   - GitHub repos like `mwenge/<game>` — Original assembly source code when available

2. **FPGA recreations** — Hardware-level accuracy:
   - Search GitHub for `fpga-<game>` or `<game>-fpga`
   - These contain exact sprite dimensions, color palettes (RGB values), timing specs, behavioral state machines
   - VHDL/Verilog code often documents signals and timings that ROM alone doesn't reveal

3. **MAME emulator** — Visual reference and verification:
   - Run the game in MAME and take screenshots at 1x scale (no filters)
   - Verify sprite shapes, colors, and animations frame-by-frame
   - Test edge cases (attract screen, death sequence, score overflow)
   - Use MAME's tilemap viewer and sprite debugger if available

4. **Secondary sources** (supplement, don't replace):
   - Arcade hardware wikis for technical specs (resolution, orientation, color system)
   - `forums.arcade-museum.com` for restoration details and obscure behaviors
   - YouTube gameplay videos from original cabinets (NOT modern recreations)

### What You Must Document

- **Hardware**: CPU, resolution, orientation (portrait/landscape), color system (vector/raster/overlay), refresh rate
- **Sprites**: Exact dimensions in pixels, color for each entity, animation frame counts
- **Colors**: Hex values for every entity (cross-reference MAME screenshots, not wikis)
- **Scoring**: Point values for every action (often in lookup tables in ROM)
- **Mechanics**: Speed curves, spawn timing, AI behavior states, collision rules
- **Audio**: Description of each sound effect (pitch, envelope, duration)

**Critical**: If you cannot find ROM data or FPGA documentation, the game may be too obscure or not well-preserved. Check with the user before proceeding with approximations.

## Phase 2: Plan (use plan mode with Opus)

Enter plan mode using Opus for thorough architectural planning. Use the EnterPlanMode tool (Opus is used automatically in plan mode). The plan MUST include:

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

### Authenticity Requirements

List the top 10 most important authentic behaviors to verify:
1. **Sprite accuracy** — Every entity must match ROM sprite data dimensions and shape exactly (not "close enough")
2. **Color accuracy** — Verify hex colors against MAME screenshots for every entity
3. **Scoring** — Point values for every action must match ROM scoring tables
4. **Speed curves** — Enemy/projectile velocities at each wave/level
5. **AI patterns** — Movement algorithms and state transitions from ROM disassembly
6. **Attract screen** — Demo loop behavior, timing, displayed text
7. **Spawn rules** — When/where enemies appear, maximum counts per wave
8. **Collision rules** — Which entities collide with which, damage values
9. **Audio** — Number of sound effects, approximate pitch/duration for each
10. **Edge cases** — Score overflow behavior, death sequence, level transitions

**Non-negotiable**: Sprites and colors must be visually verified against MAME before finalizing. Generic placeholders are not acceptable.

## Phase 3: Build (parallel team with Opus)

After the plan is approved:

1. **Create the game directory**: `<game-name>/` (kebab-case)
2. **Set up 3 git worktrees** on separate branches from main
3. **Create a team** with 3 agents, one per worktree
4. **Create tasks** for each agent with the full interface contracts from the plan
5. **Launch all 3 agents in parallel using `model: "opus"`** — each writes their sections to a separate `.js` file in their worktree's `<game-name>/` directory

**Model selection**: Use Opus for all team members (highest quality implementation, better handling of complex contracts and edge cases).

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

## Phase 5: Test and Verify Authenticity

1. Start a local HTTP server: `python3 -m http.server <port>` (use a port unlikely to conflict, e.g., 8090-8099)
2. Open the game in Playwright and take a screenshot of the attract screen
3. Press Enter to start, then take a gameplay screenshot
4. **Visual comparison against MAME** — Open MAME side-by-side and verify:
   - Sprite shapes match exactly (not "close enough")
   - Colors match (compare hex values)
   - Proportions and spacing are correct
   - HUD layout matches original
5. **Functional verification**: movement, shooting, scoring, collision, sound triggers
6. Fix any bugs found (collision return values, death loops, timing issues, sprite orientation errors)
7. Take final screenshots and save to `<game-name>/screenshots/attract-screen.png` and `gameplay.png`

**If sprites don't match MAME**: Don't approximate — go back to ROM data and fix them.

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

### Authenticity is Mandatory
- **NEVER skip ROM/MAME research**. Generic implementations are not acceptable. Every sprite, color, and behavior must be verified against original hardware.
- **NEVER use placeholders or approximations**. If you can't find ROM data, ask the user — don't guess.
- **ALWAYS verify sprites visually against MAME** before finalizing. "Close enough" means not close enough.
- **Document every deviation** from the original (if any are necessary) and explain why in the plan.

### Technical Requirements
- **Define interface contracts before building** — Prevents all cross-agent integration bugs
- **`Object.freeze()` for CONFIG** — Immutable configuration
- **NO external dependencies** — No images, audio files, or libraries. Everything procedural.
- **Check collision return values** — Callers must update entity state (e.g., `bomb.alive = false`)
- **Web Audio init on first user gesture** — Not page load
- **Test in browser via Playwright** — Every game must render and be playable before commit

## Critical Patterns

### Interface Contracts Prevent Integration Bugs
The most common parallel build failures are **API mismatches** between agents:
1. **Methods vs properties**: Specify whether APIs are `input.isLeft()` (method) or `input.left` (property)
2. **Namespaces**: Explicitly state `MathUtils.rectsOverlap()`, not bare `rectsOverlap()`
3. **Return types**: Include return value structure (e.g., `pixelToGrid(x,y)` returns `{col, row}`)
4. **Usage examples**: Show how to call each cross-section function, not just signatures

### Sprite and Color Accuracy is Non-Negotiable
- **Never use generic placeholders** (circles, squares, symmetric blobs) — each entity has a distinctive silhouette in the original
- **Verify sprite orientation** — Cross-reference ROM data against MAME gameplay (which end leads? where does exhaust/fire appear?)
- **Match colors exactly** — Compare against multiple MAME screenshots, not wikis (colors are often mislabeled)
- **Document in contracts** — Describe exact sprite shape and hex color for every entity before agents start building

### Pre-CPU Hardware Games (before ~1975)
Games like Pong had **no ROM** — purely analog/TTL circuits. Research approach differs:
- **Circuit analysis** from restoration guides and patents (not code disassembly)
- **Observable behavior** from recordings (hardware quirks like angle-dependent ball speed should be replicated, not "fixed")
- **Patent filings** contain detailed circuit diagrams and timing logic

### 2-Player Games Need AI
Many classics were 2-player only. Add beatable AI:
- Reaction distance (only moves when threat is close)
- Dead zone to prevent jitter
- Speed slightly below player for fairness
- Track game objects, don't predict perfectly

### Always Show Controls on Attract Screen
No physical cabinet instructions exist. Display controls clearly: "ARROWS OR WASD MOVE" / "SPACE FIRE"
