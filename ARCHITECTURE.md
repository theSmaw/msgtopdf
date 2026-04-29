# Front-end Architecture: Laminar Data Flow

This codebase follows a **laminar flow** architecture: data moves through a predictable, repeatable cycle with well-defined building blocks.

If we start doing work outside the prescribed places (e.g. data fetching + storage inside hooks bound to components), we introduce **turbulence**—eddies of state and side effects scattered around the app. This makes the system hard to reason about, test, and change safely.

---

## Key Principles

- Data flow should be **unidirectional and predictable**.
- Each building block should be able to run in isolation (where practical).
- We build view-logic-only blocks (**components**) and stitch them together through **containers**.
- Components should be portable and reusable.
- Containers can contain any components.
- Business logic should be centralized and testable (preferably in stores/reducers/slices and async-thunks).

---

## Building Blocks

### app
**Root of the application.**
- Bootstraps the store and global services.
- Sets up top-level routing.
- Wires global cross-cutting concerns (configuration, analytics, user/session).

### route
A segment represented by a URL path.
- Should be possible to deep link into any route.
- A route should generally map to a single view.

### view
The HTML structure for a route.
- May have associated CSS.
- Embeds one or more containers.
- **Should contain no business logic.**
- May hold small local UI state (e.g. modal open/close).

### container
React components that represent the "application layer" glue.
- Orchestrate communication between:
  - user interaction (via components)
  - state (via selectors)
  - updates (via dispatching actions / thunks)
- May dispatch actions and read state via selectors.
- Should not contain associated CSS (layout-only exceptions happen).
- **Should not contain business logic.**
- **Should not talk directly to APIs.**
- Should avoid promises/await; prefer the async-thunk lifecycle.

### component
Reusable UI layout and controls.
- Unaware of the application around them.
- Can have visual branching (appearance/variants).
- May have local UI state driven by props and user interaction.
- **Must not contain business logic.**
- **Must not talk to stores or APIs.**
- **Must not use router hooks** (`useNavigate`, `useParams`, etc.) — receive navigation as plain callbacks via props.
- Should be developable and testable in isolation (Storybook style).

### hooks
Reusable React hooks (e.g. debounce).
- Hooks may help extract orchestration out of containers, but:
  - their use should be minimized
  - we should be reluctant to store app state in them
  - they must not become an implicit data layer
- Hooks should not become "mini-stores" or "hidden network layers".

---

## State Layer Concepts

### store
Business logic layer for the client.
- Prefer keeping business logic on the server where possible.
- In the client:
  - store layer is built of actions, async-thunks, reducer slices, selectors
- Stores should not know about each other directly (except via actions they can listen to).

### action
Initiates computation within the store layer (no network).
- Created using action creators.
- Dispatched by containers.
- Action names should describe **what happened**, not what we want to happen.
  - ✅ `LOGIN_BUTTON_CLICKED`
  - ❌ `AUTHENTICATE_USER`

### asyncThunk (effect)
Initiates computation that requires server interaction.
- The **only place** we should use `await` / async / promises for network workflows.
- Dispatched by containers (or by other thunks when appropriate).
- Results are dispatched and can be listened to by the associated slice and other stores.

### api
Mechanism to communicate with the network.
- Client API should reflect the API we *want*, not the server's raw endpoints.
  - If server requires multiple calls, client API can expose one cohesive method.
- API methods should be consistent about error handling/logging.

### slice (reducer)
Maintains state for its branch.
- State updated in response to actions and thunk results.
- Pure functions only (no side effects, no dispatching further actions).

### selector
The only way containers access state.
- Containers consume selectors so they don't need to know store structure.
- Prefer typed selectors.

---

## The Laminar Flow Cycle (the "circle")

**container → action/asyncThunk → store/slice → selector → container/component**

Where you should be able to point to:
- the complete state
- the only places state changes
- the only places we touch the network

If you add data fetching or state storage inside components/hooks directly, you create turbulence.

---

## Data Persistence and ORM

The front-end communicates only with an API layer; it does not access databases directly.
- When moving from mocks to a real backend, use an ORM (e.g., Prisma, Drizzle, TypeORM) in the server to manage schema, migrations, and queries.
- See FLORAI_SETUP.md → “Install Prisma or equivalent ORM” for a minimal, step-by-step setup and selection guidance.

## Testing Guidance

- Primary unit tests should focus on:
  - slices/reducers
  - selectors
  - thunk logic (with mocked API)
- Components: visual + interaction tests in isolation.
- Containers: minimal tests; they should be thin.

