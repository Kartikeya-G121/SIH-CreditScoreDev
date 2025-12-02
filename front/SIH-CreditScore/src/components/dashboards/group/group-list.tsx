'use client';

import { GroupResponse } from '@/types/group-types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface GroupListProps {
    groups: GroupResponse[];
    onRefresh: () => void;
    onViewDetails: (group: GroupResponse) => void;
}

export function GroupList({ groups, onRefresh, onViewDetails }: GroupListProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
                <Card key={group.groupId} className="flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">{group.groupName}</CardTitle>
                            <Badge variant={group.isActive ? 'default' : 'secondary'}>
                                {group.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                            {group.projectDescription}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                            <User className="mr-2 h-4 w-4" />
                            Leader: {group.leaderName}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="mr-2 h-4 w-4" />
                            Members: {group.memberCount} / {group.maxMembers}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-2 h-4 w-4" />
                            Created: {format(new Date(group.createdAt), 'PPP')}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" variant="outline" onClick={() => onViewDetails(group)}>
                            View Details
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
