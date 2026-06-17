'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Plus, Edit, Trash2, Search, MoreHorizontal, CheckCircle, PauseCircle, PlayCircle,
  X, Lock, Upload, Copy, ChevronDown
} from 'lucide-react'
import { DEMO_FISCAL_YEARS, DEMO_CATEGORIES, DEMO_WORK_GROUPS, DEMO_PROJECTS } from '@/lib/mock-data'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [fiscalYears, setFiscalYears] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [workGroups, setWorkGroups] = useState<any[]>([])
  const [yearLabel, setYearLabel] = useState('ปีงบประมาณ')
  const [activeFyId, setActiveFyId] = useState<string>('active')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false)

  // Import
  const [showImport, setShowImport] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
    const { data: settings } = await supabase.from('system_settings').select('*').eq('setting_key', 'year_label_type')
    if (settings?.[0]) {
      const m: Record<string, string> = { fiscal_year: 'ปีงบประมาณ', academic_year: 'ปีการศึกษา', budget_year: 'ปีบัญชี' }
      setYearLabel(m[settings[0].setting_value] || 'ปีงบประมาณ')
    }

    const [fyData, catData, wgData, projData] = await Promise.all([
      supabase.from('fiscal_years').select('*').order('name', { ascending: false }),
      supabase.from('category_types').select('*').eq('is_active', true).order('category_name'),
      supabase.from('work_groups').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('projects')
        .select('*, fiscal_years:fiscal_year_id(id, name)')
        .order('created_at', { ascending: false })
    ])

    setFiscalYears(fyData.data?.length ? fyData.data : DEMO_FISCAL_YEARS)
    setCategories(catData.data?.length ? catData.data : DEMO_CATEGORIES)
    setWorkGroups(wgData.data?.length ? wgData.data : DEMO_WORK_GROUPS)

    // Enrich with spending + transaction count
    const enriched = await Promise.all((projData.data || []).map(async (p) => {
      const { data: tx, count } = await supabase.from('transactions')
        .select('amount, transaction_type', { count: 'exact' }).eq('project_id', p.id)
      let expense = 0, income = 0
      tx?.forEach(t => {
        if (t.transaction_type === 'income' || t.transaction_type === 'transfer_in') income += Number(t.amount)
        else expense += Math.abs(Number(t.amount))
      })
      const used = expense - income
      const remaining = Number(p.budget) - used
      const pct = Number(p.budget) > 0 ? (used / Number(p.budget)) * 100 : 0
      return { ...p, used, remaining, pct, txCount: count || 0 }
    }))

    setProjects(enriched.length ? enriched : DEMO_PROJECTS)
    setLoading(false)
    } catch (e) {
      setFiscalYears(DEMO_FISCAL_YEARS)
      setCategories(DEMO_CATEGORIES)
      setWorkGroups(DEMO_WORK_GROUPS)
      setProjects(DEMO_PROJECTS)
      setLoading(false)
    }
  }

  // ── Filtering ──
  const activeFiscalYear = fiscalYears.find(fy => fy.is_active)
  const displayFyId = activeFyId === 'active' ? activeFiscalYear?.id : activeFyId

  const filtered = projects.filter(p => {
    if (displayFyId && activeFyId !== 'all' && p.fiscal_year_id !== displayFyId) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const stats = {
    total: filtered.length,
    active: filtered.filter(p => p.status === 'active').length,
    completed: filtered.filter(p => p.status === 'completed').length,
    suspended: filtered.filter(p => p.status === 'suspended').length,
    totalBudget: filtered.reduce((s, p) => s + Number(p.budget), 0),
    totalUsed: filtered.reduce((s, p) => s + (p.used || 0), 0),
  }

  // ── Bulk actions ──
  const selectedProjects = filtered.filter(p => selected.has(p.id))
  const allSelected = filtered.length > 0 && selectedProjects.length === filtered.length

  function toggleSelect(id: string) {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }
  function toggleSelectAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(filtered.map(p => p.id)))
  }

  async function bulkStatusChange(newStatus: string) {
    const ids = Array.from(selected)
    await Promise.all(ids.map(id => supabase.from('projects').update({ status: newStatus }).eq('id', id)))
    setSelected(new Set())
    loadAll()
  }

  async function bulkCopyToFiscalYear(targetFyId: string) {
    if (!confirm(`คัดลอก ${selectedProjects.length} โครงการไปยังปีใหม่?`)) return
    const ids = Array.from(selected)
    const targets = projects.filter(p => ids.includes(p.id))
    const inserts = targets.map(p => ({
      name: p.name,
      fiscal_year_id: targetFyId,
      budget: p.budget,
      work_group: p.work_group,
      responsible_person: p.responsible_person,
      description: p.description,
      start_date: p.start_date,
      end_date: p.end_date,
      status: 'active',
      created_by: p.created_by
    }))
    await supabase.from('projects').insert(inserts)
    setSelected(new Set())
    loadAll()
  }

  async function deleteProject(id: string) {
    const p = projects.find(x => x.id === id)
    if (p?.txCount > 0) {
      alert('ไม่สามารถลบโครงการที่มีธุรกรรมได้ — เปลี่ยนสถานะเป็น "ระงับ" แทน')
      return
    }
    if (!confirm('ลบโครงการนี้?')) return
    await supabase.from('projects').delete().eq('id', id)
    loadAll()
  }

  // ── CSV Import ──
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const rows = text.split('\n').filter(r => r.trim())
    if (rows.length < 2) { alert('ไฟล์ CSV ต้องมี header + ข้อมูลอย่างน้อย 1 แถว'); return }

    const headers = rows[0].split(',').map(h => h.trim().toLowerCase())
    const nameIdx = headers.indexOf('name') > -1 ? headers.indexOf('name') : headers.indexOf('ชื่อโครงการ')
    const budgetIdx = headers.indexOf('budget') > -1 ? headers.indexOf('budget') : headers.indexOf('งบประมาณ')
    const personIdx = headers.indexOf('responsible_person') > -1 ? headers.indexOf('responsible_person') : headers.indexOf('ผู้รับผิดชอบ')
    const workIdx = headers.indexOf('work_group') > -1 ? headers.indexOf('work_group') : headers.indexOf('กลุ่มงาน')
    const startIdx = headers.indexOf('start_date') > -1 ? headers.indexOf('start_date') : headers.indexOf('วันที่เริ่ม')
    const endIdx = headers.indexOf('end_date') > -1 ? headers.indexOf('end_date') : headers.indexOf('วันที่สิ้นสุด')

    if (nameIdx === -1) { alert('ไม่พบคอลัมน์ "name" หรือ "ชื่อโครงการ" ในไฟล์'); return }

    const activeFy = fiscalYears.find(fy => fy.is_active)
    const inserts = rows.slice(1).map(row => {
      const cols = row.split(',').map(c => c.trim())
      return {
        name: cols[nameIdx] || 'โครงการใหม่',
        fiscal_year_id: activeFy?.id || null,
        budget: parseFloat(cols[budgetIdx] || '0'),
        work_group: cols[workIdx] || 'general',
        responsible_person: cols[personIdx] || 'ไม่ระบุ',
        start_date: cols[startIdx] || activeFy?.start_date || new Date().toISOString().split('T')[0],
        end_date: cols[endIdx] || activeFy?.end_date || new Date().toISOString().split('T')[0],
        status: 'active'
      }
    })

    const { error } = await supabase.from('projects').insert(inserts)
    if (error) alert('นำเข้าไม่สำเร็จ: ' + error.message)
    else { alert(`นำเข้าสำเร็จ ${inserts.length} โครงการ`); loadAll() }
    setShowImport(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const statusLabels: Record<string, string> = { active: 'กำลังดำเนินการ', completed: 'เสร็จสิ้น', suspended: 'ระงับ' }
  // Dynamic work group lookups from DB
  const workGroupMap = new Map(workGroups.map(wg => [wg.name, wg]))
  function getWorkLabel(name: string) { return workGroupMap.get(name)?.name || name }
  function getWorkColor(name: string) { return workGroupMap.get(name)?.color || 'bg-gray-100 text-gray-600' }

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">จัดการโครงการ</h1>
          <p className="text-sm text-gray-500 mt-0.5">{stats.total} โครงการ</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            <Upload className="w-4 h-4" /> นำเข้า CSV
          </button>
          <button onClick={() => { setEditingProject(null); setShowModal(true) }}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 shadow-sm shadow-purple-200 transition active:scale-95">
            <Plus className="w-4 h-4" /> เพิ่มโครงการ
          </button>
        </div>
      </div>

      {/* ── Fiscal Year Tabs + Stats ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button onClick={() => setActiveFyId('active')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeFyId === 'active' || !activeFyId ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {yearLabel}ปัจจุบัน
          </button>
          {fiscalYears.map(fy => (
            <button key={fy.id} onClick={() => setActiveFyId(fy.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeFyId === fy.id ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {fy.name}
            </button>
          ))}
          <button onClick={() => setActiveFyId('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeFyId === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            ทั้งหมด
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />กำลังดำเนินการ <b>{stats.active}</b></span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />เสร็จสิ้น <b>{stats.completed}</b></span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" />ระงับ <b>{stats.suspended}</b></span>
          <span className="text-gray-300">|</span>
          <span>งบรวม <b className="text-purple-600">฿{stats.totalBudget.toLocaleString()}</b></span>
          <span>ใช้ไป <b className="text-red-500">฿{stats.totalUsed.toLocaleString()}</b></span>
          <span>คงเหลือ <b className="text-green-600">฿{(stats.totalBudget - stats.totalUsed).toLocaleString()}</b></span>
        </div>
      </div>

      {/* ── Bulk toolbar ── */}
      {selectedProjects.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-purple-700">
            เลือก {selectedProjects.length} โครงการ
          </span>
          <span className="text-gray-300">|</span>
          <button onClick={() => bulkStatusChange('active')}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
            ตั้งเป็นดำเนินการ
          </button>
          <button onClick={() => bulkStatusChange('completed')}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
            ตั้งเป็นเสร็จสิ้น
          </button>
          <button onClick={() => bulkStatusChange('suspended')}
            className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-xs font-medium hover:bg-yellow-700">
            ตั้งเป็นระงับ
          </button>
          <span className="text-gray-300">|</span>
          <div className="relative">
            <button onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 flex items-center gap-1">
              <Copy className="w-3 h-3" /> คัดลอกไปปี <ChevronDown className="w-3 h-3" />
            </button>
            {bulkMenuOpen && (
              <div className="absolute top-full mt-1 left-0 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 min-w-[180px]"
                onClick={() => setBulkMenuOpen(false)}>
                {fiscalYears.map(fy => (
                  <button key={fy.id} onClick={() => bulkCopyToFiscalYear(fy.id)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                    {yearLabel} {fy.name} {fy.is_active ? '(ปัจจุบัน)' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setSelected(new Set())}
            className="ml-auto px-3 py-1.5 text-gray-400 hover:text-gray-600 text-xs">✕ ยกเลิก</button>
        </div>
      )}

      {/* ── Search + Status filter ── */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="ค้นหาชื่อโครงการ..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none transition" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-purple-200">
          <option value="all">ทุกสถานะ</option>
          <option value="active">กำลังดำเนินการ</option>
          <option value="completed">เสร็จสิ้น</option>
          <option value="suspended">ระงับ</option>
        </select>
      </div>

      {/* ── Desktop Table ── */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-3 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider w-[40px]">
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              </th>
              <th className="text-left px-3 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">โครงการ</th>
              <th className="text-left px-2 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider w-[60px]">ปี</th>
              <th className="text-left px-2 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider w-[80px]">กลุ่ม</th>
              <th className="text-right px-3 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider w-[130px]">งบประมาณ</th>
              <th className="text-center px-2 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider w-[120px]">สถานะ</th>
              <th className="text-center px-2 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider w-[50px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(project => {
              const isLocked = project.txCount > 0
              return (
                <tr key={project.id} className={`hover:bg-purple-50/30 transition group ${isLocked ? 'bg-gray-50/30' : ''}`}>
                  {/* Checkbox */}
                  <td className="px-3 py-3.5">
                    <input type="checkbox" checked={selected.has(project.id)} onChange={() => toggleSelect(project.id)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  </td>

                  {/* Project name */}
                  <td className="px-3 py-3.5">
                    <Link href={`/projects/${project.id}`} className="flex items-center gap-3 hover:opacity-80 transition">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                        project.status === 'active' ? 'bg-green-100 text-green-700' :
                        project.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {project.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-gray-800 truncate max-w-[250px] hover:text-purple-600">{project.name}</p>
                          {isLocked && (
                            <span className="flex-shrink-0" title={`มี ${project.txCount} รายการธุรกรรม — ไม่สามารถแก้ไขได้`}>
                              <Lock className="w-3 h-3 text-amber-500" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate max-w-[250px]">
                          {project.responsible_person}
                          {isLocked && <span className="text-amber-500 ml-1">• {project.txCount} รายการ</span>}
                        </p>
                      </div>
                    </Link>
                  </td>

                  <td className="px-2 py-3.5">
                    <span className="text-xs text-gray-500">{project.fiscal_years?.name || '-'}</span>
                  </td>

                  <td className="px-2 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${getWorkColor(project.work_group)}`}>
                      {getWorkLabel(project.work_group)}
                    </span>
                  </td>

                  <td className="px-3 py-3.5 text-right">
                    <p className="font-semibold text-gray-800">฿{Number(project.budget).toLocaleString()}</p>
                    {project.pct > 0 && (
                      <>
                        <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full transition-all ${project.pct > 100 ? 'bg-red-500' : project.pct > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(project.pct, 100)}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">ใช้ {project.pct.toFixed(0)}%</p>
                      </>
                    )}
                  </td>

                  {/* Status — always editable even if locked */}
                  <td className="px-2 py-3.5 text-center">
                    <select value={project.status} onChange={e => {
                      supabase.from('projects').update({ status: e.target.value }).eq('id', project.id).then(() => loadAll())
                    }}
                      className={`text-xs font-medium rounded-lg px-2 py-1 border-0 cursor-pointer outline-none ${
                        project.status === 'active' ? 'bg-green-50 text-green-700' :
                        project.status === 'completed' ? 'bg-blue-50 text-blue-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>
                      <option value="active">กำลังดำเนินการ</option>
                      <option value="completed">เสร็จสิ้น</option>
                      <option value="suspended">ระงับ</option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="px-2 py-3.5 text-center relative">
                    <button onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                    {menuOpen === project.id && (
                      <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-40"
                        onClick={() => setMenuOpen(null)}>
                        {isLocked ? (
                          <div className="px-3 py-2 text-xs text-amber-600 flex items-center gap-2">
                            <Lock className="w-3 h-3" /> แก้ไขไม่ได้ (มีธุรกรรม)
                          </div>
                        ) : (
                          <button onClick={() => { setEditingProject(project); setShowModal(true) }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                            <Edit className="w-3.5 h-3.5" /> แก้ไข
                          </button>
                        )}
                        {project.status === 'active' && (
                          <button onClick={() => {
                            supabase.from('projects').update({ status: 'completed' }).eq('id', project.id).then(() => loadAll())
                          }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" /> เสร็จสิ้น
                          </button>
                        )}
                        {project.status === 'suspended' && (
                          <button onClick={() => {
                            supabase.from('projects').update({ status: 'active' }).eq('id', project.id).then(() => loadAll())
                          }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                            <PlayCircle className="w-3.5 h-3.5 text-green-600" /> ดำเนินการต่อ
                          </button>
                        )}
                        <hr className="my-1" />
                        <button onClick={() => deleteProject(project.id)}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${isLocked ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-red-50 text-red-600'}`}>
                          <Trash2 className="w-3.5 h-3.5" /> {isLocked ? 'ลบไม่ได้' : 'ลบ'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">ไม่พบโครงการ</p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? 'ลองเปลี่ยนคำค้นหา' : `ยังไม่มีโครงการใน${yearLabel}นี้`}
            </p>
            {!search && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button onClick={() => { setEditingProject(null); setShowModal(true) }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
                  <Plus className="w-4 h-4" /> สร้างโครงการแรก
                </button>
                <button onClick={() => setShowImport(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                  <Upload className="w-4 h-4" /> นำเข้า CSV
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile Cards ── */}
      <div className="md:hidden space-y-3">
        {filtered.map(project => {
          const isLocked = project.txCount > 0
          return (
            <div key={project.id} className={`bg-white rounded-xl shadow-sm border p-4 active:scale-[0.98] transition ${isLocked ? 'border-amber-200' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <input type="checkbox" checked={selected.has(project.id)} onChange={() => toggleSelect(project.id)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 flex-shrink-0" />
                    <Link href={`/projects/${project.id}`} className="font-semibold text-gray-800 truncate hover:text-purple-600">{project.name}</Link>
                    {isLocked && <Lock className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 ml-7">{project.responsible_person}</p>
                </div>
                <select value={project.status} onChange={e => {
                  supabase.from('projects').update({ status: e.target.value }).eq('id', project.id).then(() => loadAll())
                }}
                  className={`text-xs font-medium rounded-lg px-2 py-1 border-0 cursor-pointer ${
                    project.status === 'active' ? 'bg-green-50 text-green-700' :
                    project.status === 'completed' ? 'bg-blue-50 text-blue-700' : 'bg-yellow-50 text-yellow-700'
                  }`}>
                  <option value="active">ดำเนินการ</option>
                  <option value="completed">เสร็จสิ้น</option>
                  <option value="suspended">ระงับ</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mb-3 ml-7">
                <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${getWorkColor(project.work_group)}`}>
                  {getWorkLabel(project.work_group)}
                </span>
                <span className="text-xs text-gray-400">{project.fiscal_years?.name ? `${yearLabel} ${project.fiscal_years.name}` : ''}</span>
                {isLocked && <span className="text-xs text-amber-500">{project.txCount} รายการ</span>}
              </div>

              <div className="flex items-end justify-between ml-7">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">฿{Number(project.budget).toLocaleString()}</p>
                  {project.pct > 0 && (
                    <>
                      <div className="mt-1.5 w-full bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${project.pct > 100 ? 'bg-red-500' : project.pct > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(project.pct, 100)}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">ใช้ {project.pct.toFixed(0)}%</p>
                    </>
                  )}
                </div>
                <div className="flex gap-1 ml-3">
                  {!isLocked && (
                    <button onClick={() => { setEditingProject(project); setShowModal(true) }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                  <button onClick={() => deleteProject(project.id)}
                    className={`p-2 rounded-lg transition ${isLocked ? 'text-gray-300' : 'hover:bg-red-50 text-red-400'}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-gray-500 font-medium">ไม่พบโครงการ</p>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showModal && (
        <ProjectModal
          project={editingProject}
          fiscalYears={fiscalYears}
          categories={categories}
          workGroups={workGroups}
          yearLabel={yearLabel}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadAll() }}
        />
      )}

      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowImport(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-600" /> นำเข้าโครงการจาก CSV
              </h2>
              <button onClick={() => setShowImport(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-xs text-gray-600 space-y-1">
              <p className="font-medium mb-2">รูปแบบไฟล์ CSV:</p>
              <code className="block bg-white rounded px-2 py-1">name,budget,work_group,responsible_person,start_date,end_date</code>
              <code className="block bg-white rounded px-2 py-1">โครงการสอนภาษาอังกฤษ,150000,academic,อ.สมศรี,2024-10-01,2025-09-30</code>
              <code className="block bg-white rounded px-2 py-1">ปรับปรุงห้องคอม,500000,budget,อ.สมชาย,2024-11-01,2025-03-31</code>
              <p className="text-gray-400 mt-2">คอลัมน์ที่จำเป็น: name (ชื่อโครงการ)</p>
              <p className="text-gray-400">work_group: ใช้ชื่อกลุ่มงานตามที่ตั้งค่าในการตั้งค่าระบบ</p>
            </div>

            <input ref={fileRef} type="file" accept=".csv" onChange={handleImport}
              className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />

            <p className="text-xs text-gray-400 mt-3">
              โครงการจะถูกสร้างใน{yearLabel}ปัจจุบัน
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════
// PROJECT MODAL — locked fields when editing a project with transactions
// ═══════════════════════════════════════
function ProjectModal({
  project, fiscalYears, categories, workGroups, yearLabel, onClose, onSaved
}: {
  project: any; fiscalYears: any[]; categories: any[]; workGroups: any[]; yearLabel: string; onClose: () => void; onSaved: () => void
}) {
  const isLocked = project?.txCount > 0
  const [name, setName] = useState(project?.name || '')
  const [fiscalYearId, setFiscalYearId] = useState(project?.fiscal_year_id || '')
  const [budget, setBudget] = useState(project?.budget || '')
  const [workGroup, setWorkGroup] = useState(project?.work_group || 'general')
  const [responsiblePerson, setResponsiblePerson] = useState(project?.responsible_person || '')
  const [description, setDescription] = useState(project?.description || '')
  const [startDate, setStartDate] = useState(project?.start_date || '')
  const [endDate, setEndDate] = useState(project?.end_date || '')
  const [status, setStatus] = useState(project?.status || 'active')
  const [budgetCategories, setBudgetCategories] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (project) {
      supabase.from('budget_categories').select('*, category_types:category_type_id(category_key)')
        .eq('project_id', project.id).then(({ data }) => {
          const map: Record<string, string> = {}
          data?.forEach((bc: any) => { map[bc.category_type_id] = String(bc.budget_amount) })
          setBudgetCategories(map)
        })
    }
  }, [project])

  useEffect(() => {
    const fy = fiscalYears.find(f => f.id === fiscalYearId)
    if (fy && !project) { setStartDate(fy.start_date); setEndDate(fy.end_date) }
  }, [fiscalYearId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('กรุณากรอกชื่อโครงการ'); return }
    if (!fiscalYearId) { setError(`กรุณาเลือก${yearLabel}`); return }

    if (isLocked) {
      setError('โครงการนี้มีธุรกรรมแล้ว — ไม่สามารถแก้ไขชื่อ/งบประมาณ/วันที่ได้ (เปลี่ยนได้เฉพาะสถานะ)')
      return
    }

    setSaving(true)
    const data = {
      name: name.trim(), fiscal_year_id: fiscalYearId,
      budget: parseFloat(budget as string) || 0, work_group: workGroup,
      responsible_person: responsiblePerson.trim(),
      description: description.trim() || null, start_date: startDate, end_date: endDate, status
    }

    let projectId = project?.id
    if (project) {
      await supabase.from('projects').update(data).eq('id', project.id)
      await supabase.from('budget_categories').delete().eq('project_id', project.id)
    } else {
      const { data: newP } = await supabase.from('projects').insert(data).select('id').single()
      projectId = newP?.id
    }

    if (projectId) {
      const entries = Object.entries(budgetCategories).filter(([_, v]) => v && parseFloat(v) > 0)
      if (entries.length > 0) {
        await supabase.from('budget_categories').insert(
          entries.map(([catId, amt]) => ({ project_id: projectId, category_type_id: catId, budget_amount: parseFloat(amt) }))
        )
      }
    }

    setSaving(false)
    onSaved()
  }

  const activeFy = fiscalYears.find(fy => fy.is_active)
  const catTotal = Object.values(budgetCategories).reduce((s, v) => s + (parseFloat(v) || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 pt-[3vh] overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={`px-6 py-4 flex items-center justify-between ${isLocked ? 'bg-amber-500' : 'bg-gradient-to-r from-purple-600 to-purple-700'}`}>
          <h2 className="text-white font-semibold text-lg">
            {isLocked ? '🔒 ' : ''}{project ? 'แก้ไขโครงการ' : 'สร้างโครงการใหม่'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition">
            <X className="w-5 h-5 text-white/80" />
          </button>
        </div>

        {isLocked && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-2 text-sm text-amber-700">
            <Lock className="w-4 h-4 flex-shrink-0" />
            โครงการนี้มี {project.txCount} รายการธุรกรรม — แก้ไขได้เฉพาะสถานะเท่านั้น
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4 flex items-center gap-2">
              <X className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{yearLabel} <span className="text-red-500">*</span></label>
                <select value={fiscalYearId} onChange={e => setFiscalYearId(e.target.value)} required
                  disabled={isLocked}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none ${isLocked ? 'bg-gray-100 text-gray-500 border-gray-200' : 'border-gray-200 focus:ring-2 focus:ring-purple-200 focus:border-purple-400'}`}>
                  <option value="">เลือก{yearLabel}...</option>
                  {fiscalYears.map(fy => (
                    <option key={fy.id} value={fy.id}>{fy.name} {fy.is_active ? '(ปัจจุบัน)' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">ชื่อโครงการ <span className="text-red-500">*</span></label>
                <input value={name} onChange={e => setName(e.target.value)} required disabled={isLocked}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none ${isLocked ? 'bg-gray-100 text-gray-500 border-gray-200' : 'border-gray-200 focus:ring-2 focus:ring-purple-200 focus:border-purple-400'}`} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">งบประมาณ (บาท)</label>
                <input type="number" step="0.01" value={budget} onChange={e => setBudget(e.target.value)} disabled={isLocked}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none ${isLocked ? 'bg-gray-100 text-gray-500 border-gray-200' : 'border-gray-200 focus:ring-2 focus:ring-purple-200 focus:border-purple-400'}`} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">กลุ่มงาน</label>
                <div className="flex flex-wrap gap-2">
                  {workGroups.map((g: any) => (
                      <button key={g.id} type="button" onClick={() => setWorkGroup(g.name)} disabled={isLocked}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${isLocked && workGroup !== g.name ? 'opacity-40 cursor-not-allowed' : ''} ${workGroup === g.name ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {g.name}
                      </button>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">เริ่ม</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required disabled={isLocked}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none ${isLocked ? 'bg-gray-100 text-gray-500 border-gray-200' : 'border-gray-200 focus:ring-2 focus:ring-purple-200 focus:border-purple-400'}`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">สิ้นสุด</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required disabled={isLocked}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none ${isLocked ? 'bg-gray-100 text-gray-500 border-gray-200' : 'border-gray-200 focus:ring-2 focus:ring-purple-200 focus:border-purple-400'}`} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">ผู้รับผิดชอบ <span className="text-red-500">*</span></label>
                <input value={responsiblePerson} onChange={e => setResponsiblePerson(e.target.value)} required disabled={isLocked}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none ${isLocked ? 'bg-gray-100 text-gray-500 border-gray-200' : 'border-gray-200 focus:ring-2 focus:ring-purple-200 focus:border-purple-400'}`} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">คำอธิบาย</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} disabled={isLocked}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none resize-none ${isLocked ? 'bg-gray-100 text-gray-500 border-gray-200' : 'border-gray-200 focus:ring-2 focus:ring-purple-200 focus:border-purple-400'}`} />
              </div>

              {project && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">สถานะ</label>
                  <select value={status} onChange={e => setStatus(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none">
                    <option value="active">กำลังดำเนินการ</option>
                    <option value="completed">เสร็จสิ้น</option>
                    <option value="suspended">ระงับ</option>
                  </select>
                </div>
              )}

              {!isLocked && categories.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">แบ่งตามหมวดหมู่ <span className="text-gray-400 font-normal">(ไม่จำเป็น)</span></label>
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto border border-gray-200 rounded-xl p-3">
                    {categories.map(cat => (
                      <div key={cat.id} className="flex items-center gap-2">
                        <span className="flex-1 text-sm text-gray-700 truncate">{cat.category_name}</span>
                        <input type="number" step="0.01" placeholder="0"
                          value={budgetCategories[cat.id] || ''}
                          onChange={e => setBudgetCategories(prev => ({ ...prev, [cat.id]: e.target.value }))}
                          className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right focus:ring-1 focus:ring-purple-200 outline-none" />
                        <span className="text-xs text-gray-400 w-8">บาท</span>
                      </div>
                    ))}
                  </div>
                  {catTotal > 0 && (
                    <p className="text-xs text-green-600 mt-1.5">รวมหมวดหมู่: ฿{catTotal.toLocaleString()}</p>
                  )}
                </div>
              )}

              {isLocked && categories.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  <Lock className="w-3.5 h-3.5 inline mr-1" />
                  ไม่สามารถแก้ไขหมวดหมู่งบประมาณได้เนื่องจากมีธุรกรรมแล้ว
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
              {isLocked ? 'ปิด' : 'ยกเลิก'}
            </button>
            {!isLocked && (
              <button type="submit" disabled={saving}
                className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition shadow-sm shadow-purple-200">
                {saving ? 'กำลังบันทึก...' : project ? 'บันทึกการแก้ไข' : 'สร้างโครงการ'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
