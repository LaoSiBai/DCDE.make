import { Search } from 'lucide-react'
import { useState } from 'react'

export function SearchBar() {
  const [focused, setFocused] = useState(false)

  return (
    <div
      className={`relative flex items-center h-10 rounded-full border transition-all duration-300 ${
        focused
          ? 'border-dcde-accent bg-dcde-base-dark/80 w-64'
          : 'border-dcde-border bg-dcde-base-dark/50 w-10 lg:w-48'
      }`}
    >
      <Search className="absolute left-3 w-4 h-4 text-dcde-text-secondary pointer-events-none" />
      <input
        type="text"
        placeholder="搜索工具..."
        className="w-full h-full pl-10 pr-4 bg-transparent text-sm text-dcde-text-primary placeholder:text-dcde-text-secondary outline-none rounded-full"
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.target.value) setFocused(false)
        }}
      />
    </div>
  )
}
