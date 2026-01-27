import { useState, useMemo } from 'react';
import clsx from 'clsx';
import { DateSelector } from './DateSelector';
import { CalendarPopup } from './CalendarPopup';
import { TimePeriodSelector } from './TimePeriodSelector';
import type { FilterState } from '../lib/types';

interface FilterBarProps {
  availableDates: string[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function FilterBar({ availableDates, filters, onFiltersChange }: FilterBarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Sort dates
  const sortedDates = useMemo(() => [...availableDates].sort(), [availableDates]);

  const handleDateChange = (date: string | null) => {
    onFiltersChange({ ...filters, selectedDate: date });
  };

  const handleTimePeriodsChange = (periods: typeof filters.timePeriods) => {
    onFiltersChange({ ...filters, timePeriods: periods });
  };

  const handleFreeOnlyChange = (checked: boolean) => {
    onFiltersChange({ ...filters, freeOnly: checked });
  };

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 z-10">
        {/* Layer 1: Date Selector */}
        <div className="px-4 py-3">
          <DateSelector
            selectedDate={filters.selectedDate}
            availableDates={sortedDates}
            onDateChange={handleDateChange}
            onOpenCalendar={() => setCalendarOpen(true)}
          />
        </div>

        {/* Layer 2: Time Period + Free Only */}
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <TimePeriodSelector
            selected={filters.timePeriods}
            onChange={handleTimePeriodsChange}
          />

          <button
            onClick={() => handleFreeOnlyChange(!filters.freeOnly)}
            className={clsx(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-md whitespace-nowrap',
              filters.freeOnly
                ? 'bg-carnival-purple text-white'
                : 'bg-white/80 text-gray-700 hover:bg-white'
            )}
          >
            Só gratuitos
          </button>
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
