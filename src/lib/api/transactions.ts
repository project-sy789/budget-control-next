'use server'

import { createClient } from '@/lib/supabase/server'

export async function getTransactions(filters?: {
  project_id?: string
  type?: string
  date_from?: string
  date_to?: string
  fiscal_year_id?: string
  limit?: number
  offset?: number
}) {
  const supabase = await createClient()
  let query = supabase.from('transactions').select(`
    *,
    projects:project_id(name),
    category_types:category_type_id(category_name),
    profiles:created_by(display_name)
  `).order('transaction_date', { ascending: false }).order('created_at', { ascending: false })

  if (filters?.project_id) query = query.eq('project_id', filters.project_id)
  if (filters?.type) {
    if (filters.type === 'transfer') query = query.in('transaction_type', ['transfer_in', 'transfer_out'])
    else query = query.eq('transaction_type', filters.type)
  }
  if (filters?.date_from) query = query.gte('transaction_date', filters.date_from)
  if (filters?.date_to) query = query.lte('transaction_date', filters.date_to)
  if (filters?.limit) query = query.range(filters.offset || 0, (filters.offset || 0) + filters.limit - 1)
  else query = query.limit(1000)

  const { data } = await query
  return data || []
}

export async function createTransaction(data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('transactions').insert({
    ...data,
    created_by: user.id
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
