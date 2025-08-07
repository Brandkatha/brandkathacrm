'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@/utils/supabase/client'

interface LeadsChartProps {
  userId: string
}

export function LeadsChart({ userId }: LeadsChartProps) {
  const [data, setData] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      const { data: leads } = await supabase
        .from('leads')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at')

      if (leads) {
        // Group leads by date
        const groupedData = leads.reduce((acc: any, lead) => {
          const date = new Date(lead.created_at).toLocaleDateString()
          acc[date] = (acc[date] || 0) + 1
          return acc
        }, {})

        // Convert to chart format
        const chartData = Object.entries(groupedData).map(([date, count]) => ({
          date,
          leads: count,
        }))

        setData(chartData)
      }
    }

    fetchData()
  }, [userId, supabase])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="leads" stroke="#8884d8" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}
