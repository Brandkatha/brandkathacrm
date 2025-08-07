'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Copy, Check, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Globe, Code, Settings, HelpCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ElementorSetupGuideProps {
  webhookUrl: string
}

export function ElementorSetupGuide({ webhookUrl }: ElementorSetupGuideProps) {
  const [copied, setCopied] = useState(false)
  const [basicOpen, setBasicOpen] = useState(true)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [troubleshootOpen, setTroubleshootOpen] = useState(false)
  const [testingOpen, setTestingOpen] = useState(false)
  const { toast } = useToast()

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

  const testCommand = `
// Test your webhook in browser console
fetch('${webhookUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    'form_fields[name]': 'Test User',
    'form_fields[email]': 'test@example.com',
    'form_fields[phone]': '+1234567890',
    'form_fields[message]': 'Test message from browser console'
  })
}).then(r => r.json()).then(console.log)
  `.trim()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle>Elementor Forms Setup Guide</CardTitle>
              <CardDescription>
                Complete guide to connect your Elementor forms to this CRM
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This webhook only works on your deployed app with proper Supabase credentials. 
              It will not work in the v0 preview environment.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Basic Setup */}
      <Collapsible open={basicOpen} onOpenChange={setBasicOpen}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="text-left">
                    <CardTitle className="text-lg">Basic Setup</CardTitle>
                    <CardDescription>Essential steps to connect your Elementor form</CardDescription>
                  </div>
                </div>
                {basicOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">1</Badge>
                  <div>
                    <p className="font-medium">Open your Elementor form</p>
                    <p className="text-sm text-muted-foreground">
                      Edit your form on the LIVE website (not in preview mode)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">2</Badge>
                  <div>
                    <p className="font-medium">Go to Actions After Submit</p>
                    <p className="text-sm text-muted-foreground">
                      In the form settings, find "Actions After Submit" section
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">3</Badge>
                  <div>
                    <p className="font-medium">Add Webhook Action</p>
                    <p className="text-sm text-muted-foreground">
                      Click "Add Action" and select "Webhook"
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">4</Badge>
                  <div>
                    <p className="font-medium">Configure Webhook Settings</p>
                    <div className="mt-2 space-y-2">
                      <div>
                        <label className="text-sm font-medium">Webhook URL:</label>
                        <div className="flex items-center gap-2 mt-1">
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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Method:</label>
                          <Badge variant="secondary" className="ml-2">POST</Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Format:</label>
                          <Badge variant="secondary" className="ml-2">Form Data</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">5</Badge>
                  <div>
                    <p className="font-medium">Save and Test</p>
                    <p className="text-sm text-muted-foreground">
                      Save your form and submit a test entry to verify it works
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Advanced Configuration */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <CardTitle className="text-lg">Advanced Configuration</CardTitle>
                    <CardDescription>Field mapping and advanced settings</CardDescription>
                  </div>
                </div>
                {advancedOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Supported Field Names</h4>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <span className="font-medium">Name Field:</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">name</Badge>
                      <Badge variant="outline" className="text-xs">full_name</Badge>
                      <Badge variant="outline" className="text-xs">first_name</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <span className="font-medium">Email Field:</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">email</Badge>
                      <Badge variant="outline" className="text-xs">email_address</Badge>
                      <Badge variant="outline" className="text-xs">user_email</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <span className="font-medium">Phone Field:</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">phone</Badge>
                      <Badge variant="outline" className="text-xs">phone_number</Badge>
                      <Badge variant="outline" className="text-xs">telephone</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <span className="font-medium">Company Field:</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">company</Badge>
                      <Badge variant="outline" className="text-xs">organization</Badge>
                      <Badge variant="outline" className="text-xs">business_name</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <span className="font-medium">Message Field:</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">message</Badge>
                      <Badge variant="outline" className="text-xs">comment</Badge>
                      <Badge variant="outline" className="text-xs">textarea</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Field ID Tip:</strong> The webhook automatically detects field names. 
                  Use descriptive field IDs in Elementor (like "name", "email") for best results.
                </AlertDescription>
              </Alert>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Troubleshooting */}
      <Collapsible open={troubleshootOpen} onOpenChange={setTroubleshootOpen}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-orange-600" />
                  <div className="text-left">
                    <CardTitle className="text-lg">Troubleshooting</CardTitle>
                    <CardDescription>Common issues and solutions</CardDescription>
                  </div>
                </div>
                {troubleshootOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-medium text-red-700">Forms not creating leads</h4>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Ensure you're testing on the LIVE site, not Elementor preview</li>
                    <li>• Check that webhook URL is correctly pasted</li>
                    <li>• Verify method is set to POST and format is Form Data</li>
                    <li>• Make sure form has name and email fields</li>
                  </ul>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-medium text-yellow-700">Security plugin blocking requests</h4>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Temporarily disable security plugins to test</li>
                    <li>• Whitelist your webhook URL in security settings</li>
                    <li>• Check firewall logs for blocked requests</li>
                  </ul>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-blue-700">Hosting restrictions</h4>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Some hosts block outbound API calls</li>
                    <li>• Contact your hosting provider about webhook restrictions</li>
                    <li>• Try testing from a different server/hosting</li>
                  </ul>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-green-700">Field mapping issues</h4>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Use descriptive field IDs (name, email, phone)</li>
                    <li>• Check the Recent Activity tab to see what data is received</li>
                    <li>• Ensure required fields (name + email/phone) are present</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Testing */}
      <Collapsible open={testingOpen} onOpenChange={setTestingOpen}>
        <Card>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-3">
                  <Code className="h-5 w-5 text-purple-600" />
                  <div className="text-left">
                    <CardTitle className="text-lg">Manual Testing</CardTitle>
                    <CardDescription>Test your webhook directly from browser console</CardDescription>
                  </div>
                </div>
                {testingOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Open your browser's developer console (F12) on your live website and run this command:
                </p>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                    <code>{testCommand}</code>
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(testCommand)}
                    className="absolute top-2 right-2"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Alert>
                <Code className="h-4 w-4" />
                <AlertDescription>
                  <strong>Expected Response:</strong> You should see a JSON response with 
                  <code className="mx-1 px-1 bg-muted rounded">success: true</code> and a 
                  <code className="mx-1 px-1 bg-muted rounded">lead_id</code> if the webhook is working correctly.
                </AlertDescription>
              </Alert>

              <div className="text-sm text-muted-foreground">
                <p><strong>Troubleshooting the test:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>If you get a network error, check if your app is deployed and accessible</li>
                  <li>If you get a 404 error, verify the webhook URL is correct</li>
                  <li>If you get a 400 error, check the error message for missing fields</li>
                  <li>If you get a 500 error, check your server logs for database issues</li>
                </ul>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
}
