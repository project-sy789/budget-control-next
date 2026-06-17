'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Tags } from 'lucide-react'
import { DEMO_CATEGORIES } from '@/lib/mock-data'

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [isDemo, setIsDemo] = useState(false)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setIsDemo(true)
      setCategories(DEMO_CATEGORIES)
      return
    }
    const { data } = await supabase.from('category_types').select('*').order('category_name')
    setCategories(data?.length ? data : DEMO_CATEGORIES)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">จัดการหมวดหมู่งบประมาณ</h1>
        <button onClick={() => { setEditing(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition">
          <Plus className="w-4 h-4" /> เพิ่มหมวดหมู่
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Tags className="w-8 h-8 text-purple-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">ยังไม่มีหมวดหมู่</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            หมวดหมู่ใช้สำหรับแบ่งประเภทงบประมาณ เช่น เงินกิจกรรม, เงินอุปกรณ์, เงินอาหารกลางวัน
            <br />เชื่อมต่อ Supabase แล้วรัน schema.sql เพื่อสร้างหมวดหมู่เริ่มต้น 6 รายการโดยอัตโนมัติ
          </p>
          <button onClick={() => { setEditing(null); setShowModal(true) }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition">
            <Plus className="w-4 h-4" /> เพิ่มหมวดหมู่แรก
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">คีย์</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อหมวดหมู่</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">คำอธิบาย</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{cat.category_key}</code></td>
                    <td className="px-4 py-3 font-medium text-gray-800">{cat.category_name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{cat.description || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {cat.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { if (isDemo) return; setEditing(cat); setShowModal(true) }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-purple-600">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={async () => { if (isDemo) return; if (confirm('ปิดการใช้งานหมวดหมู่นี้?')) { await supabase.from('category_types').update({ is_active: false }).eq('id', cat.id); load() } }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && <CategoryModal category={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load() }} isDemo={isDemo} />}
    </div>
  )
}

function CategoryModal({ category, onClose, onSaved, isDemo }: any) {
  const [key, setKey] = useState(category?.category_key || '')
  const [name, setName] = useState(category?.category_name || '')
  const [desc, setDesc] = useState(category?.description || '')
  const [active, setActive] = useState(category?.is_active ?? true)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isDemo) { onSaved(); return }
    const data = { category_key: key.toUpperCase().replace(/[^A-Z0-9]/g, '_'), category_name: name, description: desc, is_active: active }
    if (category) {
      await supabase.from('category_types').update(data).eq('id', category.id)
    } else {
      await supabase.from('category_types').insert(data)
    }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">{category ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">คีย์ (ภาษาอังกฤษ)</label>
            <input value={key} onChange={e => setKey(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" placeholder="MY_CATEGORY" />
            <p className="text-xs text-gray-400 mt-1">ใช้ตัวอักษรภาษาอังกฤษและ _ เท่านั้น</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหมวดหมู่</label>
            <input value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="ชื่อภาษาไทย" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="รายละเอียดเพิ่มเติม" />
          </div>
          {category && (
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} id="active" />
              <label htmlFor="active" className="text-sm text-gray-700">เปิดใช้งาน</label>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">ยกเลิก</button>
            <button type="submit" className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">บันทึก</button>
          </div>
        </form>
      </div>
    </div>
  )
}
