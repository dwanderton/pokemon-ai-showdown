'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { AIDecision, AgentPersonality } from '@/lib/types/agent';

// Debug log entry type (kept for compatibility but not displayed)
export interface DebugLogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  data?: Record<string, unknown>;
}

interface ThoughtsPanelProps {
  personality: AgentPersonality;
  decisions: AIDecision[];
  currentThought?: string;
  isThinking: boolean;
  className?: string;
  lastFrame?: string | null;
  debugLogs?: DebugLogEntry[];
}

// Typewriter effect hook
function useTypewriter(text: string, speed: number = 30) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setIsComplete(true);
      return;
    }

    setDisplayedText('');
    setIsComplete(false);
    let index = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayedText, isComplete };
}

// Thinking animation hook
function useThinkingAnimation(isThinking: boolean) {
  const dots = ['', '.', '..', '...'];
  const [dotIndex, setDotIndex] = useState(0);

  useEffect(() => {
    if (!isThinking) return;
    const interval = setInterval(() => {
      setDotIndex((i) => (i + 1) % dots.length);
    }, 400);
    return () => clearInterval(interval);
  }, [isThinking]);

  return dots[dotIndex];
}

export function ThoughtsPanel({
  personality,
  decisions,
  currentThought,
  isThinking,
  className,
  lastFrame,
  debugLogs = [],
}: ThoughtsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const debugScrollRef = useRef<HTMLDivElement>(null);
  const { displayedText, isComplete } = useTypewriter(
    currentThought || '',
    personality.style === 'xqc' ? 15 : 30 // xQc types faster
  );
  const dotAnimation = useThinkingAnimation(isThinking);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedText, decisions]);

  // Auto-scroll debug logs
  useEffect(() => {
    if (debugScrollRef.current) {
      debugScrollRef.current.scrollTop = debugScrollRef.current.scrollHeight;
    }
  }, [debugLogs]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className={cn('flex flex-col rounded-lg border border-border bg-card', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <div className={cn('w-2 h-2 rounded-full', personality.color)} />
        <span className="font-medium text-sm">Thoughts</span>
        {isThinking && (
          <Badge variant="outline" className="ml-auto text-xs animate-pulse">
            thinking{dotAnimation}
          </Badge>
        )}
      </div>

      {/* Thoughts Content */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {/* Thinking indicator at top */}
          {isThinking && !currentThought && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>Analyzing screen...</span>
            </div>
          )}

          {/* Current thought (typewriter effect) at top */}
          {currentThought && (
            <div className="border-l-2 border-primary pl-3 py-1">
              <p className="text-sm">
                {displayedText}
                {!isComplete && (
                  <span className="animate-pulse">|</span>
                )}
              </p>
            </div>
          )}

          {/* Decision history - Last 15 decisions, most recent first */}
          {[...decisions].slice(-15).reverse().map((decision, index) => (
            <div key={`decision-${index}`} className="space-y-1 border-b border-border/50 pb-2 last:border-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Show all buttons in sequence */}
                {decision.buttonSequence && decision.buttonSequence.length > 0 ? (
                  decision.buttonSequence.map((step, stepIndex) => (
                    <Badge 
                      key={stepIndex} 
                      variant={stepIndex === 0 ? "secondary" : "outline"} 
                      className="text-xs font-mono"
                    >
                      {step.button} {Math.round(step.confidence * 100)}%
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary" className="text-xs font-mono">
                    {decision.button} {Math.round(decision.confidence * 100)}%
                  </Badge>
                )}
                {decision.timestamp && (
                  <span className="text-[10px] text-muted-foreground/60 ml-auto font-mono">
                    {formatTime(decision.timestamp)}
                  </span>
                )}
              </div>
              {decision.personality_comment && (
                <p className="text-sm text-muted-foreground italic">
                  "{decision.personality_comment}"
                </p>
              )}
              <p className="text-xs text-muted-foreground/70 line-clamp-2">
                {decision.reasoning}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
