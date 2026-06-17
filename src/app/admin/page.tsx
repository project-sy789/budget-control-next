'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAllOrganizations, getOrganizationMemberCounts, updateOrganizationStatus } from '@/lib/auth/admin-actions'
import { Building2, Users, FolderOpen, Calculator, Search, Shield, Ban, CheckCircle, XCircle, ChevronRight, Eye, RefreshCw, PlusCircle } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({})
  const [stats, setStats] = useState({ totalOrgs: 0, totalUsers: 0, totalProjects: 0, totalTransactions: 0 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    let loadedOrgs: any[] = []
    
    try {
      loadedOrgs = await getAllOrganizations()
      if (loadedOrgs?.length > 0) {
        setOrgs(loadedOrgs)
      } else {
        const { data: orgData } = await supabase.from('organizations').select('*').order('created_at', { ascending: false })
        loadedOrgs = orgData || []
        setOrgs(loadedOrgs)
      }
    } catch {
      const { data: orgData } = await supabase.from('organizations').select('*').order('created_at', { ascending: false })
      loadedOrgs = orgData || []
      setOrgs(loadedOrgs)
    }

    // Get real member counts per org
    try {
      const counts = await getOrganizationMemberCounts()
      if (counts) setMemberCounts(counts)
    } catch {}

    // Get stats
    try {
      const res = await fetch('/api/admin-stats')
      if (res.ok) {
        const data = await res.json()
        setStats({ totalOrgs: loadedOrgs.length, totalUsers: data.totalUsers || 0, totalProjects: data.totalProjects || 0, totalTransactions: data.totalTransactions || 0 })
        setLoading(false)
        return
      }
    } catch {}
    setStats({ totalOrgs: loadedOrgs.length, totalUsers: 0, totalProjects: 0, totalTransactions: 0 })
    setLoading(false)
  }

  async function handleStatusToggle(orgId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'cancelled' : 'active'
    setActionMsg('')
    try {
      const res = await updateOrganizationStatus(orgId, newStatus)
      if (res?.error) { setActionMsg('❌ ' + res.error); return }
      setActionMsg(`✅ ${newStatus === 'active' ? 'เปิดใช้งาน' : 'ระงับ'}โรงเรียนแล้ว`)
      loadData()
    } catch (e: any) {
      setActionMsg('❌ ' + (e.message || 'เกิดข้อผิดพลาด'))
    }
  }

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.slug.toLowerCase().includes(search.toLowerCase())
  )

  const activeCount = orgs.filter(o => o.subscription_status === 'active').length
  const pendingCount = orgs.filter(o => o.subscription_status === 'trial').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-purple-600" />
          <div>
            <h1 className="font-bold text-gray-800">Super Admin — จัดการโรงเรียน</h1>
            <p className="text-xs text-gray-500">ฟรี 100% ตลอดชีพ — จัดการทุกโรงเรียนบนแพลตฟอร์ม</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm flex items-center gap-1.5 transition">
            <RefreshCw className="w-3.5 h-3.5" /> รีเฟรช
          </button>
          <Link href="/dashboard"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition">
            กลับแดชบอร์ด
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'โรงเรียนทั้งหมด', value: stats.totalOrgs, icon: Building2, color: 'bg-purple-500' },
            { label: 'เปิดใช้งาน', value: activeCount, icon: CheckCircle, color: 'bg-green-500' },
            { label: 'ผู้ใช้ทั้งหมด', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
            { label: 'โครงการทั้งหมด', value: stats.totalProjects, icon: FolderOpen, color: 'bg-indigo-500' },
            { label: 'รายการทั้งหมด', value: stats.totalTransactions, icon: Calculator, color: 'bg-orange-500' },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{card.value.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {actionMsg && (
          <div className="mb-4 px-4 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
            {actionMsg}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link href="/register"
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-purple-300 hover:shadow-md transition group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                <PlusCircle className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800">เพิ่มโรงเรียนเอง</h3>
            </div>
            <p className="text-sm text-gray-500">สร้างโรงเรียนใหม่ด้วยตนเอง — ข้ามขั้นตอนสมัคร</p>
          </Link>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-800">โรงเรียนใหม่รออนุมัติ</h3>
            </div>
            <p className="text-3xl font-bold text-amber-600 mb-1">{pendingCount}</p>
            <p className="text-sm text-gray-500">โรงเรียนที่สมัครใหม่และรอตรวจสอบ</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-semibold text-gray-800">ระงับ/เปิดใช้งาน</h3>
            </div>
            <p className="text-sm text-gray-500">คลิกปุ่มสถานะในตารางเพื่อสลับเปิด-ปิดโรงเรียน — โรงเรียนที่ถูกระงับจะเข้าใช้งานไม่ได้</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="ค้นหาโรงเรียน..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none" />
        </div>

        {/* Organizations table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-gray-400">กำลังโหลด...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">โรงเรียน</th>
                    <th className="text-left px-3 py-3 font-medium text-gray-500 text-xs uppercase">ประเภท</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs uppercase">สมาชิก</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs uppercase">สถานะ</th>
                    <th className="text-right px-3 py-3 font-medium text-gray-500 text-xs uppercase">สมัครเมื่อ</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs uppercase">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(org => {
                    const memberCount = memberCounts[org.id] || 0
                    const isActive = org.subscription_status === 'active'
                    const isPending = org.subscription_status === 'trial'
                    return (
                      <tr key={org.id} className="hover:bg-purple-50/30 transition">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isActive ? 'bg-purple-100 text-purple-600' : isPending ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                              {org.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{org.name}</p>
                              <p className="text-xs text-gray-400">{org.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="text-xs text-gray-500">{org.type === 'office' ? 'เขตพื้นที่' : 'โรงเรียน'}</span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700">
                            <Users className="w-3 h-3 text-gray-400" />
                            {memberCount}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <button
                            onClick={() => handleStatusToggle(org.id, org.subscription_status)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition hover:opacity-80 ${
                              isActive ? 'bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600' :
                              isPending ? 'bg-amber-100 text-amber-700 hover:bg-green-50 hover:text-green-600' :
                              'bg-red-100 text-red-700 hover:bg-green-50 hover:text-green-600'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : isPending ? 'bg-amber-500' : 'bg-red-500'}`} />
                            {isActive ? 'ใช้งาน' : isPending ? 'รออนุมัติ' : 'ระงับ'}
                          </button>
                        </td>
                        <td className="px-3 py-3.5 text-right text-xs text-gray-400">
                          {new Date(org.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button title="ดูรายละเอียด"
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-purple-600">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">ไม่พบโรงเรียน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
