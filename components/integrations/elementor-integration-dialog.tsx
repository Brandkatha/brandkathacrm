'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/utils/supabase/client'
import { Copy, ExternalLink, Settings, Webhook, CheckCircle, AlertCircle } from 'lucide-react'

export function ElementorIntegrationDialog() {
  const [open, setOpen] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      fetchUserProfile()
    }
  }, [open])

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserProfile(profile)
        if (profile.webhook_token) {
          const baseUrl = window.location.origin
          setWebhookUrl(`${baseUrl}/api/webhooks/${profile.webhook_token}`)
        }
        setWebhookSecret(profile.webhook_secret || '')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    })
  }

  const generateNewToken = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Generate new webhook token
      const newToken = `wh_${Math.random().toString(36).substring(2)}_${Date.now()}`
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          webhook_token: newToken,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      // Update local state
      setWebhookUrl(`${window.location.origin}/api/webhooks/${newToken}`)
      
      toast({
        title: 'Success!',
        description: 'New webhook token generated',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate new token',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const updateWebhookSecret = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({ 
          webhook_secret: webhookSecret,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: 'Success!',
        description: 'Webhook secret updated',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update webhook secret',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Settings className="w-4 h-4 mr-2" />
          Configure Elementor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5" />
            Elementor Forms Integration
          </DialogTitle>
          <DialogDescription>
            Connect your Elementor forms to automatically create leads in your CRM
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Webhook Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Unique Webhook URL</CardTitle>
              <CardDescription>
                This URL is unique to your account and automatically assigns leads to you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-url"
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-secret">Webhook Secret (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-secret"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="Enter a secret for additional security"
                  />
                  <Button
                    size="sm"
                    onClick={updateWebhookSecret}
                    disabled={loading}
                  >
                    Update
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={generateNewToken}
                  disabled={loading}
                >
                  Generate New Token
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Setup Instructions</CardTitle>
              <CardDescription>
                Follow these steps to connect your Elementor forms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">1</Badge>
                  <div>
                    <h4 className="font-medium">Edit Your Elementor Form</h4>
                    <p className="text-sm text-gray-600">
                      Open your Elementor form in edit mode and go to the "Actions After Submit" section
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">2</Badge>
                  <div>
                    <h4 className="font-medium">Add Webhook Action</h4>
                    <p className="text-sm text-gray-600">
                      Click "Add Action" and select "Webhook" from the list
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">3</Badge>
                  <div>
                    <h4 className="font-medium">Configure Webhook Settings</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Webhook URL:</strong> Paste your unique URL above</p>
                      <p><strong>Method:</strong> POST</p>
                      <p><strong>Content Type:</strong> application/json</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">4</Badge>
                  <div>
                    <h4 className="font-medium">Map Form Fields</h4>
                    <p className="text-sm text-gray-600">
                      Ensure your form fields are named correctly for automatic mapping:
                    </p>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">name</span>
                        <span className="text-gray-600">→ Lead Name</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">email</span>
                        <span className="text-gray-600">→ Email Address</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">phone</span>
                        <span className="text-gray-600">→ Phone Number</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">message</span>
                        <span className="text-gray-600">→ Message/Notes</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">5</Badge>
                  <div>
                    <h4 className="font-medium">Test Your Integration</h4>
                    <p className="text-sm text-gray-600">
                      Submit a test form to verify leads are being created in your CRM
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Troubleshooting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Form submits but no leads appear</h4>
                  <p className="text-sm text-gray-600">
                    Check that your form fields are named correctly (name, email, phone, message)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Webhook error in Elementor</h4>
                  <p className="text-sm text-gray-600">
                    Verify the webhook URL is correct and your website can reach our servers
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Use the Webhook Debugger</h4>
                  <p className="text-sm text-gray-600">
                    Go to the Webhook Debugger tab to test your integration and view logs
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://elementor.com/help/webhook/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Elementor Webhook Documentation
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
