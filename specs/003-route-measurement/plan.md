# Implementation Plan: Route Measurement

**Branch**: `[003-route-measurement]` | **Date**: 2026-09-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-route-measurement/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a user-facing route-length summary derived from the existing ordered route pins. Reuse the existing geographic distance calculation, centralize readable metric formatting and measurement status, expose concise map legend/grid-spacing context, and keep the result consistent across route controls, track mode, and print route-card output without adding persistence or location/network behavior.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 6.x with React 19, compiled by the existing TypeScript/Vite toolchain

**Primary Dependencies**: React, Leaflet, existing `proj4` grid helpers; no new runtime dependency expected

**Storage**: N/A for measurement; derive from session route pins. Existing saved-route storage remains unchanged.

**Testing**: Existing ESLint and production build; focused deterministic helper/UI validation in the repository's available test style, plus the scenarios in `quickstart.md`

**Target Platform**: Modern desktop and mobile browsers; print output remains supported

**Project Type**: Client-side web application

**Performance Goals**: Recalculate immediately for normal route sizes without visible interaction delay; no additional network request per route edit

**Constraints**: Real-world total must be invariant under zoom/viewport/provider changes; preserve print-first layout, accessible controls, coordinate correctness, and live-location privacy

**Scale/Scope**: One existing React map screen, route panel, map route-card overlay, and associated styles; no server or schema changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The design passes the constitution gates:

- **Map Accuracy**: Measure geographic positions using the existing coordinate-aware distance helper; do not use screen pixels or confuse grid spacing with route length. Validate with known coordinates and zoom invariance.
- **Print-First Teaching**: Keep the route total and unit legible in the route panel/print card without obscuring grid references, route labels, or the map key.
- **Safe Live Location**: Measurement is derived only from route pins and does not request, persist, or transmit live coordinates.
- **Accessible Simplicity**: Use plain labels, explicit units, concise helper/status text, and accessible semantics for the summary.
- **Testable Delivery**: Add focused regression validation where practical and run lint/build plus the documented mobile, print, boundary, and privacy scenarios.

**Gate status**: PASS. No exceptions or complexity violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
├── App.tsx       # route state, derived measurement, map/track/print UI
├── App.css       # route summary, helper text, mobile and print layout
├── grid.ts       # existing coordinate conversion/grid context
└── ...

specs/003-route-measurement/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/ui-route-measurement.md
```

**Structure Decision**: Keep the feature within the existing single-screen client application. `src/App.tsx` already owns route waypoint state, the distance helper, route controls, track mode, and print route-card rendering; `src/App.css` owns the corresponding responsive/print presentation. Add no backend, database, or new top-level application module.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The feature fits the existing client-side map screen and does not introduce a new project boundary. |
