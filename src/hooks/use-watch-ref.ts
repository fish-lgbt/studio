import { useState, useRef, useEffect } from 'react';

export const useWatchRef = <T>(ref: React.MutableRefObject<T>, interval: number = 100) => {
  const [isDirty, setIsDirty] = useState(false);
  const previousRef = useRef<T>(ref.current);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Anything more frequent than 10ms caused the hook to stop working for me
  if (interval < 10) throw new Error('Interval must be at least 10ms, this is to prevent performance issues');

  // Every $interval ms we should check if the ref has changed
  // If it has, we should set the dirty state to true
  // This will cause the component to re-render
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      previousRef.current = ref.current;
      setIsDirty(true);
    }, interval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [ref, interval]);

  // Reset the dirty state
  useEffect(() => {
    if (isDirty) {
      setIsDirty(false);
    }
  }, [isDirty]);
};
