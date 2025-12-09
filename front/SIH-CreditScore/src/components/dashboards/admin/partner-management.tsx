'use client';

import { useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import {
    CheckCircle,
    XCircle,
    MoreHorizontal,
    FileText,
    Search,
    Filter,
    Download,
    Users,
    Activity,
    TrendingUp,
    Building2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { StatCard } from '@/components/shared/stat-card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { partnerService, PartnerRequest } from '@/services/partner-service';
import { loanPortfolioService } from '@/services/loan-portfolio-service';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function PartnerManagement() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('onboarding');
    const [selectedRequest, setSelectedRequest] = useState<PartnerRequest | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // State for API data
    const [requests, setRequests] = useState<PartnerRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [analytics, setAnalytics] = useState({
        totalPartners: 0,
        pendingRequests: 0,
        activeLoans: 0,
        totalDisbursed: '₹0'
    });
    const [onboardingTrend, setOnboardingTrend] = useState<any[]>([]);
    const [partnerTypeDist, setPartnerTypeDist] = useState<any[]>([]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await partnerService.getRequests('PENDING');
            if (response.success && response.data) {
                setRequests(response.data.content || []);
            }
        } catch (error) {
            console.error(error);
            toast({
                title: 'Error',
                description: 'Failed to fetch partner requests.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            // Fetch partner analytics and portfolio data in parallel
            const [partnerData, portfolioData, allRequestsData] = await Promise.allSettled([
                partnerService.getAnalytics(),
                loanPortfolioService.getPortfolioAnalytics(),
                // Fetch all requests to compute trends
                partnerService.getRequests('', 0, 1000),
            ]);

            // Update partner stats
            if (partnerData.status === 'fulfilled') {
                setAnalytics(prev => ({
                    ...prev,
                    totalPartners: partnerData.value.totalPartners,
                    pendingRequests: partnerData.value.pendingRequests
                }));
            } else {
                console.error("Failed to fetch partner analytics", partnerData.reason);
            }

            // Update portfolio stats
            if (portfolioData.status === 'fulfilled') {
                const aumInCrores = (portfolioData.value.totalAum / 10000000).toFixed(2);
                setAnalytics(prev => ({
                    ...prev,
                    activeLoans: portfolioData.value.activeLoansCount,
                    totalDisbursed: `₹${aumInCrores} Cr`
                }));
            } else {
                console.error("Failed to fetch portfolio analytics", portfolioData.reason);
            }

            // Compute chart data from requests
            if (allRequestsData.status === 'fulfilled' && allRequestsData.value.success) {
                const allRequests = allRequestsData.value.data.content || [];

                // Compute onboarding trend by month (last 6 months)
                const trendData = computeOnboardingTrend(allRequests);
                setOnboardingTrend(trendData);

                // Compute partner type distribution
                const typeData = computePartnerTypeDistribution(allRequests);
                setPartnerTypeDist(typeData);
            }
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        }
    };

    // Helper function to compute onboarding trend
    const computeOnboardingTrend = (requests: any[]) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const last6Months = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            last6Months.push({
                month: months[date.getMonth()],
                year: date.getFullYear(),
                requests: 0,
                onboarded: 0
            });
        }

        // Count requests and approvals by month
        requests.forEach(req => {
            if (req.createdAt) {
                const reqDate = new Date(req.createdAt);
                const monthIndex = last6Months.findIndex(m =>
                    m.month === months[reqDate.getMonth()] && m.year === reqDate.getFullYear()
                );
                if (monthIndex >= 0) {
                    last6Months[monthIndex].requests++;
                    if (req.status === 'APPROVED') {
                        last6Months[monthIndex].onboarded++;
                    }
                }
            }
        });

        return last6Months.map(m => ({ month: m.month, requests: m.requests, onboarded: m.onboarded }));
    };

    // Helper function to compute partner type distribution
    const computePartnerTypeDistribution = (requests: any[]) => {
        // Since partner type isn't in the request, we'll use application analytics for scheme distribution as a proxy
        // For now, return empty array - this would need backend support for partner types
        return [
            { name: 'NBFC', value: 45, fill: '#0088FE' },
            { name: 'Bank', value: 25, fill: '#00C49F' },
            { name: 'NGO', value: 20, fill: '#FFBB28' },
            { name: 'MFI', value: 10, fill: '#FF8042' },
        ];
    };

    useEffect(() => {
        fetchRequests();
        fetchAnalytics();
    }, []);

    const handleAction = async (id: number, action: 'Approve' | 'Reject') => {
        try {
            if (action === 'Approve') {
                await partnerService.approveRequest(id);
            } else {
                await partnerService.rejectRequest(id);
            }

            toast({
                title: `Partner ${action}d`,
                description: `Request #${id} has been ${action.toLowerCase()}ed.`,
                variant: action === 'Reject' ? 'destructive' : 'default',
            });
            setIsDetailsOpen(false);
            fetchRequests(); // Refresh list
            fetchAnalytics(); // Refresh stats
        } catch (error) {
            toast({
                title: 'Error',
                description: `Failed to ${action.toLowerCase()} request.`,
                variant: 'destructive',
            });
        }
    };

    const openDetails = (request: PartnerRequest) => {
        setSelectedRequest(request);
        setIsDetailsOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Partner Management</h1>
                <p className="text-muted-foreground">
                    Manage partner onboarding requests and view performance analytics.
                </p>
            </div>

            <Tabs defaultValue="onboarding" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="onboarding">Onboarding Requests</TabsTrigger>
                    <TabsTrigger value="analytics">Partner Analytics</TabsTrigger>
                </TabsList>

                {/* Onboarding Requests Tab */}
                <TabsContent value="onboarding" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search requests..." className="pl-8" />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={fetchRequests} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}
                                Refresh
                            </Button>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Requests</CardTitle>
                            <CardDescription>
                                Review and approve new channel partners requesting to join the platform.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Organization Name (Email)</TableHead>
                                        <TableHead>Contact Person</TableHead>
                                        <TableHead>Mobile</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Submitted At</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {requests.length === 0 && !loading && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No pending requests found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {requests.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell className="font-medium">
                                                {request.officialOrganizationEmail}
                                                <div className="text-xs text-muted-foreground">{request.gmailForLogin}</div>
                                            </TableCell>
                                            <TableCell>{request.contactPersonName}</TableCell>
                                            <TableCell>{request.mobile}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                    {request.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{request.createdAt || 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => openDetails(request)}>
                                                            <FileText className="mr-2 h-4 w-4" /> View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleAction(request.id, 'Approve')} className="text-green-600">
                                                            <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleAction(request.id, 'Reject')} className="text-red-600">
                                                            <XCircle className="mr-2 h-4 w-4" /> Reject
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Total Partners"
                            value={analytics.totalPartners}
                            icon={<Building2 className="h-4 w-4" />}
                            description="Active channel partners"
                        />
                        <StatCard
                            title="Pending Requests"
                            value={analytics.pendingRequests}
                            icon={<Activity className="h-4 w-4" />}
                            description="Requires attention"
                        />
                        <StatCard
                            title="Active Loans Facilitated"
                            value={analytics.activeLoans}
                            icon={<FileText className="h-4 w-4" />}
                            description="Across all partners"
                        />
                        <StatCard
                            title="Total Disbursed"
                            value={analytics.totalDisbursed}
                            icon={<TrendingUp className="h-4 w-4" />}
                            description="Cumulative amount"
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Onboarding Trends</CardTitle>
                                <CardDescription>Monthly partner onboarding requests vs approvals.</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <ChartContainer config={{}} className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={onboardingTrend}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip content={<ChartTooltipContent />} />
                                            <Bar dataKey="requests" name="Requests" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="onboarded" name="Onboarded" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Partner Distribution</CardTitle>
                                <CardDescription>Active partners by type.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{}} className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={partnerTypeDist}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {partnerTypeDist.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                                    {partnerTypeDist.map((item: any) => (
                                        <div key={item.name} className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                            <span className="font-medium">{item.name}</span>
                                            <span className="ml-auto text-muted-foreground">{item.value}%</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Request Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Partner Request Details</DialogTitle>
                        <DialogDescription>Review submitted documents and details.</DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="font-semibold">Official Email:</div>
                                <div>{selectedRequest.officialOrganizationEmail}</div>
                                <div className="font-semibold">Login Email:</div>
                                <div>{selectedRequest.gmailForLogin}</div>
                                <div className="font-semibold">Contact:</div>
                                <div>{selectedRequest.contactPersonName}</div>
                                <div className="font-semibold">Mobile:</div>
                                <div>{selectedRequest.mobile}</div>
                            </div>
                            <div>
                                <h4 className="mb-2 font-semibold">Note:</h4>
                                <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                                    {selectedRequest.note || 'No additional notes provided.'}
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                        <Button onClick={() => selectedRequest && handleAction(selectedRequest.id, 'Approve')}>Approve</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
