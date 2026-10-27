import { format, addDays, isToday, isSameDay, parseISO } from 'date-fns';
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
    <div className="mb-8 -mx-8 px-8 overflow-x-auto scrollbar-hide" ref={scrollRef}>
      <div className="flex gap-2 pb-2">
        {dates.map((date) => {
          const dateString = format(date, 'yyyy-MM-dd');
          const isSelected = isSameDay(date, selectedDateObj);
          const isTodayDate = isToday(date);

          return (
            <button
              key={dateString}
              data-selected={isSelected}
              onClick={() => onDateSelect(dateString)}
              className={`
                flex-shrink-0 flex flex-col items-center justify-center 
                w-16 h-20 rounded-xl transition-all duration-300
                ${isSelected 
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black shadow-sm' 
                  : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                }
              `}
            >
              <span className={`text-[28px] font-light tracking-tight leading-none ${
                isSelected ? 'text-white dark:text-black' : 'text-foreground'
              }`}>
                {format(date, 'd')}
              </span>
              <span className="text-[11px] font-medium mt-1 uppercase tracking-wide">
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