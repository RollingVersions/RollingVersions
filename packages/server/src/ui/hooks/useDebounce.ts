import {useState, useEffect} from 'react';

export default function useDebounce<T>(value: T, milliseconds: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(value);
    }, milliseconds);
    return () => clearTimeout(timeout);
  }, [value]);
  return debounced;
}
