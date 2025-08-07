import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/utils/supabase/server'
import { Badge } from '@/components/ui/badge'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-card px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex-1 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-card-foreground">CRM Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            ✅ All Systems Active
          </Badge>
          <span className="text-sm text-muted-foreground">
            {user?.email}
          </span>
        </div>
      </div>
    </header>
  )
}
