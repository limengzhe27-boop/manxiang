'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Chapter, Panel, Choice } from './mock';
import { apiFetch } from './identity';

// 服务端 PanelArt 没有真正的图，先复用 mock 里的 kind 池，按章节号 + 索引稳定挑
const PANEL_KIND_POOL = [
  'rainNight',
  'closeBlade',
  'necklace',
  'duel',
  'palace',
  'flag',
  'princess',
  'disguise',
  'deepSea',
  'diver',
  'silhouette'
];
function pickKind(chapterNo: number, i: number) {
  return PANEL_KIND_POOL[(chapterNo * 7 + i * 3) % PANEL_KIND_POOL.length];
}

type RawApiChapter = {
  no: number;
  title: string;
  text: string;
  panels: Array<{ caption: string; prompt: string; imageUrl?: string | null }>;
  choices: Array<{ emotion: string; text: string }>;
  summary?: string;
  chosen?: { emotion: string; text: string };
};

function normalizeChapter(raw: RawApiChapter): Chapter {
  return {
    no: raw.no,
    title: raw.title,
    text: raw.text,
    panels: raw.panels.map<Panel>((p, i) => ({
      kind: pickKind(raw.no, i),
      caption: p.caption,
      excerpt: undefined,
      imageUrl: p.imageUrl ?? null
    })),
    choices: raw.choices.map<Choice>((c) => ({
      emotion: c.emotion as Choice['emotion'],
      text: c.text
    }))
  };
}

/** 章节是否还有未生成完的图片 */
function chapterHasPendingImages(ch: Chapter) {
  return ch.panels.some((p) => !p.imageUrl); // null / undefined 都算未就绪
}

export type QuotaInfo = {
  remainingFree: number;
  dailyLimit: number;
  bonusCredits: number;
} | null;

type StoryLive = {
  loading: boolean;
  error: string | null;
  seedExcerpt: string;
  chapters: Chapter[];
  /** 下一话将是第几话 */
  nextChapterNo: number;
  /** 当前额度 (生成成功后更新) */
  quota: QuotaInfo;
  /** 触发生成下一话 */
  generateNext: (choice?: { emotion: string; text: string }) => void;
};

/**
 * 触发单张分镜图生成 (带重试)
 * 成功后服务端会写库, 前端轮询会拿到新 imageUrl
 */
async function generatePanelImage(
  storyId: string,
  chapterNo: number,
  panelIndex: number,
  attempt = 1
): Promise<void> {
  const MAX_ATTEMPTS = 2;
  try {
    const res = await apiFetch(
      `/api/stories/${storyId}/chapters/${chapterNo}/panels/${panelIndex}/image`,
      { method: 'POST' }
    );
    if (res.status === 429) return; // 限流, 不重试 (避免恶性循环)
    if (!res.ok) {
      if (attempt < MAX_ATTEMPTS) {
        console.warn(`[manxiang] 图${panelIndex + 1}失败 重试 ${attempt + 1}/${MAX_ATTEMPTS}`);
        await new Promise((r) => setTimeout(r, 1500));
        return generatePanelImage(storyId, chapterNo, panelIndex, attempt + 1);
      }
      console.error(`[manxiang] 图${panelIndex + 1} 最终失败`);
      return;
    }
    console.log(`[manxiang] ✅ 图${panelIndex + 1}就绪`);
  } catch (err) {
    if (attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, 1500));
      return generatePanelImage(storyId, chapterNo, panelIndex, attempt + 1);
    }
    console.error(`[manxiang] 图${panelIndex + 1} 异常:`, err);
  }
}

export function useStoryLive(storyId: string | null): StoryLive {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seedExcerpt, setSeedExcerpt] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [quota, setQuota] = useState<QuotaInfo>(null);
  /** 防止并发触发同一话生成 */
  const inflightForNo = useRef<number | null>(null);

  const generateChapter = useCallback(
    async (id: string, choice?: { emotion: string; text: string }) => {
      const expectedNo = (chapters.length || 0) + 1;
      if (inflightForNo.current === expectedNo) return;
      inflightForNo.current = expectedNo;
      setLoading(true);
      setError(null);
      try {
        console.log('[manxiang] → POST /api/stories/' + id + '/chapters', { choice });
        const res = await apiFetch(`/api/stories/${id}/chapters`, {
          method: 'POST',
          body: JSON.stringify({ choice })
        });
        const data = await res.json();
        if (res.status === 402 || data?.code === 'QUOTA_EXCEEDED') {
          throw new Error('今日额度已用完，去「设置-订阅与计费」升级或购买积分后继续创作。');
        }
        if (res.status === 429 || data?.code === 'RATE_LIMITED') {
          throw new Error(data?.error || '操作太频繁，请稍后再试。');
        }
        if (!res.ok) throw new Error(data?.error || 'API 错误');
        const raw = data.chapter as RawApiChapter;
        console.log('[manxiang] ← chapter:', raw?.title);
        if (data.quota) setQuota(data.quota as QuotaInfo);
        const ch = normalizeChapter(raw);
        setChapters((prev) => {
          if (prev.some((c) => c.no === ch.no)) return prev;
          return [...prev, ch];
        });

        // 章节文字已就位 → 并行触发每张分镜的图片生成 (每张图独立 serverless 实例)
        const chapterNo = ch.no;
        ch.panels.forEach((_, panelIndex) => {
          void generatePanelImage(id, chapterNo, panelIndex);
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : '生成失败';
        console.error('[manxiang] ✗', msg);
        setError(msg);
      } finally {
        setLoading(false);
        inflightForNo.current = null;
      }
    },
    [chapters.length]
  );

  // 初始化：拿 story 信息 + 如果没有第一话就触发生成
  useEffect(() => {
    if (!storyId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/stories/${storyId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || '获取故事失败');
        if (cancelled) return;
        setSeedExcerpt(
          (data.seed as string).length > 30
            ? (data.seed as string).slice(0, 30) + '…'
            : (data.seed as string)
        );
        const existing = (data.chapters as RawApiChapter[]).map(normalizeChapter);
        setChapters(existing);
        // 兜底: 对 imageUrl 仍为 null/undefined 的 panel 重新触发生成
        // (覆盖"刷新页面时上一次未完成"的场景)
        for (const ch of existing) {
          ch.panels.forEach((p, i) => {
            if (!p.imageUrl) {
              void generatePanelImage(storyId, ch.no, i);
            }
          });
        }
        if (existing.length === 0) {
          // 触发首话生成 ( generateChapter 会自己设 loading )
          await generateChapter(storyId);
        } else {
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '获取故事失败');
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // 故意只依赖 storyId, 避免 generateChapter 引用变化重复触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);

  // 轮询: 只要 chapters 里有任何一格 imageUrl 还没就绪, 每 2s GET 一次同步
  useEffect(() => {
    if (!storyId) return;
    if (!chapters.some(chapterHasPendingImages)) return;

    const tick = async () => {
      try {
        const res = await fetch(`/api/stories/${storyId}`);
        const data = await res.json();
        if (!res.ok) return;
        const fresh = (data.chapters as RawApiChapter[]).map(normalizeChapter);
        setChapters((prev) => {
          // 只有真的有 imageUrl 变化才更新, 否则 React 也会跳过
          if (fresh.length !== prev.length) return fresh;
          const changed = fresh.some((c, i) =>
            c.panels.some((p, j) => p.imageUrl !== prev[i]?.panels[j]?.imageUrl)
          );
          return changed ? fresh : prev;
        });
      } catch {
        // 静默, 下个 tick 再试
      }
    };

    const id = window.setInterval(tick, 2000);
    return () => window.clearInterval(id);
  }, [storyId, chapters]);

  const generateNext = useCallback(
    (choice?: { emotion: string; text: string }) => {
      if (!storyId) return;
      void generateChapter(storyId, choice);
    },
    [storyId, generateChapter]
  );

  return {
    loading,
    error,
    seedExcerpt,
    chapters,
    nextChapterNo: chapters.length + 1,
    quota,
    generateNext
  };
}
