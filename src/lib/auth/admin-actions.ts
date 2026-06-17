'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function adminResetPassword(userId: string, newPassword: string) {
  const { error } = await supabaseAdmin().auth.admin.updateUserById(
    userId,
    { password: newPassword }
  )

  if (error) return { error: error.message }
  return { success: 'รีเซ็ตรหัสผ่านสำเร็จ' }
}

export async function getAllOrganizations() {
  const { data: orgs, error } = await supabaseAdmin()
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return orgs
}

export async function getOrganizationMemberCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabaseAdmin()
    .from('organization_members')
    .select('organization_id')

  if (error || !data) return {}

  const counts: Record<string, number> = {}
  for (const row of data) {
    counts[row.organization_id] = (counts[row.organization_id] || 0) + 1
  }
  return counts
}

export async function updateOrganizationStatus(orgId: string, newStatus: string) {
  const { error } = await supabaseAdmin()
    .from('organizations')
    .update({ subscription_status: newStatus })
    .eq('id', orgId)

  if (error) return { error: error.message }
  return { success: true }
}
