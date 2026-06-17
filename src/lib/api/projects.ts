'use server'

import { createClient } from '@/lib/supabase/server'

export async function getProjects(fiscalYearId?: string) {
  const supabase = await createClient()
  let query = supabase.from('projects').select('*, profiles:created_by(display_name)').order('created_at', { ascending: false })
  if (fiscalYearId) query = query.eq('fiscal_year_id', fiscalYearId)
  const { data } = await query
  return data || []
}

export async function getProjectById(id: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('projects').select('*, profiles:created_by(display_name)').eq('id', id).single()
  return data
}

export async function createProject(projectData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { fiscal_year_id, budget_categories, ...rest } = projectData
  
  const { data: project, error } = await supabase.from('projects').insert({
    ...rest,
    fiscal_year_id: fiscal_year_id || null,
    created_by: user.id
  }).select().single()

  if (error) return { error: error.message }

  // Insert budget categories
  if (budget_categories && Array.isArray(budget_categories)) {
    const categories = budget_categories.map((c: any) => ({
      project_id: project.id,
      category_type_id: c.category_type_id,
      budget_amount: c.budget_amount
    }))
    await supabase.from('budget_categories').insert(categories)
  }

  return { data: project }
}

export async function updateProject(id: string, projectData: any) {
  const supabase = await createClient()
  const { fiscal_year_id, budget_categories, ...rest } = projectData
  
  const { error } = await supabase.from('projects').update({
    ...rest,
    fiscal_year_id: fiscal_year_id || null
  }).eq('id', id)

  if (error) return { error: error.message }

  // Update budget categories
  if (budget_categories && Array.isArray(budget_categories)) {
    await supabase.from('budget_categories').delete().eq('project_id', id)
    const categories = budget_categories.map((c: any) => ({
      project_id: id,
      category_type_id: c.category_type_id,
      budget_amount: c.budget_amount
    }))
    await supabase.from('budget_categories').insert(categories)
  }

  return { success: true }
}

export async function deleteProject(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
