'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { loanApplicationService } from '@/services/loan-application-service';
import type { GroupResponse } from '@/types/group-types';
import { useToast } from '@/hooks/use-toast';

interface GroupSelectionStepProps {
    onGroupSelect: (groupId: number) => void;
    onBack: () => void;
}

export function GroupSelectionStep({ onGroupSelect, onBack }: GroupSelectionStepProps) {
    const { toast } = useToast();
    const [groups, setGroups] = useState<GroupResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                setIsLoading(true);
                const userGroups = await loanApplicationService.getUserGroups();
                setGroups(userGroups);
            } catch (error) {
                console.error('Failed to fetch groups:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to load your groups. Please try again.',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchGroups();
    }, [toast]);

    const handleSelectGroup = (groupId: number) => {
        setSelectedGroupId(groupId);
        // In a real app, we might check for active applications here before proceeding
        onGroupSelect(groupId);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading your groups...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Select a Group</h2>
                    <p className="text-muted-foreground">
                        Choose the Self Help Group you want to apply with.
                    </p>
                </div>
                <Button variant="outline" onClick={onBack}>
                    Back to Loan Type
                </Button>
            </div>

            {groups.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Groups Found</h3>
                        <p className="text-muted-foreground mb-6">
                            You are not a member of any Self Help Group yet.
                        </p>
                        <Button onClick={() => window.location.href = '/dashboard?tab=groups'}>
                            Join or Create a Group
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {groups.map((group) => (
                        <Card
                            key={group.groupId}
                            className={`cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${selectedGroupId === group.groupId ? 'border-primary ring-1 ring-primary' : ''}`}
                            onClick={() => handleSelectGroup(group.groupId)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="mb-2">
                                        ID: {group.groupId}
                                    </Badge>
                                    {group.isActive ? (
                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                                    ) : (
                                        <Badge variant="secondary">Inactive</Badge>
                                    )}
                                </div>
                                <CardTitle className="text-xl">{group.groupName}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {group.projectDescription}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Leader:</span>
                                        <span className="font-medium">{group.leaderName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Members:</span>
                                        <span className="font-medium">{group.memberCount} / {group.maxMembers}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Formed:</span>
                                        <span>{new Date(group.formationDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2">
                                <Button className="w-full" variant={selectedGroupId === group.groupId ? "default" : "secondary"}>
                                    {selectedGroupId === group.groupId ? (
                                        <>
                                            Selected <CheckCircle2 className="ml-2 h-4 w-4" />
                                        </>
                                    ) : (
                                        <>
                                            Select Group <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
