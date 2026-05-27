'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Save, Share2 } from 'lucide-react';
import clsx from 'clsx';
import { StampLogo } from './StampLogo';

type TopbarProps = {
  /** 创作页用 wide 容器 */
  wide?: boolean;
  /** 创作页右侧多一组「暂存 / 导出」按钮 */
  rightSlot?: React.ReactNode;
};

export function Topbar({ wide, rightSlot }: TopbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '/', label: '首页' },
    { href: '/seeds', label: '故事种子' },
    { href: '/library', label: '我的故事书' }
  ];

  return (
    <header
      className={clsx(
        'sticky top-0 z-50 backdrop-blur-md transition-[border-color] duration-200',
        'border-b',
        scrolled ? 'border-ink' : 'border-border-soft'
      )}
      style={{ background: 'rgba(var(--bg-rgb), 0.92)' }}
    >
      <div
        className={clsx(
          'mx-auto flex h-16 items-center justify-between px-5 md:px-8',
          wide ? 'max-w-wide' : 'max-w-container'
        )}
      >
        <div className="flex items-center gap-8">
          <StampLogo />
          <nav className="hidden md:flex items-center gap-7">
            {links.map((l) => {
              const active = pathname === l.href || (l.href === '/library' && pathname.startsWith('/library'));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(
                    'group relative py-2 text-sm font-medium transition-colors',
                    active ? 'text-red' : 'text-ink-secondary hover:text-ink'
                  )}
                >
                  {l.label}
                  <span
                    className={clsx(
                      'absolute left-0 bottom-0 h-[2px] bg-red transition-[width] duration-200',
                      active ? 'w-full' : 'w-0 group-hover:w-full'
                    )}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {rightSlot}
          <Link
            href="/settings"
            aria-label="设置"
            className="grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-ink bg-surface transition-colors hover:bg-ink hover:text-bg"
          >
            <span className="font-serif text-[15px] font-bold">漫</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

/** 创作页顶栏右侧按钮组 */
export function CreateTopbarActions({
  onSave,
  onExport
}: {
  onSave?: () => void;
  onExport?: () => void;
}) {
  return (
    <div className="hidden md:flex items-center gap-2">
      <button
        onClick={onSave}
        className="inline-flex items-center gap-1.5 rounded border-[1.5px] border-ink bg-surface px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-bg"
      >
        <Save size={15} />
        暂存
      </button>
      <button
        onClick={onExport}
        className="inline-flex items-center gap-1.5 rounded border-[1.5px] border-ink bg-red px-3 py-2 text-sm font-medium text-ink-on-red transition-transform hover:-translate-y-0.5"
        style={{ boxShadow: '3px 3px 0 0 var(--ink)' }}
      >
        <Share2 size={15} />
        导出长图
      </button>
    </div>
  );
}
