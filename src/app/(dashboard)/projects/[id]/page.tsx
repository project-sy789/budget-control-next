'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useDemoSandbox } from '@/lib/demo-sandbox'
import { DEMO_PROJECTS, DEMO_TRANSACTIONS } from '@/lib/mock-data'
import {
  ArrowLeft, Calculator, TrendingUp, TrendingDown, DollarSign,
  Calendar, User, FileText, Edit, Lock, CheckCircle, PauseCircle,
  PlayCircle, BarChart3, Plus, Trash2, Building2
} from 'lucide-react'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  const [project, setProject] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [fiscalYear, setFiscalYear] = useState<any>(null)
  const [stats, setStats] = useState({ income: 0, expense: 0, count: 0 })
  const [loading, setLoading] = useState(true)
  const [showTxModal, setShowTxModal] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [catTypes, setCatTypes] = useState<any[]>([])

  // Transaction form
  const [txAmount, setTxAmount] = useState('')
  const [txType, setTxType] = useState('expense')
  const [txDesc, setTxDesc] = useState('')
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10))
  const [txCatId, setTxCatId] = useState('')
  const [txSaving, setTxSaving] = useState(false)
  const [txError, setTxError] = useState('')
  const supabase = createClient()
  const sandbox = useDemoSandbox()

  useEffect(() => { if (projectId) loadAll() }, [projectId])

  async function loadAll() {
    // Check if demo mode
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setIsDemo(true)
      // Try sandbox first, then fallback to static DEMO data
      const allProjects = sandbox.projects?.length ? sandbox.projects : DEMO_PROJECTS
      const proj = allProjects.find((p: any) => p.id === projectId)
      if (!proj) { setLoading(false); return }
      setProject(proj)
      // Find fiscal year
      const fy = { name: proj.fiscal_years?.name || '2568' }
      setFiscalYear(fy)
      // Get transactions from sandbox or DEMO
      const allTx = sandbox.transactions?.length ? sandbox.transactions : DEMO_TRANSACTIONS
      const tx = allTx.filter((t: any) => t.project_id === projectId)
      setTransactions(tx || [])
      let income = 0, expense = 0
      tx?.forEach((t: any) => {
        if (t.transaction_type === 'income' || t.transaction_type === 'transfer_in') income += Math.abs(Number(t.amount))
        else expense += Math.abs(Number(t.amount))
      })
      setStats({ income, expense, count: tx?.length || 0 })
      setLoading(false)
      return
    }

    try {
      // Load project from Supabase
      const { data: proj } = await supabase.from('projects')
        .select('*').eq('id', projectId).single()
      if (!proj) { setLoading(false); return }
      setProject(proj)

      // Load fiscal year
      if (proj.fiscal_year_id) {
        const { data: fy } = await supabase.from('fiscal_years')
          .select('*').eq('id', proj.fiscal_year_id).single()
        if (fy) setFiscalYear(fy)
      }

      // Load transactions
      const { data: tx } = await supabase.from('transactions')
        .select('*, category_types:category_type_id(category_name)')
        .eq('project_id', projectId)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })

      setTransactions(tx || [])

      // Calculate stats
      let income = 0, expense = 0
      tx?.forEach(t => {
        if (t.transaction_type === 'income' || t.transaction_type === 'transfer_in') income += Number(t.amount)
        else expense += Math.abs(Number(t.amount))
      })
      setStats({ income, expense, count: tx?.length || 0 })
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function handleStatusChange(newStatus: string) {
    if (isDemo) { setProject((p: any) => ({ ...p, status: newStatus })); return }
    await supabase.from('projects').update({ status: newStatus }).eq('id', projectId)
    loadAll()
  }

  async function handleDelete() {
    if (isDemo) { router.push('/projects'); return }
    if (stats.count > 0) {
      alert('ไม่สามารถลบโครงการที่มีธุรกรรมได้ — เปลี่ยนสถานะเป็น "ระงับ" แทน')
      return
    }
    if (!confirm('ลบโครงการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) return
    await supabase.from('projects').delete().eq('id', projectId)
    router.push('/projects')
  }

  async function openTxModal() {
    setTxError('')
    setTxAmount('')
    setTxType('expense')
    setTxDesc('')
    setTxDate(new Date().toISOString().slice(0, 10))
    setTxCatId('')
    if (!isDemo) {
      const { data } = await supabase.from('category_types').select('id, category_name').eq('is_active', true).order('category_name')
      setCatTypes(data || [])
      if (data?.length) setTxCatId(data[0].id)
    } else {
      setCatTypes([
        { id: 'cat-1', category_name: 'เงินกิจกรรมพัฒนาผู้เรียน' },
        { id: 'cat-2', category_name: 'เงินค่าอุปกรณ์การเรียน' },
        { id: 'cat-3', category_name: 'เงินรายได้สถานศึกษา' },
        { id: 'cat-4', category_name: 'เงินอาหารกลางวัน' },
      ])
      setTxCatId('cat-1')
    }
    setShowTxModal(true)
  }

  async function handleAddTransaction() {
    if (!txAmount || Number(txAmount) <= 0) { setTxError('กรุณากรอกจำนวนเงิน'); return }
    setTxSaving(true); setTxError('')

    if (isDemo) {
      sandbox.addTransaction({
        project_id: projectId,
        amount: Number(txAmount),
        transaction_type: txType,
        description: txDesc,
        transaction_date: txDate,
        category_type_id: txCatId,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        category_types: { category_name: catTypes.find(c => c.id === txCatId)?.category_name || '-' }
      })
      setShowTxModal(false)
      loadAll()
      setTxSaving(false)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id
    const orgId = project?.organization_id

    const { error } = await supabase.from('transactions').insert({
      project_id: projectId,
      organization_id: orgId,
      amount: Number(txAmount),
      transaction_type: txType,
      description: txDesc,
      transaction_date: txDate,
      category_type_id: txCatId || null,
      created_by: userId || null,
    })

    if (error) { setTxError('❌ ' + error.message); setTxSaving(false); return }

    // Update used_budget on project
    if (txType === 'expense' || txType === 'transfer_out') {
      const newUsed = Number(project.used_budget || 0) + Number(txAmount)
      await supabase.from('projects').update({ used_budget: newUsed }).eq('id', projectId)
    }

    setShowTxModal(false)
    loadAll()
    setTxSaving(false)
  }

  const used = stats.expense - stats.income
  const budget = Number(project?.budget || 0)
  const remaining = budget - used
  const pct = budget > 0 ? (used / budget) * 100 : 0
  const isLocked = stats.count > 0

  const statusLabels: Record<string, string> = { active: 'กำลังดำเนินการ', completed: 'เสร็จสิ้น', suspended: 'ระงับ' }
  const statusColors: Record<string, string> = { active: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700', suspended: 'bg-yellow-100 text-yellow-700' }
  const typeLabels: Record<string, string> = { income: 'รายรับ', expense: 'รายจ่าย', transfer_in: 'รับโอน', transfer_out: 'โอนออก' }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        กำลังโหลด...
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500 font-medium">ไม่พบโครงการ</p>
        <Link href="/projects" className="text-purple-600 text-sm hover:underline mt-2 inline-block">← กลับไปรายการโครงการ</Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard" className="hover:text-purple-600 transition">แดชบอร์ด</Link>
        <span>/</span>
        <Link href="/projects" className="hover:text-purple-600 transition">จัดการโครงการ</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium truncate max-w-[300px]">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
            project.status === 'active' ? 'bg-green-100 text-green-700' :
            project.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {project.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
              {isLocked && <span title="มีธุรกรรม — แก้ไขไม่ได้"><Lock className="w-4 h-4 text-amber-500" /></span>}
            </div>
            <p className="text-sm text-gray-500">{project.responsible_person}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status dropdown */}
          <select value={project.status} onChange={e => handleStatusChange(e.target.value)}
            className={`text-sm font-medium rounded-lg px-3 py-2 border-0 cursor-pointer outline-none ${statusColors[project.status] || ''}`}>
            <option value="active">กำลังดำเนินการ</option>
            <option value="completed">เสร็จสิ้น</option>
            <option value="suspended">ระงับ</option>
          </select>

          {!isLocked && !isDemo && (
            <button onClick={() => {/* TODO: edit modal */}}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">
              <Edit className="w-4 h-4" /> แก้ไข
            </button>
          )}
          {!isDemo && (
            <button onClick={openTxModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition">
              <Plus className="w-4 h-4" /> เพิ่มรายการ
            </button>
          )}
        </div>
      </div>

      {/* Budget Progress Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Budget Overview */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> ภาพรวมงบประมาณ
          </h2>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-3xl font-bold text-gray-800">฿{budget.toLocaleString()}</span>
            <span className="text-sm text-gray-500 mb-1">งบประมาณทั้งหมด</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden">
            <div className={`h-4 rounded-full transition-all duration-500 ${
              pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-green-500'
            }`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">ใช้ไป <b className="text-red-600">฿{used.toLocaleString()}</b> ({pct.toFixed(1)}%)</span>
            <span className="text-gray-500">คงเหลือ <b className="text-green-600">฿{remaining.toLocaleString()}</b></span>
          </div>
          {pct > 80 && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              งบประมาณใช้ไปแล้ว {pct.toFixed(0)}% — ใกล้ถึงเพดาน!
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">ข้อมูลโครงการ</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{fiscalYear?.name || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span>งบประมาณ ฿{budget.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calculator className="w-4 h-4 text-gray-400" />
              <span>{stats.count} รายการ</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4 text-gray-400" />
              <span>{project.responsible_person}</span>
            </div>
            {project.description && (
              <div className="flex items-start gap-2 text-gray-600">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                <span>{project.description}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{project.start_date} → {project.end_date}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-600" />
            รายการธุรกรรม ({stats.count})
          </h2>
          <div className="flex gap-2 text-sm">
            <span className="text-green-600">รายรับ ฿{stats.income.toLocaleString()}</span>
            <span className="text-gray-300">|</span>
            <span className="text-red-600">รายจ่าย ฿{stats.expense.toLocaleString()}</span>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="py-16 text-center">
            <Calculator className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">ยังไม่มีรายการ</p>
            {!isDemo && (
              <button onClick={openTxModal}
                className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition">
                <Plus className="w-4 h-4 inline mr-1" /> เพิ่มรายการแรก
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">วันที่</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">หมวดหมู่</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">รายการ</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase">ประเภท</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map(tx => {
                  const isIncome = tx.transaction_type === 'income' || tx.transaction_type === 'transfer_in'
                  return (
                    <tr key={tx.id} className="hover:bg-purple-50/30 transition">
                      <td className="px-4 py-3 text-gray-600">{tx.transaction_date}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-md">
                          {tx.category_types?.category_name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{tx.description || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isIncome ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {typeLabels[tx.transaction_type] || tx.transaction_type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                        {isIncome ? '+' : '-'}฿{Math.abs(Number(tx.amount)).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
