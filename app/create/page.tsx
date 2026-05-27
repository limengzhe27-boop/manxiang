import { Suspense } from 'react';
import { CreateView } from './CreateView';

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[60vh] place-items-center font-serif text-ink-secondary">
          正在准备故事…
        </div>
      }
    >
      <CreateView />
    </Suspense>
  );
}
