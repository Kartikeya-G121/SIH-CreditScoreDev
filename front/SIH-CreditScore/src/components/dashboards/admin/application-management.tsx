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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    RefreshCw,
    Search,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    TrendingUp,
    Users,
    FileCheck,
    Ban,
    Eye,
    Calendar as CalendarIcon,
    Filter,
} from 'lucide-react';
import { applicationAnalyticsService } from '@/services/application-analytics-service';
import type {
    ApplicationAnalyticsResponse,
    ApplicationSearchRequest,
    ApplicationSearchResponse,
    ApplicationDetail,
} from '@/services/application-analytics-service';
import { IndiaApplicationMap } from './india-application-map';
import { StatCard } from '@/components/shared/stat-card';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import { ApplicationDetailsDialog } from './application-details-dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';


const STATUS_CONFIG = {
    DRAFT: { label: 'Draft', color: 'bg-gray-500', icon: FileText },
    SUBMITTED: { label: 'Submitted', color: 'bg-blue-500', icon: FileCheck },
    SCORING: { label: 'Scoring', color: 'bg-yellow-500', icon: TrendingUp },
    APPROVED: { label: 'Approved', color: 'bg-green-500', icon: CheckCircle },
    REJECTED: { label: 'Rejected', color: 'bg-red-500', icon: XCircle },
    SANCTIONED: { label: 'Sanctioned', color: 'bg-emerald-600', icon: CheckCircle },
    WITHDRAWN: { label: 'Withdrawn', color: 'bg-orange-500', icon: Ban },
};

export default function ApplicationManagement() {
    const { toast } = useToast();
    const [analytics, setAnalytics] = useState<ApplicationAnalyticsResponse | null>(null);
    const [searchResults, setSearchResults] = useState<ApplicationSearchResponse | null>(null);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Details Dialog State
    const [selectedApplication, setSelectedApplication] = useState<ApplicationDetail | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Format amount with K/L/Cr
    const formatAmount = (amount: number): string => {
        if (amount >= 10000000) {
            return `₹${(amount / 10000000).toFixed(2)}Cr`;
        } else if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(2)}L`;
        } else if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(2)}K`;
        }
        return `₹${amount.toFixed(0)}`;
    };

    // Search filters
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
    const [stateFilter, setStateFilter] = useState<string | undefined>(undefined);
    const [minAmount, setMinAmount] = useState<string>('');
    const [maxAmount, setMaxAmount] = useState<string>('');
    const [providerName, setProviderName] = useState<string>('');
    const [schemeName, setSchemeName] = useState<string>('');
    const [createdAfter, setCreatedAfter] = useState<string | undefined>(undefined);
    const [createdBefore, setCreatedBefore] = useState<string | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        loadAnalytics();
        performSearch();
    }, []);

    const loadAnalytics = async () => {
        try {
            setIsLoadingAnalytics(true);
            const data = await applicationAnalyticsService.getAnalytics();
            setAnalytics(data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load analytics data',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingAnalytics(false);
        }
    };

    const handleRefreshCache = async () => {
        try {
            setIsRefreshing(true);
            const data = await applicationAnalyticsService.refreshCache();
            setAnalytics(data);
            toast({
                title: 'Cache Refreshed',
                description: 'Analytics data has been updated successfully',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to refresh cache',
                variant: 'destructive',
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    const performSearch = async (page: number = 0) => {
        try {
            setIsSearching(true);
            const request: ApplicationSearchRequest = {
                searchText: searchText || undefined,
                status: statusFilter || undefined,
                state: stateFilter || undefined,
                minAmount: minAmount ? parseFloat(minAmount) : undefined,
                maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
                providerName: providerName || undefined,
                schemeName: schemeName || undefined,
                createdAfter: createdAfter || undefined,
                createdBefore: createdBefore || undefined,
                page,
                size: 10,
                sortBy: 'createdAt',
                sortDirection: 'DESC',
            };
            const results = await applicationAnalyticsService.searchApplications(request);
            setSearchResults(results);
            setCurrentPage(page);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to search applications',
                variant: 'destructive',
            });
        } finally {
            setIsSearching(false);
        }
    };

    const handleViewDetails = (app: ApplicationDetail) => {
        setSelectedApplication(app);
        setIsDetailsOpen(true);
    };

    const handleDateShortcut = (type: 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR') => {
        const now = new Date();
        let start: Date, end: Date;

        switch (type) {
            case 'THIS_MONTH':
                start = startOfMonth(now);
                end = endOfMonth(now);
                break;
            case 'LAST_MONTH':
                const lastMonth = subMonths(now, 1);
                start = startOfMonth(lastMonth);
                end = endOfMonth(lastMonth);
                break;
            case 'THIS_YEAR':
                start = startOfYear(now);
                end = endOfYear(now);
                break;
        }

        setCreatedAfter(start.toISOString());
        setCreatedBefore(end.toISOString());

        toast({
            title: "Date Filter Applied",
            description: `Filtering from ${format(start, 'dd MMM yyyy')} to ${format(end, 'dd MMM yyyy')}`,
        });
    };


    const handleSearch = () => {
        setCurrentPage(0);
        performSearch(0);
    };

    const handlePageChange = (newPage: number) => {
        performSearch(newPage);
    };

    const formatCurrency = (amount: number | null) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
        } catch {
            return dateString;
        }
    };

    if (isLoadingAnalytics) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Application Management</h2>
                    <p className="text-muted-foreground">
                        Comprehensive analytics and search for loan applications
                    </p>
                </div>
                <Button
                    onClick={handleRefreshCache}
                    disabled={isRefreshing}
                    variant="outline"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh Cache'}
                </Button>
            </div>

            {/* Cache Info */}
            {analytics && (
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-900 dark:text-blue-100">
                                {analytics.isCached ? 'Cached data' : 'Fresh data'} • Last updated:{' '}
                                {formatDate(analytics.lastUpdated)}
                            </span>
                            <span className="text-blue-600 dark:text-blue-400 ml-auto">
                                Auto-refresh: Every 2 days at midnight
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Statistics Cards */}
            {analytics && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <StatCard
                        title="Total Applications"
                        value={(analytics.overallStats.totalApplications - analytics.overallStats.draftCount).toString()}
                        icon={<FileText className="h-4 w-4" />}
                        description="Excluding drafts"
                        className="transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                    />
                    <StatCard
                        title="In Review"
                        value={analytics.overallStats.scoringCount.toString()}
                        icon={<TrendingUp className="h-4 w-4 text-orange-600" />}
                        description="Being scored"
                        className="transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                    />
                    <StatCard
                        title="Submitted"
                        value={analytics.overallStats.submittedCount.toString()}
                        icon={<FileCheck className="h-4 w-4 text-blue-500" />}
                        description="Pending Review"
                        className="transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                    />
                    <StatCard
                        title="Approved"
                        value={analytics.overallStats.approvedCount.toString()}
                        icon={<CheckCircle className="h-4 w-4 text-green-500" />}
                        description="Ready for Sanction"
                        className="transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                    />
                    <StatCard
                        title="Sanctioned"
                        value={analytics.overallStats.sanctionedCount.toString()}
                        icon={<CheckCircle className="h-4 w-4 text-green-600" />}
                        description="Approved"
                        className="transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                    />
                    <StatCard
                        title="Rejected"
                        value={analytics.overallStats.rejectedCount.toString()}
                        icon={<XCircle className="h-4 w-4 text-red-600" />}
                        description="Not approved"
                        className="transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                    />
                    <StatCard
                        title="Total Amount"
                        value={formatAmount(analytics.stateWiseStats.reduce((sum, s) => sum + (s.totalAmountRequested || 0), 0))}
                        icon={<FileCheck className="h-4 w-4 text-blue-600" />}
                        description="Requested"
                        className="transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                    />
                </div>
            )}

            {/* India Map */}
            {analytics && analytics.stateWiseStats.length > 0 && (
                <IndiaApplicationMap data={analytics.stateWiseStats} />
            )}

            {/* Search Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Search Applications</CardTitle>
                    <CardDescription>
                        Search and filter loan applications
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Primary Filters */}
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="md:col-span-2">
                                <Label className="text-sm font-medium mb-1.5 block">Search Text</Label>
                                <Input
                                    placeholder="Search by name, email, phone, or ID..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-medium mb-1.5 block">Status</Label>
                                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value === 'ALL' ? undefined : value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Statuses</SelectItem>
                                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>
                                                {config.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full">
                                            <Filter className="mr-2 h-4 w-4" />
                                            Advanced Filters
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80">
                                        <div className="grid gap-4">
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">Amount Range</h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="grid gap-1">
                                                        <Label htmlFor="minAmount">Min</Label>
                                                        <Input
                                                            id="minAmount"
                                                            type="number"
                                                            placeholder="₹"
                                                            value={minAmount}
                                                            onChange={(e) => setMinAmount(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="grid gap-1">
                                                        <Label htmlFor="maxAmount">Max</Label>
                                                        <Input
                                                            id="maxAmount"
                                                            type="number"
                                                            placeholder="₹"
                                                            value={maxAmount}
                                                            onChange={(e) => setMaxAmount(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">Date Range</h4>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleDateShortcut('THIS_MONTH')}>
                                                        This Month
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => handleDateShortcut('LAST_MONTH')}>
                                                        Last Month
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => handleDateShortcut('THIS_YEAR')}>
                                                        This Year
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">Scheme Details</h4>
                                                <div className="grid gap-2">
                                                    <div className="grid gap-1">
                                                        <Label htmlFor="providerName">Provider Name</Label>
                                                        <Input
                                                            id="providerName"
                                                            placeholder="e.g. SBI"
                                                            value={providerName}
                                                            onChange={(e) => setProviderName(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="grid gap-1">
                                                        <Label htmlFor="schemeName">Scheme Name</Label>
                                                        <Input
                                                            id="schemeName"
                                                            placeholder="e.g. Home Loan"
                                                            value={schemeName}
                                                            onChange={(e) => setSchemeName(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">Location</h4>
                                                <Select value={stateFilter} onValueChange={(value) => setStateFilter(value === 'ALL' ? undefined : value)}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select State" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ALL">All States</SelectItem>
                                                        {analytics?.stateWiseStats.map((state) => (
                                                            <SelectItem key={state.state} value={state.state}>
                                                                {state.state}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button onClick={handleSearch} disabled={isSearching} className="w-full md:w-auto min-w-[120px]">
                                <Search className={`h-4 w-4 mr-2 ${isSearching ? 'animate-pulse' : ''}`} />
                                {isSearching ? 'Searching...' : 'Search Applications'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Search Results */}
            {
                searchResults && (
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Search Results ({searchResults.totalElements} applications)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Applicant</TableHead>
                                            <TableHead>State</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Scheme</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {searchResults.applications.map((app) => {
                                            const StatusIcon = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG]?.icon || AlertCircle;
                                            return (
                                                <TableRow key={app.applicationId}>
                                                    <TableCell className="font-medium">#{app.applicationId}</TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{app.userName || 'N/A'}</div>
                                                            <div className="text-xs text-muted-foreground">{app.userEmail}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{app.state || 'N/A'}</TableCell>
                                                    <TableCell>{formatCurrency(app.requestedAmount)}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={`${STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG]?.color || 'bg-gray-500'} text-white border-0`}
                                                        >
                                                            <StatusIcon className="h-3 w-3 mr-1" />
                                                            {STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG]?.label || app.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{app.schemeName || 'N/A'}</TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {formatDate(app.createdAt)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewDetails(app)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {searchResults.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Page {currentPage + 1} of {searchResults.totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 0 || isSearching}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage >= searchResults.totalPages - 1 || isSearching}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            }

            <ApplicationDetailsDialog
                application={selectedApplication}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                onUpdate={() => performSearch(currentPage)}
            />
        </div >
    );
}
