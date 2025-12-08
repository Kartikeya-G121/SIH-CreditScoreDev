'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Wallet, ShieldAlert, TrendingDown, TrendingUp, Search, Filter, MapPin, ArrowUpRight, ArrowDownRight, Eye } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { loanPortfolioService, LoanResponse } from '@/services/loan-portfolio-service';
import type { PortfolioAnalyticsResponse, LoanSearchCriteria } from '@/services/loan-portfolio-service';
import { RiskDistributionChart } from './risk-distribution-chart';
import { SchemePerformanceTable } from './scheme-performance-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RepaymentLineChart } from './repayment-line-chart';
import { StatePerformanceChart } from './state-performance-chart';
import { GeographicRiskMap } from './geographic-risk-map';

import { DemographicsCharts } from './demographics-charts';

export default function LoanPortfolioDashboard() {
    const { toast } = useToast();
    const [analytics, setAnalytics] = useState<PortfolioAnalyticsResponse | null>(null);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchStatus, setSearchStatus] = useState<string>('all');
    const [searchRisk, setSearchRisk] = useState<string>('all');
    const [searchState, setSearchState] = useState<string>('all');
    const [loans, setLoans] = useState<LoanResponse[]>([]);
    const [isLoadingLoans, setIsLoadingLoans] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Detail View State
    const [selectedLoan, setSelectedLoan] = useState<LoanResponse | null>(null);
    const [repaymentSchedule, setRepaymentSchedule] = useState<any[]>([]);
    const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const loadAnalytics = async () => {
        try {
            setIsLoadingAnalytics(true);
            const data = await loanPortfolioService.getPortfolioAnalytics();
            setAnalytics(data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load portfolio analytics',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingAnalytics(false);
        }
    };

    const searchLoans = async (resetPage = false) => {
        try {
            setIsLoadingLoans(true);
            const currentPage = resetPage ? 0 : page;
            if (resetPage) setPage(0);

            const criteria: LoanSearchCriteria = {
                query: searchQuery,
                status: searchStatus !== 'all' ? searchStatus : undefined,
                state: searchState !== 'all' ? searchState : undefined,
                riskBucket: searchRisk !== 'all' ? searchRisk : undefined,
                page: currentPage,
                size: 10,
                sortDir: 'desc'
            };

            const response = await loanPortfolioService.searchLoans(criteria);
            setLoans(response.content);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error(error);
            toast({
                title: 'Search Failed',
                description: 'Could not fetch loans with current filters',
                variant: 'destructive'
            });
        } finally {
            setIsLoadingLoans(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
        searchLoans(true);
    }, []);

    useEffect(() => {
        if (analytics) { // Only auto-search if not initial load (initial load handled by mount effect)
            searchLoans(false);
        }
    }, [page]);

    const handleRefresh = async () => {
        try {
            setIsRefreshing(true);
            await loanPortfolioService.refreshCache();
            await loadAnalytics();
            await searchLoans(true);
            toast({
                title: 'Success',
                description: 'Portfolio data refreshed successfully',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to refresh data',
                variant: 'destructive',
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    const formatCurrency = (amount: number) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
        return `₹${amount.toFixed(0)}`;
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'default'; // dark/black
            case 'CLOSED': return 'secondary'; // gray
            case 'OVERDUE': return 'destructive'; // red
            default: return 'outline';
        }
    };

    const getRiskBucketBadge = (bucket: string) => {
        switch (bucket) {
            case 'NORMAL':
            case 'CURRENT': return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Standard</Badge>;
            case 'SMA_0': return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">SMA-0</Badge>;
            case 'SMA_1': return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">SMA-1</Badge>;
            case 'NPA': return <Badge variant="destructive">NPA</Badge>;
            default: return <Badge variant="outline">{bucket}</Badge>;
        }
    };

    if (isLoadingAnalytics && !analytics) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading portfolio insights...</p>
                </div>
            </div>
        );
    }

    if (!analytics) return null;

    // Derived Insights
    const bestRegion = analytics.statePerformance.length > 0
        ? [...analytics.statePerformance].sort((a, b) => a.npaRate - b.npaRate)[0]
        : null;

    const worstRegion = analytics.statePerformance.length > 0
        ? [...analytics.statePerformance].sort((a, b) => b.npaRate - a.npaRate)[0]
        : null;

    // Check if worstRegion is actually "bad" (e.g. > 0% NPA)
    const showWorstRegion = worstRegion && worstRegion.npaRate > 0;




    const handleViewDetails = async (loan: LoanResponse) => {
        setSelectedLoan(loan);
        setIsDetailOpen(true);
        setIsLoadingSchedule(true);
        try {
            const schedule = await loanPortfolioService.getProjectedSchedule(loan.loanId);
            setRepaymentSchedule(schedule);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load repayment history",
                variant: 'destructive'
            });
        } finally {
            setIsLoadingSchedule(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                        Loan Portfolio Control Tower
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Advanced analytics and loan management system
                    </p>
                </div>
                <Button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    variant="outline"
                    className="shadow-sm hover:shadow-md transition-all self-start md:self-auto"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh Data
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Assets Under Management"
                    value={formatCurrency(analytics.totalAum)}
                    icon={<Wallet className="h-5 w-5 text-blue-600" />}
                    description={`${analytics.activeLoansCount} Active Loans`}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950"
                />

                <StatCard
                    title="NPA Rate"
                    value={`${analytics.npaRate.toFixed(2)}%`}
                    icon={<ShieldAlert className={`h-5 w-5 ${analytics.npaRate > 5 ? 'text-red-500' : 'text-green-500'}`} />}
                    description={analytics.npaRate > 5 ? "⚠️ Above Threshold (5%)" : "Within Risk Appetite"}
                    className={analytics.npaRate > 5 ? "bg-red-50 border-red-100" : ""}
                />

                {/* Top Performing Region Card */}
                <Card className="shadow-sm border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Top Performing Region</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {bestRegion?.state || "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Only {bestRegion?.npaRate.toFixed(1)}% NPA
                        </p>
                    </CardContent>
                </Card>

                {/* Worst Performing Region Card (Optional) or PAR */}
                <StatCard
                    title="Portfolio at Risk (>30)"
                    value={`${analytics.parRate.toFixed(2)}%`}
                    icon={<TrendingDown className="h-5 w-5 text-orange-500" />}
                    description="Early warning indicator"
                    className="bg-orange-50/20"
                />
            </div>

            {/* Tabs for View Switching */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="overview">Overview & Analytics</TabsTrigger>
                    <TabsTrigger value="loans">Loan Management</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Main Content Area */}

                    <div className="space-y-8">
                        {/* Top Row: Visual Analytics */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <GeographicRiskMap data={analytics.statePerformance || []} />
                            <RiskDistributionChart data={analytics.riskDistribution || []} />

                            {/* Insights Column - Now State Performance Chart */}
                            <StatePerformanceChart data={analytics.statePerformance || []} />

                        </div>

                        {/* Middle: Detailed Scheme Performance */}
                        <Card className="col-span-full">
                            <CardHeader>
                                <CardTitle>Scheme-wise Performance</CardTitle>
                                <CardDescription>Detailed breakdown of loan schemes and their profitability</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <SchemePerformanceTable
                                    data={analytics.schemePerformance || []}
                                    onRefresh={loadAnalytics}
                                />
                            </CardContent>
                        </Card>

                        {/* Provider Performance - Below Scheme Performance */}
                        {/* Provider Performance Table Removed as per request */}

                        {/* Demographics Section */}
                        <DemographicsCharts
                            genderData={analytics.genderDistribution || []}
                            ageData={analytics.ageDistribution || []}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="loans" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Loan Book Search</CardTitle>
                            <CardDescription>Filter and manage individual loan accounts</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Search Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label>Search Query</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Name, Email, Loan ID..."
                                            className="pl-8"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Loan Status</Label>
                                    <Select value={searchStatus} onValueChange={setSearchStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="ACTIVE">Active</SelectItem>
                                            <SelectItem value="OVERDUE">Overdue</SelectItem>
                                            <SelectItem value="CLOSED">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Risk Category</Label>
                                    <Select value={searchRisk} onValueChange={setSearchRisk}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Risk Levels" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Risk Levels</SelectItem>
                                            <SelectItem value="NORMAL">Standard</SelectItem>
                                            <SelectItem value="SMA_0">SMA-0 (1-30 DPD)</SelectItem>
                                            <SelectItem value="SMA_1">SMA-1 (31-60 DPD)</SelectItem>
                                            <SelectItem value="NPA">NPA (&gt;90 DPD)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Region (State)</Label>
                                    <Select value={searchState} onValueChange={setSearchState}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All States" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All States</SelectItem>
                                            {/* Ideally populated from analytics.statePerformance */}
                                            {analytics.statePerformance && analytics.statePerformance.map(s => (
                                                <SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button onClick={() => searchLoans(true)} disabled={isLoadingLoans}>
                                    {isLoadingLoans ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}
                                    Apply Filters
                                </Button>
                            </div>

                            {/* Results Table */}
                            <div className="rounded-md border mt-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Loan ID</TableHead>
                                            <TableHead>Beneficiary</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Risk</TableHead>
                                            <TableHead>Next Payment</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingLoans ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                                    Searching loans...
                                                </TableCell>
                                            </TableRow>
                                        ) : loans.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                                    No loans found matching criteria.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            loans.map((loan) => (
                                                <TableRow key={loan.loanId}>
                                                    <TableCell className="font-medium">LN-{loan.loanId}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{loan.userName || `User ${loan.userId}`}</span>
                                                            <span className="text-xs text-muted-foreground">{loan.userEmail}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{formatCurrency(loan.totalPrincipal)}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={getStatusVariant(loan.loanStatus) as any}>
                                                            {loan.loanStatus}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getRiskBucketBadge(loan.riskBucket)}
                                                    </TableCell>
                                                    <TableCell>{new Date(loan.nextPaymentDate).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(loan)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <div className="text-sm text-muted-foreground">
                                    Page {page + 1} of {totalPages || 1}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0 || isLoadingLoans}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={page >= totalPages - 1 || isLoadingLoans}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Loan Details Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Loan Details: LN-{selectedLoan?.loanId}</DialogTitle>
                        <DialogDescription>Detailed view of loan and repayment history</DialogDescription>
                    </DialogHeader>

                    {selectedLoan && (
                        <div className="space-y-6">
                            {/* Beneficiary & Loan Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Beneficiary Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Name:</span>
                                            <span className="font-medium">{selectedLoan.userName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Email:</span>
                                            <span>{selectedLoan.userEmail}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">User ID:</span>
                                            <span>{selectedLoan.userId}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Application ID:</span>
                                            <span>APP-{selectedLoan.applicationId}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Loan Terms</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Principal:</span>
                                            <span className="font-medium">{formatCurrency(selectedLoan.totalPrincipal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Interest Rate:</span>
                                            <span>{selectedLoan.interestRate}% p.a.</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Start Date:</span>
                                            <span>{new Date(selectedLoan.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Current Status:</span>
                                            <Badge variant={getStatusVariant(selectedLoan.loanStatus) as any}>{selectedLoan.loanStatus}</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Repayment Graph */}
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Repayment Behaviour</h3>
                                {isLoadingSchedule ? (
                                    <div className="h-[300px] flex items-center justify-center border rounded-lg bg-slate-50">
                                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <RepaymentLineChart data={repaymentSchedule} />
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );

