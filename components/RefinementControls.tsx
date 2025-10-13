import React from 'react';
import { WrenchScrewdriverIcon, CheckIcon } from './icons';

interface RefinementControlsProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onRefine: () => void;
  isRefining: boolean;
  onCancel: () => void;
  hasSelection: boolean;
}

export const RefinementControls: React.FC<RefinementControlsProps> = ({
  prompt,
  setPrompt,
  onRefine,
  isRefining,
  onCancel,
  hasSelection,
}) => {
  return (
    <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg max-w-2xl mx-auto text-left transition-all duration-300 ease-in-out">
      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
             <label htmlFor="refinement-prompt" className="block text-sm font-medium text-slate-300">
              Describe a small correction or addition:
            </label>
            {hasSelection && (
                <div className="flex items-center gap-1 text-xs text-cyan-400">
                    <CheckIcon className="w-4 h-4" />
                    <span>Area Selected</span>
                </div>
            )}
          </div>
          <textarea
            id="refinement-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'Make the lamp on the side table taller' or 'Fix the leg of the chair'"
            rows={2}
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-white placeholder-slate-400"
            disabled={isRefining}
          />
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isRefining}
            className="w-full sm:w-auto bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onRefine}
            disabled={isRefining || !prompt.trim()}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isRefining ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Refining...
              </>
            ) : (
              <>
                <WrenchScrewdriverIcon className="w-5 h-5" />
                Refine
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};