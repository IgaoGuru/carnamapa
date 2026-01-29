import { useState, useMemo } from 'react';
import clsx from 'clsx';
import { DateSelector } from './DateSelector';
import { CalendarPopup } from './CalendarPopup';
import { TimePeriodSelector } from './TimePeriodSelector';
import { BlockSearch } from './BlockSearch';
import { useRsvpContext } from '../contexts/RsvpContext';
import type { FilterState } from '../lib/types';
import type { SearchResult } from '../hooks/useBlockSearch';

// Fixed carnival date range
const CARNIVAL_START = '2026-02-01';
const CARNIVAL_END = '2026-03-01';

interface FilterBarProps {
  availableDates: string[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onMeusBlocosClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResults: SearchResult[];
  onSearchResultSelect: (result: SearchResult) => void;
}

export function FilterBar({
  availableDates,
  filters,
  onFiltersChange,
  onMeusBlocosClick,
  searchQuery,
  onSearchChange,
  searchResults,
  onSearchResultSelect,
}: FilterBarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { rsvpEventIds } = useRsvpContext();

  // Sort dates and filter to carnival range (Feb 1 - Mar 1)
  const sortedDates = useMemo(() => {
    return [...availableDates]
      .filter(date => date >= CARNIVAL_START && date <= CARNIVAL_END)
      .sort();
  }, [availableDates]);

  const handleDateChange = (date: string | null) => {
    onFiltersChange({ ...filters, selectedDate: date });
  };

  const handleTimePeriodChange = (period: typeof filters.timePeriod) => {
    onFiltersChange({ ...filters, timePeriod: period });
  };

  const handleFreeOnlyChange = (checked: boolean) => {
    onFiltersChange({ ...filters, freeOnly: checked });
  };

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-6 space-y-2">
        {/* Row 1: Search bar */}
        <BlockSearch
          value={searchQuery}
          onChange={onSearchChange}
          searchResults={searchResults}
          onSelectResult={onSearchResultSelect}
        />

        {/* Row 2: Date Selector + Meus Blocos */}
        <div className="flex items-center justify-between">
          <DateSelector
            selectedDate={filters.selectedDate}
            availableDates={sortedDates}
            onDateChange={handleDateChange}
            onOpenCalendar={() => setCalendarOpen(true)}
          />
          <button
            onClick={onMeusBlocosClick}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors shadow-md whitespace-nowrap bg-white/80 text-gray-700 hover:bg-white"
          >
            Meus Blocos ({rsvpEventIds.size})
          </button>
        </div>

        {/* Row 3: Time Period + Só Gratuitos */}
        <div className="flex items-center justify-between">
          <TimePeriodSelector
            selected={filters.timePeriod}
            onChange={handleTimePeriodChange}
          />
          <label className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 shadow-md cursor-pointer">
            <span className="text-xs font-medium text-gray-700">Só gratuitos</span>
            <button
              role="switch"
              aria-checked={filters.freeOnly}
              onClick={() => handleFreeOnlyChange(!filters.freeOnly)}
              className={clsx(
                'relative w-9 h-5 rounded-full transition-colors',
                filters.freeOnly ? 'bg-carnival-red' : 'bg-gray-300'
              )}
            >
              <span
                className={clsx(
                  'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                  filters.freeOnly && 'translate-x-4'
                )}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Calendar Popup */}
      {calendarOpen && (
        <CalendarPopup
          selectedDate={filters.selectedDate}
          availableDates={sortedDates}
          onSelectDate={handleDateChange}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </>
  );
}
