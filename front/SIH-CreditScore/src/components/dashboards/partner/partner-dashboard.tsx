'use client';

import React, { useState, useEffect } from 'react';
import {
    Map as MapIcon,
    FileText,
    Activity,
    Users,
    Shield,
    RefreshCw,
    Upload
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { applicationAnalyticsService, ApplicationAnalyticsResponse } from '@/services/application-analytics-service';
import { schemeService } from '@/services/scheme-service';
import { loanPortfolioService, SchemePerformanceStats } from '@/services/loan-portfolio-service';
import { useToast } from '@/hooks/use-toast';
import { BulkUploadDialog } from './bulk-upload-dialog';


export default function PartnerDashboard() {
    const { toast } = useToast();
    const [analytics, setAnalytics] = useState<ApplicationAnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSchemes, setActiveSchemes] = useState<number>(0);
    const [schemePerformance, setSchemePerformance] = useState<SchemePerformanceStats[]>([]);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);


    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);

            // Fetch all data in parallel
            const [analyticsData, schemesData, portfolioData] = await Promise.allSettled([
                applicationAnalyticsService.getAnalytics(),
                schemeService.getActiveSchemes(),
                loanPortfolioService.getPortfolioAnalytics(),
            ]);

            // Handle analytics data
            if (analyticsData.status === 'fulfilled') {
                setAnalytics(analyticsData.value);
            } else {
                console.error('Error loading analytics:', analyticsData.reason);
            }

            // Handle schemes data
            if (schemesData.status === 'fulfilled') {
                setActiveSchemes(schemesData.value.length);
            } else {
                console.error('Error loading schemes:', schemesData.reason);
            }

            // Handle portfolio data
            if (portfolioData.status === 'fulfilled') {
                // Sort by approval rate (calculated from totalAum or activeLoans) and take top 3
                const sortedSchemes = [...portfolioData.value.schemePerformance]
                    .filter(s => s.isActive)
                    .sort((a, b) => b.activeLoans - a.activeLoans)
                    .slice(0, 3);
                setSchemePerformance(sortedSchemes);
            } else {
                console.error('Error loading portfolio data:', portfolioData.reason);
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load dashboard data',
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Partner Dashboard
                </h2>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setIsUploadDialogOpen(true)}
                        variant="default"
                        className="flex items-center gap-2"
                    >
                        <Upload className="h-4 w-4" />
                        <span className="hidden sm:inline">Upload CSV</span>
                    </Button>
                    {analytics && (
                        <button
                            onClick={loadAnalytics}
                            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 dark:from-blue-950 dark:to-indigo-950 dark:border-blue-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Schemes</CardTitle>
                        <Shield className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                            {loading ? '...' : activeSchemes}
                        </div>
                        <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">Currently active</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 dark:from-emerald-950 dark:to-teal-950 dark:border-emerald-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
                        <FileText className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                            {loading ? '...' : analytics?.overallStats.totalApplications.toLocaleString() || '0'}
                        </div>
                        <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">All time</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100 dark:from-purple-950 dark:to-pink-950 dark:border-purple-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
                        <Activity className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                            {loading ? '...' : analytics?.overallStats.approvedCount.toLocaleString() || '0'}
                        </div>
                        <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-1">
                            {analytics ? `${((analytics.overallStats.approvedCount / analytics.overallStats.totalApplications) * 100).toFixed(1)}% approval rate` : 'Calculating...'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 dark:from-amber-950 dark:to-orange-950 dark:border-amber-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
                        <Users className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                            {loading ? '...' : (analytics ? analytics.overallStats.submittedCount + analytics.overallStats.scoringCount : '0')}
                        </div>
                        <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">Requires attention</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl">Application Status Distribution</CardTitle>
                        <CardDescription className="text-sm">Breakdown of applications by current status</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px] sm:h-[300px] lg:h-[350px]">
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
                        <CardTitle className="text-lg sm:text-xl">Scheme Performance</CardTitle>
                        <CardDescription className="text-sm">Top performing loan products</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center h-32">
                                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : schemePerformance.length > 0 ? (
                            <div className="space-y-3">
                                {schemePerformance.map((scheme, i) => {
                                    // Calculate approval percentage based on NPA rate (inverse)
                                    const approvalRate = Math.round((1 - scheme.npaRate / 100) * 100);
                                    return (
                                        <div key={scheme.schemeId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-blue-500' : 'bg-purple-500'}`} />
                                                <span className="font-medium text-xs sm:text-sm truncate" title={scheme.schemeName}>
                                                    {scheme.schemeName}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {scheme.activeLoans} loans
                                                </Badge>
                                                <Badge variant={approvalRate >= 85 ? 'default' : 'secondary'} className="text-xs">
                                                    {approvalRate}% Success
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-32 bg-slate-50 dark:bg-slate-900 rounded-md">
                                <p className="text-sm text-muted-foreground">No scheme data available</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bulk Upload Dialog */}
            <BulkUploadDialog
                open={isUploadDialogOpen}
                onOpenChange={setIsUploadDialogOpen}
            />
        </div>
    );
}
