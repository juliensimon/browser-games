'use strict';

// ============================================================================
// SECTION 1: CONFIG — All tunable game constants
// ============================================================================

const CONFIG = Object.freeze({
    // Display
    LOGICAL_WIDTH: 224,
    LOGICAL_HEIGHT: 256,
    SCALE: 3,
    WIDTH: 672,   // 224 * 3
    HEIGHT: 768,  // 256 * 3

    // Player
    PLAYER_SPEED: 1,
    PLAYER_Y: 216,
    PLAYER_WIDTH: 13,
    PLAYER_DEATH_DURATION: 2000,

    // Bullet
    BULLET_SPEED: 4,
    BULLET_WIDTH: 1,
    BULLET_HEIGHT: 4,

    // Aliens
    ALIEN_ROWS: 5,
    ALIEN_COLS: 11,
    ALIEN_SPACING_X: 16,
    ALIEN_SPACING_Y: 16,
    ALIEN_START_X: 26,
    ALIEN_START_Y: 64,
    ALIEN_STEP_X: 2,
    ALIEN_DROP_Y: 8,
    ALIEN_SCORES: [30, 20, 20, 10, 10],

    // Bombs
    BOMB_SPEED: 1,
    MAX_ALIEN_BOMBS: 3,
    ALIEN_FIRE_BASE_INTERVAL: 1200,
    ALIEN_FIRE_MIN_INTERVAL: 300,
    BOMB_ANIM_SPEED: 4,

    // Mystery
    MYSTERY_Y: 26,
    MYSTERY_SPEED: 1,
    MYSTERY_SPAWN_INTERVAL: 25000,
    MYSTERY_MIN_ALIENS: 8,
    MYSTERY_SCORE_TABLE: [100,50,50,100,150,100,100,50,300,100,100,100,50,150,100,50],

    // Shields
    SHIELD_COUNT: 4,
    SHIELD_Y: 192,
    SHIELD_WIDTH: 22,
    SHIELD_HEIGHT: 16,

    // Game rules
    STARTING_LIVES: 3,
    EXTRA_LIFE_SCORE: 1500,
    WAVE_START_DELAY: 2000,
    GAME_OVER_DURATION: 3000,
    RESPAWN_DELAY: 2000,

    // Colors — phosphor base + cellophane overlay zones
    COLOR_PHOSPHOR: '#ffffff',    // Base CRT phosphor (everything drawn in this)
    COLOR_WHITE: '#ffffff',       // Alias for phosphor
    COLOR_GREEN: '#ffffff',       // Will be tinted by overlay
    COLOR_RED: '#ffffff',         // Will be tinted by overlay
    OVERLAY_RED: '#ff3333',       // Top zone cellophane (mystery ship, scores)
    OVERLAY_GREEN: '#33ff33',     // Bottom zone cellophane (shields, player, ground)
    OVERLAY_RED_Y: 33,           // Red zone: y < this value
    OVERLAY_GREEN_Y: 184,        // Green zone: y >= this value

    // Timing
    FPS: 60,
    FRAME_TIME: 1000 / 60,
    MAX_DELTA: 200,

    // Wave
    WAVE_Y_OFFSET: 8,
    MAX_WAVE_OFFSET: 48,
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
};

// ============================================================================
// SECTION 3: Sprite Data — Pixel-accurate 1978 arcade ROM sprites
// ============================================================================

const SPRITES = {
    // Squid (top row alien) — 8x8, frame 0: legs together
    SQUID: [
        [0,0,0,1,1,0,0,0],
        [0,0,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,0],
        [1,1,0,1,1,0,1,1],
        [1,1,1,1,1,1,1,1],
        [0,0,1,0,0,1,0,0],
        [0,1,0,1,1,0,1,0],
        [1,0,1,0,0,1,0,1],
    ],

    // Squid frame 1: legs spread
    SQUID_ALT: [
        [0,0,0,1,1,0,0,0],
        [0,0,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,0],
        [1,1,0,1,1,0,1,1],
        [1,1,1,1,1,1,1,1],
        [0,1,0,0,0,0,1,0],
        [1,0,0,1,1,0,0,1],
        [0,1,0,0,0,0,1,0],
    ],

    // Crab (middle rows alien) — 8x11, frame 0: arms down
    CRAB: [
        [0,0,1,0,0,0,0,0,1,0,0],
        [0,0,0,1,0,0,0,1,0,0,0],
        [0,0,1,1,1,1,1,1,1,0,0],
        [0,1,1,0,1,1,1,0,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1],
        [1,0,1,1,1,1,1,1,1,0,1],
        [1,0,1,0,0,0,0,0,1,0,1],
        [0,0,0,1,1,0,1,1,0,0,0],
    ],

    // Crab frame 1: arms up
    CRAB_ALT: [
        [0,0,1,0,0,0,0,0,1,0,0],
        [1,0,0,1,0,0,0,1,0,0,1],
        [1,0,1,1,1,1,1,1,1,0,1],
        [1,1,1,0,1,1,1,0,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,1,1,1,0],
        [0,0,1,0,0,0,0,0,1,0,0],
        [0,1,0,0,0,0,0,0,0,1,0],
    ],

    // Octopus (bottom rows alien) — 8x12, frame 0: legs together
    OCTOPUS: [
        [0,0,0,0,1,1,1,1,0,0,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,0,0,1,1,0,0,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [0,0,0,1,1,0,0,1,1,0,0,0],
        [0,0,1,1,0,1,1,0,1,1,0,0],
        [1,1,0,0,0,0,0,0,0,0,1,1],
    ],

    // Octopus frame 1: legs spread
    OCTOPUS_ALT: [
        [0,0,0,0,1,1,1,1,0,0,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,0,0,1,1,0,0,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1],
        [0,0,1,1,1,0,0,1,1,1,0,0],
        [0,1,1,0,0,1,1,0,0,1,1,0],
        [0,0,1,1,0,0,0,0,1,1,0,0],
    ],

    // Player cannon — 8x13
    PLAYER: [
        [0,0,0,0,0,0,1,0,0,0,0,0,0],
        [0,0,0,0,0,1,1,1,0,0,0,0,0],
        [0,0,0,0,0,1,1,1,0,0,0,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],

    // Player explosion frame 1 — 8x16
    PLAYER_EXPLODE_1: [
        [0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0],
        [0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0],
        [0,1,0,0,0,0,0,0,0,1,0,0,1,0,0,0],
        [0,0,0,0,1,1,1,0,1,1,0,1,0,0,1,0],
        [0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    ],

    // Player explosion frame 2 — 8x16
    PLAYER_EXPLODE_2: [
        [0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0],
        [0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0],
        [0,0,0,1,0,0,0,0,1,0,0,1,0,0,0,0],
        [1,0,0,0,0,1,1,0,0,1,0,0,0,0,0,1],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],

    // Alien explosion — 8x13
    ALIEN_EXPLODE: [
        [0,0,0,0,0,1,0,1,0,0,0,0,0],
        [0,1,0,0,1,0,0,0,1,0,0,1,0],
        [0,0,1,0,0,0,0,0,0,0,1,0,0],
        [0,0,0,1,0,0,0,0,0,1,0,0,0],
        [1,1,0,0,0,0,0,0,0,0,0,1,1],
        [0,0,0,1,0,0,0,0,0,1,0,0,0],
        [0,0,1,0,0,1,0,1,0,0,1,0,0],
        [0,1,0,0,1,0,0,0,1,0,0,1,0],
    ],

    // Mystery ship (UFO) — 7x16
    MYSTERY: [
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [0,0,1,1,1,0,0,1,1,0,0,1,1,1,0,0],
        [0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0],
    ],

    // Shield (bunker) — 16x22, dome with bottom-center notch
    SHIELD: [
        [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
        [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
        [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
    ],

    // Bomb: Rolling type — 4 frames, each 7x3
    BOMB_ROLLING: [
        [
            [0,1,0],
            [1,0,0],
            [0,1,0],
            [0,0,1],
            [0,1,0],
            [1,0,0],
            [0,1,0],
        ],
        [
            [0,1,0],
            [0,0,1],
            [0,1,0],
            [1,0,0],
            [0,1,0],
            [0,0,1],
            [0,1,0],
        ],
        [
            [0,1,0],
            [1,0,0],
            [0,1,0],
            [0,0,1],
            [0,1,0],
            [1,0,0],
            [0,1,0],
        ],
        [
            [0,1,0],
            [0,0,1],
            [0,1,0],
            [1,0,0],
            [0,1,0],
            [0,0,1],
            [0,1,0],
        ],
    ],

    // Bomb: Plunger type — 4 frames, each 7x3
    BOMB_PLUNGER: [
        [
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [0,1,0],
        ],
        [
            [1,0,0],
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [1,0,0],
        ],
        [
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [0,1,0],
        ],
        [
            [0,0,1],
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [0,1,0],
            [0,0,1],
        ],
    ],

    // Bomb: Squiggly type — 4 frames, each 7x3
    BOMB_SQUIGGLY: [
        [
            [0,1,0],
            [1,0,0],
            [0,1,0],
            [0,0,1],
            [0,1,0],
            [1,0,0],
            [0,1,0],
        ],
        [
            [0,0,1],
            [0,1,0],
            [1,0,0],
            [0,1,0],
            [0,0,1],
            [0,1,0],
            [1,0,0],
        ],
        [
            [0,1,0],
            [0,0,1],
            [0,1,0],
            [1,0,0],
            [0,1,0],
            [0,0,1],
            [0,1,0],
        ],
        [
            [1,0,0],
            [0,1,0],
            [0,0,1],
            [0,1,0],
            [1,0,0],
            [0,1,0],
            [0,0,1],
        ],
    ],

    // Bomb explosion — 8x6
    BOMB_EXPLODE: [
        [0,0,0,1,0,0],
        [1,0,0,0,0,1],
        [0,1,0,0,1,0],
        [0,0,1,1,0,0],
        [0,0,1,1,0,0],
        [0,1,0,0,1,0],
        [1,0,0,0,0,1],
        [0,0,0,1,0,0],
    ],

    // Upside-down Y for the attract screen "PLAY" gag
    Y_FLIPPED: [
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,1,0,1,0],
        [1,0,0,0,1],
    ],

    // Bitmap font — each glyph is 7 rows x 5 cols (unless noted)
    FONT: {
        'A': [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
        ],
        'B': [
            [1,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,0],
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
        'F': [
            [1,1,1,1,1],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,1,1,1,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
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
        'J': [
            [0,0,1,1,1],
            [0,0,0,1,0],
            [0,0,0,1,0],
            [0,0,0,1,0],
            [0,0,0,1,0],
            [1,0,0,1,0],
            [0,1,1,0,0],
        ],
        'K': [
            [1,0,0,0,1],
            [1,0,0,1,0],
            [1,0,1,0,0],
            [1,1,0,0,0],
            [1,0,1,0,0],
            [1,0,0,1,0],
            [1,0,0,0,1],
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
        'Q': [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,1,0,1],
            [1,0,0,1,0],
            [0,1,1,0,1],
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
        'U': [
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,0],
        ],
        'V': [
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,0,1,0],
            [0,1,0,1,0],
            [0,0,1,0,0],
        ],
        'W': [
            [1,0,0,0,1],
            [1,0,0,0,1],
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
            [0,0,1,0,0],
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
            [0,0,1,0,0],
            [0,0,1,0,0],
        ],
        'Z': [
            [1,1,1,1,1],
            [0,0,0,0,1],
            [0,0,0,1,0],
            [0,0,1,0,0],
            [0,1,0,0,0],
            [1,0,0,0,0],
            [1,1,1,1,1],
        ],
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
            [0,1,1,1,0],
            [1,0,0,0,0],
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
            [0,0,1,0,0],
            [0,0,1,0,0],
            [0,0,1,0,0],
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
            [0,0,0,0,1],
            [0,1,1,1,0],
        ],
        ' ': [
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
        ],
        '<': [
            [0,0,0,1,0],
            [0,0,1,0,0],
            [0,1,0,0,0],
            [1,0,0,0,0],
            [0,1,0,0,0],
            [0,0,1,0,0],
            [0,0,0,1,0],
        ],
        '>': [
            [0,1,0,0,0],
            [0,0,1,0,0],
            [0,0,0,1,0],
            [0,0,0,0,1],
            [0,0,0,1,0],
            [0,0,1,0,0],
            [0,1,0,0,0],
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
        '=': [
            [0,0,0,0,0],
            [0,0,0,0,0],
            [1,1,1,1,1],
            [0,0,0,0,0],
            [1,1,1,1,1],
            [0,0,0,0,0],
            [0,0,0,0,0],
        ],
        '?': [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [0,0,0,0,1],
            [0,0,0,1,0],
            [0,0,1,0,0],
            [0,0,0,0,0],
            [0,0,1,0,0],
        ],
        '*': [
            [0,0,0,0,0],
            [0,0,1,0,0],
            [1,0,1,0,1],
            [0,1,1,1,0],
            [1,0,1,0,1],
            [0,0,1,0,0],
            [0,0,0,0,0],
        ],
        '.': [
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
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
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
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
    isLeft() { return this.isDown('ArrowLeft') || this.isDown('a') || this.isDown('A'); }
    isRight() { return this.isDown('ArrowRight') || this.isDown('d') || this.isDown('D'); }
    isFire() { return this.justPressed(' '); }
    isStart() { return this.justPressed('Enter'); }
    anyKey() { return this.keysJustPressed.size > 0; }

    update() {
        this.keysJustPressed.clear();
    }
}
// ============================================================================
// SECTION 4: Sound Engine
// ============================================================================

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.masterGain = null;
        this.noiseBuffer = null;
        this.mysteryNodes = null;
    }

    init() {
        if (this.initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);

        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * 2;
        this.noiseBuffer = this.ctx.createBuffer(1, length, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        this.initialized = true;
    }

    marchNote(noteIndex) {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const frequencies = [65.41, 61.74, 58.27, 55.00];
        const freq = frequencies[noteIndex % 4];
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const gn = this.ctx.createGain();
        gn.gain.setValueAtTime(0.4, t);
        gn.gain.linearRampToValueAtTime(0, t + 0.08);
        osc.connect(gn);
        gn.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.08);
    }

    playerFire() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1500, t);
        osc.frequency.linearRampToValueAtTime(200, t + 0.06);
        const gn = this.ctx.createGain();
        gn.gain.setValueAtTime(0.3, t);
        gn.gain.linearRampToValueAtTime(0, t + 0.06);
        osc.connect(gn);
        gn.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.06);
    }

    alienExplode() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;
        const gn = this.ctx.createGain();
        gn.gain.setValueAtTime(0.3, t);
        gn.gain.linearRampToValueAtTime(0, t + 0.1);
        src.connect(filter);
        filter.connect(gn);
        gn.connect(this.masterGain);
        src.start(t);
        src.stop(t + 0.1);
    }

    invaderKilled() {
        this.alienExplode();
    }

    playerExplode() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 100;
        filter.Q.value = 1;
        const gn = this.ctx.createGain();
        gn.gain.setValueAtTime(0.5, t);
        gn.gain.linearRampToValueAtTime(0, t + 0.5);
        src.connect(filter);
        filter.connect(gn);
        gn.connect(this.masterGain);
        src.start(t);
        src.stop(t + 0.5);

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.linearRampToValueAtTime(40, t + 0.5);
        const oscGn = this.ctx.createGain();
        oscGn.gain.setValueAtTime(0.4, t);
        oscGn.gain.linearRampToValueAtTime(0, t + 0.5);
        osc.connect(oscGn);
        oscGn.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.5);
    }

    mysteryStart() {
        if (!this.initialized) return;
        if (this.mysteryNodes) this.mysteryStop();
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 400;
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 6;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 200;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        const gn = this.ctx.createGain();
        gn.gain.value = 0.15;
        osc.connect(gn);
        gn.connect(this.masterGain);
        osc.start();
        lfo.start();
        this.mysteryNodes = { osc, lfo, lfoGain, gain: gn };
    }

    mysteryStop() {
        if (!this.initialized || !this.mysteryNodes) return;
        const m = this.mysteryNodes;
        m.osc.stop();
        m.lfo.stop();
        m.osc.disconnect();
        m.lfo.disconnect();
        m.lfoGain.disconnect();
        m.gain.disconnect();
        this.mysteryNodes = null;
    }

    extraLife() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const notes = [500, 600, 700, 800];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const gn = this.ctx.createGain();
            const start = t + i * 0.08;
            gn.gain.setValueAtTime(0, start);
            gn.gain.linearRampToValueAtTime(0.2, start + 0.01);
            gn.gain.linearRampToValueAtTime(0, start + 0.08);
            osc.connect(gn);
            gn.connect(this.masterGain);
            osc.start(start);
            osc.stop(start + 0.08);
        });
    }
}

// ============================================================================
// SECTION 6: Entity Classes
// ============================================================================

class Player {
    constructor() {
        this.x = Math.floor(CONFIG.LOGICAL_WIDTH / 2) - Math.floor(CONFIG.PLAYER_WIDTH / 2);
        this.alive = true;
        this.exploding = false;
        this.explodeFrame = 0;
        this.explodeTimer = 0;
    }

    moveLeft() {
        this.x -= CONFIG.PLAYER_SPEED;
        if (this.x < 0) this.x = 0;
    }

    moveRight() {
        this.x += CONFIG.PLAYER_SPEED;
        if (this.x > CONFIG.LOGICAL_WIDTH - CONFIG.PLAYER_WIDTH) {
            this.x = CONFIG.LOGICAL_WIDTH - CONFIG.PLAYER_WIDTH;
        }
    }

    startExplode() {
        this.alive = false;
        this.exploding = true;
        this.explodeFrame = 0;
        this.explodeTimer = CONFIG.PLAYER_DEATH_DURATION;
    }

    update(dt) {
        if (this.exploding) {
            this.explodeTimer -= dt;
            this.explodeFrame = Math.floor((CONFIG.PLAYER_DEATH_DURATION - this.explodeTimer) / 200) % 2;
            if (this.explodeTimer <= 0) {
                this.exploding = false;
            }
        }
    }

    getRect() {
        return { x: this.x, y: CONFIG.PLAYER_Y, w: CONFIG.PLAYER_WIDTH, h: 8 };
    }
}

class Alien {
    constructor(type, row, col) {
        this.type = type;
        this.row = row;
        this.col = col;
        this.alive = true;
        this.exploding = false;
        this.explodeTimer = 0;
    }
}

class AlienFormation {
    constructor(waveOffset) {
        this.x = CONFIG.ALIEN_START_X;
        this.y = CONFIG.ALIEN_START_Y + (waveOffset || 0);
        this.direction = 1;
        this.animFrame = 0;
        this.stepTimer = 0;
        this.marchNoteIndex = 0;

        this.aliens = [];
        for (let row = 0; row < CONFIG.ALIEN_ROWS; row++) {
            this.aliens[row] = [];
            const type = row === 0 ? 0 : (row <= 2 ? 1 : 2);
            for (let col = 0; col < CONFIG.ALIEN_COLS; col++) {
                this.aliens[row][col] = new Alien(type, row, col);
            }
        }

        this.stepTimer = this.getStepInterval();
    }

    countAlive() {
        let count = 0;
        for (let r = 0; r < CONFIG.ALIEN_ROWS; r++)
            for (let c = 0; c < CONFIG.ALIEN_COLS; c++)
                if (this.aliens[r][c].alive) count++;
        return count;
    }

    getStepInterval() {
        const alive = this.countAlive();
        if (alive <= 1) return 16;
        if (alive <= 2) return 33;
        if (alive <= 5) return 66;
        if (alive <= 10) return 100;
        if (alive <= 20) return 150;
        if (alive <= 30) return 250;
        if (alive <= 40) return 350;
        return 500;
    }

    getBounds() {
        let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
        for (let r = 0; r < CONFIG.ALIEN_ROWS; r++) {
            for (let c = 0; c < CONFIG.ALIEN_COLS; c++) {
                if (this.aliens[r][c].alive) {
                    const pos = this.getAlienPos(r, c);
                    const w = this.getAlienWidth(r);
                    if (pos.x < left) left = pos.x;
                    if (pos.x + w > right) right = pos.x + w;
                    if (pos.y < top) top = pos.y;
                    if (pos.y + 8 > bottom) bottom = pos.y + 8;
                }
            }
        }
        return { left, right, top, bottom };
    }

    getAlienPos(row, col) {
        return {
            x: this.x + col * CONFIG.ALIEN_SPACING_X,
            y: this.y + row * CONFIG.ALIEN_SPACING_Y
        };
    }

    getAlienWidth(row) {
        const type = row === 0 ? 0 : (row <= 2 ? 1 : 2);
        return type === 0 ? 8 : (type === 1 ? 11 : 12);
    }

    getAlienRect(row, col) {
        const pos = this.getAlienPos(row, col);
        const w = this.getAlienWidth(row);
        return { x: pos.x, y: pos.y, w: w, h: 8 };
    }

    step() {
        this.animFrame = 1 - this.animFrame;
        const bounds = this.getBounds();

        if (this.direction > 0 && bounds.right + CONFIG.ALIEN_STEP_X >= CONFIG.LOGICAL_WIDTH) {
            this.y += CONFIG.ALIEN_DROP_Y;
            this.direction = -1;
        } else if (this.direction < 0 && bounds.left - CONFIG.ALIEN_STEP_X <= 0) {
            this.y += CONFIG.ALIEN_DROP_Y;
            this.direction = 1;
        } else {
            this.x += CONFIG.ALIEN_STEP_X * this.direction;
        }

        this.marchNoteIndex = (this.marchNoteIndex + 1) % 4;
    }

    update(dt) {
        for (let r = 0; r < CONFIG.ALIEN_ROWS; r++) {
            for (let c = 0; c < CONFIG.ALIEN_COLS; c++) {
                const alien = this.aliens[r][c];
                if (alien.exploding) {
                    alien.explodeTimer -= dt;
                    if (alien.explodeTimer <= 0) {
                        alien.exploding = false;
                    }
                }
            }
        }

        this.stepTimer -= dt;
        if (this.stepTimer <= 0) {
            this.step();
            this.stepTimer = this.getStepInterval();
            return this.marchNoteIndex;
        }
        return -1;
    }

    getShooterCandidates() {
        const candidates = [];
        for (let col = 0; col < CONFIG.ALIEN_COLS; col++) {
            for (let row = CONFIG.ALIEN_ROWS - 1; row >= 0; row--) {
                if (this.aliens[row][col].alive && !this.aliens[row][col].exploding) {
                    candidates.push(this.aliens[row][col]);
                    break;
                }
            }
        }
        return candidates;
    }

    aliensReachedBottom() {
        const bounds = this.getBounds();
        return bounds.bottom >= CONFIG.PLAYER_Y;
    }
}

class PlayerBullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.alive = true;
        this.width = CONFIG.BULLET_WIDTH;
        this.height = CONFIG.BULLET_HEIGHT;
    }

    update() {
        this.y -= CONFIG.BULLET_SPEED;
        if (this.y < 0) this.alive = false;
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.width, h: this.height };
    }
}

class AlienBomb {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.animFrame = 0;
        this.animTimer = 0;
        this.alive = true;
    }

    update(dt) {
        this.y += CONFIG.BOMB_SPEED;
        this.animTimer++;
        if (this.animTimer >= CONFIG.BOMB_ANIM_SPEED) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
        if (this.y >= CONFIG.LOGICAL_HEIGHT - 16) {
            this.alive = false;
        }
    }

    getRect() {
        return { x: this.x, y: this.y, w: 3, h: 7 };
    }
}

class MysteryShip {
    constructor(direction) {
        this.direction = direction;
        this.x = direction > 0 ? -16 : CONFIG.LOGICAL_WIDTH;
        this.y = CONFIG.MYSTERY_Y;
        this.alive = true;
        this.width = 16;
    }

    update() {
        this.x += this.direction * CONFIG.MYSTERY_SPEED;
        if ((this.direction > 0 && this.x > CONFIG.LOGICAL_WIDTH + 16) ||
            (this.direction < 0 && this.x < -16)) {
            this.alive = false;
        }
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.width, h: 7 };
    }
}

class Shield {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.SHIELD_WIDTH;
        this.height = CONFIG.SHIELD_HEIGHT;
        this.pixels = SPRITES.SHIELD.map(row => [...row]);
    }

    hasPixelAt(localX, localY) {
        if (localX < 0 || localX >= this.width || localY < 0 || localY >= this.height) return false;
        return this.pixels[localY][localX] === 1;
    }

    erodeFrom(localX, localY, fromBelow) {
        const pattern = fromBelow ? [
            [0,1,1,1,1,0],
            [1,1,1,1,1,1],
            [1,1,1,1,1,1],
        ] : [
            [1,1,1,1,1,1],
            [1,1,1,1,1,1],
            [0,1,1,1,1,0],
        ];

        const startX = localX - Math.floor(pattern[0].length / 2);
        const startY = fromBelow ? localY - pattern.length + 1 : localY;

        for (let py = 0; py < pattern.length; py++) {
            for (let px = 0; px < pattern[py].length; px++) {
                if (pattern[py][px]) {
                    const sx = startX + px;
                    const sy = startY + py;
                    if (sx >= 0 && sx < this.width && sy >= 0 && sy < this.height) {
                        this.pixels[sy][sx] = 0;
                    }
                }
            }
        }
    }

    erodeRect(localX, localY, w, h) {
        for (let py = localY; py < localY + h; py++) {
            for (let px = localX; px < localX + w; px++) {
                if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
                    this.pixels[py][px] = 0;
                }
            }
        }
    }

    isEmpty() {
        for (let r = 0; r < this.height; r++)
            for (let c = 0; c < this.width; c++)
                if (this.pixels[r][c]) return false;
        return true;
    }
}

class ScorePopup {
    constructor(x, y, score) {
        this.x = x;
        this.y = y;
        this.text = String(score);
        this.timer = 1000;
        this.alive = true;
    }

    update(dt) {
        this.timer -= dt;
        if (this.timer <= 0) this.alive = false;
    }
}
// ============================================================================
// SECTION 7: Collision System
// ============================================================================

const CollisionSystem = {
    checkBulletAlien(bullet, formation) {
        const bRect = bullet.getRect();
        for (let r = 0; r < CONFIG.ALIEN_ROWS; r++) {
            for (let c = 0; c < CONFIG.ALIEN_COLS; c++) {
                const alien = formation.aliens[r][c];
                if (!alien.alive || alien.exploding) continue;
                const aRect = formation.getAlienRect(r, c);
                if (MathUtils.rectsOverlap(
                    bRect.x, bRect.y, bRect.w, bRect.h,
                    aRect.x, aRect.y, aRect.w, aRect.h
                )) {
                    alien.alive = false;
                    alien.exploding = true;
                    alien.explodeTimer = 300;
                    return { hit: true, alien, row: r, col: c };
                }
            }
        }
        return { hit: false, alien: null, row: -1, col: -1 };
    },

    checkBulletMystery(bullet, mystery) {
        if (!mystery || !mystery.alive) return false;
        const bRect = bullet.getRect();
        const mRect = mystery.getRect();
        return MathUtils.rectsOverlap(
            bRect.x, bRect.y, bRect.w, bRect.h,
            mRect.x, mRect.y, mRect.w, mRect.h
        );
    },

    checkBulletShields(bullet, shields) {
        const bRect = bullet.getRect();
        for (const shield of shields) {
            if (shield.isEmpty()) continue;
            // Check if bullet overlaps the shield bounding box
            if (!MathUtils.rectsOverlap(
                bRect.x, bRect.y, bRect.w, bRect.h,
                shield.x, shield.y, shield.width, shield.height
            )) continue;

            // Convert bullet position to shield-local coordinates
            const localX = Math.floor(bRect.x - shield.x);
            const localY = Math.floor(bRect.y - shield.y);

            // Scan the bullet footprint for any set pixel
            for (let py = 0; py < bRect.h; py++) {
                for (let px = 0; px < bRect.w; px++) {
                    const lx = localX + px;
                    const ly = localY + py;
                    if (shield.hasPixelAt(lx, ly)) {
                        // Erode from below (bullet travels upward)
                        shield.erodeFrom(lx, ly, true);
                        return true;
                    }
                }
            }
        }
        return false;
    },

    checkBombPlayer(bomb, player) {
        if (!player.alive) return false;
        const bombRect = bomb.getRect();
        const pRect = player.getRect();
        return MathUtils.rectsOverlap(
            bombRect.x, bombRect.y, bombRect.w, bombRect.h,
            pRect.x, pRect.y, pRect.w, pRect.h
        );
    },

    checkBombShields(bomb, shields) {
        const bombRect = bomb.getRect();
        for (const shield of shields) {
            if (shield.isEmpty()) continue;
            if (!MathUtils.rectsOverlap(
                bombRect.x, bombRect.y, bombRect.w, bombRect.h,
                shield.x, shield.y, shield.width, shield.height
            )) continue;

            const localX = Math.floor(bombRect.x - shield.x);
            const localY = Math.floor(bombRect.y - shield.y);

            for (let py = 0; py < bombRect.h; py++) {
                for (let px = 0; px < bombRect.w; px++) {
                    const lx = localX + px;
                    const ly = localY + py;
                    if (shield.hasPixelAt(lx, ly)) {
                        // Erode from above (bomb travels downward)
                        shield.erodeFrom(lx, ly, false);
                        return true;
                    }
                }
            }
        }
        return false;
    },

    erodeShieldsFromAliens(formation, shields) {
        for (let r = 0; r < CONFIG.ALIEN_ROWS; r++) {
            for (let c = 0; c < CONFIG.ALIEN_COLS; c++) {
                const alien = formation.aliens[r][c];
                if (!alien.alive) continue;
                const aRect = formation.getAlienRect(r, c);
                for (const shield of shields) {
                    if (shield.isEmpty()) continue;
                    if (!MathUtils.rectsOverlap(
                        aRect.x, aRect.y, aRect.w, aRect.h,
                        shield.x, shield.y, shield.width, shield.height
                    )) continue;

                    // Erase overlapping region from the shield
                    const lx = Math.floor(aRect.x - shield.x);
                    const ly = Math.floor(aRect.y - shield.y);
                    shield.erodeRect(lx, ly, aRect.w, aRect.h);
                }
            }
        }
    }
};

// ============================================================================
// SECTION 8: Renderer
// ============================================================================

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = CONFIG.WIDTH;
        this.canvas.height = CONFIG.HEIGHT;
        this.ctx.imageSmoothingEnabled = false;
        this.frameCount = 0;
    }

    render(state) {
        const ctx = this.ctx;
        ctx.save();
        ctx.setTransform(CONFIG.SCALE, 0, 0, CONFIG.SCALE, 0, 0);

        // Clear
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT);

        if (state.state === 'attract') {
            this.drawAttractScreen(ctx, state);
        } else {
            this.drawShields(ctx, state);
            this.drawAliens(ctx, state);
            this.drawPlayer(ctx, state);
            this.drawPlayerBullet(ctx, state);
            this.drawAlienBombs(ctx, state);
            this.drawMystery(ctx, state);
            this.drawScorePopups(ctx, state);
        }

        this.drawHUD(ctx, state);
        this.drawGroundLine(ctx);

        if (state.state === 'gameOver') {
            this.drawGameOver(ctx);
        }

        // Apply cellophane overlay — simulates the colored plastic strips
        // on the original arcade cabinet's CRT monitor
        this.applyCellophaneOverlay(ctx);

        ctx.restore();
        this.frameCount++;
    }

    // ── Cellophane Overlay ──────────────────────────────────
    // The original cabinet had colored plastic strips over the CRT:
    // red at top (score/mystery area), green at bottom (shields/player).
    // We simulate this by drawing everything white, then multiplying
    // with colored rectangles — just like light passing through tinted film.

    applyCellophaneOverlay(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';

        // Red zone — top of screen (scores, mystery ship area)
        ctx.fillStyle = CONFIG.OVERLAY_RED;
        ctx.fillRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.OVERLAY_RED_Y);

        // Green zone — bottom of screen (shields, player, ground, lives)
        ctx.fillStyle = CONFIG.OVERLAY_GREEN;
        ctx.fillRect(0, CONFIG.OVERLAY_GREEN_Y, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT - CONFIG.OVERLAY_GREEN_Y);

        ctx.restore();
    }

    // ── Core Drawing ────────────────────────────────────────

    drawSprite(ctx, sprite, x, y, color) {
        ctx.fillStyle = color;
        for (let r = 0; r < sprite.length; r++) {
            for (let c = 0; c < sprite[r].length; c++) {
                if (sprite[r][c]) {
                    ctx.fillRect(x + c, y + r, 1, 1);
                }
            }
        }
    }

    drawText(ctx, text, x, y, color) {
        const str = text.toUpperCase();
        ctx.fillStyle = color || CONFIG.COLOR_WHITE;
        let cursorX = x;
        for (let i = 0; i < str.length; i++) {
            const ch = str[i];
            if (ch === ' ') {
                cursorX += 8;
                continue;
            }
            const glyph = SPRITES.FONT[ch];
            if (glyph) {
                this.drawSprite(ctx, glyph, cursorX, y, ctx.fillStyle);
                cursorX += glyph[0].length + 3;
            } else {
                cursorX += 8;
            }
        }
    }

    measureText(text) {
        const str = text.toUpperCase();
        let w = 0;
        for (let i = 0; i < str.length; i++) {
            const ch = str[i];
            if (ch === ' ') {
                w += 8;
            } else {
                const glyph = SPRITES.FONT[ch];
                w += glyph ? glyph[0].length + 3 : 8;
            }
        }
        return w > 0 ? w - 3 : 0;  // Remove trailing spacing
    }

    drawCenteredText(ctx, text, y, color) {
        const w = this.measureText(text);
        this.drawText(ctx, text, Math.floor((CONFIG.LOGICAL_WIDTH - w) / 2), y, color);
    }

    // ── Entity Drawing ──────────────────────────────────────

    drawAliens(ctx, state) {
        if (!state.formation) return;
        const f = state.formation;
        for (let r = 0; r < CONFIG.ALIEN_ROWS; r++) {
            for (let c = 0; c < CONFIG.ALIEN_COLS; c++) {
                const alien = f.aliens[r][c];
                if (alien.exploding) {
                    const pos = f.getAlienPos(r, c);
                    this.drawSprite(ctx, SPRITES.ALIEN_EXPLODE, pos.x, pos.y, CONFIG.COLOR_WHITE);
                } else if (alien.alive) {
                    const pos = f.getAlienPos(r, c);
                    let sprite;
                    switch (alien.type) {
                        case 0: sprite = f.animFrame === 0 ? SPRITES.SQUID : SPRITES.SQUID_ALT; break;
                        case 1: sprite = f.animFrame === 0 ? SPRITES.CRAB : SPRITES.CRAB_ALT; break;
                        case 2: sprite = f.animFrame === 0 ? SPRITES.OCTOPUS : SPRITES.OCTOPUS_ALT; break;
                    }
                    this.drawSprite(ctx, sprite, pos.x, pos.y, CONFIG.COLOR_WHITE);
                }
            }
        }
    }

    drawPlayer(ctx, state) {
        if (!state.player) return;
        const p = state.player;
        if (p.exploding) {
            const sprite = p.explodeFrame === 0 ? SPRITES.PLAYER_EXPLODE_1 : SPRITES.PLAYER_EXPLODE_2;
            // Center the wider explosion sprite on the player
            const offsetX = Math.floor((CONFIG.PLAYER_WIDTH - sprite[0].length) / 2);
            this.drawSprite(ctx, sprite, p.x + offsetX, CONFIG.PLAYER_Y, CONFIG.COLOR_GREEN);
        } else if (p.alive) {
            this.drawSprite(ctx, SPRITES.PLAYER, p.x, CONFIG.PLAYER_Y, CONFIG.COLOR_GREEN);
        }
    }

    drawShields(ctx, state) {
        if (!state.shields) return;
        ctx.fillStyle = CONFIG.COLOR_GREEN;
        for (const shield of state.shields) {
            for (let r = 0; r < shield.height; r++) {
                for (let c = 0; c < shield.width; c++) {
                    if (shield.pixels[r][c]) {
                        ctx.fillRect(shield.x + c, shield.y + r, 1, 1);
                    }
                }
            }
        }
    }

    drawPlayerBullet(ctx, state) {
        if (!state.playerBullet || !state.playerBullet.alive) return;
        const b = state.playerBullet;
        ctx.fillStyle = CONFIG.COLOR_WHITE;
        ctx.fillRect(b.x, b.y, b.width, b.height);
    }

    drawAlienBombs(ctx, state) {
        if (!state.alienBombs) return;
        for (const bomb of state.alienBombs) {
            if (!bomb.alive) continue;
            let sprite;
            switch (bomb.type) {
                case 0: sprite = SPRITES.BOMB_ROLLING[bomb.animFrame]; break;
                case 1: sprite = SPRITES.BOMB_PLUNGER[bomb.animFrame]; break;
                case 2: sprite = SPRITES.BOMB_SQUIGGLY[bomb.animFrame]; break;
            }
            if (sprite) {
                this.drawSprite(ctx, sprite, bomb.x, bomb.y, CONFIG.COLOR_WHITE);
            }
        }
    }

    drawMystery(ctx, state) {
        if (!state.mysteryShip || !state.mysteryShip.alive) return;
        const m = state.mysteryShip;
        this.drawSprite(ctx, SPRITES.MYSTERY, m.x, m.y, CONFIG.COLOR_RED);
    }

    drawScorePopups(ctx, state) {
        if (!state.scorePopups) return;
        for (const popup of state.scorePopups) {
            if (!popup.alive) continue;
            this.drawText(ctx, popup.text, popup.x, popup.y, CONFIG.COLOR_WHITE);
        }
    }

    // ── HUD ─────────────────────────────────────────────────

    drawHUD(ctx, state) {
        // Top labels
        this.drawText(ctx, 'SCORE<1>', 8, 0, CONFIG.COLOR_WHITE);
        this.drawText(ctx, 'HI-SCORE', 72, 0, CONFIG.COLOR_WHITE);

        // Score values
        const scoreStr = String(state.score || 0).padStart(4, '0');
        this.drawText(ctx, scoreStr, 16, 10, CONFIG.COLOR_WHITE);

        const hiStr = String(state.highScore || 0).padStart(4, '0');
        this.drawText(ctx, hiStr, 80, 10, CONFIG.COLOR_WHITE);

        // Bottom: lives
        if (state.state !== 'attract') {
            const livesStr = String(state.lives || 0);
            this.drawText(ctx, livesStr, 8, 240, CONFIG.COLOR_WHITE);

            // Mini cannon sprites for each life (minus one for the active player)
            const displayLives = Math.max(0, (state.lives || 0) - 1);
            for (let i = 0; i < displayLives; i++) {
                this.drawSprite(ctx, SPRITES.PLAYER, 20 + i * 16, 240, CONFIG.COLOR_GREEN);
            }
        }

        // Bottom right: credit
        this.drawText(ctx, 'CREDIT 00', 136, 248, CONFIG.COLOR_WHITE);
    }

    drawGroundLine(ctx) {
        ctx.fillStyle = CONFIG.COLOR_GREEN;
        ctx.fillRect(0, 239, CONFIG.LOGICAL_WIDTH, 1);
    }

    // ── Screens ─────────────────────────────────────────────

    drawAttractScreen(ctx, state) {
        const anim = state.attractAnim;

        // ── Title: "PLAY" ──
        // During play_y animation, we handle the Y specially
        if (anim === 'play_y') {
            this.drawAttractPlayTitle(ctx, state);
        } else {
            this.drawCenteredText(ctx, 'PLAY', 48, CONFIG.COLOR_WHITE);
        }

        this.drawCenteredText(ctx, 'SPACE  INVADERS', 64, CONFIG.COLOR_WHITE);

        // Score advance table
        const tableX = 56;
        let tableY = 100;

        this.drawCenteredText(ctx, '*SCORE ADVANCE TABLE*', 88, CONFIG.COLOR_WHITE);

        // Mystery ship row
        this.drawSprite(ctx, SPRITES.MYSTERY, tableX, tableY, CONFIG.COLOR_RED);
        this.drawText(ctx, '=? MYSTERY', tableX + 20, tableY, CONFIG.COLOR_WHITE);
        tableY += 18;

        // Squid row (30 pts)
        this.drawSprite(ctx, SPRITES.SQUID, tableX + 4, tableY, CONFIG.COLOR_WHITE);
        this.drawText(ctx, '=30 POINTS', tableX + 20, tableY, CONFIG.COLOR_WHITE);
        tableY += 18;

        // Crab row (20 pts)
        this.drawSprite(ctx, SPRITES.CRAB, tableX + 2, tableY, CONFIG.COLOR_WHITE);
        this.drawText(ctx, '=20 POINTS', tableX + 20, tableY, CONFIG.COLOR_WHITE);
        tableY += 18;

        // Octopus row (10 pts)
        this.drawSprite(ctx, SPRITES.OCTOPUS, tableX + 2, tableY, CONFIG.COLOR_WHITE);
        this.drawText(ctx, '=10 POINTS', tableX + 20, tableY, CONFIG.COLOR_WHITE);

        // ── Bottom text: "PRESS ENTER" or "INSERT CCOIN" gag ──
        if (anim === 'ccoin') {
            this.drawCCoinAnim(ctx, state);
        } else {
            // Blinking "PRESS ENTER"
            if (Math.floor(this.frameCount / 30) % 2 === 0) {
                this.drawCenteredText(ctx, 'PRESS ENTER', 200, CONFIG.COLOR_WHITE);
            }
        }
    }

    // ── "INSERT CCOIN" gag rendering ──────────────────────

    drawCCoinAnim(ctx, state) {
        const textY = 225;

        // Draw the text — "INSERT  CCOIN" or "INSERT  COIN" if corrected
        if (state.attractCCorrected) {
            this.drawCenteredText(ctx, 'INSERT  COIN', textY, CONFIG.COLOR_WHITE);
        } else {
            this.drawCenteredText(ctx, 'INSERT  CCOIN', textY, CONFIG.COLOR_WHITE);
        }

        // Draw explosion at the C position in phase 3
        if (state.attractAnimPhase === 3) {
            const textW = this.measureText('INSERT  CCOIN');
            const textStartX = Math.floor((CONFIG.LOGICAL_WIDTH - textW) / 2);
            const prefixW = this.measureText('INSERT  ');
            const cX = textStartX + prefixW;
            this.drawSprite(ctx, SPRITES.BOMB_EXPLODE, cX - 1, textY - 1, CONFIG.COLOR_WHITE);
        }

        // Draw the alien (squid)
        if (state.attractAlienX > -16 && state.attractAlienX < CONFIG.LOGICAL_WIDTH + 16) {
            const alienSprite = state.attractAlienFrame === 0 ? SPRITES.SQUID : SPRITES.SQUID_ALT;
            this.drawSprite(ctx, alienSprite, Math.floor(state.attractAlienX), Math.floor(state.attractAlienY), CONFIG.COLOR_WHITE);
        }

        // Draw the bomb
        if (state.attractBombAlive) {
            ctx.fillStyle = CONFIG.COLOR_WHITE;
            ctx.fillRect(Math.floor(state.attractAlienX) + 4, Math.floor(state.attractBombY), 1, 4);
        }
    }

    // ── "PLAY" upside-down Y gag rendering ────────────────

    drawAttractPlayTitle(ctx, state) {
        // Draw "PLA" normally
        const playW = this.measureText('PLAY');
        const playStartX = Math.floor((CONFIG.LOGICAL_WIDTH - playW) / 2);
        this.drawText(ctx, 'PLA', playStartX, 48, CONFIG.COLOR_WHITE);

        // Determine which Y to draw and where
        const phase = state.attractAnimPhase;

        if (phase <= 2 && !state.attractYCorrected) {
            // Draw the upside-down Y at current letter position
            // During phase 2 (dragging), the letter follows the alien
            const lx = Math.floor(state.attractLetterX);
            const ly = Math.floor(state.attractLetterY);
            if (lx > -8 && lx < CONFIG.LOGICAL_WIDTH + 8) {
                this.drawSprite(ctx, SPRITES.Y_FLIPPED, lx, ly, CONFIG.COLOR_WHITE);
            }
        } else if (phase === 3) {
            // Alien returning with correct Y — draw it at current letter position
            const lx = Math.floor(state.attractLetterX);
            if (lx > -8 && lx < CONFIG.LOGICAL_WIDTH + 8) {
                this.drawSprite(ctx, SPRITES.FONT['Y'], lx, 48, CONFIG.COLOR_WHITE);
            }
        } else if (phase >= 4) {
            // Corrected — draw normal Y in final position
            const plaPreW = this.measureText('PLA');
            const finalX = playStartX + plaPreW + 3;
            this.drawSprite(ctx, SPRITES.FONT['Y'], finalX, 48, CONFIG.COLOR_WHITE);
        }

        // Draw the alien (squid)
        if (state.attractAlienX > -16 && state.attractAlienX < CONFIG.LOGICAL_WIDTH + 16) {
            const alienSprite = state.attractAlienFrame === 0 ? SPRITES.SQUID : SPRITES.SQUID_ALT;
            this.drawSprite(ctx, alienSprite, Math.floor(state.attractAlienX), Math.floor(state.attractAlienY), CONFIG.COLOR_WHITE);
        }
    }

    drawGameOver(ctx) {
        this.drawCenteredText(ctx, 'GAME OVER', 120, CONFIG.COLOR_RED);
    }
}

// ============================================================================
// SECTION 9: Game State Machine
// ============================================================================

class Game {
    constructor(canvas) {
        this.renderer = new Renderer(canvas);
        this.input = new InputHandler();
        this.sound = new SoundEngine();

        this.state = 'attract';
        this.player = null;
        this.formation = null;
        this.shields = [];
        this.playerBullet = null;
        this.alienBombs = [];
        this.mysteryShip = null;
        this.scorePopups = [];

        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('spaceinvaders_highscore')) || 0;
        this.lives = 0;
        this.wave = 0;
        this.shotCount = 0;

        this.mysteryTimer = 0;
        this.deathTimer = 0;
        this.waveTimer = 0;
        this.gameOverTimer = 0;
        this.alienFireTimer = 0;
        this.extraLifeAwarded = false;

        // Attract screen animation state
        this.attractPassCount = 0;     // How many attract cycles completed
        this.attractTimer = 0;         // Timer within current attract pass
        this.attractAnim = 'idle';     // 'idle', 'ccoin', 'play_y'
        this.attractAnimPhase = 0;     // Sub-phase of current animation
        this.attractAnimTimer = 0;     // Timer within current phase
        this.attractAlienX = 0;        // Animated alien position
        this.attractAlienY = 0;
        this.attractAlienFrame = 0;    // Alien animation frame (0/1)
        this.attractBombY = 0;         // Bomb position for CCOIN gag
        this.attractBombAlive = false;
        this.attractLetterX = 0;       // Letter position for PLAY gag
        this.attractLetterY = 0;
        this.attractCCorrected = false; // Has the extra C been destroyed?
        this.attractYCorrected = false; // Has the upside-down Y been fixed?
    }

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.lives = CONFIG.STARTING_LIVES;
        this.wave = 0;
        this.shotCount = 0;
        this.extraLifeAwarded = false;
        this.player = new Player();
        this.alienBombs = [];
        this.playerBullet = null;
        this.mysteryShip = null;
        this.scorePopups = [];
        this.startWave();
        this.sound.init();
    }

    startWave() {
        const waveOffset = Math.min(this.wave * CONFIG.WAVE_Y_OFFSET, CONFIG.MAX_WAVE_OFFSET);
        this.formation = new AlienFormation(waveOffset);
        // Only create new shields on wave 0 (first wave)
        if (this.wave === 0) {
            this.createShields();
        }
        this.alienBombs = [];
        this.playerBullet = null;
        this.mysteryShip = null;
        this.mysteryTimer = CONFIG.MYSTERY_SPAWN_INTERVAL;
        this.alienFireTimer = CONFIG.ALIEN_FIRE_BASE_INTERVAL;
    }

    createShields() {
        this.shields = [];
        const spacing = CONFIG.LOGICAL_WIDTH / (CONFIG.SHIELD_COUNT + 1);
        for (let i = 0; i < CONFIG.SHIELD_COUNT; i++) {
            const x = Math.floor(spacing * (i + 1) - CONFIG.SHIELD_WIDTH / 2);
            this.shields.push(new Shield(x, CONFIG.SHIELD_Y));
        }
    }

    update() {
        const dt = CONFIG.FRAME_TIME;

        switch (this.state) {
            case 'attract':
                this.updateAttract();
                break;
            case 'playing':
                this.updatePlaying(dt);
                break;
            case 'playerDeath':
                this.updatePlayerDeath(dt);
                break;
            case 'waveComplete':
                this.updateWaveComplete(dt);
                break;
            case 'gameOver':
                this.updateGameOver(dt);
                break;
        }

        this.input.update();
    }

    updateAttract() {
        if (this.input.anyKey()) {
            this.sound.init();
        }
        if (this.input.isStart()) {
            this.attractPassCount = 0;
            this.attractAnim = 'idle';
            this.startGame();
            return;
        }

        this.attractTimer++;

        // Toggle alien animation frame every 16 ticks
        if (this.attractTimer % 16 === 0) {
            this.attractAlienFrame = 1 - this.attractAlienFrame;
        }

        // Attract cycle: 10 seconds idle, then possibly an animation
        // First pass is always idle. After that, alternate ccoin/play_y gags.
        if (this.attractAnim === 'idle') {
            // After 10 seconds (600 frames), start next animation if applicable
            if (this.attractTimer >= 600) {
                this.attractTimer = 0;
                this.attractPassCount++;
                // Gags start from pass 1 (not the very first pass)
                if (this.attractPassCount >= 1) {
                    if (this.attractPassCount % 2 === 1) {
                        this.startCCoinAnim();
                    } else {
                        this.startPlayYAnim();
                    }
                }
            }
        } else if (this.attractAnim === 'ccoin') {
            this.updateCCoinAnim();
        } else if (this.attractAnim === 'play_y') {
            this.updatePlayYAnim();
        }
    }

    // ── "INSERT CCOIN" Animation ──────────────────────────
    // A small squid flies in and bombs the extra C.

    startCCoinAnim() {
        this.attractAnim = 'ccoin';
        this.attractAnimPhase = 0;  // 0=show text, 1=alien flies in, 2=bomb drops, 3=C explodes, 4=linger
        this.attractAnimTimer = 0;
        this.attractCCorrected = false;
        // Alien starts off-screen right, will fly to above the extra C
        this.attractAlienX = CONFIG.LOGICAL_WIDTH + 8;
        this.attractAlienY = 210;
    }

    updateCCoinAnim() {
        this.attractAnimTimer++;

        // Target X: the extra C in "INSERT  CCOIN" — the first C of "CC"
        // "INSERT  CCOIN" is centered. Let's compute where the first C of CC is.
        const textW = this.renderer.measureText('INSERT  CCOIN');
        const textStartX = Math.floor((CONFIG.LOGICAL_WIDTH - textW) / 2);
        // "INSERT  " = 8 chars. Each char is ~8px. The C is the 9th character.
        // But we need to measure precisely using the font widths.
        const prefixW = this.renderer.measureText('INSERT  ');
        const targetCX = textStartX + prefixW;

        switch (this.attractAnimPhase) {
            case 0: // Show "INSERT  CCOIN" for 1 second
                if (this.attractAnimTimer >= 60) {
                    this.attractAnimPhase = 1;
                    this.attractAnimTimer = 0;
                }
                break;

            case 1: // Alien flies in from right toward above the extra C
                this.attractAlienX -= 1.5;
                if (this.attractAlienX <= targetCX) {
                    this.attractAlienX = targetCX;
                    this.attractAnimPhase = 2;
                    this.attractAnimTimer = 0;
                    this.attractBombAlive = true;
                    this.attractBombY = this.attractAlienY + 8;
                }
                break;

            case 2: // Bomb drops toward the text at y=225
                this.attractBombY += 2;
                if (this.attractBombY >= 225) {
                    this.attractBombAlive = false;
                    this.attractCCorrected = true;
                    this.attractAnimPhase = 3;
                    this.attractAnimTimer = 0;
                }
                break;

            case 3: // Show explosion briefly (30 frames)
                if (this.attractAnimTimer >= 30) {
                    this.attractAnimPhase = 4;
                    this.attractAnimTimer = 0;
                }
                break;

            case 4: // Alien flies away to the left, linger with corrected text
                this.attractAlienX -= 2;
                if (this.attractAlienX < -16) {
                    // Linger with "INSERT  COIN" for 2 seconds then return to idle
                    if (this.attractAnimTimer >= 120) {
                        this.attractAnim = 'idle';
                        this.attractTimer = 0;
                    }
                }
                break;
        }
    }

    // ── Upside-down Y Animation ──────────────────────────
    // "PLAY" shows with flipped Y, alien drags it away and brings back correct Y.

    startPlayYAnim() {
        this.attractAnim = 'play_y';
        this.attractAnimPhase = 0;  // 0=show bad Y, 1=alien flies in, 2=drag off, 3=return with Y, 4=place Y, 5=linger
        this.attractAnimTimer = 0;
        this.attractYCorrected = false;
        // Alien starts off-screen left
        this.attractAlienX = -16;
        this.attractAlienY = 48;  // Same Y as "PLAY" text
        // Compute Y position in "PLAY" — it's the 4th character
        const playW = this.renderer.measureText('PLAY');
        const playStartX = Math.floor((CONFIG.LOGICAL_WIDTH - playW) / 2);
        const plaPreW = this.renderer.measureText('PLA');
        this.attractLetterX = playStartX + plaPreW + 3; // +3 for the spacing after A
        this.attractLetterY = 48;
    }

    updatePlayYAnim() {
        this.attractAnimTimer++;
        const targetX = this.attractLetterX;

        switch (this.attractAnimPhase) {
            case 0: // Show "PLAY" with upside-down Y for 1 second
                if (this.attractAnimTimer >= 60) {
                    this.attractAnimPhase = 1;
                    this.attractAnimTimer = 0;
                }
                break;

            case 1: // Alien flies in from left toward the Y
                this.attractAlienX += 1.5;
                if (this.attractAlienX >= targetX - 8) {
                    this.attractAlienX = targetX - 8;
                    this.attractAnimPhase = 2;
                    this.attractAnimTimer = 0;
                    // "Grab" the letter — alien is now next to it
                }
                break;

            case 2: // Alien drags the flipped Y off screen to the left
                this.attractAlienX -= 2;
                this.attractLetterX = this.attractAlienX + 8;
                if (this.attractAlienX < -16) {
                    this.attractAnimPhase = 3;
                    this.attractAnimTimer = 0;
                    this.attractYCorrected = true;
                    // Reset letter position to final destination
                    const playW = this.renderer.measureText('PLAY');
                    const playStartX = Math.floor((CONFIG.LOGICAL_WIDTH - playW) / 2);
                    const plaPreW = this.renderer.measureText('PLA');
                    this.attractLetterX = playStartX + plaPreW + 3;
                }
                break;

            case 3: { // Alien returns from right with correct Y
                if (this.attractAnimTimer === 1) {
                    this.attractAlienX = CONFIG.LOGICAL_WIDTH + 8;
                }
                this.attractAlienX -= 1.5;
                this.attractLetterX = this.attractAlienX + 8;
                // Check if letter has reached its final position
                const playW3 = this.renderer.measureText('PLAY');
                const playStartX3 = Math.floor((CONFIG.LOGICAL_WIDTH - playW3) / 2);
                const plaPreW3 = this.renderer.measureText('PLA');
                const finalX3 = playStartX3 + plaPreW3 + 3;
                if (this.attractLetterX <= finalX3) {
                    this.attractLetterX = finalX3;
                    this.attractAnimPhase = 4;
                    this.attractAnimTimer = 0;
                }
                break;
            }

            case 4: // Alien flies away to the right
                this.attractAlienX += 2;
                if (this.attractAlienX > CONFIG.LOGICAL_WIDTH + 16 && this.attractAnimTimer >= 120) {
                    this.attractAnim = 'idle';
                    this.attractTimer = 0;
                }
                break;
        }
    }

    updatePlaying(dt) {
        // Player movement
        if (this.input.isLeft()) this.player.moveLeft();
        if (this.input.isRight()) this.player.moveRight();

        // Player fire (only 1 bullet at a time)
        if (this.input.isFire() && (!this.playerBullet || !this.playerBullet.alive)) {
            const bulletX = this.player.x + Math.floor(CONFIG.PLAYER_WIDTH / 2);
            const bulletY = CONFIG.PLAYER_Y - CONFIG.BULLET_HEIGHT;
            this.playerBullet = new PlayerBullet(bulletX, bulletY);
            this.shotCount++;
            this.sound.playerFire();
        }

        // Update player bullet
        if (this.playerBullet && this.playerBullet.alive) {
            this.playerBullet.update();
        }

        // Update alien formation
        const marchNote = this.formation.update(dt);
        if (marchNote >= 0) {
            this.sound.marchNote(marchNote);
            CollisionSystem.erodeShieldsFromAliens(this.formation, this.shields);
        }

        // Alien firing
        this.updateAlienFiring(dt);

        // Update alien bombs
        for (const bomb of this.alienBombs) {
            if (bomb.alive) bomb.update(dt);
        }
        this.alienBombs = this.alienBombs.filter(b => b.alive);

        // Mystery ship
        this.updateMystery(dt);

        // Score popups
        for (const popup of this.scorePopups) popup.update(dt);
        this.scorePopups = this.scorePopups.filter(p => p.alive);

        // Collisions
        this.checkCollisions();

        // Check wave complete
        if (this.formation.countAlive() === 0) {
            this.state = 'waveComplete';
            this.waveTimer = CONFIG.WAVE_START_DELAY;
            this.alienBombs = [];
            if (this.mysteryShip) {
                this.sound.mysteryStop();
                this.mysteryShip = null;
            }
        }

        // Check aliens reached bottom — instant game over (authentic behavior)
        if (this.formation.aliensReachedBottom()) {
            this.player.alive = false;
            this.lives = 0;
            this.state = 'gameOver';
            this.gameOverTimer = CONFIG.GAME_OVER_DURATION;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('spaceinvaders_highscore', this.highScore.toString());
            }
        }
    }

    updateAlienFiring(dt) {
        this.alienFireTimer -= dt;
        if (this.alienFireTimer <= 0 && this.alienBombs.length < CONFIG.MAX_ALIEN_BOMBS) {
            const candidates = this.formation.getShooterCandidates();
            if (candidates.length > 0) {
                const shooter = candidates[MathUtils.randomInt(0, candidates.length - 1)];
                const pos = this.formation.getAlienPos(shooter.row, shooter.col);
                const bombType = MathUtils.randomInt(0, 2);
                const w = this.formation.getAlienWidth(shooter.row);
                this.alienBombs.push(new AlienBomb(pos.x + Math.floor(w / 2), pos.y + 8, bombType));
            }
            // Decrease interval as fewer aliens remain
            const alive = this.formation.countAlive();
            const ratio = alive / (CONFIG.ALIEN_ROWS * CONFIG.ALIEN_COLS);
            this.alienFireTimer = CONFIG.ALIEN_FIRE_MIN_INTERVAL +
                (CONFIG.ALIEN_FIRE_BASE_INTERVAL - CONFIG.ALIEN_FIRE_MIN_INTERVAL) * ratio;
        }
    }

    updateMystery(dt) {
        if (this.mysteryShip) {
            this.mysteryShip.update();
            if (!this.mysteryShip.alive) {
                this.sound.mysteryStop();
                this.mysteryShip = null;
            }
        } else {
            this.mysteryTimer -= dt;
            if (this.mysteryTimer <= 0 && this.formation.countAlive() >= CONFIG.MYSTERY_MIN_ALIENS) {
                const dir = Math.random() < 0.5 ? 1 : -1;
                this.mysteryShip = new MysteryShip(dir);
                this.sound.mysteryStart();
                this.mysteryTimer = CONFIG.MYSTERY_SPAWN_INTERVAL;
            }
        }
    }

    checkCollisions() {
        // Player bullet vs aliens
        if (this.playerBullet && this.playerBullet.alive) {
            const result = CollisionSystem.checkBulletAlien(this.playerBullet, this.formation);
            if (result.hit) {
                this.playerBullet.alive = false;
                this.addScore(CONFIG.ALIEN_SCORES[result.row]);
                this.sound.invaderKilled();
            }

            // Player bullet vs mystery ship
            if (this.playerBullet.alive && this.mysteryShip && this.mysteryShip.alive) {
                if (CollisionSystem.checkBulletMystery(this.playerBullet, this.mysteryShip)) {
                    this.playerBullet.alive = false;
                    const mysteryScore = CONFIG.MYSTERY_SCORE_TABLE[
                        (this.shotCount - 1) % CONFIG.MYSTERY_SCORE_TABLE.length
                    ];
                    this.addScore(mysteryScore);
                    this.scorePopups.push(
                        new ScorePopup(this.mysteryShip.x, this.mysteryShip.y, mysteryScore)
                    );
                    this.mysteryShip.alive = false;
                    this.sound.mysteryStop();
                    this.sound.invaderKilled();
                }
            }

            // Player bullet vs shields
            if (this.playerBullet.alive) {
                if (CollisionSystem.checkBulletShields(this.playerBullet, this.shields)) {
                    this.playerBullet.alive = false;
                }
            }
        }

        // Alien bombs vs player and shields
        for (const bomb of this.alienBombs) {
            if (bomb.alive && this.player.alive) {
                if (CollisionSystem.checkBombPlayer(bomb, this.player)) {
                    bomb.alive = false;
                    this.killPlayer();
                }
            }
            if (bomb.alive) {
                if (CollisionSystem.checkBombShields(bomb, this.shields)) {
                    bomb.alive = false;
                }
            }
        }
    }

    killPlayer() {
        if (!this.player.alive) return;
        this.player.startExplode();
        this.sound.playerExplode();
        this.state = 'playerDeath';
        this.deathTimer = CONFIG.PLAYER_DEATH_DURATION;
        this.alienBombs = [];
        this.playerBullet = null;
        if (this.mysteryShip) {
            this.sound.mysteryStop();
            this.mysteryShip = null;
        }
    }

    updatePlayerDeath(dt) {
        this.player.update(dt);
        this.deathTimer -= dt;
        // Keep updating score popups
        for (const popup of this.scorePopups) popup.update(dt);
        this.scorePopups = this.scorePopups.filter(p => p.alive);

        if (this.deathTimer <= 0) {
            this.lives--;
            if (this.lives <= 0) {
                this.state = 'gameOver';
                this.gameOverTimer = CONFIG.GAME_OVER_DURATION;
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('spaceinvaders_highscore', this.highScore.toString());
                }
            } else {
                this.player = new Player();
                this.state = 'playing';
                this.mysteryTimer = CONFIG.MYSTERY_SPAWN_INTERVAL;
            }
        }
    }

    updateWaveComplete(dt) {
        this.waveTimer -= dt;
        if (this.waveTimer <= 0) {
            this.wave++;
            this.startWave();
            this.state = 'playing';
        }
    }

    updateGameOver(dt) {
        this.gameOverTimer -= dt;
        if (this.gameOverTimer <= 0) {
            this.state = 'attract';
            this.attractPassCount = 0;
            this.attractTimer = 0;
            this.attractAnim = 'idle';
        }
    }

    addScore(points) {
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
        if (!this.extraLifeAwarded && this.score >= CONFIG.EXTRA_LIFE_SCORE) {
            this.extraLifeAwarded = true;
            this.lives++;
            this.sound.extraLife();
        }
    }

    getState() {
        return {
            state: this.state,
            player: this.player,
            formation: this.formation,
            playerBullet: this.playerBullet,
            alienBombs: this.alienBombs,
            mysteryShip: this.mysteryShip,
            shields: this.shields,
            scorePopups: this.scorePopups,
            score: this.score,
            highScore: this.highScore,
            lives: this.lives,
            wave: this.wave,
            // Attract animation fields
            attractAnim: this.attractAnim,
            attractAnimPhase: this.attractAnimPhase,
            attractAlienX: this.attractAlienX,
            attractAlienY: this.attractAlienY,
            attractAlienFrame: this.attractAlienFrame,
            attractBombY: this.attractBombY,
            attractBombAlive: this.attractBombAlive,
            attractLetterX: this.attractLetterX,
            attractLetterY: this.attractLetterY,
            attractCCorrected: this.attractCCorrected,
            attractYCorrected: this.attractYCorrected,
        };
    }
}

// ============================================================================
// SECTION 10: Main Loop & Bootstrap
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);

    let lastTime = performance.now();
    let accumulator = 0;

    function gameLoop(timestamp) {
        let delta = timestamp - lastTime;
        lastTime = timestamp;

        // Clamp delta to prevent spiral after tab-away
        if (delta > CONFIG.MAX_DELTA) delta = CONFIG.MAX_DELTA;

        accumulator += delta;

        // Fixed timestep: run physics at 60Hz
        while (accumulator >= CONFIG.FRAME_TIME) {
            game.update();
            accumulator -= CONFIG.FRAME_TIME;
        }

        game.renderer.render(game.getState());
        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
});
