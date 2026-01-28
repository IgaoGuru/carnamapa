# PRD: Enhanced Event Markers

## Introduction

Replace the current simple purple pin markers with informative rounded rectangle markers that display event start times and visually distinguish between free and paid events. This enhancement allows users to quickly scan the map and identify when events start and whether they require payment, without needing to click on each marker.

## Goals

- Display event start time directly on each map marker
- Visually distinguish free vs. paid events using accent colors (white for free, red for paid)
- Maintain the current click-to-open-modal behavior
- Keep markers readable and visually consistent with the carnival theme

## User Stories

### US-001: Create custom marker component
**Description:** As a developer, I need a reusable custom marker component that renders a rounded rectangle with time and accent color so that it can replace the default MapTiler pins.

**Acceptance Criteria:**
- [ ] Create a new `EventMarker` component that generates an HTML element for use with MapTiler's custom marker API
- [ ] Marker displays as a rounded rectangle (pill shape)
- [ ] Marker has a main body color (carnival purple `#8A2BE2`) with an accent stripe/border
- [ ] Accepts `time` (string) and `isFree` (boolean) as props
- [ ] Typecheck passes

### US-002: Display start time on marker
**Description:** As a user, I want to see the event start time on the map marker so that I can quickly identify when events begin without clicking each one.

**Acceptance Criteria:**
- [ ] Time is displayed in HH:MM format (e.g., "18:30")
- [ ] Text is white and readable against the purple background
- [ ] Font size is legible at default zoom level
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Color-code markers by price status
**Description:** As a user, I want to see at a glance whether an event is free or paid so that I can prioritize free events if desired.

**Acceptance Criteria:**
- [ ] Free events have a white accent color (border or stripe)
- [ ] Paid events have a red accent color (e.g., `#DC2626` or similar)
- [ ] The accent is clearly visible and distinguishes the two types
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Integrate custom markers into Map component
**Description:** As a developer, I need to replace the default MapTiler markers with the new custom EventMarker component in the Map.tsx file.

**Acceptance Criteria:**
- [ ] Remove usage of default `maptilersdk.Marker({ color: '#8A2BE2' })`
- [ ] Create markers using custom HTML elements from EventMarker component
- [ ] Pass `time` and `isFree` from `feature.properties` to each marker
- [ ] Markers are positioned correctly at event coordinates
- [ ] Click handler still opens BlockDetailModal with correct event data
- [ ] Markers are properly cleaned up when filters change
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Style marker for visual hierarchy
**Description:** As a user, I want the markers to be visually appealing with a modern, sleek, approachable, and fun aesthetic while remaining functional.

**Acceptance Criteria:**
- [ ] Marker has subtle shadow for depth/visibility against map
- [ ] Marker size is fixed (does not scale with zoom) for consistent readability
- [ ] Markers can overlap naturally in dense areas (no clustering required)
- [ ] Design feels modern and polished, not generic
- [ ] Use the `frontend-design` skill to implement the marker styling
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Each event marker must display the event start time in HH:MM format
- FR-2: Each event marker must have an accent color indicating price status: white for free (`is_free: true`), red for paid (`is_free: false`)
- FR-3: Markers must use a rounded rectangle (pill) shape with the carnival purple (`#8A2BE2`) as the primary background color
- FR-4: Markers must be fixed size regardless of map zoom level
- FR-5: Clicking a marker must open the BlockDetailModal with the event's full details (existing behavior)
- FR-6: Markers must be removed and recreated when filters change (existing behavior)
- FR-7: Markers may overlap in areas with many events (no clustering)

## Non-Goals

- No marker clustering or grouping of nearby events
- No scaling of marker size based on zoom level
- No animation or hover effects on markers
- No additional information beyond time and free/paid status on the marker itself
- No changes to the BlockDetailModal component
- No changes to the filtering logic

## Design Considerations

### Design Direction
**Modern, sleek, approachable, and fun** - The markers should feel polished and contemporary while maintaining a playful carnival energy. Avoid generic or dated UI patterns.

### Visual Design
- **Shape:** Rounded rectangle (pill shape), floating on the map without a pointer
- **Size:** Compact but readable, approximately 50-60px wide, 24-28px tall
- **Primary color:** Carnival purple (`#8A2BE2`) or refined variation
- **Accent placement:** Left border/stripe, top border, or subtle glow effect (designer's discretion)
- **Accent colors:**
  - Free: White (`#FFFFFF`)
  - Paid: Red (`#DC2626` or similar vibrant red)
- **Text:** White, bold, centered, readable font size
- **Shadow:** Subtle drop shadow or glow for depth and visibility against map tiles
- **Overall feel:** Clean, lightweight, not cluttered

### Implementation Note
Use the `frontend-design` skill when implementing the marker styling to ensure high design quality and avoid generic AI aesthetics.

### Existing Components to Reuse
- Color variables from `index.css` (`--color-carnival-purple`)
- Type definitions from `types.ts` (`BlockFeature`)

## Technical Considerations

- MapTiler SDK supports custom HTML elements for markers via the `element` option in the Marker constructor
- The custom marker HTML element should be created using DOM APIs or a render-to-string approach
- Marker cleanup logic in `Map.tsx` should remain unchanged (remove all markers before adding new ones)
- Consider using inline styles or a dedicated CSS class for marker styling
- The marker element needs a click event listener attached (existing pattern in codebase)

### Implementation Approach
```typescript
// Example marker creation pattern
const markerElement = createEventMarkerElement({
  time: feature.properties.time,
  isFree: feature.properties.is_free
});

const marker = new maptilersdk.Marker({ element: markerElement })
  .setLngLat(feature.geometry.coordinates)
  .addTo(map);
```

## Success Metrics

- Users can identify event start times without clicking markers
- Users can distinguish free vs. paid events at a glance from marker colors
- No regression in map performance or marker click functionality
- Markers remain readable at the default zoom level (12)

## Open Questions

- None at this time - design details to be refined during implementation using the `frontend-design` skill
