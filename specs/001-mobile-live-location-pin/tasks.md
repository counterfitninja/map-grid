# Tasks: Mobile Live Location Pin

**Input**: Design documents from `/specs/001-mobile-live-location-pin/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/ui-live-location.md`, `quickstart.md`

**Tests**: No automated test runner is currently configured and the feature specification does not require TDD. Focused browser/device validation and lint/build checks are included.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the existing application touchpoints and validation baseline.

- [X] T001 Inspect existing Leaflet marker lifecycle and print CSS in `src/App.tsx` and `src/App.css`, documenting the integration points in the implementation notes
- [X] T002 [P] Confirm the current validation commands and browser geolocation secure-context requirements in `specs/001-mobile-live-location-pin/quickstart.md`

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define shared in-memory location policy and lifecycle boundaries before story implementation.

- [X] T003 Define the live-location status union, temporary location-reading shape, and session constants in `src/App.tsx`, preserving the data-model rules that readings are session-only and never persisted
- [X] T004 [P] Define the accepted accuracy threshold of 100 metres, 60-second freshness window, and browser watch options in `src/App.tsx` beside the live-location policy constants
- [X] T005 [P] Add dedicated live-location marker styling hooks and print-safe behavior in `src/App.css`, keeping the live marker distinct from dropped pings and route markers

**Checkpoint**: Shared policy and styling boundaries are ready; user-story implementation can begin.

## Phase 3: User Story 1 - See Current Position on the Map (Priority: P1) 🎯 MVP

**Goal**: Let a mobile user opt in, receive an accurate position, and see one live pin move periodically without automatic map panning.

**Independent Test**: On a supported mobile device in a secure context, enable live location, grant permission, provide two valid positions, and verify the distinct pin appears and moves without a reload or automatic map pan.

### Implementation for User Story 1

- [X] T006 [US1] Add a dedicated `liveLocationMarkerRef` and temporary accepted-reading refs/state in `src/App.tsx`, separate from `pingMarkerRef` and route marker state
- [X] T007 [US1] Create the distinct Leaflet live-location icon and marker update helper in `src/App.tsx`, including the `Your live location` popup/accessible description and reuse of one marker instance
- [X] T008 [US1] Implement valid-reading acceptance in `src/App.tsx` for finite latitude/longitude, non-negative finite accuracy at or below 100 metres, finite timestamps, and newer readings superseding older readings
- [X] T009 [US1] Start one `navigator.geolocation.watchPosition` only when live location is enabled in `src/App.tsx`, using high accuracy, a finite timeout, and no reusable maximum age
- [X] T010 [US1] Update the live marker, temporary grid reference, last-update metadata, and active status from each accepted browser reading in `src/App.tsx` without changing map centre, zoom, route points, or print title
- [X] T011 [US1] Add the `Show my live location` control and helper text to the sidebar UI in `src/App.tsx`, defaulting it off on every page load and reporting the requesting/active states from the UI contract

**Checkpoint**: User Story 1 is independently demonstrable with permission granted and two valid position updates.

## Phase 4: User Story 2 - Understand Location Status (Priority: P2)

**Goal**: Make granted, denied, unavailable, inaccurate, and stale location states understandable while keeping the map usable.

**Independent Test**: Exercise granted, denied, unavailable, timeout, low-accuracy, and no-update states and verify each status is clear while map navigation, overlays, and printing continue to work.

### Implementation for User Story 2

- [X] T012 [US2] Map geolocation permission, unsupported-device, timeout, and other browser errors to the UI contract messages in `src/App.tsx`, including `denied`, `unavailable`, and general error states without breaking the map
- [X] T013 [US2] Add rejected-reading feedback for invalid or over-100-metre accuracy readings in `src/App.tsx`, preserving the last accepted marker only when its status is not falsely presented as current
- [X] T014 [US2] Add the in-memory 60-second freshness timer and stale-state transition in `src/App.tsx`, clearing the timer on disable/unmount and never persisting coordinates or timestamps
- [X] T015 [US2] Render the live-location status in an accessible live region in `src/App.tsx` using the contract states, including `Requesting location…`, `Waiting for an accurate location…`, and stale messaging
- [X] T016 [US2] Ensure the location lifecycle cleanup in `src/App.tsx` clears the browser watch, removes the live marker, clears the accepted reading, and prevents callbacks from updating state after disable or unmount

**Checkpoint**: User Story 2 is independently demonstrable across success and failure states without impairing normal map or print use.

## Phase 5: User Story 3 - Protect Location Privacy (Priority: P3)

**Goal**: Ensure live location is explicitly controlled, session-only, and fully removed when disabled.

**Independent Test**: Use the map without enabling location, enable and then disable it, reload the page, and verify no location request occurs by default and no live pin or prior reading returns.

### Implementation for User Story 3

- [X] T017 [US3] Implement the disable handler in `src/App.tsx` so turning off live location stops updates immediately, removes the live marker, clears session-only reading/grid-reference state, and reports `Live location off`
- [X] T018 [US3] Audit `src/App.tsx` location-related effects and handlers to ensure no coordinates are written to `localStorage`, URL parameters, analytics payloads, or network requests
- [X] T019 [US3] Ensure live-location state is not included in saved-route export/import or any other existing persistence paths in `src/App.tsx`
- [X] T020 [US3] Verify the live-location control and status text remain keyboard/touch accessible and include meaningful labels/helper text in `src/App.tsx` and `src/App.css`

**Checkpoint**: All three stories are independently testable and location data remains local to the current map session.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify regressions, refine documentation, and validate the feature end to end.

- [ ] T021 [P] Update `specs/001-mobile-live-location-pin/quickstart.md` with any implementation-specific status wording or device-test notes discovered during development
- [ ] T022 Run `npm run lint` from the repository root and fix any feature-related findings in `src/App.tsx` or `src/App.css`
- [ ] T023 Run `npm run build` from the repository root and resolve any TypeScript or production-build failures caused by the feature
- [ ] T024 Run the complete mobile/device validation scenarios from `specs/001-mobile-live-location-pin/quickstart.md`, including permission denial, low accuracy, stale state, disable cleanup, route interaction, and print regression

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; T001 and T002 can run in parallel.
- **Foundational (Phase 2)**: Depends on T001; T003 and T004 can proceed in parallel after inspection, and T005 can proceed independently.
- **User Story 1 (Phase 3)**: Depends on T003, T004, and T005.
- **User Story 2 (Phase 4)**: Depends on User Story 1's marker and watch lifecycle tasks T006–T011.
- **User Story 3 (Phase 5)**: Depends on the location lifecycle from T006–T016; its persistence audit can run after the first integration exists.
- **Polish (Phase 6)**: Depends on all desired user-story tasks.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational; no dependency on another user story. This is the MVP.
- **User Story 2 (P2)**: Builds on the live marker/watch integration from User Story 1 so status behavior describes the real lifecycle.
- **User Story 3 (P3)**: Builds on the same lifecycle and verifies privacy across existing persistence paths.

### Parallel Opportunities

- T001 and T002 can run in parallel.
- T003, T004, and T005 can be split across separate files/concerns after the initial inspection.
- Within User Story 1, T006 and T011 can be prepared in parallel conceptually, but marker integration T007–T010 must follow the state/ref setup.
- Within User Story 2, T012, T013, and T015 can be developed in parallel after the watch callback shape exists; T014 and T016 require the lifecycle integration.
- Within User Story 3, T018 and T019 can be audited in parallel once location state exists.
- T021 can run in parallel with code cleanup before the final lint/build/device checks.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases.
2. Implement User Story 1: opt-in control, permission request, accepted reading, distinct moving marker.
3. Stop and validate on a mobile device with two simulated or real positions.
4. Demonstrate the MVP before adding richer error, stale, and privacy audit behavior.

### Incremental Delivery

1. Add User Story 2 for trustworthy permission, accuracy, freshness, and error status.
2. Add User Story 3 for explicit disable cleanup and persistence audits.
3. Run the full quickstart, lint, build, and print regression checks.

## Notes

- Every task follows the required `- [ ] T### [P?] [Story?] description with file path` format.
- No automated test tasks were generated because the specification does not request TDD and the project has no configured test runner.
- The live location must remain opt-in, session-only, non-following, and separate from dropped pings and route waypoints.
