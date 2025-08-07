'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Phone, MessageCircle, Mail, Calendar, User, Clock, Edit, Plus, CheckCircle } from 'lucide-react'
import { EditFollowupDialog } from './edit-followup-dialog'
import { AddFollowupDialog } from './add-followup-dialog'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  source: string
  status: string
  created_at: string
}

interface Followup {
  id: string
  lead_id: string
  note: string
  status: string
  next_date: string
  created_at: string
  leads?: Lead
}

interface FollowupDetailsProps {
  followup: Followup
  allFollowups: Followup[]
}

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  converted: 'bg-purple-100 text-purple-800',
  lost: 'bg-red-100 text-red-800',
}

const followupStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export function FollowupDetails({ followup, allFollowups }: FollowupDetailsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [currentFollowup, setCurrentFollowup] = useState(followup)
  const lead = followup.leads

  const handleWhatsAppClick = () => {
    if (lead?.phone) {
      const message = encodeURIComponent(`Hi ${lead.name}, following up on our previous conversation.`)
      const whatsappUrl = `https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${message}`
      window.open(whatsappUrl, '_blank')
    } else {
      toast({
        title: 'No Phone Number',
        description: 'This lead does not have a phone number.',
        variant: 'destructive',
      })
    }
  }

  const handleCallClick = () => {
    if (lead?.phone) {
      window.location.href = `tel:${lead.phone}`
    } else {
      toast({
        title: 'No Phone Number',
        description: 'This lead does not have a phone number.',
        variant: 'destructive',
      })
    }
  }

  const handleEmailClick = () => {
    if (lead?.email) {
      const subject = encodeURIComponent(`Follow-up: ${currentFollowup.note.substring(0, 50)}...`)
      const body = encodeURIComponent(`Hi ${lead.name},\n\nI'm following up on: ${currentFollowup.note}\n\nBest regards`)
      window.location.href = `mailto:${lead.email}?subject=${subject}&body=${body}`
    } else {
      toast({
        title: 'No Email Address',
        description: 'This lead does not have an email address.',
        variant: 'destructive',
      })
    }
  }

  const handleMarkComplete = async () => {
    const { error } = await supabase
      .from('followups')
      .update({ status: 'completed' })
      .eq('id', currentFollowup.id)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update follow-up status',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Follow-up marked as completed',
      })
      setCurrentFollowup({ ...currentFollowup, status: 'completed' })
    }
  }

  const refreshData = () => {
    window.location.reload()
  }

  if (!lead) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Follow-up Details</h1>
            <p className="text-muted-foreground">
              For <Link href={`/leads/${lead.id}`} className="text-blue-600 hover:underline">{lead.name}</Link>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {currentFollowup.status === 'pending' && (
            <Button variant="outline" onClick={handleMarkComplete}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          )}
          <EditFollowupDialog followup={currentFollowup} onUpdate={refreshData}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Follow-up
            </Button>
          </EditFollowupDialog>
          <AddFollowupDialog leadId={lead.id} leadName={lead.name} onAdd={refreshData}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Follow-up
            </Button>
          </AddFollowupDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Follow-up Information */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Follow-up Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge className={followupStatusColors[currentFollowup.status as keyof typeof followupStatusColors]}>
                      {currentFollowup.status.charAt(0).toUpperCase() + currentFollowup.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Note</label>
                  <p className="text-lg mt-1 p-3 bg-muted/50 rounded-lg">{currentFollowup.note}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="text-lg">{new Date(currentFollowup.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Next Date</label>
                    <p className="text-lg">
                      {currentFollowup.next_date 
                        ? new Date(currentFollowup.next_date).toLocaleDateString()
                        : 'Not set'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lead Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Lead Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-semibold">
                    <Link href={`/leads/${lead.id}`} className="text-blue-600 hover:underline">
                      {lead.name}
                    </Link>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge className={statusColors[lead.status as keyof typeof statusColors]}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg">{lead.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-lg">{lead.phone || 'Not provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* All Follow-ups for this Lead */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                All Follow-ups for {lead.name}
              </CardTitle>
              <CardDescription>
                {allFollowups.length} follow-up{allFollowups.length !== 1 ? 's' : ''} total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allFollowups.map((f) => (
                  <div 
                    key={f.id} 
                    className={`border border-border rounded-lg p-4 bg-card ${f.id === currentFollowup.id ? 'border-primary bg-primary/5' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={followupStatusColors[f.status as keyof typeof followupStatusColors]}>
                          {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(f.created_at).toLocaleDateString()}
                        </span>
                        {f.id === currentFollowup.id && (
                          <Badge variant="outline">Current</Badge>
                        )}
                      </div>
                      {f.next_date && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Next: {new Date(f.next_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-card-foreground">{f.note}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Lead</CardTitle>
              <CardDescription>Reach out to {lead.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={handleCallClick}
                disabled={!lead.phone}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call {lead.phone ? lead.phone : '(No phone)'}
              </Button>
              <Button 
                className="w-full justify-start bg-green-600 hover:bg-green-700 text-white" 
                onClick={handleWhatsAppClick}
                disabled={!lead.phone}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp {lead.phone ? '' : '(No phone)'}
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={handleEmailClick}
                disabled={!lead.email}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email {lead.email ? '' : '(No email)'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Follow-up Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total Follow-ups:</span>
                <span className="text-sm">{allFollowups.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Pending:</span>
                <span className="text-sm">
                  {allFollowups.filter(f => f.status === 'pending').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Completed:</span>
                <span className="text-sm">
                  {allFollowups.filter(f => f.status === 'completed').length}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm font-medium">Days since lead created:</span>
                <span className="text-sm">
                  {Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
