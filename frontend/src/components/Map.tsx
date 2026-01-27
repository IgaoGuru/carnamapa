import { useEffect, useRef } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import type { BlockFeature } from '../lib/types';

interface MapProps {
  cityCenter: [number, number];
  filteredFeatures: BlockFeature[];
  onSelectBlock: (block: BlockFeature) => void;
}

export function Map({ cityCenter, filteredFeatures, onSelectBlock }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const markersRef = useRef<maptilersdk.Marker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
    if (!apiKey) {
      console.error('MapTiler API key is not configured');
      return;
    }

    maptilersdk.config.apiKey = apiKey;

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
