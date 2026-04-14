/**
 * Run this once with Node.js to generate the heart PNG icons:
 *   node generate-icons.js
 *
 * Requires: npm install -g canvas  (or: npm install canvas in app/)
 *
 * Alternatively use any image editor to create:
 *   - heart-192.png  (192×192)
 *   - heart-512.png  (512×512)
 * in this public/ directory. A red heart on white background works great.
 */

const { createCanvas } = require('canvas');
const fs = require('fs');

function generateHeart(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx    = canvas.getContext('2d');

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Draw heart
  ctx.fillStyle = '#e53e3e';
  ctx.beginPath();
  const s = size * 0.75;
  const x = size / 2;
  const y = size / 2 + size * 0.05;
  ctx.moveTo(x, y - s * 0.2);
  ctx.bezierCurveTo(x, y - s * 0.5,  x - s * 0.5, y - s * 0.5, x - s * 0.5, y - s * 0.2);
  ctx.bezierCurveTo(x - s * 0.5, y + s * 0.1,  x, y + s * 0.4,  x, y + s * 0.4);
  ctx.bezierCurveTo(x, y + s * 0.4,  x + s * 0.5, y + s * 0.1,  x + s * 0.5, y - s * 0.2);
  ctx.bezierCurveTo(x + s * 0.5, y - s * 0.5,  x, y - s * 0.5, x, y - s * 0.2);
  ctx.fill();

  fs.writeFileSync(filename, canvas.toBuffer('image/png'));
  console.log(`Created ${filename}`);
}

generateHeart(192, 'heart-192.png');
generateHeart(512, 'heart-512.png');
