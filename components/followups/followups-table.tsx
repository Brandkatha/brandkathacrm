'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditFollowupDialog } from './edit-followup-dialog'
import { Eye } from 'lucide-react'
import Link from 'next/link'

interface Followup {
  id: string
  lead_id: string
  note: string
  status: string
  next_date: string
  created_at: string
  leads: {
    id: string
    name: string
    email: string
  }
}

interface FollowupsTableProps {
  userId: string
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export function FollowupsTable({ userId }: FollowupsTableProps) {
  const [followups, setFollowups] = useState<Followup[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchFollowups = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('followups')
      .select(`
        *,
        leads (
          id,
          name,
          email
        )
      `)
      .eq('user_id', userId)
      .order('next_date', { ascending: true })

    setFollowups(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchFollowups()
  }, [userId])

  const handleStatusUpdate = async (followupId: string, newStatus: string) => {
    const { error } = await supabase
      .from('followups')
      .update({ status: newStatus })
      .eq('id', followupId)
      .eq('user_id', userId)

    if (!error) {
      fetchFollowups()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Follow-ups</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading follow-ups...</div>
        ) : followups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No follow-ups found. Add your first follow-up to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Next Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {followups.map((followup) => (
                <TableRow key={followup.id}>
                  <TableCell>
                    <div>
                      <Link 
                        href={`/leads/${followup.leads?.id}`}
                        className="font-medium hover:text-blue-600 hover:underline cursor-pointer"
                      >
                        {followup.leads?.name}
                      </Link>
                      <div className="text-sm text-muted-foreground">{followup.leads?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    <Link 
                      href={`/followups/${followup.id}`}
                      className="hover:text-blue-600 hover:underline cursor-pointer"
                    >
                      {followup.note}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {followup.next_date ? new Date(followup.next_date).toLocaleDateString() : 'Not set'}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[followup.status as keyof typeof statusColors]}>
                      {followup.status.charAt(0).toUpperCase() + followup.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(followup.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/followups/${followup.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <EditFollowupDialog followup={followup} onUpdate={fetchFollowups}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </EditFollowupDialog>
                      {followup.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(followup.id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
