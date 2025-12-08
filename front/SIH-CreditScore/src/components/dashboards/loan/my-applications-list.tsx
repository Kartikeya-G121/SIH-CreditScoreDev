
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileText, Users, ArrowRight, Plus, Trash2, AlertCircle } from 'lucide-react';
import { loanApplicationService } from '@/services/loan-application-service';
import type { ApplicationResponse } from '@/types/loan-application-types';
import { useToast } from '@/hooks/use-toast';
import { GroupLoanDashboard } from './group-loan-dashboard';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MyApplicationsListProps {
    onApplyNew: () => void;
    isAdmin?: boolean;
}

export function MyApplicationsList({ onApplyNew, isAdmin }: MyApplicationsListProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [applications, setApplications] = useState<ApplicationResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [explanationApp, setExplanationApp] = useState<ApplicationResponse | null>(null);

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
            case 'WITHDRAWN':
                return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Withdrawn</Badge>;
            case 'SANCTIONED':
                return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Sanctioned</Badge>;
            case 'AUTO_SANCTIONED':
                return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">Auto Sanctioned</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const handleWithdraw = async () => {
        if (!withdrawId) return;

        try {
            setIsWithdrawing(true);
            await loanApplicationService.withdrawApplication(withdrawId);
            toast({
                title: 'Application Withdrawn',
                description: 'Your application has been successfully withdrawn.',
            });
            fetchApplications();
        } catch (error) {
            console.error('Failed to withdraw application:', error);
            toast({
                variant: 'destructive',
                title: 'Withdrawal Failed',
                description: 'Failed to withdraw application. Please try again.',
            });
        } finally {
            setIsWithdrawing(false);
            setWithdrawId(null);
        }
    };

    if (selectedGroupId) {
        return (
            <GroupLoanDashboard
                groupId={selectedGroupId}
                onDraftApplication={() => {
                    toast({ title: "Edit Application", description: "Redirecting..." });
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
                {!isAdmin && (
                    <Button onClick={onApplyNew}>
                        <Plus className="mr-2 h-4 w-4" />
                        Apply New Loan
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {applications.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">No Applications Yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                            You haven't submitted any loan applications yet. Start a new application to get financial support.
                        </p>
                        {!isAdmin && <Button onClick={onApplyNew}>Apply for Loan</Button>}
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
                                    {/* <TableHead>Date</TableHead> */}
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
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(app.status)}
                                                {(app.status === 'AUTO_SANCTIONED' || app.status === 'SANCTIONED' || app.status === 'REJECTED') && (
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExplanationApp(app)}>
                                                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                        {/* <TableCell>{new Date(app.createdAt).toLocaleDateString()}</TableCell> */}
                                        <TableCell className="text-right">
                                            {app.groupId ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-primary hover:text-primary/80"
                                                    onClick={() => setSelectedGroupId(app.groupId || null)}
                                                >
                                                    View Group
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-primary hover:text-primary/80"
                                                    onClick={() => router.push(`/dashboard?tab=apply-loan&applicationId=${app.applicationId}`)}
                                                >
                                                    {app.status === 'DRAFT' ? 'Finalize Draft' : 'View Details'}
                                                    <ArrowRight className="ml-2 h-4 w-4" />
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

            <AlertDialog open={!!withdrawId} onOpenChange={(open) => !open && setWithdrawId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Withdraw Application?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to withdraw this application? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isWithdrawing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleWithdraw}
                            disabled={isWithdrawing}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isWithdrawing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Withdraw Application'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Explanation Dialog */}
            <AlertDialog open={!!explanationApp} onOpenChange={(open) => !open && setExplanationApp(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Application Decision: {explanationApp?.status === 'REJECTED' ? 'Rejected' : 'Sanctioned'}</AlertDialogTitle>
                        <div className="py-4 space-y-4">
                            {explanationApp?.status === 'AUTO_SANCTIONED' && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <h4 className="font-semibold text-green-800 mb-1">Auto-Sanctioned by AI</h4>
                                    <p className="text-sm text-green-700">{explanationApp.autoSanctionReason || "Your profile met all the criteria for an instant approval."}</p>
                                </div>
                            )}
                            {explanationApp?.status === 'REJECTED' && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <h4 className="font-semibold text-red-800 mb-1">Reason for Rejection</h4>
                                    <p className="text-sm text-red-700">{explanationApp.rejectionReason || "Application did not meet the required credit parameters."}</p>
                                </div>
                            )}
                            {explanationApp?.status === 'SANCTIONED' && !explanationApp.autoSanctionReason && (
                                <p className="text-sm text-muted-foreground">This application was manually reviewed and sanctioned by a Loan Officer.</p>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block">Income Bucket</span>
                                    <span className="font-medium">{explanationApp?.incomeBucket || "N/A"}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Risk Bucket</span>
                                    <span className="font-medium">{explanationApp?.riskBucket || "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
