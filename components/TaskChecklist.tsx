import React from 'react';
import { ParsedTask } from '../types';
import { CheckIcon, SparklesIcon } from './icons';

interface TaskChecklistProps {
  tasks: ParsedTask[];
  isParsing: boolean;
}

const TaskSkeleton: React.FC = () => (
    <div className="animate-pulse flex items-start gap-3">
        <div className="w-5 h-5 bg-slate-700 rounded-full mt-1 flex-shrink-0"></div>
        <div className="w-full">
            <div className="h-4 bg-slate-700 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-slate-700 rounded w-3/4"></div>
        </div>
    </div>
);

export const TaskChecklist: React.FC<TaskChecklistProps> = ({ tasks, isParsing }) => {
  if (isParsing) {
    return (
        <div className="space-y-3 p-3 bg-slate-900/50 border border-slate-700 rounded-md">
            <h4 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
                Understanding your request...
            </h4>
            <div className="space-y-3">
                <TaskSkeleton />
            </div>
        </div>
    );
  }

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 p-3 bg-slate-900/50 border border-slate-700 rounded-md">
      <h4 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
        <SparklesIcon className="w-5 h-5 text-violet-400" />
        Ok, here's the plan:
      </h4>
      <ul className="space-y-2">
        {tasks.map((task, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckIcon className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-200">{task.item}</p>
              <p className="text-sm text-slate-400">{task.change}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
