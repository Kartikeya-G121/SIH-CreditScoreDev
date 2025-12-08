
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
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">Partner Dashboard</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">--</div>
                            <p className="text-xs text-muted-foreground">View your applications tab</p>
                        </CardContent>
                    </Card>
                    {/* Add more stats as needed */}
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
