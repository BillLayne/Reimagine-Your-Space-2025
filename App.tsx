
import React, { useState, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ImageDisplay } from './components/ImageDisplay';
import { ControlsPanel } from './components/ControlsPanel';
import { fileToBase64, getImageDimensions } from './utils/fileUtils';
import { editImage, enhancePrompt, getStyleSuggestions, generateVideo, parsePromptToTasks, refineImage, integrateFurniture, enhanceFurniturePrompt } from './services/geminiService';
import { ImageData, StyleSuggestion, ParsedTask } from './types';
import { ConfirmationModal } from './components/ConfirmationModal';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [currentImage, setCurrentImage] = useState<ImageData | null>(null);
  const [generatedImage, setGeneratedImage] = useState<ImageData | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState<boolean>(false);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [styleSuggestions, setStyleSuggestions] = useState<StyleSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  // New state for prompt deconstruction
  const [tasks, setTasks] = useState<ParsedTask[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  
  // State for video generation
  const [isVideoGenerating, setIsVideoGenerating] = useState<boolean>(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  // New state for the refinement loop
  const [showRefinementControls, setShowRefinementControls] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [refinementPrompt, setRefinementPrompt] = useState<string>('');
  const [refinementMask, setRefinementMask] = useState<ImageData | null>(null); // New state for visual selection

  // State for furniture/decor integration
  const [furnitureImages, setFurnitureImages] = useState<ImageData[]>([]);
  const [furniturePrompt, setFurniturePrompt] = useState<string>('');
  const [isIntegratingFurniture, setIsIntegratingFurniture] = useState<boolean>(false);
  const [isEnhancingFurniture, setIsEnhancingFurniture] = useState<boolean>(false);


  // State for the custom confirmation modal
  const [aspectRatioWarningConfirm, setAspectRatioWarningConfirm] = useState<(() => void) | null>(null);

  const promptControlsRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedVideoUrl(null); // Reset video on new image upload
    setStyleSuggestions([]);
    setPrompt('');
    setTasks([]); // Reset tasks
    setShowRefinementControls(false); // Hide refinement controls
    setRefinementMask(null); // Clear mask on new image upload

    try {
      const imageData = await fileToBase64(file);
      setOriginalImage(imageData);
      setCurrentImage(imageData);

      setIsSuggesting(true);
      try {
        const suggestions = await getStyleSuggestions(imageData);
        setStyleSuggestions(suggestions);
      } catch (suggestErr) {
        console.warn("Could not fetch style suggestions:", suggestErr)
        // Non-critical error, so we don't block the user.
      } finally {
        setIsSuggesting(false);
      }
    } catch (err) {
      setError('Failed to process image file. Please try another one.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanAndEnhancePrompt = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a description of your desired changes.');
      return;
    }
    setIsParsing(true);
    setIsEnhancingPrompt(true);
    setError(null);
    setTasks([]); // Clear previous tasks

    try {
      // Step 1: Parse the simple prompt into tasks for user confirmation
      const parsedTasks = await parsePromptToTasks(prompt);
      if (parsedTasks.length === 0) {
        throw new Error("I couldn't identify specific tasks from your request. Please try rephrasing it.");
      }
      setTasks(parsedTasks);

      // Step 2: Enhance the original prompt for the image generation model
      const enhanced = await enhancePrompt(prompt);
      setPrompt(enhanced); // Update the prompt box with the detailed version
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to process your request: ${errorMessage}`);
      console.error(err);
      setTasks([]); // Clear tasks on error
    } finally {
      setIsParsing(false);
      setIsEnhancingPrompt(false);
    }
  }, [prompt]);

  const handleGenerate = useCallback(async () => {
    if (!currentImage || !prompt.trim()) {
      setError('Please provide an image and a description of the changes.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedVideoUrl(null); // Reset video on new image generation
    setShowRefinementControls(false); // Hide refinement on new generation
    setRefinementMask(null); // Clear mask on new generation

    try {
      const result = await editImage(currentImage, prompt);
      setGeneratedImage(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Generation failed: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, prompt]);

  const handleRefineImage = useCallback(async () => {
    if (!generatedImage || !refinementPrompt.trim()) {
      setError('Please describe the refinement you want to make.');
      return;
    }
    setIsRefining(true);
    setError(null);

    try {
      // Use the *generated* image as the source for refinement
      const result = await refineImage(generatedImage, refinementPrompt, refinementMask);
      setGeneratedImage(result); // Update the generated image with the refined result
      setRefinementPrompt(''); // Clear the prompt for the next refinement
      setRefinementMask(null); // Clear mask after use
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Refinement failed: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsRefining(false);
    }
  }, [generatedImage, refinementPrompt, refinementMask]);

  const handleToggleRefinement = () => {
    setShowRefinementControls(prev => {
      if (prev) { // If we are turning it OFF
        setRefinementMask(null); // Clear the mask
      }
      return !prev;
    });
    setError(null); // Clear errors when toggling
    setRefinementPrompt('');
  };

  const handleFurnitureUpload = async (files: File[]) => {
    setError(null);
    try {
      const imageDataArray: ImageData[] = [];
      for (const file of files) {
        const imageData = await fileToBase64(file);
        imageDataArray.push(imageData);
      }
      setFurnitureImages(prev => [...prev, ...imageDataArray]);
    } catch (err) {
      setError('Failed to process furniture image(s). Please try another file.');
      console.error(err);
    }
  };

  const handleRemoveFurniture = (index: number) => {
    setFurnitureImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllFurniture = () => {
    setFurnitureImages([]);
    setFurniturePrompt('');
  };
  
  const handleEnhanceFurniturePrompt = useCallback(async () => {
    if (!furniturePrompt.trim()) {
      setError('Please describe how you want to integrate the furniture first.');
      return;
    }
    setIsEnhancingFurniture(true);
    setError(null);
    try {
      const enhanced = await enhanceFurniturePrompt(furniturePrompt);
      setFurniturePrompt(enhanced);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to enhance placement prompt: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsEnhancingFurniture(false);
    }
  }, [furniturePrompt]);

  const proceedWithIntegration = useCallback(async () => {
    if (!currentImage) return;

    setIsIntegratingFurniture(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedVideoUrl(null);
    setShowRefinementControls(false);
    setRefinementMask(null);

    try {
      const result = await integrateFurniture(currentImage, furnitureImages, furniturePrompt);
      setGeneratedImage(result);
      // Clear furniture images and prompt after successful integration
      setFurnitureImages([]);
      setFurniturePrompt('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Furniture integration failed: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsIntegratingFurniture(false);
    }
  }, [currentImage, furnitureImages, furniturePrompt]);

  const handleIntegrateFurniture = useCallback(async () => {
    if (!currentImage || furnitureImages.length === 0) {
      setError('Please provide a room image and at least one furniture/decor image.');
      return;
    }
    if (!furniturePrompt.trim()) {
      setError('Please describe how you want to integrate the furniture (e.g., "Place the chair in the corner by the window").');
      return;
    }

    const dims = await getImageDimensions(currentImage);
    if (dims.width < dims.height) {
        setAspectRatioWarningConfirm(() => () => proceedWithIntegration());
        return; // Stop execution until user confirms via modal
    }

    proceedWithIntegration();
  }, [currentImage, furnitureImages, furniturePrompt, proceedWithIntegration]);
  
  const handleGenerateVideo = useCallback(async () => {
    if (!generatedImage) {
      setError("Cannot generate video without a generated image.");
      return;
    }

    setIsVideoGenerating(true);
    setGeneratedVideoUrl(null);
    setError(null);

    const onProgress = (message: string) => {
      console.log(`Video Progress: ${message}`);
    };

    try {
      const videoPrompt = "A slow, cinematic panning shot of this beautifully designed room, highlighting the new features.";
      const url = await generateVideo(generatedImage, videoPrompt, onProgress);
      setGeneratedVideoUrl(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Video generation failed: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsVideoGenerating(false);
    }
  }, [generatedImage]);


  const handleUseNewImage = () => {
    if (generatedImage) {
      setCurrentImage(generatedImage);
      setGeneratedImage(null);
      setGeneratedVideoUrl(null); // Reset video
      setPrompt('');
      setTasks([]); // Reset tasks
      setStyleSuggestions([]);
      setShowRefinementControls(false); // Hide refinement controls
      setRefinementMask(null); // Clear mask
      
      setIsSuggesting(true);
      getStyleSuggestions(generatedImage)
        .then(setStyleSuggestions)
        .catch(err => console.warn("Could not fetch style suggestions for new image:", err))
        .finally(() => setIsSuggesting(false));
    }
  };
  
  const handleSuggestionClick = (suggestionPrompt: string) => {
    setPrompt(suggestionPrompt);
    setTasks([]); // Clear parsed tasks when using a suggestion
    promptControlsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleRefreshSuggestions = useCallback(async () => {
    if (!currentImage) return;

    setIsSuggesting(true);
    setError(null);
    try {
      const suggestions = await getStyleSuggestions(currentImage);
      setStyleSuggestions(suggestions);
    } catch (suggestErr) {
      console.warn("Could not refresh style suggestions:", suggestErr);
      setError("Failed to get new style suggestions. Please try again.");
    } finally {
      setIsSuggesting(false);
    }
  }, [currentImage]);

  const handleStartOver = () => {
    setOriginalImage(null);
    setCurrentImage(null);
    setGeneratedImage(null);
    setGeneratedVideoUrl(null); // Reset video
    setPrompt('');
    setError(null);
    setIsLoading(false);
    setIsEnhancingPrompt(false);
    setIsSuggesting(false);
    setStyleSuggestions([]);
    setTasks([]); // Reset tasks
    setIsParsing(false);
    setShowRefinementControls(false); // Hide refinement controls
    setIsRefining(false);
    setRefinementPrompt('');
    setRefinementMask(null); // Clear mask
    setFurnitureImages([]); // Clear furniture images
    setFurniturePrompt('');
    setIsIntegratingFurniture(false);
  };

  const isPlanning = isParsing || isEnhancingPrompt;
  const isBusy = isLoading || isRefining || isVideoGenerating || isPlanning || isSuggesting || isIntegratingFurniture || isEnhancingFurniture;

  return (
    <div className="min-h-screen bg-slate-900 text-gray-200 font-sans">
      <Header />
      {/* Main content area */}
      <main className="container mx-auto px-4 py-8 pb-16 lg:pb-8">
        {!currentImage ? (
          <Hero onImageUpload={handleImageUpload} isLoading={isLoading} />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/3 w-full">
              <ImageDisplay
                originalImage={currentImage}
                generatedImage={generatedImage}
                isLoading={isLoading}
                error={error}
                onUseNewImage={handleUseNewImage}
                isBusy={isBusy}
                // Video props
                isVideoGenerating={isVideoGenerating}
                generatedVideoUrl={generatedVideoUrl}
                onGenerateVideo={handleGenerateVideo}
                // Refinement props
                showRefinementControls={showRefinementControls}
                isRefining={isRefining}
                refinementPrompt={refinementPrompt}
                setRefinementPrompt={setRefinementPrompt}
                onRefineImage={handleRefineImage}
                onToggleRefinement={handleToggleRefinement}
                refinementMask={refinementMask}
                setRefinementMask={setRefinementMask}
              />
            </div>
            {/* Controls are managed by a new dedicated component */}
            <div className="lg:w-1/3 w-full">
              <ControlsPanel
                currentImage={currentImage}
                onImageUpload={handleImageUpload}
                styleSuggestions={styleSuggestions}
                isSuggesting={isSuggesting}
                onSuggestionClick={handleSuggestionClick}
                onRefreshSuggestions={handleRefreshSuggestions}
                prompt={prompt}
                setPrompt={setPrompt}
                onGenerate={handleGenerate}
                onStartOver={handleStartOver}
                onPlanAndEnhance={handlePlanAndEnhancePrompt}
                isLoading={isLoading}
                isPlanning={isPlanning}
                isParsing={isParsing}
                tasks={tasks}
                promptControlsRef={promptControlsRef}
                // Furniture integration props
                furnitureImages={furnitureImages}
                furniturePrompt={furniturePrompt}
                setFurniturePrompt={setFurniturePrompt}
                onFurnitureUpload={handleFurnitureUpload}
                onRemoveFurniture={handleRemoveFurniture}
                onClearAllFurniture={handleClearAllFurniture}
                onIntegrateFurniture={handleIntegrateFurniture}
                isIntegratingFurniture={isIntegratingFurniture}
                onEnhanceFurniturePrompt={handleEnhanceFurniturePrompt}
                isEnhancingFurniture={isEnhancingFurniture}
              />
            </div>
          </div>
        )}
      </main>
      
      {aspectRatioWarningConfirm && (
        <ConfirmationModal
          title="Image Recommendation"
          onConfirm={() => {
            aspectRatioWarningConfirm(); // Run the stored callback
            setAspectRatioWarningConfirm(null); // Close modal
          }}
          onCancel={() => setAspectRatioWarningConfirm(null)} // Just close modal
        >
          Your room photo is in portrait mode (taller than wide). For best results, we recommend using a landscape photo as the AI may crop your image. Do you want to continue anyway?
        </ConfirmationModal>
      )}
    </div>
  );
};

export default App;
