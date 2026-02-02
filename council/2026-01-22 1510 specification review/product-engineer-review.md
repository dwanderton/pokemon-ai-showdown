# Product Engineer Review: Pokemon AI Showdown

**Reviewer:** Vercel Product Engineer  
**Date:** January 2026  
**Focus:** Code optimizations, maintainability, scalability

---

## Executive Summary

The specifications are well-structured and ambitious. This review identifies opportunities for code optimization, patterns that will improve maintainability, and potential scalability concerns that should be addressed before implementation.

---

## Code Architecture Recommendations

### 1. Emulator Instance Management

**Concern:** Managing 6 concurrent EmulatorJS instances could lead to memory leaks and performance issues.

**Recommendation:** Implement a proper lifecycle manager with explicit cleanup.

```typescript
// lib/emulator/emulator-pool.ts
class EmulatorPool {
  private instances: Map<string, EmulatorInstance> = new Map();
  private maxInstances = 6;
  
  acquire(agentId: string, config: EmulatorConfig): EmulatorInstance {
    if (this.instances.size >= this.maxInstances) {
      this.releaseOldest();
    }
    const instance = new EmulatorInstance(config);
    this.instances.set(agentId, instance);
    return instance;
  }
  
  release(agentId: string): void {
    const instance = this.instances.get(agentId);
    if (instance) {
      instance.destroy(); // Explicit cleanup
      this.instances.delete(agentId);
    }
  }
  
  // Clean up all instances on unmount
  destroyAll(): void {
    this.instances.forEach(instance => instance.destroy());
    this.instances.clear();
  }
}
```

### 2. State Management Pattern

**Concern:** Multiple agents with real-time updates could cause excessive re-renders.

**Recommendation:** Use a normalized state store with selective subscriptions.

```typescript
// hooks/use-agent-store.ts
import useSWR from 'swr';

// Granular subscriptions - components only re-render when their slice changes
export function useAgentBadges(agentId: string) {
  const { data } = useSWR(`agent/${agentId}/badges`, fetcher, {
    refreshInterval: 1000,
  });
  return data?.badges ?? 0;
}

export function useAgentStatus(agentId: string) {
  const { data } = useSWR(`agent/${agentId}/status`, fetcher, {
    refreshInterval: 500,
  });
  return data?.status ?? 'idle';
}

// Avoid: One giant subscription that causes all components to re-render
// const { data: allAgents } = useSWR('agents', fetcher); // BAD
```

### 3. Workflow Step Isolation

**Concern:** Tightly coupled workflow steps will be hard to test and debug.

**Recommendation:** Each step should be a pure function with explicit dependencies.

```typescript
// workflows/pokemon-agent/steps/analyze-game-state.ts
export async function analyzeGameState(
  frame: FrameData,
  context: GameContext,
  config: {
    modelId: string;
    perceptionMode: PerceptionMode;
    personality: AgentPersonality;
  }
): Promise<GameAnalysis> {
  "use step";
  
  // Pure function - all dependencies passed in
  // Easy to test with mocked inputs
  // Easy to swap perception modes
  
  const perception = await getPerception(frame, config.perceptionMode);
  const analysis = await generateAnalysis(perception, context, config);
  
  return analysis;
}

// Test file
describe('analyzeGameState', () => {
  it('detects battle state correctly', async () => {
    const mockFrame = createMockBattleFrame();
    const result = await analyzeGameState(mockFrame, mockContext, mockConfig);
    expect(result.gameState).toBe('battle');
  });
});
```

### 4. Component Composition Pattern

**Concern:** Spec shows monolithic components (e.g., `emulator-instance.tsx` doing too much).

**Recommendation:** Follow composition pattern with single-responsibility components.

```typescript
// components/emulator/index.tsx
export function EmulatorSlot({ agent }: { agent: Agent }) {
  return (
    <EmulatorProvider agent={agent}>
      <EmulatorCanvas />
      <EmulatorControls />
      <EmulatorOverlay />
    </EmulatorProvider>
  );
}

// components/emulator/emulator-canvas.tsx
function EmulatorCanvas() {
  const { canvasRef } = useEmulator();
  return <canvas ref={canvasRef} className="aspect-[3/2]" />;
}

// components/emulator/emulator-controls.tsx
function EmulatorControls() {
  const { mute, unmute, isMuted, toggleFullscreen } = useEmulator();
  return (
    <div className="flex gap-2">
      <MuteButton isMuted={isMuted} onToggle={isMuted ? unmute : mute} />
      <FullscreenButton onToggle={toggleFullscreen} />
    </div>
  );
}
```

---

## Performance Optimizations

### 1. Frame Capture Throttling

**Issue:** Capturing at 60fps is wasteful when AI only needs 1-5fps.

**Solution:** Implement adaptive frame capture based on game state.

```typescript
const FRAME_INTERVALS = {
  battle: 2000,      // Slow, strategic decisions
  dialogue: 500,     // Quick A-button presses
  overworld: 1000,   // Standard navigation
  menu: 500,         // Quick selections
  cutscene: 5000,    // Just wait
};

function useAdaptiveFrameCapture(gameState: GameState) {
  const interval = FRAME_INTERVALS[gameState] ?? 1000;
  
  useEffect(() => {
    const timer = setInterval(captureFrame, interval);
    return () => clearInterval(timer);
  }, [interval]);
}
```

### 2. Image Optimization Pipeline

**Issue:** Sending raw PNG screenshots is expensive (tokens + bandwidth).

**Solution:** Pre-process images before sending to AI.

```typescript
async function optimizeFrameForAI(canvas: HTMLCanvasElement): Promise<string> {
  // 1. Downscale - GBA is 240x160, AI doesn't need more
  const scaled = downscale(canvas, 240, 160);
  
  // 2. Compress - Use WebP for smaller payload
  const compressed = await toWebP(scaled, { quality: 0.8 });
  
  // 3. Base64 encode
  return btoa(compressed);
}
```

### 3. Lazy Loading Agents

**Issue:** Loading 6 emulator cores simultaneously will cause jank.

**Solution:** Progressive loading with Activity for hidden agents.

```typescript
function AgentGrid({ agents }: { agents: Agent[] }) {
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
  
  // Load agents progressively
  useEffect(() => {
    agents.forEach((agent, index) => {
      setTimeout(() => {
        setLoadedIds(prev => new Set([...prev, agent.id]));
      }, index * 500); // Stagger by 500ms
    });
  }, [agents]);
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {agents.map(agent => (
        <Activity key={agent.id} mode={loadedIds.has(agent.id) ? 'visible' : 'hidden'}>
          {loadedIds.has(agent.id) ? (
            <EmulatorSlot agent={agent} />
          ) : (
            <EmulatorPlaceholder />
          )}
        </Activity>
      ))}
    </div>
  );
}
```

---

## Maintainability Concerns

### 1. Type Safety for Game States

**Recommendation:** Create exhaustive types for all game states and actions.

```typescript
// types/game.ts
export const GAME_STATES = [
  'title',
  'intro',
  'overworld',
  'battle',
  'battle-menu',
  'dialogue',
  'menu',
  'pokemon-menu',
  'bag-menu',
  'save-menu',
  'cutscene',
] as const;

export type GameState = typeof GAME_STATES[number];

// Exhaustive action mapping
export type StateActions = {
  title: 'START' | 'A';
  battle: 'A' | 'B' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  dialogue: 'A' | 'B';
  // ...
};
```

### 2. Error Boundary Strategy

**Recommendation:** Granular error boundaries to isolate failures.

```typescript
// Each agent should have its own error boundary
function AgentSlot({ agent }: { agent: Agent }) {
  return (
    <AgentErrorBoundary agentId={agent.id} onError={handleAgentError}>
      <EmulatorSlot agent={agent} />
    </AgentErrorBoundary>
  );
}

// Agent failure shouldn't crash the whole competition
function AgentErrorBoundary({ children, agentId, onError }) {
  return (
    <ErrorBoundary
      fallback={<AgentCrashedUI agentId={agentId} />}
      onError={(error) => {
        console.error(`Agent ${agentId} crashed:`, error);
        onError(agentId, error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### 3. Logging and Observability

**Recommendation:** Structured logging for debugging AI decisions.

```typescript
// lib/logger.ts
export function logDecision(agentId: string, decision: GameAction, context: any) {
  console.log(JSON.stringify({
    type: 'ai_decision',
    timestamp: Date.now(),
    agentId,
    action: decision.input,
    reason: decision.reason,
    gameState: context.gameState,
    badges: context.badges,
  }));
}

// In production, this could go to Vercel Log Drains
```

---

## Scalability Considerations

### 1. API Rate Limiting

**Issue:** 6 agents making AI calls simultaneously could hit rate limits.

**Solution:** Implement request queuing with priority.

```typescript
// lib/ai/request-queue.ts
class AIRequestQueue {
  private queue: PriorityQueue<AIRequest> = new PriorityQueue();
  private concurrency = 3; // Max concurrent requests
  private active = 0;
  
  async enqueue(request: AIRequest, priority: number): Promise<AIResponse> {
    return new Promise((resolve, reject) => {
      this.queue.push({ ...request, resolve, reject }, priority);
      this.processQueue();
    });
  }
  
  private async processQueue() {
    while (this.active < this.concurrency && !this.queue.isEmpty()) {
      this.active++;
      const request = this.queue.pop();
      try {
        const response = await this.executeRequest(request);
        request.resolve(response);
      } catch (error) {
        request.reject(error);
      } finally {
        this.active--;
        this.processQueue();
      }
    }
  }
}
```

### 2. State Synchronization

**Issue:** Multiple browser tabs or viewers could cause state conflicts.

**Solution:** Use Redis for single source of truth with optimistic updates.

```typescript
// Optimistic update pattern
async function updateAgentState(agentId: string, update: Partial<AgentState>) {
  // 1. Optimistic local update
  mutate(`agent/${agentId}`, (current) => ({ ...current, ...update }), false);
  
  // 2. Server update
  await fetch(`/api/agent/${agentId}/state`, {
    method: 'PATCH',
    body: JSON.stringify(update),
  });
  
  // 3. Revalidate from server
  mutate(`agent/${agentId}`);
}
```

---

## Code Quality Checklist

Before implementation, ensure:

- [ ] ESLint + Prettier configured with strict rules
- [ ] TypeScript strict mode enabled
- [ ] Husky pre-commit hooks for linting
- [ ] Component documentation with JSDoc
- [ ] Unit test coverage targets (>80% for workflow steps)
- [ ] Integration test suite for emulator<->AI communication
- [ ] Error tracking setup (Sentry/Vercel)
- [ ] Performance monitoring (Vercel Analytics + Speed Insights)

---

## Summary

The architecture is sound, but implementation should prioritize:

1. **Proper cleanup patterns** for emulator instances
2. **Granular state subscriptions** to prevent re-render storms
3. **Adaptive frame capture** based on game state
4. **Error isolation** per agent to prevent cascade failures
5. **Request queuing** to handle rate limits gracefully

These optimizations will ensure the showcase runs smoothly even with 6 concurrent agents battling for Pokemon mastery.
