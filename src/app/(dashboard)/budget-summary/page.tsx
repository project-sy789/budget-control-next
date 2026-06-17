'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEMO_FISCAL_YEARS, DEMO_PROJECTS, DEMO_TRANSACTIONS, DEMO_WORK_GROUPS } from '@/lib/mock-data'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts'
import { TrendingDown, TrendingUp, Wallet, FolderOpen, BarChart3, Download } from 'lucide-react'

const COLORS = ['#8b5cf6', '#ef4444']

function enrichDemoProjects(fiscalYearId: string) {
  let projects = DEMO_PROJECTS
  if (fiscalYearId !== 'all') projects = projects.filter(p => p.fiscal_year_id === fiscalYearId)
  return projects.map(p => {
    const txs = DEMO_TRANSACTIONS.filter(t => t.project_id === p.id)
    let expense = 0, income = 0
    txs.forEach(t => {
      if (t.transaction_type === 'income' || t.transaction_type === 'transfer_in') income += Math.abs(t.amount)
      else expense += Math.abs(t.amount)
    })
    return { ...p, budget: Number(p.budget), income, expense, remaining: Number(p.budget) - expense + income, used: Math.max(0, expense - income) }
  })
}

export default function BudgetSummaryPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [fiscalYears, setFiscalYears] = useState<any[]>([])
  const [fiscalYearId, setFiscalYearId] = useState('all')
  const [yearLabel, setYearLabel] = useState('ปีงบประมาณ')
  const [chartMode, setChartMode] = useState<'absolute' | 'percent'>('absolute')
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [workGroupFilter, setWorkGroupFilter] = useState('all')
  const [workGroups, setWorkGroups] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setIsDemo(true); setLoading(false); setWorkGroups(DEMO_WORK_GROUPS); return }
      const { data: settings } = await supabase.from('system_settings').select('*').eq('setting_key', 'year_label_type')
      if (settings?.[0]) {
        const m: Record<string, string> = { fiscal_year: 'ปีงบประมาณ', academic_year: 'ปีการศึกษา', budget_year: 'ปีบัญชี' }
        setYearLabel(m[settings[0].setting_value] || 'ปีงบประมาณ')
      }
      const { data: fyData } = await supabase.from('fiscal_years').select('*').order('name', { ascending: false })
      if (fyData?.length) {
        setFiscalYears(fyData)
        const active = fyData.find((fy: any) => fy.is_active)
        if (active) setFiscalYearId(active.id)
      } else {
        setFiscalYears(DEMO_FISCAL_YEARS)
        setFiscalYearId('fy-1')
      }
      // Load work groups
      const { data: wgData } = await supabase.from('work_groups').select('*').eq('is_active', true).order('sort_order')
      setWorkGroups(wgData?.length ? wgData : DEMO_WORK_GROUPS)
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (isDemo) {
      setFiscalYears(DEMO_FISCAL_YEARS)
      if (fiscalYearId === 'all') setFiscalYearId('fy-1')
      setProjects(enrichDemoProjects(fiscalYearId))
      return
    }
    async function load() {
      setLoading(true)
      let query = supabase.from('projects').select('*, fiscal_years:fiscal_year_id(name)').order('budget', { ascending: false })
      if (fiscalYearId !== 'all') query = query.eq('fiscal_year_id', fiscalYearId)
      const { data } = await query

      if (data?.length) {
        const enriched = await Promise.all(data.map(async (p: any) => {
          const { data: tx } = await supabase.from('transactions').select('amount, transaction_type').eq('project_id', p.id)
          let expense = 0, income = 0
          tx?.forEach((t: any) => {
            if (t.transaction_type === 'income' || t.transaction_type === 'transfer_in') income += Number(t.amount)
            else expense += Math.abs(Number(t.amount))
          })
          return { ...p, budget: Number(p.budget), income, expense, remaining: Number(p.budget) - expense + income, used: Math.max(0, expense - income) }
        }))
        setProjects(enriched)
      } else {
        setProjects(fiscalYearId !== 'all' ? enrichDemoProjects(fiscalYearId) : [])
      }
      setLoading(false)
    }
    if (fiscalYearId) load()
  }, [fiscalYearId, isDemo])

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0)
  const totalUsed = projects.reduce((s, p) => s + p.used, 0)
  const totalRemaining = totalBudget - totalUsed

  // Work group filter
  const filteredProjects = workGroupFilter === 'all' ? projects : projects.filter(p => p.work_group === workGroupFilter)
  const filteredBudget = filteredProjects.reduce((s, p) => s + p.budget, 0)
  const filteredUsed = filteredProjects.reduce((s, p) => s + p.used, 0)
  const filteredRemaining = filteredBudget - filteredUsed

  // Smart grouping for chart readability
  const threshold = filteredBudget * 0.03
  const major = filteredProjects.filter(p => p.budget >= threshold || filteredProjects.length <= 6)
  const minor = filteredProjects.filter(p => p.budget < threshold && filteredProjects.length > 6)
  const othersBudget = minor.reduce((s, p) => s + p.budget, 0)
  const othersUsed = minor.reduce((s, p) => s + p.used, 0)

  const chartData = [
    ...major.map(p => ({
      name: p.name.length > 25 ? p.name.slice(0, 25) + '...' : p.name,
      fullName: p.name,
      budget: p.budget,
      used: p.used,
      remaining: p.remaining,
      budgetPct: filteredBudget > 0 ? ((p.budget / filteredBudget) * 100).toFixed(1) : '0',
      usedPct: filteredBudget > 0 ? ((p.used / filteredBudget) * 100).toFixed(1) : '0'
    })),
    ...(minor.length > 0 ? [{
      name: `อื่นๆ (${minor.length} โครงการ)`,
      fullName: minor.map(p => p.name).join(', '),
      budget: othersBudget,
      used: othersUsed,
      remaining: othersBudget - othersUsed,
      budgetPct: filteredBudget > 0 ? ((othersBudget / filteredBudget) * 100).toFixed(1) : '0',
      usedPct: filteredBudget > 0 ? ((othersUsed / filteredBudget) * 100).toFixed(1) : '0'
    }] : [])
  ]

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
    return `${n}`
  }
  const fmtFull = (n: number) => `฿${n.toLocaleString()}`

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">สรุปงบประมาณ</h1>
        <a href={`/api/export?type=projects${fiscalYearId !== 'all' ? `&fiscal_year_id=${fiscalYearId}` : ''}`}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition">
          <Download className="w-4 h-4" /> ส่งออก CSV
        </a>
      </div>

      {/* Year Selector */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <select value={fiscalYearId} onChange={e => setFiscalYearId(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium min-w-[200px] bg-white">
          <option value="all">ทุก{yearLabel}</option>
          {fiscalYears.map(fy => (
            <option key={fy.id} value={fy.id}>
              {yearLabel} {fy.name} ({new Date(fy.start_date).toLocaleDateString('th-TH')} - {new Date(fy.end_date).toLocaleDateString('th-TH')})
              {fy.is_active ? ' ★' : ''}
            </option>
          ))}
        </select>
        {workGroups.length > 0 && (
          <select value={workGroupFilter} onChange={e => setWorkGroupFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium min-w-[140px] bg-white">
            <option value="all">ทุกกลุ่มงาน</option>
            {workGroups.map(wg => (
              <option key={wg.id || wg.name} value={wg.name}>{wg.name}</option>
            ))}
          </select>
        )}
        <span className="text-sm text-gray-500">
          {filteredProjects.length} โครงการ • งบรวม ฿{filteredBudget.toLocaleString()}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'งบประมาณรวม', value: fmtFull(filteredBudget), icon: Wallet, color: 'text-purple-600' },
          { label: 'ใช้ไปแล้ว', value: fmtFull(filteredUsed), icon: TrendingDown, color: 'text-red-500' },
          { label: 'คงเหลือ', value: fmtFull(filteredRemaining), icon: TrendingUp, color: filteredRemaining >= 0 ? 'text-green-600' : 'text-red-500' },
          { label: 'โครงการ', value: `${filteredProjects.length}`, icon: FolderOpen, color: 'text-blue-600' },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <c.icon className={`w-4 h-4 ${c.color} mb-1`} />
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-lg font-bold text-gray-800">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Chart mode toggle */}
      {filteredProjects.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <button onClick={() => setChartMode('absolute')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${chartMode === 'absolute' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            จำนวนเงิน
          </button>
          <button onClick={() => setChartMode('percent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${chartMode === 'percent' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            เปอร์เซ็นต์
          </button>
          {minor.length > 0 && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg ml-2">
              ⚠ {minor.length} โครงการเล็กถูกรวมเป็น "อื่นๆ"
            </span>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm">
          เปรียบเทียบ — งบประมาณ vs ใช้ไป {chartMode === 'percent' && '(%)'}
        </h3>
        {filteredProjects.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(350, chartData.length * 45)}>
            <BarChart data={chartData} layout="vertical" barGap={2} margin={{ left: 0, right: 70, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }}
                tickFormatter={chartMode === 'percent' ? (v) => `${v}%` : fmt} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }}
              />
              <Bar dataKey={chartMode === 'percent' ? 'budgetPct' : 'budget'} fill="#8b5cf6" radius={[0, 5, 5, 0]} maxBarSize={28}>
                <LabelList dataKey={chartMode === 'percent' ? 'budgetPct' : 'budget'} position="right"
                  style={{ fontSize: '11px', fontWeight: 600, fill: '#8b5cf6' }}
                  formatter={(v: any) => chartMode === 'percent' ? `${v}%` : fmtFull(Number(v))} />
              </Bar>
              <Bar dataKey={chartMode === 'percent' ? 'usedPct' : 'used'} fill="#ef4444" radius={[0, 5, 5, 0]} maxBarSize={28}>
                <LabelList dataKey={chartMode === 'percent' ? 'usedPct' : 'used'} position="right"
                  style={{ fontSize: '11px', fontWeight: 600, fill: '#ef4444' }}
                  formatter={(v: any) => chartMode === 'percent' ? `${v}%` : fmtFull(Number(v))} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-16">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{loading ? 'กำลังโหลด...' : `ยังไม่มีโครงการใน${yearLabel}นี้`}</p>
          </div>
        )}
      </div>

      {/* Detailed Table */}
      {filteredProjects.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">รายละเอียดทั้งหมด</h3>
            <span className="text-xs text-gray-400">{filteredProjects.length} โครงการ</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="text-left px-5 py-2.5 font-medium text-gray-500 text-xs">โครงการ</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs">{yearLabel}</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-500 text-xs">งบประมาณ</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-500 text-xs">รายรับ</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-500 text-xs">รายจ่าย</th>
                  <th className="text-right px-3 py-2.5 font-medium text-gray-500 text-xs">คงเหลือ</th>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-500 text-xs">ความคืบหน้า</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProjects.map(p => {
                  const pct = p.budget > 0 ? (p.used / p.budget) * 100 : 0
                  const barColor = pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-green-500'
                  return (
                    <tr key={p.id} className="hover:bg-purple-50/30 transition">
                      <td className="px-5 py-2.5 font-medium text-gray-800 max-w-[200px] truncate">{p.name}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{p.fiscal_years?.name || '-'}</td>
                      <td className="px-3 py-2.5 text-right font-semibold">฿{p.budget.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right text-green-600">฿{p.income.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right text-red-500">฿{p.expense.toLocaleString()}</td>
                      <td className={`px-3 py-2.5 text-right font-medium ${p.remaining >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        ฿{p.remaining.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-50/80 font-semibold">
                <tr>
                  <td className="px-5 py-2.5 text-gray-600">รวม {filteredProjects.length} โครงการ</td>
                  <td />
                  <td className="px-3 py-2.5 text-right text-purple-600">฿{filteredBudget.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right text-green-600">
                    ฿{filteredProjects.reduce((s, p) => s + p.income, 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right text-red-500">
                    ฿{filteredProjects.reduce((s, p) => s + p.expense, 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right text-green-600">฿{filteredRemaining.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-500">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
