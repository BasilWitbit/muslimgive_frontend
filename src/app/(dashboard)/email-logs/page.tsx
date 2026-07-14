'use client'
import React, { FC, useEffect, useMemo, useState } from 'react'
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
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Inbox,
  Mail,
  MailCheck,
  RefreshCw,
  Reply,
  RotateCcw,
  Send,
  Sparkles,
} from 'lucide-react'

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

type StatusFilter = 'all' | EmailStatus

const STATUS_FILTERS: Array<{ label: string; value: StatusFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Sent', value: 'sent' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Received', value: 'received' },
  { label: 'Failed', value: 'failed' },
  { label: 'Pending', value: 'pending' },
]

const statusMeta: Record<EmailStatus, { label: string; className: string; icon: React.ElementType }> = {
  sent: {
    label: 'Sent',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
    icon: Send,
  },
  delivered: {
    label: 'Delivered',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    className: 'border-red-200 bg-red-50 text-red-700',
    icon: AlertTriangle,
  },
  pending: {
    label: 'Pending',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: Clock3,
  },
  received: {
    label: 'Received',
    className: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    icon: Inbox,
  },
}

const stripHtml = (value: string) =>
  value
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const formatEmailAddress = (value?: string) => value || 'Unknown'

const EmailLogsPage: FC = () => {
  const searchParams = useSearchParams()
  const charityParam = searchParams.get('charity')

  const [query, setQuery] = useState(charityParam || '')
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null)
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false)
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [retryingEmailId, setRetryingEmailId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

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

  const filtered = useMemo(() => {
    const normalizedQuery = query.toLowerCase()

    return logs.filter((log) => {
      const matchesQuery =
        log.subject.toLowerCase().includes(normalizedQuery) ||
        log.charity.toLowerCase().includes(normalizedQuery) ||
        log.from.toLowerCase().includes(normalizedQuery) ||
        log.to.toLowerCase().includes(normalizedQuery)

      const matchesStatus = statusFilter === 'all' || log.status === statusFilter

      return matchesQuery && matchesStatus
    })
  }, [logs, query, statusFilter])

  const statusCounts = useMemo(() => {
    return logs.reduce<Record<EmailStatus, number>>((acc, log) => {
      acc[log.status] = (acc[log.status] ?? 0) + 1
      return acc
    }, { sent: 0, delivered: 0, failed: 0, pending: 0, received: 0 })
  }, [logs])

  const deliveryRate = useMemo(() => {
    if (!logs.length) return 0
    return Math.round(((statusCounts.delivered + statusCounts.sent + statusCounts.received) / logs.length) * 100)
  }, [logs.length, statusCounts.delivered, statusCounts.received, statusCounts.sent])

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

  const renderStatusBadge = (status: EmailStatus) => {
    const meta = statusMeta[status] ?? statusMeta.pending
    const Icon = meta.icon

    return (
      <Badge variant="outline" className={cn('gap-1.5 px-2.5 py-1 font-semibold', meta.className)}>
        <Icon className="size-3.5" />
        {meta.label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="px-4 pb-6">
        <div className="overflow-hidden rounded-3xl border border-[#E8EEF5] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <div className="h-32 animate-pulse bg-gradient-to-r from-[#F3F7FD] via-white to-[#EDF7FB]" />
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl bg-[#F3F6FB]" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 px-4 pb-6">
      <section className="relative overflow-hidden rounded-3xl border border-[#E8EEF5] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#266DD3]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-16 h-64 w-64 rounded-full bg-[#5CD9F2]/12 blur-3xl" />

        <div className="relative flex flex-col gap-6 border-b border-[#E8EEF5]/90 bg-gradient-to-br from-[#F8FBFF] via-white to-[#F4FBFD] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D9E8FB] bg-white/80 px-3 py-1 text-xs font-semibold text-[#266DD3] shadow-sm">
              <Sparkles className="size-3.5" />
              Communication Command Center
            </div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#101928]">
              Email delivery, replies, and retry history in one place.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#667085]">
              Track every charity message, monitor failed sends, and respond quickly from a polished operational inbox.
            </p>
          </div>

          <div className="grid min-w-[280px] grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[#E8EEF5] bg-white/80 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">
                <Mail className="size-4 text-[#266DD3]" />
                Total
              </div>
              <div className="mt-2 text-3xl font-semibold text-[#101928]">{logs.length}</div>
            </div>
            <div className="rounded-2xl border border-[#E8EEF5] bg-white/80 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">
                <MailCheck className="size-4 text-[#12B76A]" />
                Healthy
              </div>
              <div className="mt-2 text-3xl font-semibold text-[#101928]">{deliveryRate}%</div>
            </div>
          </div>
        </div>

        <div className="relative grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
          {STATUS_FILTERS.slice(1).map((filter) => {
            const meta = statusMeta[filter.value as EmailStatus]
            const Icon = meta.icon

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  'rounded-2xl border bg-white p-4 text-left shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)]',
                  statusFilter === filter.value ? 'border-[#266DD3] ring-4 ring-[#266DD3]/10' : 'border-[#E8EEF5]',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl border', meta.className)}>
                    <Icon className="size-4" />
                  </span>
                  <span className="text-2xl font-semibold text-[#101928]">{statusCounts[filter.value as EmailStatus]}</span>
                </div>
                <div className="mt-3 text-sm font-semibold text-[#344054]">{filter.label}</div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-[#E8EEF5] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.045)]">
        <div className="flex flex-col gap-3 border-b border-[#E8EEF5] p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <ControlledSearchBarComponent
              query={query}
              setQuery={(q) => setQuery(q)}
              placeholder="Search by subject, charity, sender, or recipient"
              className="h-11 rounded-xl border-[#DDE7F3] bg-[#F8FAFC]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  'rounded-full border px-3 py-2 text-xs font-semibold transition-all duration-200',
                  statusFilter === filter.value
                    ? 'border-[#266DD3] bg-[#266DD3] text-white shadow-[0_8px_18px_rgba(38,109,211,0.22)]'
                    : 'border-[#E4EAF2] bg-white text-[#667085] hover:border-[#C8DDF6] hover:text-[#266DD3]',
                )}
              >
                {filter.label}
              </button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-full border-[#DDE7F3] bg-white text-[#344054] hover:bg-[#F3F6FB]"
              onClick={fetchEmails}
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF4FD] text-[#266DD3]">
              <Inbox className="size-7" />
            </div>
            <h3 className="text-lg font-semibold text-[#101928]">
              {query || statusFilter !== 'all' ? 'No matching emails found' : 'No email logs available'}
            </h3>
            <p className="mt-2 max-w-md text-sm text-[#667085]">
              Try changing the search text or status filter to find the communication you need.
            </p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3 p-4">
            {filtered.map((log) => {
              const preview = stripHtml(log.body)

              return (
                <AccordionItem
                  key={log.id}
                  value={log.id}
                  className="overflow-hidden rounded-2xl border border-[#E8EEF5] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(15,23,42,0.065)]"
                >
                  <AccordionTrigger className="w-full rounded-none p-0 hover:bg-[#F8FAFC] [&>div]:flex [&>div]:w-full [&>div]:items-center [&>div]:gap-3 [&>div]:p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#EEF4FD] to-[#EAFBFF] text-[#266DD3]">
                      <Mail className="size-5" />
                    </div>

                    <div className="grid min-w-0 flex-1 gap-3 text-left lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)_120px_150px_110px] lg:items-center">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[#101928]" title={log.subject}>
                          {log.subject}
                        </div>
                        <div className="mt-1 truncate text-xs font-normal text-[#667085]">
                          {preview || 'No preview available'}
                        </div>
                      </div>

                      <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-[#344054]">
                        <Building2 className="size-4 shrink-0 text-[#98A2B3]" />
                        <span className="truncate" title={log.charity}>{log.charity}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm font-medium text-[#475467]">
                        <Clock3 className="size-4 text-[#98A2B3]" />
                        {log.time}
                      </div>

                      <div className="flex items-center gap-2 text-sm font-medium text-[#475467]">
                        <CalendarDays className="size-4 text-[#98A2B3]" />
                        <span className="truncate">{log.dateLabel}</span>
                      </div>

                      <div className="flex justify-start lg:justify-end">
                        {renderStatusBadge(log.status)}
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="border-t border-[#E8EEF5] bg-gradient-to-b from-[#FBFCFE] to-white p-0">
                    <div className="grid gap-4 p-4 lg:grid-cols-[1fr_220px]">
                      <div className="min-w-0 rounded-2xl border border-[#E8EEF5] bg-white p-4">
                        <div className="mb-4 flex flex-col gap-2 border-b border-[#EEF2F6] pb-4">
                          <h3 className="text-base font-semibold text-[#101928]">{log.subject}</h3>
                          <div className="grid gap-2 text-xs text-[#667085] sm:grid-cols-2">
                            <span className="truncate">
                              <span className="font-semibold text-[#344054]">From:</span> {formatEmailAddress(log.from)}
                            </span>
                            <span className="truncate">
                              <span className="font-semibold text-[#344054]">To:</span> {formatEmailAddress(log.to)}
                            </span>
                          </div>
                        </div>
                        <div
                          className="email-log-body max-h-[420px] overflow-auto rounded-xl bg-[#F8FAFC] p-4 text-sm leading-6 text-[#344054]"
                          dangerouslySetInnerHTML={{ __html: log.body }}
                        />
                      </div>

                      <aside className="rounded-2xl border border-[#E8EEF5] bg-white p-4">
                        <div className="mb-4">
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#98A2B3]">Message status</div>
                          <div className="mt-2">{renderStatusBadge(log.status)}</div>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Charity</div>
                            <div className="mt-1 font-semibold text-[#101928]">{log.charity}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">Sent at</div>
                            <div className="mt-1 font-semibold text-[#101928]">{log.dateLabel} · {log.time}</div>
                          </div>
                        </div>

                        <div className="mt-5 space-y-2">
                          {log.status === 'received' && (
                            <Button
                              variant="primary"
                              className="w-full rounded-xl bg-gradient-to-r from-[#266DD3] to-[#3B82E8] text-white shadow-[0_10px_24px_rgba(38,109,211,0.24)]"
                              onClick={() => handleReply(log)}
                            >
                              <Reply className="size-4" />
                              Reply
                            </Button>
                          )}
                          {log.status === 'failed' && (
                            <Button
                              variant="destructive"
                              className="w-full rounded-xl"
                              onClick={() => handleRetry(log)}
                              loading={retryingEmailId === log.id}
                            >
                              <RotateCcw className="size-4" />
                              {retryingEmailId === log.id ? 'Retrying' : 'Retry email'}
                            </Button>
                          )}
                        </div>
                      </aside>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </section>

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
