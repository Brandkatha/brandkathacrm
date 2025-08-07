'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, MessageSquare, Calendar } from 'lucide-react'

interface ReportsStatsProps {
  userId: string
}

export function ReportsStats({ userId }: ReportsStatsProps) {
  const [stats, setStats] = useState({
    totalLeads: 0,
    conversionRate: 0,
    totalTemplates: 0,
    pendingFollowups: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      // Get total leads
      const { data: totalLeads } = await supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)

      // Get converted leads
      const { data: convertedLeads } = await supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'converted')

      // Get total templates
      const { data: totalTemplates } = await supabase
        .from('message_templates')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)

      // Get pending followups
      const { data: pendingFollowups } = await supabase
        .from('followups')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'pending')

      const totalCount = totalLeads?.length || 0
      const convertedCount = convertedLeads?.length || 0
      const conversionRate = totalCount > 0 ? (convertedCount / totalCount) * 100 : 0

      setStats({
        totalLeads: totalCount,
        conversionRate: Math.round(conversionRate * 10) / 10,
        totalTemplates: totalTemplates?.length || 0,
        pendingFollowups: pendingFollowups?.length || 0,
      })
    }

    fetchStats()
  }, [userId, supabase])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalLeads}</div>
          <p className="text-xs text-muted-foreground">All time leads</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.conversionRate}%</div>
          <p className="text-xs text-muted-foreground">Leads to customers</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Templates</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalTemplates}</div>
          <p className="text-xs text-muted-foreground">Message templates</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingFollowups}</div>
          <p className="text-xs text-muted-foreground">Require attention</p>
        </CardContent>
      </Card>
    </div>
  )
}
