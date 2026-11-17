import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { useRef, useEffect } from 'react';

interface DatePickerHorizontalProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  daysToShow?: number;
}

export function DatePickerHorizontal({ 
  selectedDate, 
  onDateSelect,
  daysToShow = 14 
}: DatePickerHorizontalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedDateObj = parseISO(selectedDate);

  // Generate array of dates
  const dates = Array.from({ length: daysToShow }, (_, i) => {
    const date = addDays(new Date(), i - Math.floor(daysToShow / 2));
    return date;
  });

  // Auto-scroll to selected date on mount
  useEffect(() => {
    if (scrollRef.current) {
      const selectedButton = scrollRef.current.querySelector('[data-selected="true"]');
      if (selectedButton) {
        selectedButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDate]);

  return (
    <div className="scrollbar-hide -mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0" ref={scrollRef}>
      <div className="flex gap-1.5 pb-1 sm:gap-2">
        {dates.map((date) => {
          const dateString = format(date, 'yyyy-MM-dd');
          const isSelected = isSameDay(date, selectedDateObj);

          return (
            <button
              key={dateString}
              data-selected={isSelected}
              onClick={() => onDateSelect(dateString)}
              className={`
                flex-shrink-0 flex flex-col items-center justify-center 
                h-14 w-12 rounded-lg transition-all duration-300 sm:h-16 sm:w-14
                ${isSelected 
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black shadow-sm' 
                  : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                }
              `}
            >
              <span className={`text-xl font-light tracking-tight sm:text-2xl ${
                isSelected ? 'text-white dark:text-black' : 'text-foreground'
              }`}>
                {format(date, 'd')}
              </span>
              <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide">
                {format(date, 'MMM')}
              </span>
            </button>
          );
        })}
      </div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}