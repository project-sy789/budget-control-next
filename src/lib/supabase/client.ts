'use client'

import { createBrowserClient } from '@supabase/ssr'
import { createDemoClient, isDemo } from '@/lib/demo-supabase'

export function createClient() {
  if (isDemo()) {
    return createDemoClient() as any
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
