# PRD: Meus Blocos Modal

## Introduction

Add a "Meus Blocos" feature that allows users to view all the blocks they've marked as "Eu vou!" in one place. Users can quickly navigate to any of their selected blocks and share their carnival schedule with friends via a URL. When a friend opens the shared link, the blocks are automatically added to their own "Meus Blocos" list.

## Goals

- Provide a centralized view of all blocks the user plans to attend
- Enable quick navigation to any selected block on the map
- Allow users to share their carnival schedule via URL
- Merge shared blocks into the recipient's existing selection (non-destructive)
- Store block selections in the URL for easy sharing and persistence

## User Stories

### US-001: Add "Meus Blocos" button to filter bar
**Description:** As a user, I want to access my selected blocks from the main interface so I can quickly see my carnival schedule.

**Acceptance Criteria:**
- [ ] "Meus Blocos" button appears in the filter bar at the bottom
- [ ] Button shows count of selected blocks (e.g., "Meus Blocos (3)")
- [ ] Button is visually consistent with existing filter bar elements
- [ ] Button is always visible (even with 0 blocks selected)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-002: Create "Meus Blocos" modal with block list
**Description:** As a user, I want to see all my selected blocks in a modal so I can review my carnival schedule.

**Acceptance Criteria:**
- [ ] Modal opens when clicking "Meus Blocos" button
- [ ] Uses white theme styling (like BlockDetailModal)
- [ ] Modal has a header "Meus Blocos"
- [ ] Each block shows: name, date, and time
- [ ] Blocks are sorted by date, then by time
- [ ] Modal can be closed by clicking backdrop or X button
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Show empty state when no blocks selected
**Description:** As a user with no selected blocks, I want to see a helpful message so I understand how to use the feature.

**Acceptance Criteria:**
- [ ] When user has 0 blocks selected, modal shows empty state
- [ ] Empty state message: "Você ainda não confirmou presença em nenhum bloco"
- [ ] Optionally include hint text about how to select blocks
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Navigate to block from modal
**Description:** As a user, I want to click on a block in the modal to see it on the map so I can check its location.

**Acceptance Criteria:**
- [ ] Clicking a block in the list closes the modal
- [ ] Map zooms/pans to center on the selected block
- [ ] Date filter changes to show the block's date
- [ ] The block's detail modal opens (existing BlockDetailModal)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Store block selections in URL
**Description:** As a developer, I need to persist block selections in the URL so they can be shared and restored.

**Acceptance Criteria:**
- [ ] Block IDs are stored in URL query parameter (e.g., `?blocos=id1,id2,id3`)
- [ ] URL includes city parameter (e.g., `?city=rio&blocos=id1,id2,id3`)
- [ ] URL updates when user adds/removes blocks via "Eu vou!" button
- [ ] Block selections are restored when loading a URL with `blocos` param
- [ ] Typecheck passes

### US-006: Add share button to modal
**Description:** As a user, I want to share my block selection with friends so we can coordinate our carnival plans.

**Acceptance Criteria:**
- [ ] "Mandar pra um amigo" button at bottom of modal
- [ ] Button uses Web Share API if available (mobile)
- [ ] Falls back to copying URL to clipboard on desktop
- [ ] Shows confirmation feedback after sharing/copying (e.g., "Link copiado!")
- [ ] Button is disabled/hidden when no blocks are selected
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Merge shared blocks on URL load
**Description:** As a user receiving a shared link, I want the shared blocks added to my existing selection so I don't lose my own choices.

**Acceptance Criteria:**
- [ ] When loading URL with `blocos` param, blocks are merged with existing local selection
- [ ] Duplicate blocks are not added twice
- [ ] User's existing blocks are preserved
- [ ] City from URL is applied (navigates to shared city)
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Add "Meus Blocos" button to FilterBar component with block count badge
- FR-2: Create MeusBlocosModal component with white theme (matching BlockDetailModal)
- FR-3: Display list of selected blocks with name, date, and time
- FR-4: Sort blocks by date (ascending), then by time (ascending)
- FR-5: Show empty state message when no blocks are selected
- FR-6: On block click: close modal, zoom to block, change date filter, open block detail
- FR-7: Store block IDs in URL parameter `blocos` as comma-separated values
- FR-8: Include `city` parameter in shareable URL
- FR-9: Add "Mandar pra um amigo" button that shares/copies URL
- FR-10: Use Web Share API on supported devices, clipboard fallback otherwise
- FR-11: Merge incoming blocks from URL with existing local RSVP state
- FR-12: Sync URL `blocos` param with RsvpContext state

## Non-Goals

- No user accounts or server-side storage of selections
- No notifications or reminders about upcoming blocks
- No ability to add notes or comments to blocks
- No calendar export (iCal, Google Calendar)
- No distinction between "my blocks" and "shared blocks" in the UI

## Technical Considerations

- Block selections currently stored in RsvpContext using device ID
- Need to sync RsvpContext state with URL params (bidirectional)
- Use existing useUrlParams hook for URL management
- Block IDs should be the existing `block.id` from the GeoJSON features
- Consider URL length limits if user selects many blocks (unlikely to be an issue)
- Web Share API is only available in secure contexts (HTTPS) and on mobile

## Design Considerations

- Modal uses white theme like BlockDetailModal for consistency
- Block list items should be tappable/clickable with clear affordance
- Share button should be prominent at bottom of modal
- Consider adding subtle visual feedback when blocks are added via shared link
- Empty state should feel inviting, not like an error

## Success Metrics

- Users can view all their selected blocks in under 2 taps
- Users can navigate to any selected block in under 3 taps
- Shared URLs successfully transfer block selections to recipients
- No loss of existing selections when receiving shared links

## Open Questions

- Should we show a toast/notification when blocks are added from a shared link?
- Should the share message include custom text (e.g., "Confere meu carnaval!")
- Should we limit the number of blocks that can be selected/shared?
