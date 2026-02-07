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
3. **Clean up** — remove git worktrees, delete temporary branches, stop HTTP server, remove temp screenshot files
4. **Commit** with a descriptive message following the project's commit style

## Critical Rules

- **NEVER skip the research phase**. The difference between a good recreation and an authentic one is in the details that only research reveals (scoring tables, speed curves, attract animations).
- **ALWAYS define interface contracts before building**. This is what makes parallel implementation work without merge conflicts.
- **ALWAYS use `'use strict'`** at the top of game.js.
- **ALWAYS use `Object.freeze()`** for CONFIG.
- **NO external dependencies**. No images, no audio files, no libraries. Everything procedural.
- **Collision return values must be checked by callers**. If a collision function returns true, the caller must also update the entity state (e.g., `bomb.alive = false`).
- **Web Audio init on first user gesture**, not page load.
- **Test in browser via Playwright** before committing. Every game must render and be playable.
