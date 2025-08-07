import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // 🔑 YOUR API KEYS ARE USED HERE
  // These environment variables contain your Supabase project credentials:
  // - NEXT_PUBLIC_SUPABASE_URL: https://aioblaxflcrqzlyalffm.supabase.co
  // - NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
