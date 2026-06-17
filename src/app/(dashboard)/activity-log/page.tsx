'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, Calculator, FileText, ArrowLeftRight } from 'lucide-react'
import { DEMO_TRANSACTIONS } from '@/lib/mock-data'

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setActivities(DEMO_TRANSACTIONS)
          setLoading(false)
          return
        }
        const { data } = await supabase.from('transactions')
          .select('*, projects:project_id(name), category_types:category_type_id(category_name)')
          .order('created_at', { ascending: false })
          .limit(100)
        
        // Note: profiles RLS has recursion bug — display_name will be null until DB fix
        const enriched = (data || []).map(t => ({
          ...t,
          profiles: { display_name: null }
        }))
        setActivities(enriched.length ? enriched : DEMO_TRANSACTIONS)
      } catch {
        setActivities(DEMO_TRANSACTIONS)
      }
      setLoading(false)
    }
    load()
  }, [])

  const typeLabels: Record<string, string> = { income: 'เพิ่มรายรับ', expense: 'เพิ่มรายจ่าย', transfer_in: 'รับโอน', transfer_out: 'โอนออก' }
  const typeIcons: Record<string, any> = { income: Calculator, expense: Calculator, transfer_in: ArrowLeftRight, transfer_out: ArrowLeftRight }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
  const formatAmount = (a: number) => new Intl.NumberFormat('th-TH').format(a)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Clock className="w-6 h-6 text-purple-600" /> บันทึกกิจกรรม
      </h1>

      {loading ? (
        <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>ยังไม่มีกิจกรรม</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((a: any, i: number) => (
            <div key={a.id || i} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                a.transaction_type === 'income' || a.transaction_type === 'transfer_in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                <Calculator className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{a.description || typeLabels[a.transaction_type]}</p>
                <p className="text-xs text-gray-500">
                  {a.projects?.name || '—'} · {a.profiles?.display_name || '—'} · {formatDate(a.created_at)}
                </p>
              </div>
              <div className={`text-sm font-semibold flex-shrink-0 ${
                a.transaction_type === 'income' || a.transaction_type === 'transfer_in' ? 'text-green-600' : 'text-red-600'
              }`}>
                {a.transaction_type === 'income' || a.transaction_type === 'transfer_in' ? '+' : '-'}฿{formatAmount(Number(a.amount))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
