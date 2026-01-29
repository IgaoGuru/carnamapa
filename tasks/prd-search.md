# PRD: Block Search

## Introduction

Add a search feature that allows users to quickly find blocks by name or neighborhood. A search bar at the top of the screen shows a dropdown of matching results as the user types. Clicking a result navigates to that block on the map and updates the date filter accordingly.

## Goals

- Allow users to search blocks by name or neighborhood
- Provide instant feedback with dropdown results as user types
- Enable quick navigation to any block regardless of current date filter
- Automatically update date filter when navigating to a search result

## User Stories

### US-008: Add search bar to top of screen
**Description:** As a user, I want a search bar at the top of the map so I can quickly find blocks.

**Acceptance Criteria:**
- [ ] Search input appears at top of screen (below city selector or integrated with it)
- [ ] Search bar has placeholder text (e.g., "Buscar bloco...")
- [ ] Search bar has a search icon
- [ ] Search bar is visually consistent with app design
- [ ] Search bar does not obstruct map interaction when not focused
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Implement search logic
**Description:** As a developer, I need search logic that matches blocks by name or neighborhood.

**Acceptance Criteria:**
- [ ] Search matches against block name (case-insensitive, accent-insensitive)
- [ ] Search matches against neighborhood (case-insensitive, accent-insensitive)
- [ ] Search works across ALL dates (ignores current date filter)
- [ ] Returns results sorted by relevance (name matches before neighborhood matches)
- [ ] Limits results to reasonable number (e.g., 10-15 max)
- [ ] Typecheck passes

### US-010: Show dropdown with search results
**Description:** As a user, I want to see matching blocks in a dropdown as I type so I can find what I'm looking for.

**Acceptance Criteria:**
- [ ] Dropdown appears below search bar when user types
- [ ] Each result shows block name, neighborhood, date, and time
- [ ] Results update as user types (debounced ~200ms)
- [ ] Dropdown shows "Nenhum bloco encontrado" when no matches
- [ ] Dropdown closes when clicking outside or pressing Escape
- [ ] Dropdown closes when search input is cleared
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Navigate to block from search results
**Description:** As a user, I want to click a search result to go directly to that block on the map.

**Acceptance Criteria:**
- [ ] Clicking a result closes the dropdown
- [ ] Clicking a result clears the search input
- [ ] Date filter updates to show the block's date
- [ ] Map zooms/pans to center on the selected block
- [ ] Block detail modal opens (existing BlockDetailModal)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-012: Keyboard navigation for search
**Description:** As a user, I want to navigate search results with my keyboard for faster interaction.

**Acceptance Criteria:**
- [ ] Arrow up/down moves selection through results
- [ ] Enter key selects the highlighted result
- [ ] Escape key closes the dropdown
- [ ] First result is highlighted by default
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Add search input to top of map view (not on landing screen)
- FR-2: Search matches block names and neighborhoods (case-insensitive, accent-insensitive)
- FR-3: Search operates on ALL blocks regardless of current date filter
- FR-4: Show dropdown with matching results (max 10-15 items)
- FR-5: Each dropdown item displays: block name, neighborhood, date, time
- FR-6: Debounce search input (~200ms) to avoid excessive filtering
- FR-7: On result click: close dropdown, clear input, update date filter, zoom to block, open modal
- FR-8: Support keyboard navigation (arrows, enter, escape)

## Non-Goals

- No search history or recent searches
- No fuzzy matching or typo correction
- No search by address (only name and neighborhood)
- No saved/favorite searches
- No search on landing screen (only on map view)

## Technical Considerations

- Use existing cityData from useCityData hook for search source
- Implement accent-insensitive search using `normalize('NFD').replace(/[\u0300-\u036f]/g, '')`
- Consider using useMemo for filtered results to avoid recalculation
- Reuse existing block navigation logic from Meus Blocos feature (US-004)
- Search component should be its own component (e.g., `BlockSearch.tsx`)

## Design Considerations

- Search bar should be subtle when not in use, prominent when focused
- Dropdown should have slight shadow to appear above map
- Results should be easy to tap on mobile (adequate touch targets)
- Consider showing block date with day-of-week for quick scanning (e.g., "Sáb, 01/03")

## Success Metrics

- Users can find any block in under 5 seconds
- Search results appear within 200ms of typing
- Navigation to block works correctly 100% of the time

## Open Questions

- Should we highlight the matching text in search results?
- Should search be available on mobile or only desktop?
