# 漫想 Manxiang · Web Prototype

> 让每个人都能轻松掌控一个属于自己的故事。

AI 驱动的小说与漫画一体化创作平台 · Web 端高保真原型。

## 快速开始

```bash
cd /Users/zhezi/Desktop/projects/manxiang/web
pnpm install        # 或 npm install / yarn
pnpm dev            # http://localhost:3000
```

要求：Node ≥ 18.18，包管理器任意。

## 五个核心页面 + 路由

| Route | 页面 | 说明 |
|---|---|---|
| `/` | 首页 | 产品介绍 + 10 故事种子 + 三步流程 + 社区预览 |
| `/create` | **创作页（产品灵魂）** | 左小说文字（打字机）+ 右 2 个关键漫画分镜 + 下方 ABC 三选项 |
| `/create?seed=s01` | 创作页 · 种子模式 | 从指定故事种子开始 |
| `/create?storyId=st01` | 创作页 · 继续模式 | 从故事书继续创作 |
| `/auth` | 注册页（独立路由 + 弹层两版） | 第一话完成后自动弹层引导 |
| `/library` | 我的故事书 | 故事卡片网格 + 进行中 / 已完结 Tab |
| `/settings` | 个人设置 + 订阅 | 包含 ¥19 / ¥39 / ¥299 套餐升级 modal |

## 跳转闭环

```
/  ──┬──→  /create?seed=xxx     ──┬──→ [注册弹层] ──→ /auth ──→ /library
     │                              ├──→ [导出弹层]
     └──→  /create?prompt=...      ├──→ /library
                                    └──→ /settings
/library ──→ /create?storyId=xxx
/settings  · 升级订阅 → [订阅 Modal]
```

## 核心交互细节

- **打字机流式输出**：22ms / 字（PRD 5ms 太快读不到，22ms 更接近真实生成节奏）
- **线稿占位 → 淡入**：每格分镜延迟 1500ms 依序加载，淡入时 `filter: blur(8px) → 0`
- **「正在绘制分镜…」加载文案**：占位上方半透明 backdrop
- **三剧情选项延迟出现**：文字 + 全部分镜完成后 600ms 才显示
- **第一话完成 → 1.5s 自动弹注册引导**
- **付费「我有自己的想法」**：点击后弹层提示升级，引导到 /settings
- **第 15 话引导完结**：顶部出现「考虑给故事一个结局?」红色 tag

## 设计语言

完整设计规范见 [`../DESIGN.md`](../DESIGN.md)。

- **风格**：Manga Editorial · 漫画书卷（暖米白 #FAF6EE + 墨黑 #1A1614 + 朱砂红 #C73E3A）
- **字体**：Noto Serif SC（小说正文 + 标题）/ Noto Sans SC（UI）/ JetBrains Mono
- **签名动效**：字符 stagger / ScrollFloat / 打字机 / Magnet 磁吸 / SeedCard 翻页 / 朱砂印章漂浮
- **阴影体系**：实色偏移阴影（印章压印感）`4px 4px 0 0 ink`，**禁用模糊阴影**

## 技术栈

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS（CSS 变量驱动主题）
- Framer Motion（所有动效）
- Lucide Icons（线性图标，与墨线风格统一）

## 目录结构

```
web/
├── app/
│   ├── page.tsx                首页
│   ├── create/                 创作页
│   │   ├── page.tsx
│   │   └── CreateView.tsx
│   ├── library/page.tsx        故事书
│   ├── auth/page.tsx           注册页
│   ├── settings/               设置 + 订阅
│   │   ├── page.tsx
│   │   └── SettingsView.tsx
│   ├── layout.tsx
│   └── globals.css             全局 CSS 变量
├── components/
│   ├── Topbar.tsx              顶栏
│   ├── Footer.tsx
│   ├── StampLogo.tsx           朱砂印章 logo
│   ├── SeedCard.tsx            故事种子卡片（翻页 hover）
│   ├── Magnet.tsx              磁吸交互
│   ├── Reveal.tsx              滚动 reveal / 字符 stagger
│   ├── Typewriter.tsx          打字机 hook
│   ├── Modal.tsx               通用弹层
│   ├── FloatingStamps.tsx      Hero 朱砂印章装饰
│   ├── PanelArt.tsx            手绘风 SVG 分镜占位图（10 种）
│   └── modals/
│       ├── AuthModal.tsx
│       └── ExportModal.tsx
├── lib/
│   └── mock.ts                 10 故事种子 + 3 完整故事
└── DESIGN.md
```

## Mock 数据

- 10 个故事种子（首页全部展示）
- 3 个完整故事：失忆刺客（2 话 · 进行中）、末代公主（1 话 · 进行中）、深海考古（1 话 · 已完结）
- 10 种手绘 SVG 分镜：rainNight / closeBlade / necklace / duel / palace / flag / princess / disguise / deepSea / diver

## 致谢

Motion effects derived from [vue-bits](https://github.com/DavidHDev/vue-bits) by DavidHDev (MIT).
