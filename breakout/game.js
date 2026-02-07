'use strict';

// ─── SECTION 1: CONFIG ─────────────────────────────────────────────────────────

const CONFIG = Object.freeze({
    // Display
    LOGICAL_WIDTH: 292,
    LOGICAL_HEIGHT: 200,
    SCALE: 3,
    WIDTH: 876,
    HEIGHT: 600,
    FPS: 60,
    FRAME_TIME: 16.667,
    MAX_DELTA: 200,

    // Brick grid
    BRICK_ROWS: 8,
    BRICK_COLS: 14,
    BRICK_WIDTH: 18,
    BRICK_HEIGHT: 6,
    BRICK_GAP: 1,
    BRICK_OFFSET_X: 11,
    BRICK_OFFSET_Y: 30,

    // Brick colors (cellophane overlay) - bottom to top
    BRICK_COLORS: ['#CCCC00', '#CCCC00', '#00CC00', '#00CC00', '#CC6600', '#CC6600', '#CC0000', '#CC0000'],
    BRICK_POINTS: [1, 1, 3, 3, 5, 5, 7, 7],

    // Ball
    BALL_SIZE: 4,
    BALL_SPEED_1: 1.5,
    BALL_SPEED_2: 2.0,
    BALL_SPEED_3: 2.5,
    BALL_SPEED_4: 3.0,
    BALL_SERVE_SPEED: 1.5,

    // Paddle
    PADDLE_WIDTH: 32,
    PADDLE_HEIGHT: 4,
    PADDLE_Y: 186,
    PADDLE_SPEED: 3,
    PADDLE_SHRINK_WIDTH: 16,

    // Scoring
    WALL_POINTS: 448,
    MAX_WALLS: 2,
    BONUS_SCORE: 0,
    LIVES: 3,

    // Timing
    SERVE_DELAY: 1500,
    GAME_OVER_DELAY: 3000,
    BALL_LOST_DELAY: 1000,

    // Colors
    COLOR: '#ffffff',
    BG_COLOR: '#000000',
    WALL_COLOR: '#808080',
});

// ─── SECTION 2: MATH UTILITIES ─────────────────────────────────────────────────

const MathUtils = {
    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },
    rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    },
    sign(x) {
        return x > 0 ? 1 : x < 0 ? -1 : 0;
    }
};

// ─── SECTION 3: FONT DATA ──────────────────────────────────────────────────────

const FONT_ALPHA = {
    'A': [
        ' ### ',
        '#   #',
        '#   #',
        '#####',
        '#   #',
        '#   #',
        '#   #'
    ],
    'B': [
        '#### ',
        '#   #',
        '#   #',
        '#### ',
        '#   #',
        '#   #',
        '#### '
    ],
    'C': [
        ' ### ',
        '#   #',
        '#    ',
        '#    ',
        '#    ',
        '#   #',
        ' ### '
    ],
    'D': [
        '#### ',
        '#   #',
        '#   #',
        '#   #',
        '#   #',
        '#   #',
        '#### '
    ],
    'E': [
        '#####',
        '#    ',
        '#    ',
        '#### ',
        '#    ',
        '#    ',
        '#####'
    ],
    'F': [
        '#####',
        '#    ',
        '#    ',
        '#### ',
        '#    ',
        '#    ',
        '#    '
    ],
    'G': [
        ' ### ',
        '#   #',
        '#    ',
        '# ###',
        '#   #',
        '#   #',
        ' ### '
    ],
    'H': [
        '#   #',
        '#   #',
        '#   #',
        '#####',
        '#   #',
        '#   #',
        '#   #'
    ],
    'I': [
        ' ### ',
        '  #  ',
        '  #  ',
        '  #  ',
        '  #  ',
        '  #  ',
        ' ### '
    ],
    'J': [
        '  ###',
        '   # ',
        '   # ',
        '   # ',
        '   # ',
        '#  # ',
        ' ##  '
    ],
    'K': [
        '#   #',
        '#  # ',
        '# #  ',
        '##   ',
        '# #  ',
        '#  # ',
        '#   #'
    ],
    'L': [
        '#    ',
        '#    ',
        '#    ',
        '#    ',
        '#    ',
        '#    ',
        '#####'
    ],
    'M': [
        '#   #',
        '## ##',
        '# # #',
        '# # #',
        '#   #',
        '#   #',
        '#   #'
    ],
    'N': [
        '#   #',
        '##  #',
        '##  #',
        '# # #',
        '#  ##',
        '#  ##',
        '#   #'
    ],
    'O': [
        ' ### ',
        '#   #',
        '#   #',
        '#   #',
        '#   #',
        '#   #',
        ' ### '
    ],
    'P': [
        '#### ',
        '#   #',
        '#   #',
        '#### ',
        '#    ',
        '#    ',
        '#    '
    ],
    'Q': [
        ' ### ',
        '#   #',
        '#   #',
        '#   #',
        '# # #',
        '#  # ',
        ' ## #'
    ],
    'R': [
        '#### ',
        '#   #',
        '#   #',
        '#### ',
        '# #  ',
        '#  # ',
        '#   #'
    ],
    'S': [
        ' ### ',
        '#   #',
        '#    ',
        ' ### ',
        '    #',
        '#   #',
        ' ### '
    ],
    'T': [
        '#####',
        '  #  ',
        '  #  ',
        '  #  ',
        '  #  ',
        '  #  ',
        '  #  '
    ],
    'U': [
        '#   #',
        '#   #',
        '#   #',
        '#   #',
        '#   #',
        '#   #',
        ' ### '
    ],
    'V': [
        '#   #',
        '#   #',
        '#   #',
        '#   #',
        ' # # ',
        ' # # ',
        '  #  '
    ],
    'W': [
        '#   #',
        '#   #',
        '#   #',
        '# # #',
        '# # #',
        '## ##',
        '#   #'
    ],
    'X': [
        '#   #',
        '#   #',
        ' # # ',
        '  #  ',
        ' # # ',
        '#   #',
        '#   #'
    ],
    'Y': [
        '#   #',
        '#   #',
        ' # # ',
        '  #  ',
        '  #  ',
        '  #  ',
        '  #  '
    ],
    'Z': [
        '#####',
        '    #',
        '   # ',
        '  #  ',
        ' #   ',
        '#    ',
        '#####'
    ],
    '0': [
        ' ### ',
        '#   #',
        '#  ##',
        '# # #',
        '##  #',
        '#   #',
        ' ### '
    ],
    '1': [
        '  #  ',
        ' ##  ',
        '  #  ',
        '  #  ',
        '  #  ',
        '  #  ',
        ' ### '
    ],
    '2': [
        ' ### ',
        '#   #',
        '    #',
        '  ## ',
        ' #   ',
        '#    ',
        '#####'
    ],
    '3': [
        ' ### ',
        '#   #',
        '    #',
        '  ## ',
        '    #',
        '#   #',
        ' ### '
    ],
    '4': [
        '   # ',
        '  ## ',
        ' # # ',
        '#  # ',
        '#####',
        '   # ',
        '   # '
    ],
    '5': [
        '#####',
        '#    ',
        '#### ',
        '    #',
        '    #',
        '#   #',
        ' ### '
    ],
    '6': [
        ' ### ',
        '#   #',
        '#    ',
        '#### ',
        '#   #',
        '#   #',
        ' ### '
    ],
    '7': [
        '#####',
        '    #',
        '   # ',
        '  #  ',
        '  #  ',
        '  #  ',
        '  #  '
    ],
    '8': [
        ' ### ',
        '#   #',
        '#   #',
        ' ### ',
        '#   #',
        '#   #',
        ' ### '
    ],
    '9': [
        ' ### ',
        '#   #',
        '#   #',
        ' ####',
        '    #',
        '#   #',
        ' ### '
    ],
    ' ': [
        '     ',
        '     ',
        '     ',
        '     ',
        '     ',
        '     ',
        '     '
    ],
    '.': [
        '     ',
        '     ',
        '     ',
        '     ',
        '     ',
        '  #  ',
        '  #  '
    ],
    ',': [
        '     ',
        '     ',
        '     ',
        '     ',
        '  #  ',
        '  #  ',
        ' #   '
    ],
    ':': [
        '     ',
        '  #  ',
        '  #  ',
        '     ',
        '  #  ',
        '  #  ',
        '     '
    ],
    '!': [
        '  #  ',
        '  #  ',
        '  #  ',
        '  #  ',
        '  #  ',
        '     ',
        '  #  '
    ],
    '-': [
        '     ',
        '     ',
        '     ',
        '#####',
        '     ',
        '     ',
        '     '
    ],
    '/': [
        '    #',
        '   # ',
        '   # ',
        '  #  ',
        ' #   ',
        ' #   ',
        '#    '
    ],
    '(': [
        '  #  ',
        ' #   ',
        '#    ',
        '#    ',
        '#    ',
        ' #   ',
        '  #  '
    ],
    ')': [
        '  #  ',
        '   # ',
        '    #',
        '    #',
        '    #',
        '   # ',
        '  #  '
    ],
    '\u00A9': [
        ' ### ',
        '#   #',
        '# # #',
        '#  ##',
        '# # #',
        '#   #',
        ' ### '
    ],
};

// ─── SECTION 5: INPUT HANDLER ──────────────────────────────────────────────────

class InputHandler {
    constructor() {
        this._keys = {};
        this._justPressed = {};

        window.addEventListener('keydown', (e) => {
            if (!this._keys[e.code]) {
                this._justPressed[e.code] = true;
            }
            this._keys[e.code] = true;
            if (['ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'KeyA', 'KeyD'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this._keys[e.code] = false;
        });
    }

    isLeft() {   // METHOD — returns bool
        return !!(this._keys['ArrowLeft'] || this._keys['KeyA']);
    }

    isRight() {  // METHOD — returns bool
        return !!(this._keys['ArrowRight'] || this._keys['KeyD']);
    }

    isStartPressed() {  // METHOD — returns bool (just pressed this frame)
        return !!(this._justPressed['Enter'] || this._justPressed['Space']);
    }

    clearJustPressed() {
        this._justPressed = {};
    }
}
// ─── SECTION 4: SOUND ENGINE ───────────────────────────────────────────────────

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            // Audio not available
        }
    }

    _playTone(freq, duration, type = 'square', volume = 0.15) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    wallBounce() {
        this._playTone(220, 0.05);
    }

    paddleHit() {
        this._playTone(440, 0.06);
    }

    brickHit() {
        this._playTone(660, 0.03);
    }

    bonusBuzz() {
        this._playTone(150, 0.2, 'sawtooth', 0.1);
    }
}

// ─── SECTION 6: ENTITY CLASSES ─────────────────────────────────────────────────

class Paddle {
    constructor() {
        this.width = CONFIG.PADDLE_WIDTH;
        this.height = CONFIG.PADDLE_HEIGHT;
        this.x = (CONFIG.LOGICAL_WIDTH - this.width) / 2;
        this.y = CONFIG.PADDLE_Y;
        this.speed = CONFIG.PADDLE_SPEED;
    }

    update(input) {
        if (input.isLeft()) {
            this.x -= this.speed;
        }
        if (input.isRight()) {
            this.x += this.speed;
        }
        this.x = MathUtils.clamp(this.x, 0, CONFIG.LOGICAL_WIDTH - this.width);
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.width, h: this.height };
    }

    shrink() {
        const centerX = this.x + this.width / 2;
        this.width = CONFIG.PADDLE_SHRINK_WIDTH;
        this.x = centerX - this.width / 2;
    }

    reset() {
        this.width = CONFIG.PADDLE_WIDTH;
        this.x = (CONFIG.LOGICAL_WIDTH - this.width) / 2;
    }
}

class Ball {
    constructor() {
        this.size = CONFIG.BALL_SIZE;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.speed = CONFIG.BALL_SERVE_SPEED;
        this.active = false;
    }

    update() {
        if (!this.active) return;
        this.x += this.vx;
        this.y += this.vy;
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.size, h: this.size };
    }

    serve(paddleX, paddleWidth) {
        this.x = paddleX + paddleWidth / 2 - this.size / 2;
        this.y = CONFIG.PADDLE_Y - this.size - 1;
        const angle = (Math.random() * 0.8 + 0.2) * (Math.random() < 0.5 ? -1 : 1);
        this.vx = this.speed * Math.sin(angle);
        this.vy = -this.speed * Math.cos(angle);
        this.active = true;
    }

    reset(paddleX, paddleWidth) {
        this.x = paddleX + paddleWidth / 2 - this.size / 2;
        this.y = CONFIG.PADDLE_Y - this.size - 1;
        this.vx = 0;
        this.vy = 0;
        this.speed = CONFIG.BALL_SERVE_SPEED;
        this.active = false;
    }
}

class Brick {
    constructor(x, y, row) {
        this.x = x;
        this.y = y;
        this.row = row;
        this.width = CONFIG.BRICK_WIDTH;
        this.height = CONFIG.BRICK_HEIGHT;
        this.alive = true;
        this.color = CONFIG.BRICK_COLORS[row];
        this.points = CONFIG.BRICK_POINTS[row];
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.width, h: this.height };
    }
}

class BrickWall {
    constructor() {
        this.bricks = [];
        this._createGrid();
    }

    _createGrid() {
        this.bricks = [];
        for (let row = 0; row < CONFIG.BRICK_ROWS; row++) {
            for (let col = 0; col < CONFIG.BRICK_COLS; col++) {
                const x = CONFIG.BRICK_OFFSET_X + col * (CONFIG.BRICK_WIDTH + CONFIG.BRICK_GAP);
                const y = CONFIG.BRICK_OFFSET_Y + (CONFIG.BRICK_ROWS - 1 - row) * (CONFIG.BRICK_HEIGHT + CONFIG.BRICK_GAP);
                this.bricks.push(new Brick(x, y, row));
            }
        }
    }

    reset() {
        this.bricks.forEach(b => b.alive = true);
    }

    allDestroyed() {
        return this.bricks.every(b => !b.alive);
    }

    getAliveBricks() {
        return this.bricks.filter(b => b.alive);
    }
}
// ─── SECTION 7: COLLISION SYSTEM ───────────────────────────────────────────────

const CollisionSystem = {
    checkBallPaddle(ball, paddle, sound) {
        const br = ball.getRect();
        const pr = paddle.getRect();
        if (!MathUtils.rectsOverlap(br.x, br.y, br.w, br.h, pr.x, pr.y, pr.w, pr.h)) return false;
        if (ball.vy < 0) return false; // only bounce if ball moving down

        // Deflection based on where ball hits paddle
        const hitPos = (ball.x + ball.size / 2 - paddle.x) / paddle.width; // 0..1
        const maxAngle = Math.PI / 3; // 60 degrees max
        const angle = (hitPos - 0.5) * 2 * maxAngle;

        ball.vx = ball.speed * Math.sin(angle);
        ball.vy = -ball.speed * Math.cos(angle); // always bounce up

        // Push ball above paddle to prevent sticking
        ball.y = paddle.y - ball.size;

        sound.paddleHit();
        return true;
    },

    checkBallWalls(ball, sound) {
        let hit = null;
        // Left wall
        if (ball.x <= 0) {
            ball.x = 0;
            ball.vx = Math.abs(ball.vx);
            hit = 'left';
        }
        // Right wall
        if (ball.x + ball.size >= CONFIG.LOGICAL_WIDTH) {
            ball.x = CONFIG.LOGICAL_WIDTH - ball.size;
            ball.vx = -Math.abs(ball.vx);
            hit = 'right';
        }
        // Top wall (back wall)
        if (ball.y <= 0) {
            ball.y = 0;
            ball.vy = Math.abs(ball.vy);
            hit = 'top';
        }
        if (hit) sound.wallBounce();
        return hit;
    },

    checkBallBricks(ball, bricks, sound) {
        const br = ball.getRect();
        let totalPoints = 0;
        let hitRow = -1;
        const aliveBricks = bricks.getAliveBricks();

        for (const brick of aliveBricks) {
            const bkr = brick.getRect();
            if (MathUtils.rectsOverlap(br.x, br.y, br.w, br.h, bkr.x, bkr.y, bkr.w, bkr.h)) {
                brick.alive = false;
                totalPoints += brick.points;
                hitRow = Math.max(hitRow, brick.row);

                // Determine bounce direction by minimum overlap axis
                const overlapLeft = (br.x + br.w) - bkr.x;
                const overlapRight = (bkr.x + bkr.w) - br.x;
                const overlapTop = (br.y + br.h) - bkr.y;
                const overlapBottom = (bkr.y + bkr.h) - br.y;

                const minOverlapX = Math.min(overlapLeft, overlapRight);
                const minOverlapY = Math.min(overlapTop, overlapBottom);

                if (minOverlapX < minOverlapY) {
                    ball.vx = -ball.vx;
                } else {
                    ball.vy = -ball.vy;
                }

                sound.brickHit();
                break; // only one brick per frame
            }
        }
        return { points: totalPoints, hitRow: hitRow };
    },

    checkBallBottom(ball) {
        return ball.y + ball.size >= CONFIG.LOGICAL_HEIGHT;
    }
};

// ─── SECTION 8: RENDERER ───────────────────────────────────────────────────────

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        canvas.width = CONFIG.WIDTH;
        canvas.height = CONFIG.HEIGHT;
        this.ctx.imageSmoothingEnabled = false;
    }

    clear() {
        this.ctx.fillStyle = CONFIG.BG_COLOR;
        this.ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    }

    drawChar(ch, x, y, color) {
        const glyph = FONT_ALPHA[ch.toUpperCase()];
        if (!glyph) return;
        const s = CONFIG.SCALE;
        this.ctx.fillStyle = color;
        for (let row = 0; row < glyph.length; row++) {
            for (let col = 0; col < glyph[row].length; col++) {
                if (glyph[row][col] === '#') {
                    this.ctx.fillRect((x + col) * s, (y + row) * s, s, s);
                }
            }
        }
    }

    drawText(text, x, y, color = CONFIG.COLOR) {
        const str = String(text).toUpperCase();
        for (let i = 0; i < str.length; i++) {
            this.drawChar(str[i], x + i * 6, y, color);
        }
    }

    drawTextCentered(text, y, color = CONFIG.COLOR) {
        const str = String(text).toUpperCase();
        const textWidth = str.length * 6;
        const x = Math.floor((CONFIG.LOGICAL_WIDTH - textWidth) / 2);
        this.drawText(str, x, y, color);
    }

    drawBricks(bricks) {
        const s = CONFIG.SCALE;
        const aliveBricks = bricks.getAliveBricks();

        for (const brick of aliveBricks) {
            // Draw white base
            this.ctx.fillStyle = CONFIG.COLOR;
            this.ctx.fillRect(brick.x * s, brick.y * s, brick.width * s, brick.height * s);

            // Apply cellophane color overlay using multiply blend
            this.ctx.globalCompositeOperation = 'multiply';
            this.ctx.fillStyle = brick.color;
            this.ctx.fillRect(brick.x * s, brick.y * s, brick.width * s, brick.height * s);
            this.ctx.globalCompositeOperation = 'source-over';
        }
    }

    drawPaddle(paddle) {
        const s = CONFIG.SCALE;
        this.ctx.fillStyle = CONFIG.COLOR;
        this.ctx.fillRect(paddle.x * s, paddle.y * s, paddle.width * s, paddle.height * s);
    }

    drawBall(ball) {
        if (!ball.active) return;
        const s = CONFIG.SCALE;
        this.ctx.fillStyle = CONFIG.COLOR;
        this.ctx.fillRect(ball.x * s, ball.y * s, ball.size * s, ball.size * s);
    }

    drawBallAt(x, y) {
        const s = CONFIG.SCALE;
        this.ctx.fillStyle = CONFIG.COLOR;
        this.ctx.fillRect(x * s, y * s, CONFIG.BALL_SIZE * s, CONFIG.BALL_SIZE * s);
    }

    drawHUD(state) {
        // Score - top left
        this.drawText('SCORE ' + String(state.score).padStart(4, '0'), 4, 4, CONFIG.COLOR);
        // High score - top center
        this.drawTextCentered('HIGH ' + String(state.highScore).padStart(4, '0'), 4, CONFIG.COLOR);
        // Lives - draw small ball icons at top right
        const livesX = CONFIG.LOGICAL_WIDTH - 30;
        for (let i = 0; i < state.lives; i++) {
            this.drawBallAt(livesX + i * 8, 4);
        }
    }

    drawAttractScreen(attractBall) {
        // Draw brick wall preview
        this._drawAttractBricks();

        // Title
        this.drawTextCentered('BREAKOUT', 100, '#CC0000');

        // Demo bouncing ball
        if (attractBall) {
            this.drawBallAt(attractBall.x, attractBall.y);
        }

        // Controls
        this.drawTextCentered('ARROWS OR A/D TO MOVE', 130, '#CCCC00');
        this.drawTextCentered('ENTER OR SPACE TO START', 145, '#CCCC00');

        // Copyright
        this.drawTextCentered('(C) 1976 ATARI', 175, CONFIG.WALL_COLOR);
    }

    _drawAttractBricks() {
        const s = CONFIG.SCALE;
        for (let row = 0; row < CONFIG.BRICK_ROWS; row++) {
            for (let col = 0; col < CONFIG.BRICK_COLS; col++) {
                const x = CONFIG.BRICK_OFFSET_X + col * (CONFIG.BRICK_WIDTH + CONFIG.BRICK_GAP);
                const y = CONFIG.BRICK_OFFSET_Y + (CONFIG.BRICK_ROWS - 1 - row) * (CONFIG.BRICK_HEIGHT + CONFIG.BRICK_GAP);
                const color = CONFIG.BRICK_COLORS[row];

                this.ctx.fillStyle = CONFIG.COLOR;
                this.ctx.fillRect(x * s, y * s, CONFIG.BRICK_WIDTH * s, CONFIG.BRICK_HEIGHT * s);

                this.ctx.globalCompositeOperation = 'multiply';
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x * s, y * s, CONFIG.BRICK_WIDTH * s, CONFIG.BRICK_HEIGHT * s);
                this.ctx.globalCompositeOperation = 'source-over';
            }
        }
    }

    drawServing(ball, paddle) {
        const bx = paddle.x + paddle.width / 2 - CONFIG.BALL_SIZE / 2;
        const by = CONFIG.PADDLE_Y - CONFIG.BALL_SIZE - 1;
        this.drawBallAt(bx, by);
    }

    drawGameOver(score) {
        this.drawTextCentered('GAME OVER', 80, '#CC0000');
        this.drawTextCentered('SCORE ' + String(score).padStart(4, '0'), 100, CONFIG.COLOR);
        this.drawTextCentered('ENTER TO CONTINUE', 130, '#CCCC00');
    }

    drawScanlines() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        for (let y = 0; y < CONFIG.HEIGHT; y += 3) {
            ctx.fillRect(0, y, CONFIG.WIDTH, 1);
        }
    }

    drawWalls() {
        const s = CONFIG.SCALE;
        this.ctx.fillStyle = CONFIG.WALL_COLOR;
        this.ctx.fillRect(0, 0, CONFIG.WIDTH, 1 * s);
    }

    render(state) {
        this.clear();

        if (state.state === 'attract') {
            this.drawAttractScreen(state.attractBall);
        } else {
            this.drawWalls();
            this.drawBricks(state.bricks);
            this.drawPaddle(state.paddle);

            if (state.state === 'serving') {
                this.drawServing(state.ball, state.paddle);
            } else {
                this.drawBall(state.ball);
            }

            this.drawHUD(state);

            if (state.state === 'gameOver') {
                this.drawGameOver(state.score);
            }
        }

        this.drawScanlines();
    }
}

// ─── SECTION 9: GAME STATE MACHINE ─────────────────────────────────────────────

class Game {
    constructor() {
        this.state = 'attract';
        this.paddle = new Paddle();
        this.ball = new Ball();
        this.bricks = new BrickWall();
        this.score = 0;
        this.highScore = 0;
        this.lives = CONFIG.LIVES;
        this.wall = 1;
        this.hitCount = 0;
        this.paddleShrunk = false;
        this.timer = 0;
        this.sound = new SoundEngine();
        this.input = new InputHandler();

        // Attract mode demo ball
        this.attractBall = {
            x: CONFIG.LOGICAL_WIDTH / 2,
            y: CONFIG.LOGICAL_HEIGHT / 2,
            vx: 1.2,
            vy: -1.0
        };
    }

    getState() {
        return {
            state: this.state,
            paddle: this.paddle,
            ball: this.ball,
            bricks: this.bricks,
            score: this.score,
            highScore: this.highScore,
            lives: this.lives,
            wall: this.wall,
            hitCount: this.hitCount,
            paddleShrunk: this.paddleShrunk,
            attractBall: this.attractBall
        };
    }

    update() {
        switch (this.state) {
            case 'attract': this._updateAttract(); break;
            case 'serving': this._updateServing(); break;
            case 'playing': this._updatePlaying(); break;
            case 'ballLost': this._updateBallLost(); break;
            case 'waveComplete': this._updateWaveComplete(); break;
            case 'gameOver': this._updateGameOver(); break;
        }
        this.input.clearJustPressed();
    }

    _updateAttract() {
        const ab = this.attractBall;
        ab.x += ab.vx;
        ab.y += ab.vy;
        if (ab.x <= 0 || ab.x + CONFIG.BALL_SIZE >= CONFIG.LOGICAL_WIDTH) ab.vx = -ab.vx;
        if (ab.y <= 0 || ab.y + CONFIG.BALL_SIZE >= CONFIG.LOGICAL_HEIGHT) ab.vy = -ab.vy;

        if (this.input.isStartPressed()) {
            this.sound.init();
            this._startGame();
        }
    }

    _startGame() {
        this.state = 'serving';
        this.score = 0;
        this.lives = CONFIG.LIVES;
        this.wall = 1;
        this.hitCount = 0;
        this.paddleShrunk = false;
        this.paddle.reset();
        this.bricks = new BrickWall();
        this.ball.reset(this.paddle.x, this.paddle.width);
        this.timer = Date.now();
    }

    _updateServing() {
        this.paddle.update(this.input);
        this.ball.reset(this.paddle.x, this.paddle.width);

        const elapsed = Date.now() - this.timer;
        if (elapsed >= CONFIG.SERVE_DELAY || this.input.isStartPressed()) {
            this.ball.serve(this.paddle.x, this.paddle.width);
            this.state = 'playing';
        }
    }

    _updatePlaying() {
        this.paddle.update(this.input);
        this.ball.update();

        // Ball-paddle collision
        if (CollisionSystem.checkBallPaddle(this.ball, this.paddle, this.sound)) {
            this.hitCount++;
            this._updateBallSpeed();
        }

        // Ball-wall collision
        const wallHit = CollisionSystem.checkBallWalls(this.ball, this.sound);
        if (wallHit === 'top') {
            // Shrink paddle after ball hits back wall (authentic behavior)
            if (!this.paddleShrunk) {
                this.paddle.shrink();
                this.paddleShrunk = true;
            }
        }

        // Ball-brick collision
        const brickResult = CollisionSystem.checkBallBricks(this.ball, this.bricks, this.sound);
        if (brickResult.points > 0) {
            this.score += brickResult.points;
            if (this.score > this.highScore) {
                this.highScore = this.score;
            }

            // Speed up on orange (row 4,5) or red (row 6,7) hit
            if (brickResult.hitRow >= 4) {
                this._applySpeedLevel(CONFIG.BALL_SPEED_4);
            }

            // Check bonus life
            if (CONFIG.BONUS_SCORE > 0 && this.score >= CONFIG.BONUS_SCORE) {
                this.lives++;
                this.sound.bonusBuzz();
            }
        }

        // Check if wall cleared
        if (this.bricks.allDestroyed()) {
            if (this.wall < CONFIG.MAX_WALLS) {
                this.state = 'waveComplete';
                this.timer = Date.now();
            } else {
                this.state = 'gameOver';
                this.timer = Date.now();
            }
            return;
        }

        // Ball lost (past bottom)
        if (CollisionSystem.checkBallBottom(this.ball)) {
            this.lives--;
            if (this.lives <= 0) {
                this.state = 'gameOver';
                this.timer = Date.now();
            } else {
                this.state = 'ballLost';
                this.timer = Date.now();
            }
        }
    }

    _updateBallLost() {
        if (Date.now() - this.timer >= CONFIG.BALL_LOST_DELAY) {
            this.hitCount = 0;
            this.ball.speed = CONFIG.BALL_SERVE_SPEED;
            this.paddleShrunk = false;
            this.paddle.reset();
            this.ball.reset(this.paddle.x, this.paddle.width);
            this.state = 'serving';
            this.timer = Date.now();
        }
    }

    _updateWaveComplete() {
        if (Date.now() - this.timer >= CONFIG.SERVE_DELAY) {
            this.wall++;
            this.hitCount = 0;
            this.paddleShrunk = false;
            this.paddle.reset();
            this.bricks = new BrickWall();
            this.ball.speed = CONFIG.BALL_SERVE_SPEED;
            this.ball.reset(this.paddle.x, this.paddle.width);
            this.state = 'serving';
            this.timer = Date.now();
        }
    }

    _updateGameOver() {
        if (this.input.isStartPressed()) {
            this.sound.init();
            this._startGame();
        }
    }

    _updateBallSpeed() {
        if (this.hitCount >= 12) {
            this._applySpeedLevel(CONFIG.BALL_SPEED_3);
        } else if (this.hitCount >= 4) {
            this._applySpeedLevel(CONFIG.BALL_SPEED_2);
        }
    }

    _applySpeedLevel(newSpeed) {
        if (newSpeed <= this.ball.speed) return;
        const currentSpeed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
        if (currentSpeed > 0) {
            const scale = newSpeed / currentSpeed;
            this.ball.vx *= scale;
            this.ball.vy *= scale;
        }
        this.ball.speed = newSpeed;
    }
}

// ─── SECTION 10: MAIN LOOP & BOOTSTRAP ─────────────────────────────────────────

(function() {
    const canvas = document.getElementById('gameCanvas');
    const renderer = new Renderer(canvas);
    const game = new Game();
    window.game = game;

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

        renderer.render(game.getState());
        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
})();
