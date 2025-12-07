'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, CheckCircle2, AlertCircle, FileText, Send } from 'lucide-react';
import { userService } from '@/services/user-service';
import { beneficiaryService } from '@/services/beneficiary-service';
import { useToast } from '@/hooks/use-toast';
import { loanApplicationService } from '@/services/loan-application-service';
import type { GroupApplicationStatus, GroupMemberApplicationStatus } from '@/types/loan-application-types';

interface GroupLoanDashboardProps {
    groupId: number;
    onDraftApplication: (applicationId?: number) => void;
    onBack: () => void;
}

export function GroupLoanDashboard({ groupId, onDraftApplication, onBack }: GroupLoanDashboardProps) {
    const { toast } = useToast();
    const [status, setStatus] = useState<GroupApplicationStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const fetchStatus = async () => {
        try {
            setIsLoading(true);

            // Fetch current user if not already loaded
            let userId = currentUserId;
            if (!userId) {
                try {
                    const profile = await beneficiaryService.getMyProfile();
                    userId = profile.userId;
                    setCurrentUserId(userId);
                } catch (e) {
                    console.error('Failed to fetch user profile', e);
                }
            }

            const data = await loanApplicationService.getGroupApplicationStatus(groupId);
            setStatus(data);
        } catch (error) {
            console.error('Failed to fetch group status:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load group application status.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, [groupId, toast]);

    const handleGroupSubmit = async () => {
        if (!status?.canSubmit) return;

        try {
            setIsSubmitting(true);
            await loanApplicationService.submitGroupApplication(groupId);
            toast({
                title: 'Success!',
                description: 'Group application submitted successfully.',
            });
            // Refresh status
            fetchStatus();
        } catch (error) {
            console.error('Failed to submit group application:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to submit group application. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: GroupMemberApplicationStatus['status']) => {
        switch (status) {
            case 'SUBMITTED':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Submitted</Badge>;
            case 'DRAFT':
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Drafted</Badge>;
            case 'REJECTED':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Rejected</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">Not Started</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading group status...</p>
            </div>
        );
    }

    if (!status) return null;

    const currentUserMember = status.members.find((m: GroupMemberApplicationStatus) => m.userId === currentUserId);
    const isLeader = currentUserMember?.role === 'LEADER';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{status.groupName}</h2>
                    <p className="text-muted-foreground flex items-center mt-1">
                        <Users className="h-4 w-4 mr-2" />
                        Group Leader: {status.leaderName}
                    </p>
                </div>
                <Button variant="outline" onClick={onBack}>
                    Back to Selection
                </Button>
            </div>

            {/* Member Status Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Member Applications</CardTitle>
                    <CardDescription>
                        Track the application status of all group members. All members must draft their applications before the group application can be submitted.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Loan Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {status.members.map((member: GroupMemberApplicationStatus) => (
                                <TableRow key={member.userId}>
                                    <TableCell className="font-medium">
                                        {member.userName}
                                        {member.userId === currentUserId && " (You)"}
                                    </TableCell>
                                    <TableCell>
                                        {/* @ts-ignore */}
                                        <Badge className={`border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground border`}>{member.role}</Badge>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                                    <TableCell className="text-right">
                                        {member.amount ? `₹${member.amount.toLocaleString()}` : '₹0'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/30 p-6 rounded-lg border">
                <div className="space-y-1">
                    <h4 className="font-semibold">Your Action</h4>
                    <p className="text-sm text-muted-foreground">
                        {(!currentUserMember || currentUserMember.status === 'NOT_STARTED')
                            ? "You haven't started your application yet."
                            : currentUserMember.status === 'DRAFT'
                                ? "You have a draft application saved."
                                : currentUserMember.status === 'SUBMITTED'
                                    ? "Your application has been submitted."
                                    : currentUserMember.status === 'REJECTED'
                                        ? "Your application was rejected."
                                        : "Your application is ready for submission."}
                    </p>
                </div>

                <div className="flex gap-3">
                    {(() => {
                        console.log('DEBUG: currentUserId:', currentUserId);
                        console.log('DEBUG: currentUserMember:', currentUserMember);
                        console.log('DEBUG: status:', currentUserMember?.status);
                        return null;
                    })()}
                    <Button onClick={() => onDraftApplication(currentUserMember?.applicationId)}>
                        <FileText className="mr-2 h-4 w-4" />
                        {(!currentUserMember || currentUserMember.status === 'NOT_STARTED')
                            ? 'Draft My Application'
                            : (currentUserMember.status === 'SUBMITTED' || currentUserMember.status === 'REJECTED')
                                ? 'View Application'
                                : `Edit Application (${currentUserMember.status})`}
                    </Button>

                    {isLeader && (
                        <Button
                            onClick={handleGroupSubmit}
                            disabled={!status.canSubmit || isSubmitting}
                            className={status.canSubmit ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-4 w-4" />
                            )}
                            Submit Group Application
                        </Button>
                    )}
                </div>
            </div>

            {isLeader && !status.canSubmit && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                    <AlertCircle className="h-4 w-4" />
                    <span>Waiting for all members to complete their draft applications before submission is enabled.</span>
                </div>
            )}
        </div>
    );
}
