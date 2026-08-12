import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import "regenerator-runtime/runtime";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { pdfFontRuns, shapePdfText } from "../lib/export/pdf-text";

async function main() {
  const root = process.cwd();
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontBytes = await readFile(join(root, "public", "fonts", "unifont.ttf"));
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const devanagariFont = await pdf.embedFont(await readFile(join(root, "public", "fonts", "noto-sans-devanagari.woff")), { subset: true });
  const page = pdf.addPage([595, 842]);
  page.drawText("Unicode shipping-document export verification", {
    x: 48, y: 770, size: 18, font, color: rgb(.08, .12, .18),
  });
  const lines = [
    { label: "Hindi", value: "निर्यात दस्तावेज़ - मुंबई से शंघाई", valueFont: font },
    { label: "Chinese", value: "出口单证 - 上海港", valueFont: font },
    { label: "Arabic", value: shapePdfText("مستندات الشحن - ميناء دبي"), valueFont: font },
    { label: "Latin", value: "B/L COKA04793 - 15,750 KGS - 20 CBM", valueFont: font },
  ];
  lines.forEach(({ label, value, valueFont }, index) => {
    const y = 720 - index * 42;
    page.drawText(`${label}:`, { x: 48, y, size: 14, font, color: rgb(.08, .12, .18) });
    let x = 145;
    for (const run of pdfFontRuns(value)) {
      const runFont = run.script === "devanagari" ? devanagariFont : valueFont;
      page.drawText(run.text, { x, y, size: 14, font: runFont, color: rgb(.08, .12, .18) });
      x += runFont.widthOfTextAtSize(run.text, 14);
    }
  });
  const outputDirectory = join(root, "tmp", "pdfs");
  await mkdir(outputDirectory, { recursive: true });
  const output = join(outputDirectory, "unicode-export-verification.pdf");
  await writeFile(output, await pdf.save());
  console.log(output);
}

void main();
