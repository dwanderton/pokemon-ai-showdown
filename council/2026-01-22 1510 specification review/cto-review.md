# CTO Review: Pokemon AI Showdown

**Reviewer:** Vercel CTO  
**Date:** January 2026  
**Focus:** Infrastructure appropriateness, cost analysis, feature showcase opportunities

---

## Executive Summary

This project has excellent potential as a ShipAI 2026 showcase. It demonstrates the full Vercel AI ecosystem working in concert. However, there are infrastructure decisions that could be optimized and additional Vercel/Next.js features we should highlight. This review also identifies cost risks that need mitigation strategies.

---

## Infrastructure Assessment

### Current Stack Evaluation

| Component | Proposed | Assessment | Recommendation |
|-----------|----------|------------|----------------|
| **Compute** | Next.js API Routes | Adequate for MVP | Consider Edge Functions for lower latency |
| **State** | Upstash Redis | Good choice | Add Edge Config for static configuration |
| **Storage** | Vercel Blob | Good for frames | Consider lifecycle policies for cost |
| **Database** | Neon/Supabase | Overkill for MVP | Defer until Phase 3 |
| **Workflows** | Upstash Workflow | Correct choice | Leverage `"use workflow"` directive |
| **AI** | AI Gateway | Essential | Implement spend controls |

### Recommended Infrastructure Changes

#### 1. Add Edge Config for Static Data

Game knowledge (type charts, route data, speedrun splits) should be in Edge Config for sub-millisecond reads.

```typescript
// edge-config.ts
import { get } from '@vercel/edge-config';

export async function getTypeChart(): Promise<TypeChart> {
  return await get('pokemon-type-chart');
}

export async function getSpeedrunSplits(): Promise<Split[]> {
  return await get('speedrun-splits-any-percent');
}

// Update via Vercel Dashboard or API
// Never changes during gameplay - perfect for Edge Config
```

**Cost:** Edge Config is included in Pro plan. Near-zero latency for reads.

#### 2. Edge Functions for Frame Analysis

Move frame capture endpoint to Edge for global low-latency.

```typescript
// app/api/agent/[id]/frame/route.ts
export const runtime = 'edge';

export async function POST(request: Request) {
  const { agentId, frame } = await request.json();
  
  // Process frame at edge
  // Faster response to client
}
```

**Consideration:** AI SDK works at Edge, but some features may require Node.js runtime. Test thoroughly.

#### 3. Vercel Blob Lifecycle Management

Storing every frame will accumulate costs quickly.

```typescript
// Frame retention strategy
const FRAME_RETENTION = {
  live: '24h',        // Keep all frames for 24 hours
  highlights: '30d',  // Keep milestone frames for 30 days
  archive: 'forever', // Keep run completion frames forever
};

// Implement cleanup job
// POST /api/cron/cleanup-frames
export async function cleanupFrames() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const frames = await listFrames({ before: cutoff });
  
  for (const frame of frames) {
    if (!frame.isHighlight) {
      await deleteBlob(frame.url);
    }
  }
}
```

---

## Cost Analysis

### AI Gateway Costs (Primary Risk)

**Scenario:** 6 agents, each making ~1 decision per second, 4-hour competition.

| Model | Cost per 1K tokens | Est. tokens/decision | Decisions/agent | Cost/agent | Total (6 agents) |
|-------|-------------------|---------------------|-----------------|------------|-----------------|
| GPT-4o | $2.50 input, $10 output | ~1K input (image), ~200 output | 14,400 | ~$50 | $300 |
| Claude Sonnet | $3 input, $15 output | ~1K input, ~200 output | 14,400 | ~$60 | $360 |
| Gemini Flash | $0.075 input, $0.30 output | ~1K input, ~200 output | 14,400 | ~$6 | $36 |

**Risk:** A 4-hour showcase with premium models could cost $300-500+.

**Mitigation Strategies:**

1. **Implement AI Gateway Spend Controls**
   ```typescript
   providerOptions: {
     gateway: {
       budget: {
         max: 100, // $100 max per competition
         alertAt: [50, 75, 90], // Alert thresholds
       }
     }
   }
   ```

2. **Use Tiered Model Selection**
   ```typescript
   function selectModelForState(gameState: GameState): string {
     switch (gameState) {
       case 'battle':
         return 'anthropic/claude-sonnet-4.5'; // Strategic decisions
       case 'dialogue':
       case 'menu':
         return 'google/gemini-2.0-flash'; // Simple, cheap
       case 'overworld':
         return 'openai/gpt-4o-mini'; // Balance of cost/quality
       default:
         return 'google/gemini-2.0-flash';
     }
   }
   ```

3. **Implement Caching for Similar States**
   ```typescript
   // If we've seen this exact screen before, reuse the decision
   const frameHash = await hashFrame(frame);
   const cached = await redis.get(`decision:${frameHash}`);
   if (cached) return cached;
   ```

### Storage Costs

| Service | Usage Estimate | Monthly Cost |
|---------|---------------|--------------|
| Vercel Blob | ~10GB (frames) | ~$2.50 |
| Upstash Redis | ~100MB (state) | ~$0.20 |
| Edge Config | <1MB (static) | Included |

**Storage is negligible compared to AI costs.**

### Bandwidth Costs

| Traffic Type | Estimate | Cost |
|-------------|----------|------|
| Frame uploads | 10GB | Included in Blob |
| WebSocket state | Minimal | Included |
| Static assets | Cached | Included |

**Bandwidth is not a concern.**

---

## Feature Showcase Opportunities

### Currently Leveraged (Good)

- [x] AI Gateway with fallback routing
- [x] AI SDK generateText with vision
- [x] Workflow DevKit for durable game loop
- [x] Turbopack (Next.js 16 default)
- [x] React 19.2 View Transitions
- [x] React 19.2 Activity component

### Missing Opportunities (Should Add)

#### 1. AI Gateway Observability Dashboard

The AI Gateway provides built-in observability. We should showcase this prominently.

```typescript
// Surface AI Gateway metrics in the UI
// - Request latency by model
// - Token usage by agent
// - Fallback events
// - Cost accumulation

// API route to fetch gateway stats
// GET /api/gateway/stats
export async function GET() {
  const stats = await getGatewayStats();
  return Response.json(stats);
}
```

#### 2. Vercel Speed Insights Integration

Show real user performance metrics for the showcase.

```typescript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

#### 3. Vercel Web Analytics

Track engagement during the showcase.

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

#### 4. Streaming Responses for AI Thoughts

Use `streamText` for real-time AI reasoning display.

```typescript
// Show AI "thinking" in real-time
import { streamText } from 'ai';

export async function analyzeWithStreaming(frame: FrameData) {
  const result = await streamText({
    model: 'openai/gpt-4o',
    messages: [
      { role: 'user', content: [{ type: 'image', image: frame.data }] }
    ],
  });
  
  // Stream to client for live "AI thoughts" display
  return result.toDataStreamResponse();
}
```

#### 5. ISR for Leaderboard

Use Incremental Static Regeneration for the public leaderboard.

```typescript
// app/leaderboard/page.tsx
export const revalidate = 10; // Revalidate every 10 seconds

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();
  return <Leaderboard data={leaderboard} />;
}
```

#### 6. Parallel Routes for Agent Details

Use Next.js parallel routes for the agent detail modals.

```
/app
  /@modal
    /agent
      /[id]
        /page.tsx    # Agent detail modal
  /page.tsx          # Main competition view
  /layout.tsx        # Handles modal slot
```

#### 7. `"use cache"` for Game Knowledge

Cache AI system prompts and game knowledge.

```typescript
// lib/game/pokemon-knowledge.ts
export async function getSystemPrompt(personality: AgentPersonality) {
  "use cache";
  
  const baseKnowledge = await loadBaseKnowledge();
  const personalityPrompt = await loadPersonalityPrompt(personality);
  
  return `${baseKnowledge}\n\n${personalityPrompt}`;
}
```

#### 8. React Compiler

Enable React Compiler for automatic optimization.

```typescript
// next.config.ts
const nextConfig = {
  reactCompiler: true,
};

export default nextConfig;
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI costs exceed budget | High | High | Spend controls, model tiering, caching |
| Emulator performance issues | Medium | High | Progressive loading, Activity component |
| AI Gateway rate limits | Medium | Medium | Request queuing, fallback models |
| Browser memory exhaustion | Medium | High | Emulator pool with limits, lazy loading |
| Demo failure during showcase | Low | Critical | Pre-recorded backup, checkpoint saves |

### Demo Resilience Strategy

1. **Checkpoint System:** Save game state periodically to Redis
2. **Quick Resume:** Load from checkpoint if agent crashes
3. **Fallback Recording:** Pre-record successful runs as backup
4. **Model Redundancy:** AI Gateway fallback ensures no single model failure kills demo

---

## Recommended Architecture Updates

### Add to Specifications

```markdown
### Additional Infrastructure

| Service | Purpose |
|---------|---------|
| Edge Config | Static game knowledge, type charts, speedrun splits |
| Vercel Analytics | User engagement tracking |
| Speed Insights | Performance monitoring |

### Cost Controls

- AI Gateway spend limit: $100 per competition
- Model tiering based on game state complexity
- Frame caching to reduce duplicate AI calls
- Blob lifecycle policies for frame cleanup

### Feature Showcase Checklist

- [ ] AI Gateway observability dashboard
- [ ] Streaming AI thoughts with streamText
- [ ] ISR for public leaderboard
- [ ] React Compiler enabled
- [ ] "use cache" for game knowledge
- [ ] Edge Config for static data
- [ ] Parallel routes for agent modals
- [ ] Speed Insights integration
- [ ] Web Analytics integration
```

---

## Summary

This project is well-positioned to showcase the Vercel AI ecosystem. Key recommendations:

1. **Add cost controls immediately** - AI spend is the primary risk
2. **Enable additional Vercel features** - Analytics, Speed Insights, Edge Config
3. **Implement model tiering** - Use cheap models for simple decisions
4. **Prepare demo resilience** - Checkpoints, fallbacks, pre-recordings
5. **Showcase observability** - Surface AI Gateway metrics in the UI

With these additions, Pokemon AI Showdown will be a compelling demonstration of what's possible when the full Vercel stack works together.
