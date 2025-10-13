
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ImageData, StyleSuggestion, ParsedTask } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function parsePromptToTasks(userPrompt: string): Promise<ParsedTask[]> {
  const metaPrompt = `You are a task deconstruction AI. Your job is to read a user's request for home improvement and break it down into a structured list of items to be changed and the requested change.

- Identify each distinct object or area the user wants to modify (e.g., "walls", "cabinets", "floor").
- For each item, describe the change the user wants (e.g., "paint them blue", "add a new one", "change to hardwood").
- If the user's request is a single task, return an array with one object.
- If the request is unclear or too broad, try your best to interpret it into concrete items.
- Respond ONLY with the JSON array. Do not include any other text or explanations.

User Request: "${userPrompt}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: metaPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              item: {
                type: Type.STRING,
                description: "The object or area to be changed (e.g., 'Walls', 'Sofa')."
              },
              change: {
                type: Type.STRING,
                description: "The modification requested for the item (e.g., 'paint them sage green', 'replace with a leather one')."
              },
            },
            required: ["item", "change"],
          },
        },
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    
    const jsonString = response.text.trim();
    if (!jsonString) {
      return []; // Return empty array if no tasks are found
    }
    return JSON.parse(jsonString) as ParsedTask[];

  } catch (error) {
    console.error("Error calling Gemini API for task parsing:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while parsing the prompt.");
  }
}

export async function getStyleSuggestions(image: ImageData): Promise<StyleSuggestion[]> {
  const metaPrompt = `Analyze the provided room image. You are an expert interior designer. Your task is to suggest four distinct, popular, and aesthetically pleasing interior design styles that would be suitable transformations for this specific room.

For each style, provide a 'name' and a 'prompt'. The 'prompt' must be a detailed, ready-to-use set of instructions for an image generation AI, written as if you were instructing a junior designer. It should be structured as a numbered list of actions, starting with "Apply the following distinct changes to the image:".

Respond ONLY with the JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: image.data,
              mimeType: image.mimeType,
            },
          },
          { text: metaPrompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              prompt: { type: Type.STRING },
            },
            required: ["name", "prompt"],
          },
        },
        // Optimize for speed by disabling thinking
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    // The response text should be a JSON string, so we parse it.
    const jsonString = response.text.trim();
    if (!jsonString) {
      throw new Error("The AI returned an empty response for style suggestions.");
    }
    return JSON.parse(jsonString) as StyleSuggestion[];

  } catch (error) {
    console.error("Error calling Gemini API for style suggestions:", error);
    if (error instanceof Error) {
      throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching style suggestions.");
  }
}


export async function enhancePrompt(userPrompt: string): Promise<string> {
  const metaPrompt = `You are an expert interior design assistant. Your task is to rewrite a user's simple home improvement request into a detailed, structured prompt for an image generation AI.

Follow these rules precisely:
1.  Identify every distinct change the user requests (e.g., changing walls is one change, changing floors is another).
2.  Structure the output as a numbered list of actions, starting with the phrase "Apply the following distinct changes to the image:".
3.  For each numbered action, first name the object being changed (e.g., "1. Walls:", "2. Cabinets:").
4.  After the object name, elaborate on the user's instruction with specific, professional details about materials, textures, colors, and styles.
5.  Do NOT add new elements the user didn't ask for. Only enrich their existing requests.
6.  Respond ONLY with the final, structured prompt text. Do not include any other explanations.

Example:
User's request: "paint the walls dark and change carpet to hardwood"
Your response:
Apply the following distinct changes to the image:
1. Walls: Repaint the walls a deep, a dramatic charcoal gray with a smooth, velvety matte finish.
2. Flooring: Replace the existing carpet with wide-plank light oak hardwood flooring, laid in a straight pattern with a natural satin finish that highlights the wood grain.

User's request: "${userPrompt}"`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: metaPrompt,
      config: {
        // Optimize for speed by disabling thinking
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    
    const enhancedText = response.text.trim();
    if (!enhancedText) {
      throw new Error("The AI returned an empty response.");
    }
    return enhancedText;

  } catch (error) {
     console.error("Error calling Gemini API for prompt enhancement:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while enhancing the prompt.");
  }
}

export async function editImage(
  image: ImageData,
  prompt: string
): Promise<ImageData> {
  // A more forceful meta-prompt to ensure all instructions are followed.
  const metaPrompt = `You are an expert AI image editor. Your primary directive is to follow the user's instructions with extreme precision while preserving the original image's integrity.

**CRITICAL REQUIREMENT: PRESERVE ASPECT RATIO**
- You **MUST** generate an output image that has the **EXACT SAME ASPECT RATIO AND DIMENSIONS** as the original input image.
- **DO NOT CROP** the image. **DO NOT** change the aspect ratio.
- The output MUST show the complete, full scene from the original image.

**Task Execution:**
- **Analyze the entire prompt:** Identify every distinct task in the user's request.
- **Execute all tasks:** Do not skip any task. If the prompt says to "remove wires" AND "paint the wall", you must do BOTH. Partial completion is a failure.
- **Preserve realism:** Maintain the original room's structure, lighting, and perspective. The changes should look natural.

Here is the user's prompt. Apply every single instruction while strictly maintaining the original aspect ratio:
"${prompt}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: image.data,
              mimeType: image.mimeType,
            },
          },
          {
            text: metaPrompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    if (
      !response.candidates ||
      response.candidates.length === 0 ||
      !response.candidates[0].content ||
      !response.candidates[0].content.parts
    ) {
      throw new Error("Invalid response structure from Gemini API.");
    }

    const imagePart = response.candidates[0].content.parts.find(
      (part) => part.inlineData
    );

    if (!imagePart || !imagePart.inlineData) {
      // Check for text part which might contain a safety block message
      const textPart = response.candidates[0].content.parts.find((part) => part.text);
      if (textPart && textPart.text) {
          throw new Error(`API did not return an image. Response: ${textPart.text}`);
      }
      throw new Error("No image data found in the API response.");
    }
    
    return {
      data: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
    };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
}

export async function refineImage(
  image: ImageData,
  prompt: string,
  mask: ImageData | null,
): Promise<ImageData> {
  const metaPrompt = `You are an AI image refinement specialist. Your task is to make a small, specific correction to the provided image based on the user's request, while perfectly preserving the original image's aspect ratio and dimensions.

**CRITICAL REQUIREMENT: PRESERVE ASPECT RATIO & DIMENSIONS**
- The output image **MUST** have the **EXACT SAME ASPECT RATIO AND DIMENSIONS** as the original input image.
- **DO NOT CROP** or resize the image. The entire original scene must be present in the output.

**Refinement Instructions:**
- Focus ONLY on the user's specific instruction.
- ${mask ? "Apply the changes *only* to the area indicated by the white shape in the mask image. All other parts of the image must remain untouched." : "Preserve all other aspects of the image perfectly."}
- Ensure the final result is seamless and photorealistic.`;
  
  const fullPrompt = `${metaPrompt}\n\nUser's refinement request: "${prompt}"`;


  try {
    const parts: any[] = [
      {
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        },
      },
    ];

    if (mask) {
      parts.push({
        inlineData: {
          data: mask.data,
          mimeType: mask.mimeType,
        },
      });
    }

    parts.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    if (
      !response.candidates ||
      response.candidates.length === 0 ||
      !response.candidates[0].content ||
      !response.candidates[0].content.parts
    ) {
      throw new Error("Invalid response structure from Gemini API.");
    }

    const imagePart = response.candidates[0].content.parts.find(
      (part) => part.inlineData
    );

    if (!imagePart || !imagePart.inlineData) {
      const textPart = response.candidates[0].content.parts.find((part) => part.text);
      if (textPart && textPart.text) {
          throw new Error(`API did not return an image. Response: ${textPart.text}`);
      }
      throw new Error("No image data found in the API response.");
    }
    
    return {
      data: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
    };

  } catch (error) {
    console.error("Error calling Gemini API for refinement:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while refining the image.");
  }
}

export async function enhanceFurniturePrompt(userPrompt: string): Promise<string> {
  const metaPrompt = `You are an expert photo compositing assistant. Your task is to rewrite a user's simple furniture placement instruction into a detailed, professional prompt for an image generation AI.

Follow these rules precisely:
1.  Focus on precise location, scale, lighting, shadows, and perspective to ensure a photorealistic result.
2.  Elaborate on the user's instruction with professional details. For example, if the user says "put the chair in the corner," you might say "Place the chair in the far-left corner, ensuring it is scaled appropriately for the room's size. The lighting on the chair should match the ambient light from the window, and it should cast a soft, natural shadow onto the floor and wall."
3.  CRITICAL: Your output must ONLY describe the placement and integration of the new item(s).
4.  DO NOT add any instructions to change the existing room, its furniture, walls, or floor.
5.  Respond ONLY with the final, enhanced instruction text. Do not include any other explanations.

User's instruction: "${userPrompt}"`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: metaPrompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }, // Optimize for speed
      },
    });
    
    const enhancedText = response.text.trim();
    if (!enhancedText) {
      throw new Error("The AI returned an empty response for furniture prompt enhancement.");
    }
    return enhancedText;

  } catch (error) {
     console.error("Error calling Gemini API for furniture prompt enhancement:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while enhancing the furniture prompt.");
  }
}

export async function integrateFurniture(
  roomImage: ImageData,
  furnitureImages: ImageData[],
  prompt: string
): Promise<ImageData> {
  const metaPrompt = `You are a precision AI photo compositing tool. Your SOLE function is to add new objects from reference images into a primary image without changing anything else.

**PRIMARY DIRECTIVE: DO NOT ALTER THE ORIGINAL ROOM.**
This is a non-negotiable rule. The final image must be IDENTICAL to the original room except for the new items being added.

- **The FIRST image is the original room.** You MUST preserve it perfectly. DO NOT change the existing couch, tables, flooring, walls, lighting, or overall room structure and dimensions. Any modification to the original room's content is a failure.
- **The subsequent images are reference items.** These are the new objects to be added to the room.
- **Follow the user's placement instructions with absolute precision.**
- **The final image MUST have the exact same dimensions and aspect ratio as the original room image.** Do not crop, stretch, or warp the scene.

**User's Placement Instructions:**
"${prompt}"

To succeed, you must output the original room photo with only the new items realistically added according to the user's instructions. Nothing else should be changed.`;
  
  /**
   * Resizes an image to a maximum dimension, preserving aspect ratio.
   * This helps the AI understand that these are smaller "reference" items.
   */
  const resizeFurnitureImage = (imgData: ImageData): Promise<ImageData> => {
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

  try {
    // The room image is always first and at full resolution.
    const parts: any[] = [
      {
        inlineData: {
          data: roomImage.data,
          mimeType: roomImage.mimeType,
        },
      },
    ];

    // Resize all furniture images and add them to the parts array.
    for (const furnitureImage of furnitureImages) {
      const resizedFurniture = await resizeFurnitureImage(furnitureImage);
      parts.push({
        inlineData: {
          data: resizedFurniture.data,
          mimeType: resizedFurniture.mimeType,
        },
      });
    }

    // Add the detailed text prompt last.
    parts.push({
      text: metaPrompt,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    if (
      !response.candidates ||
      response.candidates.length === 0 ||
      !response.candidates[0].content ||
      !response.candidates[0].content.parts
    ) {
      throw new Error("Invalid response structure from Gemini API.");
    }

    const imagePart = response.candidates[0].content.parts.find(
      (part) => part.inlineData
    );

    if (!imagePart || !imagePart.inlineData) {
      const textPart = response.candidates[0].content.parts.find((part) => part.text);
      if (textPart && textPart.text) {
        throw new Error(`API did not return an image. Response: ${textPart.text}`);
      }
      throw new Error("No image data found in the API response.");
    }

    return {
      data: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
    };
  } catch (error) {
    console.error("Error calling Gemini API for furniture integration:", error);
    if (error instanceof Error) {
      throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while integrating furniture.");
  }
}

export async function generateVideo(
  image: ImageData,
  prompt: string,
  onProgress: (message: string) => void
): Promise<string> {
  try {
    onProgress("Initiating video generation with the Veo model...");
    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: prompt,
      image: {
        imageBytes: image.data,
        mimeType: image.mimeType,
      },
      config: {
        numberOfVideos: 1,
      },
    });

    onProgress("The AI is now processing your request. Polling for updates...");
    
    let pollCount = 0;
    while (!operation.done) {
      pollCount++;
      await new Promise(resolve => setTimeout(resolve, 10000));
      onProgress(`Checking status (attempt ${pollCount})...`);
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    
    onProgress("Video generation complete! Downloading the video file...");

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
      throw new Error("Video generation succeeded, but no download link was provided.");
    }

    const response = await fetch(`${downloadLink}&key=${API_KEY}`);
    
    if (!response.ok) {
        throw new Error(`Failed to download video. Status: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    onProgress("Download complete. Creating local URL for playback.");

    return URL.createObjectURL(videoBlob);
  } catch (error) {
    console.error("Error calling Gemini API for video generation:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the video.");
  }
}
