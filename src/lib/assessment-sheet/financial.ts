export type CurrencyCode = 'CAD' | 'GBP' | 'USD'

export function assessmentCurrency(countryCode: string | null | undefined): CurrencyCode | null {
  const country = (countryCode ?? '').trim().toLowerCase()
  if (['canada', 'ca'].includes(country)) return 'CAD'
  if (['uk', 'united kingdom', 'united-kingdom'].includes(country)) return 'GBP'
  if (['usa', 'us', 'united states', 'united-states'].includes(country)) return 'USD'
  return null
}

export function parseFinancialAmount(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string' || !value.trim() || /^n\s*\/\s*a$/i.test(value.trim())) return null
  const normalized = value
    .trim()
    .replace(/^(?:CAD|GBP|USD|CA|US|C)(?=\s*[$£\d.])/i, '')
    .replace(/[$£,\s\u00a0]/g, '')
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Keeps an amount input numeric while typing or pasting: currency symbols/codes,
 * thousands separators and spaces are dropped, and only one decimal point is kept.
 * "" stays "" so blank is distinguishable from 0.
 */
export function sanitizeAmountInput(raw: string): string {
  const stripped = raw
    .trim()
    .replace(/^(?:CAD|GBP|USD|CA|US|C)(?=\s*[$£\d.])/i, '')
    .replace(/[^\d.]/g, '')
  const [whole, ...fraction] = stripped.split('.')
  return fraction.length ? `${whole}.${fraction.join('')}` : whole
}

export type AssessmentInputValues = {
  totalAssets: unknown
  totalLiabilities: unknown
  totalRevenue: unknown
  charitableProgramSpend: unknown
  administrativeSpend: unknown
  fundraisingSpend: unknown
  qdSpend: unknown
  qdSpendNotReported: boolean
  compensationSpend: unknown
  compensationSpendNotReported: boolean
  assuranceLevel: unknown
  fiscalYearEnd: unknown
}

export function validateAssessmentInputs(values: AssessmentInputValues): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const field of [
    'totalAssets',
    'totalLiabilities',
    'totalRevenue',
    'charitableProgramSpend',
    'administrativeSpend',
    'fundraisingSpend',
  ] as const) {
    if (parseFinancialAmount(values[field]) === null) errors[field] = 'Enter an amount (0 is valid).'
  }
  if (!['Audit', 'Review', 'Compilation', 'None'].includes(String(values.assuranceLevel ?? ''))) {
    errors.assuranceLevel = 'Select an assurance level.'
  }
  if (!isIsoDate(String(values.fiscalYearEnd ?? '').slice(0, 10))) {
    errors.fiscalYearEnd = 'Enter a valid fiscal year end date.'
  }
  if (parseFinancialAmount(values.qdSpend) === null && !values.qdSpendNotReported) {
    errors.qdSpend = 'Enter QD Spend or mark it Not reported.'
  }
  if (parseFinancialAmount(values.compensationSpend) === null && !values.compensationSpendNotReported) {
    errors.compensationSpend = 'Enter Compensation Spend or mark it Not reported.'
  }
  return errors
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function expenseReconciliationWarning(
  row: Pick<AssessmentInputValues, 'charitableProgramSpend' | 'administrativeSpend' | 'fundraisingSpend' | 'qdSpend'> & { reportedTotalExpenses?: unknown },
): string | null {
  const total = parseFinancialAmount(row.reportedTotalExpenses)
  const categories = [
    parseFinancialAmount(row.charitableProgramSpend),
    parseFinancialAmount(row.administrativeSpend),
    parseFinancialAmount(row.fundraisingSpend),
    parseFinancialAmount(row.qdSpend),
  ]
  if (total === null || categories.some((amount) => amount === null)) return null
  const categoryTotal = categories.reduce<number>((sum, amount) => sum + (amount ?? 0), 0)
  if (Math.abs(categoryTotal - total) <= 0.01) return null
  return `Spend categories total ${categoryTotal.toLocaleString()} but reported total expenses are ${total.toLocaleString()}. Review the figures.`
}

export function deriveAssessmentMetrics(values: {
  totalRevenue: unknown
  totalAssets: unknown
  totalLiabilities: unknown
  charitableProgramSpend: unknown
  administrativeSpend: unknown
  fundraisingSpend: unknown
  qdSpend: unknown
  compensationSpend: unknown
}) {
  const revenue = parseFinancialAmount(values.totalRevenue)
  const assets = parseFinancialAmount(values.totalAssets)
  const liabilities = parseFinancialAmount(values.totalLiabilities)
  const program = parseFinancialAmount(values.charitableProgramSpend)
  const admin = parseFinancialAmount(values.administrativeSpend)
  const fundraising = parseFinancialAmount(values.fundraisingSpend)
  const qd = parseFinancialAmount(values.qdSpend)
  const compensation = parseFinancialAmount(values.compensationSpend)
  const hasCompleteSpend = [program, admin, fundraising, qd].every((amount) => amount !== null)
  const totalSpend = hasCompleteSpend ? program! + admin! + fundraising! + qd! : null
  const pct = (amount: number | null) =>
    amount !== null && revenue !== null && revenue > 0
      ? Math.round((amount / revenue) * 10000) / 100
      : null
  return {
    totalSpend,
    programPercent: pct(program),
    adminPercent: pct(admin),
    fundraisingPercent: pct(fundraising),
    qdPercent: pct(qd),
    compensationPercent: pct(compensation),
    revenueSpentPercent: pct(totalSpend),
    reservesMonths:
      assets !== null && liabilities !== null && totalSpend !== null && totalSpend > 0
        ? Math.round((((assets - liabilities) / totalSpend) * 12) * 100) / 100
        : null,
  }
}
