import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const files = [
  ["node_modules/pdfjs-dist/build/pdf.min.mjs", "public/vendor/pdfjs/pdf.min.mjs"],
  ["node_modules/pdfjs-dist/build/pdf.worker.min.mjs", "public/vendor/pdfjs/pdf.worker.min.mjs"],
];

for (const [source, destination] of files) {
  const output = join(process.cwd(), destination);
  await mkdir(dirname(output), { recursive: true });
  await copyFile(join(process.cwd(), source), output);
}

console.log("Prepared the browser-only PDF decoder.");
