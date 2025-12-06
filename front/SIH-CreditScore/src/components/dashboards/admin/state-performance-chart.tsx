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
import type { StatePerformance } from '@/services/loan-portfolio-service';

interface StatePerformanceChartProps {
    data: StatePerformance[];
}

export function StatePerformanceChart({ data }: StatePerformanceChartProps) {
    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        return `₹${value}`;
    };

    // Sort by AUM (descending) and take top 5 to avoid clutter
    const topStates = [...data]
        .sort((a, b) => b.totalAum - a.totalAum)
        .slice(0, 5);

    return (
        <Card className="shadow-md h-full">
            <CardHeader>
                <CardTitle>Top Markets (AUM)</CardTitle>
                <CardDescription>Top 5 States by Asset Size</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={topStates}
                            layout="vertical"
                            margin={{
                                top: 5,
                                right: 30,
                                left: 40, // Increased left margin for state names
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tickFormatter={formatCurrency} />
                            <YAxis
                                type="category"
                                dataKey="state"
                                width={100} // Ensure enough width for labels
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload as StatePerformance;
                                        return (
                                            <div className="bg-white dark:bg-slate-800 p-3 border rounded-lg shadow-lg text-sm">
                                                <p className="font-bold mb-1">{label}</p>
                                                <p className="text-blue-600">AUM: {formatCurrency(data.totalAum)}</p>
                                                <p className="text-red-500">NPA Rate: {data.npaRate}%</p>
                                                <p className="text-gray-500">Active Loans: {data.activeLoans}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend />
                            <Bar dataKey="totalAum" name="AUM" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                {topStates.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`hsl(220, 70%, ${50 + index * 5}%)`} /> // Gradient blue
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
