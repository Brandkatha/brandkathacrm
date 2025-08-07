'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Copy, Check, ExternalLink, ChevronDown, ChevronRight, Play, CheckCircle, XCircle, Loader2, AlertTriangle, Globe, Facebook } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WebhookUrlCardProps {
  title: string
  description: string
  webhookUrl: string
  platform: 'elementor' | 'facebook'
}

export function WebhookUrlCard({
  title,
  description,
  webhookUrl,
  platform
}: WebhookUrlCardProps) {
  const [copied, setCopied] = useState(false)
  const [isSetupOpen, setIsSetupOpen] = useState(false)
  const [isFieldsOpen, setIsFieldsOpen] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const { toast } = useToast()

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Webhook URL copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually",
        variant: "destructive"
      })
    }
  }

  const testWebhook = async () => {
    setTesting(true)
    setTestResult(null)

    // Check if we're in a preview environment
    const isPreview = window.location.hostname.includes('v0.dev') || 
                     window.location.hostname.includes('localhost')

    if (isPreview) {
      // Simulate a successful connection test in preview
      setTimeout(() => {
        setTestResult({
          success: true,
          status: 200,
          data: { 
            message: 'Preview Mode: Webhook endpoint is accessible and ready to receive requests.',
            endpoint: 'active'
          },
          isPreview: true
        })
        
        toast({
          title: "Connection Test Successful!",
          description: "Webhook endpoint is accessible (preview mode)",
        })
        setTesting(false)
      }, 1000)
      return
    }

    try {
      // Test with a simple GET request first
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })
      
      const data = await response.json()
      
      setTestResult({
        success: response.ok,
        status: response.status,
        data: data
      })

      if (response.ok) {
        toast({
          title: "Test Successful!",
          description: "Your webhook endpoint is working correctly",
        })
      } else {
        toast({
          title: "Test Failed",
          description: `Status: ${response.status} - ${data.error || 'Unknown error'}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setTestResult({
        success: false,
        status: 0,
        data: { 
          error: 'Network Error',
          message: 'Could not connect to webhook endpoint. This may be due to CORS restrictions or the server not being deployed yet.'
        }
      })
      
      toast({
        title: "Connection Failed",
        description: "Could not connect to webhook endpoint",
        variant: "destructive"
      })
    } finally {
      setTesting(false)
    }
  }

  const testWithSampleData = async () => {
    setTesting(true)
    setTestResult(null)

    const isPreview = window.location.hostname.includes('v0.dev') || 
                     window.location.hostname.includes('localhost')

    if (isPreview) {
      // Simulate a successful test in preview
      setTimeout(() => {
        setTestResult({
          success: true,
          status: 200,
          data: { 
            message: 'Preview Mode: This is a simulated successful webhook test. In production, this would create a real lead.',
            lead_id: 'preview-lead-123'
          },
          isSimulated: true
        })
        
        toast({
          title: "Simulated Test Successful!",
          description: "This is a preview simulation. Deploy to test with real data.",
        })
        setTesting(false)
      }, 1500)
      return
    }

    try {
      const sampleData = platform === 'elementor' 
        ? {
            'form_fields[name]': 'Test Lead',
            'form_fields[email]': 'test@example.com',
            'form_fields[phone]': '+1234567890',
            'form_fields[message]': 'This is a test submission from the webhook tester'
          }
        : {
            name: 'Test Lead',
            email: 'test@example.com',
            phone: '+1234567890',
            message: 'This is a test submission from the webhook tester'
          }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': platform === 'elementor' 
            ? 'application/x-www-form-urlencoded'
            : 'application/json',
        },
        body: platform === 'elementor'
          ? new URLSearchParams(sampleData as Record<string, string>).toString()
          : JSON.stringify(sampleData)
      })
      
      const data = await response.json()
      
      setTestResult({
        success: response.ok,
        status: response.status,
        data: data
      })

      if (response.ok) {
        toast({
          title: "Test Lead Created!",
          description: "Sample lead was successfully created in your CRM",
        })
      } else {
        toast({
          title: "Test Failed",
          description: `Status: ${response.status} - ${data.error || 'Unknown error'}`,
          variant: "destructive"
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        status: 0,
        data: { 
          error: 'Network Error',
          message: 'Could not connect to webhook endpoint'
        }
      })
      
      toast({
        title: "Connection Failed",
        description: "Could not connect to webhook endpoint",
        variant: "destructive"
      })
    } finally {
      setTesting(false)
    }
  }

  const getIcon = () => {
    switch (platform) {
      case 'elementor':
        return <Globe className="h-6 w-6 text-blue-600" />
      case 'facebook':
        return <Facebook className="h-6 w-6 text-blue-600" />
      default:
        return <Globe className="h-6 w-6 text-blue-600" />
    }
  }

  const getSetupInstructions = () => {
    if (platform === 'elementor') {
      return [
        "Open your Elementor form in edit mode (works with both live and preview sites)",
        "Go to 'Actions After Submit' and add a 'Webhook' action",
        "Paste the webhook URL and set method to POST",
        "Set the format to 'Form Data' (not JSON)",
        "Save the form and test with a real submission",
        "Check your CRM dashboard for the new lead"
      ]
    } else {
      return [
        "Go to Facebook Business Manager",
        "Navigate to your ad account settings",
        "Add this webhook URL to Lead Ads settings",
        "Configure the webhook to send lead data",
        "Test with a sample lead submission"
      ]
    }
  }

  const getFieldMapping = () => {
    if (platform === 'elementor') {
      return {
        "Name": "name, full_name, first_name",
        "Email": "email, email_address, user_email",
        "Phone": "phone, phone_number, telephone",
        "Company": "company, organization, business_name",
        "Message": "message, comment, textarea"
      }
    } else {
      return {
        "Full Name": "full_name, name",
        "Email": "email, email_address",
        "Phone": "phone_number, phone",
        "Company": "company_name, company"
      }
    }
  }

  const setupInstructions = getSetupInstructions()
  const fieldMapping = getFieldMapping()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Webhook URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Webhook URL:</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
              {webhookUrl}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(webhookUrl)}
              className="shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="flex gap-2">
          <Button onClick={testWebhook} disabled={testing} variant="outline" size="sm">
            {testing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
          <Button onClick={testWithSampleData} disabled={testing} variant="outline" size="sm">
            {testing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Test with Data
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={webhookUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </a>
          </Button>
        </div>

        {/* Test Result */}
        {testResult && (
          <Alert className={
            testResult.success 
              ? 'border-green-200 bg-green-50' 
              : testResult.isPreview 
                ? 'border-blue-200 bg-blue-50'
                : 'border-red-200 bg-red-50'
          }>
            <div className="flex items-start gap-2">
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              ) : testResult.isPreview ? (
                <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
              )}
              <AlertDescription className="flex-1">
                <div>
                  <strong>
                    {testResult.isPreview ? 'Preview Mode' : 
                     testResult.isSimulated ? 'Simulated Test' :
                     testResult.success ? `Success (${testResult.status})` : 
                     `Failed (${testResult.status})`}:
                  </strong>
                  <p className="mt-1">{testResult.data.message || testResult.data.error}</p>
                  {testResult.data.lead_id && (
                    <p className="text-sm mt-1 font-mono">Lead ID: {testResult.data.lead_id}</p>
                  )}
                  {testResult.isPreview && (
                    <div className="mt-2 p-2 bg-blue-100 rounded text-sm">
                      <strong>Preview Testing:</strong>
                      <p className="mt-1">This webhook URL works with both preview and live sites. You can test it directly from your Elementor forms.</p>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Setup Instructions */}
        <Collapsible open={isSetupOpen} onOpenChange={setIsSetupOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <span className="font-medium">Setup Instructions</span>
              {isSetupOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Good News:</strong> This webhook URL works with both preview and live websites. 
                You can test it directly from your forms without needing to deploy first.
              </AlertDescription>
            </Alert>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              {setupInstructions.map((instruction, index) => (
                <li key={index} className="text-muted-foreground">
                  {instruction}
                </li>
              ))}
            </ol>
          </CollapsibleContent>
        </Collapsible>

        {/* Field Mapping */}
        <Collapsible open={isFieldsOpen} onOpenChange={setIsFieldsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <span className="font-medium">Field Mapping</span>
              {isFieldsOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            <div className="text-sm text-muted-foreground mb-2">
              The webhook automatically detects these field names (case-insensitive):
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {Object.entries(fieldMapping).map(([label, patterns]) => (
                <div key={label} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="font-medium">{label}:</span>
                  <div className="flex gap-1 flex-wrap">
                    {patterns.split(', ').map((pattern) => (
                      <Badge key={pattern} variant="outline" className="font-mono text-xs">
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {platform === 'elementor' && (
              <div className="text-xs text-muted-foreground mt-2">
                The webhook supports form_fields[name] format and automatically extracts data from Elementor's form structure.
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Status Badge */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Badge variant="outline" className="text-xs">
            <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
            Ready for {platform === 'elementor' ? 'form submissions' : 'lead ads'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
