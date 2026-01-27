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
import { isTimeInPeriod } from './lib/types';
import type { BlockFeature, AppView, FilterState } from './lib/types';

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
  }, [getParams]);

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
