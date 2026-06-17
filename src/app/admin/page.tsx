'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAllOrganizations } from '@/lib/auth/admin-actions'
import { Building2, Users, FolderOpen, Calculator, Search, TrendingUp, Shield, Ban, Crown, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [stats, setStats] = useState({ totalOrgs: 0, totalUsers: 0, totalProjects: 0, totalTransactions: 0 })
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    let loadedOrgs: any[] = []
    
    try {
      // Use server action (service_role) to get ALL organizations
      loadedOrgs = await getAllOrganizations()
      
      if (loadedOrgs && loadedOrgs.length > 0) {
        setOrgs(loadedOrgs)
      } else {
        // Fallback: try client-side (RLS-limited)
        const { data: orgData } = await supabase.from('organizations').select('*').order('created_at', { ascending: false })
        loadedOrgs = orgData || []
        setOrgs(loadedOrgs)
      }
    } catch {
      // Fallback
      const { data: orgData } = await supabase.from('organizations').select('*').order('created_at', { ascending: false })
      loadedOrgs = orgData || []
      setOrgs(loadedOrgs)
    }

    // Fetch user/project/transaction counts via service_role
    try {
      const res = await fetch('/api/admin-stats')
      if (res.ok) {
        const data = await res.json()
        setStats({
          totalOrgs: loadedOrgs.length,
          totalUsers: data.totalUsers || 0,
          totalProjects: data.totalProjects || 0,
          totalTransactions: data.totalTransactions || 0,
        })
        return
      }
    } catch {}

    setStats({
      totalOrgs: loadedOrgs.length,
      totalUsers: 0,
      totalProjects: 0,
      totalTransactions: 0,
    })
  }

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.slug.toLowerCase().includes(search.toLowerCase())
  )

  const tierLabel: Record<string, string> = { free: 'ฟรี', pro: 'Pro', enterprise: 'Enterprise' }
  const tierColor: Record<string, string> = { free: 'bg-gray-100 text-gray-700', pro: 'bg-blue-100 text-blue-700', enterprise: 'bg-purple-100 text-purple-700' }
  const statusLabel: Record<string, string> = { active: 'ใช้งาน', trial: 'ทดลองใช้', expired: 'หมดอายุ', cancelled: 'ยกเลิก' }
  const statusColor: Record<string, string> = { active: 'bg-green-100 text-green-700', trial: 'bg-amber-100 text-amber-700', expired: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-500' }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-purple-600" />
          <div>
            <h1 className="font-bold text-gray-800">Super Admin Cockpit</h1>
            <p className="text-xs text-gray-500">จัดการทุกโรงเรียนบนแพลตฟอร์ม</p>
          </div>
        </div>
        <Link href="/dashboard"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition">
          กลับแดชบอร์ด
        </Link>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'โรงเรียนทั้งหมด', value: stats.totalOrgs, icon: Building2, color: 'bg-purple-500' },
            { label: 'ผู้ใช้ทั้งหมด', value: stats.totalUsers, icon: Users, color: 'bg-blue-500' },
            { label: 'โครงการทั้งหมด', value: stats.totalProjects, icon: FolderOpen, color: 'bg-green-500' },
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

        {/* Subscription overview */}
        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          {['free', 'pro', 'enterprise'].map(tier => {
            const count = orgs.filter(o => o.subscription_tier === tier).length
            return (
              <div key={tier} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tier === 'enterprise' ? 'bg-purple-100' : tier === 'pro' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    {tier === 'enterprise' ? <Crown className="w-5 h-5 text-purple-600" /> :
                     tier === 'pro' ? <TrendingUp className="w-5 h-5 text-blue-600" /> :
                     <Building2 className="w-5 h-5 text-gray-600" />}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{tierLabel[tier]}</p>
                    <p className="text-xl font-bold text-gray-800">{count}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{((count / orgs.length) * 100).toFixed(0)}%</span>
              </div>
            )
          })}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">โรงเรียน</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-500 text-xs uppercase">ประเภท</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs uppercase">แพ็กเกจ</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs uppercase">สถานะ</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs uppercase">ผู้ใช้</th>
                  <th className="text-right px-3 py-3 font-medium text-gray-500 text-xs uppercase">สมัครเมื่อ</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500 text-xs uppercase w-[80px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(org => (
                  <tr key={org.id} className="hover:bg-purple-50/30 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-xs font-bold text-purple-600">
                          {org.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{org.name}</p>
                          <p className="text-xs text-gray-400">{org.slug}.budget-control.app</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="text-xs text-gray-500 capitalize">{org.type === 'office' ? 'เขตพื้นที่' : 'โรงเรียน'}</span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${tierColor[org.subscription_tier]}`}>
                        {org.subscription_tier === 'enterprise' && <Crown className="w-3 h-3" />}
                        {tierLabel[org.subscription_tier]}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${statusColor[org.subscription_status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${org.subscription_status === 'active' ? 'bg-green-500' : org.subscription_status === 'trial' ? 'bg-amber-500' : 'bg-red-500'}`} />
                        {statusLabel[org.subscription_status]}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center text-xs text-gray-500">
                      {org.max_users}
                    </td>
                    <td className="px-3 py-3.5 text-right text-xs text-gray-400">
                      {new Date(org.created_at).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">ไม่พบโรงเรียน</p>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4 text-purple-600" /> จัดการแพ็กเกจ
            </h3>
            <p className="text-sm text-gray-500 mb-4">เปลี่ยนแพ็กเกจโรงเรียน ขยายวันทดลองใช้</p>
            <div className="flex gap-2">
              <select className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                <option>เลือกโรงเรียน...</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">อัปเดต</button>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Ban className="w-4 h-4 text-red-500" /> ระงับโรงเรียน
            </h3>
            <p className="text-sm text-gray-500 mb-4">ระงับการเข้าใช้งานชั่วคราว</p>
            <div className="flex gap-2">
              <select className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                <option>เลือกโรงเรียน...</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <button className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">ระงับ</button>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-green-600" /> เพิ่มโรงเรียน
            </h3>
            <p className="text-sm text-gray-500 mb-4">สร้างโรงเรียนใหม่ด้วยตนเอง (Manual)</p>
            <Link href="/register"
              className="inline-flex px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
              สร้างโรงเรียน
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
