import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

interface DateSelectorProps {
  dates: string[]; // Array of YYYY-MM-DD strings
  selectedDate: string | null; // null means "all dates"
  onSelectDate: (date: string | null) => void;
}

export function DateSelector({ dates, selectedDate, onSelectDate }: DateSelectorProps) {
  const sortedDates = useMemo(() => {
    return [...dates].sort();
  }, [dates]);

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
      <div className="flex overflow-x-auto gap-2 p-4 scrollbar-hide">
        <button
          onClick={() => onSelectDate(null)}
          className={clsx(
            'shrink-0 px-4 py-2 rounded-full font-medium transition-colors',
            selectedDate === null
              ? 'bg-carnival-purple text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          Todos os dias
        </button>

        {sortedDates.map(date => {
          const parsed = parseISO(date);
          const dayNum = format(parsed, 'd');
          const dayName = format(parsed, 'EEE', { locale: ptBR });

          return (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              className={clsx(
                'shrink-0 px-4 py-2 rounded-full font-medium transition-colors',
                selectedDate === date
                  ? 'bg-carnival-purple text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <span className="capitalize">{dayName}</span> {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}
