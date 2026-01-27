import { useState, useMemo } from 'react';
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

          <label className="flex items-center gap-2 cursor-pointer bg-white/80 rounded-full px-4 py-2 shadow-md">
            <input
              type="checkbox"
              checked={filters.freeOnly}
              onChange={(e) => handleFreeOnlyChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-carnival-purple focus:ring-carnival-purple"
            />
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">So gratuitos</span>
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
