'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, BookOpen, Palette, Share2 } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { Footer } from '@/components/Footer';
import { Magnet } from '@/components/Magnet';
import { Reveal, StaggerSplit, ScrollFloat } from '@/components/Reveal';
import { SeedCard } from '@/components/SeedCard';
import { FloatingStamps } from '@/components/FloatingStamps';
import { HeroPreview } from '@/components/HeroPreview';
import { PanelArt } from '@/components/PanelArt';
import { SEEDS, SEED_CATEGORIES, filterSeedsByCategory, getHomepageSeeds } from '@/lib/mock';
import { FEATURED_STORIES } from '@/lib/showcase';
import { Shuffle, ArrowRight as ArrowRightIcon2 } from 'lucide-react';
import Link from 'next/link';
import { FeaturedPanelImage } from '@/components/FeaturedPanelImage';
import { apiFetch } from '@/lib/identity';

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [seedCategory, setSeedCategory] = useState<string>('all');
  // 首页固定展示 8 个 (跨分类), 用户切 tab 时筛选这 8 个
  const homepageSeeds = getHomepageSeeds(SEEDS);
  const displayedSeeds =
    seedCategory === 'all' ? homepageSeeds : filterSeedsByCategory(SEEDS, seedCategory);

  const pickRandomSeed = () => {
    // 随机从全库选, 不限于首页 8 个
    const s = SEEDS[Math.floor(Math.random() * SEEDS.length)];
    // 如果不在首页 8 个里, 直接跳全部种子页面再高亮
    if (!homepageSeeds.some((h) => h.id === s.id)) {
      router.push(`/seeds?highlight=${s.id}`);
      return;
    }
    document.getElementById('seeds')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      const el = document.querySelector(`[data-seed-id="${s.id}"]`);
      el?.classList.add('seed-flash');
      setTimeout(() => el?.classList.remove('seed-flash'), 1400);
    }, 500);
  };

  const submitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = prompt.trim();
    if (!v || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await apiFetch('/api/stories', {
        method: 'POST',
        body: JSON.stringify({ prompt: v })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '创建故事失败');
      router.push(`/create?storyId=${data.storyId}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : '创建故事失败');
      setCreating(false);
    }
  };

  return (
    <>
      <Topbar />

      {/* ============= Hero ============= */}
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-14 md:pb-20">
        <FloatingStamps />

        <div className="container-page relative grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center">
          {/* ===== 左：文案 + 输入 ===== */}
          <div>
            <Reveal>
              <div className="flex items-center gap-2 mb-6">
                <span className="block h-px w-12 bg-ink" />
                <span className="eyebrow">MANXIANG · 2026</span>
              </div>
            </Reveal>

            <h1
              className="font-serif font-black tracking-tight text-ink"
              style={{ fontSize: 'clamp(36px, 6.4vw, 72px)', lineHeight: 1.1, letterSpacing: '-0.02em' }}
            >
              <StaggerSplit text="用漫画，实现你的" />
              <motion.span
                initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: -2 }}
                transition={{ duration: 0.7, delay: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                className="stamp-word"
              >
                想象
              </motion.span>
            </h1>

            <Reveal delay={1.3}>
              <p className="mt-6 max-w-xl font-serif text-[17px] md:text-[19px] leading-[1.8] text-ink-secondary">
                <span className="hl">让每个人都能轻松掌控一个属于自己的故事</span>。
                <br />
                你给方向，AI 同步生成 <em className="not-italic font-bold text-ink">小说文字</em> 与{' '}
                <em className="not-italic font-bold text-ink">漫画分镜</em>。
              </p>
            </Reveal>

            {/* ============= 输入框 + CTA ============= */}
            <Reveal delay={1.6}>
              <form onSubmit={submitPrompt} className="mt-8 flex flex-col sm:flex-row items-stretch gap-3 max-w-xl">
                <div className="flex-1 relative">
                  <input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="写下你的故事想法…"
                    maxLength={100}
                    disabled={creating}
                    className="w-full h-[56px] px-4 pr-14 rounded font-serif text-[15px] bg-surface border-[1.5px] border-ink text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-red transition-colors disabled:opacity-60"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-ink-tertiary">
                    {prompt.length}/100
                  </span>
                </div>
                <Magnet strength={0.2}>
                  <button
                    type="submit"
                    disabled={creating || !prompt.trim()}
                    className="btn-primary h-[56px] px-6 whitespace-nowrap"
                  >
                    {creating ? '创建中…' : (<>开始创作 <ArrowRight size={18} /></>)}
                  </button>
                </Magnet>
              </form>
              {createError && (
                <p className="mt-3 text-[13px] text-red font-serif">
                  ⚠ {createError}
                </p>
              )}

              {/* 示例 prompt 灵感 ─ 点击直接填入 */}
              <div className="mt-4 flex flex-wrap items-center gap-2 max-w-xl">
                <span className="font-mono text-[10px] tracking-widest text-ink-tertiary uppercase">
                  灵感↓
                </span>
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrompt(p)}
                    disabled={creating}
                    className="rounded-full border border-ink-tertiary/40 bg-bg-warm/50 px-2.5 py-1 text-[12px] font-serif text-ink-secondary transition-colors hover:border-red hover:bg-red-soft hover:text-red disabled:opacity-50"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Reveal>

            {/* 数据小条 */}
            <Reveal delay={1.9}>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink-tertiary">
                <div
                  className="flex items-center gap-2"
                  title="过去 30 天累计创作篇数（去重后口径）"
                >
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-red animate-pulse" />
                  近 30 天创作 <span className="font-bold text-ink">12,408</span> 篇
                </div>
                <span className="hidden md:block h-3 w-px bg-border-soft" />
                <div>
                  免费用户 <span className="font-bold text-ink">3 话/天</span>
                </div>
                <span className="hidden md:block h-3 w-px bg-border-soft" />
                <div
                  className="font-mono text-[11px] tracking-[0.16em] uppercase text-ink-tertiary"
                  title="文字: DeepSeek-V3 / 分镜: 百度 ERNIE-Image-Turbo"
                >
                  AI · <span className="text-ink font-bold">DeepSeek</span> + <span className="text-ink font-bold">ERNIE</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* ===== 右：产品示例预览 ===== */}
          <Reveal delay={0.8} className="hidden lg:block">
            <HeroPreview />
          </Reveal>
        </div>
      </section>

      {/* ============= 故事种子区 ============= */}
      <section id="seeds" className="container-page py-12 md:py-14">
        <Reveal>
          <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="eyebrow">精选 8 颗 · 共 {SEEDS.length} 颗</span>
              <h2 className="h2-mark mt-3"><ScrollFloat text="或从一颗故事种子开始" /></h2>
            </div>
            <p className="font-serif text-[15px] text-ink-secondary md:max-w-sm">
              不知道从哪里开始？点开任意一颗种子，
              <span className="hl">AI 帮你写出第一话</span>。
            </p>
          </div>
        </Reveal>

        {/* Tab 切换 + 随机一颗 */}
        <Reveal delay={0.1}>
          <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {SEED_CATEGORIES.map((c) => (
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
                </button>
              ))}
            </div>
            <button
              onClick={pickRandomSeed}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-[1.5px] border-red bg-red-soft text-[13px] font-sans font-medium text-red transition-colors hover:bg-red hover:text-bg"
            >
              <Shuffle size={13} strokeWidth={2.2} />
              随机一颗
            </button>
          </div>
        </Reveal>

        {/* 4 列 × 2 行 等高卡片 (8 个) */}
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-stretch">
          {displayedSeeds.map((seed, i) => (
            <div key={seed.id} data-seed-id={seed.id} className="h-full">
              <SeedCard seed={seed} index={i} />
            </div>
          ))}
        </div>

        {/* 查看全部入口 */}
        {seedCategory === 'all' && (
          <Reveal delay={0.3}>
            <div className="mt-10 flex justify-center">
              <Link
                href="/seeds"
                className="inline-flex items-center gap-2 px-6 py-3 rounded border-[1.5px] border-ink bg-bg text-[14px] font-sans font-medium text-ink transition-all hover:bg-ink hover:text-bg"
              >
                查看全部 {SEEDS.length} 颗故事种子
                <ArrowRightIcon2 size={15} strokeWidth={2} />
              </Link>
            </div>
          </Reveal>
        )}

        {/* 切换分类后没数据时的兜底 */}
        {displayedSeeds.length === 0 && (
          <div className="mt-10 text-center">
            <p className="font-serif text-[14px] text-ink-tertiary">
              暂时没有「{SEED_CATEGORIES.find((c) => c.key === seedCategory)?.label}」分类的种子。
            </p>
          </div>
        )}
      </section>

      {/* ============= 免费 vs 付费 ============= */}
      <section className="container-page py-10">
        <Reveal>
          <div className="rounded border-[1.5px] border-ink bg-bg-warm overflow-hidden"
               style={{ boxShadow: '4px 4px 0 0 var(--ink)' }}>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] items-stretch">
              {/* 免费 */}
              <div className="p-5 md:p-6 border-b md:border-b-0 md:border-r border-border-soft">
                <div className="flex items-center gap-2 mb-2">
                  <span className="tag tag--ghost">FREE</span>
                  <span className="font-serif text-[15px] font-bold text-ink">免费用户</span>
                </div>
                <ul className="font-serif text-[14px] leading-[1.85] text-ink-secondary space-y-0.5">
                  <li>· 每日 <span className="font-bold text-ink">3 话</span></li>
                  <li>· 三选一剧情走向</li>
                  <li>· 日系黑白漫画分镜</li>
                  <li>· 分享得 +3 次免费</li>
                </ul>
              </div>
              {/* PRO */}
              <div className="p-5 md:p-6 border-b md:border-b-0 md:border-r border-border-soft relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="tag tag--red">PRO</span>
                  <span className="font-serif text-[15px] font-bold text-ink">付费解锁</span>
                </div>
                <ul className="font-serif text-[14px] leading-[1.85] text-ink space-y-0.5">
                  <li>· <span className="hl">每日无限</span> 话数</li>
                  <li>· 「我有自己的想法」<span className="hl">自由输入</span> 剧情</li>
                  <li>· 多画风（陆续开放）· 优先生成队列</li>
                  <li>· 长图导出无水印</li>
                </ul>
              </div>
              {/* CTA */}
              <div className="p-5 md:p-6 md:flex md:flex-col md:justify-center md:items-center md:min-w-[200px] bg-bg/40">
                <p className="font-mono text-[10px] tracking-widest text-ink-tertiary uppercase">首月仅</p>
                <p className="mt-1 font-serif text-[36px] font-black text-red leading-none">¥19</p>
                <p className="mt-1 font-serif text-[12px] text-ink-tertiary">月付¥39 / 年付¥299</p>
                <Magnet>
                  <button
                    onClick={() => router.push('/settings?tab=billing')}
                    className="mt-3 btn-primary text-[13px] px-5 py-2.5"
                  >
                    升级解锁
                  </button>
                </Magnet>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============= 流程介绍 三步 ============= */}
      <section className="container-page py-12 md:py-14">
        <Reveal>
          <span className="eyebrow">HOW IT WORKS</span>
          <h2 className="h2-mark mt-3 mb-3">
            <ScrollFloat text="三步，给你一本属于自己的漫画" />
          </h2>
          <p className="mb-8 font-serif text-[15px] text-ink-secondary max-w-2xl">
            文字与分镜<span className="hl">同步生成</span> · 不需要等所有图画完才看文字 · 通常 10-30 秒
          </p>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-3 relative">
          {STEPS.map((step, i) => (
            <div key={i} className="relative flex items-center">
              <Reveal delay={0.15 * i} className="flex-1">
                <div
                  className="relative overflow-hidden bg-surface border-[1.5px] border-ink rounded-md p-7 h-full"
                  style={{ boxShadow: '4px 4px 0 0 var(--ink)' }}
                >
                  {/* 巨型背景数字 */}
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: -12,
                      left: 8,
                      fontSize: 64,
                      fontWeight: 900,
                      color: '#C0392B',
                      opacity: 0.08,
                      zIndex: 0,
                      lineHeight: 1,
                      fontFamily: 'var(--font-serif), Noto Serif SC, serif',
                      pointerEvents: 'none'
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <div className="relative" style={{ zIndex: 1 }}>
                    <div className="flex items-center justify-between mb-5">
                      <span className="font-mono text-[13px] font-bold tracking-widest text-red">
                        STEP·{String(i + 1).padStart(2, '0')}
                      </span>
                      <step.icon size={22} strokeWidth={1.6} className="text-ink-secondary" />
                    </div>
                    <h3 className="font-serif font-bold text-[22px] mb-3 text-ink">{step.title}</h3>
                    <p className="font-serif text-[15px] leading-[1.75] text-ink-secondary">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </section>

      {/* ============= 社区预览 ============= */}
      <section className="bg-bg-warm border-y border-border-soft py-12 md:py-14">
        <div className="container-page">
          <Reveal>
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <span className="eyebrow">FEATURED STORIES</span>
                <h2 className="h2-mark mt-3"><ScrollFloat text="看看大家在写什么" /></h2>
              </div>
              <a href="#" className="hidden md:flex btn-text">查看更多 <ArrowRight size={14} /></a>
            </div>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3 items-stretch">
            {FEATURED_STORIES.map((f, i) => (
              <Reveal key={f.storyKey} delay={0.1 * i} className="h-full">
                <div
                  className="flex h-full flex-col card-flat overflow-hidden hover:-translate-y-1 transition-transform duration-300 ease-manga"
                  style={{ boxShadow: '4px 4px 0 0 var(--ink)' }}
                >
                  {/* 2 格分镜 mini 预览 与创作页同构 (CLIMAX + HOOK) */}
                  <div className="grid grid-cols-2 gap-px bg-ink border-b-[1.5px] border-ink">
                    {f.panels.map((p, j) => (
                      <div key={p.key} className="aspect-[4/3] overflow-hidden relative bg-surface-alt">
                        <FeaturedPanelImage
                          panelKey={p.key}
                          fallbackKind={p.fallbackKind}
                          alt={`${f.title} 分镜 ${j + 1}`}
                        />
                        {/* BEAT 角标 */}
                        <span className="absolute top-1 left-1.5 font-mono text-[9px] font-bold text-bg bg-ink/70 px-1 rounded-sm z-10">
                          {j === 0 ? '高潮' : '钩子'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="tag tag--ghost">{f.tag}</span>
                      <span className="text-xs text-ink-tertiary">· {f.chapters} 话</span>
                    </div>
                    <h3 className="font-serif font-bold text-[18px] mb-2 text-ink">{f.title}</h3>
                    <p
                      className="font-serif text-[14px] leading-[1.7] text-ink-secondary flex-1"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {f.summary}
                    </p>
                    <div className="mt-4 pt-3 border-t border-border-soft text-xs text-ink-tertiary">
                      <span>@{f.author}</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============= 大 CTA ============= */}
      <section className="container-page py-16 md:py-20 text-center">
        <Reveal>
          <h2 className="font-serif font-black mx-auto max-w-3xl"
              style={{ fontSize: 'clamp(36px, 5.5vw, 64px)', lineHeight: 1.15 }}>
            脑海里的那个故事，<br />
            <span className="stamp-word">该让它存在了</span>。
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Magnet>
              <button onClick={() => router.push('/create')} className="btn-primary">
                免费开始创作 <ArrowRight size={18} />
              </button>
            </Magnet>
            <a href="#seeds" className="btn-ghost" onClick={(e) => {
              e.preventDefault();
              document.getElementById('seeds')?.scrollIntoView({ behavior: 'smooth' });
            }}>浏览故事种子</a>
          </div>
        </Reveal>
      </section>

      <Footer />
    </>
  );
}

const QUICK_PROMPTS = [
  '失忆刺客发现目标是自己',
  '末日里修好播放雪的电视',
  '深海考古队的城市还活着',
  '被遗弃的反派觉醒'
];

const STEPS = [
  {
    icon: Sparkles,
    title: '输入想法 / 选一颗种子',
    desc: '一句话足够。不会写也没关系，10 颗故事种子帮你打开开端。'
  },
  {
    icon: BookOpen,
    title: 'AI 同步生成 · 文字 + 漫画',
    desc: '左边是约 500 字的小说，右边是 2 个关键漫画分镜。文字先行，分镜紧随其后。'
  },
  {
    icon: Palette,
    title: '你来选剧情走向',
    desc: '每话结束后三选一：对抗、妥协、转折。付费用户可自由输入想法。'
  }
];

// FEATURED 已迁移到 lib/showcase.ts (FEATURED_STORIES), 真图 + fallback 一体化
