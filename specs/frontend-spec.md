# CarnaMapa Frontend Specification

## Overview
Interactive web application showing carnival blocks on a map, allowing users to filter by date and explore events in their city.

## User Flow

### 1. Landing Page (`carnamapa.com`)
- **Initial Screen**: Large button with text "Clique aqui para ir para sua cidade"
- **Action**: On click, request user's geolocation permission
- **Loading State**: Show loading spinner while getting location

### 2. Location Detection
- **Success**: Detect user's city from coordinates
- **Failure**: Show city selector dropdown with all 9 supported cities
- **Manual Override**: Provide option to change city even if auto-detected

### 3. City Map View
- **Map Display**: Full-screen interactive map centered on detected city
- **Markers**: Pin for each carnival block at its location
- **Default View**: Show all blocks for all dates initially
- **Clean UI**: No zoom controls (+/-), no compass, no navigation buttons - pinch/scroll only

### 4. Filter Bar (Bottom of Screen)
- **Position**: Fixed at bottom of screen, two horizontal layers
- **Background**: Transparent (floats over map)
- **Layer 1 (Top)**: Date Selector (aligned left)
  - Left arrow `<` to go to previous day
  - Center: Current selected date (tap to open calendar popup)
  - Right arrow `>` to go to next day
  - When no date selected, shows "Todos os dias"
  - Buttons have white/translucent background with shadow
- **Layer 2 (Bottom)**: Time & Price Filters
  - Time-of-day multi-select: Three segments in rounded container
    - "Manhã" (06:00 - 11:59)
    - "Tarde" (12:00 - 17:59)
    - "Noite" (18:00 - 05:59)
  - "Só gratuitos" toggle button on the right (purple when active)
- **Behavior**: Filters update markers in real-time, multiple filters combine with AND logic
- **Calendar Popup**: Opens when center date is tapped
  - Fixed date range: Feb 1 to Mar 1, 2026 (Carnaval period)
  - Shows available dates highlighted, unavailable dates grayed out

### 5. Block Detail View
- **Trigger**: User clicks on a map pin
- **Display**: Modal/popup showing:
  - Block name
  - Date and time
  - Neighborhood
  - Full address (if available)
  - Price (if paid event)
  - Description
  - Link to source page on blocosderua.com
  - "Obter direções" button (opens navigation in maps app)

## Technical Stack

### Chosen Stack (Simple & Fast)
- **Build Tool**: Vite (fast dev server, simple setup)
- **Framework**: React 18 + TypeScript
- **Mapping**: MapTiler SDK JS
  - Free tier: 100k map loads/month
  - Good documentation
  - Simple API
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm
- **Deployment**: Railway (preferred) / Netlify / GitHub Pages (static hosting)
- **Data Hosting**: Store JSON files in `/public/data/` directory

### Why Vite over Next.js?
- Pure client-side app (no server-side rendering needed)
- Deploy anywhere, not just Vercel
- Faster builds and dev server
- Simpler architecture for this use case
- All data is static JSON files

### Alternative Mapping Libraries
| Library | Pros | Cons |
|---------|------|------|
| **MapTiler** | Easy, free tier, modern | Requires API key |
| **Leaflet** | Completely free, no API key | More manual setup, older API |
| **Mapbox** | Beautiful, powerful | Expensive after free tier |

### Recommended: MapTiler
- Best balance of ease-of-use and features
- Free tier is sufficient for early stage
- Modern JavaScript API
- Good mobile performance

## Design Specifications

### Layout
```
┌─────────────────────────────────────┐
│ [City ▼]                            │  ← City selector (top left)
│                                     │
│                                     │
│              MAP                    │
│    (full screen, no controls)       │
│                                     │
│                                     │
│  [<] 27 de Fevereiro [>]            │  ← Date selector (left-aligned, transparent bg)
│  [Manhã|Tarde|Noite]  [Só gratuitos]│  ← Time multi-select + toggle button
└─────────────────────────────────────┘

Calendar Popup (when date tapped):
┌─────────────────────────────────────┐
│              MAP (dimmed)           │
│   ┌─────────────────────────────┐   │
│   │      Carnaval 2026          │   │
│   │  D  S  T  Q  Q  S  S        │   │
│   │  1  2  3  4  5  6  7  (Feb) │   │
│   │  ...                        │   │
│   │  1  (Mar 1 - end of range)  │   │
│   │  [Todos os dias]            │   │
│   └─────────────────────────────┘   │
│  [<] 27 de Fevereiro [>]            │
│  [Manhã|Tarde|Noite]  [Só gratuitos]│
└─────────────────────────────────────┘
```

### Color Scheme (Carnival Theme)
- **Primary**: Vibrant colors (yellow, green, blue, purple)
- **Pins**: Color-coded by date or price tier
- **Background**: Light/neutral for map readability

### Responsive Design
- **Mobile-first**: Primary target is mobile users
- **Breakpoints**:
  - Mobile: < 768px (full screen map)
  - Desktop: > 768px (map + optional sidebar)

## Features

### MVP (Version 1)
- [x] Geolocation-based city detection
- [x] Interactive map with block markers (clean UI, no controls)
- [x] Bottom filter bar with transparent background
- [x] Date selector with arrows and calendar popup (Feb 1 - Mar 1 range)
- [x] Filter by time period (manhã/tarde/noite multi-select)
- [x] Filter by price (free only toggle button)
- [x] Click pin to see block details
- [x] Link to blocosderua.com source
- [x] "Get directions" button
- [x] No automatic zoom on filter changes

### Future Enhancements (Post-MVP)
- Search blocks by name
- Filter by neighborhood
- Save favorite blocks (localStorage)
- Share specific blocks (URL with query params)
- Show block routes/paths if available in future data
- Multi-language support (PT/EN)
- PWA for offline access
- Push notifications for blocks starting soon

## Data Loading Strategy

### Static JSON (Perfect for MVP)
- Store JSON files in `/public/data/`
- Load city data on map initialization with `fetch()`
- **Pros**: Simple, fast, no backend needed, works with static hosting
- **Cons**: Data updates require redeployment

Since we're using Vite, all files in `/public/` are served statically and can be fetched directly from the client.

## City Detection Logic

```javascript
1. Request geolocation permission
2. Get coordinates (lat, lon)
3. Determine city from coordinates:
   - Use reverse geocoding API OR
   - Simple distance calculation to city centers
4. Load corresponding city JSON file
5. Initialize map centered on city
```

### City Center Coordinates (for fallback)
```javascript
const cityCenters = {
  'sao-paulo': [-46.6333, -23.5505],
  'rio-de-janeiro': [-43.1729, -22.9068],
  'belo-horizonte': [-43.9378, -19.9167],
  'salvador': [-38.5108, -12.9714],
  'florianopolis': [-48.5482, -27.5969],
  'recife-olinda': [-34.8811, -8.0476],
  'brasilia': [-47.8825, -15.7942],
  'porto-alegre': [-51.2177, -30.0346],
  'fortaleza': [-38.5434, -3.7172]
};
```

## Map Configuration

### Initial View
- **Zoom Level**: Fixed at 12 (city level), centered on city
- **No automatic zoom**: Map does not zoom when filters change
- **User controls zoom**: Only user interactions (pinch/scroll) change zoom level

### Controls
- **Navigation Controls**: Disabled (no +/- zoom buttons)
- **Compass**: Disabled
- **Geolocate Button**: Disabled
- **User Interaction**: Pinch-to-zoom and scroll/drag only

### Marker Styling
- **Default**: Purple pin icon (#8A2BE2)
- **Selected**: Opens detail modal on click

### Performance
- Load only selected city data (not all cities at once)
- Lazy load block details on click
- Markers update without zoom changes when filters applied

## URL Structure
- `/` - Landing page with city selection
- `/?city=sao-paulo` - Direct link to specific city
- `/?city=rio-de-janeiro&date=2026-03-14` - Deep link to city + date
- `/?city=rio-de-janeiro&date=2026-03-14&free=1` - Deep link with free-only filter
- `/?city=rio-de-janeiro&block=alcione-rj-14-03-26` - Deep link to specific block

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Android)
- No IE11 support needed

## Development Phases

### Phase 1: Scraper (Current)
Build and execute scraper to generate GeoJSON files for all cities.

### Phase 2: Core Map Feature
- Set up Vite + React + TypeScript project
- Integrate MapTiler SDK
- Implement basic map with markers
- Add block detail popups

### Phase 3: Date Filter & UX
- Build date selector component
- Implement filtering logic
- Polish mobile experience

### Phase 4: Location & Polish
- Add geolocation detection
- Implement city selector fallback
- Final design polish
- Testing & deployment
