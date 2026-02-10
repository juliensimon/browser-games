// ==================================================
// SECTION 1: CONFIG
// ==================================================
const CONFIG = {
  // Display
  LOGICAL_WIDTH: 256,
  LOGICAL_HEIGHT: 231,
  SCALE: 3,
  GROUND_Y: 221,
  GROUND_HEIGHT: 10,

  // Silo positions
  SILO_LEFT_X: 32,
  SILO_CENTER_X: 128,
  SILO_RIGHT_X: 224,
  SILO_Y: 221,

  // City positions
  CITY_POSITIONS: [24, 48, 72, 184, 208, 232],
  CITY_Y: 211,

  // ABM (Anti-Ballistic Missiles)
  ABM_PER_SILO: 10,
  ABM_SPEED_SIDE: 3,
  ABM_SPEED_CENTER: 7,
  ABM_TRAIL_MAX: 20,

  // ICBM (Intercontinental Ballistic Missiles)
  ICBM_BASE_SPEED: 0.6,
  ICBM_SPEED_INCREMENT: 0.1,
  MAX_ICBM_SLOTS: 8,
  MIRV_SPLIT_CHANCE: 0.3,
  MIRV_SPLIT_MIN_Y: 128,
  MIRV_SPLIT_MAX_Y: 159,

  // Explosions
  EXPLOSION_MAX_RADIUS: 13,
  EXPLOSION_GROW_RATE: 0.8,
  EXPLOSION_HOLD_FRAMES: 15,
  EXPLOSION_SHRINK_RATE: 0.5,

  // Smart bombs
  MAX_SMART_BOMBS_SCREEN: 3,
  SMART_BOMB_SPEED: 1.2,
  SMART_BOMB_EVADE_RADIUS: 20,

  // Enemy aircraft
  BOMBER_SPEED: 0.8,
  SATELLITE_SPEED: 1.2,

  // Scoring
  SCORE_MISSILE: 25,
  SCORE_SMART_BOMB: 125,
  SCORE_BOMBER: 100,
  SCORE_SATELLITE: 100,
  SCORE_ABM_BONUS: 5,
  SCORE_CITY_BONUS: 100,
  BONUS_CITY_THRESHOLD: 10000,

  // Timing
  WAVE_START_DURATION: 120,
  TALLY_DELAY: 30,
  BONUS_TICK_INTERVAL: 5
};

// ==================================================
// SECTION 2: MathUtils
// ==================================================
const MathUtils = {
  distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  },

  angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  },

  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },

  octagonalDist(dx, dy) {
    // 3/8 slope octagon: max(|dx|, |dy|, (|dx|+|dy|)*0.375)
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    return Math.max(adx, ady, (adx + ady) * 0.375);
  },

  pointInExplosion(px, py, cx, cy, radius) {
    return this.octagonalDist(px - cx, py - cy) <= radius;
  }
};

// ==================================================
// SECTION 3: SPRITES
// ==================================================

// City sprites (16×6 px each) - authentic arcade building skylines
// Based on ROM data - cities have distinct multi-story profiles
const CITY_1 = [
  "                ",
  "      XX        ",
  "     XXXX       ",
  "  X  XXXX  XX   ",
  "  XX XXXX XXXX  ",
  " XXXXXXXXXXXXXX "
];

const CITY_2 = [
  "                ",
  "   XX    XX     ",
  "   XX    XX     ",
  " XXXX  XXXXXX   ",
  " XXXX  XXXXXX X ",
  "XXXXXXXXXXXXXXXX"
];

const CITY_3 = [
  "                ",
  " X              ",
  " XX   XX   XX   ",
  " XX   XX   XX X ",
  "XXX XXXX XXXXXX ",
  "XXXXXXXXXXXXXXXX"
];

const CITY_4 = [
  "                ",
  "     X          ",
  "  XX XX XX      ",
  "  XXXXXXXX  XX  ",
  " XXXXXXXXXX XXXX",
  "XXXXXXXXXXXXXXXX"
];

const CITY_5 = [
  "                ",
  "   XX           ",
  "   XX   XX   X  ",
  "  XXX  XXXX XXX ",
  "  XXX XXXXX XXX ",
  " XXXXXXXXXXXXXX "
];

const CITY_6 = [
  "                ",
  "       XX       ",
  " XX    XX    XX ",
  " XX  XXXXXX  XX ",
  " XX XXXXXXXX XXX",
  "XXXXXXXXXXXXXXXX"
];

const CITY_RUBBLE = [
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  " X  X  XX X  X  "
];

const SILO = [
  "                ",
  "                ",
  "                ",
  "       XX       ",
  "      XXXX      ",
  "     XXXXXX     ",
  "    XXXXXXXX    ",
  "   XXXXXXXXXX   ",
  "  XXXXXXXXXXXX  ",
  " XXXXXXXXXXXXXX "
];

const SILO_RUBBLE = [
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  "                ",
  "  X  X    X  X  ",
  " X XX  XX XX X  "
];

const BOMBER = [
  "XXXXXXXX",
  "X      X",
  "X  XX  X",
  "X  XX  X",
  "X  XX  X",
  "X  XX  X",
  "X      X",
  "XXXXXXXX"
];

const SATELLITE = [
  "      ",
  " XXXX ",
  "X XX X",
  " XXXX "
];

// Convert string font to number arrays for drawSprite compatibility
const FONT_STRINGS = {
  'A': ["  X  ", " X X ", "XXXXX", "X   X", "X   X", "X   X", "X   X"],
  'B': ["XXXX ", "X   X", "X   X", "XXXX ", "X   X", "X   X", "XXXX "],
  'C': [" XXX ", "X   X", "X    ", "X    ", "X    ", "X   X", " XXX "],
  'D': ["XXXX ", "X   X", "X   X", "X   X", "X   X", "X   X", "XXXX "],
  'E': ["XXXXX", "X    ", "X    ", "XXXX ", "X    ", "X    ", "XXXXX"],
  'F': ["XXXXX", "X    ", "X    ", "XXXX ", "X    ", "X    ", "X    "],
  'G': [" XXX ", "X   X", "X    ", "X  XX", "X   X", "X   X", " XXX "],
  'H': ["X   X", "X   X", "X   X", "XXXXX", "X   X", "X   X", "X   X"],
  'I': ["XXXXX", "  X  ", "  X  ", "  X  ", "  X  ", "  X  ", "XXXXX"],
  'J': ["XXXXX", "    X", "    X", "    X", "    X", "X   X", " XXX "],
  'K': ["X   X", "X  X ", "X X  ", "XX   ", "X X  ", "X  X ", "X   X"],
  'L': ["X    ", "X    ", "X    ", "X    ", "X    ", "X    ", "XXXXX"],
  'M': ["X   X", "XX XX", "X X X", "X   X", "X   X", "X   X", "X   X"],
  'N': ["X   X", "XX  X", "X X X", "X  XX", "X   X", "X   X", "X   X"],
  'O': [" XXX ", "X   X", "X   X", "X   X", "X   X", "X   X", " XXX "],
  'P': ["XXXX ", "X   X", "X   X", "XXXX ", "X    ", "X    ", "X    "],
  'Q': [" XXX ", "X   X", "X   X", "X   X", "X X X", "X  X ", " XX X"],
  'R': ["XXXX ", "X   X", "X   X", "XXXX ", "X X  ", "X  X ", "X   X"],
  'S': [" XXX ", "X   X", "X    ", " XXX ", "    X", "X   X", " XXX "],
  'T': ["XXXXX", "  X  ", "  X  ", "  X  ", "  X  ", "  X  ", "  X  "],
  'U': ["X   X", "X   X", "X   X", "X   X", "X   X", "X   X", " XXX "],
  'V': ["X   X", "X   X", "X   X", "X   X", "X   X", " X X ", "  X  "],
  'W': ["X   X", "X   X", "X   X", "X X X", "X X X", "XX XX", "X   X"],
  'X': ["X   X", "X   X", " X X ", "  X  ", " X X ", "X   X", "X   X"],
  'Y': ["X   X", "X   X", " X X ", "  X  ", "  X  ", "  X  ", "  X  "],
  'Z': ["XXXXX", "    X", "   X ", "  X  ", " X   ", "X    ", "XXXXX"],
  '0': [" XXX ", "X   X", "X  XX", "X X X", "XX  X", "X   X", " XXX "],
  '1': ["  X  ", " XX  ", "  X  ", "  X  ", "  X  ", "  X  ", "XXXXX"],
  '2': [" XXX ", "X   X", "    X", "   X ", "  X  ", " X   ", "XXXXX"],
  '3': [" XXX ", "X   X", "    X", "  XX ", "    X", "X   X", " XXX "],
  '4': ["   X ", "  XX ", " X X ", "X  X ", "XXXXX", "   X ", "   X "],
  '5': ["XXXXX", "X    ", "XXXX ", "    X", "    X", "X   X", " XXX "],
  '6': [" XXX ", "X   X", "X    ", "XXXX ", "X   X", "X   X", " XXX "],
  '7': ["XXXXX", "    X", "   X ", "  X  ", " X   ", " X   ", " X   "],
  '8': [" XXX ", "X   X", "X   X", " XXX ", "X   X", "X   X", " XXX "],
  '9': [" XXX ", "X   X", "X   X", " XXXX", "    X", "X   X", " XXX "],
  ' ': ["     ", "     ", "     ", "     ", "     ", "     ", "     "],
  '.': ["     ", "     ", "     ", "     ", "     ", "  X  ", "  X  "],
  ',': ["     ", "     ", "     ", "     ", "     ", "  X  ", " X   "],
  '!': ["  X  ", "  X  ", "  X  ", "  X  ", "  X  ", "     ", "  X  "],
  '?': [" XXX ", "X   X", "    X", "   X ", "  X  ", "     ", "  X  "],
  '-': ["     ", "     ", "     ", "XXXXX", "     ", "     ", "     "],
  ':': ["     ", "  X  ", "  X  ", "     ", "  X  ", "  X  ", "     "],
  '/': ["    X", "   X ", "   X ", "  X  ", " X   ", " X   ", "X    "]
};

// Convert string font to 2D number arrays
const FONT = {};
for (const char in FONT_STRINGS) {
  FONT[char] = FONT_STRINGS[char].map(row =>
    row.split('').map(c => c === 'X' ? 1 : 0)
  );
}

// Convert ALL sprite string arrays to number arrays (CRITICAL FIX)
// This fixes the bug where space characters were truthy, causing solid rectangles
const CITY_1_NUM = CITY_1.map(row => row.split('').map(c => c === 'X' ? 1 : 0));
const CITY_2_NUM = CITY_2.map(row => row.split('').map(c => c === 'X' ? 1 : 0));
const CITY_3_NUM = CITY_3.map(row => row.split('').map(c => c === 'X' ? 1 : 0));
const CITY_4_NUM = CITY_4.map(row => row.split('').map(c => c === 'X' ? 1 : 0));
const CITY_5_NUM = CITY_5.map(row => row.split('').map(c => c === 'X' ? 1 : 0));
const CITY_6_NUM = CITY_6.map(row => row.split('').map(c => c === 'X' ? 1 : 0));
const CITY_RUBBLE_NUM = CITY_RUBBLE.map(row => row.split('').map(c => c === 'X' ? 1 : 0));
const SILO_NUM = SILO.map(row => row.split('').map(c => c === 'X' ? 1 : 0));
const BOMBER_NUM = BOMBER.map(row => row.split('').map(c => c === 'X' ? 1 : 0));
const SATELLITE_NUM = SATELLITE.map(row => row.split('').map(c => c === 'X' ? 1 : 0));
const SILO_RUBBLE_NUM = SILO_RUBBLE.map(row => row.split('').map(c => c === 'X' ? 1 : 0));

// Terrain profile - mountainous horizon with humps under cities/silos
// 256 pixels wide, representing the bumpy ground profile
const TERRAIN = [
  "00011111100001111110000111111000011111100001111110000111111000011111100001111110000111111000011111100001111110000111111000011111100001111110000111111000011111100001111110000111111000011111100001111110000111111000011111100001111110000111111000011111100001111110000111111"
].map(row => row.split('').map(c => c === '1' ? 1 : 0))[0];

// Authentic 1980 arcade color schemes (cycle every 2 waves)
// Based on ROM disassembly - 10 different color palettes
const COLOR_SCHEMES = [
  { // Scheme 0 - Classic cyan
    bg: '#000',
    structures: '#0cf',
    abmTrail: '#fff',
    icbmTrail: '#f55',
    crosshair: '#fff',
    expColors: ['#fff', '#ff0', '#f80', '#f00'],
    text: '#0cf',
    scoreText: '#fff'
  },
  { // Scheme 1 - Blue
    bg: '#000',
    structures: '#07f',
    abmTrail: '#fff',
    icbmTrail: '#f0f',
    crosshair: '#fff',
    expColors: ['#fff', '#0ff', '#07f', '#00f'],
    text: '#07f',
    scoreText: '#fff'
  },
  { // Scheme 2 - Green
    bg: '#000',
    structures: '#0f0',
    abmTrail: '#fff',
    icbmTrail: '#f70',
    crosshair: '#fff',
    expColors: ['#fff', '#ff0', '#0f0', '#070'],
    text: '#0f0',
    scoreText: '#fff'
  },
  { // Scheme 3 - Yellow
    bg: '#000',
    structures: '#ff0',
    abmTrail: '#fff',
    icbmTrail: '#f0f',
    crosshair: '#fff',
    expColors: ['#fff', '#ff0', '#f70', '#f00'],
    text: '#ff0',
    scoreText: '#fff'
  },
  { // Scheme 4 - Red/Pink
    bg: '#000',
    structures: '#f0f',
    abmTrail: '#fff',
    icbmTrail: '#0ff',
    crosshair: '#fff',
    expColors: ['#fff', '#f0f', '#f07', '#f00'],
    text: '#f0f',
    scoreText: '#fff'
  },
  { // Scheme 5 - Orange
    bg: '#000',
    structures: '#f70',
    abmTrail: '#fff',
    icbmTrail: '#0f7',
    crosshair: '#fff',
    expColors: ['#fff', '#ff0', '#f70', '#f00'],
    text: '#f70',
    scoreText: '#fff'
  },
  { // Scheme 6 - Purple
    bg: '#000',
    structures: '#70f',
    abmTrail: '#fff',
    icbmTrail: '#ff0',
    crosshair: '#fff',
    expColors: ['#fff', '#f0f', '#70f', '#707'],
    text: '#70f',
    scoreText: '#fff'
  },
  { // Scheme 7 - Teal
    bg: '#000',
    structures: '#0f7',
    abmTrail: '#fff',
    icbmTrail: '#f07',
    crosshair: '#fff',
    expColors: ['#fff', '#0ff', '#0f7', '#077'],
    text: '#0f7',
    scoreText: '#fff'
  },
  { // Scheme 8 - Light Blue
    bg: '#000',
    structures: '#0ff',
    abmTrail: '#fff',
    icbmTrail: '#f77',
    crosshair: '#fff',
    expColors: ['#fff', '#0ff', '#07f', '#00f'],
    text: '#0ff',
    scoreText: '#fff'
  },
  { // Scheme 9 - Lime
    bg: '#000',
    structures: '#7f0',
    abmTrail: '#fff',
    icbmTrail: '#f07',
    crosshair: '#fff',
    expColors: ['#fff', '#ff0', '#7f0', '#070'],
    text: '#7f0',
    scoreText: '#fff'
  }
];

const SPRITES = {
  CITY_1: CITY_1_NUM,
  CITY_2: CITY_2_NUM,
  CITY_3: CITY_3_NUM,
  CITY_4: CITY_4_NUM,
  CITY_5: CITY_5_NUM,
  CITY_6: CITY_6_NUM,
  CITY_RUBBLE: CITY_RUBBLE_NUM,
  SILO: SILO_NUM,
  SILO_RUBBLE: SILO_RUBBLE_NUM,
  BOMBER: BOMBER_NUM,
  SATELLITE: SATELLITE_NUM,
  FONT
};

// ==================================================
// SECTION 5: InputHandler
// ==================================================
class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.mouseX = 128;
    this.mouseY = 100;
    this._keys = new Set();
    this._keyDownBuffer = new Set();  // Event-driven pattern
    this._prevKeys = new Set();

    // Bind event handlers
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);

    // Attach listeners
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  update() {
    // Don't clear buffer here - it needs to persist until checked
    this._prevKeys = new Set(this._keys);
  }

  clearBuffer() {
    // Clear buffer after all checks are done
    this._keyDownBuffer.clear();
  }

  // Crosshair position methods
  getCrosshairX() {
    return this.mouseX;
  }

  getCrosshairY() {
    return this.mouseY;
  }

  // Silo fire methods (1, 2, 3 keys)
  isSilo1Fire() {
    return this._keyDownBuffer.has('Digit1');
  }

  isSilo2Fire() {
    return this._keyDownBuffer.has('Digit2');
  }

  isSilo3Fire() {
    return this._keyDownBuffer.has('Digit3');
  }

  // Start game
  isStart() {
    return this._keyDownBuffer.has('Enter') || this._keyDownBuffer.has('Space');
  }

  // Generic key checking
  isDown(code) {
    return this._keys.has(code);
  }

  justPressed(code) {
    return this._keyDownBuffer.has(code);
  }

  reset() {
    this._keys.clear();
    this._keyDownBuffer.clear();
  }

  // Event handlers
  _onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = CONFIG.LOGICAL_WIDTH / rect.width;
    const scaleY = CONFIG.LOGICAL_HEIGHT / rect.height;
    this.mouseX = MathUtils.clamp((e.clientX - rect.left) * scaleX, 0, 255);
    this.mouseY = MathUtils.clamp((e.clientY - rect.top) * scaleY, 16, 200);
  }

  _onKeyDown(e) {
    this._keys.add(e.code);
    this._keyDownBuffer.add(e.code);
  }

  _onKeyUp(e) {
    this._keys.delete(e.code);
  }
}
// ============================================================================
// SECTION 4: SOUND ENGINE
// ============================================================================

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.bomberNode = null;
        this.bomberGain = null;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    _tone(type, freq, duration, volume = 0.3) {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
        return { osc, gain };
    }

    _noise(duration, freq, volume = 0.3) {
        this.init();
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freq, this.ctx.currentTime);
        filter.Q.setValueAtTime(1, this.ctx.currentTime);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(this.ctx.currentTime);
        source.stop(this.ctx.currentTime + duration);
        return { source, filter, gain };
    }

    abmLaunch() {
        // Rising chirp - player missile launch
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.1);
    }

    abmExplode() {
        // Pop - ABM explosion
        this._noise(0.1, 400, 0.25);
    }

    icbmExplode() {
        // Deep boom - ICBM hits ground
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.25);
    }

    cityDestroyed() {
        // Crash - city destroyed
        this._noise(0.35, 150, 0.35);
    }

    incomingWarning() {
        // Siren - wave start alert
        this.init();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';

        // Alternating high-low siren pattern
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.linearRampToValueAtTime(800, t + 0.15);
        osc.frequency.linearRampToValueAtTime(400, t + 0.3);
        osc.frequency.linearRampToValueAtTime(800, t + 0.45);
        osc.frequency.linearRampToValueAtTime(400, t + 0.6);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.6);
    }

    tallyStart() {
        // Brief ascending tone - tally screen start
        this.init();
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.1);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    bonusCount() {
        // Blip - tally tick
        this._tone('square', 880, 0.05, 0.15);
    }

    bonusCity() {
        // Chime - bonus city awarded
        this.init();
        const t = this.ctx.currentTime;

        // Three-note ascending chime
        const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
        freqs.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + i * 0.08);
            gain.gain.setValueAtTime(0.2, t + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t + i * 0.08);
            osc.stop(t + i * 0.08 + 0.15);
        });
    }

    smartBombEvade() {
        // Zip - evasion maneuver
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.08);
    }

    bomberFlyby() {
        // Start continuous drone
        if (this.bomberNode) return; // Already playing

        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(90, this.ctx.currentTime);

        // Slow oscillation for warbling effect
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(6, this.ctx.currentTime);
        lfoGain.gain.setValueAtTime(8, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime);
        lfo.start(this.ctx.currentTime);

        this.bomberNode = osc;
        this.bomberGain = gain;
    }

    bomberFlybyStop() {
        // Stop continuous drone
        if (!this.bomberNode) return;

        const t = this.ctx.currentTime;
        this.bomberGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        this.bomberNode.stop(t + 0.1);
        this.bomberNode = null;
        this.bomberGain = null;
    }

    enemyDestroyed() {
        // Filtered pop - enemy destroyed
        this._noise(0.12, 600, 0.2);
    }

    gameOver() {
        // Game over fanfare - descending notes
        this.init();
        const t = this.ctx.currentTime;

        const freqs = [392, 349.23, 293.66, 261.63]; // G4, F4, D4, C4
        freqs.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, t + i * 0.2);
            gain.gain.setValueAtTime(0.25, t + i * 0.2);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.2 + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t + i * 0.2);
            osc.stop(t + i * 0.2 + 0.3);
        });
    }
}

// ============================================================================
// SECTION 6: ENTITY CLASSES
// ============================================================================

class Silo {
    constructor(x, y, speed, id) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.id = id;
        this.missiles = CONFIG.ABM_PER_SILO;
        this.destroyed = false;
    }

    hasMissiles() {
        return !this.destroyed && this.missiles > 0;
    }

    fireMissile() {
        if (!this.hasMissiles()) return false;
        this.missiles--;
        return true;
    }

    getRect() {
        return { x: this.x - 8, y: this.y - 8, w: 16, h: 8 };
    }

    destroy() {
        this.destroyed = true;
        this.missiles = 0;
    }

    restoreForWave() {
        if (!this.destroyed) {
            this.missiles = CONFIG.ABM_PER_SILO;
        }
    }
}

class ABM {
    constructor(startX, startY, targetX, targetY, speed) {
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = speed;
        this.angle = MathUtils.angle(startX, startY, targetX, targetY);
        this.vx = Math.cos(this.angle) * speed;
        this.vy = Math.sin(this.angle) * speed;
        this.trail = [{ x: startX, y: startY }];
        this.reachedTarget = false;
    }

    update() {
        if (this.reachedTarget) return true;

        this.x += this.vx;
        this.y += this.vy;
        this.trail.push({ x: this.x, y: this.y });

        // No trail length limit - trails persist entire wave

        if (MathUtils.distance(this.x, this.y, this.targetX, this.targetY) < this.speed) {
            this.reachedTarget = true;
            return true;
        }

        return false;
    }

    hasReachedTarget() {
        return this.reachedTarget;
    }
}

class ICBM {
    constructor(startX, startY, targetX, targetY, speed) {
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = speed;
        this.angle = MathUtils.angle(startX, startY, targetX, targetY);
        this.vx = Math.cos(this.angle) * speed;
        this.vy = Math.sin(this.angle) * speed;
        this.trail = [{ x: startX, y: startY }];
        this.isMIRV = false;
        this.hasSplit = false;
        this.splitAltitude = CONFIG.MIRV_SPLIT_MIN_Y +
            Math.random() * (CONFIG.MIRV_SPLIT_MAX_Y - CONFIG.MIRV_SPLIT_MIN_Y);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.trail.push({ x: this.x, y: this.y });

        // No trail length limit - trails persist entire wave

        // Check MIRV split
        if (this.isMIRV && !this.hasSplit && this.y >= this.splitAltitude) {
            return 'split';
        }

        // Check if reached target (ground level)
        if (this.y >= this.targetY) {
            return 'hit';
        }

        return null;
    }

    shouldSplit() {
        return this.isMIRV && !this.hasSplit && this.y >= this.splitAltitude;
    }
}

class SmartBomb extends ICBM {
    constructor(startX, startY, targetX, targetY, speed) {
        super(startX, startY, targetX, targetY, speed);
    }

    update(explosions) {
        // Check for nearby explosions
        for (const exp of explosions) {
            const dist = MathUtils.distance(this.x, this.y, exp.x, exp.y);
            if (dist < CONFIG.SMART_BOMB_EVADE_RADIUS + exp.getCurrentRadius()) {
                // Evade perpendicular to explosion vector
                const angle = MathUtils.angle(exp.x, exp.y, this.x, this.y);
                const perpAngle = angle + Math.PI / 2;
                this.vx = Math.cos(perpAngle) * this.speed;
                this.vy = Math.sin(perpAngle) * this.speed;
                return null; // Keep flying
            }
        }

        // Normal movement
        this.x += this.vx;
        this.y += this.vy;
        this.trail.push({ x: this.x, y: this.y });

        // No trail length limit - trails persist entire wave

        if (this.y >= this.targetY) return 'hit';
        return null;
    }
}

class Explosion {
    constructor(x, y, isEnemy) {
        this.x = x;
        this.y = y;
        this.isEnemy = isEnemy;
        this.radius = 0;
        this.maxRadius = CONFIG.EXPLOSION_MAX_RADIUS;
        this.phase = 'grow'; // grow -> hold -> shrink
        this.holdCounter = 0;
        this.frameAge = 0;
    }

    update() {
        this.frameAge++;

        if (this.phase === 'grow') {
            this.radius += CONFIG.EXPLOSION_GROW_RATE;
            if (this.radius >= this.maxRadius) {
                this.radius = this.maxRadius;
                this.phase = 'hold';
            }
        } else if (this.phase === 'hold') {
            this.holdCounter++;
            if (this.holdCounter >= CONFIG.EXPLOSION_HOLD_FRAMES) {
                this.phase = 'shrink';
            }
        } else if (this.phase === 'shrink') {
            this.radius -= CONFIG.EXPLOSION_SHRINK_RATE;
            if (this.radius <= 0) {
                this.radius = 0;
                return false; // Animation complete
            }
        }

        return true; // Still active
    }

    containsPoint(px, py) {
        return MathUtils.pointInExplosion(px, py, this.x, this.y, this.radius);
    }

    getCurrentRadius() {
        return this.radius;
    }

    getColorCycle() {
        // Returns index 0-3 for cycling through expColors[]
        // Slow down cycle: every 5 frames instead of every frame
        return Math.floor(this.frameAge / 5) % 4;
    }
}

class City {
    constructor(x, y, spriteIndex) {
        this.x = x;
        this.y = y;
        this.spriteIndex = spriteIndex; // 0-5 for different city shapes
        this.alive = true;
    }

    destroy() {
        this.alive = false;
    }

    getRect() {
        return { x: this.x - 8, y: this.y - 3, w: 16, h: 6 };
    }
}

class Bomber {
    constructor(x, y, vx) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.active = true;
        this.bombTimer = 60 + Math.random() * 120;
        this.bombCooldown = 0;
    }

    update() {
        this.x += this.vx;
        if (this.bombCooldown > 0) {
            this.bombCooldown--;
        } else if (this.bombTimer > 0) {
            this.bombTimer--;
        }
    }

    canDropBomb() {
        return this.active && this.bombTimer <= 0 && this.bombCooldown === 0;
    }

    dropBomb() {
        if (!this.canDropBomb()) return null;

        // Reset timer for next bomb
        this.bombTimer = 80 + Math.random() * 100;
        this.bombCooldown = 10;

        // Choose random target below
        const targets = [];

        // Target cities
        const cityX = [24, 48, 72, 184, 208, 232];
        for (const x of cityX) {
            targets.push({ x, y: CONFIG.CITY_Y });
        }

        // Target silos
        targets.push({ x: CONFIG.SILO_LEFT_X, y: CONFIG.SILO_Y });
        targets.push({ x: CONFIG.SILO_CENTER_X, y: CONFIG.SILO_Y });
        targets.push({ x: CONFIG.SILO_RIGHT_X, y: CONFIG.SILO_Y });

        const target = targets[Math.floor(Math.random() * targets.length)];
        return new EnemyBomb(this.x, this.y, target.x, target.y, 1.0);
    }

    getRect() {
        return { x: this.x - 4, y: this.y - 2, w: 8, h: 4 };
    }
}

class EnemyBomb {
    constructor(startX, startY, targetX, targetY, speed) {
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = speed;
        this.angle = MathUtils.angle(startX, startY, targetX, targetY);
        this.vx = Math.cos(this.angle) * speed;
        this.vy = Math.sin(this.angle) * speed;
        this.trail = [{ x: startX, y: startY }];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.trail.push({ x: this.x, y: this.y });

        // Check if hit ground
        if (this.y >= CONFIG.GROUND_Y) {
            return 'hit';
        }

        return null;
    }

    getRect() {
        return { x: this.x - 1, y: this.y - 1, w: 2, h: 2 };
    }
}

class Satellite {
    constructor(x, y, vx) {
        this.x = x;
        this.y = y;
        this.vx = vx;
    }

    update() {
        this.x += this.vx;
    }

    getRect() {
        return { x: this.x - 3, y: this.y - 2, w: 6, h: 4 };
    }
}
// ============================================================================
// SECTION 7 - COLLISION SYSTEM
// ============================================================================

const CollisionSystem = {
  /**
   * Check if explosions hit any enemies
   * IMPORTANT: Only checks every 5 frames (authentic to arcade hardware)
   * @param {Array} explosions - Array of Explosion objects
   * @param {Array} icbms - Array of ICBM objects
   * @param {Array} smartBombs - Array of SmartBomb objects
   * @param {Array} bombers - Array of Bomber objects
   * @param {Array} satellites - Array of Satellite objects
   * @param {Number} frameCount - Current frame number
   * @returns {Array} Array of hit objects: {type, entity, explosion}
   */
  checkExplosionsVsEnemies(explosions, icbms, smartBombs, bombers, satellites, frameCount) {
    // Only check every 5 frames (authentic)
    if (frameCount % 5 !== 0) return [];

    const hits = [];

    for (const exp of explosions) {
      // Only active (expanding or full) explosions damage enemies
      if (exp.phase === 'shrink') continue;

      // Check ICBMs (no active property check - they're all active if in array)
      for (const icbm of icbms) {
        if (exp.containsPoint(icbm.x, icbm.y)) {
          hits.push({ type: 'icbm', entity: icbm, explosion: exp });
        }
      }

      // Check smart bombs
      for (const sb of smartBombs) {
        if (exp.containsPoint(sb.x, sb.y)) {
          hits.push({ type: 'smartBomb', entity: sb, explosion: exp });
        }
      }

      // Check bombers
      for (const bomber of bombers) {
        if (exp.containsPoint(bomber.x, bomber.y)) {
          hits.push({ type: 'bomber', entity: bomber, explosion: exp });
        }
      }

      // Check satellites
      for (const sat of satellites) {
        if (exp.containsPoint(sat.x, sat.y)) {
          hits.push({ type: 'satellite', entity: sat, explosion: exp });
        }
      }
    }

    return hits;
  },

  /**
   * Check if ICBMs hit cities
   * @param {Array} icbms - Array of ICBM objects
   * @param {Array} cities - Array of City objects
   * @returns {Array} Array of hit objects: {icbm, city}
   */
  checkICBMsVsCities(icbms, cities) {
    const hits = [];

    for (const icbm of icbms) {
      // ICBMs are managed by array add/remove, no active property

      for (const city of cities) {
        if (!city.alive) continue;

        const rect = city.getRect();
        if (icbm.x >= rect.x && icbm.x <= rect.x + rect.w &&
            icbm.y >= rect.y && icbm.y <= rect.y + rect.h) {
          hits.push({ icbm, city });
        }
      }
    }

    return hits;
  },

  /**
   * Check if ICBMs hit missile silos
   * @param {Array} icbms - Array of ICBM objects
   * @param {Array} silos - Array of Silo objects
   * @returns {Array} Array of hit objects: {icbm, silo}
   */
  checkICBMsVsSilos(icbms, silos) {
    const hits = [];

    for (const icbm of icbms) {
      // ICBMs are managed by array add/remove, no active property

      for (const silo of silos) {
        if (silo.destroyed) continue;

        const rect = silo.getRect();
        if (icbm.x >= rect.x && icbm.x <= rect.x + rect.w &&
            icbm.y >= rect.y && icbm.y <= rect.y + rect.h) {
          hits.push({ icbm, silo });
        }
      }
    }

    return hits;
  },

  /**
   * Check if smart bombs dropped by bombers hit cities
   * @param {Array} bombs - Array of enemy bomb objects
   * @param {Array} cities - Array of City objects
   * @returns {Array} Array of hit objects: {bomb, city}
   */
  checkBombsVsCities(bombs, cities) {
    const hits = [];

    for (const bomb of bombs) {
      // Bombs are managed by array add/remove, no active property

      for (const city of cities) {
        if (!city.alive) continue;

        const rect = city.getRect();
        if (bomb.x >= rect.x && bomb.x <= rect.x + rect.w &&
            bomb.y >= rect.y && bomb.y <= rect.y + rect.h) {
          hits.push({ bomb, city });
        }
      }
    }

    return hits;
  },

  /**
   * Check if smart bombs hit silos
   * @param {Array} bombs - Array of enemy bomb objects
   * @param {Array} silos - Array of Silo objects
   * @returns {Array} Array of hit objects: {bomb, silo}
   */
  checkBombsVsSilos(bombs, silos) {
    const hits = [];

    for (const bomb of bombs) {
      // Bombs are managed by array add/remove, no active property

      for (const silo of silos) {
        if (silo.destroyed) continue;

        const rect = silo.getRect();
        if (bomb.x >= rect.x && bomb.x <= rect.x + rect.w &&
            bomb.y >= rect.y && bomb.y <= rect.y + rect.h) {
          hits.push({ bomb, silo });
        }
      }
    }

    return hits;
  }
};

// ============================================================================
// SECTION 8 - RENDERER
// ============================================================================

const Renderer = {
  /**
   * Draw an octagonal explosion (authentic Missile Command shape)
   * Uses scan-line fill with octagonal distance formula
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Number} cx - Center X coordinate
   * @param {Number} cy - Center Y coordinate
   * @param {Number} radius - Explosion radius
   * @param {String} color - Fill color
   */
  drawOctagon(ctx, cx, cy, radius, color) {
    ctx.fillStyle = color;

    // Scan-line fill algorithm for octagon
    // Octagon has 45-degree beveled corners
    for (let dy = -radius; dy <= radius; dy++) {
      const ady = Math.abs(dy);

      // Calculate maximum x extent at this y level
      // For an octagon: x_max ≈ min((r - |y|) / 0.375, r - 0.375 * |y|)
      const dxMax = Math.floor(Math.min(
        (radius - ady) / 0.375,
        radius - 0.375 * ady
      ));

      if (dxMax >= 0) {
        // Draw horizontal line segment
        const x = Math.floor(cx - dxMax);
        const y = Math.floor(cy + dy);
        const width = dxMax * 2 + 1;
        ctx.fillRect(x, y, width, 1);
      }
    }
  },

  /**
   * Draw a bitmap sprite
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} sprite - 2D array of booleans (sprite data)
   * @param {Number} x - Top-left X coordinate
   * @param {Number} y - Top-left Y coordinate
   * @param {String} color - Fill color
   */
  drawSprite(ctx, sprite, x, y, color) {
    ctx.fillStyle = color;

    for (let row = 0; row < sprite.length; row++) {
      for (let col = 0; col < sprite[row].length; col++) {
        if (sprite[row][col]) {
          ctx.fillRect(x + col, y + row, 1, 1);
        }
      }
    }
  },

  /**
   * Draw text using bitmap font
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {String} text - Text to draw
   * @param {Number} x - Left X coordinate
   * @param {Number} y - Top Y coordinate
   * @param {String} color - Text color
   */
  drawText(ctx, text, x, y, color) {
    let currentX = x;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === ' ') {
        currentX += 6;
        continue;
      }

      const sprite = SPRITES.FONT[char];
      if (sprite) {
        this.drawSprite(ctx, sprite, currentX, y, color);
        currentX += 6; // 5px char width + 1px spacing
      } else {
        currentX += 6; // Unknown char, just skip space
      }
    }
  },

  /**
   * Draw centered text
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {String} text - Text to draw
   * @param {Number} y - Top Y coordinate
   * @param {String} color - Text color
   */
  drawCenteredText(ctx, text, y, color) {
    const width = text.length * 6 - 1;
    const x = Math.floor((CONFIG.LOGICAL_WIDTH - width) / 2);
    this.drawText(ctx, text, x, y, color);
  },

  /**
   * Main render function
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} state - Game state object
   */
  render(ctx, state) {
    const cs = state.colorScheme || COLOR_SCHEMES[0];

    // Clear screen
    ctx.fillStyle = cs.bg;
    ctx.fillRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT);

    // Draw ground
    ctx.fillStyle = cs.structures;
    ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.LOGICAL_WIDTH, CONFIG.GROUND_HEIGHT);

    // Draw terrain profile (mountainous horizon)
    ctx.fillStyle = cs.structures;
    for (let x = 0; x < TERRAIN.length && x < CONFIG.LOGICAL_WIDTH; x++) {
      if (TERRAIN[x]) {
        // Terrain pixel extends up from ground line
        ctx.fillRect(x, CONFIG.GROUND_Y - 1, 1, 1);
      }
    }

    // Render based on game state
    if (state.state === 'attract') {
      this.renderAttractScreen(ctx, cs, state);
    } else if (state.state === 'gameOver') {
      this.renderGameOver(ctx, cs, state);
    } else {
      this.renderGameplay(ctx, state, cs);
    }
  },

  /**
   * Render attract screen (authentic arcade style with explosion animation)
   */
  renderAttractScreen(ctx, cs, state) {
    // Draw gameplay elements in background (cities, silos)
    this.renderGameplay(ctx, state, cs);

    // Authentic arcade title: "USE MISSILE COMMAND"
    const titleOpacity = Math.max(0, 1 - (state.attractAnimationFrame / 200));

    if (titleOpacity > 0) {
      // Draw title that gets "destroyed" by explosions
      ctx.globalAlpha = titleOpacity;
      this.drawCenteredText(ctx, 'USE', 40, cs.text);
      this.drawCenteredText(ctx, 'MISSILE', 50, cs.text);
      this.drawCenteredText(ctx, 'COMMAND', 60, cs.text);
      ctx.globalAlpha = 1.0;
    }

    // Draw explosions over title (authentic arcade effect)
    for (const exp of state.attractExplosions) {
      const colorIdx = exp.getColorCycle();
      const color = cs.expColors[colorIdx];
      this.drawOctagon(ctx, Math.floor(exp.x), Math.floor(exp.y),
                       Math.floor(exp.radius), color);
    }

    // After explosion animation, show instructions
    if (state.attractAnimationFrame > 220) {
      this.drawCenteredText(ctx, 'DEFEND CITIES', 85, cs.text);
      this.drawCenteredText(ctx, 'MOUSE TO AIM', 110, cs.scoreText);
      this.drawCenteredText(ctx, 'KEYS 1 2 3 FIRE SILOS', 120, cs.scoreText);
    }

    // Scrolling "PRESS START" message (authentic arcade)
    const scrollOffset = Math.floor((state.frameCount / 2) % 300) - 50;
    this.drawText(ctx, 'PRESS ENTER TO START', scrollOffset, 190, cs.text);

    // Show high score
    if (state.highScore > 0) {
      this.drawCenteredText(ctx, `HIGH ${state.highScore}`, 180, cs.scoreText);
    }
  },

  /**
   * Render game over screen
   */
  renderGameOver(ctx, cs, state) {
    this.renderGameplay(ctx, state, cs);

    this.drawCenteredText(ctx, 'THE END', 100, cs.text);
    this.drawCenteredText(ctx, `SCORE ${state.score}`, 120, cs.scoreText);

    if (state.score === state.highScore && state.score > 0) {
      this.drawCenteredText(ctx, 'NEW HIGH SCORE', 140, cs.text);
    }

    this.drawCenteredText(ctx, 'PRESS ENTER TO RESTART', 170, cs.text);
  },

  /**
   * Render gameplay screen
   */
  renderGameplay(ctx, state, cs) {
    // Draw cities
    for (let i = 0; i < state.cities.length; i++) {
      const city = state.cities[i];
      if (city.alive) {
        const sprite = SPRITES[`CITY_${city.spriteIndex + 1}`];
        this.drawSprite(ctx, sprite, city.x - 8, city.y - 3, cs.structures);
      } else {
        // Draw rubble for destroyed cities
        this.drawSprite(ctx, SPRITES.CITY_RUBBLE, city.x - 8, city.y - 3, cs.structures);
      }
    }

    // Draw silos
    for (const silo of state.silos) {
      if (!silo.destroyed) {
        this.drawSprite(ctx, SPRITES.SILO, silo.x - 8, silo.y - 8, cs.structures);

        // Draw missile count
        if (silo.missiles > 0) {
          const countStr = String(silo.missiles);
          this.drawText(ctx, countStr, silo.x - 2, silo.y + 2, cs.text);
        }
      } else {
        // Draw destroyed silo
        this.drawSprite(ctx, SPRITES.SILO_RUBBLE, silo.x - 8, silo.y - 4, cs.structures);
      }
    }

    // Draw persistent ABM trails (from previous missiles that detonated)
    ctx.fillStyle = cs.abmTrail;
    for (const trail of state.persistentABMTrails) {
      for (const pt of trail) {
        ctx.fillRect(Math.floor(pt.x), Math.floor(pt.y), 1, 1);
      }
    }

    // Draw active ABM trails (authentic ragged pixel-by-pixel rendering)
    // ROM uses fixed-point incremental math, not smooth lines
    ctx.fillStyle = cs.abmTrail;
    for (const abm of state.abms) {
      for (const pt of abm.trail) {
        ctx.fillRect(Math.floor(pt.x), Math.floor(pt.y), 1, 1);
      }
    }

    // Draw persistent ICBM trails (from previous missiles that hit/were destroyed)
    ctx.fillStyle = cs.icbmTrail;
    for (const trail of state.persistentICBMTrails) {
      for (const pt of trail) {
        ctx.fillRect(Math.floor(pt.x), Math.floor(pt.y), 1, 1);
      }
    }

    // Draw active ICBM trails (authentic ragged pixel-by-pixel rendering)
    ctx.fillStyle = cs.icbmTrail;
    const allIcbms = [...state.icbms, ...state.smartBombs, ...state.enemyBombs];
    for (const icbm of allIcbms) {
      for (const pt of icbm.trail) {
        ctx.fillRect(Math.floor(pt.x), Math.floor(pt.y), 1, 1);
      }
    }

    // Draw explosions (octagonal!)
    for (const exp of state.explosions) {
      const colorIdx = exp.getColorCycle();
      const color = cs.expColors[colorIdx];
      this.drawOctagon(ctx, Math.floor(exp.x), Math.floor(exp.y),
                       Math.floor(exp.radius), color);
    }

    // Draw bombers
    for (const bomber of state.bombers) {
      if (bomber.active) {
        this.drawSprite(ctx, SPRITES.BOMBER, bomber.x - 4, bomber.y - 2, cs.text);
      }
    }

    // Draw satellites
    for (const sat of state.satellites) {
      if (sat.active) {
        this.drawSprite(ctx, SPRITES.SATELLITE, sat.x - 3, sat.y - 2, cs.text);
      }
    }

    // Draw crosshair (+ shape)
    ctx.strokeStyle = cs.crosshair;
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Horizontal line
    ctx.moveTo(state.crosshairX - 5, state.crosshairY);
    ctx.lineTo(state.crosshairX + 5, state.crosshairY);
    // Vertical line
    ctx.moveTo(state.crosshairX, state.crosshairY - 5);
    ctx.lineTo(state.crosshairX, state.crosshairY + 5);
    ctx.stroke();

    // HUD - Score and Wave
    this.drawText(ctx, `SCORE ${state.score}`, 10, 5, cs.scoreText);
    const waveText = `WAVE ${state.wave}`;
    const waveWidth = waveText.length * 6 - 1;
    this.drawText(ctx, waveText, CONFIG.LOGICAL_WIDTH - waveWidth - 10, 5, cs.scoreText);

    // Wave-end tally screen
    if (state.state === 'tally') {
      this.renderTally(ctx, state, cs);
    }
  },

  /**
   * Render wave-end tally screen
   */
  renderTally(ctx, state, cs) {
    let y = 80;

    this.drawCenteredText(ctx, `WAVE ${state.wave} COMPLETE`, y, cs.text);
    y += 20;

    // Missile bonus
    this.drawCenteredText(ctx, `MISSILES ${state.tallyMissilesLeft} X 5`, y, cs.text);
    y += 10;

    // City bonus
    this.drawCenteredText(ctx, `CITIES ${state.tallyCitiesLeft} X 100`, y, cs.text);
    y += 10;

    // Multiplier
    this.drawCenteredText(ctx, `MULTIPLIER ${state.scoreMultiplier}X`, y, cs.text);
  }
};

// ============================================================================
// SECTION 9 - GAME STATE MACHINE
// ============================================================================

class Game {
  /**
   * Main game controller
   * States: attract, waveStart, playing, tally, gameOver
   */
  constructor(canvas, input, soundEngine) {
    this.canvas = canvas;
    this.input = input;
    this.sound = soundEngine;

    // Game state
    this.state = 'attract';
    this.score = 0;
    this.highScore = 0;
    this.wave = 0;
    this.scoreMultiplier = 1;
    this.nextBonusCity = CONFIG.BONUS_CITY_THRESHOLD;
    this.colorScheme = COLOR_SCHEMES[0];

    // Attract screen animation
    this.attractExplosions = [];
    this.attractAnimationFrame = 0;

    // Entities
    this.silos = [];
    this.cities = [];
    this.abms = [];
    this.icbms = [];
    this.smartBombs = [];
    this.bombers = [];
    this.satellites = [];
    this.explosions = [];
    this.enemyBombs = [];

    // Persistent trails (remain after missile destroyed)
    this.persistentABMTrails = [];
    this.persistentICBMTrails = [];

    // Input state
    this.crosshairX = 128;
    this.crosshairY = 100;

    // Timing
    this.frameCount = 0;
    this.stateTimer = 0;

    // Attack wave management
    this.attackSlots = [];  // Max CONFIG.MAX_ICBM_SLOTS
    this.nextAttackTimer = 0;
    this.waveAttacksSpawned = 0;
    this.waveAttacksTotal = 0;

    // Tally screen state
    this.tallyMissilesLeft = 0;
    this.tallyCitiesLeft = 0;

    // Initialize game objects
    this.initGame();
  }

  /**
   * Initialize cities and silos
   */
  initGame() {
    // Create 3 missile silos
    this.silos = [
      new Silo(CONFIG.SILO_LEFT_X, CONFIG.SILO_Y, CONFIG.ABM_SPEED_SIDE, 0),
      new Silo(CONFIG.SILO_CENTER_X, CONFIG.SILO_Y, CONFIG.ABM_SPEED_CENTER, 1),
      new Silo(CONFIG.SILO_RIGHT_X, CONFIG.SILO_Y, CONFIG.ABM_SPEED_SIDE, 2)
    ];

    // Create 6 cities
    this.cities = CONFIG.CITY_POSITIONS.map((x, i) =>
      new City(x, CONFIG.CITY_Y, i)
    );
  }

  /**
   * Start a new game
   */
  startGame() {
    this.score = 0;
    this.wave = 0;
    this.scoreMultiplier = 1;
    this.nextBonusCity = CONFIG.BONUS_CITY_THRESHOLD;

    // Reset cities and silos
    this.initGame();

    // Start first wave
    this.startWave();
  }

  /**
   * Check if score crossed bonus city threshold and award if so
   */
  checkBonusCity() {
    if (this.score >= this.nextBonusCity) {
      // Award bonus city - revive first dead city
      for (const city of this.cities) {
        if (!city.alive) {
          city.alive = true;
          this.sound.bonusCity();
          this.nextBonusCity += CONFIG.BONUS_CITY_THRESHOLD;
          return;
        }
      }

      // All cities alive, still advance threshold
      this.nextBonusCity += CONFIG.BONUS_CITY_THRESHOLD;
    }
  }

  /**
   * Start a new wave
   */
  startWave() {
    this.wave++;
    this.state = 'waveStart';
    this.stateTimer = CONFIG.WAVE_START_DURATION;

    // Cycle color scheme every 2 waves (authentic arcade behavior)
    const schemeIndex = Math.floor((this.wave - 1) / 2) % COLOR_SCHEMES.length;
    this.colorScheme = COLOR_SCHEMES[schemeIndex];

    // Restore silos with missiles
    for (const silo of this.silos) {
      silo.restoreForWave();
    }

    // Clear all projectiles and enemies
    this.abms = [];
    this.icbms = [];
    this.smartBombs = [];
    this.bombers = [];
    this.satellites = [];
    this.explosions = [];
    this.enemyBombs = [];
    this.attackSlots = [];

    // Clear persistent trails (start fresh each wave)
    this.persistentABMTrails = [];
    this.persistentICBMTrails = [];

    // Set up wave attacks (authentic arcade: 2-4 in wave 1, scaling up)
    this.waveAttacksTotal = 2 + this.wave;
    this.waveAttacksSpawned = 0;
    this.nextAttackTimer = 30;

    // Play incoming warning sound
    this.sound.incomingWarning();
  }

  /**
   * Launch an ABM from a silo
   */
  launchABM(silo, targetX, targetY) {
    // Check if silo can fire
    if (!silo.fireMissile()) return;

    // Create ABM
    const abm = new ABM(silo.x, silo.y - 10, targetX, targetY, silo.speed);
    this.abms.push(abm);

    // Play launch sound
    this.sound.abmLaunch();
  }

  /**
   * Spawn a new ICBM attack
   */
  spawnAttack() {
    // Check if we've spawned all attacks for this wave
    if (this.waveAttacksSpawned >= this.waveAttacksTotal) return;

    // Check if we've reached max simultaneous attacks
    if (this.attackSlots.length >= CONFIG.MAX_ICBM_SLOTS) return;

    // Build list of valid targets
    const targets = [];
    for (const city of this.cities) {
      if (city.alive) targets.push({ x: city.x, y: city.y });
    }
    for (const silo of this.silos) {
      if (!silo.destroyed) targets.push({ x: silo.x, y: silo.y });
    }

    // No targets left
    if (targets.length === 0) return;

    // Choose random target
    const target = targets[Math.floor(Math.random() * targets.length)];

    // Random start X position at top of screen
    const startX = Math.random() * CONFIG.LOGICAL_WIDTH;

    // Speed increases with wave (reduced from 0.6/0.1 to 0.4/0.05 for authentic feel)
    const speed = 0.4 + this.wave * 0.05;

    // Create ICBM
    const icbm = new ICBM(startX, 0, target.x, target.y, speed);

    // 30% chance of MIRV on waves 3+
    if (this.wave >= 3 && Math.random() < CONFIG.MIRV_SPLIT_CHANCE) {
      icbm.isMIRV = true;
    }

    this.icbms.push(icbm);
    this.attackSlots.push(icbm);
    this.waveAttacksSpawned++;
  }

  /**
   * Spawn a bomber aircraft (waves 5+)
   */
  spawnBomber() {
    if (this.wave < 5) return;
    if (this.bombers.length >= 2) return;

    // Random direction
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? 0 : CONFIG.LOGICAL_WIDTH;
    const y = 30 + Math.random() * 30;
    const vx = fromLeft ? CONFIG.BOMBER_SPEED : -CONFIG.BOMBER_SPEED;

    const bomber = new Bomber(x, y, vx);
    this.bombers.push(bomber);
  }

  /**
   * Spawn a satellite (waves 7+)
   */
  spawnSatellite() {
    if (this.wave < 7) return;
    if (this.satellites.length >= 1) return;

    // Random direction
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? 0 : CONFIG.LOGICAL_WIDTH;
    const y = 10 + Math.random() * 20;
    const vx = fromLeft ? CONFIG.SATELLITE_SPEED : -CONFIG.SATELLITE_SPEED;

    const satellite = new Satellite(x, y, vx);
    this.satellites.push(satellite);
  }

  /**
   * Main update function
   */
  update() {
    this.frameCount++;
    this.input.update();

    // Update crosshair position from mouse
    this.crosshairX = this.input.getCrosshairX();
    this.crosshairY = this.input.getCrosshairY();

    // State machine
    if (this.state === 'attract') {
      this.updateAttract();
    } else if (this.state === 'waveStart') {
      this.updateWaveStart();
    } else if (this.state === 'playing') {
      this.updatePlaying();
    } else if (this.state === 'tally') {
      this.updateTally();
    } else if (this.state === 'gameOver') {
      this.updateGameOver();
    }

    // Clear input buffer after all state updates
    this.input.clearBuffer();
  }

  /**
   * Update attract screen (with explosion animation)
   */
  updateAttract() {
    this.attractAnimationFrame++;

    // Create explosions over title letters every 10 frames (for first 200 frames)
    if (this.attractAnimationFrame < 200 && this.attractAnimationFrame % 10 === 0) {
      // Random position over title area
      const x = 60 + Math.random() * 136;  // Center area where title is
      const y = 45 + Math.random() * 30;   // Title height area
      this.attractExplosions.push(new Explosion(x, y, false));
    }

    // Update attract explosions
    this.attractExplosions = this.attractExplosions.filter(exp => exp.update());

    // Reset animation after it completes
    if (this.attractAnimationFrame > 400) {
      this.attractAnimationFrame = 0;
      this.attractExplosions = [];
    }

    if (this.input.isStart()) {
      this.startGame();
    }
  }

  /**
   * Update wave start countdown
   */
  updateWaveStart() {
    this.stateTimer--;
    if (this.stateTimer <= 0) {
      this.state = 'playing';
    }
  }

  /**
   * Update playing state
   */
  updatePlaying() {
    // Fire ABMs with keys 1/2/3
    if (this.input.isSilo1Fire() && this.silos[0].hasMissiles()) {
      this.launchABM(this.silos[0], this.crosshairX, this.crosshairY);
    }
    if (this.input.isSilo2Fire() && this.silos[1].hasMissiles()) {
      this.launchABM(this.silos[1], this.crosshairX, this.crosshairY);
    }
    if (this.input.isSilo3Fire() && this.silos[2].hasMissiles()) {
      this.launchABM(this.silos[2], this.crosshairX, this.crosshairY);
    }

    // Update ABMs
    this.abms = this.abms.filter(abm => {
      const reached = abm.update();
      if (reached) {
        // ABM reached target, create explosion
        this.explosions.push(new Explosion(abm.targetX, abm.targetY, false));
        this.sound.abmExplode();

        // Save trail to persistent storage (remains visible entire wave)
        this.persistentABMTrails.push([...abm.trail]);

        return false;
      }
      return true;
    });

    // Update ICBMs
    this.icbms = this.icbms.filter(icbm => {
      const result = icbm.update();

      if (result === 'split') {
        // MIRV splits into 2-3 child ICBMs
        const numChildren = 2 + Math.floor(Math.random() * 2);

        for (let i = 0; i < numChildren; i++) {
          // Build list of targets
          const targets = [];
          for (const city of this.cities) {
            if (city.alive) targets.push({ x: city.x, y: city.y });
          }
          for (const silo of this.silos) {
            if (!silo.destroyed) targets.push({ x: silo.x, y: silo.y });
          }

          if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];
            const child = new ICBM(icbm.x, icbm.y, target.x, target.y, icbm.speed);
            this.icbms.push(child);
          }
        }

        // Mark MIRV as split (don't add to slots again)
        icbm.hasSplit = true;
        return false;

      } else if (result === 'hit') {
        // ICBM hit ground, create explosion
        this.explosions.push(new Explosion(icbm.x, icbm.y, true));
        this.sound.icbmExplode();

        // Save trail to persistent storage
        this.persistentICBMTrails.push([...icbm.trail]);

        // Remove from attack slots
        const idx = this.attackSlots.indexOf(icbm);
        if (idx >= 0) this.attackSlots.splice(idx, 1);

        return false;
      }

      return true;
    });

    // Update smart bombs (with evasion logic)
    this.smartBombs = this.smartBombs.filter(sb => {
      const result = sb.update(this.explosions);

      if (result === 'hit') {
        this.explosions.push(new Explosion(sb.x, sb.y, true));
        this.sound.icbmExplode();

        // Save trail to persistent storage
        this.persistentICBMTrails.push([...sb.trail]);

        // Remove from attack slots
        const idx = this.attackSlots.indexOf(sb);
        if (idx >= 0) this.attackSlots.splice(idx, 1);

        return false;
      }

      return true;
    });

    // Update enemy bombs dropped by bombers
    this.enemyBombs = this.enemyBombs.filter(bomb => {
      const result = bomb.update();

      if (result === 'hit') {
        this.explosions.push(new Explosion(bomb.x, bomb.y, true));
        this.sound.icbmExplode();

        // Save trail to persistent storage
        this.persistentICBMTrails.push([...bomb.trail]);

        return false;
      }

      return true;
    });

    // Update bombers
    this.bombers = this.bombers.filter(bomber => {
      bomber.update();

      // Drop bombs periodically
      if (bomber.active && bomber.canDropBomb()) {
        const bomb = bomber.dropBomb();
        if (bomb) {
          this.enemyBombs.push(bomb);
        }
      }

      // Remove if off-screen
      if (bomber.x < -20 || bomber.x > CONFIG.LOGICAL_WIDTH + 20) {
        return false;
      }

      return true;
    });

    // Update satellites
    this.satellites = this.satellites.filter(sat => {
      sat.update();

      // Remove if off-screen
      if (sat.x < -20 || sat.x > CONFIG.LOGICAL_WIDTH + 20) {
        return false;
      }

      return true;
    });

    // Update explosions
    this.explosions = this.explosions.filter(exp => exp.update());

    // Collision detection - explosions vs enemies (every 5 frames)
    const hits = CollisionSystem.checkExplosionsVsEnemies(
      this.explosions, this.icbms, this.smartBombs, this.bombers,
      this.satellites, this.frameCount
    );

    for (const hit of hits) {
      if (hit.type === 'icbm') {
        // Save trail to persistent storage
        this.persistentICBMTrails.push([...hit.entity.trail]);

        // Remove ICBM
        this.icbms = this.icbms.filter(i => i !== hit.entity);

        // Remove from attack slots
        const idx = this.attackSlots.indexOf(hit.entity);
        if (idx >= 0) this.attackSlots.splice(idx, 1);

        // Award points
        this.score += CONFIG.SCORE_MISSILE * this.scoreMultiplier;
        this.checkBonusCity();
        this.sound.enemyDestroyed();

      } else if (hit.type === 'smartBomb') {
        // Save trail to persistent storage
        this.persistentICBMTrails.push([...hit.entity.trail]);

        // Remove smart bomb
        this.smartBombs = this.smartBombs.filter(sb => sb !== hit.entity);

        // Remove from attack slots
        const idx = this.attackSlots.indexOf(hit.entity);
        if (idx >= 0) this.attackSlots.splice(idx, 1);

        // Award points
        this.score += CONFIG.SCORE_SMART_BOMB * this.scoreMultiplier;
        this.checkBonusCity();
        this.sound.enemyDestroyed();

      } else if (hit.type === 'bomber') {
        // Destroy bomber
        hit.entity.active = false;

        // Award points
        this.score += CONFIG.SCORE_BOMBER * this.scoreMultiplier;
        this.checkBonusCity();
        this.sound.enemyDestroyed();

      } else if (hit.type === 'satellite') {
        // Destroy satellite
        hit.entity.active = false;

        // Award points
        this.score += CONFIG.SCORE_SATELLITE * this.scoreMultiplier;
        this.checkBonusCity();
        this.sound.enemyDestroyed();
      }
    }

    // Check ICBM vs city collisions
    const cityHits = CollisionSystem.checkICBMsVsCities(this.icbms, this.cities);
    for (const { icbm, city } of cityHits) {
      // Destroy city
      city.destroy();

      // Save trail to persistent storage
      this.persistentICBMTrails.push([...icbm.trail]);

      // Remove ICBM
      this.icbms = this.icbms.filter(i => i !== icbm);

      // Remove from attack slots
      const idx = this.attackSlots.indexOf(icbm);
      if (idx >= 0) this.attackSlots.splice(idx, 1);

      // Create explosion
      this.explosions.push(new Explosion(city.x, city.y, true));
      this.sound.cityDestroyed();
    }

    // Check ICBM vs silo collisions
    const siloHits = CollisionSystem.checkICBMsVsSilos(this.icbms, this.silos);
    for (const { icbm, silo } of siloHits) {
      // Destroy silo
      silo.destroy();

      // Save trail to persistent storage
      this.persistentICBMTrails.push([...icbm.trail]);

      // Remove ICBM
      this.icbms = this.icbms.filter(i => i !== icbm);

      // Remove from attack slots
      const idx = this.attackSlots.indexOf(icbm);
      if (idx >= 0) this.attackSlots.splice(idx, 1);

      // Create explosion
      this.explosions.push(new Explosion(silo.x, silo.y, true));
      this.sound.cityDestroyed();
    }

    // Check bomb vs city collisions
    const bombCityHits = CollisionSystem.checkBombsVsCities(this.enemyBombs, this.cities);
    for (const { bomb, city } of bombCityHits) {
      city.destroy();
      this.enemyBombs = this.enemyBombs.filter(b => b !== bomb);
      this.explosions.push(new Explosion(city.x, city.y, true));
      this.sound.cityDestroyed();
    }

    // Check bomb vs silo collisions
    const bombSiloHits = CollisionSystem.checkBombsVsSilos(this.enemyBombs, this.silos);
    for (const { bomb, silo } of bombSiloHits) {
      silo.destroy();
      this.enemyBombs = this.enemyBombs.filter(b => b !== bomb);
      this.explosions.push(new Explosion(silo.x, silo.y, true));
      this.sound.cityDestroyed();
    }

    // Spawn new attacks
    this.nextAttackTimer--;
    if (this.nextAttackTimer <= 0) {
      this.spawnAttack();

      // Attack frequency increases with wave
      this.nextAttackTimer = Math.max(20, 60 - this.wave * 3);
    }

    // Spawn bombers (waves 5+)
    if (this.wave >= 5 && this.frameCount % 300 === 0) {
      this.spawnBomber();
    }

    // Spawn satellites (waves 7+)
    if (this.wave >= 7 && this.frameCount % 400 === 0) {
      this.spawnSatellite();
    }

    // Check wave complete
    const allSpawnsComplete = this.waveAttacksSpawned >= this.waveAttacksTotal;
    const noActiveThreats = this.icbms.length === 0 &&
                           this.smartBombs.length === 0 &&
                           this.enemyBombs.length === 0;

    if (allSpawnsComplete && noActiveThreats) {
      this.startTally();
    }

    // Check game over (all cities destroyed)
    const allCitiesDead = this.cities.every(c => !c.alive);
    if (allCitiesDead) {
      this.state = 'gameOver';
      this.sound.gameOver();

      // Update high score
      if (this.score > this.highScore) {
        this.highScore = this.score;
      }
    }
  }

  /**
   * Start wave-end tally
   */
  startTally() {
    this.state = 'tally';
    this.stateTimer = 0;

    // Count remaining missiles and cities
    this.tallyMissilesLeft = this.silos.reduce((sum, s) => sum + s.missiles, 0);
    this.tallyCitiesLeft = this.cities.filter(c => c.alive).length;

    this.sound.tallyStart();
  }

  /**
   * Update tally screen
   */
  updateTally() {
    this.stateTimer++;

    // Award bonus points every N frames
    if (this.stateTimer % CONFIG.BONUS_TICK_INTERVAL === 0) {
      if (this.tallyMissilesLeft > 0) {
        // Award missile bonus
        this.tallyMissilesLeft--;
        this.score += CONFIG.SCORE_ABM_BONUS * this.scoreMultiplier;
        this.checkBonusCity();
        this.sound.bonusCount();

      } else if (this.tallyCitiesLeft > 0) {
        // Award city bonus
        this.tallyCitiesLeft--;
        this.score += CONFIG.SCORE_CITY_BONUS * this.scoreMultiplier;
        this.checkBonusCity();
        this.sound.bonusCity();

      } else {
        // Tally complete
        // Increase multiplier every OTHER wave (max 6x)
        if (this.wave % 2 === 0 && this.scoreMultiplier < 6) {
          this.scoreMultiplier++;
        }

        // Start next wave
        this.startWave();
      }
    }
  }

  /**
   * Update game over screen
   */
  updateGameOver() {
    if (this.input.isStart()) {
      this.startGame();
    }
  }

  /**
   * Get current game state for renderer
   */
  getState() {
    return {
      state: this.state,
      silos: this.silos,
      cities: this.cities,
      abms: this.abms,
      icbms: this.icbms,
      smartBombs: this.smartBombs,
      bombers: this.bombers,
      satellites: this.satellites,
      explosions: this.explosions,
      enemyBombs: this.enemyBombs,
      persistentABMTrails: this.persistentABMTrails,
      persistentICBMTrails: this.persistentICBMTrails,
      score: this.score,
      highScore: this.highScore,
      wave: this.wave,
      scoreMultiplier: this.scoreMultiplier,
      crosshairX: this.crosshairX,
      crosshairY: this.crosshairY,
      stateTimer: this.stateTimer,
      tallyMissilesLeft: this.tallyMissilesLeft,
      tallyCitiesLeft: this.tallyCitiesLeft,
      frameCount: this.frameCount,
      colorScheme: this.colorScheme,
      attractExplosions: this.attractExplosions,
      attractAnimationFrame: this.attractAnimationFrame
    };
  }
}

// ============================================================================
// SECTION 10 - MAIN LOOP
// ============================================================================

// Get canvas and set up rendering context
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });

// Set canvas size (scaled for crisp pixels)
canvas.width = CONFIG.LOGICAL_WIDTH * CONFIG.SCALE;
canvas.height = CONFIG.LOGICAL_HEIGHT * CONFIG.SCALE;

// Disable smoothing for crisp pixel art
ctx.imageSmoothingEnabled = false;

// Scale context for logical coordinates
ctx.scale(CONFIG.SCALE, CONFIG.SCALE);

// Create game systems
const input = new InputHandler(canvas);
const soundEngine = new SoundEngine();
const game = new Game(canvas, input, soundEngine);

// Fixed timestep game loop
let lastTime = 0;
const FIXED_DT = 1000 / 60;  // 60 FPS
let accumulator = 0;

function gameLoop(currentTime) {
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  accumulator += deltaTime;

  // Update at fixed timestep
  while (accumulator >= FIXED_DT) {
    game.update();
    accumulator -= FIXED_DT;
  }

  // Render current state
  Renderer.render(ctx, game.getState());

  requestAnimationFrame(gameLoop);
}

// Initialize sound on first click
canvas.addEventListener('click', () => soundEngine.init(), { once: true });

// Start game loop
requestAnimationFrame(gameLoop);
