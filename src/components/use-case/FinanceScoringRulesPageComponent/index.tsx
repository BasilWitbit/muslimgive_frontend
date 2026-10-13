import type { ReactNode } from 'react'
import FinanceScoringRulesSettings, { type FinanceScoringRulesInitial } from './FinanceScoringRulesSettings'

type Rules = FinanceScoringRulesInitial

function RuleCard({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="rounded-2xl border border-[#E8EEF5] bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-[#101928]">{title}</h2>
            {children}
        </section>
    )
}

export default function FinanceScoringRulesPageComponent({ rules }: { rules: Rules }) {
    return (
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 md:px-6">
            <header>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#266DD3]">Financial Accountability</p>
                <h1 className="mt-1 text-2xl font-bold text-[#101928]">Scoring Rules</h1>
                <p className="mt-2 text-sm text-[#667085]">View and edit the thresholds, point weights, and rating cut-offs used for Financial Accountability assessments.</p>
            </header>
            <RuleCard title="Current scoring rules">
                <FinanceScoringRulesSettings initialRules={rules} />
            </RuleCard>
        </main>
    )
}
