'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, ArrowRight, Loader2, CornerDownLeft, FolderOpen, ArrowUpRight } from 'lucide-react'

interface SearchResult {
  type: 'project' | 'transaction'
  id: string
  title: string
  subtitle: string
  badge: string
  url: string
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Load org info
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        setIsDemo(true)
        return
      }
      supabase.from('profiles').select('active_organization_id').eq('id', session.user.id).single()
        .then(({ data }) => {
          if (data?.active_organization_id) setOrgId(data.active_organization_id)
          else setIsDemo(true)
        })
        .catch(() => setIsDemo(true))
    })
  }, [])

  // Ctrl+K / Cmd+K toggle
  useEffect(() => {
    function down(e: KeyboardEvent) {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName))) {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Reset on open
  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    setQuery('')
    setResults([])
    setSelectedIndex(0)
  }, [open])

  // Search
  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)

    if (isDemo) {
      // Demo search — local
      const demoProjects = [
        { type: 'project' as const, id: 'demo-1', title: 'ปรับปรุงห้องสมุด', subtitle: 'PRJ-001 — งบ 150,000 บาท', badge: '🟢', url: '/projects' },
        { type: 'project' as const, id: 'demo-2', title: 'พัฒนาสื่อการสอนดิจิทัล', subtitle: 'PRJ-002 — งบ 80,000 บาท', badge: '🟢', url: '/projects' },
        { type: 'project' as const, id: 'demo-3', title: 'ซ่อมแซมอาคารเรียน', subtitle: 'PRJ-003 — งบ 200,000 บาท', badge: '📋', url: '/projects' },
        { type: 'transaction' as const, id: 'demo-t1', title: 'ซื้อหนังสือห้องสมุด', subtitle: '💸 -12,500 บาท · 15 มิ.ย. 2569', badge: '💸', url: '/projects' },
        { type: 'transaction' as const, id: 'demo-t2', title: 'เงินจัดสรรจาก สพฐ.', subtitle: '💰 +50,000 บาท · 1 มิ.ย. 2569', badge: '💰', url: '/projects' },
      ]
      const qLower = q.toLowerCase()
      setResults(demoProjects.filter(r => r.title.toLowerCase().includes(qLower) || r.subtitle.toLowerCase().includes(qLower)).slice(0, 10))
      setLoading(false)
      return
    }

    if (!orgId) { setResults([]); setLoading(false); return }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&org_id=${orgId}`)
      const data = await res.json()
      setResults(data.results || [])
      setSelectedIndex(0)
    } catch {
      setResults([])
    }
    setLoading(false)
  }, [orgId, isDemo])

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 200)
    return () => clearTimeout(timeout)
  }, [query, search])

  const navigate = (url: string) => {
    setOpen(false)
    router.push(url)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      navigate(results[selectedIndex].url)
    }
  }

  const projects = results.filter(r => r.type === 'project')
  const transactions = results.filter(r => r.type === 'transaction')
  const flatResults = [...projects, ...transactions]

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="fixed inset-x-0 top-[15%] mx-auto max-w-xl px-4">
        <div
          className="bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            {loading ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-gray-400" />
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ค้นหาโครงการ รายการธุรกรรม..."
              className="flex-1 outline-none text-base text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-transparent"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 font-mono">
              <CornerDownLeft className="w-3 h-3" /> เลือก
            </kbd>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <kbd className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 font-mono">Esc</kbd>
            </button>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {query.length >= 2 && results.length === 0 && !loading && (
              <div className="py-12 text-center">
                <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">ไม่พบผลลัพธ์สำหรับ <strong>&quot;{query}&quot;</strong></p>
              </div>
            )}

            {query.length < 2 && (
              <div className="py-12 text-center">
                <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 dark:text-gray-500 text-sm">พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา</p>
              </div>
            )}

            {flatResults.length > 0 && (
              <div>
                {projects.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-800/50">
                      📁 โครงการ ({projects.length})
                    </div>
                    {projects.map((r, i) => (
                      <button
                        key={r.id}
                        onClick={() => navigate(r.url)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                          selectedIndex === i
                            ? 'bg-purple-50 dark:bg-purple-900/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                        onMouseEnter={() => setSelectedIndex(i)}
                      >
                        <span className="text-lg">{r.badge}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{r.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.subtitle}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {transactions.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                      💰 ธุรกรรม ({transactions.length})
                    </div>
                    {transactions.map((r, i) => {
                      const idx = projects.length + i
                      return (
                        <button
                          key={r.id}
                          onClick={() => navigate(r.url)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                            selectedIndex === idx
                              ? 'bg-purple-50 dark:bg-purple-900/30'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                          onMouseEnter={() => setSelectedIndex(idx)}
                        >
                          <span className="text-lg">{r.badge}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{r.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.subtitle}</p>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
