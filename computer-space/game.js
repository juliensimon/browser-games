'use strict';

// ============================================================================
// SECTION 1: CONFIG
// ============================================================================

const CONFIG = Object.freeze({
    WIDTH: 960, HEIGHT: 720, FPS: 60, FRAME_TIME: 1000/60, MAX_DELTA: 200,

    // Ship
    SHIP_ROTATION_STEP: 22.5,  // degrees per step (16 positions)
    SHIP_ROTATION_RATE: 150,   // ms cooldown between rotation steps
    SHIP_THRUST: 0.08,
    SHIP_MAX_SPEED: 4,
    SHIP_DRAG: 0.998,
    SHIP_RADIUS: 18,

    // Ship missiles
    SHIP_MISSILE_SPEED: 4,
    SHIP_MISSILE_LIFETIME: 250,   // frames
    SHIP_MISSILE_TURN_RATE: 0.015, // rad/frame guidance
    MAX_SHIP_MISSILES: 1,
    SHIP_FIRE_COOLDOWN: 10,       // frames

    // Saucers
    SAUCER_RADIUS: 16,
    SAUCER_SPEED: 1.5,
    SAUCER_LEG_MIN_TIME: 1500,    // ms
    SAUCER_LEG_MAX_TIME: 3000,
    SAUCER_VERTICAL_OFFSET: 0.45,

    // Saucer missiles
    SAUCER_MISSILE_SPEED: 3,
    SAUCER_MISSILE_LIFETIME: 220, // frames
    SAUCER_FIRE_COOLDOWN: 10,     // frames
    SAUCER_INITIAL_FIRE_DELAY: 100, // frames
    SAUCER_AIM_SPREAD: 0.4,      // radians
    MAX_SAUCER_MISSILES: 1,

    // Scoring
    HIT_SAUCER_SCORE: 1,
    HIT_PLAYER_SCORE: 1,

    // Round
    ROUND_DURATION: 99,           // seconds
    ROUND_START_DELAY: 2000,      // ms

    // Respawn
    PLAYER_RESPAWN_DELAY: 1500,   // ms
    SAUCER_RESPAWN_DELAY: 1500,
    PLAYER_INVULN_TIME: 2000,
    PLAYER_BLINK_RATE: 100,       // ms

    // Stars
    STAR_COUNT: 60,

    // Explosions
    EXPLOSION_PARTICLE_COUNT: 12,
    EXPLOSION_PARTICLE_SPEED: 2.5,
    EXPLOSION_DURATION: 30,       // frames

    // Rendering
    STROKE_COLOR: '#ffffff',
    GLOW_COLOR: 'rgba(220,220,255,1)',
    DIM_GLOW_COLOR: 'rgba(220,220,255,0.6)',
    SCANLINE_ALPHA: 0.08,
    PHOSPHOR_ALPHA: 0.12,
    VIGNETTE_STRENGTH: 0.35,

    // Timing
    GAME_OVER_DURATION: 4000,     // ms
    ATTRACT_SPIN_SPEED: 0.03,     // rad/frame
});

// ============================================================================
// SECTION 2: MATH UTILS
// ============================================================================

const MathUtils = {
    TAU: Math.PI * 2,

    degToRad(deg) { return deg * Math.PI / 180; },

    wrapPosition(x, y) {
        const w = CONFIG.WIDTH, h = CONFIG.HEIGHT;
        return [((x % w) + w) % w, ((y % h) + h) % h];
    },

    randomRange(min, max) { return Math.random() * (max - min) + min; },
    randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },

    distanceSq(x1, y1, x2, y2) {
        const dx = x1 - x2, dy = y1 - y2;
        return dx * dx + dy * dy;
    },

    toroidalDistanceSq(x1, y1, x2, y2) {
        const w = CONFIG.WIDTH, h = CONFIG.HEIGHT;
        let dx = Math.abs(x1 - x2), dy = Math.abs(y1 - y2);
        if (dx > w / 2) dx = w - dx;
        if (dy > h / 2) dy = h - dy;
        return dx * dx + dy * dy;
    },

    circlesOverlap(x1, y1, r1, x2, y2, r2) {
        const radSum = r1 + r2;
        return this.toroidalDistanceSq(x1, y1, x2, y2) < radSum * radSum;
    },

    getQuadrant(x, y) {
        // Returns 0-3 quadrant: 0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right
        const cx = CONFIG.WIDTH / 2, cy = CONFIG.HEIGHT / 2;
        return (x >= cx ? 1 : 0) + (y >= cy ? 2 : 0);
    },

    angleDiff(a, b) {
        // Shortest signed angle from a to b
        let d = b - a;
        while (d > Math.PI) d -= this.TAU;
        while (d < -Math.PI) d += this.TAU;
        return d;
    },

    rotatePoint(x, y, angle) {
        const cos = Math.cos(angle), sin = Math.sin(angle);
        return [x * cos - y * sin, x * sin + y * cos];
    },

    randomDirection() { return Math.random() * Math.PI * 2; },

    clamp(val, min, max) { return Math.max(min, Math.min(max, val)); },
};

// ============================================================================
// SECTION 3: SHAPES + FONT
// ============================================================================

const SHAPES = {
    // Computer Space rocket: elongated pointed ship with swept-back fins
    // Points UP at angle 0 (nose at negative Y), fits within radius ~18
    ROCKET: [
        [0, -18],       // nose tip
        [2, -14],       // upper nose right
        [3, -10],       // mid nose right
        [4, -6],        // upper body right
        [5, -2],        // mid body right
        [5, 2],         // lower body right
        [4, 6],         // body taper right
        [3, 8],         // waist right
        [4, 10],        // fin start right
        [8, 13],        // fin mid right
        [12, 16],       // fin tip right
        [6, 15],        // fin inner right
        [3, 14],        // engine right
        [0, 15],        // engine center
        [-3, 14],       // engine left
        [-6, 15],       // fin inner left
        [-12, 16],      // fin tip left
        [-8, 13],       // fin mid left
        [-4, 10],       // fin start left
        [-3, 8],        // waist left
        [-4, 6],        // body taper left
        [-5, 2],        // lower body left
        [-5, -2],       // mid body left
        [-4, -6],       // upper body left
        [-3, -10],      // mid nose left
        [-2, -14],      // upper nose left
    ],

    // Thrust flame triangle behind rocket (at positive Y)
    THRUST_FLAME: [
        [4, 16],
        [0, 24],
        [-4, 16],
    ],

    // Classic dome-topped flying saucer
    SAUCER: [
        [-14, 4],       // bottom-left
        [-10, 6],       // bottom curve left
        [10, 6],        // bottom curve right
        [14, 4],        // bottom-right
        [10, 2],        // mid-right
        [6, 0],         // upper-mid-right
        [4, -3],        // dome-right
        [2, -6],        // dome-top-right
        [-2, -6],       // dome-top-left
        [-4, -3],       // dome-left
        [-6, 0],        // upper-mid-left
        [-10, 2],       // mid-left
    ],

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
        '©': [[[1,0],[4,0],[5,1],[5,6],[4,7],[1,7],[0,6],[0,1],[1,0]], [[3.5,2.5],[2.5,2],[2,2.5],[2,4.5],[2.5,5],[3.5,4.5]]],
        '\'': [[[2.5,0],[2.5,2]]],
        '"': [[[1.5,0],[1.5,2]], [[3.5,0],[3.5,2]]],
        '*': [[[2.5,1],[2.5,5]], [[0.5,2],[4.5,4]], [[4.5,2],[0.5,4]]],
        '(': [[[3,0],[2,1],[2,6],[3,7]]],
        ')': [[[2,0],[3,1],[3,6],[2,7]]]
    }
};

// ============================================================================
// SECTION 5: INPUT HANDLER
// ============================================================================

class InputHandler {
    constructor() {
        this.keys = {};
        this.justPressedKeys = {};
        this._keyDownBuffer = {};
        window.addEventListener('keydown', (e) => {
            if (!e.repeat) this._keyDownBuffer[e.key] = true;
            this.keys[e.key] = true;
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    isDown(key) { return !!this.keys[key]; }
    justPressed(key) { return !!this.justPressedKeys[key]; }
    isLeft() { return this.isDown('ArrowLeft') || this.isDown('a') || this.isDown('A'); }
    isRight() { return this.isDown('ArrowRight') || this.isDown('d') || this.isDown('D'); }
    isThrust() { return this.isDown('ArrowUp') || this.isDown('w') || this.isDown('W'); }
    isFire() { return this.justPressed(' '); }
    isStart() { return this.justPressed('Enter'); }
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
        this.masterGain = null;
        this.noiseBuffer = null;
        this.saucerHumNode = null;
    }

    init() {
        if (this.initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);
        // Create noise buffer for noise-based sounds
        const sr = this.ctx.sampleRate;
        const len = sr * 2;
        this.noiseBuffer = this.ctx.createBuffer(1, len, sr);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        this.initialized = true;
    }

    playNoise(duration, filterFreq, gain) {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        const source = this.ctx.createBufferSource();
        source.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = 1.0;

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(gain, now);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);

        source.start(now);
        source.stop(now + duration);
    }

    fire() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.04);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.04);

        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.04);
    }

    playerHit() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;

        // Noise burst component
        this.playNoise(0.3, 200, 0.4);

        // Sine drop component
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.3);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3);

        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    saucerHit() {
        if (!this.initialized) return;
        this.playNoise(0.2, 400, 0.3);
    }

    thrust() {
        if (!this.initialized) return;
        this.playNoise(0.03, 100, 0.2);
    }

    roundStart() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.3);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3);

        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    roundEnd() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.3);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3);

        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    bonusRound() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        const notes = [400, 500, 600];
        for (let i = 0; i < notes.length; i++) {
            const t = now + i * 0.1;
            const osc = this.ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(notes[i], t);

            const gainNode = this.ctx.createGain();
            gainNode.gain.setValueAtTime(0.2, t);
            gainNode.gain.linearRampToValueAtTime(0, t + 0.1);

            osc.connect(gainNode);
            gainNode.connect(this.masterGain);

            osc.start(t);
            osc.stop(t + 0.1);
        }
    }

    gameOver() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.5);

        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    saucerHumStart() {
        if (!this.initialized) return;
        if (this.saucerHumNode) return; // already humming

        const now = this.ctx.currentTime;

        // Main drone oscillator
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, now);

        // LFO for wobble effect
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(3, now);

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(10, now);

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.08, now);

        osc.connect(gainNode);
        gainNode.connect(this.masterGain);

        osc.start(now);
        lfo.start(now);

        this.saucerHumNode = { osc, lfo, lfoGain, gainNode };
    }

    saucerHumStop() {
        if (!this.saucerHumNode) return;
        const { osc, lfo, lfoGain, gainNode } = this.saucerHumNode;
        try {
            osc.stop();
            lfo.stop();
        } catch (e) {
            // Already stopped
        }
        osc.disconnect();
        lfo.disconnect();
        lfoGain.disconnect();
        gainNode.disconnect();
        this.saucerHumNode = null;
    }
}

// ============================================================================
// SECTION 6: ENTITY CLASSES
// ============================================================================

class Entity {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.radius = radius;
        this.alive = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        const pos = MathUtils.wrapPosition(this.x, this.y);
        this.x = pos[0];
        this.y = pos[1];
    }

    getTransformedVertices(shape, scale, overrideAngle) {
        const angle = overrideAngle !== undefined ? overrideAngle : this.angle;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const s = scale || 1;
        return shape.map(v => [
            this.x + (v[0] * cos - v[1] * sin) * s,
            this.y + (v[0] * sin + v[1] * cos) * s
        ]);
    }
}

class Ship extends Entity {
    constructor() {
        super(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.SHIP_RADIUS);
        this.rotationAngleIndex = 0;
        this.rotationCooldown = 0;
        this.thrusting = false;
        this.invulnerable = false;
        this.invulnTimer = 0;
        this.fireCooldown = 0;
    }

    update(dt) {
        // Update angle from discrete index
        this.angle = this.rotationAngleIndex * (MathUtils.TAU / 16);

        // Rotation cooldown
        if (this.rotationCooldown > 0) this.rotationCooldown -= dt;

        // Thrust applies force in facing direction
        if (this.thrusting) {
            this.vx += Math.sin(this.angle) * CONFIG.SHIP_THRUST;
            this.vy -= Math.cos(this.angle) * CONFIG.SHIP_THRUST;
        }

        // Low-friction drag for Newtonian feel
        this.vx *= CONFIG.SHIP_DRAG;
        this.vy *= CONFIG.SHIP_DRAG;

        // Speed cap
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > CONFIG.SHIP_MAX_SPEED) {
            this.vx = (this.vx / speed) * CONFIG.SHIP_MAX_SPEED;
            this.vy = (this.vy / speed) * CONFIG.SHIP_MAX_SPEED;
        }

        super.update();

        // Invulnerability countdown
        if (this.invulnerable) {
            this.invulnTimer -= dt;
            if (this.invulnTimer <= 0) this.invulnerable = false;
        }

        // Fire cooldown
        if (this.fireCooldown > 0) this.fireCooldown--;
    }

    rotateLeft() {
        if (this.rotationCooldown > 0) return;
        this.rotationAngleIndex = (this.rotationAngleIndex - 1 + 16) % 16;
        this.rotationCooldown = CONFIG.SHIP_ROTATION_RATE;
    }

    rotateRight() {
        if (this.rotationCooldown > 0) return;
        this.rotationAngleIndex = (this.rotationAngleIndex + 1) % 16;
        this.rotationCooldown = CONFIG.SHIP_ROTATION_RATE;
    }

    fire() {
        if (this.fireCooldown > 0) return null;
        this.fireCooldown = CONFIG.SHIP_FIRE_COOLDOWN;
        const noseX = this.x + Math.sin(this.angle) * this.radius;
        const noseY = this.y - Math.cos(this.angle) * this.radius;
        return new Missile(noseX, noseY, this.angle, true);
    }

    respawn() {
        this.x = CONFIG.WIDTH / 2;
        this.y = CONFIG.HEIGHT / 2;
        this.vx = 0;
        this.vy = 0;
        this.rotationAngleIndex = 0;
        this.angle = 0;
        this.thrusting = false;
        this.invulnerable = true;
        this.invulnTimer = CONFIG.PLAYER_INVULN_TIME;
        this.fireCooldown = 0;
        this.alive = true;
    }

    getVertices() {
        return this.getTransformedVertices(SHAPES.ROCKET);
    }

    getFlameVertices() {
        if (!this.thrusting) return null;
        const flicker = 0.7 + Math.random() * 0.5;
        return this.getTransformedVertices(SHAPES.THRUST_FLAME, flicker);
    }
}

class Saucer extends Entity {
    constructor(saucerIndex) {
        const fromLeft = Math.random() < 0.5;
        const x = fromLeft ? -20 : CONFIG.WIDTH + 20;
        const baseY = saucerIndex === 0
            ? CONFIG.HEIGHT * (0.5 - CONFIG.SAUCER_VERTICAL_OFFSET)
            : CONFIG.HEIGHT * (0.5 + CONFIG.SAUCER_VERTICAL_OFFSET);
        const y = baseY + MathUtils.randomRange(-50, 50);

        super(x, y, CONFIG.SAUCER_RADIUS);
        this.saucerIndex = saucerIndex;
        this.fireCooldown = CONFIG.SAUCER_INITIAL_FIRE_DELAY;
        this.legTimer = 0;
        this.pickNewLeg();
    }

    pickNewLeg() {
        const dir = MathUtils.randomInt(0, 7);
        const angle = dir * (MathUtils.TAU / 8);
        this.vx = Math.cos(angle) * CONFIG.SAUCER_SPEED;
        this.vy = Math.sin(angle) * CONFIG.SAUCER_SPEED;
        this.legTimer = MathUtils.randomRange(CONFIG.SAUCER_LEG_MIN_TIME, CONFIG.SAUCER_LEG_MAX_TIME);
    }

    update(dt) {
        this.legTimer -= dt;
        if (this.legTimer <= 0) this.pickNewLeg();
        if (this.fireCooldown > 0) this.fireCooldown--;
        super.update();
    }

    shouldFire() {
        return this.fireCooldown <= 0;
    }

    fire(playerX, playerY) {
        this.fireCooldown = CONFIG.SAUCER_FIRE_COOLDOWN;
        const aimAngle = Math.atan2(playerX - this.x, -(playerY - this.y));
        const spread = MathUtils.randomRange(-CONFIG.SAUCER_AIM_SPREAD, CONFIG.SAUCER_AIM_SPREAD);
        return new Missile(this.x, this.y, aimAngle + spread, false);
    }

    respawn() {
        const fromLeft = Math.random() < 0.5;
        this.x = fromLeft ? -20 : CONFIG.WIDTH + 20;
        const baseY = this.saucerIndex === 0
            ? CONFIG.HEIGHT * (0.5 - CONFIG.SAUCER_VERTICAL_OFFSET)
            : CONFIG.HEIGHT * (0.5 + CONFIG.SAUCER_VERTICAL_OFFSET);
        this.y = baseY + MathUtils.randomRange(-50, 50);
        this.vx = 0;
        this.vy = 0;
        this.fireCooldown = CONFIG.SAUCER_INITIAL_FIRE_DELAY;
        this.alive = true;
        this.pickNewLeg();
    }

    getVertices() {
        return this.getTransformedVertices(SHAPES.SAUCER, 1, 0);
    }
}

class Missile extends Entity {
    constructor(x, y, angle, isPlayerMissile) {
        super(x, y, 2);
        this.isPlayerMissile = isPlayerMissile;
        this.heading = angle;
        this.ownerAngle = angle;

        const speed = isPlayerMissile ? CONFIG.SHIP_MISSILE_SPEED : CONFIG.SAUCER_MISSILE_SPEED;
        this.speed = speed;
        this.vx = Math.sin(angle) * speed;
        this.vy = -Math.cos(angle) * speed;
        this.lifetime = isPlayerMissile ? CONFIG.SHIP_MISSILE_LIFETIME : CONFIG.SAUCER_MISSILE_LIFETIME;
    }

    update() {
        // Gentle guidance for player missiles toward ship's current heading
        if (this.isPlayerMissile) {
            const diff = MathUtils.angleDiff(this.heading, this.ownerAngle);
            const turn = MathUtils.clamp(diff, -CONFIG.SHIP_MISSILE_TURN_RATE, CONFIG.SHIP_MISSILE_TURN_RATE);
            this.heading += turn;
            this.vx = Math.sin(this.heading) * this.speed;
            this.vy = -Math.cos(this.heading) * this.speed;
        }

        this.lifetime--;
        if (this.lifetime <= 0) {
            this.alive = false;
            return;
        }
        super.update();
    }
}

class Particle {
    constructor(x, y, vx, vy, lifetime) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.alpha = 1;
        this.alive = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime--;
        this.alpha = Math.max(0, this.lifetime / this.maxLifetime);
        this.alive = this.lifetime > 0;
        this.vx *= 0.98;
        this.vy *= 0.98;
    }

    static createExplosion(x, y, count, speed) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            const angle = MathUtils.randomDirection();
            const spd = speed * (0.3 + Math.random() * 0.7);
            const lifetime = 15 + Math.floor(Math.random() * 20);
            particles.push(new Particle(
                x, y,
                Math.cos(angle) * spd,
                Math.sin(angle) * spd,
                lifetime
            ));
        }
        return particles;
    }
}
// ════════════════════════════════════════════════════════════════════════════
// SECTION 7: Collision System
// ════════════════════════════════════════════════════════════════════════════

const CollisionSystem = {
    checkCollisions(gameState) {
        const { ship, saucers, playerMissiles, saucerMissiles } = gameState;
        const result = {
            playerHit: false,
            saucerHits: [],
            shipBodyHits: [],
        };

        // 1. Player missiles vs saucers (circle-circle)
        for (const missile of playerMissiles) {
            if (!missile.alive) continue;
            for (const saucer of saucers) {
                if (!saucer.alive) continue;
                if (MathUtils.circlesOverlap(missile.x, missile.y, missile.radius,
                    saucer.x, saucer.y, saucer.radius)) {
                    missile.alive = false;
                    saucer.alive = false;
                    result.saucerHits.push({ saucerIndex: saucer.saucerIndex, missile });
                    break;
                }
            }
        }

        // 2. Saucer missiles vs player ship
        if (ship && ship.alive && !ship.invulnerable) {
            for (const missile of saucerMissiles) {
                if (!missile.alive) continue;
                if (MathUtils.circlesOverlap(missile.x, missile.y, missile.radius,
                    ship.x, ship.y, ship.radius)) {
                    missile.alive = false;
                    result.playerHit = true;
                    break;
                }
            }
        }

        // 3. Ship body vs saucer body (direct collision)
        if (ship && ship.alive && !ship.invulnerable) {
            for (const saucer of saucers) {
                if (!saucer.alive) continue;
                if (MathUtils.circlesOverlap(ship.x, ship.y, ship.radius,
                    saucer.x, saucer.y, saucer.radius)) {
                    result.playerHit = true;
                    saucer.alive = false;
                    result.shipBodyHits.push({ saucerIndex: saucer.saucerIndex });
                    break;
                }
            }
        }

        // 4. Player missiles do NOT collide with saucer missiles (authentic behavior)

        return result;
    }
};

// ════════════════════════════════════════════════════════════════════════════
// SECTION 8: Renderer
// ════════════════════════════════════════════════════════════════════════════

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        canvas.width = CONFIG.WIDTH;
        canvas.height = CONFIG.HEIGHT;

        // Phosphor persistence canvas
        this.persistCanvas = document.createElement('canvas');
        this.persistCanvas.width = CONFIG.WIDTH;
        this.persistCanvas.height = CONFIG.HEIGHT;
        this.persistCtx = this.persistCanvas.getContext('2d');

        // Vignette overlay
        this.vignetteCanvas = document.createElement('canvas');
        this.vignetteCanvas.width = CONFIG.WIDTH;
        this.vignetteCanvas.height = CONFIG.HEIGHT;
        this.createVignette();

        this.frameCount = 0;
    }

    createVignette() {
        const ctx = this.vignetteCanvas.getContext('2d');
        const cx = CONFIG.WIDTH / 2, cy = CONFIG.HEIGHT / 2;
        const outerRadius = Math.sqrt(cx * cx + cy * cy);
        const gradient = ctx.createRadialGradient(cx, cy, outerRadius * 0.35, cx, cy, outerRadius);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.7, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${CONFIG.VIGNETTE_STRENGTH})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    }

    render(gameState) {
        this.frameCount++;
        const ctx = this.ctx;
        const pctx = this.persistCtx;

        // 1. Fade persistence
        pctx.globalCompositeOperation = 'source-over';
        pctx.fillStyle = `rgba(0,0,0,${CONFIG.PHOSPHOR_ALPHA})`;
        pctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

        // 2. Clear main
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

        // 3. Draw entities to main
        this.drawEntities(ctx, gameState);

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
        this.drawEntities(ctx, gameState);

        // 7. Scanlines (raster display)
        this.drawScanlines(ctx);

        // 8. Vignette
        ctx.drawImage(this.vignetteCanvas, 0, 0);

        // 9. HUD and overlays
        if (gameState.state === 'attract') {
            this.drawAttractScreen(ctx, gameState);
        } else if (gameState.state === 'roundResult' || gameState.state === 'gameOver') {
            this.drawHUD(ctx, gameState);
            this.drawRoundResult(ctx, gameState);
        } else {
            this.drawHUD(ctx, gameState);
        }
    }

    drawScanlines(ctx) {
        ctx.fillStyle = `rgba(0,0,0,${CONFIG.SCANLINE_ALPHA})`;
        for (let y = 0; y < CONFIG.HEIGHT; y += 3) {
            ctx.fillRect(0, y, CONFIG.WIDTH, 1);
        }
    }

    drawEntities(ctx, gameState) {
        // Stars (always)
        if (gameState.stars) this.drawStars(ctx, gameState.stars);

        // Ship
        if (gameState.ship && gameState.ship.alive) {
            this.drawWithWrap(ctx, gameState.ship, this.drawShip.bind(this));
        }

        // Saucers
        if (gameState.saucers) {
            for (const s of gameState.saucers) {
                if (s.alive) this.drawWithWrap(ctx, s, this.drawSaucer.bind(this));
            }
        }

        // Missiles
        if (gameState.playerMissiles) {
            for (const m of gameState.playerMissiles) {
                if (m.alive) this.drawMissile(ctx, m);
            }
        }
        if (gameState.saucerMissiles) {
            for (const m of gameState.saucerMissiles) {
                if (m.alive) this.drawMissile(ctx, m);
            }
        }

        // Particles
        if (gameState.particles) this.drawParticles(ctx, gameState.particles);
    }

    drawWithWrap(ctx, entity, drawFn) {
        // Draw entity and wrapping ghosts near edges
        drawFn(ctx, entity);
        const r = entity.radius || 20;
        const ox = entity.x, oy = entity.y;
        const nearL = ox < r, nearR = ox > CONFIG.WIDTH - r;
        const nearT = oy < r, nearB = oy > CONFIG.HEIGHT - r;
        if (nearL) { entity.x = ox + CONFIG.WIDTH; drawFn(ctx, entity); entity.x = ox; }
        else if (nearR) { entity.x = ox - CONFIG.WIDTH; drawFn(ctx, entity); entity.x = ox; }
        if (nearT) { entity.y = oy + CONFIG.HEIGHT; drawFn(ctx, entity); entity.y = oy; }
        else if (nearB) { entity.y = oy - CONFIG.HEIGHT; drawFn(ctx, entity); entity.y = oy; }
        if ((nearL || nearR) && (nearT || nearB)) {
            entity.x = nearL ? ox + CONFIG.WIDTH : ox - CONFIG.WIDTH;
            entity.y = nearT ? oy + CONFIG.HEIGHT : oy - CONFIG.HEIGHT;
            drawFn(ctx, entity);
            entity.x = ox;
            entity.y = oy;
        }
    }

    drawPolygon(ctx, vertices, close) {
        if (!vertices || vertices.length < 2) return;
        if (close === undefined) close = true;
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

    drawShip(ctx, ship) {
        if (ship.invulnerable) {
            const blinkPhase = Math.floor(Date.now() / CONFIG.PLAYER_BLINK_RATE) % 2;
            if (blinkPhase === 0) return;
        }
        const verts = ship.getVertices();
        this.drawPolygon(ctx, verts, true);
        // Thrust flame
        if (ship.thrusting && Math.random() > 0.3) {
            const flame = ship.getFlameVertices();
            if (flame) {
                ctx.save();
                ctx.strokeStyle = CONFIG.STROKE_COLOR;
                ctx.lineWidth = 1.2;
                ctx.shadowBlur = 10;
                ctx.shadowColor = CONFIG.GLOW_COLOR;
                ctx.beginPath();
                ctx.moveTo(flame[0][0], flame[0][1]);
                for (let i = 1; i < flame.length; i++) ctx.lineTo(flame[i][0], flame[i][1]);
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    drawSaucer(ctx, saucer) {
        const verts = saucer.getVertices();
        this.drawPolygon(ctx, verts, true);
    }

    drawMissile(ctx, missile) {
        ctx.save();
        ctx.fillStyle = CONFIG.STROKE_COLOR;
        ctx.shadowBlur = 6;
        ctx.shadowColor = CONFIG.GLOW_COLOR;
        ctx.beginPath();
        ctx.arc(missile.x, missile.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawStars(ctx, stars) {
        ctx.save();
        ctx.fillStyle = CONFIG.STROKE_COLOR;
        for (const star of stars) {
            ctx.globalAlpha = star.brightness;
            ctx.fillRect(star.x, star.y, 1, 1);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    drawParticles(ctx, particles) {
        ctx.save();
        for (const p of particles) {
            if (!p.alive || p.alpha <= 0) continue;
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = CONFIG.STROKE_COLOR;
            ctx.shadowBlur = 4;
            ctx.shadowColor = CONFIG.DIM_GLOW_COLOR;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // ── Vector Text (same pattern as Asteroids) ──
    drawText(ctx, text, x, y, scale) {
        scale = scale || 1;
        const str = text.toUpperCase();
        const charWidth = 5;
        const spacing = 1;
        let cursorX = x;
        ctx.save();
        ctx.strokeStyle = CONFIG.STROKE_COLOR;
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

    drawCenteredText(ctx, text, y, scale) {
        const w = this.measureText(text, scale);
        this.drawText(ctx, text, (CONFIG.WIDTH - w) / 2, y, scale);
    }

    // ── HUD ──
    drawHUD(ctx, gameState) {
        // Timer (top center)
        const timerStr = String(Math.ceil(gameState.roundTimer || 0)).padStart(2, '0');
        this.drawCenteredText(ctx, timerStr, 20, 3);

        // Player score (top left)
        const pScore = String(gameState.playerScore || 0);
        this.drawText(ctx, pScore, 30, 20, 2.5);

        // Saucer score (top right)
        const sScore = String(gameState.saucerScore || 0);
        const sWidth = this.measureText(sScore, 2.5);
        this.drawText(ctx, sScore, CONFIG.WIDTH - 30 - sWidth, 20, 2.5);

        // Round number (below timer)
        if (gameState.roundNumber) {
            const roundStr = 'ROUND ' + gameState.roundNumber;
            this.drawCenteredText(ctx, roundStr, 55, 1.2);
        }
    }

    drawAttractScreen(ctx, gameState) {
        // Title
        this.drawCenteredText(ctx, 'COMPUTER SPACE', 120, 5);

        // Spinning rocket in center area
        if (gameState.attractSpinAngle !== undefined) {
            ctx.save();
            const cx = CONFIG.WIDTH / 2, cy = 310;
            const cos = Math.cos(gameState.attractSpinAngle);
            const sin = Math.sin(gameState.attractSpinAngle);
            const verts = SHAPES.ROCKET.map(v => [
                cx + (v[0] * cos - v[1] * sin),
                cy + (v[0] * sin + v[1] * cos)
            ]);
            this.drawPolygon(ctx, verts, true);
            ctx.restore();
        }

        // Drifting saucers (two, slowly moving)
        const t = this.frameCount * 0.01;
        const s1x = CONFIG.WIDTH * 0.3 + Math.sin(t) * 40;
        const s1y = 280 + Math.cos(t * 0.7) * 20;
        const s2x = CONFIG.WIDTH * 0.7 + Math.sin(t + 2) * 40;
        const s2y = 340 + Math.cos(t * 0.7 + 1) * 20;
        const saucerVerts1 = SHAPES.SAUCER.map(v => [s1x + v[0], s1y + v[1]]);
        const saucerVerts2 = SHAPES.SAUCER.map(v => [s2x + v[0], s2y + v[1]]);
        this.drawPolygon(ctx, saucerVerts1, true);
        this.drawPolygon(ctx, saucerVerts2, true);

        // Controls
        this.drawCenteredText(ctx, 'ARROWS/WASD  ROTATE AND THRUST', 440, 1.5);
        this.drawCenteredText(ctx, 'SPACE  FIRE', 465, 1.5);
        this.drawCenteredText(ctx, 'ENTER  START', 490, 1.5);

        // Blinking INSERT COIN
        if (Math.floor(this.frameCount / 30) % 2 === 0) {
            this.drawCenteredText(ctx, 'INSERT COIN', 550, 3);
        }

        // Copyright
        this.drawCenteredText(ctx, '1971 NUTTING ASSOCIATES', CONFIG.HEIGHT - 40, 1.5);
    }

    drawRoundResult(ctx, gameState) {
        const cy = CONFIG.HEIGHT / 2;
        if (gameState.state === 'gameOver') {
            this.drawCenteredText(ctx, 'GAME OVER', cy - 40, 5);
            // Show final scores
            const pStr = 'PLAYER ' + (gameState.playerScore || 0);
            const sStr = 'SAUCERS ' + (gameState.saucerScore || 0);
            this.drawCenteredText(ctx, pStr, cy + 30, 2);
            this.drawCenteredText(ctx, sStr, cy + 60, 2);
        } else if (gameState.state === 'roundResult') {
            if (gameState.isBonus) {
                this.drawCenteredText(ctx, 'BONUS ROUND!', cy - 20, 4);
            } else {
                this.drawCenteredText(ctx, 'GAME OVER', cy - 20, 4);
            }
        }
    }
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION 9: Game State Machine
// ════════════════════════════════════════════════════════════════════════════

class Game {
    constructor(canvas) {
        this.renderer = new Renderer(canvas);
        this.input = new InputHandler();
        this.sound = new SoundEngine();

        this.state = 'attract';
        this.stateTimer = 0;

        this.ship = null;
        this.saucers = [];
        this.playerMissiles = [];
        this.saucerMissiles = [];
        this.particles = [];
        this.stars = [];

        this.playerScore = 0;
        this.saucerScore = 0;
        this.roundTimer = 0;
        this.roundNumber = 0;
        this.highScore = parseInt(localStorage.getItem('cs_highscore')) || 0;

        this.attractSpinAngle = 0;
        this.isBonus = false;

        this.playerRespawnTimer = 0;
        this.saucerRespawnTimers = [0, 0];

        this.lastTime = 0;

        this.initStars();
    }

    initStars() {
        this.stars = [];
        for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
            this.stars.push({
                x: Math.random() * CONFIG.WIDTH,
                y: Math.random() * CONFIG.HEIGHT,
                brightness: 0.3 + Math.random() * 0.7
            });
        }
    }

    startGame() {
        this.sound.init();
        this.playerScore = 0;
        this.saucerScore = 0;
        this.roundNumber = 1;
        this.isBonus = false;
        this.startRound();
    }

    startRound() {
        this.state = 'roundStart';
        this.stateTimer = CONFIG.ROUND_START_DELAY;
        this.roundTimer = CONFIG.ROUND_DURATION;

        this.ship = new Ship();
        this.saucers = [new Saucer(0), new Saucer(1)];
        this.playerMissiles = [];
        this.saucerMissiles = [];
        this.particles = [];
        this.playerRespawnTimer = 0;
        this.saucerRespawnTimers = [0, 0];

        this.sound.saucerHumStart();
        this.sound.roundStart();
    }

    update(dt) {
        this.input.update();

        switch (this.state) {
            case 'attract': this.updateAttract(dt); break;
            case 'roundStart': this.updateRoundStart(dt); break;
            case 'playing': this.updatePlaying(dt); break;
            case 'playerDeath': this.updatePlayerDeath(dt); break;
            case 'roundEnd': this.updateRoundEnd(dt); break;
            case 'roundResult': this.updateRoundResult(dt); break;
            case 'gameOver': this.updateGameOver(dt); break;
        }
    }

    updateAttract(dt) {
        this.attractSpinAngle += CONFIG.ATTRACT_SPIN_SPEED;
        if (this.input.isStart()) {
            this.startGame();
        }
    }

    updateRoundStart(dt) {
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
            this.state = 'playing';
        }
    }

    updatePlaying(dt) {
        // Round timer countdown
        this.roundTimer -= dt / 1000;
        if (this.roundTimer <= 0) {
            this.roundTimer = 0;
            this.endRound();
            return;
        }

        // Player input
        if (this.ship && this.ship.alive) {
            if (this.input.isLeft()) this.ship.rotateLeft();
            if (this.input.isRight()) this.ship.rotateRight();
            this.ship.thrusting = this.input.isThrust();

            if (this.ship.thrusting) this.sound.thrust();

            if (this.input.isFire() && this.playerMissiles.filter(m => m.alive).length < CONFIG.MAX_SHIP_MISSILES) {
                const missile = this.ship.fire();
                if (missile) {
                    this.playerMissiles.push(missile);
                    this.sound.fire();
                }
            }
        }

        // Update ship
        if (this.ship) {
            if (this.ship.alive) {
                this.ship.update(dt);
            }
        }

        // Update saucers
        for (const saucer of this.saucers) {
            if (saucer.alive) {
                saucer.update(dt);
                if (saucer.shouldFire() && this.ship && this.ship.alive) {
                    if (this.saucerMissiles.filter(m => m.alive).length < CONFIG.MAX_SAUCER_MISSILES * 2) {
                        const missile = saucer.fire(this.ship.x, this.ship.y);
                        this.saucerMissiles.push(missile);
                    }
                }
            }
        }

        // Update missile guidance (player missiles track ship heading)
        if (this.ship && this.ship.alive) {
            for (const m of this.playerMissiles) {
                if (m.alive && m.isPlayerMissile) {
                    m.ownerAngle = this.ship.angle;
                }
            }
        }

        // Update missiles
        for (const m of this.playerMissiles) { if (m.alive) m.update(); }
        for (const m of this.saucerMissiles) { if (m.alive) m.update(); }

        // Update particles
        for (const p of this.particles) { if (p.alive) p.update(); }

        // Collisions
        const collisionResult = CollisionSystem.checkCollisions(this.getState());

        // Process collision results
        for (const hit of collisionResult.saucerHits) {
            this.playerScore += CONFIG.HIT_SAUCER_SCORE;
            this.particles.push(...Particle.createExplosion(
                hit.missile.x, hit.missile.y,
                CONFIG.EXPLOSION_PARTICLE_COUNT, CONFIG.EXPLOSION_PARTICLE_SPEED
            ));
            this.sound.saucerHit();
            this.saucerRespawnTimers[hit.saucerIndex] = CONFIG.SAUCER_RESPAWN_DELAY;
        }

        if (collisionResult.playerHit && this.ship && this.ship.alive) {
            this.saucerScore += CONFIG.HIT_PLAYER_SCORE;
            this.particles.push(...Particle.createExplosion(
                this.ship.x, this.ship.y,
                CONFIG.EXPLOSION_PARTICLE_COUNT * 2, CONFIG.EXPLOSION_PARTICLE_SPEED
            ));
            this.ship.alive = false;
            this.sound.playerHit();
            this.state = 'playerDeath';
            this.playerRespawnTimer = CONFIG.PLAYER_RESPAWN_DELAY;
        }

        for (const hit of collisionResult.shipBodyHits) {
            this.saucerRespawnTimers[hit.saucerIndex] = CONFIG.SAUCER_RESPAWN_DELAY;
        }

        // Saucer respawn timers
        for (let i = 0; i < 2; i++) {
            if (this.saucerRespawnTimers[i] > 0) {
                this.saucerRespawnTimers[i] -= dt;
                if (this.saucerRespawnTimers[i] <= 0 && !this.saucers[i].alive) {
                    this.saucers[i].respawn();
                }
            }
        }

        // Cleanup dead missiles
        this.playerMissiles = this.playerMissiles.filter(m => m.alive);
        this.saucerMissiles = this.saucerMissiles.filter(m => m.alive);
        this.particles = this.particles.filter(p => p.alive);
    }

    updatePlayerDeath(dt) {
        // Continue updating saucers and missiles during death
        for (const saucer of this.saucers) {
            if (saucer.alive) saucer.update(dt);
        }
        for (const m of this.saucerMissiles) { if (m.alive) m.update(); }
        for (const p of this.particles) { if (p.alive) p.update(); }
        this.particles = this.particles.filter(p => p.alive);
        this.saucerMissiles = this.saucerMissiles.filter(m => m.alive);

        // Saucer respawn during player death
        for (let i = 0; i < 2; i++) {
            if (this.saucerRespawnTimers[i] > 0) {
                this.saucerRespawnTimers[i] -= dt;
                if (this.saucerRespawnTimers[i] <= 0 && !this.saucers[i].alive) {
                    this.saucers[i].respawn();
                }
            }
        }

        // Round timer still counts down during death
        this.roundTimer -= dt / 1000;
        if (this.roundTimer <= 0) {
            this.roundTimer = 0;
            this.endRound();
            return;
        }

        this.playerRespawnTimer -= dt;
        if (this.playerRespawnTimer <= 0) {
            this.ship.respawn();
            this.state = 'playing';
        }
    }

    endRound() {
        this.state = 'roundEnd';
        this.stateTimer = 1500;
        this.sound.saucerHumStop();
        this.sound.roundEnd();
    }

    updateRoundEnd(dt) {
        for (const p of this.particles) { if (p.alive) p.update(); }
        this.particles = this.particles.filter(p => p.alive);

        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
            if (this.playerScore > this.saucerScore) {
                this.isBonus = true;
                this.state = 'roundResult';
                this.stateTimer = 3000;
                this.sound.bonusRound();
            } else {
                this.isBonus = false;
                this.state = 'gameOver';
                this.stateTimer = CONFIG.GAME_OVER_DURATION;
                this.sound.gameOver();
            }
        }
    }

    updateRoundResult(dt) {
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
            // Bonus round — start next round keeping scores
            this.roundNumber++;
            this.startRound();
        }
    }

    updateGameOver(dt) {
        this.stateTimer -= dt;
        // Save high score
        const totalScore = this.playerScore;
        if (totalScore > this.highScore) {
            this.highScore = totalScore;
            localStorage.setItem('cs_highscore', String(this.highScore));
        }
        if (this.stateTimer <= 0) {
            this.state = 'attract';
        }
    }

    getState() {
        return {
            state: this.state,
            ship: this.ship,
            saucers: this.saucers,
            playerMissiles: this.playerMissiles,
            saucerMissiles: this.saucerMissiles,
            particles: this.particles,
            stars: this.stars,
            playerScore: this.playerScore,
            saucerScore: this.saucerScore,
            roundTimer: this.roundTimer,
            roundNumber: this.roundNumber,
            highScore: this.highScore,
            stateTimer: this.stateTimer,
            attractSpinAngle: this.attractSpinAngle,
            isBonus: this.isBonus,
        };
    }

    renderFrame(dt) {
        this.update(dt);
        this.renderer.render(this.getState());
    }
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION 10: Main Loop
// ════════════════════════════════════════════════════════════════════════════

(function() {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    let lastTime = 0;

    function gameLoop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        let dt = timestamp - lastTime;
        lastTime = timestamp;
        if (dt > CONFIG.MAX_DELTA) dt = CONFIG.FRAME_TIME;
        game.renderFrame(dt);
        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
})();
