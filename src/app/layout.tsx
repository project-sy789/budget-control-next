import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ระบบควบคุมงบประมาณ - โรงเรียนซับใหญ่วิทยาคม',
  description: 'Budget Control System v3',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
}
