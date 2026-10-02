/**
 * Re-encodes the chosen photo in the browser before upload.
 *
 * Three things happen here, and all of them matter:
 *  - HEIC becomes JPEG. iPhones shoot HEIC and sharp's prebuilt binaries have
 *    no HEIF decoder, so the server would reject the file outright.
 *  - The upload shrinks, which is the difference between a usable and a
 *    painful experience on mobile data.
 *  - Canvas drops the metadata block, so the GPS coordinates in the selfie
 *    never leave the device.
 */

const MAX_EDGE = 1600;
const QUALITY = 0.9;

export class ImageDecodeError extends Error {
  constructor() {
    super('Não conseguimos abrir essa imagem.');
    this.name = 'ImageDecodeError';
  }
}

export async function resizeImageFile(file: File): Promise<File> {
  const bitmap = await decode(file);

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageDecodeError();

  ctx.drawImage(bitmap, 0, 0, width, height);
  if ('close' in bitmap) bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', QUALITY)
  );
  if (!blob) throw new ImageDecodeError();

  return new File([blob], 'foto.jpg', { type: 'image/jpeg' });
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      // imageOrientation honours EXIF so a portrait photo is not sideways.
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Safari has historically refused HEIC here; fall through to <img>.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new ImageDecodeError());
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
