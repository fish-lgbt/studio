import { cn } from '@/cn';
import { useLongPress } from '@/hooks/use-long-press';
import { useEffect, useRef } from 'react';

type ButtonProps = JSX.IntrinsicElements['button'] & {
  active?: boolean;
  onLongPress?: () => void;
  longPressDuration?: number;
};

export const Button = ({ active, className, onLongPress, longPressDuration = 500, onClick, ...props }: ButtonProps) => {
  const baseStyles = 'border rounded px-2 active:scale-95 w-fit';
  const disabledStyles = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100';
  const lightStyles = 'bg-white text-black border-[#e4e4e7] hover:bg-[#f1f1f3] hover:border-[#e4e4e7]';
  const darkStyles =
    'dark:bg-[#111214] dark:text-white dark:border-[#222327] hover:dark:bg-[#222327] hover:dark:border-[#111214]';
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!onLongPress) {
      return;
    }
    return () => {
      if (interval.current) {
        clearInterval(interval.current);
      }
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, [onLongPress]);

  return (
    <button
      className={cn(
        baseStyles,
        disabledStyles,
        lightStyles,
        darkStyles,
        {
          'bg-[#f1f1f3] border-[#e4e4e7]': active,
          'dark:bg-[#222327] dark:border-[#111214]': active,
        },
        className,
      )}
      onMouseDown={(e) => {
        if (!onLongPress) {
          return;
        }
        e.preventDefault();
        interval.current = setInterval(() => {
          onLongPress?.();
        }, longPressDuration);
      }}
      onMouseUp={(e) => {
        if (!onLongPress) {
          return;
        }

        e.preventDefault();
        if (interval.current) {
          clearInterval(interval.current);
        }
        if (timeout.current) {
          clearTimeout(timeout.current);
        }
        interval.current = null;
        timeout.current = null;
      }}
      onClick={(e) => {
        if (!onLongPress) {
          onClick?.(e);
          return;
        }

        e.preventDefault();

        // Wait the duration if it wasnt triggered then it was a click
        timeout.current = setTimeout(() => {
          if (!interval.current) {
            return;
          }

          onClick?.(e);
        }, longPressDuration);
      }}
      {...props}
    />
  );
};
