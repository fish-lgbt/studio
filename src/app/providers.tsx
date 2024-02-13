'use client';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

type PHProviderProps = {
  children: React.ReactNode;
};

export function PHProvider({ children }: PHProviderProps) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
