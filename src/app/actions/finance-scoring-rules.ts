'use server'

import { _get, _post } from '@/auth'
import { ResponseType } from '../lib/definitions'

export type MetricCutoffPayload = {
    full: number
    half: number
}

export type FinanceTierThresholdsPayload = {
    program: MetricCutoffPayload
    revenueSpent: MetricCutoffPayload
    fundraising: MetricCutoffPayload
    admin: MetricCutoffPayload
    compensation: MetricCutoffPayload
    reserves: MetricCutoffPayload
}

export type FinanceScoringRulesPayload = {
    tierRevenueThresholdUsa: number
    tierRevenueThresholdCanada: number
    tierRevenueThresholdUk: number
    weightCyFinancials: number
    weightPyFinancials: number
    weightImpactReport: number
    weightProgram: number
    weightFundraising: number
    weightAdmin: number
    weightCompensation: number
    weightRevenueSpent: number
    weightReserves: number
    maxOverheadPercent: number
    maxReservesMonths: number
    tier1: FinanceTierThresholdsPayload
    tier2: FinanceTierThresholdsPayload
}

export const getFinanceScoringRulesAction = async (): Promise<ResponseType> => {
    return await _get('/finance-scoring-rules')
}

export const saveFinanceScoringRulesAction = async (payload: FinanceScoringRulesPayload): Promise<ResponseType> => {
    return await _post('/finance-scoring-rules', payload)
}
