'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function getSchoolDetail(orgId: string) {
  const admin = supabaseAdmin()

  const { data: org } = await admin.from('organizations').select('*').eq('id', orgId).single()

  const { data: members } = await admin
    .from('organization_members')
    .select('role, joined_at, profiles:profile_id(id, email, display_name, approved, created_at)')
    .eq('organization_id', orgId)
    .order('joined_at', { ascending: false })

  const { data: projects } = await admin
    .from('projects')
    .select('id, name, budget, used_budget, status, work_group, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  const { data: transactions } = await admin
    .from('transactions')
    .select('id, amount, transaction_type, description, transaction_date, project_id, projects:project_id(name)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50)

  const { count: projectCount } = await admin.from('projects').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)
  const { count: transactionCount } = await admin.from('transactions').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)

  const { data: fiscalYears } = await admin.from('fiscal_years').select('*').eq('organization_id', orgId).order('name', { ascending: false })
  const { data: workGroups } = await admin.from('work_groups').select('*').eq('organization_id', orgId)

  return { org, members: members || [], projects: projects || [], transactions: transactions || [], fiscalYears: fiscalYears || [], workGroups: workGroups || [], counts: { projects: projectCount || 0, transactions: transactionCount || 0 } }
}

export async function addFiscalYear(orgId: string, name: string, startDate: string, endDate: string) {
  const admin = supabaseAdmin()
  const { error } = await admin.from('fiscal_years').insert({
    organization_id: orgId, name, start_date: startDate, end_date: endDate, is_active: false
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function setActiveFiscalYear(orgId: string, fyId: string) {
  const admin = supabaseAdmin()
  // Deactivate all
  await admin.from('fiscal_years').update({ is_active: false }).eq('organization_id', orgId)
  // Activate selected
  const { error } = await admin.from('fiscal_years').update({ is_active: true }).eq('id', fyId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteFiscalYear(fyId: string) {
  const admin = supabaseAdmin()
  const { error } = await admin.from('fiscal_years').delete().eq('id', fyId)
  if (error) return { error: error.message }
  return { success: true }
}
