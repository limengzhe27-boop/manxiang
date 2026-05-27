'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ChevronRight, RotateCcw, Sparkles, Lightbulb, ArrowLeft } from 'lucide-react';
import { Topbar, CreateTopbarActions } from '@/components/Topbar';
import { Magnet } from '@/components/Magnet';
import { PanelArt } from '@/components/PanelArt';
import { useTypewriter } from '@/components/Typewriter';
import { Modal } from '@/components/Modal';
import { AuthModal } from '@/components/modals/AuthModal';
import { ExportModal } from '@/components/modals/ExportModal';
import { STORIES, type Chapter, type Choice } from '@/lib/mock';
import { useStoryLive } from '@/lib/useStoryLive';

const TYPEWRITER_SPEED = 22; // ms / 字

/** 中文标点后多余空格合并：「简单：  杀掉」→「简单：杀掉」 */
function cleanChinesePunctSpace(s: string) {
  return s.replace(/([。，：；！？、])\s+/g, '$1').replace(/\s{2,}/g, ' ');
}

export function CreateView() {
  const router = useRouter();
  const params = useSearchParams();

  const storyId = params.get('storyId');
  const liveMode = !!storyId;

  // mock 兜底（无任何参数时展示）
  const mockStory = STORIES[0];

  // live 模式所有状态都从服务端 /api/stories/:id 同步
  const live = useStoryLive(storyId);

  const [chapterIndex, setChapterIndex] = useState(0);

  // 章节来源
  const chapter: Chapter | undefined = liveMode
    ? live.chapters[chapterIndex]
    : mockStory.chapters[chapterIndex] ?? mockStory.chapters[0];

  // 标题条用的故事名
  const story: { title: string } = liveMode
    ? { title: live.seedExcerpt || '我的故事' }
    : { title: mockStory.title };

  // 3. 打字机 / 分镜状态
  const cleanedText = useMemo(
    () => (chapter ? cleanChinesePunctSpace(chapter.text) : ''),
    [chapter]
  );
  const { displayed, done: textDone } = useTypewriter(cleanedText, TYPEWRITER_SPEED);
  const [panelsReady, setPanelsReady] = useState<boolean[]>([]);
  const [choicesVisible, setChoicesVisible] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const choicesRef = useRef<HTMLDivElement>(null);

  // 弹层
  const [authOpen, setAuthOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [freeOpen, setFreeOpen] = useState(false);
  const [registered, setRegistered] = useState(false);

  // 切换章节时重置
  useEffect(() => {
    if (!chapter) return;
    setPanelsReady(new Array(chapter.panels.length).fill(false));
    setChoicesVisible(false);
    setSelectedChoice(null);
  }, [chapter]);

  // 文字打字开始后，按时间间隔点亮分镜
  useEffect(() => {
    if (!chapter) return;
    const timers: number[] = [];
    chapter.panels.forEach((_, i) => {
      const t = window.setTimeout(() => {
        setPanelsReady((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 1800 + i * 1500);
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
  }, [chapter]);

  // 文字 + 分镜都完成后，显示选项 + 触发注册引导（第一话）
  useEffect(() => {
    if (textDone && panelsReady.every(Boolean) && panelsReady.length > 0) {
      const t = window.setTimeout(() => setChoicesVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, [textDone, panelsReady]);

  useEffect(() => {
    if (choicesVisible && chapterIndex === 0 && !registered) {
      const t = window.setTimeout(() => setAuthOpen(true), 1500);
      return () => clearTimeout(t);
    }
  }, [choicesVisible, chapterIndex, registered]);

  // 选项区可见后 平滑滚到视图中央
  useEffect(() => {
    if (choicesVisible && choicesRef.current) {
      const t = window.setTimeout(() => {
        choicesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
      return () => clearTimeout(t);
    }
  }, [choicesVisible]);

  // 选剧情 → 下一话
  const handleChoice = (i: number) => {
    setSelectedChoice(i);
    const picked = chapter?.choices[i];

    if (liveMode) {
      // 真实模式: 通知 hook 生成下一话, 同时推进 chapterIndex
      window.setTimeout(() => {
        if (picked) live.generateNext(picked);
        setChapterIndex((idx) => idx + 1);
      }, 700);
    } else {
      // mock 模式: 循环切换 chapters
      window.setTimeout(() => {
        if (chapterIndex + 1 < mockStory.chapters.length) {
          setChapterIndex(chapterIndex + 1);
        } else {
          setChapterIndex(0);
        }
      }, 800);
    }
  };

  // 额度: live 模式用真实 quota (生成后更新), 未知时按满额度显示
  const dailyLimit = live.quota?.dailyLimit ?? 3;
  const remainingFreeToday = live.quota?.remainingFree ?? dailyLimit;
  const bonusCredits = live.quota?.bonusCredits ?? 0;

  // live 模式且当前 chapter 还在生成
  if (liveMode && !chapter) {
    return (
      <>
        <Topbar wide />
        <main className="container-wide pt-16 md:pt-24 pb-32">
          <LiveLoading
            seed={live.seedExcerpt}
            chapterNo={live.nextChapterNo}
            error={live.error}
            onRetry={() => router.refresh()}
          />
        </main>
      </>
    );
  }

  if (!chapter) {
    return (
      <>
        <Topbar wide />
        <main className="container-wide pt-24 pb-32 text-center font-serif text-ink-secondary">
          故事数据加载失败
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar
        wide
        rightSlot={
          <CreateTopbarActions onSave={() => alert('已暂存到我的故事书 (demo)')} onExport={() => setExportOpen(true)} />
        }
      />

      <main className="container-wide pb-32 pt-10 md:pt-16">
        {/* ============ 标题条 ============ */}
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => router.push('/library')}
              aria-label="返回我的故事书"
              className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 -ml-2.5 rounded text-[13px] text-ink-secondary hover:text-ink hover:bg-bg-warm transition-colors"
            >
              <ArrowLeft size={14} strokeWidth={2} />
              <span>我的故事书</span>
            </button>
            <span className="text-ink-tertiary">/</span>
            <span className="font-serif text-[15px] font-bold text-ink">{story.title}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="tag tag--ghost">第 {chapter.no} 话 · {chapter.title}</span>
            {chapterIndex >= 14 && (
              <span className="tag tag--red">考虑给故事一个结局?</span>
            )}
          </div>
        </div>

        {/* ============ 双栏 ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)] gap-8 lg:gap-12 items-start">
          {/* ============ 左：小说文字 ============ */}
          <section className="relative">
            <div className="sticky top-24">
              <div className="mb-5 flex items-center gap-3">
                <span className="block h-px w-8 bg-ink" />
                <span className="eyebrow">CHAPTER {String(chapter.no).padStart(2, '0')}</span>
              </div>
              <h1 className="font-serif font-black text-[36px] md:text-[44px] leading-tight mb-7 text-ink">
                {chapter.title}
              </h1>

              {/* 小说正文 段间距 + 两端对齐 */}
              <article
                className="font-serif text-[17px] md:text-[18px] text-ink novel-body"
                style={{
                  textIndent: '2em',
                  textAlign: 'justify',
                  lineHeight: 2,
                  hyphens: 'auto',
                  wordBreak: 'normal'
                }}
              >
                {displayed.split(/\n+/).filter(Boolean).map((para, i, arr) => (
                  <p key={i} style={{ marginBottom: i === arr.length - 1 ? 0 : '1.5em' }}>
                    {para}
                    {!textDone && i === arr.length - 1 && <span className="caret" />}
                  </p>
                ))}
                {textDone === false && displayed === '' && <span className="caret" />}
              </article>

              {textDone && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="mt-7 flex items-center justify-between gap-4 border-t border-ink/30 pt-4"
                >
                  <button
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-ink-secondary/40 text-ink-secondary font-sans text-[13px] font-medium transition-all hover:border-red hover:text-red hover:bg-red-soft"
                  >
                    <RotateCcw size={13} strokeWidth={2} /> 重新生成这一话
                  </button>
                  <span className="font-mono text-[12px] tracking-wide text-ink-secondary">
                    <span className="font-bold text-ink">{Array.from(chapter.text).length}</span> 字 · 阅读约{' '}
                    <span className="font-bold text-ink">1</span> 分钟
                  </span>
                </motion.div>
              )}
            </div>
          </section>

          {/* ============ 右：2 格关键分镜 ============ */}
          <section>
            <div className="mb-5 flex items-center gap-3">
              <span className="block h-px w-8 bg-ink" />
              <span className="eyebrow">PANELS · 漫画分镜</span>
            </div>

            <div className="panel-grid">
              {chapter.panels.map((p, i) => (
                <div key={`${chapter.no}-${i}`}>
                  <PanelFrame
                    panel={p}
                    ready={panelsReady[i] ?? false}
                    index={i}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ============ 接下来 剧情选项 (未完成前置灰不可点) ============ */}
        <section
          ref={choicesRef}
          aria-disabled={!choicesVisible}
          className="mt-20"
          style={{
            opacity: choicesVisible ? 1 : 0.25,
            pointerEvents: choicesVisible ? 'auto' : 'none',
            transition: 'opacity .5s ease'
          }}
        >
          <div className="flex items-center justify-center gap-4 mb-10">
            <span className="block h-px w-24 bg-ink" />
            <span className="font-serif text-[20px] font-bold tracking-wide text-ink">接下来…</span>
            <span className="block h-px w-24 bg-ink" />
          </div>

          <div className="grid gap-4 md:gap-5 md:grid-cols-3 items-stretch">
            {chapter.choices.map((c, i) => (
              <Magnet key={i} strength={0.12} className="h-full">
                <button
                  onClick={() => handleChoice(i)}
                  disabled={selectedChoice !== null || !choicesVisible}
                  className={`group relative w-full h-full min-h-[148px] flex flex-col text-left rounded border-[1.5px] border-ink bg-surface p-5 md:p-6 transition-all duration-200 ease-manga ${
                    selectedChoice === i
                      ? 'bg-red text-ink-on-red'
                      : 'hover:-translate-y-0.5 hover:bg-red-soft hover:border-red'
                  } disabled:cursor-not-allowed`}
                >
                  <span
                    className={`absolute right-5 top-4 font-serif text-[28px] font-black leading-none transition-colors ${
                      selectedChoice === i ? 'text-ink-on-red' : 'text-surface-alt group-hover:text-red'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>

                  <span
                    className={`mb-2 block font-sans text-[11px] font-medium uppercase ${
                      selectedChoice === i ? 'text-ink-on-red' : 'text-red'
                    }`}
                    style={{ letterSpacing: '0.2em' }}
                  >
                    {c.emotion}
                  </span>
                  <span className="block font-serif text-[15px] md:text-[16px] leading-[1.65] pr-8 flex-1">
                    {c.text}
                  </span>
                </button>
              </Magnet>
            ))}
          </div>

          {/* 付费自由输入 */}
          <div className="mt-8 flex items-center justify-center">
            <button
              onClick={() => setFreeOpen(true)}
              className="group inline-flex items-center gap-2 font-serif text-[15px] text-ink-secondary hover:text-red transition-colors"
            >
              <Lock size={14} className="text-warning" />
              我有自己的想法
              <span className="tag tag--red text-[10px] ml-1" style={{ padding: '2px 6px' }}>PRO</span>
              <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </section>
      </main>

      {/* ============ 底部状态条 ============ */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-border-soft bg-bg/95 backdrop-blur">
        <div className="container-wide flex items-center justify-between gap-3 py-3 text-[13px] text-ink-secondary">
          {/* 左：剩余次数 + 进度块 */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="whitespace-nowrap">
              今日剩余{' '}
              <span className="font-bold text-ink">{remainingFreeToday}</span>
              <span className="text-ink-tertiary"> / {dailyLimit}</span>{' '}
              <span className="hidden xs:inline">话</span>
            </span>
            {/* 进度小条 */}
            <span
              aria-hidden
              className="hidden sm:inline-block h-1 w-16 rounded-full bg-bg-warm overflow-hidden border border-border-soft"
            >
              <span
                className="block h-full bg-ink"
                style={{ width: `${dailyLimit ? (remainingFreeToday / dailyLimit) * 100 : 0}%` }}
              />
            </span>
            {bonusCredits > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 text-ink-tertiary whitespace-nowrap">
                <Sparkles size={12} /> 积分 <span className="font-bold text-ink">{bonusCredits}</span>
              </span>
            )}
          </div>

          {/* 右：升级按钮 */}
          <button
            onClick={() => router.push('/settings?tab=billing')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-ink bg-bg font-sans text-[13px] font-bold text-ink transition-colors hover:bg-ink hover:text-bg whitespace-nowrap"
          >
            <Sparkles size={12} strokeWidth={2.2} />
            升级解锁无限
          </button>
        </div>
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onDone={() => setRegistered(true)} />
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        chapter={chapter}
        storyTitle={story.title}
      />

      {/* 自由输入弹层 PRO */}
      <Modal open={freeOpen} onClose={() => setFreeOpen(false)} maxWidth={520}>
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb size={20} className="text-warning" />
          <h3 className="font-serif text-[22px] font-bold">写下你的剧情想法</h3>
        </div>
        <p className="font-serif text-[14px] leading-[1.7] text-ink-secondary mb-5">
          自由输入是付费功能。用一句话告诉 AI 接下来发生什么，它会按你的想法继续创作。
        </p>
        <textarea
          placeholder="例如：他没有杀也没有走，而是把吊坠戴回了那个目标的脖子上…"
          className="w-full h-28 p-4 rounded border-[1.5px] border-ink bg-surface font-serif text-[15px] leading-[1.7] text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-red transition-colors resize-none"
        />
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-xs text-ink-tertiary">月付 ¥39 / 年付 ¥299 · 首月仅 ¥19</span>
          <Magnet>
            <button
              onClick={() => {
                setFreeOpen(false);
                router.push('/settings?tab=billing');
              }}
              className="btn-primary"
            >
              升级解锁
            </button>
          </Magnet>
        </div>
      </Modal>
    </>
  );
}

/** 单格分镜 含线稿占位 + spinner + 淡入动画 */
function PanelFrame({
  panel,
  ready,
  index
}: {
  panel: { kind: string; caption: string; imageUrl?: string | null; beat?: string };
  ready: boolean;
  index: number;
}) {
  // BEAT 标签的中文
  const beatLabel = panel.beat === 'CLIMAX' ? '高潮' : panel.beat === 'HOOK' ? '钩子' : '';
  // live 模式判断: 只要 panel.imageUrl 字段存在 (字符串或 null) 就是 live 模式
  // mock 模式: panel.imageUrl === undefined, 走 ready timer 节奏
  const isLive = panel.imageUrl !== undefined;
  const liveReady = isLive && typeof panel.imageUrl === 'string' && panel.imageUrl.length > 0;

  // 超时判失败: null 持续超过 90 秒才算真的失败, 否则视为生成中
  const [liveFailed, setLiveFailed] = useState(false);
  useEffect(() => {
    if (!isLive || liveReady) {
      setLiveFailed(false);
      return;
    }
    // 图还没好, 启动 90 秒超时
    const t = window.setTimeout(() => setLiveFailed(true), 90000);
    return () => window.clearTimeout(t);
  }, [isLive, liveReady, panel.imageUrl]);

  const showRealArt = isLive ? liveReady : ready;
  const showSpinner = isLive ? !liveReady && !liveFailed : !ready;

  return (
    <div className="relative h-full flex flex-col">
      {/* 序号 + BEAT 角标 */}
      <div className="absolute -top-3 left-3 z-10 flex items-center gap-1.5">
        <div className="grid h-6 w-6 place-items-center rounded-full border-[1.5px] border-ink bg-bg font-mono text-[11px] font-bold text-ink">
          {index + 1}
        </div>
        {beatLabel && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-sm border-[1.5px] border-ink bg-red text-[10px] font-sans font-bold tracking-widest text-bg uppercase"
            style={{ boxShadow: '2px 2px 0 0 var(--ink)' }}
          >
            {beatLabel}
          </span>
        )}
      </div>

      <div
        className="overflow-hidden bg-surface flex flex-col flex-1"
        style={{
          border: '1px solid #e0dbd4',
          borderRadius: 6,
          boxShadow: '3px 3px 0 0 var(--ink)'
        }}
      >
        {/* 图区: 3:2 关键画面，和约 500 字正文高度更匹配 */}
        <div className="relative w-full panel-img-area">
          {/* 占位 线稿条纹 */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(45deg, transparent 48%, #e0dbd4 48%, #e0dbd4 52%, transparent 52%), linear-gradient(-45deg, transparent 48%, #e0dbd4 48%, #e0dbd4 52%, transparent 52%)',
              backgroundSize: '24px 24px',
              backgroundColor: 'var(--surface)'
            }}
          />

          {/* 实际分镜 */}
          <div
            className="absolute inset-0"
            style={{
              opacity: showRealArt ? 1 : 0,
              transition: 'opacity .5s ease'
            }}
          >
            {isLive && panel.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={panel.imageUrl}
                alt={panel.caption}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <PanelArt kind={panel.kind} />
            )}
          </div>

          {/* spinner + 文字 ready 时淡出 */}
          <div
            className="absolute inset-0 grid place-items-center"
            style={{
              opacity: showSpinner ? 1 : 0,
              pointerEvents: showSpinner ? 'auto' : 'none',
              transition: 'opacity .3s ease',
              background: 'rgba(var(--bg-rgb), 0.65)',
              backdropFilter: 'blur(2px)'
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <span
                aria-hidden
                style={{
                  width: 16,
                  height: 16,
                  border: '2px solid #ddd',
                  borderTopColor: '#999',
                  borderRadius: '50%',
                  animation: 'spin 1.2s linear infinite',
                  display: 'inline-block'
                }}
              />
              <span style={{ fontSize: 12, color: '#aaa' }} className="font-serif tracking-[0.12em]">
                正在绘制…
              </span>
            </div>
          </div>

          {/* 生成失败 */}
          {liveFailed && (
            <div
              className="absolute inset-0 grid place-items-center"
              style={{ background: 'rgba(var(--bg-rgb), 0.85)' }}
            >
              <span style={{ fontSize: 11, color: '#999' }} className="font-serif tracking-[0.12em]">
                ⚠ 分镜生成失败
              </span>
            </div>
          )}
        </div>

        {/* 分镜说明 13px / #888 / lh 1.5 / 2 行截断 */}
        <div
          className="px-3.5 py-2.5 border-t bg-bg"
          style={{ borderColor: '#e0dbd4' }}
        >
          <p
            className="font-serif"
            style={{
              fontSize: 13,
              color: '#888',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
            title={panel.caption}
          >
            {panel.caption}
          </p>
        </div>
      </div>
    </div>
  );
}

/** live 模式正在等待 AI 生成 章节时的 loading 视图 */
function LiveLoading({
  seed,
  chapterNo,
  error,
  onRetry
}: {
  seed: string;
  chapterNo: number;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto py-12 text-center">
      <div className="inline-grid h-16 w-16 place-items-center rounded-sm border-[2.5px] border-red bg-bg mb-6"
           style={{ transform: 'rotate(-3deg)' }}>
        <span className="font-serif text-[28px] font-black text-red leading-none">漫</span>
      </div>

      <h1 className="font-serif font-black text-[28px] md:text-[36px] leading-tight text-ink mb-4">
        {error ? '生成失败' : `AI 正在为你创作第 ${chapterNo} 话…`}
      </h1>

      <p className="font-serif text-[15px] text-ink-secondary mb-2">
        故事种子：<span className="font-bold text-ink">{seed.length > 40 ? seed.slice(0, 40) + '…' : seed}</span>
      </p>

      {error ? (
        <div className="mt-8">
          <p className="font-serif text-[14px] text-red bg-red-soft border border-red rounded p-4 text-left">
            {error}
          </p>
          <button onClick={onRetry} className="btn-primary mt-6">
            <RotateCcw size={14} /> 重试
          </button>
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center gap-4">
          <span
            aria-hidden
            style={{
              width: 28,
              height: 28,
              border: '2.5px solid var(--border-soft)',
              borderTopColor: 'var(--red)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              display: 'inline-block'
            }}
          />
          <p className="font-mono text-[12px] tracking-[0.18em] text-ink-tertiary uppercase">
            DeepSeek · 模型 deepseek-chat
          </p>
          <p className="font-serif text-[13px] text-ink-tertiary max-w-sm">
            正在生成约 500 字小说 + 2 个关键漫画分镜 + 3 个剧情走向…
            <br />
            通常 5-15 秒
          </p>
        </div>
      )}
    </div>
  );
}
