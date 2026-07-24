export interface Point {
  x: number;
  y: number;
}

export interface CaptureQuality {
  glare: boolean;
  glarePercent: number;
  edgeConfidence: number;
  corrected: boolean;
  corners: [Point, Point, Point, Point] | null;
  warnings: string[];
}

type Pixels = { width: number; height: number; data: Uint8ClampedArray };

function quantile(values: number[], q: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
}

export function detectGlare(image: Pixels): { glare: boolean; percent: number } {
  const cells = new Uint32Array(12 * 12);
  const totals = new Uint32Array(12 * 12);
  let bright = 0;
  let sampled = 0;
  for (let y = 0; y < image.height; y += 2) {
    for (let x = 0; x < image.width; x += 2) {
      const index = (y * image.width + x) * 4;
      const r = image.data[index];
      const g = image.data[index + 1];
      const b = image.data[index + 2];
      const cell = Math.min(11, Math.floor(y * 12 / image.height)) * 12 +
        Math.min(11, Math.floor(x * 12 / image.width));
      totals[cell]++;
      sampled++;
      if (r >= 248 && g >= 248 && b >= 248 && Math.max(r, g, b) - Math.min(r, g, b) <= 4) {
        cells[cell]++;
        bright++;
      }
    }
  }
  const percent = sampled ? bright / sampled : 0;
  const concentrated = cells.some((count, index) => totals[index] > 0 && count / totals[index] > 0.32);
  return { glare: percent > 0.018 && concentrated, percent };
}

export function detectDocumentCorners(image: Pixels): {
  corners: [Point, Point, Point, Point] | null;
  confidence: number;
} {
  const { width, height, data } = image;
  if (width < 40 || height < 40) return { corners: null, confidence: 0 };
  const gray = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
  }
  const scored: Array<{ x: number; y: number; strength: number }> = [];
  const strengths: number[] = [];
  for (let y = 2; y < height - 2; y += 3) {
    for (let x = 2; x < width - 2; x += 3) {
      const p = y * width + x;
      const gx = -gray[p - width - 1] + gray[p - width + 1] -
        2 * gray[p - 1] + 2 * gray[p + 1] -
        gray[p + width - 1] + gray[p + width + 1];
      const gy = -gray[p - width - 1] - 2 * gray[p - width] - gray[p - width + 1] +
        gray[p + width - 1] + 2 * gray[p + width] + gray[p + width + 1];
      const strength = Math.abs(gx) + Math.abs(gy);
      strengths.push(strength);
      scored.push({ x, y, strength });
    }
  }
  const threshold = Math.max(70, quantile(strengths, 0.88));
  const edges = scored.filter((point) => point.strength >= threshold);
  if (edges.length < 24) return { corners: null, confidence: 0 };

  const bySum = [...edges].sort((a, b) => a.x + a.y - b.x - b.y);
  const byDiff = [...edges].sort((a, b) => a.x - a.y - (b.x - b.y));
  const take = Math.max(3, Math.floor(edges.length * 0.012));
  const average = (points: typeof edges): Point => ({
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  });
  const topLeft = average(bySum.slice(0, take));
  const bottomRight = average(bySum.slice(-take));
  const bottomLeft = average(byDiff.slice(0, take));
  const topRight = average(byDiff.slice(-take));
  const corners: [Point, Point, Point, Point] = [topLeft, topRight, bottomRight, bottomLeft];
  const area = Math.abs(
    corners.reduce((sum, point, index) => {
      const next = corners[(index + 1) % corners.length];
      return sum + point.x * next.y - next.x * point.y;
    }, 0) / 2
  );
  const coverage = area / (width * height);
  const edgeRatio = Math.min(1, edges.length / Math.max(80, scored.length * 0.18));
  // A clean page border is intentionally sparse, so coverage carries more
  // weight than raw edge density (dense printed text should not score higher
  // merely because it contributes many Sobel pixels).
  const confidence = Math.max(0, Math.min(1, coverage * 1.35)) * (0.78 + edgeRatio * 0.22);
  return { corners, confidence };
}

function solveLinear(matrix: number[][], values: number[]): number[] | null {
  const n = values.length;
  const a = matrix.map((row, index) => [...row, values[index]]);
  for (let column = 0; column < n; column++) {
    let pivot = column;
    for (let row = column + 1; row < n; row++) {
      if (Math.abs(a[row][column]) > Math.abs(a[pivot][column])) pivot = row;
    }
    if (Math.abs(a[pivot][column]) < 1e-9) return null;
    [a[column], a[pivot]] = [a[pivot], a[column]];
    const divisor = a[column][column];
    for (let c = column; c <= n; c++) a[column][c] /= divisor;
    for (let row = 0; row < n; row++) {
      if (row === column) continue;
      const factor = a[row][column];
      for (let c = column; c <= n; c++) a[row][c] -= factor * a[column][c];
    }
  }
  return a.map((row) => row[n]);
}

function homography(destination: [Point, Point, Point, Point], source: [Point, Point, Point, Point]) {
  const matrix: number[][] = [];
  const values: number[] = [];
  destination.forEach((point, index) => {
    const target = source[index];
    matrix.push([point.x, point.y, 1, 0, 0, 0, -target.x * point.x, -target.x * point.y]);
    values.push(target.x);
    matrix.push([0, 0, 0, point.x, point.y, 1, -target.y * point.x, -target.y * point.y]);
    values.push(target.y);
  });
  return solveLinear(matrix, values);
}

async function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not prepare corrected scan")), "image/jpeg", 0.92)
  );
}

async function perspectiveCorrect(
  source: Pixels,
  corners: [Point, Point, Point, Point]
): Promise<Blob | null> {
  const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
  let outputWidth = Math.round(Math.max(distance(corners[0], corners[1]), distance(corners[3], corners[2])));
  let outputHeight = Math.round(Math.max(distance(corners[0], corners[3]), distance(corners[1], corners[2])));
  const scale = Math.min(1, 1600 / Math.max(outputWidth, outputHeight));
  outputWidth = Math.max(320, Math.round(outputWidth * scale));
  outputHeight = Math.max(420, Math.round(outputHeight * scale));
  const destination: [Point, Point, Point, Point] = [
    { x: 0, y: 0 },
    { x: outputWidth - 1, y: 0 },
    { x: outputWidth - 1, y: outputHeight - 1 },
    { x: 0, y: outputHeight - 1 },
  ];
  const h = homography(destination, corners);
  if (!h) return null;
  const output = new ImageData(outputWidth, outputHeight);
  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      const denominator = h[6] * x + h[7] * y + 1;
      const sx = Math.max(0, Math.min(source.width - 1, Math.round((h[0] * x + h[1] * y + h[2]) / denominator)));
      const sy = Math.max(0, Math.min(source.height - 1, Math.round((h[3] * x + h[4] * y + h[5]) / denominator)));
      const src = (sy * source.width + sx) * 4;
      const dest = (y * outputWidth + x) * 4;
      output.data[dest] = source.data[src];
      output.data[dest + 1] = source.data[src + 1];
      output.data[dest + 2] = source.data[src + 2];
      output.data[dest + 3] = 255;
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  canvas.getContext("2d")?.putImageData(output, 0, 0);
  return canvasBlob(canvas);
}

export async function enhanceDocumentPhoto(blob: Blob): Promise<{ blob: Blob; quality: CaptureQuality }> {
  const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
  const maxAnalysis = 1200;
  const scale = Math.min(1, maxAnalysis / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser cannot analyze camera images");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const glare = detectGlare(pixels);
  const edges = detectDocumentCorners(pixels);
  const warnings: string[] = [];
  if (glare.glare) warnings.push("Glare may hide printed values — retake without direct light.");
  if (edges.confidence < 0.48) warnings.push("Document edges were unclear — keep the whole page visible against a contrasting surface.");

  let corrected = false;
  let output = blob;
  if (edges.corners && edges.confidence >= 0.58) {
    const candidate = await perspectiveCorrect(pixels, edges.corners);
    if (candidate) {
      output = candidate;
      corrected = true;
    }
  }
  return {
    blob: output,
    quality: {
      glare: glare.glare,
      glarePercent: Math.round(glare.percent * 1000) / 10,
      edgeConfidence: Math.round(edges.confidence * 100),
      corrected,
      corners: edges.corners,
      warnings,
    },
  };
}
