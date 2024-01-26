'use client';

import { useSearchParams as useNextSearchParams } from 'next/navigation';

type Params = Record<string, boolean | number | string | null>;

export const useSearchParams = <T extends Params>() => {
  const searchParams = useNextSearchParams();

  const setSearchParams = (newParams: T) => {
    const search = window ? window.location.search : '';
    const params = new URLSearchParams(search);

    for (const [key, value] of Object.entries(newParams)) {
      if (value === null) {
        params.delete(key);
        continue;
      }

      params.set(key, String(value));
    }

    const newLocation = `${window.location.pathname}?${params.toString()}`;
    if (newLocation !== window.location.href) {
      window.history.pushState({}, '', newLocation);
    }
  };

  return [Object.fromEntries(searchParams.entries()), setSearchParams] as const;
};
