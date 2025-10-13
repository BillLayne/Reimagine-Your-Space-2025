import React from 'react';
import { SparklesIcon, ArrowPathIcon, MagicWandIcon, ChevronUpIcon, ChevronDownIcon } from './icons';
import { PromptChecklist } from './PromptChecklist';
import { TaskChecklist } from './TaskChecklist';
import { ParsedTask } from '../types';

interface PromptControlsProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  onStartOver: () => void;
  onPlanAndEnhance: () => void;
  isLoading: boolean;
  isPlanning: boolean;
  isParsing: boolean;
  tasks: ParsedTask[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const PromptControls: React.FC<PromptControlsProps> = ({
  prompt,
  setPrompt,
  onGenerate,
  onStartOver,
  onPlanAndEnhance,
  isLoading,
  isPlanning,
  isParsing,
  tasks,
  isExpanded,
  onToggleExpand,
}) => {
  const isBusy = isLoading || isPlanning;

  return (
    <div className="space-y-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg lg:bg-transparent lg:border-none lg:p-0">
      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="prompt" className="block text-lg font-semibold text-slate-300">
            Describe Your Changes
          </label>
          {onToggleExpand && (
            <button 
              onClick={onToggleExpand}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
              aria-label={isExpanded ? "Collapse controls" : "Expand controls"}
            >
              {isExpanded ? <ChevronDownIcon className="w-6 h-6" /> : <ChevronUpIcon className="w-6 h-6" />}
            </button>
          )}
        </div>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., 'Change wall color to sage green...'"
          rows={4}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors text-white placeholder-slate-400"
          disabled={isBusy}
        />
        <p className="hidden lg:block text-xs text-slate-500 mt-2">
          Tip: Type a simple idea and click "Plan & Enhance" for better results.
        </p>
      </div>
      
      <TaskChecklist tasks={tasks} isParsing={isParsing} />
      <PromptChecklist prompt={prompt} />

      <div className="flex flex-col gap-3">
         <button
          onClick={onPlanAndEnhance}
          disabled={isBusy || !prompt.trim()}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isPlanning ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Planning...
            </>
          ) : (
            <>
              <MagicWandIcon className="w-6 h-6" />
              Plan & Enhance
            </>
          )}
        </button>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onGenerate}
            disabled={isBusy || !prompt.trim()}
            className="flex-grow w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="w-6 h-6" />
                Generate
              </>
            )}
          </button>
          <button
            onClick={onStartOver}
            disabled={isBusy}
            className="w-full sm:w-auto bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <ArrowPathIcon className="w-5 h-5" />
            <span className="lg:hidden">Start Over</span>
          </button>
        </div>
      </div>
    </div>
  );
};
