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
    <div className="flex items-center justify-start gap-2">
      <button
        onClick={handlePrev}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-700 text-lg font-bold transition-colors shadow-md"
        aria-label="Data anterior"
      >
        &lt;
      </button>

      <button
        onClick={onOpenCalendar}
        className="px-6 py-2 bg-white rounded-full text-gray-800 font-medium min-w-[180px] hover:bg-gray-100 transition-colors shadow-md"
      >
        {displayText}
      </button>

      <button
        onClick={handleNext}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-700 text-lg font-bold transition-colors shadow-md"
        aria-label="Proxima data"
      >
        &gt;
      </button>
    </div>
  );
}
