import { useState, useEffect } from 'react';

/**
 * A custom hook that debounces a rapidly changing value.
 * @param value The value to be debounced (e.g., totalWeight).
 * @param delay The debounce delay in milliseconds (e.g., 500).
 * @returns The value after it has stopped changing for the specified delay.
 */
export function useDebounce<T>(value: T, delay: number): T {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer that will update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // This is the cleanup function. It will clear the timer if the `value`
    // changes before the delay has passed. This is what makes debouncing work.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Re-run the effect only if the value or delay changes

  return debouncedValue;
}