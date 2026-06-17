'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Building2, BarChart3, Calculator, Users, Shield, Zap,
  CheckCircle, ArrowRight, Menu, X, Globe, Smartphone,
  Download, Bell, Lock, Sparkles
} from 'lucide-react'

const FEATURES = [
  { icon: BarChart3, title: 'แดชบอร์ดอัจฉริยะ', desc: 'กราฟและสถิติแบบ real-time ดูภาพรวมงบประมาณทั้งโรงเรียนในหน้าเดียว', color: 'bg-purple-100 text-purple-600' },
  { icon: Calculator, title: 'ควบคุมงบประมาณ', desc: 'บันทึกรายรับ-รายจ่าย โอนระหว่างโครงการ ติดตามการใช้จ่ายเทียบกับแผน', color: 'bg-blue-100 text-blue-600' },
  { icon: Building2, title: 'หลายปีงบประมาณ', desc: 'รองรับปีงบประมาณ ปีการศึกษา ปีบัญชี — สลับดูข้อมูลข้ามปีได้', color: 'bg-green-100 text-green-600' },
  { icon: Lock, title: 'Transaction Lock', desc: 'โครงการที่มีธุรกรรมแล้วแก้ไขไม่ได้ — ป้องกันข้อมูลการเงินเสียหาย', color: 'bg-amber-100 text-amber-600' },
  { icon: Download, title: 'Export CSV/Excel', desc: 'ส่งออกข้อมูลเป็นไฟล์ CSV พร้อมใช้ใน Excel หรือ Google Sheets', color: 'bg-emerald-100 text-emerald-600' },
  { icon: Bell, title: 'แจ้งเตือนงบประมาณ', desc: 'เตือนเมื่อโครงการใช้เกิน 80% — ไม่พลาดทุกการตัดสินใจ', color: 'bg-red-100 text-red-600' },
]

const STEPS = [
  { step: 1, title: 'สมัครสมาชิก', desc: 'สร้างบัญชีและตั้งค่าโรงเรียนใน 2 นาที' },
  { step: 2, title: 'ตั้งค่าปีงบประมาณ', desc: 'เลือกรูปแบบปีและเพิ่มหมวดหมู่เริ่มต้น' },
  { step: 3, title: 'เพิ่มโครงการ', desc: 'สร้างโครงการพร้อมงบประมาณ — หรือ import CSV' },
  { step: 4, title: 'บันทึกรายการ', desc: 'เริ่มบันทึกรายรับ-รายจ่าย ติดตาม real-time' },
]

export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-800">
                Budget<span className="text-purple-600">Control</span>
              </span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#pricing" className="text-sm text-gray-600 hover:text-purple-600 transition">ทำไมฟรี?</a>
              <a href="#how" className="text-sm text-gray-600 hover:text-purple-600 transition">วิธีใช้งาน</a>
              <Link href="/login" className="text-sm text-gray-600 hover:text-purple-600 transition">เข้าสู่ระบบ</Link>
              <Link href="/register"
                className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition shadow-sm shadow-green-200">
                สมัครใช้งานฟรี
              </Link>
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenu && (
            <div className="md:hidden py-4 border-t border-gray-100 space-y-3">
              <a href="#features" className="block text-sm text-gray-600 py-2">ฟีเจอร์</a>
              <a href="#pricing" className="block text-sm text-gray-600 py-2">ทำไมฟรี?</a>
              <Link href="/login" className="block text-sm text-gray-600 py-2">เข้าสู่ระบบ</Link>
              <Link href="/register"
                className="block text-center px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium">
                สมัครใช้งานฟรี
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-0 w-72 h-72 bg-blue-200/40 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" /> SaaS สำหรับโรงเรียนไทย
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
              ควบคุมงบประมาณโรงเรียน
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                ง่าย สะดวก ไม่ปวดหัว
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              ระบบบริหารงบประมาณสำหรับโรงเรียน — ติดตามรายรับ-รายจ่าย โอนระหว่างโครงการ 
              ดูสรุปกราฟสวย ๆ พร้อม Export ได้ทันที รองรับปีงบประมาณและปีการศึกษา
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register"
                className="w-full sm:w-auto px-8 py-4 bg-green-600 text-white rounded-2xl text-lg font-semibold hover:bg-green-700 transition shadow-lg shadow-green-200 flex items-center justify-center gap-2">
                เริ่มใช้งานฟรี <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/dashboard"
                className="w-full sm:w-auto px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-2xl text-lg font-semibold hover:border-purple-300 hover:text-purple-600 transition flex items-center justify-center gap-2">
                ลอง Demo <Zap className="w-5 h-5" />
              </Link>
            </div>
            <p className="mt-4 text-xs text-gray-400">ไม่ต้องใช้บัตรเครดิต • ฟรี 100% ตลอดชีพ</p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">ทุกฟีเจอร์ที่โรงเรียนคุณต้องการ</h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              ออกแบบมาเพื่อการบริหารงบประมาณโรงเรียนไทยโดยเฉพาะ — ใช้ง่าย ไม่ต้องสอน
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition group">
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">เริ่มต้นใน 4 ขั้นตอน</h2>
            <p className="mt-4 text-gray-600">จากศูนย์สู่ระบบควบคุมงบประมาณเต็มรูปแบบในไม่กี่นาที</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-4 shadow-lg shadow-purple-200">
                  {s.step}
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 100% Free Badge ── */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-white rounded-3xl p-10 shadow-lg border-2 border-green-300">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">ฟรี 100% — ตลอดชีพ</h2>
            <p className="text-lg text-gray-600 mb-2">ไม่มีค่าใช้จ่าย ไม่มีข้อจำกัด ไม่มีลูกเล่น</p>
            <p className="text-sm text-gray-400">เพราะเราเชื่อว่าโรงเรียนทุกแห่งควรเข้าถึงระบบบริหารงบประมาณที่ดีได้</p>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">พร้อมที่จะควบคุมงบประมาณโรงเรียนของคุณ?</h2>
          <p className="text-green-100 mb-8 text-lg">
            ฟรี 100% — ไม่มีค่าใช้จ่ายแอบแฝง
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register"
              className="px-8 py-4 bg-white text-green-600 rounded-2xl text-lg font-semibold hover:bg-green-50 transition shadow-lg flex items-center gap-2">
              สมัครใช้งานฟรี <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/dashboard"
              className="px-8 py-4 border-2 border-white/30 text-white rounded-2xl text-lg font-semibold hover:bg-white/10 transition">
              ลอง Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-800">BudgetControl</span>
              </div>
              <p className="text-sm text-gray-500">ระบบควบคุมงบประมาณสำหรับโรงเรียน — ฟรี 100% ตลอดชีพ</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 text-sm">ผลิตภัณฑ์</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <p><a href="#features" className="hover:text-purple-600">ฟีเจอร์</a></p>
                <p><a href="#pricing" className="hover:text-purple-600">ทำไมฟรี?</a></p>
                <p><Link href="/dashboard" className="hover:text-purple-600">Demo</Link></p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 text-sm">บัญชี</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <p><Link href="/register" className="hover:text-purple-600">สมัครสมาชิก</Link></p>
                <p><Link href="/login" className="hover:text-purple-600">เข้าสู่ระบบ</Link></p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 text-sm">ติดต่อ</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <p>Email: hello@budget-control.app</p>
                <p>Line: @budgetcontrol</p>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-gray-100 text-center text-sm text-gray-400">
            © 2026 BudgetControl — Made with ❤️ for Thai Schools
          </div>
        </div>
      </footer>
    </div>
  )
}
