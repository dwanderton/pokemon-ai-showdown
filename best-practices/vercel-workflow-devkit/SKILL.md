# Vercel Workflow DevKit

## Overview

The Workflow Development Kit (WDK) is an open source TypeScript framework that makes durability a language-level concept. Functions can pause for minutes or months, survive deployments and crashes, and resume exactly where they stopped.

**Key Benefits:**
- No message queues, retry logic, or persistence layers to manage
- Familiar async/await patterns - no YAML or state machines
- Observable by default with built-in CLI and Web UI
- Runs on any framework, platform, and runtime

## References

| Resource | URL |
|----------|-----|
| Documentation | https://useworkflow.dev |
| Next.js Guide | https://useworkflow.dev/docs/getting-started/next |
| GitHub Repo | https://github.com/vercel/workflow |
| Blog Post | https://vercel.com/blog/introducing-workflow |
| API Reference | https://useworkflow.dev/docs/api |

## Installation

```bash
npm install workflow
```

### Next.js Configuration

Wrap `next.config.ts` with `withWorkflow()`:

```typescript
import { withWorkflow } from "workflow/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ...rest of your Next.js config
};

export default withWorkflow(nextConfig);
```

---

## Foundations

### 1. Workflows and Steps

Two fundamental entities:

**Workflow Functions** (`"use workflow"`):
- Orchestrate steps - the "conductor"
- Run in sandboxed environment without full Node.js access
- Must be **deterministic** for replay
- `Math.random` and `Date` are automatically fixed for determinism

```typescript
export async function processOrderWorkflow(orderId: string) {
  "use workflow";
  
  const order = await fetchOrder(orderId);
  const payment = await chargePayment(order);
  return { orderId, status: "completed" };
}
```

**Step Functions** (`"use step"`):
- Perform actual work
- Full Node.js runtime and npm package access
- Automatic retry on errors (default: 3 retries)
- Results persisted for replay

```typescript
async function chargePayment(order: Order) {
  "use step";
  
  const stripe = new Stripe(process.env.STRIPE_KEY);
  const charge = await stripe.charges.create({
    amount: order.total,
    currency: "usd",
    source: order.paymentToken
  });
  return { chargeId: charge.id };
}
```

**Important:** Parameters are passed by **value, not reference**. Always return modified data from steps.

### 2. Starting Workflows

Use `start()` from `workflow/api`:

```typescript
import { start } from "workflow/api";
import { handleUserSignup } from "./workflows/user-signup";

export async function POST(request: Request) {
  const { email } = await request.json();
  
  // Start workflow - returns immediately
  const run = await start(handleUserSignup, [email]);
  
  return Response.json({
    message: "Workflow started",
    runId: run.runId
  });
}
```

**Run Object Properties:**
- `runId` - Unique identifier
- `status` - "running" | "completed" | "failed" (async)
- `returnValue` - Final result (async, blocks until completion)
- `readable` - ReadableStream for streaming updates

**Common Patterns:**

```typescript
// Fire and forget
const run = await start(workflow, [args]);

// Wait for completion
const result = await run.returnValue;

// Stream updates
return new Response(run.readable);

// Check status later
const run = getRun(runId);
const status = await run.status;
```

### 3. Control Flow Patterns

**Sequential Execution:**
```typescript
const validated = await validateData(data);
const processed = await processData(validated);
const stored = await storeData(processed);
```

**Parallel Execution:**
```typescript
const [user, orders, preferences] = await Promise.all([
  fetchUser(userId),
  fetchOrders(userId),
  fetchPreferences(userId)
]);
```

**Race (first to complete wins):**
```typescript
await Promise.race([
  webhook,
  sleep("1 day"),
]);
```

### 4. Errors & Retrying

**Default:** Steps retry up to 3 times. Customize with `maxRetries`:

```typescript
async function callApi(endpoint: string) {
  "use step";
  // ...
}
callApi.maxRetries = 5; // 6 total attempts
```

**Error Types:**

```typescript
import { FatalError, RetryableError } from "workflow";

// Skip retries entirely
throw new FatalError("Resource not found");

// Customize retry delay
throw new RetryableError("Rate limited", {
  retryAfter: "1m" // or Date instance
});

// Exponential backoff
const metadata = getStepMetadata();
throw new RetryableError("Backing off", {
  retryAfter: (metadata.attempt ** 2) * 1000
});
```

**Rollback Pattern:**
```typescript
const rollbacks: Array<() => Promise<void>> = [];

try {
  await reserveInventory(orderId);
  rollbacks.push(() => releaseInventory(orderId));
  
  await chargePayment(orderId);
  rollbacks.push(() => refundPayment(orderId));
} catch (e) {
  for (const rollback of rollbacks.reverse()) {
    await rollback();
  }
  throw e;
}
```

### 5. Hooks & Webhooks

**Sleep (no resources consumed):**
```typescript
import { sleep } from "workflow";

await sleep("5s");    // seconds
await sleep("1m");    // minutes
await sleep("3d");    // days
await sleep("1 month"); // months
```

**Webhooks (pause for external events):**
```typescript
import { createWebhook } from "workflow";

const webhook = createWebhook();

// Send webhook.url to external service
await sendApprovalEmail(webhook.url);

// Workflow suspends until webhook is called
const { request } = await webhook;
const data = await request.json();
```

### 6. Streaming

**Write to stream from steps:**
```typescript
import { getWritable } from "workflow";

async function writeProgress(message: string) {
  "use step";
  
  const writable = getWritable<string>();
  const writer = writable.getWriter();
  await writer.write(message);
  writer.releaseLock(); // Always release!
}
```

**Consume stream:**
```typescript
const run = await start(workflow);
return new Response(run.readable);
```

**Namespaced streams:**
```typescript
const logs = getWritable<LogEntry>({ namespace: "logs" });
const metrics = getWritable<MetricEntry>({ namespace: "metrics" });

// Consume specific namespace
const logsStream = run.getReadable({ namespace: "logs" });
```

**Important:** Cannot read/write streams directly in workflow context - only in steps.

### 7. Serialization

**Supported Types:**
- Standard JSON: string, number, boolean, null, arrays, objects
- Extended: undefined, bigint, Date, Map, Set, URL, Headers
- TypedArrays: Uint8Array, Int32Array, Float64Array, etc.
- Web APIs: Request, Response, ReadableStream, WritableStream

**Streams are pass-through:** Data flows directly without being stored in event log.

### 8. Idempotency

Use `stepId` as idempotency key for external APIs:

```typescript
import { getStepMetadata } from "workflow";

async function chargeUser(userId: string, amount: number) {
  "use step";
  
  const { stepId } = getStepMetadata();
  
  await stripe.charges.create(
    { amount, currency: "usd", customer: userId },
    { idempotencyKey: stepId }
  );
}
```

**Best Practices:**
- Always provide idempotency keys to non-idempotent external calls
- Prefer `stepId` - stable across retries, unique per step
- Handle 409/conflict responses as success

---

## Project Structure

```
workflows/
  userOnboarding/
    index.ts        # Workflow function
    steps.ts        # Step functions
  aiVideoGeneration/
    index.ts
    steps/
      transcribeUpload.ts
      generateVideo.ts
      notifyUser.ts
  shared/
    validateInput.ts
    logActivity.ts
```

## Observability

```bash
# Open Web UI
npx workflow web

# CLI inspect
npx workflow inspect runs
```

## Logging Convention

Follow the `log-better` skill pattern:

```typescript
console.log(`[workflow:${workflowName}] Starting`, { input });
console.log(`[workflow:step:${stepName}] Processing`, { data });
console.error(`[workflow:step:${stepName}] Failed`, { error, stack });
```

## Common Mistakes

1. **Reading streams in workflow context** - Always delegate to steps
2. **Mutating objects passed to steps** - Pass-by-value, not reference
3. **Non-deterministic workflow code** - Avoid side effects in workflow functions
4. **Missing idempotency keys** - Always use `stepId` for external calls
5. **Not releasing stream locks** - Use try/finally pattern

## AI Agent Integration

```typescript
import { DurableAgent } from "@workflow/ai/agent";
import { getWritable } from "workflow";

export async function aiAssistantWorkflow(message: string) {
  "use workflow";
  
  const agent = new DurableAgent({
    model: "anthropic/claude-haiku-4.5",
    system: "You are a helpful assistant.",
    tools: { /* ... */ },
  });
  
  await agent.stream({
    messages: [{ role: "user", content: message }],
    writable: getWritable(),
  });
}
```
