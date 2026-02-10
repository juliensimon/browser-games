'use strict';

// ============================================================================
// SECTION 1: CONFIG — All tunable game constants
// ============================================================================

const CONFIG = Object.freeze({
    // Display
    LOGICAL_WIDTH: 224,
    LOGICAL_HEIGHT: 288,
    SCALE: 3,
    WIDTH: 672,              // 224 * 3
    HEIGHT: 864,             // 288 * 3

    // Grid & Maze
    TILE_SIZE: 8,
    MAZE_COLS: 28,
    MAZE_ROWS: 36,

    // Pac-Man
    PACMAN_SPEED: 1.25,
    PACMAN_START_COL: 14,
    PACMAN_START_ROW: 26,
    PACMAN_RADIUS: 6,
    PACMAN_MOUTH_ANGLE: 0.25,
    PACMAN_ANIM_INTERVAL: 8,

    // Ghosts
    GHOST_SPEED: 1.0,
    GHOST_FRIGHTENED_SPEED: 0.6,
    GHOST_WIDTH: 14,
    GHOST_HEIGHT: 14,
    GHOST_HOUSE_COL: 13,
    GHOST_HOUSE_ROW: 18,
    GHOST_SCATTER_DURATION: 420,
    GHOST_CHASE_DURATION: 1200,
    GHOST_FRIGHTENED_DURATION: 360,
    GHOST_RESPAWN_DELAY: 180,
    GHOST_ANIM_INTERVAL: 10,

    // Ghost scatter targets (corners of playable maze area)
    BLINKY_SCATTER_COL: 25,
    BLINKY_SCATTER_ROW: 1,
    PINKY_SCATTER_COL: 2,
    PINKY_SCATTER_ROW: 1,
    INKY_SCATTER_COL: 25,
    INKY_SCATTER_ROW: 29,
    CLYDE_SCATTER_COL: 2,
    CLYDE_SCATTER_ROW: 29,

    // Dots
    DOT_RADIUS: 1,
    POWER_PELLET_RADIUS: 3,
    TOTAL_DOTS: 244,

    // Scoring
    SCORE_DOT: 10,
    SCORE_POWER_PELLET: 50,
    SCORE_GHOST_1: 200,
    SCORE_GHOST_2: 400,
    SCORE_GHOST_3: 800,
    SCORE_GHOST_4: 1600,

    // Game rules
    STARTING_LIVES: 3,
    EXTRA_LIFE_SCORE: 10000,

    // Timing
    FPS: 60,
    FRAME_TIME: 1000 / 60,
    MAX_DELTA: 200,
    READY_DURATION: 2000,
    DEATH_DURATION: 2000,
    GHOST_EATEN_PAUSE: 500,
    GAME_OVER_DURATION: 3000,

    // Colors
    COLOR_MAZE: '#2121FF',
    COLOR_DOT: '#FFB897',
    COLOR_POWER_PELLET: '#FFB897',
    COLOR_PACMAN: '#FFFF00',
    COLOR_BLINKY: '#FF0000',
    COLOR_PINKY: '#FFB8FF',
    COLOR_INKY: '#00FFFF',
    COLOR_CLYDE: '#FFB852',
    COLOR_FRIGHTENED: '#2121DE',
    COLOR_FRIGHTENED_FLASH: '#FFFFFF',
    COLOR_TEXT: '#FFFFFF',
    COLOR_BG: '#000000',
});

// ============================================================================
// SECTION 2: Math Utilities
// ============================================================================

const MathUtils = {
    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx &&
               ay < by + bh && ay + ah > by;
    },

    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px < rx + rw &&
               py >= ry && py < ry + rh;
    },

    gridToPixel(col, row) {
        return {
            x: col * CONFIG.TILE_SIZE,
            y: row * CONFIG.TILE_SIZE
        };
    },

    pixelToGrid(x, y) {
        return {
            col: Math.floor(x / CONFIG.TILE_SIZE),
            row: Math.floor(y / CONFIG.TILE_SIZE)
        };
    },

    manhattanDistance(col1, row1, col2, row2) {
        return Math.abs(col2 - col1) + Math.abs(row2 - row1);
    },

    wrapX(x) {
        if (x < 0) return CONFIG.LOGICAL_WIDTH - CONFIG.TILE_SIZE;
        if (x >= CONFIG.LOGICAL_WIDTH) return 0;
        return x;
    },
};

// ============================================================================
// SECTION 3: Sprite Data — Pixel-accurate 1980 arcade sprites
// ============================================================================

const SPRITES = {
    // Pac-Man closed mouth — 16x16
    PACMAN_CLOSED: [
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    ],

    // Pac-Man open mouth (45° wedge) — 16x16
    PACMAN_OPEN: [
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
        [1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
        [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
        [1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
        [1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
        [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
        [1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    ],

    // Ghost body — 14x14
    GHOST: [
        [0,0,0,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,0,1,1,1,0,0,1,1,1,0,1,1],
        [1,0,0,0,1,1,1,1,1,1,0,0,0,1],
    ],

    // Frightened ghost — 14x14
    GHOST_FRIGHTENED: [
        [0,0,0,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,1,0,1,1,0,1,0,1,1,0,1,0],
        [1,0,1,0,1,1,0,1,0,1,1,0,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,0,1,1,0,1,1,0,1,1,0,1,1],
        [1,0,1,0,0,1,0,0,1,0,0,1,0,1],
        [1,0,0,0,1,1,1,1,1,1,0,0,0,1],
        [0,1,1,1,0,0,0,0,0,0,1,1,1,0],
    ],

    // Bitmap font — each glyph is 7 rows x 5 cols
    FONT: {
        '0': [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,1,1],
            [1,0,1,0,1],
            [1,1,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,0],
        ],
        '1': [
            [0,0,1,0,0],
            [0,1,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,1,1,1,0],
        ],
        '2': [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [0,0,0,0,1],
            [0,0,0,1,0],
            [0,0,1,0,0],
            [0,1,0,0,0],
            [1,1,1,1,1],
        ],
        '3': [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [0,0,0,0,1],
            [0,0,1,1,0],
            [0,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,0],
        ],
        '4': [
            [0,0,0,1,0],
            [0,0,1,1,0],
            [0,1,0,1,0],
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
            [0,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,0],
        ],
        '6': [
            [0,0,1,1,0],
            [0,1,0,0,0],
            [1,0,0,0,0],
            [1,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,0],
        ],
        '7': [
            [1,1,1,1,1],
            [0,0,0,0,1],
            [0,0,0,1,0],
            [0,0,1,0,0],
            [0,1,0,0,0],
            [0,1,0,0,0],
            [0,1,0,0,0],
        ],
        '8': [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,0],
        ],
        '9': [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,1],
            [0,0,0,0,1],
            [0,0,0,1,0],
            [0,1,1,0,0],
        ],
        'A': [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
        ],
        'C': [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,1],
            [0,1,1,1,0],
        ],
        'D': [
            [1,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,0],
        ],
        'E': [
            [1,1,1,1,1],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,1,1,1,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,1,1,1,1],
        ],
        'G': [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,0],
            [1,0,1,1,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,0],
        ],
        'H': [
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
        ],
        'I': [
            [0,1,1,1,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,1,1,1,0],
        ],
        'L': [
            [1,0,0,0,0],
            [1,0,0,0,0],
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
            [1,0,0,0,1],
            [1,0,0,0,1],
        ],
        'N': [
            [1,0,0,0,1],
            [1,1,0,0,1],
            [1,0,1,0,1],
            [1,0,0,1,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
        ],
        'O': [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,0],
        ],
        'P': [
            [1,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
        ],
        'R': [
            [1,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,0],
            [1,0,1,0,0],
            [1,0,0,1,0],
            [1,0,0,0,1],
        ],
        'S': [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,0],
            [0,1,1,1,0],
            [0,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,0],
        ],
        'T': [
            [1,1,1,1,1],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
        ],
        'V': [
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,0,1,0],
            [0,0,1,0,0],
        ],
        'Y': [
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,0,1,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
        ],
        '-': [
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [1,1,1,1,1],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
        ],
        '!': [
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,0,0,0],
            [0,0,1,0,0],
        ],
    },
};

// ============================================================================
// SECTION 5: Input Handler
// ============================================================================

class InputHandler {
    constructor() {
        this.keysDown = new Set();
        this.keysJustPressed = new Set();

        this._onKeyDown = (e) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
                e.preventDefault();
            }
            if (!this.keysDown.has(e.key)) {
                this.keysJustPressed.add(e.key);
            }
            this.keysDown.add(e.key);
        };

        this._onKeyUp = (e) => {
            this.keysDown.delete(e.key);
        };

        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
    }

    isDown(key) { return this.keysDown.has(key); }
    justPressed(key) { return this.keysJustPressed.has(key); }

    // Direction helpers
    isLeft() { return this.isDown('ArrowLeft') || this.isDown('a') || this.isDown('A'); }
    isRight() { return this.isDown('ArrowRight') || this.isDown('d') || this.isDown('D'); }
    isUp() { return this.isDown('ArrowUp') || this.isDown('w') || this.isDown('W'); }
    isDownPressed() { return this.isDown('ArrowDown') || this.isDown('s') || this.isDown('S'); }

    isStart() { return this.justPressed('Enter'); }

    update() {
        this.keysJustPressed.clear();
    }
}

// ============================================================================
// SECTION 4: SOUND ENGINE
// ============================================================================

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.wakkaOscillator = null;
        this.wakkaGainNode = null;
        this.wakkaPlaying = false;
        this.wakkaToggle = false;
        this.wakkaIntervalId = null;
        this.sirenOscillator = null;
        this.sirenGainNode = null;
        this.sirenLFO = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            // AudioContext not available
        }
    }

    startWakka() {
        if (!this.ctx || this.wakkaPlaying) return;

        this.wakkaPlaying = true;
        this.wakkaToggle = false;

        // Create oscillator and gain node
        this.wakkaOscillator = this.ctx.createOscillator();
        this.wakkaGainNode = this.ctx.createGain();

        this.wakkaOscillator.type = 'square';
        this.wakkaOscillator.frequency.setValueAtTime(200, this.ctx.currentTime);
        this.wakkaGainNode.gain.setValueAtTime(0, this.ctx.currentTime);

        this.wakkaOscillator.connect(this.wakkaGainNode);
        this.wakkaGainNode.connect(this.ctx.destination);
        this.wakkaOscillator.start();

        // Toggle frequency and pulse volume every 150ms
        this.wakkaIntervalId = setInterval(() => {
            if (!this.ctx || !this.wakkaPlaying) return;

            const now = this.ctx.currentTime;
            this.wakkaToggle = !this.wakkaToggle;

            // Alternate between 200 Hz and 400 Hz
            const freq = this.wakkaToggle ? 400 : 200;
            this.wakkaOscillator.frequency.setValueAtTime(freq, now);

            // Pulse the volume
            this.wakkaGainNode.gain.cancelScheduledValues(now);
            this.wakkaGainNode.gain.setValueAtTime(0.15, now);
            this.wakkaGainNode.gain.linearRampToValueAtTime(0, now + 0.1);
        }, 150);
    }

    stopWakka() {
        if (!this.wakkaPlaying) return;

        this.wakkaPlaying = false;

        if (this.wakkaIntervalId) {
            clearInterval(this.wakkaIntervalId);
            this.wakkaIntervalId = null;
        }

        if (this.wakkaOscillator) {
            try {
                this.wakkaOscillator.stop();
            } catch (e) {
                // Already stopped
            }
            this.wakkaOscillator.disconnect();
            this.wakkaOscillator = null;
        }

        if (this.wakkaGainNode) {
            this.wakkaGainNode.disconnect();
            this.wakkaGainNode = null;
        }
    }

    playPowerPelletSiren() {
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const duration = 6.0;

        // Create oscillator with LFO for frequency modulation
        this.sirenOscillator = this.ctx.createOscillator();
        this.sirenGainNode = this.ctx.createGain();
        this.sirenLFO = this.ctx.createOscillator();

        const lfoGain = this.ctx.createGain();

        // Main oscillator - triangle wave
        this.sirenOscillator.type = 'triangle';
        this.sirenOscillator.frequency.setValueAtTime(200, now);

        // LFO for frequency modulation (creates rising/falling effect)
        this.sirenLFO.type = 'sine';
        this.sirenLFO.frequency.setValueAtTime(2, now); // 2 Hz modulation

        // LFO depth - modulates between 200-800 Hz
        lfoGain.gain.setValueAtTime(300, now);

        // Connect LFO to oscillator frequency
        this.sirenLFO.connect(lfoGain);
        lfoGain.connect(this.sirenOscillator.frequency);

        // Volume envelope
        this.sirenGainNode.gain.setValueAtTime(0.2, now);
        this.sirenGainNode.gain.linearRampToValueAtTime(0, now + duration);

        // Connect and start
        this.sirenOscillator.connect(this.sirenGainNode);
        this.sirenGainNode.connect(this.ctx.destination);

        this.sirenOscillator.start(now);
        this.sirenLFO.start(now);

        this.sirenOscillator.stop(now + duration);
        this.sirenLFO.stop(now + duration);

        // Cleanup after duration
        setTimeout(() => {
            if (this.sirenOscillator) {
                this.sirenOscillator.disconnect();
                this.sirenOscillator = null;
            }
            if (this.sirenGainNode) {
                this.sirenGainNode.disconnect();
                this.sirenGainNode = null;
            }
            if (this.sirenLFO) {
                this.sirenLFO.disconnect();
                this.sirenLFO = null;
            }
        }, duration * 1000 + 100);
    }

    playGhostEaten() {
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const duration = 0.3;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';

        // Ascending tone from 500 to 2000 Hz
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(2000, now + duration);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    playDeath() {
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const duration = 2.0;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';

        // Descending chromatic scale from 800 to 100 Hz
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + duration);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.setValueAtTime(0.15, now + duration - 0.2);
        gain.gain.linearRampToValueAtTime(0, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }
}

// ============================================================================
// SECTION 6: ENTITY CLASSES
// ============================================================================

class PacMan {
    constructor(startCol, startRow) {
        // Position
        this.col = startCol;
        this.row = startRow;
        this.x = startCol * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        this.y = startRow * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

        // Movement - direction is {dx, dy} where dx/dy are -1, 0, or +1
        this.currentDir = { dx: 0, dy: 0 };
        this.nextDir = { dx: 0, dy: 0 };  // Buffered input
        this.speed = CONFIG.PACMAN_SPEED;

        // Animation
        this.mouthOpen = false;
        this.animTimer = 0;

        // State
        this.alive = true;
        this.deathAnimFrame = 0;
    }

    update(input, mazeWalls) {
        if (!this.alive) return;

        // Read input and buffer next direction
        if (input.isLeft()) {
            this.nextDir = { dx: -1, dy: 0 };
        } else if (input.isRight()) {
            this.nextDir = { dx: 1, dy: 0 };
        } else if (input.isUp()) {
            this.nextDir = { dx: 0, dy: -1 };
        } else if (input.isDownPressed()) {
            this.nextDir = { dx: 0, dy: 1 };
        }

        // Try to turn to buffered direction if at tile center
        this.tryTurn(mazeWalls);

        // Move in current direction
        if (this.currentDir.dx !== 0 || this.currentDir.dy !== 0) {
            const nextX = this.x + this.currentDir.dx * this.speed;
            const nextY = this.y + this.currentDir.dy * this.speed;

            if (this.canMove(this.currentDir, mazeWalls, nextX, nextY)) {
                this.x = nextX;
                this.y = nextY;

                // Tunnel wraparound
                this.x = MathUtils.wrapX(this.x);
            }
        }

        // Update tile position
        const tile = MathUtils.pixelToGrid(this.x, this.y);
        this.col = tile.col;
        this.row = tile.row;

        // Animate mouth
        this.animTimer++;
        if (this.animTimer >= CONFIG.PACMAN_ANIM_INTERVAL) {
            this.mouthOpen = !this.mouthOpen;
            this.animTimer = 0;
        }
    }

    canMove(dir, mazeWalls, nextX, nextY) {
        // Check if next position would hit a wall
        // Account for Pac-Man's size by checking corners of sprite
        const radius = CONFIG.TILE_SIZE / 2 - 1;

        // Check the leading edge in the direction of movement
        let checkX = nextX;
        let checkY = nextY;

        if (dir.dx > 0) {
            checkX = nextX + radius;
        } else if (dir.dx < 0) {
            checkX = nextX - radius;
        }

        if (dir.dy > 0) {
            checkY = nextY + radius;
        } else if (dir.dy < 0) {
            checkY = nextY - radius;
        }

        // Also check the perpendicular edges to prevent wall clipping
        const tile = MathUtils.pixelToGrid(checkX, checkY);

        if (tile.col < 0 || tile.col >= CONFIG.MAZE_COLS ||
            tile.row < 0 || tile.row >= CONFIG.MAZE_ROWS) {
            return false;
        }

        if (mazeWalls[tile.col] && mazeWalls[tile.col][tile.row]) {
            return false;
        }

        // Check perpendicular corners if moving diagonally or need edge checking
        if (dir.dx !== 0) {
            // Check top and bottom edges
            const topTile = MathUtils.pixelToGrid(checkX, nextY - radius);
            const bottomTile = MathUtils.pixelToGrid(checkX, nextY + radius);

            if (topTile.col >= 0 && topTile.col < CONFIG.MAZE_COLS &&
                topTile.row >= 0 && topTile.row < CONFIG.MAZE_ROWS) {
                if (mazeWalls[topTile.col] && mazeWalls[topTile.col][topTile.row]) {
                    return false;
                }
            }

            if (bottomTile.col >= 0 && bottomTile.col < CONFIG.MAZE_COLS &&
                bottomTile.row >= 0 && bottomTile.row < CONFIG.MAZE_ROWS) {
                if (mazeWalls[bottomTile.col] && mazeWalls[bottomTile.col][bottomTile.row]) {
                    return false;
                }
            }
        }

        if (dir.dy !== 0) {
            // Check left and right edges
            const leftTile = MathUtils.pixelToGrid(nextX - radius, checkY);
            const rightTile = MathUtils.pixelToGrid(nextX + radius, checkY);

            if (leftTile.col >= 0 && leftTile.col < CONFIG.MAZE_COLS &&
                leftTile.row >= 0 && leftTile.row < CONFIG.MAZE_ROWS) {
                if (mazeWalls[leftTile.col] && mazeWalls[leftTile.col][leftTile.row]) {
                    return false;
                }
            }

            if (rightTile.col >= 0 && rightTile.col < CONFIG.MAZE_COLS &&
                rightTile.row >= 0 && rightTile.row < CONFIG.MAZE_ROWS) {
                if (mazeWalls[rightTile.col] && mazeWalls[rightTile.col][rightTile.row]) {
                    return false;
                }
            }
        }

        return true;
    }

    tryTurn(mazeWalls) {
        // Check if at tile center (within 2 pixels)
        const centerX = this.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        const centerY = this.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

        if (Math.abs(this.x - centerX) <= 2 && Math.abs(this.y - centerY) <= 2) {
            // Try to turn to nextDir if it's different and valid
            if ((this.nextDir.dx !== this.currentDir.dx || this.nextDir.dy !== this.currentDir.dy) &&
                (this.nextDir.dx !== 0 || this.nextDir.dy !== 0)) {
                const testX = this.x + this.nextDir.dx * this.speed;
                const testY = this.y + this.nextDir.dy * this.speed;
                if (this.canMove(this.nextDir, mazeWalls, testX, testY)) {
                    this.currentDir = { dx: this.nextDir.dx, dy: this.nextDir.dy };
                    // Snap to center
                    this.x = centerX;
                    this.y = centerY;
                }
            }
        }
    }

    die() {
        this.alive = false;
        this.deathAnimFrame = 0;
        this.currentDir = { dx: 0, dy: 0 };
    }
}

class Ghost {
    constructor(type, startCol, startRow) {
        this.type = type;  // 'blinky' | 'pinky' | 'inky' | 'clyde'

        // Position
        this.col = startCol;
        this.row = startRow;
        this.x = startCol * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        this.y = startRow * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

        // Movement
        this.currentDir = { dx: 0, dy: -1 };  // Start moving up
        this.speed = CONFIG.GHOST_SPEED;

        // AI State
        this.mode = 'scatter';  // 'scatter' | 'chase' | 'frightened' | 'eaten'
        this.modeTimer = CONFIG.GHOST_SCATTER_DURATION;
        this.modeIndex = 0;  // Cycles through scatter-chase phases

        // Target tile (calculated each update)
        this.targetCol = 0;
        this.targetRow = 0;

        // Frightened state
        this.frightenedTimer = 0;
        this.flashWhite = false;

        // Eaten state
        this.respawnTimer = 0;

        // Animation
        this.frame = 0;
        this.animTimer = 0;
    }

    update(pacman, mazeWalls, powerPelletActive) {
        if (this.mode === 'eaten') {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) {
                this.mode = 'scatter';
                this.modeTimer = CONFIG.GHOST_SCATTER_DURATION;
                this.col = CONFIG.GHOST_HOUSE_COL;
                this.row = CONFIG.GHOST_HOUSE_ROW;
                this.x = this.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
                this.y = this.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
                this.speed = CONFIG.GHOST_SPEED;
            }
            return;
        }

        // Update mode timer
        if (this.mode !== 'frightened') {
            this.updateMode();
        } else {
            this.frightenedTimer--;
            if (this.frightenedTimer <= 0) {
                // Return to previous mode
                this.mode = (this.modeIndex % 2 === 0) ? 'scatter' : 'chase';
                this.speed = CONFIG.GHOST_SPEED;
            }
            // Flash white in last 2 seconds
            this.flashWhite = this.frightenedTimer < 120 && (Math.floor(this.frightenedTimer / 15) % 2 === 0);
        }

        // Calculate target tile
        const target = this.calculateTarget(pacman);
        this.targetCol = target.col;
        this.targetRow = target.row;

        // Choose direction at tile centers
        const centerX = this.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        const centerY = this.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

        if (Math.abs(this.x - centerX) <= 1 && Math.abs(this.y - centerY) <= 1) {
            // At tile center, choose new direction
            this.currentDir = this.chooseDirection(mazeWalls);
            // Snap to center
            this.x = centerX;
            this.y = centerY;
        }

        // Move
        const moveSpeed = (this.mode === 'frightened') ? CONFIG.GHOST_FRIGHTENED_SPEED : this.speed;
        this.x += this.currentDir.dx * moveSpeed;
        this.y += this.currentDir.dy * moveSpeed;

        // Tunnel wraparound
        this.x = MathUtils.wrapX(this.x);

        // Update tile position
        const newTile = MathUtils.pixelToGrid(this.x, this.y);
        this.col = newTile.col;
        this.row = newTile.row;

        // Update animation
        this.animTimer++;
        if (this.animTimer >= CONFIG.GHOST_ANIM_INTERVAL) {
            this.frame = (this.frame + 1) % 2;
            this.animTimer = 0;
        }
    }

    updateMode() {
        this.modeTimer--;
        if (this.modeTimer <= 0) {
            // Cycle through scatter-chase-scatter-chase-chase(permanent)
            if (this.modeIndex < 3) {
                this.modeIndex++;
                if (this.modeIndex % 2 === 0) {
                    this.mode = 'scatter';
                    this.modeTimer = CONFIG.GHOST_SCATTER_DURATION;
                } else {
                    this.mode = 'chase';
                    this.modeTimer = CONFIG.GHOST_CHASE_DURATION;
                }
            } else {
                this.mode = 'chase';
                this.modeTimer = CONFIG.GHOST_CHASE_DURATION;
            }
        }
    }

    calculateTarget(pacman) {
        if (this.mode === 'scatter') {
            // Return home corner based on type
            if (this.type === 'blinky') {
                return { col: CONFIG.BLINKY_SCATTER_COL, row: CONFIG.BLINKY_SCATTER_ROW };
            }
            if (this.type === 'pinky') {
                return { col: CONFIG.PINKY_SCATTER_COL, row: CONFIG.PINKY_SCATTER_ROW };
            }
            if (this.type === 'inky') {
                return { col: CONFIG.INKY_SCATTER_COL, row: CONFIG.INKY_SCATTER_ROW };
            }
            return { col: CONFIG.CLYDE_SCATTER_COL, row: CONFIG.CLYDE_SCATTER_ROW };
        } else if (this.mode === 'chase') {
            // Simplified: all ghosts target Pac-Man's position
            // In the original game, each ghost has unique targeting:
            // - Blinky targets Pac-Man directly
            // - Pinky targets 4 tiles ahead of Pac-Man
            // - Inky uses complex calculation with Blinky's position
            // - Clyde targets Pac-Man when far, scatter corner when close

            if (this.type === 'blinky') {
                return { col: pacman.col, row: pacman.row };
            } else if (this.type === 'pinky') {
                // Target 4 tiles ahead of Pac-Man
                const targetCol = pacman.col + pacman.currentDir.dx * 4;
                const targetRow = pacman.row + pacman.currentDir.dy * 4;
                return {
                    col: MathUtils.clamp(targetCol, 0, CONFIG.MAZE_COLS - 1),
                    row: MathUtils.clamp(targetRow, 0, CONFIG.MAZE_ROWS - 1)
                };
            } else if (this.type === 'inky') {
                // Simplified: target 2 tiles ahead
                const targetCol = pacman.col + pacman.currentDir.dx * 2;
                const targetRow = pacman.row + pacman.currentDir.dy * 2;
                return {
                    col: MathUtils.clamp(targetCol, 0, CONFIG.MAZE_COLS - 1),
                    row: MathUtils.clamp(targetRow, 0, CONFIG.MAZE_ROWS - 1)
                };
            } else {
                // Clyde: target Pac-Man if far away, otherwise scatter
                const dist = MathUtils.manhattanDistance(this.col, this.row, pacman.col, pacman.row);
                if (dist > 8) {
                    return { col: pacman.col, row: pacman.row };
                } else {
                    return { col: CONFIG.CLYDE_SCATTER_COL, row: CONFIG.CLYDE_SCATTER_ROW };
                }
            }
        } else {
            // Frightened: random target (makes ghosts wander randomly)
            return {
                col: MathUtils.randomInt(0, CONFIG.MAZE_COLS - 1),
                row: MathUtils.randomInt(0, CONFIG.MAZE_ROWS - 1)
            };
        }
    }

    chooseDirection(mazeWalls) {
        // Get valid directions (not reverse, not walls)
        const validDirs = this.getValidDirections(mazeWalls);

        if (validDirs.length === 0) {
            return this.currentDir;
        }
        if (validDirs.length === 1) {
            return validDirs[0];
        }

        // In frightened mode, choose randomly
        if (this.mode === 'frightened') {
            const randomIndex = MathUtils.randomInt(0, validDirs.length - 1);
            return validDirs[randomIndex];
        }

        // Choose direction minimizing Manhattan distance to target
        let bestDir = validDirs[0];
        let bestDist = Infinity;

        for (const dir of validDirs) {
            const nextCol = this.col + dir.dx;
            const nextRow = this.row + dir.dy;
            const dist = MathUtils.manhattanDistance(nextCol, nextRow, this.targetCol, this.targetRow);
            if (dist < bestDist) {
                bestDist = dist;
                bestDir = dir;
            }
        }

        return bestDir;
    }

    getValidDirections(mazeWalls) {
        // Return array of valid directions, excluding reverse
        const dirs = [
            { dx: 0, dy: -1 },  // up
            { dx: 0, dy: 1 },   // down
            { dx: -1, dy: 0 },  // left
            { dx: 1, dy: 0 },   // right
        ];

        const valid = [];
        for (const dir of dirs) {
            // Skip reverse direction (except in frightened mode at start)
            if (dir.dx === -this.currentDir.dx && dir.dy === -this.currentDir.dy) {
                continue;
            }

            // Check if wall
            const nextCol = this.col + dir.dx;
            const nextRow = this.row + dir.dy;

            if (nextCol < 0 || nextCol >= CONFIG.MAZE_COLS ||
                nextRow < 0 || nextRow >= CONFIG.MAZE_ROWS) {
                continue;
            }

            if (mazeWalls[nextCol] && mazeWalls[nextCol][nextRow]) {
                continue;
            }

            valid.push(dir);
        }

        return valid;
    }

    setFrightened() {
        if (this.mode === 'eaten') return;
        this.mode = 'frightened';
        this.frightenedTimer = CONFIG.GHOST_FRIGHTENED_DURATION;
        this.speed = CONFIG.GHOST_FRIGHTENED_SPEED;
        this.flashWhite = false;
        // Reverse direction
        this.currentDir = { dx: -this.currentDir.dx, dy: -this.currentDir.dy };
    }

    setEaten() {
        this.mode = 'eaten';
        this.respawnTimer = CONFIG.GHOST_RESPAWN_DELAY;
        this.speed = CONFIG.GHOST_SPEED * 2;  // Ghosts move fast when returning
    }

    getColor() {
        if (this.mode === 'eaten') {
            return CONFIG.COLOR_EYES;
        }
        if (this.mode === 'frightened') {
            return this.flashWhite ? CONFIG.COLOR_FRIGHTENED_FLASH : CONFIG.COLOR_FRIGHTENED;
        }
        if (this.type === 'blinky') {
            return CONFIG.COLOR_BLINKY;
        }
        if (this.type === 'pinky') {
            return CONFIG.COLOR_PINKY;
        }
        if (this.type === 'inky') {
            return CONFIG.COLOR_INKY;
        }
        return CONFIG.COLOR_CLYDE;
    }
}

// ============================================================================
// SECTION 7: COLLISION SYSTEM
// ============================================================================

const CollisionSystem = {
    checkPacmanWall(pacman, direction, mazeWalls) {
        const tileSize = CONFIG.TILE_SIZE;
        const nextX = pacman.x + direction.dx * pacman.speed;
        const nextY = pacman.y + direction.dy * pacman.speed;

        // Check all four corners of Pac-Man's bounding box
        const radius = CONFIG.PACMAN_RADIUS;
        const corners = [
            { x: nextX - radius, y: nextY - radius },
            { x: nextX + radius, y: nextY - radius },
            { x: nextX - radius, y: nextY + radius },
            { x: nextX + radius, y: nextY + radius }
        ];

        for (const corner of corners) {
            const col = Math.floor(corner.x / tileSize);
            const row = Math.floor(corner.y / tileSize);

            if (col < 0 || col >= CONFIG.MAZE_COLS || row < 0 || row >= CONFIG.MAZE_ROWS) {
                return true;
            }

            if (mazeWalls[col] && mazeWalls[col][row]) {
                return true;
            }
        }

        return false;
    },

    checkPacmanDot(pacman, dots) {
        const col = Math.floor(pacman.x / CONFIG.TILE_SIZE);
        const row = Math.floor(pacman.y / CONFIG.TILE_SIZE);

        if (col < 0 || col >= CONFIG.MAZE_COLS || row < 0 || row >= CONFIG.MAZE_ROWS) {
            return null;
        }

        const dotType = dots[col] && dots[col][row];
        if (dotType === 2 || dotType === 3) {
            return { type: dotType, col, row };
        }

        return null;
    },

    checkPacmanGhosts(pacman, ghosts) {
        const pacmanRadius = CONFIG.PACMAN_RADIUS;
        const ghostRadius = CONFIG.GHOST_RADIUS;

        for (const ghost of ghosts) {
            if (ghost.mode === 'eaten') continue;

            const dx = pacman.x - ghost.x;
            const dy = pacman.y - ghost.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < pacmanRadius + ghostRadius) {
                return ghost;
            }
        }

        return null;
    },

    isCenteredOnTile(x, y) {
        const tileSize = CONFIG.TILE_SIZE;
        const centerX = Math.floor(x / tileSize) * tileSize + tileSize / 2;
        const centerY = Math.floor(y / tileSize) * tileSize + tileSize / 2;

        const dx = Math.abs(x - centerX);
        const dy = Math.abs(y - centerY);

        return dx < 2 && dy < 2;
    }
};

// ============================================================================
// SECTION 8: RENDERER
// ============================================================================

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = CONFIG.WIDTH;
        this.canvas.height = CONFIG.HEIGHT;
        this.ctx.imageSmoothingEnabled = false;
    }

    render(gameState) {
        this.ctx.setTransform(CONFIG.SCALE, 0, 0, CONFIG.SCALE, 0, 0);

        this.ctx.fillStyle = CONFIG.COLOR_BG;
        this.ctx.fillRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT);

        switch (gameState.state) {
            case 'attract':
                this.renderAttract(gameState);
                break;
            case 'ready':
                this.renderReady(gameState);
                break;
            case 'playing':
                this.renderPlaying(gameState);
                break;
            case 'pacmanDeath':
                this.renderDeath(gameState);
                break;
            case 'gameOver':
                this.renderGameOver(gameState);
                break;
        }
    }

    renderAttract(state) {
        this.drawText('PAC-MAN', CONFIG.LOGICAL_WIDTH / 2 - 35, 60, CONFIG.COLOR_PACMAN);
        this.drawText('PRESS ENTER TO START', CONFIG.LOGICAL_WIDTH / 2 - 60, 120, CONFIG.COLOR_TEXT);

        this.drawText('HIGH SCORE', CONFIG.LOGICAL_WIDTH / 2 - 50, 180, CONFIG.COLOR_TEXT);
        this.drawText(state.highScore.toString(), CONFIG.LOGICAL_WIDTH / 2 - 20, 195, CONFIG.COLOR_PACMAN);

        const ghostY = 240;
        const ghostColors = [CONFIG.COLOR_BLINKY, CONFIG.COLOR_PINKY, CONFIG.COLOR_INKY, CONFIG.COLOR_CLYDE];
        for (let i = 0; i < 4; i++) {
            const x = CONFIG.LOGICAL_WIDTH / 2 - 40 + i * 25;
            this.ctx.fillStyle = ghostColors[i];
            this.ctx.fillRect(x, ghostY, 8, 8);
        }
    }

    renderReady(state) {
        this.drawMaze(state.mazeWalls);
        this.drawDots(state.dots, state.powerPelletBlink);
        this.drawPacman(state.pacman);

        for (const ghost of state.ghosts) {
            this.drawGhost(ghost);
        }

        this.drawHUD(state);
        this.drawText('READY!', CONFIG.LOGICAL_WIDTH / 2 - 30, CONFIG.LOGICAL_HEIGHT / 2, CONFIG.COLOR_PACMAN);
    }

    renderPlaying(state) {
        this.drawMaze(state.mazeWalls);
        this.drawDots(state.dots, state.powerPelletBlink);
        this.drawPacman(state.pacman);

        for (const ghost of state.ghosts) {
            if (ghost.mode !== 'eaten' || ghost.respawnTimer > 0) {
                this.drawGhost(ghost);
            }
        }

        this.drawHUD(state);

        for (const popup of state.scorePopups) {
            this.drawScorePopup(popup.score, popup.x, popup.y);
        }
    }

    renderDeath(state) {
        this.drawMaze(state.mazeWalls);
        this.drawDots(state.dots, state.powerPelletBlink);

        if (state.pacman.deathAnimFrame < 12) {
            const frame = state.pacman.deathAnimFrame;
            const radius = CONFIG.PACMAN_RADIUS * (1 - frame / 12);
            this.ctx.fillStyle = CONFIG.COLOR_PACMAN;
            this.ctx.beginPath();
            this.ctx.arc(state.pacman.x, state.pacman.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.drawHUD(state);
    }

    renderGameOver(state) {
        this.drawMaze(state.mazeWalls);
        this.drawText('GAME OVER', CONFIG.LOGICAL_WIDTH / 2 - 45, CONFIG.LOGICAL_HEIGHT / 2, CONFIG.COLOR_TEXT);
        this.drawHUD(state);
    }

    drawMaze(mazeWalls) {
        this.ctx.fillStyle = CONFIG.COLOR_MAZE;
        for (let col = 0; col < CONFIG.MAZE_COLS; col++) {
            for (let row = 0; row < CONFIG.MAZE_ROWS; row++) {
                if (mazeWalls[col] && mazeWalls[col][row]) {
                    this.ctx.fillRect(
                        col * CONFIG.TILE_SIZE,
                        row * CONFIG.TILE_SIZE,
                        CONFIG.TILE_SIZE,
                        CONFIG.TILE_SIZE
                    );
                }
            }
        }
    }

    drawDots(dots, powerPelletBlink) {
        this.ctx.fillStyle = CONFIG.COLOR_DOT;
        for (let col = 0; col < CONFIG.MAZE_COLS; col++) {
            for (let row = 0; row < CONFIG.MAZE_ROWS; row++) {
                const dotType = dots[col] && dots[col][row];
                if (dotType === 2) {
                    this.ctx.fillRect(
                        col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2 - CONFIG.DOT_RADIUS,
                        row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2 - CONFIG.DOT_RADIUS,
                        CONFIG.DOT_RADIUS * 2,
                        CONFIG.DOT_RADIUS * 2
                    );
                } else if (dotType === 3 && (powerPelletBlink < 30 || powerPelletBlink % 10 < 5)) {
                    this.ctx.beginPath();
                    this.ctx.arc(
                        col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
                        row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
                        CONFIG.POWER_PELLET_RADIUS,
                        0, Math.PI * 2
                    );
                    this.ctx.fill();
                }
            }
        }
    }

    drawPacman(pacman) {
        if (!pacman.alive) return;

        this.ctx.save();
        this.ctx.translate(pacman.x, pacman.y);

        if (pacman.currentDir.dx > 0) {
            this.ctx.rotate(0);
        } else if (pacman.currentDir.dx < 0) {
            this.ctx.rotate(Math.PI);
        } else if (pacman.currentDir.dy < 0) {
            this.ctx.rotate(-Math.PI / 2);
        } else if (pacman.currentDir.dy > 0) {
            this.ctx.rotate(Math.PI / 2);
        }

        this.ctx.fillStyle = CONFIG.COLOR_PACMAN;
        this.ctx.beginPath();
        if (pacman.mouthOpen) {
            this.ctx.arc(0, 0, CONFIG.PACMAN_RADIUS, CONFIG.PACMAN_MOUTH_ANGLE, -CONFIG.PACMAN_MOUTH_ANGLE);
            this.ctx.lineTo(0, 0);
        } else {
            this.ctx.arc(0, 0, CONFIG.PACMAN_RADIUS, 0, Math.PI * 2);
        }
        this.ctx.fill();

        this.ctx.restore();
    }

    drawGhost(ghost) {
        const sprite = (ghost.mode === 'frightened') ? SPRITES.GHOST_FRIGHTENED : SPRITES.GHOST;
        this.drawSprite(sprite, ghost.x - 4, ghost.y - 4, ghost.getColor());
    }

    drawHUD(state) {
        this.drawText('SCORE', 10, 10, CONFIG.COLOR_TEXT);
        this.drawText(state.score.toString(), 10, 20, CONFIG.COLOR_TEXT);

        if (state.highScore > 0) {
            this.drawText('HIGH', CONFIG.LOGICAL_WIDTH / 2 - 15, 10, CONFIG.COLOR_TEXT);
            this.drawText(state.highScore.toString(), CONFIG.LOGICAL_WIDTH / 2 - 15, 20, CONFIG.COLOR_TEXT);
        }

        for (let i = 0; i < state.lives; i++) {
            this.ctx.fillStyle = CONFIG.COLOR_PACMAN;
            this.ctx.beginPath();
            this.ctx.arc(10 + i * 16, CONFIG.LOGICAL_HEIGHT - 10, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawText(text, x, y, color) {
        this.ctx.fillStyle = color;
        let offsetX = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const glyph = SPRITES.FONT[char];
            if (glyph) {
                this.drawSprite(glyph, x + offsetX, y, color);
                offsetX += 6;
            } else if (char === ' ') {
                offsetX += 6;
            }
        }
    }

    drawSprite(sprite, x, y, color) {
        this.ctx.fillStyle = color;
        for (let row = 0; row < sprite.length; row++) {
            for (let col = 0; col < sprite[row].length; col++) {
                if (sprite[row][col]) {
                    this.ctx.fillRect(x + col, y + row, 1, 1);
                }
            }
        }
    }

    drawScorePopup(score, x, y) {
        this.drawText(score.toString(), x - 10, y - 5, CONFIG.COLOR_PACMAN);
    }
}

// ============================================================================
// SECTION 9: GAME STATE MACHINE
// ============================================================================

const MAZE_TEMPLATE = `
############################
#............##............#
#.####.#####.##.#####.####.#
#O####.#####.##.#####.####O#
#.####.#####.##.#####.####.#
#..........................#
#.####.##.########.##.####.#
#.####.##.########.##.####.#
#......##....##....##......#
######.##### ## #####.######
######.##### ## #####.######
######.##          ##.######
######.## ######## ##.######
######.## #      # ##.######
      .   #      #   .
######.## #      # ##.######
######.## ######## ##.######
######.##          ##.######
######.## ######## ##.######
######.## ######## ##.######
#............##............#
#.####.#####.##.#####.####.#
#.####.#####.##.#####.####.#
#O..##................##..O#
###.##.##.########.##.##.###
###.##.##.########.##.##.###
#......##....##....##......#
#.##########.##.##########.#
#.##########.##.##########.#
#..........................#
############################
`;

class Game {
    constructor() {
        this.state = 'attract';

        this.pacman = null;
        this.ghosts = [];

        this.mazeWalls = [];
        this.dots = [];
        this.dotsRemaining = 0;

        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('pacmanHighScore')) || 0;
        this.lives = CONFIG.STARTING_LIVES;
        this.nextLifeScore = CONFIG.EXTRA_LIFE_SCORE;

        this.readyTimer = 0;
        this.deathTimer = 0;
        this.gameOverTimer = 0;

        this.powerPelletActive = false;
        this.powerPelletTimer = 0;
        this.ghostComboCounter = 0;

        this.powerPelletBlink = 0;

        this.scorePopups = [];

        this.sound = null;

        this.initMaze();
    }

    initMaze() {
        const lines = MAZE_TEMPLATE.trim().split('\n');

        this.mazeWalls = [];
        this.dots = [];
        for (let col = 0; col < CONFIG.MAZE_COLS; col++) {
            this.mazeWalls[col] = [];
            this.dots[col] = [];
            for (let row = 0; row < CONFIG.MAZE_ROWS; row++) {
                this.mazeWalls[col][row] = false;
                this.dots[col][row] = 0;
            }
        }

        let dotCount = 0;
        for (let row = 0; row < lines.length && row < CONFIG.MAZE_ROWS; row++) {
            const line = lines[row];
            for (let col = 0; col < line.length && col < CONFIG.MAZE_COLS; col++) {
                const char = line[col];
                if (char === '#') {
                    this.mazeWalls[col][row] = true;
                } else if (char === '.') {
                    this.dots[col][row] = 2;
                    dotCount++;
                } else if (char === 'O') {
                    this.dots[col][row] = 3;
                    dotCount++;
                }
            }
        }

        this.dotsRemaining = dotCount;
    }

    startGame() {
        this.state = 'ready';
        this.readyTimer = CONFIG.READY_DURATION;
        this.score = 0;
        this.lives = CONFIG.STARTING_LIVES;
        this.initMaze();
        this.spawnEntities();
    }

    spawnEntities() {
        this.pacman = new PacMan(CONFIG.PACMAN_START_COL, CONFIG.PACMAN_START_ROW);

        // Spawn ghosts in open corridors around the center
        this.ghosts = [
            new Ghost('blinky', 13, 11),  // Upper center
            new Ghost('pinky', 1, 1),     // Top left corner
            new Ghost('inky', 26, 1),     // Top right corner
            new Ghost('clyde', 13, 23)    // Lower center
        ];
    }

    update(input, sound, dt) {
        this.sound = sound;

        switch (this.state) {
            case 'attract':
                this.updateAttract(input);
                break;
            case 'ready':
                this.updateReady(input);
                break;
            case 'playing':
                this.updatePlaying(input);
                break;
            case 'pacmanDeath':
                this.updateDeath();
                break;
            case 'gameOver':
                this.updateGameOver(input);
                break;
        }

        this.powerPelletBlink++;
    }

    updateAttract(input) {
        if (input.isStart()) {
            this.sound.init();
            this.startGame();
        }
    }

    updateReady(input) {
        this.readyTimer -= CONFIG.FRAME_TIME;
        if (this.readyTimer <= 0) {
            this.state = 'playing';
            this.sound.startWakka();
        }
    }

    updatePlaying(input) {
        this.pacman.update(input, this.mazeWalls);

        const dotData = CollisionSystem.checkPacmanDot(this.pacman, this.dots);
        if (dotData) {
            this.dots[dotData.col][dotData.row] = 0;
            this.dotsRemaining--;

            if (dotData.type === 3) {
                this.addScore(CONFIG.SCORE_POWER_PELLET);
                this.activatePowerPellet();
            } else {
                this.addScore(CONFIG.SCORE_DOT);
            }
        }

        if (this.powerPelletActive) {
            this.powerPelletTimer--;
            if (this.powerPelletTimer <= 0) {
                this.powerPelletActive = false;
                this.sound.stopWakka();
                this.sound.startWakka();
            }
        }

        for (const ghost of this.ghosts) {
            ghost.update(this.pacman, this.mazeWalls, this.powerPelletActive);
        }

        const hitGhost = CollisionSystem.checkPacmanGhosts(this.pacman, this.ghosts);
        if (hitGhost) {
            if (hitGhost.mode === 'frightened') {
                const scores = [CONFIG.SCORE_GHOST_1, CONFIG.SCORE_GHOST_2, CONFIG.SCORE_GHOST_3, CONFIG.SCORE_GHOST_4];
                const score = scores[this.ghostComboCounter];
                this.addScore(score);
                this.ghostComboCounter++;
                hitGhost.setEaten();
                this.sound.playGhostEaten();

                this.scorePopups.push({ score, x: hitGhost.x, y: hitGhost.y, timer: 60 });
            } else if (hitGhost.mode !== 'eaten') {
                this.killPacman();
            }
        }

        this.scorePopups = this.scorePopups.filter(p => {
            p.timer--;
            return p.timer > 0;
        });

        if (this.dotsRemaining === 0) {
            this.state = 'gameOver';
            this.gameOverTimer = CONFIG.GAME_OVER_DURATION;
        }
    }

    updateDeath() {
        this.deathTimer -= CONFIG.FRAME_TIME;

        if (this.pacman.deathAnimFrame < 12) {
            if (this.deathTimer % 100 === 0) {
                this.pacman.deathAnimFrame++;
            }
        }

        if (this.deathTimer <= 0) {
            this.lives--;
            if (this.lives > 0) {
                this.spawnEntities();
                this.state = 'ready';
                this.readyTimer = CONFIG.READY_DURATION;
            } else {
                this.state = 'gameOver';
                this.gameOverTimer = CONFIG.GAME_OVER_DURATION;
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('pacmanHighScore', this.highScore.toString());
                }
            }
        }
    }

    updateGameOver(input) {
        this.gameOverTimer -= CONFIG.FRAME_TIME;
        if (this.gameOverTimer <= 0 && input.isStart()) {
            this.state = 'attract';
        }
    }

    activatePowerPellet() {
        this.powerPelletActive = true;
        this.powerPelletTimer = CONFIG.GHOST_FRIGHTENED_DURATION;
        this.ghostComboCounter = 0;

        for (const ghost of this.ghosts) {
            ghost.setFrightened();
        }

        this.sound.stopWakka();
        this.sound.playPowerPelletSiren();
    }

    killPacman() {
        this.pacman.die();
        this.state = 'pacmanDeath';
        this.deathTimer = CONFIG.DEATH_DURATION;
        this.sound.stopWakka();
        this.sound.playDeath();
    }

    addScore(points) {
        this.score += points;
        if (this.score >= this.nextLifeScore) {
            this.lives++;
            this.nextLifeScore += CONFIG.EXTRA_LIFE_SCORE;
        }
    }

    getState() {
        return {
            state: this.state,
            pacman: this.pacman,
            ghosts: this.ghosts,
            mazeWalls: this.mazeWalls,
            dots: this.dots,
            score: this.score,
            highScore: this.highScore,
            lives: this.lives,
            powerPelletActive: this.powerPelletActive,
            powerPelletBlink: this.powerPelletBlink,
            scorePopups: this.scorePopups
        };
    }
}

// ============================================================================
// SECTION 10: MAIN LOOP & BOOTSTRAP
// ============================================================================

let lastTime = performance.now();
let accumulator = 0;

const input = new InputHandler();
const sound = new SoundEngine();
const game = new Game();
const canvas = document.getElementById('gameCanvas');
const renderer = new Renderer(canvas);

function gameLoop(timestamp) {
    let delta = timestamp - lastTime;
    lastTime = timestamp;

    if (delta > CONFIG.MAX_DELTA) delta = CONFIG.MAX_DELTA;
    accumulator += delta;

    while (accumulator >= CONFIG.FRAME_TIME) {
        game.update(input, sound, CONFIG.FRAME_TIME);
        input.update();
        accumulator -= CONFIG.FRAME_TIME;
    }

    renderer.render(game.getState());
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
