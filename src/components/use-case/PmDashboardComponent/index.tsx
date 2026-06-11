'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TypographyComponent } from '@/components/common/TypographyComponent'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { Users, FileText, CheckCircle, Clock } from 'lucide-react'

type PmDashboardComponentProps = {
    metrics: any;
}

const COLORS = ['#266DD3', '#5CD9F2', '#F25CD4', '#F25F5C', '#5CF269', '#112133', '#FFBB28', '#FF8042']

const PmDashboardComponent: React.FC<PmDashboardComponentProps> = ({ metrics }) => {

    const statusChartData = useMemo(() => {
        if (!metrics?.statusDistribution) return [];
        return Object.entries(metrics.statusDistribution).map(([key, value]) => ({
            name: key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            count: value
        }))
    }, [metrics?.statusDistribution])

    const assignmentPieData = [
        { name: 'Assigned', value: metrics?.assignmentMetrics?.assigned || 0 },
        { name: 'Unassigned', value: metrics?.assignmentMetrics?.unassigned || 0 }
    ]

    const progressPieData = [
        { name: 'Completed', value: metrics?.progressMetrics?.completed || 0 },
        { name: 'In Progress', value: metrics?.progressMetrics?.inProgress || 0 },
        { name: 'Not Started', value: metrics?.progressMetrics?.notStarted || 0 }
    ].filter(d => d.value > 0)

    const eligibilityPieData = Object.entries(metrics?.eligibilityMetrics || {}).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: value as number
    })).filter(d => d.value > 0)

    if (!metrics) {
        return <div className="p-10 flex justify-center text-[#666E76]">Loading dashboard metrics...</div>
    }



    return (
        <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <TypographyComponent variant="h4" className="text-[#101928] font-bold">
                    Project Management Dashboard
                </TypographyComponent>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Charities</CardTitle>
                        <FileText className="h-4 w-4 text-[#666E76]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalCharities || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Assigned vs Unassigned</CardTitle>
                        <Users className="h-4 w-4 text-[#666E76]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{metrics.assignmentMetrics?.assigned || 0} <span className="text-sm text-gray-500 font-normal">/ {metrics.assignmentMetrics?.unassigned || 0}</span></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <Clock className="h-4 w-4 text-[#666E76]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{metrics.progressMetrics?.inProgress || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-[#666E76]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{metrics.progressMetrics?.completed || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Charity Status Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7EC" />
                                <XAxis dataKey="name" tick={{ fill: '#666E76', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#666E76', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <RechartsTooltip 
                                    cursor={{fill: '#F9FAFB'}} 
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #E4E7EC', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" fill="#266DD3" radius={[4, 4, 0, 0]} maxBarSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Assignment Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={assignmentPieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {assignmentPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Eligibility Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={eligibilityPieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {eligibilityPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default PmDashboardComponent
