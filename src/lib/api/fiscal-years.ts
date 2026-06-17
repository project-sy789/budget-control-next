'use server'

import { createClient } from '@/lib/supabase/server'

export async function getFiscalYears() {
  const supabase = await createClient()
  const { data } = await supabase.from('fiscal_years').select('*').order('name', { ascending: false })
  return data || []
}

export async function getActiveFiscalYear() {
  const supabase = await createClient()
  const { data } = await supabase.from('fiscal_years').select('*').eq('is_active', true).single()
  return data
}

export async function createFiscalYear(data: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('fiscal_years').insert(data)
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateFiscalYear(id: string, data: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('fiscal_years').update(data).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteFiscalYear(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('fiscal_years').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function setActiveFiscalYear(id: string) {
  const supabase = await createClient()
  await supabase.from('fiscal_years').update({ is_active: false }).neq('id', id)
  const { error } = await supabase.from('fiscal_years').update({ is_active: true }).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
