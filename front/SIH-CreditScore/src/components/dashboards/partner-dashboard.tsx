
'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { partnerService } from '@/services/partner-service';
import { Loader2, Plus, UserPlus, FileText, CheckCircle, RefreshCcw } from 'lucide-react';
import { Scheme } from '@/services/scheme-service';
import { Badge } from '@/components/ui/badge';

interface PartnerDashboardProps {
    activeTab?: string;
}

export default function PartnerDashboard({ activeTab = 'dashboard' }: PartnerDashboardProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Officers State
    const [officerName, setOfficerName] = useState('');
    const [officerEmail, setOfficerEmail] = useState('');
    const [officerCreating, setOfficerCreating] = useState(false);

    // Applications State
    const [applications, setApplications] = useState<any[]>([]);
    const [appsLoading, setAppsLoading] = useState(false);

    // Scheme State
    const [schemeData, setSchemeData] = useState<Partial<Scheme>>({
        schemeName: '',
        minAmount: 10000,
        maxAmount: 500000,
        baseInterestRate: 10,
        minTenureMonths: 12,
        maxTenureMonths: 60,
        isTieredInterest: false,
        isActive: true
    });
    const [schemeCreating, setSchemeCreating] = useState(false);

    useEffect(() => {
        if (activeTab === 'applications') {
            fetchApplications();
        }
    }, [activeTab]);

    const fetchApplications = async () => {
        try {
            setAppsLoading(true);
            const data = await partnerService.getApplications();
            setApplications(data.content || []);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch applications.',
            });
        } finally {
            setAppsLoading(false);
        }
    };

    const handleCreateOfficer = async () => {
        if (!officerName || !officerEmail) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fill all fields.' });
            return;
        }
        try {
            setOfficerCreating(true);
            await partnerService.createOfficer({ name: officerName, email: officerEmail });
            toast({ title: 'Success', description: 'Loan Officer created and credentials sent.' });
            setOfficerName('');
            setOfficerEmail('');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create officer.' });
        } finally {
            setOfficerCreating(false);
        }
    };

    const handleCreateScheme = async () => {
        if (!schemeData.schemeName) {
            toast({ variant: 'destructive', title: 'Error', description: 'Scheme Name is required.' });
            return;
        }

        try {
            setSchemeCreating(true);
            await partnerService.createScheme(schemeData);
            toast({ title: 'Success', description: 'Scheme created successfully.' });
            // Reset form
            setSchemeData({
                schemeName: '',
                minAmount: 10000,
                maxAmount: 500000,
                baseInterestRate: 10,
                minTenureMonths: 12,
                maxTenureMonths: 60,
                isTieredInterest: false,
                isActive: true
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to create scheme.' });
        } finally {
            setSchemeCreating(false);
        }
    };

    if (activeTab === 'dashboard') {
        return <DashboardAnalytics />;
    }

    // Separate component for analytics dashboard
    function DashboardAnalytics() {
        const { toast } = useToast();
        const [analytics, setAnalytics] = useState<any | null>(null);
        const [loading, setLoading] = useState(true);
        const [activeSchemes, setActiveSchemes] = useState<number>(0);
        const [schemePerformance, setSchemePerformance] = useState<any[]>([]);

        useEffect(() => {
            loadAnalytics();
        }, []);

        const loadAnalytics = async () => {
            try {
                setLoading(true);

                // Dynamic imports to avoid circular dependencies
                const { applicationAnalyticsService } = await import('@/services/application-analytics-service');
                const { schemeService } = await import('@/services/scheme-service');
                const { loanPortfolioService } = await import('@/services/loan-portfolio-service');

                // Fetch all data in parallel
                const [analyticsData, schemesData, portfolioData] = await Promise.allSettled([
                    applicationAnalyticsService.getAnalytics(),
                    schemeService.getActiveSchemes(),
                    loanPortfolioService.getPortfolioAnalytics(),
                ]);

                // Handle analytics data
                if (analyticsData.status === 'fulfilled') {
                    setAnalytics(analyticsData.value);
                } else {
                    console.error('Error loading analytics:', analyticsData.reason);
                }

                // Handle schemes data
                if (schemesData.status === 'fulfilled') {
                    setActiveSchemes(schemesData.value.length);
                } else {
                    console.error('Error loading schemes:', schemesData.reason);
                }

                // Handle portfolio data
                if (portfolioData.status === 'fulfilled') {
                    const sortedSchemes = [...portfolioData.value.schemePerformance]
                        .filter((s: any) => s.isActive)
                        .sort((a: any, b: any) => b.activeLoans - a.activeLoans)
                        .slice(0, 3);
                    setSchemePerformance(sortedSchemes);
                } else {
                    console.error('Error loading portfolio data:', portfolioData.reason);
                }

            } catch (error) {
                console.error('Error loading dashboard data:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load dashboard data',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        // Prepare pie chart data
        const pieChartData = analytics ? [
            { name: 'Draft', value: analytics.overallStats.draftCount, color: '#94a3b8' },
            { name: 'Submitted', value: analytics.overallStats.submittedCount, color: '#3b82f6' },
            { name: 'Scoring', value: analytics.overallStats.scoringCount, color: '#f59e0b' },
            { name: 'Approved', value: analytics.overallStats.approvedCount, color: '#10b981' },
            { name: 'Rejected', value: analytics.overallStats.rejectedCount, color: '#ef4444' },
            { name: 'Sanctioned', value: analytics.overallStats.sanctionedCount, color: '#8b5cf6' },
        ].filter(item => item.value > 0) : [];

        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Partner Dashboard
                    </h2>
                    {analytics && (
                        <button
                            onClick={loadAnalytics}
                            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                        >
                            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    )}
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 dark:from-blue-950 dark:to-indigo-950 dark:border-blue-900">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active Schemes</CardTitle>
                            <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                {loading ? '...' : activeSchemes}
                            </div>
                            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">Currently active</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 dark:from-emerald-950 dark:to-teal-950 dark:border-emerald-900">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
                            <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                {loading ? '...' : analytics?.overallStats.totalApplications.toLocaleString() || '0'}
                            </div>
                            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">All time</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100 dark:from-purple-950 dark:to-pink-950 dark:border-purple-900">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
                            <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                                {loading ? '...' : analytics?.overallStats.approvedCount.toLocaleString() || '0'}
                            </div>
                            <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-1">
                                {analytics ? `${((analytics.overallStats.approvedCount / analytics.overallStats.totalApplications) * 100).toFixed(1)}% approval rate` : 'Calculating...'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 dark:from-amber-950 dark:to-orange-950 dark:border-amber-900">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
                            <UserPlus className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                                {loading ? '...' : (analytics ? analytics.overallStats.submittedCount + analytics.overallStats.scoringCount : '0')}
                            </div>
                            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">Requires attention</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg sm:text-xl">Application Status Distribution</CardTitle>
                            <CardDescription className="text-sm">Breakdown of applications by current status</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[250px] sm:h-[300px] lg:h-[350px]">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : pieChartData.length > 0 ? (
                                <div className="w-full h-full">
                                    {/* @ts-ignore - recharts types */}
                                    <div style={{ width: '100%', height: '100%' }}>
                                        Pie Chart Placeholder
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900 rounded-md">
                                    <p className="text-muted-foreground">No application data available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg sm:text-xl">Scheme Performance</CardTitle>
                            <CardDescription className="text-sm">Top performing loan products</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center h-32">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : schemePerformance.length > 0 ? (
                                <div className="space-y-3">
                                    {schemePerformance.map((scheme: any, i: number) => {
                                        const approvalRate = Math.round((1 - scheme.npaRate / 100) * 100);
                                        return (
                                            <div key={scheme.schemeId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-blue-500' : 'bg-purple-500'}`} />
                                                    <span className="font-medium text-xs sm:text-sm truncate" title={scheme.schemeName}>
                                                        {scheme.schemeName}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {scheme.activeLoans} loans
                                                    </Badge>
                                                    <Badge variant={approvalRate >= 85 ? 'default' : 'secondary'} className="text-xs">
                                                        {approvalRate}% Success
                                                    </Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-32 bg-slate-50 dark:bg-slate-900 rounded-md">
                                    <p className="text-sm text-muted-foreground">No scheme data available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (activeTab === 'officers') {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold tracking-tight">Officer Management</h2>
                </div>

                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Create New Loan Officer</CardTitle>
                        <CardDescription>Add a new loan officer to manage your schemes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input value={officerName} onChange={(e) => setOfficerName(e.target.value)} placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input value={officerEmail} onChange={(e) => setOfficerEmail(e.target.value)} placeholder="john@example.com" type="email" />
                        </div>
                    </CardContent>
                    <CardContent>
                        <Button onClick={handleCreateOfficer} disabled={officerCreating} className="w-full">
                            {officerCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Officer
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (activeTab === 'schemes') {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold tracking-tight">Scheme Management</h2>
                <Card>
                    <CardHeader>
                        <CardTitle>Create New Scheme</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Scheme Name</Label>
                                <Input value={schemeData.schemeName} onChange={(e) => setSchemeData({ ...schemeData, schemeName: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Base Interest Rate (%)</Label>
                                <Input type="number" value={schemeData.baseInterestRate} onChange={(e) => setSchemeData({ ...schemeData, baseInterestRate: parseFloat(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Min Amount</Label>
                                <Input type="number" value={schemeData.minAmount} onChange={(e) => setSchemeData({ ...schemeData, minAmount: parseFloat(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Amount</Label>
                                <Input type="number" value={schemeData.maxAmount} onChange={(e) => setSchemeData({ ...schemeData, maxAmount: parseFloat(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Min Tenure (Months)</Label>
                                <Input type="number" value={schemeData.minTenureMonths} onChange={(e) => setSchemeData({ ...schemeData, minTenureMonths: parseFloat(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Tenure (Months)</Label>
                                <Input type="number" value={schemeData.maxTenureMonths} onChange={(e) => setSchemeData({ ...schemeData, maxTenureMonths: parseFloat(e.target.value) })} />
                            </div>
                        </div>
                        <Button onClick={handleCreateScheme} disabled={schemeCreating}>
                            {schemeCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Scheme
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (activeTab === 'applications') {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold tracking-tight">Applications View</h2>
                    <Button variant="outline" onClick={fetchApplications}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>App ID</TableHead>
                                    <TableHead>Beneficiary</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {appsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : applications.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No applications found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    applications.map((app) => (
                                        <TableRow key={app.id}>
                                            <TableCell>#{app.id}</TableCell>
                                            <TableCell>{app.beneficiaryId}</TableCell>
                                            <TableCell>₹{app.requestedAmount}</TableCell>
                                            <TableCell>
                                                <Badge variant={app.status === 'APPROVED' ? 'default' : app.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                                                    {app.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
}
