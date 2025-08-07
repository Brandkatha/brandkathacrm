'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { WebhookUrlCard } from '@/components/integrations/webhook-url-card'
import { WebhookDebugger } from '@/components/integrations/webhook-debugger'
import { RecentWebhookLogs } from '@/components/integrations/recent-webhook-logs'
import { ElementorSetupGuide } from '@/components/integrations/elementor-setup-guide'
import { useToast } from '@/hooks/use-toast'

interface Profile {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

export default function IntegrationsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const { toast } = useToast()
  const supabase = createClient()

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('User auth error:', userError)
        setError(`Authentication error: ${userError.message}`)
        return
      }

      if (!currentUser) {
        setError('No authenticated user found')
        return
      }

      setUser(currentUser)
      console.log('User loaded:', currentUser.email)

      // Try to get profile, but don't fail if it doesn't exist
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('Profile loading error:', profileError)
          // Create a fallback profile from user data
          const fallbackProfile: Profile = {
            id: currentUser.id,
            email: currentUser.email || '',
            full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
            created_at: currentUser.created_at
          }
          setProfile(fallbackProfile)
        } else if (profileData) {
          setProfile(profileData)
          console.log('Profile loaded:', profileData.email)
        } else {
          // No profile found, create fallback
          const fallbackProfile: Profile = {
            id: currentUser.id,
            email: currentUser.email || '',
            full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
            created_at: currentUser.created_at
          }
          setProfile(fallbackProfile)
        }
      } catch (profileError) {
        console.warn('Profile fetch failed, using fallback:', profileError)
        // Create fallback profile
        const fallbackProfile: Profile = {
          id: currentUser.id,
          email: currentUser.email || '',
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
          created_at: currentUser.created_at
        }
        setProfile(fallbackProfile)
      }

    } catch (error) {
      console.error('Error loading user data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    loadUserData()
  }

  useEffect(() => {
    loadUserData()
  }, [retryCount])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading integrations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Authentication Error
            </CardTitle>
            <CardDescription>
              There was a problem loading your account information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                {error}
              </CardDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={handleRetry} variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button 
                onClick={() => window.location.href = '/login'} 
                className="flex-1"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to access integrations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/login'} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const elementorWebhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-app.vercel.app'}/api/webhooks/elementor/${user.id}`
  const facebookWebhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-app.vercel.app'}/api/webhooks/facebook/${user.id}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your external services to automatically capture leads
        </p>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="webhooks">Webhook URLs</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
          <TabsTrigger value="debugger">Debugger</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <WebhookUrlCard
              title="Elementor Forms"
              description="Connect your Elementor forms to automatically capture leads"
              webhookUrl={elementorWebhookUrl}
              platform="elementor"
            />
            <WebhookUrlCard
              title="Facebook Lead Ads"
              description="Connect Facebook Lead Ads to capture leads automatically"
              webhookUrl={facebookWebhookUrl}
              platform="facebook"
            />
          </div>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <ElementorSetupGuide webhookUrl={elementorWebhookUrl} />
        </TabsContent>

        <TabsContent value="debugger" className="space-y-6">
          <WebhookDebugger 
            elementorUrl={elementorWebhookUrl}
            facebookUrl={facebookWebhookUrl}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <RecentWebhookLogs userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
