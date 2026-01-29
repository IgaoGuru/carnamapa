import clsx from 'clsx';
import type { TimePeriod } from '../lib/types';
import { TIME_PERIODS } from '../lib/types';

interface TimePeriodSelectorProps {
  selected: TimePeriod | null;
  onChange: (period: TimePeriod | null) => void;
}

export function TimePeriodSelector({ selected, onChange }: TimePeriodSelectorProps) {
  const handleToggle = (period: TimePeriod) => {
    // If already selected, deselect (back to null/show all)
    // Otherwise, select this one
    onChange(selected === period ? null : period);
  };

  const periods = Object.keys(TIME_PERIODS) as TimePeriod[];

  return (
    <div className="flex bg-white/80 rounded-full shadow-md w-[200px]">
      {periods.map((period, index) => {
        const isSelected = selected === period;
        return (
          <button
            key={period}
            onClick={() => handleToggle(period)}
            className={clsx(
              'flex-1 py-1.5 text-xs font-medium transition-colors',
              index === 0 && 'rounded-l-full',
              index === periods.length - 1 && 'rounded-r-full',
              isSelected
                ? 'bg-carnival-red text-white'
                : 'text-gray-700 hover:bg-white/50'
            )}
          >
            {TIME_PERIODS[period].label}
          </button>
        );
      })}
    </div>
  );
}
