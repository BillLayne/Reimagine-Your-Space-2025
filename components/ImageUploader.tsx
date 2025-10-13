import React, { useRef } from 'react';
import { ImageData } from '../types';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  currentImage: ImageData;
  onImageUpload: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImage,
  onImageUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageUpload(event.target.files[0]);
    }
  };

  const handleOverlayClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-slate-300">Base Image</h3>
       {/* Use a widescreen aspect ratio to better fit landscape room photos */}
      <div className="relative group rounded-lg overflow-hidden border-2 border-slate-700 aspect-video bg-slate-900">
        <img
          src={`data:${currentImage.mimeType};base64,${currentImage.data}`}
          alt="Current room"
          className="w-full h-full object-contain"
        />
        <div
          onClick={handleOverlayClick}
          className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
        >
          <UploadIcon className="w-8 h-8 mb-2" />
          <span className="font-semibold text-center px-2">Upload New Image</span>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
      </div>
    </div>
  );
};