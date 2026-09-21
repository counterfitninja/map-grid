# Implementation Plan: Mobile Track Mode

**Branch**: `[002-mobile-track-mode]` | **Date**: 2026-09-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-mobile-track-mode/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a mobile-first track mode to the existing React/Leaflet map. The normal view will place the
map first and keep route overlays hidden by default. A prominent top control will enter track mode,
where the map fills the mobile viewport, the existing session-only geolocation behavior is enabled,
and a simple route visibility toggle is available. Leaving track mode will stop geolocation and
restore the normal layout without persisting mode or coordinates.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 6.0, React 19, browser APIs

**Primary Dependencies**: Vite 8, Leaflet 1.9, existing `BritishGridOverlay`, existing local/remote route layers

**Storage**: None for this feature; track mode, route visibility, and live coordinates are session-only

**Testing**: TypeScript build, ESLint, focused browser/manual regression checks using `quickstart.md`

**Target Platform**: Modern mobile and desktop browsers; responsive viewport with print fallback

**Project Type**: React single-page web application

**Performance Goals**: Track-mode transition and route visibility changes should be immediate; map remains usable during location and route-load failures; first valid location follows the existing 10-second acceptance target.

**Constraints**: Do not transmit or persist raw coordinates. Preserve Leaflet attribution, grid accuracy, accessibility, print output, and existing route-building behavior outside track mode.

**Scale/Scope**: One existing map page; one normal/track view state per browser session; no backend, schema, or new external service.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

All gates pass before design:

- **Map Accuracy**: Keep the existing Leaflet map, coordinate conversion, route geometry, and attribution unchanged; only alter presentation and visibility.
- **Print-First Teaching**: Keep normal/print map layout usable and ensure track-only controls do not appear in printed output.
- **Safe Live Location**: Entering track mode is the explicit opt-in; reuse the existing permission, accuracy, stale, denial, and session-only handling; stop watching on exit.
- **Accessible Simplicity**: Use plain labels, touch-sized controls, helper text, status announcements, and an exposed toggle state.
- **Testable Delivery**: Validate responsive behavior, geolocation transitions, route visibility, lint, and production build.

## Project Structure

### Documentation (this feature)

```text
specs/002-mobile-track-mode/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── App.tsx       # mode state, controls, Leaflet layer visibility, location lifecycle
├── App.css       # responsive normal/track layouts and print exclusions
└── ...           # existing grid and location helpers

specs/002-mobile-track-mode/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/ui-track-mode.md
```

**Structure Decision**: Keep the feature in the existing single-page `src/App.tsx` and `src/App.css`
because map state, Leaflet layer references, live geolocation lifecycle, and responsive layout are
already co-located there. Add design artifacts under the active feature directory; do not introduce
a backend, persistence model, or new package.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The feature stays within the existing application and does not add architectural projects. |
