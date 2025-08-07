'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Play, Copy, Check, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WebhookDebuggerProps {
  elementorUrl: string
  facebookUrl: string
}

export function WebhookDebugger({ elementorUrl, facebookUrl }: WebhookDebuggerProps) {
  const [selectedWebhook, setSelectedWebhook] = useState('elementor')
  const [requestBody, setRequestBody] = useState('')
  const [contentType, setContentType] = useState('application/x-www-form-urlencoded')
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const webhookUrl = selectedWebhook === 'elementor' ? elementorUrl : facebookUrl

  const samplePayloads = {
    elementor: {
      'application/x-www-form-urlencoded': `form_fields[name]=John Doe&form_fields[email]=john@example.com&form_fields[phone]=%2B1234567890&form_fields[message]=Test message from debugger`,
      'application/json': JSON.stringify({
        'form_fields[name]': 'John Doe',
        'form_fields[email]': 'john@example.com',
        'form_fields[phone]': '+1234567890',
        'form_fields[message]': 'Test message from debugger'
      }, null, 2)
    },
    facebook: {
      'application/json': JSON.stringify({
        object: 'page',
        entry: [{
          id: '123456789',
          time: Date.now(),
          changes: [{
            field: 'leadgen',
            value: {
              leadgen_id: 'test_lead_123',
              page_id: '123456789',
              form_id: 'test_form_456',
              adgroup_id: 'test_ad_789',
              ad_id: 'test_ad_101',
              full_name: 'John Doe',
              email: 'john@example.com',
              phone_number: '+1234567890',
              company_name: 'Test Company'
            }
          }]
        }]
      }, null, 2)
    }
  }

  const loadSamplePayload = () => {
    const payload = samplePayloads[selectedWebhook as keyof typeof samplePayloads][contentType as keyof typeof samplePayloads.elementor]
    if (payload) {
      setRequestBody(payload)
    }
  }

  const sendRequest = async () => {
    if (!requestBody.trim()) {
      toast({
        title: "Error",
        description: "Please enter a request body",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setResponse(null)

    try {
      const headers: Record<string, string> = {
        'Content-Type': contentType
      }

      let body: string
      if (contentType === 'application/x-www-form-urlencoded') {
        body = requestBody
      } else {
        body = requestBody
      }

      const startTime = Date.now()
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body
      })

      const endTime = Date.now()
      const responseData = await res.json()

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data: responseData,
        duration: endTime - startTime,
        success: res.ok
      })

      if (res.ok) {
        toast({
          title: "Request Successful!",
          description: `Webhook responded with status ${res.status}`,
        })
      } else {
        toast({
          title: "Request Failed",
          description: `Status: ${res.status} - ${responseData.error || 'Unknown error'}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      setResponse({
        status: 0,
        statusText: 'Network Error',
        headers: {},
        data: { 
          error: 'Network Error',
          message: error instanceof Error ? error.message : 'Could not connect to webhook endpoint'
        },
        duration: 0,
        success: false
      })

      toast({
        title: "Connection Failed",
        description: "Could not connect to webhook endpoint",
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
        description: "Content copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Webhook Debugger</CardTitle>
          <CardDescription>
            Test your webhook endpoints with custom payloads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Webhook Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Webhook Type:</label>
              <Select value={selectedWebhook} onValueChange={setSelectedWebhook}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elementor">Elementor Forms</SelectItem>
                  <SelectItem value="facebook">Facebook Lead Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Content Type:</label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="application/x-www-form-urlencoded">Form URL Encoded</SelectItem>
                  <SelectItem value="application/json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Webhook URL Display */}
          <div>
            <label className="text-sm font-medium mb-2 block">Target URL:</label>
            <code className="block p-2 bg-muted rounded text-sm font-mono break-all">
              {webhookUrl}
            </code>
          </div>

          {/* Request Body */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Request Body:</label>
              <Button
                variant="outline"
                size="sm"
                onClick={loadSamplePayload}
              >
                Load Sample
              </Button>
            </div>
            <Textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              placeholder="Enter your request body here..."
              className="min-h-[120px] font-mono text-sm"
            />
          </div>

          {/* Send Button */}
          <Button onClick={sendRequest} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Send Request
          </Button>
        </CardContent>
      </Card>

      {/* Response */}
      {response && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Response
                {response.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={response.success ? "default" : "destructive"}>
                  {response.status} {response.statusText}
                </Badge>
                <Badge variant="outline">
                  {response.duration}ms
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="body" className="w-full">
              <TabsList>
                <TabsTrigger value="body">Response Body</TabsTrigger>
                <TabsTrigger value="headers">Headers</TabsTrigger>
              </TabsList>
              <TabsContent value="body" className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Response Data:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(response.data, null, 2))}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                  <code>{JSON.stringify(response.data, null, 2)}</code>
                </pre>
              </TabsContent>
              <TabsContent value="headers" className="space-y-2">
                <span className="text-sm font-medium">Response Headers:</span>
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                  <code>{JSON.stringify(response.headers, null, 2)}</code>
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Testing Tips:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Use the "Load Sample" button to get example payloads</li>
            <li>For Elementor, use form_fields[fieldname] format in URL-encoded requests</li>
            <li>Check the Response tab to see detailed error messages</li>
            <li>Monitor the Recent Activity tab to see all webhook requests</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
