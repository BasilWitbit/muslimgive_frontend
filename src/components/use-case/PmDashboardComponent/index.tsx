'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TypographyComponent } from '@/components/common/TypographyComponent'
import { usePageNavigationDismiss } from '@/hooks/use-page-navigation'
import { cn } from '@/lib/utils'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { Users, FileText, CheckCircle, Clock, type LucideIcon } from 'lucide-react'

type PmDashboardComponentProps = {
    metrics: any
}

const CHART_COLORS = ['#266DD3', '#5CD9F2', '#3B82E8', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#112133']

const premiumCardClass = 'overflow-hidden border-[#E8EEF5]/90 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(15,23,42,0.07)]'

type PremiumTooltipProps = {
    active?: boolean
    payload?: Array<{ name?: string; value?: number; color?: string }>
    label?: string
    variant?: 'bar' | 'donut'
}

const ChartTooltip = ({ active, payload, label, variant = 'bar' }: PremiumTooltipProps) => {
    if (!active || !payload?.length) return null

    const entry = payload[0]

    return (
        <div className="rounded-lg border border-[#E4E7EC] bg-white px-3 py-2">
            {variant === 'bar' && label ? (
                <p className="mb-0.5 text-xs font-medium text-[#667085]">{label}</p>
            ) : null}
            <div className="flex items-center gap-2">
                <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.color || '#266DD3' }}
                />
                <span className="text-sm font-semibold text-[#101928]">
                    {entry.name}: {entry.value}
                </span>
            </div>
        </div>
    )
}

const rechartsTooltipProps = {
    wrapperStyle: { outline: 'none', zIndex: 20 },
    contentStyle: {
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        padding: 0,
    },
    itemStyle: { padding: 0 },
    labelStyle: { padding: 0 },
}

type StatCardProps = {
    title: string
    value: React.ReactNode
    subtitle?: string
    icon: LucideIcon
    accent: string
    iconBg: string
}

const StatCard = ({ title, value, subtitle, icon: Icon, accent, iconBg }: StatCardProps) => (
    <Card className={cn(premiumCardClass, 'relative')}>
        <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', accent)} />
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-5">
            <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-[#667085]">{title}</CardTitle>
                <div className="text-3xl font-bold tracking-tight text-[#101928]">{value}</div>
                {subtitle ? <p className="text-xs text-[#98A2B3]">{subtitle}</p> : null}
            </div>
            <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', iconBg)}>
                <Icon className="h-5 w-5 text-[#266DD3]" />
            </div>
        </CardHeader>
    </Card>
)

type ChartShellProps = {
    title: string
    description: string
    children: React.ReactNode
    className?: string
}

const ChartShell = ({ title, description, children, className }: ChartShellProps) => (
    <Card className={cn(premiumCardClass, className)}>
        <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#101928]">{title}</CardTitle>
            <CardDescription className="text-sm text-[#667085]">{description}</CardDescription>
        </CardHeader>
        <CardContent className={cn('pt-2', className?.includes('h-') ? '' : 'pb-6')}>
            {children}
        </CardContent>
    </Card>
)

type DonutChartProps = {
    data: Array<{ name: string; value: number }>
    colors?: string[]
    centerLabel: string
    centerValue: string | number
    emptyMessage?: string
}

const DonutChart = ({
    data,
    colors = CHART_COLORS,
    centerLabel,
    centerValue,
    emptyMessage = 'No data available',
}: DonutChartProps) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const hasData = data.some((item) => item.value > 0)

    if (!hasData) {
        return (
            <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-[#E4E7EC] bg-[#FAFBFD] text-sm text-[#98A2B3]">
                {emptyMessage}
            </div>
        )
    }

    return (
        <div className="relative h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="46%"
                        innerRadius={68}
                        outerRadius={96}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={entry.name}
                                fill={colors[index % colors.length]}
                                opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                            />
                        ))}
                    </Pie>
                    <RechartsTooltip
                        {...rechartsTooltipProps}
                        content={<ChartTooltip variant="donut" />}
                        offset={24}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={40}
                        iconType="circle"
                        formatter={(value) => <span className="text-xs font-medium text-[#475467]">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
            {activeIndex === null ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8">
                    <div className="text-center">
                        <div className="text-2xl font-bold tracking-tight text-[#101928]">{centerValue}</div>
                        <div className="text-[11px] font-medium uppercase tracking-wide text-[#98A2B3]">{centerLabel}</div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

const PmDashboardComponent: React.FC<PmDashboardComponentProps> = ({ metrics }) => {
    usePageNavigationDismiss(!metrics)

    const statusChartData = useMemo(() => {
        if (!metrics?.statusDistribution) return []
        return Object.entries(metrics.statusDistribution).map(([key, value]) => ({
            name: key.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            count: value as number,
        }))
    }, [metrics?.statusDistribution])

    const assignmentPieData = [
        { name: 'Assigned', value: metrics?.assignmentMetrics?.assigned || 0 },
        { name: 'Unassigned', value: metrics?.assignmentMetrics?.unassigned || 0 },
    ]

    const progressPieData = [
        { name: 'Completed', value: metrics?.progressMetrics?.completed || 0 },
        { name: 'In Progress', value: metrics?.progressMetrics?.inProgress || 0 },
        { name: 'Not Started', value: metrics?.progressMetrics?.notStarted || 0 },
    ].filter((d) => d.value > 0)

    const eligibilityPieData = Object.entries(metrics?.eligibilityMetrics || {})
        .map(([key, value]) => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: value as number,
        }))
        .filter((d) => d.value > 0)

    const assignmentTotal = assignmentPieData.reduce((sum, item) => sum + item.value, 0)
    const progressTotal = progressPieData.reduce((sum, item) => sum + item.value, 0)
    const eligibilityTotal = eligibilityPieData.reduce((sum, item) => sum + item.value, 0)

    if (!metrics) {
        return null
    }

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 pb-10">
            <div className="space-y-1">
                <TypographyComponent variant="h4" className="text-[#101928] font-bold">
                    Project Management Dashboard
                </TypographyComponent>
                <p className="text-sm text-[#667085]">
                    Overview of charity assignments, progress, and eligibility across your portfolio.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total Charities"
                    value={metrics.totalCharities || 0}
                    subtitle="In your workspace"
                    icon={FileText}
                    accent="from-[#266DD3] via-[#5CD9F2] to-[#266DD3]"
                    iconBg="bg-[#EEF4FD]"
                />
                <StatCard
                    title="Assigned"
                    value={metrics.assignmentMetrics?.assigned || 0}
                    subtitle={`${metrics.assignmentMetrics?.unassigned || 0} unassigned`}
                    icon={Users}
                    accent="from-[#10B981] via-[#34D399] to-[#10B981]"
                    iconBg="bg-[#ECFDF3]"
                />
                <StatCard
                    title="In Progress"
                    value={metrics.progressMetrics?.inProgress || 0}
                    subtitle="Active assessments"
                    icon={Clock}
                    accent="from-[#3B82E8] via-[#60A5FA] to-[#3B82E8]"
                    iconBg="bg-[#EFF6FF]"
                />
                <StatCard
                    title="Completed"
                    value={metrics.progressMetrics?.completed || 0}
                    subtitle="Finished assessments"
                    icon={CheckCircle}
                    accent="from-[#8B5CF6] via-[#A78BFA] to-[#8B5CF6]"
                    iconBg="bg-[#F5F3FF]"
                />
            </div>

            <ChartShell
                title="Charity Status Overview"
                description="Distribution of charities across workflow stages"
            >
                {statusChartData.length === 0 ? (
                    <div className="flex h-[340px] items-center justify-center rounded-xl border border-dashed border-[#E4E7EC] bg-[#FAFBFD] text-sm text-[#98A2B3]">
                        No status data available
                    </div>
                ) : (
                    <div className="h-[340px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusChartData} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="pmBarGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#5CD9F2" />
                                        <stop offset="100%" stopColor="#266DD3" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#EEF2F6" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#667085', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={8}
                                />
                                <YAxis
                                    tick={{ fill: '#98A2B3', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <RechartsTooltip
                                    {...rechartsTooltipProps}
                                    content={<ChartTooltip variant="bar" />}
                                    cursor={false}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="url(#pmBarGradient)"
                                    radius={[8, 8, 0, 0]}
                                    maxBarSize={52}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </ChartShell>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <ChartShell
                    title="Assignment Distribution"
                    description="Assigned vs unassigned charities"
                >
                    <DonutChart
                        data={assignmentPieData}
                        colors={['#266DD3', '#E4E7EC']}
                        centerLabel="Total"
                        centerValue={assignmentTotal}
                    />
                </ChartShell>

                <ChartShell
                    title="Assessment Progress"
                    description="Completion status across charities"
                >
                    <DonutChart
                        data={progressPieData}
                        colors={['#10B981', '#3B82E8', '#D0D5DD']}
                        centerLabel="Total"
                        centerValue={progressTotal}
                        emptyMessage="No assessment progress data"
                    />
                </ChartShell>

                <ChartShell
                    title="Eligibility Overview"
                    description="Eligibility outcomes breakdown"
                >
                    <DonutChart
                        data={eligibilityPieData}
                        colors={CHART_COLORS.slice(2)}
                        centerLabel="Total"
                        centerValue={eligibilityTotal}
                        emptyMessage="No eligibility data"
                    />
                </ChartShell>
            </div>
        </div>
    )
}

export default PmDashboardComponent
