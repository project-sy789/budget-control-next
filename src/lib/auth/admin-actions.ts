'use server'

import { createClient } from '@supabase/supabase-js'

export async function adminResetPassword(userId: string, newPassword: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  )

  if (error) return { error: error.message }
  return { success: 'รีเซ็ตรหัสผ่านสำเร็จ' }
}
