import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { LeadDetails } from '@/components/leads/lead-details'

interface LeadPageProps {
  params: {
    id: string
  }
}

export default async function LeadPage({ params }: LeadPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get lead details
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!lead) {
    notFound()
  }

  // Get follow-ups for this lead
  const { data: followups } = await supabase
    .from('followups')
    .select('*')
    .eq('lead_id', params.id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <LeadDetails lead={lead} followups={followups || []} />
}
