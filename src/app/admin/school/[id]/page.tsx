'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getSchoolDetail } from '@/lib/api/admin-school'
import { adminResetPassword } from '@/lib/auth/admin-actions'
import { 
  Building2, Users, FolderOpen, Calculator, ArrowLeft, Mail, Clock, 
  CheckCircle, XCircle, KeyRound, BarChart3, Calendar, Tag, RefreshCw
} from 'lucide-react'

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Reset password
  const [resetModal, setResetModal] = useState<{ userId: string; displayName: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetMsg, setResetMsg] = useState('')
  const [resetting, setResetting] = useState(false)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true); setError('')
    try {
      const result = await getSchoolDetail(id as string)
      setData(result)
    } catch (e: any) {
      setError(e.message || 'โหลดข้อมูลไม่สำเร็จ')
    }
    setLoading(false)
  }

  async function handleResetPassword() {
    if (!resetModal) return
    if (newPassword.length < 6) { setResetMsg('❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัว'); return }
    setResetting(true); setResetMsg('')
    const result = await adminResetPassword(resetModal.userId, newPassword)
    if (result?.error) { setResetMsg('❌ ' + result.error) }
    else { setResetMsg('✅ รีเซ็ตสำเร็จ! รหัสใหม่: ' + newPassword); setNewPassword(''); loadData() }
    setResetting(false)
  }

  const formatAmount = (a: number) => new Intl.NumberFormat('th-TH').format(a || 0)
  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })

  const roleLabels: Record<string, string> = { owner: 'เจ้าของ', admin: 'ผู้ดูแล', manager: 'ผู้จัดการ', member: 'สมาชิก', user: 'ผู้ใช้', pending: 'รออนุมัติ' }
  const roleColors: Record<string, string> = { owner: 'bg-purple-100 text-purple-700', admin: 'bg-red-100 text-red-700', manager: 'bg-blue-100 text-blue-700', member: 'bg-gray-100 text-gray-600', user: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700' }

  const typeIcons: Record<string, any> = { income: Calculator, expense: Calculator, transfer_in: Calculator, transfer_out: Calculator }
  const typeLabels: Record<string, string> = { income: 'รายรับ', expense: 'รายจ่าย', transfer_in: 'รับโอน', transfer_out: 'โอนออก' }
  const typeColors: Record<string, string> = { income: 'text-green-600', expense: 'text-red-600', transfer_in: 'text-blue-600', transfer_out: 'text-orange-600' }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (error || !data?.org) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{error || 'ไม่พบโรงเรียน'}</p>
          <Link href="/admin" className="text-purple-600 text-sm mt-3 inline-block hover:underline">← กลับหน้า Admin</Link>
        </div>
      </div>
    )
  }

  const { org, members, projects, transactions, fiscalYears, workGroups, counts } = data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-sm font-bold text-purple-600">
            {org.name.charAt(0)}
          </div>
          <div>
            <h1 className="font-bold text-gray-800">{org.name}</h1>
            <p className="text-xs text-gray-500">{org.slug} · {org.type === 'office' ? 'เขตพื้นที่' : 'โรงเรียน'} · {org.subscription_status === 'active' ? '🟢 ใช้งาน' : '🔴 ระงับ'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm flex items-center gap-1.5 transition">
            <RefreshCw className="w-3.5 h-3.5" /> รีเฟรช
          </button>
          <Link href="/admin" className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
            กลับ
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'สมาชิก', value: members.length, icon: Users, color: 'bg-blue-500' },
            { label: 'โครงการ', value: counts.projects, icon: FolderOpen, color: 'bg-green-500' },
            { label: 'รายการ', value: counts.transactions, icon: Calculator, color: 'bg-orange-500' },
            { label: 'ปีงบประมาณ', value: fiscalYears.length, icon: Calendar, color: 'bg-purple-500' },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{card.value.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {fiscalYears.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" /> ปีงบประมาณ</h2>
            <div className="flex flex-wrap gap-2">
              {fiscalYears.map((fy: any) => (
                <span key={fy.id} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${fy.is_active ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                  {fy.name} {fy.is_active && '✓'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Members */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> สมาชิก ({members.length})</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">ชื่อ</th>
                    <th className="text-left px-3 py-3 font-medium text-gray-500 text-xs uppercase">อีเมล</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs uppercase">บทบาท</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs uppercase">สถานะ</th>
                    <th className="text-right px-3 py-3 font-medium text-gray-500 text-xs uppercase">เข้าร่วมเมื่อ</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs uppercase w-[80px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {members.map((m: any) => {
                    const profile = m.profiles
                    if (!profile) return null
                    return (
                      <tr key={profile.id} className="hover:bg-purple-50/30 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                              {(profile.display_name || profile.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-xs">{profile.display_name || 'ไม่ระบุ'}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{profile.id?.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">{profile.email}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[m.role] || 'bg-gray-100'}`}>
                            {roleLabels[m.role] || m.role}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {profile.approved ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3" /> อนุมัติ</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-yellow-600"><Clock className="w-3 h-3" /> รออนุมัติ</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-xs text-gray-400">
                          {m.joined_at ? formatDate(m.joined_at) : '—'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button onClick={() => { setResetModal({ userId: profile.id, displayName: profile.display_name || profile.email }); setResetMsg(''); setNewPassword('') }}
                            className="p-1.5 hover:bg-purple-50 rounded-lg transition text-purple-500 hover:text-purple-700"
                            title="รีเซ็ตรหัสผ่าน">
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {members.length === 0 && (
              <div className="py-8 text-center text-gray-400 text-sm">ยังไม่มีสมาชิก</div>
            )}
          </div>
        </div>

        {/* Projects */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2"><FolderOpen className="w-4 h-4" /> โครงการ ({counts.projects})</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">โครงการ</th>
                    <th className="text-left px-3 py-3 font-medium text-gray-500 text-xs uppercase">กลุ่มงาน</th>
                    <th className="text-right px-3 py-3 font-medium text-gray-500 text-xs uppercase">งบประมาณ</th>
                    <th className="text-right px-3 py-3 font-medium text-gray-500 text-xs uppercase">ใช้ไป</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs uppercase">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {projects.slice(0, 20).map((p: any) => (
                    <tr key={p.id} className="hover:bg-purple-50/30 transition">
                      <td className="px-4 py-3"><p className="font-medium text-gray-800 text-xs">{p.name}</p></td>
                      <td className="px-3 py-3"><span className="text-xs text-gray-500">{p.work_group || '—'}</span></td>
                      <td className="px-3 py-3 text-right text-xs text-gray-700">{formatAmount(p.budget)}</td>
                      <td className="px-3 py-3 text-right text-xs">
                        <span className={p.used_budget > p.budget * 0.8 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {formatAmount(p.used_budget)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.status === 'active' ? 'bg-green-100 text-green-700' : 
                          p.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {p.status === 'active' ? 'ดำเนินการ' : p.status === 'completed' ? 'เสร็จสิ้น' : 'ระงับ'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {projects.length === 0 && (
              <div className="py-8 text-center text-gray-400 text-sm">ยังไม่มีโครงการ</div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2"><Calculator className="w-4 h-4" /> รายการล่าสุด</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">รายการ</th>
                    <th className="text-left px-3 py-3 font-medium text-gray-500 text-xs uppercase">โครงการ</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs uppercase">ประเภท</th>
                    <th className="text-right px-3 py-3 font-medium text-gray-500 text-xs uppercase">จำนวน</th>
                    <th className="text-right px-3 py-3 font-medium text-gray-500 text-xs uppercase">วันที่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.slice(0, 30).map((t: any) => (
                    <tr key={t.id} className="hover:bg-purple-50/30 transition">
                      <td className="px-4 py-2.5 text-xs text-gray-700">{t.description || '—'}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{t.projects?.name || '—'}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-xs font-medium ${typeColors[t.transaction_type]}`}>
                          {typeLabels[t.transaction_type] || t.transaction_type}
                        </span>
                      </td>
                      <td className={`px-3 py-2.5 text-right text-xs font-medium ${t.transaction_type === 'income' || t.transaction_type === 'transfer_in' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.transaction_type === 'expense' || t.transaction_type === 'transfer_out' ? '-' : '+'}{formatAmount(t.amount)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs text-gray-400">{formatDate(t.transaction_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {transactions.length === 0 && (
              <div className="py-8 text-center text-gray-400 text-sm">ยังไม่มีรายการ</div>
            )}
          </div>
        </div>

        {/* Work groups summary */}
        {workGroups.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2"><Tag className="w-4 h-4" /> กลุ่มงาน ({workGroups.length})</h2>
            <div className="flex flex-wrap gap-2">
              {workGroups.map((wg: any) => (
                <span key={wg.id} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700">
                  {wg.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Password Reset Modal ── */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setResetModal(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-gray-800">รีเซ็ตรหัสผ่าน</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              ตั้งรหัสผ่านใหม่สำหรับ <strong>{resetModal.displayName}</strong><br />
              <span className="text-xs text-gray-400 font-mono">ID: {resetModal.userId}</span>
            </p>
            {resetMsg && (
              <div className={`text-sm rounded-lg p-3 mb-3 ${resetMsg.startsWith('✅') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {resetMsg}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
                <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="อย่างน้อย 6 ตัว" autoFocus />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setResetModal(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">ยกเลิก</button>
                <button onClick={handleResetPassword} disabled={resetting}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
                  {resetting ? 'กำลังรีเซ็ต...' : 'ยืนยันรีเซ็ต'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
