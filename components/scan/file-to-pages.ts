import { compressImage, JPEG_QUALITY, MAX_LONG_EDGE } from "./compress";

export const ACCEPTED_DOCUMENT_TYPES =
  ".pdf,.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff,.heic,.heif,application/pdf,image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/heic,image/heif";

export interface PageConversion {
  blobs: Blob[];
  truncated: boolean;
}

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

const HEIC_TYPES = new Set(["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"]);
const RASTER_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/bmp", "image/x-ms-bmp"]);

function extension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("page conversion failed"))),
      "image/jpeg",
      JPEG_QUALITY
    )
  );
}

async function pdfPages(file: File, maxPages: number): Promise<PageConversion> {
  const pdfjs = await import("pdfjs-dist/webpack.mjs");
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await loadingTask.promise;
  const output: Blob[] = [];
  try {
    const count = Math.min(pdf.numPages, maxPages);
    for (let index = 1; index <= count; index++) {
      const page = await pdf.getPage(index);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(2, MAX_LONG_EDGE / Math.max(base.width, base.height));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas 2d context unavailable");
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      output.push(await canvasBlob(canvas));
      page.cleanup();
    }
    return { blobs: output, truncated: pdf.numPages > maxPages };
  } finally {
    await loadingTask.destroy();
  }
}

async function tiffPages(file: File, maxPages: number): Promise<PageConversion> {
  const UTIF = await import("utif");
  const buffer = await file.arrayBuffer();
  const allDirectories = UTIF.decode(buffer);
  const directories = allDirectories.slice(0, maxPages);
  const output: Blob[] = [];
  for (const directory of directories) {
    UTIF.decodeImage(buffer, directory);
    const rgba = UTIF.toRGBA8(directory);
    const source = document.createElement("canvas");
    source.width = directory.width;
    source.height = directory.height;
    const sourceContext = source.getContext("2d");
    if (!sourceContext) throw new Error("canvas 2d context unavailable");
    sourceContext.putImageData(
      new ImageData(new Uint8ClampedArray(rgba), directory.width, directory.height),
      0,
      0
    );
    const scale = Math.min(1, MAX_LONG_EDGE / Math.max(directory.width, directory.height));
    if (scale === 1) {
      output.push(await canvasBlob(source));
    } else {
      const target = document.createElement("canvas");
      target.width = Math.round(directory.width * scale);
      target.height = Math.round(directory.height * scale);
      const targetContext = target.getContext("2d");
      if (!targetContext) throw new Error("canvas 2d context unavailable");
      targetContext.drawImage(source, 0, 0, target.width, target.height);
      output.push(await canvasBlob(target));
    }
  }
  return { blobs: output, truncated: allDirectories.length > maxPages };
}

async function heicPage(file: File): Promise<PageConversion> {
  const { heicTo } = await import("heic-to/csp");
  const converted = await heicTo({ blob: file, type: "image/jpeg", quality: JPEG_QUALITY });
  if (!(converted instanceof Blob)) throw new Error("HEIC conversion did not return an image");
  const image = new File([converted], `${file.name}.jpg`, { type: "image/jpeg" });
  return { blobs: [await compressImage(image)], truncated: false };
}

export async function fileToPageImages(file: File, maxPages: number): Promise<PageConversion> {
  const ext = extension(file);
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error(`${file.name}: file is larger than 25 MB. Compress it or split it into smaller documents.`);
  }
  if (file.type === "application/pdf" || ext === "pdf") return pdfPages(file, maxPages);
  if (file.type === "image/tiff" || file.type === "image/tif" || ext === "tif" || ext === "tiff") {
    return tiffPages(file, maxPages);
  }
  if (HEIC_TYPES.has(file.type) || ext === "heic" || ext === "heif") return heicPage(file);
  if (RASTER_TYPES.has(file.type) || ["jpg", "jpeg", "png", "webp", "bmp"].includes(ext)) {
    return { blobs: [await compressImage(file)], truncated: false };
  }
  if (["doc", "docx", "xls", "xlsx"].includes(ext)) {
    throw new Error(`${file.name}: save Office documents as PDF before uploading so tables and layout stay intact.`);
  }
  throw new Error(`${file.name}: unsupported format. Use PDF, JPG, PNG, WebP, BMP, TIFF, HEIC or HEIF.`);
}
