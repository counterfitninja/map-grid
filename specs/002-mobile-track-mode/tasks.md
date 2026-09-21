---

description: "Executable implementation tasks for mobile track mode"
---

# Tasks: Mobile Track Mode

**Input**: Design documents from `/specs/002-mobile-track-mode/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/ui-track-mode.md`, `quickstart.md`

**Tests**: No automated test runner was requested in the specification. Focused browser regression validation and the production build are included in the polish phase.

**Organization**: Tasks are grouped by user story so each increment can be implemented and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing single-page structure and feature design inputs before implementation.

- [X] T001 [P] Review `specs/002-mobile-track-mode/spec.md`, `plan.md`, `research.md`, `data-model.md`, and `contracts/ui-track-mode.md` and record the affected existing state and layer references in the implementation notes for `src/App.tsx`
- [X] T002 [P] Confirm `src/App.tsx` and `src/App.css` are the only application files required for the track-mode UI, Leaflet layer visibility, geolocation lifecycle, and responsive styling; do not add persistence or dependencies

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared mode and layer lifecycle behavior before story-specific controls are added.

- [X] T003 Add a session-only `normal`/`track` view-mode state in `src/App.tsx`, defaulting to `normal`, with explicit enter and exit handlers and no local-storage persistence
- [X] T004 Refactor the existing live-location effect in `src/App.tsx` so the geolocation watch is enabled only while track mode is active, remains browser-permission opt-in, and is cleared with its marker and temporary reading on exit
- [X] T005 Refactor route marker and route-line rendering in `src/App.tsx` to use one session-only route-visibility state, default hidden in normal view, without changing route waypoint geometry or saved-route data
- [X] T006 Add shared mode classes, touch-friendly control styling, and print exclusions in `src/App.css` while preserving the existing normal desktop and print layout

**Checkpoint**: Shared mode, route visibility, and location lifecycle are ready for user-story controls.

## Phase 3: User Story 1 - Start Mobile Track Mode (Priority: P1) 🎯 MVP

**Goal**: Let a mobile user enter a focused map view and see their current location when available.

**Independent Test**: In a narrow responsive viewport, select the top `Enter track mode` control, confirm the map fills the available view, grant location permission, and confirm the distinct location indicator/status appears; deny permission and confirm the map remains usable with an explanatory status.

### Implementation for User Story 1

- [X] T007 [US1] Add a prominent top-of-page `Enter track mode` control in `src/App.tsx` with a plain-language label, helper text, keyboard/touch activation, and an accessible name/state
- [X] T008 [US1] Add the track-mode layout in `src/App.css` so the map becomes the primary available-screen-area content on mobile-sized viewports while the existing Leaflet map remains mounted
- [X] T009 [US1] Add track-mode location status presentation in `src/App.tsx` for requesting, active, denied, unavailable, error, and stale states, including concise helper text and a distinct current-location indicator
- [X] T010 [US1] Trigger Leaflet map size invalidation from `src/App.tsx` after entering track mode and after mobile viewport/orientation changes so the full map renders without blank tile regions

**Checkpoint**: User Story 1 is independently usable as the mobile track-mode MVP.

## Phase 4: User Story 2 - Choose Whether to Show Routes (Priority: P1)

**Goal**: Let a user show or hide existing route overlays while remaining in track mode.

**Independent Test**: Enter track mode, switch the route visibility control on and off, and confirm route lines/markers appear or disappear while the base map and current-location indicator remain available.

### Implementation for User Story 2

- [X] T011 [US2] Add a clearly labelled `Show route`/`Hide route` toggle in the track-mode controls in `src/App.tsx`, exposing its current boolean state with `aria-checked` or an equivalent accessible control state
- [X] T012 [US2] Connect the route visibility toggle to the existing route marker layer and route line in `src/App.tsx`, ensuring hidden state removes both overlays without removing the base map, grid overlay, or live-location marker
- [X] T013 [US2] Add responsive track-mode toggle styling and helper text in `src/App.css` so the route control remains visible, touch-friendly, and readable over or beside the mobile map
- [X] T014 [US2] Preserve route visibility consistently during map movement, route recalculation, and track-mode session updates in `src/App.tsx` without changing saved-route serialization

**Checkpoint**: User Stories 1 and 2 work together, and route visibility is independently testable in track mode.

## Phase 5: User Story 3 - Return to the Normal Map View (Priority: P2)

**Goal**: Let a user exit track mode and return to the normal map-first page view safely.

**Independent Test**: Enter track mode, activate the exit control, confirm the normal view returns with the map at the top, routes hidden by default, the live marker removed, and location updates stopped.

### Implementation for User Story 3

- [X] T015 [US3] Add a clearly labelled `Exit track mode` control in `src/App.tsx` with keyboard/touch support and a status-friendly accessible name
- [X] T016 [US3] Implement the exit handler in `src/App.tsx` to stop live location updates, remove the current-location indicator, hide route overlays, and return mode state to `normal` without reloading
- [X] T017 [US3] Update normal-view responsive styling in `src/App.css` so the map is placed at the top and route overlays remain hidden by default after exit, while existing controls and print output remain usable
- [X] T018 [US3] Ensure `src/App.tsx` handles repeated enter/exit activation without duplicate geolocation watches, stale markers, or inconsistent mode state

**Checkpoint**: All user stories are independently functional and the normal/track transitions are safe.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete feature against the specification and constitution.

- [X] T019 [P] Update `specs/002-mobile-track-mode/quickstart.md` if implementation control labels or validation steps change
- [X] T020 [P] Review `src/App.tsx` and `src/App.css` for accessible labels, helper text, touch target sizing, keyboard focus, and print exclusion compliance
- [X] T021 [P] Review map behavior for coordinate accuracy, attribution, layer cleanup, and no raw location persistence/transmission in `src/App.tsx`
- [X] T022 Run `npm run lint` and resolve any feature-related diagnostics in `src/App.tsx` and `src/App.css`
- [X] T023 Run `npm run build` and resolve any production build errors caused by the feature
- [X] T024 Execute all browser scenarios in `specs/002-mobile-track-mode/quickstart.md`, including granted/denied location, route toggle, orientation change, keyboard use, exit cleanup, and print validation

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; T001 and T002 can run in parallel.
- **Foundational (Phase 2)**: Depends on Setup; T003-T006 establish shared state and lifecycle and should be completed before story work.
- **User Story 1 (Phase 3)**: Depends on Phase 2; this is the MVP increment.
- **User Story 2 (Phase 4)**: Depends on the shared route rendering from Phase 2 and can follow US1 for integrated validation.
- **User Story 3 (Phase 5)**: Depends on the mode and location lifecycle from Phase 2 and integrates with US1/US2 controls.
- **Polish (Phase 6)**: Depends on all desired user stories.

### User Story Dependencies

- **US1 (P1)**: Depends only on the Foundational phase.
- **US2 (P1)**: Depends only on the Foundational phase; can be developed in parallel with US1 if shared-file coordination is available.
- **US3 (P2)**: Depends only on the Foundational phase; integrates the same mode state and should be validated after US1 and US2.

### Parallel Opportunities

- T001 and T002 can run in parallel during setup.
- T019, T020, and T021 can run in parallel during polish because they target separate documentation/review concerns.
- If multiple developers coordinate edits to `src/App.tsx`, T007/T009, T011, and T015 can be prepared in parallel; implementation should be merged sequentially because they share the same component.
- T022 and T023 should run after implementation edits and can be run independently, while T024 follows the resulting build.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundational mode, route, and location lifecycle work.
3. Complete Phase 3 User Story 1.
4. Run the independent US1 browser validation and production checks.
5. Stop for review/demo before adding route visibility and exit refinements.

### Incremental Delivery

1. Add US1: enter focused mobile track mode and display location.
2. Add US2: toggle route overlays without losing the map or location.
3. Add US3: exit cleanly and restore the normal map-first view.
4. Run cross-cutting accessibility, privacy, print, lint, build, and browser validation.

## Notes

- Every implementation task uses the required `- [ ] Txxx` checklist format and includes an exact file path.
- No automated test tasks are included because the specification did not request TDD or a test framework.
- Route geometry, saved routes, map data, and coordinate transformations remain outside this feature's change scope.
