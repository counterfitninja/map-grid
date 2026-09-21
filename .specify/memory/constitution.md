<!--
Sync Impact Report
- Version change: 0.0.0-template → 1.0.0
- Modified principles: placeholder principles → Map Accuracy, Print-First Teaching,
  Safe Live Location, Accessible Simplicity, and Testable Delivery
- Added sections: Product Constraints; Development Workflow
- Removed sections: none; replaced all scaffold placeholders
- Follow-up TODOs: confirm the original ratification date
-->

# Scouts Map Grid Constitution

## Core Principles

### I. Map Accuracy
The application MUST present OpenStreetMap context, British National Grid information, and
public rights-of-way overlays with clear provenance and correct coordinate transformations.
Data conversion or display changes MUST be validated against known map positions and MUST NOT
silently imply that unofficial or incomplete data is definitive. This protects route teaching
from misleading map information.

### II. Print-First Teaching
The primary map experience MUST remain suitable for printing and teaching route mapping.
Grid references, scale-related controls, route overlays, and essential map labels MUST remain
legible in the supported print layout. Interactive enhancements MUST degrade without preventing
the user from producing a useful static map.

### III. Safe Live Location
Live placement of the user's position MUST be opt-in, clearly indicated, and handled as
sensitive data. The feature MUST request location permission through the browser, explain its
purpose, handle denial and unavailable-position errors without breaking the map, and MUST NOT
send or persist location data unless a future specification explicitly authorizes it. Location
display MUST provide enough visual context to distinguish the user's position from a map pin.

### IV. Accessible Simplicity
Controls MUST use plain language appropriate for Scouts learning route mapping, work with keyboard
and touch input, and expose meaningful labels and status messages. New toggles or permissions
MUST include concise helper text when their effect is not obvious. The interface MUST prioritize
map comprehension over decorative complexity.

### V. Testable Delivery
Every behavior change MUST include focused regression coverage where practical and MUST preserve
the production build. Changes involving map projections, GeoJSON conversion, print layout, or
browser geolocation MUST include at least one validation path for the affected contract. A
feature is not complete until linting or equivalent static checks and `npm run build` pass, or a
documented limitation is accepted.

## Product Constraints

The project uses Vite, React, TypeScript, Leaflet, `proj4`, and OpenStreetMap-based map context.
Public rights-of-way data MUST retain its source and licensing attribution where required.
The application MUST avoid collecting accounts, tracking users, or transmitting live coordinates
as part of the core mapping experience. Network-dependent tiles or data overlays MUST have a
graceful failure state, while the print workflow MUST remain understandable to the user.

## Development Workflow

Feature work MUST begin with a specification that identifies user-visible behavior, data
provenance, privacy implications, and print or mobile impact. Plans MUST identify affected
components and validation steps before implementation. Reviews MUST check constitution
compliance, coordinate-system correctness, permission/error handling, responsive behavior, and
regressions to printing. Generated or converted GIS assets MUST be reproducible from documented
source files or commands.

## Governance
<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

This constitution governs feature specifications, implementation plans, code review, and release
readiness. Amendments MUST document the affected principles, rationale, compatibility impact, and
required follow-up work. The version MUST use semantic versioning: MAJOR for incompatible
governance changes or principle removals/redefinitions, MINOR for new or materially expanded
principles or sections, and PATCH for clarifications and non-semantic wording changes.

Every feature review MUST verify the relevant principles and quality gates. Exceptions MUST be
explicitly recorded in the feature plan with an owner and resolution date. The constitution MUST
be reviewed whenever mapping data sources, location handling, supported devices, or print output
changes materially.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date is unknown | **Last Amended**: 2026-09-21
