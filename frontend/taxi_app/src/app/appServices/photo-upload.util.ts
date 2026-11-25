const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SOURCE_FILE_BYTES = 8 * 1024 * 1024;
const TARGET_SIZE_PX = 320;
const JPEG_QUALITY = 0.84;

/**
 * Validates, center-crops, and resizes a selected profile photo into a compact JPEG data URL.
 */
export function processProfilePhotoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      reject(new Error('Please select a JPG, PNG, or WebP image.'));
      return;
    }

    if (file.size > MAX_SOURCE_FILE_BYTES) {
      reject(new Error('Image must be smaller than 8 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        reject(new Error('Could not read the selected image file.'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Invalid or corrupted image file.'));
      img.onload = () => {
        const minSide = Math.min(img.width, img.height);
        if (!minSide) {
          reject(new Error('Invalid image dimensions.'));
          return;
        }

        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = TARGET_SIZE_PX;
        canvas.height = TARGET_SIZE_PX;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Browser canvas is unavailable for image resizing.'));
          return;
        }

        // Fill opaque background so transparent PNGs do not turn black in JPEG output
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, TARGET_SIZE_PX, TARGET_SIZE_PX);
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, TARGET_SIZE_PX, TARGET_SIZE_PX);

        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });
}
