'use client'

import { useEffect, useState } from 'react'
import { previewCharityUsdAction, type CharityUsdPreview } from '@/app/actions/charities'
import { isIsoDate, parseFinancialAmount } from '@/lib/assessment-sheet/financial'
import { useDebounce } from './useDebounce'

export type CharityFinancialInputs = {
    countryCode: string | null | undefined
    fiscalYearEnd: string | null | undefined
    totalAssets: string | number | null | undefined
    totalLiabilities: string | number | null | undefined
    totalRevenue: string | number | null | undefined
}

export type CharityUsdPreviewState = {
    preview: CharityUsdPreview | null
    loading: boolean
    error: string | null
}

const ALLOWED_COUNTRIES = new Set(['canada', 'united-kingdom', 'united-states'])

/**
 * Fetches the USD preview (Annual FX Tables rate for the fiscal year) as soon as
 * country + a valid fiscal year end are known, so a missing rate is reported up front.
 */
export function useCharityUsdPreview(inputs: CharityFinancialInputs): CharityUsdPreviewState {
    const key = JSON.stringify({
        countryCode: inputs.countryCode ?? null,
        fiscalYearEnd: inputs.fiscalYearEnd ?? null,
        totalAssets: parseFinancialAmount(inputs.totalAssets),
        totalLiabilities: parseFinancialAmount(inputs.totalLiabilities),
        totalRevenue: parseFinancialAmount(inputs.totalRevenue),
    })
    const debouncedKey = useDebounce(key, 350)
    const [state, setState] = useState<CharityUsdPreviewState>({ preview: null, loading: false, error: null })

    useEffect(() => {
        const values = JSON.parse(debouncedKey) as {
            countryCode: string | null
            fiscalYearEnd: string | null
            totalAssets: number | null
            totalLiabilities: number | null
            totalRevenue: number | null
        }
        if (!values.countryCode || !ALLOWED_COUNTRIES.has(values.countryCode) || !values.fiscalYearEnd || !isIsoDate(values.fiscalYearEnd)) {
            setState({ preview: null, loading: false, error: null })
            return
        }

        let cancelled = false
        setState((prev) => ({ ...prev, loading: true, error: null }))
        previewCharityUsdAction({
            countryCode: values.countryCode as Parameters<typeof previewCharityUsdAction>[0]['countryCode'],
            fiscalYearEnd: values.fiscalYearEnd,
            totalAssets: values.totalAssets,
            totalLiabilities: values.totalLiabilities,
            totalRevenue: values.totalRevenue,
        })
            .then((res) => {
                if (cancelled) return
                const preview = (res.payload?.data?.data ?? res.payload?.data ?? null) as CharityUsdPreview | null
                setState(
                    res.ok && preview
                        ? { preview, loading: false, error: null }
                        : { preview: null, loading: false, error: res.message || 'Could not check the FX rate.' },
                )
            })
            .catch(() => {
                if (!cancelled) setState({ preview: null, loading: false, error: 'Could not check the FX rate.' })
            })
        return () => {
            cancelled = true
        }
    }, [debouncedKey])

    return state
}
