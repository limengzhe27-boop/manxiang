# DESIGN.md — 漫想 Manxiang

> 像一本刚翻开的精装漫画书 —— 米黄纸张、墨黑铅笔、朱砂红印章。
> 用户是这本书的作者，AI 是替他执笔的画师。

---

## 1. Visual Theme & Atmosphere

**Style**：Manga Editorial · 漫画书卷
**Keywords**：纸质感、衬线书卷、墨线手绘、朱砂印章、留白克制、沉浸阅读、电影分镜
**Tone**：温暖、有质感、沉静、可被翻阅 — **NOT** 浮夸 / 卡通 / 科技冷感 / 玻璃质感
**Feel**：一本米白色封面的精装漫画书，封面上盖着一枚朱砂印章，翻开内页墨香未干。

**Interaction Tier**：**L2** 流畅交互（核心创作页接近 L3 — 打字机流式、线稿渐显、卡片磁吸）
**Dependencies**：Tailwind CSS + Framer Motion + Lucide Icons（无需 GSAP / Lenis，Framer Motion 足够覆盖打字机、分镜淡入、滚动 reveal、磁吸）

**核心氛围装置**：
- **纸张底噪**：所有页面铺一层 0.04 透明度的颗粒噪点 SVG，模拟纸纤维
- **墨线分割**：分区之间用 1px 墨黑实线，而非阴影或卡片
- **朱砂印章**：Logo、关键 CTA、强调标记使用方形红色印章风格
- **手绘 SVG 分镜占位图**：用 stroke 0.5 的黑色线稿 + dashed border 模拟漫画分镜框

---

## 2. Color Palette & Roles

```css
:root {
  /* === Backgrounds 纸张 === */
  --bg: #FAF6EE;              /* 主背景 · 米黄纸 */
  --bg-warm: #F3ECDC;         /* 次背景 · 较深米黄（区分 section）*/
  --surface: #FFFFFF;         /* 纯白卡片（用于分镜画板）*/
  --surface-alt: #E8DCC4;     /* 暖卡其（标签底色 / hover 态）*/
  --surface-hover: #F0E8D5;   /* 卡片 hover 表面 */

  /* === Borders 墨线 === */
  --border: #1A1614;          /* 墨黑实线（漫画分镜框、按钮）*/
  --border-soft: #C9BFA8;     /* 米黄虚化线（次级分割）*/
  --border-hover: #C73E3A;    /* hover 朱砂边框 */

  /* === Text 墨色 === */
  --ink: #1A1614;             /* 主文字 · 墨黑 */
  --ink-secondary: #4A4540;   /* 次文字 · 墨灰 */
  --ink-tertiary: #8A8275;    /* 三级文字 · 暖灰 */
  --ink-on-red: #FAF6EE;      /* 红底白字 */

  /* === Accent 朱砂 === */
  --red: #C73E3A;             /* 朱砂红 · CTA / 印章 / 强调 */
  --red-hover: #A82E2A;       /* 朱砂深一档 */
  --red-soft: #F4DDD8;        /* 红色淡背景（提示条 / 选中态背景）*/

  /* === Secondary 靛蓝 === */
  --indigo: #2C3E50;          /* 靛蓝 · 辅助强调（链接 / icon）*/
  --indigo-soft: #DCE3E8;     /* 靛蓝淡背景 */

  /* === RGB Helpers === */
  --bg-rgb: 250, 246, 238;
  --ink-rgb: 26, 22, 20;
  --red-rgb: 199, 62, 58;
  --warm-rgb: 232, 220, 196;

  /* === Semantic === */
  --success: #6B8E4E;         /* 苔绿（已完结标签）*/
  --warning: #C79B3A;         /* 琥珀（次数耗尽提示）*/
  --error: #C73E3A;           /* 与朱砂同色 */
}
```

**Color Rules**：
- 所有颜色通过 CSS 变量引用，**禁止硬编码 hex**
- 朱砂红 `--red` 是稀缺资源，全屏出现不超过 3 处（Logo / 主 CTA / 当前选中态）
- 墨黑 `--ink` 用作边框时永远是 1px 或 1.5px 实线，**不用 box-shadow 替代**
- 不允许出现纯黑 #000 和纯白 #FFF 大面积（只在分镜画板内）
- 不允许出现 macOS 系统蓝、绿、紫 — 系统配色破坏书卷气

---

## 3. Typography Rules

**Font Stack**：

```css
/* Next.js next/font/google 引入 */
import { Noto_Serif_SC, Noto_Sans_SC, JetBrains_Mono } from 'next/font/google';

const serif = Noto_Serif_SC({ weight: ['400', '500', '700', '900'], subsets: ['latin'] });
const sans  = Noto_Sans_SC({ weight: ['400', '500', '700'], subsets: ['latin'] });
const mono  = JetBrains_Mono({ weight: ['400', '500'], subsets: ['latin'] });
```

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| Hero H1（首页大标） | Noto Serif SC | 88px / 56px(mobile) | 900 | 1.1 | -0.02em |
| Section H2 | Noto Serif SC | 48px / 32px | 700 | 1.2 | -0.01em |
| H3（卡片标题、章节）| Noto Serif SC | 24px | 700 | 1.4 | 0 |
| 小说正文（创作页核心）| Noto Serif SC | 18px | 400 | **1.9** | 0.02em |
| 普通正文 | Noto Sans SC | 16px | 400 | 1.75 | 0.02em |
| Label / Eyebrow | Noto Sans SC | 12px | 500 | 1.4 | **0.18em**（uppercase）|
| Caption（分镜下文字）| Noto Serif SC | 14px | 500 | 1.6 | 0.02em |
| Mono / Code | JetBrains Mono | 13px | 400 | 1.5 | 0 |

**Typography Rules**：
- **小说正文必须用衬线**（Noto Serif SC），强化"在读一本书"的沉浸感
- **UI 文字用无衬线**（Noto Sans SC），保持界面清晰
- 中文 `letter-spacing` 永远 ≥ 0.02em，避免字挤
- 中文行高最低 1.7，小说正文 1.9（PRD 阅读体验目标）
- **NEVER use**：Times New Roman、SimSun（宋体系统字）、Helvetica（无中文）、Comic Sans

**Text Decoration**：
- **Hero H1 装饰**：第一个关键词用朱砂红 + 印章式方框包裹（不用渐变，破坏书卷感）
  ```css
  .stamp-word {
    color: var(--red);
    border: 2px solid var(--red);
    padding: 0 .15em;
    display: inline-block;
    transform: rotate(-2deg);
    background: var(--bg);
  }
  ```
- **Section H2 装饰**：左侧带 4px 墨黑短竖线（章节符号感）
- **正文 p**：禁止任何渐变、阴影、下划线装饰
- **关键词 highlight**：用 `background: linear-gradient(transparent 60%, var(--surface-alt) 60%)` 实现「荧光笔」效果

---

## 4. Component Stylings

### 4.1 Buttons

```css
/* Primary · 朱砂印章按钮 */
.btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 28px;
  background: var(--red);
  color: var(--ink-on-red);
  border: 1.5px solid var(--ink);
  border-radius: 4px;                        /* 几乎方角，书卷气 */
  font: 500 15px/1 'Noto Sans SC', sans-serif;
  letter-spacing: 0.05em;
  box-shadow: 4px 4px 0 0 var(--ink);        /* 偏移实色阴影，模拟印章压印 */
  transition: all .18s cubic-bezier(.2,.8,.2,1);
  cursor: pointer;
}
.btn-primary:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 0 var(--ink);
}
.btn-primary:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 0 var(--ink);
}
.btn-primary:focus-visible {
  outline: 2px solid var(--indigo);
  outline-offset: 4px;
}
.btn-primary:disabled {
  background: var(--surface-alt);
  color: var(--ink-tertiary);
  box-shadow: 2px 2px 0 0 var(--border-soft);
  cursor: not-allowed; transform: none;
}

/* Secondary · 墨线幽灵按钮 */
.btn-ghost {
  padding: 14px 28px;
  background: transparent;
  color: var(--ink);
  border: 1.5px solid var(--ink);
  border-radius: 4px;
  font: 500 15px/1 'Noto Sans SC';
  transition: all .18s ease;
}
.btn-ghost:hover { background: var(--ink); color: var(--bg); }

/* Tertiary · 文本链接按钮 */
.btn-text {
  color: var(--ink); font: 500 14px/1 'Noto Sans SC';
  border-bottom: 1px solid var(--ink); padding-bottom: 2px;
  transition: color .15s, border-color .15s;
}
.btn-text:hover { color: var(--red); border-color: var(--red); }
```

### 4.2 Cards

```css
/* 故事种子卡片（首页核心 component）*/
.seed-card {
  position: relative;
  padding: 28px 24px 24px;
  background: var(--surface);
  border: 1.5px solid var(--ink);
  border-radius: 6px;
  cursor: pointer;
  transition: transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s;
  overflow: hidden;
}
.seed-card::before {                          /* 左上角朱砂角标 */
  content: attr(data-num);
  position: absolute; top: 12px; left: 12px;
  font: 900 11px/1 'JetBrains Mono';
  color: var(--red); letter-spacing: 0.1em;
}
.seed-card::after {                           /* 右下角翻页效果 */
  content: ''; position: absolute; right: 0; bottom: 0;
  width: 20px; height: 20px;
  background: linear-gradient(135deg, transparent 50%, var(--surface-alt) 50%);
  border-top: 1px solid var(--border-soft);
  border-left: 1px solid var(--border-soft);
  transition: width .25s, height .25s;
}
.seed-card:hover {
  transform: translate(-3px, -3px);
  box-shadow: 6px 6px 0 0 var(--ink);
}
.seed-card:hover::after { width: 32px; height: 32px; }

/* 故事书卡片（library 页）*/
.book-card {
  padding: 0;
  background: var(--surface);
  border: 1.5px solid var(--ink);
  border-radius: 4px;
  overflow: hidden;
  transition: transform .25s, box-shadow .25s;
}
.book-card__cover {
  aspect-ratio: 3/4;
  background: var(--surface-alt);
  border-bottom: 1.5px solid var(--ink);
}
.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 0 -2px var(--ink);
}
```

### 4.3 Navigation

```css
.topbar {
  position: sticky; top: 0; z-index: 50;
  display: flex; align-items: center; justify-content: space-between;
  height: 64px; padding: 0 32px;
  background: rgba(var(--bg-rgb), 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-soft);
  transition: border-color .2s;
}
.topbar.scrolled { border-bottom-color: var(--ink); }

.nav-link {
  position: relative;
  font: 500 14px/1 'Noto Sans SC';
  color: var(--ink-secondary);
  padding: 8px 0;
  transition: color .15s;
}
.nav-link::after {
  content: ''; position: absolute; left: 0; bottom: 0;
  width: 0; height: 2px; background: var(--red);
  transition: width .2s ease;
}
.nav-link:hover { color: var(--ink); }
.nav-link:hover::after,
.nav-link[aria-current="page"]::after { width: 100%; }
.nav-link[aria-current="page"] { color: var(--red); }
```

### 4.4 Tags / Badges

```css
.tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px;
  font: 500 11px/1.4 'Noto Sans SC';
  letter-spacing: 0.08em;
  border: 1px solid var(--ink);
  border-radius: 2px;
  background: var(--bg);
}
.tag--red    { background: var(--red); color: var(--ink-on-red); border-color: var(--red); }
.tag--ghost  { background: transparent; }
.tag--finished {                                  /* 已完结印章 */
  background: var(--success); color: var(--bg);
  border-color: var(--success);
  transform: rotate(-3deg);                       /* 像盖上去的章 */
}
```

### 4.5 Story Choice Buttons (创作页核心组件)

```css
.choice {
  position: relative;
  padding: 20px 24px;
  background: var(--surface);
  border: 1.5px solid var(--ink);
  border-radius: 4px;
  text-align: left;
  cursor: pointer;
  transition: all .2s cubic-bezier(.2,.8,.2,1);
}
.choice__num {                                    /* A / B / C */
  position: absolute; top: 16px; right: 20px;
  font: 900 24px/1 'Noto Serif SC';
  color: var(--surface-alt);
  transition: color .2s;
}
.choice__emotion {                                /* 对抗/妥协/转折 */
  font: 500 11px/1 'Noto Sans SC';
  letter-spacing: 0.18em;
  color: var(--red);
  margin-bottom: 8px;
}
.choice__text {
  font: 500 16px/1.6 'Noto Serif SC';
  color: var(--ink);
}
.choice:hover {
  background: var(--red-soft);
  border-color: var(--red);
  transform: translateY(-2px);
}
.choice:hover .choice__num { color: var(--red); }
.choice:focus-visible { outline: 2px solid var(--indigo); outline-offset: 4px; }
.choice--selected {
  background: var(--red);
  border-color: var(--ink);
  color: var(--ink-on-red);
}
.choice--selected .choice__text,
.choice--selected .choice__emotion { color: var(--ink-on-red); }
```

### 4.6 Story Panel (漫画分镜框)

```css
.panel {
  position: relative;
  aspect-ratio: 4/3;
  background: var(--surface);
  border: 2px solid var(--ink);                   /* 漫画分镜框 */
  border-radius: 2px;
  overflow: hidden;
}
.panel--loading {                                 /* 线稿占位状态 */
  background: var(--surface);
  background-image:
    linear-gradient(45deg, transparent 48%, var(--border-soft) 48%, var(--border-soft) 52%, transparent 52%),
    linear-gradient(-45deg, transparent 48%, var(--border-soft) 48%, var(--border-soft) 52%, transparent 52%);
  background-size: 24px 24px;
}
.panel--loading::after {
  content: '正在绘制分镜…';
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font: 400 13px/1 'Noto Serif SC';
  color: var(--ink-tertiary);
  letter-spacing: 0.1em;
  background: rgba(var(--bg-rgb), 0.7);
  backdrop-filter: blur(2px);
}
.panel__caption {                                 /* 分镜下方文字 */
  padding: 12px 14px;
  font: 500 13px/1.6 'Noto Serif SC';
  color: var(--ink);
  background: var(--bg);
  border-top: 1px solid var(--ink);
}
```

### 4.7 Modal / 弹层

```css
.modal-backdrop {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(var(--ink-rgb), 0.55);
  backdrop-filter: blur(4px);
  display: grid; place-items: center;
  padding: 24px;
}
.modal {
  width: 100%; max-width: 480px;
  background: var(--bg);
  border: 1.5px solid var(--ink);
  border-radius: 8px;
  padding: 36px 32px;
  box-shadow: 8px 8px 0 0 var(--ink);
  position: relative;
}
.modal__close {
  position: absolute; top: 16px; right: 16px;
  width: 32px; height: 32px;
  display: grid; place-items: center;
  border: 1px solid var(--ink); border-radius: 50%;
  background: var(--bg); cursor: pointer;
}
```

---

## 5. Layout Principles

**Container**：
- Default max-width：**1280px**，左右内边距 32px（桌面） / 20px（移动）
- Narrow (text-heavy)：**720px**（小说正文专用）
- Wide (创作页)：**1440px**（左文字 + 右分镜布局）

**Spacing Scale**（4 的倍数）：
```
xs   4px      sm   8px       md   16px
lg   24px     xl   32px      2xl  48px
3xl  64px     4xl  96px      5xl  128px
```
- Section 上下间距：96px（桌面）/ 64px（移动）
- 卡片网格 gap：24px
- 卡片内边距：24px-28px
- 文字段落间距：20px

**Grid**：
```css
/* 故事种子网格（首页 10 个）*/
.seed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

/* 创作页双栏（核心布局）*/
.create-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 48px;
  align-items: start;
}
@media (max-width: 1024px) {
  .create-layout { grid-template-columns: 1fr; }
}

/* 故事书网格 */
.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 28px;
}
```

---

## 6. Depth & Elevation

漫想**不用模糊阴影**（破坏纸质感），用**实色偏移阴影**模拟印章压印 / 翻页厚度。

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | 无 | 默认 |
| Stamp | `box-shadow: 4px 4px 0 0 var(--ink)` | 主 CTA、强调卡片 |
| Stamp Lifted | `box-shadow: 6px 6px 0 0 var(--ink)` | hover 态 |
| Page Edge | `box-shadow: 0 8px 0 -2px var(--ink)` | 卡片 hover（书页翘起感）|
| Modal | `box-shadow: 8px 8px 0 0 var(--ink)` | 弹层 |
| Soft Glow | `box-shadow: 0 0 0 4px rgba(199, 62, 58, 0.15)` | focus / 选中态柔和加圈 |

---

## 7. Animation & Interaction

**Motion Philosophy**：动效要像翻页一样自然 —— **没有弹簧、没有过冲**，使用 `cubic-bezier(.2,.8,.2,1)` 这类含蓄的曲线。创作页的打字机和分镜渐显是产品灵魂，必须丝滑。

**Tier**：**L2**（创作页内核接近 L3 — 长 timeline 流式效果）

### Dependencies
```ts
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
```

### 签名动效（6 类硬性要求 · 全部命中）

| 类别 | 实现 | 落点 |
|------|------|------|
| **Text · Hero H1** | 字符 stagger 入场（SplitText 风格，Framer Motion 实现） | 首页 Hero 主标题 |
| **Text · Section H2** | ScrollFloat（滚动触发上浮）| 首页各区段标题 |
| **Text · Body** | **打字机流式输出**（5ms/字，创作页核心）| 创作页小说正文 |
| **元素级** | **Magnet 磁吸** | 首页主 CTA 按钮、剧情走向选项 |
| **Component** | **SeedCard 翻页 hover**（自定义组件） | 首页 10 个故事种子卡片 |
| **Background** | 纸张颗粒噪点 + 朱砂印章漂浮 | 全局底层 |

### Entrance Animations
```ts
// 1. Hero H1 字符 stagger
const charVariants = {
  hidden: { opacity: 0, y: 24, rotate: -3 },
  visible: (i: number) => ({
    opacity: 1, y: 0, rotate: 0,
    transition: { delay: i * 0.04, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }
  })
};

// 2. 故事种子卡片网格 stagger
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.3 + i * 0.06, duration: 0.5 }
  })
};

// 3. 分镜淡入（创作页）
const panelVariants = {
  loading: { opacity: 0.4, filter: 'blur(2px)' },
  ready:   { opacity: 1, filter: 'blur(0px)', transition: { duration: 1.2, ease: 'easeOut' } }
};
```

### Typewriter Stream（创作页核心）
```ts
function useTypewriter(text: string, speedMs = 5) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      if (i >= text.length) { clearInterval(id); return; }
      i += 1;
      setDisplayed(text.slice(0, i));
    }, speedMs);
    return () => clearInterval(id);
  }, [text, speedMs]);
  return displayed;
}
// 配合一个闪烁的「█」光标尾追
```

### Scroll Reveal
```ts
function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}
```

### Magnet（按钮磁吸）
```ts
function Magnet({ children, strength = 0.3 }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <motion.div ref={ref}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        setPos({
          x: (e.clientX - r.left - r.width / 2) * strength,
          y: (e.clientY - r.top - r.height / 2) * strength
        });
      }}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      animate={pos}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}>
      {children}
    </motion.div>
  );
}
```

### 朱砂印章漂浮（首页装饰）
- 三枚半透明朱砂印章 SVG 漂浮在 Hero 区背景，使用 `useScroll` 视差 + 缓慢自转

### Reduced Motion 降级
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  /* 打字机直接显示全文 */
  .typewriter { animation: none !important; }
}
```

---

## 8. Do's and Don'ts

### Do
- ✅ 用 **1-2px 墨黑实线** 表达层次，比阴影更书卷气
- ✅ 主 CTA 配 **实色偏移阴影**（印章压印感）
- ✅ 朱砂红 `--red` 谨慎使用，**每屏不超过 3 处**
- ✅ 中文行高 ≥ 1.7，小说正文行高 1.9
- ✅ 所有可点击元素提供清晰的 `:hover`、`:focus-visible`、`:active` 反馈
- ✅ 创作页打字机配 **闪烁竖线光标**，模拟"正在生成"
- ✅ 卡片 hover 用**位移 + 实色阴影**而非 scale
- ✅ 故事种子卡片右下角带「翻页角标」装饰，强化漫画书隐喻

### Don't
- ❌ **禁止纯黑 #000 + 纯白 #FFF 的高对比** —— 用 `--ink` 和 `--bg` 替代
- ❌ **禁止 box-shadow 的虚化阴影**（如 `0 4px 12px rgba(0,0,0,.1)`）—— 破坏纸质感
- ❌ **禁止系统蓝紫绿** —— 任何 macOS / Material 风格的强调色都破坏调性
- ❌ **禁止毛玻璃 `backdrop-filter: blur(20px)`** 用作主视觉 —— 这是纸不是玻璃
- ❌ **禁止 emoji 作为图标** —— 用 Lucide 线性图标，与墨线风格统一
- ❌ **禁止圆角 ≥ 12px** —— 纸张和印章不应该有大圆角，全局圆角统一为 2-8px
- ❌ **禁止渐变文字** 用在 Hero 之外的地方
- ❌ **禁止三种以上字重并存** —— 400 / 500 / 700 / 900 选 3 个用
- ❌ **禁止 scale hover** —— 改用 translate
- ❌ **禁止小说正文用无衬线** —— 衬线 = 阅读感

---

## 9. Responsive Behavior

**Breakpoints**：

| Name | Width | Key Changes |
|------|-------|-------------|
| Desktop | ≥ 1024px | 完整双栏创作页、4 列故事种子 |
| Tablet | 768-1023px | 创作页改单栏（文字在上、分镜在下）、3 列故事种子 |
| Mobile | < 768px | 单栏、2 列故事种子、底部固定 CTA |
| Small | < 480px | 1 列故事种子、字号缩减 1 档 |

**Touch Targets**：所有可点击元素 ≥ 44×44px
**Topbar**：移动端折叠为汉堡菜单 + Logo + 用户头像

```css
@media (max-width: 1023px) {
  .create-layout { grid-template-columns: 1fr; gap: 32px; }
  .hero-title { font-size: 56px; }
  .seed-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 767px) {
  .hero-title { font-size: 40px; line-height: 1.15; }
  .seed-grid { grid-template-columns: repeat(2, 1fr); }
  .topbar { padding: 0 20px; height: 56px; }
  .modal { padding: 28px 20px; }
}
@media (max-width: 479px) {
  .seed-grid { grid-template-columns: 1fr; }
  .hero-title { font-size: 36px; }
}
```

---

## 10. Page Layouts · 页面布局图

### 10.1 / 首页 `/`

```
┌────────────────────────────────────────────────────────┐
│  [漫想 印章Logo]     首页 · 故事书 · 灵感        [头像] │  ← Topbar 64px
├────────────────────────────────────────────────────────┤
│                                                        │
│             用漫画，实现你的[想象]    ←朱砂印章框关键词  │
│       让每个人都能轻松掌控一个属于自己的故事             │
│                                                        │
│       ┌─────────────────────────────────┐  [开始创作 ●]│
│       │  写下你的故事想法…              │              │
│       └─────────────────────────────────┘              │
│                                                        │
│       —————— 或从故事种子开始 ——————                    │
│                                                        │
│   ┌────┐ ┌────┐ ┌────┐ ┌────┐    ← 10 个故事种子卡片  │
│   │ 01 │ │ 02 │ │ 03 │ │ 04 │      4 列网格            │
│   └────┘ └────┘ └────┘ └────┘                          │
│   ┌────┐ ┌────┐ ┌────┐ ┌────┐                          │
│   │ 05 │ │ 06 │ │ 07 │ │ 08 │                          │
│   └────┘ └────┘ └────┘ └────┘                          │
│   ┌────┐ ┌────┐                                        │
│   │ 09 │ │ 10 │                                        │
│   └────┘ └────┘                                        │
│                                                        │
├────────────────────────────────────────────────────────┤
│  H2: 怎么用                                            │
│   ① 输入想法 → ② AI 同步生成 → ③ 你来选剧情走向         │
│   (三栏示意 + 手绘连接箭头)                            │
├────────────────────────────────────────────────────────┤
│  H2: 看看大家在写什么 (社区故事预览 · 3 张卡)           │
├────────────────────────────────────────────────────────┤
│  Footer: 漫想 © 2026 · 关于 · 联系 · 隐私              │
└────────────────────────────────────────────────────────┘
```

### 10.2 /create 创作页（产品灵魂）

```
┌────────────────────────────────────────────────────────┐
│ [漫想]   故事书   设置          [💾 暂存] [📤导出] [👤]│  ← Topbar
├────────────────────────────────────────────────────────┤
│                                                        │
│  ⌜ 第 1 话 · 觉醒 ⌝                                    │
│                                                        │
│  ┌──────────────────────┬──────────────────────────┐   │
│  │                      │  ┌──────────────┐        │   │
│  │  雨水冲刷着            │  │ 1  高潮分镜    │        │   │
│  │  青石板路，他           │  └──────────────┘        │   │
│  │  握紧匕首…             │  ┌──────────────┐        │   │
│  │  (打字机5ms/字)         │  ┌──────┐  ┌──────┐      │   │
│  │  ▌闪烁光标              │  │ 2  钩子分镜    │        │   │
│  │                       │  └──────────────┘        │   │
│  │  (450-550字)           │                          │   │
│  │                       │                          │   │
│  │  左 1fr               │  右 1.1fr (略大重画面)   │   │
│  └──────────────────────┴──────────────────────────┘   │
│                                                        │
│  ━━━━━━━━━━━━━━━ 接下来 ━━━━━━━━━━━━━━━                 │
│                                                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ A  对抗      │ │ B  妥协      │ │ C  转折      │       │
│  │ 拔刀迎敌…     │ │ 收手退去…     │ │ 发现真相…    │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                        │
│  + 我有自己的想法 (付费 · 上方加 🔒 图标)                │
│                                                        │
├────────────────────────────────────────────────────────┤
│  Footer: 今日还可生成 2 话 · 分享得次数                  │
└────────────────────────────────────────────────────────┘
```

### 10.3 /auth 注册引导（弹层）

```
       ┌─────────────────────────────────┐
       │   ✕                              │
       │                                  │
       │   [朱砂印章 Logo]                │
       │                                  │
       │   你的第一话故事已生成            │
       │   注册账号永久保存                │
       │                                  │
       │   ┌────────────────────────────┐ │
       │   │ 手机号 / 邮箱              │ │
       │   └────────────────────────────┘ │
       │   ┌─────────────────┐ ┌──────┐  │
       │   │ 验证码          │ │获取  │  │
       │   └─────────────────┘ └──────┘  │
       │                                  │
       │   [ 完成注册并继续 ]              │  ← Primary 印章按钮
       │                                  │
       │   稍后再说 →                     │  ← btn-text
       └─────────────────────────────────┘
```

### 10.4 /library 我的故事书

```
┌────────────────────────────────────────────────────────┐
│  Topbar                                                │
├────────────────────────────────────────────────────────┤
│  H1: 我的故事书                                         │
│  共 6 本故事 · 3 本进行中 · 3 本已完结                  │
│                                                        │
│  [全部] [进行中] [已完结]   ← Tab 切换                  │
│                                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│  │      │ │      │ │      │ │      │                  │
│  │ 封面 │ │ 封面 │ │ 封面 │ │ 封面 │  ← book-card     │
│  │      │ │      │ │      │ │      │                  │
│  ├──────┤ ├──────┤ ├──────┤ ├──────┤                  │
│  │失忆刺│ │末代公│ │深海考│ │ + 新 │                  │
│  │客 12 │ │主 8  │ │古 完 │ │ 故事 │                  │
│  │话进行│ │话进行│ │结    │ │      │                  │
│  └──────┘ └──────┘ └──────┘ └──────┘                  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 10.5 /settings 个人设置 + 订阅

```
┌────────────────────────────────────────────────────────┐
│  Topbar                                                │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ◀ 返回    个人设置                                     │
│                                                        │
│  [侧栏导航 200px ]    [右侧内容 600px ]                │
│  · 账号资料           ┌─ 当前订阅 ───────────┐         │
│  · 订阅与计费         │ 免费用户             │         │
│  · 偏好设置           │ 今日剩余 2/3 话      │         │
│  · 隐私与安全         │ [ 升级解锁无限 ] →   │         │
│                       └──────────────────────┘         │
│                                                        │
│                       ┌─ 套餐选择 ──────────┐          │
│                       │ ○ 首月 ¥19           │          │
│                       │ ● 月付 ¥39           │          │
│                       │ ○ 年付 ¥299 (省36%)  │          │
│                       └──────────────────────┘          │
│                                                        │
│                       [ 立即升级 ]                      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 11. Route Map · 跳转路径

```
                                ┌─→ /create?seed=N    ──┐
   /  首页 ─┬─ 输入框提交 ─────→  /create?prompt=...   ─┤
            │                                            │
            └─ 顶栏点击「故事书」 ──→ /library            │
                                                         ▼
   /create  ─┬─ 第一话生成完毕 ──→ [注册弹层] ─→ /auth   │
            ├─ 点击「导出」 ─────→ [导出预览弹层]        │
            ├─ 顶栏头像 ─────────→ /settings             │
            └─ 顶栏「故事书」 ───→ /library              │
                                                         │
   /library ─┬─ 故事卡片点击 ────→ /create?storyId=X ───┘
            └─ 「+ 新故事」 ─────→ /  首页

   /settings ─ 升级订阅 ──→ [订阅 Modal] ─ 完成 ──→ /create
```

---

## 12. 关键交互细节备忘

1. **打字机字符切片必须按字（不按字节）切**：`Array.from(text)` 而非 `text.split('')`
2. **分镜淡入有阶段**：
   - 0-0.4s 灰底线稿
   - 0.4-1.2s 线稿 → 灰度图
   - 1.2-1.8s 灰度 → 最终图（淡入 blur 0→0）
3. **三个剧情选项必须延迟到打字机+分镜全部完成后再出现**（Framer Motion stagger 1.5s after text complete）
4. **第一话完成后 1.5s 弹注册引导**（不强制，可关）
5. **第 15 话后顶部出现 "考虑给故事一个结局?" 软提示**（dismissable）
6. **导出预览**：弹层内用 canvas 实时拼接当前话的分镜 + 文字 + 水印 logo，竖版 800×1600 比例

---

## 13. Mock Data Structure

```ts
// lib/mock/seeds.ts
export const SEEDS = [
  { id: 's01', title: '失忆刺客', desc: '一个失忆的刺客，在执行任务时发现目标是过去的自己' },
  { id: 's02', title: '末代公主', desc: '末代公主决定假扮平民，混入推翻王朝的革命军' },
  { id: 's03', title: '深海考古', desc: '深海考古队在海底发现了一座仍在运转的古代城市' },
  { id: 's04', title: '我演反派', desc: '我扮演反派扮了太久，开始真的相信自己是坏人了' },
  { id: 's05', title: '陌生哀客', desc: '她死后才发现，葬礼上来了一个陌生人，知道她所有的秘密' },
  // ... 共 10 条
];

// lib/mock/stories.ts
export const STORIES = {
  's01': {
    title: '失忆的刺客',
    chapters: [
      {
        no: 1,
        title: '雨夜',
        text: '雨水冲刷着青石板路…(约 500 字完整正文)',
        panels: [{ beat: 'CLIMAX', caption: '...', svg: <SVG 线稿> }, { beat: 'HOOK', caption: '...', svg: <SVG 线稿> }],
        choices: [
          { emotion: '对抗', text: '他举刀冲向倒地的目标' },
          { emotion: '妥协', text: '他低头退后，转身离去' },
          { emotion: '转折', text: '他发现目标戴着自己的项链' },
        ]
      },
      { no: 2, ... }
    ]
  },
  's02': { ... }
};
```

---

## 致谢

Motion effects derived from [vue-bits / reactbits](https://github.com/DavidHDev/vue-bits) by DavidHDev (MIT).
