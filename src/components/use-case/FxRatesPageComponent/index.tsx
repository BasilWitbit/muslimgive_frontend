import type { ReactNode } from 'react'
import FxRatesSettings from './FxRatesSettings'
import type { FxRateRecord } from '@/app/actions/fx-rates'

function RateCard({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-2xl border border-[#E8EEF5] bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-[#101928]">{title}</h2>
            {children}
        </section>
    )
}

export default function FxRatesPageComponent({ rates }: { rates: FxRateRecord[] }) {
    return (
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 md:px-6">
            <header>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#266DD3]">Financial Accountability</p>
                <h1 className="mt-1 text-2xl font-bold text-[#101928]">FX Rates</h1>
                <p className="mt-2 text-sm text-[#667085]">
                    Annual CAD/GBP to USD rates used to auto-fill the assessment form for charities outside the US.
                </p>
            </header>
            <RateCard title="Annual rates">
                <FxRatesSettings initialRates={rates} />
            </RateCard>
        </main>
    )
}
