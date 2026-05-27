'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Play,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  UserRound
} from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { Footer } from '@/components/Footer';
import { PanelArt } from '@/components/PanelArt';
import { Magnet } from '@/components/Magnet';
import { apiFetch } from '@/lib/identity';

const TABS = [
  { key: 'all', label: '全部故事' },
  { key: 'ongoing', label: '创作中' },
  { key: 'finished', label: '已完结' }
] as const;

type ApiPanel = {
  kind?: string;
  caption: string;
  imageUrl?: string | null;
};

type ApiChapter = {
  no: number;
  title: string;
  text: string;
  panels: ApiPanel[];
};

type ApiStory = {
  id: string;
  title?: string;
  seed: string;
  source: 'seed' | 'prompt';
  chapters: ApiChapter[];
  createdAt: number;
  updatedAt: number;
};

type LibraryStory = {
  id: string;
  title: string;
  subtitle: string;
  status: 'ongoing' | 'finished';
  coverPanel: string;
  coverImageUrl?: string | null;
  totalChapters: number;
  currentChapter: number;
  latestChapterTitle: string;
  updatedAt: string;
  raw: ApiStory;
};

function formatDate(ts: number) {
  if (!ts) return '刚刚';
  return new Date(ts).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function titleFromSeed(seed: string) {
  return seed.replace(/[。！？\s]+$/g, '').slice(0, 12) || '未命名故事';
}

function normalizeStory(story: ApiStory): LibraryStory {
  const firstChapter = story.chapters[0];
  const latestChapter = story.chapters[story.chapters.length - 1];
  const firstPanel = firstChapter?.panels?.[0];
  const status = story.chapters.length >= 15 ? 'finished' : 'ongoing';
  return {
    id: story.id,
    title: story.title || firstChapter?.title || titleFromSeed(story.seed),
    subtitle: story.seed.length > 18 ? story.seed.slice(0, 18) + '…' : story.seed,
    status,
    coverPanel: firstPanel?.kind || 'silhouette',
    coverImageUrl: firstPanel?.imageUrl ?? null,
    totalChapters: Math.max(15, story.chapters.length || 1),
    currentChapter: story.chapters.length,
    latestChapterTitle: latestChapter?.title || '等待第一话',
    updatedAt: formatDate(story.updatedAt),
    raw: story
  };
}

export default function LibraryPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('all');
  const [stories, setStories] = useState<LibraryStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/stories', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '获取故事失败');
      setStories((data.stories as ApiStory[]).map(normalizeStory));
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取故事失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStories();
  }, []);

  const filtered = useMemo(() => {
    if (tab === 'all') return stories;
    return stories.filter((s) => s.status === tab);
  }, [stories, tab]);

  const ongoingCount = stories.filter((s) => s.status === 'ongoing').length;
  const finishedCount = stories.filter((s) => s.status === 'finished').length;
  const totalChapters = stories.reduce((sum, s) => sum + s.currentChapter, 0);
  const totalPanels = stories.reduce(
    (sum, s) => sum + s.raw.chapters.reduce((n, ch) => n + ch.panels.length, 0),
    0
  );

  const renameStory = async (story: LibraryStory) => {
    const nextTitle = window.prompt('新的故事标题', story.title)?.trim();
    if (!nextTitle || nextTitle === story.title) return;
    try {
      const res = await fetch(`/api/stories/${story.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: nextTitle })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '重命名失败');
      await loadStories();
    } catch (err) {
      alert(err instanceof Error ? err.message : '重命名失败');
    }
  };

  const deleteStory = async (story: LibraryStory) => {
    if (!window.confirm(`确定删除《${story.title}》吗？删除后不可恢复。`)) return;
    try {
      const res = await apiFetch(`/api/stories/${story.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '删除失败');
      setStories((prev) => prev.filter((s) => s.id !== story.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    }
  };

  return (
    <>
      <Topbar />

      <main className="container-page pt-8 md:pt-10 pb-20">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-stretch">
          <div
            className="rounded-md border-[1.5px] border-ink bg-bg-warm p-5 md:p-6"
            style={{ boxShadow: '4px 4px 0 0 var(--ink)' }}
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-[2px] border-ink bg-surface">
                  <UserRound size={28} strokeWidth={1.8} />
                </div>
                <div>
                  <span className="eyebrow">CREATOR HOME</span>
                  <h1 className="mt-1 font-serif font-black text-[32px] md:text-[42px] leading-tight text-ink">
                    漫想者的<span className="stamp-word">故事书</span>
                  </h1>
                  <p className="mt-2 font-serif text-[14px] leading-[1.7] text-ink-secondary">
                    继续写、导出、完结，或者等它被更多人看见。
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => void loadStories()}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded border border-border-soft bg-surface px-3 text-[13px] font-medium text-ink-secondary transition-colors hover:border-red hover:text-red"
                >
                  <RefreshCw size={14} />
                  刷新
                </button>
                <Magnet strength={0.12}>
                  <Link href="/" className="btn-primary whitespace-nowrap">
                    <Plus size={17} />
                    新故事
                  </Link>
                </Magnet>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatTile label="故事" value={stories.length} sub={`${ongoingCount} 本创作中`} />
              <StatTile label="话数" value={totalChapters} sub="累计完成" />
              <StatTile label="分镜" value={totalPanels} sub="已生成画面" />
              <StatTile label="连续" value={stories.length > 0 ? 1 : 0} sub="天创作" />
            </div>
          </div>

          <aside className="rounded-md border-[1.5px] border-ink bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-tertiary">
                  TODAY
                </span>
                <h2 className="mt-1 font-serif text-[22px] font-black text-ink">今日权益</h2>
              </div>
              <Sparkles size={20} className="text-red" />
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between font-serif text-[13px] text-ink-secondary">
                <span>免费生成次数</span>
                <span><b className="text-ink">2</b> / 3</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full border border-border-soft bg-bg-warm">
                <div className="h-full bg-red" style={{ width: '66%' }} />
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <Link
                href="/settings?tab=billing"
                className="inline-flex items-center justify-center gap-2 rounded border-[1.5px] border-ink bg-ink px-4 py-2.5 text-[13px] font-medium text-bg transition-colors hover:bg-red"
              >
                <Sparkles size={14} />
                升级无限创作
              </Link>
              <button className="inline-flex items-center justify-center gap-2 rounded border border-border-soft px-4 py-2.5 text-[13px] font-medium text-ink-secondary transition-colors hover:border-red hover:text-red">
                <Upload size={14} />
                分享得免费次数
              </button>
            </div>
          </aside>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <StatusStrip icon={<Clock3 size={16} />} title="草稿与中断" desc="有未完成生成时会在这里继续接上。" value="0 个" />
          <StatusStrip icon={<BookOpen size={16} />} title="作品状态" desc="当前默认保存到我的故事书。" value={`${finishedCount} 本完结`} />
          <StatusStrip icon={<Download size={16} />} title="导出分享" desc="把精彩一话导成长图。" value="可用" />
        </section>

        <div className="mt-8 flex items-center gap-2 border-b border-border-soft">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-5 py-3 font-sans text-[14px] font-medium transition-colors ${
                tab === t.key ? 'text-ink' : 'text-ink-tertiary hover:text-ink'
              }`}
            >
              {t.label}
              {tab === t.key && (
                <motion.span
                  layoutId="tab-active"
                  className="absolute left-0 right-0 -bottom-px h-[2.5px] bg-ink"
                />
              )}
            </button>
          ))}
          <div className="ml-auto hidden pb-1.5 md:block">
            <span className="font-serif text-[13px] text-ink-tertiary">
              共 {filtered.length} 本
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded border border-red bg-red-soft p-4 font-serif text-[14px] text-red">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid place-items-center py-20 font-serif text-ink-tertiary">
            正在读取你的故事书…
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
            {filtered.map((story, i) => (
              <BookCard
                key={story.id}
                story={story}
                index={i}
                onRename={() => void renameStory(story)}
                onDelete={() => void deleteStory(story)}
              />
            ))}
            <NewStoryCard delay={0.04 * filtered.length} />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="grid place-items-center py-16 text-center">
            <p className="font-serif text-[18px] text-ink-tertiary">
              这个分类下还没有故事。<Link href="/" className="btn-text ml-2">去写一个 →</Link>
            </p>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

function StatTile({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="rounded border border-border-soft bg-surface px-4 py-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-tertiary">{label}</p>
      <p className="mt-1 font-serif text-[28px] font-black leading-none text-ink">{value}</p>
      <p className="mt-1.5 font-serif text-[12px] text-ink-secondary">{sub}</p>
    </div>
  );
}

function StatusStrip({
  icon,
  title,
  desc,
  value
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-border-soft bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded border border-ink bg-bg-warm text-ink">
          {icon}
        </span>
        <div>
          <h2 className="font-serif text-[16px] font-bold text-ink">{title}</h2>
          <p className="mt-1 font-serif text-[12.5px] leading-[1.6] text-ink-secondary">{desc}</p>
        </div>
      </div>
      <span className="tag tag--ghost shrink-0">{value}</span>
    </div>
  );
}

function CoverArt({ story }: { story: LibraryStory }) {
  if (story.coverImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={story.coverImageUrl}
        alt={story.title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    );
  }
  return <PanelArt kind={story.coverPanel} />;
}

function BookCard({
  story,
  index,
  onRename,
  onDelete
}: {
  story: LibraryStory;
  index: number;
  onRename: () => void;
  onDelete: () => void;
}) {
  const isFinished = story.status === 'finished';
  const progress = isFinished ? 100 : Math.min(100, Math.round((story.currentChapter / story.totalChapters) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.04 * index }}
      className="h-full"
    >
      <article
        className="group flex h-full flex-col overflow-hidden rounded-md border-[1.5px] border-ink bg-surface transition-all duration-300 ease-manga hover:-translate-y-1"
        style={{ boxShadow: '0 0 0 0 var(--ink)' }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = '5px 5px 0 0 var(--ink)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 0 var(--ink)')}
      >
        <div className="relative aspect-[3/4] border-b-[1.5px] border-ink overflow-hidden bg-surface-alt">
          <CoverArt story={story} />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(26,22,20,0.55), transparent)' }}
          />
          <div className="absolute top-3 left-3">
            {isFinished ? (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm border-[1.5px] border-success bg-success text-bg font-sans text-[11px] font-bold tracking-wider"
                style={{ transform: 'rotate(-4deg)', boxShadow: '2px 2px 0 0 var(--ink)' }}
              >
                <CheckCircle2 size={11} strokeWidth={2.5} />
                已完结
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm border-[1.5px] border-ink bg-red text-bg font-sans text-[11px] font-bold tracking-wider"
                style={{ boxShadow: '2px 2px 0 0 var(--ink)' }}
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-bg animate-pulse" />
                创作中
              </span>
            )}
          </div>
          <div className="absolute inset-x-3 bottom-2.5 text-bg font-sans text-[12px] font-medium tracking-wider">
            第 {story.currentChapter || 0} 话 · 预计 {story.totalChapters} 话
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-serif font-bold text-[17px] leading-tight text-ink mb-1 truncate">
            {story.title}
          </h3>
          <p className="font-serif text-[13px] text-ink-secondary truncate">{story.subtitle}</p>
          <p className="mt-2 font-serif text-[12.5px] leading-[1.6] text-ink-tertiary line-clamp-2">
            最近一话：{story.latestChapterTitle}。作品已保存到数据库，可继续创作或导出长图。
          </p>

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[10px] tracking-widest text-ink-tertiary">PROGRESS</span>
              <span className="font-mono text-[11px] font-bold text-ink">{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-bg-warm overflow-hidden border border-border-soft">
              <div
                className="h-full transition-all duration-500 ease-manga"
                style={{
                  width: `${progress}%`,
                  background: isFinished ? 'var(--success)' : 'var(--red)'
                }}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="tag tag--ghost">已保存</span>
            <span className="tag tag--ghost">第 {story.currentChapter || 0} 话</span>
          </div>

          <div className="mt-auto pt-4">
            <div className="mb-3 flex items-center justify-between border-t border-border-soft pt-3 text-xs">
              <span className="text-ink-tertiary">更新于 {story.updatedAt}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-tertiary">
                {isFinished ? 'finished' : 'writing'}
              </span>
            </div>

            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <Link
                href={`/create?storyId=${story.id}`}
                className="inline-flex items-center justify-center gap-1.5 rounded border-[1.5px] border-ink bg-ink px-3 py-2 text-[12.5px] font-bold text-bg transition-colors hover:bg-red"
              >
                {isFinished ? <BookOpen size={13} /> : <Play size={12} fill="currentColor" />}
                {isFinished ? '查看全本' : '继续创作'}
                <ArrowRight size={12} />
              </Link>
              <Link
                href={`/create?storyId=${story.id}`}
                aria-label="前往创作页导出长图"
                className="grid h-9 w-9 place-items-center rounded border border-border-soft text-ink-secondary transition-colors hover:border-red hover:text-red"
              >
                <Download size={14} />
              </Link>
              <button
                onClick={onRename}
                aria-label="重命名故事"
                className="grid h-9 w-9 place-items-center rounded border border-border-soft text-ink-secondary transition-colors hover:border-red hover:text-red"
              >
                <MoreHorizontal size={15} />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-3 font-serif text-[11.5px] text-ink-tertiary">
              <button onClick={onRename} className="inline-flex items-center gap-1 transition-colors hover:text-red">
                <Pencil size={11} />
                重命名
              </button>
              <button onClick={onDelete} className="inline-flex items-center gap-1 transition-colors hover:text-red">
                <Trash2 size={11} />
                删除
              </button>
            </div>
          </div>
        </div>
      </article>
    </motion.div>
  );
}

function NewStoryCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Magnet strength={0.15}>
        <Link
          href="/"
          className="group relative grid place-items-center h-full min-h-[280px] rounded-md border-[2px] border-dashed border-ink bg-bg-warm overflow-hidden transition-all duration-300 ease-manga hover:border-solid hover:border-red"
          style={{ boxShadow: '0 0 0 0 var(--ink)' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 0 var(--ink)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 0 var(--ink)')}
        >
          <span
            aria-hidden
            style={{
              position: 'absolute',
              fontSize: 140,
              fontWeight: 900,
              color: 'var(--red)',
              opacity: 0.06,
              lineHeight: 1,
              fontFamily: 'var(--font-serif), Noto Serif SC, serif',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-8deg)',
              pointerEvents: 'none'
            }}
          >
            ＋
          </span>
          <div className="relative text-center z-10">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border-[2px] border-ink bg-bg text-ink transition-all group-hover:bg-red group-hover:text-bg group-hover:scale-110">
              <Plus size={24} strokeWidth={2.4} />
            </div>
            <p className="font-serif text-[18px] font-bold text-ink mb-1">开始一个新故事</p>
            <p className="font-serif text-[12.5px] text-ink-tertiary">
              选一颗故事种子，或写下自己的想法
            </p>
          </div>
        </Link>
      </Magnet>
    </motion.div>
  );
}
