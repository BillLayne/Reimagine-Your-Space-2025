
import React from 'react';
import { ExclamationTriangleIcon } from './icons';

interface ConfirmationModalProps {
  title: string;
  children: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  children,
  onConfirm,
  onCancel,
  confirmText = "Continue Anyway",
  cancelText = "Cancel",
}) => {
  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500/10 p-2 rounded-full">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />
          </div>
          <h2 id="modal-title" className="text-xl font-bold text-white">{title}</h2>
        </div>
        <p className="text-slate-300">
          {children}
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-md transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-md transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
