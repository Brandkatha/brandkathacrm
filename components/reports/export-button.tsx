'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/utils/supabase/client'
import * as XLSX from 'xlsx'

interface ExportButtonProps {
  userId: string
  filters: any
}

export function ExportButton({ userId, filters }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleExport = async () => {
    setLoading(true)

    try {
      let query = supabase
        .from('leads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // Apply the same filters as the table
      if (filters.source !== 'all') {
        query = query.eq('source', filters.source)
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo + 'T23:59:59')
      }

      const { data: leads } = await query

      if (!leads || leads.length === 0) {
        toast({
          title: 'No Data',
          description: 'No leads found to export with the current filters',
          variant: 'destructive',
        })
        return
      }

      // Prepare data for export
      const exportData = leads.map(lead => ({
        Name: lead.name,
        Email: lead.email || '',
        Phone: lead.phone || '',
        Source: lead.source,
        Status: lead.status,
        'Created Date': new Date(lead.created_at).toLocaleDateString(),
        'Updated Date': new Date(lead.updated_at).toLocaleDateString(),
      }))

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)

      // Auto-size columns
      const colWidths = Object.keys(exportData[0]).map(key => ({
        wch: Math.max(key.length, ...exportData.map(row => String(row[key as keyof typeof row]).length))
      }))
      ws['!cols'] = colWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Leads Report')

      // Generate filename with current date and filters
      const filterSuffix = [
        filters.source !== 'all' ? filters.source : '',
        filters.status !== 'all' ? filters.status : '',
        filters.dateFrom ? `from-${filters.dateFrom}` : '',
        filters.dateTo ? `to-${filters.dateTo}` : ''
      ].filter(Boolean).join('-')
      
      const filename = `leads-report-${new Date().toISOString().split('T')[0]}${filterSuffix ? '-' + filterSuffix : ''}.xlsx`

      // Save file
      XLSX.writeFile(wb, filename)

      toast({
        title: 'Success',
        description: `${leads.length} leads exported successfully`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to export leads',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleExport} disabled={loading}>
      <Download className="h-4 w-4 mr-2" />
      {loading ? 'Exporting...' : 'Export to Excel'}
    </Button>
  )
}
