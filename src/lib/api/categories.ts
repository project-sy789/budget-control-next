'use server'

import { createClient } from '@/lib/supabase/server'

export async function getCategories() {
  const supabase = await createClient()
  const { data } = await supabase.from('category_types').select('*').eq('is_active', true).order('category_name')
  return data || []
}

export async function getAllCategories() {
  const supabase = await createClient()
  const { data } = await supabase.from('category_types').select('*').order('category_name')
  return data || []
}

export async function createCategory(data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('category_types').insert({
    ...data,
    created_by: user?.id
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateCategory(id: string, data: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('category_types').update(data).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  // Soft delete
  const { error } = await supabase.from('category_types').update({ is_active: false }).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
