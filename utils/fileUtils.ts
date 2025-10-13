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
