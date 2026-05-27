import Link from 'next/link';
import clsx from 'clsx';

export function StampLogo({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <Link href="/" className={clsx('inline-flex items-center gap-2.5 select-none', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        aria-label="漫想"
        className="shrink-0"
      >
        <rect x="2" y="2" width="36" height="36" rx="3" stroke="var(--red)" strokeWidth="2.5" />
        <rect x="2" y="2" width="36" height="36" rx="3" stroke="var(--ink)" strokeWidth="0.5" />
        <text
          x="20"
          y="26"
          textAnchor="middle"
          fontFamily="var(--font-serif), Noto Serif SC, serif"
          fontSize="20"
          fontWeight="900"
          fill="var(--red)"
        >
          漫
        </text>
      </svg>
      <span className="font-serif text-[22px] font-bold tracking-wide text-ink leading-none">漫想</span>
    </Link>
  );
}
