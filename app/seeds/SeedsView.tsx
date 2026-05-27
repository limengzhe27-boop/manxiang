'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shuffle } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { Footer } from '@/components/Footer';
import { SeedCard } from '@/components/SeedCard';
import { Reveal } from '@/components/Reveal';
import { SEEDS, SEED_CATEGORIES, filterSeedsByCategory } from '@/lib/mock';

export function SeedsView() {
  const params = useSearchParams();
  const initialCategory = (params.get('category') as string) || 'all';
  const highlight = params.get('highlight');

  const [seedCategory, setSeedCategory] = useState<string>(initialCategory);
  const filtered = useMemo(() => filterSeedsByCategory(SEEDS, seedCategory), [seedCategory]);

  // 进入页面自动滚到高亮的卡片
  useEffect(() => {
    if (!highlight) return;
    setTimeout(() => {
      const el = document.querySelector(`[data-seed-id="${highlight}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.classList.add('seed-flash');
      setTimeout(() => el?.classList.remove('seed-flash'), 1400);
    }, 300);
  }, [highlight]);

  const pickRandomSeed = () => {
    const pool = filtered.length > 0 ? filtered : SEEDS;
    const s = pool[Math.floor(Math.random() * pool.length)];
    const el = document.querySelector(`[data-seed-id="${s.id}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.classList.add('seed-flash');
    setTimeout(() => el?.classList.remove('seed-flash'), 1400);
  };

  // 每个分类的种子计数
  const categoryCounts = useMemo(() => {
    const m: Record<string, number> = { all: SEEDS.length };
    SEEDS.forEach((s) => {
      m[s.category] = (m[s.category] ?? 0) + 1;
    });
    return m;
  }, []);

  return (
    <>
      <Topbar />

      <main className="container-page pt-8 md:pt-10 pb-20">
        {/* 标题 */}
        <div>
          <span className="eyebrow">SEED LIBRARY · 故事种子库</span>
          <h1 className="mt-2 font-serif font-black text-[36px] md:text-[48px] leading-tight tracking-tight text-ink">
            从一颗<span className="stamp-word">种子</span>开始
          </h1>
          <p className="mt-4 font-serif text-[15px] text-ink-secondary max-w-2xl">
            共 <span className="font-bold text-ink">{SEEDS.length}</span> 颗种子 · {SEED_CATEGORIES.length - 1} 大类 ·
            点开任意一颗，AI 就能为你写出独一无二的第一话。
          </p>
        </div>

        {/* Tab + 随机 */}
        <div className="mt-8 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {SEED_CATEGORIES.map((c) => {
              const count = categoryCounts[c.key] ?? 0;
              return (
                <button
                  key={c.key}
                  onClick={() => setSeedCategory(c.key)}
                  className={`px-3.5 py-1.5 rounded-full border-[1.5px] text-[13px] font-sans font-medium transition-all ${
                    seedCategory === c.key
                      ? 'border-ink bg-ink text-bg'
                      : 'border-border-soft text-ink-secondary hover:border-ink hover:text-ink'
                  }`}
                >
                  {c.label}
                  <span
                    className={`ml-1.5 font-mono text-[11px] ${
                      seedCategory === c.key ? 'text-bg/70' : 'text-ink-tertiary'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={pickRandomSeed}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-[1.5px] border-red bg-red-soft text-[13px] font-sans font-medium text-red transition-colors hover:bg-red hover:text-bg"
          >
            <Shuffle size={13} strokeWidth={2.2} />
            随机一颗
          </button>
        </div>

        {/* 网格 */}
        <div className="mt-8 grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-stretch">
          {filtered.map((seed, i) => (
            <Reveal key={seed.id} delay={0.02 * (i % 8)} className="h-full">
              <div data-seed-id={seed.id} className="h-full">
                <SeedCard seed={seed} index={i} />
              </div>
            </Reveal>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="grid place-items-center py-20 text-center">
            <p className="font-serif text-[18px] text-ink-tertiary">这个分类下还没有种子。</p>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
