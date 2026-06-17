'use client'

import { useState } from 'react'
import { login } from '@/lib/auth/actions'
import Link from 'next/link'
import { Building2, Mail, Lock, ArrowLeft, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await login(formData)
    if (result?.error) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 p-4 relative">
      {/* Back button */}
      <Link href="/" className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition backdrop-blur-sm">
        <ArrowLeft className="w-4 h-4" />
        กลับหน้าหลัก
      </Link>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">ระบบควบคุมงบประมาณ</h1>
          <p className="text-gray-500 text-sm mt-1">ระบบบริหารงบประมาณสำหรับโรงเรียน</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input name="email" type="email" required className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="admin@demo.school" />
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
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 mb-3">ยังไม่มีบัญชี?</p>
          <Link href="/register"
            className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-purple-200 text-purple-600 rounded-lg font-medium text-sm hover:bg-purple-50 hover:border-purple-300 transition">
            สร้างโรงเรียนใหม่
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
