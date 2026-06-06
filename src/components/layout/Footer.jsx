export default function Footer() {
  return (
    <footer className="border-b-2 border-border mt-auto" style={{ marginTop: 'var(--spacing-gap-lg)' }}>
      <div className="max-w-[1440px] mx-auto py-8" style={{ padding: '2rem var(--spacing-page-margin)' }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="dcde-text-xs text-grey-text">
            DCDE·make — 视觉设计师工具合集
          </p>
          <p className="dcde-text-xs text-grey-light">
            © {new Date().getFullYear()} DCDE. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
