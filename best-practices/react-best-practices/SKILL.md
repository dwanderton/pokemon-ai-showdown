# React Best Practices

> Source: https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices
> Install: `npx skills add vercel-labs/agent-skills --skill react-best-practices`

## Overview

Comprehensive performance optimization guide for React applications, containing 40+ rules across 8 categories. Rules are prioritized by impact to guide automated refactoring and code generation.

## When to Apply

Reference these guidelines when:

- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React code
- Optimizing bundle size or load times

## Priority-Ordered Guidelines

Rules are prioritized by impact:

| Priority | Category | Impact |
|----------|----------|--------|
| 1 | Eliminating Waterfalls | CRITICAL |
| 2 | Bundle Size Optimization | CRITICAL |
| 3 | Server-Side Performance | HIGH |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH |
| 5 | Re-render Optimization | MEDIUM |
| 6 | Rendering Performance | MEDIUM |
| 7 | JavaScript Performance | LOW-MEDIUM |

---

## 1. Eliminating Waterfalls (CRITICAL)

### `async-parallel`
**Use `Promise.all()` for independent async operations**

```typescript
// BAD: Sequential waterfall
async function loadData() {
  const user = await fetchUser();
  const posts = await fetchPosts();
  const comments = await fetchComments();
  return { user, posts, comments };
}

// GOOD: Parallel execution
async function loadData() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchComments(),
  ]);
  return { user, posts, comments };
}
```

### `async-defer-await`
**Move await into the branch where data is actually used**

```typescript
// BAD: Awaiting immediately
async function getUser(id: string) {
  const user = await fetchUser(id);
  if (someCondition) {
    return user;
  }
  return null;
}

// GOOD: Defer await
async function getUser(id: string) {
  const userPromise = fetchUser(id);
  if (someCondition) {
    return await userPromise;
  }
  return null;
}
```

---

## 2. Bundle Size Optimization (CRITICAL)

### `bundle-barrel-imports`
**Import directly from source, avoid barrel files**

```typescript
// BAD: Barrel import pulls entire module
import { Button } from '@/components';
import { formatDate } from '@/utils';

// GOOD: Direct import
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/date';
```

### `bundle-dynamic-imports`
**Use `next/dynamic` for heavy components**

```typescript
// BAD: Static import of heavy component
import { HeavyChart } from './HeavyChart';

// GOOD: Dynamic import with loading state
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```

### `bundle-defer-third-party`
**Defer non-critical third-party libraries**

```typescript
// BAD: Immediate import
import confetti from 'canvas-confetti';

// GOOD: Dynamic import when needed
async function celebrate() {
  const confetti = (await import('canvas-confetti')).default;
  confetti();
}
```

### `bundle-preload`
**Preload on hover/focus for instant navigation**

```typescript
import { useRouter } from 'next/navigation';

function NavLink({ href, children }) {
  const router = useRouter();
  
  return (
    <Link
      href={href}
      onMouseEnter={() => router.prefetch(href)}
      onFocus={() => router.prefetch(href)}
    >
      {children}
    </Link>
  );
}
```

---

## 3. Server-Side Performance (HIGH)

### `server-cache-react`
**Use `React.cache()` for per-request deduplication**

```typescript
import { cache } from 'react';

export const getUser = cache(async (id: string) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

// Multiple components can call getUser(id) and it only fetches once per request
```

### `server-parallel-fetching`
**Restructure to parallelize server fetches**

```typescript
// BAD: Sequential in component tree
async function Page() {
  const user = await getUser(); // Blocks
  return <Posts userId={user.id} />; // Then this fetches
}

// GOOD: Parallel fetching
async function Page() {
  const userPromise = getUser();
  const postsPromise = getPosts();
  
  const [user, posts] = await Promise.all([userPromise, postsPromise]);
  return <PostsList user={user} posts={posts} />;
}
```

### `server-after-nonblocking`
**Use `after()` for non-blocking operations**

```typescript
import { after } from 'next/server';

export async function POST(request: Request) {
  const data = await request.json();
  const result = await saveToDatabase(data);
  
  // Non-blocking: runs after response is sent
  after(async () => {
    await sendAnalytics(data);
    await updateCache();
  });
  
  return Response.json(result);
}
```

---

## 4. Client-Side Data Fetching (MEDIUM-HIGH)

### `client-swr-dedup`
**Use SWR for automatic request deduplication**

```typescript
import useSWR from 'swr';

// Multiple components using the same key share one request
function useUser(id: string) {
  return useSWR(`/api/users/${id}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  });
}
```

### `client-request-dedupe`
**Deduplicate requests with Tanstack Query or SWR**

```typescript
// Both libraries automatically deduplicate requests with the same key
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  staleTime: 5000,
});
```

---

## 5. Re-render Optimization (MEDIUM)

### `rerender-lazy-state-init`
**Pass function to useState for expensive initial values**

```typescript
// BAD: Expensive computation runs every render
const [data, setData] = useState(expensiveComputation());

// GOOD: Only runs on initial mount
const [data, setData] = useState(() => expensiveComputation());
```

### `rerender-transitions`
**Use `startTransition` for non-urgent updates**

```typescript
import { startTransition } from 'react';

function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  function handleSearch(value: string) {
    setQuery(value); // Urgent: update input immediately
    
    startTransition(() => {
      setResults(filterResults(value)); // Non-urgent: can be interrupted
    });
  }
}
```

### `rerender-useeffect-function-calls`
**Minimize function calls inside useEffect**

```typescript
// BAD: Creates new function every render
useEffect(() => {
  const handler = () => console.log(value);
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, [value]);

// GOOD: Use useEffectEvent (React 19.2+)
import { useEffectEvent } from 'react';

const handler = useEffectEvent(() => {
  console.log(value); // Always has latest value
});

useEffect(() => {
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []); // No dependencies needed
```

---

## 6. Rendering Performance (MEDIUM)

### `rendering-activity`
**Use `<Activity>` for show/hide without destroying state**

```typescript
import { Activity } from 'react';

function TabContainer({ activeTab }) {
  return (
    <>
      <Activity mode={activeTab === 'a' ? 'visible' : 'hidden'}>
        <ExpensiveTabA />
      </Activity>
      <Activity mode={activeTab === 'b' ? 'visible' : 'hidden'}>
        <ExpensiveTabB />
      </Activity>
    </>
  );
}
```

### `rendering-content-visibility`
**Use `content-visibility: auto` for long lists**

```css
.list-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 50px; /* Estimated height */
}
```

### `rendering-animate-svg-wrapper`
**Animate SVG wrappers, not SVG elements directly**

```typescript
// BAD: Animating SVG element directly
<motion.svg animate={{ rotate: 360 }}>...</motion.svg>

// GOOD: Wrap in a div
<motion.div animate={{ rotate: 360 }}>
  <svg>...</svg>
</motion.div>
```

---

## 7. JavaScript Performance (LOW-MEDIUM)

### `js-set-map-lookups`
**Use Set/Map for O(1) lookups instead of Array.includes**

```typescript
// BAD: O(n) lookup
const types = ['fire', 'water', 'grass'];
if (types.includes(pokemon.type)) { ... }

// GOOD: O(1) lookup
const typesSet = new Set(['fire', 'water', 'grass']);
if (typesSet.has(pokemon.type)) { ... }
```

### `js-cache-function-results`
**Cache expensive function results at module level**

```typescript
const spriteCache = new Map<string, string>();

function getSpriteUrl(pokemonId: string): string {
  if (spriteCache.has(pokemonId)) {
    return spriteCache.get(pokemonId)!;
  }
  const url = computeSpriteUrl(pokemonId);
  spriteCache.set(pokemonId, url);
  return url;
}
```

### `js-early-exit`
**Return early from functions to avoid unnecessary work**

```typescript
// BAD: Nested conditions
function processFrame(agent: Agent) {
  if (agent.isActive) {
    if (!agent.isPaused) {
      // Do work
    }
  }
}

// GOOD: Early returns
function processFrame(agent: Agent) {
  if (!agent.isActive) return;
  if (agent.isPaused) return;
  // Do work
}
```

### `js-tosorted-immutable`
**Use `toSorted()` instead of `sort()` for immutability**

```typescript
// BAD: Mutates original array
const sorted = items.sort((a, b) => a.score - b.score);

// GOOD: Returns new array
const sorted = items.toSorted((a, b) => a.score - b.score);
```

### `js-length-check-first`
**Check array length before expensive comparisons**

```typescript
// BAD: Always iterates
function arraysEqual(a: number[], b: number[]) {
  return a.every((val, i) => val === b[i]);
}

// GOOD: Early exit on length mismatch
function arraysEqual(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  return a.every((val, i) => val === b[i]);
}
```

---

## Rule Quick Reference

| Rule ID | Category | Pattern |
|---------|----------|---------|
| `async-parallel` | Waterfalls | Use `Promise.all()` |
| `async-defer-await` | Waterfalls | Move await into branches |
| `bundle-barrel-imports` | Bundle | Import directly |
| `bundle-dynamic-imports` | Bundle | Use `next/dynamic` |
| `bundle-defer-third-party` | Bundle | Dynamic import libraries |
| `bundle-preload` | Bundle | Preload on hover/focus |
| `server-cache-react` | Server | Use `React.cache()` |
| `server-parallel-fetching` | Server | Parallelize fetches |
| `server-after-nonblocking` | Server | Use `after()` |
| `client-swr-dedup` | Client | Use SWR |
| `client-request-dedupe` | Client | Dedupe with query libs |
| `rerender-lazy-state-init` | Re-render | Lazy useState |
| `rerender-transitions` | Re-render | Use `startTransition` |
| `rerender-useeffect-function-calls` | Re-render | Use `useEffectEvent` |
| `rendering-activity` | Rendering | Use `<Activity>` |
| `rendering-content-visibility` | Rendering | CSS content-visibility |
| `rendering-animate-svg-wrapper` | Rendering | Wrap SVG animations |
| `js-set-map-lookups` | JS | Use Set/Map |
| `js-cache-function-results` | JS | Module-level cache |
| `js-early-exit` | JS | Return early |
| `js-tosorted-immutable` | JS | Use `toSorted()` |
| `js-length-check-first` | JS | Check length first |
