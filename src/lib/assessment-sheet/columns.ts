export type SheetColumnType = 'text' | 'number' | 'select' | 'url' | 'date' | 'readonly'

export type SheetColumnGroup =
  | 'identity'
  | 'financials'
  | 'documentation'
  | 'derived'
  | 'scores'

export type SheetColumn = {
  id: string
  label: string
  group: SheetColumnGroup
  type: SheetColumnType
  width: number
  editable: boolean
  options?: string[]
  /** Maps to charity entity / API field */
  field: string
  align?: 'left' | 'right'
  format?: 'currency' | 'percent' | 'number'
}

export const SHEET_GROUP_LABELS: Record<SheetColumnGroup, string> = {
  identity: 'Identity',
  financials: 'Financials',
  documentation: 'Documentation',
  derived: 'Derived',
  scores: 'Scores & Result',
}

export const ASSESSMENT_SHEET_COLUMNS: SheetColumn[] = [
  {
    id: 'charityName',
    label: 'Charity Name',
    group: 'identity',
    type: 'text',
    width: 220,
    editable: true,
    field: 'name',
  },
  {
    id: 'country',
    label: 'Country',
    group: 'identity',
    type: 'readonly',
    width: 140,
    editable: false,
    field: 'countryCode',
  },
  {
    id: 'registrationNumber',
    label: 'Registration #',
    group: 'identity',
    type: 'readonly',
    width: 140,
    editable: false,
    field: 'registrationNumber',
  },
  {
    id: 'charitySiteUrl',
    label: "Charity Site",
    group: 'identity',
    type: 'url',
    width: 180,
    editable: true,
    field: 'charityCommissionWebsiteUrl',
  },
  {
    id: 'taxReturnUrl',
    label: 'Tax / Registry URL',
    group: 'identity',
    type: 'url',
    width: 180,
    editable: true,
    field: 'taxReturnUrl',
  },
  {
    id: 'totalAssets',
    label: 'Total Assets',
    group: 'financials',
    type: 'number',
    width: 130,
    editable: true,
    field: 'totalAssets',
    align: 'right',
    format: 'currency',
  },
  {
    id: 'totalLiabilities',
    label: 'Total Liabilities',
    group: 'financials',
    type: 'number',
    width: 130,
    editable: true,
    field: 'totalLiabilities',
    align: 'right',
    format: 'currency',
  },
  {
    id: 'totalRevenue',
    label: 'Total Revenue',
    group: 'financials',
    type: 'number',
    width: 130,
    editable: true,
    field: 'totalRevenue',
    align: 'right',
    format: 'currency',
  },
  {
    id: 'charitableProgramSpend',
    label: 'Program Spend',
    group: 'financials',
    type: 'number',
    width: 130,
    editable: true,
    field: 'charitableProgramSpend',
    align: 'right',
    format: 'currency',
  },
  {
    id: 'administrativeSpend',
    label: 'Admin Spend',
    group: 'financials',
    type: 'number',
    width: 120,
    editable: true,
    field: 'administrativeSpend',
    align: 'right',
    format: 'currency',
  },
  {
    id: 'fundraisingSpend',
    label: 'Fundraising Spend',
    group: 'financials',
    type: 'number',
    width: 140,
    editable: true,
    field: 'fundraisingSpend',
    align: 'right',
    format: 'currency',
  },
  {
    id: 'qdSpend',
    label: 'QD Spend',
    group: 'financials',
    type: 'number',
    width: 110,
    editable: true,
    field: 'qdSpend',
    align: 'right',
    format: 'currency',
  },
  {
    id: 'compensationSpend',
    label: 'Compensation Spend',
    group: 'financials',
    type: 'number',
    width: 130,
    editable: true,
    field: 'compensationSpend',
    align: 'right',
    format: 'currency',
  },
  {
    id: 'reportedTotalExpenses',
    label: 'Reported Total Expenses (reconciliation only)',
    group: 'financials',
    type: 'number',
    width: 260,
    editable: true,
    field: 'reportedTotalExpenses',
    align: 'right',
    format: 'currency',
  },
  {
    id: 'fiscalYearEnd',
    label: 'Fiscal Year End',
    group: 'financials',
    type: 'date',
    width: 150,
    editable: true,
    field: 'fiscalYearEnd',
  },
  {
    id: 'cyFinancialsAvailable',
    label: 'C/Y Financials',
    group: 'documentation',
    type: 'select',
    width: 120,
    editable: true,
    field: 'cyFinancialsAvailable',
    options: ['Yes', 'No'],
  },
  {
    id: 'pyFinancialsAvailable',
    label: 'P/Y Financials',
    group: 'documentation',
    type: 'select',
    width: 120,
    editable: true,
    field: 'pyFinancialsAvailable',
    options: ['Yes', 'No'],
  },
  {
    id: 'impactReportAvailable',
    label: 'Impact Report',
    group: 'documentation',
    type: 'select',
    width: 120,
    editable: true,
    field: 'impactReportAvailable',
    options: ['Yes', 'No'],
  },
  {
    id: 'assuranceLevel',
    label: 'Assurance',
    group: 'documentation',
    type: 'select',
    width: 110,
    editable: true,
    field: 'assuranceLevel',
    options: ['Audit', 'Review', 'Compilation', 'None'],
  },
  {
    id: 'tierStatus',
    label: 'Tier',
    group: 'documentation',
    type: 'select',
    width: 100,
    editable: true,
    field: 'tierStatus',
    options: ['Tier 1', 'Tier 2', 'Tier 3'],
  },
  {
    id: 'totalSpend',
    label: 'Total Spend',
    group: 'derived',
    type: 'readonly',
    width: 130,
    editable: false,
    field: 'totalSpend',
    align: 'right',
    format: 'currency',
  },
  {
    id: 'programPercent',
    label: 'Program %',
    group: 'derived',
    type: 'readonly',
    width: 100,
    editable: false,
    field: 'programPercent',
    align: 'right',
    format: 'percent',
  },
  {
    id: 'adminPercent',
    label: 'Admin %',
    group: 'derived',
    type: 'readonly',
    width: 90,
    editable: false,
    field: 'adminPercent',
    align: 'right',
    format: 'percent',
  },
  {
    id: 'fundraisingPercent',
    label: 'Fundraising %',
    group: 'derived',
    type: 'readonly',
    width: 110,
    editable: false,
    field: 'fundraisingPercent',
    align: 'right',
    format: 'percent',
  },
  { id: 'qdPercent', label: 'QD %', group: 'derived', type: 'readonly', width: 90, editable: false, field: 'qdPercent', align: 'right', format: 'percent' },
  { id: 'compensationPercent', label: 'Compensation %', group: 'derived', type: 'readonly', width: 125, editable: false, field: 'compensationPercent', align: 'right', format: 'percent' },
  { id: 'revenueSpentPercent', label: 'Revenue Spent %', group: 'derived', type: 'readonly', width: 130, editable: false, field: 'revenueSpentPercent', align: 'right', format: 'percent' },
  { id: 'reservesMonths', label: 'Reserves (months)', group: 'derived', type: 'readonly', width: 140, editable: false, field: 'reservesMonths', align: 'right', format: 'number' },
  {
    id: 'totalScore',
    label: 'Total Score',
    group: 'scores',
    type: 'readonly',
    width: 100,
    editable: false,
    field: 'totalScore',
    align: 'right',
    format: 'number',
  },
  {
    id: 'finalResult',
    label: 'Final Result',
    group: 'scores',
    type: 'readonly',
    width: 120,
    editable: false,
    field: 'finalResult',
  },
  {
    id: 'mandatoryComplianceThreshold',
    label: 'Mandatory',
    group: 'scores',
    type: 'readonly',
    width: 110,
    editable: false,
    field: 'mandatoryComplianceThreshold',
  },
  {
    id: 'riskConcernFlag',
    label: 'Risk Flag',
    group: 'scores',
    type: 'readonly',
    width: 100,
    editable: false,
    field: 'riskConcernFlag',
  },
  {
    id: 'assessmentStatus',
    label: 'Sync Status',
    group: 'scores',
    type: 'readonly',
    width: 130,
    editable: false,
    field: 'assessmentStatus',
  },
  {
    id: 'syncError',
    label: 'Last Sync Error',
    group: 'scores',
    type: 'readonly',
    width: 320,
    editable: false,
    field: 'syncError',
  },
]

export type AssessmentSheetRow = {
  id: string
  name: string
  countryCode: string | null
  registrationNumber: string | null
  charityCommissionWebsiteUrl: string | null
  taxReturnUrl: string | null
  ukCharityCommissionUrl: string | null
  caCraUrl: string | null
  usIrsUrl: string | null
  totalAssets: number | null
  totalLiabilities: number | null
  totalRevenue: number | null
  charitableProgramSpend: number | null
  administrativeSpend: number | null
  fundraisingSpend: number | null
  qdSpend: number | null
  compensationSpend: number | null
  reportedTotalExpenses: number | null
  fiscalYearEnd: string | null
  qdSpendNotReported: boolean
  compensationSpendNotReported: boolean
  totalSpend: number | null
  qdPercent: number | null
  compensationPercent: number | null
  revenueSpentPercent: number | null
  reservesMonths: number | null
  cyFinancialsAvailable: string | null
  pyFinancialsAvailable: string | null
  impactReportAvailable: string | null
  assuranceLevel: string | null
  tierStatus: string | null
  programPercent: number | null
  adminPercent: number | null
  fundraisingPercent: number | null
  totalScore: number | null
  finalResult: string | null
  mandatoryComplianceThreshold: string | null
  riskConcernFlag: string | null
  assessmentStatus: string | null
  airtableRecordId: string | null
  syncError: string | null
}

export function mapCharityToSheetRow(c: Record<string, unknown>): AssessmentSheetRow {
  const registrationNumber =
    (c.ukCharityNumber as string) ||
    (c.caRegistrationNumber as string) ||
    (c.usEin as string) ||
    null

  const taxReturnUrl =
    (c.ukCharityCommissionUrl as string) ||
    (c.caCraUrl as string) ||
    (c.usIrsUrl as string) ||
    null

  const errorDetails = c.lastSyncError as {
    status?: number | null
    errorType?: string | null
    message?: string | null
  } | null | undefined
  const syncError = errorDetails?.message
    ? [
        errorDetails.status ? `HTTP ${errorDetails.status}` : null,
        errorDetails.errorType,
        errorDetails.message,
      ]
        .filter(Boolean)
        .join(' · ')
    : (c.syncError as string) ?? null

  return {
    id: String(c.id),
    name: String(c.name ?? ''),
    countryCode: (c.countryCode as string) ?? null,
    registrationNumber,
    charityCommissionWebsiteUrl: (c.charityCommissionWebsiteUrl as string) ?? null,
    taxReturnUrl,
    ukCharityCommissionUrl: (c.ukCharityCommissionUrl as string) ?? null,
    caCraUrl: (c.caCraUrl as string) ?? null,
    usIrsUrl: (c.usIrsUrl as string) ?? null,
    totalAssets: (c.totalAssets as number) ?? null,
    totalLiabilities: (c.totalLiabilities as number) ?? null,
    totalRevenue: (c.totalRevenue as number) ?? null,
    charitableProgramSpend: (c.charitableProgramSpend as number) ?? null,
    administrativeSpend: (c.administrativeSpend as number) ?? null,
    fundraisingSpend: (c.fundraisingSpend as number) ?? null,
    qdSpend: (c.qdSpend as number) ?? null,
    compensationSpend: (c.compensationSpend as number) ?? null,
    reportedTotalExpenses: (c.reportedTotalExpenses as number) ?? null,
    fiscalYearEnd: (c.fiscalYearEnd as string) ?? null,
    qdSpendNotReported: Boolean(c.qdSpendNotReported),
    compensationSpendNotReported: Boolean(c.compensationSpendNotReported),
    totalSpend: (c.totalSpend as number) ?? null,
    qdPercent: (c.qdPercent as number) ?? null,
    compensationPercent: (c.compensationPercent as number) ?? null,
    revenueSpentPercent: (c.revenueSpentPercent as number) ?? null,
    reservesMonths: (c.reservesMonths as number) ?? null,
    cyFinancialsAvailable: (c.cyFinancialsAvailable as string) ?? null,
    pyFinancialsAvailable: (c.pyFinancialsAvailable as string) ?? null,
    impactReportAvailable: (c.impactReportAvailable as string) ?? null,
    assuranceLevel: (c.assuranceLevel as string) ?? null,
    tierStatus: (c.tierStatus as string) ?? null,
    programPercent: (c.programPercent as number) ?? null,
    adminPercent: (c.adminPercent as number) ?? null,
    fundraisingPercent: (c.fundraisingPercent as number) ?? null,
    totalScore: (c.totalScore as number) ?? null,
    finalResult: (c.finalResult as string) ?? null,
    mandatoryComplianceThreshold: (c.mandatoryComplianceThreshold as string) ?? null,
    riskConcernFlag: (c.riskConcernFlag as string) ?? null,
    assessmentStatus: (c.assessmentStatus as string) ?? null,
    airtableRecordId: (c.airtableRecordId as string) ?? null,
    syncError,
  }
}

export function getRowCellValue(row: AssessmentSheetRow, field: string): string | number | null {
  return (row as unknown as Record<string, string | number | null>)[field] ?? null
}

export function formatSheetValue(
  value: string | number | null | undefined,
  format?: SheetColumn['format'],
): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'number') {
    if (format === 'percent') return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`
    if (format === 'currency') {
      return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }
  return String(value)
}
