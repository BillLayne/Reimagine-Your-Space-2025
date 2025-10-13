import React from 'react';
import { CheckIcon } from './icons';

interface PromptChecklistProps {
  prompt: string;
}

interface Task {
  title: string;
  description: string;
}

const parsePrompt = (prompt: string): Task[] => {
  const tasks: Task[] = [];
  const triggerPhrase = "Apply the following distinct changes to the image:";
  if (!prompt.trim().startsWith(triggerPhrase)) {
    return [];
  }

  const lines = prompt.substring(triggerPhrase.length).trim().split('\n');
  
  lines.forEach(line => {
    // Regex to match "1. Walls: Repaint..."
    const match = line.match(/^\d+\.\s*([^:]+):\s*(.*)$/);
    if (match) {
      tasks.push({
        title: match[1].trim(),
        description: match[2].trim(),
      });
    }
  });

  return tasks;
};

export const PromptChecklist: React.FC<PromptChecklistProps> = ({ prompt }) => {
  const tasks = parsePrompt(prompt);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 p-3 bg-slate-900/50 border border-slate-700 rounded-md">
      <h4 className="text-sm font-semibold text-slate-400">Your AI Task List:</h4>
      <ul className="space-y-2">
        {tasks.map((task, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckIcon className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-200">{task.title}</p>
              <p className="text-sm text-slate-400">{task.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};