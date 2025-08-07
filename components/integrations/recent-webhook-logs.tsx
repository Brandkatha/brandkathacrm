'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { RefreshCw, ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, User, Globe, Facebook } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/utils/supabase/client'

interface WebhookLog {
  id: string
  user_id: string
  webhook_type: string
  request_method: string
  request_headers: any
  request_body: any
  response_status: number
  response_body: any
  ip_address: string
  user_agent: string
  processed_successfully: boolean
  error_message: string | null
  created_at: string
}

export function RecentWebhookLogs() {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const supabase = createClient()

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view webhook logs",
          variant: "destructive"
        })
        return
      }

      const { data, error } = await supabase
        .from('webhook_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching webhook logs:', error)
        toast({
          title: "Error",
          description: "Failed to fetch webhook logs",
          variant: "destructive"
        })
      } else {
        setLogs(data || [])
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast({
        title: "Error",
        description: "Failed to fetch webhook logs",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const getWebhookIcon = (type: string) => {
    switch (type) {
      case 'elementor':
        return <Globe className="h-4 w-4 text-blue-600" />
      case 'facebook':
        return <Facebook className="h-4 w-4 text-blue-600" />
      default:
        return <Globe className="h-4 w-4 text-gray-600" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2)
    } catch {
      return String(obj)
    }
  }

  const getStatusBadge = (log: WebhookLog) => {
    if (log.processed_successfully) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="mr-1 h-3 w-3" />
          Success
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          Failed
        </Badge>
      )
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Webhook Activity</CardTitle>
          <CardDescription>Loading webhook logs...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Webhook Activity</CardTitle>
            <CardDescription>
              Monitor incoming webhook requests and their processing status
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              No webhook requests found. Test your webhook endpoints or wait for form submissions to see activity here.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getWebhookIcon(log.webhook_type)}
                    <span className="font-medium capitalize">{log.webhook_type}</span>
                    <Badge variant="outline">{log.request_method}</Badge>
                    {getStatusBadge(log)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(log.created_at)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span className="font-medium">Status:</span> {log.response_status}
                  </div>
                  <div>
                    <span className="font-medium">IP:</span> {log.ip_address}
                  </div>
                </div>

                {log.error_message && (
                  <Alert className="mb-3">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Error:</strong> {log.error_message}
                    </AlertDescription>
                  </Alert>
                )}

                <Collapsible 
                  open={expandedLogs.has(log.id)} 
                  onOpenChange={() => toggleLogExpansion(log.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      <span>View Details</span>
                      {expandedLogs.has(log.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Request Body:</h4>
                        <pre className="p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                          {formatJson(log.request_body)}
                        </pre>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Response Body:</h4>
                        <pre className="p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                          {formatJson(log.response_body)}
                        </pre>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Request Headers:</h4>
                      <pre className="p-2 bg-muted rounded text-xs overflow-auto max-h-24">
                        {formatJson(log.request_headers)}
                      </pre>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <div><strong>User Agent:</strong> {log.user_agent}</div>
                      <div><strong>Full Timestamp:</strong> {log.created_at}</div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
