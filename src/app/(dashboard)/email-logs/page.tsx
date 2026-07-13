'use client'
import React, { FC, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import ControlledSearchBarComponent from '@/components/common/SearchBarComponent/ControlledSearchBarComponent'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import EmailReplyModal from '@/components/use-case/email-logs/EmailReplyModal'
import { getEmailsAction } from '@/app/actions/general'
import { resendInviteAction } from '@/app/actions/admin'
import { toast } from 'sonner'
import { usePageNavigationDismiss } from '@/hooks/use-page-navigation'

type EmailStatus = 'sent' | 'delivered' | 'failed' | 'pending' | 'received'

type EmailLog = {
  id: string
  subject: string
  charity: string
  charityId: string
  time: string
  dateLabel: string
  status: EmailStatus
  body: string
  from: string
  to: string
}

const EmailLogsPage: FC = () => {
  const searchParams = useSearchParams()
  const charityParam = searchParams.get('charity')

  const [query, setQuery] = useState(charityParam || '')
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null)
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false)
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [retryingEmailId, setRetryingEmailId] = useState<string | null>(null)

  usePageNavigationDismiss(isLoading)

  useEffect(() => {
    fetchEmails()
  }, [])

  const fetchEmails = async () => {
    setIsLoading(true)
    try {
      const res = await getEmailsAction()
      if (res.ok && res.payload?.data?.data) {
        const emails = res.payload.data.data
        const mapped: EmailLog[] = emails.map((email: any) => {
          const date = new Date(email.createdAt)
          const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
          const dateLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }).replace(',', ' /')

          return {
            id: email.id,
            subject: email.subject || '(No Subject)',
            charity: email.charity?.name || 'Unknown Charity',
            charityId: email.charityId,
            time,
            dateLabel,
            status: email.status.toLowerCase() as EmailStatus,
            body: email.html || email.text || '(No content)',
            from: email.from,
            to: email.to,
          }
        })
        setLogs(mapped)
      } else {
        toast.error(res.message || 'Failed to fetch email logs')
      }
    } catch (error) {
      console.error(error)
      toast.error('An error occurred while fetching email logs')
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = logs.filter(l =>
    l.subject.toLowerCase().includes(query.toLowerCase()) ||
    l.charity.toLowerCase().includes(query.toLowerCase())
  )

  const handleReply = (log: EmailLog) => {
    setSelectedLog(log)
    setIsReplyModalOpen(true)
  }

  const handleSendReply = (subject: string, body: string) => {
    console.log('Sending reply:', { subject, body, originalLogId: selectedLog?.id })
    // TODO: Implement actual send reply logic here
    setIsReplyModalOpen(false)
  }

  const handleRetry = async (log: EmailLog) => {
    setRetryingEmailId(log.id)
    try {
      const res = await resendInviteAction(log.to)
      if (res.ok) {
        toast.success('Email resent successfully')
        // Refresh email logs
        await fetchEmails()
      } else {
        toast.error(res.message || 'Failed to resend email')
      }
    } catch (error) {
      console.error(error)
      toast.error('An error occurred while resending email')
    } finally {
      setRetryingEmailId(null)
    }
  }

  const getStatusBadgeVariant = (status: EmailStatus): 'sent' | 'delivered' | 'destructive' | 'received' | 'outline' => {
    switch (status) {
      case 'sent':
        return 'sent'
      case 'delivered':
        return 'delivered'
      case 'failed':
        return 'destructive'
      case 'received':
        return 'received'
      default:
        return 'outline'
    }
  }

  const getStatusLabel = (status: EmailStatus): string => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (isLoading) {
    return null
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <ControlledSearchBarComponent query={query} setQuery={(q) => setQuery(q)} placeholder="Search Charity" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {query ? 'No emails found matching your search.' : 'No email logs available.'}
        </div>
      ) : (
        <Accordion type="single" collapsible>
          {filtered.map(log => (
            <AccordionItem key={log.id} value={log.id}>
              <AccordionTrigger asChild className="w-full">
                <div className="grid grid-cols-[1fr_1fr_80px_140px_90px] gap-4 w-full py-3 px-2 hover:bg-slate-50 cursor-pointer items-center">
                  <div className="text-sm font-medium truncate" title={log.subject}>Subject: {log.subject}</div>
                  <div className="text-sm truncate" title={log.charity}>Charity: {log.charity}</div>
                  <div className="text-sm text-center">{log.time}</div>
                  <div className="text-sm text-center">{log.dateLabel}</div>
                  <div className="flex justify-end">
                    <Badge variant={getStatusBadgeVariant(log.status)}>{getStatusLabel(log.status)}</Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="py-3 px-2 flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="mb-2 font-semibold">Subject: {log.subject}</div>
                    <div className="text-sm text-[#333]" dangerouslySetInnerHTML={{ __html: log.body }} />
                  </div>
                  {log.status === 'received' && (
                    <Button variant="outline" size="sm" onClick={() => handleReply(log)}>Reply</Button>
                  )}
                  {log.status === 'failed' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRetry(log)}
                      disabled={retryingEmailId === log.id}
                    >
                      {retryingEmailId === log.id ? 'Retrying...' : 'Retry'}
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <EmailReplyModal
        open={isReplyModalOpen}
        onOpenChange={setIsReplyModalOpen}
        defaultSubject={selectedLog ? `Re: ${selectedLog.subject}` : ''}
        onSend={handleSendReply}
      />
    </div>
  )
}

export default EmailLogsPage
