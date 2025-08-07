import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = await createClient()
  const token = params.token
  
  try {
    // Get request details for logging
    const userAgent = request.headers.get('user-agent') || ''
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const requestHeaders = Object.fromEntries(request.headers.entries())
    
    // Parse request body
    let requestBody: any = {}
    try {
      const bodyText = await request.text()
      if (bodyText) {
        // Try to parse as JSON first
        try {
          requestBody = JSON.parse(bodyText)
        } catch {
          // If not JSON, try to parse as form data
          const formData = new URLSearchParams(bodyText)
          requestBody = Object.fromEntries(formData.entries())
        }
      }
    } catch (error) {
      console.error('Error parsing request body:', error)
    }

    console.log('🔍 Webhook Request Details:', {
      token,
      method: request.method,
      headers: requestHeaders,
      body: requestBody,
      userAgent,
      ipAddress
    })

    // Find user by webhook token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('webhook_token', token)
      .single()

    if (profileError || !profile) {
      console.error('❌ Invalid webhook token:', token, profileError)
      
      // Log the failed request
      await supabase.from('webhook_logs').insert({
        webhook_token: token,
        request_method: request.method,
        request_headers: requestHeaders,
        request_body: requestBody,
        response_status: 401,
        response_body: { error: 'Invalid webhook token' },
        ip_address: ipAddress,
        user_agent: userAgent
      })

      return NextResponse.json(
        { error: 'Invalid webhook token' },
        { status: 401 }
      )
    }

    console.log('✅ Found user for webhook:', profile)

    // Extract lead data from request body
    const leadData = {
      name: requestBody.name || requestBody.form_fields?.name || requestBody.fields?.name || 'Unknown',
      email: requestBody.email || requestBody.form_fields?.email || requestBody.fields?.email || '',
      phone: requestBody.phone || requestBody.form_fields?.phone || requestBody.fields?.phone || '',
      message: requestBody.message || requestBody.form_fields?.message || requestBody.fields?.message || '',
      source: 'elementor'
    }

    console.log('📝 Extracted lead data:', leadData)

    // Validate that we have at least name and (email or phone)
    if (!leadData.name || (!leadData.email && !leadData.phone)) {
      console.error('❌ Validation failed: Missing required fields')
      
      // Log the failed request
      await supabase.from('webhook_logs').insert({
        user_id: profile.id,
        webhook_token: token,
        request_method: request.method,
        request_headers: requestHeaders,
        request_body: requestBody,
        response_status: 400,
        response_body: { 
          error: 'Missing required fields', 
          required: ['name', 'email or phone'],
          received: Object.keys(requestBody)
        },
        ip_address: ipAddress,
        user_agent: userAgent
      })

      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          required: ['name', 'email or phone'],
          received: Object.keys(requestBody)
        },
        { status: 400 }
      )
    }

    // Insert lead into database (using only existing columns)
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        user_id: profile.id,
        name: leadData.name,
        email: leadData.email || null,
        phone: leadData.phone || null,
        source: leadData.source,
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (leadError) {
      console.error('❌ Error creating lead:', leadError)
      
      // Log the failed request
      await supabase.from('webhook_logs').insert({
        user_id: profile.id,
        webhook_token: token,
        request_method: request.method,
        request_headers: requestHeaders,
        request_body: requestBody,
        response_status: 500,
        response_body: { error: 'Failed to create lead', details: leadError },
        ip_address: ipAddress,
        user_agent: userAgent
      })

      return NextResponse.json(
        { error: 'Failed to create lead', details: leadError.message },
        { status: 500 }
      )
    }

    console.log('🎉 Lead created successfully:', lead)

    // Log successful request
    await supabase.from('webhook_logs').insert({
      user_id: profile.id,
      webhook_token: token,
      request_method: request.method,
      request_headers: requestHeaders,
      request_body: requestBody,
      response_status: 200,
      response_body: { success: true, lead_id: lead.id },
      ip_address: ipAddress,
      user_agent: userAgent
    })

    return NextResponse.json({
      success: true,
      message: 'Lead created successfully',
      lead_id: lead.id,
      user_id: profile.id,
      data: {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        source: leadData.source,
        message: leadData.message
      }
    })

  } catch (error) {
    console.error('💥 Webhook processing error:', error)
    
    // Log the error
    try {
      await supabase.from('webhook_logs').insert({
        webhook_token: token,
        request_method: request.method,
        request_headers: Object.fromEntries(request.headers.entries()),
        request_body: {},
        response_status: 500,
        response_body: { error: 'Internal server error' },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || ''
      })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = await createClient()
  const token = params.token

  try {
    // Find user by webhook token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('webhook_token', token)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Invalid webhook token' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook endpoint is active',
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email
      },
      webhook_url: `${request.nextUrl.origin}/api/webhooks/${token}`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Webhook GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
