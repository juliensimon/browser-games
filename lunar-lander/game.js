'use strict';

// ===== SECTION 1: CONFIG =====

const CONFIG = Object.freeze({
    // Display
    WIDTH: 1024,
    HEIGHT: 768,

    // World
    WORLD_WIDTH: 8192,
    WORLD_HEIGHT: 4096,
    TERRAIN_POINTS: 256,

    // Zoom
    ZOOM_MIN: 0.08,
    ZOOM_MAX: 2.0,
    ZOOM_ALT_HIGH: 3500,
    ZOOM_ALT_LOW: 200,
    ZOOM_LERP_SPEED: 0.03,

    // Lander physics
    LANDER_ROTATION_SPEED: 3,
    LANDER_THRUST_POWER: 0.04,
    LANDER_MAX_SPEED: 8,
    LANDER_RADIUS: 12,

    // Gravity per mission
    GRAVITY_TRAINING: 0.01,
    GRAVITY_CADET: 0.02,
    GRAVITY_PRIME: 0.035,
    GRAVITY_COMMAND: 0.02,
    FRICTION: 0.998,

    // Fuel
    FUEL_MAX: 750,
    FUEL_BURN_RATE: 0.5,
    FUEL_LOW_THRESHOLD: 100,
    FUEL_ABORT_COST: 150,
    FUEL_GOOD_LANDING_BONUS: 50,

    // Landing thresholds
    CRASH_VERT_SPEED: 2.5,
    CRASH_HORIZ_SPEED: 5.0,
    HARD_VERT_SPEED: 0.8,
    LANDING_ANGLE_TOLERANCE: 15,

    // Pad sizes
    PAD_WIDTH_1X: 200,
    PAD_WIDTH_2X: 120,
    PAD_WIDTH_5X: 60,

    // Scoring
    SCORE_GOOD_LANDING: 50,
    SCORE_HARD_LANDING: 15,
    SCORE_CRASH: 5,
    PAD_MULTIPLIERS: [1, 2, 5, 2, 1],

    // Missions
    MISSION_NAMES: ['TRAINING', 'CADET', 'PRIME', 'COMMAND'],

    // Abort
    ABORT_ROTATION_SPEED: 8,

    // Particles
    EXPLOSION_PARTICLE_COUNT: 30,
    EXPLOSION_PARTICLE_SPEED: 4,
    LANDING_PARTICLE_COUNT: 8,
    LANDING_PARTICLE_SPEED: 1.5,

    // Flag
    FLAG_HEIGHT: 15,

    // Timers
    RESPAWN_DELAY: 2000,
    GAME_OVER_DURATION: 4000,
    MISSION_SELECT_BLINK_RATE: 500,

    // Rendering
    GLOW_COLOR: 'rgba(200, 255, 255, 1)',
    DIM_GLOW_COLOR: 'rgba(200, 255, 255, 0.7)',
    STROKE_COLOR: '#ffffff',
    TERRAIN_COLOR: '#88ccff',
    PAD_COLOR: '#88ccff',
    HUD_COLOR: '#88ccff',
    PHOSPHOR_ALPHA: 0.15,
    VIGNETTE_STRENGTH: 0.4,

    // Audio
    LOW_FUEL_BEEP_INTERVAL: 500,

    // Physics
    FPS: 60,
    FRAME_TIME: 1000 / 60,
    MAX_DELTA: 200,
});

// ===== SECTION 2: MATH UTILITIES =====

const MathUtils = {
    degToRad(deg) {
        return deg * Math.PI / 180;
    },

    clamp(val, min, max) {
        return val < min ? min : val > max ? max : val;
    },

    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    inverseLerp(a, b, val) {
        if (a === b) return 0;
        return MathUtils.clamp((val - a) / (b - a), 0, 1);
    },

    smoothstep(a, b, t) {
        const x = MathUtils.clamp((t - a) / (b - a), 0, 1);
        return x * x * (3 - 2 * x);
    },

    lineSegmentIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(denom) < 1e-10) return null;

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: x1 + t * (x2 - x1),
                y: y1 + t * (y2 - y1)
            };
        }
        return null;
    },

    rotatePoint(x, y, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [x * cos - y * sin, x * sin + y * cos];
    },

    randomRange(min, max) {
        return min + Math.random() * (max - min);
    },

    randomInt(min, max) {
        return Math.floor(MathUtils.randomRange(min, max + 1));
    }
};

// ===== SECTION 3: SHAPES + TERRAIN GENERATION =====

const SHAPES = {
    // Apollo-style lunar module silhouette — boxy body with antenna, angled descent stage
    LANDER_BODY: [
        [0, -12],    // antenna top
        [-2, -10],   // antenna base left
        [-2, -8],    // cabin top left
        [-5, -6],    // shoulder left
        [-6, -3],    // body left upper
        [-7, 2],     // body left lower
        [-6, 6],     // descent stage left
        [6, 6],      // descent stage right
        [7, 2],      // body right lower
        [6, -3],     // body right upper
        [5, -6],     // shoulder right
        [2, -8],     // cabin top right
        [2, -10],    // antenna base right
    ],

    // Left landing leg — extends outward from descent stage
    LANDER_LEG_LEFT: [[-6, 5], [-10, 10], [-12, 10]],

    // Right landing leg — mirror of left
    LANDER_LEG_RIGHT: [[6, 5], [10, 10], [12, 10]],

    // Exhaust flame triangle below descent stage
    LANDER_FLAME: [[-3, 6], [0, 14], [3, 6]],

    // Cockpit window on upper body
    LANDER_WINDOW: [[-2, -5], [0, -7], [2, -5]],

    // Crash debris — 5 short line segment pairs
    DEBRIS: [
        [[-3, -2], [3, 2]],
        [[-2, -3], [2, 1]],
        [[1, -2], [-1, 3]],
        [[-1, -1], [2, -3]],
        [[0, 2], [-3, 0]]
    ],

    // Flag planted on successful landing
    FLAG: {
        pole: [[0, 0], [0, -15]],
        pennant: [[0, -15], [8, -12], [0, -9]]
    },

    // Vector font data — each character is an array of polylines
    FONT: {
        'A': [[[0,7],[0,2],[1,0],[4,0],[5,2],[5,7]], [[0,4],[5,4]]],
        'B': [[[0,7],[0,0],[4,0],[5,1],[5,3],[4,3.5],[5,4],[5,6],[4,7],[0,7]], [[0,3.5],[4,3.5]]],
        'C': [[[5,1],[4,0],[1,0],[0,1],[0,6],[1,7],[4,7],[5,6]]],
        'D': [[[0,0],[0,7],[3,7],[5,5],[5,2],[3,0],[0,0]]],
        'E': [[[5,0],[0,0],[0,7],[5,7]], [[0,3.5],[3,3.5]]],
        'F': [[[5,0],[0,0],[0,7]], [[0,3.5],[3,3.5]]],
        'G': [[[5,1],[4,0],[1,0],[0,1],[0,6],[1,7],[4,7],[5,6],[5,3.5],[3,3.5]]],
        'H': [[[0,0],[0,7]], [[5,0],[5,7]], [[0,3.5],[5,3.5]]],
        'I': [[[1,0],[4,0]], [[2.5,0],[2.5,7]], [[1,7],[4,7]]],
        'J': [[[1,0],[5,0]], [[3.5,0],[3.5,6],[2.5,7],[1,7],[0,6]]],
        'K': [[[0,0],[0,7]], [[5,0],[0,3.5],[5,7]]],
        'L': [[[0,0],[0,7],[5,7]]],
        'M': [[[0,7],[0,0],[2.5,3],[5,0],[5,7]]],
        'N': [[[0,7],[0,0],[5,7],[5,0]]],
        'O': [[[1,0],[4,0],[5,1],[5,6],[4,7],[1,7],[0,6],[0,1],[1,0]]],
        'P': [[[0,7],[0,0],[4,0],[5,1],[5,3],[4,4],[0,4]]],
        'Q': [[[1,0],[4,0],[5,1],[5,6],[4,7],[1,7],[0,6],[0,1],[1,0]], [[3,5],[5,7]]],
        'R': [[[0,7],[0,0],[4,0],[5,1],[5,3],[4,4],[0,4]], [[3,4],[5,7]]],
        'S': [[[5,1],[4,0],[1,0],[0,1],[0,3],[1,3.5],[4,3.5],[5,4],[5,6],[4,7],[1,7],[0,6]]],
        'T': [[[0,0],[5,0]], [[2.5,0],[2.5,7]]],
        'U': [[[0,0],[0,6],[1,7],[4,7],[5,6],[5,0]]],
        'V': [[[0,0],[2.5,7],[5,0]]],
        'W': [[[0,0],[1,7],[2.5,4],[4,7],[5,0]]],
        'X': [[[0,0],[5,7]], [[5,0],[0,7]]],
        'Y': [[[0,0],[2.5,3.5],[5,0]], [[2.5,3.5],[2.5,7]]],
        'Z': [[[0,0],[5,0],[0,7],[5,7]]],
        '0': [[[1,0],[4,0],[5,1],[5,6],[4,7],[1,7],[0,6],[0,1],[1,0]], [[0,6],[5,1]]],
        '1': [[[1.5,1],[2.5,0],[2.5,7]], [[1,7],[4,7]]],
        '2': [[[0,1],[1,0],[4,0],[5,1],[5,3],[0,7],[5,7]]],
        '3': [[[0,1],[1,0],[4,0],[5,1],[5,3],[4,3.5],[5,4],[5,6],[4,7],[1,7],[0,6]], [[2,3.5],[4,3.5]]],
        '4': [[[0,0],[0,3.5],[5,3.5]], [[5,0],[5,7]]],
        '5': [[[5,0],[0,0],[0,3],[4,3],[5,4],[5,6],[4,7],[1,7],[0,6]]],
        '6': [[[4,0],[1,0],[0,1],[0,6],[1,7],[4,7],[5,6],[5,4],[4,3],[0,3]]],
        '7': [[[0,0],[5,0],[2,7]]],
        '8': [[[1,0],[4,0],[5,1],[5,3],[4,3.5],[1,3.5],[0,4],[0,6],[1,7],[4,7],[5,6],[5,4],[4,3.5]], [[1,3.5],[0,3],[0,1],[1,0]]],
        '9': [[[5,3.5],[1,3.5],[0,3],[0,1],[1,0],[4,0],[5,1],[5,6],[4,7],[1,7]]],
        ' ': [],
        '-': [[[1,3.5],[4,3.5]]],
        '.': [[[2,6.5],[3,6.5],[3,7],[2,7],[2,6.5]]],
        ',': [[[2.5,6],[3,6.5],[2,7.5]]],
        '!': [[[2.5,0],[2.5,4.5]], [[2.5,6],[2.5,7]]],
        '?': [[[0,1],[1,0],[4,0],[5,1],[5,2.5],[3,4],[2.5,4.5]], [[2.5,6],[2.5,7]]],
        ':': [[[2.5,2],[2.5,2.5]], [[2.5,5],[2.5,5.5]]],
        '/': [[[5,0],[0,7]]],
        '\u00a9': [[[1,0],[4,0],[5,1],[5,6],[4,7],[1,7],[0,6],[0,1],[1,0]], [[3.5,2.5],[2.5,2],[2,2.5],[2,4.5],[2.5,5],[3.5,4.5]]],
        '\'': [[[2.5,0],[2.5,2]]],
        '"': [[[1.5,0],[1.5,2]], [[3.5,0],[3.5,2]]],
        '*': [[[2.5,1],[2.5,5]], [[0.5,2],[4.5,4]], [[4.5,2],[0.5,4]]],
        '(': [[[3,0],[2,1],[2,6],[3,7]]],
        ')': [[[2,0],[3,1],[3,6],[2,7]]],
        '<': [[[4,1],[1,3.5],[4,6]]],
        '>': [[[1,1],[4,3.5],[1,6]]],
    }
};

/**
 * Generate procedural lunar terrain with landing pads.
 * Uses layered sine waves for jagged moonscape, then inserts
 * 5 flat landing pads at valley locations.
 *
 * @returns {{ points: Array<{x: number, y: number}>, pads: Array<{x: number, y: number, width: number, multiplier: number}> }}
 */
function generateTerrain() {
    const points = [];
    const pads = [];
    const numPoints = CONFIG.TERRAIN_POINTS;
    const step = CONFIG.WORLD_WIDTH / numPoints;
    const baseHeight = CONFIG.WORLD_HEIGHT * 0.75;

    // Pad configuration: widths and multipliers
    const padWidths = [CONFIG.PAD_WIDTH_1X, CONFIG.PAD_WIDTH_2X, CONFIG.PAD_WIDTH_5X, CONFIG.PAD_WIDTH_2X, CONFIG.PAD_WIDTH_1X];
    const padMultipliers = CONFIG.PAD_MULTIPLIERS;
    const padCount = 5;

    // Generate raw terrain heights using layered sine waves
    for (let i = 0; i <= numPoints; i++) {
        const x = i * step;
        const nx = x / CONFIG.WORLD_WIDTH; // normalized 0..1

        // Layered sine waves for rugged lunar surface
        let y = baseHeight;
        y += Math.sin(nx * Math.PI * 2 * 3) * 180;   // broad hills
        y += Math.sin(nx * Math.PI * 2 * 7) * 120;   // medium ridges
        y += Math.sin(nx * Math.PI * 2 * 13) * 60;   // jagged detail
        y += Math.sin(nx * Math.PI * 2 * 23) * 30;   // fine roughness
        y += Math.sin(nx * Math.PI * 2 * 37) * 15;   // micro detail
        y += Math.sin(nx * Math.PI * 2 * 59) * 8;    // extra grit

        points.push({ x, y });
    }

    // Place pads at roughly evenly-spaced locations, seeking local valleys
    const sectionWidth = CONFIG.WORLD_WIDTH / padCount;

    for (let p = 0; p < padCount; p++) {
        const sectionStart = p * sectionWidth;
        const sectionCenter = sectionStart + sectionWidth * 0.5;
        const padWidth = padWidths[p];
        const halfPad = padWidth / 2;

        // Search for the deepest valley (highest y) near this section center
        let bestIdx = -1;
        let bestY = -Infinity;
        const searchStart = Math.max(1, Math.floor((sectionCenter - sectionWidth * 0.35) / step));
        const searchEnd = Math.min(numPoints - 1, Math.ceil((sectionCenter + sectionWidth * 0.35) / step));

        for (let i = searchStart; i <= searchEnd; i++) {
            if (points[i].y > bestY) {
                bestY = points[i].y;
                bestIdx = i;
            }
        }

        // Determine pad center x and y
        const padCenterX = points[bestIdx].x;
        const padY = bestY;

        // Flatten terrain points that fall within the pad region
        const padLeft = padCenterX - halfPad;
        const padRight = padCenterX + halfPad;

        for (let i = 0; i <= numPoints; i++) {
            if (points[i].x >= padLeft && points[i].x <= padRight) {
                points[i].y = padY;
            }
        }

        pads.push({
            x: padCenterX - halfPad,
            y: padY,
            width: padWidth,
            multiplier: padMultipliers[p]
        });
    }

    return { points, pads };
}

// ===== SECTION 5: INPUT HANDLER =====

class InputHandler {
    constructor() {
        this.keysDown = new Set();
        this.keysJustPressed = new Set();

        this._onKeyDown = (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
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

        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);
    }

    isDown(key) { return this.keysDown.has(key); }
    isLeft() { return this.isDown('ArrowLeft') || this.isDown('a') || this.isDown('A'); }
    isRight() { return this.isDown('ArrowRight') || this.isDown('d') || this.isDown('D'); }
    isThrust() { return this.isDown('ArrowUp') || this.isDown('w') || this.isDown('W'); }
    isAbort() { return this.justPressed(' '); }
    isStart() { return this.justPressed('Enter'); }
    isUp() { return this.justPressed('ArrowUp') || this.justPressed('w') || this.justPressed('W'); }
    isDown2() { return this.justPressed('ArrowDown') || this.justPressed('s') || this.justPressed('S'); }
    justPressed(key) { return this.keysJustPressed.has(key); }
    anyKey() { return this.keysJustPressed.size > 0; }

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
        this.initialized = false;
        this.masterGain = null;
        this.noiseBuffer = null;
        this.thrustNode = null;
        this.thrustGain = null;
        this.thrustFilter = null;
    }

    init() {
        if (this.initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);

        // Create noise buffer for thrust and explosion sounds
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * 2;
        this.noiseBuffer = this.ctx.createBuffer(1, length, sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        this.initialized = true;
    }

    // Play a filtered noise burst with envelope
    playNoise(duration, filterFreq, gain) {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = 1;
        const gn = this.ctx.createGain();
        gn.gain.setValueAtTime(gain, t);
        gn.gain.linearRampToValueAtTime(0, t + duration);
        src.connect(filter);
        filter.connect(gn);
        gn.connect(this.masterGain);
        src.start(t);
        src.stop(t + duration);
    }

    // Start continuous thrust sound — looping noise through bandpass at ~80Hz
    thrustOn() {
        if (!this.initialized) return;
        if (this.thrustNode) return;
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        src.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 80;
        filter.Q.value = 1;
        const gn = this.ctx.createGain();
        gn.gain.value = 0.3;
        src.connect(filter);
        filter.connect(gn);
        gn.connect(this.masterGain);
        src.start();
        this.thrustNode = src;
        this.thrustGain = gn;
        this.thrustFilter = filter;
    }

    // Stop continuous thrust sound
    thrustOff() {
        if (!this.initialized) return;
        if (!this.thrustNode) return;
        this.thrustNode.stop();
        this.thrustNode.disconnect();
        this.thrustGain.disconnect();
        this.thrustFilter.disconnect();
        this.thrustNode = null;
        this.thrustGain = null;
        this.thrustFilter = null;
    }

    // Crash: heavy low-frequency noise burst
    crash() {
        if (!this.initialized) return;
        this.playNoise(0.5, 100, 0.5);
        // Add a descending sine for extra impact
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.linearRampToValueAtTime(40, t + 0.5);
        const gn = this.ctx.createGain();
        gn.gain.setValueAtTime(0.4, t);
        gn.gain.linearRampToValueAtTime(0, t + 0.5);
        osc.connect(gn);
        gn.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.5);
    }

    // Hard landing: medium impact noise
    hardLanding() {
        if (!this.initialized) return;
        this.playNoise(0.2, 200, 0.3);
    }

    // Good landing: ascending arpeggio C5-E5-G5-C6 (celebratory chime)
    goodLanding() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
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

    // Low fuel warning beep: short square wave at 440Hz
    lowFuelBeep() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 440;
        const gn = this.ctx.createGain();
        gn.gain.setValueAtTime(0.2, t);
        gn.gain.linearRampToValueAtTime(0, t + 0.08);
        osc.connect(gn);
        gn.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.08);
    }

    // Abort warning: two descending tones (800Hz then 400Hz)
    abortWarning() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        // First tone: 800Hz
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'square';
        osc1.frequency.value = 800;
        const gn1 = this.ctx.createGain();
        gn1.gain.setValueAtTime(0.25, t);
        gn1.gain.linearRampToValueAtTime(0, t + 0.15);
        osc1.connect(gn1);
        gn1.connect(this.masterGain);
        osc1.start(t);
        osc1.stop(t + 0.15);
        // Second tone: 400Hz
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.value = 400;
        const gn2 = this.ctx.createGain();
        gn2.gain.setValueAtTime(0.25, t + 0.15);
        gn2.gain.linearRampToValueAtTime(0, t + 0.3);
        osc2.connect(gn2);
        gn2.connect(this.masterGain);
        osc2.start(t + 0.15);
        osc2.stop(t + 0.3);
    }

    // Mission select: short click/blip
    missionSelect() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 880;
        const gn = this.ctx.createGain();
        gn.gain.setValueAtTime(0.2, t);
        gn.gain.linearRampToValueAtTime(0, t + 0.05);
        osc.connect(gn);
        gn.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.05);
    }
}

// ============================================================================
// SECTION 6: ENTITY CLASSES
// ============================================================================

// --- Lander ---
// The player-controlled lunar module with physics, thrust, rotation, and abort

class Lander {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;          // degrees, 0 = upright
        this.angularVel = 0;     // degrees/frame for momentum rotation (Command mission)
        this.fuel = CONFIG.FUEL_MAX;
        this.thrusting = false;
        this.thrustLevel = 0;    // 0-1 for flame animation intensity
        this.alive = true;
        this.landed = false;
        this.aborting = false;
        this.abortTimer = 0;
    }

    // Main physics update
    // gravity: number (from mission config)
    // hasFriction: boolean (true for training mission — adds air drag)
    // momentumRotation: boolean (true for command mission — rotation has inertia)
    update(gravity, hasFriction, momentumRotation) {
        if (!this.alive || this.landed) return;

        // Handle abort sequence: auto-rotate to vertical + full thrust
        if (this.aborting) {
            this.abortTimer -= CONFIG.FRAME_TIME;
            if (this.abortTimer <= 0) {
                this.aborting = false;
            }

            // Rotate toward vertical (0 degrees)
            if (Math.abs(this.angle) > 2) {
                const dir = this.angle > 0 ? -1 : 1;
                this.angle += dir * CONFIG.ABORT_ROTATION_SPEED;
                if (Math.abs(this.angle) < CONFIG.ABORT_ROTATION_SPEED) {
                    this.angle = 0;
                }
            }
            // Force full thrust during abort
            this.thrusting = true;

            // Reset angular velocity during abort
            if (momentumRotation) {
                this.angularVel = 0;
            }
        }

        // Apply angular velocity for momentum rotation mode
        if (momentumRotation && !this.aborting) {
            this.angle += this.angularVel;
            // Dampen angular velocity slightly to prevent endless spinning
            this.angularVel *= 0.98;
        }

        // Normalize angle to [-180, 180]
        while (this.angle > 180) this.angle -= 360;
        while (this.angle < -180) this.angle += 360;

        // Apply gravity (always pulls down = positive vy)
        this.vy += gravity;

        // Apply thrust along the lander's current facing direction
        if (this.thrusting && this.fuel > 0) {
            const angleRad = MathUtils.degToRad(this.angle);
            // Thrust opposes the lander's top direction
            // At angle=0 (upright): thrustX=0, thrustY=-power (upward)
            const thrustX = -Math.sin(angleRad) * CONFIG.LANDER_THRUST_POWER;
            const thrustY = -Math.cos(angleRad) * CONFIG.LANDER_THRUST_POWER;
            this.vx += thrustX;
            this.vy += thrustY;
            this.fuel -= CONFIG.FUEL_BURN_RATE;
            if (this.fuel < 0) this.fuel = 0;
            // Flame animation flicker
            this.thrustLevel = 0.6 + Math.random() * 0.4;
        } else {
            this.thrustLevel = 0;
        }

        // Apply atmospheric friction (Training mission only — easier control)
        if (hasFriction) {
            this.vx *= CONFIG.FRICTION;
            this.vy *= CONFIG.FRICTION;
        }

        // Clamp maximum speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > CONFIG.LANDER_MAX_SPEED) {
            this.vx = (this.vx / speed) * CONFIG.LANDER_MAX_SPEED;
            this.vy = (this.vy / speed) * CONFIG.LANDER_MAX_SPEED;
        }

        // Update position
        this.x += this.vx;
        this.y += this.vy;
    }

    // Initiate abort sequence: auto-level and thrust upward
    startAbort() {
        if (this.aborting || !this.alive || this.fuel < CONFIG.FUEL_ABORT_COST) return false;
        this.aborting = true;
        this.abortTimer = 2000; // 2 second abort sequence
        this.fuel -= CONFIG.FUEL_ABORT_COST;
        return true;
    }

    // Get altitude above terrain at the lander's position
    getAltitude(terrainY) {
        return terrainY - (this.y + 10); // 10 = approx lander center to feet
    }

    // Returns transformed body vertices in world space
    getVertices() {
        const angleRad = MathUtils.degToRad(this.angle);
        return SHAPES.LANDER_BODY.map(v => {
            const [rx, ry] = MathUtils.rotatePoint(v[0], v[1], angleRad);
            return [this.x + rx, this.y + ry];
        });
    }

    // Returns transformed leg vertices (left and right legs)
    getLegVertices() {
        const angleRad = MathUtils.degToRad(this.angle);
        const transformLeg = (leg) => leg.map(v => {
            const [rx, ry] = MathUtils.rotatePoint(v[0], v[1], angleRad);
            return [this.x + rx, this.y + ry];
        });
        return {
            left: transformLeg(SHAPES.LANDER_LEG_LEFT),
            right: transformLeg(SHAPES.LANDER_LEG_RIGHT)
        };
    }

    // Returns transformed flame vertices, or null if not thrusting
    getFlameVertices() {
        if (!this.thrusting || this.fuel <= 0) return null;
        const angleRad = MathUtils.degToRad(this.angle);
        const flicker = this.thrustLevel;
        return SHAPES.LANDER_FLAME.map(v => {
            // Scale flame length by thrust level for flicker effect
            const scaled = [v[0], v[1] * flicker];
            const [rx, ry] = MathUtils.rotatePoint(scaled[0], scaled[1], angleRad);
            return [this.x + rx, this.y + ry];
        });
    }

    // Returns the two bottom foot points for terrain collision detection
    getBottomPoints() {
        const angleRad = MathUtils.degToRad(this.angle);
        const leftFoot = SHAPES.LANDER_LEG_LEFT[2];   // [-12, 10]
        const rightFoot = SHAPES.LANDER_LEG_RIGHT[2];  // [12, 10]
        const [lx, ly] = MathUtils.rotatePoint(leftFoot[0], leftFoot[1], angleRad);
        const [rx, ry] = MathUtils.rotatePoint(rightFoot[0], rightFoot[1], angleRad);
        return [
            [this.x + lx, this.y + ly],
            [this.x + rx, this.y + ry]
        ];
    }

    // Returns the window/viewport triangle vertices on the lander
    getWindowVertices() {
        const angleRad = MathUtils.degToRad(this.angle);
        return SHAPES.LANDER_WINDOW.map(v => {
            const [rx, ry] = MathUtils.rotatePoint(v[0], v[1], angleRad);
            return [this.x + rx, this.y + ry];
        });
    }
}

// --- Terrain ---
// Procedurally generated lunar surface with landing pads and planted flags

class Terrain {
    constructor() {
        const data = generateTerrain();
        this.points = data.points;    // [{x, y}...] terrain vertices
        this.pads = data.pads;        // [{x, y, width, multiplier}...] landing zones
        this.flags = [];              // [{x, y}...] planted after successful landings
    }

    // Get terrain height at any world X via linear interpolation between points
    getHeightAt(worldX) {
        const step = CONFIG.WORLD_WIDTH / CONFIG.TERRAIN_POINTS;
        const idx = worldX / step;
        const i = Math.floor(idx);
        const frac = idx - i;
        const p1 = this.points[Math.min(i, this.points.length - 1)];
        const p2 = this.points[Math.min(i + 1, this.points.length - 1)];
        return p1.y + (p2.y - p1.y) * frac;
    }

    // Get terrain line segments within range of a world X position (for collision)
    getSegmentsNear(worldX, range) {
        const segments = [];
        const step = CONFIG.WORLD_WIDTH / CONFIG.TERRAIN_POINTS;
        const startIdx = Math.max(0, Math.floor((worldX - range) / step));
        const endIdx = Math.min(this.points.length - 2, Math.ceil((worldX + range) / step));
        for (let i = startIdx; i <= endIdx; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i + 1];
            segments.push([p1.x, p1.y, p2.x, p2.y]);
        }
        return segments;
    }

    // Check if a world X position is on a landing pad; returns pad or null
    getPadAt(worldX) {
        for (const pad of this.pads) {
            // pad.x is the left edge of the pad
            if (worldX >= pad.x && worldX <= pad.x + pad.width) {
                return pad;
            }
        }
        return null;
    }

    // Plant a flag at a successful landing site
    plantFlag(x, y) {
        this.flags.push({ x, y });
    }

    // Get terrain points visible within the current camera view
    getVisiblePoints(cameraX, viewWidth) {
        const halfView = viewWidth / 2;
        const left = cameraX - halfView;
        const right = cameraX + halfView;
        return this.points.filter(p => p.x >= left && p.x <= right);
    }
}

// --- Particle ---
// Visual particle for explosions, dust clouds, and debris effects

class Particle {
    constructor(x, y, vx, vy, lifetime, type) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.alive = true;
        this.type = type;  // 'explosion' | 'dust' | 'debris'
        this.alpha = 1;
        this.angle = Math.random() * Math.PI * 2;
        this.length = 2 + Math.random() * 4;
    }

    update(gravity) {
        this.x += this.vx;
        this.y += this.vy;
        // Explosions and debris are affected by reduced gravity
        if (this.type === 'explosion' || this.type === 'debris') {
            this.vy += gravity * 0.3;
        }
        this.lifetime -= CONFIG.FRAME_TIME;
        this.alpha = Math.max(0, this.lifetime / this.maxLifetime);
        if (this.lifetime <= 0) this.alive = false;
    }

    // Create an explosion burst: radial particles + heavier debris pieces
    static createExplosion(x, y, count, speed) {
        const particles = [];
        // Main explosion particles
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = speed * (0.3 + Math.random() * 0.7);
            particles.push(new Particle(
                x, y,
                Math.cos(angle) * spd,
                Math.sin(angle) * spd,
                500 + Math.random() * 1000,
                'explosion'
            ));
        }
        // Heavier debris pieces (fewer, longer-lived)
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = speed * (0.5 + Math.random() * 0.5);
            particles.push(new Particle(
                x, y,
                Math.cos(angle) * spd,
                Math.sin(angle) * spd,
                800 + Math.random() * 800,
                'debris'
            ));
        }
        return particles;
    }

    // Create a dust cloud: upward-biased particles for landing effects
    static createDust(x, y, count) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            // Upward-biased angle spread: centered on -PI/2 (up)
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
            const spd = CONFIG.LANDING_PARTICLE_SPEED * (0.3 + Math.random() * 0.7);
            particles.push(new Particle(
                x + (Math.random() - 0.5) * 20,
                y,
                Math.cos(angle) * spd,
                Math.sin(angle) * spd,
                300 + Math.random() * 500,
                'dust'
            ));
        }
        return particles;
    }
}
// ============================================================================
// SECTION 7: COLLISION SYSTEM
// ============================================================================

const CollisionSystem = {
    // Main collision check: returns { hit: bool, landed: bool, pad: object|null, result: string }
    // result: 'none' | 'good' | 'hard' | 'crash'
    checkLanderTerrain(lander, terrain) {
        if (!lander.alive || lander.landed) return { hit: false, result: 'none' };

        // Get lander bottom points (feet) and some body points
        const bottomPoints = lander.getBottomPoints();
        const bodyVerts = lander.getVertices();

        // Check feet first, then top body points
        const checkPoints = [...bottomPoints, ...bodyVerts.slice(0, 4)];

        for (const pt of checkPoints) {
            const terrainY = terrain.getHeightAt(pt[0]);
            if (pt[1] >= terrainY) {
                // We've hit the terrain
                const pad = terrain.getPadAt(lander.x);
                const vertSpeed = Math.abs(lander.vy);
                const horizSpeed = Math.abs(lander.vx);
                const angleDeg = Math.abs(lander.angle);

                // Crash if too fast, too angled, or not on a pad
                if (vertSpeed > CONFIG.CRASH_VERT_SPEED ||
                    horizSpeed > CONFIG.CRASH_HORIZ_SPEED ||
                    angleDeg > CONFIG.LANDING_ANGLE_TOLERANCE) {
                    return { hit: true, landed: false, pad: null, result: 'crash' };
                }

                if (!pad) {
                    return { hit: true, landed: false, pad: null, result: 'crash' };
                }

                // On a pad — check speed for good vs hard landing
                if (vertSpeed > CONFIG.HARD_VERT_SPEED) {
                    return { hit: true, landed: true, pad: pad, result: 'hard' };
                }

                return { hit: true, landed: true, pad: pad, result: 'good' };
            }
        }

        return { hit: false, result: 'none' };
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

        // Phosphor persistence canvas
        this.persistCanvas = document.createElement('canvas');
        this.persistCanvas.width = CONFIG.WIDTH;
        this.persistCanvas.height = CONFIG.HEIGHT;
        this.persistCtx = this.persistCanvas.getContext('2d');

        // Vignette canvas
        this.vignetteCanvas = document.createElement('canvas');
        this.vignetteCanvas.width = CONFIG.WIDTH;
        this.vignetteCanvas.height = CONFIG.HEIGHT;
        this.createVignette();

        this.frameCount = 0;
    }

    createVignette() {
        const ctx = this.vignetteCanvas.getContext('2d');
        const cx = CONFIG.WIDTH / 2;
        const cy = CONFIG.HEIGHT / 2;
        const outerRadius = Math.sqrt(cx * cx + cy * cy);
        const gradient = ctx.createRadialGradient(cx, cy, outerRadius * 0.35, cx, cy, outerRadius);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.7, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${CONFIG.VIGNETTE_STRENGTH})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    }

    // Convert world coordinates to screen coordinates with zoom
    worldToScreen(wx, wy, camX, camY, zoom) {
        const sx = (wx - camX) * zoom + CONFIG.WIDTH / 2;
        const sy = (wy - camY) * zoom + CONFIG.HEIGHT / 2;
        return [sx, sy];
    }

    render(gameState) {
        this.frameCount++;
        const ctx = this.ctx;
        const pctx = this.persistCtx;

        // 1. Fade persistence canvas
        pctx.globalCompositeOperation = 'source-over';
        pctx.fillStyle = `rgba(0,0,0,${CONFIG.PHOSPHOR_ALPHA})`;
        pctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

        // 2. Clear main
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

        // 3. Draw world entities to main
        this.drawWorld(ctx, gameState);

        // 4. Burn into persist
        pctx.globalCompositeOperation = 'screen';
        pctx.globalAlpha = 0.5;
        pctx.drawImage(this.canvas, 0, 0);
        pctx.globalAlpha = 1.0;
        pctx.globalCompositeOperation = 'source-over';

        // 5. Composite persist under
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.35;
        ctx.drawImage(this.persistCanvas, 0, 0);
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';

        // 6. Redraw crisp on top
        this.drawWorld(ctx, gameState);

        // 7. Vignette
        ctx.drawImage(this.vignetteCanvas, 0, 0);

        // 8. HUD + overlays (always in screen space, not affected by zoom)
        if (gameState.state === 'attract' || gameState.state === 'missionSelect') {
            this.drawAttractScreen(ctx, gameState);
        } else if (gameState.state === 'gameOver') {
            this.drawHUD(ctx, gameState);
            this.drawGameOver(ctx, gameState);
        } else {
            this.drawHUD(ctx, gameState);
            if (gameState.landingResult) {
                this.drawLandingResult(ctx, gameState);
            }
        }
    }

    drawWorld(ctx, gameState) {
        const cam = gameState.camera;
        if (!cam) return;

        // Draw stars (fixed small dots at infinity)
        this.drawStars(ctx, cam);

        // Draw terrain
        if (gameState.terrain) {
            this.drawTerrain(ctx, gameState.terrain, cam);
            this.drawPads(ctx, gameState.terrain, cam);
            this.drawFlags(ctx, gameState.terrain, cam);
        }

        // Draw lander
        if (gameState.lander && gameState.lander.alive) {
            this.drawLander(ctx, gameState.lander, cam);
        }

        // Draw particles
        if (gameState.particles) {
            this.drawParticles(ctx, gameState.particles, cam);
        }
    }

    drawStars(ctx, cam) {
        // Stars at "infinity" — fixed screen positions with very slight parallax
        ctx.save();
        ctx.fillStyle = CONFIG.STROKE_COLOR;
        const parallax = 0.02; // barely moves with camera
        for (let i = 0; i < 80; i++) {
            const baseX = ((i * 7919 + 1000) % CONFIG.WIDTH);
            const baseY = ((i * 6271 + 500) % (CONFIG.HEIGHT * 0.85));
            const sx = baseX - (cam.x * parallax) % CONFIG.WIDTH;
            const sy = baseY - (cam.y * parallax) % CONFIG.HEIGHT;
            // Wrap to screen
            const wrappedX = ((sx % CONFIG.WIDTH) + CONFIG.WIDTH) % CONFIG.WIDTH;
            const wrappedY = ((sy % CONFIG.HEIGHT) + CONFIG.HEIGHT) % CONFIG.HEIGHT;
            const brightness = 0.3 + ((i * 3571) % 7) / 10;
            ctx.globalAlpha = brightness;
            const size = ((i * 2731) % 3 === 0) ? 2 : 1;
            ctx.fillRect(wrappedX, wrappedY, size, size);
        }
        ctx.restore();
    }

    drawTerrain(ctx, terrain, cam) {
        ctx.save();
        ctx.strokeStyle = CONFIG.TERRAIN_COLOR;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 6;
        ctx.shadowColor = CONFIG.TERRAIN_COLOR;
        ctx.lineJoin = 'round';

        ctx.beginPath();
        let started = false;
        for (const pt of terrain.points) {
            const [sx, sy] = this.worldToScreen(pt.x, pt.y, cam.x, cam.y, cam.zoom);
            if (sx >= -50 && sx <= CONFIG.WIDTH + 50) {
                if (!started) {
                    ctx.moveTo(sx, sy);
                    started = true;
                } else {
                    ctx.lineTo(sx, sy);
                }
            } else if (started) {
                ctx.lineTo(sx, sy);
            }
        }
        ctx.stroke();
        ctx.restore();
    }

    drawPads(ctx, terrain, cam) {
        for (const pad of terrain.pads) {
            // pad.x is the LEFT edge of the pad; center is pad.x + pad.width / 2
            const padCenterX = pad.x + pad.width / 2;
            const [sx, sy] = this.worldToScreen(padCenterX, pad.y, cam.x, cam.y, cam.zoom);
            const halfW = (pad.width / 2) * cam.zoom;

            // Draw pad line (brighter)
            ctx.save();
            ctx.strokeStyle = CONFIG.PAD_COLOR;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = CONFIG.PAD_COLOR;
            ctx.beginPath();
            ctx.moveTo(sx - halfW, sy);
            ctx.lineTo(sx + halfW, sy);
            ctx.stroke();
            ctx.restore();

            // Draw multiplier label (flashing)
            const blink = Math.floor(this.frameCount / 20) % 2 === 0;
            if (blink) {
                const label = pad.multiplier + 'X';
                const labelScale = MathUtils.clamp(cam.zoom * 8, 1, 3);
                this.drawCenteredText(ctx, label, sy + 10 + labelScale * 8, labelScale, CONFIG.PAD_COLOR);
            }
        }
    }

    drawFlags(ctx, terrain, cam) {
        for (const flag of terrain.flags) {
            const [sx, sy] = this.worldToScreen(flag.x, flag.y, cam.x, cam.y, cam.zoom);
            const scale = cam.zoom;

            ctx.save();
            ctx.strokeStyle = CONFIG.STROKE_COLOR;
            ctx.lineWidth = 1;
            ctx.shadowBlur = 4;
            ctx.shadowColor = CONFIG.DIM_GLOW_COLOR;

            // Pole
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx, sy - CONFIG.FLAG_HEIGHT * scale);
            ctx.stroke();

            // Pennant
            ctx.beginPath();
            ctx.moveTo(sx, sy - CONFIG.FLAG_HEIGHT * scale);
            ctx.lineTo(sx + 8 * scale, sy - (CONFIG.FLAG_HEIGHT - 3) * scale);
            ctx.lineTo(sx, sy - (CONFIG.FLAG_HEIGHT - 6) * scale);
            ctx.stroke();

            ctx.restore();
        }
    }

    drawLander(ctx, lander, cam) {
        // Draw body
        const bodyVerts = lander.getVertices();
        const screenBody = bodyVerts.map(v => this.worldToScreen(v[0], v[1], cam.x, cam.y, cam.zoom));
        this.drawPolygon(ctx, screenBody, true);

        // Draw legs
        const legs = lander.getLegVertices();
        const screenLeftLeg = legs.left.map(v => this.worldToScreen(v[0], v[1], cam.x, cam.y, cam.zoom));
        const screenRightLeg = legs.right.map(v => this.worldToScreen(v[0], v[1], cam.x, cam.y, cam.zoom));
        this.drawPolyline(ctx, screenLeftLeg);
        this.drawPolyline(ctx, screenRightLeg);

        // Draw window
        const windowVerts = lander.getWindowVertices();
        const screenWindow = windowVerts.map(v => this.worldToScreen(v[0], v[1], cam.x, cam.y, cam.zoom));
        this.drawPolygon(ctx, screenWindow, true);

        // Draw flame
        const flameVerts = lander.getFlameVertices();
        if (flameVerts && Math.random() > 0.2) {
            const screenFlame = flameVerts.map(v => this.worldToScreen(v[0], v[1], cam.x, cam.y, cam.zoom));
            ctx.save();
            ctx.strokeStyle = CONFIG.GLOW_COLOR;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 12;
            ctx.shadowColor = CONFIG.GLOW_COLOR;
            ctx.beginPath();
            ctx.moveTo(screenFlame[0][0], screenFlame[0][1]);
            for (let i = 1; i < screenFlame.length; i++) {
                ctx.lineTo(screenFlame[i][0], screenFlame[i][1]);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }
    }

    drawPolygon(ctx, vertices, close) {
        if (!vertices || vertices.length < 2) return;
        ctx.save();
        ctx.strokeStyle = CONFIG.STROKE_COLOR;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.shadowBlur = 8;
        ctx.shadowColor = CONFIG.DIM_GLOW_COLOR;
        ctx.beginPath();
        ctx.moveTo(vertices[0][0], vertices[0][1]);
        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i][0], vertices[i][1]);
        }
        if (close) ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    drawPolyline(ctx, vertices) {
        this.drawPolygon(ctx, vertices, false);
    }

    drawParticles(ctx, particles, cam) {
        ctx.save();
        for (const p of particles) {
            if (!p.alive || p.alpha <= 0) continue;
            const [sx, sy] = this.worldToScreen(p.x, p.y, cam.x, cam.y, cam.zoom);
            if (sx < -10 || sx > CONFIG.WIDTH + 10 || sy < -10 || sy > CONFIG.HEIGHT + 10) continue;

            ctx.globalAlpha = p.alpha;
            if (p.type === 'debris') {
                const debrisIdx = Math.floor(p.angle / (Math.PI * 2) * SHAPES.DEBRIS.length) % SHAPES.DEBRIS.length;
                const debris = SHAPES.DEBRIS[Math.abs(debrisIdx)];
                const s = cam.zoom;
                ctx.strokeStyle = CONFIG.STROKE_COLOR;
                ctx.lineWidth = 1;
                ctx.shadowBlur = 4;
                ctx.shadowColor = CONFIG.DIM_GLOW_COLOR;
                ctx.beginPath();
                ctx.moveTo(sx + debris[0][0] * s, sy + debris[0][1] * s);
                ctx.lineTo(sx + debris[1][0] * s, sy + debris[1][1] * s);
                ctx.stroke();
            } else {
                ctx.fillStyle = CONFIG.STROKE_COLOR;
                ctx.shadowBlur = 4;
                ctx.shadowColor = CONFIG.DIM_GLOW_COLOR;
                ctx.beginPath();
                ctx.arc(sx, sy, Math.max(1, 1.5 * cam.zoom), 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // ── Vector Text Drawing ──

    drawText(ctx, text, x, y, scale, color) {
        scale = scale || 1;
        color = color || CONFIG.STROKE_COLOR;
        const str = text.toUpperCase();
        const charWidth = 5;
        const spacing = 1;
        let cursorX = x;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.min(1.2 * scale, 3);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.shadowBlur = 6;
        ctx.shadowColor = CONFIG.DIM_GLOW_COLOR;

        for (let i = 0; i < str.length; i++) {
            const glyph = SHAPES.FONT[str[i]];
            if (glyph) {
                for (const stroke of glyph) {
                    if (stroke.length < 2) continue;
                    ctx.beginPath();
                    ctx.moveTo(cursorX + stroke[0][0] * scale, y + stroke[0][1] * scale);
                    for (let p = 1; p < stroke.length; p++) {
                        ctx.lineTo(cursorX + stroke[p][0] * scale, y + stroke[p][1] * scale);
                    }
                    ctx.stroke();
                }
            }
            cursorX += (charWidth + spacing) * scale;
        }
        ctx.restore();
    }

    measureText(text, scale) {
        scale = scale || 1;
        return text.length * 6 * scale - scale;
    }

    drawCenteredText(ctx, text, y, scale, color) {
        const w = this.measureText(text, scale);
        this.drawText(ctx, text, (CONFIG.WIDTH - w) / 2, y, scale, color);
    }

    drawRightText(ctx, text, x, y, scale, color) {
        const w = this.measureText(text, scale);
        this.drawText(ctx, text, x - w, y, scale, color);
    }

    // ── HUD ──

    drawHUD(ctx, gameState) {
        const s = gameState;
        const hudColor = CONFIG.HUD_COLOR;

        // Score (top left)
        this.drawText(ctx, 'SCORE ' + String(s.score || 0).padStart(6, '0'), 20, 20, 2, hudColor);

        // Time (top center)
        const mins = Math.floor((s.time || 0) / 60);
        const secs = Math.floor((s.time || 0) % 60);
        const timeStr = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
        this.drawCenteredText(ctx, 'TIME ' + timeStr, 20, 2, hudColor);

        // Fuel bar (top right area)
        this.drawRightText(ctx, 'FUEL', CONFIG.WIDTH - 30, 20, 2, hudColor);
        const fuelPct = (s.fuel || 0) / CONFIG.FUEL_MAX;
        const barWidth = 150;
        const barHeight = 10;
        const barX = CONFIG.WIDTH - 30 - barWidth;
        const barY = 42;

        ctx.save();
        ctx.strokeStyle = hudColor;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 4;
        ctx.shadowColor = hudColor;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Fill
        const fillColor = fuelPct < 0.2 ? '#ff4444' : hudColor;
        ctx.fillStyle = fillColor;
        ctx.shadowColor = fillColor;
        ctx.fillRect(barX + 1, barY + 1, (barWidth - 2) * fuelPct, barHeight - 2);
        ctx.restore();

        // Altitude (bottom left)
        const alt = Math.max(0, Math.floor(s.altitude || 0));
        this.drawText(ctx, 'ALTITUDE ' + String(alt), 20, CONFIG.HEIGHT - 80, 1.5, hudColor);

        // Horizontal speed (bottom center-left)
        const hSpd = Math.abs(s.horizontalSpeed || 0).toFixed(1);
        const hDir = (s.horizontalSpeed || 0) >= 0 ? '>' : '<';
        this.drawText(ctx, 'HORIZONTAL SPEED ' + hDir + hSpd, 20, CONFIG.HEIGHT - 55, 1.5, hudColor);

        // Vertical speed (bottom center-right)
        const vSpd = Math.abs(s.verticalSpeed || 0).toFixed(1);
        const vDir = (s.verticalSpeed || 0) >= 0 ? 'V' : ' ';
        this.drawText(ctx, 'VERTICAL SPEED ' + vDir + vSpd, 20, CONFIG.HEIGHT - 30, 1.5, hudColor);

        // Mission name (top center under time)
        this.drawCenteredText(ctx, s.missionName || '', 50, 1.5, hudColor);
    }

    drawAttractScreen(ctx, gameState) {
        // Title
        this.drawCenteredText(ctx, 'LUNAR LANDER', 120, 6);
        this.drawCenteredText(ctx, '1979 ATARI', 195, 2);

        if (gameState.state === 'missionSelect') {
            // Mission selection
            this.drawCenteredText(ctx, 'SELECT MISSION', 280, 2.5);

            const missions = CONFIG.MISSION_NAMES;
            for (let i = 0; i < missions.length; i++) {
                const isSelected = i === (gameState.selectedMission || 0);
                const y = 340 + i * 50;
                const color = isSelected ? CONFIG.STROKE_COLOR : CONFIG.DIM_GLOW_COLOR;

                if (isSelected && Math.floor(this.frameCount / 15) % 2 === 0) {
                    this.drawCenteredText(ctx, '> ' + missions[i] + ' <', y, 2.5, color);
                } else {
                    this.drawCenteredText(ctx, missions[i], y, isSelected ? 2.5 : 2, color);
                }
            }

            this.drawCenteredText(ctx, 'PRESS ENTER TO BEGIN', 570, 2);
        } else {
            // Attract mode — show controls
            this.drawCenteredText(ctx, 'ARROWS  ROTATE', 340, 1.5);
            this.drawCenteredText(ctx, 'UP  THRUST', 365, 1.5);
            this.drawCenteredText(ctx, 'SPACE  ABORT', 390, 1.5);
            this.drawCenteredText(ctx, 'ENTER  START', 415, 1.5);

            if (Math.floor(this.frameCount / 30) % 2 === 0) {
                this.drawCenteredText(ctx, 'INSERT COIN', 490, 3);
            }
            this.drawCenteredText(ctx, 'PUSH START', 560, 2);
        }
    }

    drawLandingResult(ctx, gameState) {
        const result = gameState.landingResult;
        if (!result) return;

        let text = '';
        let color = CONFIG.STROKE_COLOR;
        if (result === 'good') {
            text = 'GOOD LANDING!';
            color = CONFIG.TERRAIN_COLOR;
        } else if (result === 'hard') {
            text = 'HARD LANDING';
            color = '#ffaa44';
        }

        if (text) {
            this.drawCenteredText(ctx, text, CONFIG.HEIGHT / 2 - 30, 4, color);
            if (gameState.landingScore) {
                this.drawCenteredText(ctx, String(gameState.landingScore) + ' POINTS', CONFIG.HEIGHT / 2 + 30, 2.5, color);
            }
        }
    }

    drawGameOver(ctx, gameState) {
        this.drawCenteredText(ctx, 'GAME OVER', CONFIG.HEIGHT / 2 - 50, 5);
        this.drawCenteredText(ctx, 'FINAL SCORE ' + String(gameState.score || 0), CONFIG.HEIGHT / 2 + 20, 2.5);
    }
}

// ============================================================================
// SECTION 9: GAME STATE MACHINE
// ============================================================================

class Game {
    constructor(canvas) {
        this.renderer = new Renderer(canvas);
        this.input = new InputHandler();
        this.sound = new SoundEngine();

        this.state = 'attract';
        this.lander = null;
        this.terrain = null;
        this.particles = [];

        this.camera = { x: 0, y: 0, zoom: CONFIG.ZOOM_MIN, targetZoom: CONFIG.ZOOM_MIN };

        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('lunarlander_highscore')) || 0;
        this.fuel = CONFIG.FUEL_MAX;
        this.mission = 0;
        this.selectedMission = 0;
        this.time = 0;

        this.landingResult = null;
        this.landingScore = 0;
        this.resultTimer = 0;
        this.gameOverTimer = 0;
        this.respawnTimer = 0;
        this.lowFuelTimer = 0;

        // Attract camera pan
        this.attractCameraX = 0;
        this.attractTerrain = new Terrain();
    }

    getMissionGravity() {
        switch (this.mission) {
            case 0: return CONFIG.GRAVITY_TRAINING;
            case 1: return CONFIG.GRAVITY_CADET;
            case 2: return CONFIG.GRAVITY_PRIME;
            case 3: return CONFIG.GRAVITY_COMMAND;
            default: return CONFIG.GRAVITY_CADET;
        }
    }

    getMissionHasFriction() { return this.mission === 0; }
    getMissionMomentumRotation() { return this.mission === 3; }

    startGame() {
        this.mission = this.selectedMission;
        this.terrain = new Terrain();
        this.score = 0;
        this.fuel = CONFIG.FUEL_MAX;
        this.time = 0;
        this.particles = [];
        this.landingResult = null;
        this.spawnLander();
        this.state = 'playing';
    }

    spawnLander() {
        // Spawn above center of world, high up
        this.lander = new Lander(CONFIG.WORLD_WIDTH / 2, 200);
        this.lander.fuel = this.fuel;
        // Give slight random drift
        this.lander.vx = (Math.random() - 0.5) * 2;
        this.camera.x = this.lander.x;
        this.camera.y = this.lander.y;
        this.camera.zoom = CONFIG.ZOOM_MIN;
        this.camera.targetZoom = CONFIG.ZOOM_MIN;
    }

    update() {
        switch (this.state) {
            case 'attract': this.updateAttract(); break;
            case 'missionSelect': this.updateMissionSelect(); break;
            case 'playing': this.updatePlaying(); break;
            case 'landing': this.updateLanding(); break;
            case 'crash': this.updateCrash(); break;
            case 'gameOver': this.updateGameOver(); break;
        }
        this.input.update();
    }

    updateAttract() {
        // Pan camera across attract terrain
        this.attractCameraX += 0.5;
        if (this.attractCameraX > CONFIG.WORLD_WIDTH) this.attractCameraX = 0;

        if (this.input.isStart()) {
            this.sound.init();
            this.state = 'missionSelect';
        }
    }

    updateMissionSelect() {
        if (this.input.justPressed('ArrowUp') || this.input.justPressed('w') || this.input.justPressed('W')) {
            this.selectedMission = (this.selectedMission - 1 + 4) % 4;
            this.sound.missionSelect();
        }
        if (this.input.justPressed('ArrowDown') || this.input.justPressed('s') || this.input.justPressed('S')) {
            this.selectedMission = (this.selectedMission + 1) % 4;
            this.sound.missionSelect();
        }
        if (this.input.isStart()) {
            this.startGame();
        }
    }

    updatePlaying() {
        const lander = this.lander;
        if (!lander || !lander.alive) return;

        // Handle input
        if (!lander.aborting) {
            if (this.input.isLeft()) {
                lander.angle -= CONFIG.LANDER_ROTATION_SPEED;
            }
            if (this.input.isRight()) {
                lander.angle += CONFIG.LANDER_ROTATION_SPEED;
            }
            lander.thrusting = this.input.isThrust();

            if (this.input.isAbort()) {
                if (lander.startAbort()) {
                    this.sound.abortWarning();
                }
            }
        }

        // Thrust sound
        if (lander.thrusting && lander.fuel > 0) {
            this.sound.thrustOn();
        } else {
            this.sound.thrustOff();
        }

        // Update lander physics
        const gravity = this.getMissionGravity();
        lander.update(gravity, this.getMissionHasFriction(), this.getMissionMomentumRotation());
        this.fuel = lander.fuel;

        // Update particles
        this.updateParticles(gravity);

        // Update time
        this.time += CONFIG.FRAME_TIME / 1000;

        // Low fuel warning
        if (lander.fuel > 0 && lander.fuel < CONFIG.FUEL_LOW_THRESHOLD) {
            this.lowFuelTimer -= CONFIG.FRAME_TIME;
            if (this.lowFuelTimer <= 0) {
                this.sound.lowFuelBeep();
                this.lowFuelTimer = CONFIG.LOW_FUEL_BEEP_INTERVAL;
            }
        }

        // Check collision with terrain
        const collision = CollisionSystem.checkLanderTerrain(lander, this.terrain);
        if (collision.hit) {
            this.sound.thrustOff();
            if (collision.result === 'crash') {
                this.handleCrash();
            } else if (collision.result === 'good' || collision.result === 'hard') {
                this.handleLanding(collision);
            }
        }

        // Update camera
        this.updateCamera();

        // Check if fallen below world
        if (lander.y > CONFIG.WORLD_HEIGHT + 500) {
            this.handleCrash();
        }
    }

    handleLanding(collision) {
        const lander = this.lander;
        lander.landed = true;
        lander.thrusting = false;
        lander.vx = 0;
        lander.vy = 0;

        const baseScore = collision.result === 'good' ? CONFIG.SCORE_GOOD_LANDING : CONFIG.SCORE_HARD_LANDING;
        const multiplier = collision.pad ? collision.pad.multiplier : 1;
        const points = baseScore * multiplier;

        this.score += points;
        this.landingResult = collision.result;
        this.landingScore = points;
        this.resultTimer = CONFIG.RESPAWN_DELAY;
        this.state = 'landing';

        // Sound
        if (collision.result === 'good') {
            this.sound.goodLanding();
            this.fuel = Math.min(lander.fuel + CONFIG.FUEL_GOOD_LANDING_BONUS, CONFIG.FUEL_MAX);
            // Plant flag
            this.terrain.plantFlag(lander.x, this.terrain.getHeightAt(lander.x));
        } else {
            this.sound.hardLanding();
        }

        // Dust particles
        this.particles.push(...Particle.createDust(lander.x, lander.y + 10, CONFIG.LANDING_PARTICLE_COUNT));
    }

    handleCrash() {
        const lander = this.lander;
        lander.alive = false;
        lander.thrusting = false;

        this.score += CONFIG.SCORE_CRASH;
        this.landingResult = 'crash';
        this.landingScore = CONFIG.SCORE_CRASH;
        this.state = 'crash';
        this.resultTimer = CONFIG.RESPAWN_DELAY;

        // Explosion
        this.particles.push(...Particle.createExplosion(
            lander.x, lander.y,
            CONFIG.EXPLOSION_PARTICLE_COUNT,
            CONFIG.EXPLOSION_PARTICLE_SPEED
        ));
        this.sound.crash();
    }

    updateLanding() {
        this.resultTimer -= CONFIG.FRAME_TIME;
        this.updateParticles(this.getMissionGravity());

        if (this.resultTimer <= 0) {
            this.landingResult = null;
            if (this.fuel <= 0) {
                this.state = 'gameOver';
                this.gameOverTimer = CONFIG.GAME_OVER_DURATION;
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('lunarlander_highscore', this.highScore);
                }
            } else {
                this.spawnLander();
                this.state = 'playing';
            }
        }
    }

    updateCrash() {
        this.resultTimer -= CONFIG.FRAME_TIME;
        this.updateParticles(this.getMissionGravity());

        if (this.resultTimer <= 0) {
            this.landingResult = null;
            if (this.fuel <= 0) {
                this.state = 'gameOver';
                this.gameOverTimer = CONFIG.GAME_OVER_DURATION;
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('lunarlander_highscore', this.highScore);
                }
            } else {
                this.spawnLander();
                this.state = 'playing';
            }
        }
    }

    updateGameOver() {
        this.gameOverTimer -= CONFIG.FRAME_TIME;
        this.updateParticles(this.getMissionGravity());

        if (this.gameOverTimer <= 0) {
            this.state = 'attract';
            this.attractTerrain = new Terrain();
        }
    }

    updateParticles(gravity) {
        for (const p of this.particles) {
            p.update(gravity);
        }
        this.particles = this.particles.filter(p => p.alive);
    }

    updateCamera() {
        if (!this.lander) return;

        // Camera follows lander
        const targetX = this.lander.x;
        const targetY = this.lander.y;

        // Smooth camera follow
        this.camera.x += (targetX - this.camera.x) * 0.08;
        this.camera.y += (targetY - this.camera.y) * 0.08;

        // Zoom based on altitude
        const altitude = this.lander.getAltitude(this.terrain.getHeightAt(this.lander.x));
        const t = MathUtils.clamp(MathUtils.inverseLerp(CONFIG.ZOOM_ALT_HIGH, CONFIG.ZOOM_ALT_LOW, altitude), 0, 1);
        const smoothT = MathUtils.smoothstep(0, 1, t);
        this.camera.targetZoom = MathUtils.lerp(CONFIG.ZOOM_MIN, CONFIG.ZOOM_MAX, smoothT);

        // Smooth zoom interpolation
        this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * CONFIG.ZOOM_LERP_SPEED;
    }

    getState() {
        if (this.state === 'attract' || this.state === 'missionSelect') {
            return {
                state: this.state,
                terrain: this.attractTerrain,
                lander: null,
                particles: [],
                camera: {
                    x: this.attractCameraX,
                    y: CONFIG.WORLD_HEIGHT * 0.65,
                    zoom: CONFIG.ZOOM_MIN * 1.5
                },
                score: this.highScore,
                highScore: this.highScore,
                selectedMission: this.selectedMission,
                fuel: CONFIG.FUEL_MAX,
                time: 0,
                altitude: 0,
                horizontalSpeed: 0,
                verticalSpeed: 0,
                missionName: CONFIG.MISSION_NAMES[this.selectedMission],
                landingResult: null,
                landingScore: 0,
            };
        }

        return {
            state: this.state,
            lander: this.lander,
            terrain: this.terrain,
            particles: this.particles,
            camera: this.camera,
            score: this.score,
            highScore: this.highScore,
            fuel: this.fuel,
            fuelMax: CONFIG.FUEL_MAX,
            mission: this.mission,
            missionName: CONFIG.MISSION_NAMES[this.mission],
            time: this.time,
            altitude: this.lander ? this.lander.getAltitude(this.terrain.getHeightAt(this.lander.x)) : 0,
            horizontalSpeed: this.lander ? this.lander.vx : 0,
            verticalSpeed: this.lander ? this.lander.vy : 0,
            landingResult: this.landingResult,
            landingScore: this.landingScore,
        };
    }

    render() {
        this.renderer.render(this.getState());
    }
}

// ============================================================================
// SECTION 10: MAIN LOOP
// ============================================================================

const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas);

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
    game.render();
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
