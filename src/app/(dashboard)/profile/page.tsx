'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Shield, Calendar, KeyRound, Briefcase, MapPin, Save } from 'lucide-react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [editMode, setEditMode] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [department, setDepartment] = useState('')
  const [position, setPosition] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const { data } = await supabase.from('profiles').select('*').single()
    if (data) {
      setProfile(data)
      setDisplayName(data.display_name || '')
      setDepartment(data.department || '')
      setPosition(data.position || '')
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMessage('ไม่พบผู้ใช้'); setSaving(false); return }

    const { error } = await supabase.from('profiles').update({
      display_name: displayName,
      department: department || null,
      position: position || null
    }).eq('id', user.id)

    if (error) setMessage('เกิดข้อผิดพลาด: ' + error.message)
    else { setMessage('บันทึกข้อมูลสำเร็จ'); setEditMode(false); loadProfile() }
    setSaving(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setMessage('รหัสผ่านไม่ตรงกัน'); return }
    if (newPassword.length < 6) { setMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัว'); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setMessage('เกิดข้อผิดพลาด: ' + error.message)
    else { setMessage('เปลี่ยนรหัสผ่านสำเร็จ!'); setNewPassword(''); setConfirmPassword('') }
  }

  const roleLabels: Record<string, string> = { admin: 'ผู้ดูแลระบบ', manager: 'ผู้จัดการ', user: 'ผู้ใช้', pending: 'รออนุมัติ' }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">โปรไฟล์</h1>

      {message && (
        <div className={`text-sm rounded-xl p-3 mb-4 ${message.includes('สำเร็จ') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {message}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Profile Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">ข้อมูลผู้ใช้</h2>
            <button onClick={() => setEditMode(!editMode)}
              className="text-sm text-purple-600 hover:underline">
              {editMode ? 'ยกเลิก' : 'แก้ไข'}
            </button>
          </div>

          {editMode ? (
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อ-นามสกุล</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={displayName} onChange={e => setDisplayName(e.target.value)} required
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">แผนก</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={department} onChange={e => setDepartment(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ตำแหน่ง</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={position} onChange={e => setPosition(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none" />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 disabled:opacity-50 transition">
                <Save className="w-4 h-4" /> {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm"><User className="w-4 h-4 text-gray-400" /><span className="text-gray-500">ชื่อ:</span><span className="font-medium">{profile?.display_name || '-'}</span></div>
              <div className="flex items-center gap-3 text-sm"><Mail className="w-4 h-4 text-gray-400" /><span className="text-gray-500">อีเมล:</span><span className="font-medium">{profile?.email || '-'}</span></div>
              <div className="flex items-center gap-3 text-sm"><Shield className="w-4 h-4 text-gray-400" /><span className="text-gray-500">บทบาท:</span><span className="font-medium">{roleLabels[profile?.role] || profile?.role}</span></div>
              <div className="flex items-center gap-3 text-sm"><Briefcase className="w-4 h-4 text-gray-400" /><span className="text-gray-500">แผนก:</span><span className="font-medium">{profile?.department || '-'}</span></div>
              <div className="flex items-center gap-3 text-sm"><MapPin className="w-4 h-4 text-gray-400" /><span className="text-gray-500">ตำแหน่ง:</span><span className="font-medium">{profile?.position || '-'}</span></div>
              <div className="flex items-center gap-3 text-sm"><Calendar className="w-4 h-4 text-gray-400" /><span className="text-gray-500">สมัครเมื่อ:</span><span className="font-medium">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('th-TH') : '-'}</span></div>
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><KeyRound className="w-5 h-5 text-purple-600" />เปลี่ยนรหัสผ่าน</h2>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none" />
            </div>
            <button type="submit" className="w-full py-2.5 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition">
              เปลี่ยนรหัสผ่าน
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
