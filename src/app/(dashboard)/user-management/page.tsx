'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { adminResetPassword } from '@/lib/auth/admin-actions'
import { Check, X, Trash2, UserCheck, KeyRound, Mail, Send, Copy, Users } from 'lucide-react'
import { DEMO_PROFILES } from '@/lib/mock-data'

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [resetModal, setResetModal] = useState<{ userId: string; displayName: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState('')
  const [resetting, setResetting] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviteLink, setInviteLink] = useState('')
  const [inviteMsg, setInviteMsg] = useState('')
  const [isDemo, setIsDemo] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      
      // Unauthenticated or no data → demo mode
      if (!session || !data?.length) {
        setIsDemo(true)
        setUsers(DEMO_PROFILES)
        setLoading(false)
        return
      }
      
      setUsers(data)
    } catch {
      setIsDemo(true)
      setUsers(DEMO_PROFILES)
    }
    setLoading(false)
  }

  async function updateStatus(userId: string, role: string, approved: boolean) {
    if (isDemo) return
    // If approving, auto-upgrade from 'pending' to 'user' if still pending
    const effectiveRole = approved && role === 'pending' ? 'user' : role
    await supabase.from('profiles').update({ role: effectiveRole, approved }).eq('id', userId)
    loadUsers()
  }

  async function approveUser(userId: string) {
    if (isDemo) return
    const user = users.find(u => u.id === userId)
    const newRole = user?.role === 'pending' ? 'user' : user?.role
    await supabase.from('profiles').update({ approved: true, role: newRole }).eq('id', userId)
    loadUsers()
  }

  async function deleteUser(userId: string) {
    if (isDemo) return
    if (!confirm('ลบผู้ใช้นี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) return
    await supabase.from('profiles').delete().eq('id', userId)
    loadUsers()
  }

  async function createInvitation() {
    if (!inviteEmail) return
    setInviteMsg('')

    // Demo mode: generate a fake invite link
    if (isDemo) {
      const token = crypto.randomUUID()
      setInviteLink(`${window.location.origin}/invite/${token}`)
      setInviteMsg('🔶 โหมดตัวอย่าง — ลิงก์นี้ใช้ได้เฉพาะใน demo')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles')
      .select('active_organization_id').eq('id', user.id).single()
    const orgId = profile?.active_organization_id
    if (!orgId) return
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await supabase.from('invitations').insert({
      organization_id: orgId, email: inviteEmail, role: inviteRole,
      invited_by: user.id, token, status: 'pending', expires_at: expiresAt,
    })
    if (error) { setInviteMsg('❌ ' + error.message); return }
    setInviteLink(`${window.location.origin}/invite/${token}`)
  }

  async function handleResetPassword() {
    if (isDemo) { setResetError('🔶 โหมดตัวอย่าง — ไม่สามารถรีเซ็ตรหัสผ่านจริงได้'); return }
    if (!resetModal) return
    if (newPassword.length < 6) { setResetError('รหัสผ่านต้องมีอย่างน้อย 6 ตัว'); return }
    setResetting(true)
    setResetError('')
    setResetSuccess('')
    const result = await adminResetPassword(resetModal.userId, newPassword)
    if (result?.error) {
      setResetError(result.error)
    } else {
      setResetSuccess('รีเซ็ตรหัสผ่านสำเร็จ! รหัสใหม่: ' + newPassword)
      setNewPassword('')
      setTimeout(() => {
        setResetModal(null)
        setResetError('')
        setResetSuccess('')
      }, 3000)
    }
    setResetting(false)
  }

  const roleLabels: Record<string, string> = { admin: 'ผู้ดูแล', manager: 'ผู้จัดการ', user: 'ผู้ใช้', pending: 'รออนุมัติ' }
  const roleColors: Record<string, string> = { admin: 'bg-red-100 text-red-700', manager: 'bg-blue-100 text-blue-700', user: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700' }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">จัดการผู้ใช้</h1>

      {/* ── Invite Card ── */}
      {!showInvite ? (
        <button onClick={() => setShowInvite(true)}
          className="w-full bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 mb-6 text-left hover:shadow-md transition group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800 text-sm">เชิญสมาชิกเข้าโรงเรียน</p>
              <p className="text-xs text-gray-500">ส่งลิงก์เชิญทางอีเมล — ผู้ใช้ใหม่จะได้รับบทบาทที่คุณกำหนด</p>
            </div>
            <Send className="w-4 h-4 text-purple-400 ml-auto" />
          </div>
        </button>
      ) : (
        <div className="bg-white border border-purple-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" /> เชิญสมาชิกใหม่
            </h3>
            <button onClick={() => { setShowInvite(false); setInviteMsg(''); setInviteLink('') }}
              className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {inviteLink ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-medium text-green-800 mb-2">✅ ลิงก์เชิญพร้อมแล้ว</p>
              <div className="flex items-center gap-2">
                <input readOnly value={inviteLink}
                  className="flex-1 px-3 py-2 bg-white border border-green-200 rounded-lg text-sm text-gray-600 font-mono" />
                <button onClick={() => { navigator.clipboard.writeText(inviteLink); setInviteMsg('คัดลอกแล้ว!') }}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-green-700">
                  <Copy className="w-3.5 h-3.5" /> คัดลอก
                </button>
              </div>
              {inviteMsg && <p className="text-xs text-green-600 mt-1.5">{inviteMsg}</p>}
              <p className="text-xs text-green-600 mt-2">
                ลิงก์นี้หมดอายุใน 7 วัน — ส่งให้สมาชิกใหม่เพื่อสมัครเข้าโรงเรียน
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">อีเมลผู้รับเชิญ</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                      placeholder="teacher@school.ac.th"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" />
                  </div>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
                    <option value="member">สมาชิก</option>
                    <option value="manager">ผู้จัดการ</option>
                    <option value="admin">ผู้ดูแล</option>
                  </select>
                </div>
              </div>
              <button onClick={createInvitation}
                className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> สร้างลิงก์เชิญ
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">อีเมล</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ตำแหน่ง/แผนก</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">บทบาท</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <div>{user.display_name}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(user.created_at).toLocaleDateString('th-TH')}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{user.email}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {[user.position, user.department].filter(Boolean).join(' / ') || '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.approved ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <Check className="w-3 h-3" /> อนุมัติแล้ว
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                        <X className="w-3 h-3" /> รออนุมัติ
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      <select
                        value={user.role}
                        onChange={e => updateStatus(user.id, e.target.value, user.approved)}
                        className="text-xs border border-gray-200 rounded px-1 py-0.5"
                      >
                        <option value="pending">รออนุมัติ</option>
                        <option value="user">ผู้ใช้</option>
                        <option value="manager">ผู้จัดการ</option>
                        <option value="admin">ผู้ดูแล</option>
                      </select>
                      {!user.approved && (
                        <button
                          onClick={() => updateStatus(user.id, user.role, true)}
                          className="p-1 hover:bg-gray-100 rounded text-green-600"
                          title="อนุมัติ"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setResetModal({ userId: user.id, displayName: user.display_name })}
                        className="p-1 hover:bg-gray-100 rounded text-purple-500"
                        title="รีเซ็ตรหัสผ่าน"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-1 hover:bg-gray-100 rounded text-red-500"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    ยังไม่มีผู้ใช้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Password Reset Modal ── */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => { setResetModal(null); setResetError(''); setResetSuccess('') }}>
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-gray-800">รีเซ็ตรหัสผ่าน</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              ตั้งรหัสผ่านใหม่สำหรับ <strong>{resetModal.displayName}</strong>
            </p>

            {resetError && (
              <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-3">{resetError}</div>
            )}
            {resetSuccess && (
              <div className="bg-green-50 text-green-600 text-sm rounded-lg p-3 mb-3">{resetSuccess}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="อย่างน้อย 6 ตัว"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">
                  ผู้ใช้ควรเปลี่ยนรหัสผ่านหลังจากเข้าสู่ระบบครั้งแรก
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setResetModal(null); setResetError(''); setResetSuccess('') }}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={resetting}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                >
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
