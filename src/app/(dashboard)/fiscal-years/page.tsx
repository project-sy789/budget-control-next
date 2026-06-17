'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Star } from 'lucide-react'

export default function FiscalYearsPage() {
  const [years, setYears] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('fiscal_years').select('*').order('name', { ascending: false })
    setYears(data || [])
  }

  async function setActive(id: string) {
    await supabase.from('fiscal_years').update({ is_active: false }).neq('id', id)
    await supabase.from('fiscal_years').update({ is_active: true }).eq('id', id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">จัดการปีงบประมาณ</h1>
        <button onClick={() => { setEditing(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition">
          <Plus className="w-4 h-4" /> เพิ่มปีงบประมาณ
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {years.map(year => (
          <div key={year.id} className={`bg-white rounded-xl p-4 shadow-sm border-2 transition ${year.is_active ? 'border-purple-500' : 'border-gray-100'}`}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-800">{year.name}</h3>
              {year.is_active && <Star className="w-5 h-5 text-purple-500 fill-purple-500" />}
            </div>
            <div className="space-y-1 mb-3">
              <p className="text-xs text-gray-500">เริ่ม: {new Date(year.start_date).toLocaleDateString('th-TH')}</p>
              <p className="text-xs text-gray-500">สิ้นสุด: {new Date(year.end_date).toLocaleDateString('th-TH')}</p>
            </div>
            <div className="flex items-center gap-2">
              {!year.is_active && (
                <button onClick={() => setActive(year.id)} className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100">
                  ตั้งเป็นปีปัจจุบัน
                </button>
              )}
              <button onClick={() => { setEditing(year); setShowModal(true) }} className="p-1 hover:bg-gray-100 rounded text-gray-500">
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button onClick={async () => { if (confirm('ลบปีนี้?')) { await supabase.from('fiscal_years').delete().eq('id', year.id); load() } }} className="p-1 hover:bg-gray-100 rounded text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && <FiscalYearModal year={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} />}
    </div>
  )
}

function FiscalYearModal({ year, onClose, onSaved }: any) {
  const [name, setName] = useState(year?.name || '')
  const [startDate, setStartDate] = useState(year?.start_date || '')
  const [endDate, setEndDate] = useState(year?.end_date || '')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = { name, start_date: startDate, end_date: endDate }
    if (year) {
      await supabase.from('fiscal_years').update(data).eq('id', year.id)
    } else {
      await supabase.from('fiscal_years').insert(data)
    }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold mb-4">{year ? 'แก้ไขปีงบประมาณ' : 'เพิ่มปีงบประมาณ'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อปี (พ.ศ.)</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="2569" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่ม</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">ยกเลิก</button>
            <button type="submit" className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">บันทึก</button>
          </div>
        </form>
      </div>
    </div>
  )
}
