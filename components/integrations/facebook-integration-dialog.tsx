'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/utils/supabase/client'

interface FacebookIntegrationDialogProps {
  integration?: any
  children: React.ReactNode
  onUpdate: () => void
}

export function FacebookIntegrationDialog({ integration, children, onUpdate }: FacebookIntegrationDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    accessToken: integration?.config_data?.accessToken || '',
    pageId: integration?.config_data?.pageId || '',
    formIds: integration?.config_data?.formIds || '',
  })
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const configData = {
        accessToken: formData.accessToken,
        pageId: formData.pageId,
        formIds: formData.formIds.split(',').map(id => id.trim()).filter(Boolean),
      }

      if (integration) {
        // Update existing integration
        const { error } = await supabase
          .from('integration_settings')
          .update({ config_data: configData })
          .eq('id', integration.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // Create new integration
        const { error } = await supabase
          .from('integration_settings')
          .insert({
            user_id: user.id,
            type: 'facebook',
            config_data: configData,
          })

        if (error) throw error
      }

      toast({
        title: 'Success',
        description: 'Facebook integration configured successfully',
      })

      setOpen(false)
      onUpdate()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Facebook Lead Ads Integration</DialogTitle>
          <DialogDescription>
            Configure your Facebook Lead Ads integration to automatically import leads.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="accessToken">Access Token *</Label>
              <Input
                id="accessToken"
                type="password"
                value={formData.accessToken}
                onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                placeholder="Your Facebook access token"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pageId">Page ID *</Label>
              <Input
                id="pageId"
                value={formData.pageId}
                onChange={(e) => setFormData({ ...formData, pageId: e.target.value })}
                placeholder="Your Facebook page ID"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="formIds">Form IDs</Label>
              <Textarea
                id="formIds"
                value={formData.formIds}
                onChange={(e) => setFormData({ ...formData, formIds: e.target.value })}
                placeholder="Comma-separated list of form IDs (optional)"
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to import leads from all forms on the page
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
