# Route Measurement Research

## Decision: Reuse the existing geodesic distance helper

- **Decision**: Use the existing `calculateDistanceMeters` behavior as the single source for the real-world length between consecutive ordered route pins.
- **Rationale**: `src/App.tsx` already calculates `totalRouteDistanceMeters` with a Haversine-style geographic distance and uses it in the route panel and printable route card. Reusing that behavior prevents divergent totals and keeps the feature independent of viewport pixels or tile provider.
- **Alternatives considered**: Measuring screen pixels against the legend scale was rejected because the total would change with zoom and viewport. Snapping every segment to PRoW geometry was rejected for v1 because the specification defines pin-to-pin measurement and existing PRoW routing is optional/route-mode-specific.

## Decision: Add a shared presentation model for measurement status and units

- **Decision**: Centralize display formatting for route distance and the minimum-pin/unavailable states, then use it in the route controls and route-card output.
- **Rationale**: The current UI formats kilometres directly in two places and does not expose a shared scale explanation. One presentation model avoids inconsistent rounding, labels, and stale totals across normal, track, and print contexts.
- **Alternatives considered**: Keeping independent inline formatting was rejected because future changes could update one surface but not the other. A new persisted measurement setting was rejected because the value is derived from route pins.

## Decision: Treat the existing map key and grid spacing as scale context

- **Decision**: Describe measurement as real-world distance and expose a concise relationship to the map's existing grid spacing/map key rather than deriving distance from rendered map pixels.
- **Rationale**: `src/App.tsx` already maintains `activeSpacing` and renders a collapsible map key for active overlays; `src/App.css` contains the relevant layout and print styling. The route length remains invariant under zoom while the scale context can change with view state.
- **Alternatives considered**: Adding a separate scale-bar implementation was rejected for this feature because it would broaden cartographic scope and duplicate existing map/grid context. Treating the current grid spacing as the route distance was rejected because grid spacing is a reference interval, not the route's total.

## Decision: Preserve session-only derived state and existing privacy boundaries

- **Decision**: Calculate measurement from `routeWaypoints` during render/memoization; do not add storage, network calls, or location permissions.
- **Rationale**: Route pins already drive the route line, route card, saved-route serialization, and track-mode behavior. The measurement contains no new sensitive data and must not couple to the live-location marker.
- **Alternatives considered**: Persisting a cached total was rejected because it could become stale after route edits and would duplicate derived data. Sending the route to a server was rejected because the feature is client-side and the constitution requires privacy-preserving map behavior.

## Decision: Validate with focused helper/UI checks plus production build

- **Decision**: Add focused regression coverage for distance formatting/status transitions where the repository's test setup permits; otherwise use the documented quickstart scenarios and run lint/build.
- **Rationale**: The repository currently exposes build and lint scripts but no test script. The constitution requires focused validation and production build preservation, so validation must cover known coordinates, pin-count boundaries, zoom invariance, mobile/print layout, and privacy behavior.
- **Alternatives considered**: Relying only on manual inspection was rejected because the distance calculation and formatting have deterministic edge cases. Introducing a full test framework solely for this feature is deferred unless planning reveals a reusable test harness is needed.
