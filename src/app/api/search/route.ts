import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  const orgId = req.nextUrl.searchParams.get('org_id')

  if (!q || q.length < 2 || !orgId) {
    return NextResponse.json({ results: [] })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const searchPattern = `%${q}%`

  try {
    const [projectsRes, transactionsRes] = await Promise.all([
      supabaseAdmin
        .from('projects')
        .select('id, name, code, budget_total, status, work_group, fiscal_year')
        .eq('organization_id', orgId)
        .or(`name.ilike.${searchPattern},code.ilike.${searchPattern},work_group.ilike.${searchPattern}`)
        .order('updated_at', { ascending: false })
        .limit(10),
      supabaseAdmin
        .from('transactions')
        .select('id, description, amount, type, project_id, created_at')
        .eq('organization_id', orgId)
        .or(`description.ilike.${searchPattern}`)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const results: any[] = []

    if (projectsRes.data) {
      projectsRes.data.forEach((p: any) => {
        results.push({
          type: 'project',
          id: p.id,
          title: p.name,
          subtitle: `${p.code || ''} — งบ ${(p.budget_total || 0).toLocaleString()} บาท`,
          badge: p.status === 'active' ? '🟢' : p.status === 'completed' ? '✅' : '📋',
          url: `/projects/${p.id}`,
        })
      })
    }

    if (transactionsRes.data) {
      transactionsRes.data.forEach((t: any) => {
        const emoji = t.type === 'income' ? '💰' : t.type === 'expense' ? '💸' : '🔄'
        results.push({
          type: 'transaction',
          id: t.id,
          title: t.description || '(ไม่มีคำอธิบาย)',
          subtitle: `${emoji} ${t.type === 'income' ? '+' : t.type === 'expense' ? '-' : 'โอน'} ${(t.amount || 0).toLocaleString()} บาท · ${new Date(t.created_at).toLocaleDateString('th-TH')}`,
          badge: emoji,
          url: `/projects/${t.project_id}`,
        })
      })
    }

    // Sort: projects first, then transactions; both by relevance (substring match first)
    results.sort((a, b) => {
      const aTitle = (a.title || '').toLowerCase()
      const bTitle = (b.title || '').toLowerCase()
      const qLower = q.toLowerCase()
      const aExact = aTitle.startsWith(qLower) ? 0 : aTitle.includes(qLower) ? 1 : 2
      const bExact = bTitle.startsWith(qLower) ? 0 : bTitle.includes(qLower) ? 1 : 2
      if (aExact !== bExact) return aExact - bExact
      if (a.type !== b.type) return a.type === 'project' ? -1 : 1
      return 0
    })

    return NextResponse.json({ results: results.slice(0, 15) })
  } catch (error: any) {
    return NextResponse.json({ results: [], error: error?.message || 'Search failed' })
  }
}
