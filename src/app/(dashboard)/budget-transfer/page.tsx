'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeftRight, AlertTriangle } from 'lucide-react'

export default function BudgetTransferPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [fiscalYears, setFiscalYears] = useState<any[]>([])
  const [transfers, setTransfers] = useState<any[]>([])
  const [yearLabel, setYearLabel] = useState('ปีงบประมาณ')
  const [filterFyId, setFilterFyId] = useState('active')

  // Form
  const [fromProjectId, setFromProjectId] = useState('')
  const [toProjectId, setToProjectId] = useState('')
  const [fromCategory, setFromCategory] = useState('')
  const [toCategory, setToCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Balance check
  const [sourceBalance, setSourceBalance] = useState<number | null>(null)

  const supabase = createClient()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const { data: settings } = await supabase.from('system_settings').select('*').eq('setting_key', 'year_label_type')
    if (settings?.[0]) {
      const m: Record<string, string> = { fiscal_year: 'ปีงบประมาณ', academic_year: 'ปีการศึกษา', budget_year: 'ปีบัญชี' }
      setYearLabel(m[settings[0].setting_value] || 'ปีงบประมาณ')
    }

    const [fyData, projData, catData, txData] = await Promise.all([
      supabase.from('fiscal_years').select('*').order('name', { ascending: false }),
      supabase.from('projects').select('id, name, fiscal_year_id, budget').eq('status', 'active').order('name'),
      supabase.from('category_types').select('*').eq('is_active', true).order('category_name'),
      supabase.from('transactions').select('*, projects:project_id(name), category_types:category_type_id(category_name)')
        .in('transaction_type', ['transfer_in', 'transfer_out']).order('created_at', { ascending: false }).limit(50)
    ])

    setFiscalYears(fyData.data || [])
    setProjects(projData.data || [])
    setCategories(catData.data || [])
    setTransfers(txData.data || [])

    // Set active fiscal year
    const active = fyData.data?.find(fy => fy.is_active)
    if (active) setFilterFyId(active.id)
  }

  // Filter projects by fiscal year
  const filteredProjects = filterFyId === 'all' ? projects : projects.filter(p => p.fiscal_year_id === filterFyId)

  // Check source balance when project/category changes
  useEffect(() => {
    async function checkBalance() {
      if (!fromProjectId) { setSourceBalance(null); return }
      const { data } = await supabase.from('projects').select('budget').eq('id', fromProjectId).single()
      const budget = Number(data?.budget || 0)
      const { data: tx } = await supabase.from('transactions').select('amount, transaction_type').eq('project_id', fromProjectId)
      let expense = 0, income = 0
      tx?.forEach(t => {
        if (t.transaction_type === 'income' || t.transaction_type === 'transfer_in') income += Number(t.amount)
        else expense += Math.abs(Number(t.amount))
      })
      setSourceBalance(budget - expense + income)
    }
    checkBalance()
  }, [fromProjectId, fromCategory])

  const transferAmount = parseFloat(amount) || 0
  const insufficient = sourceBalance !== null && transferAmount > sourceBalance

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (!fromProjectId || !toProjectId) { setMessage({ type: 'error', text: 'กรุณาเลือกโครงการต้นทางและปลายทาง' }); return }
    if (fromProjectId === toProjectId) { setMessage({ type: 'error', text: 'ไม่สามารถโอนให้โครงการเดียวกันได้' }); return }
    if (transferAmount <= 0) { setMessage({ type: 'error', text: 'จำนวนเงินต้องมากกว่า 0' }); return }
    if (insufficient) { setMessage({ type: 'error', text: `งบประมาณไม่เพียงพอ (คงเหลือ ฿${(sourceBalance || 0).toLocaleString()})` }); return }

    setSaving(true)

    // Create transfer_out (negative)
    const { error } = await supabase.from('transactions').insert({
      project_id: fromProjectId, category_type_id: fromCategory || null,
      amount: -transferAmount, transaction_type: 'transfer_out',
      description: description || `โอนไปยังโครงการ`, transaction_date: date,
      transfer_to_project_id: toProjectId, is_transfer: true
    })

    if (error) { setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด: ' + error.message }); setSaving(false); return }

    // Create transfer_in (positive)
    await supabase.from('transactions').insert({
      project_id: toProjectId, category_type_id: toCategory || null,
      amount: transferAmount, transaction_type: 'transfer_in',
      description: description || `รับโอนจากโครงการ`, transaction_date: date,
      transfer_from_project_id: fromProjectId, is_transfer: true
    })

    setMessage({ type: 'success', text: 'โอนงบประมาณสำเร็จ!' })
    setSaving(false)
    loadAll()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">โอนงบประมาณ</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Transfer Form */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-purple-600" />โอนงบประมาณระหว่างโครงการ
          </h2>

          {message && (
            <div className={`text-sm rounded-xl p-3 mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleTransfer} className="space-y-3">
            {/* Fiscal Year Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">กรองโครงการตาม{yearLabel}</label>
              <select value={filterFyId} onChange={e => { setFilterFyId(e.target.value); setFromProjectId(''); setToProjectId('') }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm">
                <option value="all">ทุก{yearLabel}</option>
                {fiscalYears.map(fy => <option key={fy.id} value={fy.id}>{fy.name} {fy.is_active ? '(ปัจจุบัน)' : ''}</option>)}
              </select>
            </div>

            {/* From → To */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">จากโครงการ <span className="text-red-500">*</span></label>
                <select value={fromProjectId} onChange={e => setFromProjectId(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm">
                  <option value="">เลือก</option>
                  {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {sourceBalance !== null && (
                  <p className={`text-xs mt-1 ${insufficient && transferAmount > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    คงเหลือ: ฿{sourceBalance.toLocaleString()}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ไปยังโครงการ <span className="text-red-500">*</span></label>
                <select value={toProjectId} onChange={e => setToProjectId(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm">
                  <option value="">เลือก</option>
                  {filteredProjects.filter(p => p.id !== fromProjectId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            {/* Categories */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">หมวดหมู่ (จาก)</label>
                <select value={fromCategory} onChange={e => setFromCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm">
                  <option value="">ไม่ระบุ</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">หมวดหมู่ (ไป)</label>
                <select value={toCategory} onChange={e => setToCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm">
                  <option value="">ไม่ระบุ</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                </select>
              </div>
            </div>

            {/* Amount + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">จำนวนเงิน <span className="text-red-500">*</span></label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required
                  className={`w-full px-3 py-2 border rounded-xl text-sm ${insufficient ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                {insufficient && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> งบประมาณไม่เพียงพอ
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">วันที่ <span className="text-red-500">*</span></label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">หมายเหตุ</label>
              <input value={description} onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" placeholder="เหตุผลการโอน" />
            </div>

            <button type="submit" disabled={saving || insufficient}
              className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
              {saving ? 'กำลังโอน...' : insufficient ? 'งบประมาณไม่เพียงพอ' : 'โอนงบประมาณ'}
            </button>
          </form>
        </div>

        {/* Transfer History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">ประวัติการโอน</h3>
            <span className="text-xs text-gray-400">{transfers.length} รายการ</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
            {transfers.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">ยังไม่มีประวัติการโอน</p>
            ) : transfers.map(tx => (
              <div key={tx.id} className="p-3 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{tx.projects?.name}</p>
                    <p className="text-xs text-gray-400">
                      {tx.description || '-'} • {new Date(tx.transaction_date).toLocaleDateString('th-TH')}
                      {tx.category_types?.category_name && ` • ${tx.category_types.category_name}`}
                    </p>
                  </div>
                  <span className={`ml-3 text-sm font-semibold whitespace-nowrap ${tx.transaction_type === 'transfer_in' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.transaction_type === 'transfer_in' ? '+' : '-'}฿{Math.abs(Number(tx.amount)).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
