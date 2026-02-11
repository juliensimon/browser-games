'use strict';

// ── Section 1: CONFIG ──────────────────────────────────────────────────────────

const CONFIG = Object.freeze({
    LOGICAL_WIDTH: 256,
    LOGICAL_HEIGHT: 224,
    SCALE: 3,
    WIDTH: 768,
    HEIGHT: 672,

    PLAY_TOP: 16,
    PLAY_BOTTOM: 208,
    DIVIDER_X: 128,

    COWBOY_WIDTH: 16,
    COWBOY_HEIGHT: 24,
    COWBOY_SPEED: 1.0,
    COWBOY_AIM_POSITIONS: 7,
    COWBOY_WALK_RATE: 10,

    P1_MIN_X: 4,
    P1_MAX_X: 120,
    P2_MIN_X: 136,
    P2_MAX_X: 236,
    SPAWN_Y: 100,

    BULLET_SPEED: 3.0,
    BULLET_SIZE: 2,
    MAX_BULLETS: 6,
    RELOAD_TIME: 600,

    AIM_ANGLES: [-0.7854, -0.5236, -0.2618, 0, 0.2618, 0.5236, 0.7854],

    CACTUS_WIDTH: 8,
    CACTUS_HEIGHT: 24,
    CACTUS_HP: 3,
    TREE_WIDTH: 16,
    TREE_HEIGHT: 24,
    TREE_HP: 5,
    STAGECOACH_WIDTH: 24,
    STAGECOACH_HEIGHT: 16,
    STAGECOACH_SPEED: 0.5,

    ROUND_TIME: 5400,
    DEATH_FREEZE: 60,
    GOT_ME_DISPLAY: 45,

    AI_MOVE_SPEED: 0.8,
    AI_REACTION_DELAY: 15,
    AI_FIRE_DELAY_MIN: 30,
    AI_FIRE_DELAY_MAX: 90,
    AI_AIM_INACCURACY: 1,

    FPS: 60,
    FRAME_TIME: 16.667,
    MAX_DELTA: 200,

    COLOR: '#ffffff',
    BG_COLOR: '#000000',
});

// ── Section 2: Math Utilities ──────────────────────────────────────────────────

const MathUtils = {
    clamp(val, min, max) { return Math.max(min, Math.min(max, val)); },
    sign(val) { return val > 0 ? 1 : val < 0 ? -1 : 0; },
    rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    },
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1, dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },
};

// ── Section 3: Sprite/Shape Data ───────────────────────────────────────────────

const SPRITES = {};

// ── COWBOY BODY FRAME 0 — standing/idle, facing RIGHT (16×24) ──
// Authentic Gun Fight gunslinger: tall hat with indented crown,
// visible facial profile, vest with shirt gap, gun belt with holster,
// chaps over boots with pointed toes. Back hand rests at holster.
SPRITES.COWBOY_BODY_0 = [
    [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],  // 0  hat top (flat crown)
    [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],  // 1  hat crown sides
    [0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0],  // 2  crown dip (vintage indent)
    [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],  // 3  hat band
    [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],  // 4  wide brim
    [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],  // 5  forehead
    [0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0],  // 6  face: eye socket + nose bump
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],  // 7  chin / jaw
    [0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0],  // 8  neck (bandana)
    [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],  // 9  shoulders
    [0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0],  // 10 vest (gap = shirt)
    [0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0],  // 11 vest
    [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],  // 12 lower vest
    [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],  // 13 gun belt (wider)
    [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],  // 14 belt / holster
    [0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0],  // 15 hips
    [0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0],  // 16 upper legs (chaps)
    [0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0],  // 17 thighs
    [0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0],  // 18 knees
    [0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0],  // 19 shins
    [0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0],  // 20 lower shins
    [0,0,0,1,1,1,1,0,1,1,1,1,0,0,0,0],  // 21 boot tops (wider)
    [0,0,0,1,1,1,1,0,1,1,1,1,0,0,0,0],  // 22 boots
    [0,0,1,1,1,1,1,0,0,1,1,1,1,0,0,0],  // 23 pointed toe + heel
];

// ── COWBOY BODY FRAME 1 — shuffle step, facing RIGHT (16×24) ──
// Feet shuffling: one foot slightly forward, one back — subtle stride
SPRITES.COWBOY_BODY_1 = [
    [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],  // 0  hat top
    [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],  // 1  hat crown
    [0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0],  // 2  crown dip
    [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],  // 3  hat band
    [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],  // 4  wide brim
    [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],  // 5  forehead
    [0,0,0,0,0,1,0,1,1,1,1,0,0,0,0,0],  // 6  face
    [0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],  // 7  chin
    [0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0],  // 8  neck
    [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],  // 9  shoulders
    [0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0],  // 10 vest
    [0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0],  // 11 vest
    [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],  // 12 lower vest
    [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],  // 13 gun belt
    [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],  // 14 holster
    [0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0],  // 15 hips
    [0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0],  // 16 upper legs (closer)
    [0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0],  // 17 thighs shifting
    [0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0],  // 18 stride
    [0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0],  // 19 shins apart
    [0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0],  // 20 lower shins
    [0,0,1,1,1,1,0,0,1,1,1,1,0,0,0,0],  // 21 boot tops
    [0,0,1,1,1,1,0,0,1,1,1,1,0,0,0,0],  // 22 boots
    [0,1,1,1,1,1,0,0,0,1,1,1,1,0,0,0],  // 23 pointed toes + heels
];

// ── GUN ARM OVERLAYS — 7 aim positions ──
// Each arm shows bicep + forearm + visible pistol with barrel.
// The arm extends from the shoulder area rightward (P1 default).
// P2 arms are mirrored by the renderer.

// Position 0: aiming steeply up (-45°) — gun barrel points up-right
SPRITES.COWBOY_ARM_0 = {
    sprite: [
        [0,0,0,0,0,1,1],
        [0,0,0,0,1,1,0],
        [0,0,0,1,1,0,0],
        [0,0,1,1,0,0,0],
        [0,1,1,0,0,0,0],
        [1,1,1,0,0,0,0],
    ],
    offsetX: 9,
    offsetY: 3,
};

// Position 1: aiming up (-30°) — slight upward angle
SPRITES.COWBOY_ARM_1 = {
    sprite: [
        [0,0,0,0,0,0,1,1],
        [0,0,0,0,1,1,1,0],
        [0,0,0,1,1,0,0,0],
        [0,1,1,1,0,0,0,0],
        [1,1,1,0,0,0,0,0],
    ],
    offsetX: 9,
    offsetY: 4,
};

// Position 2: aiming slightly up (-15°)
SPRITES.COWBOY_ARM_2 = {
    sprite: [
        [0,0,0,0,0,0,0,1,1],
        [0,0,0,0,0,1,1,1,0],
        [0,0,1,1,1,1,0,0,0],
        [1,1,1,1,0,0,0,0,0],
    ],
    offsetX: 8,
    offsetY: 6,
};

// Position 3: aiming straight ahead (0°) — horizontal gun arm
SPRITES.COWBOY_ARM_3 = {
    sprite: [
        [0,0,0,0,0,0,0,0,1,1],
        [0,0,0,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,0,0],
        [1,1,0,0,0,0,0,0,0,0],
    ],
    offsetX: 7,
    offsetY: 7,
};

// Position 4: aiming slightly down (+15°)
SPRITES.COWBOY_ARM_4 = {
    sprite: [
        [1,1,1,1,0,0,0,0,0],
        [0,0,1,1,1,1,0,0,0],
        [0,0,0,0,0,1,1,1,0],
        [0,0,0,0,0,0,0,1,1],
    ],
    offsetX: 8,
    offsetY: 8,
};

// Position 5: aiming down (+30°)
SPRITES.COWBOY_ARM_5 = {
    sprite: [
        [1,1,1,0,0,0,0,0],
        [0,1,1,1,0,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,0,1,1,0,0],
        [0,0,0,0,0,1,1,1],
    ],
    offsetX: 9,
    offsetY: 8,
};

// Position 6: aiming steeply down (+45°) — gun barrel points down-right
SPRITES.COWBOY_ARM_6 = {
    sprite: [
        [1,1,1,0,0,0,0],
        [0,1,1,0,0,0,0],
        [0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0],
        [0,0,0,0,1,1,0],
        [0,0,0,0,0,1,1],
    ],
    offsetX: 9,
    offsetY: 8,
};

// ── DEATH SPRITE — cowboy fallen flat (22×10) ──
// Lying on back: hat fallen off to one side, body horizontal,
// one arm splayed, legs straight, gun dropped
SPRITES.COWBOY_DEAD = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0],  // 0  hat brim (fallen)
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0],  // 1  hat crown
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0],  // 2  hat + head top
    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0],  // 3  head / face
    [0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0],  // 4  shoulders (arm up)
    [0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,1,0,0,0,0],  // 5  torso + splayed arm
    [0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],  // 6  belt / hips
    [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],  // 7  upper legs
    [0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],  // 8  lower legs
    [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],  // 9  boots (pointed)
];

// ── SAGUARO CACTUS (8×24) ──
// Classic Arizona saguaro: thick trunk, two upturned arms,
// ribbed detail (alternating pixels for texture)
SPRITES.CACTUS = [
    [0,0,0,1,1,0,0,0],  // 0  top of trunk
    [0,0,0,1,1,0,0,0],  // 1  trunk
    [0,0,0,1,1,0,0,0],  // 2  trunk
    [0,0,0,1,1,0,0,0],  // 3  trunk
    [0,0,0,1,1,0,0,0],  // 4  trunk
    [0,0,0,1,1,0,1,0],  // 5  right arm starts (going down)
    [0,0,0,1,1,0,1,0],  // 6  right arm vertical
    [0,0,0,1,1,0,1,0],  // 7  right arm
    [0,0,0,1,1,1,1,0],  // 8  right arm joins trunk (elbow)
    [0,0,0,1,1,0,0,0],  // 9  trunk
    [1,0,0,1,1,0,0,0],  // 10 left arm starts
    [1,0,0,1,1,0,0,0],  // 11 left arm vertical
    [1,0,0,1,1,0,0,0],  // 12 left arm
    [1,1,1,1,1,0,0,0],  // 13 left arm joins trunk (elbow)
    [0,0,0,1,1,0,0,0],  // 14 trunk
    [0,0,0,1,1,0,0,0],  // 15 trunk
    [0,0,0,1,1,0,0,0],  // 16 trunk
    [0,0,0,1,1,0,0,0],  // 17 trunk
    [0,0,0,1,1,0,0,0],  // 18 trunk
    [0,0,0,1,1,0,0,0],  // 19 trunk
    [0,0,0,1,1,0,0,0],  // 20 trunk
    [0,0,0,1,1,0,0,0],  // 21 trunk
    [0,0,0,1,1,0,0,0],  // 22 trunk base
    [0,0,1,1,1,1,0,0],  // 23 root flare
];

// ── PINE TREE (16×24) ──
// Conifer / pine tree (per review: "pine trees" not round canopy).
// Triangular layered branches tapering to point, narrow trunk.
SPRITES.TREE = [
    [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],  // 0  tip
    [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],  // 1  top needle
    [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],  // 2  upper tier
    [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],  // 3  upper tier wider
    [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],  // 4  branch step-in
    [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],  // 5  mid-upper tier
    [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],  // 6  mid-upper tier wider
    [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],  // 7  mid-upper widest
    [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],  // 8  branch step-in
    [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],  // 9  mid-lower tier
    [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],  // 10 mid-lower wider
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],  // 11 mid-lower widest
    [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],  // 12 branch step-in
    [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],  // 13 lower tier
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],  // 14 lower wider
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],  // 15 base of canopy (widest)
    [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],  // 16 trunk
    [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],  // 17 trunk
    [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],  // 18 trunk
    [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],  // 19 trunk
    [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],  // 20 trunk
    [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],  // 21 trunk
    [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],  // 22 root flare
    [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],  // 23 root base
];

// ── COVERED WAGON / STAGECOACH (24×16) ──
// Classic western covered wagon: canvas top, wooden body with
// window openings, two spoked wheels, tongue/hitch at front
SPRITES.STAGECOACH = [
    [0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],  // 0  canvas top peak
    [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],  // 1  canvas top
    [0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0],  // 2  canvas sides
    [0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0],  // 3  upper body
    [0,0,1,1,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,1,1,0,0],  // 4  windows (4 openings)
    [0,0,1,1,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,1,1,0,0],  // 5  windows
    [0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0],  // 6  lower body
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // 7  floor / frame (full width)
    [0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0],  // 8  axle / springs
    [0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0],  // 9  wheel spokes top
    [0,0,1,1,0,0,1,0,1,1,0,0,0,0,1,1,0,1,0,0,1,1,0,0],  // 10 wheel with hub
    [0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0],  // 11 wheel
    [0,0,1,1,0,1,0,0,1,1,0,0,0,0,1,1,0,0,1,0,1,1,0,0],  // 12 wheel with hub
    [0,0,0,1,1,0,0,1,1,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0],  // 13 wheel spokes bottom
    [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0],  // 14 wheel rim bottom
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],  // 15 ground clearance
];

// ── BULLET (2×2) ──
SPRITES.BULLET_DOT = [
    [1,1],
    [1,1],
];

// ── FONT (5×7 pixel characters) ───────────────────────────────────────────────

const FONT = {
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
        [0,0,1,1,0],
        [0,1,0,0,0],
        [1,0,0,0,0],
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
        [1,0,1,0,1],
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
    ' ': [
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
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
    '/': [
        [0,0,0,0,1],
        [0,0,0,0,1],
        [0,0,0,1,0],
        [0,0,1,0,0],
        [0,1,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
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
    '-': [
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [1,1,1,1,1],
        [0,0,0,0,0],
        [0,0,0,0,0],
        [0,0,0,0,0],
    ],
    '(': [
        [0,0,0,1,0],
        [0,0,1,0,0],
        [0,1,0,0,0],
        [0,1,0,0,0],
        [0,1,0,0,0],
        [0,0,1,0,0],
        [0,0,0,1,0],
    ],
    ')': [
        [0,1,0,0,0],
        [0,0,1,0,0],
        [0,0,0,1,0],
        [0,0,0,1,0],
        [0,0,0,1,0],
        [0,0,1,0,0],
        [0,1,0,0,0],
    ],
};

SPRITES.FONT = FONT;

// ── Section 5: Input Handler ───────────────────────────────────────────────────

class InputHandler {
    constructor() {
        this._keys = {};
        this._keyDownBuffer = {};

        this._onKeyDown = (e) => {
            if (e.repeat) return;
            this._keys[e.code] = true;
            this._keyDownBuffer[e.code] = true;
        };
        this._onKeyUp = (e) => {
            this._keys[e.code] = false;
        };

        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
    }

    // Continuous held-key methods
    p1Up() { return !!this._keys['KeyW']; }
    p1Down() { return !!this._keys['KeyS']; }
    p1Left() { return !!this._keys['KeyA']; }
    p1Right() { return !!this._keys['KeyD']; }

    p2Up() { return !!this._keys['ArrowUp']; }
    p2Down() { return !!this._keys['ArrowDown']; }
    p2Left() { return !!this._keys['ArrowLeft']; }
    p2Right() { return !!this._keys['ArrowRight']; }

    // Just-pressed methods (consume from buffer)
    _justPressed(code) {
        if (this._keyDownBuffer[code]) {
            delete this._keyDownBuffer[code];
            return true;
        }
        return false;
    }

    p1AimUp() { return this._justPressed('KeyQ'); }
    p1AimDown() { return this._justPressed('KeyE'); }
    p1Fire() { return this._justPressed('KeyF'); }

    p2AimUp() { return this._justPressed('Comma'); }
    p2AimDown() { return this._justPressed('Period'); }
    p2Fire() { return this._justPressed('Slash'); }

    isStart() { return this._justPressed('Enter'); }
    isMode() { return this._justPressed('KeyM'); }

    clearBuffer() { this._keyDownBuffer = {}; }
}
// ── Section 4: Sound Engine ─────────────────────────────────────────────────

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.noiseBuffer = null;
    }

    init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate; // 1 second
        this.noiseBuffer = this.ctx.createBuffer(1, length, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    _ensureCtx() {
        if (!this.ctx) {
            this.init();
        }
    }

    _createNoise(duration, filterFreq, filterType) {
        const source = this.ctx.createBufferSource();
        source.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = filterType || 'lowpass';
        filter.frequency.value = filterFreq;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(this.ctx.currentTime);
        source.stop(this.ctx.currentTime + duration);
    }

    _createTone(freq, type, duration, startTime, volume) {
        const osc = this.ctx.createOscillator();
        osc.type = type || 'square';
        osc.frequency.value = freq;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume || 0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    gunshot() {
        this._ensureCtx();
        const now = this.ctx.currentTime;
        // Square wave pop
        this._createTone(150, 'square', 0.08, now, 0.25);
        // Noise burst
        this._createNoise(0.08, 800, 'lowpass');
    }

    hit() {
        this._ensureCtx();
        this._createNoise(0.2, 200, 'lowpass');
    }

    ricochet() {
        this._ensureCtx();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.06);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
    }

    obstacleHit() {
        this._ensureCtx();
        this._createNoise(0.1, 400, 'bandpass');
    }

    reloadComplete() {
        this._ensureCtx();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.15);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    roundStart() {
        this._ensureCtx();
        const now = this.ctx.currentTime;
        this._createTone(300, 'square', 0.1, now, 0.2);
        this._createTone(500, 'square', 0.1, now + 0.12, 0.2);
    }

    gameOver() {
        this._ensureCtx();
        const now = this.ctx.currentTime;
        this._createTone(500, 'square', 0.15, now, 0.2);
        this._createTone(400, 'square', 0.15, now + 0.2, 0.2);
        this._createTone(300, 'square', 0.15, now + 0.4, 0.2);
    }
}

// ── Section 6: Entity Classes ───────────────────────────────────────────────

class Cowboy {
    constructor(playerNum, x, y) {
        this.playerNum = playerNum;
        this.x = x;
        this.y = y;
        this.score = 0;
        this.aimIndex = 3;
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.alive = true;
        this.bulletsRemaining = CONFIG.MAX_BULLETS;
        this.reloading = false;
        this.reloadTimer = 0;
        this.deathTimer = 0;
        this.showGotMe = false;
        this.gotMeTimer = 0;
        this.facingRight = (playerNum === 1);
    }

    move(dx, dy) {
        if (!this.alive) return;

        // Walk animation
        if (dx !== 0 || dy !== 0) {
            this.walkTimer++;
            if (this.walkTimer >= CONFIG.COWBOY_WALK_RATE) {
                this.walkTimer = 0;
                this.walkFrame = (this.walkFrame + 1) % 2;
            }
        } else {
            this.walkTimer = 0;
            this.walkFrame = 0;
        }

        this.x += dx;
        this.y += dy;

        // Clamp to player bounds
        if (this.playerNum === 1) {
            this.x = MathUtils.clamp(this.x, CONFIG.P1_MIN_X, CONFIG.P1_MAX_X);
        } else {
            this.x = MathUtils.clamp(this.x, CONFIG.P2_MIN_X, CONFIG.P2_MAX_X);
        }
        this.y = MathUtils.clamp(this.y, CONFIG.PLAY_TOP, CONFIG.PLAY_BOTTOM - CONFIG.COWBOY_HEIGHT);
    }

    aimUp() {
        if (!this.alive) return;
        this.aimIndex = Math.max(0, this.aimIndex - 1);
    }

    aimDown() {
        if (!this.alive) return;
        this.aimIndex = Math.min(CONFIG.COWBOY_AIM_POSITIONS - 1, this.aimIndex + 1);
    }

    fire() {
        if (!this.alive || this.reloading || this.bulletsRemaining <= 0) return null;

        const muzzle = this.getMuzzlePosition();
        let angle = CONFIG.AIM_ANGLES[this.aimIndex];

        // Player 2 faces left, so mirror the angle
        if (!this.facingRight) {
            angle = Math.PI - angle;
        }

        this.bulletsRemaining--;
        if (this.bulletsRemaining <= 0) {
            this.reloading = true;
            this.reloadTimer = CONFIG.RELOAD_TIME;
        }

        return new Bullet(muzzle.x, muzzle.y, angle, this.playerNum);
    }

    getMuzzlePosition() {
        let mx;
        if (this.facingRight) {
            mx = this.x + CONFIG.COWBOY_WIDTH + 2;
        } else {
            mx = this.x - 2;
        }
        const my = this.y + 8 + (this.aimIndex - 3) * 2;
        return { x: mx, y: my };
    }

    die() {
        this.alive = false;
        this.deathTimer = CONFIG.DEATH_FREEZE;
        this.showGotMe = true;
        this.gotMeTimer = CONFIG.GOT_ME_DISPLAY;
    }

    respawn() {
        this.alive = true;
        this.y = CONFIG.SPAWN_Y;
        if (this.playerNum === 1) {
            this.x = CONFIG.P1_MIN_X + 16;
        } else {
            this.x = CONFIG.P2_MAX_X - 16;
        }
        this.aimIndex = 3;
        this.bulletsRemaining = CONFIG.MAX_BULLETS;
        this.reloading = false;
        this.reloadTimer = 0;
        this.deathTimer = 0;
        this.showGotMe = false;
        this.gotMeTimer = 0;
        this.walkFrame = 0;
        this.walkTimer = 0;
    }

    update() {
        if (!this.alive) {
            if (this.deathTimer > 0) this.deathTimer--;
            if (this.gotMeTimer > 0) this.gotMeTimer--;
            if (this.gotMeTimer <= 0) this.showGotMe = false;
            return;
        }
        if (this.reloading) {
            this.reloadTimer--;
            if (this.reloadTimer <= 0) {
                this.reloading = false;
                this.bulletsRemaining = CONFIG.MAX_BULLETS;
            }
        }
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            w: CONFIG.COWBOY_WIDTH,
            h: CONFIG.COWBOY_HEIGHT
        };
    }

    getSpriteState() {
        if (!this.alive) {
            return {
                bodyKey: 'COWBOY_DEAD',
                armKey: null,
                dead: true,
                facingRight: this.facingRight
            };
        }
        return {
            bodyKey: 'COWBOY_BODY_' + this.walkFrame,
            armKey: 'COWBOY_ARM_' + this.aimIndex,
            dead: false,
            facingRight: this.facingRight
        };
    }
}

class Bullet {
    constructor(x, y, angle, ownerNum) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * CONFIG.BULLET_SPEED;
        this.vy = Math.sin(angle) * CONFIG.BULLET_SPEED;
        this.ownerNum = ownerNum;
        this.alive = true;
        this.ricochets = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Off-screen horizontally → die
        if (this.x < 0 || this.x > CONFIG.LOGICAL_WIDTH) {
            this.alive = false;
        }
    }

    ricochetVertical() {
        this.vy = -this.vy;
        this.ricochets++;
        if (this.ricochets > 2) {
            this.alive = false;
        }
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            w: CONFIG.BULLET_SIZE,
            h: CONFIG.BULLET_SIZE
        };
    }
}

class Cactus {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.alive = true;
        this.hp = CONFIG.CACTUS_HP;
        this.destructible = true;
        this.type = 'cactus';
    }

    hit() {
        this.hp--;
        if (this.hp <= 0) {
            this.alive = false;
        }
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            w: CONFIG.CACTUS_WIDTH,
            h: CONFIG.CACTUS_HEIGHT
        };
    }
}

class Tree {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.alive = true;
        this.hp = CONFIG.TREE_HP;
        this.destructible = true;
        this.type = 'tree';
    }

    hit() {
        this.hp--;
        if (this.hp <= 0) {
            this.alive = false;
        }
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            w: CONFIG.TREE_WIDTH,
            h: CONFIG.TREE_HEIGHT
        };
    }
}

class Stagecoach {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.alive = true;
        this.destructible = false;
        this.vy = CONFIG.STAGECOACH_SPEED;
        this.type = 'stagecoach';
    }

    update() {
        this.y += this.vy;
        if (this.y <= CONFIG.PLAY_TOP) {
            this.y = CONFIG.PLAY_TOP;
            this.vy = Math.abs(this.vy);
        } else if (this.y >= CONFIG.PLAY_BOTTOM - CONFIG.STAGECOACH_HEIGHT) {
            this.y = CONFIG.PLAY_BOTTOM - CONFIG.STAGECOACH_HEIGHT;
            this.vy = -Math.abs(this.vy);
        }
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            w: CONFIG.STAGECOACH_WIDTH,
            h: CONFIG.STAGECOACH_HEIGHT
        };
    }
}

class AIController {
    constructor() {
        this.fireDelay = 0;
        this.reactionTimer = 0;
        this.targetAim = 3;
        this.moveDir = 0;
    }

    update(cowboy, opponent, bullets, obstacles) {
        const actions = { dx: 0, dy: 0, aimUp: false, aimDown: false, fire: false };

        // 1. Dodge bullets heading toward this cowboy
        let dodgeY = 0;
        for (let i = 0; i < bullets.length; i++) {
            const b = bullets[i];
            if (!b.alive || b.ownerNum === cowboy.playerNum) continue;

            // Check if bullet is heading toward us
            const headingToward = (cowboy.facingRight && b.vx < 0) ||
                                  (!cowboy.facingRight && b.vx > 0);
            if (!headingToward) continue;

            const dx = cowboy.x - b.x;
            const timeToReach = Math.abs(dx / b.vx);
            if (timeToReach > 60) continue; // too far away

            const predictedY = b.y + b.vy * timeToReach;
            const cowboyMidY = cowboy.y + CONFIG.COWBOY_HEIGHT / 2;

            if (Math.abs(predictedY - cowboyMidY) < CONFIG.COWBOY_HEIGHT) {
                // Need to dodge
                dodgeY = (predictedY > cowboyMidY) ? -1 : 1;
            }
        }

        // 2. Aim toward opponent (with inaccuracy)
        if (this.reactionTimer > 0) {
            this.reactionTimer--;
        } else {
            const dy = opponent.y + CONFIG.COWBOY_HEIGHT / 2 - (cowboy.y + CONFIG.COWBOY_HEIGHT / 2);
            const dist = MathUtils.distance(cowboy.x, cowboy.y, opponent.x, opponent.y);
            const angleToOpponent = Math.atan2(dy, dist);

            // Find closest aim index
            let bestIndex = 3;
            let bestDiff = Infinity;
            for (let i = 0; i < CONFIG.COWBOY_AIM_POSITIONS; i++) {
                const diff = Math.abs(CONFIG.AIM_ANGLES[i] - angleToOpponent);
                if (diff < bestDiff) {
                    bestDiff = diff;
                    bestIndex = i;
                }
            }

            // Apply inaccuracy
            this.targetAim = MathUtils.clamp(
                bestIndex + MathUtils.randomInt(-CONFIG.AI_AIM_INACCURACY, CONFIG.AI_AIM_INACCURACY),
                0,
                CONFIG.COWBOY_AIM_POSITIONS - 1
            );
            this.reactionTimer = CONFIG.AI_REACTION_DELAY;
        }

        // Adjust aim toward target
        if (cowboy.aimIndex < this.targetAim) {
            actions.aimDown = true;
        } else if (cowboy.aimIndex > this.targetAim) {
            actions.aimUp = true;
        }

        // 3. Fire with delay
        if (this.fireDelay > 0) {
            this.fireDelay--;
        } else if (cowboy.aimIndex === this.targetAim && cowboy.alive) {
            actions.fire = true;
            this.fireDelay = MathUtils.randomInt(CONFIG.AI_FIRE_DELAY_MIN, CONFIG.AI_FIRE_DELAY_MAX);
        }

        // 4. Move strategically — dodge takes priority, else align vertically
        if (dodgeY !== 0) {
            actions.dy = dodgeY * CONFIG.AI_MOVE_SPEED;
        } else {
            // Move toward vertical alignment with opponent
            const targetY = opponent.y;
            const diff = targetY - cowboy.y;
            if (Math.abs(diff) > 4) {
                actions.dy = MathUtils.sign(diff) * CONFIG.AI_MOVE_SPEED;
            }
        }

        // 5. Slight random horizontal movement
        if (Math.random() < 0.02) {
            this.moveDir = MathUtils.randomInt(-1, 1);
        }
        actions.dx = this.moveDir * CONFIG.AI_MOVE_SPEED * 0.5;

        return actions;
    }
}
// ── Section 7: Collision System ──────────────────────────────────────────────

const CollisionSystem = {
    checkBulletCowboy(bullets, cowboys) {
        const hits = [];
        for (let i = 0; i < bullets.length; i++) {
            const bullet = bullets[i];
            if (!bullet.alive) continue;
            const br = bullet.getRect();
            for (let j = 0; j < cowboys.length; j++) {
                const cowboy = cowboys[j];
                if (!cowboy.alive) continue;
                if (bullet.ownerNum === cowboy.playerNum) continue;
                const cr = cowboy.getRect();
                if (MathUtils.rectsOverlap(br.x, br.y, br.w, br.h, cr.x, cr.y, cr.w, cr.h)) {
                    bullet.alive = false;
                    hits.push({ bullet, cowboy });
                    break;
                }
            }
        }
        return hits;
    },

    checkBulletObstacle(bullets, obstacles) {
        const hits = [];
        for (let i = 0; i < bullets.length; i++) {
            const bullet = bullets[i];
            if (!bullet.alive) continue;
            const br = bullet.getRect();
            for (let j = 0; j < obstacles.length; j++) {
                const obstacle = obstacles[j];
                if (!obstacle.alive) continue;
                const or = obstacle.getRect();
                if (MathUtils.rectsOverlap(br.x, br.y, br.w, br.h, or.x, or.y, or.w, or.h)) {
                    bullet.alive = false;
                    hits.push({ bullet, obstacle });
                    break;
                }
            }
        }
        return hits;
    },

    checkBulletWalls(bullets) {
        const ricocheted = [];
        for (let i = 0; i < bullets.length; i++) {
            const bullet = bullets[i];
            if (!bullet.alive) continue;
            if (bullet.y < CONFIG.PLAY_TOP) {
                bullet.ricochetVertical();
                bullet.y = CONFIG.PLAY_TOP;
                ricocheted.push(bullet);
            } else if (bullet.y > CONFIG.PLAY_BOTTOM - CONFIG.BULLET_SIZE) {
                bullet.ricochetVertical();
                bullet.y = CONFIG.PLAY_BOTTOM - CONFIG.BULLET_SIZE;
                ricocheted.push(bullet);
            }
        }
        return ricocheted;
    },

    checkCowboyObstacle(cowboy, obstacles) {
        const cr = cowboy.getRect();
        for (let i = 0; i < obstacles.length; i++) {
            const obstacle = obstacles[i];
            if (!obstacle.alive) continue;
            const or = obstacle.getRect();
            if (MathUtils.rectsOverlap(cr.x, cr.y, cr.w, cr.h, or.x, or.y, or.w, or.h)) {
                return true;
            }
        }
        return false;
    }
};

// ── Section 8: Renderer ─────────────────────────────────────────────────────

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
    }

    drawSprite(sprite, x, y, color, mirror) {
        if (!sprite) return;
        color = color || CONFIG.COLOR;
        this.ctx.fillStyle = color;
        for (let row = 0; row < sprite.length; row++) {
            const cols = sprite[row];
            for (let col = 0; col < cols.length; col++) {
                if (cols[mirror ? cols.length - 1 - col : col]) {
                    this.ctx.fillRect(x + col, y + row, 1, 1);
                }
            }
        }
    }

    drawText(text, x, y, color, scale) {
        color = color || CONFIG.COLOR;
        scale = scale || 1;
        const font = SPRITES.FONT || FONT;
        const upper = text.toUpperCase();
        let cx = x;
        for (let i = 0; i < upper.length; i++) {
            const ch = upper[i];
            const glyph = font[ch];
            if (glyph) {
                for (let row = 0; row < glyph.length; row++) {
                    const cols = glyph[row];
                    for (let col = 0; col < cols.length; col++) {
                        if (cols[col]) {
                            this.ctx.fillStyle = color;
                            this.ctx.fillRect(cx + col * scale, y + row * scale, scale, scale);
                        }
                    }
                }
            }
            cx += 6 * scale;
        }
    }

    drawCenteredText(text, y, color, scale) {
        scale = scale || 1;
        const width = text.length * 6 * scale;
        const x = Math.floor((CONFIG.LOGICAL_WIDTH - width) / 2);
        this.drawText(text, x, y, color, scale);
    }

    drawCowboy(cowboy) {
        const state = cowboy.getSpriteState();
        const rect = cowboy.getRect();
        const cx = rect.x;
        const cy = rect.y;

        if (state.dead) {
            const deadSprite = SPRITES.COWBOY_DEAD;
            if (deadSprite) {
                const dx = cx + Math.floor((CONFIG.COWBOY_WIDTH - deadSprite[0].length) / 2);
                const dy = cy + Math.floor((CONFIG.COWBOY_HEIGHT - deadSprite.length) / 2);
                this.drawSprite(deadSprite, dx, dy, CONFIG.COLOR, false);
            }
            return;
        }

        // Draw body
        const bodySprite = SPRITES[state.bodyKey];
        if (bodySprite) {
            this.drawSprite(bodySprite, cx, cy, CONFIG.COLOR, !state.facingRight);
        }

        // Draw arm overlay
        if (state.armKey) {
            const armData = SPRITES[state.armKey];
            if (armData) {
                const armSprite = armData.sprite;
                let ox = armData.offsetX;
                let oy = armData.offsetY;
                if (!state.facingRight) {
                    ox = CONFIG.COWBOY_WIDTH - ox - armSprite[0].length;
                }
                this.drawSprite(armSprite, cx + ox, cy + oy, CONFIG.COLOR, !state.facingRight);
            }
        }
    }

    drawObstacles(obstacles) {
        for (let i = 0; i < obstacles.length; i++) {
            const obs = obstacles[i];
            if (!obs.alive) continue;
            const rect = obs.getRect();
            let spriteKey;
            if (obs.type === 'cactus') spriteKey = 'CACTUS';
            else if (obs.type === 'tree') spriteKey = 'TREE';
            else if (obs.type === 'stagecoach') spriteKey = 'STAGECOACH';
            const sprite = SPRITES[spriteKey];
            if (sprite) {
                this.drawSprite(sprite, rect.x, rect.y, CONFIG.COLOR, false);
            }
        }
    }

    drawBullets(bullets) {
        for (let i = 0; i < bullets.length; i++) {
            const bullet = bullets[i];
            if (!bullet.alive) continue;
            const rect = bullet.getRect();
            if (SPRITES.BULLET_DOT) {
                this.drawSprite(SPRITES.BULLET_DOT, rect.x, rect.y, CONFIG.COLOR, false);
            } else {
                this.ctx.fillStyle = CONFIG.COLOR;
                this.ctx.fillRect(rect.x, rect.y, CONFIG.BULLET_SIZE, CONFIG.BULLET_SIZE);
            }
        }
    }

    drawDivider() {
        this.ctx.fillStyle = CONFIG.COLOR;
        const segLen = 2;
        const gapLen = 4;
        let y = CONFIG.PLAY_TOP;
        while (y < CONFIG.PLAY_BOTTOM) {
            const drawLen = Math.min(segLen, CONFIG.PLAY_BOTTOM - y);
            this.ctx.fillRect(CONFIG.DIVIDER_X - 1, y, 2, drawLen);
            y += segLen + gapLen;
        }
    }

    drawBulletIndicators(cowboy1, cowboy2) {
        const indicatorY = 212;
        const dotSize = 2;
        const dotGap = 4;

        // P1 bullets — left side
        if (cowboy1.reloading) {
            this.drawText('RELOAD', 4, indicatorY, CONFIG.COLOR, 1);
        } else {
            for (let i = 0; i < cowboy1.bulletsRemaining; i++) {
                this.ctx.fillStyle = CONFIG.COLOR;
                this.ctx.fillRect(4 + i * dotGap, indicatorY, dotSize, dotSize);
            }
        }

        // P2 bullets — right side
        if (cowboy2.reloading) {
            this.drawText('RELOAD', CONFIG.LOGICAL_WIDTH - 40, indicatorY, CONFIG.COLOR, 1);
        } else {
            for (let i = 0; i < cowboy2.bulletsRemaining; i++) {
                this.ctx.fillStyle = CONFIG.COLOR;
                this.ctx.fillRect(CONFIG.LOGICAL_WIDTH - 4 - (CONFIG.MAX_BULLETS - i) * dotGap, indicatorY, dotSize, dotSize);
            }
        }
    }

    drawHUD(state) {
        // Top 16px bar
        this.ctx.fillStyle = CONFIG.BG_COLOR;
        this.ctx.fillRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.PLAY_TOP);

        // P1 score — left
        const p1Score = String(state.cowboy1.score);
        this.drawText(p1Score, 4, 4, CONFIG.COLOR, 1);

        // Timer — center
        const seconds = Math.ceil(state.roundTimer / 60);
        const timerStr = String(Math.max(0, seconds));
        this.drawCenteredText(timerStr, 4, CONFIG.COLOR, 1);

        // P2 score — right
        const p2Score = String(state.cowboy2.score);
        const p2Width = p2Score.length * 6;
        this.drawText(p2Score, CONFIG.LOGICAL_WIDTH - p2Width - 4, 4, CONFIG.COLOR, 1);
    }

    drawGotMe(cowboy) {
        if (cowboy.showGotMe && cowboy.gotMeTimer > 0) {
            const rect = cowboy.getRect();
            const textY = rect.y - 10;
            const textX = rect.x + Math.floor(CONFIG.COWBOY_WIDTH / 2) - 18;
            this.drawText('GOT ME!', textX, textY, CONFIG.COLOR, 1);
        }
    }

    drawAttractScreen(state) {
        // Title
        this.drawCenteredText('GUN FIGHT', 40, CONFIG.COLOR, 3);
        this.drawCenteredText('(1975)', 70, CONFIG.COLOR, 1);

        // Demo cowboys facing each other
        if (SPRITES.COWBOY_BODY_0) {
            const leftX = 80;
            const rightX = 160;
            const cowboyY = 100;
            this.drawSprite(SPRITES.COWBOY_BODY_0, leftX, cowboyY, CONFIG.COLOR, false);
            this.drawSprite(SPRITES.COWBOY_BODY_0, rightX, cowboyY, CONFIG.COLOR, true);
            // Cactus between them
            if (SPRITES.CACTUS) {
                this.drawSprite(SPRITES.CACTUS, 124, cowboyY, CONFIG.COLOR, false);
            }
        }

        // Controls
        this.drawCenteredText('P1: WASD MOVE  Q/E AIM  F FIRE', 140, CONFIG.COLOR, 1);
        this.drawCenteredText('P2: ARROWS MOVE  ./  AIM  / FIRE', 152, CONFIG.COLOR, 1);

        // Mode display
        const modeText = state.twoPlayerMode ? '2 PLAYER MODE' : '1 PLAYER MODE';
        this.drawCenteredText(modeText, 172, CONFIG.COLOR, 1);
        this.drawCenteredText('M TO CHANGE MODE', 184, CONFIG.COLOR, 1);

        // Blinking start prompt
        if (Math.floor(state.frameCount / 30) % 2 === 0) {
            this.drawCenteredText('PRESS ENTER TO START', 200, CONFIG.COLOR, 1);
        }
    }

    drawGameOver(state) {
        this.drawCenteredText('GAME OVER', 60, CONFIG.COLOR, 3);

        const s1 = state.cowboy1 ? state.cowboy1.score : 0;
        const s2 = state.cowboy2 ? state.cowboy2.score : 0;
        let resultText;
        if (s1 > s2) {
            resultText = 'PLAYER 1 WINS!';
        } else if (s2 > s1) {
            resultText = 'PLAYER 2 WINS!';
        } else {
            resultText = 'DRAW!';
        }
        this.drawCenteredText(resultText, 110, CONFIG.COLOR, 2);

        const scoreText = s1 + ' - ' + s2;
        this.drawCenteredText(scoreText, 140, CONFIG.COLOR, 2);

        if (Math.floor(state.frameCount / 30) % 2 === 0) {
            this.drawCenteredText('PRESS ENTER', 180, CONFIG.COLOR, 1);
        }
    }

    drawScanlines() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        for (let y = 0; y < CONFIG.LOGICAL_HEIGHT; y += 3) {
            this.ctx.fillRect(0, y, CONFIG.LOGICAL_WIDTH, 1);
        }
    }

    render(state) {
        this.ctx.save();
        this.ctx.scale(CONFIG.SCALE, CONFIG.SCALE);

        // Clear
        this.ctx.fillStyle = CONFIG.BG_COLOR;
        this.ctx.fillRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT);

        switch (state.state) {
            case 'attract':
                this.drawAttractScreen(state);
                break;
            case 'roundStart':
                this.drawHUD(state);
                this.drawDivider();
                this.drawObstacles(state.obstacles);
                this.drawCowboy(state.cowboy1);
                this.drawCowboy(state.cowboy2);
                this.drawBulletIndicators(state.cowboy1, state.cowboy2);
                this.drawCenteredText('READY', 100, CONFIG.COLOR, 2);
                break;
            case 'playing':
            case 'hit':
                this.drawHUD(state);
                this.drawDivider();
                this.drawObstacles(state.obstacles);
                this.drawBullets(state.bullets);
                this.drawCowboy(state.cowboy1);
                this.drawCowboy(state.cowboy2);
                this.drawGotMe(state.cowboy1);
                this.drawGotMe(state.cowboy2);
                this.drawBulletIndicators(state.cowboy1, state.cowboy2);
                break;
            case 'roundEnd':
                this.drawHUD(state);
                this.drawDivider();
                this.drawObstacles(state.obstacles);
                this.drawCowboy(state.cowboy1);
                this.drawCowboy(state.cowboy2);
                this.drawCenteredText('ROUND OVER', 100, CONFIG.COLOR, 2);
                break;
            case 'gameOver':
                this.drawGameOver(state);
                break;
        }

        this.drawScanlines();
        this.ctx.restore();
    }
}

// ── Section 9: Game State Machine ───────────────────────────────────────────

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.input = new InputHandler();
        this.sound = new SoundEngine();
        this.renderer = new Renderer(canvas);
        this.ai = new AIController();

        this.state = 'attract';
        this.twoPlayerMode = false;
        this.frameCount = 0;

        this.cowboy1 = null;
        this.cowboy2 = null;
        this.bullets = [];
        this.obstacles = [];
        this.roundTimer = 0;
        this.stateTimer = 0;
        this.winner = null;
    }

    startRound() {
        // Create cowboys at spawn positions
        this.cowboy1 = new Cowboy(1, CONFIG.P1_MIN_X + 20, CONFIG.SPAWN_Y);
        this.cowboy2 = new Cowboy(2, CONFIG.P2_MAX_X - 20, CONFIG.SPAWN_Y);

        // Clear bullets
        this.bullets = [];

        // Create initial obstacles — well-spaced around center
        this.obstacles = [];
        this.obstacles.push(new Cactus(CONFIG.DIVIDER_X - Math.floor(CONFIG.CACTUS_WIDTH / 2), 100));
        this.obstacles.push(new Tree(CONFIG.DIVIDER_X - 24, 40));
        this.obstacles.push(new Tree(CONFIG.DIVIDER_X + 8, 160));

        // Reset round timer
        this.roundTimer = CONFIG.ROUND_TIME;
    }

    _obstacleOverlaps(x, y, w, h) {
        for (const obs of this.obstacles) {
            if (!obs.alive) continue;
            const r = obs.getRect();
            if (MathUtils.rectsOverlap(x, y, w, h, r.x, r.y, r.w, r.h)) return true;
        }
        return false;
    }

    spawnObstacle() {
        // Randomly add a new obstacle during play
        const types = ['cactus', 'tree', 'stagecoach'];
        const type = types[Math.floor(Math.random() * types.length)];
        let y, x, w, h;
        if (type === 'cactus') { w = CONFIG.CACTUS_WIDTH; h = CONFIG.CACTUS_HEIGHT; }
        else if (type === 'tree') { w = CONFIG.TREE_WIDTH; h = CONFIG.TREE_HEIGHT; }
        else { w = CONFIG.STAGECOACH_WIDTH; h = CONFIG.STAGECOACH_HEIGHT; }

        // Try up to 10 times to find a non-overlapping position
        let placed = false;
        for (let attempt = 0; attempt < 10; attempt++) {
            y = CONFIG.PLAY_TOP + 20 + Math.floor(Math.random() * (CONFIG.PLAY_BOTTOM - CONFIG.PLAY_TOP - 60));
            x = CONFIG.DIVIDER_X - 24 + Math.floor(Math.random() * 48);
            if (!this._obstacleOverlaps(x, y, w, h)) {
                placed = true;
                break;
            }
        }
        if (!placed) return; // couldn't find a spot

        if (type === 'cactus') {
            this.obstacles.push(new Cactus(x, y));
        } else if (type === 'tree') {
            this.obstacles.push(new Tree(x, y));
        } else {
            this.obstacles.push(new Stagecoach(x, y));
        }
    }

    handleP1Input() {
        if (!this.cowboy1 || !this.cowboy1.alive) return;

        let dx = 0;
        let dy = 0;
        if (this.input.p1Left()) dx -= CONFIG.COWBOY_SPEED;
        if (this.input.p1Right()) dx += CONFIG.COWBOY_SPEED;
        if (this.input.p1Up()) dy -= CONFIG.COWBOY_SPEED;
        if (this.input.p1Down()) dy += CONFIG.COWBOY_SPEED;

        if (dx !== 0 || dy !== 0) {
            const prevX = this.cowboy1.x;
            const prevY = this.cowboy1.y;
            this.cowboy1.move(dx, dy);

            // Clamp to P1 bounds
            if (this.cowboy1.x < CONFIG.P1_MIN_X) this.cowboy1.x = CONFIG.P1_MIN_X;
            if (this.cowboy1.x > CONFIG.P1_MAX_X) this.cowboy1.x = CONFIG.P1_MAX_X;
            if (this.cowboy1.y < CONFIG.PLAY_TOP) this.cowboy1.y = CONFIG.PLAY_TOP;
            if (this.cowboy1.y > CONFIG.PLAY_BOTTOM - CONFIG.COWBOY_HEIGHT) this.cowboy1.y = CONFIG.PLAY_BOTTOM - CONFIG.COWBOY_HEIGHT;

            // Check obstacle collision — revert if overlapping
            if (CollisionSystem.checkCowboyObstacle(this.cowboy1, this.obstacles)) {
                this.cowboy1.x = prevX;
                this.cowboy1.y = prevY;
            }
        }

        if (this.input.p1AimUp()) this.cowboy1.aimUp();
        if (this.input.p1AimDown()) this.cowboy1.aimDown();

        if (this.input.p1Fire()) {
            const bullet = this.cowboy1.fire();
            if (bullet) {
                this.bullets.push(bullet);
                this.sound.gunshot();
            }
        }
    }

    handleP2Input() {
        if (!this.cowboy2 || !this.cowboy2.alive) return;

        if (this.twoPlayerMode) {
            let dx = 0;
            let dy = 0;
            if (this.input.p2Left()) dx -= CONFIG.COWBOY_SPEED;
            if (this.input.p2Right()) dx += CONFIG.COWBOY_SPEED;
            if (this.input.p2Up()) dy -= CONFIG.COWBOY_SPEED;
            if (this.input.p2Down()) dy += CONFIG.COWBOY_SPEED;

            if (dx !== 0 || dy !== 0) {
                const prevX = this.cowboy2.x;
                const prevY = this.cowboy2.y;
                this.cowboy2.move(dx, dy);

                // Clamp to P2 bounds
                if (this.cowboy2.x < CONFIG.P2_MIN_X) this.cowboy2.x = CONFIG.P2_MIN_X;
                if (this.cowboy2.x > CONFIG.P2_MAX_X) this.cowboy2.x = CONFIG.P2_MAX_X;
                if (this.cowboy2.y < CONFIG.PLAY_TOP) this.cowboy2.y = CONFIG.PLAY_TOP;
                if (this.cowboy2.y > CONFIG.PLAY_BOTTOM - CONFIG.COWBOY_HEIGHT) this.cowboy2.y = CONFIG.PLAY_BOTTOM - CONFIG.COWBOY_HEIGHT;

                if (CollisionSystem.checkCowboyObstacle(this.cowboy2, this.obstacles)) {
                    this.cowboy2.x = prevX;
                    this.cowboy2.y = prevY;
                }
            }

            if (this.input.p2AimUp()) this.cowboy2.aimUp();
            if (this.input.p2AimDown()) this.cowboy2.aimDown();

            if (this.input.p2Fire()) {
                const bullet = this.cowboy2.fire();
                if (bullet) {
                    this.bullets.push(bullet);
                    this.sound.gunshot();
                }
            }
        } else {
            // AI controls P2
            const aiAction = this.ai.update(this.cowboy2, this.cowboy1, this.bullets, this.obstacles);

            if (aiAction.dx !== 0 || aiAction.dy !== 0) {
                const prevX = this.cowboy2.x;
                const prevY = this.cowboy2.y;
                this.cowboy2.move(aiAction.dx, aiAction.dy);

                if (this.cowboy2.x < CONFIG.P2_MIN_X) this.cowboy2.x = CONFIG.P2_MIN_X;
                if (this.cowboy2.x > CONFIG.P2_MAX_X) this.cowboy2.x = CONFIG.P2_MAX_X;
                if (this.cowboy2.y < CONFIG.PLAY_TOP) this.cowboy2.y = CONFIG.PLAY_TOP;
                if (this.cowboy2.y > CONFIG.PLAY_BOTTOM - CONFIG.COWBOY_HEIGHT) this.cowboy2.y = CONFIG.PLAY_BOTTOM - CONFIG.COWBOY_HEIGHT;

                if (CollisionSystem.checkCowboyObstacle(this.cowboy2, this.obstacles)) {
                    this.cowboy2.x = prevX;
                    this.cowboy2.y = prevY;
                }
            }

            if (aiAction.aimUp) this.cowboy2.aimUp();
            if (aiAction.aimDown) this.cowboy2.aimDown();

            if (aiAction.fire) {
                const bullet = this.cowboy2.fire();
                if (bullet) {
                    this.bullets.push(bullet);
                    this.sound.gunshot();
                }
            }
        }
    }

    updatePlaying() {
        this.roundTimer--;

        // Handle input
        this.handleP1Input();
        this.handleP2Input();

        // Update entities
        this.cowboy1.update();
        this.cowboy2.update();
        for (let i = 0; i < this.bullets.length; i++) {
            this.bullets[i].update();
        }
        for (let i = 0; i < this.obstacles.length; i++) {
            if (this.obstacles[i].update) {
                this.obstacles[i].update();
            }
        }

        // Remove off-screen bullets (left/right)
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            if (b.x < -10 || b.x > CONFIG.LOGICAL_WIDTH + 10) {
                b.alive = false;
            }
        }

        // Collisions: bullet vs walls
        const ricocheted = CollisionSystem.checkBulletWalls(this.bullets);
        for (let i = 0; i < ricocheted.length; i++) {
            this.sound.ricochet();
        }

        // Collisions: bullet vs obstacles
        const obstacleHits = CollisionSystem.checkBulletObstacle(this.bullets, this.obstacles);
        for (let i = 0; i < obstacleHits.length; i++) {
            obstacleHits[i].obstacle.hit();
            this.sound.obstacleHit();
        }

        // Collisions: bullet vs cowboys
        const cowboyHits = CollisionSystem.checkBulletCowboy(this.bullets, [this.cowboy1, this.cowboy2]);
        if (cowboyHits.length > 0) {
            for (let i = 0; i < cowboyHits.length; i++) {
                const hit = cowboyHits[i];
                hit.cowboy.die();
                this.sound.hit();

                // Award point to shooter
                if (hit.bullet.ownerNum === 1) {
                    this.cowboy1.score++;
                } else {
                    this.cowboy2.score++;
                }
            }
            this.state = 'hit';
            this.stateTimer = CONFIG.DEATH_FREEZE;
        }

        // Remove dead bullets
        this.bullets = this.bullets.filter(b => b.alive);

        // Round timer expired
        if (this.roundTimer <= 0) {
            this.state = 'roundEnd';
            this.stateTimer = 120;
        }
    }

    updateHit() {
        this.stateTimer--;

        // Update cowboy timers (for gotMe display etc.)
        this.cowboy1.update();
        this.cowboy2.update();

        if (this.stateTimer <= 0) {
            // Respawn dead cowboys
            if (!this.cowboy1.alive) this.cowboy1.respawn();
            if (!this.cowboy2.alive) this.cowboy2.respawn();

            // Maybe spawn a new obstacle (25% chance)
            if (Math.random() < 0.25) {
                this.spawnObstacle();
            }

            this.state = 'playing';
        }
    }

    updateAttract() {
        if (this.input.isMode()) {
            this.twoPlayerMode = !this.twoPlayerMode;
        }
        if (this.input.isStart()) {
            this.startRound();
            this.state = 'roundStart';
            this.stateTimer = 120;
            this.sound.roundStart();
        }
    }

    updateRoundStart() {
        this.stateTimer--;
        if (this.stateTimer <= 0) {
            this.state = 'playing';
        }
    }

    updateRoundEnd() {
        this.stateTimer--;
        if (this.stateTimer <= 0) {
            // Determine winner
            const s1 = this.cowboy1.score;
            const s2 = this.cowboy2.score;
            if (s1 > s2) {
                this.winner = 'P1';
            } else if (s2 > s1) {
                this.winner = 'P2';
            } else {
                this.winner = 'DRAW';
            }
            this.state = 'gameOver';
            this.stateTimer = 180;
            this.sound.gameOver();
        }
    }

    updateGameOver() {
        this.stateTimer--;
        if (this.stateTimer <= 0 || this.input.isStart()) {
            this.state = 'attract';
            this.cowboy1 = null;
            this.cowboy2 = null;
            this.bullets = [];
            this.obstacles = [];
        }
    }

    getState() {
        return {
            state: this.state,
            cowboy1: this.cowboy1,
            cowboy2: this.cowboy2,
            bullets: this.bullets,
            obstacles: this.obstacles,
            roundTimer: this.roundTimer,
            twoPlayerMode: this.twoPlayerMode,
            stateTimer: this.stateTimer,
            winner: this.winner,
            frameCount: this.frameCount
        };
    }

    update() {
        switch (this.state) {
            case 'attract':
                this.updateAttract();
                break;
            case 'roundStart':
                this.updateRoundStart();
                break;
            case 'playing':
                this.updatePlaying();
                break;
            case 'hit':
                this.updateHit();
                break;
            case 'roundEnd':
                this.updateRoundEnd();
                break;
            case 'gameOver':
                this.updateGameOver();
                break;
        }

        this.frameCount++;
        this.input.clearBuffer();
    }
}

// ── Section 10: Main Loop ───────────────────────────────────────────────────

(function() {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = CONFIG.WIDTH;
    canvas.height = CONFIG.HEIGHT;
    const game = new Game(canvas);
    let lastTime = 0;
    let accumulator = 0;
    function gameLoop(timestamp) {
        const delta = Math.min(timestamp - lastTime, CONFIG.MAX_DELTA);
        lastTime = timestamp;
        accumulator += delta;
        while (accumulator >= CONFIG.FRAME_TIME) {
            game.update();
            accumulator -= CONFIG.FRAME_TIME;
        }
        game.renderer.render(game.getState());
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
})();
