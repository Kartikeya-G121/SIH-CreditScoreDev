'use client';

import React, { useState, useEffect } from 'react';
import {
    Map as MapIcon,
    FileText,
    Activity,
    Users,
    Shield,
    RefreshCw
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { applicationAnalyticsService, ApplicationAnalyticsResponse } from '@/services/application-analytics-service';
import { useToast } from '@/hooks/use-toast';

export default function PartnerDashboard() {
    const { toast } = useToast();
    const [analytics, setAnalytics] = useState<ApplicationAnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const data = await applicationAnalyticsService.getAnalytics();
            setAnalytics(data);
        } catch (error) {
            console.error('Error loading analytics:', error);
            toast({
                title: 'Error',
                description: 'Failed to load application analytics',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    // Prepare pie chart data
    const pieChartData = analytics ? [
        { name: 'Draft', value: analytics.overallStats.draftCount, color: '#94a3b8' },
        { name: 'Submitted', value: analytics.overallStats.submittedCount, color: '#3b82f6' },
        { name: 'Scoring', value: analytics.overallStats.scoringCount, color: '#f59e0b' },
        { name: 'Approved', value: analytics.overallStats.approvedCount, color: '#10b981' },
        { name: 'Rejected', value: analytics.overallStats.rejectedCount, color: '#ef4444' },
        { name: 'Sanctioned', value: analytics.overallStats.sanctionedCount, color: '#8b5cf6' },
    ].filter(item => item.value > 0) : [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Partner Dashboard
                </h2>
                {analytics && (
                    <button
                        onClick={loadAnalytics}
                        className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 dark:from-blue-950 dark:to-indigo-950 dark:border-blue-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Schemes</CardTitle>
                        <Shield className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">12</div>
                        <p className="text-xs text-blue-600/80 dark:text-blue-400/80">+2 new this month</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 dark:from-emerald-950 dark:to-teal-950 dark:border-emerald-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
                        <FileText className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                            {loading ? '...' : analytics?.overallStats.totalApplications.toLocaleString() || '0'}
                        </div>
                        <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">All time</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100 dark:from-purple-950 dark:to-pink-950 dark:border-purple-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
                        <Activity className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                            {loading ? '...' : analytics?.overallStats.approvedCount.toLocaleString() || '0'}
                        </div>
                        <p className="text-xs text-purple-600/80 dark:text-purple-400/80">
                            {analytics ? `${((analytics.overallStats.approvedCount / analytics.overallStats.totalApplications) * 100).toFixed(1)}% approval rate` : 'Calculating...'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 dark:from-amber-950 dark:to-orange-950 dark:border-amber-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
                        <Users className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                            {loading ? '...' : (analytics ? analytics.overallStats.submittedCount + analytics.overallStats.scoringCount : '0')}
                        </div>
                        <p className="text-xs text-amber-600/80 dark:text-amber-400/80">Requires attention</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Application Status Distribution</CardTitle>
                        <CardDescription>Breakdown of applications by current status</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : pieChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900 rounded-md">
                                <p className="text-muted-foreground">No application data available</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Scheme Performance</CardTitle>
                        <CardDescription>Top performing loan products</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {['Micro-Business Loan', 'Agri-Equipment', 'Education Plus'].map((scheme, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-green-500' : 'bg-blue-500'}`} />
                                        <span className="font-medium text-sm">{scheme}</span>
                                    </div>
                                    <Badge variant="outline">{90 - (i * 10)}% Approval</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
