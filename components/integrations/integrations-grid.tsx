'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Facebook, Zap, MessageCircle, Mail, Info } from 'lucide-react'
import { FacebookIntegrationDialog } from './facebook-integration-dialog'
import { ElementorIntegrationDialog } from './elementor-integration-dialog'
import { WhatsAppIntegrationDialog } from './whatsapp-integration-dialog'
import { EmailIntegrationDialog } from './email-integration-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Integration {
  id: string
  type: string
  config_data: any
  created_at: string
}

interface IntegrationsGridProps {
  userId: string
}

export function IntegrationsGrid({ userId }: IntegrationsGridProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchIntegrations = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('integration_settings')
      .select('*')
      .eq('user_id', userId)

    setIntegrations(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchIntegrations()
  }, [userId])

  const getIntegrationStatus = (type: string) => {
    return integrations.find(integration => integration.type === type)
  }

  const getSetupInstructions = (type: string) => {
    switch (type) {
      case 'facebook':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Facebook Lead Ads Setup</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to Facebook Business Manager</li>
                <li>Navigate to Business Settings → System Users</li>
                <li>Create a new system user or select existing one</li>
                <li>Generate an access token with 'leads_retrieval' permission</li>
                <li>Get your Facebook Page ID from your page settings</li>
                <li>Copy the Form IDs from your lead ad forms (optional)</li>
              </ol>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <p className="text-sm"><strong>Note:</strong> This integration automatically imports leads from your Facebook Lead Ads into your CRM.</p>
            </div>
          </div>
        )
      case 'elementor':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Elementor Forms Setup</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Copy the webhook URL from the integration dialog</li>
                <li>In WordPress, edit your Elementor form</li>
                <li>Go to Actions After Submit → Add Action → Webhook</li>
                <li>Paste the webhook URL in the Webhook URL field</li>
                <li>Set Method to POST</li>
                <li>Add the webhook secret if you configured one</li>
                <li>Save your form</li>
              </ol>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg">
              <p className="text-sm"><strong>How it works:</strong> When someone submits your Elementor form, the data is automatically sent to your CRM as a new lead.</p>
            </div>
          </div>
        )
      case 'whatsapp':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">WhatsApp Business API Setup</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Sign up for WhatsApp Business API</li>
                <li>Get your API access token from Meta Business</li>
                <li>Find your Phone Number ID in the API dashboard</li>
                <li>Get your Business Account ID from WhatsApp Manager</li>
                <li>Create message templates in WhatsApp Manager</li>
                <li>Wait for template approval</li>
              </ol>
            </div>
            <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
              <p className="text-sm"><strong>Usage:</strong> Send WhatsApp messages to leads using approved templates directly from the CRM.</p>
            </div>
          </div>
        )
      case 'email':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Email Service Setup</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Choose your email provider (Gmail, Outlook, etc.)</li>
                <li>Enable 2-factor authentication</li>
                <li>Generate an app-specific password</li>
                <li>Get SMTP settings from your provider</li>
                <li>Configure the integration with your credentials</li>
                <li>Test the connection</li>
              </ol>
            </div>
            <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
              <p className="text-sm"><strong>Common SMTP Settings:</strong><br/>
              Gmail: smtp.gmail.com:587<br/>
              Outlook: smtp-mail.outlook.com:587</p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const HelpDialog = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title} - Setup Guide</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )

  const integrationCards = [
    {
      type: 'facebook',
      title: 'Facebook Lead Ads',
      description: 'Automatically import leads from Facebook Lead Ads',
      icon: Facebook,
      color: 'text-blue-600',
      dialog: FacebookIntegrationDialog,
    },
    {
      type: 'elementor',
      title: 'Elementor Forms',
      description: 'Receive leads from Elementor form submissions',
      icon: Zap,
      color: 'text-purple-600',
      dialog: ElementorIntegrationDialog,
    },
    {
      type: 'whatsapp',
      title: 'WhatsApp Business',
      description: 'Send WhatsApp messages using templates',
      icon: MessageCircle,
      color: 'text-green-600',
      dialog: WhatsAppIntegrationDialog,
    },
    {
      type: 'email',
      title: 'Email Service',
      description: 'Configure SMTP settings for email campaigns',
      icon: Mail,
      color: 'text-red-600',
      dialog: EmailIntegrationDialog,
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {integrationCards.map((card) => {
        const integration = getIntegrationStatus(card.type)
        const isConnected = !!integration
        const DialogComponent = card.dialog

        return (
          <Card key={card.type}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <card.icon className={`h-8 w-8 ${card.color}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{card.title}</CardTitle>
                      <HelpDialog title={card.title}>
                        {getSetupInstructions(card.type)}
                      </HelpDialog>
                    </div>
                    <CardDescription>{card.description}</CardDescription>
                  </div>
                </div>
                <Badge variant={isConnected ? 'default' : 'secondary'}>
                  {isConnected ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {isConnected
                    ? `Connected on ${new Date(integration.created_at).toLocaleDateString()}`
                    : 'Click to configure this integration'}
                </div>
                <DialogComponent integration={integration} onUpdate={fetchIntegrations}>
                  <Button variant={isConnected ? 'outline' : 'default'}>
                    {isConnected ? 'Configure' : 'Connect'}
                  </Button>
                </DialogComponent>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
