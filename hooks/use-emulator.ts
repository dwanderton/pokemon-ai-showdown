'use client';

import React from "react"

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEffectEvent } from 'react';
import type { 
  EmulatorCommand, 
  EmulatorConfig, 
  EmulatorEvent, 
  EmulatorStatus,
  GBAButton 
} from '@/lib/types/emulator';

interface UseEmulatorOptions {
  agentId: string;
  config: EmulatorConfig;
  onFrame?: (frame: string, timestamp: number) => void;
  onReady?: () => void;
  onGameStart?: () => void;
  onError?: (message: string) => void;
  onMemoryData?: (data: { address?: number; data?: number[]; message?: string }) => void;
}

interface UseEmulatorReturn {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  status: EmulatorStatus;
  lastFrame: string | null;
  pressButton: (button: GBAButton) => void;
  holdButton: (button: GBAButton) => void;
  releaseButton: (button: GBAButton) => void;
  captureFrame: () => void;
  saveState: () => Promise<string | null>;
  loadState: (state: string) => void;
  setVolume: (volume: number) => void;
  pause: () => void;
  resume: () => void;
  readMemory: (address: number, length: number) => void;
  iframeSrc: string;
}

export function useEmulator({
  agentId,
  config,
  onFrame,
  onReady,
  onGameStart,
  onError,
  onMemoryData,
}: UseEmulatorOptions): UseEmulatorReturn {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [status, setStatus] = useState<EmulatorStatus>('initializing');
  const [lastFrame, setLastFrame] = useState<string | null>(null);
  const saveStateResolverRef = useRef<((state: string | null) => void) | null>(null);

  // Simple iframe URL - config will be sent via postMessage
  const iframeSrc = `/emulator/index.html`;
  const configSentRef = useRef(false);
  
  // console.log(`[hook:useEmulator:${agentId}] Hook initialized`, { romUrl: config.romUrl });

  // Stable callback for frame events (React 19.2 useEffectEvent)
  const handleFrame = useEffectEvent((frame: string, timestamp: number) => {
    // console.log(`[hook:useEmulator:${agentId}] Frame received`, { size: frame.length, timestamp });
    setLastFrame(frame);
    onFrame?.(frame, timestamp);
  });

  const handleReady = useEffectEvent(() => {
    // console.log(`[hook:useEmulator:${agentId}] Ready event received`);
    setStatus('ready');
    onReady?.();
  });

  const handleGameStart = useEffectEvent(() => {
    // console.log(`[hook:useEmulator:${agentId}] Game started`);
    setStatus('running');
    onGameStart?.();
  });

  const handleError = useEffectEvent((message: string) => {
    // console.error(`[hook:useEmulator:${agentId}] Error:`, message);
    setStatus('error');
    onError?.(message);
  });

  const handleMemoryData = useEffectEvent((data: { address?: number; data?: number[]; message?: string }) => {
    // console.log(`[hook:useEmulator:${agentId}] Memory data received`, data);
    onMemoryData?.(data);
  });

  // Listen for messages from iframe
  useEffect(() => {
    // console.log(`[hook:useEmulator:${agentId}] Setting up message listener`);
    
    function handleMessage(event: MessageEvent<EmulatorEvent & { agentId?: string; type: string }>) {
      // Handle IFRAME_READY (no agentId yet)
      if (event.data.type === 'IFRAME_READY' && !configSentRef.current) {
        // console.log(`[hook:useEmulator:${agentId}] Received IFRAME_READY, sending CONFIG`);
        configSentRef.current = true;
        setStatus('loading');
        
        // Send config to iframe
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'CONFIG',
            romUrl: config.romUrl,
            volume: config.muted ? 0 : (config.volume ?? 0.5),
            muted: config.muted ?? true,
            agentId: agentId,
          }, '*');
        }
        return;
      }
      
      // Only process other messages from our iframe
      if (event.data.agentId !== agentId) return;
      
      // console.log(`[hook:useEmulator:${agentId}] Received message:`, event.data.type);

      switch (event.data.type) {
        case 'READY':
          handleReady();
          break;
        case 'GAME_STARTED':
          handleGameStart();
          break;
        case 'FRAME_DATA':
          // Handle different frame formats
          let frameString: string | null = null;
          
          if (typeof event.data.frame === 'string' && event.data.frame.length > 0) {
            frameString = event.data.frame;
          } else if (event.data.frame instanceof Uint8Array || 
                     (event.data.frame && typeof event.data.frame === 'object' && event.data.frame.length)) {
            // Convert Uint8Array or array-like object to base64 data URL
            try {
              const bytes = event.data.frame instanceof Uint8Array 
                ? event.data.frame 
                : new Uint8Array(Object.values(event.data.frame));
              const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
              const base64 = btoa(binary);
              frameString = `data:image/png;base64,${base64}`;
            } catch (_e) {
              // console.error(`[hook:useEmulator:${agentId}] Failed to convert frame array:`, e);
            }
          }
          
          if (frameString && frameString.length > 100) {
            handleFrame(frameString, event.data.timestamp);
          } else {
            // console.warn(`[hook:useEmulator:${agentId}] Could not process frame data`);
          }
          break;
        case 'STATE_SAVED':
          if (saveStateResolverRef.current) {
            saveStateResolverRef.current(event.data.state);
            saveStateResolverRef.current = null;
          }
          break;
        case 'BUTTON_PRESSED':
          console.log(`[hook:useEmulator:${agentId}] Button press confirmed:`, event.data.button);
          break;
        case 'BUTTON_ERROR':
          console.error(`[hook:useEmulator:${agentId}] Button press failed:`, event.data.button, event.data.error);
          break;
        case 'ERROR':
          handleError(event.data.message);
          break;
        case 'MEMORY_DATA':
          handleMemoryData({ address: event.data.address, data: event.data.data });
          break;
        case 'MEMORY_NOT_AVAILABLE':
          handleMemoryData({ message: event.data.message });
          break;
        case 'MEMORY_ERROR':
          handleMemoryData({ message: `Error: ${event.data.message}` });
          break;
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [agentId, config.romUrl, config.volume, handleFrame, handleReady, handleGameStart, handleError, handleMemoryData]);

  // Send command to iframe
  const sendCommand = useCallback((command: EmulatorCommand) => {
    if (iframeRef.current?.contentWindow) {
      console.log(`[hook:useEmulator:${agentId}] Sending command:`, command.type, command);
      iframeRef.current.contentWindow.postMessage(command, '*');
    } else {
      console.warn(`[hook:useEmulator:${agentId}] Cannot send command - no iframe contentWindow`, command.type);
    }
  }, [agentId]);

  // Press and release a button (for single inputs)
  const pressButton = useCallback((button: GBAButton) => {
    sendCommand({ type: 'PRESS_AND_RELEASE', button, duration: 100 });
  }, [sendCommand]);

  // Hold a button down
  const holdButton = useCallback((button: GBAButton) => {
    sendCommand({ type: 'INPUT', button, action: 'press' });
  }, [sendCommand]);

  // Release a held button
  const releaseButton = useCallback((button: GBAButton) => {
    sendCommand({ type: 'INPUT', button, action: 'release' });
  }, [sendCommand]);

  // Capture current frame
  const captureFrame = useCallback(() => {
    sendCommand({ type: 'CAPTURE_FRAME' });
  }, [sendCommand]);

  // Save state and return it
  const saveState = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      saveStateResolverRef.current = resolve;
      sendCommand({ type: 'SAVE_STATE' });
      // Timeout after 5 seconds
      setTimeout(() => {
        if (saveStateResolverRef.current) {
          saveStateResolverRef.current(null);
          saveStateResolverRef.current = null;
        }
      }, 5000);
    });
  }, [sendCommand]);

  // Load a saved state
  const loadState = useCallback((state: string) => {
    sendCommand({ type: 'LOAD_STATE', state });
  }, [sendCommand]);

  // Set volume (0-1)
  const setVolume = useCallback((volume: number) => {
    sendCommand({ type: 'SET_VOLUME', volume: Math.max(0, Math.min(1, volume)) });
  }, [sendCommand]);

  // Pause emulation
  const pause = useCallback(() => {
    sendCommand({ type: 'PAUSE' });
    setStatus('paused');
  }, [sendCommand]);

  // Resume emulation
  const resume = useCallback(() => {
    sendCommand({ type: 'RESUME' });
    setStatus('running');
  }, [sendCommand]);

  // Read memory from emulator (for game state)
  const readMemory = useCallback((address: number, length: number) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'READ_MEMORY',
        address,
        length,
      }, '*');
    }
  }, []);

  return {
    iframeRef,
    status,
    lastFrame,
    pressButton,
    holdButton,
    releaseButton,
    captureFrame,
    saveState,
    loadState,
    setVolume,
    pause,
    resume,
    readMemory,
    iframeSrc,
  };
}
