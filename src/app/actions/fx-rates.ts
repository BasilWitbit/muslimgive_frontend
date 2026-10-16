'use server'

import { _get, _post } from '@/auth'
import { ResponseType } from '../lib/definitions'

export type FxRateCurrency = 'CAD' | 'GBP'

export type FxRateRecord = {
    id: string
    currencyCode: FxRateCurrency
    year: number
    rate: number
    updatedByUserId: string | null
    createdAt: string
    updatedAt: string
}

export type UpsertFxRatePayload = {
    currencyCode: FxRateCurrency
    year: number
    rate: number
}

export const getFxRatesAction = async (): Promise<ResponseType> => {
    return await _get('/fx-rates')
}

export const saveFxRateAction = async (payload: UpsertFxRatePayload): Promise<ResponseType> => {
    return await _post('/fx-rates', payload)
}
