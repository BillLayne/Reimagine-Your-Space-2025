import { ImageData, StyleSuggestion, ParsedTask } from "../types";

async function callApi<T>(action: string, payload: object): Promise<T> {
  const response = await fetch(`/api/gemini`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
    throw new Error(errorData.message || `API Error: ${response.statusText}`);
  }

  // Handle cases where the response might not be JSON (e.g., file downloads)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json();
  }
  // For non-json responses, like video downloads, we'll handle the blob in the calling function.
  // Here we just return the raw response.
  return response as T;
}

export const parsePromptToTasks = (userPrompt: string): Promise<ParsedTask[]> => callApi('parsePromptToTasks', { userPrompt });
export const getStyleSuggestions = (image: ImageData): Promise<StyleSuggestion[]> => callApi('getStyleSuggestions', { image });
export const enhancePrompt = (userPrompt: string): Promise<string> => callApi('enhancePrompt', { userPrompt });
export const editImage = (image: ImageData, prompt: string): Promise<ImageData> => callApi('editImage', { image, prompt });
export const refineImage = (image: ImageData, prompt: string, mask: ImageData | null): Promise<ImageData> => callApi('refineImage', { image, prompt, mask });
export const enhanceFurniturePrompt = (userPrompt: string): Promise<string> => callApi('enhanceFurniturePrompt', { userPrompt });

export const integrateFurniture = (roomImage: ImageData, furnitureImages: ImageData[], prompt: string): Promise<ImageData> => {
  return callApi('integrateFurniture', { roomImage, furnitureImages, prompt });
};

export async function generateVideo(
  image: ImageData,
  prompt: string,
  onProgress: (message: string) => void
): Promise<string> {
  onProgress("Initiating video generation with the Veo model...");
  const { operation: initialOperation } = await callApi<{ operation: any }>('generateVideo_start', { image, prompt });

  onProgress("The AI is now processing your request. Polling for updates...");
  let operation = initialOperation;
  let pollCount = 0;
  while (!operation.done) {
    pollCount++;
    await new Promise(resolve => setTimeout(resolve, 10000));
    onProgress(`Checking status (attempt ${pollCount})... This can take a few minutes.`);
    const pollResult = await callApi<{ operation: any }>('generateVideo_poll', { operation });
    operation = pollResult.operation;
  }
  
  onProgress("Video generation complete! Retrieving video link...");
  const { downloadLink } = await callApi<{ downloadLink: string }>('generateVideo_getLink', { operation });
  
  onProgress("Downloading the video file...");
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'generateVideo_download', payload: { link: downloadLink } })
  });

  if (!response.ok) {
    throw new Error(`Failed to download video. Status: ${response.statusText}`);
  }

  const videoBlob = await response.blob();
  onProgress("Download complete. Creating local URL for playback.");
  return URL.createObjectURL(videoBlob);
}
