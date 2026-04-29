# Coding Conventions

## Folder Structure
Use these standard top-level groupings (naming can be adapted, intent must remain):

- `components/` — reusable UI controls (no business logic)
- `containers/` — orchestration layer, binds UI to app state
- `views/` — page templates for routes
- `stores/` — actions, thunks, slices/reducers, selectors
- `api/` — client API methods
- `hooks/` — reusable, non-domain hooks
- `domain/` (optional) — project-specific concepts/types

## Layer Rules (non-negotiable)
- Components must not talk to stores or APIs.
- Containers must not talk to APIs directly.
- Async/network work goes in thunks/effects only.
- State is read via selectors only.
- Reducers/slices are pure.

## Naming
- Actions describe what happened:
  - `FOO_CLICKED`, `USER_SIGNED_OUT`, `FILTER_CHANGED`
- Thunks describe what should happen:
  - `fetchOrders`, `saveReport`, `syncQueue`
- Selectors start with `select`:
  - `selectCurrentUser`, `selectOrders`, `selectIsAuthenticated`

## One component per file
- Each file must export exactly one React component.
- Do not define multiple components in the same file, even small helper components.
- Every component, including helpers, gets its own top-level folder under `components/` (e.g. `components/SectionHeader/`), never nested inside another component's folder.
- Treat all components as first-class — they may be reused elsewhere later.

## File Size / Complexity
- Prefer small files with single responsibility.
- Split when a file becomes difficult to scan.

## Error Handling
- API layer normalizes errors.
- Thunks map errors into store state.
- UI renders state; it doesn't interpret raw API errors.

## "Avoid Turbulence"
- No data fetching in components.
- Avoid "smart hooks" that become mini-stores.
- Keep the cycle obvious and traceable.



## No barrel files (index.ts re-exports)

We do not use barrel files (index.ts that re-export from sibling modules). Always import from the concrete module you need.

Rationale:
- Improves clarity and discoverability; imports show the real source file.
- Reduces risk of circular dependencies and weird tree-shaking side effects.
- Speeds up IDE navigation and refactoring.

Do this:
- import { flowersSlice } from '../stores/flowers/slice'
- import { selectFilteredFlowers } from '../stores/flowers/selectors'

Do NOT do this:
- import { selectFilteredFlowers, flowersSlice } from '../stores/flowers' // via index.ts
- Create index.ts files whose sole purpose is to re-export other files.

Enforcement:
- Code review: reject PRs that introduce index.ts barrels.
- Prefer explicit, file-level imports throughout the codebase.

Specific to Views and Containers:
- Do NOT create index.ts files inside src/views/* or src/containers/* directories.
- Each view/container should be imported directly from its concrete file (e.g., src/views/Root/RootView.tsx, src/containers/Catalogue/CatalogueContainer.tsx).


---

## API layer placement and naming (2026-02-13)
- All API calls must live in `src/api/`.
- Do NOT place HTTP/API code in `src/services/`.
- Each API function resides in its own file named exactly after the function (camelCase):
  - Example: `fetchFlowers.ts` exports `fetchFlowers`.
- Prefer one function per file. If multiple functions are truly related, reconsider and split; only keep them together with a clear justification.
- Import directly from the specific file; avoid barrels:
  - `import { fetchFlowers } from '../api/fetchFlowers'`
- When touching older code, migrate any `services/...` imports to `api/...` and align filenames with function names.
