'use client';

import { useState, useEffect } from 'react';
import { Users, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { loanApplicationService } from '@/services/loan-application-service';
import type { GroupResponse } from '@/types/group-types';
import type { ApplicationStatus } from '@/types/loan-application-types';

interface GroupSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectGroup: (groupId: number) => void;
}

export function GroupSelectionDialog({
    open,
    onOpenChange,
    onSelectGroup,
}: GroupSelectionDialogProps) {
    const [groups, setGroups] = useState<GroupResponse[]>([]);
    const [applicationStatuses, setApplicationStatuses] = useState<Map<number, ApplicationStatus>>(new Map());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            fetchGroupsAndStatuses();
        }
    }, [open]);

    const fetchGroupsAndStatuses = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const userGroups = await loanApplicationService.getUserGroups();
            setGroups(userGroups);

            // Check application status for each group
            const statusMap = new Map<number, ApplicationStatus>();
            await Promise.all(
                userGroups.map(async (group) => {
                    try {
                        const status = await loanApplicationService.getGroupApplicationStatus(group.groupId);
                        statusMap.set(group.groupId, status);
                    } catch (err) {
                        console.error(`Failed to get status for group ${group.groupId}:`, err);
                    }
                })
            );
            setApplicationStatuses(statusMap);
        } catch (err) {
            console.error('Failed to fetch groups:', err);
            setError('Failed to load your groups. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectGroup = (groupId: number) => {
        const status = applicationStatuses.get(groupId);
        if (status?.hasActiveApplication) {
            return; // Don't allow selection if there's an active application
        }
        onSelectGroup(groupId);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        Select a Group
                    </DialogTitle>
                    <DialogDescription>
                        Choose which group you want to apply for a loan with
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Loading your groups...</p>
                        </div>
                    ) : error ? (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : groups.length === 0 ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                You are not a member of any groups yet. Join or create a group to apply for a group loan.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">
                                You can only have one active loan application per group
                            </p>
                            {groups.map((group) => {
                                const status = applicationStatuses.get(group.groupId);
                                const hasActiveApp = status?.hasActiveApplication || false;

                                return (
                                    <Card
                                        key={group.groupId}
                                        className={`cursor-pointer transition-all ${hasActiveApp
                                                ? 'opacity-60 cursor-not-allowed'
                                                : 'hover:shadow-lg hover:border-primary'
                                            }`}
                                        onClick={() => !hasActiveApp && handleSelectGroup(group.groupId)}
                                    >
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg">{group.groupName}</CardTitle>
                                                    <CardDescription className="mt-1">
                                                        {group.memberCount} members
                                                    </CardDescription>
                                                </div>
                                                <div className="flex flex-col gap-2 items-end">
                                                    <Badge variant={group.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                                        {group.status}
                                                    </Badge>
                                                    {hasActiveApp && (
                                                        <Badge variant="outline" className="border-orange-500 text-orange-700 bg-orange-50">
                                                            <AlertCircle className="h-3 w-3 mr-1" />
                                                            Active Application
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        {group.description && (
                                            <CardContent>
                                                <p className="text-sm text-muted-foreground">{group.description}</p>
                                            </CardContent>
                                        )}
                                    </Card>
                                );
                            })}
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
