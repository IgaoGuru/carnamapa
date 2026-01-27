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

### 4. Date Filter (Bottom Selector)
- **Position**: Fixed at bottom of screen
- **Type**: Horizontal scrollable date selector
- **Options**:
  - "Todos os dias" (show all dates)
  - Individual dates (only dates that have events)
- **Behavior**: Filter markers in real-time when date is selected
- **Mobile**: Swipeable date list

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
│                                     │
│                                     │
│              MAP                    │
│         (with pins)                 │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  [Date Selector - Horizontal]      │
│  Todos │ 27/Jan │ 28/Jan │ ...     │
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
- [x] Interactive map with block markers
- [x] Date filter (bottom selector)
- [x] Click pin to see block details
- [x] Link to blocosderua.com source
- [x] "Get directions" button

### Future Enhancements (Post-MVP)
- Search blocks by name
- Filter by neighborhood
- Filter by price (free only, paid only)
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
- **Zoom Level**: Auto-fit to show all blocks in city
- **Min Zoom**: 11 (neighborhood level)
- **Max Zoom**: 18 (street level)

### Marker Styling
- **Default**: Standard pin icon
- **Selected**: Highlighted/enlarged pin
- **Clustered**: If many blocks in same location, show cluster with count

### Performance
- Load only selected city data (not all cities at once)
- Lazy load block details on click
- Optimize marker rendering for 100+ pins

## Accessibility
- Keyboard navigation support
- Screen reader compatible
- High contrast mode for pins
- Touch-friendly buttons (min 44x44px)

## Analytics (Optional)
- Track city selections
- Most viewed blocks
- Date filter usage
- Navigation button clicks

## URL Structure
- `/` - Landing page with city selection
- `/?city=sao-paulo` - Direct link to specific city
- `/?city=rio-de-janeiro&date=2026-03-14` - Deep link to city + date
- `/?city=rio-de-janeiro&block=alcione-rj-14-03-26` - Deep link to specific block

## SEO Considerations
- Meta tags for each city page
- Structured data (JSON-LD) for events
- Sitemap with city URLs
- Brazilian Portuguese content

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
