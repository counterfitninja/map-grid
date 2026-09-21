# Route Measurement Data Model

## Measured Route

A derived, session-level view of the current route.

| Field | Type | Required | Description | Validation |
|---|---|---:|---|---|
| `waypoints` | ordered collection of Route Pins | yes | Pins included in route order | Only valid route pins contribute |
| `totalDistanceMeters` | number | derived | Sum of distances between consecutive pins | Present only when at least two valid pins exist; finite and non-negative |
| `measurementStatus` | `not-ready`, `ready`, or `unavailable` | derived | Whether a meaningful measurement can be shown | `not-ready` for fewer than two pins; `unavailable` for invalid/incomplete measurement input |

## Route Pin

An existing user-created pin explicitly belonging to the route.

| Field | Type | Required | Description | Validation |
|---|---|---:|---|---|
| `id` | stable identifier | yes | Identifies the pin for editing and rendering | Unique within the current route |
| `latitude` | number | yes | Geographic latitude | Finite valid latitude |
| `longitude` | number | yes | Geographic longitude | Finite valid longitude |
| `sequence` | integer | yes | Display and measurement order | Unique contiguous route order |
| `gridReference` | text | existing | Human-readable grid reference | Derived from the pin position |
| `directionText` | text | optional | Route-card teaching note | Does not affect distance |

## Measurement Summary

The user-facing representation of the derived route measurement.

| Field | Type | Required | Description |
|---|---|---:|---|
| `label` | text | yes | Identifies the value as the total route length |
| `formattedDistance` | text | conditional | Readable metric value, such as kilometres or metres |
| `unit` | `m` or `km` | conditional | Explicit unit for the formatted value |
| `scaleContext` | text | yes when ready | Explains relation to current map legend/grid spacing |
| `statusMessage` | text | yes | Explains not-ready, ready, or unavailable state |

## Relationships and State Transitions

- `Measured Route` owns the ordered `Route Pin` collection.
- `Measurement Summary` is derived from `Measured Route` and the current map legend/scale context.
- Adding a valid route pin, removing one, or changing sequence order recalculates the derived total.
- Zero or one valid pin transitions to `not-ready`; the prior total must not remain visible.
- Two or more valid pins transition to `ready` when all consecutive segments can be measured.
- Invalid coordinates, incomplete route data, or unavailable scale context transition the summary to `unavailable`; the UI must not guess or reuse a stale total.
- Zoom, viewport, map-provider, overlay, track-mode, and live-location changes do not alter `totalDistanceMeters`; they may update `scaleContext`.
- Clearing the route removes the measurement summary or returns it to `not-ready`.

## Privacy and Persistence

The measurement is derived in the active page session. It does not create a new persisted entity, request live-location permission, transmit coordinates, or store a cached total. Existing saved-route behavior may continue to store route pins according to its existing contract; the measurement itself remains recomputable from those pins.
