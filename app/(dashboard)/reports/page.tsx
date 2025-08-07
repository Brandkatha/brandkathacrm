'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ReportsFilters } from '@/components/reports/reports-filters'
import { ReportsTable } from '@/components/reports/reports-table'
import { ReportsStats } from '@/components/reports/reports-stats'
import { ExportButton } from '@/components/reports/export-button'
import { useEffect } from 'react'

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [filters, setFilters] = useState({
    source: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  })
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Analyze your leads and track performance</p>
        </div>
        <ExportButton userId={user.id} filters={filters} />
      </div>

      <ReportsStats userId={user.id} />
      <ReportsFilters onFiltersChange={setFilters} />
      <ReportsTable userId={user.id} filters={filters} />
    </div>
  )
}
