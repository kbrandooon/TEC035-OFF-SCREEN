---
name: data-table-builder
description: Expert standards and templates for creating DataTables with server-side pagination, specialized APIs, and TanStack Query integration. Use this skill when implementing a new feature dashboard or refactoring existing tables to support large datasets.
---

# Data Table Builder

This skill provides a standardized workflow for building high-performance, paginated data tables in the TANSA-REB ecosystem. It ensures consistency in API design, hook implementation, and UI integration.

## Core Principles

1.  **Server-Side Pagination**: Never fetch all records if the dataset is potentially large. Use Supabase `.range()` and `{ count: 'exact' }`.
2.  **Screaming Architecture**: All logic (API, hooks, types, components) must live within the corresponding feature folder: `src/features/<feature-name>/`.
3.  **Single-Function APIs**: Follow the "one function per file" rule for API definitions.
4.  **Centralized Pagination**: Use the `DataTable` component's built-in pagination props. Do NOT create local pagination components.
5.  **Export Support**: Always provide a separate `getAll<Feature>` API function to support "Export Full Result" functionality.
6.  **Type Safety**: Use dedicated `types/<feature>.types.ts` for row definitions.

## Step-by-Step Guide

### 1. Define Types

Create `src/features/<feature>/types/<feature>.types.ts`.

```typescript
export interface <Feature>Row {
  id: string
  name: string
  // ... other columns
}

export interface <Feature>Filter {
  status: string[]
  // ... other metadata arrays or strings
}
```

### 2. Create Paginated API

Create `src/features/<feature>/api/get-<feature>.ts`.

```typescript
/**
 * Fetches a paginated slice of <feature> from the database.
 * @param page - 0-indexed page number.
 * @param pageSize - Number of records to return.
 * @param search - Optional search string for filtering.
 * @param filter - Optional filter state.
 * @returns { rows, total }
 */
export async function get<Feature>(page: number, pageSize: number, search = '', filter?: <Feature>Filter) {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  let query = supabase.from('<view_name>').select('*', { count: 'exact' }).range(from, to);
  // ... apply filters based on `filter` object
  const { data, count, error } = await query;
  if (error) throw error;
  return { rows: data as <Feature>Row[], total: count ?? 0 };
}
```

### 3. Create Export API (Batch Fetching)

Create `src/features/<feature>/api/get-all-<feature>.ts`. For potentially huge datasets, use a Query Builder and a `while` loop to fetch in batches (`range(from, to)`). This prevents database timeouts.

```typescript
export const build<Feature>Query = (search: string, filter?: <Feature>Filter) => {
  let query = supabase.from('<view_name>').select('*', { count: 'exact' });
  // ... apply filters
  return query;
};

/** Fetches ALL records in batches for export. */
export async function getAll<Feature>(search = '', filter?: <Feature>Filter): Promise<<Feature>Row[]> {
  const allData: <Feature>Row[] = [];
  const BATCH_SIZE = 1000;

  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const from = offset;
    const to = offset + BATCH_SIZE - 1;
    const { data, count, error } = await build<Feature>Query(search, filter).range(from, to);

    if (error) throw error;

    if (data && data.length > 0) {
      allData.push(...data as <Feature>Row[]);
      offset += BATCH_SIZE;
      hasMore = count ? offset < count : false;
    } else {
      hasMore = false;
    }
  }
  return allData;
}
```

### 4. Create Hook

Create `src/features/<feature>/hooks/use-<feature>.ts`.

```typescript
export const PAGE_SIZE = 20
export function use<Feature>(page: number, search = '', filter?: <Feature>Filter) {
  return useQuery({
    queryKey: ['<feature>', 'list', page, search, filter],
    queryFn: () => get<Feature>(page, PAGE_SIZE, search, filter),
  })
}
```

### 5. Create Filter Bar (Optional for Advanced Filtering)

If the feature requires filtering along multiple axes (e.g. by status, department, etc.), create `src/features/<feature>/components/<feature>-filter-bar.tsx`.

It should follow the pattern from `collaborators-filter-bar.tsx` encompassing:

- `FilterPill`: A clickable trigger for the active status.
- `FilterPopover`: An animated modal floating container for the options.
- `OptionRow`: A multi-selectable toggle element.
- It receives `{ filter, onFilterChange }` props to control state.

### 6. Implement Page Component

Integrate with the `DataTable`. Note how `onFilterChange` resets the `page` index.

```tsx
const [page, setPage] = useState(0);
const [filter, setFilter] = useState<<Feature>Filter>(DEFAULT_FILTER);
const { data, isLoading, isFetching } = use<Feature>(page, search, filter);

const handleFilterChange = useCallback((newFilter: <Feature>Filter) => {
  setFilter(newFilter);
  setPage(0); // Reset page automatically on filter change
}, []);

return (
  <div className="flex flex-col flex-1">
    <div className="mb-4">
      <<Feature>FilterBar filter={filter} onFilterChange={handleFilterChange} />
    </div>
    <DataTable<<Feature>Row>
      data={data?.rows ?? []}
      columns={columns}
      page={page}
      total={data?.total ?? 0}
      pageSize={PAGE_SIZE}
      isFetching={isFetching}
      onPageChange={setPage}
      exportConfig={{
        filename: '<feature>',
        onFetchAll: () => getAll<Feature>(search, filter),
      }}
    />
  </div>
);
```

## Checklist

- [ ] Does the API use `.range()` and `{ count: 'exact' }`?
- [ ] Is there a separate `getAll*` API for exports?
- [ ] Does the hook export `PAGE_SIZE`?
- [ ] Is the `page` state managed in the component and **reset** when search/filters change?
- [ ] Is `isFetching` passed to the `DataTable` for visual feedback?
- [ ] Are columns defined with `meta.label` for automatic export headers?
- [ ] (If using filters) Does the Filter Bar handle internal popover states cleanly?
