# UI Contract: Mobile Track Mode

## Normal view

- The page exposes a labelled `Enter track mode` control near the top of the page.
- The map is the first primary content area on mobile-sized viewports.
- Route overlays are hidden by default.
- Existing route-building, map settings, printing, attribution, and navigation controls remain
  available outside track mode.

## Track view

- The page exposes a labelled `Exit track mode` control.
- The map fills the available mobile viewport area.
- The page exposes a labelled route visibility toggle with an accessible checked/on state.
- The toggle controls existing route overlays without changing their geometry or saved data.
- A live-location status is announced as disabled/requesting/active/denied/unavailable/error/stale as
  applicable; the location indicator is visually distinct from route points.

## Failure and privacy behavior

- Location denial, unavailability, timeout, or stale readings do not block map use.
- Leaving track mode removes the live marker and stops location updates.
- No raw coordinates are written to storage or sent to an application endpoint.

## Responsive and print behavior

- Touch targets remain usable on narrow screens and controls remain keyboard reachable.
- Orientation and viewport changes preserve the map and controls.
- Track-only controls and full-screen styling do not pollute the print map output.