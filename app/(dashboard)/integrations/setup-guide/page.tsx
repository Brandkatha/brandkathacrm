'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Copy, ExternalLink, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function SetupGuidePage() {
  const [copiedText, setCopiedText] = useState('')

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    setTimeout(() => setCopiedText(''), 2000)
  }

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://yourcrm.com'}/api/webhooks/elementor`

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/integrations">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Integrations
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Integration Setup Guide</h1>
        <p className="text-muted-foreground mt-2">
          Complete step-by-step instructions for setting up all CRM integrations
        </p>
      </div>

      <div className="space-y-8">
        {/* Elementor Forms */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                E
              </div>
              <div>
                <CardTitle>Elementor Forms Integration</CardTitle>
                <CardDescription>
                  Capture leads directly from your WordPress Elementor forms
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Webhook URL</h4>
              <div className="flex items-center gap-2">
                <code className="bg-white dark:bg-gray-800 px-3 py-2 rounded border flex-1 text-sm">
                  {webhookUrl}
                </code>
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                  className="shrink-0"
                >
                  {copiedText === 'webhook' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Edit Your Elementor Form</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to your WordPress admin → Pages → Edit the page with your form
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Configure Form Actions</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Click on your form → Content tab → Actions After Submit
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Add Action → Webhook</li>
                    <li>• Webhook URL: Paste the URL above</li>
                    <li>• Remote Server: POST</li>
                    <li>• Content Type: application/json</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Field Mapping (Important)</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Use these field IDs for automatic mapping:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">name</code> → Lead Name</div>
                    <div><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">email</code> → Email</div>
                    <div><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">phone</code> → Phone</div>
                    <div><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">company</code> → Company</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Facebook Lead Ads */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                F
              </div>
              <div>
                <CardTitle>Facebook Lead Ads Integration</CardTitle>
                <CardDescription>
                  Automatically import leads from Facebook Lead Ad campaigns
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Create Facebook App</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Go to Facebook Developers and create a new app
                  </p>
                  <Button size="sm" variant="outline" asChild>
                    <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Facebook Developers
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Get Access Token</h4>
                  <p className="text-sm text-muted-foreground">
                    Add Marketing API product → Generate access token with leads_retrieval permission
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Configure in CRM</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to Integrations → Facebook → Enter your Access Token and Page ID
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">Required Permissions</h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• leads_retrieval</li>
                <li>• pages_show_list</li>
                <li>• pages_read_engagement</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Business */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                W
              </div>
              <div>
                <CardTitle>WhatsApp Business Integration</CardTitle>
                <CardDescription>
                  Send WhatsApp messages using approved templates
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">WhatsApp Business Account</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Create a WhatsApp Business Account through Meta Business
                  </p>
                  <Button size="sm" variant="outline" asChild>
                    <a href="https://business.whatsapp.com" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      WhatsApp Business
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Get API Credentials</h4>
                  <p className="text-sm text-muted-foreground">
                    Get your Phone Number ID, Access Token, and Webhook Verify Token
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Create Message Templates</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Templates must be approved by WhatsApp. Example template:
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm">
                    Hello {'{'}{'{'}{1}{'}'}{'}'}! Thank you for your interest. Our team will contact you soon.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">Template Variables</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Use {'{'}{'{'}{1}{'}'}{'}'}', {'{'}{'{'}{2}{'}'}{'}'}', etc. for dynamic content like names, companies, etc.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Email Service */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
                @
              </div>
              <div>
                <CardTitle>Email Service Integration</CardTitle>
                <CardDescription>
                  Send email campaigns through SMTP
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Choose Email Provider</h4>
                  <p className="text-sm text-muted-foreground">
                    Gmail, Outlook, SendGrid, or any SMTP-compatible service
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Get SMTP Settings</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Common SMTP configurations:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      <strong>Gmail:</strong> smtp.gmail.com:587 (TLS)
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      <strong>Outlook:</strong> smtp-mail.outlook.com:587 (TLS)
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Configure in CRM</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to Integrations → Email → Enter your SMTP settings and credentials
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Security Note</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                For Gmail, use App Passwords instead of your regular password. Enable 2FA first, then generate an app password.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables Setup</CardTitle>
            <CardDescription>
              Configure your environment variables for all integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Required Environment Variables</h4>
              <div className="space-y-2 text-sm font-mono">
                <div>NEXT_PUBLIC_SUPABASE_URL=https://aioblaxflcrqzlyalffm.supabase.co</div>
                <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</div>
                <div>FACEBOOK_ACCESS_TOKEN=your_facebook_token</div>
                <div>WHATSAPP_ACCESS_TOKEN=your_whatsapp_token</div>
                <div>WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id</div>
                <div>SMTP_HOST=smtp.gmail.com</div>
                <div>SMTP_PORT=587</div>
                <div>SMTP_USER=your_email@gmail.com</div>
                <div>SMTP_PASS=your_app_password</div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">Important</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Create a <code>.env.local</code> file in your project root and add these variables. Never commit this file to version control.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
