export default function Footer() {
  return (
    <footer className="bg-ink text-canvas-soft" style={{ padding: 'var(--spacing-section) var(--spacing-page)' }}>
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="dcde-display-xs text-primary mb-2">DCDE·make</p>
            <p className="dcde-body-sm text-mute">
              为视觉设计师打造的工具合集
            </p>
          </div>
          <div className="flex items-center gap-8">
            <a href="https://dcde.club" target="_blank" rel="noopener noreferrer" className="dcde-body-sm-strong text-canvas-soft hover:text-primary transition-colors">
              DCDE 官网
            </a>
            <a href="mailto:hello@dcde.club" className="dcde-body-sm-strong text-canvas-soft hover:text-primary transition-colors">
              联系我们
            </a>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-canvas-soft/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="dcde-caption text-mute">
            © {new Date().getFullYear()} DCDE. All rights reserved.
          </p>
          <p className="dcde-caption text-mute">
            Designed by DCDE
          </p>
        </div>
      </div>
    </footer>
  )
}
