import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
    Banknote,
    Calendar,
    AlertTriangle,
    CreditCard,
    Wallet,
    History,
    ChevronDown,
    Activity
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLoan } from '@/hooks/use-loan';
import { loanServicingApi } from '@/services/loan-servicing-api';
import { EmiScheduleTable } from './emi-schedule-table';
import { TransactionTimeline } from './transaction-timeline';
import { PaymentModal } from './payment-modal';
import { PrepaymentModal } from './prepayment-modal';
import { ForeclosureModal } from './foreclosure-modal';

interface LoanDetailViewProps {
    loanId: number;
}

export function LoanDetailView({ loanId }: LoanDetailViewProps) {
    const { loan, schedule, transactions, loading, refetch } = useLoan(loanId);

    // UI State for Modals
    const [showPayEmi, setShowPayEmi] = useState(false);
    const [showPrepay, setShowPrepay] = useState(false);
    const [showForeclose, setShowForeclose] = useState(false);

    if (loading) {
        return <div className="space-y-4 p-4">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-4 gap-4">
                <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
            </div>
            <Skeleton className="h-96" />
        </div>;
    }

    if (!loan) return <div className="p-8 text-center">Loan not found.</div>;

    // Helper function for risk bucket descriptions
    const getRiskBucketDescription = (bucket: string) => {
        switch (bucket) {
            case 'CURRENT': return 'All payments on time';
            case 'SMA_0': return '1-30 days overdue';
            case 'SMA_1': return '31-60 days overdue';
            case 'SMA_2': return '61-90 days overdue';
            case 'NPA': return 'Non-Performing Asset (90+ days)';
            default: return '';
        }
    };

    // Derived State
    const nextEmi = schedule.find(s => s.status === 'PENDING' || s.status === 'DUE' || s.status === 'OVERDUE');
    const isOverdue = nextEmi?.status === 'OVERDUE' || loan.dpd > 0;

    // 5-Day Rule Logic: Enable Pay EMI only if today >= dueDate - 5 days
    // BUT if overdue, always enable.
    const isPaymentEnabled = () => {
        if (!nextEmi) return false;
        if (isOverdue) return true;

        const today = new Date();
        const dueDate = new Date(nextEmi.dueDate);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // return diffDays <= 5; // Enable if within 5 days
        return true; // Mocking true for visibility/testing. 
    };


    return (
        <div className="space-y-8 container mx-auto p-6 max-w-7xl animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs uppercase tracking-wider text-gray-500">Loan #{loan.loanId}</Badge>
                        {isOverdue && <Badge variant="destructive" className="animate-pulse">Action Required</Badge>}
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        {loan.isGroupLoan ? 'Group Loan' : 'Personal Loan'}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                        <span className={`inline-block w-2 h-2 rounded-full ${loan.loanStatus === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        Status: <span className="text-gray-900">{loan.loanStatus}</span>
                        <span className="mx-2">•</span>
                        Sanctioned: {new Date(loan.createdAt).toLocaleDateString()}
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400"
                        onClick={async () => {
                            try {
                                await loanServicingApi.runNightlyJob();
                                toast({ title: "Nightly Job Run", description: "Simulated one day passing. Penalties may apply." });
                                refetch();
                            } catch (e) {
                                toast({ variant: "destructive", title: "Failed", description: "Could not run job" });
                            }
                        }}
                    >
                        <History className="mr-2 h-4 w-4" /> Run Night Job
                    </Button>
                    <Button
                        onClick={() => setShowPayEmi(true)}
                        disabled={!isPaymentEnabled() || loan.loanStatus !== 'ACTIVE'}
                        className="bg-primary hover:bg-primary/90 shadow-lg shadow-blue-500/20 px-8"
                        size="lg"
                    >
                        <CreditCard className="mr-2 h-5 w-5" />
                        {isOverdue ? 'Pay Overdue Amount' : 'Pay Next EMI'}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="lg">More Options <ChevronDown className="ml-2 h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => setShowPrepay(true)} disabled={loan.loanStatus !== 'ACTIVE'}>
                                <Banknote className="mr-2 h-4 w-4" /> Prepay Loan
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowForeclose(true)} disabled={loan.loanStatus !== 'ACTIVE'} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                <AlertTriangle className="mr-2 h-4 w-4" /> Foreclose Account
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Progress Section */}
            <Card className="bg-slate-900 text-white border-none shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <CardContent className="p-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                        <div>
                            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Total Outstanding</p>
                            <div className="text-5xl font-bold tracking-tighter">
                                ₹{(loan.outstandingPrincipal ?? 0).toLocaleString()}
                            </div>
                            <p className="text-slate-400 text-sm mt-2">
                                of ₹{(loan.disbursedAmount ?? 0).toLocaleString()} Disbursed
                            </p>
                        </div>

                        <div className="col-span-2 space-y-4">
                            {(() => {
                                const total = loan.disbursedAmount || loan.totalPrincipal || loan.outstandingPrincipal || 1;
                                const outstanding = loan.outstandingPrincipal ?? 0;
                                // Fix: Ensure result is never negative using Math.max(0, ...)
                                const paid = Math.max(0, total - outstanding);
                                const percent = Math.min(100, Math.max(0, (paid / total) * 100));

                                return (
                                    <>
                                        <div className="flex justify-between text-sm font-medium">
                                            <span>Repayment Progress</span>
                                            <span>{Math.round(percent)}% Paid</span>
                                        </div>
                                        <Progress value={percent} className="h-3 bg-slate-700 [&>div]:bg-blue-500" />
                                        <div className="grid grid-cols-3 gap-4 text-center mt-4 pt-4 border-t border-slate-800">
                                            <div>
                                                <p className="text-slate-400 text-xs">Principal Paid</p>
                                                <p className="font-semibold text-lg">₹{paid.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-xs">Interest Paid</p>
                                                <p className="font-semibold text-lg">
                                                    ₹{transactions
                                                        .reduce((sum, t) => sum + (t.interestComponent || 0), 0)
                                                        .toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-xs">Remaining Tenure</p>
                                                <p className="font-semibold text-lg">
                                                    {schedule.filter(s => s.status !== 'COMPLETED' && s.status !== 'PAID').length} Months
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Upcoming Payment</CardTitle>
                        <Calendar className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">₹{(loan.monthlyEmi ?? 0).toLocaleString()}</div>
                        <div className="flex items-center mt-1">
                            {nextEmi ? (
                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                    Due: {new Date(nextEmi.dueDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long' })}
                                </span>
                            ) : (
                                <span className="text-xs text-gray-500">No upcoming payments</span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Risk Profile</CardTitle>
                        <Activity className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{loan.riskBucket?.replace('_', ' ') || 'Normal'}</div>
                        <p className="text-xs text-gray-500 mt-1">
                            {getRiskBucketDescription(loan.riskBucket)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            DPD: <span className={loan.dpd > 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>{loan.dpd} Days</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Penalties</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${loan.outstandingPenalty > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            ₹{(loan.outstandingPenalty ?? 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Accumulated fines</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs content */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-gray-100 p-1 rounded-lg w-full max-w-md grid grid-cols-3">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">Overview</TabsTrigger>
                    <TabsTrigger value="schedule" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">Schedule</TabsTrigger>
                    <TabsTrigger value="transactions" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">History</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <Card>
                        <CardHeader>
                            <CardTitle>Loan Details & Terms</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-semibold text-xs uppercase text-gray-400 mb-4 tracking-wider">Financial Specifics</h4>
                                <dl className="space-y-4">
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <dt className="text-gray-600 text-sm">Disbursed Amount</dt>
                                        <dd className="font-medium text-gray-900">₹{(loan.disbursedAmount ?? 0).toLocaleString()}</dd>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <dt className="text-gray-600 text-sm">Interest Rate</dt>
                                        <dd className="font-medium text-gray-900">{loan.interestRate ?? 0}% p.a.</dd>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <dt className="text-gray-600 text-sm">Penal Interest Rate</dt>
                                        <dd className="font-medium text-red-600">{loan.penalInterestRate ?? 0}% p.a.</dd>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <dt className="text-gray-600 text-sm">Total Interest Payable</dt>
                                        <dd className="font-medium text-gray-900">₹{(loan.totalInterest ?? 0).toLocaleString()}</dd>
                                    </div>
                                </dl>
                            </div>
                            <div>
                                <h4 className="font-semibold text-xs uppercase text-gray-400 mb-4 tracking-wider">Dates & Tenure</h4>
                                <dl className="space-y-4">
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <dt className="text-gray-600 text-sm">Start Date</dt>
                                        <dd className="font-medium text-gray-900">{new Date(loan.startDate).toLocaleDateString()}</dd>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <dt className="text-gray-600 text-sm">End Date</dt>
                                        <dd className="font-medium text-gray-900">{new Date(loan.endDate).toLocaleDateString()}</dd>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <dt className="text-gray-600 text-sm">Original Tenure</dt>
                                        <dd className="font-medium text-gray-900">{loan.originalTenureMonths} Months</dd>
                                    </div>
                                </dl>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="schedule" className="animate-in slide-in-from-bottom-4 duration-500">
                    <Card className="border shadow-sm overflow-hidden">
                        <EmiScheduleTable schedule={schedule} onPay={() => setShowPayEmi(true)} />
                    </Card>
                </TabsContent>

                <TabsContent value="transactions" className="animate-in slide-in-from-bottom-4 duration-500">
                    <Card className="border shadow-sm">
                        <CardContent className="p-6">
                            <TransactionTimeline transactions={transactions} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modals */}
            {showPayEmi && (
                <PaymentModal
                    loanId={loan.loanId}
                    amountDue={nextEmi ? nextEmi.emiAmount + (nextEmi.penaltyComponent || 0) : 0}
                    type={isOverdue ? 'OVERDUE' : 'EMI'}
                    open={showPayEmi}
                    onOpenChange={setShowPayEmi}
                    onSuccess={refetch}
                />
            )}

            {showPrepay && (
                <PrepaymentModal
                    loan={loan}
                    open={showPrepay}
                    onOpenChange={setShowPrepay}
                    onSuccess={refetch}
                />
            )}

            {showForeclose && (
                <ForeclosureModal
                    loan={loan}
                    open={showForeclose}
                    onOpenChange={setShowForeclose}
                    onSuccess={refetch}
                />
            )}
        </div>
    );
}
