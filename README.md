# Browser Games

Classic arcade games recreated in the browser with vanilla JavaScript and HTML5 Canvas. No frameworks, no build tools, no dependencies — just open and play.

## Games

| Game | Year | Description | Play |
|------|------|-------------|------|
| [Space Invaders](space-invaders/) | 1978 | The Taito classic. Defend Earth from descending alien formations with your laser cannon. Pixel-accurate sprites, destructible shields with pixel-level erosion, cellophane color overlay, and attract screen gag animations from the original ROM. | Open `space-invaders/index.html` |
| [Asteroids](asteroids/) | 1979 | The Atari classic. Pilot your ship through an asteroid field, blast rocks into fragments, and dodge UFOs. Vector-style graphics with phosphor glow effects, inertial physics, and hyperspace. | Open `asteroids/index.html` |

## Design Philosophy

Each game follows the same conventions:

- **Single-file architecture** — all game logic lives in one `game.js` file, organized into clearly named sections (CONFIG, Math Utilities, Sprite/Shape Data, Sound Engine, Input Handler, Entity Classes, Collision System, Renderer, Game State Machine, Main Loop)
- **Zero dependencies** — vanilla JavaScript, HTML5 Canvas, and Web Audio API only
- **3-file structure** — `index.html` (shell), `style.css` (layout), `game.js` (everything else)
- **Authentic recreation** — faithful to the original hardware behavior, scoring systems, and visual style rather than "inspired by" reinterpretations
- **Procedural audio** — all sound effects synthesized at runtime via Web Audio API oscillators and noise buffers; no audio files
- **Fixed 60Hz timestep** — accumulator-pattern game loop with delta clamping for consistent physics regardless of display refresh rate

## How to Run

Clone the repo and open any game's `index.html` in a browser:

```bash
git clone https://github.com/juliensimon/browser-games.git
open browser-games/space-invaders/index.html
```

No server required — everything runs client-side.

## License

Fan recreations for educational purposes. All original games are trademarks of their respective owners.
