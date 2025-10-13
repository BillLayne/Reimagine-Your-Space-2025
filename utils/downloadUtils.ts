import { ImageData } from '../types';

/**
 * Triggers a browser download for a given base64 image.
 * @param image The image data object containing the base64 string and mime type.
 */
export const downloadImage = (image: ImageData) => {
  const link = document.createElement('a');
  link.href = `data:${image.mimeType};base64,${image.data}`;

  // Determine file extension from mime type, default to png
  const extension = image.mimeType.split('/')[1] || 'png';
  
  // Create a unique filename
  link.download = `room-shaper-ai-${Date.now()}.${extension}`;
  
  // Append to the document, trigger the click, and then remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};