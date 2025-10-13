import { GoogleGenAI, Modality, Type } from "https://aistudiocdn.com/@google/genai@^1.21.0";
import type { Context } from "@netlify/functions";
import { ImageData, StyleSuggestion, ParsedTask } from "../../types.ts";

// Fix: Use process.env to access environment variables, as per guidelines and to resolve 'Deno' not found error.
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

// This is the main handler for all API requests from the frontend.
export default async (req: Request, context: Context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Method not allowed' }), { status: 405, headers });
    }
    
    try {
        const { action, payload } = await req.json();
        let data;

        switch (action) {
            case 'parsePromptToTasks': {
                const { userPrompt } = payload;
                const metaPrompt = `You are a task deconstruction AI. Your job is to read a user's request for home improvement and break it down into a structured list of items to be changed and the requested change. Respond ONLY with the JSON array. User Request: "${userPrompt}"`;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: metaPrompt,
                    config: {
                        responseMimeType: 'application/json',
                        responseSchema: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: { item: { type: Type.STRING }, change: { type: Type.STRING } },
                            required: ["item", "change"],
                          },
                        },
                        thinkingConfig: { thinkingBudget: 0 },
                    },
                });
                data = JSON.parse(response.text.trim() || '[]');
                break;
            }
            case 'getStyleSuggestions': {
                const { image } = payload;
                const metaPrompt = `Analyze the provided room image. You are an expert interior designer. Suggest four distinct, popular, and aesthetically pleasing interior design styles suitable for this room. For each, provide a 'name' and a detailed 'prompt' for an image generation AI. Respond ONLY with the JSON array.`;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: { parts: [{ inlineData: { data: image.data, mimeType: image.mimeType } }, { text: metaPrompt }] },
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                          type: Type.ARRAY,
                          items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, prompt: { type: Type.STRING } }, required: ["name", "prompt"] },
                        },
                        thinkingConfig: { thinkingBudget: 0 },
                    },
                });
                data = JSON.parse(response.text.trim());
                break;
            }
            case 'enhancePrompt': {
                 const { userPrompt } = payload;
                 const metaPrompt = `You are an expert interior design assistant. Rewrite a user's simple home improvement request into a detailed, structured prompt for an image generation AI, starting with "Apply the following distinct changes to the image:". Structure the output as a numbered list. Only enrich their existing requests. Respond ONLY with the final, structured prompt text. User's request: "${userPrompt}"`;
                 const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: metaPrompt, config: { thinkingConfig: { thinkingBudget: 0 } } });
                 data = response.text.trim();
                 break;
            }
            case 'editImage':
            case 'refineImage': {
                const { image, prompt, mask } = payload;
                const isRefinement = action === 'refineImage';
                const basePrompt = isRefinement
                    ? `You are an AI image refinement specialist. Make a small, specific correction to the image based on the user's request, perfectly preserving the original aspect ratio. ${mask ? "Apply changes *only* to the masked area." : "Preserve all other aspects."}`
                    : `You are an expert AI image editor. Follow the user's instructions with extreme precision, preserving the original image's aspect ratio and dimensions. DO NOT CROP. Execute all tasks.`;
                const metaPrompt = `${basePrompt}\n\nUser's request: "${prompt}"`;
                
                const parts: any[] = [{ inlineData: { data: image.data, mimeType: image.mimeType } }];
                if (mask) {
                    parts.push({ inlineData: { data: mask.data, mimeType: mask.mimeType } });
                }
                parts.push({ text: metaPrompt });

                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts }, config: { responseModalities: [Modality.IMAGE, Modality.TEXT] } });
                const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
                if (!imagePart?.inlineData) throw new Error("API did not return an image.");
                data = { data: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType };
                break;
            }
            case 'enhanceFurniturePrompt': {
                const { userPrompt } = payload;
                const metaPrompt = `You are an expert photo compositing assistant. Rewrite a user's furniture placement instruction into a detailed prompt for an image generation AI. Focus on precise location, scale, lighting, and shadows. DO NOT add instructions to change the existing room. Respond ONLY with the enhanced instruction text. User's instruction: "${userPrompt}"`;
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: metaPrompt, config: { thinkingConfig: { thinkingBudget: 0 } } });
                data = response.text.trim();
                break;
            }
            case 'integrateFurniture': {
                const { roomImage, furnitureImages, prompt } = payload;
                const metaPrompt = `You are a precision AI photo compositing tool. Your SOLE function is to add new objects from reference images into a primary image without changing anything else. The FIRST image is the original room. You MUST preserve it perfectly. The subsequent images are reference items to be added. Follow the user's placement instructions with absolute precision. The final image MUST have the exact same dimensions and aspect ratio as the original room image. User's Placement Instructions: "${prompt}"`;
                const parts = [
                    { inlineData: { data: roomImage.data, mimeType: roomImage.mimeType } },
                    ...furnitureImages.map((img: ImageData) => ({ inlineData: { data: img.data, mimeType: img.mimeType } })),
                    { text: metaPrompt }
                ];
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts }, config: { responseModalities: [Modality.IMAGE, Modality.TEXT] } });
                const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
                if (!imagePart?.inlineData) throw new Error("API did not return an image.");
                data = { data: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType };
                break;
            }
            case 'generateVideo_start': {
                const { image, prompt } = payload;
                const operation = await ai.models.generateVideos({ model: 'veo-2.0-generate-001', prompt, image: { imageBytes: image.data, mimeType: image.mimeType }, config: { numberOfVideos: 1 } });
                data = { operation };
                break;
            }
            case 'generateVideo_poll': {
                const { operation } = payload;
                const polledOp = await ai.operations.getVideosOperation({ operation });
                data = { operation: polledOp };
                break;
            }
            case 'generateVideo_getLink': {
                const { operation } = payload;
                const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
                if (!downloadLink) throw new Error("Video generation succeeded, but no download link was provided.");
                data = { downloadLink };
                break;
            }
            case 'generateVideo_download': {
                const { link } = payload;
                const videoResponse = await fetch(`${link}&key=${API_KEY}`);
                if (!videoResponse.ok) throw new Error(`Failed to download video. Status: ${videoResponse.statusText}`);
                return new Response(videoResponse.body, { headers: { 'Content-Type': videoResponse.headers.get('Content-Type') || 'video/mp4' } });
            }
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify(data), { headers });
    } catch(error) {
        console.error(`Error in action:`, error);
        return new Response(JSON.stringify({ message: error.message || 'An unknown server error occurred.' }), { status: 500, headers });
    }
}