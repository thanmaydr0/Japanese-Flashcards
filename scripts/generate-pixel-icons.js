/* global Buffer, __dirname */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Helper to write a PNG chunk
function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = zlib.crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Encode raw RGBA buffer into PNG
function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR: width(4), height(4), bitDepth=8(1), colorType=6(RGBA)(1), comp=0(1), filter=0(1), interlace=0(1)
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // 8-bit depth
  ihdrData[9] = 6;  // RGBA
  ihdrData[10] = 0; // Deflate
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // No interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT: Scanlines with filter byte 0
  const rowBytes = width * 4;
  const filteredData = Buffer.alloc(height * (rowBytes + 1));
  for (let y = 0; y < height; y++) {
    filteredData[y * (rowBytes + 1)] = 0; // No filter
    rgbaBuffer.copy(filteredData, y * (rowBytes + 1) + 1, y * rowBytes, (y + 1) * rowBytes);
  }
  const compressed = zlib.deflateSync(filteredData, { level: 9 });
  const idatChunk = createChunk('IDAT', compressed);

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Canvas simulation for drawing pixel art grid scaled to 1024x1024
class PixelCanvas {
  constructor(size = 1024, gridSize = 32) {
    this.size = size;
    this.gridSize = gridSize;
    this.pixelSize = Math.floor(size / gridSize);
    this.buffer = Buffer.alloc(size * size * 4);
    // Fill transparent by default
  }

  // Set pixel in grid coordinates (0 to gridSize-1)
  setGridPixel(gx, gy, r, g, b, a = 255) {
    if (gx < 0 || gx >= this.gridSize || gy < 0 || gy >= this.gridSize) return;
    const pxStart = gx * this.pixelSize;
    const pyStart = gy * this.pixelSize;
    for (let py = pyStart; py < pyStart + this.pixelSize; py++) {
      for (let px = pxStart; px < pxStart + this.pixelSize; px++) {
        const idx = (py * this.size + px) * 4;
        this.buffer[idx] = r;
        this.buffer[idx + 1] = g;
        this.buffer[idx + 2] = b;
        this.buffer[idx + 3] = a;
      }
    }
  }

  // Draw background with subtle rounded border and gradient
  drawBackground(topColor, bottomColor, borderColor) {
    for (let y = 0; y < this.size; y++) {
      const t = y / (this.size - 1);
      const r = Math.round(topColor[0] * (1 - t) + bottomColor[0] * t);
      const g = Math.round(topColor[1] * (1 - t) + bottomColor[1] * t);
      const b = Math.round(topColor[2] * (1 - t) + bottomColor[2] * t);

      for (let x = 0; x < this.size; x++) {
        // App icon rounded corner mask (squircle style)
        const cornerR = 210;
        let inBounds = true;

        // Corner checks
        if (x < cornerR && y < cornerR) {
          const dx = cornerR - x;
          const dy = cornerR - y;
          if (dx * dx + dy * dy > cornerR * cornerR) inBounds = false;
        } else if (x >= this.size - cornerR && y < cornerR) {
          const dx = x - (this.size - cornerR);
          const dy = cornerR - y;
          if (dx * dx + dy * dy > cornerR * cornerR) inBounds = false;
        } else if (x < cornerR && y >= this.size - cornerR) {
          const dx = cornerR - x;
          const dy = y - (this.size - cornerR);
          if (dx * dx + dy * dy > cornerR * cornerR) inBounds = false;
        } else if (x >= this.size - cornerR && y >= this.size - cornerR) {
          const dx = x - (this.size - cornerR);
          const dy = y - (this.size - cornerR);
          if (dx * dx + dy * dy > cornerR * cornerR) inBounds = false;
        }

        const idx = (y * this.size + x) * 4;
        if (!inBounds) {
          this.buffer[idx] = 0;
          this.buffer[idx + 1] = 0;
          this.buffer[idx + 2] = 0;
          this.buffer[idx + 3] = 0;
        } else {
          // Border highlight
          const isBorder = x < 12 || x >= this.size - 12 || y < 12 || y >= this.size - 12;
          if (isBorder && borderColor) {
            this.buffer[idx] = borderColor[0];
            this.buffer[idx + 1] = borderColor[1];
            this.buffer[idx + 2] = borderColor[2];
            this.buffer[idx + 3] = 255;
          } else {
            this.buffer[idx] = r;
            this.buffer[idx + 1] = g;
            this.buffer[idx + 2] = b;
            this.buffer[idx + 3] = 255;
          }
        }
      }
    }
  }

  // Draw pixel matrix from 2D ASCII art map
  drawAsciiArt(art, colorMap, offsetX = 0, offsetY = 0) {
    for (let y = 0; y < art.length; y++) {
      const row = art[y];
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        if (char !== ' ' && char !== '.' && colorMap[char]) {
          const [r, g, b, a] = colorMap[char];
          this.setGridPixel(x + offsetX, y + offsetY, r, g, b, a !== undefined ? a : 255);
        }
      }
    }
  }

  toPNG() {
    return encodePNG(this.size, this.size, this.buffer);
  }
}

// Master Color Palette for Kitsune Mascot
const C = {
  // Fox Fur
  FOX_DARK: [194, 65, 12],     // #C2410C Deep russet orange shadow
  FOX_MAIN: [249, 115, 22],    // #F97316 Warm vibrant orange
  FOX_LIGHT: [251, 146, 60],   // #FB923C Cheerful golden orange
  FOX_HIGHLIGHT: [253, 186, 116], // #FDBA74 Peach highlight

  // Snout & Belly Fluff
  WHITE: [255, 255, 255],
  WHITE_SHADOW: [226, 232, 240], // Soft cool shadow
  CREAM: [254, 243, 199],

  // Eyes, Nose, Details
  BLACK: [15, 23, 42],        // Ink black
  NOSE: [30, 41, 59],
  CHEEK_BLUSH: [244, 63, 94], // Cheerful anime rosy cheeks
  EAR_INNER: [254, 205, 211], // Soft sakura pink

  // Special Accents
  GOLD: [245, 158, 11],
  GOLD_BRIGHT: [252, 211, 77],
  RED: [225, 29, 72],
  RED_DARK: [159, 18, 57],
  BLUE_NIGHT: [30, 58, 138],
  BLUE_CAP: [59, 130, 246],
  TEAR_BLUE: [56, 189, 248],
  FIRE_RED: [239, 68, 68],
  FIRE_ORANGE: [249, 115, 22],
  FIRE_YELLOW: [253, 224, 71],
};

// 32x26 Kitsune Character Base Template
// Characters:
// 'D' = FOX_DARK, 'O' = FOX_MAIN, 'L' = FOX_LIGHT, 'H' = FOX_HIGHLIGHT
// 'W' = WHITE, 'S' = WHITE_SHADOW, 'B' = BLACK, 'N' = NOSE
// 'P' = EAR_INNER, 'C' = CHEEK_BLUSH
const BASE_FOX = [
  "   DD             DD   ", // 0  Ear tips
  "  DODD           DODD  ", // 1
  "  DOOPD         DOOPD  ", // 2
  "  DOOPPD       DOOPPD  ", // 3
  "  DOOPPPD     DOOPPPD  ", // 4  Ear fluffs
  "  DOOOPPPD   DOOOPPPD  ", // 5
  "  DOOOOOODDDDOOOOOODD  ", // 6  Head top
  " DDOOOOOOOOOOOOOOOOOOD ", // 7
  " DDOOLLLLOOOOLLLLOOOOD ", // 8  Forehead
  " DOLLLLLLLLLLLLLLLLLLOD", // 9
  " DOLLLLLLLLLLLLLLLLLLOD", // 10
  " DOLLBBLLLLLLLLBBLLLLOD", // 11 Eyes line
  " DOLLBBLLLLLLLLBBLLLLOD", // 12
  " DOLLLLLLNNLLLLLLLLLLOD", // 13 Nose line
  "  DDCWWSNNSSWWCLLLLOD  ", // 14 Cheeks & Muzzle
  "  DWWWWWNNWWWWWWLLOD   ", // 15
  "   DWWWWWWWWWWWWLOD    ", // 16 Mouth line
  "   SDWWWWWWWWWWLOD     ", // 17 Chin
  "    SDDWWWWWWDDDD      ", // 18 Neck
  "     DOOOOOOOOOOD      ", // 19 Shoulders
  "    DOOLLLLLLLLLOOD    ", // 20 Chest
  "   DOOLLWWWWWWLLLOOD   ", // 21 Belly
  "   DOOLLWWWWWWLLLOOD   ", // 22
  "   DDOLLWWWWWWLLLOOD   ", // 23
  "    DDOOOOOOOOOOOD     ", // 24 Paws base
  "      DDDDDDDDDD       ", // 25
];

// Generate 1: Default / Morning (Happy, cheerful, cherry blossom badge)
function generateDefaultIcon() {
  const canvas = new PixelCanvas(1024, 32);
  // Elegant jade forest gradient background
  canvas.drawBackground([13, 82, 71], [7, 43, 37], [22, 110, 96]);

  const map = {
    'D': C.FOX_DARK,
    'O': C.FOX_MAIN,
    'L': C.FOX_LIGHT,
    'H': C.FOX_HIGHLIGHT,
    'W': C.WHITE,
    'S': C.WHITE_SHADOW,
    'B': C.BLACK,
    'N': C.NOSE,
    'P': C.EAR_INNER,
    'C': C.CHEEK_BLUSH,
  };

  // Draw Kitsune centered (offset x=4, y=3)
  canvas.drawAsciiArt(BASE_FOX, map, 4, 4);

  // Add happy sparkly eye highlights
  canvas.setGridPixel(9, 15, ...C.WHITE);
  canvas.setGridPixel(19, 15, ...C.WHITE);

  // Cute smile curve
  canvas.setGridPixel(15, 20, ...C.NOSE);
  canvas.setGridPixel(16, 20, ...C.NOSE);

  // Japanese Cherry blossom petals floating
  canvas.setGridPixel(4, 7, ...C.EAR_INNER);
  canvas.setGridPixel(5, 6, ...C.CHEEK_BLUSH);
  canvas.setGridPixel(26, 8, ...C.EAR_INNER);
  canvas.setGridPixel(27, 9, ...C.CHEEK_BLUSH);
  canvas.setGridPixel(6, 26, ...C.EAR_INNER);
  canvas.setGridPixel(25, 24, ...C.CHEEK_BLUSH);

  // Mini calligraphy scroll / kana 'あ' seal in corner
  canvas.setGridPixel(24, 26, ...C.GOLD);
  canvas.setGridPixel(25, 26, ...C.GOLD);
  canvas.setGridPixel(26, 26, ...C.GOLD);
  canvas.setGridPixel(24, 27, ...C.GOLD);
  canvas.setGridPixel(25, 27, ...C.RED);
  canvas.setGridPixel(26, 27, ...C.GOLD);
  canvas.setGridPixel(24, 28, ...C.GOLD);
  canvas.setGridPixel(25, 28, ...C.GOLD);
  canvas.setGridPixel(26, 28, ...C.GOLD);

  return canvas.toPNG();
}

// Generate 2: Afternoon (Focus, red & white Hachimaki headband with rising sun)
function generateAfternoonIcon() {
  const canvas = new PixelCanvas(1024, 32);
  // Energetic golden amber backdrop
  canvas.drawBackground([180, 83, 9], [120, 53, 15], [217, 119, 6]);

  const map = {
    'D': C.FOX_DARK,
    'O': C.FOX_MAIN,
    'L': C.FOX_LIGHT,
    'H': C.FOX_HIGHLIGHT,
    'W': C.WHITE,
    'S': C.WHITE_SHADOW,
    'B': C.BLACK,
    'N': C.NOSE,
    'P': C.EAR_INNER,
    'C': C.CHEEK_BLUSH,
  };

  canvas.drawAsciiArt(BASE_FOX, map, 4, 4);

  // Add Hachimaki Headband across forehead (rows 12-14 in canvas)
  for (let x = 6; x <= 25; x++) {
    canvas.setGridPixel(x, 12, ...C.WHITE);
    canvas.setGridPixel(x, 13, ...C.WHITE);
  }
  // Red rising sun in center of headband
  canvas.setGridPixel(15, 12, ...C.RED);
  canvas.setGridPixel(16, 12, ...C.RED);
  canvas.setGridPixel(15, 13, ...C.RED);
  canvas.setGridPixel(16, 13, ...C.RED);

  // Headband tie trailing off side
  canvas.setGridPixel(4, 12, ...C.WHITE);
  canvas.setGridPixel(3, 13, ...C.WHITE);
  canvas.setGridPixel(2, 14, ...C.WHITE);
  canvas.setGridPixel(3, 15, ...C.WHITE);

  // Sharp determined eyes with fierce focus glint
  canvas.setGridPixel(10, 16, ...C.WHITE);
  canvas.setGridPixel(20, 16, ...C.WHITE);

  return canvas.toPNG();
}

// Generate 3: Evening (Pleading "Save our streak!", anime tear eyes, twilight violet)
function generateEveningIcon() {
  const canvas = new PixelCanvas(1024, 32);
  // Twilight dusk violet-indigo sky
  canvas.drawBackground([49, 46, 129], [30, 27, 75], [67, 56, 202]);

  const map = {
    'D': C.FOX_DARK,
    'O': C.FOX_MAIN,
    'L': C.FOX_LIGHT,
    'H': C.FOX_HIGHLIGHT,
    'W': C.WHITE,
    'S': C.WHITE_SHADOW,
    'B': C.BLACK,
    'N': C.NOSE,
    'P': C.EAR_INNER,
    'C': C.CHEEK_BLUSH,
  };

  canvas.drawAsciiArt(BASE_FOX, map, 4, 4);

  // Pleading huge shiny anime eyes (rows 15-17)
  canvas.setGridPixel(9, 15, ...C.BLACK);
  canvas.setGridPixel(10, 15, ...C.WHITE); // Big highlight
  canvas.setGridPixel(9, 16, ...C.TEAR_BLUE);
  canvas.setGridPixel(10, 16, ...C.BLACK);

  canvas.setGridPixel(20, 15, ...C.WHITE); // Big highlight
  canvas.setGridPixel(21, 15, ...C.BLACK);
  canvas.setGridPixel(20, 16, ...C.BLACK);
  canvas.setGridPixel(21, 16, ...C.TEAR_BLUE);

  // Giant anime pixel teardrops glistening on cheeks!
  canvas.setGridPixel(7, 18, ...C.TEAR_BLUE);
  canvas.setGridPixel(7, 19, ...C.WHITE);
  canvas.setGridPixel(8, 20, ...C.TEAR_BLUE);

  canvas.setGridPixel(23, 18, ...C.TEAR_BLUE);
  canvas.setGridPixel(23, 19, ...C.WHITE);
  canvas.setGridPixel(22, 20, ...C.TEAR_BLUE);

  // Quivering wavy mouth
  canvas.setGridPixel(14, 21, ...C.NOSE);
  canvas.setGridPixel(15, 22, ...C.NOSE);
  canvas.setGridPixel(16, 21, ...C.NOSE);
  canvas.setGridPixel(17, 22, ...C.NOSE);

  // Little glowing Japanese paper lantern in top corner
  canvas.setGridPixel(26, 4, ...C.RED);
  canvas.setGridPixel(27, 4, ...C.RED);
  canvas.setGridPixel(25, 5, ...C.RED);
  canvas.setGridPixel(26, 5, ...C.GOLD_BRIGHT);
  canvas.setGridPixel(27, 5, ...C.GOLD_BRIGHT);
  canvas.setGridPixel(28, 5, ...C.RED);
  canvas.setGridPixel(26, 6, ...C.RED);
  canvas.setGridPixel(27, 6, ...C.RED);

  return canvas.toPNG();
}

// Generate 4: Night (Sleepy nightcap, Zzz, moon and stars)
function generateNightIcon() {
  const canvas = new PixelCanvas(1024, 32);
  // Deep midnight navy sky
  canvas.drawBackground([15, 23, 42], [2, 6, 23], [30, 41, 59]);

  const map = {
    'D': C.FOX_DARK,
    'O': C.FOX_MAIN,
    'L': C.FOX_LIGHT,
    'H': C.FOX_HIGHLIGHT,
    'W': C.WHITE,
    'S': C.WHITE_SHADOW,
    'B': C.BLACK,
    'N': C.NOSE,
    'P': C.EAR_INNER,
    'C': C.CHEEK_BLUSH,
  };

  canvas.drawAsciiArt(BASE_FOX, map, 4, 4);

  // Sleeping happy closed crescent eyes (^_^)
  canvas.setGridPixel(9, 16, ...C.BLACK);
  canvas.setGridPixel(10, 15, ...C.BLACK);
  canvas.setGridPixel(11, 16, ...C.BLACK);

  canvas.setGridPixel(19, 16, ...C.BLACK);
  canvas.setGridPixel(20, 15, ...C.BLACK);
  canvas.setGridPixel(21, 16, ...C.BLACK);

  // Cute striped sleeping nightcap over left ear
  for (let x = 4; x <= 14; x++) {
    canvas.setGridPixel(x, 7, ...C.BLUE_CAP);
    canvas.setGridPixel(x, 8, ...C.WHITE);
  }
  for (let x = 4; x <= 10; x++) {
    canvas.setGridPixel(x, 5, ...C.BLUE_CAP);
    canvas.setGridPixel(x, 6, ...C.WHITE);
  }
  for (let x = 3; x <= 7; x++) {
    canvas.setGridPixel(x, 3, ...C.BLUE_CAP);
    canvas.setGridPixel(x, 4, ...C.WHITE);
  }
  // Pompom at tip of nightcap
  canvas.setGridPixel(2, 2, ...C.WHITE);
  canvas.setGridPixel(3, 2, ...C.WHITE);
  canvas.setGridPixel(2, 3, ...C.WHITE);

  // Floating 'Z Z z' pixel letters
  // Big 'Z'
  canvas.setGridPixel(24, 7, ...C.TEAR_BLUE);
  canvas.setGridPixel(25, 7, ...C.TEAR_BLUE);
  canvas.setGridPixel(26, 7, ...C.TEAR_BLUE);
  canvas.setGridPixel(25, 8, ...C.TEAR_BLUE);
  canvas.setGridPixel(24, 9, ...C.TEAR_BLUE);
  canvas.setGridPixel(25, 9, ...C.TEAR_BLUE);
  canvas.setGridPixel(26, 9, ...C.TEAR_BLUE);

  // Medium 'z'
  canvas.setGridPixel(22, 11, ...C.TEAR_BLUE);
  canvas.setGridPixel(23, 11, ...C.TEAR_BLUE);
  canvas.setGridPixel(23, 12, ...C.TEAR_BLUE);
  canvas.setGridPixel(22, 13, ...C.TEAR_BLUE);
  canvas.setGridPixel(23, 13, ...C.TEAR_BLUE);

  // Little gold crescent moon in top corner
  canvas.setGridPixel(27, 2, ...C.GOLD_BRIGHT);
  canvas.setGridPixel(28, 2, ...C.GOLD_BRIGHT);
  canvas.setGridPixel(26, 3, ...C.GOLD_BRIGHT);
  canvas.setGridPixel(26, 4, ...C.GOLD_BRIGHT);
  canvas.setGridPixel(27, 5, ...C.GOLD_BRIGHT);
  canvas.setGridPixel(28, 5, ...C.GOLD_BRIGHT);

  return canvas.toPNG();
}

// Generate 5: Streak (On Fire! Red/orange/yellow flame aura)
function generateStreakIcon() {
  const canvas = new PixelCanvas(1024, 32);
  // Intense fiery ember dark background
  canvas.drawBackground([24, 8, 4], [8, 2, 1], [185, 28, 28]);

  const map = {
    'D': C.FOX_DARK,
    'O': C.FOX_MAIN,
    'L': C.FOX_LIGHT,
    'H': C.FOX_HIGHLIGHT,
    'W': C.WHITE,
    'S': C.WHITE_SHADOW,
    'B': C.BLACK,
    'N': C.NOSE,
    'P': C.EAR_INNER,
    'C': C.CHEEK_BLUSH,
  };

  // Outer Flame Aura around the canvas
  const flamePoints = [
    // Left flames
    [2, 6, C.FIRE_RED], [3, 5, C.FIRE_ORANGE], [3, 4, C.FIRE_YELLOW],
    [1, 10, C.FIRE_RED], [2, 9, C.FIRE_ORANGE], [2, 8, C.FIRE_YELLOW],
    [2, 15, C.FIRE_RED], [3, 14, C.FIRE_ORANGE],
    [1, 20, C.FIRE_RED], [2, 19, C.FIRE_ORANGE], [2, 18, C.FIRE_YELLOW],
    // Right flames
    [29, 6, C.FIRE_RED], [28, 5, C.FIRE_ORANGE], [28, 4, C.FIRE_YELLOW],
    [30, 10, C.FIRE_RED], [29, 9, C.FIRE_ORANGE], [29, 8, C.FIRE_YELLOW],
    [29, 15, C.FIRE_RED], [28, 14, C.FIRE_ORANGE],
    [30, 20, C.FIRE_RED], [29, 19, C.FIRE_ORANGE], [29, 18, C.FIRE_YELLOW],
    // Top crowns of fire
    [15, 1, C.FIRE_YELLOW], [16, 1, C.FIRE_YELLOW],
    [14, 2, C.FIRE_ORANGE], [15, 2, C.FIRE_YELLOW], [16, 2, C.FIRE_YELLOW], [17, 2, C.FIRE_ORANGE],
    [13, 3, C.FIRE_RED], [14, 3, C.FIRE_ORANGE], [17, 3, C.FIRE_ORANGE], [18, 3, C.FIRE_RED],
  ];

  for (const [fx, fy, col] of flamePoints) {
    canvas.setGridPixel(fx, fy, ...col);
  }

  // Draw Kitsune
  canvas.drawAsciiArt(BASE_FOX, map, 4, 4);

  // Fierce fiery grin
  canvas.setGridPixel(14, 20, ...C.BLACK);
  canvas.setGridPixel(15, 21, ...C.WHITE);
  canvas.setGridPixel(16, 21, ...C.WHITE);
  canvas.setGridPixel(17, 20, ...C.BLACK);

  // Burning fire eyes
  canvas.setGridPixel(10, 15, ...C.FIRE_YELLOW);
  canvas.setGridPixel(9, 16, ...C.FIRE_ORANGE);
  canvas.setGridPixel(10, 16, ...C.FIRE_YELLOW);

  canvas.setGridPixel(20, 15, ...C.FIRE_YELLOW);
  canvas.setGridPixel(21, 16, ...C.FIRE_ORANGE);
  canvas.setGridPixel(20, 16, ...C.FIRE_YELLOW);

  return canvas.toPNG();
}

// Generate 6: Legendary (Golden Master, Crown & Cool Pixel Sunglasses)
function generateLegendaryIcon() {
  const canvas = new PixelCanvas(1024, 32);
  // Opulent royal lacquer with gold glow
  canvas.drawBackground([20, 14, 2], [10, 7, 1], [217, 119, 6]);

  const map = {
    'D': C.FOX_DARK,
    'O': C.FOX_MAIN,
    'L': C.FOX_LIGHT,
    'H': C.FOX_HIGHLIGHT,
    'W': C.WHITE,
    'S': C.WHITE_SHADOW,
    'B': C.BLACK,
    'N': C.NOSE,
    'P': C.EAR_INNER,
    'C': C.CHEEK_BLUSH,
  };

  canvas.drawAsciiArt(BASE_FOX, map, 4, 4);

  // Royal Golden Crown perched between ears (rows 4-8)
  const crownPixels = [
    // Spikes
    [11, 4, C.GOLD_BRIGHT], [15, 3, C.GOLD_BRIGHT], [16, 3, C.GOLD_BRIGHT], [20, 4, C.GOLD_BRIGHT],
    [11, 5, C.GOLD], [12, 5, C.GOLD], [15, 4, C.RED], [16, 4, C.RED], [19, 5, C.GOLD], [20, 5, C.GOLD],
    // Crown body
    [11, 6, C.GOLD], [12, 6, C.GOLD], [13, 6, C.GOLD], [14, 6, C.GOLD], [15, 6, C.GOLD], [16, 6, C.GOLD], [17, 6, C.GOLD], [18, 6, C.GOLD], [19, 6, C.GOLD], [20, 6, C.GOLD],
    [12, 7, C.GOLD], [13, 7, C.GOLD], [14, 7, C.RED], [15, 7, C.GOLD_BRIGHT], [16, 7, C.GOLD_BRIGHT], [17, 7, C.RED], [18, 7, C.GOLD], [19, 7, C.GOLD],
  ];
  for (const [cx, cy, col] of crownPixels) {
    canvas.setGridPixel(cx, cy, ...col);
  }

  // 8-Bit "Deal With It" Retro Sunglasses over eyes (rows 15-17)
  for (let x = 7; x <= 23; x++) {
    // Bridge & rims
    canvas.setGridPixel(x, 15, ...C.BLACK);
  }
  // Left lens
  for (let x = 8; x <= 13; x++) {
    canvas.setGridPixel(x, 16, ...C.BLACK);
    canvas.setGridPixel(x, 17, ...C.BLACK);
  }
  // Right lens
  for (let x = 17; x <= 22; x++) {
    canvas.setGridPixel(x, 16, ...C.BLACK);
    canvas.setGridPixel(x, 17, ...C.BLACK);
  }
  // White 8-bit glare lines on sunglasses
  canvas.setGridPixel(9, 16, ...C.WHITE);
  canvas.setGridPixel(10, 16, ...C.WHITE);
  canvas.setGridPixel(18, 16, ...C.WHITE);
  canvas.setGridPixel(19, 16, ...C.WHITE);

  // Sparkles & Gold stars
  const sparkles = [
    [4, 8, C.GOLD_BRIGHT], [3, 9, C.GOLD_BRIGHT], [5, 9, C.GOLD_BRIGHT], [4, 10, C.GOLD_BRIGHT],
    [26, 10, C.GOLD_BRIGHT], [27, 9, C.GOLD_BRIGHT], [27, 11, C.GOLD_BRIGHT], [28, 10, C.GOLD_BRIGHT],
    [6, 23, C.GOLD_BRIGHT], [25, 23, C.GOLD_BRIGHT],
  ];
  for (const [sx, sy, col] of sparkles) {
    canvas.setGridPixel(sx, sy, ...col);
  }

  return canvas.toPNG();
}

function main() {
  const assetsDir = path.join(__dirname, '..', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  console.log('Generating pixel art mascot app icons...');

  const icons = [
    { name: 'kana-path-icon.png', buffer: generateDefaultIcon(), desc: 'Default / Morning Cheerful Kitsune' },
    { name: 'kana-path-afternoon-icon.png', buffer: generateAfternoonIcon(), desc: 'Afternoon Hachimaki Headband Kitsune' },
    { name: 'kana-path-evening-icon.png', buffer: generateEveningIcon(), desc: 'Evening Pleading Teary Eyes Kitsune' },
    { name: 'kana-path-night-icon.png', buffer: generateNightIcon(), desc: 'Night Sleepy Nightcap Kitsune' },
    { name: 'kana-path-streak-icon.png', buffer: generateStreakIcon(), desc: 'Streak Fiery Aura Kitsune' },
    { name: 'kana-path-legendary-icon.png', buffer: generateLegendaryIcon(), desc: 'Legendary Crown & Sunglasses Kitsune' },
  ];

  for (const icon of icons) {
    const filePath = path.join(assetsDir, icon.name);
    fs.writeFileSync(filePath, icon.buffer);
    console.log(`✓ Wrote ${icon.name} (${icon.buffer.length} bytes) - ${icon.desc}`);
  }

  // Also update icon.png and splash-icon.png to match
  fs.writeFileSync(path.join(assetsDir, 'icon.png'), icons[0].buffer);
  fs.writeFileSync(path.join(assetsDir, 'android-icon-foreground.png'), icons[0].buffer);
  console.log('✓ Updated icon.png and android-icon-foreground.png with new pixel art mascot');

  console.log('All pixel art mascot icons generated successfully!');
}

main();
