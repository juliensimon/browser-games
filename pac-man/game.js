'use strict';

// ============================================================================
// SECTION 1: CONFIG — All tunable game constants
// ============================================================================

const CONFIG = Object.freeze({
    // Display
    LOGICAL_WIDTH: 224,
    LOGICAL_HEIGHT: 308,     // 288 (maze) + 20 (HUD space)
    SCALE: 3,
    WIDTH: 672,              // 224 * 3
    HEIGHT: 924,             // 308 * 3
    HUD_HEIGHT: 20,          // Space reserved at top for HUD

    // Grid & Maze
    TILE_SIZE: 8,
    MAZE_COLS: 28,
    MAZE_ROWS: 36,
    MAZE_OFFSET_Y: 20,       // Maze starts below HUD

    // Pac-Man
    BASE_SPEED: 1.25,  // Authentic: 75 pixels/sec at 60fps = 1.25 px/frame (100%)
    PACMAN_START_COL: 14,
    PACMAN_START_ROW: 26,
    PACMAN_RADIUS: 6,
    PACMAN_MOUTH_ANGLE: 0.25,
    PACMAN_ANIM_INTERVAL: 8,

    // Speed tables (percentage of BASE_SPEED) — Level 1 values
    // Authentic Pac-Man speeds by level: [1,2-4,5+] = [80%,90%,100%]
    PACMAN_SPEED_NORMAL: 0.80,      // Level 1: 80% of base
    PACMAN_SPEED_FRIGHT: 0.90,      // Level 1: 90% when power pellet active
    GHOST_SPEED_NORMAL: 0.75,       // Level 1: 75% of base
    GHOST_SPEED_FRIGHT: 0.50,       // Level 1: 50% when frightened
    GHOST_SPEED_TUNNEL: 0.40,       // Level 1: 40% in tunnels
    ELROY1_SPEED: 0.80,             // Level 1: 80% (same as Pac-Man normal)
    ELROY2_SPEED: 0.85,             // Level 1: 85% (slightly faster)

    // Ghost configuration
    GHOST_WIDTH: 16,
    GHOST_HEIGHT: 16,
    GHOST_RADIUS: 8,
    GHOST_HOUSE_COL: 13,
    GHOST_HOUSE_ROW: 18,
    GHOST_SCATTER_DURATION: 420,
    GHOST_CHASE_DURATION: 1200,
    GHOST_FRIGHTENED_DURATIONS: [360, 360, 300, 240, 180, 300, 120, 120, 60, 300, 60, 60, 0],  // By level (frames at 60fps)
    GHOST_RESPAWN_DELAY: 180,
    GHOST_ANIM_INTERVAL: 10,

    // Dot eating pause (authentic arcade timing)
    DOT_EAT_PAUSE: 1,           // 1 frame pause per normal dot
    POWER_PELLET_EAT_PAUSE: 3,  // 3 frame pause per power pellet

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

    // Fruit
    FRUIT_SPAWN_COL: 13,
    FRUIT_SPAWN_ROW: 17,  // Just below ghost house for clear visibility
    FRUIT_DURATION: 600,  // 10 seconds
    FRUIT_SPAWN_DOTS_1: 174,  // When 70 dots eaten (244 - 70)
    FRUIT_SPAWN_DOTS_2: 74,   // When 170 dots eaten (244 - 170)
    FRUIT_CHERRY: 'cherry',
    FRUIT_STRAWBERRY: 'strawberry',
    FRUIT_ORANGE: 'orange',
    FRUIT_APPLE: 'apple',
    SCORE_CHERRY: 100,
    SCORE_STRAWBERRY: 300,
    SCORE_ORANGE: 500,
    SCORE_APPLE: 700,

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

    // Ghost body — 16x16 (authentic arcade size)
    GHOST: [
        [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,2,2,1,1,1,1,1,2,2,1,1,1,1],  // 2 = white (eyes)
        [1,1,1,2,2,1,1,1,1,1,2,2,1,1,1,1],
        [1,1,1,3,3,1,1,1,1,1,3,3,1,1,1,1],  // 3 = blue (pupils)
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,0,1,1,0,0,1,1,0,0,1,1,0,1,1],  // Wavy bottom
        [1,0,0,0,1,1,1,1,1,1,1,1,0,0,0,1],
    ],

    // Frightened ghost — 16x16 (authentic arcade size)
    GHOST_FRIGHTENED: [
        [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,0,0,1,1,0,0,1,1,0,0,1,1,1,1],  // Zigzag eyes
        [1,1,0,0,1,1,0,0,1,1,0,0,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,0,0,1,1,0,0,1,1,0,0,1,1,1,1],  // Wavy mouth
        [1,0,0,1,1,0,0,1,1,0,0,1,1,0,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,0,1,1,0,0,1,1,0,0,1,1,0,1,1],  // Wavy bottom
        [1,0,0,0,1,1,1,1,1,1,1,1,0,0,0,1],
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
            [1,0,0,0,1],
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
        '/': [
            [0,0,0,0,0],
            [0,0,0,0,1],
            [0,0,0,1,0],
            [0,0,1,0,0],
            [0,1,0,0,0],
            [1,0,0,0,0],
            [0,0,0,0,0],
        ],
        '©': [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,1,1,1],
            [1,0,1,0,0],
            [1,0,1,1,1],
            [1,0,0,0,1],
            [0,1,1,1,0],
        ],
    },

    // Ghost eyes (shown when eaten, returning to house) — 6x3
    EYES_RIGHT: [[0,1,1,0,1,1],[0,1,1,0,1,1],[0,0,0,0,0,0]],
    EYES_LEFT:  [[1,1,0,1,1,0],[1,1,0,1,1,0],[0,0,0,0,0,0]],
    EYES_UP:    [[1,1,0,1,1,0],[0,1,0,0,1,0],[0,0,0,0,0,0]],
    EYES_DOWN:  [[0,0,0,0,0,0],[0,1,0,0,1,0],[1,1,0,1,1,0]],

    // Fruit sprites — 13x13 (authentic arcade appearance)
    CHERRY: [
        [0,0,0,0,0,1,1,1,0,0,0,0,0],
        [0,0,0,0,1,0,0,0,1,0,0,0,0],
        [0,0,0,1,0,0,0,0,0,1,0,0,0],
        [0,1,1,0,0,0,0,0,0,0,0,0,0],
        [1,1,1,0,0,0,0,0,0,0,1,1,0],
        [1,1,1,1,0,0,0,0,0,1,1,1,1],
        [1,1,1,1,0,0,0,0,1,1,1,1,1],
        [1,1,1,1,0,0,0,0,1,1,1,1,1],
        [1,1,1,1,0,0,0,0,0,1,1,1,1],
        [0,1,1,1,0,0,0,0,0,0,1,1,0],
        [0,0,1,1,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
    ],

    STRAWBERRY: [
        [0,0,0,0,1,0,0,0,1,0,0,0,0],
        [0,0,0,1,1,1,0,1,1,1,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,1,1,1,1,1,0,0],
        [0,0,0,1,1,1,1,1,1,1,0,0,0],
        [0,0,0,0,1,1,1,1,1,0,0,0,0],
        [0,0,0,0,0,1,1,1,0,0,0,0,0],
    ],

    ORANGE: [
        [0,0,0,0,0,1,1,1,0,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,1,1,1,1,1,0,0],
        [0,0,0,1,1,1,1,1,1,1,0,0,0],
        [0,0,0,0,0,1,1,1,0,0,0,0,0],
    ],

    APPLE: [
        [0,0,0,0,0,0,1,0,0,0,0,0,0],
        [0,0,0,0,0,1,0,1,0,0,0,0,0],
        [0,0,0,0,1,1,1,1,1,0,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,1,1,1,1,1,0,0],
        [0,0,0,1,1,1,1,1,1,1,0,0,0],
        [0,0,0,0,0,1,1,1,0,0,0,0,0],
    ],
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

        // Authentic wakka: discrete "munch" sounds alternating pitch
        // Triggered every 170ms for rhythmic "wakka wakka" effect
        this.wakkaIntervalId = setInterval(() => {
            if (!this.ctx || !this.wakkaPlaying) return;
            this.playWakkaMunch();
        }, 170);
    }

    playWakkaMunch() {
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        this.wakkaToggle = !this.wakkaToggle;

        // Create custom 4-bit waveform (Namco WSG authentic)
        // 4-bit = 16 amplitude levels, creates "crunchy" arcade sound
        const real = new Float32Array(32);
        const imag = new Float32Array(32);

        // Generate square-ish wave with 4-bit quantization
        for (let i = 0; i < 32; i++) {
            const t = i / 32;
            // Square wave with 4-bit stepped levels (0-15 mapped to -1 to 1)
            let value = t < 0.5 ? 1 : -1;
            // Quantize to 4-bit (16 levels)
            value = Math.round(value * 7.5) / 7.5;
            real[i] = value;
            imag[i] = 0;
        }

        const wave = this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.setPeriodicWave(wave);

        // Authentic Namco WSG wakka: rapid frequency alternation
        // Base around 440 Hz with quick drops
        const freq1 = this.wakkaToggle ? 500 : 400;  // Slightly higher pitch
        const freq2 = this.wakkaToggle ? 380 : 320;  // Quick drop

        // Use linear ramp for more "steppy" sound (not smooth exponential)
        osc.frequency.setValueAtTime(freq1, now);
        osc.frequency.linearRampToValueAtTime(freq2, now + 0.04);

        // Very short, punchy envelope (40ms total)
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    stopWakka() {
        if (!this.wakkaPlaying) return;
        this.wakkaPlaying = false;

        if (this.wakkaIntervalId) {
            clearInterval(this.wakkaIntervalId);
            this.wakkaIntervalId = null;
        }
    }

    playPowerPelletSiren() {
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const duration = 6.0;

        // Authentic power pellet siren: oscillating tone
        this.sirenOscillator = this.ctx.createOscillator();
        this.sirenGainNode = this.ctx.createGain();
        this.sirenLFO = this.ctx.createOscillator();

        const lfoGain = this.ctx.createGain();

        // Main oscillator - square wave for sharper arcade sound
        this.sirenOscillator.type = 'square';
        this.sirenOscillator.frequency.setValueAtTime(220, now);

        // LFO for frequency modulation (creates wailing siren effect)
        this.sirenLFO.type = 'triangle';
        this.sirenLFO.frequency.setValueAtTime(4.5, now); // 4.5 Hz for faster wail

        // LFO depth - modulates between 180-500 Hz (authentic range)
        lfoGain.gain.setValueAtTime(160, now);

        // Connect LFO to oscillator frequency
        this.sirenLFO.connect(lfoGain);
        lfoGain.connect(this.sirenOscillator.frequency);

        // Volume envelope - constant volume then fade
        this.sirenGainNode.gain.setValueAtTime(0.15, now);
        this.sirenGainNode.gain.setValueAtTime(0.15, now + duration - 0.5);
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
        const duration = 0.5;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Authentic ghost eaten: rising tone with square wave
        osc.type = 'square';

        // Ascending tone from 200 to 1200 Hz (authentic arcade range)
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + duration);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    playDeath() {
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const duration = 1.5;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Authentic death: descending portamento with square wave
        osc.type = 'square';

        // Descending from C5 (523 Hz) down to C2 (65 Hz) with portamento
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + duration);

        // Constant volume then quick fade
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.setValueAtTime(0.12, now + duration - 0.1);
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
        this.speed = CONFIG.BASE_SPEED * CONFIG.PACMAN_SPEED_NORMAL;
        this.pauseFrames = 0;  // Frame pause when eating dots (authentic arcade timing)

        // Animation
        this.mouthOpen = false;
        this.animTimer = 0;

        // State
        this.alive = true;
        this.deathAnimFrame = 0;
    }

    update(input, mazeWalls) {
        if (!this.alive) return;

        // Authentic dot-eating pause (1 frame per dot, 3 frames per power pellet)
        if (this.pauseFrames > 0) {
            this.pauseFrames--;
            return;  // Skip movement this frame
        }

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

        // Wrap X coordinate for tunnel (allows movement through screen edges)
        checkX = MathUtils.wrapX(checkX);

        // Also check the perpendicular edges to prevent wall clipping
        const tile = MathUtils.pixelToGrid(checkX, checkY);

        // Allow tunnel passage horizontally (rows 14-17 at edges)
        if (tile.row < 0 || tile.row >= CONFIG.MAZE_ROWS) {
            return false;
        }

        // For horizontal tunnel (rows 14-17), col may wrap
        if (tile.col < 0 || tile.col >= CONFIG.MAZE_COLS) {
            // Allow if in tunnel rows
            if (tile.row >= 14 && tile.row <= 17) {
                return true;
            }
            return false;
        }

        if (mazeWalls[tile.col] && mazeWalls[tile.col][tile.row]) {
            return false;
        }

        // Check perpendicular corners if moving diagonally or need edge checking
        if (dir.dx !== 0) {
            // Check top and bottom edges (wrap X for tunnel)
            const topX = MathUtils.wrapX(checkX);
            const bottomX = MathUtils.wrapX(checkX);
            const topTile = MathUtils.pixelToGrid(topX, nextY - radius);
            const bottomTile = MathUtils.pixelToGrid(bottomX, nextY + radius);

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
            // Check left and right edges (wrap X for tunnel)
            const leftX = MathUtils.wrapX(nextX - radius);
            const rightX = MathUtils.wrapX(nextX + radius);
            const leftTile = MathUtils.pixelToGrid(leftX, checkY);
            const rightTile = MathUtils.pixelToGrid(rightX, checkY);

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
        this.speed = CONFIG.BASE_SPEED * CONFIG.GHOST_SPEED_NORMAL;

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

        // Cruise Elroy (Blinky speed boost)
        this.elroyMode = 0;  // 0=normal, 1=elroy1, 2=elroy2

        // Animation
        this.frame = 0;
        this.animTimer = 0;
    }

    update(pacman, mazeWalls, powerPelletActive, ghosts) {
        if (this.mode === 'eaten') {
            // Eyes return to ghost house at high speed
            const targetCol = CONFIG.GHOST_HOUSE_COL;
            const targetRow = CONFIG.GHOST_HOUSE_ROW;

            // Check if reached ghost house
            const dist = MathUtils.manhattanDistance(this.col, this.row, targetCol, targetRow);
            if (dist <= 1) {
                // Respawn after delay
                this.respawnTimer--;
                if (this.respawnTimer <= 0) {
                    this.mode = 'scatter';
                    this.modeTimer = CONFIG.GHOST_SCATTER_DURATION;
                    this.speed = CONFIG.BASE_SPEED * CONFIG.GHOST_SPEED_NORMAL;
                }
                return;
            }

            // Navigate to ghost house
            const centerX = this.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            const centerY = this.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

            if (Math.abs(this.x - centerX) <= 0.5 && Math.abs(this.y - centerY) <= 0.5) {
                // At tile center, choose direction toward house
                this.targetCol = targetCol;
                this.targetRow = targetRow;
                const newDir = this.chooseDirection(mazeWalls);
                if (newDir) {
                    this.currentDir = newDir;
                }
                this.x = centerX;
                this.y = centerY;
            }

            // Move at double speed
            this.x += this.currentDir.dx * (CONFIG.BASE_SPEED * CONFIG.GHOST_SPEED_NORMAL * 2);
            this.y += this.currentDir.dy * (CONFIG.BASE_SPEED * CONFIG.GHOST_SPEED_NORMAL * 2);
            this.x = MathUtils.wrapX(this.x);

            const newTile = MathUtils.pixelToGrid(this.x, this.y);
            this.col = newTile.col;
            this.row = newTile.row;
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
                this.speed = CONFIG.BASE_SPEED * CONFIG.GHOST_SPEED_NORMAL;
            }
            // Flash white in last 2 seconds
            this.flashWhite = this.frightenedTimer < 120 && (Math.floor(this.frightenedTimer / 15) % 2 === 0);
        }

        // Calculate target tile (pass ghosts array for Inky's targeting)
        const target = this.calculateTarget(pacman, ghosts);
        this.targetCol = target.col;
        this.targetRow = target.row;

        // Choose direction at tile centers
        const centerX = this.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        const centerY = this.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

        if (Math.abs(this.x - centerX) <= 0.5 && Math.abs(this.y - centerY) <= 0.5) {
            // At tile center, choose new direction
            const newDir = this.chooseDirection(mazeWalls);
            if (newDir) {
                this.currentDir = newDir;
            }
            // Snap to center
            this.x = centerX;
            this.y = centerY;
        }

        // Move with tunnel speed reduction
        let moveSpeed = (this.mode === 'frightened') ?
            CONFIG.BASE_SPEED * CONFIG.GHOST_SPEED_FRIGHT : this.speed;

        // Check if in tunnel zones (left: cols 0-5, right: cols 22-27)
        // Ghosts slow to 40% base speed in tunnels, Pac-Man unaffected
        const inTunnel = (this.col <= 5 || this.col >= 22) && (this.row >= 14 && this.row <= 17);
        if (inTunnel) {
            moveSpeed = CONFIG.BASE_SPEED * CONFIG.GHOST_SPEED_TUNNEL;
        }

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
            // Authentic arcade timing: 7s/20s/7s/20s/5s/20s/5s/permanent chase
            // Wave 0: scatter 7s, Wave 1: chase 20s, Wave 2: scatter 7s, Wave 3: chase 20s,
            // Wave 4: scatter 5s, Wave 5: chase 20s, Wave 6: scatter 5s, Wave 7+: chase indefinitely
            this.modeIndex++;

            if (this.modeIndex === 1) {
                // After wave 0 scatter (7s), go to wave 1 chase (20s)
                this.mode = 'chase';
                this.modeTimer = CONFIG.GHOST_CHASE_DURATION;  // 20s = 1200 frames
            } else if (this.modeIndex === 2) {
                // After wave 1 chase, go to wave 2 scatter (7s)
                this.mode = 'scatter';
                this.modeTimer = CONFIG.GHOST_SCATTER_DURATION;  // 7s = 420 frames
            } else if (this.modeIndex === 3) {
                // After wave 2 scatter, go to wave 3 chase (20s)
                this.mode = 'chase';
                this.modeTimer = CONFIG.GHOST_CHASE_DURATION;  // 20s
            } else if (this.modeIndex === 4) {
                // After wave 3 chase, go to wave 4 scatter (5s)
                this.mode = 'scatter';
                this.modeTimer = 300;  // 5s = 300 frames
            } else if (this.modeIndex === 5) {
                // After wave 4 scatter, go to wave 5 chase (20s)
                this.mode = 'chase';
                this.modeTimer = CONFIG.GHOST_CHASE_DURATION;  // 20s
            } else if (this.modeIndex === 6) {
                // After wave 5 chase, go to wave 6 scatter (5s)
                this.mode = 'scatter';
                this.modeTimer = 300;  // 5s
            } else {
                // Wave 7+: permanent chase mode
                this.mode = 'chase';
                this.modeTimer = 999999;  // Effectively infinite
            }
        }
    }

    calculateTarget(pacman, ghosts) {
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
            // Authentic arcade ghost targeting algorithms:
            // - Blinky targets Pac-Man directly
            // - Pinky targets 4 tiles ahead of Pac-Man
            // - Inky uses complex calculation with Blinky's position
            // - Clyde targets Pac-Man when far, scatter corner when close

            if (this.type === 'blinky') {
                // Blinky: Direct pursuit of Pac-Man
                return { col: pacman.col, row: pacman.row };
            } else if (this.type === 'pinky') {
                // Pinky: Target 4 tiles ahead of Pac-Man's direction
                // AUTHENTIC BUG: When Pac-Man faces UP, overflow bug adds 4 LEFT as well
                let targetCol = pacman.col + pacman.currentDir.dx * 4;
                let targetRow = pacman.row + pacman.currentDir.dy * 4;

                // The famous Pinky UP bug (integer overflow in original Z80 code)
                if (pacman.currentDir.dy === -1 && pacman.currentDir.dx === 0) {
                    targetCol -= 4;  // Bug: also targets 4 tiles LEFT
                }

                return {
                    col: MathUtils.clamp(targetCol, 0, CONFIG.MAZE_COLS - 1),
                    row: MathUtils.clamp(targetRow, 0, CONFIG.MAZE_ROWS - 1)
                };
            } else if (this.type === 'inky') {
                // Inky: Authentic arcade targeting using Blinky's position
                // 1. Get position 2 tiles ahead of Pac-Man
                const pivotCol = pacman.col + pacman.currentDir.dx * 2;
                const pivotRow = pacman.row + pacman.currentDir.dy * 2;

                // 2. Find Blinky
                const blinky = ghosts ? ghosts.find(g => g.type === 'blinky') : null;
                if (!blinky) {
                    // Fallback if Blinky not found (shouldn't happen)
                    return { col: pivotCol, row: pivotRow };
                }

                // 3. Calculate vector from Blinky to pivot, then double it
                const vectorCol = pivotCol - blinky.col;
                const vectorRow = pivotRow - blinky.row;
                const targetCol = blinky.col + vectorCol * 2;
                const targetRow = blinky.row + vectorRow * 2;

                return {
                    col: MathUtils.clamp(targetCol, 0, CONFIG.MAZE_COLS - 1),
                    row: MathUtils.clamp(targetRow, 0, CONFIG.MAZE_ROWS - 1)
                };
            } else {
                // Clyde: Chase when far (>8 tiles), retreat to scatter corner when close
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

    setFrightened(level = 1) {
        if (this.mode === 'eaten') return;
        this.mode = 'frightened';
        // Level-based frightened duration (authentic arcade progression)
        const duration = CONFIG.GHOST_FRIGHTENED_DURATIONS[Math.min(level - 1, CONFIG.GHOST_FRIGHTENED_DURATIONS.length - 1)];
        this.frightenedTimer = duration;
        this.speed = CONFIG.BASE_SPEED * CONFIG.GHOST_SPEED_FRIGHT;
        this.flashWhite = false;
        // Reverse direction
        this.currentDir = { dx: -this.currentDir.dx, dy: -this.currentDir.dy };
    }

    setEaten() {
        this.mode = 'eaten';
        this.respawnTimer = CONFIG.GHOST_RESPAWN_DELAY;
        this.speed = CONFIG.BASE_SPEED * CONFIG.GHOST_SPEED_NORMAL * 2;  // Ghosts move fast when returning
    }

    setElroyMode(dotsRemaining) {
        // Only Blinky gets Cruise Elroy speed boost
        if (this.type !== 'blinky') return;

        // Level 1 thresholds: 20 dots for Elroy 1, 10 dots for Elroy 2
        // (In full game, these thresholds change by level)
        if (dotsRemaining <= 10) {
            this.elroyMode = 2;
            this.speed = CONFIG.BASE_SPEED * CONFIG.ELROY2_SPEED;  // 85% of base
        } else if (dotsRemaining <= 20) {
            this.elroyMode = 1;
            this.speed = CONFIG.BASE_SPEED * CONFIG.ELROY1_SPEED;  // 80% of base
        } else {
            this.elroyMode = 0;
            this.speed = CONFIG.BASE_SPEED * CONFIG.GHOST_SPEED_NORMAL;  // 75% of base
        }
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
        // Title
        this.drawText('PAC-MAN', CONFIG.LOGICAL_WIDTH / 2 - 35, 30, CONFIG.COLOR_PACMAN);

        // Character introductions (Namco style)
        this.drawText('CHARACTER / NICKNAME', CONFIG.LOGICAL_WIDTH / 2 - 75, 55, CONFIG.COLOR_TEXT);

        const ghostY = 75;
        const ghostData = [
            { color: CONFIG.COLOR_BLINKY, name: '-SHADOW', nick: 'BLINKY' },
            { color: CONFIG.COLOR_PINKY, name: '-SPEEDY', nick: 'PINKY' },
            { color: CONFIG.COLOR_INKY, name: '-BASHFUL', nick: 'INKY' },
            { color: CONFIG.COLOR_CLYDE, name: '-POKEY', nick: 'CLYDE' }
        ];

        for (let i = 0; i < 4; i++) {
            const y = ghostY + i * 18;
            // Draw ghost sprite
            this.drawSprite(SPRITES.GHOST, 20, y - 5, ghostData[i].color);
            // Draw name and nickname
            this.drawText(ghostData[i].name, 40, y, ghostData[i].color);
            this.drawText(ghostData[i].nick, 110, y, ghostData[i].color);
        }

        // Point values
        const dotY = 155;
        this.ctx.fillStyle = CONFIG.COLOR_DOT;
        this.ctx.beginPath();
        this.ctx.arc(30, dotY + 3, CONFIG.DOT_RADIUS, 0, Math.PI * 2);
        this.ctx.fill();
        this.drawText('10 PTS', 45, dotY, CONFIG.COLOR_TEXT);

        this.ctx.fillStyle = CONFIG.COLOR_POWER_PELLET;
        this.ctx.beginPath();
        this.ctx.arc(30, dotY + 18, CONFIG.POWER_PELLET_RADIUS, 0, Math.PI * 2);
        this.ctx.fill();
        this.drawText('50 PTS', 45, dotY + 15, CONFIG.COLOR_TEXT);

        // High score (with extra space above)
        this.drawText('HIGH SCORE', CONFIG.LOGICAL_WIDTH / 2 - 50, 205, CONFIG.COLOR_TEXT);
        this.drawText(state.highScore.toString(), CONFIG.LOGICAL_WIDTH / 2 - 20, 220, CONFIG.COLOR_PACMAN);

        // Press to start
        this.drawText('PRESS ENTER', CONFIG.LOGICAL_WIDTH / 2 - 54, 250, CONFIG.COLOR_PACMAN);

        // Copyright
        this.drawText('© 1980 NAMCO', CONFIG.LOGICAL_WIDTH / 2 - 54, 275, CONFIG.COLOR_TEXT);
    }

    renderReady(state) {
        this.ctx.save();
        this.ctx.translate(0, CONFIG.MAZE_OFFSET_Y);
        this.drawMaze(state.mazeWalls);
        this.drawDots(state.dots, state.powerPelletBlink);
        this.drawPacman(state.pacman);

        for (const ghost of state.ghosts) {
            this.drawGhost(ghost);
        }

        this.drawText('READY!', CONFIG.LOGICAL_WIDTH / 2 - 30, 140, CONFIG.COLOR_PACMAN);
        this.ctx.restore();
        this.drawHUD(state);
    }

    renderPlaying(state) {
        this.ctx.save();
        this.ctx.translate(0, CONFIG.MAZE_OFFSET_Y);
        this.drawMaze(state.mazeWalls);
        this.drawDots(state.dots, state.powerPelletBlink);
        this.drawPacman(state.pacman);

        for (const ghost of state.ghosts) {
            this.drawGhost(ghost);
        }

        // Draw fruit if active
        if (state.fruit) {
            const sprite = this.getFruitSprite(state.fruit.type);
            const color = this.getFruitColor(state.fruit.type);
            this.drawSprite(sprite, state.fruit.x - 6, state.fruit.y - 6, color);
        }

        for (const popup of state.scorePopups) {
            this.drawScorePopup(popup.score, popup.x, popup.y);
        }
        this.ctx.restore();
        this.drawHUD(state);
    }

    renderDeath(state) {
        this.ctx.save();
        this.ctx.translate(0, CONFIG.MAZE_OFFSET_Y);
        this.drawMaze(state.mazeWalls);
        this.drawDots(state.dots, state.powerPelletBlink);

        // Authentic death animation: freeze → spin → collapse
        const frame = state.pacman.deathAnimFrame;
        const FREEZE_FRAMES = 30;
        const SPIN_FRAMES = 60;
        const COLLAPSE_FRAMES = 30;

        if (frame < FREEZE_FRAMES) {
            // Phase 1: Freeze (show closed Pac-Man)
            this.drawSprite(SPRITES.PACMAN_CLOSED, state.pacman.x - 8, state.pacman.y - 8, CONFIG.COLOR_PACMAN);
        } else if (frame < FREEZE_FRAMES + SPIN_FRAMES) {
            // Phase 2: Spin (mouth opens in all 4 directions sequentially)
            const spinFrame = frame - FREEZE_FRAMES;
            const direction = Math.floor(spinFrame / 5) % 4;  // Change direction every 5 frames

            this.ctx.save();
            this.ctx.translate(state.pacman.x, state.pacman.y);

            // Rotate based on direction (0=right, 1=down, 2=left, 3=up)
            this.ctx.rotate(direction * Math.PI / 2);

            // Alternate between open and closed mouth
            const sprite = (Math.floor(spinFrame / 2.5) % 2 === 0) ? SPRITES.PACMAN_OPEN : SPRITES.PACMAN_CLOSED;
            this.drawSprite(sprite, -8, -8, CONFIG.COLOR_PACMAN);

            this.ctx.restore();
        } else if (frame < FREEZE_FRAMES + SPIN_FRAMES + COLLAPSE_FRAMES) {
            // Phase 3: Collapse (shrink to nothing)
            const collapseFrame = frame - FREEZE_FRAMES - SPIN_FRAMES;
            const scale = 1 - (collapseFrame / COLLAPSE_FRAMES);

            this.ctx.save();
            this.ctx.translate(state.pacman.x, state.pacman.y);
            this.ctx.rotate(Math.PI / 2);  // Face down during collapse
            this.ctx.scale(scale, scale);

            this.drawSprite(SPRITES.PACMAN_OPEN, -8, -8, CONFIG.COLOR_PACMAN);
            this.ctx.restore();
        }

        this.ctx.restore();
        this.drawHUD(state);
    }

    renderGameOver(state) {
        this.ctx.save();
        this.ctx.translate(0, CONFIG.MAZE_OFFSET_Y);
        this.drawMaze(state.mazeWalls);
        this.drawText('GAME OVER', CONFIG.LOGICAL_WIDTH / 2 - 45, 140, CONFIG.COLOR_TEXT);
        this.ctx.restore();
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
        if (ghost.mode === 'eaten') {
            // Draw eyes based on direction
            let eyeSprite = SPRITES.EYES_RIGHT;
            if (ghost.currentDir.dx < 0) eyeSprite = SPRITES.EYES_LEFT;
            else if (ghost.currentDir.dy < 0) eyeSprite = SPRITES.EYES_UP;
            else if (ghost.currentDir.dy > 0) eyeSprite = SPRITES.EYES_DOWN;
            this.drawSprite(eyeSprite, ghost.x - 3, ghost.y - 1, '#FFFFFF');
        } else {
            const sprite = (ghost.mode === 'frightened') ? SPRITES.GHOST_FRIGHTENED : SPRITES.GHOST;
            this.drawGhostSprite(sprite, ghost.x - 8, ghost.y - 8, ghost.getColor());
        }
    }

    drawGhostSprite(sprite, x, y, bodyColor) {
        // Ghost sprites use multi-color: 1=body, 2=white eyes, 3=blue pupils
        for (let row = 0; row < sprite.length; row++) {
            for (let col = 0; col < sprite[row].length; col++) {
                const pixel = sprite[row][col];
                if (pixel === 1) {
                    this.ctx.fillStyle = bodyColor;
                    this.ctx.fillRect(x + col, y + row, 1, 1);
                } else if (pixel === 2) {
                    this.ctx.fillStyle = '#FFFFFF';  // White eyes
                    this.ctx.fillRect(x + col, y + row, 1, 1);
                } else if (pixel === 3) {
                    this.ctx.fillStyle = '#2121DE';  // Blue pupils
                    this.ctx.fillRect(x + col, y + row, 1, 1);
                }
            }
        }
    }

    drawHUD(state) {
        // Clear full-width HUD zone above the maze
        this.ctx.fillStyle = CONFIG.COLOR_BG;
        this.ctx.fillRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.MAZE_OFFSET_Y);

        // Top-left: "1UP" label above score
        const scoreStr = state.score.toString().padStart(6, '0');
        this.drawText('1UP', 24, 2, CONFIG.COLOR_TEXT);
        this.drawText(scoreStr, 8, 11, CONFIG.COLOR_TEXT);

        // Top-center: "HIGH SCORE" label (always visible) with value
        this.drawText('HIGH SCORE', 100, 2, CONFIG.COLOR_TEXT);
        if (state.highScore > 0) {
            const highScoreStr = state.highScore.toString().padStart(6, '0');
            this.drawText(highScoreStr, 108, 11, CONFIG.COLOR_TEXT);
        }

        // Bottom-left: Lives remaining (in bottom margin area)
        const livesY = CONFIG.LOGICAL_HEIGHT - 8;
        for (let i = 0; i < state.lives - 1; i++) {  // Show remaining lives (not including current)
            this.ctx.fillStyle = CONFIG.COLOR_PACMAN;
            this.ctx.beginPath();
            this.ctx.arc(10 + i * 16, livesY, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Bottom-right: Collected fruits (in bottom margin area)
        if (state.fruitsCollected && state.fruitsCollected.length > 0) {
            for (let i = 0; i < Math.min(state.fruitsCollected.length, 7); i++) {
                const fruitType = state.fruitsCollected[i];
                const sprite = this.getFruitSprite(fruitType);
                const x = CONFIG.LOGICAL_WIDTH - 20 - (i * 16);
                this.drawSprite(sprite, x, CONFIG.LOGICAL_HEIGHT - 16, this.getFruitColor(fruitType));
            }
        }
    }

    getFruitSprite(fruitType) {
        switch (fruitType) {
            case CONFIG.FRUIT_CHERRY: return SPRITES.CHERRY;
            case CONFIG.FRUIT_STRAWBERRY: return SPRITES.STRAWBERRY;
            case CONFIG.FRUIT_ORANGE: return SPRITES.ORANGE;
            case CONFIG.FRUIT_APPLE: return SPRITES.APPLE;
            default: return SPRITES.CHERRY;
        }
    }

    getFruitColor(fruitType) {
        switch (fruitType) {
            case CONFIG.FRUIT_CHERRY: return '#FF0000';  // Red
            case CONFIG.FRUIT_STRAWBERRY: return '#FF8888';  // Light red
            case CONFIG.FRUIT_ORANGE: return '#FFAA00';  // Orange
            case CONFIG.FRUIT_APPLE: return '#00FF00';  // Green
            default: return '#FF0000';
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
        this.level = 1;

        this.readyTimer = 0;
        this.deathTimer = 0;
        this.gameOverTimer = 0;

        this.powerPelletActive = false;
        this.powerPelletTimer = 0;
        this.ghostComboCounter = 0;

        // Fruit system
        this.fruit = null;  // { type, x, y, timer }
        this.fruitSpawned1 = false;
        this.fruitSpawned2 = false;
        this.fruitsCollected = [];  // Track fruits collected this game

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
                // Authentic: 3 frame pause when eating power pellet
                this.pacman.pauseFrames = CONFIG.POWER_PELLET_EAT_PAUSE;
            } else {
                this.addScore(CONFIG.SCORE_DOT);
                // Authentic: 1 frame pause when eating normal dot
                this.pacman.pauseFrames = CONFIG.DOT_EAT_PAUSE;
            }

            // Update Cruise Elroy mode based on dots remaining
            const blinky = this.ghosts.find(g => g.type === 'blinky');
            if (blinky) {
                blinky.setElroyMode(this.dotsRemaining);
            }

            // Spawn fruit at specific dot counts
            if (!this.fruitSpawned1 && this.dotsRemaining === CONFIG.FRUIT_SPAWN_DOTS_1) {
                this.spawnFruit();
                this.fruitSpawned1 = true;
            }
            if (!this.fruitSpawned2 && this.dotsRemaining === CONFIG.FRUIT_SPAWN_DOTS_2) {
                this.spawnFruit();
                this.fruitSpawned2 = true;
            }
        }

        // Update fruit timer
        if (this.fruit) {
            this.fruit.timer--;
            if (this.fruit.timer <= 0) {
                this.fruit = null;
            }

            // Check fruit collection
            if (this.fruit) {
                const dist = Math.hypot(this.pacman.x - this.fruit.x, this.pacman.y - this.fruit.y);
                if (dist < 10) {
                    const score = this.getFruitScore(this.fruit.type);
                    this.addScore(score);
                    this.fruitsCollected.push(this.fruit.type);
                    this.fruit = null;
                    this.sound.playGhostEaten();  // Reuse ghost eaten sound for fruit
                }
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
            ghost.update(this.pacman, this.mazeWalls, this.powerPelletActive, this.ghosts);
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

        // Increment death animation frame (120 total frames for full animation)
        const TOTAL_DEATH_FRAMES = 120;  // 30 freeze + 60 spin + 30 collapse
        const elapsed = CONFIG.DEATH_DURATION - this.deathTimer;
        this.pacman.deathAnimFrame = Math.floor((elapsed / CONFIG.DEATH_DURATION) * TOTAL_DEATH_FRAMES);

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
        // Level-based frightened duration (authentic arcade progression)
        const level = this.level || 1;
        const duration = CONFIG.GHOST_FRIGHTENED_DURATIONS[Math.min(level - 1, CONFIG.GHOST_FRIGHTENED_DURATIONS.length - 1)];
        this.powerPelletTimer = duration;
        this.ghostComboCounter = 0;

        for (const ghost of this.ghosts) {
            ghost.setFrightened(level);
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

    spawnFruit() {
        // Determine fruit type based on level (simplified - always cherry for level 1)
        let fruitType = CONFIG.FRUIT_CHERRY;
        if (this.level >= 2) fruitType = CONFIG.FRUIT_STRAWBERRY;
        if (this.level >= 3) fruitType = CONFIG.FRUIT_ORANGE;
        if (this.level >= 5) fruitType = CONFIG.FRUIT_APPLE;

        this.fruit = {
            type: fruitType,
            x: CONFIG.FRUIT_SPAWN_COL * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
            y: CONFIG.FRUIT_SPAWN_ROW * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
            timer: CONFIG.FRUIT_DURATION
        };
    }

    getFruitScore(fruitType) {
        switch (fruitType) {
            case CONFIG.FRUIT_CHERRY: return CONFIG.SCORE_CHERRY;
            case CONFIG.FRUIT_STRAWBERRY: return CONFIG.SCORE_STRAWBERRY;
            case CONFIG.FRUIT_ORANGE: return CONFIG.SCORE_ORANGE;
            case CONFIG.FRUIT_APPLE: return CONFIG.SCORE_APPLE;
            default: return 100;
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
            scorePopups: this.scorePopups,
            fruit: this.fruit,
            fruitsCollected: this.fruitsCollected
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
