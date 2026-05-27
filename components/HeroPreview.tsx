'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { PanelArt } from './PanelArt';
import { HERO_PREVIEW_PANELS } from '@/lib/showcase';

const PREVIEW = {
  title: '失忆的刺客 · 第 1 话',
  text: '雨水冲刷着青石板路，他蹲在屋檐下，匕首在掌心被攥得发烫。组织给他的任务很简单：杀掉巷子尽头那个戴铜面具的男人。',
  panels: HERO_PREVIEW_PANELS,
  choices: ['对抗', '妥协', '转折']
};

/** 优先用 AI 图, 404 fallback 到 PanelArt SVG */
function ShowcaseArt({ panelKey, fallbackKind, alt }: { panelKey: string; fallbackKind: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (errored) return <PanelArt kind={fallbackKind} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/showcase/${panelKey}.png`}
      alt={alt}
      onError={() => setErrored(true)}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      loading="eager"
    />
  );
}

export function HeroPreview() {
  return (
    <div className="relative" style={{ perspective: 1200 }}>
      {/* 旋转角度做一点漫画书翻开感 */}
      <motion.div
        initial={{ opacity: 0, rotateY: -8, y: 20 }}
        animate={{ opacity: 1, rotateY: -3, y: 0 }}
        transition={{ duration: 1, delay: 1.0, ease: [0.2, 0.8, 0.2, 1] }}
        style={{ transformStyle: 'preserve-3d', transformOrigin: 'left center' }}
        className="relative rounded-md border-[1.5px] border-ink bg-surface overflow-hidden"
      >
        {/* 顶部假浏览器条 */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border-soft bg-bg-warm">
          <span className="block h-2 w-2 rounded-full bg-red" />
          <span className="block h-2 w-2 rounded-full bg-warning" />
          <span className="block h-2 w-2 rounded-full bg-success" />
          <span className="ml-3 font-mono text-[10px] text-ink-tertiary">manxiang.app / create</span>
        </div>

        {/* 内容：左文字 + 右分镜 */}
        <div className="grid grid-cols-[1fr_1.1fr] gap-3 p-4">
          {/* 左：CHAPTER + 标题 + 正文片段 */}
          <div>
            <span className="block font-mono text-[10px] tracking-widest text-red mb-1">
              CHAPTER 01
            </span>
            <h3 className="font-serif font-black text-[15px] mb-2 text-ink leading-tight">
              {PREVIEW.title}
            </h3>
            <p
              className="font-serif text-[11.5px] text-ink-secondary"
              style={{ lineHeight: 1.8, textIndent: '2em', textAlign: 'justify' }}
            >
              {PREVIEW.text}
              <motion.span
                className="inline-block ml-0.5 w-[6px] h-[12px] align-[-1px] bg-ink"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
            </p>
          </div>

          {/* 右：2 格上下堆叠分镜 CLIMAX + HOOK */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 6
            }}
          >
            {PREVIEW.panels.map((p, i) => (
              <motion.div
                key={p.key}
                initial={{ opacity: 0, filter: 'blur(6px)' }}
                animate={{ opacity: 1, filter: 'blur(0)' }}
                transition={{ duration: 0.6, delay: 1.4 + i * 0.18 }}
                style={{
                  border: '1px solid #e0dbd4',
                  borderRadius: 4,
                  overflow: 'hidden',
                  aspectRatio: '3 / 2'
                }}
              >
                <ShowcaseArt panelKey={p.key} fallbackKind={p.fallbackKind} alt={p.caption} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* 底部 3 选项 */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="block h-px flex-1 bg-border-soft" />
            <span className="font-serif text-[10px] font-bold text-ink">接下来…</span>
            <span className="block h-px flex-1 bg-border-soft" />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {PREVIEW.choices.map((emo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 2.4 + i * 0.1 }}
                className="relative rounded border border-ink bg-surface px-2 py-1.5 text-center"
              >
                <span
                  className="block font-sans text-[8px] font-medium text-red"
                  style={{ letterSpacing: '0.18em' }}
                >
                  {emo}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

      </motion.div>

      {/* 印章角标 装饰 (放在 motion.div 外, 避免被 overflow hidden 裁切) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.4, rotate: 30 }}
        animate={{ opacity: 1, scale: 1, rotate: 10 }}
        transition={{ duration: 0.6, delay: 1.6, type: 'spring', stiffness: 180 }}
        className="absolute -top-4 -right-3 z-10 grid h-14 w-14 place-items-center rounded-sm border-[2.5px] border-red bg-bg shadow-stamp"
        style={{ boxShadow: '3px 3px 0 0 var(--ink)' }}
      >
        <span className="font-serif text-[14px] font-black text-red leading-[1] tracking-[0.05em]">
          实例
        </span>
      </motion.div>

      {/* 底部说明小字 */}
      <p className="mt-3 text-center font-serif text-[12px] text-ink-tertiary">
        ↑ 真实创作页效果预览 · 文字与分镜同步生成
      </p>
    </div>
  );
}
