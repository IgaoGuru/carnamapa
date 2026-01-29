import { useState, useMemo } from 'react';
import clsx from 'clsx';
import { DateSelector } from './DateSelector';
import { CalendarPopup } from './CalendarPopup';
import { TimePeriodSelector } from './TimePeriodSelector';
import { useRsvpContext } from '../contexts/RsvpContext';
import type { FilterState } from '../lib/types';

// Fixed carnival date range
const CARNIVAL_START = '2026-02-01';
const CARNIVAL_END = '2026-03-01';

interface FilterBarProps {
  availableDates: string[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onMeusBlocosClick: () => void;
}

export function FilterBar({ availableDates, filters, onFiltersChange, onMeusBlocosClick }: FilterBarProps) {
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

        {/* Layer 2: Time Period + Meus Blocos + Free Only */}
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <TimePeriodSelector
            selected={filters.timePeriod}
            onChange={handleTimePeriodChange}
          />

          <div className="flex items-center gap-2">
            <button
              onClick={onMeusBlocosClick}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-md whitespace-nowrap bg-white/80 text-gray-700 hover:bg-white"
            >
              Meus Blocos ({rsvpEventIds.size})
            </button>

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
