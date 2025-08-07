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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/utils/supabase/client'

interface EmailIntegrationDialogProps {
  integration?: any
  children: React.ReactNode
  onUpdate: () => void
}

export function EmailIntegrationDialog({ integration, children, onUpdate }: EmailIntegrationDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    smtpHost: integration?.config_data?.smtpHost || '',
    smtpPort: integration?.config_data?.smtpPort || '587',
    smtpUser: integration?.config_data?.smtpUser || '',
    smtpPassword: integration?.config_data?.smtpPassword || '',
    fromEmail: integration?.config_data?.fromEmail || '',
    fromName: integration?.config_data?.fromName || '',
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
        smtpHost: formData.smtpHost,
        smtpPort: parseInt(formData.smtpPort),
        smtpUser: formData.smtpUser,
        smtpPassword: formData.smtpPassword,
        fromEmail: formData.fromEmail,
        fromName: formData.fromName,
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
            type: 'email',
            config_data: configData,
          })

        if (error) throw error
      }

      toast({
        title: 'Success',
        description: 'Email integration configured successfully',
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
          <DialogTitle>Email Service Integration</DialogTitle>
          <DialogDescription>
            Configure your SMTP settings to send emails through your CRM.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="smtpHost">SMTP Host *</Label>
              <Input
                id="smtpHost"
                value={formData.smtpHost}
                onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="smtpPort">SMTP Port *</Label>
              <Select
                value={formData.smtpPort}
                onValueChange={(value) => setFormData({ ...formData, smtpPort: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 (Non-encrypted)</SelectItem>
                  <SelectItem value="587">587 (TLS)</SelectItem>
                  <SelectItem value="465">465 (SSL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="smtpUser">SMTP Username *</Label>
              <Input
                id="smtpUser"
                value={formData.smtpUser}
                onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                placeholder="your-email@gmail.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="smtpPassword">SMTP Password *</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={formData.smtpPassword}
                onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                placeholder="Your email password or app password"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fromEmail">From Email *</Label>
              <Input
                id="fromEmail"
                type="email"
                value={formData.fromEmail}
                onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                placeholder="noreply@yourcompany.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fromName">From Name *</Label>
              <Input
                id="fromName"
                value={formData.fromName}
                onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                placeholder="Your Company Name"
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
