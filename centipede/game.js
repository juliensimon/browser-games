'use strict';

// ============================================================================
// SECTION 1: CONFIG
// ============================================================================

const CONFIG = Object.freeze({
    // Display
    LOGICAL_WIDTH: 240,
    LOGICAL_HEIGHT: 256,
    SCALE: 3,
    WIDTH: 720,    // 240 * 3
    HEIGHT: 768,   // 256 * 3

    // Grid
    GRID_COLS: 30,
    GRID_ROWS: 32,
    TILE_SIZE: 8,

    // Player
    PLAYER_SPEED: 2,
    PLAYER_AREA_TOP: 208,    // row 26 — bottom 6 rows
    PLAYER_WIDTH: 8,
    PLAYER_HEIGHT: 8,

    // Bullet
    BULLET_SPEED: 6,
    BULLET_WIDTH: 1,
    BULLET_HEIGHT: 4,

    // Centipede
    CENTIPEDE_SPEED: 1,
    CENTIPEDE_FAST_SPEED: 2,
    CENTIPEDE_FAST_SCORE: 40000,
    CENTIPEDE_SEGMENTS: 12,

    // Spider
    SPIDER_SPEED: 1,
    SPIDER_FAST_SPEED: 2,
    SPIDER_FAST_SCORE: 5000,
    SPIDER_SCORE_CLOSE: 900,
    SPIDER_SCORE_MED: 600,
    SPIDER_SCORE_FAR: 300,
    SPIDER_CLOSE_DIST: 16,
    SPIDER_MED_DIST: 32,
    SPIDER_SPAWN_DELAY: 96,
    SPIDER_RESPAWN_DELAY: 128,
    SPIDER_UPPER_ROW: 96,

    // Flea
    FLEA_SPEED: 2,
    FLEA_FAST_SPEED: 3,
    FLEA_MUSHROOM_CHANCE: 0.25,
    FLEA_MIN_MUSHROOMS: 5,
    FLEA_HITS: 2,

    // Scorpion
    SCORPION_SPEED: 1,
    SCORPION_SCORE: 1000,

    // Mushroom
    MUSHROOM_HITS: 4,
    MUSHROOM_SCORE: 1,
    MUSHROOM_RESTORE_SCORE: 5,

    // Scoring
    HEAD_SCORE: 100,
    BODY_SCORE: 10,
    FLEA_SCORE: 200,

    // Game rules
    STARTING_LIVES: 3,
    MAX_LIVES: 6,
    EXTRA_LIFE_SCORE: 12000,
    INITIAL_MUSHROOM_COUNT: 46,

    // Timing
    FPS: 60,
    FRAME_TIME: 1000 / 60,
    MAX_DELTA: 200,
    PLAYER_DEATH_DURATION: 1500,
    WAVE_START_DELAY: 1000,
    GAME_OVER_DURATION: 3000,

    // Colors
    COLOR_BG: '#000000',
    COLOR_PLAYER: '#00ff00',
    COLOR_CENTIPEDE_HEAD: '#ff4444',
    COLOR_CENTIPEDE_BODY: '#00cc44',
    COLOR_MUSHROOM: '#ff8844',
    COLOR_MUSHROOM_POISON: '#cc44ff',
    COLOR_SPIDER: '#ffcc00',
    COLOR_FLEA: '#ff44ff',
    COLOR_SCORPION: '#4488ff',
    COLOR_BULLET: '#ffffff',
    COLOR_TEXT: '#ffffff',
    COLOR_SCORE: '#ff4444',
});

// ============================================================================
// SECTION 2: MATH UTILITIES
// ============================================================================

const MathUtils = {
    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    },
    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px < rx + rw && py >= ry && py < ry + rh;
    },
    gridToPixel(col, row) {
        return { x: col * CONFIG.TILE_SIZE, y: row * CONFIG.TILE_SIZE };
    },
    pixelToGrid(x, y) {
        return { col: Math.floor(x / CONFIG.TILE_SIZE), row: Math.floor(y / CONFIG.TILE_SIZE) };
    },
    rectsOverlapObj(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x &&
               a.y < b.y + b.h && a.y + a.h > b.y;
    },
};

// ============================================================================
// SECTION 3: SPRITE DATA
// ============================================================================

const SPRITES = {};

// --- Player & effects ---

// Bug Blaster — upward-pointing gun/blaster
SPRITES.PLAYER = [
    [0,0,0,1,0,0,0,0],
    [0,0,1,1,1,0,0,0],
    [0,0,1,1,1,0,0,0],
    [0,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,0,0],
    [1,1,0,1,0,1,1,0],
    [1,0,0,1,0,0,1,0],
    [1,0,0,0,0,0,1,0],
];

// Explosion frame 1 — expanding burst
SPRITES.PLAYER_EXPLODE_1 = [
    [0,0,1,0,0,1,0,0],
    [0,1,0,0,0,0,1,0],
    [1,0,0,1,1,0,0,1],
    [0,0,1,0,0,1,0,0],
    [0,0,1,0,0,1,0,0],
    [1,0,0,1,1,0,0,1],
    [0,1,0,0,0,0,1,0],
    [0,0,1,0,0,1,0,0],
];

// Explosion frame 2 — dissipating debris
SPRITES.PLAYER_EXPLODE_2 = [
    [1,0,0,0,0,0,0,1],
    [0,0,1,0,0,1,0,0],
    [0,1,0,0,0,0,1,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,1,0,0,0,0,1,0],
    [0,0,1,0,0,1,0,0],
    [1,0,0,0,0,0,0,1],
];

// --- Centipede Head ---

// Round head with eye and antennae
SPRITES.CENTIPEDE_HEAD = [
    [0,1,0,0,0,0,1,0],
    [0,0,1,0,0,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,0,1,1,1,1,1],
    [1,1,0,1,1,1,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,0],
];

// Head alternate frame — antennae shifted
SPRITES.CENTIPEDE_HEAD_ALT = [
    [1,0,0,0,0,0,0,1],
    [0,1,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,0],
    [1,1,1,1,0,1,1,1],
    [1,1,1,1,0,1,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,0],
];

// --- Centipede Body ---

// Round body segment with legs down
SPRITES.CENTIPEDE_BODY = [
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,1,0,0,0,0,1,0],
    [1,0,0,0,0,0,0,1],
];

// Body alternate frame — legs shifted
SPRITES.CENTIPEDE_BODY_ALT = [
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
    [1,0,0,0,0,0,0,1],
    [0,1,0,0,0,0,1,0],
];

// --- Spider ---

// Spider with legs spread out
SPRITES.SPIDER = [
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [1,0,1,1,1,1,0,1],
    [1,1,0,1,1,0,1,1],
    [0,1,1,1,1,1,1,0],
    [1,1,0,1,1,0,1,1],
    [1,0,0,0,0,0,0,1],
    [0,0,0,0,0,0,0,0],
];

// Spider alternate — legs shifted
SPRITES.SPIDER_ALT = [
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,0,0,1,1,0,0,1],
    [1,1,1,1,1,1,1,1],
    [0,1,0,1,1,0,1,0],
    [0,0,1,0,0,1,0,0],
    [0,1,0,0,0,0,1,0],
];

// --- Flea ---

// Small bug dropping down
SPRITES.FLEA = [
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [0,1,0,1,1,0,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,1,0,0,1,0,0],
    [0,1,0,0,0,0,1,0],
    [1,0,0,0,0,0,0,1],
];

// Flea alternate frame
SPRITES.FLEA_ALT = [
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [0,1,0,1,1,0,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,0],
    [0,1,0,0,0,0,1,0],
    [0,0,1,0,0,1,0,0],
    [0,0,0,1,1,0,0,0],
];

// --- Scorpion ---

// Scorpion moving horizontally with tail curled up
SPRITES.SCORPION = [
    [1,0,0,0,0,0,0,0],
    [0,1,0,0,0,1,1,0],
    [0,0,1,0,1,1,1,1],
    [0,0,1,1,1,1,1,1],
    [0,1,1,1,1,1,0,1],
    [1,0,1,1,1,1,1,0],
    [0,1,0,1,0,1,0,0],
    [1,0,0,0,1,0,0,0],
];

// Scorpion alternate frame — legs shifted
SPRITES.SCORPION_ALT = [
    [1,0,0,0,0,0,0,0],
    [0,1,0,0,0,1,1,0],
    [0,0,1,0,1,1,1,1],
    [0,0,1,1,1,1,1,1],
    [0,1,1,1,1,1,0,1],
    [1,0,1,1,1,1,1,0],
    [1,0,0,1,0,1,0,0],
    [0,1,0,0,0,0,1,0],
];

// --- Mushrooms (4 damage states) ---

// Full mushroom — dome with stem
SPRITES.MUSHROOM_0 = [
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
];

// 1 hit taken — small chip on top right
SPRITES.MUSHROOM_1 = [
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,0,0,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
];

// 2 hits taken — larger chunk missing
SPRITES.MUSHROOM_2 = [
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,1,1,0,0,0,0],
    [1,1,1,1,0,0,0,0],
    [1,1,1,1,0,0,0,0],
    [0,1,1,1,1,1,1,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
];

// 3 hits taken — nearly destroyed, just stem and partial dome
SPRITES.MUSHROOM_3 = [
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,1,1,0,0,0,0],
    [0,0,1,1,0,0,0,0],
    [0,0,1,1,0,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
];

// --- Poisoned Mushrooms (same 4 damage states, distinct pattern) ---
// Poisoned mushrooms have a striped/inverted pattern to distinguish them

SPRITES.MUSHROOM_POISON_0 = [
    [0,0,1,1,1,1,0,0],
    [0,1,0,1,0,1,1,0],
    [1,0,1,0,1,0,1,1],
    [1,1,0,1,0,1,0,1],
    [1,0,1,0,1,0,1,1],
    [0,1,0,1,0,1,1,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
];

SPRITES.MUSHROOM_POISON_1 = [
    [0,0,1,1,1,1,0,0],
    [0,1,0,1,0,1,1,0],
    [1,0,1,0,1,0,1,1],
    [1,1,0,1,0,1,0,1],
    [1,0,1,0,0,0,1,1],
    [0,1,0,1,0,1,1,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
];

SPRITES.MUSHROOM_POISON_2 = [
    [0,0,1,1,1,1,0,0],
    [0,1,0,1,0,1,1,0],
    [1,0,1,0,0,0,0,0],
    [1,1,0,1,0,0,0,0],
    [1,0,1,0,0,0,0,0],
    [0,1,0,1,0,1,1,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
];

SPRITES.MUSHROOM_POISON_3 = [
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,1,0,0,0,0,0],
    [0,0,0,1,0,0,0,0],
    [0,0,1,0,0,0,0,0],
    [0,0,1,0,1,1,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
];

// --- Bullet ---
// 1x4 vertical line (stored as 8x8 with only center column used)
SPRITES.BULLET = [
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,1,0,0,0,0],
    [0,0,0,1,0,0,0,0],
    [0,0,0,1,0,0,0,0],
    [0,0,0,1,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
];

// --- Font Glyphs (5 wide × 7 tall) ---

const FONT = {};

FONT['A'] = [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
];
FONT['B'] = [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
];
FONT['C'] = [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,1],
    [0,1,1,1,0],
];
FONT['D'] = [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
];
FONT['E'] = [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
];
FONT['F'] = [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
];
FONT['G'] = [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,0],
    [1,0,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
];
FONT['H'] = [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
];
FONT['I'] = [
    [1,1,1,1,1],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [1,1,1,1,1],
];
FONT['J'] = [
    [0,0,1,1,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
];
FONT['K'] = [
    [1,0,0,0,1],
    [1,0,0,1,0],
    [1,0,1,0,0],
    [1,1,0,0,0],
    [1,0,1,0,0],
    [1,0,0,1,0],
    [1,0,0,0,1],
];
FONT['L'] = [
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
];
FONT['M'] = [
    [1,0,0,0,1],
    [1,1,0,1,1],
    [1,0,1,0,1],
    [1,0,1,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
];
FONT['N'] = [
    [1,0,0,0,1],
    [1,1,0,0,1],
    [1,0,1,0,1],
    [1,0,1,0,1],
    [1,0,1,0,1],
    [1,0,0,1,1],
    [1,0,0,0,1],
];
FONT['O'] = [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
];
FONT['P'] = [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
];
FONT['Q'] = [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,1,0,1],
    [1,0,0,1,0],
    [0,1,1,0,1],
];
FONT['R'] = [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [1,0,1,0,0],
    [1,0,0,1,0],
    [1,0,0,0,1],
];
FONT['S'] = [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,0],
    [0,1,1,1,0],
    [0,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
];
FONT['T'] = [
    [1,1,1,1,1],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
];
FONT['U'] = [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
];
FONT['V'] = [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,0,1,0],
    [0,1,0,1,0],
    [0,0,1,0,0],
];
FONT['W'] = [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,1,0,1],
    [1,0,1,0,1],
    [1,1,0,1,1],
    [1,0,0,0,1],
];
FONT['X'] = [
    [1,0,0,0,1],
    [0,1,0,1,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,1,0,1,0],
    [1,0,0,0,1],
];
FONT['Y'] = [
    [1,0,0,0,1],
    [0,1,0,1,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
];
FONT['Z'] = [
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,1,0],
    [0,0,1,0,0],
    [0,1,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
];
FONT['0'] = [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,1,1],
    [1,0,1,0,1],
    [1,1,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
];
FONT['1'] = [
    [0,0,1,0,0],
    [0,1,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,1,1,1,0],
];
FONT['2'] = [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [0,0,0,0,1],
    [0,0,0,1,0],
    [0,0,1,0,0],
    [0,1,0,0,0],
    [1,1,1,1,1],
];
FONT['3'] = [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [0,0,0,0,1],
    [0,0,1,1,0],
    [0,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
];
FONT['4'] = [
    [0,0,0,1,0],
    [0,0,1,1,0],
    [0,1,0,1,0],
    [1,0,0,1,0],
    [1,1,1,1,1],
    [0,0,0,1,0],
    [0,0,0,1,0],
];
FONT['5'] = [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
];
FONT['6'] = [
    [0,1,1,1,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
];
FONT['7'] = [
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,1,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
];
FONT['8'] = [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
];
FONT['9'] = [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
    [0,1,1,1,0],
];
FONT[' '] = [
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
];
FONT['.'] = [
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,1,0,0],
];
FONT['-'] = [
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [1,1,1,1,1],
    [0,0,0,0,0],
    [0,0,0,0,0],
    [0,0,0,0,0],
];
FONT['>'] = [
    [1,0,0,0,0],
    [0,1,0,0,0],
    [0,0,1,0,0],
    [0,0,0,1,0],
    [0,0,1,0,0],
    [0,1,0,0,0],
    [1,0,0,0,0],
];
FONT['<'] = [
    [0,0,0,0,1],
    [0,0,0,1,0],
    [0,0,1,0,0],
    [0,1,0,0,0],
    [0,0,1,0,0],
    [0,0,0,1,0],
    [0,0,0,0,1],
];
FONT['!'] = [
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,0,0,0],
    [0,0,1,0,0],
];
FONT['*'] = [
    [0,0,0,0,0],
    [0,0,1,0,0],
    [1,0,1,0,1],
    [0,1,1,1,0],
    [1,0,1,0,1],
    [0,0,1,0,0],
    [0,0,0,0,0],
];
FONT['\u00A9'] = [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,1,0,1],
    [1,0,1,0,0],
    [1,0,1,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0],
];
FONT['='] = [
    [0,0,0,0,0],
    [0,0,0,0,0],
    [1,1,1,1,1],
    [0,0,0,0,0],
    [1,1,1,1,1],
    [0,0,0,0,0],
    [0,0,0,0,0],
];

// ============================================================================
// SECTION 5: INPUT HANDLER
// ============================================================================

class InputHandler {
    constructor() {
        this.keys = {};
        this.justPressedKeys = {};
        this._keyDownBuffer = {};
        // Bind keyboard listeners
        window.addEventListener('keydown', (e) => {
            if (!e.repeat) {
                this._keyDownBuffer[e.key] = true;
            }
            this.keys[e.key] = true;
            e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            e.preventDefault();
        });
    }

    isDown(key) { return !!this.keys[key]; }

    justPressed(key) { return !!this.justPressedKeys[key]; }

    // 4-directional movement for centipede (player moves in bottom area)
    isLeft() { return this.isDown('ArrowLeft') || this.isDown('a'); }
    isRight() { return this.isDown('ArrowRight') || this.isDown('d'); }
    isUp() { return this.isDown('ArrowUp') || this.isDown('w'); }
    isDownDir() { return this.isDown('ArrowDown') || this.isDown('s'); }
    isFire() { return this.justPressed(' '); }
    isStart() { return this.justPressed('Enter'); }
    anyKey() { return Object.values(this.keys).some(v => v); }

    update() {
        this.justPressedKeys = { ...this._keyDownBuffer };
        this._keyDownBuffer = {};
    }
}
// ============================================================================
// SECTION 4: SOUND ENGINE
// ============================================================================

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.initialized = true;
    }

    _createEnvelope(duration, attack = 0.01, release = 0.05) {
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1, now + attack);
        gain.gain.setValueAtTime(1, now + attack);
        gain.gain.linearRampToValueAtTime(0, now + duration - release);
        return { gain, now };
    }

    _createNoiseBuffer(duration) {
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playerFire() {
        if (!this.initialized) return;
        const { gain, now } = this._createEnvelope(0.04, 0.002, 0.01);
        gain.gain.setValueAtTime(0.3, now);
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2000, now);
        osc.frequency.linearRampToValueAtTime(500, now + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
    }

    segmentHit() {
        if (!this.initialized) return;
        const duration = 0.08;
        const { gain, now } = this._createEnvelope(duration, 0.005, 0.03);
        gain.gain.setValueAtTime(0.4, now);

        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = this._createNoiseBuffer(duration);

        const bandpass = this.ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 600;
        bandpass.Q.value = 2;

        noiseSource.connect(bandpass);
        bandpass.connect(gain);
        gain.connect(this.ctx.destination);
        noiseSource.start(now);
        noiseSource.stop(now + duration);
    }

    mushroomHit() {
        if (!this.initialized) return;
        const duration = 0.015;
        const { gain, now } = this._createEnvelope(duration, 0.001, 0.005);
        gain.gain.setValueAtTime(0.2, now);
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    spiderSound() {
        if (!this.initialized) return;
        const duration = 0.15;
        const { gain, now } = this._createEnvelope(duration, 0.01, 0.03);
        gain.gain.setValueAtTime(0.25, now);

        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(400, now);

        const osc2 = this.ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(350, now);

        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(8, now);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(100, now);
        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        lfoGain.connect(osc2.frequency);

        const mixer = this.ctx.createGain();
        mixer.gain.setValueAtTime(0.5, now);

        osc1.connect(mixer);
        osc2.connect(mixer);
        mixer.connect(gain);
        gain.connect(this.ctx.destination);

        lfo.start(now);
        osc1.start(now);
        osc2.start(now);
        lfo.stop(now + duration);
        osc1.stop(now + duration);
        osc2.stop(now + duration);
    }

    fleaDrop() {
        if (!this.initialized) return;
        const duration = 0.2;
        const { gain, now } = this._createEnvelope(duration, 0.01, 0.05);
        gain.gain.setValueAtTime(0.3, now);
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.linearRampToValueAtTime(200, now + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    scorpionSound() {
        if (!this.initialized) return;
        const duration = 0.3;
        const { gain, now } = this._createEnvelope(duration, 0.01, 0.05);
        gain.gain.setValueAtTime(0.2, now);

        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);

        const pulseGain = this.ctx.createGain();
        const pulseLfo = this.ctx.createOscillator();
        pulseLfo.type = 'square';
        pulseLfo.frequency.setValueAtTime(12, now);
        pulseLfo.connect(pulseGain.gain);
        pulseGain.gain.setValueAtTime(0.5, now);

        osc.connect(pulseGain);
        pulseGain.connect(gain);
        gain.connect(this.ctx.destination);

        pulseLfo.start(now);
        osc.start(now);
        pulseLfo.stop(now + duration);
        osc.stop(now + duration);
    }

    playerDeath() {
        if (!this.initialized) return;
        const duration = 0.5;
        const { gain, now } = this._createEnvelope(duration, 0.01, 0.1);
        gain.gain.setValueAtTime(0.4, now);

        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = this._createNoiseBuffer(duration);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.linearRampToValueAtTime(0, now + duration);
        noiseSource.connect(noiseGain);
        noiseGain.connect(gain);

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(50, now + duration);
        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.5, now);
        osc.connect(oscGain);
        oscGain.connect(gain);

        gain.connect(this.ctx.destination);
        noiseSource.start(now);
        osc.start(now);
        noiseSource.stop(now + duration);
        osc.stop(now + duration);
    }

    extraLife() {
        if (!this.initialized) return;
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        const noteLen = 0.08;
        const gap = 0.02;
        notes.forEach((freq, i) => {
            const startTime = this.ctx.currentTime + i * (noteLen + gap);
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0, startTime);
            g.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
            g.gain.setValueAtTime(0.3, startTime + noteLen - 0.02);
            g.gain.linearRampToValueAtTime(0, startTime + noteLen);
            osc.connect(g);
            g.connect(this.ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + noteLen);
        });
    }

    waveComplete() {
        if (!this.initialized) return;
        const steps = 6;
        const stepLen = 0.06;
        for (let i = 0; i < steps; i++) {
            const startTime = this.ctx.currentTime + i * stepLen;
            const freq = 400 + (400 * i / (steps - 1));
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0, startTime);
            g.gain.linearRampToValueAtTime(0.25, startTime + 0.01);
            g.gain.setValueAtTime(0.25, startTime + stepLen - 0.015);
            g.gain.linearRampToValueAtTime(0, startTime + stepLen);
            osc.connect(g);
            g.connect(this.ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + stepLen);
        }
    }

    centipedeMove() {
        if (!this.initialized) return;
        const duration = 0.06;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(80, now);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.15, now + 0.005);
        g.gain.setValueAtTime(0.15, now + duration - 0.02);
        g.gain.linearRampToValueAtTime(0, now + duration);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }
}

// ============================================================================
// SECTION 6: ENTITY CLASSES
// ============================================================================

class CentipedeSegment {
    constructor(col, row, isHead, direction) {
        this.col = col;
        this.row = row;
        this.x = col * CONFIG.TILE_SIZE;
        this.y = row * CONFIG.TILE_SIZE;
        this.isHead = isHead;
        this.alive = true;
        this.dir = direction; // +1 = right, -1 = left
        this.frame = 0;
        this.frameTimer = 0;
        this.speed = CONFIG.CENTIPEDE_SPEED;
        this.poisonDive = false;
        this.moveTimer = 0;
        this.dropping = false;
        this.targetRow = row;
    }

    update(mushrooms, score) {
        if (!this.alive) return;

        // Speed up at high score
        this.speed = score >= CONFIG.CENTIPEDE_FAST_SCORE
            ? CONFIG.CENTIPEDE_FAST_SPEED
            : CONFIG.CENTIPEDE_SPEED;

        // Animate between two frames every 8 ticks
        this.frameTimer++;
        if (this.frameTimer >= 8) {
            this.frame = (this.frame + 1) % 2;
            this.frameTimer = 0;
        }

        // Poison dive: move straight down ignoring everything
        if (this.poisonDive) {
            this.y += this.speed;
            this.row = Math.floor(this.y / CONFIG.TILE_SIZE);
            // Reached bottom: wrap to top and resume normal behavior
            if (this.y >= CONFIG.LOGICAL_HEIGHT) {
                this.y = 0;
                this.row = 0;
                this.col = Math.floor(this.x / CONFIG.TILE_SIZE);
                this.poisonDive = false;
                this.dropping = false;
            }
            return;
        }

        // Dropping: move down one full tile
        if (this.dropping) {
            this.y += this.speed;
            if (this.y >= this.targetRow * CONFIG.TILE_SIZE) {
                this.y = this.targetRow * CONFIG.TILE_SIZE;
                this.row = this.targetRow;
                this.dropping = false;
            }
            return;
        }

        // Horizontal movement
        this.x += this.dir * this.speed;

        // Check if we've reached a grid boundary
        if (this.x % CONFIG.TILE_SIZE === 0) {
            this.col = Math.floor(this.x / CONFIG.TILE_SIZE);

            // Check next horizontal tile
            var nextCol = this.col + this.dir;
            var blocked = false;

            // Screen edge check
            if (nextCol < 0 || nextCol >= Math.floor(CONFIG.LOGICAL_WIDTH / CONFIG.TILE_SIZE)) {
                blocked = true;
            }

            // Mushroom check
            if (!blocked && mushrooms[nextCol] && mushrooms[nextCol][this.row]) {
                var mush = mushrooms[nextCol][this.row];
                if (mush.alive) {
                    // Check for poisoned mushroom
                    if (mush.poisoned) {
                        this.startPoisonDive();
                        return;
                    }
                    blocked = true;
                }
            }

            if (blocked) {
                this.reverseAndDrop();
            }
        }
    }

    getRect() {
        return { x: this.x, y: this.y, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE };
    }

    reverseAndDrop() {
        this.dir *= -1;
        this.targetRow = this.row + 1;
        this.dropping = true;
    }

    startPoisonDive() {
        this.poisonDive = true;
    }
}

class Spider {
    constructor(side) {
        this.x = side === 'left' ? 0 : CONFIG.LOGICAL_WIDTH - CONFIG.TILE_SIZE;
        this.y = CONFIG.PLAYER_AREA_TOP;
        this.alive = true;
        this.dx = side === 'left' ? 1 : -1;
        this.dy = 1;
        this.frame = 0;
        this.frameTimer = 0;
        this.speed = CONFIG.SPIDER_SPEED;
        this.dirChangeTimer = 0;
        this.dirChangeInterval = MathUtils.randomInt(16, 32);
    }

    update(score) {
        if (!this.alive) return;

        // Speed increases after high score threshold
        this.speed = score >= CONFIG.SPIDER_FAST_SCORE
            ? CONFIG.SPIDER_FAST_SPEED
            : CONFIG.SPIDER_SPEED;

        // Calculate upper bound — contracts as score increases (60K-180K range)
        var upperRow = CONFIG.SPIDER_UPPER_ROW;
        if (score >= 60000) {
            var progress = Math.min((score - 60000) / 120000, 1);
            var rowShift = Math.floor(progress * 6);
            upperRow = CONFIG.SPIDER_UPPER_ROW + rowShift;
        }
        var upperY = upperRow * CONFIG.TILE_SIZE;
        var lowerY = CONFIG.LOGICAL_HEIGHT - CONFIG.TILE_SIZE;

        // Erratic diagonal movement
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;

        // Randomly change vertical direction for erratic bouncing
        this.dirChangeTimer++;
        if (this.dirChangeTimer >= this.dirChangeInterval) {
            this.dy *= -1;
            this.dirChangeTimer = 0;
            this.dirChangeInterval = MathUtils.randomInt(16, 32);
        }

        // Bounce off vertical bounds
        if (this.y < upperY) {
            this.y = upperY;
            this.dy = 1;
        }
        if (this.y > lowerY) {
            this.y = lowerY;
            this.dy = -1;
        }

        // Mark dead when off screen horizontally
        if (this.x < -CONFIG.TILE_SIZE || this.x > CONFIG.LOGICAL_WIDTH) {
            this.alive = false;
        }

        // Animate frame
        this.frameTimer++;
        if (this.frameTimer >= 6) {
            this.frame = (this.frame + 1) % 2;
            this.frameTimer = 0;
        }
    }

    getRect() {
        return { x: this.x, y: this.y, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE };
    }
}

class Flea {
    constructor(col) {
        this.x = col * CONFIG.TILE_SIZE;
        this.y = 0;
        this.alive = true;
        this.hits = 0;
        this.speed = CONFIG.FLEA_SPEED;
        this.frame = 0;
        this.frameTimer = 0;
        this.dropTimer = 0;
    }

    update(mushrooms) {
        if (!this.alive) return;

        // Move straight down
        this.y += this.speed;

        // Every 4 frames, 25% chance to leave a mushroom
        this.dropTimer++;
        if (this.dropTimer >= 4) {
            this.dropTimer = 0;
            if (Math.random() < CONFIG.FLEA_MUSHROOM_CHANCE) {
                var col = Math.floor(this.x / CONFIG.TILE_SIZE);
                var row = Math.floor(this.y / CONFIG.TILE_SIZE);
                if (col >= 0 && row >= 0 &&
                    col < Math.floor(CONFIG.LOGICAL_WIDTH / CONFIG.TILE_SIZE) &&
                    row < Math.floor(CONFIG.LOGICAL_HEIGHT / CONFIG.TILE_SIZE)) {
                    if (!mushrooms[col]) mushrooms[col] = {};
                    if (!mushrooms[col][row] || !mushrooms[col][row].alive) {
                        mushrooms[col][row] = { hits: 0, poisoned: false, alive: true };
                    }
                }
            }
        }

        // Off screen bottom
        if (this.y > CONFIG.LOGICAL_HEIGHT) {
            this.alive = false;
        }

        // Animate frame
        this.frameTimer++;
        if (this.frameTimer >= 6) {
            this.frame = (this.frame + 1) % 2;
            this.frameTimer = 0;
        }
    }

    hit() {
        this.hits++;
        if (this.hits >= CONFIG.FLEA_HITS) {
            this.alive = false;
        } else {
            this.speed = CONFIG.FLEA_FAST_SPEED;
        }
    }

    getRect() {
        return { x: this.x, y: this.y, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE };
    }
}

class Scorpion {
    constructor(side, row) {
        this.x = side === 'left' ? -CONFIG.TILE_SIZE : CONFIG.LOGICAL_WIDTH;
        this.dir = side === 'left' ? 1 : -1;
        this.y = row * CONFIG.TILE_SIZE;
        this.row = row;
        this.alive = true;
        this.frame = 0;
        this.frameTimer = 0;
    }

    update(mushrooms) {
        if (!this.alive) return;

        // Move horizontally across the screen
        this.x += this.dir * CONFIG.SCORPION_SPEED;

        // Poison any mushroom at current grid column
        var col = Math.floor(this.x / CONFIG.TILE_SIZE);
        if (col >= 0 && col < Math.floor(CONFIG.LOGICAL_WIDTH / CONFIG.TILE_SIZE)) {
            if (mushrooms[col] && mushrooms[col][this.row] && mushrooms[col][this.row].alive) {
                mushrooms[col][this.row].poisoned = true;
            }
        }

        // Off screen on the other side
        if (this.dir === 1 && this.x > CONFIG.LOGICAL_WIDTH) {
            this.alive = false;
        } else if (this.dir === -1 && this.x < -CONFIG.TILE_SIZE) {
            this.alive = false;
        }

        // Animate frame
        this.frameTimer++;
        if (this.frameTimer >= 8) {
            this.frame = (this.frame + 1) % 2;
            this.frameTimer = 0;
        }
    }

    getRect() {
        return { x: this.x, y: this.y, w: CONFIG.TILE_SIZE, h: CONFIG.TILE_SIZE };
    }
}

class Player {
    constructor() {
        this.x = CONFIG.LOGICAL_WIDTH / 2 - CONFIG.PLAYER_WIDTH / 2;
        this.y = CONFIG.LOGICAL_HEIGHT - CONFIG.PLAYER_HEIGHT * 2;
        this.alive = true;
        this.exploding = false;
        this.explodeFrame = 0;
        this.explodeTimer = 0;
    }

    update(input, mushrooms) {
        if (!this.alive || this.exploding) return;

        var speed = CONFIG.PLAYER_SPEED;
        var nextX = this.x;
        var nextY = this.y;

        if (input.isLeft()) nextX -= speed;
        if (input.isRight()) nextX += speed;
        if (input.isUp()) nextY -= speed;
        if (input.isDownDir()) nextY += speed;

        // Clamp to screen bounds
        nextX = MathUtils.clamp(nextX, 0, CONFIG.LOGICAL_WIDTH - CONFIG.PLAYER_WIDTH);
        nextY = MathUtils.clamp(nextY, CONFIG.PLAYER_AREA_TOP, CONFIG.LOGICAL_HEIGHT - CONFIG.PLAYER_HEIGHT);

        // Check mushroom collision before applying movement
        var playerCol = Math.floor(nextX / CONFIG.TILE_SIZE);
        var playerRow = Math.floor(nextY / CONFIG.TILE_SIZE);
        var playerColEnd = Math.floor((nextX + CONFIG.PLAYER_WIDTH - 1) / CONFIG.TILE_SIZE);
        var playerRowEnd = Math.floor((nextY + CONFIG.PLAYER_HEIGHT - 1) / CONFIG.TILE_SIZE);

        var blocked = false;
        for (var c = playerCol; c <= playerColEnd; c++) {
            for (var r = playerRow; r <= playerRowEnd; r++) {
                if (mushrooms[c] && mushrooms[c][r] && mushrooms[c][r].alive) {
                    blocked = true;
                    break;
                }
            }
            if (blocked) break;
        }

        if (!blocked) {
            this.x = nextX;
            this.y = nextY;
        } else {
            // Try moving on each axis independently
            // Try horizontal only
            var hx = nextX;
            var hy = this.y;
            var hBlocked = false;
            var hcStart = Math.floor(hx / CONFIG.TILE_SIZE);
            var hcEnd = Math.floor((hx + CONFIG.PLAYER_WIDTH - 1) / CONFIG.TILE_SIZE);
            var hrStart = Math.floor(hy / CONFIG.TILE_SIZE);
            var hrEnd = Math.floor((hy + CONFIG.PLAYER_HEIGHT - 1) / CONFIG.TILE_SIZE);
            for (var c = hcStart; c <= hcEnd; c++) {
                for (var r = hrStart; r <= hrEnd; r++) {
                    if (mushrooms[c] && mushrooms[c][r] && mushrooms[c][r].alive) {
                        hBlocked = true;
                        break;
                    }
                }
                if (hBlocked) break;
            }
            if (!hBlocked) this.x = hx;

            // Try vertical only
            var vx = this.x;
            var vy = nextY;
            var vBlocked = false;
            var vcStart = Math.floor(vx / CONFIG.TILE_SIZE);
            var vcEnd = Math.floor((vx + CONFIG.PLAYER_WIDTH - 1) / CONFIG.TILE_SIZE);
            var vrStart = Math.floor(vy / CONFIG.TILE_SIZE);
            var vrEnd = Math.floor((vy + CONFIG.PLAYER_HEIGHT - 1) / CONFIG.TILE_SIZE);
            for (var c = vcStart; c <= vcEnd; c++) {
                for (var r = vrStart; r <= vrEnd; r++) {
                    if (mushrooms[c] && mushrooms[c][r] && mushrooms[c][r].alive) {
                        vBlocked = true;
                        break;
                    }
                }
                if (vBlocked) break;
            }
            if (!vBlocked) this.y = vy;
        }
    }

    getRect() {
        return { x: this.x, y: this.y, w: CONFIG.PLAYER_WIDTH, h: CONFIG.PLAYER_HEIGHT };
    }

    die() {
        this.alive = false;
        this.exploding = true;
        this.explodeFrame = 0;
        this.explodeTimer = 0;
    }

    updateDeath(dt) {
        if (!this.exploding) return;
        this.explodeTimer += dt;
        this.explodeFrame = this.explodeTimer > CONFIG.PLAYER_DEATH_DURATION / 2 ? 1 : 0;
        if (this.explodeTimer >= CONFIG.PLAYER_DEATH_DURATION) {
            this.exploding = false;
        }
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.alive = true;
    }

    update() {
        this.y -= CONFIG.BULLET_SPEED;
        if (this.y < 0) this.alive = false;
    }

    getRect() {
        return { x: this.x, y: this.y, w: CONFIG.BULLET_WIDTH, h: CONFIG.BULLET_HEIGHT };
    }
}
// ============================================================================
// SECTION 7: Collision System
// ============================================================================

const CollisionSystem = {
    checkBulletVsCentipede(bullet, segments, mushrooms) {
        const bulletRect = bullet.getRect();
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            if (!seg.alive) continue;
            if (MathUtils.rectsOverlapObj(bulletRect, seg.getRect())) {
                seg.alive = false;
                bullet.alive = false;

                // Leave a mushroom at the segment's grid position
                const segGrid = MathUtils.pixelToGrid(seg.x, seg.y);
                const gridCol = segGrid.col;
                const gridRow = segGrid.row;
                if (gridCol >= 0 && gridCol < CONFIG.GRID_COLS &&
                    gridRow >= 0 && gridRow < CONFIG.GRID_ROWS) {
                    if (!mushrooms[gridCol][gridRow]) {
                        mushrooms[gridCol][gridRow] = { hits: 0, poisoned: false, alive: true };
                    }
                }

                const isHead = seg.isHead;
                const score = isHead ? CONFIG.HEAD_SCORE : CONFIG.BODY_SCORE;

                // If body segment was hit, split the centipede
                if (!isHead) {
                    // Find connected segments behind the hit one
                    // Segments after the hit index in the array that are part of the same chain
                    // The next alive segment after the hit becomes a new head
                    let foundNext = false;
                    for (let j = i + 1; j < segments.length; j++) {
                        if (segments[j].alive && !foundNext) {
                            segments[j].isHead = true;
                            segments[j].reverseAndDrop();
                            foundNext = true;
                            break;
                        }
                    }
                }

                return { hit: true, isHead: isHead, segment: seg, score: score };
            }
        }
        return { hit: false, isHead: false, segment: null, score: 0 };
    },

    checkBulletVsSpider(bullet, spider) {
        if (!spider || !spider.alive) return { hit: false, score: 0 };
        if (MathUtils.rectsOverlapObj(bullet.getRect(), spider.getRect())) {
            spider.alive = false;
            bullet.alive = false;
            const playerY = CONFIG.LOGICAL_HEIGHT - CONFIG.PLAYER_HEIGHT * 2;
            const distance = Math.abs(spider.y - playerY);
            let score;
            if (distance <= CONFIG.SPIDER_CLOSE_DIST) {
                score = CONFIG.SPIDER_SCORE_CLOSE;
            } else if (distance <= CONFIG.SPIDER_MED_DIST) {
                score = CONFIG.SPIDER_SCORE_MED;
            } else {
                score = CONFIG.SPIDER_SCORE_FAR;
            }
            return { hit: true, score: score };
        }
        return { hit: false, score: 0 };
    },

    checkBulletVsFlea(bullet, flea) {
        if (!flea || !flea.alive) return { hit: false, killed: false, score: 0 };
        if (MathUtils.rectsOverlapObj(bullet.getRect(), flea.getRect())) {
            bullet.alive = false;
            flea.hit();
            const killed = !flea.alive;
            return { hit: true, killed: killed, score: killed ? CONFIG.FLEA_SCORE : 0 };
        }
        return { hit: false, killed: false, score: 0 };
    },

    checkBulletVsScorpion(bullet, scorpion) {
        if (!scorpion || !scorpion.alive) return { hit: false, score: 0 };
        if (MathUtils.rectsOverlapObj(bullet.getRect(), scorpion.getRect())) {
            scorpion.alive = false;
            bullet.alive = false;
            return { hit: true, score: CONFIG.SCORPION_SCORE };
        }
        return { hit: false, score: 0 };
    },

    checkBulletVsMushroom(bullet, mushrooms) {
        const bGrid = MathUtils.pixelToGrid(bullet.x, bullet.y);
        const gridCol = bGrid.col;
        const gridRow = bGrid.row;
        if (gridCol >= 0 && gridCol < CONFIG.GRID_COLS &&
            gridRow >= 0 && gridRow < CONFIG.GRID_ROWS) {
            const m = mushrooms[gridCol][gridRow];
            if (m && m.alive) {
                m.hits++;
                if (m.hits >= CONFIG.MUSHROOM_HITS) {
                    m.alive = false;
                }
                bullet.alive = false;
                return { hit: true, destroyed: !m.alive, score: CONFIG.MUSHROOM_SCORE };
            }
        }
        return { hit: false, destroyed: false, score: 0 };
    },

    checkSpiderVsPlayer(spider, player) {
        if (!spider || !spider.alive || !player || !player.alive) return false;
        return MathUtils.rectsOverlapObj(spider.getRect(), player.getRect());
    },

    checkCentipedeVsPlayer(segments, player) {
        if (!player || !player.alive) return false;
        const playerRect = player.getRect();
        for (const seg of segments) {
            if (seg.alive && MathUtils.rectsOverlapObj(seg.getRect(), playerRect)) {
                return true;
            }
        }
        return false;
    },

    checkFleaVsPlayer(flea, player) {
        if (!flea || !flea.alive || !player || !player.alive) return false;
        return MathUtils.rectsOverlapObj(flea.getRect(), player.getRect());
    },

    checkSpiderVsMushrooms(spider, mushrooms) {
        if (!spider || !spider.alive) return;
        // Check the grid cell at spider's center position
        const centerX = spider.x + 4;
        const centerY = spider.y + 4;
        const sGrid = MathUtils.pixelToGrid(centerX, centerY);
        const gridCol = sGrid.col;
        const gridRow = sGrid.row;
        if (gridCol >= 0 && gridCol < CONFIG.GRID_COLS &&
            gridRow >= 0 && gridRow < CONFIG.GRID_ROWS) {
            const m = mushrooms[gridCol][gridRow];
            if (m && m.alive) {
                m.alive = false;
            }
        }
    },
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

    clear() {
        this.ctx.fillStyle = CONFIG.COLOR_BG;
        this.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    }

    drawSprite(sprite, x, y, color) {
        this.ctx.fillStyle = color;
        for (let row = 0; row < sprite.length; row++) {
            for (let col = 0; col < sprite[row].length; col++) {
                if (sprite[row][col]) {
                    this.ctx.fillRect(
                        (x + col) * CONFIG.SCALE,
                        (y + row) * CONFIG.SCALE,
                        CONFIG.SCALE,
                        CONFIG.SCALE
                    );
                }
            }
        }
    }

    drawText(text, x, y, color) {
        const charWidth = 6; // 5px wide + 1px spacing
        for (let i = 0; i < text.length; i++) {
            const ch = text[i].toUpperCase();
            const glyph = FONT[ch];
            if (glyph) {
                this.drawSprite(glyph, x + i * charWidth, y, color);
            }
        }
    }

    measureText(text) {
        return text.length * 6;
    }

    drawCenteredText(text, y, color) {
        const width = this.measureText(text);
        const x = Math.floor((CONFIG.LOGICAL_WIDTH - width) / 2);
        this.drawText(text, x, y, color);
    }

    drawMushrooms(mushrooms) {
        for (let col = 0; col < CONFIG.GRID_COLS; col++) {
            for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
                const m = mushrooms[col][row];
                if (m && m.alive) {
                    const spriteKey = m.poisoned
                        ? 'MUSHROOM_POISON_' + m.hits
                        : 'MUSHROOM_' + m.hits;
                    const color = m.poisoned ? CONFIG.COLOR_MUSHROOM_POISON : CONFIG.COLOR_MUSHROOM;
                    this.drawSprite(SPRITES[spriteKey], col * CONFIG.TILE_SIZE, row * CONFIG.TILE_SIZE, color);
                }
            }
        }
    }

    drawCentipede(segments) {
        for (const seg of segments) {
            if (!seg.alive) continue;
            const sprite = seg.isHead
                ? (seg.frame ? SPRITES.CENTIPEDE_HEAD_ALT : SPRITES.CENTIPEDE_HEAD)
                : (seg.frame ? SPRITES.CENTIPEDE_BODY_ALT : SPRITES.CENTIPEDE_BODY);
            const color = seg.isHead ? CONFIG.COLOR_CENTIPEDE_HEAD : CONFIG.COLOR_CENTIPEDE_BODY;
            this.drawSprite(sprite, seg.x, seg.y, color);
        }
    }

    drawSpider(spider) {
        if (!spider || !spider.alive) return;
        const sprite = spider.frame ? SPRITES.SPIDER_ALT : SPRITES.SPIDER;
        this.drawSprite(sprite, spider.x, spider.y, CONFIG.COLOR_SPIDER);
    }

    drawFlea(flea) {
        if (!flea || !flea.alive) return;
        const sprite = flea.frame ? SPRITES.FLEA_ALT : SPRITES.FLEA;
        this.drawSprite(sprite, flea.x, flea.y, CONFIG.COLOR_FLEA);
    }

    drawScorpion(scorpion) {
        if (!scorpion || !scorpion.alive) return;
        const sprite = scorpion.frame ? SPRITES.SCORPION_ALT : SPRITES.SCORPION;
        this.drawSprite(sprite, scorpion.x, scorpion.y, CONFIG.COLOR_SCORPION);
    }

    drawPlayer(player) {
        if (!player) return;
        if (player.exploding) {
            const sprite = player.explodeFrame % 2 === 0
                ? SPRITES.PLAYER_EXPLODE_1
                : SPRITES.PLAYER_EXPLODE_2;
            this.drawSprite(sprite, player.x, player.y, CONFIG.COLOR_PLAYER);
        } else if (player.alive) {
            this.drawSprite(SPRITES.PLAYER, player.x, player.y, CONFIG.COLOR_PLAYER);
        }
    }

    drawBullet(bullet) {
        if (!bullet || !bullet.alive) return;
        this.drawSprite(SPRITES.BULLET, bullet.x, bullet.y, CONFIG.COLOR_BULLET);
    }

    drawHUD(score, highScore, lives, wave) {
        // Score on top-left
        this.drawText(String(score).padStart(6, '0'), 2, 1, CONFIG.COLOR_SCORE);
        // High score centered
        this.drawCenteredText('HIGH ' + String(highScore).padStart(6, '0'), 1, CONFIG.COLOR_TEXT);
        // Draw remaining lives as small player icons at bottom-left
        for (let i = 0; i < lives - 1; i++) {
            this.drawSprite(SPRITES.PLAYER, 2 + i * 10, CONFIG.LOGICAL_HEIGHT - 9, CONFIG.COLOR_PLAYER);
        }
    }

    drawScorePopups(popups) {
        for (const popup of popups) {
            this.drawText(String(popup.score), popup.x, popup.y, CONFIG.COLOR_TEXT);
        }
    }

    drawAttractScreen(timer) {
        this.clear();

        // High score at top
        this.drawCenteredText('HIGH ' + String(parseInt(localStorage.getItem('centipedeHighScore')) || 0).padStart(6, '0'), 1, CONFIG.COLOR_TEXT);

        // Title
        this.drawCenteredText('CENTIPEDE', 30, CONFIG.COLOR_CENTIPEDE_HEAD);

        // Credits
        this.drawCenteredText('© 1980 ATARI', 45, CONFIG.COLOR_TEXT);

        // Draw some decorative mushrooms
        const decorativeCols = [3, 7, 11, 15, 19, 23, 27];
        const decorativeRows = [9, 10, 11];
        for (const col of decorativeCols) {
            for (const row of decorativeRows) {
                if ((col + row) % 3 === 0) {
                    this.drawSprite(SPRITES.MUSHROOM_0, col * CONFIG.TILE_SIZE, row * CONFIG.TILE_SIZE, CONFIG.COLOR_MUSHROOM);
                }
            }
        }

        // Score table
        this.drawCenteredText('SCORE TABLE', 100, CONFIG.COLOR_TEXT);

        // Enemy entries with sprites
        const tableX = 50;
        const valX = 140;

        // Head
        this.drawSprite(SPRITES.CENTIPEDE_HEAD, tableX, 115, CONFIG.COLOR_CENTIPEDE_HEAD);
        this.drawText('HEAD', tableX + 12, 115, CONFIG.COLOR_CENTIPEDE_HEAD);
        this.drawText('100', valX, 115, CONFIG.COLOR_TEXT);

        // Body
        this.drawSprite(SPRITES.CENTIPEDE_BODY, tableX, 127, CONFIG.COLOR_CENTIPEDE_BODY);
        this.drawText('BODY', tableX + 12, 127, CONFIG.COLOR_CENTIPEDE_BODY);
        this.drawText('10', valX, 127, CONFIG.COLOR_TEXT);

        // Spider
        this.drawSprite(SPRITES.SPIDER, tableX, 139, CONFIG.COLOR_SPIDER);
        this.drawText('SPIDER', tableX + 12, 139, CONFIG.COLOR_SPIDER);
        this.drawText('300-900', valX, 139, CONFIG.COLOR_TEXT);

        // Flea
        this.drawSprite(SPRITES.FLEA, tableX, 151, CONFIG.COLOR_FLEA);
        this.drawText('FLEA', tableX + 12, 151, CONFIG.COLOR_FLEA);
        this.drawText('200', valX, 151, CONFIG.COLOR_TEXT);

        // Scorpion
        this.drawSprite(SPRITES.SCORPION, tableX, 163, CONFIG.COLOR_SCORPION);
        this.drawText('SCORPION', tableX + 12, 163, CONFIG.COLOR_SCORPION);
        this.drawText('1000', valX, 163, CONFIG.COLOR_TEXT);

        // Controls
        this.drawCenteredText('ARROWS OR WASD  MOVE', 185, CONFIG.COLOR_PLAYER);
        this.drawCenteredText('SPACE  FIRE', 197, CONFIG.COLOR_PLAYER);

        // Blinking "PRESS ENTER TO START"
        if (Math.floor(timer / 500) % 2 === 0) {
            this.drawCenteredText('PRESS ENTER TO START', 215, CONFIG.COLOR_TEXT);
        }
    }

    drawGameOver(score, highScore) {
        this.drawCenteredText('GAME OVER', 110, CONFIG.COLOR_CENTIPEDE_HEAD);
        this.drawCenteredText('SCORE ' + String(score).padStart(6, '0'), 130, CONFIG.COLOR_TEXT);
    }
}

// ============================================================================
// SECTION 9: Game State Machine
// ============================================================================

class Game {
    constructor() {
        this.state = 'attract';
        this.player = null;
        this.bullet = null;
        this.centipede = [];
        this.spider = null;
        this.flea = null;
        this.scorpion = null;
        this.mushrooms = [];
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('centipedeHighScore')) || 0;
        this.lives = CONFIG.STARTING_LIVES;
        this.wave = 1;
        this.waveInCycle = 1;
        this.scorePopups = [];
        this.deathTimer = 0;
        this.waveTimer = 0;
        this.gameOverTimer = 0;
        this.attractTimer = 0;
        this.spiderTimer = 0;
        this.spiderDelay = CONFIG.SPIDER_SPAWN_DELAY;
        this.nextLifeScore = CONFIG.EXTRA_LIFE_SCORE;
        this.fleaActive = false;
        this.scorpionActive = false;
    }

    initMushrooms() {
        this.mushrooms = [];
        for (let col = 0; col < CONFIG.GRID_COLS; col++) {
            this.mushrooms[col] = [];
            for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
                this.mushrooms[col][row] = null;
            }
        }
        let placed = 0;
        while (placed < CONFIG.INITIAL_MUSHROOM_COUNT) {
            const col = MathUtils.randomInt(0, CONFIG.GRID_COLS - 1);
            const row = MathUtils.randomInt(1, 25);
            if (!this.mushrooms[col][row]) {
                this.mushrooms[col][row] = { hits: 0, poisoned: false, alive: true };
                placed++;
            }
        }
    }

    spawnCentipede() {
        this.centipede = [];
        const chainLength = Math.max(0, CONFIG.CENTIPEDE_SEGMENTS - (this.waveInCycle - 1));
        const independentHeads = this.waveInCycle - 1;

        // Spawn chain from top-right, moving left
        if (chainLength > 0) {
            for (let i = 0; i < chainLength; i++) {
                const isHead = (i === 0);
                this.centipede.push(new CentipedeSegment(
                    CONFIG.GRID_COLS - 1 - i, 0, isHead, -1
                ));
            }
        }

        // Spawn independent heads from top, spaced apart
        for (let i = 0; i < independentHeads; i++) {
            const col = MathUtils.randomInt(0, CONFIG.GRID_COLS - 1);
            const dir = Math.random() < 0.5 ? 1 : -1;
            this.centipede.push(new CentipedeSegment(col, 0, true, dir));
        }
    }

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.lives = CONFIG.STARTING_LIVES;
        this.wave = 1;
        this.waveInCycle = 1;
        this.nextLifeScore = CONFIG.EXTRA_LIFE_SCORE;
        this.player = new Player();
        this.bullet = null;
        this.spider = null;
        this.flea = null;
        this.scorpion = null;
        this.scorePopups = [];
        this.spiderTimer = 0;
        this.spiderDelay = CONFIG.SPIDER_SPAWN_DELAY;
        this.initMushrooms();
        this.spawnCentipede();
    }

    addScore(points, x, y) {
        this.score += points;
        // Score popup for significant points
        if (points > 1) {
            this.scorePopups.push({ score: points, x: x, y: y, timer: 0 });
        }
        // Extra life check
        if (this.score >= this.nextLifeScore) {
            this.lives = Math.min(this.lives + 1, CONFIG.MAX_LIVES);
            this.nextLifeScore += CONFIG.EXTRA_LIFE_SCORE;
        }
        // High score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('centipedeHighScore', this.highScore);
        }
    }

    restoreMushrooms() {
        let restoredCount = 0;
        for (let col = 0; col < CONFIG.GRID_COLS; col++) {
            for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
                const m = this.mushrooms[col][row];
                if (m) {
                    if (m.hits > 0 || m.poisoned || !m.alive) {
                        if (!m.alive) {
                            m.alive = true;
                        }
                        m.hits = 0;
                        m.poisoned = false;
                        restoredCount++;
                    }
                }
            }
        }
        this.score += restoredCount * CONFIG.MUSHROOM_RESTORE_SCORE;
    }

    countBottomMushrooms() {
        let count = 0;
        const topRow = Math.floor(CONFIG.PLAYER_AREA_TOP / CONFIG.TILE_SIZE);
        for (let col = 0; col < CONFIG.GRID_COLS; col++) {
            for (let row = topRow; row < CONFIG.GRID_ROWS; row++) {
                if (this.mushrooms[col][row] && this.mushrooms[col][row].alive) {
                    count++;
                }
            }
        }
        return count;
    }

    update(input, sound, dt) {
        switch (this.state) {
            case 'attract':
                this.attractTimer += dt;
                if (input.isStart()) {
                    sound.init();
                    this.startGame();
                }
                break;

            case 'playing':
                this.updatePlaying(input, sound, dt);
                break;

            case 'playerDeath':
                this.deathTimer += dt;
                this.player.updateDeath(dt);
                if (this.deathTimer >= CONFIG.PLAYER_DEATH_DURATION) {
                    if (this.lives <= 0) {
                        this.state = 'gameOver';
                        this.gameOverTimer = 0;
                    } else {
                        this.player = new Player();
                        this.bullet = null;
                        this.spider = null;
                        this.flea = null;
                        this.scorpion = null;
                        this.state = 'playing';
                    }
                }
                break;

            case 'waveComplete':
                this.waveTimer += dt;
                if (this.waveTimer >= CONFIG.WAVE_START_DELAY) {
                    this.wave++;
                    this.waveInCycle = ((this.wave - 1) % 12) + 1;
                    this.spider = null;
                    this.flea = null;
                    this.scorpion = null;
                    this.spiderTimer = 0;
                    this.restoreMushrooms();
                    this.spawnCentipede();
                    this.state = 'playing';
                }
                break;

            case 'gameOver':
                this.gameOverTimer += dt;
                if (this.gameOverTimer >= CONFIG.GAME_OVER_DURATION) {
                    this.state = 'attract';
                    this.attractTimer = 0;
                }
                break;
        }

        // Update score popups always
        for (const popup of this.scorePopups) {
            popup.timer += dt;
            popup.y -= 0.5;
        }
        this.scorePopups = this.scorePopups.filter(p => p.timer < 1000);
    }

    updatePlaying(input, sound, dt) {
        // 1. Update player
        this.player.update(input, this.mushrooms);

        // 2. Fire bullet
        if (input.isFire() && !this.bullet) {
            this.bullet = new Bullet(
                this.player.x + CONFIG.PLAYER_WIDTH / 2,
                this.player.y
            );
            sound.playerFire();
        }

        // 3. Update bullet
        if (this.bullet) {
            this.bullet.update();
            if (!this.bullet.alive) this.bullet = null;
        }

        // 4. Update centipede segments
        for (const seg of this.centipede) {
            if (seg.alive) seg.update(this.mushrooms, this.score);
        }

        // 5. Spider spawning and update
        this.spiderTimer++;
        if (!this.spider && this.spiderTimer >= this.spiderDelay) {
            const side = Math.random() < 0.5 ? 'left' : 'right';
            this.spider = new Spider(side);
            this.spiderTimer = 0;
            this.spiderDelay = CONFIG.SPIDER_RESPAWN_DELAY;
        }
        if (this.spider) {
            this.spider.update(this.score);
            if (!this.spider.alive) {
                this.spider = null;
            }
            if (this.spider) {
                CollisionSystem.checkSpiderVsMushrooms(this.spider, this.mushrooms);
            }
        }

        // 6. Flea spawning and update
        if (!this.flea && !this.scorpion && this.waveInCycle > 1) {
            if (this.countBottomMushrooms() < CONFIG.FLEA_MIN_MUSHROOMS) {
                const col = MathUtils.randomInt(0, CONFIG.GRID_COLS - 1);
                this.flea = new Flea(col);
                sound.fleaDrop();
            }
        }
        if (this.flea) {
            this.flea.update(this.mushrooms);
            if (!this.flea.alive) this.flea = null;
        }

        // 7. Scorpion spawning
        if (!this.scorpion && !this.flea && this.waveInCycle > 1 && Math.random() < 0.001) {
            const side = Math.random() < 0.5 ? 'left' : 'right';
            const row = MathUtils.randomInt(2, 15);
            this.scorpion = new Scorpion(side, row);
        }
        if (this.scorpion) {
            this.scorpion.update(this.mushrooms);
            if (!this.scorpion.alive) this.scorpion = null;
        }

        // 8. Bullet collisions
        if (this.bullet) {
            // vs centipede
            const centResult = CollisionSystem.checkBulletVsCentipede(this.bullet, this.centipede, this.mushrooms);
            if (centResult.hit) {
                this.addScore(centResult.score, centResult.segment.x, centResult.segment.y);
                sound.segmentHit();
                this.bullet = null;
            }

            // vs spider
            if (this.bullet && this.spider) {
                const spiderResult = CollisionSystem.checkBulletVsSpider(this.bullet, this.spider);
                if (spiderResult.hit) {
                    this.addScore(spiderResult.score, this.spider.x, this.spider.y);
                    this.spider = null;
                    this.bullet = null;
                }
            }

            // vs flea
            if (this.bullet && this.flea) {
                const fleaResult = CollisionSystem.checkBulletVsFlea(this.bullet, this.flea);
                if (fleaResult.hit) {
                    if (fleaResult.killed) {
                        this.addScore(fleaResult.score, this.flea.x, this.flea.y);
                        this.flea = null;
                    }
                    this.bullet = null;
                }
            }

            // vs scorpion
            if (this.bullet && this.scorpion) {
                const scorpResult = CollisionSystem.checkBulletVsScorpion(this.bullet, this.scorpion);
                if (scorpResult.hit) {
                    this.addScore(scorpResult.score, this.scorpion.x, this.scorpion.y);
                    this.scorpion = null;
                    this.bullet = null;
                }
            }

            // vs mushrooms
            if (this.bullet) {
                const mushResult = CollisionSystem.checkBulletVsMushroom(this.bullet, this.mushrooms);
                if (mushResult.hit) {
                    this.addScore(mushResult.score, this.bullet.x, this.bullet.y);
                    sound.mushroomHit();
                    this.bullet = null;
                }
            }
        }

        // 9. Enemy vs player collisions
        if (this.player.alive) {
            let playerKilled = false;

            if (this.spider && CollisionSystem.checkSpiderVsPlayer(this.spider, this.player)) {
                playerKilled = true;
            }

            if (!playerKilled && CollisionSystem.checkCentipedeVsPlayer(this.centipede, this.player)) {
                playerKilled = true;
            }

            if (!playerKilled && this.flea && CollisionSystem.checkFleaVsPlayer(this.flea, this.player)) {
                playerKilled = true;
            }

            if (playerKilled) {
                this.player.die();
                this.lives--;
                this.bullet = null;
                this.deathTimer = 0;
                this.state = 'playerDeath';
                sound.playerDeath();
            }
        }

        // 10. Check wave complete
        const aliveSegments = this.centipede.filter(s => s.alive);
        if (aliveSegments.length === 0) {
            this.state = 'waveComplete';
            this.waveTimer = 0;
            sound.waveComplete();
        }

        // Centipede movement sound
        if (this.centipede.some(s => s.alive)) {
            sound.centipedeMove();
        }
    }

    getState() {
        return {
            state: this.state,
            player: this.player,
            bullet: this.bullet,
            centipede: this.centipede,
            spider: this.spider,
            flea: this.flea,
            scorpion: this.scorpion,
            mushrooms: this.mushrooms,
            score: this.score,
            highScore: this.highScore,
            lives: this.lives,
            wave: this.wave,
            waveInCycle: this.waveInCycle,
            scorePopups: this.scorePopups,
            deathTimer: this.deathTimer,
            waveTimer: this.waveTimer,
            gameOverTimer: this.gameOverTimer,
            attractTimer: this.attractTimer,
        };
    }
}

// ============================================================================
// SECTION 10: Main Loop
// ============================================================================

(function main() {
    const canvas = document.getElementById('gameCanvas');
    const renderer = new Renderer(canvas);
    const input = new InputHandler();
    const sound = new SoundEngine();
    const game = new Game();

    let lastTime = performance.now();
    let accumulator = 0;

    function gameLoop(currentTime) {
        const dt = Math.min(currentTime - lastTime, CONFIG.MAX_DELTA);
        lastTime = currentTime;
        accumulator += dt;

        while (accumulator >= CONFIG.FRAME_TIME) {
            input.update();
            game.update(input, sound, CONFIG.FRAME_TIME);
            accumulator -= CONFIG.FRAME_TIME;
        }

        // Render
        const gs = game.getState();
        renderer.clear();

        switch (gs.state) {
            case 'attract':
                renderer.drawAttractScreen(gs.attractTimer);
                break;

            case 'playing':
            case 'playerDeath':
            case 'waveComplete':
                renderer.drawMushrooms(gs.mushrooms);
                renderer.drawCentipede(gs.centipede);
                if (gs.spider) renderer.drawSpider(gs.spider);
                if (gs.flea) renderer.drawFlea(gs.flea);
                if (gs.scorpion) renderer.drawScorpion(gs.scorpion);
                if (gs.bullet) renderer.drawBullet(gs.bullet);
                renderer.drawPlayer(gs.player);
                renderer.drawHUD(gs.score, gs.highScore, gs.lives, gs.wave);
                renderer.drawScorePopups(gs.scorePopups);
                break;

            case 'gameOver':
                renderer.drawMushrooms(gs.mushrooms);
                renderer.drawHUD(gs.score, gs.highScore, gs.lives, gs.wave);
                renderer.drawGameOver(gs.score, gs.highScore);
                break;
        }

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
})();
