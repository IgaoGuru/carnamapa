import { useState, useEffect, useMemo, useCallback } from 'react';
import { Map } from './components/Map';
import { FilterBar } from './components/FilterBar';
import { BlockDetailModal } from './components/BlockDetailModal';
import { InfoModal } from './components/InfoModal';
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
    timePeriod: null,
  });
  const [selectedBlock, setSelectedBlock] = useState<BlockFeature | null>(null);
  const [showInfo, setShowInfo] = useState(false);

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
    setFilters({ selectedDate: null, freeOnly: false, timePeriod: null });
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

      // Time period filter (if one is selected)
      if (filters.timePeriod !== null) {
        if (!isTimeInPeriod(properties.time, filters.timePeriod)) {
          return false;
        }
      }

      return true;
    });
  }, [cityData, filters]);

  // Get current city config
  const currentCity = citySlug ? getCityBySlug(citySlug) : null;

  // Info button component (shared across views)
  const InfoButton = (
    <button
      onClick={() => setShowInfo(true)}
      className="fixed top-4 right-4 z-40 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:shadow-lg transition-all"
      aria-label="Informações"
    >
      ?
    </button>
  );

  // Landing screen
  if (view === 'landing') {
    return (
      <>
        {InfoButton}
        <LandingScreen
          onRequestLocation={requestLocation}
          onSelectCity={handleCityChange}
          loading={geoLoading}
          error={geoError}
          cities={CITIES}
        />
        {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      </>
    );
  }

  // Loading city data
  if (dataLoading || !cityData || !currentCity) {
    return (
      <>
        {InfoButton}
        <div className="h-full flex items-center justify-center">
          <LoadingSpinner message="Carregando blocos..." />
        </div>
        {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      </>
    );
  }

  // Error loading data
  if (dataError) {
    return (
      <>
        {InfoButton}
        <div className="h-full flex items-center justify-center">
          <p className="text-red-500">Erro ao carregar dados: {dataError}</p>
        </div>
        {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      </>
    );
  }

  return (
    <div className="h-full relative">
      {/* Info button */}
      {InfoButton}

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

      {/* Filter bar (bottom of screen) */}
      <FilterBar
        availableDates={availableDates}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onMeusBlocosClick={() => {/* TODO: Open Meus Blocos modal (US-004) */}}
      />

      {/* Block detail modal */}
      {selectedBlock && (
        <BlockDetailModal
          block={selectedBlock}
          onClose={() => setSelectedBlock(null)}
        />
      )}

      {/* Info modal */}
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </div>
  );
}
