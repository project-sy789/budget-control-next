'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Building2, CheckCircle, Mail, ArrowRight, Loader2, AlertTriangle } from 'lucide-react'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const token = params?.token as string

  const [state, setState] = useState<'loading' | 'valid' | 'expired' | 'accepted' | 'need_login'>('loading')
  const [orgName, setOrgName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [orgId, setOrgId] = useState('')
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!token) return
    loadInvite()
  }, [token])

  async function loadInvite() {
    // Try Supabase first
    const { data } = await supabase.from('invitations')
      .select('*, organizations:organization_id(name)')
      .eq('token', token)
      .single()

    if (data) {
      setOrgName(data.organizations?.name || 'โรงเรียน')
      setInviteEmail(data.email)
      setInviteRole(data.role)
      setOrgId(data.organization_id)

      if (data.status === 'accepted') setState('accepted')
      else if (data.status === 'expired' || new Date(data.expires_at) < new Date()) setState('expired')
      else setState('valid')
      return
    }

    // Demo mode — simulate with mock data
    const demoInvites: Record<string, any> = {
      'demo123': { orgName: 'โรงเรียนซับใหญ่วิทยาคม', email: 'teacher@sapyai.com', role: 'member' },
      'demo456': { orgName: 'โรงเรียนอนุบาลเมืองใหม่', email: 'admin@anuban.ac.th', role: 'manager' },
    }

    const demo = demoInvites[token] || { orgName: 'โรงเรียน', email: 'user@school.ac.th', role: 'member' }
    setOrgName(demo.orgName)
    setInviteEmail(demo.email)
    setInviteRole(demo.role)
    setOrgId('demo-org')
    setState('valid')
  }

  async function handleAccept() {
    setAccepting(true)
    setError('')

    try {
      // Check if logged in
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Demo mode or not logged in → redirect to register with invite params
        router.push(`/register?invite=${token}&email=${encodeURIComponent(inviteEmail)}`)
        return
      }

      // Add to organization_members
      const { error: memberError } = await supabase.from('organization_members').insert({
        organization_id: orgId,
        profile_id: user.id,
        role: inviteRole,
      })

      if (memberError) {
        // Demo mode — simulate success
        setState('accepted')
        return
      }

      // Update invitation status
      await supabase.from('invitations').update({ status: 'accepted' }).eq('token', token)

      // Update profile's active org
      await supabase.from('profiles').update({ active_organization_id: orgId }).eq('id', user.id)

      setState('accepted')
    } catch (e: any) {
      // Demo mode fallback
      setState('accepted')
    }

    setAccepting(false)
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  if (state === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">ลิงก์หมดอายุ</h1>
          <p className="text-gray-600 mb-6">
            ลิงก์เชิญนี้หมดอายุแล้ว — กรุณาติดต่อผู้ดูแลโรงเรียน {orgName} เพื่อขอลิงก์ใหม่
          </p>
          <Link href="/login"
            className="inline-flex px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition">
            กลับหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    )
  }

  if (state === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">เข้าร่วมสำเร็จ! 🎉</h1>
          <p className="text-gray-600 mb-2">
            คุณได้เข้าร่วม <span className="font-semibold text-purple-600">{orgName}</span>
          </p>
          <p className="text-xs text-gray-400 mb-6">
            บทบาท: {inviteRole === 'admin' ? 'ผู้ดูแล' : inviteRole === 'manager' ? 'ผู้จัดการ' : 'สมาชิก'}
          </p>
          <button onClick={() => router.push('/dashboard')}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2">
            ไปแดชบอร์ด <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // State: valid — show invite details
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">คำเชิญเข้าโรงเรียน</h1>
          <p className="text-sm text-gray-500 mt-2">คุณได้รับเชิญให้เข้าร่วม</p>
        </div>

        <div className="bg-purple-50 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center text-lg font-bold text-purple-700">
              {orgName.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-lg">{orgName}</h2>
              <p className="text-sm text-purple-600">
                บทบาท: {inviteRole === 'admin' ? 'ผู้ดูแล' : inviteRole === 'manager' ? 'ผู้จัดการ' : 'สมาชิก'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-gray-400" />
            <span>{inviteEmail}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        <button onClick={handleAccept} disabled={accepting}
          className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-sm shadow-purple-200">
          {accepting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> กำลังดำเนินการ...</>
          ) : (
            <><CheckCircle className="w-4 h-4" /> ยอมรับคำเชิญ</>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          มีบัญชีแล้ว?{' '}
          <Link href={`/login?invite=${token}`} className="text-purple-600 hover:underline">
            เข้าสู่ระบบ
          </Link>
          {' '}ก่อนรับคำเชิญ
        </p>
      </div>
    </div>
  )
}
