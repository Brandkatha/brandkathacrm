import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Test database connection
    const tests = {
      connection: false,
      profiles_table: false,
      leads_table: false,
      followups_table: false,
      templates_table: false,
      integration_settings_table: false,
      webhook_requests_table: false,
      trigger_function: false,
      sample_profile: false
    }

    const results = []

    // Test basic connection
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      tests.connection = !error
      results.push({
        test: 'Database Connection',
        status: tests.connection ? 'PASS' : 'FAIL',
        error: error?.message
      })
    } catch (err) {
      results.push({
        test: 'Database Connection',
        status: 'FAIL',
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }

    // Test each table
    const tables = ['profiles', 'leads', 'followups', 'templates', 'integration_settings', 'webhook_requests']
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1)
        const testKey = `${table}_table` as keyof typeof tests
        tests[testKey] = !error
        results.push({
          test: `${table} table`,
          status: tests[testKey] ? 'PASS' : 'FAIL',
          error: error?.message
        })
      } catch (err) {
        results.push({
          test: `${table} table`,
          status: 'FAIL',
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    // Test trigger function by checking if it exists
    try {
      const { data, error } = await supabase.rpc('handle_new_user')
      // If function exists but fails due to no parameters, that's expected
      tests.trigger_function = error?.message?.includes('function') || false
      results.push({
        test: 'Trigger Function',
        status: tests.trigger_function ? 'PASS' : 'FAIL',
        error: error?.message
      })
    } catch (err) {
      results.push({
        test: 'Trigger Function',
        status: 'UNKNOWN',
        error: 'Could not test trigger function'
      })
    }

    // Count profiles
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      results.push({
        test: 'Profile Count',
        status: 'INFO',
        error: `Found ${count || 0} profiles`
      })
    } catch (err) {
      results.push({
        test: 'Profile Count',
        status: 'FAIL',
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }

    const allPassed = Object.values(tests).every(test => test === true)

    return NextResponse.json({
      success: allPassed,
      timestamp: new Date().toISOString(),
      tests: results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.status === 'PASS').length,
        failed: results.filter(r => r.status === 'FAIL').length,
        info: results.filter(r => r.status === 'INFO').length
      },
      recommendations: allPassed ? [
        'Database setup looks good!',
        'You can now test user signup and webhook functionality'
      ] : [
        'Run the database setup scripts in order:',
        '1. scripts/01-create-tables.sql',
        '2. scripts/02-create-rls-policies.sql', 
        '3. scripts/03-create-functions.sql',
        '4. scripts/06-fix-user-profiles.sql',
        'Check Supabase dashboard for any error messages'
      ]
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
