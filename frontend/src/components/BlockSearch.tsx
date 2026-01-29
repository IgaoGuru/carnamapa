import { useState, useRef, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { SearchResult } from '../hooks/useBlockSearch';

interface BlockSearchProps {
  value: string;
  onChange: (query: string) => void;
  searchResults: SearchResult[];
  onSelectResult: (result: SearchResult) => void;
}

// Decode HTML entities in block names
function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export function BlockSearch({ value, onChange, searchResults, onSelectResult }: BlockSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(value);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce the query and reset selection (~200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
      setSelectedIndex(0); // Reset selection when query changes
    }, 200);
    return () => clearTimeout(timer);
  }, [value]);

  // Show dropdown when focused, has debounced query, and results available (or no results for empty message)
  const showDropdown = isFocused && debouncedQuery.trim().length > 0;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Handle result selection
  const handleResultClick = useCallback((result: SearchResult) => {
    onSelectResult(result);
    onChange(''); // Clear search input
    setIsFocused(false);
  }, [onSelectResult, onChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
      return;
    }

    // Only handle navigation when dropdown is visible and has results
    if (!showDropdown || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedResult = searchResults[selectedIndex];
      if (selectedResult) {
        handleResultClick(selectedResult);
      }
    }
  }, [showDropdown, searchResults, selectedIndex, handleResultClick]);

  return (
    <div
      ref={containerRef}
      className="relative w-[200px]"
    >
      <div className="relative w-full">
        {/* Search icon */}
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar bloco..."
          className={`w-full pl-8 pr-8 py-1.5 bg-white/80 shadow-md text-gray-800 text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-carnival-red ${
            showDropdown ? 'rounded-b-full' : 'rounded-full'
          }`}
        />

        {/* Clear button (only when there's text) */}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Limpar busca"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Dropdown with search results (opens upward) */}
        {showDropdown && (
          <div className="absolute bottom-full left-0 w-72 bg-white rounded-t-lg shadow-md max-h-80 overflow-y-auto border-b border-gray-100">
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Nenhum bloco encontrado
              </div>
            ) : (
              <ul className="py-1">
                {searchResults.map((result, index) => {
                  const { block } = result;
                  const { properties: p } = block;
                  const blockName = decodeHtmlEntities(p.name);
                  const dateFormatted = format(parseISO(p.date), "EEE, d 'de' MMM", { locale: ptBR });
                  const isSelected = index === selectedIndex;

                  return (
                    <li key={block.id}>
                      <button
                        type="button"
                        className={`w-full px-4 py-3 text-left transition-colors ${
                          isSelected ? 'bg-gray-100' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => handleResultClick(result)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <p className="font-medium text-gray-900">{blockName}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                          <span>{p.neighborhood}</span>
                          <span>•</span>
                          <span className="capitalize">{dateFormatted}</span>
                          <span>•</span>
                          <span>{p.time}</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
