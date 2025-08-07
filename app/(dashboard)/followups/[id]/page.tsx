import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { FollowupDetails } from '@/components/followups/followup-details'

interface FollowupPageProps {
  params: {
    id: string
  }
}

export default async function FollowupPage({ params }: FollowupPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get followup details with lead information
  const { data: followup } = await supabase
    .from('followups')
    .select(`
      *,
      leads (
        id,
        name,
        email,
        phone,
        status,
        source,
        created_at
      )
    `)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!followup) {
    notFound()
  }

  // Get all followups for this lead
  const { data: allFollowups } = await supabase
    .from('followups')
    .select('*')
    .eq('lead_id', followup.lead_id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <FollowupDetails followup={followup} allFollowups={allFollowups || []} />
}
