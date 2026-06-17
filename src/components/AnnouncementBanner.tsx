'use client'

import { useState, useEffect } from 'react'
import { getAnnouncements } from '@/lib/api/announcements'
import { Megaphone, Info, AlertTriangle, CheckCircle, X, ChevronDown, ChevronRight } from 'lucide-react'

const typeIcons: Record<string, any> = {
  info: Info, warning: AlertTriangle, success: CheckCircle, error: AlertTriangle
}
const typeColors: Record<string, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
}

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    getAnnouncements().then(data => {
      if (data?.length) setAnnouncements(data)
    }).catch(() => {})
  }, [])

  if (!visible || announcements.length === 0) return null

  return (
    <div className="mb-6 space-y-2">
      {announcements.map(a => {
        const Icon = typeIcons[a.type] || Megaphone
        const isOpen = expanded.has(a.id)
        const long = (a.content || '').length > 80

        return (
          <div key={a.id} className={`rounded-xl border px-4 py-3 ${typeColors[a.type] || typeColors.info} relative`}>
            <div className="flex items-start gap-3">
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{a.title}</span>
                  <span className="text-[10px] opacity-60">{new Date(a.created_at).toLocaleDateString('th-TH')}</span>
                </div>
                {long && !isOpen ? (
                  <p className="text-sm mt-1 opacity-80 line-clamp-1">{a.content}</p>
                ) : (
                  <p className="text-sm mt-1 opacity-80 whitespace-pre-wrap">{a.content}</p>
                )}
                {long && (
                  <button onClick={() => {
                    setExpanded(prev => {
                      const next = new Set(prev)
                      if (next.has(a.id)) next.delete(a.id)
                      else next.add(a.id)
                      return next
                    })
                  }} className="text-xs mt-1 opacity-60 hover:opacity-100 flex items-center gap-0.5">
                    {isOpen ? <><ChevronDown className="w-3 h-3" /> ย่อ</> : <><ChevronRight className="w-3 h-3" /> อ่านต่อ</>}
                  </button>
                )}
              </div>
              <button onClick={() => {
                setAnnouncements(prev => prev.filter(x => x.id !== a.id))
                if (announcements.length <= 1) setVisible(false)
              }} className="p-0.5 hover:bg-black/5 rounded -mt-0.5 -mr-1 flex-shrink-0">
                <X className="w-3.5 h-3.5 opacity-50" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
