# CarnaMapa 🎭🗺️

Interactive map showing carnival street blocks (blocos) across major Brazilian cities.

## Overview

CarnaMapa helps carnival enthusiasts discover and explore street carnival events in their city. Users can view all carnival blocks on an interactive map, filter by date, and get details about each event.

**Features:**
- 🗺️ Interactive map with carnival block locations
- 📍 Automatic city detection via geolocation
- 📅 Filter blocks by date
- 🎉 View block details (time, location, price, description)
- 🏙️ Support for 9 major Brazilian cities

**Supported Cities:**
- São Paulo
- Rio de Janeiro
- Belo Horizonte
- Salvador
- Florianópolis
- Recife/Olinda
- Brasília
- Porto Alegre
- Fortaleza

## Project Structure

```
carnamapa/
├── specs/          # Project specifications
├── scraper/        # Python scraper for blocosderua.com
└── frontend/       # Vite + React web application
```

## Quick Start

### 1. Scrape Data
```bash
cd scraper
pip install -r requirements.txt
python src/scraper.py
```

This generates GeoJSON files for all cities in `scraper/output/`.

### 2. Run Frontend
```bash
cd frontend
pnpm install
pnpm dev
```

Visit `http://localhost:5173` to see the map.

## Documentation

Comprehensive specifications are available in the `/specs` directory:

- **[Scraper Spec](specs/scraper-spec.md)** - How data is scraped from blocosderua.com
- **[Data Format Spec](specs/data-format-spec.md)** - GeoJSON structure and schema
- **[Frontend Spec](specs/frontend-spec.md)** - Web application requirements and design
- **[Project Structure Spec](specs/project-structure-spec.md)** - Repository organization and workflow

## Technology Stack

### Scraper
- Python 3.10+
- Beautiful Soup 4 (HTML parsing)
- Requests (HTTP client)
- Geopy/Google Maps API (geocoding)

### Frontend
- Vite (build tool)
- React 18 + TypeScript
- Tailwind CSS
- MapTiler SDK (interactive maps)

## Development Phases

- [x] **Phase 1**: Write project specifications
- [x] **Phase 2**: Build and execute scraper
- [x] **Phase 3**: Develop frontend application
- [ ] **Phase 4**: Deploy to production

## Data Source

All carnival block data is sourced from [blocosderua.com](https://www.blocosderua.com), a comprehensive database of Brazilian street carnival events.

## License

TBD

## Contributing

TBD

---

**Made with ❤️ for carnival lovers** 🎊
