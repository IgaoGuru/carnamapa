import clsx from 'clsx';
import type { TimePeriod } from '../lib/types';
import { TIME_PERIODS } from '../lib/types';

interface TimePeriodSelectorProps {
  selected: TimePeriod[];
  onChange: (periods: TimePeriod[]) => void;
}

export function TimePeriodSelector({ selected, onChange }: TimePeriodSelectorProps) {
  const handleToggle = (period: TimePeriod) => {
    const newSelected = selected.includes(period)
      ? selected.filter(p => p !== period)
      : [...selected, period];
    onChange(newSelected);
  };

  const periods = Object.keys(TIME_PERIODS) as TimePeriod[];

  return (
    <div className="flex bg-white/80 rounded-full p-1 shadow-md">
      {periods.map((period, index) => {
        const isSelected = selected.includes(period);
        return (
          <button
            key={period}
            onClick={() => handleToggle(period)}
            className={clsx(
              'px-4 py-1.5 text-sm font-medium transition-colors',
              index === 0 && 'rounded-l-full',
              index === periods.length - 1 && 'rounded-r-full',
              isSelected
                ? 'bg-carnival-purple text-white'
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
