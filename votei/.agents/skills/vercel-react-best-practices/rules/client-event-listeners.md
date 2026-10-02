---
title: Deduplicate Global Event Listeners
impact: LOW
impactDescription: single listener for N components
tags: client, event-listeners, subscription
---

## Deduplicate Global Event Listeners

Register a global listener once at module scope and fan out to the component callbacks, instead of letting every hook instance add its own.

**Incorrect (N instances = N listeners):**

```tsx
function useKeyboardShortcut(key: string, callback: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === key) {
        callback()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, callback])
}
```

When using the `useKeyboardShortcut` hook multiple times, each instance will register a new listener.

**Correct (N instances = 1 listener):**

```tsx
// Module-level registry: one window listener, attached on the first
// subscriber and removed when the last one leaves.
const keyCallbacks = new Map<string, Set<() => void>>()

function onKeydown(e: KeyboardEvent) {
  if (e.metaKey) keyCallbacks.get(e.key)?.forEach(cb => cb())
}

function subscribe(key: string, callback: () => void) {
  if (keyCallbacks.size === 0) window.addEventListener('keydown', onKeydown)
  if (!keyCallbacks.has(key)) keyCallbacks.set(key, new Set())
  keyCallbacks.get(key)!.add(callback)

  return () => {
    const set = keyCallbacks.get(key)
    set?.delete(callback)
    if (set?.size === 0) keyCallbacks.delete(key)
    if (keyCallbacks.size === 0) window.removeEventListener('keydown', onKeydown)
  }
}

function useKeyboardShortcut(key: string, callback: () => void) {
  useEffect(() => subscribe(key, callback), [key, callback])
}

function Profile() {
  // Multiple shortcuts share the same window listener
  useKeyboardShortcut('p', () => { /* ... */ })
  useKeyboardShortcut('k', () => { /* ... */ })
  // ...
}
```
