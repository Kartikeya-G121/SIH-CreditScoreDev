'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Landmark, Filter, CheckCircle2, AlertCircle, XCircle, ChevronRight } from 'lucide-react';
// import { LoanCard } from './loan-card'; // Deprecating LoanCard component in favor of inline design
import { useLoans } from '@/hooks/use-loans';
import { LoanResponse } from '@/types/loan-servicing-types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface LoanListProps {
    onPayNow: (loan: LoanResponse) => void;
    onViewDetails: (loan: LoanResponse) => void;
    activeOnly?: boolean;
}

export function LoanList({ onPayNow, onViewDetails, activeOnly = false }: LoanListProps) {
    const { loans, loading, refetch, error } = useLoans(activeOnly);
    const [filterStatus, setFilterStatus] = useState<string>('ACTIVE');
    const [filterType, setFilterType] = useState<string>('ALL');

    const filteredLoans = useMemo(() => {
        return loans.filter(loan => {
            if (activeOnly && loan.loanStatus !== 'ACTIVE' && loan.loanStatus !== 'OVERDUE') return false;

            // Status Filter
            if (filterStatus === 'OVERDUE' && loan.dpd <= 0) return false;
            if (filterStatus !== 'ALL' && filterStatus !== 'OVERDUE' && loan.loanStatus !== filterStatus) return false;

            // Type Filter
            if (filterType === 'INDIVIDUAL' && loan.isGroupLoan) return false;
            if (filterType === 'GROUP' && !loan.isGroupLoan) return false;

            return true;
        });
    }, [loans, activeOnly, filterStatus, filterType]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-600">
                <p>Error loading loans: {error}</p>
                <Button variant="outline" onClick={refetch} className="mt-4">Retry</Button>
            </div>
        );
    }

    if (!loading && loans.length === 0) {
        return (
            <Card className="border-0 shadow-lg bg-gray-50/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                        <Landmark className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold">No loans found</h3>
                    <p className="text-muted-foreground mt-2 mb-6">You don't have any loans matching the criteria.</p>
                    <Button onClick={() => window.location.href = '/dashboard?tab=apply-loan'}>Apply for Loan</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            {/* Header & Controls */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Your Portfolio</h2>
                        <p className="text-muted-foreground text-sm">{filteredLoans.length} Active Accounts</p>
                    </div>

                    <div className="flex gap-2 items-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="rounded-full">
                                    <Filter className="mr-2 h-4 w-4" /> Filter Status
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Loan Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup value={filterStatus} onValueChange={setFilterStatus}>
                                    <DropdownMenuRadioItem value="ALL">All Statuses</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="ACTIVE">Active</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="OVERDUE">Overdue (Action Req)</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="CLOSED">Closed/Foreclosed</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="ghost" size="icon" onClick={() => refetch()} className="rounded-full hover:bg-gray-100">
                            <RefreshCw className="h-4 w-4 text-gray-600" />
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="ALL" onValueChange={(val) => setFilterType(val)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto bg-gray-100/80 p-1 rounded-full">
                        <TabsTrigger value="ALL" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">All Loans</TabsTrigger>
                        <TabsTrigger value="INDIVIDUAL" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Individual</TabsTrigger>
                        <TabsTrigger value="GROUP" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm">Group</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Loan Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredLoans.map((loan) => {
                    const isOverdue = loan.loanStatus === 'OVERDUE' || ((loan.dpd || 0) > 0);
                    const isNPA = ['SMA_1', 'SMA_2', 'NPA'].includes(loan.riskBucket);

                    return (
                        <Card
                            key={loan.loanId}
                            className={`group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-l-4 ${isOverdue ? 'border-l-red-500' : isNPA ? 'border-l-yellow-500' : 'border-l-green-500'
                                }`}
                        >
                            <CardHeader className="pb-3 bg-gradient-to-r from-transparent to-gray-50/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Loan #{loan.loanId}
                                            </p>
                                            {isOverdue && (
                                                <Badge variant="destructive" className="h-5 px-1.5 text-[10px] animate-pulse">Overdue</Badge>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge
                                                variant={isOverdue ? "destructive" : "outline"}
                                                className={!isOverdue && loan.loanStatus === 'ACTIVE' ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200" : ""}
                                            >
                                                {loan.loanStatus}
                                            </Badge>

                                            {/* Risk Bucket Badge */}
                                            {loan.riskBucket && loan.riskBucket !== 'CURRENT' && (
                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                    {loan.riskBucket.replace('_', ' ')}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-gray-900 tracking-tight">
                                            ₹{(loan.outstandingPrincipal ?? 0).toLocaleString()}
                                        </p>
                                        <p className="text-[10px] uppercase font-semibold text-gray-400">Outstanding</p>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4 pt-4">
                                {/* Key Metrics Grid */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <p className="text-gray-500 text-xs mb-1 font-medium">Monthly EMI</p>
                                        <p className="font-bold text-gray-800 text-base">
                                            ₹{(loan.monthlyEmi ?? 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-lg border ${loan.nextPaymentDate ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                                        <p className="text-gray-500 text-xs mb-1 font-medium">Next Due</p>
                                        <p className={`font-bold text-base ${loan.nextPaymentDate ? 'text-blue-700' : 'text-gray-800'}`}>
                                            {loan.nextPaymentDate ? new Date(loan.nextPaymentDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {/* Overdue/Important Notice */}
                                {isOverdue && (
                                    <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 p-2.5 rounded-md border border-red-100 animate-in fade-in slide-in-from-bottom-2">
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <span className="font-medium leading-tight">
                                            Overdue by {loan.dpd} days. Immediate payment required to avoid penalties.
                                        </span>
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="pt-0 pb-4">
                                <Button
                                    className="w-full bg-gray-900 hover:bg-black text-white shadow transition-all duration-200 hover:scale-[1.01]"
                                    onClick={() => onViewDetails(loan)}
                                >
                                    View Details <ChevronRight className="ml-2 h-4 w-4 opacity-70" />
                                </Button>
                                {/* 'Pay Now' removed as per request */}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {filteredLoans.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-sm mb-4">
                        <Filter className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">No loans found</h3>
                    <p className="text-muted-foreground mt-1 mb-6 max-w-sm mx-auto">None of your loans match the current filters.</p>
                    <Button variant="outline" onClick={() => setFilterStatus('ALL')}>Clear Filters</Button>
                </div>
            )}
        </div>
    );
}
