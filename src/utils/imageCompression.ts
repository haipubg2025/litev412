/**
 * Compresses an image file before uploading to save storage space.
 * 
 * @param file The image file to compress
 * @param quality The quality of the output JPEG (from 0 to 1)
 * @param maxWidth The maximum width of the output image
 * @returns A Promise that resolves to a Data URL (base64 string) of the compressed image
 */
export const compressImage = (file: File, quality = 0.8, maxWidth = 1200): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if the image is too wide
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src); // fallback to original data url if canvas isn't supported
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        // Compress keeping requested quality (default 80%)
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => {
        reject(error);
      };
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
};
