import { useMemo } from 'react';
import { format, parseISO, isSameDay, startOfWeek, endOfWeek, addDays } from 'date-fns';
import clsx from 'clsx';

// Fixed carnival date range: Feb 1 to Mar 1, 2026
const CARNIVAL_START = new Date(2026, 1, 1); // Feb 1, 2026
const CARNIVAL_END = new Date(2026, 2, 1);   // Mar 1, 2026

interface CalendarPopupProps {
  selectedDate: string | null;
  availableDates: string[];
  onSelectDate: (date: string | null) => void;
  onClose: () => void;
}

export function CalendarPopup({
  selectedDate,
  availableDates,
  onSelectDate,
  onClose,
}: CalendarPopupProps) {

  // Generate calendar grid for Feb 1 to Mar 1
  const calendarDays = useMemo(() => {
    const calStart = startOfWeek(CARNIVAL_START);
    const calEnd = endOfWeek(CARNIVAL_END);

    const days: Date[] = [];
    let current = calStart;
    while (current <= calEnd) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  }, []);

  // Check if date has events
  const hasEvents = (date: Date) => {
    return availableDates.some(d => isSameDay(parseISO(d), date));
  };

  // Check if date is within carnival range (Feb 1 to Mar 1)
  const isInRange = (date: Date) => {
    return date >= CARNIVAL_START && date <= CARNIVAL_END;
  };

  const handleSelect = (date: Date) => {
    onSelectDate(format(date, 'yyyy-MM-dd'));
    onClose();
  };

  const handleClear = () => {
    onSelectDate(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Calendar */}
      <div className="relative bg-white rounded-xl p-4 shadow-xl w-80">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 capitalize">
            Carnaval 2026
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
            aria-label="Fechar"
          >
            &times;
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
            <div key={i} className="text-gray-400 font-medium py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {calendarDays.map((date, i) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const isSelected = selectedDate === dateStr;
            const isAvailable = hasEvents(date);
            const inRange = isInRange(date);

            return (
              <button
                key={i}
                onClick={() => isAvailable && handleSelect(date)}
                disabled={!isAvailable}
                className={clsx(
                  'py-2 rounded-lg transition-colors',
                  !inRange && 'opacity-30',
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

        {/* Clear button */}
        <button
          onClick={handleClear}
          className="w-full mt-4 py-2 text-carnival-purple font-medium hover:bg-gray-50 rounded-lg transition-colors"
        >
          Todos os dias
        </button>
      </div>
    </div>
  );
}
