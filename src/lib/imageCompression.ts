/**
 * Compresses an uploaded image file client-side to a compact JPEG data URL
 * guaranteed to fit well under Firestore's 1MB document limit (max ~380KB).
 */
export async function compressImageToDataUrl(
  file: File,
  maxDimension = 1200,
  quality = 0.78
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file (PNG, JPG, WebP).');
  }

  const imageBitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(imageBitmap.width, imageBitmap.height));
  const width = Math.max(1, Math.round(imageBitmap.width * scale));
  const height = Math.max(1, Math.round(imageBitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to initialize image processor.');
  }

  ctx.drawImage(imageBitmap, 0, 0, width, height);
  imageBitmap.close();

  let currentQuality = quality;
  let dataUrl = canvas.toDataURL('image/jpeg', currentQuality);

  while (dataUrl.length > 420000 && currentQuality > 0.35) {
    currentQuality -= 0.12;
    dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
  }

  if (dataUrl.length > 520000) {
    throw new Error('Image is too large after compression. Please choose a smaller file.');
  }

  return dataUrl;
}
