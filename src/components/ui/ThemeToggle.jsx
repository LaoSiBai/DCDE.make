import { Sun, Moon } from 'lucide-react'

export function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-10 h-10 flex items-center justify-center rounded-full border border-dcde-border bg-dcde-base-dark/50 text-dcde-text-primary hover:border-dcde-accent hover:text-dcde-accent transition-all duration-300"
      aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
    >
      <div className="relative w-5 h-5">
        <Sun
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
          }`}
        />
        <Moon
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
          }`}
        />
      </div>
    </button>
  )
}
