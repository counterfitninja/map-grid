# Feature Specification: Route Measurement

**Feature Branch**: `[003-route-measurement]`

**Created**: 2026-09-21

**Status**: Draft

**Input**: User description: "add the ability to measure the route based on the pins and the map legend"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read the Measured Route Length (Priority: P1)

As a person planning or teaching a route, I want the map to calculate the route distance from its pins so that I can understand the route length using the map's displayed scale and legend.

**Why this priority**: The measured route length is the core value of the feature and directly supports route planning and map-reading exercises.

**Independent Test**: Place at least two route pins on the map, confirm that a measured distance appears, and compare the result with a known test route calculated from the same pin coordinates.

**Acceptance Scenarios**:

1. **Given** fewer than two route pins exist, **When** the user views the route controls, **Then** the interface indicates that a route measurement requires at least two pins and does not show a misleading distance.
2. **Given** two or more route pins exist, **When** the route is displayed, **Then** the interface shows the total measured distance following the pins in their route order.
3. **Given** the user adds, removes, or reorders a route pin, **When** the route changes, **Then** the displayed measurement updates to reflect the current pin sequence.

---

### User Story 2 - Understand Measurement Units and Scale (Priority: P1)

As a person reading the map, I want the measurement to use clear units and relate to the map legend so that I can interpret the distance without doing a separate conversion.

**Why this priority**: A number without a clear unit or connection to the map legend can be misunderstood, especially during practical map-reading activities.

**Independent Test**: Use routes with known distances across supported map views and verify that the displayed value uses the selected map scale or legend convention and remains understandable when the map zoom changes.

**Acceptance Scenarios**:

1. **Given** a route has a measurable length, **When** the user reads the route summary, **Then** the value includes an explicit unit and identifies the measurement basis used by the map legend.
2. **Given** the map zoom or displayed scale changes, **When** the route remains unchanged, **Then** the route's real-world distance does not change, while any scale or legend explanation updates to match the current map view.
3. **Given** the route is short or long enough that one unit would be hard to read, **When** the distance is shown, **Then** the interface chooses a suitable readable unit and precision without hiding the underlying measurement.

---

### User Story 3 - Use Measurement in Mobile, Print, and Route Workflows (Priority: P2)

As a person using the map on a phone or printed worksheet, I want the route measurement to remain visible and understandable alongside the map and legend so that I can use it during route planning or field activities.

**Why this priority**: Measurement is useful only if it does not disrupt the existing mobile track workflow or print-first teaching experience.

**Independent Test**: Measure a route in the normal view and track mode, then print the map, and verify that the measurement and its unit remain legible without obscuring the route, pins, or legend.

**Acceptance Scenarios**:

1. **Given** route pins and a route measurement exist, **When** the user enters or leaves track mode, **Then** the measurement state remains consistent with the currently displayed route and does not interfere with location status or route visibility controls.
2. **Given** the user prints a measured map, **When** the print preview is opened, **Then** the measurement and unit remain legible where the route summary is included, and the map remains usable if interactive controls are omitted.
3. **Given** route data or map scale information is unavailable, **When** the user views the route, **Then** the interface explains the limitation and does not present an invented or stale measurement basis.

### Edge Cases

- A route contains duplicate or nearly identical consecutive pins; the measurement remains stable and does not report a negative or invalid distance.
- A route crosses the map's visible boundary, changes direction sharply, or uses a rights-of-way path; the total follows the defined pin sequence and does not depend on the current viewport.
- A user-created pin and a route pin are different pin types; only pins explicitly belonging to the measured route contribute to the route total.
- The route has not yet loaded, a route segment cannot be measured, or map data is incomplete; the interface reports the measurement as unavailable rather than guessing.
- The user changes map provider, zoom, or legend display; the real-world route distance remains stable, while the displayed scale context reflects the current map.
- The route is cleared or contains only one pin; the previous total is removed or marked unavailable so it cannot be mistaken for the current route.
- The measured value is viewed on a narrow mobile screen or in print; labels and units remain readable and controls do not cover the route summary.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The map MUST calculate a route measurement from the ordered route pins currently belonging to the route.
- **FR-002**: The map MUST require at least two valid route pins before presenting a total distance.
- **FR-003**: The map MUST update the measured total whenever route pins are added, removed, reordered, or otherwise changed.
- **FR-004**: The map MUST identify the measured value with a clear unit and a concise label indicating that it is the route total.
- **FR-005**: The map MUST present the measurement using the map's current legend or scale context, including enough information for a user to understand how the displayed real-world distance relates to the map.
- **FR-006**: Changing zoom or viewport MUST NOT change the real-world route distance; it MAY change the displayed scale or legend context.
- **FR-007**: The map MUST use readable precision and an appropriate distance unit for the route length while preserving an unambiguous value.
- **FR-008**: The map MUST distinguish route pins from other map pins when determining which pins contribute to the measurement.
- **FR-009**: If the route has too few pins, invalid data, or unavailable scale context, the interface MUST show an understandable unavailable or not-ready state instead of a misleading measurement.
- **FR-010**: The measurement MUST remain compatible with route visibility controls, mobile track mode, live location display, map-provider changes, and existing route editing behavior.
- **FR-011**: The measured route summary, units, status, and related controls MUST be usable with touch and keyboard input and have meaningful accessible labels.
- **FR-012**: The measurement MUST remain legible in supported print output and MUST NOT obscure the map legend, route, or essential map labels.
- **FR-013**: The feature MUST not transmit or persist live location coordinates merely because a route measurement is displayed.

### Key Entities *(include if feature involves data)*

- **Measured Route**: The current ordered collection of route pins and its derived total real-world length.
- **Route Pin**: A user-selected point belonging to the measured route, including its map position and sequence order.
- **Measurement Summary**: The user-facing total, unit, readiness/status, and map legend or scale context.
- **Map Legend/Scale Context**: The current explanatory scale information used to help users interpret distances on the map.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For routes containing two or more valid pins, 100% of tested add, remove, reorder, and clear actions show the correct current total within the agreed display precision.
- **SC-002**: At least 95% of test users can identify the total route distance and its unit within 5 seconds of creating a two-pin route.
- **SC-003**: Across 100 tested zoom and viewport changes, the real-world route total remains unchanged for an unchanged set and order of route pins.
- **SC-004**: At least 90% of test users can explain how the displayed route distance relates to the map legend or scale after viewing the measurement summary.
- **SC-005**: In 100% of tested fewer-than-two-pin, invalid-data, unavailable-scale, and route-clear cases, the interface avoids displaying a stale or invented total.
- **SC-006**: In 100% of tested mobile and print views, the measurement label and unit remain legible and do not obscure the route or map legend.
- **SC-007**: In 100% of privacy regression tests, showing a route measurement does not create a new outbound request or persisted raw live-location coordinate.

## Assumptions

- "Pins" refers to the existing ordered route pins, not the separate ping pin, live-location indicator, or route-overlay geometry.
- The first version measures the route by summing the real-world distance between consecutive route pins; it does not automatically snap between pins to a rights-of-way path unless that behavior already exists for the selected route mode.
- The existing map legend or scale display is the source of the user-facing scale context; this feature does not introduce a separate cartographic scale system.
- A suitable default unit and precision will be selected during planning, with metric distance as the default and a readable larger unit for longer routes.
- Measurement is derived from the current route and does not require accounts, server storage, analytics, or live-location permission.
- Existing route editing, saved-route, map-provider, mobile track-mode, live-location, and print behaviors remain in scope only for compatibility validation.
