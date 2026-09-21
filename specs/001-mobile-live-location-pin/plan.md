# Implementation Plan: Mobile Live Location Pin

**Branch**: `[001-mobile-live-location-pin]` | **Date**: 2026-09-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-mobile-live-location-pin/spec.md`

## Summary

Add an opt-in live-location control to the existing Leaflet map. While enabled, the browser's
geolocation watch supplies temporary readings; accepted readings update one distinct Leaflet
marker and its accessible status without automatically moving the map. Permission failures,
stale readings, and inaccurate positions remain visible as understandable status states. The
feature uses existing British National Grid conversion for the displayed reference and keeps raw
location data in memory only.

## Technical Context

**Language/Version**: TypeScript 6.0, React 19, browser APIs

**Primary Dependencies**: Leaflet 1.9, existing `proj4` grid conversion, browser Geolocation API

**Storage**: None; live readings are session-only and must not be persisted

**Testing**: ESLint, TypeScript/Vite production build, focused browser/device validation; no test runner currently configured

**Target Platform**: Modern mobile browsers in a secure context; desktop browsers may be smoke-tested

**Project Type**: Client-side web application / printable map tool

**Performance Goals**: First accepted pin within 10 seconds in 95% of successful permission-grant tests; marker updates within one browser update interval plus 5 seconds; no map rebuild per reading

**Constraints**: Opt-in only; no raw coordinate transmission or persistence; reject invalid/low-accuracy readings; preserve route, overlay, and print workflows; clear permission/error status

**Scale/Scope**: One live marker and one session-local location state per open map; changes concentrated in `src/App.tsx` and `src/App.css`, with optional extraction of a small testable location helper

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Map Accuracy**: PASS. Accepted coordinates use the existing Leaflet position and
  `latLngToBritishGrid` conversion; invalid readings are rejected and no new GIS source is added.
- **Print-First Teaching**: PASS. The marker is non-following, and the design explicitly tests
  existing map and route-card printing.
- **Safe Live Location**: PASS. The control defaults off, browser permission is explicit, the
  watch is cleared on disable/unmount, and readings are not persisted or transmitted.
- **Accessible Simplicity**: PASS. The control includes helper text, keyboard/touch support, a
  distinct marker, and an accessible status region.
- **Testable Delivery**: PASS with a documented limitation. Lint/build and focused manual mobile
  scenarios are required; the repository currently has no test runner, so implementation should
  keep location acceptance/cleanup logic small enough for future focused coverage.

## Project Structure

### Documentation (this feature)

```text
specs/001-mobile-live-location-pin/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── App.tsx              # Existing Leaflet map, controls, and feature integration
├── App.css              # Existing responsive, print, and marker styling
├── grid.ts              # Existing British National Grid conversion
└── ...

specs/001-mobile-live-location-pin/
├── plan.md
├── research.md
├── data-model.md
├── contracts/ui-live-location.md
└── quickstart.md
```

**Structure Decision**: Keep this as a focused client-side feature in the existing single-page
application. Integrate the location control and Leaflet marker lifecycle in `src/App.tsx`, add
responsive/print-safe visual rules in `src/App.css`, and reuse `src/grid.ts` for grid references.
Do not add a server endpoint, persistence layer, mobile native project, or new mapping dependency.

## Design Details

### Location lifecycle

1. The live-location control starts off.
2. Enabling it checks geolocation availability, sets `requesting`, and starts one browser watch.
3. Each callback validates finite coordinates, accuracy, timestamp ordering, and freshness policy.
4. Accepted readings update one marker, derived grid reference, last-update metadata, and status.
5. Errors map to user-facing `denied`, `unavailable`, or `error` status without breaking the map.
6. Disabling or unmounting clears the watch, removes the marker, and clears session-only reading data.

### Integration boundaries

- The live marker gets its own ref and CSS class, separate from `pingMarkerRef` and route markers.
- The existing map initialization effect must not be made dependent on every location update.
- The location effect must clean up its watch and avoid updating state after teardown.
- The control must not alter `mapClickMode`, route points, map centre, or print title.
- The status must be rendered in the sidebar with helper text and an accessible live region.

### Policy defaults

- Accepted accuracy threshold: 100 metres for the first implementation; surface a waiting/stale
  state when readings are less accurate rather than moving the pin. This is the initial product
  default and can be revised only through a follow-up specification if field testing shows it is
  too strict.
- Freshness window: 60 seconds after the latest accepted reading; implementation may use the
  browser timestamp and a timer solely for in-memory stale-status refresh.
- Browser watch options: high-accuracy request enabled, finite timeout, and no unbounded maximum
  age so the first reading is not silently reused as current.

## Complexity Tracking

No constitution violations or complexity exceptions are required for this feature.
