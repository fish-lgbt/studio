'use client';

import posthog from 'posthog-js';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useConsent } from '@/hooks/use-consent';
import { Button } from '@/components/button';

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

const Loading = () => {
  return <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">Loading...</div>;
};

type ConsentPromptProps = {
  children: React.ReactNode;
};

const ConsentPrompt = ({ children }: ConsentPromptProps) => {
  const [showEUPrompt, setShowEuPrompt] = useState<boolean | null>(null);
  const [showTrackingPrompt, setShowPrompt] = useState<boolean | null>(null);
  const consent = useConsent();

  // Show user a prompt asking if they want to be tracked for analytics
  useEffect(() => {
    const isEU = localStorage.getItem('isEU');
    setShowEuPrompt(isEU === null);

    const userId = localStorage.getItem('userId');
    setShowPrompt(!['accepted', 'denied'].includes(String(consent)) && userId === null);
  }, [consent]);

  // Wait for local storage to load
  if (showEUPrompt === null || showTrackingPrompt === null) return <Loading />;

  // If we have showEuPrompt render the prompt
  if (showEUPrompt) {
    return (
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#171717] p-4 rounded-md">
        <div className="flex flex-col gap-2">
          <h1>Are you in the EU?</h1>
          <div className="flex flex-row gap-2">
            <Button
              onClick={() => {
                // Set the isEU flag to true
                localStorage.setItem('isEU', 'true');
                window.dispatchEvent(
                  new StorageEvent('storage', {
                    key: 'isEU',
                    oldValue: null,
                    newValue: 'true',
                  }),
                );

                // Disable tracking
                localStorage.setItem('consent', 'denied');
                window.dispatchEvent(
                  new StorageEvent('storage', {
                    key: 'consent',
                    oldValue: null,
                    newValue: 'denied',
                  }),
                );

                // Hide the prompts
                setShowEuPrompt(false);
                setShowPrompt(false);
              }}
            >
              Yes
            </Button>
            <Button
              onClick={() => {
                // Set the isEU flag to false
                localStorage.setItem('isEU', 'false');
                window.dispatchEvent(
                  new StorageEvent('storage', {
                    key: 'isEU',
                    oldValue: null,
                    newValue: 'false',
                  }),
                );

                // Hide the prompt
                setShowEuPrompt(false);
              }}
            >
              No
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If we have showPrompt render the prompt
  if (showTrackingPrompt) {
    return (
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#171717] p-4 rounded-md">
        <div className="flex flex-col gap-2">
          <h1>Do you want to be tracked for analytics?</h1>
          <div className="flex flex-row gap-2">
            <Button
              onClick={() => {
                localStorage.setItem('userId', crypto.randomUUID());
                localStorage.setItem('consent', 'accepted');
                window.dispatchEvent(
                  new StorageEvent('storage', {
                    key: 'consent',
                    oldValue: null,
                    newValue: 'accepted',
                  }),
                );
                setShowPrompt(false);
              }}
            >
              Yes
            </Button>
            <Button
              onClick={() => {
                localStorage.setItem('consent', 'denied');
                window.dispatchEvent(
                  new StorageEvent('storage', {
                    key: 'consent',
                    oldValue: null,
                    newValue: 'denied',
                  }),
                );
                setShowPrompt(false);
              }}
            >
              No
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

type PostHogPageViewProps = {
  children: React.ReactNode;
};

export default function PostHogTracking({ children }: PostHogPageViewProps) {
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
          bootstrap: {
            distinctID: userId ?? undefined,
          },
        });

        // Mark posthog as initialised
        setPosthogInitalised(true);
        return;
      }

      // Set the user id
      if (userId) {
        posthog.identify(userId);
      }
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

  return <ConsentPrompt>{children}</ConsentPrompt>;
}
