'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { AgentState } from '@/lib/types/agent';
import { 
  Trophy, 
  Clock, 
  DollarSign, 
  Brain, 
  Zap,
  MapPin,
  HelpCircle,
} from 'lucide-react';

// Isolated clock component that updates every second
function LiveClock({ startedAt }: { startedAt: Date | null }) {
  const [, setTick] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const formatTime = (start: Date | null) => {
    if (!start) return '0s';
    const diff = Date.now() - new Date(start).getTime();
    
    const totalSeconds = Math.floor(diff / 1000);
    const years = Math.floor(totalSeconds / (365 * 24 * 3600));
    const months = Math.floor((totalSeconds % (365 * 24 * 3600)) / (30 * 24 * 3600));
    const days = Math.floor((totalSeconds % (30 * 24 * 3600)) / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (years > 0) {
      return `${years}y ${months}mo ${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (months > 0) {
      return `${months}mo ${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };
  
  return <span className="font-mono text-sm">{formatTime(startedAt)}</span>;
}

interface AgentStatsProps {
  state: AgentState;
  className?: string;
}

export function AgentStats({ state, className }: AgentStatsProps) {
  const formatCost = (cost: number) => {
    // Round up to nearest cent, minimum $0.00
    const cents = Math.ceil(cost * 100) / 100;
    return `$${cents.toFixed(2)}`;
  };

  const formatTime = (start: Date | null) => {
    if (!start) return '0s';
    const diff = Date.now() - new Date(start).getTime();
    
    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className={cn('grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted/30', className)}>
      {/* Badges - hidden */}
      <div className="hidden flex items-center gap-2">
        <Trophy className="h-4 w-4 text-yellow-500" />
        <div>
          <div className="text-xs text-muted-foreground">Badges</div>
          <div className="font-bold">{state.badges}/8</div>
        </div>
      </div>

      {/* Time */}
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-blue-500" />
        <div>
          <div className="text-xs text-muted-foreground">Time</div>
          <LiveClock startedAt={state.startedAt} />
        </div>
      </div>

      {/* Cost */}
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-green-500" />
        <div>
          <div className="text-xs text-muted-foreground">Cost</div>
          <div className="font-mono text-sm">{formatCost(state.totalCost)}</div>
        </div>
      </div>

      {/* Decisions */}
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-purple-500" />
        <div>
          <div className="text-xs text-muted-foreground">Decisions</div>
          <div className="font-mono text-sm">{state.totalDecisions}</div>
        </div>
      </div>

      {/* Guesses/Fallbacks */}
      <div className="flex items-center gap-2">
        <HelpCircle className="h-4 w-4 text-orange-500" />
        <div>
          <div className="text-xs text-muted-foreground">Guesses</div>
          <div className="font-mono text-sm">{state.fallbackCount || 0}</div>
        </div>
      </div>

      {/* Location - hidden */}
      <div className="hidden col-span-2 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-red-500" />
        <div className="flex-1">
          <div className="text-xs text-muted-foreground">Location</div>
          <div className="text-sm truncate">{state.gameState.currentArea}</div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="col-span-2 flex flex-wrap gap-1">
        {state.gameState.inBattle && (
          <Badge variant="destructive" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            Battle
          </Badge>
        )}
        {state.gameState.inMenu && (
          <Badge variant="secondary" className="text-xs">
            Menu
          </Badge>
        )}
        {state.gameState.inDialogue && (
          <Badge variant="outline" className="text-xs">
            Dialogue
          </Badge>
        )}
      </div>

      {/* Party Health */}
      {state.gameState.pokemonCount > 0 && (
        <div className="col-span-2">
          <div className="text-xs text-muted-foreground mb-1">
            Party ({state.gameState.pokemonCount} Pokemon)
          </div>
          <div className="flex gap-1">
            {state.gameState.partyHealth.map((hp, i) => (
              <div key={i} className="flex-1">
                <Progress 
                  value={hp} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
