'use strict';

// ============================================================================
// SECTION 1: CONFIG — All tunable game constants
// ============================================================================

const CONFIG = Object.freeze({
    // Display
    LOGICAL_WIDTH: 292,
    LOGICAL_HEIGHT: 240,
    SCALE: 3,
    WIDTH: 876,
    HEIGHT: 720,

    // World
    WORLD_WIDTH: 2048,
    TERRAIN_Y: 228,
    SCANNER_Y: 12,
    SCANNER_HEIGHT: 16,
    PLAY_AREA_TOP: 28,
    PLAY_AREA_BOTTOM: 228,

    // Player
    PLAYER_THRUST_ACCEL: 0.15,
    PLAYER_MAX_SPEED: 3,
    PLAYER_VERTICAL_SPEED: 2,
    PLAYER_DRAG: 0.98,
    PLAYER_WIDTH: 16,
    PLAYER_HEIGHT: 5,
    PLAYER_START_Y: 120,
    PLAYER_INVULN_TIME: 3000,
    PLAYER_BLINK_RATE: 100,
    MAX_LASERS: 4,
    LASER_SPEED: 6,
    LASER_LIFETIME: 40,
    LASER_WIDTH: 8,
    LASER_HEIGHT: 1,

    // Smart bomb
    STARTING_BOMBS: 3,
    SMART_BOMB_FLASH_TIME: 300,

    // Hyperspace
    HYPERSPACE_DEATH_CHANCE: 0.25,
    HYPERSPACE_DELAY: 1000,

    // Enemies
    LANDER_SPEED: 0.8,
    LANDER_DESCENT_SPEED: 0.5,
    LANDER_ASCENT_SPEED: 0.4,
    LANDER_FIRE_INTERVAL: 2000,
    MUTANT_SPEED: 2.5,
    MUTANT_FIRE_INTERVAL: 800,
    BAITER_SPEED: 3.5,
    BAITER_FIRE_INTERVAL: 600,
    BAITER_SPAWN_DELAY: 20000,
    BOMBER_SPEED: 1.0,
    BOMBER_MINE_INTERVAL: 2000,
    MINE_LIFETIME: 10000,
    POD_SPEED: 0.5,
    SWARMER_SPEED: 2.5,
    SWARMER_FIRE_INTERVAL: 1000,
    SWARMER_COUNT_MIN: 5,
    SWARMER_COUNT_MAX: 7,
    ENEMY_BULLET_SPEED: 2,

    // Scoring
    SCORE_LANDER: 150,
    SCORE_MUTANT: 150,
    SCORE_SWARMER: 150,
    SCORE_BAITER: 200,
    SCORE_BOMBER: 250,
    SCORE_POD: 1000,
    SCORE_RESCUE: 500,
    SCORE_DEPOSIT: 500,
    EXTRA_LIFE_SCORE: 10000,

    // Humanoids
    HUMANOID_COUNT: 10,
    HUMANOID_WALK_SPEED: 0.1,
    HUMANOID_FALL_ACCEL: 0.05,
    HUMANOID_SAFE_FALL: 35,

    // Wave composition [landers, bombers, pods]
    WAVE_TABLE: [
        [15, 0, 0],
        [20, 3, 1],
        [20, 4, 3],
        [20, 5, 4],
    ],
    PLANET_RESTORE_WAVE: 5,

    // Colors
    COLOR_BG: '#000000',
    COLOR_PLAYER: '#ffffff',
    COLOR_PLAYER_ENGINE: '#00ffff',
    COLOR_LANDER: '#00ff00',
    COLOR_MUTANT: '#cc44ff',
    COLOR_BAITER: '#ffff00',
    COLOR_BOMBER: '#ff0000',
    COLOR_POD: '#ff0000',
    COLOR_SWARMER: '#ff4400',
    COLOR_HUMANOID: '#00ff00',
    COLOR_MINE: '#ffffff',
    COLOR_LASER: '#ffffff',
    COLOR_ENEMY_BULLET: '#ffff00',
    COLOR_TERRAIN: '#bb5500',
    COLOR_TERRAIN_HIGHLIGHT: '#00cc00',
    COLOR_SCANNER_BG: '#000033',
    COLOR_TEXT: '#ffffff',

    // Game rules
    STARTING_LIVES: 3,
    WAVE_START_DELAY: 2000,
    RESPAWN_DELAY: 2000,
    GAME_OVER_DURATION: 3000,

    // Timing
    FPS: 60,
    FRAME_TIME: 1000 / 60,
    MAX_DELTA: 200,
});

// ============================================================================
// SECTION 2: Math Utilities
// ============================================================================

const MathUtils = {
    clamp(val, min, max) {
        return val < min ? min : val > max ? max : val;
    },

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },

    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    wrapWorld(x) {
        x = x % CONFIG.WORLD_WIDTH;
        if (x < 0) x += CONFIG.WORLD_WIDTH;
        return x;
    },

    worldDistance(x1, x2) {
        let dx = Math.abs(x2 - x1);
        if (dx > CONFIG.WORLD_WIDTH / 2) {
            dx = CONFIG.WORLD_WIDTH - dx;
        }
        return dx;
    },

    worldToScreen(worldX, cameraX) {
        let screenX = worldX - cameraX;
        if (screenX > CONFIG.WORLD_WIDTH / 2) {
            screenX -= CONFIG.WORLD_WIDTH;
        } else if (screenX < -CONFIG.WORLD_WIDTH / 2) {
            screenX += CONFIG.WORLD_WIDTH;
        }
        return screenX;
    },

    rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    },
};

// ============================================================================
// SECTION 3: Sprite Data + Terrain + Font
// ============================================================================

const SPRITES = {
    // Player ship facing right (16x5) — authentic Defender "pencil" shape
    // Sharp pointed nose, narrow elongated body, split rear exhaust fins
    PLAYER_RIGHT: [
        [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0],
    ],

    // Player ship facing left (16x5) — mirror of right
    PLAYER_LEFT: [
        [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0],
    ],

    // Lander (8x8) — round/oval UFO shape with antenna-like protrusions
    // Original is a rounded form, green colored
    LANDER: [
        [0,0,0,1,1,0,0,0],
        [0,0,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
        [0,1,0,1,1,0,1,0],
        [1,0,0,0,0,0,0,1],
        [0,0,0,0,0,0,0,0],
    ],

    // Mutant (10x8) — spiky, erratic corrupted lander-humanoid fusion
    // Original ROM: 10px wide (5 bytes) x 8 tall, purple/magenta
    MUTANT: [
        [0,1,0,0,1,1,0,0,1,0],
        [1,0,1,1,1,1,1,1,0,1],
        [0,1,1,0,1,1,0,1,1,0],
        [1,1,1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,1,1,0],
        [1,0,1,1,0,0,1,1,0,1],
        [0,1,0,1,0,0,1,0,1,0],
        [1,0,0,0,1,1,0,0,0,1],
    ],

    // Baiter (12x3) — flat, thin iridescent disc/spacecraft
    // "Flat, iridescent spacecraft" — sleek horizontal saucer
    BAITER: [
        [0,0,0,1,1,1,1,1,1,0,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,1,1,1,1,0],
        [0,0,0,1,1,1,1,1,1,0,0,0],
    ],

    // Bomber (8x8) — box-shaped alien with internal detail
    // "Box-shaped alien" that trails mines
    BOMBER: [
        [1,1,1,1,1,1,1,1],
        [1,0,1,1,1,1,0,1],
        [1,1,1,0,0,1,1,1],
        [1,1,0,1,1,0,1,1],
        [1,1,0,1,1,0,1,1],
        [1,1,1,0,0,1,1,1],
        [1,0,1,1,1,1,0,1],
        [1,1,1,1,1,1,1,1],
    ],

    // Pod (8x8) — multi-pointed star/asterisk shape
    // "Star-like aliens" — spiky star, not a circle
    POD: [
        [0,0,0,1,1,0,0,0],
        [0,1,0,1,1,0,1,0],
        [0,0,1,1,1,1,0,0],
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
        [0,0,1,1,1,1,0,0],
        [0,1,0,1,1,0,1,0],
        [0,0,0,1,1,0,0,0],
    ],

    // Swarmer (4x4) — tiny teardrop shape
    // "Tiny teardrop-shaped aliens" — small, pointed
    SWARMER: [
        [0,1,1,0],
        [1,1,1,1],
        [0,1,1,0],
        [0,0,1,0],
    ],

    // Humanoid (4x8) — "men's room" head-and-shoulders silhouette
    // Simple human figure, distinct head, body, legs
    HUMANOID: [
        [0,1,1,0],
        [0,1,1,0],
        [1,1,1,1],
        [1,1,1,1],
        [0,1,1,0],
        [0,1,1,0],
        [0,1,1,0],
        [1,0,0,1],
    ],

    // Mine (5x5) — small cross/plus shape, stationary hazard
    MINE: [
        [0,0,1,0,0],
        [0,0,1,0,0],
        [1,1,1,1,1],
        [0,0,1,0,0],
        [0,0,1,0,0],
    ],

    // Explosion frames (3 frames, each 8x8) — expanding burst
    EXPLOSION: [
        // Frame 0: small spark
        [
            [0,0,0,0,0,0,0,0],
            [0,0,0,1,0,0,0,0],
            [0,0,1,1,1,0,0,0],
            [0,1,1,1,1,1,0,0],
            [0,0,1,1,1,0,0,0],
            [0,0,0,1,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
        ],
        // Frame 1: medium burst
        [
            [0,0,1,0,0,1,0,0],
            [0,0,0,1,1,0,0,0],
            [1,0,1,1,1,1,0,1],
            [0,1,1,1,1,1,1,0],
            [0,1,1,1,1,1,1,0],
            [1,0,1,1,1,1,0,1],
            [0,0,0,1,1,0,0,0],
            [0,0,1,0,0,1,0,0],
        ],
        // Frame 2: scattered debris
        [
            [1,0,0,1,0,0,1,0],
            [0,0,1,0,0,1,0,0],
            [0,1,0,0,1,0,0,1],
            [1,0,0,0,0,0,1,0],
            [0,0,1,0,0,1,0,0],
            [0,1,0,0,1,0,1,0],
            [1,0,0,1,0,0,0,1],
            [0,0,1,0,0,1,0,0],
        ],
    ],

    // Player explosion frames (2 frames, 16x5) — ship breaking apart
    PLAYER_EXPLOSION: [
        // Frame 0: ship cracking apart
        [
            [0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0],
            [0,0,0,1,0,1,1,0,1,1,1,0,1,1,0,0],
            [1,0,1,1,1,0,1,1,0,1,1,1,0,1,0,1],
            [0,0,1,0,0,1,1,0,1,1,0,1,1,0,0,0],
            [0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0],
        ],
        // Frame 1: fully fragmented
        [
            [0,1,0,0,0,1,0,0,0,0,1,0,0,0,1,0],
            [0,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0],
            [1,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0],
            [0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0],
            [0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0],
        ],
    ],

    // Terrain data — generated at load time
    TERRAIN: null,
};

// Generate terrain using layered sine waves
function generateTerrain() {
    const terrain = new Uint8Array(CONFIG.WORLD_WIDTH);
    const W = CONFIG.WORLD_WIDTH;
    const TAU = Math.PI * 2;
    for (let x = 0; x < W; x++) {
        // Frequencies that complete full cycles in 2048px for seamless wrap
        const h = Math.sin(x / W * TAU * 2) * 6
                + Math.sin(x / W * TAU * 5) * 4
                + Math.sin(x / W * TAU * 13) * 2
                + Math.sin(x / W * TAU * 31) * 1;
        terrain[x] = Math.round(Math.max(1, h + 10));
    }
    return terrain;
}

SPRITES.TERRAIN = generateTerrain();

// Bitmap font — 5x5 pixel glyphs for A-Z, 0-9, and space
const FONT = {
    'A': [
        [0,1,1,1,0],
        [1,0,0,0,1],
        [1,1,1,1,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
    ],
    'B': [
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,1,1,1,0],
    ],
    'C': [
        [0,1,1,1,1],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [0,1,1,1,1],
    ],
    'D': [
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,0],
    ],
    'E': [
        [1,1,1,1,1],
        [1,0,0,0,0],
        [1,1,1,0,0],
        [1,0,0,0,0],
        [1,1,1,1,1],
    ],
    'F': [
        [1,1,1,1,1],
        [1,0,0,0,0],
        [1,1,1,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
    ],
    'G': [
        [0,1,1,1,1],
        [1,0,0,0,0],
        [1,0,1,1,1],
        [1,0,0,0,1],
        [0,1,1,1,0],
    ],
    'H': [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
    ],
    'I': [
        [1,1,1,1,1],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [1,1,1,1,1],
    ],
    'J': [
        [0,0,0,0,1],
        [0,0,0,0,1],
        [0,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,0],
    ],
    'K': [
        [1,0,0,1,0],
        [1,0,1,0,0],
        [1,1,0,0,0],
        [1,0,1,0,0],
        [1,0,0,1,0],
    ],
    'L': [
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,1,1,1,1],
    ],
    'M': [
        [1,0,0,0,1],
        [1,1,0,1,1],
        [1,0,1,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
    ],
    'N': [
        [1,0,0,0,1],
        [1,1,0,0,1],
        [1,0,1,0,1],
        [1,0,0,1,1],
        [1,0,0,0,1],
    ],
    'O': [
        [0,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,0],
    ],
    'P': [
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,1,1,1,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
    ],
    'Q': [
        [0,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,1,0],
        [0,1,1,0,1],
    ],
    'R': [
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,1,1,1,0],
        [1,0,0,1,0],
        [1,0,0,0,1],
    ],
    'S': [
        [0,1,1,1,1],
        [1,0,0,0,0],
        [0,1,1,1,0],
        [0,0,0,0,1],
        [1,1,1,1,0],
    ],
    'T': [
        [1,1,1,1,1],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
    ],
    'U': [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,0],
    ],
    'V': [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,0,1,0],
        [0,1,0,1,0],
        [0,0,1,0,0],
    ],
    'W': [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,1,0,1],
        [1,1,0,1,1],
        [1,0,0,0,1],
    ],
    'X': [
        [1,0,0,0,1],
        [0,1,0,1,0],
        [0,0,1,0,0],
        [0,1,0,1,0],
        [1,0,0,0,1],
    ],
    'Y': [
        [1,0,0,0,1],
        [0,1,0,1,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
    ],
    'Z': [
        [1,1,1,1,1],
        [0,0,0,1,0],
        [0,0,1,0,0],
        [0,1,0,0,0],
        [1,1,1,1,1],
    ],
    '0': [
        [0,1,1,1,0],
        [1,0,0,1,1],
        [1,0,1,0,1],
        [1,1,0,0,1],
        [0,1,1,1,0],
    ],
    '1': [
        [0,0,1,0,0],
        [0,1,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,1,1,1,0],
    ],
    '2': [
        [0,1,1,1,0],
        [1,0,0,0,1],
        [0,0,1,1,0],
        [0,1,0,0,0],
        [1,1,1,1,1],
    ],
    '3': [
        [1,1,1,1,0],
        [0,0,0,0,1],
        [0,1,1,1,0],
        [0,0,0,0,1],
        [1,1,1,1,0],
    ],
    '4': [
        [1,0,0,1,0],
        [1,0,0,1,0],
        [1,1,1,1,1],
        [0,0,0,1,0],
        [0,0,0,1,0],
    ],
    '5': [
        [1,1,1,1,1],
        [1,0,0,0,0],
        [1,1,1,1,0],
        [0,0,0,0,1],
        [1,1,1,1,0],
    ],
    '6': [
        [0,1,1,1,0],
        [1,0,0,0,0],
        [1,1,1,1,0],
        [1,0,0,0,1],
        [0,1,1,1,0],
    ],
    '7': [
        [1,1,1,1,1],
        [0,0,0,0,1],
        [0,0,0,1,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
    ],
    '8': [
        [0,1,1,1,0],
        [1,0,0,0,1],
        [0,1,1,1,0],
        [1,0,0,0,1],
        [0,1,1,1,0],
    ],
    '9': [
        [0,1,1,1,0],
        [1,0,0,0,1],
        [0,1,1,1,1],
        [0,0,0,0,1],
        [0,1,1,1,0],
    ],
    ' ': [
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
    ],
};

SPRITES.FONT = FONT;

// ============================================================================
// SECTION 5: Input Handler
// ============================================================================

class InputHandler {
    constructor() {
        this.keys = {};
        this.justPressedKeys = {};
        this._prev = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });
    }

    update() {
        for (const code in this.keys) {
            this.justPressedKeys[code] = this.keys[code] && !this._prev[code];
        }
        Object.assign(this._prev, this.keys);
    }

    isDown(code) {
        return !!this.keys[code];
    }

    justPressed(code) {
        return !!this.justPressedKeys[code];
    }

    reset() {
        this.keys = {};
        this.justPressedKeys = {};
        this._prev = {};
    }

    // Convenience methods for game controls
    isUp() {
        return this.isDown('ArrowUp') || this.isDown('KeyW');
    }

    isDownDir() {
        return this.isDown('ArrowDown') || this.isDown('KeyS');
    }

    isThrust() {
        return this.isDown('ShiftLeft') || this.isDown('ShiftRight');
    }

    isReverse() {
        return this.isDown('KeyA') || this.isDown('ArrowLeft');
    }

    isFire() {
        return this.isDown('Space');
    }

    justPressedFire() {
        return this.justPressed('Space');
    }

    justPressedSmartBomb() {
        return this.justPressed('KeyD') || this.justPressed('KeyZ');
    }

    justPressedHyperspace() {
        return this.justPressed('KeyH');
    }

    justPressedStart() {
        return this.justPressed('Enter');
    }

    justPressedReverse() {
        return this.justPressed('KeyA') || this.justPressed('ArrowLeft');
    }
}
// ============================================================================
// SECTION 4: SOUND ENGINE
// ============================================================================

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.thrustNode = null;
        this.thrustGain = null;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    _tone(type, freq, duration, volume = 0.3) {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
        return { osc, gain };
    }

    _noise(duration, freq, volume = 0.3) {
        this.init();
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freq, this.ctx.currentTime);
        filter.Q.setValueAtTime(1, this.ctx.currentTime);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(this.ctx.currentTime);
        source.stop(this.ctx.currentTime + duration);
        return { source, filter, gain };
    }

    laser() {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2000, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.08);
    }

    explosion() {
        this._noise(0.15, 200, 0.3);
    }

    bigExplosion() {
        this._noise(0.3, 100, 0.4);
    }

    smartBomb() {
        this.init();
        const t = this.ctx.currentTime;

        // White noise sweep
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = buffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(200, t);
        noiseFilter.frequency.exponentialRampToValueAtTime(4000, t + 0.25);
        noiseFilter.frequency.exponentialRampToValueAtTime(200, t + 0.5);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.4, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noiseSource.start(t);
        noiseSource.stop(t + 0.5);

        // Sine sweep 100→2000→100Hz
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(2000, t + 0.25);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.5);
        oscGain.gain.setValueAtTime(0.3, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.5);
    }

    hyperspace() {
        this.init();
        const t = this.ctx.currentTime;

        // Filtered noise component
        this._noise(0.3, 400, 0.25);

        // Sine descend 800→200Hz
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.3);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    humanoidCaptured() {
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        // Warble effect: rising with modulation
        for (let i = 0; i < 8; i++) {
            const time = t + i * 0.05;
            const freq = 300 + (i * 112.5) + (i % 2 === 0 ? 50 : -50);
            osc.frequency.setValueAtTime(Math.max(freq, 10), time);
        }
        osc.frequency.setValueAtTime(1200, t + 0.4);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
    }

    humanoidSaved() {
        this.init();
        const t = this.ctx.currentTime;
        // Ascending arpeggio C5-E5-G5
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + i * 0.2);
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.setValueAtTime(0.3, t + i * 0.2);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.2 + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t + i * 0.2);
            osc.stop(t + i * 0.2 + 0.2);
        });
    }

    humanoidFalling() {
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.8);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.8);
    }

    planetExplode() {
        this.init();
        const t = this.ctx.currentTime;

        // Long noise burst
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = buffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(1000, t);
        noiseFilter.frequency.exponentialRampToValueAtTime(50, t + 2);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 2);
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noiseSource.start(t);
        noiseSource.stop(t + 2);

        // Sine undertone
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(20, t + 2);
        oscGain.gain.setValueAtTime(0.3, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 2);
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 2);
    }

    mutantTransform() {
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(2000, t + 0.3);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        // Add distortion via waveshaper
        const shaper = this.ctx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
            const x = (i / 128) - 1;
            curve[i] = (Math.PI + 3) * x / (Math.PI + 3 * Math.abs(x));
        }
        shaper.curve = curve;
        osc.connect(shaper);
        shaper.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    waveStart() {
        this.init();
        const t = this.ctx.currentTime;
        // Ascending 3-note fanfare
        const notes = [392, 523.25, 659.25]; // G4, C5, E5
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, t + i * 0.15);
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.setValueAtTime(0.25, t + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t + i * 0.15);
            osc.stop(t + i * 0.15 + 0.15);
        });
    }

    extraLife() {
        this.init();
        const t = this.ctx.currentTime;
        // Quick ascending arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + i * 0.08);
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.setValueAtTime(0.3, t + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.1);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t + i * 0.08);
            osc.stop(t + i * 0.08 + 0.1);
        });
    }

    thrust(on) {
        this.init();
        const t = this.ctx.currentTime;
        if (on) {
            if (!this.thrustNode) {
                // Create persistent noise source for thrust
                const bufferSize = this.ctx.sampleRate * 2;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                this.thrustNode = this.ctx.createBufferSource();
                this.thrustNode.buffer = buffer;
                this.thrustNode.loop = true;
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(150, t);
                filter.Q.setValueAtTime(2, t);
                this.thrustGain = this.ctx.createGain();
                this.thrustGain.gain.setValueAtTime(0.001, t);
                this.thrustNode.connect(filter);
                filter.connect(this.thrustGain);
                this.thrustGain.connect(this.ctx.destination);
                this.thrustNode.start(t);
            }
            this.thrustGain.gain.cancelScheduledValues(t);
            this.thrustGain.gain.setValueAtTime(this.thrustGain.gain.value || 0.001, t);
            this.thrustGain.gain.exponentialRampToValueAtTime(0.2, t + 0.05);
        } else {
            if (this.thrustGain) {
                this.thrustGain.gain.cancelScheduledValues(t);
                this.thrustGain.gain.setValueAtTime(this.thrustGain.gain.value || 0.2, t);
                this.thrustGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            }
        }
    }
}

// ============================================================================
// SECTION 6: ENTITY CLASSES
// ============================================================================

class Player {
    constructor() {
        this.x = CONFIG.WORLD_WIDTH / 2;
        this.y = CONFIG.PLAYER_START_Y;
        this.vx = 0;
        this.vy = 0;
        this.facing = 1;  // 1 = right, -1 = left
        this.alive = true;
        this.invulnerable = false;
        this.invulnTimer = 0;
        this.thrustActive = false;
        this.carriedHumanoid = null;
    }

    update(input) {
        // Vertical movement: direct from input
        if (input.isDown('ArrowUp') || input.isDown('KeyW')) {
            this.vy = -CONFIG.PLAYER_VERTICAL_SPEED;
        } else if (input.isDown('ArrowDown') || input.isDown('KeyS')) {
            this.vy = CONFIG.PLAYER_VERTICAL_SPEED;
        } else {
            this.vy = 0;
        }

        // Thrust: horizontal acceleration in facing direction
        this.thrustActive = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
        if (this.thrustActive) {
            this.vx += this.facing * CONFIG.PLAYER_THRUST_ACCEL;
        }
        this.vx *= CONFIG.PLAYER_DRAG;
        this.vx = MathUtils.clamp(this.vx, -CONFIG.PLAYER_MAX_SPEED, CONFIG.PLAYER_MAX_SPEED);

        // Reverse direction
        if (input.justPressed('KeyA') || input.justPressed('ArrowLeft')) {
            this.facing = -this.facing;
        }

        // Apply movement
        this.x = MathUtils.wrapWorld(this.x + this.vx);
        this.y = MathUtils.clamp(this.y + this.vy, CONFIG.PLAY_AREA_TOP, CONFIG.PLAY_AREA_BOTTOM - CONFIG.PLAYER_HEIGHT);

        // Invulnerability timer
        if (this.invulnerable) {
            this.invulnTimer -= CONFIG.FRAME_TIME;
            if (this.invulnTimer <= 0) this.invulnerable = false;
        }

        // Update carried humanoid position
        if (this.carriedHumanoid) {
            this.carriedHumanoid.x = this.x;
            this.carriedHumanoid.y = this.y + CONFIG.PLAYER_HEIGHT;
        }
    }

    fire(activeLaserCount) {
        if (activeLaserCount >= CONFIG.MAX_LASERS) return null;
        return new Laser(
            this.x + (this.facing === 1 ? CONFIG.PLAYER_WIDTH : 0),
            this.y + Math.floor(CONFIG.PLAYER_HEIGHT / 2),
            this.facing
        );
    }

    catchHumanoid(humanoid) {
        this.carriedHumanoid = humanoid;
        humanoid.state = 'carried';
        humanoid.captor = null;
    }

    depositHumanoid(terrain) {
        if (!this.carriedHumanoid) return false;
        const terrainIdx = Math.floor(this.x) % CONFIG.WORLD_WIDTH;
        const terrainHeight = terrain[terrainIdx < 0 ? terrainIdx + CONFIG.WORLD_WIDTH : terrainIdx];
        const surfaceY = CONFIG.TERRAIN_Y - terrainHeight;
        if (this.y > surfaceY - 20) {
            this.carriedHumanoid.x = this.x;
            this.carriedHumanoid.y = surfaceY - 8;
            this.carriedHumanoid.state = 'walking';
            this.carriedHumanoid.fallVy = 0;
            this.carriedHumanoid = null;
            return true;
        }
        return false;
    }

    die() {
        this.alive = false;
        this.carriedHumanoid = null;
    }

    respawn() {
        this.alive = true;
        this.x = CONFIG.WORLD_WIDTH / 2;
        this.y = CONFIG.PLAYER_START_Y;
        this.vx = 0;
        this.vy = 0;
        this.facing = 1;
        this.invulnerable = true;
        this.invulnTimer = CONFIG.PLAYER_INVULN_TIME;
    }

    getRect() {
        return { x: this.x, y: this.y, w: CONFIG.PLAYER_WIDTH, h: CONFIG.PLAYER_HEIGHT };
    }
}

class Laser {
    constructor(x, y, dir) {
        this.x = x;
        this.y = y;
        this.vx = dir * CONFIG.LASER_SPEED;
        this.alive = true;
        this.lifetime = CONFIG.LASER_LIFETIME;
    }

    update() {
        this.x = MathUtils.wrapWorld(this.x + this.vx);
        this.lifetime--;
        if (this.lifetime <= 0) this.alive = false;
    }

    getRect() {
        return { x: this.x, y: this.y, w: CONFIG.LASER_WIDTH, h: CONFIG.LASER_HEIGHT };
    }
}

class Lander {
    constructor(x, y, targetHumanoid) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * CONFIG.LANDER_SPEED * 2;
        this.vy = 0;
        this.alive = true;
        this.state = 'seeking';
        this.targetHumanoid = targetHumanoid;
        this.carriedHumanoid = null;
        this.fireTimer = CONFIG.LANDER_FIRE_INTERVAL * (0.5 + Math.random());
    }

    update(playerX, playerY) {
        this.fireTimer -= CONFIG.FRAME_TIME;

        switch (this.state) {
            case 'seeking':
                if (this.targetHumanoid && this.targetHumanoid.alive && this.targetHumanoid.state === 'walking') {
                    // Calculate wrapped distance to target humanoid
                    const rawDx = this.targetHumanoid.x - this.x;
                    let dx = rawDx;
                    if (Math.abs(dx) > CONFIG.WORLD_WIDTH / 2) {
                        dx = dx > 0 ? dx - CONFIG.WORLD_WIDTH : dx + CONFIG.WORLD_WIDTH;
                    }
                    // Steer toward humanoid's X position
                    if (dx > 0) {
                        this.vx += 0.02;
                    } else {
                        this.vx -= 0.02;
                    }
                    this.vx = MathUtils.clamp(this.vx, -CONFIG.LANDER_SPEED, CONFIG.LANDER_SPEED);
                    // Once roughly above humanoid, begin descent
                    if (Math.abs(MathUtils.worldDistance(this.x, this.targetHumanoid.x)) < 20) {
                        this.state = 'descending';
                        this.vx *= 0.3; // Slow horizontal movement for descent
                    }
                } else {
                    // No valid target — drift randomly and shoot
                    this.vx += (Math.random() - 0.5) * 0.1;
                    this.vx = MathUtils.clamp(this.vx, -CONFIG.LANDER_SPEED, CONFIG.LANDER_SPEED);
                    this.vy += (Math.random() - 0.5) * 0.05;
                    this.vy = MathUtils.clamp(this.vy, -0.3, 0.3);
                }
                break;

            case 'descending':
                this.vy = CONFIG.LANDER_DESCENT_SPEED;
                // Check if reached humanoid's Y position
                if (this.targetHumanoid && this.targetHumanoid.alive && this.targetHumanoid.state === 'walking') {
                    if (Math.abs(this.y - this.targetHumanoid.y) < 10 &&
                        Math.abs(MathUtils.worldDistance(this.x, this.targetHumanoid.x)) < 12) {
                        this.state = 'capturing';
                    }
                } else {
                    // Target lost during descent — go back to seeking
                    this.state = 'seeking';
                    this.vy = 0;
                }
                break;

            case 'capturing':
                // Lock onto humanoid and begin ascending
                this.carriedHumanoid = this.targetHumanoid;
                this.carriedHumanoid.state = 'captured';
                this.carriedHumanoid.captor = this;
                this.vy = 0;
                this.state = 'ascending';
                break;

            case 'ascending':
                this.vy = -CONFIG.LANDER_ASCENT_SPEED;
                // Update carried humanoid position
                if (this.carriedHumanoid) {
                    this.carriedHumanoid.x = this.x;
                    this.carriedHumanoid.y = this.y + 8;
                }
                // If reached top of play area → mutate
                if (this.y <= CONFIG.PLAY_AREA_TOP) {
                    this.state = 'mutating';
                    if (this.carriedHumanoid) {
                        this.carriedHumanoid.alive = false;
                        this.carriedHumanoid = null;
                    }
                }
                break;

            case 'mutating':
                // Handled by game state — lander will be replaced by mutant
                break;
        }

        this.x = MathUtils.wrapWorld(this.x + this.vx);
        this.y = MathUtils.clamp(this.y + this.vy, CONFIG.PLAY_AREA_TOP, CONFIG.PLAY_AREA_BOTTOM);
    }

    fire(playerX, playerY) {
        if (this.fireTimer > 0) return null;
        this.fireTimer = CONFIG.LANDER_FIRE_INTERVAL * (0.5 + Math.random());
        // Calculate direction toward player with world wrapping
        let dx = playerX - this.x;
        if (Math.abs(dx) > CONFIG.WORLD_WIDTH / 2) {
            dx = dx > 0 ? dx - CONFIG.WORLD_WIDTH : dx + CONFIG.WORLD_WIDTH;
        }
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        return new Bullet(
            this.x, this.y,
            (dx / dist) * CONFIG.ENEMY_BULLET_SPEED,
            (dy / dist) * CONFIG.ENEMY_BULLET_SPEED
        );
    }

    getRect() {
        return { x: this.x, y: this.y, w: 8, h: 8 };
    }
}

class Mutant {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * CONFIG.MUTANT_SPEED;
        this.vy = (Math.random() - 0.5) * CONFIG.MUTANT_SPEED;
        this.alive = true;
        this.fireTimer = CONFIG.MUTANT_FIRE_INTERVAL * (0.5 + Math.random());
    }

    update(playerX, playerY) {
        this.fireTimer -= CONFIG.FRAME_TIME;

        // Aggressively track the player with some jitter
        let dx = playerX - this.x;
        if (Math.abs(dx) > CONFIG.WORLD_WIDTH / 2) {
            dx = dx > 0 ? dx - CONFIG.WORLD_WIDTH : dx + CONFIG.WORLD_WIDTH;
        }
        const dy = playerY - this.y;

        // Steer toward player
        this.vx += (dx > 0 ? 0.08 : -0.08) + (Math.random() - 0.5) * 0.1;
        this.vy += (dy > 0 ? 0.06 : -0.06) + (Math.random() - 0.5) * 0.08;

        // Clamp to max speed
        this.vx = MathUtils.clamp(this.vx, -CONFIG.MUTANT_SPEED, CONFIG.MUTANT_SPEED);
        this.vy = MathUtils.clamp(this.vy, -CONFIG.MUTANT_SPEED, CONFIG.MUTANT_SPEED);

        this.x = MathUtils.wrapWorld(this.x + this.vx);
        this.y = MathUtils.clamp(this.y + this.vy, CONFIG.PLAY_AREA_TOP, CONFIG.PLAY_AREA_BOTTOM);
    }

    fire(playerX, playerY) {
        if (this.fireTimer > 0) return null;
        this.fireTimer = CONFIG.MUTANT_FIRE_INTERVAL * (0.5 + Math.random());
        let dx = playerX - this.x;
        if (Math.abs(dx) > CONFIG.WORLD_WIDTH / 2) {
            dx = dx > 0 ? dx - CONFIG.WORLD_WIDTH : dx + CONFIG.WORLD_WIDTH;
        }
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        // Fire at angle toward player with slight spread
        const spread = (Math.random() - 0.5) * 0.3;
        return new Bullet(
            this.x, this.y,
            (dx / dist) * CONFIG.ENEMY_BULLET_SPEED + spread,
            (dy / dist) * CONFIG.ENEMY_BULLET_SPEED + spread
        );
    }

    getRect() {
        return { x: this.x, y: this.y, w: 10, h: 8 };
    }
}

class Baiter {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.alive = true;
        this.fireTimer = CONFIG.BAITER_FIRE_INTERVAL * (0.5 + Math.random());
    }

    update(playerX, playerY) {
        this.fireTimer -= CONFIG.FRAME_TIME;

        // Aggressively home toward player — tightest tracking of any enemy
        let dx = playerX - this.x;
        if (Math.abs(dx) > CONFIG.WORLD_WIDTH / 2) {
            dx = dx > 0 ? dx - CONFIG.WORLD_WIDTH : dx + CONFIG.WORLD_WIDTH;
        }
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Strong acceleration toward player
        this.vx += (dx / dist) * 0.15;
        this.vy += (dy / dist) * 0.12;

        // Clamp to max speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > CONFIG.BAITER_SPEED) {
            this.vx = (this.vx / speed) * CONFIG.BAITER_SPEED;
            this.vy = (this.vy / speed) * CONFIG.BAITER_SPEED;
        }

        this.x = MathUtils.wrapWorld(this.x + this.vx);
        this.y = MathUtils.clamp(this.y + this.vy, CONFIG.PLAY_AREA_TOP, CONFIG.PLAY_AREA_BOTTOM);
    }

    fire(playerX, playerY) {
        if (this.fireTimer > 0) return null;
        this.fireTimer = CONFIG.BAITER_FIRE_INTERVAL * (0.5 + Math.random());
        let dx = playerX - this.x;
        if (Math.abs(dx) > CONFIG.WORLD_WIDTH / 2) {
            dx = dx > 0 ? dx - CONFIG.WORLD_WIDTH : dx + CONFIG.WORLD_WIDTH;
        }
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        return new Bullet(
            this.x, this.y,
            (dx / dist) * CONFIG.ENEMY_BULLET_SPEED * 1.5,
            (dy / dist) * CONFIG.ENEMY_BULLET_SPEED * 1.5
        );
    }

    getRect() {
        return { x: this.x, y: this.y, w: 12, h: 5 };
    }
}

class Bomber {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.vx = (Math.random() < 0.5 ? -1 : 1) * CONFIG.BOMBER_SPEED;
        this.alive = true;
        this.sinePhase = Math.random() * Math.PI * 2;
        this.mineTimer = CONFIG.BOMBER_MINE_INTERVAL * (0.5 + Math.random());
    }

    update() {
        this.mineTimer -= CONFIG.FRAME_TIME;
        this.x = MathUtils.wrapWorld(this.x + this.vx);
        this.sinePhase += 0.05;
        this.y = MathUtils.clamp(
            this.baseY + Math.sin(this.sinePhase) * 30,
            CONFIG.PLAY_AREA_TOP,
            CONFIG.PLAY_AREA_BOTTOM
        );
    }

    dropMine() {
        if (this.mineTimer > 0) return null;
        this.mineTimer = CONFIG.BOMBER_MINE_INTERVAL * (0.5 + Math.random());
        return new Mine(this.x, this.y);
    }

    getRect() {
        return { x: this.x, y: this.y, w: 8, h: 8 };
    }
}

class Mine {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.alive = true;
        this.lifetime = CONFIG.MINE_LIFETIME;
    }

    update() {
        this.lifetime -= CONFIG.FRAME_TIME;
        if (this.lifetime <= 0) this.alive = false;
    }

    getRect() {
        return { x: this.x, y: this.y, w: 5, h: 5 };
    }
}

class Pod {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * CONFIG.POD_SPEED * 2;
        this.vy = (Math.random() - 0.5) * CONFIG.POD_SPEED * 2;
        this.alive = true;
    }

    update() {
        // Slow random drift with occasional direction changes
        this.vx += (Math.random() - 0.5) * 0.02;
        this.vy += (Math.random() - 0.5) * 0.02;
        this.vx = MathUtils.clamp(this.vx, -CONFIG.POD_SPEED, CONFIG.POD_SPEED);
        this.vy = MathUtils.clamp(this.vy, -CONFIG.POD_SPEED, CONFIG.POD_SPEED);
        this.x = MathUtils.wrapWorld(this.x + this.vx);
        this.y = MathUtils.clamp(this.y + this.vy, CONFIG.PLAY_AREA_TOP, CONFIG.PLAY_AREA_BOTTOM);
    }

    getRect() {
        return { x: this.x, y: this.y, w: 8, h: 8 };
    }
}

class Swarmer {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * CONFIG.SWARMER_SPEED;
        this.vy = (Math.random() - 0.5) * CONFIG.SWARMER_SPEED;
        this.alive = true;
        this.fireTimer = CONFIG.SWARMER_FIRE_INTERVAL * (0.5 + Math.random());
    }

    update(playerX, playerY) {
        this.fireTimer -= CONFIG.FRAME_TIME;

        // Home toward player — fast and erratic
        let dx = playerX - this.x;
        if (Math.abs(dx) > CONFIG.WORLD_WIDTH / 2) {
            dx = dx > 0 ? dx - CONFIG.WORLD_WIDTH : dx + CONFIG.WORLD_WIDTH;
        }
        const dy = playerY - this.y;

        this.vx += (dx > 0 ? 0.1 : -0.1) + (Math.random() - 0.5) * 0.15;
        this.vy += (dy > 0 ? 0.08 : -0.08) + (Math.random() - 0.5) * 0.12;

        this.vx = MathUtils.clamp(this.vx, -CONFIG.SWARMER_SPEED, CONFIG.SWARMER_SPEED);
        this.vy = MathUtils.clamp(this.vy, -CONFIG.SWARMER_SPEED, CONFIG.SWARMER_SPEED);

        this.x = MathUtils.wrapWorld(this.x + this.vx);
        this.y = MathUtils.clamp(this.y + this.vy, CONFIG.PLAY_AREA_TOP, CONFIG.PLAY_AREA_BOTTOM);
    }

    fire(playerX, playerY) {
        if (this.fireTimer > 0) return null;
        this.fireTimer = CONFIG.SWARMER_FIRE_INTERVAL * (0.5 + Math.random());
        let dx = playerX - this.x;
        if (Math.abs(dx) > CONFIG.WORLD_WIDTH / 2) {
            dx = dx > 0 ? dx - CONFIG.WORLD_WIDTH : dx + CONFIG.WORLD_WIDTH;
        }
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        return new Bullet(
            this.x, this.y,
            (dx / dist) * CONFIG.ENEMY_BULLET_SPEED,
            (dy / dist) * CONFIG.ENEMY_BULLET_SPEED
        );
    }

    getRect() {
        return { x: this.x, y: this.y, w: 4, h: 4 };
    }
}

class Humanoid {
    constructor(x, terrain) {
        this.x = x;
        const idx = Math.floor(x) % CONFIG.WORLD_WIDTH;
        const h = terrain[idx < 0 ? idx + CONFIG.WORLD_WIDTH : idx];
        this.y = CONFIG.TERRAIN_Y - h - 8;
        this.alive = true;
        this.state = 'walking'; // walking, captured, falling, carried
        this.captor = null;
        this.fallVy = 0;
        this.walkDir = Math.random() < 0.5 ? -1 : 1;
        this.fallStartY = 0;
    }

    update(terrain) {
        switch (this.state) {
            case 'walking':
                this.x = MathUtils.wrapWorld(this.x + this.walkDir * CONFIG.HUMANOID_WALK_SPEED);
                const idx = Math.floor(this.x) % CONFIG.WORLD_WIDTH;
                const h = terrain[idx < 0 ? idx + CONFIG.WORLD_WIDTH : idx];
                this.y = CONFIG.TERRAIN_Y - h - 8;
                if (Math.random() < 0.005) this.walkDir = -this.walkDir;
                break;

            case 'captured':
                // Position managed by Lander
                break;

            case 'falling':
                this.fallVy += CONFIG.HUMANOID_FALL_ACCEL;
                this.y += this.fallVy;
                // Check if landed on terrain
                const fi = Math.floor(this.x) % CONFIG.WORLD_WIDTH;
                const th = terrain[fi < 0 ? fi + CONFIG.WORLD_WIDTH : fi];
                const surfaceY = CONFIG.TERRAIN_Y - th - 8;
                if (this.y >= surfaceY) {
                    this.y = surfaceY;
                    // Survive if fell from a short distance
                    const fallDistance = this.y - this.fallStartY;
                    if (fallDistance > CONFIG.HUMANOID_SAFE_FALL) {
                        this.alive = false; // died from fall
                    } else {
                        this.state = 'walking';
                        this.fallVy = 0;
                    }
                }
                break;

            case 'carried':
                // Position managed by Player
                break;
        }
    }

    release() {
        // Called when lander carrying this humanoid is killed
        this.state = 'falling';
        this.fallVy = 0;
        this.fallStartY = this.y;
        this.captor = null;
    }

    getRect() {
        return { x: this.x, y: this.y, w: 4, h: 8 };
    }
}

class Bullet {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.alive = true;
        this.lifetime = 180; // ~3 seconds at 60fps
    }

    update() {
        this.x = MathUtils.wrapWorld(this.x + this.vx);
        this.y += this.vy;
        if (this.y < 0 || this.y > CONFIG.LOGICAL_HEIGHT) this.alive = false;
        this.lifetime--;
        if (this.lifetime <= 0) this.alive = false;
    }

    getRect() {
        return { x: this.x, y: this.y, w: 2, h: 2 };
    }
}

class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= CONFIG.FRAME_TIME;
        return this.life > 0;
    }
}
// ============================================================================
// SECTION 7: Collision System
// ============================================================================

const CollisionSystem = {
    // Convert world X to screen X, checking if entity is visible on screen
    _screenX(worldX, cameraX) {
        return MathUtils.worldToScreen(worldX, cameraX);
    },

    // Check if a screen-space rect is within visible area (with margin)
    _isOnScreen(screenX, margin) {
        return screenX >= -margin && screenX < CONFIG.LOGICAL_WIDTH + margin;
    },

    // Check overlap using screen-space positions to handle world wrap
    _checkOverlap(ax, ay, aw, ah, bx, by, bw, bh, cameraX) {
        const asx = this._screenX(ax, cameraX);
        const bsx = this._screenX(bx, cameraX);
        // Only check if both are reasonably on-screen
        if (!this._isOnScreen(asx, 40) && !this._isOnScreen(bsx, 40)) return false;
        return MathUtils.rectsOverlap(asx, ay, aw, ah, bsx, by, bw, bh);
    },

    // Check player lasers vs all enemies. Returns array of {type, enemy, laser, score, color}
    checkLaserEnemies(lasers, landers, mutants, baiters, bombers, pods, swarmers, cameraX) {
        const hits = [];

        const enemyGroups = [
            { list: landers, type: 'lander', score: CONFIG.SCORE_LANDER, color: CONFIG.COLOR_LANDER },
            { list: mutants, type: 'mutant', score: CONFIG.SCORE_MUTANT, color: CONFIG.COLOR_MUTANT },
            { list: baiters, type: 'baiter', score: CONFIG.SCORE_BAITER, color: CONFIG.COLOR_BAITER },
            { list: bombers, type: 'bomber', score: CONFIG.SCORE_BOMBER, color: CONFIG.COLOR_BOMBER },
            { list: pods, type: 'pod', score: CONFIG.SCORE_POD, color: CONFIG.COLOR_POD },
            { list: swarmers, type: 'swarmer', score: CONFIG.SCORE_SWARMER, color: CONFIG.COLOR_SWARMER },
        ];

        for (const laser of lasers) {
            if (!laser.alive) continue;
            const lr = laser.getRect();
            let laserHit = false;

            for (const group of enemyGroups) {
                if (laserHit) break;
                for (const enemy of group.list) {
                    if (!enemy.alive) continue;
                    const er = enemy.getRect();
                    if (this._checkOverlap(lr.x, lr.y, lr.w, lr.h, er.x, er.y, er.w, er.h, cameraX)) {
                        hits.push({
                            type: group.type,
                            enemy,
                            laser,
                            score: group.score,
                            color: group.color
                        });
                        laser.alive = false;
                        laserHit = true;
                        break;
                    }
                }
            }
        }

        return hits;
    },

    // Check player vs enemies and bullets. Returns true if player hit
    checkPlayerCollisions(player, landers, mutants, baiters, bombers, mines, pods, swarmers, enemyBullets, cameraX) {
        if (!player.alive || player.invulnerable) return false;
        const pr = player.getRect();

        const enemyLists = [landers, mutants, baiters, bombers, mines, pods, swarmers];
        for (const list of enemyLists) {
            for (const enemy of list) {
                if (!enemy.alive) continue;
                const er = enemy.getRect();
                if (this._checkOverlap(pr.x, pr.y, pr.w, pr.h, er.x, er.y, er.w, er.h, cameraX)) {
                    return true;
                }
            }
        }

        // Check enemy bullets
        for (const bullet of enemyBullets) {
            if (!bullet.alive) continue;
            const br = bullet.getRect();
            if (this._checkOverlap(pr.x, pr.y, pr.w, pr.h, br.x, br.y, br.w, br.h, cameraX)) {
                return true;
            }
        }

        return false;
    },

    // Check player vs falling humanoids. Returns humanoid if caught
    checkPlayerHumanoid(player, humanoids, cameraX) {
        if (!player.alive) return null;
        if (player.carriedHumanoid) return null;
        const pr = player.getRect();

        for (const h of humanoids) {
            if (!h.alive || h.state !== 'falling') continue;
            const hr = h.getRect();
            if (this._checkOverlap(pr.x, pr.y, pr.w, pr.h, hr.x, hr.y, hr.w, hr.h, cameraX)) {
                return h;
            }
        }
        return null;
    }
};


// ============================================================================
// SECTION 8: Renderer
// ============================================================================

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        canvas.width = CONFIG.WIDTH;
        canvas.height = CONFIG.HEIGHT;
        this.ctx.imageSmoothingEnabled = false;
    }

    drawSprite(sprite, screenX, screenY, color) {
        this.ctx.fillStyle = color;
        for (let row = 0; row < sprite.length; row++) {
            for (let col = 0; col < sprite[row].length; col++) {
                if (sprite[row][col]) {
                    this.ctx.fillRect(
                        Math.round(screenX + col),
                        Math.round(screenY + row),
                        1, 1
                    );
                }
            }
        }
    }

    drawText(text, x, y, color, size) {
        if (size === undefined) size = 1;
        this.ctx.fillStyle = color;
        const str = text.toUpperCase();
        let cx = x;
        for (let i = 0; i < str.length; i++) {
            const charData = SPRITES.FONT[str[i]];
            if (charData) {
                for (let row = 0; row < charData.length; row++) {
                    for (let col = 0; col < charData[row].length; col++) {
                        if (charData[row][col]) {
                            this.ctx.fillRect(
                                Math.round(cx + col * size),
                                Math.round(y + row * size),
                                size, size
                            );
                        }
                    }
                }
            }
            cx += 6 * size;
        }
    }

    // Get pixel width of text string at given size
    textWidth(text, size) {
        if (size === undefined) size = 1;
        return text.length * 6 * size - size;
    }

    drawTextCentered(text, y, color, size) {
        if (size === undefined) size = 1;
        const w = this.textWidth(text, size);
        const x = Math.floor((CONFIG.LOGICAL_WIDTH - w) / 2);
        this.drawText(text, x, y, color, size);
    }

    drawTerrain(terrain, cameraX, planetAlive) {
        if (!planetAlive) return;
        const ctx = this.ctx;
        ctx.strokeStyle = CONFIG.COLOR_TERRAIN;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let screenX = 0; screenX < CONFIG.LOGICAL_WIDTH; screenX++) {
            const worldX = MathUtils.wrapWorld(Math.floor(cameraX + screenX));
            const h = terrain[worldX] || 0;
            const y = CONFIG.TERRAIN_Y - h;
            if (screenX === 0) {
                ctx.moveTo(screenX, y);
            } else {
                ctx.lineTo(screenX, y);
            }
        }
        ctx.stroke();

        // Fill a thin strip below the terrain line (2px deep)
        ctx.beginPath();
        for (let screenX = 0; screenX < CONFIG.LOGICAL_WIDTH; screenX++) {
            const worldX = MathUtils.wrapWorld(Math.floor(cameraX + screenX));
            const h = terrain[worldX] || 0;
            const y = CONFIG.TERRAIN_Y - h;
            if (screenX === 0) ctx.moveTo(screenX, y);
            else ctx.lineTo(screenX, y);
        }
        ctx.lineTo(CONFIG.LOGICAL_WIDTH - 1, CONFIG.LOGICAL_HEIGHT);
        ctx.lineTo(0, CONFIG.LOGICAL_HEIGHT);
        ctx.closePath();
        ctx.fillStyle = CONFIG.COLOR_TERRAIN;
        ctx.globalAlpha = 0.15;
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    drawScanner(state) {
        const ctx = this.ctx;
        const scaleX = CONFIG.LOGICAL_WIDTH / CONFIG.WORLD_WIDTH;
        const scannerBottom = CONFIG.SCANNER_Y + CONFIG.SCANNER_HEIGHT;

        // Background
        ctx.fillStyle = CONFIG.COLOR_SCANNER_BG;
        ctx.fillRect(0, CONFIG.SCANNER_Y, CONFIG.LOGICAL_WIDTH, CONFIG.SCANNER_HEIGHT);

        // Scanner border line
        ctx.strokeStyle = CONFIG.COLOR_SCANNER_BORDER || '#333366';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, CONFIG.SCANNER_Y, CONFIG.LOGICAL_WIDTH, CONFIG.SCANNER_HEIGHT);

        // Terrain minimap
        if (state.planetAlive) {
            ctx.fillStyle = CONFIG.COLOR_TERRAIN;
            const step = 8;
            for (let wx = 0; wx < CONFIG.WORLD_WIDTH; wx += step) {
                const h = state.terrain[wx] || 0;
                const sx = wx * scaleX;
                const sy = scannerBottom - (h / CONFIG.LOGICAL_HEIGHT) * CONFIG.SCANNER_HEIGHT;
                ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1);
            }
        }

        // Humanoids as colored dots
        for (const h of state.humanoids) {
            if (!h.alive) continue;
            ctx.fillStyle = CONFIG.COLOR_HUMANOID;
            const sx = h.x * scaleX;
            const sy = CONFIG.SCANNER_Y + (h.y / CONFIG.LOGICAL_HEIGHT) * CONFIG.SCANNER_HEIGHT;
            ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1);
        }

        // Enemy dots
        const drawDots = (list, color) => {
            ctx.fillStyle = color;
            for (const e of list) {
                if (!e.alive) continue;
                const sx = e.x * scaleX;
                const sy = CONFIG.SCANNER_Y + (e.y / CONFIG.LOGICAL_HEIGHT) * CONFIG.SCANNER_HEIGHT;
                ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1);
            }
        };
        drawDots(state.landers, CONFIG.COLOR_LANDER);
        drawDots(state.mutants, CONFIG.COLOR_MUTANT);
        drawDots(state.baiters, CONFIG.COLOR_BAITER);
        drawDots(state.bombers, CONFIG.COLOR_BOMBER);
        drawDots(state.pods, CONFIG.COLOR_POD);
        drawDots(state.swarmers, CONFIG.COLOR_SWARMER);
        drawDots(state.mines, CONFIG.COLOR_MINE || '#888888');

        // Player dot (white, slightly larger)
        if (state.player.alive) {
            ctx.fillStyle = CONFIG.COLOR_PLAYER;
            const px = state.player.x * scaleX;
            const py = CONFIG.SCANNER_Y + (state.player.y / CONFIG.LOGICAL_HEIGHT) * CONFIG.SCANNER_HEIGHT;
            ctx.fillRect(Math.round(px) - 1, Math.round(py), 2, 1);
        }

        // Camera viewport indicator
        const vpX = MathUtils.wrapWorld(state.cameraX) * scaleX;
        const vpW = CONFIG.LOGICAL_WIDTH * scaleX;
        ctx.strokeStyle = CONFIG.COLOR_PLAYER;
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.round(vpX), CONFIG.SCANNER_Y, Math.round(vpW), CONFIG.SCANNER_HEIGHT);
    }

    drawHUD(state) {
        const ctx = this.ctx;

        // Score top-left
        const scoreStr = String(state.score).padStart(7, '0');
        this.drawText(scoreStr, 4, 2, CONFIG.COLOR_TEXT);

        // Hi-score top-center
        const hiStr = String(state.hiScore).padStart(7, '0');
        this.drawTextCentered(hiStr, 2, CONFIG.COLOR_HI_SCORE || '#ff4444');

        // Lives as small ship icons (top-right area)
        const livesX = CONFIG.LOGICAL_WIDTH - 80;
        for (let i = 0; i < Math.min(state.lives, 5); i++) {
            this.drawSprite(SPRITES.PLAYER_RIGHT, livesX + i * 12, 2, CONFIG.COLOR_PLAYER);
        }
        if (state.lives > 5) {
            this.drawText(String(state.lives), livesX + 60, 2, CONFIG.COLOR_TEXT);
        }

        // Smart bombs as small squares
        const bombsX = CONFIG.LOGICAL_WIDTH - 80;
        for (let i = 0; i < Math.min(state.bombs, 5); i++) {
            ctx.fillStyle = CONFIG.COLOR_BOMB || '#00ff00';
            ctx.fillRect(bombsX + i * 6, 11, 4, 4);
        }
        if (state.bombs > 5) {
            this.drawText(String(state.bombs), bombsX + 32, 11, CONFIG.COLOR_TEXT);
        }

        // Wave number far right
        this.drawText('W' + state.wave, CONFIG.LOGICAL_WIDTH - 24, 11, CONFIG.COLOR_TEXT);
    }

    drawEntities(state) {
        const cameraX = state.cameraX;
        const ctx = this.ctx;
        const margin = 20;

        // Draw humanoids
        for (const h of state.humanoids) {
            if (!h.alive) continue;
            const sx = MathUtils.worldToScreen(h.x, cameraX);
            if (sx >= -margin && sx < CONFIG.LOGICAL_WIDTH + margin) {
                this.drawSprite(SPRITES.HUMANOID, sx, h.y, CONFIG.COLOR_HUMANOID);
            }
        }

        // Draw landers
        for (const l of state.landers) {
            if (!l.alive) continue;
            const sx = MathUtils.worldToScreen(l.x, cameraX);
            if (sx >= -margin && sx < CONFIG.LOGICAL_WIDTH + margin) {
                this.drawSprite(SPRITES.LANDER, sx, l.y, CONFIG.COLOR_LANDER);
            }
        }

        // Draw mutants
        for (const m of state.mutants) {
            if (!m.alive) continue;
            const sx = MathUtils.worldToScreen(m.x, cameraX);
            if (sx >= -margin && sx < CONFIG.LOGICAL_WIDTH + margin) {
                this.drawSprite(SPRITES.MUTANT, sx, m.y, CONFIG.COLOR_MUTANT);
            }
        }

        // Draw baiters
        for (const b of state.baiters) {
            if (!b.alive) continue;
            const sx = MathUtils.worldToScreen(b.x, cameraX);
            if (sx >= -margin && sx < CONFIG.LOGICAL_WIDTH + margin) {
                this.drawSprite(SPRITES.BAITER, sx, b.y, CONFIG.COLOR_BAITER);
            }
        }

        // Draw bombers
        for (const b of state.bombers) {
            if (!b.alive) continue;
            const sx = MathUtils.worldToScreen(b.x, cameraX);
            if (sx >= -margin && sx < CONFIG.LOGICAL_WIDTH + margin) {
                this.drawSprite(SPRITES.BOMBER, sx, b.y, CONFIG.COLOR_BOMBER);
            }
        }

        // Draw mines
        for (const m of state.mines) {
            if (!m.alive) continue;
            const sx = MathUtils.worldToScreen(m.x, cameraX);
            if (sx >= -margin && sx < CONFIG.LOGICAL_WIDTH + margin) {
                this.drawSprite(SPRITES.MINE, sx, m.y, CONFIG.COLOR_MINE || '#888888');
            }
        }

        // Draw pods
        for (const p of state.pods) {
            if (!p.alive) continue;
            const sx = MathUtils.worldToScreen(p.x, cameraX);
            if (sx >= -margin && sx < CONFIG.LOGICAL_WIDTH + margin) {
                this.drawSprite(SPRITES.POD, sx, p.y, CONFIG.COLOR_POD);
            }
        }

        // Draw swarmers
        for (const s of state.swarmers) {
            if (!s.alive) continue;
            const sx = MathUtils.worldToScreen(s.x, cameraX);
            if (sx >= -margin && sx < CONFIG.LOGICAL_WIDTH + margin) {
                this.drawSprite(SPRITES.SWARMER, sx, s.y, CONFIG.COLOR_SWARMER);
            }
        }

        // Draw enemy bullets
        ctx.fillStyle = CONFIG.COLOR_BULLET || '#ffffff';
        for (const b of state.enemyBullets) {
            if (!b.alive) continue;
            const sx = MathUtils.worldToScreen(b.x, cameraX);
            if (sx >= -margin && sx < CONFIG.LOGICAL_WIDTH + margin) {
                ctx.fillRect(Math.round(sx), Math.round(b.y), 2, 2);
            }
        }

        // Draw player lasers
        ctx.fillStyle = CONFIG.COLOR_LASER || '#ffffff';
        for (const l of state.lasers) {
            if (!l.alive) continue;
            const sx = MathUtils.worldToScreen(l.x, cameraX);
            if (sx >= -margin && sx < CONFIG.LOGICAL_WIDTH + margin) {
                const lr = l.getRect();
                ctx.fillRect(Math.round(sx), Math.round(l.y), lr.w, lr.h);
            }
        }

        // Draw player
        if (state.player.alive) {
            // Blink during invulnerability
            if (state.player.invulnerable && Math.floor(state.player.invulnTimer / 80) % 2 === 0) {
                // Skip draw frame for blink effect
            } else {
                const psx = MathUtils.worldToScreen(state.player.x, cameraX);
                const sprite = state.player.facing === 1 ? SPRITES.PLAYER_RIGHT : SPRITES.PLAYER_LEFT;
                this.drawSprite(sprite, psx, state.player.y, CONFIG.COLOR_PLAYER);

                // Draw thrust flame
                if (state.player.thrustActive) {
                    const flameX = state.player.facing === 1 ? psx - 3 : psx + CONFIG.PLAYER_WIDTH + 1;
                    const flameW = 2 + Math.random() * 2;
                    ctx.fillStyle = '#ff6600';
                    ctx.fillRect(Math.round(flameX), Math.round(state.player.y + 3), Math.round(flameW), 2);
                    ctx.fillStyle = '#ffff00';
                    ctx.fillRect(Math.round(flameX), Math.round(state.player.y + 3), 1, 2);
                }
            }
        }

        // Draw particles
        for (const p of state.particles) {
            const sx = MathUtils.worldToScreen(p.x, cameraX);
            if (sx >= -margin && sx < CONFIG.LOGICAL_WIDTH + margin) {
                const alpha = p.life / p.maxLife;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.fillRect(Math.round(sx), Math.round(p.y), 1, 1);
            }
        }
        ctx.globalAlpha = 1.0;
    }

    drawAttractScreen(state) {
        // Title
        this.drawTextCentered('DEFENDER', 30, CONFIG.COLOR_TEXT, 3);

        // Scrolling enemy info display
        const enemyInfo = [
            { sprite: SPRITES.LANDER, name: 'LANDER', score: CONFIG.SCORE_LANDER, color: CONFIG.COLOR_LANDER },
            { sprite: SPRITES.MUTANT, name: 'MUTANT', score: CONFIG.SCORE_MUTANT, color: CONFIG.COLOR_MUTANT },
            { sprite: SPRITES.BAITER, name: 'BAITER', score: CONFIG.SCORE_BAITER, color: CONFIG.COLOR_BAITER },
            { sprite: SPRITES.BOMBER, name: 'BOMBER', score: CONFIG.SCORE_BOMBER, color: CONFIG.COLOR_BOMBER },
            { sprite: SPRITES.POD, name: 'POD', score: CONFIG.SCORE_POD, color: CONFIG.COLOR_POD },
            { sprite: SPRITES.SWARMER, name: 'SWARMER', score: CONFIG.SCORE_SWARMER, color: CONFIG.COLOR_SWARMER },
        ];

        const cycleTime = 2000;
        const currentIdx = Math.floor(state.attractTimer / cycleTime) % enemyInfo.length;
        const info = enemyInfo[currentIdx];

        // Draw current enemy showcase
        const showcaseY = 80;
        const spriteX = CONFIG.LOGICAL_WIDTH / 2 - 30;
        this.drawSprite(info.sprite, spriteX, showcaseY, info.color);
        this.drawText(info.name, spriteX + 14, showcaseY, info.color);
        this.drawText(String(info.score) + ' PTS', spriteX + 14, showcaseY + 10, CONFIG.COLOR_TEXT);

        // Controls info
        const controlsY = 120;
        this.drawTextCentered('CONTROLS', controlsY, CONFIG.COLOR_TEXT, 1);
        this.drawText('ARROWS  MOVE', 70, controlsY + 12, '#aaaaaa');
        this.drawText('SPACE   FIRE', 70, controlsY + 22, '#aaaaaa');
        this.drawText('D OR Z  SMART BOMB', 70, controlsY + 32, '#aaaaaa');
        this.drawText('H       HYPERSPACE', 70, controlsY + 42, '#aaaaaa');

        // High score
        if (state.hiScore > 0) {
            this.drawTextCentered('HI SCORE ' + String(state.hiScore).padStart(7, '0'), 180, CONFIG.COLOR_HI_SCORE || '#ff4444');
        }

        // Press enter to play (blinking)
        if (Math.floor(state.attractTimer / 500) % 2 === 0) {
            this.drawTextCentered('PRESS ENTER TO PLAY', 200, CONFIG.COLOR_TEXT);
        }

        // Terrain at bottom for ambiance
        this.drawTerrain(state.terrain, state.attractCameraX || 0, true);
    }

    drawGameOver(state) {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(0, CONFIG.PLAY_AREA_TOP, CONFIG.LOGICAL_WIDTH, CONFIG.PLAY_AREA_BOTTOM - CONFIG.PLAY_AREA_TOP);

        this.drawTextCentered('GAME OVER', CONFIG.LOGICAL_HEIGHT / 2 - 10, CONFIG.COLOR_TEXT, 2);
        this.drawTextCentered('SCORE ' + String(state.score).padStart(7, '0'), CONFIG.LOGICAL_HEIGHT / 2 + 15, CONFIG.COLOR_TEXT);
    }

    render(state) {
        const ctx = this.ctx;
        ctx.setTransform(CONFIG.SCALE, 0, 0, CONFIG.SCALE, 0, 0);
        ctx.imageSmoothingEnabled = false;

        // Clear
        ctx.fillStyle = CONFIG.COLOR_BG;
        ctx.fillRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT);

        switch (state.state) {
            case 'attract':
                this.drawAttractScreen(state);
                break;
            case 'playing':
            case 'playerDeath':
            case 'respawn':
            case 'waveStart':
            case 'waveComplete':
                this.drawGameplay(state);
                break;
            case 'gameOver':
                this.drawGameplay(state);
                this.drawGameOver(state);
                break;
        }
    }

    drawGameplay(state) {
        const ctx = this.ctx;

        // Draw terrain
        this.drawTerrain(state.terrain, state.cameraX, state.planetAlive);

        // Planet destroyed — show starfield/black void instead of terrain
        if (!state.planetAlive) {
            // Scattered stars for void feel
            ctx.fillStyle = '#444444';
            for (let i = 0; i < 20; i++) {
                const sx = (i * 97 + Math.floor(state.cameraX * 0.1)) % CONFIG.LOGICAL_WIDTH;
                const sy = CONFIG.PLAY_AREA_TOP + (i * 53) % (CONFIG.PLAY_AREA_BOTTOM - CONFIG.PLAY_AREA_TOP);
                ctx.fillRect(sx, sy, 1, 1);
            }
        }

        // Draw all entities
        this.drawEntities(state);

        // Draw scanner
        this.drawScanner(state);

        // Draw HUD
        this.drawHUD(state);

        // Smart bomb flash overlay
        if (state.smartBombFlash > 0) {
            const alpha = state.smartBombFlash / CONFIG.SMART_BOMB_FLASH_TIME;
            ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
            ctx.fillRect(0, CONFIG.PLAY_AREA_TOP, CONFIG.LOGICAL_WIDTH, CONFIG.PLAY_AREA_BOTTOM - CONFIG.PLAY_AREA_TOP);
        }

        // Wave start text overlay
        if (state.state === 'waveStart') {
            this.drawTextCentered('WAVE ' + state.wave, CONFIG.LOGICAL_HEIGHT / 2 - 5, CONFIG.COLOR_TEXT, 2);
        }

        // Wave complete overlay
        if (state.state === 'waveComplete') {
            this.drawTextCentered('WAVE COMPLETE', CONFIG.LOGICAL_HEIGHT / 2 - 20, CONFIG.COLOR_TEXT, 2);
            if (state.waveBonus !== undefined && state.waveBonus > 0) {
                this.drawTextCentered('BONUS ' + state.waveBonus, CONFIG.LOGICAL_HEIGHT / 2 + 5, '#00ff00');
            }
            const aliveCount = state.humanoids.filter(h => h.alive).length;
            this.drawTextCentered(aliveCount + ' HUMANOIDS SAVED', CONFIG.LOGICAL_HEIGHT / 2 + 18, CONFIG.COLOR_HUMANOID);
        }
    }
}


// ============================================================================
// SECTION 9: Game State Machine
// ============================================================================

class Game {
    constructor() {
        this.state = 'attract';
        this.player = new Player();
        this.lasers = [];
        this.landers = [];
        this.mutants = [];
        this.baiters = [];
        this.bombers = [];
        this.mines = [];
        this.pods = [];
        this.swarmers = [];
        this.humanoids = [];
        this.enemyBullets = [];
        this.particles = [];
        this.terrain = SPRITES.TERRAIN;
        this.cameraX = 0;
        this.score = 0;
        this.hiScore = 0;
        this.lives = CONFIG.STARTING_LIVES;
        this.bombs = CONFIG.STARTING_BOMBS;
        this.wave = 0;
        this.waveBonus = 0;
        this.smartBombFlash = 0;
        this.planetAlive = true;
        this.stateTimer = 0;
        this.baiterTimer = 0;
        this.attractTimer = 0;
        this.attractCameraX = 0;
        this.sound = new SoundEngine();
        this.input = new InputHandler();
    }

    getState() {
        return {
            state: this.state,
            player: this.player,
            lasers: this.lasers,
            landers: this.landers,
            mutants: this.mutants,
            baiters: this.baiters,
            bombers: this.bombers,
            mines: this.mines,
            pods: this.pods,
            swarmers: this.swarmers,
            humanoids: this.humanoids,
            enemyBullets: this.enemyBullets,
            particles: this.particles,
            terrain: this.terrain,
            cameraX: this.cameraX,
            score: this.score,
            hiScore: this.hiScore,
            lives: this.lives,
            bombs: this.bombs,
            wave: this.wave,
            waveBonus: this.waveBonus,
            smartBombFlash: this.smartBombFlash,
            planetAlive: this.planetAlive,
            attractTimer: this.attractTimer,
            attractCameraX: this.attractCameraX,
        };
    }

    addScore(pts) {
        const prev = this.score;
        this.score += pts;
        if (this.score > this.hiScore) this.hiScore = this.score;
        // Extra life + bomb every EXTRA_LIFE_SCORE points
        const prevThreshold = Math.floor(prev / CONFIG.EXTRA_LIFE_SCORE);
        const newThreshold = Math.floor(this.score / CONFIG.EXTRA_LIFE_SCORE);
        if (newThreshold > prevThreshold) {
            this.lives++;
            this.bombs++;
            this.sound.extraLife();
        }
    }

    spawnExplosion(x, y, color, count) {
        if (count === undefined) count = 10;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = MathUtils.randomRange(0.5, 2);
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                MathUtils.randomRange(300, 600)
            ));
        }
    }

    startGame() {
        this.sound.init();
        this.score = 0;
        this.lives = CONFIG.STARTING_LIVES;
        this.bombs = CONFIG.STARTING_BOMBS;
        this.wave = 0;
        this.planetAlive = true;
        this.lasers = [];
        this.enemyBullets = [];
        this.particles = [];
        this.player = new Player();
        this.player.respawn();

        // Spawn humanoids
        this.humanoids = [];
        for (let i = 0; i < CONFIG.HUMANOID_COUNT; i++) {
            const x = MathUtils.randomInt(0, CONFIG.WORLD_WIDTH - 1);
            this.humanoids.push(new Humanoid(x, this.terrain));
        }

        this.cameraX = this.player.x - CONFIG.LOGICAL_WIDTH / 2;
        this.nextWave();
    }

    nextWave() {
        this.wave++;
        this.state = 'waveStart';
        this.stateTimer = CONFIG.WAVE_START_DELAY;
        this.baiterTimer = CONFIG.BAITER_SPAWN_DELAY;
        this.sound.waveStart();

        // Restore planet every PLANET_RESTORE_WAVE waves
        if (this.wave > 1 && this.wave % CONFIG.PLANET_RESTORE_WAVE === 0 && !this.planetAlive) {
            this.planetAlive = true;
            this.humanoids = [];
            for (let i = 0; i < CONFIG.HUMANOID_COUNT; i++) {
                const x = MathUtils.randomInt(0, CONFIG.WORLD_WIDTH - 1);
                this.humanoids.push(new Humanoid(x, this.terrain));
            }
        }

        // Clear previous wave entities
        this.landers = [];
        this.mutants = [];
        this.baiters = [];
        this.bombers = [];
        this.pods = [];
        this.swarmers = [];
        this.mines = [];
        this.enemyBullets = [];

        // Spawn enemies based on wave table
        const waveIdx = Math.min(this.wave - 1, CONFIG.WAVE_TABLE.length - 1);
        const [numLanders, numBombers, numPods] = CONFIG.WAVE_TABLE[waveIdx];

        // Assign lander targets from alive walking humanoids
        const aliveHumanoids = this.humanoids.filter(h => h.alive && h.state === 'walking');

        for (let i = 0; i < numLanders; i++) {
            const x = MathUtils.randomInt(0, CONFIG.WORLD_WIDTH - 1);
            const y = MathUtils.randomInt(CONFIG.PLAY_AREA_TOP, CONFIG.PLAY_AREA_TOP + 60);
            const target = aliveHumanoids.length > 0
                ? aliveHumanoids[MathUtils.randomInt(0, aliveHumanoids.length - 1)]
                : null;
            this.landers.push(new Lander(x, y, target));
        }

        for (let i = 0; i < numBombers; i++) {
            const x = MathUtils.randomInt(0, CONFIG.WORLD_WIDTH - 1);
            const y = MathUtils.randomInt(CONFIG.PLAY_AREA_TOP + 20, CONFIG.PLAY_AREA_BOTTOM - 40);
            this.bombers.push(new Bomber(x, y));
        }

        for (let i = 0; i < numPods; i++) {
            const x = MathUtils.randomInt(0, CONFIG.WORLD_WIDTH - 1);
            const y = MathUtils.randomInt(CONFIG.PLAY_AREA_TOP + 20, CONFIG.PLAY_AREA_BOTTOM - 40);
            this.pods.push(new Pod(x, y));
        }
    }

    updateCamera() {
        // Camera tracks player — player offset 1/3 from the edge they face
        const targetX = this.player.facing === 1
            ? this.player.x - CONFIG.LOGICAL_WIDTH * 0.33
            : this.player.x - CONFIG.LOGICAL_WIDTH * 0.67;

        // Calculate shortest wrap-around distance
        let dx = targetX - this.cameraX;
        const halfWorld = CONFIG.WORLD_WIDTH / 2;
        if (dx > halfWorld) dx -= CONFIG.WORLD_WIDTH;
        if (dx < -halfWorld) dx += CONFIG.WORLD_WIDTH;

        this.cameraX = MathUtils.wrapWorld(this.cameraX + dx * 0.1);
    }

    update() {
        this.input.update();

        switch (this.state) {
            case 'attract':
                this.updateAttract();
                break;
            case 'waveStart':
                this.updateWaveStart();
                break;
            case 'playing':
                this.updatePlaying();
                break;
            case 'playerDeath':
                this.updatePlayerDeath();
                break;
            case 'respawn':
                this.updateRespawn();
                break;
            case 'waveComplete':
                this.updateWaveComplete();
                break;
            case 'gameOver':
                this.updateGameOver();
                break;
        }

        // Smart bomb flash decay
        if (this.smartBombFlash > 0) {
            this.smartBombFlash -= CONFIG.FRAME_TIME;
            if (this.smartBombFlash < 0) this.smartBombFlash = 0;
        }

        // Particles always update
        this.particles = this.particles.filter(p => p.update());
    }

    updateAttract() {
        this.attractTimer += CONFIG.FRAME_TIME;
        // Slowly scroll camera for attract terrain
        this.attractCameraX = MathUtils.wrapWorld(this.attractCameraX + 0.3);

        if (this.input.justPressed('Enter')) {
            this.startGame();
        }
    }

    updateWaveStart() {
        this.stateTimer -= CONFIG.FRAME_TIME;
        this.updateCamera();
        if (this.stateTimer <= 0) {
            this.state = 'playing';
        }
    }

    updatePlaying() {
        // Player movement
        this.player.update(this.input);
        this.sound.thrust(this.player.thrustActive);
        this.updateCamera();

        // Fire laser
        if (this.input.isDown('Space')) {
            const activeLasers = this.lasers.filter(l => l.alive).length;
            if (activeLasers < CONFIG.MAX_LASERS) {
                this.lasers.push(this.player.fire());
                this.sound.laser();
            }
        }

        // Smart bomb
        if ((this.input.justPressed('KeyD') || this.input.justPressed('KeyZ')) && this.bombs > 0) {
            this.bombs--;
            this.smartBombFlash = CONFIG.SMART_BOMB_FLASH_TIME;
            this.sound.smartBomb();
            this.killOnScreenEnemies();
        }

        // Hyperspace
        if (this.input.justPressed('KeyH')) {
            this.player.x = MathUtils.randomInt(0, CONFIG.WORLD_WIDTH - 1);
            this.player.y = MathUtils.randomInt(CONFIG.PLAY_AREA_TOP + 20, CONFIG.PLAY_AREA_BOTTOM - 20);
            this.player.vx = 0;
            this.sound.hyperspace();
            // Chance of death on re-entry
            if (Math.random() < CONFIG.HYPERSPACE_DEATH_CHANCE) {
                this.playerDied();
                return;
            }
        }

        // Deposit carried humanoid near terrain
        if (this.player.carriedHumanoid) {
            if (this.player.depositHumanoid(this.terrain)) {
                this.addScore(CONFIG.SCORE_DEPOSIT);
                this.sound.humanoidSaved();
            }
        }

        // Update lasers
        this.lasers.forEach(l => l.update());
        this.lasers = this.lasers.filter(l => l.alive);

        // Update all enemies
        this.landers.forEach(l => l.update(this.player.x, this.player.y));
        this.mutants.forEach(m => m.update(this.player.x, this.player.y));
        this.baiters.forEach(b => b.update(this.player.x, this.player.y));
        this.bombers.forEach(b => b.update());
        this.mines.forEach(m => m.update());
        this.pods.forEach(p => p.update());
        this.swarmers.forEach(s => s.update(this.player.x, this.player.y));
        this.humanoids.forEach(h => h.update(this.terrain));
        this.enemyBullets.forEach(b => b.update());

        // Enemy firing
        this.processEnemyFiring();

        // Bomber mine dropping
        for (const bomber of this.bombers) {
            if (!bomber.alive) continue;
            const mine = bomber.dropMine();
            if (mine) this.mines.push(mine);
        }

        // Check lander mutation (lander reached top with humanoid)
        for (let i = this.landers.length - 1; i >= 0; i--) {
            const l = this.landers[i];
            if (l.state === 'mutating') {
                this.mutants.push(new Mutant(l.x, l.y));
                this.sound.mutantTransform();
                this.landers.splice(i, 1);
            }
        }

        // === Collision detection ===

        // Laser hits enemies
        const hits = CollisionSystem.checkLaserEnemies(
            this.lasers, this.landers, this.mutants, this.baiters,
            this.bombers, this.pods, this.swarmers, this.cameraX
        );
        for (const hit of hits) {
            this.addScore(hit.score);
            hit.enemy.alive = false;
            this.spawnExplosion(hit.enemy.x, hit.enemy.y, hit.color || '#ffffff');
            this.sound.explosion();

            // Lander killed while carrying humanoid — release it
            if (hit.type === 'lander' && hit.enemy.carriedHumanoid) {
                hit.enemy.carriedHumanoid.release();
                this.sound.humanoidFalling();
            }

            // Pod killed — spawn swarmers
            if (hit.type === 'pod') {
                const count = MathUtils.randomInt(CONFIG.SWARMER_COUNT_MIN, CONFIG.SWARMER_COUNT_MAX);
                for (let i = 0; i < count; i++) {
                    this.swarmers.push(new Swarmer(
                        hit.enemy.x + (Math.random() - 0.5) * 10,
                        hit.enemy.y + (Math.random() - 0.5) * 10
                    ));
                }
            }
        }

        // Player vs enemies/bullets
        if (CollisionSystem.checkPlayerCollisions(
            this.player, this.landers, this.mutants, this.baiters,
            this.bombers, this.mines, this.pods, this.swarmers,
            this.enemyBullets, this.cameraX
        )) {
            this.playerDied();
            return;
        }

        // Player catches falling humanoid
        const caught = CollisionSystem.checkPlayerHumanoid(this.player, this.humanoids, this.cameraX);
        if (caught) {
            this.player.catchHumanoid(caught);
            this.addScore(CONFIG.SCORE_RESCUE);
            this.sound.humanoidSaved();
        }

        // Clean up dead entities
        this.landers = this.landers.filter(l => l.alive);
        this.mutants = this.mutants.filter(m => m.alive);
        this.baiters = this.baiters.filter(b => b.alive);
        this.bombers = this.bombers.filter(b => b.alive);
        this.mines = this.mines.filter(m => m.alive);
        this.pods = this.pods.filter(p => p.alive);
        this.swarmers = this.swarmers.filter(s => s.alive);
        this.enemyBullets = this.enemyBullets.filter(b => b.alive);

        // Check planet destruction (all humanoids dead)
        if (this.planetAlive && this.humanoids.length > 0 && this.humanoids.every(h => !h.alive)) {
            this.planetAlive = false;
            this.sound.planetExplode();
            // Big explosion particles across the terrain
            for (let i = 0; i < 40; i++) {
                const px = MathUtils.randomInt(0, CONFIG.WORLD_WIDTH - 1);
                this.spawnExplosion(px, CONFIG.TERRAIN_Y, CONFIG.COLOR_TERRAIN, 3);
            }
            // All surviving landers become mutants
            for (const l of this.landers) {
                if (l.alive) {
                    this.mutants.push(new Mutant(l.x, l.y));
                }
            }
            this.landers = [];
        }

        // Baiter spawn timer — baiters appear when player takes too long
        this.baiterTimer -= CONFIG.FRAME_TIME;
        if (this.baiterTimer <= 0) {
            this.baiterTimer = CONFIG.BAITER_SPAWN_DELAY / 2; // Faster after first
            const bx = MathUtils.wrapWorld(this.player.x + (Math.random() < 0.5 ? -200 : 200));
            const by = MathUtils.randomInt(CONFIG.PLAY_AREA_TOP, CONFIG.PLAY_AREA_BOTTOM);
            this.baiters.push(new Baiter(bx, by));
        }

        // Check wave complete — all enemies cleared
        const totalEnemies = this.landers.length + this.mutants.length +
            this.baiters.length + this.bombers.length +
            this.pods.length + this.swarmers.length;
        if (totalEnemies === 0) {
            this.state = 'waveComplete';
            this.stateTimer = 3000;
            // Calculate wave completion bonus
            const aliveHumanoids = this.humanoids.filter(h => h.alive).length;
            const multiplier = Math.min(this.wave, 5) * 100;
            this.waveBonus = aliveHumanoids * multiplier;
            this.addScore(this.waveBonus);
        }
    }

    processEnemyFiring() {
        const fireAndAdd = (list) => {
            for (const e of list) {
                if (!e.alive) continue;
                const bullet = e.fire(this.player.x, this.player.y);
                if (bullet) this.enemyBullets.push(bullet);
            }
        };
        fireAndAdd(this.landers);
        fireAndAdd(this.mutants);
        fireAndAdd(this.baiters);
        fireAndAdd(this.swarmers);
    }

    killOnScreenEnemies() {
        const halfW = CONFIG.LOGICAL_WIDTH / 2;
        const killList = (arr) => {
            for (const e of arr) {
                if (!e.alive) continue;
                const dist = Math.abs(MathUtils.worldDistance(e.x, this.player.x));
                if (dist < halfW + 20) {
                    e.alive = false;
                    this.spawnExplosion(e.x, e.y, '#ffffff', 8);
                    if (e.carriedHumanoid) {
                        e.carriedHumanoid.release();
                    }
                }
            }
        };
        killList(this.landers);
        killList(this.mutants);
        killList(this.baiters);
        killList(this.bombers);
        killList(this.pods);
        killList(this.swarmers);
        killList(this.mines);
        // Destroy on-screen enemy bullets
        for (const b of this.enemyBullets) {
            if (!b.alive) continue;
            const dist = Math.abs(MathUtils.worldDistance(b.x, this.player.x));
            if (dist < halfW + 20) b.alive = false;
        }
    }

    playerDied() {
        this.player.die();
        this.sound.bigExplosion();
        this.spawnExplosion(this.player.x, this.player.y, CONFIG.COLOR_PLAYER, 25);
        this.state = 'playerDeath';
        this.stateTimer = CONFIG.RESPAWN_DELAY;
        this.sound.thrust(false);

        // Release carried humanoid
        if (this.player.carriedHumanoid) {
            this.player.carriedHumanoid.release();
            this.player.carriedHumanoid = null;
        }
    }

    updatePlayerDeath() {
        this.stateTimer -= CONFIG.FRAME_TIME;
        this.updateEnemiesOnly();
        this.updateCamera();

        if (this.stateTimer <= 0) {
            this.lives--;
            if (this.lives <= 0) {
                this.state = 'gameOver';
                this.stateTimer = CONFIG.GAME_OVER_DURATION;
            } else {
                this.player.respawn();
                this.state = 'playing';
            }
        }
    }

    updateRespawn() {
        // Respawn state is handled by transitioning directly to 'playing'
        // with invulnerability on the player. This is done in updatePlayerDeath.
        // If we end up here, just run normal playing logic.
        this.updatePlaying();
    }

    updateWaveComplete() {
        this.stateTimer -= CONFIG.FRAME_TIME;
        this.updateCamera();
        // Still update humanoids so they keep walking
        this.humanoids.forEach(h => h.update(this.terrain));
        if (this.stateTimer <= 0) {
            this.nextWave();
        }
    }

    updateGameOver() {
        this.stateTimer -= CONFIG.FRAME_TIME;
        this.updateEnemiesOnly();
        if (this.stateTimer <= 0) {
            this.state = 'attract';
            this.attractTimer = 0;
        }
    }

    updateEnemiesOnly() {
        this.landers.forEach(l => l.update(this.player.x, this.player.y));
        this.mutants.forEach(m => m.update(this.player.x, this.player.y));
        this.baiters.forEach(b => b.update(this.player.x, this.player.y));
        this.bombers.forEach(b => b.update());
        this.mines.forEach(m => m.update());
        this.pods.forEach(p => p.update());
        this.swarmers.forEach(s => s.update(this.player.x, this.player.y));
        this.humanoids.forEach(h => h.update(this.terrain));
        this.enemyBullets.forEach(b => b.update());
        this.enemyBullets = this.enemyBullets.filter(b => b.alive);

        // Lander mutations still happen during death/game-over
        for (let i = this.landers.length - 1; i >= 0; i--) {
            const l = this.landers[i];
            if (l.state === 'mutating') {
                this.mutants.push(new Mutant(l.x, l.y));
                this.sound.mutantTransform();
                this.landers.splice(i, 1);
            }
        }
    }
}


// ============================================================================
// SECTION 10: Main Loop + Bootstrap
// ============================================================================

const canvas = document.getElementById('gameCanvas');
const renderer = new Renderer(canvas);
const game = new Game();

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

    renderer.render(game.getState());
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
