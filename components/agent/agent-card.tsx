'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { EmulatorDisplay, type EmulatorDisplayRef } from '@/components/emulator/emulator-display';
import { GBAController } from '@/components/emulator/gba-controller';
import type { GBAButton } from '@/lib/types/emulator';
import { ThoughtsPanel, type DebugLogEntry } from '@/components/agent/thoughts-panel';
import { AgentStats } from '@/components/agent/agent-stats';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { AgentState, AIDecision, ModelId, ButtonConfidenceScores } from '@/lib/types/agent';
import { AGENT_PERSONALITIES, DEFAULT_CONFIDENCE_SCORES } from '@/lib/types/agent';
import { createClientAgentState } from '@/lib/agent-utils';
import { simpleFrameHash, formatCommandHistoryWithChanges, type FrameHistoryEntry } from '@/lib/game-knowledge';

const ROM_URL = 'https://ziajgo1fa4mooxyp.public.blob.vercel-storage.com/2026/2026-01-22_leaf-green.gba';

const AVAILABLE_MODELS: { id: ModelId; name: string }[] = [
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'openai/gpt-4.1', name: 'GPT-4.1' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4' },
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4' },
  { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'xai/grok-3', name: 'Grok 3' },
  { id: 'xai/grok-3-mini', name: 'Grok 3 Mini' },
];

// Game loop interval (ms between AI decisions)
const GAME_LOOP_INTERVAL = 3000; // 3 seconds between decisions

interface AgentCardProps {
  agentId: string;
  className?: string;
  onDecision?: (decision: AIDecision) => void;
}

export function AgentCard({ agentId, className, onDecision }: AgentCardProps) {
  const [modelId, setModelId] = useState<ModelId>('openai/gpt-4o');
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>(() => 
    createClientAgentState(agentId, modelId)
  );
  const [currentThought, setCurrentThought] = useState<string>('');
  const [pendingFrame, setPendingFrame] = useState<string | null>(null);
  const [lastFrame, setLastFrame] = useState<string | null>(null);
  const [lastButton, setLastButton] = useState<GBAButton | null>(null);
  const [buttonPressCount, setButtonPressCount] = useState(0); // Increment to force highlight even for same button
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);
  
  // Frame history for multi-image context and change detection
  const [frameHistory, setFrameHistory] = useState<FrameHistoryEntry[]>([]);
  const [recentFrames, setRecentFrames] = useState<string[]>([]); // Last 3 actual frame images
  const lastFrameHashRef = useRef<string | null>(null);
  
  // Confidence scores tracking
  const [confidenceScores, setConfidenceScores] = useState<ButtonConfidenceScores>({ ...DEFAULT_CONFIDENCE_SCORES });
  const lastButtonRef = useRef<string | null>(null);
  // Track consecutive no-change count per button - after 5, we hard-penalize to 20%
  const noChangeCountRef = useRef<Record<string, number>>({});
  // Buttons to avoid (sent to model as warning): buttons with 1-4 consecutive no-changes
  const [buttonsToAvoid, setButtonsToAvoid] = useState<string[]>([]);
  // Buttons banned for next N prompts (button -> prompts remaining)
  const [bannedButtons, setBannedButtons] = useState<Record<string, number>>({});
  // Track total button presses per button
  const buttonPressCountRef = useRef<Record<string, number>>({});
  // Screen analysis from AI model
  const [screenAnalysis, setScreenAnalysis] = useState<string>('');
  // Notes content from Redis
  const [notesContent, setNotesContent] = useState<string>('');
  
  // Dialog history to avoid repetition (last 10 comments)
  const [dialogHistory, setDialogHistory] = useState<string[]>([]);
  
  // Track consecutive button presses to warn model
  const [consecutiveStartSelectCount, setConsecutiveStartSelectCount] = useState(0);
  const [consecutiveWaitCount, setConsecutiveWaitCount] = useState(0);
  const [consecutiveBCount, setConsecutiveBCount] = useState(0);

  // Helper to add debug log entries (commented out for production)
  const addDebugLog = useCallback((_level: 'info' | 'warn' | 'error', _source: string, _message: string, _data?: Record<string, unknown>) => {
    // Debug logging disabled for production
    // setDebugLogs(prev => [...prev.slice(-49), { timestamp: Date.now(), level, source, message, data: data ? JSON.parse(JSON.stringify(data)) : undefined }]);
  }, []);

  const personality = AGENT_PERSONALITIES[agentId] || AGENT_PERSONALITIES['agent-1'];
  const emulatorRef = useRef<EmulatorDisplayRef>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);
  const lastScreenTypeRef = useRef<string>('unknown'); // Declare lastScreenTypeRef here
  
  // Mutex state for game loop - prevents overlapping requests
  const [isProcessing, setIsProcessing] = useState(false);
  const processingLockRef = useRef<Promise<void> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Heartbeat to keep agent alive on server
  useEffect(() => {
    if (!isRunning) {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      return;
    }

    const sendHeartbeat = async () => {
      try {
        await fetch(`/api/agent/${agentId}/heartbeat`, { method: 'POST' });
      } catch (error) {
        // console.error(`[component:AgentCard:${agentId}] Heartbeat failed:`, error);
      }
    };

    // Send initial heartbeat
    sendHeartbeat();
    
    // Send heartbeat every 10 seconds
    heartbeatRef.current = setInterval(sendHeartbeat, 10000);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [isRunning, agentId]);

  // Process a frame through the AI and execute the decision (with mutex)
  const processFrame = useCallback(async (frame: string | null | undefined) => {
    // Validate frame - must be a string, valid data URL with actual image data
    const isValidFrame = typeof frame === 'string' && 
      frame.startsWith('data:image/') && 
      frame.length > 1000; // A real PNG should be much larger than 1KB
    
    // Store this frame for the debug panel (only if valid)
    if (isValidFrame) {
      setLastFrame(frame);
      // Update recent frames (keep last 2 to reduce memory - each frame ~100KB)
      setRecentFrames(prev => {
        // Clear old frames from memory before adding new
        const newFrames = [...prev.slice(-1), frame];
        return newFrames;
      });
    }
    
    if (!isValidFrame) {
      addDebugLog('error', 'AgentCard', 'Invalid or empty frame captured', { 
        frameType: typeof frame,
        frameLength: typeof frame === 'string' ? frame.length : 0,
        startsWithDataImage: typeof frame === 'string' ? frame.startsWith('data:image/') : false 
      });
      toast.error('Frame capture failed', {
        description: 'Unable to capture game screen. Retrying in 2s...',
        duration: 2000,
      });
      // Delay next iteration by 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      return;
    }
    
    // Check if already processing - mutex pattern
    if (isProcessing || processingLockRef.current) {
      addDebugLog('warn', 'AgentCard', 'Skipping frame - already processing');
      return;
    }
    if (!isRunning) {
      addDebugLog('warn', 'AgentCard', 'Skipping frame - agent not running');
      return;
    }

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, 30000); // 30 second timeout

    // Set lock
    let resolveLock: () => void;
    processingLockRef.current = new Promise(r => { resolveLock = r; });
    setIsProcessing(true);

    setAgentState(prev => ({
      ...prev,
      status: 'thinking'
    }));
    setCurrentThought('Analyzing the screen...');

    try {
      // Format command history with change indicators
      const commandHistoryWithChanges = formatCommandHistoryWithChanges(frameHistory, 25);
      
      addDebugLog('info', 'AgentCard', 'Starting AI decision request', { 
        model: modelId,
        previousFrameCount: recentFrames.length,
        frameHistoryCount: frameHistory.length,
      });
      const response = await fetch('/api/agent/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          modelId,
          frame,
          previousFrames: recentFrames.slice(-2), // Send last 2 frames for context
          commandHistoryWithChanges,
          previousConfidenceScores: confidenceScores,
          previousDialogHistory: dialogHistory,
          avoidStartSelect: consecutiveStartSelectCount > 2,
          avoidWait: consecutiveWaitCount >= 3,  // Max 3 WAITs in a row
          avoidB: consecutiveBCount >= 5,        // Max 5 B presses in a row
          buttonsToAvoid,  // Buttons that had no effect recently
          bannedButtons: Object.keys(bannedButtons).filter(b => bannedButtons[b] > 0), // Buttons pressed 10+ times
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get decision: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      addDebugLog('info', 'AgentCard', 'AI decision received', { button: data.decision?.button, confidence: data.decision?.confidence });
      
      // Update thought with personality comment
      const comment = data.decision.personality_comment || '';
      setCurrentThought(comment);
      
      // Update screen analysis from model response
      if (data.decision.screenAnalysis) {
        setScreenAnalysis(data.decision.screenAnalysis);
      }
      
      // Track dialog history (last 10 non-empty comments) to avoid repetition
      if (comment && comment.trim()) {
        setDialogHistory(prev => [...prev.slice(-9), comment]);
      }
      
      // Detect visual change by comparing frame hashes
      const currentHash = simpleFrameHash(frame);
      const visualChange: 'no_change' | 'change_detected' | 'first_frame' = 
        lastFrameHashRef.current === null ? 'first_frame' :
        lastFrameHashRef.current === currentHash ? 'no_change' : 'change_detected';
      lastFrameHashRef.current = currentHash;
      
      // Update frame history with this decision (keep only last 25 to reduce memory)
      setFrameHistory(prev => [...prev.slice(-24), {
        button: data.decision.button,
        reasoning: (data.decision.reasoning || '').slice(0, 200), // Truncate reasoning to save memory
        timestamp: Date.now(),
        frameHash: currentHash,
        visualChange,
      }]);
      
      addDebugLog('info', 'AgentCard', `Visual change: ${visualChange}`, { 
        hash: currentHash,
        previousHash: lastFrameHashRef.current,
      });
      
      // Update confidence scores and track buttons to avoid
      if (data.decision.confidenceScores) {
        const newScores = { ...data.decision.confidenceScores };
        
        if (visualChange === 'no_change' && lastButtonRef.current) {
          const btn = lastButtonRef.current;
          
          // Increment consecutive no-change count for this button
          noChangeCountRef.current[btn] = (noChangeCountRef.current[btn] || 0) + 1;
          const count = noChangeCountRef.current[btn];
          
          // After 5 no-changes, hard-penalize to 20%
          if (count >= 5) {
            newScores[btn as keyof ButtonConfidenceScores] = 0.2;
            addDebugLog('warn', 'AgentCard', `Hard-penalized ${btn} to 20% after ${count} no-changes`);
          }
          
          // Update buttons to avoid list (1-4 consecutive no-changes)
          setButtonsToAvoid(prev => {
            if (count >= 1 && count < 5 && !prev.includes(btn)) {
              return [...prev, btn];
            }
            return prev;
          });
          
          addDebugLog('info', 'AgentCard', `${btn} had no effect (count: ${count})`, {
            buttonsToAvoid: [...buttonsToAvoid, btn].filter((v, i, a) => a.indexOf(v) === i),
          });
        } else if (visualChange === 'change_detected' && lastButtonRef.current) {
          // Reset no-change count and remove from avoid list on successful change
          const btn = lastButtonRef.current;
          if (noChangeCountRef.current[btn]) {
            noChangeCountRef.current[btn] = 0;
          }
          setButtonsToAvoid(prev => prev.filter(b => b !== btn));
        }
        
        setConfidenceScores(newScores);
      }
      lastButtonRef.current = data.decision.button;
      
      // Track consecutive button presses for spam prevention
      const button = data.decision.button;
      if (button === 'START' || button === 'SELECT') {
        setConsecutiveStartSelectCount(prev => prev + 1);
        setConsecutiveWaitCount(0);
        setConsecutiveBCount(0);
      } else if (button === 'WAIT') {
        setConsecutiveWaitCount(prev => prev + 1);
        setConsecutiveStartSelectCount(0);
        setConsecutiveBCount(0);
      } else if (button === 'B') {
        setConsecutiveBCount(prev => prev + 1);
        setConsecutiveStartSelectCount(0);
        setConsecutiveWaitCount(0);
      } else {
        setConsecutiveStartSelectCount(0);
        setConsecutiveWaitCount(0);
        setConsecutiveBCount(0);
      }
      
      // Update agent state
      setAgentState(prev => ({
        ...prev,
        status: 'acting',
        gameState: data.gameState,
        lastDecision: data.decision,
        decisions: [...prev.decisions, data.decision].slice(-25), // Keep only 25 to reduce memory
        totalDecisions: data.totalDecisions,
        totalCost: data.totalCost,
        totalTokensIn: data.totalTokensIn || prev.totalTokensIn,
        totalTokensOut: data.totalTokensOut || prev.totalTokensOut,
        fallbackCount: data.decision.isFallback ? prev.fallbackCount + 1 : prev.fallbackCount,
      }));
      
      // Auto-save state every 100 decisions
      if (data.totalDecisions > 0 && data.totalDecisions % 100 === 0 && emulatorRef.current) {
        addDebugLog('info', 'AgentCard', `Auto-saving state at decision ${data.totalDecisions}`);
        try {
          const saveState = await emulatorRef.current.saveState();
          if (saveState) {
            const modelDisplayName = AVAILABLE_MODELS.find(m => m.id === modelId)?.name || modelId;
            await fetch(`/api/agent/${agentId}/save-state`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                saveState,
                decisionNumber: data.totalDecisions,
                modelName: modelDisplayName,
              }),
            });
            addDebugLog('info', 'AgentCard', `State saved to blob at decision ${data.totalDecisions}`);
          }
        } catch (saveError) {
          addDebugLog('error', 'AgentCard', `Failed to auto-save state: ${saveError}`);
        }
      }

      // Execute button sequence on the emulator
      // buttonSequence is an array of { button, confidence } - execute each with 500ms delay
      const buttonSequence = data.decision.buttonSequence || [{ button: data.decision.button, confidence: data.decision.confidence }];
      
      addDebugLog('info', 'AgentCard', `Executing button sequence: ${buttonSequence.map((s: { button: string; confidence: number }) => s.button).join(' -> ')}`);
      
      for (let i = 0; i < buttonSequence.length; i++) {
        const step = buttonSequence[i];
        setLastButton(step.button as GBAButton);
        setButtonPressCount(prev => prev + 1);
        
        // Track button press count for banning
        const btn = step.button;
        buttonPressCountRef.current[btn] = (buttonPressCountRef.current[btn] || 0) + 1;
        
        // If button pressed 10+ times, ban it for next 2 prompts
        if (buttonPressCountRef.current[btn] >= 10) {
          setBannedButtons(prev => ({ ...prev, [btn]: 2 }));
          buttonPressCountRef.current[btn] = 0; // Reset counter
          addDebugLog('warn', 'AgentCard', `Button ${btn} pressed 10+ times, banning for 2 prompts`);
        }
        
        if (step.button === 'WAIT') {
          addDebugLog('info', 'AgentCard', `Step ${i + 1}/${buttonSequence.length}: WAIT - no button press`);
        } else if (emulatorRef.current) {
          addDebugLog('info', 'AgentCard', `Step ${i + 1}/${buttonSequence.length}: Pressing ${step.button} (conf: ${step.confidence.toFixed(2)})`);
          emulatorRef.current.pressButton(step.button as GBAButton);
        }
        
        // Wait 500ms between buttons in sequence (100ms hold + 400ms gap for game to register)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Decrement banned buttons counter after each prompt
      setBannedButtons(prev => {
        const updated: Record<string, number> = {};
        for (const [btn, count] of Object.entries(prev)) {
          if (count > 1) updated[btn] = count - 1;
        }
        return updated;
      });

      onDecision?.(data.decision);
      
      // Track screen type for cooldown duration
      lastScreenTypeRef.current = data.gameState?.screenType || 'unknown';
      addDebugLog('info', 'AgentCard', `Sequence complete: ${buttonSequence.length} button(s) executed, screenType: ${lastScreenTypeRef.current}`);

      // Clear thought after showing it
      setTimeout(() => {
        setCurrentThought('');
        setAgentState(prev => ({ ...prev, status: isRunning ? 'idle' : 'paused' }));
      }, 2000);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        addDebugLog('warn', 'AgentCard', 'Decision request timed out');
        setCurrentThought('Request timed out, retrying...');
      } else {
        addDebugLog('error', 'AgentCard', 'Decision error', { error: error instanceof Error ? error.message : String(error) });
        setCurrentThought('Oops, something went wrong...');
      }
      setAgentState(prev => ({ ...prev, status: 'error' }));
    } finally {
      clearTimeout(timeoutId);
      abortControllerRef.current = null;
      
      // Wait before releasing mutex - 8s for dialogue (let text play out), 500ms otherwise
      const cooldownMs = lastScreenTypeRef.current === 'dialogue' ? 8000 : 500;
      await new Promise(resolve => setTimeout(resolve, cooldownMs));
      
      setIsProcessing(false);
      processingLockRef.current = null;
      resolveLock!();
      addDebugLog('info', 'AgentCard', `Processing complete, lock released after ${cooldownMs}ms cooldown`);
    }
  }, [isRunning, isProcessing, agentId, modelId, onDecision, addDebugLog]);

  // Handle frame received from emulator
  const handleFrame = useCallback((frame: string, timestamp: number) => {
    setPendingFrame(frame);
    // console.log(`[component:AgentCard:${agentId}] Frame captured at:`, timestamp);
  }, [agentId]);

  // Handle emulator ready
  const handleEmulatorReady = useCallback(() => {
    setIsReady(true);
    // console.log(`[component:AgentCard:${agentId}] Emulator ready`);
  }, [agentId]);

  // Fetch notes content periodically
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch(`/api/agent/${agentId}/memstash`);
        const data = await res.json();
        setNotesContent(data.content || '');
      } catch (_error) {
        // Failed to fetch notes
      }
    };
    
    // Fetch initially and every 5 seconds while running
    fetchNotes();
    const interval = setInterval(fetchNotes, 5000);
    return () => clearInterval(interval);
  }, [agentId]);

  // Game loop: wait for previous request to complete before starting next
  useEffect(() => {
    if (!isRunning || !isReady) {
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    // Start the game loop with proper sequencing
    const runGameLoop = async () => {
      // Wait for any in-flight processing to complete
      if (processingLockRef.current) {
        // console.log(`[component:AgentCard:${agentId}] Waiting for previous request to complete...`);
        await processingLockRef.current;
      }

      // Check if still running after waiting
      if (!isRunning) return;

      // Capture frame and schedule next iteration
      if (emulatorRef.current && !isProcessing) {
        // console.log(`[component:AgentCard:${agentId}] Requesting frame capture...`);
        emulatorRef.current.captureFrame();
      }

      // Schedule next iteration only if still running
      if (isRunning) {
        gameLoopRef.current = setTimeout(runGameLoop, GAME_LOOP_INTERVAL);
      }
    };

    // Initial capture after a short delay
    gameLoopRef.current = setTimeout(runGameLoop, 500);

    return () => {
      if (gameLoopRef.current) {
        clearTimeout(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      // Abort any in-flight request
      abortControllerRef.current?.abort();
    };
  }, [isRunning, isReady, isProcessing]);

  // Process pending frame when available (respects mutex)
  useEffect(() => {
    if (pendingFrame && isRunning && !isProcessing) {
      processFrame(pendingFrame);
      setPendingFrame(null);
    }
  }, [pendingFrame, isRunning, isProcessing, processFrame]);

  const handleStart = useCallback(() => {
    if (!isReady) return;
    
    // Clear notes on fresh start
    fetch(`/api/agent/${agentId}/memstash`, { method: 'DELETE' }).catch(() => {});
    setNotesContent('');
    
    setIsRunning(true);
    setAgentState(prev => ({
      ...prev,
      startedAt: prev.startedAt || new Date(),
      status: 'thinking',
    }));
    // console.log(`[component:AgentCard:${agentId}] Starting agent`);
  }, [isReady, agentId]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    setAgentState(prev => ({ ...prev, status: 'paused' }));
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    // console.log(`[component:AgentCard:${agentId}] Stopping agent`);
  }, [agentId]);

  const handleReset = useCallback(() => {
    handleStop();
    abortControllerRef.current?.abort();
    setAgentState(createClientAgentState(agentId, modelId));
    setCurrentThought('');
    setPendingFrame(null);
    setLastButton(null);
    setIsProcessing(false);
    processingLockRef.current = null;
    // Clear frame history and context
    setFrameHistory([]);
    setRecentFrames([]);
    lastFrameHashRef.current = null;
    // Reset confidence scores
    setConfidenceScores({ ...DEFAULT_CONFIDENCE_SCORES });
    lastButtonRef.current = null;
    // Reset dialog history
    setDialogHistory([]);
    // Reset consecutive button counters
    setConsecutiveStartSelectCount(0);
    setConsecutiveWaitCount(0);
    setConsecutiveBCount(0);
    noChangeCountRef.current = {};
    setButtonsToAvoid([]);
    setBannedButtons({});
    buttonPressCountRef.current = {};
    setScreenAnalysis('');
    setNotesContent('');
    
    // Clear Notes in Redis on new run
    fetch(`/api/agent/${agentId}/memstash`, { method: 'DELETE' }).catch(console.error);
  }, [agentId, modelId, handleStop]);

  return (
    <div className={cn(
      'flex flex-col gap-4 p-4 rounded-xl border-2 bg-card',
      isRunning ? 'border-primary/50' : 'border-border',
      className
    )}>
      {/* Header with model selector and controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn('w-3 h-3 rounded-full', personality.color)} />
          <span className="font-bold">{AVAILABLE_MODELS.find(m => m.id === modelId)?.name || modelId}</span>
          <Badge variant="secondary" className="text-xs">
            {isRunning ? (agentState.status === 'thinking' ? 'running' : 'running') : 'stopped'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={modelId}
            onValueChange={(v) => setModelId(v as ModelId)}
            disabled={isRunning}
          >
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id} className="text-xs">
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isRunning ? (
            <Button size="sm" variant="outline" onClick={handleStop}>
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          ) : (
            <Button size="sm" onClick={handleStart} disabled={!isReady}>
              <Play className="h-4 w-4 mr-1" />
              Start
            </Button>
          )}

          <Button size="sm" variant="ghost" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Emulator + Controller */}
        <div className="flex flex-col gap-4 min-w-0">
          <EmulatorDisplay
            ref={emulatorRef}
            agentId={agentId}
            config={{
              romUrl: ROM_URL,
              volume: 0.3,
              muted: true,
            }}
            modelName="Emulator"
            modelColor={personality.color}
            onFrame={handleFrame}
            onReady={handleEmulatorReady}
          />
          <GBAController lastButton={lastButton} pressCount={buttonPressCount} className="relative" />
          {/* Screen Analysis display */}
          <div className="mt-2 p-2 bg-muted/50 rounded border border-border">
            <div className="text-xs font-semibold text-muted-foreground mb-1">Screen Analysis</div>
            <pre className="text-xs font-mono whitespace-pre-wrap break-words max-h-24 overflow-y-auto">
              {screenAnalysis || '(waiting for AI response...)'}
            </pre>
          </div>
          {/* Agent Notes display */}
          <div className="mt-2 p-2 bg-muted/50 rounded border border-border">
            <div className="text-xs font-semibold text-muted-foreground mb-1">Notes</div>
            <pre className="text-xs font-mono whitespace-pre-wrap break-words max-h-24 overflow-y-auto">
              {notesContent || '(empty)'}
            </pre>
          </div>
        </div>

        {/* Thoughts + Stats */}
        <div className="flex flex-col gap-4">
          <ThoughtsPanel
            personality={personality}
            decisions={agentState.decisions}
            currentThought={currentThought}
            isThinking={agentState.status === 'thinking'}
            className="h-[32rem] overflow-hidden"
            lastFrame={lastFrame}
            debugLogs={debugLogs}
          />
          <AgentStats state={agentState} />
        </div>
      </div>
    </div>
  );
}
