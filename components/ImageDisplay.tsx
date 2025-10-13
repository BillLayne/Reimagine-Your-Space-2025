import React, { useRef } from 'react';
import { ImageData } from '../types';
import { CheckCircleIcon, ExclamationTriangleIcon, DownloadIcon, VideoCameraIcon, WrenchScrewdriverIcon } from './icons';
import { ImageComparator } from './ImageComparator';
import { VideoLoadingDisplay } from './VideoLoadingDisplay';
import { RefinementControls } from './RefinementControls';
import { VisualRefinementCanvas } from './VisualRefinementCanvas';
import { downloadImage } from '../utils/downloadUtils';

interface ImageDisplayProps {
  originalImage: ImageData;
  generatedImage: ImageData | null;
  isLoading: boolean;
  error: string | null;
  onUseNewImage: () => void;
  isBusy: boolean;
  // Video props
  isVideoGenerating: boolean;
  generatedVideoUrl: string | null;
  onGenerateVideo: () => void;
  // Refinement props
  showRefinementControls: boolean;
  isRefining: boolean;
  refinementPrompt: string;
  setRefinementPrompt: (prompt: string) => void;
  onRefineImage: () => void;
  onToggleRefinement: () => void;
  refinementMask: ImageData | null;
  setRefinementMask: (mask: ImageData | null) => void;
}

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400 mb-4"></div>
    <p className="text-xl font-semibold text-slate-300">AI is redesigning your room...</p>
    <p className="text-slate-400">This can take a moment. Please wait.</p>
  </div>
);

export const ImageDisplay: React.FC<ImageDisplayProps> = ({
  originalImage,
  generatedImage,
  isLoading,
  error,
  onUseNewImage,
  isBusy,
  // Video props
  isVideoGenerating,
  generatedVideoUrl,
  onGenerateVideo,
  // Refinement props
  showRefinementControls,
  isRefining,
  refinementPrompt,
  setRefinementPrompt,
  onRefineImage,
  onToggleRefinement,
  refinementMask,
  setRefinementMask,
}) => {
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    // Ensure we are downloading the newly generated image.
    if (generatedImage) {
      downloadImage(generatedImage);
    }
  };

  return (
    <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg min-h-[400px] flex flex-col gap-6">
      <div ref={imageContainerRef} className="relative flex-grow flex flex-col gap-4 justify-center items-center">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center text-red-400 p-8">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">An Error Occurred</h3>
            <p className="text-red-300">{error}</p>
          </div>
        ) : generatedImage ? (
          <>
            <ImageComparator beforeImage={originalImage} afterImage={generatedImage} />
            {showRefinementControls && (
              <VisualRefinementCanvas
                targetRef={imageContainerRef}
                onMaskChange={setRefinementMask}
              />
            )}
          </>
        ) : (
          <div className="text-center text-slate-400 p-8">
            <h3 className="text-2xl font-bold mb-2 text-slate-300">Your Redesigned Room Appears Here</h3>
            <p>Describe the changes you'd like to see and click "Generate".</p>
          </div>
        )}
      </div>

      {generatedImage && !isLoading && (
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
            <button
              onClick={onUseNewImage}
              disabled={isBusy}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircleIcon className="w-6 h-6" />
              Use This Image
            </button>
            <button
              onClick={onToggleRefinement}
              disabled={isBusy}
              className={`w-full sm:w-auto font-bold py-2 px-6 rounded-full transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 ${
                showRefinementControls ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              <WrenchScrewdriverIcon className="w-5 h-5" />
              Refine This Result
            </button>
             <button
              onClick={handleDownload}
              disabled={isBusy}
              className="w-full sm:w-auto bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-6 rounded-full transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <DownloadIcon className="w-5 h-5" />
              Download
            </button>
            <button
              onClick={onGenerateVideo}
              disabled={isBusy}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-full transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <VideoCameraIcon className="w-6 h-6" />
              Create Video
            </button>
          </div>
          {/* Conditionally render refinement controls */}
          {showRefinementControls && (
            <RefinementControls
              prompt={refinementPrompt}
              setPrompt={setRefinementPrompt}
              onRefine={onRefineImage}
              isRefining={isRefining}
              onCancel={onToggleRefinement}
              hasSelection={!!refinementMask}
            />
          )}
        </div>
      )}
      
      {/* New Video Section */}
      <div className="w-full">
        {isVideoGenerating ? (
          <VideoLoadingDisplay />
        ) : generatedVideoUrl ? (
          <div className="w-full max-w-4xl mx-auto space-y-2">
            <h3 className="text-lg font-semibold text-center text-slate-300">Your Cinematic Tour</h3>
            <video
              key={generatedVideoUrl} // Use key to force re-mount on URL change
              className="w-full aspect-video rounded-lg bg-black border-2 border-slate-700"
              src={generatedVideoUrl}
              controls
              autoPlay
              loop
              muted // Muted to allow autoplay on most browsers
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};