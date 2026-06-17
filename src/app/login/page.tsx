'use client'

import { useState } from 'react'
import { login, signup } from '@/lib/auth/actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, User, Mail, Lock, Briefcase, MapPin } from 'lucide-react'

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await login(formData)
    if (result?.error) setError(result.error)
    setLoading(false)
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    const formData = new FormData(e.currentTarget)
    const result = await signup(formData)
    if (result?.error) setError(result.error)
    if (result?.success) setSuccess(result.success)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">ระบบควบคุมงบประมาณ</h1>
          <p className="text-gray-500 text-sm mt-1">โรงเรียนซับใหญ่วิทยาคม</p>
        </div>

        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button onClick={() => { setIsRegister(false); setError(''); setSuccess('') }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${!isRegister ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}>
            เข้าสู่ระบบ
          </button>
          <button onClick={() => { setIsRegister(true); setError(''); setSuccess('') }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${isRegister ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}>
            ลงทะเบียน
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 text-sm rounded-lg p-3 mb-4">{success}</div>}

        {!isRegister ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input name="email" type="email" required className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="admin@sapyai.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input name="password" type="password" required className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-medium text-sm hover:opacity-90 transition disabled:opacity-50">
              {loading ? 'กำลังโหลด...' : 'เข้าสู่ระบบ'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-4">
              ลืมรหัสผ่าน?{' '}
              <span className="text-purple-600 cursor-pointer hover:underline">
                ติดต่อผู้ดูแลระบบ
              </span>
            </p>
            <div className="text-center text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
              ต้องการสร้างโรงเรียนใหม่?{' '}
              <Link href="/register" className="text-purple-600 font-medium hover:underline">
                สมัครสมาชิก
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input name="display_name" required className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="สมชาย ใจดี" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input name="email" type="email" required className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="somchai@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input name="password" type="password" required className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="อย่างน้อย 6 ตัว" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">แผนก</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input name="department" className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="วิชาการ" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input name="position" className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="ครู" />
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-medium text-sm hover:opacity-90 transition disabled:opacity-50">
              {loading ? 'กำลังโหลด...' : 'ลงทะเบียน'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
