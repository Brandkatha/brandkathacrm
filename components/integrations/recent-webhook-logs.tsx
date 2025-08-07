'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { RefreshCw, ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, Globe, Facebook, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WebhookLog {
  id: string
  webhook_type: string
  request_method: string
  response_status: number
  processed_successfully: boolean
  error_message: string | null
  request_body: any
  response_body: any
  ip_address: string
  user_agent: string
  created_at: string
}

interface RecentWebhookLogsProps {
  userId: string
}

export function RecentWebhookLogs({ userId }: RecentWebhookLogsProps) {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const supabase = createClient()

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('webhook_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (fetchError) {
        console.error('Error fetching webhook logs:', fetchError)
        setError('Failed to load webhook logs')
        return
      }

      setLogs(data || [])
    } catch (err) {
      console.error('Error fetching logs:', err)
      setError('Failed to load webhook logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [userId])

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

  const getStatusBadge = (log: WebhookLog) => {
    if (log.processed_successfully) {
      return <Badge className="bg-green-100 text-green-800">Success</Badge>
    } else if (log.response_status >= 400 && log.response_status < 500) {
      return <Badge variant="destructive">Client Error</Badge>
    } else if (log.response_status >= 500) {
      return <Badge variant="destructive">Server Error</Badge>
    } else {
      return <Badge variant="secondary">Failed</Badge>
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const refreshLogs = () => {
    fetchLogs()
    toast({
      title: "Refreshed",
      description: "Webhook logs have been refreshed",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Webhook Activity</CardTitle>
          <CardDescription>Loading webhook logs...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Webhook Activity</CardTitle>
          <CardDescription>View recent webhook requests and responses</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLogs}
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
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
              View recent webhook requests and responses (last 20)
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refreshLogs}>
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
              No webhook activity yet. Submit a form or test your webhook to see logs here.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <Collapsible key={log.id}>
                <Card className="border-l-4 border-l-blue-500">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getWebhookIcon(log.webhook_type)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize">
                                {log.webhook_type} Webhook
                              </span>
                              {getStatusBadge(log)}
                              <Badge variant="outline" className="text-xs">
                                {log.response_status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatTimestamp(log.created_at)} • {log.ip_address}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {log.processed_successfully ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          {expandedLogs.has(log.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      {/* Error Message */}
                      {log.error_message && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Error:</strong> {log.error_message}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Request Details */}
                      <div>
                        <h4 className="font-medium mb-2">Request Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Method:</span>
                            <Badge variant="outline" className="ml-2">
                              {log.request_method}
                            </Badge>
                          </div>
                          <div>
                            <span className="font-medium">Status:</span>
                            <Badge variant="outline" className="ml-2">
                              {log.response_status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Request Body */}
                      {log.request_body && (
                        <div>
                          <h4 className="font-medium mb-2">Request Body</h4>
                          <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                            <code>{JSON.stringify(log.request_body, null, 2)}</code>
                          </pre>
                        </div>
                      )}

                      {/* Response Body */}
                      {log.response_body && (
                        <div>
                          <h4 className="font-medium mb-2">Response Body</h4>
                          <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                            <code>{JSON.stringify(log.response_body, null, 2)}</code>
                          </pre>
                        </div>
                      )}

                      {/* User Agent */}
                      {log.user_agent && (
                        <div>
                          <h4 className="font-medium mb-2">User Agent</h4>
                          <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                            {log.user_agent}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
