'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
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
  const userId = localStorage.getItem('anonId') ?? crypto.randomUUID();
  return { id: userId };
};

const posthogApiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export default function PostHogPageView(): null {
  const { id: userId } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const consent = useConsent();
  const prevConsent = usePrevious(consent);

  // Create posthog instance
  useEffect(() => {
    // Don't create a posthog instance if the API key is not set
    if (!posthogApiKey) return;

    // If the user has accepted consent create a posthog instance
    if (consent === 'accepted') {
      // Start posthog
      posthog.init(posthogApiKey, {
        api_host: '/ingest',
        persistence: 'cookie',
      });
    }
  }, [consent, prevConsent, userId]);

  // Track pageviews
  useEffect(() => {
    if (pathname && posthog) {
      const url = window.origin + pathname;
      posthog.capture('$pageview', {
        $current_url: searchParams ? `${url}?${searchParams.toString()}` : url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}
