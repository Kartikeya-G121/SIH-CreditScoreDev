'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface RepaymentScheduleDTO {
    installmentNumber: number;
    dueDate: string;
    emiAmount: number;
    principalComponent: number;
    interestComponent: number;
    penaltyComponent: number;
    paidDate?: string;
    status: string;
}

interface RepaymentLineChartProps {
    data: RepaymentScheduleDTO[];
}

export function RepaymentLineChart({ data }: RepaymentLineChartProps) {
    // Transform data for the chart: Plotting Dates as timestamps
    const chartData = data.map(item => ({
        installment: item.installmentNumber,
        // Convert dates to timestamps for numerical plotting
        scheduledTimestamp: new Date(item.dueDate).getTime(),
        actualTimestamp: item.paidDate ? new Date(item.paidDate).getTime() : null,
        // Keep string versions for tooltip display
        checkDate: item.dueDate,
        paidDateDisplay: item.paidDate || 'Not Paid',
        status: item.status,
        amount: item.emiAmount
    }));

    const formatDate = (timestamp: number) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: '2-digit'
        });
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-200 shadow-md rounded-md text-sm">
                    <p className="font-semibold mb-1">Installment #{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-1" style={{ color: entry.color }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span>{entry.name}: </span>
                            <span className="font-medium">
                                {entry.value ? formatDate(entry.value) : 'N/A'}
                            </span>
                        </div>
                    ))}
                    {payload[0] && payload[0].payload && (
                        <div className="mt-2 text-xs text-muted-foreground border-t pt-1">
                            <p>Status: {payload[0].payload.status}</p>
                            <p>Amount: ₹{payload[0].payload.amount.toFixed(2)}</p>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="col-span-4 border-none shadow-none">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-base font-medium">Repayment Timeliness Analysis</CardTitle>
                <CardDescription>
                    Comparing Scheduled Due Dates vs. Actual Payment Dates.
                    <br />
                    <span className="text-xs text-muted-foreground">
                        • Overlapping lines = On Time payment
                        <br />
                        • Red line (Actual) above Green (Scheduled) = Late payment
                    </span>
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis
                                dataKey="installment"
                                label={{ value: 'Installment #', position: 'insideBottom', offset: -10, fontSize: 12 }}
                                tickLine={false}
                                axisLine={{ stroke: '#e5e7eb' }}
                                fontSize={12}
                            />
                            <YAxis
                                domain={['auto', 'auto']}
                                tickFormatter={formatDate}
                                type="number"
                                width={80}
                                tickLine={false}
                                axisLine={false}
                                fontSize={11}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Line
                                name="Scheduled Date"
                                type="monotone"
                                dataKey="scheduledTimestamp"
                                stroke="#16a34a" // Green
                                strokeWidth={2}
                                dot={{ r: 3, fill: "#16a34a" }}
                                connectNulls
                            />
                            <Line
                                name="Actual Payment"
                                type="monotone"
                                dataKey="actualTimestamp"
                                stroke="#dc2626" // Red
                                strokeWidth={2}
                                dot={{ r: 4, fill: "#dc2626" }}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
