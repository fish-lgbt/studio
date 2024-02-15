'use client';
import { Button } from '@/components/button';
import { useConsent } from '@/hooks/use-consent';
import dynamic from 'next/dynamic';
import Head from 'next/head';

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
  const newUIEnabled = true;
  const consent = useConsent();

  // Wait for the feature flag to load
  if (newUIEnabled === undefined) {
    // If they havent accepted tracking then they dont have access to the feature
    if (consent === 'denied') return <AccessDeniedToFeature />;

    // If the feature flag is still loading show a loading message
    return <Loading />;
  }

  // If the user doesnt have access to the feature render a message
  if (!newUIEnabled) return <AccessDeniedToFeature />;

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
