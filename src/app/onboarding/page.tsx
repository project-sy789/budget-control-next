'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { School, Calendar, Tags, CheckCircle, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'

const YEAR_LABELS = [
  { value: 'fiscal_year', label: 'ปีงบประมาณ (ต.ค. - ก.ย.)', desc: 'เริ่ม 1 ตุลาคม — เหมาะกับโรงเรียนรัฐบาล' },
  { value: 'academic_year', label: 'ปีการศึกษา (พ.ค. - เม.ย.)', desc: 'เริ่ม 1 พฤษภาคม — ตามปีการศึกษาปกติ' },
  { value: 'budget_year', label: 'ปีบัญชี (ม.ค. - ธ.ค.)', desc: 'เริ่ม 1 มกราคม — ตามปีปฏิทิน' },
]

const DEFAULT_CATEGORIES = [
  { key: 'ACTIVITY_FUNDS', name: 'เงินกิจกรรมพัฒนาผู้เรียน', desc: 'กิจกรรมนักเรียน' },
  { key: 'SUPPLIES_FUNDS', name: 'เงินค่าอุปกรณ์การเรียน', desc: 'อุปกรณ์การเรียนการสอน' },
  { key: 'INCOME', name: 'เงินรายได้สถานศึกษา', desc: 'รายได้สถานศึกษา' },
  { key: 'LUNCH', name: 'เงินอาหารกลางวัน', desc: 'อาหารกลางวัน' },
  { key: 'SUBSIDY', name: 'เงินอุดหนุนรายหัว', desc: 'เงินอุดหนุน' },
  { key: 'DONATION', name: 'เงินบริจาค', desc: 'เงินบริจาค' },
]

const DEFAULT_WORK_GROUPS = [
  { name: 'วิชาการ', color: 'bg-blue-100 text-blue-700' },
  { name: 'งบประมาณ', color: 'bg-purple-100 text-purple-700' },
  { name: 'บุคคล', color: 'bg-orange-100 text-orange-700' },
  { name: 'ทั่วไป', color: 'bg-emerald-100 text-emerald-700' },
  { name: 'อื่นๆ', color: 'bg-gray-100 text-gray-600' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Step 1: School info
  const [schoolName, setSchoolName] = useState('โรงเรียนของเรา')
  const [schoolType, setSchoolType] = useState('school')

  // Step 2: Fiscal year
  const [yearLabel, setYearLabel] = useState('fiscal_year')
  const [fyStart, setFyStart] = useState('2025-10-01')
  const [fyEnd, setFyEnd] = useState('2026-09-30')
  const [fyName, setFyName] = useState('2569')

  // Step 3: Seed data
  const [seedCategories, setSeedCategories] = useState(true)
  const [seedWorkGroups, setSeedWorkGroups] = useState(true)

  async function handleFinish() {
    setLoading(true)
    setMessage('')

    try {
      // Get current org
      const { data: profile } = await supabase.from('profiles')
        .select('active_organization_id')
        .single()
      
      const orgId = profile?.active_organization_id
      if (!orgId) {
        // Demo mode
        setMessage('✅ ตั้งค่าเสร็จสมบูรณ์ (Demo Mode)')
        setLoading(false)
        setTimeout(() => router.push('/dashboard'), 1500)
        return
      }

      // Update org settings
      await supabase.from('system_settings').upsert([
        { organization_id: orgId, setting_key: 'organization_name', setting_value: schoolName },
        { organization_id: orgId, setting_key: 'year_label_type', setting_value: yearLabel },
      ], { onConflict: 'organization_id,setting_key' })

      // Create fiscal year
      await supabase.from('fiscal_years').insert({
        organization_id: orgId,
        name: fyName,
        start_date: fyStart,
        end_date: fyEnd,
        is_active: true,
      })

      // Seed categories
      if (seedCategories) {
        const cats = DEFAULT_CATEGORIES.map(c => ({
          organization_id: orgId,
          category_key: c.key,
          category_name: c.name,
          description: c.desc,
        }))
        await supabase.from('category_types').insert(cats)
      }

      // Seed work groups
      if (seedWorkGroups) {
        const wgs = DEFAULT_WORK_GROUPS.map((wg, i) => ({
          organization_id: orgId,
          name: wg.name,
          color: wg.color,
          sort_order: i + 1,
        }))
        await supabase.from('work_groups').insert(wgs)
      }

      setMessage('✅ ตั้งค่าเสร็จสมบูรณ์!')
    } catch (e: any) {
      setMessage('⚠️ Demo Mode — ข้ามการตั้งค่า (ไม่เชื่อมต่อ Supabase)')
    }
    
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  function renderStep1() {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <School className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">ข้อมูลโรงเรียน</h2>
          <p className="text-sm text-gray-500 mt-1">ข้อมูลพื้นฐานของโรงเรียนคุณ</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">ชื่อโรงเรียน</label>
          <input type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none transition" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">ประเภทสถานศึกษา</label>
          <select value={schoolType} onChange={e => setSchoolType(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none transition bg-white">
            <option value="school">โรงเรียน</option>
            <option value="university">มหาวิทยาลัย</option>
            <option value="office">สำนักงานเขตพื้นที่</option>
            <option value="other">อื่นๆ</option>
          </select>
        </div>
      </div>
    )
  }

  function renderStep2() {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">ตั้งค่าปีงบประมาณ</h2>
          <p className="text-sm text-gray-500 mt-1">เลือกรูปแบบปีที่โรงเรียนของคุณใช้</p>
        </div>

        <div className="space-y-2">
          {YEAR_LABELS.map(yl => (
            <button key={yl.value} onClick={() => setYearLabel(yl.value)}
              className={`w-full text-left p-4 rounded-xl border-2 transition ${yearLabel === yl.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <p className="font-medium text-gray-800 text-sm">{yl.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{yl.desc}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">ชื่อปี</label>
            <input type="text" value={fyName} onChange={e => setFyName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">วันที่เริ่ม</label>
            <input type="date" value={fyStart} onChange={e => setFyStart(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">วันที่สิ้นสุด</label>
            <input type="date" value={fyEnd} onChange={e => setFyEnd(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" />
          </div>
        </div>
      </div>
    )
  }

  function renderStep3() {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">ตั้งค่าข้อมูลเริ่มต้น</h2>
          <p className="text-sm text-gray-500 mt-1">สร้างหมวดหมู่และกลุ่มงานให้พร้อมใช้งาน</p>
        </div>

        {/* Seed Categories */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={seedCategories} onChange={e => setSeedCategories(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-5 h-5" />
            <div>
              <p className="font-medium text-gray-800 text-sm">
                <Tags className="w-4 h-4 inline mr-1 text-purple-600" />
                สร้างหมวดหมู่เริ่มต้น 6 รายการ
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {DEFAULT_CATEGORIES.map(c => c.name).join(', ')}
              </p>
            </div>
          </label>
        </div>

        {/* Seed Work Groups */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={seedWorkGroups} onChange={e => setSeedWorkGroups(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-5 h-5" />
            <div>
              <p className="font-medium text-gray-800 text-sm">
                <Tags className="w-4 h-4 inline mr-1 text-blue-600" />
                สร้างกลุ่มงานเริ่มต้น 5 กลุ่ม
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {DEFAULT_WORK_GROUPS.map(wg => wg.name).join(', ')}
              </p>
            </div>
          </label>
        </div>

        {message && (
          <div className={`rounded-xl p-3 text-sm text-center ${message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
            {message}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                s < step ? 'bg-green-500 text-white' :
                s === step ? 'bg-purple-600 text-white' :
                'bg-gray-200 text-gray-400'
              }`}>
                {s < step ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        {/* Navigation */}
        <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition flex items-center justify-center gap-1">
              <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
            </button>
          ) : (
            <button onClick={() => router.push('/dashboard')}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-50 transition">
              ข้ามไปก่อน
            </button>
          )}
          
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition flex items-center justify-center gap-1">
              ถัดไป <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleFinish} disabled={loading}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition flex items-center justify-center gap-1">
              {loading ? 'กำลังตั้งค่า...' : 'เริ่มใช้งาน'} <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
