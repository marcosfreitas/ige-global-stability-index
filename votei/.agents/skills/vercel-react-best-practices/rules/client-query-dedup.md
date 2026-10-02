---
title: Use TanStack Query for Automatic Deduplication
impact: MEDIUM-HIGH
impactDescription: automatic deduplication
tags: client, tanstack-query, deduplication, data-fetching
---

## Use TanStack Query for Automatic Deduplication

A query library deduplicates requests, caches results and revalidates them across component instances. This repo uses TanStack Query v5 (`src/shared/providers/query-provider.tsx`); do not add SWR alongside it.

**Incorrect (no deduplication, each instance fetches):**

```tsx
function UserList() {
  const [users, setUsers] = useState([])
  useEffect(() => {
    fetch('/api/v1/users')
      .then(r => r.json())
      .then(setUsers)
  }, [])
}
```

**Correct (multiple instances share one request):**

Instances that use the same `queryKey` share one in-flight request and one cache entry.

```tsx
import { useQuery } from '@tanstack/react-query'

function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/v1/users').then(r => r.json()),
  })
}

function UserList() {
  const { data: users } = useUsers()
}
```

Keep the key and the fetcher in one custom hook, as above, so two components can never disagree on the key and silently fetch twice.

**For data that never changes during a session:**

```tsx
function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: fetchConfig,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
```

**For mutations, invalidate the queries they affect:**

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

function UpdateButton() {
  const queryClient = useQueryClient()
  const { mutate } = useMutation({
    mutationFn: updateUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
  return <button onClick={() => mutate()}>Update</button>
}
```

Reference: [https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
