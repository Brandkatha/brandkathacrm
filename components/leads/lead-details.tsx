'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Phone, MessageCircle, Mail, Calendar, User, MapPin, Clock, Edit, Plus } from 'lucide-react'
import { EditLeadDialog } from './edit-lead-dialog'
import { AddFollowupDialog } from '../followups/add-followup-dialog'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/utils/supabase/client'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  source: string
  status: string
  created_at: string
  updated_at: string
  note: string
}

interface Followup {
  id: string
  note: string
  status: string
  next_date: string
  created_at: string
}

interface LeadDetailsProps {
  lead: Lead
  followups: Followup[]
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

export function LeadDetails({ lead, followups }: LeadDetailsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [currentLead, setCurrentLead] = useState(lead)

  const handleWhatsAppClick = () => {
    if (currentLead.phone) {
      const message = encodeURIComponent(`Hi ${currentLead.name}, I hope you're doing well!`)
      const whatsappUrl = `https://wa.me/${currentLead.phone.replace(/[^0-9]/g, '')}?text=${message}`
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
    if (currentLead.phone) {
      window.location.href = `tel:${currentLead.phone}`
    } else {
      toast({
        title: 'No Phone Number',
        description: 'This lead does not have a phone number.',
        variant: 'destructive',
      })
    }
  }

  const handleEmailClick = () => {
    if (currentLead.email) {
      const subject = encodeURIComponent(`Following up on your inquiry`)
      const body = encodeURIComponent(`Hi ${currentLead.name},\n\nI hope this email finds you well.\n\nBest regards`)
      window.location.href = `mailto:${currentLead.email}?subject=${subject}&body=${body}`
    } else {
      toast({
        title: 'No Email Address',
        description: 'This lead does not have an email address.',
        variant: 'destructive',
      })
    }
  }

  const refreshData = () => {
    window.location.reload()
  }

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
            <h1 className="text-3xl font-bold">{currentLead.name}</h1>
            <p className="text-muted-foreground">Lead Details & History</p>
          </div>
        </div>
        <div className="flex gap-2">
          <EditLeadDialog lead={currentLead} onUpdate={refreshData}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Lead
            </Button>
          </EditLeadDialog>
          <AddFollowupDialog leadId={currentLead.id} leadName={currentLead.name} onAdd={refreshData}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Follow-up
            </Button>
          </AddFollowupDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Lead Information */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-lg font-semibold">{currentLead.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge className={statusColors[currentLead.status as keyof typeof statusColors]}>
                      {currentLead.status.charAt(0).toUpperCase() + currentLead.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg">{currentLead.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-lg">{currentLead.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Source</label>
                  <p className="text-lg capitalize">{currentLead.source}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-lg">{new Date(currentLead.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              {currentLead.note && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Note</label>
                  <p className="text-lg mt-1 p-3 bg-muted/50 rounded-lg">{currentLead.note}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Follow-ups History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Follow-ups History
              </CardTitle>
              <CardDescription>
                {followups.length} follow-up{followups.length !== 1 ? 's' : ''} recorded
              </CardDescription>
            </CardHeader>
            <CardContent>
              {followups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No follow-ups recorded yet</p>
                  <p className="text-sm">Add your first follow-up to start tracking interactions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {followups.map((followup, index) => (
                    <div key={followup.id} className="border border-border rounded-lg p-4 bg-card">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={followupStatusColors[followup.status as keyof typeof followupStatusColors]}>
                            {followup.status.charAt(0).toUpperCase() + followup.status.slice(1)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(followup.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {followup.next_date && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Next: {new Date(followup.next_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-card-foreground">{followup.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Contact this lead directly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={handleCallClick}
                disabled={!currentLead.phone}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call {currentLead.phone ? currentLead.phone : '(No phone)'}
              </Button>
              <Button 
                className="w-full justify-start bg-green-600 hover:bg-green-700 text-white" 
                onClick={handleWhatsAppClick}
                disabled={!currentLead.phone}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp {currentLead.phone ? '' : '(No phone)'}
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={handleEmailClick}
                disabled={!currentLead.email}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email {currentLead.email ? '' : '(No email)'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total Follow-ups:</span>
                <span className="text-sm">{followups.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Pending Follow-ups:</span>
                <span className="text-sm">
                  {followups.filter(f => f.status === 'pending').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Completed Follow-ups:</span>
                <span className="text-sm">
                  {followups.filter(f => f.status === 'completed').length}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm font-medium">Days since created:</span>
                <span className="text-sm">
                  {Math.floor((Date.now() - new Date(currentLead.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
