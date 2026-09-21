# UI Contract: Live Location

## Control

- Label: `Show my live location`
- Type: accessible toggle/checkbox control
- Default: off on every page load
- Helper text: explains that the browser will ask for permission and the pin is shown only
  during the current map session
- Turning on: requests location access and reports `Requesting location…`
- Turning off: stops updates, removes the live pin, clears the current reading, and reports
  `Live location off`

## Status

A visible, accessible status region MUST communicate one of these user-facing states:

- `Live location off`
- `Requesting location…`
- `Live location active · updated [time]`
- `Live location unavailable on this device`
- `Location permission denied`
- `Waiting for an accurate location…`
- `Live location is stale · waiting for an update`

The status MUST NOT display raw coordinates unless the existing map UI explicitly provides them
as a temporary, user-visible teaching value. It MUST never imply that a rejected or stale reading
is current.

## Map Marker

- The live marker is visually distinct from the dropped ping and numbered route markers.
- The marker popup or accessible description identifies it as `Your live location`.
- Updating the marker MUST NOT automatically pan or zoom the map.
- Removing the control MUST remove the live marker.
