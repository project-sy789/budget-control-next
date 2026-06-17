import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'projects'
  const fiscal_year_id = searchParams.get('fiscal_year_id') || ''
  
  const supabase = await createClient()
  
  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let csv = ''

  if (type === 'projects') {
    let query = supabase.from('projects').select('*, fiscal_years:fiscal_year_id(name)')
    if (fiscal_year_id) query = query.eq('fiscal_year_id', fiscal_year_id)
    const { data } = await query

    csv = '\uFEFFชื่อโครงการ,ปีงบประมาณ,กลุ่มงาน,งบประมาณ,ผู้รับผิดชอบ,วันที่เริ่ม,วันที่สิ้นสุด,สถานะ\n'
    data?.forEach(p => {
      csv += `"${p.name}","${p.fiscal_years?.name || ''}","${p.work_group}",${p.budget},"${p.responsible_person}","${p.start_date}","${p.end_date}","${p.status}"\n`
    })
  } else if (type === 'transactions') {
    let query = supabase.from('transactions').select('*, projects:project_id(name), category_types:category_type_id(category_name)').order('transaction_date', { ascending: false })
    if (fiscal_year_id) {
      const { data: proj } = await supabase.from('projects').select('id').eq('fiscal_year_id', fiscal_year_id)
      const ids = proj?.map(p => p.id) || []
      if (ids.length > 0) query = query.in('project_id', ids)
    }
    const { data } = await query

    csv = '\uFEFFวันที่,โครงการ,หมวดหมู่,ประเภทรายการ,จำนวนเงิน,คำอธิบาย,เลขที่อ้างอิง\n'
    data?.forEach(tx => {
      const typeLabel = tx.transaction_type === 'income' ? 'รายรับ' : tx.transaction_type === 'expense' ? 'รายจ่าย' : tx.transaction_type === 'transfer_in' ? 'รับโอน' : 'โอนออก'
      csv += `"${tx.transaction_date}","${tx.projects?.name || ''}","${tx.category_types?.category_name || ''}","${typeLabel}",${tx.amount},"${tx.description || ''}","${tx.reference_number || ''}"\n`
    })
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${type}_export_${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
}
