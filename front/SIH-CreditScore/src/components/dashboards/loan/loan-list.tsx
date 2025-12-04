'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Landmark, AlertCircle } from 'lucide-react';
import { LoanCard } from './loan-card';
import { loanService } from '@/services/loan-service';
import type { Loan } from '@/types/loan-types';
import { useToast } from '@/hooks/use-toast';

interface LoanListProps {
    onPayNow: (loan: Loan) => void;
    onViewDetails: (loan: Loan) => void;
    activeOnly?: boolean;
}

export function LoanList({ onPayNow, onViewDetails, activeOnly = false }: LoanListProps) {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchLoans = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = activeOnly
                ? await loanService.getActiveLoans()
                : await loanService.getMyLoans();
            setLoans(data);
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || 'Failed to load loans';
            setError(errorMessage);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, [activeOnly]);

    if (loading) {
        return (
            <Card className="border-0 shadow-lg">
                <CardContent className="flex items-center justify-center py-16">
                    <div className="text-center space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                        <p className="text-muted-foreground">Loading your loans...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border-0 shadow-lg border-red-200 bg-red-50/50">
                <CardContent className="flex items-center justify-center py-16">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-red-900">Failed to Load Loans</h3>
                            <p className="text-red-700 mt-2">{error}</p>
                        </div>
                        <Button
                            onClick={fetchLoans}
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-100"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (loans.length === 0) {
        return (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
                <CardContent className="flex items-center justify-center py-16">
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                            <Landmark className="h-10 w-10 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                                {activeOnly ? 'No Active Loans' : 'No Loans Yet'}
                            </h3>
                            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                                {activeOnly
                                    ? 'You don\'t have any active loans at the moment.'
                                    : 'You haven\'t taken any loans yet. Apply for a loan to get started.'}
                            </p>
                        </div>
                        <Button
                            onClick={() => window.location.href = '/dashboard?tab=apply-loan'}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Apply for a Loan
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Landmark className="h-6 w-6" />
                                {activeOnly ? 'Active Loans' : 'My Loans'}
                            </CardTitle>
                            <CardDescription className="text-blue-100 mt-1">
                                {loans.length} {loans.length === 1 ? 'loan' : 'loans'} found
                            </CardDescription>
                        </div>
                        <Button
                            onClick={fetchLoans}
                            variant="outline"
                            size="sm"
                            className="border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Loan Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loans.map((loan) => (
                    <LoanCard
                        key={loan.loanId}
                        loan={loan}
                        onPayNow={onPayNow}
                        onViewDetails={onViewDetails}
                    />
                ))}
            </div>
        </div>
    );
}
