'use strict';

// ============================================================================
// SECTION 1: CONFIG
// ============================================================================

const CONFIG = Object.freeze({
    // Display
    LOGICAL_WIDTH: 224,
    LOGICAL_HEIGHT: 256,
    SCALE: 3,
    WIDTH: 672,
    HEIGHT: 768,

    // Player
    PLAYER_SPEED: 1.5,
    PLAYER_Y: 232,
    PLAYER_WIDTH: 16,
    PLAYER_HEIGHT: 16,
    PLAYER_FIRE_COOLDOWN: 0,

    // Player Bullet
    BULLET_SPEED: 4,
    BULLET_WIDTH: 2,
    BULLET_HEIGHT: 6,

    // Alien Formation
    FORMATION_ROWS: 6,
    FORMATION_COLS: 10,
    FORMATION_SPACING_X: 18,
    FORMATION_SPACING_Y: 18,
    FORMATION_START_X: 32,
    FORMATION_START_Y: 56,
    FORMATION_SWAY_SPEED: 0.3,
    FORMATION_SWAY_RANGE: 12,

    FLAGSHIP_ROW: 0,
    RED_ROW: 1,
    PURPLE_ROW: 2,
    BLUE_ROW_START: 3,
    BLUE_ROW_END: 5,

    // Alien types
    TYPE_FLAGSHIP: 0,
    TYPE_RED: 1,
    TYPE_PURPLE: 2,
    TYPE_BLUE: 3,

    // Scoring
    SCORE_IN_FORMATION: [60, 50, 40, 30],
    SCORE_DIVING: [300, 100, 80, 60],
    SCORE_FLAGSHIP_1ESCORT: 200,
    SCORE_FLAGSHIP_2ESCORT: 800,

    // Dive AI
    MAX_DIVERS: 4,
    DIVE_SPEED: 0.4,
    DIVE_INTERVAL_BASE: 2500,
    DIVE_INTERVAL_MIN: 800,
    CONVOY_INTERVAL: 5000,
    ALIEN_BULLET_SPEED: 2,
    MAX_ALIEN_BULLETS: 3,
    SWARM_THRESHOLD: 5,

    // Alien animation
    ALIEN_ANIM_INTERVAL: 500,

    // Enemy bullet
    ENEMY_BULLET_WIDTH: 2,
    ENEMY_BULLET_HEIGHT: 6,

    // Explosions
    EXPLOSION_DURATION: 300,
    EXPLOSION_FRAMES: 3,

    // Returning
    RETURN_SPEED: 0.6,

    // Stars
    STAR_COUNT: 60,
    STAR_SCROLL_SPEED: 0.5,

    // Game rules
    STARTING_LIVES: 3,
    EXTRA_LIFE_SCORE: 7000,
    WAVE_START_DELAY: 2000,
    GAME_OVER_DURATION: 3000,
    RESPAWN_DELAY: 1500,

    // Colors
    COLOR_BLUE_ALIEN: '#00CCFF',
    COLOR_BLUE_ALIEN_DARK: '#0066CC',
    COLOR_PURPLE_ALIEN: '#CC00CC',
    COLOR_PURPLE_ALIEN_DARK: '#660099',
    COLOR_RED_ALIEN: '#FF0000',
    COLOR_RED_ALIEN_DARK: '#CC0000',
    COLOR_FLAGSHIP: '#FFFF00',
    COLOR_FLAGSHIP_ACCENT: '#00CC00',
    COLOR_PLAYER: '#FFFFFF',
    COLOR_PLAYER_BLUE: '#00CCFF',
    COLOR_PLAYER_RED: '#FF0000',
    COLOR_BULLET: '#FFFFFF',
    COLOR_ENEMY_BULLET: '#FFFF00',
    COLOR_EXPLOSION_1: '#FFFFFF',
    COLOR_EXPLOSION_2: '#FFFF00',
    COLOR_EXPLOSION_3: '#FF0000',
    COLOR_TEXT: '#FFFFFF',
    COLOR_HUD_RED: '#FF0000',
    COLOR_HUD_YELLOW: '#FFFF00',
    COLOR_HUD_CYAN: '#00CCFF',

    // Timing
    FPS: 60,
    FRAME_TIME: 1000 / 60,
    MAX_DELTA: 200,
});

// ============================================================================
// SECTION 2: MATH UTILITIES
// ============================================================================

const MathUtils = {
    clamp(val, min, max) {
        return val < min ? min : val > max ? max : val;
    },

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    },

    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    angleTo(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    bezierPoint(t, p0, p1, p2, p3) {
        const u = 1 - t;
        return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
    },
};

// ============================================================================
// SECTION 3: SPRITE / SHAPE DATA
// ============================================================================

const SPRITES = {};

// --- Blue Alien Frame 0 (wings spread) ---
// Compact insect/butterfly shape, simplest alien type
SPRITES.BLUE_0 = [
    [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,2,1,1,2,1,1,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,1,2,1,1,2,2,1,1,2,1,0,0,0],
    [0,0,1,1,0,0,1,1,1,1,0,0,1,1,0,0],
    [0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0],
    [1,1,0,0,0,0,1,1,1,1,0,0,0,0,1,1],
    [0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,1,1,0,1,0,0,0,0,0],
    [0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// --- Blue Alien Frame 1 (wings tucked) ---
SPRITES.BLUE_1 = [
    [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,2,1,1,2,1,1,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,0,1,2,1,2,2,1,2,1,0,0,0,0],
    [0,0,0,1,1,0,1,1,1,1,0,1,1,0,0,0],
    [0,0,0,1,0,0,0,1,1,0,0,0,1,0,0,0],
    [0,0,1,1,0,0,1,1,1,1,0,0,1,1,0,0],
    [0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,1,1,0,1,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// --- Purple Alien Frame 0 (wings spread, angular horns) ---
SPRITES.PURPLE_0 = [
    [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,1,2,1,1,2,2,1,1,2,1,0,0,0],
    [0,0,1,1,1,1,2,1,1,2,1,1,1,1,0,0],
    [0,1,2,0,1,1,1,1,1,1,1,1,0,2,1,0],
    [1,1,0,0,0,1,1,2,2,1,1,0,0,0,1,1],
    [1,0,0,0,0,0,1,1,1,1,0,0,0,0,0,1],
    [0,0,0,0,0,1,2,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,1,1,0,1,1,0,1,1,0,0,0,0],
    [0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0],
    [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// --- Purple Alien Frame 1 (wings tucked) ---
SPRITES.PURPLE_1 = [
    [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,0,1,2,1,2,2,1,2,1,0,0,0,0],
    [0,0,0,1,1,1,2,1,1,2,1,1,1,0,0,0],
    [0,0,1,2,1,1,1,1,1,1,1,1,2,1,0,0],
    [0,0,1,0,0,1,1,2,2,1,1,0,0,1,0,0],
    [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,1,1,0,1,1,0,1,1,0,0,0,0],
    [0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0],
    [0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// --- Red Escort Alien Frame 0 (wings spread, cyan accents on tips) ---
SPRITES.RED_0 = [
    [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,2,1,1,2,1,1,1,0,0,0],
    [0,0,1,1,2,1,1,1,1,1,1,2,1,1,0,0],
    [0,2,1,0,0,1,1,1,1,1,1,0,0,1,2,0],
    [2,1,0,0,0,0,1,1,1,1,0,0,0,0,1,2],
    [2,0,0,0,0,1,1,1,1,1,1,0,0,0,0,2],
    [0,0,0,0,1,1,0,1,1,0,1,1,0,0,0,0],
    [0,0,0,1,1,0,0,1,1,0,0,1,1,0,0,0],
    [0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0],
    [0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// --- Red Escort Alien Frame 1 (wings tucked) ---
SPRITES.RED_1 = [
    [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,0,1,1,2,1,1,2,1,1,0,0,0,0],
    [0,0,0,1,2,1,1,1,1,1,1,2,1,0,0,0],
    [0,0,2,1,0,1,1,1,1,1,1,0,1,2,0,0],
    [0,0,2,0,0,0,1,1,1,1,0,0,0,2,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,0,1,1,0,1,1,0,0,0,0],
    [0,0,0,0,1,0,0,1,1,0,0,1,0,0,0,0],
    [0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0],
    [0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// --- Flagship Frame 0 (wings spread, 3-color: yellow+green+red) ---
SPRITES.FLAGSHIP_0 = [
    [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,1,2,1,2,2,1,2,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,3,1,2,1,2,1,1,2,1,2,1,3,0,0],
    [0,3,1,0,0,1,1,1,1,1,1,0,0,1,3,0],
    [3,1,0,0,0,1,2,1,1,2,1,0,0,0,1,3],
    [3,0,0,0,0,0,1,1,1,1,0,0,0,0,0,3],
    [0,0,0,0,0,1,1,2,2,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,0,1,1,0,1,1,0,0,0,0],
    [0,0,0,1,1,0,0,1,1,0,0,1,1,0,0,0],
    [0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0],
    [0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0],
    [1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// --- Flagship Frame 1 (wings tucked) ---
SPRITES.FLAGSHIP_1 = [
    [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,1,2,1,2,2,1,2,1,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,3,2,1,2,1,1,2,1,2,3,0,0,0],
    [0,0,3,1,0,1,1,1,1,1,1,0,1,3,0,0],
    [0,0,3,0,0,1,2,1,1,2,1,0,0,3,0,0],
    [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,2,2,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,0,1,1,0,1,1,0,0,0,0],
    [0,0,0,1,1,0,0,1,1,0,0,1,1,0,0,0],
    [0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0],
    [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// --- Player Ship (Galaxip) — white hull, blue sides, red center ---
SPRITES.PLAYER = [
    [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,3,3,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,3,3,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,0,1,1,3,3,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,0,1,1,1,3,3,1,1,1,0,0,0,0],
    [0,0,0,1,2,1,1,1,1,1,1,2,1,0,0,0],
    [0,0,0,1,2,1,1,3,3,1,1,2,1,0,0,0],
    [0,0,1,2,2,1,1,1,1,1,1,2,2,1,0,0],
    [0,0,1,2,1,1,1,1,1,1,1,1,2,1,0,0],
    [0,1,2,2,1,1,1,1,1,1,1,1,2,2,1,0],
    [0,1,2,1,1,1,1,1,1,1,1,1,1,2,1,0],
    [1,1,2,0,0,1,1,0,0,1,1,0,0,2,1,1],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// --- Player Explosion Frame 0 (initial burst) ---
SPRITES.PLAYER_EXPLODE_0 = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,0,0,2,1,1,2,0,0,0,0,0,0],
    [0,0,0,0,1,2,1,3,3,1,2,1,0,0,0,0],
    [0,0,0,0,0,1,3,1,1,3,1,0,0,0,0,0],
    [0,0,0,1,2,3,1,2,2,1,3,2,1,0,0,0],
    [0,0,0,0,1,1,2,1,1,2,1,1,0,0,0,0],
    [0,0,0,1,2,3,1,2,2,1,3,2,1,0,0,0],
    [0,0,0,0,0,1,3,1,1,3,1,0,0,0,0,0],
    [0,0,0,0,1,2,1,3,3,1,2,1,0,0,0,0],
    [0,0,0,0,0,0,2,1,1,2,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// --- Player Explosion Frame 1 (expanding debris) ---
SPRITES.PLAYER_EXPLODE_1 = [
    [0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0],
    [0,0,0,0,0,2,0,0,1,0,0,0,0,3,0,0],
    [0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0],
    [0,0,1,0,0,3,0,0,0,0,2,0,0,0,0,0],
    [0,0,0,0,2,0,0,3,3,0,0,1,0,0,0,0],
    [0,0,0,3,0,0,2,0,0,1,0,0,3,0,0,0],
    [0,3,0,0,0,0,0,1,2,0,0,0,0,0,2,0],
    [0,0,0,0,1,0,3,0,0,3,0,2,0,0,0,0],
    [0,0,0,2,0,0,0,2,3,0,0,0,1,0,0,0],
    [0,0,0,0,0,3,0,0,0,0,3,0,0,0,0,0],
    [0,0,1,0,0,0,0,1,0,2,0,0,0,1,0,0],
    [0,0,0,0,2,0,0,0,0,0,0,3,0,0,0,0],
    [0,0,0,0,0,0,3,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// --- Alien Explosion Frame 0 (small burst) ---
SPRITES.EXPLOSION_0 = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,1,2,1,1,1,1,2,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,0,0,1,2,1,1,1,1,2,1,0,0,0,0],
    [0,0,0,0,0,1,2,1,1,2,1,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// --- Alien Explosion Frame 1 (medium expansion) ---
SPRITES.EXPLOSION_1 = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0],
    [0,0,0,0,1,0,2,1,1,2,0,1,0,0,0,0],
    [0,0,0,0,0,2,1,1,1,1,2,0,0,0,0,0],
    [0,0,0,1,2,1,3,1,1,3,1,2,1,0,0,0],
    [0,0,1,0,1,3,1,2,2,1,3,1,0,1,0,0],
    [0,0,0,2,1,1,2,1,1,2,1,1,2,0,0,0],
    [0,0,0,2,1,1,2,1,1,2,1,1,2,0,0,0],
    [0,0,1,0,1,3,1,2,2,1,3,1,0,1,0,0],
    [0,0,0,1,2,1,3,1,1,3,1,2,1,0,0,0],
    [0,0,0,0,0,2,1,1,1,1,2,0,0,0,0,0],
    [0,0,0,0,1,0,2,1,1,2,0,1,0,0,0,0],
    [0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// --- Alien Explosion Frame 2 (dissipating fragments) ---
SPRITES.EXPLOSION_2 = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,3,0,0,0,0,0,0,0,0,3,0,0,0],
    [0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,2,0,0,0,0,3,0,0,0,0,0],
    [0,0,0,0,0,0,0,3,2,0,0,0,0,0,0,0],
    [0,0,2,0,0,0,3,0,0,2,0,0,0,3,0,0],
    [0,0,0,0,3,0,0,0,0,0,0,2,0,0,0,0],
    [0,3,0,0,0,0,2,0,0,3,0,0,0,0,2,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,2,0,0,0,0,3,0,0,2,0,0,0,0,3,0],
    [0,0,0,0,2,0,0,0,0,0,0,3,0,0,0,0],
    [0,0,3,0,0,0,2,0,0,3,0,0,0,2,0,0],
    [0,0,0,0,0,3,0,0,0,0,2,0,0,0,0,0],
    [0,0,0,0,0,0,0,3,2,0,0,0,0,0,0,0],
    [0,0,0,2,0,0,0,0,0,0,0,0,2,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// --- Wave Flag Icon (8x8) ---
SPRITES.FLAG_ICON = [
    [1,1,1,1,1,0,0,0],
    [1,1,1,1,0,0,0,0],
    [1,1,1,0,0,0,0,0],
    [1,1,1,1,0,0,0,0],
    [1,1,1,1,1,0,0,0],
    [1,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,0],
];

// --- Bitmap Font (5x7 glyphs) ---
SPRITES.FONT = {
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
        [1,1,1,1,1],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [1,1,1,1,1],
    ],
    'J': [
        [0,0,1,1,1],
        [0,0,0,0,1],
        [0,0,0,0,1],
        [0,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,1,1,0],
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
        [1,0,1,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
    ],
    'N': [
        [1,0,0,0,1],
        [1,1,0,0,1],
        [1,0,1,0,1],
        [1,0,1,0,1],
        [1,0,0,1,1],
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
        [1,0,1,0,1],
        [1,0,1,0,1],
        [1,1,0,1,1],
        [1,0,0,0,1],
    ],
    'X': [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,0,1,0],
        [0,0,1,0,0],
        [0,1,0,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
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
    '-': [
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [1,1,1,1,1],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
    ],
    ':': [
        [0,0,0,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,0,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
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
    '.': [
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,1,0,0],
    ],
    '/': [
        [0,0,0,0,1],
        [0,0,0,0,1],
        [0,0,0,1,0],
        [0,0,1,0,0],
        [0,1,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
    ],
    ',': [
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,1,0,0],
        [0,1,0,0,0],
    ],
};

// ============================================================================
// SECTION 5: INPUT HANDLER
// ============================================================================

class InputHandler {
    constructor() {
        this._keys = {};
        this._keyDownBuffer = new Set();

        this._onKeyDown = (e) => {
            const key = e.key;
            this._keys[key] = true;
            this._keyDownBuffer.add(key);
            if (key === ' ' || key === 'ArrowLeft' || key === 'ArrowRight' ||
                key === 'ArrowUp' || key === 'ArrowDown') {
                e.preventDefault();
            }
        };

        this._onKeyUp = (e) => {
            this._keys[e.key] = false;
        };

        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
    }

    isLeft() {
        return !!(this._keys['ArrowLeft'] || this._keys['a'] || this._keys['A']);
    }

    isRight() {
        return !!(this._keys['ArrowRight'] || this._keys['d'] || this._keys['D']);
    }

    isFire() {
        return this._keyDownBuffer.has(' ');
    }

    isStart() {
        return this._keyDownBuffer.has('Enter');
    }

    update() {
        this._keyDownBuffer.clear();
    }
}
// ============================================================================
// SECTION 4: Sound Engine
// ============================================================================

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.droneOsc = null;
        this.droneOsc2 = null;
        this.droneLfo = null;
        this.droneGain = null;
        this.swoopOsc = null;
        this.swoopGain = null;
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

    _createNoiseBuffer(duration) {
        const sampleRate = this.ctx.sampleRate;
        const length = Math.floor(sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    shoot() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Short chirp — square wave with fast descending pitch
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
    }

    enemyHit() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Noise burst — characteristic splat
        const noise = this.ctx.createBufferSource();
        noise.buffer = this._createNoiseBuffer(0.15);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.linearRampToValueAtTime(150, now + 0.15);
        filter.Q.setValueAtTime(3, now);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, now);
        noiseGain.gain.linearRampToValueAtTime(0, now + 0.15);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(now);
        noise.stop(now + 0.15);

        // Descending tone blip
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    flagshipHit() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Deeper, longer explosion — noise burst
        const noise = this.ctx.createBufferSource();
        noise.buffer = this._createNoiseBuffer(0.35);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.linearRampToValueAtTime(60, now + 0.35);
        filter.Q.setValueAtTime(1.5, now);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.25, now);
        noiseGain.gain.linearRampToValueAtTime(0, now + 0.35);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(now);
        noise.stop(now + 0.35);

        // Two descending tones for richer explosion
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(400, now);
        osc1.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        gain1.gain.setValueAtTime(0.12, now);
        gain1.gain.linearRampToValueAtTime(0, now + 0.3);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.3);

        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(200, now + 0.05);
        osc2.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.setValueAtTime(0.08, now + 0.05);
        gain2.gain.linearRampToValueAtTime(0, now + 0.3);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.3);
    }

    playerDeath() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Long descending noise sweep — classic player explosion
        const noise = this.ctx.createBufferSource();
        noise.buffer = this._createNoiseBuffer(0.6);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(60, now + 0.6);
        filter.Q.setValueAtTime(2, now);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
        noise.stop(now + 0.6);

        // Descending warble for added drama
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
        oscGain.gain.setValueAtTime(0.1, now);
        oscGain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
    }

    diveSwoop(active) {
        if (!this.ctx) return;
        if (active) {
            if (this.swoopOsc) return;
            const now = this.ctx.currentTime;
            this.swoopOsc = this.ctx.createOscillator();
            this.swoopGain = this.ctx.createGain();
            // Warbling descending tone — original uses oscillating pitch
            this.swoopOsc.type = 'triangle';
            this.swoopOsc.frequency.setValueAtTime(500, now);
            this.swoopOsc.frequency.linearRampToValueAtTime(200, now + 0.4);
            this.swoopGain.gain.setValueAtTime(0.08, now);
            this.swoopOsc.connect(this.swoopGain);
            this.swoopGain.connect(this.ctx.destination);
            this.swoopOsc.start(now);
            const scheduleSwoop = () => {
                if (!this.swoopOsc) return;
                const t = this.ctx.currentTime;
                this.swoopOsc.frequency.setValueAtTime(500, t);
                this.swoopOsc.frequency.linearRampToValueAtTime(200, t + 0.4);
                this._swoopInterval = setTimeout(scheduleSwoop, 400);
            };
            this._swoopInterval = setTimeout(scheduleSwoop, 400);
        } else {
            if (this.swoopOsc) {
                clearTimeout(this._swoopInterval);
                this.swoopOsc.stop();
                this.swoopOsc.disconnect();
                this.swoopGain.disconnect();
                this.swoopOsc = null;
                this.swoopGain = null;
            }
        }
    }

    extraLife() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Ascending arpeggio — bright and cheerful
        const tones = [523, 659, 784, 1047]; // C5, E5, G5, C6
        tones.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now);
            const start = now + i * 0.07;
            gain.gain.setValueAtTime(0, now);
            gain.gain.setValueAtTime(0.1, start);
            gain.gain.linearRampToValueAtTime(0, start + 0.1);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(start + 0.1);
        });
    }

    startDrone() {
        if (!this.ctx || this.droneOsc) return;
        const now = this.ctx.currentTime;

        // Two detuned oscillators for a richer throbbing sound
        this.droneOsc = this.ctx.createOscillator();
        this.droneOsc.type = 'sawtooth';
        this.droneOsc.frequency.setValueAtTime(55, now);

        this.droneOsc2 = this.ctx.createOscillator();
        this.droneOsc2.type = 'sawtooth';
        this.droneOsc2.frequency.setValueAtTime(55.5, now);

        this.droneGain = this.ctx.createGain();
        this.droneGain.gain.setValueAtTime(0.06, now);

        // LFO for pulsing gain — heartbeat-like throb
        this.droneLfo = this.ctx.createOscillator();
        this.droneLfo.type = 'sine';
        this.droneLfo.frequency.setValueAtTime(2, now);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(0.04, now);
        this.droneLfo.connect(lfoGain);
        lfoGain.connect(this.droneGain.gain);
        this._droneLfoGain = lfoGain;

        // Low-pass filter to soften the sawtooth
        this._droneFilter = this.ctx.createBiquadFilter();
        this._droneFilter.type = 'lowpass';
        this._droneFilter.frequency.setValueAtTime(200, now);

        this.droneOsc.connect(this._droneFilter);
        this.droneOsc2.connect(this._droneFilter);
        this._droneFilter.connect(this.droneGain);
        this.droneGain.connect(this.ctx.destination);

        this.droneOsc.start(now);
        this.droneOsc2.start(now);
        this.droneLfo.start(now);
    }

    stopDrone() {
        if (this.droneOsc) {
            this.droneOsc.stop();
            this.droneOsc.disconnect();
            this.droneOsc = null;
        }
        if (this.droneOsc2) {
            this.droneOsc2.stop();
            this.droneOsc2.disconnect();
            this.droneOsc2 = null;
        }
        if (this.droneLfo) {
            this.droneLfo.stop();
            this.droneLfo.disconnect();
            this.droneLfo = null;
        }
        if (this.droneGain) {
            this.droneGain.disconnect();
            this.droneGain = null;
        }
        if (this._droneLfoGain) {
            this._droneLfoGain.disconnect();
            this._droneLfoGain = null;
        }
        if (this._droneFilter) {
            this._droneFilter.disconnect();
            this._droneFilter = null;
        }
    }

    setDroneSpeed(level) {
        if (!this.droneOsc || !this.ctx) return;
        // level 0-15: higher level = faster throbbing, higher pitch
        const baseFreq = 55 + level * 10;
        const lfoRate = 2 + level * 0.8;
        const filterFreq = 200 + level * 30;
        this.droneOsc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        if (this.droneOsc2) {
            this.droneOsc2.frequency.setValueAtTime(baseFreq + 0.5, this.ctx.currentTime);
        }
        if (this.droneLfo) {
            this.droneLfo.frequency.setValueAtTime(lfoRate, this.ctx.currentTime);
        }
        if (this._droneFilter) {
            this._droneFilter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
        }
    }
}

// ============================================================================
// SECTION 6: Entity Classes
// ============================================================================

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.alive = true;
        this.exploding = false;
        this.explodeTimer = 0;
        this.explodeFrame = 0;
        this.respawnTimer = 0;
        this.lives = CONFIG.STARTING_LIVES;
    }

    update(input, dt) {
        if (!this.alive || this.exploding) return;
        if (input.isLeft()) this.x -= CONFIG.PLAYER_SPEED;
        if (input.isRight()) this.x += CONFIG.PLAYER_SPEED;
        this.x = MathUtils.clamp(this.x, 0, CONFIG.LOGICAL_WIDTH - CONFIG.PLAYER_WIDTH);
    }

    fire() {
        if (!this.alive || this.exploding) return null;
        return new Bullet(
            this.x + CONFIG.PLAYER_WIDTH / 2 - CONFIG.BULLET_WIDTH / 2,
            this.y - CONFIG.BULLET_HEIGHT,
            -CONFIG.BULLET_SPEED
        );
    }

    die() {
        this.alive = false;
        this.exploding = true;
        this.explodeTimer = 0;
        this.explodeFrame = 0;
    }

    reset() {
        this.x = CONFIG.LOGICAL_WIDTH / 2 - CONFIG.PLAYER_WIDTH / 2;
        this.y = CONFIG.PLAYER_Y;
        this.alive = true;
        this.exploding = false;
        this.explodeTimer = 0;
        this.explodeFrame = 0;
    }

    getRect() {
        return { x: this.x, y: this.y, w: CONFIG.PLAYER_WIDTH, h: CONFIG.PLAYER_HEIGHT };
    }
}

class Bullet {
    constructor(x, y, dy) {
        this.x = x;
        this.y = y;
        this.dy = dy;
        this.active = true;
    }

    update() {
        this.y += this.dy;
        if (this.y < -CONFIG.BULLET_HEIGHT) {
            this.active = false;
        }
    }

    getRect() {
        return { x: this.x, y: this.y, w: CONFIG.BULLET_WIDTH, h: CONFIG.BULLET_HEIGHT };
    }
}

class Alien {
    constructor(type, row, col) {
        this.type = type;
        this.row = row;
        this.col = col;
        this.alive = true;
        this.state = 'formation';

        // Formation position
        this.formationX = CONFIG.FORMATION_START_X + col * CONFIG.FORMATION_SPACING_X;
        this.formationY = CONFIG.FORMATION_START_Y + row * CONFIG.FORMATION_SPACING_Y;

        // Current screen position
        this.x = this.formationX;
        this.y = this.formationY;

        // Animation
        this.animFrame = 0;
        this.animTimer = 0;

        // Dive state
        this.diveProgress = 0;
        this.divePath = null;
        this.fireTimer = 0;

        // Returning state
        this.returningProgress = 0;
        this.returnStartX = 0;
        this.returnStartY = 0;

        // Convoy references
        this.escorting = null;
        this.escorts = [];
    }

    update(formationOffsetX, dt) {
        if (!this.alive) return;

        if (this.state === 'formation') {
            this.x = this.formationX + formationOffsetX;
            this.y = this.formationY;
            this.animTimer += dt;
            if (this.animTimer >= CONFIG.ALIEN_ANIM_INTERVAL) {
                this.animTimer -= CONFIG.ALIEN_ANIM_INTERVAL;
                this.animFrame = this.animFrame === 0 ? 1 : 0;
            }
        } else if (this.state === 'diving') {
            this.diveProgress += CONFIG.DIVE_SPEED * dt / 1000;
            if (this.divePath) {
                this.x = MathUtils.bezierPoint(
                    this.diveProgress,
                    this.divePath.x0, this.divePath.cx1,
                    this.divePath.cx2, this.divePath.x3
                );
                this.y = MathUtils.bezierPoint(
                    this.diveProgress,
                    this.divePath.y0, this.divePath.cy1,
                    this.divePath.cy2, this.divePath.y3
                );
            }

            // Animate faster while diving
            this.animTimer += dt;
            if (this.animTimer >= CONFIG.ALIEN_ANIM_INTERVAL * 0.5) {
                this.animTimer -= CONFIG.ALIEN_ANIM_INTERVAL * 0.5;
                this.animFrame = this.animFrame === 0 ? 1 : 0;
            }

            // Fire timer during dive
            this.fireTimer += dt;

            // Dive complete — wrap to top and return
            if (this.diveProgress >= 1) {
                if (this.y > CONFIG.LOGICAL_HEIGHT) {
                    this.y = -16;
                }
                this.startReturn();
            }
        } else if (this.state === 'returning') {
            this.returningProgress += CONFIG.RETURN_SPEED * dt / 1000;
            if (this.returningProgress >= 1) {
                this.returningProgress = 1;
            }

            const targetX = this.formationX + formationOffsetX;
            const targetY = this.formationY;
            this.x = MathUtils.lerp(this.returnStartX, targetX, this.returningProgress);
            this.y = MathUtils.lerp(this.returnStartY, targetY, this.returningProgress);

            // Animate normally while returning
            this.animTimer += dt;
            if (this.animTimer >= CONFIG.ALIEN_ANIM_INTERVAL) {
                this.animTimer -= CONFIG.ALIEN_ANIM_INTERVAL;
                this.animFrame = this.animFrame === 0 ? 1 : 0;
            }

            // Close enough — snap to formation
            if (this.returningProgress >= 1) {
                this.x = targetX;
                this.y = targetY;
                this.state = 'formation';
                this.returningProgress = 0;
            }
        }
    }

    startDive(path) {
        this.state = 'diving';
        this.diveProgress = 0;
        this.divePath = path;
        this.fireTimer = 0;
    }

    startReturn() {
        this.state = 'returning';
        this.returningProgress = 0;
        this.returnStartX = this.x;
        this.returnStartY = this.y;
    }

    getRect() {
        return { x: this.x, y: this.y, w: 16, h: 16 };
    }
}

class AlienBullet {
    constructor(x, y, dx, dy) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.active = true;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
        if (this.y > CONFIG.LOGICAL_HEIGHT || this.x < 0 || this.x > CONFIG.LOGICAL_WIDTH) {
            this.active = false;
        }
    }

    getRect() {
        return { x: this.x, y: this.y, w: CONFIG.ENEMY_BULLET_WIDTH, h: CONFIG.ENEMY_BULLET_HEIGHT };
    }
}

class Explosion {
    constructor(x, y, colorSet) {
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.timer = 0;
        this.done = false;
        this.colorSet = colorSet || [
            CONFIG.COLOR_EXPLOSION_1,
            CONFIG.COLOR_EXPLOSION_2,
            CONFIG.COLOR_EXPLOSION_3
        ];
    }

    update(dt) {
        if (this.done) return;
        this.timer += dt;
        const frameTime = CONFIG.EXPLOSION_DURATION / CONFIG.EXPLOSION_FRAMES;
        this.frame = Math.floor(this.timer / frameTime);
        if (this.frame >= CONFIG.EXPLOSION_FRAMES) {
            this.frame = CONFIG.EXPLOSION_FRAMES - 1;
            this.done = true;
        }
    }

    isDone() {
        return this.done;
    }
}

class Star {
    constructor() {
        this.x = Math.random() * CONFIG.LOGICAL_WIDTH;
        this.y = Math.random() * CONFIG.LOGICAL_HEIGHT;
        const colors = ['#FFFFFF', '#FFFF00', '#00FFFF', '#FF0000', '#00FF00', '#FF00FF'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.brightness = 0.3 + Math.random() * 0.7;
        this.speed = CONFIG.STAR_SCROLL_SPEED * (0.5 + Math.random());
    }

    update() {
        this.y += this.speed;
        if (this.y > CONFIG.LOGICAL_HEIGHT) {
            this.y = 0;
            this.x = Math.random() * CONFIG.LOGICAL_WIDTH;
        }
    }
}
// ============================================================================
// SECTION 7: COLLISION SYSTEM
// ============================================================================

const CollisionSystem = {
    // Check player bullet against all aliens
    // Returns: { hit: boolean, alien: Alien|null, score: number }
    checkPlayerBulletAliens(bullet, aliens) {
        if (!bullet || !bullet.active) return { hit: false, alien: null, score: 0 };
        const br = bullet.getRect();
        for (const alien of aliens) {
            if (!alien.alive) continue;
            const ar = alien.getRect();
            if (MathUtils.rectsOverlap(br.x, br.y, br.w, br.h, ar.x, ar.y, ar.w, ar.h)) {
                let score;
                if (alien.state === 'diving') {
                    score = CONFIG.SCORE_DIVING[alien.type];
                } else {
                    score = CONFIG.SCORE_IN_FORMATION[alien.type];
                }
                return { hit: true, alien: alien, score: score };
            }
        }
        return { hit: false, alien: null, score: 0 };
    },

    // Check alien bullets against player
    // Returns: { hit: boolean, bullet: AlienBullet|null }
    checkAlienBulletsPlayer(alienBullets, player) {
        if (!player.alive || player.exploding) return { hit: false, bullet: null };
        const pr = player.getRect();
        for (const b of alienBullets) {
            if (!b.active) continue;
            const br = b.getRect();
            if (MathUtils.rectsOverlap(pr.x, pr.y, pr.w, pr.h, br.x, br.y, br.w, br.h)) {
                return { hit: true, bullet: b };
            }
        }
        return { hit: false, bullet: null };
    },

    // Check diving aliens colliding with player (kamikaze)
    // Returns: { hit: boolean, alien: Alien|null }
    checkAlienPlayerCollision(aliens, player) {
        if (!player.alive || player.exploding) return { hit: false, alien: null };
        const pr = player.getRect();
        for (const alien of aliens) {
            if (!alien.alive || alien.state === 'formation') continue;
            const ar = alien.getRect();
            if (MathUtils.rectsOverlap(pr.x, pr.y, pr.w, pr.h, ar.x, ar.y, ar.w, ar.h)) {
                return { hit: true, alien: alien };
            }
        }
        return { hit: false, alien: null };
    },
};

// ============================================================================
// SECTION 8: RENDERER
// ============================================================================

const ALIEN_COLOR_MAPS = {
    [CONFIG.TYPE_BLUE]: { 1: CONFIG.COLOR_BLUE_ALIEN, 2: CONFIG.COLOR_BLUE_ALIEN_DARK },
    [CONFIG.TYPE_PURPLE]: { 1: CONFIG.COLOR_PURPLE_ALIEN, 2: CONFIG.COLOR_PURPLE_ALIEN_DARK },
    [CONFIG.TYPE_RED]: { 1: CONFIG.COLOR_RED_ALIEN, 2: CONFIG.COLOR_BLUE_ALIEN },
    [CONFIG.TYPE_FLAGSHIP]: { 1: CONFIG.COLOR_FLAGSHIP, 2: CONFIG.COLOR_FLAGSHIP_ACCENT, 3: CONFIG.COLOR_RED_ALIEN },
};

const ALIEN_SPRITE_NAMES = ['FLAGSHIP', 'RED', 'PURPLE', 'BLUE'];

const GALAXIAN_TITLE_COLORS = [
    CONFIG.COLOR_HUD_RED,
    CONFIG.COLOR_HUD_YELLOW,
    CONFIG.COLOR_BLUE_ALIEN,
    CONFIG.COLOR_PURPLE_ALIEN,
    CONFIG.COLOR_RED_ALIEN,
    CONFIG.COLOR_HUD_RED,
    CONFIG.COLOR_HUD_YELLOW,
    CONFIG.COLOR_BLUE_ALIEN,
];

const Renderer = {
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        canvas.width = CONFIG.WIDTH;
        canvas.height = CONFIG.HEIGHT;
        this.ctx.imageSmoothingEnabled = false;
    },

    clear() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    },

    drawSprite(sprite, x, y, colorMap) {
        const ctx = this.ctx;
        const s = CONFIG.SCALE;
        for (let row = 0; row < sprite.length; row++) {
            for (let col = 0; col < sprite[row].length; col++) {
                const pixel = sprite[row][col];
                if (pixel === 0) continue;
                const color = colorMap[pixel];
                if (!color) continue;
                ctx.fillStyle = color;
                ctx.fillRect((x + col) * s, (y + row) * s, s, s);
            }
        }
    },

    drawText(str, x, y, color) {
        str = String(str).toUpperCase();
        let curX = x;
        for (let i = 0; i < str.length; i++) {
            const ch = str[i];
            if (ch === ' ') {
                curX += 6;
                continue;
            }
            const glyph = SPRITES.FONT[ch];
            if (glyph) {
                this.drawSprite(glyph, curX, y, { 1: color });
            }
            curX += 6;
        }
    },

    drawCenteredText(str, y, color) {
        const width = String(str).length * 6;
        const x = Math.floor((CONFIG.LOGICAL_WIDTH - width) / 2);
        this.drawText(str, x, y, color);
    },

    drawStarfield(stars) {
        const ctx = this.ctx;
        const s = CONFIG.SCALE;
        for (const star of stars) {
            ctx.fillStyle = star.color;
            ctx.globalAlpha = star.brightness;
            ctx.fillRect(star.x * s, star.y * s, s, s);
        }
        ctx.globalAlpha = 1;
    },

    drawAliens(aliens) {
        for (const alien of aliens) {
            if (!alien.alive) continue;
            const spriteName = ALIEN_SPRITE_NAMES[alien.type] + '_' + alien.animFrame;
            const sprite = SPRITES[spriteName];
            if (!sprite) continue;
            const colorMap = ALIEN_COLOR_MAPS[alien.type];
            if (!colorMap) continue;
            this.drawSprite(sprite, alien.x, alien.y, colorMap);
        }
    },

    drawPlayer(player) {
        if (player.exploding) {
            const sprite = player.explodeFrame === 0 ? SPRITES.PLAYER_EXPLODE_0 : SPRITES.PLAYER_EXPLODE_1;
            this.drawSprite(sprite, player.x, player.y, {
                1: CONFIG.COLOR_EXPLOSION_1,
                2: CONFIG.COLOR_EXPLOSION_2,
                3: CONFIG.COLOR_EXPLOSION_3
            });
        } else if (player.alive) {
            this.drawSprite(SPRITES.PLAYER, player.x, player.y, {
                1: CONFIG.COLOR_PLAYER,
                2: CONFIG.COLOR_PLAYER_BLUE,
                3: CONFIG.COLOR_PLAYER_RED
            });
        }
    },

    drawBullet(bullet) {
        if (!bullet || !bullet.active) return;
        const ctx = this.ctx;
        const s = CONFIG.SCALE;
        ctx.fillStyle = CONFIG.COLOR_BULLET;
        ctx.fillRect(bullet.x * s, bullet.y * s, CONFIG.BULLET_WIDTH * s, CONFIG.BULLET_HEIGHT * s);
    },

    drawAlienBullets(alienBullets) {
        const ctx = this.ctx;
        const s = CONFIG.SCALE;
        ctx.fillStyle = CONFIG.COLOR_ENEMY_BULLET;
        for (const b of alienBullets) {
            if (!b.active) continue;
            ctx.fillRect(b.x * s, b.y * s, CONFIG.ENEMY_BULLET_WIDTH * s, CONFIG.ENEMY_BULLET_HEIGHT * s);
        }
    },

    drawExplosions(explosions) {
        for (const exp of explosions) {
            if (exp.isDone()) continue;
            const sprite = SPRITES['EXPLOSION_' + exp.frame];
            if (!sprite) continue;
            const primaryColor = exp.colorSet && exp.colorSet[exp.frame]
                ? exp.colorSet[exp.frame]
                : CONFIG.COLOR_EXPLOSION_1;
            this.drawSprite(sprite, exp.x, exp.y, {
                1: primaryColor,
                2: CONFIG.COLOR_EXPLOSION_2,
                3: CONFIG.COLOR_EXPLOSION_3
            });
        }
    },

    drawHUD(score, highScore, lives, wave) {
        // "1UP" label in red at top-left
        this.drawText('1UP', 8, 2, CONFIG.COLOR_HUD_RED);
        // Score below the label in white
        const scoreStr = String(score).padStart(6, ' ');
        this.drawText(scoreStr, 2, 10, CONFIG.COLOR_TEXT);

        // "HIGH SCORE" centered at top
        this.drawText('HIGH SCORE', 72, 2, CONFIG.COLOR_HUD_RED);
        const highStr = String(highScore).padStart(6, ' ');
        this.drawText(highStr, 84, 10, CONFIG.COLOR_TEXT);

        // Lives as player ship icons at bottom-left
        for (let i = 0; i < lives - 1; i++) {
            this.drawSprite(SPRITES.PLAYER, 2 + i * 18, 244, {
                1: CONFIG.COLOR_PLAYER,
                2: CONFIG.COLOR_PLAYER_BLUE,
                3: CONFIG.COLOR_PLAYER_RED
            });
        }

        // Wave flags at bottom-right
        for (let i = 0; i < wave; i++) {
            this.drawSprite(SPRITES.FLAG_ICON, CONFIG.LOGICAL_WIDTH - 12 - i * 10, 246, {
                1: CONFIG.COLOR_HUD_YELLOW
            });
        }
    },

    drawAttractAlienRow(sprite, colorMap, label, formationScore, divingScore, y) {
        // Draw alien sprite centered at x=60
        this.drawSprite(sprite, 60, y, colorMap);
        // Draw dash and scores to the right
        this.drawText(label, 80, y + 2, CONFIG.COLOR_TEXT);
        this.drawText(String(formationScore), 140, y + 2, CONFIG.COLOR_TEXT);
        this.drawText(String(divingScore), 170, y + 2, CONFIG.COLOR_TEXT);
    },

    drawAttractScreen(state) {
        // Starfield
        this.drawStarfield(state.stars);

        // Blinking phase for title (subtle pulsing)
        const t = state.attractTimer;

        // "GALAXIAN" title — each letter in a different color
        const title = 'GALAXIAN';
        const titleWidth = title.length * 10;
        const titleStartX = Math.floor((CONFIG.LOGICAL_WIDTH - titleWidth) / 2);
        for (let i = 0; i < title.length; i++) {
            const ch = title[i];
            const glyph = SPRITES.FONT[ch];
            if (glyph) {
                const color = GALAXIAN_TITLE_COLORS[i % GALAXIAN_TITLE_COLORS.length];
                // Draw at 2x size for title effect
                const ctx = this.ctx;
                const s = CONFIG.SCALE;
                const bx = titleStartX + i * 10;
                const by = 40;
                for (let row = 0; row < glyph.length; row++) {
                    for (let col = 0; col < glyph[row].length; col++) {
                        if (glyph[row][col] === 0) continue;
                        ctx.fillStyle = color;
                        ctx.fillRect((bx + col * 2) * s, (by + row * 2) * s, s * 2, s * 2);
                    }
                }
            }
        }

        // Score table header (authentic: "SCORE ADVANCE TABLE")
        this.drawCenteredText('- SCORE ADVANCE TABLE -', 75, CONFIG.COLOR_HUD_YELLOW);

        // Column headers (authentic: CONVOY / CHARGER)
        this.drawText('CONVOY', 108, 87, CONFIG.COLOR_TEXT);
        this.drawText('CHARGER', 152, 87, CONFIG.COLOR_TEXT);

        // Flagship row with convoy bonuses
        const flagSprite = SPRITES.FLAGSHIP_0;
        if (flagSprite) {
            this.drawSprite(flagSprite, 34, 97, ALIEN_COLOR_MAPS[CONFIG.TYPE_FLAGSHIP]);
        }
        this.drawText('FLAGSHIP', 54, 99, CONFIG.COLOR_TEXT);
        this.drawText('60', 116, 99, CONFIG.COLOR_TEXT);
        this.drawText('300', 160, 99, CONFIG.COLOR_TEXT);

        // Convoy bonus info
        this.drawText('W/1 ESCORT', 54, 111, CONFIG.COLOR_HUD_YELLOW);
        this.drawText('200', 160, 111, CONFIG.COLOR_HUD_YELLOW);
        this.drawText('W/2 ESCORTS', 54, 121, CONFIG.COLOR_HUD_YELLOW);
        this.drawText('800', 160, 121, CONFIG.COLOR_HUD_YELLOW);

        // Red alien row
        const redSprite = SPRITES.RED_0;
        if (redSprite) {
            this.drawSprite(redSprite, 34, 133, ALIEN_COLOR_MAPS[CONFIG.TYPE_RED]);
        }
        this.drawText('RED', 54, 135, CONFIG.COLOR_TEXT);
        this.drawText('50', 116, 135, CONFIG.COLOR_TEXT);
        this.drawText('100', 160, 135, CONFIG.COLOR_TEXT);

        // Purple alien row
        const purpSprite = SPRITES.PURPLE_0;
        if (purpSprite) {
            this.drawSprite(purpSprite, 34, 147, ALIEN_COLOR_MAPS[CONFIG.TYPE_PURPLE]);
        }
        this.drawText('PURPLE', 54, 149, CONFIG.COLOR_TEXT);
        this.drawText('40', 116, 149, CONFIG.COLOR_TEXT);
        this.drawText('80', 160, 149, CONFIG.COLOR_TEXT);

        // Blue alien row
        const blueSprite = SPRITES.BLUE_0;
        if (blueSprite) {
            this.drawSprite(blueSprite, 34, 161, ALIEN_COLOR_MAPS[CONFIG.TYPE_BLUE]);
        }
        this.drawText('BLUE', 54, 163, CONFIG.COLOR_TEXT);
        this.drawText('30', 116, 163, CONFIG.COLOR_TEXT);
        this.drawText('60', 160, 163, CONFIG.COLOR_TEXT);

        // Taglines
        this.drawCenteredText('WE ARE THE GALAXIANS', 185, CONFIG.COLOR_BLUE_ALIEN);
        this.drawCenteredText('MISSION: DESTROY ALIENS', 197, CONFIG.COLOR_RED_ALIEN);

        // Controls
        this.drawCenteredText('ARROWS/WASD MOVE  SPACE FIRE', 215, CONFIG.COLOR_TEXT);

        // High score
        this.drawText('HIGH SCORE', 72, 2, CONFIG.COLOR_HUD_RED);
        const highStr = String(state.highScore).padStart(6, ' ');
        this.drawText(highStr, 84, 10, CONFIG.COLOR_TEXT);

        // Blinking "PRESS ENTER TO START"
        const blinkOn = Math.floor(t / 500) % 2 === 0;
        if (blinkOn) {
            this.drawCenteredText('PRESS ENTER TO START', 230, CONFIG.COLOR_HUD_YELLOW);
        }
    },

    drawGameOver() {
        this.drawCenteredText('GAME OVER', 128, CONFIG.COLOR_HUD_RED);
    },
};

// ============================================================================
// SECTION 9: GAME STATE MACHINE
// ============================================================================

class Game {
    constructor() {
        this.state = 'attract';
        this.player = new Player(CONFIG.LOGICAL_WIDTH / 2 - 8, CONFIG.PLAYER_Y);
        this.aliens = [];
        this.bullet = null;
        this.alienBullets = [];
        this.explosions = [];
        this.stars = [];
        this.score = 0;
        this.highScore = 0;
        this.lives = CONFIG.STARTING_LIVES;
        this.wave = 1;
        this.formationOffsetX = 0;
        this.formationSwayDir = 1;
        this.diveTimer = 0;
        this.convoyTimer = 0;
        this.attractTimer = 0;
        this.gameOverTimer = 0;
        this.respawnTimer = 0;
        this.waveStartTimer = 0;
        this.extraLifeAwarded = false;
        this.sound = new SoundEngine();
        this.input = new InputHandler();

        for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
            this.stars.push(new Star());
        }
    }

    initWave() {
        this.aliens = [];
        this.formationOffsetX = 0;
        this.formationSwayDir = 1;

        // Row 0: 2 flagships at cols 4-5
        for (let col = 4; col <= 5; col++) {
            this.aliens.push(new Alien(CONFIG.TYPE_FLAGSHIP, 0, col));
        }
        // Row 1: 6 red escorts at cols 2-7
        for (let col = 2; col <= 7; col++) {
            this.aliens.push(new Alien(CONFIG.TYPE_RED, 1, col));
        }
        // Row 2: 8 purple aliens at cols 1-8
        for (let col = 1; col <= 8; col++) {
            this.aliens.push(new Alien(CONFIG.TYPE_PURPLE, 2, col));
        }
        // Rows 3-5: 10 blue aliens each at cols 0-9
        for (let row = 3; row <= 5; row++) {
            for (let col = 0; col <= 9; col++) {
                this.aliens.push(new Alien(CONFIG.TYPE_BLUE, row, col));
            }
        }
    }

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.lives = CONFIG.STARTING_LIVES;
        this.wave = 1;
        this.extraLifeAwarded = false;
        this.bullet = null;
        this.alienBullets = [];
        this.explosions = [];
        this.player.reset();
        this.player.lives = CONFIG.STARTING_LIVES;
        this.initWave();
        this.diveTimer = CONFIG.DIVE_INTERVAL_BASE;
        this.convoyTimer = CONFIG.CONVOY_INTERVAL;
        this.sound.init();
        this.sound.startDrone();
        this.sound.setDroneSpeed(0);
    }

    updateFormation(dt) {
        this.formationOffsetX += CONFIG.FORMATION_SWAY_SPEED * this.formationSwayDir;
        if (this.formationOffsetX > CONFIG.FORMATION_SWAY_RANGE) {
            this.formationOffsetX = CONFIG.FORMATION_SWAY_RANGE;
            this.formationSwayDir = -1;
        } else if (this.formationOffsetX < -CONFIG.FORMATION_SWAY_RANGE) {
            this.formationOffsetX = -CONFIG.FORMATION_SWAY_RANGE;
            this.formationSwayDir = 1;
        }
    }

    updateDiveAI(dt) {
        const diverCount = this.aliens.filter(a => a.alive && a.state === 'diving').length;
        if (diverCount >= CONFIG.MAX_DIVERS) return;

        this.diveTimer -= dt;
        if (this.diveTimer <= 0) {
            const interval = Math.max(CONFIG.DIVE_INTERVAL_MIN,
                CONFIG.DIVE_INTERVAL_BASE - (this.wave - 1) * 150);
            this.diveTimer = interval;

            const candidates = this.aliens.filter(a =>
                a.alive && a.state === 'formation' && a.type !== CONFIG.TYPE_FLAGSHIP
            );
            if (candidates.length > 0) {
                const alien = candidates[MathUtils.randomInt(0, candidates.length - 1)];
                this.launchDive(alien);
            }
        }

        // Convoy timer (flagship with escorts)
        this.convoyTimer -= dt;
        if (this.convoyTimer <= 0) {
            this.convoyTimer = CONFIG.CONVOY_INTERVAL;
            this.launchConvoy();
        }

        // Swarm mode: when few aliens remain, all attack
        const aliveCount = this.aliens.filter(a => a.alive).length;
        if (aliveCount > 0 && aliveCount <= CONFIG.SWARM_THRESHOLD) {
            const inFormation = this.aliens.filter(a => a.alive && a.state === 'formation');
            for (const alien of inFormation) {
                this.launchDive(alien);
            }
        }
    }

    launchDive(alien) {
        const startX = alien.x;
        const startY = alien.y;
        const targetX = MathUtils.clamp(
            this.player.x + MathUtils.randomInt(-40, 40),
            10,
            CONFIG.LOGICAL_WIDTH - 10
        );
        const exitY = CONFIG.LOGICAL_HEIGHT + 20;

        const cx1 = MathUtils.clamp(startX + MathUtils.randomInt(-60, 60), 0, CONFIG.LOGICAL_WIDTH);
        const cy1 = startY + 60;
        const cx2 = MathUtils.clamp(targetX + MathUtils.randomInt(-30, 30), 0, CONFIG.LOGICAL_WIDTH);
        const cy2 = CONFIG.LOGICAL_HEIGHT * 0.7;

        alien.startDive({
            x0: startX, y0: startY,
            cx1: cx1, cy1: cy1,
            cx2: cx2, cy2: cy2,
            x3: targetX, y3: exitY
        });
    }

    launchConvoy() {
        const flagships = this.aliens.filter(a =>
            a.alive && a.state === 'formation' && a.type === CONFIG.TYPE_FLAGSHIP
        );
        if (flagships.length === 0) return;
        const flagship = flagships[MathUtils.randomInt(0, flagships.length - 1)];

        // Find up to 2 red escorts in formation
        const reds = this.aliens.filter(a =>
            a.alive && a.state === 'formation' && a.type === CONFIG.TYPE_RED
        );
        const escorts = reds.slice(0, Math.min(2, reds.length));

        flagship.escorts = escorts;
        for (const escort of escorts) {
            escort.escorting = flagship;
        }

        // Launch flagship dive
        this.launchDive(flagship);

        // Escorts dive with offset paths alongside flagship
        for (let i = 0; i < escorts.length; i++) {
            const offset = (i === 0) ? -20 : 20;
            const path = {
                x0: escorts[i].x, y0: escorts[i].y,
                cx1: flagship.divePath.cx1 + offset, cy1: flagship.divePath.cy1,
                cx2: flagship.divePath.cx2 + offset, cy2: flagship.divePath.cy2,
                x3: MathUtils.clamp(flagship.divePath.x3 + offset, 0, CONFIG.LOGICAL_WIDTH),
                y3: flagship.divePath.y3
            };
            escorts[i].startDive(path);
        }
    }

    updateAlienBullets(dt) {
        this.alienBullets = this.alienBullets.filter(b => b.active);

        if (this.alienBullets.length >= CONFIG.MAX_ALIEN_BULLETS) return;

        const divers = this.aliens.filter(a => a.alive && a.state === 'diving');
        for (const alien of divers) {
            if (this.alienBullets.length >= CONFIG.MAX_ALIEN_BULLETS) break;
            if (Math.random() < 0.01) {
                const angle = MathUtils.angleTo(
                    alien.x + 8, alien.y + 16,
                    this.player.x + 8, this.player.y
                );
                const dx = Math.cos(angle) * CONFIG.ALIEN_BULLET_SPEED;
                const dy = Math.sin(angle) * CONFIG.ALIEN_BULLET_SPEED;
                this.alienBullets.push(new AlienBullet(alien.x + 7, alien.y + 14, dx, dy));
            }
        }
    }

    updatePlaying(dt) {
        // Stars
        for (const star of this.stars) star.update();

        // Player movement
        this.player.update(this.input, dt);

        // Player firing (single bullet on screen)
        if (this.input.isFire() && (!this.bullet || !this.bullet.active)) {
            const b = this.player.fire();
            if (b) {
                this.bullet = b;
                this.sound.shoot();
            }
        }

        // Update bullet
        if (this.bullet) this.bullet.update();

        // Formation sway
        this.updateFormation(dt);

        // Update all aliens
        for (const alien of this.aliens) {
            alien.update(this.formationOffsetX, dt);
        }

        // Dive AI
        this.updateDiveAI(dt);

        // Alien bullets
        this.updateAlienBullets(dt);
        for (const b of this.alienBullets) b.update();

        // Explosions
        for (const exp of this.explosions) exp.update(dt);
        this.explosions = this.explosions.filter(e => !e.isDone());

        // --- Collisions ---
        this.checkCollisions();

        // Check wave complete
        const aliveCount = this.aliens.filter(a => a.alive).length;
        if (aliveCount === 0) {
            this.state = 'waveComplete';
            this.waveStartTimer = CONFIG.WAVE_START_DELAY;
            this.sound.stopDrone();
        }
    }

    checkCollisions() {
        // Player bullet vs aliens
        if (this.bullet && this.bullet.active) {
            const result = CollisionSystem.checkPlayerBulletAliens(this.bullet, this.aliens);
            if (result.hit) {
                this.bullet.active = false;
                result.alien.alive = false;

                let score = result.score;

                // Flagship convoy scoring
                if (result.alien.type === CONFIG.TYPE_FLAGSHIP && result.alien.escorts) {
                    const deadEscorts = result.alien.escorts.filter(e => !e.alive).length;
                    if (deadEscorts >= 2) {
                        score = CONFIG.SCORE_FLAGSHIP_2ESCORT;
                    } else if (deadEscorts >= 1) {
                        score = CONFIG.SCORE_FLAGSHIP_1ESCORT;
                    }
                    // Release remaining escorts so they return to formation
                    for (const escort of result.alien.escorts) {
                        if (escort.alive) {
                            escort.escorting = null;
                            escort.startReturn();
                        }
                    }
                }

                // If killed alien was an escort, update its flagship reference
                if (result.alien.escorting) {
                    const fs = result.alien.escorting;
                    fs.escorts = fs.escorts.filter(e => e !== result.alien);
                }

                this.score += score;
                this.explosions.push(new Explosion(result.alien.x, result.alien.y));

                if (result.alien.type === CONFIG.TYPE_FLAGSHIP) {
                    this.sound.flagshipHit();
                } else {
                    this.sound.enemyHit();
                }

                // Extra life at threshold
                if (!this.extraLifeAwarded && this.score >= CONFIG.EXTRA_LIFE_SCORE) {
                    this.extraLifeAwarded = true;
                    this.lives++;
                    this.player.lives++;
                    this.sound.extraLife();
                }

                // High score tracking
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                }
            }
        }

        // Alien bullets vs player
        const bulletHit = CollisionSystem.checkAlienBulletsPlayer(this.alienBullets, this.player);
        if (bulletHit.hit) {
            bulletHit.bullet.active = false;
            this.handlePlayerDeath();
        }

        // Diving aliens vs player (kamikaze collision)
        const diveHit = CollisionSystem.checkAlienPlayerCollision(this.aliens, this.player);
        if (diveHit.hit) {
            diveHit.alien.alive = false;
            this.explosions.push(new Explosion(diveHit.alien.x, diveHit.alien.y));
            this.handlePlayerDeath();
        }
    }

    handlePlayerDeath() {
        this.player.die();
        this.sound.playerDeath();
        this.sound.stopDrone();
        this.state = 'playerDeath';
        this.respawnTimer = CONFIG.RESPAWN_DELAY;
        this.lives--;
        this.player.lives = this.lives;
    }

    updatePlayerDeath(dt) {
        for (const star of this.stars) star.update();

        // Player explosion animation
        if (this.player.exploding) {
            this.player.explodeTimer += dt;
            if (this.player.explodeTimer > 200) {
                this.player.explodeFrame = 1;
            }
            if (this.player.explodeTimer > 400) {
                this.player.exploding = false;
            }
        }

        // Explosions continue to animate
        for (const exp of this.explosions) exp.update(dt);
        this.explosions = this.explosions.filter(e => !e.isDone());

        // Wait for respawn timer
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) {
            if (this.lives <= 0) {
                this.state = 'gameOver';
                this.gameOverTimer = CONFIG.GAME_OVER_DURATION;
            } else {
                this.player.reset();
                this.state = 'playing';
                this.sound.startDrone();
                // Return all diving/returning aliens to formation
                for (const alien of this.aliens) {
                    if (alien.alive && alien.state !== 'formation') {
                        alien.state = 'formation';
                    }
                }
                this.alienBullets = [];
            }
        }
    }

    updateWaveComplete(dt) {
        for (const star of this.stars) star.update();
        this.waveStartTimer -= dt;
        if (this.waveStartTimer <= 0) {
            this.wave++;
            this.initWave();
            this.bullet = null;
            this.alienBullets = [];
            this.state = 'playing';
            this.sound.startDrone();
            this.sound.setDroneSpeed(Math.min(15, this.wave));
        }
    }

    updateGameOver(dt) {
        for (const star of this.stars) star.update();
        this.gameOverTimer -= dt;
        if (this.gameOverTimer <= 0) {
            this.state = 'attract';
        }
    }

    updateAttract(dt) {
        for (const star of this.stars) star.update();
        this.attractTimer += dt;
        if (this.input.isStart()) {
            this.startGame();
        }
    }

    update(dt) {
        switch (this.state) {
            case 'attract': this.updateAttract(dt); break;
            case 'playing': this.updatePlaying(dt); break;
            case 'playerDeath': this.updatePlayerDeath(dt); break;
            case 'waveComplete': this.updateWaveComplete(dt); break;
            case 'gameOver': this.updateGameOver(dt); break;
        }
        this.input.update();
    }

    render() {
        Renderer.clear();
        switch (this.state) {
            case 'attract':
                Renderer.drawAttractScreen(this.getState());
                break;
            case 'playing':
            case 'playerDeath':
            case 'waveComplete':
                Renderer.drawStarfield(this.stars);
                Renderer.drawAliens(this.aliens);
                Renderer.drawPlayer(this.player);
                Renderer.drawBullet(this.bullet);
                Renderer.drawAlienBullets(this.alienBullets);
                Renderer.drawExplosions(this.explosions);
                Renderer.drawHUD(this.score, this.highScore, this.lives, this.wave);
                break;
            case 'gameOver':
                Renderer.drawStarfield(this.stars);
                Renderer.drawAliens(this.aliens);
                Renderer.drawHUD(this.score, this.highScore, this.lives, this.wave);
                Renderer.drawGameOver();
                break;
        }
    }

    getState() {
        return {
            state: this.state,
            player: this.player,
            aliens: this.aliens,
            bullet: this.bullet,
            alienBullets: this.alienBullets,
            explosions: this.explosions,
            stars: this.stars,
            score: this.score,
            highScore: this.highScore,
            lives: this.lives,
            wave: this.wave,
            formationOffsetX: this.formationOffsetX,
            attractTimer: this.attractTimer,
            gameOverTimer: this.gameOverTimer,
        };
    }
}

// ============================================================================
// SECTION 10: MAIN LOOP & BOOTSTRAP
// ============================================================================

const canvas = document.getElementById('gameCanvas');
Renderer.init(canvas);
const game = new Game();

let lastTime = 0;
let accumulator = 0;

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let delta = timestamp - lastTime;
    lastTime = timestamp;
    if (delta > CONFIG.MAX_DELTA) delta = CONFIG.MAX_DELTA;
    accumulator += delta;
    while (accumulator >= CONFIG.FRAME_TIME) {
        game.update(CONFIG.FRAME_TIME);
        accumulator -= CONFIG.FRAME_TIME;
    }
    game.render();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
