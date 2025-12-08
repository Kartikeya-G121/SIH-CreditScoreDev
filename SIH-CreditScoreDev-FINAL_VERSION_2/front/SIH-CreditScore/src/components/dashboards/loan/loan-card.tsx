'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { IndianRupee, Calendar, TrendingDown, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import type { Loan } from '@/types/loan-types';
import { cn } from '@/lib/utils';

interface LoanCardProps {
    loan: Loan;
    onPayNow: (loan: Loan) => void;
    onViewDetails: (loan: Loan) => void;
}

const getStatusConfig = (status: Loan['loanStatus']) => {
    switch (status) {
        case 'ACTIVE':
            return {
                label: 'Active',
                gradient: 'from-green-500 to-emerald-600',
                icon: CheckCircle2,
                badgeClass: 'bg-green-100 text-green-700 border-green-200',
            };
        case 'OVERDUE':
            return {
                label: 'Overdue',
                gradient: 'from-orange-500 to-amber-600',
                icon: AlertCircle,
                badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
            };
        case 'CLOSED':
            return {
                label: 'Closed',
                gradient: 'from-blue-500 to-cyan-600',
                icon: CheckCircle2,
                badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
            };
        case 'DEFAULTED':
            return {
                label: 'Defaulted',
                gradient: 'from-red-500 to-rose-600',
                icon: XCircle,
                badgeClass: 'bg-red-100 text-red-700 border-red-200',
            };
        case 'FORECLOSED':
            return {
                label: 'Foreclosed',
                gradient: 'from-gray-500 to-slate-600',
                icon: XCircle,
                badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
            };
        case 'WAIVED_OFF':
            return {
                label: 'Waived Off',
                gradient: 'from-purple-500 to-violet-600',
                icon: CheckCircle2,
                badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
            };
        default:
            return {
                label: status,
                gradient: 'from-gray-500 to-slate-600',
                icon: AlertCircle,
                badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
            };
    }
};

export function LoanCard({ loan, onPayNow, onViewDetails }: LoanCardProps) {
    const statusConfig = getStatusConfig(loan.loanStatus);
    const StatusIcon = statusConfig.icon;

    // Calculate repayment progress
    const repaymentProgress = loan.totalPrincipal > 0
        ? ((loan.totalPrincipal - loan.outstandingPrincipal) / loan.totalPrincipal) * 100
        : 0;

    const isActive = loan.loanStatus === 'ACTIVE' || loan.loanStatus === 'OVERDUE';

    // Format date
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <Card className={cn(
            "overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
            "bg-gradient-to-br",
            statusConfig.gradient,
            "text-white relative group"
        )}>
            {/* Animated background effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-white/10" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition-opacity" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />

            <CardContent className="relative p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            <IndianRupee className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">
                                {loan.isGroupLoan ? `Group Loan` : 'Personal Loan'} #{loan.loanId}
                            </h3>
                            {loan.isGroupLoan && loan.groupName && (
                                <p className="text-xs text-white/80">{loan.groupName}</p>
                            )}
                        </div>
                    </div>
                    <Badge className={cn("border", statusConfig.badgeClass)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                    </Badge>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-white/90">Repayment Progress</span>
                        <span className="font-semibold">{repaymentProgress.toFixed(1)}%</span>
                    </div>
                    <Progress value={repaymentProgress} className="h-2 bg-white/20">
                        <div
                            className="h-full bg-white rounded-full transition-all duration-500"
                            style={{ width: `${repaymentProgress}%` }}
                        />
                    </Progress>
                    <div className="flex justify-between text-xs text-white/80">
                        <span>Paid: ₹{(loan.totalPrincipal - loan.outstandingPrincipal).toLocaleString('en-IN')}</span>
                        <span>Outstanding: ₹{loan.outstandingPrincipal.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                {/* Loan Details Grid */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-white/80 text-xs">
                            <TrendingDown className="h-3 w-3" />
                            <span>Monthly EMI</span>
                        </div>
                        <p className="text-xl font-bold flex items-center">
                            <IndianRupee className="h-4 w-4" />
                            {loan.monthlyEmi.toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-white/80 text-xs">
                            <Calendar className="h-3 w-3" />
                            <span>Next Payment</span>
                        </div>
                        <p className="text-sm font-semibold">
                            {formatDate(loan.nextPaymentDate)}
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                    {isActive && (
                        <Button
                            onClick={() => onPayNow(loan)}
                            className="flex-1 bg-white/95 hover:bg-white text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            <IndianRupee className="h-4 w-4 mr-1" />
                            Pay Now
                        </Button>
                    )}
                    <Button
                        onClick={() => onViewDetails(loan)}
                        variant="outline"
                        className={cn(
                            "border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm",
                            !isActive && "flex-1"
                        )}
                    >
                        View Details
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
