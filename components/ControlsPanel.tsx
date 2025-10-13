
import React, { useState } from 'react';
import { ImageData, StyleSuggestion, ParsedTask } from '../types';
import { ImageUploader } from './ImageUploader';
import { StyleSuggestions } from './StyleSuggestions';
import { PromptControls } from './PromptControls';
import { FurnitureUploader } from './FurnitureUploader';
import { SparklesIcon, MagicWandIcon } from './icons';

interface ControlsPanelProps {
  currentImage: ImageData;
  onImageUpload: (file: File) => void;
  styleSuggestions: StyleSuggestion[];
  isSuggesting: boolean;
  onSuggestionClick: (prompt: string) => void;
  onRefreshSuggestions: () => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  onStartOver: () => void;
  onPlanAndEnhance: () => void;
  isLoading: boolean;
  isPlanning: boolean;
  isParsing: boolean;
  tasks: ParsedTask[];
  promptControlsRef: React.RefObject<HTMLDivElement>;
  // Furniture integration props
  furnitureImages: ImageData[];
  furniturePrompt: string;
  setFurniturePrompt: (prompt: string) => void;
  onFurnitureUpload: (files: File[]) => void;
  onRemoveFurniture: (index: number) => void;
  onClearAllFurniture: () => void;
  onIntegrateFurniture: () => void;
  isIntegratingFurniture: boolean;
  onEnhanceFurniturePrompt: () => void;
  isEnhancingFurniture: boolean;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = (props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isBusy = props.isLoading || props.isPlanning || props.isIntegratingFurniture || props.isEnhancingFurniture;

  return (
    <div className="w-full lg:sticky lg:top-24 lg:self-start">
      <div className="container mx-auto px-1 lg:px-0">
        <div className="lg:space-y-6">
          <div className={`lg:block ${isExpanded ? 'block' : 'hidden'}`}>
             <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 p-3 lg:p-0">
                <div className="col-span-1">
                    <ImageUploader
                        currentImage={props.currentImage}
                        onImageUpload={props.onImageUpload}
                    />
                </div>
                <div className="col-span-1">
                    <StyleSuggestions
                        suggestions={props.styleSuggestions}
                        isLoading={props.isSuggesting}
                        onSuggestionClick={(prompt) => {
                          props.onSuggestionClick(prompt);
                          setIsExpanded(false);
                        }}
                        onRefreshSuggestions={props.onRefreshSuggestions}
                    />
                </div>
            </div>
          </div>

          <div ref={props.promptControlsRef}>
            <PromptControls
              prompt={props.prompt}
              setPrompt={props.setPrompt}
              onGenerate={props.onGenerate}
              onStartOver={props.onStartOver}
              onPlanAndEnhance={props.onPlanAndEnhance}
              isLoading={props.isLoading}
              isPlanning={props.isPlanning}
              isParsing={props.isParsing}
              tasks={props.tasks}
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded(!isExpanded)}
            />
          </div>

          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg space-y-4">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-cyan-400" />
              Add Furniture & Decor
            </h2>

            <FurnitureUploader
              furnitureImages={props.furnitureImages}
              onFurnitureUpload={props.onFurnitureUpload}
              onRemoveFurniture={props.onRemoveFurniture}
              onClearAll={props.onClearAllFurniture}
              disabled={isBusy}
            />

            {props.furnitureImages.length > 0 && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="furniture-prompt" className="block text-sm font-medium text-slate-300 mb-1">
                    Describe how to integrate:
                  </label>
                  <textarea
                    id="furniture-prompt"
                    value={props.furniturePrompt}
                    onChange={(e) => props.setFurniturePrompt(e.target.value)}
                    placeholder="e.g., 'Place the modern chair in the left corner by the window' or 'Add the lamp on the side table'"
                    rows={3}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-white placeholder-slate-400"
                    disabled={isBusy}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={props.onEnhanceFurniturePrompt}
                        disabled={isBusy || !props.furniturePrompt.trim()}
                        className="w-full sm:w-auto flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-200 flex items-center justify-center gap-2"
                    >
                         {props.isEnhancingFurniture ? (
                            <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Enhancing...
                            </>
                        ) : (
                            <>
                            <MagicWandIcon className="w-5 h-5" />
                            Enhance Placement
                            </>
                        )}
                    </button>
                    <button
                        onClick={props.onIntegrateFurniture}
                        disabled={isBusy || !props.furniturePrompt.trim()}
                        className="w-full sm:w-auto flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        {props.isIntegratingFurniture ? (
                            <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Integrating...
                            </>
                        ) : (
                            <>
                            <SparklesIcon className="w-5 h-5" />
                            Integrate
                            </>
                        )}
                    </button>
                </div>


                <p className="text-xs text-slate-400 text-center">
                  First, enhance the placement prompt, then integrate the items into your room for best results.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
