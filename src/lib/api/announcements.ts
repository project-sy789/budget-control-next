'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function getAnnouncements() {
  const { data, error } = await supabaseAdmin()
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) return []
  return data
}

export async function getAllAnnouncements() {
  const { data, error } = await supabaseAdmin()
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return data
}

export async function createAnnouncement(data: { title: string; content: string; type?: string }) {
  const { error } = await supabaseAdmin()
    .from('announcements')
    .insert({ ...data, type: data.type || 'info', is_active: true })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateAnnouncement(id: string, data: { title?: string; content?: string; type?: string; is_active?: boolean }) {
  const { error } = await supabaseAdmin()
    .from('announcements')
    .update(data)
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabaseAdmin()
    .from('announcements')
    .delete()
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
