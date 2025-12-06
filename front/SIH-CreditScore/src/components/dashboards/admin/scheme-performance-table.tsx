'use client';

import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { loanPortfolioService, type SchemePerformanceStats } from '@/services/loan-portfolio-service';

interface SchemePerformanceTableProps {
    data: SchemePerformanceStats[];
    onRefresh?: () => void;
}

export function SchemePerformanceTable({ data, onRefresh }: SchemePerformanceTableProps) {
    const { toast } = useToast();
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [localData, setLocalData] = useState<SchemePerformanceStats[]>(data);

    // Sync local data with prop data when it changes
    useEffect(() => {
        setLocalData(data);
    }, [data]);

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
        return `₹${value.toFixed(0)}`;
    };

    const handleToggle = async (schemeId: number, currentStatus: boolean) => {
        // Optimistic update
        const originalData = [...localData];
        setLocalData(prevData =>
            prevData.map(scheme =>
                scheme.schemeId === schemeId
                    ? { ...scheme, isActive: !currentStatus }
                    : scheme
            )
        );

        try {
            setTogglingId(schemeId);
            await loanPortfolioService.toggleScheme(schemeId);
            toast({
                title: "Scheme Status Updated",
                description: `Scheme ${!currentStatus ? 'activated' : 'deactivated'} successfully.`,
            });
            if (onRefresh) {
                onRefresh();
            }
        } catch (error) {
            // Revert changes on error
            setLocalData(originalData);
            toast({
                title: "Error",
                description: "Failed to toggle scheme status.",
                variant: "destructive"
            });
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Scheme Performance</CardTitle>
                <CardDescription>Profitability and Risk Metrics by Loan Product</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Scheme Name</TableHead>
                            <TableHead className="text-right">Active Loans</TableHead>
                            <TableHead className="text-right">Total AUM</TableHead>
                            <TableHead className="text-right">Avg ROI</TableHead>
                            <TableHead className="text-right">NPA Rate</TableHead>
                            <TableHead className="text-center">Performance</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {localData.map((scheme) => (
                            <TableRow key={scheme.schemeName}>
                                <TableCell className="font-medium text-nowrap">
                                    <div className="flex flex-col">
                                        <span>{scheme.schemeName}</span>
                                        <span className="text-xs text-muted-foreground">ID: {scheme.schemeId}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">{scheme.activeLoans}</TableCell>
                                <TableCell className="text-right">{formatCurrency(scheme.totalAum)}</TableCell>
                                <TableCell className="text-right text-green-600 font-medium">{scheme.averageRoi.toFixed(2)}%</TableCell>
                                <TableCell className="text-right">
                                    <span className={scheme.npaRate > 5 ? 'text-red-500 font-bold' : 'text-slate-600'}>
                                        {scheme.npaRate.toFixed(2)}%
                                    </span>
                                </TableCell>
                                <TableCell className="text-center">
                                    {scheme.npaRate < 2 ? (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Excellent</Badge>
                                    ) : scheme.npaRate < 5 ? (
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Moderate</Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">High Risk</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="flex items-center gap-2" title="Toggle Scheme Status">
                                            <Switch
                                                checked={scheme.isActive}
                                                onCheckedChange={() => handleToggle(scheme.schemeId, scheme.isActive)}
                                                disabled={togglingId === scheme.schemeId}
                                            />
                                            {togglingId === scheme.schemeId && <Loader2 className="h-3 w-3 animate-spin" />}
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
