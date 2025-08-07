import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { user_id: string } }
) {
  const userId = params.user_id

  console.log(`[Debug] Webhook debug check for user: ${userId}`)

  const debug = {
    timestamp: new Date().toISOString(),
    userId: userId,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    },
    tests: {
      supabaseConnection: false,
      userExists: false,
      tablesExist: false,
      rlsPolicies: false
    },
    errors: [] as string[]
  }

  try {
    // Test 1: Supabase connection
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
      
      debug.tests.supabaseConnection = true
      console.log('[Debug] ✅ Supabase connection configured')

      // Test 2: User exists
      try {
        const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (user?.user && !userError) {
          debug.tests.userExists = true
          console.log(`[Debug] ✅ User exists: ${user.user.email}`)
        } else {
          debug.errors.push(`User not found: ${userError?.message || 'Unknown error'}`)
          console.log(`[Debug] ❌ User not found: ${userId}`)
        }
      } catch (error) {
        debug.errors.push(`User validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Test 3: Tables exist
      try {
        const { data: leads, error: leadsError } = await supabaseAdmin
          .from('leads')
          .select('id')
          .limit(1)

        if (!leadsError) {
          debug.tests.tablesExist = true
          console.log('[Debug] ✅ Leads table exists')
        } else {
          debug.errors.push(`Leads table error: ${leadsError.message}`)
          console.log(`[Debug] ❌ Leads table error: ${leadsError.message}`)
        }
      } catch (error) {
        debug.errors.push(`Table check error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Test 4: Webhook requests table
      try {
        const { data: webhookRequests, error: webhookError } = await supabaseAdmin
          .from('webhook_requests')
          .select('id')
          .limit(1)

        if (!webhookError) {
          console.log('[Debug] ✅ Webhook requests table exists')
        } else {
          debug.errors.push(`Webhook requests table error: ${webhookError.message}`)
          console.log(`[Debug] ❌ Webhook requests table error: ${webhookError.message}`)
        }
      } catch (error) {
        debug.errors.push(`Webhook table check error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

    } else {
      debug.errors.push('Missing Supabase environment variables')
      console.log('[Debug] ❌ Missing Supabase environment variables')
    }

  } catch (error) {
    debug.errors.push(`Debug check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    console.error('[Debug] ❌ Debug check failed:', error)
  }

  const response = NextResponse.json(debug)
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
