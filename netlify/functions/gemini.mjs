import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.API_KEY);

export const handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method not allowed' }) };
  }

  try {
    const { action, payload } = JSON.parse(event.body);
    console.log(`Processing action: ${action}`);
    let data;

    switch (action) {
      case 'parsePromptToTasks': {
        const { userPrompt } = payload;
        const metaPrompt = `You are a task deconstruction AI. Your job is to read a user's request for home improvement and break it down into a structured list of items to be changed and the requested change. Respond ONLY with the JSON array. User Request: "${userPrompt}"`;

        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash-exp',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  item: { type: 'string' },
                  change: { type: 'string' }
                },
                required: ['item', 'change']
              }
            }
          }
        });

        const result = await model.generateContent(metaPrompt);
        const rawText = result.response.text().trim();
        data = rawText ? JSON.parse(rawText) : [];
        break;
      }

      case 'getStyleSuggestions': {
        const { image } = payload;
        const metaPrompt = `Analyze the provided room image. You are an expert interior designer. Suggest four distinct, popular, and aesthetically pleasing interior design styles suitable for this room. For each, provide a 'name' and a detailed 'prompt' for an image generation AI. Respond ONLY with the JSON array.`;

        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash-exp',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  prompt: { type: 'string' }
                },
                required: ['name', 'prompt']
              }
            }
          }
        });

        const parts = [
          {
            inlineData: {
              data: image.data,
              mimeType: image.mimeType
            }
          },
          { text: metaPrompt }
        ];

        const result = await model.generateContent(parts);
        const rawText = result.response.text().trim();
        data = rawText ? JSON.parse(rawText) : [];
        break;
      }

      case 'enhancePrompt': {
        const { userPrompt } = payload;
        const metaPrompt = `You are an expert interior design assistant. Rewrite a user's simple home improvement request into a detailed, structured prompt for an image generation AI, starting with "Apply the following distinct changes to the image:". Structure the output as a numbered list. Only enrich their existing requests. Respond ONLY with the final, structured prompt text. User's request: "${userPrompt}"`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        const result = await model.generateContent(metaPrompt);
        data = result.response.text().trim();
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

        const parts = [
          {
            inlineData: {
              data: image.data,
              mimeType: image.mimeType
            }
          }
        ];

        if (mask) {
          parts.push({
            inlineData: {
              data: mask.data,
              mimeType: mask.mimeType
            }
          });
        }

        parts.push({ text: metaPrompt });

        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash-thinking-exp-01-21'
        });

        const result = await model.generateContent({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            responseModalities: ['image', 'text']
          }
        });

        const imagePart = result.response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (!imagePart?.inlineData) {
          throw new Error('API did not return an image.');
        }
        data = { data: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType };
        break;
      }

      case 'enhanceFurniturePrompt': {
        const { userPrompt } = payload;
        const metaPrompt = `You are an expert photo compositing assistant. Rewrite a user's furniture placement instruction into a detailed prompt for an image generation AI. Focus on precise location, scale, lighting, and shadows. DO NOT add instructions to change the existing room. Respond ONLY with the enhanced instruction text. User's instruction: "${userPrompt}"`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        const result = await model.generateContent(metaPrompt);
        data = result.response.text().trim();
        break;
      }

      case 'integrateFurniture': {
        const { roomImage, furnitureImages, prompt } = payload;
        const metaPrompt = `You are a precision AI photo compositing tool. Your SOLE function is to add new objects from reference images into a primary image without changing anything else. The FIRST image is the original room. You MUST preserve it perfectly. The subsequent images are reference items to be added. Follow the user's placement instructions with absolute precision. The final image MUST have the exact same dimensions and aspect ratio as the original room image. User's Placement Instructions: "${prompt}"`;

        const parts = [
          {
            inlineData: {
              data: roomImage.data,
              mimeType: roomImage.mimeType
            }
          },
          ...furnitureImages.map(img => ({
            inlineData: {
              data: img.data,
              mimeType: img.mimeType
            }
          })),
          { text: metaPrompt }
        ];

        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash-thinking-exp-01-21'
        });

        const result = await model.generateContent({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            responseModalities: ['image', 'text']
          }
        });

        const imagePart = result.response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (!imagePart?.inlineData) {
          throw new Error('API did not return an image.');
        }
        data = { data: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType };
        break;
      }

      case 'generateVideo_start': {
        const { image, prompt } = payload;
        // Note: Video generation requires special API setup
        // For now, return a mock operation that can be polled
        data = {
          operation: {
            name: 'operations/video-' + Date.now(),
            done: false,
            metadata: {
              startTime: new Date().toISOString()
            }
          }
        };
        break;
      }

      case 'generateVideo_poll': {
        const { operation } = payload;
        // Mock polling response - in production, you'd poll the actual API
        data = {
          operation: {
            ...operation,
            done: true,
            response: {
              generatedVideos: [{
                video: {
                  uri: 'https://example.com/mock-video.mp4'
                }
              }]
            }
          }
        };
        break;
      }

      case 'generateVideo_getLink': {
        const { operation } = payload;
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
          throw new Error('Video generation succeeded, but no download link was provided.');
        }
        data = { downloadLink };
        break;
      }

      case 'generateVideo_download': {
        const { link } = payload;
        // In production, you'd fetch from the actual video URL
        // For now, return error indicating video generation is not fully implemented
        throw new Error('Video download is not yet implemented. This requires additional API setup.');
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Action ${action} completed successfully`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error in action:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: error.message || 'An unknown server error occurred.' })
    };
  }
};
