import { getFxRatesAction } from '@/app/actions/fx-rates'
import FxRatesPageComponent from '@/components/use-case/FxRatesPageComponent'

const unwrap = (response: any) => {
    if (!response?.ok) return []
    let data = response.payload?.data
    if (data && typeof data === 'object' && 'data' in data) data = data.data
    return Array.isArray(data) ? data : []
}

export default async function FxRatesPage() {
    const response = await getFxRatesAction()
    const rates = unwrap(response)

    return <FxRatesPageComponent rates={rates} />
}
