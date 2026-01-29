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
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce the query (~200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(value);
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

  // Handle escape key to close dropdown
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  }, []);

  // Handle result selection
  const handleResultClick = (result: SearchResult) => {
    onSelectResult(result);
    onChange(''); // Clear search input
    setIsFocused(false);
  };

  return (
    <div
      ref={containerRef}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4 sm:px-0 sm:left-40 sm:translate-x-0"
    >
      <div className="relative">
        {/* Search icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg
            className="w-5 h-5"
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
          className={`w-full pl-10 pr-10 py-2 bg-white shadow-md text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-carnival-purple ${
            showDropdown ? 'rounded-t-lg' : 'rounded-lg'
          }`}
        />

        {/* Clear button (only when there's text) */}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Limpar busca"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Dropdown with search results */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 bg-white rounded-b-lg shadow-md max-h-80 overflow-y-auto border-t border-gray-100">
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Nenhum bloco encontrado
              </div>
            ) : (
              <ul className="py-1">
                {searchResults.map((result) => {
                  const { block } = result;
                  const { properties: p } = block;
                  const blockName = decodeHtmlEntities(p.name);
                  const dateFormatted = format(parseISO(p.date), "EEE, d 'de' MMM", { locale: ptBR });

                  return (
                    <li key={block.id}>
                      <button
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors"
                        onClick={() => handleResultClick(result)}
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
