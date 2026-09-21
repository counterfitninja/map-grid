# UI Contract: Route Measurement

## Scope

This contract describes the user-visible route measurement surfaces in the map application. It is not a network API.

## Route Controls Surface

When the route panel is visible:

- With zero or one route pin, show a plain-language not-ready status explaining that two route pins are required.
- With two or more valid route pins, show:
  - a clear `Route length` label;
  - a formatted metric value with an explicit unit;
  - concise scale/legend context explaining that the value is real-world distance and is independent of the current zoom;
  - no stale previous total after route edits.
- The summary must remain usable by keyboard and touch users and must not rely on colour alone.

## Map/Track Surface

- The measurement must remain consistent when entering or leaving track mode.
- Route visibility controls may hide route geometry, but must not silently change the derived total.
- Live-location status and indicator remain separate from route measurement.

## Print/Route Card Surface

- If the route card is printed, include the same total value and unit as the route summary when at least two valid pins exist.
- Keep the total legible and positioned so it does not obscure route points, grid references, direction text, or the map key.
- Interactive map controls may be omitted from print, but the printed measurement must remain understandable.

## Status and Error Contract

| State | Required user-facing behavior |
|---|---|
| Fewer than two pins | Explain that at least two route pins are needed; do not show a total |
| Ready | Show total, unit, and scale/legend context |
| Invalid/incomplete route | Explain that the measurement is unavailable; do not guess or reuse an old total |
| Scale context unavailable | Explain the limitation while preserving a valid real-world total only if its interpretation remains clear; otherwise use unavailable state |
| Route cleared | Remove the previous total or return to the not-ready state |
