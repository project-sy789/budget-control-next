'use server'

import { createClient } from '@/lib/supabase/server'

export async function getWorkGroups() {
  const supabase = await createClient()
  const { data } = await supabase.from('work_groups').select('*').eq('is_active', true).order('sort_order')
  return data || []
}

export async function getAllWorkGroups() {
  const supabase = await createClient()
  const { data } = await supabase.from('work_groups').select('*').order('sort_order')
  return data || []
}

export async function createWorkGroup(data: { name: string; color: string }) {
  const supabase = await createClient()
  const { error } = await supabase.from('work_groups').insert(data)
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateWorkGroup(id: string, data: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('work_groups').update(data).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteWorkGroup(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('work_groups').update({ is_active: false }).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function getWorkGroupColors() {
  const supabase = await createClient()
  const { data } = await supabase.from('work_groups').select('name, color').eq('is_active', true)
  const map: Record<string, string> = {}
  data?.forEach((g: any) => { map[g.name] = g.color })
  return map
}
