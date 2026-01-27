# CarnaMapa Data Format Specification

## Overview
All carnival block data is stored in GeoJSON format, compatible with MapTiler, Mapbox, and Leaflet mapping libraries.

## GeoJSON Structure

### File Format
Each city has a separate GeoJSON file following the FeatureCollection format:

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "city": "São Paulo",
    "city_slug": "sao-paulo",
    "generated_at": "2026-01-27T10:30:00Z",
    "total_blocks": 150,
    "source": "blocosderua.com"
  },
  "features": [
    {
      "type": "Feature",
      "id": "alcione-sp-14-03-26",
      "geometry": {
        "type": "Point",
        "coordinates": [-46.665833, -23.524722]
      },
      "properties": {
        "name": "Alcione",
        "date": "2026-03-14",
        "time": "20:00",
        "datetime": "2026-03-14T20:00:00-03:00",
        "city": "São Paulo",
        "neighborhood": "Barra Funda",
        "address": "Rua Tagipurú, 795",
        "price": 140.00,
        "price_formatted": "R$ 140,00",
        "is_free": false,
        "description": "A powerful vocal performance presentation...",
        "source_url": "https://www.blocosderua.com/programacao/alcione-sp-14-03-26/"
      }
    }
  ]
}
```

## Field Specifications

### Feature ID
- **Type**: String
- **Source**: URL slug from blocosderua.com
- **Example**: `"alcione-sp-14-03-26"`
- **Purpose**: Unique identifier for each block

### Geometry
- **type**: Always `"Point"`
- **coordinates**: Array `[longitude, latitude]` or `null`
  - Longitude first (x-axis, -180 to 180)
  - Latitude second (y-axis, -90 to 90)
  - Example: `[-46.665833, -23.524722]` for São Paulo
  - **Important**: GeoJSON uses [lon, lat], not [lat, lon]
  - **Can be `null`** for blocks where geocoding failed (see `needs_geocoding` property)

### Properties Object

#### Required Properties
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | String | Block name | `"Alcione"` |
| `date` | String | ISO date (YYYY-MM-DD) | `"2026-03-14"` |
| `time` | String | 24-hour time (HH:MM) | `"20:00"` |
| `datetime` | String | ISO 8601 with timezone | `"2026-03-14T20:00:00-03:00"` |
| `city` | String | City name | `"São Paulo"` |
| `neighborhood` | String | Neighborhood/district | `"Barra Funda"` |
| `source_url` | String | Source page URL | `"https://www.blocosderua.com/..."` |

#### Optional Properties
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `address` | String \| null | Full street address | `"Rua Tagipurú, 795"` |
| `price` | Number \| null | Numeric price value | `140.00` |
| `price_formatted` | String \| null | Display-ready price | `"R$ 140,00"` |
| `is_free` | Boolean | Whether event is free | `false` |
| `description` | String \| null | Event description | `"A powerful..."` |
| `needs_geocoding` | Boolean | Whether block needs geocoding retry | `true` |
| `geocoding_query` | String \| null | Query used for geocoding (for retry) | `"Rua X, Centro"` |

## File Organization

```
scraper/
  output/
    sao-paulo.json
    rio-de-janeiro.json
    belo-horizonte.json
    salvador.json
    florianopolis.json
    recife-olinda.json
    brasilia.json
    porto-alegre.json
    fortaleza.json
```

## Data Validation Rules

### Required Field Validation
- All required properties must be present and non-null
- `coordinates` must be valid [lon, lat] within Brazil's bounds
- `date` must be valid ISO date
- `time` must be valid HH:MM format

### Data Quality
- Remove duplicate blocks (same id)
- Validate coordinates are in Brazil (approximate bounds):
  - Longitude: -73.98 to -32.39
  - Latitude: -33.75 to 5.27
- Ensure `datetime` correctly combines date, time, and timezone (Brazil uses BRT/BRST)

## Timezone Handling
Brazil has multiple timezones:
- Most cities (SP, Rio, BH, Salvador, Recife, Brasília): UTC-3 (BRT)
- Consider daylight saving time if applicable (though Brazil ended DST in 2019)
- Store all times in ISO 8601 format with timezone offset

## Usage with Mapping Libraries

### MapTiler SDK JS
```javascript
map.addSource('blocks', {
  type: 'geojson',
  data: '/data/sao-paulo.json'
});
```

### Leaflet
```javascript
fetch('/data/sao-paulo.json')
  .then(res => res.json())
  .then(data => L.geoJSON(data).addTo(map));
```

### Mapbox GL JS
```javascript
map.addSource('blocks', {
  type: 'geojson',
  data: '/data/sao-paulo.json'
});
```

All three libraries natively support GeoJSON FeatureCollections with Point geometries.
