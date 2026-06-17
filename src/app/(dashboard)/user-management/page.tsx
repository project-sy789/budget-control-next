'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { adminResetPassword, updateUserProfile, deleteUser as deleteUserAction } from '@/lib/auth/admin-actions'
import { Check, X, Trash2, UserCheck, KeyRound, Mail, Send, Copy, Users, Clock, Link2, Edit3, Save } from 'lucide-react'
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
  const [invitations, setInvitations] = useState<any[]>([])
  const [actionMsg, setActionMsg] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Inline edit state
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editDepartment, setEditDepartment] = useState('')
  const [editPosition, setEditPosition] = useState('')

  const supabase = createClient()

  useEffect(() => { loadUsers(); loadInvitations() }, [])

  async function loadUsers() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUserId(session?.user?.id || null)
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      
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

  async function loadInvitations() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase.from('invitations')
        .select('*')
        .order('created_at', { ascending: false })
      setInvitations(data || [])
    } catch {}
  }

  async function handleUpdateRole(userId: string, role: string) {
    if (isDemo) return
    setActionMsg('')
    if (userId === currentUserId) {
      setActionMsg('❌ ไม่สามารถเปลี่ยนบทบาทของตัวเองได้ — ให้ admin คนอื่นทำให้')
      return
    }
    const res = await updateUserProfile(userId, { role })
    if (res?.error) { setActionMsg('❌ ' + res.error); return }
    setActionMsg('✅ เปลี่ยนบทบาทแล้ว')
    loadUsers()
  }

  async function handleApproveUser(userId: string) {
    if (isDemo) return
    setActionMsg('')
    const user = users.find(u => u.id === userId)
    const newRole = user?.role === 'pending' ? 'user' : (user?.role || 'user')
    const res = await updateUserProfile(userId, { approved: true, role: newRole })
    if (res?.error) { setActionMsg('❌ ' + res.error); return }
    setActionMsg('✅ อนุมัติผู้ใช้แล้ว')
    loadUsers()
  }

  async function handleDeleteUser(userId: string, name: string) {
    if (isDemo) return
    if (!confirm(`ลบผู้ใช้ "${name}"? การกระทำนี้ไม่สามารถย้อนกลับได้`)) return
    setActionMsg('')
    const res = await deleteUserAction(userId)
    if (res?.error) { setActionMsg('❌ ' + res.error); return }
    setActionMsg('✅ ลบผู้ใช้แล้ว')
    loadUsers()
  }

  async function handleSaveEdit(userId: string) {
    if (isDemo) return
    setActionMsg('')
    if (userId === currentUserId && editRole !== (users.find(u => u.id === userId)?.role)) {
      setActionMsg('❌ ไม่สามารถเปลี่ยนบทบาทของตัวเองได้')
      return
    }
    const res = await updateUserProfile(userId, { display_name: editName, role: editRole, department: editDepartment, position: editPosition })
    if (res?.error) { setActionMsg('❌ ' + res.error); return }
    setActionMsg('✅ อัปเดตผู้ใช้แล้ว')
    setEditingUser(null)
    loadUsers()
  }

  async function createInvitation() {
    if (!inviteEmail) return
    setInviteMsg('')
    setInviteLink('')

    if (!inviteEmail.includes('@')) {
      setInviteMsg('❌ กรุณากรอกอีเมลที่ถูกต้อง')
      return
    }

    if (isDemo) {
      const token = crypto.randomUUID()
      setInviteLink(`${window.location.origin}/invite/${token}`)
      setInviteMsg('🔶 โหมดตัวอย่าง — ลิงก์นี้ใช้ได้เฉพาะใน demo')
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      setInviteMsg('❌ ไม่พบ session — กรุณาเข้าสู่ระบบใหม่')
      return
    }
    
    const userId = session.user.id

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('active_organization_id')
      .eq('id', userId)
      .single()
    
    if (profileError || !profile?.active_organization_id) {
      setInviteMsg('❌ ไม่พบข้อมูลองค์กร — ' + (profileError?.message || 'กรุณาติดต่อผู้ดูแล'))
      return
    }

    const orgId = profile.active_organization_id

    // Check for existing pending invitation for same email
    const { data: existing } = await supabase.from('invitations')
      .select('id, status')
      .eq('organization_id', orgId)
      .eq('email', inviteEmail)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) {
      setInviteMsg('❌ มีคำเชิญสำหรับอีเมลนี้อยู่แล้ว — สถานะ: รอดำเนินการ')
      return
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    
    const { error } = await supabase.from('invitations').insert({
      organization_id: orgId, email: inviteEmail, role: inviteRole,
      invited_by: userId, token, status: 'pending', expires_at: expiresAt,
    })
    
    if (error) { 
      setInviteMsg('❌ สร้างลิงก์ไม่สำเร็จ: ' + error.message)
      return 
    }

    await supabase.from('activity_log').insert({
      organization_id: orgId,
      user_id: userId,
      action: 'สร้างลิงก์เชิญ',
      target_type: 'invitation',
      metadata: { email: inviteEmail, role: inviteRole, token }
    })

    setInviteLink(`${window.location.origin}/invite/${token}`)
    setInviteMsg('✅ สร้างลิงก์เชิญสำเร็จ!')
    loadInvitations()
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

      {actionMsg && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm ${actionMsg.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
          {actionMsg}
        </div>
      )}

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

      {/* ── Invitations History ── */}
      {invitations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
            <Link2 className="w-3.5 h-3.5" /> ประวัติการเชิญ ({invitations.length})
          </h3>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="text-left px-3 py-2 text-gray-500">อีเมล</th>
                  <th className="text-center px-3 py-2 text-gray-500">บทบาท</th>
                  <th className="text-center px-3 py-2 text-gray-500">สถานะ</th>
                  <th className="text-right px-3 py-2 text-gray-500">สร้างเมื่อ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invitations.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="px-3 py-2 text-gray-600">{inv.email}</td>
                    <td className="px-3 py-2 text-center text-gray-500">{inv.role}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                        inv.status === 'accepted' ? 'bg-green-100 text-green-600' :
                        inv.status === 'expired' ? 'bg-red-100 text-red-500' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {inv.status === 'accepted' ? 'ใช้แล้ว' : inv.status === 'expired' ? 'หมดอายุ' : 'รอ'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400">
                      {new Date(inv.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Users Table ── */}
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
              {users.map(user => {
                const isEditing = editingUser === user.id
                return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {isEditing ? (
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        className="w-full px-2 py-1 border border-purple-200 rounded text-xs" placeholder="ชื่อ" />
                    ) : (
                      <>
                        <div>{user.display_name}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(user.created_at).toLocaleDateString('th-TH')}
                        </div>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{user.email}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {isEditing ? (
                      <div className="flex gap-1.5">
                        <input value={editPosition} onChange={e => setEditPosition(e.target.value)}
                          className="w-1/2 px-1.5 py-0.5 border border-purple-200 rounded text-xs" placeholder="ตำแหน่ง" />
                        <input value={editDepartment} onChange={e => setEditDepartment(e.target.value)}
                          className="w-1/2 px-1.5 py-0.5 border border-purple-200 rounded text-xs" placeholder="แผนก" />
                      </div>
                    ) : (
                      [user.position, user.department].filter(Boolean).join(' / ') || '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isEditing ? (
                      user.id === currentUserId ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400" title="ไม่สามารถเปลี่ยนบทบาทของตัวเองได้">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                            {roleLabels[user.role]}
                          </span>
                          <span className="text-[10px]">🔒</span>
                        </span>
                      ) : (
                        <select value={editRole} onChange={e => setEditRole(e.target.value)}
                          className="text-xs border border-purple-200 rounded px-1.5 py-0.5">
                          <option value="pending">รออนุมัติ</option>
                          <option value="user">ผู้ใช้</option>
                          <option value="manager">ผู้จัดการ</option>
                          <option value="admin">ผู้ดูแล</option>
                        </select>
                      )
                    ) : (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    )}
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
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveEdit(user.id)}
                            className="p-1 hover:bg-green-50 rounded text-green-600" title="บันทึก">
                            <Save className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingUser(null)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400" title="ยกเลิก">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingUser(user.id); setEditName(user.display_name || ''); setEditRole(user.role); setActionMsg('') }}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600" title="แก้ไข">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <select value={user.role} onChange={e => handleUpdateRole(user.id, e.target.value)}
                            disabled={user.id === currentUserId}
                            className={`text-xs border border-gray-200 rounded px-1 py-0.5 ${user.id === currentUserId ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                            title={user.id === currentUserId ? 'ไม่สามารถเปลี่ยนบทบาทของตัวเอง' : ''}>
                            <option value="pending">รออนุมัติ</option>
                            <option value="user">ผู้ใช้</option>
                            <option value="manager">ผู้จัดการ</option>
                            <option value="admin">ผู้ดูแล</option>
                          </select>
                          {!user.approved && (
                            <button onClick={() => handleApproveUser(user.id)}
                              className="p-1 hover:bg-gray-100 rounded text-green-600" title="อนุมัติ">
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => setResetModal({ userId: user.id, displayName: user.display_name })}
                            className="p-1 hover:bg-gray-100 rounded text-purple-500" title="รีเซ็ตรหัสผ่าน">
                            <KeyRound className="w-4 h-4" />
                          </button>
                          {user.role !== 'admin' && (
                            <button onClick={() => handleDeleteUser(user.id, user.display_name || user.email)}
                              className="p-1 hover:bg-gray-100 rounded text-red-500" title="ลบ">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
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
