# Research: Mobile Live Location Pin

## Decision: Use opt-in browser geolocation with a watch while enabled

- **Decision**: Start `navigator.geolocation.watchPosition` only after the user enables the
  live-location control; clear the watch immediately when disabled or the component unmounts.
- **Rationale**: The browser owns permission prompts and provides refreshes as the device position
  changes. A watch avoids application polling and allows the browser to balance device sensors.
  It also satisfies the privacy requirement because no location work starts by default.
- **Alternatives considered**: Repeated `getCurrentPosition` calls would require application
  timers and duplicate browser requests. A map library location plugin would add a dependency and
  obscure permission/error handling without adding required value.

## Decision: Apply explicit freshness and accuracy acceptance rules

- **Decision**: Accept readings only when coordinates are finite and within valid latitude and
  longitude ranges. Reject readings whose reported accuracy exceeds a documented field-use maximum;
  mark a previously accepted reading stale after a documented freshness window.
- **Rationale**: A live pin must not imply precision the device does not have. Timestamp and
  accuracy are available on each browser position reading and can support honest status messages.
- **Alternatives considered**: Always displaying every browser reading is simpler but can jump to
  visibly unreliable positions. Silently discarding all low-accuracy readings would leave users
  without feedback, so rejected readings need a status message.

## Decision: Keep location state in React and marker state in Leaflet refs

- **Decision**: Store enabled/status/current reading metadata in React state, while retaining the
  Leaflet live marker in a dedicated ref. Reuse the existing grid conversion to calculate the
  British National Grid reference for the accepted position.
- **Rationale**: React state drives accessible controls and status text; Leaflet refs avoid
  rebuilding the map or marker on every reading. The existing application already separates map
  objects into refs and uses `proj4` through `latLngToBritishGrid`.
- **Alternatives considered**: Recreating the whole map on each update would be expensive and could
  disrupt route drawing. Persisting readings is explicitly prohibited by the feature and
  constitution.

## Decision: Do not pan the map automatically

- **Decision**: Move the live marker without changing the current map view. Provide a separate
  user action to centre on the current position only if needed during implementation.
- **Rationale**: Automatic panning can interrupt route teaching, map reading, and printing. The
  requirement is to show a live pin, not to follow the user or change their selected map area.
- **Alternatives considered**: Following the pin continuously is useful for navigation but conflicts
  with the printable teaching workflow and can disorient users.

## Decision: Validate in-browser with focused manual scenarios plus production build

- **Decision**: Add focused validation for the location state/marker contract where the existing
  project test setup permits; always run lint and `npm run build`, plus manual mobile permission,
  denial, stale, disable, and print scenarios.
- **Rationale**: No test runner is currently evident in the project dependencies. Browser permission
  and real device movement require manual or device emulation checks, while pure state decisions
  can be covered without a real GPS device if a test harness is introduced.
- **Alternatives considered**: Relying only on a production build would miss interaction and
  cleanup regressions. Introducing a broad test framework solely for this small feature may add
  disproportionate setup unless the implementation is extracted into a small testable hook/module.

## Decision: Use documented defaults, not a user-adjustable interval

- **Decision**: Treat the browser watch as the update mechanism, with a UI/status freshness policy
  documented in the implementation plan and quickstart. Do not expose interval tuning in v1.
- **Rationale**: The product spec requires periodic updates but does not require a setting. Device
  and browser scheduling are more power-aware than a fixed timer, especially on mobile.
- **Alternatives considered**: A fixed polling interval gives predictable timing but can increase
  battery use and duplicate requests. An advanced interval control adds complexity to a Scouts
  teaching tool.
