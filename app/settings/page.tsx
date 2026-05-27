import { Suspense } from 'react';
import { SettingsView } from './SettingsView';

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] grid place-items-center text-ink-secondary">加载中…</div>}>
      <SettingsView />
    </Suspense>
  );
}
