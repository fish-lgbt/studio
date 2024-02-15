'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { ReactElement, cloneElement, useEffect, useRef, useState } from 'react';
import { useConsent } from '@/hooks/use-consent';
import { Button } from '@/components/button';
import { useLogger } from 'next-axiom';

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

const Loading = () => {
  return <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">Loading...</div>;
};

type ConsentPromptProps = {
  children: React.ReactNode;
};

type PromptProps = {
  title: string;
  onAccept: () => void;
  onDecline: () => void;
};

const Prompt = ({ title, onAccept, onDecline }: PromptProps) => {
  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#171717] p-4 rounded-md">
      <div className="flex flex-col gap-2">
        <h1>{title}</h1>
        <div className="flex flex-row gap-2">
          <Button onClick={onAccept}>Yes</Button>
          <Button onClick={onDecline}>No</Button>
        </div>
      </div>
    </div>
  );
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
      <Prompt
        title="Are you in the EU?"
        onAccept={() => {
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
        onDecline={() => {
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
      />
    );
  }

  // If we have showPrompt render the prompt
  if (showTrackingPrompt) {
    return (
      <Prompt
        title="Do you want to be tracked for analytics?"
        onAccept={() => {
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
        onDecline={() => {
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
      />
    );
  }

  return <>{children}</>;
};

type UserInfo = {
  userId?: string;
};
const userInfo: UserInfo = {};
const useAxiom = () => {
  const logger = useLogger({
    source: 'frontend',
  });

  return {
    identify(userId: string) {
      userInfo.userId = userId;
    },
    capture(event: string, properties: Record<string, string | number>) {
      if (!userInfo.userId) return;

      logger.info(event, {
        user: {
          id: userInfo.userId,
        },
        ...properties,
      });
    },
  };
};

type TrackingProps = {
  children: React.ReactNode;
};

export default function Tracking({ children }: TrackingProps) {
  const { id: userId } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const consent = useConsent();
  const prevConsent = usePrevious(consent);
  const axiom = useAxiom();

  // Identify the user
  useEffect(() => {
    // Wait for the user to accept tracking
    if (consent !== 'accepted') return;

    // Wait for the user id to be set
    if (!userId) return;

    // Identify the user
    axiom.identify(userId);
  }, [axiom, consent, prevConsent, userId]);

  // Track pageviews
  useEffect(() => {
    // Don't track pageviews on the first render
    if (!pathname) return;

    // Wait for the user to accept tracking
    if (consent !== 'accepted') return;

    const url = window.origin + pathname;
    const properties = {
      current_url: searchParams ? `${url}?${searchParams.toString()}` : url,
      user_agent: window.navigator.userAgent,
      browser_language: window.navigator.language,
      referrer: document.referrer,
      screen_height: window.screen.height,
      screen_width: window.screen.width,
    };

    // Track the pageview
    axiom.capture('pageview', properties);

    return () => {
      // Track the page leave
      axiom.capture('pageleave', properties);
    };
  }, [axiom, consent, pathname, searchParams]);

  return <ConsentPrompt>{children}</ConsentPrompt>;
}

type TrackClicksProps = {
  children: React.ReactNode;
};

export const TrackClicks = ({ children }: TrackClicksProps) => {
  const axiom = useAxiom();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    // Capture the click event if the element has an id
    if (event.currentTarget.id) {
      axiom.capture('click', {
        id: event.currentTarget.id,
      });
    }

    // Call the original onClick event
    (children as ReactElement<any>).props.onClick?.(event);
  };

  return cloneElement(children as ReactElement, { onClick: handleClick });
};
