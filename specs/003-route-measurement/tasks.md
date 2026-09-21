---

description: "Executable task list for route measurement"
---

# Tasks: Route Measurement

**Input**: Design documents from `/specs/003-route-measurement/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/ui-route-measurement.md`, and `quickstart.md`

**Tests**: No test framework is currently defined in the repository. Focused deterministic validation should be added where practical; every implementation increment must also pass the documented quickstart checks and production build.

## Dependencies

- Phase 1 and Phase 2 must complete before user-story work.
- User Story 1 establishes the shared measurement model used by User Story 2.
- User Story 2 should complete before User Story 3 so the same formatted summary is reused in mobile and print surfaces.
- User Story 3 depends on the existing track-mode and print surfaces but does not require changes to live-location permissions or storage.

## Phase 1: Setup

**Purpose**: Confirm the existing client-side structure and validation baseline.

- [X] T001 Review `src/App.tsx` route waypoint lifecycle, existing `calculateDistanceMeters`, and current route-length render sites against `specs/003-route-measurement/research.md`
- [X] T002 [P] Review `src/App.css` responsive and print selectors affecting route summaries, map key, and route-card overlays against `specs/003-route-measurement/contracts/ui-route-measurement.md`
- [X] T003 [P] Run the existing baseline checks with `npm run lint` and `npm run build`, recording any pre-existing failures before implementation

## Phase 2: Foundational

**Purpose**: Establish shared derived measurement behavior before story-specific presentation work.

- [X] T004 Define the derived measurement status and display model in `src/App.tsx`, covering `not-ready`, `ready`, and `unavailable`, with total distance finite and non-negative and available only when at least two valid route pins exist
- [X] T005 Add shared metric formatting and scale-context helpers in `src/App.tsx` so route controls and print output use the same readable `m`/`km` unit and precision without persisting or transmitting measurement data
- [X] T006 [P] Add focused deterministic validation for the shared distance/formatting/status helpers in the repository's available test location, covering zero/one/two pins, duplicate points, invalid coordinates, and known coordinate totals

## Phase 3: User Story 1 - Read the Measured Route Length (Priority: P1)

**Goal**: Show the correct current total for the ordered route pins and remove stale totals at route boundaries.

**Independent Test**: Place fewer than two route pins and confirm the not-ready message; add at least two pins and compare the displayed total with an independently calculated known route; edit the pin set/order and confirm the total updates.

- [X] T007 [US1] Replace inline route-length calculation/rendering in `src/App.tsx` with the shared derived measurement model based only on ordered `routeWaypoints`
- [X] T008 [US1] Update the route-panel summary in `src/App.tsx` to show a clear `Route length` label, formatted explicit unit, two-pin requirement status, and no stale total after route clear or reduction below two valid pins
- [X] T009 [US1] Verify route add, remove, reorder/load, and clear handlers in `src/App.tsx` trigger the derived measurement from the current ordered route pins without including the ping pin or live-location marker
- [X] T010 [US1] Run the User Story 1 independent test and focused distance validation, then run `npm run lint` and `npm run build`

## Phase 4: User Story 2 - Understand Measurement Units and Scale (Priority: P1)

**Goal**: Make the measured value interpretable through explicit units and the current map legend/grid-spacing context while preserving zoom invariance.

**Independent Test**: Measure a known route, change zoom/pan/provider and any visible legend context, and verify the real-world total stays fixed while the explanatory scale context remains accurate and readable.

- [X] T011 [US2] Integrate the current map legend/grid-spacing state from `src/App.tsx` into the measurement summary so it explains real-world distance without treating `activeSpacing` as the route total
- [X] T012 [US2] Add accessible helper/status text and semantic labelling for the measurement summary in `src/App.tsx`, including the relationship between route length, units, and current map scale context
- [X] T013 [US2] Add or update focused validation for `m`/`km` selection, readable precision, duplicate/near-zero segments, and unchanged totals across zoom/viewport/provider changes in the repository's available test location
- [X] T014 [US2] Run the User Story 2 independent test with known coordinates and 100 zoom/viewport-change repetitions, then run `npm run lint` and `npm run build`

## Phase 5: User Story 3 - Use Measurement in Mobile, Print, and Route Workflows (Priority: P2)

**Goal**: Preserve the same measurement across track mode, route visibility changes, mobile layout, and printed route-card output.

**Independent Test**: On a narrow viewport, measure a route, enter/exit track mode and toggle route visibility, then open print preview and confirm the value/unit remain legible and do not obscure map content.

- [X] T015 [P] [US3] Update the print route-card summary in `src/App.tsx` to consume the shared formatted measurement and match the normal route-panel value and unit
- [X] T016 [P] [US3] Update route summary and route-card styles in `src/App.css` for narrow mobile layouts, print legibility, and non-overlap with map key, route labels, grid references, and essential map content
- [X] T017 [US3] Verify track-mode entry/exit and route-visibility handlers in `src/App.tsx` preserve measurement state and keep it separate from live-location status and permissions
- [X] T018 [US3] Run the User Story 3 mobile, track-mode, print-preview, route-overlay, and privacy regression scenarios from `specs/003-route-measurement/quickstart.md`

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Complete quality gates and document any accepted limitations.

- [X] T019 [P] Review `src/App.tsx` and `src/App.css` for accessibility labels, helper text, keyboard/touch usability, and plain-language measurement states
- [X] T020 [P] Review the implementation against `specs/003-route-measurement/contracts/ui-route-measurement.md` and `specs/003-route-measurement/data-model.md`, correcting any contract or state-transition mismatch
- [X] T021 Run final `npm run lint` and `npm run build`, then record results and any documented limitations in `specs/003-route-measurement/quickstart.md`

## Parallel Execution Examples

### User Story 1

- Run T006 in parallel with T002/T003 after setup if the test location is confirmed.
- T007 and T008 touch the same file and should be sequential; T009 follows them.

### User Story 2

- T011 and T012 are logically separate concerns but both modify `src/App.tsx`; execute sequentially unless the changes are carefully coordinated.
- T013 can run in parallel with documentation review after the shared model exists.

### User Story 3

- T015 (`src/App.tsx`) and T016 (`src/App.css`) can run in parallel.
- T017 follows the shared summary integration; T018 is the story completion validation.

### Polish

- T019 and T020 can run in parallel because they are review/validation tasks, followed by T021.

## Implementation Strategy

1. **MVP**: Complete Phase 1, Phase 2, and User Story 1 to provide correct route totals and safe boundary states.
2. **Interpretability**: Complete User Story 2 to standardize units and explain map legend/scale context without changing the geographic total.
3. **Workflow compatibility**: Complete User Story 3 to make the summary consistent across mobile track mode and print output.
4. **Release gate**: Complete the polish phase and require lint/build plus the quickstart regression scenarios before delivery.
