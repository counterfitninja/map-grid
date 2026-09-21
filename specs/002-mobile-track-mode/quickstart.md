# Quickstart: Validate Mobile Track Mode

## Prerequisites

- Node.js and npm installed.
- Repository dependencies installed with `npm install`.
- A modern browser with responsive device emulation; a real mobile device is preferred for
  geolocation permission and orientation checks.

## Static validation

From the repository root, run:

```text
npm run lint
npm run build
```

Expected result: both commands complete successfully with no new errors.

## Browser validation

1. Start the development server with `npm run dev` and open the displayed local URL.
2. Set the viewport to a narrow mobile size. Confirm the map is at the top of the normal view,
   routes are hidden by default, and the `Enter track mode` control is visible near the top.
3. Select `Enter track mode`. Confirm the map expands to fill the available mobile view, the exit
   control and route visibility toggle remain usable, and the browser asks for location permission.
4. Grant location permission. Confirm the distinct current-location indicator appears when a valid
   reading is available and the status identifies it as active.
5. Switch route visibility on and off. Confirm route overlays appear/disappear while the base map
   and location indicator remain.
6. Select `Exit track mode`. Confirm the map returns to the normal layout, routes are hidden, the
   live marker is removed, and location updates stop.
7. Repeat track mode with location permission denied or unavailable. Confirm the map remains usable
   and the status explains the failure without repeated disruptive prompts.
8. Rotate the device or change the emulated viewport while in track mode. Confirm the map fills the
   new available area and controls remain visible.
9. Use keyboard focus and activation for enter, exit, and route visibility controls. Confirm labels
   and on/off state are understandable.
10. Use the existing print action outside track mode. Confirm the printed map remains legible and
    track-only controls are absent.

## Contract references

- UI states and accessibility expectations: [contracts/ui-track-mode.md](contracts/ui-track-mode.md)
- Temporary state and transition rules: [data-model.md](data-model.md)