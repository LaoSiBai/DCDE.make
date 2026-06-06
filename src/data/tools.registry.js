export const categories = [
  { id: 'all', label: '全部' },
  { id: 'color', label: '色彩' },
  { id: 'layout', label: '布局' },
  { id: 'typography', label: '字体' },
  { id: 'asset', label: '素材' },
  { id: 'accessibility', label: '无障碍' },
]

export const tools = [
  {
    id: 'color-converter',
    name: '色彩转换器',
    nameEn: 'Color Converter',
    category: 'color',
    description: 'HEX / RGB / HSL / OKLCH 多格式互转，实时预览对比',
    descriptionEn: 'Convert between HEX, RGB, HSL and OKLCH with live preview',
    featured: true,
    span: 'col-span-2 row-span-2',
  },
  {
    id: 'grid-system',
    name: '网格系统',
    nameEn: 'Grid System',
    category: 'layout',
    description: '可视化生成响应式网格，导出 CSS Grid 代码',
    descriptionEn: 'Generate responsive grid layouts and export CSS Grid code',
    featured: false,
    span: 'col-span-1 row-span-1',
  },
  {
    id: 'type-scale',
    name: '字体比例',
    nameEn: 'Type Scale',
    category: 'typography',
    description: '基于数学比例的字体层级生成器',
    descriptionEn: 'Generate type hierarchies based on mathematical ratios',
    featured: true,
    span: 'col-span-1 row-span-2',
  },
  {
    id: 'aspect-ratio',
    name: '比例计算器',
    nameEn: 'Aspect Ratio',
    category: 'layout',
    description: '常用画面比例换算与容器适配',
    descriptionEn: 'Calculate aspect ratios and container fittings',
    featured: false,
    span: 'col-span-1 row-span-1',
  },
  {
    id: 'contrast-checker',
    name: '对比度检查',
    nameEn: 'Contrast Checker',
    category: 'accessibility',
    description: 'WCAG 标准下的色彩对比度即时检测',
    descriptionEn: 'Instant WCAG contrast ratio checking',
    featured: false,
    span: 'col-span-1 row-span-1',
  },
  {
    id: 'svg-placeholder',
    name: '占位图形',
    nameEn: 'SVG Placeholder',
    category: 'asset',
    description: '生成自定义 SVG 占位符与图案背景',
    descriptionEn: 'Generate custom SVG placeholders and pattern backgrounds',
    featured: true,
    span: 'col-span-2 row-span-1',
  },
  {
    id: 'spacing-token',
    name: '间距令牌',
    nameEn: 'Spacing Token',
    category: 'layout',
    description: '基于斐波那契或 4pt 体系的间距系统生成',
    descriptionEn: 'Generate spacing systems based on Fibonacci or 4pt grid',
    featured: false,
    span: 'col-span-1 row-span-1',
  },
  {
    id: 'gradient-lab',
    name: '渐变实验室',
    nameEn: 'Gradient Lab',
    category: 'color',
    description: '多色阶渐变生成与 CSS 导出',
    descriptionEn: 'Multi-stop gradient generator with CSS export',
    featured: false,
    span: 'col-span-1 row-span-1',
  },
]

export function getToolById(id) {
  return tools.find((t) => t.id === id)
}

export function getToolsByCategory(categoryId) {
  if (categoryId === 'all') return tools
  return tools.filter((t) => t.category === categoryId)
}
