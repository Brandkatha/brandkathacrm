import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function logWebhookRequest(logData: any) {
  try {
    const { error } = await supabaseAdmin.from('webhook_requests').insert(logData)
    if (error) {
      console.error('Failed to log webhook request:', error)
    }
  } catch (error) {
    console.error('Error logging webhook request:', error)
  }
}

// Enhanced field extraction function for Facebook Lead Ads
function extractLeadData(requestBody: any): any {
  console.log('[Facebook] ===== FIELD EXTRACTION =====')
  console.log('[Facebook] Raw request body:', JSON.stringify(requestBody, null, 2))
  
  let extractedData = {
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  }

  // Method 1: Direct field access
  if (requestBody.name) {
    extractedData.name = requestBody.name
    console.log('[Facebook] Found name (direct):', requestBody.name)
  }
  if (requestBody.full_name) {
    extractedData.name = requestBody.full_name
    console.log('[Facebook] Found full_name (direct):', requestBody.full_name)
  }
  if (requestBody.email) {
    extractedData.email = requestBody.email
    console.log('[Facebook] Found email (direct):', requestBody.email)
  }
  if (requestBody.phone_number || requestBody.phone) {
    extractedData.phone = requestBody.phone_number || requestBody.phone
    console.log('[Facebook] Found phone (direct):', extractedData.phone)
  }
  if (requestBody.company_name || requestBody.company) {
    extractedData.company = requestBody.company_name || requestBody.company
    console.log('[Facebook] Found company (direct):', extractedData.company)
  }

  // Method 2: Handle Facebook's field_data array format
  if (requestBody.field_data && Array.isArray(requestBody.field_data)) {
    console.log('[Facebook] Processing field_data array')
    requestBody.field_data.forEach((field: any) => {
      const name = field.name?.toLowerCase() || ''
      const value = field.values?.[0] || field.value || ''
      
      console.log(`[Facebook] Processing field: "${name}" with value: "${value}"`)
      
      if (name.includes('name') && !extractedData.name) {
        extractedData.name = value
        console.log('[Facebook] Found name in field_data:', value)
      } else if (name.includes('email') && !extractedData.email) {
        extractedData.email = value
        console.log('[Facebook] Found email in field_data:', value)
      } else if (name.includes('phone') && !extractedData.phone) {
        extractedData.phone = value
        console.log('[Facebook] Found phone in field_data:', value)
      } else if (name.includes('company') && !extractedData.company) {
        extractedData.company = value
        console.log('[Facebook] Found company in field_data:', value)
      }
    })
  }

  console.log('[Facebook] ===== EXTRACTION COMPLETE =====')
  console.log('[Facebook] Final extracted data:', extractedData)
  return extractedData
}

export async function POST(
  request: NextRequest,
  { params }: { params: { user_id: string } }
) {
  const userId = params.user_id
  const userAgent = request.headers.get('user-agent') || ''
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown'
  const origin = request.headers.get('origin') || 'unknown'
  const referer = request.headers.get('referer') || 'unknown'

  let requestBody: any = {}
  let responseBody: any = {}
  let responseStatus = 200
  let processedSuccessfully = false
  let errorMessage: string | null = null

  console.log(`[Facebook Webhook] ===== NEW REQUEST =====`)
  console.log(`[Facebook Webhook] Timestamp: ${new Date().toISOString()}`)
  console.log(`[Facebook Webhook] User ID: ${userId}`)
  console.log(`[Facebook Webhook] IP: ${ipAddress}`)
  console.log(`[Facebook Webhook] Origin: ${origin}`)
  console.log(`[Facebook Webhook] Referer: ${referer}`)
  console.log(`[Facebook Webhook] User Agent: ${userAgent}`)

  // Check environment variables first
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[Facebook Webhook] ❌ Missing environment variables')
    responseStatus = 500
    errorMessage = 'Server configuration error: Missing Supabase credentials'
    responseBody = { 
      error: 'Server configuration error',
      details: 'Missing required environment variables'
    }
    
    const response = NextResponse.json(responseBody, { status: responseStatus })
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
  }

  try {
    // Parse request body
    const contentType = request.headers.get('content-type') || ''
    console.log(`[Facebook Webhook] Content-Type: ${contentType}`)
    
    if (contentType.includes('application/json')) {
      requestBody = await request.json()
    } else {
      const text = await request.text()
      try {
        requestBody = JSON.parse(text)
      } catch {
        const urlParams = new URLSearchParams(text)
        requestBody = Object.fromEntries(urlParams.entries())
      }
    }

    console.log(`[Facebook Webhook] Parsed request body:`, JSON.stringify(requestBody, null, 2))

    // Validate user exists using admin client
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userError || !user?.user) {
      console.error(`[Facebook Webhook] User validation failed for ID: ${userId}`, userError)
      responseStatus = 404
      errorMessage = `User not found: ${userId}`
      responseBody = { error: 'User not found', user_id: userId }
    } else {
      console.log(`[Facebook Webhook] ✅ User validated: ${user.user.email}`)

      // Extract lead data
      const extractedData = extractLeadData(requestBody)
      
      const leadData = {
        user_id: userId,
        name: extractedData.name || 'Unknown Lead',
        email: extractedData.email || null,
        phone: extractedData.phone || null,
        company: extractedData.company || null,
        source: 'facebook',
        status: 'new',
        notes: extractedData.message || null,
        raw_data: requestBody
      }

      console.log(`[Facebook Webhook] Final lead data for insertion:`, leadData)

      // Validate required fields
      const hasName = leadData.name && leadData.name !== 'Unknown Lead'
      const hasContact = leadData.email || leadData.phone
      
      if (!hasName || !hasContact) {
        responseStatus = 400
        errorMessage = `Missing required fields. Name: "${leadData.name}", Email: "${leadData.email}", Phone: "${leadData.phone}"`
        responseBody = { 
          error: 'Missing required fields: name and (email or phone)',
          received_data: leadData,
          raw_request: requestBody,
          extraction_debug: extractedData
        }
        console.error('[Facebook Webhook] ❌ Validation failed:', errorMessage)
      } else {
        // Insert lead using admin client
        console.log('[Facebook Webhook] 🔄 Attempting to insert lead...')
        const { data: lead, error: leadError } = await supabaseAdmin
          .from('leads')
          .insert(leadData)
          .select()
          .single()

        if (leadError) {
          console.error('[Facebook Webhook] ❌ Database insertion error:', leadError)
          responseStatus = 500
          errorMessage = `Database error: ${leadError.message}`
          responseBody = { 
            error: 'Failed to save lead',
            database_error: leadError.message,
            lead_data: leadData
          }
        } else {
          processedSuccessfully = true
          responseBody = { 
            success: true, 
            message: 'Lead created successfully',
            lead_id: lead.id,
            lead_data: {
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              company: lead.company,
              source: lead.source,
              status: lead.status
            },
            timestamp: new Date().toISOString()
          }
          console.log(`[Facebook Webhook] ✅ Lead created successfully! ID: ${lead.id}`)
        }
      }
    }

  } catch (error) {
    console.error('[Facebook Webhook] ❌ Unhandled error:', error)
    responseStatus = 500
    errorMessage = error instanceof Error ? error.message : 'Unknown server error'
    responseBody = { 
      error: 'Internal server error',
      details: errorMessage
    }
  }

  // Log the webhook request
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    await logWebhookRequest({
      user_id: userId,
      webhook_type: 'facebook',
      request_method: 'POST',
      request_headers: Object.fromEntries(request.headers.entries()),
      request_body: requestBody,
      response_status: responseStatus,
      response_body: responseBody,
      ip_address: ipAddress,
      user_agent: userAgent,
      processed_successfully: processedSuccessfully,
      error_message: errorMessage
    })
  }

  console.log(`[Facebook Webhook] ===== REQUEST COMPLETE =====`)
  console.log(`[Facebook Webhook] Status: ${responseStatus}`)
  console.log(`[Facebook Webhook] Success: ${processedSuccessfully}`)
  
  // Add CORS headers
  const response = NextResponse.json(responseBody, { status: responseStatus })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}

export async function GET(
  request: NextRequest,
  { params }: { params: { user_id: string } }
) {
  const userId = params.user_id
  const hubMode = request.nextUrl.searchParams.get('hub.mode')
  const hubChallenge = request.nextUrl.searchParams.get('hub.challenge')
  const hubVerifyToken = request.nextUrl.searchParams.get('hub.verify_token')

  console.log(`[Facebook Webhook GET] Request for user: ${userId}`)
  console.log(`[Facebook Webhook GET] Hub mode: ${hubMode}`)
  console.log(`[Facebook Webhook GET] Hub challenge: ${hubChallenge}`)
  console.log(`[Facebook Webhook GET] Hub verify token: ${hubVerifyToken}`)

  // Facebook webhook verification
  if (hubMode === 'subscribe') {
    const expectedToken = process.env.FACEBOOK_VERIFY_TOKEN || 'your_verify_token'
    
    if (hubVerifyToken === expectedToken) {
      console.log('[Facebook Webhook GET] ✅ Webhook verified successfully')
      return new NextResponse(hubChallenge, { status: 200 })
    } else {
      console.log('[Facebook Webhook GET] ❌ Webhook verification failed')
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // Health check
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const response = NextResponse.json({ 
      error: 'Server configuration error',
      details: 'Missing required environment variables'
    }, { status: 500 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }

  try {
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userError || !user?.user) {
      const response = NextResponse.json({ error: 'User not found' }, { status: 404 })
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const response = NextResponse.json({
      success: true,
      message: 'Facebook webhook endpoint is active and ready',
      user_id: userId,
      user_email: user.user.email,
      timestamp: new Date().toISOString(),
      status: 'healthy'
    })
    
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return response
  } catch (error) {
    console.error('[Facebook Webhook GET] Error:', error)
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
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
