'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { groupService } from '@/services/group-service';
import { GroupResponse } from '@/types/group-types';
import { Button } from '@/components/ui/button';
import { Plus, Users, Loader2 } from 'lucide-react';
import { GroupDetailsDialog } from './group-details-dialog';
import { GroupList } from './group-list';
import { CreateGroupDialog } from './create-group-dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function GroupDashboard() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [myGroups, setMyGroups] = useState<GroupResponse[]>([]);
    const [searchResults, setSearchResults] = useState<GroupResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<GroupResponse | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const fetchMyGroups = async () => {
        try {
            const data = await groupService.getMyGroups();
            setMyGroups(data.groups || []);
        } catch (error) {
            console.error('Failed to fetch my groups:', error);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setHasSearched(true);
        try {
            const data = await groupService.searchGroups(searchQuery);
            setSearchResults(data.groups || []);
        } catch (error) {
            console.error('Failed to search groups:', error);
            toast({
                title: 'Search Failed',
                description: 'Could not search groups. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSearching(false);
        }
    };

    const refreshData = async () => {
        setIsLoading(true);
        await fetchMyGroups();
        setIsLoading(false);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleViewDetails = (group: GroupResponse) => {
        setSelectedGroup(group);
        setIsDetailsOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Group Lending</h2>
                    <p className="text-muted-foreground">
                        Manage your lending groups and members.
                    </p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Group
                </Button>
            </div>

            <Tabs defaultValue="my-groups" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="my-groups">My Groups</TabsTrigger>
                    <TabsTrigger value="search">Search Groups</TabsTrigger>
                </TabsList>

                <TabsContent value="my-groups" className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : myGroups.length > 0 ? (
                        <GroupList groups={myGroups} onRefresh={refreshData} onViewDetails={handleViewDetails} />
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                                <Users className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">No groups found</h3>
                            <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
                                You haven't joined or created any lending groups yet.
                            </p>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Your First Group
                            </Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="search" className="space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search by Group Name or Leader Name..."
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                            {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Search
                        </Button>
                    </div>

                    {isSearching ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : searchResults.length > 0 ? (
                        <GroupList groups={searchResults} onRefresh={refreshData} onViewDetails={handleViewDetails} />
                    ) : hasSearched ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No groups found matching "{searchQuery}".
                        </div>
                    ) : (
                        <div className="text-center py-12 border rounded-lg border-dashed bg-muted/20">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">Find a Lending Group</h3>
                            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                                Search for groups by their name or the leader's name to request membership.
                            </p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <CreateGroupDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSuccess={refreshData}
            />

            <GroupDetailsDialog
                group={selectedGroup}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onRefresh={refreshData}
            />
        </div>
    );
}
