# Data Model: Mobile Live Location Pin

## Live Location Session

Represents temporary location-display state for the current map page.

| Field | Type | Rules |
|---|---|---|
| enabled | boolean | Defaults to `false`; changes only through the explicit control |
| status | enum | `disabled`, `requesting`, `active`, `denied`, `unavailable`, `error`, or `stale` |
| watchHandle | browser-owned handle | Exists only while enabled and a watch is active; never persisted |
| latestReading | Location Reading or null | Session-only; cleared when disabled |

### State transitions

- `disabled` → `requesting` when the user enables the control.
- `requesting` → `active` after an accepted reading.
- `requesting` → `denied` or `unavailable` after a permission or capability failure.
- `active` → `active` when a newer accepted reading moves the pin.
- `active` → `stale` when the freshness window expires without an accepted update.
- Any enabled state → `disabled` when the user turns the control off; clear the reading and marker.

## Location Reading

A temporary browser-provided position used to update the map.

| Field | Type | Rules |
|---|---|---|
| latitude | number | Finite and between -90 and 90 |
| longitude | number | Finite and between -180 and 180 |
| accuracyMeters | number | Finite, non-negative; must be at or below the accepted accuracy threshold |
| timestamp | number | Finite epoch timestamp; newer readings supersede older readings |
| gridReference | string | Derived from latitude/longitude using the existing British National Grid conversion |

Raw readings MUST remain in memory only. They MUST NOT be written to local storage, query
parameters, analytics payloads, or server requests.

## Live Location Pin

A Leaflet marker representing the latest accepted `Location Reading`.

- Visually distinct from dropped pings and route waypoints.
- Reuses one marker instance and updates its position rather than creating a marker per reading.
- Has an accessible/status label identifying it as the user's live location.
- Removed when the session is disabled or the map is destroyed.
