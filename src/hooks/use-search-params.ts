'use client';

import { useSearchParams as useNextSearchParams } from 'next/navigation';

type Params = Record<string, boolean | number | string | null>;

let timeout: ReturnType<typeof setTimeout>;
const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  return (...args: Parameters<T>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

export const useSearchParams = <T extends Params>() => {
  const searchParams = useNextSearchParams();

  const setSearchParams = debounce((newParams: T) => {
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
  }, 500);

  return [Object.fromEntries(searchParams.entries()), setSearchParams] as const;
};
