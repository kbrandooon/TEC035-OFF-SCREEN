# Example: Implementing a Paginated Material Bank Table

See the following files for a complete implementation reference:

1.  **API (Paginated)**: `src/features/material-bank/api/get-material-banks.ts`
2.  **API (Export)**: `src/features/material-bank/api/get-all-material-banks.ts`
3.  **Hook**: `src/features/material-bank/hooks/use-material-banks.ts`
4.  **Page**: `src/features/material-bank/components/material-bank-page.tsx`

### Key Highlights

- **API**: Uses `.range(from, to)` to fetch slices.
- **Hook**: Accepts `page` and returns `{ rows, total }`.
- **Page**:
  - Manages `[page, setPage] = useState(0)`.
  - Passes `page`, `total`, `pageSize`, `isFetching`, and `onPageChange` to `DataTable`.
  - Uses `getAllMaterialBanks` in `exportConfig.onFetchAll`.
