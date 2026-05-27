import { Suspense } from 'react';
import { SeedsView } from './SeedsView';

export default function SeedsPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[60vh] place-items-center font-serif text-ink-secondary">
          加载种子库…
        </div>
      }
    >
      <SeedsView />
    </Suspense>
  );
}
