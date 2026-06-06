import { useState, useMemo } from 'react'
import { tools } from '../data/tools.registry.js'

export function useToolSearch() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredTools = useMemo(() => {
    let result = tools
    if (activeCategory !== 'all') {
      result = result.filter((t) => t.category === activeCategory)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.nameEn.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      )
    }
    return result
  }, [query, activeCategory])

  return {
    query,
    setQuery,
    activeCategory,
    setActiveCategory,
    filteredTools,
  }
}
