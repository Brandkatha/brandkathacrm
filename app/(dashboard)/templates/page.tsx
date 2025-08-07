import { createClient } from '@/utils/supabase/server'
import { TemplatesTable } from '@/components/templates/templates-table'
import { AddTemplateDialog } from '@/components/templates/add-template-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Message Templates</h1>
          <p className="text-muted-foreground">Create reusable email and WhatsApp templates</p>
        </div>
        <AddTemplateDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </AddTemplateDialog>
      </div>

      <TemplatesTable userId={user.id} />
    </div>
  )
}
