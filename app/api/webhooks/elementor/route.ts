import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Log the request headers for debugging
    console.log('=== WEBHOOK RECEIVED ===')
    console.log('Headers:', Object.fromEntries(request.headers.entries()))
    console.log('URL:', request.url)
    console.log('Method:', request.method)
    
    const body = await request.json()
    console.log('Raw webhook body:', JSON.stringify(body, null, 2))

    const supabase = await createClient()

    // Extract lead data from Elementor webhook - handle multiple possible formats
    const fields = body.fields || body.form_fields || body.data || body
    console.log('Extracted fields:', fields)
    
    // More flexible field extraction to handle different Elementor formats
    const leadData = {
      name: fields?.name || fields?.first_name || fields?.full_name || fields?.['field_name'] || fields?.['form_fields']?.name || 'Unknown',
      email: fields?.email || fields?.['field_email'] || fields?.['form_fields']?.email || '',
      phone: fields?.phone || fields?.telephone || fields?.mobile || fields?.['field_phone'] || fields?.['form_fields']?.phone || '',
      company: fields?.company || fields?.organization || fields?.['field_company'] || fields?.['form_fields']?.company || '',
      source: 'elementor',
      status: 'new',
      notes: fields?.message || fields?.comments || fields?.inquiry || fields?.['field_message'] || fields?.['form_fields']?.message || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log('Processed lead data:', leadData)

    // Validate required fields - at least email OR phone must be present
    if (!leadData.email && !leadData.phone) {
      console.error('❌ Validation failed: No email or phone provided')
      console.log('Available fields:', Object.keys(fields || {}))
      return NextResponse.json({ 
        error: 'Either email or phone is required',
        received_fields: Object.keys(fields || {}),
        received_data: fields,
        message: 'Please ensure your form has fields named "email" or "phone"'
      }, { status: 400 })
    }

    // Try multiple methods to find a user ID
    let userId = null
    let userFindMethod = 'none'
    
    console.log('🔍 Searching for user account...')

    // Method 1: Try to get from auth.users (most reliable)
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
      console.log('Auth users query result:', { 
        users_count: authData?.users?.length || 0, 
        error: authError?.message 
      })
      
      if (authData?.users && authData.users.length > 0) {
        userId = authData.users[0].id
        userFindMethod = 'auth.users'
        console.log('✅ Found user via auth.users:', userId)
      }
    } catch (authError) {
      console.log('⚠️ Auth users query failed:', authError)
    }

    // Method 2: Try to get from profiles table
    if (!userId) {
      try {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
        
        console.log('Profiles query result:', { 
          profiles_count: profiles?.length || 0, 
          error: profileError?.message 
        })
        
        if (profiles && profiles.length > 0) {
          userId = profiles[0].id
          userFindMethod = 'profiles'
          console.log('✅ Found user via profiles:', userId)
        }
      } catch (profileError) {
        console.log('⚠️ Profiles query failed:', profileError)
      }
    }

    // Method 3: Create a system user if none exists
    if (!userId) {
      console.log('🔧 No user found, creating system user...')
      try {
        // Create a system user account
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: 'system@crm.local',
          password: 'system-user-' + Math.random().toString(36).substring(7),
          email_confirm: true,
          user_metadata: {
            name: 'System User',
            role: 'system'
          }
        })

        if (newUser?.user && !createError) {
          userId = newUser.user.id
          userFindMethod = 'created_system_user'
          console.log('✅ Created system user:', userId)

          // Also create a profile for the system user
          try {
            await supabase
              .from('profiles')
              .insert({
                id: userId,
                name: 'System User',
                email: 'system@crm.local',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
            console.log('✅ Created system user profile')
          } catch (profileCreateError) {
            console.log('⚠️ Failed to create system user profile:', profileCreateError)
          }
        } else {
          console.error('❌ Failed to create system user:', createError)
        }
      } catch (systemUserError) {
        console.error('❌ System user creation failed:', systemUserError)
      }
    }

    if (!userId) {
      console.error('❌ No user found and could not create system user')
      return NextResponse.json({ 
        error: 'No user account found in system',
        message: 'Please ensure you have at least one user account created, or contact support',
        debug: {
          auth_users_checked: true,
          profiles_checked: true,
          system_user_creation_attempted: true
        }
      }, { status: 500 })
    }

    console.log(`🔄 Attempting to create lead for user: ${userId} (found via: ${userFindMethod})`)

    // Create the lead in the database
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        name: leadData.name,
        email: leadData.email || null,
        phone: leadData.phone || null,
        source: leadData.source,
        status: leadData.status,
        user_id: userId,
        created_at: leadData.created_at,
        updated_at: leadData.updated_at,
      })
      .select()
      .single()

    if (leadError) {
      console.error('❌ Database error creating lead:', leadError)
      console.log('Lead data that failed:', {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        source: leadData.source,
        status: leadData.status,
        user_id: userId,
      })
      
      return NextResponse.json({ 
        error: 'Failed to create lead in database',
        details: leadError.message,
        code: leadError.code,
        hint: leadError.hint,
        debug_data: {
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          user_id: userId,
          user_find_method: userFindMethod
        }
      }, { status: 500 })
    }

    console.log('✅ Lead created successfully:', lead)

    // Verify the lead was actually created by querying it back
    try {
      const { data: verifyLead, error: verifyError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead.id)
        .single()

      if (verifyError) {
        console.log('⚠️ Could not verify lead creation:', verifyError)
      } else {
        console.log('✅ Lead verification successful:', verifyLead)
      }
    } catch (verifyError) {
      console.log('⚠️ Lead verification failed:', verifyError)
    }

    // Store the raw webhook data for debugging
    try {
      const { error: webhookError } = await supabase
        .from('elementor_webhooks')
        .insert({
          user_id: userId,
          raw_data: body,
          status: 'processed',
          created_at: new Date().toISOString(),
        })
      
      if (webhookError) {
        console.log('⚠️ Failed to store webhook data (non-critical):', webhookError)
      } else {
        console.log('✅ Webhook data stored for debugging')
      }
    } catch (webhookError) {
      console.log('⚠️ Webhook storage error (non-critical):', webhookError)
    }

    console.log('=== WEBHOOK SUCCESS ===')

    // Return success response
    return NextResponse.json({ 
      success: true, 
      lead_id: lead?.id,
      message: 'Lead created successfully',
      processed_data: {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        source: leadData.source,
        user_id: userId,
        user_find_method: userFindMethod
      },
      timestamp: new Date().toISOString()
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    console.log('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Return detailed error information
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      debug: 'Check server logs for detailed error information'
    }, { status: 500 })
  }
}

// Handle GET requests for webhook verification and testing
export async function GET(request: NextRequest) {
  console.log('📡 GET request to webhook endpoint')
  
  try {
    const supabase = await createClient()
    
    // Test database connection and user accounts
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    const { data: leadsCount, error: leadsError } = await supabase
      .from('leads')
      .select('count')
      .limit(1)
    
    return NextResponse.json({ 
      message: 'Elementor webhook endpoint is active',
      timestamp: new Date().toISOString(),
      url: request.url,
      method: 'GET',
      system_status: {
        database_connection: leadsError ? 'Failed' : 'Success',
        auth_users_count: authUsers?.users?.length || 0,
        profiles_accessible: profileError ? false : true,
        leads_table_accessible: leadsError ? false : true
      },
      errors: {
        auth_error: authError?.message || null,
        profile_error: profileError?.message || null,
        leads_error: leadsError?.message || null
      }
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ 
      message: 'Webhook endpoint error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
