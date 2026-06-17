'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAllOrganizations, getOrganizationMemberCounts, updateOrganizationStatus, getAllUsers, adminResetPassword } from '@/lib/auth/admin-actions'
import { Building2, Users, FolderOpen, Calculator, Search, Shield, CheckCircle, RefreshCw, PlusCircle, Ban, Eye, Mail, KeyRound, Clock, UserCheck, XCircle } from 'lucide-react'
import Link from 'next/link'

type Tab = 'schools' | 'users'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('schools')
  const [orgs, setOrgs] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({})
  const [stats, setStats] = useState({ totalOrgs: 0, totalUsers: 0, totalProjects: 0, totalTransactions: 0 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')

  // Password reset modal
  const [resetModal, setResetModal] = useState<{ userId: string; displayName: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetMsg, setResetMsg] = useState('')
  const [resetting, setResetting] = useState(false)

  const supabase = createClient()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    let loadedOrgs: any[] = []
    
    try {
      loadedOrgs = await getAllOrganizations()
      if (loadedOrgs?.length > 0) setOrgs(loadedOrgs)
      else {
        const { data } = await supabase.from('organizations').select('*').order('created_at', { ascending: false })
        loadedOrgs = data || []; setOrgs(loadedOrgs)
      }
    } catch {
      const { data } = await supabase.from('organizations').select('*').order('created_at', { ascending: false })
      loadedOrgs = data || []; setOrgs(loadedOrgs)
    }

    // Load users
    try {
      const allUsers = await getAllUsers()
      if (allUsers) setUsers(allUsers)
    } catch {}

    // Member counts
    try { const counts = await getOrganizationMemberCounts(); if (counts) setMemberCounts(counts) } catch {}

    // Stats
    try {
      const res = await fetch('/api/admin-stats')
      if (res.ok) {
        const data = await res.json()
        setStats({ totalOrgs: loadedOrgs.length, totalUsers: data.totalUsers || 0, totalProjects: data.totalProjects || 0, totalTransactions: data.totalTransactions || 0 })
        setLoading(false); return
      }
    } catch {}
    setStats({ totalOrgs: loadedOrgs.length, totalUsers: users.length, totalProjects: 0, totalTransactions: 0 })
    setLoading(false)
  }

  async function handleStatusToggle(orgId: string, currentStatus: string) {
    setActionMsg('')
    try {
      const res = await updateOrganizationStatus(orgId, currentStatus === 'active' ? 'cancelled' : 'active')
      if (res?.error) { setActionMsg('❌ ' + res.error); return }
      setActionMsg(`✅ อัปเดตสถานะแล้ว`)
      loadAll()
    } catch (e: any) { setActionMsg('❌ ' + (e.message || 'เกิดข้อผิดพลาด')) }
  }

  async function handleResetPassword() {
    if (!resetModal) return
    if (newPassword.length < 6) { setResetMsg('❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัว'); return }
    setResetting(true); setResetMsg('')
    const result = await adminResetPassword(resetModal.userId, newPassword)
    if (result?.error) { setResetMsg('❌ ' + result.error) }
    else { setResetMsg('✅ รีเซ็ตสำเร็จ! รหัสใหม่: ' + newPassword); setNewPassword('') }
    setResetting(false)
  }

  const filteredOrgs = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) || o.slug.toLowerCase().includes(search.toLowerCase())
  )

  const filteredUsers = users.filter(u =>
    (u.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.org_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const activeCount = orgs.filter(o => o.subscription_status === 'active').length
  const pendingCount = orgs.filter(o => o.subscription_status === 'trial').length

  const roleLabels: Record<string, string> = { admin: 'ผู้ดูแล', manager: 'ผู้จัดการ', user: 'ผู้ใช้', pending: 'รออนุมัติ', owner: 'เจ้าของ', member: 'สมาชิก' }
  const roleColors: Record<string, string> = { admin: 'bg-red-100 text-red-700', manager: 'bg-blue-100 text-blue-700', user: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', owner: 'bg-purple-100 text-purple-700', member: 'bg-gray-100 text-gray-600' }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-purple-600" />
          <div>
            <h1 className="font-bold text-gray-800">Super Admin</h1>
            <p className="text-xs text-gray-500">ฟรี 100% — จัดการทุกโรงเรียนและผู้ใช้</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadAll} className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm flex items-center gap-1.5 transition">
            <RefreshCw className="w-3.5 h-3.5" /> รีเฟรช
          </button>
          <Link href="/dashboard" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition">
            กลับแดชบอร์ด
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'โรงเรียน', value: stats.totalOrgs, icon: Building2, color: 'bg-purple-500' },
            { label: 'เปิดใช้งาน', value: activeCount, icon: CheckCircle, color: 'bg-green-500' },
            { label: 'ผู้ใช้ทั้งหมด', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
            { label: 'โครงการ', value: stats.totalProjects, icon: FolderOpen, color: 'bg-indigo-500' },
            { label: 'รายการ', value: stats.totalTransactions, icon: Calculator, color: 'bg-orange-500' },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 ${card.color} rounded-lg flex items-center justify-center`}>
                  <card.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className="text-xl font-bold text-gray-800">{card.value.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {actionMsg && (
          <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm ${actionMsg.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
            {actionMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => { setTab('schools'); setSearch('') }}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 ${tab === 'schools' ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            <Building2 className="w-4 h-4" /> โรงเรียน ({orgs.length})
          </button>
          <button onClick={() => { setTab('users'); setSearch('') }}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 ${tab === 'users' ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            <Users className="w-4 h-4" /> ผู้ใช้ ({users.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder={tab === 'schools' ? 'ค้นหาโรงเรียน...' : 'ค้นหาผู้ใช้ตามชื่อ อีเมล หรือโรงเรียน...'} value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none" />
        </div>

        {/* ── SCHOOLS TABLE ── */}
        {tab === 'schools' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="py-12 text-center text-gray-400">กำลังโหลด...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">โรงเรียน</th>
                      <th className="text-left px-3 py-3 font-medium text-gray-500 text-xs uppercase">ประเภท</th>
                      <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs uppercase">สมาชิก</th>
                      <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs uppercase">สถานะ</th>
                      <th className="text-right px-3 py-3 font-medium text-gray-500 text-xs uppercase">สมัครเมื่อ</th>
                      <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs uppercase w-[80px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredOrgs.map(org => {
                      const isActive = org.subscription_status === 'active'
                      const isPending = org.subscription_status === 'trial'
                      return (
                        <tr key={org.id} className="hover:bg-purple-50/30 transition">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isActive ? 'bg-purple-100 text-purple-600' : isPending ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                                {org.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{org.name}</p>
                                <p className="text-xs text-gray-400">{org.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3.5"><span className="text-xs text-gray-500">{org.type === 'office' ? 'เขตพื้นที่' : 'โรงเรียน'}</span></td>
                          <td className="px-3 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700">
                              <Users className="w-3 h-3 text-gray-400" />{memberCounts[org.id] || 0}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <button onClick={() => handleStatusToggle(org.id, org.subscription_status)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition hover:opacity-80 ${isActive ? 'bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600' : isPending ? 'bg-amber-100 text-amber-700 hover:bg-green-50 hover:text-green-600' : 'bg-red-100 text-red-700 hover:bg-green-50 hover:text-green-600'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : isPending ? 'bg-amber-500' : 'bg-red-500'}`} />
                              {isActive ? 'ใช้งาน' : isPending ? 'รออนุมัติ' : 'ระงับ'}
                            </button>
                          </td>
                          <td className="px-3 py-3.5 text-right text-xs text-gray-400">
                            {new Date(org.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <Link href={`/admin/school/${org.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-purple-600 inline-flex">
                              <Eye className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && filteredOrgs.length === 0 && (
              <div className="py-12 text-center"><Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">ไม่พบโรงเรียน</p></div>
            )}
          </div>
        )}

        {/* ── USERS TABLE ── */}
        {tab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="py-12 text-center text-gray-400">กำลังโหลด...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">ผู้ใช้</th>
                      <th className="text-left px-3 py-3 font-medium text-gray-500 text-xs uppercase">อีเมล</th>
                      <th className="text-left px-3 py-3 font-medium text-gray-500 text-xs uppercase">โรงเรียน</th>
                      <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs uppercase">บทบาท</th>
                      <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs uppercase">สถานะ</th>
                      <th className="text-right px-3 py-3 font-medium text-gray-500 text-xs uppercase">สมัครเมื่อ</th>
                      <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs uppercase">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-purple-50/30 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                              {(user.display_name || user.email || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{user.display_name || 'ไม่ระบุชื่อ'}</p>
                              <p className="text-xs text-gray-400 font-mono">{user.id?.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600">{user.org_name}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.org_role] || 'bg-gray-100 text-gray-600'}`}>
                            {roleLabels[user.org_role] || user.org_role}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {user.approved ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3" /> อนุมัติ</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-yellow-600"><Clock className="w-3 h-3" /> รออนุมัติ</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-xs text-gray-400">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '—'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button onClick={() => { setResetModal({ userId: user.id, displayName: user.display_name || user.email }); setResetMsg(''); setNewPassword('') }}
                            className="p-1.5 hover:bg-purple-50 rounded-lg transition text-purple-500 hover:text-purple-700 inline-flex"
                            title="รีเซ็ตรหัสผ่าน">
                            <KeyRound className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && filteredUsers.length === 0 && (
              <div className="py-12 text-center"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">ไม่พบผู้ใช้</p></div>
            )}
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
                <button onClick={() => setResetModal(null)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">ยกเลิก</button>
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
