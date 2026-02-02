'use client';

import { useEmulator } from '@/hooks/use-emulator';
import type { EmulatorConfig, GBAButton } from '@/lib/types/emulator';
import { cn } from '@/lib/utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Pause, 
  Play,
  Camera
} from 'lucide-react';
import { useState, useCallback, useImperativeHandle, forwardRef } from 'react';

export interface EmulatorDisplayRef {
  pressButton: (button: GBAButton) => void;
  captureFrame: () => void;
  pause: () => void;
  resume: () => void;
  readMemory: (address: number, length: number) => void;
}

interface EmulatorDisplayProps {
  agentId: string;
  config: EmulatorConfig;
  modelName?: string;
  modelColor?: string;
  onFrame?: (frame: string, timestamp: number) => void;
  onReady?: () => void;
  onMemoryData?: (data: { address?: number; data?: number[]; message?: string }) => void;
  className?: string;
}

export const EmulatorDisplay = forwardRef<EmulatorDisplayRef, EmulatorDisplayProps>(
  function EmulatorDisplay({
    agentId,
    config,
    modelName = 'AI Agent',
    modelColor = 'bg-primary',
    onFrame,
    onReady,
    onMemoryData,
    className,
  }, ref) {
  const [isMuted, setIsMuted] = useState(config.muted ?? true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    iframeRef,
    status,
    lastFrame,
    captureFrame,
    pressButton,
    setVolume,
    pause,
    resume,
    readMemory,
    iframeSrc,
  } = useEmulator({
    agentId,
    config,
    onFrame,
    onReady,
    onError: (msg) => console.error(`[emulator:${agentId}] Error:`, msg),
    onMemoryData,
  });

  // Debug logging for status changes (commented out for production)
  // console.log(`[emulator:${agentId}] Status: ${status}, iframeSrc: ${iframeSrc.slice(0, 50)}...`);

  // Expose methods via ref for parent control
  useImperativeHandle(ref, () => ({
    pressButton,
    captureFrame,
    pause,
    resume,
    readMemory,
  }), [pressButton, captureFrame, pause, resume, readMemory]);

  const handleMuteToggle = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    // When unmuting, set to 60% volume (0.6)
    setVolume(newMuted ? 0 : 0.6);
  }, [isMuted, setVolume]);

  const handleFullscreen = useCallback(() => {
    const container = iframeRef.current?.parentElement?.parentElement;
    if (!container) return;

    if (!isFullscreen) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen, iframeRef]);

  // Capture frame and trigger download
  const handleScreenshotDownload = useCallback(() => {
    captureFrame();
    // Wait a moment for the frame to be captured, then download
    setTimeout(() => {
      // Validate frame is a proper data URL string with sufficient length
      if (typeof lastFrame === 'string' && 
          lastFrame.startsWith('data:image/') && 
          lastFrame.length > 1000) {
        const link = document.createElement('a');
        link.href = lastFrame;
        link.download = `screenshot-${agentId}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // console.log(`[emulator:${agentId}] Screenshot downloaded`, { frameSize: lastFrame.length });
      } else {
        // console.warn(`[emulator:${agentId}] No valid frame to download`);
      }
    }, 300);
  }, [captureFrame, lastFrame, agentId]);

  const handlePauseResume = useCallback(() => {
    if (status === 'running') {
      pause();
    } else if (status === 'paused') {
      resume();
    }
  }, [status, pause, resume]);

  const statusLabel = {
    initializing: 'Initializing...',
    loading: 'Loading ROM...',
    ready: 'Ready',
    running: 'Running',
    paused: 'Paused',
    error: 'Error',
  }[status];

  return (
    <div className={cn('relative rounded-lg overflow-hidden border border-border bg-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={cn('w-3 h-3 rounded-full', modelColor)} />
          <span className="font-medium text-sm">{modelName}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleScreenshotDownload}
            title="Download Screenshot"
          >
            <Camera className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handlePauseResume}
            disabled={status !== 'running' && status !== 'paused'}
            title={status === 'running' ? 'Pause' : 'Resume'}
          >
            {status === 'running' ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleMuteToggle}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="h-3.5 w-3.5" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleFullscreen}
            title="Fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Emulator */}
      <AspectRatio ratio={16 / 9}>
        <div className="relative w-full h-full">
          {/* Always render iframe so it can initialize */}
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            className={cn(
              "w-full h-full border-0 transition-opacity duration-300",
              status === 'initializing' || status === 'loading' ? 'opacity-0' : 'opacity-100'
            )}
            allow="autoplay; fullscreen"
            title={`Emulator - ${agentId}`}
            // onLoad={() => console.log(`[emulator:${agentId}] iframe onLoad fired`)}
            // onError={(e) => console.error(`[emulator:${agentId}] iframe onError`, e)}
          />
          {/* Overlay skeleton while loading */}
          {(status === 'initializing' || status === 'loading') && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-center space-y-2">
                <Skeleton className="w-16 h-16 mx-auto rounded" />
                <p className="text-sm text-muted-foreground">Loading EmulatorJS...</p>
              </div>
            </div>
          )}
        </div>
      </AspectRatio>

      {/* Last Frame Preview (debug) */}
      {lastFrame && process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-2 right-2 w-16 h-12 border border-border rounded overflow-hidden opacity-50 hover:opacity-100 transition-opacity">
          <img src={lastFrame || "/placeholder.svg"} alt="Last captured frame" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
});
