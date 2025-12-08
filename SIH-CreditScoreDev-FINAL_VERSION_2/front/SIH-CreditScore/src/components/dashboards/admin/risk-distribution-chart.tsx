'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { RiskBucketStats } from '@/services/loan-portfolio-service';

interface RiskDistributionChartProps {
    data: RiskBucketStats[];
}

const COLORS = {
    'CURRENT': '#22c55e', // Green
    'SMA_0': '#eab308',   // Yellow
    'SMA_1': '#f97316',   // Orange
    'SMA_2': '#ef4444',   // Red
    'NPA': '#b91c1c'      // Dark Red
};

export function RiskDistributionChart({ data }: RiskDistributionChartProps) {
    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        return `₹${value}`;
    };

    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Portfolio Quality Analysis</CardTitle>
                <CardDescription>Loan volume by Risk Category (DPD Buckets)</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="riskBucket" />
                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" name="Principal" tickFormatter={formatCurrency} />
                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" name="Count" />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white dark:bg-slate-800 p-3 border rounded-lg shadow-lg text-sm">
                                                <p className="font-bold mb-1">{label}</p>
                                                <p className="text-blue-600">Principal: {formatCurrency(Number(payload[0].value))}</p>
                                                <p className="text-green-600">Count: {payload[1].value}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="totalPrincipal" name="Total Principal" radius={[4, 4, 0, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.riskBucket as keyof typeof COLORS] || '#8884d8'} />
                                ))}
                            </Bar>
                            <Bar yAxisId="right" dataKey="loanCount" name="Loan Count" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
