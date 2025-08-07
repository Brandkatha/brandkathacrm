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
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/utils/supabase/client'

interface WhatsAppIntegrationDialogProps {
  integration?: any
  children: React.ReactNode
  onUpdate: () => void
}

export function WhatsAppIntegrationDialog({ integration, children, onUpdate }: WhatsAppIntegrationDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    apiKey: integration?.config_data?.apiKey || '',
    phoneNumberId: integration?.config_data?.phoneNumberId || '',
    businessAccountId: integration?.config_data?.businessAccountId || '',
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
        apiKey: formData.apiKey,
        phoneNumberId: formData.phoneNumberId,
        businessAccountId: formData.businessAccountId,
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
            type: 'whatsapp',
            config_data: configData,
          })

        if (error) throw error
      }

      toast({
        title: 'Success',
        description: 'WhatsApp integration configured successfully',
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
          <DialogTitle>WhatsApp Business Integration</DialogTitle>
          <DialogDescription>
            Configure your WhatsApp Business API to send messages using templates.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key *</Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="Your WhatsApp Business API key"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phoneNumberId">Phone Number ID *</Label>
              <Input
                id="phoneNumberId"
                value={formData.phoneNumberId}
                onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                placeholder="Your WhatsApp phone number ID"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="businessAccountId">Business Account ID *</Label>
              <Input
                id="businessAccountId"
                value={formData.businessAccountId}
                onChange={(e) => setFormData({ ...formData, businessAccountId: e.target.value })}
                placeholder="Your WhatsApp Business account ID"
                required
              />
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
