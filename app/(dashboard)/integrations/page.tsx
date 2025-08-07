'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Settings, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react'
import { WebhookUrlCard } from '@/components/integrations/webhook-url-card'
import { WebhookDebugger } from '@/components/integrations/webhook-debugger'
import { RecentWebhookLogs } from '@/components/integrations/recent-webhook-logs'
import { EmailIntegrationDialog } from '@/components/integrations/email-integration-dialog'
import { FacebookIntegrationDialog } from '@/components/integrations/facebook-integration-dialog'
import { WhatsAppIntegrationDialog } from '@/components/integrations/whatsapp-integration-dialog'
import { ElementorIntegrationDialog } from '@/components/integrations/elementor-integration-dialog'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  status: 'connected' | 'disconnected' | 'error'
  type: 'email' | 'social' | 'form' | 'crm'
  webhookUrl?: string
  platform?: 'elementor' | 'facebook' | 'whatsapp' | 'email'
}

export default function IntegrationsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [facebookDialogOpen, setFacebookDialogOpen] = useState(false)
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  const [elementorDialogOpen, setElementorDialogOpen] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          console.error('Error getting user:', error)
          toast({
            title: "Authentication Error",
            description: "Please log in to view integrations",
            variant: "destructive"
          })
        } else {
          setUser(user)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [supabase, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading integrations...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access integrations.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const elementorWebhookUrl = `${baseUrl}/api/webhooks/elementor/${user.id}`
  const facebookWebhookUrl = `${baseUrl}/api/webhooks/facebook/${user.id}`

  const integrations: Integration[] = [
    {
      id: 'elementor',
      name: 'Elementor Forms',
      description: 'Capture leads from Elementor form submissions',
      icon: <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">E</div>,
      status: 'connected',
      type: 'form',
      webhookUrl: elementorWebhookUrl,
      platform: 'elementor'
    },
    {
      id: 'facebook',
      name: 'Facebook Lead Ads',
      description: 'Import leads from Facebook advertising campaigns',
      icon: <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">f</div>,
      status: 'connected',
      type: 'social',
      webhookUrl: facebookWebhookUrl,
      platform: 'facebook'
    },
    {
      id: 'email',
      name: 'Email Marketing',
      description: 'Connect with email marketing platforms',
      icon: <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold">@</div>,
      status: 'disconnected',
      type: 'email'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'Send messages via WhatsApp Business API',
      icon: <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-white font-bold">W</div>,
      status: 'disconnected',
      type: 'social'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Connected
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Error
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            Not Connected
          </Badge>
        )
    }
  }

  const handleIntegrationClick = (integration: Integration) => {
    switch (integration.id) {
      case 'email':
        setEmailDialogOpen(true)
        break
      case 'facebook':
        setFacebookDialogOpen(true)
        break
      case 'whatsapp':
        setWhatsappDialogOpen(true)
        break
      case 'elementor':
        setElementorDialogOpen(true)
        break
      default:
        toast({
          title: "Coming Soon",
          description: `${integration.name} integration is coming soon!`,
        })
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground mt-2">
            Connect your CRM with external services and platforms
          </p>
        </div>
        <Button asChild>
          <a href="/integrations/setup-guide" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Setup Guide
          </a>
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="debugger">Debugger</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <Card key={integration.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {integration.icon}
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {integration.description}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(integration.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {integration.type}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleIntegrationClick(integration)}
                    >
                      {integration.status === 'connected' ? (
                        <>
                          <Settings className="mr-2 h-4 w-4" />
                          Configure
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WebhookUrlCard
              title="Elementor Forms"
              description="Webhook endpoint for Elementor form submissions"
              webhookUrl={elementorWebhookUrl}
              platform="elementor"
            />
            <WebhookUrlCard
              title="Facebook Lead Ads"
              description="Webhook endpoint for Facebook lead advertisements"
              webhookUrl={facebookWebhookUrl}
              platform="facebook"
            />
          </div>
        </TabsContent>

        <TabsContent value="debugger" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WebhookDebugger
              webhookUrl={elementorWebhookUrl}
              platform="elementor"
            />
            <WebhookDebugger
              webhookUrl={facebookWebhookUrl}
              platform="facebook"
            />
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <RecentWebhookLogs />
        </TabsContent>
      </Tabs>

      {/* Integration Dialogs */}
      <EmailIntegrationDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
      />
      <FacebookIntegrationDialog
        open={facebookDialogOpen}
        onOpenChange={setFacebookDialogOpen}
      />
      <WhatsAppIntegrationDialog
        open={whatsappDialogOpen}
        onOpenChange={setWhatsappDialogOpen}
      />
      <ElementorIntegrationDialog
        open={elementorDialogOpen}
        onOpenChange={setElementorDialogOpen}
      />
    </div>
  )
}
