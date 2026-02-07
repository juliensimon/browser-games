# Space Invaders

A browser-based recreation of the classic 1978 Taito arcade game, built with vanilla JavaScript and HTML5 Canvas. Features pixel-accurate sprite rendering, authentic colored-overlay visual style, and faithful game mechanics including the original mystery ship scoring system.

![Attract Screen](screenshots/attract-screen.png)

![Gameplay](screenshots/gameplay.png)

## How to Play

Open `index.html` in any modern browser. No build step or dependencies required.

### Controls

| Key | Action |
|-----|--------|
| Left / Right Arrow (or A / D) | Move cannon |
| Space | Fire (one bullet at a time) |
| Enter | Start game |

## Features

- Pixel-accurate alien sprites: squid, crab, and octopus with 2-frame animation
- 4 destructible shields with pixel-level erosion from both bullets and bombs
- Three distinct alien bomb types: rolling, plunger, and squiggly
- Mystery ship with shot-count-based scoring (the famous "300-point trick")
- Formation speed increases as aliens are destroyed (authentic to original hardware behavior)
- Column-based alien firing — only the lowest alien per column can shoot
- Authentic color scheme replicating the original cabinet's cellophane overlays
- Extra life at 1,500 points
- Progressive wave difficulty: aliens start lower each wave
- Persistent high score via localStorage

## Game History

Space Invaders was designed by **Tomohiro Nishikado** and released by **Taito** in Japan in June 1978, and later licensed to **Midway** for North American distribution. It is widely regarded as one of the most influential video games ever made.

### Origins

Nishikado spent a year developing the game, designing not just the software but also the custom hardware it ran on. He originally envisioned human soldiers as targets, but felt uncomfortable with the concept and switched to alien creatures inspired by *The War of the Worlds* and *Star Wars*. The iconic alien designs — the squid, crab, and octopus — were born from the constraints of the hardware, each fitting within an 8-pixel-tall grid.

### The Hardware

The game ran on an **Intel 8080 processor** at 2 MHz with a 256×224 monochrome raster display, rotated 90 degrees for a portrait orientation. The cabinet used **colored cellophane strips** over the CRT to simulate color: red at the top (mystery ship area), white in the middle (alien zone), and green at the bottom (shields and player). The game's most famous quirk — aliens speeding up as they're destroyed — was actually a **hardware limitation**: fewer aliens to render meant the CPU could cycle through the remaining ones faster.

### Arcade Phenomenon

Space Invaders was an unprecedented commercial success. In Japan, it caused a **nationwide coin shortage**, prompting the government to triple yen production. The game generated over **$3.8 billion in revenue** by 1982 (equivalent to roughly $13 billion today), making it the highest-grossing entertainment product of its era.

The game established several firsts:
- **High score tracking** — one of the first games to record and display high scores
- **Adaptive difficulty** — enemies naturally speed up as the game progresses
- **Narrative through gameplay** — the descending alien formation creates escalating tension
- **Mainstream cultural impact** — it moved video games from niche entertainment to mainstream phenomenon

### Legacy

Space Invaders has been ported to virtually every platform and inspired entire genres of shooter games. It was the catalyst for the golden age of arcade games (1978–1983) and directly inspired titles like *Galaxian*, *Galaga*, and *Phoenix*. The game was inducted into the **World Video Game Hall of Fame** in 2016, and its alien designs have become universal symbols of gaming culture.

## Technical Details

This implementation is a single-file JavaScript game (`game.js`, ~2100 lines) organized into clearly separated sections:

1. **CONFIG** — All tunable constants (display, scoring, timing, colors)
2. **Math Utilities** — AABB collision and clamping helpers
3. **Sprite Data** — Pixel-accurate 2D arrays for all game sprites and bitmap font
4. **Sound Engine** — Procedural audio via Web Audio API (march bass line, laser zaps, explosions)
5. **Input Handler** — Keyboard state management with just-pressed tracking
6. **Entity Classes** — Player, Alien, AlienFormation, Bullets, Bombs, Shield, MysteryShip
7. **Collision System** — AABB detection with pixel-level shield erosion
8. **Renderer** — Scaled pixel-art rendering in 224×256 logical space at 3× magnification
9. **Game State Machine** — Attract, playing, death, wave complete, and game-over states
10. **Main Loop** — Fixed 60Hz timestep with accumulator pattern

No external libraries or frameworks. Just HTML, CSS, JavaScript, and the Canvas and Web Audio APIs.

## License

This is a fan recreation for educational purposes. Space Invaders is a trademark of Taito Corporation.
