import { getFinanceScoringRulesAction } from '@/app/actions/finance-scoring-rules'
import FinanceScoringRulesPageComponent from '@/components/use-case/FinanceScoringRulesPageComponent'

const unwrap = (response: any) => {
    if (!response?.ok) return null
    let data = response.payload?.data
    if (data && typeof data === 'object' && 'data' in data) data = data.data
    return data ?? null
}

export default async function FinanceScoringRulesPage() {
    const response = await getFinanceScoringRulesAction()
    const rules = unwrap(response)

    if (!rules) {
        return (
            <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
                <h1 className="text-2xl font-bold text-[#101928]">Financial Accountability Scoring Rules</h1>
                <p className="mt-3 text-sm text-[#667085]">Scoring rules could not be loaded. Please refresh the page or contact an administrator.</p>
            </main>
        )
    }

    return <FinanceScoringRulesPageComponent rules={rules} />
}
