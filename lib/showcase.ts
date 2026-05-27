/**
 * 首页静态展示用的图像 prompt 表
 * 用途:
 *   - HeroPreview (首页右侧 "失忆的刺客 第 1 话" 2 个关键分镜)
 *   - Featured Stories (首页底部 "看看大家在写什么" 3 张卡 × 每张 4 格)
 *
 * 跑 `npm run gen-showcase` 后会产出 public/showcase/{key}.png
 * 找不到时 SeedArt / SeedShowcaseArt 会自动 fallback 到 PanelArt SVG
 */

const STYLE =
  'manga style, black and white, detailed lineart, ink illustration, comic panel, high contrast';
const SAFETY = 'safe for work, no text, no watermark, single character or scene';

export type ShowcasePanel = {
  key: string;       // 用作文件名 public/showcase/{key}.png
  caption: string;   // 显示在卡片上的中文说明
  fallbackKind: string; // PanelArt SVG 兜底 kind
  imagePrompt: string;
};

/** Hero 区右侧产品预览 — 失忆刺客 · 第 1 话 2 格 (CLIMAX + HOOK) */
export const HERO_PREVIEW_PANELS: ShowcasePanel[] = [
  {
    key: 'hero-3',
    caption: '铜面具裂开的瞬间。',
    fallbackKind: 'silhouette',
    imagePrompt: `${STYLE}. close-up of a cracked bronze mask falling away from a face, dramatic moment of revelation, rain droplets, sharp ink lines. ${SAFETY}`
  },
  {
    key: 'hero-4',
    caption: '吊坠上刻着「忘」。',
    fallbackKind: 'necklace',
    imagePrompt: `${STYLE}. extreme close-up of a small pendant lying on an open palm, the pendant has an oriental engraving, rain droplets on the skin, soft glow. ${SAFETY}`
  }
];

/** Featured Stories — 3 个故事 × 4 格 */
export const FEATURED_STORIES = [
  {
    storyKey: 'featured-st01',
    title: '失忆刺客の镜中影',
    tag: '悬疑',
    chapters: 12,
    summary:
      '雨水冲刷着青石板路，他握紧匕首。组织给他的任务很简单：杀掉巷子尽头那个戴铜面具的男人。',
    author: '匿名漫想者',
    panels: [
      {
        key: 'feat-st01-3',
        fallbackKind: 'silhouette',
        imagePrompt: `${STYLE}. a mysterious figure in a bronze mask standing in shadows of a rainy alley, dramatic atmosphere. ${SAFETY}`
      },
      {
        key: 'feat-st01-4',
        fallbackKind: 'necklace',
        imagePrompt: `${STYLE}. a small engraved pendant lying on wet cobblestones, glistening in rain, close-up detail shot. ${SAFETY}`
      }
    ]
  },
  {
    storyKey: 'featured-st02',
    title: '末代公主的潜行',
    tag: '奇幻',
    chapters: 8,
    summary:
      '宫殿外的喊杀声第一次清晰地传进了寝殿。她推开镜前的盒子，把头上沉重的凤冠摘下来。',
    author: '半夏不冷',
    panels: [
      {
        key: 'feat-st02-2',
        fallbackKind: 'princess',
        imagePrompt: `${STYLE}. a young princess slowly removing an elaborate phoenix crown in front of a bronze mirror, candlelit chamber, determined expression. ${SAFETY}`
      },
      {
        key: 'feat-st02-4',
        fallbackKind: 'flag',
        imagePrompt: `${STYLE}. a tattered revolutionary flag waving against an angry red sky over a distant palace, dramatic silhouette. ${SAFETY}`
      }
    ]
  },
  {
    storyKey: 'featured-st03',
    title: '海底之城',
    tag: '科幻',
    chapters: 15,
    summary:
      '潜水钟在两千米的水深处停了下来。声呐里那个规整的轮廓，正在我们的正前方。',
    author: '深海三号',
    panels: [
      {
        key: 'feat-st03-3',
        fallbackKind: 'deepSea',
        imagePrompt: `${STYLE}. an ancient underwater city with glowing windows visible through dark deep ocean, mysterious architecture, awe-inspiring atmosphere. ${SAFETY}`
      },
      {
        key: 'feat-st03-4',
        fallbackKind: 'silhouette',
        imagePrompt: `${STYLE}. a researcher inside a diving bell control room, removing his headset slowly with stunned expression, blue-lit monitors. ${SAFETY}`
      }
    ]
  }
];

/** 给脚本调用的扁平化 prompt 列表 */
export function getAllShowcasePrompts() {
  const all: { key: string; prompt: string }[] = [];
  HERO_PREVIEW_PANELS.forEach((p) => all.push({ key: p.key, prompt: p.imagePrompt }));
  FEATURED_STORIES.forEach((story) => {
    story.panels.forEach((p) => all.push({ key: p.key, prompt: p.imagePrompt }));
  });
  return all;
}
