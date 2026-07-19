// Builds public/og.png (1200×630) — navy brand card with the large logo and
// wordmark, used as the default Open Graph / Twitter image.
// Usage: node scripts/make-og.mjs   (requires public/logo.png to exist)

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const card = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0B1F3A"/>
  <rect x="0" y="614" width="1200" height="16" fill="#FF6B2C"/>
  <circle cx="300" cy="315" r="212" fill="#FFFFFF"/>
  <text x="570" y="270" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="bold" fill="#FFFFFF">GainingDocx</text>
  <text x="572" y="340" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#C8D2DF">AI shipping document parser</text>
  <text x="572" y="384" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#C8D2DF">with deterministic validation</text>
  <text x="572" y="452" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#FF6B2C">B/L · Invoice · Packing List → Excel in seconds</text>
</svg>`;

const logo = await sharp(join(ROOT, "public", "logo.png"))
  .resize(400, 400)
  .toBuffer();

const png = await sharp(Buffer.from(card))
  .composite([{ input: logo, left: 100, top: 115 }])
  .png({ palette: true, quality: 90 })
  .toBuffer();

writeFileSync(join(ROOT, "public", "og.png"), png);
console.log(`wrote public/og.png (${png.length} bytes)`);
