'use client';
import { Suspense } from 'react';
import { ScreenshotTool } from '../components/screenshot-tool';

export default function Page() {
  return (
    <main className="flex flex-col gap-2">
      <Suspense>
        <ScreenshotTool />
      </Suspense>
    </main>
  );
}
