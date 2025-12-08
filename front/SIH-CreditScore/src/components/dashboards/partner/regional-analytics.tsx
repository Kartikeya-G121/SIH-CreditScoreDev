'use client';

import { useState, useEffect } from 'react';
import { GeographicRiskMap } from '@/components/dashboards/admin/geographic-risk-map';
import { loanPortfolioService, PortfolioAnalyticsResponse } from '@/services/loan-portfolio-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RefreshCw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function RegionalAnalytics() {
    const { toast } = useToast();
    const [analytics, setAnalytics] = useState<PortfolioAnalyticsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const data = await loanPortfolioService.getPortfolioAnalytics();
            setAnalytics(data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load regional data',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading geographical data...</p>
                </div>
            </div>
        );
    }

    if (!analytics) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Regional Analytics</h2>
                    <p className="text-muted-foreground">
                        Geographic distribution of risk and portfolio performance
                    </p>
                </div>
                <Button variant="outline" onClick={loadData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <GeographicRiskMap data={analytics.statePerformance || []} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Performing States</CardTitle>
                        <CardDescription>Lowest NPA rates</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[...analytics.statePerformance]
                                .sort((a, b) => a.npaRate - b.npaRate)
                                .slice(0, 5)
                                .map((state, i) => (
                                    <div key={state.state} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                                {i + 1}
                                            </div>
                                            <span className="font-medium">{state.state}</span>
                                        </div>
                                        <span className="text-green-600 font-bold">{state.npaRate.toFixed(2)}% NPA</span>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>High Activity Regions</CardTitle>
                        <CardDescription>Highest loan volume</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[...analytics.statePerformance]
                                .sort((a, b) => b.totalAum - a.totalAum)
                                .slice(0, 5)
                                .map((state, i) => (
                                    <div key={state.state} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                                                {i + 1}
                                            </div>
                                            <span className="font-medium">{state.state}</span>
                                        </div>
                                        <span className="text-blue-600 font-bold">₹{(state.totalAum / 100000).toFixed(1)}L</span>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
