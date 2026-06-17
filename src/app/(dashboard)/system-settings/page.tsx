'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Plus, Edit, Trash2, Palette, Upload, Phone, MapPin } from 'lucide-react'
import { DEMO_SETTINGS, DEMO_WORK_GROUPS } from '@/lib/mock-data'

const COLOR_OPTIONS = [
  { label: 'ม่วง', value: 'bg-purple-100 text-purple-700', hex: '#7c3aed' },
  { label: 'น้ำเงิน', value: 'bg-blue-100 text-blue-700', hex: '#2563eb' },
  { label: 'เขียว', value: 'bg-emerald-100 text-emerald-700', hex: '#059669' },
  { label: 'ส้ม', value: 'bg-orange-100 text-orange-700', hex: '#ea580c' },
  { label: 'แดง', value: 'bg-red-100 text-red-700', hex: '#dc2626' },
  { label: 'ชมพู', value: 'bg-pink-100 text-pink-700', hex: '#db2777' },
  { label: 'ฟ้า', value: 'bg-cyan-100 text-cyan-700', hex: '#0891b2' },
  { label: 'เทา', value: 'bg-gray-100 text-gray-600', hex: '#4b5563' },
]

const THEME_COLORS = [
  { label: 'ม่วง (ค่าเริ่มต้น)', value: 'purple', gradient: 'from-purple-600 to-purple-800', accent: 'purple' },
  { label: 'น้ำเงิน', value: 'blue', gradient: 'from-blue-600 to-blue-800', accent: 'blue' },
  { label: 'เขียว', value: 'green', gradient: 'from-emerald-600 to-emerald-800', accent: 'emerald' },
  { label: 'แดง', value: 'red', gradient: 'from-red-600 to-red-800', accent: 'red' },
  { label: 'ส้ม', value: 'orange', gradient: 'from-orange-500 to-orange-700', accent: 'orange' },
  { label: 'ฟ้า', value: 'cyan', gradient: 'from-cyan-600 to-cyan-800', accent: 'cyan' },
]

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<any>({})
  const [workGroups, setWorkGroups] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showWgModal, setShowWgModal] = useState(false)
  const [editingWg, setEditingWg] = useState<any>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const supabase = createClient()

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [{ data: sData }, { data: wgData }] = await Promise.all([
      supabase.from('system_settings').select('*'),
      supabase.from('work_groups').select('*').eq('is_active', true).order('sort_order')
    ])

    if (sData?.length) {
      const map: any = {}
      sData.forEach(s => { map[s.setting_key] = s.setting_value })
      setSettings(map)
    } else {
      // Demo mode
      const map: any = {}
      DEMO_SETTINGS.forEach(s => { map[s.setting_key] = s.setting_value })
      setSettings(map)
    }
    if (wgData?.length) setWorkGroups(wgData)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from('system_settings').upsert(
        { setting_key: key, setting_value: String(value || '') },
        { onConflict: 'organization_id,setting_key' }
      )
    }
    setSaving(false)
    setMessage('บันทึกการตั้งค่าสำเร็จ!')
    setTimeout(() => setMessage(''), 3000)
  }

  const themeColor = settings.theme_color || 'purple'

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">การตั้งค่าระบบ</h1>

      {message && <div className="bg-green-50 text-green-600 text-sm rounded-xl p-3 flex items-center gap-2">
        <span className="text-base">✅</span> {message}
      </div>}

      {/* ── Organization Profile ── */}
      <form onSubmit={handleSave} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Upload className="w-4 h-4 text-purple-600" /> โปรไฟล์โรงเรียน
        </h2>

        {/* Logo */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">โลโก้โรงเรียน</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200 text-3xl font-bold text-purple-400">
              {logoPreview ? (
                <img src={logoPreview} className="w-full h-full object-cover rounded-xl" />
              ) : (
                (settings.organization_name || 'ร')?.charAt(0)
              )}
            </div>
            <div>
              <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm cursor-pointer hover:bg-gray-50 transition">
                <Upload className="w-4 h-4" /> อัพโหลดโลโก้
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
                      reader.readAsDataURL(file)
                    }
                  }} />
              </label>
              <p className="text-xs text-gray-400 mt-1">PNG หรือ JPG — แนะนำ 200×200 px</p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อโรงเรียน</label>
            <input value={settings.organization_name || ''} onChange={e => setSettings({ ...settings, organization_name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อย่อ (Slug)</label>
            <input value={settings.org_slug || ''} onChange={e => setSettings({ ...settings, org_slug: e.target.value })}
              placeholder="sapyai"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 font-mono outline-none" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              <Phone className="w-3 h-3 inline mr-1" /> เบอร์โทรศัพท์
            </label>
            <input value={settings.contact_phone || ''} onChange={e => setSettings({ ...settings, contact_phone: e.target.value })}
              placeholder="02-123-4567"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              <MapPin className="w-3 h-3 inline mr-1" /> ที่อยู่
            </label>
            <input value={settings.contact_address || ''} onChange={e => setSettings({ ...settings, contact_address: e.target.value })}
              placeholder="123 หมู่ 4 ต.ซับใหญ่ อ.ซับใหญ่"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" />
          </div>
        </div>
      </form>

      {/* ── Appearance ── */}
      <form onSubmit={handleSave} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Palette className="w-4 h-4 text-purple-600" /> การแสดงผล
        </h2>

        {/* Theme color */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">สีธีม</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {THEME_COLORS.map(tc => (
              <button key={tc.value} type="button" onClick={() => setSettings({ ...settings, theme_color: tc.value })}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition ${themeColor === tc.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tc.gradient}`} />
                <span className="text-xs text-gray-600">{tc.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อเว็บไซต์</label>
          <input value={settings.site_name || ''} onChange={e => setSettings({ ...settings, site_name: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">รูปแบบชื่อปี</label>
          <select value={settings.year_label_type || 'fiscal_year'} onChange={e => setSettings({ ...settings, year_label_type: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
            <option value="fiscal_year">ปีงบประมาณ</option>
            <option value="academic_year">ปีการศึกษา</option>
            <option value="budget_year">ปีบัญชี</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" checked={settings.enable_pwa === 'true'} onChange={e => setSettings({ ...settings, enable_pwa: e.target.checked ? 'true' : 'false' })} id="pwa" />
          <label htmlFor="pwa" className="text-sm text-gray-700">เปิดใช้งาน PWA</label>
        </div>
      </form>

      {/* ── Save Button ── */}
      <button onClick={handleSave} disabled={saving}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 shadow-sm shadow-purple-200 transition">
        <Save className="w-4 h-4" /> {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}
      </button>

      {/* ── Work Groups ── */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-600" /> จัดการกลุ่มงาน
          </h2>
          <button onClick={() => { setEditingWg(null); setShowWgModal(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs hover:bg-purple-700">
            <Plus className="w-3.5 h-3.5" /> เพิ่มกลุ่มงาน
          </button>
        </div>

        {workGroups.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีกลุ่มงาน</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {workGroups.map(wg => (
              <div key={wg.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 transition">
                <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${wg.color}`}>{wg.name}</span>
                <div className="flex gap-0.5">
                  <button onClick={() => { setEditingWg(wg); setShowWgModal(true) }}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400">
                    <Edit className="w-3 h-3" />
                  </button>
                  <button onClick={async () => {
                    if (confirm(`ลบ "${wg.name}"?`)) {
                      await supabase.from('work_groups').delete().eq('id', wg.id)
                      loadAll()
                    }
                  }} className="p-1 hover:bg-red-50 rounded text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Work Group Modal */}
      {showWgModal && (
        <WorkGroupModal
          wg={editingWg}
          colors={COLOR_OPTIONS}
          onClose={() => setShowWgModal(false)}
          onSaved={() => { setShowWgModal(false); loadAll() }}
        />
      )}
    </div>
  )
}

function WorkGroupModal({ wg, colors, onClose, onSaved }: any) {
  const [name, setName] = useState(wg?.name || '')
  const [color, setColor] = useState(wg?.color || colors[0].value)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    
    // Get org_id from profile
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles')
      .select('active_organization_id').eq('id', user.id).single()
    const orgId = profile?.active_organization_id
    if (!orgId) return

    const data = { name: name.trim(), color, organization_id: orgId }
    if (wg) {
      await supabase.from('work_groups').update(data).eq('id', wg.id)
    } else {
      await supabase.from('work_groups').insert({ ...data, is_active: true })
    }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h2 className="font-semibold text-gray-800 mb-4">{wg ? 'แก้ไขกลุ่มงาน' : 'เพิ่มกลุ่มงาน'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อกลุ่มงาน</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none"
              placeholder="เช่น เทคโนโลยี, กิจการนักเรียน" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">สี</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c: any) => (
                <button key={c.value} type="button" onClick={() => setColor(c.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${c.value} ${color === c.value ? 'ring-2 ring-offset-1 ring-purple-400' : 'opacity-60 hover:opacity-100'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm">ยกเลิก</button>
            <button type="submit" className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">บันทึก</button>
          </div>
        </form>
      </div>
    </div>
  )
}
