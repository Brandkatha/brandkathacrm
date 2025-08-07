'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { createClient } from '@/utils/supabase/client'

interface SourcesChartProps {
  userId: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function SourcesChart({ userId }: SourcesChartProps) {
  const [data, setData] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: leads } = await supabase
        .from('leads')
        .select('source')
        .eq('user_id', userId)

      if (leads) {
        // Group leads by source
        const groupedData = leads.reduce((acc: any, lead) => {
          const source = lead.source || 'unknown'
          acc[source] = (acc[source] || 0) + 1
          return acc
        }, {})

        // Convert to chart format
        const chartData = Object.entries(groupedData).map(([source, count]) => ({
          name: source.charAt(0).toUpperCase() + source.slice(1),
          value: count,
        }))

        setData(chartData)
      }
    }

    fetchData()
  }, [userId, supabase])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
