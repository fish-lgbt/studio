'use client';
import dynamic from 'next/dynamic';

const ShowcaseStudio = dynamic(() => import('@/components/beta').then((mod) => ({ default: mod.ShowcaseStudio })), {
  ssr: false,
});

export default function Page() {
  return (
    <main className="flex flex-col gap-2">
      <ShowcaseStudio />
    </main>
  );
}
