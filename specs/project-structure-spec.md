# CarnaMapa Project Structure Specification

## Repository Organization

```
carnamapa/
├── specs/                          # Project specifications (current directory)
│   ├── scraper-spec.md            # Scraper requirements & strategy
│   ├── data-format-spec.md        # GeoJSON data format
│   ├── frontend-spec.md           # Frontend application specs
│   └── project-structure-spec.md  # This file
│
├── scraper/                        # Data scraping module
│   ├── src/
│   │   ├── scraper.py             # Main scraper logic
│   │   ├── geocoder.py            # Address → coordinates conversion
│   │   ├── config.py              # City URLs and configuration
│   │   └── utils.py               # Helper functions
│   ├── output/                     # Generated GeoJSON files
│   │   ├── sao-paulo.json
│   │   ├── rio-de-janeiro.json
│   │   └── ...
│   ├── cache/                      # Geocoding cache (optional)
│   ├── logs/                       # Error logs
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example               # Environment variables template
│   └── README.md                   # Scraper documentation
│
├── frontend/                       # Vite + React web application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map.tsx            # Map component
│   │   │   ├── DateSelector.tsx  # Date filter component
│   │   │   ├── BlockDetailModal.tsx  # Block popup
│   │   │   ├── CitySelector.tsx  # Manual city selection
│   │   │   └── LocationButton.tsx    # Geolocation trigger
│   │   ├── lib/
│   │   │   ├── mapUtils.ts       # Map helper functions
│   │   │   ├── cityDetection.ts  # Geolocation logic
│   │   │   └── dataLoader.ts     # Load GeoJSON files
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript types
│   │   ├── App.tsx               # Main app component
│   │   ├── main.tsx              # Entry point
│   │   └── index.css             # Global styles
│   ├── public/
│   │   └── data/                 # GeoJSON files (copied from scraper/output)
│   │       ├── sao-paulo.json
│   │       ├── rio-de-janeiro.json
│   │       └── ...
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── README.md
│
├── .gitignore
└── README.md                       # Main project documentation
```

## Module Descriptions

### `/specs/` - Specifications
Contains all project specifications and design documents. Created first to guide implementation.

**Files**:
- `scraper-spec.md` - How to scrape blocosderua.com
- `data-format-spec.md` - GeoJSON schema
- `frontend-spec.md` - Web app requirements
- `project-structure-spec.md` - This file

### `/scraper/` - Data Collection
Python-based scraper that extracts carnival block data and generates GeoJSON files.

**Key Files**:
- `scraper.py` - Main script with scraping logic
- `geocoder.py` - Converts addresses to lat/lon coordinates
- `config.py` - City URLs and constants
- `output/` - Generated JSON files (git-tracked for deployment)

**Dependencies**:
- beautifulsoup4 - HTML parsing
- requests - HTTP client
- geopy or googlemaps - Geocoding

**Execution**:
```bash
cd scraper
pip install -r requirements.txt
python src/scraper.py
```

### `/frontend/` - Web Application
Vite + React 18 + TypeScript application with Tailwind CSS.

**Key Components**:
- `Map.tsx` - MapTiler integration, renders markers
- `DateSelector.tsx` - Bottom date filter
- `BlockDetailModal.tsx` - Shows block details on pin click
- `CitySelector.tsx` - Fallback if geolocation fails

**Data Flow**:
1. Detect user city (geolocation or manual)
2. Load corresponding JSON from `/public/data/` using `fetch()`
3. Render map with markers
4. Filter markers based on date selection

**Development**:
```bash
cd frontend
pnpm install
pnpm dev
```

**Deployment** (Static Build):
```bash
pnpm build
# Deploy dist/ folder to Railway, Netlify, or any static host
```

## Git Strategy

### Branching
- `main` - Production-ready code
- `dev` - Development branch
- Feature branches as needed

### Commit Workflow
1. Build and test scraper
2. Commit generated JSON files to repo
3. Copy JSON files to `frontend/public/data/`
4. Build frontend
5. Deploy

### What to Commit
- **Scraper code**: Yes
- **Generated JSON files**: Yes (data is static, needed for deployment)
- **Geocoding cache**: No (add to .gitignore)
- **Error logs**: No (add to .gitignore)
- **node_modules**: No (auto-generated)
- **.env files**: No (add to .gitignore, provide .env.example)

### .gitignore Example
```
# Python
__pycache__/
*.py[cod]
*$py.class
.env
venv/
scraper/cache/
scraper/logs/*.log

# Node
node_modules/
dist/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

## Environment Variables

### Scraper `.env`
```bash
# Geocoding API (choose one)
GOOGLE_MAPS_API_KEY=your_key_here
# OR
MAPBOX_ACCESS_TOKEN=your_token_here

# Rate limiting
REQUESTS_PER_SECOND=0.5
```

### Frontend `.env.local`
```bash
# MapTiler API key
VITE_MAPTILER_API_KEY=your_key_here

# Optional analytics
VITE_GA_ID=UA-XXXXXXXXX-X
```

## Deployment Strategy

### Scraper
- **Execution**: Manual, one-time (or as needed for updates)
- **Output**: Commit JSON files to git
- **Hosting**: Not deployed (runs locally)

### Frontend
- **Platform**: Railway (preferred), Netlify, or GitHub Pages (static hosting)
- **Build**: `pnpm build` generates static files in `dist/`
- **Data**: Static JSON files deployed with app
- **Domain**: `carnamapa.com` (configure in hosting provider)

### Data Updates (Future)
If carnival data needs updates:
1. Re-run scraper locally
2. Commit updated JSON files
3. Push to main
4. Railway auto-deploys (or trigger manual redeploy)

## Development Workflow

### Phase 1: Initial Setup
```bash
# Create repo structure
mkdir -p scraper/src scraper/output scraper/logs
mkdir -p frontend

# Create specs (already done!)
mkdir -p specs
```

### Phase 2: Build Scraper
```bash
cd scraper
python -m venv venv
source venv/bin/activate
pip install beautifulsoup4 requests geopy
# Implement scraper
python src/scraper.py
# Verify JSON output
```

### Phase 3: Build Frontend
```bash
cd frontend
pnpm create vite . --template react-ts
pnpm install
# Install dependencies
pnpm add @maptiler/sdk tailwindcss
# Copy data files
mkdir -p public/data
cp ../scraper/output/*.json public/data/
# Implement components
pnpm dev
```

### Phase 4: Deploy
```bash
cd frontend
pnpm build
# Deploy dist/ folder to Railway/Netlify/etc
# Configure domain in hosting dashboard
# Set environment variables (MapTiler API key)
```

## Testing Strategy

### Scraper Testing
- Test with single city first (São Paulo)
- Verify geocoding accuracy
- Check for missing data
- Validate JSON structure

### Frontend Testing
- Test geolocation on mobile devices
- Verify map markers render correctly
- Test date filtering
- Cross-browser testing
- Mobile responsiveness

## Documentation

Each module should have its own README:
- `/README.md` - Project overview, quick start
- `/scraper/README.md` - How to run scraper
- `/frontend/README.md` - How to run frontend

## Performance Targets

### Scraper
- Complete scrape of all cities: < 30 minutes
- Geocoding cache hits: > 80%
- Error rate: < 5%

### Frontend
- Initial page load: < 2 seconds
- Time to interactive: < 3 seconds
- Map render time: < 1 second
- Mobile Lighthouse score: > 90

## Security Considerations

### Scraper
- Don't commit API keys
- Rate limit requests
- Handle errors gracefully

### Frontend
- Use environment variables for API keys
- Validate user input (city selection)
- No sensitive data stored client-side
- CORS properly configured

## Future Scalability

### Data Updates
- Consider moving to database if updates become frequent
- Build admin panel for manual data entry
- Automatic scraper scheduling (cron job)

### Frontend Enhancements
- CDN for JSON files (if they grow large)
- Server-side rendering for SEO
- Progressive Web App (PWA) features
- Real-time updates via WebSocket

## Success Metrics

### MVP Launch
- All 9 cities have data
- Map loads on mobile and desktop
- Users can filter by date
- Users can see block details

### Post-Launch
- Track page views per city
- Monitor error rates
- Gather user feedback
- Plan feature additions
