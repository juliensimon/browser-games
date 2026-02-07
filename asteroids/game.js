'use strict';

// ============================================================================
// SECTION 1: CONFIG — All tunable game constants
// ============================================================================

const CONFIG = Object.freeze({
    WIDTH: 1024,
    HEIGHT: 768,

    // Ship physics
    SHIP_ROTATION_SPEED: 5,
    SHIP_THRUST: 0.1,
    SHIP_MAX_SPEED: 8,
    SHIP_DRAG: 0.99,
    SHIP_RADIUS: 12,
    SHIP_INVULN_TIME: 3000,
    SHIP_BLINK_RATE: 100,

    // Bullets
    BULLET_SPEED: 10,
    BULLET_LIFETIME: 45,
    MAX_BULLETS: 4,
    BULLET_RADIUS: 2,

    // Asteroids
    ASTEROID_SPEEDS: [1, 2, 3],
    ASTEROID_RADII: [40, 20, 10],
    ASTEROID_SCORES: [20, 50, 100],
    INITIAL_ASTEROIDS: 4,
    ASTEROIDS_PER_WAVE: 2,
    MAX_INITIAL_ASTEROIDS: 11,
    MAX_ASTEROIDS: 26,
    ASTEROID_SPLIT_SPEED_MULT: 1.5,

    // UFO
    UFO_SCORE_LARGE: 200,
    UFO_SCORE_SMALL: 1000,
    UFO_SPEED: 2,
    UFO_FIRE_INTERVAL_LARGE: 2000,
    UFO_FIRE_INTERVAL_SMALL: 1500,
    UFO_DIRECTION_CHANGE: 1500,
    UFO_SPAWN_INTERVAL: 15000,
    UFO_SPAWN_MIN_INTERVAL: 7000,
    UFO_SMALL_THRESHOLD: 10000,
    UFO_RADIUS_LARGE: 20,
    UFO_RADIUS_SMALL: 10,

    // Hyperspace
    HYPERSPACE_EXPLODE_CHANCE: 0.28,

    // Game rules
    STARTING_LIVES: 3,
    EXTRA_LIFE_SCORE: 10000,
    WAVE_DELAY: 2000,
    RESPAWN_DELAY: 2000,
    SAFE_ZONE_RADIUS: 120,
    GAME_OVER_DURATION: 3000,

    // Rendering
    GLOW_COLOR: 'rgba(200, 255, 255, 1)',
    DIM_GLOW_COLOR: 'rgba(200, 255, 255, 0.7)',
    STROKE_COLOR: '#ffffff',
    PHOSPHOR_ALPHA: 0.15,
    VIGNETTE_STRENGTH: 0.4,

    // Heartbeat
    HEARTBEAT_MAX_INTERVAL: 1200,
    HEARTBEAT_MIN_INTERVAL: 200,

    // Physics
    FPS: 60,
    FRAME_TIME: 1000 / 60,
    MAX_DELTA: 200,
});

// ============================================================================
// SECTION 2: Math Utilities
// ============================================================================

const MathUtils = {
    degToRad(deg) {
        return deg * Math.PI / 180;
    },

    wrapPosition(x, y) {
        const w = CONFIG.WIDTH;
        const h = CONFIG.HEIGHT;
        return [
            ((x % w) + w) % w,
            ((y % h) + h) % h
        ];
    },

    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    distanceSq(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return dx * dx + dy * dy;
    },

    toroidalDistanceSq(x1, y1, x2, y2) {
        const w = CONFIG.WIDTH;
        const h = CONFIG.HEIGHT;
        let dx = Math.abs(x1 - x2);
        let dy = Math.abs(y1 - y2);
        if (dx > w / 2) dx = w - dx;
        if (dy > h / 2) dy = h - dy;
        return dx * dx + dy * dy;
    },

    circlesOverlap(x1, y1, r1, x2, y2, r2) {
        const radSum = r1 + r2;
        return this.toroidalDistanceSq(x1, y1, x2, y2) < radSum * radSum;
    },

    pointInPolygon(px, py, vertices) {
        let inside = false;
        const n = vertices.length;
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = vertices[i][0], yi = vertices[i][1];
            const xj = vertices[j][0], yj = vertices[j][1];
            if (((yi > py) !== (yj > py)) &&
                (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    },

    rotatePoint(x, y, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [
            x * cos - y * sin,
            x * sin + y * cos
        ];
    },

    randomDirection() {
        return Math.random() * Math.PI * 2;
    }
};

// ============================================================================
// SECTION 3: Vector Shape Data
// ============================================================================

const SHAPES = {
    SHIP: [
        [0, -15], [10, 10], [4, 7], [-4, 7], [-10, 10]
    ],

    THRUST_FLAME: [
        [4, 7], [0, 14], [-4, 7]
    ],

    ASTEROID_SHAPES: [
        [
            [0.0, -1.0], [0.4, -0.75], [0.85, -0.55], [1.0, -0.1],
            [0.7, 0.25], [0.95, 0.6], [0.5, 1.0], [0.1, 0.75],
            [-0.4, 0.95], [-0.8, 0.55], [-1.0, 0.1], [-0.65, -0.6]
        ],
        [
            [-0.15, -1.0], [0.35, -0.85], [0.8, -0.65], [1.0, -0.2],
            [0.85, 0.3], [0.55, 0.75], [0.2, 1.0], [-0.3, 0.85],
            [-0.7, 0.65], [-1.0, 0.15], [-0.85, -0.35], [-0.5, -0.8]
        ],
        [
            [0.1, -1.0], [0.55, -0.7], [0.9, -0.45], [1.0, 0.1],
            [0.75, 0.55], [0.35, 0.95], [-0.2, 1.0], [-0.65, 0.7],
            [-0.95, 0.25], [-1.0, -0.3], [-0.6, -0.75]
        ],
        [
            [0.0, -1.0], [0.5, -0.85], [0.75, -0.5], [1.0, -0.15],
            [0.85, 0.35], [0.6, 0.7], [0.2, 1.0], [-0.25, 0.8],
            [-0.65, 0.9], [-0.9, 0.45], [-1.0, -0.1], [-0.7, -0.65]
        ]
    ],

    UFO: [
        [-1, 0], [-0.6, 0.3], [0.6, 0.3], [1, 0], [0.6, -0.15], [-0.6, -0.15], [-1, 0]
    ],

    UFO_DOME: [
        [-0.4, -0.15], [-0.25, -0.4], [0.25, -0.4], [0.4, -0.15]
    ],

    FONT: {
        'A': [
            [[0,7],[0,2],[1,0],[4,0],[5,2],[5,7]],
            [[0,4],[5,4]]
        ],
        'B': [
            [[0,7],[0,0],[4,0],[5,1],[5,3],[4,3.5],[5,4],[5,6],[4,7],[0,7]],
            [[0,3.5],[4,3.5]]
        ],
        'C': [
            [[5,1],[4,0],[1,0],[0,1],[0,6],[1,7],[4,7],[5,6]]
        ],
        'D': [
            [[0,0],[0,7],[3,7],[5,5],[5,2],[3,0],[0,0]]
        ],
        'E': [
            [[5,0],[0,0],[0,7],[5,7]],
            [[0,3.5],[3,3.5]]
        ],
        'F': [
            [[5,0],[0,0],[0,7]],
            [[0,3.5],[3,3.5]]
        ],
        'G': [
            [[5,1],[4,0],[1,0],[0,1],[0,6],[1,7],[4,7],[5,6],[5,3.5],[3,3.5]]
        ],
        'H': [
            [[0,0],[0,7]],
            [[5,0],[5,7]],
            [[0,3.5],[5,3.5]]
        ],
        'I': [
            [[1,0],[4,0]],
            [[2.5,0],[2.5,7]],
            [[1,7],[4,7]]
        ],
        'J': [
            [[1,0],[5,0]],
            [[3.5,0],[3.5,6],[2.5,7],[1,7],[0,6]]
        ],
        'K': [
            [[0,0],[0,7]],
            [[5,0],[0,3.5],[5,7]]
        ],
        'L': [
            [[0,0],[0,7],[5,7]]
        ],
        'M': [
            [[0,7],[0,0],[2.5,3],[5,0],[5,7]]
        ],
        'N': [
            [[0,7],[0,0],[5,7],[5,0]]
        ],
        'O': [
            [[1,0],[4,0],[5,1],[5,6],[4,7],[1,7],[0,6],[0,1],[1,0]]
        ],
        'P': [
            [[0,7],[0,0],[4,0],[5,1],[5,3],[4,4],[0,4]]
        ],
        'Q': [
            [[1,0],[4,0],[5,1],[5,6],[4,7],[1,7],[0,6],[0,1],[1,0]],
            [[3,5],[5,7]]
        ],
        'R': [
            [[0,7],[0,0],[4,0],[5,1],[5,3],[4,4],[0,4]],
            [[3,4],[5,7]]
        ],
        'S': [
            [[5,1],[4,0],[1,0],[0,1],[0,3],[1,3.5],[4,3.5],[5,4],[5,6],[4,7],[1,7],[0,6]]
        ],
        'T': [
            [[0,0],[5,0]],
            [[2.5,0],[2.5,7]]
        ],
        'U': [
            [[0,0],[0,6],[1,7],[4,7],[5,6],[5,0]]
        ],
        'V': [
            [[0,0],[2.5,7],[5,0]]
        ],
        'W': [
            [[0,0],[1,7],[2.5,4],[4,7],[5,0]]
        ],
        'X': [
            [[0,0],[5,7]],
            [[5,0],[0,7]]
        ],
        'Y': [
            [[0,0],[2.5,3.5],[5,0]],
            [[2.5,3.5],[2.5,7]]
        ],
        'Z': [
            [[0,0],[5,0],[0,7],[5,7]]
        ],
        '0': [
            [[1,0],[4,0],[5,1],[5,6],[4,7],[1,7],[0,6],[0,1],[1,0]],
            [[0,6],[5,1]]
        ],
        '1': [
            [[1.5,1],[2.5,0],[2.5,7]],
            [[1,7],[4,7]]
        ],
        '2': [
            [[0,1],[1,0],[4,0],[5,1],[5,3],[0,7],[5,7]]
        ],
        '3': [
            [[0,1],[1,0],[4,0],[5,1],[5,3],[4,3.5],[5,4],[5,6],[4,7],[1,7],[0,6]],
            [[2,3.5],[4,3.5]]
        ],
        '4': [
            [[0,0],[0,3.5],[5,3.5]],
            [[5,0],[5,7]]
        ],
        '5': [
            [[5,0],[0,0],[0,3],[4,3],[5,4],[5,6],[4,7],[1,7],[0,6]]
        ],
        '6': [
            [[4,0],[1,0],[0,1],[0,6],[1,7],[4,7],[5,6],[5,4],[4,3],[0,3]]
        ],
        '7': [
            [[0,0],[5,0],[2,7]]
        ],
        '8': [
            [[1,0],[4,0],[5,1],[5,3],[4,3.5],[1,3.5],[0,4],[0,6],[1,7],[4,7],[5,6],[5,4],[4,3.5]],
            [[1,3.5],[0,3],[0,1],[1,0]]
        ],
        '9': [
            [[5,3.5],[1,3.5],[0,3],[0,1],[1,0],[4,0],[5,1],[5,6],[4,7],[1,7]]
        ],
        ' ': [],
        '-': [
            [[1,3.5],[4,3.5]]
        ],
        '.': [
            [[2,6.5],[3,6.5],[3,7],[2,7],[2,6.5]]
        ],
        ',': [
            [[2.5,6],[3,6.5],[2,7.5]]
        ],
        '!': [
            [[2.5,0],[2.5,4.5]],
            [[2.5,6],[2.5,7]]
        ],
        '?': [
            [[0,1],[1,0],[4,0],[5,1],[5,2.5],[3,4],[2.5,4.5]],
            [[2.5,6],[2.5,7]]
        ],
        ':': [
            [[2.5,2],[2.5,2.5]],
            [[2.5,5],[2.5,5.5]]
        ],
        '/': [
            [[5,0],[0,7]]
        ],
        '©': [
            [[1,0],[4,0],[5,1],[5,6],[4,7],[1,7],[0,6],[0,1],[1,0]],
            [[3.5,2.5],[2.5,2],[2,2.5],[2,4.5],[2.5,5],[3.5,4.5]]
        ],
        '\'': [
            [[2.5,0],[2.5,2]]
        ],
        '"': [
            [[1.5,0],[1.5,2]],
            [[3.5,0],[3.5,2]]
        ],
        '*': [
            [[2.5,1],[2.5,5]],
            [[0.5,2],[4.5,4]],
            [[4.5,2],[0.5,4]]
        ],
        '(': [
            [[3,0],[2,1],[2,6],[3,7]]
        ],
        ')': [
            [[2,0],[3,1],[3,6],[2,7]]
        ]
    }
};

// ============================================================================
// SECTION 4: Sound Engine
// ============================================================================

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.masterGain = null;
        this.noiseBuffer = null;
        this.thrustNode = null;
        this.thrustGain = null;
        this.saucerNode = null;
        this.heartbeatTimer = 0;
        this.heartbeatToggle = false;
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

    fire() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.linearRampToValueAtTime(200, t + 0.06);
        const gn = this.ctx.createGain();
        gn.gain.setValueAtTime(0.3, t);
        gn.gain.linearRampToValueAtTime(0, t + 0.06);
        osc.connect(gn);
        gn.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.06);
    }

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
    }

    thrustOff() {
        if (!this.initialized) return;
        if (!this.thrustNode) return;
        this.thrustNode.stop();
        this.thrustNode.disconnect();
        this.thrustGain.disconnect();
        this.thrustNode = null;
        this.thrustGain = null;
    }

    explosionSmall() {
        this.playNoise(0.1, 400, 0.3);
    }

    explosionMedium() {
        this.playNoise(0.2, 200, 0.4);
    }

    explosionLarge() {
        this.playNoise(0.4, 100, 0.5);
    }

    shipExplosion() {
        if (!this.initialized) return;
        this.playNoise(0.6, 100, 0.5);
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.linearRampToValueAtTime(60, t + 0.6);
        const gn = this.ctx.createGain();
        gn.gain.setValueAtTime(0.4, t);
        gn.gain.linearRampToValueAtTime(0, t + 0.6);
        osc.connect(gn);
        gn.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.6);
    }

    heartbeat(tempo) {
        if (!this.initialized) return;
        this.heartbeatTimer -= CONFIG.FRAME_TIME;
        if (this.heartbeatTimer > 0) return;
        this.heartbeatTimer = tempo;
        const t = this.ctx.currentTime;
        const freq = this.heartbeatToggle ? 50 : 60;
        this.heartbeatToggle = !this.heartbeatToggle;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const gn = this.ctx.createGain();
        gn.gain.setValueAtTime(0.4, t);
        gn.gain.linearRampToValueAtTime(0, t + 0.08);
        osc.connect(gn);
        gn.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.08);
    }

    saucerStart(isSmall) {
        if (!this.initialized) return;
        if (this.saucerNode) this.saucerStop();
        const baseFreq = isSmall ? 900 : 400;
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'square';
        osc1.frequency.value = baseFreq;
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.value = baseFreq * 1.02;
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = isSmall ? 8 : 4;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = baseFreq * 0.1;
        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        lfoGain.connect(osc2.frequency);
        const gn = this.ctx.createGain();
        gn.gain.value = 0.15;
        osc1.connect(gn);
        osc2.connect(gn);
        gn.connect(this.masterGain);
        osc1.start();
        osc2.start();
        lfo.start();
        this.saucerNode = { osc1, osc2, lfo, lfoGain, gain: gn };
    }

    saucerStop() {
        if (!this.initialized || !this.saucerNode) return;
        const s = this.saucerNode;
        s.osc1.stop();
        s.osc2.stop();
        s.lfo.stop();
        s.osc1.disconnect();
        s.osc2.disconnect();
        s.lfo.disconnect();
        s.lfoGain.disconnect();
        s.gain.disconnect();
        this.saucerNode = null;
    }

    saucerFire() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.linearRampToValueAtTime(400, t + 0.08);
        const gn = this.ctx.createGain();
        gn.gain.setValueAtTime(0.25, t);
        gn.gain.linearRampToValueAtTime(0, t + 0.08);
        osc.connect(gn);
        gn.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.08);
    }

    extraLife() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const notes = [523, 659, 784, 1047];
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

    hyperspace() {
        if (!this.initialized) return;
        this.playNoise(0.15, 300, 0.3);
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.linearRampToValueAtTime(80, t + 0.2);
        const gn = this.ctx.createGain();
        gn.gain.setValueAtTime(0.3, t);
        gn.gain.linearRampToValueAtTime(0, t + 0.2);
        osc.connect(gn);
        gn.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    coinInsert() {
        if (!this.initialized) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 880;
        const gn = this.ctx.createGain();
        gn.gain.setValueAtTime(0.3, t);
        gn.gain.linearRampToValueAtTime(0, t + 0.12);
        osc.connect(gn);
        gn.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.12);
    }
}

// ============================================================================
// SECTION 5: Input Handler
// ============================================================================

class InputHandler {
    constructor() {
        this.keysDown = new Set();
        this.keysJustPressed = new Set();

        this._onKeyDown = (e) => {
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
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
    isFire() { return this.justPressed(' '); }
    isHyperspace() { return this.justPressed('Shift'); }
    isStart() { return this.justPressed('Enter'); }
    justPressed(key) { return this.keysJustPressed.has(key); }
    anyKey() { return this.keysJustPressed.size > 0; }

    update() {
        this.keysJustPressed.clear();
    }
}

// ============================================================================
// SECTION 6: Entity Classes
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

// ── Ship ─────────────────────────────────────────────────────

class Ship extends Entity {
    constructor() {
        super(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.SHIP_RADIUS);
        this.rotatingLeft = false;
        this.rotatingRight = false;
        this.thrusting = false;
        this.invulnerable = false;
        this.invulnTimer = 0;
    }

    update() {
        const rotSpeed = MathUtils.degToRad(CONFIG.SHIP_ROTATION_SPEED);
        if (this.rotatingLeft) this.angle -= rotSpeed;
        if (this.rotatingRight) this.angle += rotSpeed;

        if (this.thrusting) {
            this.vx += Math.sin(this.angle) * CONFIG.SHIP_THRUST;
            this.vy -= Math.cos(this.angle) * CONFIG.SHIP_THRUST;
        }

        this.vx *= CONFIG.SHIP_DRAG;
        this.vy *= CONFIG.SHIP_DRAG;

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > CONFIG.SHIP_MAX_SPEED) {
            this.vx = (this.vx / speed) * CONFIG.SHIP_MAX_SPEED;
            this.vy = (this.vy / speed) * CONFIG.SHIP_MAX_SPEED;
        }

        super.update();

        if (this.invulnerable) {
            this.invulnTimer -= CONFIG.FRAME_TIME;
            if (this.invulnTimer <= 0) {
                this.invulnerable = false;
            }
        }
    }

    fire() {
        const noseX = this.x + Math.sin(this.angle) * CONFIG.SHIP_RADIUS;
        const noseY = this.y - Math.cos(this.angle) * CONFIG.SHIP_RADIUS;
        return new Bullet(noseX, noseY, this.angle, true);
    }

    hyperspace() {
        if (Math.random() < CONFIG.HYPERSPACE_EXPLODE_CHANCE) {
            return false;
        }
        this.x = Math.random() * CONFIG.WIDTH;
        this.y = Math.random() * CONFIG.HEIGHT;
        this.vx = 0;
        this.vy = 0;
        return true;
    }

    respawn() {
        this.x = CONFIG.WIDTH / 2;
        this.y = CONFIG.HEIGHT / 2;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.rotatingLeft = false;
        this.rotatingRight = false;
        this.thrusting = false;
        this.invulnerable = true;
        this.invulnTimer = CONFIG.SHIP_INVULN_TIME;
        this.alive = true;
    }

    getVertices() {
        return this.getTransformedVertices(SHAPES.SHIP);
    }

    getFlameVertices() {
        if (!this.thrusting) return null;
        const flicker = 0.6 + Math.random() * 0.6;
        return this.getTransformedVertices(SHAPES.THRUST_FLAME, flicker);
    }
}

// ── Asteroid ─────────────────────────────────────────────────

class Asteroid extends Entity {
    constructor(x, y, size) {
        const radius = CONFIG.ASTEROID_RADII[size];
        super(x, y, radius);
        this.size = size;
        this.shapeVariant = Math.floor(Math.random() * SHAPES.ASTEROID_SHAPES.length);

        const angle = MathUtils.randomDirection();
        const baseSpeed = CONFIG.ASTEROID_SPEEDS[size];
        const speed = baseSpeed * (0.5 + Math.random());
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.spinRate = (Math.random() - 0.5) * 0.04;
        this.spinAngle = Math.random() * Math.PI * 2;
    }

    update() {
        this.spinAngle += this.spinRate;
        super.update();
    }

    split() {
        if (this.size >= 2) return [];
        const newSize = this.size + 1;
        const children = [];
        for (let i = 0; i < 2; i++) {
            const child = new Asteroid(this.x, this.y, newSize);
            const offsetAngle = (i === 0 ? -1 : 1) * (Math.PI / 4 + Math.random() * Math.PI / 4);
            const parentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            const parentAngle = Math.atan2(this.vy, this.vx);
            const newAngle = parentAngle + offsetAngle;
            const newSpeed = parentSpeed * CONFIG.ASTEROID_SPLIT_SPEED_MULT;
            child.vx = Math.cos(newAngle) * newSpeed;
            child.vy = Math.sin(newAngle) * newSpeed;
            children.push(child);
        }
        return children;
    }

    getVertices() {
        return this.getTransformedVertices(
            SHAPES.ASTEROID_SHAPES[this.shapeVariant],
            this.radius,
            this.spinAngle
        );
    }
}

// ── Bullet ───────────────────────────────────────────────────

class Bullet extends Entity {
    constructor(x, y, angle, isPlayerBullet) {
        super(x, y, CONFIG.BULLET_RADIUS);
        this.vx = Math.sin(angle) * CONFIG.BULLET_SPEED;
        this.vy = -Math.cos(angle) * CONFIG.BULLET_SPEED;
        this.lifetime = CONFIG.BULLET_LIFETIME;
        this.isPlayerBullet = isPlayerBullet;
    }

    update() {
        this.lifetime--;
        if (this.lifetime <= 0) {
            this.alive = false;
            return;
        }
        super.update();
    }
}

// ── UFO ──────────────────────────────────────────────────────

class UFO extends Entity {
    constructor(isSmall) {
        const radius = isSmall ? CONFIG.UFO_RADIUS_SMALL : CONFIG.UFO_RADIUS_LARGE;
        const fromLeft = Math.random() < 0.5;
        const x = fromLeft ? -radius : CONFIG.WIDTH + radius;
        const y = Math.random() * CONFIG.HEIGHT;
        super(x, y, radius);

        this.isSmall = isSmall;
        this.direction = fromLeft ? 1 : -1;
        this.dirChangeTimer = CONFIG.UFO_DIRECTION_CHANGE + Math.random() * CONFIG.UFO_DIRECTION_CHANGE;
        const fireInterval = isSmall ? CONFIG.UFO_FIRE_INTERVAL_SMALL : CONFIG.UFO_FIRE_INTERVAL_LARGE;
        this.fireTimer = fireInterval * (0.5 + Math.random() * 0.5);
        this.fireInterval = fireInterval;

        this.vx = CONFIG.UFO_SPEED * this.direction;
        this.vy = 0;
    }

    update() {
        this.dirChangeTimer -= CONFIG.FRAME_TIME;
        if (this.dirChangeTimer <= 0) {
            this.dirChangeTimer = CONFIG.UFO_DIRECTION_CHANGE + Math.random() * CONFIG.UFO_DIRECTION_CHANGE;
            this.vy = (Math.random() - 0.5) * CONFIG.UFO_SPEED * 1.5;
        }

        this.fireTimer -= CONFIG.FRAME_TIME;

        this.x += this.vx;
        this.y += this.vy;

        if (this.y < 0) this.y += CONFIG.HEIGHT;
        if (this.y > CONFIG.HEIGHT) this.y -= CONFIG.HEIGHT;

        if (this.direction > 0 && this.x > CONFIG.WIDTH + this.radius * 2) {
            this.alive = false;
        } else if (this.direction < 0 && this.x < -this.radius * 2) {
            this.alive = false;
        }
    }

    shouldFire() {
        if (this.fireTimer <= 0) {
            this.fireTimer = this.fireInterval * (0.5 + Math.random() * 0.5);
            return true;
        }
        return false;
    }

    fire(shipX, shipY, playerScore) {
        let angle;
        if (this.isSmall) {
            const aimAngle = Math.atan2(shipX - this.x, -(shipY - this.y));
            const maxInaccuracy = MathUtils.degToRad(30);
            const minInaccuracy = MathUtils.degToRad(5);
            const difficulty = Math.min(1, (playerScore || 0) / 40000);
            const inaccuracy = maxInaccuracy - (maxInaccuracy - minInaccuracy) * difficulty;
            angle = aimAngle + (Math.random() - 0.5) * 2 * inaccuracy;
        } else {
            angle = MathUtils.randomDirection();
        }
        return new Bullet(this.x, this.y, angle, false);
    }

    getVertices() {
        const scale = this.isSmall ? CONFIG.UFO_RADIUS_SMALL : CONFIG.UFO_RADIUS_LARGE;
        return this.getTransformedVertices(SHAPES.UFO, scale, 0);
    }

    getDomeVertices() {
        const scale = this.isSmall ? CONFIG.UFO_RADIUS_SMALL : CONFIG.UFO_RADIUS_LARGE;
        return this.getTransformedVertices(SHAPES.UFO_DOME, scale, 0);
    }
}

// ── Particle ─────────────────────────────────────────────────

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
        this.vx *= 0.99;
        this.vy *= 0.99;
    }

    static createExplosion(x, y, count, speed) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            const angle = MathUtils.randomDirection();
            const spd = speed * (0.3 + Math.random() * 0.7);
            const lifetime = 20 + Math.floor(Math.random() * 30);
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

// ============================================================================
// SECTION 7: Collision System
// ============================================================================

const CollisionSystem = {
    _toroidalDist(x1, y1, x2, y2) {
        let dx = Math.abs(x1 - x2);
        let dy = Math.abs(y1 - y2);
        if (dx > CONFIG.WIDTH / 2) dx = CONFIG.WIDTH - dx;
        if (dy > CONFIG.HEIGHT / 2) dy = CONFIG.HEIGHT - dy;
        return Math.sqrt(dx * dx + dy * dy);
    },

    _circlesOverlap(e1, e2) {
        const dist = this._toroidalDist(e1.x, e1.y, e2.x, e2.y);
        return dist < e1.radius + e2.radius;
    },

    _pointInPolygon(px, py, vertices) {
        let inside = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const xi = vertices[i][0], yi = vertices[i][1];
            const xj = vertices[j][0], yj = vertices[j][1];
            if (((yi > py) !== (yj > py)) &&
                (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    },

    _polygonsOverlap(vertsA, vertsB) {
        for (const v of vertsA) {
            if (this._pointInPolygon(v[0], v[1], vertsB)) return true;
        }
        for (const v of vertsB) {
            if (this._pointInPolygon(v[0], v[1], vertsA)) return true;
        }
        return false;
    },

    _bulletHitsPolygon(bullet, entity, entityVerts) {
        if (!this._circlesOverlap(bullet, entity)) return false;
        return this._pointInPolygon(bullet.x, bullet.y, entityVerts);
    },

    _entitiesCollide(e1, verts1, e2, verts2) {
        if (!this._circlesOverlap(e1, e2)) return false;
        return this._polygonsOverlap(verts1, verts2);
    },

    checkCollisions(gameState) {
        const { ship, asteroids, bullets, ufo } = gameState;
        const result = {
            shipHit: false,
            asteroidHits: [],
            ufoHit: null,
            ufoShipHit: false
        };

        const playerBullets = bullets.filter(b => b.alive && b.isPlayerBullet);
        const ufoBullets = bullets.filter(b => b.alive && !b.isPlayerBullet);

        const asteroidVerts = asteroids.filter(a => a.alive).map(a => ({
            asteroid: a,
            verts: a.getVertices()
        }));

        // Player bullets vs Asteroids
        for (const bullet of playerBullets) {
            if (!bullet.alive) continue;
            for (const { asteroid, verts } of asteroidVerts) {
                if (!asteroid.alive) continue;
                if (this._bulletHitsPolygon(bullet, asteroid, verts)) {
                    bullet.alive = false;
                    asteroid.alive = false;
                    result.asteroidHits.push({ asteroid, bullet });
                    break;
                }
            }
        }

        // Player bullets vs UFO
        if (ufo && ufo.alive) {
            const ufoVerts = ufo.getVertices();
            for (const bullet of playerBullets) {
                if (!bullet.alive) continue;
                if (this._bulletHitsPolygon(bullet, ufo, ufoVerts)) {
                    bullet.alive = false;
                    ufo.alive = false;
                    result.ufoHit = { ufo, bullet };
                    break;
                }
            }

            // Ship vs UFO
            if (ship && ship.alive && !ship.invulnerable && ufo.alive) {
                const shipVerts = ship.getVertices();
                if (this._entitiesCollide(ship, shipVerts, ufo, ufoVerts)) {
                    result.shipHit = true;
                    result.ufoShipHit = true;
                    ufo.alive = false;
                }
            }
        }

        // Ship vs Asteroids
        if (ship && ship.alive && !ship.invulnerable) {
            const shipVerts = ship.getVertices();
            for (const { asteroid, verts } of asteroidVerts) {
                if (!asteroid.alive) continue;
                if (this._entitiesCollide(ship, shipVerts, asteroid, verts)) {
                    result.shipHit = true;
                    asteroid.alive = false;
                    result.asteroidHits.push({ asteroid, bullet: null });
                    break;
                }
            }
        }

        // UFO bullets vs Ship
        if (ship && ship.alive && !ship.invulnerable) {
            const shipVerts = ship.getVertices();
            for (const bullet of ufoBullets) {
                if (!bullet.alive) continue;
                if (this._bulletHitsPolygon(bullet, ship, shipVerts)) {
                    bullet.alive = false;
                    result.shipHit = true;
                    break;
                }
            }
        }

        // UFO bullets vs Asteroids
        for (const bullet of ufoBullets) {
            if (!bullet.alive) continue;
            for (const { asteroid, verts } of asteroidVerts) {
                if (!asteroid.alive) continue;
                if (this._bulletHitsPolygon(bullet, asteroid, verts)) {
                    bullet.alive = false;
                    asteroid.alive = false;
                    result.asteroidHits.push({ asteroid, bullet });
                    break;
                }
            }
        }

        return result;
    },

    isSafeToRespawn(asteroids, ufo) {
        const cx = CONFIG.WIDTH / 2;
        const cy = CONFIG.HEIGHT / 2;
        const safe = CONFIG.SAFE_ZONE_RADIUS;

        for (const a of asteroids) {
            if (!a.alive) continue;
            if (this._toroidalDist(cx, cy, a.x, a.y) < safe + a.radius) return false;
        }
        if (ufo && ufo.alive) {
            if (this._toroidalDist(cx, cy, ufo.x, ufo.y) < safe + ufo.radius) return false;
        }
        return true;
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

        this.persistCanvas = document.createElement('canvas');
        this.persistCanvas.width = CONFIG.WIDTH;
        this.persistCanvas.height = CONFIG.HEIGHT;
        this.persistCtx = this.persistCanvas.getContext('2d');

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

        // 7. Vignette
        ctx.drawImage(this.vignetteCanvas, 0, 0);

        // 8. HUD / overlays
        if (gameState.state === 'attract') {
            this.drawAttractScreen(ctx, gameState);
        } else {
            this.drawHUD(ctx, gameState);
            if (gameState.state === 'gameOver') {
                this.drawGameOver(ctx);
            }
        }
    }

    drawEntities(ctx, gameState) {
        if (gameState.asteroids) {
            for (const a of gameState.asteroids) {
                if (a.alive) this.drawWithWrap(ctx, a, this.drawAsteroid.bind(this));
            }
        }
        if (gameState.ship && gameState.ship.alive) {
            this.drawWithWrap(ctx, gameState.ship, this.drawShip.bind(this));
        }
        if (gameState.ufo && gameState.ufo.alive) {
            this.drawWithWrap(ctx, gameState.ufo, this.drawUFO.bind(this));
        }
        if (gameState.bullets) {
            for (const b of gameState.bullets) {
                if (b.alive) this.drawBullet(ctx, b);
            }
        }
        if (gameState.particles) {
            this.drawParticles(ctx, gameState.particles);
        }
    }

    drawWithWrap(ctx, entity, drawFn) {
        drawFn(ctx, entity);
        const r = entity.radius || 30;
        const ox = entity.x;
        const oy = entity.y;

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
            const blinkPhase = Math.floor(Date.now() / CONFIG.SHIP_BLINK_RATE) % 2;
            if (blinkPhase === 0) return;
        }
        const verts = ship.getVertices();
        this.drawPolygon(ctx, verts, true);

        if (ship.thrusting && Math.random() > 0.3) {
            const flameVerts = ship.getFlameVertices();
            if (flameVerts) {
                ctx.save();
                ctx.strokeStyle = CONFIG.STROKE_COLOR;
                ctx.lineWidth = 1.2;
                ctx.shadowBlur = 10;
                ctx.shadowColor = CONFIG.GLOW_COLOR;
                ctx.beginPath();
                ctx.moveTo(flameVerts[0][0], flameVerts[0][1]);
                for (let i = 1; i < flameVerts.length; i++) {
                    ctx.lineTo(flameVerts[i][0], flameVerts[i][1]);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    drawAsteroid(ctx, asteroid) {
        this.drawPolygon(ctx, asteroid.getVertices(), true);
    }

    drawBullet(ctx, bullet) {
        ctx.save();
        ctx.fillStyle = CONFIG.STROKE_COLOR;
        ctx.shadowBlur = 6;
        ctx.shadowColor = CONFIG.GLOW_COLOR;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, CONFIG.BULLET_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawUFO(ctx, ufo) {
        const bodyVerts = ufo.getVertices();
        this.drawPolygon(ctx, bodyVerts, true);
        const domeVerts = ufo.getDomeVertices();
        this.drawPolygon(ctx, domeVerts, false);
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

    // ── Vector Text ──────────────────────────────────────────

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

    // ── HUD ──────────────────────────────────────────────────

    drawHUD(ctx, gameState) {
        const scoreStr = String(gameState.score || 0).padStart(2, '0');
        this.drawText(ctx, scoreStr, 30, 30, 3);

        const hiStr = String(gameState.highScore || 0).padStart(2, '0');
        this.drawCenteredText(ctx, hiStr, 30, 2);

        const livesToDraw = Math.min(gameState.lives || 0, 5);
        for (let i = 0; i < livesToDraw; i++) {
            this.drawShipIcon(ctx, 45 + i * 22, 80, 10);
        }
    }

    drawShipIcon(ctx, x, y, size) {
        const scale = size / 15;
        const verts = SHAPES.SHIP;
        ctx.save();
        ctx.strokeStyle = CONFIG.STROKE_COLOR;
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 4;
        ctx.shadowColor = CONFIG.DIM_GLOW_COLOR;
        ctx.beginPath();
        ctx.moveTo(x + verts[0][0] * scale, y + verts[0][1] * scale);
        for (let i = 1; i < verts.length; i++) {
            ctx.lineTo(x + verts[i][0] * scale, y + verts[i][1] * scale);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    drawAttractScreen(ctx, gameState) {
        this.drawCenteredText(ctx, 'ASTEROIDS', 180, 7);
        this.drawCenteredText(ctx, 'HIGH SCORE', 310, 2);
        this.drawCenteredText(ctx, String(gameState.highScore || 0), 345, 2.5);

        this.drawCenteredText(ctx, 'ARROWS  MOVE', 395, 1.5);
        this.drawCenteredText(ctx, 'SPACE  FIRE', 415, 1.5);
        this.drawCenteredText(ctx, 'SHIFT  HYPERSPACE', 435, 1.5);
        this.drawCenteredText(ctx, 'ENTER  START', 455, 1.5);

        if (Math.floor(this.frameCount / 30) % 2 === 0) {
            this.drawCenteredText(ctx, 'INSERT COIN', 480, 3);
        }
        this.drawCenteredText(ctx, 'PUSH START', 540, 2);
        this.drawCenteredText(ctx, '1979 ATARI', CONFIG.HEIGHT - 50, 1.5);
    }

    drawGameOver(ctx) {
        this.drawCenteredText(ctx, 'GAME OVER', CONFIG.HEIGHT / 2 - 20, 5);
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

        this.state = 'attract';  // attract | playing | respawning | gameOver
        this.ship = null;
        this.asteroids = [];
        this.bullets = [];
        this.particles = [];
        this.ufo = null;

        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('asteroids_highscore')) || 0;
        this.lives = 0;
        this.wave = 0;
        this.nextExtraLife = CONFIG.EXTRA_LIFE_SCORE;

        // Timers (ms)
        this.waveTimer = 0;
        this.respawnTimer = 0;
        this.gameOverTimer = 0;
        this.ufoTimer = 0;

        // Attract mode asteroids
        this.spawnAttractAsteroids();
    }

    spawnAttractAsteroids() {
        this.asteroids = [];
        for (let i = 0; i < 6; i++) {
            this.asteroids.push(new Asteroid(
                Math.random() * CONFIG.WIDTH,
                Math.random() * CONFIG.HEIGHT,
                0
            ));
        }
    }

    startGame() {
        this.sound.init();
        this.sound.coinInsert();
        this.state = 'playing';
        this.score = 0;
        this.lives = CONFIG.STARTING_LIVES;
        this.wave = 0;
        this.nextExtraLife = CONFIG.EXTRA_LIFE_SCORE;
        this.bullets = [];
        this.particles = [];
        this.ufo = null;
        this.ufoTimer = CONFIG.UFO_SPAWN_INTERVAL;
        this.ship = new Ship();
        this.ship.invulnerable = true;
        this.ship.invulnTimer = CONFIG.SHIP_INVULN_TIME;
        this.startWave();
    }

    startWave() {
        this.wave++;
        const count = Math.min(
            CONFIG.INITIAL_ASTEROIDS + (this.wave - 1) * CONFIG.ASTEROIDS_PER_WAVE,
            CONFIG.MAX_INITIAL_ASTEROIDS
        );
        this.asteroids = [];
        for (let i = 0; i < count; i++) {
            let x, y;
            do {
                x = Math.random() * CONFIG.WIDTH;
                y = Math.random() * CONFIG.HEIGHT;
            } while (MathUtils.distanceSq(x, y, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2) < CONFIG.SAFE_ZONE_RADIUS * CONFIG.SAFE_ZONE_RADIUS);
            this.asteroids.push(new Asteroid(x, y, 0));
        }
        this.waveTimer = 0;
    }

    addScore(points) {
        this.score += points;
        if (this.score >= this.nextExtraLife) {
            this.lives++;
            this.nextExtraLife += CONFIG.EXTRA_LIFE_SCORE;
            this.sound.extraLife();
        }
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
    }

    destroyShip() {
        if (!this.ship) return;
        this.ship.alive = false;
        this.sound.shipExplosion();
        this.sound.thrustOff();
        this.particles.push(...Particle.createExplosion(this.ship.x, this.ship.y, 20, 3));
        this.lives--;
        if (this.lives <= 0) {
            this.state = 'gameOver';
            this.gameOverTimer = CONFIG.GAME_OVER_DURATION;
        } else {
            this.state = 'respawning';
            this.respawnTimer = CONFIG.RESPAWN_DELAY;
        }
    }

    destroyAsteroid(asteroid) {
        this.addScore(CONFIG.ASTEROID_SCORES[asteroid.size]);

        // Explosion effect and sound
        const explosionSizes = [
            { count: 12, speed: 2, sound: 'explosionLarge' },
            { count: 8, speed: 2.5, sound: 'explosionMedium' },
            { count: 5, speed: 3, sound: 'explosionSmall' }
        ];
        const fx = explosionSizes[asteroid.size];
        this.particles.push(...Particle.createExplosion(asteroid.x, asteroid.y, fx.count, fx.speed));
        this.sound[fx.sound]();

        // Split into children
        const children = asteroid.split();
        for (const child of children) {
            if (this.asteroids.length < CONFIG.MAX_ASTEROIDS) {
                this.asteroids.push(child);
            }
        }
    }

    destroyUFO(ufo) {
        this.addScore(ufo.isSmall ? CONFIG.UFO_SCORE_SMALL : CONFIG.UFO_SCORE_LARGE);
        this.particles.push(...Particle.createExplosion(ufo.x, ufo.y, 15, 2.5));
        this.sound.explosionLarge();
        this.sound.saucerStop();
        this.ufo = null;
    }

    spawnUFO() {
        const isSmall = this.score >= CONFIG.UFO_SMALL_THRESHOLD && Math.random() < 0.5;
        this.ufo = new UFO(isSmall);
        this.sound.saucerStart(isSmall);
    }

    getHeartbeatTempo() {
        const liveAsteroids = this.asteroids.filter(a => a.alive).length;
        const totalPossible = Math.min(
            CONFIG.INITIAL_ASTEROIDS + (this.wave - 1) * CONFIG.ASTEROIDS_PER_WAVE,
            CONFIG.MAX_INITIAL_ASTEROIDS
        ) * 7; // max fragments from splitting
        const ratio = liveAsteroids / Math.max(totalPossible, 1);
        return CONFIG.HEARTBEAT_MIN_INTERVAL +
            ratio * (CONFIG.HEARTBEAT_MAX_INTERVAL - CONFIG.HEARTBEAT_MIN_INTERVAL);
    }

    update() {
        const dt = CONFIG.FRAME_TIME;

        if (this.state === 'attract') {
            // Attract mode: just drift asteroids
            for (const a of this.asteroids) a.update();
            // Init sound on any key to satisfy autoplay policy
            if (this.input.anyKey()) {
                this.sound.init();
            }
            if (this.input.isStart()) {
                this.startGame();
            }
            this.input.update();
            return;
        }

        if (this.state === 'gameOver') {
            this.gameOverTimer -= dt;
            // Keep updating visuals
            for (const a of this.asteroids) if (a.alive) a.update();
            for (const p of this.particles) p.update();
            this.particles = this.particles.filter(p => p.alive);
            if (this.ufo && this.ufo.alive) this.ufo.update();

            if (this.gameOverTimer <= 0) {
                localStorage.setItem('asteroids_highscore', this.highScore.toString());
                this.state = 'attract';
                this.spawnAttractAsteroids();
                this.ship = null;
                this.ufo = null;
                this.sound.saucerStop();
            }
            this.input.update();
            return;
        }

        // ── PLAYING or RESPAWNING ──

        // Ship input (only when alive)
        if (this.ship && this.ship.alive) {
            this.ship.rotatingLeft = this.input.isLeft();
            this.ship.rotatingRight = this.input.isRight();

            const wasThrusting = this.ship.thrusting;
            this.ship.thrusting = this.input.isThrust();
            if (this.ship.thrusting && !wasThrusting) this.sound.thrustOn();
            if (!this.ship.thrusting && wasThrusting) this.sound.thrustOff();

            // Fire
            if (this.input.isFire()) {
                const playerBullets = this.bullets.filter(b => b.alive && b.isPlayerBullet);
                if (playerBullets.length < CONFIG.MAX_BULLETS) {
                    this.bullets.push(this.ship.fire());
                    this.sound.fire();
                }
            }

            // Hyperspace
            if (this.input.isHyperspace()) {
                this.sound.hyperspace();
                const survived = this.ship.hyperspace();
                if (!survived) {
                    this.destroyShip();
                }
            }
        }

        // Respawn logic
        if (this.state === 'respawning') {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0 && CollisionSystem.isSafeToRespawn(this.asteroids, this.ufo)) {
                this.ship.respawn();
                this.state = 'playing';
            }
        }

        // Update entities
        if (this.ship && this.ship.alive) this.ship.update();
        for (const a of this.asteroids) if (a.alive) a.update();
        for (const b of this.bullets) if (b.alive) b.update();
        for (const p of this.particles) p.update();

        // UFO update
        if (this.ufo && this.ufo.alive) {
            this.ufo.update();
            if (!this.ufo.alive) {
                this.sound.saucerStop();
                this.ufo = null;
            } else if (this.ufo.shouldFire()) {
                const sx = this.ship ? this.ship.x : CONFIG.WIDTH / 2;
                const sy = this.ship ? this.ship.y : CONFIG.HEIGHT / 2;
                this.bullets.push(this.ufo.fire(sx, sy, this.score));
                this.sound.saucerFire();
            }
        }

        // UFO spawn timer
        if (!this.ufo && this.state === 'playing') {
            this.ufoTimer -= dt;
            if (this.ufoTimer <= 0) {
                this.spawnUFO();
                const interval = Math.max(
                    CONFIG.UFO_SPAWN_MIN_INTERVAL,
                    CONFIG.UFO_SPAWN_INTERVAL - this.wave * 1000
                );
                this.ufoTimer = interval;
            }
        }

        // Collisions
        if (this.state === 'playing' || this.state === 'respawning') {
            const result = CollisionSystem.checkCollisions({
                ship: this.ship,
                asteroids: this.asteroids,
                bullets: this.bullets,
                ufo: this.ufo
            });

            // Handle asteroid hits
            for (const { asteroid } of result.asteroidHits) {
                this.destroyAsteroid(asteroid);
            }

            // Handle UFO hit
            if (result.ufoHit) {
                this.destroyUFO(result.ufoHit.ufo);
            }

            // Handle ship hit
            if (result.shipHit && this.ship && this.ship.alive) {
                this.destroyShip();
            }

            // Handle UFO-ship collision destroying UFO too
            if (result.ufoShipHit && this.ufo) {
                this.particles.push(...Particle.createExplosion(this.ufo.x, this.ufo.y, 15, 2.5));
                this.sound.saucerStop();
                this.ufo = null;
            }
        }

        // Clean up dead entities
        this.asteroids = this.asteroids.filter(a => a.alive);
        this.bullets = this.bullets.filter(b => b.alive);
        this.particles = this.particles.filter(p => p.alive);

        // Wave completion check
        if (this.asteroids.length === 0 && !this.ufo && this.state === 'playing') {
            this.waveTimer += dt;
            if (this.waveTimer >= CONFIG.WAVE_DELAY) {
                this.startWave();
            }
        }

        // Heartbeat
        if (this.state === 'playing' || this.state === 'respawning') {
            this.sound.heartbeat(this.getHeartbeatTempo());
        }

        this.input.update();
    }

    getState() {
        return {
            state: this.state,
            ship: this.ship,
            asteroids: this.asteroids,
            bullets: this.bullets,
            ufo: this.ufo,
            particles: this.particles,
            score: this.score,
            highScore: this.highScore,
            lives: this.lives,
            wave: this.wave
        };
    }
}

// ============================================================================
// SECTION 11: Main Loop & Bootstrap
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
