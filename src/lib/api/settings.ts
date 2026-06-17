'use server'

import { createClient } from '@/lib/supabase/server'

export async function getSettings() {
  const supabase = await createClient()
  const { data } = await supabase.from('system_settings').select('*').order('setting_key')
  return data || []
}

export async function getSiteConfig() {
  const supabase = await createClient()
  const { data } = await supabase.from('system_settings').select('*')
  
  const config: any = {
    site_name: 'ระบบควบคุมงบประมาณ',
    organization_name: 'โรงเรียนซับใหญ่วิทยาคม',
    site_title: 'ระบบควบคุมงบประมาณ - โรงเรียนซับใหญ่วิทยาคม',
    site_icon: '',
    enable_pwa: true,
    year_label_type: 'fiscal_year'
  }

  if (data) {
    data.forEach((s: any) => {
      if (s.setting_key === 'enable_pwa') config[s.setting_key] = s.setting_value === 'true'
      else config[s.setting_key] = s.setting_value
    })
  }

  return config
}

export async function updateSetting(key: string, value: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('system_settings').upsert({
    setting_key: key,
    setting_value: value
  }, { onConflict: 'setting_key' })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateSettings(settings: Record<string, string>) {
  const supabase = await createClient()
  for (const [key, value] of Object.entries(settings)) {
    await supabase.from('system_settings').upsert({
      setting_key: key,
      setting_value: value
    }, { onConflict: 'setting_key' })
  }
  return { success: true }
}
