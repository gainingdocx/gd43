// Client-side preparation (BUILD_SPEC §1.5): preserve manageable source
// rasters and downscale oversized inputs to a 2400px long edge at JPEG q88.
// Anonymous inline transfer has a separate, generous byte budget. We preserve
// the source byte-for-byte when it fits and only re-encode when transport
// requires it, trying high JPEG quality before reducing OCR-relevant pixels.

export const MAX_LONG_EDGE = 2400;
export const JPEG_QUALITY = 0.88;
export const INLINE_IMAGE_TARGET_BYTES = 6 * 1024 * 1024;
export const INLINE_IMAGE_HARD_BYTES = 7 * 1024 * 1024;
const INLINE_QUALITIES = [0.96, 0.93, 0.9, 0.86] as const;
const INLINE_SCALE_STEPS = [1, 0.9, 0.8, 0.7] as const;
const PASSTHROUGH_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function shouldPreserveRaster(type: string, width: number, height: number) {
  return Math.max(width, height) <= MAX_LONG_EDGE && PASSTHROUGH_TYPES.has(type);
}

export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const longEdge = Math.max(bitmap.width, bitmap.height);
    // Preserve manageable source pixels. Enlarging an existing raster cannot
    // recreate detail and materially reduced OCR accuracy in the B/L benchmark.
    if (shouldPreserveRaster(file.type, bitmap.width, bitmap.height)) return file;

    const scale = Math.min(1, MAX_LONG_EDGE / longEdge);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context unavailable");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) throw new Error("compression failed");
    return blob;
  } finally {
    bitmap.close();
  }
}

export function shouldOptimizeInlineBlob(bytes: number) {
  return bytes > INLINE_IMAGE_TARGET_BYTES;
}

function encodeCanvas(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  quality: number
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("image preparation failed"))),
      "image/jpeg",
      quality
    )
  );
}

/**
 * Prepare one anonymous page for inline transfer without needlessly damaging
 * OCR detail. Efficient source files are returned unchanged. Large PNG/WebP
 * or unusually dense JPEG files are re-encoded at the same useful dimensions
 * first; pixel reduction is a last resort.
 */
export async function prepareInlineImage(blob: Blob): Promise<Blob> {
  if (!shouldOptimizeInlineBlob(blob.size)) return blob;

  const bitmap = await createImageBitmap(blob);
  try {
    const sourceLongEdge = Math.max(bitmap.width, bitmap.height);
    const baseScale = Math.min(1, MAX_LONG_EDGE / sourceLongEdge);
    let smallest: Blob | null = null;

    for (const step of INLINE_SCALE_STEPS) {
      const width = Math.max(1, Math.round(bitmap.width * baseScale * step));
      const height = Math.max(1, Math.round(bitmap.height * baseScale * step));
      for (const quality of INLINE_QUALITIES) {
        const candidate = await encodeCanvas(bitmap, width, height, quality);
        if (!smallest || candidate.size < smallest.size) smallest = candidate;
        if (candidate.size <= INLINE_IMAGE_TARGET_BYTES) return candidate;
      }
    }

    if (smallest && smallest.size <= INLINE_IMAGE_HARD_BYTES) return smallest;
    throw new Error(
      "This page could not be prepared safely for transfer. Try a standard JPG or PDF, or sign in to upload it directly."
    );
  } finally {
    bitmap.close();
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
