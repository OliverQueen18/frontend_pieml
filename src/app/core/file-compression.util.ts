const MAX_IMAGE_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;
const MIN_SIZE_TO_COMPRESS = 300 * 1024;

export interface CompressUploadOptions {
  maxDimension?: number;
  quality?: number;
  minSizeBytes?: number;
}

function isCompressibleImage(file: File): boolean {
  if (!file.type.startsWith('image/')) return false;
  return file.type !== 'image/gif' && file.type !== 'image/svg+xml';
}

function scaledDimensions(width: number, height: number, maxDimension: number) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }
  const ratio = Math.min(maxDimension / width, maxDimension / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio)
  };
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Impossible de lire l\'image'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Compression échouée'))),
      type,
      quality
    );
  });
}

function buildCompressedName(originalName: string, extension: string): string {
  const base = originalName.replace(/\.[^.]+$/, '') || 'document';
  return `${base}.${extension}`;
}

/**
 * Compresse les images avant téléversement (redimensionnement + JPEG).
 * Les PDF et GIF sont laissés inchangés.
 */
export async function compressUploadFile(
  file: File,
  options: CompressUploadOptions = {}
): Promise<File> {
  const maxDimension = options.maxDimension ?? MAX_IMAGE_DIMENSION;
  const quality = options.quality ?? JPEG_QUALITY;
  const minSizeBytes = options.minSizeBytes ?? MIN_SIZE_TO_COMPRESS;

  if (!isCompressibleImage(file)) {
    return file;
  }

  if (file.size < minSizeBytes) {
    return file;
  }

  try {
    const img = await loadImageElement(file);
    const { width, height } = scaledDimensions(img.naturalWidth, img.naturalHeight, maxDimension);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }

    ctx.drawImage(img, 0, 0, width, height);

    const outputType = 'image/jpeg';
    const blob = await canvasToBlob(canvas, outputType, quality);
    if (blob.size >= file.size) {
      return file;
    }

    return new File(
      [blob],
      buildCompressedName(file.name, 'jpg'),
      { type: outputType, lastModified: Date.now() }
    );
  } catch {
    return file;
  }
}
