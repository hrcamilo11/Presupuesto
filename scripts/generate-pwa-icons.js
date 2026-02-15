/**
 * Genera iconos PWA placeholder (192x192 y 512x512) en public/.
 * Ejecutar: node scripts/generate-pwa-icons.js
 * Requiere: npm install pngjs (o ejecutar con npx pngjs).
 */
const fs = require("fs");
const path = require("path");

// Color de fondo #0a0a0a (theme oscuro)
const R = 10, G = 10, B = 10, A = 255;

function createPng(size) {
  const total = size * size * 4;
  const buffer = Buffer.alloc(total);
  for (let i = 0; i < total; i += 4) {
    buffer[i] = R;
    buffer[i + 1] = G;
    buffer[i + 2] = B;
    buffer[i + 3] = A;
  }
  return encodePNG(size, size, buffer);
}

// Codificación PNG mínima (solo IDAT con filtro 0)
function encodePNG(width, height, data) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = createChunk("IHDR", Buffer.from([
    (width >> 24) & 255, (width >> 16) & 255, (width >> 8) & 255, width & 255,
    (height >> 24) & 255, (height >> 16) & 255, (height >> 8) & 255, height & 255,
    8, 6, 0, 0, 0
  ]));
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    data.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = createChunk("IDAT", require("zlib").deflateSync(raw, { level: 9 }));
  const iend = createChunk("IEND", Buffer.alloc(0));
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const chunk = Buffer.concat([Buffer.from(type), data]);
  const crc = crc32(chunk);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([len, chunk, crcBuf]);
}

function crc32(buf) {
  let c = -1;
  const table = (function () {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let k = i;
      for (let j = 0; j < 8; j++) k = (k & 1) ? (0xedb88320 ^ (k >>> 1)) : (k >>> 1);
      t[i] = k;
    }
    return t;
  })();
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return c ^ -1;
}

const publicDir = path.join(__dirname, "..", "public");
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, "icon-192x192.png"), createPng(192));
fs.writeFileSync(path.join(publicDir, "icon-512x512.png"), createPng(512));
console.log("Iconos PWA generados: public/icon-192x192.png, public/icon-512x512.png");
