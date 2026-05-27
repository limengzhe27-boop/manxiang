'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { PanelArt } from './PanelArt';
import { apiFetch } from '@/lib/identity';

type Seed = {
  id: string;
  title: string;
  desc: string;
  tag?: string;
  art: string;
};

/** 优先用 AI 生成的图 (public/seeds/{id}.png), 404 时回退到 PanelArt SVG */
function SeedArt({ seed }: { seed: Seed }) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return <PanelArt kind={seed.art} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/seeds/${seed.id}.png`}
      alt={seed.title}
      onError={() => setErrored(true)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block'
      }}
      loading="lazy"
    />
  );
}

export function SeedCard({ seed, index }: { seed: Seed; index: number }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const start = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await apiFetch('/api/stories', {
        method: 'POST',
        body: JSON.stringify({ seed: seed.desc })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '创建失败');
      router.push(`/create?storyId=${data.storyId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建故事失败，请重试');
      setCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: 0.04 * (index % 8), ease: [0.2, 0.8, 0.2, 1] }}
      className="h-full"
    >
      <button
        type="button"
        onClick={start}
        disabled={creating}
        aria-busy={creating}
        className="seed-card-link group relative flex h-full w-full flex-col text-left overflow-hidden rounded-md border-[1.5px] border-ink bg-surface disabled:cursor-wait"
        style={{ minHeight: 268, transition: 'all 0.2s ease' }}
        onMouseEnter={(e) => {
          if (creating) return;
          const el = e.currentTarget as HTMLElement;
          el.style.transform = 'translateY(-4px)';
          el.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = 'translateY(0)';
          el.style.boxShadow = 'none';
        }}
      >
        {/* ===== 顶部插画背景 (优先 AI 图, fallback SVG) ===== */}
        <div className="relative aspect-[3/2] w-full overflow-hidden border-b-[1.5px] border-ink shrink-0 bg-surface-alt">
          <SeedArt seed={seed} />
          {/* 顶部渐变遮罩 让左上编号更清晰 */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
            style={{ background: 'linear-gradient(to bottom, rgba(250,246,238,0.92), transparent)' }}
          />
          {/* 编号 */}
          <span className="absolute left-3 top-2.5 font-mono text-[11px] font-bold tracking-widest text-red">
            {String(index + 1).padStart(2, '0')}
          </span>
          {/* 右上 hover 箭头 / loading */}
          <span className="absolute right-3 top-2.5 text-ink-tertiary transition-colors group-hover:text-red">
            {creating ? (
              <Loader2 size={16} strokeWidth={1.8} className="animate-spin text-red" />
            ) : (
              <ArrowUpRight size={16} strokeWidth={1.8} />
            )}
          </span>
          {/* 分类标签 */}
          {seed.tag && (
            <span
              className="absolute left-3 bottom-2.5 inline-flex items-center px-2 py-0.5 rounded-sm border border-ink bg-bg text-[10px] font-sans font-medium uppercase tracking-wider text-ink"
              style={{ letterSpacing: '0.08em' }}
            >
              {seed.tag}
            </span>
          )}
        </div>

        {/* ===== 下半部 标题 + 描述 ===== */}
        <div className="flex flex-col flex-1 p-4">
          <h3 className="mb-2 font-serif text-[17px] font-bold leading-tight text-ink line-clamp-1">
            {seed.title}
          </h3>
          <p
            className="font-serif text-[13px] leading-[1.65] text-ink-secondary flex-1"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {seed.desc}
          </p>
        </div>

        {/* 右下翻页角标 */}
        <span
          className="seed-fold pointer-events-none absolute bottom-0 right-0 transition-all duration-300 ease-manga group-hover:[width:32px] group-hover:[height:32px]"
          style={{
            width: 20,
            height: 20,
            background: 'linear-gradient(135deg, transparent 50%, var(--surface-alt) 50%)',
            borderTop: '1px solid var(--border-soft)',
            borderLeft: '1px solid var(--border-soft)'
          }}
        />
      </button>
    </motion.div>
  );
}
