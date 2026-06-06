export default function Footer() {
  return (
    <footer className="border-t border-dcde-border mt-auto">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-dcde-text-secondary font-mono">
            DCDE·make — 视觉设计师工具合集
          </p>
          <p className="text-xs text-dcde-text-secondary/50 font-mono">
            © {new Date().getFullYear()} DCDE. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
