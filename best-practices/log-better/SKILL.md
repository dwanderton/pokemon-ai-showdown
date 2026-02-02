---
name: log-better
description: Standards for meaningful logging during development. Know which part of the app logs come from.
---

# Log Better

Meaningful, structured logging that makes debugging fast and clear.

## Log Prefixes

Every log must start with a bracketed prefix identifying its source:

| Prefix | Source |
|--------|--------|
| `[emulator]` | EmulatorJS iframe, postMessage bridge |
| `[emulator:frame]` | Frame capture events |
| `[emulator:input]` | Button press injection |
| `[api]` | API route handlers |
| `[api:decide]` | AI decision endpoint |
| `[api:heartbeat]` | Heartbeat endpoint |
| `[api:state]` | State persistence endpoint |
| `[api:frames]` | Frame storage endpoint |
| `[workflow]` | Workflow DevKit main loop |
| `[workflow:step:{name}]` | Individual workflow steps |
| `[hook:{name}]` | React hooks |
| `[component:{name}]` | React components |
| `[redis]` | Redis operations |
| `[blob]` | Vercel Blob operations |

## Log Levels

```typescript
// INFO: Normal operation milestones
console.log('[emulator] Ready, ROM loaded');

// DEBUG: Detailed state for troubleshooting  
console.log('[workflow:step:analyze] Frame received', { size: frame.length });

// WARN: Something unexpected but recoverable
console.warn('[api:decide] Slow response from model', { latency: 2500 });

// ERROR: Something broke - BE VERBOSE
console.error('[emulator] Failed to inject input', {
  button,
  error: error.message,
  stack: error.stack,
  iframeState: iframe?.contentWindow ? 'accessible' : 'blocked',
  lastSuccessfulInput: lastInput,
});
```

## Rules

1. **Prefix every log** - No naked `console.log('foo')`
2. **NEVER use generic prefixes** - Forbidden: `[v0]`, `[next]`, `[react]`, `[app]`, `[debug]`
   - These tell you nothing about the source. Always identify the specific module/responsibility.
   - Bad: `[v0] Button pressed`
   - Good: `[component:AgentCard] Button pressed`
3. **Errors must be verbose** - Include all context needed to debug
4. **Include timestamps for async operations** - `{ startedAt, completedAt, duration }`
5. **Log state transitions** - `[component:AgentCard] Status: initializing -> ready`
6. **Log external calls** - Before and after API/DB calls
7. **Remove debug logs before PR** - Or gate behind `NODE_ENV === 'development'`

## Error Logging Template

```typescript
console.error(`[${prefix}] ${action} failed`, {
  // What we were trying to do
  action,
  input: sanitizedInput,
  
  // What went wrong
  error: error.message,
  code: error.code,
  stack: error.stack,
  
  // Context for debugging
  state: currentState,
  timestamp: Date.now(),
  
  // Recovery hints
  willRetry: shouldRetry,
  fallback: fallbackAction,
});
```

## Examples

### Good
```typescript
console.log('[emulator] Initializing', { romUrl, agentId });
console.log('[emulator] postMessage sent', { type: 'PRESS_BUTTON', button: 'A' });
console.log('[emulator:frame] Captured', { size: base64.length, timestamp });
console.error('[emulator] iframe load failed', { 
  src: iframeSrc,
  error: event.message,
  readyState: iframe.contentDocument?.readyState 
});
```

### Bad
```typescript
console.log('loaded');           // No prefix, no context
console.log(data);               // No prefix, raw dump
console.error('error');          // Useless
console.error(e);                // Missing context
```

## Async Operation Pattern

```typescript
const operationId = crypto.randomUUID().slice(0, 8);
console.log(`[api:decide] Starting AI analysis`, { operationId, model });

try {
  const startTime = Date.now();
  const result = await generateObject({ ... });
  
  console.log(`[api:decide] Analysis complete`, { 
    operationId, 
    duration: Date.now() - startTime,
    decision: result.button 
  });
} catch (error) {
  console.error(`[api:decide] Analysis failed`, {
    operationId,
    model,
    error: error.message,
    stack: error.stack,
  });
}
```
