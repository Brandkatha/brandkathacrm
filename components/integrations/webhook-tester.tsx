'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Send, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'

export function WebhookTester() {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; isSimulated?: boolean } | null>(null)
  const [testData, setTestData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    message: 'Test lead from webhook tester'
  })
  const { toast } = useToast()

  const testWebhook = async () => {
    setTesting(true)
    setTestResult(null)

    // Check if we're in a preview environment
    const isPreview = window.location.hostname.includes('v0.dev') || 
                     window.location.hostname.includes('localhost') ||
                     !process.env.NEXT_PUBLIC_SUPABASE_URL

    if (isPreview) {
      // Simulate a test in preview mode
      setTimeout(() => {
        setTestResult({ 
          success: true, 
          message: 'Preview Mode: Simulated successful webhook test. Deploy your app to test with real Supabase integration.',
          isSimulated: true
        })
        toast({
          title: 'Simulated Test Complete',
          description: 'This is a preview simulation. Deploy to test with real data.',
        })
        setTesting(false)
      }, 2000)
      return
    }

    try {
      // In a real environment, this would test the actual webhook
      const response = await fetch('/api/webhooks/elementor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: testData,
          test: true,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setTestResult({ success: true, message: result.message || 'Test successful' })
        toast({
          title: 'Test Successful',
          description: 'Webhook is working correctly',
        })
      } else {
        setTestResult({ success: false, message: result.error || 'Test failed' })
        toast({
          title: 'Test Failed',
          description: result.error || 'Unknown error',
          variant: 'destructive',
        })
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Network error - could not connect to webhook endpoint' })
      toast({
        title: 'Test Failed',
        description: 'Could not connect to webhook endpoint',
        variant: 'destructive',
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Webhook Tester
        </CardTitle>
        <CardDescription>
          Test your webhook integration with sample data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview Environment Warning */}
        {(window.location.hostname.includes('v0.dev') || !process.env.NEXT_PUBLIC_SUPABASE_URL) && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Preview Environment:</strong> You're viewing this in the v0 preview. 
              Webhook testing will be simulated. Deploy your app to test with real Supabase integration.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="test-name">Name</Label>
            <Input
              id="test-name"
              value={testData.name}
              onChange={(e) => setTestData({ ...testData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="test-email">Email</Label>
            <Input
              id="test-email"
              type="email"
              value={testData.email}
              onChange={(e) => setTestData({ ...testData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="test-phone">Phone</Label>
            <Input
              id="test-phone"
              value={testData.phone}
              onChange={(e) => setTestData({ ...testData, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="test-message">Message</Label>
            <Textarea
              id="test-message"
              value={testData.message}
              onChange={(e) => setTestData({ ...testData, message: e.target.value })}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button onClick={testWebhook} disabled={testing}>
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Test Webhook
              </>
            )}
          </Button>

          {testResult && (
            <div className={`flex items-center gap-2 ${
              testResult.success ? 'text-green-600' : 'text-red-600'
            }`}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span className="text-sm">{testResult.message}</span>
            </div>
          )}
        </div>

        {testResult && testResult.isSimulated && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <strong>Simulated Test:</strong> This was a preview simulation. To test with real data:
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Deploy your app to Vercel or another hosting platform</li>
                <li>Add your Supabase credentials to environment variables</li>
                <li>Test the webhook with your deployed URL</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
