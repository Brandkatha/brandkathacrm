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
import { Mail, MessageCircle, Edit, Trash2 } from 'lucide-react'
import { EditTemplateDialog } from './edit-template-dialog'
import { useToast } from '@/hooks/use-toast'

interface Template {
  id: string
  type: string
  title: string
  message: string
  created_at: string
}

interface TemplatesTableProps {
  userId: string
}

export function TemplatesTable({ userId }: TemplatesTableProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  const fetchTemplates = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('message_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setTemplates(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchTemplates()
  }, [userId])

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', userId)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      })
      fetchTemplates()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Templates</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No templates found. Create your first template to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Message Preview</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      {template.type === 'email' ? (
                        <Mail className="h-3 w-3" />
                      ) : (
                        <MessageCircle className="h-3 w-3" />
                      )}
                      {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{template.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{template.message}</TableCell>
                  <TableCell>
                    {new Date(template.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <EditTemplateDialog template={template} onUpdate={fetchTemplates}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </EditTemplateDialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
