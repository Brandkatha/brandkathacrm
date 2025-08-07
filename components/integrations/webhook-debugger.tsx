'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Send, Loader2, CheckCircle, XCircle, Copy, Check, AlertTriangle, Bug, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/utils/supabase/client'

interface WebhookDebuggerProps {
  elementorUrl: string
  facebookUrl: string
}

export function WebhookDebugger({ elementorUrl, facebookUrl }: WebhookDebuggerProps) {
  const [activeTab, setActiveTab] = useState('elementor')
  const [payload, setPayload] = useState('')
  const [contentType, setContentType] = useState('application/x-www-form-urlencoded')
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [debugLoading, setDebugLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getUser()
  }, [supabase])

  useEffect(() => {
    // Update content type based on active tab
    if (activeTab === 'elementor') {
      setContentType('application/x-www-form-urlencoded')
    } else {
      setContentType('application/json')
    }
    setPayload('')
    setResponse(null)
  }, [activeTab])

  const getCurrentWebhookUrl = () => {
    return activeTab === 'elementor' ? elementorUrl : facebookUrl
  }

  const getSamplePayload = () => {
    if (activeTab === 'elementor') {
      if (contentType === 'application/json') {
        return JSON.stringify({
          form_fields: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            message: 'I am interested in your services'
          },
          form_name: 'Contact Form',
          post_id: '123',
          form_id: 'contact-form'
        }, null, 2)
      } else {
        return 'form_fields[name]=John+Doe&form_fields[email]=john@example.com&form_fields[phone]=%2B1234567890&form_fields[message]=I+am+interested+in+your+services&form_name=Contact+Form&post_id=123&form_id=contact-form'
      }
    } else {
      return JSON.stringify({
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1987654321',
        company: 'Example Corp',
        ad_id: '123456789',
        form_id: 'lead_form_1'
      }, null, 2)
    }
  }

  const loadSamplePayload = () => {
    setPayload(getSamplePayload())
  }

  const runDebugCheck = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to run debug checks",
        variant: "destructive"
      })
      return
    }

    setDebugLoading(true)
    setDebugInfo(null)

    try {
      const debugUrl = `${window.location.origin}/api/debug/webhook/${currentUser.id}`
      const response = await fetch(debugUrl)
      const data = await response.json()
      
      setDebugInfo(data)
      
      if (data.errors.length === 0) {
        toast({
          title: "Debug Check Passed!",
          description: "All systems are working correctly",
        })
      } else {
        toast({
          title: "Issues Found",
          description: `Found ${data.errors.length} issue(s) that need attention`,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Debug Check Failed",
        description: "Could not run debug checks",
        variant: "destructive"
      })
    } finally {
      setDebugLoading(false)
    }
  }

  const sendWebhook = async () => {
    if (!payload.trim()) {
      toast({
        title: "Error",
        description: "Please enter a payload to send",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setResponse(null)

    try {
      const startTime = Date.now()
      const webhookUrl = getCurrentWebhookUrl()
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          'Accept': 'application/json',
        },
        body: payload
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      let responseData
      const responseText = await response.text()
      
      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = responseText
      }

      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      setResponse({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: responseData,
        responseTime,
        timestamp: new Date().toISOString()
      })

      if (response.ok) {
        toast({
          title: "Webhook Sent Successfully!",
          description: `Response: ${response.status} ${response.statusText}`,
        })
      } else {
        toast({
          title: "Webhook Failed",
          description: `Status: ${response.status} - ${response.statusText}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setResponse({
        success: false,
        status: 0,
        statusText: 'Network Error',
        headers: {},
        data: {
          error: 'Network Error',
          message: errorMessage,
          details: 'Could not connect to webhook endpoint. Check your deployment and environment variables.'
        },
        responseTime: 0,
        timestamp: new Date().toISOString()
      })

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Response copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the text manually",
        variant: "destructive"
      })
    }
  }

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2)
    } catch {
      return String(obj)
    }
  }

  return (
    <div className="space-y-6">
      {/* Debug System Check */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                System Debug Check
              </CardTitle>
              <CardDescription>
                Verify your deployment configuration and database setup
              </CardDescription>
            </div>
            <Button onClick={runDebugCheck} disabled={debugLoading} variant="outline">
              {debugLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Run Debug Check
            </Button>
          </div>
        </CardHeader>
        {debugInfo && (
          <CardContent>
            <div className="space-y-4">
              {/* Environment Status */}
              <div>
                <h4 className="font-medium mb-2">Environment Configuration:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    {debugInfo.environment.hasSupabaseUrl ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>Supabase URL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {debugInfo.environment.hasServiceRoleKey ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>Service Role Key</span>
                  </div>
                </div>
              </div>

              {/* Test Results */}
              <div>
                <h4 className="font-medium mb-2">System Tests:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    {debugInfo.tests.supabaseConnection ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>Supabase Connection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {debugInfo.tests.userExists ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>User Authentication</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {debugInfo.tests.tablesExist ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>Database Tables</span>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {debugInfo.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Issues Found:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {debugInfo.errors.map((error: string, index: number) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Webhook Tester */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Tester</CardTitle>
          <CardDescription>
            Test your webhook endpoints with custom payloads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Platform Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="elementor">Elementor</TabsTrigger>
              <TabsTrigger value="facebook">Facebook</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="space-y-4">
              {/* Webhook URL Display */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Webhook URL:</label>
                <code className="block p-2 bg-muted rounded text-sm font-mono break-all">
                  {getCurrentWebhookUrl()}
                </code>
              </div>

              {/* Content Type Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Content Type:</label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application/json">application/json</SelectItem>
                    <SelectItem value="application/x-www-form-urlencoded">
                      application/x-www-form-urlencoded
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payload Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Request Payload:</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadSamplePayload}
                  >
                    Load Sample
                  </Button>
                </div>
                <Textarea
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  placeholder={`Enter your ${contentType} payload here...`}
                  className="min-h-[120px] font-mono text-sm"
                />
              </div>

              {/* Send Button */}
              <Button onClick={sendWebhook} disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Webhook
              </Button>

              {/* Response Display */}
              {response && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Response</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={response.success ? "default" : "destructive"}>
                        {response.status} {response.statusText}
                      </Badge>
                      {response.responseTime > 0 && (
                        <Badge variant="outline">
                          {response.responseTime}ms
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Alert className={
                    response.success 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }>
                    <div className="flex items-start gap-2">
                      {response.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      )}
                      <AlertDescription>
                        <strong>
                          {response.success ? 'Success' : 'Failed'}:
                        </strong>
                        <p className="mt-1">
                          {response.success 
                            ? 'Webhook processed successfully'
                            : response.data?.message || response.data?.error || 'Request failed'
                          }
                        </p>
                        {response.data?.lead_id && (
                          <p className="text-sm mt-1 font-mono">
                            Lead ID: {response.data.lead_id}
                          </p>
                        )}
                        {!response.success && response.status === 0 && (
                          <div className="mt-2 p-2 bg-red-100 rounded text-sm">
                            <strong>Deployment Issue:</strong>
                            <p className="mt-1">Check your Vercel deployment and environment variables.</p>
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </Alert>

                  <Tabs defaultValue="body" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="body">Response Body</TabsTrigger>
                      <TabsTrigger value="headers">Headers</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="body" className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Response Data:</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(formatJson(response.data))}
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <pre className="p-3 bg-muted rounded text-sm overflow-auto max-h-64">
                        {formatJson(response.data)}
                      </pre>
                    </TabsContent>
                    
                    <TabsContent value="headers" className="space-y-2">
                      <span className="text-sm font-medium">Response Headers:</span>
                      <pre className="p-3 bg-muted rounded text-sm overflow-auto max-h-64">
                        {formatJson(response.headers)}
                      </pre>
                    </TabsContent>
                  </Tabs>

                  <div className="text-xs text-muted-foreground">
                    Timestamp: {new Date(response.timestamp).toLocaleString()}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Usage Tips */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Troubleshooting Tips:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1 text-sm">
                <li>Run the Debug Check first to verify your setup</li>
                <li>Make sure your Vercel environment variables are configured</li>
                <li>Check that your database tables exist (run the SQL scripts)</li>
                <li>For Elementor, use form_fields[fieldname] format in form-urlencoded</li>
                <li>Check the Vercel function logs for detailed error messages</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
