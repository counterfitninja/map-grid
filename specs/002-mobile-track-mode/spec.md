# Feature Specification: Mobile Track Mode

**Feature Branch**: `[002-mobile-track-mode]`

**Created**: 2026-09-21

**Status**: Draft

**Input**: User description: "Change the site to work better with mobiles. This needs to just show a button at the top which switches to a track mode which shows the map full and the current location and a toggle to show route on or off. When not in track mode show the map at the top and hide the routes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start Mobile Track Mode (Priority: P1)

As a person using the map on a mobile device, I want a prominent control at the top of the page to enter track mode so that I can focus on my current position while moving along a route.

**Why this priority**: Entering a focused mobile map view is the central purpose of the feature.

**Independent Test**: Open the site on a narrow screen, select the track-mode control, and verify that the map becomes the primary full-screen view and the current location is shown when available.

**Acceptance Scenarios**:

1. **Given** the site is in its normal view on a mobile-sized screen, **When** the user selects the track-mode control at the top, **Then** the site enters track mode and expands the map to use the available screen space.
2. **Given** track mode is active and location access is available, **When** the map is displayed, **Then** the user's current position is shown with a distinct location indicator.
3. **Given** location access is denied or unavailable, **When** the user enters track mode, **Then** the map remains usable, track mode remains available, and the site explains that the current location cannot be shown.

---

### User Story 2 - Choose Whether to Show Routes (Priority: P1)

As a person navigating in track mode, I want to turn route lines on or off so that I can choose between a clearer map and a route-guided view.

**Why this priority**: Route visibility is the key task-specific choice within the focused map.

**Independent Test**: Enter track mode, use the route visibility toggle in both directions, and verify that route lines appear and disappear without leaving track mode or losing the location indicator.

**Acceptance Scenarios**:

1. **Given** track mode is active and routes are hidden, **When** the user turns the route toggle on, **Then** the available route overlays become visible on the map.
2. **Given** track mode is active and routes are visible, **When** the user turns the route toggle off, **Then** route overlays are hidden while the base map and current-location indicator remain.
3. **Given** the user changes route visibility, **When** the map refreshes or the user changes view, **Then** the selected visibility remains consistent for the current track-mode session.

---

### User Story 3 - Return to the Normal Map View (Priority: P2)

As a person who has finished tracking, I want to leave track mode so that I can return to the normal site view and use the rest of the map interface.

**Why this priority**: Users need a clear way to recover the normal experience without reloading.

**Independent Test**: Enter track mode, select the exit control, and verify that the normal layout returns with its map placement and route visibility behavior.

**Acceptance Scenarios**:

1. **Given** track mode is active, **When** the user selects the exit control, **Then** the site returns to the normal view and the map is positioned at the top of the page.
2. **Given** the site is in its normal view, **When** the user views the page, **Then** route overlays are hidden by default and the track-mode control remains available.
3. **Given** the user leaves track mode, **When** the current-location display is no longer needed, **Then** location updates stop and the location indicator is removed unless the user explicitly re-enters track mode.

### Edge Cases

- Location is denied or unavailable; the map and route visibility controls remain usable and provide a clear status.
- The device changes orientation or viewport size while track mode is active; the map continues to fill the available space without hiding controls.
- Route data has not loaded or fails to load; the route toggle remains understandable and the base map and location indicator are not blocked.
- Repeated taps or keyboard navigation do not create an inconsistent mode or duplicate location requests.
- Wider-screen and print views remain usable and are not obscured by the mobile-focused layout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST provide a clearly labelled track-mode control at the top of the normal page view.
- **FR-002**: Selecting the track-mode control MUST switch the site into a focused track mode without requiring a page reload.
- **FR-003**: Track mode MUST display the map as the primary full-screen or available-screen-area content on mobile-sized displays.
- **FR-004**: Track mode MUST provide a clearly labelled control for showing or hiding route overlays.
- **FR-005**: Turning route visibility on MUST display available route overlays; turning it off MUST hide them without hiding the base map or location indicator.
- **FR-006**: The normal view MUST place the map at the top of the page and MUST hide route overlays by default.
- **FR-007**: Track mode MUST request current location only after the user enters track mode, and MUST show a distinct current-location indicator when a valid position is available.
- **FR-008**: The site MUST communicate when current location is unavailable, denied, or still being obtained, without preventing map use.
- **FR-009**: The site MUST provide a clearly labelled way to leave track mode and return to the normal view.
- **FR-010**: Leaving track mode MUST stop location updates and remove the current-location indicator unless the user starts track mode again.
- **FR-011**: Track-mode controls MUST remain usable with touch and keyboard input, have meaningful accessible names, and expose their current on/off state.
- **FR-012**: The feature MUST NOT transmit or persist raw location coordinates as part of this change.
- **FR-013**: Existing map navigation, route selection, attribution, and print-oriented use MUST remain available and understandable outside track mode.

## Key Entities *(include if feature involves data)*

- **View Mode**: The temporary normal or track mode selected for the current page session.
- **Route Visibility Preference**: The temporary on/off state controlling whether route overlays are shown while track mode is active.
- **Current Location Indicator**: A temporary visual representation of the most recent valid device position, shown only while track mode is active and location is available.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a mobile-sized screen, at least 95% of users can enter track mode from the top control within 5 seconds without reloading the page.
- **SC-002**: After entering track mode with location permission granted, at least 95% of tested sessions show the first location indicator within 10 seconds when a valid position is available.
- **SC-003**: At least 90% of test users can identify and change route visibility within 5 seconds while remaining in track mode.
- **SC-004**: At least 90% of test users can return to the normal view within 5 seconds, and the normal view shows the map at the top with routes hidden by default.
- **SC-005**: 100% of tested location-denied, unavailable, and route-load-failure cases leave the map navigable and relevant controls usable.
- **SC-006**: 100% of tested sessions confirm that raw location coordinates are neither persisted nor sent by the site as part of this feature.

## Assumptions

- The primary target is a mobile-sized viewport; desktop and print layouts remain compatible but are not redesigned by this feature.
- Track mode is session-only and is not restored automatically after a page reload.
- Route overlays are existing map content; this feature changes their visibility, not their data or source.
- The browser remains responsible for location permission, and location use is optional.
- The map remains central in both modes; non-map content may be visually reduced or hidden only while track mode is active.