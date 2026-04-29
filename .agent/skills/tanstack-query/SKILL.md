---
name: tanstack-query
description: TanStack Query v5 patterns for this project. Query key factories, custom hooks, mutations, cache invalidation, and route loader integration.
---

# TanStack Query v5 — Project Patterns

> SPA-only (TanStack Router + Vite). No SSR/RSC/Server Actions apply.

## 1. v5 Essentials

- Single object signature: `useQuery({ queryKey, queryFn, ...options })`
- `cacheTime` → `gcTime`, `keepPreviousData` → `placeholderData: keepPreviousData`
- `onSuccess`/`onError`/`onSettled` removed from `useQuery` — use global `QueryCache` callbacks
- Infinite queries require `initialPageParam`
- Let TypeScript **infer** types from `queryFn` — don't pass generics

## 2. Query Key Factory (per feature)

Place in `features/<feature>/lib/query-keys.ts`. Keys are hierarchical, include ALL variables used in `queryFn`:

```ts
export const featureKeys = {
  all: ['feature'] as const,
  list: (page: number, search: string) =>
    ['feature', 'list', page, search] as const,
  detail: (id: string) => ['feature', 'detail', id] as const,
}
```

Invalidation: `invalidateQueries({ queryKey: ['feature'] })` clears all; `queryKey: featureKeys.list(...)` clears specific.

## 3. Custom Hook Pattern

Place in `features/<feature>/hooks/use-<name>.ts`. Always wrap `useQuery`/`useMutation`:

```ts
import { useQuery } from '@tanstack/react-query'
import { fetchItems } from '../api/fetch-items'
import { featureKeys } from '../lib/query-keys'

/** @param page - 0-based page index. @param search - Filter string. */
export function useItems(page: number, search: string) {
  return useQuery({
    queryKey: featureKeys.list(page, search),
    queryFn: () => fetchItems(page, search),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
  })
}
```

## 4. Mutations & Cache Invalidation

```ts
export function useCreateItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateItemDTO) => createItem(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: featureKeys.all })
    },
  })
}
```

## 5. Optimistic Updates (when needed)

```ts
useMutation({
  mutationFn: updateItem,
  onMutate: async (updated) => {
    await queryClient.cancelQueries({ queryKey: featureKeys.all })
    const previous = queryClient.getQueryData(featureKeys.detail(updated.id))
    queryClient.setQueryData(featureKeys.detail(updated.id), updated)
    return { previous }
  },
  onError: (_err, updated, ctx) => {
    queryClient.setQueryData(featureKeys.detail(updated.id), ctx?.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: featureKeys.all })
  },
})
```

## 6. Route Loader Prefetch (TanStack Router)

```ts
export const Route = createFileRoute('/items/$id')({
  loader: ({ params }) =>
    queryClient.ensureQueryData({
      queryKey: featureKeys.detail(params.id),
      queryFn: () => fetchItem(params.id),
      staleTime: 30_000,
    }),
  component: ItemPage,
})
```

Use `ensureQueryData` (respects cache) over `fetchQuery` (always fetches).

## 7. Data Transformation

Use `select` for derived data — avoids copying to state and enables partial re-renders:

```ts
export const useItemCount = () =>
  useQuery({
    queryKey: featureKeys.all,
    queryFn: fetchItems,
    select: (data) => data.length,
  })
```

## 8. Anti-Patterns

| ❌ Don't                                                      | ✅ Do                       |
| ------------------------------------------------------------- | --------------------------- |
| Copy query data to `useState`                                 | Use query data directly     |
| `refetch()` with different params                             | Change params in `queryKey` |
| `.select('*')` in Supabase                                    | Explicit columns always     |
| Create `QueryClient` inside component                         | Stable instance outside     |
| Ignore `isPending` / `isError` states                         | Always handle both          |
| Use `queryKey: ['todos']` when `queryFn` depends on `filters` | Include all deps in key     |

## 9. staleTime Guide

| Data type             | staleTime              |
| --------------------- | ---------------------- |
| Real-time (default)   | `0`                    |
| User content          | `30_000` (30s)         |
| Profiles / config     | `1000 * 60 * 2` (2min) |
| Static reference data | `1000 * 60 * 5` (5min) |
