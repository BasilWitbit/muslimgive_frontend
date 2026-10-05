'use server'

import { _get, _patch, _post } from '@/auth'
import { ResponseType } from '../lib/definitions'
import { revalidatePath } from 'next/cache'

export type UpdateAssessmentSheetPayload = {
  name?: string
  charityCommissionWebsiteUrl?: string | null
  ukCharityCommissionUrl?: string | null
  caCraUrl?: string | null
  usIrsUrl?: string | null
  totalAssets?: number | null
  totalLiabilities?: number | null
  totalRevenue?: number | null
  charitableProgramSpend?: number | null
  administrativeSpend?: number | null
  fundraisingSpend?: number | null
  qdSpend?: number | null
  compensationSpend?: number | null
  reportedTotalExpenses?: number | null
  fiscalYearEnd?: string | null
  qdSpendNotReported?: boolean
  compensationSpendNotReported?: boolean
  cyFinancialsAvailable?: string | null
  pyFinancialsAvailable?: string | null
  impactReportAvailable?: string | null
  assuranceLevel?: string | null
  tierStatus?: string | null
  syncToAirtable?: boolean
  finalSubmit?: boolean
}

export const updateAssessmentSheetAction = async (
  charityId: string,
  payload: UpdateAssessmentSheetPayload,
): Promise<ResponseType> => {
  const res = await _patch(`/charities/${charityId}/assessment-sheet`, payload)
  if (res.ok) {
    revalidatePath('/assessment-sheet')
    revalidatePath(`/assessment-sheet/${charityId}`)
    revalidatePath(`/charities/${charityId}`, 'layout')
  }
  return res
}

export const resyncCharityAirtableAction = async (charityId: string): Promise<ResponseType> => {
  const res = await _post(`/airtable/charities/${charityId}/resync`, {})
  if (res.ok) {
    revalidatePath('/assessment-sheet')
    revalidatePath(`/assessment-sheet/${charityId}`)
  }
  return res
}

export const syncAllAirtableAction = async (): Promise<ResponseType> => {
  const res = await _post('/airtable/charities/sync-now', {})
  if (res.ok) {
    revalidatePath('/assessment-sheet')
  }
  return res
}

export const getAssessmentSheetCharityAction = async (charityId: string): Promise<ResponseType> => {
  return await _get(`/charities/${charityId}`)
}

export const getAssessmentSheetUsdPreviewAction = async (charityId: string): Promise<ResponseType> => {
  return await _get(`/charities/${charityId}/assessment-sheet/usd-preview`)
}
