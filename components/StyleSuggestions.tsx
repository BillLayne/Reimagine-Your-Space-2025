import React from 'react';
import { StyleSuggestion } from '../types';
import { LightBulbIcon, ArrowPathIcon } from './icons';

interface StyleSuggestionsProps {
  suggestions: StyleSuggestion[];
  isLoading: boolean;
  onSuggestionClick: (prompt: string) => void;
  onRefreshSuggestions: () => void;
}

const SuggestionSkeleton: React.FC = () => (
  <div className="animate-pulse flex-1 min-w-[120px] p-3 bg-slate-800 rounded-lg">
    <div className="h-4 bg-slate-700 rounded w-3/4"></div>
  </div>
);

export const StyleSuggestions: React.FC<StyleSuggestionsProps> = ({
  suggestions,
  isLoading,
  onSuggestionClick,
  onRefreshSuggestions,
}) => {
  if (isLoading && suggestions.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <LightBulbIcon className="w-5 h-5 text-yellow-300" />
          <h3 className="text-lg font-semibold text-slate-300">Getting Inspired...</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mb-2">
          <SuggestionSkeleton />
          <SuggestionSkeleton />
          <SuggestionSkeleton />
        </div>
      </div>
    );
  }

  if (suggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LightBulbIcon className="w-5 h-5 text-yellow-300" />
          <h3 className="text-lg font-semibold text-slate-300">Get Inspired</h3>
        </div>
        <button
          onClick={onRefreshSuggestions}
          disabled={isLoading}
          className="p-1.5 text-slate-400 rounded-md hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Refresh suggestions"
        >
          <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-3">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.name}
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className="text-left p-3 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700 hover:border-cyan-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <p className="font-semibold text-cyan-400">{suggestion.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
};