'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Users, Shield, UserCheck, UserCog, RefreshCw } from 'lucide-react';
import { adminService, AdminStats } from '@/services/admin-service';
import { useToast } from '@/hooks/use-toast';
import { StatCard } from '@/components/shared/stat-card';
import AdvancedUserSearch from './advanced-user-search';

export default function UserManagement() {
    const { toast } = useToast();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoadingStats(true);
            const data = await adminService.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load user statistics.',
            });
        } finally {
            setLoadingStats(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">Manage users, roles, and permissions</p>
                </div>
                <button
                    onClick={fetchStats}
                    disabled={loadingStats}
                    className="flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-accent"
                >
                    <RefreshCw className={`h-4 w-4 ${loadingStats ? 'animate-spin' : ''}`} />
                    Refresh Stats
                </button>
            </div>

            {/* Statistics */}
            {loadingStats ? (
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </CardContent>
                </Card>
            ) : stats ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Users"
                        value={stats.totalUsers}
                        icon={<Users className="h-4 w-4" />}
                        description="All registered users"
                    />
                    <StatCard
                        title="Beneficiaries"
                        value={stats.beneficiaries}
                        icon={<UserCheck className="h-4 w-4" />}
                        description="Registered beneficiaries"
                    />
                    <StatCard
                        title="Loan Officers"
                        value={stats.loanOfficers}
                        icon={<UserCog className="h-4 w-4" />}
                        description="Active loan officers"
                    />
                    <StatCard
                        title="Admins"
                        value={stats.admins}
                        icon={<Shield className="h-4 w-4" />}
                        description="System administrators"
                    />
                </div>
            ) : null}

            {/* User Search & Management */}
            <AdvancedUserSearch onStatsUpdate={fetchStats} />
        </div>
    );
}
