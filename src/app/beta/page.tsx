'use client';
import { Button } from '@/components/button';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const ShowcaseStudio = dynamic(() => import('@/components/beta').then((mod) => ({ default: mod.ShowcaseStudio })), {
  ssr: false,
});

const Loading = () => {
  return <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">Loading...</div>;
};

export default function Page() {
  const [showPrompt, setShowPrompt] = useState<boolean | null>(null);

  // Show user a prompt asking if they want to be tracked for analytics
  useEffect(() => {
    const trackThem = localStorage.getItem('track-them');
    setShowPrompt(trackThem === null);

    // Track local storage changes
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === 'track-them') {
        setShowPrompt(true);
      }
    };
    window.addEventListener('storage', onStorageChange);
  }, []);

  // If we havent set showPrompt dont render anything
  if (showPrompt === null) return <Loading />;

  // If we have showPrompt render the prompt
  if (showPrompt) {
    return (
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#171717] p-4 rounded-md">
        <div className="flex flex-col gap-2">
          <h1>Do you want to be tracked for analytics?</h1>
          <div className="flex flex-row gap-2">
            <Button
              onClick={() => {
                localStorage.setItem('track-them', 'yes');
                setShowPrompt(false);
              }}
            >
              Yes
            </Button>
            <Button
              onClick={() => {
                localStorage.setItem('track-them', 'no');
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

  return (
    <main className="flex flex-col gap-2">
      <ShowcaseStudio />
    </main>
  );
}
