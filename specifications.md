# Pokemon AI Showdown - Technical Specifications

## Project Overview

**Event:** Vercel ShipAI 2026  
**Codename:** Pokemon AI Showdown  
**Objective:** Showcase the Vercel AI ecosystem by having multiple AI models compete to complete Pokemon LeafGreen through in-browser emulation.

---

## The Story

> *"What happens when the world's most advanced AI models try to become Pokemon masters?"*

This isn't a benchmark. This isn't a test suite. This is a **showdown**.

Six AI models. One goal. Zero mercy.

We're putting GPT-4o, Claude, Gemini, and their silicon siblings head-to-head in the ultimate childhood challenge: beating Pokemon LeafGreen. Each model brings its own personality, its own strategy, its own trash talk. They'll navigate Pallet Town, grind through Viridian Forest, and face the Elite Four - all while an audience watches their every decision, their every mistake, their every triumph.

The question isn't whether AI can play games. The question is: **which AI plays them best?**

### Design Philosophy

This project embodies the Vercel ethos: **fast, beautiful, and cutting-edge**. Every pixel serves a purpose. Every animation tells a story. We're not building a debug tool - we're building a spectacle.

Inspired by the live streaming culture that made "Twitch Plays Pokemon" legendary, we give each AI agent a distinct personality. They're not cold machines analyzing frames - they're characters with attitudes, favorites, and grudges. When Claude catches a rare Pokemon, it celebrates. When GPT-4o loses a battle, it sulks. When Gemini makes a questionable decision, it defends itself.

The UI follows a **leader-centric design**: the agent in first place always commands attention. But everyone has a chance to shine. Dramatic moments - clutch victories, devastating losses, unexpected strategies - get highlighted automatically. The best plays become shareable clips.

This is Pokemon as it was meant to be experienced: together, loudly, and with stakes.

---

## Core Technologies

> *"We built this with tomorrow's stack, today."*

Every technology choice serves the spectacle. Next.js 16 gives us the performance foundation. React 19.2 enables the fluid animations. The Vercel AI ecosystem - Gateway, SDK, Workflow DevKit - orchestrates the intelligence. This isn't a tech demo shoehorned into an app; it's an app that demands cutting-edge tech.

### Framework & Runtime
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.4 | App framework with App Router, Turbopack, cacheComponents |
| React | 19.2.3 | UI library with View Transitions, Activity, useEffectEvent |
| TypeScript | ^5.7 | Type safety |
| Tailwind CSS | ^4.1.9 | Styling (v4 with `@theme inline`) |

### Vercel React Best Practices (Agent Skills)

We integrate the **vercel-labs/agent-skills** `react-best-practices` skill (45 rules, 8 categories). Key patterns we enforce:

#### Critical Priority (Apply First)
| Rule | Pattern | Application in This Project |
|------|---------|----------------------------|
| `async-parallel` | Use `Promise.all()` for independent operations | Parallel frame capture + state analysis |
| `async-defer-await` | Move await into branches where used | Lazy model initialization |
| `bundle-barrel-imports` | Import directly, avoid barrel files | Direct component imports |
| `bundle-dynamic-imports` | Use `next/dynamic` for heavy components | Lazy-load emulator, charts |
| `bundle-preload` | Preload on hover/focus | Preload model configs on agent hover |

#### High Priority
| Rule | Pattern | Application |
|------|---------|-------------|
| `server-cache-react` | Use `React.cache()` for per-request dedup | Cache game knowledge lookups |
| `server-parallel-fetching` | Restructure to parallelize fetches | Parallel agent state fetching |
| `server-after-nonblocking` | Use `after()` for non-blocking ops | Frame storage, analytics |
| `client-swr-dedup` | SWR for automatic request deduplication | Agent state subscriptions |

#### Medium Priority
| Rule | Pattern | Application |
|------|---------|-------------|
| `rerender-transitions` | Use `startTransition` for non-urgent updates | Leaderboard reordering |
| `rerender-lazy-state-init` | Pass function to useState for expensive values | Emulator initialization |
| `rendering-activity` | Use `<Activity>` for show/hide | Hidden agent preservation |
| `rendering-content-visibility` | Use `content-visibility: auto` for long lists | Decision history scrollback |

#### JavaScript Performance
| Rule | Pattern | Application |
|------|---------|-------------|
| `js-set-map-lookups` | Use Set/Map for O(1) lookups | Pokemon type effectiveness cache |
| `js-cache-function-results` | Cache in module-level Map | Sprite URL resolution |
| `js-early-exit` | Return early from functions | Frame skip on paused agents |

```bash
# Install react-best-practices skill for development
npx add-skill vercel-labs/agent-skills --skill react-best-practices
```

### React 19.2 & Next.js 16 Features to Showcase

This project will leverage cutting-edge React and Next.js features:

| Feature | Source | Use Case |
|---------|--------|----------|
| **`<ViewTransition />`** | React 19.2 | Smooth animations when toggling agents on/off, swapping focused agent |
| **`<Activity mode="hidden">`** | React 19.2 | Keep emulator state alive when agent is minimized/hidden, preserving game state |
| **`useEffectEvent`** | React 19.2 | Stable callbacks for emulator event handlers without stale closures |
| **`"use cache"` directive** | Next.js 16 | Cache AI responses, game knowledge, speedrun criteria lookups |
| **`cacheComponents`** | Next.js 16 | Mix static UI chrome with dynamic agent states |
| **`updateTag()` / `refresh()`** | Next.js 16 | Real-time leaderboard updates with read-your-writes semantics |
| **Turbopack** | Next.js 16 | Default bundler for fast development |
| **React Compiler** | Next.js 16 | Automatic memoization and optimization |

### next.config.js Features
```javascript
const nextConfig = {
  cacheComponents: true,      // Enable "use cache" directive
  reactCompiler: true,        // Enable React Compiler (stable in Next.js 16)
  experimental: {
    viewTransitions: true,    // Enable View Transitions API integration
  }
};
```

### Vercel AI Ecosystem

> *"One gateway to rule them all."*

The AI Gateway is our secret weapon. No API key juggling. No provider-specific code. Just clean, unified access to the world's best models with automatic fallbacks when things go wrong. The Workflow DevKit makes our game loops durable - if a browser tab crashes, the agent picks up exactly where it left off.
| Technology | Documentation | Purpose |
|------------|---------------|---------|
| AI Gateway | https://vercel.com/ai-gateway | Unified API for 100+ models, fallback routing, spend monitoring |
| AI SDK | https://ai-sdk.dev/ (v6) | Standardized LLM integration with `generateText`, `streamText` |
| Workflow DevKit | https://useworkflow.dev/ | Durable workflows with `"use workflow"` and `"use step"` directives |

### Emulation
| Technology | Source | Purpose |
|------------|--------|---------|
| EmulatorJS | https://cdn.emulatorjs.org/stable/data/ | GBA emulation in browser via WebAssembly |

### EmulatorJS Architecture Constraint

> **Critical:** EmulatorJS cannot run directly in React/SPA applications. It must be embedded via iframe.
> "To embed within React or a SPA, the only way is to embed an iframe into your page... You cannot run it directly on the page. This will break single page apps, and tamper with the DOM." - EmulatorJS Docs

**Architecture:**
- Each agent renders an iframe pointing to a hosted EmulatorJS instance
- Communication between React and iframe via `postMessage` API
- This provides natural isolation between agents (separate DOM contexts)

**GBA Configuration:**
```javascript
EJS_core = 'gba';           // Uses mgba core
EJS_gameUrl = 'https://ziajgo1fa4mooxyp.public.blob.vercel-storage.com/2026/2026-01-22_leaf-green.gba';
EJS_biosUrl = '/bios/gba_bios.bin';  // Optional but recommended
EJS_volume = 0.5;           // 0-1 scale, controllable per agent
```

> **ROM Source:** Hosted on Vercel Blob for reliable CDN delivery. No local file required.

**Available Callbacks:**
| Callback | Purpose |
|----------|---------|
| `EJS_ready` | Emulator initialized, ready for commands |
| `EJS_onGameStart` | ROM loaded and running |
| `EJS_onSaveState` | Capture save state (includes screenshot) |
| `EJS_onLoadState` | Restore from save state |

**Input Control:**
```javascript
// From parent React app via postMessage
iframe.contentWindow.postMessage({
  type: 'INPUT',
  button: 'A',      // A, B, START, SELECT, UP, DOWN, LEFT, RIGHT, L, R
  action: 'press'   // 'press' or 'release'
}, '*');

// Frame capture request
iframe.contentWindow.postMessage({ type: 'CAPTURE_FRAME' }, '*');

// Response from iframe
window.addEventListener('message', (event) => {
  if (event.data.type === 'FRAME_DATA') {
    const base64Image = event.data.frame;
    // Send to AI workflow
  }
});
```

### Storage & Persistence
| Service | Purpose |
|---------|---------|
| Vercel Blob | Frame/screenshot storage for replay capability |
| Upstash Redis | Real-time game state, leaderboard, session data |
| Upstash Vector | (Stretch) Semantic search over game states |
| PostgreSQL (Neon/Supabase) | Persistent run history, achievements, analytics |

---

## Supported AI Models (Vision-Capable)

> *"Every contender brings something different to the arena."*

This is a showdown, not a cost optimization exercise. Each agent uses its selected model for every decision - no switching to cheaper models for "simple" tasks. The full power of each model is on display, every frame, every choice. That's how we find out who's really the best.

All models must support image input for game state analysis. Models are accessed via AI Gateway with automatic fallback.

### Tier 1 - Primary Models
| Model ID | Provider | Notes |
|----------|----------|-------|
| `openai/gpt-4o` | OpenAI | Fast, excellent vision |
| `openai/gpt-4.1` | OpenAI | Latest capabilities |
| `anthropic/claude-sonnet-4.5` | Anthropic | Strong reasoning |
| `anthropic/claude-opus-4.5` | Anthropic | Deep analysis |
| `google/gemini-2.0-flash` | Google | Fast multimodal |
| `xai/grok-3` | xAI | Alternative perspective |
| `xai/grok-2-vision` | xAI | Vision specialist |

### Tier 2 - Extended Models
| Model ID | Provider | Notes |
|----------|----------|-------|
| `bedrock/claude-4-5-haiku-*` | AWS Bedrock | Cost-effective |
| `vertex/gemini-*` | Google Vertex | Enterprise option |
| `deepinfra/*-vision` | DeepInfra | Open source models |

### Fallback Configuration
```typescript
providerOptions: {
  gateway: {
    // Primary model order
    order: ['openai', 'anthropic', 'bedrock', 'vertex'],
    // Model-level fallbacks
    models: ['openai/gpt-4o', 'anthropic/claude-sonnet-4.5', 'google/gemini-2.0-flash']
  }
}
```

---

## Architecture

> *"The browser is the arena. The server is the referee."*

Our architecture solves a fundamental challenge: the emulator runs client-side (WebAssembly in the browser), but the AI workflows need server-side durability. We bridge this with a polling model - the client captures frames and sends them to server-side workflows that analyze, decide, and return actions.

When a browser tab closes or refreshes, the workflows don't just die - they pause gracefully. The emulator state is preserved in Redis, and when the user returns, they can resume exactly where they left off. No lost progress. No wasted compute.

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ iframe: EmuJS #1 │  │ iframe: EmuJS #2 │  │ iframe: EmuJS #N │  │
│  │  (Model: GPT-4o) │  │  (Model: Claude) │  │  (Model: ...)    │  │
│  │  ↕ postMessage   │  │  ↕ postMessage   │  │  ↕ postMessage   │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                     │                     │            │
│           └─────────────────────┼─────────────────────┘            │
│                                 │                                   │
│  ┌──────────────────────────────▼───────────────────────────────┐  │
│  │                     React State Manager                       │  │
│  │    - Emulator instances (Map<agentId, EmulatorRef>)          │  │
│  │    - Agent states (Map<agentId, AgentState>)                 │  │
│  │    - Speedrun timer (global + per-agent)                     │  │
│  │    - Audio context (mute/unmute per agent)                   │  │
│  └──────────────────────────────┬───────────────────────────────┘  │
│                                 │                                   │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │    Next.js API Routes     │
                    │    /api/agent/[id]/...    │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Workflow DevKit Engine  │
                    │   "use workflow" runtime  │
                    └─────────────┬─────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
┌─────────▼─────────┐   ┌────────▼────────┐   ┌─────────▼─────────┐
│    AI Gateway     │   │  Upstash Redis  │   │   Vercel Blob     │
│  (Model routing)  │   │  (Game state)   │   │ (Frame storage)   │
└───────────────────┘   └─────────────────┘   └───────────────────┘
```

### Workflow Lifecycle & Termination

When a browser tab closes, refreshes, or the user explicitly stops an agent:

1. **Client Disconnect Detection**: The client sends periodic heartbeats to `/api/agent/[id]/heartbeat`
2. **Grace Period**: If no heartbeat received for 30 seconds, workflow enters `paused` state
3. **State Preservation**: Current game state, emulator save state, and AI context are persisted to Redis
4. **Workflow Suspension**: The Workflow DevKit suspends the workflow (not terminates)
5. **Resume on Return**: When user returns, they can resume from the exact frame

```typescript
// lib/workflow/heartbeat.ts
export async function handleHeartbeat(agentId: string) {
  "use step";
  await redis.set(`agent:${agentId}:heartbeat`, Date.now(), { ex: 60 });
}

export async function checkHeartbeat(agentId: string): Promise<boolean> {
  "use step";
  const lastBeat = await redis.get(`agent:${agentId}:heartbeat`);
  if (!lastBeat) return false;
  return Date.now() - Number(lastBeat) < 30000; // 30 second timeout
}

// In main workflow loop:
while (!state.isComplete && !state.isTerminated) {
  // Check if client is still connected
  const isAlive = await checkHeartbeat(config.agentId);
  if (!isAlive) {
    state.status = 'paused';
    await persistState(state); // Save everything
    return state; // Workflow suspends, can be resumed later
  }
  // ... continue game loop
}
```

### Workflow Architecture

Each AI agent runs as a durable workflow using Workflow DevKit:

```typescript
// workflows/pokemon-agent/workflow.ts
export async function pokemonAgentWorkflow(config: AgentConfig) {
  "use workflow";
  
  const state = await initializeGameState(config);
  
  // Main game loop - runs until game complete or terminated
  while (!state.isComplete && !state.isTerminated) {
    // Step 1: Capture current frame
    const frame = await captureFrame(config.agentId);
    
    // Step 2: Analyze game state (vision model)
    const analysis = await analyzeGameState(frame, state.context);
    
    // Step 3: Decide action based on analysis
    const action = await decideAction(analysis, state);
    
    // Step 4: Execute action and wait for result
    const result = await executeAction(config.agentId, action);
    
    // Step 5: Update state and persist
    state = await updateState(state, result);
    
    // Step 6: Check for achievements/milestones
    await checkMilestones(state);
  }
  
  return state;
}
```

### Step Definitions

```typescript
// workflows/pokemon-agent/steps/capture-frame.ts
export async function captureFrame(agentId: string): Promise<FrameData> {
  "use step";
  // Captures canvas as base64 PNG
  // Returns frame with timestamp and agent ID
}

// workflows/pokemon-agent/steps/analyze-game-state.ts
export async function analyzeGameState(
  frame: FrameData, 
  context: GameContext
): Promise<GameAnalysis> {
  "use step";
  // Sends frame to vision model via AI Gateway
  // Returns structured analysis of game state
}

// workflows/pokemon-agent/steps/decide-action.ts
export async function decideAction(
  analysis: GameAnalysis,
  state: AgentState
): Promise<GameAction> {
  "use step";
  // AI decides next action based on analysis
  // Returns action to execute
}

// workflows/pokemon-agent/steps/execute-action.ts
export async function executeAction(
  agentId: string,
  action: GameAction
): Promise<ActionResult> {
  "use step";
  // Sends input to emulator
  // Waits for game to respond
  // Returns result of action
}
```

---

## Game Loop Design

### Event-Driven Decision Model

Pokemon is turn-based with key-by-key interaction. The AI should:

1. **Press a key** (A, B, Start, Select, D-pad)
2. **Wait for visual feedback** (screen change, menu update, text advance)
3. **Analyze the new state**
4. **Decide next action**
5. **Repeat**

### State Detection Heuristics

The AI needs to identify game state context:

| State | Detection Method | Decision Speed |
|-------|------------------|----------------|
| **Title Screen** | Pattern match title graphics | Fast |
| **Overworld** | Player sprite visible, no overlay | Medium |
| **Battle** | Battle UI elements detected | Slow (strategic) |
| **Menu** | Menu overlay visible | Fast |
| **Dialogue** | Text box visible | Fast (A to advance) |
| **Cutscene** | No player control indicators | Wait |

### Input Mapping

```typescript
type GBAInput = 
  | 'A' | 'B' | 'START' | 'SELECT'
  | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
  | 'L' | 'R';

interface GameAction {
  input: GBAInput | GBAInput[];  // Single or combo
  holdDuration?: number;         // ms to hold (default: 100ms)
  waitAfter?: number;            // ms to wait after release
  reason: string;                // AI's reasoning for this action
}
```

---

## AI Perception Modes

The system supports multiple perception approaches per model's capabilities:

### 1. Screenshot Analysis (Default)
- Capture canvas as PNG
- Send to vision model
- Model interprets raw pixels

### 2. Screenshot + OCR Preprocessing (DEPRECATED)
- **NOTE:** OCR preprocessing has been deprecated. Modern vision models (GPT-4o, Claude, Gemini) effectively read on-screen text directly from images. Separate OCR adds latency and complexity without meaningful accuracy gains.
- Original intent was to reduce tokens for text-heavy screens, but vision model text recognition is now sufficient.

### 3. Memory Reading + Screenshot (Advanced)
- Read emulator memory for game state:
  - Player position (X, Y, Map ID)
  - Party Pokemon (HP, Level, Status)
  - Inventory contents
  - Badges collected
  - Current battle state
- Combine with periodic screenshots
- Most efficient for complex decisions

```typescript
interface PerceptionConfig {
  mode: 'screenshot' | 'memory-hybrid';
  screenshotInterval: number;  // ms between captures
  memoryReadInterval?: number; // ms between memory reads
  // ocrEnabled removed - vision models read text directly
}
```

---

## Component Architecture

### Core Components

```
/app
  /page.tsx                    # Main competition view
  /api
    /agent
      /[id]
        /start/route.ts        # Start agent workflow
        /stop/route.ts         # Stop agent workflow
        /state/route.ts        # Get agent state
        /input/route.ts        # Send input to emulator
        /frame/route.ts        # Get current frame
    /competition
      /start/route.ts          # Start new competition
      /leaderboard/route.ts    # Get current standings

/components
  /emulator
    /emulator-instance.tsx     # Single EmulatorJS wrapper
    /emulator-grid.tsx         # Grid of emulators (1-6)
    /emulator-controls.tsx     # Play/pause, mute, fullscreen
  /agent
    /agent-card.tsx            # Agent status display
    /agent-selector.tsx        # Model selection UI
    /agent-stats.tsx           # Real-time statistics
  /competition
    /speedrun-timer.tsx        # Master timer + splits
    /leaderboard.tsx           # Live standings
    /milestone-tracker.tsx     # Achievement tracking
  /ui
    /... (shadcn components)

/workflows
  /pokemon-agent
    /workflow.ts               # Main workflow definition
    /steps
      /capture-frame.ts
      /analyze-game-state.ts
      /decide-action.ts
      /execute-action.ts
      /check-milestones.ts
      /persist-state.ts
    /prompts
      /system-prompt.ts        # Pokemon game knowledge
      /battle-prompt.ts        # Battle-specific instructions
      /navigation-prompt.ts    # Overworld navigation

/lib
  /emulator
    /emulator-manager.ts       # EmulatorJS lifecycle management
    /memory-reader.ts          # GBA memory reading utilities
    /input-handler.ts          # Input injection
  /ai
    /model-config.ts           # Model definitions & capabilities
    /perception.ts             # Frame analysis utilities
  /game
    /pokemon-knowledge.ts      # Type charts, routes, strategies
    /speedrun-splits.ts        # Split definitions
    /achievement-tracker.ts    # Milestone detection

/hooks
  /use-emulator.ts             # Emulator instance hook
  /use-agent.ts                # Agent state subscription
  /use-competition.ts          # Competition state
  /use-speedrun-timer.ts       # Timer with splits
```

---

## Speedrun Integration

### Split Categories (Based on speedrun.com/pkmnfrlg)

**Any% Glitchless Splits:**

1. Get Starter Pokemon
2. Deliver Oak's Parcel
3. Defeat Brock (Badge 1)
4. Defeat Misty (Badge 2)
5. Defeat Lt. Surge (Badge 3)
6. Get Silph Scope
7. Defeat Erika (Badge 4)
8. Defeat Koga (Badge 5)
9. Defeat Sabrina (Badge 6)
10. Defeat Blaine (Badge 7)
11. Defeat Giovanni (Badge 8)
12. Enter Elite Four
13. Defeat Lorelei
14. Defeat Bruno
15. Defeat Agatha
16. Defeat Lance
17. Defeat Champion

### Timer Implementation

```typescript
interface SpeedrunTimer {
  startTime: number;
  currentSplit: number;
  splits: Split[];
  status: 'idle' | 'running' | 'paused' | 'finished';
}

interface Split {
  name: string;
  startTime: number | null;
  endTime: number | null;
  bestTime: number | null;  // Personal best
  worldRecord: number;      // From speedrun.com
}
```

---

## UI/UX Requirements

> *"This is a spectacle, not a spreadsheet."*

The UI tells a story. When GPT-4o takes the lead, the entire screen shifts to acknowledge it. When Claude makes a clutch play, the moment gets highlighted. When an agent fails spectacularly, we don't hide it - we make it memorable.

### Visual Design Principles

**Leader-Centric Layout**: The agent in first place always gets the largest screen real estate and most prominent position. When leadership changes, a smooth ViewTransition animates the reordering. The leader's card has enhanced visual treatment - subtle glow, larger typography, more detailed stats.

**Signature Colors**: Each model has a distinct color identity:
| Model | Primary Color | Accent | Personality |
|-------|--------------|--------|-------------|
| GPT-4o | `#10a37f` (OpenAI Green) | Emerald | The Confident One |
| Claude | `#d97706` (Anthropic Orange) | Amber | The Thoughtful One |
| Gemini | `#4285f4` (Google Blue) | Sky | The Curious One |
| Grok | `#000000` (xAI Black) | Slate | The Wildcard |
| Bedrock | `#ff9900` (AWS Orange) | Orange | The Enterprise One |
| DeepInfra | `#7c3aed` (Purple) | Violet | The Open Source One |

**Typewriter AI Thoughts**: Each agent's reasoning appears character-by-character, matching their streamer personality's "voice":
- Emiru-style: "omg omg omg a shiny?? wait no its just a regular pidgey but still cute!!"
- Asmongold-style: "This RNG is rigged. I'm telling you. Third crit in a row."
- Jerma-style: "I'm going to do what's called a pro gamer move and walk directly into this wall"

**Dramatic Moment Detection**: The system auto-detects and highlights:
- Badge acquisitions (mini-celebration animation)
- Clutch battle victories (slow-mo replay opportunity)  
- Party wipes (dramatic fade, sad music sting)
- Rare Pokemon encounters (sparkle effect, sound cue)
- First-time area entries (location title card)

**Victory Celebration**: When a model completes the game:
1. Screen dramatically darkens except for the winner
2. Confetti/particle effects
3. Champion screen with final stats (time, cost, team, decisions)
4. Other agents' reactions displayed (jealousy, congratulations, etc.)

### Competition View Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Header: Pokemon AI Battle Royale - ShipAI 2026]    [Timer: 00:00] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │ Agent 1     │  │ Agent 2     │  │ Agent 3     │                  │
│  │ GPT-4o      │  │ Claude 4.5  │  │ Gemini 2.0  │                  │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │                  │
│  │ │Emulator │ │  │ │Emulator │ │  │ │Emulator │ │                  │
│  │ │ Canvas  │ │  │ │ Canvas  │ │  │ │ Canvas  │ │                  │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │                  │
│  │ Badges: 2   │  │ Badges: 1   │  │ Badges: 2   │                  │
│  │ Time: 45:32 │  │ Time: 52:18 │  │ Time: 48:05 │                  │
│  │ [Mute][FS]  │  │ [Mute][FS]  │  │ [Mute][FS]  │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │ Agent 4     │  │ Agent 5     │  │ Agent 6     │                  │
│  │ ...         │  │ ...         │  │ ...         │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  [Leaderboard]  [Splits]  [AI Thoughts]  [Settings]                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

| Breakpoint | Layout | Emulators Visible |
|------------|--------|-------------------|
| Mobile (<640px) | 1 column, swipeable | 1 (selected) |
| Tablet (640-1024px) | 2 columns | 2-4 |
| Desktop (>1024px) | 3 columns | 3-6 |

### Control Features

- **Mute/Unmute**: Per-agent audio toggle
- **Fullscreen**: Expand single agent to fullscreen
- **Picture-in-Picture**: Float agent while browsing
- **Focus Mode**: Highlight leader or selected agent
- **AI Thoughts**: Show agent's reasoning in real-time

---

## Data Models

### Agent State

```typescript
interface AgentState {
  id: string;
  modelId: string;
  modelName: string;
  status: 'idle' | 'running' | 'paused' | 'error' | 'complete';
  
  // Game Progress
  badges: number;
  currentLocation: string;
  partyPokemon: PokemonSummary[];
  playtime: number; // seconds
  
  // Speedrun
  currentSplit: number;
  splitTimes: number[];
  
  // AI Stats
  totalDecisions: number;
  lastDecision: GameAction | null;
  lastAnalysis: string | null;
  errorCount: number;
  
  // Run metadata
  startedAt: Date;
  lastUpdatedAt: Date;
  
  // Cost Tracking
  totalCost: number;           // USD spent on this agent's run
  totalTokensIn: number;       // Total input tokens
  totalTokensOut: number;      // Total output tokens
  costPerBadge: number[];      // Cost to achieve each badge
}

interface PokemonSummary {
  species: string;
  nickname: string | null;
  level: number;
  currentHp: number;
  maxHp: number;
}
```

### Competition State

```typescript
interface CompetitionState {
  id: string;
  name: string;
  status: 'setup' | 'running' | 'paused' | 'finished';
  
  agents: AgentState[];
  startedAt: Date | null;
  finishedAt: Date | null;
  
  // Global timer
  elapsedTime: number;
  
  // Winner (first to complete)
  winnerId: string | null;
}
```

---

## RL Research Integration (arxiv:2502.19920)

Based on "Pokemon Red via Reinforcement Learning" by Pleines et al., we've incorporated key learnings:

### Reward Shaping (Implemented)
| Reward Type | Formula | Purpose |
|-------------|---------|---------|
| Event | +2 to +50 per milestone | Breadcrumbs through storyline |
| Navigation | +0.005 per new coordinate | Encourage exploration |
| Healing | 2.5 * HP restoration fraction | Encourage Pokemon Center usage |
| Level | 0.5 * min(levels, threshold formula) | Diminishing returns above level 22 |

### Key Paper Findings
1. **Navigation reward is critical** - Without it, agents don't progress past origin
2. **Heal reward can be exploited** - Agents may farm healing instead of progressing
3. **GRU memory helps** - 48% completed Bill's quest vs 19% without memory
4. **Text speed matters** - Fast mode achieved 98% Brock completion vs 97% baseline
5. **Starter choice affects outcome** - Squirtle best for Brock, Charmander worst for Misty

### Game State Vector (from Paper)
The paper uses structured game state alongside vision:
- Current HP and level of each party Pokemon
- Event completion flags
- 48x48 binary visited coordinates image

### Milestones Tracked (from Paper)
1. Viridian Forest reached
2. Brock defeated (Badge 1)
3. Mt. Moon entered/exited
4. Cerulean City reached
5. Misty defeated (Badge 2)
6. Bill's quest completed
7. Vermilion City reached

### Known Challenges (from Paper)
- **Cuttable trees** - Require HM01 Cut + eligible Pokemon + UI navigation
- **Long horizons** - Tens of thousands of steps per episode
- **Catastrophic forgetting** - Dynamic step budgets help (10,240 + 2,048 per event)
- **Time bias** - Agents prefer faster rewards even if suboptimal long-term

### How We Apply RL Learnings to LLM Approach

While we're not using RL training, we leverage the paper's insights for our LLM agent:

| RL Concept | LLM Adaptation | Status |
|------------|----------------|--------|
| Navigation reward | Visual change detection penalizes repeated ineffective actions | DONE |
| Memory (GRU) | MemStash persistent memory across decisions | DONE |
| Milestone tracking | Prompt includes milestone list for goal orientation | DONE |
| Stuck detection | 3+ consecutive no-change triggers different behavior | DONE |
| Heal reward | Prompt prioritizes Pokemon Center when HP low | DONE |
| Dynamic step budget | Button sequence allows 1-5 chained inputs | DONE |
| Game state vector | RAM addresses documented, read command available | PARTIAL |
| Text speed | Fast text mode set in emulator config | TODO |

### Key Differences from RL Approach
1. **No training loop** - LLM uses zero-shot reasoning, not learned policy
2. **Explicit memory** - MemStash is text-based notes, not learned embeddings
3. **Reasoning chain** - LLM explains decisions, RL is black-box policy
4. **Cost per decision** - API calls have $$$ cost, RL training is compute-bound
5. **Generalization** - LLM has Pokemon knowledge, RL learns from scratch

---

## Save State Parsing for Game State Extraction

### Overview
Direct RAM access via EmulatorJS is unreliable (core-dependent, undocumented API). Save states provide an alternative: they contain a full memory snapshot that can be parsed to extract game state.

### How GBA Save States Work
- EmulatorJS (mGBA core) creates save states containing full memory snapshots
- Contents: WRAM (work RAM), IWRAM, VRAM, CPU registers
- Format: `.ss0`/`.ss1`/`.state` - typically zlib-compressed with structured data
- Size: 1-2MB per save state (full memory dump)

### Extractable Data
| Data | Memory Region | Use Case |
|------|---------------|----------|
| Player X/Y position | 0x02025A00 | Navigation, stuck detection |
| Current map ID | 0x02025A04 | Area tracking, milestone detection |
| Party Pokemon (HP, level, species) | 0x02024284 | Battle decisions, healing priority |
| Badge flags | 0x02025B08 | Progress tracking |
| Event flags | Various | Story progression detection |
| Money, items | 0x02025AB4+ | Resource awareness |
| Pokedex progress | 0x02025B18 | Completion tracking |

### Implementation Flow
1. Trigger save state: `gameManager.quickSave()` or equivalent EmulatorJS API
2. Retrieve save state data as blob/arraybuffer
3. Decompress if zlib-compressed
4. Locate WRAM section within save state structure
5. Extract known memory addresses from WRAM
6. Feed structured game state to AI alongside visual frame

### Challenges
| Challenge | Mitigation |
|-----------|------------|
| mGBA save state format undocumented | Reverse-engineer or find existing parsers |
| 1-2MB per save state | Only extract every N decisions, not every frame |
| Performance overhead (100-200ms) | Async extraction, cache parsed state |
| EmulatorJS API uncertainty | Test `quickSave()`/`getSaveState()` availability |

### Alternative: Parse `.sav` Files
- Game battery saves are smaller and well-documented
- Contains persistent progress but NOT real-time position/HP
- Less useful for moment-to-moment decisions
- Could be useful for episode initialization (continue from last checkpoint)

### Research Questions
1. How often to extract state? Every decision vs every 10 decisions?
2. Is 100-200ms overhead acceptable per extraction?
3. Can EmulatorJS expose save state blob programmatically?
4. Existing mGBA save state parsers (Python/JS)?

---

## Infrastructure Usage

### Upstash Redis (Connected)
| Key Pattern | Purpose | Status |
|-------------|---------|--------|
| `agent:{id}:state` | Full agent state JSON | Active |
| `agent:{id}:heartbeat` | Last heartbeat timestamp | Active |
| `agent:{id}:frames` | Frame count | Active |
| `agent:{id}:decisions` | Decision history | Active |
| `agent:{id}:milestones` | Completed milestones | **TODO** |
| `agent:{id}:locations` | Visited locations set | **TODO** |
| `agent:{id}:progress` | RL progress metrics | **TODO** |
| `leaderboard:badges` | Badge count leaderboard | Available |
| `leaderboard:milestones` | Milestone leaderboard | **TODO** |

### Vercel Blob (Connected)
| Use Case | Status |
|----------|--------|
| Frame storage for replay | API available |
| Milestone screenshots | **TODO** |
| ROM hosting | Active (CDN) |
| Decision highlight clips | Stretch |

---

## Milestones & Phases

### Phase 1: Single Agent MVP
**Goal:** One emulator, one AI agent completing the game loop

- [x] EmulatorJS React wrapper component
- [x] Frame capture from canvas
- [x] AI Gateway integration with vision model
- [x] Workflow DevKit setup with game loop
- [x] Basic input injection
- [x] State persistence to Upstash Redis
- [x] Simple UI showing emulator + AI thoughts
- [x] Cost tracking per decision
- [x] GBA controller visualization
- [x] Decision history panel
- [x] RL-based reward functions (from paper)
- [x] Game knowledge system prompt
- [x] Confidence scores per button
- [x] Progress confidence tracking

### Phase 2: Multi-Agent Competition
**Goal:** 2+ agents racing side-by-side

- [ ] Emulator grid component (1-6 instances)
- [ ] Agent selector for model choice
- [ ] Per-agent state management
- [ ] Competition timer and leaderboard (ISR with `updateTag()`)
- [x] Mute/unmute per agent
- [ ] Fullscreen per agent
- [x] **Streaming AI thoughts** - Real-time typewriter effect showing agent reasoning
- [x] **Cost tracking per agent** - Live USD spent counter

### Phase 2.5: RL Integration & Infrastructure (CURRENT PRIORITY)
**Goal:** Leverage RL paper insights and maximize infrastructure usage

**Save State Parsing (NEXT STEP):**
- [ ] Test EmulatorJS `quickSave()`/`getSaveState()` API availability
- [ ] Retrieve save state blob from emulator
- [ ] Parse mGBA save state format (decompress zlib, locate WRAM)
- [ ] Extract player position, map ID, party HP, badges from WRAM
- [ ] Feed structured game state to AI alongside visual frame
- [ ] Determine optimal extraction frequency (every N decisions)

**Redis Expansion:**
- [ ] Persist progress metrics to Redis after each decision
- [ ] Track milestone completions in sorted set
- [ ] Store visited locations for navigation reward
- [ ] Implement stuck detection persistence

**Blob Integration:**
- [ ] Auto-capture milestone screenshots to Blob
- [ ] Store key decision frames for replay
- [ ] Enable milestone moment viewing

**RL-Based UI:**
- [ ] Progress confidence meter visualization
- [ ] Milestone timeline component
- [ ] Stuck state indicator
- [ ] Reward event feed (floating notifications)

### Phase 3: Polish & Stretch Goals
**Goal:** Production-ready showcase

- [ ] Frame storage to Vercel Blob (replay capability)
- [ ] Speedrun splits with world record comparison
- [ ] Achievement tracking (specific milestones)
- [ ] Memory reading for enhanced state awareness
- [x] ~~OCR preprocessing~~ - DEPRECATED: Vision models read text directly
- [ ] Picture-in-picture mode
  - [ ] Mobile-responsive layout
  - [ ] **Observability dashboard** - Real-time metrics, error rates, model performance comparison
  - [ ] **Speedrunning guide integration** - Provide AI agents access to community speedrunning guides and optimal routes (e.g., from speedrun.com, Pokemon speedrunning communities) to improve decision-making and strategy
  - [ ] **GameFAQs integration** - Parse and provide access to community FAQs and walkthroughs (https://gamefaqs.gamespot.com/gba/918916-pokemon-leafgreen-version/faqs) for strategic guidance
- [ ] **Leader-centric layout** - First place agent always prominent
- [ ] **Signature colors per agent** - Visual identity for each model
- [ ] **Dramatic moment detection** - Highlight clutch wins, devastating losses, rare catches

### Phase 4: Extended Features (Stretch)
**Goal:** Additional showcase value

- [ ] Video replay generation from stored frames
- [ ] Graph DB for decision tree visualization
- [ ] Real-time commentary generation
- [ ] Twitch/YouTube streaming integration
- [ ] Public leaderboard across all runs
- [ ] **Text-to-Speech Commentary** - AI agents speak their thoughts using Web Speech API or ElevenLabs
- [ ] **Personality System** - Each agent has distinct Twitch streamer personality for entertainment value
- [ ] **Clip Generation** - Auto-detect exciting moments and generate shareable clips
- [ ] **Victory celebration sequence** - Cinematic win screen when a model completes the game
- [ ] **Live commentary ticker** - Scrolling feed of notable events across all agents

---

## Environment Variables

```env
# AI Gateway (required)
AI_GATEWAY_API_KEY=

# Storage (required)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
BLOB_READ_WRITE_TOKEN=

# Database (required for persistence)
DATABASE_URL=

# Optional: Bring Your Own Keys
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
XAI_API_KEY=
```

---

## Performance Considerations

### Emulator Performance
- EmulatorJS runs at ~60fps natively
- AI decision rate should not block emulation
- Use Web Workers for heavy computation
- Consider throttling frame capture (1-5 fps sufficient for AI)

### AI Request Optimization
- Batch context when possible
- Cache static game knowledge in system prompt
- **Full model usage per agent** - Each agent uses its selected model for ALL decisions (no switching to cheaper models)
- This is a showcase - we want to see each model's true capabilities

### Browser Resource Management
- Limit concurrent emulators based on device capability
- Progressive loading of emulator cores
- Lazy load non-visible agents
- Monitor memory usage and warn users

---

## Security Considerations

- ROM file must be provided by user (legal requirement)
- ROM never uploaded to server, stays in browser
- AI API keys managed via environment variables
- No PII collected or stored
- Rate limiting on API routes

---

## Testing Strategy

### Unit Tests
- Workflow step functions
- Game state analysis
- Input mapping
- Split detection

### Integration Tests
- Emulator <-> Workflow communication
- AI Gateway fallback behavior
- State persistence

### E2E Tests
- Full game loop execution
- Multi-agent coordination
- UI interactions

---

## Resolved Design Decisions

### ROM Loading
- **File picker dialog** (primary method)
- **Drag and drop zone** (secondary method)  
- **Remote URL / default ROM** (for demos/testing with user's own hosted ROM)

### Emulation Speed
- **1x (Normal speed)** - AI latency will be the bottleneck, not gameplay speed

### Agent Visibility
- **User-toggleable** - Users can enable/disable any agent slot
- **Dynamic grid** - Layout adjusts based on number of active agents (1-6)
- **Responsive scaling** - Grid adapts to screen size

### AI Personality & Commentary
Each AI agent adopts a **Twitch streamer personality** for entertaining commentary:

| Agent Slot | Personality | Traits |
|------------|-------------|--------|
| 1 | Emiru-style | Wholesome, cute reactions, loves Pokemon |
| 2 | Asmongold-style | Blunt, strategic, complains about RNG |
| 3 | Jerma-style | Chaotic, unpredictable, makes weird observations |
| 4 | Ludwig-style | Competitive, stats-focused, trash talks other agents |
| 5 | Pokimane-style | Encouraging, methodical, celebrates small wins |
| 6 | xQc-style | Fast-talking, impatient, speedrun-focused |

**Stretch Goal:** Text-to-speech for important decisions and gameplay commentary

---

## Open Questions

1. **Save States**: Should we allow save state loading for faster testing/demos?
2. **Persistence**: How long should run history be retained?
3. **Public Access**: Should completed runs be shareable/viewable by others?

---

## References

- [Vercel AI Gateway](https://vercel.com/ai-gateway)
- [Vercel AI SDK v6](https://ai-sdk.dev/)
- [Workflow DevKit](https://useworkflow.dev/)
- [EmulatorJS Documentation](https://emulatorjs.org/docs/)
- [Pokemon LeafGreen Speedruns](https://www.speedrun.com/pkmnfrlg)
- [React Best Practices (Agent Skills)](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)

---

*Last Updated: January 22, 2026 23:30 UTC*  
*Version: 1.6.0*
*Council Review: 2026-01-22 2330 (rl-integration-improvements)*

---

## Changelog

### v1.6.0 (2026-01-22 2330)
- **Higher resolution screenshots** (480x320) for better visual analysis
- **Multi-button sequences** - AI can return 1-5 chained button presses per decision
- **MemStash persistent memory** - AI can write notes to remember across decisions
- **Button spam prevention** - WAIT max 3, B max 5, START/SELECT max 2 consecutive
- **GBA memory map documented** - RAM addresses for game state reading (partial implementation)
- **Visual interpretation warning** added to prompts
- **Reduced commentary requirement** - Only comment on notable events
- **Fixed starting room staircase guidance** - Removed confusing carpet reference

### v1.5.0 (2026-01-22 2200)
- RL paper integration - reward functions, milestone tracking
- Confidence score per button
- Progress confidence tracking
- Decision log with reasoning
*Integrations: vercel-labs/agent-skills react-best-practices (45 rules)*
*EmulatorJS: iframe architecture confirmed (postMessage communication)*
*Infrastructure: Upstash Redis (state/heartbeat), Vercel Blob (frame storage) - CONNECTED*
*RL Paper: arxiv:2502.19920 - Pokemon Red via Reinforcement Learning integrated*
