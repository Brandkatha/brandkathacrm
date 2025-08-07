import { createClient } from '@/utils/supabase/server'
import { LeadsTable } from '@/components/leads/leads-table'
import { AddLeadDialog } from '@/components/leads/add-lead-dialog'
import { ImportLeadsDialog } from '@/components/leads/import-leads-dialog'
import { Button } from '@/components/ui/button'
import { Plus, Upload } from 'lucide-react'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Manage your leads and track their progress</p>
        </div>
        <div className="flex gap-2">
          <ImportLeadsDialog>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </ImportLeadsDialog>
          <AddLeadDialog>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </AddLeadDialog>
        </div>
      </div>

      <LeadsTable userId={user.id} />
    </div>
  )
}
