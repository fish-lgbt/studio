'use client';
import { Button } from '@/components/button';
import { useConsent } from '@/hooks/use-consent';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useEffect, useState } from 'react';

const Studio = dynamic(() => import('@/components/studio').then((mod) => ({ default: mod.Studio })), {
  ssr: false,
});

const Loading = () => {
  return <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">Loading...</div>;
};

const AccessDeniedToFeature = () => (
  <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#171717] p-4 rounded-md">
    <h1>You do not have access to this feature</h1>
  </div>
);

export default function Page() {
  const [showEUPrompt, setShowEuPrompt] = useState<boolean | null>(null);
  const [showTrackingPrompt, setShowPrompt] = useState<boolean | null>(null);
  const betaEnabled = useFeatureFlagEnabled('beta');
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

  // Wait for the feature flag to load
  if (betaEnabled === undefined) {
    // If they havent accepted tracking then they dont have access to the feature
    if (consent === 'denied') return <AccessDeniedToFeature />;

    // If the feature flag is still loading show a loading message
    return <Loading />;
  }

  // If the user doesnt have access to the feature render a message
  if (!betaEnabled) return <AccessDeniedToFeature />;

  return (
    <>
      <Head>
        <style>{`
          /* Disable scrolling */
          html,
          body {
            margin: 0;
            height: 100%;
            overflow: hidden;
          }
  
          body:not(canvas) {
            touch-action: none;
          }
  
          /* Disable text selection */
          body {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
        `}</style>
      </Head>
      <main className="flex flex-col gap-2">
        <Studio />
      </main>
    </>
  );
}
