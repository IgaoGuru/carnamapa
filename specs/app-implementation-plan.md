# CarnaMapa Frontend Implementation Plan

## Overview

Step-by-step implementation guide for building the CarnaMapa frontend using Vite + React + TypeScript + Tailwind CSS + MapTiler.

## Prerequisites

- Node.js 18+
- pnpm installed (`npm install -g pnpm`)
- MapTiler API key (free at https://cloud.maptiler.com/)
- GeoJSON data files from scraper (in `scraper/output/`)

---

## Phase 1: Project Setup

### 1.1 Initialize Vite Project

```bash
cd carnamapa
pnpm create vite frontend --template react-ts
cd frontend
pnpm install
```

### 1.2 Install Dependencies

```bash
# MapTiler SDK
pnpm add @maptiler/sdk

# Tailwind CSS
pnpm add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Utility libraries
pnpm add clsx date-fns
```

### 1.3 Configure Tailwind

**tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        carnival: {
          yellow: '#FFD700',
          green: '#00A86B',
          blue: '#1E90FF',
          purple: '#8A2BE2',
          pink: '#FF69B4',
        }
      }
    },
  },
  plugins: [],
}
```

**src/index.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
}
```

### 1.4 Environment Variables

**frontend/.env.local**
```bash
VITE_MAPTILER_API_KEY=your_api_key_here
```

**frontend/.env.example**
```bash
VITE_MAPTILER_API_KEY=
```

### 1.5 Copy Data Files

```bash
mkdir -p frontend/public/data
cp scraper/output/*.json frontend/public/data/
```

### 1.6 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Map.tsx              # MapTiler map component (no controls)
│   │   ├── FilterDrawer.tsx     # Right-side pull tab with calendar & filters
│   │   ├── BlockDetailModal.tsx # Block info popup
│   │   ├── CitySelector.tsx     # City dropdown
│   │   ├── LandingScreen.tsx    # Initial "find my city" screen
│   │   └── LoadingSpinner.tsx   # Loading indicator
│   ├── hooks/
│   │   ├── useGeolocation.ts    # Browser geolocation hook
│   │   ├── useCityData.ts       # Load city GeoJSON
│   │   └── useUrlParams.ts      # URL query param sync
│   ├── lib/
│   │   ├── cities.ts            # City config (centers, slugs)
│   │   ├── cityDetection.ts     # Determine city from coords
│   │   └── types.ts             # TypeScript interfaces
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   └── data/
│       ├── sao-paulo.json
│       ├── rio-de-janeiro.json
│       └── ...
├── .env.local
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

---

## Phase 2: Core Types & Configuration

### 2.1 TypeScript Types

**src/lib/types.ts**
```typescript
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

// Filter state
export interface FilterState {
  selectedDate: string | null;  // YYYY-MM-DD or null for all dates
  freeOnly: boolean;            // Show only free events
  timePeriods: TimePeriod[];    // Selected time periods (multi-select)
}

// Time period options
export type TimePeriod = 'manha' | 'tarde' | 'noite';

// Time period definitions (24h format)
export const TIME_PERIODS: Record<TimePeriod, { label: string; start: number; end: number }> = {
  manha: { label: 'Manhã', start: 6, end: 12 },   // 06:00 - 11:59
  tarde: { label: 'Tarde', start: 12, end: 18 },  // 12:00 - 17:59
  noite: { label: 'Noite', start: 18, end: 6 },   // 18:00 - 05:59 (wraps midnight)
};
```

### 2.2 City Configuration

**src/lib/cities.ts**
```typescript
import { CityConfig } from './types';

export const CITIES: CityConfig[] = [
  { name: 'São Paulo', slug: 'sao-paulo', center: [-46.6333, -23.5505] },
  { name: 'Rio de Janeiro', slug: 'rio-de-janeiro', center: [-43.1729, -22.9068] },
  { name: 'Belo Horizonte', slug: 'belo-horizonte', center: [-43.9378, -19.9167] },
  { name: 'Salvador', slug: 'salvador', center: [-38.5108, -12.9714] },
  { name: 'Florianópolis', slug: 'florianopolis', center: [-48.5482, -27.5969] },
  { name: 'Recife/Olinda', slug: 'recife-olinda', center: [-34.8811, -8.0476] },
  { name: 'Brasília', slug: 'brasilia', center: [-47.8825, -15.7942] },
  { name: 'Porto Alegre', slug: 'porto-alegre', center: [-51.2177, -30.0346] },
  { name: 'Fortaleza', slug: 'fortaleza', center: [-38.5434, -3.7172] },
];

export function getCityBySlug(slug: string): CityConfig | undefined {
  return CITIES.find(city => city.slug === slug);
}

export function getCityByName(name: string): CityConfig | undefined {
  return CITIES.find(city => city.name === name);
}
```

### 2.3 City Detection from Coordinates

**src/lib/cityDetection.ts**
```typescript
import { CITIES, CityConfig } from './cities';

// Haversine distance in km
function haversineDistance(
  [lon1, lat1]: [number, number],
  [lon2, lat2]: [number, number]
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearest city within threshold (default 100km)
export function detectCityFromCoords(
  coords: [number, number],
  maxDistance = 100
): CityConfig | null {
  let nearest: CityConfig | null = null;
  let minDistance = Infinity;

  for (const city of CITIES) {
    const distance = haversineDistance(coords, city.center);
    if (distance < minDistance && distance <= maxDistance) {
      minDistance = distance;
      nearest = city;
    }
  }

  return nearest;
}
```

---

## Phase 3: Custom Hooks

### 3.1 Geolocation Hook

**src/hooks/useGeolocation.ts**
```typescript
import { useState, useCallback } from 'react';

interface GeolocationState {
  coords: [number, number] | null; // [lng, lat]
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    error: null,
    loading: false,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coords: [position.coords.longitude, position.coords.latitude],
          error: null,
          loading: false,
        });
      },
      (error) => {
        setState({
          coords: null,
          error: error.message,
          loading: false,
        });
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  return { ...state, requestLocation };
}
```

### 3.2 City Data Hook

**src/hooks/useCityData.ts**
```typescript
import { useState, useEffect } from 'react';
import { CityData } from '../lib/types';

interface UseCityDataResult {
  data: CityData | null;
  loading: boolean;
  error: string | null;
}

export function useCityData(citySlug: string | null): UseCityDataResult {
  const [data, setData] = useState<CityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!citySlug) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/data/${citySlug}.json`)
      .then(res => {
        if (!res.ok) throw new Error('City data not found');
        return res.json();
      })
      .then((json: CityData) => {
        // Filter out blocks without coordinates
        const validFeatures = json.features.filter(
          f => f.geometry.coordinates !== null
        );
        setData({ ...json, features: validFeatures });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [citySlug]);

  return { data, loading, error };
}
```

### 3.3 URL Params Hook

**src/hooks/useUrlParams.ts**
```typescript
import { useCallback } from 'react';

interface UrlParams {
  city?: string;
  date?: string;
  free?: string;  // "1" for free only
  block?: string;
}

export function useUrlParams() {
  const getParams = useCallback((): UrlParams => {
    const params = new URLSearchParams(window.location.search);
    return {
      city: params.get('city') || undefined,
      date: params.get('date') || undefined,
      free: params.get('free') || undefined,
      block: params.get('block') || undefined,
    };
  }, []);

  const setParams = useCallback((newParams: Partial<UrlParams>) => {
    const params = new URLSearchParams(window.location.search);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
  }, []);

  return { getParams, setParams };
}
```

---

## Phase 4: Components

### 4.1 Loading Spinner

**src/components/LoadingSpinner.tsx**
```typescript
export function LoadingSpinner({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-carnival-yellow border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
```

### 4.2 Landing Screen

**src/components/LandingScreen.tsx**
```typescript
import { LoadingSpinner } from './LoadingSpinner';

interface LandingScreenProps {
  onRequestLocation: () => void;
  onSelectCity: (slug: string) => void;
  loading: boolean;
  error: string | null;
  cities: Array<{ name: string; slug: string }>;
}

export function LandingScreen({
  onRequestLocation,
  onSelectCity,
  loading,
  error,
  cities,
}: LandingScreenProps) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-carnival-yellow to-carnival-green">
        <LoadingSpinner message="Detectando sua localização..." />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 p-6 bg-gradient-to-b from-carnival-yellow to-carnival-green">
      <h1 className="text-4xl font-bold text-white text-center drop-shadow-lg">
        CarnaMapa
      </h1>

      <button
        onClick={onRequestLocation}
        className="px-8 py-4 bg-white text-carnival-purple font-semibold text-lg rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        Clique aqui para ir para sua cidade
      </button>

      {error && (
        <div className="w-full max-w-sm">
          <p className="text-white text-center mb-4">
            Não conseguimos detectar sua cidade. Selecione abaixo:
          </p>
          <select
            onChange={(e) => onSelectCity(e.target.value)}
            className="w-full p-3 rounded-lg text-gray-800"
            defaultValue=""
          >
            <option value="" disabled>Escolha sua cidade</option>
            {cities.map(city => (
              <option key={city.slug} value={city.slug}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
```

### 4.3 City Selector (Header)

**src/components/CitySelector.tsx**
```typescript
interface CitySelectorProps {
  currentCity: string;
  cities: Array<{ name: string; slug: string }>;
  onChange: (slug: string) => void;
}

export function CitySelector({ currentCity, cities, onChange }: CitySelectorProps) {
  return (
    <div className="absolute top-4 left-4 z-10">
      <select
        value={currentCity}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2 bg-white rounded-lg shadow-md text-gray-800 font-medium"
      >
        {cities.map(city => (
          <option key={city.slug} value={city.slug}>
            {city.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### 4.4 Filter Drawer (Right-side Pull Tab)

**src/components/FilterDrawer.tsx**
```typescript
import { useState, useMemo } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';
import { FilterState, TimePeriod, TIME_PERIODS } from '../lib/types';

interface FilterDrawerProps {
  availableDates: string[];  // Array of YYYY-MM-DD strings with events
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function FilterDrawer({ availableDates, filters, onFiltersChange }: FilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Sort dates for calendar display
  const sortedDates = useMemo(() => [...availableDates].sort(), [availableDates]);

  // Get date range for calendar
  const dateRange = useMemo(() => {
    if (sortedDates.length === 0) return { start: new Date(), end: new Date() };
    return {
      start: parseISO(sortedDates[0]),
      end: parseISO(sortedDates[sortedDates.length - 1]),
    };
  }, [sortedDates]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const current = new Date(dateRange.start);
    while (current <= dateRange.end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [dateRange]);

  // Check if a date has events
  const hasEvents = (date: Date) => {
    return availableDates.some(d => isSameDay(parseISO(d), date));
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    onFiltersChange({ ...filters, selectedDate: dateStr });
  };

  // Handle clear date
  const handleClearDate = () => {
    onFiltersChange({ ...filters, selectedDate: null });
  };

  // Handle free only toggle
  const handleFreeOnlyChange = (checked: boolean) => {
    onFiltersChange({ ...filters, freeOnly: checked });
  };

  // Handle time period toggle (multi-select)
  const handleTimePeriodToggle = (period: TimePeriod) => {
    const current = filters.timePeriods;
    const newPeriods = current.includes(period)
      ? current.filter(p => p !== period)
      : [...current, period];
    onFiltersChange({ ...filters, timePeriods: newPeriods });
  };

  // Check if filters are active (for pull tab indicator)
  const hasActiveFilters = filters.selectedDate !== null || filters.freeOnly || filters.timePeriods.length > 0;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Pull Tab (always visible) */}
      <button
        onClick={() => setIsOpen(true)}
        className={clsx(
          'fixed right-0 top-1/2 -translate-y-1/2 z-50',
          'w-8 h-20 bg-white rounded-l-lg shadow-lg',
          'flex items-center justify-center',
          'transition-transform',
          isOpen && 'translate-x-full',
          hasActiveFilters && 'bg-carnival-purple'
        )}
      >
        <span className={clsx(
          'text-xl',
          hasActiveFilters ? 'text-white' : 'text-gray-600'
        )}>
          ☰
        </span>
        {hasActiveFilters && (
          <span className="absolute -top-1 -left-1 w-3 h-3 bg-carnival-yellow rounded-full" />
        )}
      </button>

      {/* Drawer Panel */}
      <div
        className={clsx(
          'fixed right-0 top-0 h-full w-72 bg-white shadow-xl z-50',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-60px)]">
          {/* Calendar Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700">Data</h3>
              {filters.selectedDate && (
                <button
                  onClick={handleClearDate}
                  className="text-sm text-carnival-purple hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Simple Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {/* Day headers */}
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                <div key={i} className="text-gray-400 font-medium py-1">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((date, i) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const isSelected = filters.selectedDate === dateStr;
                const isAvailable = hasEvents(date);

                return (
                  <button
                    key={i}
                    onClick={() => isAvailable && handleDateSelect(date)}
                    disabled={!isAvailable}
                    className={clsx(
                      'py-2 rounded-lg text-sm transition-colors',
                      isSelected && 'bg-carnival-purple text-white',
                      !isSelected && isAvailable && 'bg-carnival-yellow/20 text-gray-900 hover:bg-carnival-yellow/40',
                      !isAvailable && 'text-gray-300 cursor-not-allowed'
                    )}
                  >
                    {format(date, 'd')}
                  </button>
                );
              })}
            </div>

            {/* Selected date display */}
            {filters.selectedDate && (
              <p className="mt-2 text-sm text-carnival-purple font-medium capitalize">
                {format(parseISO(filters.selectedDate), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
            )}
          </div>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Time Period Multi-Select */}
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Horário</h3>
            <div className="flex gap-2">
              {(Object.keys(TIME_PERIODS) as TimePeriod[]).map(period => {
                const isSelected = filters.timePeriods.includes(period);
                return (
                  <button
                    key={period}
                    onClick={() => handleTimePeriodToggle(period)}
                    className={clsx(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                      isSelected
                        ? 'bg-carnival-purple text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {TIME_PERIODS[period].label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Selecione um ou mais horários
            </p>
          </div>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Free Only Checkbox */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.freeOnly}
              onChange={(e) => handleFreeOnlyChange(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-carnival-purple focus:ring-carnival-purple"
            />
            <span className="text-gray-700 font-medium">Só gratuitos</span>
          </label>

          {/* Active filters summary */}
          {hasActiveFilters && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">
                Filtros ativos: {[
                  filters.selectedDate && 'Data',
                  filters.timePeriods.length > 0 && `Horário (${filters.timePeriods.length})`,
                  filters.freeOnly && 'Gratuitos'
                ].filter(Boolean).join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

### 4.5 Block Detail Modal

**src/components/BlockDetailModal.tsx**
```typescript
import { BlockFeature } from '../lib/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BlockDetailModalProps {
  block: BlockFeature;
  onClose: () => void;
}

export function BlockDetailModal({ block, onClose }: BlockDetailModalProps) {
  const { properties: p, geometry } = block;
  const dateFormatted = format(parseISO(p.date), "EEEE, d 'de' MMMM", { locale: ptBR });

  const handleGetDirections = () => {
    if (geometry.coordinates) {
      const [lng, lat] = geometry.coordinates;
      // Opens in Google Maps on mobile, or web
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        '_blank'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full sm:w-96 sm:rounded-xl rounded-t-xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-start">
          <h2 className="text-xl font-bold text-gray-900 pr-8">{p.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-gray-700">
            <span className="text-lg">📅</span>
            <span className="capitalize">{dateFormatted}</span>
            <span className="text-carnival-purple font-semibold">{p.time}</span>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 text-gray-700">
            <span className="text-lg">📍</span>
            <div>
              <p className="font-medium">{p.neighborhood}</p>
              {p.address && <p className="text-sm text-gray-500">{p.address}</p>}
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg">🎟️</span>
            {p.is_free ? (
              <span className="text-green-600 font-medium">Gratuito</span>
            ) : (
              <span className="text-gray-700">{p.price_formatted || `R$ ${p.price}`}</span>
            )}
          </div>

          {/* Description */}
          {p.description && (
            <p className="text-gray-600 text-sm">{p.description}</p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-4">
            <button
              onClick={handleGetDirections}
              className="w-full py-3 bg-carnival-blue text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              Obter direções
            </button>

            <a
              href={p.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-lg text-center hover:bg-gray-200 transition-colors"
            >
              Ver no blocosderua.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 4.6 Map Component (Clean UI - No Controls)

**src/components/Map.tsx**
```typescript
import { useEffect, useRef } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { CityData, BlockFeature } from '../lib/types';

interface MapProps {
  cityCenter: [number, number];
  data: CityData;
  filteredFeatures: BlockFeature[];
  onSelectBlock: (block: BlockFeature) => void;
}

export function Map({ cityCenter, data, filteredFeatures, onSelectBlock }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const markersRef = useRef<maptilersdk.Marker[]>([]);

  // Initialize map with NO CONTROLS for clean UI
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: maptilersdk.MapStyle.STREETS,
      center: cityCenter,
      zoom: 12,
      // Disable all navigation controls for clean UI
      navigationControl: false,
      geolocateControl: false,
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update center when city changes
  useEffect(() => {
    if (map.current) {
      map.current.flyTo({ center: cityCenter, zoom: 12 });
    }
  }, [cityCenter]);

  // Update markers when filtered data changes
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    filteredFeatures.forEach(feature => {
      if (!feature.geometry.coordinates) return;

      const marker = new maptilersdk.Marker({ color: '#8A2BE2' })
        .setLngLat(feature.geometry.coordinates)
        .addTo(map.current!);

      marker.getElement().addEventListener('click', () => {
        onSelectBlock(feature);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers if there are any
    if (filteredFeatures.length > 0) {
      const bounds = new maptilersdk.LngLatBounds();
      filteredFeatures.forEach(f => {
        if (f.geometry.coordinates) {
          bounds.extend(f.geometry.coordinates);
        }
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
  }, [filteredFeatures, onSelectBlock]);

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
}
```

---

## Phase 5: Main App Component

**src/App.tsx**
```typescript
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Map } from './components/Map';
import { FilterDrawer } from './components/FilterDrawer';
import { BlockDetailModal } from './components/BlockDetailModal';
import { CitySelector } from './components/CitySelector';
import { LandingScreen } from './components/LandingScreen';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useGeolocation } from './hooks/useGeolocation';
import { useCityData } from './hooks/useCityData';
import { useUrlParams } from './hooks/useUrlParams';
import { CITIES, getCityBySlug } from './lib/cities';
import { detectCityFromCoords } from './lib/cityDetection';
import { BlockFeature, AppView, FilterState, TimePeriod, TIME_PERIODS } from './lib/types';

// Helper to check if a time falls within a period
function isTimeInPeriod(time: string, period: TimePeriod): boolean {
  const [hours] = time.split(':').map(Number);
  const { start, end } = TIME_PERIODS[period];

  if (period === 'noite') {
    // Noite wraps around midnight (18:00 - 05:59)
    return hours >= start || hours < end;
  }
  return hours >= start && hours < end;
}

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [citySlug, setCitySlug] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    selectedDate: null,
    freeOnly: false,
    timePeriods: [],
  });
  const [selectedBlock, setSelectedBlock] = useState<BlockFeature | null>(null);

  const { coords, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();
  const { data: cityData, loading: dataLoading, error: dataError } = useCityData(citySlug);
  const { getParams, setParams } = useUrlParams();

  // Check URL params on mount
  useEffect(() => {
    const params = getParams();
    if (params.city && getCityBySlug(params.city)) {
      setCitySlug(params.city);
      setView('map');

      // Restore filters from URL
      setFilters(prev => ({
        ...prev,
        selectedDate: params.date || null,
        freeOnly: params.free === '1',
      }));
    }
  }, []);

  // Handle geolocation result
  useEffect(() => {
    if (coords) {
      const detectedCity = detectCityFromCoords(coords);
      if (detectedCity) {
        setCitySlug(detectedCity.slug);
        setParams({ city: detectedCity.slug });
        setView('map');
      }
    }
  }, [coords, setParams]);

  // Handle city change
  const handleCityChange = useCallback((slug: string) => {
    setCitySlug(slug);
    setParams({ city: slug, date: undefined, free: undefined });
    setFilters({ selectedDate: null, freeOnly: false, timePeriods: [] });
    setSelectedBlock(null);
    setView('map');
  }, [setParams]);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setParams({
      date: newFilters.selectedDate || undefined,
      free: newFilters.freeOnly ? '1' : undefined,
    });
  }, [setParams]);

  // Get unique dates from data
  const availableDates = useMemo(() => {
    if (!cityData) return [];
    const dates = new Set(cityData.features.map(f => f.properties.date));
    return Array.from(dates);
  }, [cityData]);

  // Filter features by all active filters
  const filteredFeatures = useMemo(() => {
    if (!cityData) return [];

    return cityData.features.filter(feature => {
      const { properties } = feature;

      // Date filter
      if (filters.selectedDate && properties.date !== filters.selectedDate) {
        return false;
      }

      // Free only filter
      if (filters.freeOnly && !properties.is_free) {
        return false;
      }

      // Time period filter (if any selected)
      if (filters.timePeriods.length > 0) {
        const matchesPeriod = filters.timePeriods.some(period =>
          isTimeInPeriod(properties.time, period)
        );
        if (!matchesPeriod) return false;
      }

      return true;
    });
  }, [cityData, filters]);

  // Get current city config
  const currentCity = citySlug ? getCityBySlug(citySlug) : null;

  // Landing screen
  if (view === 'landing') {
    return (
      <LandingScreen
        onRequestLocation={requestLocation}
        onSelectCity={handleCityChange}
        loading={geoLoading}
        error={geoError}
        cities={CITIES}
      />
    );
  }

  // Loading city data
  if (dataLoading || !cityData || !currentCity) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner message="Carregando blocos..." />
      </div>
    );
  }

  // Error loading data
  if (dataError) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-red-500">Erro ao carregar dados: {dataError}</p>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* City selector */}
      <CitySelector
        currentCity={citySlug!}
        cities={CITIES}
        onChange={handleCityChange}
      />

      {/* Map (clean UI - no controls) */}
      <Map
        cityCenter={currentCity.center}
        data={cityData}
        filteredFeatures={filteredFeatures}
        onSelectBlock={setSelectedBlock}
      />

      {/* Filter drawer (right-side pull tab) */}
      <FilterDrawer
        availableDates={availableDates}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Block detail modal */}
      {selectedBlock && (
        <BlockDetailModal
          block={selectedBlock}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  );
}
```

---

## Phase 6: Entry Point

**src/main.tsx**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**index.html**
```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Mapa interativo dos blocos de carnaval do Brasil" />
    <title>CarnaMapa - Blocos de Carnaval</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## Phase 7: Build & Deploy

### 7.1 Build for Production

```bash
cd frontend
pnpm build
```

This generates a `dist/` folder with static files.

### 7.2 Deploy to Railway

1. Connect GitHub repo to Railway
2. Set root directory to `frontend`
3. Add environment variable: `VITE_MAPTILER_API_KEY`
4. Railway auto-detects Vite and builds

**Or use Railway CLI:**
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

---

## Implementation Checklist

### Phase 1: Setup
- [x] Initialize Vite project
- [x] Install dependencies (MapTiler, Tailwind, date-fns, clsx)
- [x] Configure Tailwind with carnival colors
- [x] Set up environment variables
- [x] Copy GeoJSON data files to public/data/

### Phase 2: Core
- [x] Create TypeScript types (types.ts)
- [x] Create city configuration (cities.ts)
- [x] Create city detection logic (cityDetection.ts)

### Phase 3: Hooks
- [x] Implement useGeolocation hook
- [x] Implement useCityData hook
- [x] Implement useUrlParams hook

### Phase 4: Components
- [x] Build LoadingSpinner component
- [x] Build LandingScreen component
- [x] Build CitySelector component
- [x] Build FilterDrawer component (right-side pull tab with calendar, time periods, free-only)
- [x] Build BlockDetailModal component
- [x] Update Map component (disable navigation controls for clean UI)

### Phase 5: Integration
- [x] Wire up App.tsx with all components
- [ ] Test geolocation flow
- [ ] Test city switching
- [ ] Test date filtering
- [ ] Test block detail modal
- [ ] Test URL parameters

### Phase 6: Polish
- [ ] Mobile responsive testing
- [x] Loading states
- [x] Error handling
- [ ] Performance optimization

### Phase 7: Deploy
- [x] Build production bundle
- [ ] Deploy to Railway
- [ ] Configure custom domain
- [ ] Test production deployment

---

## Notes

- All components use functional React with hooks
- State is managed locally (no Redux/Zustand needed for this scope)
- URL params enable deep linking and sharing (city, date, free filters)
- MapTiler SDK handles map rendering and markers (controls disabled for clean UI)
- date-fns provides locale-aware date formatting
- Tailwind handles all styling with custom carnival colors

## UI Changes Summary

### Map (Clean UI)
- All navigation controls disabled (no +/-, no compass, no geolocate button)
- Users interact via pinch-to-zoom and drag/scroll only
- Cleaner, more immersive mobile experience

### Filter Drawer (replaces bottom date bar)
- Right-side pull tab that slides out on tap
- Calendar picker for date selection
- Time period multi-select: Manhã (6-12), Tarde (12-18), Noite (18-6)
- "Só gratuitos" checkbox for free events only
- Visual indicator (dot) on pull tab when filters are active
- Semi-transparent backdrop when open
