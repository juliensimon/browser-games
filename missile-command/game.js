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

// City sprites (16×6 px each) - authentic low-profile buildings
const CITY_1 = [
  "                ",
  "                ",
  "                ",
  "                ",
  "  X    XX    X  ",
  " XXXXXXXXXXXXXX "
];

const CITY_2 = [
  "                ",
  "                ",
  "                ",
  "                ",
  " XX  XXXXXX  XX ",
  "XXXXXXXXXXXXXXXX"
];

const CITY_3 = [
  "                ",
  "                ",
  "                ",
  "                ",
  "X XX XX XX XX XX",
  "XXXXXXXXXXXXXXXX"
];

const CITY_4 = [
  "                ",
  "                ",
  "                ",
  "                ",
  " XXXX  XX  XXXX ",
  "XXXXXXXXXXXXXXXX"
];

const CITY_5 = [
  "                ",
  "                ",
  "                ",
  "                ",
  "  XXX XXXX XXX  ",
  " XXXXXXXXXXXXXX "
];

const CITY_6 = [
  "                ",
  "                ",
  "                ",
  "                ",
  " X XXXXXXXXXX X ",
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

const BOMBER = [
  "        ",
  " XXXXXX ",
  "XX XX XX",
  "        "
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

// 10 color schemes using authentic 3-bit RGB palette
const COLOR_SCHEMES = [
  // Scheme 0: Classic white/cyan
  {
    bg: '#000',
    ground: '#0ff',
    city: '#0ff',
    silo: '#0ff',
    abmTrail: '#fff',
    icbmTrail: '#f00',
    crosshair: '#fff',
    expColors: ['#fff', '#ff0', '#f00', '#f0f'],
    text: '#0ff',
    scoreText: '#fff'
  },
  // Scheme 1: Yellow theme
  {
    bg: '#000',
    ground: '#ff0',
    city: '#ff0',
    silo: '#ff0',
    abmTrail: '#fff',
    icbmTrail: '#f00',
    crosshair: '#fff',
    expColors: ['#fff', '#ff0', '#f00', '#f0f'],
    text: '#ff0',
    scoreText: '#fff'
  },
  // Scheme 2: Green theme
  {
    bg: '#000',
    ground: '#0f0',
    city: '#0f0',
    silo: '#0f0',
    abmTrail: '#fff',
    icbmTrail: '#f00',
    crosshair: '#fff',
    expColors: ['#fff', '#0ff', '#0f0', '#ff0'],
    text: '#0f0',
    scoreText: '#fff'
  },
  // Scheme 3: Magenta theme
  {
    bg: '#000',
    ground: '#f0f',
    city: '#f0f',
    silo: '#f0f',
    abmTrail: '#fff',
    icbmTrail: '#f00',
    crosshair: '#fff',
    expColors: ['#fff', '#f0f', '#f00', '#ff0'],
    text: '#f0f',
    scoreText: '#fff'
  },
  // Scheme 4: Red theme
  {
    bg: '#000',
    ground: '#f00',
    city: '#f00',
    silo: '#f00',
    abmTrail: '#fff',
    icbmTrail: '#ff0',
    crosshair: '#fff',
    expColors: ['#fff', '#ff0', '#f00', '#f0f'],
    text: '#f00',
    scoreText: '#fff'
  },
  // Scheme 5: White theme
  {
    bg: '#000',
    ground: '#fff',
    city: '#fff',
    silo: '#fff',
    abmTrail: '#0ff',
    icbmTrail: '#f00',
    crosshair: '#0ff',
    expColors: ['#fff', '#0ff', '#00f', '#f0f'],
    text: '#fff',
    scoreText: '#0ff'
  },
  // Scheme 6: Blue theme
  {
    bg: '#000',
    ground: '#00f',
    city: '#00f',
    silo: '#00f',
    abmTrail: '#fff',
    icbmTrail: '#f00',
    crosshair: '#fff',
    expColors: ['#fff', '#0ff', '#00f', '#f0f'],
    text: '#00f',
    scoreText: '#fff'
  },
  // Scheme 7: Cyan/Magenta
  {
    bg: '#000',
    ground: '#0ff',
    city: '#f0f',
    silo: '#0ff',
    abmTrail: '#fff',
    icbmTrail: '#f00',
    crosshair: '#fff',
    expColors: ['#fff', '#0ff', '#f0f', '#ff0'],
    text: '#0ff',
    scoreText: '#f0f'
  },
  // Scheme 8: Yellow/Green
  {
    bg: '#000',
    ground: '#ff0',
    city: '#0f0',
    silo: '#ff0',
    abmTrail: '#fff',
    icbmTrail: '#f00',
    crosshair: '#fff',
    expColors: ['#fff', '#ff0', '#0f0', '#0ff'],
    text: '#ff0',
    scoreText: '#0f0'
  },
  // Scheme 9: Red/Yellow
  {
    bg: '#000',
    ground: '#f00',
    city: '#ff0',
    silo: '#f00',
    abmTrail: '#fff',
    icbmTrail: '#0ff',
    crosshair: '#fff',
    expColors: ['#fff', '#ff0', '#f00', '#f0f'],
    text: '#f00',
    scoreText: '#ff0'
  }
];

const SPRITES = {
  CITY_1, CITY_2, CITY_3, CITY_4, CITY_5, CITY_6,
  CITY_RUBBLE,
  SILO,
  BOMBER,
  SATELLITE,
  FONT,
  COLOR_SCHEMES
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

        if (this.trail.length > CONFIG.ABM_TRAIL_MAX) {
            this.trail.shift();
        }

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

        if (this.trail.length > 40) {
            this.trail.shift();
        }

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

        if (this.trail.length > 40) {
            this.trail.shift();
        }

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
        this.colorFrame = 0;
    }

    update() {
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

        this.colorFrame = (this.colorFrame + 1) % 4;
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
        return this.colorFrame;
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
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

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
      if (!icbm.active) continue;

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
      if (!icbm.active) continue;

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
      if (!bomb.active) continue;

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
      if (!bomb.active) continue;

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
    const cs = state.colorScheme;

    // Clear screen
    ctx.fillStyle = cs.bg;
    ctx.fillRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT);

    // Draw ground
    ctx.fillStyle = cs.ground;
    ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.LOGICAL_WIDTH, CONFIG.GROUND_HEIGHT);

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
   * Render attract screen
   */
  renderAttractScreen(ctx, cs, state) {
    this.drawCenteredText(ctx, 'MISSILE COMMAND', 60, cs.text);

    this.drawCenteredText(ctx, 'MOUSE = AIM', 100, cs.text);
    this.drawCenteredText(ctx, '1 2 3 = FIRE SILOS', 110, cs.text);

    this.drawCenteredText(ctx, 'PRESS ENTER TO START', 140, cs.text);

    // Show high score
    if (state.highScore > 0) {
      this.drawCenteredText(ctx, `HIGH SCORE ${state.highScore}`, 180, cs.scoreText);
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
        this.drawSprite(ctx, sprite, city.x - 8, city.y - 3, cs.city);
      } else {
        // Draw rubble for destroyed cities
        this.drawSprite(ctx, SPRITES.CITY_RUBBLE, city.x - 8, city.y - 3, cs.city);
      }
    }

    // Draw silos
    for (const silo of state.silos) {
      if (!silo.destroyed) {
        this.drawSprite(ctx, SPRITES.SILO, silo.x - 8, silo.y - 8, cs.silo);

        // Draw missile count
        if (silo.missiles > 0) {
          const countStr = String(silo.missiles);
          this.drawText(ctx, countStr, silo.x - 2, silo.y + 2, cs.text);
        }
      } else {
        // Draw destroyed silo
        this.drawSprite(ctx, SPRITES.SILO_RUBBLE, silo.x - 8, silo.y - 4, cs.silo);
      }
    }

    // Draw ABM trails
    ctx.strokeStyle = cs.abmTrail;
    ctx.lineWidth = 1;
    for (const abm of state.abms) {
      if (abm.trail.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(abm.trail[0].x, abm.trail[0].y);
      for (let i = 1; i < abm.trail.length; i++) {
        ctx.lineTo(abm.trail[i].x, abm.trail[i].y);
      }
      ctx.stroke();
    }

    // Draw ICBM trails (includes smart bombs)
    ctx.strokeStyle = cs.icbmTrail;
    const allIcbms = [...state.icbms, ...state.smartBombs, ...state.enemyBombs];
    for (const icbm of allIcbms) {
      if (icbm.trail.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(icbm.trail[0].x, icbm.trail[0].y);
      for (let i = 1; i < icbm.trail.length; i++) {
        ctx.lineTo(icbm.trail[i].x, icbm.trail[i].y);
      }
      ctx.stroke();
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

    // Input state
    this.crosshairX = 128;
    this.crosshairY = 100;

    // Rendering
    this.colorScheme = COLOR_SCHEMES[0];

    // Timing
    this.frameCount = 0;
    this.stateTimer = 0;

    // Attack wave management
    this.attackSlots = [];  // Max CONFIG.MAX_ICBM_SLOTS
    this.nextAttackTimer = 0;

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

    // Cycle color scheme every 2 waves
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

    // Set up first attack
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

    // Speed increases with wave
    const speed = CONFIG.ICBM_BASE_SPEED + this.wave * CONFIG.ICBM_SPEED_INCREMENT;

    // Create ICBM
    const icbm = new ICBM(startX, 0, target.x, target.y, speed);

    // 30% chance of MIRV on waves 3+
    if (this.wave >= 3 && Math.random() < CONFIG.MIRV_SPLIT_CHANCE) {
      icbm.isMIRV = true;
    }

    this.icbms.push(icbm);
    this.attackSlots.push(icbm);
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
   * Update attract screen
   */
  updateAttract() {
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
    const allAttacksFinished = this.attackSlots.length >= CONFIG.MAX_ICBM_SLOTS;
    const noActiveThreats = this.icbms.length === 0 &&
                           this.smartBombs.length === 0 &&
                           this.enemyBombs.length === 0;

    if (allAttacksFinished && noActiveThreats) {
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
      score: this.score,
      highScore: this.highScore,
      wave: this.wave,
      scoreMultiplier: this.scoreMultiplier,
      crosshairX: this.crosshairX,
      crosshairY: this.crosshairY,
      colorScheme: this.colorScheme,
      stateTimer: this.stateTimer,
      tallyMissilesLeft: this.tallyMissilesLeft,
      tallyCitiesLeft: this.tallyCitiesLeft,
      frameCount: this.frameCount
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
