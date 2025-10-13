import React, { useRef } from 'react';
import { UploadIcon, SparklesIcon, EyeIcon } from './icons';

interface HeroProps {
  onImageUpload: (file: File) => void;
  isLoading: boolean;
}

export const Hero: React.FC<HeroProps> = ({ onImageUpload, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageUpload(event.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="text-center py-16 px-4">
      <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
        Reimagine Your Space in Seconds
      </h2>
      <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10">
        Upload a photo of your room, describe the changes you want, and let AI bring your vision to life. It's home design, simplified.
      </p>
      
      <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 mb-12 text-left">
        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
          <UploadIcon className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="font-bold text-lg mb-2">1. Upload a Photo</h3>
          <p className="text-slate-400">Start with a clear, well-lit picture of any room you want to transform.</p>
        </div>
        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
          <SparklesIcon className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="font-bold text-lg mb-2">2. Describe Your Vision</h3>
          <p className="text-slate-400">Want sage green walls? A new sofa? Simply type your request in plain English.</p>
        </div>
        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
          <EyeIcon className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="font-bold text-lg mb-2">3. See the Magic</h3>
          <p className="text-slate-400">Our AI redesigns your room instantly, keeping the original layout perfectly intact.</p>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      <button
        onClick={handleButtonClick}
        disabled={isLoading}
        className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Processing...
          </>
        ) : (
          <>
            <UploadIcon className="w-6 h-6" />
            Upload Your Room Photo
          </>
        )}
      </button>
    </div>
  );
};
