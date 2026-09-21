# Quickstart: Validate Mobile Live Location Pin

## Prerequisites

- Node.js and npm installed.
- Dependencies installed with `npm install`.
- A secure context for browser geolocation: use `localhost` during local development or an
  HTTPS deployment on a mobile device.
- A mobile browser with location services enabled, or browser device emulation for initial checks.

## Run the application

1. Start the development server with `npm run dev`.
2. Open the displayed URL on a supported mobile browser.
3. Confirm the map, British National Grid overlay, rights-of-way layers, route controls, and print
   controls remain available.

## Acceptance scenarios

1. **Default privacy state**
   - Reload the page.
   - Confirm the live-location control is off.
   - Confirm no location permission prompt appears and no live marker is shown.

2. **Enable and receive a position**
   - Turn on `Show my live location`.
   - Grant browser location permission.
   - Confirm a distinct live marker appears within 10 seconds when a valid position is available.
   - Confirm the status identifies the marker as current and shows an update time.

3. **Periodic movement**
   - Move the test device or use location emulation to provide at least two valid positions.
   - Confirm the same live marker moves to the newer position without automatic map panning.
   - Confirm route points, overlays, and the centre grid reference continue to work.

4. **Permission and capability failures**
   - Reload and deny permission, or emulate an unavailable/timeout response.
   - Confirm a clear status is shown, the map remains usable, and no repeated prompt loop occurs.

5. **Accuracy and stale state**
   - Provide an invalid or low-accuracy reading through test emulation where possible.
   - Confirm the pin does not move to the rejected reading and the status explains that an accurate
     position is pending.
   - Stop updates long enough to cross the configured freshness window and confirm the status says
     the position is stale.

6. **Disable and privacy**
   - Turn the feature off after a successful update.
   - Confirm the watch stops, the marker disappears, and the status confirms it is off.
   - Reload and confirm the live marker and prior position are not restored.

7. **Print regression**
   - With and without the live marker active, use the existing print workflow.
   - Confirm the map remains legible and the feature does not break route-card or map printing.

## Automated validation

Run the project checks from the repository root:

- `npm run lint`
- `npm run build`

If a focused test harness is added during implementation, run its location-state and cleanup tests
as part of the same validation pass. See [data-model.md](data-model.md) and
[contracts/ui-live-location.md](contracts/ui-live-location.md) for the state and UI contract.
