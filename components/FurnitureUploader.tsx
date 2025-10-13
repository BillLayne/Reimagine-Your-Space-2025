import React, { useRef } from 'react';
import { ImageData } from '../types';
import { UploadIcon, XCircleIcon } from './icons';

interface FurnitureUploaderProps {
  furnitureImages: ImageData[];
  onFurnitureUpload: (files: File[]) => void;
  onRemoveFurniture: (index: number) => void;
  onClearAll: () => void;
  disabled?: boolean;
}

export const FurnitureUploader: React.FC<FurnitureUploaderProps> = ({
  furnitureImages,
  onFurnitureUpload,
  onRemoveFurniture,
  onClearAll,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFurnitureUpload(filesArray);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-300">
          Furniture & Decor Images
        </h3>
        {furnitureImages.length > 0 && (
          <button
            onClick={onClearAll}
            disabled={disabled}
            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUploadClick}
        disabled={disabled}
        className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <UploadIcon className="w-5 h-5" />
        Upload Furniture/Decor
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Image Gallery */}
      {furnitureImages.length > 0 && (
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 bg-slate-800/30 rounded-lg border border-slate-700">
          {furnitureImages.map((img, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border border-slate-600"
            >
              <img
                src={`data:${img.mimeType};base64,${img.data}`}
                alt={`Furniture ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onRemoveFurniture(index)}
                disabled={disabled}
                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                aria-label={`Remove furniture image ${index + 1}`}
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 px-2 text-center">
                Item {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {furnitureImages.length === 0 && (
        <div className="text-center text-slate-400 text-sm py-4 bg-slate-800/30 rounded-lg border border-slate-700">
          No furniture images uploaded yet
        </div>
      )}
    </div>
  );
};