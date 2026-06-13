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

## 5. 工具工作区 UI 规范 (Tool Workspace Pattern)

所有独立工具页面（如 ASCII 字符画、3D 贴纸等）统一采用以下全屏沉浸式布局，称为 **App Layout** 模式。

### 5.1 App Layout 声明

组件文件末尾必须标记 `ComponentName.isAppLayout = true`，以告知 `ToolPage.jsx` 跳过默认的页头/页脚/间距渲染，直接让工具组件接管整个可视区域。

### 5.2 整体结构

```
┌─────────────────────────────────────────────┐
│  Header Bar  (h-14 / md:h-16)              │
├──────────────┬──────────────────────────────┤
│  Sidebar     │  Main Canvas / Preview      │
│  (lg:w-72)   │  (flex-1)                   │
│              │                              │
│  Controls    │                              │
│  Upload Zone │                              │
│  ──────────  │                              │
│  Actions     │                              │
└──────────────┴──────────────────────────────┘
```

### 5.3 Header Bar

| 属性 | 值 |
|------|----|
| 高度 | `h-14 md:h-16` |
| 背景 | `bg-[#0a0a0f]` |
| 底线 | `border-b border-white/5` |
| 内边距 | `px-6` |
| 层级 | `z-20` |
| 内容 | 左侧：返回按钮 (`<ArrowLeft>` + "返回") + 分隔竖线 + 工具标题 |

### 5.4 侧边栏 (Sidebar / Aside)

| 属性 | 值 |
|------|----|
| 宽度 | `w-full lg:w-72` |
| 背景 | `bg-[#0d0d12]` |
| 右侧边线 | `border-r border-white/5` |
| 内边距 | `p-6` |
| 溢出 | `overflow-y-auto` + `custom-scrollbar` |
| 控件间距 | `flex flex-col gap-6` |

#### 控件元素样式

- **标签 (Label)**：`dcde-caption text-ink-faint block mb-3`
- **滑块 (Range)**：`accentColor: 'var(--color-accent)'`，右侧带 `font-mono` 数值显示
- **文本输入框**：`bg-[#18181b] text-ink rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-ink-dim`
- **按钮组 (切换)**：使用 `dcde-tag-accent` / `dcde-tag-muted` 配对
- **预设按钮行**：`flex flex-wrap gap-1.5`，单个预设为 `px-2.5 py-1 rounded-md text-xs font-medium`
- **分隔线**：`dcde-rule-solid`

#### 拖拽重新上传区

放置在侧边栏控件下方，样式为虚线边框区域：
```
border-2 border-dashed border-white/10 hover:border-white/30
rounded-xl py-6 px-4 cursor-pointer
```
图标使用 `<ImagePlus>`，文案 "点击或拖拽新图片"。同时兼容 `onDragOver/onDragLeave/onDrop` 和 `onClick` 两种上传方式。

#### 操作按钮

- **主操作 (导出)**：`dcde-pill w-full justify-center`
- **次要操作 (复制等)**：`dcde-tag-muted w-full justify-center`

### 5.5 主预览区 (Canvas / Preview Area)

| 属性 | 值 |
|------|----|
| 布局 | `flex-1`，`overflow-hidden`，`min-w-0 min-h-0` |
| 背景 | `bg-[#18181b]` 或 `backgroundColor: '#18181b'` |
| 交互 | 视工具而定（拖拽平移、滚轮缩放、指针旋转等） |
| 光标 | 默认 `cursor-grab`，拖拽中 `cursor-grabbing` |
| 右上角浮动控件 | 使用 `.controls-panel absolute top-6 right-6 z-20` 放置适应屏幕、全屏等按钮 |

### 5.6 初始上传视图 (Upload View)

当用户尚未上传文件时，整个工具区域显示为居中的上传引导：

```
flex-1 flex items-center justify-center
```

内部为一个 `max-w-lg` 的虚线边框容器，支持拖拽和点击上传：
```
rounded-3xl border-2 border-dashed p-12
hover: border-ink-dim/50
dragOver: border-accent bg-accent-pale
```

### 5.7 隐藏文件输入 (Hidden File Input)

`<input type="file">` 元素放在 Header 下方（条件渲染外部），设置 `className="hidden"`，通过 `ref` 被上传区域的 click 事件触发。

### 5.8 导出弹窗 (Export Modal)

所有涉及图片导出的工具，必须使用统一的导出弹窗组件模式，而非直接触发下载。弹窗在用户点击"导出 PNG"按钮后弹出，提供尺寸设置、预览和确认操作。

#### 弹窗结构

```
┌──────────────────────────────────────┐
│  导出 PNG                      [×]   │  ← 标题 + 关闭按钮
│                                      │
│         ┌──────────┐                 │  ← 等比缩略预览框
│         │ Preview  │                 │
│         └──────────┘                 │
│    宽 × 高 px · 约 XX MB            │  ← 尺寸与文件大小信息
│                                      │
│  快捷倍率                            │
│  [ 1× ] [ 2× ] [ 4× ] [ 8× ]       │  ← 预设倍率按钮
│                                      │
│  宽度        🔒        高度          │  ← 宽高输入 + 比例锁定
│  [____px]  [Lock]  [____px]         │
│                                      │
│  ⚠ 错误提示（仅在有错误时显示）       │
│                                      │
│  Enter 确认 · Esc 取消   [取消][导出]│  ← 快捷键提示 + 操作按钮
└──────────────────────────────────────┘
```

#### 弹窗样式

| 属性 | 值 |
|------|----|
| 遮罩 | `fixed inset-0 z-50 bg-black/60 backdrop-blur-sm` |
| 容器 | `bg-[#0d0d12] border border-white/10 rounded-2xl max-w-md shadow-2xl` |
| 关闭方式 | 点击遮罩 / Esc 键 / 关闭按钮 |
| 输入框焦点色 | `focus:ring-accent/60`（区别于侧边栏的 `focus:ring-ink-dim`） |

#### 交互行为

- **比例锁定**：默认锁定（`lockRatio: true`），锁定时改宽度自动联动高度，反之亦然。中间按钮使用 `<Lock>` / `<Unlock>` 图标切换。
- **快捷倍率**：基于原始画布尺寸的 1×/2×/4×/8× 倍率，一键设置宽高。
- **实时预览**：`useMemo` 计算等比缩略框尺寸和估算文件大小（`宽×高×4×0.3 / 1024²`），随输入实时更新。
- **输入验证**：宽高范围 10~16384px，超出范围显示红色错误提示并禁用导出按钮。
- **键盘快捷键**：Esc 关闭弹窗；底部显示快捷键提示文案。
- **自动聚焦**：弹窗打开后自动聚焦宽度输入框并全选，方便直接修改。

#### 状态管理

```js
const [showExportModal, setShowExportModal] = useState(false)
const [exportWidth, setExportWidth] = useState(0)
const [exportHeight, setExportHeight] = useState(0)
const [lockRatio, setLockRatio] = useState(true)
const [exportError, setExportError] = useState('')
const exportRatioRef = useRef(1)       // 原始宽高比
const exportModalRef = useRef(null)     // 弹窗容器 ref
const exportWidthInputRef = useRef(null) // 宽度输入 ref（用于自动聚焦）
```

### 5.9 右上角浮动控件 (Canvas Controls)

主预览区右上角放置浮动控件组，用于视图控制：

```jsx
<div className="controls-panel absolute top-6 right-6 flex items-center gap-2 z-20">
  {/* 适应屏幕 */}
  <button className="dcde-pill bg-void/50 backdrop-blur-md hover:bg-void text-ink border border-white/10">
    <Focus />
  </button>
  {/* 全屏切换 */}
  <button className="dcde-pill bg-void/50 backdrop-blur-md hover:bg-void text-ink border border-white/10">
    <Maximize /> / <Minimize />
  </button>
</div>
```

- 必须添加 `controls-panel` 类名，以便预览区的拖拽事件可以排除该区域（`e.target.closest('.controls-panel')`）。
- 按钮使用半透明毛玻璃样式，不遮挡预览内容。

