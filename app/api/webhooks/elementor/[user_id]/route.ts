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

// Enhanced field extraction function for Elementor forms
function extractLeadData(requestBody: any, isFormData: boolean = false): any {
  console.log('[Elementor] ===== FIELD EXTRACTION =====')
  console.log('[Elementor] Raw request body:', JSON.stringify(requestBody, null, 2))
  console.log('[Elementor] Is form data:', isFormData)
  
  let extractedData = {
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  }

  // Method 1: Handle Elementor's form_fields[fieldname] format (most common for form-urlencoded)
  console.log('[Elementor] Method 1: Elementor form_fields[fieldname] format')
  Object.keys(requestBody).forEach(key => {
    const value = requestBody[key]
    console.log(`[Elementor] Processing key: "${key}" with value: "${value}"`)
    
    // Handle form_fields[name], form_fields[email], etc.
    if (key.startsWith('form_fields[') && key.endsWith(']')) {
      const fieldName = key.slice(12, -1).toLowerCase() // Extract field name from form_fields[fieldname]
      console.log(`[Elementor] Extracted field name: "${fieldName}"`)
      
      if (fieldName.includes('name') || fieldName === 'field_1') {
        extractedData.name = value
        console.log('[Elementor] Found name in form_fields:', value)
      } else if (fieldName.includes('email') || fieldName === 'field_2') {
        extractedData.email = value
        console.log('[Elementor] Found email in form_fields:', value)
      } else if (fieldName.includes('phone') || fieldName.includes('tel') || fieldName === 'field_3') {
        extractedData.phone = value
        console.log('[Elementor] Found phone in form_fields:', value)
      } else if (fieldName.includes('company') || fieldName.includes('organization') || fieldName === 'field_4') {
        extractedData.company = value
        console.log('[Elementor] Found company in form_fields:', value)
      } else if (fieldName.includes('message') || fieldName.includes('comment') || fieldName.includes('textarea') || fieldName === 'field_5') {
        extractedData.message = value
        console.log('[Elementor] Found message in form_fields:', value)
      }
    }
  })

  // Method 2: Direct field access (for JSON format)
  console.log('[Elementor] Method 2: Direct field access')
  if (requestBody.name && !extractedData.name) {
    extractedData.name = requestBody.name
    console.log('[Elementor] Found name (direct):', requestBody.name)
  }
  if (requestBody.email && !extractedData.email) {
    extractedData.email = requestBody.email
    console.log('[Elementor] Found email (direct):', requestBody.email)
  }
  if (requestBody.phone && !extractedData.phone) {
    extractedData.phone = requestBody.phone
    console.log('[Elementor] Found phone (direct):', requestBody.phone)
  }
  if (requestBody.company && !extractedData.company) {
    extractedData.company = requestBody.company
    console.log('[Elementor] Found company (direct):', requestBody.company)
  }
  if (requestBody.message && !extractedData.message) {
    extractedData.message = requestBody.message
    console.log('[Elementor] Found message (direct):', requestBody.message)
  }

  console.log('[Elementor] ===== EXTRACTION COMPLETE =====')
  console.log('[Elementor] Final extracted data:', extractedData)
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
  let isFormData = false

  console.log(`[Elementor Webhook] ===== NEW REQUEST =====`)
  console.log(`[Elementor Webhook] Timestamp: ${new Date().toISOString()}`)
  console.log(`[Elementor Webhook] User ID: ${userId}`)
  console.log(`[Elementor Webhook] IP: ${ipAddress}`)
  console.log(`[Elementor Webhook] Origin: ${origin}`)
  console.log(`[Elementor Webhook] Referer: ${referer}`)
  console.log(`[Elementor Webhook] User Agent: ${userAgent}`)

  try {
    // Parse request body with enhanced form-urlencoded support
    const contentType = request.headers.get('content-type') || ''
    console.log(`[Elementor Webhook] Content-Type: ${contentType}`)
    
    if (contentType.includes('application/json')) {
      console.log('[Elementor Webhook] Parsing as JSON')
      requestBody = await request.json()
      isFormData = false
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      console.log('[Elementor Webhook] Parsing as form-urlencoded data')
      const formData = await request.formData()
      requestBody = Object.fromEntries(formData.entries())
      isFormData = true
      console.log('[Elementor Webhook] Form data entries:', Object.keys(requestBody))
    } else {
      console.log('[Elementor Webhook] Parsing as raw text')
      const text = await request.text()
      console.log(`[Elementor Webhook] Raw text body: ${text}`)
      
      if (text.trim().startsWith('{')) {
        try {
          requestBody = JSON.parse(text)
          console.log('[Elementor Webhook] Successfully parsed as JSON')
          isFormData = false
        } catch (e) {
          console.log('[Elementor Webhook] JSON parse failed, trying URL params')
          const urlParams = new URLSearchParams(text)
          requestBody = Object.fromEntries(urlParams.entries())
          isFormData = true
        }
      } else {
        const urlParams = new URLSearchParams(text)
        requestBody = Object.fromEntries(urlParams.entries())
        console.log('[Elementor Webhook] Parsed as URL parameters')
        isFormData = true
      }
    }

    console.log(`[Elementor Webhook] Parsed request body:`, JSON.stringify(requestBody, null, 2))
    console.log(`[Elementor Webhook] Request body keys:`, Object.keys(requestBody))

    // Validate user exists using admin client
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userError || !user?.user) {
      console.error(`[Elementor Webhook] User validation failed for ID: ${userId}`, userError)
      responseStatus = 404
      errorMessage = `User not found: ${userId}`
      responseBody = { error: 'User not found', user_id: userId }
    } else {
      console.log(`[Elementor Webhook] ✅ User validated: ${user.user.email}`)

      // Extract lead data using enhanced extraction
      const extractedData = extractLeadData(requestBody, isFormData)
      
      const leadData = {
        user_id: userId,
        name: extractedData.name || 'Unknown Lead',
        email: extractedData.email || null,
        phone: extractedData.phone || null,
        company: extractedData.company || null,
        source: 'elementor',
        status: 'new',
        notes: extractedData.message || null,
        raw_data: requestBody
      }

      console.log(`[Elementor Webhook] Final lead data for insertion:`, leadData)

      // Validate required fields - require at least name and (email OR phone)
      const hasName = leadData.name && leadData.name !== 'Unknown Lead'
      const hasContact = leadData.email || leadData.phone
      
      if (!hasName || !hasContact) {
        responseStatus = 400
        errorMessage = `Missing required fields. Name: "${leadData.name}", Email: "${leadData.email}", Phone: "${leadData.phone}"`
        responseBody = { 
          error: 'Missing required fields: name and (email or phone)',
          received_data: leadData,
          raw_request: requestBody,
          extraction_debug: extractedData,
          validation: {
            hasName,
            hasContact,
            nameValue: leadData.name,
            emailValue: leadData.email,
            phoneValue: leadData.phone
          }
        }
        console.error('[Elementor Webhook] ❌ Validation failed:', errorMessage)
      } else {
        // Insert lead using admin client (bypasses RLS)
        console.log('[Elementor Webhook] 🔄 Attempting to insert lead...')
        const { data: lead, error: leadError } = await supabaseAdmin
          .from('leads')
          .insert(leadData)
          .select()
          .single()

        if (leadError) {
          console.error('[Elementor Webhook] ❌ Database insertion error:', leadError)
          responseStatus = 500
          errorMessage = `Database error: ${leadError.message} | Code: ${leadError.code} | Details: ${leadError.details}`
          responseBody = { 
            error: 'Failed to save lead',
            database_error: leadError.message,
            database_code: leadError.code,
            database_details: leadError.details,
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
          console.log(`[Elementor Webhook] ✅ Lead created successfully!`)
          console.log(`[Elementor Webhook] Lead ID: ${lead.id}`)
          console.log(`[Elementor Webhook] Lead details:`, {
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            company: lead.company,
            user_id: lead.user_id
          })
        }
      }
    }

  } catch (error) {
    console.error('[Elementor Webhook] ❌ Unhandled error:', error)
    responseStatus = 500
    errorMessage = error instanceof Error ? error.message : 'Unknown server error'
    responseBody = { 
      error: 'Internal server error',
      details: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }
  }

  // Log the webhook request
  console.log(`[Elementor Webhook] 📝 Logging request with status: ${responseStatus}`)
  await logWebhookRequest({
    user_id: userId,
    webhook_type: 'elementor',
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

  console.log(`[Elementor Webhook] ===== REQUEST COMPLETE =====`)
  console.log(`[Elementor Webhook] Status: ${responseStatus}`)
  console.log(`[Elementor Webhook] Success: ${processedSuccessfully}`)
  
  return NextResponse.json(responseBody, { status: responseStatus })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { user_id: string } }
) {
  const userId = params.user_id

  console.log(`[Elementor Webhook GET] Health check for user: ${userId}`)

  try {
    // Validate user exists
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userError || !user?.user) {
      console.log(`[Elementor Webhook GET] User not found: ${userId}`)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log(`[Elementor Webhook GET] ✅ Health check passed for: ${user.user.email}`)
    
    return NextResponse.json({
      success: true,
      message: 'Elementor webhook endpoint is active and ready',
      user_id: userId,
      user_email: user.user.email,
      timestamp: new Date().toISOString(),
      status: 'healthy',
      supported_formats: ['application/json', 'application/x-www-form-urlencoded', 'text/plain']
    })
  } catch (error) {
    console.error('[Elementor Webhook GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
