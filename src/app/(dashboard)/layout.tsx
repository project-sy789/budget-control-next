'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  LayoutDashboard, FolderOpen, Calculator, BarChart3, ArrowLeftRight,
  Tags, Users, Settings, Calendar, UserCircle, LogOut, Menu, X, Building2,
  Moon, Sun, Clock, Search, ChevronDown, PlusCircle
} from 'lucide-react'
import CommandPalette from '@/components/CommandPalette'

const menuItems = [
  { href: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { href: '/projects', label: 'จัดการโครงการ', icon: FolderOpen },
  { href: '/budget-control', label: 'ควบคุมงบประมาณ', icon: Calculator },
  { href: '/budget-summary', label: 'สรุปงบประมาณ', icon: BarChart3 },
  { href: '/budget-transfer', label: 'โอนงบประมาณ', icon: ArrowLeftRight },
  { href: '/category-management', label: 'จัดการหมวดหมู่', icon: Tags },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [organization, setOrganization] = useState<any>(null)
  const [orgMenuOpen, setOrgMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const stored = localStorage.getItem('budget-control-dark-mode')
      if (stored !== null) return stored === 'true'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch { return false }
  })

  const [yearLabel, setYearLabel] = useState('ปีงบประมาณ')
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    // Dark mode — sync class + persist
    if (darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    try { localStorage.setItem('budget-control-dark-mode', String(darkMode)) } catch {}
  }, [darkMode])

  useEffect(() => {
    // Load real auth user + profile
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Demo mode — show placeholder
        setProfile({ display_name: 'Demo', role: 'ผู้เข้าชม' })
        setOrganization({ name: 'ระบบควบคุมงบประมาณ' })
        setIsDemo(true)
        return
      }

      setIsDemo(false)

      // Load profile from DB
      const { data: profileData } = await supabase.from('profiles')
        .select('*').eq('id', user.id).single()

      if (profileData) {
        setProfile(profileData)

        // Load organization info
        if (profileData.active_organization_id) {
          supabase.from('organizations').select('*')
            .eq('id', profileData.active_organization_id).single()
            .then(({ data }) => { if (data) setOrganization(data) })
        }
      }

      // Load year label from settings
      supabase.from('system_settings').select('*').eq('setting_key', 'year_label_type').then(({ data }) => {
        if (data?.[0]) {
          const m: Record<string, string> = { fiscal_year: 'ปีงบประมาณ', academic_year: 'ปีการศึกษา', budget_year: 'ปีบัญชี' }
          setYearLabel(m[data[0].setting_value] || 'ปีงบประมาณ')
        }
      })
    }
    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isAdmin = isDemo || profile?.role === 'admin'

  return (
    <div className="flex h-screen">
      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-purple-600 to-purple-800 text-white flex flex-col transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-purple-500/30 relative">
          {/* Organization switcher */}
          <button onClick={() => setOrgMenuOpen(!orgMenuOpen)}
            className="w-full text-left group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm truncate">
                  {organization?.name || 'ระบบควบคุมงบประมาณ'}
                </h2>
                <div className="flex items-center gap-1 text-xs text-purple-200">
                  <span className="truncate">{organization?.name || 'กำลังโหลด...'}</span>
                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                </div>
              </div>
            </div>
          </button>

          {/* Org dropdown */}
          {orgMenuOpen && (
            <div className="absolute top-full left-4 right-4 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-[60] text-gray-700"
              onClick={() => setOrgMenuOpen(false)}>
              <div className="px-3 py-2 text-xs text-gray-400 uppercase tracking-wider">โรงเรียนของคุณ</div>
              {organization && (
                <div className="px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full" />
                  {organization.name}
                </div>
              )}
              <hr className="my-1" />
              <Link href="/register" onClick={() => setOrgMenuOpen(false)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> สร้างโรงเรียนใหม่
              </Link>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {menuItems.map(item => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${active ? 'bg-white/20 font-medium' : 'hover:bg-white/10 text-purple-100'}`}>
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </li>
              )
            })}

            {isAdmin && (
              <>
                <li className="pt-3 pb-1"><div className="px-3 text-xs text-purple-300 uppercase">ผู้ดูแลระบบ</div></li>
                {[ 
                  { href: '/user-management', label: 'จัดการผู้ใช้', icon: Users },
                  { href: '/system-settings', label: 'การตั้งค่าระบบ', icon: Settings },
                  { href: '/fiscal-years', label: `จัดการ${yearLabel}`, icon: Calendar },
                  { href: '/activity-log', label: 'บันทึกกิจกรรม', icon: Clock },
                ].map(item => {
                  const Icon = item.icon
                  const active = pathname === item.href
                  return (
                    <li key={item.href}>
                      <Link href={item.href} onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${active ? 'bg-white/20 font-medium' : 'hover:bg-white/10 text-purple-100'}`}>
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </>
            )}
          </ul>
        </nav>

        <div className="p-3 border-t border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center text-xs font-bold">
              {profile?.display_name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.display_name || 'ผู้ใช้'}</p>
              <p className="text-xs text-purple-200 truncate">{profile?.role === 'admin' ? 'ผู้ดูแลระบบ' : profile?.role === 'manager' ? 'ผู้จัดการ' : 'ผู้ใช้'}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 hover:bg-white/10 rounded-lg transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0f0f1a]">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white dark:bg-[#1a1a2e] border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <button onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition">
              <Search className="w-3.5 h-3.5" /> ค้นหา
              <kbd className="text-[10px] bg-gray-200 dark:bg-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">Ctrl+K</kbd>
            </button>
            <button onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
              {darkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-gray-500" />}
            </button>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isDemo ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isDemo ? 'bg-amber-500' : 'bg-green-500'}`} />
              {isDemo ? 'Demo' : 'ออนไลน์'}
            </span>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
      <CommandPalette />
    </div>
  )
}
