import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const [usersRes, projectsRes, transactionsRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('projects').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('transactions').select('id', { count: 'exact', head: true }),
    ])

    return NextResponse.json({
      totalUsers: usersRes.count || 0,
      totalProjects: projectsRes.count || 0,
      totalTransactions: transactionsRes.count || 0,
    })
  } catch {
    return NextResponse.json({
      totalUsers: 0,
      totalProjects: 0,
      totalTransactions: 0,
    })
  }
}
