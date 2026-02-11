import { useState, useEffect } from "react";

export function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      return (
        localStorage.getItem(key) ||
        sessionStorage.getItem(key) ||
        initialValue
      );
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      if (state === null || state === undefined) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } else {
        localStorage.setItem(key, state);
        sessionStorage.setItem(key, state);
      }
    } catch {
      // silently fail
    }
  }, [key, state]);

  return [state, setState];
}
