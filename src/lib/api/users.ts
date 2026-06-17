'use server'

import { createClient } from '@/lib/supabase/server'

export async function getUsers() {
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  return data || []
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return data
}

export async function updateUserStatus(userId: string, role: string, approved: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ role, approved }).eq('id', userId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteUser(userId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').delete().eq('id', userId)
  if (error) return { error: error.message }
  return { success: true }
}
