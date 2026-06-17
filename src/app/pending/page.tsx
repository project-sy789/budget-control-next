'use client'

import Link from 'next/link'
import { Clock, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PendingPage() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">รอการอนุมัติ ⏳</h1>
        <p className="text-gray-600 mb-4 leading-relaxed">
          บัญชีของคุณกำลังอยู่ในระหว่างการตรวจสอบโดยผู้ดูแลระบบ
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-medium text-amber-800 mb-2">📋 ข้อมูลสำหรับคุณ:</p>
          <ul className="text-xs text-amber-700 space-y-1.5">
            <li>• ผู้ดูแลระบบจะตรวจสอบข้อมูลโรงเรียนของท่าน</li>
            <li>• การอนุมัติมักใช้เวลาไม่เกิน 24 ชั่วโมง</li>
            <li>• เมื่อได้รับการอนุมัติ จะมีอีเมลแจ้งเตือน</li>
            <li>• หากมีข้อสงสัย — ติดต่อผู้ดูแลระบบ</li>
          </ul>
        </div>
        <div className="space-y-3">
          <button onClick={handleLogout}
            className="w-full py-3 border-2 border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" /> ออกจากระบบ
          </button>
          <Link href="/"
            className="block w-full py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  )
}
