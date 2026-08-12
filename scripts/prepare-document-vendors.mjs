import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const files = [
  ["node_modules/pdfjs-dist/build/pdf.min.mjs", "public/vendor/pdfjs/pdf.min.mjs"],
  ["node_modules/pdfjs-dist/build/pdf.worker.min.mjs", "public/vendor/pdfjs/pdf.worker.min.mjs"],
  ["node_modules/@fontpkg/unifont/unifont-15.0.01.ttf", "public/fonts/unifont.ttf"],
  ["node_modules/@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff", "public/fonts/noto-sans-devanagari.woff"],
];

for (const [source, destination] of files) {
  const output = join(process.cwd(), destination);
  await mkdir(dirname(output), { recursive: true });
  await copyFile(join(process.cwd(), source), output);
}

console.log("Prepared browser PDF decoding and Unicode document fonts.");
