import { useState, useMemo } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';
import type { FilterState, TimePeriod } from '../lib/types';
import { TIME_PERIODS } from '../lib/types';

interface FilterDrawerProps {
  availableDates: string[];  // Array of YYYY-MM-DD strings with events
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function FilterDrawer({ availableDates, filters, onFiltersChange }: FilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Sort dates for calendar display
  const sortedDates = useMemo(() => [...availableDates].sort(), [availableDates]);

  // Get date range for calendar (capped at March 1st)
  const dateRange = useMemo(() => {
    if (sortedDates.length === 0) return { start: new Date(), end: new Date() };
    const start = parseISO(sortedDates[0]);
    const lastDate = parseISO(sortedDates[sortedDates.length - 1]);
    // Cap the calendar at March 1st of the same year as the start date
    const march1st = new Date(start.getFullYear(), 2, 1); // Month is 0-indexed, so 2 = March
    const end = lastDate > march1st ? march1st : lastDate;
    return { start, end };
  }, [sortedDates]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const current = new Date(dateRange.start);
    while (current <= dateRange.end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [dateRange]);

  // Check if a date has events
  const hasEvents = (date: Date) => {
    return availableDates.some(d => isSameDay(parseISO(d), date));
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    onFiltersChange({ ...filters, selectedDate: dateStr });
  };

  // Handle clear date
  const handleClearDate = () => {
    onFiltersChange({ ...filters, selectedDate: null });
  };

  // Handle free only toggle
  const handleFreeOnlyChange = (checked: boolean) => {
    onFiltersChange({ ...filters, freeOnly: checked });
  };

  // Handle time period toggle (multi-select)
  const handleTimePeriodToggle = (period: TimePeriod) => {
    const current = filters.timePeriods;
    const newPeriods = current.includes(period)
      ? current.filter(p => p !== period)
      : [...current, period];
    onFiltersChange({ ...filters, timePeriods: newPeriods });
  };

  // Check if filters are active (for pull tab indicator)
  const hasActiveFilters = filters.selectedDate !== null || filters.freeOnly || filters.timePeriods.length > 0;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Pull Tab (always visible) */}
      <button
        onClick={() => setIsOpen(true)}
        className={clsx(
          'fixed right-0 top-1/2 -translate-y-1/2 z-50',
          'w-8 h-20 bg-white rounded-l-lg shadow-lg',
          'flex items-center justify-center',
          'transition-transform',
          isOpen && 'translate-x-full',
          hasActiveFilters && 'bg-carnival-purple'
        )}
      >
        <span className={clsx(
          'text-xl',
          hasActiveFilters ? 'text-white' : 'text-gray-600'
        )}>
          {'\u2630'}
        </span>
        {hasActiveFilters && (
          <span className="absolute -top-1 -left-1 w-3 h-3 bg-carnival-yellow rounded-full" />
        )}
      </button>

      {/* Drawer Panel */}
      <div
        className={clsx(
          'fixed right-0 top-0 h-full w-72 bg-white shadow-xl z-50',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-60px)]">
          {/* Calendar Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700">Data</h3>
              {filters.selectedDate && (
                <button
                  onClick={handleClearDate}
                  className="text-sm text-carnival-purple hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Simple Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {/* Day headers */}
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                <div key={i} className="text-gray-400 font-medium py-1">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((date, i) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const isSelected = filters.selectedDate === dateStr;
                const isAvailable = hasEvents(date);

                return (
                  <button
                    key={i}
                    onClick={() => isAvailable && handleDateSelect(date)}
                    disabled={!isAvailable}
                    className={clsx(
                      'py-2 rounded-lg text-sm transition-colors',
                      isSelected && 'bg-carnival-purple text-white',
                      !isSelected && isAvailable && 'bg-carnival-yellow/20 text-gray-900 hover:bg-carnival-yellow/40',
                      !isAvailable && 'text-gray-300 cursor-not-allowed'
                    )}
                  >
                    {format(date, 'd')}
                  </button>
                );
              })}
            </div>

            {/* Selected date display */}
            {filters.selectedDate && (
              <p className="mt-2 text-sm text-carnival-purple font-medium capitalize">
                {format(parseISO(filters.selectedDate), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
            )}
          </div>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Time Period Multi-Select */}
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Horario</h3>
            <div className="flex gap-2">
              {(Object.keys(TIME_PERIODS) as TimePeriod[]).map(period => {
                const isSelected = filters.timePeriods.includes(period);
                return (
                  <button
                    key={period}
                    onClick={() => handleTimePeriodToggle(period)}
                    className={clsx(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                      isSelected
                        ? 'bg-carnival-purple text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {TIME_PERIODS[period].label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Selecione um ou mais horarios
            </p>
          </div>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Free Only Checkbox */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.freeOnly}
              onChange={(e) => handleFreeOnlyChange(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-carnival-purple focus:ring-carnival-purple"
            />
            <span className="text-gray-700 font-medium">So gratuitos</span>
          </label>

          {/* Active filters summary */}
          {hasActiveFilters && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">
                Filtros ativos: {[
                  filters.selectedDate && 'Data',
                  filters.timePeriods.length > 0 && `Horario (${filters.timePeriods.length})`,
                  filters.freeOnly && 'Gratuitos'
                ].filter(Boolean).join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
