'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, Calculator, FileText, ArrowLeftRight } from 'lucide-react'
import { DEMO_TRANSACTIONS } from '@/lib/mock-data'

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<any[]>(DEMO_TRANSACTIONS)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('transactions')
        .select('*, projects:project_id(name), profiles:created_by(display_name), category_types:category_type_id(category_name)')
        .order('created_at', { ascending: false })
        .limit(100)
      setActivities(data?.length ? data : DEMO_TRANSACTIONS)
      setLoading(false)
    }
    load()
  }, [])

  const typeLabels: Record<string, string> = { income: 'เพิ่มรายรับ', expense: 'เพิ่มรายจ่าย', transfer_in: 'รับโอน', transfer_out: 'โอนออก' }
  const typeIcons: Record<string, any> = { income: Calculator, expense: Calculator, transfer_in: ArrowLeftRight, transfer_out: ArrowLeftRight }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Clock className="w-6 h-6 text-purple-600" /> บันทึกกิจกรรม
      </h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="divide-y divide-gray-50">
          {activities.map((a) => {
            const Icon = typeIcons[a.transaction_type] || FileText
            return (
              <div key={a.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  a.transaction_type === 'income' || a.transaction_type === 'transfer_in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">
                    <span className="font-medium">{a.profiles?.display_name || 'ไม่ระบุ'}</span>
                    {' '}{typeLabels[a.transaction_type] || a.transaction_type}
                    {' '}฿{Math.abs(Number(a.amount)).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {a.projects?.name} {a.category_types?.category_name && `• ${a.category_types.category_name}`}
                    {' • '}{new Date(a.created_at).toLocaleString('th-TH')}
                  </p>
                </div>
              </div>
            )
          })}
          {activities.length === 0 && (
            <p className="py-12 text-center text-gray-400">{loading ? 'กำลังโหลด...' : 'ยังไม่มีกิจกรรม'}</p>
          )}
        </div>
      </div>
    </div>
  )
}
