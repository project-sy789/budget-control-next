'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Organizations ──

export async function getAllOrganizations() {
  const { data: orgs, error } = await supabaseAdmin()
    .from('organizations').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return orgs
}

export async function getOrganizationMemberCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabaseAdmin().from('organization_members').select('organization_id')
  if (error || !data) return {}
  const counts: Record<string, number> = {}
  for (const row of data) counts[row.organization_id] = (counts[row.organization_id] || 0) + 1
  return counts
}

export async function updateOrganizationStatus(orgId: string, newStatus: string) {
  const { error } = await supabaseAdmin()
    .from('organizations').update({ subscription_status: newStatus }).eq('id', orgId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateOrganization(orgId: string, data: { name?: string; slug?: string; type?: string }) {
  const { error } = await supabaseAdmin()
    .from('organizations').update(data).eq('id', orgId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteOrganization(orgId: string) {
  const { error } = await supabaseAdmin()
    .from('organizations').delete().eq('id', orgId)
  if (error) return { error: error.message }
  return { success: true }
}

// ── Users / Profiles ──

export async function getAllUsers() {
  const { data: profiles, error: profileError } = await supabaseAdmin()
    .from('profiles').select('*').order('created_at', { ascending: false })
  if (profileError || !profiles) return []

  const { data: memberships } = await supabaseAdmin()
    .from('organization_members').select('profile_id, organization_id, role')
  const { data: orgs } = await supabaseAdmin().from('organizations').select('id, name')

  const orgMap: Record<string, string> = {}
  if (orgs) for (const o of orgs) orgMap[o.id] = o.name
  const memberMap: Record<string, { orgId: string; role: string }> = {}
  if (memberships) for (const m of memberships) {
    if (!memberMap[m.profile_id]) memberMap[m.profile_id] = { orgId: m.organization_id, role: m.role }
  }

  return profiles.map(p => ({
    ...p,
    org_name: orgMap[memberMap[p.id]?.orgId] || '—',
    org_role: memberMap[p.id]?.role || '—',
  }))
}

export async function updateUserProfile(userId: string, data: { display_name?: string; role?: string; approved?: boolean; department?: string; position?: string }) {
  const { error } = await supabaseAdmin()
    .from('profiles').update(data).eq('id', userId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function adminResetPassword(userId: string, newPassword: string) {
  const { error } = await supabaseAdmin().auth.admin.updateUserById(userId, { password: newPassword })
  if (error) return { error: error.message }
  return { success: 'รีเซ็ตรหัสผ่านสำเร็จ' }
}

export async function deleteUser(userId: string) {
  // Delete profile (cascades to org_members)
  const { error } = await supabaseAdmin().from('profiles').delete().eq('id', userId)
  if (error) return { error: error.message }
  // Delete auth user
  await supabaseAdmin().auth.admin.deleteUser(userId)
  return { success: true }
}

// ── Organization Members ──

export async function updateMemberRole(orgId: string, profileId: string, role: string) {
  const { error } = await supabaseAdmin()
    .from('organization_members').update({ role }).eq('organization_id', orgId).eq('profile_id', profileId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function removeMember(orgId: string, profileId: string) {
  const { error } = await supabaseAdmin()
    .from('organization_members').delete().eq('organization_id', orgId).eq('profile_id', profileId)
  if (error) return { error: error.message }
  return { success: true }
}
