# Data Model: Mobile Track Mode

This feature introduces no persisted data and no server-facing schema. The following are temporary
UI/session states held by the existing map page.

## View Mode

| Field | Type | Rules |
|---|---|---|
| mode | `normal` or `track` | Defaults to `normal`; changes only through explicit enter/exit controls; not persisted. |

### Transitions

```text
normal --Enter track mode--> track
track  --Exit track mode--> normal
```

Entering track mode starts the location opt-in flow. Leaving it stops the geolocation watch and
removes the current-location indicator.

## Route Visibility Preference

| Field | Type | Rules |
|---|---|---|
| visible | boolean | Defaults to `false` in normal view; controlled by the track-mode toggle; session-only. |

When false, the existing route marker and route line overlays are hidden. When true, existing route
geometry and markers are shown without changing route data or saved routes.

## Current Location Indicator

| Field | Type | Rules |
|---|---|---|
| status | existing live-location status union | Disabled outside track mode; may be requesting, active, denied, unavailable, error, or stale in track mode. |
| latitude/longitude | temporary validated reading | Must remain local to the page; valid range and accuracy checks continue to apply; never persisted or sent. |
| updatedAt | temporary timestamp | Used only for freshness/status display; cleared on exit. |
| marker | Leaflet map marker | Distinct from route points and user ping; removed on exit. |

## Existing Data Preserved

Route waypoints, saved routes, map position, grid overlay settings, and map-layer preferences retain
their existing behavior and formats. Track mode changes visibility and layout only.