import {useState, useEffect} from 'react';

export default function useChanges(fn: () => void, watch: unknown[]) {
  const [isFirstCall, setIsFirstCall] = useState(true);
  useEffect(() => {
    if (isFirstCall) {
      setIsFirstCall(false);
    } else {
      fn();
    }
  }, watch);
}
