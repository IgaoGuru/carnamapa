import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateSelectorProps {
  selectedDate: string | null;  // YYYY-MM-DD or null for "all dates"
  availableDates: string[];     // Sorted array of available dates
  onDateChange: (date: string | null) => void;
  onOpenCalendar: () => void;
}

export function DateSelector({
  selectedDate,
  availableDates,
  onDateChange,
  onOpenCalendar,
}: DateSelectorProps) {
  // Get current index in available dates
  const currentIndex = selectedDate
    ? availableDates.indexOf(selectedDate)
    : -1;

  // Navigate to previous date
  const handlePrev = () => {
    if (currentIndex > 0) {
      onDateChange(availableDates[currentIndex - 1]);
    } else if (currentIndex === -1 && availableDates.length > 0) {
      // If "all dates", go to last date
      onDateChange(availableDates[availableDates.length - 1]);
    }
  };

  // Navigate to next date
  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < availableDates.length - 1) {
      onDateChange(availableDates[currentIndex + 1]);
    } else if (currentIndex === availableDates.length - 1) {
      // If at last date, go back to "all dates"
      onDateChange(null);
    } else if (currentIndex === -1 && availableDates.length > 0) {
      // If "all dates", go to first date
      onDateChange(availableDates[0]);
    }
  };

  // Format display text
  const displayText = selectedDate
    ? format(parseISO(selectedDate), "d 'de' MMMM", { locale: ptBR })
    : 'Todos os dias';

  return (
    <div className="inline-flex items-stretch rounded-full shadow-md overflow-hidden w-[200px]">
      <button
        onClick={handlePrev}
        className="w-7 flex items-center justify-center bg-gray-200/80 hover:bg-gray-300 text-gray-700 text-xs font-bold transition-colors"
        aria-label="Data anterior"
      >
        ‹
      </button>

      <button
        onClick={onOpenCalendar}
        className="flex-1 px-2 py-1.5 bg-white/80 text-gray-800 text-xs font-medium hover:bg-gray-50 transition-colors text-center"
      >
        {displayText}
      </button>

      <button
        onClick={handleNext}
        className="w-7 flex items-center justify-center bg-gray-200/80 hover:bg-gray-300 text-gray-700 text-xs font-bold transition-colors"
        aria-label="Proxima data"
      >
        ›
      </button>
    </div>
  );
}
