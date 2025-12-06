import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { loanServicingApi } from '@/services/loan-servicing-api';
import { PortfolioSummary } from '@/types/loan-servicing-types';
import { Loader2, PieChart, AlertTriangle, TrendingDown } from "lucide-react";
import { toast } from '@/hooks/use-toast';

export function AdminLoanPortfolio() {
    const [summary, setSummary] = useState<PortfolioSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPortfolio();
    }, []);

    const fetchPortfolio = async () => {
        try {
            const data = await loanServicingApi.getPortfolioSummary();
            setSummary(data);
        } catch (error) {
            console.error("Failed to fetch portfolio summary", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not load portfolio summary."
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!summary) return <div>No data available.</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Loan Portfolio</h2>

            {/* Top Stat Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
                        <PieChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalLoans}</div>
                        <p className="text-xs text-muted-foreground">Active: {summary.activeLoans} | Closed: {summary.closedLoans}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                         <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{summary.totalOutstandingPrincipal.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">NPA Ratio</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{summary.npaPercentage.toFixed(2)}%</div>
                         <p className="text-xs text-muted-foreground">Target: &lt; 2%</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">NPA Accounts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{summary.riskBucketCounts['NPA'] || 0}</div>
                         <p className="text-xs text-muted-foreground">Outstanding: ₹{summary.totalNpaOutstanding.toLocaleString()}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Risk Buckets Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Risk Buckets Analysis</CardTitle>
                    <CardDescription>Classification of loans based on days past due (DPD).</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bucket</TableHead>
                                <TableHead>DPD Range</TableHead>
                                <TableHead>Loan Count</TableHead>
                                <TableHead>Total Outstanding</TableHead>
                                <TableHead>Risk Level</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(summary.riskBucketCounts).map(([bucket, count]: any) => (
                                <TableRow key={bucket}>
                                    <TableCell className="font-medium">{bucket}</TableCell>
                                    <TableCell>{getDpdRange(bucket)}</TableCell>
                                    <TableCell>{count}</TableCell>
                                    <TableCell>-</TableCell> {/* Detail breakdown not in summary DTO */}
                                    <TableCell>
                                        <Badge variant={getBadgeVariant(bucket) as any}>
                                            {bucket === 'CURRENT' ? 'Normal' : bucket === 'NPA' ? 'Critical' : 'Warning'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function getBadgeVariant(bucket: string) {
    if (bucket === 'CURRENT') return 'secondary'; // Valid badge variant for shadcn usually includes 'default', 'secondary', 'destructive', 'outline'
    if (bucket === 'NPA') return 'destructive';
    return 'outline';
}

function getDpdRange(bucket: string) {
    switch (bucket) {
        case 'CURRENT': return '0 Days';
        case 'SMA_0': return '1-30 Days';
        case 'SMA_1': return '31-60 Days';
        case 'SMA_2': return '61-90 Days';
        case 'NPA': return '> 90 Days';
        default: return '-';
    }
}
