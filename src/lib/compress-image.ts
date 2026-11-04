export type CompressOptions = {
  /** Longest side of the saved image, in pixels. */
  maxSide: number;
  /** Size to aim for, in bytes. */
  targetBytes: number;
};

export const LISTING_PHOTO: CompressOptions = { maxSide: 1920, targetBytes: 400 * 1024 };
export const PROFILE_PHOTO: CompressOptions = { maxSide: 512, targetBytes: 100 * 1024 };

/** Largest original a person can pick. It is shrunk before upload. */
export const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;

const QUALITIES = [0.82, 0.72, 0.62, 0.5, 0.4];

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Falls through to the image element below.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

function draw(source: ImageBitmap | HTMLImageElement, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image compression is not available in this browser");
  // JPEG has no transparency, so see-through areas become white rather than black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

/**
 * Resizes and re-encodes a photo in the browser. Redrawing also removes hidden
 * data such as GPS coordinates. WebP is used where supported, otherwise JPEG.
 */
export async function compressImage(file: File, options: CompressOptions): Promise<File> {
  const source = await decode(file);
  const fullWidth = "naturalWidth" in source ? source.naturalWidth : source.width;
  const fullHeight = "naturalHeight" in source ? source.naturalHeight : source.height;
  let scale = Math.min(1, options.maxSide / Math.max(fullWidth, fullHeight));

  let best: Blob | null = null;
  try {
    // Lowers quality first, then size, so very detailed photos still reach the target.
    for (let attempt = 0; attempt < 3; attempt++) {
      const canvas = draw(
        source,
        Math.max(1, Math.round(fullWidth * scale)),
        Math.max(1, Math.round(fullHeight * scale)),
      );
      for (const quality of QUALITIES) {
        const webp = await encode(canvas, "image/webp", quality);
        // Browsers that cannot write WebP quietly return PNG instead.
        const blob =
          webp?.type === "image/webp" ? webp : await encode(canvas, "image/jpeg", quality);
        if (!blob) continue;
        if (!best || blob.size < best.size) best = blob;
        if (blob.size <= options.targetBytes) return toFile(best, file);
      }
      scale *= 0.75;
    }
  } finally {
    if ("close" in source) source.close();
  }
  if (!best) throw new Error("This photo could not be processed");
  return toFile(best, file);
}

function toFile(blob: Blob, original: File) {
  const extension = blob.type === "image/webp" ? "webp" : "jpg";
  const name =
    original.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^\w-]/g, "_")
      .slice(0, 60) || "photo";
  return new File([blob], `${name}.${extension}`, { type: blob.type });
}

export function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
