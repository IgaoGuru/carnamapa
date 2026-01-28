# PRD: Event RSVP ("Eu vou!") Feature

## Introduction

Replace the "Obter direções" button in the event detail modal with an "Eu vou!" RSVP toggle button. Users can declare their intent to attend an event without authentication, using device-based identification. RSVPs are persisted in Supabase for future aggregation features (e.g., popularity leaderboards).

## Goals

- Allow users to RSVP to events with a single tap ("Eu vou!")
- Persist RSVP state across browser sessions on the same device
- Store RSVPs in Supabase for future analytics/aggregation
- Prevent basic abuse (rate limiting, one RSVP per event per device)
- Keep the UX simple - no authentication required

## User Stories

### US-001: Set up Supabase backend for RSVPs
**Description:** As a developer, I need a backend to store RSVPs so they persist and can be aggregated in the future.

**Acceptance Criteria:**
- [ ] Create Supabase project (or use existing if available)
- [ ] Create `rsvps` table with columns: `id` (uuid, primary key), `device_id` (text), `event_id` (text), `created_at` (timestamp)
- [ ] Add unique constraint on `(device_id, event_id)` to prevent duplicate RSVPs
- [ ] Configure Row Level Security (RLS) policies:
  - Anyone can INSERT (with rate limiting consideration)
  - Anyone can SELECT their own RSVPs (by device_id)
  - Anyone can DELETE their own RSVPs (by device_id)
- [ ] Add index on `event_id` for future aggregation queries
- [ ] Document Supabase setup in README or separate doc

### US-002: Create device ID management utility
**Description:** As a developer, I need a way to generate and persist a unique device identifier so RSVPs can be tied to a device.

**Acceptance Criteria:**
- [ ] Create utility function `getDeviceId()` that:
  - Returns existing UUID from localStorage if present
  - Generates new UUID, stores in localStorage, and returns it if not present
- [ ] UUID stored under key `carnamapa_device_id`
- [ ] Typecheck passes

### US-003: Create Supabase client and RSVP service
**Description:** As a developer, I need a service layer to interact with the RSVPs table.

**Acceptance Criteria:**
- [ ] Install and configure Supabase JS client (`@supabase/supabase-js`)
- [ ] Create RSVP service with functions:
  - `getRsvpStatus(eventId: string): Promise<boolean>` - check if current device has RSVP'd
  - `createRsvp(eventId: string): Promise<void>` - add RSVP for current device
  - `deleteRsvp(eventId: string): Promise<void>` - remove RSVP for current device
  - `getUserRsvps(): Promise<string[]>` - get all event IDs the current device has RSVP'd to
- [ ] Handle errors gracefully (network issues, rate limits)
- [ ] Supabase URL and anon key stored in environment variables
- [ ] Typecheck passes

### US-004: Create useRsvp hook
**Description:** As a developer, I need a React hook to manage RSVP state for a specific event.

**Acceptance Criteria:**
- [ ] Create `useRsvp(eventId: string, eventDate: string)` hook that returns:
  - `isGoing: boolean` - whether current device has RSVP'd
  - `isLoading: boolean` - whether RSVP status is being fetched/updated
  - `toggleRsvp: () => void` - function to toggle RSVP state
  - `canRsvp: boolean` - false if event is from a previous day
- [ ] Hook fetches initial RSVP status on mount
- [ ] `toggleRsvp` creates or deletes RSVP as appropriate
- [ ] Optimistic UI updates (toggle immediately, revert on error)
- [ ] `canRsvp` returns false if `eventDate < today` (comparing dates only, not times)
- [ ] Typecheck passes

### US-005: Replace directions button with RSVP button
**Description:** As a user, I want to tap "Eu vou!" to indicate I'm attending an event, and see "Não vou mais" if I've already RSVP'd.

**Acceptance Criteria:**
- [ ] Remove "Obter direções" button from BlockDetailModal
- [ ] Add new RSVP button in its place that shows:
  - "Eu vou!" (blue/primary style) when not RSVP'd
  - "Não vou mais" (outline/secondary style) when RSVP'd
- [ ] Button is disabled with loading state while RSVP is being toggled
- [ ] Button is disabled (grayed out) for events from previous days
- [ ] Show subtle feedback on successful toggle (e.g., brief color change or checkmark)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Prefetch user RSVPs on app load
**Description:** As a user, I want to see my RSVP status immediately when opening event details, without waiting for a fetch.

**Acceptance Criteria:**
- [ ] Fetch all user RSVPs once on app initialization
- [ ] Cache RSVP'd event IDs in React state/context
- [ ] `useRsvp` hook reads from cache for instant initial state
- [ ] Cache is updated when user toggles RSVP
- [ ] Typecheck passes

### US-007: Add minimal privacy notice
**Description:** As a user, I want to understand how my RSVP data is handled so I can make an informed choice.

**Acceptance Criteria:**
- [ ] Add small, non-intrusive text near the RSVP button or in the modal footer
- [ ] Text in Portuguese: "Guardamos um identificador anônimo no seu navegador para lembrar suas confirmações."
- [ ] No consent popup/banner required (non-blocking)
- [ ] Optional: Link to a simple privacy explanation (can be a tooltip or expandable text)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Generate and persist a UUID in localStorage as `carnamapa_device_id` on first visit
- FR-2: Store RSVPs in Supabase table with columns: `id`, `device_id`, `event_id`, `created_at`
- FR-3: Enforce unique constraint on `(device_id, event_id)` - one RSVP per event per device
- FR-4: Display "Eu vou!" button for events user hasn't RSVP'd to
- FR-5: Display "Não vou mais" button for events user has RSVP'd to
- FR-6: Disable RSVP button for events where `event_date < current_date` (previous days)
- FR-7: Allow RSVP for same-day events regardless of event time
- FR-8: Prefetch all user RSVPs on app load for instant UI state
- FR-9: Retain all RSVP records in database indefinitely (for future analytics)
- FR-10: Display minimal privacy notice explaining anonymous identifier storage (LGPD compliance)

## Non-Goals

- No user authentication or accounts
- No display of RSVP counts or popularity indicators (future feature)
- No leaderboards or aggregation views (future feature)
- No social features (seeing who else is going)
- No notifications or reminders
- No directions button (removed entirely)

## Technical Considerations

- **Supabase:** Use free tier; simple table with RLS policies
- **Device ID:** UUID v4 stored in localStorage; regenerated if cleared (acceptable trade-off)
- **Rate Limiting:** Supabase RLS can enforce basic limits; consider edge function if more needed
- **Optimistic Updates:** Toggle button immediately, revert on API error for snappy UX
- **Environment Variables:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **Caching:** Store user's RSVP'd event IDs in React context to avoid per-modal fetches
- **LGPD Compliance:** The random UUID is essentially anonymous data (cannot identify a natural person through reasonable means). A minimal disclosure notice is included for transparency, but no consent popup is required since: (1) we don't collect personal data, (2) the identifier serves a functional purpose (remembering preferences), and (3) legitimate interest can be claimed as legal basis

## Success Metrics

- Users can RSVP to an event in under 1 second (optimistic UI)
- RSVP state persists across browser sessions
- No duplicate RSVPs possible for same device + event
- System handles 1000+ concurrent users without degradation (Supabase free tier limit)

## Open Questions

None - all questions resolved during requirements gathering.
