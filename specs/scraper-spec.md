# CarnaMapa Scraper Specification

## Overview
Scraper to extract carnival block data from blocosderua.com for all supported cities in Brazil.

## Target Cities
The following cities should be scraped:
1. São Paulo - `https://www.blocosderua.com/programacao-blocos-de-carnaval-sp`
2. Rio de Janeiro - `https://www.blocosderua.com/rio-de-janeiro/programacao-carnaval-blocos-de-rua`
3. Belo Horizonte - `https://www.blocosderua.com/belo-horizonte/programacao-carnaval-blocos-de-rua`
4. Salvador - `https://www.blocosderua.com/salvador/programacao-carnaval`
5. Florianópolis - `https://www.blocosderua.com/florianopolis/programacao-carnaval-blocos-de-rua`
6. Recife/Olinda - `https://www.blocosderua.com/recife-olinda/programacao-carnaval`
7. Brasília - `https://www.blocosderua.com/brasilia/programacao-carnaval`
8. Porto Alegre - `https://www.blocosderua.com/porto-alegre/programacao-carnaval`
9. Fortaleza - `https://www.blocosderua.com/fortaleza/programacao-carnaval`

## Scraping Strategy

### Step 1: City Page Listing
For each city URL:
1. Load the main city page (leave `dataSelect` unselected to show all blocks)
2. Navigate through pagination (`/page/1`, `/page/2`, etc.)
3. Extract all `<a class="card card-programacao">` elements
4. Collect the `href` attribute from each card (block detail page URL)
5. Continue pagination until no more pages exist (detect via absence of "Próximos Eventos >>" link or 404)

### Step 2: Block Detail Page
For each block URL collected:
1. Load the individual block page (e.g., `https://www.blocosderua.com/programacao/alcione-sp-14-03-26/`)
2. Extract the following data fields:

#### Required Fields
- **id**: Extract from URL slug (e.g., `alcione-sp-14-03-26` from the URL path)
- **name**: Block name/title from page heading
- **date**: Date of the event (format: ISO 8601 date string)
- **time**: Time of the event (format: HH:MM in 24-hour format)
- **city**: City name (pass from parent iteration)
- **neighborhood**: Neighborhood/district name
- **source_url**: Full URL of the block detail page

#### Optional Fields (extract if available)
- **address**: Full street address (found below `<i class="text-primary icon-blocos icon-map">`)
- **price**: Ticket price if the event is paid (e.g., "R$ 140.00" or "Gratuito")
- **description**: Event description text

### Step 3: Data Validation
Before saving:
- Ensure required fields are present (id, name, date, city, source_url)
- Validate date format
- Normalize price format (extract numeric value, store as number or null for free events)
- Handle missing optional fields as `null`

## Technical Requirements

### Language & Libraries
- Python 3.10+
- Beautiful Soup 4 or Scrapy for HTML parsing
- Requests or httpx for HTTP calls
- Consider rate limiting (1-2 seconds between requests)

### Error Handling
- Retry failed HTTP requests (max 3 attempts)
- Log errors for pages that fail to parse
- Continue scraping even if individual blocks fail
- Generate error report at end of execution

### Output Format
Generate one JSON file per city:
- Filename: `{city-slug}.json` (e.g., `sao-paulo.json`, `rio-de-janeiro.json`)
- Location: `scraper/output/` directory
- Format: GeoJSON FeatureCollection (see `data-format-spec.md`)

## Execution

### Initial Scrape
```bash
cd scraper
source .venv/bin/activate
python src/scraper.py  # All cities
# OR
python src/scraper.py sao-paulo rio-de-janeiro  # Specific cities
```

### Retry Failed Geocoding (Optional)
After initial scrape, retry blocks that failed geocoding:
```bash
# Add Google Maps API key to .env first:
# GOOGLE_MAPS_API_KEY=your_key_here

python src/retry_geocoding.py  # All cities
# OR
python src/retry_geocoding.py sao-paulo rio-de-janeiro  # Specific cities
```

## Geocoding Strategy

### Two-Pass Approach
Since blocosderua.com doesn't provide lat/lon coordinates, we use a two-pass geocoding strategy:

**Pass 1: Initial Scrape with Nominatim (Free)**
- Use Nominatim (OpenStreetMap) for initial geocoding - no API key required
- Input: Full address when available, otherwise `{neighborhood}, {city}, Brazil`
- Output: `[longitude, latitude]` coordinates
- Cache results to avoid redundant API calls
- **Save blocks even if geocoding fails** with `coordinates: null`
- Mark failed blocks with `needs_geocoding: true` and store `geocoding_query`

**Pass 2: Retry Failed Geocoding with Google Maps API**
- Run `retry_geocoding.py` script with Google Maps API key
- Only retries blocks where `coordinates === null`
- More accurate results for obscure/new addresses
- Updates the JSON files in place
- Requires `GOOGLE_MAPS_API_KEY` in `.env`

### Benefits
- Free initial scraping with Nominatim
- No data loss - all blocks are saved
- Only pay for Google Maps API for the ~10-20% that fail
- Can re-run retry script multiple times if needed

## Rate Limiting & Ethics
- Respect robots.txt
- Add User-Agent header identifying the scraper
- Rate limit requests (1-2 seconds between pages)
- Consider scraping during off-peak hours
- Store scraped data locally (don't repeatedly scrape the same data)
