import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-[100dvh]" style={{ padding: '0 var(--spacing-page)' }}>
      <div className="pt-20 pb-12">
        <Link to="/" className="dcde-ghost text-ink-dim hover:text-accent mb-8 inline-flex">
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>
        <h1 className="dcde-mega text-ink mt-4">关于</h1>
      </div>

      <div className="dcde-rule-solid mb-12" />

      <div className="max-w-3xl pb-24">
        <p className="dcde-xl text-ink-dim mb-12" style={{ lineHeight: 1.4 }}>
          DCDE·make 是 DCDE 为视觉设计师打造的工具合集。<br />
          我们相信，好的工具应该像好的设计一样——精确、直觉、没有多余的噪音。
        </p>

        <div className="space-y-8">
          {[
            { title: '精确性优先', desc: '每一个像素、每一个数值都应该被精确控制' },
            { title: '即时反馈', desc: '所见即所得，没有任何延迟或猜测' },
            { title: '可访问性', desc: '工具本身就应该成为无障碍设计的典范' },
            { title: '开放透明', desc: '开源、可审查、可扩展' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2.5 flex-shrink-0" />
              <div>
                <h3 className="dcde-lg text-ink mb-1">{item.title}</h3>
                <p className="dcde-body text-ink-dim">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
