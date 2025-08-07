import { createClient } from '@/utils/supabase/server'
import { FollowupsTable } from '@/components/followups/followups-table'
import { AddFollowupDialog } from '@/components/followups/add-followup-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default async function FollowupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Follow-ups</h1>
          <p className="text-muted-foreground">Track and manage your lead follow-ups</p>
        </div>
        <AddFollowupDialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Follow-up
          </Button>
        </AddFollowupDialog>
      </div>

      <FollowupsTable userId={user.id} />
    </div>
  )
}
