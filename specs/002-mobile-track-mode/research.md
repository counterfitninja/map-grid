# Research: Mobile Track Mode

## Decision: Reuse the existing Leaflet and geolocation lifecycle

- **Decision**: Drive track mode from React state and use the existing live-location watcher and
  marker implementation, but only enable it while track mode is active.
- **Rationale**: The code already validates coordinates and accuracy, handles permission/error/stale
  states, removes the marker, and clears the watch. Reusing it reduces privacy and regression risk.
- **Alternatives considered**: A second location hook or a new location service would duplicate
  sensitive lifecycle logic without adding user value.

## Decision: Keep route visibility session-only and separate from route data

- **Decision**: Use a boolean visibility state for the existing route marker/line layer. Default it
  to hidden in normal mode and expose the control in track mode.
- **Rationale**: The feature changes presentation, not route geometry, saved routes, or route data.
  Session-only state avoids changing saved-route formats and keeps the normal map uncluttered.
- **Alternatives considered**: Persisting the preference would make a later normal session start
  with unexpected overlays and is not required by the specification.

## Decision: CSS responsive mode with a semantic mode class

- **Decision**: Add a `track-mode` class/state to the existing shell and map stage, with controls
  positioned above the map and excluded from print output.
- **Rationale**: The current app already uses CSS media queries and a map stage; a class-based layout
  keeps Leaflet mounted and avoids destroying/recreating map state during transitions.
- **Alternatives considered**: Reinitializing a separate map page would risk losing map position,
  overlays, and event handlers.

## Decision: Refit Leaflet after layout transitions

- **Decision**: Trigger Leaflet's size invalidation after entering/exiting track mode and after
  viewport resize/orientation changes.
- **Rationale**: Leaflet needs an explicit size refresh when its container changes dimensions; this
  prevents blank or partially rendered map tiles in full-screen mobile mode.
- **Alternatives considered**: Relying only on browser resize events is less reliable when a CSS
  class changes the container without a resize event.

## Decision: Validate through build, lint, and browser scenarios

- **Decision**: Use the existing `npm run lint` and `npm run build`, plus the focused scenarios in
  `quickstart.md` with mocked/granted/denied location where available.
- **Rationale**: The repository has no configured component-test runner. The constitution requires
  focused regression validation and production build preservation; these checks cover the affected
  UI, Leaflet lifecycle, and geolocation behavior without adding a test framework for one page.
- **Alternatives considered**: Adding a new browser test dependency is deferred because it would be
  disproportionate to the feature and is not needed to define the implementation contract.