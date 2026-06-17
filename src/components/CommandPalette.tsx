'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, FolderOpen, Calculator, ArrowLeftRight } from 'lucide-react'

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    function down(e: KeyboardEvent) {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    setQuery('')
    setResults([])
  }, [open])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true)
      const [{ data: projects }, { data: transactions }] = await Promise.all([
        supabase.from('projects').select('id, name').ilike('name', `%${query}%`).limit(5),
        supabase.from('transactions').select('id, description, transaction_type, project_id, projects:project_id(name)').ilike('description', `%${query}%`).limit(5)
      ])
      const items = [
        ...(projects || []).map(p => ({ ...p, type: 'project', icon: FolderOpen, href: `/projects` })),
        ...(transactions || []).map(t => ({ ...t, type: 'transaction', icon: Calculator, href: `/budget-control` })),
      ]
      setResults(items)
      setLoading(false)
    }, 200)
    return () => clearTimeout(t)
  }, [query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm p-4"
      onClick={() => setOpen(false)}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="w-5 h-5 text-gray-400" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="ค้นหาโครงการ, รายการ... (Ctrl+K)"
            className="flex-1 text-sm outline-none bg-transparent" />
          <kbd className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {loading && <p className="text-sm text-gray-400 text-center py-4">กำลังค้นหา...</p>}
          {!loading && query.length < 2 && (
            <div className="text-sm text-gray-400 text-center py-8">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา
            </div>
          )}
          {!loading && results.length === 0 && query.length >= 2 && (
            <p className="text-sm text-gray-400 text-center py-8">ไม่พบผลลัพธ์</p>
          )}
          {results.map((item, i) => (
            <button key={i} onClick={() => { router.push(item.href); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition">
              <item.icon className="w-4 h-4 text-gray-400" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {item.type === 'project' ? item.name : item.description || 'รายการ'}
                </p>
                <p className="text-xs text-gray-400">
                  {item.type === 'project' ? 'โครงการ' : item.projects?.name || item.transaction_type}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
