import React, { useState } from 'react';
import { ImageData } from '../types';
import { ArrowLeftRightIcon } from './icons';

interface ImageComparatorProps {
  beforeImage: ImageData;
  afterImage: ImageData;
}

export const ImageComparator: React.FC<ImageComparatorProps> = ({ beforeImage, afterImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  const beforeSrc = `data:${beforeImage.mimeType};base64,${beforeImage.data}`;
  const afterSrc = `data:${afterImage.mimeType};base64,${afterImage.data}`;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
       <div 
        className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-slate-700 select-none group"
        style={{ touchAction: 'none' }}
      >
        {/* Before Image */}
        <div className="absolute inset-0">
          <img src={beforeSrc} alt="Before" className="w-full h-full object-contain" draggable={false}/>
          <div className="absolute top-2 left-2 bg-black/50 text-white text-sm font-bold px-2 py-1 rounded">BEFORE</div>
        </div>

        {/* After Image (clipped) */}
        <div 
          className="absolute inset-0 overflow-hidden" 
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img src={afterSrc} alt="After" className="w-full h-full object-contain" draggable={false}/>
          <div className="absolute top-2 right-2 bg-black/50 text-white text-sm font-bold px-2 py-1 rounded">AFTER</div>
        </div>
        
        {/* Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-cyan-400 cursor-ew-resize pointer-events-none"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-400 text-white p-2 rounded-full shadow-lg border-2 border-slate-900">
            <ArrowLeftRightIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Slider Input */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-full cursor-ew-resize opacity-0"
          aria-label="Image comparison slider"
        />
      </div>
      <div className="text-center text-slate-400 text-sm">
        Slide the handle to compare the before and after images.
      </div>
    </div>
  );
};