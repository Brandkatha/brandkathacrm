import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, UserPlus, TrendingUp, Calendar, MessageSquare, Zap, FileText, BarChart3, Plus, Upload } from 'lucide-react'
import { LeadsChart } from '@/components/dashboard/leads-chart'
import { SourcesChart } from '@/components/dashboard/sources-chart'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get dashboard stats
  const { data: totalLeads } = await supabase
    .from('leads')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)

  const { data: weekLeads } = await supabase
    .from('leads')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  const { data: convertedLeads } = await supabase
    .from('leads')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('status', 'converted')

  const { data: pendingFollowups } = await supabase
    .from('followups')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('status', 'pending')

  const { data: templates } = await supabase
    .from('message_templates')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)

  const { data: integrations } = await supabase
    .from('integration_settings')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)

  const totalCount = totalLeads?.length || 0
  const weekCount = weekLeads?.length || 0
  const convertedCount = convertedLeads?.length || 0
  const followupCount = pendingFollowups?.length || 0
  const templateCount = templates?.length || 0
  const integrationCount = integrations?.length || 0
  const conversionRate = totalCount > 0 ? ((convertedCount / totalCount) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold">Welcome back, {profile?.name || 'User'}! 👋</h1>
        <p className="text-blue-100 dark:text-blue-200 mt-2">Here's your CRM overview and quick actions to get started.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/leads">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Add New Lead</CardTitle>
              <Plus className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Create or import leads</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/templates">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Message Templates</CardTitle>
              <MessageSquare className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Create email & WhatsApp templates</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/integrations">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Integrations</CardTitle>
              <Zap className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Connect Facebook & Elementor</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">View Reports</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Analytics & export data</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              {weekCount > 0 && <span className="text-green-600">+{weekCount} this week</span>}
              {weekCount === 0 && "No new leads this week"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {convertedCount} of {totalCount} leads converted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Follow-ups</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{followupCount}</div>
            <p className="text-xs text-muted-foreground">
              {followupCount > 0 ? "Require attention" : "All caught up!"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates & Integrations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templateCount + integrationCount}</div>
            <p className="text-xs text-muted-foreground">
              {templateCount} templates, {integrationCount} integrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lead Management
            </CardTitle>
            <CardDescription>Comprehensive lead tracking and management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Manual lead entry</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Excel import/export</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Status tracking</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Advanced filtering</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <Link href="/leads">
              <Button className="w-full mt-3">
                <Users className="h-4 w-4 mr-2" />
                Manage Leads
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messaging & Templates
            </CardTitle>
            <CardDescription>Email and WhatsApp template management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Email templates</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ WhatsApp templates</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Variable substitution</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Template library</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <Link href="/templates">
              <Button className="w-full mt-3">
                <MessageSquare className="h-4 w-4 mr-2" />
                Manage Templates
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Integrations Hub
            </CardTitle>
            <CardDescription>Connect with external services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">🔵 Facebook Lead Ads</span>
              <Badge variant={integrationCount > 0 ? "default" : "outline"}>
                {integrationCount > 0 ? "Connected" : "Available"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">⚡ Elementor Forms</span>
              <Badge variant="outline">Available</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">💬 WhatsApp Business</span>
              <Badge variant="outline">Available</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">📧 Email SMTP</span>
              <Badge variant="outline">Available</Badge>
            </div>
            <Link href="/integrations">
              <Button className="w-full mt-3">
                <Zap className="h-4 w-4 mr-2" />
                Setup Integrations
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics & Reports
            </CardTitle>
            <CardDescription>Track performance and export data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Lead analytics</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Conversion tracking</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Source analysis</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Excel export</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <Link href="/reports">
              <Button className="w-full mt-3">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {totalCount > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Leads Over Time</CardTitle>
              <CardDescription>Daily lead acquisition for the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <LeadsChart userId={user.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead Sources</CardTitle>
              <CardDescription>Distribution of lead sources</CardDescription>
            </CardHeader>
            <CardContent>
              <SourcesChart userId={user.id} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Getting Started Guide */}
      {totalCount === 0 && (
        <Card className="border-dashed border-2 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🚀 Getting Started with Your CRM
            </CardTitle>
            <CardDescription>
              Welcome to your new CRM! Here's how to get started:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold">1. Add Your First Lead</h4>
                <p className="text-sm text-muted-foreground">Start by adding leads manually or importing from Excel</p>
                <Link href="/leads">
                  <Button size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lead
                  </Button>
                </Link>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">2. Create Templates</h4>
                <p className="text-sm text-muted-foreground">Build reusable email and WhatsApp message templates</p>
                <Link href="/templates">
                  <Button size="sm" variant="outline" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </Link>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">3. Setup Integrations</h4>
                <p className="text-sm text-muted-foreground">Connect Facebook Lead Ads and Elementor forms</p>
                <Link href="/integrations">
                  <Button size="sm" variant="outline" className="w-full">
                    <Zap className="h-4 w-4 mr-2" />
                    Connect Services
                  </Button>
                </Link>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">4. Track Follow-ups</h4>
                <p className="text-sm text-muted-foreground">Schedule and manage lead follow-up tasks</p>
                <Link href="/followups">
                  <Button size="sm" variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Manage Follow-ups
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
