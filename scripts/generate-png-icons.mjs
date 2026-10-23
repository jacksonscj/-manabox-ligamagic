import fs from 'node:fs';
import zlib from 'node:zlib';

function createPng(width, height, isMaskable = false) {
  // Generate RGBA buffer
  const stride = width * 4;
  const rawData = Buffer.alloc(height * (stride + 1));

  const pad = isMaskable ? Math.round(width * 0.15) : 0;
  const cx = width / 2;
  const cy = height / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawData[rowOffset] = 0; // Filter type 0: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Base background: dark indigo/slate gradient (#0f172a to #311042)
      const gradRatio = (x + y) / (width + height);
      let r = Math.round(15 + gradRatio * 34);
      let g = Math.round(23 - gradRatio * 7);
      let b = Math.round(42 + gradRatio * 24);
      let a = 255;

      // Distance from center
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Outer border circle/squircle
      const radius = width * 0.44;
      if (!isMaskable && dist > radius + 4) {
        // Outside rounded corners
        a = Math.max(0, 255 - Math.round((dist - (radius + 4)) * 30));
      }

      // Golden ring / shield
      if (Math.abs(dist - radius * 0.9) < width * 0.02) {
        r = 251; g = 191; b = 36; // Amber/Gold #fbbf24
      }

      // Left card representation (Cyan / ManaBox)
      if (x > width * 0.22 && x < width * 0.48 && y > height * 0.28 && y < height * 0.72) {
        r = 30; g = 41; b = 59; // Dark card frame
        if (Math.abs(x - width * 0.22) < 3 || Math.abs(x - width * 0.48) < 3 ||
            Math.abs(y - height * 0.28) < 3 || Math.abs(y - height * 0.72) < 3) {
          r = 56; g = 189; b = 248; // Light blue border
        }
      }

      // Right card representation (Gold / LigaMagic)
      if (x > width * 0.52 && x < width * 0.78 && y > height * 0.28 && y < height * 0.72) {
        r = 30; g = 27; b = 75; // Indigo card frame
        if (Math.abs(x - width * 0.52) < 4 || Math.abs(x - width * 0.78) < 4 ||
            Math.abs(y - height * 0.28) < 4 || Math.abs(y - height * 0.72) < 4) {
          r = 245; g = 158; b = 11; // Amber border
        }
      }

      // Arrow in center
      if (Math.abs(y - cy) < height * 0.03 && x >= width * 0.42 && x <= width * 0.58) {
        r = 251; g = 191; b = 36;
      }
      if (Math.abs((x - width * 0.55) - (y - cy)) < height * 0.02 && x >= width * 0.52 && x <= width * 0.58) {
        r = 251; g = 191; b = 36;
      }
      if (Math.abs((x - width * 0.55) + (y - cy)) < height * 0.02 && x >= width * 0.52 && x <= width * 0.58) {
        r = 251; g = 191; b = 36;
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Compress with zlib
  const compressed = zlib.deflateSync(rawData);

  // Build PNG chunks
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);

    // CRC32
    let c = 0xffffffff;
    for (let i = 4; i < 8 + len; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
      }
    }
    buf.writeUInt32BE((c ^ 0xffffffff) >>> 0, 8 + len);
    return buf;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

fs.writeFileSync('./public/pwa-192x192.png', createPng(192, 192, false));
fs.writeFileSync('./public/pwa-512x512.png', createPng(512, 512, false));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createPng(512, 512, true));
fs.writeFileSync('./public/apple-touch-icon.png', createPng(180, 180, false));
fs.writeFileSync('./public/favicon.ico', createPng(64, 64, false));

console.log('Successfully generated all PWA PNG icon assets in /public');
