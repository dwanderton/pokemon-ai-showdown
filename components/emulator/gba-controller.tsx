'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { GBAButton } from '@/lib/types/emulator';

interface GBAControllerProps {
  lastButton?: GBAButton | null;
  pressCount?: number; // Increment this to force highlight even for same button
  className?: string;
}

export function GBAController({ lastButton, pressCount = 0, className }: GBAControllerProps) {
  const [activeButton, setActiveButton] = useState<GBAButton | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // When lastButton or pressCount changes, show it briefly then fade out
  // pressCount allows re-triggering when same button is pressed multiple times
  useEffect(() => {
    if (lastButton) {
      setActiveButton(lastButton);
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Fade out after 400ms
      timeoutRef.current = setTimeout(() => {
        setActiveButton(null);
      }, 400);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [lastButton, pressCount]);

  const isActive = (button: GBAButton) => activeButton === button;

  return (
    <div className={cn('flex items-center justify-between px-4 py-3 bg-zinc-800 rounded-lg', className)}>
      {/* D-Pad */}
      <div className="relative w-20 h-20">
        {/* UP */}
        <div
          className={cn(
            'absolute top-0 left-1/2 -translate-x-1/2 w-6 h-7 rounded-t-sm transition-all duration-100',
            isActive('UP') ? 'bg-white shadow-lg shadow-white/60 scale-105' : 'bg-zinc-600'
          )}
        />
        {/* DOWN */}
        <div
          className={cn(
            'absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-7 rounded-b-sm transition-all duration-100',
            isActive('DOWN') ? 'bg-white shadow-lg shadow-white/60 scale-105' : 'bg-zinc-600'
          )}
        />
        {/* LEFT */}
        <div
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 w-7 h-6 rounded-l-sm transition-all duration-100',
            isActive('LEFT') ? 'bg-white shadow-lg shadow-white/60 scale-105' : 'bg-zinc-600'
          )}
        />
        {/* RIGHT */}
        <div
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 w-7 h-6 rounded-r-sm transition-all duration-100',
            isActive('RIGHT') ? 'bg-white shadow-lg shadow-white/60 scale-105' : 'bg-zinc-600'
          )}
        />
        {/* Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-zinc-700 rounded-sm" />
      </div>

      {/* Middle section - SELECT / START */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'w-10 h-3 rounded-full transition-all duration-100',
                isActive('SELECT') ? 'bg-white shadow-lg shadow-white/60 scale-110' : 'bg-zinc-600'
              )}
            />
            <span className="text-[8px] text-zinc-500 uppercase">Select</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'w-10 h-3 rounded-full transition-all duration-100',
                isActive('START') ? 'bg-white shadow-lg shadow-white/60 scale-110' : 'bg-zinc-600'
              )}
            />
            <span className="text-[8px] text-zinc-500 uppercase">Start</span>
          </div>
        </div>
        {/* WAIT indicator */}
        {activeButton === 'WAIT' && (
          <div className="px-2 py-0.5 bg-yellow-400 border border-yellow-300 rounded text-[10px] text-yellow-900 font-bold shadow-lg shadow-yellow-400/50">
            WAIT
          </div>
        )}
      </div>

      {/* A/B Buttons */}
      <div className="relative w-20 h-20">
        {/* B Button */}
        <div
          className={cn(
            'absolute bottom-2 left-1 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-100',
            isActive('B') ? 'bg-red-400 shadow-lg shadow-red-400/70 text-white scale-110' : 'bg-red-700 text-red-300'
          )}
        >
          B
        </div>
        {/* A Button */}
        <div
          className={cn(
            'absolute top-2 right-1 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-100',
            isActive('A') ? 'bg-red-400 shadow-lg shadow-red-400/70 text-white scale-110' : 'bg-red-700 text-red-300'
          )}
        >
          A
        </div>
      </div>

      {/* L/R Shoulder buttons - small indicators at top */}
      <div className="absolute -top-1 left-4 right-4 flex justify-between">
        <div
          className={cn(
            'px-3 py-1 rounded-b-md text-[10px] font-bold transition-all duration-100',
            isActive('L') ? 'bg-white shadow-lg shadow-white/60 text-zinc-900 scale-110' : 'bg-zinc-700 text-zinc-400'
          )}
        >
          L
        </div>
        <div
          className={cn(
            'px-3 py-1 rounded-b-md text-[10px] font-bold transition-all duration-100',
            isActive('R') ? 'bg-white shadow-lg shadow-white/60 text-zinc-900 scale-110' : 'bg-zinc-700 text-zinc-400'
          )}
        >
          R
        </div>
      </div>
    </div>
  );
}
