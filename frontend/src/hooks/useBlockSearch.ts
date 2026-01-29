import { useMemo } from 'react';
import type { BlockFeature } from '../lib/types';

// Normalize text for accent-insensitive, case-insensitive comparison
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Decode HTML entities (e.g., &amp; -> &)
function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export interface SearchResult {
  block: BlockFeature;
  matchType: 'name' | 'neighborhood';
}

export function useBlockSearch(
  blocks: BlockFeature[],
  query: string,
  maxResults: number = 10
): SearchResult[] {
  return useMemo(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || blocks.length === 0) {
      return [];
    }

    const normalizedQuery = normalizeText(trimmedQuery);
    const nameMatches: SearchResult[] = [];
    const neighborhoodMatches: SearchResult[] = [];

    for (const block of blocks) {
      const normalizedName = normalizeText(decodeHtmlEntities(block.properties.name));
      const normalizedNeighborhood = normalizeText(block.properties.neighborhood);

      // Check name match first (higher priority)
      if (normalizedName.includes(normalizedQuery)) {
        nameMatches.push({ block, matchType: 'name' });
      } else if (normalizedNeighborhood.includes(normalizedQuery)) {
        // Only add as neighborhood match if not already a name match
        neighborhoodMatches.push({ block, matchType: 'neighborhood' });
      }
    }

    // Combine results: name matches first, then neighborhood matches
    const results = [...nameMatches, ...neighborhoodMatches];

    // Limit to maxResults
    return results.slice(0, maxResults);
  }, [blocks, query, maxResults]);
}
