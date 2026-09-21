# Route Measurement Validation Guide

## Prerequisites

- Windows with Node.js installed.
- Repository dependencies installed with `npm install`.
- A modern browser with the map application available locally.

## Static Validation

From the repository root:

1. Run `npm run lint`.
2. Run `npm run build`.
3. Confirm both commands complete without errors.

## End-to-End Scenarios

### 1. Minimum Pin Boundary

1. Open the map in the normal view.
2. Select route-pin mode.
3. Place zero route pins, then one route pin.
4. Confirm the route panel explains that at least two pins are required and shows no stale total.
5. Add a second pin.
6. Confirm the total appears with a clear label and unit.

### 2. Route Updates and Known Distance

1. Place three route pins at known test coordinates.
2. Record their order and calculate the expected consecutive-segment total independently.
3. Confirm the displayed total matches within the documented display precision.
4. Remove a middle pin and confirm the total recalculates from the remaining sequence.
5. Add or reorder a pin and confirm the total changes to match the new order.
6. Clear the route and confirm the previous total disappears.

### 3. Legend/Scale and Zoom Invariance

1. With a measured route visible, record the total and the displayed map legend/grid spacing context.
2. Change zoom and pan the map.
3. Confirm the real-world total remains unchanged.
4. Confirm the scale/legend explanation reflects the current map context and does not claim that grid spacing is the route total.
5. If the map provider changes, confirm the route total remains derived from the same ordered pins.

### 4. Track Mode and Mobile Layout

1. Use a narrow mobile-sized viewport with at least two route pins.
2. Enter track mode and toggle route visibility on and off.
3. Confirm the measurement remains consistent and does not interfere with location status or controls.
4. Exit track mode and confirm the normal route summary still reflects the current pins.

### 5. Print Output

1. Create a measured route with at least two pins and route-card content.
2. Open print preview.
3. Confirm the total and unit are legible, the route card remains understandable, and the map key/route labels are not obscured.
4. Confirm interactive-only controls do not prevent the printed measurement from being understood.

### 6. Privacy Regression

1. Use browser request/network inspection while measuring a route.
2. Confirm measurement does not request live location, send route coordinates to a new endpoint, or add a new persisted measurement cache.
3. If live location is enabled separately, confirm the measurement feature does not alter its existing session-only privacy behavior.

## References

- Data and state rules: [data-model.md](data-model.md)
- User-facing behavior: [contracts/ui-route-measurement.md](contracts/ui-route-measurement.md)
- Requirements: [spec.md](spec.md)
