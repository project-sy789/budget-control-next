import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ระบบควบคุมงบประมาณ - โรงเรียนซับใหญ่วิทยาคม',
  description: 'Budget Control System v3',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var mode = localStorage.getItem('budget-control-dark-mode');
                if (mode === 'true' || (!mode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            })();
          `
        }} />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
        {children}
      </body>
    </html>
  )
}
