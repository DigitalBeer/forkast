"use client";

import { useState, useEffect } from 'react';

/**
 * A simple hook to determine if the component has been hydrated on the client.
 * This is useful for preventing SSR hydration mismatches when using client-side state,
 * such as state persisted in localStorage.
 * 
 * @returns {boolean} - Returns true after the component has mounted, false otherwise.
 */
export const useHydration = () => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
};
