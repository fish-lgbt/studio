'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import posthog from 'posthog-js';
import { useConsent } from '@/hooks/use-consent';

const usePrevious = <T extends unknown>(value: T | null) => {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
};

const useAuth = () => {
  const [userId, setUserId] = useState<string | null>(null);

  // Watch for changes in the user id
  useEffect(() => {
    setUserId(localStorage.getItem('userId'));

    const onChange = (event: StorageEvent) => {
      if (event.key === 'userId') {
        setUserId(event.newValue);
      }
    };

    window.addEventListener('storage', onChange);
    return () => window.removeEventListener('storage', onChange);
  }, []);

  return { id: userId };
};

const posthogApiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export default function PostHogPageView(): null {
  const { id: userId } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const consent = useConsent();
  const prevConsent = usePrevious(consent);
  const [posthogInitalised, setPosthogInitalised] = useState<boolean>(false);

  // Create posthog instance
  useEffect(() => {
    // Don't create a posthog instance if the API key is not set
    if (!posthogApiKey) return;

    // If the user has accepted consent create a posthog instance
    if (consent === 'accepted') {
      // Start posthog
      if (!posthogInitalised) {
        posthog.init(posthogApiKey, {
          api_host: '/ingest',
          persistence: 'cookie',
        });
      }

      // Set the user id
      if (userId) {
        posthog.identify(userId);
      }

      // Mark posthog as initialised
      setPosthogInitalised(true);
    }
  }, [consent, posthogInitalised, prevConsent, userId]);

  // Track pageviews
  useEffect(() => {
    if (!posthogInitalised) return;
    if (!pathname) return;
    if (!posthog) return;
    if (consent !== 'accepted') return;

    const url = window.origin + pathname;
    posthog.capture('$pageview', {
      $current_url: searchParams ? `${url}?${searchParams.toString()}` : url,
    });
  }, [consent, pathname, posthogInitalised, searchParams]);

  return null;
}
