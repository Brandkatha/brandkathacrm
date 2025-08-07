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

export async function POST(
  request: NextRequest,
  { params }: { params: { user_id: string } }
) {
  const userId = params.user_id
  const userAgent = request.headers.get('user-agent') || ''
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown'

  let requestBody: any = {}
  let responseBody: any = {}
  let responseStatus = 200
  let processedSuccessfully = false
  let errorMessage: string | null = null

  console.log(`[Facebook Webhook] ===== NEW REQUEST =====`)
  console.log(`[Facebook Webhook] User ID: ${userId}`)

  try {
    requestBody = await request.json()
    console.log(`[Facebook Webhook] Request body:`, JSON.stringify(requestBody, null, 2))

    // Validate user exists
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userError || !user?.user) {
      console.error(`[Facebook Webhook] User validation failed for ID: ${userId}`, userError)
      responseStatus = 404
      errorMessage = 'User not found'
      responseBody = { error: 'User not found' }
    } else {
      console.log(`[Facebook Webhook] User validated: ${user.user.email}`)

      // Process Facebook Lead Ads webhook
      if (requestBody.object === 'page' && requestBody.entry) {
        const leads = []
        
        for (const entry of requestBody.entry) {
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.field === 'leadgen' && change.value) {
                const leadValue = change.value
                
                const leadData = {
                  user_id: userId,
                  name: leadValue.full_name || 'Unknown Lead',
                  email: leadValue.email || null,
                  phone: leadValue.phone_number || null,
                  company: leadValue.company_name || null,
                  source: 'facebook',
                  status: 'new',
                  raw_data: requestBody
                }

                console.log(`[Facebook Webhook] Processing lead:`, leadData)

                // Insert lead using admin client
                const { data: lead, error: leadError } = await supabaseAdmin
                  .from('leads')
                  .insert(leadData)
                  .select()
                  .single()

                if (leadError) {
                  console.error('[Facebook Webhook] Database error:', leadError)
                  errorMessage = `Database error: ${leadError.message}`
                } else {
                  leads.push(lead)
                  console.log(`[Facebook Webhook] ✅ Lead created: ${lead.id}`)
                }
              }
            }
          }
        }

        if (leads.length > 0) {
          processedSuccessfully = true
          responseBody = { 
            success: true, 
            message: `${leads.length} lead(s) created successfully`,
            leads: leads.map(l => ({ id: l.id, name: l.name, email: l.email }))
          }
        } else {
          responseStatus = 400
          errorMessage = 'No valid leads found in request'
          responseBody = { error: 'No valid leads found in request' }
        }
      } else {
        responseStatus = 400
        errorMessage = 'Invalid Facebook webhook format'
        responseBody = { error: 'Invalid Facebook webhook format' }
      }
    }

  } catch (error) {
    console.error('[Facebook Webhook] Unhandled error:', error)
    responseStatus = 500
    errorMessage = error instanceof Error ? error.message : 'Unknown server error'
    responseBody = { error: 'Internal server error' }
  }

  // Log the webhook request
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

  console.log(`[Facebook Webhook] ===== REQUEST COMPLETE =====`)
  
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
  const url = new URL(request.url)
  
  // Facebook webhook verification
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  console.log(`[Facebook Webhook] Verification request:`, { mode, token, challenge })

  if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    console.log('[Facebook Webhook] ✅ Webhook verified')
    return new NextResponse(challenge, { status: 200 })
  } else {
    console.log('[Facebook Webhook GET] Health check for user:', userId)
    
    try {
      // Validate user exists
      const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
      
      if (userError || !user?.user) {
        console.log(`[Facebook Webhook GET] User not found: ${userId}`)
        const response = NextResponse.json({ error: 'User not found' }, { status: 404 })
        response.headers.set('Access-Control-Allow-Origin', '*')
        return response
      }

      console.log(`[Facebook Webhook GET] ✅ Health check passed for: ${user.user.email}`)
      
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
