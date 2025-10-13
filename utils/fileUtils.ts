import { ImageData } from '../types';

export const fileToBase64 = (file: File): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const [header, data] = result.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1];
      
      if (!mimeType || !data) {
        reject(new Error("Could not parse file data."));
        return;
      }
      
      resolve({ data, mimeType });
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Calculates the dimensions of a base64 encoded image.
 * @param imageData The image data object.
 * @returns A promise that resolves with the image's width and height.
 */
export const getImageDimensions = (imageData: ImageData): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = (err) => reject(err);
    img.src = `data:${imageData.mimeType};base64,${imageData.data}`;
  });
};

/**
 * Resizes an image to a maximum dimension, preserving aspect ratio.
 * This helps the AI understand that these are smaller "reference" items.
 */
export const resizeFurnitureImage = (imgData: ImageData): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error("Could not get canvas context"));
        }

        const maxSize = 512; // Max width or height
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const resizedDataUrl = canvas.toDataURL(imgData.mimeType);
        const [, resizedData] = resizedDataUrl.split(',');
        resolve({ data: resizedData, mimeType: imgData.mimeType });
      };
      img.onerror = (err) => reject(err);
      img.src = `data:${imgData.mimeType};base64,${imgData.data}`;
    });
  };
