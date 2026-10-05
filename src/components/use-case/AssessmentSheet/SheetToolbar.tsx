'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Check, Cloud, CloudOff, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

type SheetToolbarProps = {
  title: string
  subtitle?: string
  saveState: SaveState
  syncedCount?: number
  totalCount?: number
  onSyncAll?: () => void
  syncing?: boolean
  trailing?: React.ReactNode
}

export function SheetToolbar({
  title,
  subtitle,
  saveState,
  syncedCount,
  totalCount,
  onSyncAll,
  syncing,
  trailing,
}: SheetToolbarProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E4EAF2] bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFD] to-[#EEF3FA] px-5 py-4 shadow-[0_1px_0_rgba(26,35,50,0.04)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#266DD3]/35 to-transparent"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7A8BA3]">
            Assessment workspace
          </p>
          <h1 className="mt-1 truncate font-[family-name:var(--font-kanit)] text-[22px] font-semibold tracking-[-0.02em] text-[#1A2332]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 text-[13px] text-[#6B7A8F]">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SaveBadge state={saveState} />
          {typeof syncedCount === 'number' && typeof totalCount === 'number' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E4EAF2] bg-white/80 px-3 py-1.5 text-[12px] text-[#4A5A70]">
              <Cloud className="size-3.5 text-[#266DD3]" />
              {syncedCount}/{totalCount} on Airtable
            </span>
          ) : null}
          {onSyncAll ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={syncing}
              onClick={onSyncAll}
              className="h-9 gap-1.5 rounded-xl border-[#D7E2F0] bg-white text-[#1A2332] hover:bg-[#F3F7FC]"
            >
              {syncing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Sync all
            </Button>
          ) : null}
          {trailing}
        </div>
      </div>
    </div>
  )
}

function SaveBadge({ state }: { state: SaveState }) {
  const map = {
    idle: {
      label: 'Up to date',
      icon: Check,
      className: 'border-[#E4EAF2] bg-white/80 text-[#6B7A8F]',
    },
    dirty: {
      label: 'Unsaved changes',
      icon: CloudOff,
      className: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    saving: {
      label: 'Saving…',
      icon: Loader2,
      className: 'border-[#D7E2F0] bg-[#EEF4FC] text-[#266DD3]',
    },
    saved: {
      label: 'Saved',
      icon: Check,
      className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    },
    error: {
      label: 'Save failed',
      icon: CloudOff,
      className: 'border-red-200 bg-red-50 text-red-700',
    },
  } as const

  const item = map[state]
  const Icon = item.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium',
        item.className,
      )}
    >
      <Icon className={cn('size-3.5', state === 'saving' && 'animate-spin')} />
      {item.label}
    </span>
  )
}
