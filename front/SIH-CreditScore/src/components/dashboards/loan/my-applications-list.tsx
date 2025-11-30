'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileText, Users, ArrowRight, Plus } from 'lucide-react';
import { loanApplicationService } from '@/services/loan-application-service';
import type { ApplicationResponse } from '@/types/loan-application-types';
import { useToast } from '@/hooks/use-toast';
import { GroupLoanDashboard } from './group-loan-dashboard';

interface MyApplicationsListProps {
    onApplyNew: () => void;
}

export function MyApplicationsList({ onApplyNew }: MyApplicationsListProps) {
    const { toast } = useToast();
    const [applications, setApplications] = useState<ApplicationResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

    const fetchApplications = async () => {
        try {
            setIsLoading(true);
            const data = await loanApplicationService.getMyApplications();
            setApplications(data);
        } catch (error) {
            console.error('Failed to fetch applications:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load your applications.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, [toast]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SUBMITTED':
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Submitted</Badge>;
            case 'DRAFT':
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Draft</Badge>;
            case 'APPROVED':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
            case 'REJECTED':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (selectedGroupId) {
        return (
            <GroupLoanDashboard
                groupId={selectedGroupId}
                onDraftApplication={() => {
                    // Logic to edit draft application
                    // For now, just go back to list or show toast
                    toast({
                        title: "Edit Application",
                        description: "Redirecting to application form...",
                    });
                    // In a real flow, we would navigate to the application form with the ID
                }}
                onBack={() => {
                    setSelectedGroupId(null);
                    fetchApplications(); // Refresh list on back
                }}
            />
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading your applications...</p>
            </div>
        );
    }

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        My Applications
                    </CardTitle>
                    <CardDescription>
                        Track the status of your loan applications
                    </CardDescription>
                </div>
                <Button onClick={onApplyNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Apply New Loan
                </Button>
            </CardHeader>
            <CardContent>
                {applications.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">No Applications Yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                            You haven't submitted any loan applications yet. Start a new application to get financial support.
                        </p>
                        <Button onClick={onApplyNew}>Apply for Loan</Button>
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Application ID</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map((app) => (
                                    <TableRow key={app.applicationId} className="hover:bg-muted/50">
                                        <TableCell className="font-medium">#{app.applicationId}</TableCell>
                                        <TableCell>
                                            {app.groupId ? (
                                                <Badge variant="outline" className="flex w-fit items-center gap-1 border-purple-200 bg-purple-50 text-purple-700">
                                                    <Users className="h-3 w-3" />
                                                    Group Loan
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="flex w-fit items-center gap-1 border-blue-200 bg-blue-50 text-blue-700">
                                                    <FileText className="h-3 w-3" />
                                                    Individual
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>₹{app.requestedAmount.toLocaleString()}</TableCell>
                                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                                        <TableCell>{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            {app.groupId ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-primary hover:text-primary/80"
                                                    onClick={() => setSelectedGroupId(app.groupId || null)}
                                                >
                                                    View Status
                                                    <ArrowRight className="ml-1 h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="sm" disabled>
                                                    View Details
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
