'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Modal } from '@/components/Modal';
import { Magnet } from '@/components/Magnet';
import { PanelArt } from '@/components/PanelArt';
import { Download, Share2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import type { Chapter } from '@/lib/mock';

/** 海报的原始宽度 用于实际导出 PNG 时的基准 */
const POSTER_WIDTH = 800;

export function ExportModal({
  open,
  onClose,
  chapter,
  storyTitle
}: {
  open: boolean;
  onClose: () => void;
  chapter: Chapter;
  storyTitle: string;
}) {
  const posterRef = useRef<HTMLDivElement>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  /** 预览缩放比例 让 800px 海报适配预览容器宽度 */
  const [previewScale, setPreviewScale] = useState(1);
  /** 海报实际高度 缩放后预览容器要给对应的高度 */
  const [posterHeight, setPosterHeight] = useState(0);

  // 监听预览容器宽度变化, 计算缩放比 同步海报高度
  useLayoutEffect(() => {
    if (!open) return;
    const recalc = () => {
      const box = previewBoxRef.current;
      const poster = posterRef.current;
      if (!box || !poster) return;
      const boxWidth = box.clientWidth;
      // 海报最大不超过容器宽度
      const scale = Math.min(1, boxWidth / POSTER_WIDTH);
      setPreviewScale(scale);
      setPosterHeight(poster.scrollHeight * scale);
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    if (previewBoxRef.current) ro.observe(previewBoxRef.current);
    if (posterRef.current) ro.observe(posterRef.current);
    return () => ro.disconnect();
  }, [open, chapter]);

  const handleExport = async () => {
    if (!posterRef.current) return;
    setExporting(true);
    try {
      // 截图前 先把预览缩放复位 (CSS transform), 截完再还原
      const node = posterRef.current;
      const originalTransform = node.style.transform;
      const originalTransformOrigin = node.style.transformOrigin;
      node.style.transform = 'none';
      node.style.transformOrigin = '';

      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#FAF6EE',
        // 强制按海报原始尺寸截图, 不受 transform 影响
        width: POSTER_WIDTH,
        height: node.scrollHeight
      });

      node.style.transform = originalTransform;
      node.style.transformOrigin = originalTransformOrigin;

      const link = document.createElement('a');
      link.download = `漫想-${storyTitle}-第${chapter.no}话.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={760}>
      <h2 className="font-serif text-[22px] font-bold mb-1 text-ink">导出长图</h2>
      <p className="font-serif text-[13px] text-ink-secondary mb-5">
        竖版长图，适合发到小红书 / 微博 / 微信朋友圈。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-5">
        {/* ============ 预览（缩放后展示 截图时复位） ============ */}
        <div
          ref={previewBoxRef}
          className="rounded border border-border-soft bg-bg-warm/40 p-3 overflow-hidden relative"
          style={{ maxHeight: '60vh', overflowY: 'auto' }}
        >
          {/* 占位元素 撑出缩放后海报的总高度, 给滚动条用 */}
          <div style={{ height: posterHeight, position: 'relative' }}>
            <div
              ref={posterRef}
              style={{
                width: POSTER_WIDTH,
                background: '#FAF6EE',
                fontFamily: 'var(--font-serif), Noto Serif SC, serif',
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
                overflow: 'hidden'
              }}
            >
              {/* ============ Header ============ */}
              <div
                style={{
                  background: '#F5EFE8',
                  padding: '24px 32px',
                  borderBottom: '1px solid #E0D8D0',
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    display: 'inline-grid',
                    placeItems: 'center',
                    width: 40,
                    height: 40,
                    border: '2.5px solid #C0392B',
                    borderRadius: 4,
                    marginBottom: 8
                  }}
                >
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#C0392B', lineHeight: 1 }}>
                    漫
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#1A1614',
                    margin: 0,
                    lineHeight: 1.2,
                    letterSpacing: '-0.01em'
                  }}
                >
                  {storyTitle}
                </h3>
                <p style={{ fontSize: 14, color: '#888', margin: '6px 0 0 0' }}>
                  第 {chapter.no} 话 · {chapter.title}
                </p>
              </div>

              {/* ============ 分镜区 ============ */}
              <div style={{ padding: '24px' }}>
                {chapter.panels.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      margin: i === chapter.panels.length - 1 ? '0' : '0 0 24px 0',
                      paddingBottom: i === chapter.panels.length - 1 ? 0 : 16,
                      borderBottom: i === chapter.panels.length - 1 ? 'none' : '1px solid #EEE8E0'
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '3 / 2',
                        border: '1px solid #E0D8D0',
                        borderRadius: 6,
                        overflow: 'hidden',
                        background: '#FFFFFF'
                      }}
                    >
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt={p.caption}
                          crossOrigin="anonymous"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                      ) : (
                        <PanelArt kind={p.kind} />
                      )}
                    </div>

                    {/* 红块序号 + 说明 */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        marginTop: 8,
                        fontSize: 15,
                        color: '#333',
                        lineHeight: 1.6
                      }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          background: '#C0392B',
                          color: '#FFFFFF',
                          borderRadius: 8,
                          padding: '2px 7px',
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: 'JetBrains Mono, monospace',
                          lineHeight: 1.4,
                          marginTop: 2
                        }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span>{p.caption}</span>
                    </div>

                    {p.excerpt && (
                      <div
                        style={{
                          background: '#FDFAF6',
                          borderRadius: 6,
                          padding: '12px 16px',
                          marginTop: 8,
                          borderLeft: '3px solid #C0392B',
                          fontSize: 14,
                          color: '#555',
                          lineHeight: 1.8,
                          textAlign: 'justify'
                        }}
                      >
                        {p.excerpt}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* ============ Footer ============ */}
              <div
                style={{
                  background: '#F5EFE8',
                  borderTop: '1px solid #E0D8D0',
                  height: 64,
                  padding: '0 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 28,
                      height: 28,
                      border: '2px solid #C0392B',
                      borderRadius: 3
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#C0392B', lineHeight: 1 }}>
                      漫
                    </span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1614' }}>
                    漫想 Manxiang
                  </span>
                </div>
                <span style={{ fontSize: 13, color: '#666' }}>
                  扫码或访问 manxiang.app 开始创作
                </span>
                <span
                  style={{
                    position: 'absolute',
                    right: 8,
                    bottom: 4,
                    fontSize: 11,
                    color: '#BBB',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}
                >
                  © 漫想 2026
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============ 操作面板 ============ */}
        <div className="space-y-3">
          <div className="rounded border border-border-soft p-3 bg-bg-warm">
            <p className="font-mono text-[10px] tracking-wider text-ink-tertiary mb-1">导出尺寸</p>
            <p className="font-serif text-[13px] text-ink">{POSTER_WIDTH} × 自适应</p>
            <p className="font-mono text-[10px] tracking-wider text-ink-tertiary mt-2.5 mb-1">
              清晰度
            </p>
            <p className="font-serif text-[13px] text-ink">2x 高清</p>
            <p className="font-mono text-[10px] tracking-wider text-ink-tertiary mt-2.5 mb-1">
              预览缩放
            </p>
            <p className="font-serif text-[13px] text-ink">{Math.round(previewScale * 100)}%</p>
          </div>

          <Magnet>
            <button onClick={handleExport} disabled={exporting} className="btn-primary w-full">
              {exporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> 生成中…
                </>
              ) : (
                <>
                  <Download size={16} /> 保存到本地
                </>
              )}
            </button>
          </Magnet>
          <button className="btn-ghost w-full" disabled={exporting}>
            <Share2 size={16} /> 复制图片
          </button>

          <div className="mt-3 rounded border border-border-soft p-3 bg-red-soft">
            <p className="font-serif text-[12px] leading-[1.65] text-ink">
              <ImageIcon size={11} className="inline mr-1 text-red" />
              <span className="font-bold">分享有惊喜</span>：分享至社交平台并截图上传，可获{' '}
              <span className="font-bold text-red">+3 次</span>免费生成。
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
