import { Suspense } from 'react';
import { ScreenshotTool } from '../components/screenshot-tool';

export default function Home() {
  return (
    <main className="flex flex-col gap-2">
      <Suspense>
        <ScreenshotTool />
      </Suspense>
    </main>
  );
}
