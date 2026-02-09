'use strict';

// ============================================================================
// SECTION 1: CONFIG
// ============================================================================

const CONFIG = Object.freeze({
    // Canvas dimensions
    CANVAS_WIDTH: 1024,
    CANVAS_HEIGHT: 1024,
    FPS: 60,
    FRAME_TIME: 1000 / 60,
    MAX_DELTA: 200,

    // Physics
    GRAVITY_CONSTANT: 800,      // Gravitational force multiplier
    STAR_CAPTURE_RADIUS: 12,    // If ship within this radius of star (512,512), instant death
    STAR_RADIUS: 8,             // Visual size of central star

    // Ship physics
    SHIP_ROTATION_SPEED: 0.07,  // Radians per frame
    SHIP_THRUST: 0.15,          // Acceleration per frame when thrusting
    SHIP_MAX_SPEED: 6.0,        // Maximum velocity magnitude
    SHIP_RADIUS: 8,             // Collision radius
    MAX_FUEL: 256,              // Starting fuel
    FUEL_BURN_RATE: 0.5,        // Fuel consumed per frame while thrusting

    // Torpedoes
    TORPEDO_SPEED: 8,           // Absolute speed in pixels per frame
    TORPEDO_LIFETIME: 150,      // Frames before torpedo expires
    TORPEDO_RADIUS: 2,          // Collision radius
    MAX_TORPEDOES_PER_SHIP: 8,  // Maximum active torpedoes per player
    TORPEDO_RELOAD_COOLDOWN: 10, // Frames between shots

    // Hyperspace
    MAX_HYPERSPACE_JUMPS: 8,        // Available jumps per game
    HYPERSPACE_INVISIBLE_FRAMES: 32, // Frames ship is invisible during jump
    HYPERSPACE_BREAKOUT_FRAMES: 64,  // Frames of forced engine burn after reappearing
    HYPERSPACE_COOLDOWN_FRAMES: 120, // Frames before next hyperspace allowed

    // Lives and respawn
    STARTING_LIVES: 5,
    RESPAWN_INVULNERABILITY: 180, // Frames of invulnerability after respawn

    // Colors
    COLOR_PRIMARY: '#aaddff',   // Blue-white for ships and torpedoes
    COLOR_TRAIL: '#77cc88',     // Green phosphor trail
    COLOR_STAR: '#ffeeaa',      // Yellow-white central star

    // Rendering
    PHOSPHOR_ALPHA: 0.08,       // Slower phosphor fade than Asteroids

    // Starfield
    STAR_COUNT: 200,            // Background stars
    STAR_PARALLAX: 0.05,        // Subtle parallax effect

    // AI (for computer opponent)
    AI_THINK_INTERVAL: 10,      // Frames between AI decisions
    AI_SHOT_INACCURACY: 0.3,    // Radians of aiming error
    AI_DANGER_DISTANCE: 150     // Distance to consider threats
});

// ============================================================================
// SECTION 2: MATH UTILS
// ============================================================================

const MathUtils = {
    TAU: Math.PI * 2,

    /**
     * Calculate gravitational acceleration toward center star at (512, 512)
     * Returns {ax, ay} acceleration vector, or null if within capture radius
     */
    gravity(x, y) {
        const centerX = CONFIG.CANVAS_WIDTH / 2;
        const centerY = CONFIG.CANVAS_HEIGHT / 2;
        const dx = centerX - x;
        const dy = centerY - y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        // Instant death if too close to star
        if (dist < CONFIG.STAR_CAPTURE_RADIUS) {
            return null;
        }

        // Inverse square law: F = G/r²
        const force = CONFIG.GRAVITY_CONSTANT / distSq;

        // Normalize direction and scale by force
        return {
            ax: (dx / dist) * force,
            ay: (dy / dist) * force
        };
    },

    /**
     * Calculate shortest distance squared on 1024×1024 torus
     */
    toroidalDistanceSq(x1, y1, x2, y2) {
        const w = CONFIG.CANVAS_WIDTH;
        const h = CONFIG.CANVAS_HEIGHT;
        let dx = Math.abs(x1 - x2);
        let dy = Math.abs(y1 - y2);
        if (dx > w / 2) dx = w - dx;
        if (dy > h / 2) dy = h - dy;
        return dx * dx + dy * dy;
    },

    /**
     * Check if two circles overlap on torus
     */
    circlesOverlap(x1, y1, r1, x2, y2, r2) {
        const radSum = r1 + r2;
        return this.toroidalDistanceSq(x1, y1, x2, y2) < radSum * radSum;
    },

    /**
     * Rotate a point around origin by angle (radians)
     */
    rotatePoint(x, y, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return [
            x * cos - y * sin,
            x * sin + y * cos
        ];
    },

    /**
     * Create a seeded random number generator for deterministic starfields
     */
    seededRandom(seed) {
        let value = seed;
        return function() {
            value = (value * 9301 + 49297) % 233280;
            return value / 233280;
        };
    },

    /**
     * Wrap position to 1024×1024 torus
     */
    wrapPosition(x, y) {
        const w = CONFIG.CANVAS_WIDTH;
        const h = CONFIG.CANVAS_HEIGHT;
        return {
            x: ((x % w) + w) % w,
            y: ((y % h) + h) % h
        };
    },

    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },

    distanceSq(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return dx * dx + dy * dy;
    }
};

// ============================================================================
// SECTION 3: SHAPES AND STARFIELD
// ============================================================================

const SHAPES = {
    /**
     * NEEDLE ship (Player 1) - elongated 4:1 aspect, sharp nose
     * Nose points RIGHT (0° angle), engine is left
     * PDP-1 reference: DEC Type 30 precision CRT display codes
     */
    NEEDLE: [
        // Sharp nose (right)
        [8, 0],
        [7, 1],
        [6, 1],
        // Upper body
        [2, 1],
        [-6, 1],
        [-8, 2],
        // Engine (left end)
        [-8, 2],
        [-8, -2],
        // Lower body
        [-8, -2],
        [-6, -1],
        [2, -1],
        // Back to nose
        [6, -1],
        [7, -1],
        [8, 0]
    ],

    /**
     * WEDGE ship (Player 2 or AI) - broader 2:1 aspect, blunt edge
     * Blunt edge points RIGHT (0° angle), taper is left
     */
    WEDGE: [
        // Blunt nose (right)
        [6, 3],
        [6, 2],
        [6, 1],
        [6, 0],
        [6, -1],
        [6, -2],
        [6, -3],
        // Lower body
        [3, -2],
        [-4, -2],
        [-6, -1],
        // Engine (left end, tapered)
        [-6, 0],
        // Upper body
        [-6, 1],
        [-4, 2],
        [3, 2],
        [6, 3]
    ],

    /**
     * Thrust flame for NEEDLE (appears at left/engine end)
     */
    NEEDLE_FLAME: [
        [-8, 1],
        [-11, 0],
        [-8, -1]
    ],

    /**
     * Thrust flame for WEDGE (appears at left/engine end)
     */
    WEDGE_FLAME: [
        [-6, 1],
        [-10, 0],
        [-6, -1]
    ],

    /**
     * Vector font for text rendering (from Asteroids)
     * Each character is 5 units wide, 7 units tall
     */
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

/**
 * Generate deterministic starfield for background
 * Returns array of star objects with position, brightness, and size
 */
function generateStarfield(seed, count) {
    const rng = MathUtils.seededRandom(seed);
    const stars = [];

    for (let i = 0; i < count; i++) {
        const x = rng() * CONFIG.CANVAS_WIDTH;
        const y = rng() * CONFIG.CANVAS_HEIGHT;

        // Brightness levels 0-3 (dim to bright)
        const brightness = Math.floor(rng() * 4);

        // Size 1-3 pixels
        const size = Math.floor(rng() * 3) + 1;

        stars.push({ x, y, brightness, size });
    }

    return stars;
}

// ============================================================================
// SECTION 5: INPUT HANDLER
// ============================================================================

/**
 * Two-player keyboard input handler using event-driven justPressed pattern
 * P1: WASD for rotation, W for thrust, S/Q for fire, E for hyperspace
 * P2: Arrows for rotation/thrust, ArrowDown/Slash for fire, Period for hyperspace
 */
class InputHandler {
    constructor() {
        this._keys = {};           // Held keys (for thrust, rotation)
        this._keyDownBuffer = {};  // Just-pressed keys (for fire, hyperspace)

        window.addEventListener('keydown', (e) => {
            if (!e.repeat) {
                this._keyDownBuffer[e.code] = true;
            }
            this._keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this._keys[e.code] = false;
        });
    }

    // Player 1 controls (WASD + Q/E)
    p1Left() {
        return this._keys['KeyA'];
    }

    p1Right() {
        return this._keys['KeyD'];
    }

    p1Thrust() {
        return this._keys['KeyW'];
    }

    p1Fire() {
        return this._keyDownBuffer['KeyS'] || this._keyDownBuffer['KeyQ'];
    }

    p1Hyperspace() {
        return this._keyDownBuffer['KeyE'];
    }

    // Player 2 controls (Arrows + Slash/Period)
    p2Left() {
        return this._keys['ArrowLeft'];
    }

    p2Right() {
        return this._keys['ArrowRight'];
    }

    p2Thrust() {
        return this._keys['ArrowUp'];
    }

    p2Fire() {
        return this._keyDownBuffer['ArrowDown'] || this._keyDownBuffer['Slash'];
    }

    p2Hyperspace() {
        return this._keyDownBuffer['Period'];
    }

    // General controls
    isStart() {
        return this._keyDownBuffer['Enter'];
    }

    anyKey() {
        return Object.keys(this._keys).length > 0;
    }

    /**
     * Called at end of game loop to clear just-pressed buffer
     */
    update() {
        this._keyDownBuffer = {};
    }
}
// ============================================================================
// SECTION 4: SoundEngine — Web Audio API sound effects
// ============================================================================

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.thrustOsc = null;
        this.thrustGain = null;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    fire() {
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = 1000;
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.08);
    }

    thrustOn() {
        this.init();
        if (this.thrustOsc) return;

        const t = this.ctx.currentTime;

        // Create white noise buffer
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        // Create noise source
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        // Create filter to shape noise
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 150;
        filter.Q.value = 1.0;

        // Create gain
        this.thrustGain = this.ctx.createGain();
        this.thrustGain.gain.setValueAtTime(0, t);
        this.thrustGain.gain.linearRampToValueAtTime(0.15, t + 0.05);

        noise.connect(filter);
        filter.connect(this.thrustGain);
        this.thrustGain.connect(this.ctx.destination);

        noise.start(t);
        this.thrustOsc = noise;
    }

    thrustOff() {
        if (!this.thrustOsc) return;

        const t = this.ctx.currentTime;
        this.thrustGain.gain.setValueAtTime(this.thrustGain.gain.value, t);
        this.thrustGain.gain.linearRampToValueAtTime(0.001, t + 0.05);

        const osc = this.thrustOsc;
        setTimeout(() => {
            try { osc.stop(); } catch (e) {}
        }, 100);

        this.thrustOsc = null;
        this.thrustGain = null;
    }

    explosion() {
        this.init();
        const t = this.ctx.currentTime;

        // Low rumble
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.value = 100;
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);

        // Add noise burst
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufferSize * 3);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.value = 0.3;

        noise.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(t);
    }

    hyperspace() {
        // Entering hyperspace: descending sweep
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.linearRampToValueAtTime(100, t + 0.5);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.5);
    }

    hyperspaceReturn() {
        // Returning from hyperspace: ascending sweep
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.linearRampToValueAtTime(600, t + 0.3);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    starCollision() {
        // Deep bass thump for star collision
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = 40;
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.6);
    }

    gameStart() {
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = 440;
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
    }

    gameOver() {
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.linearRampToValueAtTime(50, t + 0.8);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.8);
    }
}

// ============================================================================
// SECTION 6: Entity Classes — Ships, Torpedoes, Particles, AI
// ============================================================================

// ── Entity Base Class ───────────────────────────────────────────────

class Entity {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.radius = 0;
        this.alive = true;
    }

    update() {
        // Override in subclasses
    }

    getTransformedVertices(shape) {
        // Rotate shape by this.angle, translate to this.x, this.y
        // Returns array of world coordinates
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        const transformed = [];

        for (let i = 0; i < shape.length; i++) {
            const [localX, localY] = shape[i];
            const rotX = localX * cos - localY * sin;
            const rotY = localX * sin + localY * cos;
            transformed.push([this.x + rotX, this.y + rotY]);
        }

        return transformed;
    }
}

// ── Ship Class ──────────────────────────────────────────────────────

class Ship extends Entity {
    constructor(playerIndex, x, y) {
        super();
        this.playerIndex = playerIndex;  // 0=Needle, 1=Wedge
        this.x = x;
        this.y = y;
        this.radius = CONFIG.SHIP_RADIUS;

        // State
        this.fuel = CONFIG.MAX_FUEL;
        this.thrusting = false;
        this.invulnerable = false;
        this.invulnerableTimer = 0;

        // Torpedoes
        this.torpedoReloadTimer = 0;

        // Hyperspace
        this.hyperJumps = CONFIG.MAX_HYPERSPACE_JUMPS;
        this.hyperState = 'ready';  // 'ready'|'invisible'|'breakout'|'cooldown'
        this.hyperTimer = 0;
    }

    update() {
        // CRITICAL: Apply gravity first
        const grav = MathUtils.gravity(this.x, this.y);
        if (grav === null) {
            this.alive = false;  // Star collision
            return;
        }
        this.vx += grav.ax;
        this.vy += grav.ay;

        // Apply thrust (if fuel available)
        if (this.thrusting && this.fuel > 0) {
            this.vx += Math.cos(this.angle) * CONFIG.SHIP_THRUST;
            this.vy += Math.sin(this.angle) * CONFIG.SHIP_THRUST;
            this.fuel -= CONFIG.FUEL_BURN_RATE;
            if (this.fuel < 0) this.fuel = 0;
        }

        // Speed cap (prevent escape velocity)
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > CONFIG.SHIP_MAX_SPEED) {
            this.vx = (this.vx / speed) * CONFIG.SHIP_MAX_SPEED;
            this.vy = (this.vy / speed) * CONFIG.SHIP_MAX_SPEED;
        }

        // Move
        this.x += this.vx;
        this.y += this.vy;

        // Toroidal wrap
        const wrapped = MathUtils.wrapPosition(this.x, this.y);
        this.x = wrapped.x;
        this.y = wrapped.y;

        // Update timers
        if (this.torpedoReloadTimer > 0) this.torpedoReloadTimer--;
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer--;
            if (this.invulnerableTimer === 0) this.invulnerable = false;
        }

        // Hyperspace state machine
        if (this.hyperState !== 'ready') {
            this.hyperTimer--;
            if (this.hyperTimer <= 0) {
                if (this.hyperState === 'invisible') {
                    this.hyperState = 'breakout';
                    this.hyperTimer = CONFIG.HYPERSPACE_BREAKOUT_FRAMES;
                } else if (this.hyperState === 'breakout') {
                    this.hyperState = 'cooldown';
                    this.hyperTimer = CONFIG.HYPERSPACE_COOLDOWN_FRAMES;
                } else {
                    this.hyperState = 'ready';
                }
            }
        }
    }

    fire() {
        // Returns Torpedo or null
        if (this.torpedoReloadTimer > 0) return null;
        this.torpedoReloadTimer = CONFIG.TORPEDO_RELOAD_COOLDOWN;
        return new Torpedo(this.x, this.y, this.angle, this.playerIndex);
    }

    hyperspace() {
        // Returns 'success', 'fail' (explode), or 'unavailable'
        if (this.hyperState !== 'ready') return 'unavailable';
        if (this.hyperJumps <= 0) return 'unavailable';

        this.hyperJumps--;
        const failureProb = (8 - this.hyperJumps) / 8.0;  // Linear: 12.5% → 100%

        if (Math.random() < failureProb) {
            this.alive = false;
            return 'fail';
        }

        // Success: random position away from star
        let attempts = 0;
        do {
            this.x = Math.random() * CONFIG.CANVAS_WIDTH;
            this.y = Math.random() * CONFIG.CANVAS_HEIGHT;
            const dist = Math.sqrt(
                (this.x - CONFIG.CANVAS_WIDTH / 2) ** 2 +
                (this.y - CONFIG.CANVAS_HEIGHT / 2) ** 2
            );
            if (dist > CONFIG.STAR_KILL_RADIUS * 2) break;
            attempts++;
        } while (attempts < 10);

        this.vx *= 0.5;  // Reduce velocity slightly
        this.vy *= 0.5;
        this.hyperState = 'invisible';
        this.hyperTimer = CONFIG.HYPERSPACE_INVISIBLE_FRAMES;
        this.invulnerable = true;
        this.invulnerableTimer = CONFIG.HYPERSPACE_INVISIBLE_FRAMES + CONFIG.HYPERSPACE_BREAKOUT_FRAMES;

        return 'success';
    }

    respawn(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.alive = true;
        this.fuel = CONFIG.MAX_FUEL;
        this.hyperJumps = CONFIG.MAX_HYPERSPACE_JUMPS;
        this.hyperState = 'ready';
        this.hyperTimer = 0;
        this.torpedoReloadTimer = 0;
        this.invulnerable = true;
        this.invulnerableTimer = CONFIG.RESPAWN_INVULNERABILITY;
    }

    getVertices() {
        const shape = this.playerIndex === 0 ? SHAPES.NEEDLE : SHAPES.WEDGE;
        return this.getTransformedVertices(shape);
    }

    getFlameVertices() {
        if (!this.thrusting || this.fuel <= 0) return null;
        const shape = this.playerIndex === 0 ? SHAPES.NEEDLE_FLAME : SHAPES.WEDGE_FLAME;
        return this.getTransformedVertices(shape);
    }
}

// ── Torpedo Class ───────────────────────────────────────────────────

class Torpedo extends Entity {
    constructor(x, y, angle, ownerIndex) {
        super();
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.ownerIndex = ownerIndex;
        this.radius = CONFIG.TORPEDO_RADIUS;
        this.lifetime = CONFIG.TORPEDO_LIFETIME;

        // Constant velocity, NO GRAVITY (authentic CPU limitation)
        this.vx = Math.cos(angle) * CONFIG.TORPEDO_SPEED;
        this.vy = Math.sin(angle) * CONFIG.TORPEDO_SPEED;
    }

    update() {
        // NO GRAVITY - just move
        this.x += this.vx;
        this.y += this.vy;

        const wrapped = MathUtils.wrapPosition(this.x, this.y);
        this.x = wrapped.x;
        this.y = wrapped.y;

        this.lifetime--;
        if (this.lifetime <= 0) this.alive = false;
    }
}

// ── Particle Class ──────────────────────────────────────────────────

class Particle {
    constructor(x, y) {
        // Crock-style explosion: static scatter, fade only
        this.x = x + (Math.random() - 0.5) * 30;
        this.y = y + (Math.random() - 0.5) * 30;
        this.alpha = 1.0;
        this.fadeRate = 0.02;
    }

    update() {
        this.alpha -= this.fadeRate;
        return this.alpha > 0;
    }
}

// ── AI Controller ───────────────────────────────────────────────────

class AIController {
    constructor() {
        this.thinkTimer = 0;
        this.targetAngle = 0;
        this.shouldFire = false;
        this.shouldHyperspace = false;
    }

    update(ship, opponent) {
        // Returns input-like object: {left, right, thrust, fire, hyperspace}

        this.thinkTimer--;
        if (this.thinkTimer <= 0) {
            this.thinkTimer = CONFIG.AI_THINK_INTERVAL;

            // Calculate distance to star
            const starX = CONFIG.CANVAS_WIDTH / 2;
            const starY = CONFIG.CANVAS_HEIGHT / 2;
            const starDist = Math.sqrt((ship.x - starX) ** 2 + (ship.y - starY) ** 2);

            // Avoid star danger zone
            if (starDist < CONFIG.AI_DANGER_DISTANCE) {
                // Turn away from star
                const awayAngle = Math.atan2(ship.y - starY, ship.x - starX);
                this.targetAngle = awayAngle;
                this.shouldHyperspace = (starDist < 80 && ship.hyperJumps > 2);
                this.shouldFire = false;
            } else {
                // Lead target with inaccuracy
                const dx = opponent.x - ship.x;
                const dy = opponent.y - ship.y;

                // Handle toroidal wrapping for targeting
                let targetDx = dx;
                let targetDy = dy;
                if (Math.abs(dx) > CONFIG.CANVAS_WIDTH / 2) {
                    targetDx = dx - Math.sign(dx) * CONFIG.CANVAS_WIDTH;
                }
                if (Math.abs(dy) > CONFIG.CANVAS_HEIGHT / 2) {
                    targetDy = dy - Math.sign(dy) * CONFIG.CANVAS_HEIGHT;
                }

                this.targetAngle = Math.atan2(targetDy, targetDx) +
                                 (Math.random() - 0.5) * CONFIG.AI_SHOT_INACCURACY;
                this.shouldFire = (Math.random() < 0.3);
                this.shouldHyperspace = false;
            }
        }

        // Turn toward target angle
        let angleDiff = this.targetAngle - ship.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const left = angleDiff < -0.05;
        const right = angleDiff > 0.05;
        const thrust = ship.fuel > 50;  // Conserve fuel

        return {
            left,
            right,
            thrust,
            fire: this.shouldFire,
            hyperspace: this.shouldHyperspace
        };
    }
}
// ============================================================================
// SECTION 7: Collision System
// ============================================================================

const CollisionSystem = {
    checkCollisions(gameState) {
        const result = {
            ship1Hit: false,
            ship2Hit: false,
            torpedoHits: [],      // [{torpedoIndex, targetShip: 0|1}]
            starCollisions: [],   // [shipIndex...]
            torpedoStarHits: []   // [torpedoIndex...]
        };

        const { ship1, ship2, torpedoes } = gameState;

        // Ship-star collisions (use toroidal distance for accuracy)
        if (ship1 && ship1.alive && !ship1.invulnerable) {
            const distSq = MathUtils.toroidalDistanceSq(ship1.x, ship1.y, 512, 512);
            if (distSq < (ship1.radius + CONFIG.STAR_RADIUS) ** 2) {
                result.starCollisions.push(0);
            }
        }

        if (ship2 && ship2.alive && !ship2.invulnerable) {
            const distSq = MathUtils.toroidalDistanceSq(ship2.x, ship2.y, 512, 512);
            if (distSq < (ship2.radius + CONFIG.STAR_RADIUS) ** 2) {
                result.starCollisions.push(1);
            }
        }

        // Torpedo-ship collisions
        torpedoes.forEach((torp, i) => {
            if (!torp.alive) return;

            // Check vs ship1 (but not if owner is ship1)
            if (torp.ownerIndex !== 0 && ship1 && ship1.alive && !ship1.invulnerable) {
                const distSq = MathUtils.toroidalDistanceSq(torp.x, torp.y, ship1.x, ship1.y);
                if (distSq < (torp.radius + ship1.radius) ** 2) {
                    result.torpedoHits.push({ torpedoIndex: i, targetShip: 0 });
                }
            }

            // Check vs ship2 (but not if owner is ship2)
            if (torp.ownerIndex !== 1 && ship2 && ship2.alive && !ship2.invulnerable) {
                const distSq = MathUtils.toroidalDistanceSq(torp.x, torp.y, ship2.x, ship2.y);
                if (distSq < (torp.radius + ship2.radius) ** 2) {
                    result.torpedoHits.push({ torpedoIndex: i, targetShip: 1 });
                }
            }

            // Torpedo-star collision
            const torpStarDistSq = MathUtils.toroidalDistanceSq(torp.x, torp.y, 512, 512);
            if (torpStarDistSq < (torp.radius + CONFIG.STAR_RADIUS) ** 2) {
                result.torpedoStarHits.push(i);
            }
        });

        return result;
    }
};

// ============================================================================
// SECTION 8: Renderer
// ============================================================================

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;

        // Phosphor persistence canvas
        this.persistenceCanvas = document.createElement('canvas');
        this.persistenceCanvas.width = CONFIG.CANVAS_WIDTH;
        this.persistenceCanvas.height = CONFIG.CANVAS_HEIGHT;
        this.persistenceCtx = this.persistenceCanvas.getContext('2d');

        // Create circular vignette
        this.vignetteGradient = this.createVignetteGradient();
    }

    createVignetteGradient() {
        // Authentic PDP-1 Type 30 CRT circular tube - visible radius ~460px, full mask at edges
        const gradient = this.ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');      // Center: fully transparent
        gradient.addColorStop(0.70, 'rgba(0,0,0,0)');   // ~358px: still clear
        gradient.addColorStop(0.85, 'rgba(0,0,0,0.3)'); // ~435px: slight fade begins
        gradient.addColorStop(0.90, 'rgba(0,0,0,0.7)'); // ~460px: strong fade
        gradient.addColorStop(0.95, 'rgba(0,0,0,1)');   // ~486px: fully masked
        gradient.addColorStop(1, 'rgba(0,0,0,1)');      // Edges: solid black
        return gradient;
    }

    render(gameState) {
        // 1. Fade persistence canvas (phosphor decay)
        this.persistenceCtx.fillStyle = `rgba(0,0,0,${CONFIG.PHOSPHOR_ALPHA})`;
        this.persistenceCtx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // 2. Draw new frame to persistence (blue-white primary)
        this.persistenceCtx.strokeStyle = CONFIG.COLOR_PRIMARY;
        this.persistenceCtx.fillStyle = CONFIG.COLOR_PRIMARY;
        this.persistenceCtx.lineWidth = 1.5;

        // Draw starfield
        this.drawStarfield(this.persistenceCtx, gameState.stars);

        // Draw central star
        this.drawStar(this.persistenceCtx);

        // Draw ships
        if (gameState.ship1) this.drawShip(this.persistenceCtx, gameState.ship1);
        if (gameState.ship2) this.drawShip(this.persistenceCtx, gameState.ship2);

        // Draw torpedoes
        gameState.torpedoes.forEach(t => {
            if (t.alive) this.drawTorpedo(this.persistenceCtx, t);
        });

        // Draw particles
        this.drawParticles(this.persistenceCtx, gameState.particles);

        // 3. Composite persistence to main canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        this.ctx.drawImage(this.persistenceCanvas, 0, 0);

        // 4. Apply circular vignette
        this.ctx.fillStyle = this.vignetteGradient;
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // 5. Draw HUD (no vignette on HUD)
        this.drawHUD(this.ctx, gameState);

        // 6. Draw attract/game over screens
        if (gameState.state === 'attract') {
            this.drawAttractScreen(this.ctx, gameState);
        } else if (gameState.state === 'gameOver') {
            this.drawGameOverScreen(this.ctx, gameState);
        }
    }

    drawStarfield(ctx, stars) {
        // Draw stars at 4 brightness levels
        stars.forEach(star => {
            const alpha = (star.brightness + 1) / 4;
            ctx.fillStyle = `rgba(170, 221, 255, ${alpha * 0.6})`;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    }

    drawStar(ctx) {
        // Multi-layer glow for central star
        // Core (yellow-white)
        ctx.fillStyle = CONFIG.COLOR_STAR;
        ctx.beginPath();
        ctx.arc(512, 512, CONFIG.STAR_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Glow layers
        for (let i = 1; i <= 3; i++) {
            const alpha = 0.3 / i;
            ctx.fillStyle = `rgba(255, 238, 170, ${alpha})`;
            ctx.beginPath();
            ctx.arc(512, 512, CONFIG.STAR_RADIUS + i * 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawShip(ctx, ship) {
        if (!ship.alive) return;

        // Handle hyperspace invisibility
        if (ship.hyperState === 'invisible') return;
        if (ship.hyperState === 'breakout') {
            // Flicker during breakout
            if (Math.floor(ship.hyperTimer / 4) % 2 === 0) return;
        }

        // Invulnerability flicker
        if (ship.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) return;

        // Draw thrust flame first (behind ship)
        const flame = ship.getFlameVertices();
        if (flame && flame.length > 0) {
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 1.5;
            this.drawPolygon(ctx, flame, true);
        }

        // Draw ship
        ctx.strokeStyle = CONFIG.COLOR_PRIMARY;
        ctx.lineWidth = 1.5;
        const vertices = ship.getVertices();
        this.drawPolygon(ctx, vertices, true);
    }

    drawTorpedo(ctx, torpedo) {
        // Small bright circle
        ctx.fillStyle = CONFIG.COLOR_PRIMARY;
        ctx.beginPath();
        ctx.arc(torpedo.x, torpedo.y, CONFIG.TORPEDO_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }

    drawParticles(ctx, particles) {
        particles.forEach(p => {
            ctx.fillStyle = `rgba(170, 221, 255, ${p.alpha})`;
            ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
        });
    }

    drawPolygon(ctx, vertices, close) {
        if (vertices.length === 0) return;
        ctx.beginPath();
        ctx.moveTo(vertices[0][0], vertices[0][1]);
        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i][0], vertices[i][1]);
        }
        if (close) ctx.closePath();
        ctx.stroke();
    }

    drawHUD(ctx, gameState) {
        ctx.fillStyle = CONFIG.COLOR_PRIMARY;
        ctx.font = '16px monospace';

        // P1 lives (top-left)
        ctx.fillText(`P1: ${gameState.lives1}`, 20, 30);

        // P1 fuel bar (top-left, below lives)
        const fuel1Pct = gameState.fuel1 / CONFIG.MAX_FUEL;
        ctx.fillStyle = fuel1Pct > 0.3 ? CONFIG.COLOR_PRIMARY : '#ff4444';
        ctx.fillRect(20, 40, fuel1Pct * 100, 8);
        ctx.strokeStyle = CONFIG.COLOR_PRIMARY;
        ctx.lineWidth = 1;
        ctx.strokeRect(20, 40, 100, 8);

        // P1 hyperspace jumps
        ctx.fillStyle = CONFIG.COLOR_PRIMARY;
        ctx.fillText(`H: ${gameState.hyperJumps1}`, 20, 70);

        // P2 (top-right, mirrored)
        ctx.textAlign = 'right';
        ctx.fillText(`P2: ${gameState.lives2}`, CONFIG.CANVAS_WIDTH - 20, 30);

        const fuel2Pct = gameState.fuel2 / CONFIG.MAX_FUEL;
        ctx.fillStyle = fuel2Pct > 0.3 ? CONFIG.COLOR_PRIMARY : '#ff4444';
        ctx.fillRect(CONFIG.CANVAS_WIDTH - 120, 40, fuel2Pct * 100, 8);
        ctx.strokeStyle = CONFIG.COLOR_PRIMARY;
        ctx.strokeRect(CONFIG.CANVAS_WIDTH - 120, 40, 100, 8);

        ctx.fillStyle = CONFIG.COLOR_PRIMARY;
        ctx.fillText(`H: ${gameState.hyperJumps2}`, CONFIG.CANVAS_WIDTH - 20, 70);

        // Reset text align
        ctx.textAlign = 'left';
    }

    drawAttractScreen(ctx, gameState) {
        // Title
        ctx.fillStyle = CONFIG.COLOR_PRIMARY;
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPACEWAR!', 512, 200);

        ctx.font = '20px monospace';
        ctx.fillText('(1962)', 512, 240);

        // Controls
        ctx.font = '16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('PLAYER 1 (NEEDLE)', 200, 320);
        ctx.fillText('A/D - Rotate', 200, 350);
        ctx.fillText('W - Thrust', 200, 375);
        ctx.fillText('S/Q - Fire', 200, 400);
        ctx.fillText('E - Hyperspace', 200, 425);

        ctx.textAlign = 'right';
        ctx.fillText('PLAYER 2 (WEDGE)', 824, 320);
        ctx.fillText('Arrows - Rotate/Thrust', 824, 350);
        ctx.fillText('Down/Slash - Fire', 824, 375);
        ctx.fillText('Period - Hyperspace', 824, 400);

        // AI toggle
        ctx.textAlign = 'center';
        ctx.fillText(gameState.useAI ? '[2] AI OPPONENT' : '[2] TWO PLAYER', 512, 500);

        // Start
        ctx.font = 'bold 20px monospace';
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillText('PRESS ENTER TO START', 512, 600);
        }

        // Reset text align
        ctx.textAlign = 'left';
    }

    drawGameOverScreen(ctx, gameState) {
        ctx.fillStyle = CONFIG.COLOR_PRIMARY;
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';

        const winner = gameState.winner === 1 ? 'PLAYER 1' : 'PLAYER 2';
        ctx.fillText(`${winner} WINS`, 512, 400);

        ctx.font = '16px monospace';
        ctx.fillText('PRESS ENTER TO CONTINUE', 512, 500);

        // Reset text align
        ctx.textAlign = 'left';
    }
}

// ============================================================================
// SECTION 9: Game State Machine
// ============================================================================

class Game {
    constructor() {
        this.state = 'attract';  // 'attract'|'playing'|'playerDeath'|'respawning'|'gameOver'
        this.stateTimer = 0;

        this.ship1 = null;
        this.ship2 = null;
        this.torpedoes = [];
        this.particles = [];
        this.stars = generateStarfield(12345, 200);

        this.lives1 = CONFIG.STARTING_LIVES;
        this.lives2 = CONFIG.STARTING_LIVES;
        this.fuel1 = CONFIG.MAX_FUEL;
        this.fuel2 = CONFIG.MAX_FUEL;
        this.hyperJumps1 = CONFIG.STARTING_HYPERSPACE_JUMPS;
        this.hyperJumps2 = CONFIG.STARTING_HYPERSPACE_JUMPS;

        this.useAI = true;  // Default to AI opponent
        this.ai = new AIController();

        this.winner = 0;  // 0=none, 1=P1, 2=P2
        this.deadShipIndex = -1;
    }

    update(input, sound) {
        if (this.state === 'attract') {
            // Toggle AI with '2' key
            if (input._keyDownBuffer['Digit2']) {
                this.useAI = !this.useAI;
                input._keyDownBuffer['Digit2'] = false;  // Consume key
            }

            if (input.isStart()) {
                this.startGame(sound);
            }
        } else if (this.state === 'playing') {
            this.updatePlaying(input, sound);
        } else if (this.state === 'playerDeath') {
            this.stateTimer--;
            if (this.stateTimer <= 0) {
                if (this.lives1 <= 0 || this.lives2 <= 0) {
                    this.winner = this.lives1 > 0 ? 1 : 2;
                    this.state = 'gameOver';
                    this.stateTimer = 300;
                    sound.gameOver();
                } else {
                    this.state = 'respawning';
                    this.stateTimer = 120;
                }
            }
        } else if (this.state === 'respawning') {
            this.stateTimer--;
            if (this.stateTimer <= 0) {
                this.respawnShips();
                this.state = 'playing';
            }
        } else if (this.state === 'gameOver') {
            this.stateTimer--;
            if (input.isStart()) {
                this.state = 'attract';
                this.lives1 = CONFIG.STARTING_LIVES;
                this.lives2 = CONFIG.STARTING_LIVES;
                this.fuel1 = CONFIG.MAX_FUEL;
                this.fuel2 = CONFIG.MAX_FUEL;
                this.hyperJumps1 = CONFIG.STARTING_HYPERSPACE_JUMPS;
                this.hyperJumps2 = CONFIG.STARTING_HYPERSPACE_JUMPS;
                this.winner = 0;
            }
        }

        // Update particles
        this.particles = this.particles.filter(p => {
            p.update();
            return p.alive;
        });

        input.update();
    }

    startGame(sound) {
        this.state = 'playing';
        this.lives1 = CONFIG.STARTING_LIVES;
        this.lives2 = CONFIG.STARTING_LIVES;
        this.fuel1 = CONFIG.MAX_FUEL;
        this.fuel2 = CONFIG.MAX_FUEL;
        this.hyperJumps1 = CONFIG.STARTING_HYPERSPACE_JUMPS;
        this.hyperJumps2 = CONFIG.STARTING_HYPERSPACE_JUMPS;
        this.winner = 0;
        this.torpedoes = [];
        this.particles = [];

        // Spawn ships at safe orbital distance (opposite sides)
        this.ship1 = new Ship(0, 750, 200);  // Top-right
        this.ship1.angle = Math.PI;  // Facing left (toward center)

        this.ship2 = new Ship(1, 274, 824);  // Bottom-left
        this.ship2.angle = 0;  // Facing right (toward center)

        sound.gameStart();
    }

    updatePlaying(input, sound) {
        // Get P1 input
        const p1Input = {
            left: input.p1Left(),
            right: input.p1Right(),
            thrust: input.p1Thrust(),
            fire: input.p1Fire(),
            hyperspace: input.p1Hyperspace()
        };

        // Get P2 input (AI or human)
        let p2Input;
        if (this.useAI && this.ship2 && this.ship1) {
            p2Input = this.ai.update(this.ship2, this.ship1);
        } else {
            p2Input = {
                left: input.p2Left(),
                right: input.p2Right(),
                thrust: input.p2Thrust(),
                fire: input.p2Fire(),
                hyperspace: input.p2Hyperspace()
            };
        }

        // Update ship1
        if (this.ship1 && this.ship1.alive) {
            this.applyInput(this.ship1, p1Input, sound);
            this.ship1.update();
            this.fuel1 = this.ship1.fuel;
            this.hyperJumps1 = this.ship1.hyperJumps;
        }

        // Update ship2
        if (this.ship2 && this.ship2.alive) {
            this.applyInput(this.ship2, p2Input, sound);
            this.ship2.update();
            this.fuel2 = this.ship2.fuel;
            this.hyperJumps2 = this.ship2.hyperJumps;
        }

        // Update torpedoes
        this.torpedoes.forEach(t => t.update());
        this.torpedoes = this.torpedoes.filter(t => t.alive);

        // Collision detection
        const collisions = CollisionSystem.checkCollisions({
            ship1: this.ship1,
            ship2: this.ship2,
            torpedoes: this.torpedoes
        });

        this.handleCollisionResult(collisions, sound);
    }

    applyInput(ship, input, sound) {
        // Rotation
        if (input.left) {
            ship.angle -= CONFIG.SHIP_ROTATION_SPEED;
        }
        if (input.right) {
            ship.angle += CONFIG.SHIP_ROTATION_SPEED;
        }

        // Thrust
        const wasThrusting = ship.thrusting;
        ship.thrusting = input.thrust;
        if (ship.thrusting && !wasThrusting && ship.fuel > 0) {
            sound.thrustOn();
        } else if (!ship.thrusting && wasThrusting) {
            sound.thrustOff();
        }

        // Fire
        if (input.fire) {
            const torpedo = ship.fire();
            if (torpedo) {
                this.torpedoes.push(torpedo);
                sound.fire();
            }
        }

        // Hyperspace
        if (input.hyperspace) {
            const result = ship.hyperspace();
            if (result === 'success') {
                sound.hyperspace();
                setTimeout(() => sound.hyperspaceReturn(), 500);
            } else if (result === 'fail') {
                sound.hyperspace();
                this.destroyShip(ship, sound);
            }
        }
    }

    handleCollisionResult(collisions, sound) {
        // Star collisions
        collisions.starCollisions.forEach(shipIndex => {
            const ship = shipIndex === 0 ? this.ship1 : this.ship2;
            if (ship && ship.alive) {
                this.destroyShip(ship, sound);
                sound.starCollision();
            }
        });

        // Torpedo hits
        collisions.torpedoHits.forEach(hit => {
            const ship = hit.targetShip === 0 ? this.ship1 : this.ship2;
            this.torpedoes[hit.torpedoIndex].alive = false;
            if (ship && ship.alive) {
                this.destroyShip(ship, sound);
                sound.explosion();
            }
        });

        // Torpedo-star hits
        collisions.torpedoStarHits.forEach(i => {
            this.torpedoes[i].alive = false;
        });
    }

    destroyShip(ship, sound) {
        if (!ship.alive) return;
        ship.alive = false;

        // Create explosion particles
        for (let i = 0; i < 25; i++) {
            this.particles.push(new Particle(ship.x, ship.y));
        }

        // Decrement lives
        if (ship.playerIndex === 0) {
            this.lives1--;
            this.deadShipIndex = 0;
        } else {
            this.lives2--;
            this.deadShipIndex = 1;
        }

        this.state = 'playerDeath';
        this.stateTimer = 120;
    }

    respawnShips() {
        if (this.ship1 && !this.ship1.alive) {
            this.ship1.respawn(750, 200);
            this.ship1.angle = Math.PI;
            this.fuel1 = this.ship1.fuel;
            this.hyperJumps1 = this.ship1.hyperJumps;
        }
        if (this.ship2 && !this.ship2.alive) {
            this.ship2.respawn(274, 824);
            this.ship2.angle = 0;
            this.fuel2 = this.ship2.fuel;
            this.hyperJumps2 = this.ship2.hyperJumps;
        }
    }

    getState() {
        return {
            state: this.state,
            ship1: this.ship1,
            ship2: this.ship2,
            torpedoes: this.torpedoes,
            particles: this.particles,
            stars: this.stars,
            lives1: this.lives1,
            lives2: this.lives2,
            fuel1: this.fuel1,
            fuel2: this.fuel2,
            hyperJumps1: this.hyperJumps1,
            hyperJumps2: this.hyperJumps2,
            winner: this.winner,
            stateTimer: this.stateTimer,
            useAI: this.useAI
        };
    }
}

// ============================================================================
// SECTION 10: Main Loop
// ============================================================================

const canvas = document.getElementById('gameCanvas');
const renderer = new Renderer(canvas);
const input = new InputHandler();
const sound = new SoundEngine();
const game = new Game();

let lastTime = performance.now();
const FRAME_TIME = 1000 / 60;
const MAX_DELTA = FRAME_TIME * 3;
let accumulator = 0;

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    let deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Clamp delta to prevent spiral of death
    if (deltaTime > MAX_DELTA) {
        deltaTime = MAX_DELTA;
    }

    accumulator += deltaTime;

    // Fixed timestep update
    while (accumulator >= FRAME_TIME) {
        game.update(input, sound);
        accumulator -= FRAME_TIME;
    }

    // Render current state
    renderer.render(game.getState());
}

// Start the game loop
requestAnimationFrame(gameLoop);
