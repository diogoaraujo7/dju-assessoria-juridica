import React, { useState, useEffect, useRef } from 'react';

export const CustomSlider = ({ min, max, value, onChange, onCommit }: { min: number, max: number, value: number, onChange: (v: number) => void, onCommit?: (v: number) => void }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (trackRef.current && e.target === trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const range = max - min;
      const newValue = Math.round(min + percent * range);
      if (newValue !== localValue) {
        setLocalValue(newValue);
        onChange(newValue);
      }
    }
    
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const range = max - min;
    const newValue = Math.round(min + percent * range);
    if (newValue !== localValue) {
      setLocalValue(newValue);
      onChange(newValue);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    if (onCommit) onCommit(localValue);
  };

  const percent = ((localValue - min) / (max - min)) * 100;

  const ticks = [];
  for (let i = min; i <= max; i++) {
    const tickPercent = ((i - min) / (max - min)) * 100;
    ticks.push(
      <div 
        key={i} 
        className="absolute w-1 h-1 bg-slate-400 rounded-full pointer-events-none z-0"
        style={{ left: `calc(${tickPercent}% - 2px)` }}
      />
    );
  }

  return (
    <div 
      className="relative w-full h-6 flex items-center cursor-pointer" 
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="absolute w-full h-1.5 bg-slate-200 rounded-full pointer-events-none"></div>
      
      {ticks}
      
      <div 
        className="absolute h-5 w-3.5 bg-blue-600 rounded shadow cursor-grab active:cursor-grabbing hover:bg-blue-500 transition-colors flex flex-col items-center justify-center gap-[2px] z-10"
        style={{ left: `calc(${percent}% - 7px)`, touchAction: 'none' }}
      >
        <div className="w-0.5 h-1 bg-white/60 rounded-full pointer-events-none"></div>
        <div className="w-0.5 h-1 bg-white/60 rounded-full pointer-events-none"></div>
      </div>
    </div>
  );
};
