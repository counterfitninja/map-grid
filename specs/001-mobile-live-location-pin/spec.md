# Feature Specification: Mobile Live Location Pin

**Feature Branch**: `[001-mobile-live-location-pin]`

**Created**: 2026-09-21

**Status**: Draft

**Input**: User description: "I want to add a live pin that will update periodically on the map when loaded on a mobile."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - See Current Position on the Map (Priority: P1)

As a Scout using the map on a mobile device, I want to see a live pin showing where I am
so that I can relate my position to the printed or on-screen route map.

**Why this priority**: Position awareness is the core value of the feature and supports
route-mapping exercises in the field.

**Independent Test**: On a supported mobile device, grant location access, move between known
test positions, and verify that the location indicator appears on the map and updates without
requiring a page reload.

**Acceptance Scenarios**:

1. **Given** the map is open on a mobile device and location access has not been granted,
  **When** the user chooses to show their location, **Then** the user sees a clear explanation
  and a browser permission request.
2. **Given** location access is granted and a position is available, **When** the map receives
  a position update, **Then** a distinct live-location pin appears at that position.
3. **Given** the user remains on the map, **When** the configured update interval elapses and
  a newer position is available, **Then** the live-location pin moves to the newer position.

---

### User Story 2 - Understand Location Status (Priority: P2)

As a user, I want clear status information about location access and updates so that I know
whether the pin is current, unavailable, or disabled.

**Why this priority**: Honest status communication prevents users from treating a stale or
unavailable position as their current position.

**Independent Test**: Exercise granted, denied, unavailable, and timeout states and verify that
each state has an understandable message and does not prevent normal map use.

**Acceptance Scenarios**:

1. **Given** location access is denied or unavailable, **When** the location request fails,
  **Then** the map remains usable and explains how the live pin is unavailable.
2. **Given** the last position is older than the configured freshness period, **When** the user
  views the map, **Then** the interface identifies the position as stale rather than implying
  that it is current.

---

### User Story 3 - Protect Location Privacy (Priority: P3)

As a user, I want location sharing to be optional and local to my map session so that using the
feature does not unexpectedly disclose where I am.

**Why this priority**: A live position is sensitive information, especially for young users
and outdoor activities.

**Independent Test**: Use the map without enabling location, then disable the feature after
enabling it, and verify that no live pin remains active and no position is retained for a later
session.

**Acceptance Scenarios**:

1. **Given** location display is disabled, **When** the user uses the map, **Then** no location
  request is made and no live-location pin is shown.
2. **Given** location display is active, **When** the user turns it off, **Then** updates stop,
  the live pin is removed, and the user receives confirmation that it is disabled.

- The device does not support geolocation, has location services disabled, or the browser blocks
  access; the map remains usable and explains that live location is unavailable.
- The user denies permission, later revokes permission, or permission is unavailable in the
  current browsing context; the map does not repeatedly prompt or fail noisily.
- A position update is delayed, inaccurate, outside the visible map, or fails intermittently;
  the last position is not presented as current and the map does not jump unexpectedly.
- The device loses connectivity after the map loads; location status and the existing map remain
  usable without sending coordinates to the application.
- The user prints the map while the live pin is active; the print output remains legible and
  does not expose more location detail than the user can already see on the map.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The map MUST provide an explicit control for enabling and disabling live location.
- **FR-002**: Live location MUST be disabled by default for each new map session.
- **FR-003**: Before requesting access, the map MUST explain that the feature displays the
  device's current position on the map and that access is optional.
- **FR-004**: When an accurate position is available, the map MUST show a visually distinct live
  location pin and a status that identifies it as the user's current position.
- **FR-005**: While enabled, the map MUST request or receive refreshed positions periodically
  using a documented update interval and MUST move the live pin when a newer valid position is
  received.
- **FR-006**: The map MUST reject invalid, unavailable, or unusably inaccurate readings without
  moving the pin to an untrustworthy position.
- **FR-007**: The map MUST communicate whether location is active, unavailable, denied, waiting
  for a first reading, or stale.
- **FR-008**: Turning live location off MUST stop further position updates and remove the live pin
  from the map.
- **FR-009**: The feature MUST NOT transmit or persist raw location coordinates as part of this
  feature, and it MUST NOT retain the live pin between map sessions.
- **FR-010**: Location failures MUST NOT prevent users from viewing, navigating, or printing the
  underlying map and route overlays.
- **FR-011**: The live-location control, helper text, pin, and status messages MUST be usable by
  touch and keyboard users and MUST have meaningful accessible labels.

### Key Entities *(include if feature involves data)*

- **Live Location Session**: The temporary, user-controlled state of location display during one
  map session, including enabled status and location permission status.
- **Location Reading**: A temporary device-provided position with coordinates, timestamp, and
  accuracy information used to decide whether the live pin can be updated.
- **Live Location Pin**: The map representation of the most recent accepted location reading;
  it is distinct from user-created route pins and is removed when location is disabled.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On supported mobile devices, at least 95% of successful permission-grant sessions
  display the first live pin within 10 seconds of the user enabling the feature.
- **SC-002**: During a 10-minute movement test, the live pin reflects each valid position update
  within one configured update interval plus 5 seconds.
- **SC-003**: At least 90% of test users can enable, interpret, and disable live location without
  facilitator assistance.
- **SC-004**: 100% of tested permission-denied, unavailable, timeout, and stale-position cases
  leave the map view and printing workflow usable.
- **SC-005**: No raw location coordinates are present in application-persisted data or outbound
  application requests during feature testing.

## Assumptions

- The feature targets modern mobile browsers with device location capability; desktop support is
  allowed but is not the primary acceptance environment.
- The update interval will use a reasonable field-use default chosen during planning and will not
  be exposed as a user setting in the first version.
- The browser remains responsible for the permission prompt; the application does not create a
  separate account or location-sharing permission system.
- OpenStreetMap context, British National Grid display, route overlays, user-created pins, and
  printing already exist and are outside this feature's scope except for compatibility checks.
- Location data is session-only and remains in the browser; no server endpoint or analytics event
  is required for this feature.
