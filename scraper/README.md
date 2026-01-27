# CarnaMapa Scraper

Python scraper that extracts carnival block data from blocosderua.com and generates GeoJSON files for the CarnaMapa project.

## Features

- Scrapes all 9 supported Brazilian cities
- Handles pagination automatically
- Geocodes addresses to coordinates
- Caches geocoding results to minimize API calls
- Generates GeoJSON output files
- Comprehensive error handling and logging
- Rate limiting to respect the source website

## Installation

```bash
cd scraper
pip install -r requirements.txt
```

## Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

### Geocoding Options

**Option 1: Use Nominatim (Free, No API Key)**
- No configuration needed
- Uses OpenStreetMap's free geocoding service
- Rate-limited (1 request per second)
- Recommended for testing

**Option 2: Use Google Maps Geocoding API (Recommended for Production)**
- Get an API key from Google Cloud Console
- Add to `.env`: `GOOGLE_MAPS_API_KEY=your_key_here`
- More accurate results
- Faster (no rate limits with paid tier)

### Rate Limiting

Adjust `REQUESTS_DELAY` in `.env` to control delay between requests (default: 2.0 seconds).

## Usage

### Scrape All Cities

```bash
python src/scraper.py
```

### Scrape Specific Cities

```bash
python src/scraper.py sao-paulo rio-de-janeiro
```

Available city slugs:
- `sao-paulo`
- `rio-de-janeiro`
- `belo-horizonte`
- `salvador`
- `florianopolis`
- `recife-olinda`
- `brasilia`
- `porto-alegre`
- `fortaleza`

## Output

GeoJSON files are generated in the `output/` directory:

```
output/
├── sao-paulo.json
├── rio-de-janeiro.json
├── belo-horizonte.json
└── ...
```

Each file contains:
- All carnival blocks for that city
- Coordinates (longitude, latitude)
- Block details (name, date, time, location, price, etc.)
- Metadata (city name, generation timestamp, total count)

## Caching

Geocoding results are cached in `cache/geocoding_cache.json` to:
- Speed up subsequent runs
- Reduce API calls
- Minimize costs (if using paid geocoding service)

The cache persists between runs. Delete it to force re-geocoding.

## Logging

Logs are written to:
- Console (stdout)
- `logs/scraper.log` file

## Data Quality

The scraper includes validation:
- Skips blocks without required fields (name, date, city)
- Validates coordinates are within Brazil
- Handles missing optional fields gracefully
- Logs errors for manual review

## Troubleshooting

### "No blocks found"
- Check if the source website structure changed
- Verify the city URL is correct
- Look for errors in logs

### Geocoding failures
- Check your API key configuration
- Verify internet connection
- Check API quota/limits
- Review logs for specific addresses that failed

### Rate limiting errors
- Increase `REQUESTS_DELAY` in `.env`
- Use a paid geocoding service
- Run scraper during off-peak hours

## Statistics

After completion, the scraper displays:
- Total cities scraped
- Pages processed
- Blocks found and successfully scraped
- Geocoding success rate
- Error count

Example output:
```
============================================================
SCRAPING COMPLETE
============================================================
Cities scraped:      9
Pages scraped:       45
Blocks found:        850
Blocks scraped:      820
Blocks geocoded:     820
Errors:              30

Geocoding Stats:
Total queries:       825
Successful:          820
Failed:              5
Hit rate:            99.4%
============================================================
```

## Next Steps

After scraping:

1. Review output files in `output/` directory
2. Check logs for any errors
3. Copy JSON files to frontend project:
   ```bash
   cp output/*.json ../frontend/public/data/
   ```

## Development

Project structure:
```
scraper/
├── src/
│   ├── scraper.py      # Main scraper logic
│   ├── geocoder.py     # Geocoding with caching
│   ├── config.py       # City URLs and settings
│   └── utils.py        # Helper functions
├── output/             # Generated GeoJSON files
├── cache/              # Geocoding cache
├── logs/               # Log files
└── requirements.txt    # Python dependencies
```

## License

Part of the CarnaMapa project.
