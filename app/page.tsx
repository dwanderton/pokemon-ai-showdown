'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import type { AIDecision } from '@/lib/types/agent';
import { Skeleton } from '@/components/ui/skeleton';

// bundle-dynamic-imports: Lazy load heavy emulator component
const AgentCard = dynamic(
  () => import('@/components/agent/agent-card').then(mod => ({ default: mod.AgentCard })),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    ),
    ssr: false,
  }
);

export default function Page() {
  const [lastDecision, setLastDecision] = useState<AIDecision | null>(null);

  const handleDecision = useCallback((decision: AIDecision) => {
    setLastDecision(decision);
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Pokemon AI Showdown
          </h1>
          <p className="text-muted-foreground">v0 Studio 2026</p>
          <p className="text-sm text-muted-foreground mt-2">
            Select a model, click Start, and watch the AI play Pokemon LeafGreen
          </p>
        </header>

        {/* Agent Card */}
        <div className="max-w-4xl mx-auto">
          <AgentCard 
            agentId="agent-1" 
            onDecision={handleDecision}
          />
        </div>

        
      </div>
    </main>
  );
}
