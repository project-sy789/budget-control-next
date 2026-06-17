'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { FolderOpen, Calculator, TrendingUp, DollarSign, Eye, EyeOff, Table2, BarChart3, AlertTriangle, Download } from 'lucide-react'
import { DEMO_PROJECTS, DEMO_TRANSACTIONS } from '@/lib/mock-data'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList, Legend } from 'recharts'

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6']

export default function DashboardPage() {
  const [stats, setStats] = useState({ projects: 0, transactions: 0, totalIncome: 0, totalExpense: 0 })
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [projectSummary, setProjectSummary] = useState<any[]>([])
  const [chartMode, setChartMode] = useState<'absolute' | 'percent'>('absolute')
  const [showTable, setShowTable] = useState(true)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      // Stats
      const { count: projectCount } = await supabase.from('projects').select('*', { count: 'exact', head: true })
      const { count: txCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true })
      const { data: txData } = await supabase.from('transactions').select('amount, transaction_type')

      let income = 0, expense = 0
      txData?.forEach(t => {
        if (t.transaction_type === 'income' || t.transaction_type === 'transfer_in') income += Number(t.amount)
        else expense += Math.abs(Number(t.amount))
      })

      setStats({ projects: projectCount || 0, transactions: txCount || 0, totalIncome: income, totalExpense: expense })

      // Recent transactions
      const { data: recent } = await supabase.from('transactions')
        .select('*, projects:project_id(name), category_types:category_type_id(category_name)')
        .order('created_at', { ascending: false }).limit(8)
      setRecentTransactions(recent || [])

      // Project summary with spending data
      const { data: projects } = await supabase.from('projects').select('id, name, budget').order('budget', { ascending: false })
      const enriched = await Promise.all((projects || []).map(async (p) => {
        const { data: tx } = await supabase.from('transactions').select('amount, transaction_type').eq('project_id', p.id)
        let exp = 0
        tx?.forEach(t => {
          if (t.transaction_type === 'expense' || t.transaction_type === 'transfer_out') exp += Math.abs(Number(t.amount))
        })
        return { ...p, budget: Number(p.budget), used: exp, remaining: Number(p.budget) - exp }
      }))
      setProjectSummary(enriched)
    } catch (e) {
      // Supabase offline → fallback to demo
      setProjectSummary(DEMO_PROJECTS)
      setRecentTransactions(DEMO_TRANSACTIONS.slice(0, 8))
      setStats({ projects: DEMO_PROJECTS.length, transactions: DEMO_TRANSACTIONS.length, totalIncome: DEMO_TRANSACTIONS.filter(t => t.transaction_type === 'income' || t.transaction_type === 'transfer_in').reduce((s, t) => s + Math.abs(t.amount), 0), totalExpense: DEMO_TRANSACTIONS.filter(t => t.transaction_type === 'expense' || t.transaction_type === 'transfer_out').reduce((s, t) => s + Math.abs(t.amount), 0) })
    }
    setLoading(false)
  }

  const balance = stats.totalIncome - stats.totalExpense

  // ── Smart chart data: group small projects for readability ──
  const totalBudget = projectSummary.reduce((s, p) => s + p.budget, 0)
  const threshold = totalBudget * 0.03 // Projects < 3% get grouped

  const majorProjects = projectSummary.filter(p => p.budget >= threshold || projectSummary.length <= 5)
  const minorProjects = projectSummary.filter(p => p.budget < threshold && projectSummary.length > 5)
  const othersBudget = minorProjects.reduce((s, p) => s + p.budget, 0)

  const barData = [
    ...majorProjects.map(p => ({
      name: p.name.length > 28 ? p.name.slice(0, 28) + '...' : p.name,
      fullName: p.name,
      budget: p.budget,
      used: p.used,
      remaining: p.remaining,
      pct: totalBudget > 0 ? ((p.budget / totalBudget) * 100).toFixed(1) : '0'
    })),
    ...(minorProjects.length > 0 ? [{
      name: `อื่นๆ (${minorProjects.length} โครงการ)`,
      fullName: minorProjects.map(p => p.name).join(', '),
      budget: othersBudget,
      used: minorProjects.reduce((s, p) => s + p.used, 0),
      remaining: minorProjects.reduce((s, p) => s + p.remaining, 0),
      pct: totalBudget > 0 ? ((othersBudget / totalBudget) * 100).toFixed(1) : '0'
    }] : [])
  ]

  // Pie data: group small
  const pieData = barData.map(d => ({ name: d.name, value: d.budget, pct: d.pct }))

  // Format helpers
  const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : `${n}`
  const fmtFull = (n: number) => `฿${n.toLocaleString()}`

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">แดชบอร์ด</h1>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'โครงการทั้งหมด', value: stats.projects, icon: FolderOpen, color: 'bg-purple-500', href: '/projects' },
          { label: 'รายการทั้งหมด', value: stats.transactions, icon: Calculator, color: 'bg-blue-500', href: '/budget-control' },
          { label: 'รายรับรวม', value: `฿${stats.totalIncome.toLocaleString()}`, icon: TrendingUp, color: 'bg-green-500', href: null },
          { label: 'ยอดคงเหลือ', value: `฿${balance.toLocaleString()}`, icon: DollarSign, color: balance >= 0 ? 'bg-emerald-500' : 'bg-red-500', href: null },
        ].map((card, i) => {
          const content = (
            <div key={i} className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 transition ${card.href ? 'hover:shadow-md hover:border-purple-200 cursor-pointer' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className="text-lg font-bold text-gray-800">{card.value}</p>
                </div>
              </div>
            </div>
          )
          return card.href ? <Link key={i} href={card.href}>{content}</Link> : content
        })}
      </div>

      {/* ── Budget Alert — projects over 80% ── */}
      {projectSummary.filter(p => p.budget > 0 && (p.used / p.budget) > 0.8 && p.status === 'active').length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">⚠️ โครงการที่ใช้เกิน 80%</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {projectSummary.filter(p => p.budget > 0 && (p.used / p.budget) > 0.8 && p.status === 'active').map(p => (
                <Link key={p.id} href={`/projects/${p.id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition">
                  {p.name.length > 30 ? p.name.slice(0, 30) + '...' : p.name}
                  <span className="text-amber-500">({((p.used / p.budget) * 100).toFixed(0)}%)</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Charts Section ── */}
      {projectSummary.length > 0 && (
        <>
          {/* Chart controls */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-gray-500 mr-1">มุมมอง:</span>
            <button onClick={() => setChartMode('absolute')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${chartMode === 'absolute' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <BarChart3 className="w-3.5 h-3.5 inline mr-1" />จำนวนเงิน
            </button>
            <button onClick={() => setChartMode('percent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${chartMode === 'percent' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <Eye className="w-3.5 h-3.5 inline mr-1" />เปอร์เซ็นต์
            </button>
            <span className="text-gray-300 mx-1">|</span>
            <button onClick={() => setShowTable(!showTable)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${showTable ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-400'} hover:bg-gray-200`}>
              <Table2 className="w-3.5 h-3.5 inline mr-1" />{showTable ? 'ซ่อนตาราง' : 'แสดงตาราง'}
            </button>
            {minorProjects.length > 0 && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                ⚠ {minorProjects.length} โครงการเล็กถูกรวมเป็น "อื่นๆ" (น้อยกว่า 3%)
              </span>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Bar Chart */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm">
                งบประมาณรายโครงการ {chartMode === 'percent' && <span className="text-gray-400 font-normal">(% ของทั้งหมด)</span>}
              </h3>
              <ResponsiveContainer width="100%" height={Math.max(280, barData.length * 40)}>
                <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 60, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }}
                    tickFormatter={chartMode === 'percent' ? (v) => `${v}%` : fmt} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                  />
                  <Bar
                    dataKey={chartMode === 'percent' ? 'pct' : 'budget'}
                    fill="#8b5cf6"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={32}
                  >
                    <LabelList
                      dataKey={chartMode === 'percent' ? 'pct' : 'budget'}
                      position="right"
                      style={{ fontSize: '11px', fontWeight: 600, fill: '#6b7280' }}
                      formatter={(v: any) => chartMode === 'percent' ? `${v}%` : fmtFull(Number(v))}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm">สัดส่วนงบประมาณ</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={45}
                    label={({ name, value }: any) => `${String(name || '').split(' ')[0]} ${String(value || '')}`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => fmtFull(Number(value))}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                  />
                  <Legend
                    formatter={(value: string) => <span style={{ fontSize: '11px', color: '#6b7280' }}>{value}</span>}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Table */}
          {showTable && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm">รายละเอียดงบประมาณทุกรายการ</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs">โครงการ</th>
                      <th className="text-right px-3 py-2.5 font-medium text-gray-500 text-xs w-[100px]">งบประมาณ</th>
                      <th className="text-right px-3 py-2.5 font-medium text-gray-500 text-xs w-[80px]">ใช้ไป</th>
                      <th className="text-right px-3 py-2.5 font-medium text-gray-500 text-xs w-[80px]">คงเหลือ</th>
                      <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs w-[140px]">สัดส่วน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {projectSummary.map(p => {
                      const pct = totalBudget > 0 ? (p.budget / totalBudget) * 100 : 0
                      const barColor = pct > 50 ? 'bg-purple-600' : pct > 20 ? 'bg-blue-500' : pct > 5 ? 'bg-green-500' : 'bg-gray-400'
                      return (
                        <tr key={p.id} className="hover:bg-purple-50/30 transition">
                          <td className="px-5 py-2.5 font-medium text-gray-800 truncate max-w-[200px]">{p.name}</td>
                          <td className="px-3 py-2.5 text-right font-semibold">฿{p.budget.toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-right text-red-500">฿{p.used.toLocaleString()}</td>
                          <td className={`px-3 py-2.5 text-right font-medium ${p.remaining >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            ฿{p.remaining.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 w-10 text-right">{pct.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50/80 font-semibold">
                    <tr>
                      <td className="px-5 py-2.5 text-gray-600">รวม {projectSummary.length} โครงการ</td>
                      <td className="px-3 py-2.5 text-right text-purple-600">฿{totalBudget.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right text-red-500">
                        ฿{projectSummary.reduce((s, p) => s + p.used, 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-right text-green-600">
                        ฿{projectSummary.reduce((s, p) => s + p.remaining, 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state when no data */}
      {projectSummary.length === 0 && !loading && (
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">ยังไม่มีข้อมูลโครงการ</p>
            <p className="text-sm text-gray-400 mt-1">เพิ่มโครงการเพื่อดูกราฟเปรียบเทียบงบประมาณ</p>
          </div>
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <Table2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">ยังไม่มีรายการ</p>
            <p className="text-sm text-gray-400 mt-1">บันทึกรายรับ-รายจ่ายเพื่อดูประวัติ</p>
          </div>
        </div>
      )}

      {/* ── Recent Transactions ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">รายการล่าสุด</h3>
          {recentTransactions.length > 0 && (
            <span className="text-xs text-gray-400">{recentTransactions.length} รายการ</span>
          )}
        </div>
        <div className="divide-y divide-gray-50">
          {recentTransactions.length === 0 ? (
            <p className="p-5 text-sm text-gray-400 text-center">ยังไม่มีรายการ</p>
          ) : (
            recentTransactions.map((tx: any) => {
              const isIn = tx.transaction_type === 'income' || tx.transaction_type === 'transfer_in'
              const amount = Math.abs(Number(tx.amount))
              return (
                <div key={tx.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{tx.description || (isIn ? 'รายรับ' : 'รายจ่าย')}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {tx.project_id ? (
                        <Link href={`/projects/${tx.project_id}`} className="hover:text-purple-600 hover:underline">
                          {tx.projects?.name || 'ไม่ระบุโครงการ'}
                        </Link>
                      ) : (tx.projects?.name || 'ไม่ระบุโครงการ')}
                      {tx.category_types?.category_name && ` • ${tx.category_types.category_name}`}
                      <span className="mx-1">•</span>
                      {new Date(tx.transaction_date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className={`ml-3 text-sm font-semibold whitespace-nowrap ${isIn ? 'text-green-600' : 'text-red-500'}`}>
                    {isIn ? '+' : '-'}฿{amount.toLocaleString()}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
