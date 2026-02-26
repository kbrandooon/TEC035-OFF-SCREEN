---
name: tanstack-best-practices
description: Comprehensive guidance for TanStack ecosystem (Query v5, Router, Table v8). Covers type-safety, performance optimization, and architectural patterns.
---

# TanStack Best Practices

## Core Principles

1. **Type Safety First**: Leverage TanStack's deep TypeScript integration for 100% type inference across routing, data fetching, and table columns.
2. **Headless & Flexible**: Embrace the headless nature of Table and Router to maintain full control over UI implementation while offloading complex logic.
3. **Optimized Data Flow**: Prevent waterfalls using Router loaders and optimize Query caching to ensure a snaping user experience.
4. **Co-location**: Align TanStack features with Screaming Architecture by placing feature-specific queries and routes within their respective feature folders.

## TanStack Query (v5)

### Best Practices

- **Custom Hooks**: Always encapsulate `useQuery` and `useMutation` in custom hooks.
- **Query Key Factories**: Use a central object or factory for query keys to avoid magic strings and ensure consistency.
- **Fine-Tune Caching**:
  - Adjust `staleTime` (defaults to 0) to avoid unnecessary refetches.
  - Understand `gcTime` (formerly `cacheTime`) for memory management.
- **Server State vs. Client State**: Use TanStack Query exclusively for server state; don't mix it with local UI state unless necessary.

### Checklist

- [ ] Are query keys structured in an array?
- [ ] Is `staleTime` explicitly considered for the use case?
- [ ] Are transformations handled via the `select` option to keep components clean?
- [ ] Is `initialPageParam` provided for infinite queries?

## TanStack Router

### Best Practices

- **Type-Safe Navigation**: Use the generated `routeTree` and avoid manual URL manipulation.
- **Data Loaders**: Fetch critical data in `loader` functions to initiate requests as soon as the URL starts changing.
- **Search Parameter Management**: Treat search params as first-class state. Use type-safe JSON-first validation.
- **File-Based Routing**: Stick to the recommended directory structure for automatic route generation.

### Checklist

- [ ] Are routes defined with `.lazy.tsx` for code-splitting where appropriate?
- [ ] Are search params validated with a schema (e.g., Zod)?
- [ ] Is the `loader` catching errors and providing fallbacks?

## TanStack Table (v8)

### Best Practices

- **Memoize Everything**: Memoize column definitions and data to prevent performance-killing re-renders.
- **Stable IDs**: Use `getRowId` to ensure row state (selection, expansion) persists correctly.
- **Server-Side Everything**: For large datasets, delegate sorting, filtering, and pagination to the backend via TanStack Query.
- **Virtualization**: Use `@tanstack/react-virtual` for tables exceeding 1,000 rows.

### Checklist

- [ ] Are column definitions stable (outside component or `useMemo`)?
- [ ] Is `manualPagination: true` set for server-side logic?
- [ ] Are cells using local state if they are highly interactive (editable)?

## Code Snippets

### Query Key Factory

```typescript
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}
```

### Type-Safe Router Search Params

```typescript
const productSearchSchema = z.object({
  page: z.number().catch(1),
  filter: z.string().optional(),
})

export const Route = createFileRoute('/products')({
  validateSearch: (search) => productSearchSchema.parse(search),
})
```
