'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Send, Loader2, CheckCircle, XCircle, Copy, Check, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WebhookDebuggerProps {
  webhookUrl: string
  platform: 'elementor' | 'facebook'
}

export function WebhookDebugger({ webhookUrl, platform }: WebhookDebuggerProps) {
  const [payload, setPayload] = useState('')
  const [contentType, setContentType] = useState(
    platform === 'elementor' ? 'application/x-www-form-urlencoded' : 'application/json'
  )
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const getSamplePayload = () => {
    if (platform === 'elementor') {
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

      const responseHeaders = {}
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
          details: 'Could not connect to webhook endpoint. This may be due to CORS restrictions or network issues.'
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
    <Card>
      <CardHeader>
        <CardTitle>Webhook Debugger</CardTitle>
        <CardDescription>
          Test your {platform === 'elementor' ? 'Elementor' : 'Facebook'} webhook with custom payloads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Webhook URL Display */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Webhook URL:</label>
          <code className="block p-2 bg-muted rounded text-sm font-mono break-all">
            {webhookUrl}
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

        {/* Usage Tips */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Testing Tips:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1 text-sm">
              <li>Use "Load Sample" to get a properly formatted payload</li>
              <li>For Elementor, use form_fields[fieldname] format in form-urlencoded</li>
              <li>Check the Response Body tab for detailed error messages</li>
              <li>Response time helps identify performance issues</li>
              <li>This works with both preview and live webhook URLs</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
