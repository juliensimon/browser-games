// ── Section 1: CONFIG ──────────────────────────────────────────────────────────

const CONFIG = Object.freeze({
    LOGICAL_WIDTH: 320,
    LOGICAL_HEIGHT: 200,
    SCALE: 3,
    WIDTH: 960,
    HEIGHT: 600,
    PADDLE_WIDTH: 4,
    PADDLE_HEIGHT: 24,
    PADDLE_OFFSET: 16,
    PADDLE_SPEED: 3,
    BALL_SIZE: 4,
    BALL_INITIAL_SPEED: 2,
    BALL_MAX_SPEED: 5,
    BALL_ACCELERATION: 0.05,
    WINNING_SCORE: 11,
    NET_DASH_HEIGHT: 4,
    NET_GAP: 4,
    NET_WIDTH: 2,
    SCORE_Y: 16,
    SERVE_DELAY: 1000,
    GAME_OVER_DELAY: 3000,
    AI_SPEED: 2.5,
    AI_REACTION_DISTANCE: 160,
    FPS: 60,
    FRAME_TIME: 16.667,
    MAX_DELTA: 200,
    COLOR: '#ffffff',
    BG_COLOR: '#000000',
});

// ── Section 2: Math Utilities ─────────────────────────────────────────────────

function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
function sign(val) { return val > 0 ? 1 : val < 0 ? -1 : 0; }
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// ── Section 3: FONT_DIGITS ───────────────────────────────────────────────────

const FONT_DIGITS = {
    '0': [
        [0,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,0,0,0,1,1,1],
        [1,1,0,0,1,0,1,1],
        [1,1,0,1,0,0,1,1],
        [1,1,1,0,0,0,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,0],
    ],
    '1': [
        [0,0,0,1,1,0,0,0],
        [0,0,1,1,1,0,0,0],
        [0,1,1,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,1,1,1,1,1,1,0],
        [0,1,1,1,1,1,1,0],
    ],
    '2': [
        [0,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,1,1],
        [0,0,0,0,0,0,1,1],
        [0,0,0,0,0,1,1,0],
        [0,0,0,1,1,1,0,0],
        [0,0,1,1,1,0,0,0],
        [0,1,1,0,0,0,0,0],
        [1,1,0,0,0,0,0,0],
        [1,1,0,0,0,0,1,1],
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
    ],
    '3': [
        [0,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,1,1],
        [0,0,0,0,0,0,1,1],
        [0,0,0,0,0,0,1,1],
        [0,0,1,1,1,1,1,0],
        [0,0,1,1,1,1,1,0],
        [0,0,0,0,0,0,1,1],
        [0,0,0,0,0,0,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,0],
    ],
    '4': [
        [0,0,0,0,1,1,1,0],
        [0,0,0,1,1,1,1,0],
        [0,0,1,1,0,1,1,0],
        [0,1,1,0,0,1,1,0],
        [1,1,0,0,0,1,1,0],
        [1,1,0,0,0,1,1,0],
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
        [0,0,0,0,0,1,1,0],
        [0,0,0,0,0,1,1,0],
        [0,0,0,0,0,1,1,0],
        [0,0,0,0,0,1,1,0],
    ],
    '5': [
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,0,0],
        [1,1,0,0,0,0,0,0],
        [1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1],
        [0,0,0,0,0,0,1,1],
        [0,0,0,0,0,0,1,1],
        [0,0,0,0,0,0,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,0],
    ],
    '6': [
        [0,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,0,0,0,0,0,0],
        [1,1,0,0,0,0,0,0],
        [1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,0],
    ],
    '7': [
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,1,1],
        [0,0,0,0,0,1,1,0],
        [0,0,0,0,0,1,1,0],
        [0,0,0,0,1,1,0,0],
        [0,0,0,0,1,1,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
        [0,0,0,1,1,0,0,0],
    ],
    '8': [
        [0,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,0,0,0,0,1,1],
        [0,1,1,1,1,1,1,0],
        [0,1,1,1,1,1,1,0],
        [1,1,0,0,0,0,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,0],
    ],
    '9': [
        [0,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,1],
        [0,0,0,0,0,0,1,1],
        [0,0,0,0,0,0,1,1],
        [1,1,0,0,0,0,1,1],
        [1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,0],
    ],
};

// ── Section 5: InputHandler ──────────────────────────────────────────────────

class InputHandler {
    constructor() {
        this.keys = {};
        this.justPressed = {};
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) this.justPressed[e.code] = true;
            this.keys[e.code] = true;
            e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });
    }
    getP1Direction() {
        if (this.keys['KeyW'] || this.keys['ArrowUp']) return -1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) return 1;
        return 0;
    }
    isStartPressed() {
        const pressed = this.justPressed['Enter'];
        return !!pressed;
    }
    clearJustPressed() {
        this.justPressed = {};
    }
}
// ── Section 4: SoundEngine ──────────────────────────────────────────────────
// Original Pong used 3 distinct square wave tones:
//   Paddle hit: 459 Hz (Bb4), 96ms
//   Wall hit:   226 Hz (Bb3), 96ms  — one octave below paddle hit
//   Score/miss: 490 Hz (B4), 257ms  — longer duration for emphasis

class SoundEngine {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    _beep(freq, duration) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.value = 0.3;
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        const now = this.ctx.currentTime;
        osc.start(now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + duration);
        osc.stop(now + duration);
    }

    paddleHit() { this._beep(459, 0.096); }
    wallHit()   { this._beep(226, 0.096); }
    score()     { this._beep(490, 0.257); }
}

// ── Section 6: Entity Classes ───────────────────────────────────────────────

// ── Paddle ──────────────────────────────────────────────────────────────────
// Paddles are constrained to vertical movement within the play area.
// Position (x, y) is top-left corner. Width and height come from CONFIG.

class Paddle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PADDLE_WIDTH;
        this.height = CONFIG.PADDLE_HEIGHT;
        this.score = 0;
    }

    update(direction) {
        this.y += direction * CONFIG.PADDLE_SPEED;
        this.y = clamp(this.y, 0, CONFIG.LOGICAL_HEIGHT - this.height);
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.width, h: this.height };
    }

    reset() {
        this.y = (CONFIG.LOGICAL_HEIGHT - this.height) / 2;
    }
}

// ── Ball ────────────────────────────────────────────────────────────────────
// The ball is a square (CONFIG.BALL_SIZE x CONFIG.BALL_SIZE).
// It starts stationary at center and is served in a direction after scoring.
// Speed increases on each paddle hit. The horizontal speed component (vx)
// carries the base speed; the vertical component (vy) varies with deflection.

class Ball {
    constructor() {
        this.size = CONFIG.BALL_SIZE;
        this.reset();
    }

    reset() {
        this.x = (CONFIG.LOGICAL_WIDTH - this.size) / 2;
        this.y = (CONFIG.LOGICAL_HEIGHT - this.size) / 2;
        this.vx = 0;
        this.vy = 0;
        this.speed = CONFIG.BALL_INITIAL_SPEED;
        this.active = false;
    }

    serve(direction) {
        // direction: -1 = serve left, 1 = serve right
        // Original Pong served the ball perfectly horizontally
        this.speed = CONFIG.BALL_INITIAL_SPEED;
        this.vx = this.speed * direction;
        this.vy = 0;
        this.active = true;
    }

    update() {
        if (!this.active) return;
        this.x += this.vx;
        this.y += this.vy;
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.size, h: this.size };
    }
}

// ── AIController ────────────────────────────────────────────────────────────
// Simple AI that tracks the ball vertically with slight imperfection.
// Only reacts when the ball is heading toward it and within reaction distance.
// Returns -1 / 0 / 1 as a direction for Paddle.update().

class AIController {
    constructor() {
        this.targetY = CONFIG.LOGICAL_HEIGHT / 2;
    }

    update(ball, paddle) {
        // Only react when ball is heading toward this paddle (moving right)
        if (ball.vx > 0 && ball.x > CONFIG.LOGICAL_WIDTH - CONFIG.AI_REACTION_DISTANCE) {
            this.targetY = ball.y + ball.size / 2 - paddle.height / 2;
        }

        const diff = this.targetY - paddle.y;

        if (Math.abs(diff) < 2) return 0;  // Dead zone — prevents jitter
        if (diff < 0) return -1;
        return 1;
    }
}
// ============================================================
// SECTION 7: COLLISION SYSTEM
// ============================================================

/**
 * Check ball-paddle collision with 8-segment deflection.
 * Original Pong divided the paddle into segments — center returns
 * flat, edges return steep angles. Horizontal speed stays constant,
 * only vertical deflection varies.
 */
function checkBallPaddle(ball, paddle, sound) {
    const br = ball.getRect();
    const pr = paddle.getRect();
    if (!rectsOverlap(br.x, br.y, br.w, br.h, pr.x, pr.y, pr.w, pr.h)) return false;

    // Determine which of the 8 segments the ball center hit
    const ballCenter = ball.y + ball.size / 2;
    const relativeY = (ballCenter - paddle.y) / paddle.height; // 0..1
    const segment = Math.floor(clamp(relativeY, 0, 0.999) * 8);

    // Deflection multipliers per segment (top-edge to bottom-edge)
    const deflections = [-0.8, -0.6, -0.3, -0.1, 0.1, 0.3, 0.6, 0.8];

    // Increase ball speed on each paddle hit, capped at max
    ball.speed = Math.min(ball.speed + CONFIG.BALL_ACCELERATION, CONFIG.BALL_MAX_SPEED);

    // Constant horizontal speed, variable vertical deflection
    ball.vx = (ball.vx > 0 ? -1 : 1) * ball.speed;
    ball.vy = deflections[segment] * ball.speed;

    // Reposition ball just outside paddle to prevent sticking
    if (ball.vx > 0) {
        ball.x = paddle.x + paddle.width;
    } else {
        ball.x = paddle.x - ball.size;
    }

    sound.paddleHit();
    return true;
}

/**
 * Top/bottom wall bounce — reverse vertical velocity and clamp.
 */
function checkBallWalls(ball, sound) {
    if (ball.y <= 0) {
        ball.y = 0;
        ball.vy = Math.abs(ball.vy);
        sound.wallHit();
        return true;
    }
    if (ball.y + ball.size >= CONFIG.LOGICAL_HEIGHT) {
        ball.y = CONFIG.LOGICAL_HEIGHT - ball.size;
        ball.vy = -Math.abs(ball.vy);
        sound.wallHit();
        return true;
    }
    return false;
}

/**
 * Check if ball has passed left or right edge (scoring).
 * Returns: 1 if player 1 scores (ball past right), -1 if player 2 scores (ball past left), 0 otherwise.
 */
function checkBallScore(ball) {
    if (ball.x + ball.size < 0) return -1;       // Past left edge → P2 scores
    if (ball.x > CONFIG.LOGICAL_WIDTH) return 1;  // Past right edge → P1 scores
    return 0;
}

// ============================================================
// SECTION 8: RENDERER
// ============================================================

/**
 * Small 5x7 pixel font for alphabet characters used in UI text.
 * Each letter is a 7-row array of 5-column values (0 or 1).
 */
const FONT_ALPHA = {
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
    'I': [
        [1,1,1,1,1],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [1,1,1,1,1],
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
        [0,1,1,1,1],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [0,1,1,1,0],
        [0,0,0,0,1],
        [0,0,0,0,1],
        [1,1,1,1,0],
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
    'Y': [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [0,1,0,1,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
        [0,0,1,0,0],
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
    'H': [
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
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
    'B': [
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,0],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,0],
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
    'F': [
        [1,1,1,1,1],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,1,1,1,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
        [1,0,0,0,0],
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
    '/': [
        [0,0,0,0,1],
        [0,0,0,1,0],
        [0,0,0,1,0],
        [0,0,1,0,0],
        [0,1,0,0,0],
        [0,1,0,0,0],
        [1,0,0,0,0],
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
};

class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    render(gameState) {
        const ctx = this.ctx;
        ctx.setTransform(CONFIG.SCALE, 0, 0, CONFIG.SCALE, 0, 0);
        ctx.imageSmoothingEnabled = false;

        // Clear screen
        ctx.fillStyle = CONFIG.BG_COLOR;
        ctx.fillRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT);

        switch (gameState.state) {
            case 'attract':
                this.drawAttractScreen();
                break;
            case 'serving':
            case 'playing':
            case 'scored':
                this.drawNet();
                this.drawScore(gameState.paddle1.score, gameState.paddle2.score);
                this.drawPaddle(gameState.paddle1);
                this.drawPaddle(gameState.paddle2);
                if (gameState.ball.active) this.drawBall(gameState.ball);
                break;
            case 'gameOver':
                this.drawNet();
                this.drawScore(gameState.paddle1.score, gameState.paddle2.score);
                this.drawPaddle(gameState.paddle1);
                this.drawPaddle(gameState.paddle2);
                this.drawGameOver(gameState.winner);
                break;
        }

        this.drawScanlines();
    }

    drawPaddle(paddle) {
        this.ctx.fillStyle = CONFIG.COLOR;
        this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    }

    drawBall(ball) {
        this.ctx.fillStyle = CONFIG.COLOR;
        this.ctx.fillRect(ball.x, ball.y, ball.size, ball.size);
    }

    drawNet() {
        this.ctx.fillStyle = CONFIG.COLOR;
        const x = Math.floor(CONFIG.LOGICAL_WIDTH / 2) - Math.floor(CONFIG.NET_WIDTH / 2);
        for (let y = 0; y < CONFIG.LOGICAL_HEIGHT; y += CONFIG.NET_DASH_HEIGHT + CONFIG.NET_GAP) {
            this.ctx.fillRect(x, y, CONFIG.NET_WIDTH, CONFIG.NET_DASH_HEIGHT);
        }
    }

    /**
     * Render a single digit from FONT_DIGITS at the given logical position.
     */
    drawDigit(digit, x, y) {
        const glyph = FONT_DIGITS[String(digit)];
        if (!glyph) return;
        this.ctx.fillStyle = CONFIG.COLOR;
        for (let row = 0; row < glyph.length; row++) {
            for (let col = 0; col < glyph[row].length; col++) {
                if (glyph[row][col]) {
                    this.ctx.fillRect(x + col, y + row, 1, 1);
                }
            }
        }
    }

    /**
     * Render a single alpha character from FONT_ALPHA at the given position.
     */
    drawAlpha(ch, x, y) {
        const glyph = FONT_ALPHA[ch];
        if (!glyph) return;
        this.ctx.fillStyle = CONFIG.COLOR;
        for (let row = 0; row < glyph.length; row++) {
            for (let col = 0; col < glyph[row].length; col++) {
                if (glyph[row][col]) {
                    this.ctx.fillRect(x + col, y + row, 1, 1);
                }
            }
        }
    }

    /**
     * Draw a string using FONT_DIGITS for 0-9 and FONT_ALPHA for letters/space.
     * charWidth is the advance per character (default 6 for 5-wide + 1 gap).
     */
    drawText(text, x, y, charWidth) {
        charWidth = charWidth || 6;
        for (let i = 0; i < text.length; i++) {
            this.drawAlpha(text[i].toUpperCase(), x + i * charWidth, y);
        }
    }

    /**
     * Draw a text string centered horizontally at given y.
     */
    drawTextCentered(text, y, charWidth) {
        charWidth = charWidth || 6;
        const totalWidth = text.length * charWidth;
        const x = Math.floor((CONFIG.LOGICAL_WIDTH - totalWidth) / 2);
        this.drawText(text, x, y, charWidth);
    }

    /**
     * Draw scores using FONT_DIGITS bitmaps.
     * Score 1 at ~25% from left, Score 2 at ~75% from left.
     */
    drawScore(score1, score2) {
        const s1 = String(score1);
        const s2 = String(score2);
        const digitWidth = 9; // 8 wide glyph + 1 gap

        // Player 1 score — right-aligned to 25% mark
        const p1Right = Math.floor(CONFIG.LOGICAL_WIDTH * 0.25) + 8;
        for (let i = s1.length - 1; i >= 0; i--) {
            const dx = p1Right - (s1.length - i) * digitWidth;
            this.drawDigit(parseInt(s1[i]), dx, CONFIG.SCORE_Y);
        }

        // Player 2 score — left-aligned from 75% mark
        const p2Left = Math.floor(CONFIG.LOGICAL_WIDTH * 0.75) - 8;
        for (let i = 0; i < s2.length; i++) {
            this.drawDigit(parseInt(s2[i]), p2Left + i * digitWidth, CONFIG.SCORE_Y);
        }
    }

    /**
     * Attract screen: big "PONG" title and instructions.
     */
    drawAttractScreen() {
        this.drawNet();

        // Draw decorative paddles at rest positions
        this.ctx.fillStyle = CONFIG.COLOR;
        this.ctx.fillRect(CONFIG.PADDLE_OFFSET, (CONFIG.LOGICAL_HEIGHT - CONFIG.PADDLE_HEIGHT) / 2,
            CONFIG.PADDLE_WIDTH, CONFIG.PADDLE_HEIGHT);
        this.ctx.fillRect(CONFIG.LOGICAL_WIDTH - CONFIG.PADDLE_OFFSET - CONFIG.PADDLE_WIDTH,
            (CONFIG.LOGICAL_HEIGHT - CONFIG.PADDLE_HEIGHT) / 2,
            CONFIG.PADDLE_WIDTH, CONFIG.PADDLE_HEIGHT);

        // Large "PONG" title using block letters — each letter approx 20x24 logical pixels
        this.drawBlockPONG(Math.floor(CONFIG.LOGICAL_WIDTH / 2) - 50, 40);

        // Instructions
        this.drawTextCentered('PRESS ENTER TO START', 100);
        this.drawTextCentered('W/S  MOVE PADDLE', 120);
        this.drawTextCentered('FIRST TO 11 WINS', 140);
    }

    /**
     * Draw large block-letter "PONG" title using fillRect.
     * Each letter ~20px wide, ~24px tall, with 4px gaps.
     */
    drawBlockPONG(startX, startY) {
        const ctx = this.ctx;
        ctx.fillStyle = CONFIG.COLOR;
        const s = 2; // pixel size for block letters
        let x = startX;

        // P
        this.drawBlockLetter(x, startY, s, [
            [1,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,1,1,1,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
        ]);
        x += 14;

        // O
        this.drawBlockLetter(x, startY, s, [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,0],
        ]);
        x += 14;

        // N
        this.drawBlockLetter(x, startY, s, [
            [1,0,0,0,1],
            [1,1,0,0,1],
            [1,1,0,0,1],
            [1,0,1,0,1],
            [1,0,1,0,1],
            [1,0,1,0,1],
            [1,0,0,1,1],
            [1,0,0,1,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
        ]);
        x += 14;

        // G
        this.drawBlockLetter(x, startY, s, [
            [0,1,1,1,0],
            [1,0,0,0,1],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,0,0,0],
            [1,0,1,1,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [1,0,0,0,1],
            [0,1,1,1,0],
        ]);
    }

    /**
     * Draw a block letter from a 2D grid, where each cell is rendered as an s×s square.
     */
    drawBlockLetter(x, y, s, grid) {
        const ctx = this.ctx;
        ctx.fillStyle = CONFIG.COLOR;
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                if (grid[row][col]) {
                    ctx.fillRect(x + col * s, y + row * s, s, s);
                }
            }
        }
    }

    /**
     * Game over screen: "PLAYER N WINS" centered.
     */
    drawGameOver(winner) {
        const text = 'PLAYER ' + winner + ' WINS';
        this.drawTextCentered(text, Math.floor(CONFIG.LOGICAL_HEIGHT / 2) - 4);
    }

    /**
     * CRT scanline effect — semi-transparent black lines every 2 logical pixels.
     */
    drawScanlines() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.15)';
        for (let y = 0; y < CONFIG.LOGICAL_HEIGHT; y += 2) {
            this.ctx.fillRect(0, y, CONFIG.LOGICAL_WIDTH, 1);
        }
    }
}

// ============================================================
// SECTION 9: GAME STATE MACHINE
// ============================================================

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.sound = new SoundEngine();
        this.input = new InputHandler();
        this.renderer = new Renderer(canvas, this.ctx);
        this.ai = new AIController();
        this.state = 'attract';
        this.stateTimer = 0;
        this.serveDirection = 1; // 1 = serve right, -1 = serve left
        this.winner = 0;
        this.resetGame();
    }

    resetGame() {
        this.paddle1 = new Paddle(
            CONFIG.PADDLE_OFFSET,
            (CONFIG.LOGICAL_HEIGHT - CONFIG.PADDLE_HEIGHT) / 2
        );
        this.paddle2 = new Paddle(
            CONFIG.LOGICAL_WIDTH - CONFIG.PADDLE_OFFSET - CONFIG.PADDLE_WIDTH,
            (CONFIG.LOGICAL_HEIGHT - CONFIG.PADDLE_HEIGHT) / 2
        );
        this.ball = new Ball();
        this.paddle1.score = 0;
        this.paddle2.score = 0;
        this.winner = 0;
    }

    update() {
        switch (this.state) {
            case 'attract': this.updateAttract(); break;
            case 'serving': this.updateServing(); break;
            case 'playing': this.updatePlaying(); break;
            case 'scored': this.updateScored(); break;
            case 'gameOver': this.updateGameOver(); break;
        }
        this.input.clearJustPressed();
    }

    render() {
        this.renderer.render(this.getState());
    }

    getState() {
        return {
            state: this.state,
            paddle1: this.paddle1,
            paddle2: this.paddle2,
            ball: this.ball,
            winner: this.winner,
        };
    }

    /**
     * Attract: wait for Enter to start.
     */
    updateAttract() {
        if (this.input.isStartPressed()) {
            this.sound.init();
            this.resetGame();
            this.state = 'serving';
            this.stateTimer = 0;
            this.serveDirection = 1;
        }
    }

    /**
     * Serving: brief pause before ball launches.
     * Ball sits at center, paddles can move.
     */
    updateServing() {
        // Allow paddle movement during serve delay
        this.paddle1.update(this.input.getP1Direction());
        this.paddle2.update(this.ai.update(this.ball, this.paddle2));

        this.stateTimer += CONFIG.FRAME_TIME;
        if (this.stateTimer >= CONFIG.SERVE_DELAY) {
            this.ball.serve(this.serveDirection);
            this.state = 'playing';
            this.stateTimer = 0;
        }
    }

    /**
     * Playing: full game logic — movement, collisions, scoring.
     */
    updatePlaying() {
        // 1. Update paddles
        this.paddle1.update(this.input.getP1Direction());
        this.paddle2.update(this.ai.update(this.ball, this.paddle2));

        // 2. Update ball
        this.ball.update();

        // 3. Check paddle collisions
        checkBallPaddle(this.ball, this.paddle1, this.sound);
        checkBallPaddle(this.ball, this.paddle2, this.sound);

        // 4. Check wall bounces
        checkBallWalls(this.ball, this.sound);

        // 5. Check scoring
        const scored = checkBallScore(this.ball);
        if (scored !== 0) {
            if (scored === 1) {
                this.paddle1.score++;
                this.serveDirection = -1; // Serve toward player who was scored on
            } else {
                this.paddle2.score++;
                this.serveDirection = 1;
            }
            this.sound.score();
            this.ball.active = false;

            // Check for game over
            if (this.paddle1.score >= CONFIG.WINNING_SCORE) {
                this.winner = 1;
                this.state = 'gameOver';
                this.stateTimer = 0;
            } else if (this.paddle2.score >= CONFIG.WINNING_SCORE) {
                this.winner = 2;
                this.state = 'gameOver';
                this.stateTimer = 0;
            } else {
                this.state = 'scored';
                this.stateTimer = 0;
            }
        }
    }

    /**
     * Scored: pause after a point, then serve again.
     */
    updateScored() {
        // Allow paddle movement during score pause
        this.paddle1.update(this.input.getP1Direction());
        this.paddle2.update(this.ai.update(this.ball, this.paddle2));

        this.stateTimer += CONFIG.FRAME_TIME;
        if (this.stateTimer >= CONFIG.SERVE_DELAY) {
            this.ball.reset();
            this.state = 'serving';
            this.stateTimer = 0;
        }
    }

    /**
     * Game over: show winner, then return to attract after delay.
     */
    updateGameOver() {
        this.stateTimer += CONFIG.FRAME_TIME;
        if (this.stateTimer >= CONFIG.GAME_OVER_DELAY) {
            this.state = 'attract';
            this.stateTimer = 0;
        }
    }
}

// ============================================================
// SECTION 10: MAIN LOOP & BOOTSTRAP
// ============================================================

const canvas = document.getElementById('gameCanvas');
canvas.width = CONFIG.WIDTH;
canvas.height = CONFIG.HEIGHT;

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
