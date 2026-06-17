'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Building2, Mail, Lock, School, Globe, ArrowRight, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<'form' | 'success'>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [schoolSlug, setSchoolSlug] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoMode, setDemoMode] = useState(false)

  // Auto-generate slug from school name
  const handleSchoolNameChange = (val: string) => {
    setSchoolName(val)
    if (!schoolSlug || schoolSlug === slugify(schoolName)) {
      setSchoolSlug(slugify(val))
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password || !displayName || !schoolName) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      setLoading(false)
      return
    }

    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } }
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      // Demo mode: simulate success
      if (!authData.user) {
        setDemoMode(true)
        setStep('success')
        setLoading(false)
        return
      }

      const userId = authData.user.id

      // 2. Create profile
      await supabase.from('profiles').insert({
        id: userId,
        email,
        display_name: displayName,
        role: 'admin',
        approved: true,
      })

      // 3. Create organization
      const slug = schoolSlug || slugify(schoolName)
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: schoolName, slug, type: 'school' })
        .select('id')
        .single()

      if (orgError) {
        setError('ไม่สามารถสร้างโรงเรียนได้ — อาจมีชื่อซ้ำ: ' + orgError.message)
        setLoading(false)
        return
      }

      const orgId = orgData.id

      // 4. Add as owner
      await supabase.from('organization_members').insert({
        organization_id: orgId,
        profile_id: userId,
        role: 'owner',
      })

      // 5. Update profile with active org
      await supabase.from('profiles').update({ active_organization_id: orgId }).eq('id', userId)

      // 6. Seed default settings
      await supabase.from('system_settings').insert([
        { organization_id: orgId, setting_key: 'site_name', setting_value: 'ระบบควบคุมงบประมาณ' },
        { organization_id: orgId, setting_key: 'organization_name', setting_value: schoolName },
        { organization_id: orgId, setting_key: 'year_label_type', setting_value: 'fiscal_year' },
      ])

      // 7. Redirect to onboarding
      setStep('success')
    } catch (e: any) {
      setError('เกิดข้อผิดพลาด: ' + (e.message || 'ลองใหม่อีกครั้ง'))
    }
    setLoading(false)
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">สมัครสมาชิกสำเร็จ! 🎉</h1>
          <p className="text-gray-600 mb-2">
            โรงเรียน <span className="font-semibold text-purple-600">{schoolName}</span> ถูกสร้างเรียบร้อยแล้ว
          </p>
          {demoMode && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 mb-4">
              ⚠️ Demo Mode: ไม่ได้เชื่อมต่อ Supabase จริง — <Link href="/login" className="underline">เข้าสู่ระบบ</Link> เพื่อทดสอบ
            </p>
          )}
          <div className="space-y-3">
            <button onClick={() => router.push('/onboarding')}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2">
              ตั้งค่าโรงเรียน <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => router.push('/dashboard')}
              className="w-full py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition">
              ข้ามไปแดชบอร์ด
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-7 h-7 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">สมัครใช้งาน</h1>
          <p className="text-sm text-gray-500 mt-1">สร้างโรงเรียนของคุณและเริ่มควบคุมงบประมาณ</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* School info */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              <School className="w-3.5 h-3.5 inline mr-1" /> ชื่อโรงเรียน
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={e => handleSchoolNameChange(e.target.value)}
              placeholder="เช่น โรงเรียนซับใหญ่วิทยาคม"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              <Globe className="w-3.5 h-3.5 inline mr-1" /> ชื่อย่อ (URL)
            </label>
            <div className="flex items-center">
              <span className="text-sm text-gray-400 mr-1">budget-control.vercel.app/s/</span>
              <input
                type="text"
                value={schoolSlug}
                onChange={e => setSchoolSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="sapyai"
                required
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none transition font-mono"
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* User info */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              ชื่อ-นามสกุล
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="เช่น สมชาย ใจดี"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              <Mail className="w-3.5 h-3.5 inline mr-1" /> อีเมล
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@school.ac.th"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              <Lock className="w-3.5 h-3.5 inline mr-1" /> รหัสผ่าน
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              required
              minLength={6}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 transition shadow-sm shadow-purple-200 flex items-center justify-center gap-2"
          >
            {loading ? 'กำลังสมัคร...' : 'สร้างโรงเรียนและเริ่มใช้งาน'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          มีบัญชีอยู่แล้ว?{' '}
          <Link href="/login" className="text-purple-600 font-medium hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  )
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 50)
}
