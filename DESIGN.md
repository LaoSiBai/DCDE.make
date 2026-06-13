# DESIGN.md — DCDE·make 设计系统与界面规范

本文档维护了 DCDE·make 项目的所有 UI/UX、动效规范和文案基调。开发前端组件时，请务必遵循以下指南。

## 1. 文案基调与风格 (Tone & Copywriting)

- **核心风格**：年轻、轻松随意、独立开发者气质，直接且纯粹（如：“造点顺手的视觉小工具”）。
- **禁忌**：坚决避免死板、严肃、传统 B2B 企业的宣发术语。话少一点，干练一些。
- **语言支持**：目前采取双语存储（中文为主，英文辅助 `nameEn`/`descriptionEn`）。

## 2. Tailwind v4 配置说明

- 真正的**设计主题与变量定义**在 `src/index.css` 的 `@theme` 层级下（包括颜色、字体、间距、贝塞尔曲线）。
- **不要去修改** `tailwind.config.js` 或 `postcss.config.js`（两者均已配置为空壳或 no-op）。Tailwind 通过 `vite.config.js` 中的 `@tailwindcss/vite` 插件运行。
- 所有全局性的自定义组件类名，均定义在 `src/index.css` 的 `@layer components` 或 `@layer base` 中。

## 3. 设计系统与 `dcde-*` 类

为了保证多处的一致性，系统级的 UI 元素一律使用前缀为 `dcde-*` 的类名。

### 全局排版 (Typography)
- **全局英文字体**：全站所有的英文字体强制使用 **Space Grotesk**（通过 `--font-family-body` 和 `--font-family-display` 统一映射）。

| Class | 适用场景 | 尺寸定义 |
|-------|---------|---------|
| `.dcde-mega` | 超大展示标题 | 极端比例，`clamp(40px, 12vw, 140px)` |
| `.dcde-xl` | 大标题 | `clamp(28px, 6vw, 72px)` |
| `.dcde-lg` | 中号标题 | `clamp(20px, 4vw, 40px)` |
| `.dcde-body` | 正文文本 | `clamp(14px, 1.4vw, 18px)` |
| `.dcde-caption` | 小号大写标签 | 12px, 宽字距 (tracking-widest) |

### 5 层交互层级体系 (Interactive Hierarchy)

交互状态严格划分层级，切勿越级滥用样式：

| 层级 | 对应类名 | 交互角色与特点 |
|------|-------|------|
| 1 — 主操作 | `.dcde-pill` | 全局最主要的行动点（如“开始折腾”按钮）。白字配强调色背景，**不要**在 Hover 时改变 Y 轴位移（更显严肃稳重），仅保留点击（Active）时的缩放。 |
| 2 — 激活态 | `.dcde-tag-accent` | 选中状态的小胶囊。同样使用白字（`--color-ink`）。 |
| 3 — 未激活 | `.dcde-tag-muted` | 未选中的状态开关，通常与激活态配合使用。 |
| 4 — 导航 | `.dcde-nav` | 顶栏导航链接等，热区宽大，无背景色。 |
| 5 — 纯信息 | `.dcde-badge` | 纯展示用的信息块，**绝对不可交互**。 |

### 其他常用工具类 (Utilities)

| Class | 作用 |
|-------|---------|
| `.dcde-rule` | 渐变分割线（`transparent → faint → transparent`） |
| `.dcde-rule-solid` | 纯色极细分割线 |
| `.dcde-index` | 列表前缀编号（如 01, 02…） |
| `.dcde-blur-fade-in` | 基于纯 CSS 的模糊浮现入场 |

## 4. 动效规范 (Animation Conventions)

动效引擎主要使用 **GSAP 3** 结合 React 的 `useGSAP` 钩子。

### 贝塞尔曲线 (Easing)

- **Apple Fluid Motion (苹果流体动效)**: `cubic-bezier(0.16, 1, 0.3, 1)`（已内置为 CSS 变量 `--ease-apple`）。
- **点击/激活回弹**: `cubic-bezier(0.15, 0.85, 0.35, 1)`（`--ease-apple-active`）。
- GSAP 入场默认 Ease: `'expo.out'`。

### GSAP 踩坑必读与模式要求

1. **绝对禁止 GSAP 与 CSS 过渡打架**：
   当使用 GSAP 对一组元素（如卡片 Stagger）进行 `opacity` 或 `transform` 的入场动画控制时，**元素上千万不要带有 Tailwind 的 `transition-all` 类**。
   *原因*：GSAP 在 LayoutEffect 中通过内联样式瞬间设定的起始帧，会被 CSS transition 拦截并拉长为几百毫秒的渐变，导致页面刚刷出来时元素“先闪现、再消失、最后才动画载入”的恶性 FOUC (Flash of Unstyled Content) 穿帮 Bug。
   *解决*：改为具体声明，如 `transition-colors` 等。

2. **隐形边界判定 (`autoAlpha` 原则)**：
   对于那些需要 Hover 才会向外展开、或者渐渐浮现的复杂容器（例如 `HeroAction.jsx` 胶囊按钮向右延伸出的快捷入口），隐藏状态下**不要**只用 `opacity: 0`。必须使用 GSAP 的 `autoAlpha: 0`（它等价于 `visibility: hidden` 加上透明度 0）。
   *原因*：纯透明但未改变 visibility 的节点，依然会拦截鼠标指针事件，造成幽灵区域触发 Hover 动画的 Bug。

3. **减弱动画偏好 (Reduced Motion)**：
   运行任何核心 GSAP Timeline 前必须检测用户的生理偏好。一旦检测到偏好减少动画，直接使用 `gsap.set()` 将元素初始化到最终可见的静态状态并 `return`。

4. **严格的内存回收**：
   使用 `@gsap/react` 时，必须传入正确的 `scope` (比如 `listRef`)。
