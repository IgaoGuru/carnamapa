// GeoJSON Feature for a carnival block
export interface BlockFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number] | null; // [lng, lat]
  };
  properties: {
    name: string;
    date: string;           // YYYY-MM-DD
    time: string;           // HH:MM
    datetime: string;       // ISO 8601
    city: string;
    neighborhood: string;
    address: string | null;
    price: number | null;
    price_formatted: string | null;
    is_free: boolean;
    description: string | null;
    source_url: string;
    needs_geocoding?: boolean;
    geocoding_query?: string | null;
  };
}

// GeoJSON FeatureCollection for a city
export interface CityData {
  type: 'FeatureCollection';
  metadata: {
    city: string;
    city_slug: string;
    generated_at: string;
    total_blocks: number;
    source: string;
  };
  features: BlockFeature[];
}

// City configuration
export interface CityConfig {
  name: string;
  slug: string;
  center: [number, number]; // [lng, lat]
}

// App state
export type AppView = 'landing' | 'map';
