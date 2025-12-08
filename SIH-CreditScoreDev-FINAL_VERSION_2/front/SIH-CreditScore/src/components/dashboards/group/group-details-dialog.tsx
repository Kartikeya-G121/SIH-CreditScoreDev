'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { groupService } from '@/services/group-service';
import { GroupResponse, MemberResponse } from '@/types/group-types';
import { Loader2, User, UserCheck, UserX, LogOut, Trash2, Edit, Save } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface GroupDetailsDialogProps {
    group: GroupResponse | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRefresh: () => void;
}

const editGroupSchema = z.object({
    groupName: z.string().min(3, 'Group name must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    maxMembers: z.coerce.number().min(2).max(20),
});

export function GroupDetailsDialog({ group, open, onOpenChange, onRefresh }: GroupDetailsDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [members, setMembers] = useState<MemberResponse[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const isLeader = user?.id ? parseInt(user.id) === group?.createdByUserId : false;
    const currentMember = members.find(m => user?.id && m.userId === parseInt(user.id));
    const isMember = !!currentMember;
    const isPending = currentMember?.status === 'PENDING';

    const form = useForm<z.infer<typeof editGroupSchema>>({
        resolver: zodResolver(editGroupSchema),
        defaultValues: {
            groupName: '',
            description: '',
            maxMembers: 5,
        },
    });

    useEffect(() => {
        if (group && open) {
            fetchMembers();
            form.reset({
                groupName: group.groupName,
                description: group.projectDescription,
                maxMembers: group.maxMembers,
            });
            setIsEditing(false);
        }
    }, [group, open]);

    const fetchMembers = async () => {
        if (!group) return;
        try {
            setIsLoadingMembers(true);
            const response = await groupService.getGroupMembers(group.groupId);
            setMembers(response.members);
        } catch (error) {
            console.error('Failed to fetch members:', error);
        } finally {
            setIsLoadingMembers(false);
        }
    };

    const handleJoin = async () => {
        if (!group) return;
        try {
            setIsProcessing(true);
            await groupService.joinGroup(group.groupId);
            toast({ title: 'Success', description: 'Join request sent successfully.' });
            fetchMembers();
            onRefresh();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to join group.' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLeave = async () => {
        if (!group) return;
        try {
            setIsProcessing(true);
            await groupService.leaveGroup(group.groupId);
            toast({ title: 'Success', description: 'Left group successfully.' });
            onOpenChange(false);
            onRefresh();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to leave group.' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDisband = async () => {
        if (!group) return;
        if (!confirm('Are you sure you want to disband this group? This action cannot be undone.')) return;
        try {
            setIsProcessing(true);
            await groupService.disbandGroup(group.groupId);
            toast({ title: 'Success', description: 'Group disbanded successfully.' });
            onOpenChange(false);
            onRefresh();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to disband group.' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApprove = async (memberId: number) => {
        if (!group) return;
        try {
            await groupService.approveMember(group.groupId, memberId);
            toast({ title: 'Success', description: 'Member approved.' });
            fetchMembers();
            onRefresh(); // Update member count in list
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to approve member.' });
        }
    };

    const handleRemove = async (memberId: number) => {
        if (!group) return;
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await groupService.removeMember(group.groupId, memberId);
            toast({ title: 'Success', description: 'Member removed.' });
            fetchMembers();
            onRefresh();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove member.' });
        }
    };

    const onEditSubmit = async (values: z.infer<typeof editGroupSchema>) => {
        if (!group) return;
        try {
            setIsProcessing(true);
            await groupService.updateGroup(group.groupId, values);
            toast({ title: 'Success', description: 'Group updated successfully.' });
            setIsEditing(false);
            onRefresh();
            // Optimistically update local state if needed, but onRefresh should handle it
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update group.' });
        } finally {
            setIsProcessing(false);
        }
    };

    if (!group) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>{isEditing ? 'Edit Group' : group.groupName}</span>
                        {!isEditing && (
                            <Badge variant={group.isActive ? 'default' : 'secondary'}>
                                {group.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </Badge>
                        )}
                    </DialogTitle>
                    {!isEditing && (
                        <DialogDescription>
                            Created by {group.leaderName} • {members.length}/{group.maxMembers} members
                        </DialogDescription>
                    )}
                </DialogHeader>

                {isEditing ? (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4 py-4 overflow-y-auto px-1">
                            <FormField
                                control={form.control}
                                name="groupName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Group Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maxMembers"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Maximum Members</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button type="submit" disabled={isProcessing}>
                                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Form>
                ) : (
                    <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="info">Information</TabsTrigger>
                            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="flex-1 overflow-y-auto py-4 space-y-4">
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm text-muted-foreground">Description</h4>
                                <p className="text-sm">{group.projectDescription}</p>
                            </div>

                            {isLeader && (
                                <div className="pt-4 border-t flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit Group
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={handleDisband} disabled={isProcessing}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Disband Group
                                    </Button>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="members" className="flex-1 overflow-hidden flex flex-col">
                            <ScrollArea className="flex-1 pr-4">
                                {isLoadingMembers ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <div className="space-y-3 py-2">
                                        {members.map((member) => (
                                            <div key={member.memberId} className="flex items-center justify-between p-2 rounded-lg border bg-card">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>{member.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium leading-none">{member.userName}</p>
                                                        <p className="text-xs text-muted-foreground">{member.role}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {member.status === 'PENDING' && (
                                                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>
                                                    )}
                                                    {isLeader && user?.id && member.userId !== parseInt(user.id) && (
                                                        <>
                                                            {member.status === 'PENDING' && (
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleApprove(member.userId)}>
                                                                    <UserCheck className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleRemove(member.userId)}>
                                                                <UserX className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                )}

                {!isEditing && (
                    <DialogFooter className="pt-4 border-t">
                        {!isMember && (
                            <Button className="w-full sm:w-auto" onClick={handleJoin} disabled={isProcessing || members.length >= group.maxMembers}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                                Join Group
                            </Button>
                        )}
                        {isMember && !isLeader && (
                            <Button variant="destructive" className="w-full sm:w-auto" onClick={handleLeave} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                                Leave Group
                            </Button>
                        )}
                        {isPending && (
                            <p className="text-xs text-muted-foreground self-center">Your request is pending approval.</p>
                        )}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
