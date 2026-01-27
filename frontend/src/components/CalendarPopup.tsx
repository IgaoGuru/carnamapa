import { useMemo } from 'react';
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

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
  // Determine which month to show (first available date or selected date)
  const displayMonth = useMemo(() => {
    if (selectedDate) return parseISO(selectedDate);
    if (availableDates.length > 0) return parseISO(availableDates[0]);
    return new Date();
  }, [selectedDate, availableDates]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(displayMonth);
    const monthEnd = endOfMonth(displayMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);

    const days: Date[] = [];
    let current = calStart;
    while (current <= calEnd) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  }, [displayMonth]);

  // Check if date has events
  const hasEvents = (date: Date) => {
    return availableDates.some(d => isSameDay(parseISO(d), date));
  };

  // Check if date is in current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === displayMonth.getMonth();
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
            {format(displayMonth, 'MMMM yyyy', { locale: ptBR })}
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
            const inMonth = isCurrentMonth(date);

            return (
              <button
                key={i}
                onClick={() => isAvailable && handleSelect(date)}
                disabled={!isAvailable}
                className={clsx(
                  'py-2 rounded-lg transition-colors',
                  !inMonth && 'opacity-30',
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
