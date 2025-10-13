import React, { useRef, useEffect, useState } from 'react';
import { ImageData } from '../types';
import { XCircleIcon } from './icons';

interface VisualRefinementCanvasProps {
  targetRef: React.RefObject<HTMLElement>;
  onMaskChange: (mask: ImageData | null) => void;
}

export const VisualRefinementCanvas: React.FC<VisualRefinementCanvasProps> = ({ targetRef, onMaskChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);

  const getCanvas = () => canvasRef.current;
  const getContext = () => getCanvas()?.getContext('2d');

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = getCanvas();
      const target = targetRef.current;
      if (canvas && target) {
        const imageComparator = target.querySelector('.relative.w-full.aspect-video');
        if (imageComparator) {
            canvas.width = imageComparator.clientWidth;
            canvas.height = imageComparator.clientHeight;
        } else {
            canvas.width = target.clientWidth;
            canvas.height = target.clientHeight;
        }
        
        const ctx = getContext();
        if (ctx) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 20;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }
    };

    // Initial resize might need a slight delay to wait for image to render
    setTimeout(resizeCanvas, 100);
    window.addEventListener('resize', resizeCanvas);
    
    // Also observe the target for size changes (e.g., responsive layout shifts)
    const observer = new ResizeObserver(resizeCanvas);
    if (targetRef.current) {
        observer.observe(targetRef.current);
    }

    return () => {
        window.removeEventListener('resize', resizeCanvas);
        if (targetRef.current) {
            observer.unobserve(targetRef.current);
        }
    }
  }, [targetRef]);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = getCanvas();
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = getContext();
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = getContext();
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = getContext();
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
    
    const canvas = getCanvas();
    if (canvas) {
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      const maskCtx = maskCanvas.getContext('2d');
      if (maskCtx) {
        maskCtx.fillStyle = 'black';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
            tempCtx.drawImage(canvas, 0, 0);
            maskCtx.drawImage(tempCanvas, 0, 0);
            maskCtx.globalCompositeOperation = 'source-in';
            maskCtx.fillStyle = 'white';
            maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        }
        
        const dataUrl = maskCanvas.toDataURL('image/png');
        const [, data] = dataUrl.split(',');
        onMaskChange({ data, mimeType: 'image/png' });
      }
    }
  };

  const clearCanvas = () => {
    const canvas = getCanvas();
    const ctx = getContext();
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onMaskChange(null);
      setHasDrawing(false);
    }
  };

  return (
    <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
      <canvas
        ref={canvasRef}
        className="pointer-events-auto cursor-crosshair"
        style={{ touchAction: 'none' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="absolute top-2 left-2 right-2 p-2 bg-black/60 rounded-lg text-center text-sm text-white pointer-events-none animate-pulse z-10">
        Click or draw on the area you want to change
      </div>
       {hasDrawing && (
         <button
          onClick={clearCanvas}
          className="absolute bottom-2 right-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full transition-colors duration-200 flex items-center justify-center gap-2 pointer-events-auto z-10"
          aria-label="Clear selection"
        >
          <XCircleIcon className="w-6 h-6" />
          Clear Selection
        </button>
       )}
    </div>
  );
};