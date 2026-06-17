'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, Search, Download } from 'lucide-react'
import { DEMO_FISCAL_YEARS, DEMO_PROJECTS, DEMO_CATEGORIES, DEMO_TRANSACTIONS, DEMO_WORK_GROUPS } from '@/lib/mock-data'

export default function BudgetControlPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [fiscalYears, setFiscalYears] = useState<any[]>([])
  const [workGroups, setWorkGroups] = useState<any[]>([])
  const [yearLabel, setYearLabel] = useState('ปีงบประมาณ')
  const [filters, setFilters] = useState({ fiscal_year_id: 'all', project_id: 'all', type: 'all', work_group: 'all', search: '' })
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    // Year label
    const { data: settings } = await supabase.from('system_settings').select('*').eq('setting_key', 'year_label_type')
    if (settings?.[0]) {
      const labelMap: Record<string, string> = { fiscal_year: 'ปีงบประมาณ', academic_year: 'ปีการศึกษา', budget_year: 'ปีบัญชี' }
      setYearLabel(labelMap[settings[0].setting_value] || 'ปีงบประมาณ')
    }

    const [fyData, projData, catData, txData] = await Promise.all([
      supabase.from('fiscal_years').select('*').order('name', { ascending: false }),
      supabase.from('projects').select('id, name, fiscal_year_id').order('name'),
      supabase.from('category_types').select('*').eq('is_active', true).order('category_name'),
      supabase.from('transactions')
        .select('*, projects:project_id(id, name, fiscal_year_id), category_types:category_type_id(category_name)')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(500)
    ])

    setFiscalYears(fyData.data?.length ? fyData.data : DEMO_FISCAL_YEARS)
    setProjects(projData.data?.length ? projData.data : DEMO_PROJECTS)
    setCategories(catData.data?.length ? catData.data : DEMO_CATEGORIES)
    setWorkGroups(DEMO_WORK_GROUPS) // Work groups come from demo or loaded separately
    setTransactions(txData.data?.length ? txData.data : DEMO_TRANSACTIONS)
    setLoading(false)
  }

  // Get project fiscal year mapping for filtering
  const projectFyMap: Record<string, string> = {}
  const projectWgMap: Record<string, string> = {}
  projects.forEach(p => { projectFyMap[p.id] = p.fiscal_year_id; projectWgMap[p.id] = p.work_group })

  const filtered = transactions.filter(tx => {
    if (filters.fiscal_year_id !== 'all') {
      const txFyId = tx.projects?.fiscal_year_id || projectFyMap[tx.project_id]
      if (txFyId !== filters.fiscal_year_id) return false
    }
    if (filters.project_id !== 'all' && tx.project_id !== filters.project_id) return false
    if (filters.work_group !== 'all') {
      const txWg = tx.projects?.work_group || projectWgMap[tx.project_id]
      if (txWg !== filters.work_group) return false
    }
    if (filters.type !== 'all') {
      if (filters.type === 'transfer') return tx.transaction_type === 'transfer_in' || tx.transaction_type === 'transfer_out'
      if (tx.transaction_type !== filters.type) return false
    }
    if (filters.search && !(tx.description || '').toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  // Compute totals
  const totalIncome = filtered
    .filter(tx => tx.transaction_type === 'income' || tx.transaction_type === 'transfer_in')
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)
  const totalExpense = filtered
    .filter(tx => tx.transaction_type === 'expense' || tx.transaction_type === 'transfer_out')
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0)

  const typeLabels: Record<string, string> = {
    income: 'รายรับ', expense: 'รายจ่าย', transfer_in: 'รับโอน', transfer_out: 'โอนออก'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ควบคุมงบประมาณ</h1>
        <div className="flex items-center gap-2">
          <a href="/api/export?type=transactions" 
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition">
            <Download className="w-4 h-4" /> ส่งออก
          </a>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition">
            <Plus className="w-4 h-4" /> เพิ่มรายการ
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filters.fiscal_year_id} onChange={e => setFilters({ ...filters, fiscal_year_id: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[150px]">
          <option value="all">ทุก{yearLabel}</option>
          {fiscalYears.map(fy => <option key={fy.id} value={fy.id}>{yearLabel} {fy.name}</option>)}
        </select>
        <select value={filters.project_id} onChange={e => setFilters({ ...filters, project_id: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[180px]">
          <option value="all">ทุกโครงการ</option>
          {projects
            .filter(p => filters.fiscal_year_id === 'all' || p.fiscal_year_id === filters.fiscal_year_id)
            .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="all">ทุกประเภท</option>
          <option value="income">รายรับ</option>
          <option value="expense">รายจ่าย</option>
          <option value="transfer">โอน</option>
        </select>
        <select value={filters.work_group} onChange={e => setFilters({ ...filters, work_group: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[120px]">
          <option value="all">ทุกกลุ่มงาน</option>
          {workGroups.map(wg => (
            <option key={wg.id || wg.name} value={wg.name}>{wg.name}</option>
          ))}
        </select>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="ค้นหารายการ..." value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
          <p className="text-xs text-gray-500">จำนวนรายการ</p>
          <p className="text-lg font-bold text-gray-800">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
          <p className="text-xs text-gray-500">รายรับรวม</p>
          <p className="text-lg font-bold text-green-600">฿{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
          <p className="text-xs text-gray-500">รายจ่ายรวม</p>
          <p className="text-lg font-bold text-red-500">฿{totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
          <p className="text-xs text-gray-500">คงเหลือ</p>
          <p className={`text-lg font-bold ${totalIncome - totalExpense >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            ฿{(totalIncome - totalExpense).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">วันที่</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">โครงการ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">หมวดหมู่</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">รายการ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ประเภท</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">จำนวนเงิน</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">ลบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {new Date(tx.transaction_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 font-medium text-xs">
                    {tx.projects?.id ? (
                      <Link href={`/projects/${tx.projects.id}`} className="text-purple-600 hover:underline">
                        {tx.projects.name || tx.project_id}
                      </Link>
                    ) : (tx.projects?.name || tx.project_id || '-')}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{tx.category_types?.category_name || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs max-w-[150px] truncate">{tx.description || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      tx.transaction_type === 'income' || tx.transaction_type === 'transfer_in'
                        ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{typeLabels[tx.transaction_type] || tx.transaction_type}</span>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold text-xs ${
                    tx.transaction_type === 'income' || tx.transaction_type === 'transfer_in' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {tx.transaction_type === 'income' || tx.transaction_type === 'transfer_in' ? '+' : '-'}
                    ฿{Math.abs(Number(tx.amount)).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={async () => {
                      if (confirm('ลบรายการนี้?')) {
                        await supabase.from('transactions').delete().eq('id', tx.id)
                        loadAll()
                      }
                    }} className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 text-xs">✕</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {loading ? 'กำลังโหลด...' : 'ไม่มีรายการในช่วงนี้'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <AddTransactionModal
          projects={projects}
          categories={categories}
          fiscalYears={fiscalYears}
          yearLabel={yearLabel}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadAll() }}
        />
      )}
    </div>
  )
}

function AddTransactionModal({ projects, categories, fiscalYears, yearLabel, onClose, onSaved }: any) {
  const [projectId, setProjectId] = useState('')
  const [categoryTypeId, setCategoryTypeId] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('expense')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [refNumber, setRefNumber] = useState('')
  const [filterFyId, setFilterFyId] = useState('all')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // Auto-select fiscal year
  useEffect(() => {
    const active = fiscalYears.find((fy: any) => fy.is_active)
    if (active) setFilterFyId(active.id)
  }, [fiscalYears])

  const filteredProjects = filterFyId === 'all'
    ? projects
    : projects.filter((p: any) => p.fiscal_year_id === filterFyId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!projectId) { alert('กรุณาเลือกโครงการ'); return }
    setSaving(true)
    const { error } = await supabase.from('transactions').insert({
      project_id: projectId,
      category_type_id: categoryTypeId || null,
      amount: type === 'income' ? Math.abs(Number(amount)) : -Math.abs(Number(amount)),
      transaction_type: type,
      description,
      transaction_date: date,
      reference_number: refNumber
    })
    if (error) alert('เกิดข้อผิดพลาด: ' + error.message)
    setSaving(false)
    if (!error) onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">เพิ่มรายการ</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Filter by fiscal year first */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">กรองโครงการตาม{yearLabel}</label>
            <select value={filterFyId} onChange={e => setFilterFyId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="all">ทุก{yearLabel}</option>
              {fiscalYears.map((fy: any) => <option key={fy.id} value={fy.id}>{fy.name} {fy.is_active ? '(ปัจจุบัน)' : ''}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">โครงการ <span className="text-red-500">*</span></label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">เลือกโครงการ</option>
              {filteredProjects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="expense">รายจ่าย</option>
                <option value="income">รายรับ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน <span className="text-red-500">*</span></label>
              <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
            <select value={categoryTypeId} onChange={e => setCategoryTypeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">เลือกหมวดหมู่</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="คำอธิบายรายการ" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ <span className="text-red-500">*</span></label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่อ้างอิง</label>
              <input value={refNumber} onChange={e => setRefNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="ไม่จำเป็น" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">ยกเลิก</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
